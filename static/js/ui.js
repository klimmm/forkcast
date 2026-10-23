// Shared components for FPL Solver Studio. Views build their DOM from these plus plain DOM.
// Every component returns a DOM element (modal returns a handle). Untrusted text always goes
// in through text nodes — only the `html` attr of h() writes markup, and only icons use it.
// No side effects at import time.

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

/** Append children: strings/numbers become text, arrays flatten, null/false/true are skipped. */
export function append(el, ...children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Replace an element's children by append()'s rules (native replaceChildren prints "null" and won't flatten). */
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

/** SVG element: svg('path', {d, class}) — attributes are always set as attributes. */
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

/** A forecast number (expected points) as every screen draws it (the user, 2026-10-22, after v1.3.68: "is points
 *  coloring not too much, and why + still goes with other colors and no xp": no chip, the number in the forecast's blue
 *  and an "xP" by it, everywhere): the number `text` (an element `tag`, its classes too, with `attrs`: m.css .xp, the
 *  --xp tokens, a surface's own by --xp-c), then "xP" (.xp-u: the text-only marker; never spoken: the labels say
 *  "expected points"); `mark` false where a heading over the numbers carries it. The number's element holds the number
 *  alone (what reads it, reads that). → [number, marker] */
export const xpNum = (text, tag = 'span', attrs = null, mark = true) => [h(`${tag}.xp`, attrs, text), mark ? xpMark() : null];
/** A signed forecast difference (a gain or a loss, `d` points) as xpNum draws it, "+2.3 xP", "−0.4 xP": blue as every
 *  forecast number, its sign its direction, never green or red (the user, 2026-10-22: worth doing is the solid + alone);
 *  `pre` before the sign inside the number ("≈" while it checks). */
export const xpGain = (d, tag = 'span', attrs = null, mark = true, pre = '') => xpNum(`${pre}${fmt.signed(d)}`, tag, attrs, mark);
/** The text-only "xP" marker (xpNum's; m.css .xp-u): a span, never a <small> (a row's unit under its number is one:
 *  m-ahead.css .ah-lrow .rt small, .ah-bg small). */
export const xpMark = () => h('span.xp-u', { 'aria-hidden': 'true' }, 'xP');

/**
 * Run fn every `ms` while `el` is in the document; stops once it is removed (or never attached within ~10s),
 * then calls onEnd. The returned stop() does not call onEnd.
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

/** icon('lock') or icon('M4 4h16…') → inline SVG (decorative, aria-hidden). Emoji/text → <span>. */
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

/** The Studio mark: a chalk pitch with the solver's rising plan line. */
export function logo(size = 28) {
  return svg('svg', { class: 'logo', viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': 'true' },
    svg('rect', { x: 1.5, y: 1.5, width: 29, height: 29, rx: 7, class: 'logo-bg' }),
    svg('path', { d: 'M16 6v20M6 12h4v8H6M26 12h-4v8h4', class: 'logo-chalk' }),
    svg('circle', { cx: 16, cy: 16, r: 3.6, class: 'logo-chalk' }),
    svg('path', { d: 'M7 23.5 13 18l5 2.5 7.5-9', class: 'logo-line' }),
    svg('circle', { cx: 25.5, cy: 11.5, r: 2.2, class: 'logo-dot' }));
}

// ---------------------------------------------------------------- formatting

const DASH = '—';
const MINUS = '−';
const toNum = (v) => (v == null || v === '' || typeof v === 'boolean' ? NaN : Number(v));
/** A finite number or numeric string (null, '', booleans and NaN are not). */
export const fin = (v) => Number.isFinite(toNum(v));
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
/** The listed keys of `o` that are set (not undefined). */
export const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] !== undefined).map((k) => [k, o[k]]));

/** Epoch seconds, epoch ms, ISO string or Date → ms (NaN when unknown). */
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
    // a tie goes away from zero whatever the float noise: one change summed two ways (1.5499…9 and 1.5500…04, the total's
    // change and its verdict's) reads "+1.6" in both
    const s = (Math.round(Math.abs(v) * 10 ** d + 1e-6) / 10 ** d).toFixed(d);
    return Number(s) === 0 ? s : `${v > 0 ? '+' : MINUS}${s}`;
  },
  int(n) { return fin(n) ? Math.round(toNum(n)).toLocaleString('en-GB').replace('-', MINUS) : DASH; },
  /** 1 → "1st", 12 → "12th", 23 → "23rd" (a rank in words: the player card's stats) */
  ordinal(r) { return `${r}${r % 100 >= 11 && r % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[r % 10] ?? 'th'}`; },
  /** 795123 → "795K", 8200 → "8K", 1234567 → "1.2M"; d: the M's decimals when given (rank "2.18M" at 2), else one below
   *  10M and none above. B118 (review3 P7 §4): one K, capital and whole, never "8.2k" beside "2.18M". */
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
/** 1-4, 'GK'/'GKP'/'DEF'/'MID'/'FWD' → 'GK'|'DEF'|'MID'|'FWD' (null when unknown). */
export function posName(p) {
  if (p == null) return null;
  if (fin(p)) return POS[toNum(p) - 1] || null;
  const s = String(p).toUpperCase();
  return s === 'GKP' ? 'GK' : POS.includes(s) ? s : null;
}
/** B119: a position's code on screen, FPL's (its Pick Team: GKP, DEF, MID, FWD; the bench said "GKP", the player card
 *  "GK"); posName stays the internal key (filters, shirts, every === 'GK'). null when unknown. */
export const posCode = (p) => { const k = posName(p); return k === 'GK' ? 'GKP' : k; };

/** A player's xP for display: explicit `xp_value`, else numeric `pred`, else xp[i] / xp. */
export function xpOf(p, i = 0) {
  if (!p) return null;
  if (fin(p.xp_value)) return toNum(p.xp_value);
  if (fin(p.pred)) return toNum(p.pred);
  if (Array.isArray(p.xp)) return fin(p.xp[i]) ? toNum(p.xp[i]) : null;
  return fin(p.xp) ? toNum(p.xp) : null;
}

// FPL status: letters from /api/players, solver ints (player_data.py STATUS_SHORT), or short labels like "d75".
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

// ---------------------------------------------------------------- small pieces

export const pill = (text, tone = '', attrs = {}) => h('span.pill', { ...attrs, class: [tone, attrs.class] }, text);

/** Coloured availability dot; nothing for fit players unless `always`. */
export function statusDot(status, { chance, news, always = false } = {}) {
  const s = statusInfo(status, chance);
  if (s.tone === 'ok' && !always) return null;
  const title = news ? `${s.label}: ${news}` : s.label;
  return h('span.sdot', { class: s.tone, title, role: 'img', 'aria-label': title });
}

export const loading = (text = 'Loading…') => h('div.loading', { role: 'status' }, h('span.spinner', { 'aria-hidden': 'true' }), text);

export const empty = (text, action) => h('div.empty', null, h('p', null, text), action || null);

/** An error (ApiError or any Error) as one line of text: "message: detail". */
export const errText = (e) => (e?.detail ? `${e.message}: ${e.detail}` : e?.message || String(e));

/** The server's message, the traceback behind a disclosure and an optional retry button. */
function errorBody(err, retry) {
  const detail = err?.detail;
  return [
    h('p.error-msg', null, err?.message || String(err)),
    detail ? h('details.error-detail', null, h('summary', null, 'Details'), h('pre.log', null, detail)) : null,
    retry ? h('div', null, h('button.btn', { type: 'button', onClick: () => retry() }, icon('reset'), 'Try again')) : null,
  ];
}

/** Error state as a card: errorBody under a title. */
export const errorCard = (err, { title = 'This could not be loaded', retry } = {}) =>
  card({ title, className: 'card-error', body: errorBody(err, retry) });

const TONE_ICON = { info: 'info', gain: 'check' };
/** A note in a tone ('loss' | 'warn' | 'info' | 'gain') with that tone's icon. */
export const callout = (tone, ...body) => h('div.callout', { class: tone }, icon(TONE_ICON[tone] || 'warn'), h('div', null, ...body));

/** Error state inside another card: errorBody in a callout. */
export const errorCallout = (err, { retry } = {}) =>
  h('div.callout.loss', null, icon('warn'), h('div.stack.tight', null, errorBody(err, retry)));

/** Labelled form row: field('Horizon', inputEl, 'rounds ahead') */
export function field(label, control, hint) {
  return h('label.field', null, h('span.field-label', null, label), control, hint ? h('span.field-hint', null, hint) : null);
}

/**
 * A number box's value: {bad: true} for text the browser cannot read as a number ('6e', '-', which
 * input.value reports as ''), {} when blank, else {n}.
 */
export function readNum(input) {
  if (input.validity?.badInput) return { bad: true };
  const s = input.value.trim();
  return s ? { n: Number(s) } : {};
}

/**
 * Gameweek number box: blank = the server's default GW (`placeholder`). onChange(gw | undefined) fires for
 * a whole number 1..max or a blank; anything else puts back get().
 */
export function gwInput({ get, onChange, max = 38, ...attrs }) {
  const input = h('input.input.num', { type: 'number', min: 1, max, step: 1, inputmode: 'numeric', placeholder: 'next', ...attrs, value: get() ?? '' });
  input.addEventListener('change', () => {
    const { bad, n } = readNum(input);
    if (!bad && (n === undefined || (Number.isInteger(n) && n >= 1 && n <= max))) onChange(n);
    input.value = get() ?? '';
  });
  return input;
}

// ---------------------------------------------------------------- FPL entries

const ENTRY_RE = /^\d{1,10}$/;  // api/entry.py _entry_id
/** An FPL entry id from text or a recent-entry row ({entry_id | id | entry}) → its digits, or null. */
export function entryId(v) {
  const id = v && typeof v === 'object' ? v.entry_id ?? v.id ?? v.entry : v;
  const s = id == null ? '' : String(id).trim();
  return ENTRY_RE.test(s) ? s : null;
}

/** Hover text for a recent entry (GET /api/entries/recent row): manager · rank · points · id. */
export const entryTitle = (r) => [r.manager, r.overall_rank ? `overall rank ${fmt.int(r.overall_rank)}` : null,
  r.points != null ? `${r.points} pts` : null, `#${r.entry_id}`].filter(Boolean).join(' · ');

/** "Recent:" and one chip per recent entry (team name, then its id); onPick(id). [] when there are none. */
export function recentEntryChips(list, { limit = 6, onPick } = {}) {
  const top = (list || []).slice(0, limit);
  if (!top.length) return [];
  return [h('span.muted.small', null, 'Recent:'), ...top.map((r) => {
    const name = r.team_name || r.manager;
    return h('button.btn.sm.ghost.entry-chip', { type: 'button', title: entryTitle(r), onClick: () => onPick(String(r.entry_id)) },
      name || `#${r.entry_id}`, name ? h('span.muted.num', null, r.entry_id) : null);
  })];
}

