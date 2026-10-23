// Forkcast shell (static/m/index.html): hash router, shared store, sheet manager, the Connect screen, the
// bundle loader with its state banner, and the first load's progress line (IPHONE_DESIGN §4, §5.1, §7.9, §10,
// DESIGN_V2 §3 Connect;
// access per ACCESS_V2: no pairing, opening the page and typing a Team ID is the whole onboarding). Ahead is the
// app's one screen (FOLLOWUPS F10: no tab bar; #/ahead?gw=8 is canonical, and #/week or a bare #/ lands there);
// the screen and the sheets are separate modules that plug in as below.
//
// ================================================================ SCREEN MODULE CONTRACT
// static/js/m/ahead.js (Ahead):
//   export function mount(el, ctx) → handle | void
//   export const css = '/css/…'                optional; the shell links it once, before the first mount
//   el      the screen's <section class="m-screen">, empty; the screen owns its children. It scrolls (the
//           shell pads it for the safe area). Put <div data-banner-slot></div> under the header: the shell
//           keeps its state banner there (else it goes first in el).
//   handle  {update?(why), show?(), hide?(), unmount?()} — update is called with why = 'bundle' (a new
//           bundle or a baking step), 'conn' (connection state changed); show once it is laid out;
//           unmount before the shell drops the screen (a team switch, or a re-mount: without update, the shell
//           re-mounts on 'bundle': unmount, el emptied, mount called again).
//   mount is called once a bundle exists (any state: the screen draws its own baking/skeleton state from
//   ctx.bundle.state and ctx.bundle.bake). Shared state (the selected GW…) goes through ctx.store.
//
// SHEET MODULES static/js/m/sheets/<name>.js (you, why, player, replace, wish, chips, about):
//   export function open(ctx, ...args) → sheet      opened with ctx.openSheet(name, ...args)
//   They build with ctx.sheets.open(); the route #/player/<id> calls openSheet('player', id).
//
// ctx (one live object; its getters always return the current values)
//   bundle     GET /api/m/bundle data (§7.4 shape) or null. One change: while its roads are from an older data
//              version (meta.roads_version ≠ version: re-baking), their weeks lose `pred`, so every score of
//              them (deltas, verdicts, ≈) uses today's forecast like the run votes do (PC-3: one forecast)
//   data       derived from bundle (null with it):
//                {rows, byId: Map(id → player row object), players: {horizon: xpGws, players: rows}
//                 (an /api/players-shaped payload for engine/pitch), base (engine `base`: {season,
//                 entry_id, gw, squad: [player row + sell_price, purchase_price], bank, ft,
//                 chips_available, chips_used, horizon: xpGws}), lineup ({xi, bench, captain, vice}
//                 now: the entry's FPL picks when the bundle has them, else engine.bestXI for gw),
//                 gw (next deadline GW), horizon ([gw…], the plan's weeks: You → Plan ahead), reach ([gw…gw+3],
//                 the longest plan's), xpGws ([gw…forecast_edge], the GWs row.xp covers), noise, seeds
//                 (engine.decodeSeeds(bundle.seeds) or null), receivedAt (ms)}
//   store      shared store: get(key), set(key, value) | set({k: v}), on(key, fn(value, prev)) → off,
//              persist(key, fallback) (kept in localStorage as fc:s:<key>). Shell keys:
//                entry  connected team ID (string)
//                gw     selected GW (#/ahead?gw= sets it; an address without one is GW A, the next deadline)
//                conn   {state: 'ok'|'baking'|'stale'|'updating'|'offline-data'|'offline', at (ms this
//                       phone first got the plan it shows), bake: {done, total} | null, error | null}.
//                       bundle.state 'offline-data' = no next GW (pre-season / season over): no entry,
//                       players or roads; the screen says "No deadline coming up".
//   api        static/js/m/api.js (request, getBundle, solve with 700 ms polling, putMemory, plain …)
//   sheets     open({title, sub, detent: 'small'|'medium'|'large', detents, build(body, sheet),
//              onClose, label, cls, close: true, fit: false}) → sheet {el, body, detent, setDetent(d), close()};
//              closeTop(), closeAll(), depth(), top(), afterPop(fn). Never more than 2 deep: a third replaces the top
//              one. Each is a history entry: Back closes it (B45). No sheet is aria-modal: while one is up the page and
//              the sheets under it are inert (B48; the plan sheet's live and anchored sheets went with it: review3
//              A14). fit (N9): the medium detent no taller than the content, so a short sheet leaves the page above it
//              in view
//   navigate(name, params, {replace, top})   'ahead' ({gw}) | 'player' ({id}); top: Ahead at its top (default: !replace)
//   openSheet(name, ...args)            lazy-load sheets/<name>.js and call its open(ctx, ...args)
//   engine     static/js/plan/engine.js      calls   static/js/m/calls.js
//   kits       static/js/plan/kits.js        pitch   static/js/plan/pitch.js (mountPitch for phones)
//   ui         static/js/ui.js (h, svg, fmt, toast …; toasts are restyled for the phone by m.css)
//   odometer(el, text, {neg})           set el's digits to `text` (m.css .m-odo; no roll: DESIGN_V2 §2 Motion)
//   status()   {tone: 'fresh'|'amber'|'none', text}: the avatar dot (fresh, amber stale or updating, empty
//              when Forkcast can't be reached)
//   refresh({hard}) → Promise<bundle|null>   re-fetch the bundle (hard = ?refresh=1: refetch the entry and
//                                       re-bake); failures show as the banner or a toast, never reject
//   connect(entry)                      switch team: the first load for that ID
//   signOut() → {name} | null           F6b: this device forgets the team (its entry and local mirror; the
//                                       server's plan memory stays, the recent chips keep it) and shows Connect;
//                                       the toast's Undo signs straight back in
//   teamPicker(opts)                    ./picker.js teamPicker(ctx, opts): the one team picker (name search, ID,
//                                       the Recent list) Connect and the Switch team sheet share (F6)
//   weeks() → n | null · setWeeks(n)    You → Plan ahead: the plan's weeks asked for this team (weeksOf), and a new
//                                       pick (kept per team in this browser, the bundle asked for it at once)
//   reveal     true while the first mount after Connect's first load runs (read it inside mount)
//   (local vs remote, for dev-only entries: api.access(), the server's verdict)

import * as ui from '../ui.js';
import { qs } from '../api.js';
import * as api from './api.js';
import * as calls from './calls.js';
import * as engine from '../plan/engine.js';
import * as kits from '../plan/kits.js';
import * as pitch from '../plan/pitch.js';
import { teamPicker, readId, COPY as PICK } from './picker.js';
import { release as releaseMemory, FORGET_MS, USED } from './memory.js';

