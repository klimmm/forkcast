// Plan engine for the Planner (#/plan): pure, DOM-free functions over plain data. Node-testable
// (engine.test.mjs). No side effects at import time. Every FPL rule here mirrors the solver
// (ml/solver), cited as file:line, so a plan evaluated here reads the way the solver accounts it.
//
// ---------------------------------------------------------------- data
// base     GET /api/entry/<id> payload (or baseFromSolverResult): {season, entry_id, gw (first planned
//          GW), squad: [{id, pos, club, price, sell_price, purchase_price, xp, ...}], bank (£m), ft (FTs
//          at gw), chips_available, chips_used, horizon (GWs of squad[].xp)}; `fresh: true` marks a
//          from-scratch build whose first GW is free like a wildcard (team.py:88 `not self.pp`).
// players  GET /api/players payload {horizon, players: [{id, pos, club, price, xp[], ...}]}, a plain
//          array or Map of such rows, a column-oriented {horizon, fields, rows} (GET /api/m/bundle's
//          players), or a playerLookup(). A row's xp[i] is GW (row.xp_gws || payload.horizon)[i].
//          base.squad rows fill in players the payload lacks (it drops all-zero xp).
// seeds    the per-run forecast matrix (GET /api/m/bundle seeds, GET /api/m/seeds): {ids, gws, runs,
//          f32: base64 of little-endian Float32 [player][gw][run]} or {ids, gws, runs, data}; decodeSeeds()
//          turns it into an accessor (every function taking `seeds` accepts either form).
// Road     the plan service's compact solve (IPHONE_DESIGN §7.4): {key, job, values, argv, weeks: [Week],
//          objective, warnings}; Week {gw, in, out, xi, bench, captain, vice, chip, bank, ft_avail,
//          ft_used, hits, pred}. roadFromResult() builds one from a tap result.
// draft    {id, name, source, created, moves: {gw: [{out, in}]}, chips: {gw: 'wc'|'fh'|'bb'|'tc'},
//          lineups: {gw: {xi?, bench?, captain?, vice?}}, solver?}. GW keys are strings once in JSON.
//          Treat drafts (and base / players) as immutable: every function returns a new draft, and
//          lookups are memoised per (players, base) object.
// Money is £m at the edges and integer tenths inside (no float drift: 0.1 + 6.0 − 5.8).
// Prices are static over the plan, as in the solver's plan rows (solve_tap warnings): a player bought
// in the plan costs players[].price (the live FPL price; api/data.py _market) and sells for the same;
// one owned at the base sells for base.squad[].sell_price (FPL's half-profit price, api/entry.py:94).
//
// ---------------------------------------------------------------- exports
// createDraft({name = 'My plan', source = 'manual', id}) → draft
// duplicateDraft(draft, {name}) → draft (new id)
// clearMoves(draft) → draft without moves and lineups (chips kept)
// applyMove(draft, gw, outId, inId) → draft. Net per GW: A→B then B→C is A→C; A→B then B→A is no move.
// undoMove(draft, gw, indexOr{out, in}) → draft
// setChip(draft, gw, chip|null) → draft. A chip set elsewhere in the same half moves here (one per half).
// planChip(draft, gw, chip|null) → draft | null: setChip as a plan carries it (a free hit leaving a week takes its moves;
//   a wildcard leaving one: null, no estimate)
// setLineup(draft, gw, patch|null) → draft. patch {xi?, bench?, captain?, vice?}; null clears the GW,
//   a null field clears that field.
// evaluate({base, players, draft, horizon, xp, fixedLineups}) → {gws: [GwState], total, warnings, ok}
//   horizon: number of GWs from base.gw (default 4, max 5) or an explicit GW array.
//   xp: optional accessor (id, gw) → points that scores the plan (default: the players' mean xP), e.g.
//   runXp(seeds, r) for forecast run r. fixedLineups: lineups (best XI, bench order, armband fallbacks)
//   are picked on the mean xP, never on `xp`, so a run is scored with the mean plan's lineups (a
//   solver road's saved XI, captain and bench are kept either way). One scoring rule: weekPoints.
//   GwState {gw, chip, squad, xi, bench, captain, vice, bank (£m after the GW's moves), ft (FTs
//     available), transfers (net players bought), used (FTs used), hits, hitCost, moves: [{out, in,
//     sell, buy (£m), ok, reason, xpDelta}], bought, sold, points (XI + captain bonus + BB bench −
//     hits), gross (points before hits = the solver's `pred`), xp: {id: xp this GW}, sell: {id: £m
//     each squad player sells for}, warnings, ok}
//   banksOnly: the accounting alone (squad, bank, FTs, transfers, hits, moves, bought, sold; no lineups, xP or points,
//     and only the accounting's warnings): planBanks.
// planBanks({base, players, draft, horizon}) → {gw: bank (£m after the GW's moves)}: evaluate's banks, without scoring
// canBuy({base, players, draft, gw, outId, inId, horizon, evaluation}) → {ok, reason, code,
//   shortfall (£m, 0 when affordable)}. code: owned | missing | position | club | budget | clash |
//   unknown. Pass `evaluation` (evaluate() of the same inputs) when checking many candidates.
// canUseChip({base, draft, gw, chip}) → {ok, reason}
// bestXI(ids, xpOf, posOf) → {xi, bench, total}  (team.py:99-127 best_xi; bench GK first)
// validFormation(ids, posOf) → bool
// swapLineup(state, aId, bId, posOf) → {xi, bench} | null; swapCandidates(state, id, posOf) → ids
// applyLineup(week, saved {xi?, bench?, captain?, vice?}, players) → {xi, bench, captain, vice}: a saved lineup
//   on a week's squad as evaluate() plays it (repaired onto the squad, else the week's own)
// pairMoves(outIds, inIds, players, keep?) → [{out, in}] by position, dearest first, one price by id (null = unpaired);
//   keep's pairs as given
// draftFromSolverResult(result, base?, {name, players, keep}) → draft (moves, chips and the solver's lineups);
//   `players` (any players form) prices and positions players the result's rows don't describe
// baseFromSolverResult(result) → base at the solve's first GW (a fresh build: the built 15, fresh)
// playersFromSolverResult(result) → players payload {horizon, players} from a result's rows
// constraintsFromDraft(draft, {keep, avoid, horizonEnd, fromGw = 1, keepMoves = true, players})
//   → {must_have, exclude, warnings}: '--must-have' / '--exclude' strings "id@a-b,..." (players only
//   names the warnings)
// solveValues({base, draft, horizon, maxHits, maxHitsGw, hitCap, keepMoves, keep, avoid, pool, chipDefaults, players})
//   → {values, warnings}: the values for POST /api/jobs {kind: 'solve', values}; maxHits (--max-hits) and maxHitsGw
//   {gw: n} (--max-hits-gw "g:n,…") restrict hits, the rounds at the default cap left out (maxHits, else hitCap: the
//   solver's own default); never a --hit-cost (F17: the solver prices hits itself)
// playerLookup({base, players}) → {get, has, pos, club, price, priceT, sellT, xp, name, horizon}
// planGws(base, horizon) → [gw]; ftGrant(season, gw); nextFt(avail, used, grant); chipHalf(gw)
// Constants: FT_WEEKLY, FT_CAP, HIT_COST, MAX_PER_CLUB, HALF, CHIPS, MAX_HORIZON, LAST_ROUND, POS_LIMITS,
//   VERDICT {clear: noise ×, lean: noise ×}
//
// ---------------------------------------------------------------- phone logic (IPHONE_DESIGN §7.6)
// A "plan" below is an evaluate() result ({gws: [GwState]}), a Road ({weeks: [Week]}) or Ahead's view weeks.
// ONE measure for every comparison on the phone: forecast points minus hits, plus the banked-transfer value
// the solver itself credits (solve.py:615-621 ft_value: each free transfer carried out of the window, up to
// FT_CAP − 1, is worth the bundle's meta.ft_value). A week's points are its own `points` (a GwState, a view
// week: the engine's), else weekPoints() on the mean xP accessor when it scores every player, else (no
// accessor: a bare Road) Week.pred − 4 × hits. So two plans are always scored from one source (the bundle's
// xP), never the solver's pred on one side and the engine on the other (FOLLOWUPS QA-6).
// weekPoints({xi, bench, captain, chip, hits, gw}, xpOf) → XI + captain extra (×2 under TC) + bench
//   under BB − 4 × hits (team.py:256-264 calc_pts, the hit charged on the result)
// bankCredit(week, rate) → rate × the free transfers its GW carries out (0 under a WC / FH, at GW38, or
//   without a rate): the solver's ft_value credit at the window's last round
// decodeSeeds(seeds) → {ids, gws, runs, data, has(id), at(id, gw, r) → number|null, mean(id, gw)} | null
// runXp(seeds, r, fallback?) → (id, gw) → run r's xP (fallback(id, gw) where the matrix has none)
// planPoints(plan, {xp, ftValue}) → {gws, points, bank, total}: mean points per GW, the last GW's
//   banked-transfer credit, and their sum
// runTotals(plan, seeds, {xp}) → Float32Array(runs): window points per run, lineups fixed
// compareRoads(a, b, {seeds, noise, xp, ftValue, ref}) → {gws, delta, ref, points, bank, perGw, cum, votes,
//   against, lead, runs, label, payback, diffs, diffsRef, cumRuns, winner}: points = Σ mean points(a) − (b) (xP minus hits),
//   bank = their banked-transfer credits' difference, delta = points + bank (cum's last value; perGw is
//   points only); ref = delta with each week put back on the anchor's scale (ref = anchorRef(...); = delta
//   without one); label 'clear'|'lean'|'coin' from ref against the noise floor alone
//   (verdictLabel: the runs never move it, FOLLOWUPS F8); votes = runs where a beats b, against = where b
//   beats a, lead = the leader's count: agreement information only; payback {kind: 'ahead'|'pays'|'never'|
//   'level', gw, text}; diffs Float32Array(runs) of window deltas; diffsRef the same on the anchor's scale (each
//   run's weeks put back as ref is: what a run's gap reads against the noise floor; = diffs without ref);
//   cumRuns [run][gw] cumulative deltas;
//   winner 'a'|'b'|null. `xp` (mean accessor) scores the weeks and fills players the seed matrix lacks.
// verdictLabel(delta, noise) → 'clear'|'lean'|'coin'; payback(cum, gws) → {kind, gw, text}
// captainVotes(xi, gw, seeds) → {id: runs where he tops the XI}
// chipEstimate(plan, gw, chip, {xp}) → {chip, gw, value, ids, approx: true} | null (BB: planned bench,
//   TC: captain; WC / FH: null, they need a solve)
// objectiveOf(road, {atAnchor}) → {terms: {term: Σ rounds}, total} | null: a solved Road's own objective (the
//   planner's count); atAnchor: each round put back on the anchor's scale (the road's own k_h, anchorRef)
// anchorRef(kh, anchor) → (gw) → k_0 / k_h, h = gw − anchor (1 without a scale by horizon): a shown value of GW gw
//   back on the anchor's real-points scale, where the noise floor is (F15b by horizon: labels never move with h)
// noiseFloor(meta, gw) → meta.noise, else meta.tau_by_anchor[gw], else meta.tau
// roadFromResult(result, {key, job, values}) → Road; roadToDraft(road, base, {players, name, keep}) → draft

