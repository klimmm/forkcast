// calls.js: the one measure, the planner's count, the armband and your plan as you play it

import * as E from '../../plan/engine.js';
import { EPS, hitsWords, ids, lookupOf, num, weekAt } from './helpers.js';
import { COPY, sentence } from './copy.js';
import { shownPlayers } from './prices.js';

// ---------------------------------------------------------------- inputs

/**
 * GET /api/m/bundle data → ctx (the engine's base / players / seeds plus the model's plan and noise). Pass app.js's
 * derived `data` ({base, players, seeds, noise, gw, horizon}) to reuse it as is; `model`: the solver's plan with none of
 * your rules (memory model), whose noise is the plan's and whose hit rule the cap (hitCap).
 */
export function planInputs(bundle, data, model = null) {
  if (!bundle) return null;
  const meta = bundle.meta || {}, entry = bundle.entry || {};
  const A = num(meta.gw ?? meta.next_gw);
  const rest = { meta, model, rank: bundle.rank || null };
  if (data?.base && data?.players) {
    return {
      ...rest, A, gws: ids(data.horizon).length ? ids(data.horizon) : ids(meta.horizon), base: data.base, players: data.players,
      seeds: E.decodeSeeds(data.seeds ?? bundle.seeds), noise: num(model?.noise) ?? num(data.noise) ?? E.noiseFloor(meta, A) ?? 0,
    };
  }
  const cols = shownPlayers(bundle) || {};
  const width = (Array.isArray(cols.players) ? cols.players[0]?.xp : cols.rows?.[0]?.[(cols.fields || []).indexOf('xp')])?.length ?? 5;
  const horizon = ids(cols.horizon).length ? ids(cols.horizon)
    : ids(bundle.seeds?.gws).length ? ids(bundle.seeds.gws) : Array.from({ length: width }, (_, i) => A + i);
  const players = { ...cols, horizon };
  const base = {
    season: num(meta.season), entry_id: num(entry.id ?? entry.entry_id), gw: A, next_gw: A,
    bank: num(entry.bank) ?? 0, ft: num(entry.ft) ?? E.FT_WEEKLY, chips_available: entry.chips_available || [],
    chips_used: entry.chips_used || [], horizon, squad: entry.squad || [],
  };
  return {
    ...rest, A, gws: ids(meta.horizon).length ? ids(meta.horizon) : E.planGws(base, 4), base, players,
    seeds: E.decodeSeeds(bundle.seeds), noise: num(model?.noise) ?? E.noiseFloor(meta, A) ?? 0,
  };
}

// ---------------------------------------------------------------- the one measure, and the planner's count

/** The one measure for a gap between two plans (engine.compareRoads): forecast points minus hits over the GWs both
 *  cover, what you score, labelled by the pooled delta against the noise floor. The planner's own terms (per-transfer
 *  charge, banked transfers, bench cover) are in plannerOf, not here. ctx: planInputs. */
export const compare = (ctx, a, b) => E.compareRoads(a, b, { seeds: ctx.seeds, noise: ctx.noise, xp: lookupOf(ctx).xp, ref: E.anchorRef(ctx.meta?.scale?.k_h, ctx.A) });

/** Transfers a plan makes over its weeks (a Road's buys, a GwState's or view week's moves). */
export const transfersOf = (plan) => (plan?.weeks ?? plan?.gws ?? []).reduce((n, w) => n + (w.moves ?? w.bought ?? w.in ?? []).length, 0);
/** Hits a plan takes over its weeks (a Road's, a GwState's or view week's). */
export const hitsOf = (plan) => (plan?.weeks ?? plan?.gws ?? []).reduce((n, w) => n + (num(w.hits) ?? 0), 0);

/**
 * The planner's own count (engine.objectiveOf) of plan a against plan b: {delta, ref (delta with each round back on
 * the anchor's scale: what a label reads), terms {term: Δ}, hits {gap (a's hits the points charge beyond its count,
 * less b's: hitGap), a, b (unpricedHits)}} | null when either is not a road the solver gave (a phone estimate, an
 * older stored plan). Both must be solved on the same data (the caller checks: the plan's roads version).
 */
