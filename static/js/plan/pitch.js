// The planner's pitch: kit shirts in formation rows, a bench strip, per-player xPts and opponent chips.
//   renderPitch({...}) → <div class="pp">
//   mountPitch(host, {...}) → host      Forkcast's phone pitch (static/m/)
// Player rows are /api/players rows ({name, club, pos, xp[], fixtures[][], status, chance, news}); xp[i] / fixtures[i]
// are for GW horizon[0] + i.

import { h, svg, fin, fmt, icon, posName, posCode, statusDot, statusInfo, chipName, uid, reduceMotion, xpNum } from '../ui.js';
import { shirt } from './kits.js';

const ROWS = ['GK', 'DEF', 'MID', 'FWD'];
const DASH = fmt.dash;

/** Index of `gw` in a horizon (array of GWs or its first GW); 0 when either is missing. */
export function gwIndex(gw, horizon) {
  const h0 = Array.isArray(horizon) ? horizon[0] : horizon;
  return fin(gw) && fin(h0) ? Number(gw) - Number(h0) : 0;
}

/** A player's xPts for `gw` (null when unknown). */
export function xpAt(p, gw, horizon) {
  const v = p?.xp?.[gwIndex(gw, horizon)];
  return fin(v) ? Number(v) : null;
}

/**
 * One fixture as {opp: 'SUN', home, fdr}: from /api/players or the phone bundle's cased code ("LEE" at home, "sun"
 * away) with its FDR from the row's parallel `fdr` list (1 easy .. 5 hard, null when unknown).
 */
const fixtureOf = (f, fdr) => {
  const d = typeof f === 'string' ? fdr : f?.fdr;
  return {
    ...(typeof f === 'string' ? { opp: f.toUpperCase(), home: f === f.toUpperCase() } : { opp: String(f?.opp ?? '').toUpperCase(), home: !!f?.home }),
    fdr: fin(d) && d >= 1 && d <= 5 ? Math.round(Number(d)) : null,
  };
};

/** A player's fixtures in `gw` as [{opp, home, fdr}] ([] = blank, two = a double), null when unknown. */
export function fixturesAt(p, gw, horizon) {
  const i = gwIndex(gw, horizon);
  const day = p?.fixtures?.[i];
  return Array.isArray(day) ? day.map((f, j) => fixtureOf(f, p?.fdr?.[i]?.[j])) : null;
}

/** One opponent, the app's one fixture format: its code in its venue's case, "LEE" at home, "sun" away (owner,
 *  2026-10-16). {opp, home} → text */
export const oppText = (f) => (f.home === false ? String(f.opp).toLowerCase() : String(f.opp).toUpperCase());

/** Opponents: "sun", "LEE", a DGW both ("LEE, sun"), a blank "—"; '' when unknown. */
export function oppLabel(fixtures) {
  if (!Array.isArray(fixtures)) return '';
  if (!fixtures.length) return DASH;
  return fixtures.map((f) => oppText(fixtureOf(f))).join(', ');
}
const oppSpoken = (fx) => (!Array.isArray(fx) ? null : !fx.length ? 'no fixture'
  : `vs ${fx.map((f) => fixtureOf(f)).map((f) => `${f.opp} (${f.home ? 'home' : 'away'}${f.fdr ? `, difficulty ${f.fdr}` : ''})`).join(' and ')}`);

const lookup = (players) => (id) => (players instanceof Map ? players.get(Number(id)) ?? players.get(String(id)) : players?.[id]);
const asSet = (s) => (s == null ? null : new Set([...s].map(Number)));

// ---------------------------------------------------------------- one player

function node(id, p, o) {
  const pos = posName(p?.pos);
  const name = p?.name ?? `#${id}`;
  const xp = xpAt(p, o.gw, o.horizon);
  const fx = fixturesAt(p, o.gw, o.horizon);
  const st = statusInfo(p?.status, p?.chance);
  const isCap = id === o.captain, isVice = id === o.vice;
  const badge = isCap ? (o.tc ? '3×' : 'C') : isVice ? 'V' : null;
  const isIn = o.incoming?.has(id);
  const target = o.selectable?.has(id);
  const hl = o.highlight?.has(id);
  const dim = o.selectable && !target && !hl;
  const spoken = [name, [p?.club, pos].filter(Boolean).join(' '),
    isCap ? (o.tc ? 'triple captain' : 'captain') : isVice ? 'vice-captain' : null,
    xp != null ? `${fmt.pts(xp)} expected points` : null, oppSpoken(fx),
    st.tone !== 'ok' ? (p?.news ? `${st.label}: ${p.news}` : st.label) : null,
    isIn ? 'transferred in' : null].filter(Boolean).join(', ');
  const kids = [
    h('span.pp-kit', null,
      shirt({ club: p?.club, gk: pos === 'GK', size: 64 }),
      badge ? h('span.pp-badge', { class: isCap ? 'cap' : 'vice', 'aria-hidden': 'true' }, badge) : null,
      statusDot(p?.status, { chance: p?.chance, news: p?.news }),
      isIn ? h('span.pp-in', { 'aria-hidden': 'true' }, 'IN') : null),
    h('span.pp-name', null, name),
    h('span.pp-info', { class: { dgw: fx?.length > 1, blank: fx?.length === 0 } },
      h('b.pp-xp', null, xp == null ? DASH : fmt.pts(xp)),
      h('span.pp-opp', null, oppLabel(fx) || DASH)),
  ];
  const attrs = {
    class: ['pp-player', isCap && 'is-cap', isIn && 'is-in', target && 'is-target', hl && 'is-hl', dim && 'is-dim',
      o.animate?.has(id) && 'is-new'],
    dataset: { id, pos: pos || '' }, title: spoken, 'aria-label': spoken,
  };
  if (!o.onPlayer) return h('div', { ...attrs, role: 'group' }, kids);
  return h('button', {
    ...attrs, type: 'button', disabled: dim, 'aria-pressed': hl ? 'true' : null,
    onClick: (e) => o.onPlayer(id, e),
  }, kids);
}