import { POS, posName } from '../ui.js';

// ---------------------------------------------------------------- the solver's rules

export const FT_WEEKLY = 1;      // rules.py:24 ft_weekly
export const FT_CAP = 5;         // rules.py:26 ft_cap
export const LAST_ROUND = 38;    // rules.py:28 last_round
export const HIT_COST = 4;       // rules.py:49 hit_cost_actual: what a hit REALLY costs in points (team.py:256: FPL's −4);
                                 // never sent to the solver, which prices a hit itself (F17: the bundle's meta.hit_cost)
export const MAX_PER_CLUB = 3;   // rules.py:93 max_per_team
export const HALF = 19;          // chips.py:48: chips refill after GW19
export const CHIPS = ['wc', 'fh', 'bb', 'tc'];  // chips.py:47 (that tuple's order is wc, bb, fh, tc)
export const MAX_HORIZON = 5;    // api/data.py:38 HORIZON: the pools forecast h0..h4
const SEASON_LONG = { 2024: ['fh', 'bb', 'tc'] };  // chips.py:50 _SEASON_LONG
/** {pos: [squad count, XI min, XI max]}: rules.py:103-108 pos_limits. */
export const POS_LIMITS = { GK: [2, 1, 1], DEF: [5, 3, 5], MID: [5, 2, 5], FWD: [3, 1, 3] };
const XI_SIZE = 11;              // rules.py:96 starter_size

/** FTs granted into GW gw: 5 at 2025's GW16 (rules.py:148-149), else the weekly one. */
export const ftGrant = (season, gw) => (Number(season) === 2025 && Number(gw) === 16 ? 5 : FT_WEEKLY);
/** FTs at the next GW from this one's (rules.py:176-177 next_ft, applied by team.py:87). */
export const nextFt = (avail, used, grant = FT_WEEKLY) => Math.min(FT_CAP, avail - used + grant);
/** 1 for GW1-19, 2 after (chips.py:216-217). */
export const chipHalf = (gw) => (Number(gw) <= HALF ? 1 : 2);
const seasonLong = (season, chip) => (SEASON_LONG[Number(season)] || []).includes(chip);

// ---------------------------------------------------------------- small helpers

const EMPTY = Object.freeze({});
const num = (v) => (v === null || v === undefined || v === '' || typeof v === 'boolean' || !Number.isFinite(Number(v)) ? null : Number(v));
const T = (m) => (num(m) === null ? null : Math.round(Number(m) * 10));  // £m → tenths
const M = (t) => (t === null || t === undefined ? null : Math.round(t) / 10);  // tenths → £m
const money = (t) => `£${(Math.abs(t) / 10).toFixed(1)}m`;
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const ids = (xs) => (Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : []);
const sortedGws = (o) => Object.keys(o || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
const posRank = (pos) => { const i = POS.indexOf(pos); return i < 0 ? 9 : i; };
let idSeq = 0;
const newId = () => `d${Date.now().toString(36)}${(++idSeq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------------------------------------------------------------- players

function rowsOf(players) {
  if (!players) return [[], []];
  if (players instanceof Map) return [[...players.values()], []];
  if (Array.isArray(players)) return [players, []];
  if (Array.isArray(players.players)) return [players.players, ids(players.horizon)];
  if (Array.isArray(players.fields) && Array.isArray(players.rows)) {
    const f = players.fields;
    return [players.rows.map((r) => Object.fromEntries(f.map((k, i) => [k, r[i]]))), ids(players.horizon)];
  }
  return [Object.values(players), []];
}

function record(row, gws) {
  const price = num(row.price) ?? num(row.solver_price);
  return {
    id: Number(row.id),
    name: row.name ?? `#${row.id}`,
    pos: posName(row.pos),
    club: row.club ?? null,
    clubId: num(row.club_id),
    price,
    priceT: T(price),
    xp: Array.isArray(row.xp) ? row.xp : [],
    xpGws: Array.isArray(row.xp_gws) ? ids(row.xp_gws) : gws,
    row,
  };
}

function buildLookup(base, players) {
  const [rows, gws] = rowsOf(players);
  const baseGws = ids(base?.horizon);
  const by = new Map();
  const sellT = new Map();
  for (const r of base?.squad || []) {
    by.set(Number(r.id), record(r, baseGws));
    sellT.set(Number(r.id), T(r.sell_price) ?? T(r.price));
  }
  for (const r of rows) {
    if (r?.id == null) continue;
    const rec = record(r, gws);
    const had = by.get(rec.id);
    // the players payload wins; a base row fills what it lacks (e.g. no xp for an all-zero player)
    if (had && !rec.xp.length) { rec.xp = had.xp; rec.xpGws = had.xpGws; }
    if (had) { rec.pos ??= had.pos; rec.club ??= had.club; rec.clubId ??= had.clubId; rec.price ??= had.price; rec.priceT ??= had.priceT; }
    by.set(rec.id, rec);
  }
  const get = (id) => by.get(Number(id));
  return {
    get,
    has: (id) => by.has(Number(id)),
    name: (id) => get(id)?.name ?? `#${id}`,
    pos: (id) => get(id)?.pos ?? null,
    club: (id) => get(id)?.club ?? null,
    price: (id) => get(id)?.price ?? null,
    priceT: (id) => get(id)?.priceT ?? null,
    /** What an owned-at-base player sells for, in tenths (undefined for anyone else). */
    sellT: (id) => sellT.get(Number(id)) ?? undefined,
    /** xP for GW gw (null when the player or that GW has no forecast; a blank GW is 0 in the data). */
    xp(id, gw) {
      const r = get(id);
      if (!r) return null;
      const i = r.xpGws.indexOf(Number(gw));
      return i < 0 ? null : num(r.xp[i]);
    },
    horizon: gws.length ? gws : baseGws,
    all: () => [...by.values()],
  };
}

