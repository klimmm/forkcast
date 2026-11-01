// Forkcast · Ahead (IPHONE_DESIGN §5.5, §6, §7.7, §7.8; DESIGN_V2 §3: the app's one screen): FPL's Pick Team on one
// screen: header, GW switcher, week line ("Bring in…", "Chips…": bringDoor, chipsDoor; a tap opens the Week sheet: your
// transfers with ×, notices, every suggested plan, Your rules), the pitch with your transfers (bought players tagged
// IN, a tap opens the transfer's Why sheet), bench, and the week's choices (plansOf, renderDecks): Forkcast's best buy
// waits behind the player he would replace, one tap takes that week's moves alone (planTake / addPlan; decision 6,
// owner, 2026-10-11), the edges over a player open his place, the Roll and chips sit beside the goal. Header to bench
// is one screen, the pitch one size every week (fitPitch). "Your rules" (RULES_V2) keeps every veto, keep and cash rule
// as a removable row. A new plan is your team with no transfers (memory's hold). Hits are one setting for every week,
// Settings → Plan → "Hits Forkcast may take a week": None · −4 · −8 up to the solver's cap (sheets/you.js, hitsChoices
// / setHitsMaxWithUndo, memory's derived 'hits' pin; owner, 2026-10-12). The plan covers Settings → Plan → "Plan
// ahead"'s weeks (1-4, the bundle's meta.horizon; owner, 2026-10-14), GWs past it locked (edgeTicks). First half of
// this file: the PLAN VIEW shared with the sheets (sheets/player.js, replace.js, wish.js); second half: the screen.
// "Roll" is only the FPL word for making no transfer (a Why sheet's "Roll GW6", a week's "GW7 roll" plan, a gain "vs
// rolling").
//
// ================================================================ PLAN VIEW (exports)
// "Your plan" is plan memory's (./memory.js); Ahead adds what a touch needs. An edit records rules; the plan drawn
// stays the solver's last until its plan for the new rules lands (a bundle road that fits, or memory's heal), the
// edited week onward waiting: never an engine estimate (owner, 2026-10-26: "fix so every squad is solver squad, no
// hardcoded logic whatsoever"). A heal that finds no plan keeps your rules and says what it couldn't keep (RULES_V2
// §5). Later GWs' lineups are phone-only (localStorage fc:ahead:lu:<entry>:<gw>; engine.applyLineup plays them); GW A's
// are memory's. Every gap is calls.compare's one measure; what your rules cost is calls.rulesCost (≥ 0). Pins are
// memory.js pins (makePin, pinSell / pinSlide / pinVeto / pinNever / pinKeep / pinChip / pinHits). Core rule
// (2026-10-08): an action does only what it says, anything more is asked first. No yes/no asks (owner, 2026-10-07): a
// newer ask that takes back a rule of yours acts at once and names it in its verdict (withTaken); one Undo restores
// all.
//
// plan(ctx) → P | null    (null: none yet; under the hold, your team before its solve)
// {A, gws, end, L (engine lookup), b (bundle), d (ctx.data), base (the model's Road), road (your Road), mem
// (memory.getPlan()), pins, weeks: [ViewWeek] (the solver's plan, never an edit's estimate), total, approx: Set(gw)
// (weeks waiting on an edit's solve), mark (the edited week), forced (memory.forcedHits), healing, cmp (calls.compare
// yours vs the model), onLine, editable, why (when not editable), lineupGap ({delta, gws}), rules (calls.rulesCost) |
// null, comparable (your road and the model's are solves of the same data)}
// ViewWeek {gw, xi, bench, squad, captain, vice, chip, bank, ft, used, hits, points, moves: [{out, in}], in, out,
// approx, lineup (a phone lineup of yours), lineupDelta}
// inFor(P, week) → {id: 'Scott'} · clearGain(cmp) (a gain beyond the noise: the one test for green, a solid +, a filled
// button, a "Best") · baseOf(ctx) → the engine base GW A starts from · asYours(ctx, road) → {weeks} · baked(ctx,
// extraPins) → the bundle road that already is the plan with those pins, or null ·
// gwMode(P, gw) → 'roll' | 'free' | 'h<n>' | 'auto' ·
// chipWeek(P, gw) → 'wc' | 'fh' | null (COPY.chipWeek) · chipSource(ctx) → each chip × GW's plan (chipPreps: prepared
// with your rules; chipPresolves: the bake's) · buyCandidates(P, {pos, from, not, limit}) → [id] ·
// watchOf(ctx) → price watch (calls.priceWatch) | null · inkAt(ctx, P,
// g) (GW A under way: no edit reaches GW g). Edits (rules only; false with a toast when blocked): sellFrom, sellAny,
// sellOut, moveTo, veto, want, keep, never, rescope, liftAsk, removeRule, captain, vice, sub, resetLineup, resetPlan,
// chipPlan, chipOff.
// Bring in: buyPlan(ctx, id, g, {out}) → {kind: 'one' | 'two' | 'none', out, in, fund?, short?, draft, ev, cmp, hits} ·
// saleBuy (a sale you chose, as it is, money short or not: owner, 2026-10-28) · bringIn · holdBuy ('pick'; owner,
// 2026-10-29) · buyProblem · rowGains · whyFacts. Add a player's week button hands that week to the planner (his wish);
// its sale chips and Replace never do.
// Suggested plans (decision 6): plansOf · addPlan (its +: the moves as your exact transfers with its GW-g chip,
// planTake; owner, 2026-10-12) · prepNext (owner, 2026-10-22) · earlyOf (a move the 2026-10-18 bars keep from being the
// suggestion: listed, never lit) · extraWeek · ownAltsOf · repicks · addYours · otherUseOf.
// A blocked edit makes a week's bank or club count worse than the plan already has it (problemOf vs baseline(ctx,
// from)); a later bank below 0 at FPL's prices on a solved plan is price drift, never blocking an edit that leaves it.

