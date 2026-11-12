// player card LAST 6 · NEXT 5 timeline, pure half (sheets/player.js draws it; strip.test.mjs).
// His cup and European matches (GET /api/m/player `cups`, api/card.py) stand in date order among the six EPL columns
// (owner, 2026-10-08), each as wide as a match: competition where a match has its GW, venue as a match's, minutes where
// a match has its bar. His club's coming ones (`cup_next`, cup_fixtures.parquet) stand among the forecast GWs likewise,
// before the GW whose deadline they precede, no minutes. A cup draws no opponent (no known code outside the EPL).
// LAST 6 over NEXT 5, one points scale, every column one width. Opponents take one line where they fit, else the row
// goes on over another, never two staggered. No column is ever left out (owner, 2026-10-14): labels that can't fit go
// on over the next line. No DOM: measure(text, weight) gives widths at 13 px.

/** Competitions by league slug (modules/leagues.py CLUB_CUPS, fetch_league.py LEAGUES): code, shorter code, spoken
 *  name. */
export const CUP = {
  champions_league: ['CL', null, 'Champions League'],
  champions_league_qual: ['CL', null, 'Champions League qualifier'],
  europa_league: ['EL', null, 'Europa League'],
  europa_league_qual: ['EL', null, 'Europa League qualifier'],
  conference_league: ['ECL', null, 'Conference League'],
  conference_league_qual: ['ECL', null, 'Conference League qualifier'],
  efl_cup: ['EFL', null, 'EFL Cup'],
  fa_cup: ['FA', null, 'FA Cup'],
  community_shield: ['Shield', 'CS', 'Community Shield'],
  uefa_super_cup: ['USC', null, 'UEFA Super Cup'],
  club_world_cup: ['CWC', null, 'Club World Cup'],
};
/** A league outside the table (national teams: modules/leagues NATIONAL_LEAGUES), named from its slug: capitalised
 *  words, "qual" a qualifier, a confederation in capitals. */
const slugName = (league) => String(league ?? '').split('_').filter(Boolean).map((x) => (x === 'qual' ? 'qualifier' : x === 'int' ? 'International'
  : /^(uefa|afc|caf|conmebol|concacaf)$/.test(x) ? x.toUpperCase() : `${x[0].toUpperCase()}${x.slice(1)}`)).join(' ');
const other = (league) => [/^(world_cup|euro|copa|africa|asian|confed|nations|concacaf|int_)/.test(String(league)) ? 'Intl' : String(league ?? '').slice(0, 3).toUpperCase(), null, slugName(league)];
export const cupCode = (league, short = false) => { const c = CUP[league] ?? other(league); return (short && c[1]) || c[0]; };
export const cupName = (league) => (CUP[league] ?? other(league))[2];

/** "59′", "0′" (in the squad, unused), "—" (not in the squad), "–" (the files lack it). */
export const cupMinutes = (c) => (c.in_squad === false ? '—' : Number.isFinite(c.minutes) ? `${c.minutes}′` : '–');

/** Past columns: his EPL matches (`past`, oldest first) plus every cup match from the first on, by date; later cups are
 *  `after`, the forecast's first columns (futureColumns; owner, 2026-10-16). No kick-off: by GW (a cup after GW n's
 *  deadline follows GW n's match). */
export function pastColumns(past, cups = []) {
  const eplKo = past.map((m) => m.kickoff).filter(Number.isFinite);
  if (!past.length) return { cols: [] };
  const start = eplKo.length ? Math.min(...eplKo) : null;
  const first = past[0];
  const inWindow = (c) => (start != null && Number.isFinite(c.kickoff) ? c.kickoff >= start
    : c.season != null && first.season != null && (c.season > first.season || (c.season === first.season && (c.after_gw ?? -1) >= first.gw)));
  const mine = cups.filter(inWindow);
  // cup before match m: earlier kick-off, or (no kick-offs) deadline GW before m's GW
  const before = (c, m) => (Number.isFinite(c.kickoff) && Number.isFinite(m.kickoff) ? c.kickoff < m.kickoff
    : c.season !== m.season ? (c.season ?? 0) < (m.season ?? 0) : (c.after_gw ?? Infinity) < m.gw);
  const left = [...mine].sort((a, z) => (a.kickoff ?? 0) - (z.kickoff ?? 0));
  const cols = [];
  for (const m of past) {
    while (left.length && before(left[0], m)) cols.push({ kind: 'cup', ...left.shift() });
    cols.push({ kind: 'epl', ...m });
  }
  return { cols, after: left.map((c) => ({ kind: 'cup', ...c })) };
}

/** Future columns: forecast GWs (`fut`: {gw, …}) with his club's coming cup ties (`cupNext`) among them by date (next:
 *  true, before: the first GW whose deadline is after the tie's); one past the last deadline is dropped. A kicked-off
 *  tie stays until his past carries it (api/card.py card; owner, 2026-10-15). */
export function futureColumns(fut, cupNext = [], played = []) {
  const left = [...cupNext].filter((c) => Number.isFinite(c.after_gw))
    .sort((a, z) => (a.kickoff ?? 0) - (z.kickoff ?? 0));
  // pastColumns' `after` (cups played since his last EPL match) first
  const cols = [...played];
  for (const f of fut) {
    while (left.length && left[0].after_gw < f.gw) cols.push({ kind: 'cup', next: true, before: f.gw, ...left.shift() });
    cols.push({ kind: 'gw', ...f });
  }
  return { cols };
}

/** Opponent code size vs the chart's text (11 px of 13; m.css .ps-chart svg text.code): a crowded card stays on two
 *  lines. */
