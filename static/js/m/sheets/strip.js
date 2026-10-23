// Forkcast · the player card's LAST 6 · NEXT 5 timeline, its pure half (sheets/player.js draws it; strip.test.mjs).
// The user, 2026-10-08, on Calafiori's card: "the other tournaments not in the fixture past and previous". His cup
// and European matches (GET /api/m/player `cups`, api/card.py) stand in date order among the six EPL columns, each a
// grey column as wide as a match's (the user, 2026-10-16: "fixtures still have different widths"): the competition where a match has its GW, the venue as a match's, his minutes where a match
// has its bar ("59′"; "—" out of the squad). His club's coming ones (`cup_next`, from data/output/processed/
// cup_fixtures.parquet) stand among the forecast GWs the same way, each before the GW whose deadline it comes before,
// with no minutes (the user, 2026-10-13: "why future non epl games missing"; 2026-10-14, on the "CL (A)" tags under a
// forecast GW: "show actual future fixtures same way they shown in last 6"). No opponent is drawn for either: a club
// outside the EPL has no code anyone knows ("BMU" was Bayern Munich, "SPR" both Prague clubs; the user, 2026-10-14:
// "what the fuck is this"), so its name is in the spoken label and the column's title alone.
// Two lines on one points scale, LAST 6 over NEXT 5 (the user, 2026-10-14: "maybe past matches and forecast shall be
// back splitted in two lines so enough space for all": in one row, from 2026-10-13, eleven columns of 3-letter codes at
// 13 px took two staggered lines and the played cups went first), their columns one width: a forecast GW as wide as a
// match, a coming cup as a played one (the user, 2026-10-14: "make the fixture width in next the same as in past
// fixtures"), so the shorter line ends short of the chart's edge. The opponents take one line where they fit (the user,
// 2026-10-14: "move teams in one row instead of three"; a cup draws none since), else the row goes on over another
// line (never two staggered lines: the user, 2026-10-16, "why oppenents take two rows instead of one"). No column is
// ever left out (the user, 2026-10-14: "remove all 'dropping fixtures' rules so no fixtures are ever dropped": dropping
// cups to keep one line lost Saka's Champions League game after Leeds): a line whose labels can't fit the width goes
// on over the next (Konsa's six matches spanned the summer's World Cup, 19 cup and national-team games among them).
// No DOM here: the text widths come from the caller's measure(text, weight) at the chart's 13 px.

/** The competitions by their league slug (modules/leagues.py CLUB_CUPS, fetch_league.py LEAGUES): the code a column
 *  carries, a shorter one for a column too narrow for it, and the name its spoken label says. */
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
/** A league the table doesn't know (a national-team game, when the build has them: modules/leagues NATIONAL_LEAGUES),
 *  named from its slug as the table's names read: each word capitalised, "qual" a qualifier, a confederation in
 *  capitals ("nations_league_a" → "Nations League A", "world_cup_qual_uefa" → "World Cup qualifier UEFA"; Dana, first
 *  use 2026-10-21: the raw "nations league a." read as cut off). */
const slugName = (league) => String(league ?? '').split('_').filter(Boolean).map((x) => (x === 'qual' ? 'qualifier' : x === 'int' ? 'International'
  : /^(uefa|afc|caf|conmebol|concacaf)$/.test(x) ? x.toUpperCase() : `${x[0].toUpperCase()}${x.slice(1)}`)).join(' ');
const other = (league) => [/^(world_cup|euro|copa|africa|asian|confed|nations|concacaf|int_)/.test(String(league)) ? 'Intl' : String(league ?? '').slice(0, 3).toUpperCase(), null, slugName(league)];
export const cupCode = (league, short = false) => { const c = CUP[league] ?? other(league); return (short && c[1]) || c[0]; };
export const cupName = (league) => (CUP[league] ?? other(league))[2];

/** "59′", "0′" (in the squad, unused), "—" (not in the squad), "–" (the files lack it). */
export const cupMinutes = (c) => (c.in_squad === false ? '—' : Number.isFinite(c.minutes) ? `${c.minutes}′` : '–');