// ---------------------------------------------------------------- pitch

function markings() {
  const id = uid('pp');
  const chalk = { class: 'pp-chalk' };
  return svg('svg', { class: 'pp-lines', 'aria-hidden': 'true', width: '100%', height: '100%' },
    svg('defs', null, svg('clipPath', { id: `${id}-d` }, svg('rect', { x: 0, y: '17%', width: '100%', height: '100%' }))),
    svg('rect', { ...chalk, x: '21%', y: -2, width: '58%', height: '17%' }),
    svg('rect', { ...chalk, x: '37.5%', y: -2, width: '25%', height: '6.5%' }),
    svg('circle', { class: 'pp-spot', cx: '50%', cy: '11.5%', r: 2 }),
    svg('circle', { ...chalk, cx: '50%', cy: '11.5%', r: '8.5%', 'clip-path': `url(#${id}-d)` }),
    svg('circle', { ...chalk, cx: '50%', cy: '100%', r: '12%' }),
    svg('circle', { class: 'pp-spot', cx: '50%', cy: '100%', r: 2.5 }));
}

/**
 * renderPitch({xi, bench, captain, vice, players, gw, horizon, chip, incoming, onPlayer(id, evt), selectable,
 * highlight, animate, caption}) → <div class="pp">: players {id: row} | Map from /api/players; gw the GW shown,
 * horizon = [first GW, …] that row.xp / row.fixtures start at; chip 'wc'|'fh'|'bb'|'tc'|null (TC shows the captain as
 * 3×, BB marks the bench as counting); incoming: ids bought this GW (green ring + "IN"); animate: ids to pop in;
 * selectable: Set|null, only these (and highlighted) are clickable, the rest dim; highlight: ids drawn selected;
 * caption: adds "Captain: X · Vice: Y · Bench in order shown". Players without onPlayer render as plain nodes. Ids
 * compare as numbers.
 */
export function renderPitch({
  xi = [], bench = [], captain, vice, players = {}, gw, horizon, chip, incoming, onPlayer,
  selectable = null, highlight = null, animate = null, caption = false,
} = {}) {
  const P = lookup(players);
  const chipKey = chip ? String(chip).toLowerCase() : null;
  const o = {
    gw, horizon: horizon ?? gw, captain: fin(captain) ? Number(captain) : null, vice: fin(vice) ? Number(vice) : null,
    tc: chipKey === 'tc', incoming: asSet(incoming), selectable: asSet(selectable), highlight: asSet(highlight),
    animate: asSet(animate), onPlayer,
  };
  const rows = Object.fromEntries([...ROWS, 'other'].map((r) => [r, []]));
  for (const id of xi) rows[posName(P(id)?.pos) || 'other'].push(Number(id));
  const chipLabel = chipName(chipKey);
  const field = h('div.pp-field', { role: 'group', 'aria-label': `Starting eleven${fin(gw) ? `, GW${gw}` : ''}` },
    markings(),
    chipLabel ? h('span.pp-chip', { class: chipKey, title: chipLabel },
      h('span.pp-chip-long', null, chipLabel), h('span.pp-chip-short', null, chipKey.toUpperCase())) : null,
    Object.entries(rows).filter(([, ids]) => ids.length).map(([pos, ids]) =>
      h('div.pp-row', { dataset: { pos } }, ids.map((id) => node(id, P(id), o)))));
  let outfield = 0;
  const benchEl = bench?.length ? h('div.pp-bench', { class: { boosted: chipKey === 'bb' }, role: 'group', 'aria-label': 'Bench, in order' },
    h('span.pp-bench-label', null, chipKey === 'bb' ? 'Bench Boost' : 'Bench'),
    h('div.pp-bench-row', null, bench.map((raw) => {
      const id = Number(raw);
      const gk = posName(P(id)?.pos) === 'GK';
      return h('div.pp-slot', null, h('span.pp-order', { 'aria-hidden': 'true' }, gk ? 'GK' : ++outfield), node(id, P(id), o));
    }))) : null;
  const nm = (id) => (id == null ? DASH : P(id)?.name ?? `#${id}`);
  const cap = caption && (o.captain != null || bench?.length)
    ? h('p.pp-caption', null, `${o.tc ? 'Triple captain' : 'Captain'}: ${nm(o.captain)} · Vice: ${nm(o.vice)}${bench?.length ? ' · Bench in order shown' : ''}`)
    : null;
  return h('div.pp', { dataset: { chip: chipKey || '' } }, field, benchEl, cap);
}

