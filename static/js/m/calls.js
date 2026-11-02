// Forkcast phone logic: the one measure and the planner's count, GW A's alternatives, the verdict copy and the price
// watch. Pure and DOM-free (node static/js/m/calls.test.mjs); no side effects at import. Scoring, votes and verdicts
// stay in ../plan/engine.js; the phone's copy lives here once, in COPY.
//
// ---------------------------------------------------------------- inputs
// ctx = planInputs(bundle, data?) (GET /api/m/bundle data; `data` = app.js's derived ctx.data, whose base / players /
// seeds / noise are reused) or the same shape built by hand:
// {A (the next GW), gws (planned GWs), meta, base (engine base), players (engine players form), seeds (decoded), noise,
// roads {base, roll, veto: {id: Road}, slide, chip}, bake, rank}
//
// ---------------------------------------------------------------- exports
// planInputs(bundle, data?) → ctx
// compare(ctx, a, b) → engine.compareRoads in the one measure: forecast points minus hits (what you score), labelled
// against the noise floor
// plannerOf(a, b) → {delta, terms, hits} | null: the planner's own count (engine.objectiveOf of two solved roads) and
// the hits its count never charged
// changeText(what, cmp, {dir, gws, transfers, hits, planner, noise, total}) → an edit's verdict toast: the points, and
// the planner's word where it parts from them
// withForced(line, now, was) → that verdict plus the hits its new plan takes that its rules don't allow or its planner
// never priced (memory.forcedHits); forcedNew(now, was): those the plan before didn't take
// hitCap(meta) → the solver's hit cap per GW | null; transfersOf(plan), hitsOf(plan) → n
// rulesCost(ctx, yours, model) → {cost (≥ 0), label, points, transfers} | null: what your rules cost, never your lineup
// captainGap(ctx, week, c, vs), subGap(ctx, week, s) → compare: a captain against another in one week, a sub against
// the lineup now
// planFromRoad(ctx, road, lineup {xi, bench, captain, vice}) → {draft, evaluation, week (GW-A GwState)}: GW A with your
// saved lineup
// priceWatch(ctx, draft, {now, tz}) → per price-change night before the deadline, what making GW A's moves after it
// costs and puts out of reach, with each move's line and the call to act | null
// priceMorning(kept, meta, {now, prices, bank, name}) → "Groß rose overnight (+£0.1m): your GW6 moves still fit" |
// "Prices held overnight" | null
// withPrices(cols, prices), shownPlayers(bundle) → players columns with the prices block (and the live block) laid over
// them by id
// priceNights(meta, {now, until}) → {nights [{k, epoch}], stale, asOf}; priceOutlook(row, nights) → {dir, sure, night,
// likelihood, word, held}; nightWords(epoch, now, tz); pricePlate(row, meta, {now, tz}) → the Player data plate ("▲
// tonight", "▼ tomorrow", "▼ Sat", "▲ likely", "Locked", "—"); PRICE_WORD; priceSaid(outlook, when) → "very likely to
// drop", "may rise (FPL: likely)"
// handoffMoves(week) → GW A's moves as you make them in FPL (the engine's legal ones)
// statusText(name, row) → "Scott is injured (knee)" | null; OUT, newsReason(row)
// driftHeadOf(delta, label, fresh, freshLabel, gws) → {gap, label, part}: the drift toast's head in parts
// liveCheck(published, week, L) → GW A's live line: FPL's published squad against the plan's GW A (squad only)
// sentence(text) → text ending in one full stop; COPY (the phone's strings)

export {
  FORGET_MS, gwFlags, OUT, newsReason, statusText, hitCap, horizonFeature, planWeeks
} from './calls/helpers.js';
export {
  sentence, COPY, liveCheck, driftHeadOf
} from './calls/copy.js';
export {
  planInputs, compare, transfersOf, hitsOf, plannerOf, windowGap, counted, shownDelta, hitBook, changeText,
  forcedNew, withForced, rulesCost, captainGap, subGap, planFromRoad, handoffMoves
} from './calls/measure.js';
export {
  PRICE_WORD, priceSaid, priceNights, shownPlayers, withPrices, priceOutlook, nightWords, pricePlate, priceWatch,
  priceMorning, planEta, steadyEta, clockText, waitedText, aboutText, leftText, waitLines, stepShare, planShare,
  waitFacts, waitFact
} from './calls/prices.js';