export function plannerOf(a, b) {
  const oa = E.objectiveOf(a), ob = E.objectiveOf(b);
  if (!oa || !ob) return null;
  const terms = {};
  for (const k of new Set([...Object.keys(oa.terms), ...Object.keys(ob.terms)])) if (!SLACK.includes(k)) terms[k] = (oa.terms[k] ?? 0) - (ob.terms[k] ?? 0);
  // two roads of the same data are on one scale: a plan stored before plan memory kept its k_h reads its partner's
  const onScale = (r, o) => (r && !Array.isArray(r.k_h) && Array.isArray(o?.k_h) ? { ...r, k_h: o.k_h } : r);
  const ra = E.objectiveOf(onScale(a, b), { atAnchor: true }).terms, rb = E.objectiveOf(onScale(b, a), { atAnchor: true }).terms;
  return {
    delta: Object.values(terms).reduce((s, x) => s + x, 0), terms,
    ref: Object.keys(terms).reduce((s, k) => s + (ra[k] ?? 0) - (rb[k] ?? 0), 0),
    pts: Object.keys(terms).filter((k) => POINTS.includes(k)).reduce((s, k) => s + (ra[k] ?? 0) - (rb[k] ?? 0), 0),
    hits: { gap: hitGap(a) - hitGap(b), a: unpricedHits(a), b: unpricedHits(b), n: hitsOf(a) - hitsOf(b) },
  };
}

/** Two solved roads' own count over the window the solver committed GW g from (Road.windows[g], on the shown scale):
 *  plannerOf over those windows → {delta, ref, terms} | null where either has no window for g (an estimate, your plan's
 *  ≈, a road stored before). */
export function windowGap(a, b, g) {
  const win = (r) => (r?.windows?.[g] ? { ...r, objective: r.windows[g], weeks: [] } : null);
  const wa = win(a), wb = win(b);
  return wa && wb ? plannerOf(wa, wb) : null;
}
/**
 * A choice's number (owner, 2026-10-28: the solver's own count, own window): compare's `cmp` with its gap the solver's
 * count over the window it committed GW g from (windowGap), its label that count on the anchor's scale against the
 * noise floor, no per-run votes; the points kept as `pts`. As it was where either road has no window for g. Every term,
 * a transfer choice's too: one count numbers, orders and lights the choices, so the week's best is the move the solver
 * commits (main.py --show-plan; owner, 2026-10-30) and two it counts level read level (owner, 2026-11-02: points alone
 * left a later move's spent free transfer uncounted, Mbeumo → Rice +1.7 against Calvert-Lewin → Evanilson +0.7, tied).
 * The gap is the count on the anchor's scale (`ref`: the solver's own count ×k of GW g's forecast, one factor for
 * every round, so it orders as the solver does), never each round on its own k_h (`delta`): that weighs the later
 * rounds' points more than the free transfers' terms and can turn the solver's pick round (2026-11-02, Murillo → Hill
 * +0.06 to the solver, −0.03 on the rounds' scales: "Rolling is best"). The number drawn (`shown`) is that count's
 * points (POINTS: its XI, bench cover, armbands, subs and −4s on the same anchor's scale, so Cherki → Tavernier's bench
 * cover still counts), never its free-transfer terms (owner, 2026-11-02, "why the move only +0.1 xp": Murillo → Hill
 * +2.0 points, the count's +0.1 net of the transfer it spends; "Points, FT cost apart" picked, the cost unwritten: a
 * −4 its mark alone). ctx: planInputs.
 */
export function counted(ctx, cmp, a, b, g) {
  const w = cmp ? windowGap(a, b, g) : null;
  if (!w) return cmp;
  return { ...cmp, delta: w.ref, ref: w.ref, shown: w.pts, label: E.verdictLabel(w.ref, ctx.noise), winner: w.ref > EPS ? 'a' : w.ref < -EPS ? 'b' : null,
    votes: null, against: null, lead: null, count: w.terms, pts: cmp };
}
/** The number a choice's comparison draws: the points of the solver's count where it counted it (counted's `shown`:
 *  its order and light stay the whole count, `delta`), else its gap. */
export const shownDelta = (cmp) => cmp?.shown ?? cmp?.delta;
/** What a solved road's hits cost in points (HIT_COST a hit: what compare counts) beyond what its planner's count
 *  charged for them (its objective's hit term, −hit_cost a hit: solve.py add_ft): FPL's 4 less the planner's price
 *  where it priced them (the bundle's meta.hit_charge on the shown scale: above 4 once ×k), all 4 where it never
 *  counted them (memory.forcedHits). */
