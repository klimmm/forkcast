// Forkcast · Why (IPHONE_DESIGN §5.3): a medium sheet, draggable to large, for a move or a plan's week against the plan
// without it (ahead.js openWhy: a transfer row; openPlanWhy: a suggested plan). The user, 2026-10-19 ("get in order
// players comparison page. many random and dublicated info, structure is random, aligment is fucked, no actual
// comparision of stats, price, only points comparision in many places"): every fact once, in this order —
//   · its title the move ("Saka → Palmer"), its sub the one gain ("GW8 · +5.6 xP over GW8–11 vs no transfers": ahead.js whySub);
//   · its buttons, two to a row (Remove, Keep, Not; Take), the sheet closing when one acts;
//   · each move's two players side by side, the buy first: one table, a column each, every number right-aligned on one
//     grid (pairTable): club and position, price (the buy's, the sale's at FPL's sale price), owned, status; each GW's
//     forecast with its opponent, and their total; their last six matches; the stats the data chose for the buy, per
//     match or per 90 (the card's switch, this viewer's pick), each with its rank among his position, the head saying
//     among how many ("ranks among 84 midfielders"), and once under the tables what the stats are against the forecast
//     ("Stats are past matches; the GW8–11 points above are the forecast."; the user, 2026-10-21: fix all (first-use
//     proposal #6));
//   · a Wildcard's or Free Hit's changes instead (ahead.squadChanges: the Week sheet's change rows, no × or swipe);
//   · what else it changes, one fact a line (ahead.whyFacts: the money, a hit, the next GW's free transfers, what it
//     replaces, if he misses, a better use), then the When line;
//   · "Counted after GW8": the two plans' later weeks in words (ahead.countedAfter), none where neither moves later;
//   · the run strip ("Every forecast run"): model internals, on a local page only (Dev mode, api.access), as the You
//     sheet's. Never "objective", "τ" or "seed" in the copy (§9).
//
// open(ctx, {title, sub, reason? (a plan's why, read off its solved road), gw (the move's GW: the table's first), pairs: [{in, out, buy, sell}], facts: [text], when?,
// acts?: [{label, act, fill, disabled}], changes?: {head, rows: [node]}, later?: {head, lines: [text]}, a: {road, label},
// b: {road, label, short} (the two plans: the run strip's)}) → sheet.

import * as C from '../calls.js';
import { h, svg, fmt, fill, posCode, posName, xpNum, xpGain, xpMark } from '../../ui.js';
import { inputsOf, plan, xpShown, presolveTaps } from '../ahead.js';
import { STAT, WORD, statusLines, cardOf, statsView, keepStatsView, segControl, pastSums } from './player.js';
import { oppText } from '../../plan/pitch.js';

