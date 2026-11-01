// Forkcast shell (static/m/index.html): hash router, shared store, sheet manager, Connect screen, bundle loader with
// its state banner, first load's progress line (IPHONE_DESIGN, DESIGN_V2 §3; ACCESS_V2: no pairing, a typed Team ID is
// the whole onboarding). Ahead is the one screen (#/ahead?gw=8 canonical; #/week or a bare #/ land there); screen and
// sheets are separate modules that plug in as below.
//
// ================================================================ SCREEN MODULE CONTRACT
// static/js/m/ahead.js (Ahead):
//   export function mount(el, ctx) → handle | void
//   export const css = '/css/…'                optional; linked once, before the first mount
// el      the screen's empty <section class="m-screen">; it owns its children and scrolls. Put <div
// data-banner-slot></div> under the header for the state banner (else it goes first in el).
// handle  {update?(why), show?(), hide?(), unmount?()}: update gets why = 'bundle' (new bundle or baking step) or
// 'conn'; show once laid out; unmount before the shell drops the screen (team switch, re-mount: without update the
// shell re-mounts on 'bundle').
// mount runs once a bundle exists (any state: the screen draws its own baking/skeleton state from ctx.bundle.state and
// .bake). Shared state (selected GW…) goes through ctx.store.
//
// SHEET MODULES static/js/m/sheets/<name>.js (you, why, player, replace, wish, chips, about):
// export function open(ctx, ...args) → sheet      via ctx.openSheet(name, ...args); built with ctx.sheets.open();
// #/player/<id> calls openSheet('player', id).
//
// ctx (one live object; getters return current values)
// bundle     GET /api/m/bundle data (§7.4 shape) or null. While its roads are from an older data version
// (meta.roads_version ≠ version: re-baking), their weeks lose `pred`, so every score of them uses today's forecast
// (PC-3)
// data       derived from bundle in derive() (null with it): {rows, byId: Map(id → row), players (/api/players-shaped:
// {horizon: xpGws, players: rows}), base (engine `base`: season, entry_id, gw, squad [row + sell_price,
// purchase_price], bank, ft, chips_available, chips_used, horizon), lineup ({xi, bench, captain, vice}: the entry's FPL
// picks when the bundle has them, else engine.bestXI), gw (next deadline GW), horizon ([gw…], the plan's weeks), reach
// ([gw…gw+3], the longest plan's), xpGws ([gw…forecast_edge]), noise, seeds (or null), receivedAt (ms)}
// store      get(key), set(key, value) | set({k: v}), on(key, fn(value, prev)) → off, persist(key, fallback)
// (localStorage fc:s:<key>). Shell keys: entry (connected team ID, string); gw (selected GW: #/ahead?gw=; none = GW A,
// the next deadline); conn {state: 'ok'|'baking'|'stale'|'updating'|'offline-data'|'offline', at (ms this phone first
// got the plan it shows), bake: {done, total} | null, error | null}. bundle.state 'offline-data' = no next GW
// (pre-season / season over): no entry, players or roads; the screen says "No deadline coming up".
//   api        static/js/m/api.js (request, getBundle, solve with 700 ms polling, putMemory, plain …)
// sheets     open({title, sub, detent: 'small'|'medium'|'large', detents, build(body, sheet), onClose, label, cls,
// close: true, fit: false}) → sheet {el, body, detent, setDetent(d), close()}; closeAll(), depth(), top(),
// afterPop(fn). At most 2 deep: a third replaces the top. Each is a history entry (Back closes it). None is aria-modal:
// while one is up the page and sheets under it are inert. fit: medium detent no taller than the content.
// navigate(name, params, {replace, top})   'ahead' ({gw}) | 'player' ({id}); top: Ahead at its top (default: !replace)
//   openSheet(name, ...args)            lazy-load sheets/<name>.js, call its open(ctx, ...args)
//   engine     static/js/plan/engine.js      calls   static/js/m/calls.js
//   kits       static/js/plan/kits.js        pitch   static/js/plan/pitch.js (mountPitch for phones)
//   ui         static/js/ui.js (h, svg, fmt, toast …; m.css restyles toasts for the phone)
//   status()   {tone: 'fresh'|'amber'|'none', text}: the avatar dot
// refresh({hard}) → Promise<bundle|null>   re-fetch (hard = ?refresh=1: refetch the entry and re-bake); failures show
// as banner or toast, never reject
//   connect(entry)                      switch team: first load for that ID
// signOut() → {name} | null           this device forgets the team (entry, local mirror; server plan memory stays,
// recent chips keep it), shows Connect
// teamPicker(opts)                    ./picker.js teamPicker(ctx, opts): the team picker Connect and Switch team share
// weeks() → n | null · setWeeks(n)    Settings → Plan ahead: the weeks asked for this team (weeksOf); a new pick is
// kept per team in this browser and the bundle asked at once
//   reveal     true during the first mount after Connect's first load
//   (local vs remote, for dev-only entries: api.access())

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
const SCREEN = 'ahead';

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
    /** Persists `k` in localStorage (fc:s:<k>); loads the saved value now, else `fallback`. */
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
 *  fplMarks): the bundle's entry picks (api/entry.py xi / bench / captain / vice from the last deadline's picks), or GW
 *  gw's own once FPL has published them (entry.published, mobile.py _published: rare). Never lineupNow's best-XI
 *  stand-in: null then. */
function fplTeam(e, gw) {
  const t = e?.published?.gw === gw ? e.published : e;
  if (!Array.isArray(t?.xi) || t.xi.length !== 11) return null;
  const id = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
  return { xi: t.xi.map(Number), bench: (t.bench || []).map(Number), captain: id(t.captain), vice: id(t.vice) };
}

