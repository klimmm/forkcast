// Shared components. Each returns a DOM element (modal a handle). Untrusted text goes in as text nodes: only h()'s
// `html` attr writes markup (icons only). No import-time side effects. Studio's own components are in js/studio/,
// which the phone never loads.

import * as api from './api.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PROPS = new Set(['value', 'checked', 'selected', 'indeterminate', 'muted']);
let uidSeq = 0;
export const uid = (prefix = 'u') => `${prefix}-${++uidSeq}`;

// ---------------------------------------------------------------- element builders

function setClass(el, v) {
  if (!v) return;
  const names = Array.isArray(v) ? v.flat(Infinity)
    : typeof v === 'object' ? Object.keys(v).filter((k) => v[k]) : String(v).split(/\s+/);
  for (const n of names) if (n) el.classList.add(n);
}

function applyAttrs(el, attrs) {
  if (!attrs) return;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class' || k === 'className') setClass(el, v);
    else if (k === 'style') {
      if (v == null) continue;
      if (typeof v === 'string') el.style.cssText += `;${v}`;
      else for (const [p, val] of Object.entries(v)) {
        if (val == null || val === false) continue;
        if (p.startsWith('--') || p.includes('-')) el.style.setProperty(p, String(val));
        else el.style[p] = val;
      }
    } else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v ?? '';
    else if (k === 'ref') v?.(el);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (PROPS.has(k)) el[k] = v;
    else if (v === true) el.setAttribute(k === 'htmlFor' ? 'for' : k, '');
    else if (v !== false && v != null) el.setAttribute(k === 'htmlFor' ? 'for' : k, String(v));
  }
}

