// Forkcast plan memory (IPHONE_DESIGN §7.7, §7.4 GET / PUT /api/m/memory, §3 M12 / M13): your plan for the next
// deadline, its pins, GW A and the pencil weeks after it, and drift (Ahead says it as a toast, ahead.driftSay). The
// pure half (pins, values, legality, drift) is DOM-free and node-tested; the live half is one memory per page, attached
// to the shell's ctx. No side effects at import time.
//
// ================================================================ model
// Your plan is the latest base road plus your pins. A Pin is one thing you asked of the plan, as solver windows: {id,
// kind, label, gw, must: [[player, a, b]], excl: [[player, a, b]], max_hits, hits? {gw: cap}, chips? {gw: chip}, cash?
// (tenths), at (epoch s), ...meta}. Pins compose oldest first; a newer one overrides an older where they disagree, so
// no must-have and exclude window overlap (the solver exits on that: player_data.py:772-780). A second pin with the
// same id replaces the first:
// 'road' pinRoad(road, A): GW A held as a squad (the taken call; `locked`: an older document's frozen weeks); the
// windows the road was solved under become rules of their own, `via: <road key>` (splitRoad)
// 'wish:<id>' pinWish(id, g, end): buy him by GW g (must id@g-end); with `chip` him in that Wildcard or Free Hit week
// alone
// 'sell:<id>' pinSell(out, g, end, {in, funds}): sell him from GW g (exclude out@g-end); with a pick, must in@g-end
// (out held in g−1, in out until then); without one the solver picks the buy
// 'slide:<in>' pinSlide(in, out, g, A, end) · 'out:<id>' pinVeto / pinNever(id, A, end), 'out:<id>@<g>' (scope 'gw': GW
// g only) · 'keep:<id>' pinKeep(id, from, end), 'keep:<id>@<g>' · 'roll:<gw>' pinRoll(gw, k) · 'hits:<gw>' pinHits(n,
// gw) · 'chip:<gw>' pinChip(gw, chip) · 'cash' pinCash(tenths)
// Every pin but the road is one of "your rules" (RULES_V2): they accumulate until you remove one, nothing drops them
// silently (a Switch to the new best keeps them; a heal that can't keep them all leaves them in place and sets
// Plan.error); ruleText(pin) is each in words. A rule scoped to one GW is a window of one round: a Keep in GW6 only
// never clashes with a sale in GW8. The hits Forkcast may take are Settings → Hits, the derived pin 'hits' (withHits).
// A plan's road is found without a solve when a bundle road (or one this page offered) was solved under some of your
// windows with the same options and keeps all of yours (roadFits); else the plan heals with one solve (POST
// /api/m/solve via api.solve, purpose 'heal', debounced 600 ms, §7.8).
// The hold (owner, 2026-10-08): your plan is your team as it is, no transfers unless you add them (holdOn). Memory puts
// the derived pin 'hold' first (holdOf, never stored). Every plan under it is the solver's: a bundle road that fits,
// else a heal. ctx.planDefault 'model' (node tests only) is the model's plan unless held.
// Captain, vice, XI and bench are phone-only (the solver has no force-captain flag): accepted.lineup {xi, bench,
// captain, vice} is GW A's lineup on both screens (calls.planFromRoad / engine.applyLineup). GW A is next and every
// later GW pencil (weekState).
// The stored document (one per entry and GW; api/mobile.py memory_put keeps {entry, gw, accepted, ticket}):
// accepted {at, roads_version (roads the plan was made on), data_version, roads_taken [{call: 'transfer' | 'armband',
// road (key) | captain, label, not: [labels], at}], pins {must_have, exclude, items: [Pin]}, plan {key, item, version,
// values, weeks: [Week]} | null (null = the model's road), lineup {captain, vice, bench} | null, chip, verdicts [{call,
// delta, votes, runs, noise, label, vs}], notes [{kind: 'kept' | 'adopted' | 'carried' | 'frozen' | 'locked', at, text,
// delta, label}]; an older document's frozen, frozen_lineups, frozen_at, locked_at are emptied on load}
//   ticket: an older document's {ticks, bank_seen, locked, plan}, never written now.
// Older documents (frozen weeks as a locked road pin, a ticket lock, accepted.pins as plain strings, window-wide 'hits'
// rules) are read through normalizeAccepted (thawPin, inkRepair). This module is the only writer: a change writes the
// full shape and keeps every other key.
//
// ================================================================ live API
// attach(ctx) → Memory (one per page; attach() with no ctx returns it or null). Call it from every screen or sheet that
// reads the plan. It follows ctx.store 'data' (a new bundle) and 'conn' and mirrors its snapshot into ctx.store
// 'memory'. Writes go to the server at once (PUT /api/m/memory, per browser by X-Forkcast-Client) and every document is
// mirrored in localStorage (fc:mem:<entry>), so the plan shows when the server is unreachable and unsent changes go
// once it answers.
// Memory:
// getPlan() → Plan {entry, gw (A), gws, end, version (roads), doc, accepted, road (the accepted plan's Road, else the
// model's base), model, source 'yours' | 'model', stale (solved on older data), pins, must_have, exclude, hits ({gw:
// cap}), chips, cash, taken {transfer: key | null (that key's road no longer has your GW-A squad), armband: id | null},
// roads_taken, lineup, frozen, frozenLineups, locked (always empty now), weeks [Week + state 'next' | 'pencil'], drift
// (Drift | null), pending ({purpose, state, key, position, since, edit?}) | null while a heal solves, error ({code,
// plain}) | null, saving, carried (COPY.carried; Ahead says it once) | null}
// onChange(fn(plan, why)) → off. why: 'bundle' | 'take' | 'pins' | 'plan' | 'lineup' | 'lock' | 'drift' | 'heal' |
// 'error' | 'saved' | 'undo'
// addPin(pin, {replace = true}) → {ok, conflicts: [{pin, id, was, gws}], clash (one line), undo}; with replace false a
// clash is returned, not applied (§7.9 "Which one?"). An ask that remakes GW A makes the road pin yield its GW-A hold
// (yieldRoad); one that changes GW A under way is refused: {ok: false, locked: true, clash: COPY.live(gw)}
// inkOf([Pin]) → {gw: null, text} when a pin would change GW A under way, else null; inkClash([Pin]) → its text | null
//   removePin(id) → {undo} (a locked road pin: {refused: true}); restorePins(pins) (Undo)
// setLineup({xi, bench, captain, vice}) → {undo}; setPlan(road, {why}) → {undo} (Adopt); values({extra: [Pin], drop:
// [id]}) → engine.solveValues values for the pins an edit would leave (pinsAfter; the edit not made)
// setHitsMax(n) → {undo}: the hits Forkcast may take a week (Settings → Hits; owner, 2026-10-12): 0 none, 1 up to −4,
// null the solver's cap (accepted.hits_max)
// offer(road): a road this page solved for some pins (a chip prepared with your rules; a Wish pill): a re-plan takes it
// when it fits (findRoad / roadFits), with no solve
// noteEdit({what, dir, pins, edit}) / claimEdit() → the receipt of an edit Ahead is healing (dir: pinsDir of `pins`);
// kept on this device, so a heal landing after a reload still says what the edit did, with Undo; claimEdit takes it
// (Ahead's verdict toast)
//   heal({purpose = 'heal', now}) → Promise<{state, road, error}>: solve your pins now (else debounced)
//   settled() → Promise: resolves once no heal is waiting or solving (or the server is away)
//   compare() → engine.compareRoads(your plan, the model's base) | null
// pencilDiff() → {n, gws, items: [{gw, was: [Move], now: [Move]}], text: '2 changes in GW7–9'} | null: what a re-plan
// changed in your pencil weeks since this device last looked; markSeen() clears it
// forecastChange() → {version, gwA, pencil, held} | null: what a new forecast changed in the suggested plan's moves
// beyond the noise since this device last looked (then markSeen)
// keepMine({text}) / adoptDrift() → {undo}: the drift toast's answers (ahead.driftSay: its action, through
// switchWithUndo, adopts; leaving it any other way keeps yours); adoptDrift keeps your rules and re-plans with them
//   journal() → Promise<[JournalRow]> newest first ({gw, at, kind, text, not, label, delta}; GET ?gw=all)
//   detach()
// Drift (§7.7) {kind: 'drift' | 'kept' | 'same', version, gw, since (epoch s), sinceText, cmp (compareRoads new best vs
// yours), delta, label, illegal [{code: 'status' | 'budget' | 'club', id?, gw, text}], what, main (the main difference
// in words, diffWords, or null), best, diff (planDiff items), same (the new best is your plan: only legality broke),
// locked, reach (false: GW A is ink and the new best remakes it), broken (ids of your rules the new best ignores, the
// hold's too) / ruleNames (yours by name, never the hold's), fresh (what the new data gains; null when unknown;
// freshLabel its verdict), wins, without ({id, name}: a player FPL now flags that the forecast still plays), text
// (COPY.drift), mine, bestPlan (calls.planFromRoad results)}
// DOM: switchWithUndo(ctx) [the drift toast's action, COPY.driftAct: "Use it" | "Re-plan with your rules" | "Keep only
// your transfers"], planWithout(ctx, d) [no caller in js/m]. ctx defaults to the attached memory's.
//
// ================================================================ pure exports (node: the memory-*.test.mjs suites)
// parseSpans, spanString, composePins, pinConflicts, pinsDir, makePin, barredAt, changesGwA, yieldRoad, pinsAfter,
// holdOf, pinRoad, splitRoad, ticketSquad, lockPin, pinFrozen, frozenHolds, thawPin, frozenClash, frozenWeeks,
// frozenOnOf, frozenSince, inkRepair, pinWish, pinSell, pinSlide, pinVeto, pinNever, pinNotFor, pinKeep, pinChip, pinCash,
// withBank,
// pinHits, squadInto, movesIn, pinRoll, isRoll, isExact, exactAt, scopeOf, carryPins, planValues, roadCaps, forcedHits,
// idleRules, roadFits, optionPins, optionsRoad,
// optionsValues, brokenCells, rulesBroken, ruleText, findRoad, legality,
// detectDrift, sinceText, planDiff, diffWords, pencilChanges, movesChanged, journalRows, madeOn, normalizeAccepted,
// createMemory