const LOOKUPS = new WeakMap();
const isLookup = (x) => x && typeof x.get === 'function' && typeof x.pos === 'function' && typeof x.xp === 'function';

/** Player facts by id over base.squad and the players payload, memoised per (players, base) object. */
export function playerLookup({ base, players } = {}) {
  if (isLookup(players)) return players;
  const kp = players && typeof players === 'object' ? players : EMPTY;
  const kb = base && typeof base === 'object' ? base : EMPTY;
  let inner = LOOKUPS.get(kp);
  if (!inner) LOOKUPS.set(kp, (inner = new WeakMap()));
  let L = inner.get(kb);
  if (!L) inner.set(kb, (L = buildLookup(base, players)));
  return L;
}

const posFn = (posOf) => (typeof posOf === 'function' ? posOf : playerLookup({ players: posOf }).pos);

// ---------------------------------------------------------------- lineups

/** 1 GK, DEF 3-5, MID 2-5, FWD 1-3, 11 in all (rules.py:103-108; team.py:274-276). */
export function validFormation(xi, posOf) {
  const pos = posFn(posOf);
  if (!Array.isArray(xi) || xi.length !== XI_SIZE || new Set(xi.map(Number)).size !== XI_SIZE) return false;
  const n = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of xi) {
    const k = pos(p);
    if (!(k in n)) return false;
    n[k] += 1;
  }
  return Object.entries(POS_LIMITS).every(([k, [, lo, hi]]) => n[k] >= lo && n[k] <= hi);
}

/** XI by (position, xp desc) as team.py:179 orders starters; bench GK first, then xp desc (team.py:180). */
const orderXi = (xi, xpOf, posOf) => [...xi].sort((a, b) => posRank(posOf(a)) - posRank(posOf(b)) || xpOf(b) - xpOf(a));
const orderBench = (bench, xpOf, posOf) => [...bench].sort((a, b) => (posOf(a) !== 'GK') - (posOf(b) !== 'GK') || xpOf(b) - xpOf(a));
/** GK to the first bench slot, the outfield order kept (solve.py:319 open_slots; api/entry.py:520-521). */
const gkFirst = (bench, posOf) => [...bench].sort((a, b) => (posOf(a) !== 'GK') - (posOf(b) !== 'GK'));

/**
 * The highest-xp legal XI of a squad: team.py:99-127 best_xi. Each position sorted by xp, then every
 * count from its XI minimum to its maximum walked in GK, DEF, MID, FWD order; the first best total wins.
 */
export function bestXI(squad, xpOf, posOf) {
  const pos = posFn(posOf);
  const xp = (p) => num(xpOf(p)) ?? 0;
  const byPos = new Map();
  for (const p of ids(squad)) {
    const k = pos(p);
    if (!byPos.has(k)) byPos.set(k, []);
    byPos.get(k).push(p);
  }
  for (const list of byPos.values()) list.sort((a, b) => xp(b) - xp(a));
  const limits = Object.entries(POS_LIMITS);
  let best = { total: -Infinity, xi: [] };
  const walk = (i, left, total, picked) => {
    if (i === limits.length) {
      if (left === 0 && total > best.total) best = { total, xi: picked };
      return;
    }
    const [k, [, lo, hi]] = limits[i];
    const avail = byPos.get(k) || [];
    for (let n = lo; n <= Math.min(hi, avail.length, left); n++) {
      const sel = avail.slice(0, n);
      walk(i + 1, left - n, total + sum(sel.map(xp)), [...picked, ...sel]);
    }
  };
  walk(0, XI_SIZE, 0, []);
  if (!best.xi.length) return { xi: [], bench: [], total: 0 };
  const inXi = new Set(best.xi);
  return {
    xi: orderXi(best.xi, xp, pos),
    bench: orderBench(ids(squad).filter((p) => !inXi.has(p)), xp, pos),
    total: best.total,
  };
}

/**
 * A saved lineup mapped onto this GW's squad: a player no longer there is replaced by whoever replaced
 * him (the chain of this plan's moves), else by an unplaced squad player of his position, so a
 * transfer keeps the slot (as FPL does). null when it cannot be made to cover the squad.
 */
function repairLineup(xi, bench, squad, replacedBy, pos) {
  const inSquad = new Set(squad);
  const used = new Set();
  const follow = (p) => {
    let q = p;
    const seen = new Set();
    while (!inSquad.has(q) && replacedBy.has(q) && !seen.has(q)) { seen.add(q); q = replacedBy.get(q); }
    return inSquad.has(q) && !used.has(q) ? q : null;
  };
  const place = (list) => list.map((p) => { const q = follow(p); if (q !== null) used.add(q); return q; });
  const xi0 = ids(xi), bench0 = ids(bench);
  const xi1 = place(xi0), bench1 = place(bench0);
  const fill = (orig, got) => got.map((q, i) => {
    if (q !== null) return q;
    const want = pos(orig[i]);
    const r = squad.find((p) => !used.has(p) && (want === null || pos(p) === want));
    if (r !== undefined) used.add(r);
    return r ?? null;
  });
  const xi2 = fill(xi0, xi1);
  if (xi2.includes(null)) return null;
  const bench2 = bench0.length ? fill(bench0, bench1).filter((p) => p !== null) : [];
  const rest = squad.filter((p) => !used.has(p));
  return { xi: xi2, bench: [...bench2, ...rest], ordered: bench0.length > 0 };
}

/** The GW's lineup: the saved one repaired onto the squad, else the best XI; `pick` (id, gw) → xP ranks. */
function lineupFor(L, gw, squad, saved, replacedBy, warnings, pick = L.xp) {
  const xpOf = (p) => num(pick(p, gw)) ?? 0;
  const pos = L.pos;
  let xi = null, bench = null;
  if (saved && Array.isArray(saved.xi) && saved.xi.length) {
    const fixed = repairLineup(saved.xi, saved.bench, squad, replacedBy, pos);
    if (fixed && validFormation(fixed.xi, pos) && fixed.xi.length + fixed.bench.length === squad.length) {
      xi = [...fixed.xi].sort((a, b) => posRank(pos(a)) - posRank(pos(b)));  // rows by position, order kept within
      bench = fixed.ordered ? gkFirst(fixed.bench, pos) : orderBench(fixed.bench, xpOf, pos);
    } else {
      warnings.push('the saved lineup no longer fits this squad: best XI used');
    }
  }
  if (!xi) ({ xi, bench } = bestXI(squad, xpOf, pos));
  if (xi.length !== XI_SIZE) warnings.push('the squad cannot field a legal XI');
  const byXp = [...xi].sort((a, b) => xpOf(b) - xpOf(a));  // stable: ties keep XI order
  const savedCap = num(saved?.captain), savedVice = num(saved?.vice);
  const captain = savedCap !== null && xi.includes(savedCap) ? savedCap : (byXp[0] ?? null);
  const vice = savedVice !== null && xi.includes(savedVice) && savedVice !== captain
    ? savedVice : (byXp.find((p) => p !== captain) ?? null);
  return { xi, bench, captain, vice };
}

/**
 * A saved lineup ({xi?, bench?, captain?, vice?}: a sub, the armband) on a week's squad, as evaluate() plays it
 * (lineupFor): the saved XI and bench repaired onto the squad (a player the week's moves sold → whoever replaced
 * him; else a squad player of his position), or the week's own XI and bench when they no longer fit; the saved
 * captain and vice when they start, else the week's, else the XI's top xP. week: a Road week ({in, out}) or a
 * GwState / view week ({moves}). → {xi, bench, captain, vice}. One rule for This week and Ahead (FOLLOWUPS F7).
 */
