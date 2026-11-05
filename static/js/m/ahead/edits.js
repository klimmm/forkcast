// ahead.js: edits: rules now, the solver's plan, the verdict

export {
  ovOf, plannerFor, vsPrev, withPoints, toastOf, say, saidNow, sayAgain, undoOf, subjectOf, pendingTick, pendingAgain, driftSay,
  sayCheer, derivedPin, changedOf, weekChanged, tickWas, totalShift, changedCards, forgetEdit, aboutRules,
  clashParts, clashLine, edit, inPlaceOf, sideEffects, hitsLater
} from './edits/say.js';
export {
  endingOf, chainOf, sellFrom, sellAny, veto, want, keepPin, keep, never, scopeLabels, rescope, buyCandidates,
  asksOf, pinsOf, windowOf, clashing, withTaken, ruleOf, pinOf, barred, refusedAt, keptFrom, keptCells, barringRules,
  barringRule, sellOut, liftAsk, removeRule, captain, vice, subLineup, sub, subChoices
} from './edits/rules.js';
export {
  benchedBuys, resetLineup, chipEdit, autoRuleName, chipWords, chipPlan, chipOff, useChip, chipOffParts, chipBackOf
} from './edits/lineups.js';