// ---------------------------------------------------------------- list row


// ---------------------------------------------------------------- phone pitch (Forkcast, static/m/)
// Classes pm-*, styled by css/views/plan-pitch.css: FPL's pick-team look. Stable slots keep a changed player in his
// slot, where his shirt fades in (css/m.css: no flip; owner, 2026-10-10), and the armband hops (IPHONE_DESIGN §5.2,
// §6).

const PM_ROWS = [...ROWS, 'other'];
const POS_WORD = { GK: 'goalkeeper', DEF: 'defender', MID: 'midfielder', FWD: 'forward' };
const PREVIEW_WORD = { O: 'predicted out', D: 'doubtful', DS: 'doubtful', B: 'predicted on the bench' };
const asSetOrNull = (s) => (s ? asSet(s) : null);

/** The pitch box and its rows: row tops in px of the 446 px box; unknown positions share FWD's. */
const PW = 390, PH = 446;
const ROW_TOP = { GK: 13, DEF: 120, MID: 226, FWD: 332, other: 332 };

/**
 * The flag: FPL's availability only (status and chance, statusInfo): 'red' when out or 25% or less, 'amber' for any
 * other doubt, else null. WhoScored's lineup is never a flag.
 */
export function availabilityTone(p) {
  if (!p) return null;
  const st = statusInfo(p.status, p.chance);
  if (st.tone === 'bad' || (st.chance != null && st.chance <= 25)) return 'red';
  if (st.tone === 'warn') return 'amber';
  return null;
}
/** The flag's words on the card: FPL's chance ("75%"; "0%" for one out with no chance given), '' when unknown. */
const chanceText = (p) => {
  const st = statusInfo(p?.status, p?.chance);
  const c = st.chance ?? (st.tone === 'bad' ? 0 : null);
  return c == null ? '' : `${c}%`;
};
// WhoScored's preview of the next deadline's GW (ws_preview: O out, D / DS doubtful, B bench) is spoken on the card
// (availabilityWords) and written on the player sheet, with no tag (owner, 2026-10-09).

function availabilityWords(p, first) {
  const st = statusInfo(p?.status, p?.chance);
  if (st.tone !== 'ok' || st.chance === 0) return p?.news ? `${st.label}: ${p.news}` : st.label;
  return first ? PREVIEW_WORD[p?.ws_preview] ?? null : null;
}

/**
 * Stable slots: each position row keeps the last mount's order, and a player who replaces one in a row of the same
 * size takes his slot (flips: new id → old id), so a transfer morphs in place. This browser keeps the last order
 * across page loads (ORDER_KEY).
 */