export function applyLineup(week, saved, players) {
  const L = playerLookup({ players });
  const own = { xi: ids(week?.xi), bench: ids(week?.bench), captain: num(week?.captain), vice: num(week?.vice) };
  const squad = [...own.xi, ...own.bench];
  const moves = Array.isArray(week?.moves) ? week.moves.filter((m) => m.ok !== false) : pairMoves(week?.out, week?.in, L);
  const replacedBy = new Map(moves.filter((m) => m.out != null && m.in != null).map((m) => [Number(m.out), Number(m.in)]));
  const arm = { captain: num(saved?.captain) ?? own.captain, vice: num(saved?.vice) ?? own.vice };
  if (ids(saved?.xi).length && ids(saved?.bench).length) {
    const warnings = [];
    const lu = lineupFor(L, week.gw, squad, { xi: ids(saved.xi), bench: ids(saved.bench), ...arm }, replacedBy, warnings);
    if (!warnings.length) return lu;
  }
  return lineupFor(L, week?.gw, squad, { ...own, ...arm }, replacedBy, []);
}

/** XI ↔ bench (or two outfield bench players) swapped, or null when that breaks the formation. */
export function swapLineup(state, aId, bId, posOf) {
  const pos = posFn(posOf);
  const a = Number(aId), b = Number(bId);
  const xi = ids(state?.xi), bench = ids(state?.bench);
  if (a === b) return null;
  const ia = xi.indexOf(a), ib = xi.indexOf(b), ja = bench.indexOf(a), jb = bench.indexOf(b);
  if (ia >= 0 && jb >= 0) { xi[ia] = b; bench[jb] = a; }
  else if (ib >= 0 && ja >= 0) { xi[ib] = a; bench[ja] = b; }
  else if (ja >= 0 && jb >= 0) {
    if (pos(a) === 'GK' || pos(b) === 'GK') return null;
    bench[ja] = b; bench[jb] = a;
  } else return null;
  if (!validFormation(xi, pos)) return null;
  return { xi, bench: gkFirst(bench, pos) };
}

/** The squad players `id` can swap with (swapLineup not null). */
export function swapCandidates(state, id, posOf) {
  return [...ids(state?.xi), ...ids(state?.bench)].filter((p) => p !== Number(id) && swapLineup(state, id, p, posOf));
}

// ---------------------------------------------------------------- drafts (immutable)

export function createDraft({ name = 'My plan', source = 'manual', id } = {}) {
  return { id: id ?? newId(), name, source, created: Date.now(), moves: {}, chips: {}, lineups: {} };
}

export function duplicateDraft(draft, { name } = {}) {
  const copy = JSON.parse(JSON.stringify(draft || createDraft()));
  return { ...copy, id: newId(), name: name ?? `${copy.name || 'Plan'} (copy)`, created: Date.now() };
}

/** Back to the base team: no moves, no lineups (they name moved players); chips stay. */
export const clearMoves = (draft) => ({ ...draft, moves: {}, lineups: {} });

/** draft with draft[field][gw] = value (undefined drops the key). */
function withGw(draft, field, gw, value) {
  const next = { ...(draft?.[field] || {}) };
  if (value === undefined) delete next[String(gw)];
  else next[String(gw)] = value;
  return { ...draft, [field]: next };
}

const movesAt = (draft, gw) => (Array.isArray(draft?.moves?.[gw]) ? draft.moves[gw] : []);
const chipAt = (draft, gw) => (CHIPS.includes(draft?.chips?.[gw]) ? draft.chips[gw] : null);

/** Sell outId for inId in GW gw, kept net per GW (the solver counts transfers as net buys, team.py:91). */
export function applyMove(draft, gw, outId, inId) {
  const o = Number(outId), n = Number(inId);
  if (!Number.isFinite(o) || !Number.isFinite(n) || o === n) return draft;
  const list = movesAt(draft, gw).map((m) => ({ out: Number(m.out), in: Number(m.in) }));
  const j = list.findIndex((m) => m.in === o);   // selling a player bought this GW: A→o, o→n = A→n
  const k = list.findIndex((m) => m.out === n);  // buying back a player sold this GW: n→B, o→n = o→B
  if (j >= 0) {
    if (list[j].out === n) list.splice(j, 1);
    else list[j] = { out: list[j].out, in: n };
  } else if (k >= 0) {
    if (list[k].in === o) list.splice(k, 1);
    else list[k] = { out: o, in: list[k].in };
  } else list.push({ out: o, in: n });
  return withGw(draft, 'moves', gw, list.length ? list : undefined);
}

/** Drop one move of GW gw, by index or by {out, in}. */
export function undoMove(draft, gw, which) {
  const list = movesAt(draft, gw);
  const i = typeof which === 'number' ? which
    : list.findIndex((m) => Number(m.out) === Number(which?.out) && Number(m.in) === Number(which?.in));
  if (i < 0 || i >= list.length) return draft;
  const rest = list.filter((_, x) => x !== i);
  return withGw(draft, 'moves', gw, rest.length ? rest : undefined);
}

/** Play `chip` in GW gw (null clears it). FPL gives one per half, so the same chip elsewhere in
 * gw's half moves here (a season-long 2024 chip is checked by canUseChip / evaluate instead). */
export function setChip(draft, gw, chip) {
  if (chip && !CHIPS.includes(chip)) throw new Error(`unknown chip ${chip}`);
  const chips = { ...(draft?.chips || {}) };
  if (chip) {
    for (const [g, c] of Object.entries(chips)) {
      if (c === chip && Number(g) !== Number(gw) && chipHalf(g) === chipHalf(gw)) delete chips[g];
    }
    chips[String(gw)] = chip;
  } else delete chips[String(gw)];
  return { ...draft, chips };
}

/**
 * setChip as a plan can carry it (the phone's ≈ of a chip edit), or null when none can: a free hit that leaves a week
 * (taken off, moved to another GW of its half, or replaced there) takes that week's moves and lineup with it (they
 * lasted that week only: the later weeks are planned from the squad before it, as draftFromSolverResult reads a free
 * hit), and a wildcard that leaves one gives null (its remake would stay as ordinary transfers, each one a hit).
 */
export function planChip(draft, gw, chip) {
  const next = setChip(draft, gw, chip);
  const gone = Object.entries(draft?.chips || {}).filter(([g, c]) => next.chips[g] !== c);
  if (gone.some(([, c]) => c === 'wc')) return null;
  return gone.filter(([, c]) => c === 'fh').reduce((d, [g]) => withGw(withGw(d, 'moves', g, undefined), 'lineups', g, undefined), next);
}

export function setLineup(draft, gw, patch) {
  if (patch === null) return withGw(draft, 'lineups', gw, undefined);
  const cur = { ...(draft?.lineups?.[gw] || {}), ...(patch || {}) };
  for (const k of Object.keys(cur)) if (cur[k] === null || cur[k] === undefined) delete cur[k];
  for (const k of ['xi', 'bench']) if (cur[k]) cur[k] = ids(cur[k]);
  for (const k of ['captain', 'vice']) if (cur[k] !== undefined) cur[k] = Number(cur[k]);
  return withGw(draft, 'lineups', gw, Object.keys(cur).length ? cur : undefined);
}

// ---------------------------------------------------------------- chips

/**
 * Whether `chip` can be planned for GW gw. One per half (chips.py:216-224, HALF = 19), once a season
 * for 2024's fh/bb/tc (chips.py:50); in base.gw's own half (or season, for a season-long chip) only
 * the chips /api/entry lists as left (chips_available, the solver's ChipAuto.stock) can be played.
 */
export function canUseChip({ base, draft, gw, chip } = {}) {
  if (!CHIPS.includes(chip)) return { ok: false, reason: `unknown chip ${chip}` };
  const label = chip.toUpperCase();
  const g = Number(gw);
  const first = Number(base?.gw ?? base?.next_gw);
  const long = seasonLong(base?.season, chip);
  const other = sortedGws(draft?.chips).find((x) => x !== g && draft.chips[x] === chip && (long || chipHalf(x) === chipHalf(g)));
  if (other !== undefined) return { ok: false, reason: `${label} is already planned for GW${other}` };
  const left = base?.chips_available;
  if (Array.isArray(left) && (long || chipHalf(g) === chipHalf(first)) && !left.includes(chip)) {
    return { ok: false, reason: `${label} is already used this ${long ? 'season' : 'half'}` };
  }
  return { ok: true, reason: '' };
}

// ---------------------------------------------------------------- evaluation

/** The GWs a plan covers: `horizon` GWs from base.gw (1..5, never past GW38), or the GW list given. */
export function planGws(base, horizon = 4) {
  if (Array.isArray(horizon)) return ids(horizon).sort((a, b) => a - b);
  const first = Number(base?.gw ?? base?.next_gw);
  if (!Number.isFinite(first)) return [];
  const n = Math.max(1, Math.min(MAX_HORIZON, Math.round(num(horizon) ?? 4)));
  return Array.from({ length: n }, (_, i) => first + i).filter((g) => g <= LAST_ROUND);
}