const hitGap = (road) => (road?.weeks || []).reduce((s, w) => s + E.HIT_COST * (num(w.hits) ?? 0) + (num(road.objective?.hit?.[w.gw]) ?? 0), 0);
/**
 * A solved road's hits, FPL's against its planner's, matched over the window (the solver spends every free transfer
 * before a hit, solve.py add_ft hit_ok, so they agree GW by GW and a road that parts says where: README Notes) → [{gw,
 * hits (FPL's), lp (the planner's), from [{gw, hits}] (FPL's hits here the planner booked in another GW), to [{gw,
 * hits}] (the planner's hits here FPL books elsewhere), unpriced (FPL's hits here no planner hit covers)}] | null (no
 * planner's count). The planner's per GW is road.planner.hits (api/mobile.py with_planner: its hit term over the price
 * it charged); a road stored before it reads one hit at least wherever its count charged one. An FPL hit no planner
 * hit of its own GW covers takes the nearest one of another GW (the earlier on a tie).
 */
export function hitBook(road) {
  if (!road?.objective || !road.weeks?.length) return null;
  const own = road.planner?.hits;
  const weeks = road.weeks.map((w) => {
    const g = Number(w.gw), hits = num(w.hits) ?? 0;
    const lp = own ? num(own[g]) ?? 0 : (num(road.objective.hit?.[g]) ?? 0) < -EPS ? Math.max(hits, 1) : 0;
    return { gw: g, hits, lp, from: [], to: [], unpriced: 0 };
  }).sort((a, b) => a.gw - b.gw);
  const spare = weeks.flatMap((w) => Array(Math.max(0, w.lp - w.hits)).fill(w));
  const add = (list, gw) => { const x = list.find((y) => y.gw === gw); if (x) x.hits += 1; else list.push({ gw, hits: 1 }); };
  for (const w of weeks) {
    for (let i = w.lp; i < w.hits; i++) {
      const j = spare.reduce((b, s, k) => (b < 0 || Math.abs(s.gw - w.gw) < Math.abs(spare[b].gw - w.gw) ? k : b), -1);
      if (j < 0) { w.unpriced += 1; continue; }
      const [s] = spare.splice(j, 1);
      add(w.from, s.gw);
      add(s.to, w.gw);
    }
  }
  return weeks;
}
/** The weeks of a solved road whose hits its planner's count has no charge for: [{gw, hits}] (hitBook's unpriced). */
const unpricedHits = (road) => (hitBook(road) || []).filter((w) => w.unpriced > 0).map((w) => ({ gw: w.gw, hits: w.unpriced }));
/** Objective terms that are no plan's merit, left out of the planner's count: ft_short, a slack an older solver paid
 *  (−10000 a unit) in the round after a Free Hit; solve.py add_ft rolls free transfers on since, so a road stored
 *  before keeps it out. */
const SLACK = ['ft_short'];
/** The count's points (solve.py's own tags): the XI's, the bench's, the armbands', the doubt rule's subs and the hits'
 *  −4s, on the anchor's scale; never what it charges or credits a free transfer (ft_cost, ft_value) nor its shaping
 *  terms (owner, 2026-11-02, "why the move only +0.1 xp": Murillo → Hill +2.0 points, −2.1 for the transfer it spends). */
const POINTS = ['xi', 'bench', 'cap', 'vice', 'doubt_sub', 'hit'];

const LEVEL = 0.005;  // the planner's count rounds to 0.00: level whatever the noise (above it, level is the coin band)
const CROWD = ['eo', 'own_cal', 'cap_top', 'cap_tie'];

/** What the planner's count has and the points don't, signed the planner's way `dir`, biggest first: [[part, Δ]]. */
function reasonParts(planner, dir) {
  const t = planner?.terms || {};
  const hg = planner?.hits ?? { gap: 0, a: [], b: [] };
  const crowd = CROWD.reduce((x, k) => x + (t[k] ?? 0), 0);
  return [['ft_cost', t.ft_cost ?? 0], ['ft_value', t.ft_value ?? 0], ['bench', t.bench ?? 0], ['hit', hg.gap], ['crowd', crowd]]
    .filter(([, v]) => Math.sign(v) === dir && Math.abs(v) >= LEVEL).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
}

/** The hits behind the planner's way `dir` that its count never charged (plannerOf's hits), in words ("a −4 in GW8"), or
 *  '': the planner rates a better (dir > 0) for hits of a's it never counted, or worse for b's. */