const { h, fmt, fill } = ui;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const range = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b >= a ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : []);
const hhmm = (ms) => (Number.isFinite(ms) ? new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—');
const SCREEN = 'ahead';  // the one screen (F10)

// ================================================================ store

function createStore(initial) {
  const state = { ...initial };
  const subs = new Map();
  const saved = new Set();
  const store = {
    get: (k) => state[k],
    set(k, v) {
      if (k && typeof k === 'object') { for (const [a, b] of Object.entries(k)) store.set(a, b); return; }
      if (Object.is(state[k], v)) return;
      const prev = state[k];
      state[k] = v;
      if (saved.has(k)) api.local.set(`fc:s:${k}`, v == null ? null : JSON.stringify(v));
      for (const fn of [...(subs.get(k) || [])]) fn(v, prev);
    },
    on(k, fn) {
      if (!subs.has(k)) subs.set(k, new Set());
      subs.get(k).add(fn);
      return () => subs.get(k)?.delete(fn);
    },
    /** Keep `k` in localStorage (fc:s:<k>); loads the saved value now (else `fallback`). */
    persist(k, fallback) {
      saved.add(k);
      const v = api.local.json(`fc:s:${k}`);
      state[k] = v ?? state[k] ?? fallback;
      return state[k];
    },
  };
  return store;
}

const store = createStore({ bundle: null, data: null, gw: null, conn: { state: 'ok', at: NaN, bake: null, error: null } });
store.persist('entry', null);

// ================================================================ derived bundle data

function lineupNow(entry, data) {
  if (Array.isArray(entry?.xi) && entry.xi.length === 11) {
    return { xi: entry.xi.map(Number), bench: (entry.bench || []).map(Number), captain: entry.captain, vice: entry.vice };
  }
  const xpOf = (id) => pitch.xpAt(data.byId.get(Number(id)), data.gw, data.xpGws) ?? 0;
  const posOf = (id) => ui.posName(data.byId.get(Number(id))?.pos);
  const { xi, bench } = engine.bestXI(data.base.squad.map((s) => s.id), xpOf, posOf);
  const ranked = [...xi].sort((a, b) => xpOf(b) - xpOf(a));
  return { xi, bench, captain: ranked[0] ?? null, vice: ranked[1] ?? null };
}

/** Your FPL team as FPL has it, for the pitch to mark where the plan's GW A differs (ahead.js renderPitch → pitch.js
 *  fplMarks; the review of 2026-10-08): the bundle's entry picks (mobile.py bundle: api/entry.py's xi / bench / captain /
 *  vice, FPL's positions 1–11 and 12–15 in order and its is_captain / is_vice_captain, from the last deadline's picks),
 *  or GW gw's own once FPL has published them after its deadline (entry.published, mobile.py _published: rare, since
 *  the bundle then plans from the GW after with FPL's team after gw as the entry, live_week). Never lineupNow's
 *  stand-in (a best XI of the squad when the entry has none): null then, so nothing is marked. */
function fplTeam(e, gw) {
  const t = e?.published?.gw === gw ? e.published : e;
  if (!Array.isArray(t?.xi) || t.xi.length !== 11) return null;
  const id = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
  return { xi: t.xi.map(Number), bench: (t.bench || []).map(Number), captain: id(t.captain), vice: id(t.vice) };
}

/** The planned GWs of a bundle's meta: meta.horizon, else GW A and the three after it. */
const horizonOf = (m = {}) => (Array.isArray(m.horizon) ? m.horizon.map(Number) : range(Number(m.gw), Number(m.gw) + 3));
/** The GWs the longest plan reaches (meta.reach; a server from before plan lengths: the planned ones). */
const reachOf = (m = {}) => (Array.isArray(m.reach) ? m.reach.map(Number) : horizonOf(m));

/** You → Plan ahead (the user, 2026-10-14): the plan's weeks this browser picked for team `entry`, kept per team here
 *  (localStorage: the bundle request needs it before plan memory, which comes inside the bundle, is known). */
const HORIZON_KEY = (entry) => `fc:horizon:${entry}`;
/** The plan's weeks to ask team `entry`'s bundle for: the pick, as bundle b's locks and reach allow it (calls.planWeeks;
 *  the server falls back the same way); null before both a pick and a bundle (the server's own, its longest). */
const weeksOf = (entry, b = store.get('bundle')) => calls.planWeeks(api.local.get(HORIZON_KEY(entry)), b?.meta?.locked, b?.meta ? reachOf(b.meta).length : null);

/** The plan's progress in one line (Connect's first load and the baking banner, DESIGN_V2 §6): "Planning GW6–9 · ~1 min
 *  left" (calls.planEta; no count of the roads: the user, 2026-10-13, "users not familiar with back end"), "Planning
 *  GW6–9" before any road is done; "Planning…" before the GWs are known. How far: the bar (etaBar). */
function planning(gws, bake) {
  if (!gws?.length) return 'Planning…';
  const e = calls.planEta(bake);
  return `Planning ${calls.COPY.span(gws)}${e.left == null ? '' : ` · ${calls.leftText(e)}`}`;
}

/** A bake's bar (`tag`: the banner's 'span.m-banner-bar', first load's 'div.m-bar'; `full`: done): its share by time
 *  (calls.planShare; the user, 2026-10-13: "a smooth progress bar based on eta"), drawn again every second while one is
 *  on the page and eased over that second (m.css .m-eta: a 1 s linear width), so it moves on its own between bundles; a
 *  sweep while nothing is estimated yet (no road done). */
let etaTimer = null;
function etaBar(tag, bake, full = false) {
  const i = h('i.m-eta');
  Object.assign(i, { _bake: bake, _full: full });
  paintEta(i);
  etaTimer ??= setInterval(() => {
    const bars = document.querySelectorAll('i.m-eta');
    if (!bars.length) { clearInterval(etaTimer); etaTimer = null; }
    bars.forEach(paintEta);
  }, 1000);
  return h(tag, { 'aria-hidden': 'true' }, i);
}
function paintEta(i) {
  const p = i._full ? 1 : calls.planShare(i._bake);
  i.classList.toggle('sweep', p == null);
  i.style.width = p == null ? '' : `${(100 * p).toFixed(2)}%`;
}

/** The client-side views of a bundle (ctx.data); the bundle itself stays as the server sent it. Its rows are the players
 *  with the prices block laid over them (calls.withPrices: FPL's projections read since the snapshot). */
function derive(b, receivedAt) {
  const m = b.meta || {};
  const cols = calls.withPrices(b.players, b.prices);
  const fields = cols?.fields || [];
  const rows = (cols?.rows || []).map((r) => Object.fromEntries(fields.map((f, i) => [f, r[i]])));
  const byId = new Map(rows.map((r) => [Number(r.id), r]));
  const gw = Number(m.gw);
  const horizon = horizonOf(m), reach = reachOf(m);
  const xpGws = range(gw, Number(m.forecast_edge ?? reach[reach.length - 1]));
  const e = b.entry || {};
  const squad = (e.squad || []).map((s) => ({ ...byId.get(Number(s.id)), ...s, id: Number(s.id) }));
  const base = {
    season: m.season, entry_id: e.id, gw, squad, bank: e.bank, ft: e.ft,
    chips_available: e.chips_available || [], chips_used: e.chips_used || [], horizon: xpGws,
  };
  const data = { rows, byId, players: { horizon: xpGws, players: rows }, base, gw, horizon, reach, xpGws, noise: engine.noiseFloor(m, gw), receivedAt };
  data.lineup = squad.length ? lineupNow(e, data) : { xi: [], bench: [], captain: null, vice: null };
  data.fpl = fplTeam(e, gw);
  try { data.seeds = engine.decodeSeeds(b.seeds); } catch (err) { console.error('Forkcast: bad seed matrix', err); data.seeds = null; }
  return data;
}

// ================================================================ sheets (§4: never more than 2 deep, swipe down to dismiss)

const SHEET_PX = { small: 320, medium: 470 };
const FIT_ROOM = 12;   // px under a fit sheet's content (open fit, N9)
const DISMISS_PX = 130;  // a drag's end (with its flick: ui.flick) this far below its smallest detent closes a sheet

/** landed(to): a pop of sheets' history entries landed (B45; the router's carry). */
function createSheets(app, { landed = () => {} } = {}) {
  const stack = [];
  const sync = () => {
    app.classList.toggle('sheet-large', stack.some((s) => s.detent === 'large'));
    document.documentElement.classList.toggle('m-sheeted', stack.length > 0);  // toasts are placed on the sheet (placeToasts)
    stack.forEach((s, i) => s.el.classList.toggle('back', i < stack.length - 1));
    // B48 (APG: windows under a modal dialog are inert): while a sheet is up the page and the sheets under it take no
    // tap, focus or reading; #toasts hangs off <body>, so its Undo stays in reach
    const modal = stack.length > 0;
    // …and while Connect is up the screen behind it stays inert (showGate), a sheet over Connect or not
    const gated = document.documentElement.classList.contains('m-gated');
    for (const c of app.children) {
      const off = modal || (gated && c.matches('.m-screen'));
      if (!c.matches('.m-sheet, .m-scrim') && c.inert !== off) c.inert = off;
    }
    stack.forEach((s, i) => { const off = modal && i < stack.length - 1; if (s.el.inert !== off) s.el.inert = off; });
  };
  /** Its height at detent d (its own by default). */
  const heightOf = (sheet, d = sheet.detent) => {
    const H = sheet.el.offsetHeight;
    if (d === 'large') return H;
    const at = Math.min(H, d === 'small' ? SHEET_PX.small : Math.min(SHEET_PX.medium, Math.round(app.clientHeight * 0.58)));
    // N9 (open fit): a short content rests at its own height, the page above it in view (never taller than the detent)
    return sheet.fit ? Math.min(at, contentOf(sheet)) : at;
  };
  /** A sheet's content height: from its top (the grabber) to its body's last child's bottom, unscrolled, and FIT_ROOM
   *  under it (the body's own bottom padding, the scroll room under a long body, is not shown under a short one). */
  const contentOf = (sheet) => {
    const b = sheet.body;
    let bottom = b.getBoundingClientRect().top;
    for (const c of b.children) bottom = Math.max(bottom, c.getBoundingClientRect().bottom);
    return Math.ceil(bottom + b.scrollTop - sheet.el.getBoundingClientRect().top + FIT_ROOM);
  };
  const offset = (sheet, d = sheet.detent) => Math.max(0, sheet.el.offsetHeight - heightOf(sheet, d));
  /** The sheet slid down to its detent; its body ends that much above the sheet's bottom (m.css .m-sbody --sheet-off),
   *  so a body at a small or medium detent ends at the screen's bottom and scrolls every control into view. */
  const place = (sheet) => {
    const off = offset(sheet);
    sheet.el.style.transform = `translateY(${off}px)`;
    sheet.el.style.setProperty('--sheet-off', `${off}px`);
    sync();
  };
  /** Its detents, smallest first. */
  const orderOf = (sheet) => ['small', 'medium', 'large'].filter((d) => sheet.detents.includes(d));
  const atTop = (sheet) => sheet.detent === orderOf(sheet).at(-1);

  // B45 (NN/g: a sheet that looks like a page closes on Back; Safari keeps the edge swipe for Back): each sheet is a
  // history entry of its own ({sheet: n}, n its depth among them; the address unchanged), so Back lands on the entry
  // under it and closes it (popstate). The #/player route's sheet has its hash entry instead (routed). A sheet closed any
  // other way (✕, a swipe, the scrim, Escape, close / closeTop / closeAll) pops its entry, a whole close in one
  // history.go. That pop lands later: whatever writes history meanwhile (a sheet's push, navigate) waits for it (afterPop)
  let owed = 0, popping = 0, from = null, bare = false;  // popping: our history.go calls not landed yet
  const later = [];
  const entries = () => stack.filter((s) => s.entry).length;
  const flush = () => { if (!owed) return; const n = owed; owed = 0; popping++; from = location.hash; history.go(-n); };
  const afterPop = (fn) => { if (owed || popping) later.push(fn); else fn(); };
  const push = (sheet) => afterPop(() => { if (!stack.includes(sheet)) return; sheet.entry = true; history.pushState({ sheet: entries() }, ''); });
  if (history.state?.sheet) history.replaceState(null, '');  // a reload: no sheet is up
  addEventListener('popstate', () => {
    const ours = popping > 0, want = history.state?.sheet ?? 0;
    if (ours) popping--;
    let closed = false;
    // Back (or the edge swipe): the sheets above the entry it landed on close, as Escape closes them
    for (let s = stack.findLast((x) => x.entry); s && entries() > want; s = stack.findLast((x) => x.entry)) {
      if (!s.dismissible) { history.pushState({ sheet: entries() }, ''); break; }
      dismiss(s, { popped: true });
      closed = true;
    }
    // the entry landed on takes the address the sheets' had (a GW picked meanwhile; signOut's): ours knew it, Back's is
    // the screen's own
    if (ours || closed) landed(ours ? from : null);
    while (later.length && !owed && !popping) later.shift()();
  });

  function dismiss(sheet, { instant = false, keep = false, popped = false } = {}) {
    const i = stack.indexOf(sheet);
    if (i < 0) return;
    stack.splice(i, 1);
    // its entry: Back took it already (popped), the sheet taking its place keeps it (open's two-deep rule), else popped
    if (sheet.entry && !keep && !popped && !owed++) queueMicrotask(flush);
    // B107: under Reduce Motion it fades where it is, no slide
    if (ui.reduceMotion()) sheet.el.classList.add('m-fade');
    else sheet.el.style.transform = 'translateY(100%)';
    sheet.scrim.classList.remove('on');
    sync();
    setTimeout(() => { sheet.el.remove(); sheet.scrim.remove(); }, instant ? 0 : 450);
    // B48: focus back to its opener; one redrawn meanwhile: its replacement (ui.focusKey), else the page's focus home
    // (Ahead's week line); a sheet under it: the opener there, its replacement in it (Ahead's Week sheet redraws its
    // rows), else that sheet
    if (i === stack.length) {
      const under = stack[stack.length - 1];
      if (sheet.opener?.isConnected && !sheet.opener.closest('[inert]')) sheet.opener.focus?.({ preventScroll: true });
      else if (under) ui.refocus(under.el, sheet.key, under.el);
      else ui.refocus(app, sheet.key, $('[data-focus-home]', app));
    }
    sheet.onClose?.();
  }

  function setDetent(sheet, d) {
    if (!sheet.detents.includes(d) || d === sheet.detent) return place(sheet);
    sheet.detent = d;
    place(sheet);
    const grab = $('.m-grab span', sheet.el);
    grab?.classList.remove('m-bump');
    void grab?.offsetWidth;
    grab?.classList.add('m-bump');
  }

  function wireDrag(sheet) {
    const { el } = sheet;
    let y0 = null, base = 0, last = 0, fl = null;
    // while it drags the body runs to the sheet's bottom (it is below the screen there), so dragging it up shows content.
    // B112: it starts where it is now, a sheet caught mid-slide too (its transition drops: .dragging), never from its
    // resting place (it jumped there); a sheet already closing is not caught
    const start = (y, t) => {
      if (!stack.includes(sheet)) return;
      y0 = y; last = y;
      base = new DOMMatrix(getComputedStyle(el).transform).m42;
      fl = ui.flick().add(y, t);
      el.classList.add('dragging');
      el.style.transform = `translateY(${base}px)`;
      el.style.setProperty('--sheet-off', '0px');
    };
    // above its top (its largest detent's place) it moves a third as far as the finger; place() brings it back
    const move = (y, t) => {
      if (y0 == null) return;
      last = y;
      fl.add(y, t);
      const at = base + y - y0;
      el.style.transform = `translateY(${at < 0 ? at / 3 : at}px)`;
    };
    // B43: where the release carries it (ui.flick: its speed over the last ~100 ms, never the whole drag's average):
    // DISMISS_PX below its smallest detent's resting place, and below where it was caught (a tap on a sheet still
    // sliding up never closes it), it closes; else it goes to the detent resting nearest that point
    const end = (y = last, t = null) => {
      if (y0 == null) return;
      if (t != null) fl.add(y, t);
      const to = base + fl.project(y) - y0;
      y0 = null;
      el.classList.remove('dragging');
      const order = orderOf(sheet);
      if (sheet.dismissible && to > Math.max(base, offset(sheet, order[0])) + DISMISS_PX) return dismiss(sheet);
      setDetent(sheet, order.reduce((a, d) => (Math.abs(offset(sheet, d) - to) < Math.abs(offset(sheet, a) - to) ? d : a)));
    };
    // the grabber and the header drag with a pointer (mouse or touch)
    const down = (e) => {
      if (e.target.closest('button, input, a, select, textarea')) return;
      start(e.clientY, e.timeStamp);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    };
    for (const t of [$('.m-grab', el), ...$$('.m-sh', el)]) {
      t.addEventListener('pointerdown', down);
      t.addEventListener('pointermove', (e) => move(e.clientY, e.timeStamp));
      t.addEventListener('pointerup', (e) => end(e.clientY, e.timeStamp));
      t.addEventListener('pointercancel', () => end());
    }
    // the body drags down only from its top, and a swipe up on a sheet below its largest detent expands it before it
    // scrolls (as iOS sheets do); otherwise it scrolls
    const body = sheet.body;
    let ty = null, tt = 0;
    body.addEventListener('touchstart', (e) => {
      ty = (body.scrollTop <= 0 || !atTop(sheet)) && !e.target.closest('[data-nodrag], input, textarea') ? e.touches[0].clientY : null;
      tt = e.timeStamp;
    }, { passive: true });
    body.addEventListener('touchmove', (e) => {
      if (ty == null) return;
      // a gesture inside owns the finger (Ahead's lifted move row stops the scroll): never a drag of the sheet
      if (e.defaultPrevented && y0 == null) { ty = null; return; }
      const y = e.touches[0].clientY;
      if (y0 == null) {
        if (y - ty > 6) { if (body.scrollTop > 0) { ty = null; return; } start(ty, tt); }
        else if (ty - y > 6) { if (atTop(sheet)) { ty = null; return; } start(ty, tt); }
        else return;
      }
      ui.holdTouch(e);
      move(y, e.timeStamp);
    }, { passive: false });
    body.addEventListener('touchend', (e) => { ty = null; end(e.changedTouches[0]?.clientY, e.timeStamp); });
    body.addEventListener('touchcancel', () => { ty = null; end(); });
  }

  function open({ title, sub, detent = 'medium', detents, build, onClose, label, cls, close = true, dismissible = true, fit = false } = {}) {
    // the sheet it replaces gives it its history entry (B45: a pop then a push would land the push first)
    const gone = stack.length >= 2 ? stack[stack.length - 1] : null;
    if (gone) dismiss(gone, { instant: true, keep: true });
    const routed = bare;
    bare = false;
    const z = 240 + stack.length * 20;
    const scrim = h('div.m-scrim', { style: { zIndex: z } });
    const body = h('div.m-sbody');
    // B48: never aria-modal (the page under it is inert instead: sync), so the toasts' Undo outside it stays in reach
    const el = h('div.m-sheet', {
      class: cls, role: 'dialog', 'aria-modal': 'false', tabindex: '-1',
      'aria-label': label || (typeof title === 'string' ? title : null), style: { zIndex: z + 10 },
    }, h('div.m-grab', { 'aria-hidden': 'true' }, h('span')), body);
    const sheet = {
      el, body, scrim, detent, dismissible, onClose, fit, entry: !!gone?.entry,
      detents: detents || (detent === 'large' ? ['large'] : [detent, 'large']),
      opener: document.activeElement, key: ui.focusKey(document.activeElement), refresh: null,
      close: () => dismiss(sheet),
      setDetent: (d) => setDetent(sheet, d),
    };
    if (title) {
      body.append(h('div.m-sh', null,
        h('div', null, h('h2', null, title), sub ? h('p.m-sub', null, sub) : null),
        close ? h('button.m-xbtn', { type: 'button', 'aria-label': 'Close', onClick: () => dismiss(sheet) }, '✕') : null));
    }
    app.append(scrim, el);
    stack.push(sheet);
    if (!sheet.entry && !routed) push(sheet);
    build?.(body, sheet);
    wireDrag(sheet);
    scrim.addEventListener('click', () => { if (sheet.dismissible) dismiss(sheet); });
    // B107: under Reduce Motion it is placed at once and fades in there (m.css: its transition is the opacity alone)
    const still = ui.reduceMotion();
    if (still) el.classList.add('m-fade');
    void el.offsetHeight;  // commit the off-screen start, so placing it slides the sheet up
    scrim.classList.add('on');
    place(sheet);
    if (still) requestAnimationFrame(() => { if (stack.includes(sheet)) el.classList.remove('m-fade'); });
    el.focus({ preventScroll: true });
    return sheet;
  }

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length && stack[stack.length - 1].dismissible) dismiss(stack[stack.length - 1]);
  });
  addEventListener('resize', () => stack.forEach(place));
  return {
    open,
    closeTop: () => stack.length && dismiss(stack[stack.length - 1]),
    closeAll: () => [...stack].reverse().forEach((s) => dismiss(s)),
    depth: () => stack.length,
    afterPop,
    /** The next sheet opened is the #/player route's (route): its hash entry is its history entry (false: never mind). */
    routed: (on = true) => { bare = on; },
    /** The sheet on top: {el, top, bottom}, its edges in the viewport once it rests at its detent (whatever its slide is
     *  doing now); bottom is where its body's room ends (the screen's bottom at any detent: place); null with no sheet
     *  up. */
    top: () => {
      const s = stack[stack.length - 1];
      if (!s) return null;
      const y = app.getBoundingClientRect().top + s.el.offsetTop;
      return { el: s.el, top: y + offset(s), bottom: y + s.el.offsetHeight };
    },
  };
}