/** The planned GWs of meta: meta.horizon, else GW A and the three after. */
const horizonOf = (m = {}) => (Array.isArray(m.horizon) ? m.horizon.map(Number) : range(Number(m.gw), Number(m.gw) + 3));
/** The GWs the longest plan reaches (meta.reach, else the planned ones). */
const reachOf = (m = {}) => (Array.isArray(m.reach) ? m.reach.map(Number) : horizonOf(m));

/** Settings → Plan ahead (owner, 2026-10-14): the weeks picked for team `entry`, in localStorage (the bundle request
 *  needs it before plan memory is known). */
const HORIZON_KEY = (entry) => `fc:horizon:${entry}`;
/** The weeks to ask `entry`'s bundle for: the pick within b's locks and reach (calls.planWeeks; the server falls back
 *  alike); null without a pick and a bundle. */
const weeksOf = (entry, b = store.get('bundle')) => calls.planWeeks(api.local.get(HORIZON_KEY(entry)), b?.meta?.locked, b?.meta ? reachOf(b.meta).length : null);

/** Plan progress in one line: "Planning GW6–9 · ~1 min left" (calls.planEta; no road count: owner, 2026-10-13),
 *  "Planning GW6–9" before any road is done, "Planning…" before the GWs are known. Bar: etaBar. */
function planning(gws, bake) {
  if (!gws?.length) return 'Planning…';
  const e = calls.planEta(bake);
  return `Planning ${calls.COPY.span(gws)}${e.left == null ? '' : ` · ${calls.leftText(e)}`}`;
}

/** A bake's bar (`tag`: banner 'span.m-banner-bar' or first load 'div.m-bar'; `full`: done): its share by time
 *  (calls.planShare; owner, 2026-10-13), redrawn every second, eased over it (m.css .m-eta: 1 s linear width); a sweep
 *  while nothing is estimated. */