const ORDER_KEY = 'fc:pitch:order';
function storedOrder() {
  try { const v = JSON.parse(globalThis.localStorage?.getItem(ORDER_KEY) ?? 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
function storeOrder(rows) {
  try { globalThis.localStorage?.setItem(ORDER_KEY, JSON.stringify(rows)); } catch { /* private mode, blocked storage: the session's order only */ }
}
function arrangeRows(prev, xi, posOf) {
  const rows = {};
  const flips = new Map();
  for (const r of PM_ROWS) {
    const now = xi.filter((id) => posOf(id) === r);
    const before = prev?.[r] || [];
    const incoming = now.filter((id) => !before.includes(id));
    const kept = [];
    for (const id of before) {
      if (now.includes(id)) kept.push(id);
      else if (before.length === now.length && incoming.length) {
        const n = incoming.shift();
        flips.set(n, id);
        kept.push(n);
      }
    }
    rows[r] = [...kept, ...incoming];
  }
  return { rows, flips };
}

/** A shirt on the turf: a green-family goalkeeper colour turns grey there (kits.js `turf`); in FPL's 220 × 290 frame
 *  (`tall`), so a drawn and an official shirt sit the same. */
const face = (p, side) => h(`span.pm-face.${side}`, null, shirt({ club: p?.club, gk: posName(p?.pos) === 'GK', size: 64, turf: true, tall: true }));

/** FPL's flag at the tile's top-right: a yellow (doubt) warning triangle, or a red (out, ≤ 25%) no-entry disc, and his
 *  chance ("75%"). */
const flag = (tone, words) => h('span.pm-flag', { class: tone, 'aria-hidden': 'true' },
  svg('svg', { class: 'pm-flag-g', viewBox: '0 0 15 13' }, ...(tone === 'red' ? [
    svg('circle', { class: 'pm-flag-t', cx: 7.5, cy: 6.5, r: 6.1 }),
    svg('rect', { class: 'pm-flag-i', x: 3.9, y: 5.5, width: 7.2, height: 2, rx: 0.4 })] : [
    svg('path', { class: 'pm-flag-t', d: 'M7.5 .8 14.3 12.3H.7z' }),
    svg('rect', { class: 'pm-flag-i', x: 6.8, y: 4.3, width: 1.4, height: 4.2, rx: 0.5 }),
    svg('circle', { class: 'pm-flag-i', cx: 7.5, cy: 10.2, r: 0.85 })])),
  words ? h('span.pm-flag-w', null, words) : null);

/**
 * Where the plan's lineup differs from your FPL team (mountPitch `fpl`, GW A only) → Map(id → {move, arm}): move
 * 'start' for one the plan starts who sits on your FPL bench, 'bench' for one it benches who starts in FPL; arm 'c' on
 * your FPL captain where the plan's armband is elsewhere (no mark for your FPL vice: owner, 2026-10-13). None for a
 * buy, a player the plan sells, or the bench order.
 */
export function fplMarks(fpl, { xi = [], bench = [], captain = null } = {}) {
  const out = new Map();
  if (!fpl || !Array.isArray(fpl.xi)) return out;
  const n = (v) => (fin(v) ? Number(v) : null);
  const fxi = new Set(fpl.xi.map(Number)), fbench = new Set((fpl.bench || []).map(Number));
  const ids = { xi: xi.map(Number), bench: bench.map(Number) };
  const put = (id, k, v) => out.set(id, { move: null, arm: null, ...out.get(id), [k]: v });
  for (const id of ids.xi) if (fbench.has(id)) put(id, 'move', 'start');
  for (const id of ids.bench) if (fxi.has(id)) put(id, 'move', 'bench');
  const shown = new Set([...ids.xi, ...ids.bench]);
  const fc = n(fpl.captain);
  if (fc != null && fc !== n(captain) && shown.has(fc)) put(fc, 'arm', 'c');
  return out;
}
// each difference is spoken (FPL_MOVE_SAID, FPL_ARM_SAID), not drawn (owner, 2026-10-09, 2026-10-15)
const FPL_MOVE_SAID = { start: 'on your FPL bench: the plan starts him', bench: 'starts in your FPL team: the plan benches him' };
const FPL_ARM_SAID = { c: 'your FPL captain' };
/** A planned buy, spoken as the lineup's differences are: "not in your FPL team: the plan buys him in GW6", " for
 *  Scott" with the player he replaces. */
const fplBuySaid = (gw, by = null) => `not in your FPL team: the plan buys him in GW${gw}${by ? ` for ${by}` : ''}`;
/** …one of your FPL team the plan sells and buys back this GW (tagged IN: inFor), said as his tag is drawn. */
const buyBackSaid = (gw, by = null) => `the plan buys him back in GW${gw}${by && by !== true ? ` for ${by}` : ''}`;

/** A card's points as its plate shows them: his forecast (one decimal) times the armband's `mult`, so the captain's is
 *  twice the figure shown for him; "—" unknown. */
export const platePts = (xp, mult = 1) => (xp == null ? DASH : fmt.pts(Number(xp.toFixed(1)) * mult));

/** The second plate's content (mountPitch `second`): fixture and points, one of them, or a caller's text ({label,
 *  text(id, p)}, bar(id, p) → {tone, fill, locked} its plate a bar as FPL's pitch draws it: a locked price the lock alone)
 *  → [kids, the words it adds to the card's label]. */
function secondPlate(id, p, o, fx, pts, approx) {
  // each opponent in a pale tint of FPL's FDR colour for this GW (plan-pitch.css .pm-opp.fdr-N); a blank or unknown week stays plain
  const fxEl = () => h('span.pm-fx', null, !fx?.length ? oppLabel(fx) || DASH
    : fx.map((f, i) => [i ? ', ' : null, h('span.pm-opp', { class: f.fdr ? `fdr-${f.fdr}` : null,
      dataset: { fdr: f.fdr ?? '' } }, oppText(f))]));
  // his forecast in the plate's blue, "xP" after it where the plate has room (ui.js xpNum; fitFixtures drops the marker first)
  const ptsEl = () => xpNum(pts, 'b.pm-px', { class: { approx } });
  const s = o.second ?? 'both';
  if (s === 'fx') return [h('span.pm-pf', null, fxEl()), null];
  if (s === 'pts') return [h('span.pm-pf', null, ptsEl()), null];
  if (typeof s === 'object') {
    const text = s.text(id, p) ?? DASH, bar = s.bar?.(id, p);
    const plate = h('span.pm-pf.data', bar ? { class: `bar t${bar.tone}` } : null, h('b.pm-px', null, bar?.locked ? icon('lock', { size: 9 }) : text));
    if (bar) plate.style.setProperty('--pm-fill', `${bar.fill}%`);
    return [plate, `${s.label} ${text}`];
  }
  return [h('span.pm-pf', null, fxEl(), ptsEl()), null];
}

/** A fixture that doesn't fit beside its points (a double's two) takes a line of its own over them, its venue kept
 *  (.pm-pf.two: plan-pitch.css); one still too wide ellipsises. Measured on every box that ellipsises (.pm-fx, .pm-pf)
 *  and on its text's own width (a Range: scrollWidth rounds a sub-pixel overflow away). */
/** Each card's fixture beside its points where it fits, else on a line of its own. The points' "xP" marker goes first
 *  where the line is short (.nomark) and comes back on a points line of its own (owner, 2026-10-22: the number is never
 *  cut); gone on one card, gone on every card of `root`. Exported for a host drawing pitchCard's cards. */
export function fitFixtures(root) {
  const range = document.createRange();
  const over = (fx) => {
    const boxes = [fx, fx.closest('.pm-pf')].filter(Boolean);
    if (boxes.some((b) => b.scrollWidth > b.clientWidth)) return true;
    range.selectNodeContents(fx);
    const r = fx.getBoundingClientRect();
    return r.width > 0 && range.getBoundingClientRect().width > r.width + 0.01;
  };
  // every fixture beside its points on one line, then read once (one layout, not one a plate): the ones too wide take two
  const fxs = [...root.querySelectorAll('.pm-fx')].filter((fx) => fx.querySelector('.pm-opp') && fx.nextElementSibling?.matches('.pm-px'));
  for (const fx of fxs) fx.parentElement.classList.remove('two', 'nomark');
  const short = fxs.filter(over);
  for (const fx of short) fx.parentElement.classList.add('nomark');
  for (const fx of short.filter(over)) fx.parentElement.classList.replace('nomark', 'two');
  // a points-only plate whose marker doesn't fit its card
  const lone = [...root.querySelectorAll('.pm-pf:not(:has(.pm-fx)):has(.xp-u)')];
  for (const pf of lone) pf.classList.remove('nomark');
  for (const pf of lone.filter((x) => x.scrollWidth > x.clientWidth + 0.5)) pf.classList.add('nomark');
  // one look across the cards (owner, 2026-10-27): dropped on one card, dropped on all (ahead.js renderDecks oneXp)
  const marked = [...root.querySelectorAll('.pm-pf:has(.xp-u)')];
  if (marked.some((pf) => pf.classList.contains('nomark'))) for (const pf of marked) pf.classList.add('nomark');
}

/**
 * One player card, on the pitch (.pm-pl) or the bench (.pm-bs, `order` = 'goalkeeper' | 'substitute n'): a shirt tile
 * (C / V top-left, a flag top-right, "OUT GW8" bottom-right when a caller passes `sold`; where the plan differs from
 * your FPL team, `fpl`: said on the card, not drawn), the name plate (flag-coloured when flagged, else ink when bought
 * this GW, ink-ringed when bought earlier in the plan, dark when sold later) and the second plate.
 */
function card(id, P, o, { flipFrom = null, order = null } = {}) {
  const p = P(id);
  const pos = posName(p?.pos);
  const name = p?.name ?? `#${id}`;
  const fx = fixturesAt(p, o.gw, o.horizon);
  const xp = xpAt(p, o.gw, o.horizon);
  const isCap = id === o.captain, isVice = id === o.vice;
  const mult = isCap && o.capPoints ? (o.tc ? 3 : 2) : 1;
  const tone = availabilityTone(p);
  const blank = Array.isArray(fx) && !fx.length;
  // (a forecast under 1 xP for the week, less than the point FPL gives any player who comes on: dimmed as a doubtful
  // player is, no flag (FPL's doubts keep theirs); a week with no fixture keeps its own look; owner, 2026-11-09, "why
  // walle egely opacity still full", "Yes, dim under 1 xP")
  const low = !tone && !blank && xp != null && xp < 1;
  const dgw = fx?.length > 1;
  const bought = o.bought?.[id] ?? null;  // the GW he was bought in, when he is not in the real squad
  const sold = o.sold?.[id] ?? null;  // the GW the plan sells him in, when it does after this one
  const approx = o.approx === true || !!o.approx?.has(id);
  // the captain's points doubled (tripled with a Triple Captain) only with `capPoints`, his spoken label then "6.1
  // times 2"; off by default (owner, 2026-11-02: his own forecast on his plate, the C badge says he is captain)
  const pts = platePts(xp, mult);
  // the ink plate a buy of this GW only (an earlier week's buy keeps `bought`: an ink ring inside his plain plate);
  // with `inFor` every buy of the week, one of your FPL team bought back too: his name plate ink (`is-in`: no badge, no
  // green; owner, 2026-10-25), the player he replaces in his spoken label and his Why sheet
  const by = o.inFor?.[id];  // the player he replaces, or true in a squad week (a Wildcard or Free Hit)
  const tagIn = by != null || (bought != null && bought === o.gw) ? 'IN' : null;
  // where the plan differs from your FPL team (fplMarks, GW A only): your FPL captain, a sub or a start are spoken on
  // the card, not drawn
  const mk = o.marks?.get(id) ?? null;
  const [plate2, said] = secondPlate(id, p, o, fx, pts, approx);
  const spoken = [order ? `${order}: ${name}` : name, POS_WORD[pos], p?.club,
    isCap ? (o.tc ? 'triple captain' : 'captain') : isVice ? 'vice-captain' : null, FPL_ARM_SAID[mk?.arm] ?? null, FPL_MOVE_SAID[mk?.move] ?? null,
    xp == null ? null : `${approx ? 'about ' : ''}${mult > 1 ? `${fmt.pts(xp)} times ${mult}` : pts} expected points${dgw ? ', double gameweek' : ''}`, oppSpoken(fx),
    availabilityWords(p, o.first), bought != null ? fplBuySaid(bought, tagIn && by !== true ? by : null) : by != null ? buyBackSaid(o.gw, by) : null,
    sold != null ? `sold in GW${sold}` : null, said].filter(Boolean).join(', ') + (o.why?.has(id) ? '; shows why' : '');
  const kids = [
    h('span.pm-kit', null,
      h('span.pm-flip', { class: { from: flipFrom != null } }, face(p, 'front'), flipFrom != null ? face(P(flipFrom), 'back') : null),
      isCap || isVice ? h('span.pm-badge', { class: isCap ? ['c', o.tc && 'tc'] : 'v', dataset: { badge: isCap ? 'c' : 'v' }, 'aria-hidden': 'true' },
        isCap ? (o.tc ? '3×' : 'C') : 'V') : null,
      tone ? flag(tone, chanceText(p)) : null,
      sold != null ? h('span.pm-out', { 'aria-hidden': 'true' }, `OUT GW${sold}`) : null),
    h('span.pm-plate', { class: { chg: flipFrom != null }, 'aria-hidden': 'true' }, h('span.pm-pn', null, name), plate2),
  ];
  const attrs = {
    class: [order ? 'pm-bs' : 'pm-pl', 'pm-card', tone && `f-${tone}`, low && 'low', bought != null && 'bought', tagIn && 'is-in', sold != null && 'sold', blank && 'blank',
      o.animate?.has(id) && 'new'],
    dataset: { id, pos: pos || '', pts }, 'aria-label': spoken,
  };
  return o.onPlayer
    ? h('button', { ...attrs, type: 'button', onClick: (e) => o.onPlayer(id, e) }, kids)
    : h('div', { ...attrs, role: 'img' }, kids);
}

/** The turf (stripes and markings in perspective) and the goal over its goal line, in the 390 × 446 box. */
function turf() {
  const bands = 11, bh = PH / bands;
  const box = { viewBox: `0 0 ${PW} ${PH}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' };
  const chalk = (tag, a) => svg(tag, { class: 'pm-chalk', ...a });
  const net = [];
  for (let x = 167; x <= 223; x += 5) net.push(svg('line', { x1: x, y1: 1, x2: x, y2: 25 }));
  for (let y = 5; y <= 25; y += 5) net.push(svg('line', { x1: 164, y1: y, x2: 226, y2: y }));
  return [
    h('div.pm-turf', null, svg('svg', { class: 'pm-lines', ...box },
      // the last band is turf-1, so it runs on into the bench's fade
      Array.from({ length: bands }, (_, i) => svg('rect', { class: (bands - 1 - i) % 2 ? 'pm-band b' : 'pm-band', x: 0, y: i * bh, width: PW, height: bh + 0.5 })),
      chalk('path', { d: 'M-2 107 L44 25 H346 L392 107' }),   // touchlines and goal line
      chalk('path', { d: 'M103 25 L84 66 H306 L287 25' }),    // penalty area
      chalk('path', { d: 'M150 25 L147 45 H243 L240 25' }),   // goal area
      chalk('path', { d: 'M155 66 Q195 84 235 66' }),         // penalty arc
      chalk('path', { d: 'M51 25 Q49.2 34 40.6 31.1 M339 25 Q340.8 34 349.4 31.1' }),  // corner arcs, 7 units round each corner
      chalk('line', { x1: 0, y1: 303, x2: PW, y2: 303 }),     // halfway line, through the MID plates
      chalk('ellipse', { cx: 195, cy: 303, rx: 64, ry: 54 }))),
    svg('svg', { class: 'pm-goal', ...box },
      svg('rect', { class: 'pm-goal-in', x: 164, y: 0, width: 62, height: 25 }),
      svg('g', { class: 'pm-net' }, net),
      svg('path', { class: 'pm-goal-frame', d: 'M164 25 V1 H226 V25' })),
  ];
}

const benchLabel = (chipKey) => (chipKey === 'bb' ? 'Bench, in order (Bench Boost: it counts)' : 'Bench, in order');

/** Each sub's place in FPL's bench order: the outfield subs 1, 2, 3 as the bench lists them, the keeper none. posOf(id)
 *  → 'GK' | … → Map(id → n | null) */
export function subOrder(bench, posOf) {
  let n = 0;
  return new Map((bench || []).map(Number).map((id) => [id, posOf(id) === 'GK' ? null : ++n]));
}
/** A sub's label over his card: "1 · DEF" in its bench order (subOrder's n), "GKP" for the keeper (owner, 2026-10-21). */
export const benchTag = (pos, n) => (n == null ? posCode(pos) ?? 'GKP' : `${n} · ${posCode(pos) ?? ''}`);
/** A sub's order as Ahead's bench label reads it, "1st", "2nd", "3rd" (owner, 2026-10-22), the keeper's none:
 *  benchTag's order with its ending (.pm-blo, drawn only where a host shows it). */
export const benchNth = (n) => (n == null ? '' : fmt.ordinal(n));
/** A sub's place as his card and his label say it: "substitute 1" (subOrder's n), "goalkeeper" for the keeper. */
const benchOrder = (n) => (n == null ? 'goalkeeper' : `substitute ${n}`);
/** A sub's label's spoken name: the label as it reads first, so voice control finds it by what it shows (WCAG 2.5.3),
 *  then his card's words and what a tap does: "1 · DEF, substitute 1: Thomas, pick who he replaces". */
export const benchTagSaid = (pos, n, name) => `${benchTag(pos, n)}, ${benchOrder(n)}: ${name}, pick who he replaces`;

/** The bench panel: a lighter panel over the turf's fade, GKP / 1 · DEF / 2 · DEF / 3 · FWD (benchTag) over full-size
 *  cards, in bench order; with `o.onBench` each label a button, the whole label its target. */
function benchPanel(bench, P, o, posOf, chipKey) {
  const nos = subOrder(bench, posOf);
  const bo = { ...o, captain: null, vice: null, animate: null };
  return h('div.pm-benchzone', null, h('div.pm-bench', { role: 'group', 'aria-label': benchLabel(chipKey) },
    bench.map((id) => {
      const n = nos.get(id), order = benchOrder(n), pos = P(id)?.pos;
      // its position's part (.pm-blp: "GKP", " · DEF") a host may leave out and its order's ending (.pm-blo: "st") a
      // host may show (Ahead: "1st"), its spoken name the whole label's
      const t = benchTag(pos, n), at = t.indexOf(' · ');
      const tag = h('span', null, at < 0 ? h('span.pm-blp', null, t)
        : [t.slice(0, at), h('span.pm-blo', null, benchNth(n).slice(String(n).length)), h('span.pm-blp', null, t.slice(at))]);
      return h('div.pm-slot', null, o.onBench
        ? h('button.pm-bl', { type: 'button', dataset: { id }, 'aria-label': benchTagSaid(pos, n, P(id)?.name ?? `#${id}`), onClick: (e) => o.onBench(id, e) }, tag)
        : h('span.pm-bl', { 'aria-hidden': 'true' }, tag),
      card(id, P, bo, { order }));
    })));
}

