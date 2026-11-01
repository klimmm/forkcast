// ahead.js: the hold: your team, the model's moves as suggested plans

export {
  suggestionsOf, modelMoves, listedOf, askPlace, SQUAD_CHIPS
} from './plans/suggest.js';
export {
  plansOf, settledList, plansListed, choiceVs, yoursAt, chipShown, chipNumber, approxAt, weekRollOf, plansWait,
  weekWait, lineNotices, planWeeks, countedAfter, squadChanges, litEdges, weekKey, weekSettled, settleDue, settlesAt
} from './plans/choices.js';
export {
  litOf, weekBest, litShown, rollOnly, planBack, decksOf, benchOnly, takesBack, singleMove, placeDealt, placePages,
  placeBuys, placeLine, multiMove, placeSplit, lineMoves, placeOrder, PLACE_SLOTS, placeFirst, slotsBeside,
  failedWords, noteOf, mineAny, solverCmp, byGain, forkKey
} from './plans/lit.js';
export {
  planOfRoad, asTaken, planBaseline, takenBy, forkValues, forkAsk, forkRead, FORK_FLIGHTS, forkFlights, forkPump,
  forkAgain, resetForks
} from './plans/forks.js';
