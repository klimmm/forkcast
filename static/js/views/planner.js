// Planner (#/planner): load an FPL entry, set locks, bans, chips and solver settings, solve, and read
// the plan GW by GW; or run up to four scenario variants side by side.
//
// One source of truth: state.planner.values = {dest: value} in the flag widgets' value types (the
// solver's own units). The quick panel, the squad's lock/ban buttons, the pickers and the "All settings"
// drawer all edit it; the command preview, solves and scenarios read it. Other views edit it directly too
// (the players table's lock/ban shortcuts, marks.js), and onStore picks their changes up.
//
// URL: #/planner?entry=<id> loads that team; #/planner?job=<id> shows that run's result.

import * as api from '../api.js';
import {
  h, card, statTile, pitch, transferCard, table, flagControl, flagForm, playerPicker, jobRunner, toast,
  modal, confirm, segmented, fmt, icon, loading, empty, errorCard, field, pill, statusDot, jobStatusPill,
  chipName, copyText, POS, posName, flagLabel, fill, pick, plural, errText, readNum, entryId, entryTitle, callout,
  infoTip, humanise,
} from '../ui.js';
import { DEST, toks, findTok, applyMark } from '../marks.js';
import { committedCells, committedRows, cellsTable, spanText, noteTone } from './runs.js';
import { seasonLabel } from './fixtures.js';

// ---------------------------------------------------------------- constants

const QUICK = [
  ['Rounds & data', ['season', 'from_r', 'to', 'dir', 'w', 'horizon_w']],
  ['Transfers & bank', ['max_hits', 'hit_cost', 'ft', 'cash']],
  ['Mode & captaincy', ['fresh', 'no_cap', 'cap_top']],
];
const CHIP_ROUNDS = ['wc', 'fh', 'bb', 'tc'];
const CHIP_KEYS = [...CHIP_ROUNDS, 'plan', 'chip_auto', 'no_chips'];
const CHIP_MODES = [
  { key: 'manual', label: 'Manual rounds' }, { key: 'plan', label: 'Stored plan' },
  { key: 'auto', label: 'Auto (--chip-auto)' }, { key: 'none', label: 'No chips' },
];
// Whose squad and which players: a preset or scenario leaves these alone.
const KEEP = ['season', 'entry', 'team_state', 'must_have', 'exclude'];
// What a preview / rating run needs from the solve's settings (they act on --to; main.py:654-658).
const DATA_KEYS = ['season', 'dir', 'pool', 'seeds', 'w', 'horizon_w'];
const POS_SLOTS = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const XI_RANGE = { GK: [1, 1], DEF: [3, 5], MID: [2, 5], FWD: [1, 3] };
const MAX_VARIANTS = 4;
const MOVES_SHOWN = 5;
// The solver's objective terms (solve.py ConstraintBuilder.obj tags, recorded per anchor by tap/solve_tap.py
// as anchors[gw].objective = {tag: {gw: value}}), in display order: [label, what it is]. Only the XI and
// captain rows are the xP a plan reports; the others are rules' charges (−) and credits, in points too.
const OBJ_TERMS = {
  xi: ['Starting XI', 'Forecast points of the starting eleven (look-ahead rounds weighted by --horizon-w).'],
  cap: ['Captain', 'The armband: the captain\'s forecast once more (twice under a triple captain).'],
  bench: ['Bench, weighted', 'Bench forecasts, each slot weighted by its chance of coming on (--bn-w-slots); not in the reported xP.'],
  eo: ['Crowd ownership (EO)', 'Credit for starting players the top-100k cohort owns (--eo-w).'],
  own_cal: ['Crowd calibration', 'At rebuilds, the tilt toward the crowd\'s squad, paid on starters (--own-cal).'],
  cap_top: ['Window-captain premium', 'Premium toward buying the player who tops the forecast in most window rounds (--cap-top-w).'],
  cap_tie: ['Crowd captain tie-break', 'Bonus for captaining the poll\'s #1 pick at the anchor (--cap-tie-tau).'],
  ft_cost: ['Transfer charge', 'What each buy must beat: by default τ, the seeds\' noise, scaled by the rounds left to pay it back (--ft-cost).'],
  hit: ['Hits', 'Hits priced in the objective (--hit-cost); the points a hit costs when scored (--hit-cost-actual) are not part of it.'],
  keep_best: ['Selling owned players (WC)', 'A wildcard\'s price for selling owned players, scaled by their forecast (--keep-best-wc-price).'],
  ft_value: ['Banked free transfers', 'Credit for free transfers carried out of the window (--ft-value).'],
  cash: ['Money in the bank', 'Value of the bank left after the round (--cash-w).'],
  over_team: ['Over the club limit', 'Charge per player above 3 from one club, in an imported squad that has more.'],
  ft_short: ['FT shortfall', 'Slack after a planned free hit: a huge penalty, 0 unless the FT count breaks.'],
};
const MOVE_CHARGES = ['ft_cost', 'hit', 'keep_best'];  // what a GW's own moves pay in that GW's objective


// ---------------------------------------------------------------- small helpers

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const sum = (xs) => xs.reduce((s, x) => s + (Number(x) || 0), 0);
const omit = (o, keys) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !keys.includes(k)));
const canon = (o) => JSON.stringify(Object.keys(o || {}).sort().map((k) => [k, o[k]]));
const sortedKeys = (o) => Object.keys(o || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);


/** A variant's values: base, then overrides (null = back to the solver default). */
function mergeValues(base, overrides) {
  const v = { ...base };
  for (const [k, x] of Object.entries(overrides || {})) {
    if (x === null || x === undefined) delete v[k];
    else v[k] = x;
  }
  return v;
}

const chipMode = (v) => (v.chip_auto ? 'auto' : v.no_chips ? 'none' : v.plan ? 'plan' : 'manual');
const hitCostOf = (res) => num(res?.meta?.args?.hit_cost_actual) ?? 4;
const xpSum = (p) => (Array.isArray(p?.xp) ? sum(p.xp) : null);

// ---------------------------------------------------------------- result model (solve_tap.py document)

/**
 * The run as rows {gw, t: TeamJSON, kind, anchor}: committed rounds from --from-r (earlier ones are the
 * --entry history), then the last anchor's window plan beyond them (as jobs.py timeline(), from --from-r).
 */
function timelineOf(res) {
  const committed = res?.committed || {};
  const gws = sortedKeys(committed).filter((g) => committed[g]?.team);
  const from = num(res?.meta?.from) ?? gws[0];
  const rows = gws.filter((g) => g >= from).map((gw) => ({ gw, t: committed[gw].team, kind: 'committed' }));
  const anchors = res?.anchors || {};
  const last = sortedKeys(anchors).at(-1);
  const plan = last == null ? {} : anchors[last]?.plan || {};
  for (const gw of sortedKeys(plan)) if (!committed[gw]) rows.push({ gw, t: plan[gw], kind: 'plan', anchor: last });
  return rows;
}

/** The squad a row's moves start from: the previous row, else the committed round before it. */
const prevTeam = (res, rows, i) => (i > 0 ? rows[i - 1].t : res?.committed?.[rows[i].gw - 1]?.team);

const playerIn = (t, prev, id) => t?.players?.[id] ?? prev?.players?.[id] ?? { id, name: `#${id}` };

/** OUT → IN pairs, same position first (dearest first), leftovers alone. */
function pairMoves(t, prev) {
  const P = (id) => playerIn(t, prev, id);
  const rank = (p) => { const i = POS.indexOf(posName(p.pos)); return i < 0 ? 9 : i; };  // names now, ints in old results
  const order = (ids) => (ids || []).map(P).sort((a, b) =>
    rank(a) - rank(b) || (num(b.price) ?? 0) - (num(a.price) ?? 0));
  const ins = order(t?.in);
  const pairs = order(t?.out).map((o) => {
    const i = ins.findIndex((p) => posName(p.pos) === posName(o.pos));
    return [o, i >= 0 ? ins.splice(i, 1)[0] : null];
  });
  return [...pairs, ...ins.map((p) => [null, p])];
}

const rowTag = (r, meta) => (r.kind === 'plan' ? 'Plan' : r.t.played ? 'Played' : r.gw === meta?.next_gw ? 'Next' : 'Commit');

/** No squad to start from (no team loaded): all 15 bought from the budget, not transfers from a held one. */
const isBuild = (t) => !t?.out?.length && (t?.in?.length || 0) >= 15;

function movesList(t, prev, limit = MOVES_SHOWN) {
  if (isBuild(t)) return h('ul.pl-moves', null, h('li', null, 'New squad of 15'));
  const pairs = pairMoves(t, prev);
  if (!pairs.length) return h('ul.pl-moves', null, h('li.muted', null, 'Roll (no transfer)'));
  return h('ul.pl-moves', null,
    pairs.slice(0, limit).map(([o, i]) => h('li', null,
      h('span.loss.truncate', null, o?.name ?? '—'), h('span.pl-arrow', { 'aria-label': 'replaced by' }, '→'),
      h('span.gain.truncate', null, i?.name ?? '—'))),
    pairs.length > limit ? h('li.muted', null, `+${pairs.length - limit} more`) : null);
}

// ---------------------------------------------------------------- result cards (pure)

/**
 * "Why": the anchor's solved objective by term for its GW and the whole window (TransferLab's Gain / Needs /
 * Net, generalised), plus gain vs charge for this GW's moves. Results from before solve_tap recorded the
 * objective (or with no window captured, --fresh --jobs N) get a one-line note instead.
 */