const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const span = (gws) => C.COPY.span(gws);
const DASH = '–';
/** A fact of whyFacts as a line of its own: "Frees £0.2m". */
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export function open(ctx, spec = {}) {
  const inputs = ctx.bundle?.entry && ctx.data ? inputsOf(ctx) : null;
  const P = inputs ? plan(ctx) : null;
  if (!P || !spec.a || !spec.b) return null;
  const why = { a: spec.a, b: spec.b, cmp: C.compare(inputs, spec.a.road, spec.b.road), noise: num(inputs.noise) ?? 0, A: inputs.A };
  let me = null;
  return ctx.sheets.open({
    title: spec.title, sub: spec.sub, detent: 'medium', detents: ['medium', 'large'], cls: 'wy-sheet',
    // its taps (spec.presolve: Take it, Remove, Keep, Not, Move to GWn) solved ahead while it is open (the owner,
    // 2026-10-26: "fix speed so all pre solved and done without no cost")
    onClose: () => presolveTaps(ctx, null, { owner: me }),
    build(body, sheet) {
      me = sheet;
      if (spec.presolve?.length) presolveTaps(ctx, spec.presolve, { gw: spec.gw ?? null, owner: sheet });
      // the move's answers by tap (the six-book review, 2026-10-09: the swipes had no visible twin): "Keep Scott · GW6",
      // "Not Groß · GW6" (the row's left swipe by tap, B19), each with its toast and Undo; the sheet closes when one acts.
      // B99: the row's own one ("Remove") filled only when it beats the noise (a.fill)
      // why a plan's moves go together, read off its solved road, first under the title (design 1026e "line": the
      // second tap's answer; ahead.openPlanWhy)
      if (spec.reason) body.append(h('p.wy-reason', null, spec.reason));
      if (spec.acts?.length) {
        body.append(h('div.ah-btnrow.wy-acts', null, spec.acts.map((a) => h('button', {
          // `said`: its spoken label where the shown one is short ("Take it": the title names the move)
          type: 'button', class: { acc: !!a.fill }, disabled: !!a.disabled, 'aria-label': a.said ?? null, onClick: () => { if (a.act() !== false) sheet.close(); },
        }, a.label))));
      }
      const g = spec.gw ?? P.A, gws = P.gws.filter((x) => x >= g);
      // under the tables, once, what the stats are against the forecast (COPY.statsPast; the user, 2026-10-21: fix all
      // (first-use proposal #6)), there once a table draws its stats
      const past = h('p.m-foot.wy-fn.wy-past', { hidden: true }, C.COPY.statsPast(gws));
      for (const pr of spec.pairs || []) body.append(pairTable(ctx, P, pr, g, gws, () => { past.hidden = false; }));
      body.append(past);
      // a Wildcard's or Free Hit's changes in their place, read-only (the user, 2026-10-21: fix all (first-use proposal #7))
      if (spec.changes?.rows.length) body.append(h('div.m-sec.wy-chg', null, h('h3', null, spec.changes.head), h('div.ah-moves.sq', null, spec.changes.rows)));
      const when = spec.when?.weeks?.length ? whenLine(spec.when, sheet) : null;
      if (spec.facts?.length || when) {
        body.append(h('div.m-sec.wy-also', null, h('h3', null, 'What else changes'),
          spec.facts?.length ? h('ul.wy-facts', null, spec.facts.map((t) => h('li', null, cap(t)))) : null,
          when?.line, when?.note, when?.go));
      }
      // what its number counts after its week, both plans in words, read-only (proposal #3)
      if (spec.later) body.append(h('div.m-sec.wy-after', null, h('h3', null, spec.later.head), h('ul.wy-facts', null, spec.later.lines.map((t) => h('li', null, t)))));
      const runs = h('div');
      body.append(runs);
      if (why.cmp?.runs) Promise.resolve(ctx.api?.access?.()).then((a) => { if (a?.local && runs.isConnected) runs.replaceWith(runStrip(why, sheet)); }).catch(() => {});
    },
  });
}

// ================================================================ the two players, side by side

/**
 * One move's two players, the buy first, each name a button to his card (the user, 2026-10-14: "in this tab better to
 * also see the stats fixtures and stats comparison which players card show"; 2026-10-19: "no actual comparision of
 * stats, price"): a table with a row label and a column each, its groups under cap labels, every value right-aligned on
 * the same two columns:
 *   · club and position; price: the buy's and the sale's (`buy`, `sell`: the engine's, FPL's sale price, so the bank
 *     line under it adds up), the seller's current price under his where they differ; owned; status (FPL's flag as his
 *     card says it: player.statusLines, else "Available");
 *   · FORECAST PTS: one row a GW from `g`, each value as the pitch shows it (ahead.xpShown) over the opponent ("TOT"
 *     home, "tot" away, as the card's strip), then their total;
 *   · LAST 6 MATCHES: their points and minutes (the card's, player.pastSums), "–" while a card loads;
 *   · STATS: the buy's rows (the stats the data chose for him: api/card.py _rows), his figure and the seller's on each
 *     (stats.vs, only when they play the same position), each with its rank among his position, the head saying among
 *     how many (COPY.statsHead: "ranks among 84 midfielders", the strip's `n`; one count, the seller's the same: stats.vs
 *     is of his position); per match or per 90 (the card's switch, this viewer's pick: player.statsView).
 * The card-borne groups fill in place as the cards land (player.cardOf: the bundle's at once, else asked while the sheet
 * is open), so nothing above them moves. g: the move's GW, gws: the table's (g to the plan's end); onStats() once its
 * stats are drawn. → node | null (a player the data lacks).
 */