/** The C badge flies from the old captain's shirt to the new one along a 220 ms arc (§6). */
function armbandHop(root, fromRect, captain) {
  const to = root.querySelector(`.pm-pl[data-id="${captain}"] .pm-badge.c`);
  if (!to || !fromRect?.width) return;
  const box = root.getBoundingClientRect();
  const tr = to.getBoundingClientRect();
  const x0 = fromRect.left - box.left, y0 = fromRect.top - box.top;
  const x1 = tr.left - box.left, y1 = tr.top - box.top;
  const fly = h('span.pm-badge.c.pm-fly', { 'aria-hidden': 'true' }, to.textContent);
  root.append(fly);
  to.style.visibility = 'hidden';
  const at = (x, y, s = 1) => ({ transform: `translate(${x}px, ${y}px) scale(${s})` });
  const anim = fly.animate([at(x0, y0), at((x0 + x1) / 2, Math.min(y0, y1) - 34, 1.35), at(x1, y1)],
    { duration: 220, easing: 'cubic-bezier(.3, .7, .3, 1)' });
  anim.onfinish = anim.oncancel = () => { fly.remove(); to.style.visibility = ''; to.closest('.pm-pl')?.classList.add('bump'); };
}

/**
 * One card as mountPitch draws it, on its own (Ahead's place): the same tile, plates and marks for player `id` in GW
 * `gw`; `order` makes it a bench card; other options are mountPitch's. → the card's node
 */