function whyBlock(res, gw, t, moved) {
  const an = res.anchors?.[gw];
  const obj = an?.objective;
  if (!obj || !Object.keys(obj).length) {
    return h('p.small.muted.pl-whyrow', null, 'No objective breakdown in this result (older runs did not record it): solve again to see why.');
  }
  const win = an.window?.length ? an.window : [gw];
  const span = spanText({ from: win[0], to: win.at(-1) });
  const multi = win.length > 1;
  const tags = [...Object.keys(OBJ_TERMS).filter((k) => obj[k]), ...Object.keys(obj).filter((k) => !OBJ_TERMS[k])];
  const rows = tags.map((tag) => ({
    tag, label: OBJ_TERMS[tag]?.[0] ?? humanise(tag), help: OBJ_TERMS[tag]?.[1] ?? 'A rule\'s own term.',
    now: num(obj[tag][gw]) ?? 0, win: sum(Object.values(obj[tag])),
  }));
  const total = { now: sum(rows.map((r) => r.now)), win: sum(rows.map((r) => r.win)) };
  const val = (v) => h('td.num', { class: { loss: v < 0 } }, fmt.num(v, 2));
  const tbl = h('div.tbl-scroll', null, h('table.tbl.dense.pl-obj', null,
    h('caption.sr-only', null, `Objective by term, ${fmt.gw(gw)}${multi ? ` and ${span}` : ''}`),
    h('thead', null, h('tr', null, h('th', null, h('span.th-txt', null, 'Term')),
      h('th.num', null, h('span.th-txt', null, fmt.gw(gw))), multi ? h('th.num', null, h('span.th-txt', null, span)) : null)),
    h('tbody', null, rows.map((r) => h('tr', { title: r.help }, h('td', null, r.label), val(r.now), multi ? val(r.win) : null)),
      h('tr.pl-total', null, h('td', null, 'Objective'), val(total.now), multi ? val(total.win) : null))));
  // Gain: this GW's moves against holding, best XI only, over the window (Team.d_ws); needs: their charge here.
  const gain = moved ? num(t.d_ws) : null;
  const needs = -sum(rows.filter((r) => MOVE_CHARGES.includes(r.tag)).map((r) => r.now));
  const net = gain == null ? null : gain - needs;
  const relaxed = num(res.meta?.int_squad_rounds);
  const tip = infoTip('About this breakdown',
    h('p', null, `The solver picks the plan with the highest objective over ${span}: forecast points plus each rule's charges and credits, all in points. These are the chosen plan's terms.`),
    gain != null ? h('p', null, `Gain: how much this GW's moves raise the best XI's forecast over ${span} against holding (no captain or bench). Needs: what the objective charges those moves in ${fmt.gw(gw)}. Net is a guide: the solver weighs the whole objective, later moves included.`) : null,
    multi && relaxed != null && relaxed < win.length ? h('p', null, `Rounds after the first ${plural(relaxed, 'round')} are solved as a relaxation, so their terms can be fractional.`) : null,
    h('dl.pl-obj-terms', null, rows.map((r) => [h('dt', null, r.label), h('dd', null, r.help)])));
  return h('section.pl-whyrow', null,
    h('div.pl-whyhead', null, h('h3.pl-h3', null, 'Why'), tip,
      gain != null ? h('div.row.tight.pl-gnn', null,
        pill(`Gain ${fmt.signed(gain, 2)}`, 'gain', { title: `Best-XI xP over ${span}, vs holding` }),
        pill(`Needs ${fmt.num(needs, 2)}`, '', { title: `This GW's transfer charges in the objective` }),
        pill(`Net ${fmt.signed(net, 2)}`, net >= 0 ? 'gain' : 'loss', { title: 'Gain minus needs' })) : null),
    tbl);
}

function recommendationCard(res, rows) {
  const meta = res.meta || {};
  const i = rows.findIndex((r) => r.kind === 'committed' && r.gw === num(meta.to));
  const at = i >= 0 ? i : rows.map((r) => r.kind).lastIndexOf('committed');
  if (at < 0) return null;
  const { gw, t } = rows[at];
  const prev = prevTeam(res, rows, at);
  const pairs = pairMoves(t, prev);
  const n = Math.max(t.in?.length || 0, t.out?.length || 0);
  const chip = chipName(t.chip);
  const win = res.anchors?.[gw]?.window || [gw];
  const end = win.at(-1);
  const hitPts = hitCostOf(res) * (t.hits || 0);
  const nextFt = rows[at + 1]?.t?.ft_avail;
  const build = isBuild(t);
  const head = build ? `Best 15 for ${fmt.gw(gw)}${chip ? ` · ${chip}` : ''}`
    : chip ? `Play ${chip}${n ? ` · ${plural(n, 'move')}` : ''}` : n ? `Make ${plural(n, 'transfer')} now` : 'Roll the transfer';
  const why = build
    ? [`A squad picked from scratch: ${fmt.pts(t.pred)} xP this GW for ${fmt.money(t.team_value)}. The lineup is below.`]
    : n
      ? [`Plan gains ${fmt.signed(t.d_ws)} xPts over ${spanText({ from: gw, to: end })} vs holding`, ` (${fmt.signed(t.d_h0)} this GW, best-XI forecast before hits)`]
      : [`No move beats holding this GW`, nextFt != null ? `; ${plural(nextFt, 'free transfer')} next GW` : ''];
  const cards = pairs.map(([o, p]) => transferCard({
    out: o && { ...o, xp_value: xpSum(o) },
    in: p && { ...p, xp_value: xpSum(p) },
    gain: o && p ? xpSum(p) - xpSum(o) : null,
    cost: p ? num(p.price) : null,
    note: t.xp_gws?.length ? `xP over GW${t.xp_gws[0]}–${t.xp_gws.at(-1)}` : null,
  }));
  const shown = h('div.pl-xfers', null, cards.slice(0, MOVES_SHOWN));
  const more = cards.length > MOVES_SHOWN
    ? h('button.btn.sm.ghost', { type: 'button', onClick: (e) => { shown.append(...cards.slice(MOVES_SHOWN)); e.currentTarget.remove(); } },
      `Show all ${cards.length} moves`)
    : null;
  const nm = (id) => playerIn(t, prev, id).name;
  return card({
    title: `${fmt.gw(gw)} recommendation`, className: 'pl-rec',
    body: [
      h('p.pl-headline', null, head),
      h('p.pl-why', null, ...why),
      h('div.row.pl-facts', null,
        build ? null : pill(`FT ${t.ft_used ?? 0} of ${t.ft_avail ?? 0} used`),
        t.hits ? pill(`${plural(t.hits, 'hit')} · −${hitPts} pts`, 'loss') : pill('No hits'),
        pill(`Bank ${fmt.money(t.bank)}`, t.bank < 0 ? 'loss' : ''),
        pill(`C ${nm(t.captain)} · V ${nm(t.vice)}`, 'info'),
        chip ? h('span.chip-badge', { class: t.chip }, chip) : null),
      t.played ? callout('info', `GW${gw} has been played: this is the move the solver would have made.`) : null,
      t.bank < 0 ? callout('loss', 'The bank goes negative here: this squad is not affordable at current prices.') : null,
      cards.length && !build ? [shown, more] : null,
      whyBlock(res, gw, t, n > 0 && !build),
    ],
  });
}

function timelineCard(res, rows, onSelect) {
  const meta = res.meta || {};
  const hit = hitCostOf(res);
  const stat = (k, v, cls) => h('div', { class: cls }, h('dt', null, k), h('dd.num', null, v));
  const cols = rows.map((r, i) => {
    const { t } = r;
    const prev = prevTeam(res, rows, i);
    return h('button.pl-tl-col', {
      type: 'button', dataset: { gw: r.gw }, class: { plan: r.kind === 'plan', played: !!t.played },
      'aria-pressed': 'false', 'aria-label': `${fmt.gw(r.gw)}: show the lineup`, onClick: () => onSelect(r.gw),
    },
    h('div.pl-tl-head', null, h('strong', null, fmt.gw(r.gw)), h('span.pl-tl-tag', null, rowTag(r, meta)),
      t.chip ? h('span.chip-badge', { class: t.chip }, chipName(t.chip)) : null),
    movesList(t, prev, 4),
    h('dl.pl-tl-stats', null,
      stat('xP', fmt.pts(t.pred)),
      stat('Pts', t.played ? fmt.int(t.act) : '—'),
      stat('FT', `${t.ft_used ?? 0}/${t.ft_avail ?? 0}`),
      stat('Hits', t.hits ? `−${hit * t.hits}` : '0', t.hits ? 'loss' : null),
      stat('Bank', fmt.money(t.bank), ['wide', t.bank < 0 && 'loss']),
      stat('C', playerIn(t, prev, t.captain).name, 'wide')));
  });
  const strip = h('div.pl-timeline', { role: 'group', 'aria-label': 'Plan by gameweek' }, cols);
  const el = card({
    title: 'Plan timeline',
    sub: 'Committed rounds, then the rest of the last window as planned. Click a gameweek for its lineup.',
    body: strip,
  });
  el.select = (gw) => {
    for (const c of cols) c.setAttribute('aria-pressed', String(Number(c.dataset.gw) === gw));
  };
  return el;
}

function pitchCard(res, rows, gw) {
  const i = rows.findIndex((r) => r.gw === gw);
  if (i < 0) return card({ title: 'Lineup', body: empty('No lineup for this gameweek.') });
  const { t, kind, anchor } = rows[i];
  const players = Object.fromEntries(Object.entries(t.players || {}).map(([id, p]) => [id, { ...p, xp_value: p.pred }]));
  const sub = [
    kind === 'plan' ? `Planned at GW${anchor}` : t.played ? `Played · scored ${fmt.int(t.act)}` : 'Committed',
    `${fmt.pts(t.pred)} xP`,
    t.hits ? `${plural(t.hits, 'hit')}` : null,
  ].filter(Boolean).join(' · ');
  return card({
    title: `${fmt.gw(gw)} lineup`, sub, className: 'pl-pitch',
    body: [
      pitch({ xi: t.xi, bench: t.bench, captain: t.captain, vice: t.vice, players, chip: t.chip, newIds: t.in,
        title: `${fmt.gw(gw)} · ${fmt.pts(t.pred)}` }),
      kind === 'plan' ? h('p.small.muted', null, `Plan rows reuse GW${anchor}'s prices and minutes; only xP, moves, XI, captain, chip, bank and FTs are forecasts.`) : null,
    ],
  });
}

function historyCard(res, jobId) {
  const { cells, totals: tot } = committedCells(res);
  if (cells.length < 2) return null;
  const anyPlayed = committedRows(res).some((r) => r._played);
  return card({
    title: 'Committed rounds',
    sub: 'The solver\'s results table; realised columns are blank (—) for rounds not played yet.',
    body: [
      h('div.pl-tiles', null,
        statTile({ label: 'xP (committed)', value: fmt.pts(tot.pred) }),
        anyPlayed ? statTile({ label: 'Points scored', value: fmt.int(tot.act) }) : null,
        statTile({ label: 'Hits', value: fmt.int(tot.hits), tone: tot.hits ? 'loss' : null })),
      cellsTable(res, { csv: `plan_${jobId || 'run'}.csv` }),
    ],
  });
}

function warningsCard(res, onExact) {
  const ws = res.warnings || [];
  if (!ws.length) return null;
  // Plan rows past the integer rounds are a rounded LP relaxation and can overspend (see solve_tap warnings);
  // all-integer windows give an exact plan at a few seconds' extra cost.
  const m = res.meta || {};
  const overspent = Object.values(res.anchors || {}).some((a) => Object.values(a.plan || {}).some((t) => t.bank < 0));
  const exactN = m.window_len;
  const relaxed = overspent && onExact && exactN && m.int_squad_rounds != null && m.int_squad_rounds < exactN;
  return card({
    title: 'Notes from the run',
    body: h('div.stack.tight', null,
      ws.map((w) => callout(noteTone(w), w)),
      relaxed ? h('div', null, h('button.btn.sm', { type: 'button', onClick: () => onExact(exactN) },
        icon('play', { size: 14 }), `Re-solve with an exact plan (--int-rounds ${exactN})`)) : null),
  });
}