// ================================================================ small shared pieces

/** Set el's digits to `text` (m.css .m-odo: one column per digit, shown at its digit). No roll (DESIGN_V2 §2 Motion:
 *  numbers change in place); the column markup stays so m.css and the callers keep one shape. */
function odometer(el, text, { neg = false } = {}) {
  const chars = [...String(text)];
  el.className = `m-odo${neg ? ' neg' : ''}`;
  el.setAttribute('aria-label', String(text));
  el.replaceChildren(...chars.map((ch) => (/\d/.test(ch)
    ? h('span.d', { 'aria-hidden': 'true' }, h('span.col', { style: { transform: `translateY(-${Number(ch) * 10}%)` } }, [...'0123456789'].map((d) => h('span', null, d))))
    : h('span.s', { 'aria-hidden': 'true' }, ch))));
  el._odo = chars;  // what it shows (ahead.js compares before it calls)
  return el;
}

/** Load a screen or sheet module once (null when it can't be loaded, without a console error). A failed
 *  fetch (the server away) is not remembered, so the next call tries again. */
const modules = new Map();
function optionalModule(rel) {
  const url = new URL(rel, import.meta.url).href;
  if (!modules.has(url)) {
    modules.set(url, (async () => {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store' }).catch(() => null);
      if (!r) { modules.delete(url); return null; }
      if (!r.ok || !/javascript/.test(r.headers.get('content-type') || '')) return null;
      try {
        return await import(url);
      } catch (e) {
        console.error(`Forkcast: ${rel} failed to load`, e);
        return null;
      }
    })());
  }
  return modules.get(url);
}