export function pitchCard(id, { players = {}, gw, horizon, second = 'both', bought = null, inFor = null, approx = false, onPlayer = null, order = null, first = false } = {}) {
  const o = { gw, horizon: horizon ?? gw, first, capPoints: false, onPlayer, bought, inFor, second, captain: null, vice: null,
    approx: approx === true ? true : asSetOrNull(approx), marks: new Map() };
  return card(Number(id), lookup(players), o, { order });
}

/**
 * mountPitch(host, opts) → host: Forkcast's phone pitch. Call again on the same host to update it (host._pm keeps the
 * slots and captain; host owns its children). Scales from its width.
 *   xi, bench, captain, vice, chip, players, gw, horizon   as renderPitch
 *   first      gw is the next deadline's GW: WhoScored's preview feeds the flags
 * bought     {id: gw}: players not in the real squad and the GW each was bought in (ink name plate that GW, ink ring
 * later; a flag's colour wins)
 *   inFor      {id: name | true}: this GW's buys with the player each replaces; true in a Wildcard / Free Hit week
 * second     'both' (default, "LEE (H) 4.6"), 'fx', 'pts', or {label, text(id, row) → string, bar?} (read out as "<label>
 * <text>")
 *   sold       {id: gw}: players the plan sells after this GW: dark name plate and an "OUT GW8" tag
 *   approx     true or ids: "≈" before the points (an unconfirmed phone estimate)
 *   capPoints  (default false: owner, 2026-11-02, his own forecast) the captain's plate shows ×2, ×3 under TC
 *   animate    ids whose shirt pops in;  flip (default true): a changed slot keeps its place, his shirt fading in
 *   benchRow   the bench panel (benchTag labels)
 * fpl        {xi, bench, captain, vice}: your FPL team, to say where this lineup differs (fplMarks); only for the GW
 * it shows the team for (Ahead: GW A)
 *   why        ids whose tap opens their Why sheet (their card says "; shows why")
 *   gapRows    rows placed by the host's CSS, not ROW_TOP (m-ahead.css --pm-share; data-rows="gap")
 * onPlayer(id, evt) on tap; label overrides the field's aria-label. onBench(id, evt) on a sub's label (each a button)
 * Each card carries data-pts. Hooks: starters .pm-pl[data-id] (a button with onPlayer), the captain's badge
 * .pm-badge[data-badge="c"]; bench cards .pm-bs[data-id], labels .pm-bl (buttons with onBench).
 */
