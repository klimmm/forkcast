// Forkcast's API client (static/m/). Every call goes through request(): this browser's anonymous client id as
// `X-Forkcast-Client` (ACCESS_V2: it only keeps plan memory and quotas apart, it grants nothing), the
// {ok, data} envelope unwrapped, and a timeout, so a server that went away reads as "can't reach" instead of
// a hung spinner. Solves poll every 700 ms and a newer solve in the same slot supersedes the older one (§7.4).
// The last bundle is kept as an offline snapshot, with the plan memory saved since mirrored into it.
// No side effects at import time.
//
// Errors are ApiError (../api.js) with .status (HTTP, 0 when none) and .code:
//   'unreachable'  no answer (network down, server stopped)      'timeout'  no answer in time
//   'http'         any other failure, with the server's message (429: busy, 403: not available here)
//   'aborted'      the caller's signal aborted it
// plain(err, {entry}) turns any of them into the app's one-line copy (§5.1, §7.9).

import { ApiError, qs, enc, sleep } from '../api.js';

// ---------------------------------------------------------------- storage (try/catch: private mode, quota)

const KEYS = { client: 'fc:client', recent: 'fc:recent', snapshot: 'fc:snapshot' };

export const local = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
      return true;
    } catch { return false; }
  },
  json(k) { try { return JSON.parse(local.get(k)); } catch { return null; } },
  /** The keys starting with `prefix` (sign-out clears one team's: app.js signOut). */
  keys(prefix = '') {
    try { return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((k) => k?.startsWith(prefix)); } catch { return []; }
  },
};

// ---------------------------------------------------------------- who is asking

const CLIENT_ID = /^[0-9a-f]{32}$/;
let clientMemo = null;  // the id when storage is unavailable: it then lasts as long as the page

/** This browser's anonymous id: 128 random bits as hex, made once and kept in localStorage (fc:client). */
export function clientId() {
  const kept = local.get(KEYS.client);
  if (kept && CLIENT_ID.test(kept)) return kept;
  if (!clientMemo) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);  // also outside a secure context (plain-HTTP LAN), unlike randomUUID
    clientMemo = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  local.set(KEYS.client, clientMemo);
  return clientMemo;
}

/** This computer's own host names (a page served on one is this computer's browser, ACCESS_V2). */
export const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

/**
 * How this page is served, for the You sheet's dev entries: {local, share: [url]}. `local` is the
 * server's own verdict (ACCESS_V2: loopback socket AND loopback Host, so a tunnel is remote) from GET
 * /api/meta, and `share` the addresses another device opens Forkcast at (only with --lan or --public).
 * A server that does not report it: local by the page's host name, nothing to share.
 */
export async function access() {
  const fallback = { local: LOOPBACK.has(globalThis.location?.hostname ?? ''), share: [] };
  let meta;
  try { meta = await getMeta(); } catch { return fallback; }
  return readAccess(meta, fallback);
}

/** A front end's release name as the server reports it ("v1.3.1"), else null (the tree's own, unreleased). */
const releaseName = (v) => (typeof v === 'string' && /^v\d+(\.\d+)*$/.test(v) ? v : null);

/** The release the server serves now (server.py's X-Forkcast-Release on every reply, read off a HEAD of the page):
 *  null for the tree's own front end, or when the server doesn't answer within RELEASE_TIMEOUT_MS. */
export async function servedRelease() {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), RELEASE_TIMEOUT_MS);
  try {
    const r = await fetch('/m/', { method: 'HEAD', cache: 'no-store', signal: stop.signal });
    return releaseName(r.headers.get('X-Forkcast-Release'));
  } catch { return null; } finally { clearTimeout(timer); }
}
const RELEASE_TIMEOUT_MS = 3000;

/**
 * GET /api/meta's `access` (server.py, ACCESS_V2) → {local, mode, share, release}. Read tolerantly: `local` (boolean)
 * and `mode` ('local' | 'lan' | 'public') when sent; `share` = the http(s) addresses in `urls`, kept only
 * for a local page of a server in --lan or --public mode (nothing dev-related reaches a remote page); `release` the
 * front end's ("v1.3.1"; null: the tree's own, or not reported), You → Status's Version.
 */