/** Section card. Returns <section> with .bodyEl and .setBody(...children). */
export function card({ title, sub, actions, body, className, id, attrs } = {}) {
  const bodyEl = h('div.card-body', null, body);
  const head = title || sub || actions
    ? h('header.card-head', null,
      h('div.card-titles', null, title ? h('h2.card-title', null, title) : null, sub ? h('p.card-sub', null, sub) : null),
      actions ? h('div.card-actions', null, actions) : null)
    : null;
  const el = h('section.card', { ...attrs, class: className, id }, head, bodyEl);
  el.bodyEl = bodyEl;
  el.setBody = (...children) => { bodyEl.replaceChildren(); append(bodyEl, children); return el; };
  return el;
}

/** statTile({label, value, sub, tone:'gain'|'loss'|'warn', title}) — value may be a Node (e.g. countdown). */
export function statTile({ label, value, sub, tone, title, icon: ic } = {}) {
  return h('div.stat', { class: tone, title },
    h('div.stat-label', null, ic ? icon(ic, { size: 15 }) : null, label),
    h('div.stat-value', null, value instanceof Node ? value : value ?? DASH),
    sub ? h('div.stat-sub', null, sub) : null);
}

// ---------------------------------------------------------------- motion, gestures and focus (Forkcast's shell and screen)

/** The system's Reduce Motion is on: the one test (Forkcast's sheets, Ahead's swipes, the pitch's armband hop). */
export const reduceMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** A gesture that owns the finger stops the scroll (a non-passive touchmove's preventDefault: Forkcast's sheet drags, the
 *  pull to refresh, the pitch's drags, the move rows' swipes), only while the touch can still be cancelled: one whose
 *  scroll has already begun is not (cancelable false), its preventDefault does nothing but log Chrome's "Ignored attempt
 *  to cancel a touchmove event with cancelable=false" (the v1.3.72 QA, 2026-10-22: about-clips' "no console errors"
 *  under load, the move-row swipe). The same as e.preventDefault() wherever that does anything. */
export const holdTouch = (e) => { if (e.cancelable) e.preventDefault(); };

/** B43 (Apple, "Designing Fluid Interfaces": a release carries on at its speed): a drag's speed at release from its
 *  last FLICK_WINDOW_MS of samples, their least-squares slope in px/ms (0 with fewer than two: a finger that rested
 *  before it lifted), and where a release at that speed carries it, project(pos) = pos + velocity × FLICK_MS. One
 *  helper for Forkcast's sheet drags, the pitch's week swipe and the move rows' swipes. */