export const CODE_SCALE = 11 / 13;
/** px of each side a cup's code may take of a neighbouring match (its GW is a digit or two). */
export const NEAR = 4;
/** Label `width` wide centred on cx, moved least into [lo, hi] → its centre (matchStrip). At a bound it rounds to 0.1
 *  px (toFixed(1)) away from the bound: nearest rounding could pass the edge. */
export const within = (cx, width, lo, hi) => {
  const x = Math.min(Math.max(cx, lo + width / 2), hi - width / 2);
  return x >= hi - width / 2 ? Math.floor(x * 10) / 10 : x <= lo + width / 2 ? Math.ceil(x * 10) / 10 : x;
};

/** px a column's own labels need: value over the bar (cup: minutes or none), GW or competition (cup: shortest code),
 *  cup venue (match: its opponent, player.js drawLine). */
const needOf = (c, w) => {
  const venue = Math.max(w('H', 400), w('A', 400));
  if (c.kind === 'epl') return Math.max(w(c.minutes ? c.points : '0′', c.minutes ? 600 : 400), w(c.gw, 400)) + 1;
  if (c.kind === 'gw') return Math.max(w(c.value, 600), w(c.gw, 400)) + 1;
  if (c.kind === 'cup') return Math.max(c.next ? 0 : w(cupMinutes(c), 400), w(cupCode(c.league, true), 400), venue) + 1;
  return 0;
};

/** Column width at which `cols` fill W (one width for every kind). */
const unitOf = (cols, W) => (cols.length ? W / cols.length : 0);

/** Columns from x0, each `u` wide, ending at x1 → [{…col, x, w, cx, row}] (row: the match opponent's line under the GW
 *  line, 0; a cup's null), ok (every label on one line). A cup also has `code` (short if the full one doesn't fit its
 *  free room) and `codeAt` [lo, hi] (its room). */
function placeRow(cols, x0, x1, u, w) {
  const width = () => u;
  // room column i leaves each side on the GW line for a cup's code: none past the chart's edges; a cup: what its
  // centred full code leaves; a match, forecast GW or slot: NEAR
  const lends = (i) => {
    const n = cols[i];
    if (!n) return 0;
    return n.kind === 'cup' ? Math.max(0, (width(n) - w(cupCode(n.league), 400)) / 2) : NEAR;
  };
  // opponent's room (match or forecast GW chip): its code in full, may run into a neighbouring cup, plus a px a side
  // (the chip's colour may be narrower than its 3 px padding: player.js chip)
  const codeW = (c) => (c.kind === 'epl' ? w(c.opp) * CODE_SCALE + 2 : c.kind === 'gw' ? Math.max(0, ...(c.codes ?? []).map((s) => w(s) * CODE_SCALE)) + 2 : 0);
  // a centred code may take what the narrower side lends (a cup lends half its width)
  const lend = (i) => { const n = cols[i]; return n && n.kind === 'cup' ? width(n) / 2 - 1 : 0; };
  const room = (i) => width(cols[i]) + 2 * Math.min(lend(i - 1), lend(i + 1));
  const ok = cols.every((c, i) => needOf(c, w) <= width(c) && (c.kind === 'cup' || codeW(c) <= room(i)));
  let x = x0;
  const placed = cols.map((c, i) => {
    const cw = width(c);
    const out = { ...c, x, w: cw, cx: x + cw / 2, row: c.kind === 'cup' ? null : 0 };
    if (c.kind === 'cup') {
      const [cl, cr] = [lends(i - 1), lends(i + 1)];
      const full = cupCode(c.league);
      Object.assign(out, {
        code: w(full, 400) <= cw + cl + cr ? full : cupCode(c.league, true),
        // inside the row exactly (its columns' widths summed drift past x1 by a hair)
        codeAt: [Math.max(x0, x - cl), Math.min(x1, x + cw + cr)],
      });
    }
    x += cw;
    return out;
  });
  return { cols: placed, ok };
}

/** A row's columns in n lines of about even width (a column on the line its middle falls in). */
function cut(cols, n) {
  if (n <= 1) return [cols];
  const per = cols.length / n;
  const out = Array.from({ length: n }, () => []);
  cols.forEach((c, i) => out[Math.min(n - 1, Math.floor((i + 0.5) / per))].push(c));
  return out.filter((l) => l.length);
}

/** The strip in width W → {lines: [past, forecast; a row too long for W takes more], each {cols: [{…col, x, w, cx,
 *  row}], ok}, from x 0, longest to W; cols (all lines', past first; forecast's `ahead`), ok, W}. `slots`: past columns
 *  held open while loading; no past, no slots: forecast alone. */
export function layout({ pastCols, futCols, W, measure, slots = 0 }) {
  const held = !pastCols.length && slots ? Array.from({ length: slots }, () => ({ kind: 'slot' })) : pastCols;
  const w = (s, wt = 600) => (s == null || s === '' ? 0 : measure(String(s), wt));
  const rows = [held, futCols.map((c) => ({ ...c, ahead: true }))].filter((r) => r.length);
  const most = Math.max(0, ...rows.map((r) => r.length));
  // one width per column, longest line filling W; labels that don't fit: k lines of at most most/k columns, fewest k
  // that fit
  let lines;
  for (let k = 1; ; k++) {
    const cuts = rows.flatMap((r) => cut(r, Math.ceil(r.length / (most / k) - 1e-9)));
    const us = cuts.filter((r) => r.length).map((r) => unitOf(r, W));
    const u = us.length ? Math.min(...us) : 0;
    lines = cuts.map((r) => placeRow(r, 0, W, u, w));
    if (lines.every((l) => l.ok) || k >= Math.max(1, ...rows.map((r) => r.length))) break;
  }
  return { lines, cols: lines.flatMap((l) => l.cols), ok: lines.every((l) => l.ok), W };
}