/** Scenario comparison: GW rows with each variant's moves / captain / chip / xP, then window totals. */
function scenarioTable(items) {
  const tls = items.map(({ res }) => {
    const rows = timelineOf(res);
    return new Map(rows.map((r, i) => [r.gw, { ...r, prev: prevTeam(res, rows, i) }]));
  });
  const gws = [...new Set(tls.flatMap((m) => [...m.keys()]))].sort((a, b) => a - b);
  const common = gws.filter((g) => tls.every((m) => m.has(g)));
  const best = (vals) => {
    const xs = vals.filter(Number.isFinite);
    return xs.length > 1 && Math.max(...xs) !== Math.min(...xs) ? Math.max(...xs) : null;
  };
  const rows = gws.map((gw) => {
    const cells = tls.map((m) => m.get(gw));
    return { kind: 'gw', label: fmt.gw(gw), cells, top: best(cells.map((r) => num(r?.t?.pred) ?? NaN)) };
  });
  if (common.length) {
    const xp = tls.map((m) => sum(common.map((g) => m.get(g).t.pred)));
    const hits = tls.map((m) => sum(common.map((g) => m.get(g).t.hits)));
    const net = xp.map((x, i) => x - hits[i] * hitCostOf(items[i].res));
    const span = spanText({ from: common[0], to: common.at(-1) });
    rows.push(
      { kind: 'total', label: `xP ${span}`, vals: xp, top: best(xp), f: (v) => fmt.pts(v) },
      { kind: 'total', label: 'Hits', vals: hits, top: null, f: (v, i) => (v ? `${v} (−${v * hitCostOf(items[i].res)})` : '0') },
      { kind: 'total', label: `Net xP ${span}`, vals: net, top: best(net), f: (v) => fmt.pts(v) });
  }
  const cellView = (r, top) => {
    if (!r) return h('span.muted', null, '—');
    const { t } = r;
    return h('div.pl-sc-cell', null,
      movesList(t, r.prev, 3),
      h('div.pl-sc-meta', null,
        h('span.truncate', null, `C ${playerIn(t, r.prev, t.captain).name}`),
        t.chip ? h('span.chip-badge', { class: t.chip }, chipName(t.chip)) : null,
        h('span.num.pl-sc-xp', { class: { best: top != null && num(t.pred) === top } }, fmt.pts(t.pred))));
  };
  const cellText = (r) => {
    if (!r) return '';
    const mv = pairMoves(r.t, r.prev).map(([o, i]) => `${o?.name ?? '-'}>${i?.name ?? '-'}`).join('; ') || 'roll';
    return `${mv} | C ${playerIn(r.t, r.prev, r.t.captain).name}${r.t.chip ? ` | ${r.t.chip}` : ''} | ${fmt.pts(r.t.pred)}`;
  };
  const columns = [
    { key: 'label', label: 'GW', sort: false, render: (r) => (r.kind === 'total' ? h('strong', null, r.label) : r.label), csv: (r) => r.label },
    ...items.map((it, i) => ({
      key: `v${i}`, label: it.name, sort: false, className: 'pl-sc-col',
      render: (r) => (r.kind === 'gw' ? cellView(r.cells[i], r.top)
        : h('span.num', { class: { best: r.top != null && r.vals[i] === r.top } }, r.f(r.vals[i], i))),
      csv: (r) => (r.kind === 'gw' ? cellText(r.cells[i]) : r.vals[i]),
    })),
  ];
  return table({ columns, rows, csv: 'scenarios.csv', stickyFirst: true, rowClass: (r) => (r.kind === 'total' ? 'pl-total' : null), caption: 'Scenario comparison' });
}

// ---------------------------------------------------------------- the view

class Planner {
  constructor(el, ctx) {
    this.el = el;
    this.ctx = ctx;
    this.store = ctx.state;
    this.controls = new Map();   // dest → Set of flagControls showing it
    this.playerLists = new Map(); // season → Promise<PlayerRow[]>
    this.entry = null;
    this.scen = new Map();        // variant id → {id, job, res, error}
    this.inflight = new Set();    // once() keys of launches still being created
    this.abort = new AbortController();
    this.unsub = [];
    this.argvSeq = 0;
    this.entrySeq = 0;
    this.jobSeq = 0;
  }

  get st() { return this.store.get('planner', {}) || {}; }
  get variants() { return this.st.scenarios || []; }

  save(patch) {
    this.writing = true;
    try { this.store.update('planner', patch); } finally { this.writing = false; }
  }

  flag(dest) { return this.byDest.get(dest); }
  season() { return num(this.values.season) ?? num(this.flag('season')?.default) ?? num(this.meta?.season); }
  clean(v) { return Object.fromEntries(Object.entries(v || {}).filter(([k, x]) => this.byDest.has(k) && x !== undefined && x !== null)); }

  /**
   * Every player of the season (all=1: the unforecast ones too, e.g. long-term injured in a real squad),
   * for the pickers and the squad editor. The row set does not depend on the pool, and no picker shows xP.
   */
  players(season = this.season()) {
    if (!this.playerLists.has(season)) {
      this.playerLists.set(season, api.getPlayers({ season, all: true }).then((d) => d?.players || []).catch((e) => {
        this.playerLists.delete(season);
        console.warn('players unavailable', e);
        return [];
      }));
    }
    return this.playerLists.get(season);
  }

  // ---- lifecycle

  async init() {
    this.el.classList.add('planner');
    this.el.append(loading('Loading solver settings…'));
    const [fl, meta] = await Promise.all([api.getFlags(), api.getMeta().catch(() => null)]);
    // Run-mode switches (--preview, --rate-team: flag.branch) make main.py stop being a solve: the
    // Preview / Rate buttons and the Preview tab run those. Leaving them out of byDest drops them from
    // saved values, presets and scenario overrides too (clean()).
    this.flags = (fl?.flags || []).filter((f) => !f.branch);
    this.groups = fl?.groups || [];
    this.presets = fl?.presets || [];
    this.byDest = new Map(this.flags.map((f) => [f.dest, f]));
    this.presetSeason = num(this.flag('season')?.default);  // /api/flags resolves @next_gw for the default season
    this.meta = meta;
    const st = this.st;
    this.values = this.clean(st.values);
    this.build();
    this.commit(null);
    this.unsub.push(this.store.subscribe('planner', (next) => this.onStore(next)));

    const p = this.ctx.params;
    const entry = p.entry || this.values.entry || st.entry;
    if (entry) this.loadEntry(entry, { apply: !!p.entry && String(p.entry) !== String(this.values.entry ?? '') });
    const job = p.job || st.lastJob;
    if (job) this.showJob(job, { fromUrl: !!p.job });
    this.resumeScenarios();
    this.ready = true;
  }

  destroy() {
    this.abort.abort();
    this.scenAbort?.abort();
    clearTimeout(this.argvTimer);
    for (const f of this.unsub) f();
  }

  // ---- values: the single source of truth

  setValue(dest, v, source) {
    if (dest === 'from_r') this.save({ fromTouched: v !== undefined });
    this.patch({ [dest]: v }, { source });
  }