function pairTable(ctx, P, pr, g, gws, onStats) {
  const d = ctx.data, L = P.L;
  const ids = [Number(pr.in), Number(pr.out)];
  const rows = ids.map((id) => d.byId?.get(id));
  if (rows.some((r) => !r)) return null;
  const nm = ids.map((id) => L.name(id));
  const row = (label, cells, cls = '', dataset = null) => h(`div.r${cls}`, { role: 'row', dataset }, h('div.n', { role: 'rowheader' }, label),
    cells.map((c, i) => h('div.c', { role: 'cell', 'aria-label': c?.said ? `${nm[i]}, ${c.said}` : null }, c?.node ?? c ?? DASH)));
  const grp = (label, extra = null, dataset = null) => h('div.grp', { role: 'row', dataset }, h('span', { role: 'rowheader' }, label), extra);
  // the opponent's code its venue, "COV" at home, "cov" away (the user, 2026-10-16), spoken in words
  const fxs = (row, x) => ctx.pitch?.fixturesAt?.(row, x, d.xpGws) || [];
  const opp = (row, x) => fxs(row, x).map(oppText).join(' + ') || DASH;
  const oppSaid = (row, x) => fxs(row, x).map((f) => `${String(f.opp).toUpperCase()} ${f.home ? 'home' : 'away'}`).join(' and ') || 'no match';
  const xpAt = (row, x) => num(ctx.pitch?.xpAt?.(row, x, d.xpGws));
  const money = (x) => (num(x) == null ? DASH : fmt.money(x));
  const sale = pr.sell ?? L.price(ids[1]), now = num(rows[1].price);
  const owned = (r) => (num(r.sel_pct) == null ? DASH : fmt.pct(r.sel_pct));
  const later = h('div.wy-later');
  const box = h('div.wy-cmp', { role: 'table', 'aria-label': `${nm[0]} in, ${nm[1]} out` },
    h('div.r.hd', { role: 'row' }, h('div.n', { role: 'columnheader' }),
      // each name his card (the pitch research's 4a, the user 2026-10-19: an IN card's Why sheet "with a link to his
      // player card"): over a Week sheet it takes the Why sheet's place (app.js: two sheets at most), Back the Week sheet;
      // read as a link, "Mbeumo ›" (the user, 2026-10-23: "how do i open player cards ... anywhere i click it open only
      // comparison card"; m-ahead.css .wy-pn::after), the name ellipsised before the chevron
      ids.map((id, i) => h('div.c', { role: 'columnheader', 'aria-label': `${nm[i]} ${i ? 'out' : 'in'}` },
        h('button.wy-pn', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': C.COPY.cardOf(nm[i]), onClick: () => ctx.openSheet('player', id, { gw: g }) }, h('span', null, nm[i])),
        h('span.o', null, i ? 'Out' : 'In')))),
    row('Club', rows.map((r, i) => `${r.club ?? DASH} · ${posCode(L.pos(ids[i]) ?? posName(r.pos))}`)),
    row('Price', [money(pr.buy ?? L.price(ids[0])), {
      node: [money(sale), num(sale) != null && now != null && Math.abs(sale - now) >= 0.05 ? h('span.o', null, `now ${fmt.money(now)}`) : null],
      said: `sells for ${money(sale)}${now != null ? `, now ${fmt.money(now)}` : ''}`,
    }]),
    row('Owned', rows.map(owned)),
    row('Status', rows.map((r) => ({ node: statusLines(r, P, { lineup: false }) }))),
    // each forecast in its blue, the group's "xP" over the column, the total's beside it (ui.js xpNum; the user, 2026-10-22)
    grp(C.COPY.gridUnit, xpMark()),
    gws.map((x) => row(`GW${x}`, ids.map((id, i) => ({
      node: [xpNum(xpShown(ctx, id, x), 'span.v', null, false), h('span.o', null, opp(rows[i], x))],
      said: `GW${x} ${xpShown(ctx, id, x)}, ${oppSaid(rows[i], x)}`,
    })))),
    row(`Total, ${span(gws)}`, rows.map((r) => { const xs = gws.map((x) => xpAt(r, x)); return xs.some((v) => v != null) ? { node: xpNum(fmt.pts(xs.reduce((s, v) => s + (v ?? 0), 0))) } : DASH; }), '.tot'),
    later);
  // undefined while loading, null when none can be had
  const cards = [undefined, undefined];
  let view = statsView(ctx);
  const paint = () => {
    const past = cards.map((c) => (c === undefined ? null : c?.last_matches ?? []));
    const sums = past.map((p) => (p?.length ? pastSums(p) : null));
    const n = Math.max(0, ...past.map((p) => p?.length ?? 0)) || 6;
    const kids = [grp(`Last ${n} matches`),
      row('Points', sums.map((s) => (s ? String(s.pts) : DASH))),
      row('Minutes', sums.map((s) => (s ? `${s.mins}′` : DASH)))];
    // the stats: the buy's rows with the seller's figures beside his (the same position only: api/card.py stats.vs)
    const st = cards[0]?.stats, mine = st?.[view], theirs = st?.vs?.[view];
    if (mine && theirs && Object.values(mine.rows).some((r) => r.value != null)) {
      const [g0, g1] = cards[0].season_rounds ?? [];
      kids.push(grp(C.COPY.statsHead(g0, g1, mine.n, WORD[mine.pos]), segControl({
        opts: [['match', 'Match', 'Per match'], ['p90', 'Per 90', 'Per 90 minutes']], current: view, label: 'Stats per match or per 90 minutes', cls: '.small',
        onPick: (v) => { view = v; keepStatsView(ctx, v); paint(); },
      }), { view }));
      for (const [k, r] of Object.entries(mine.rows)) {
        const [lab, dp] = STAT[k] ?? [k, 1];
        const cell = (x, of) => ({
          node: [h('span.v', null, x?.value == null ? DASH : x.value.toFixed(dp)), x?.rank == null ? null : h('span.rk', null, fmt.ordinal(x.rank))],
          said: `${x?.value == null ? 'none' : x.value.toFixed(dp)}${x?.rank == null ? '' : `, ${fmt.ordinal(x.rank)} of ${of.n} ${WORD[of.pos] ?? 'players'}`}`,
        });
        kids.push(row(lab, [cell(r, mine), cell(theirs.rows[k], theirs)], '.st', { key: k, in: r.value ?? '', out: theirs.rows[k]?.value ?? '' }));
      }
      onStats?.();
    }
    fill(later, kids);
  };
  paint();
  let shown = false;  // on the page once: gone from it after, its requests stop asking (cardOf alive)
  const alive = () => !shown || box.isConnected;
  (globalThis.requestAnimationFrame ?? setTimeout)(() => { shown = box.isConnected; });
  cardOf(ctx, ids[0], ids[1], alive).then((c) => { cards[0] = c; }, () => { cards[0] = null; }).then(paint);
  cardOf(ctx, ids[1], null, alive).then((c) => { cards[1] = c; }, () => { cards[1] = null; }).then(paint);
  return box;
}

// ================================================================ When (the same move in each GW)

/**
 * The When line (the usability review, 2026-10-08: "Nothing answers 'why this week and not next'" and "There is no 'move
 * to next week'. It took 4 steps"), labelled "If made in" over a tile a GW, "GW6 +6.2 | GW7 +4.0 | GW8 +2.1 | GW9 +0.6"
 * (the first-use findings, #8 2026-10-21: "When GW8 +3.3 · 9 +3.7 …, each week vs keeping Kayode" read as a per-week
 * split): the same move (the same sale, the same buy) made in each GW of the plan, each against the sheet's own baseline
 * (ahead.whenOf). The tiles are Add a player's (wish.js: .ah-apills / .ah-ap, the chosen one .sel), a picker for timing;
 * the move's own week has its GW in ink (no word for it); a week where it can't be made is "—". B79 (johnson Part 4 §3;
 * the user, 2026-10-10): a tap chooses the week, as Add a player's pills do, and one button under the line moves the
 * transfer there, "Move it to GW7" (when.pick(gw): Ahead's moveTo, one edit with its toast and Undo, and the view on that
 * GW), then the sheet closes. The move's own week is chosen first: the transfer is there already, so its button waits
 * for another week. Each week's gain forecast points, blue with "xP" (ui.js xpGain; the user, 2026-10-22, after
 * v1.3.68: no green or grey verdict on a number, its sign its direction).
 * Under it, what its numbers count against (`vs`, a note: the sheet's own number is another measure).
 * when: {weeks: [{gw, ok, current, delta, label}], pick(gw) → bool, disabled, vs}. → {line, note, go (the button's row)}
 */
function whenLine(when, sheet) {
  let sel = when.weeks.find((w) => w.current && w.ok)?.gw ?? null;
  const items = when.weeks.map((w) => {
    // a week it can't be made in: read out in words, not "em dash"
    const unsaid = w.ok ? null : { 'aria-hidden': 'true' };
    const kids = [h('span.g', unsaid, `GW${w.gw}`),
      h('span.v.m-num.wy-wv', unsaid, w.ok ? (w.delta == null ? '' : xpGain(w.delta)) : '—')];
    if (w.ok) {
      return h('button.ah-ap.wy-wk', {
        type: 'button', class: { cur: w.current }, dataset: { gw: w.gw }, 'aria-pressed': 'false',
        'aria-label': w.current ? C.COPY.whenHere(w.gw, w.delta) : C.COPY.whenWeek(w.gw, w.delta),
        onClick: () => { sel = w.gw; paint(); },
      }, kids);
    }
    return h('span.ah-ap.bad.wy-wk.off', { dataset: { gw: w.gw } }, kids, h('span.sr-only', null, C.COPY.whenNone(w.gw)));
  });
  const line = h('div.wy-when', { role: 'group', 'aria-label': when.vs ? `${C.COPY.whenHead}: ${when.vs}` : C.COPY.whenHead },
    h('span.wy-wl', { 'aria-hidden': 'true' }, C.COPY.whenHead),
    h('div.ah-apills', null, items));
  const go = h('div.ah-btnrow.wy-go');
  // the chosen week pressed, and its button: none while it is your transfer's own week (nothing to move)
  function paint() {
    for (const b of line.querySelectorAll('button.wy-wk')) {
      const on = Number(b.dataset.gw) === sel;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('sel', on);
    }
    const w = when.weeks.find((x) => x.gw === sel && x.ok);
    const can = !!w && !w.current;
    go.hidden = !can;
    fill(go, can ? h('button', {
      type: 'button', disabled: !!when.disabled, 'aria-label': C.COPY.whenMove(w.gw, w.delta),
      onClick: () => { if (when.pick(w.gw) !== false) sheet.close(); },
    }, `${C.COPY.whenVerb} GW${w.gw}`) : null);
  }
  paint();
  const note = when.vs ? h('p.wy-wnote', { 'aria-hidden': 'true' }, when.vs) : null;
  return { line, note, go };
}

// ================================================================ run strip (§5.3: dots, or "Show runs" lines)

function runStrip(why, sheet) {
  const c = why.cmp;
  const n = why.noise;
  const winner = c.delta >= 0 ? why.a.label : why.b.label;
  const lead = c.lead ?? 0;
  const agree = `${C.COPY.agreement(lead, c.runs)} back ${winner}`;
  // B106: what a dot measures and what the band is, named; on GW A's scale when the gaps are put back on it (runGaps)
  const scale = runGaps(c) !== c.diffs ? ` on GW${why.A}'s scale` : '';
  const capDots = `Each dot is one forecast run: ${why.a.label} minus ${why.b.short}, ${span(c.gws)}, in points${scale}.${n > 0 ? ` Shaded: within ±${fmt.num(n, 2)} pts, ${C.COPY.chargeName}.` : ''}`;
  const capLines = `Each line is one forecast run: the running gain of ${why.a.label} over ${why.b.label}, ${span(c.gws)}.`;
  const box = h('div.m-well.wy-box');
  const caption = h('p.m-foot.wy-fn');
  let lines = false;
  const paint = () => {
    fill(box, lines ? linesSvg(c, n) : swarmSvg(c, n, agree));
    caption.textContent = lines ? capLines : capDots;
  };
  const multi = c.gws.length > 1;
  const btn = multi ? h('button.wy-tgl', {
    type: 'button', 'aria-pressed': 'false',
    onClick: () => {
      lines = !lines;
      btn.classList.toggle('on', lines);
      btn.setAttribute('aria-pressed', String(lines));
      btn.textContent = lines ? 'Show dots' : 'Show runs';
      paint();
      if (lines) sheet.setDetent('large');
    },
  }, 'Show runs') : null;
  paint();
  return h('div.m-sec', null, h('h3', null, h('span', null, 'Every forecast run'), btn),
    h('p.wy-agree', null, agree, h('span.m-foot', null, '. For information only: Forkcast plans on the average forecast.')),
    box, caption);
}

/** Each run's window gap put back on the anchor's scale (engine.compareRoads diffsRef: each week ×k_0/k_h), the shown
 *  gap without a scale by horizon: what the label and the noise floor (×k_0) read. */
const runGaps = (c) => c?.diffsRef ?? c?.diffs ?? [];

/** Each run's tone: 'pos' | 'neg' | 'mid' (inside the noise band), its gap (runGaps) against the noise floor: like with
 *  like, so a run never leaves the band for a week being further ahead. c: a compare result with runs. */
const runTones = (c, noise) => Array.from(runGaps(c), (v) => (v > noise ? 'pos' : v < -noise ? 'neg' : 'mid'));

/** One dot per run: a − b over the window, placed on the scale it is toned on (runGaps, runTones: B106, a dot's colour
 *  always matches its side of the band); the ±noise band reads "too close". */
function swarmSvg(c, noise, label) {
  const vals = [...runGaps(c)];
  const tones = runTones(c, noise);
  const w = 350, ht = 104, r = 4.3, cy = 56;
  const lo = Math.min(-noise * 2, ...vals), hi = Math.max(noise * 2, ...vals);
  const pad = (hi - lo) * 0.08 || 0.5;
  const x0 = lo - pad, x1 = hi + pad;
  const X = (v) => 10 + ((v - x0) / (x1 - x0)) * (w - 20);
  const placed = [];
  [...vals].map((v, i) => ({ v, i })).sort((p, q) => p.v - q.v).forEach((o) => {
    const x = X(o.v);
    let k = 0, y = cy;
    while (placed.some((p) => Math.hypot(p.x - x, p.y - y) < 2 * r + 0.8) && k < 40) { k++; y = cy + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * (r * 1.05); }
    placed.push({ x, y, v: o.v, i: o.i });
  });
  const step = x1 - x0 > 6 ? 2 : x1 - x0 > 2.5 ? 1 : 0.5;
  const ticks = [];
  for (let t = Math.ceil(x0 / step) * step; t <= x1; t += step) ticks.push(Number(t.toFixed(2)));
  return svg('svg', { class: 'wy-swarm', viewBox: `0 0 ${w} ${ht}`, width: '100%', role: 'img', 'aria-label': label },
    noise > 0 ? svg('rect', { class: 'band', x: X(-noise), y: 10, width: X(noise) - X(-noise), height: ht - 34, rx: 6 }) : null,
    svg('line', { class: 'zero', x1: X(0), x2: X(0), y1: 12, y2: ht - 24 }),
    ticks.map((t) => svg('text', { x: X(t), y: ht - 8, 'text-anchor': 'middle' }, `${t > 0 ? '+' : t < 0 ? '−' : ''}${Math.abs(t)}`)),
    placed.map((p, j) => svg('circle', { class: `dot ${tones[p.i]}`, style: { 'animation-delay': `${j * 20}ms` }, cx: p.x.toFixed(1), cy: p.y.toFixed(1), r })));
}

/** One cumulative line per run across the window (lines draw over 400 ms). */
function linesSvg(c, noise) {
  const w = 350, ht = 150;
  const all = c.cumRuns.flat();
  const lo = Math.min(-noise * 2, 0, ...all), hi = Math.max(noise * 2, 0, ...all);
  const pad = (hi - lo) * 0.1 || 0.5;
  const y = (v) => 14 + (1 - (v - lo + pad) / (hi - lo + 2 * pad)) * (ht - 34);
  const xs = c.gws.map((_, i) => 34 + i * ((w - 50) / Math.max(1, c.gws.length - 1)));
  const tones = runTones(c, noise);
  return svg('svg', { class: 'wy-swarm wy-lines', viewBox: `0 0 ${w} ${ht}`, width: '100%', role: 'img', 'aria-label': 'Cumulative gain per forecast run' },
    noise > 0 ? svg('rect', { class: 'band', x: 30, y: y(noise), width: w - 40, height: y(-noise) - y(noise), rx: 4 }) : null,
    svg('line', { class: 'zero', x1: 30, x2: w - 10, y1: y(0), y2: y(0) }),
    c.gws.map((g, i) => svg('text', { x: xs[i], y: ht - 6, 'text-anchor': 'middle' }, `GW${g}`)),
    svg('text', { x: 4, y: y(0) + 3 }, '0'),
    c.cumRuns.map((run, r) => svg('polyline', { class: `ln ${tones[r]}`, style: { 'animation-delay': `${r * 16}ms` }, points: run.map((v, i) => `${xs[i].toFixed(1)},${y(v).toFixed(1)}`).join(' ') })));
}