export function readAccess(meta, fallback = { local: false, share: [] }) {
  const a = meta?.access;
  if (!a || typeof a !== 'object') return { ...fallback, mode: null, release: null };
  const isLocal = typeof a.local === 'boolean' ? a.local : fallback.local;
  const mode = typeof a.mode === 'string' ? a.mode : null;
  const urls = [a.urls].flat().filter((u) => typeof u === 'string' && /^https?:\/\//.test(u));
  return { local: isLocal, mode, share: isLocal && (mode === 'lan' || mode === 'public') ? [...new Set(urls)] : [], release: releaseName(a.release) };
}

// ---------------------------------------------------------------- recent team IDs (this browser only)

const RECENT_MAX = 6;
const isEntry = (v) => /^\d{1,10}$/.test(String(v ?? ''));

/** Team IDs opened in this browser, newest first: [{entry_id, team_name, manager, total}] (never from the server:
 *  it would show other people's IDs, ACCESS_V2; total: the team's points when it was last opened, the Recent row's). */
export const recent = {
  list() {
    const xs = local.json(KEYS.recent);
    return Array.isArray(xs) ? xs.filter((r) => isEntry(r?.entry_id)) : [];
  },
  add(entry, { team_name = null, manager = null, total = null } = {}) {
    if (!isEntry(entry)) return;
    const id = String(entry);
    const pts = total != null && Number.isFinite(Number(total)) ? Number(total) : null;
    const row = { entry_id: id, team_name: team_name || null, manager: manager || null, total: pts };
    local.set(KEYS.recent, JSON.stringify([row, ...recent.list().filter((r) => String(r.entry_id) !== id)].slice(0, RECENT_MAX)));
  },
};

// ---------------------------------------------------------------- transport

export const TIMEOUT_MS = 10000;
export const BUNDLE_TIMEOUT_MS = 30000;  // a cold bundle can wait on the entry fetch and the seed matrix

function fail(code, message, { status = 0, detail = '', path = '' } = {}) {
  const e = new ApiError(message, { status, detail, path });
  e.code = code;
  return e;
}

/** One /api call → its unwrapped `data`. query drops null/''/false (qs); body is sent as JSON. */
export async function request(method, path, { query, body, timeout = TIMEOUT_MS, signal } = {}) {
  const headers = { Accept: 'application/json', 'X-Forkcast-Client': clientId() };
  const init = { method, headers, cache: 'no-store' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeout);
  const forward = () => ctrl.abort();
  if (signal?.aborted) ctrl.abort();
  signal?.addEventListener('abort', forward, { once: true });
  init.signal = ctrl.signal;
  let res, text;
  try {
    res = await fetch(path + qs(query), init);
    text = await res.text();
  } catch (e) {
    if (signal?.aborted) throw fail('aborted', 'Cancelled', { path });
    throw timedOut
      ? fail('timeout', BUSY, { detail: `no answer in ${timeout / 1000} s`, path })
      : fail('unreachable', UNREACHABLE, { detail: String(e), path });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forward);
  }
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw fail('http', `${method} ${path} returned HTTP ${res.status} that is not JSON`, { status: res.status, detail: text.slice(0, 500), path });
  }
  if (!res.ok || payload?.ok !== true) {
    throw fail('http', payload?.error || `${method} ${path} failed with HTTP ${res.status}`, { status: res.status, detail: payload?.detail || '', path });
  }
  return payload.data;
}

const get = (path, query, opts) => request('GET', path, { ...opts, query });
const post = (path, body, opts) => request('POST', path, { ...opts, body: body ?? {} });

// ---------------------------------------------------------------- endpoints

export const getMeta = () => get('/api/meta');
/**
 * The phone's world for one entry (§7.4; api/mobile.py bundle). refresh → refetch the entry and re-bake;
 * have = the data version already held → the reply leaves players and seeds null (they only change with it); its
 * prices block (FPL's price projections read since the snapshot, calls.withPrices) comes every time. w = the plan's
 * weeks (You → Plan ahead, calls.planWeeks; none: the server's longest).
 */
export const getBundle = (entry, { refresh, have, hc, w, signal } = {}) =>
  get('/api/m/bundle', { entry, refresh, have, hc, w }, { timeout: BUNDLE_TIMEOUT_MS, signal });
/** The per-run matrix for players outside the bundle → {ids, gws, runs, f32} (engine.decodeSeeds reads it), on the
 *  real-points scale of `entry`'s bundle (F15b: the plan service pins one scale per data version). */
export const getSeeds = ({ gw, ids, entry }) => get('/api/m/seeds', { gw, ids: [...ids].join(','), entry });
/** The Player sheet's on-disk half (api/card.py): last matches, per-90 peers, opponents' xG, price and ownership at the
 *  season's start, other competitions; `now` is the bundle row's price, ownership, status and preview. */