/** Fetch the screen and every sheet module while the server answers, so an open app that loses it can still
 *  show Ahead and Why from its snapshot (§10.4: no service worker over plain HTTP). */
const LAZY = [`./${SCREEN}.js`, ...['why', 'player', 'replace', 'wish', 'you', 'chips', 'about'].map((n) => `./sheets/${n}.js`)];
let preloaded = false;
function preloadModules() {
  if (preloaded) return;
  preloaded = true;
  setTimeout(() => LAZY.forEach((rel) => optionalModule(rel)), 400);  // after the first paint's own fetches
}

function linkCss(href) {
  if (!href || $(`link[data-m-css="${href}"]`)) return Promise.resolve();
  return new Promise((res) => {
    const l = h('link', { rel: 'stylesheet', href, dataset: { mCss: href } });
    l.onload = l.onerror = () => res();
    document.head.append(l);
  });
}

// ================================================================ app state

const app = $('#app');
const sheets = createSheets(app, { landed: carry });
const screen = { el: $(`#m-${SCREEN}`), mod: null, handle: null, mounting: null, fresh: false };
const banner = h('div.m-banner', { hidden: true, role: 'status', 'aria-live': 'polite' });
const gate = $('#m-gate');
let revealOnce = false;

const ctx = {
  get bundle() { return store.get('bundle'); },
  get data() { return store.get('data'); },
  get reveal() { return revealOnce; },
  store, api, sheets, engine, calls, kits, pitch, ui,
  navigate, odometer,
  openSheet: (name, ...args) => openSheet(name, ...args),
  // A10: the bundle only when the refresh worked (null when it failed: its toast or the off-line banner says so)
  refresh: (o) => loader.load({ refresh: !!o?.hard, manual: true }).then((b) => (loader.ok ? b : null)).catch(() => null),
  connect: (entry) => firstLoad(String(entry)),
  signOut: () => signOut(),
  teamPicker: (opts) => teamPicker(ctx, opts),
  status,
  weeks: () => weeksOf(store.get('entry')),
  // the plan's weeks picked: kept, and the bundle asked for that plan now (its bake when it has none yet: the banner says)
  setWeeks: (n) => { api.local.set(HORIZON_KEY(store.get('entry')), String(n)); return ctx.refresh(); },
};

function status() {
  const s = store.get('conn')?.state;
  if (s === 'offline') return { tone: 'none', text: 'Forkcast server unreachable' };
  if (s === 'ok' || s === 'offline-data') return { tone: 'fresh', text: 'Up to date' };
  return { tone: 'amber', text: s === 'updating' ? 'The forecast is updating' : 'Plan is updating' };
}

// ================================================================ theme

// Light only (user order 2026-10-08): html[data-theme=light] (index.html sets it before first paint) makes every
// light-dark() token light; the turf keeps its own dark scheme (plan-pitch.css). The You sheet has no Appearance choice.
function applyTheme() {
  document.documentElement.dataset.theme = 'light';
}

// ================================================================ router (#/ahead?gw=8, #/player/<id>; #/week, #/ and #/ahead → #/ahead?gw=A)

function parseHash(hash = location.hash) {
  const [path, q = ''] = hash.replace(/^#\/?/, '').split('?');
  const [name, id] = path.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(q));
  if (name === 'player' && /^\d+$/.test(id || '')) return { name, params: { ...params, id: Number(id) } };
  // F10: the old This week (#/week) and a bare #/ are Ahead (old links keep working); without a GW, GW A
  return { name: SCREEN, params: name === SCREEN ? params : {} };
}

/** An address without a GW (#/week, a bare #/, the home-screen start #/ahead) opens GW A, the next deadline: now when
 *  the bundle is in, else once it comes (accept). */
let wantA = false;
const gwA = () => store.get('data')?.gw ?? null;

const hashOf = (name, params = {}) => {
  if (name === 'player') { const { id, ...rest } = params; return `#/player/${id}${qs(rest)}`; }
  return `#/${name}${qs(params)}`;
};

/** top: the screen goes to its top (by default unless replace). B45: it runs once the history entries of the sheets just
 *  closed are popped (sheets.afterPop): written before, the pop landing would take it back. */
function navigate(name, params = {}, { replace = false, top = !replace } = {}) {
  sheets.afterPop(() => {
    const hash = hashOf(name, params);
    // H1 (2026-10-09): a sheet's edit (Add a player, Sell from…) lands on the screen at its top, the GW it made
    // on the switcher, never where a tap low down had scrolled it (it replaces the address: B45, top)
    if (name === SCREEN && top) screen.el?.scrollTo({ top: 0 });
    if (hash === location.hash) return route();
    if (replace) { history.replaceState(history.state, '', hash); route(); } else location.hash = hash;
  });
}

let routeSheet = null;
function route() {
  const r = parseHash();
  if (r.name === 'player') {
    sheets.routed();
    openSheet('player', r.params.id).finally(() => sheets.routed(false)).then((sh) => {
      routeSheet = sh || null;
      if (sh) {
        const prev = sh.onClose;
        sh.onClose = () => { prev?.(); if (routeSheet === sh) { routeSheet = null; if (parseHash().name === 'player') navigate(SCREEN, screenParams(), { replace: true }); } };
      }
    });
    return;
  }
  if (routeSheet) { const sh = routeSheet; routeSheet = null; sh.close(); }
  if (/^\d+$/.test(r.params.gw || '')) {
    wantA = false;
    store.set('gw', Number(r.params.gw));
  } else if (Number.isFinite(gwA())) {
    wantA = false;
    store.set('gw', gwA());
  } else wantA = true;
  // the canonical address (an old #/week is rewritten in place; a sheet's entry keeps its marker: B45)
  const canon = canonical();
  if (location.hash !== canon) history.replaceState(history.state, '', canon);
  showScreen();
}
const screenParams = () => (Number.isFinite(store.get('gw')) ? { gw: store.get('gw') } : {});
/** The screen's canonical address (#/ahead?gw=8), or null on another route (#/player/<id>). */
function canonical() { return parseHash().name === SCREEN ? hashOf(SCREEN, screenParams()) : null; }
store.on('gw', () => {
  const canon = canonical();
  if (canon && location.hash !== canon) history.replaceState(history.state, '', canon);
});
/** B45: a pop of the sheets' history entries landed (createSheets). The entry it landed on is the page's under the sheets
 *  and may hold an older address (a GW picked while a sheet was up rewrote only the sheet's: store.on('gw'); signOut's):
 *  it takes `to` (the address the sheets' entry had, else the screen's canonical one), and the hashchange of that
 *  landing is not a route (it would switch the week back). */
let skipHash = null;
function carry(to) {
  to ??= canonical();
  if (!to || location.hash === to) return;
  skipHash = location.href;
  history.replaceState(history.state, '', to);
}
addEventListener('hashchange', (e) => { const skip = e.newURL === skipHash; skipHash = null; if (!skip) route(); });

// ================================================================ the screen

function showScreen() {
  if (store.get('bundle')) ensureMounted().then(() => shown());
  placeBanner();
}

/** The screen is on show: tell it once per mount (after its mount, when the bundle came later). */
function shown() {
  screen.fresh = false;
  screen.handle?.show?.();
}

async function ensureMounted() {
  const s = screen;
  if (s.handle || !store.get('bundle')) return;
  if (!s.mounting) {
    s.mounting = (async () => {
      s.mod = s.mod || (await optionalModule(`./${SCREEN}.js`));
      if (!s.mod?.mount) return;
      await linkCss(s.mod.css);
      s.el.replaceChildren();
      revealOnce = pendingReveal;
      try {
        s.handle = s.mod.mount(s.el, ctx) || {};
        s.fresh = true;  // mounted: it hears show() once laid out (showScreen, or accept for a cold start)
      } catch (e) {
        console.error(`Forkcast: ${SCREEN}.js mount failed`, e);
        s.handle = {};
        fill(s.el, h('div.m-card', { style: { marginTop: '24px' } }, h('p.m-para', null, "Something went wrong showing this screen. Your plan is unchanged. Reload the page to try again.")));
      } finally {
        pendingReveal = false;
        revealOnce = false;
      }
      placeBanner();
    })().finally(() => { s.mounting = null; });
  }
  return s.mounting;
}

function drop() {
  const s = screen;
  try { s.handle?.unmount?.(); } catch (e) { console.error(`Forkcast: ${SCREEN}.js unmount failed`, e); }
  s.handle = null;
  s.el.replaceChildren();
}