/**
 * A GW's points: team.py:256-264 calc_pts. XI + the captain once more (cap_w 1, 2 under TC: rules.py
 * update `cap_w * 2`) + the bench only under BB, minus HIT_COST per hit (the result's charge, team.py:256
 * hit_cost_actual). xpOf(id, gw) → xP (null / missing counts 0). The one scoring rule for the mean and runs.
 */
export function weekPoints(week, xpOf) {
  const v = (p) => num(xpOf(p, week?.gw)) ?? 0;
  const cap = num(week?.captain);
  const xiPts = sum(ids(week?.xi).map(v));
  const capPts = cap === null ? 0 : v(cap) * (week?.chip === 'tc' ? 2 : 1);
  const benchPts = week?.chip === 'bb' ? sum(ids(week?.bench).map(v)) : 0;
  return xiPts + capPts + benchPts - HIT_COST * (num(week?.hits) ?? 0);
}

/** One move on working copies of the squad and its sale prices; prices in tenths. */
function applyOne(L, squad, sale, m) {
  const o = Number(m?.out), n = Number(m?.in);
  const idx = squad.indexOf(o);
  if (idx < 0) return { ok: false, reason: `${L.name(o)} is not in the squad` };
  if (squad.includes(n)) return { ok: false, reason: `${L.name(n)} is already in the squad` };
  if (!L.has(n) || L.priceT(n) === null) return { ok: false, reason: `no price for player ${L.name(n)}` };
  if (L.pos(o) !== L.pos(n)) return { ok: false, reason: `${L.name(o)} (${L.pos(o)}) and ${L.name(n)} (${L.pos(n)}) play different positions` };
  const sellT = sale.get(o) ?? L.priceT(o) ?? 0;
  const buyT = L.priceT(n);
  squad[idx] = n;
  sale.delete(o);
  sale.set(n, buyT);
  return { ok: true, sellT, buyT };
}

/** The clubs a squad has too many of. The cap is the solver's, max(max_per_team, the players of that club the
 *  team held at the anchor) (solve.py:834-845: a club change can leave a team holding four; it may keep them, never
 *  add to them), with none held under a wildcard, a free hit or a fresh build. */
function overClubs(L, squad, held = []) {
  const count = (ps) => {
    const n = new Map();
    for (const p of ps) { const c = L.club(p); if (c) n.set(c, (n.get(c) || 0) + 1); }
    return n;
  };
  const h = count(held);
  return [...count(squad)].filter(([c, k]) => k > Math.max(MAX_PER_CLUB, h.get(c) || 0)).map(([c, k]) => ({ club: c, count: k }));
}

/**
 * The draft played out over the planned GWs, accounted as the solver's Team accounts its rounds
 * (team.py:84-97 _record_transfers, 155-176 apply_solution, 208-264 calc_pts).
 */
export function evaluate({ base, players, draft, horizon = 4, xp: xpAt, fixedLineups = false, banksOnly = false } = {}) {
  const L = playerLookup({ base, players });
  const score = typeof xpAt === 'function' ? (id, g) => num(xpAt(id, g)) : L.xp;
  const pick = fixedLineups ? L.xp : score;
  const gws = planGws(base, horizon);
  const season = base?.season;
  const warnings = [];
  const first = Number(base?.gw ?? base?.next_gw);
  if (gws.length && Number.isFinite(first) && gws[0] !== first) warnings.push(`the plan starts at GW${gws[0]}, the team is for GW${first}`);
  for (const g of new Set([...sortedGws(draft?.moves), ...sortedGws(draft?.chips)])) {
    if (!gws.includes(g) && (movesAt(draft, g).length || chipAt(draft, g))) warnings.push(`GW${g} is outside the planned GWs and is ignored`);
  }

  // the state carried into each GW: squad (ordered), sale prices (tenths), bank (tenths), FTs
  let squad = ids((base?.squad || []).map((r) => r.id));
  const held = base?.fresh === true ? [] : [...squad];  // owned at the anchor (solve.py owned_at_anchor)
  let sale = new Map(squad.map((p) => [p, L.sellT(p) ?? L.priceT(p) ?? 0]));
  let bank = T(base?.bank) ?? 0;
  let ft = num(base?.ft) ?? FT_WEEKLY;
  let replacedBy = new Map();
  let prevUsed = 0;
  const out = [];

  gws.forEach((gw, i) => {
    // FTs roll in with this GW's grant (team.py:87; api/entry.py:343 gives base.ft for the first GW)
    if (i > 0) ft = nextFt(ft, prevUsed, ftGrant(season, gw));
    const w = [];
    const chip = chipAt(draft, gw);
    if (chip) { const c = canUseChip({ base, draft, gw, chip }); if (!c.ok) w.push(c.reason); }
    // a wildcard, a free hit and a fresh build's first GW are unlimited (team.py:88-89; solve.py:564)
    const free = chip === 'wc' || chip === 'fh' || (i === 0 && base?.fresh === true);

    const sq = [...squad], sp = new Map(sale), repl = new Map(replacedBy);
    let bk = bank;
    const moves = movesAt(draft, gw).map((m) => {
      const r = applyOne(L, sq, sp, m);
      if (r.ok) { bk += r.sellT - r.buyT; repl.set(Number(m.out), Number(m.in)); }
      else w.push(`move ${L.name(m.out)} → ${L.name(m.in)} skipped: ${r.reason}`);
      return { out: Number(m.out), in: Number(m.in), ok: r.ok, reason: r.ok ? '' : r.reason, sell: M(r.sellT), buy: M(r.buyT), xpDelta: 0 };
    });
    const before = new Set(squad), after = new Set(sq);
    const bought = sq.filter((p) => !before.has(p));
    const sold = squad.filter((p) => !after.has(p));
    // team.py:88-93: transfers are the net buys; a wildcard / free hit "uses" ft_weekly, no hits
    const transfers = bought.length;
    const used = free ? FT_WEEKLY : Math.min(ft, transfers);
    const hits = free ? 0 : Math.max(0, transfers - ft);

    if (bk < 0) w.push(`over budget by ${money(bk)}`);
    for (const { club, count } of overClubs(L, sq, free ? [] : held)) w.push(`${count} players from ${club} (max ${MAX_PER_CLUB})`);
    if (banksOnly) out.push({ gw, chip, squad: sq, bank: M(bk), ft, transfers, used, hits, moves, bought, sold, warnings: w, ok: !w.length });
    else {
      const lineup = lineupFor(L, gw, sq, draft?.lineups?.[gw], repl, w, pick);
      const xp = {};
      for (const p of sq) {
        const v = score(p, gw);
        if (v === null) w.push(`no forecast for ${L.name(p)}: counted as 0`);
        xp[p] = v ?? 0;
      }
      // `gross` (no hits) is the solver's `pred`; `points` nets the hits (weekPoints)
      const gross = weekPoints({ ...lineup, chip }, (p) => xp[p]);
      const hitCost = HIT_COST * hits;

      out.push({
        gw, chip, squad: sq, ...lineup, bank: M(bk), ft, transfers, used, hits, hitCost, moves, bought, sold,
        points: gross - hitCost, gross, xp, sell: Object.fromEntries([...sp].map(([p, t]) => [p, M(t)])),
        warnings: w, ok: !w.length,
      });
    }
    // a free hit's squad and bank are thrown away; its FT accounting is not (team.py:161, 175)
    if (chip !== 'fh') { squad = sq; sale = sp; bank = bk; replacedBy = repl; }
    prevUsed = used;
  });

  if (banksOnly) return { gws: out, warnings: [], ok: true };
  // each move's xP gain over the plan: in − out for its GW on (its GW alone under a free hit)
  for (const s of out) {
    const span = s.chip === 'fh' ? [s.gw] : gws.filter((g) => g >= s.gw);
    for (const m of s.moves) if (m.ok) m.xpDelta = sum(span.map((g) => (score(m.in, g) ?? 0) - (score(m.out, g) ?? 0)));
  }
  for (const s of out) for (const x of s.warnings) warnings.push(`GW${s.gw}: ${x}`);
  return { gws: out, total: sum(out.map((s) => s.points)), warnings, ok: !warnings.length };
}