export function mountPitch(host, {
  xi = [], bench = [], captain, vice, chip, players = {}, gw, horizon, first = false,
  bought = null, inFor = null, second = 'both', sold = null, approx = false, capPoints = false, animate, flip = true,
  benchRow = false, fpl = null, onPlayer, onBench = null, label, why = null, gapRows = false,
} = {}) {
  const P = lookup(players);
  const st = host._pm || (host._pm = { rows: null, cap: null });
  const chipKey = chip ? String(chip).toLowerCase() : null;
  const o = {
    gw, horizon: horizon ?? gw, first, capPoints, sold, onPlayer, onBench, tc: chipKey === 'tc', bought, inFor, second,
    captain: fin(captain) ? Number(captain) : null, vice: fin(vice) ? Number(vice) : null,
    why: asSetOrNull(why),
    animate: asSetOrNull(animate), approx: approx === true ? true : asSetOrNull(approx),
    // computed once over XI and bench: a bench card is drawn without the plan's armbands (benchPanel), never its marks
    marks: fplMarks(fpl, { xi: xi || [], bench: bench || [], captain, vice }),
  };
  const posOf = (id) => posName(P(id)?.pos) || 'other';
  const benchIds = (bench || []).map(Number);
  // the first mount takes this browser's last order (no flips then: nothing on the page changed)
  const { rows, flips } = arrangeRows(flip ? st.rows ?? storedOrder() : null, (xi || []).map(Number), posOf);
  if (!st.rows) flips.clear();
  const old = host.querySelector(':scope > .pm');
  const hop = old && !reduceMotion() && st.cap != null && o.captain != null && st.cap !== o.captain
    ? old.querySelector(`.pm-pl[data-id="${st.cap}"] .pm-badge.c`)?.getBoundingClientRect() : null;

  const rowsEl = h('div.pm-rows', null, PM_ROWS.filter((r) => rows[r].length).map((r) =>
    h('div.pm-row', { dataset: { pos: r, n: rows[r].length }, style: { [gapRows ? '--pm-share' : 'top']: `${(ROW_TOP[r] / PH) * 100}%` } },
      rows[r].map((id) => card(id, P, o, { flipFrom: flips.get(id) ?? null })))));
  const field = h('div.pm-field', { role: 'group', 'aria-label': label ?? `Starting eleven${fin(gw) ? `, GW${gw}` : ''}` },
    turf(), rowsEl);
  const root = h('div.pm', { dataset: { chip: chipKey || '', ...(gapRows ? { rows: 'gap' } : {}) } },
    field, benchRow && benchIds.length ? benchPanel(benchIds, P, o, posOf, chipKey) : null);
  host.replaceChildren(root);
  // a fixture's fit is the card's width and the text's size: the pitch's width and a plate's height (--pm-plate grows
  // with the text size)
  const fitKey = (r) => `${host.clientWidth}|${r.querySelector('.pm-plate')?.offsetHeight}`;
  fitFixtures(root);
  st.fit = fitKey(root);
  // a web font landing after the first fit widens the text: fit again then
  document.fonts?.ready.then(() => { if (root.isConnected) fitFixtures(root); });
  // the cards scale with the pitch and their type with the text size: a new width or text size fits the fixtures again
  if (!st.ro && typeof ResizeObserver === 'function') {
    st.ro = new ResizeObserver(() => {
      const r = host.querySelector(':scope > .pm');
      if (r && fitKey(r) !== st.fit) { st.fit = fitKey(r); fitFixtures(r); }
    });
    st.ro.observe(host);
  }
  const plate = root.querySelector('.pm-plate');
  if (st.ro && plate) { if (st.plate) st.ro.unobserve(st.plate); st.ro.observe(plate); st.plate = plate; }
  const flipping = root.querySelectorAll('.pm-flip.from');
  if (flipping.length) {
    void root.offsetWidth;  // style the back face first, so dropping .from transitions to the front
    for (const f of flipping) f.classList.remove('from');
  }
  if (hop) armbandHop(root, hop, o.captain);
  st.rows = rows;
  st.cap = o.captain;
  if (flip) storeOrder(rows);
  return host;
}

/**
 * The chip of a pitch mounted on `host` changed to `chip`, and nothing else: the root's data-chip and the bench's
 * label, without redrawing shirts. A Triple Captain on either side changes the captain's badge and points: that takes
 * mountPitch, as does a host with no pitch. → whether it was done here
 */
export function setPitchChip(host, chip) {
  const root = host?.querySelector(':scope > .pm');
  const chipKey = chip ? String(chip).toLowerCase() : null;
  if (!root?.querySelector(':scope > .pm-field > .pm-rows') || [chipKey, root.dataset.chip].includes('tc')) return false;
  root.querySelector(':scope > .pm-benchzone > .pm-bench')?.setAttribute('aria-label', benchLabel(chipKey));
  root.dataset.chip = chipKey || '';
  return true;
}
