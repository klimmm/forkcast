// engine.js: phone logic: verdicts, compares, seeds

import { CHIPS, FT_CAP, HIT_COST, LAST_ROUND, ids, num, sum } from './squad.js';
import { weekPoints } from './evaluate.js';
import { draftFromSolverResult, solverRows } from './solver.js';

// ---------------------------------------------------------------- phone logic (IPHONE_DESIGN §7.6)

/**
 * Verdict gates: × noise the pooled |delta| must reach. The runs never move a label (no gain from voting on them in a
 * rolling backtest, F8): 25/25 runs on a +0.2 move still reads Coin flip.
 */
export const VERDICT = Object.freeze({ clear: 2, lean: 1 });
const EPS = 1e-6;

/**
 * Noise floor of a solve: the bundle's meta.noise, else the solver's per-transfer charge at the anchor,
 * tau_by_anchor[gw] (rules.py:122-129), else meta.tau. Read from each result, never hard-coded.
 */
export function noiseFloor(meta, gw) {
  return num(meta?.noise) ?? num(meta?.tau_by_anchor?.[gw]) ?? num(meta?.tau);
}

const SEEDS = new WeakMap();
const isSeeds = (x) => x && typeof x.at === 'function' && x.data instanceof Float32Array;

/** base64 of little-endian Float32 values ('<f4'), read the same on any host. */
function f32FromBase64(b64) {
  const bin = atob(b64);
  if (bin.length % 4) throw new Error(`seeds: ${bin.length} bytes is not a Float32 array`);
  const dv = new DataView(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) dv.setUint8(i, bin.charCodeAt(i));
  const out = new Float32Array(bin.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = dv.getFloat32(i * 4, true);
  return out;
}

/** The per-run matrix as an accessor (memoised per payload object); null without one. NaN cells read null. */
export function decodeSeeds(seeds) {
  if (!seeds || typeof seeds !== 'object') return null;
  if (isSeeds(seeds)) return seeds;
  let S = SEEDS.get(seeds);
  if (S) return S;
  const pids = ids(seeds.ids), gws = ids(seeds.gws);
  const runs = Math.max(0, Math.round(num(seeds.runs) ?? 0));
  const data = seeds.data instanceof Float32Array ? seeds.data
    : Array.isArray(seeds.data) ? Float32Array.from(seeds.data, (v) => num(v) ?? NaN)
      : typeof seeds.f32 === 'string' ? f32FromBase64(seeds.f32) : new Float32Array(0);
  if (data.length !== pids.length * gws.length * runs) {
    throw new Error(`seeds: ${data.length} values for ${pids.length} players × ${gws.length} GWs × ${runs} runs`);
  }
  const pi = new Map(pids.map((p, i) => [p, i]));
  const gi = new Map(gws.map((g, i) => [g, i]));
  const at0 = (id, gw) => {
    const i = pi.get(Number(id)), j = gi.get(Number(gw));
    return i === undefined || j === undefined ? -1 : (i * gws.length + j) * runs;
  };
  S = Object.freeze({
    ids: pids, gws, runs, data,
    has: (id) => pi.has(Number(id)),
    /** where (id, gw)'s runs start in data (run r at offset + r), or -1 if the matrix has no such cell */
    offset: at0,
    /** run r's xP for GW gw (null when the matrix has no such cell) */
    at(id, gw, r) {
      const o = at0(id, gw);
      if (o < 0 || !(r >= 0 && r < runs)) return null;
      const v = data[o + r];
      return Number.isFinite(v) ? v : null;
    },
    /** the mean over runs (null when no run has the cell) */
    mean(id, gw) {
      const o = at0(id, gw);
      if (o < 0) return null;
      let s = 0, n = 0;
      for (let r = 0; r < runs; r++) { const v = data[o + r]; if (Number.isFinite(v)) { s += v; n++; } }
      return n ? s / n : null;
    },
  });
  SEEDS.set(seeds, S);
  return S;
}

/** (id, gw) → forecast run r's xP, else fallback(id, gw) (e.g. the mean) where the matrix has none. */
export function runXp(seeds, r, fallback) {
  const S = decodeSeeds(seeds);
  return (id, gw) => S?.at(id, gw, r) ?? (fallback ? num(fallback(id, gw)) : null);
}

/** Whether xpOf scores every player a week counts (its XI, the captain, the bench under BB). */
const scores = (week, xpOf) => [...week.xi, ...(week.chip === 'bb' ? week.bench : [])].every((p) => num(xpOf(p, week.gw)) !== null);

/**
 * A plan's weeks, scorable: {gw, xi, bench, captain, chip, hits, ft, used, points, meanOf(id, gw)}. points is the
 * week's own, else weekPoints on the mean when meanOf scores every player, else the Road week's pred − hits. meanOf
 * reads a GwState's own xp map, else `xp`.
 */
function planWeeks(plan, xp) {
  const list = Array.isArray(plan?.gws) ? plan.gws : Array.isArray(plan?.weeks) ? plan.weeks : Array.isArray(plan) ? plan : [];
  return list.filter((w) => num(w?.gw) !== null).map((w) => {
    const own = w.xp && typeof w.xp === 'object' && !Array.isArray(w.xp) ? w.xp : null;
    const meanOf = (id, g) => (own && num(own[id]) !== null ? Number(own[id]) : xp ? num(xp(id, g)) : null);
    const week = {
      gw: Number(w.gw), xi: ids(w.xi), bench: ids(w.bench), captain: num(w.captain),
      chip: CHIPS.includes(w.chip) ? w.chip : null, hits: num(w.hits) ?? 0,
      ft: num(w.ft ?? w.ft_avail), used: num(w.used ?? w.ft_used),
    };
    const pred = num(w.pred);
    const points = num(w.points) ?? (pred === null || scores(week, meanOf) ? weekPoints(week, meanOf) : pred - HIT_COST * week.hits);
    return { ...week, points, meanOf, src: w, xpOf: xp };
  }).sort((a, b) => a.gw - b.gw);
}

/**
 * The solver's credit for the free transfers a plan carries out of its window at its last week: solve.py:615-621
 * ft_value, one slot per transfer up to FT_CAP − 1 at `rate`; none under a wildcard or free hit, at GW38, or without a
 * rate.
 */
export function bankCredit(week, rate) {
  const r = num(rate), ft = num(week?.ft ?? week?.ft_avail), used = num(week?.used ?? week?.ft_used);
  if (!(r > 0) || ft === null || used === null || week?.chip === 'wc' || week?.chip === 'fh' || Number(week?.gw) >= LAST_ROUND) return 0;
  return r * Math.min(FT_CAP - 1, Math.max(0, ft - used));
}

/** A plan's mean points per GW, its last GW's banked-transfer credit and the sum: {gws, points, bank, total}. */
export function planPoints(plan, { xp, ftValue } = {}) {
  const weeks = planWeeks(plan, xp);
  const points = weeks.map((w) => w.points);
  const bank = weeks.length ? bankCredit(weeks.at(-1), ftValue) : 0;
  return { gws: weeks.map((w) => w.gw), points, bank, total: sum(points) + bank };
}

/** Per week, each run's points (Float64Array(runs)) with the week's lineup fixed: weekPoints with run r's xP (S.at),
 *  else the mean; a player's cells are found once per week (S.offset) and read straight from the matrix. */
function runWeeks(weeks, S) {
  if (typeof S.offset !== 'function') {
    return weeks.map((w) => {
      const out = new Float64Array(S.runs);
      for (let r = 0; r < S.runs; r++) out[r] = weekPoints(w, (id, g) => S.at(id, g, r) ?? w.meanOf(id, g));
      return out;
    });
  }
  const { data, runs } = S;
  return weeks.map((w) => {
    // a week (never changed in place) scored on these runs and this mean once: a plan compared with many is not scored
    // again for each
    const kept = w.src && RUN_WEEKS.get(w.src);
    if (kept && kept.S === S && kept.xp === w.xpOf) return kept.out;
    const g = w.gw;
    // a player's cells: his offset in the matrix, and the mean that fills a run without a value (weekPoints' v: 0 when
    // neither scores him)
    const col = (p) => ({ o: S.offset(p, g), fill: undefined, p });
    const val = (c, r) => {
      if (c.o >= 0) { const v = data[c.o + r]; if (Number.isFinite(v)) return v; }
      if (c.fill === undefined) c.fill = num(w.meanOf(c.p, g)) ?? 0;
      return c.fill;
    };
    const xi = ids(w.xi).map(col);
    const cap = num(w.captain);
    const capCol = cap === null ? null : col(cap);
    const mult = w.chip === 'tc' ? 2 : 1;
    const bench = w.chip === 'bb' ? ids(w.bench).map(col) : null;
    const hit = HIT_COST * (num(w.hits) ?? 0);
    const out = new Float64Array(runs);
    for (let r = 0; r < runs; r++) {
      let xiPts = 0;
      for (const c of xi) xiPts += val(c, r);
      const capPts = capCol === null ? 0 : val(capCol, r) * mult;
      let benchPts = 0;
      if (bench) for (const c of bench) benchPts += val(c, r);
      out[r] = xiPts + capPts + benchPts - hit;
    }
    if (w.src) RUN_WEEKS.set(w.src, { S, xp: w.xpOf, out });
    return out;
  });
}
const RUN_WEEKS = new WeakMap();

/** Window points per forecast run (lineups fixed): Float32Array(runs); empty without seeds. */
export function runTotals(plan, seeds, { xp } = {}) {
  const S = decodeSeeds(seeds);
  if (!S) return new Float32Array(0);
  const per = runWeeks(planWeeks(plan, xp), S);
  const out = new Float32Array(S.runs);
  for (let r = 0; r < S.runs; r++) out[r] = sum(per.map((a) => a[r]));
  return out;
}

/**
 * F15b by horizon: the plan service shows each forecast value ×k_h of its horizon h = GW − anchor (api/scale.py) and
 * the noise floor ×k_0. A gap is labelled on its weeks put back on the anchor's scale, ×k_0/k_h (hits added back first
 * and taken again), so Clear / Lean / Coin flip read as on k_0 alone. kh: the scale's k by horizon (meta.scale.k_h, a
 * road's own k_h); h before the anchor reads k_0, past the deepest the deepest's. → (gw) → factor; 1 without a scale
 * by horizon.
 */
export function anchorRef(kh, anchor) {
  const k = Array.isArray(kh) ? kh.map(num) : [];
  const a = num(anchor);
  if (k.length < 2 || a === null || !k.every((x) => x > 0)) return null;
  return (gw) => k[0] / k[Math.min(Math.max(Number(gw) - a, 0), k.length - 1)];
}

/** 'clear' when the pooled |delta| ≥ 2·noise, 'lean' when ≥ noise, else 'coin' (a zero delta always). */
export function verdictLabel(delta, noise) {
  const d = Math.abs(num(delta) ?? 0), n = Math.max(0, num(noise) ?? 0);
  if (d <= EPS) return 'coin';
  if (d >= VERDICT.clear * n) return 'clear';
  if (d >= VERDICT.lean * n) return 'lean';
  return 'coin';
}

/**
 * When a road's cumulative gain stops being behind: 'ahead' (never behind; gw = first GW it leads), 'pays' (behind,
 * then ≥ 0 from gw on), 'never' (behind at the end), 'level' (all 0).
 */
export function payback(cum, gws) {
  const n = cum?.length ?? 0;
  if (!n) return null;
  let k = n;
  while (k > 0 && cum[k - 1] >= -EPS) k--;
  const last = gws[n - 1];
  if (k === n) return { kind: 'never', gw: last, text: `Doesn't pay back by GW${last}` };
  if (k > 0) return { kind: 'pays', gw: gws[k], text: `Pays back GW${gws[k]}` };
  const i = cum.findIndex((c) => c > EPS);
  if (i < 0) return { kind: 'level', gw: last, text: `Level through GW${last}` };
  return { kind: 'ahead', gw: gws[i], text: `Ahead from GW${gws[i]}` };
}

/**
 * Plan a against plan b over the GWs both cover, in the one measure (header): points plus the banked-transfer credit
 * at the last common GW (`ftValue` per transfer). The label is the pooled delta against the noise floor; per-run votes
 * are information.
 */
export function compareRoads(a, b, { seeds, noise, xp, ftValue, ref = null } = {}) {
  const wb = new Map(planWeeks(b, xp).map((w) => [w.gw, w]));
  const A = planWeeks(a, xp).filter((w) => wb.has(w.gw));
  const B = A.map((w) => wb.get(w.gw));
  const gws = A.map((w) => w.gw);
  const perGw = A.map((w, i) => w.points - B[i].points);
  const bank = A.length ? bankCredit(A.at(-1), ftValue) - bankCredit(B.at(-1), ftValue) : 0;
  const cum = [];
  perGw.reduce((s, x, i) => (cum[i] = s + x + (i === perGw.length - 1 ? bank : 0)), 0);
  const delta = cum.at(-1) ?? 0;
  // the gap on the anchor's scale (anchorRef): what the label reads. A week's gap d (points minus hits) is (d +
  // 4·Δhits)·f − 4·Δhits there, f = ref(gw); the credit at the last week ×its f. onA(d per week) → the window's gap
  const f = A.map((w) => (ref ? ref(w.gw) : 1));
  const fixed = sum(A.map((w, i) => HIT_COST * (w.hits - B[i].hits) * (f[i] - 1))) + (A.length ? bank * f.at(-1) : 0);
  const onA = (d) => (!ref ? sum(d) + bank : sum(d.map((x, i) => x * f[i])) + fixed);
  const atA = !ref ? delta : onA(perGw);
  const S = decodeSeeds(seeds);
  const runs = S?.runs ?? 0;
  let votes = null, against = null, diffs = null, diffsRef = null, cumRuns = null;
  if (runs) {
    const ra = runWeeks(A, S), rb = runWeeks(B, S);
    diffs = new Float32Array(runs);
    diffsRef = ref ? new Float32Array(runs) : diffs;
    cumRuns = [];
    votes = 0; against = 0;
    for (let r = 0; r < runs; r++) {
      let s = 0;
      const d = gws.map((_, i) => ra[i][r] - rb[i][r]);
      const c = d.map((x, i) => (s += x + (i === gws.length - 1 ? bank : 0)));
      diffs[r] = s;
      if (ref) diffsRef[r] = onA(d);
      cumRuns.push(c);
      if (s > EPS) votes++;
      else if (s < -EPS) against++;
    }
  }
  const lead = runs ? (delta >= 0 ? votes : against) : null;
  return {
    gws, delta, ref: atA, points: sum(perGw), bank, perGw, cum, votes, against, lead, runs,
    label: verdictLabel(atA, noise), payback: payback(cum, gws), diffs, diffsRef, cumRuns,
    winner: delta > EPS ? 'a' : delta < -EPS ? 'b' : null,
  };
}



/**
 * A solved Road's own objective (Road.objective = the anchor solve's {term: {round: value}}, api/mobile.py make_road):
 * the planner's count of the plan: xi and cap (forecast points), bench, ft_cost (solve.py:601-606), ft_value
 * (:615-621), hit and the crowd terms. → {terms: {term: Σ over rounds}, total} | null (no objective: an estimate, an
 * older road).
 */
export function objectiveOf(road, { atAnchor = false } = {}) {
  const o = road?.objective;
  if (!o || typeof o !== 'object' || !Object.keys(o).length) return null;
  const ref = atAnchor ? anchorRef(road.k_h, roadAnchor(road)) : null;
  const w = ref ?? (() => 1);
  const terms = Object.fromEntries(Object.entries(o).map(([k, by]) => [k, sum(Object.entries(by || {}).map(([g, v]) => (num(v) ?? 0) * w(g)))]));
  return { terms, total: sum(Object.values(terms)) };
}

/** A road's forecast anchor (api/scale.py _anchor): the round its solve is made from (values.from_r), else its first
 *  week. */
export function roadAnchor(road) {
  const a = road?.values?.from_r;
  if (Number.isInteger(a)) return a;
  const gws = (road?.weeks || []).map((w) => num(w?.gw)).filter((g) => g !== null);
  return gws.length ? Math.min(...gws) : null;
}

const WEEK_FIELDS = ['gw', 'in', 'out', 'xi', 'bench', 'captain', 'vice', 'chip', 'bank', 'ft_avail', 'ft_used', 'hits', 'pred'];
/** A tap result as a compact Road (IPHONE_DESIGN §7.4): its rows from meta.from, anchor objective, warnings. */
export function roadFromResult(result, { key = 'base', job = null, values = null } = {}) {
  const rows = solverRows(result);
  const from = rows[0]?.gw;
  return {
    key, job, values, argv: result?.meta?.argv || result?.argv || [],
    weeks: rows.map(({ gw, t }) => ({
      ...Object.fromEntries(WEEK_FIELDS.map((k) => [k, t?.[k] ?? null])),
      gw, in: ids(t?.in), out: ids(t?.out), xi: ids(t?.xi), bench: ids(t?.bench),
    })),
    objective: (from === undefined ? null : result?.anchors?.[from]?.objective) || {},
    warnings: result?.warnings || [],
  };
}

/** A Road in the tap result's shape: its first week committed, the rest its anchor's plan (solverRows). */
function resultOfRoad(road) {
  const weeks = (road?.weeks || []).filter((w) => num(w?.gw) !== null).sort((a, b) => a.gw - b.gw);
  const first = weeks[0];
  if (!first) return { meta: {}, committed: {}, anchors: {} };
  return {
    meta: { from: first.gw, to: first.gw, w: weeks.length, argv: road.argv || [], pool: road.values?.dir ?? null },
    committed: { [first.gw]: { team: first } },
    anchors: { [first.gw]: { plan: Object.fromEntries(weeks.slice(1).map((w) => [w.gw, w])) } },
  };
}

/**
 * A Road as a draft over `base` through draftFromSolverResult (the road's chips and lineups; `keep` pairs moves as
 * given). A Road has no player rows, so `players` must cover its buys.
 */
export function roadToDraft(road, base, { players, name, keep = [] } = {}) {
  return draftFromSolverResult(resultOfRoad(road), base, { players, keep, name: name ?? `Road ${road?.key ?? ''}`.trim() });
}