  patch(obj, opts = {}) {
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) delete this.values[k];
      else this.values[k] = v;
    }
    this.commit(Object.keys(obj), opts);
  }

  replaceValues(next, changed = null) {
    this.values = this.clean(next);
    this.commit(changed);
  }

  commit(changed, { source, persist = true } = {}) {
    if (persist) this.save({ values: { ...this.values } });
    for (const [dest, set] of this.controls) {
      if (changed && !changed.includes(dest)) continue;
      for (const c of set) {
        if (!c.isConnected) set.delete(c);
        else if (c !== source) c.setValue(this.values[dest]);
      }
    }
    const touched = (...k) => !changed || k.some((x) => changed.includes(x));
    if (touched(...CHIP_KEYS, 'season', 'from_r', 'entry', 'team_state')) this.renderChips();
    if (touched('entry', 'team_state', 'from_r', 'season')) this.renderEntryHint();
    if (touched('must_have', 'exclude')) this.paintMarks();
    if (this.squadSeason !== this.season()) this.renderSquad();  // the lock / ban pickers list that season's players
    if (touched('season')) {
      this.loadRecent();
      const id = this.entry?.entry_id ?? this.values.entry;
      if (this.ready && id && this.entry?.season !== this.season()) this.loadEntry(id, { apply: true });
      if (this.presetSeason !== this.season()) this.reloadPresets();
    }
    this.renderPresetNote();
    this.queueArgv();
  }

  onStore(next) {
    if (this.writing) return;
    const nv = this.clean(next?.values);
    if (canon(nv) !== canon(this.values)) {  // another tab, or a view that edits values directly
      this.values = nv;
      this.commit(null, { persist: false });
    }
  }

  toggleMark(kind, id) {
    const v = applyMark(this.values, kind, id, !findTok(toks(this.values[DEST[kind]]), id));
    this.patch({ must_have: v.must_have, exclude: v.exclude });  // undefined = cleared
  }

  /** A flagControl bound to values[dest]; every control of a dest is kept in step by commit(). */
  ctl(dest, flag = this.flag(dest)) {
    if (!flag) return null;
    const c = flagControl(flag, this.values[dest], (v) => this.setValue(dest, v, c), { players: this.players(), meta: this.meta });
    if (!this.controls.has(dest)) this.controls.set(dest, new Set());
    this.controls.get(dest).add(c);
    return c;
  }

  // ---- layout

  build() {
    this.entryInput = h('input.input.mono.pl-entry-input', {
      type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: 'FPL team ID, e.g. 353468',
      'aria-label': 'FPL team ID', value: this.values.entry || this.st.entry || '',
    });
    this.recentEl = h('div.pl-recent');
    this.entryHint = h('div.pl-entry-hint');
    const entryCard = card({
      title: 'Your FPL team', className: 'pl-entry',
      sub: 'Start from your real squad, bank, free transfers and chips.',
      body: [
        h('form.row.tight', { onSubmit: (e) => { e.preventDefault(); this.loadEntry(this.entryInput.value, { apply: true }); } },
          this.entryInput, h('button.btn.primary', { type: 'submit' }, 'Load team')),
        h('p.small.muted', null, 'The ID is the number in your FPL points-page address (…/entry/', h('b', null, 'ID'), '/event/…).'),
        this.recentEl, this.entryHint,
      ],
    });
    this.managerSlot = h('div.pl-slot');
    this.squadSlot = h('div.pl-slot');
    this.resultSlot = h('div.stack.pl-result');
    this.scenSlot = h('div.pl-slot');
    fill(this.el, h('div.pl-layout', null,
      h('aside.stack.pl-side', null, entryCard, this.managerSlot, this.squadSlot),
      h('div.stack.pl-main', null, this.buildSettings(), this.buildRun(), this.resultSlot, this.scenSlot)));
    this.renderSquad();
    this.renderPresets();
    this.renderScenarios();
  }

  buildSettings() {
    this.presetSel = h('select.select.pl-preset', { 'aria-label': 'Preset', onChange: () => this.applyPreset(this.presetSel.value) });
    this.delBtn = h('button.icon-btn', { type: 'button', title: 'Delete this saved preset', 'aria-label': 'Delete preset', onClick: () => this.deletePreset() }, icon('trash', { size: 16 }));
    this.presetNote = h('div.pl-preset-note');
    this.chipSeg = segmented({ items: CHIP_MODES, value: chipMode(this.values), label: 'Chip mode', onChange: (m) => this.setChipMode(m) });
    this.chipBody = h('div.stack.tight');    // re-rendered on a mode change only (renderChips)
    this.chipChecks = h('div.stack.tight');  // the wildcard shortcut and the chips-played checks, on every change
    this.chipPanel = h('div.pl-chip-panel.stack.tight', null, this.chipBody, this.chipChecks);
    const sections = QUICK.map(([title, dests]) => h('section.pl-qs', null,
      h('h3.pl-h3', null, title), h('div.flag-grid', null, dests.map((d) => this.ctl(d)))));
    return card({
      title: 'Solver settings', className: 'pl-settings',
      sub: 'Quick settings; every other flag is under All settings. Nothing runs until you press Solve.',
      actions: [
        this.presetSel, this.delBtn,
        h('button.btn.sm', { type: 'button', onClick: () => this.savePresetDialog() }, icon('plus', { size: 14 }), 'Save as…'),
        h('button.btn.sm', { type: 'button', onClick: () => this.openDrawer() }, 'All settings', h('span.badge', null, this.flags.length)),
      ],
      body: [
        this.presetNote, ...sections,
        h('section.pl-qs', null, h('h3.pl-h3', null, 'Chips'), this.chipSeg, this.chipPanel),
      ],
    });
  }

  buildRun() {
    this.cmdEl = h('code.mono.pl-cmd-text', null, '…');
    this.cmdMsgs = h('div.stack.tight.pl-cmd-msgs');
    this.solveBtn = h('button.btn.primary.lg', { type: 'button', onClick: () => this.solve() }, icon('play', { size: 16 }), 'Solve');
    return card({
      title: 'Run', className: 'pl-run',
      body: [
        h('div.pl-cmd', null, this.cmdEl,
          h('button.icon-btn', { type: 'button', title: 'Copy command', 'aria-label': 'Copy command', onClick: () => copyText(this.argv?.cmd || this.cmdEl.textContent) }, icon('copy', { size: 15 }))),
        this.cmdMsgs,
        h('div.row', null, this.solveBtn,
          h('button.btn', { type: 'button', onClick: () => this.openScenarios() }, icon('compare', { size: 15 }), 'Scenarios…'),
          h('span.spacer'),
          h('span.small.muted', null, 'Runs in the background: you can leave this page and come back.')),
      ],
    });
  }

  // ---- command preview

  queueArgv() {
    clearTimeout(this.argvTimer);
    this.argvTimer = setTimeout(() => this.refreshArgv(), 250);
  }

  async refreshArgv() {
    const seq = ++this.argvSeq;
    let d;
    try {
      d = await api.buildArgv(this.values);
    } catch (e) {
      d = { cmd: '', errors: [e.message], warnings: [] };
    }
    if (seq !== this.argvSeq || !this.cmdEl.isConnected) return;
    this.argv = d;
    this.cmdEl.textContent = d.cmd || '';
    fill(this.cmdMsgs, ...(d.errors || []).map((m) => callout('loss', m)), ...(d.warnings || []).map((m) => callout('warn', m)));
    this.solveBtn.disabled = !!d.errors?.length;
    this.solveBtn.title = d.errors?.length ? 'Fix the errors above first' : '';
  }

  // ---- entry

  async loadRecent() {
    const season = this.season();
    let list = [];
    try {
      list = await api.getRecentEntries({ season });
    } catch (e) {
      if (e.status !== 404) console.warn('recent entries unavailable', e);
    }
    if (season !== this.season()) return;
    const items = (Array.isArray(list) ? list : []).slice(0, 6);
    fill(this.recentEl, ...(items.length ? [h('div.small.muted', null, 'Recent teams'),
      h('div.pl-recent-list', null, items.map((r) => h('button.pl-recent-item', {
        type: 'button', title: `Load: ${entryTitle(r)}`, onClick: () => this.loadEntry(r.entry_id, { apply: true }),
      }, h('span.strong.truncate', null, r.team_name || `Team ${r.entry_id}`),
      h('span.small.muted.truncate', null, [r.manager, r.overall_rank ? `OR ${fmt.compact(r.overall_rank)}` : null, `#${r.entry_id}`].filter(Boolean).join(' · ')))))] : []));
  }

  async loadEntry(raw, { apply = false, refresh = false } = {}) {
    const id = entryId(raw);
    if (!id) {
      toast('An FPL team ID is digits only: the number in your points-page address.', 'warn');
      return;
    }
    this.entryInput.value = id;
    const seq = ++this.entrySeq;
    fill(this.managerSlot, card({ title: `Team ${id}`, body: loading(refresh ? 'Fetching from FPL…' : 'Loading your team…') }));
    let e;
    try {
      e = await api.getEntry(id, { season: this.season(), pool: this.values.dir || undefined, refresh });
    } catch (err) {
      if (seq !== this.entrySeq) return;
      this.entry = null;
      fill(this.managerSlot, errorCard(err, { title: `Team ${id} could not be loaded`, retry: () => this.loadEntry(id, { apply, refresh }) }));
      this.renderSquad();
      return;
    }
    if (seq !== this.entrySeq) return;
    this.entry = e;
    this.store.set('lastEntry', id);
    this.save({ entry: id });
    if (apply) {
      const p = { entry: id };
      if (this.values.team_state) { p.team_state = undefined; this.save({ manual: null }); }
      // A bare --entry run replays the season from GW1: plan the next deadline unless the user chose a round.
      if (!this.st.fromTouched) p.from_r = e.gw;
      this.patch(p);
      this.ctx.setParams({ ...this.ctx.params, entry: id });
    }
    this.renderManager();
    this.renderSquad();
    this.renderEntryHint();
    this.renderChips();
  }

  clearEntry() {
    this.entrySeq++;
    this.entry = null;
    this.entryInput.value = '';
    this.save({ entry: undefined, manual: null });
    this.patch({ entry: undefined, team_state: undefined, ...(this.st.fromTouched ? {} : { from_r: undefined }) });
    const { entry, ...rest } = this.ctx.params;
    this.ctx.setParams(rest);
    this.renderManager();
    this.renderSquad();
    this.renderChips();
  }

  renderEntryHint() {
    const v = this.values;
    const next = this.entry?.gw ?? num(this.meta?.next_gw);
    const from = num(v.from_r);
    const planNext = next ? h('button.btn.sm', {
      type: 'button', onClick: () => { this.save({ fromTouched: false }); this.patch({ from_r: next }); },
    }, `Plan GW${next} only`) : null;
    let body;
    if (v.team_state) body = callout('info', `Starting from your edited squad (--team-state); the plan starts at GW${from ?? '?'}.`);
    else if (v.entry && next && from > next) body = callout('warn', `GW${from} is past the next deadline (GW${next}): FPL has no squad for it yet, so a team run can start at GW${next} at the latest. `, planNext);
    else if (v.entry && from > 1) body = callout('gain', `Planning from GW${from}: the solver starts from this squad, bank and free transfers (--entry ${v.entry} --from-r ${from}).`);
    else if (v.entry) body = callout('warn', 'With a team but no First gameweek, the run re-simulates the whole season from GW1 using your history. ', planNext);
    else body = h('p.small.muted', null, 'No team loaded: the solver builds a squad from £100.0m. A bare run (no First gameweek) re-simulates the season from GW1 up to the next deadline. ', from ? null : planNext);
    fill(this.entryHint, body);
    this.ctx.setTitle([this.entry?.team_name, from ? `from GW${from}` : null].filter(Boolean).join(' · ') || null);
  }

  renderManager() {
    const e = this.entry;
    if (!e) { this.managerSlot.replaceChildren(); return; }
    const left = (e.chips_available || []).map((c) => pill(chipName(c), 'gain'));
    const used = (e.chips_used || []).map((c) => pill(`${chipName(c.chip)} GW${c.gw}`));
    fill(this.managerSlot, card({
      title: e.team_name || `Team ${e.entry_id}`, className: 'pl-manager',
      sub: [e.manager, `ID ${e.entry_id}`, seasonLabel(e.season)].filter(Boolean).join(' · '),
      actions: [
        h('button.icon-btn', { type: 'button', title: `Refetch from FPL: writes the entry cache under ml/solver/data/entry_data/${e.season}/${e.entry_id}/ (tracked in git)`, 'aria-label': 'Refetch from FPL', onClick: () => this.loadEntry(e.entry_id, { refresh: true }) }, icon('reset', { size: 16 })),
        h('button.icon-btn', { type: 'button', title: 'Forget this team', 'aria-label': 'Forget this team', onClick: () => this.clearEntry() }, icon('close', { size: 16 })),
      ],
      body: [
        h('div.pl-tiles', null,
          statTile({ label: 'Overall rank', value: fmt.int(e.overall_rank), sub: e.gw_rank ? `GW${e.state_gw}: ${fmt.int(e.gw_rank)}` : null }),
          statTile({ label: 'Points', value: fmt.int(e.points), sub: e.gw_points != null ? `GW${e.state_gw}: ${e.gw_points}` : null }),
          statTile({ label: 'Bank', value: fmt.money(e.bank), tone: e.bank < 0 ? 'loss' : null }),
          statTile({ label: 'Free transfers', value: e.ft ?? '—', sub: `for GW${e.gw}` }),
          statTile({ label: 'Squad value', value: fmt.money(e.squad_value), sub: `selling ${fmt.money(e.selling_value)}` })),
        h('div.pl-chiprow', null, h('span.small.muted', null, 'Chips left'), left.length ? left : h('span.small', null, 'none'),
          used.length ? [h('span.small.muted', null, 'played'), used] : null),
        (e.warnings || []).map((w) => callout('warn', w)),
        h('p.small.muted', null, e.cached ? 'From the local cache' : 'Fetched from FPL',
          e.fetched_epoch ? ` · history ${fmt.ago(e.fetched_epoch)}` : '',
          '. Transfers already made for the coming GW are not visible to the public API.'),
      ],
    }));
  }

  // ---- squad, locks and bans

  squadSource() {
    const m = this.values.team_state ? this.st.manual : null;
    if (m) return { ...m, manual: true };
    const e = this.entry;
    return e && { xi: e.xi, bench: e.bench, captain: e.captain, vice: e.vice, gw: e.gw, horizon: e.horizon,
      players: Object.fromEntries((e.squad || []).map((p) => [p.id, p])) };
  }

  renderSquad() {
    this.squadSeason = this.season();
    const src = this.squadSource();
    const row = (id) => {
      const p = src.players?.[id] || { id, name: `#${id}` };
      const pos = posName(p.pos);
      return h('li.pl-sq', { dataset: { pid: id } },
        h('span.pl-pos', { class: pos?.toLowerCase() }, pos || '?'),
        h('div.pl-sq-main', null,
          h('div.pl-sq-name', null, h('span.truncate', null, p.name),
            id === src.captain ? h('span.badge', { title: 'Captain' }, 'C') : id === src.vice ? h('span.badge', { title: 'Vice-captain' }, 'V') : null,
            statusDot(p.status, { chance: p.chance, news: p.news })),
          h('div.pl-sq-sub', null, [p.club, fmt.money(p.sell_price ?? p.price), num(p.xp_sum) != null ? `${fmt.pts(p.xp_sum)} xP` : null].filter(Boolean).join(' · '))),
        this.markBtn('lock', id, p.name), this.markBtn('ban', id, p.name));
    };
    const horizon = src?.horizon?.length ? ` · xP = GW${src.horizon[0]}–${src.horizon.at(-1)}` : '';
    const back = this.st.entry
      ? h('button.btn.sm', { type: 'button', onClick: () => this.useEntrySquad() }, 'Back to my FPL squad')
      : h('button.btn.sm', { type: 'button', onClick: () => this.useEntrySquad() }, 'Discard edited squad');
    fill(this.squadSlot, card({
      title: src ? `Squad going into GW${src.manual ? src.from_r ?? src.gw + 1 : src.gw}` : 'Squad, locks & bans', className: 'pl-squad',
      sub: `Lock = must keep (--must-have) · Ban = sell, never buy (--exclude)${horizon}`,
      actions: h('button.btn.sm', { type: 'button', onClick: () => this.openSquadEditor() }, icon('swap', { size: 14 }), src ? 'Edit squad' : 'Build a squad'),
      body: [
        src?.manual ? callout('info', 'Using your edited squad (--team-state). ', back) : null,
        src ? h('ul.list.pl-squad-list', null,
          (src.xi || []).map(row),
          src.bench?.length ? h('li.pl-bench-label', null, 'Bench') : null,
          (src.bench || []).map(row))
          : h('p.small.muted', null, 'Load your team to lock or ban squad players, or build a squad by hand. Locks and bans below work for fresh builds too.'),
        h('h3.pl-h3', null, 'Lock in or ban other players'),
        h('div.stack.tight', null, this.ctl('must_have'), this.ctl('exclude')),
      ],
    }));
    this.paintMarks();
  }

  markBtn(kind, id, name) {
    return h('button.icon-btn.pl-mark', {
      type: 'button', class: kind, dataset: { kind }, 'aria-pressed': 'false',
      'aria-label': `${kind === 'lock' ? 'Lock' : 'Ban'} ${name}`, onClick: () => this.toggleMark(kind, id),
    }, icon(kind, { size: 16 }));
  }

  paintMarks() {
    const lists = { lock: toks(this.values.must_have), ban: toks(this.values.exclude) };
    for (const li of this.squadSlot.querySelectorAll('.pl-sq[data-pid]')) {
      const id = li.dataset.pid;
      for (const b of li.querySelectorAll('.pl-mark')) {
        const kind = b.dataset.kind;
        const tok = findTok(lists[kind], id);
        const win = tok?.includes('@') ? ` (GW${tok.split('@')[1]})` : '';
        b.setAttribute('aria-pressed', String(!!tok));
        b.title = kind === 'lock'
          ? (tok ? `Locked${win}: the squad must keep him. Click to unlock.` : 'Lock: the squad must keep him (--must-have)')
          : (tok ? `Banned${win}: sold and never bought back. Click to lift.` : 'Ban: sell him and never buy him back (--exclude)');
      }
      li.classList.toggle('locked', !!findTok(lists.lock, id));
      li.classList.toggle('banned', !!findTok(lists.ban, id));
    }
  }

  useEntrySquad() {
    this.save({ manual: null });
    const entry = this.st.entry;
    this.patch({ team_state: undefined, entry });
    if (entry && !this.entry) this.loadEntry(entry);
    else this.renderSquad();
  }

  // ---- manual squad editing → POST /api/team-state → --team-state

  async openSquadEditor() {
    const season = this.season();
    const m = this.values.team_state && this.st.manual?.season === season ? this.st.manual : null;
    const e = this.entry?.season === season ? this.entry : null;
    const ts = m || e?.team_state || null;
    const body = h('div.pl-ed', null, loading('Loading players…'));
    let save = () => false;  // until the players have loaded
    const dlg = modal({
      title: 'Edit squad', wide: true, body,
      actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Use this squad', kind: 'primary', onClick: () => save() }],
    });
    const list = await this.players(season);
    const byId = new Map(list.map((p) => [Number(p.id), p]));
    const known = { ...(m?.players || {}), ...Object.fromEntries((e?.squad || []).map((p) => [p.id, p])) };
    const info = (id) => byId.get(Number(id)) || known[id] || { id, name: `#${id}` };
    const d = {
      gw: ts?.gw ?? Math.max(1, (num(this.meta?.next_gw) || 2) - 1),
      slots: Object.fromEntries(Object.keys(POS_SLOTS).map((p) => [p, []])),
      xi: new Set((ts?.xi || []).map(Number)), captain: num(ts?.captain), vice: num(ts?.vice),
      bank: num(ts?.bank) ?? 0, ft: num(ts?.ft) ?? 1, pp: { ...(ts?.purchase_prices || {}) },
      chips: ts?.chips_used || [], benchOrder: (ts?.bench || []).map(Number), replacing: null,
    };
    for (const id of [...(ts?.xi || []), ...(ts?.bench || [])].map(Number)) {
      const pos = posName(info(id).pos);
      if (pos && d.slots[pos].length < POS_SLOTS[pos]) d.slots[pos].push(id);
    }
    for (const pos of Object.keys(POS_SLOTS)) while (d.slots[pos].length < POS_SLOTS[pos]) d.slots[pos].push(null);
    const squad = () => Object.values(d.slots).flat().filter((x) => x != null);
    // The GW the plan starts at: the state's own from_r (after a free hit straight after the state round
    // it is a GW later; api/entry.py), else the GW after the one typed in.
    const planFrom = () => (num(ts?.from_r) != null && d.gw === num(ts.gw) ? num(ts.from_r) : d.gw + 1);
    const xiCount = (pos) => d.slots[pos].filter((id) => id != null && d.xi.has(id)).length;

    const setSlot = (pos, i, id) => {
      const old = d.slots[pos][i];
      d.slots[pos][i] = id;
      d.replacing = null;
      if (old != null) {
        if (d.xi.delete(old) && id != null) d.xi.add(id);
        if (d.captain === old) d.captain = id;
        if (d.vice === old) d.vice = id;
        d.benchOrder = d.benchOrder.map((x) => (x === old ? id : x)).filter((x) => x != null);
      } else if (id != null && d.xi.size < 11 && xiCount(pos) < XI_RANGE[pos][1]) d.xi.add(id);
      paint();
    };
    const benchOutfield = () => {
      const out = squad().filter((id) => !d.xi.has(id) && posName(info(id).pos) !== 'GK');
      return [...d.benchOrder.filter((id) => out.includes(id)), ...out.filter((id) => !d.benchOrder.includes(id))];
    };
    const problems = () => {
      const errs = [];
      const ids = squad();
      if (ids.length < 15) errs.push(`${15 - ids.length} empty slot(s)`);
      if (d.xi.size !== 11) errs.push(`the XI has ${plural(d.xi.size, 'player')}, needs 11`);
      for (const [pos, [lo, hi]] of Object.entries(XI_RANGE)) {
        const n = xiCount(pos);
        if (n < lo || n > hi) errs.push(`XI needs ${lo === hi ? lo : `${lo}–${hi}`} ${pos}, has ${n}`);
      }
      const clubs = {};
      for (const id of ids) { const c = info(id).club; if (c) clubs[c] = (clubs[c] || 0) + 1; }
      for (const [c, n] of Object.entries(clubs)) if (n > 3) errs.push(`${n} players from ${c} (max 3)`);
      if (!d.xi.has(d.captain)) errs.push('pick a captain in the XI');
      if (!d.xi.has(d.vice) || d.vice === d.captain) errs.push('pick a different vice-captain in the XI');
      if (!(d.bank >= 0 && d.bank <= 100)) errs.push('bank must be £0–100m');
      if (!(Number.isInteger(d.ft) && d.ft >= 1 && d.ft <= 5)) errs.push('free transfers must be 1–5');
      return errs;
    };

    const slotRow = (pos, i) => {
      const id = d.slots[pos][i];
      const key = `${pos}:${i}`;
      if (id == null || d.replacing === key) {
        return h('li.pl-ed-slot.empty', null,
          h('span.pl-pos', { class: pos.toLowerCase() }, pos),
          playerPicker({
            players: list.filter((p) => posName(p.pos) === pos), exclude: squad(),
            placeholder: id == null ? `Add a ${pos}…` : `Replace ${info(id).name}…`, label: `Pick a ${pos}`,
            onPick: (p) => setSlot(pos, i, Number(p.id)),
          }),
          id != null ? h('button.btn.sm.ghost', { type: 'button', onClick: () => { d.replacing = null; paint(); } }, 'Cancel') : null);
      }
      const p = info(id);
      const radio = (role) => h('label.pl-ed-arm', { title: role === 'captain' ? 'Captain' : 'Vice-captain' },
        h('input', { type: 'radio', name: `${dlg.el.id || 'ed'}-${role}`, checked: d[role] === id, disabled: !d.xi.has(id),
          onChange: () => { d[role] = id; if (role === 'captain' && d.vice === id) d.vice = null; if (role === 'vice' && d.captain === id) d.captain = null; paint(); } }),
        role === 'captain' ? 'C' : 'V');
      return h('li.pl-ed-slot', { class: { 'is-bench': !d.xi.has(id) } },
        h('span.pl-pos', { class: pos.toLowerCase() }, pos),
        h('label.check.pl-ed-xi', { title: 'In the starting XI' },
          h('input', { type: 'checkbox', checked: d.xi.has(id), onChange: (ev) => {
            if (ev.target.checked) d.xi.add(id); else { d.xi.delete(id); if (d.captain === id) d.captain = null; if (d.vice === id) d.vice = null; }
            paint();
          } }), 'XI'),
        radio('captain'), radio('vice'),
        h('div.pl-ed-name', null, h('span.strong.truncate', null, p.name),
          h('span.small.muted', null, [p.club, fmt.money(p.price)].filter(Boolean).join(' · '))),
        h('button.icon-btn', { type: 'button', title: 'Replace', 'aria-label': `Replace ${p.name}`, onClick: () => { d.replacing = key; paint(); } }, icon('swap', { size: 15 })),
        h('button.icon-btn', { type: 'button', title: 'Remove', 'aria-label': `Remove ${p.name}`, onClick: () => setSlot(pos, i, null) }, icon('close', { size: 15 })));
    };

    const numInput = (label, key, attrs, hint) => field(label, h('input.input.num', {
      type: 'number', value: d[key], ...attrs,
      onChange: (ev) => {
        const { n } = readNum(ev.target);  // blank or unreadable text: put the last value back
        if (n === undefined) ev.target.value = d[key];
        else { d[key] = n; paint(); }
      },
    }), hint);

    function paint() {
      const errs = problems();
      const bench = benchOutfield();
      fill(body,
        h('div.pl-ed-top', null,
          numInput('Squad after GW', 'gw', { min: 1, max: 37, step: 1 }, `the plan starts at GW${planFrom()}`),
          numInput('Bank (£m)', 'bank', { min: 0, max: 100, step: 0.1 }),
          numInput(`Free transfers for GW${planFrom()}`, 'ft', { min: 1, max: 5, step: 1 })),
        Object.keys(POS_SLOTS).map((pos) => h('section.pl-ed-pos', null,
          h('h4.pl-h4', null, `${pos} · ${d.slots[pos].filter((x) => x != null).length}/${POS_SLOTS[pos]}`),
          h('ul.list', null, d.slots[pos].map((_, i) => slotRow(pos, i))))),
        h('section.pl-ed-pos', null, h('h4.pl-h4', null, 'Bench order (after the goalkeeper)'),
          bench.length ? h('ol.pl-ed-bench', null, bench.map((id, i) => h('li', null, h('span.truncate', null, info(id).name),
            i ? h('button.icon-btn', { type: 'button', title: 'Move up', 'aria-label': `Move ${info(id).name} up`, onClick: () => {
              const o = bench.slice(); [o[i - 1], o[i]] = [o[i], o[i - 1]]; d.benchOrder = o; paint();
            } }, '↑') : null)))
            : h('p.small.muted', null, 'Untick XI on four players to fill the bench.')),
        errs.length ? callout('warn', h('strong', null, 'Not ready: '), errs.join('; '), '.') : callout('gain', 'Valid squad. Purchase prices you do not know default to the current price.'));
    }

    save = async () => {
      const errs = problems();
      if (errs.length) { toast(errs[0], 'warn'); return false; }
      const order = (ids) => ids.sort((a, b) => Object.keys(POS_SLOTS).indexOf(posName(info(a).pos)) - Object.keys(POS_SLOTS).indexOf(posName(info(b).pos)));
      const xi = order(squad().filter((id) => d.xi.has(id)));
      const bench = [...squad().filter((id) => !d.xi.has(id) && posName(info(id).pos) === 'GK'), ...benchOutfield()];
      const ids = [...xi, ...bench];
      const tag = this.values.entry || this.st.entry || 'manual';
      let res;
      try {
        res = await api.saveTeamState({
          season, gw: d.gw, xi, bench, captain: d.captain, vice: d.vice, bank: d.bank, ft: d.ft,
          purchase_prices: pick(d.pp, ids.map(String)), chips_used: d.chips, name: `planner-${tag}-gw${d.gw}`,
        });
      } catch (err) {
        toast(errText(err), 'error');
        return false;
      }
      const brief = (id) => pick(info(id), ['id', 'name', 'club', 'pos', 'price', 'status', 'chance', 'news']);
      this.save({
        manual: { season, gw: d.gw, from_r: res.from_r, xi, bench, captain: d.captain, vice: d.vice, bank: d.bank, ft: d.ft, path: res.path,
          purchase_prices: pick(d.pp, ids.map(String)), chips_used: d.chips,
          players: Object.fromEntries(ids.map((id) => [id, brief(id)])) },
      });
      const from = num(this.values.from_r);
      // --from-r must come after the state's round (main._load_team_state), and after a free hit that follows it
      this.patch({ team_state: res.path, entry: undefined, from_r: this.st.fromTouched && from >= res.from_r ? from : res.from_r });
      this.renderSquad();
      for (const w of res.warnings || []) toast(w, 'warn');
      toast(`Squad saved: the plan starts at GW${res.from_r}`, 'ok');
      return true;
    };
    paint();
  }

  // ---- presets

  renderPresets() {
    const cur = this.st.preset || '';
    const opt = (p) => h('option', { value: p.name }, p.name);
    const mine = this.presets.filter((p) => !p.builtin);
    fill(this.presetSel, h('option', { value: '' }, 'Presets…'),
      h('optgroup', { label: 'Built-in' }, this.presets.filter((p) => p.builtin).map(opt)),
      mine.length ? h('optgroup', { label: 'Saved' }, mine.map(opt)) : null);
    this.presetSel.value = this.presets.some((p) => p.name === cur) ? cur : '';
    this.renderPresetNote();
  }

  presetModified(p) {
    const strip = (o) => omit(o, [...KEEP, ...('from_r' in p.values ? [] : ['from_r'])]);
    return canon(strip(this.values)) !== canon(strip(p.values));
  }

  renderPresetNote() {
    if (!this.presetNote) return;
    const p = this.presets.find((x) => x.name === this.st.preset);
    this.delBtn.hidden = !p || p.builtin;
    fill(this.presetNote, p
      ? h('p.small', null, h('strong', null, p.name), ' ', this.presetModified(p) ? pill('changed since', 'warn') : null, ' ',
        h('span.muted', null, p.description), p.note ? h('span.warn', null, ` (${p.note})`) : null)
      : h('p.small.muted', null, 'Start from a preset, or set anything below. Settings are kept in this browser.'));
  }

  /** What a preset or "Reset all" leaves alone: the squad and players, and the first GW when a team is loaded. */
  kept() {
    return pick(this.values, [...KEEP, ...(this.values.entry || this.values.team_state ? ['from_r'] : [])]);
  }

  applyPreset(name) {
    const p = this.presets.find((x) => x.name === name);
    if (!p) return;
    this.save({ preset: p.name });
    this.replaceValues({ ...this.kept(), ...p.values });
    this.presetSel.value = p.name;
    toast(`Preset “${p.name}” applied`, 'ok', { timeout: 2500 });
  }

  async reloadPresets() {
    const season = this.season();  // a preset's @next_gw is that season's next deadline
    try {
      const list = await api.listPresets(season);
      if (season !== this.season()) return;
      this.presets = list;
      this.presetSeason = season;
    } catch (e) { toast(e.message, 'error'); }
    this.renderPresets();
  }

  savePresetDialog() {
    const values = omit(this.values, ['entry', 'team_state']);
    const name = h('input.input', { type: 'text', placeholder: 'e.g. My live settings', maxlength: 60 });
    const desc = h('textarea.textarea', { placeholder: 'What it is for (optional)', rows: 3 });
    const dlg = modal({
      title: 'Save settings as a preset',
      body: h('div.stack.tight', null, field('Name', name), field('Description', desc),
        h('p.small.muted', null, `Saves ${plural(Object.keys(values).length, 'setting')}. Your team (--entry / --team-state) is not stored.`)),
      actions: [{ label: 'Cancel', kind: 'ghost' }, {
        label: 'Save', kind: 'primary',
        onClick: async () => {
          if (!name.value.trim()) { name.focus(); return false; }
          try {
            const p = await api.savePreset({ name: name.value.trim(), description: desc.value.trim(), values });
            this.save({ preset: p.name });
            await this.reloadPresets();
            toast(`Preset “${p.name}” saved`, 'ok');
            return true;
          } catch (e) {
            toast(errText(e), 'error');
            return false;
          }
        },
      }],
    });
    setTimeout(() => name.focus(), 0);
    return dlg;
  }

  async deletePreset() {
    const p = this.presets.find((x) => x.name === this.st.preset);
    if (!p || p.builtin) return;
    if (!await confirm({ title: 'Delete preset?', body: `“${p.name}” will be removed. Your current settings stay as they are.`, confirmLabel: 'Delete', danger: true })) return;
    try {
      await api.deletePreset(p.slug);
      this.save({ preset: undefined });
      await this.reloadPresets();
      toast('Preset deleted', 'ok');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  // ---- chips

  /** Switch the chip mode (one patch, with `extra` values); manual keeps the rounds already set. */
  setChipMode(mode, extra = {}) {
    this.chipUi = mode;  // "Stored plan" with no plan picked yet has no flag to show it
    const p = Object.fromEntries(CHIP_KEYS.map((k) => [k, undefined]));
    if (mode === 'manual') Object.assign(p, pick(this.values, CHIP_ROUNDS));
    if (mode === 'plan') p.plan = this.values.plan;
    if (mode === 'auto') p.chip_auto = true;
    if (mode === 'none') p.no_chips = true;
    this.patch({ ...p, ...extra });
  }

  /**
   * Manual chip rounds (or the season's defaults where unset) the loaded team cannot play: it has already
   * played that chip in the half of the season they fall in. entry.chips_available is for the half holding
   * entry.gw, so later halves are not checked.
   */
  chipClashes(season) {
    const e = this.entry;
    if (chipMode(this.values) !== 'manual') return [];
    return CHIP_ROUNDS.flatMap((c) => {
      const played = (e?.chips_used || []).filter((u) => u.chip === c).map((u) => `GW${u.gw}`).join(', ');
      const rounds = (this.values[c] ?? this.flag(c)?.default_by_season?.[season] ?? []).map(Number);
      return rounds.filter((r) => this.chipPlayed(c, r, season)).map((r) =>
        `${chipName(c)} in GW${r}: this team has already played its ${chipName(c)}${played ? ` (${played})` : ''} in this half of the season.`);
    });
  }

  /** The loaded team has already played chip `c` in the half of `season` holding GW `r` (meta.chip_half: solver.chips.HALF). */
  chipPlayed(c, r, season) {
    const e = this.entry;
    const last = num(this.meta?.chip_half);  // the first half's last GW; unknown without /api/meta: no check
    const half = (gw) => gw > last;
    return last != null && !!e?.chips_available && e.season === season && !e.chips_available.includes(c)
      && r >= e.gw && half(r) === half(e.gw);
  }

  renderChips() {
    if (!this.chipPanel) return;
    const derived = chipMode(this.values);
    const mode = derived === 'manual' && this.chipUi === 'plan' ? 'plan' : derived;
    const season = this.season();
    this.chipSeg.setActive(mode);
    // A wildcard squad from the team for its first GW (--entry N --from-r N --wc N), not --fresh, which
    // only moves one GW from the real squad.
    const from = num(this.values.from_r);
    const wcNow = (this.values.entry || this.values.team_state) && from && !this.chipPlayed('wc', from, season)
      && !(mode === 'manual' && String(this.values.wc) === String(from))
      ? h('div', null, h('button.btn.sm', {
        type: 'button', onClick: () => this.setChipMode('manual', { wc: [from], fresh: undefined }),
        title: `Rebuild the squad in GW${from} with your wildcard: chip mode Manual, wildcard round ${from}, --fresh off`,
      }, icon('swap', { size: 14 }), `Wildcard in GW${from}`)) : null;
    fill(this.chipChecks, this.chipClashes(season).map((t) => callout('warn', t)), wcNow);
    this.chipChecks.hidden = !this.chipChecks.childElementCount;
    const left = this.entry?.season === season ? this.entry.chips_available : null;
    const leftNote = left ? h('p.small', null, h('span.muted', null, 'Chips left: '), left.length ? left.map(chipName).join(', ') : 'none') : null;
    const key = `${mode}|${season}|${left?.join(',') ?? ''}`;
    if (key === this.chipKey) return;  // re-render only on a mode change, so edits keep their focus
    this.chipKey = key;
    let body;
    if (mode === 'manual') {
      const defs = CHIP_ROUNDS.map((c) => [c, this.flag(c)?.default_by_season?.[season]]).filter(([, r]) => r?.length);
      body = [
        h('div.flag-grid', null, CHIP_ROUNDS.map((c) => this.ctl(c))),
        h('p.small.muted', null, defs.length
          ? `Unset uses ${season}'s default rounds (${defs.map(([c, r]) => `${c.toUpperCase()} ${r.join(',')}`).join(' · ')}); enter 0 to drop one. `
          : `${season} has no default chip rounds: only the rounds you enter are played. `,
        left ? 'Rounds in the current half of the season are checked against the chips your team has left.'
          : 'Load your team to check the rounds against the chips it has left.'),
      ];
    } else if (mode === 'plan') {
      const f = this.flag('plan');
      const choices = f?.choices_by_season?.[season] || [];
      body = choices.length
        ? [this.ctl('plan', { ...f, choices }), h('p.small.muted', null, 'A stored schedule from solver/chips.py CANONICAL_PLANS; it sets all four chips.')]
        : callout('warn', `No stored chip plans for ${season} (CANONICAL_PLANS has ${Object.keys(f?.choices_by_season || {}).join(' and ') || 'none'}). Pick another chip mode.`);
    } else if (mode === 'auto') {
      body = h('p.small.muted', null, this.flag('chip_auto')?.help || 'The solver times chips itself.');
    } else {
      body = h('p.small.muted', null, 'No chips are played, not even the season\'s default rounds (--no-chips).');
    }
    fill(this.chipBody, body, leftNote);
  }

  // ---- all settings drawer

  openDrawer() {
    const form = flagForm({
      flags: this.flags, groups: this.groups, values: this.values, players: this.players(), meta: this.meta,
      onChange: (vals, dest) => {
        if (dest == null) {  // "Reset all": keeps the team (as a preset does) and re-syncs the form's own copy
          this.replaceValues(this.kept());
          form.setValues(this.values);
          return;
        }
        if (dest === 'from_r') this.save({ fromTouched: vals.from_r !== undefined });
        this.replaceValues(vals, [dest]);
      },
    });
    const dlg = modal({
      title: `All settings (${this.flags.length})`, wide: true,
      body: [h('p.small.muted', null, 'Every solver flag, grouped. Changes apply to the planner at once; the quick settings show the same values.'), form],
      actions: [{ label: 'Done', kind: 'primary' }],
    });
    dlg.el.classList.add('pl-drawer');
  }

  // ---- solve, results, reattach

  jobLabel(v) {
    const who = v.team_state ? 'edited squad' : v.entry ? `team ${v.entry}` : 'fresh build';
    const rounds = v.from_r ? `GW${v.from_r}${v.to ? `–${v.to}` : ''}` : 'season replay';
    const p = this.presets.find((x) => x.name === this.st.preset);
    return ['Planner', who, rounds, p && !this.presetModified(p) ? p.name : null].filter(Boolean).join(' · ');
  }

  /** Run fn unless a launch with the same key is still being created (double clicks, Try again, Run all). */
  async once(key, fn) {
    if (this.inflight.has(key)) return undefined;
    this.inflight.add(key);
    try { return await fn(); } finally { this.inflight.delete(key); }
  }

  solve() {
    if (this.argv?.errors?.length) { toast(this.argv.errors[0], 'error'); return undefined; }
    return this.once('solve', async () => {
      this.solveBtn.disabled = true;
      try {
        const { job } = await api.createJob({ kind: 'solve', values: { ...this.values }, label: this.jobLabel(this.values) });
        this.save({ lastJob: job.id });
        this.ctx.setParams({ ...this.ctx.params, job: job.id });
        this.showRunner(job);
        this.resultSlot.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        toast(errText(e), 'error');
      } finally {
        this.solveBtn.disabled = !!this.argv?.errors?.length;
      }
    });
  }

  showRunner(job) {
    const seq = ++this.jobSeq;
    const runner = jobRunner({
      job, title: job.label,
      onDone: ({ job: j, result }) => { if (seq === this.jobSeq) this.renderResult(j, result); },
    });
    fill(this.resultSlot, card({ title: 'Solving…', sub: 'The log streams below; results appear here when it finishes.', body: runner }));
  }

  async showJob(id, { fromUrl = false } = {}) {
    const seq = ++this.jobSeq;
    fill(this.resultSlot, loading('Loading the run…'));
    try {
      const { job, result } = await api.getJob(id);
      if (seq !== this.jobSeq || this.abort.signal.aborted) return;
      if (api.isActive(job)) this.showRunner(job);
      else this.renderResult(job, result);
    } catch (e) {
      if (seq !== this.jobSeq) return;
      if (e.status === 404 && !fromUrl) {
        if (this.st.lastJob === id) this.save({ lastJob: undefined });
        this.resultSlot.replaceChildren();
        return;
      }
      fill(this.resultSlot, errorCard(e, { title: `Run ${id} could not be loaded`, retry: () => this.showJob(id, { fromUrl }) }));
    }
  }

  renderResult(job, res) {
    const again = h('button.btn', { type: 'button', onClick: () => this.solve() }, icon('play', { size: 14 }), 'Solve again');
    if (!['solve', 'backtest'].includes(job.kind)) {
      fill(this.resultSlot, card({ title: job.label || job.id, body: [h('p', null, `This is a ${job.kind} job; open it in Runs.`), h('a.btn', { href: `#/runs?job=${encodeURIComponent(job.id)}` }, 'Open in Runs')] }));
      return;
    }
    const rows = res ? timelineOf(res) : [];
    if (job.status === 'cancelled' && !rows.length) {
      fill(this.resultSlot, card({ title: 'Solve cancelled', body: [h('p.muted', null, job.label), again] }));
      return;
    }
    if (!rows.length) {
      const err = { message: res?.error || job.error || 'The run left no plan.', detail: res?.traceback || res?.stdout_tail || '' };
      fill(this.resultSlot, errorCard(err, { title: 'The solve failed', retry: () => this.solve() }));
      return;
    }
    const meta = res.meta || {};
    const now = rows.find((r) => r.kind === 'committed' && r.gw === num(meta.to)) || rows.filter((r) => r.kind === 'committed').at(-1) || rows[0];
    this.result = { job, res, rows };
    this.selGw = now.gw;
    const planRows = rows.filter((r) => r.kind === 'plan' || r.gw >= now.gw);
    const span = planRows.length ? spanText({ from: planRows[0].gw, to: planRows.at(-1).gw }) : '';
    const playedRows = rows.filter((r) => r.t.played);
    const values = job.values || {};
    const entry = values.entry || meta.entry || (values.team_state ? null : this.st.entry);
    this.previewBtn = h('button.btn.sm', { type: 'button', onClick: () => this.sideJob('preview', this.selGw) });
    const rateBtn = h('button.btn.sm', {
      type: 'button', disabled: !entry, onClick: () => this.sideJob('rate', now.gw, entry),
      title: entry ? `Rate team ${entry}'s squad for GW${now.gw}` : 'Rating needs an FPL team (--entry); an edited squad cannot be rated',
    }, `Rate my squad (GW${now.gw})`);
    const cmd = job.solver_cmd || job.cmd;
    const head = card({
      title: 'Plan', className: 'pl-res-head',
      sub: [job.label, job.finished ? fmt.ago(job.finished) : null, job.elapsed != null ? `took ${fmt.dur(job.elapsed)}` : null,
        meta.pool ? `pool ${meta.pool}` : null, meta.tau != null ? `τ ${fmt.num(meta.tau, 2)}` : null].filter(Boolean).join(' · '),
      actions: [
        this.previewBtn, rateBtn,
        h('button.btn.sm', { type: 'button', onClick: () => this.compareDialog(job) }, icon('compare', { size: 14 }), 'Compare…'),
        cmd ? h('button.icon-btn', { type: 'button', title: 'Copy command', 'aria-label': 'Copy command', onClick: () => copyText(cmd) }, icon('copy', { size: 16 })) : null,
        job.values ? h('button.btn.sm.ghost', { type: 'button', title: 'Load this run\'s settings into the planner', onClick: () => this.adoptJobValues(job) }, 'Use these settings') : null,
        h('a.btn.sm.ghost', { href: `#/runs?job=${encodeURIComponent(job.id)}` }, 'Runs'),
      ],
      body: [
        h('div.pl-tiles', null,
          statTile({ label: `${fmt.gw(now.gw)} xP`, value: fmt.pts(now.t.pred), sub: now.t.played ? `scored ${fmt.int(now.t.act)}` : rowTag(now, meta) === 'Next' ? 'next deadline' : null }),
          statTile({ label: `Plan xP ${span}`, value: fmt.pts(sum(planRows.map((r) => r.t.pred))), sub: `${plural(planRows.length, 'GW')}, before hits` }),
          statTile({ label: 'Hits', value: String(sum(planRows.map((r) => r.t.hits))), tone: sum(planRows.map((r) => r.t.hits)) ? 'loss' : null, sub: `−${hitCostOf(res)} pts each` }),
          playedRows.length ? statTile({ label: 'Points scored', value: fmt.int(sum(playedRows.map((r) => r.t.act))), sub: `${plural(playedRows.length, 'played GW')}${job.summary?.rank ? ` · rank ${job.summary.rank}` : ''}` }) : null),
        res.error ? callout('loss', h('strong', null, 'The run stopped early: '), res.error) : null,
        job.status === 'cancelled' ? callout('warn', 'This run was cancelled; the plan below is what it had reached.') : null,
      ],
    });
    this.timeline = timelineCard(res, rows, (gw) => this.selectGw(gw));
    this.pitchSlot = h('div.pl-slot');
    fill(this.resultSlot,
      head,
      h('div.pl-res-grid', null, recommendationCard(res, rows), this.pitchSlot),
      this.timeline, historyCard(res, job.id), warningsCard(res, (n) => this.exactResolve(n)));
    this.selectGw(this.selGw, false);
  }

  selectGw(gw, scroll = true) {
    if (!this.result) return;
    this.selGw = gw;
    this.timeline.select(gw);
    fill(this.pitchSlot, pitchCard(this.result.res, this.result.rows, gw));
    fill(this.previewBtn, icon('preview', { size: 14 }), `Preview GW${gw}`);
    this.previewBtn.title = `The solver's HTML preview for GW${gw} (same pool and window)`;
    if (scroll) this.pitchSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async adoptJobValues(job) {
    if (!await confirm({ title: 'Use this run\'s settings?', body: 'Your current planner settings are replaced by the ones this run used.', confirmLabel: 'Replace settings' })) return;
    this.loadJobValues(job);
    toast('Settings loaded from the run', 'ok');
  }

  loadJobValues(job) {
    this.save({ preset: undefined, fromTouched: job.values?.from_r != null });
    this.replaceValues(job.values || {});
  }

  /** Re-solve the run on screen with every window round integer, so the plan rows are exact. */
  async exactResolve(n) {
    this.loadJobValues(this.result.job);
    this.setValue('int_rounds', String(n));
    clearTimeout(this.argvTimer);
    await this.refreshArgv();  // solve() checks this.argv: the run's values, not the ones they replaced
    this.solve();
  }

  /** A preview or rating of `gw` with the solved run's data settings, shown in a dialog when done. */
  sideJob(kind, gw, entry) {
    return this.once(kind, () => this.sideJobNow(kind, gw, entry));
  }

  async sideJobNow(kind, gw, entry) {
    const base = this.result?.job?.values || this.values;
    // from_r = to = gw: τ is estimated up to --from-r (main.py:952-965), as a live run at gw would
    const values = { ...pick(base, DATA_KEYS), ...(kind === 'rate' ? { entry: String(entry) } : pick(base, ['must_have', 'exclude'])), from_r: gw, to: gw };
    const label = kind === 'rate' ? `Rating · team ${entry} · GW${gw}` : `Preview · GW${gw}`;
    let job;
    try {
      ({ job } = await api.createJob({ kind, values, label }));
    } catch (e) {
      toast(errText(e), 'error');
      return;
    }
    const out = h('div.pl-side-out');
    const runner = jobRunner({
      job, title: label,
      onDone: ({ job: j }) => {
        if (j.status !== 'done') return;
        if (!j.html_url) { fill(out, callout('warn', 'The run finished but its page was not found; see the log.')); return; }
        const url = api.jobHtmlUrl(j.id);
        fill(out, h('div.row', null, h('a.btn.sm', { href: url, target: '_blank', rel: 'noopener' }, icon('external', { size: 14 }), 'Open in a new tab')),
          h('iframe.report', { src: url, title: label }));
      },
    });
    modal({ title: label, wide: true, body: h('div.stack.tight', null, runner, out), actions: [{ label: 'Close', kind: 'ghost' }] });
  }

  async compareDialog(job) {
    const listEl = h('div.stack.tight', null, loading());
    modal({
      title: 'Compare with another run',
      body: [h('p.small.muted', null, 'Pick a finished solve; Runs shows the two plans GW by GW.'), listEl],
      actions: [{ label: 'Cancel', kind: 'ghost' }],
    });
    try {
      const jobs = (await api.listJobs()).filter((j) => ['solve', 'backtest'].includes(j.kind) && j.status === 'done' && j.id !== job.id);
      fill(listEl, ...(jobs.length
        ? jobs.slice(0, 40).map((j) => h('button.pl-pick', {
          type: 'button', onClick: () => this.ctx.navigate('runs', { diff: `${job.id},${j.id}` }),  // the route change closes the dialog
        }, h('span.strong.truncate', null, j.label || j.id),
        h('span.small.muted', null, [fmt.ago(j.finished || j.created), j.summary?.total_pred != null ? `${fmt.pts(j.summary.total_pred)} xP` : null, j.id].filter(Boolean).join(' · '))))
        : [empty('No other finished solves yet: run another solve or a scenario first.')]));
    } catch (e) {
      fill(listEl, errorCard(e));
    }
  }

  // ---- scenarios

  openScenarios() {
    const patch = { scenarioOpen: true };
    if (!this.variants.length) patch.scenarios = [{ id: 'v1', name: 'Current settings', overrides: {} }, { id: 'v2', name: 'Variant B', overrides: {} }];
    this.save(patch);
    this.renderScenarios();
    this.scenSlot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setVariants(list) {
    this.save({ scenarios: list });
  }

  updateVariant(id, patch) {
    this.setVariants(this.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  renderScenarios() {
    if (!this.st.scenarioOpen) { this.scenSlot.replaceChildren(); return; }
    const vs = this.variants;
    const add = () => {
      const cur = this.variants;  // not `vs`: edits since this render are saved, not re-rendered
      const used = new Set(cur.map((v) => v.id));
      let n = 1;
      while (used.has(`v${n}`)) n++;
      this.setVariants([...cur, { id: `v${n}`, name: `Variant ${String.fromCharCode(65 + cur.length)}`, overrides: {} }]);
      this.renderScenarios();
    };
    this.scenTable = h('div.pl-slot');
    fill(this.scenSlot, card({
      title: 'Scenarios', className: 'pl-scen',
      sub: 'Each variant is your current settings plus its own changes. Run them together and compare the plans side by side.',
      actions: [
        h('button.btn.sm', { type: 'button', disabled: vs.length >= MAX_VARIANTS, onClick: add }, icon('plus', { size: 14 }), 'Add variant'),
        this.scenRunBtn = h('button.btn.sm.primary', { type: 'button', onClick: () => this.runScenarios() }, icon('play', { size: 14 }), `Run ${vs.length > 1 ? `all ${vs.length}` : ''}`),
        h('button.icon-btn', { type: 'button', title: 'Close scenarios', 'aria-label': 'Close scenarios', onClick: () => { this.save({ scenarioOpen: false }); this.renderScenarios(); } }, icon('close', { size: 16 })),
      ],
      body: [
        h('div.pl-scen-grid', null, vs.length ? vs.map((v, i) => this.variantEditor(v, i)) : empty('No variants yet.')),
        this.scenTable,
      ],
    }));
    this.paintScenRun();
    this.paintScenStatus();
    this.renderScenTable();
  }

  /** "Run all" is off with no variants and while the last click's jobs are still being created. */
  paintScenRun() {
    if (this.scenRunBtn) this.scenRunBtn.disabled = !this.variants.length || this.inflight.has('scen');
  }

  variantEditor(v, i) {
    const ov = v.overrides || {};
    const live = () => this.variants.find((x) => x.id === v.id) || v;
    const setOv = (o) => this.updateVariant(v.id, { overrides: o });
    const name = h('input.input.pl-vname', {
      type: 'text', value: v.name, 'aria-label': 'Variant name', maxlength: 40,
      onChange: () => { this.updateVariant(v.id, { name: name.value.trim() || v.name }); this.renderScenTable(); },
    });
    const rows = Object.keys(ov).filter((d) => this.byDest.has(d)).map((dest) => h('div.pl-ovr', null,
      flagControl(this.flag(dest), ov[dest] ?? undefined, (val) => setOv({ ...live().overrides, [dest]: val ?? null }), { players: this.players(), meta: this.meta }),
      h('button.icon-btn', {
        type: 'button', title: 'Drop this change (use the current setting)', 'aria-label': `Drop the change to ${flagLabel(this.flag(dest))}`,
        onClick: () => { setOv(omit(live().overrides, [dest])); this.renderScenarios(); },
      }, icon('close', { size: 14 }))));
    const addSel = h('select.select', {
      'aria-label': 'Change a setting in this variant',
      onChange: () => { const d = addSel.value; if (d) { setOv({ ...live().overrides, [d]: this.values[d] ?? null }); this.renderScenarios(); } },
    }, h('option', { value: '' }, '+ Change a setting…'),
    this.groups.map((g) => h('optgroup', { label: g.title }, (g.flags || []).filter((d) => this.byDest.has(d) && !(d in ov))
      .map((d) => h('option', { value: d }, flagLabel(this.flag(d)))))));
    const presetSel = h('select.select', {
      'aria-label': 'Start this variant from a preset',
      onChange: () => {
        const p = this.presets.find((x) => x.name === presetSel.value);
        if (!p) return;
        this.updateVariant(v.id, { name: p.name.slice(0, 40), overrides: omit(p.values, KEEP) });
        this.renderScenarios();
      },
    }, h('option', { value: '' }, 'Start from a preset…'), this.presets.map((p) => h('option', { value: p.name }, p.name)));
    return h('div.pl-variant', null,
      h('div.row.tight', null, h('span.pl-vkey', null, String.fromCharCode(65 + i)), name,
        h('button.icon-btn', {
          type: 'button', title: 'Remove variant', 'aria-label': `Remove ${v.name}`,
          onClick: () => { this.setVariants(this.variants.filter((x) => x.id !== v.id)); this.scen.delete(v.id); this.renderScenarios(); },
        }, icon('trash', { size: 15 }))),
      h('div.pl-vstatus', { dataset: { vid: v.id } }),
      rows.length ? rows : h('p.small.muted', null, 'Same as the current settings.'),
      h('div.stack.tight', null, addSel, presetSel));
  }

  async runScenarios() {
    const run = this.once('scen', () => this.queueScenarios());
    this.paintScenRun();
    await run;
    this.paintScenRun();
  }

  async queueScenarios() {
    const vs = this.variants;
    const jobs = {};
    this.scenAbort?.abort();
    this.scen.clear();
    for (const v of vs) {
      // clean(): an override of a flag main.py no longer has (hidden in the editor) would fail every run
      const values = this.clean(mergeValues(this.values, v.overrides));
      try {
        const d = await api.buildArgv(values);
        if (d.errors?.length) { toast(`${v.name}: ${d.errors[0]}`, 'error'); continue; }
        jobs[v.id] = (await api.createJob({ kind: 'solve', values, label: `Scenario · ${v.name}` })).job.id;
      } catch (e) {
        toast(`${v.name}: ${e.message}`, 'error');
      }
    }
    this.save({ scenarioJobs: jobs });
    if (Object.keys(jobs).length) toast(`${plural(Object.keys(jobs).length, 'scenario')} queued (two solve at a time)`, 'info');
    this.trackScenarios();
  }

  resumeScenarios() {
    if (Object.keys(this.st.scenarioJobs || {}).length) this.trackScenarios();
  }

  trackScenarios() {
    const ctrl = this.scenAbort = new AbortController();
    this.abort.signal.addEventListener('abort', () => ctrl.abort(), { once: true });
    for (const [vid, id] of Object.entries(this.st.scenarioJobs || {})) {
      this.scen.set(vid, { id, job: { id, status: 'queued' } });
      api.pollJob(id, ({ job }) => { this.scen.set(vid, { id, job }); this.paintScenStatus(); },
        { interval: 2000, signal: ctrl.signal, withLog: false })
        .then((r) => {
          if (!r) return;
          this.scen.set(vid, { id, job: r.job, res: r.result });
          this.paintScenStatus();
          this.renderScenTable();
        })
        .catch((e) => {
          if (e.status === 404) {  // deleted in Runs: back to "not run yet"
            this.save({ scenarioJobs: omit(this.st.scenarioJobs, [vid]) });
            this.scen.delete(vid);
          } else this.scen.set(vid, { id, job: { id, status: 'lost' }, error: e });
          this.paintScenStatus();
          this.renderScenTable();
        });
    }
    this.paintScenStatus();
  }

  paintScenStatus() {
    for (const el of this.scenSlot.querySelectorAll('.pl-vstatus[data-vid]')) {
      const s = this.scen.get(el.dataset.vid);
      fill(el, ...(s
        ? [jobStatusPill(s.job.status), s.job.elapsed != null ? h('span.small.muted', null, fmt.dur(s.job.elapsed)) : null,
          h('a.small', { href: `#/runs?job=${encodeURIComponent(s.id)}` }, 'log')]
        : [h('span.small.muted', null, 'Not run yet')]).filter(Boolean));
    }
  }

  renderScenTable() {
    if (!this.scenTable?.isConnected) return;
    const items = this.variants.map((v) => ({ name: v.name, ...this.scen.get(v.id) })).filter((x) => x.res && timelineOf(x.res).length);
    const failed = this.variants.filter((v) => { const s = this.scen.get(v.id); return s && !api.isActive(s.job) && !(s.res && timelineOf(s.res).length); });
    fill(this.scenTable,
      failed.map((v) => callout('loss', `${v.name}: ${this.scen.get(v.id)?.res?.error || this.scen.get(v.id)?.job?.error || `no plan (${this.scen.get(v.id)?.job?.status})`}`)),
      items.length
        ? [h('h3.pl-h3', null, 'Comparison'),
          h('p.small.muted', null, 'Best xP per gameweek and the best window total are highlighted. Totals cover the gameweeks every variant planned; net subtracts the hit cost. Results reflect the settings at run time.'),
          scenarioTable(items)]
        : this.scen.size ? h('p.small.muted', null, 'The comparison appears as the variants finish.') : null);
  }
}

export default {
  route: 'lab',
  title: 'Solver lab',
  icon: 'M9 3h6M10 3v6.5L4.6 18.7A1.5 1.5 0 0 0 5.9 21h12.2a1.5 1.5 0 0 0 1.3-2.3L14 9.5V3M7.2 15h9.6',
  async mount(el, ctx) {
    const p = new Planner(el, ctx);
    try {
      await p.init();
    } catch (e) {
      p.destroy();
      throw e;
    }
    return () => p.destroy();
  },
};