/** The past columns: his EPL matches (`past`, oldest first) and, in date order among them, every cup match from the
 *  first of them on (the window); the cups before it are left out, and those after his last EPL match are `after`, the
 *  forecast's line's first columns (futureColumns; the user, 2026-10-16: "move all non epl fixtures which go before
 *  next epl to next five row even if played already"). A match whose kick-off the files lack keeps its place by GW (a
 *  cup after GW n's deadline sits after GW n's match). */
export function pastColumns(past, cups = []) {
  const eplKo = past.map((m) => m.kickoff).filter(Number.isFinite);
  if (!past.length) return { cols: [] };
  const start = eplKo.length ? Math.min(...eplKo) : null;
  const first = past[0];
  const inWindow = (c) => (start != null && Number.isFinite(c.kickoff) ? c.kickoff >= start
    : c.season != null && first.season != null && (c.season > first.season || (c.season === first.season && (c.after_gw ?? -1) >= first.gw)));
  const mine = cups.filter(inWindow);
  // before match m: a cup whose kick-off is earlier, or (no kick-offs) whose deadline GW is before m's GW
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

/** The future columns: the forecast GWs (`fut`: {gw, …}) and, among them in date order, his club's coming cup ties
 *  (`cupNext`) as cup columns (next: true, before: the GW it comes before, the first whose deadline is after its own:
 *  after_gw < gw), as the past's are; a tie after the last GW's deadline is past the window, left out. A tie kicked off
 *  stays until his past carries it (api/card.py card: cup_next from his data's last match on; the user, 2026-10-15:
 *  "why eurapean match before crystal palace game missing", Brighton's Conference League tie gone at kick-off, his past
 *  not having it until the night's build). */
export function futureColumns(fut, cupNext = [], played = []) {
  const left = [...cupNext].filter((c) => Number.isFinite(c.after_gw))
    .sort((a, z) => (a.kickoff ?? 0) - (z.kickoff ?? 0));
  // the cups played since his last EPL match (pastColumns' `after`) first, his minutes in each
  const cols = [...played];
  for (const f of fut) {
    while (left.length && left[0].after_gw < f.gw) cols.push({ kind: 'cup', next: true, before: f.gw, ...left.shift() });
    cols.push({ kind: 'gw', ...f });
  }
  return { cols };
}

/** An opponent's code's size against the chart's text (11 px of 13; m.css .ps-chart svg text.code): every column one
 *  width keeps a crowded card on two lines (the user, 2026-10-16: "Smaller code text"). */
export const CODE_SCALE = 11 / 13;
/** px of each side a cup's competition code may take of a match beside it (its GW is a digit or two). */
export const NEAR = 4;
/** A label `width` wide centred on cx, moved the least to lie within [lo, hi] → its centre (a chip or a cup's label at
 *  the chart's edge, or beside a neighbour that leaves it less than half: matchStrip). At a bound it is rounded to the
 *  0.1 px the chart writes (toFixed(1)) away from that bound: rounded the nearest way it ended 0.03 px past the edge
 *  (the sweep of 308 cards, 2026-10-14: "AMA" at x 328.67 written 328.7 in 343). */
export const within = (cx, width, lo, hi) => {
  const x = Math.min(Math.max(cx, lo + width / 2), hi - width / 2);
  return x >= hi - width / 2 ? Math.floor(x * 10) / 10 : x <= lo + width / 2 ? Math.ceil(x * 10) / 10 : x;
};

/** What a column's own labels need, px (w(text, weight): their widths): its value over the bar (a played cup: his
 *  minutes; a coming one nothing), its GW or competition (a cup's shortest code); a cup its venue too (a match's is its
 *  opponent's case: player.js drawLine). */
const needOf = (c, w) => {
  const venue = Math.max(w('H', 400), w('A', 400));
  if (c.kind === 'epl') return Math.max(w(c.minutes ? c.points : '0′', c.minutes ? 600 : 400), w(c.gw, 400)) + 1;
  if (c.kind === 'gw') return Math.max(w(c.value, 600), w(c.gw, 400)) + 1;
  if (c.kind === 'cup') return Math.max(c.next ? 0 : w(cupMinutes(c), 400), w(cupCode(c.league, true), 400), venue) + 1;
  return 0;  // a slot held open while the card loads
};

/** The column width at which `cols` fill W: every column one width, a match's, a cup's and a forecast GW's alike. */
const unitOf = (cols, W) => (cols.length ? W / cols.length : 0);

/** A row of columns from x0, each `u` wide, on a chart that ends at x1: [{…col, x, w, cx,
 *  row}] (row: the line a match's opponent takes under the GW line, 0; a cup's null, it draws none), ok (every label
 *  fits on one line); every column placed. A cup also carries `code` (its competition,
 *  short where the full one doesn't fit what its neighbours leave free on the GW line) and the room it is drawn within,
 *  `codeAt` ([lo, hi]: never past the chart's edges; the review, 2026-10-14: B.Fernandes's last column, a Champions
 *  League tie, drew its opponent "AMA" 2 px past the edge). */
function placeRow(cols, x0, x1, u, w) {
  const width = () => u;
  // what column i leaves free beside it on the GW line, each side, for a cup's code: nothing past the chart's edges; a
  // cup, what its own centred code leaves of its width (its full code, the widest it may draw: the review, 2026-10-14,
  // "Shield" ran into "CWC" or "ECL" beside it); a match, a forecast GW or a slot, NEAR
  const lends = (i) => {
    const n = cols[i];
    if (!n) return 0;
    return n.kind === 'cup' ? Math.max(0, (width(n) - w(cupCode(n.league), 400)) / 2) : NEAR;
  };
  // a match's opponent's room: its code in full, which may run into a cup beside it (a
  // cup leaves that line empty); an opponent is a chip, a match's as a forecast GW's (its code and 3 px a side)
  // its text and a px a side: the chip's colour may be narrower than its 3 px padding (player.js chip: the column's
  // width, the user, 2026-10-16: "why 4 fixtures rows instead of two")
  const codeW = (c) => (c.kind === 'epl' ? w(c.opp) * CODE_SCALE + 2 : c.kind === 'gw' ? Math.max(0, ...(c.codes ?? []).map((s) => w(s) * CODE_SCALE)) + 2 : 0);
  // a code is centred: it may take as much of each side as the narrower side lends (a cup lends half its width)
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

/** A row's columns in n consecutive lines of about even width (each column on the line its middle falls in). */
function cut(cols, n) {
  if (n <= 1) return [cols];
  const per = cols.length / n;
  const out = Array.from({ length: n }, () => []);
  cols.forEach((c, i) => out[Math.min(n - 1, Math.floor((i + 0.5) / per))].push(c));
  return out.filter((l) => l.length);
}

/** The strip in width W: {lines: [the past's, the forecast's; a row too long for W on more], each {cols: [{…col, x, w,
 *  cx, row}], ok}, from x 0, the longest line to W; cols (every line's, the past's first: the forecast's
 *  marked `ahead`), ok, W}. `slots`: past columns held open while the card loads (no data in them); no past columns at
 *  all and none held: the forecast's line alone. measure(text, weight) → px at the chart's 13 px. */
export function layout({ pastCols, futCols, W, measure, slots = 0 }) {
  const held = !pastCols.length && slots ? Array.from({ length: slots }, () => ({ kind: 'slot' })) : pastCols;
  const w = (s, wt = 600) => (s == null || s === '' ? 0 : measure(String(s), wt));
  const rows = [held, futCols.map((c) => ({ ...c, ahead: true }))].filter((r) => r.length);
  const most = Math.max(0, ...rows.map((r) => r.length));
  // one column width for every column of every line, the longest line filling W; a row whose labels can't fit that goes
  // on over more lines, each row cut into lines of at most most/k columns, the fewest k at which every label fits
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