/** Strings/numbers → text, arrays flatten, null/false/true skipped. */
export function append(el, ...children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Like append() but replaces children (native replaceChildren prints "null", won't flatten). */
export const fill = (el, ...kids) => { el.replaceChildren(); return append(el, kids); };

function parseTag(tag) {
  const [name, ...rest] = tag.split(/(?=[.#])/);
  const cls = [];
  let id = null;
  for (const r of rest) r[0] === '.' ? cls.push(r.slice(1)) : (id = r.slice(1));
  return { name: name || 'div', cls, id };
}

/** h('button.btn.primary#go', {onClick, type:'button'}, 'Solve') */
export function h(tag, attrs, ...children) {
  const { name, cls, id } = parseTag(tag);
  const el = document.createElement(name);
  if (cls.length) el.classList.add(...cls);
  if (id) el.id = id;
  applyAttrs(el, attrs);
  return append(el, children);
}

/** SVG element; attributes are always set as attributes. */
export function svg(tag, attrs, ...children) {
  const { name, cls, id } = parseTag(tag);
  const el = document.createElementNS(SVG_NS, name);
  if (cls.length) el.setAttribute('class', cls.join(' '));
  if (id) el.id = id;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', [el.getAttribute('class'), Array.isArray(v) ? v.join(' ') : v].filter(Boolean).join(' '));
    else if (k === 'style' && typeof v === 'object') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, String(val));
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** A forecast number as every screen draws it (owner, 2026-10-22): the forecast's blue plus a text-only "xP" marker
 *  (.xp-u, never spoken; `mark` false where a heading carries it). `text` goes alone in an element `tag` (m.css .xp). →
 *  [number, marker] */
export const xpNum = (text, tag = 'span', attrs = null, mark = true) => [h(`${tag}.xp`, attrs, text), mark ? xpMark() : null];
/** Signed forecast difference as xpNum draws it, "+2.3 xP": blue, never green or red (owner, 2026-10-22); `pre`
 *  precedes the sign ("≈" while it checks). One class everywhere, .xp-g (owner, 2026-10-28). */
export const xpGain = (d, tag = 'span', attrs = null, mark = true, pre = '') => xpNum(`${pre}${fmt.signed(d)}`, `${tag}.xp-g`, attrs, mark);
/** Whether `d` reads as a gain as shown: "+0.1" (a 0.05) does, "0.0" and "−0.1" don't (ahead.js swapPlate .loss; owner,
 *  2026-10-26). */
export const shownGain = (d) => fmt.signed(d).startsWith('+');
/** Text-only "xP" marker (m.css .xp-u): a span, never a <small> (a row's unit: m-ahead.css .ah-lrow .rt small, .ah-bg
 *  small). */
export const xpMark = () => h('span.xp-u', { 'aria-hidden': 'true' }, 'xP');

/**
 * Run fn every `ms` while `el` is in the document; stops (calling onEnd) once it's removed or unattached for ~10s.
 * stop() skips onEnd.
 */
export function whileConnected(el, fn, ms = 1000, onEnd) {
  let seen = false;
  let idle = 0;
  const t = setInterval(() => {
    if (el.isConnected) { seen = true; fn(); return; }
    if (seen || ++idle * ms > 10000) { clearInterval(t); onEnd?.(); }
  }, ms);
  return () => clearInterval(t);
}

// ---------------------------------------------------------------- icons

export const ICONS = {
  dashboard: 'M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z',
  planner: 'M7 4 3 8l4 4M3 8h13M17 12l4 4-4 4M21 16H8',
  players: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c.5-3.6 3.8-5.6 8-5.6s7.5 2 8 5.6',
  compare: 'M5 20V11M10 20V5M15 20v-6M20 20V9',
  fixtures: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2',
  runs: 'M4 5h16v14H4zM8 10l3 2-3 2M13 15h3',
  backtests: 'M3 12a9 9 0 1 0 2.6-6.4M3 4v5h5M12 8v4l3 2',
  preview: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  data: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  docs: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  close: 'M6 6l12 12M18 6 6 18',
  reset: 'M4 4v6h6M5.1 15a8 8 0 1 0 1.8-8.4L4 10',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  chevron: 'M9 6l6 6-6 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  warn: 'M12 3.5 2.5 20h19zM12 10v4.5M12 17v.5',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  stop: 'M7 7h10v10H7z',
  play: 'M7 5l12 7-12 7z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  arrow: 'M4 12h15M13 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  swap: 'M7 4 3 8l4 4M3 8h13M17 12l4 4-4 4M21 16H8',
};

/** icon('lock') or icon('M4 4h16…') → decorative inline SVG; emoji/text → <span>. */
export function icon(name, { size = 18, label } = {}) {
  if (!name) return null;
  const d = ICONS[name] || (/^[Mm][\d\s.,-]/.test(name) ? name : null);
  if (!d) return h('span.icon-txt', { 'aria-hidden': label ? null : 'true' }, name);
  const el = svg('svg', {
    class: 'icon', viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
    'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'aria-hidden': label ? null : 'true', role: label ? 'img' : null, 'aria-label': label || null,
  }, svg('path', { d }));
  return el;
}

// ---------------------------------------------------------------- formatting

export const DASH = '—';
const MINUS = '−';
export const toNum = (v) => (v == null || v === '' || typeof v === 'boolean' ? NaN : Number(v));
/** Finite number or numeric string (not null, '', booleans, NaN). */
export const fin = (v) => Number.isFinite(toNum(v));
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Epoch s, epoch ms, ISO string or Date → ms (NaN when unknown). */
export function toMs(t) {
  if (t == null || t === '') return NaN;
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'number') return t > 1e12 ? t : t * 1000;
  const n = Number(t);
  return Number.isFinite(n) ? toMs(n) : Date.parse(t);
}

const dateFmt = () => new Intl.DateTimeFormat(undefined, {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

export const fmt = {
  dash: DASH,
  num(x, d = 1) { return fin(x) ? toNum(x).toFixed(d).replace('-', MINUS) : DASH; },
  /** £m float → "£9.5m" */
  money(m, d = 1) {
    if (!fin(m)) return DASH;
    const v = toNum(m);
    return `${v < 0 ? MINUS : ''}£${Math.abs(v).toFixed(d)}m`;
  },
  pts(x, d = 1) { return fmt.num(x, d); },
  /** percent units in (13.7 → "13.7%") */
  pct(x, d = 1) { return fin(x) ? `${fmt.num(x, d)}%` : DASH; },
  gw(n) { return n == null || n === '' ? DASH : `GW${n}`; },
  signed(x, d = 1) {
    if (!fin(x)) return DASH;
    const v = toNum(x);
    // a tie goes away from zero despite float noise: 1.5499…9 and 1.5500…04, one change summed two ways, both read
    // "+1.6"
    const s = (Math.round(Math.abs(v) * 10 ** d + 1e-6) / 10 ** d).toFixed(d);
    return Number(s) === 0 ? s : `${v > 0 ? '+' : MINUS}${s}`;
  },
  int(n) { return fin(n) ? Math.round(toNum(n)).toLocaleString('en-GB').replace('-', MINUS) : DASH; },
  /** 1 → "1st", 12 → "12th", 23 → "23rd" (player card ranks) */
  ordinal(r) { return `${r}${r % 100 >= 11 && r % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[r % 10] ?? 'th'}`; },
  /** 795123 → "795K", 8200 → "8K", 1234567 → "1.2M"; d: the M's decimals if given (rank "2.18M" at 2), else one below
   *  10M, none above. One whole capital K, never "8.2k". */
  compact(n, d = null) {
    if (!fin(n)) return DASH;
    const v = toNum(n), a = Math.abs(v), sign = v < 0 ? MINUS : '';
    if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(d ?? (a >= 1e7 ? 0 : 1))}M`;
    if (a >= 1e3) return `${sign}${Math.round(a / 1e3)}K`;
    return `${sign}${Math.round(a)}`;
  },
  /** seconds → "45s", "3m 05s", "1h 02m" */
  dur(sec) {
    if (!fin(sec)) return DASH;
    const s = Math.max(0, Math.round(toNum(sec)));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
    return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
  },
  /** any time → "Sat 10 Oct, 13:00" in the viewer's timezone */
  date(t) { const ms = toMs(t); return Number.isFinite(ms) ? dateFmt().format(ms) : DASH; },
  ago(t) {
    const ms = toMs(t);
    if (!Number.isFinite(ms)) return DASH;
    const s = (Date.now() - ms) / 1000;
    if (s < 45) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400 * 2) return `${Math.round(s / 3600)}h ago`;
    return `${Math.round(s / 86400)}d ago`;
  },
  pos(p) { return posName(p) || DASH; },
};

export const POS = ['GK', 'DEF', 'MID', 'FWD'];
/** 1-4 or 'GK'/'GKP'/'DEF'/'MID'/'FWD' → 'GK'|'DEF'|'MID'|'FWD' (null if unknown). */
export function posName(p) {
  if (p == null) return null;
  if (fin(p)) return POS[toNum(p) - 1] || null;
  const s = String(p).toUpperCase();
  return s === 'GKP' ? 'GK' : POS.includes(s) ? s : null;
}
/** A position's code on screen, FPL's: GKP, DEF, MID, FWD; posName stays the internal key. null when unknown. */
export const posCode = (p) => { const k = posName(p); return k === 'GK' ? 'GKP' : k; };

/** A player's xP for display: `xp_value`, else numeric `pred`, else xp[i] / xp. */
export function xpOf(p, i = 0) {
  if (!p) return null;
  if (fin(p.xp_value)) return toNum(p.xp_value);
  if (fin(p.pred)) return toNum(p.pred);
  if (Array.isArray(p.xp)) return fin(p.xp[i]) ? toNum(p.xp[i]) : null;
  return fin(p.xp) ? toNum(p.xp) : null;
}

// FPL status: letters from /api/players, solver ints (player_data.py STATUS_SHORT), labels like "d75".
const STATUS_INT = { 1: 'a', 2: 'd', 3: 'i', 4: 'n', 5: 's', 0: 'u' };
const STATUS_LABEL = { a: 'Available', d: 'Doubtful', i: 'Injured', s: 'Suspended', u: 'Unavailable', n: 'Not available' };
/** → {code, label, tone: 'ok'|'warn'|'bad', chance} */
export function statusInfo(status, chance) {
  let code = 'a';
  let pct = fin(chance) ? toNum(chance) : null;
  if (fin(status)) code = STATUS_INT[Math.trunc(toNum(status))] || 'a';
  else if (typeof status === 'string' && status) {
    code = status[0].toLowerCase();
    const n = parseInt(status.slice(1), 10);
    if (Number.isFinite(n)) pct = n;
  }
  const partial = pct != null && pct > 0 && pct < 100;
  const tone = code === 'a' ? (partial ? 'warn' : 'ok') : code === 'd' ? 'warn' : 'bad';
  const label = (STATUS_LABEL[code] || 'Unknown') + (partial ? ` · ${pct}%` : '');
  return { code, label, tone, chance: pct };
}

/** Availability dot; none for fit players unless `always`. */
export function statusDot(status, { chance, news, always = false } = {}) {
  const s = statusInfo(status, chance);
  if (s.tone === 'ok' && !always) return null;
  const title = news ? `${s.label}: ${news}` : s.label;
  return h('span.sdot', { class: s.tone, title, role: 'img', 'aria-label': title });
}

// ---------------------------------------------------------------- motion, gestures and focus (Forkcast's shell and screen)

/** System Reduce Motion is on: the one test (sheets, swipes, armband hop). */
export const reduceMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** preventDefault only while the touch is cancelable (sheet drags, pull to refresh, pitch drags, move-row swipes); once
 *  its scroll has begun it only logs Chrome's "Ignored attempt to cancel a touchmove event with cancelable=false". */
export const holdTouch = (e) => { if (e.cancelable) e.preventDefault(); };

/** A drag's speed at release: the least-squares slope, px/ms, of the last FLICK_WINDOW_MS of samples (0 with fewer than
 *  two: the finger rested); project(pos) = pos + velocity × FLICK_MS. For sheet drags and swipes. */
const FLICK_WINDOW_MS = 100;
export const FLICK_MS = 150;  // ms of its speed a release carries: a first value, phone check open
export function flick() {
  const pts = [];
  const self = {
    /** A sample: pos (px) at t (ms, event timeStamp); samples older than FLICK_WINDOW_MS go. */
    add(pos, t = performance.now()) {
      pts.push({ pos, t });
      while (t - pts[0].t > FLICK_WINDOW_MS) pts.shift();
      return self;
    },
    velocity() {
      if (pts.length < 2) return 0;
      const mt = pts.reduce((s, p) => s + p.t, 0) / pts.length, mp = pts.reduce((s, p) => s + p.pos, 0) / pts.length;
      const den = pts.reduce((s, p) => s + (p.t - mt) ** 2, 0);
      return den ? pts.reduce((s, p) => s + (p.t - mt) * (p.pos - mp), 0) / den : 0;
    },
    project: (pos) => pos + self.velocity() * FLICK_MS,
  };
  return self;
}

/** Selector for data-row=`row`, escaped (a plan row's holds a chip as JSON: quotes). */
export const rowKey = (row) => `[data-row="${globalThis.CSS?.escape ? CSS.escape(row) : String(row).replace(/["\\]/g, '\\$&')}"]`;
/** The key a focused element's replacement is found by after a redraw: its row's data-row, else its move's data-gw /
 *  data-out / data-in (a transfer or suggestion row, its + and × too), else its focus home (data-focus-home); null when
 *  none. */
export function focusKey(el) {
  const row = el?.closest?.('[data-row]');
  if (row) return rowKey(row.dataset.row);
  const mv = el?.closest?.('[data-gw][data-out][data-in]');
  if (mv) return `[data-gw="${mv.dataset.gw}"][data-out="${mv.dataset.out}"][data-in="${mv.dataset.in}"]`;
  return el?.closest?.('[data-focus-home]') ? '[data-focus-home]' : null;
}
const FOCUSABLE = 'button:not(:disabled), a[href], input, select, textarea, [tabindex]';
/** Focus what `key` names in root (itself or its first control), else `fallback`, without scrolling; a match with no
 *  box (display none) doesn't count. */
export function refocus(root, key, fallback = null) {
  const at = key ? root?.querySelector(key) : null;
  const t = at && (at.matches(FOCUSABLE) ? at : at.querySelector(FOCUSABLE));
  ((t?.getClientRects().length ? t : null) || fallback)?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- toast

/** Toasts' live region (#toasts, aria-live polite), made once at shell start (Forkcast's boot) so the first toast is
 *  announced. */
/** An edit's toast said to VoiceOver alone (toast opts.quiet): the week card is up and says it, and no sheet covers it;
 *  a warning is always shown (owner, 2026-11-05, "remove the black undo tab from top"; 2026-11-10, "find all other
 *  toasts which appear and fix them"). */
export const cardSaysIt = (kind = 'info') => { const doc = globalThis.document; return kind !== 'warn' && !!doc?.querySelector('.ah-ticket') && !doc.querySelector('.m-sheet'); };
export function toastRegion() {
  let r = document.getElementById('toasts');
  if (!r) document.body.append(r = h('div#toasts', { 'aria-live': 'polite', 'aria-atomic': 'false' }));
  return r;
}

/** setToastPlace(fn): fn(region, toast) runs once the toast is in the region; a string answer is the region's
 *  data-place (CSS); fn may place the region itself (app.js placeToasts). */
let toastPlace = null;
export const setToastPlace = (fn) => { toastPlace = typeof fn === 'function' ? fn : null; };

/** Where rect r overlaps rect o grown by pad: that rect, or null. */
export function overlapOf(r, o, pad = 0) {
  const left = Math.max(r.left, o.left - pad), right = Math.min(r.right, o.right + pad);
  const top = Math.max(r.top, o.top - pad), bottom = Math.min(r.bottom, o.bottom + pad);
  return right > left && bottom > top ? { left, top, right, bottom } : null;
}

/** A toast with an action (Undo) never leaves by itself: once its time is up (from 'toast-armed', when the action first
 *  takes a tap) it goes on your next touch elsewhere; a newer toast with an action replaces it. Without an action it
 *  times out. One tagged 'pending' stays until what follows replaces it in place. */
const STAYING = new Set();
const END_MS = 400;
if (typeof addEventListener === 'function') {
  // a touch elsewhere after its time marks it; it goes END_MS after the finger lifts (click landed)
  addEventListener('pointerdown', (e) => {
    const now = performance.now();
    for (const s of STAYING) if (s.until < now && !s.el.contains(e.target) && s.el.dataset.tag !== 'pending') s.ending = true;
  }, { capture: true });
  for (const k of ['pointerup', 'pointercancel']) {
    addEventListener(k, () => {
      const go = [...STAYING].filter((s) => s.ending);
      if (go.length) setTimeout(() => { for (const s of go) s.dismiss(); }, END_MS);
    }, { capture: true });
  }
}

/** toast(msg, kind: 'ok'|'info'|'warn'|'error', opts) → dismiss(), whose .update(msg) changes the words alone. opts:
 *  {timeout, action:{label, onClick, keep}, actions:[…], tag, replaces, onDismiss, take}.
 *  keep: stay up after that action; an onClick returning a promise (a sheet it opened) holds the toast until it
 *  settles.
 *  tag: data-tag (Forkcast: 'pending' while the full plan checks an edit).
 *  replaces: a tag; a toast up with it becomes this one in place (place and armed Undo kept), its dismiss returned;
 *  none up, a new toast.
 *  onDismiss: called once when it leaves any way but its own buttons. take: a take's receipt (addPlan), the clauses
 *  that may clip ([] none). */
/** A toast's words → [head, num, rest]. num: the last " · +4.7 pts" with its weak word (" (narrow)"), kept whole; head:
 *  the words before it, which may clip (m.css: three lines at most); rest: the words after it. A choice's " · +2.6 vs
 *  rolling" (COPY.planGain; owner, 2026-10-26: no "· total" beside it) and a "· total +4.0" after it count as one, so
 *  neither clips. No number: [m, '', '']. */
export const toastParts = (m) => {
  const cut = [...m.matchAll(/ · (?:[+−-]?\d[\d.,]* pts\b(?: \([a-z ]+\))?|[+−-]?\d[\d,]*(?:\.\d+)? vs (?:rolling|your plan)(?: · total [+−-]?\d[\d,]*(?:\.\d+)?)?|total [+−-]?\d[\d,]*(?:\.\d+)?)/g)].at(-1);
  return cut ? [m.slice(0, cut.index), cut[0], m.slice(cut.index + cut[0].length)] : [m, '', ''];
};
/** A toast's head → [lead, also]: the lead runs to its first " · " (a take's moves: what clips); also is the rest ("·
 *  Free Hit in GW8 taken off"), kept whole. None: ''. */
export const toastLead = (head) => { const i = head.indexOf(' · '); return i < 0 ? [head, ''] : [head.slice(0, i), head.slice(i)]; };
/** …as drawn: the number opens the tail, the rest after it in the same span (one clip keeps the number); two numbers
 *  stay whole, a line break only between them (m.css); the tail on its own line, flush with the line above (--toast-sp
 *  keeps its " · " space); the lead (.toast-lead) clips before .toast-also. */
const toastWords = (m, clips = null) => {
  if (typeof m !== 'string') return m;
  const [head, num, rest] = toastParts(m);
  const [lead, also] = toastLead(head);
  // the lead's last buy apart from what precedes it (a take's "GW9 Calvert-Lewin" | " → Evanilson"): on a take's
  // one-line head (.split) the sale clips before the buy (m.css), so the incoming player stays named; clauses after the
  // lead are spans, those of `clips` (ahead.addPlan) clipping next, the rest whole (a clipped "removed" flips the
  // meaning)
  const to = lead.lastIndexOf(' → ');
  const words = h('span.toast-head', null,
    h('span.toast-lead', { class: { moves: to > 0 } }, to > 0 ? [h('span.toast-from', null, lead.slice(0, to)), h('span.toast-to', null, lead.slice(to))] : lead),
    also ? h('span.toast-also', null, also.split(/(?= · )/).map((c) => h('span', { class: { 'toast-may': !!clips?.includes(c.slice(3)) } }, c))) : null);
  if (!num) return words;
  // its " · " a span of its own (.toast-sep), not drawn where the number opens a row of its own (.split; owner,
  // 2026-10-26)
  const nums = num.split(/(?= · total )/).flatMap((x, j) => (j ? [' ', h('span', null, x.slice(1))] : [h('span', null, h('span.toast-sep', null, x.slice(0, 3)), x.slice(3))]));
  return [words, h('span.toast-tail', null, h('span.toast-num', null, nums), rest)];
};
/** Whether this browser can lay a take's toast out in two rows (m.css .toast.split: subgrid, iOS 16+); without it the
 *  toast wraps as usual. */
const SPLITS = !!globalThis.CSS?.supports?.('grid-template-columns', 'subgrid');

export function toast(msg, kind = 'info', opts = {}) {
  const region = toastRegion();
  const up = opts.replaces ? [...region.children].find((t) => t.dataset.tag === opts.replaces && !t.classList.contains('leaving')) : null;
  if (up?.retoast) return up.retoast(msg, kind, opts);
  let ic = null, kd = null, btns = [], ms = 0, timer = 0, ondis = null, take = null;
  const dismiss = () => {
    if (!el.isConnected || el.classList.contains('leaving')) return;
    STAYING.delete(stay);
    el.classList.add('leaving');
    ro?.disconnect();
    setTimeout(() => el.remove(), 160);
    const f = ondis;
    ondis = null;
    f?.();
  };
  const text = h('span.toast-msg');
  const x = h('button.icon-btn', { type: 'button', 'aria-label': 'Dismiss', onClick: () => dismiss() }, icon('close', { size: 14 }));
  // (opts.quiet: said to VoiceOver alone, m.css)
  const el = h('div.toast', { class: { quiet: !!opts.quiet } }, text, x);
  // held: `keep` actions whose sheet is still up; its time runs once none is
  const stay = { el, until: 0, dismiss, held: 0 };
  const restart = () => { stay.until = stay.held ? Infinity : performance.now() + ms; };
  const hold = (r) => {
    if (typeof r?.then !== 'function') return;
    stay.held++;
    restart();
    const back = () => { stay.held--; restart(); };
    r.then(back, back);
  };
  el.addEventListener('toast-armed', restart, { once: true });
  // buttons on a line under the words (m.css .toast.under) when one can't sit beside the widest number; past three
  // lines the head clips (.toast-msg.long), never the number; the lead clips before .toast-also
  // A take's toast (opts.take) past one line with buttons beside it is two rows (m.css .toast.split): the head on one
  // line (sales clip first with "…", then `take`'s clauses go, the last first, the buy last), the number beside the buttons on the
  // second, its " · " not drawn (owner, 2026-10-26); no number: buttons alone. If head or number can't fit: the
  // every-toast way, below
  const fit = () => globalThis.requestAnimationFrame?.(() => {
    if (!text.isConnected) return;
    text.classList.remove('long', 'tailrow');
    el.classList.remove('under', 'split');
    for (const c of text.querySelectorAll('.toast-may.off')) c.classList.remove('off');
    const lh = parseFloat(getComputedStyle(text).lineHeight) || 17;
    const lines = (e) => (e ? Math.round(e.getBoundingClientRect().height / lh) : 0);
    const tail = text.querySelector('.toast-tail');
    if (take && SPLITS && btns.length && text.getBoundingClientRect().height > lh + 1) {
      el.classList.add('split');
      const whole = (e) => !e || e.scrollWidth <= e.clientWidth + 1;
      const head = text.querySelector('.toast-head');
      // (a clause that may clip goes whole, the last first, while one is cut or the buy is: "GW10 Ajayi → Mykolenko (−4) ·
      // locked", never "GW1… → Mykolenko (−… … · 2 tr… · Vu…"; its words stay in the toast, read out; QA manyft, 2026-11-04)
      const may = [...text.querySelectorAll('.toast-may')], buy = text.querySelector('.toast-to');
      while (may.length && (!whole(buy) || may.some((c) => !whole(c)))) may.pop().classList.add('off');
      if (whole(tail) && lines(tail) <= 1 && whole(head) && whole(text.querySelector('.toast-to')) && [...text.querySelectorAll('.toast-also > span:not(.toast-may)')].every(whole)) return;
      el.classList.remove('split');
    }
    const under = btns.some((b) => { const r = b.el.getBoundingClientRect(); return r.height && r.top + r.height / 2 > text.getBoundingClientRect().bottom; });
    el.classList.toggle('under', under);
    const box = text.getBoundingClientRect();
    const most = under ? 2 : 3;
    const long = box.height > most * lh + 1;
    if (long) {
      const t = lines(text.querySelector('.toast-head')) ? Math.min(lines(text.querySelector('.toast-tail')), 2) : most;
      text.style.setProperty('--tail-lines', t);
      text.classList.add('long');
      text.style.setProperty('--lead-lines', Math.max(1, most - t - lines(text.querySelector('.toast-also'))));
    }
    text.classList.toggle('long', long);
    // its number on a line of its own, its " · " not drawn (m.css .tailrow; owner, 2026-10-26)
    const tl = text.querySelector('.toast-tail'), hd = text.querySelector('.toast-head');
    text.classList.toggle('tailrow', !!tl && !!hd && tl.getBoundingClientRect().top >= hd.getBoundingClientRect().bottom - 0.5);
  });
  // …and laid out again when its width changes (the region is wider docked under a sheet). fit never moves a toast: it
  // is its region's width whatever its classes
  let fitW = 0;
  const ro = globalThis.ResizeObserver ? new ResizeObserver(([e]) => { const w = e.contentRect.width; if (Math.abs(w - fitW) > 0.5) { fitW = w; fit(); } }) : null;
  ro?.observe(el);
  dismiss.update = (m) => { if (el.isConnected && !el.classList.contains('leaving')) { fill(text, toastWords(m, take)); fit(); } };
  el.retoast = (m, k, { timeout = 4500, action, actions, tag = null, onDismiss = null, take: tk = null } = {}) => {
    take = tk;
    const left = ondis;  // the toast it replaces has left
    ondis = null;
    left?.();
    if (kd !== k) {
      if (kd) el.classList.remove(kd);
      el.classList.add(kd = k);
      el.setAttribute('role', k === 'error' ? 'alert' : 'status');
      const i = icon(k === 'ok' ? 'check' : k === 'error' || k === 'warn' ? 'warn' : 'info');
      if (ic) ic.replaceWith(i); else el.prepend(i);
      ic = i;
    }
    fill(text, toastWords(m, take));
    fit();
    const list = actions ?? (action ? [action] : []);
    const had = new Map(btns.map((b) => [b.label, b]));
    btns = list.map((a) => {
      const b = had.get(a.label) ?? { label: a.label };
      had.delete(a.label);
      b.act = a;
      // `keep`: stays up after it, held while what it opened is up (a take's Why)
      b.el ??= h('button.btn.sm.ghost', { type: 'button', onClick: () => { if (b.act.keep) { hold(b.act.onClick?.()); return; } ondis = null; b.act.onClick?.(); dismiss(); } }, a.label);
      return b;
    });
    for (const b of had.values()) b.el.remove();
    // in order before ×; a kept one moves only if out of place (a finger may be on it)
    let next = x;
    for (const b of [...btns].reverse()) { if (b.el.nextSibling !== next) next.before(b.el); next = b.el; }
    if (tag) el.dataset.tag = tag; else delete el.dataset.tag;
    ondis = onDismiss;
    ms = k === 'error' ? Math.max(timeout, 8000) : timeout;
    clearTimeout(timer);
    if (list.length) {
      for (const s of [...STAYING]) if (s !== stay && s.el.dataset.tag !== 'pending') s.dismiss();
      STAYING.add(stay);
      restart();  // from now if already up ('toast-armed' restarts it for a new one); none while held
    } else {
      STAYING.delete(stay);
      if (timeout) timer = setTimeout(dismiss, ms);
    }
    return dismiss;
  };
  el.retoast(msg, kind, opts);
  region.append(el);
  if (toastPlace) { const p = toastPlace(region, el); if (typeof p === 'string') region.dataset.place = p; }
  return dismiss;
}

// ---------------------------------------------------------------- roving focus

const ROVING = new WeakMap();
/**
 * roving(group, {items, attr, pick}) → group: keyboard pattern of a radio group or tab list: one Tab stop (the checked
 * enabled option, else the first); Arrows/Home/End move focus over the enabled options, wrapping, each picking its
 * target via pick(button), the path a tap takes. items(): options as drawn (radios by default); attr says checked.
 * Call again to repaint.
 */
export function roving(group, { items = () => [...group.querySelectorAll(':scope > [role="radio"]')], attr = 'aria-checked', pick } = {}) {
  let r = ROVING.get(group);
  if (!r) {
    r = {
      paint() {
        const all = items();
        const on = all.filter((b) => !b.disabled);
        const cur = on.find((b) => b.getAttribute(attr) === 'true') ?? on[0];
        for (const b of all) b.tabIndex = b === cur ? 0 : -1;
      },
    };
    group.addEventListener('keydown', (e) => {
      const enabled = items().filter((b) => !b.disabled);
      const i = enabled.indexOf(document.activeElement);
      if (i < 0) return;
      const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: enabled.length - 1 }[e.key];
      if (next == null) return;
      e.preventDefault();
      const b = enabled[(next + enabled.length) % enabled.length];
      b.focus();
      pick?.(b);
      if (!b.isConnected) { r.paint(); items().find((x) => x.tabIndex === 0)?.focus({ preventScroll: true }); }
    });
    ROVING.set(group, r);
  }
  r.paint();
  return group;
}

// ---------------------------------------------------------------- chips

const CHIPS = {
  wc: 'Wildcard', wildcard: 'Wildcard', fh: 'Free Hit', freehit: 'Free Hit',
  bb: 'Bench Boost', bboost: 'Bench Boost', tc: 'Triple Captain', '3xc': 'Triple Captain',
};
export const chipName = (c) => (c ? CHIPS[String(c).toLowerCase()] || String(c).toUpperCase() : null);

// ---------------------------------------------------------------- search text

// NFD strips combining marks; FOLD covers letters NFD keeps whole (ø, ß, ł…).
const FOLD = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[øæœßłđðþı]/g, (c) => FOLD[c]);