/** Tell the screen something changed; a screen without update() is re-mounted on a new bundle. */
function notify(why) {
  const s = screen;
  if (s.handle?.update) {
    try { s.handle.update(why); } catch (e) { console.error(`Forkcast: ${SCREEN}.js update failed`, e); }
  } else if (s.handle && why === 'bundle') {
    drop();
    ensureMounted();
  }
  placeBanner();
}

// ================================================================ state banner (§5.2 states, §7.9)

function renderBanner() {
  const c = store.get('conn') || {};
  const at = hhmm(c.at);
  let kind = null, text = '', extra = null;
  if (c.state === 'offline') {
    kind = 'offline';
    text = store.get('bundle') ? calls.COPY.offline(at) : api.plain(c.error);
    extra = h('button', { type: 'button', onClick: () => loader.load({ manual: true }).catch(() => {}) }, 'Retry');
  } else if (c.state === 'updating') {
    kind = 'updating';
    text = calls.COPY.updating;
  } else if (c.state === 'stale' || c.state === 'baking') {
    // the bake's own progress (a new forecast's roads while the old ones show, stale; or the first ones): its bar by time
    const bake = store.get('bundle')?.bake;
    kind = c.state;
    text = kind === 'stale' ? calls.COPY.replanning(at) : planning(store.get('data')?.horizon, bake);
    extra = bake?.total ? etaBar('span.m-banner-bar', bake) : null;
  }
  banner.className = `m-banner ${kind || ''}`;
  banner.hidden = !kind;
  fill(banner, h('span.m-banner-ic', { 'aria-hidden': 'true' }), h('span.m-banner-t', null, text), extra);
}

function placeBanner() {
  const el = screen.el;
  if (!el) return;
  const slot = $('[data-banner-slot]', el);
  if (slot) { if (banner.parentNode !== slot) slot.append(banner); } else if (banner.parentNode !== el || el.firstChild !== banner) el.prepend(banner);
}
store.on('conn', () => { renderBanner(); notify('conn'); });

// ================================================================ bundle loader

const POLL_MS = { baking: 1500, stale: 5000, updating: 5000, 'offline-data': 60000, ready: 120000, chips: 4000 };
/** The next poll: by the bundle's state; a ready one whose chips are still pre-solving (F12) comes back sooner. */
const pollMs = (b) => (b.state === 'ready' && b.bake?.chips?.pending ? POLL_MS.chips : POLL_MS[b.state] ?? POLL_MS.ready);
const BACKOFF_MS = [5000, 10000, 20000, 30000];

/** GET the bundle. With the same entry's previous bundle, ask with ?have=<its version>: an unchanged
 *  data version comes back without players and seeds (api/mobile.py bundle), so keep the old ones; and with ?hc=<its
 *  cards' stamp>: the same cards come back as none, kept as well (their own stamp: their inputs aren't the plan's
 *  version's). Its prices block
 *  (FPL's projections read since the snapshot) comes with every reply; derive lays it over the players kept. It plans
 *  the weeks this browser picked for the team (weeksOf, as prev's locks allow). */
async function fetchBundle(entry, { refresh = false, prev = null } = {}) {
  const same = String(prev?.entry?.id) === String(entry);
  const have = prev?.version && same ? prev.version : null;
  const hc = prev?.cards && same ? prev.cards_v : null;
  const b = await api.getBundle(entry, { refresh, have, hc, w: weeksOf(entry, prev) });
  const cards = b.cards ?? (hc && b.cards_v === hc ? prev.cards : null);
  return { ...(have && b.version === have && b.players == null && b.seeds == null ? { ...b, players: prev.players, seeds: prev.seeds } : b), cards };
}

const loader = {
  timer: null, seq: 0, misses: 0, last: '', plan: { v: undefined, at: NaN }, ok: false,
  schedule(ms) { clearTimeout(this.timer); this.timer = ms ? setTimeout(() => this.load().catch(() => {}), ms) : null; },
  /** Fetch the bundle for the connected entry → the bundle (or throws when there is nothing to show). */
  async load({ refresh = false, manual = false } = {}) {
    const entry = store.get('entry');
    if (!entry) return null;
    const my = ++this.seq;
    const t0 = Date.now();
    try {
      const b = await fetchBundle(entry, { refresh, prev: store.get('bundle') });
      if (my !== this.seq) return b;
      this.misses = 0;
      this.ok = true;
      accept(entry, b);
      this.schedule(pollMs(b));
      return b;
    } catch (e) {
      if (my !== this.seq) throw e;
      this.ok = false;
      // A10: the server away (no answer, or a 503 / 504 in front of it) is off line: the banner says the data's time,
      // edits wait, and You → Connection says so. B41: with a bundle on screen, only once api.offlineNow says so (a
      // second miss in a row, or one after 10 s unanswered); with none there is no last good state to keep
      const had = !!store.get('bundle');
      const offline = api.isDown(e) && (!had || api.offlineNow(this.misses, Date.now() - t0));
      if (!had) {
        const snap = api.loadSnapshot(entry);
        if (snap && offline) accept(entry, snap.bundle, { at: snap.at, offline: true, snapshot: true });
      }
      if (offline) store.set('conn', { ...store.get('conn'), state: 'offline', error: e });
      else if (manual) ui.toast(api.plain(e, { entry }), 'error');
      this.schedule(BACKOFF_MS[Math.min(this.misses++, BACKOFF_MS.length - 1)]);
      if (!store.get('bundle')) throw e;
      return store.get('bundle');
    }
  },
};

/** The bundle with older roads scored on today's forecast: their stored pred is the old one (see ctx.bundle). */
function todaysRoads(b) {
  const v = b?.version, rv = b?.meta?.roads_version;
  if (!b?.roads || !v || !rv || rv === v) return b;
  const strip = (r) => (r?.weeks ? { ...r, weeks: r.weeks.map(({ pred, ...w }) => w) } : r);
  const each = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, r]) => [k, strip(r)]));
  const R = b.roads;
  return { ...b, roads: { ...R, base: strip(R.base), roll: strip(R.roll), veto: each(R.veto), slide: each(R.slide), chip: each(R.chip) } };
}

/** Take a bundle into the store (and the offline snapshot); screens hear 'bundle' when it changed. */
function accept(entry, raw, { at = Date.now(), offline = false, snapshot = false } = {}) {
  const b = todaysRoads(raw);
  const sig = JSON.stringify(b);
  const changed = sig !== loader.last;
  loader.last = sig;
  const total = Number(b.bake?.total) || 0;
  const plan = b.meta?.roads_version ?? b.version ?? null;
  if (plan !== loader.plan.v || snapshot) loader.plan = { v: plan, at };
  const conn = {
    state: offline ? 'offline' : b.state === 'ready' || !b.state ? 'ok' : b.state,
    at: loader.plan.at,
    bake: total ? { done: Number(b.bake.done) || 0, total } : null,
    error: null,
    // the saved bundle of a warm start, until a live one lands (ahead.sayCheer: a toast of an older GW's week)
    snapshot: !!snapshot,
  };
  if (changed) {
    const data = derive(b, at);
    const gw = store.get('gw');
    if (wantA || !Number.isFinite(gw) || !data.horizon.includes(gw)) store.set('gw', data.gw);
    wantA = false;
    store.set({ bundle: b, data });
    if (!offline && !snapshot && b.roads?.base) api.saveSnapshot(entry, b);
  }
  store.set('conn', conn);
  if (changed) notify('bundle');
  if (store.get('bundle')) {
    // a cold start mounts the screen here, after showScreen ran without a bundle: show it too
    ensureMounted().then(() => { if (screen.fresh) shown(); });
    if (!offline) preloadModules();
  }
}

document.addEventListener('visibilitychange', async () => {
  // hidden: away counts from here, unless it already does (no touch or key for FORGET_MS on screen: a page left open,
  // then reloaded, is signed out); shown again: into a new release if the server has moved to one, else after
  // FORGET_MS away signed out
  if (document.visibilityState !== 'visible') { if (!away()) seen(true); return; }
  if (await reloadIfReleased()) return;
  if (signOutIfAway() || !store.get('entry') || !gate.hidden) return;
  const at = store.get('conn')?.at;
  if (!Number.isFinite(at) || Date.now() - at > 30000 || store.get('conn')?.state !== 'ok') loader.load().catch(() => {});
});

// ================================================================ pull to refresh (§6)

const ptr = h('div.m-ptr', { 'aria-hidden': 'true' }, h('i'));
app.append(ptr);
{
  const el = screen.el;
  let y0 = null, x0 = 0, dy = 0, pulling = false;
  const paint = () => {
    const d = Math.min(dy * 0.5, 80);
    ptr.style.opacity = String(Math.min(1, d / 50));
    ptr.style.transform = `translateY(${d - 40}px) rotate(${d * 4}deg)`;
    ptr.classList.toggle('ready', d >= 60);
  };
  el.addEventListener('touchstart', (e) => {
    y0 = el.scrollTop <= 0 && e.touches.length === 1 && !e.target.closest('[data-nopull]') && !sheets.depth() ? e.touches[0].clientY : null;
    x0 = e.touches[0].clientX;
    dy = 0;
    pulling = false;
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (y0 == null || e.defaultPrevented) return;
    dy = e.touches[0].clientY - y0;
    // engage only on a clear downward pull from the top (a sideways drag or a gesture below is not one)
    if (!pulling && (dy < 10 || Math.abs(e.touches[0].clientX - x0) > dy || el.scrollTop > 0)) {
      if (dy < 0 || Math.abs(e.touches[0].clientX - x0) > 10) y0 = null;
      dy = 0;
      return;
    }
    pulling = true;
    ui.holdTouch(e);
    paint();
  }, { passive: false });
  const end = async () => {
    if (y0 == null || !pulling) { y0 = null; return; }
    y0 = null;
    pulling = false;
    if (Math.min(dy * 0.5, 80) >= 60) {
      ptr.classList.add('busy');
      ptr.style.transform = 'translateY(20px)';
      await loader.load({ refresh: true, manual: true }).catch(() => {});
      ptr.classList.remove('busy');
    }
    dy = 0;
    ptr.style.transition = 'opacity .3s, transform .3s';
    paint();
    setTimeout(() => { ptr.style.transition = ''; }, 320);
  };
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
}