const FLICK_WINDOW_MS = 100;
export const FLICK_MS = 150;  // how far a release carries, in ms of its speed: a first value, its phone check is open
export function flick() {
  const pts = [];
  const self = {
    /** A sample: pos (px) at t (ms, the event's timeStamp); samples older than FLICK_WINDOW_MS before it go. */
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

/** The selector of the element whose data-row is `row`, its value escaped (a plan row's holds a chip as JSON: quotes). */
export const rowKey = (row) => `[data-row="${globalThis.CSS?.escape ? CSS.escape(row) : String(row).replace(/["\\]/g, '\\$&')}"]`;
/** B48 (APG dialog: on close, focus goes back to the opener, or to what takes its place when it is gone): the key a
 *  focused element's replacement is found by once its part of the page is drawn anew: its row's data-row, else its
 *  move's data-gw / data-out / data-in (a transfer or a suggestion row, its + and × too), else the focus home it is in
 *  (data-focus-home: Ahead's week line); null when it has none. */
export function focusKey(el) {
  const row = el?.closest?.('[data-row]');
  if (row) return rowKey(row.dataset.row);
  const mv = el?.closest?.('[data-gw][data-out][data-in]');
  if (mv) return `[data-gw="${mv.dataset.gw}"][data-out="${mv.dataset.out}"][data-in="${mv.dataset.in}"]`;
  return el?.closest?.('[data-focus-home]') ? '[data-focus-home]' : null;
}
const FOCUSABLE = 'button:not(:disabled), a[href], input, select, textarea, [tabindex]';
/** Focus what `key` (focusKey) names in root (itself, or the first control in it: a transfer row's target), else
 *  `fallback`, without scrolling; a match not drawn (hidden, or with no box: display none) is no
 *  match, as focus() would leave focus nowhere. */
export function refocus(root, key, fallback = null) {
  const at = key ? root?.querySelector(key) : null;
  const t = at && (at.matches(FOCUSABLE) ? at : at.querySelector(FOCUSABLE));
  ((t?.getClientRects().length ? t : null) || fallback)?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- toast / modal / confirm

/** The toasts' live region (#toasts, aria-live polite), made once: a shell makes it at start (Forkcast's boot) so its
 *  first toast is announced too (review3 Part 6 §11: a region added with its first message may go unread). */
export function toastRegion() {
  let r = document.getElementById('toasts');
  if (!r) document.body.append(r = h('div#toasts', { 'aria-live': 'polite', 'aria-atomic': 'false' }));
  return r;
}

/** Where a new toast goes: a shell may set a function (setToastPlace) called once the toast is in the region, as
 *  fn(region, toast): an answer that is a string is the region's data-place for its CSS, and it may place the region
 *  itself (Forkcast: app.js placeToasts, the top of the screen or a sheet's foot); unset, the region's own place. */
let toastPlace = null;
export const setToastPlace = (fn) => { toastPlace = typeof fn === 'function' ? fn : null; };

/** Where rect r overlaps rect o grown by pad ({left, top, right, bottom} each): that rect, or null when they don't. */
export function overlapOf(r, o, pad = 0) {
  const left = Math.max(r.left, o.left - pad), right = Math.min(r.right, o.right + pad);
  const top = Math.max(r.top, o.top - pad), bottom = Math.min(r.bottom, o.bottom + pad);
  return right > left && bottom > top ? { left, top, right, bottom } : null;
}

/** A9 (Birman s48: a message is better if it doesn't vanish on its own; s50: nothing changes under a finger already
 *  moving): a toast with an action (Undo) never leaves by itself. Once its time is up (counted from when a shell says
 *  its action first takes a tap: 'toast-armed', Forkcast's placeToasts) it goes after your next touch anywhere else; a
 *  newer toast with an action replaces it, and its action takes it; so no finger, however slow, finds it gone (QA
 *  check6: a tap on a loaded machine came 2.2 s after a timed toast had left). A toast without one leaves after its
 *  timeout (nothing on it to miss). One tagged 'pending' neither a touch nor a newer toast ends: it stays until what
 *  follows replaces it in place (B23; a refusal's "Unfreeze GW8" or the drift's "Use it" comes in beside it). */
const STAYING = new Set();
const END_MS = 400;
if (typeof addEventListener === 'function') {
  // a touch elsewhere after its time is up marks it; it goes once that gesture has ended and its click has landed
  // (END_MS after the finger lifts: nothing on the page moves under a tap in progress, s50)
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

/** toast('Saved', 'ok'|'info'|'warn'|'error', {timeout, action:{label, onClick, keep}, actions, tag, replaces, onDismiss}) →
 *  dismiss(), whose .update(msg) changes its words alone. actions: [{label, onClick}, …], buttons in that order (B89:
 *  "Try again" beside Undo); action is the one-button form. keep: the toast stays up after that action; an onClick that
 *  answers a promise (a sheet it opened, settled once that has closed: Forkcast's take's Why) holds it, no touch ending
 *  it, until that settles, then gives it its whole time again (the review of the first-use proposals, 2026-10-21: a
 *  touch in the Why sheet after the toast's 6.5 s ended it, and its Undo with it). tag: the toast's data-tag (Forkcast: 'pending', an edit's
 *  toast while the full plan checks it). replaces: a tag; a toast up with it becomes this one in place (B23: its words,
 *  kind, actions, tag and time, its place and its armed Undo kept; a button whose label stays is kept, as a finger may
 *  be on it), and its dismiss is returned; with none up, a new toast comes in. onDismiss: called once when the toast
 *  leaves any way but by one of its own buttons (a touch elsewhere, a newer toast with an action, ×, its time, another
 *  toast in its place: B22, the drift's toast keeps your plan then). */
/** A toast's words in parts → [head, num, rest]: its last " · +4.7 pts" with its weak word (" (narrow)") the number,
 *  kept whole; the words before it a head that may clip (m.css: never more than three lines in all; the reviews,
 *  2026-10-11: long toasts covered the week switcher, and a clip at the end would take the number every toast ends
 *  with, B145); the words after it (an edit's ending, "· Forkcast rates them level: …") the rest, which wraps under it
 *  (review 5, 2026-10-12: held whole with the number they ran off the toast). A take's or a removal's two numbers are
 *  one, " · +2.6 vs rolling · total +4.0" (COPY.planGain, changeNum: the user, 2026-10-21, fix all (first-use proposal
 *  #1)), so neither clips. No number: [m, '', '']. */
export const toastParts = (m) => {
  const cut = [...m.matchAll(/ · (?:[+−-]?\d[\d.,]* pts\b(?: \([a-z ]+\))?|(?:[+−-]?\d[\d,]*(?:\.\d+)? vs rolling · )?total [+−-]?\d[\d,]*(?:\.\d+)?)/g)].at(-1);
  return cut ? [m.slice(0, cut.index), cut[0], m.slice(cut.index + cut[0].length)] : [m, '', ''];
};
/** A toast's head (toastParts') in parts → [lead, also]: its first part, to its first " · " (a take's moves: what clips),
 *  and what follows it ("· Free Hit in GW8 taken off": what else the edit did, kept whole; the review of the first-use
 *  proposals, 2026-10-21: a three-move take's head cut to two lines took the Free Hit it took off with it). None: ''. */
export const toastLead = (head) => { const i = head.indexOf(' · '); return i < 0 ? [head, ''] : [head.slice(0, i), head.slice(i)]; };
/** …as drawn: the number opens the tail, the rest after it in the same span (one clip keeps the number); two numbers
 *  each whole, a line break only between them (m.css: "· total +4.0" under "· +2.6 vs rolling" where a toast with Why
 *  and Undo is too narrow for both; never narrower than one of them: its buttons go under its words then), and the tail
 *  on a line of its own flush with the line above (m.css --toast-sp: its " · " keeps its space); the head's
 *  lead (.toast-lead) clips before what follows it (.toast-also: toastLead). */
const toastWords = (m) => {
  if (typeof m !== 'string') return m;
  const [head, num, rest] = toastParts(m);
  const [lead, also] = toastLead(head);
  const words = h('span.toast-head', null, h('span.toast-lead', null, lead), also ? h('span.toast-also', null, also) : null);
  if (!num) return words;
  const nums = num.split(/(?= · total )/).flatMap((x, j) => (j ? [' ', h('span', null, x.slice(1))] : [h('span', null, x)]));
  return [words, h('span.toast-tail', null, h('span.toast-num', null, nums), rest)];
};

export function toast(msg, kind = 'info', opts = {}) {
  const region = toastRegion();
  const up = opts.replaces ? [...region.children].find((t) => t.dataset.tag === opts.replaces && !t.classList.contains('leaving')) : null;
  if (up?.retoast) return up.retoast(msg, kind, opts);
  let ic = null, kd = null, btns = [], ms = 0, timer = 0, ondis = null;
  const dismiss = () => {
    if (!el.isConnected || el.classList.contains('leaving')) return;
    STAYING.delete(stay);
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 160);
    const f = ondis;
    ondis = null;
    f?.();
  };
  const text = h('span.toast-msg');
  const x = h('button.icon-btn', { type: 'button', 'aria-label': 'Dismiss', onClick: () => dismiss() }, icon('close', { size: 14 }));
  const el = h('div.toast', null, text, x);
  // held: the `keep` actions whose sheet is still up (hold); its time runs only once none is
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
  // its buttons all on a line of their own under the words (m.css .toast.under) once one of them can't sit beside its
  // widest number (m.css .toast-msg's min-width), never split between the two lines; past three lines once laid out,
  // that line one of them, its words clip (m.css .toast-msg.long), never its number (toastWords): the tail keeps up to
  // two lines (the number and the rest's first), the head what is left, three with no tail. The head's lead clips first:
  // what follows it keeps its lines (.toast-also, measured as it lies once long)
  const fit = () => globalThis.requestAnimationFrame?.(() => {
    if (!text.isConnected) return;
    text.classList.remove('long');
    el.classList.remove('under');
    const lh = parseFloat(getComputedStyle(text).lineHeight) || 17;
    const lines = (e) => (e ? Math.round(e.getBoundingClientRect().height / lh) : 0);
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
  });
  dismiss.update = (m) => { if (el.isConnected && !el.classList.contains('leaving')) { fill(text, toastWords(m)); fit(); } };
  el.retoast = (m, k, { timeout = 4500, action, actions, tag = null, onDismiss = null } = {}) => {
    const left = ondis;  // the toast this one takes the place of has left
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
    fill(text, toastWords(m));
    fit();
    const list = actions ?? (action ? [action] : []);
    const had = new Map(btns.map((b) => [b.label, b]));
    btns = list.map((a) => {
      const b = had.get(a.label) ?? { label: a.label };
      had.delete(a.label);
      b.act = a;
      // `keep`: the toast stays up after it, held while what it opened is up (a take's Why: its Undo still there when the
      // sheet closes)
      b.el ??= h('button.btn.sm.ghost', { type: 'button', onClick: () => { if (b.act.keep) { hold(b.act.onClick?.()); return; } ondis = null; b.act.onClick?.(); dismiss(); } }, a.label);
      return b;
    });
    for (const b of had.values()) b.el.remove();
    // in their order before ×; a kept one moves only when out of place (a finger may be on it)
    let next = x;
    for (const b of [...btns].reverse()) { if (b.el.nextSibling !== next) next.before(b.el); next = b.el; }
    if (tag) el.dataset.tag = tag; else delete el.dataset.tag;
    ondis = onDismiss;
    ms = k === 'error' ? Math.max(timeout, 8000) : timeout;
    clearTimeout(timer);
    if (list.length) {
      for (const s of [...STAYING]) if (s !== stay && s.el.dataset.tag !== 'pending') s.dismiss();
      STAYING.add(stay);
      restart();  // from now when it is up already ('toast-armed' restarts it for a new one); none while held
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

const openModals = new Set();  // each open modal's close()
/** Close every open modal as Esc would (each resolves null); the router calls this on every route change. */
export function closeAllModals() { for (const close of [...openModals]) close(null); }

/**
 * modal({title, body, actions:[{label, kind:'primary'|'danger'|'ghost', value, onClick(close)}], wide})
 * → {el, close(value), result: Promise<value|null>}. An onClick returning false keeps it open.
 * Esc / backdrop click resolve null.
 */
export function modal({ title, body, actions, wide = false, onClose } = {}) {
  let resolve;
  const result = new Promise((r) => { resolve = r; });
  const close = (value = null) => {
    if (!dlg.open) return;
    openModals.delete(close);
    dlg.close();
    dlg.remove();
    onClose?.(value);
    resolve(value);
  };
  const acts = (actions?.length ? actions : [{ label: 'Close' }]).map((a) =>
    h('button.btn', {
      type: 'button', class: a.kind,
      onClick: async () => { if ((await a.onClick?.(close)) !== false) close(a.value ?? a.label); },
    }, a.label));
  const titleId = uid('dlg');
  const dlg = h('dialog.modal', { class: { wide }, 'aria-labelledby': titleId },
    h('header.modal-head', null, h('h2', { id: titleId }, title || ''),
      h('button.icon-btn', { type: 'button', 'aria-label': 'Close', onClick: () => close(null) }, icon('close'))),
    h('div.modal-body', null, body),
    h('footer.modal-foot', null, acts));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(null); });
  document.body.append(dlg);
  dlg.showModal();
  openModals.add(close);
  return { el: dlg, close, result };
}

/** confirm({title, body, confirmLabel, danger}) → Promise<boolean> */
export function confirm({ title = 'Are you sure?', body = '', confirmLabel = 'Confirm', danger = false } = {}) {
  return modal({
    title, body: typeof body === 'string' ? h('p', null, body) : body,
    actions: [{ label: 'Cancel', kind: 'ghost', value: false }, { label: confirmLabel, kind: danger ? 'danger' : 'primary', value: true }],
  }).result.then((v) => v === true);
}

// ---------------------------------------------------------------- tabs / segmented

const ROVING = new WeakMap();
/**
 * roving(group, {items, attr, pick}) → group: the one keyboard pattern of a radio group (and a tab list, B113): one Tab
 * stop, the checked enabled option (the first enabled one when none is checked), and Arrow keys / Home / End moving
 * the focus over the enabled options, wrapping, each picking the one it lands on (pick(button): the path a tap takes,
 * so a key does what a tap does). items(): the options as drawn now (its radios by default); attr: the attribute that
 * says checked. Set up once per group; roving(group) again (its options checked or drawn anew) paints them again. A
 * pick that draws the options anew in the same group moves the focus to the one then checked.
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

function choiceGroup({ items, active, onChange, label, role, cls }) {
  const itemRole = role === 'tablist' ? 'tab' : 'radio';
  const selAttr = itemRole === 'tab' ? 'aria-selected' : 'aria-checked';
  let current = active ?? items[0]?.key;
  const buttons = items.map((it) => h('button', {
    type: 'button', role: itemRole, class: 'choice', dataset: { key: it.key }, disabled: it.disabled,
    title: it.title, onClick: () => select(it.key, true),
  }, it.icon ? icon(it.icon, { size: 15 }) : null, it.label ?? it.key,
  it.badge != null ? h('span.badge', null, it.badge) : null));
  const el = roving(h('div', { role, class: cls, 'aria-label': label }, buttons), { items: () => buttons, attr: selAttr, pick: (b) => select(b.dataset.key, true) });
  function paint() {
    for (const b of buttons) b.setAttribute(selAttr, String(b.dataset.key === String(current)));
    roving(el);
  }
  function select(key, fire) {
    const changed = String(key) !== String(current);
    current = items.find((i) => String(i.key) === String(key))?.key ?? key;
    paint();
    if (fire && changed) onChange?.(current);
  }
  paint();
  el.setActive = (key) => select(key, false);
  el.getActive = () => current;
  return el;
}

/** tabs({items:[{key,label,badge,icon}], active, onChange}) → tab bar (views render the panel). */
export const tabs = ({ items = [], active, onChange, label } = {}) =>
  choiceGroup({ items, active, onChange, label, role: 'tablist', cls: 'tabs' });

/** segmented({items, value, onChange, label}) → compact radio-button group (e.g. FDR / Attack / Defence). */
export const segmented = ({ items = [], value, onChange, label } = {}) =>
  choiceGroup({ items, active: value, onChange, label, role: 'radiogroup', cls: 'seg' });

// ---------------------------------------------------------------- countdown

function remaining(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), hh = Math.floor((s % 86400) / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return d ? `${d}d ${p(hh)}h ${p(mm)}m` : `${hh}h ${p(mm)}m ${p(ss)}s`;
}

/** countdown(epoch, {onZero, passed}) → live <time> "2d 04h 13m"; the title carries the local date. */
export function countdown(epoch, { onZero, passed = 'Deadline passed' } = {}) {
  const ms = toMs(epoch);
  const el = h('time.countdown', Number.isFinite(ms) ? { datetime: new Date(ms).toISOString(), title: fmt.date(ms) } : null);
  let fired = false;
  const tick = () => {
    if (!Number.isFinite(ms)) { el.textContent = DASH; return; }
    const left = ms - Date.now();
    el.textContent = left > 0 ? remaining(left) : passed;
    el.classList.toggle('soon', left > 0 && left < 86400e3);
    if (left <= 0 && !fired) { fired = true; onZero?.(); }
  };
  tick();
  whileConnected(el, tick, 1000);
  return el;
}

// ---------------------------------------------------------------- clipboard / download / csv

export async function copyText(text, msg = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' }, text);
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (msg) toast(msg, 'ok', { timeout: 2000 });
}

export function download(filename, text, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csvCell = (v) => {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const textOf = (x) => (x instanceof Node ? x.textContent : x == null ? '' : String(x));

// ---------------------------------------------------------------- table

const isBlank = (v) => v == null || v === '' || (typeof v === 'number' && Number.isNaN(v));
/**
 * table()'s sort order for two cell values: blanks last in either direction, numbers by value, text
 * numeric-aware and case-insensitive. sign 1 = ascending, -1 = descending.
 */
export function compareValues(a, b, sign = 1) {
  const ba = isBlank(a), bb = isBlank(b);
  if (ba || bb) return ba === bb ? 0 : ba ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return sign * (a - b);
  return sign * String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
function defaultCell(v) {
  if (isBlank(v)) return DASH;
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(+v.toFixed(2));
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return String(v);
}

/**
 * table({columns:[{key, label, num, fmt(value,row), sort:false|fn(row), render(row,i), title, width,
 *        className, csv:false|fn(row)}], rows, sortKey, sortDir:'asc'|'desc', onRow(row,ev), stickyFirst,
 *        csv:'file.csv'|false, empty, rowClass(row), maxHeight, dense, caption})
 * → wrapper with .update(rows), .getRows() (current order), .toCSV().
 * Blank values always sort last. num columns are right-aligned mono and sort descending first.
 */
export function table({
  columns = [], rows = [], sortKey = null, sortDir = null, onRow, stickyFirst = false, csv = 'table.csv',
  empty: emptyText = 'Nothing to show yet.', rowClass, maxHeight, dense = false, caption,
} = {}) {
  let data = rows.slice();
  let key = sortKey;
  const colOf = (k) => columns.find((c) => c.key === k);
  let dir = sortDir || (key && colOf(key)?.num ? 'desc' : 'asc');
  const thead = h('thead');
  const tbody = h('tbody');
  const tbl = h('table.tbl', { class: { 'sticky-first': stickyFirst, dense } },
    caption ? h('caption.sr-only', null, caption) : null, thead, tbody);
  const scroll = h('div.tbl-scroll', {
    tabindex: 0, 'aria-label': caption || 'Table',
    style: maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : null,
  }, tbl);
  const count = h('span.tbl-count');
  const tools = csv === false ? null : h('div.tbl-tools', null, count,
    h('button.btn.sm.ghost', { type: 'button', onClick: () => download(csv, toCSV()) }, icon('download', { size: 15 }), 'Download CSV'));
  const el = h('div.tbl-wrap', null, tools, scroll);

  const sortVal = (c, r) => (typeof c.sort === 'function' ? c.sort(r) : r[c.key]);
  function sorted() {
    const c = colOf(key);
    if (!c) return data;
    const sign = dir === 'desc' ? -1 : 1;
    return data.slice().sort((ra, rb) => compareValues(sortVal(c, ra), sortVal(c, rb), sign));
  }
  function head() {
    thead.replaceChildren(h('tr', null, columns.map((c) => {
      const sortable = c.sort !== false && (c.key != null || typeof c.sort === 'function');
      const active = sortable && c.key === key;
      const th = h('th', {
        scope: 'col', class: [c.num && 'num', c.className, active && 'sorted'], title: c.title,
        style: c.width ? { width: typeof c.width === 'number' ? `${c.width}px` : c.width } : null,
        'aria-sort': active ? (dir === 'asc' ? 'ascending' : 'descending') : null,
      }, sortable
        ? h('button.th-btn', {
          type: 'button',
          onClick: () => {
            if (key === c.key) dir = dir === 'asc' ? 'desc' : 'asc';
            else { key = c.key; dir = c.num ? 'desc' : 'asc'; }
            render();
          },
        }, c.label ?? c.key, h('span.sort-ind', { 'aria-hidden': 'true' }))
        : h('span.th-txt', null, c.label ?? ''));
      return th;
    })));
  }
  function body() {
    const list = sorted();
    if (!list.length) {
      tbody.replaceChildren(h('tr', null, h('td.tbl-empty', { colspan: columns.length }, emptyText)));
    } else {
      const frag = document.createDocumentFragment();
      list.forEach((r, i) => {
        const tr = h('tr', { class: [rowClass?.(r), onRow && 'clickable'], tabindex: onRow ? 0 : null });
        for (const c of columns) {
          const v = c.key != null ? r[c.key] : undefined;
          const content = c.render ? c.render(r, i) : c.fmt ? c.fmt(v, r) : defaultCell(v);
          tr.append(h('td', { class: [c.num && 'num', c.className] }, content));
        }
        if (onRow) {
          const go = (e) => { if (!e.target.closest('button, a, input, select, label, textarea')) onRow(r, e); };
          tr.addEventListener('click', go);
          tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) onRow(r, e); });
        }
        frag.append(tr);
      });
      tbody.replaceChildren(frag);
    }
    count.textContent = `${data.length} row${data.length === 1 ? '' : 's'}`;
  }
  function render() { head(); body(); }
  function toCSV() {
    const cols = columns.filter((c) => c.csv !== false && (c.key != null || typeof c.csv === 'function'));
    const lines = [cols.map((c) => csvCell(c.csvLabel ?? textOf(c.label ?? c.key))).join(',')];
    for (const r of sorted()) lines.push(cols.map((c) => csvCell(typeof c.csv === 'function' ? c.csv(r) : r[c.key])).join(','));
    return lines.join('\n');
  }
  render();
  el.update = (next) => { data = (next || []).slice(); body(); return el; };
  el.getRows = sorted;
  el.toCSV = toCSV;
  return el;
}

// ---------------------------------------------------------------- line chart

function niceStep(span, count) {
  const raw = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
function niceTicks(lo, hi, count = 5) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const step = niceStep(hi - lo, count);
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const out = [];
  for (let v = a; v <= b + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

/**
 * lineChart({series:[{name, points:[[x,y]], band:[[x,lo,hi]], color, dashed}], xLabel, yLabel, height,
 *            xFmt(x), yFmt(y), yZero, labels}) → <figure> with legend, SVG plot (redrawn on resize), crosshair tooltip.
 * yZero (default: when all y ≥ 0) pulls the axis to 0; labels=false drops the end-of-line names.
 * Colours follow series order (--s1…--s8) unless `color` is given. y=null breaks a line.
 */
export function lineChart({
  series = [], xLabel = '', yLabel = '', height = 240, xFmt = (x) => String(x), yFmt,
  yZero, labels = true, ariaLabel,
} = {}) {
  const color = (s, i) => s.color || `var(--s${(i % 8) + 1})`;
  const legend = series.length > 1
    ? h('div.chart-legend', null, series.map((s, i) => h('span.lg-item', null,
      h('span.lg-key', { class: { dashed: s.dashed }, style: { '--c': color(s, i) } }), s.name)))
    : null;
  const plot = h('div.chart-plot', { tabindex: 0, style: { height: `${height}px` }, 'aria-label': ariaLabel || [yLabel, xLabel].filter(Boolean).join(' by ') || 'Chart' });
  const tip = h('div.chart-tip', { hidden: true });
  const root = h('figure.chart', null, legend, plot);
  plot.append(tip);

  const xsAll = [...new Set(series.flatMap((s) => [...(s.points || []), ...(s.band || [])].map((p) => toNum(p[0])).filter(Number.isFinite)))].sort((a, b) => a - b);
  const ys = series.flatMap((s) => [
    ...(s.points || []).map((p) => p[1]),
    ...(s.band || []).flatMap((b) => [b[1], b[2]]),
  ]).filter(fin).map(toNum);
  if (!xsAll.length || !ys.length) {
    plot.append(h('div.chart-empty', null, 'No data to chart.'));
    return root;
  }
  let yLo = Math.min(...ys), yHi = Math.max(...ys);
  if (yZero ?? yLo >= 0) yLo = Math.min(0, yLo);
  const yt = niceTicks(yLo, yHi, Math.max(3, Math.round(height / 55)));
  yLo = yt[0]; yHi = yt[yt.length - 1];
  // Without a yFmt, ticks get just enough decimals for their step and values one more.
  const step = yt.length > 1 ? yt[1] - yt[0] : 1;
  const tickD = step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step) - 1e-9));
  const tickFmt = yFmt || ((v) => fmt.num(v, tickD));
  const valFmt = yFmt || ((v) => fmt.num(v, step >= 10 ? 0 : Math.max(1, tickD + 1)));
  let hover = -1;
  let geom = null;

  function draw(W) {
    const H = height;
    const direct = labels && series.length > 1 && series.length <= 4 && W >= 480;
    const labW = direct ? Math.min(120, 10 + 6.6 * Math.max(...series.map((s) => String(s.name).length))) : 0;
    const m = { l: yLabel ? 50 : 38, r: 12 + labW, t: 10, b: xLabel ? 40 : 26 };
    const pw = Math.max(10, W - m.l - m.r), ph = Math.max(10, H - m.t - m.b);
    const x0 = xsAll[0], x1 = xsAll[xsAll.length - 1];
    const X = (x) => (x1 === x0 ? m.l + pw / 2 : m.l + ((x - x0) / (x1 - x0)) * pw);
    const Y = (y) => m.t + ph - ((y - yLo) / (yHi - yLo || 1)) * ph;
    const maxXT = Math.max(2, Math.floor(pw / 52));
    let xt = xsAll;
    if (xt.length > maxXT) {
      xt = niceTicks(x0, x1, maxXT).filter((v) => v >= x0 && v <= x1);
      if (xsAll.every(Number.isInteger)) xt = xt.filter(Number.isInteger);
    }
    const g = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-hidden': 'true' });
    for (const v of yt) {
      g.append(svg('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), class: v === 0 && yLo < 0 ? 'axis' : 'grid' }));
      g.append(svg('text', { x: m.l - 6, y: Y(v), class: 'tick', 'text-anchor': 'end', 'dominant-baseline': 'middle' }, tickFmt(v)));
    }
    g.append(svg('line', { x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph, class: 'axis' }));
    for (const v of xt) g.append(svg('text', { x: X(v), y: m.t + ph + 16, class: 'tick', 'text-anchor': 'middle' }, xFmt(v)));
    if (xLabel) g.append(svg('text', { x: m.l + pw / 2, y: H - 4, class: 'axis-label', 'text-anchor': 'middle' }, xLabel));
    if (yLabel) g.append(svg('text', { x: 12, y: m.t + ph / 2, class: 'axis-label', 'text-anchor': 'middle', transform: `rotate(-90 12 ${m.t + ph / 2})` }, yLabel));

    const ends = [];
    series.forEach((s, i) => {
      const style = { '--c': color(s, i) };
      const band = (s.band || []).filter((b) => fin(b[0]) && fin(b[1]) && fin(b[2])).map((b) => b.map(toNum)).sort((a, b) => a[0] - b[0]);
      if (band.length > 1) {
        const up = band.map((b) => `${X(b[0])},${Y(b[2])}`), lo = band.slice().reverse().map((b) => `${X(b[0])},${Y(b[1])}`);
        g.append(svg('path', { d: `M${up.join('L')}L${lo.join('L')}Z`, class: 'band', style }));
      }
      const pts = (s.points || []).filter((p) => fin(p[0])).map((p) => [toNum(p[0]), fin(p[1]) ? toNum(p[1]) : null]).sort((a, b) => a[0] - b[0]);
      let d = '', pen = false;
      for (const [x, y] of pts) {
        if (y == null) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`;
        pen = true;
      }
      if (d) g.append(svg('path', { d, class: ['line', s.dashed && 'dashed'], style }));
      const valid = pts.filter((p) => p[1] != null);
      if (valid.length <= 40) for (const [x, y] of valid) g.append(svg('circle', { cx: X(x), cy: Y(y), r: 3, class: 'dot', style }));
      if (direct && valid.length) { const [x, y] = valid[valid.length - 1]; ends.push({ x: X(x), y: Y(y), name: s.name }); }
    });
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
    for (const e of ends) g.append(svg('text', { x: m.l + pw + 8, y: e.y, class: 'end-label', 'dominant-baseline': 'middle' }, e.name));
    const cross = svg('line', { y1: m.t, y2: m.t + ph, class: 'crosshair', visibility: 'hidden' });
    const marks = svg('g');
    g.append(cross, marks);
    plot.querySelector('svg')?.remove();
    plot.prepend(g);
    geom = { X, Y, m, pw, cross, marks };
    if (hover >= 0) showAt(hover);
  }

  function showAt(i) {
    if (!geom) return;
    hover = Math.max(0, Math.min(xsAll.length - 1, i));
    const x = xsAll[hover];
    const { X, Y, cross, marks, m, pw } = geom;
    const px = X(x);
    cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
    marks.replaceChildren();
    const rows = [];
    series.forEach((s, si) => {
      const p = (s.points || []).find((q) => toNum(q[0]) === x);
      const b = (s.band || []).find((q) => toNum(q[0]) === x);
      const y = p && fin(p[1]) ? toNum(p[1]) : null;
      if (y != null) marks.append(svg('circle', { cx: px, cy: Y(y), r: 4.5, class: 'dot hot', style: { '--c': color(s, si) } }));
      if (y != null || b) rows.push({ s, si, y, b });
    });
    rows.sort((a, b) => (b.y ?? -Infinity) - (a.y ?? -Infinity));
    tip.replaceChildren(h('div.tip-x', null, xFmt(x)), ...rows.map(({ s, si, y, b }) => h('div.tip-row', null,
      h('span.lg-key', { class: { dashed: s.dashed }, style: { '--c': color(s, si) } }),
      h('strong.num', null, y == null ? DASH : valFmt(y)),
      h('span.tip-name', null, s.name),
      b && fin(b[1]) && fin(b[2]) ? h('span.tip-band', null, `${valFmt(toNum(b[1]))}–${valFmt(toNum(b[2]))}`) : null)));
    tip.hidden = false;
    const right = px > m.l + pw / 2;
    tip.style.left = right ? '' : `${px + 12}px`;
    tip.style.right = right ? `${plot.clientWidth - px + 12}px` : '';
  }
  function hide() {
    hover = -1;
    tip.hidden = true;
    geom?.cross.setAttribute('visibility', 'hidden');
    geom?.marks.replaceChildren();
  }
  plot.addEventListener('pointermove', (e) => {
    if (!geom) return;
    const r = plot.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    xsAll.forEach((x, i) => { if (Math.abs(geom.X(x) - px) < Math.abs(geom.X(xsAll[best]) - px)) best = i; });
    showAt(best);
  });
  plot.addEventListener('pointerleave', hide);
  plot.addEventListener('blur', hide);
  plot.addEventListener('focus', () => showAt(hover >= 0 ? hover : xsAll.length - 1));
  plot.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); showAt(hover + (e.key === 'ArrowRight' ? 1 : -1)); }
    if (e.key === 'Escape') hide();
  });

  let lastW = 0;
  const redraw = () => {
    const w = Math.round(plot.clientWidth);
    if (w > 0 && w !== lastW) { lastW = w; draw(w); }
  };
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => { if (!root.isConnected && lastW) ro.disconnect(); else redraw(); });
    ro.observe(plot);
  } else draw(640);
  return root;
}

// ---------------------------------------------------------------- heat cell

/**
 * heatCell(value, scale, {text, title}) → <span class="heat">.
 * scale 'fdr' (default): FPL difficulty 1-5 colours. scale {min, max, reverse}: continuous bad→neutral→good,
 * where high = good unless reverse. value null → muted dash (blank GW).
 */
export function heatCell(value, scale = 'fdr', { text, title } = {}) {
  const label = text ?? (fin(value) ? (scale === 'fdr' ? String(Math.round(toNum(value))) : fmt.num(value, 2)) : DASH);
  if (!fin(value)) return h('span.heat.heat-none', { title }, text ?? DASH);
  const v = toNum(value);
  if (scale === 'fdr' || scale == null) {
    const k = Math.max(1, Math.min(5, Math.round(v)));
    return h('span.heat', { class: `fdr-${k}`, title: title ?? `Difficulty ${k}` }, label);
  }
  const { min = 0, max = 1, reverse = false } = scale;
  let t = max === min ? 0.5 : (v - min) / (max - min);
  t = Math.max(0, Math.min(1, reverse ? 1 - t : t));
  const pole = t >= 0.5 ? 'var(--heat-good)' : 'var(--heat-bad)';
  const pct = Math.round(Math.abs(t - 0.5) * 200);
  return h('span.heat', { title, style: { background: `color-mix(in oklab, ${pole} ${pct}%, var(--heat-mid))` } }, label);
}

// ---------------------------------------------------------------- pitch & transfer card

const CHIPS = {
  wc: 'Wildcard', wildcard: 'Wildcard', fh: 'Free Hit', freehit: 'Free Hit',
  bb: 'Bench Boost', bboost: 'Bench Boost', tc: 'Triple Captain', '3xc': 'Triple Captain',
};
export const chipName = (c) => (c ? CHIPS[String(c).toLowerCase()] || String(c).toUpperCase() : null);

const SHIRT = 'M11 3.5 6.5 5.5 2.5 10l3.2 3.4 2.3-1.6V28.5h16V11.8l2.3 1.6 3.2-3.4-4-4.5L21 3.5c-.6 2.3-2.6 3.6-5 3.6s-4.4-1.3-5-3.6z';

function kit(pos) {
  return svg('svg', { class: ['kit', pos === 'GK' && 'gk'], viewBox: '0 0 32 32', 'aria-hidden': 'true' }, svg('path', { d: SHIRT }));
}

function playerChip(id, p, { captain, vice, chip, showXp, onPlayer, isNew, benchNo }) {
  const pos = posName(p?.pos);
  const xp = xpOf(p);
  const st = statusInfo(p?.status, p?.chance ?? p?.chance_pct);
  const badge = id === captain ? (String(chip).toLowerCase() === 'tc' ? '3×' : 'C') : id === vice ? 'V' : null;
  const name = p?.name ?? `#${id}`;
  const parts = [name, p?.club, pos, id === captain ? 'captain' : id === vice ? 'vice-captain' : null,
    showXp && xp != null ? `${fmt.pts(xp)} xP` : null, st.tone !== 'ok' ? st.label : null].filter(Boolean);
  const inner = [
    h('span.pl-kit', null, kit(pos),
      badge ? h('span.pl-badge', { class: badge === 'V' ? 'vice' : 'cap', 'aria-hidden': 'true' }, badge) : null,
      st.tone !== 'ok' ? h('span.sdot', { class: st.tone, 'aria-hidden': 'true', title: p?.news ? `${st.label}: ${p.news}` : st.label }) : null,
      benchNo != null ? h('span.pl-order', { 'aria-hidden': 'true' }, benchNo) : null),
    h('span.pl-name', null, name),
    h('span.pl-meta', null, p?.club ?? '', showXp ? h('b.num', null, xp == null ? DASH : fmt.pts(xp)) : null),
  ];
  const attrs = { class: ['pl', isNew && 'is-new'], title: parts.join(' · '), 'aria-label': parts.join(', '), dataset: { id } };
  return onPlayer
    ? h('button', { ...attrs, type: 'button', onClick: (e) => onPlayer(id, p, e) }, inner)
    : h('div', attrs, inner);
}

/**
 * pitch({xi, bench, captain, vice, players, chip, showXp, onPlayer(id, player, ev), title, newIds})
 * players: {id: {name, club, pos (1-4|'GK'..), xp|pred, price, status, chance, news}}.
 * xi rows are grouped by position in the given order; bench keeps its order (numbered).
 */
export function pitch({ xi = [], bench = [], captain, vice, players = {}, chip, showXp = true, onPlayer, title, newIds = [] } = {}) {
  const P = (id) => players[id] ?? players[String(id)];
  const fresh = new Set((newIds || []).map(Number));
  const opts = (id, extra) => ({ captain: Number(captain), vice: Number(vice), chip, showXp, onPlayer, isNew: fresh.has(Number(id)), ...extra });
  const rows = { GK: [], DEF: [], MID: [], FWD: [], other: [] };
  for (const id of xi) rows[posName(P(id)?.pos) || 'other'].push(id);
  const chipLabel = chipName(chip);
  const field = h('div.pitch', { role: 'group', 'aria-label': 'Starting eleven' },
    h('div.pitch-lines', { 'aria-hidden': 'true' }, h('i.pl-box'), h('i.pl-six'), h('i.pl-arc'), h('i.pl-half'), h('i.pl-centre')),
    title || chipLabel ? h('div.pitch-top', null,
      title ? h('span.pitch-title', null, title) : h('span'),
      chipLabel ? h('span.chip-badge', { class: String(chip).toLowerCase() }, chipLabel) : null) : null,
    Object.entries(rows).filter(([, ids]) => ids.length).map(([pos, ids]) =>
      h('div.pitch-row', { dataset: { pos } }, ids.map((id) => playerChip(Number(id), P(id), opts(id))))));
  const benchEl = bench?.length
    ? h('div.bench', { class: { boosted: String(chip).toLowerCase() === 'bb' }, role: 'group', 'aria-label': 'Bench, in order' },
      h('span.bench-label', null, 'Bench'),
      h('div.bench-row', null, bench.map((id, i) => playerChip(Number(id), P(id), opts(id, { benchNo: i + 1 })))))
    : null;
  const nm = (id) => (id == null ? DASH : P(id)?.name ?? `#${id}`);
  const caption = captain != null || bench?.length
    ? h('p.pitch-caption', null, `Captain: ${nm(captain)} · Vice: ${nm(vice)}${bench?.length ? ' · Bench in order shown' : ''}`)
    : null;
  return h('div.pitch-wrap', null, field, benchEl, caption);
}

function xferSide(kind, p) {
  if (!p) return h('div.xfer-side', { class: kind }, h('span.xfer-tag', null, kind === 'out' ? 'Out' : 'In'), h('span.muted', null, DASH));
  const pos = posName(p.pos);
  const xp = xpOf(p);
  return h('div.xfer-side', { class: kind },
    h('span.xfer-tag', null, kind === 'out' ? 'Out' : 'In'),
    h('span.xfer-name', null, p.name ?? `#${p.id}`),
    h('span.xfer-meta', null, [p.club, pos, fin(p.price) ? fmt.money(p.price) : null].filter(Boolean).join(' · ')),
    xp != null ? h('span.xfer-xp.num', null, `${fmt.pts(xp)} xP`) : null);
}

/**
 * transferCard({out, in, gain, cost, note}) — out/in: {name, club, pos, price, xp|pred}.
 * gain → "+1.3 xPts"; cost: number → "costs £9.6m", string shown as is (e.g. "−4 hit").
 */
export function transferCard({ out, in: inn, gain, cost, note } = {}) {
  const foot = [
    fin(gain) ? h('span.xfer-gain.num', { class: toNum(gain) >= 0 ? 'gain' : 'loss' }, `${fmt.signed(gain)} xPts`) : null,
    cost != null && cost !== '' ? h('span.xfer-cost', null, fin(cost) ? `costs ${fmt.money(cost)}` : cost) : null,
    note ? h('span.xfer-note', null, note) : null,
  ].filter(Boolean);
  return h('div.xfer', null,
    h('div.xfer-pair', null, xferSide('out', out), h('span.xfer-arrow', null, icon('arrow', { size: 18 })), xferSide('in', inn)),
    foot.length ? h('div.xfer-foot', null, foot) : null);
}

// ---------------------------------------------------------------- combobox & player picker

// Accent-insensitive: NFD strips combining marks; FOLD covers letters NFD keeps whole (ø, ß, ł…).
const FOLD = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[øæœßłđðþı]/g, (c) => FOLD[c]);

/** Internal type-ahead: items (array or Promise), rank(item, q) → number|null (lower = better). */
function combo({ items = [], rank, renderItem, onPick, placeholder = 'Search…', label, limit = 12, openOnFocus = false }) {
  const listId = uid('lb');
  const input = h('input.input', {
    type: 'search', role: 'combobox', placeholder, autocomplete: 'off', spellcheck: 'false',
    'aria-expanded': 'false', 'aria-autocomplete': 'list', 'aria-controls': listId, 'aria-label': label || placeholder,
  });
  const list = h('ul.combo-list', { id: listId, role: 'listbox', hidden: true });
  const el = h('div.combo', null, input, list);
  let all = [], shown = [], active = -1, exclude = new Set();
  const setItems = (arr) => { all = arr || []; if (document.activeElement === input) render(); };
  if (Array.isArray(items)) all = items;
  else Promise.resolve(items).then((v) => setItems(v || [])).catch(() => {});
  function render() {
    const q = norm(input.value.trim());
    if (!q && !openOnFocus) return close();
    shown = all.map((it, i) => ({ it, i, r: rank(it, q) })).filter((x) => x.r != null && !exclude.has(x.it.id ?? x.it))
      .sort((a, b) => a.r - b.r || a.i - b.i).slice(0, limit).map((x) => x.it);
    active = shown.length ? 0 : -1;
    list.replaceChildren(...(shown.length
      ? shown.map((it, i) => h('li.combo-opt', {
        role: 'option', id: `${listId}-${i}`, 'aria-selected': String(i === active),
        onPointerdown: (e) => { e.preventDefault(); pick(i); },
      }, renderItem(it)))
      : [h('li.combo-none', null, all.length ? 'No matches' : 'Loading…')]));
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    paint();
  }
  function paint() {
    [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', active >= 0 ? `${listId}-${active}` : '');
    list.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }
  function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
  function pick(i) {
    const it = shown[i];
    if (!it) return;
    input.value = '';
    close();
    onPick(it);
  }
  input.addEventListener('input', render);
  input.addEventListener('focus', () => { if (openOnFocus || input.value) render(); });
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.hidden) return render();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % Math.max(1, shown.length);
      paint();
    } else if (e.key === 'Enter') {
      if (!list.hidden && active >= 0) { e.preventDefault(); pick(active); }
    } else if (e.key === 'Escape') close();
  });
  return { el, input, setItems, setExclude: (ids) => { exclude = new Set(ids); }, getItems: () => all };
}

function playerRank(p, q) {
  const n = norm(p.name);
  if (n.startsWith(q) || String(p.id) === q) return 0;
  if (n.split(/[\s.'-]+/).some((w) => w.startsWith(q))) return 1;
  if (norm(p.club) === q || norm(posName(p.pos)) === q) return 2;
  return n.includes(q) ? 3 : null;
}
const playerOption = (p) => [
  h('span.opt-main', null, p.name),
  h('span.opt-sub', null, [p.club, posName(p.pos), fin(p.price) ? fmt.money(p.price) : null].filter(Boolean).join(' · ')),
];

/**
 * playerPicker({players, multiple, onPick, selected:[ids], exclude:[ids], placeholder, label})
 * players: [{id, name, club, pos, price}] or a Promise of it.
 * single → onPick(player) and the box clears; multiple → removable chips, onPick(selectedPlayers[]).
 * Returned element: .setPlayers(list), .setSelected(ids), .getSelected() → ids, .focus().
 */
export function playerPicker({ players = [], multiple = false, onPick, selected = [], exclude = [], placeholder = 'Search players…', label, limit = 12 } = {}) {
  let sel = (selected || []).map(Number);
  const chips = h('div.chips');
  const byId = () => new Map(c.getItems().map((p) => [Number(p.id), p]));
  const c = combo({
    items: players, rank: playerRank, renderItem: playerOption, placeholder, label, limit,
    onPick: (p) => {
      if (!multiple) return onPick?.(p);
      if (!sel.includes(Number(p.id))) sel.push(Number(p.id));
      sync();
      onPick?.(sel.map((id) => byId().get(id)).filter(Boolean));
    },
  });
  function sync() {
    c.setExclude([...exclude.map(Number), ...(multiple ? sel : [])]);
    if (!multiple) return;
    const m = byId();
    chips.replaceChildren(...sel.map((id) => h('span.chip', null, m.get(id)?.name ?? `#${id}`,
      h('button.chip-x', {
        type: 'button', 'aria-label': `Remove ${m.get(id)?.name ?? id}`,
        onClick: () => { sel = sel.filter((x) => x !== id); sync(); onPick?.(sel.map((x) => byId().get(x)).filter(Boolean)); },
      }, icon('close', { size: 12 })))));
  }
  const el = h('div.picker', null, c.el, multiple ? chips : null);
  Promise.resolve(players).then(() => sync()).catch(() => {});
  el.setPlayers = (list) => { c.setItems(list); sync(); };
  el.setSelected = (ids) => { sel = (ids || []).map(Number); sync(); };
  el.getSelected = () => sel.slice();
  el.focus = () => c.input.focus();
  sync();
  return el;
}

// ---------------------------------------------------------------- flags

export const blankish = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
/** A flag value as text: lists joined by `sep`, blank as "not set". */
export const showValue = (v, sep = ',') => (blankish(v) ? 'not set' : Array.isArray(v) ? v.join(sep) : String(v));
/** "2024: 18,23 · 2025: 4,32" for a flag whose default depends on the season, else null. */
export const seasonDefaults = (f, sep) => (f.default_by_season
  ? Object.entries(f.default_by_season).map(([s, v]) => `${s}: ${showValue(v, sep)}`).join(' · ') : null);
function canon(v) {
  if (blankish(v)) return null;
  if (Array.isArray(v)) return v.map(String).join(',');
  return fin(v) ? String(toNum(v)) : String(v);
}

/** True when `value` means "leave the solver default" for this flag. */
export function isDefaultValue(flag, value) {
  if (value === undefined) return true;
  if (flag.kind === 'bool' || flag.widget === 'toggle') return Boolean(value) === Boolean(flag.default);
  return canon(value) === canon(flag.default);
}

/** snake_case key → "Snake case key". */
export const humanise = (key) => key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
// /api/flags sets every flag's label and widget (api/flags.py _static_catalogue).
export const flagLabel = (f) => f.label;

/** Flags in their catalogue groups ([{...group, fs}]), then an "Other settings" group for any left over. */
export function groupFlags(flags, groups) {
  const byDest = new Map(flags.map((f) => [f.dest, f]));
  const grouped = new Set();
  const gs = (groups || []).map((g) => {
    const fs = (g.flags || []).map((d) => byDest.get(d)).filter(Boolean);
    fs.forEach((f) => grouped.add(f.dest));
    return { ...g, fs };
  });
  const rest = flags.filter((f) => !grouped.has(f.dest));
  if (rest.length) gs.push({ key: '_other', title: 'Other settings', blurb: '', fs: rest });
  return gs;
}

/** What a settings search matches: label, help, flag, dest, aliases and the special-values note. */
export const flagHaystack = (f) => norm([f.label, f.help, f.flag, f.dest, ...(f.aliases || []), f.sentinel_note].filter(Boolean).join(' '));

// Solver units the number boxes show in a friendlier one, by the flag's unit (api/flags.py DOCS). Only the
// widget converts: values, presets, scenario overrides and the argv all stay in the solver's unit.
const UNIT_VIEWS = { 'tenths of £m': { unit: '£m', scale: 10, dp: 1, min: 0, text: (m) => fmt.money(m) } };  // money is never negative
/**
 * How flag f's number box shows its value, when that differs from the solver's unit: {unit, step, dp,
 * show(solverValue) → box text, text(solverValue) → "£100.0m", solver(boxNumber) → solverValue}; null for
 * every other flag.
 */
export function unitView(f) {
  const u = UNIT_VIEWS[f?.unit];
  return u ? {
    ...u, step: 10 ** -u.dp,
    show: (v) => (toNum(v) / u.scale).toFixed(u.dp),
    text: (v) => u.text(toNum(v) / u.scale),
    solver: (n) => Number((n * u.scale).toFixed(6)),  // 0.7 * 10 = 7.000000000000001
  } : null;
}

/** A "?" button with a tooltip bubble (hover, focus or click; Escape closes); `label` is its accessible name. */
export function infoTip(label, ...body) {
  const id = uid('tip');
  const bubble = h('div.tip-body', { id, role: 'tooltip' }, ...body);
  const btn = h('button.tip-btn', { type: 'button', 'aria-label': label, 'aria-describedby': id }, '?');
  const wrap = h('span.tip', null, btn, bubble);
  // Keep the bubble inside the viewport (no horizontal page scroll on phones).
  const place = () => {
    const room = innerWidth - 8 - btn.getBoundingClientRect().left;
    bubble.style.left = `${Math.min(-8, room - Math.min(340, innerWidth - 24))}px`;  // 340 = CSS max-width
  };
  wrap.addEventListener('pointerenter', place);
  wrap.addEventListener('focusin', place);
  btn.addEventListener('click', () => { wrap.classList.toggle('open'); place(); });
  btn.addEventListener('blur', () => wrap.classList.remove('open'));
  btn.addEventListener('keydown', (e) => { if (e.key === 'Escape') wrap.classList.remove('open'); });
  return wrap;
}

function helpTip(f) {
  const uv = unitView(f);
  const def = f.kind === 'bool' ? (f.default ? 'on' : 'off') : blankish(f.default) ? showValue(f.default)
    : uv ? uv.text(f.default) : `${showValue(f.default)}${f.unit ? ` ${f.unit}` : ''}`;
  const bySeason = seasonDefaults(f);
  // the box's unit against the flag's: 1.5 → --cash=15 (the default, when there is one, as the example)
  const eg = uv && (fin(f.default) ? toNum(f.default) : uv.solver(1.5));
  return infoTip(`About ${flagLabel(f)}`,
    h('code.tip-flag', null, f.flag || `--${f.dest.replace(/_/g, '-')}`),
    f.help ? h('p', null, f.help) : null,
    f.sentinel_note ? h('p.muted', null, f.sentinel_note) : null,
    uv ? h('p.muted', null, `Enter ${uv.unit} here; the command gets ${f.unit} (${uv.show(eg)} → ${f.flag}=${eg}).`) : null,
    h('p.muted', null, f.inverted
      ? `Default: on · passing ${f.flag} turns it off`
      : `Default: ${def}${f.aliases?.length ? ` · also ${f.aliases.join(', ')}` : ''}`),
    bySeason ? h('p.muted', null, `Season defaults: ${bySeason}`) : null);
}

let defaultPlayersP = null;
const lazyPlayers = () => (defaultPlayersP ||= api.getPlayers().then((d) => d?.players || []).catch((e) => { defaultPlayersP = null; throw e; }));

/** Comma-joined token list editor (players / pools): chips + a combobox + raw-text escape hatch. */
function tokenWidget({ id, value, emit, combo: comboOpts, describe, placeholder }) {
  let tokens = String(value ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  const chips = h('div.chips');
  const raw = h('input.input.mono', { type: 'text', hidden: true, placeholder, spellcheck: 'false', 'aria-label': 'Raw value' });
  const cb = combo({
    ...comboOpts,
    onPick: (it) => {
      const t = comboOpts.token(it);
      if (!tokens.includes(t)) tokens.push(t);
      commit();
    },
  });
  cb.input.id = id;
  const toggle = h('button.btn.sm.ghost', { type: 'button', title: 'Edit the raw comma-separated value' }, 'Edit as text');
  toggle.addEventListener('click', () => {
    const toRaw = raw.hidden;
    raw.hidden = !toRaw;
    cb.el.hidden = toRaw;
    chips.hidden = toRaw;
    toggle.textContent = toRaw ? 'Done' : 'Edit as text';
    if (toRaw) { raw.value = tokens.join(','); raw.focus(); } else sync(raw.value, true);
  });
  raw.addEventListener('change', () => sync(raw.value, true));
  function paint() {
    chips.replaceChildren(...tokens.map((t, i) => h('span.chip', { title: t }, describe(t),
      h('button.chip-x', { type: 'button', 'aria-label': `Remove ${t}`, onClick: () => { tokens.splice(i, 1); commit(); } }, icon('close', { size: 12 })))));
  }
  function commit() { paint(); emit(tokens.length ? tokens.join(',') : undefined); }
  function sync(v, fire) {
    tokens = String(v ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    paint();
    if (fire) emit(tokens.length ? tokens.join(',') : undefined);
  }
  paint();
  return { el: h('div.token-widget', null, chips, h('div.row.tight', null, cb.el, toggle), raw), sync: (v) => sync(v, false), refresh: paint, cb };
}

/**
 * flagControl(flag, value, onChange(value, flag), {players, meta}) → one setting row.
 * Values by widget: toggle → bool; number → number; text/select/pool/players → string; rounds → int[];
 * season → int. onChange(undefined) means "back to default" (drop the key). Inverted (store_false)
 * flags are shown by effect: checked = the dest's value, which defaults to true.
 * Returned element: .setValue(v) re-syncs the widget without firing onChange.
 */
export function flagControl(flag, value, onChange, opts = {}) {
  const f = flag;
  const id = uid(`f-${f.dest}`);
  const kind = f.widget;
  let cur = value;
  const wrap = h('div.flag', { class: `w-${kind}`, dataset: { dest: f.dest } });
  const dot = h('span.flag-dot', { title: 'Changed from default', 'aria-hidden': 'true' });
  const reset = h('button.icon-btn.flag-reset', {
    type: 'button', title: 'Reset to default', 'aria-label': `Reset ${flagLabel(f)} to default`,
    onClick: () => { set(undefined); w.sync(undefined); },
  }, icon('reset', { size: 14 }));
  const err = h('span.flag-err', { role: 'alert' });
  function refresh() {
    const changed = !isDefaultValue(f, cur);
    wrap.classList.toggle('changed', changed);
    reset.hidden = !changed;
  }
  function set(v) { cur = v; err.textContent = ''; refresh(); onChange?.(v, f); }
  const fail = (msg) => { err.textContent = msg; };
  const w = buildWidget(f, kind, id, () => cur, set, fail, opts);
  w.sync(cur);
  const label = h('label.flag-label', { htmlFor: id }, flagLabel(f));
  wrap.append(
    h('div.flag-head', null, label, helpTip(f), dot, f.advanced ? h('span.flag-adv', { title: 'Advanced setting' }, 'adv') : null, h('span.spacer'), reset),
    w.el, err);
  refresh();
  wrap.setValue = (v) => { cur = v; w.sync(v); err.textContent = ''; refresh(); };
  return wrap;
}

const isToken = (v) => typeof v === 'string' && v.startsWith('@');  // e.g. "@next_gw", resolved server-side
const hint = (f, fallback) => f.placeholder || fallback;

function buildWidget(f, kind, id, get, set, fail, opts) {
  const dflt = f.default;
  const shown = (v) => (blankish(v) ? (blankish(dflt) ? '' : String(dflt)) : String(v));
  if (kind === 'toggle') {
    const box = h('input.switch', { type: 'checkbox', id, role: 'switch' });
    box.addEventListener('change', () => set(box.checked === Boolean(dflt) ? undefined : box.checked));
    return { el: box, sync: (v) => { box.checked = v === undefined ? Boolean(dflt) : Boolean(v); } };
  }
  if (kind === 'number') {
    const isInt = f.kind === 'int';
    const uv = unitView(f);  // e.g. --cash: the box takes £m, the value stays in tenths
    const view = (v) => (uv && fin(v) ? uv.show(v) : String(v));
    const empty = blankish(dflt) ? hint(f, f.sentinel_note ? 'auto' : 'not set') : `default ${view(dflt)}`;
    const input = h('input.input.num', {
      type: 'number', id, step: uv ? uv.step : isInt ? 1 : 'any', inputmode: isInt && !uv ? 'numeric' : 'decimal', placeholder: empty,
    });
    // The box shows the default as its value, so typing must replace it rather than append to it.
    // The click that focused the box would drop the selection on mouseup, so that one mouseup is cancelled.
    let focusing = false;
    input.addEventListener('focus', () => { input.select(); focusing = true; });
    input.addEventListener('mouseup', (e) => { if (focusing) e.preventDefault(); focusing = false; });
    input.addEventListener('keydown', () => { focusing = false; });
    input.addEventListener('change', () => {
      const { bad, n } = readNum(input);  // blank: n undefined = back to the default
      const v = uv && n !== undefined ? uv.solver(n) : n;
      if (bad || (v !== undefined && !(isInt ? Number.isInteger(v) : Number.isFinite(v)))) {
        return fail(uv && Number.isFinite(n) ? `Enter ${uv.unit} to ${plural(uv.dp, 'decimal place')}, e.g. ${(1.5).toFixed(uv.dp)}.`
          : isInt ? 'Enter a whole number.' : 'Enter a number.');
      }
      if (uv && v !== undefined && v < uv.min) return fail(`Enter at least ${uv.text(uv.min)}.`);
      set(v);
      if (uv && v !== undefined) input.value = view(v);  // "1.50" → "1.5": the box shows what was sent
    });
    const sync = (v) => {
      input.placeholder = isToken(v) ? v.slice(1).replace(/_/g, ' ') : empty;
      input.value = isToken(v) ? '' : blankish(v) ? (blankish(dflt) ? '' : view(dflt)) : view(v);
    };
    const unit = uv?.unit ?? f.unit;
    return { el: unit ? h('div.with-unit', null, input, h('span.unit', null, unit)) : input, sync };
  }
  if (kind === 'rounds') {
    // Chip rounds default per season (2026 has none), so a fixed example would mislead.
    const ph = f.default_by_season ? 'season default' : hint(f, blankish(dflt) ? 'none, e.g. 19' : String(dflt));
    const input = h('input.input.mono', { type: 'text', id, inputmode: 'numeric', spellcheck: 'false', placeholder: ph });
    input.addEventListener('change', () => {
      const parts = input.value.split(/[\s,]+/).filter(Boolean);
      if (!parts.length) return set(undefined);
      const nums = [...new Set(parts.map(Number))];
      if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 38)) return fail('Use gameweek numbers 1-38 separated by commas, or 0 for none.');
      // 0 = none: drops the season default (main.py skips rounds <= 0), so it only means something alone
      if (nums.includes(0) && nums.length > 1) return fail('0 means no rounds: enter it on its own.');
      set(nums.sort((a, b) => a - b));
    });
    return { el: input, sync: (v) => { input.value = Array.isArray(v) ? v.join(', ') : blankish(v) ? '' : String(v); } };
  }
  if ((kind === 'select' || kind === 'season') && f.kind === 'str' && f.placeholder) {
    // Suggested values, but any string is valid (e.g. bench weights "auto-raw" or "0.001,0.25,0.2,0.15").
    const dl = h('datalist', { id: `${id}-dl` }, (f.choices || []).map((c) => h('option', { value: String(c) })));
    const input = h('input.input.mono', { type: 'text', id, list: `${id}-dl`, spellcheck: 'false', placeholder: blankish(dflt) ? hint(f, 'not set') : String(dflt) });
    input.addEventListener('change', () => { const s = input.value.trim(); set(!s || s === String(dflt) ? undefined : s); });
    return { el: h('div', null, input, dl), sync: (v) => { input.value = blankish(v) ? '' : String(v); } };
  }
  if (kind === 'select' || kind === 'season') {
    const labels = f.choice_labels || {};
    const sel = h('select.select', { id });
    const fill = (choices) => {
      const list = choices.map(String);
      if (!blankish(dflt) && !list.includes(String(dflt))) list.unshift(String(dflt));
      sel.replaceChildren(
        blankish(dflt) ? h('option', { value: '' }, 'Default') : null,
        ...list.map((c) => h('option', { value: c }, (labels[c] ?? c) + (c === String(dflt) ? ' (default)' : ''))));
      sel.value = shown(get());
    };
    sel.addEventListener('change', () => {
      const v = sel.value;
      if (v === '' || v === String(dflt)) return set(undefined);
      set(kind === 'season' || f.kind === 'int' ? Number(v) : v);
    });
    if (f.choices?.length) fill(f.choices);
    else {
      fill([]);
      if (kind === 'season') Promise.resolve(opts.meta || api.getMeta()).then((m) => fill(m?.seasons || [])).catch(() => {});
    }
    return { el: sel, sync: (v) => { sel.value = shown(v); } };
  }
  if (kind === 'players') {
    const known = new Map();
    const describe = (t) => {
      const [who, win] = t.split('@');
      const name = known.get(who.trim())?.name ?? who;
      return win ? `${name} (GW${win.replace('-', '–')})` : name;
    };
    const tw = tokenWidget({
      id, value: get(), emit: set, describe, placeholder: hint(f, '123456@6-8,Salah'),
      combo: { items: [], rank: playerRank, renderItem: playerOption, placeholder: 'Add a player…', label: flagLabel(f), token: (p) => String(p.id) },
    });
    const load = (list) => {
      for (const p of list || []) known.set(String(p.id), p);
      tw.cb.setItems(list);
      tw.refresh();
    };
    if (opts.players) Promise.resolve(opts.players).then(load).catch(() => {});
    else if (!blankish(get())) lazyPlayers().then(load).catch(() => {});  // name the ids already set
    else tw.cb.input.addEventListener('focus', () => lazyPlayers().then(load).catch((e) => fail(e.message)), { once: true });
    return tw;
  }
  if (kind === 'pool') {
    const rank = (p, q) => (!q ? 0 : norm(p.name).startsWith(q) ? 1 : norm(p.name).includes(q) ? 2 : null);
    const tw = tokenWidget({
      id, value: get(), emit: set, describe: (t) => t, placeholder: 'dir1,dir2 or prod',
      combo: {
        items: (f.choices || []).map((name) => ({ name, sub: '' })), rank, openOnFocus: true, label: flagLabel(f),
        placeholder: blankish(dflt) ? 'Season default pool' : `default ${dflt}`,
        renderItem: (p) => [h('span.opt-main', null, p.name), h('span.opt-sub', null, p.sub)],
        token: (p) => p.name,
      },
    });
    // meta.pools (prod alias first) carries file counts and ages; f.choices is the bare name list.
    Promise.resolve(opts.meta || api.getMeta()).then((m) => {
      const aliasDirs = (m?.prod_alias?.dirs || []).join(', ');
      if (m?.pools?.length) tw.cb.setItems(m.pools.map((p) => ({
        name: p.name,
        sub: [p.alias && `= ${aliasDirs}`, p.is_default && 'season default', fin(p.n_files) && `${p.n_files} files`, p.archived && 'archived', p.mtime && fmt.ago(p.mtime)].filter(Boolean).join(' · '),
      })));
    }).catch(() => {});
    return tw;
  }
  // text
  const input = h('input.input', { type: 'text', id, spellcheck: 'false', placeholder: hint(f, blankish(dflt) ? 'not set' : String(dflt)) });
  input.addEventListener('change', () => { const s = input.value.trim(); set(!s || s === String(dflt) ? undefined : s); });
  return { el: input, sync: (v) => { input.value = blankish(v) ? '' : String(v); } };
}

/**
 * flagForm({flags, groups, values, onChange(values, dest, value), filter, players, meta, showAdvanced, open})
 * Grouped accordion of flagControls with search (label, help, flag, dest), "Show advanced" and
 * "Changed only" toggles and per-group changed counts. filter: fn(flag)→bool limits the flags, or a string
 * pre-fills the search. open: group keys expanded initially.
 * Returned element: .setValues(values) re-syncs all controls, .getValues().
 */
export function flagForm({ flags = [], groups = [], values = {}, onChange, filter, players, meta, showAdvanced = false, open = [] } = {}) {
  let vals = { ...values };
  const pool = typeof filter === 'function' ? flags.filter(filter) : flags;
  const gs = groupFlags(pool, groups);

  const opened = new Set(open);
  let query = typeof filter === 'string' ? filter : '';
  let adv = showAdvanced;
  let changedOnly = false;
  const controls = new Map();
  const search = h('input.input', { type: 'search', placeholder: `Search ${pool.length} settings`, value: query, 'aria-label': 'Search settings' });
  const advBox = h('input', { type: 'checkbox', checked: adv });
  const chgBox = h('input', { type: 'checkbox' });
  const total = h('span.muted.small');
  const resetAll = h('button.btn.sm.ghost', { type: 'button' }, icon('reset', { size: 14 }), 'Reset all');
  const list = h('div.acc-list');
  const el = h('div.flag-form', null,
    h('div.flag-tools', null,
      h('div.search-box', null, icon('search', { size: 16 }), search),
      h('label.check', null, advBox, 'Show advanced'),
      h('label.check', null, chgBox, 'Changed only'),
      h('span.spacer'), total, resetAll),
    list);

  const changed = (f) => !isDefaultValue(f, vals[f.dest]);
  const index = new Map(pool.map((f) => [f.dest, flagHaystack(f)]));

  function control(f) {
    if (!controls.has(f.dest)) {
      controls.set(f.dest, flagControl(f, vals[f.dest], (v) => {
        if (v === undefined) delete vals[f.dest]; else vals[f.dest] = v;
        counts();
        onChange?.({ ...vals }, f.dest, v);
      }, { players, meta }));
    }
    return controls.get(f.dest);
  }

  function counts() {
    for (const sec of list.children) {
      const g = gs.find((x) => x.key === sec.dataset.key);
      const c = g ? g.fs.filter(changed).length : 0;
      const b = sec.querySelector('.acc-changed');
      if (b) { b.textContent = c ? `${c} changed` : ''; b.hidden = !c; }
    }
    const n = pool.filter(changed).length;
    total.textContent = n ? `${n} changed from default` : 'All defaults';
    resetAll.disabled = !n;
  }

  function render() {
    const q = norm(query.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    list.replaceChildren();
    let shownAny = false;
    for (const g of gs) {
      const visible = g.fs.filter((f) => (!terms.length || terms.every((t) => index.get(f.dest).includes(t)))
        && (adv || !f.advanced || changed(f) || terms.length)
        && (!changedOnly || changed(f)));
      if (!visible.length) continue;
      shownAny = true;
      const isOpen = opened.has(g.key) || terms.length > 0 || changedOnly;
      const panelId = uid('acc');
      const headBtn = h('button.acc-head', {
        type: 'button', 'aria-expanded': String(isOpen), 'aria-controls': panelId,
        onClick: () => {
          opened.has(g.key) ? opened.delete(g.key) : opened.add(g.key);
          render();
          list.querySelector(`[data-key="${CSS.escape(g.key)}"] .acc-head`)?.focus();
        },
      }, icon('chevron', { size: 16 }),
      h('span.acc-title', null, g.title || humanise(g.key)),
      h('span.acc-count', null, visible.length === g.fs.length ? `${g.fs.length}` : `${visible.length}/${g.fs.length}`),
      h('span.acc-changed', { hidden: true }));
      const panel = h('div.acc-panel', { id: panelId, hidden: !isOpen },
        g.blurb ? h('p.acc-blurb', null, g.blurb) : null,
        h('div.flag-grid', null, isOpen ? visible.map(control) : null));
      list.append(h('section.acc', { dataset: { key: g.key }, class: { open: isOpen } }, h('h3.acc-h', null, headBtn), panel));
    }
    if (!shownAny) list.append(empty(query ? `No setting matches “${query}”.` : 'No settings to show.'));
    counts();
  }

  list.addEventListener('keydown', (e) => {
    if (!e.target.classList?.contains('acc-head')) return;
    const heads = [...list.querySelectorAll('.acc-head')];
    const i = heads.indexOf(e.target);
    const j = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: heads.length - 1 }[e.key];
    if (j == null) return;
    e.preventDefault();
    heads[(j + heads.length) % heads.length].focus();
  });
  let t = 0;
  search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { query = search.value; render(); }, 120); });
  advBox.addEventListener('change', () => { adv = advBox.checked; render(); });
  chgBox.addEventListener('change', () => { changedOnly = chgBox.checked; render(); });
  resetAll.addEventListener('click', () => {
    vals = {};
    for (const c of controls.values()) c.setValue(undefined);
    render();
    onChange?.({}, null, undefined);
  });

  render();
  el.setValues = (next) => {
    vals = { ...(next || {}) };
    for (const [dest, c] of controls) c.setValue(vals[dest]);
    render();
  };
  el.getValues = () => ({ ...vals });
  return el;
}

/**
 * "Extra flags" button with a count badge for a run form that shows a few flags itself: it opens every
 * other flag (not in `own`, not a run-mode switch: flag.branch) in a flagForm modal. Edits go straight
 * into `values` (the form's own object), then onChange() runs.
 */
export function extraFlagsButton({ flags = [], groups = [], meta, values, own, onChange }) {
  const extra = () => Object.keys(values).filter((k) => !own.has(k));
  const btn = h('button.btn.sm', { type: 'button', disabled: !flags.length });
  const paint = () => fill(btn, icon('menu', { size: 15 }), 'Extra flags', extra().length ? h('span.badge', null, extra().length) : null);
  btn.addEventListener('click', () => modal({
    title: 'Extra solver flags', wide: true,
    body: flagForm({
      flags, groups, meta, values: pick(values, extra()), filter: (f) => !own.has(f.dest) && !f.branch,
      onChange: (vals) => {
        for (const k of extra()) delete values[k];
        Object.assign(values, vals);
        paint();
        onChange?.();
      },
    }),
    actions: [{ label: 'Done', kind: 'primary' }],
  }));
  paint();
  return btn;
}

// ---------------------------------------------------------------- job runner

const STATUS_TONE = { queued: 'info', running: 'run', done: 'gain', error: 'loss', cancelled: 'warn' };
export const jobStatusPill = (status) => pill(status || 'unknown', STATUS_TONE[status] || '', { role: 'status' });

/**
 * jobRunner({job, onDone({job, result, log}), onUpdate(tick), title}) — job object or id.
 * Status pill, elapsed timer, copyable command, live log (auto-scrolls while you are at the bottom), Cancel.
 * Polling stops by itself once the element leaves the document (or is never attached); .stop() stops it explicitly.
 */
export function jobRunner({ job, onDone, onUpdate, title } = {}) {
  let j = typeof job === 'object' && job ? job : { id: job, status: 'queued' };
  const ctrl = new AbortController();
  let base = { elapsed: toNum(j.elapsed) || 0, at: Date.now() };
  const pillBox = h('span');
  const timer = h('span.job-time.num');
  const cancel = h('button.btn.sm.danger', {
    type: 'button',
    onClick: async () => {
      cancel.disabled = true;
      try { await api.cancelJob(j.id); toast('Cancel requested', 'info', { timeout: 2000 }); } catch (e) { toast(e.message, 'error'); cancel.disabled = false; }
    },
  }, icon('stop', { size: 14 }), 'Cancel');
  const logEl = h('pre.log', { role: 'log', 'aria-label': 'Job output', tabindex: 0 });
  const cmd = h('div.job-cmd');
  const el = h('div.job', { dataset: { jobId: j.id } },
    h('div.job-head', null, pillBox, h('span.job-label', null, title || j.label || j.kind || 'Job'), timer, h('span.spacer'),
      cancel, h('a.btn.sm.ghost', { href: `#/runs?job=${encodeURIComponent(j.id)}` }, 'Open in Runs')),
    cmd, logEl);

  function paint() {
    pillBox.replaceChildren(jobStatusPill(j.status));
    const active = api.isActive(j);
    cancel.hidden = !active;
    const secs = active && j.status === 'running' ? base.elapsed + (Date.now() - base.at) / 1000 : base.elapsed;
    timer.textContent = j.status === 'queued' ? 'waiting for a free slot' : fmt.dur(secs);
    if (j.cmd && !cmd.childElementCount) cmd.append(h('code.mono', null, j.cmd), h('button.icon-btn', { type: 'button', 'aria-label': 'Copy command', title: 'Copy command', onClick: () => copyText(j.cmd) }, icon('copy', { size: 14 })));
    el.dataset.status = j.status;
  }
  paint();
  // A runner removed from the page, or built after its view went away and never shown, stops polling.
  const stopTimer = whileConnected(el, paint, 1000, () => ctrl.abort());
  api.pollJob(j.id, (tick) => {
    j = tick.job || j;
    base = { elapsed: toNum(j.elapsed) || base.elapsed, at: Date.now() };
    if (tick.text) {
      const atBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 24;
      logEl.append(tick.text);
      if (atBottom) logEl.scrollTop = logEl.scrollHeight;
    }
    paint();
    onUpdate?.(tick);
  }, { signal: ctrl.signal }).then((res) => {
    stopTimer();
    if (!res) return;
    j = res.job || j;
    paint();
    onDone?.(res);
  }).catch((e) => {
    stopTimer();
    pillBox.replaceChildren(pill('lost', 'loss'));
    logEl.append(`\n[Studio] stopped following this job: ${e.message}\n`);
  });
  el.stop = () => { ctrl.abort(); stopTimer(); };
  return el;
}