export {
  clockText, waitedText, stepShare, afterPaint, waitView, paintWaitView, editable, openRules, showTipsAgain, baseOf,
  viewOfRoadWeek, frozenOf, isFrozen, asYours, plan, weekOf, squadBefore, inTeamAt, inFor, boughtIn, draftOf,
  estimate, inputsOf, compare, baseline, problemsOf, problemOf, problemText, problemShort, addMove, dropMove,
  wishPin, isPick, valuesFor, solveFor, baked
} from './ahead/core.js';
export {
  plannerFor, pendingTick, pendingAgain, driftSay, sayCheer, changedOf, weekChanged, tickWas, totalShift,
  changedCards, clashParts, clashLine, inPlaceOf, sideEffects, endingOf, sellFrom, sellAny, veto, want, keepPin,
  keep, never, scopeLabels, rescope, buyCandidates, asksOf, pinsOf, windowOf, clashing, ruleOf, pinOf, barred,
  keptFrom, keptCells, barringRules, barringRule, sellOut, liftAsk, removeRule, captain, vice, subLineup, sub,
  subChoices, benchedBuys, resetLineup, chipEdit, chipPlan, chipOff, useChip
} from './ahead/edits.js';
export {
  suggestionsOf, listedOf, askPlace, plansOf, chipShown, chipNumber, weekRollOf, plansWait, weekWait, lineNotices,
  planWeeks, countedAfter, squadChanges, litEdges, weekKey, weekSettled, settlesAt, litOf, weekBest, litShown,
  rollOnly, planBack, decksOf, benchOnly, takesBack, singleMove, placeDealt, placePages, placeBuys, placeLine,
  multiMove, placeSplit, lineMoves, placeOrder, placeFirst, slotsBeside, failedWords, noteOf, solverCmp, planOfRoad,
  planBaseline, takenBy, forkValues, resetForks
} from './ahead/plans.js';
export {
  presolveTaps, owedAt, extraWeek, repicks, addYours, OWN_ALTS, ownAltsOf, tiedBuy, cheaperFirst, otherUseOf, whenOf,
  moveTo, pairMovesOf, planTake, takenKeep, addPlan, yoursTakenBack, rollingAt, pinOfMove, movesInOrder, fundingOf,
  removeMove, rowGains, onBase, whenOnBase, ifMisses, whyFacts
} from './ahead/presolve.js';
export {
  buyPlan, saleOptions, saleBuy, bringIn, wishSolve, bringInTakes, removesText, holdBuy, weekWith, inWords,
  buyProblem, fitsLater, bringInFrom, sayBuyProblem, solvesRound, resetPlan, planHasYours, hitsChoices,
  setHitsMaxWithUndo, chipWeek, gwMode, watchOf, watchView, deadlineInfo, isLive, fplSubs, fplSets, inkAt, sellWeek,
  liftsLive, initials, reroute
} from './ahead/buys.js';
export {
  shirtOf, clearGain, plPays, emptyHead, factsWords, itbWords, rollFt, weekFacts, chipsAsked, chipPresolves,
  chipBests, chipBack, chipsAvail, squadWeek, chipGain, chipWeekGain, xpShown, chipStates, PREP_AGAIN_MS, chipPreps,
  chipSource
} from './ahead/pieces.js';
export {
  rulesOf, listedRules, oneLook, headScale, reachOf, TAB_MIN, EDGE_MIN, GAP_MAX, PLATE_MIN, boxesMeet, resetFits,
  pitchLeast, mount
} from './ahead/screen.js';