function unpricedWhere(planner, dir) {
  const hg = planner?.hits ?? { a: [], b: [] };
  const [own, other] = dir > 0 ? [hg.a, hg.b] : [hg.b, hg.a];
  return forcedNew(own, other).map((x) => `${hitsWords(x.hits)} in GW${x.gw}`).join(' and ');
}

/**
 * Why the planner's count parts from the points (the biggest of what one counts and the other doesn't, signed the
 * planner's way): a phrase. Per-transfer charge, banked transfers, bench and crowd terms are the planner's alone; a
 * hit is in both (compare charges HIT_COST, the planner its hit term at the solver's price) except where the planner
 * never charged one (plannerOf's hits): never "a stronger bench" for a plan rated better because its count left out a
 * −4.
 */
function plannerReason(planner, dTransfers, dir) {
  const k = reasonParts(planner, dir)[0]?.[0] ?? (dTransfers ? 'ft_cost' : null);
  const n = Math.abs(dTransfers);
  if (k === 'ft_cost' && n) return `it uses ${n} ${dTransfers > 0 ? 'more' : 'fewer'} transfer${n === 1 ? '' : 's'}`;
  if (k === 'ft_value' || k === 'ft_cost') return dir < 0 ? 'it keeps fewer free transfers for later weeks' : 'it keeps more free transfers for later weeks';
  if (k === 'bench') return dir < 0 ? 'it leaves a weaker bench' : 'it leaves a stronger bench';
  if (k === 'hit') {
    const where = unpricedWhere(planner, dir);
    if (where) return dir > 0 ? `it takes ${where} that Forkcast didn't plan for` : `the plan before took ${where} that Forkcast didn't plan for`;
    return dir < 0 ? 'it takes a hit' : 'it takes no hit';
  }
  if (k === 'crowd') return dir < 0 ? 'it strays from the crowd (ownership, the captain poll)' : 'it follows the crowd (ownership, the captain poll)';
  return dir < 0 ? 'it costs free transfers or bench strength' : 'it saves free transfers or bench strength';
}

/**
 * A change of plan in words (Ahead's verdict toasts, plan memory's resumed one): the number is forecast points minus
 * hits (`cmp`, compare), and the words never contradict the planner's count. planner: plannerOf(new, before) when both
 * are solved roads of these data; without it, dir stands in: a rule added ('restrict') can't make the plan better by
 * the planner's count, nor one lifted ('relax') worse. When points and planner part, the line says so: "Plan without
 * Xhaka · +0.7 pts · Forkcast rates it worse: it uses 1 more transfer". noise: the noise floor (a count the other way
 * inside it is level: engine.verdictLabel's coin band). transfers: [before, after]. gws: the window (said "over
 * GW6–9"; cmp.gws by default). total: names the number as what your total moves by, "total −2.8" (COPY.changeNum).
 */
export function changeText(what, cmp, { dir = null, gws = null, transfers = [0, 0], planner = null, noise = 0, total = false } = {}) {
  let p = planner ? planner.delta : null;
  // a rule added can't beat the plan without it by the planner's count (its optimum), nor a lifted one lose: a
  // count the other way is the solver's tolerance, level
  if (p !== null && ((dir === 'restrict' && p > 0) || (dir === 'relax' && p < 0))) p = 0;
  const sign = p !== null ? (Math.abs(p) < LEVEL ? 0 : Math.sign(p)) : dir === 'restrict' ? -1 : dir === 'relax' ? 1 : null;
  const n = gws ?? cmp.gws;
  const pointsWay = cmp.delta > EPS ? 1 : cmp.delta < -EPS ? -1 : 0;
  if (sign === null || pointsWay === 0 || sign === pointsWay) return COPY.change(what, cmp.delta, cmp.label, n, total);
  const dT = transfers[1] - transfers[0];
  // against the noise floor on the anchor's scale (plannerOf's ref), as a label reads it: a count the other way inside
  // it is level, the coin band every "level" is (never "slightly")
  if (sign === 0 || (p !== null && E.verdictLabel(planner.ref ?? p, noise) === 'coin')) return COPY.changeLevel(what, cmp.delta, n, plannerReason(planner, dT, -pointsWay), total);
  // outside it, better or worse; without the planner's count (an estimate: plan memory's resumed toast) only dir is
  // known: a rule added is no better by it, one lifted no worse (never a count it doesn't have)
  return COPY.changeAgainst(what, cmp.delta, n, plannerReason(planner, dT, sign), p === null ? (sign > 0 ? 'no worse' : 'no better') : sign > 0 ? 'better' : 'worse', total);
}

