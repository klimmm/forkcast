// Fetch wrappers for every /api endpoint (see SPEC "REST API"). Each returns the
// unwrapped `data` of {ok, data}; failures throw ApiError(error) with .status and .detail.
// No side effects at import time.

export class ApiError extends Error {
  constructor(message, { status = 0, detail = '', path = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.path = path;
  }
}

/** '?a=1&b=x' from an object; null/undefined/''/false are dropped, true becomes 1. */
export function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    sp.set(k, v === true ? '1' : String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const enc = encodeURIComponent;

async function request(method, path, { query, body } = {}) {
  const url = path + qs(query);
  const init = { method, headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new ApiError('The Studio server is not reachable. Is `python forkcast/ui/server.py` still running?', {
      detail: String(e), path,
    });
  }
  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(`${method} ${path} returned HTTP ${res.status} that is not JSON`, {
      status: res.status, detail: text.slice(0, 2000), path,
    });
  }
  if (!res.ok || !payload || payload.ok !== true) {
    throw new ApiError(payload?.error || `${method} ${path} failed with HTTP ${res.status}`, {
      status: res.status, detail: payload?.detail || '', path,
    });
  }
  return payload.data;
}

const get = (path, query) => request('GET', path, { query });
const post = (path, body) => request('POST', path, { body: body ?? {} });
const del = (path) => request('DELETE', path);

// The job list has one poller, the header (app.js): it re-reads /api/jobs on every 'fss:jobs' event (job
// mutations send one) and every few seconds while jobs are active, and publishes each list as 'fss:joblist'.
/** Ask the header for a fresh job list now. */
export function jobsChanged() {
  globalThis.dispatchEvent?.(new Event('fss:jobs'));
}
/** app.js: hand the views a new job list ({jobs}) or the error that stopped it ({error}). */
export const publishJobs = (detail) => globalThis.dispatchEvent?.(new CustomEvent('fss:joblist', { detail }));
/** onList(jobs) with every published job list (one is requested now), onError(e) when listing fails → unsubscribe. */
export function watchJobs(onList, onError) {
  const fn = ({ detail }) => (detail.error ? onError?.(detail.error) : onList(detail.jobs));
  globalThis.addEventListener('fss:joblist', fn);
  jobsChanged();
  return () => globalThis.removeEventListener('fss:joblist', fn);
}

function memo(fn) {
  let p = null;
  const wrapped = ({ force = false } = {}) => {
    if (force || !p) p = fn().catch((e) => { p = null; throw e; });
    return p;
  };
  wrapped.clear = () => { p = null; };
  return wrapped;
}

// ---- meta / flags / presets ----
export const getMeta = memo(() => get('/api/meta'));
export const getFlags = memo(() => get('/api/flags'));
export const buildArgv = (values) => post('/api/flags/argv', { values: values || {} });
/** Paste a command: parseCommand({cmd:'python ml/solver/main.py --w 5'} | {argv:[...]}) → {values, ...}. */
export const parseCommand = (body) => post('/api/flags/parse', body);
export const listPresets = (season) => get('/api/presets', { season });
export async function savePreset({ name, description = '', values }) {
  const out = await post('/api/presets', { name, description, values });
  getFlags.clear();
  return out;
}
/** By slug (GET /api/presets): a name may hold '/', which the server unquotes before routing. */
export async function deletePreset(slug) {
  const out = await del(`/api/presets/${enc(slug)}`);
  getFlags.clear();
  return out;
}

// ---- data ----
export const getPlayers = ({ season, gw, pool, all } = {}) => get('/api/players', { season, gw, pool, all });
export const getPlayerHistory = (id, { season, pool } = {}) => get(`/api/players/${enc(id)}/history`, { season, pool });
export const getFixtures = ({ season, from, n } = {}) => get('/api/fixtures', { season, from, n });
export const getDashboard = ({ season, gw, pool } = {}) => get('/api/dashboard', { season, gw, pool });
export const getFreshness = ({ season, pool } = {}) => get('/api/freshness', { season, pool });
/** Drop the server's data memos and the solver's lru caches (after a data refresh) → {cleared}. */
export const invalidateData = () => post('/api/data/invalidate');

// ---- entry / team state ----
export const getEntry = (id, { season, gw, pool, refresh } = {}) => get(`/api/entry/${enc(id)}`, { season, gw, pool, refresh });
/** Entries with cached solver data, last viewed first → [{entry_id, season, manager, ...}]. */
export const getRecentEntries = ({ season } = {}) => get('/api/entries/recent', { season });
export const saveTeamState = (body) => post('/api/team-state', body);

// ---- jobs ----
export async function createJob({ kind, values = null, argv = null, label = '' }) {
  const out = await post('/api/jobs', { kind, values, argv, label });
  jobsChanged();
  return out;
}
export const listJobs = () => get('/api/jobs');
export const getJob = (id) => get(`/api/jobs/${enc(id)}`);
export const getJobLog = (id, offset = 0) => get(`/api/jobs/${enc(id)}/log`, { offset: offset || '0' });
export async function cancelJob(id) {
  const out = await post(`/api/jobs/${enc(id)}/cancel`);
  jobsChanged();
  return out;
}
export async function deleteJob(id) {
  const out = await del(`/api/jobs/${enc(id)}`);
  jobsChanged();
  return out;
}
export const jobHtmlUrl = (id) => `/api/jobs/${enc(id)}/html`;
export const diffJobs = (a, b) => get(`/api/jobs/${enc(a)}/diff/${enc(b)}`);
export const getBacktests = () => get('/api/backtests');

export const ACTIVE_STATUSES = new Set(['queued', 'running']);
export const isActive = (job) => ACTIVE_STATUSES.has(job?.status);
/** A Forkcast phone job (api/mobile.py: source 'phone'; older records only by their 'phone · ' label). */
export const isPhone = (job) => job?.source === 'phone' || /^phone · /.test(job?.label || '');

/** Resolves after `ms`, or at once when `signal` aborts. */
export function sleep(ms, signal) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

/**
 * Follow a job until it finishes, streaming its log by offset (status only with withLog false).
 * onUpdate({job, text, log, offset, done}) fires every tick (`text` = the new chunk, `log` = everything so far).
 * Resolves {job, result, log} once the job is done/error/cancelled, or null if `signal` aborts first.
 * Transient fetch errors are retried; it rejects at once on a 404 and after 5 consecutive failures.
 */
export async function pollJob(id, onUpdate, { interval = 1000, signal, withLog = true } = {}) {
  let offset = 0;
  let log = '';
  let failures = 0;
  while (!signal?.aborted) {
    try {
      const [chunk, info] = await Promise.all([withLog ? getJobLog(id, offset) : null, getJob(id)]);
      failures = 0;
      if (signal?.aborted) return null;
      const text = chunk?.text || '';
      log += text;
      offset = chunk?.offset ?? offset + text.length;
      const job = info?.job ?? info;
      const done = !isActive(job);
      onUpdate?.({ job, text, log, offset, done });
      if (done && (chunk?.done || !text)) {
        jobsChanged();
        return { job, result: info?.result ?? null, log };
      }
      // A finished job may still have unread log: loop again without waiting.
      if (!done) await sleep(interval, signal);
    } catch (e) {
      if (e.status === 404 || ++failures >= 5) throw e;
      await sleep(interval * 2, signal);
    }
  }
  return null;
}