// ================================================================ sheets by name

async function openSheet(name, ...args) {
  const mod = await optionalModule(`./sheets/${name}.js`);
  if (mod?.open) return mod.open(ctx, ...args);
  if (name === 'player') return playerFallback(args[0]);
  ui.toast('That part of Forkcast is still being built.', 'info');
  return null;
}

/** Until sheets/player.js lands: who he is and his next five xP, so #/player/<id> still works. */
function playerFallback(id) {
  const d = store.get('data');
  const p = d?.byId.get(Number(id));
  return sheets.open({
    title: p?.name ?? `Player ${id}`, sub: p ? `${p.club} · ${ui.posCode(p.pos)} · ${fmt.money(p.price)}` : '', detent: 'medium',
    build(body) {
      if (!p) { body.append(h('p.m-para', null, 'Not in this forecast.')); return; }
      body.append(h('div.m-well', null, d.xpGws.map((g, i) => h('div.m-kv', null, h('span', null, `GW${g}${g > d.horizon[d.horizon.length - 1] ? ' · forecast only' : ''}`),
        h('span.m-num', null, ui.xpNum(fmt.pts(p.xp?.[i])))))));
    },
  });
}

// ================================================================ gate: Connect, first load

function showGate(...kids) {
  sheets.closeAll();
  gate.hidden = false;
  gate.className = 'm-gate';
  document.documentElement.classList.add('m-gated');
  // the plan behind Connect takes no tap, focus or reading (the reviews, 2026-10-11: VoiceOver reached the plan's rows
  // under the gate, which only set a class nothing read)
  screen.el.inert = true;
  fill(gate, ...kids);
}
function hideGate() {
  // A11: a straight swap to the plan (no cross-fade of the landing over it)
  document.documentElement.classList.remove('m-gated');
  screen.el.inert = false;
  gate.hidden = true;
  gate.className = 'm-gate';
  gate.replaceChildren();
}

/** Keep the page scrollable above the iOS keyboard (visualViewport shrinks when it opens: m.css pads by --kb). */
const vv = globalThis.visualViewport;
const kbSync = () => gate.style.setProperty('--kb', `${Math.max(0, innerHeight - vv.height - vv.offsetTop)}px`);
vv?.addEventListener('resize', kbSync);
vv?.addEventListener('scroll', kbSync);

/** "Where do I find my ID?": the FPL address with the ID marked. */
function whereSheet(example) {
  sheets.open({
    title: PICK.where, detent: 'small',
    build(body) {
      body.append(h('p.m-para', null, 'On the FPL site open ', h('b', null, 'Points'), ' and look at the address:'),
        h('p.m-idurl.m-num', null, 'fantasy.premierleague.com/entry/', h('b', null, example || '1234567'), '/event/…'),
        h('p.m-foot.m-idnote', null, 'You can paste the whole address into the field.'));
    },
  });
}

/** §5.1 Connect (F6, DESIGN_V2 §3): the name and the promise, the team picker (a team name with live search, or the
 *  Team ID; a pasted entry URL is read), Find my team right under it ("Finding…" while it looks: B87, one word for the
 *  wait), Where do I find my ID?, what it costs, the Recent list, About Forkcast for whoever reads on, and the
 *  not-affiliated line at the foot. The first load keeps the form (dimmed) and shows one progress line (.m-prog). */
function showConnect({ error = '', tone = '', retry = null, value = '' } = {}) {
  clearTimeout(loader.timer);
  const err = h('div.m-err', { class: tone, role: 'alert' }, error, retry ? h('button', { type: 'button', onClick: retry }, 'Retry') : null);
  const picker = teamPicker(ctx, { value, onPick: (id) => firstLoad(id), onWhere: (id) => whereSheet(id), recent: 3 });
  // an error about what was typed goes as you type again (the reviews, 2026-10-11: it stayed under a new ID)
  picker.field.addEventListener('input', () => err.replaceChildren(), { once: true });
  const go = h('button.m-primary.lg', { type: 'button', onClick: () => picker.submit() }, 'Find my team');
  const where = h('button.m-where', { type: 'button', onClick: () => whereSheet(readId(picker.field.value)) }, PICK.where);
  // About Forkcast under it all (sheets/about.js landing; the user, 2026-10-14: "show this tab at loading - any one want
  // to read will read, others will click find my team"): its own Find my team at its foot brings you back to the field
  const land = h('div.m-land');
  const start = () => { gate.scrollTo({ top: 0 }); if (picker.field.value.trim()) picker.submit(); else picker.focus(); };
  import('./sheets/about.js').then((m) => land.replaceWith(m.landing(ctx, { start }))).catch(() => land.remove());
  showGate(
    h('div.m-wordmark', null, h('h1', null, 'Forkcast'), h('p', null, calls.COPY.whyHero)),
    // A11: an error sits right under the field it is about
    h('div.m-form', null, picker.el, err, h('div.m-go', null, go), where),
    h('div.m-prog', { 'aria-live': 'polite' }),
    picker.recent,
    land,
    h('p.m-legal', null, calls.COPY.whyLegal));
  setTimeout(() => { if (!gate.classList.contains('loading')) picker.focus(); }, 350);
}

/**
 * F6b "Sign out of <team>": this device forgets the team (the store's entry, the offline snapshot,
 * every fc:mem / fc:ahead key of it - its local mirror, memory forget's - and its Plan ahead length), and so does the server: its plan
 * memory of every GW goes as Reset plan leaves it (memory release → forget; the user, 2026-10-22: "When you sign out
 * yourself, forget that team's choices too"), the same way after FORGET_MS away; then back to Connect. The solves stay
 * cached, and the recent chips keep the team for a one-tap return, as a fresh plan. Said by no toast (the user,
 * 2026-10-21, of "Signed out of Raketa on this device. Undo": "remove this"); one after FORGET_MS away says why
 * (awaySignedOut).
 */
function signOut({ away = false } = {}) {
  const entry = store.get('entry');
  if (!entry) return null;
  const name = store.get('bundle')?.entry?.team_name || api.recent.list().find((r) => String(r.entry_id) === String(entry))?.team_name || `Team ${entry}`;
  releaseMemory(api, entry);  // started before the page leaves the team: a sign-in before it lands still starts fresh
  const keys = [...new Set([
    ...(api.loadSnapshot(entry) ? ['fc:snapshot'] : []),
    ...[`fc:ahead:sugg:${entry}`, HORIZON_KEY(entry)],  // its fc:mem mirror: memory forget's
    ...api.local.keys(`fc:ahead:lu:${entry}:`),
  ])];
  keys.forEach((k) => api.local.set(k, null));
  clearTimeout(loader.timer);
  loader.seq++;  // a load in flight lands nowhere
  loading++;
  drop();
  store.set({ entry: null, bundle: null, data: null, memory: null });
  loader.last = '';
  history.replaceState(history.state, '', `#/${SCREEN}`);  // a sheet's entry keeps its marker (B45: carried down)
  showConnect();
  // nothing of the plan is kept and there is no Undo (forget); after FORGET_MS away the toast says why
  if (away) ui.toast(calls.COPY.awaySignedOut(name), 'info', { timeout: 8000 });
  return { name };
}

/** When this browser last used Forkcast (a touch, a key, the page hidden, a team's plan landing): FORGET_MS after it,
 *  the team is signed out and its choices go (signOut away; the user, 2026-10-14: "why forkcast not log out from team
 *  after ten minutes pass ... make sure it only cache computations but sign out and not remember any choices"); and
 *  the open team's own last use (memory USED: a team opened, by a launch or a sign-in, unused that long starts as Reset
 *  plan leaves it). `force`: written now (otherwise at most every 15 s while in use); `team` false: a plan landing,
 *  which is no use of the team yet (its last use decides whether its choices stand: memory, as the plan loads). */
const SEEN_KEY = 'fc:seen';
let seenAt = 0;
function seen(force = false, team = true) {
  const now = Date.now();
  if (!force && now - seenAt < 15000) return;
  seenAt = now;
  api.local.set(SEEN_KEY, String(now));
  const entry = team ? store.get('entry') : null;
  if (entry) api.local.set(USED(entry), String(now));
}
/** Away longer than FORGET_MS since the last use, or no use kept at all: a team opened before this rule came (v1.3.12
 *  or earlier), its last use unknown, is signed out once (the user, 2026-10-14: "why it not signed out of the team" -
 *  the first launch after the release only started the clock). QA's phones are seeded used (scenario.mjs boot). */
const away = () => { const t = Number(api.local.get(SEEN_KEY)); return !(t > 0) || Date.now() - t > FORGET_MS; };
/** Back after FORGET_MS away with a team open: signed out (a launch, or the tab shown again). → whether it was */
function signOutIfAway() {
  const was = !!store.get('entry') && away();
  if (was) signOut({ away: true });
  seen(true);
  return was;
}
/** A page left open on screen, unused FORGET_MS (no touch or key: the visibilitychange and boot checks never run while
 *  it stays shown), signs itself out too (the user, 2026-10-22: Raketa's choices still there "even after 30 idle"):
 *  checked about once a minute while shown, and by the first touch or key after it, before seen() restarts the clock
 *  (that tap lands on Connect, under the away toast; its click goes nowhere). */