export const getPlayer = ({ id, entry, vs }) => get('/api/m/player', { id, entry, vs });
/** About Forkcast's live table (api/mobile.py scouts): this season's Fresh 15 entry against the scouts, each finished GW. */
export const getScouts = () => get('/api/m/scouts');
/** Plan memory and the ticket, one document per (entry, gw) (§7.4 PUT /api/m/memory) → the saved document,
 *  which is also mirrored into the offline snapshot so a launch without the server shows the latest plan. */
export async function putMemory(doc) {
  const saved = await request('PUT', '/api/m/memory', { body: doc });
  mirrorMemory(saved);
  return saved;
}

// ---------------------------------------------------------------- solves (§7.4)

export const SOLVE_POLL_MS = 700;
const FINAL = new Set(['done', 'error', 'cancelled']);
/** The plan service keeps one user and one speculative solve in flight per client and supersedes the older
 *  (api/mobile.py solve_post, PURPOSES), so a solve's default slot is its purpose's class. 'chipprep' (F14: a chip
 *  prepared with your rules in the background), 'pair' (the suggested plans' fork solves: ahead.js forkPump) and 'pairnext' (the next
 *  week's, prepared in the background: ahead.js prepNext) are speculative, and the service never counts them in its hourly quota. */
export const SOLVE_CLASS = { heal: 'user', chip: 'user', cash: 'user', wish: 'spec', speculative: 'spec', chipprep: 'spec', pair: 'spec', pairnext: 'spec' };
const inflight = new Map();  // slot → {key, ctrl, superseded, purpose}
/** Whether a solve of this browser's is in flight in `slot` ('user' | 'spec'): a background ask (Ahead's options road,
 *  its chip preparations) waits for a free slot instead of superseding a Wish solve someone is looking at. */
export const slotBusy = (slot) => inflight.has(slot);
/** The purpose of the solve in flight in `slot`, or null: a suggested plan's fork solve (ahead.js forkPump, PAIR_TAKES)
 *  takes the slot from a chip preparation (its row is what you are looking at), never from a Wish solve. */
export const slotHolder = (slot) => inflight.get(slot)?.purpose ?? null;
const freed = new Map();  // slot → [resolve] of whenFree
/** Resolves once no solve of this browser's is in flight in `slot` (at once when none is): a background ask that waits
 *  for the slot (a suggested plan's fork solve behind a Wish solve: forkPump) asks the moment it frees, not on a timer. A solve
 *  superseded in the slot hands it straight to the newer one: the slot stays busy. */
export function whenFree(slot) {
  if (!inflight.has(slot)) return Promise.resolve();
  return new Promise((res) => { if (!freed.has(slot)) freed.set(slot, []); freed.get(slot).push(res); });
}

/** DELETE /api/m/solve/<key>. */
export const cancelSolve = (key) => request('DELETE', `/api/m/solve/${enc(key)}`);

/**
 * solve({entry, purpose, values, lane}, {slot, onUpdate, signal}) → Promise<SolveResult> with .cancel().
 * `values` is engine.solveValues() output; the plan service whitelists it. `lane` (a pair ask only, 1..meta.pair_lanes
 * − 1, in a slot of its own): the service holds it beside the speculative slot's (api/mobile.py PAIR_LANES). A newer solve in the same slot
 * (default SOLVE_CLASS[purpose]: 'user' | 'spec') stops polling this one and sends `supersedes: <its key>`,
 * so the service drops it; the service also supersedes by class on its own. onUpdate(status)
 * gets {key, state: 'cached'|'queued'|'running'|…, position, road} as it changes. Resolves
 *   {key, state: 'done', road}                 the Road (§7.4)
 *   {key, state: 'error', error: {code, plain}} the service's plain-words error (§7.9)
 *   {key, state: 'cancelled'|'superseded'}     cancel(), signal, or a newer solve in the slot
 * and rejects only when the server can't be reached (code 'unreachable' / 'timeout') or refuses the request.
 */