/** {gw: bank} of a draft (evaluate's, £m after each GW's moves): its accounting alone, the lineups and points unscored
 *  (a bank never depends on them). */
export const planBanks = (o) => Object.fromEntries(evaluate({ ...o, banksOnly: true }).gws.map((s) => [s.gw, s.bank]));

/**
 * Can GW gw sell outId for inId? The replacement picker's labels: owned ("In team"), position, club
 * limit ("Max 3 from CHE") and budget ("−£1.8m": the most the move leaves any GW it affects short,
 * counting only GWs it makes worse; `shortfall` in £m). A move that breaks a later planned move is a
 * clash. Exact without re-evaluating when no later move involves either player: the move then only
 * puts inId in outId's place and shifts every affected bank by sell(outId) − price(inId).
 */
export function canBuy({ base, players, draft, gw, outId, inId, horizon = 4, evaluation } = {}) {
  const L = playerLookup({ base, players });
  const ev0 = evaluation || evaluate({ base, players, draft, horizon });
  const g = Number(gw), o = Number(outId), n = Number(inId);
  const st = ev0.gws.find((s) => s.gw === g);
  const no = (code, reason, shortfall = 0) => ({ ok: false, code, reason, shortfall });
  if (!st) return no('unknown', `GW${g} is not planned`);
  if (!L.has(n) || L.priceT(n) === null) return no('unknown', `no data for ${L.name(n)}`);
  if (st.squad.includes(n)) return no('owned', 'In team');
  if (!st.squad.includes(o)) return no('missing', `${L.name(o)} is not in the GW${g} squad`);
  if (L.pos(o) !== L.pos(n)) return no('position', `Not a ${L.pos(o)}`);
  const span = st.chip === 'fh' ? [st] : ev0.gws.filter((s) => s.gw >= g);
  const touched = span.some((s) => s.gw > g && s.moves.some((m) => [m.out, m.in].includes(o) || [m.out, m.in].includes(n)));
  let after;
  if (touched) {
    const ev1 = evaluate({ base, players, draft: applyMove(draft, g, o, n), horizon });
    const bad = (ev) => new Set(ev.gws.flatMap((s) => s.moves.filter((m) => !m.ok).map((m) => `${s.gw}:${m.out}:${m.in}`)));
    const was = bad(ev0);
    if ([...bad(ev1)].some((k) => !was.has(k))) return no('clash', 'Clashes with a later move');
    after = span.map((s) => ev1.gws.find((x) => x.gw === s.gw));
  } else {
    const dT = T(st.sell[o]) - L.priceT(n);
    after = span.map((s) => ({ squad: s.squad.map((p) => (p === o ? n : p)), bank: M(T(s.bank) + dT) }));
  }
  const club = L.club(n);
  const nClub = (s) => s.squad.filter((p) => L.club(p) === club).length;
  if (club && span.some((s, i) => nClub(after[i]) > MAX_PER_CLUB && nClub(after[i]) > nClub(s))) {
    return no('club', `Max ${MAX_PER_CLUB} from ${club}`);
  }
  const shortOf = (s) => (s.bank < 0 ? -s.bank : 0);
  const short = Math.max(0, ...span.map((s, i) => (shortOf(after[i]) > shortOf(s) ? shortOf(after[i]) : 0)));
  if (short > 0) return no('budget', `−£${short.toFixed(1)}m`, short);
  return { ok: true, code: '', reason: '', shortfall: 0 };
}

// ---------------------------------------------------------------- solver results

/** OUT → IN pairs, same position first, dearest first, one price by id (the solver's order: solve_tap.py writes a week's
 *  `out` and `in` by id), so the same players pair alike whatever order they are handed in (the user, 2026-10-21: fix
 *  the known issues: a Free Hit's Why sheet, from its squad's order, read "Tavernier → Stach, Groß → Xhaka", the week
 *  once taken, from its road's, "Groß → Stach, Tavernier → Xhaka", both £6.2m); leftovers alone (as the lab's
 *  planner.js pairMoves). `keep` ([{out, in}]): pairs made as given wherever both are there (a phone plan's own
 *  transfers, so a week selling two midfielders reads as they were made, never re-paired by price). */
export function pairMoves(outIds, inIds, players, keep = []) {
  const L = playerLookup({ players });
  const order = (xs) => ids(xs).sort((a, b) => posRank(L.pos(a)) - posRank(L.pos(b)) || (L.price(b) ?? 0) - (L.price(a) ?? 0) || a - b);
  const outs = order(outIds), ins = order(inIds);
  const made = new Map();
  for (const m of keep) {
    const o = outs.indexOf(Number(m.out)), i = ins.indexOf(Number(m.in));
    if (o >= 0 && i >= 0 && L.pos(outs[o]) === L.pos(ins[i])) made.set(outs.splice(o, 1)[0], ins.splice(i, 1)[0]);
  }
  const pairs = order([...made.keys(), ...outs]).map((o) => {
    if (made.has(o)) return { out: o, in: made.get(o) };
    const i = ins.findIndex((p) => L.pos(p) === L.pos(o));
    return { out: o, in: i >= 0 ? ins.splice(i, 1)[0] : null };
  });
  return [...pairs, ...ins.map((p) => ({ out: null, in: p }))];
}

/**
 * The solve's rows {gw, t: TeamJSON} from its first GW on: committed rounds from meta.from, then the
 * last anchor's window plan beyond them (solve_tap.py Doc.committed / anchors; the lab's timelineOf).
 */
function solverRows(result) {
  const committed = result?.committed || {};
  const gws = sortedGws(committed).filter((g) => committed[g]?.team);
  const from = num(result?.meta?.from) ?? gws[0];
  const rows = gws.filter((g) => g >= from).map((gw) => ({ gw, t: committed[gw].team }));
  const anchors = result?.anchors || {};
  const last = sortedGws(anchors).at(-1);
  const plan = last === undefined ? {} : anchors[last]?.plan || {};
  for (const gw of sortedGws(plan)) if (!committed[gw]) rows.push({ gw, t: plan[gw] });
  return rows;
}

/** Every player of the solve's rows, xp by GW as each row's own round saw it (its `pred` inputs). */
export function playersFromSolverResult(result) {
  const rows = solverRows(result);
  const by = new Map();
  for (const { gw, t } of rows) {
    const xg = ids(t.xp_gws);
    for (const [id, p] of Object.entries(t.players || {})) {
      const r = by.get(Number(id)) || { ...p, id: Number(id), xpBy: new Map() };
      xg.forEach((g, i) => { if (!r.xpBy.has(g) || g === gw) r.xpBy.set(g, p.xp?.[i] ?? null); });
      if (num(p.pred) !== null) r.xpBy.set(gw, Number(p.pred));
      by.set(Number(id), r);
    }
  }
  const players = [...by.values()].map(({ xpBy, ...p }) => {
    const xg = [...xpBy.keys()].sort((a, b) => a - b);
    return { ...p, xp_gws: xg, xp: xg.map((g) => xpBy.get(g)) };
  });
  return { horizon: rows.length ? ids(rows[0].t.xp_gws) : [], players };
}

/** From-scratch builds: every player bought, none sold (the lab's isBuild). */
const isBuild = (t) => !(t?.out || []).length && (t?.in || []).length >= 15;

/** The chips left at GW `first` after `played` [{chip, gw}]: chips.py:213-224 ChipAuto stock. */
function chipsLeft(season, first, played) {
  const lo = first > HALF ? HALF + 1 : 1;
  return CHIPS.filter((c) => !played.some((x) => x.chip === c && (seasonLong(season, c) || x.gw >= lo)));
}

/**
 * The team a solve started from, at its first GW (meta.from): the squad before that GW's moves with
 * the sale prices, bank and FTs the solver used. A fresh build has no squad before it: its base is
 * the built 15 at their prices, `fresh`, with that GW's own (free) moves already made.
 */