/** The forcedHits entries of `now` that `was` doesn't have (the same GW, the same hits): what a plan brings. */
export const forcedNew = (now = [], was = []) => (now || []).filter((f) => !(was || []).some((x) => x.gw === f.gw && x.hits === f.hits));

/**
 * An edit's verdict line with the hits its new plan (memory.forcedHits, `now`) takes that its rules don't allow and
 * the plan before (`was`) didn't, said plainly after it: "… The plan takes a −4 in GW8 your rules don't allow (no plan
 * without it)."
 */
export function withForced(line, now = [], was = []) {
  const fresh = forcedNew(now, was);
  if (!fresh.length) return line;
  const t = fresh.map(COPY.hitForbiddenShort).join('; ');
  return `${sentence(line)} ${sentence(t.charAt(0).toUpperCase() + t.slice(1))}`;
}

/**
 * What your rules cost (the "Your rules" strip): the model's road against your plan's road by the planner's count,
 * both solved on these data, never your lineup (phone-only). The model's road is the planner's best without your
 * rules, so the cost is ≥ 0 by construction (a solver tolerance below 0 reads 0). → {cost, label (cost against the
 * noise floor), points (your road − the model's in the one measure), transfers (yours − the model's)} | null when
 * either road has no planner's count.
 */
export function rulesCost(ctx, yours, model) {
  const pl = plannerOf(yours, model);
  if (!pl) return null;
  const cost = Math.max(0, -pl.delta), atA = Math.max(0, -pl.ref);
  return {
    cost: cost < LEVEL ? 0 : cost, label: E.verdictLabel(atA < LEVEL ? 0 : atA, ctx.noise ?? 0), points: compare(ctx, yours, model).delta,
    transfers: transfersOf(yours) - transfersOf(model), planner: pl,
  };
}

// ---------------------------------------------------------------- the armband

/** GW `week.gw`'s lineup as a one-week road, `lu` ({captain}, a sub's {xi, bench, captain}) over it: a lineup gap moves
 *  the lineup only. */
const lineupRoad = (week, lu = {}) => ({ weeks: [{ gw: Number(week.gw), xi: week.xi, bench: week.bench, captain: week.captain, chip: week.chip ?? null, hits: 0, ...lu }] });

/** Captain `c` against captain `vs` in one week (a Road week or a view week) in the one measure (compare): the pooled
 *  forecast of the captain's extra points. The C-badge drag tip reads it. */
export const captainGap = (ctx, week, c, vs) => compare(ctx, lineupRoad(week, { captain: c }), lineupRoad(week, { captain: vs }));
/** Sub `s` (ahead.subLineup's {xi, bench, captain}) against the week's lineup now, in the one measure: what the sub
 *  changes the week's points by, the number its toast says (ahead.sub). A sub's list reads it. */
export const subGap = (ctx, week, s) => compare(ctx, lineupRoad(week, { xi: s.xi, bench: s.bench, captain: s.captain }), lineupRoad(week));

// ---------------------------------------------------------------- your plan as you play it

/**
 * A road as your plan on the phone: its draft (engine.roadToDraft) with your GW-A lineup (memory's accepted.lineup:
 * the XI and bench of a sub, the armband; phone-only, the solver has no force-captain flag), evaluated over the
 * planned GWs. engine.evaluate maps a saved XI and bench onto the road's squad (a sold player's slot goes to his
 * replacement) or, when they no longer fit, keeps the road's; a captain or vice outside the XI falls back (lineupFor).
 * The one path for GW A on the phone.
 */
export function planFromRoad(ctx, road, lineup = {}) {
  let draft = E.roadToDraft(road, ctx.base, { players: ctx.players });
  const w = weekAt(road, ctx.A);
  if (w && ['captain', 'vice', 'xi', 'bench'].some((k) => lineup?.[k] != null)) draft = E.setLineup(draft, ctx.A, E.applyLineup(w, lineup, lookupOf(ctx)));
  const evaluation = E.evaluate({ base: ctx.base, players: ctx.players, draft, horizon: ctx.gws });
  return { draft, evaluation, week: evaluation.gws.find((s) => s.gw === ctx.A) ?? null };
}

/** GW A's moves as you make them in FPL (a GwState's: the engine's legal ones; the price watch's). */
export const handoffMoves = (week) => (week?.moves || []).filter((m) => m.ok !== false);