export {
  TIMING, FORGET_MS, USED, isRoll, isExact, exactAt, rollKeeps, parseSpans, spanString, composePins, pinConflicts,
  pinsDir, makePin, barredAt, changesGwA, yieldRoad, pinsAfter, pinRoad, splitRoad, ticketSquad, pinFrozen, lockPin,
  frozenHolds, thawPin, frozenClash, deadlinePassed, frozenWeeks, frozenOnOf, frozenSince, inkRepair, pinWish,
  pinSell, pinSlide, pinVeto, pinNever, pinNotFor, pinKeep, scopeOf, pinChip, pinCash, withBank, pinHits, movesIn, squadInto,
  pinRoll, carryPins
} from './memory/pins.js';
export {
  holdOf, solvedLineup, planValues, firstPlanValues, roadCaps, forcedHits, idleRules, roadFits, SOLVES, solveKept, brokenCells,
  rulesBroken, ruleText, findRoad, optionPins, optionsRoad, optionsValues
} from './memory/values.js';
export {
  legality, sinceText, planDiff, diffWords, detectDrift, pencilChanges, movesChanged, journalRows, madeOn, solvedKey,
  normalizeAccepted
} from './memory/drift.js';
export {
  editedAt, createMemory, attach, release, forget, planWithout, switchWithUndo, ROADS
} from './memory/live.js';