function awayOnScreen(e) {
  if (!store.get('entry') || !away()) return false;
  signOutIfAway();
  if (e?.type === 'pointerdown') {
    const eat = (c) => { c.stopPropagation(); c.preventDefault(); };
    document.addEventListener('click', eat, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', eat, { capture: true }), 1000);
  }
  return true;
}
setInterval(() => { if (document.visibilityState === 'visible') awayOnScreen(); }, 60000);
for (const t of ['pointerdown', 'keydown']) document.addEventListener(t, (e) => { if (!awayOnScreen(e)) seen(); }, { capture: true, passive: true });

/** The release this page runs: the server's as it booted (api.servedRelease; null: the tree's own, or no answer, then
 *  the next answer's). Shown again after the server has moved to another, the page reloads into it, so a page kept in
 *  memory across a release runs the new code, its away rule first (the user, 2026-10-14: an iPhone left on yesterday's
 *  page "not logged in and not resetted": that code had no away rule, and nothing told an open page of a release).
 *  → whether it reloads */
let ownRelease = null;
async function reloadIfReleased() {
  const now = await api.servedRelease();
  if (!ownRelease) { ownRelease = now; return false; }
  if (!now || now === ownRelease) return false;
  location.reload();
  return true;
}

let pendingReveal = false;
let loading = 0;

/** The first load of a team (Connect, Switch team, a recent row): the form stays, dimmed, under it one line
 *  "Planning GW6–9" and a thin bar (DESIGN_V2 §3; etaBar: a sweep until a road is done), until the base road is in;
 *  then Ahead. */
async function firstLoad(entry) {
  const my = ++loading;
  clearTimeout(loader.timer);
  // Change team from a team on screen (the reviews, 2026-10-11: a mistyped ID threw you out to Connect): a lookup that
  // fails goes back to that team, its reason in a toast (Retry where it may work next time)
  const was = gate.hidden && store.get('bundle') ? store.get('entry') : null;
  if (gate.hidden) showConnect({ value: entry });
  document.activeElement?.blur?.();
  gate.classList.add('loading');
  const go = $('.m-go .m-primary', gate);
  if (go) { go.disabled = true; go.textContent = 'Finding…'; }
  const prog = $('.m-prog', gate);
  /** The line and the bar for bundle b (none yet: A11 "Finding team 3604308…", the ID being looked up; then "Planning
   *  GW6–9"): the bake's bar (etaBar), full once the base road is in. */
  const show = (b) => {
    fill(prog, h('p.m-prog-t.m-num', null, b ? planning(b?.meta ? horizonOf(b.meta) : null, b?.bake) : `Finding team ${entry}…`),
      etaBar('div.m-bar', b?.bake, !!b?.roads?.base),
      b?.state === 'updating' && !b.roads?.base ? h('p.m-prog-t.warn', null, calls.COPY.updating) : null);
  };
  const back = (e) => {
    if (my !== loading) return;
    const retry = api.isDown(e) || e.status >= 500 ? () => firstLoad(entry) : null;
    if (was != null && String(was) !== String(entry) && store.get('entry') === was) {
      hideGate();
      loader.schedule(pollMs(store.get('bundle')));
      ui.toast(api.plain(e, { entry }), 'warn', retry ? { action: { label: 'Retry', onClick: retry } } : {});
      return;
    }
    showConnect({ error: api.plain(e, { entry }), retry, value: entry });
  };
  show(null);
  let b;
  try {
    b = await api.getBundle(entry, { w: weeksOf(entry) });
  } catch (e) { return back(e); }
  if (my !== loading) return;
  if (b.state === 'offline-data' || !b.entry) return enter(entry, b);  // no next GW: nothing to plan
  show(b);
  // wait for the base road while it bakes; a bundle that will never have one (the GW under way with
  // nothing baked, or a base solve that failed) goes in and shows its own state
  while (!b.roads?.base && (b.state === 'baking' || b.state === 'updating')) {
    await wait(b.state === 'updating' ? POLL_MS.updating : POLL_MS.baking);
    if (my !== loading) return;
    try { b = await fetchBundle(entry, { prev: b }); } catch (err) { return back(err); }
    if (my !== loading) return;
    show(b);
  }
  return enter(entry, b, { reveal: true });
}

/** Into Ahead at GW A (the next deadline): mount it behind the gate, then cross-fade (reveal: after Connect's first
 *  load, ctx.reveal for the mount). */
async function enter(entry, b, { reveal = false } = {}) {
  // the plan landing is a use: a first load can bake for minutes with nothing touched (the review, 2026-10-14: one that
  // landed behind another tab was signed out "after five minutes away" as it was shown); not yet of the team, whose
  // last use decides whether its choices stand (memory USED)
  seen(true, false);
  store.set('entry', entry);
  api.recent.add(entry, b.entry || {});
  drop();
  loader.last = '';
  loader.plan = { v: undefined, at: NaN };
  pendingReveal = reveal;
  const A = Number(b.meta?.gw);
  if (Number.isFinite(A)) store.set('gw', A);
  history.replaceState(null, '', hashOf(SCREEN, screenParams()));
  accept(entry, b);
  loader.schedule(pollMs(b));
  showScreen();
  await ensureMounted();
  hideGate();
}

// ================================================================ boot

/** The Studio used to live at /, so its old links (#/lab, #/runs?job=…, #/docs?flag=…) now land here (OPS-4):
 *  on this computer they go on to /studio/ (elsewhere the Studio isn't served, so they stay Forkcast's). */
const STUDIO_ROUTES = /^#\/(lab|planner|plan|dashboard|players|compare|fixtures|runs|backtests|preview|data|docs)(?:[/?]|$)/;
function studioLink() {
  if (!STUDIO_ROUTES.test(location.hash) || !api.LOOPBACK.has(location.hostname)) return false;
  location.replace(`/studio/${location.hash}`);
  return true;
}

/** What takes a tap on the page: a toast's Undo never sits over one of these (placeToasts). */
const CONTROLS = 'button, a[href], input, select, textarea, summary, [role="button"], [role="slider"], [role="radio"], [role="tab"], [tabindex="0"]';
const PLACE_SETTLE_MS = 120;  // after a scroll or a resize ends, the toast up is placed again

/**
 * One place for every toast on the page: the top of the screen, over the header's row (Ahead's team name), its right end
 * clear of the avatar (m.css #toasts). The review of 2026-10-08: placed where its Undo covered no control (a search from
 * the foot, nudged up; since gone), "Bassey in · +5.7 pts · Undo" sat over the pitch's midfield, on the IN card of the
 * buy it was about, for 6–60 s (a toast with Undo stays until your next touch, A9), and a reviewer saw it "change
 * position"; the header's row holds nothing to tap but the avatar and "Help", which hides while a toast is up
 * (m-ahead.css .ah-help), and of what an edit changes only the GW line's total (since 2026-10-22), whose change waits
 * for the toast to go (ahead.js renderTotal; the v1.3.75 review #18). It never moves for the page: a toast up is
 * placed again only for a sheet coming or going.
 * QA-5 #2 (QA-3 #6b): taps pass through its body (m.css: only its Undo takes one). With the page scrolled so a row
 * sits under it, its Undo still takes the tap (H1, 2026-10-09: dimmed and passing it on, it ended the toast with the
 * edit kept; guard).
 *
 * QA-7 #1: while a sheet is up the region goes where none of the sheet's controls can be, whatever the sheet scrolls:
 * above the sheet when it fits there (over the scrim: the page under it takes no tap), else in a dock at the bottom of the screen that the sheet keeps clear (its body ends above the
 * region: m.css --toast-dock; the scroll range it adds stays for the sheet's life, so nothing in the sheet moves when
 * the dock comes or goes).
 *
 * QA-6 #1: its Undo takes a tap only while that holds on the screen as it is now (m.css .toast.armed): never before the
 * toast has come in (its entrance moves it, and it is placed once more on the layout the edit that raised it re-drew,
 * before it is first drawn), and on a sheet never while a control a tap would reach is under it (guard: after every
 * re-draw, class or style change before the next task (a tap, a timer) runs, right after a script's scroll, on every
 * scroll or resize event, and every frame while a toast is up, which catches a transition or an animation moving one),
 * when it is placed again once the page settles.
 * A replaced toast takes no room as it leaves (m.css), so the one replacing it is placed where it stays. One changed in
 * place (ui.toast's replaces: an edit's verdict over its pending toast, B23) is never added again: it keeps its place,
 * data-in and armed Undo, so the Undo takes the tap the moment the verdict shows.
 */
let toastsPlaced = false;
function placeToasts() {
  // once a page: boot runs again after sign-out's Undo and a connect retry, and each run added its listeners and
  // observer again (review 5, 2026-10-12)
  if (toastsPlaced) return;
  toastsPlaced = true;
  // C (2026-10-06): a finger down on a toast's armed Undo holds the region where it is, armed, until its tap ends (its
  // click, a cancel, or PRESS_MS after the finger lifts with no click): a sheet coming or going meanwhile would move it
  // between the finger going down and the click, which then lands on what was under it.
  let pressed = null;
  const PRESS_MS = 500;
  const release = () => { if (!pressed) return; delete pressed.dataset.held; pressed = null; redrawn(); };
  document.addEventListener('pointerdown', (e) => {
    const t = e.target.closest?.('#toasts .toast');
    if (t?.classList.contains('armed') && e.target.closest('button.btn')) { pressed = t; t.dataset.held = '1'; }  // ui.toast waits too
  }, true);
  document.addEventListener('pointerup', () => { if (pressed) setTimeout(release, PRESS_MS); }, true);
  for (const k of ['click', 'pointercancel']) document.addEventListener(k, () => { if (pressed) setTimeout(release, 0); }, true);
  // the page's controls (CONTROLS) as last queried: kept until the page changes (the MutationObserver below drops them),
  // so the guard that runs every frame while a toast is up never queries the whole document again (QA-7 #2)
  let ctrls = null;
  const controlsOf = (region) => (ctrls ??= [...document.querySelectorAll(CONTROLS)].filter((c) => !region.contains(c)));
  let docked = null;  // the sheet keeping its dock clear for the region
  const undock = () => { docked?.style.removeProperty('--toast-dock'); docked = null; };
  const DOCK_GAP = 8;  // px between the region and the sheet's body (or the sheet's top edge)
  /** A sheet up: above it when the region fits there, else docked at the screen's bottom with the sheet's body ending
   *  DOCK_GAP above it (--toast-dock-room, the most it ever took, keeps the scroll range: m.css .m-sbody). */
  const placeOnSheet = (region, sheet) => {
    region.dataset.place = 'top';
    if (region.getBoundingClientRect().bottom + DOCK_GAP <= sheet.top) { undock(); return 'top'; }
    region.dataset.place = 'dock';
    const d = Math.ceil(sheet.bottom - region.getBoundingClientRect().top + DOCK_GAP);
    if (docked !== sheet.el) undock();
    docked = sheet.el;
    docked.style.setProperty('--toast-dock', `${d}px`);
    const room = parseFloat(docked.style.getPropertyValue('--toast-dock-room')) || 0;
    if (d > room) docked.style.setProperty('--toast-dock-room', `${d}px`);
    // the sheet's body now ends above the toast: its page keeps the control just tapped in view (Ahead: m-dock)
    docked.dispatchEvent(new CustomEvent('m-dock'));
    return 'bottom';
  };
  // el: the toast just added (its entrance slides from the edge it shows at: its own class, so placing the region again
  // never restarts it); none when a toast up is placed again
  const place = (region, el = null) => {
    if (pressed?.isConnected) return;  // placed again once the tap on it ends (release)
    const sheet = sheets.top();
    if (sheet) { el?.classList.toggle('up', placeOnSheet(region, sheet) === 'bottom'); return; }
    // the page: always the top (the review of 2026-10-08), never by where you tapped or what is under it
    undock();
    region.dataset.place = 'top';
    el?.classList.remove('up');
  };
  /** Whether a toast's button b covers a control a tap there would reach without the toast: their boxes overlap and the
   *  page under the toast at the overlap's middle is that control (one under a sheet's scrim, or hidden from taps, is
   *  not: elementsFromPoint skips what takes no tap, and the toast's own parts are passed over). */
  const blocks = (b, region, controls) => {
    const q = b.getBoundingClientRect();
    return controls.some((c) => {
      const x = ui.overlapOf(q, c.getBoundingClientRect());
      if (!x) return false;
      const under = document.elementsFromPoint((x.left + x.right) / 2, (x.top + x.bottom) / 2).find((e) => !region.contains(e));
      return !!under && c.contains(under);
    });
  };
  let raf = 0;
  /** Each toast's Undo takes a tap (.armed) once it has come in (data-in): on the page whatever has scrolled under it
   *  (H1, 2026-10-09: a shirt or a row tapped low down left the switcher under it; dimmed, it passed the tap on, the
   *  toast ended and the edit stayed, and Undo is the app's only safety net), on a sheet while it blocks no control
   *  (one that does lets taps through and is placed again once the page settles). Runs again next frame while a toast
   *  is up. */
  const guard = () => {
    const region = document.getElementById('toasts');
    const live = region ? [...region.querySelectorAll('.toast:not(.leaving)')].filter((t) => t.querySelector('button.btn')) : [];
    if (!live.length) return;
    let controls = null, stuck = false;
    const onSheet = !!sheets.top();
    for (const t of live) {
      if (t === pressed) continue;  // armed until the tap on it ends
      let ok = !!t.dataset.in && !onSheet;
      if (t.dataset.in && onSheet) {
        controls ??= controlsOf(region);
        ok = ![...t.querySelectorAll('button')].some((b) => b.getClientRects().length && blocks(b, region, controls));
        stuck ||= !ok;
      }
      if (t.classList.contains('armed') !== ok) t.classList.toggle('armed', ok);
      if (ok && !t.dataset.armedOnce) { t.dataset.armedOnce = '1'; t.dispatchEvent(new Event('toast-armed')); }  // its time starts (ui.toast)
    }
    if (stuck) redrawn();
    raf ||= requestAnimationFrame(() => { raf = 0; guard(); });
  };
  /** A toast just added: placed before it is first drawn (the next frame's start), on the layout the edit that raised it
   *  re-drew (Ahead re-draws in a microtask after the tap, and keeps the tapped control where it was), never on the
   *  layout before it (QA-7 #2: measuring that one too cost a forced layout and a scan of every control in the tap); its
   *  entrance slides from the edge it shows at (its 'up' class, set there before any frame); its Undo is armed once the
   *  entrance has ended. */
  const added = (region, el) => {
    requestAnimationFrame(() => {
      if (!el.isConnected || el.classList.contains('leaving')) return;
      place(region, el);
      guard();  // a toast already up moved with the region
      Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(() => { if (el.isConnected) { el.dataset.in = '1'; guard(); } });
    });
  };
  let timer = 0;
  const again = () => { timer = 0; const r = document.getElementById('toasts'); if (r?.querySelector('.toast')) { place(r); guard(); } };
  // a scroll or a resize: once it has settled (each event starts the wait over, so a toast never moves mid-gesture)
  const settle = () => { clearTimeout(timer); timer = setTimeout(again, PLACE_SETTLE_MS); };
  // a toast coming or going, or the page re-drawn under one (a plan landing moves its rows): once per wait, never put
  // off by the next re-draw (the deadline's countdown re-draws every second)
  function redrawn() { if (!timer) timer = setTimeout(again, PLACE_SETTLE_MS); }
  ui.setToastPlace(added);
  // a script's scroll (scrollIntoView, scroll/scrollTo/scrollBy, scrollTop/Left: the screen keeping a tapped control in
  // place, a sheet's list, a test driver) moves the page at once, while its scroll event comes a frame later: the
  // toasts are checked right after it, as after a re-draw
  for (const o of [Element.prototype, window]) {
    for (const k of ['scrollIntoView', 'scroll', 'scrollTo', 'scrollBy']) {
      const f = o[k];
      if (typeof f === 'function') o[k] = function (...a) { const r = f.apply(this, a); guard(); return r; };
    }
  }
  for (const k of ['scrollTop', 'scrollLeft']) {
    const d = Object.getOwnPropertyDescriptor(Element.prototype, k);
    if (d?.set) Object.defineProperty(Element.prototype, k, { ...d, set(v) { d.set.call(this, v); guard(); } });
  }
  document.addEventListener('scroll', () => { guard(); settle(); }, true);
  window.addEventListener('resize', () => { guard(); settle(); });
  // a mutation's callback runs before the next task (a tap, a timer), so a re-draw, or a class or style that moves a
  // row, never leaves an armed Undo over a control for one: the toasts' own changes (arming, placing) are not the page's
  new MutationObserver((records) => {
    const region = document.getElementById('toasts');
    const page = region ? records.filter((r) => r.type === 'childList' || !region.contains(r.target)) : records;
    if (page.length) ctrls = null;
    if (!region?.querySelector('.toast')) { undock(); return; }  // the last toast gone: the sheet's dock too
    if (!page.length) return;
    guard();
    if (page.some((r) => r.type === 'childList')) redrawn();
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
  // a sheet opening or closing (createSheets: :root.m-sheeted) moves the region on or off the sheets
  new MutationObserver(() => { if (document.getElementById('toasts')?.querySelector('.toast')) { guard(); redrawn(); } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

async function boot() {
  if (studioLink()) return;
  placeToasts();
  ui.toastRegion();  // B115: the live region is up before the first toast, so that one is announced too
  applyTheme();
  // iOS Safari shows :active only under a touchstart listener: the toasts hang off <body>, outside the screen's own
  document.addEventListener('touchstart', () => {}, { passive: true });
  renderBanner();
  // a history load (Back/Forward past the bfcache) takes the page and its scripts from the browser's cache without
  // asking, so this code may be an older release than the one served, and reloadIfReleased would keep the served one as
  // its own: a reload asks for each again by its ETag (304s where nothing changed; the review, 2026-10-23, of no-cache
  // replacing no-store). Never twice: after it the navigation is a reload
  if (globalThis.performance?.getEntriesByType?.('navigation')[0]?.type === 'back_forward') { location.reload(); return; }
  reloadIfReleased();  // the release this page runs, kept to compare when it is shown again
  if (signOutIfAway()) return;  // back after FORGET_MS away: Connect, the team's choices gone
  const entry = store.get('entry');
  if (!entry) return showConnect();
  // warm start: the last snapshot draws at once, the server refreshes it behind (an address without a GW: GW A)
  if (!location.hash || location.hash === '#' || location.hash === '#/') history.replaceState(null, '', `#/${SCREEN}`);
  gate.hidden = true;
  route();
  const snap = api.loadSnapshot(entry);
  if (snap) accept(entry, snap.bundle, { at: snap.at, snapshot: true });
  try {
    await loader.load();
  } catch (e) {
    if (!store.get('bundle')) showConnect({ error: api.plain(e, { entry }), retry: () => boot(), value: entry });
  }
}

boot();