export function solve({ entry, purpose, values, lane = 0 }, { slot = SOLVE_CLASS[purpose] ?? purpose, onUpdate, signal } = {}) {
  const prev = inflight.get(slot);
  if (prev) { prev.superseded = true; prev.ctrl.abort(); }
  const mine = { key: null, ctrl: new AbortController(), superseded: false, purpose };
  inflight.set(slot, mine);
  if (signal?.aborted) mine.ctrl.abort();
  signal?.addEventListener('abort', () => mine.ctrl.abort(), { once: true });
  const stopped = () => {
    // a superseded job is cancelled by the newer request's `supersedes`; a plain cancel deletes it here
    if (mine.key && !mine.superseded) cancelSolve(mine.key).catch(() => {});
    return { key: mine.key, state: mine.superseded ? 'superseded' : 'cancelled', road: null, error: null };
  };
  const run = async () => {
    const sig = mine.ctrl.signal;
    try {
      let s = await post('/api/m/solve', { entry, purpose, values, supersedes: prev?.key ?? null, ...(lane ? { lane } : {}) }, { signal: sig });
      mine.key = s?.key ?? null;
      onUpdate?.(s);
      let misses = 0;
      while (!s?.road && !FINAL.has(s?.state)) {
        await sleep(SOLVE_POLL_MS, sig);
        if (sig.aborted) return stopped();
        try {
          s = { key: mine.key, ...(await get(`/api/m/solve/${enc(mine.key)}`, null, { signal: sig })) };
          misses = 0;
          onUpdate?.(s);
        } catch (e) {
          if (sig.aborted) return stopped();
          if (!(e.code === 'unreachable' || e.code === 'timeout') || ++misses >= 5) throw e;
        }
      }
      return { key: mine.key, state: s.road ? 'done' : s.state, road: s.road ?? null, error: s.error ?? null };
    } catch (e) {
      if (sig.aborted) return stopped();
      throw e;
    } finally {
      if (inflight.get(slot) === mine) {
        inflight.delete(slot);
        const waiting = freed.get(slot);
        freed.delete(slot);
        waiting?.forEach((f) => f());
      }
    }
  };
  const p = run();
  p.cancel = () => mine.ctrl.abort();
  return p;
}

// ---------------------------------------------------------------- offline snapshot (§10.4)

/** Keep the last bundle (raw, as received) so the app can still show the plan when the server is away. */
export function saveSnapshot(entry, bundle) {
  return local.set(KEYS.snapshot, JSON.stringify({ entry: String(entry), at: Date.now(), bundle }));
}
/** {entry, at (ms), bundle} for this entry, or null. */
export function loadSnapshot(entry) {
  const s = local.json(KEYS.snapshot);
  return s && s.bundle && String(s.entry) === String(entry) ? s : null;
}
/** A saved memory document replaces the snapshot's for its (entry, gw): the snapshot shows the plan as saved. */
function mirrorMemory(doc) {
  const s = loadSnapshot(doc?.entry);
  if (!s || Number(s.bundle.meta?.gw) !== Number(doc.gw)) return;
  local.set(KEYS.snapshot, JSON.stringify({ ...s, bundle: { ...s.bundle, memory: doc } }));
}

// ---------------------------------------------------------------- copy

// A10 (the fix pass): the server away says so plainly; nothing claims "your plan is unchanged" (a new user has none)
const UNREACHABLE = "Forkcast can't reach its server. Try again in a minute.";
const BUSY = 'Busy right now. Try again in a minute.';  // ACCESS_V2 quotas: the server's 429
/** Any other error: one human sentence; the technical message goes to the console (review #4). */
const SERVER_ERROR = "Something went wrong on Forkcast's side. Try again in a minute.";
/** A10: the answers that mean Forkcast's server can't serve right now (no answer, a timeout, or a 503 / 504 from
 *  in front of it): the app is off line until one works (app.js loader), and its copy is UNREACHABLE. */
export const isDown = (err) => !!err && (err.code === 'unreachable' || err.code === 'timeout' || err.status === 503 || err.status === 504);
/** B41: an isDown failure turns the app off line only after another just before it (misses: the failures in a row
 *  before this one) or after an ordinary call's whole wait without an answer (TIMEOUT_MS, 10 s): one lost request
 *  keeps the last good state (no banner, edits on) until the loader's next try. */
export const offlineNow = (misses, waitedMs) => misses >= 1 || waitedMs >= TIMEOUT_MS;

/** The one-line copy for an error (§5.1 Connect errors, §7.9). */
export function plain(err, { entry } = {}) {
  if (!err) return '';
  // a server that answers slowly is busy, not away (the reviews, 2026-10-11: a slow first load read "can't reach its
  // server"): a request that ran out of time, or a 504 in front of it; it is still off line by B41's rule (isDown)
  if (err.code === 'timeout' || err.status === 504) return BUSY;
  if (isDown(err)) return UNREACHABLE;
  if (err.status === 429) return BUSY;
  if (err.status === 404 && entry != null && /entry/i.test(err.message || '')) return `No FPL team with ID ${entry}. Check the number in your FPL web address.`;
  if (err.status === 502) return "FPL didn't answer. Try again in a minute.";
  console.warn('Forkcast:', err.message || String(err), err.detail || '');
  return SERVER_ERROR;
}
