// Plan engine for the Planner (#/plan): pure, DOM-free functions over plain data. Node-testable (engine.test.mjs).
// Every FPL rule mirrors the solver (ml/solver), cited as file:line, so a plan evaluated here reads as the solver
// accounts it.
//
// ---------------------------------------------------------------- data
// base     GET /api/entry/<id> payload (or baseFromSolverResult): {season, entry_id, gw (first planned GW), squad:
// [{id, pos, club, price, sell_price, purchase_price, xp, ...}], bank (£m), ft (FTs at gw), chips_available,
// chips_used, horizon}; `fresh: true` = from-scratch build, its first GW free like a wildcard (team.py:88).
// players  GET /api/players payload {horizon, players: [{id, pos, club, price, xp[], ...}]}, an array or Map of such
// rows, a column-oriented {horizon, fields, rows} (GET /api/m/bundle), or a playerLookup(). Row xp[i] is GW (row.xp_gws
// || payload.horizon)[i]; base.squad rows fill in players the payload lacks.
// seeds    per-run forecast matrix (GET /api/m/bundle, /api/m/seeds): {ids, gws, runs, f32: base64 little-endian
// Float32 [player][gw][run]} or {ids, gws, runs, data}; decodeSeeds() makes an accessor (functions taking `seeds`
// accept either).
// Road     the plan service's compact solve (IPHONE_DESIGN §7.4): {key, job, values, argv, weeks: [Week], objective,
// warnings}; Week {gw, in, out, xi, bench, captain, vice, chip, bank, ft_avail, ft_used, hits, pred}.
// draft    {id, name, source, created, moves: {gw: [{out, in}]}, chips: {gw: 'wc'|'fh'|'bb'|'tc'}, lineups: {gw: {xi?,
// bench?, captain?, vice?}}, solver?}; GW keys are strings once in JSON. Drafts, base and players are immutable:
// functions return a new draft.
// Money is £m at the edges, integer tenths inside. Prices are static over the plan: a player bought in it costs
// players[].price (api/data.py _market) and sells for the same; one owned at the base sells for base.squad[].sell_price
// (api/entry.py:94).
//
// ---------------------------------------------------------------- exports
// createDraft({name = 'My plan', source = 'manual', id}) → draft
// applyMove(draft, gw, outId, inId) → draft. Net per GW: A→B then B→C is A→C; A→B then B→A is no move.
// setChip(draft, gw, chip|null) → draft. A chip set elsewhere in the same half moves here.
// setLineup(draft, gw, patch|null) → draft. patch {xi?, bench?, captain?, vice?}; null clears the GW, a null field that
// field.
// evaluate({base, players, draft, horizon, xp, fixedLineups}) → {gws: [GwState], total, warnings, ok}
//   horizon: GWs from base.gw (default 4, max 5) or a GW array.
// xp: optional accessor (id, gw) → points that scores the plan (default: mean xP), e.g. runXp(seeds, r). fixedLineups:
// lineups are picked on the mean xP, never on `xp` (a solver road's saved XI, captain and bench are kept either way).
// GwState {gw, chip, squad, xi, bench, captain, vice, bank (£m after the GW's moves), ft (available), transfers (net
// bought), used (FTs used), hits, hitCost, moves: [{out, in, sell, buy (£m), ok, reason, xpDelta}], bought, sold,
// points (XI + captain bonus + BB bench − hits), gross (before hits = the solver's `pred`), xp: {id: xp this GW}, sell:
// {id: £m}, warnings, ok}
//   banksOnly: the accounting alone (no lineups, xP or points): planBanks.
// planBanks({base, players, draft, horizon}) → {gw: bank (£m)}; canUseChip({base, draft, gw, chip}) → {ok, reason}
// bestXI(ids, xpOf, posOf) → {xi, bench, total}; validFormation(ids, posOf) → bool
// swapLineup(state, aId, bId, posOf) → {xi, bench} | null; swapCandidates(state, id, posOf) → ids
// applyLineup(week, saved, players) → {xi, bench, captain, vice}; pairMoves(outIds, inIds, players, keep?) → [{out,
// in}] (null = unpaired)
// draftFromSolverResult(result, base?, {name, players, keep}) → draft; baseFromSolverResult(result) → base;
// playersFromSolverResult(result) → {horizon, players}
// constraintsFromDraft(draft, {keep, avoid, horizonEnd, fromGw = 1, keepMoves = true, players}) → {must_have, exclude,
// warnings}
// solveValues({base, draft, horizon, maxHits, maxHitsGw, hitCap, keepMoves, keep, avoid, pool, chipDefaults, players})
// → {values, warnings}: maxHits (--max-hits) and maxHitsGw {gw: n} (--max-hits-gw "g:n,…") restrict hits; never a
// --hit-cost (F17: the solver prices hits itself)
// playerLookup({base, players}) → {get, has, pos, club, price, priceT, sellT, xp, name, horizon}
// planGws(base, horizon) → [gw]; ftGrant(season, gw); nextFt(avail, used, grant); chipHalf(gw)
// Constants: FT_WEEKLY, FT_CAP, HIT_COST, MAX_PER_CLUB, HALF, CHIPS, MAX_HORIZON, LAST_ROUND, POS_LIMITS, VERDICT
// {clear: noise ×, lean: noise ×}
//
// ---------------------------------------------------------------- phone logic (IPHONE_DESIGN §7.6)
// A "plan" below is an evaluate() result ({gws: [GwState]}), a Road ({weeks: [Week]}) or Ahead's view weeks.
// ONE measure for every comparison: forecast points minus hits, plus the banked-transfer value the solver credits
// (solve.py:615-621 ft_value: each free transfer carried out of the window, up to FT_CAP − 1, is worth meta.ft_value).
// A week's points: its own `points`, else weekPoints() on the mean xP accessor when it scores every player, else (a
// bare Road) Week.pred − 4 × hits: both plans from the bundle's xP, never the solver's pred against the engine's.
// weekPoints(week, xpOf) → points; bankCredit(week, rate) → credit
// decodeSeeds(seeds) → {ids, gws, runs, data, has(id), at(id, gw, r) → number|null, mean(id, gw)} | null; runXp(seeds,
// r, fallback?) → (id, gw) → xP
// planPoints(plan, {xp, ftValue}) → {gws, points, bank, total}; runTotals(plan, seeds, {xp}) → Float32Array(runs)
// compareRoads(a, b, {seeds, noise, xp, ftValue, ref}) → {gws, delta (points + bank), ref (delta on the anchor's scale;
// = delta without one), points, bank, perGw, cum, votes, against, lead, runs, label, payback, diffs, diffsRef, cumRuns,
// winner}: label from ref against the noise floor alone (the runs never move it, F8); votes / against = runs where a /
// b wins, lead = the leader's count (information only); diffs / diffsRef Float32Array(runs) of window deltas; cumRuns
// [run][gw]; winner 'a'|'b'|null.
// verdictLabel(delta, noise) → 'clear'|'lean'|'coin'; payback(cum, gws) → {kind: 'ahead'|'pays'|'never'|'level', gw,
// text}
// objectiveOf(road, {atAnchor}) → {terms: {term: Σ rounds}, total} | null; anchorRef(kh, anchor) → (gw) → k_0 / k_h;
// noiseFloor(meta, gw) → meta.noise, else meta.tau_by_anchor[gw], else meta.tau
// roadFromResult(result, {key, job, values}) → Road; roadToDraft(road, base, {players, name, keep}) → draft

export {
  FT_WEEKLY, FT_CAP, LAST_ROUND, HIT_COST, MAX_PER_CLUB, HALF, CHIPS, MAX_HORIZON, POS_LIMITS, ftGrant, nextFt,
  chipHalf, playerLookup, validFormation, bestXI, applyLineup, swapLineup, swapCandidates
} from './engine/squad.js';
export {
  createDraft, applyMove, setChip, setLineup, canUseChip, planGws, weekPoints, evaluate, planBanks
} from './engine/evaluate.js';
export {
  pairMoves, playersFromSolverResult, baseFromSolverResult, draftFromSolverResult, constraintsFromDraft, solveValues
} from './engine/solver.js';
export {
  VERDICT, noiseFloor, decodeSeeds, runXp, bankCredit, planPoints, runTotals, anchorRef, verdictLabel, payback,
  compareRoads, objectiveOf, roadAnchor, roadFromResult, roadToDraft
} from './engine/phone.js';