export function baseFromSolverResult(result) {
  const rows = solverRows(result);
  if (!rows.length) return null;
  const { gw, t } = rows[0];
  const meta = result?.meta || {};
  const P = t.players || {};
  const played = sortedGws(result?.committed)
    .filter((g) => g < gw && result.committed[g]?.team?.chip)
    .map((g) => ({ chip: result.committed[g].team.chip, gw: g }));
  const squadNow = ids([...(t.xi || []), ...(t.bench || [])]);
  const fresh = isBuild(t);
  let squad = squadNow, bankT = T(t.bank) ?? 0;
  if (!fresh) {
    // undo the first GW's moves: in-players back to the players they replaced, in their slots
    const pairs = pairMoves(t.out, t.in, { players: Object.values(P) });
    squad = squadNow.map((p) => pairs.find((m) => m.in === p)?.out ?? p);
    for (const p of ids(t.in)) bankT += T(t.purchase_prices?.[p] ?? P[p]?.price) ?? 0;
    for (const p of ids(t.out)) bankT -= T(t.sale_prices?.[p] ?? P[p]?.sell_price) ?? 0;
  }
  const xpGws = ids(t.xp_gws);
  return {
    season: num(meta.season),
    entry_id: num(meta.entry),
    gw,
    next_gw: num(meta.next_gw),
    fresh,
    bank: M(bankT),
    ft: num(t.ft_avail) ?? FT_WEEKLY,
    chips_used: played,
    chips_available: chipsLeft(meta.season, gw, played),
    horizon: xpGws,
    squad: squad.map((p) => {
      const r = P[p] || { id: p };
      const price = num(r.price);
      return {
        ...r,
        id: p,
        pos: posName(r.pos),
        sell_price: fresh ? price : num(r.sell_price) ?? price,
        purchase_price: num(t.purchase_prices?.[p]) ?? price,
        xp_gws: xpGws,
      };
    }),
  };
}

