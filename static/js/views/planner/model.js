// Solver lab: constants, small helpers and the result model (solve_table rows → timeline, moves).

import { h, POS, posName } from '../../ui.js';

// ---------------------------------------------------------------- constants

export const QUICK = [
  ['Rounds & data', ['season', 'from_r', 'to', 'dir', 'w', 'horizon_w']],
  ['Transfers & bank', ['max_hits', 'hit_cost', 'ft', 'cash']],
  ['Mode & captaincy', ['fresh', 'no_cap', 'cap_top']],
];
export const CHIP_ROUNDS = ['wc', 'fh', 'bb', 'tc'];
export const CHIP_KEYS = [...CHIP_ROUNDS, 'plan', 'chip_auto', 'no_chips'];
export const CHIP_MODES = [
  { key: 'manual', label: 'Manual rounds' }, { key: 'plan', label: 'Stored plan' },
  { key: 'auto', label: 'Auto (--chip-auto)' }, { key: 'none', label: 'No chips' },
];
// Whose squad and which players: presets and scenarios leave these alone.
export const KEEP = ['season', 'entry', 'team_state', 'must_have', 'exclude'];
// What a preview / rating run needs from the solve's settings (they act on --to; main.py:654-658).
export const DATA_KEYS = ['season', 'dir', 'pool', 'seeds', 'w', 'horizon_w'];
export const POS_SLOTS = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
export const XI_RANGE = { GK: [1, 1], DEF: [3, 5], MID: [2, 5], FWD: [1, 3] };
export const MAX_VARIANTS = 4;
export const MOVES_SHOWN = 5;
// Objective terms (solve.py ConstraintBuilder.obj tags; tap/solve_tap.py records anchors[gw].objective = {tag: {gw:
// value}}) in display order: [label, what it is]. Only the XI and captain rows are the plan's xP; the rest are charges
// (−) and credits.
export const OBJ_TERMS = {
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
export const MOVE_CHARGES = ['ft_cost', 'hit', 'keep_best'];  // what a GW's own moves pay in that GW's objective


// ---------------------------------------------------------------- small helpers

export const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
export const sum = (xs) => xs.reduce((s, x) => s + (Number(x) || 0), 0);
export const omit = (o, keys) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !keys.includes(k)));
export const canon = (o) => JSON.stringify(Object.keys(o || {}).sort().map((k) => [k, o[k]]));
const sortedKeys = (o) => Object.keys(o || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);


/** A variant's values: base, then overrides (null = back to the solver default). */
export function mergeValues(base, overrides) {
  const v = { ...base };
  for (const [k, x] of Object.entries(overrides || {})) {
    if (x === null || x === undefined) delete v[k];
    else v[k] = x;
  }
  return v;
}

export const chipMode = (v) => (v.chip_auto ? 'auto' : v.no_chips ? 'none' : v.plan ? 'plan' : 'manual');
export const hitCostOf = (res) => num(res?.meta?.args?.hit_cost_actual) ?? 4;
export const xpSum = (p) => (Array.isArray(p?.xp) ? sum(p.xp) : null);

// ---------------------------------------------------------------- result model (solve_tap.py document)

/**
 * The run as rows {gw, t: TeamJSON, kind, anchor}: committed rounds from --from-r (earlier ones are the --entry
 * history), then the last anchor's window plan.
 */
export function timelineOf(res) {
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
export const prevTeam = (res, rows, i) => (i > 0 ? rows[i - 1].t : res?.committed?.[rows[i].gw - 1]?.team);

export const playerIn = (t, prev, id) => t?.players?.[id] ?? prev?.players?.[id] ?? { id, name: `#${id}` };

/** OUT → IN pairs, same position first (dearest first), leftovers alone. */
export function pairMoves(t, prev) {
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

export const rowTag = (r, meta) => (r.kind === 'plan' ? 'Plan' : r.t.played ? 'Played' : r.gw === meta?.next_gw ? 'Next' : 'Commit');

/** No squad to start from (no team loaded): all 15 bought from the budget, not transfers. */
export const isBuild = (t) => !t?.out?.length && (t?.in?.length || 0) >= 15;

export function movesList(t, prev, limit = MOVES_SHOWN) {
  if (isBuild(t)) return h('ul.pl-moves', null, h('li', null, 'New squad of 15'));
  const pairs = pairMoves(t, prev);
  if (!pairs.length) return h('ul.pl-moves', null, h('li.muted', null, 'Roll (no transfer)'));
  return h('ul.pl-moves', null,
    pairs.slice(0, limit).map(([o, i]) => h('li', null,
      h('span.loss.truncate', null, o?.name ?? '—'), h('span.pl-arrow', { 'aria-label': 'replaced by' }, '→'),
      h('span.gain.truncate', null, i?.name ?? '—'))),
    pairs.length > limit ? h('li.muted', null, `+${pairs.length - limit} more`) : null);
}