let etaTimer = null;
function etaBar(tag, bake, full = false) {
  const i = h('i.m-eta', { dataset: { eta: '' } });
  Object.assign(i, { _bake: bake, _full: full });
  paintEta(i);
  etaTimer ??= setInterval(() => {
    // only bars made here: Ahead's story bar (i.m-eta too) is painted by ahead.js paintStoryBar (owner, 2026-10-28)
    const bars = document.querySelectorAll('i.m-eta[data-eta]');
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

/** Client-side views of a bundle (ctx.data); the bundle stays as sent. Rows: players with the live and prices blocks
 *  laid over (calls.shownPlayers). */
function derive(b, receivedAt) {
  const m = b.meta || {};
  const cols = calls.shownPlayers(b);
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
const FIT_ROOM = 12;   // px under a fit sheet's content
const DISMISS_PX = 130;  // px below the smallest detent at which a drag's end (with ui.flick) closes a sheet

/** landed(to): a pop of sheets' history entries landed (the router's carry). */
function createSheets(app, { landed = () => {} } = {}) {
  const stack = [];
  const sync = () => {
    app.classList.toggle('sheet-large', stack.some((s) => s.detent === 'large'));
    document.documentElement.classList.toggle('m-sheeted', stack.length > 0);  // toasts are placed on the sheet (placeToasts)
    stack.forEach((s, i) => s.el.classList.toggle('back', i < stack.length - 1));
    // while a sheet is up the page and the sheets under it take no tap, focus or reading; #toasts hangs off <body>, so
    // its Undo stays in reach
    const modal = stack.length > 0;
    // …and the screen stays inert while Connect is up (showGate), sheet or not
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
    // fit: short content rests at its own height, never taller than the detent
    return sheet.fit ? Math.min(at, contentOf(sheet)) : at;
  };
  /** Content height: grabber to the last child's bottom, unscrolled, plus FIT_ROOM (the body's bottom padding is scroll
   *  room, not shown under a short body). */
  const contentOf = (sheet) => {
    const b = sheet.body;
    let bottom = b.getBoundingClientRect().top;
    for (const c of b.children) bottom = Math.max(bottom, c.getBoundingClientRect().bottom);
    return Math.ceil(bottom + b.scrollTop - sheet.el.getBoundingClientRect().top + FIT_ROOM);
  };
  const offset = (sheet, d = sheet.detent) => Math.max(0, sheet.el.offsetHeight - heightOf(sheet, d));
  /** Slide the sheet to its detent; --sheet-off (m.css .m-sbody) ends its body at the screen's bottom, so every control
   *  scrolls into view. */
  const place = (sheet) => {
    const off = offset(sheet);
    sheet.el.style.transform = `translateY(${off}px)`;
    sheet.el.style.setProperty('--sheet-off', `${off}px`);
    sync();
  };
  /** Its detents, smallest first. */
  const orderOf = (sheet) => ['small', 'medium', 'large'].filter((d) => sheet.detents.includes(d));
  const atTop = (sheet) => sheet.detent === orderOf(sheet).at(-1);

  // each sheet is a history entry of its own ({sheet: n}, n its depth; address unchanged): Back closes it (popstate).
  // The #/player sheet has its hash entry instead (routed). Any other close (✕, swipe, scrim, Escape, close
  // / closeAll) pops its entry, a whole close in one history.go; history writes meanwhile (sheet push, navigate) wait
  // for that pop (afterPop)
  let owed = 0, popping = 0, from = null, bare = false;  // history.go calls not landed yet
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
    // Back: the sheets above the entry it landed on close, as Escape closes them
    for (let s = stack.findLast((x) => x.entry); s && entries() > want; s = stack.findLast((x) => x.entry)) {
      if (!s.dismissible) { history.pushState({ sheet: entries() }, ''); break; }
      dismiss(s, { popped: true });
      closed = true;
    }
    // the entry landed on takes the sheets' address (GW picked meanwhile, signOut's); for Back, the screen's own
    if (ours || closed) landed(ours ? from : null);
    while (later.length && !owed && !popping) later.shift()();
  });

  function dismiss(sheet, { instant = false, keep = false, popped = false } = {}) {
    const i = stack.indexOf(sheet);
    if (i < 0) return;
    stack.splice(i, 1);
    // entry: Back already popped it; a replacing sheet keeps it (two-deep rule); else popped now
    if (sheet.entry && !keep && !popped && !owed++) queueMicrotask(flush);
    // Reduce Motion: fades in place, no slide
    if (ui.reduceMotion()) sheet.el.classList.add('m-fade');
    else sheet.el.style.transform = 'translateY(100%)';
    sheet.scrim.classList.remove('on');
    sync();
    setTimeout(() => { sheet.el.remove(); sheet.scrim.remove(); }, instant ? 0 : 450);
    // focus to the opener, or its replacement if redrawn (ui.focusKey), else the page's focus home (Ahead's week line);
    // under another sheet: its opener or replacement, else that sheet
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
    // while it drags the body runs to the sheet's bottom (below the screen), so dragging up shows content. Starts where
    // the sheet is now, caught mid-slide too (transition dropped: .dragging), never from its resting place; a closing
    // sheet isn't caught
    const start = (y, t) => {
      if (!stack.includes(sheet)) return;
      y0 = y; last = y;
      base = new DOMMatrix(getComputedStyle(el).transform).m42;
      fl = ui.flick().add(y, t);
      el.classList.add('dragging');
      el.style.transform = `translateY(${base}px)`;
      el.style.setProperty('--sheet-off', '0px');
    };
    // above its largest detent it moves a third as far as the finger; place() brings it back
    const move = (y, t) => {
      if (y0 == null) return;
      last = y;
      fl.add(y, t);
      const at = base + y - y0;
      el.style.transform = `translateY(${at < 0 ? at / 3 : at}px)`;
    };
    // release point carried by ui.flick (speed over the last ~100 ms, not the drag's average): DISMISS_PX below the
    // smallest detent's rest and below where it was caught (a tap on a sheet still sliding up never closes it) closes;
    // else the nearest detent
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
    // grabber and header drag with a pointer (mouse or touch)
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
    // the body drags down only from its top; a swipe up below the largest detent expands before scrolling (as iOS
    // sheets); else it scrolls
    const body = sheet.body;
    let ty = null, tt = 0;
    body.addEventListener('touchstart', (e) => {
      ty = (body.scrollTop <= 0 || !atTop(sheet)) && !e.target.closest('[data-nodrag], input, textarea') ? e.touches[0].clientY : null;
      tt = e.timeStamp;
    }, { passive: true });
    body.addEventListener('touchmove', (e) => {
      if (ty == null) return;
      // a gesture inside owns the finger (Ahead's lifted move row): never a sheet drag
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
    // the replaced sheet gives it its history entry (a pop then a push would land the push first)
    const gone = stack.length >= 2 ? stack[stack.length - 1] : null;
    if (gone) dismiss(gone, { instant: true, keep: true });
    const routed = bare;
    bare = false;
    const z = 240 + stack.length * 20;
    const scrim = h('div.m-scrim', { style: { zIndex: z } });
    const body = h('div.m-sbody');
    // never aria-modal (the page under is inert instead: sync): the toasts' Undo stays in reach
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
    // Reduce Motion: placed at once, fades in (m.css: the transition is opacity alone)
    const still = ui.reduceMotion();
    if (still) el.classList.add('m-fade');
    void el.offsetHeight;  // commit the off-screen start so placing slides it up
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
    closeAll: () => [...stack].reverse().forEach((s) => dismiss(s)),
    depth: () => stack.length,
    afterPop,
    /** The next sheet opened is the #/player route's: its hash entry is its history entry (false: cancel). */
    routed: (on = true) => { bare = on; },
    /** The top sheet: {el, top, bottom}, its viewport edges once resting at its detent; bottom is where its body's room
     *  ends (screen bottom at any detent: place); null with no sheet. */
    top: () => {
      const s = stack[stack.length - 1];
      if (!s) return null;
      const y = app.getBoundingClientRect().top + s.el.offsetTop;
      return { el: s.el, top: y + offset(s), bottom: y + s.el.offsetHeight };
    },
  };
}

// ================================================================ small shared pieces

/** Load a screen or sheet module once (null if it can't load, no console error). A failed fetch isn't remembered: the
 *  next call retries. */
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

/** Prefetch the screen and sheet modules, so an app that loses the server still shows Ahead and Why from its snapshot
 *  (no service worker over plain HTTP). */
const LAZY = [`./${SCREEN}.js`, ...['why', 'player', 'replace', 'wish', 'you', 'chips', 'about'].map((n) => `./sheets/${n}.js`)];
let preloaded = false;
function preloadModules() {
  if (preloaded) return;
  preloaded = true;
  setTimeout(() => LAZY.forEach((rel) => optionalModule(rel)), 400);
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
  navigate,
  openSheet: (name, ...args) => openSheet(name, ...args),
  // the bundle only when the refresh worked, else null (a toast or the off-line banner says why)
  refresh: (o) => loader.load({ refresh: !!o?.hard, manual: true }).then((b) => (loader.ok ? b : null)).catch(() => null),
  connect: (entry) => firstLoad(String(entry)),
  factPanel,
  signOut: () => signOut(),
  teamPicker: (opts) => teamPicker(ctx, opts),
  status,
  weeks: () => weeksOf(store.get('entry')),
  // the weeks picked: kept, and the bundle asked for that plan now (a bake, with the banner, if none yet)
  setWeeks: (n) => { api.local.set(HORIZON_KEY(store.get('entry')), String(n)); return ctx.refresh(); },
  // Chips… opened on GW g: its chips are solved now, the server's (the bundle's cg) and your rules' (ahead.chipPreps);
  // none before, none of a GW never opened (owner, 2026-10-28); kept for the team until sign-out
  askChips: (g) => {
    const entry = String(store.get('entry')), was = store.get('chipsAt');
    const gws = String(was?.entry) === entry ? was.gws : [];
    if (gws.includes(Number(g))) return;
    store.set('chipsAt', { entry, gws: [...gws, Number(g)] });
    loader.load().catch(() => {});
  },
};

function status() {
  const s = store.get('conn')?.state;
  if (s === 'offline') return { tone: 'none', text: 'Forkcast server unreachable' };
  if (s === 'ok' || s === 'offline-data') return { tone: 'fresh', text: 'Up to date' };
  return { tone: 'amber', text: s === 'updating' ? 'The forecast is updating' : 'Plan is updating' };
}

// ================================================================ theme

// Light only (owner, 2026-10-08): html[data-theme=light] (index.html sets it before first paint) makes every
// light-dark() token light; the turf keeps its dark scheme (plan-pitch.css).
function applyTheme() {
  document.documentElement.dataset.theme = 'light';
}

// ================================================================ router (#/ahead?gw=8, #/player/<id>; #/week, #/ and #/ahead → #/ahead?gw=A)

function parseHash(hash = location.hash) {
  const [path, q = ''] = hash.replace(/^#\/?/, '').split('?');
  const [name, id] = path.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(q));
  if (name === 'player' && /^\d+$/.test(id || '')) return { name, params: { ...params, id: Number(id) } };
  // #/week and a bare #/ are Ahead (old links keep working); without a GW, GW A
  return { name: SCREEN, params: name === SCREEN ? params : {} };
}

/** An address without a GW (#/week, bare #/, home-screen #/ahead) opens GW A, the next deadline: now with a bundle,
 *  else once it comes (accept). */
let wantA = false;
const gwA = () => store.get('data')?.gw ?? null;

const hashOf = (name, params = {}) => {
  if (name === 'player') { const { id, ...rest } = params; return `#/player/${id}${qs(rest)}`; }
  return `#/${name}${qs(params)}`;
};

/** top: the screen goes to its top (default unless replace). Runs after the closed sheets' history pops
 *  (sheets.afterPop), else the pop would take it back. */
function navigate(name, params = {}, { replace = false, top = !replace } = {}) {
  sheets.afterPop(() => {
    const hash = hashOf(name, params);
    // a sheet's edit (Add a player, Sell from…) lands at the screen's top with the GW it made on the switcher, not
    // where a low tap had scrolled it (replaces the address)
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
  // the canonical address (an old #/week is rewritten in place; a sheet's entry keeps its marker)
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
/** A pop of the sheets' entries landed (createSheets). The entry landed on may hold an older address (a GW picked under
 *  a sheet rewrote only the sheet's), so it takes `to` (the sheets' address, else the screen's canonical one); its
 *  hashchange is not a route (it would switch the week back). */
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

/** Tell the screen it is on show, once per mount (after mount if the bundle came later). */
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
        s.fresh = true;  // mounted: show() once laid out (showScreen, or accept for a cold start)
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
    // the bake's progress (a new forecast's roads while the old show, stale; or the first): bar by time
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
/** The next poll by bundle state; a ready one whose chips still pre-solve comes back sooner. */
const pollMs = (b) => (b.state === 'ready' && b.bake?.chips?.pending ? POLL_MS.chips : POLL_MS[b.state] ?? POLL_MS.ready);
const BACKOFF_MS = [5000, 10000, 20000, 30000];

/** GET the bundle. With the same entry's previous bundle: ?have=<its version> (unchanged data version: no players or
 *  seeds; keep the old) and ?hl=<its live block's stamp> (unchanged: null; keep the old). The prices block comes with
 *  every reply; derive lays both over the kept players (calls.shownPlayers). Plans the weeks picked (weeksOf). Cards
 *  come apart (cl=1: askCards) and ride on every bundle as held. */
async function fetchBundle(entry, { refresh = false, prev = null } = {}) {
  const same = String(prev?.entry?.id) === String(entry);
  const have = prev?.version && same ? prev.version : null;
  const hl = same ? prev.live_v ?? null : null;
  // a bundle held from before (snapshot, loader) brings its cards: their stamp is asked again, not the cards
  if (same && prev.cards && String(held.entry) !== String(entry)) Object.assign(held, { entry: String(entry), cards: prev.cards, v: prev.cards_v ?? null, version: prev.version ?? null, key: null, at: 0 });
  const w = weeksOf(entry, prev ?? undefined);
  const asked = store.get('chipsAt');
  const b = await api.getBundle(entry, { refresh, have, hl, w, cl: true, cg: String(asked?.entry) === String(entry) ? asked.gws : null });
  askCards(entry, b, w);
  // only cards asked after a bundle of this data version (else the GW before's cards); none meanwhile, and a card
  // opened asks GET /api/m/player
  const mine = String(held.entry) === String(entry) && held.version === b.version ? held : { cards: null, v: null };
  const kept = have && b.version === have && b.players == null && b.seeds == null;
  return { ...(kept ? { ...b, players: prev.players, seeds: prev.seeds } : b),
    ...(kept && b.live == null && hl && b.live_v === hl ? { live: prev.live ?? null } : {}),
    // a server that sent cards anyway (pre-cl) is read as before
    ...(b.cards ? {} : { cards: mine.cards, cards_v: mine.v }) };
}

// ================================================================ the cards (api/card.py), apart from the bundle

/** The players' cards (sheets/player.js fromBundle), asked right after the bundle (GET /api/m/cards; owner, 2026-10-26:
 *  they slowed a new team's first bundle, and the pitch draws without them): cards, their stamp `v` (?hc=v: same cards
 *  come back as none), `key` the bundle asked after, `at` when. A card opened before they land asks GET /api/m/player. */
const held = { entry: null, cards: null, v: null, version: null, key: null, at: 0, asking: false };
/** Asked once the plan is in (its base road, or none coming: firstLoad's wait), again after a bundle whose players may
 *  have changed (data version, roads or state) or CARDS_AGAIN_MS (plan memory's own players), never two at once;
 *  `version`: the data version they were asked after, `w` its weeks. */
const CARDS_AGAIN_MS = 120000;
function askCards(entry, b, w) {
  if (!b?.entry || (!b.roads?.base && (b.state === 'baking' || b.state === 'updating')) || held.asking && String(held.entry) === String(entry)) return;
  if (String(held.entry) !== String(entry)) Object.assign(held, { entry: String(entry), cards: null, v: null, version: null, key: null, at: 0 });
  const key = [b.version, b.meta?.roads_version, b.state].join('|');
  if (held.key === key && Date.now() - held.at < CARDS_AGAIN_MS) return;
  const hc = held.cards ? held.v : null;
  held.asking = true;
  api.getCards({ entry, hc, w }).then((c) => {
    if (String(held.entry) !== String(entry)) return;
    const got = c.cards ?? (hc && c.cards_v === hc ? held.cards : null);
    Object.assign(held, { cards: got, v: got ? c.cards_v : null, version: b.version, key, at: Date.now() });
    landCards(entry);
  }, () => {}).finally(() => { if (String(held.entry) === String(entry)) held.asking = false; });  // failed: asked with the next bundle
}
/** Cards landed: into the bundle on screen quietly and in place (no reader draws from them until a card opens; its
 *  identity kept, which ahead.js inputsOf and the plan's memos key on), loader.last, and the offline snapshot. */
function landCards(entry) {
  const b = store.get('bundle');
  if (!b || String(store.get('entry')) !== String(entry) || String(b.entry?.id) !== String(entry) || b.version !== held.version || b.cards === held.cards) return;
  const was = loader.last === JSON.stringify(b);
  Object.assign(b, { cards: held.cards, cards_v: held.v });
  if (was) loader.last = JSON.stringify(b);
  if (store.get('conn')?.state !== 'offline' && !store.get('conn')?.snapshot && b.roads?.base) api.saveSnapshot(entry, b);
}

const loader = {
  timer: null, seq: 0, misses: 0, last: '', plan: { v: undefined, at: NaN }, ok: false,
  schedule(ms) { clearTimeout(this.timer); this.timer = ms ? setTimeout(() => this.load().catch(() => {}), ms) : null; },
  /** → the bundle for the connected entry (throws when there is nothing to show). */
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
      // Server away (no answer, or 503 / 504) = off line: the banner says the data's time, edits wait, You → Connection
      // says so. With a bundle on screen, only once api.offlineNow says so (second miss in a row, or one unanswered
      // after 10 s).
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

/** older roads rescored on today's forecast (their stored pred is old: ctx.bundle) */
function todaysRoads(b) {
  const v = b?.version, rv = b?.meta?.roads_version;
  if (!b?.roads || !v || !rv || rv === v) return b;
  const strip = (r) => (r?.weeks ? { ...r, weeks: r.weeks.map(({ pred, ...w }) => w) } : r);
  const each = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, r]) => [k, strip(r)]));
  const R = b.roads;
  return { ...b, roads: { ...R, base: strip(R.base), roll: strip(R.roll), veto: each(R.veto), slide: each(R.slide), chip: each(R.chip) } };
}

/** Take a bundle into the store and offline snapshot; screens hear 'bundle' when it changed. */
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
    // the saved bundle of a warm start, until a live one lands (ahead.sayCheer)
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
    // a cold start mounts the screen here (showScreen ran without a bundle): show it too
    ensureMounted().then(() => { if (screen.fresh) shown(); });
    if (!offline) preloadModules();
  }
}

document.addEventListener('visibilitychange', async () => {
  // hidden: away counts from here unless it already does (a page left open unused FORGET_MS, then reloaded, is signed
  // out); shown again: reload into a new release if the server moved to one, else sign out after FORGET_MS away
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
    // engage only on a clear downward pull from the top (not a sideways drag or a gesture below)
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

/** Until sheets/player.js lands: who he is and his next five xP (#/player/<id> works). */
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
  // the plan behind Connect takes no tap, focus or reading (VoiceOver reached its rows under a class-only gate)
  screen.el.inert = true;
  fill(gate, ...kids);
}
function hideGate() {
  // a straight swap to the plan, no cross-fade of the landing
  document.documentElement.classList.remove('m-gated');
  screen.el.inert = false;
  gate.hidden = true;
  gate.className = 'm-gate';
  gate.replaceChildren();
}

/** Keep the page scrollable above the iOS keyboard (visualViewport shrinks: m.css pads by --kb). */
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

/** Connect (DESIGN_V2 §3): the promise, the team picker (team name with live search, or Team ID; a pasted entry URL is
 *  read), Find my team under it ("Finding…" while it looks), Where do I find my ID?, what it costs, the Recent list,
 *  About Forkcast, the not-affiliated line. The first load keeps the form (dimmed) with one progress line (.m-prog). */
function showConnect({ error = '', tone = '', retry = null, value = '' } = {}) {
  clearTimeout(loader.timer);
  const err = h('div.m-err', { class: tone, role: 'alert' }, error, retry ? h('button', { type: 'button', onClick: retry }, 'Retry') : null);
  const picker = teamPicker(ctx, { value, onPick: (id) => firstLoad(id), onWhere: (id) => whereSheet(id), recent: 3 });
  // an error about what was typed clears as you type again
  picker.field.addEventListener('input', () => err.replaceChildren(), { once: true });
  const go = h('button.m-primary.lg', { type: 'button', onClick: () => picker.submit() }, 'Find my team');
  const where = h('button.m-where', { type: 'button', onClick: () => whereSheet(readId(picker.field.value)) }, PICK.where);
  // About Forkcast under it all (sheets/about.js landing; owner, 2026-10-14); its own Find my team at its foot brings
  // you back to the field
  const land = h('div.m-land');
  const start = () => { gate.scrollTo({ top: 0 }); if (picker.field.value.trim()) picker.submit(); else picker.focus(); };
  import('./sheets/about.js').then((m) => land.replaceWith(m.landing(ctx, { start }))).catch(() => land.remove());
  showGate(
    h('div.m-wordmark', null, h('h1', null, 'Forkcast'), h('p', null, calls.COPY.whyHero)),
    // an error sits right under its field
    h('div.m-form', null, picker.el, err, h('div.m-go', null, go), where),
    h('div.m-prog', { 'aria-live': 'polite' }),
    picker.recent,
    land,
    h('p.m-legal', null, calls.COPY.whyLegal));
  setTimeout(() => { if (!gate.classList.contains('loading')) picker.focus(); }, 350);
}

/**
 * Sign out of <team>: this device forgets the team (store entry, offline snapshot, its fc:mem / fc:ahead keys, Plan
 * ahead length) and so does the server: its plan memory of every GW goes as Reset plan leaves it (memory release →
 * forget; owner, 2026-10-22); also after FORGET_MS away. Then Connect. Solves stay cached; recent chips keep the team
 * for a one-tap return, as a fresh plan. No toast (owner, 2026-10-21), except after FORGET_MS away (awaySignedOut).
 */
function signOut({ away = false } = {}) {
  const entry = store.get('entry');
  if (!entry) return null;
  const name = store.get('bundle')?.entry?.team_name || api.recent.list().find((r) => String(r.entry_id) === String(entry))?.team_name || `Team ${entry}`;
  releaseMemory(api, entry);  // started before leaving the team: a sign-in before it lands still starts fresh
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
  Object.assign(held, { entry: null, cards: null, v: null, version: null, key: null, at: 0, asking: false });
  loader.last = '';
  history.replaceState(history.state, '', `#/${SCREEN}`);  // a sheet's entry keeps its marker
  showConnect();
  // no plan is kept, no Undo (forget); after FORGET_MS away the toast says why
  if (away) ui.toast(calls.COPY.awaySignedOut(name), 'info', { timeout: 8000 });
  return { name };
}

/** When this browser last used Forkcast (touch, key, page hidden, a plan landing): FORGET_MS after it the team is
 *  signed out and its choices go (signOut away; owner, 2026-10-14); also the open team's own last use (memory USED:
 *  unused that long starts as Reset plan leaves it). `force`: write now (else at most every 15 s); `team` false: a plan
 *  landing, not yet a use of the team. */
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
/** Away longer than FORGET_MS since the last use, or no use kept at all (signed out once; owner, 2026-10-14). QA's
 *  phones are seeded used (scenario.mjs boot). */
const away = () => { const t = Number(api.local.get(SEEN_KEY)); return !(t > 0) || Date.now() - t > FORGET_MS; };
/** Back after FORGET_MS away with a team open: signed out (launch, or tab shown again) → whether it was */
function signOutIfAway() {
  const was = !!store.get('entry') && away();
  if (was) signOut({ away: true });
  seen(true);
  return was;
}
/** A page left open on screen unused FORGET_MS signs itself out too (owner, 2026-10-22; the visibilitychange and boot
 *  checks never run while it stays shown): checked about once a minute and by the first touch or key, before seen()
 *  restarts the clock. */
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
 *  the next answer's). Shown again after the server moved to another, the page reloads into it (owner, 2026-10-14). →
 *  whether it reloads */
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
const SLOW_MS = 12000;
const FIRST_RETRY_MS = 3000;  // a first load's server error is asked again once after this (fetchFirst)
const SLOW_COPY = 'Still loading: a slow connection can take a minute or two.';

/** A wait's lines (calls.waitFacts) in `el` (.m-facts: Connect's under its bar, Ahead's cheer slot for the whole wait),
 *  in the page's paper and ink, not a toast's: all in one paragraph where they fit the panel's two lines (owner,
 *  2026-10-29), else `one` alone (calls.waitFact), faded in as it changes. → whether a line shows */
function factPanel(el, lines, one = lines?.at(-1)) {
  el.hidden = !lines?.length;
  if (!lines?.length) return false;
  const para = (ls) => h('p', null, ls.flatMap(([pre, num, post], i) => [i ? ' ' : '', pre, h('b', null, num), post]));
  const was = el.textContent, key = `${lines.map((l) => l.join('')).join(' ')}|${one?.join('')}|${el.clientWidth}`;
  if (el._facts !== key) {
    el._facts = key;
    fill(el, para(lines));
    if (lines.length > 1 && one && el.firstChild.getBoundingClientRect().height > el.clientHeight + 0.5) fill(el, para([one]));
    if (el.textContent !== was && !ui.reduceMotion()) el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
  }
  return true;
}

/** First load of a team (Connect, Switch team, a recent row): the form stays dimmed with "Finding team 3604308…" until
 *  found; then Ahead, its squad on the pitch while the plan bakes (ahead.js tellStory; owner, 2026-10-27). Only a
 *  forecast still updating keeps the form, with "Planning GW6–9" and a thin bar (etaBar). */
async function firstLoad(entry) {
  const my = ++loading;
  clearTimeout(loader.timer);
  // Change team from a team on screen: a failed lookup goes back to that team, its reason in a toast (Retry where it
  // may work next time)
  const was = gate.hidden && store.get('bundle') ? store.get('entry') : null;
  if (gate.hidden) showConnect({ value: entry });
  document.activeElement?.blur?.();
  gate.classList.add('loading');
  const go = $('.m-go .m-primary', gate);
  if (go) { go.disabled = true; go.textContent = 'Finding…'; }
  const prog = $('.m-prog', gate);
  // the wait's line under the bar (factPanel), its room kept from the tap on (m.css): nothing under moves
  const facts = h('div.m-facts');
  /** Line and bar for bundle b (none yet: "Finding team 3604308…"; then "Planning GW6–9"): the bake's bar (etaBar),
   *  full once the base road is in; then b's wait line. */
  const show = (b) => {
    fill(prog, h('p.m-prog-t.m-num', null, b ? planning(b?.meta ? horizonOf(b.meta) : null, b?.bake) : `Finding team ${entry}…`),
      etaBar('div.m-bar', b?.bake, !!b?.roads?.base),
      b?.state === 'updating' && !b.roads?.base ? h('p.m-prog-t.warn', null, calls.COPY.updating) : null, facts);
    factPanel(facts, calls.waitFacts(b), calls.waitFact(b));
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
  // a slow tunnel's first bundle (api.FIRST_BUNDLE_TIMEOUT_MS) is on its way: said under the line after SLOW_MS
  const slow = setTimeout(() => { if (my === loading && $('.m-prog-t', prog)) prog.append(h('p.m-prog-t.m-prog-slow', null, SLOW_COPY)); }, SLOW_MS);
  // a server error or the service away is asked once more, FIRST_RETRY_MS on, before Connect says so with its Retry
  // (owner, 2026-10-28: "Retry first load once"); null where another load took over
  const fetchFirst = async (opts) => {
    try { return await fetchBundle(entry, opts); } catch (e) {
      if (!(api.isDown(e) || e.status >= 500)) throw e;
      await wait(FIRST_RETRY_MS);
      return my === loading ? fetchBundle(entry, opts) : null;
    }
  };
  let b;
  try {
    b = await fetchFirst();
  } catch (e) { return back(e); } finally { clearTimeout(slow); }
  if (my !== loading) return;
  if (b.state === 'offline-data' || !b.entry) return enter(entry, b);  // no next GW: nothing to plan
  // in at once while it bakes (Ahead says how far); with the forecast still updating, wait for the base road; a bundle
  // that will never have one (GW under way with nothing baked, or a failed base solve) goes in and shows its own state
  while (!b.roads?.base && b.state === 'updating') {
    show(b);
    await wait(POLL_MS.updating);
    if (my !== loading) return;
    try { b = await fetchFirst({ prev: b }); } catch (err) { return back(err); }
    if (my !== loading) return;
  }
  return enter(entry, b, { reveal: true });
}

/** Into Ahead at GW A (the next deadline): mount behind the gate, then cross-fade (reveal: after Connect's first load,
 *  ctx.reveal). */
async function enter(entry, b, { reveal = false } = {}) {
  // the plan landing is a use (a first load can bake for minutes untouched), but not yet of the team, whose last use
  // decides whether its choices stand (memory USED)
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

/** Old Studio links (#/lab, #/runs?job=…, #/docs?flag=…) land here: on this computer they go on to /studio/ (elsewhere
 *  the Studio isn't served, so they stay Forkcast's). */
const STUDIO_ROUTES = /^#\/(lab|planner|plan|dashboard|players|compare|fixtures|runs|backtests|preview|data|docs)(?:[/?]|$)/;
function studioLink() {
  if (!STUDIO_ROUTES.test(location.hash) || !api.LOOPBACK.has(location.hostname)) return false;
  location.replace(`/studio/${location.hash}`);
  return true;
}

/** What takes a tap: a toast's Undo never sits over one of these (placeToasts). */
const CONTROLS = 'button, a[href], input, select, textarea, summary, [role="button"], [role="slider"], [role="radio"], [role="tab"], [tabindex="0"]';
const PLACE_SETTLE_MS = 120;

/**
 * One place for every toast: the top of the screen, over the header's row (Ahead's team name), right end clear of the
 * avatar (m.css #toasts). That row holds nothing to tap but the avatar and the Settings gear, each clear of a toast;
 * an edit changes there only the GW line's total, which waits for the toast to go (ahead.js renderTotal). It never
 * moves for the page, only for a sheet coming or going. Taps pass through it (m.css: only its Undo takes one).
 *
 * While a sheet is up it goes where none of the sheet's controls can be: above the sheet when it fits, else in a dock
 * at the screen's bottom the sheet keeps clear (m.css --toast-dock; the scroll range it adds stays for the sheet's
 * life, so nothing moves as the dock comes or goes).
 *
 * Its Undo takes a tap only while armed (m.css .toast.armed): not before the toast has come in, and on a sheet not
 * while a control a tap would reach is under it (guard); on the page it always does (H1, 2026-10-09). A toast changed
 * in place (ui.toast's replaces: an edit's verdict over its pending toast) keeps its place, data-in and armed Undo.
 */
let toastsPlaced = false;
function placeToasts() {
  // once per page: boot runs again (connect retry, sign-out's Undo) and would add the listeners and observer again
  if (toastsPlaced) return;
  toastsPlaced = true;
  // a finger down on an armed Undo holds the region in place, armed, until the tap ends (click, cancel, or PRESS_MS
  // after lift): moving it first would land the click on what was under it
  let pressed = null;
  const PRESS_MS = 500;
  const release = () => { if (!pressed) return; delete pressed.dataset.held; pressed = null; redrawn(); };
  document.addEventListener('pointerdown', (e) => {
    const t = e.target.closest?.('#toasts .toast');
    if (t?.classList.contains('armed') && e.target.closest('button.btn')) { pressed = t; t.dataset.held = '1'; }
  }, true);
  document.addEventListener('pointerup', () => { if (pressed) setTimeout(release, PRESS_MS); }, true);
  for (const k of ['click', 'pointercancel']) document.addEventListener(k, () => { if (pressed) setTimeout(release, 0); }, true);
  // the page's controls (CONTROLS) as last queried: kept until the page changes (the MutationObserver below drops
  // them), so the per-frame guard never re-queries the document
  let ctrls = null;
  const controlsOf = (region) => (ctrls ??= [...document.querySelectorAll(CONTROLS)].filter((c) => !region.contains(c)));
  let docked = null;  // the sheet keeping its dock clear for the region
  const undock = () => { docked?.style.removeProperty('--toast-dock'); docked = null; };
  const DOCK_GAP = 8;  // px between the region and the sheet's body (or the sheet's top edge)
  /** Sheet up: the region goes above it if it fits, else docks at the screen's bottom with the body ending DOCK_GAP
   *  above (--toast-dock-room, the most ever taken, keeps the scroll range: m.css .m-sbody). */
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
    // the body now ends above the toast: its page keeps the tapped control in view (Ahead: m-dock)
    docked.dispatchEvent(new CustomEvent('m-dock'));
    return 'bottom';
  };
  // el: the toast just added (its entrance slides from its edge by its own class, so placing again never restarts it);
  // none for a toast already up
  const place = (region, el = null) => {
    if (pressed?.isConnected) return;  // placed again once the tap on it ends (release)
    const sheet = sheets.top();
    if (sheet) { el?.classList.toggle('up', placeOnSheet(region, sheet) === 'bottom'); return; }
    // the page: always the top, never by where you tapped or what is under it
    undock();
    region.dataset.place = 'top';
    el?.classList.remove('up');
  };
  /** Whether toast button b covers a control a tap there would reach: the boxes overlap and the page under the toast at
   *  the overlap's middle is that control (elementsFromPoint skips what takes no tap and the toast's own parts). */
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
  /** Each toast's Undo is armed once it has come in (data-in): on the page whatever has scrolled under it (H1,
   *  2026-10-09), on a sheet while it blocks no control (else taps pass through and it is placed again once the page
   *  settles). Runs again next frame while a toast is up. */
  const guard = () => {
    const region = document.getElementById('toasts');
    const live = region ? [...region.querySelectorAll('.toast:not(.leaving)')].filter((t) => t.querySelector('button.btn')) : [];
    if (!live.length) return;
    let controls = null, stuck = false;
    const onSheet = !!sheets.top();
    for (const t of live) {
      if (t === pressed) continue;
      let ok = !!t.dataset.in && !onSheet;
      if (t.dataset.in && onSheet) {
        controls ??= controlsOf(region);
        ok = ![...t.querySelectorAll('button')].some((b) => b.getClientRects().length && blocks(b, region, controls));
        stuck ||= !ok;
      }
      if (t.classList.contains('armed') !== ok) t.classList.toggle('armed', ok);
      if (ok && !t.dataset.armedOnce) { t.dataset.armedOnce = '1'; t.dispatchEvent(new Event('toast-armed')); }
    }
    if (stuck) redrawn();
    raf ||= requestAnimationFrame(() => { raf = 0; guard(); });
  };
  /** A toast just added: placed before its first draw on the layout the edit that raised it re-drew (Ahead re-draws in
   *  a microtask after the tap), never the layout before (measuring it cost a forced layout and a scan of every
   *  control); its entrance slides from its edge ('up' class, set before any frame); Undo is armed once the entrance
   *  ends. */
  const added = (region, el) => {
    requestAnimationFrame(() => {
      if (!el.isConnected || el.classList.contains('leaving')) return;
      place(region, el);
      guard();
      Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(() => { if (el.isConnected) { el.dataset.in = '1'; guard(); } });
    });
  };
  let timer = 0;
  const again = () => { timer = 0; const r = document.getElementById('toasts'); if (r?.querySelector('.toast')) { place(r); guard(); } };
  // scroll or resize: once settled (each event restarts the wait, so a toast never moves mid-gesture)
  const settle = () => { clearTimeout(timer); timer = setTimeout(again, PLACE_SETTLE_MS); };
  // toast coming or going, or a re-draw under one (a plan landing moves rows): once per wait, not put off by the next
  // re-draw (the countdown re-draws every second)
  function redrawn() { if (!timer) timer = setTimeout(again, PLACE_SETTLE_MS); }
  ui.setToastPlace(added);
  // a script's scroll (scrollIntoView, scroll/scrollTo/scrollBy, scrollTop/Left) moves the page at once, its scroll
  // event a frame later: check the toasts right after it, as after a re-draw
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
  // a mutation callback runs before the next task (tap, timer), so a re-draw or a class or style that moves a row never
  // leaves an armed Undo over a control; the toasts' own changes are ignored
  new MutationObserver((records) => {
    const region = document.getElementById('toasts');
    const page = region ? records.filter((r) => r.type === 'childList' || !region.contains(r.target)) : records;
    if (page.length) ctrls = null;
    if (!region?.querySelector('.toast')) { undock(); return; }
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
  ui.toastRegion();  // the live region is up before the first toast, so that one is announced too
  applyTheme();
  // iOS Safari shows :active only under a touchstart listener: the toasts hang off <body>, outside the screen's own
  document.addEventListener('touchstart', () => {}, { passive: true });
  renderBanner();
  // a history load (Back/Forward past the bfcache) takes page and scripts from cache without asking, so this code may
  // be older than the served release, and reloadIfReleased would take the served one as its own: a reload asks again by
  // ETag (304s where unchanged). Never twice: after it the navigation is a reload
  if (globalThis.performance?.getEntriesByType?.('navigation')[0]?.type === 'back_forward') { location.reload(); return; }
  reloadIfReleased();  // the release this page runs, kept to compare when it is shown again
  if (signOutIfAway()) return;  // back after FORGET_MS away: Connect, the team's choices gone
  const entry = store.get('entry');
  if (!entry) return showConnect();
  // warm start: the last snapshot draws at once, the server refreshes it behind (no GW in the address: GW A)
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