const hhmm = (sec) => {
  const d = num(sec) === null ? new Date() : new Date(Number(sec) * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * A solve as a draft over `base`: each GW's moves the diff of consecutive squads paired by position
 * (a free hit's squad is diffed but not carried, so the GW after it diffs against the squad before
 * it: team.py:161, 175; solve_tap.py _net_moves), its chips, and the solver's lineups and armbands.
 * draft.solver keeps the solve's per-GW pred and hits, its first GW, argv and any warnings.
 */
export function draftFromSolverResult(result, base, { name, players, keep = [] } = {}) {
  const b = base || baseFromSolverResult(result);
  const rows = solverRows(result);
  const meta = result?.meta || {};
  const L = playerLookup({ base: b, players: players ?? playersFromSolverResult(result) });
  const warnings = [];
  const first = Number(b?.gw ?? b?.next_gw);
  if (rows.length && Number.isFinite(first) && rows[0].gw !== first) {
    warnings.push(`the solve starts at GW${rows[0].gw}, the team is for GW${first}`);
  }
  const draft = { ...createDraft({ name: name ?? `Solver plan ${hhmm(meta.finished_at)}`, source: 'solver' }) };
  let prev = new Set(ids((b?.squad || []).map((r) => r.id)));
  const pred = {}, hits = {};
  for (const { gw, t } of rows) {
    const sq = ids([...(t.xi || []), ...(t.bench || [])]);
    const now = new Set(sq);
    const pairs = pairMoves([...prev].filter((p) => !now.has(p)), sq.filter((p) => !prev.has(p)), L, keep);
    const whole = pairs.filter((m) => m.out !== null && m.in !== null);
    if (whole.length !== pairs.length) warnings.push(`GW${gw}: the squad change does not pair by position`);
    if (whole.length) draft.moves[gw] = whole;
    if (CHIPS.includes(t.chip)) draft.chips[gw] = t.chip;
    draft.lineups[gw] = {
      xi: ids(t.xi), bench: ids(t.bench),
      ...(num(t.captain) !== null ? { captain: Number(t.captain) } : {}),
      ...(num(t.vice) !== null ? { vice: Number(t.vice) } : {}),
    };
    pred[gw] = num(t.pred);
    hits[gw] = num(t.hits);
    if (t.chip !== 'fh') prev = now;
  }
  draft.solver = {
    from: rows[0]?.gw ?? null, w: num(meta.w), pool: meta.pool ?? null, argv: meta.argv || result?.argv || [],
    finishedAt: num(meta.finished_at), pred, hits, warnings,
  };
  return draft;
}

// ---------------------------------------------------------------- solver constraints

/**
 * Keep / Avoid choices and (keepMoves) the draft's moves as --must-have / --exclude, in
 * player_data.py:951-967 _parse_windowed's grammar: comma-joined "id@a-b" (a bare "@g" would mean g to
 * GW38). solve.py:326-347 holds a must-have player in the squad (s == 1) and keeps an excluded one out
 * (s == 0) in every window round a..b. Keep / Avoid cover fromGw..horizonEnd. A move at GW g holds its
 * in-player from g and bars its out-player from g, until a later (non free hit) move of the draft
 * sells / buys him again, or for g alone under a free hit. A move overrides a Keep / Avoid on the same
 * player for its GWs (warned), so no window overlaps: the solver refuses that (player_data.py:772-781).
 */
export function constraintsFromDraft(draft, { keep = [], avoid = [], horizonEnd, fromGw = 1, keepMoves = true, players } = {}) {
  const end = num(horizonEnd) ?? LAST_ROUND;
  const from = num(fromGw) ?? 1;
  const name = players ? playerLookup({ players }).name : (id) => `#${id}`;
  const req = new Map();  // id → Map(gw → {want: 'in'|'out', why})
  const dropped = new Map();  // "why|kept|id" → GWs where a move overrides a Keep / Avoid
  const set = (id, g, want, why) => {
    if (!req.has(id)) req.set(id, new Map());
    const cur = req.get(id).get(g);
    // only a Keep / Avoid being overridden is news: a later move ending an earlier one's span is the plan
    if (cur && cur.want !== want && (cur.why === 'Keep' || cur.why === 'Avoid')) {
      const k = `${why}|${cur.why}|${id}`;
      dropped.set(k, [...(dropped.get(k) || []), g]);
    }
    req.get(id).set(g, { want, why });
  };
  const span = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  for (const p of ids(keep)) for (const g of span(from, end)) set(p, g, 'in', 'Keep');
  for (const p of ids(avoid)) for (const g of span(from, end)) set(p, g, 'out', 'Avoid');
  if (keepMoves) {
    const gws = sortedGws(draft?.moves).filter((g) => g >= from && g <= end);
    const later = (g, pred) => gws.find((x) => x > g && chipAt(draft, x) !== 'fh' && movesAt(draft, x).some(pred));
    for (const g of gws) {
      const fh = chipAt(draft, g) === 'fh';
      for (const m of movesAt(draft, g)) {
        const o = Number(m.out), n = Number(m.in);
        const sellsIn = later(g, (x) => Number(x.out) === n);
        const buysOut = later(g, (x) => Number(x.in) === o);
        for (const x of span(g, fh ? g : (sellsIn ?? end + 1) - 1)) set(n, x, 'in', `your GW${g} move`);
        for (const x of span(g, fh ? g : (buysOut ?? end + 1) - 1)) set(o, x, 'out', `your GW${g} move`);
      }
    }
  }
  const must = [], excl = [];
  for (const id of [...req.keys()].sort((a, b) => a - b)) {
    const byGw = req.get(id);
    const gws = [...byGw.keys()].sort((a, b) => a - b);
    let start = null;
    gws.forEach((g, i) => {
      start ??= g;
      const want = byGw.get(g).want;
      const next = gws[i + 1];
      if (next !== g + 1 || byGw.get(next).want !== want) {
        (want === 'in' ? must : excl).push(`${id}@${start}-${g}`);
        start = null;
      }
    });
  }
  const warnings = [...dropped].map(([k, gws]) => {
    const [why, kept, id] = k.split('|');
    const when = gws.length > 1 ? `GW${gws[0]}-${gws.at(-1)}` : `GW${gws[0]}`;
    return `${kept} ${name(id)} dropped for ${when}: ${why} says otherwise`;
  });
  return { must_have: must.join(','), exclude: excl.join(','), warnings };
}

/**
 * The values for POST /api/jobs {kind: 'solve', values}: the planned GWs from base.gw (--from-r, --w),
 * all of them solved as integers (--int-rounds H: the default 1,bo=2 relaxes later GWs, whose rounded
 * plan can overspend), hit caps only where they restrict (F17: --max-hits / --max-hits-gw below the default, maxHits
 * when given else hitCap, the solver's own cap: the bundle's meta.hit_cap; no --hit-cost, the solver prices hits itself,
 * and FPL's real −4 is HIT_COST, which scoring charges), Keep / Avoid
 * and kept moves, and the draft's chips in the window (lists of GW strings). A chip the season has a
 * default round for (meta.chip_defaults, main.py:691-696) and the draft does not play is set to '0'
 * (main.py:758: none), so the default is not played. A base without entry_id (a fresh build) sends no
 * --entry: the caller decides how such a team is solved.
 */
export function solveValues({ base, draft, horizon = 4, maxHits = null, maxHitsGw = null, hitCap = null, keepMoves = false, keep = [], avoid = [], pool, chipDefaults, players } = {}) {
  const gws = planGws(base, horizon);
  const from = gws[0], end = gws.at(-1);
  const c = constraintsFromDraft(draft, { keep, avoid, horizonEnd: end, fromGw: from, keepMoves, players: playerLookup({ base, players }) });
  const values = { season: num(base?.season), from_r: from, w: gws.length, int_rounds: String(gws.length) };
  // F17: no --max-hits unless it restricts (none: main.py resolves its own default cap, hitCap)
  const dflt = num(hitCap);
  const hits = num(maxHits);
  if (hits !== null && hits !== dflt) values.max_hits = hits;
  // per-round caps (--max-hits-gw, main.py SolverArgs.max_hits_gw: a listed round's cap replaces the default there):
  // the window's rounds only, by round, and not the ones at that cap anyway (api/mobile.py hits_gw: one argv)
  const at = hits ?? dflt;
  const caps = gws.map((g) => [g, num(maxHitsGw?.[g])]).filter(([, n]) => n !== null && n !== at);
  if (caps.length) values.max_hits_gw = caps.map(([g, n]) => `${g}:${n}`).join(',');
  if (base?.entry_id != null) values.entry = String(base.entry_id);
  if (c.must_have) values.must_have = c.must_have;
  if (c.exclude) values.exclude = c.exclude;
  const defaults = chipDefaults?.[String(values.season)] || {};
  for (const chip of CHIPS) {
    const rounds = gws.filter((g) => chipAt(draft, g) === chip).map(String);
    if (rounds.length) values[chip] = rounds;
    else if (defaults[chip]?.length) values[chip] = ['0'];
  }
  if (pool) values.dir = pool;
  return { values, warnings: c.warnings };
}

// ---------------------------------------------------------------- phone logic (IPHONE_DESIGN §7.6)

/**
 * Verdict gates: × noise the pooled |delta| must reach. The runs never move a label (a rolling backtest found
 * no gain from voting on them: FOLLOWUPS F8), so 25/25 runs on a +0.2 move still reads Coin flip and 13/25 on
 * a +0.8 move with noise 0.3 reads Clear; how many runs agree is information, shown in the Why sheet.
 */
export const VERDICT = Object.freeze({ clear: 2, lean: 1 });
const EPS = 1e-6;

/**
 * The noise floor of a solve: the bundle's meta.noise, else the solver's per-transfer charge at the
 * anchor, tau_by_anchor[gw] (Rules.at_anchor reprices the tau-scaled terms with it, rules.py:122-129),
 * else the window's meta.tau. Read from each result, never hard-coded.
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
    /** where (id, gw)'s runs start in data (run r at offset + r), or -1 when the matrix has no such cell */
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
 * week's own (a GwState's, a view week's), else weekPoints on the mean when meanOf scores every player, else the
 * Road week's pred − hits (a bare Road without an accessor). meanOf reads a GwState's own xp map, else `xp`.
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
 * The solver's credit for the free transfers a plan carries out of its window at this (its last) week:
 * solve.py:615-621 ft_value, one slot per transfer up to FT_CAP − 1 at `rate` each; none under a wildcard or
 * free hit (unlimited transfers), at GW38 (nothing follows it), or without a rate (meta.ft_value unknown).
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

/** Per week, each run's points (Float64Array(runs)) with the week's lineup fixed; the mean fills gaps. Each is
 *  weekPoints of the week with run r's xP (S.at), else the mean (meanOf), summed in weekPoints' order; each player's
 *  cells are found once per week (S.offset) and read straight from the matrix, not looked up again per run (a compare
 *  reads 24 runs × 4 weeks × 12-15 players for each side). */
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
    // a week (the object planWeeks read: weeks are never changed in place) scored on these runs and this mean once: a
    // plan compared with many (the chips' plans, the alternatives) is not scored again for each
    const kept = w.src && RUN_WEEKS.get(w.src);
    if (kept && kept.S === S && kept.xp === w.xpOf) return kept.out;
    const g = w.gw;
    // a player's cells: his offset in the matrix, and the mean that fills a run without a value (weekPoints' v: 0
    // when neither scores him)
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
 * F15b by horizon: the plan service shows each forecast value ×k_h of its horizon h = GW − anchor (api/scale.py: the
 * forecast runs lower further ahead), and the noise floor ×k_0. A gap is labelled on its weeks put back on the anchor's
 * scale, ×k_0/k_h (hits, FPL's real −4, added back first and taken again), so Clear / Lean / Coin flip read what they
 * read on k_0 alone: a week never wins or loses a label for being further ahead. kh: the scale's k by horizon (the
 * bundle's meta.scale.k_h, a road's own k_h); h before the anchor reads k_0, past the deepest the deepest's
 * (api/scale.py at). → (gw) → factor; 1 without a scale by horizon.
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
 * When a road's cumulative gain stops being behind: 'ahead' (never behind; gw = first GW it leads),
 * 'pays' (behind, then ≥ 0 from gw to the window's end), 'never' (behind at the end), 'level' (all 0).
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
 * Plan a against plan b over the GWs both cover, in the one measure (header): points (mean xP minus hits)
 * plus the banked-transfer credit at the last common GW (`ftValue` per transfer). Per-run votes from the seed
 * matrix (each plan's lineups fixed; the credit is the same in every run) are information: the label is the
 * pooled delta against the noise floor (verdictLabel).
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
  // the gap on the anchor's scale (anchorRef): what the label reads. A week's gap d (points minus hits) is
  // (d + 4·Δhits)·f − 4·Δhits there (the hits, FPL's real −4, added back first and taken again) = d·f + 4·Δhits·(f − 1),
  // f = ref(gw); the credit at the last week ×its f. onA(d per week) → the window's gap on that scale
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

/** {id: runs in which he has the XI's highest xP at GW gw} (ties go to the first in XI order). */
export function captainVotes(xi, gw, seeds) {
  const S = decodeSeeds(seeds);
  const out = {};
  if (!S) return out;
  const list = ids(xi);
  for (let r = 0; r < S.runs; r++) {
    let best = null, top = -Infinity;
    for (const p of list) { const v = S.at(p, gw, r); if (v !== null && v > top) { top = v; best = p; } }
    if (best !== null) out[best] = (out[best] || 0) + 1;
  }
  return out;
}

/**
 * The phone's "≈" chip estimate for GW gw of a plan: BB = the planned bench's mean xP (it scores only
 * under BB), TC = the captain's xP (his extra multiple under TC; team.py:256-264). WC and FH need a solve.
 */
export function chipEstimate(plan, gw, chip, { xp } = {}) {
  if (chip !== 'bb' && chip !== 'tc') return null;
  const w = planWeeks(plan, xp).find((x) => x.gw === Number(gw));
  if (!w) return null;
  const who = chip === 'bb' ? w.bench : w.captain === null ? [] : [w.captain];
  return { chip, gw: w.gw, value: sum(who.map((p) => w.meanOf(p, w.gw) ?? 0)), ids: who, approx: true };
}

/**
 * A solved Road's own objective (Road.objective = the anchor solve's {term: {round: value}}, api/mobile.py make_road):
 * the planner's count of the plan, which it maximises: xi and cap (forecast points), bench (bench cover), ft_cost (its
 * per-transfer charge, solve.py:601-606), ft_value (banked transfers, :615-621), hit and the crowd terms. Two roads
 * solved on the same data compare like with like: a plan under more rules never counts more than the plan without
 * them. → {terms: {term: Σ over rounds}, total} | null (no objective: an estimate, an older road).
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
 * A Road as a draft over `base` through draftFromSolverResult (moves by position, or as `keep` pairs them: pairMoves;
 * chips, the road's lineups). A Road carries no player rows, so `players` must cover its buys (the bundle's players do).
 */
export function roadToDraft(road, base, { players, name, keep = [] } = {}) {
  return draftFromSolverResult(resultOfRoad(road), base, { players, keep, name: name ?? `Road ${road?.key ?? ''}`.trim() });
}
