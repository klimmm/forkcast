import {
  ANSWERED,
  ROADS,
  SOLVES,
  attach,
  barredAt,
  composePins,
  deadlinePassed,
  findRoad,
  fitFixtures,
  forcedHits,
  fplMarks,
  isExact,
  isRoll,
  makePin,
  noteAnswer,
  parseSpans,
  pinChip,
  pinConflicts,
  pinHits,
  pinKeep,
  pinNever,
  pinNotFor,
  pinRoll,
  pinSell,
  pinVeto,
  pinsDir,
  range,
  rollKeeps,
  ruleText,
  scopeOf,
  shirt,
  solveKept,
  solvedKey,
  solvedLineup,
  squadInto,
  subOrder,
  withBank
} from "./chunk-IBIGFFAK.js";
import {
  CHIPS,
  CHIPS_OFF,
  COPY,
  HALF,
  HIT_COST,
  LAST_ROUND,
  MAX_PER_CLUB,
  append,
  applyLineup,
  canUseChip,
  captainGap,
  cardSaysIt,
  changeText,
  chipName,
  clockText,
  compare,
  counted,
  evaluate,
  fill,
  flick,
  fmt,
  focusKey,
  ftGrant,
  gwFlags,
  h,
  hitCap,
  holdTouch,
  horizonFeature,
  icon,
  liveCheck,
  nextFt,
  pairMoves,
  planBanks,
  planInputs,
  plannerOf,
  playerLookup,
  plural,
  priceMorning,
  pricePlate,
  priceWatch,
  reduceMotion,
  refocus,
  roadToDraft,
  roving,
  sentence,
  setChip,
  setLineup,
  shownDelta,
  shownGain,
  solveGap,
  statusInfo,
  statusText,
  stepShare,
  subGap,
  svg,
  swapCandidates,
  swapLineup,
  toMs,
  toast,
  toastRegion,
  transfersOf,
  verdictLabel,
  waitFact,
  waitFacts,
  waitLines,
  waitedText,
  weekPoints,
  withForced,
  xpGain,
  xpNum
} from "./chunk-TCPZEJ5A.js";
import {
  __export
} from "./chunk-WSFCRVEQ.js";

// js/m/ahead.js
var ahead_exports = {};
__export(ahead_exports, {
  EDGE_MIN: () => EDGE_MIN,
  OWN_ALTS: () => OWN_ALTS,
  PLATE_MIN: () => PLATE_MIN,
  PREP_TIMING: () => PREP_TIMING,
  TAB_MIN: () => TAB_MIN,
  addMove: () => addMove,
  addPlan: () => addPlan,
  addYours: () => addYours,
  afterPaint: () => afterPaint,
  asYours: () => asYours,
  askPlace: () => askPlace,
  asksOf: () => asksOf,
  baked: () => baked,
  barred: () => barred,
  barringRule: () => barringRule,
  barringRules: () => barringRules,
  baseOf: () => baseOf,
  baseline: () => baseline,
  benchOnly: () => benchOnly,
  benchedBuys: () => benchedBuys,
  boughtIn: () => boughtIn,
  boxesMeet: () => boxesMeet,
  bringIn: () => bringIn,
  bringInFrom: () => bringInFrom,
  bringInTakes: () => bringInTakes,
  buyCandidates: () => buyCandidates,
  buyPlan: () => buyPlan,
  buyProblem: () => buyProblem,
  captain: () => captain,
  changedCards: () => changedCards,
  changedOf: () => changedOf,
  cheaperFirst: () => cheaperFirst,
  chipBack: () => chipBack,
  chipBests: () => chipBests,
  chipEdit: () => chipEdit,
  chipGain: () => chipGain,
  chipNumber: () => chipNumber,
  chipOff: () => chipOff,
  chipPlan: () => chipPlan,
  chipPreps: () => chipPreps,
  chipShown: () => chipShown,
  chipStates: () => chipStates,
  chipWeek: () => chipWeek,
  chipWeekGain: () => chipWeekGain,
  chipsAsked: () => chipsAsked,
  chipsAvail: () => chipsAvail,
  chooseOnPitch: () => chooseOnPitch,
  choosing: () => choosing,
  clashLine: () => clashLine,
  clashParts: () => clashParts,
  clashing: () => clashing,
  clearGain: () => clearGain,
  clockText: () => clockText,
  compare: () => compare2,
  countedAfter: () => countedAfter,
  deadlineInfo: () => deadlineInfo,
  decksOf: () => decksOf,
  draftOf: () => draftOf,
  dropMove: () => dropMove,
  editable: () => editable,
  emptyHead: () => emptyHead,
  endingOf: () => endingOf,
  estimate: () => estimate,
  extraWeek: () => extraWeek,
  factsWords: () => factsWords,
  failedWords: () => failedWords,
  fitsLater: () => fitsLater,
  forkFlights: () => forkFlights,
  forkValues: () => forkValues,
  fplSets: () => fplSets,
  fplSubs: () => fplSubs,
  frozenOf: () => frozenOf,
  fundingOf: () => fundingOf,
  gwMode: () => gwMode,
  headScale: () => headScale,
  hitsChoices: () => hitsChoices,
  holdBuy: () => holdBuy,
  ifMisses: () => ifMisses,
  inFor: () => inFor,
  inPlaceOf: () => inPlaceOf,
  inTeamAt: () => inTeamAt,
  inWords: () => inWords,
  initials: () => initials,
  inkAt: () => inkAt,
  inputsOf: () => inputsOf,
  isFrozen: () => isFrozen,
  isLive: () => isLive,
  isPick: () => isPick,
  itbWords: () => itbWords,
  keep: () => keep,
  keepPin: () => keepPin,
  keptCells: () => keptCells,
  keptFrom: () => keptFrom,
  liftAsk: () => liftAsk,
  liftsLive: () => liftsLive,
  lineMoves: () => lineMoves,
  lineNotices: () => lineNotices,
  listedOf: () => listedOf,
  listedRules: () => listedRules,
  litEdges: () => litEdges,
  litOf: () => litOf,
  litShown: () => litShown,
  mount: () => mount,
  moveTo: () => moveTo,
  movesInOrder: () => movesInOrder,
  multiMove: () => multiMove,
  never: () => never,
  noteOf: () => noteOf,
  onBase: () => onBase,
  oneLook: () => oneLook,
  openRules: () => openRules,
  otherUseOf: () => otherUseOf,
  owedAt: () => owedAt,
  ownAltsOf: () => ownAltsOf,
  paintWaitView: () => paintWaitView,
  pairMovesOf: () => pairMovesOf,
  pendingAgain: () => pendingAgain,
  pendingTick: () => pendingTick,
  pinOf: () => pinOf,
  pinOfMove: () => pinOfMove,
  pinsOf: () => pinsOf,
  pitchLeast: () => pitchLeast,
  plPays: () => plPays,
  placeBuys: () => placeBuys,
  placeDealt: () => placeDealt,
  placeFirst: () => placeFirst,
  placeLine: () => placeLine,
  placeOrder: () => placeOrder,
  placePages: () => placePages,
  placeSplit: () => placeSplit,
  plan: () => plan,
  planBack: () => planBack,
  planBaseline: () => planBaseline,
  planHasYours: () => planHasYours,
  planOfRoad: () => planOfRoad,
  planTake: () => planTake,
  planWeeks: () => planWeeks,
  plannerFor: () => plannerFor,
  plansOf: () => plansOf,
  plansWait: () => plansWait,
  presolveTaps: () => presolveTaps,
  problemOf: () => problemOf,
  problemShort: () => problemShort,
  problemText: () => problemText,
  problemsOf: () => problemsOf,
  reachOf: () => reachOf,
  removeMove: () => removeMove,
  removeRule: () => removeRule,
  removesText: () => removesText,
  repicks: () => repicks,
  replaceWith: () => replaceWith,
  replaceable: () => replaceable,
  reroute: () => reroute,
  rescope: () => rescope,
  resetForks: () => resetForks,
  resetLineup: () => resetLineup,
  resetPlan: () => resetPlan,
  rollFt: () => rollFt,
  rollOnly: () => rollOnly,
  rollingAt: () => rollingAt,
  rootStill: () => rootStill,
  rowGains: () => rowGains,
  ruleOf: () => ruleOf,
  rulesOf: () => rulesOf,
  saleBuy: () => saleBuy,
  saleOptions: () => saleOptions,
  sayBuyProblem: () => sayBuyProblem,
  sayCheer: () => sayCheer,
  scopeLabels: () => scopeLabels,
  sellAny: () => sellAny,
  sellFrom: () => sellFrom,
  sellOut: () => sellOut,
  sellWeek: () => sellWeek,
  setHitsMaxWithUndo: () => setHitsMaxWithUndo,
  settlesAt: () => settlesAt,
  shirtOf: () => shirtOf,
  showTipsAgain: () => showTipsAgain,
  sideEffects: () => sideEffects,
  singleMove: () => singleMove,
  slotsBeside: () => slotsBeside,
  solveFor: () => solveFor,
  solvesRound: () => solvesRound,
  squadBefore: () => squadBefore,
  squadChanges: () => squadChanges,
  squadWeek: () => squadWeek,
  stepShare: () => stepShare,
  stopAhead: () => stopAhead,
  stopChoosing: () => stopChoosing,
  sub: () => sub,
  subChoices: () => subChoices,
  subLineup: () => subLineup,
  suggestionsOf: () => suggestionsOf,
  takenBy: () => takenBy,
  takenKeep: () => takenKeep,
  takesBack: () => takesBack,
  tickWas: () => tickWas,
  tiedBuy: () => tiedBuy,
  totalShift: () => totalShift,
  useChip: () => useChip,
  valuesFor: () => valuesFor,
  veto: () => veto,
  vice: () => vice,
  viewOfRoadWeek: () => viewOfRoadWeek,
  waitView: () => waitView,
  waitedText: () => waitedText,
  want: () => want,
  watchOf: () => watchOf,
  watchView: () => watchView,
  weekBest: () => weekBest,
  weekChanged: () => weekChanged,
  weekFacts: () => weekFacts,
  weekKey: () => weekKey,
  weekOf: () => weekOf,
  weekRollOf: () => weekRollOf,
  weekSettled: () => weekSettled,
  weekWait: () => weekWait,
  weekWith: () => weekWith,
  whenOf: () => whenOf,
  whenOnBase: () => whenOnBase,
  whyFacts: () => whyFacts,
  windowOf: () => windowOf,
  wishPin: () => wishPin,
  wishSolve: () => wishSolve,
  xpShown: () => xpShown,
  yoursTakenBack: () => yoursTakenBack
});

// js/m/ahead/core.js
var core_exports = {};
__export(core_exports, {
  EDGE_PX: () => EDGE_PX,
  FLASH: () => FLASH,
  GRIP_MS: () => GRIP_MS,
  LEARN_KEY: () => LEARN_KEY,
  LONG_MS: () => LONG_MS,
  MINUS: () => MINUS,
  NIGHT_KEY: () => NIGHT_KEY,
  OFFLINE_EDIT: () => OFFLINE_EDIT,
  REMOVED: () => REMOVED,
  SPENT_PX: () => SPENT_PX,
  SWIPE_MS: () => SWIPE_MS,
  SWIPE_PX: () => SWIPE_PX,
  TC_MS: () => TC_MS,
  WAIT_KEY: () => WAIT_KEY,
  WHY_SHEET: () => WHY_SHEET,
  addMove: () => addMove,
  afterPaint: () => afterPaint,
  asYours: () => asYours,
  baked: () => baked,
  baseOf: () => baseOf,
  baseline: () => baseline,
  bestOf: () => bestOf,
  boardMarks: () => boardMarks,
  boughtIn: () => boughtIn,
  bump: () => bump,
  capFirst: () => capFirst,
  clockText: () => clockText,
  clone: () => clone,
  closedOf: () => closedOf,
  clubCounts: () => clubCounts,
  compare: () => compare2,
  draftOf: () => draftOf,
  dropDrafted: () => dropDrafted,
  dropMove: () => dropMove,
  editable: () => editable,
  estimate: () => estimate,
  flashLanding: () => flashLanding,
  flatMoves: () => flatMoves,
  frozenOf: () => frozenOf,
  ids: () => ids,
  inFor: () => inFor,
  inTeamAt: () => inTeamAt,
  info: () => info,
  inputs: () => inputs,
  inputsOf: () => inputsOf,
  isFrozen: () => isFrozen,
  isPick: () => isPick,
  leftBehind: () => leftBehind,
  lineups: () => lineups,
  lockedFrom: () => lockedFrom,
  memOf: () => memOf,
  memPlan: () => memPlan,
  movedFrom: () => movedFrom,
  noteRemoved: () => noteRemoved,
  num: () => num,
  openRules: () => openRules,
  ownCount: () => ownCount,
  paintWaitView: () => paintWaitView,
  pairAsPlaced: () => pairAsPlaced,
  pairedMoves: () => pairedMoves,
  pairsOf: () => pairsOf,
  picksAt: () => picksAt,
  plan: () => plan,
  problemOf: () => problemOf,
  problemShort: () => problemShort,
  problemText: () => problemText,
  problemsOf: () => problemsOf,
  removedAt: () => removedAt,
  removedBy: () => removedBy,
  roadDraft: () => roadDraft,
  sameMove: () => sameMove,
  sameSet: () => sameSet,
  sameView: () => sameView,
  setFlash: () => setFlash,
  setLineups: () => setLineups,
  showTipsAgain: () => showTipsAgain,
  solveFor: () => solveFor,
  span: () => span,
  squadBefore: () => squadBefore,
  stepShare: () => stepShare,
  sum: () => sum,
  takeRulesAsk: () => takeRulesAsk,
  valuesFor: () => valuesFor,
  valuesKey: () => valuesKey,
  viewOfRoadWeek: () => viewOfRoadWeek,
  viewOfState: () => viewOfState,
  viewedGw: () => viewedGw,
  waitView: () => waitView,
  waitedText: () => waitedText,
  weekOf: () => weekOf,
  whyAct: () => whyAct,
  wishDrop: () => wishDrop,
  wishPin: () => wishPin,
  withMoves: () => withMoves
});

// js/m/ahead/presolve.js
var presolve_exports = {};
__export(presolve_exports, {
  AHEAD: () => AHEAD,
  DRY: () => DRY,
  OWN_ALTS: () => OWN_ALTS,
  PAIR: () => PAIR,
  PAIR_AGAIN_MS: () => PAIR_AGAIN_MS,
  PAIR_HOLD_MS: () => PAIR_HOLD_MS,
  PAIR_TAKES: () => PAIR_TAKES,
  PREP_BESIDE: () => PREP_BESIDE,
  ROOT_NARROW: () => ROOT_NARROW,
  addPlan: () => addPlan,
  addYours: () => addYours,
  aheadAsks: () => aheadAsks,
  aheadWaited: () => aheadWaited,
  boughtBy: () => boughtBy,
  cardGain: () => cardGain,
  cheaperFirst: () => cheaperFirst,
  clearRoots: () => clearRoots,
  extraWeek: () => extraWeek,
  fundingOf: () => fundingOf,
  goneIds: () => goneIds,
  ifMisses: () => ifMisses,
  madeEarlier: () => madeEarlier,
  mayAnswer: () => mayAnswer,
  moveTo: () => moveTo,
  movesInOrder: () => movesInOrder,
  movesKey: () => movesKey,
  noHitsFrom: () => noHitsFrom,
  onBase: () => onBase,
  otherUseOf: () => otherUseOf,
  owedAt: () => owedAt,
  owedRoad: () => owedRoad,
  ownAltsOf: () => ownAltsOf,
  ownLeft: () => ownLeft,
  pairChanged: () => pairChanged,
  pairMovesOf: () => pairMovesOf,
  pairOf: () => pairOf,
  paysBack: () => paysBack,
  pinOfMove: () => pinOfMove,
  planTake: () => planTake,
  planTakeDraft: () => planTakeDraft,
  presolveSwap: () => presolveSwap,
  presolveTaps: () => presolveTaps,
  pumpAhead: () => pumpAhead,
  refusalRoads: () => refusalRoads,
  removeMove: () => removeMove,
  removeWeek: () => removeWeek,
  repicks: () => repicks,
  rollingAt: () => rollingAt,
  rootStill: () => rootStill,
  rowGains: () => rowGains,
  sameWindow: () => sameWindow,
  showSuggestion: () => showSuggestion,
  showTransfer: () => showTransfer,
  showingAt: () => showingAt,
  shownGain: () => shownGain2,
  soldBy: () => soldBy,
  stopAhead: () => stopAhead,
  suggestedAt: () => suggestedAt,
  swapAsked: () => swapAsked,
  swapComing: () => swapComing,
  swapGain: () => swapGain,
  swapWeek: () => swapWeek,
  takenKeep: () => takenKeep,
  tapNow: () => tapNow,
  tapSpent: () => tapSpent,
  tappedSuggestion: () => tappedSuggestion,
  tiedBuy: () => tiedBuy,
  tookCmp: () => tookCmp,
  tookOf: () => tookOf,
  weekOnto: () => weekOnto,
  weekTaps: () => weekTaps,
  whenOf: () => whenOf,
  whenOnBase: () => whenOnBase,
  whyFacts: () => whyFacts,
  windowRounds: () => windowRounds,
  wishWeeks: () => wishWeeks,
  withFlag: () => withFlag,
  yoursTakenBack: () => yoursTakenBack
});

// js/m/ahead/pieces.js
var pieces_exports = {};
__export(pieces_exports, {
  PREP: () => PREP,
  PREPS: () => PREPS,
  PREP_TIMING: () => PREP_TIMING,
  chipBack: () => chipBack,
  chipBests: () => chipBests,
  chipCheck: () => chipCheck,
  chipGain: () => chipGain,
  chipPreps: () => chipPreps,
  chipStates: () => chipStates,
  chipTold: () => chipTold,
  chipWeekGain: () => chipWeekGain,
  chipWeekOf: () => chipWeekOf,
  chipsAsked: () => chipsAsked,
  chipsAvail: () => chipsAvail,
  clearGain: () => clearGain,
  emptyHead: () => emptyHead,
  factsWords: () => factsWords,
  halfBests: () => halfBests,
  halfEnd: () => halfEnd,
  honestBest: () => honestBest,
  itbWords: () => itbWords,
  keptBest: () => keptBest,
  nextFts: () => nextFts,
  plPays: () => plPays,
  plannedAt: () => plannedAt,
  prepItems: () => prepItems,
  prepKeep: () => prepKeep,
  prepsWaiting: () => prepsWaiting,
  rollFt: () => rollFt,
  shirtOf: () => shirtOf,
  squadWeek: () => squadWeek,
  weekFacts: () => weekFacts,
  xpShown: () => xpShown
});

// js/m/ahead/screen-head.js
function headPart(V) {
  const pageName = (team) => h("h1.sr-only", null, team ? `${team} \xB7 Forkcast` : "Forkcast");
  function resetTap() {
    const { S, ctx } = V;
    const r = S.reset;
    if (!r) return;
    if (r.lu && r.plan) resetSheet(r.gw);
    else if (r.lu) resetLineup(ctx, r.gw);
    else if (r.plan) resetPlan(ctx);
  }
  function resetSheet(g) {
    const { ctx } = V;
    const title = COPY.resetTitle;
    ctx.sheets.open({
      title,
      detent: "medium",
      fit: true,
      cls: "cs ah-rssheet",
      label: title,
      build(body, sheet) {
        const row = (name, what, run) => h(
          "button.ah-lrow",
          { type: "button", "aria-label": `${name}: ${what}`, onClick: () => {
            sheet.close();
            run();
          } },
          h("span.mk", { "aria-hidden": "true" }, "\u21BA"),
          h("span.nm", null, h("b", null, name), h("span", null, what))
        );
        append(body, h(
          "div.ah-list",
          { role: "group", "aria-label": title },
          row(COPY.resetLineupName(g), COPY.resetLineupWhat(g), () => resetLineup(ctx, g)),
          row(COPY.resetAll, COPY.resetPlanWhat, () => resetPlan(ctx))
        ));
      }
    });
  }
  function learn(name) {
    const { HINTS, S, ctx } = V;
    if (S.learnt.has(name)) return;
    S.learnt.add(name);
    ctx.api?.local?.set?.(LEARN_KEY, JSON.stringify([...S.learnt]));
    for (const [n, k] of HINTS) if (k === name) n.hidden = true;
  }
  const gwNow = (P) => {
    const { ctx } = V;
    return viewedGw(ctx, P);
  };
  const setGw = (g) => {
    const { ctx } = V;
    const P = plan(ctx);
    if (!P) return;
    if (!P.gws.includes(g)) {
      const n = P.reach.indexOf(g) + 1;
      if (n > 0 && g > P.end) toast(lockedFrom(P, n) ? COPY.weekLocked(g) : COPY.weekOff(g, P.gws.length), "info");
      else if (g > P.end) toast(`${COPY.forecastEdge(g)} Plans cover ${span(P.gws)}.`, "info");
      return;
    }
    const from = gwNow(P);
    if (g !== from) V.holdStack(from, g);
    const b = ctx.store.get("bringing");
    if (b && b.g !== g) stopChoosing(ctx);
    ctx.store.set("gw", g);
  };
  const outerH = (x) => {
    const s = getComputedStyle(x);
    return x.getBoundingClientRect().height + parseFloat(s.marginTop) + parseFloat(s.marginBottom);
  };
  const rowsH = (card) => [...card.children].reduce((t, c) => t + c.getBoundingClientRect().height, 0);
  function fitBlock() {
    const { FACTS_PROBE, barNode, doorStubs, factSpans, strip } = V;
    const real = strip.querySelector(":scope > .ah-block:not(.ah-fitprobe)");
    strip.style.removeProperty("--ah-bar-h");
    const { gw, bank } = FACTS_PROBE, sep = "\xA0\xB7\xA0";
    const facts = () => factSpans(factsWords(FACTS_PROBE), true), wln = h(
      "span.ah-wln",
      null,
      h("span.ah-bn.ah-cw", null, COPY.planningWeek(gw, 10, 10, "plan")),
      h("span.ah-wclock.m-num", null, `${sep}0:00`)
    );
    const checks = [
      h("span.ah-blead", null, h("span.ah-fact", null, COPY.ftNow(FACTS_PROBE.ft)), " \xB7 ", h("span.ah-fact", null, itbWords(bank)[0]), sep),
      h("span.ah-brest", null, wln)
    ];
    const probes = [facts(), checks].map((two) => {
      const b = h("section.ah-block.ah-fitprobe", { "aria-hidden": "true" }, barNode({ one: h("span.ah-bt.ah-bst", null, h("span.ah-tl", null, COPY.noTransferMade)), two, doors: doorStubs() }));
      b.style.width = `${strip.clientWidth}px`;
      strip.append(b);
      return b;
    });
    const hgt = (x) => x.getBoundingClientRect().height;
    const v = Math.max(...probes.map((b) => hgt(b)), real ? hgt(real) : 0);
    const bar = real?.querySelector(":scope > .ah-pbar");
    strip.style.setProperty("--ah-bar-h", `${Math.max(...probes.map((b) => hgt(b.firstChild)), bar ? hgt(bar) : 0)}px`);
    for (const b of probes) b.remove();
    return v;
  }
  function fitHead() {
    const { S, gwline, head, keepGwLine } = V;
    const busy = gwline.classList.contains("ah-planning");
    if (busy && S.dl) paintDeadline(S.dl.g, S.dl.A);
    gwline.classList.add("ah-bare");
    keepGwLine();
    const v = outerH(head);
    gwline.classList.remove("ah-bare");
    if (busy) paintPlanStatus();
    keepGwLine();
    return v;
  }
  function fitPitch() {
    const { ctl, el, head, pitchHost, remProbe, slot, strip } = V;
    const W = el.clientWidth, H = el.clientHeight, rem = remProbe.getBoundingClientRect().height;
    const drawn = !!strip.querySelector(":scope > .ah-block > .ah-pbar:not(.ah-pbake)");
    const pm = pitchHost.querySelector(":scope > .pm");
    const card = strip.querySelector(":scope > .ah-ticket:not(.ah-tkghost)"), own = card ? Math.ceil(rowsH(card)) : 0;
    const key = `${W}x${H}@${rem}|${head.offsetHeight}|${slot.offsetHeight}|${drawn}|${!!pm}|${getComputedStyle(pitchHost).marginTop}|${own}`;
    if (!W || !H || ctl.hidden || key === V.fitKey) return;
    V.fitKey = key;
    V.fitDrawn = drawn && !!pm;
    const s = getComputedStyle(el);
    const [tab, least, gap] = cssPx(el, "var(--ah-tab-h)", "var(--ah-ticket-h)", "var(--ah-stack-gap)"), ticket = Math.max(least, own);
    const tabs = (V.ctx.data?.horizon?.length ?? 4) - 1;
    const above = parseFloat(s.paddingTop) + fitHead() + outerH(slot) + tabs * tab + ticket + 2 * gap + parseFloat(getComputedStyle(pitchHost).marginTop) + parseFloat(s.paddingBottom);
    el.style.setProperty("--ah-pitch-fit", `${Math.floor(H - above)}px`);
    if (!pm) return;
    const [chrome, hlo, plate, foot] = cssPx(pm, "var(--pm-chrome)", "var(--pm-hlo)", "var(--pm-plate)", "var(--pm-foot)");
    el.style.setProperty("--ah-pitch-least", `${Math.ceil(pitchLeast({ chrome, hlo, plate, foot }))}px`);
  }
  function redeck() {
    const { S, placeHint, renderDecks } = V;
    if (S.landing) return;
    const keys = focusedKeys();
    renderDecks();
    placeHint();
    keepFocus(keys);
  }
  const schedule = (part = "all") => {
    const { S, ctx } = V;
    S.part = !S.queued || S.part === part ? part : "all";
    if (S.queued) return;
    S.queued = true;
    queueMicrotask(() => {
      S.queued = false;
      if (S.down.size || covered()) S.held = true;
      else if (S.part === "pair" && S.drawn && plan(ctx) === S.drawn) renderPair();
      else if (S.part !== "mem" || !S.drawn || plan(ctx) !== S.drawn) render();
    });
  };
  const covered = () => {
    const { S, shell } = V;
    return !!shell?.classList.contains("sheet-large") && !(S.week && !S.week.sheet.el.inert);
  };
  function paintAvatar() {
    const { avatar, ctx } = V;
    const e = ctx.bundle?.entry;
    const st = ctx.status();
    fill(avatar, initials(e), st.tone === "fresh" ? null : h("span.ah-dot", { class: st.tone }));
    avatar.setAttribute("aria-label", `You${e?.team_name ? ` \xB7 ${e.team_name}` : ""} \xB7 ${st.text}`);
  }
  function renderHead() {
    const { avatar, ctx, gwline, head, setBtn } = V;
    const team = ctx.bundle?.entry?.team_name ?? "";
    if (globalThis.document) document.title = team ? `${team} \xB7 Forkcast` : "Forkcast";
    fill(head, pageName(team), setBtn, h("div.ah-hmid", null, h("div.ah-team", null, team), gwline), V.stand, avatar);
  }
  function renderGwLine(g, A) {
    const { S, gwline } = V;
    S.dl = { g, A };
    gwline.dataset.gw = g;
    if (!paintPlanStatus()) paintDeadline(g, A);
  }
  function paintDeadline(g, A) {
    const { ctx, dlEl, gwline } = V;
    const info2 = deadlineInfo(deadlineOf(ctx.bundle, A, g));
    gwline.classList.remove("ah-planning");
    fill(dlEl, info2.date ? [h("b", null, info2.left <= 0 ? "Deadline passed" : [h("span.sr-only", null, "Deadline "), info2.short]), h("span.ah-dl", { class: info2.tone }, countdownParts(info2))] : null);
    dlEl.title = info2.date ? `Gameweek ${g} deadline: ${info2.long}` : "";
  }
  const planWait = () => {
    const { ctx } = V;
    return ctx.bundle?.entry ? memOf(ctx)?.model() ?? null : null;
  };
  const replanning = () => {
    const { ctx } = V;
    const m = planWait();
    return ctx.store.get("conn")?.state === "updating" || !!m && !m.road && !m.error && m.since != null;
  };
  function paintPlanStatus() {
    const { gwline } = V;
    gwline.classList.remove("ah-planning");
    return false;
  }
  function tick() {
    const { S, ctl, ctx, dlEl, fitFacts, gwline, keepGwLine, pitchHost, strip } = V;
    const was = dlEl.querySelector(".ah-dl")?.textContent;
    if (!ctl.hidden && waitNow()) paintPlanStatus();
    paintWait();
    pendingTick(ctx);
    if (S.wait) for (const c of [strip, pitchHost, S.week?.host].flatMap((x) => [...x?.querySelectorAll(".ah-wclock") ?? []])) c.textContent = clockShown(c);
    if (S.wait && S.line && waited().length !== S.line.n) {
      S.line.n = waited().length;
      fitFacts();
    }
    const due = S.drawn && S.M && !S.M.settled ? settleDue(S.M.key) : null;
    if (due != null && Date.now() >= due) schedule("pair");
    const dl = dlEl.querySelector(".ah-dl");
    if (dl && S.dl) {
      const info2 = deadlineInfo(deadlineOf(ctx.bundle, S.dl.A, S.dl.g));
      fill(dl, countdownParts(info2));
      dl.className = `ah-dl ${info2.tone}`;
      if (dl.textContent !== was) keepGwLine();
    }
    if (isLive(ctx) !== S.live) {
      S.live = isLive(ctx);
      render();
    }
  }
  const hosts = () => {
    const { S, decks, strip } = V;
    return [strip, decks, S.week?.host].filter(Boolean);
  };
  const focusedKeys = () => hosts().map((x) => [x, x.contains(document.activeElement) ? focusKey(document.activeElement) ?? "[data-focus-home]" : null]);
  const keepFocus = (keys) => {
    const { S, strip } = V;
    for (const [x, key] of keys) if (key && x.isConnected) refocus(x, key, x === S.week?.host ? S.week.sheet.el : strip.querySelector("[data-focus-home]"));
  };
  function renderPair() {
    const { S, placeHint, renderDecks } = V;
    const P = S.drawn, w = weekOf(P, gwNow(P));
    if (!w) {
      render();
      return;
    }
    const keys = focusedKeys();
    renderWeek(P, w);
    renderDecks();
    placeHint();
    keepFocus(keys);
  }
  function render() {
    const { S, asksHost, closePlace, ctl, ctx, decks, dlEl, landMotion, noticeSaid, pitchHost, placeHint, renderDecks, renderPdBtn, renderPitch, renderRail, renderTotal, strip, ticks, totLine, totSaid, totalEl, weekSheet } = V;
    const b = ctx.bundle;
    S.drawn = null;
    if (!b) return;
    paintAvatar();
    renderHead();
    if (b.state === "offline-data" || !b.entry) {
      fill(strip, h("p.m-para.ah-pre", null, COPY.preseason));
      closePlace(false);
      [dlEl, totLine, asksHost, pitchHost, decks, ticks, totalEl, totSaid, noticeSaid].forEach((x) => fill(x));
      S.week?.sheet.close();
      ctl.hidden = true;
      return;
    }
    ctl.hidden = false;
    const P = plan(ctx);
    if (!P) return renderBaking();
    const g = gwNow(P);
    const w = weekOf(P, g);
    if (!w) return renderBaking();
    S.drawn = P;
    const fresh = FLASH && FLASH.at !== S.flashAt && FLASH.team === `${P.entry}|${P.A}` ? FLASH : null;
    if (fresh) S.flashAt = fresh.at;
    const keys = focusedKeys();
    if (takeRulesAsk(g)) queueMicrotask(() => weekSheet(g, "rules"));
    renderGwLine(g, P.A);
    renderRules(P);
    renderWeek(P, w);
    S.snap = null;
    renderPitch(P, w);
    V.paintChoosing(P, w);
    renderRail(P, g);
    renderTotal(P);
    renderPdBtn();
    if (!V.fitKey || !V.fitDrawn) fitPitch();
    renderDecks();
    placeHint(P, w);
    keepFocus(keys);
    landMotion(fresh, g);
    if (fresh) {
      const tint = (x) => {
        x.classList.add("m-shimmer", "once");
        setTimeout(() => x.classList.remove("m-shimmer", "once"), 950);
      };
      for (const t of ticks.querySelectorAll(".ah-tick")) if (fresh.gws.includes(Number(t.dataset.gw))) tint(t);
      const line = strip.querySelector('[data-row="week"]');
      if (line && fresh.rows?.[g]?.length) tint(line);
      for (const r of S.week?.host.querySelectorAll(".ah-mrow") ?? []) if (fresh.rows?.[g]?.includes(`${r.dataset.out}>${r.dataset.in}`)) tint(r.querySelector(".ah-fg") ?? r);
      for (const id of fresh.cards?.[g] ?? []) {
        const pn = pitchHost.querySelector(`.pm-card[data-id="${id}"] .pm-pn`);
        if (pn) tint(pn);
      }
    }
  }
  function renderBaking() {
    const { COPY_FPL_TEAM, S, asksHost, ctx, decks, edgeTicks, firstCard, mountHere, plateOf, rail, renderPdBtn, rsBtn, sizeTitle, strip, tabAt, ticks, totLine, totalEl } = V;
    const d = ctx.data;
    renderGwLine(d.gw, d.gw);
    S.week?.sheet.close();
    const gp = memPlan(ctx), m = planWait(), held = !!gp?.hold && !!gp.error && !gp.pending, failed = held || !!m?.error;
    const FV = held ? { ...info(ctx), mem: gp, pins: gp.pins, weeks: [], healing: false, editable: editable(ctx) } : null;
    const c = FV && aboutRules(gp.error) ? clashParts(FV, null) : null;
    const why = (held ? gp.error.plain : null) || COPY.unfinished, again = () => held ? memOf(ctx).heal({ now: true }) : memOf(ctx).retryModel();
    const off = (p) => {
      const said = COPY.removed(rowName(FV, p)), r = memOf(ctx).removePin(p.id);
      toastOf(ctx)(said, "info", { action: { label: "Undo", onClick: () => r.undo() } });
    };
    fill(strip, firstCard(
      d.gw,
      failed ? why : COPY_FPL_TEAM,
      failed ? h("button.ah-go", { type: "button", onClick: again }, "Try again") : null,
      c?.pins.length ? h(
        "div.ah-brow.ah-ask.ah-clash",
        { role: "status" },
        icon("warn", { size: 16 }),
        h("p.ah-askt", null, COPY.rulesStuck(c.what, null, COPY.clashWhy(gp.error.why, gp.error.gw))),
        h("div.ah-askb", null, c.pins.map((p) => h("button.ah-askno", { type: "button", disabled: !FV.editable, onClick: () => off(p) }, `Remove ${rowName(FV, p)}`)))
      ) : null
    ));
    sizeTitle(strip);
    fill(decks);
    S.M = null;
    S.wl = null;
    S.lineKeep = false;
    paintWait();
    S.pitch = null;
    S.reset = null;
    rsBtn.hidden = true;
    mountHere({
      ...d.lineup,
      players: d.byId,
      gw: d.gw,
      horizon: d.xpGws,
      first: true,
      benchRow: true,
      gapRows: true,
      second: plateOf().second,
      onPlayer: (id) => ctx.openSheet("player", id, { gw: d.gw })
    });
    fill(asksHost);
    const past = edgeTicks({ reach: d.reach ?? d.horizon, gws: d.horizon });
    rail.style.setProperty("--n", d.horizon.length + past.length);
    rail.style.setProperty("--i", 0);
    fill(ticks, d.horizon.map((x) => {
      const { style, ...at } = tabAt(x, d.gw);
      return h("div.ah-tick", { dataset: { gw: x }, style, class: { ...at, pencil: x > d.gw } }, h("span.g", null, `GW${x}`), h("span.a"), h("span.b"), h("span.p", null, h("span.m-skel")));
    }), past);
    strip.style.order = -d.gw;
    fill(totLine, h("span.k", null, `${span(d.horizon)} `), h("span.m-skel"));
    fill(totalEl, span(d.horizon), " ", h("span.m-skel"));
    renderPdBtn();
    if (!V.fitKey || !V.fitDrawn) fitPitch();
  }
  function renderRules(P) {
    const { asksHost, ctx } = V;
    const rules = listedRules(P, gwNow(P));
    if (!rules.length) {
      fill(asksHost);
      return;
    }
    const live = isLive(ctx);
    const offLive = rules.some((p) => ruleOf(P, p).removable && liftsLive(ctx, P, p)) || live && rules.length > 1;
    fill(asksHost, h(
      "section.ah-rules",
      { "aria-label": COPY.rulesHead },
      h(
        "div.ah-list",
        null,
        h(
          "div.ah-rules-row",
          { role: "list" },
          rules.map((p) => {
            const r = ruleOf(P, p);
            return h(
              "div.ah-rrow",
              { role: "listitem" },
              h("button.ah-rule", { type: "button", class: { lock: !r.removable }, "aria-label": `${r.text}. ${r.desc}`, onClick: () => ruleSheet(p) }, r.text),
              r.removable ? h("button.m-chipbtn.m-danger.ah-rmv", { type: "button", disabled: !P.editable || liftsLive(ctx, P, p), "aria-label": `Remove ${r.text}`, dataset: { rule: p.id }, onClick: () => removeRule(ctx, p.id) }, "Remove") : null
            );
          }),
          rules.length > 1 ? h("div.ah-rrow.all", { role: "listitem" }, h("button.m-chipbtn.m-danger.ah-rmv", { type: "button", disabled: !P.editable || live, onClick: () => clearAll() }, "Remove all")) : null
        ),
        offLive && gwNow(P) !== P.A ? h("p.ah-rules-note.m-foot", null, COPY.live(P.A)) : null
      )
    ));
  }
  function ruleSheet(p) {
    const { ctx } = V;
    const P = plan(ctx);
    const r = ruleOf(P, p);
    ctx.sheets.open({
      title: r.text,
      sub: r.desc,
      detent: "small",
      build(body, sheet) {
        if (r.scope && !p.via) {
          const g = num(p.gw) ?? P.A;
          const words = scopeLabels(p.kind, g, P.end);
          const opts = [["gw", words.gw], ["all", words.all]];
          body.append(roving(h(
            "div.m-seg.ah-scope",
            { role: "radiogroup", "aria-label": "When", style: { "--n": 2, "--i": r.scope === "gw" ? 0 : 1 } },
            h("span.m-seg-thumb"),
            opts.map(([k, l]) => h("button", {
              type: "button",
              role: "radio",
              "aria-checked": String(k === r.scope),
              disabled: !P.editable,
              onClick: () => {
                if (k === r.scope) return;
                sheet.close();
                rescope(ctx, p, k);
              }
            }, l))
          ), { pick: (b) => b.click() }));
        }
        const live = liftsLive(ctx, P, p);
        body.append(h(
          "div.ah-btnrow",
          null,
          h("button.m-danger", { type: "button", disabled: !P.editable || live, onClick: () => {
            sheet.close();
            removeRule(ctx, p.id);
          } }, "Remove")
        ));
        if (!P.editable || live) body.append(h("p.ah-why", null, P.editable ? COPY.live(P.A) : P.why));
      }
    });
  }
  function clearAll() {
    const { ctx } = V;
    const P = plan(ctx);
    const asks = listedRules(P, gwNow(P));
    const what = COPY.removedRules(asks.length);
    edit(ctx, { drop: asks.map((p) => p.id), from: P.A, what, text: vsPrev(ctx, what) });
  }
  const driftRoom = (P, w) => P.weeks.filter((x) => x.gw <= w.gw).flatMap((x) => x.moves.map((m) => m.out)).reduce((s, p) => s + Math.max(0, (P.L.priceT(p) ?? 0) - (P.L.sellT(p) ?? P.L.priceT(p) ?? 0)), 0) / 10;
  const owes = (P, g) => P.pins.some((p) => p.id === "hold" && (p.debts || []).includes(g));
  const priceDrift = (P, w) => {
    const { ap0 } = V;
    return w.gw > P.A && !ap0(P, w.gw) && w.bank != null && w.bank < -1e-9 && -w.bank <= driftRoom(P, w) + 1e-9 && !owes(P, w.gw);
  };
  function heldOrder(P, g, plans) {
    const { S } = V;
    const key = (pl) => `${pl.choice.moves.map((m) => `${m.out}>${m.in}`).sort().join(",")}|${JSON.stringify(pl.choice.chips)}`;
    const busy = plans.some((x) => x.state === "solving");
    const was = S.planAt?.P === P && S.planAt.g === g ? S.planAt : null;
    const at = new Map((busy && was ? was.keys : []).map((k, i) => [k, i]));
    const out = busy && was ? plans.slice().sort((a, b) => (at.get(key(a)) ?? 1e9) - (at.get(key(b)) ?? 1e9)) : plans;
    if (!busy && was?.busy && out.some((pl, i) => key(pl) !== was.keys[i])) S.addAt = Date.now();
    S.planAt = { P, g, busy, keys: out.map(key) };
    return out;
  }
  function renderWeek(P, w) {
    const { S, cheerEl, ctx, drawWeek, renderLine, sayCarried } = V;
    const M = weekModel(P, w);
    S.M = M;
    renderLine(P, w, M);
    if (S.week) drawWeek(P, w, M);
    S.tint = null;
    if (S.addAt && !(S.flowAt >= S.addAt)) S.flowAt = Date.now();
    sayCarried(P);
    pendingAgain(ctx, P.mem);
    const W = waitNow(), waiting = !!W?.plan;
    if (waiting) S.act2 = "due";
    const late = !waiting && S.act2 === "due";
    if (late) S.act2 = "said";
    sayCheer(ctx, P, cheerEl, waiting || late, W?.done || late ? 1 : 0, { linger: late });
  }
  function waitNow() {
    const { S, ctl, ctx } = V;
    if (ctl.hidden) return null;
    const conn = ctx.store.get("conn")?.state, now = Date.now();
    if (conn === "updating") {
      S.waitAll = null;
      return { key: "updating", word: "Updating", scope: "the forecast", p: null };
    }
    const plan2 = replanning(), w = S.wait ? S.wl : null;
    if (!plan2 && !w) {
      S.waitAll = null;
      return null;
    }
    const A = S.waitAll ??= { t0: (plan2 ? planWait()?.since : null) ?? S.wait?.t0 ?? now, plan: false, max: 0 };
    A.plan ||= plan2;
    const n = (A.plan ? 1 : 0) + (w?.n ?? 0), done = (A.plan && !plan2 ? 1 : 0) + (w?.done ?? 0);
    const at = w && !plan2 ? w.at : A.t0, tau = w?.tau ?? 4e3;
    const p = A.max = Math.max(A.max, stepShare(done, n, reduceMotion() ? 0 : now - at, tau));
    const gws = ctx.data?.horizon, scope = w ? `GW${w.g}` : gws?.length ? span(gws) : null;
    return {
      key: "wait",
      word: COPY.waitWord,
      scope,
      long: w ? `GW${w.g}'s moves` : null,
      prog: n > 1 ? `${Math.min(done + 1, n)} of ${n}` : null,
      so: (now - A.t0) / 1e3,
      p,
      plan: A.plan,
      done
    };
  }
  function paintWait() {
    const { S, fitFacts, strip, waitSaid, waitV } = V;
    const W = waitNow(), block = strip.querySelector(":scope > .ah-block:not(.ah-fitprobe)"), pbt = block?.querySelector(".ah-pbt");
    const on = !!W && !!pbt, was = !!block?.classList.contains("ah-waiting");
    block?.classList.toggle("ah-waiting", on);
    block?.classList.toggle("ah-wkeep", on && !!S.lineKeep);
    paintDim(W);
    if (on) {
      if (waitV.t.parentNode !== pbt) pbt.append(waitV.t);
      if (waitV.bar.parentNode !== block) block.append(waitV.bar);
      paintWaitView(waitV, W);
    } else {
      waitV.t.remove();
      waitV.bar.remove();
      waitV.key = null;
    }
    if (was && !on) fitFacts();
    const said = W ? `${W.word} ${W.long ?? W.scope ?? ""}`.trim() : S.waitWas ? "Plan ready" : "";
    if (W || S.waitWas) {
      if (waitSaid.textContent !== said) waitSaid.textContent = said;
      S.waitWas = W?.word ?? null;
    }
  }
  function paintDim(W) {
    const { S, WAIT_DIM_MS, el, pitchHost } = V;
    const now = Date.now(), dim = (on) => {
      for (const x of [el, pitchHost]) x.classList.toggle("ah-wait", on);
    };
    if (!W) {
      S.dimT0 = null;
      clearTimeout(S.dimTimer);
      S.dimTimer = null;
      dim(false);
      return;
    }
    S.dimT0 ??= now;
    const left = S.dimT0 + WAIT_DIM_MS - now;
    dim(left <= 0);
    if (left > 0 && !S.dimTimer) S.dimTimer = setTimeout(() => {
      S.dimTimer = null;
      paintWait();
    }, left + 5);
  }
  function weekModel(P, w) {
    const { S, clashRow, ctx, forecastLine, frozenAt, keepNight, noteRow, sayNight, waitSig, waitWatch, weekPending } = V;
    const g = w.gw, sq = squadWeek(w);
    const ink = inkAt(ctx, P, g);
    const all = plansOf(ctx, P, g);
    const plans = ink ? [] : listedOf(heldOrder(P, g, all)).filter((pl) => !CHIPS_OFF || !pl.choice.chips?.[g] || pl.self || pl.refRow);
    plans.filter((pl) => pl.forced && pl.state === "ready").forEach((pl) => {
      pl.gain = shownGain2(ctx, P, g, pl);
    });
    const shownOut = !!all.forcedOut || shownWaits(plans) || !!all.forcedFlying && !plans.some((pl) => pl.forced);
    const settled = weekSettled(P, g, all), key = weekKey(P, g, all);
    const { decks, toks } = decksOf(P, w, { sq, plans });
    const lit = litOf(P, w, { sq, plans, settled, shownOut }, decks, toks);
    decks.drawn = S.decks?.gw === g ? S.decks.drawn : null;
    decks.drawnPl = S.decks?.gw === g ? S.decks.drawnPl : null;
    const shown = litShown(P, w, { sq, plans, settled }, decks, toks, lit);
    const wait = weekWait(all, lit.size);
    S.wait = wait || all.pending || weekPending(P, w) ? S.wait?.key === key ? S.wait : { key, t0: Date.now() } : null;
    const backs = /* @__PURE__ */ new Map();
    for (const pl of plans) {
      const b = planBack(P, g, pl).back;
      if (b) backs.set(b, (backs.get(b) ?? 0) + 1);
    }
    const [top, many] = [...backs].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
    const sharedBack = many > 1 ? top : null;
    const live = g === P.A && isLive(ctx);
    sayNight(P);
    const watch = g === P.A && !sq && w.moves.length && !frozenAt(P, g) ? watchOf(ctx) : null;
    const said = watch?.at != null && watch.nights[watch.at].verdict !== "free" ? watch : null;
    if (said) keepNight(P, said);
    const watching2 = said && ctx.api?.local?.get?.(WAIT_KEY) !== waitSig(P, said) ? said : null;
    const clash = clashLine(P), news = forecastLine(P), sets = fplSets(ctx, P, w);
    const notices = [
      clash && { text: clash.text, warn: true, row: () => clashRow(P, clash) },
      watching2 && { text: watching2.short, warn: watching2.tone === "act", row: () => watchView(watching2, { cls: ".ah-pwatch", wait: () => waitWatch(P, watching2) }) },
      news && { text: news, row: () => noteRow(".ah-news", news) },
      sets && { text: COPY.setInFpl(sets), quiet: true, row: () => noteRow(".ah-fplset", COPY.setInFplRow(sets)) }
    ].filter(Boolean);
    return { key, all, sq, plans, decks, toks, lit, shown, shownOut, wait, settled, sharedBack, live, liveText: live ? liveCheck(ctx.bundle?.entry?.published, w, P.L) : null, notices };
  }
  const waited = () => {
    const { S } = V;
    return clockText((Date.now() - S.wait.t0) / 1e3);
  };
  const clockShown = (n) => {
    const { LATE_S, S } = V;
    return (Date.now() - S.wait.t0) / 1e3 < LATE_S && n.dataset.late != null ? n.dataset.pre ?? "" : `${n.dataset.sep ?? ""}${waited()}`;
  };
  const waitClock = (cls = "", { late = false, pre = "", sep = "" } = {}) => {
    const { S } = V;
    if (!S.wait) return null;
    const n = h(`span.ah-wclock.m-num${cls}`, { "aria-hidden": "true", dataset: { ...late ? { late: "" } : {}, pre, sep } });
    n.textContent = clockShown(n);
    return n;
  };
  const plansHeading = (P, g) => {
    const gws = P.gws.filter((x) => x >= g);
    return COPY.suggested(gws, null, COPY.plansHead, gws.length < P.gws.length);
  };
  const plansListed2 = (M) => M.plans.some((pl) => !pl.refRow);
  return { pageName, resetTap, resetSheet, learn, gwNow, setGw, outerH, fitBlock, fitHead, fitPitch, redeck, schedule, covered, paintAvatar, renderHead, renderGwLine, paintDeadline, replanning, paintPlanStatus, tick, hosts, focusedKeys, keepFocus, renderPair, render, renderBaking, renderRules, ruleSheet, clearAll, driftRoom, owes, priceDrift, heldOrder, renderWeek, waitNow, paintWait, paintDim, weekModel, waited, clockShown, waitClock, plansHeading, plansListed: plansListed2 };
}

// js/m/ahead/screen-line.js
function linePart(V) {
  function openWeek(ev, g) {
    const { S, weekSheet } = V;
    const rules = !!S.drawn && rollingAt(S.drawn, g);
    weekSheet(g, rules ? "rules" : null);
    if (rules && ev.detail === 0) S.week?.host.querySelector(`.ah-rmv[data-rule="roll:${g}"]`)?.focus({ preventScroll: true });
  }
  function renderLine(P, w, M) {
    const { S, ap0, bankWarn, barNode, bringDoor, bsep, chipsDoor, ctx, hitSaid, noticeSaid, numSaid, paintWait, rollFacts, statusLine, strip, waitClock, weekLead } = V;
    const g = w.gw, n = w.moves.length;
    const ap = ap0(P, g);
    const kept = !n && !M.live && !M.sq && ap ? rollKeeps(P.pins.find((p) => p.id === `roll:${g}`)) : 0;
    let one = null, gain = null, wait = false, two, said, short = null, facts = false, factsSaid = "", mine = null;
    if (M.live) {
      two = said = M.liveText;
    } else if (M.sq) {
      const v = chipWeekGain(ctx, P, g);
      one = chipName(M.sq);
      gain = v.cmp;
      wait = v.wait;
      two = mine = ap ? COPY.waitShort : COPY.nChanges(n);
      said = `${one}${wait || v.cmp ? `, ${numSaid(wait, v.cmp, ap, !!v.vs)}${v.cmp && !v.vs ? " against no chip" : ""}` : ""}`;
    } else if (n) {
      const v = weekGain(P, w);
      one = COPY.nTransfers(n);
      gain = v.cmp;
      wait = v.wait;
      short = bankWarn(P, w);
      mine = COPY.outNames(movesInOrder(P, w).map((m) => P.L.name(m.out)));
      said = `${one}${hitSaid(w.hits)}, ${numSaid(wait, v.cmp, ap, v.vs)}`;
    } else {
      const f = rollFacts(P, w, { bar: true });
      one = kept ? COPY.nTransfers(kept) : f.head;
      wait = kept > 0;
      two = f.rest;
      said = kept ? `${one}, ${numSaid(true)}` : f.head;
      factsSaid = f.said;
      facts = true;
    }
    const { problem, more, lineup: lineup2 } = lineNotices(M.notices, M.live);
    const waits = null;
    const wl = !M.live && S.wait ? M.wait ?? { i: 1, n: 0 } : null, was = S.wl?.key === S.wait?.key ? S.wl : null;
    S.wl = wl ? {
      key: S.wait.key,
      g,
      n: wl.n,
      done: wl.i - 1,
      at: was?.done === wl.i - 1 ? was.at : Date.now(),
      max: was?.n === wl.n ? was.max : 0,
      tau: wl.i > 1 ? (Date.now() - S.wait.t0) / (wl.i - 1) : 4e3
    } : null;
    const notice = problem ? `${problem.text}${more ? COPY.moreNotices(more) : ""}` : null;
    S.lineKeep = !M.live && (!!problem?.warn || !!bankWarn(P, w));
    if (problem) two = notice;
    const wln = waits && h("span.ah-wln", null, h("span.ah-bn.ah-cw", null, waits[0]), waitClock("", { late: true, sep: "\xA0\xB7\xA0" }));
    if (waits) two = wln;
    const own = facts && !waits && !problem;
    const lead = M.live || own ? null : weekLead(P, w);
    const rest = notice ?? (waits ? waits[0] : null);
    const lu = lineup2 ? h("span.ah-blu", null, bsep(" \xB7 "), h("span.ah-fact", { dataset: { t: lineup2.replace(/(\d) /g, "$1\xA0") } }, lineup2.replace(/(\d) /g, "$1\xA0"))) : null;
    if (lu && !lead) two = [two, lu];
    if (lead) two = two != null ? [h("span.ah-blead", null, lead.node, lu, bsep("\xA0\xB7\xA0")), h("span.ah-brest", null, two)] : h("span.ah-blead", null, lead.node, lu);
    const told = [problem?.text, lineup2].filter(Boolean).join(". ");
    if (noticeSaid.textContent !== told) fill(noticeSaid, told || null);
    S.status = M.live ? null : { g, one, hits: n && !M.sq ? w.hits : 0, wait, gain, ap, said: lineup2 ? `${said}. ${lineup2}` : said, sub: lineup2, mine: n > 0 || kept > 0 || !!M.sq || facts && rollingAt(P, g) };
    fill(strip, h(
      "section.ah-block.ah-ticket",
      { "aria-label": COPY.weekTitle(g), tabindex: "-1", dataset: { focusHome: "" } },
      h("div.ah-tkbody"),
      barNode({
        one: M.live ? null : statusLine(S.status),
        two,
        warn: !!problem?.warn,
        // (the week said once: status, GW A's lineup notice, then facts; GW A under way its sentence)
        label: M.live ? said : COPY.statusSaid([S.status.said, own ? factsSaid : null, lead?.said, mine, rest].filter(Boolean).join(". "), g),
        onClick: (ev) => openWeek(ev, g),
        moves: w.moves.map((m) => `${m.out}>${m.in}`).join(" "),
        doors: []
      }),
      h("div.ah-tkacts"),
      h("div.ah-tklinks")
    ));
    S.line = wln ? { bar: strip.querySelector(":scope > .ah-block > .ah-pbar"), wln, texts: waits } : null;
    fitFacts();
    paintWait();
  }
  function fitFacts() {
    const { S, strip, waited } = V;
    const bar = strip.querySelector(":scope > .ah-block:not(.ah-fitprobe) > .ah-pbar"), bs = bar?.querySelector(".ah-pbt .ah-bs");
    const bst = bar?.querySelector(".ah-pbt > .ah-bst");
    if (bst) {
      bst.classList.remove("noxp", "tight");
      bar.classList.remove("ah-pwrap");
      for (const c of ["noxp", "tight"]) {
        if (bst.scrollWidth <= bst.clientWidth + 0.5) break;
        bst.classList.add(c);
      }
      if (bst.scrollWidth > bst.clientWidth + 0.5) bar.classList.add("ah-pwrap");
    }
    if (!bs) return;
    const L = S.line?.bar === bar ? S.line : null, em = parseFloat(getComputedStyle(bs).fontSize);
    const fits = (x) => x.scrollWidth <= x.clientWidth + 0.5, right = (x) => x.getBoundingClientRect().right;
    const clock = S.wait ? L?.wln.querySelector(":scope > .ah-wclock") : null, was = clock?.textContent;
    if (clock) clock.textContent = `${clock.dataset.sep ?? ""}${waited()}`;
    const cw = L?.wln.querySelector(":scope > .ah-cw");
    const shed = () => {
      cw.hidden = false;
      for (const t of L.texts) {
        cw.textContent = t;
        if (fits(cw)) return;
      }
      if (cw.clientWidth < 2 * em) cw.hidden = true;
    };
    const nx = bs.querySelector(".ah-fnext"), lead = bs.querySelector(":scope > .ah-blead"), rest = bs.querySelector(":scope > .ah-brest");
    const blu = bs.querySelector(".ah-blu"), warn = bs.classList.contains("warn"), luw = blu?.querySelector(".ah-fact");
    if (luw) luw.textContent = luw.dataset.t;
    const luLess = () => {
      if (luw.textContent !== COPY.setInFplShort) luw.textContent = COPY.setInFplShort;
      else blu.hidden = true;
    };
    const seps = [...lead?.querySelectorAll(".ah-bsep") ?? []], sep = rest ? seps.at(-1) : null;
    for (const x of [nx, rest, blu, ...seps, ...bs.querySelectorAll(".ah-itb")]) if (x) x.hidden = false;
    for (const x of seps) x.textContent = x.dataset.t;
    const leadFits = () => lead ? lead.scrollWidth <= bs.clientWidth + 0.5 : fits(bs);
    if (nx) nx.hidden = !fits(bs);
    if (sep) sep.hidden = true;
    if (rest) rest.hidden = true;
    if (blu && !leadFits()) luLess();
    if (blu && !blu.hidden && !leadFits()) luLess();
    if (rest) rest.hidden = false;
    for (let i = 0; i < 2 && blu && !blu.hidden && rest && warn && rest.scrollWidth > rest.clientWidth + 0.5; i++) luLess();
    if (!leadFits()) for (const x of bs.querySelectorAll(".ah-itb")) x.hidden = true;
    if (sep) sep.hidden = false;
    if (rest && !warn && !rest.querySelector(".ah-wln") && rest.scrollWidth > rest.clientWidth + 0.5) {
      rest.hidden = true;
      if (sep) sep.hidden = true;
    }
    if (L && rest) {
      shed();
      if (clock && !cw.hidden && right(clock) > right(bs) + 0.5) cw.hidden = true;
      if (cw.hidden && sep) sep.hidden = true;
    }
    if (rest && !rest.hidden && !rest.querySelector(".ah-wln") && rest.clientWidth < 1.5 * em) {
      if (warn) for (const x of seps) x.textContent = x.dataset.t.replace(/[\s\u00a0]+/g, "\u200A");
      else rest.hidden = sep.hidden = true;
    }
    if (clock) clock.textContent = was;
  }
  function weekGain(P, w) {
    const { ctx, weekPending, weekRoll } = V;
    const r = weekRoll(P, w);
    if (r) return { cmp: r, wait: false, vs: true };
    if (weekPending(P, w)) return { cmp: null, wait: true, vs: false };
    const gains = rowGains(ctx, P, w);
    const sum2 = w.moves.reduce((t, m) => t + (gains.get(`${m.out}>${m.in}`)?.cmp?.delta ?? 0), 0);
    return { cmp: { delta: sum2, label: verdictLabel(sum2, P.noise) }, wait: false, vs: false };
  }
  const boxOf = (n, b) => {
    const r = n.getBoundingClientRect();
    return { n, x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
  };
  function cardBoxes(root) {
    const b = root.getBoundingClientRect();
    return [...root.querySelectorAll(":scope > :is(.pm-field, .pm-benchzone) .pm-card:not(.ah-ghost)")].map((n) => ({ id: Number(n.dataset.id), ...boxOf(n, b), bench: !!n.closest(".pm-bench") }));
  }
  function reachLabels(root) {
    const { decks } = V;
    const b = root.getBoundingClientRect(), boxes = cardBoxes(root);
    const behind = [...decks.querySelectorAll(".ah-sp")].map((n) => boxOf(n, b));
    for (const c of boxes.filter((x) => x.bench)) {
      const bl = c.n.previousElementSibling;
      if (!bl?.matches("button.pm-bl")) continue;
      const q = { ...boxOf(bl, b), n: bl }, foot = q.y + q.h;
      const lo = Math.min(c.y, ...behind.filter((t) => t.x < q.x + q.w && q.x < t.x + t.w && t.y >= foot - 0.5 && t.y < c.y).map((t) => t.y));
      bl.style.setProperty("--dn", `${Math.max(0, lo - foot)}px`);
      bl.style.setProperty("--up", `${lo - reachOf(q, boxes)}px`);
    }
  }
  const labelWalls = (root, b) => [...root.querySelectorAll(":scope > .pm-benchzone .pm-bl")].map((n) => boxOf(n, b));
  const sideRoom = (c, boxes, held, W, side = [], th = 0, ext = null, own = Infinity, free = false) => {
    const mates = boxes.filter((q) => Math.abs(q.y - c.y) < 2 && (q.x + q.w <= c.x + 0.5 || q.x >= c.x + c.w - 0.5) && (!free || held.has(q)));
    const to = (q, gap) => held.has(q) ? Math.min(gap - 2 - (ext?.(q) ?? gap / 2 - 1), own) : gap + q.w / 2 - 4;
    const lm = mates.filter((q) => q.x < c.x).sort((a, b) => b.x - a.x)[0], rm = mates.filter((q) => q.x > c.x).sort((a, b) => a.x - b.x)[0];
    const left = Math.min(c.x - 6, ...lm ? [to(lm, c.x - lm.x - lm.w)] : []);
    const right = Math.min(W - 6 - c.x - c.w, ...rm ? [to(rm, rm.x - c.x - c.w)] : []);
    const band = side.filter((q) => q.y < c.y && q.y + q.h > c.y - th);
    const l2 = Math.min(left, ...band.filter((q) => q.x + q.w <= c.x + c.w / 2).map((q) => c.x - q.x - q.w - 2));
    const r2 = Math.min(right, ...band.filter((q) => q.x >= c.x + c.w / 2).map((q) => q.x - c.x - c.w - 2));
    return [Math.max(0, l2), Math.max(0, r2)];
  };
  const cardIn = (root, id) => root?.querySelector(`:scope > :is(.pm-field, .pm-benchzone) .pm-card[data-id="${id}"]`) ?? null;
  const entryKey = (g, e) => {
    const { planKey } = V;
    return `${e.pl ? planKey(g, e.pl) : `rm:${e.remove.out}>${e.remove.in}`}|${e.inId}`;
  };
  const topRow = (xs) => {
    const all = [...xs].sort((p, q) => p.c.y - q.c.y || p.c.x - q.c.x);
    return [all.filter((x) => Math.abs(x.c.y - all[0].c.y) < 2), all];
  };
  return { openWeek, renderLine, fitFacts, weekGain, boxOf, cardBoxes, reachLabels, labelWalls, sideRoom, cardIn, entryKey, topRow };
}

// js/m/ahead/screen-decks.js
var BAND_LEAST = 60;
var lockGlyph = (shut) => svg(
  "svg",
  { viewBox: "0 0 12 14", "aria-hidden": "true" },
  svg("path", { d: shut ? "M3.5 6V4.2a2.5 2.5 0 0 1 5 0V6" : "M3.5 6V4.2a2.5 2.5 0 0 1 4.9-.7", fill: "none", stroke: "currentColor", "stroke-width": 1.6 }),
  svg("rect", { x: 1.5, y: 6, width: 9, height: 7, rx: 1.5, fill: "currentColor" })
);
var crossGlyph = () => svg(
  "svg",
  { viewBox: "0 0 10 10", "aria-hidden": "true" },
  svg("path", { d: "M2 2l6 6M8 2l-6 6", fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round" })
);
function ticketNames(adds, nm) {
  const list = (ms, part) => ms.flatMap((m, i) => [h(`span.${part}.x`, { dataset: part === "i" ? { id: m.in, out: m.out } : { id: m.out } }, nm(part === "i" ? m.in : m.out)), i < ms.length - 1 ? h("span.c", null, ",") : null]);
  if (adds.length === 1) return [h("span.ah-tn", null, ...list(adds, "o"), " \u2192 ", ...list(adds, "i"))];
  return [h("span.ah-tn", null, ...list(adds, "o"), " \u2192"), h("span.ah-tn", null, ...list(adds, "i"))];
}
function decksPart(V) {
  const spanOf = (P, g, pl) => Object.keys(pl.road?.windows?.[g]?.xi ?? {}).length || P.gws.filter((x) => x >= g).length;
  function renderDecks() {
    const { S, boxOf, cardBoxes, ctx, decks, drawPlace, fitPitch, frozenAt, gwNow, labelWalls, pitchHost, plansHeading, plansListed: plansListed2, reachLabels, sideRoom, tapIn, topRow } = V;
    const root = pitchHost.querySelector(":scope > .pm");
    const P = S.drawn, w = P && weekOf(P, gwNow(P)), M = S.M;
    const band = !!root && !!w && !!M && !frozenAt(P, w.gw) && decks.isConnected;
    if (pitchHost.classList.contains("band") !== band) {
      pitchHost.classList.toggle("band", band);
      fitPitch();
    }
    if (!band) {
      decks.removeAttribute("aria-label");
      fill(decks);
      S.decks = [];
      closePlace(false);
      if (root) reachLabels(root);
      if (P && w) V.paintTicket(P, w, M);
      return;
    }
    const g = w.gw;
    const { decks: D, toks, lit } = M;
    S.decks = Object.assign(D, { gw: g });
    const n = lit.size + (lit.chip ? 1 : 0);
    const was = S.litAt?.key === M.key ? S.litAt : null;
    S.litAt = { key: M.key, lit: n };
    const lights2 = n > 0 && !!was && !was.lit;
    if (lights2) S.addAt = S.flowAt = Date.now();
    const b = root.getBoundingClientRect(), W = root.clientWidth;
    const boxes = cardBoxes(root);
    const inPlan = (x) => {
      const i = lit.move?.choice.moves.filter((m) => m.gw === g).findIndex((m) => Number(m.out) === x.d.a) ?? -1;
      return i < 0 ? Infinity : i;
    };
    const lead = D.filter((d) => lit.get(d.a)?.best).map((d) => ({ d, c: boxes.find((x) => x.id === d.a), L: lit.get(d.a) })).filter((x) => x.c).sort((p, q) => inPlan(p) - inPlan(q)).slice(0, 1);
    const name = plansHeading(P, g), tk = tokensOf(P, w, toks, lit, lead, M), any = (D.length || tk.length) && plansListed2(M);
    V.paintTicket(P, w, M, tk);
    if (any) decks.setAttribute("aria-label", name);
    else decks.removeAttribute("aria-label");
    fill(decks, any ? h("h3.sr-only", null, name) : null, tk);
    const meetsCard = (el, down = 0, side = 0) => {
      const q = boxOf(el, b);
      return boxes.some((c) => boxesMeet(c, { ...q, w: q.w + side }, down));
    };
    const wordsOf = (t) => [...t.querySelectorAll(".ah-tw, .ah-tbody > span:first-child, :scope > .ah-tl, .ah-tbody, .ah-tn")];
    const wrapOf = (t) => {
      const words = t.querySelector(":scope > .ah-tl"), num2 = t.querySelector(":scope > .ah-tnum");
      return words && num2 && num2.offsetTop >= words.offsetTop + words.offsetHeight - 1 ? num2.offsetWidth + (parseFloat(getComputedStyle(t).columnGap) || 0) : 0;
    };
    const overOf = (t, tw = wordsOf(t)) => () => tw.some((x) => x.scrollWidth > x.clientWidth + 0.5) || wrapOf(t) > 0;
    const trimsOf = (t) => t.matches(".st") ? ST_TRIMS : void 0;
    const fits = (t) => {
      const tw = wordsOf(t);
      if (fitNum(t, overOf(t, tw), trimsOf(t))) return true;
      t.style.maxWidth = `${t.offsetWidth + Math.ceil(Math.max(wrapOf(t), ...tw.map((x) => x.scrollWidth - x.clientWidth)))}px`;
      if (fitNum(t, overOf(t, tw), trimsOf(t)) && !meetsCard(t, 9, 6)) return true;
      if (!t.matches(".mv")) return false;
      t.style.removeProperty("max-width");
      const least = NAME_LEAST * parseFloat(getComputedStyle(t).fontSize), ns = [...t.querySelectorAll(".ah-tn")];
      const fitsWith = (steps2) => (t.classList.remove("gol", "nogo"), fitNum(t, tw.filter((x) => !x.matches(".ah-tn")), steps2) && ns.every((x) => x.scrollWidth <= x.clientWidth + 0.5 || x.clientWidth >= least) && !meetsCard(t, 9, 6));
      const one = t.dataset.buy && ns.length === 1 ? ns[0] : null;
      if (one) {
        if (fitsWith(["noxp", "nomark", "tight"])) return true;
        if (!t.matches(".tix")) one.textContent = t.dataset.buy;
      }
      if (fitsWith(["noxp", "nomark", "tight", "cut"]) || ns.length < 2 && fitsWith(["noxp", "nomark", "tight", "gol", "cut"]) || fitsWith(["noxp", "nomark", "tight", "nogo", "cut"])) return true;
      if (ns.length < 2) return false;
      const tl = t.querySelector(":scope > .ah-tl"), was2 = [...tl.childNodes];
      fill(tl, h("span.ah-tn", null, plural(ns.length, "transfer")));
      ns.splice(0, ns.length, ...tl.querySelectorAll(".ah-tn"));
      if (fitsWith(["noxp", "nomark", "tight", "cut"]) || fitsWith(["noxp", "nomark", "tight", "nogo", "cut"])) return true;
      fill(tl, ...was2);
      return false;
    };
    const st = tk.find((t) => t.matches(".st"));
    const inBand = (t) => t.matches(".mv, .st.best");
    const stack = () => {
      let top2 = 6;
      for (const t of tk) if (t.isConnected && !inBand(t)) {
        t.style.top = `${top2}px`;
        top2 += t.offsetHeight + 8;
      }
    };
    if (!tk.some(inBand) && pitchHost.style.getPropertyValue("--ah-band")) {
      pitchHost.style.removeProperty("--ah-band");
      fitPitch();
      return renderDecks();
    }
    let top = 6;
    for (const t of tk) {
      if (inBand(t)) {
        const nameCut = (x) => {
          const r = document.createRange();
          r.selectNode(x.firstChild);
          return r.getBoundingClientRect().width > x.clientWidth - parseFloat(getComputedStyle(x).paddingRight) + 0.5;
        };
        const cut = () => [...t.querySelectorAll(".ah-tn > .x")].some(nameCut);
        for (const sel of [".ah-tclose", ".ah-tgw"]) {
          const x = t.querySelector(sel);
          if (x && cut()) x.hidden = true;
        }
        const bh = `${Math.max(t.offsetHeight + 8, BAND_LEAST)}px`;
        if (pitchHost.style.getPropertyValue("--ah-band") !== bh) {
          pitchHost.style.setProperty("--ah-band", bh);
          fitPitch();
          return renderDecks();
        }
        continue;
      }
      t.style.top = `${top}px`;
      if (fits(t)) top += t.offsetHeight + 8;
      else if (t === st) {
        t.style.removeProperty("max-width");
        if (!fitNum(t, overOf(t), ST_TRIMS)) t.classList.remove(...ST_TRIMS);
        top += t.offsetHeight + 8;
      } else t.remove();
    }
    for (; ; ) {
      const tkIn = tk.filter((t) => t.isConnected), cut = tkIn.findIndex((t) => meetsCard(t, 9));
      if (cut < 0) break;
      const gone2 = tkIn.slice(cut).filter((t) => t !== st && !inBand(t));
      if (gone2.length) for (const t of gone2) t.remove();
      else if (tkIn[0] !== st) tkIn[0].remove();
      else if (st.querySelector(":scope > .ah-tw:not([hidden])")) st.querySelector(":scope > .ah-tw").hidden = true;
      else break;
      stack();
    }
    const bestTok = tk.find((t) => t.isConnected && t.matches(".mv") && t.dataset.notIn);
    const sold = new Set(bestTok ? [...bestTok.querySelectorAll(".ah-tn > .o")].map((x) => Number(x.dataset.id)) : []);
    for (const c of root.querySelectorAll(".pm-card[data-id]")) c.classList.toggle("ah-sold", sold.has(Number(c.dataset.id)));
    if (bestTok) {
      const q = boxOf(bestTok, b), m = { gw: g, out: Number(bestTok.dataset.notOut), in: Number(bestTok.dataset.notIn) }, tix = bestTok.matches(".tix");
      const after = (el) => {
        const r = boxOf(el, b);
        return { left: `${r.x + r.w - 25}px`, top: `${r.y + r.h / 2 - 12}px` };
      };
      const door = (el) => {
        const r = boxOf(el, b), y = bestTok.matches(".multi") ? r : q;
        return { left: `${r.x - 6}px`, top: `${y.y}px`, width: `${r.w - 22}px`, height: `${y.h}px` };
      };
      const xs = tix ? [...bestTok.querySelectorAll(".ah-tn > .x")] : [];
      if (!xs.length) decks.append(h("button.ah-cm.out.tno", {
        type: "button",
        "aria-label": COPY.notBuySaid(P.L.name(m.in), g),
        dataset: { row: `tok:not:${g}` },
        class: { in: true },
        style: { left: `${q.x + q.w - 28}px`, top: `${q.y + q.h / 2 - 12}px` },
        onClick: () => veto(ctx, m, { scope: "gw" })
      }, crossGlyph()));
      for (const x of xs) {
        const id = Number(x.dataset.id), nm = P.L.name(id);
        decks.append(h("button.ah-tcard", { type: "button", "aria-haspopup": "dialog", "aria-label": COPY.cardOf(nm), dataset: { row: `tok:card:${g}:${id}` }, style: door(x), onClick: () => tapIn(g, id) }));
        if (x.matches(".i")) {
          const mi = { gw: g, out: Number(x.dataset.out), in: id };
          decks.append(h("button.ah-cm.out.tno.in.tx", { type: "button", "aria-label": COPY.notBuySaid(nm, g), dataset: { row: `tok:not:${g}:${id}` }, style: after(x), onClick: () => veto(ctx, mi, { scope: "gw" }) }, crossGlyph()));
        } else {
          const pk = pinOf(P, "keep", id, g);
          decks.append(h("button.ah-cm.tlk.tx", {
            type: "button",
            class: { on: !!pk },
            "aria-pressed": String(!!pk),
            "aria-label": pk ? COPY.cardLockSaid(nm, g, true) : COPY.placeKeepSaid(nm, g),
            dataset: { row: `tok:keep:${g}:${id}` },
            style: after(x),
            onClick: () => lockTap(P, g, id)
          }, lockGlyph(!!pk)));
        }
      }
    }
    decks.toggleAttribute("data-mv-out", tk.some((t) => t.matches(".mv") && !t.isConnected));
    const gone = tk.filter((t) => !t.isConnected && t.dataset.plan).map((t) => t.dataset.plan).join(" ");
    if (gone) decks.dataset.tokOut = gone;
    else delete decks.dataset.tokOut;
    const walls = [...boxes, ...labelWalls(root, b), ...[...root.querySelectorAll(":scope > .ah-pp:not([hidden]), .ah-tok")].map((x) => boxOf(x, b))];
    const tabH = Math.round(cssPx(decks, "var(--pm-tab)")[0]);
    const marks = [];
    const lineBest = !!lead?.length && multiMove(lead[0].L.e, lead[0].d.a);
    const litAt = (a) => lineBest && lit.get(a)?.best && !lead.some((x) => x.d.a === a) ? null : lit.get(a);
    const lineBuys = new Set(lineBest ? lead[0].L.e.adds.map((m) => Number(m.in)) : []);
    const firstOf = (d) => placeFirst(lineBuys.size ? { ...d, entries: d.entries.filter((e) => !lineBuys.has(e.inId) || takesBack(e)) } : d);
    for (const d of D) {
      const c = boxes.find((x) => x.id === d.a), first = litAt(d.a) ? null : firstOf(d), L = litAt(d.a) ?? (first && { e: first, best: false, first: true });
      if (!c || !L) continue;
      const up = c.y - reachOf(c, walls);
      if (up < EDGE_MIN) continue;
      marks.push({ d, c, L, up, kind: L.best ? "best" : "alt", best: !!L.best, only: up < PLATE_MIN && !!L.e.pl });
    }
    marks.length = 0;
    const [row0, bests] = topRow(marks.filter((x) => x.kind === "best")), tags = bests.filter((x) => !row0.includes(x));
    const span2 = !row0.length ? null : lineBest ? { x: 3, y: row0[0].c.y, w: W - 6, h: row0[0].c.h, bench: row0[0].c.bench } : (() => {
      const l = row0[0].c, r = row0.at(-1).c;
      return { x: l.x, y: l.y, w: r.x + r.w - l.x, h: l.h, bench: l.bench };
    })();
    const under = (x) => !lineBest && span2 && !x.best && Math.abs(x.c.y - span2.y) < 2 && x.c.x >= span2.x && x.c.x + x.c.w <= span2.x + span2.w;
    const plateGain = (x) => x.L.e.pl?.state === "ready" ? x.L.e.pl.cmp.delta : -Infinity;
    const byBuy = /* @__PURE__ */ new Map();
    for (const x of marks) if (!x.best && x.L.e.pl && !takesBack(x.L.e) && (!byBuy.has(x.L.e.inId) || plateGain(x) > plateGain(byBuy.get(x.L.e.inId)))) byBuy.set(x.L.e.inId, x);
    const bestIns = new Set(marks.filter((x) => x.best).map((x) => x.L.e.inId));
    const twice = (x) => !x.best && !!x.L.e.pl && !takesBack(x.L.e) && (bestIns.has(x.L.e.inId) || lineBuys.has(x.L.e.inId) || byBuy.get(x.L.e.inId) !== x);
    marks.splice(0, marks.length, ...marks.filter((x) => !under(x) && !twice(x)));
    D.drawn = new Set(marks.map((x) => x.d.a));
    const plates = marks.filter((x) => x.kind === "alt" || x.kind === "best" && tags.includes(x));
    const held = new Set(marks.map((x) => x.c));
    const drawn = [];
    const rest = span2 ? row0[0].L.e.adds.filter((m) => !row0.some((x) => x.L.e.inId === Number(m.in))) : [];
    let spEl = null;
    if (span2) (lineBest ? (x) => {
      spEl = x.el;
      append(decks, x.el);
    } : (x) => drawn.push(x))({ el: swapPlate(P, g, row0[0].d, row0[0].L, span2, Math.min(...row0.map((x) => x.up)), tabH, { buys: [...row0.map((x) => x.L.e.inId), ...rest.map((m) => Number(m.in))], shown: row0.map((x) => x.L.e.inId), sellers: [...row0.map((x) => x.d.a), ...rest.map((m) => Number(m.out))], only: row0.some((x) => x.only), ...lineBest ? { line: lineMoves(P, row0[0].L.e) } : {} }), c: span2, m: row0[0] });
    for (const m of plates) drawn.push({ el: swapPlate(P, g, m.d, m.L, m.c, m.up, tabH, { ...m.best ? { tag: bests.find((x) => !tags.includes(x)).d.a } : {}, only: m.only }), c: m.c, m });
    for (const p of drawn) append(decks, p.el);
    const plateOf = new Map(drawn.flatMap((p) => p.c === span2 ? row0.map((x) => [x.c, p]) : [[p.c, p]]));
    const over = (p) => p ? Math.max(0, (p.el.getBoundingClientRect().width - p.c.w) / 2) : 0;
    const reach = (q, p) => {
      const x = plateOf.get(q);
      return Math.max(over(x), x?.room ? x.room[x.c.x < p.c.x ? 1 : 0] : 0);
    };
    const roomOf = (p) => sideRoom(p.c, boxes, held, W, walls, parseFloat(p.el.style.height), (q) => p.free ? reach(q, p) : over(plateOf.get(q)), over(p), p.free);
    const most = (p) => {
      const [l, r] = p.room = roomOf(p), s = p.free ? Infinity : p.c.w / 3;
      return p.c.w + Math.min(l, r + s) + Math.min(r, l + s);
    };
    const wider = (p) => p.el.getBoundingClientRect().width > most(p) + 0.5;
    const excess = (q) => q.el.getBoundingClientRect().width - most(q);
    const quiet = (p) => p.el.matches(".alt");
    const named = (p) => !p.el.matches(".only, .bare.cut");
    const cramped = (p) => wider(p) || !!p.was && drawn.some((q) => q !== p && Math.max(0, excess(q)) > p.was.get(q) + 0.5);
    let steps = PLATE_TRIMS;
    const oneXp = () => {
      if (!steps.includes("noxp") || !oneLook([...decks.querySelectorAll(".ah-sp, .ah-tok")], ["noxp"]).length) return false;
      steps = PLATE_TRIMS.filter((k) => k !== "noxp");
      return true;
    };
    const trim = () => {
      for (let i = 0; i < 4; i++) {
        let moved = false;
        for (const p of drawn.filter((x) => !x.el.matches(".cut"))) {
          const was2 = p.el.className;
          fitNum(p.el, () => cramped(p), steps);
          moved ||= was2 !== p.el.className;
        }
        if (!oneXp() && !moved) break;
      }
    };
    const toOnly = (p) => {
      if (p.el.matches(".bare")) {
        p.el.classList.add("cut");
        return;
      }
      p.el.classList.remove("cut");
      p.el.style.removeProperty("width");
      p.el.classList.add("only");
    };
    const yielded = (p) => p.el.matches(".bare") ? "cut" : "only";
    const gain = (p) => p.m.L.e.pl?.state === "ready" ? p.m.L.e.pl.cmp.delta : -Infinity;
    const beside = (p) => [
      boxes.filter((q) => Math.abs(q.y - p.c.y) < 2 && q.x + q.w <= p.c.x + 0.5).sort((a, b2) => b2.x - a.x)[0],
      boxes.filter((q) => Math.abs(q.y - p.c.y) < 2 && q.x >= p.c.x + p.c.w - 0.5).sort((a, b2) => a.x - b2.x)[0]
    ].map((q) => q && plateOf.get(q)).filter((q) => q && quiet(q) && named(q));
    trim();
    for (; ; ) {
      const long = drawn.filter(wider);
      const ink = long.filter((p) => !quiet(p)).flatMap(beside);
      const cands = ink.length ? ink : [...long.filter((p) => quiet(p) && named(p)), ...long.flatMap(beside)];
      if (!cands.length) break;
      toOnly(cands.sort((a, b2) => gain(a) - gain(b2) || b2.c.x - a.c.x)[0]);
      trim();
    }
    for (const p of drawn.filter((x) => !quiet(x) && named(x) && wider(x))) p.free = true;
    trim();
    for (const p of drawn.filter((x) => !quiet(x) && named(x) && wider(x))) {
      p.el.classList.add("cut");
      for (let i = 0; i < 6; i++) {
        const wd = most(p);
        if (Math.abs(wd - parseFloat(p.el.style.width)) < 0.5) break;
        p.el.style.width = `${wd}px`;
      }
      const body = p.el.querySelector(".ah-spb"), least = NAME_LEAST * parseFloat(getComputedStyle(body).fontSize);
      const shows = [...body.querySelectorAll(".ah-spn")].every((n2) => n2.scrollWidth <= n2.clientWidth + 0.5 || n2.clientWidth >= least);
      if (!shows || body.scrollWidth > body.clientWidth + 0.5) toOnly(p);
    }
    trim();
    const nearInk = new Set(drawn.filter((x) => !quiet(x) && !named(x)).flatMap((x) => [...plateOf].filter(([q]) => Math.abs(q.y - x.c.y) < 2 && (Math.abs(q.x + q.w - x.c.x) < q.w || Math.abs(x.c.x + x.c.w - q.x) < q.w)).map(([, y]) => y)));
    const excesses = () => new Map(drawn.map((q) => [q, Math.max(0, excess(q))]));
    const took = (x, k) => {
      const was2 = k.split(" ");
      return [...x.classList].some((c) => c !== "noxp" && !was2.includes(c));
    };
    for (const p of drawn.filter((x) => quiet(x) && !named(x) && !x.m.only && !x.el.matches(".loss") && !nearInk.has(x)).sort((a, b2) => gain(b2) - gain(a))) {
      const look = new Map([...decks.querySelectorAll(".ah-sp, .ah-tok")].map((x) => [x, x.className])), was2 = steps;
      p.was = excesses();
      p.el.classList.remove(yielded(p));
      fitNum(p.el, () => cramped(p), steps);
      trim();
      if (cramped(p) || [...look].some(([x, k]) => x !== p.el && took(x, k))) {
        delete p.was;
        for (const [x, k] of look) x.className = k;
        steps = was2;
        trim();
      } else p.was = excesses();
    }
    const wide = new Map(drawn.map((p) => {
      const m = most(p);
      return [p, [Math.min(Math.max(p.c.w, Math.ceil(p.el.getBoundingClientRect().width)), m), m]];
    }));
    for (const p of drawn) {
      const [wd, room] = wide.get(p), extra = wd - p.c.w;
      const r = Math.min(extra - Math.min(extra / 2, p.room[0]), p.room[1]), left = p.c.x - (extra - r), top2 = parseFloat(p.el.style.top);
      Object.assign(p.el.style, { width: `${wd}px`, left: `${left}px` });
      p.el.dataset.room = Math.floor(room);
      p.el.style.setProperty("--up", `${Math.max(0, top2 - Math.max(reachOf({ n: p.el, x: left, y: top2, w: wd }, walls), p.c.y - 44))}px`);
    }
    if (spEl) {
      const sp = { el: spEl };
      sp.el.style.width = "max-content";
      const wantOf = () => Math.ceil(Math.max(sp.el.getBoundingClientRect().width, sp.el.scrollWidth)) + 2, mid = (row0[0].c.x + row0.at(-1).c.x + row0.at(-1).c.w) / 2;
      let want3 = wantOf();
      for (const k of PLATE_TRIMS) {
        if (want3 <= W - 6) break;
        sp.el.classList.add(k);
        if (k === "noxp") oneLook([...decks.querySelectorAll(".ah-sp, .ah-tok")], ["noxp"]);
        want3 = wantOf();
      }
      if (want3 > W - 6) {
        const th = parseFloat(sp.el.style.height);
        sp.el.classList.add("two");
        Object.assign(sp.el.style, { height: `${2 * th}px`, top: `${span2.y - 2 * th}px` });
      }
      const wd = Math.min(W - 6, want3), left = Math.min(W - 3 - wd, Math.max(3, mid - wd / 2));
      Object.assign(sp.el.style, { width: `${wd}px`, left: `${left}px` });
      const lines = sp.el.classList.contains("two") ? 2 : 1, room = span2.y - reachOf({ n: sp.el, x: left, y: span2.y, w: wd }, walls);
      if (parseFloat(sp.el.style.height) > room) Object.assign(sp.el.style, { height: `${room}px`, top: `${span2.y - room}px`, fontSize: `${Math.min(parseFloat(getComputedStyle(sp.el).fontSize), Math.floor(room / (lines === 2 ? 2.3 : 1)) - 1)}px` });
      const top2 = parseFloat(sp.el.style.top);
      sp.el.style.setProperty("--up", `${Math.max(0, top2 - Math.max(reachOf({ n: sp.el, x: left, y: top2, w: wd }, walls), span2.y - 44))}px`);
      for (const q of drawn) {
        const l = parseFloat(q.el.style.left), r = l + parseFloat(q.el.style.width);
        if (Math.abs(q.c.y - span2.y) < 2 && r > left - 4 && l < left + wd + 4) {
          q.el.remove();
          D.drawn.delete(q.m.d.a);
        }
      }
    }
    D.drawnPl = new Set(drawn.filter((p) => p.el.isConnected).map((p) => p.m.L.e.pl).filter(Boolean));
    if (spEl) D.drawnPl.add(row0[0].L.e.pl);
    reachLabels(root);
    if (lights2) for (const x of decks.querySelectorAll(".ah-sp:not(.first), .ah-tok.mv")) x.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 150, delay: reduceMotion() ? 0 : 170, fill: "backwards" });
    cardMarks(P, g, boxes);
    const want2 = S.placeWant?.g === g ? S.placeWant : null;
    if (!want2) S.placeWant = null;
    if (S.place) drawPlace(false);
    else if (want2 && D.some((d) => d.a === want2.a)) {
      S.placeWant = null;
      openPlace(want2.a);
    } else if (want2 && M.settled) {
      S.placeWant = null;
      toast(COPY.cardNoBuy(P.L.name(want2.a), g), "info");
    }
    sheetFollows(P, w, M);
  }
  function lockTap(P, g, a) {
    const { ctx, ruleSheet } = V;
    const pin = pinOf(P, "keep", a, g);
    if (!pin) keep(ctx, a, { gw: g, scope: "gw" });
    else if (pin.must?.length === 1 && pin.must[0][1] === g && pin.must[0][2] === g) removeRule(ctx, pin.id);
    else ruleSheet(pin);
  }
  function cardMarks(P, g, boxes) {
    const { S, boxOf, ctx, decks, pitchHost } = V;
    const root = pitchHost.querySelector(":scope > .pm");
    if (!P.editable || !root) return;
    const nm = P.L.name, b = root.getBoundingClientRect();
    const M = 12, HIT = 16;
    for (const c of boxes) {
      const a = c.id, pin = pinOf(P, "keep", a, g);
      const tile = c.n.querySelector(".pm-kit"), t = tile ? boxOf(tile, b) : c;
      const tall = t.h >= 2 * M + 8;
      const half = `${Math.max(0, Math.min(HIT, ((tall ? t.h - 6 : 3 * M) - 2 * M) / 2))}px`;
      const xAt = { left: `${t.x + 3}px`, top: `${t.y + 3}px`, [tall ? "--hb" : "--hr"]: half };
      const lAt = tall ? { left: `${t.x + 3}px`, top: `${t.y + t.h - 3 - M}px`, "--ht": half, "--hb": "3px" } : { left: `${t.x + 3 + 2 * M}px`, top: `${t.y + 3}px`, "--hl": half };
      if (!pin) decks.append(h("button.ah-cm.out", {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-label": COPY.cardOutSaid(nm(a), g),
        dataset: { row: `out:${a}` },
        style: xAt,
        onClick: () => {
          if (S.decks?.some((d) => d.a === a)) {
            openPlace(a);
            return;
          }
          S.placeWant = { a, g };
          if (!askPlace(ctx, P, g, a)) renderDecks();
        }
      }, crossGlyph()));
      if (pin) decks.append(h("button.ah-cm.lock", {
        type: "button",
        class: { on: !!pin },
        "aria-pressed": String(!!pin),
        "aria-label": COPY.cardLockSaid(nm(a), g, !!pin),
        dataset: { row: `lock:${a}` },
        style: lAt,
        onClick: () => lockTap(P, g, a)
      }, lockGlyph(!!pin)));
    }
  }
  function sheetFollows(P, w, M) {
    const { S, drawWeek } = V;
    const shown = litShown(P, w, M, M.decks, M.toks, M.lit);
    if (shown.size === M.shown.size && [...shown].every((pl) => M.shown.has(pl))) return;
    M.shown = shown;
    if (S.week?.g === w.gw) drawWeek(P, w, M);
  }
  function swapPlate(P, g, d, { e, best, first }, c, up, tabH, o = {}) {
    const { S, openPlanWhy, plNumSaid, planKey, planSaid, plansVs } = V;
    const nm = P.L.name, pl = e.pl, s = pl ? planSaid(P, g, pl) : null;
    const th = Math.max(o.only || !pl ? Math.min(up, PLATE_MIN) : PLATE_MIN, Math.min(c.bench ? tabH - 2 : tabH, up));
    const open = () => o.line && pl ? openPlanWhy(P, g, pl) : openPlace(d.a);
    const buys = o.buys ?? (o.tag != null ? [e.inId] : [e.inId, ...e.pair.map((q) => q.in)]), sellers = o.sellers ?? [d.a, ...e.pair.map((q) => q.out)], shown = o.shown ?? [e.inId];
    const ready = !!pl && pl.state === "ready" && (!first || !!S.M?.settled);
    const v = ready ? numParts(g, pl) : !pl ? S.M?.settled ? null : COPY.waitShort : pl.state === "failed" ? failedWords(P, pl).head : COPY.waitShort;
    const back = d.mine && takesBack(e);
    const loss = !best && o.tag == null && !back && ready && !shownGain(pl.cmp.delta);
    const num2 = ready ? plNumSaid(P, pl) : v, places = COPY.placeSaid(nm(d.a), d.entries.length, null);
    const moves = back ? [COPY.keepSoldSaid(nm(e.inId), nm(d.a))] : sellers.map((a, i) => COPY.moveSaid(nm(a), nm(buys[i])));
    const move = !!S.M?.lit?.chip;
    const none = !!first && !back && ready && !d.entries.some((x) => x.pl?.state === "ready" && (plPays(x.pl) || x.pl.cmp.delta > 0.05));
    const why = first && ready && pl.removed ? `, ${COPY.removedByYou}` : "";
    const said = o.tag != null ? `${COPY.partSaid(moves[0], e.adds.filter((m) => Number(m.in) !== e.inId).map((m) => COPY.moveSaid(nm(m.out), nm(m.in))), move)}. ${places}` : back && !best ? `${moves[0]}${v == null ? "" : `, ${num2}`}${why}. ${places}` : best ? `${COPY.bestSaid(moves, num2, move)}. ${o.line && WHY_SHEET ? COPY.showsWhy : places}` : `${moves.join("; ")}, ${num2}${why}. ${!first ? places : !ready ? placeLabel(P, d) : none ? COPY.placeNoneSaid(nm(d.a), d.entries.length, plansVs(P, g)) : places}`;
    const body = h(
      "button.ah-spb",
      { type: "button", "aria-haspopup": "dialog", "aria-label": `${said}${o.line?.back ? `, ${o.line.back}` : ""}`, onClick: open },
      // (a multi-move best's sentence, every move named in its road's order)
      o.line ? [...o.line.map((x, i) => h("span.ah-spn", { "aria-hidden": "true" }, x, i < o.line.length - 1 ? "," : null)), o.line.back ? h("span.ah-spn", { "aria-hidden": "true" }, o.line.back) : null] : shown.map((id, i) => [i ? h("span.ah-spj", { "aria-hidden": "true" }, " + ") : null, h("span.ah-spn", { "aria-hidden": "true" }, nm(id))]),
      !o.line && shown.length < buys.length ? h("span.ah-spm", { "aria-hidden": "true" }, COPY.planMore(buys.length - shown.length)) : null,
      // (a tag shows his plan's number only where his name has no room: .only)
      v == null ? null : h("span.ah-spv.m-num", { "aria-hidden": "true", class: { wait: !ready } }, v)
    );
    const plate = h("div.ah-sp", {
      // (a sub's by data-bench, never a class: app.css .bench is the desktop bench's panel)
      class: { best, alt: !best, first: !!first, part: o.tag != null, line: !!o.line, pays: ready && s.pays, only: !!o.only || loss, loss, back, bare: v == null },
      dataset: { row: `deck:${d.a}`, deck: d.a, ...pl ? { plan: planKey(g, pl) } : {}, in: e.inId, ...c.bench ? { bench: "" } : {} },
      // (a number alone in less than a plate's least height: its type no taller than the turf, never onto his card)
      style: { left: `${c.x}px`, top: `${c.y - th}px`, height: `${th}px`, "--up": `${Math.max(0, up - th)}px`, ...th < PLATE_MIN ? { fontSize: `${th - 1}px` } : {} },
      // the free turf over it (its ::before) opens his place too
      onClick: (ev) => {
        if (ev.target === plate) open();
      }
    }, body);
    return plate;
  }
  const placeLabel = (P, d) => {
    const { plNumSaid } = V;
    const nm = P.L.name, best = placeOrder(d.entries).find((x) => !x.back && x.pl?.state === "ready");
    return COPY.placeSaid(nm(d.a), d.entries.length, best && `${nm(best.inId)}, ${plNumSaid(P, best.pl)}`);
  };
  function statusLine(st) {
    const { gainOf, hitTag } = V;
    if (!st) return null;
    return h(
      "span.ah-bt.ah-bst",
      { class: { done: st.mine }, "aria-hidden": "true", dataset: { row: `tok:week:${st.g}` } },
      // (dashed while an edit is checked: m-pending)
      h("span.ah-tl", { class: { "m-pending": st.ap } }, typeof st.one === "string" ? st.one.replace(/(\d) /g, "$1\xA0") : st.one),
      st.wait ? h("small.ah-tw", null, COPY.waitShort) : null,
      // (the week's number: gainOf, blue with "xP", shimmering while an edit is checked; −4 before it)
      st.hits || st.gain && !st.wait ? h("span.ah-tnum", null, hitTag(st.hits), st.gain && !st.wait ? gainOf(st.gain, st.ap) : null) : null
    );
  }
  function tokensOf(P, w, toks, lit = /* @__PURE__ */ new Map(), lead = null, M = null) {
    const { frozenAt, openPlanWhy, openWeek, plNumSaid, planKey, planSaid } = V;
    const g = w.gw, out = [];
    const mv = lit.move, top = mv && lead?.[0]?.L.e.pl === mv ? lead : null;
    const onSwap = (ev) => {
      const go = ev.currentTarget.querySelector(".ah-tgo");
      if (!go || !ev.detail) return true;
      const r = go.getBoundingClientRect();
      return ev.clientX >= r.left - 4;
    };
    const moveTok = (e, a, pl, best) => {
      const nm = P.L.name;
      const moves = takesBack(e) ? [COPY.keepSoldSaid(nm(e.inId), nm(a))] : e.adds.map((m) => COPY.moveSaid(nm(m.out), nm(m.in)));
      const swap = pl.state === "ready" && !frozenAt(P, g), said = (best ? COPY.bestSaid : COPY.nextSaid)(moves, plNumSaid(P, pl), true);
      const one = best && swap && e.adds.length && !takesBack(e) ? e.adds[0] : null;
      const close = pl.cmp?.label === "coin", span2 = spanOf(P, g, pl);
      return h(
        best ? "button.ah-tok.mv" : "button.ah-tok.nx",
        {
          type: "button",
          class: { lead: best, tix: !!one, multi: !!one && e.adds.length > 1, close: !!one && close },
          "aria-haspopup": swap ? null : "dialog",
          dataset: { row: `tok:${best ? "best" : "next"}:${g}`, deck: a, ...best ? { best: planKey(g, pl) } : {}, ...one ? { notOut: one.out, notIn: one.in } : {}, ...swap ? { add: `plan:${planKey(g, pl)}` } : {}, ...!takesBack(e) && e.adds.length === 1 ? { buy: nm(e.adds[0].in) } : {} },
          // (its verb first where it takes, as drawn: "Swap. Best move this week: …")
          "aria-label": swap ? COPY.bestSwapSaid(said) : `${said}, ${COPY.showsChoices}`,
          // (its "Swap" takes; a tap on its words opens his place, the move among his choices: review 7, 2026-11-02,
          // feedforward, reversing the owner's 2026-10-26 whole-token take. By where the tap lands, the token's whole
          // box its target (::before); a key or a screen reader's press, no point, takes, as its label says)
          onClick: (ev) => swap && onSwap(ev) ? takeFrom(ev, P, g, pl, ev.currentTarget, a, e.inId) : openPlace(a)
        },
        // (one move its sale and buy, "Murillo → Hill": review 7, 2026-11-02, the net result, not one leg; reversing the
        // owner's 2026-10-26 buy alone; several their buys. The best's, in the band over the pitch, each name with its ✕:
        // renderDecks)
        // (the best's, in the band: one move "Gabriel → N.Williams"; more, its sellers first, then its buys, each
        // comma-separated, on one line where they fit, else "Ajer, Van Hecke, Havertz →" over "N.Williams, Murillo, Evanilson" (owner,
        // 2026-11-03, "sold players go first and comma-separated, then comma separated bought"); a mark after every
        // name: .x, renderDecks, a buy's naming its seller, data-out)
        best ? h("small.ah-tlead", { "aria-hidden": "true" }, COPY.answerMove) : null,
        h("span.ah-tl", { "aria-hidden": "true" }, one ? ticketNames(e.adds, nm) : (takesBack(e) || !e.adds.length ? [nm(e.inId)] : e.adds.length === 1 ? [`${nm(e.adds[0].out)} \u2192 ${nm(e.adds[0].in)}`] : e.adds.map((m) => nm(m.in))).map((t, i, all) => h("span.ah-tn", null, `${t}${i < all.length - 1 ? "," : ""}`))),
        // (its number as its plate's: numParts)
        // (its number's scope, the window it counts, "+2.0 xP · 4 GW"; "Close call" where the solver's count of it is inside
        // the forecast's noise (counted's label 'coin'), its Swap outlined: owner, 2026-11-03, design_1103b "Number
        // scope + close call": Saffer, Johnson, Duke, Johnson's Elements of Choice; the lit move stays the solver's)
        h("span.ah-tnum.m-num", { "aria-hidden": "true" }, one && close ? h("small.ah-tclose", null, COPY.closeCall) : null, numParts(g, pl), one ? h("small.ah-tgw", null, COPY.overGws(span2)) : null),
        // its take's word where its tap takes (owner, 2026-10-28: one act, one word, one look): "Swap" in the mint of
        // its place's best header, a keep-back "Keep"; none where it opens his place
        swap ? h(`span.ah-tgo.m-swap${best ? ".best" : ""}`, { "aria-hidden": "true" }, takesBack(e) ? COPY.placeKeep : COPY.placeSwap) : null
      );
    };
    if (top) {
      const t = moveTok(top[0].L.e, top[0].d.a, mv, true);
      t.move = { e: top[0].L.e, pl: mv };
      t.take = (ev) => takeFrom(ev, P, g, mv, ev.currentTarget, top[0].d.a, top[0].L.e.inId);
      out.push(t);
    } else if (M && !M.sq && !M.live && !V.S.wait && P.editable && !frozenAt(P, g) && !rollingAt(P, g)) {
      const done = !!w.moves.length && extraWeek(P, g), nx = done ? null : nextFts(P, w);
      out.push(h(
        "button.ah-tok.st.best.ah-ans",
        { type: "button", dataset: { row: `tok:ans:${g}` }, onClick: (ev) => openWeek(ev, g) },
        h("span.ah-tl", null, done ? COPY.answerDone : COPY.answerSave(Math.max(1, (w.ft ?? 1) - (w.used ?? 0)))),
        nx != null ? h("small.ah-tw", null, COPY.rollKeepsCard(nx, g + 1)) : null
      ));
    }
    for (const pl of toks) {
      const s = planSaid(P, g, pl), key = planKey(g, pl), { lost } = planBack(P, g, pl);
      const said = lost && !pl.refRow;
      if (rollOnly(pl)) continue;
      const what = planWeeks(P, { ...pl.choice, moves: [], hits: {} }, g, false).find(([x]) => x === g)?.[1] ?? COPY.planRoll(null);
      out.push(h(
        "span.ah-tok.two",
        { class: { pays: s.pays, wait: !!s.wait }, dataset: { plan: key } },
        h(
          "button.ah-tbody",
          { type: "button", disabled: !!s.wait, dataset: { row: `tok:${key}` }, "aria-label": `${s.label}; ${WHY_SHEET ? "shows why" : COPY.showsWeek}`, onClick: () => openPlanWhy(P, g, pl) },
          // its words and number on one line (number blue with "xP": ui.js xpGain), what it takes back or "planning…"
          // under both across the token's whole width (owner, 2026-10-26: not three lines); never a clock in its
          // number's slot: waitClock
          h("span", null, what),
          s.wait || pl.refRow ? null : xpGain(shownDelta(pl.cmp), "span.ah-tnum.m-num"),
          said ? h("small.ah-tw", null, COPY.planInsteadOf(lost)) : null,
          pl.state === "solving" ? h("small.ah-tw", null, COPY.waitShort) : null
        )
      ));
    }
    return out;
  }
  const numParts = (g, pl) => {
    const chip = SQUAD_CHIPS.has(pl.choice.chips?.[g]) ? null : pl.choice.chips?.[g], hit = pl.hits?.[g] ?? 0;
    return [chip ? h("small.ah-dchip", null, chip.toUpperCase()) : null, hit ? h("small.ah-dhit.m-hit", null, `${MINUS}${HIT_COST * hit}`) : null, xpGain(shownDelta(pl.cmp))];
  };
  function takeFrom(ev, P, g, pl, from, a, inId, act = () => addPlan(V.ctx, g, pl)) {
    const { S, addOnce, cardIn, pitchHost } = V;
    addOnce(ev, () => {
      const card = cardIn(pitchHost.querySelector(":scope > .pm"), a);
      S.fly = { gw: g, at: Date.now(), inId, a, focus: ev.detail === 0, from: from.getBoundingClientRect(), ghost: card && { node: card.cloneNode(true), rect: card.getBoundingClientRect() } };
      const ok = act();
      if (ok) closePlace(false);
      else S.fly = null;
      return ok;
    }, pl ? planTake(P, g, pl).own : []);
  }
  function landMotion(fresh, g) {
    const { FLY_MS, LAND_MAX, S, cardBoxes, cardIn, ctl, pitchHost, redeck } = V;
    const snap = S.snap;
    S.snap = null;
    if (S.fly && (Date.now() - S.fly.at > FLY_MS || S.fly.gw !== g)) S.fly = null;
    const f = S.fly;
    const root = pitchHost.querySelector(":scope > .pm"), rows = root?.querySelector(":scope > .pm-field > .pm-rows");
    if (!root || !rows || !snap || !f && !fresh?.cards?.[g]?.length) return;
    if (f && !cardIn(root, f.inId)) return;
    S.fly = null;
    const ids2 = new Set([...fresh?.cards?.[g] ?? [], ...f ? [f.inId] : []].map(Number));
    const now = cardBoxes(root);
    const here = new Set(now.map((c) => c.id));
    const fresh2 = now.filter((c) => ids2.has(c.id) && !snap.has(c.id));
    const gone = [...snap].filter(([id]) => !here.has(id) && id !== f?.a).map(([id, x]) => ({ id, ...x }));
    if (fresh2.length > LAND_MAX) return;
    const moves = fresh2.map((c) => {
      const r = c.n.getBoundingClientRect(), mine = f?.inId === c.id ? f : null;
      const dist = (x) => Math.hypot(x.rect.left - r.left, x.rect.top - r.top);
      const was = mine ? mine.ghost : gone.filter((x) => dist(x) < Math.max(8, r.width / 2)).sort((x, y) => dist(x) - dist(y))[0] ?? null;
      if (was && !mine) gone.splice(gone.indexOf(was), 1);
      return land2(c.n, r, rows, mine?.from ?? null, was);
    }).filter(Boolean);
    if (f?.focus) cardIn(root, f.inId)?.focus({ preventScroll: true });
    if (!moves.length) return;
    const landing = S.landing = Promise.allSettled(moves.map((a) => a.finished));
    landing.then(() => {
      if (S.landing !== landing) return;
      S.landing = null;
      if (ctl.isConnected) redeck();
    });
  }
  function land2(to, r, rows, from, was) {
    const { FLY_EASE } = V;
    to.querySelector(".pm-face.back")?.remove();
    for (const a2 of to.querySelector(".pm-face.front")?.getAnimations?.() ?? []) a2.finish();
    to.classList.add("ah-landed");
    const base = rows.getBoundingClientRect();
    const ghost = was?.node ?? null;
    if (ghost) {
      ghost.removeAttribute("data-id");
      ghost.classList.remove("ah-stepout", "ah-landed");
      ghost.classList.add("ah-ghost");
      ghost.setAttribute("aria-hidden", "true");
      ghost.inert = true;
      Object.assign(ghost.style, { left: `${was.rect.left - base.left}px`, top: `${was.rect.top - base.top}px` });
      rows.append(ghost);
    }
    const off = () => ghost?.remove();
    if (!to.animate) {
      off();
      return null;
    }
    if (reduceMotion()) {
      const a2 = to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
      if (ghost) ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" }).onfinish = off;
      return a2;
    }
    const lift = from && was ? Math.max(24, was.rect.top - from.top) : 28;
    const a = to.animate(from ? [{ transform: `translate(${from.left - r.left}px, ${from.top - r.top}px)`, zIndex: 6 }, { transform: "none", zIndex: 6 }] : [{ transform: `translateY(${-lift}px) scale(.94)`, opacity: 0.7, zIndex: 1 }, { transform: "none", opacity: 1, zIndex: 4 }], { duration: 200, easing: FLY_EASE });
    if (ghost) ghost.animate([{ transform: "none", opacity: 1 }, { transform: `translateY(${-lift}px) scale(.94)`, opacity: 0 }], { duration: 200, easing: FLY_EASE, fill: "forwards" }).onfinish = off;
    return a;
  }
  function openPlace(a) {
    const { S, ctx, drawPlace, gwNow, pitchHost } = V;
    if (S.drag?.pitch?.lifted || !S.decks?.some((d) => d.a === a)) return;
    closePlace(false);
    S.place = { a, order: null };
    globalThis.addEventListener("keydown", placeKey);
    drawPlace(true);
    if (S.drawn) askPlace(ctx, S.drawn, gwNow(S.drawn), a);
    const layer = pitchHost.querySelector(":scope > .pm > .ah-place");
    ([...layer?.querySelectorAll(".ah-pgo") ?? []].find((x) => !x.disabled) ?? layer?.querySelector(".ah-walk button:not(:disabled)"))?.focus({ preventScroll: true });
  }
  const placeKey = (e) => {
    const { pitchHost } = V;
    if (e.key === "Escape" && (e.target === document.body || pitchHost.contains(e.target))) {
      e.stopPropagation();
      closePlace();
    }
  };
  function closePlace(back = true) {
    const { S, cardIn, pitchHost } = V;
    if (!S.place) return;
    const { a } = S.place;
    S.place = null;
    globalThis.removeEventListener("keydown", placeKey);
    const root = pitchHost.querySelector(":scope > .pm"), layer = root?.querySelector(":scope > .ah-place");
    for (const n of root?.querySelectorAll(".ah-stepout") ?? []) {
      n.classList.remove("ah-stepout");
      n.inert = false;
    }
    if (back) cardIn(root, a)?.focus({ preventScroll: true });
    if (!layer) return;
    if (!back || reduceMotion() || !layer.animate) {
      layer.remove();
      return;
    }
    layer.style.pointerEvents = "none";
    layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }).onfinish = () => layer.remove();
  }
  return { renderDecks, spanOf, sheetFollows, swapPlate, placeLabel, statusLine, tokensOf, numParts, takeFrom, landMotion, land: land2, openPlace, placeKey, closePlace };
}

// js/m/ahead/screen-place.js
function placePart(V) {
  function drawPlace(deal) {
    const { FLY_EASE, S, cardBoxes, closePlace, ctx, entryKey, frozenAt, gwNow, numParts, openPlanWhy, pitchHost, plNumSaid, planKey, planSaid, plansVs, plateOf, spend, takeFrom } = V;
    const root = pitchHost.querySelector(":scope > .pm");
    const P = S.drawn, w = P && weekOf(P, gwNow(P)), d = w && S.decks?.find((x) => x.a === S.place?.a);
    const was = document.activeElement?.closest?.(".ah-place") ? document.activeElement : null;
    const focusKeyOf = (n2) => n2 && (n2.dataset.key ? `[data-key="${CSS.escape(n2.dataset.key)}"]` : n2.dataset.add ? `[data-add="${CSS.escape(n2.dataset.add)}"]` : n2.getAttribute("aria-label") ? `[aria-label="${CSS.escape(n2.getAttribute("aria-label"))}"]` : null);
    const again = focusKeyOf(was);
    root?.querySelector(":scope > .ah-place")?.remove();
    for (const n2 of root?.querySelectorAll(".ah-stepout") ?? []) {
      n2.classList.remove("ah-stepout");
      n2.inert = false;
    }
    const boxes = root && d ? cardBoxes(root) : [], c = boxes.find((x) => x.id === d?.a);
    if (!c) {
      closePlace(false);
      return;
    }
    const g = w.gw, nm = P.L.name, W = root.clientWidth, data = ctx.data;
    const px = (x, y) => ({ left: `${x}px`, top: `${y}px`, width: `${c.w}px` });
    S.place.order ??= placeOrder(d.entries).map((e) => entryKey(g, e));
    const rank = new Map([...S.place.order, ...placeOrder(d.entries).map((e) => entryKey(g, e))].map((k, i2) => [k, i2]).reverse());
    const at = (e) => [takesBack(e) ? 1 : 0, rank.get(entryKey(g, e))];
    const entries = d.entries.slice().sort((x, y) => {
      const [p, i2] = at(x), [q, j] = at(y);
      return p - q || i2 - j;
    });
    const row = c.n.closest(".pm-row, .pm-bench");
    const mates = boxes.filter((q) => q !== c && q.n.closest(".pm-row, .pm-bench") === row);
    const xs = [c, ...mates].map((q) => q.x).sort((p, q) => p - q);
    const step = c.bench && xs.length > 1 ? Math.min(...xs.slice(1).map((x, i2) => x - xs[i2])) : c.w + Math.max(4, (W - 5 * c.w) / 6);
    const room = slotsBeside(c.x, step, PLACE_SLOTS, W, c.w);
    const { singles, line: pline } = placeSplit(entries, d.a);
    const other = P.editable && !frozenAt(P, g);
    const pages = placePages(singles, room.length, other), pg = (S.place.page ?? 0) % pages.length;
    const over = pages.length > 1;
    const shown = pages[pg];
    const tileAt = over ? room.at(-1) : other ? room[shown.length] ?? null : null;
    const used = room.slice(0, shown.length + (tileAt != null ? 1 : 0));
    const out = mates.filter((q) => used.some((x) => Math.abs(q.x - x) < q.w));
    for (const q of out) {
      q.n.classList.add("ah-stepout");
      q.n.inert = true;
    }
    const tab = (x) => `calc(${c.y}px - var(--pm-tab))`;
    const P2 = plateOf().second;
    const shade = h("div.ah-pshade", { onClick: (e) => shadeTap(e, boxes) });
    const own = c.n.cloneNode(true);
    own.removeAttribute("data-id");
    own.classList.remove("ah-landed");
    own.classList.add("ah-pown");
    Object.assign(own.style, px(c.x, c.y));
    own.addEventListener("click", (e) => {
      e.stopPropagation();
      c.n.focus({ preventScroll: true });
      closePlace(false);
      c.n.click();
    });
    const myMove = d.mine ? w.moves.find((m) => Number(m.in) === d.a) : null;
    const yours = !!myMove && !!pinOfMove(P, { ...myMove, gw: g });
    const keeps = !d.mine && P.editable && !frozenAt(P, g);
    const nowHead = keeps ? h("button.ah-phead.now.ah-pkeep.outl", {
      type: "button",
      dataset: { key: "keep" },
      "aria-label": COPY.placeKeepSaid(nm(d.a), g),
      style: { ...px(c.x, 0), top: tab() },
      onClick: () => {
        closePlace(false);
        keep(ctx, d.a, { gw: g, scope: "gw" });
      }
    }, COPY.placeKeep) : h(
      "div.ah-phead.now",
      { "aria-hidden": "true", style: { ...px(c.x, 0), top: tab() } },
      // (your number blue with "xP": xpGain)
      // (in a span fitNum fits, as a dealt card's number)
      yours ? h("span.ah-pv.m-num", null, COPY.placeYours) : COPY.placeNow
    );
    const dealt = [];
    shown.forEach((e, i2) => {
      const x = room[i2], pl = e.pl, s = pl ? planSaid(P, g, pl) : null;
      const ready = !pl || pl.state === "ready";
      const fk = !!e.remove && !pinOfMove(P, e.remove);
      const said = e.remove ? fk ? COPY.keepIn(nm(e.remove.out), g) : COPY.placeRemoveSaid(nm(e.remove.out), nm(e.remove.in)) : s.label;
      const card = ctx.pitch.pitchCard(e.inId, {
        players: data.byId,
        gw: g,
        horizon: data.xpGws,
        second: P2,
        first: g === P.A,
        onPlayer: () => pl && ready ? openPlanWhy(P, g, pl) : ctx.openSheet("player", e.inId, { gw: g })
      });
      card.removeAttribute("data-id");
      card.classList.add("ah-pcard");
      card.dataset.deal = i2;
      card.dataset.key = entryKey(g, e);
      card.setAttribute("aria-label", `${said}${pl && ready ? "; shows why" : ""}. ${card.getAttribute("aria-label")}`);
      Object.assign(card.style, px(x, c.y));
      const num2 = e.remove ? fk ? COPY.placeKeep : COPY.placeRemove : pl.refRow ? COPY.planRoll(null) : !ready ? pl.state === "failed" ? failedWords(P, pl).head : COPY.waitShort : null;
      const rollBack = !!pl && !pl.refRow && !pl.choice.moves.length && !Object.keys(pl.choice.chips).length;
      const word = e.remove || pl.refRow ? num2 : rollBack && ready ? COPY.planRoll(null) : null;
      const swaps = e.remove ? [] : [[nm(d.a), nm(e.inId)], ...e.pair.map((q) => [nm(q.out), nm(q.in)])];
      const go = h("button.ah-pgo", {
        type: "button",
        disabled: !ready || frozenAt(P, g),
        dataset: { add: pl ? `plan:${planKey(g, pl)}` : `rm:${e.remove.out}>${e.remove.in}` },
        "aria-label": e.remove ? said : pl.refRow ? COPY.planTake(s.head) : rollBack && ready ? `${COPY.planTake(s.head)}, ${plNumSaid(P, pl)}` : COPY.swapSaid(swaps, ready ? plNumSaid(P, pl) : null),
        onClick: (ev) => takeFrom(ev, P, g, pl, card, d.a, e.inId, e.remove ? () => removeMove(ctx, e.remove) : void 0)
      }, word ?? COPY.placeSwap);
      const top1 = !!pl && S.M?.lit?.move === pl, pays = !top1 && !!pl && ready && plPays(pl);
      go.classList.add("m-swap", ...top1 ? ["best"] : pays ? [] : ["quiet"]);
      const head = h(
        "div.ah-phead",
        { class: { best: top1, pays, lo: !top1 && !pays }, dataset: { deal: i2 }, style: { ...px(x, 0), top: tab() } },
        word && !(rollBack && ready) ? null : h("span.ah-pv.m-num", { "aria-hidden": "true", class: { wait: !ready } }, num2 ?? numParts(g, pl)),
        go
      );
      const text = takesBack(e) ? noteOf(P, w, e, d.a) : [pl?.removed ? COPY.removedByYou : null, pl?.state === "failed" ? failedWords(P, pl).note : null].filter(Boolean).join(" \xB7 ") || null;
      const note = text ? h(
        "div.ah-pnote",
        {
          class: { warn: pl?.state === "failed" && !pl.needs },
          style: { left: `${x}px`, top: `${c.y}px`, width: `${c.w}px` }
        },
        h("span.ah-pnt", { "aria-hidden": "true" }, whole(text))
      ) : null;
      const flagged = note && card.querySelector(".pm-flag");
      if (flagged) note.append(flagged);
      dealt.push([card, head, note, x]);
    });
    const toWeek = (plan2 = null) => {
      c.n.focus({ preventScroll: true });
      closePlace(false);
      weekSheet(g, "plans", plan2);
    };
    const unseen = placeBuys(singles).length - shown.length;
    const both = over && other;
    const tile = tileAt == null ? null : h(
      "div.ah-ptile",
      { style: { ...px(tileAt, 0), top: both ? tab() : `${c.y}px`, height: both ? `calc(${c.h}px + var(--pm-tab))` : `${c.h}px` } },
      over ? h("button.ah-pmore", { type: "button", dataset: { key: "more" }, onClick: () => {
        S.place.page = pg + 1;
        drawPlace(true);
      } }, COPY.placeMore(unseen)) : null,
      other ? h("button.ah-pmore.ah-pother", {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-label": COPY.placeOtherSaid(nm(d.a), g),
        dataset: { key: "other" },
        onClick: () => {
          c.n.focus({ preventScroll: true });
          closePlace(false);
          ctx.openSheet("wish", null, { gw: g, pos: P.L.pos(d.a), out: d.a });
        }
      }, COPY.placeOther) : null
    );
    const i = S.decks.indexOf(d), n = S.decks.length, place = COPY.placeOf(nm(d.a));
    const benched = [...new Set(entries.flatMap((e) => e.pl ? benchedBuys(P, g, e.pl) : []))].map(nm);
    const onBench = benched.length ? COPY.onYourBench(benched) : null;
    const walk = h(
      "div.ah-walk",
      { class: { top: c.bench }, role: "group", "aria-label": `${place}, ${COPY.placeAt(i + 1, n)}${onBench ? `. ${onBench}` : ""}` },
      // (no pager over one place: no "1 of 1", no ‹ ›; owner, 2026-11-03, design_1103b "Place header": Saffer, Birman,
      // Johnson, Podmajersky)
      n > 1 ? h("button", { type: "button", "aria-label": "Previous place", dataset: { key: "prev" }, onClick: () => stepPlace(-1) }, "\u2039") : null,
      h(
        "span.ah-wl",
        { "aria-hidden": "true" },
        h("span.ah-wl1", null, n > 1 ? `${place} \xB7 ${COPY.placeAt(i + 1, n)}` : place),
        h("span.ah-wl2", null, COPY.placeNumbers(plansVs(P, g), P.gws.filter((x) => x >= g))),
        onBench ? h("span.ah-wl2.ah-wl3", null, onBench) : null
      ),
      n > 1 ? h("button", { type: "button", "aria-label": "Next place", dataset: { key: "next" }, onClick: () => stepPlace(1) }, "\u203A") : null,
      h("button", { type: "button", "aria-haspopup": "dialog", dataset: { key: "all" }, onClick: () => toWeek() }, COPY.placeAll(S.M.plans.filter((x) => !x.needs).length)),
      h("button.m-xbtn", { type: "button", "aria-label": "Close", dataset: { key: "close" }, onClick: () => closePlace() }, "\u2715"),
      pline ? planLine(P, g, d, pline) : null
    );
    const layer = h(
      "div.ah-place",
      { role: "group", "aria-label": `${place}, ${COPY.placeAt(i + 1, n)}` },
      // (read in the block's order, a header's Swap, its note's line, then his card: VoiceOver too)
      shade,
      own,
      nowHead,
      dealt.map(([card, head, note]) => [head, note, card]),
      tile,
      walk
    );
    root.append(layer);
    ctx.pitch.fitFixtures(layer);
    for (const head of [nowHead, ...dealt.map(([, x]) => x)]) fitNum(head, head.querySelector(HEAD_NUM), HEAD_TRIMS);
    oneLook(dealt.map(([, x]) => x), ["noxp", "tight", "snug"]);
    scaleHeads([nowHead]);
    scaleHeads(dealt.map(([, x]) => x));
    fitLine(layer.querySelector(".ah-pline"));
    const drop = fitBlocks(root, boxes, c, dealt);
    if (drop && tile) tile.style.top = both ? `calc(${c.y + drop}px - var(--pm-tab))` : `${c.y + drop}px`;
    let from = null;
    layer.addEventListener("pointerdown", (e) => {
      from = [e.clientX, e.clientY];
    });
    layer.addEventListener("pointercancel", () => {
      from = null;
    });
    layer.addEventListener("pointerup", (e) => {
      if (!from) return;
      const dx = e.clientX - from[0], dy = e.clientY - from[1];
      from = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        spend(e);
        closePlace();
      }
    });
    if (again) (layer.querySelector(again) ?? layer.querySelector(".ah-walk button:not(:disabled)"))?.focus({ preventScroll: true });
    if (!deal || !layer.animate) return;
    shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    dealt.forEach(([card, head, note, x], k) => {
      const kf = reduceMotion() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: `translateX(${c.x - x}px) scale(.94)`, opacity: 0 }, { transform: "none", opacity: 1 }];
      const o = { duration: reduceMotion() ? 150 : 180, delay: reduceMotion() ? 0 : k * 18, easing: FLY_EASE, fill: "backwards" };
      for (const n2 of [card, head, note]) n2?.animate(kf, o);
    });
  }
  function planLine(P, g, d, e) {
    const { S, frozenAt, numParts, openPlanWhy, plNumSaid, planKey, planSaid, takeFrom } = V;
    const pl = e.pl, nm = P.L.name, ready = pl.state === "ready", s = planSaid(P, g, pl), ms = lineMoves(P, e);
    const swaps = e.adds.map((m) => [nm(m.out), nm(m.in)]);
    const why = () => openPlanWhy(P, g, pl);
    return h(
      "div.ah-pline",
      { class: { best: S.M?.lit?.move === pl }, dataset: { plan: planKey(g, pl) } },
      h(
        "button.ah-plw",
        { type: "button", "aria-haspopup": "dialog", disabled: !ready, dataset: { key: `line:${planKey(g, pl)}` }, "aria-label": `${s.label}; shows why`, onClick: why },
        // (each move unbroken, the line wrapping only between them)
        ms.map((x, i) => [h("span.ah-tmv", null, x, i < ms.length - 1 ? "," : null), " "]),
        ms.back ? [h("span.ah-tmv", null, ms.back), " "] : null,
        h("span.ah-tmv.m-num", { class: { wait: !ready } }, ready ? numParts(g, pl) : pl.state === "failed" ? COPY.placeCantPlan : COPY.waitShort),
        // (its take gives way for room, fitLine: the words then open the sheet that takes it)
        h("span.ah-plm", { "aria-hidden": "true" }, " \u203A")
      ),
      h("button.ah-plgo.m-swap", {
        type: "button",
        class: { best: S.M?.lit?.move === pl },
        disabled: !ready || frozenAt(P, g),
        dataset: { add: `plan:${planKey(g, pl)}` },
        "aria-label": swaps.length ? COPY.swapSaid(swaps, ready ? plNumSaid(P, pl) : null) : `${COPY.planTake(s.head)}${ready ? `, ${plNumSaid(P, pl)}` : ""}`,
        onClick: (ev) => takeFrom(ev, P, g, pl, ev.currentTarget, d.a, e.inId)
      }, swaps.length ? COPY.swapGo(swaps.length) : COPY.planRoll(null))
    );
  }
  function fitLine(line) {
    const { LINE_LEAST } = V;
    const w = line?.querySelector(".ah-plw");
    if (!w) return;
    const over = () => w.scrollWidth > w.clientWidth + 0.5;
    const smaller = () => {
      for (let k = 1; over() && k > LINE_LEAST; ) {
        k = Math.max(LINE_LEAST, k - 0.03);
        line.style.setProperty("--pl-k", k.toFixed(3));
      }
    };
    if (!over()) return;
    line.classList.add("noxp");
    smaller();
    if (!over()) return;
    line.classList.add("nogo");
    line.style.removeProperty("--pl-k");
    smaller();
    if (over()) line.classList.add("wrap");
  }
  function scaleHeads(heads) {
    const px = (e, k2) => parseFloat(getComputedStyle(e)[k2]) || 0;
    const type = (x) => Math.min(px(x, "fontSize"), ...[...x.querySelectorAll(".ah-pv, .ah-pgo")].map((e) => px(e, "fontSize")));
    const over = () => heads.some((x) => [x, x.querySelector(HEAD_NUM)].some((e) => !!e && e.scrollWidth > e.clientWidth + 0.5));
    for (const x of heads) x.style.removeProperty("--ph-k");
    if (!heads.length || !over()) return;
    const k = Math.min(...heads.map((x) => {
      const kids = [...x.children], pad = (e) => px(e, "paddingLeft") + px(e, "paddingRight");
      const need = kids.length ? kids.reduce((a, e) => a + (e.matches(".ah-pv.wait") ? 0 : e.scrollWidth - pad(e)), 0) : x.scrollWidth - pad(x);
      const room = x.clientWidth - pad(x) - px(x, "columnGap") * Math.max(0, kids.length - 1) - kids.reduce((a, e) => a + pad(e), 0);
      return headScale(need, room, type(x));
    }));
    const least = Math.min(1, Math.max(...heads.map((x) => HEAD_LEAST / type(x))));
    for (let j = Math.max(k, least); ; j = Math.max(least, j - 0.04)) {
      for (const x of heads) x.style.setProperty("--ph-k", j.toFixed(3));
      if (!over() || j <= least) return;
    }
  }
  function fitBlocks(root, boxes, c, dealt) {
    const blocks = dealt.filter(([, , note]) => note);
    if (!blocks.length) return 0;
    const W = root.clientWidth, tab = blocks[0][1].offsetHeight;
    const room = (card) => (card.querySelector(".pm-plate")?.getBoundingClientRect().top ?? 0) - card.getBoundingClientRect().top;
    const rooms = blocks.map(([card]) => Math.max(0, room(card)));
    const words = (note) => [note, ...note.querySelectorAll(":scope > :not(.pm-flag)")];
    const wide = (note) => words(note).some((e) => e.scrollWidth > e.clientWidth + 0.5);
    const need = () => Math.max(...blocks.map(([, , note], i) => note.scrollHeight - rooms[i]));
    for (const [, , note] of blocks) note.style.removeProperty("--pn-k");
    for (const [i, [, , note]] of blocks.entries()) note.style.minHeight = `${rooms[i]}px`;
    const top = root.getBoundingClientRect().top, plateY = (q) => (q.n.querySelector(".pm-plate")?.getBoundingClientRect().top ?? top + q.y) - top;
    const above = boxes.filter((q) => q.y + q.h <= c.y - 1).reduce((m, q) => Math.max(m, q.y + q.h), 0);
    const rb = (e) => e.getBoundingClientRect().top - top;
    const below = [...boxes.filter((q) => q.y >= c.y + c.h + 1).map(plateY), ...(c.bench ? [] : [...root.querySelectorAll(".ah-place .ah-walk")]).map(rb).filter((y) => y >= c.y + c.h + 1)].reduce((m, y) => Math.min(m, y), root.clientHeight);
    const up = Math.max(0, c.y - tab - above - 2), down = Math.max(0, below - c.y - c.h - 2);
    const least = Math.min(1, HEAD_LEAST / parseFloat(getComputedStyle(blocks[0][2]).fontSize));
    for (let k = 1; (need() > up + down + 0.5 || blocks.some(([, , note]) => wide(note))) && k > least; ) {
      k = Math.max(least, k - 0.04);
      for (const [, , note] of blocks) note.style.setProperty("--pn-k", k.toFixed(3));
    }
    const ns = blocks.map(([, , note], i) => Math.max(0, Math.ceil(note.scrollHeight - rooms[i])));
    const n = Math.max(...ns), drop = Math.min(down, Math.max(0, n - up));
    if (drop) {
      for (const [card, head] of dealt) {
        card.style.top = `${c.y + drop}px`;
        head.style.top = `${c.y + drop - tab}px`;
      }
    }
    for (const [i, [, head, note]] of blocks.entries()) {
      note.style.top = `${c.y + drop - ns[i]}px`;
      note.style.minHeight = `${rooms[i] + ns[i]}px`;
      head.style.top = `${c.y + drop - ns[i] - tab}px`;
    }
    if (n > up + down + 0.5) root.querySelector(":scope > .ah-place").dataset.rise = "over";
    for (const [, , note, x] of blocks) {
      if (!wide(note)) continue;
      const w = Math.min(W - 6, Math.max(...words(note).map((e) => e.scrollWidth)) + 2);
      note.style.width = `${w}px`;
      note.style.left = `${Math.min(W - 3 - w, Math.max(3, x + (c.w - w) / 2))}px`;
    }
    for (const [, , note] of blocks) {
      const line = note.querySelector(":scope > .ah-por");
      if (!line) continue;
      const r = line.getBoundingClientRect(), nb = note.getBoundingClientRect();
      const roof = Math.max(nb.top, ...[...note.children].filter((e) => e !== line).map((e) => e.getBoundingClientRect().bottom));
      const want2 = Math.max(0, 44 - r.height), under = Math.max(0, Math.min(nb.bottom - r.bottom, want2 / 2)), over = Math.max(0, Math.min(r.top - roof, want2 - under));
      line.style.setProperty("--por-t", `${over}px`);
      line.style.setProperty("--por-b", `${Math.max(0, Math.min(nb.bottom - r.bottom, want2 - over))}px`);
    }
    return drop;
  }
  function stepPlace(dir) {
    const { S, openPlace, pitchHost } = V;
    const D = S.decks ?? [], i = D.findIndex((x) => x.a === S.place?.a);
    if (i < 0 || D.length < 2) return;
    const bar = document.activeElement?.closest?.(".ah-walk") ? document.activeElement.dataset.key : null;
    openPlace(D[(i + dir + D.length) % D.length].a);
    if (bar) pitchHost.querySelector(`:scope > .pm > .ah-place .ah-walk [data-key="${bar}"]`)?.focus({ preventScroll: true });
  }
  function shadeTap(e, boxes) {
    const { S, closePlace, openPlace, pitchHost } = V;
    const b = pitchHost.querySelector(":scope > .pm")?.getBoundingClientRect();
    const x = e.clientX - (b?.left ?? 0), y = e.clientY - (b?.top ?? 0);
    const to = (S.decks ?? []).find((d) => {
      const q = d.a !== S.place?.a && boxes.find((c) => c.id === d.a);
      return q && !q.n.classList.contains("ah-stepout") && x >= q.x - 4 && x <= q.x + q.w + 4 && y >= q.y - 44 && y <= q.y + 16;
    });
    if (to) openPlace(to.a);
    else closePlace();
  }
  function weekSheet(g, at = null, plan2 = null) {
    const { S, ctx, drawWeek, uncovered, weekModel } = V;
    const P = S.drawn, w = P && weekOf(P, g);
    if (!w) return;
    if (S.week && S.week.g !== g) rowsWanted(S.week.g, false);
    rowsWanted(g, true);
    if (!S.week) {
      const title = COPY.weekTitle(g);
      ctx.sheets.open({
        title,
        label: title,
        detent: "medium",
        cls: "ah-wsheet",
        build(body, sheet) {
          S.week = { sheet, g, host: h("section.ah-block.ah-wk", { "aria-label": title }), title: body.querySelector(".m-sh h2") };
          body.append(S.week.host);
          uncovered.observe(sheet.el, { attributes: true, attributeFilter: ["inert"] });
        },
        onClose: () => {
          presolveTaps(ctx, null, { owner: S.week?.sheet });
          if (S.week) rowsWanted(S.week.g, false);
          S.week = null;
        }
      });
    }
    drawWeek(P, w, weekModel(P, w));
    const to = plan2 && S.week.host.querySelector(`[data-plan="${CSS.escape(plan2)}"]`) || at && S.week.host.querySelector(`[data-at="${at}"]`);
    if (to) {
      S.week.sheet.setDetent("large");
      to.scrollIntoView({ block: "start" });
    }
  }
  return { drawPlace, planLine, fitLine, scaleHeads, fitBlocks, stepPlace, shadeTap, weekSheet };
}

// js/m/ahead/screen-week.js
function weekPart(V) {
  function drawWeek(P, w, M) {
    const { S, ap0, asksHost, changeRow, ctx, ftAfter, litPays, planRow, plansHeading, plansListed: plansListed2, rollFacts, shareWeek, waitClock, waitNow, weekGain, xferRow } = V;
    const WN = M.wait ? waitNow() : null;
    const g = w.gw, W = S.week;
    if (W.g !== g) {
      W.g = g;
      if (W.title) W.title.textContent = COPY.weekTitle(g);
      W.sheet.el.setAttribute("aria-label", COPY.weekTitle(g));
      W.host.setAttribute("aria-label", COPY.weekTitle(g));
    }
    const rows = M.sq ? [h("p.ah-gwnote.m-foot", null, COPY.chipWeek(M.sq, g, M.sq === "fh" ? ftAfter(P, w) : null)), h("div.ah-moves.sq", null, w.moves.map((m) => changeRow(P, w, m)))] : movesInOrder(P, w).map((m, i) => xferRow(P, w, m, i));
    const name = plansHeading(P, g);
    const plans = M.lit?.move ? [M.lit.move, ...M.plans.filter((pl) => pl !== M.lit.move)] : M.plans;
    const facts = M.live ? null : rollFacts(P, w);
    const wg = !M.live && !M.sq && shareWeek(w) ? weekGain(P, w) : null;
    fill(
      W.host,
      wg ? h(
        "p.ah-bs.ah-wfacts.ah-wgain",
        { dataset: { row: "weekgain" } },
        h("b", null, COPY.nTransfers(w.moves.length)),
        hitTag(w.hits),
        " ",
        numOf(wg.wait, wg.cmp, ap0(P, g)),
        wg.cmp && !wg.wait && wg.vs ? ` vs ${COPY.planVsRoll}` : null
      ) : null,
      facts ? h("p.ah-bs.ah-wfacts", { "aria-label": facts.said }, facts.rest) : null,
      M.live ? h("div.ah-brow.ah-bq.ah-blive", { role: "status" }, h("span.ah-bt", null, M.liveText)) : null,
      M.notices.map((x) => x.row?.()),
      rows,
      // while they solve, how far, as the strip's wait line says it, the same one wait (waitNow): "Planning GW8 · 3 of 9 ·
      // 0:12" (waitClock)
      // rows sharing an "instead of …" get it as a subheading ("Instead of Palmer")
      // (the plans only where one is more than the reference: "Roll 0.0" alone counted the roll against itself and said
      // nothing under "Suggested plans"; card audit 2026-11-10, boards-full 383130 #004)
      plansListed2(M) ? [
        h(
          "div.ah-wh",
          { dataset: { at: "plans" } },
          h("h3", null, name),
          WN ? h("p.ah-bs", null, `${WN.word}${waitLines({ scope: WN.scope, prog: WN.prog })[0]}`, S.wait ? h("span", { "aria-hidden": "true" }, " \xB7 ", waitClock()) : null) : null
        ),
        // the two groups (rows that add to your transfer, rows sharing the "instead of …") in their best rows' order,
        // rows within each best first: by M.plans' own order, best first once none checks (plansOf's byGain), the slots
        // held while they check (heldOrder)
        // (never a pair's move the week can't make alone, plansOf `needs`: a dead row whose reason was the phone's sum,
        // fitOf)
        ...[false, true].map((sh) => ({ sh, grp: plans.filter((pl) => !pl.needs && planBack(P, g, pl).back === M.sharedBack === sh) })).filter((x) => x.grp.length).sort((x, y) => plans.indexOf(x.grp[0]) - plans.indexOf(y.grp[0])).map(({ sh, grp }) => {
          const worth = (pl) => (planBack(P, g, pl).adds.length && !pl.refRow ? cardGain(ctx, P, g, pl) : null) ?? shownDelta(pl.cmp);
          const rows2 = [...grp].sort((a, b) => (M.lit?.move === b) - (M.lit?.move === a) || worth(b) - worth(a)).map((pl) => planRow(P, g, pl, { shared: M.sharedBack, closes: true, lit: litPays(pl, M), best: M.lit?.move === pl }));
          if (sh) for (const r of rows2) r.dataset.under = "instead";
          return sh ? [h("div.ah-wh", { dataset: { at: "instead" } }, h("p.ah-bs", null, capFirst(M.sharedBack))), rows2] : rows2;
        })
      ] : null,
      asksHost.firstChild ? [h("div.ah-wh", { dataset: { at: "rules" } }, h("h3", null, COPY.rulesHead)), asksHost] : null
    );
    if (P.editable && !M.live && M.settled) {
      const { takes, removes, sig } = weekTaps(ctx, P, g, M.plans);
      presolveTaps(ctx, [...takes, ...removes], { gw: g, sig, owner: W.sheet });
    }
  }
  function clashRow(P, c) {
    const { ctx, gwNow } = V;
    const held = c.pins.some((p) => liftsLive(ctx, P, p)) && gwNow(P) !== P.A;
    return h(
      "div.ah-brow.ah-ask.ah-clash",
      { role: "status" },
      icon("warn", { size: 16 }),
      h("p.ah-askt", null, held ? `${c.text} ${COPY.live(P.A)}` : c.text),
      c.pins.length ? h("div.ah-askb", null, c.pins.map((p) => h("button.ah-askno", {
        type: "button",
        disabled: !P.editable || liftsLive(ctx, P, p),
        onClick: () => removeRule(ctx, p.id)
      }, `Remove ${rowName(P, p)}`))) : null
    );
  }
  const noteRow = (cls, text) => h(`div.ah-brow.ah-ask${cls}`, { role: "status" }, Array.isArray(text) ? h("div.ah-askt", null, h("p", null, text[0]), h("ul.ah-steps", null, text[1].map((x) => h("li", null, x)))) : h("p.ah-askt", null, text));
  function forecastLine(P) {
    const { S, ctx } = V;
    const m = P.mem;
    if (!m || P.healing) {
      if (S.fc) S.fc.text = null;
      return null;
    }
    if (S.fc?.version !== m.version) {
      const mem = memOf(ctx), fc = mem.forecastChange();
      S.fc = { version: m.version, at: FLASH?.at ?? 0, text: fc ? COPY.newForecast(P.A, fc.gwA, fc.pencil?.text, fc.held) : null };
      mem.markSeen();
    }
    if ((FLASH?.at ?? 0) !== S.fc.at || !m.hold && m.source !== "model") S.fc.text = null;
    return S.fc.text;
  }
  const waitSig = (P, watch) => {
    const n = watch.nights[watch.at];
    return `${P.entry}:${n.epoch}:${n.verdict}:${n.w}`;
  };
  function waitWatch(P, watch) {
    const { ctx, render } = V;
    ctx.api?.local?.set?.(WAIT_KEY, waitSig(P, watch));
    render();
  }
  function keepNight(P, watch) {
    const { S, ctx } = V;
    const counted2 = Object.values(watch.players).filter((p) => p.counted && P.L.priceT(p.id) != null);
    const kept = { entry: P.entry, gw: P.A, epoch: watch.nights[watch.at].epoch, prices: Object.fromEntries(counted2.map((p) => [p.id, P.L.priceT(p.id)])) };
    const s = JSON.stringify(kept);
    if (s === S.nightKept) return;
    S.nightKept = s;
    S.night = kept;
    ctx.api?.local?.set?.(NIGHT_KEY, s);
  }
  function sayNight(P) {
    const { S, ctx } = V;
    S.night ??= ctx.api?.local?.json?.(NIGHT_KEY) || false;
    const k = S.night;
    if (!k) return;
    const w = k.entry === P.entry && k.gw === P.A ? weekOf(P, P.A) : null;
    const prices = Object.fromEntries(Object.keys(k.prices || {}).map((id) => [id, P.L.priceT(id)]).filter(([, t]) => t != null));
    const text = w ? priceMorning(k, P.b.meta, { prices, bank: w.moves.length ? w.bank : null, name: P.L.name }) : null;
    if (w && !text) return;
    S.night = false;
    S.nightKept = null;
    ctx.api?.local?.set?.(NIGHT_KEY, null);
    if (text) toastOf(ctx)(text, "info");
  }
  function sayCarried(P) {
    const { S, ctx, gwNow, weekSheet } = V;
    const t = P.mem?.carried;
    if (!t || S.carriedSaid === t) return;
    S.carriedSaid = t;
    const review = () => {
      if (S.drawn) weekSheet(gwNow(S.drawn), "rules");
    };
    toastOf(ctx)(t, "info", listedRules(P, gwNow(P)).length ? { action: { label: "Review", onClick: review } } : {});
  }
  function barNode({ one = null, two = null, warn = false, label = null, onClick = null, status = false, moves = "", doors = [], cls = "" }) {
    const at = onClick ? { type: "button", dataset: { row: "week", ...moves ? { moves } : {} }, "aria-haspopup": "dialog", "aria-label": label, onClick } : status ? { role: "status" } : { "aria-hidden": "true" };
    return h(
      `div.ah-pbar${cls}`,
      null,
      h(
        "div.ah-pbh",
        onClick ? { role: "heading", "aria-level": "3" } : null,
        h(
          `${onClick ? "button" : "div"}.ah-brow.ah-pbt`,
          at,
          one ? one.classList?.contains("ah-bst") ? one : h("span.ah-bt", null, one) : null,
          two ? h("span.ah-bs", { class: { warn } }, two) : null
        )
      ),
      doors.length ? h("div.ah-doors", null, doors) : null
    );
  }
  const dotted = (xs) => xs.filter(Boolean).flatMap((x, i) => [i ? " \xB7 " : null, x]);
  const bsep = (t) => h("span.ah-bsep", { dataset: { t } }, t);
  const textOf = (nodes) => [].concat(nodes).flat(Infinity).map((x) => x?.textContent ?? x ?? "").join("");
  function bankWarn(P, w) {
    const { ap0, priceDrift } = V;
    if (priceDrift(P, w)) return COPY.priceDrift(w.bank, w.gw);
    const short = w.bank != null && w.bank < -1e-9 && !ap0(P, w.gw);
    return short ? h("span.g-loss", null, `${fmt.money(w.bank)} in bank`) : null;
  }
  function bankLead(P, w) {
    const { itbNode } = V;
    const warn = bankWarn(P, w);
    if (warn) return { node: warn, said: textOf(warn) };
    const x = itbWords(w.bank);
    return x && { node: h("span.ah-fact", null, itbNode(x[0])), said: x[1] };
  }
  function weekLead(P, w) {
    const [[ft, ftSaid]] = weekFacts(P, w), bank = bankLead(P, w);
    return { node: [h("span.ah-fact", null, ft), bank ? [bsep(" \xB7 "), bank.node] : null], said: [ftSaid, bank?.said].filter(Boolean).join(", ") };
  }
  const roadOfEv = (ev, g) => ({ weeks: ev.gws.filter((x) => x.gw >= g).map((x) => ({
    gw: x.gw,
    in: x.bought,
    out: x.sold,
    xi: x.xi,
    bench: x.bench,
    captain: x.captain,
    vice: x.vice,
    chip: x.chip ?? null,
    bank: x.bank,
    ft_avail: x.ft,
    ft_used: x.used,
    hits: x.hits,
    pred: x.gross
  })) });
  function movesTitle2(P, g, moves, { nb = false, tail = "" } = {}) {
    const { ctx } = V;
    const name = (id) => nb ? P.L.name(id).replace(/ /g, "\xA0") : P.L.name(id);
    const link = (id) => h("button.wy-tn", { type: "button", "aria-haspopup": "dialog", "aria-label": COPY.cardOf(P.L.name(id)), onClick: () => ctx.openSheet("player", id, { gw: g }) }, name(id));
    return h("span.wy-ttl", null, moves.map((m, i) => [i ? ", " : null, link(m.out), nb ? "\xA0\u2192\xA0" : " \u2192 ", link(m.in)]), tail ? ` ${tail}` : null);
  }
  function openWhy(P, g, m) {
    const { ctx, frozenAt, rollOf, rolling, shareWeek } = V;
    if (!WHY_SHEET) return ctx.openSheet("player", Number(m.in), { gw: g });
    const nm = P.L.name;
    const w = weekOf(P, g);
    let withIt, without, drafts = null, lead = null, label = null, pairs = null;
    const vr = rollOf(P, w), shares = shareWeek(w);
    const rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const f = fundingOf(P, g, m);
    if (rg && f && f.fund.move === w.moves.find((x) => x.out === m.out && x.in === m.in)) {
      const both = /* @__PURE__ */ new Set([`${f.main.move.out}>${f.main.move.in}`, `${f.fund.move.out}>${f.fund.move.in}`]);
      let d = draftOf(ctx);
      for (const x of movesInOrder(P, w).filter((y) => both.has(`${y.out}>${y.in}`))) d = dropMove(d, flatMoves(d).find((z) => z.gw === g && z.out === x.out) ?? { gw: g, ...x });
      withIt = planBaseline(ctx, P, g);
      without = asTaken(ctx, P, d, g);
      lead = [COPY.funds(fmt.money(freedBy(rg.withIt, g, m)), nm(f.main.move.in)), shares ? null : `on its own ${fmt.signed(rg.cmp.delta)}`].filter(Boolean);
      label = `with ${nm(f.main.move.in)}`;
      pairs = [pairOf(withIt, g, m), pairOf(withIt, g, f.main.move)];
    } else if (rg) {
      withIt = rg.withIt;
      without = rg.without;
      drafts = [rg.dWith, rg.dWithout];
    } else {
      const d0 = draftOf(ctx);
      drafts = [d0, dropMove(d0, flatMoves(d0).find((x) => x.gw === g && x.out === m.out) ?? { gw: g, ...m })];
      withIt = planBaseline(ctx, P, g);
      without = asTaken(ctx, P, drafts[1], g);
    }
    const own = compare2(ctx, withIt, without);
    const c = vr ?? own;
    const rolls = !!vr || !(without.gws.find((x) => x.gw === g)?.moves || []).some((x) => x.ok);
    const vs = rolls ? `vs ${rolling(P, g, vr?.ev ?? without)}` : "vs without it";
    const sub2 = shares ? COPY.whyOneOf(g, w.moves.length) : whySub(g, c.delta, `over ${span(P.gws.filter((x) => x >= g))}${label ? ` ${label}` : ""} ${vs}`);
    const others = P.weeks.some((x) => x.moves.some((y) => !(x.gw === g && y.out === m.out && y.in === m.in)));
    const moved = vr && !shares && !lead && Math.abs(own.delta - shownDelta(vr)) >= 0.05 ? h("span.wy-tot", null, COPY.totalMoved(own.delta, others)) : null;
    return ctx.openSheet("why", {
      a: { road: roadOfEv(vr ? vr.mine : withIt, g), label: `${nm(m.out)} \u2192 ${nm(m.in)}` },
      b: { road: vr ? roadOfEv(vr.ev, g) : roadOfEv(without, g), label: vr ? `Roll GW${g}` : `Keeping ${nm(m.out)}`, short: rolls ? "Rolling" : `Keeping ${nm(m.out)}` },
      title: movesTitle2(P, g, [m]),
      sub: moved ? [...[sub2].flat(), moved] : sub2,
      gw: g,
      // the two players side by side, the one bought first (owner, 2026-10-14), each with the price the move pays and
      // gets
      pairs: pairs ?? [pairOf(withIt, g, m)],
      // a header against rolling (vr): the facts' ", not X" (the move's own number, `own`) names its baseline (owner,
      // 2026-10-22: one baseline per sheet); its facts' numbers are set on the header's, against rolling (onBase)
      facts: lead ?? whyFacts(ctx, P, g, m, withIt, without, shares ? { yours: true } : { drafts, c: own, yours: true, head: vr ? shownDelta(vr) : null }),
      // the same move in each GW (whenOf); a tapped week is chosen, the button under the line moves your transfer there
      // (moveTo: toast and Undo), the sheet closes
      when: whenSheet(P, g, m, vr ? { head: shownDelta(vr), vs } : null, shares),
      acts: [...whyActs(P, g, m, c) ?? [], ...placeAct(m.in, g)],
      // presolved taps: its buttons', then your transfer moved to each other week of the When line
      presolve: frozenAt(P, g) ? null : [...whyTaps(P, g, m), ...pinOfMove(P, { ...m, gw: g }) ? P.gws.filter((x) => x !== g).map((x) => ({ kind: "move", gw: g, run: () => moveTo(ctx, { ...m, gw: g }, x) })) : []]
    });
  }
  const deckOf = (id, g) => {
    const { S } = V;
    return S.decks?.gw === g ? S.decks.find((x) => x.a === Number(id)) ?? null : null;
  };
  const placeLink = (id, g) => {
    const { openPlace } = V;
    const d = deckOf(id, g);
    return d ? { n: d.entries.length, open: () => whenFree(() => openPlace(d.a)) } : null;
  };
  const whenFree = (fn, n = 40) => {
    const { pitchHost } = V;
    return pitchHost.closest("[inert]") && n > 0 ? setTimeout(() => whenFree(fn, n - 1), 25) : fn();
  };
  const placeAct = (id, g) => {
    const { S, openPlace } = V;
    return deckOf(id, g) ? [{ label: COPY.placeInstead, link: true, act: () => {
      S.week?.sheet.close();
      setTimeout(() => whenFree(() => openPlace(Number(id))), 0);
    } }] : [];
  };
  function whyTaps(P, g, m) {
    const { ctx } = V;
    const mv = { out: m.out, in: m.in, gw: g };
    return [
      ...pinOfMove(P, mv) ? [{ kind: "remove", gw: g, run: () => removeMove(ctx, mv) }] : [],
      { kind: "keep", gw: g, run: () => keep(ctx, m.out, { gw: g, scope: "gw" }) },
      { kind: "veto", gw: g, run: () => veto(ctx, mv) }
    ];
  }
  function whyActs(P, g, m, c) {
    const { ctx, frozenAt } = V;
    if (frozenAt(P, g)) return null;
    const nm = P.L.name;
    const mv = { out: m.out, in: m.in, gw: g };
    const mine = !!pinOfMove(P, mv);
    const off = clearGain({ delta: -c.delta, label: c.label });
    return [
      { label: `Keep ${nm(m.out)} \xB7 GW${g}`, act: () => keep(ctx, m.out, { gw: g, scope: "gw" }), fill: !mine && off },
      mine && P.editable ? { label: "Remove", act: () => removeMove(ctx, mv), fill: off, danger: true } : null,
      notAct(P, g, m)
    ].filter(Boolean);
  }
  const notOf = (P, m) => `Not ${P.L.name(m.in)} \xB7 GW${m.gw}`;
  const vetoBack = (P, m) => h("div.ah-veto", { "aria-hidden": "true" }, h("span", null, notOf(P, m)));
  function notAct(P, g, m) {
    const { vetoFromWhy } = V;
    const mv = { out: m.out, in: m.in, gw: g };
    return { label: notOf(P, mv), act: () => vetoFromWhy(mv), danger: true };
  }
  function whenSheet(P, g, m, on = null, bare = false) {
    const { ctx, setGw } = V;
    const weeks = whenOnBase(whenOf(ctx, P, { gw: g, out: m.out, in: m.in }), on?.head)?.map((x) => bare ? { ...x, delta: null, label: null } : x);
    if (!weeks || weeks.length < 2) return null;
    const pick = (x) => {
      const ok = moveTo(ctx, { gw: g, out: m.out, in: m.in }, x);
      if (ok) setGw(x);
      return ok;
    };
    return { weeks, pick, disabled: !P.editable, vs: bare ? null : COPY.whenVs(on?.vs ?? COPY.vsKeeping(P.L.name(m.out)), P.gws) };
  }
  const gainOf = (cmp, ap = false) => h("span.ah-bg.m-num", { class: { "m-pending": ap } }, xpGain(shownDelta(cmp), "span", null, true));
  const whySub = (g, d, rest) => [`GW${g} \xB7 `, xpGain(d), h("span.sr-only", null, " points"), ` ${rest}`];
  const numOf = (wait, cmp, ap) => {
    const { waitClock } = V;
    return wait ? h("span.ah-bq2", { "aria-hidden": "true" }, waitClock("", { late: true, pre: " \xB7 \u2026", sep: " \xB7 " }) ?? [" \xB7 ", COPY.waitShort]) : cmp ? gainOf(cmp, ap) : null;
  };
  const numSaid = (wait, cmp, ap, vs = false) => wait ? COPY.waitShort : cmp ? `${ap ? "about " : ""}${fmt.signed(shownDelta(cmp))} points${vs ? ` vs ${vs === true ? COPY.planVsRoll : vs}` : ""}` : "";
  const plNumSaid = (P, pl) => numSaid(false, pl.cmp, false, pl.vsRoll && choiceVs(P, pl));
  const hitTag = (n) => n ? h("small.ah-hit.m-hit.m-num", { "aria-hidden": "true" }, `${MINUS}${HIT_COST * n}`) : null;
  const hitSaid = (n) => n ? `, a ${MINUS}${HIT_COST * n} hit included` : "";
  const plansVs = (P, g) => {
    const { ctx } = V;
    const L = plansOf(ctx, P, g);
    return L.ref ? yoursAt(weekOf(P, g)) ? COPY.planVs(true) : COPY.planVsRoll : L.refWait ? null : COPY.planVs(mineAny(P));
  };
  const whyPart = (label, why, row) => ({
    role: "button",
    tabindex: "0",
    "aria-haspopup": "dialog",
    "aria-label": label,
    dataset: { row },
    onKeydown: (e) => {
      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        why();
      }
    }
  });
  function rowTies(P, w, m, i) {
    const { ctx } = V;
    const g = w.gw, nm = P.L.name, rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const f = fundingOf(P, g, m);
    const funding = f && f.fund.move.out === m.out && f.fund.move.in === m.in;
    const funders = f && !funding ? w.moves.filter((x) => {
      const fx = fundingOf(P, g, x);
      return fx?.main.move.in === m.in && fx.fund.move.out === x.out && fx.fund.move.in === x.in;
    }) : [];
    return dotted([
      i === 0 ? bankWarn(P, w) : null,
      funding ? COPY.funds(fmt.money(freedBy(rg?.withIt, g, m)), nm(f.main.move.in)) : null,
      funders.length ? COPY.fundedBy(funders.map((x) => `${nm(x.out)} \u2192 ${nm(x.in)}`)) : null
    ]);
  }
  return { drawWeek, clashRow, noteRow, forecastLine, waitSig, waitWatch, keepNight, sayNight, sayCarried, barNode, dotted, bsep, textOf, bankWarn, bankLead, weekLead, roadOfEv, movesTitle: movesTitle2, openWhy, deckOf, placeLink, whenFree, placeAct, whyTaps, whyActs, notOf, vetoBack, notAct, whenSheet, gainOf, whySub, numOf, numSaid, plNumSaid, hitTag, hitSaid, plansVs, whyPart, rowTies };
}

// js/m/ahead/screen-rows.js
function rowsPart(V) {
  const moveX = (P, m, g, forkcast) => {
    const { ctx } = V;
    return h("button.ah-x", {
      type: "button",
      "aria-label": forkcast ? COPY.keepIn(P.L.name(m.out), g) : COPY.placeRemoveSaid(P.L.name(m.out), P.L.name(m.in)),
      onClick: (e) => {
        e.stopPropagation();
        removeMove(ctx, { ...m, gw: g });
      }
    }, glyph("x"));
  };
  function xferRow(P, w, m, i) {
    const { S, ap0, ctx, frozenAt, hitSaid, hitTag, numOf, numSaid, openWhy, rowTies, textOf, vetoBack, whyPart, wireMoveRow } = V;
    const g = w.gw, nm = P.L.name;
    const ap = ap0(P, g);
    const gone = removedAt(P, g).has(`${m.out}>${m.in}`) && !pinOfMove(P, { ...m, gw: g });
    const shares = shareWeek(w);
    const vr = rollOf(P, w), n = moveNum(P, w, m), wait = !shares && n.wait;
    const rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const head = shares ? null : n.cmp ?? { delta: 0, label: "coin" };
    const ties = rowTies(P, w, m, i);
    const sub2 = ties.length ? ties : null;
    const learnRow = i === 0 && !sub2 && !gone && P.editable && !frozenAt(P, g) && !S.learnt.has("row");
    const hit = !vr && rg?.hit ? rg.hit : 0;
    const canX = !frozenAt(P, g) && P.editable && !gone;
    const forkcast = canX && !pinOfMove(P, { ...m, gw: g });
    const what = `${nm(m.out)} to ${nm(m.in)}`;
    const label = `${what}${head || wait ? `, ${numSaid(wait, head, ap, !!vr)}` : ""}${hitSaid(hit)}${forkcast ? ", Forkcast's move" : ""}${sub2 ? `. ${textOf(sub2)}` : ""}; shows why`;
    const why = () => openWhy(P, g, m);
    const main = [
      h("span.ah-bn", null, h("s", null, `${nm(m.out)} \u2192 `), h("b", null, nm(m.in))),
      hitTag(hit),
      numOf(wait, head, ap),
      forkcast ? h("small.ah-bk", { "aria-hidden": "true" }, "by Forkcast") : null
    ];
    const fg = h(
      "div.ah-fg.ah-btgt",
      { onClick: why },
      h("span.ah-bt", whyPart(label, why, `x${g}:${m.out}>${m.in}`), main),
      sub2 ? h("span.ah-bs", { "aria-hidden": "true" }, sub2) : learnRow ? h("span.ah-bs.ah-learn", { "aria-hidden": "true" }, COPY.hintRow(nm(m.in))) : null,
      canX ? moveX(P, m, g, forkcast) : null
    );
    const tint = !!S.tint?.some((x) => Number(x.out) === Number(m.out) && Number(x.in) === Number(m.in));
    const row = h("div.ah-mrow", { class: { "m-shimmer": tint, once: tint }, dataset: { out: m.out, in: m.in, gw: g } }, vetoBack(P, { in: m.in, gw: g }), fg);
    if (P.editable && !frozenAt(P, g)) wireMoveRow(row, fg, { ...m, gw: g });
    return row;
  }
  const factSpans = (facts, next = false) => facts.map(([t], i) => next && i && i === facts.length - 1 ? h("span.ah-fnext", null, " \xB7 ", h("span.ah-fact", null, t)) : [i ? " \xB7 " : null, h("span.ah-fact", null, itbNode(t))]);
  const itbNode = (t) => typeof t === "string" && t.endsWith(COPY.itb("")) ? [t.slice(0, -COPY.itb("").length), h("span.ah-itb", null, COPY.itb(""))] : t;
  function rollFacts(P, w, { bar = false } = {}) {
    const { ap0, bankWarn, ctx, textOf } = V;
    const g = w.gw;
    const ink = inkAt(ctx, P, g), hold = !!P.mem?.hold;
    const all = weekFacts(P, w), next = g < P.end, facts = bar && next ? all.slice(0, -1) : all, bank = bankWarn(P, w);
    const stale = !hold && P.healing && P.approx.has(g) && !ap0(P, g);
    return {
      head: emptyHead(g, { ink, hold, off: gwMode(P, g) === "roll" || stale, lock: rollingAt(P, g) }),
      rest: [factSpans(facts, next && !bar), bank ? [" \xB7 ", bank] : null],
      // read out with FPL's codes in full ("1 free transfer, £0.5 million in the bank, 2 free transfers in gameweek 7")
      said: [...facts.map(([, s]) => s), bank && textOf(bank)].filter(Boolean).join(", ")
    };
  }
  const door = (P, cls, row, text, label, onClick) => h(`button.ah-lnk.ah-door${cls}`, { type: "button", disabled: !P.editable, "aria-haspopup": "dialog", "aria-label": label, dataset: { row }, onClick }, text);
  const openChips = (g) => {
    const { ctx, learn } = V;
    learn("chips");
    ctx.askChips?.(g);
    ctx.openSheet("chips", { gw: g });
  };
  const chipsDoor = (P, g) => door(P, ".ah-chips", "chips", COPY.chipsDoor, COPY.chipsSaid(g, weekOf(P, g)?.chip ?? null), () => openChips(g));
  const bringDoor = (P, g) => {
    const { ctx } = V;
    return door(P, ".ah-bring", "bring", COPY.bringInShort, `${COPY.bringInSheet} in GW${g}`, () => ctx.openSheet("wish", null, { gw: g }));
  };
  const doorStubs = () => [h("span.ah-lnk.ah-door.ah-bring", { "aria-hidden": "true" }, COPY.bringInShort), h("span.ah-lnk.ah-door.ah-chips", { "aria-hidden": "true" }, COPY.chipsDoor)];
  function changeRow(P, w, m, read = false) {
    const { frozenAt, vetoBack, wireMoveRow } = V;
    const nm = P.L.name, g = w.gw;
    const can = !read && !frozenAt(P, g) && P.editable;
    const forkcast = can && !pinOfMove(P, { ...m, gw: g });
    const fg = h(
      "div.ah-fg",
      null,
      h("span.mk", { "aria-hidden": "true" }, shirtOf(P.L, m.in, 28)),
      h("span.mt", null, m.kept ? [h("span.a", null, nm(m.in)), h("span.b", null, COPY.keptRule)] : [h("span.a", null, h("s", null, `${nm(m.out)} \u2192 `), nm(m.in)), h("span.b.m-num", null, `${priceOf(P, m.out)} \u2192 ${priceOf(P, m.in)}`)]),
      can ? moveX(P, m, g, forkcast) : null
    );
    const row = h("div.ah-mrow.sq", { class: { kept: !!m.kept }, dataset: { ...m.kept ? {} : { out: m.out }, in: m.in, gw: g } }, can ? vetoBack(P, { in: m.in, gw: g }) : null, fg);
    if (can) wireMoveRow(row, fg, { ...m, gw: g });
    return row;
  }
  const priceOf = (P, id) => {
    const x = P.L.price(id);
    return `${P.L.club(id) ?? ""} ${x == null ? "" : fmt.money(x)}`.trim();
  };
  const addOnce = (e, act, moves = []) => {
    const { ADD_HOLD_MS, S } = V;
    e.stopPropagation();
    if (S.addAt && S.flowAt >= S.addAt && Date.now() - S.flowAt < ADD_HOLD_MS && !e.target?.closest?.(".ah-place")) return;
    S.addAt = Date.now();
    if (act()) S.tint = moves;
  };
  const litPays = (pl, M = V.S.M) => !!pl && !!M?.shown.has(pl);
  const planKey = (g, pl) => `${g}:${pl.choice.moves.map((m) => `${m.out}>${m.in}`).join(",")}|${JSON.stringify(pl.choice.chips)}`;
  function planSaid(P, g, pl) {
    const { plansVs } = V;
    const { now, adds, back } = planBack(P, g, pl);
    const base = planWeeks(P, { ...pl.choice, moves: adds, hits: pl.hits }, g).find(([x]) => x === g)?.[1] ?? (now.length ? `GW${g}` : COPY.planRoll(g));
    const head = back ? `${base} ${back}` : base;
    const wait = pl.state === "ready" ? null : pl.state === "failed" ? failedWords(P, pl).row : { flight: COPY.waitShort, heal: COPY.pairAfterEdit }[pl.wait] ?? COPY.pairWaiting;
    const who = pl.removed ? `${head}, ${COPY.removedByYou}` : head;
    const label = wait ? `${who}: ${wait}` : pl.refRow ? `${who}, ${COPY.planRefSaid}` : `${who}, ${fmt.signed(shownDelta(pl.cmp))} points over ${span(P.gws.filter((x) => x >= g))} vs ${pl.vsRoll ? choiceVs(P, pl) : plansVs(P, g)}`;
    return { head, label, wait, pays: !wait && plPays(pl) };
  }
  const takePlan = (P, g, pl, then = null) => {
    const { ctx } = V;
    return (e) => addOnce(e, () => {
      const ok = addPlan(ctx, g, pl);
      if (ok) then?.();
      return ok;
    }, planTake(P, g, pl).own);
  };
  function planRow(P, g, pl, { shared = null, closes = false, lit = null, best = null } = {}) {
    const { S, ctx, frozenAt, gainOf, hitTag, whyPart } = V;
    const nm = P.L.name;
    const key = planKey(g, pl);
    const { chipNow, now, adds, back } = planBack(P, g, pl);
    const s = planSaid(P, g, pl);
    const own = back && back !== shared ? back : "";
    const shown = planWeeks(P, { ...pl.choice, moves: adds, hits: pl.hits }, g, false).find(([x]) => x === g)?.[1] ?? (now.length ? "" : COPY.planRoll(null));
    const tail = !own ? null : shown || adds.length ? ` ${own}` : capFirst(own);
    const line = [
      adds.length ? adds.flatMap((m, i) => [i ? ", " : null, h("span.ah-pmv", null, h("s", null, `${nm(m.out)} \u2192 `), nm(m.in))]) : shown,
      tail ? h("span.ah-bq2", null, tail) : null,
      pl.removed ? h("span.ah-bq2", null, " \xB7 ", COPY.removedByYou) : null
    ];
    const word = COPY.takeWord(adds.length, !adds.length && !!pl.choice?.chips?.[g]);
    if (s.wait) {
      const off = h("button.ah-add.m-swap.quiet", { type: "button", disabled: true, tabindex: "-1", "aria-hidden": "true" }, word);
      return h(
        "div.ah-brow.ah-bpair.ah-bplan.solving",
        { role: "status", dataset: { row: "plan", plan: key }, "aria-label": s.label },
        h("span.ah-bt", { "aria-hidden": "true" }, h("span.ah-bn", null, line, h("span.ah-bq2", null, " \xB7 ", s.wait))),
        off
      );
    }
    const hit = chipNow ? null : hitTag(pl.hits[g]);
    const pays = lit ?? litPays(pl);
    const why = () => openPlanWhy(P, g, pl, pays);
    const moved = adds.length && !pl.refRow ? cardGain(ctx, P, g, pl) : null;
    const gain = pl.refRow ? gainOf({ delta: 0 }) : !adds.length ? gainOf(pl.cmp) : moved == null ? h("span.ah-bq2", null, COPY.waitShort) : gainOf({ delta: moved });
    const top1 = best ?? S.M?.lit?.move === pl;
    const add = rollOnly(pl) ? null : h("button.ah-add.m-swap", {
      type: "button",
      disabled: frozenAt(P, g),
      dataset: { add: `plan:${key}` },
      class: { best: top1, quiet: !top1 },
      "aria-label": COPY.planTake(s.head),
      onClick: takePlan(P, g, pl, closes ? () => S.week?.sheet.close() : null)
    }, word);
    return h(
      "div.ah-brow.ah-bpair.ah-bplan.ah-btgt",
      { dataset: { gw: g, plan: key }, onClick: why },
      h("span.ah-bt", whyPart(`${s.label}; shows why`, why, `plan:${key}`), h("span.ah-bn", null, line), hit, gain),
      add
    );
  }
  function openPlanWhy(P, g, pl, lit = litPays(pl)) {
    const { S, ctx, frozenAt, movesTitle: movesTitle2, notAct, roadOfEv, whySub } = V;
    if (!WHY_SHEET) {
      const m = pl.choice.moves.find((x) => x.gw === g);
      return m ? ctx.openSheet("player", Number(m.in), { gw: g }) : V.weekSheet(g);
    }
    const nm = P.L.name;
    const without = planBaseline(ctx, P, g);
    const gws = P.gws.filter((x) => x >= g);
    const moved = (x) => SQUAD_CHIPS.has(x.chips?.[g]) ? [] : x.moves.filter((m) => m.gw === g);
    const titleOf = (x) => planWeeks(P, { ...x, moves: moved(x), hits: {} }, g, false).find(([y]) => y === g)?.[1] ?? COPY.planRoll(null);
    const now = moved(pl);
    const best = pl.refRow && pl.vsBest ? pl.best : null;
    const mine = pl.vsMine && pl.vsMine !== pl.alone && !pl.refRow ? plansOf(ctx, P, g).mine : null;
    const [ev, other, cmp, vs, short] = best ? [pl.bestFrom ?? pl.fullEv, best.fullEv, pl.vsBest, titleOf(best), titleOf(best)] : mine ? [pl.fullEv, mine.ev, pl.cmp, COPY.planVs(true), COPY.planVs(true)] : pl.vsRoll && !pl.refRow && !pl.vsMine ? [pl.fullEv, pl.refEv, pl.cmp, COPY.planVsRoll, COPY.planRoll(null)] : [pl.ev, without, pl.alone ?? pl.cmp, COPY.planVs(!!pl.vsMine || mineAny(P)), COPY.planVs(!!pl.vsMine || mineAny(P))];
    const d0 = draftOf(ctx);
    const onHead = best || mine || pl.vsRoll && !pl.refRow && !pl.vsMine ? shownDelta(cmp) : null;
    const sqChip = SQUAD_CHIPS.has(pl.chips?.[g]) ? pl.chips[g] : null;
    const rw = (pl.road?.weeks || []).find((x) => Number(x.gw) === g), clubs = clubCounts(P.L, rw ? ids([...rw.xi || [], ...rw.bench || []]) : []);
    const { adds: added, back: undone, taken } = SQUAD_CHIPS.has(pl.chips?.[g]) ? { adds: [], back: "", taken: [] } : planBack(P, g, pl);
    const several = added.length > 1 || !!undone && added.length > 0;
    const room = added.length < 2 ? [] : added.flatMap((m) => {
      const club = P.L.club(m.in), by = added.find((o) => o !== m && P.L.club(o.out) === club);
      return club && by && clubs.get(club) === MAX_PER_CLUB ? [COPY.planRoom(nm(by.out), nm(m.in), MAX_PER_CLUB, club)] : [];
    });
    const facts = [.../* @__PURE__ */ new Set([
      ...now.flatMap((m) => whyFacts(ctx, P, g, m, pl.ev, without, { drafts: [pl.taken ?? pl.draft, d0], head: onHead })),
      ...sqChip ? [COPY.chipUses(chipName(sqChip), chipBack(P, g))] : [],
      ...pl.alone && !pl.rolls && Math.abs(pl.alone.delta - shownDelta(cmp)) >= 0.05 ? [COPY.planAdds(pl.alone.delta)] : [],
      ...pl.rolls ? [COPY.rollAlready(g)] : [],
      ...rollFt(P, g, pl)
    ])];
    const head = planWeeks(P, { ...pl, moves: now }, g).find(([x]) => x === g)?.[1] ?? COPY.planRoll(g);
    const title = several ? `${added.map((m) => `${nm(m.out)} \u2192 ${nm(m.in)}`.replace(/ /g, "\xA0")).join(", ")}${undone ? ` ${undone}` : ""}` : titleOf(pl);
    const later = countedAfter(P, g, best ? [[COPY.countedRoll, ev], [short, other]] : pl.vsRoll && !pl.refRow && !pl.vsMine ? [[COPY.countedRoll, other], [title, ev]] : [[short[0].toUpperCase() + short.slice(1), other], [title, ev]]);
    const sq = SQUAD_CHIPS.has(pl.chips?.[g]) ? squadChanges(P, g, pl.ev, takenKeep(P, g, pl)) : [];
    const swapLook = S.M?.lit?.move === pl ? "best" : lit ? "pays" : "quiet";
    ctx.openSheet("why", {
      a: { road: roadOfEv(ev, g), label: title },
      b: { road: roadOfEv(other, g), label: short, short },
      // its players each a link to his card where the title names its moves (movesTitle)
      title: several ? movesTitle2(P, g, added, { nb: true, tail: undone }) : now.length === 1 && title === `${nm(now[0].out)} \u2192 ${nm(now[0].in)}` ? movesTitle2(P, g, now) : title,
      sub: whySub(g, shownDelta(cmp), `over ${span(gws)} vs ${vs}`),
      gw: g,
      reason: room.join(". ") || null,
      // each GW-g move's two players: a move in place of your buy of the same seller (planBack's `taken`), its buy
      // against YOURS it replaces, each at his buy price (sheets/why.js `yours`; the seller leaves in both plans, so
      // his column answered nothing); any other, its buy against its sale
      pairs: now.map((m) => {
        const t = taken.find((y) => Number(y.out) === Number(m.out) && Number(y.in) !== Number(m.in));
        return t ? { ...pairOf(pl.ev, g, m), out: t.in, sell: pairOf(without, g, t).buy, yours: true } : pairOf(pl.ev, g, m);
      }),
      facts,
      later,
      changes: sq.length ? { head: COPY.nChanges(sq.filter((m) => !m.kept).length), rows: sq.map((m) => changeRow(P, { gw: g }, m, true)) } : null,
      // a choice of several moves: its one take named for what it does, "Swap both", and nothing else (the sheet says
      // why; its "Not …" vetoes are each player's own sheet's). Its take the one mark, worded as its row's and its
      // place's ("Swap", "Swap both", "Roll"); ink the week's best, green where it pays, outlined where not (owner,
      // 2026-10-28)
      acts: frozenAt(P, g) ? null : several ? [{ label: COPY.swapGo(added.length), said: COPY.planTake(head), fill: lit, swap: swapLook, act: () => addPlan(ctx, g, pl) }] : [...rollOnly(pl) ? [] : [{ label: COPY.takeWord(now.length, !now.length && !!pl.chips?.[g]), said: COPY.planTake(head), fill: lit, swap: swapLook, act: () => addPlan(ctx, g, pl) }], ...now.map((m) => notAct(P, g, m))],
      presolve: frozenAt(P, g) ? null : [...rollOnly(pl) ? [] : [{ kind: "take", gw: g, run: () => addPlan(ctx, g, pl) }], ...several ? [] : now.map((m) => ({ kind: "veto", gw: g, run: () => veto(ctx, { ...m, gw: g }) }))]
    });
  }
  const ftAfter = (P, w) => weekOf(P, w.gw + 1)?.ft ?? nextFt(w.ft ?? 1, 0, ftGrant(P.season, w.gw + 1));
  const weekRoll = (P, w) => {
    const { ctx } = V;
    return weekRollOf(ctx, P, w);
  };
  const rollOf = (P, w) => w.moves.length === 1 && !squadWeek(w) ? weekRoll(P, w) : null;
  const shareWeek = (w) => w.moves.length > 1 && !squadWeek(w);
  const moveGain = (P, w, m) => {
    const { ctx } = V;
    return m ? rollOf(P, w) ?? rowGains(ctx, P, w).get(`${m.out}>${m.in}`)?.cmp ?? null : null;
  };
  const moveNum = (P, w, m) => {
    const { ap0 } = V;
    const vr = rollOf(P, w);
    return { cmp: moveGain(P, w, m), wait: !vr && rollPending(P, w), ap: ap0(P, w.gw) };
  };
  const weekPending = (P, w) => {
    const { ap0, ctx } = V;
    return !!w.moves.length && !ap0(P, w.gw) && !!plansOf(ctx, P, w.gw).pending;
  };
  const rollPending = (P, w) => w.moves.length === 1 && !squadWeek(w) && weekPending(P, w);
  const rolling = (P, g, ev) => !ev?.gws.some((x) => x.gw > g && x.moves.some((y) => y.ok)) ? "rolling, no later transfer" : "rolling";
  const whyMove = (P, w, id) => !WHY_SHEET || !w || squadWeek(w) ? null : w.moves.find((m) => Number(m.in) === Number(id)) ?? null;
  const tapIn = (g, id) => {
    const { ctx, gwNow, openWhy, placeLink, setGw } = V;
    const Q = plan(ctx);
    if (Q && gwNow(Q) !== g && Q.gws.includes(g)) {
      setGw(g);
      return Promise.resolve().then(() => tapIn(g, id));
    }
    const m = Q && whyMove(Q, weekOf(Q, g), id);
    return closedOf(m ? openWhy(Q, g, m) : ctx.openSheet("player", id, { gw: g, place: placeLink(id, g) }));
  };
  return { moveX, xferRow, factSpans, itbNode, rollFacts, door, openChips, chipsDoor, bringDoor, doorStubs, changeRow, priceOf, addOnce, litPays, planKey, planSaid, takePlan, planRow, openPlanWhy, ftAfter, weekRoll, rollOf, shareWeek, moveGain, moveNum, weekPending, rollPending, rolling, whyMove, tapIn };
}

// js/m/ahead/screen-pitch.js
function pitchPart(V) {
  function paintChoosing(P, w) {
    const { ctx, pitchHost } = V;
    const who = choosing(ctx, P, w.gw), can = new Set(who ? replaceable(ctx, who.id, w.gw).map((x) => x.out) : []);
    pitchHost.classList.toggle("ah-choosing", !!who);
    for (const c of pitchHost.querySelectorAll(".pm-card[data-id]")) {
      const id = Number(c.dataset.id);
      c.classList.toggle("ah-can", can.has(id));
      c.classList.toggle("ah-cant", !!who && !can.has(id));
    }
  }
  function paintBoard(P, w, after) {
    const { S, pitchHost } = V;
    if (S.place) return;
    const key = after ? JSON.stringify([w.gw, after.xi, after.bench, after.captain, after.vice]) : null;
    if (key === (S.board?.key ?? null) && (!key || S.board.pitch === S.pitch)) return;
    if (S.board?.key) {
      S.pitch = null;
      renderPitch(P, w);
      paintChoosing(P, w);
    }
    S.board = { key, pitch: S.pitch };
    if (!after) return;
    const nm = P.L.name, marks = boardMarks(w, after, P.L.pos);
    mountHere({ ...pitchProps(P, w), xi: after.xi, bench: after.bench, captain: after.captain, vice: after.vice });
    const marked = marks.map((m) => ({ ...m, c: pitchHost.querySelector(`.pm-card[data-id="${m.id}"]`) })).filter((m) => m.c);
    for (const { place, id, sold, kind, c } of marked) {
      if (kind === "in") {
        c.querySelector(".pm-pf")?.remove();
        c.querySelector(".pm-pn").after(h("span.pm-pf.sb-off", { "aria-hidden": "true" }, h("span.pm-fx", null, nm(sold))));
      }
      c.classList.add("sb-card", `sb-${kind}`);
      c.setAttribute("aria-label", kind === "down" ? COPY.boardBench(nm(id)) : COPY.boardSaid(nm(id), nm(sold ?? place)));
      c.dataset.id = place;
    }
    for (const [k, was, now] of [["c", w.captain, after.captain], ["v", w.vice, after.vice]]) {
      if (was !== now) pitchHost.querySelector(`.pm-badge[data-badge="${k}"]`)?.classList.add("sb-arm");
    }
  }
  function pitchProps(P, w, plate = plateOf()) {
    const { armbandSheet, ctx, subSheet, tapIn, whyMove } = V;
    const d = ctx.data;
    return {
      xi: w.xi,
      bench: w.bench,
      captain: w.captain,
      vice: w.vice,
      chip: w.chip,
      players: d.byId,
      gw: w.gw,
      horizon: d.xpGws,
      first: w.gw === P.A,
      bought: boughtIn(P, w.gw),
      inFor: inFor(P, w),
      second: plate.second,
      approx: w.approx,
      why: w.moves.filter((m) => whyMove(P, w, m.in)).map((m) => Number(m.in)),
      benchRow: true,
      gapRows: true,
      label: `Your plan at GW${w.gw}`,
      // GW A's differences from your FPL team marked (pitch.js fplMarks); a later GW has no FPL team to set it against
      // (fplOf). d's own, so S.pitch.data keys it
      fpl: fplOf(ctx, P, w),
      // a tap on the C or the V: the armband's list (armbandSheet); on a player the week buys (tagged IN), his
      // transfer's Why sheet; anywhere else on a card, his sheet (tapIn). The plan as it is at the tap: a pitch drawn
      // the same is not mounted again (renderPitch)
      onPlayer: (id, e) => {
        if (choosing(ctx, plan(ctx), w.gw)) {
          replaceWith(ctx, id);
          return;
        }
        const b = e?.target?.closest?.('.pm-badge[data-badge="c"], .pm-badge[data-badge="v"]');
        if (b) {
          armbandSheet(b.dataset.badge, w.gw);
          return;
        }
        tapIn(w.gw, id);
      },
      // a tap on a sub's label on the bench ("1", his order; the keeper's none: m-ahead.css .pm-blp): the starters he can replace (subSheet)
      onBench: (id) => {
        if (choosing(ctx, plan(ctx), w.gw)) replaceWith(ctx, id);
        else subSheet(id, w.gw);
      }
    };
  }
  function renderPitch(P, w) {
    const { S, ctx, pitchHost, rsBtn } = V;
    const d = ctx.data;
    const lu = !!w.lineup, mine = planHasYours(P) || P.gws.some((g) => g !== w.gw && (showingAt(P, g) || tappedSuggestion(P, g)));
    S.reset = lu || mine ? { lu, plan: mine, gw: w.gw } : null;
    rsBtn.hidden = !S.reset;
    rsBtn.disabled = !P.editable;
    rsBtn.classList.toggle("lu", lu);
    rsBtn.classList.toggle("rp", mine);
    if (S.reset) {
      const both = lu && mine;
      fill(rsBtn, h("span.ah-pdl", null, both ? "Reset" : lu ? "Reset lineup" : COPY.resetAll), both ? h("span.ah-chev", { "aria-hidden": "true" }) : null);
      rsBtn.setAttribute("aria-label", both ? COPY.resetSaid(w.gw) : lu ? `Reset GW${w.gw} lineup to the plan's best` : COPY.planResetSaid);
      if (both) rsBtn.setAttribute("aria-haspopup", "dialog");
      else rsBtn.removeAttribute("aria-haspopup");
    }
    const plate = plateOf();
    const props = pitchProps(P, w, plate);
    const key = JSON.stringify([...["xi", "bench", "captain", "vice", "gw", "first", "bought", "inFor", "why", "approx"].map((k) => props[k] ?? null), plate.key]);
    const same = S.pitch?.key === key && S.pitch.data === d && pitchHost.isConnected && pitchHost.firstChild;
    if (same && S.pitch.chip === (props.chip ?? null)) return;
    if (same && ctx.pitch.setPitchChip(pitchHost, props.chip)) {
      S.pitch.chip = props.chip ?? null;
      return;
    }
    S.pitch = { key, data: d, chip: props.chip ?? null };
    mountHere(props);
  }
  function mountHere(props) {
    const { S, cardBoxes, cardIn, chipsHint, closePlace, ctx, decks, pdBtn, pitchHost, settle } = V;
    const pill = pdBtn === document.activeElement ? pdBtn : null;
    const inPlace = S.place && pitchHost.querySelector(":scope > .pm > .ah-place")?.contains(document.activeElement) ? S.place.a : null;
    closePlace(false);
    const old = pitchHost.querySelector(":scope > .pm");
    S.snap = old ? new Map(cardBoxes(old).map((c) => [c.id, { rect: c.n.getBoundingClientRect(), node: c.n.cloneNode(true) }])) : null;
    ctx.pitch.mountPitch(pitchHost, props);
    if (inPlace) cardIn(pitchHost.querySelector(":scope > .pm"), inPlace)?.focus({ preventScroll: true });
    pitchHost.querySelector(":scope > .pm")?.prepend(pdBtn, decks);
    if (pill) (pill.hidden ? pdBtn : pill).focus({ preventScroll: true });
    pitchHost.querySelector(":scope > .pm > .pm-field")?.append(chipsHint);
    if (S.slide != null) {
      settle(S.slide);
      S.slide = null;
    }
  }
  function placeHint(P = V.S.hintAt?.P, w = V.S.hintAt?.w) {
    const { HINTS, S, pitchHost } = V;
    S.hintAt = { P, w };
    for (const [n, k] of HINTS) {
      n.hidden = CHIPS_OFF || !P?.editable || !w || S.learnt.has(k) || !chipsAvail(P, w.gw).some((c) => c === "bb" || c === "tc");
      if (n.hidden || !n.isConnected) continue;
      if (n.scrollWidth > n.clientWidth + 1) {
        n.hidden = true;
        continue;
      }
      const hits = () => {
        const r = n.getBoundingClientRect();
        const meets = (b) => b.left < r.right && r.left < b.right && b.top < r.bottom && r.top < b.bottom;
        return [...pitchHost.querySelectorAll(".pm-pl, .pm-bs, .ah-pp:not([hidden]), .ah-sp, .ah-tok")].map((x) => [x, x.getBoundingClientRect()]).filter(([, b]) => meets(b));
      };
      n.style.removeProperty("--ph-lift");
      let over = hits();
      if (k === "chips" && over.length && over.every(([x]) => x.matches(".ah-sp"))) {
        const top = Math.min(...over.map(([, b]) => b.top));
        n.style.setProperty("--ph-lift", `${Math.ceil(n.getBoundingClientRect().bottom - top + 4)}px`);
        over = hits();
      }
      if (over.length) n.hidden = true;
    }
  }
  const frozenAt = (P, g) => {
    const { ctx } = V;
    return !P.editable || inkAt(ctx, P, g);
  };
  const tabAt = (x, g) => ({ style: { order: -x, "--d": Math.abs(x - g) }, down: x < g, sel: x === g });
  function renderRail(P, g) {
    const { rail, setGw, ticks, totalEl } = V;
    const past = edgeTicks(P);
    rail.style.setProperty("--n", P.weeks.length + past.length);
    rail.style.setProperty("--i", Math.max(0, P.weeks.findIndex((w) => w.gw === g)));
    const win = P.b?.meta?.dgw_bgw?.window;
    const had = ticks.contains(document.activeElement);
    fill(
      ticks,
      P.weeks.map((w) => {
        const sq = squadWeek(w);
        const n = w.moves.length;
        const change = sq || !n ? "" : n === 1 ? P.L.name(w.moves[0].in) : `${n} in`;
        const shown = fmt.num(w.points);
        const flags = gwFlags(win, w.gw);
        const over = w.gw === P.A && w.bank != null && w.bank < -1e-9 && !P.approx.has(w.gw);
        const was = P.bare?.has(w.gw) ? tickWas(w, P.bare.get(w.gw)) : null;
        const chg = !!was;
        const chgMark = was ? h("s.ah-was", { "aria-hidden": "true" }, was) : null;
        const { style, ...at } = tabAt(w.gw, g);
        return h(
          "button.ah-tick",
          {
            type: "button",
            role: "radio",
            "aria-checked": String(w.gw === g),
            dataset: { gw: w.gw },
            style,
            class: { ...at, heal: (P.mark ?? P.approx).has(w.gw), lu: !!w.lineup, pencil: w.gw > P.A, chg },
            // VoiceOver and Switch Control activate with a click and no pointer (detail 0); a touch is the bar's own
            onClick: () => setGw(w.gw),
            "aria-label": `Gameweek ${w.gw}, ${fmt.num(w.points)} points, ${w.gw > P.A ? "provisional, " : ""}${sq ? plural(n, "change") : !n ? "roll" : `${w.moves.map((m) => P.L.name(m.in)).join(", ")} in`}${w.hits ? `, ${MINUS}${HIT_COST * w.hits}` : ""}${w.chip ? `, ${chipName(w.chip)}` : ""}${flags.length ? `, ${flags.map((f) => f === "DGW" ? "a double gameweek" : "a blank gameweek").join(" and ")}` : ""}${w.bank != null && !over ? `, ${fmt.money(w.bank)} in the bank` : ""}${w.lineup ? ", your lineup" : ""}${was ? `, ${COPY.tileWas(was)}` : ""}`
          },
          // two lines, every week the same height: "GW6" with its marks and what the week does (the buy's name, "2 in";
          // it ellipsises first, GW6 never), then the points
          h(
            "span.g",
            null,
            h("span.gn", null, `GW${w.gw}`),
            w.chip || w.hits || flags.length ? h(
              "span.m.dots",
              { "aria-hidden": "true" },
              flags.map((f) => h("span.gwk", null, f)),
              w.chip ? h("em", null, w.chip.toUpperCase()) : null,
              w.hits ? h("i.hit", null, ` ${MINUS}${HIT_COST * w.hits}`) : null
            ) : null,
            change ? h("span.c", null, change) : null
          ),
          h("span.a", null, V.adviceOf(P, w)),
          // (the week's bank after its transfers, before its points; owner, 2026-11-11, "add to the headers what the bank is in
          // each week"; short, its minus in coral, "why missing / zero though minus"; GW A short at FPL's prices shows it in
          // coral in the points' place, so none here)
          // (its free transfers before it, as on its card; owner, 2026-11-11, "add 1FT-5FT left of the money in the week's header")
          h("span.b.m-num", { class: { neg: w.bank != null && w.bank < -1e-9 } }, w.ft == null ? null : h("span.f", null, `${w.ft}FT`), w.bank == null || over ? null : fmt.money(w.bank)),
          // the points never recoloured for the window's lowest week (GW A short at FPL's prices stays coral: a fact);
          // the week's forecast in its blue with "xP" (xpNum), a change's mark before it
          h("span.p.m-num", { class: { "g-loss": over } }, over ? fmt.money(w.bank) : [chgMark, xpNum(shown)])
        );
      }),
      past
    );
    V.strip.style.order = -g;
    fitRail();
    roving(ticks);
    if (had) ticks.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
    fill(totalEl, `${span(P.gws)} total, `, totalNum(P), " points");
  }
  function fitRail() {
    const { ticks } = V;
    const marked = [...ticks.querySelectorAll(".ah-tick:has(.ah-was)")].filter((t) => t.offsetWidth);
    for (const t of marked) {
      const p = t.querySelector(".p"), cs = getComputedStyle(t);
      fitNum(t, () => p.getBoundingClientRect().width > t.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 0.5, ["close", "noxp", "nowas"]);
    }
    oneLook(marked, ["close", "noxp", "nowas"]);
  }
  const edgeTicks = (I) => {
    const { setGw } = V;
    return I.reach.filter((x) => !I.gws.includes(x)).map((x) => h("button.ah-tick.edge.pencil", {
      type: "button",
      role: "radio",
      "aria-checked": "false",
      "aria-disabled": "true",
      dataset: { gw: x },
      onClick: (e) => {
        if (e.detail === 0) setGw(x);
      },
      "aria-label": `Gameweek ${x}, locked: past your plan`
    }, h("span.g", null, h("span.gn", null, `GW${x}`)), h("span.p", null, h("span.ah-tlock", { "aria-hidden": "true" }, icon("lock", { size: 13 })))));
  };
  const toastOver = () => !!globalThis.document?.querySelector('#toasts:not([data-place="dock"]) > .toast:not(.leaving)');
  function renderTotal(P) {
    const { S, TOTAL_MS, ctx, el, toastGone, totLine, totSaid } = V;
    const key = `${P.entry}|${P.A}|${P.gws.join(",")}`;
    if (!P.healing) {
      const undo = !!FLASH?.undo && FLASH.at !== S.tot?.flash;
      const was = S.tot?.key === key ? S.tot : null;
      const t = totalShift(was, P.total, undo);
      if (t.shift === "back") {
        S.totDelta = null;
        fill(totSaid);
      } else if (t.shift != null) {
        const over = !!toastGone && toastOver();
        S.totDelta = { from: was.v, to: P.total, at: over ? null : Date.now(), undo };
        if (over) toastGone.observe(toastRegion(), { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
        fill(totSaid, `${span(P.gws)} total ${fmt.num(P.total)}, ${fmt.signed(t.shift)} points`);
      }
      S.tot = { key, v: P.total, flash: FLASH?.at, before: t.before };
    }
    const d = S.totDelta?.at != null && !P.healing && Date.now() - S.totDelta.at < TOTAL_MS ? S.totDelta : null;
    fill(
      totLine,
      h("span.k", null, `${span(P.gws)} `),
      totalNum(P),
      // the change blue with "xP" as the total, an Undo's too (xpGain; owner, 2026-10-22: no green or red number, its
      // sign its direction), named what it is beside a week's "vs rolling" (review 7, 2026-11-02: one baseline each)
      d ? h("span.ah-tdelta", { style: { "--left": `${TOTAL_MS - (Date.now() - d.at)}ms` } }, ` (${COPY.totalChange} `, xpGain(d.to - d.from), ")") : null
    );
    clearTimeout(S.totTimer);
    if (d) S.totTimer = setTimeout(() => {
      S.totDelta = null;
      fill(totSaid);
      const Q = plan(ctx);
      if (Q && el.isConnected) renderTotal(Q);
    }, TOTAL_MS - (Date.now() - d.at));
    keepGwLine();
  }
  const totalNum = (P) => {
    const { replanning } = V;
    return h("span.v.m-num", { class: { "m-pending": P.healing || replanning() } }, xpNum(fmt.num(P.total), "span.ah-tnum"));
  };
  function keepGwLine() {
    const { dlEl, gwline, totLine } = V;
    gwline.classList.remove("ah-tight", "ah-nomark", "ah-nototal");
    const one = parseFloat(getComputedStyle(gwline).lineHeight) * 1.5, words = gwline.classList.contains("ah-planning") ? dlEl.querySelector(".ah-plw") : null;
    const keeps = () => gwline.getBoundingClientRect().height <= one && gwline.scrollWidth <= gwline.clientWidth + 0.5 && (!words || dlEl.scrollWidth <= dlEl.clientWidth + 0.5 && words.clientWidth + 0.5 >= Math.min(words.scrollWidth, 2 * parseFloat(getComputedStyle(words).fontSize)));
    if (keeps()) return;
    for (const c of ["ah-nomark", "ah-tight"]) {
      gwline.classList.add(c);
      if (keeps()) return;
    }
    const d = totLine.querySelector(".ah-tdelta");
    if (d) {
      d.remove();
      gwline.classList.remove("ah-tight");
      if (keeps()) return;
      gwline.classList.add("ah-tight");
      if (keeps()) return;
    }
    gwline.classList.add("ah-nototal");
  }
  const sellOf = () => {
    const { ctx } = V;
    return new Map((ctx.data?.base?.squad || []).filter((x) => x.sell_price != null).map((x) => [Number(x.id), x.sell_price]));
  };
  const hasField = (f) => {
    const { ctx } = V;
    return !!ctx.bundle?.players?.fields?.includes(f);
  };
  const plateOk = (x) => (!x.field || hasField(x.field)) && (x.ok?.() ?? true);
  function plateOf() {
    const { PLATES, PLATE_KEY, S, ctx } = V;
    const k = ctx.api.local.get(PLATE_KEY);
    const x = PLATES.find((o) => o.key === k && plateOk(o)) ?? PLATES[0];
    if (x.key === "sell") S.sell = sellOf();
    return { ...x, second: x.second ?? { label: x.label, text: x.text, bar: x.bar } };
  }
  function renderPdBtn() {
    const { pdBtn } = V;
    const x = plateOf();
    fill(pdBtn, h("span.ah-pdl", null, x.short), h("span.ah-chev", { "aria-hidden": "true" }));
    pdBtn.setAttribute("aria-label", `Player data: ${x.spoken ?? x.label}`);
  }
  function playerDataSheet() {
    const { PLATES, PLATE_KEY, ctx, render } = V;
    const now = plateOf().key;
    ctx.sheets.open({
      title: "Player data",
      detent: "large",
      cls: "ah-pdsheet",
      build(body, sheet) {
        body.append(roving(h("div.ah-pd", { role: "radiogroup", "aria-label": "Player data" }, PLATES.filter(plateOk).map((x) => h("button.ah-pdo", {
          type: "button",
          role: "radio",
          "aria-checked": String(x.key === now),
          dataset: { plate: x.key },
          "aria-label": x.spoken ?? x.label,
          onClick: () => {
            ctx.api.local.set(PLATE_KEY, x.key);
            sheet.close();
            render();
          }
        }, h("span", null, x.label), h("span.ah-radio", { "aria-hidden": "true" })))), { pick: (b) => b.click() }));
        body.append(ctx.kits.kitSourceRow());
        body.append(h(
          "p.ah-fdr",
          { "aria-label": "Opponent colours: fixture difficulty from very easy to very hard" },
          h("span", null, "Opponent colour:"),
          [["1", "very easy"], ["2", "easy"], ["3", "average"], ["4", "hard"], ["5", "very hard"]].map(([n, t]) => h(`span.ah-fdrc.fdr-${n}`, { "aria-hidden": "true" }, t))
        ));
        body.append(h("p.ah-fdr", null, h("span", null, "Opponent name:"), COPY.oppCase));
      }
    });
  }
  return { paintBoard, paintChoosing, pitchProps, renderPitch, mountHere, placeHint, frozenAt, renderRail, fitRail, edgeTicks, tabAt, toastOver, renderTotal, totalNum, keepGwLine, sellOf, hasField, plateOk, plateOf, renderPdBtn, playerDataSheet };
}

// js/m/ahead/solvelog.js
var HIDDEN_FLAG = /^--(entry|poll-max-age)=/;
var PLAYER_FLAG = /^--(must-have|exclude|not-for-gw|for-gw|[a-z-]*(keep|sell|buy|captain|vice|bench)[a-z-]*)=/;
var namedFlag = (L, f) => L && PLAYER_FLAG.test(f) ? f.replace(/=(.*)$/, (_, v) => `=${v.replace(/\d{4,}/g, (id) => L.has(Number(id)) ? L.name(Number(id)) : id)}`) : f;
function mountSolveLog(ctx) {
  if (!/[?&]solves=1\b/.test(location.search) || document.querySelector(".ah-solvelog")) return;
  const el = document.createElement("div");
  el.className = "ah-solvelog";
  el.addEventListener("click", () => el.classList.toggle("folded"));
  document.body.append(el);
  let acted = 0;
  for (const t of ["pointerdown", "keydown"]) document.addEventListener(t, (e) => {
    if (!el.contains(e.target)) acted = Date.now();
  }, { capture: true, passive: true });
  const secs = (ms) => `${(ms / 1e3).toFixed(1)} s`;
  let said = [];
  const copy = Object.assign(document.createElement("button"), { type: "button", textContent: "Copy" });
  let shown = null;
  copy.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const text = [`${location.href} \xB7 ${(/* @__PURE__ */ new Date()).toISOString()}`, ...said].join("\n");
    const t = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
    t.addEventListener("click", (e) => e.stopPropagation());
    document.body.append(t);
    t.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    t.remove();
    const flash = (w) => {
      copy.textContent = w;
      setTimeout(() => {
        copy.textContent = "Copy";
      }, 2e3);
    };
    if (ok) return flash("Copied");
    const byHand = () => {
      shown?.remove();
      shown = t;
      el.insertBefore(t, list);
      t.focus();
      t.select();
      flash("Selected");
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => flash("Copied"), byHand);
    else byHand();
  });
  let cleared = 0;
  const clear = Object.assign(document.createElement("button"), { type: "button", textContent: "Clear" });
  clear.addEventListener("click", (ev) => {
    ev.stopPropagation();
    cleared = Date.now();
    acted = 0;
    shown?.remove();
    shown = null;
    paint();
    const e = ctx.store.get("entry");
    if (e != null) ctx.api.clearSolves(e).then(() => {
      try {
        localStorage.removeItem(ROADS(String(e)));
      } catch {
      }
      location.reload();
    }, () => {
    });
  });
  const list = document.createElement("div");
  el.replaceChildren(copy, clear, list);
  let got = { solves: [], skew: 0 }, asking = false;
  const ask = () => {
    const e = ctx.store.get("entry");
    if (asking || e == null) return;
    asking = true;
    ctx.api.getSolves(e).then((r) => {
      got = { solves: r?.solves ?? [], skew: Date.now() - Number(r?.now ?? 0) * 1e3 };
    }, () => {
    }).finally(() => {
      asking = false;
      paint();
    });
  };
  const paint = () => {
    const L = info(ctx)?.L, named = (f) => namedFlag(L, f);
    const now = Date.now(), asks = got.solves.map((x) => ({ ...x, at: Number(x.at) * 1e3 + got.skew, ms: x.ms == null ? null : Number(x.ms) })).filter((x) => x.at >= cleared);
    const live = (x) => x.state === "running" || x.state === "queued";
    const by = /* @__PURE__ */ new Map();
    for (const x of asks) {
      const g = by.get(x.key) ?? { ...x, kinds: [], n: 0 };
      if (!by.has(x.key)) by.set(x.key, g);
      g.n++;
      g.mine ||= x.mine !== false;
      if (x.mine !== false && x.state !== "already solved") g.ownAt = Math.min(g.ownAt ?? Infinity, x.at);
      if (!g.kinds.includes(x.kind)) g.kinds.push(x.kind);
      if (x.state !== "already solved" && (g.state === "already solved" || x.at < g.at)) Object.assign(g, { at: x.at, state: x.state, ms: x.ms, what: x.what, gw: x.gw });
    }
    const mine = [...by.values()].sort((x, y) => y.at - x.at), ran = (xs) => xs.filter((x) => x.state !== "already solved");
    const running = mine.filter(live).length, sinceTap = mine.filter((x) => x.ownAt != null && (!acted || x.ownAt >= acted)).length;
    const answered = [...ANSWERED.values()].filter((x) => x.at >= cleared).map((x) => ({ ...x, kinds: [x.kind], n: 1, mine: true, state: "answered", key: x.byKey }));
    const at = (job) => {
      const m = /^\d{8}-(\d\d)(\d\d)/.exec(job ?? "");
      return m ? `${m[1]}:${m[2]}` : null;
    };
    const listed = new Set(mine.map((x) => x.key));
    const ends = (x) => x.state === "answered" ? `answered by #${x.key}${listed.has(x.key) || !at(x.job) ? "" : ` (solved at ${at(x.job)}, kept on this device)`}` : x.state === "running" ? `solving, ${secs(now - x.at)}` : x.state === "queued" ? `waiting, ${secs(now - x.at)}` : x.state === "already solved" ? x.baked ? `no solve: the lineups${x.ms != null ? ` in ${x.ms < 1e3 ? `${x.ms} ms` : secs(x.ms)}` : ""}` : "cached" : x.state === "done" ? `solved in ${secs(x.ms ?? 0)}` : x.ms != null ? `${x.state} in ${secs(x.ms)}` : x.state;
    const head = `${running} running \xB7 ${sinceTap} since tap \xB7 ${ran(mine).length} solved \xB7 ${mine.length - ran(mine).length} cached \xB7 ${answered.length} answered \xB7 ${asks.length} asks`;
    const what = (x) => {
      const fs = x.baked ? [] : (x.flags ?? []).filter((f) => !HIDDEN_FLAG.test(f));
      return fs.length ? ` \xB7 ${fs.map(named).join(" ")}` : "";
    };
    const line = (x) => `\u2022 ${x.gw != null ? `GW${x.gw}` : "GW?"} \xB7 ${x.kinds.join(" + ")}${what(x)} \xB7 ${ends(x)}${x.n > 1 ? ` \xB7 asked ${x.n}\xD7` : ""}${x.mine ? "" : " \xB7 another page"}`;
    const all = [...mine, ...answered].sort((x, y) => y.at - x.at);
    const full = (x) => x.state === "answered" ? line(x) : `${line(x)} \xB7 #${x.key}`;
    said = [head, ...all.map(full)];
    list.replaceChildren(
      Object.assign(document.createElement("b"), { textContent: head }),
      ...all.slice(0, 30).map((x) => Object.assign(document.createElement("div"), { className: live(x) ? "solving" : x.state === "done" ? "solved" : x.state, textContent: full(x) }))
    );
  };
  ask();
  setInterval(ask, 1e3);
  setInterval(paint, 500);
}

// js/m/ahead/screen-touch.js
var underMarks = (x, y) => document.elementsFromPoint(x, y).find((el) => !el.closest(".ah-cm")) ?? null;
function touchPart(V) {
  const spend = (e) => {
    const { spent } = V;
    return Object.assign(spent, { on: true, x: e.clientX, y: e.clientY });
  };
  const letGo = (e) => {
    const { S } = V;
    return S.down.delete(e.pointerId);
  };
  const atEdge = (e) => {
    const { el } = V;
    const box = el.getBoundingClientRect();
    return e.clientX - box.left < EDGE_PX || box.right - e.clientX < EDGE_PX;
  };
  const tickAt = (x, y) => {
    const { ticks } = V;
    return [...ticks.querySelectorAll(".ah-tick")].find((t) => {
      const r = t.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  };
  const railEnd = (e) => {
    const { S, rail, setGw } = V;
    const st = S.drag?.rail;
    if (!st) return;
    S.drag = null;
    rail.classList.remove("dragging");
    if (e.type !== "pointerup") return;
    if (st.dragging) {
      spend(e);
      return;
    }
    if (Math.hypot(e.clientX - st.x, e.clientY - st.y) >= 10) return;
    const t = tickAt(e.clientX, e.clientY);
    if (t) {
      spend(e);
      setGw(Number(t.dataset.gw));
    }
  };
  const unfill = (st) => {
    st.fill?.();
    st.fill = null;
  };
  const benchBare = (e) => {
    const { decks, pitchHost } = V;
    const inside = (n) => {
      const r = n.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };
    const bench = pitchHost.querySelector(".pm-bench");
    return !!bench && inside(bench) && ![...bench.querySelectorAll(".pm-bs"), ...decks.querySelectorAll(".ah-sp")].some(inside);
  };
  const swipeGw = (dx) => {
    const { ctx, gwNow } = V;
    const P = plan(ctx);
    return P?.gws[P.gws.indexOf(gwNow(P)) + (dx < 0 ? 1 : -1)] ?? null;
  };
  const pitchEnd = (e) => {
    const { S, pitchHost, setGw } = V;
    const st = S.drag?.pitch;
    if (!st || st.pid !== e.pointerId) return;
    clearTimeout(st.timer);
    clearTimeout(st.chip);
    unfill(st);
    if (st.done) {
      releaseSoon(st);
      return;
    }
    const act = e.type === "pointerup";
    if (st.lifted) {
      dropOn({ act });
      return;
    }
    if (st.badge && st.flying) {
      dropBadge(st, { act });
      return;
    }
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    const far = Math.abs(dx) > 45 ? dx : st.swipe ? st.fl.add(e.clientX, e.timeStamp).project(e.clientX) - st.x : 0;
    if (act && !st.edge && Math.abs(far) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      S.drag.used = true;
      const g = swipeGw(far);
      if (g != null) {
        settle();
        if (st.tx != null) S.slide = dx + (far < 0 ? 1 : -1) * pitchHost.clientWidth;
        letGo(e);
        setGw(g);
        releaseSoon(st);
        return;
      }
    }
    if (st.tx != null) settle(st.tx);
    releaseSoon(st);
  };
  function settle(x = 0) {
    const { pitchHost } = V;
    const s = pitchHost.style;
    pitchHost.classList.remove("settle");
    s.transform = x && !reduceMotion() ? `translateX(${x}px)` : "";
    if (!s.transform) return;
    void pitchHost.offsetWidth;
    pitchHost.classList.add("settle");
    s.transform = "";
  }
  const releaseSoon = (st) => {
    const { S } = V;
    st.ended = true;
    setTimeout(() => {
      if (S.drag && Object.values(S.drag).includes(st)) S.drag = null;
    }, 0);
  };
  const gesture = () => {
    const { S } = V;
    return [S.drag?.rail, S.drag?.pitch, S.drag?.row].find((st) => st && !st.ended) ?? null;
  };
  const cancelGesture = () => {
    const st = gesture();
    st?.end({ type: "pointercancel", pointerId: st.pid, clientX: st.x, clientY: st.y, timeStamp: performance.now() });
  };
  function dragBadge(st, e) {
    const { S, ctx, el, gwNow, learn, pitchHost } = V;
    const P = plan(ctx);
    const w = weekOf(P, gwNow(P));
    if (!st.flying) {
      st.flying = true;
      S.drag.used = true;
      clearTimeout(st.chip);
      unfill(st);
      learn("pitch");
      try {
        pitchHost.setPointerCapture(e.pointerId);
      } catch {
      }
      st.gap = h("span.ah-ghostgap");
      const vice2 = st.badge === "v";
      st.ghost = h("div.ah-dragghost.badge", { "aria-hidden": "true" }, st.gap, h(vice2 ? "span.pm-badge.v" : "span.pm-badge.c", null, vice2 ? "V" : w.chip === "tc" ? "3\xD7" : "C"));
      document.body.append(st.ghost);
    }
    st.ghost.style.transform = `translate(${e.clientX - 12}px, ${e.clientY - 28}px)`;
    const under = underMarks(e.clientX, e.clientY)?.closest?.(".pm-pl[data-id]");
    const id = under && pitchHost.contains(under) ? Number(under.dataset.id) : null;
    st.target = id !== null && w.xi.includes(id) ? id : null;
    for (const n of pitchHost.querySelectorAll(".pm-pl.ah-captarget")) n.classList.remove("ah-captarget");
    if (st.target !== null) under.classList.add("ah-captarget");
    if (st.badge === "v") {
      const nm = st.target === null ? null : P.L.name(st.target);
      st.gap.textContent = st.target === null ? COPY.viceDrop : st.target === w.vice ? COPY.viceStays : st.target === w.captain ? COPY.viceSwap(nm) : COPY.viceTo(nm);
    } else {
      const cg = st.target !== null && st.target !== w.captain ? captainGap(inputs(ctx), w, st.target, w.captain) : null;
      const gap = st.target === null ? null : st.target === w.captain ? COPY.capNow : COPY.capGap(cg.delta, P.L.name(w.captain), cg.label);
      st.gap.textContent = st.target !== null ? `${P.L.name(st.target)} \xB7 ${gap}` : "Drop the armband on a starter";
    }
    const box = el.getBoundingClientRect(), wd = st.gap.offsetWidth, x0 = e.clientX - wd / 2;
    st.gap.style.setProperty("--gx", `${Math.max(box.left + 8, Math.min(x0, box.right - 8 - wd)) - x0}px`);
  }
  function dropBadge(st, { act = true } = {}) {
    const { ctx, gwNow, pitchHost } = V;
    st.ghost?.remove();
    for (const n of pitchHost.querySelectorAll(".pm-pl.ah-captarget")) n.classList.remove("ah-captarget");
    releaseSoon(st);
    const P = plan(ctx);
    const g = gwNow(P);
    const w = weekOf(P, g);
    if (!act || st.target === null || !w) return;
    armTo(st.badge, g, w, st.target);
  }
  const armTo = (arm, g, w, id) => {
    const { ctx } = V;
    return arm === "v" ? id === w.captain ? captain(ctx, g, w.vice) : id !== w.vice && vice(ctx, g, id) : id !== w.captain && captain(ctx, g, id);
  };
  function armbandSheet(arm, g) {
    const { ctx } = V;
    const P = plan(ctx), w = weekOf(P, g);
    if (!P || !w) return;
    const isV = arm === "v", on = isV ? w.vice : w.captain;
    const can = !inkAt(ctx, P, g);
    const xp = (id) => ctx.pitch.xpAt(ctx.data.byId.get(Number(id)), g, ctx.data.xpGws);
    const words = (id) => {
      const nm = P.L.name(id);
      if (isV) return id === w.vice ? COPY.viceStays : id === w.captain ? COPY.viceSwap(nm) : null;
      if (id === w.captain) return COPY.capNow;
      const cg = captainGap(inputs(ctx), w, id, w.captain);
      return COPY.capGap(cg.delta, P.L.name(w.captain), cg.label);
    };
    const title = COPY.armIn(arm, g);
    ctx.sheets.open({
      title,
      detent: "medium",
      fit: true,
      cls: "cs",
      label: title,
      build(body, sheet) {
        append(body, h("div.ah-list", { role: "group", "aria-label": title }, [...w.xi].sort((a, b) => (xp(b) ?? -Infinity) - (xp(a) ?? -Infinity)).map((id) => {
          const fact = words(id);
          return h(
            "button.ah-lrow",
            {
              type: "button",
              disabled: !can || id === on,
              "aria-pressed": id === on ? "true" : null,
              "aria-label": `${P.L.name(id)}, ${fmt.pts(xp(id))} points${fact ? `, ${fact}` : ""}`,
              onClick: () => {
                if (armTo(arm, g, w, id)) sheet.close();
              }
            },
            h("span.mk.rs-automk", { class: { on: id === on }, "aria-hidden": "true" }, id === on ? isV ? "V" : "C" : ""),
            h("span.nm", null, h("b", null, P.L.name(id)), fact ? h("span", null, fact) : null),
            h("span.rt.m-num", null, xpNum(fmt.pts(xp(id))))
          );
        })), can ? null : h("p.m-foot", null, COPY.live(g)));
      }
    });
  }
  function subSheet(id, g) {
    const { ctx } = V;
    ctx.openSheet("sub", id, g);
  }
  function lift(st, e, { ghost, valid, onDrop, hintText, subs = [], onPlayer = null }) {
    const { S, hint, pitchHost, ticks } = V;
    st.lifted = true;
    S.drag.used = true;
    try {
      st.src.setPointerCapture(e.pointerId);
    } catch {
    }
    st.ghost = h("div.ah-dragghost", { "aria-hidden": "true" }, ghost);
    document.body.append(st.ghost);
    st.onDrop = onDrop;
    st.subs = new Set(subs);
    st.onPlayer = onPlayer;
    for (const n of pitchHost.querySelectorAll(".pm-pl[data-id], .pm-bs[data-id]")) n.classList.toggle("ah-subok", st.subs.has(Number(n.dataset.id)));
    fill(hint, h("span", null, hintText));
    hint.classList.add("on");
    for (const t of ticks.querySelectorAll(".ah-tick")) {
      const ok = valid.includes(Number(t.dataset.gw));
      t.classList.toggle("glow", ok);
      t.classList.toggle("bad", !ok);
    }
    dragTo(st.last ?? e);
  }
  function dragTo(e) {
    const { S, pitchHost, ticks } = V;
    const st = S.drag?.pitch;
    if (!st?.ghost) {
      if (st) st.last = e;
      return;
    }
    st.ghost.style.transform = `translate(${e.clientX - 28}px, ${e.clientY - 50}px) scale(1.06)`;
    st.over = null;
    if (st.subs?.size) {
      const under = underMarks(e.clientX, e.clientY)?.closest?.(".pm-pl[data-id], .pm-bs[data-id]");
      const id = under && pitchHost.contains(under) ? Number(under.dataset.id) : null;
      st.overPl = id !== null && st.subs.has(id) ? id : null;
      for (const n of pitchHost.querySelectorAll(".ah-captarget")) n.classList.toggle("ah-captarget", n === under && st.overPl !== null);
      if (st.overPl !== null) under.classList.add("ah-captarget");
    }
    for (const t of ticks.querySelectorAll(".ah-tick")) {
      const r = t.getBoundingClientRect();
      const on = t.classList.contains("glow") && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 28 && e.clientY <= r.bottom + 12;
      t.classList.toggle("hover", on);
      if (on) st.over = Number(t.dataset.gw);
    }
  }
  function dropOn({ act = true } = {}) {
    const { S, hint, pitchHost, render, schedule, ticks } = V;
    const st = S.drag?.pitch;
    if (!st) return;
    st.ghost?.remove();
    hint.classList.remove("on");
    st.pl?.classList.remove("ah-lifted");
    for (const t of ticks.querySelectorAll(".ah-tick")) t.classList.remove("glow", "bad", "hover");
    for (const n of pitchHost.querySelectorAll(".ah-subok, .ah-captarget")) n.classList.remove("ah-subok", "ah-captarget");
    releaseSoon(st);
    if (act) render();
    else schedule();
    if (act && st.over != null) st.onDrop(st.over);
    else if (act && st.overPl != null) st.onPlayer?.(st.overPl);
  }
  function pitchChip(st, chip) {
    const { S, ctx, gwNow, learn } = V;
    st.done = true;
    S.drag.used = true;
    learn("chips");
    useChip(ctx, chip, gwNow(plan(ctx)));
  }
  function liftShirt(st, e) {
    const { ctx, gwNow, learn } = V;
    const P = plan(ctx);
    const id = st.id;
    const g = gwNow(P);
    const w = weekOf(P, g);
    const chipOut = !!squadWeek(w) && w.squad.includes(id) && !squadBefore(P, g).includes(id) && !inkAt(ctx, P, g);
    const valid = P.gws.filter((x) => (squadBefore(P, x).includes(id) || chipOut && x === g) && !inkAt(ctx, P, x));
    const subs = w && !inkAt(ctx, P, g) ? swapCandidates(w, id, P.L.pos) : [];
    learn("pitch");
    st.pl.classList.add("ah-lifted");
    lift(st, e, {
      ghost: shirtOf(P.L, id, 56),
      valid,
      subs,
      hintText: COPY.liftShirt(P.L.name(id), subs.length > 0, valid.some((x) => !(chipOut && x === g)), chipOut ? g : null),
      onDrop: (x) => chipOut && x === g ? veto(ctx, { gw: g, out: null, in: id }, { scope: "gw" }) : ctx.openSheet("replace", id, x),
      onPlayer: (o) => sub(ctx, g, id, o)
    });
  }
  function wireMoveRow(row, fg, m) {
    const { S, learn } = V;
    fg.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      const st = { x: e.clientX, y: e.clientY, dx: 0, swiping: false, row, pid: e.pointerId, src: fg, edge: atEdge(e), fl: flick().add(e.clientX, e.timeStamp), end: up };
      S.drag = { row: st, used: false };
    });
    fg.addEventListener("pointermove", (e) => {
      const st = S.drag?.row;
      if (!st || st.row !== row || st.pid !== e.pointerId) return;
      st.fl.add(e.clientX, e.timeStamp);
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.swiping && (Math.hypot(dx, dy) > 8 || Math.abs(dy) > 6)) {
        if (!st.edge && Math.abs(dx) > Math.abs(dy)) {
          st.swiping = true;
          S.drag.used = true;
          fg.classList.add("dragging");
          try {
            fg.setPointerCapture(e.pointerId);
          } catch {
          }
        } else {
          S.drag = null;
          return;
        }
      }
      if (st.swiping) {
        st.dx = Math.min(0, dx);
        fg.style.transform = `translateX(${st.dx}px)`;
      }
    });
    const up = (e) => {
      const st = S.drag?.row;
      if (!st || st.row !== row) return;
      releaseSoon(st);
      fg.classList.remove("dragging");
      const far = !st.swiping || e.type !== "pointerup" ? 0 : st.dx < -SWIPE_PX ? st.dx : st.fl.add(e.clientX, e.timeStamp).project(e.clientX) - st.x;
      if (far < -SWIPE_PX) {
        letGo(e);
        learn("row");
        vetoRow(row, fg, m);
      } else fg.style.transform = "";
    };
    fg.addEventListener("pointerup", up);
    fg.addEventListener("pointercancel", up);
    fg.addEventListener("touchmove", (e) => {
      if (S.drag?.row?.row === row && S.drag.row.swiping) holdTouch(e);
    }, { passive: false });
  }
  function vetoRow(row, fg, m) {
    const { ctx, render } = V;
    row.classList.add("out");
    fg.style.transform = "";
    if (!veto(ctx, m, { scope: "gw" })) render();
  }
  function vetoFromWhy(m) {
    const { S, ctx } = V;
    const at = `[data-gw="${m.gw}"][data-out="${m.out}"][data-in="${m.in}"]`;
    const row = S.week?.host.querySelector(`.ah-mrow${at}`), fg = row?.querySelector(":scope > .ah-fg");
    if (!row || !fg || reduceMotion() || !editable(ctx)) return veto(ctx, m, { scope: "gw" });
    const words = row.querySelector(":scope > .ah-veto > span");
    row.classList.add("out");
    fg.style.transform = `translateX(-${Math.max(SWIPE_PX, (words?.offsetWidth ?? 0) + 32)}px)`;
    setTimeout(() => vetoRow(row, fg, m), SWIPE_MS);
    return true;
  }
  const pressed = (e) => {
    const { S, el, rail } = V;
    cancelGesture();
    if (e.isPrimary) S.down.clear();
    if (!rail.contains(e.target) && el.contains(e.target) || S.week?.sheet.el.contains(e.target)) S.down.add(e.pointerId);
  };
  const stray = (e) => {
    const st = gesture();
    if (st && (e.type === "blur" || (e.type === "keydown" ? e.key === "Escape" : e.pointerId === st.pid))) cancelGesture();
  };
  const lifted = (e) => {
    const { LIFT_MS, S, covered, render } = V;
    const draw = () => setTimeout(() => {
      if (!S.down.size && S.held && !covered()) {
        S.held = false;
        render();
      }
    }, 0);
    if (e.type === "blur") {
      S.down.clear();
      if (S.held) draw();
      return;
    }
    if (!S.down.has(e.pointerId)) {
      if (!S.down.size && S.held) draw();
      return;
    }
    const id = e.pointerId;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      globalThis.removeEventListener("click", soon, true);
      S.down.delete(id);
      if (!S.down.size && S.held) draw();
    };
    const soon = () => setTimeout(go, 0);
    globalThis.addEventListener("click", soon, true);
    setTimeout(go, LIFT_MS);
  };
  const spentUp = (e) => {
    const { S } = V;
    if (S.drag?.used) spend(e);
  };
  const spentDown = () => {
    const { spent } = V;
    spent.on = false;
  };
  const spentClick = (e) => {
    const { spent } = V;
    if (!spent.on || e.detail === 0) return;
    const ours = Math.hypot(e.clientX - spent.x, e.clientY - spent.y) <= SPENT_PX;
    spent.on = false;
    if (!ours) return;
    e.stopPropagation();
    e.preventDefault();
  };
  return { spend, letGo, atEdge, tickAt, railEnd, unfill, benchBare, swipeGw, pitchEnd, settle, releaseSoon, gesture, cancelGesture, dragBadge, dropBadge, armTo, armbandSheet, subSheet, lift, dragTo, dropOn, pitchChip, liftShirt, wireMoveRow, vetoRow, vetoFromWhy, pressed, stray, lifted, spentUp, spentDown, spentClick };
}

// js/m/ahead/plans/forks.js
var forks_exports = {};
__export(forks_exports, {
  FORK_FLIGHTS: () => FORK_FLIGHTS,
  FORK_REFS: () => FORK_REFS,
  answeredBy: () => answeredBy,
  asTaken: () => asTaken,
  forkAgain: () => forkAgain,
  forkAsk: () => forkAsk,
  forkDue: () => forkDue,
  forkFlights: () => forkFlights,
  forkKept: () => forkKept,
  forkPump: () => forkPump,
  forkRead: () => forkRead,
  forkValues: () => forkValues,
  measurePlan: () => measurePlan,
  noteAnswered: () => noteAnswered,
  planBaseline: () => planBaseline,
  planOfRoad: () => planOfRoad,
  resetForks: () => resetForks,
  rulesWords: () => rulesWords,
  takenBy: () => takenBy
});

// js/m/ahead/plans/choices.js
var choices_exports = {};
__export(choices_exports, {
  approxAt: () => approxAt,
  chipNumber: () => chipNumber,
  chipShown: () => chipShown,
  choiceVs: () => choiceVs,
  countedAfter: () => countedAfter,
  keepNewest: () => keepNewest,
  lineNotices: () => lineNotices,
  litEdges: () => litEdges,
  planWeeks: () => planWeeks,
  plansListed: () => plansListed,
  plansOf: () => plansOf,
  plansWait: () => plansWait,
  rowsWanted: () => rowsWanted,
  settleDue: () => settleDue,
  settledList: () => settledList,
  settlesAt: () => settlesAt,
  squadChanges: () => squadChanges,
  weekKey: () => weekKey,
  weekRollOf: () => weekRollOf,
  weekSettled: () => weekSettled,
  weekWait: () => weekWait,
  yoursAt: () => yoursAt
});

// js/m/ahead/plans/lit.js
function litOf(P, w, M, D, toks = []) {
  const at = Object.assign(/* @__PURE__ */ new Map(), { best: null, chip: null, move: null });
  const can = litCan(P, w);
  const best = weekBest(P, w, M, D, toks);
  at.best = best;
  at.chip = best && toks.includes(best) ? best : null;
  const move = at.move = at.chip ? weekBest(P, w, M, D) : best;
  if (move) for (const d of placesOf(D, move)) at.set(d.a, { e: d.entries.find((x) => x.pl === move), best: true });
  if (!M.settled) return at;
  for (const d of D) {
    if (at.has(d.a) || d.mine) continue;
    const e = d.entries.find((x) => singleMove(x) && !x.pl.early && !x.pl.refRow && !x.pl.placeOnly && can(x.pl));
    if (e) at.set(d.a, { e, best: false });
  }
  return at;
}
var litCan = (P, w) => owedAt(P, w) ? (pl) => pl?.state === "ready" && paysBack(w, pl) : (pl) => plPays(pl) || pl?.state === "ready" && !!pl.forced && showingAt(P, w.gw);
var placesOf = (D, pl) => D.filter((d) => d.entries.some((e) => e.pl === pl));
var shownWaits = (plans) => plans.some((pl) => pl.forced && pl.state !== "failed" && pl.gain == null);
function weekBest(P, w, M, D, toks = []) {
  const g = w.gw;
  if (!M.settled) return null;
  const can = litCan(P, w);
  const ok = (pl) => !pl.refRow && !pl.placeOnly;
  const waits = !!M.shownOut || shownWaits(M.plans), worth = (pl) => pl.forced ? pl.gain : pl.cmp.delta;
  const moves = M.plans.filter((pl) => ok(pl) && can(pl) && (!pl.forced || !waits && pl.gain > -Infinity) && placesOf(D, pl).length && !placesOf(D, pl).some((d) => litEdges(d.a, d.entries.find((e) => e.pl === pl))));
  const move = moves.reduce((m, pl) => !m || worth(pl) > worth(m) ? pl : m, null);
  const chips = toks.filter((pl) => ok(pl) && pl.state === "ready" && !rollOnly(pl) && !!pl.choice.chips?.[g] && pl.cmp.delta > (move?.cmp.delta ?? 0));
  return chips.reduce((m, pl) => !m || pl.cmp.delta > m.cmp.delta ? pl : m, null) ?? move;
}
function litShown(P, w, M, D, toks = [], lit = litOf(P, w, M, D, toks)) {
  const on = (a) => !D.drawn || D.drawn.has(a);
  const first = M.settled ? D.filter((d) => !lit.has(d.a) && on(d.a)).map(placeFirst).filter((e) => e?.pl?.state === "ready").map((e) => e.pl) : [];
  return new Set([...[...lit].filter(([a, x]) => x.best || on(a)).map(([, x]) => x.e.pl), ...first, ...M.settled ? D.drawnPl ?? [] : [], ...toks.filter((pl) => pl.state === "ready" && !pl.refRow)].filter((pl) => plPays(pl) || pl === lit.chip));
}
var rollOnly = (pl) => !!pl?.rolls;
var addsOf = (c, g, yours) => c.moves.filter((m) => m.gw === g && !yours.some((y) => y.out === m.out && y.in === m.in));
function planBack(P, g, pl) {
  const nm = P.L.name;
  const c = pl.choice;
  const chipNow = SQUAD_CHIPS.has(c.chips?.[g]);
  const now = chipNow ? [] : c.moves.filter((m) => m.gw === g);
  const ch = chipBackOf(P, g, c);
  const yoursNow = ch ? [] : weekOf(P, g)?.moves || [];
  const adds = chipNow ? [] : addsOf(c, g, yoursNow);
  const taken = ch ? [] : yoursTakenBack(P, g, c.moves);
  const roll = !ch && adds.length && rollingAt(P, g) ? COPY.planVsRoll : "";
  const gone = ch ? chipName(ch) : roll || taken.map((m) => adds.some((a) => a.in === m.in) ? `${nm(m.out)} \u2192 ${nm(m.in)}` : nm(m.in)).join(" + ");
  const lost = ch ? chipName(ch) : roll || taken.map((m) => nm(m.in)).join(" + ");
  return { chipNow, now, adds, taken, lost, gone, rolls: !!roll, back: !gone ? "" : ch || adds.length || chipNow || !now.length ? COPY.planInsteadOf(gone) : COPY.planWithout(gone) };
}
function decksOf(P, w, M) {
  const g = w.gw, on = new Set([...w.xi, ...w.bench].map(Number));
  const mine = M.sq ? [] : w.moves;
  const anchorOf = (o) => on.has(Number(o)) ? Number(o) : Number(mine.find((m) => Number(m.out) === Number(o))?.in) || null;
  const by = /* @__PURE__ */ new Map(), toks = [];
  const put = (a, e, rank) => {
    if (!on.has(a) || a === e.inId) return;
    if (!by.has(a)) by.set(a, { a, mine: false, rank, entries: [] });
    by.get(a).entries.push(e);
  };
  M.plans.forEach((pl, i) => {
    if (SQUAD_CHIPS.has(pl.choice.chips?.[g])) return;
    const { chipNow, adds, taken, lost, gone, rolls } = planBack(P, g, pl);
    if (chipNow || !adds.length && !taken.length) toks.push(pl);
    else if (adds.length) {
      if (benchOnly(g, pl, adds) && !pl.forced) return;
      for (const m of adds) {
        const pair = adds.filter((x) => x !== m).map((x) => ({ a: anchorOf(x.out), out: Number(x.out), in: Number(x.in) }));
        put(anchorOf(m.out), { pl, inId: Number(m.in), adds, pair, taken, lost, gone, rolls }, i);
      }
    } else for (const m of taken) put(Number(m.in), { pl, inId: Number(m.out), back: true, adds, pair: [], taken, lost, gone, rolls }, i);
  });
  for (const m of mine) {
    const a = Number(m.in);
    if (!on.has(a)) continue;
    if (!by.has(a)) by.set(a, { a, mine: true, rank: -1, entries: [] });
    const one = (e) => e.back && e.taken.length === 1;
    const d = by.get(a), k = d.entries.findIndex((e) => one(e) && e.pl?.state === "ready");
    d.mine = true;
    const first = k >= 0 ? d.entries.splice(k, 1)[0] : { remove: { gw: g, out: m.out, in: m.in }, inId: Number(m.out), back: true, adds: [], pair: [], taken: [m], lost: P.L.name(m.in) };
    d.entries = [first, ...d.entries.filter((e) => !one(e))];
  }
  return { decks: [...by.values()].sort((x, y) => y.mine - x.mine || x.rank - y.rank), toks };
}
var benchOnly = (g, pl, adds) => pl?.state === "ready" && !!pl.ev?.gws && adds.length > 0 && adds.every((m) => pl.ev.gws.every((s) => s.gw < g || !(s.xi ?? []).some((x) => Number(x) === Number(m.in))));
var takesBack = (e) => !!(e.back || e.remove || e.pl?.refRow);
var singleMove = (e) => !!e.pl && !e.pair?.length && !takesBack(e) && e.pl.state !== "failed";
var placeDealt = (entries, n, tile = false) => {
  const all = entries;
  entries = placeBuys(entries);
  if (entries.length <= n - (tile ? 1 : 0)) return entries;
  const back = entries.find(takesBack) ?? null;
  const k = Math.max(0, n - 1 - (back ? 1 : 0));
  const best = entries.filter((e) => e !== back).slice(0, k);
  const shows = (e) => singleMove(e) || singleMove(placeLine(all, e) ?? {});
  const one = all.find((e) => singleMove(e) && e.pl.state === "ready") ?? all.find(singleMove);
  if (one && k && !best.some(shows)) best.splice(k - 1, 1, entries.find((e) => e === one || !takesBack(e) && e.inId != null && e.inId === one.inId));
  return [...best, ...back ? [back] : []];
};
var placePages = (entries, n, tile = false) => {
  const buys = placeBuys(entries);
  if (buys.length <= n - (tile ? 1 : 0)) return [buys];
  const first = placeDealt(entries, n, tile), per = Math.max(1, n - 1);
  const rest = buys.filter((e) => !first.includes(e));
  const pages = [first];
  for (let i = 0; i < rest.length; i += per) pages.push(rest.slice(i, i + per));
  return pages;
};
var placeBuys = (entries) => {
  const seen = /* @__PURE__ */ new Set();
  return entries.filter((e) => takesBack(e) || e.inId == null || !seen.has(e.inId) && !!seen.add(e.inId));
};
var placeLine = (entries, e) => {
  if (takesBack(e) || e.inId == null) return null;
  const ways = entries.filter((x) => x !== e && !takesBack(x) && x.inId === e.inId && entries.indexOf(x) > entries.indexOf(e));
  if (!ways.length) return null;
  const lone = (x) => !x.pair?.length;
  return singleMove(e) || lone(ways[0]) ? ways[0] : ways.find((x) => singleMove(x) && x.pl.state === "ready") ?? ways.find(lone) ?? ways[0];
};
var multiMove = (e, a = null) => {
  if (!e?.pl || e.pl.refRow) return false;
  const own = a != null && e.taken?.length === 1 && Number(e.taken[0].in) === Number(a);
  if (takesBack(e)) return !own && !!e.taken?.length;
  return !!e.pair?.length || !!e.gone && !own && !e.rolls;
};
var placeSplit = (entries, a = null) => {
  const live = entries.filter((e) => !e.pl?.needs && !(takesBack(e) && multiMove(e, a)));
  const multi = live.filter((e) => multiMove(e, a));
  return { singles: live.filter((e) => !multi.includes(e)), line: multi.find((e) => e.pl.state === "ready") ?? multi.find((e) => e.pl.state !== "failed") ?? null };
};
var lineMoves = (P, e) => {
  const nm = P.L.name;
  const back = e.gone ? COPY.planInsteadOf(e.gone) : "";
  return Object.assign(e.adds.map((m) => `${nm(m.out)} \u2192 ${nm(m.in)}`), { back: e.adds.length ? back : capFirst(back) });
};
var placeOrder = (entries) => {
  const tier = (e) => takesBack(e) ? 2 : e.pl?.state === "ready" ? 0 : 1;
  return entries.map((e, i) => [e, i]).sort(([a, i], [b, j]) => tier(a) - tier(b) || (tier(a) === 0 ? b.pl.cmp.delta - a.pl.cmp.delta : 0) || i - j).map(([e]) => e);
};
var PLACE_SLOTS = 4;
var placeFirst = (d) => {
  if (d.mine) return d.entries[0] && takesBack(d.entries[0]) ? d.entries[0] : null;
  const live = (e) => !takesBack(e) && !e.pl?.placeOnly && (e.pl?.state === "ready" && shownGain(e.pl.cmp.delta) || e.pl?.state === "solving");
  const own = placeSplit(placeOrder(d.entries), d.a).singles;
  if (!own.some(live)) return null;
  const dealt = placeDealt(own, PLACE_SLOTS);
  return dealt.find(live) ?? own.find(live);
};
function slotsBeside(x0, step, n, W, cw) {
  const side = (s) => [1, 2, 3, 4, 5].map((k) => x0 + s * k * step).filter((x) => x >= 3 && x + cw <= W - 3);
  return [...side(1), ...side(-1)].slice(0, n);
}
function failedWords(P, pl) {
  if (!pl.needs) return { head: COPY.placeCantPlan, note: `${COPY.placeCantPlan}: ${COPY.planFailedShort(pl.why)}`, row: COPY.planFailed(pl.why) };
  const lack = pl.problems.length ? pl.problems.map(problemShort).join(", ") : problemShort(null), need = COPY.needsSale(pl.needs.map((id) => P.L.name(id)));
  return { head: lack, note: need, row: `${lack} \xB7 ${need}` };
}
function noteOf(P, w, e, a = null) {
  const nm = P.L.name, pl = e.pl, chip = pl?.choice.chips?.[w.gw];
  const said = (...xs) => [...xs, pl?.removed ? COPY.removedByYou : null].filter(Boolean).join(" \xB7 ") || null;
  if (pl?.state === "solving") return said(COPY.waitShort);
  if (pl?.state === "failed") return said(failedWords(P, pl).note);
  const own = a != null && e.taken?.length === 1 && Number(e.taken[0].in) === Number(a);
  const what = own ? e.pair.length ? COPY.placeAlso(e.pair.map((p) => `${nm(p.out)} \u2192 ${nm(p.in)}`)) : null : e.back ? COPY.planInsteadOf(e.lost) : e.pair.length ? [COPY.placeAlso(e.pair.map((p) => `${nm(p.out)} \u2192 ${nm(p.in)}`)), e.gone ? COPY.planInsteadOf(e.gone) : null].filter(Boolean).join(" \xB7 ") : e.gone ? COPY.planInsteadOf(e.gone) : w.moves.length && !squadWeek(w) ? COPY.placeNth(w.moves.length + 1) : null;
  return said(what, chip && !SQUAD_CHIPS.has(chip) ? chipName(chip) : null);
}
var mineAny = (P) => P.weeks.some((w) => w.moves.length);
var byGain = (a, b) => b.cmp.delta - a.cmp.delta || b.model - a.model;
var FITS = /* @__PURE__ */ new WeakMap();
function fitOf(ctx, P, g, c, d0) {
  if (Object.keys(c.chips || {}).length) return { ok: true, problems: [] };
  let by = FITS.get(P);
  if (!by) FITS.set(P, by = /* @__PURE__ */ new Map());
  const k = `${g}|${forkKey(c, g)}`;
  if (!by.has(k)) {
    const mine = flatMoves(d0);
    const d1 = planTakeDraft(ctx, P, g, d0, c.moves);
    const ev = estimate(ctx, chipBackOf(P, g, c) ? setChip(d1, g, null) : d1, g);
    const ps = problemsOf(ctx, ev, g), p = ps[0] ?? null, p0 = p && problemOf(ctx, estimate(ctx, d0, g), g);
    const own = !!p && p0?.code === p.code && p0.gw === p.gw;
    by.set(k, { ok: (!p || own) && !rebought(P, c.moves, ev, mine.filter((m) => pinOfMove(P, m))), problems: own ? [] : ps });
  }
  return by.get(k);
}
var fitsAt = (ctx, P, g, c, d0) => fitOf(ctx, P, g, c, d0).ok;
function rebought(P, moves, ev, mine) {
  return moves.some((m) => {
    if (m.gw <= P.A) return false;
    const sold = [...moves, ...mine].filter((x) => x.out === m.in && x.gw < m.gw).map((x) => x.gw);
    const from = Math.max(P.A, ...sold);
    return ev.gws.some((s) => s.gw >= from && s.gw < m.gw && s.chip !== "fh" && s.squad.includes(m.in));
  });
}
var forkKey = (p, g) => SQUAD_CHIPS.has(p.chips?.[g]) ? p.chips[g] : p.moves.filter((m) => m.gw === g).map((m) => `${m.out}>${m.in}`).sort().join(",");

// js/m/ahead/plans/choices.js
var ROWS_WANT = /* @__PURE__ */ new Set();
function rowsWanted(g, on) {
  if (ROWS_WANT.has(g) === !!on) return;
  if (on) ROWS_WANT.add(g);
  else ROWS_WANT.delete(g);
  PAIR.rev++;
}
function plansOf(ctx, P, g, { peek = false, prep = false } = {}) {
  const w = weekOf(P, g);
  if (inkAt(ctx, P, g) || !w) return [];
  const chipMine = SQUAD_CHIPS.has(w.chip) ? w.chip : null;
  if (!prep && !ctx.presolveOn?.() && !chipMine && !suggestedAt(P, g) && !showingAt(P, g) && !ROWS_WANT.has(g) && (w.moves.length || !P.pins.some((p) => p.kind === "notfor" && Number(p.gw) === g))) return [];
  const lean = !prep && !ctx.presolveOn?.();
  const modelTo = Number(memOf(ctx)?.model?.()?.values?.to ?? Infinity);
  if (lean && !P.base && g <= modelTo) {
    memOf(ctx)?.wantModel?.();
    return Object.assign([], { pending: true });
  }
  let by = PLANS.get(P);
  if (!by || by.rev !== PAIR.rev) PLANS.set(P, by = { rev: PAIR.rev, gw: /* @__PURE__ */ new Map() });
  if (by.gw.has(g)) {
    return by.gw.get(g);
  }
  const d0 = draftOf(ctx), before = planBaseline(ctx, P, g), mine = flatMoves(d0);
  const asIs = planBaseline(ctx, P, g, false);
  const ownMoves = mine.filter((m) => pinOfMove(P, m));
  const squadAt = (x) => !!squadWeek(weekOf(P, x));
  const now = chipMine ? [] : w.moves.map((m) => ({ gw: g, out: m.out, in: m.in }));
  const unmade = (c) => c.moves.filter((m) => !now.some((y) => sameMove2(y, m)));
  const yours = forkKey({ moves: now, chips: chipMine ? { [g]: chipMine } : {} }, g);
  const followed = !P.mem?.hold;
  const heldOf = (c) => !followed && c.chips?.[g] === "wc";
  const mineFrom = movesSig(mine.filter((m) => m.gw >= g && P.gws.includes(m.gw) && !squadAt(m.gw)));
  const allowed = (p) => {
    const sold = p.moves.map((m) => m.out);
    return new Set(sold).size === sold.length && !p.moves.some((m) => isFrozen(P, m.gw) || barred(P, m.gw).has(m.in) || keptFrom(P, m.gw).has(m.out));
  };
  const most = P.mem?.hitsMax ?? null;
  const hitsAt = (e, x) => e.gws.find((s) => s.gw === x)?.hits ?? 0;
  const withinHits = (m) => most === null || m.ev.gws.every((s) => s.hits <= Math.max(most, hitsAt(before, s.gw)));
  const keptBy = /* @__PURE__ */ new Map();
  const keepsAll = (m) => {
    const chip = m.chips?.[g] ?? null;
    if (!keptBy.has(chip)) keptBy.set(chip, keptCells(P, g, chip));
    return keptBy.get(chip).every(([id, x]) => m.ev.gws.find((s) => s.gw === x)?.squad.includes(id) ?? true);
  };
  const measured = (p) => {
    if (!p || !allowed(p) || !chipMine && movesSig(p.moves) === mineFrom && !Object.keys(p.chips).length) return null;
    const m = measurePlan(ctx, P, g, p, asIs, false);
    return m && withinHits(m) && keepsAll(m) && !rebought(P, m.moves, m.ev, ownMoves) ? m : null;
  };
  const exactRoads = g === P.A ? new Set([P.base].filter(Boolean)) : /* @__PURE__ */ new Set();
  const choices = /* @__PURE__ */ new Map();
  const chipSrc = chipPreps(ctx, P);
  const chipBest = chipSrc.best;
  const squadOk = (c) => !SQUAD_CHIPS.has(c.chips?.[g]) || chipWeekOf(P, chipSrc, c.chips[g], g)?.gw === g;
  const rollOffered = !followed && !now.length && !chipMine && !P.pins.some((p) => p.id === `roll:${g}`);
  const early = /* @__PURE__ */ new Map();
  const sales = chipMine ? [] : suggestionsOf(ctx, P, g), singles = sales.filter((y) => !y.asked);
  const singleOf = (x, inn = x.in) => ({ moves: [...now.filter((y) => !(x.instead?.gw === g && y.out === x.instead.out && y.in === x.instead.in)), { gw: g, out: x.out, in: inn }], chips: {} });
  const plus = (c, m) => ({ moves: [...c.moves.filter((y) => y.out !== m.out && y.in !== m.in), { gw: g, out: m.out, in: m.in }], chips: {} });
  const partOf = (m) => {
    const x = singles.find((y) => sameMove2(y, m));
    return { x, one: x ? singleOf(x) : plus({ moves: now }, m) };
  };
  const fundOf = (m, adds, one) => {
    const others = adds.filter((o) => o !== m);
    const sets = (k, from = 0) => k === 0 ? [[]] : others.slice(from).flatMap((o, i) => sets(k - 1, from + i + 1).map((r) => [o, ...r]));
    for (let k = 1; k <= others.length; k++) {
      const by2 = sets(k).find((os) => fitsAt(ctx, P, g, os.reduce(plus, one), d0));
      if (by2) return by2;
    }
    return void 0;
  };
  const keeps = (c) => now.every((y) => c.moves.some((m) => sameMove2(m, y)));
  const groupOf = (gr) => gr.reduce(plus, { moves: now, chips: {} });
  const fundGroups = (c) => {
    const adds = unmade(c);
    if (chipMine || adds.length < 2 || Object.keys(c.chips).length || !keeps(c) || !fitsAt(ctx, P, g, c, d0)) return null;
    const grp = new Map(adds.map((m) => [m, [m]]));
    for (const m of adds) {
      const { one } = partOf(m);
      if (!keeps(one)) return null;
      if (fitsAt(ctx, P, g, one, d0)) continue;
      const by2 = fundOf(m, adds, one);
      if (!by2) return null;
      for (const o of by2) {
        const x = grp.get(m), y = grp.get(o);
        if (x !== y) {
          x.push(...y);
          for (const q of y) grp.set(q, x);
        }
      }
    }
    const groups = [...new Set(grp.values())];
    return groups.length > 1 && groups.every((gr) => gr.length === 1 || fitsAt(ctx, P, g, groupOf(gr), d0)) ? groups : null;
  };
  const splitOf = (c) => roots.has(forkKey(c, g)) ? null : fundGroups(c);
  const split = /* @__PURE__ */ new Map();
  const add = (c, e = null) => {
    const k = forkKey(c, g);
    if ((k !== yours || rollOffered) && squadOk(c) && allowed(c) && !choices.has(k)) {
      choices.set(k, c);
      if (e) early.set(k, e);
      const gs = splitOf(c);
      if (gs) split.set(k, gs);
    }
  };
  const groupsOf = (c) => (split.get(forkKey(c, g)) ?? splitOf(c) ?? []).map((gr) => ({ x: gr.length === 1 ? partOf(gr[0]).x : null, c: groupOf(gr) })).filter((q) => !q.x?.removed && !choices.has(forkKey(q.c, g)));
  const est = /* @__PURE__ */ new Map();
  const guess = (c, v) => {
    if (Number.isFinite(v)) {
      const k = forkKey(c, g);
      est.set(k, Math.max(est.get(k) ?? -Infinity, v));
    }
  };
  const known = /* @__PURE__ */ new Map(), seen = /* @__PURE__ */ new Set();
  const rankOf = (k) => Math.max(est.get(k) ?? -Infinity, ...(known.get(k) ?? []).map((p) => p.cmp?.delta ?? -Infinity));
  const extra = extraWeek(P, g), measureBy = takenBy(ctx, P);
  const sameMove2 = (a, b) => a.out === b.out && a.in === b.in;
  const earlyAt = (c) => {
    if (followed || extra || chipMine || Object.keys(c.chips).length || !now.every((y) => c.moves.some((m) => sameMove2(m, y)))) return null;
    const ms = c.moves.filter((m) => !now.some((y) => sameMove2(m, y)));
    if (!ms.length) return null;
    let d = d0, ev = null;
    for (const m of ms) {
      const r = addYours(ctx, P, g, m.out, m.in, d, measureBy);
      if (r.problem) return null;
      ({ draft: d, ev } = r);
    }
    return earlyOf(ctx, P, g, ms, ev, before, d0, measureBy);
  };
  const late = [];
  const owed = owedAt(P, w) ? owedRoad(ctx, P, g, { peek, prep }) : null;
  const depth = prep || !ctx.presolveOn?.() ? 0 : 2, tree = owed || followed ? [] : refusalRoads(ctx, P, g, { peek: true, depth });
  const rootIn = !!tree[0] && forkRead(tree[0].key) != null;
  const chain = tree.filter((n) => n.forced).slice(0, 1);
  const solverRoads = new Set([owed?.road, ...tree.filter((n) => !n.forced || chain.includes(n)).map((n) => n.road)].filter(Boolean));
  const forcedRoads = new Set(chain.map((n) => n.road)), forced = /* @__PURE__ */ new Set();
  const selfRoads = /* @__PURE__ */ new Map();
  const roots = /* @__PURE__ */ new Set(), parts = /* @__PURE__ */ new Set();
  const refused = refusedAt(P, g);
  for (const r of [...solverRoads, ...P.base ? [P.base] : []]) {
    const x = planOfRoad(ctx, P, r, g, d0);
    if (!x || x.choice.moves.some((m2) => refused.has(`${m2.out}>${m2.in}`))) continue;
    const rollIn = !x.choice.moves.length && !Object.keys(x.choice.chips ?? {}).length && forkRead(valuesKey(P, forkValues(ctx, P, g, x.choice))) != null;
    if (solverRoads.has(r) && forkKey(x.choice, g) === yours && !selfRoads.has(yours) && x.plan && !rollIn) {
      const own2 = !chipMine && movesSig(x.plan.moves) === mineFrom && !Object.keys(x.plan.chips).length, m2 = own2 ? null : measurePlan(ctx, P, g, x.plan, asIs, false);
      if (own2 || m2) selfRoads.set(yours, { road: r, m: m2 });
    }
    if (r === tree[0]?.road || r === owed?.road) roots.add(forkKey(x.choice, g));
    if (forcedRoads.has(r)) forced.add(forkKey(x.choice, g));
    if (!choices.has(forkKey(x.choice, g))) {
      const e = earlyAt(x.choice);
      if (e) late.push({ c: x.choice, e });
      else add(x.choice);
    }
    const s = x.plan && `${movesSig(x.plan.moves)}|${JSON.stringify(x.plan.chips)}`;
    if (!s || seen.has(s)) continue;
    seen.add(s);
    const m = measured(x.plan);
    const k = forkKey(x.choice, g);
    if (m && !heldOf(x.choice)) known.set(k, [...known.get(k) ?? [], { ...m, road: r, model: r === P.base, exact: exactRoads.has(r) || solverRoads.has(r) }]);
  }
  for (const chip of chipsAvail(P, g).filter((c) => SQUAD_CHIPS.has(c))) {
    if (plannedAt(P, chip, g) == null) {
      const c = { moves: [], chips: { [g]: chip } };
      add(c);
      guess(c, (keptBest(P, chipSrc, chip, g) ?? chipBest[chip])?.delta);
    }
  }
  const needs = /* @__PURE__ */ new Map(), pairOf2 = /* @__PURE__ */ new Map();
  const placed = /* @__PURE__ */ new Set();
  const plain = () => [...choices].filter(([k, c]) => c.moves.length && !Object.keys(c.chips).length && !needs.has(k) && !split.has(k) && !placed.has(k)).length;
  const room = () => plain() < FORK_MAX - 1;
  const otherBuys = (m, choiceOf, alts = room() ? ownAltsOf(ctx, P, w, m).slice(0, 2) : [], cap = true) => {
    for (const a of alts) {
      if (cap && !room()) break;
      const c = choiceOf(a.in), k = forkKey(c, g);
      if (!choices.has(k)) add(c, earlyAt(c));
      if (!cap && choices.has(k)) placed.add(k);
      guess(c, a.cmp?.delta);
    }
  };
  const swapIn2 = (m, inn) => ({ moves: now.map((x) => x === m ? { ...x, in: inn } : x), chips: {} });
  const single = (x) => {
    const c = singleOf(x);
    add(c, x.early);
    if (!x.removed) guess(c, x.cmp?.delta);
  };
  const offered = singles.filter((y) => !y.removed && !y.early);
  const offerGroups = (c) => {
    const gs = groupsOf(c), own2 = roots.has(forkKey(c, g));
    if (plain() + gs.length > FORK_MAX - 1) return false;
    for (const q of gs) {
      if (q.x) single(q.x);
      else add(q.c, earlyAt(q.c));
      if (own2) parts.add(forkKey(q.c, g));
    }
    return true;
  };
  for (const c of [...choices.values()]) if (split.has(forkKey(c, g))) offerGroups(c);
  for (const m of now) otherBuys(m, (inn) => swapIn2(m, inn));
  const leads = extra ? [] : offered.slice(0, 2);
  for (const x of leads) if (room()) single(x);
  const leadKeys = new Set(leads.map((x) => forkKey(singleOf(x), g)));
  const leadK = leads[0] ? forkKey(singleOf(leads[0]), g) : null;
  const partsOf = (c) => {
    const adds = unmade(c);
    if (chipMine || adds.length < 2 || Object.keys(c.chips).length || !fitsAt(ctx, P, g, c, d0)) return [];
    return adds.map((m) => {
      const { x, one } = partOf(m);
      return { m, x, one, k: forkKey(one, g), adds };
    }).filter((q) => !q.x?.removed && !leadKeys.has(q.k));
  };
  const pairSingles = (c) => {
    if (!choices.has(forkKey(c, g))) return;
    if (split.has(forkKey(c, g)) && !offerGroups(c)) return;
    const parts2 = partsOf(c).map((p) => ({ ...p, fit: choices.has(p.k) ? null : fitOf(ctx, P, g, p.one, d0) }));
    for (const { m, x, one, k, adds, fit } of [...parts2.filter((p) => !p.fit || p.fit.ok), ...parts2.filter((p) => p.fit && !p.fit.ok)]) {
      if (choices.has(k)) {
        if (!pairOf2.has(k)) pairOf2.set(k, forkKey(c, g));
        continue;
      }
      if (fit.ok) {
        if (!room()) continue;
        if (x) single(x);
        else add(one, earlyAt(one));
      } else {
        const by2 = fundOf(m, adds, one);
        if (!by2) continue;
        const funded = by2.reduce(plus, one), fk = forkKey(funded, g);
        if (fk !== forkKey(c, g)) {
          if (!choices.has(fk) && room()) {
            add(funded, earlyAt(funded));
            if (choices.has(fk)) pairOf2.set(fk, forkKey(c, g));
          }
          if (choices.has(fk)) continue;
        }
        needs.set(k, { ids: by2.map((o) => o.out), problems: fit.problems });
        add(one);
        if (!choices.has(k)) needs.delete(k);
      }
      if (choices.has(k)) pairOf2.set(k, forkKey(c, g));
    }
  };
  for (const c of [...choices.values()]) pairSingles(c);
  for (const x of leads) otherBuys(x, (inn) => singleOf(x, inn));
  for (const x of offered) {
    if (!room()) break;
    single(x);
  }
  late.push(...singles.filter((y) => !y.removed && y.early).map((x) => {
    const c = singleOf(x);
    if (!choices.has(forkKey(c, g))) guess(c, x.cmp?.delta);
    return { c, e: x.early };
  }));
  for (const { c, e } of late.sort((a, b) => rankOf(forkKey(b.c, g)) - rankOf(forkKey(a.c, g)))) {
    if (!room()) break;
    add(c, e);
    pairSingles(c);
  }
  for (const x of singles.filter((y) => y.removed)) single(x);
  const listed = new Set(choices.keys());
  for (const a of placesAsked(P, g)) {
    const m = now.find((y) => Number(y.in) === a), x = m ? null : sales.find((y) => Number(y.out) === a && !y.removed);
    if (m) otherBuys(m, (inn) => swapIn2(m, inn), ownAltsOf(ctx, P, w, m, true).slice(0, PLACE_ALTS), false);
    else if (x) otherBuys(x, (inn) => singleOf(x, inn), [...x.asked ? [x] : [], ...ownAltsOf(ctx, P, w, x, true).slice(0, PLACE_ALTS)], false);
  }
  const placeOnly = new Set([...choices.keys()].filter((k) => !listed.has(k)));
  const roll = { moves: [], chips: {} };
  add(roll);
  const rollK = forkKey(roll, g);
  const chipOwn = chipMine ? { moves: [], chips: { [g]: chipMine } } : null;
  const refs = new Map(followed ? [] : [[rollK, roll], ...now.length && !chipMine ? [[yours, { moves: now, chips: {} }]] : [], ...chipOwn ? [[yours, chipOwn]] : []]);
  const endsOf = (c) => SQUAD_CHIPS.has(c.chips?.[g]) ? [] : c.moves.filter((m) => m.gw === g);
  const refKeyOf = (c) => {
    if (heldOf(c)) return `${rollK}|held`;
    const ids2 = [...chainOf(P, g, endsOf(c)).chain.keys()].sort();
    return ids2.length ? `${rollK}|${ids2.join(",")}` : rollK;
  };
  if (!followed) for (const c of [...[...choices].filter(([k]) => !split.has(k)).map(([, c2]) => c2), ...chipOwn ? [chipOwn] : []]) {
    const k = refKeyOf(c);
    if (!refs.has(k) && fitsAt(ctx, P, g, c, d0)) refs.set(k, heldOf(c) ? { ...roll, held: true } : { ...roll, ends: endsOf(c) });
  }
  const heldK = `${rollK}|held`, wcRow = { moves: [], chips: { [g]: "wc" } };
  const apart = !CHIPS_OFF && !followed && !refs.has(heldK) && chipMine !== "wc" && chipsAvail(P, g).includes("wc") && plannedAt(P, "wc", g) == null && fitsAt(ctx, P, g, wcRow, d0) ? [[heldK, { ...roll, held: true }]] : [];
  const landOf = (c) => {
    const chip = c.chips?.[g];
    if (followed || now.length || c.moves.length || !SQUAD_CHIPS.has(chip)) return null;
    const it = prepItems(ctx, P).find((x) => x.chip === chip && x.gw === g);
    if (it) return it;
    const e = chipEdit(P, g, chip), values = valuesFor(ctx, e.pins, e.drop);
    return { chip, gw: g, values, key: valuesKey(P, values) };
  };
  const fhK = forkKey({ moves: [], chips: { [g]: "fh" } }, g), fhRow = { moves: [], chips: { [g]: "fh" } }, fhLater = `${fhK}|later`;
  if (!followed && !chipMine && (!choices.has(fhK) || landOf(choices.get(fhK))) && chipsAvail(P, g).includes("fh") && plannedAt(P, "fh", g) == null && chipsAsked(ctx).includes(g) && fitsAt(ctx, P, g, fhRow, d0)) apart.push([fhLater, fhRow]);
  const ready = (list2, c) => {
    const ex = list2.filter((p) => p.exact);
    return { ...(ex.length ? ex : list2).sort(byGain)[0], state: "ready", choice: c };
  };
  const self = (c, counts = null) => ({ state: "ready", choice: c, self: true, moves: [], chips: c.chips, draft: d0, ev: asIs, cmp: compare2(ctx, asIs, asIs), hits: {}, road: null, model: false, ...counts ? { counts } : {} });
  const asks = [...new Map([...choices, ...refs, ...apart])].filter(([k]) => !split.has(k)).flatMap(([k, c]) => {
    if (c.held && !now.length && !chipMine) return [{ k, c, roads: [], same: true }];
    if (!fitsAt(ctx, P, g, c, d0)) return needs.has(k) ? [{ k, c, roads: [], need: needs.get(k) }] : [];
    const land2 = choices.has(k) ? landOf(c) : null;
    if (land2) return [{ k, c, roads: [], land: land2, ask: { key: land2.key, values: land2.values, gw: g, ...prep ? { prep } : {} } }];
    if (selfRoads.has(k)) return [{ k, c, roads: [], counts: selfRoads.get(k) }];
    if (k === yours && k !== rollK && refs.has(k) && tree[0] && !tree[0].road && !prep) return [{ k, c, roads: [], root: true }];
    const roads = known.get(k === fhLater ? fhK : k) ?? [];
    if (roads.some((p) => p.exact)) {
      if (k === rollK && !prep) {
        const values2 = forkValues(ctx, P, g, c);
        noteAnswered(ctx, P, { key: valuesKey(P, values2), values: values2, gw: g, said: "No transfer" }, roads.find((p) => p.exact).road);
      }
      return [{ k, c, roads }];
    }
    if (prep && !refs.has(k) && !parts.has(k)) return [];
    const values = forkValues(ctx, P, g, c), key = valuesKey(P, values);
    if (!refs.has(k) && !parts.has(k) && !placeOnly.has(k) && !placed.has(k) && c.moves.length && !Object.keys(c.chips).length && !forkRead(key) && !forkFlights().some(([, f]) => f.key === key)) return [];
    return [{ k, c, roads, ask: { key, values, gw: g, said: k === rollK ? "No transfer" : parts.has(k) ? "One move alone" : "A choice", ...prep ? { prep, ...refs.has(k) ? { need: true } : {} } : k === rollK ? { card: true } : {} } }];
  });
  const tier = (k) => (early.has(k) || early.has(pairOf2.get(k)) && !split.has(pairOf2.get(k)) ? 2 : 0) + (pairOf2.has(k) && !split.has(pairOf2.get(k)) ? 1 : 0);
  asks.sort((x, y) => tier(x.k) - tier(y.k) || rankOf(y.k) - rankOf(x.k));
  let letGo = false;
  if (!peek && !prep) AHEAD.at = { P, g };
  const rootOn = !!tree[0] && !tree[0].road;
  for (const [lane, f] of peek || prep ? [] : forkFlights()) {
    if (asks.some((a) => a.ask?.key === f.key) || f.key === owed?.key || f.root || tree.some((n) => n.key === f.key) || rootOn && f.side && f.gw === g && !f.ahead || sameView(f.P, P) && (f.gw > g || f.side && f.gw === g) && !f.ahead || aheadAsks(f, P, g)) continue;
    f.cancel?.();
    if (lane) FORK_FLIGHTS.delete(lane);
    else PAIR.flight = null;
    letGo = true;
  }
  if (letGo) PLANS.set(P, by = { rev: ++PAIR.rev, gw: /* @__PURE__ */ new Map() });
  const chipOn = (chip, r, p) => chip === "fh" ? { ...r, chips: { [g]: chip }, draft: weekOnto(r.draft, p.draft, g) } : p;
  const solveOf = ({ k, c, roads, ask, same, need, land: land2, counts, root }) => {
    if (same) return self(c);
    if (counts) return counts.m ? ready([{ ...counts.m, road: counts.road, model: false, exact: true }], c) : self(c, counts.road);
    if (root) return { state: "solving", choice: c, wait: "flight" };
    if (need) return { state: "failed", choice: c, why: "needs", needs: need.ids, problems: need.problems };
    if (!ask) return ready(roads, c);
    const key = ask.key;
    const kept = land2 ? PREPS.get(key) : null;
    const refAt = refs.has(k) ? `${P.entry}|${g}|${k}` : null, last = refAt && FORK_REFS.get(refAt);
    if (last && !forkRead(key) && last.version === P.b.version && rootStill(last.values, ask.values, last.road)) forkKept(key, { ...last.road, key, values: ask.values });
    if (!peek && !prep && !kept && c.moves.length && !Object.keys(c.chips).length && !refs.has(k) && !parts.has(k) && !placed.has(k) && !roots.has(k) && !ROWS_WANT.has(g) && !forkRead(key) && !forkFlights().some(([, f]) => f.key === key)) return { state: "idle", choice: c };
    if (lean && !peek && !kept && !refs.has(k) && !roots.has(k) && !ROWS_WANT.has(g) && k !== leadK && !forkRead(key) && !forkFlights().some(([, f]) => f.key === key)) return { state: "idle", choice: c };
    const got = kept?.weeks ? kept : peek ? forkRead(key) : forkAsk(ctx, P, ask);
    if (land2 && !peek && got?.weeks && kept !== got) prepKeep(key, got);
    const row = rowOf(c, k, got, roads, land2);
    const from = row?.road?.weeks ? row.road : row?.counts?.weeks ? row.counts : got?.weeks ? got : null;
    if (refAt && from && (got?.weeks || !FORK_REFS.has(refAt))) FORK_REFS.set(refAt, { version: P.b.version, values: ask.values, road: from });
    return row !== void 0 ? row : { state: "solving", choice: c, wait: forkFlights().some(([, f]) => f.key === key) ? "flight" : P.healing ? "heal" : "queue" };
  };
  const rowOf = (c, k, got, roads, land2) => {
    if (got && typeof got === "object") {
      const x = planOfRoad(ctx, P, got, g, d0);
      let p = x?.plan && forkKey(x.plan, g) === forkKey(c, g) ? x.plan : null;
      if (p && !chipMine && movesSig(p.moves) === mineFrom && !Object.keys(p.chips).length) return roads.length ? ready(roads, c) : refs.has(k) ? self(c, got) : null;
      if (p && land2?.chip === "fh") {
        const f = solveK(fhLater), r = f?.state === "ready" ? f : solved.get(rollK);
        if (f?.state === "solving" || r?.state === "solving") return { state: "solving", choice: c, wait: (f?.state === "solving" ? f : r).wait };
        if (r?.state === "ready") p = chipOn("fh", r, p);
      }
      const m = measured(p);
      if (m) return ready([...roads, { ...m, road: got, model: false }], c);
    }
    const why = got === "infeasible" ? "infeasible" : got !== "error" ? "nofit" : ctx.store.get("conn")?.state === "offline" || !ctx.api?.solve ? "offline" : "error";
    if (got) return roads.length ? ready(roads, c) : { state: "failed", choice: c, why };
    return void 0;
  };
  const solved = /* @__PURE__ */ new Map(), byK = new Map(asks.map((a) => [a.k, a]));
  const solveK = (k) => {
    if (!solved.has(k) && byK.has(k)) solved.set(k, solveOf(byK.get(k)));
    return solved.get(k);
  };
  for (const a of [...asks.filter((x) => refs.has(x.k)), ...asks.filter((x) => !refs.has(x.k))]) solveK(a.k);
  const rootAsked = !peek && !owed && !followed ? refusalRoads(ctx, P, g, { prep, depth: 0 }) : null;
  const out = asks.filter((a) => choices.has(a.k)).map((a) => solved.get(a.k)).filter((x) => x && (!x.self || rollOffered));
  const alone = (x) => {
    if (followed || x.state !== "ready") return x;
    const draft = planTakeDraft(ctx, P, g, x.draft, flatMoves(x.draft).filter((m2) => m2.gw === g));
    const m = measurePlan(ctx, P, g, { ...x, draft }, before);
    return m ? { ...x, taken: draft, ev: m.ev, alone: m.cmp, full: x.cmp, fullEv: x.ev } : { state: "failed", choice: x.choice, why: "nofit" };
  };
  const ref = followed ? null : solved.get(rollK) ?? null;
  const ours = solved.get(yours)?.state === "ready" ? solved.get(yours) : null;
  const yoursToo = ours && yours !== rollK ? ours : null;
  const refOf = (c) => {
    const r = solved.get(refKeyOf(c));
    return r && r.state !== "failed" ? r : ref;
  };
  const own = refs.has(yours) && yours !== rollK && !chipMine ? solved.get(yours) : null;
  const mineRoad = P.comparable ? P.road : null;
  const countRoad = (x) => x?.road ?? (x?.self ? x.counts ?? mineRoad : null);
  const yourRoad = ours ? countRoad(ours) : mineRoad;
  const vsRef = (x) => {
    if (followed || x.state !== "ready") return x;
    const r = refOf(x.choice);
    if (r?.state === "solving") return { state: "solving", choice: x.choice, wait: r.wait };
    if (r?.state !== "ready") return { ...x, cmp: x.alone };
    if (own?.state === "solving" && !heldOf(x.choice)) return { state: "solving", choice: x.choice, wait: own.wait };
    const vsMine = chipMine || now.length && (heldOf(x.choice) || !yoursToo) ? ownCount(ctx, x.alone, x.road, yourRoad, g) : yoursToo ? ownCount(ctx, compare2(ctx, x.fullEv, yoursToo.ev), x.road, countRoad(yoursToo), g) : null;
    return { ...x, cmp: vsMine ?? ownCount(ctx, compare2(ctx, x.fullEv, r.ev), x.road, countRoad(r), g), refEv: r.ev, refRoad: countRoad(r), vsRoll: true, refRow: !vsMine && forkKey(x.choice, g) === rollK, ...vsMine ? { vsMine } : {} };
  };
  const rolls = (x) => rollOffered && !x.choice.moves.length && !Object.keys(x.choice.chips).length;
  const gone = [...removedAt(P, g)].map((k) => k.split(">"));
  const goneOut = new Set(gone.map(([o]) => o)), goneIn = new Set(gone.map(([, i]) => i));
  const yoursAgain = (x) => {
    const adds = x.choice.moves.filter((m) => m.gw === g && !now.some((y) => sameMove2(y, m)));
    return adds.length > 0 && adds.every((m) => goneOut.has(String(m.out)) && goneIn.has(String(m.in)));
  };
  const each = out.map(alone).map(vsRef).map((x) => roots.has(forkKey(x.choice, g)) || parts.has(forkKey(x.choice, g)) ? { ...x, solver: true } : x).map((x) => rolls(x) ? { ...x, rolls: true } : x).map((x) => placeOnly.has(forkKey(x.choice, g)) ? { ...x, placeOnly: true } : x).map((x) => yoursAgain(x) ? { ...x, removed: true } : x).map((x) => early.has(forkKey(x.choice, g)) && !(x.cmp?.count && x.cmp.delta > 0.05) ? { ...x, early: early.get(forkKey(x.choice, g)) } : x).map((x) => placed.has(forkKey(x.choice, g)) ? { ...x, placed: true } : x).filter((x) => !forced.has(forkKey(x.choice, g)) || showingAt(P, g)).map((x) => forced.has(forkKey(x.choice, g)) ? { ...x, forced: true } : x);
  const all = each.filter((x) => x.state !== "idle");
  const done = all.filter((x) => x.state === "ready");
  const gainOf = (x) => x.cmp?.count ? x.cmp.delta : x.full.delta;
  const top = done.filter((x) => !x.refRow && !x.early && x.vsRoll && !heldOf(x.choice)).sort((a, b) => gainOf(b) - gainOf(a))[0] ?? null;
  const topHeld = done.filter((x) => x.vsRoll && heldOf(x.choice)).sort(byGain)[0] ?? null;
  const against = (x) => {
    const cs = [
      top && { vsBest: ownCount(ctx, compare2(ctx, x.fullEv, top.fullEv), countRoad(x), top.road, g), best: top, bestFrom: x.fullEv },
      topHeld && { vsBest: ownCount(ctx, compare2(ctx, topHeld.refEv, topHeld.fullEv), topHeld.refRoad, topHeld.road, g), best: topHeld, bestFrom: topHeld.refEv }
    ].filter(Boolean);
    return cs.find((c) => !clearGain(c.vsBest)) ?? cs.sort((a, b) => (a.vsBest.ref ?? a.vsBest.delta) - (b.vsBest.ref ?? b.vsBest.delta))[0] ?? {};
  };
  const ranked = [
    ...done.map((x) => x.refRow ? { ...x, ...against(x) } : x).sort(byGain),
    ...all.filter((x) => x.state === "failed"),
    ...all.filter((x) => x.state === "solving")
  ];
  const list = ranked;
  if (ref?.state === "ready") Object.assign(list, { ref, mine: ours });
  Object.assign(list, { mineRoad: yourRoad, countRoad });
  const mineRef = chipOwn ? refOf(chipOwn) : ref;
  if (chipOwn && mineRef?.state === "ready") list.mineRef = mineRef;
  const onto = chipMine === "fh" ? ours ?? (solved.get(yours)?.state === "failed" ? mineRef : null) : mineRef;
  if (chipOwn && onto?.state === "ready") {
    const p = chipOn(chipMine, onto, { draft: d0 });
    list.mine = { ...p, ev: asTaken(ctx, P, p.draft, g, {}, false) };
  }
  const flying = (n) => forkFlights().some(([, f]) => f.key === n.key);
  const waitsOn = (n) => !n.road && forkRead(n.key) == null && (flying(n) || !tapSpent());
  const rootOut = showingAt(P, g) && !!tree[0] && !tree[0].forced && waitsOn(tree[0]);
  const on = showingAt(P, g);
  const rowOut = on && chain.some((n) => n.road) && !list.some((x) => x.forced) && each.some((x) => x.forced && x.state === "idle") && (forkFlights().length > 0 || !tapSpent());
  list.forcedOut = rootOut || on && !!chain[0] && waitsOn(chain[0]) || rowOut;
  list.forcedFlying = on && tree.some((n) => n.forced && !n.road && flying(n));
  list.owedOut = !!owed && (waitsOn(owed) || !!owed.road && list.some((x) => x.state === "solving" && roots.has(forkKey(x.choice, g))));
  const rootNow = !!tree[0] && (!rootIn && forkRead(tree[0].key) != null || !tree[0].road && !!rootAsked?.[0]?.road);
  if (rootNow) forkAgain(ctx, 0);
  list.pending = list.owedOut || !followed && ([ref, mineRef, solved.get(yours)].some((x) => x?.state === "solving") || !prep && !now.length && !!tree.length && !rootIn);
  const counted2 = /* @__PURE__ */ new Map();
  const chipApart = (chip, road) => {
    const p = planOfRoad(ctx, P, road, g, d0)?.plan;
    if (p?.chips?.[g] !== chip) return null;
    const r = chip === "wc" ? solved.get(heldK) : ref;
    if (r?.state === "solving") return { wait: true };
    if (r?.state !== "ready") return null;
    const f = chip === "fh" ? solved.get(fhLater) : null;
    if (f?.state === "solving") return { wait: true };
    const m = measured(chipOn(chip, f?.state === "ready" ? f : r, p));
    if (!m) return null;
    if (now.length && !chipMine && own?.state === "solving") return { wait: true };
    if (chipMine || now.length) {
      const v = chip === "fh" && !chipMine && yoursToo ? ownCount(ctx, compare2(ctx, m.ev, yoursToo.ev), road, countRoad(yoursToo), g) : ownCount(ctx, alone({ ...m, state: "ready", choice: { moves: [], chips: { [g]: chip } } }).alone, road, yourRoad, g);
      return v ? { cmp: v, vs: COPY.planVs(true) } : null;
    }
    return { cmp: vsRollOf(ctx, m, r, g, road, countRoad(r)), vs: COPY.planVsRoll };
  };
  list.chipOf = (chip, road) => {
    if (followed || !road || !SQUAD_CHIPS.has(chip)) return null;
    if (counted2.get(chip)?.road !== road) counted2.set(chip, { road, out: chipApart(chip, road) });
    return counted2.get(chip).out;
  };
  list.refWait = ref?.state === "solving";
  list.sig = [P.b.version, ...asks.map((a) => `${choices.has(a.k) ? "" : "ref:"}${a.ask?.key ?? a.k}`).sort()].join("\n");
  list.full = !room();
  if (peek || prep) return list;
  by.gw.set(g, list);
  if (!list.pending) {
    const best = list.filter((x) => x.solver && x.state === "ready" && !x.refRow && !x.placeOnly).reduce((m, x) => !m || x.cmp.delta > m.cmp.delta ? x : m, null);
    const adds = best?.choice.moves.filter((m) => (m.gw ?? g) === g && !now.some((y) => sameMove2(y, m))) ?? [];
    if (!owed && !followed && depth) refusalRoads(ctx, P, g, { prep, depth, lead: adds[0] ?? null });
    if (!adds.length && !showingAt(P, g) && !list.some((x) => x.solver && x.state === "solving")) prepNext(ctx, P, g);
  }
  return list;
}
var settledList = (list) => !list.pending && !list.some((x) => x.state === "solving");
var nextGw = (P, g) => P.gws.reduce((m, x) => x > g && (m === null || x < m) ? x : m, null);
function prepNext(ctx, P, g) {
  if (!ctx.presolveOn?.()) return;
  if (forkFlights().some(([, f]) => f.ahead && sameView(f.P, P))) return;
  const nx = nextGw(P, g);
  if (nx !== null) plansOf(ctx, P, nx, { prep: true });
}
var plansListed = (ctx, P, g) => {
  const by = PLANS.get(P);
  const got = by?.rev === PAIR.rev ? by.gw.get(g) : null;
  if (got) return got;
  let pk = PEEKS.get(P);
  if (!pk || pk.rev !== PAIR.rev || pk.gen !== PREP.gen) PEEKS.set(P, pk = { rev: PAIR.rev, gen: PREP.gen, gw: /* @__PURE__ */ new Map() });
  if (!pk.gw.has(g)) pk.gw.set(g, plansOf(ctx, P, g, { peek: true }));
  return pk.gw.get(g);
};
var PEEKS = /* @__PURE__ */ new WeakMap();
var choiceVs = (P, pl) => pl.vsMine ? COPY.planVs(true) : pl.vsRoll ? COPY.planVsRoll : COPY.planVs(mineAny(P));
var yoursAt = (w) => !!w && (SQUAD_CHIPS.has(w.chip) || w.moves.length > 0);
function chipShown(ctx, P, g, c) {
  if (!SQUAD_CHIPS.has(c) || !P.gws.includes(g)) return null;
  const pl = plansListed(ctx, P, g).find((x) => x.choice.chips?.[g] === c && !x.choice.moves.length && x.state !== "failed");
  return !pl ? null : pl.state === "ready" ? { cmp: pl.cmp, pays: plPays(pl), vs: choiceVs(P, pl) } : { wait: true };
}
function chipNumber(ctx, P, g, c, pre = null) {
  if (P.mem?.hold && SQUAD_CHIPS.has(c) && weekOf(P, g)?.chip === c) {
    const v = chipWeekGain(ctx, P, g, (x) => plansListed(ctx, P, x));
    return v.cmp ? { cmp: v.cmp, vs: v.vs } : v.wait ? { wait: true } : null;
  }
  const shown = chipShown(ctx, P, g, c);
  if (shown || !P.mem?.hold || !SQUAD_CHIPS.has(c) || !P.gws.includes(g)) return shown;
  if (pre?.state === "solving") return { wait: true };
  return pre?.state === "ready" ? plansListed(ctx, P, g).chipOf?.(c, pre.road) ?? null : null;
}
var approxAt = (P, g) => (P.mark ?? P.approx).has(g);
function weekRollOf(ctx, P, w, listed = (g) => plansOf(ctx, P, g)) {
  const sq = !!squadWeek(w);
  if (!sq && !w.moves.length || approxAt(P, w.gw)) return null;
  const L = listed(w.gw) ?? {};
  const ref = sq ? L.mineRef : L.ref;
  const r = ref && L.mine ? vsRollOf(ctx, L.mine, ref, w.gw, L.mineRoad, L.countRoad?.(ref)) : null;
  const took = r && !sq && tookCmp(P, w);
  return took ? { ...r, delta: took.delta, ref: took.ref, shown: took.shown, label: took.label } : r;
}
var vsRollOf = (ctx, mine, ref, g, a, b) => ({ ...ownCount(ctx, compare2(ctx, mine.ev, ref.ev), a, b, g), road: ref.road, ev: ref.ev, mine: mine.ev, counted: [a, b] });
function plansWait(plans) {
  const of = plans.filter((x) => !x.placeOnly);
  const n = of.length, done = of.filter((x) => x.state !== "solving").length;
  return done < n ? { i: done + 1, n } : null;
}
var weekWait = (plans, lit) => lit ? null : plansWait(plans.filter(lights));
var lights = (x) => !!x.solver || !!x.refRow || x.wait === "heal" || Object.keys(x.choice?.chips ?? {}).length > 0;
var lineNotices = (notices, live = false) => {
  const loud = notices.filter((n) => !n.quiet);
  return { problem: loud[0] ?? null, more: Math.max(0, loud.length - 1), lineup: live ? null : notices.find((n) => n.quiet)?.text ?? null };
};
function planWeeks(P, pl, from, tag = true) {
  const nm = P.L.name;
  return P.gws.filter((x) => x >= from).map((x) => {
    const chip = pl.chips?.[x] ?? pl.yours?.[x] ?? null, ms = pl.moves.filter((m) => m.gw === x);
    const hit = pl.hits?.[x] ? ` (${MINUS}${HIT_COST * pl.hits[x]})` : "";
    const at = tag ? `GW${x} ` : "";
    if (SQUAD_CHIPS.has(chip)) return [x, `${at}${chipName(chip)}`];
    const moves = ms.map((m) => `${nm(m.out)} \u2192 ${nm(m.in)}`).join(" + ");
    return ms.length || chip ? [x, `${at}${[moves, chip ? chipName(chip) : ""].filter(Boolean).join(" \xB7 ")}${hit}`] : null;
  }).filter(Boolean);
}
var planOfEv = (ev) => {
  const gws = ev?.gws || [];
  return {
    moves: gws.flatMap((s) => viewOfState(s).moves.map((m) => ({ gw: s.gw, ...m }))),
    chips: Object.fromEntries(gws.filter((s) => s.chip).map((s) => [s.gw, s.chip])),
    hits: Object.fromEntries(gws.map((s) => [s.gw, s.hits ?? 0]))
  };
};
function countedAfter(P, g, sides) {
  const weeks = sides.map(([name, ev]) => [name, planWeeks(P, planOfEv(ev), g + 1).map(([, t]) => t)]);
  return weeks.some(([, ws]) => ws.length) ? { head: COPY.countedAfter(g), lines: weeks.map(([name, ws]) => COPY.countedLine(name, ws)) } : null;
}
function squadChanges(P, g, ev, keep2 = []) {
  const s = ev?.gws.find((x) => x.gw === g);
  if (!s) return [];
  const kept = keptCells(P, g, s.chip ?? null).filter(([id, x]) => x === g && s.squad.includes(id)).map(([id]) => ({ in: id, kept: true }));
  return [...viewOfState(s, P.L, keep2).moves, ...kept];
}
var litEdges = (a, e) => !!e.taken?.some((t) => Number(t.in) !== Number(a));
var keepNewest = (map, k, v, max) => {
  map.delete(k);
  map.set(k, v);
  while (map.size > max) map.delete(map.keys().next().value);
  return v;
};
var VIEWS = /* @__PURE__ */ new WeakMap();
var VIEW_N = 0;
function weekKey(P, g, plans) {
  if (plans?.sig != null) return `${g}|${plans.sig}`;
  if (!VIEWS.has(P)) VIEWS.set(P, `view:${++VIEW_N}`);
  return `${g}|${VIEWS.get(P)}`;
}
var SETTLED = { last: null, by: /* @__PURE__ */ new Map() };
var SETTLED_MAX = 64;
function weekSettled(P, g, plans, now = Date.now()) {
  const k = weekKey(P, g, plans);
  const s = keepNewest(SETTLED.by, k, SETTLED.by.get(k) ?? { settled: false, done: 0, at: now }, SETTLED_MAX);
  const held = plans.filter(lights), done = held.filter((x) => x.state !== "solving").length;
  const heal = plans.some((x) => x.state === "solving" && x.wait === "heal");
  if (SETTLED.last !== k || done > s.done || heal) s.at = now;
  SETTLED.last = k;
  s.done = done;
  if (!plans.pending && (done === held.length || now - s.at >= PAIR_HOLD_MS)) s.settled = true;
  return s.settled && !heal && !plans.pending;
}
var settleDue = (k) => {
  const s = SETTLED.by.get(k);
  return s && !s.settled ? s.at + PAIR_HOLD_MS : null;
};
var settlesAt = (P, g, plans) => settleDue(weekKey(P, g, plans));

// js/m/ahead/plans/forks.js
function planOfRoad(ctx, P, r, g, d0) {
  const last = Math.min(roadLast(r), g);
  const rd = roadDraft(ctx, r), mine = flatMoves(d0), made = flatMoves(rd).filter((m) => m.gw <= last), own = made.filter((m) => m.gw >= g);
  const chipAt = (d, x) => (d === rd && x > last ? d0 : d).chips?.[x] ?? null;
  const sq = SQUAD_CHIPS.has(chipAt(rd, g));
  const wcBack = !sq && chipAt(d0, g) === "wc";
  const theirs = [...made, ...wcBack ? [] : mine.filter((m) => m.gw > last && !madeEarlier(own, m))];
  const at = (ms, x) => ms.filter((m) => m.gw === x).map((m) => `${m.out}>${m.in}`).sort().join(",");
  if (P.gws.some((x) => x < g && at(theirs, x) !== at(mine, x))) return null;
  const choice = { moves: sq ? [] : theirs.filter((m) => m.gw === g), chips: sq ? { [g]: chipAt(rd, g) } : {} };
  const later = P.gws.filter((x) => x > g);
  const yours = Object.fromEntries(later.map((x) => [x, squadWeek(weekOf(P, x))]).filter(([, c]) => c));
  const otherBoost = [g, ...later].some((x) => !SQUAD_CHIPS.has(chipAt(rd, x)) && chipAt(rd, x) !== (SQUAD_CHIPS.has(chipAt(d0, x)) ? null : chipAt(d0, x)));
  if (otherBoost || later.some((x) => (SQUAD_CHIPS.has(chipAt(rd, x)) || yours[x]) && chipAt(rd, x) !== (yours[x] ?? null)) || !wcBack && ownAfter(P, g).some((m) => !theirs.some((y) => sameMove(y, m)))) return { choice, plan: null };
  const moves = theirs.filter((m) => m.gw >= g && P.gws.includes(m.gw) && !(sq && m.gw === g) && !yours[m.gw]);
  let draft = withMoves(d0, [...mine.filter((m) => m.gw < g), ...theirs.filter((m) => m.gw >= g && P.gws.includes(m.gw))]);
  if (sq) draft = setChip(draft, g, chipAt(rd, g));
  else if (SQUAD_CHIPS.has(chipAt(d0, g))) draft = setChip(draft, g, null);
  return { choice, plan: { moves, chips: choice.chips, yours, draft } };
}
var roadLast = (r) => num(r?.values?.to) ?? Math.max(...(r?.weeks || []).map((w) => Number(w.gw)), -Infinity);
function asTaken(ctx, P, d, from, score = {}, held = true) {
  const I = info(ctx);
  let x = d;
  for (const g of P.gws) if (g >= from && !weekOf(P, g)?.lineup && x.lineups?.[g]) x = setLineup(x, g, null);
  const run = (y2) => evaluate({ base: baseOf(ctx), players: I.d.players, draft: y2, horizon: I.gws, ...score });
  const ev = run(x);
  if (!held || !P.mem?.hold) return ev;
  let y = x;
  for (const s of ev.gws) {
    const lu = s.gw >= from && P.gws.includes(s.gw) && !weekOf(P, s.gw)?.lineup ? solvedLineup([P.road, P.base], s.gw, s.squad, s.chip ?? null) : null;
    if (lu) y = setLineup(y, s.gw, lu);
  }
  return y === x ? ev : run(y);
}
var PLAN_BASE = /* @__PURE__ */ new WeakMap();
function planBaseline(ctx, P, g, held = true) {
  let m = PLAN_BASE.get(P);
  if (!m) PLAN_BASE.set(P, m = /* @__PURE__ */ new Map());
  const k = `${g}:${held}`;
  if (!m.has(k)) m.set(k, asTaken(ctx, P, draftOf(ctx), g, {}, held));
  return m.get(k);
}
var takenBy = (ctx, P) => (d, from) => asTaken(ctx, P, d, from);
function measurePlan(ctx, P, g, p, before, held = true) {
  const ev = asTaken(ctx, P, p.draft, g, {}, held);
  if (problemOf(ctx, ev, g)) return null;
  const hitsAt = (e, x) => e.gws.find((s) => s.gw === x)?.hits ?? 0;
  const hits = Object.fromEntries(P.gws.map((x) => [x, Math.max(0, hitsAt(ev, x) - hitsAt(before, x))]).filter(([, n]) => n > 0));
  return { ...p, ev, cmp: compare2(ctx, ev, before), hits };
}
function forkValues(ctx, P, g, c, more = []) {
  const squad = SQUAD_CHIPS.has(c.chips?.[g]);
  const drop = [...new Set((weekOf(P, g)?.moves || []).map((m) => pinOfMove(P, { ...m, gw: g })?.id).filter(Boolean))];
  if (!squad && repicks(P, g)) drop.push(...P.pins.filter((p) => p.id === `hits:${g}`).map((p) => p.id));
  const extra = [...more];
  if (!squad) {
    const now = c.moves.filter((m) => m.gw === g);
    extra.push(...chainOf(P, g, c.ends ?? now).chain.values(), ...now.map((m) => pinSell(m.out, g, P.end, { in: m.in })), pinRoll(g, now.length));
  }
  for (const [x, chip] of Object.entries(c.chips || {})) {
    const e = chipEdit(P, Number(x), chip);
    extra.push(...e.pins);
    drop.push(...e.drop);
  }
  if (chipBackOf(P, g, c)) {
    const o = chipOffParts(P, g, { locked: true });
    extra.push(...o.pins);
    drop.push(...o.drop);
  }
  const cap = hitCap(P.base) ?? 2;
  const ruled = (y) => P.pins.some((p) => p.id === `hits:${y}`);
  const follow = !(P.mem?.hold && (c.chips?.[g] === "wc" || c.held));
  if (follow) for (const x of P.gws.filter((y) => y > g && !SQUAD_CHIPS.has(c.chips?.[y]) && !squadWeek(weekOf(P, y)) && !ruled(y))) extra.push(pinHits(cap, x));
  const rolled = new Set(String(valuesFor(ctx, extra, drop).no_buys_gw ?? "").split(",").filter(Boolean).map(Number));
  const held = P.gws.filter((x) => x < g && !rolled.has(x)).flatMap((x) => (weekOf(P, x)?.squad ?? []).map((id) => [id, x, x]));
  const all = held.length ? [...more, makePin({ id: "fork:before", kind: "road", label: "Your weeks before", gw: P.A, must: held }), ...extra.slice(more.length)] : extra;
  return { ...noHitsFrom(P, g, valuesFor(ctx, all, drop), true), to: g };
}
var FORK_ROADS = /* @__PURE__ */ new Map();
var FORK_ROADS_MAX = 96;
function answeredBy(P, key, values) {
  const v = `${P.b?.version}|`, solved = [...FORK_ROADS].filter(([k, r2]) => k.startsWith(v) && r2?.weeks?.length && r2.values).map(([, r2]) => r2);
  const model = P.base?.weeks?.length && P.base.values ? [P.base] : [];
  const to = num(values.to), past = (x) => to != null && (x.values?.to == null || num(x.values.to) > to);
  const r = model.find((x) => valuesKey(P, x.values) === key) ?? [...model, ...solved].find((x) => (!past(x) || x.windows?.[to] != null) && rootStill(x.values, values, x));
  if (r) globalThis.__fcTrace?.("answered", r.key);
  const cut = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([t, by]) => [t, Object.fromEntries(Object.entries(by ?? {}).filter(([x]) => Number(x) <= to))]).filter(([, by]) => Object.keys(by).length));
  const own = r && past(r) ? { weeks: r.weeks.filter((w) => Number(w.gw) <= to), ...r.objective ? { objective: cut(r.objective) } : {}, ...r.windows ? { windows: Object.fromEntries(Object.entries(r.windows).filter(([x]) => Number(x) === to)) } : {} } : {};
  return r ? { ...r, ...own, key, values, from: r.from ?? r.key } : null;
}
function noteAnswered(ctx, P, ask, road) {
  try {
    noteAnswer(ask.key, forkSaid(ctx, P, ask, !!ask.prep), road);
  } catch {
  }
}
function forkAsk(ctx, P, ask) {
  const { key } = ask;
  const sent = !FORK_ROADS.has(key) && answeredBy(P, key, ask.values);
  if (sent) {
    noteAnswered(ctx, P, ask, sent);
    return keepNewest(FORK_ROADS, key, sent, FORK_ROADS_MAX);
  }
  const got = FORK_ROADS.get(key);
  if (got?.failedAt != null) {
    const left = got.failedAt + PAIR_HOLD_MS - Date.now();
    if (left > 0) {
      forkAgain(ctx, left);
      return "error";
    }
    FORK_ROADS.delete(key);
  } else if (got) {
    globalThis.__fcTrace?.("drawn", got.key);
    return keepNewest(FORK_ROADS, key, got, FORK_ROADS_MAX);
  }
  if (!ctx.api?.solve || ctx.store.get("conn")?.state === "offline") return "error";
  forkPump(ctx, P, ask);
  return null;
}
function modelMayAnswer(ctx, values) {
  const m = memOf(ctx)?.model?.();
  return !!m?.values && !m.road && !m.error && m.since != null && mayAnswer(m.values, values);
}
var ROOT_FIRST = /* @__PURE__ */ new Set();
var ROOT_WAIT_MS = 5e3;
var flightMayAnswer = (ask) => forkFlights().find(([, f]) => f.root && f.gw === ask.gw && f.key !== ask.key && f.values && Date.now() - f.at < ROOT_WAIT_MS && mayAnswer(f.values, ask.values))?.[1] ?? null;
var forkKept = (key, road) => keepNewest(FORK_ROADS, key, road, FORK_ROADS_MAX);
var FORK_REFS = /* @__PURE__ */ new Map();
var forkRead = (key) => {
  const got = FORK_ROADS.get(key);
  return got?.failedAt != null ? "error" : got ?? null;
};
var FORK_FLIGHTS = /* @__PURE__ */ new Map();
var forkFlights = () => [...PAIR.flight?.fork ? [[0, PAIR.flight]] : [], ...FORK_FLIGHTS];
function rulesWords(P, gw, values, base, freed = null) {
  const set = (v) => new Set(String(v ?? "").split(",").filter(Boolean));
  const nm = (id) => P.L?.name?.(Number(id)) ?? id, squad = new Set((weekOf(P, gw)?.squad ?? []).map(Number));
  const span2 = (x) => {
    const [id, w] = x.split("@");
    const [a, b] = (w ?? "").split("-");
    return { id, at: a === b || !b ? `GW${a}` : `GW${a}-${b}` };
  };
  const out = [];
  const asPlanned = (x) => {
    const [id, w] = x.split("@");
    const [a, b = a] = (w ?? "").split("-").map(Number);
    return a <= b && b < gw && range(a, b).every((y) => (weekOf(P, y)?.squad ?? []).map(Number).includes(Number(id)));
  };
  for (const [k, on, off] of [["must_have", "keep", "buy"], ["exclude", "sell", "not"]]) {
    const now = set(values?.[k]), was2 = set(base?.[k]);
    for (const x of now) if (!was2.has(x) && !(k === "must_have" && asPlanned(x))) {
      const s = span2(x);
      out.push(`${squad.has(Number(s.id)) ? on : off} ${nm(s.id)} ${s.at}`);
    }
    for (const x of was2) if (!now.has(x)) {
      const s = span2(x);
      out.push(`drop ${k === "must_have" ? "keep" : "not"} ${nm(s.id)} ${s.at}`);
    }
  }
  const roll = set(values?.no_buys_gw), rolled = set(base?.no_buys_gw);
  const runs = (gs) => [...gs].map(Number).sort((a, b) => a - b).reduce((rs, g) => (rs.at(-1)?.[1] === g - 1 ? rs.at(-1)[1] = g : rs.push([g, g]), rs), []).map(([a, b]) => a === b ? `GW${a}` : `GW${a}-${b}`);
  const own = new Set(P.pins.filter((p) => isRoll(p) && !derivedPin(p)).map((p) => String(p.gw)));
  const dropped = [...rolled].filter((g) => !roll.has(g));
  const capped = new Set(String(values?.max_buys_gw ?? "").split(",").filter(Boolean).map((t) => Number(t.split(":")[0])));
  const to = num(values?.to), hold = dropped.filter((g) => !own.has(g)).map(Number).filter((g) => !capped.has(g));
  const freedWords = !freed || to != null ? [] : runs(hold).map((at) => `${freed} ${at}`);
  const rolls = [...runs([...roll].filter((g) => !rolled.has(g))).map((at) => `roll ${at}`), ...runs(dropped.filter((g) => own.has(g))).map((at) => `drop roll ${at}`), ...freedWords];
  const by = /* @__PURE__ */ new Map();
  for (const x of out) {
    const [, v, rest] = /^(\S+(?: \S+)?) (.+) (GW[\d-]+)$/.exec(x) ? [, x.replace(/ .+$/, ""), x] : [, x, x];
    const g = /GW[\d-]+$/.exec(x)?.[0] ?? "";
    const k = `${v} ${g}`;
    by.set(k, [...by.get(k) ?? [], rest]);
  }
  const was = set(base?.not_for), refused = [...set(values?.not_for)].filter((x) => !was.has(x)).map((x) => {
    const [g, o, i] = x.split(":");
    return `not ${nm(i)} for ${nm(o)} GW${g}`;
  });
  return [...[...by].map(([k, xs]) => xs.length > 3 ? `${k.split(" ")[0]} ${xs.length} players ${k.split(" ").at(-1)}` : xs.join(", ")), ...refused, ...rolls].join(", ");
}
function solveWords(ctx, P, ask) {
  let now = {}, free = {};
  try {
    now = valuesFor(ctx);
    free = memOf(ctx).values({ drop: P.pins.filter((p) => !derivedPin(p)).map((p) => p.id) });
  } catch {
  }
  const asked = rulesWords(P, ask.gw, ask.values, now, "Forkcast's transfers") || (ask.values?.to != null ? "" : "the plan as it stands"), yours = rulesWords(P, ask.gw, now, free);
  return yours ? `${asked} \xB7 your rules: ${yours}` : asked;
}
function forkSaid(ctx, P, ask, prep) {
  return { gw: ask.gw, kind: ask.ahead ? { take: "Make the swap", root: "After the swap" }[ask.kind] ?? "A tap, ahead" : ask.root ? "The week's plan" : ask.side ? "Show another" : `${ask.said ?? "A choice"}${prep ? ", ahead" : ""}`, what: solveWords(ctx, P, ask), key: ask.key };
}
function forkPump(ctx, P, ask) {
  const prep = !!ask.prep;
  const miss = (why) => {
    (globalThis.__forkMiss ??= []).push({ at: Date.now(), key: ask.key.slice(-8), why: `${ask.card ? "card" : prep ? "prep" : ask.ahead ? "ahead" : "pair"} ${why}`, lanes: forkFlights().map(([l, f]) => `${l}:${f.card ? "card" : f.prep ? f.side ? "side" : "prep" : f.ahead ? "ahead" : "pair"}`).join(" ") });
  };
  const same = forkFlights().find(([, f]) => f.key === ask.key);
  if (same && (prep || !same[1].prep)) return;
  if (P.healing && !ask.urgent) {
    miss("healing");
    pumpAhead(ctx);
    return;
  }
  if (modelMayAnswer(ctx, ask.values)) {
    miss("model plan");
    return;
  }
  const lean = ctx.presolveOn?.() === false;
  const by = lean ? flightMayAnswer(ask) : null;
  if (by) {
    miss("a flight may answer");
    forkAgain(ctx, by.at + ROOT_WAIT_MS - Date.now());
    return;
  }
  if (lean && ask.said === "No transfer" && !ROOT_FIRST.has(ask.key)) {
    ROOT_FIRST.add(ask.key);
    miss("the week's plan first");
    forkAgain(ctx, 0);
    return;
  }
  const now = plan(ctx) ?? P, sent = !FORK_ROADS.has(ask.key) && answeredBy(now, ask.key, ask.values);
  if (sent) {
    miss("answered");
    noteAnswered(ctx, now, ask, sent);
    keepNewest(FORK_ROADS, ask.key, sent, FORK_ROADS_MAX);
    forkAgain(ctx, 0);
    return;
  }
  if (prep && tapSpent(ask.src || !AHEAD.at ? 0 : ownLeft(ctx, AHEAD.at.P, AHEAD.at.g)) && !(ask.src === "week" && ask.kind === "take")) return;
  if (leftBehind(ctx, P)) {
    miss("left behind");
    return;
  }
  const holder = ctx.api.slotHolder?.("spec") ?? (ctx.api.slotBusy?.("spec") ? "busy" : null);
  const free = Array.from({ length: (P.b?.meta?.pair_lanes ?? 1) - 1 }, (_, i) => i + 1).find((i) => !FORK_FLIGHTS.has(i));
  const side = !!ask.side && (P.b?.meta?.pair_lanes ?? 1) > 1;
  const sideYield = side && free === void 0 ? forkFlights().find(([, f]) => f.prep && !f.side && !f.ahead && !f.need && f.gw !== ask.gw) ?? null : null;
  const other = !same && !prep && !side && PAIR.flight && free === void 0 ? forkFlights().find(([, f]) => (f.gw !== ask.gw || f.ahead) && !aheadWaited(f)) : null;
  const yielded = !same && ask.ahead && free === void 0 ? forkFlights().find(([, f]) => f.prep && !f.ahead && !f.need) ?? forkFlights().find(([, f]) => f.side && !f.root) ?? forkFlights().find(([, f]) => f.ahead && !aheadWaited(f) && !aheadAsks(f, P, ask.gw)) ?? (ask.src === "sheet" ? forkFlights().find(([, f]) => f.ahead && f.src === "week" && !aheadWaited(f)) : null) ?? null : null;
  const lane = same ? same[0] : side ? free ?? sideYield?.[0] : prep ? free ?? (!PAIR.flight && !holder && !prepsWaiting(ctx, P) ? 0 : yielded?.[0]) : !PAIR.flight ? holder && free !== void 0 ? free : 0 : free ?? other?.[0];
  if (lane === void 0) {
    miss("no lane");
    return;
  }
  if (holder && !(prep && !(side && lane) ? PREP_BESIDE : PAIR_TAKES).has(holder)) {
    miss(`holder ${holder}`);
    const f = ctx.api.whenFree?.("spec");
    if (f) f.then(() => forkAgain(ctx, 0));
    else forkAgain(ctx, PAIR_AGAIN_MS);
    return;
  }
  const pause = prep ? "prepUntil" : "until";
  const wait = Math.max(0, PAIR.until - Date.now(), prep ? PAIR.prepUntil - Date.now() : 0);
  if (wait > 0) {
    miss(`pause ${wait}`);
    forkAgain(ctx, wait);
    return;
  }
  if (other) other[1].cancel?.();
  if (yielded && yielded[0] === lane) yielded[1].cancel?.();
  if (sideYield && sideYield[0] === lane) sideYield[1].cancel?.();
  miss("asked");
  const flight = { key: ask.key, values: ask.values, at: Date.now(), fork: true, card: !!ask.card, cancel: null, gw: ask.gw, P, prep, need: !!ask.need, ahead: !!ask.ahead, root: !!ask.root, side, src: ask.src ?? null };
  if (lane) FORK_FLIGHTS.set(lane, flight);
  else PAIR.flight = flight;
  const ours = () => (lane ? FORK_FLIGHTS.get(lane) : PAIR.flight) === flight;
  const purpose = ask.card ? "card" : ask.ahead ? ask.src === "week" ? "pair" : "presolve" : prep ? "pairnext" : "pair";
  if (ask.ahead) AHEAD.asked.push({ at: Date.now(), key: ask.key, src: ask.src });
  const p = solveKept(ctx.api, { entry: Number(P.entry), purpose, values: ask.values, ...lane ? { lane } : {} }, { ...lane ? { slot: `fork${lane}` } : {}, onUpdate: (s) => {
    if (s?.key) flight.sk = s.key;
  } }, forkSaid(ctx, P, ask, prep));
  flight.cancel = () => p.cancel?.();
  p.then((res) => {
    if (ask.ahead && (res.road || res.state === "error")) {
      AHEAD.landed.set(ask.key, res.version ?? null);
      if (res.version != null) memOf(ctx).offer(res.road, { values: ask.values, error: res.error, version: res.version });
      if (res.version == null || !res.road && res.error?.code !== "infeasible") AHEAD.failed.add(ask.key);
      if (ask.kind === "root" && res.road) keepNewest(FORK_ROADS, ask.key, res.road, FORK_ROADS_MAX);
    } else if (res.road || res.state === "error") {
      keepNewest(FORK_ROADS, ask.key, res.road ?? (res.error?.code === "infeasible" ? "infeasible" : { failedAt: Date.now() }), FORK_ROADS_MAX);
    } else if (ours() && res.state === "cancelled") {
      if (ask.ahead && AHEAD.dropped.set(ask.key, (AHEAD.dropped.get(ask.key) ?? 0) + 1).get(ask.key) > 1) AHEAD.failed.add(ask.key);
      else PAIR[pause] = Date.now() + PAIR_AGAIN_MS;
    }
  }, () => {
    if (ask.ahead) AHEAD.failed.add(ask.key);
    else keepNewest(FORK_ROADS, ask.key, { failedAt: Date.now() }, FORK_ROADS_MAX);
    if (ours()) PAIR[pause] = Date.now() + PAIR_HOLD_MS;
  }).finally(() => {
    if (!ours()) return;
    if (lane) FORK_FLIGHTS.delete(lane);
    else PAIR.flight = null;
    const more = ask.ahead ? pumpAhead(ctx) : false;
    if (!ask.ahead || !more || ask.src === "week" && ask.kind === "take") pairChanged(ctx);
  });
}
var FORK_TIMER = null;
var FORK_DUE = 0;
function forkAgain(ctx, ms) {
  (globalThis.__forkMiss ??= []).push({ at: Date.now(), key: "", why: `again ${ms}${FORK_TIMER ? " (one due)" : ""}`, lanes: "" });
  if (FORK_TIMER) return;
  FORK_DUE = Date.now() + ms;
  FORK_TIMER = setTimeout(() => {
    FORK_TIMER = null;
    if (attach()?.ctx === ctx) pairChanged(ctx);
  }, ms);
}
var forkDue = () => FORK_TIMER ? FORK_DUE : null;
function resetForks() {
  for (const [, f] of forkFlights()) f.cancel?.();
  FORK_FLIGHTS.clear();
  PAIR.flight = null;
  PAIR.until = PAIR.prepUntil = 0;
  clearTimeout(FORK_TIMER);
  FORK_TIMER = null;
  FORK_ROADS.clear();
  FORK_REFS.clear();
  clearRoots();
  AHEAD.srcs.clear();
  AHEAD.failed.clear();
  AHEAD.showing.clear();
  AHEAD.at = null;
  AHEAD.asked = [];
  AHEAD.dropped.clear();
  AHEAD.landed.clear();
}

// js/m/ahead/screen-ticket.js
var lineRow = (words, right = null, data = null) => h("p.ah-tkline", { dataset: data }, h("span.ah-tkl", null, words), right ? [" ", h("span.ah-tkr.m-num", null, right)] : null);
function moveLine(gain, forced, rounds, vs) {
  return lineRow(COPY.vsNext(rounds, vs), xpGain(gain, `span.ah-tkcount${fmt.signed(gain).startsWith(MINUS) ? ".neg" : ""}`), forced ? { forced: "" } : null);
}
function cardRows(node) {
  const box = node && !node.matches(".ah-tkline, .ah-tksug") ? node : h("div", null, node);
  if (!box.querySelector(".ah-tkline")) box.prepend(h("p.ah-tkpad.l", { "aria-hidden": "true" }, "\xA0"));
  if (!box.querySelector(".ah-tksug")) box.append(h("div.ah-tkpad.s", { "aria-hidden": "true" }, h("span.ah-rsbtn", null, "\xA0")));
  return box;
}
var movesWords = (P, ms) => `${ms.map((m) => P.L.name(m.out)).join(", ")} \u2192 ${ms.map((m) => P.L.name(m.in)).join(", ")}`;
var movesTitle = (ctx, P, g, ms) => {
  const door = (id) => h("button.ah-tkname", { type: "button", "aria-haspopup": "dialog", "aria-label": COPY.cardOf(P.L.name(id)), dataset: { row: `tk:card:${g}:${id}` }, onClick: () => ctx.openSheet("player", Number(id), { gw: g }) }, P.L.name(id));
  const list = (xs) => xs.flatMap((x, i) => i ? [", ", x] : [x]);
  return [...list(ms.map((x) => door(x.out))), " \u2192 ", ...list(ms.map((x) => door(x.in)))];
};
var inPlaces = (w, ms) => {
  const swap = (x) => ms.find((m) => Number(m.out) === Number(x))?.in ?? x;
  return { ...w, xi: w.xi.map(swap), bench: w.bench.map(swap) };
};
var STACK_SWIPE_PX = 36;
var STACK_MOTION = { duration: 180, easing: "cubic-bezier(.2,.7,.2,1)" };
var STACK_PULL = { start: 8, far: 96, end: 24 };
var comparePick = (ctx, P, g) => ctx.openSheet("wish", null, { gw: g, compare: {
  title: COPY.comparePlayers,
  back: () => {
  },
  pick: (a) => ctx.openSheet("wish", null, { gw: g, pos: P.L.pos(a), compare: {
    title: COPY.compareWith(P.L.name(a)),
    back: () => {
    },
    pick: (b) => ctx.openSheet("player", Number(a), { gw: g, vs: b })
  } })
} });
function ticketPart(V) {
  const adviceOf = (P, w) => w.moves.length > 1 ? plural(w.moves.length, "transfer") : w.moves.length ? movesWords(P, w.moves) : "";
  function paintStand(w) {
    const { stand } = V;
    const [ft, bank] = standWords(w);
    fill(
      stand,
      h("span", null, w.moves.length ? [h("b", null, plural(w.moves.length, "transfer")), " made"] : h("b", null, ft)),
      bank == null ? null : h("span", null, bank.short ? h("b.ah-short", null, bank.text) : [h("b", null, bank.text), " in the bank"])
    );
  }
  function standWords(w) {
    const itb = w.bank != null ? itbWords(w.bank) : null;
    return [plural(w.ft ?? 1, "free transfer"), w.bank == null ? null : itb ? { text: itb[0].replace(/ ITB$/, "") } : { text: COPY.moneyShort(-w.bank), short: true }];
  }
  function paintFlag(P, w) {
    const { S, flag, openWeek } = V;
    if (w.gw === P.A) S.flagWords = S.status?.sub?.replace(/^Set in FPL:?\s*/, "") ?? null;
    const t = S.flagWords;
    flag.hidden = !t;
    if (!t) return;
    fill(flag, h("span", null, COPY.yourFplTeam), h("b", null, /change/.test(t) ? `${t} to make` : t));
    flag.onclick = (ev) => openWeek(ev, P.A);
  }
  function holdStack(from, to) {
    const { S, el, strip, ticks } = V;
    const card = strip.querySelector(":scope > .ah-ticket");
    S.stackWas?.ghost.remove();
    S.stackWas = null;
    if (!card?.offsetHeight || reduceMotion()) return;
    const r = card.getBoundingClientRect(), ghost = card.cloneNode(true), tabs = {};
    for (const t of ticks.querySelectorAll(".ah-tick[data-gw]:not(.sel)")) tabs[t.dataset.gw] = t.getBoundingClientRect().top;
    ghost.className = `ah-tkghost${to > from ? " over" : ""}`;
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    ghost.querySelector(":scope > .ah-pbar")?.remove();
    for (const x of ghost.querySelectorAll("[data-row]")) x.removeAttribute("data-row");
    Object.assign(ghost.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    el.append(ghost);
    S.stackWas = { from, to, top: r.top, tabs, ghost };
    setTimeout(() => {
      if (S.stackWas?.ghost === ghost) {
        ghost.remove();
        S.stackWas = null;
      }
    }, 2 * STACK_MOTION.duration);
  }
  function playStack(g) {
    const { S, strip, ticks } = V;
    const m = S.stackWas;
    if (m?.to !== g) return;
    S.stackWas = null;
    const tabTop = (t) => t.getBoundingClientRect().top;
    for (const t of ticks.querySelectorAll(".ah-tick[data-gw]:not(.sel)")) {
      const was = m.tabs[t.dataset.gw], top = tabTop(t);
      t.animate(was != null ? [{ transform: `translateY(${was - top}px)` }, { transform: "none" }] : [{ transform: `translateY(${(m.top - top) / 2}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], STACK_MOTION);
    }
    const card = strip.querySelector(":scope > .ah-ticket");
    if (m.to < m.from && m.tabs[g] != null) card?.animate([{ transform: `translateY(${m.tabs[g] - card.getBoundingClientRect().top}px)` }, { transform: "none" }], STACK_MOTION);
    const land2 = ticks.querySelector(`.ah-tick[data-gw="${m.from}"]`);
    m.ghost.animate([{ transform: "none", opacity: 1 }, { transform: `translateY(${land2 ? tabTop(land2) - m.top : 0}px)`, opacity: 0 }], STACK_MOTION).onfinish = () => m.ghost.remove();
  }
  function bindStack() {
    const { atEdge, ctx, gwNow, letGo, setGw, spend, stack, strip } = V;
    let at = null;
    const weekBy = (step) => {
      const P = plan(ctx);
      return P?.gws[P.gws.indexOf(gwNow(P)) + step] ?? null;
    };
    const card = () => strip.querySelector(":scope > .ah-ticket");
    const pull = (px, axis) => {
      const c = card();
      if (c) c.style.transform = px ? `translate${axis}(${px}px)` : "";
    };
    const back = (px, axis) => {
      pull(0);
      if (px) card()?.animate([{ transform: `translate${axis}(${px}px)` }, { transform: "none" }], STACK_MOTION);
    };
    const reach = (d, on) => {
      const far = weekBy(on ? 1 : -1) != null ? STACK_PULL.far : STACK_PULL.end;
      return Math.sign(d) * Math.min(far, Math.abs(d) * (far === STACK_PULL.far ? 1 : 0.25));
    };
    stack.addEventListener("pointerdown", (e) => {
      if (at?.px != null) return;
      at = e.isPrimary && e.button < 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, sideways: !atEdge(e) && !e.target.closest(".ah-rail"), px: null } : null;
    });
    stack.addEventListener("pointermove", (e) => {
      if (at?.id !== e.pointerId) return;
      const dx = e.clientX - at.x, dy = e.clientY - at.y;
      if (at.px == null) {
        const across = at.sideways && Math.abs(dx) > Math.abs(dy);
        if ((across ? Math.abs(dx) : Math.abs(dy)) < STACK_PULL.start || !across && Math.abs(dy) < Math.abs(dx) || reduceMotion()) return;
        at.axis = across ? "X" : "Y";
        stack.setPointerCapture(e.pointerId);
      }
      at.px = at.axis === "X" ? reach(dx, dx < 0) : reach(dy, dy > 0);
      pull(at.px, at.axis);
    });
    stack.addEventListener("pointercancel", (e) => {
      if (at?.id !== e.pointerId) return;
      back(at.px, at.axis);
      at = null;
    });
    stack.addEventListener("pointerup", (e) => {
      if (at?.id !== e.pointerId) return;
      const dx = e.clientX - at.x, dy = e.clientY - at.y, { sideways, px, axis } = at;
      at = null;
      const down = Math.abs(dy) > STACK_SWIPE_PX && Math.abs(dy) >= Math.abs(dx);
      const g = down || sideways && Math.abs(dx) > STACK_SWIPE_PX ? weekBy((down ? dy > 0 : dx < 0) ? 1 : -1) : null;
      if (px != null || down || g != null) {
        spend(e);
        letGo(e);
      }
      if (g == null) return back(px, axis);
      setGw(g);
      pull(0);
    });
  }
  const sizeTitle = (block) => {
    const head = block.querySelector(".ah-tkhead");
    head.classList.toggle("long", head.offsetHeight > 1.6 * parseFloat(getComputedStyle(head).fontSize));
  };
  function firstCard(g, title, action, rest) {
    const { barNode, dlEl } = V;
    return h(
      "section.ah-block.ah-ticket",
      { "aria-label": "Your plan" },
      h("div.ah-tkbody", null, h("div.ah-tkrow", null, h("span.ah-tkg", null, `GW${g}`), dlEl, h("span.ah-tkx.m-num", null, h("span.m-skel"))), h("div.ah-tktitle", null, h("h2.ah-tkhead", null, title))),
      barNode({ cls: ".ah-pbake" }),
      rest,
      h("div.ah-tkacts", null, action),
      h("div.ah-tklinks")
    );
  }
  function paintTicket(P, w, M, tk = []) {
    const { S, ctx, dlEl, bringDoor, chipsDoor, inkAt: inkAt2, openWeek, rsBtn, setGw, stack, strip } = V;
    const block = strip.querySelector(":scope > .ah-ticket");
    if (!block || !w) return;
    paintStand(w);
    paintFlag(P, w);
    const g = w.gw, next = P.gws[P.gws.indexOf(g) + 1] ?? null, off = !P.editable;
    const btn = (kind, text, row, onClick) => {
      const b = h(`button.ah-${kind}`, { type: "button", disabled: off, dataset: { row } }, text);
      b.onclick = onClick ?? null;
      return b;
    };
    const onward = next ? btn("go", COPY.onToWeek(next), "tk:next", () => setGw(next)) : null;
    const who = choosing(ctx, P, g);
    let after = null;
    const refused = P.pins.filter((p) => p.kind === "notfor" && Number(p.gw) === g).at(-1);
    const swaps = M?.sq ? 0 : w.moves.length, last = cardUndo(ctx, g);
    const best = tk.find((t) => t.matches(".mv.lead")), ans = tk.find((t) => t.matches(".ah-ans"));
    const none = !best && !!ans && showingAt(P, g) && !!M?.settled && !M.shownOut;
    const showing = !swaps && !refused && showingAt(P, g) && !none && (!best || !!best.move?.pl?.forced), shown = showing && !last;
    const prev = showing && last ? h("button.ah-rsbtn.undo.back", { type: "button", disabled: off, dataset: { row: `tk:prev:${g}` }, onClick: () => {
      showTransfer(P, g, false);
      V.schedule();
    } }, COPY.previous) : null;
    const undo = swaps ? takingBack(() => removeWeek(ctx, g)) : last ?? (refused ? takingBack(() => removeRule(ctx, refused.id)) : shown ? () => {
      showTransfer(P, g, false);
      V.schedule();
    } : null);
    const undoWords = swaps ? COPY.undoSwaps(swaps) : refused || shown ? COPY.previous : COPY.undoLast;
    const toChoice = !swaps && !refused && !prev && !(undo && undoWords === COPY.previous) && tappedSuggestion(P, g) ? h("button.ah-rsbtn.undo.back", { type: "button", disabled: off, dataset: { row: `tk:choice:${g}` }, onClick: () => {
      showSuggestion(P, g, false);
      showTransfer(P, g, false);
      V.schedule();
    } }, COPY.previous) : null;
    let title, line = null, left = null, right = null, noBring = false;
    const placed = P.healing && !w.moves.length ? placedAt(g) : null;
    if (!placed) placedDone();
    const yours = M?.sq ? [] : placed ? [placed] : w.moves;
    const withMine = (t) => yours.length ? [h("span.ah-tkmine", null, yours.map((m) => `${P.L.name(m.out)} \u2192 ${P.L.name(m.in)}`).join(", ")), t] : t;
    const withCompare = (row, one = null) => h("div", null, row == null ? null : row instanceof Node ? row : lineRow(row), h("div.ah-tksug", null, one ? h("button.ah-rsbtn", { type: "button", dataset: { row: `tk:vs:${g}` }, onClick: () => ctx.openSheet("player", Number(one.out), { gw: g, vs: one.in }) }, COPY.comparePlayers) : h("button.ah-rsbtn", { type: "button", dataset: { row: `tk:compare:${g}` }, onClick: () => comparePick(ctx, P, g) }, COPY.comparePlayers)));
    const askLeft = () => btn("alt", COPY.showSuggestion, `tok:suggest:${g}`, () => {
      showSuggestion(P, g);
      V.schedule();
    });
    const short = !M?.sq && !placed && owedAt(P, w), asked = suggestedAt(P, g);
    const moreAvail = !!best && !M?.sq && !!w.moves.length && best.move.e.adds.length >= 1 && !best.move.e.taken.length && !best.move.e.chipNow;
    const owes = !!best && short && asked;
    const freeLeft = !M?.sq && !placed && !!w.moves.length && !extraWeek(P, g);
    const wanted = asked || showing || !!refused;
    const offerable = !!best && !placed && (!w.moves.length ? wanted : owes || moreAvail && asked);
    const answerRoad = () => short ? owedRoad(ctx, P, g, { peek: true }) : refusalRoads(ctx, P, g, { peek: true, depth: 0 })[0];
    const failedHow = () => {
      const r = answerRoad();
      if (!r || r.road != null || !r.key) return null;
      const f = forkRead(r.key);
      return f === "error" || f === "infeasible" ? f : null;
    };
    const failed = asked && !best ? failedHow() : null;
    const answered = () => answerRoad()?.road != null || !!failedHow();
    const solving = !!S.wait || !!M && !M.settled || !!M?.shownOut || !!M?.all?.owedOut || asked && !best && !answered();
    const wait = () => {
      title = withMine("");
      line = withCompare(COPY.waitShort);
      noBring = true;
    };
    const opening = () => {
      title = COPY.noTransferMade;
      line = withCompare(null);
      left = askLeft();
    };
    const yoursLine = () => {
      if (placed) return null;
      const took = tookOf(P, w), from = P.gws.filter((x) => x >= g), r = V.weekRoll(P, w);
      const win = r?.shown != null && r.counted ? sameWindow(...r.counted, g) : 0;
      if (r) return moveLine(win ? r.shown : r.pts?.delta ?? r.delta, !!took?.forced, win || from.length, COPY.planVsRoll);
      const tabs = from.some((x) => x > g && weekOf(P, x)?.moves.length) || !from.every((x) => P.bare?.has(x)) ? null : from.reduce((t, x) => t + weekOf(P, x).points - P.bare.get(x).points, 0);
      return tabs == null ? null : moveLine(tabs, !!took?.forced, from.length, COPY.planVs(false));
    };
    const made = () => {
      title = withMine("");
      line = withCompare(yoursLine(), yours.length === 1 ? yours[0] : null);
      if ((short || moreAvail || freeLeft) && !asked && P.editable) left = askLeft();
      else right = onward;
      if (placed) after = inPlaces(w, [placed]);
    };
    const save = () => {
      title = withMine(ans.querySelector(".ah-tl").textContent);
      const mine = yours.length ? yoursLine() : null;
      line = withCompare(mine ?? ans.querySelector(".ah-tw")?.textContent ?? null, mine && yours.length === 1 ? yours[0] : null);
      right = onward;
    };
    const offer = () => {
      const { e, pl } = best.move;
      const own = pl.road?.weeks?.find((x) => Number(x.gw) === g);
      after = swapWeek(ctx, P, g, pl) ?? (own ? viewOfRoadWeek(own, P.L) : null) ?? (e.adds.length ? inPlaces(w, e.adds) : null);
      clearTimeout(S.swapAsk);
      S.swapAsk = setTimeout(() => presolveSwap(ctx, P, g, pl));
      const pts = cardGain(ctx, P, g, pl), rounds = windowRounds(pl.road, g) || P.gws.filter((x) => x >= g).length;
      if (pts == null) return wait();
      const ms = e.adds;
      title = withMine(ms.length ? movesTitle(ctx, P, g, pairAsPlaced(w, after, P.L.pos, ms)) : best.querySelector(".ah-tl").textContent);
      const one = ms.length === 1 ? ms[0] : null;
      const vs = !short && !extraWeek(P, g) && (w.ft ?? 1) > 0 ? COPY.vsSaving : COPY.planVs(true);
      line = withCompare(moveLine(pts, !!pl.forced || fmt.signed(pts).startsWith(MINUS), rounds, vs), one);
      const not = best.dataset.notIn ? { gw: g, out: Number(best.dataset.notOut), in: Number(best.dataset.notIn) } : null;
      left = not ? btn("alt", COPY.showAnother, `tok:not:${g}`, () => {
        showTransfer(P, g);
        veto(ctx, not, { scope: "pair" });
      }) : null;
      const answeredAsk = () => {
        if (!ctx.presolveOn?.()) {
          showSuggestion(P, g, false);
          showTransfer(P, g, false);
        }
      };
      right = btn("go", COPY.swap, `tok:best:${g}`, (ev) => {
        answeredAsk();
        return best.querySelector(".ah-tgo") ? best.take(ev) : best.click();
      });
    };
    if (who) {
      const pr = P.L.price(who.id);
      title = COPY.bringWho(P.L.name(who.id));
      line = lineRow(COPY.bringTap, pr == null ? null : fmt.money(pr));
      left = btn("alt", COPY.bringCancel, "tk:cancel", () => stopChoosing(ctx));
    } else if (M?.sq && w.moves.length) {
      title = S.status?.one ?? "";
      line = plural(w.moves.length, "change");
      left = btn("alt", COPY.seeChanges, `tk:week:${g}`, (ev) => openWeek(ev, g));
      right = onward;
    } else if (M?.live) {
      title = M.liveText;
      right = next ? onward : null;
    } else if (offerable) {
      offer();
    } else if (placed) {
      wait();
    } else if (failed && !solving) {
      const inf = failed === "infeasible";
      if (yours.length) {
        made();
        line = inf ? COPY.infeasible(g) : COPY.unfinished;
      } else {
        title = withMine(inf ? COPY.noPlan(g) : "");
        line = inf ? COPY.unchanged : COPY.unfinished;
        right = onward;
      }
    } else if (freeLeft && asked && ans && !short && !solving) {
      save();
    } else if (yours.length && !(wanted && solving)) {
      made();
    } else if (wanted && solving) {
      wait();
    } else if (wanted && ans) {
      save();
    } else if (!yours.length && !short) {
      opening();
    } else {
      title = S.status?.one ?? "";
      right = next ? onward : null;
    }
    if (S.doors?.g !== g || S.doors.editable !== P.editable) S.doors = { g, editable: P.editable, of: [bringDoor(P, g), chipsDoor(P, g)] };
    const chips = who || inkAt2(ctx, P, g) ? null : S.doors.of;
    if (chips) {
      chips[0].textContent = COPY.bringInPlayer;
      chips[1].textContent = COPY.playAChip;
    }
    const was = P.bare?.has(g) ? tickWas(w, P.bare.get(g)) : null;
    const held = rsBtn === document.activeElement;
    const sheetHas = w.moves.length > 1 || !!M?.sq || !!M?.live || !!M?.notices?.length || !!M?.plans?.some((pl) => !pl.refRow) || !!V.asksHost?.firstChild;
    fill(
      block.querySelector(":scope > .ah-tkbody"),
      // (its tap the Week sheet where that holds what the card doesn't: each of two or more transfers to take back, the
      // week's suggested plans, its notices, your rules, a chip's or a live week's; else no tap: the sheet was its facts
      // line, the header's, over "Roll 0.0", the one thing it counts against (owner 2026-11-10, boards-full 383130 #004))
      h(
        sheetHas ? "button.ah-tkrow" : "div.ah-tkrow",
        sheetHas ? { type: "button", "aria-haspopup": "dialog", "aria-label": COPY.weekTitle(g), dataset: { row: "week", moves: w.moves.map((m) => `${m.out}>${m.in}`).join(" ") }, onClick: (ev) => openWeek(ev, g) } : { dataset: { moves: w.moves.map((m) => `${m.out}>${m.in}`).join(" ") } },
        h("span.ah-tkg", null, `GW${g}`),
        dlEl,
        h("span.ah-tkx.m-num", null, w.ft == null ? null : h("span.ah-tkf", null, `${w.ft}FT`), w.bank == null ? null : h("span.ah-tkb", { class: { neg: w.bank < -1e-9 } }, fmt.money(w.bank)), was ? h("s.ah-was", { "aria-hidden": "true" }, was) : null, xpNum(fmt.num(w.points)))
      ),
      // (the names whole at full size, as many lines as they take, never cut nor smaller;
      // owner, 2026-11-09, "fix so players font not made smaller", "fix bug so names are displayed")
      h("div.ah-tktitle", null, h("h2.ah-tkhead", null, title)),
      cardRows(line == null ? null : line instanceof Node ? line : lineRow(line))
    );
    const sug = block.querySelector(":scope > .ah-tkbody .ah-tksug");
    const bringBy = chips && !noBring && sug ? chips[0] : null;
    if (bringBy) sug.append(bringBy);
    const both = [left, right].filter(Boolean);
    const acts = block.querySelector(":scope > .ah-tkacts"), kids = keptActs(g, both.length ? both : [h("span.ah-tkpad", { "aria-hidden": "true" })]);
    if (kids.length !== acts.children.length || kids.some((k, i) => k !== acts.children[i])) fill(acts, ...kids);
    for (const old of block.querySelectorAll(":scope > .ah-tksug")) if (old !== sug) old.remove();
    if (sug) acts.after(sug);
    fill(
      block.querySelector(":scope > .ah-tklinks"),
      who ? null : h("span.ah-tkback", null, toChoice, undo && !toChoice && !prev ? h("button.ah-rsbtn.undo", { type: "button", disabled: off, class: { back: !swaps && (!!refused || shown) }, dataset: { row: `tk:undo:${g}` }, onClick: undo }, undoWords) : null, prev, rsBtn),
      // (chips off, calls.js CHIPS_OFF: no Play a chip at all, never a link a tap does nothing on; owner, 2026-11-09, "why play
      // a chip not respond")
      chips ? h("span.ah-tkor", null, noBring || bringBy ? null : chips[0], CHIPS_OFF ? null : chips[1]) : null
    );
    if (held) rsBtn.focus({ preventScroll: true });
    V.paintBoard(P, w, who ? null : after);
    playStack(g);
    V.fitPitch();
  }
  return { adviceOf, bindStack, firstCard, holdStack, paintTicket, sizeTitle };
}
var ACTS_KEPT = 8;
var ACTS = /* @__PURE__ */ new Map();
function keptActs(g, kids) {
  if (!ACTS.has(g)) ACTS.set(g, /* @__PURE__ */ new Map());
  const kept = ACTS.get(g), keyOf = (b) => `${b.tagName}|${b.className}|${b.dataset.row ?? ""}|${b.textContent}`;
  return kids.filter(Boolean).map((k) => {
    const key = keyOf(k), old = kept.get(key);
    kept.delete(key);
    const use = old ?? k;
    if (old) {
      old.disabled = k.disabled;
      old.onclick = k.onclick;
    }
    kept.set(key, use);
    while (kept.size > ACTS_KEPT) kept.delete(kept.keys().next().value);
    return use;
  });
}

// js/m/ahead/screen.js
var GO_GW = null;
var TAP_IN = null;
var rulesOf = (P) => [...asksOf(P)].reverse();
var ROW_KINDS = /* @__PURE__ */ new Set(["sell", "slide", "wish", "hits", "chip"]);
var MOVE_KINDS = /* @__PURE__ */ new Set(["sell", "slide", "wish"]);
var listedRules = (P, g = null) => {
  const made = new Set(P.weeks.filter((w) => g == null || w.gw <= g).flatMap((w) => (w.moves || []).map((m) => pinOfMove(P, { ...m, gw: w.gw })?.id)).filter(Boolean));
  return rulesOf(P).filter((p) => !ROW_KINDS.has(p.kind) || MOVE_KINDS.has(p.kind) && !made.has(p.id));
};
var CHIP_PINS = /* @__PURE__ */ new WeakMap();
var chipPins = (P) => {
  if (!CHIP_PINS.has(P.pins)) CHIP_PINS.set(P.pins, P.pins.flatMap((p) => Object.entries(p.chips || {}).map(([g, c]) => ({ gw: Number(g), chip: c }))).filter((x) => CHIPS.includes(x.chip)));
  return CHIP_PINS.get(P.pins);
};
var glyph = (k) => svg(
  "svg",
  { viewBox: "0 0 12 12", width: 12, height: 12, "aria-hidden": "true", class: "ah-glyph" },
  svg("path", { d: k === "+" ? "M6 1.5v9M1.5 6h9" : "M2.5 2.5l7 7M9.5 2.5l-7 7", fill: "none", stroke: "currentColor", "stroke-width": k === "+" ? 1.8 : 1.6, "stroke-linecap": "round" })
);
var whole = (t) => String(t).split(/(\S*-\S*)/).map((x, i) => i % 2 ? h("span.ah-nw", null, x) : x);
var fitNum = (el, v, steps = ["noxp", "nomark", "tight"]) => {
  const over = typeof v === "function" ? v : () => [v].flat().some((x) => !!x && x.scrollWidth > x.clientWidth + 0.5);
  el.classList.remove(...steps);
  for (const k of steps) if (over()) el.classList.add(k);
  return !over();
};
var oneLook = (els, ks) => {
  const on = ks.filter((k) => els.some((x) => x.classList.contains(k)));
  for (const x of els) x.classList.add(...on);
  return on;
};
var HEAD_LEAST = 8;
var HEAD_TRIMS = ["noxp", "nomark", "tight", "snug"];
var HEAD_NUM = ".ah-pv:not(.wait)";
var headScale = (need, room, px) => need <= room + 0.5 ? 1 : Math.max(HEAD_LEAST / px, room / need);
var PLATE_TRIMS = ["noxp", "nomark", "tight"];
var ST_TRIMS = ["snug", "noxp", "nomark", "tight"];
var NAME_LEAST = 3;
var deadlineOf = (b, A, g) => b?.meta?.deadlines?.[g] ?? (g === A ? b?.meta?.deadline_epoch : null) ?? null;
var countdown = (info2) => info2.left > 0 && info2.left < 7 * 864e5 ? info2.text : "";
var countdownParts = (info2) => countdown(info2) ? [h("span", { "aria-hidden": "true" }, countdown(info2)), h("span.sr-only", null, `, ${info2.said}`)] : [];
var holdFill = (x, y, ms, word = null) => {
  if (!globalThis.document?.body) return () => {
  };
  const n = h(
    "div.ah-hold",
    { "aria-hidden": "true", style: { left: `${x}px`, top: `${y}px`, "--ms": `${ms}ms` } },
    svg("svg", { viewBox: "0 0 56 56" }, svg("circle", { class: "tr", cx: 28, cy: 28, r: 25 }), svg("circle", { class: "fl", cx: 28, cy: 28, r: 25, pathLength: 100 })),
    word ? h("span.ah-holdw", null, word) : null
  );
  document.body.append(n);
  return () => n.remove();
};
var reachOf = (c, walls, m = 2) => Math.max(0, c.y - 44, ...walls.filter((q) => q.n !== c.n && q.x < c.x + c.w + m && q.x + q.w > c.x - m && q.y < c.y).map((q) => q.y + q.h + 2));
var TAB_MIN = 16;
var EDGE_MIN = 6;
var PLATE_MIN = 14;
var boxesMeet = (a, b, down = 0) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h + down && b.y < a.y + a.h;
var pitchLeast = ({ chrome, hlo, plate, foot }) => chrome + 5 * hlo + 4 * plate + foot;
var cssPx = (host, ...lengths) => {
  const probes = lengths.map((v) => h("span", { style: { position: "absolute", height: v } }));
  host.append(...probes);
  const px = probes.map((p) => p.getBoundingClientRect().height);
  for (const p of probes) p.remove();
  return px;
};
function mount(el, ctx) {
  mountSolveLog(ctx);
  const V = {
    get ADD_HOLD_MS() {
      return ADD_HOLD_MS;
    },
    get COPY_FPL_TEAM() {
      return COPY_FPL_TEAM;
    },
    get FACTS_PROBE() {
      return FACTS_PROBE;
    },
    get FLY_EASE() {
      return FLY_EASE;
    },
    get FLY_MS() {
      return FLY_MS;
    },
    get HINTS() {
      return HINTS;
    },
    get LAND_MAX() {
      return LAND_MAX;
    },
    get LATE_S() {
      return LATE_S;
    },
    get LIFT_MS() {
      return LIFT_MS;
    },
    get LINE_LEAST() {
      return LINE_LEAST;
    },
    get PLATES() {
      return PLATES;
    },
    get PLATE_KEY() {
      return PLATE_KEY;
    },
    get S() {
      return S;
    },
    get TOTAL_MS() {
      return TOTAL_MS;
    },
    get WAIT_DIM_MS() {
      return WAIT_DIM_MS;
    },
    get addOnce() {
      return addOnce;
    },
    get ap0() {
      return ap0;
    },
    get armbandSheet() {
      return armbandSheet;
    },
    get asksHost() {
      return asksHost;
    },
    get avatar() {
      return avatar;
    },
    get bankWarn() {
      return bankWarn;
    },
    get barNode() {
      return barNode;
    },
    get boxOf() {
      return boxOf;
    },
    get bringDoor() {
      return bringDoor;
    },
    get bsep() {
      return bsep;
    },
    get cardBoxes() {
      return cardBoxes;
    },
    get cardIn() {
      return cardIn;
    },
    get changeRow() {
      return changeRow;
    },
    get cheerEl() {
      return cheerEl;
    },
    get chipsDoor() {
      return chipsDoor;
    },
    get chipsHint() {
      return chipsHint;
    },
    get clashRow() {
      return clashRow;
    },
    get closePlace() {
      return closePlace;
    },
    get covered() {
      return covered;
    },
    get ctl() {
      return ctl;
    },
    get ctx() {
      return ctx;
    },
    get decks() {
      return decks;
    },
    get dlEl() {
      return dlEl;
    },
    get doorStubs() {
      return doorStubs;
    },
    get drawPlace() {
      return drawPlace;
    },
    get drawWeek() {
      return drawWeek;
    },
    get edgeTicks() {
      return edgeTicks;
    },
    get tabAt() {
      return tabAt;
    },
    get el() {
      return el;
    },
    get entryKey() {
      return entryKey;
    },
    get factSpans() {
      return factSpans;
    },
    get fitDrawn() {
      return fitDrawn;
    },
    set fitDrawn(v) {
      fitDrawn = v;
    },
    get fitFacts() {
      return fitFacts;
    },
    get fitKey() {
      return fitKey;
    },
    set fitKey(v) {
      fitKey = v;
    },
    get forecastLine() {
      return forecastLine;
    },
    get frozenAt() {
      return frozenAt;
    },
    get ftAfter() {
      return ftAfter;
    },
    get fitPitch() {
      return fitPitch;
    },
    get gainOf() {
      return gainOf;
    },
    get gwNow() {
      return gwNow;
    },
    get gwline() {
      return gwline;
    },
    get head() {
      return head;
    },
    get hint() {
      return hint;
    },
    get hitSaid() {
      return hitSaid;
    },
    get hitTag() {
      return hitTag;
    },
    get itbNode() {
      return itbNode;
    },
    get keepGwLine() {
      return keepGwLine;
    },
    get keepNight() {
      return keepNight;
    },
    get labelWalls() {
      return labelWalls;
    },
    get landMotion() {
      return landMotion;
    },
    get learn() {
      return learn;
    },
    get litPays() {
      return litPays;
    },
    get mountHere() {
      return mountHere;
    },
    get movesTitle() {
      return movesTitle2;
    },
    get notAct() {
      return notAct;
    },
    get noteRow() {
      return noteRow;
    },
    get noticeSaid() {
      return noticeSaid;
    },
    get numOf() {
      return numOf;
    },
    get numParts() {
      return numParts;
    },
    get numSaid() {
      return numSaid;
    },
    get openPlace() {
      return openPlace;
    },
    get openPlanWhy() {
      return openPlanWhy;
    },
    get openWeek() {
      return openWeek;
    },
    get openWhy() {
      return openWhy;
    },
    get paintWait() {
      return paintWait;
    },
    get waitNow() {
      return waitNow;
    },
    get pdBtn() {
      return pdBtn;
    },
    get pitchHost() {
      return pitchHost;
    },
    get plNumSaid() {
      return plNumSaid;
    },
    get placeHint() {
      return placeHint;
    },
    get placeLink() {
      return placeLink;
    },
    get planKey() {
      return planKey;
    },
    get planRow() {
      return planRow;
    },
    get planSaid() {
      return planSaid;
    },
    get plansHeading() {
      return plansHeading;
    },
    get plansListed() {
      return plansListed2;
    },
    get plansVs() {
      return plansVs;
    },
    get plateOf() {
      return plateOf;
    },
    get priceDrift() {
      return priceDrift;
    },
    get rail() {
      return rail;
    },
    get reachLabels() {
      return reachLabels;
    },
    get redeck() {
      return redeck;
    },
    get remProbe() {
      return remProbe;
    },
    get render() {
      return render;
    },
    get renderDecks() {
      return renderDecks;
    },
    get renderLine() {
      return renderLine;
    },
    get renderPdBtn() {
      return renderPdBtn;
    },
    get renderPitch() {
      return renderPitch;
    },
    get paintChoosing() {
      return paintChoosing;
    },
    get paintBoard() {
      return paintBoard;
    },
    get renderRail() {
      return renderRail;
    },
    get renderTotal() {
      return renderTotal;
    },
    get replanning() {
      return replanning;
    },
    get roadOfEv() {
      return roadOfEv;
    },
    get rollFacts() {
      return rollFacts;
    },
    get rollOf() {
      return rollOf;
    },
    get rolling() {
      return rolling;
    },
    get ruleSheet() {
      return ruleSheet;
    },
    get rowTies() {
      return rowTies;
    },
    get rsBtn() {
      return rsBtn;
    },
    get sayCarried() {
      return sayCarried;
    },
    get sayNight() {
      return sayNight;
    },
    get schedule() {
      return schedule;
    },
    get setBtn() {
      return setBtn;
    },
    get flag() {
      return flag;
    },
    get stand() {
      return stand;
    },
    get stack() {
      return stack;
    },
    get paintTicket() {
      return paintTicket;
    },
    get adviceOf() {
      return adviceOf;
    },
    get firstCard() {
      return firstCard;
    },
    get sizeTitle() {
      return sizeTitle;
    },
    get atEdge() {
      return atEdge;
    },
    get holdStack() {
      return holdStack;
    },
    get spanOf() {
      return spanOf;
    },
    get inkAt() {
      return inkAt;
    },
    get setGw() {
      return setGw;
    },
    get settle() {
      return settle;
    },
    get shareWeek() {
      return shareWeek;
    },
    get shell() {
      return shell;
    },
    get sideRoom() {
      return sideRoom;
    },
    get slot() {
      return slot;
    },
    get spend() {
      return spend;
    },
    get letGo() {
      return letGo;
    },
    get spent() {
      return spent;
    },
    get statusLine() {
      return statusLine;
    },
    get strip() {
      return strip;
    },
    get subSheet() {
      return subSheet;
    },
    get takeFrom() {
      return takeFrom;
    },
    get tapIn() {
      return tapIn;
    },
    get textOf() {
      return textOf;
    },
    get ticks() {
      return ticks;
    },
    get toastGone() {
      return toastGone;
    },
    get topRow() {
      return topRow;
    },
    get totLine() {
      return totLine;
    },
    get totSaid() {
      return totSaid;
    },
    get totalEl() {
      return totalEl;
    },
    get uncovered() {
      return uncovered;
    },
    get vetoBack() {
      return vetoBack;
    },
    get vetoFromWhy() {
      return vetoFromWhy;
    },
    get waitClock() {
      return waitClock;
    },
    get waitSaid() {
      return waitSaid;
    },
    get waitSig() {
      return waitSig;
    },
    get waitV() {
      return waitV;
    },
    get waitWatch() {
      return waitWatch;
    },
    get waited() {
      return waited;
    },
    get weekGain() {
      return weekGain;
    },
    get weekLead() {
      return weekLead;
    },
    get weekModel() {
      return weekModel;
    },
    get weekPending() {
      return weekPending;
    },
    get weekRoll() {
      return weekRoll;
    },
    get weekSheet() {
      return weekSheet;
    },
    get whyMove() {
      return whyMove;
    },
    get whyPart() {
      return whyPart;
    },
    get whySub() {
      return whySub;
    },
    get wireMoveRow() {
      return wireMoveRow;
    },
    get xferRow() {
      return xferRow;
    }
  };
  const { pageName, resetTap, resetSheet, learn, gwNow, setGw, outerH, fitBlock, fitHead, fitPitch, redeck, schedule, covered, paintAvatar, renderHead, renderGwLine, paintDeadline, replanning, paintPlanStatus, tick, hosts, focusedKeys, keepFocus, renderPair, render, renderBaking, renderRules, ruleSheet, clearAll, driftRoom, owes, priceDrift, heldOrder, renderWeek, waitNow, paintWait, paintDim, weekModel, waited, clockShown, waitClock, plansHeading, plansListed: plansListed2 } = headPart(V);
  const { openWeek, renderLine, fitFacts, weekGain, boxOf, cardBoxes, reachLabels, labelWalls, sideRoom, cardIn, entryKey, topRow } = linePart(V);
  const { adviceOf, bindStack, firstCard, holdStack, paintTicket, sizeTitle } = ticketPart(V);
  const { renderDecks, spanOf, sheetFollows, swapPlate, placeLabel, statusLine, tokensOf, numParts, takeFrom, landMotion, land: land2, openPlace, placeKey, closePlace } = decksPart(V);
  const { drawPlace, planLine, fitLine, scaleHeads, fitBlocks, stepPlace, shadeTap, weekSheet } = placePart(V);
  const { drawWeek, clashRow, noteRow, forecastLine, waitSig, waitWatch, keepNight, sayNight, sayCarried, barNode, dotted, bsep, textOf, bankWarn, bankLead, weekLead, roadOfEv, movesTitle: movesTitle2, openWhy, deckOf, placeLink, whenFree, placeAct, whyTaps, whyActs, notOf, vetoBack, notAct, whenSheet, gainOf, whySub, numOf, numSaid, plNumSaid, hitTag, hitSaid, plansVs, whyPart, rowTies } = weekPart(V);
  const { moveX, xferRow, factSpans, itbNode, rollFacts, door, openChips, chipsDoor, bringDoor, doorStubs, changeRow, priceOf, addOnce, litPays, planKey, planSaid, takePlan, planRow, openPlanWhy, ftAfter, weekRoll, rollOf, shareWeek, moveGain, moveNum, weekPending, rollPending, rolling, whyMove, tapIn } = rowsPart(V);
  const { paintBoard, paintChoosing, pitchProps, renderPitch, mountHere, placeHint, frozenAt, renderRail, fitRail, edgeTicks, tabAt, toastOver, renderTotal, totalNum, keepGwLine, sellOf, hasField, plateOk, plateOf, renderPdBtn, playerDataSheet } = pitchPart(V);
  const { spend, letGo, atEdge, tickAt, railEnd, unfill, benchBare, swipeGw, pitchEnd, settle, releaseSoon, gesture, cancelGesture, dragBadge, dropBadge, armTo, armbandSheet, subSheet, lift, dragTo, dropOn, pitchChip, liftShirt, wireMoveRow, vetoRow, vetoFromWhy, pressed, stray, lifted, spentUp, spentDown, spentClick } = touchPart(V);
  el.classList.add("ah");
  ctx.api?.local?.set?.("fc:ahead:sugg", null);
  const learntNow = ctx.api?.local?.json?.(LEARN_KEY);
  const S = {
    drag: null,
    flashAt: 0,
    queued: false,
    live: isLive(ctx),
    down: /* @__PURE__ */ new Set(),
    held: false,
    week: null,
    learnt: new Set(Array.isArray(learntNow) ? learntNow : []),
    // the wait now (waitNow): the plan's solve and the viewed week's checks as one, {t0: its first solve's start (ms),
    // plan: a plan solve in it, max: the most its bar showed}
    waitAll: null
  };
  const head = h("header.ah-head", { "aria-label": "Forkcast" });
  const avatar = h("button.ah-avatar", { type: "button", onClick: () => ctx.openSheet("you") });
  const setBtn = h("button.ah-set", { type: "button", "aria-haspopup": "dialog", "aria-label": COPY.settingsTitle, onClick: () => ctx.openSheet("you", "settings") }, icon("settings", { size: 22 }));
  if (document.querySelector('meta[name="forkcast-release"]')) setBtn.style.visibility = "hidden";
  ctx.api?.access?.().then((a) => {
    setBtn.style.visibility = a?.release ? "hidden" : "";
    setBtn.disabled = !!a?.release;
  }).catch(() => {
  });
  const dlEl = h("span.ah-dlpart");
  const totLine = h("span.ah-tot.m-num", { "aria-hidden": "true" });
  const gwline = h("p.ah-gwline.m-num", null, dlEl, totLine);
  const slot = h("div", { dataset: { bannerSlot: "" } });
  const hint = h("div.ah-hint", { "aria-hidden": "true" });
  const ticks = roving(h("div.ah-ticks", { role: "radiogroup", "aria-label": "Gameweek" }), { pick: (b) => setGw(Number(b.dataset.gw)) });
  const rail = h("div.ah-rail", null, h("span.ah-thumb", { "aria-hidden": "true" }), ticks);
  const totalEl = h("span.ah-total.sr-only");
  const totSaid = h("span.sr-only", { "aria-live": "polite" });
  const waitSaid = h("span.sr-only", { role: "status" }), waitV = waitView();
  const railWrap = h("nav.ah-railwrap", { "aria-label": "Gameweeks", dataset: { nopull: "" } }, rail, totalEl, totSaid, waitSaid);
  const pdBtn = h("button.ah-pp.ah-pdbtn", { type: "button", "aria-haspopup": "dialog", onClick: () => {
    playerDataSheet();
  } });
  const rsBtn = h("button.ah-rsbtn", { type: "button", hidden: true, onClick: () => {
    resetTap();
  } });
  const chipsHint = h("div.ah-ph.chips", { "aria-hidden": "true", hidden: true }, ...COPY.hintChips.map((t) => h("span", null, t)));
  const HINTS = [[chipsHint, "chips"]];
  const cheerEl = h("div.ah-cheer.m-facts", { role: "status", hidden: true });
  const ctl = h("div.ah-ctl", null, railWrap, hint, cheerEl);
  const strip = h("div.ah-blockhost");
  const pitchHost = h("div.ah-pitch", { dataset: { nopull: "" } });
  const decks = h("div.ah-decks", { role: "group" });
  const remProbe = h("span.ah-remprobe", { "aria-hidden": "true" });
  const noticeSaid = h("span.sr-only", { "aria-live": "polite" });
  const flag = h("button.ah-fplflag", { type: "button", hidden: true, dataset: { row: "fpl" } });
  const stand = h("div.ah-stand");
  const stack = h("div.ah-stack", { dataset: { nopull: "" } }, ctl, strip);
  bindStack();
  el.append(head, slot, h("div.ah-pitchwrap", null, pitchHost, flag), noticeSaid, stack, remProbe);
  const asksHost = h("div.ah-rules-host");
  GO_GW = setGw;
  let fitKey = "", fitDrawn = false;
  const FACTS_PROBE = { gw: 37, ft: 5, next: 5, bank: 99.9 };
  const refitPitch = globalThis.ResizeObserver ? new ResizeObserver(() => {
    fitPitch();
    keepGwLine();
    fitFacts();
    ctl.style.setProperty("--ah-head-h", `${head.getBoundingClientRect().height}px`);
    const pm = pitchHost.querySelector(":scope > .pm");
    if (pm) fitFixtures(pm);
    fitRail();
    redeck();
  }) : null;
  refitPitch?.observe(el);
  refitPitch?.observe(pitchHost);
  refitPitch?.observe(remProbe);
  refitPitch?.observe(slot);
  refitPitch?.observe(head);
  globalThis.document?.fonts?.ready?.then(() => {
    if (ctl.isConnected) {
      fitKey = "";
      fitPitch();
      setTimeout(redeck, 0);
    }
  });
  const shell = el.closest(".m-app");
  const uncovered = new MutationObserver(() => {
    if (S.held && !covered() && !S.down.size) {
      S.held = false;
      render();
    }
  });
  if (shell) uncovered.observe(shell, { attributes: true, attributeFilter: ["class"] });
  const clock = setInterval(tick, 1e3);
  const COPY_FPL_TEAM = "Your team as set in FPL";
  const ap0 = approxAt;
  const WAIT_DIM_MS = 1e3;
  const LATE_S = 10;
  const FLY_MS = 2500, LAND_MAX = 3;
  const FLY_EASE = "cubic-bezier(.2, .8, .2, 1)";
  const LINE_LEAST = 0.8;
  const ADD_HOLD_MS = 500;
  TAP_IN = tapIn;
  const TOTAL_MS = 6e3;
  const toastGone = globalThis.MutationObserver ? new MutationObserver(() => {
    if (S.totDelta && S.totDelta.at === null && toastOver()) return;
    toastGone.disconnect();
    if (S.totDelta?.at !== null) return;
    S.totDelta.at = Date.now();
    const Q = plan(ctx);
    if (Q && el.isConnected) renderTotal(Q);
  }) : null;
  const PLATES = [
    // the sheet's names are the pill's, word for word (the spoken label says more)
    { key: "fxpts", label: "Points + opponent", spoken: "Points and opponent", short: "Points + opp", second: "both" },
    { key: "opp", label: "Opponent", short: "Opponent", second: "fx" },
    { key: "pts", label: "Points", spoken: "Points only", short: "Points", second: "pts" },
    { key: "price", label: "Price", spoken: "Current price", short: "Price", field: "price", text: (id, p) => fmt.money(p?.price) },
    // FPL pays back what it sells him for (half the profit): a buy of the plan's is sold at what he costs today
    { key: "sell", label: "Selling", spoken: "Selling price", short: "Selling", field: "price", ok: () => sellOf().size > 0, text: (id, p) => fmt.money(S.sell?.get(Number(id)) ?? p?.price) },
    // FPL's Progress towards the next price change, as its pitch shows it: pricePlate
    {
      key: "pchg",
      label: "Price change",
      spoken: "Price change progress",
      short: "Price change",
      field: "price_progress",
      text: (id, p) => pricePlate(p).text,
      bar: (id, p) => pricePlate(p)
    },
    { key: "own", label: "Owned", spoken: "Ownership", short: "Owned", field: "sel_pct", text: (id, p) => fmt.pct(p?.sel_pct) },
    { key: "form", label: "Form", short: "Form", field: "form", text: (id, p) => fmt.num(p?.form) },
    { key: "chance", label: "Chance", spoken: "Chance of playing", short: "Chance", field: "status", text: (id, p) => {
      const st = statusInfo(p?.status, p?.chance);
      return st.chance != null ? `${st.chance}%` : st.tone === "ok" ? "100%" : st.label;
    } }
  ];
  const PLATE_KEY = "fc:ahead:plate";
  const spent = { on: false, x: 0, y: 0 };
  rail.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    S.drag = { rail: { x: e.clientX, y: e.clientY, dragging: false, pid: e.pointerId, edge: atEdge(e), end: railEnd } };
  });
  rail.addEventListener("pointermove", (e) => {
    const st = S.drag?.rail;
    if (!st || st.pid !== e.pointerId) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.dragging && !st.edge && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      st.dragging = true;
      rail.classList.add("dragging");
      try {
        rail.setPointerCapture(e.pointerId);
      } catch {
      }
    } else if (!st.dragging && Math.abs(dy) > 10) {
      S.drag = null;
      return;
    }
    if (!st.dragging) return;
    const tk = tickAt(e.clientX, e.clientY);
    const gg = tk && !tk.classList.contains("edge") ? Number(tk.dataset.gw) : NaN;
    if (Number.isFinite(gg) && gg !== Number(ctx.store.get("gw"))) setGw(gg);
  });
  rail.addEventListener("pointerup", railEnd);
  rail.addEventListener("pointercancel", railEnd);
  rail.addEventListener("contextmenu", (e) => e.preventDefault());
  pitchHost.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || e.target.closest(".ah-place, .ah-decks button:not(.ah-cm:not(.tno))")) return;
    const P = plan(ctx);
    const badge = e.target.closest('.pm-badge[data-badge="c"], .pm-badge[data-badge="v"]');
    const bare = benchBare(e);
    const pl = bare ? null : e.target.closest(".pm-pl[data-id], .pm-bs[data-id]");
    const st = { x: e.clientX, y: e.clientY, id: pl ? Number(pl.dataset.id) : null, pl, moved: false, lifted: false, pid: e.pointerId, src: pitchHost, edge: atEdge(e), fl: flick().add(e.clientX, e.timeStamp), end: pitchEnd };
    S.drag = { pitch: st, used: false };
    if (badge && P) {
      st.badge = badge.dataset.badge;
      st.timer = setTimeout(() => {
        st.held = true;
      }, GRIP_MS);
      if (st.badge === "c" && P.editable && !CHIPS_OFF) {
        st.fill = holdFill(e.clientX, e.clientY, TC_MS, "TC");
        st.chip = setTimeout(() => {
          unfill(st);
          if (!st.flying) pitchChip(st, "tc");
        }, TC_MS);
      }
      return;
    }
    if (pl && P?.editable && !choosing(ctx, P)) st.timer = setTimeout(() => liftShirt(st, e), LONG_MS);
    else if (bare && P?.editable && !CHIPS_OFF) {
      st.fill = holdFill(e.clientX, e.clientY, LONG_MS, "BB");
      st.timer = setTimeout(() => {
        unfill(st);
        pitchChip(st, "bb");
      }, LONG_MS);
    }
  });
  pitchHost.addEventListener("pointermove", (e) => {
    const st = S.drag?.pitch;
    if (!st || st.pid !== e.pointerId || st.done) return;
    st.fl.add(e.clientX, e.timeStamp);
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (st.badge) {
      const far = Math.hypot(dx, dy) > 6;
      if (st.held && Math.hypot(dx, dy) > 3) {
        clearTimeout(st.chip);
        unfill(st);
      }
      if (st.flying || st.held && far) dragBadge(st, e);
      if (st.held || !far) return;
      clearTimeout(st.timer);
      clearTimeout(st.chip);
      unfill(st);
      st.badge = false;
    }
    if (!st.lifted && Math.hypot(dx, dy) > 8) {
      st.moved = true;
      clearTimeout(st.timer);
      unfill(st);
      if (!st.edge && Math.abs(dx) > Math.abs(dy)) {
        st.swipe = true;
        try {
          pitchHost.setPointerCapture(e.pointerId);
        } catch {
        }
      }
    }
    if (st.swipe && !reduceMotion()) {
      st.tx = swipeGw(dx) != null ? dx : dx / 3;
      pitchHost.classList.remove("settle");
      pitchHost.style.transform = `translateX(${st.tx}px)`;
    }
    if (st.lifted) dragTo(e);
  });
  pitchHost.addEventListener("pointerup", pitchEnd);
  pitchHost.addEventListener("pointercancel", pitchEnd);
  pitchHost.addEventListener("transitionend", (e) => {
    if (e.target === pitchHost) pitchHost.classList.remove("settle");
  });
  pitchHost.addEventListener("touchmove", (e) => {
    const st = S.drag?.pitch;
    if (st && (st.lifted || st.badge && st.held)) holdTouch(e);
  }, { passive: false });
  pitchHost.addEventListener("contextmenu", (e) => e.preventDefault());
  globalThis.addEventListener("pointerdown", pressed, true);
  const strays = ["pointerup", "pointercancel", "keydown", "blur"];
  for (const t of strays) globalThis.addEventListener(t, stray);
  const LIFT_MS = 350;
  const lifts = ["pointerup", "pointercancel", "blur"];
  for (const t of lifts) globalThis.addEventListener(t, lifted);
  globalThis.addEventListener("pointerup", spentUp);
  globalThis.addEventListener("pointerdown", spentDown, true);
  globalThis.addEventListener("click", spentClick, true);
  const awayToasts = () => {
    const g = viewedGw(ctx, plan(ctx));
    for (const t of toastRegion().querySelectorAll(".toast")) {
      const m = t.querySelector("button.btn") && /\bGW(\d+)\b/.exec(t.querySelector(".toast-msg")?.textContent ?? "");
      const away = !!m && g != null && Number(m[1]) !== g;
      t.classList.toggle("away", away);
      if (away) t.dataset.chip = `GW${m[1]}:`;
    }
  };
  const offs = [
    ctx.store.on("entry", () => AHEAD.showing.clear()),
    ctx.store.on("gw", () => {
      awayToasts();
      schedule();
    }),
    ctx.store.on("memory", () => schedule("mem")),
    ctx.store.on("aheadRev", () => schedule()),
    ctx.store.on("bringing", () => schedule()),
    ctx.store.on("learnt", () => {
      S.learnt = /* @__PURE__ */ new Set();
      schedule();
    }),
    ctx.store.on("aheadPair", () => schedule("pair"))
  ];
  memOf(ctx);
  render();
  return {
    // a bundle or connection change waits as any store change does (schedule: never under a finger or a large sheet)
    update() {
      schedule();
    },
    show() {
      render();
    },
    hide() {
    },
    unmount() {
      if (GO_GW === setGw) GO_GW = null;
      if (TAP_IN === tapIn) TAP_IN = null;
      offs.forEach((f) => f());
      for (const t of lifts) globalThis.removeEventListener(t, lifted);
      for (const t of strays) globalThis.removeEventListener(t, stray);
      globalThis.removeEventListener("pointerdown", pressed, true);
      globalThis.removeEventListener("pointerup", spentUp);
      globalThis.removeEventListener("pointerdown", spentDown, true);
      globalThis.removeEventListener("click", spentClick, true);
      clearInterval(clock);
      clearTimeout(S.totTimer);
      clearTimeout(S.chipWake);
      clearTimeout(S.dimTimer);
      closePlace(false);
      refitPitch?.disconnect();
      toastGone?.disconnect();
      uncovered.disconnect();
    }
  };
}

// js/m/ahead/pieces.js
var shirtOf = (L, id, size = 28) => shirt({ club: L.club(id), gk: L.pos(id) === "GK", size });
var clearGain = (c) => !!c && c.delta > 0 && c.label !== "coin";
var plPays = (pl) => pl?.state === "ready" && !!pl.solver;
var emptyHead = (g, { ink = false, hold = false, off = false, lock = false } = {}) => ink ? COPY.noTransfers : lock ? COPY.rollingOn : hold ? COPY.noTransferMade : off ? COPY.noTransfers : COPY.forkcastRolls(g);
function factsWords({ gw, ft, next = null, bank = null }) {
  return [
    [COPY.ftNow(ft), COPY.ftNowSaid(ft)],
    itbWords(bank),
    next != null ? [COPY.rollKeeps(next, gw + 1), COPY.rollKeepsSaid(next, gw + 1)] : null
  ].filter(Boolean);
}
function itbWords(bank) {
  const money = bank != null && bank >= -1e-9 ? fmt.money(Math.max(0, bank)) : null;
  return money ? [COPY.itb(money), COPY.itbSaid(money)] : null;
}
function rollFt(P, g, pl) {
  const w = weekOf(P, g), nx = P.gws.find((x) => x > g);
  if (pl.choice.moves.some((m) => m.gw === g) || pl.choice.chips?.[g] || !w || nx == null) return [];
  const ft = w.ft ?? 1, next = nextFt(ft, 0, ftGrant(P.season, nx));
  return [next > ft ? COPY.rollKeeps(next, nx) : COPY.rollCapped(ft, nx)];
}
function weekFacts(P, w) {
  return factsWords({ gw: w.gw, ft: w.ft ?? 1, next: nextFts(P, w), bank: w.bank });
}
var nextFts = (P, w) => w.gw < P.end ? nextFt(w.ft ?? 1, w.used ?? 0, ftGrant(P.season, w.gw + 1)) : null;
var chipsAsked = (ctx) => {
  const v = ctx.store?.get("chipsAt");
  return v && String(v.entry) === String(ctx.bundle?.entry?.id ?? ctx.store.get("entry")) ? v.gws : [];
};
var chipSettled = (x) => x.state !== "solving" && !x.unasked;
function chipBests(at, gws, noise = 0) {
  const best = {};
  const gap = (x) => x.cmp.delta;
  for (const c of CHIPS) {
    const ready = gws.map((g) => ({ g, x: at(c, g) })).filter(({ x }) => x.state === "ready");
    const top = ready.filter(({ x }) => x.cmp.delta > 0.05).sort((a, b) => b.x.cmp.delta - a.x.cmp.delta)[0];
    if (!top) continue;
    const next = ready.filter(({ g }) => g !== top.g).sort((a, b) => gap(b.x) - gap(a.x))[0] ?? null;
    const runner = next ? gap(next.x) : 0;
    const clear = verdictLabel(gap(top.x) - runner, noise) !== "coin";
    best[c] = {
      chip: c,
      gw: top.g,
      delta: top.x.cmp.delta,
      label: top.x.cmp.label,
      runner,
      next: next?.g ?? null,
      clear,
      final: gws.every((g) => chipSettled(at(c, g)))
    };
  }
  return best;
}
var honestBest = (src, c) => src.best[c]?.final && src.best[c].clear ? src.best[c] : null;
var CHIP_KEPT = /* @__PURE__ */ new Map();
var keptBest = (P, src, c, g) => {
  const { here, best } = halfBests(P, src, g);
  const k = `${P.entry}:${P.A}:${here[0]}`;
  if (!CHIP_KEPT.has(k)) CHIP_KEPT.set(k, {});
  const kept = CHIP_KEPT.get(k);
  if (here.some((x) => src.at(c, x).state === "solving")) return here.includes(kept[c]?.gw) ? kept[c] : null;
  return kept[c] = honestBest({ best }, c);
};
var chipWeekOf = (P, src, c, g) => {
  const b = keptBest(P, src, c, g);
  return b && clearGain(b) ? b : null;
};
var halfBests = (P, src, g) => {
  const half = halfEnd(P);
  const here = P.gws.filter((x) => x <= half === g <= half);
  return { here, best: src ? chipBests(src.at, here, P.noise) : null };
};
var CHIP_ROW = ["bb", "tc", "fh", "wc"];
var halfEnd = (P) => Number(P.b.meta?.chip_half ?? HALF);
var chipBack = (P, g) => g <= halfEnd(P) ? halfEnd(P) + 1 : null;
var chipsAvail = (P, g) => {
  const e = P.b.entry;
  const half = halfEnd(P);
  const here = (x) => x <= half === g <= half;
  return CHIP_ROW.filter((c) => !(e.chips_used || []).some((u) => u.chip === c && here(u.gw)) && (!here(P.A) || (e.chips_available || []).includes(c)));
};
var squadWeek = (w) => w?.chip === "fh" || w?.chip === "wc" ? w.chip : null;
var CHIP_GAINS = /* @__PURE__ */ new WeakMap();
var CHIP_TOLD = /* @__PURE__ */ new Map();
var toldSig = (P) => JSON.stringify([!!P.mem?.hold, asksOf(P)]);
var chipTold = (Q, g, cmp) => {
  if (!Q?.mem || typeof Q.mem !== "object") return;
  const k = `${Q.entry}:${Q.A}`, sig = toldSig(Q);
  if (CHIP_TOLD.get(k)?.sig !== sig) CHIP_TOLD.set(k, { sig, by: /* @__PURE__ */ new Map() });
  CHIP_TOLD.get(k).by.set(g, cmp);
};
var toldOf = (P, g) => {
  const t = CHIP_TOLD.get(`${P.entry}:${P.A}`);
  return t?.sig === toldSig(P) ? t.by.get(g) : null;
};
function chipGain(ctx, P, g) {
  let by = CHIP_GAINS.get(P);
  if (!by) CHIP_GAINS.set(P, by = /* @__PURE__ */ new Map());
  if (!by.has(g)) {
    const id = `chip:${g}`;
    const ref = P.pins.some((p) => p.id === id) ? baked(ctx, [], [id], P) : baked(ctx, [pinChip(g, null)], [], P);
    by.set(g, ref?.weeks ? compare2(ctx, { weeks: P.weeks }, asYours(ctx, ref)) : null);
  }
  return by.get(g) ?? (P.mem && typeof P.mem === "object" ? toldOf(P, g) : null) ?? null;
}
function chipWeekGain(ctx, P, g, listed = (x) => plansOf(ctx, P, x)) {
  if (!P.mem?.hold) return { cmp: chipGain(ctx, P, g), wait: false, vs: null };
  const r = weekRollOf(ctx, P, weekOf(P, g), listed);
  return { cmp: r, wait: !r && !approxAt(P, g) && !!listed(g)?.pending, vs: r ? COPY.planVsRoll : null };
}
var xpShown = (ctx, id, g) => {
  const d = ctx.data;
  const x = ctx.pitch?.xpAt?.(d?.byId?.get(Number(id)), g, d?.xpGws);
  return x == null ? "\u2013" : fmt.pts(x);
};
var plannedAt = (P, c, g = null) => {
  const half = halfEnd(P);
  const ok = (x) => g == null || x !== g && x <= half === g <= half;
  const k = [...P.weeks.filter((x) => x.chip === c), ...chipPins(P).filter((x) => x.chip === c)].map((x) => Number(x.gw)).find(ok);
  return k ?? null;
};
var chipCheck = (ctx, P, c, g) => canUseChip({
  base: ctx.data.base,
  gw: g,
  chip: c,
  draft: { chips: Object.fromEntries(chipPins(P).filter((x) => x.gw !== g && x.chip !== c).map((x) => [x.gw, x.chip])) }
});
function chipStates(ctx, P, g, src = null) {
  const w = weekOf(P, g), half = halfEnd(P), avail = chipsAvail(P, g);
  const used = P.b.entry?.chips_used || [];
  const { here, best: bests } = halfBests(P, src, g);
  const last = here[here.length - 1];
  const after = last < (g <= half ? half : LAST_ROUND) ? last : null;
  return CHIP_ROW.map((c) => {
    if (w?.chip === c) {
      const mine = chipPins(P).some((x) => x.chip === c && x.gw === g);
      if ((P.mark ?? P.approx).has(g)) return { chip: c, state: "on", mine, solving: true };
      if (!SQUAD_CHIPS.has(c)) return { chip: c, state: "on", mine, cmp: chipGain(ctx, P, g) };
      const v = chipWeekGain(ctx, P, g, (x) => plansListed(ctx, P, x));
      return { chip: c, state: "on", mine, cmp: v.cmp, solving: v.wait, ...v.vs ? { vs: v.vs } : {} };
    }
    if (!avail.includes(c)) {
      const u = used.find((x) => x.chip === c && x.gw <= half === g <= half);
      return { chip: c, state: "off", at: u?.gw ?? null, back: chipBack(P, g) };
    }
    const at = plannedAt(P, c, g);
    if (at != null) return { chip: c, state: "moved", at };
    const squad = !!src && SQUAD_CHIPS.has(c);
    const rolled = squad && !!P.mem?.hold;
    const pre = src ? src.at(c, g) : null;
    const sb = squad ? halfBests(P, src, g).best : bests;
    const wk = squad ? chipWeekOf(P, src, c, g) : null;
    const pick = squad ? here.includes(wk?.gw) ? wk : null : sb ? honestBest({ best: sb }, c) : null;
    const numAt = (x) => rolled ? chipNumber(ctx, P, x, c, src.at(c, x)) : chipShown(ctx, P, x, c);
    const far = squad && pick && pick.gw !== g ? numAt(pick.gw) : null;
    const near = squad && (rolled || !w?.chip) ? numAt(g) : null;
    const own = near?.cmp ? near : null;
    return {
      chip: c,
      state: w?.chip ? "swap" : "free",
      instead: w?.chip ?? null,
      cmp: own?.cmp ?? (near?.wait || rolled ? null : pre?.state === "ready" ? pre.cmp : null),
      solving: !!near?.wait || !own && !rolled && pre?.state === "solving",
      ...rolled ? { vs: COPY.planVsRoll } : {},
      ...own ? { pays: own.pays, vs: own.vs } : {},
      best: pick && squad ? { ...pick, delta: far?.cmp?.delta ?? (pick.gw === g ? own?.cmp.delta ?? null : null), vs: far?.vs ?? own?.vs ?? null } : pick,
      top: sb?.[c] ?? null,
      final: !!src && here.every((x) => chipSettled(src.at(c, x))) && here.some((x) => src.at(c, x).state === "ready"),
      wait: src ? chipWait(src, c, here) : null,
      after
    };
  });
}
function chipWait(src, c, here) {
  const need = here.filter((x) => {
    const s = src.at(c, x);
    return s.state !== "none" || !!s.error;
  });
  const left = need.filter((x) => src.at(c, x).state === "solving");
  if (!left.length) return null;
  const asked = need.map((x) => src.asked?.(c, x)).filter((t) => t != null);
  return {
    g: left.find((x) => src.asked?.(c, x) != null) ?? left[0],
    i: need.length - left.length + 1,
    n: need.length,
    t0: asked.length ? Math.min(...asked) : null,
    ...here.some((x) => src.at(c, x).unasked) ? { part: true } : {}
  };
}
var PREPS = /* @__PURE__ */ new Map();
var PREP_ASKED = /* @__PURE__ */ new Map();
var PREP = { mem: null, flight: null, timer: null, due: 0, until: 0, gen: 0 };
var PREPS_MAX = 96;
var PREP_TIMING = { again: 1500, hold: 3e4 };
function prepKeep(key, got) {
  PREPS.set(key, got);
  while (PREPS.size > PREPS_MAX) PREPS.delete(PREPS.keys().next().value);
  PREP.gen++;
}
var PREP_SIGS = /* @__PURE__ */ new WeakMap();
function prepSig(P) {
  if (!PREP_SIGS.has(P)) {
    const pins = P.pins.map(({ at, label, ...p }) => p);
    PREP_SIGS.set(P, JSON.stringify([P.b.version, P.editable, P.A, pins, P.weeks.map((w) => w.chip ?? null)]));
  }
  return PREP_SIGS.get(P);
}
var PREP_MEMO = /* @__PURE__ */ new WeakMap();
var PREP_MEMO_MAX = 8;
function prepMemo(ctx, P) {
  const sig = prepSig(P);
  let by = PREP_MEMO.get(ctx.data);
  if (!by) PREP_MEMO.set(ctx.data, by = /* @__PURE__ */ new Map());
  let m = by.get(sig);
  if (!m) {
    by.set(sig, m = { slots: null, items: null, made: null });
    while (by.size > PREP_MEMO_MAX) by.delete(by.keys().next().value);
  }
  return m;
}
function prepSlots(ctx, P) {
  const m = prepMemo(ctx, P);
  if (m.slots) return m.slots;
  if (!P.editable || !ctx.api?.solve) return m.slots = [];
  const taken = new Set(P.weeks.filter((w) => w.chip).map((w) => w.gw));
  return m.slots = P.gws.filter((g) => !isFrozen(P, g)).flatMap((g) => CHIP_ROW.filter((c) => plannedAt(P, c) == null && chipCheck(ctx, P, c, g).ok).map((c) => ({ chip: c, gw: g, taken: taken.has(g) })));
}
function prepItems(ctx, P) {
  const m = prepMemo(ctx, P);
  if (m.items) return m.items;
  try {
    m.items = prepSlots(ctx, P).map((x) => {
      const e = chipEdit(P, x.gw, x.chip);
      const values = valuesFor(ctx, e.pins, e.drop);
      return { ...x, edit: e, values, key: valuesKey(P, values) };
    });
  } catch (e) {
    console.error("Forkcast: chip preparations", e);
    m.items = [];
  }
  return m.items;
}
var PREP_VIEW = /* @__PURE__ */ new WeakMap();
function chipPreps(ctx, P = plan(ctx)) {
  if (!P) return { at: () => ({ state: "none" }), best: {}, items: [] };
  let r = PREP_VIEW.get(P);
  const ak = chipsAsked(ctx).join();
  if (r?.gen !== PREP.gen || r.ak !== ak) {
    const items = prepItems(ctx, P);
    const by = new Map(items.map((x) => [`${x.chip}@${x.gw}`, x]));
    const asked = (c, g) => PREP_ASKED.get(by.get(`${c}@${g}`)?.key) ?? null;
    const memo2 = /* @__PURE__ */ new Map();
    const at = (c, g) => {
      const k = `${c}@${g}`;
      if (!memo2.has(k)) {
        const asked2 = chipsAsked(ctx).includes(g), it = asked2 ? by.get(k) : null;
        const got = it ? PREPS.get(it.key) : null;
        memo2.set(k, !it ? { state: "none", ...!asked2 && by.has(k) ? { unasked: true } : {} } : got?.weeks ? { state: "ready", road: got, cmp: compare2(ctx, asYours(ctx, got), { weeks: P.weeks }) } : got ? { state: "none", error: got } : { state: "solving" });
      }
      return memo2.get(k);
    };
    PREP_VIEW.set(P, r = { at, asked, best: chipBests(at, P.gws, P.noise), items, gen: PREP.gen, ak });
  }
  pumpPreps(ctx, P, r.items);
  return r;
}
function pumpPreps(ctx, P, items) {
  if (PREP.mem !== memOf(ctx)) Object.assign(PREP, { mem: memOf(ctx), flight: null, until: 0 });
  if (PREP.flight || leftBehind(ctx, P)) return;
  const viewed = Number(ctx.store.get("gw"));
  const order = (x) => (x.taken ? 2 : 0) + (x.gw === viewed ? 0 : 1);
  const asked = chipsAsked(ctx);
  const next = items.filter((x) => asked.includes(x.gw) && !PREPS.has(x.key)).sort((a, b) => order(a) - order(b) || a.gw - b.gw)[0];
  if (!next) return;
  const wait = P.healing || ctx.api.slotBusy?.("spec") ? PREP_TIMING.again : Math.max(0, PREP.until - Date.now());
  if (wait > 0) {
    prepAgain(ctx, wait);
    return;
  }
  const flight = PREP.flight = { key: next.key };
  const ours = () => PREP.flight === flight;
  if (!PREP_ASKED.has(next.key)) PREP_ASKED.set(next.key, Date.now());
  while (PREP_ASKED.size > PREPS_MAX) PREP_ASKED.delete(PREP_ASKED.keys().next().value);
  solveKept(ctx.api, { entry: Number(P.entry), purpose: "chipprep", values: next.values }).then((res) => {
    if (res.road || res.state === "error") prepKeep(next.key, res.road ?? "error");
    else if (ours()) PREP.until = Date.now() + PREP_TIMING.again;
  }, () => {
    if (ours()) PREP.until = Date.now() + PREP_TIMING.hold;
  }).finally(() => {
    if (PREP.flight === flight) PREP.flight = null;
    prepAgain(ctx, 0);
  });
}
var prepsWaiting = (ctx, P) => prepItems(ctx, P).some((x) => !PREPS.has(x.key));
function prepAgain(ctx, ms) {
  clearTimeout(PREP.timer);
  PREP.due = Date.now() + ms;
  PREP.timer = setTimeout(() => {
    PREP.timer = null;
    if (attach()?.ctx === ctx) chipPreps(ctx);
  }, ms);
}

// js/m/ahead/buys.js
var FUND_MAINS = 3;
var FUND_SELLS = 8;
var FUND_BUYS = 4;
var BUYS = /* @__PURE__ */ new WeakMap();
function buyPlan(ctx, id, g, { out = null } = {}) {
  const P = plan(ctx);
  if (!P || !weekOf(P, g)) return { kind: "none", short: null, problem: null };
  let by = BUYS.get(P);
  if (!by) BUYS.set(P, by = /* @__PURE__ */ new Map());
  const k = `${id}:${g}:${out ?? ""}`;
  if (!by.has(k)) by.set(k, findBuy(ctx, P, Number(id), Number(g), out == null ? null : Number(out)));
  return by.get(k);
}
function saleTries(ctx, P, id, g, fixed = null) {
  const d0 = draftFor(ctx, P, id, g);
  const mine = movedBesides(P, id, g);
  const sells = fixed != null ? [fixed] : squadBefore(P, g).filter((p) => P.L.pos(p) === P.L.pos(id) && !mine.has(p));
  return sells.map((o) => ({ o, r: addMove(ctx, d0, g, o, id, takenBy(ctx, P)) })).sort((a, b) => b.r.ev.total - a.r.ev.total);
}
var SALES = /* @__PURE__ */ new WeakMap();
function saleOptions(ctx, id, g) {
  const P = plan(ctx);
  if (!P || !weekOf(P, g)) return [];
  let by = SALES.get(P);
  if (!by) SALES.set(P, by = /* @__PURE__ */ new Map());
  const k = `${id}:${g}`;
  if (!by.has(k)) {
    const ev0 = planBaseline(ctx, P, g);
    by.set(k, saleTries(ctx, P, Number(id), Number(g)).map(({ o, r }) => ({ out: o, cmp: r.problem ? null : compare2(ctx, r.ev, ev0), problem: r.problem })));
  }
  return by.get(k);
}
function findBuy(ctx, P, id, g, fixed) {
  const ev0 = planBaseline(ctx, P, g);
  const by = takenBy(ctx, P);
  const into = squadBefore(P, g), w = weekOf(P, g);
  if (squadWeek(w)) return { kind: "none", short: null, problem: { code: w.squad.includes(id) ? "owned" : "chip", gw: g } };
  if (into.includes(id) || w.squad.includes(id)) return { kind: "none", short: null, problem: { code: "owned", gw: g } };
  const hitsAt = (ev) => ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  const done = (kind, r, extra) => ({ kind, in: id, draft: r.draft, ev: r.ev, cmp: compare2(ctx, r.ev, ev0), hits: Math.max(0, hitsAt(r.ev) - hitsAt(ev0)), ...extra });
  const mine = movedBesides(P, id, g), kept = keptFrom(P, g);
  const all = saleTries(ctx, P, id, g, fixed);
  const tries = fixed != null ? all : all.filter((t) => !kept.has(t.o));
  if (all.length && !tries.length) return { kind: "none", short: null, problem: { code: "kept", gw: g, kept: all.map((t) => [t.o, kept.get(t.o)]) } };
  const fits = tries.find((t) => !t.r.problem);
  const broke = tries.filter((t) => t.r.problem?.code === "budget");
  if (!fits && !broke.length) return { kind: "none", short: null, problem: tries[0]?.r.problem ?? null };
  const d0 = draftFor(ctx, P, id, g);
  const fromG = (p) => P.gws.filter((x) => x >= g).reduce((s, x) => s + (P.L.xp(p, x) ?? 0), 0);
  const prev = ev0.gws.find((s) => s.gw === g - 1);
  const sale = (p) => prev?.sell?.[p] ?? (P.L.sellT(p) ?? P.L.priceT(p) ?? 0) / 10;
  const pool = /* @__PURE__ */ new Map();
  const buysOf = (pos) => pool.get(pos) ?? pool.set(pos, buyCandidates(P, { pos, from: g, not: [id], limit: 80 })).get(pos);
  const solo = /* @__PURE__ */ new Map();
  const aloneOf = (y, z) => solo.get(`${y}>${z}`) ?? solo.set(`${y}>${z}`, addMove(ctx, d0, g, y, z, by)).get(`${y}>${z}`);
  const ev1 = by(d0, g), base = ev1.total;
  let best = null;
  for (const t of broke.filter((x) => !fits || x.r.ev.total > fits.r.ev.total).slice(0, FUND_MAINS)) {
    const need = t.r.problem.short;
    const held = into.filter((p) => p !== t.o && !mine.has(p) && !kept.has(p)).sort((a, b) => fromG(a) - fromG(b)).map((y) => [y, buysOf(P.L.pos(y)).filter((z) => (P.L.price(z) ?? Infinity) <= sale(y) - need + 1e-6).slice(0, FUND_BUYS)]).filter(([, zs]) => zs.length).slice(0, FUND_SELLS);
    for (const [y, buys] of held) {
      for (const z of buys) {
        const r = addMove(ctx, t.r.draft, g, y, z, by);
        if (r.problem) continue;
        const a = aloneOf(y, z);
        const net = r.ev.total - (a.problem ? base : a.ev.total);
        if (!best || net > best.net) best = { o: t.o, need, y, z, r, net };
      }
    }
  }
  const two = best && done("two", best.r, { out: best.o, fund: { out: best.y, in: best.z }, short: best.need });
  if (fits) {
    const gap = best ? best.net - (fits.r.ev.total - base) : 0;
    return best && gap > 0 && verdictLabel(gap, P.noise) !== "coin" ? two : done("one", fits.r, { out: fits.o });
  }
  const short = Math.min(...broke.map((t) => t.r.problem.short));
  return two ?? { kind: "none", short, problem: { code: "budget", gw: g, short } };
}
function saleBuy(ctx, id, g, out) {
  const bp = buyPlan(ctx, id, g, { out });
  if (bp.kind === "one" || bp.kind === "none" && bp.problem?.code !== "budget") return bp;
  const P = plan(ctx);
  const t = saleTries(ctx, P, Number(id), Number(g), Number(out))[0];
  if (!t || problemsOf(ctx, t.r.ev, g).some((p) => p.code !== "budget")) return bp;
  const ev0 = planBaseline(ctx, P, g);
  const hitsAt = (ev) => ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  return { kind: "one", out: Number(out), in: Number(id), draft: t.r.draft, ev: t.r.ev, cmp: compare2(ctx, t.r.ev, ev0), hits: Math.max(0, hitsAt(t.r.ev) - hitsAt(ev0)), short: t.r.problem?.short ?? 0 };
}
function bringIn(ctx, id, g, bp) {
  const P = plan(ctx);
  if (bp?.kind === "pick") {
    const pin = wishPin(P, id, g), was = asksOf(P).find((q) => q.id === pin.id && JSON.stringify(q.must) !== JSON.stringify(pin.must));
    const taken2 = [...new Map([...bringInTakes(P, id, g, bp), ...was ? [was] : []].map((q) => [q.id, q])).values()], what2 = withTaken(P, pin.label, taken2);
    return edit(ctx, { pins: [tookBy(pin, taken2)], drop: [pin.id, ...taken2.map((q) => q.id)], road: bp.road, from: g, what: what2, taken: taken2, text: vsPrev(ctx, what2, { total: true }) });
  }
  if (!bp || bp.kind !== "one" && bp.kind !== "two") return false;
  const nm = P.L.name;
  const pins = buyPins(P, id, g, bp);
  const funds = fundsOf(bp);
  const taken = bringInTakes(P, id, g, bp);
  const what = withTaken(P, funds.length ? COPY.cameIn([id, ...funds.map((f) => f.in)].map(nm), g === P.A ? null : g) : COPY.cameInFor(nm(id), nm(bp.out), g === P.A ? null : g), taken);
  return edit(ctx, {
    pins: pins.map((p) => tookBy(p, taken)),
    drop: [...wishDrop(P, id), ...funds.flatMap((f) => wishDrop(P, f.in)), ...taken.map((q) => q.id)],
    from: g,
    what,
    taken,
    ending: (Q, prev) => endingOf(Q, prev, g, { own: bp.out, named: funds })
  });
}
var tookBy = (p, taken) => taken.length ? { ...p, took: taken.map((q) => structuredClone(q)) } : p;
var teamKey = (P) => `${P.entry}|${P.A}`;
var choosing = (ctx, P, g = null) => {
  const b = ctx.store.get("bringing");
  return b && P && b.team === teamKey(P) && (g == null || b.g === g) ? b : null;
};
var stopChoosing = (ctx) => ctx.store.set("bringing", null);
var replaceable = (ctx, id, g) => saleOptions(ctx, id, g).filter((x) => !x.problem || x.problem.code === "budget").map((x) => ({ out: x.out, short: x.problem?.short ?? 0 }));
function chooseOnPitch(ctx, id, g) {
  const P = plan(ctx);
  if (!editable(ctx)) {
    toastOf(ctx)(OFFLINE_EDIT, "warn");
    return false;
  }
  if (squadWeek(weekOf(P, g))) return bringIn(ctx, id, g, { kind: "pick", in: Number(id), road: null });
  if (!replaceable(ctx, id, g).length) {
    sayBuyProblem(ctx, P, id, buyPlan(ctx, id, g), "info");
    return false;
  }
  ctx.store.set("bringing", { id: Number(id), g, team: teamKey(P) });
  return true;
}
var PLACED = null;
var placedAt = (g) => PLACED?.g === g ? PLACED : null;
var placedDone = () => {
  PLACED = null;
};
function replaceWith(ctx, out) {
  const P = plan(ctx), b = choosing(ctx, P);
  if (!b || !replaceable(ctx, b.id, b.g).some((x) => x.out === Number(out))) return false;
  const bp = saleBuy(ctx, b.id, b.g, out);
  if (bp.kind !== "one") {
    sayBuyProblem(ctx, P, b.id, bp, "info");
    return false;
  }
  stopChoosing(ctx);
  PLACED = { g: b.g, out: Number(out), in: b.id };
  const made = bringIn(ctx, b.id, b.g, bp);
  if (!made) placedDone();
  return made;
}
var fundsOf = (bp) => bp.fund ? [bp.fund] : [];
var freedBy = (ev, g, m) => {
  const x = ev?.gws.find((s) => s.gw === g)?.moves.find((y) => y.out === m.out);
  return (x?.sell ?? 0) - (x?.buy ?? 0);
};
var buyPins = (P, id, g, bp) => [
  pinSell(bp.out, g, P.end, { in: id, label: `${P.L.name(bp.out)} \u2192 ${P.L.name(id)} from GW${g}` }),
  ...fundsOf(bp).map((f) => pinSell(f.out, g, P.end, { in: f.in, funds: freedBy(bp.ev, g, f) > 0 ? Number(id) : null, label: `${P.L.name(f.out)} \u2192 ${P.L.name(f.in)} from GW${g}` }))
];
var wishSolve = (ctx, P, id, g, purpose) => solveFor(ctx, [wishPin(P, id, g)], purpose, wishTakes(P, id, g).map((p) => p.id));
var wishTakes = (P, id, g) => [...new Map([...clashing(P, wishPin(P, id, g)), ...laterBuys(P, id, g)].map((p) => [p.id, p])).values()];
var laterBuys = (P, id, g) => {
  if (squadWeek(weekOf(P, g)) === "fh") return [];
  const buys = asksOf(P).filter((p) => p.kind === "sell" && p.in === Number(id) && p.gw > g);
  return [...buys, ...asksOf(P).filter((p) => p.kind === "sell" && p.funds === Number(id) && buys.some((b) => b.gw === p.gw))];
};
var movedBesides = (P, id, g) => {
  const s = movedFrom(P, g);
  for (const p of laterBuys(P, id, g)) if (p.funds == null) s.delete(Number(p.player));
  return s;
};
var draftFor = (ctx, P, id, g) => laterBuys(P, id, g).filter((p) => p.funds != null).reduce((d, p) => {
  const m = flatMoves(d).find((x) => x.gw === p.gw && x.out === p.player);
  return m ? dropMove(d, m) : d;
}, draftOf(ctx));
function bringInTakes(P, id, g, bp) {
  if (bp?.kind === "pick") return wishTakes(P, id, g);
  const pins = buyPins(P, id, g, bp);
  const ids2 = new Set(pins.map((p) => p.id));
  const ownBuy = (q, p) => q.kind === "sell" && p.kind === "sell" && q.in != null && Number(q.in) === Number(p.player) && Number(q.gw) < Number(p.gw);
  return [...new Map([...pins.flatMap((p) => clashing(P, p).filter((q) => !ownBuy(q, p))), ...laterBuys(P, id, g)].filter((q) => !ids2.has(q.id)).map((q) => [q.id, q])).values()];
}
var removesText = (P, pins) => pins.length ? `It removes ${pins.map((q) => `\u201C${ruleOf(P, q).text}\u201D`).join(", ")}.` : "";
function holdBuy(ctx, id, g, road = null) {
  const P = plan(ctx);
  if (!P) return null;
  return road ? pickOfRoad(ctx, P, id, g, road) : buyPlan(ctx, id, g);
}
function pickOfRoad(ctx, P, id, g, road) {
  const rw = (road.weeks || []).find((x) => Number(x.gw) === Number(g));
  if (!ids([...rw?.xi || [], ...rw?.bench || []]).includes(Number(id))) return buyPlan(ctx, id, g);
  return { kind: "pick", in: Number(id), road, cmp: compare2(ctx, asYours(ctx, road), { weeks: P.weeks }), hits: Math.max(0, (rw?.hits ?? 0) - (weekOf(P, g)?.hits ?? 0)) };
}
function weekWith(P, g, { road = null, bp = null } = {}) {
  const chip = squadWeek(weekOf(P, g));
  if (bp?.kind === "pick" && chip) {
    const w2 = (bp.road.weeks || []).find((x) => Number(x.gw) === g);
    if (!w2) return null;
    const now = weekOf(P, g)?.squad ?? [], sq = ids([...w2.xi || [], ...w2.bench || []]);
    const moves = pairedMoves(now.filter((x) => !sq.includes(x)), sq.filter((x) => !now.includes(x)), P.L);
    return { moves, n: moves.length, hits: w2.hits ?? 0, chip };
  }
  const rd = road ?? (bp?.kind === "pick" ? bp.road : null);
  if (rd) {
    const w2 = (rd.weeks || []).find((x) => Number(x.gw) === g);
    if (!w2) return null;
    return { moves: pairMovesOf(rd, g, weekOf(P, g)?.moves ?? [], P.L), n: (w2.in || []).length, hits: w2.hits ?? 0 };
  }
  if (bp?.kind !== "one" && bp?.kind !== "two") return null;
  const w = bp.ev.gws.find((s) => s.gw === g);
  return { moves: [{ out: bp.out, in: bp.in }, ...fundsOf(bp)], n: w?.transfers ?? 0, hits: w?.hits ?? 0 };
}
function inWords(P, g, how) {
  const nm = (x) => x == null ? "\u2014" : P.L.name(x);
  const w = weekWith(P, g, how);
  if (!w?.moves.length) return null;
  const said = (ms) => ms.map((m) => `${nm(m.out)} \u2192 ${nm(m.in)}`);
  return [...said(w.moves), w.chip ? COPY.chipChanges(w.chip, w.n) : `${w.n} transfer${w.n === 1 ? "" : "s"}, ${COPY.hitsIn(w.hits)}`].join(" \xB7 ");
}
function buyProblem(ctx, P, id, bp) {
  const p = bp?.problem;
  const g = p?.gw ?? P.A;
  if (p?.code === "owned") return COPY.inTeam(P.L.name(id));
  if (p?.code === "club" || p?.code === "kept") return problemText(ctx, p);
  if (p?.code === "budget") {
    const next = fitsLater(ctx, P, id, bp);
    return COPY.noFit(P.L.name(id), p.short, g, next);
  }
  return COPY.infeasible(g);
}
var fitsLater = (ctx, P, id, bp) => bp?.problem?.code !== "budget" ? null : P.gws.find((x) => x > (bp.problem.gw ?? P.A) && buyPlan(ctx, id, x).kind === "one") ?? null;
function bringInFrom(ctx, id, g) {
  if (!bringIn(ctx, id, g, buyPlan(ctx, id, g))) return false;
  ctx.sheets?.closeAll();
  ctx.navigate?.("ahead", { gw: g }, { replace: true, top: true });
  return true;
}
function sayBuyProblem(ctx, P, id, bp, kind = "warn") {
  const next = fitsLater(ctx, P, id, bp);
  toastOf(ctx)(buyProblem(ctx, P, id, bp), kind, next == null ? {} : { action: { label: COPY.bringIn(null, next), onClick: () => bringInFrom(ctx, id, next) } });
}
var solvesRound = (bp) => bp?.kind === "none" && ["budget", "club", "chip"].includes(bp.problem?.code);
var captainMoved = (Q, prev, g) => {
  const c = weekOf(Q, g)?.captain, was = weekOf(prev, g)?.captain;
  return c != null && was != null && c !== was ? ` \xB7 ${COPY.captainNow(Q.L.name(c))}` : "";
};
var lineupMoved = (Q, prev, g) => {
  const w = weekOf(Q, g), was = weekOf(prev, g);
  const benched = w && was ? (w.bench || []).map(Number).filter((id) => (was.xi || []).map(Number).includes(id)) : [];
  return `${benched.length ? ` \xB7 ${COPY.toBench(benched.map((id) => Q.L.name(id)))}` : ""}${captainMoved(Q, prev, g)}`;
};
function resetPlan(ctx) {
  if (!editable(ctx)) {
    toastOf(ctx)(OFFLINE_EDIT, "warn");
    return false;
  }
  const I = info(ctx);
  const lus = clone(lineups(ctx, I)), gone = clone(removedBy(I));
  const prevP = plan(ctx), at = ctx.store.get("gw");
  forgetEdit();
  stopChoosing(ctx);
  prevP?.gws.forEach((g) => {
    showTransfer(prevP, g, false);
    showSuggestion(prevP, g, false);
  });
  if (!planHasYours(prevP) && !Object.keys(lus).length) {
    if (prevP) ctx.store.set("gw", prevP.A);
    pairChanged(ctx);
    return true;
  }
  const r = memOf(ctx).reset();
  setLineups(ctx, I, {});
  REMOVED.by = {};
  flashLanding(ctx, prevP, { gws: I.gws });
  say(ctx, COPY.planReset, undoOf(ctx, subjectOf(COPY.planReset), () => {
    if (!r.undo()) return false;
    setLineups(ctx, I, lus);
    REMOVED.by = gone;
    ctx.store.set("gw", at);
  }));
  if (prevP) ctx.store.set("gw", prevP.A);
  return true;
}
var planHasYours = (P) => (P?.pins || []).some((p) => !derivedPin(p)) || Object.values(removedBy(P)).some((x) => x.length > 0);
var solverCap = (P) => hitCap(P?.base) ?? (Number.isInteger(P?.b?.meta?.hit_cap) ? P.b.meta.hit_cap : null);
function hitsChoices(P) {
  const cap = solverCap(P);
  const top = cap ?? 1;
  const at = P?.mem?.hitsMax ?? top;
  return { at: Math.min(at, top), choices: Array.from({ length: top + 1 }, (_, n) => [n, COPY.hitsSeg(n)]) };
}
function setHitsMaxWithUndo(ctx, n) {
  const P = plan(ctx);
  const { at } = hitsChoices(P);
  if (n === at) return false;
  const cap = solverCap(P);
  const what = COPY.hitsMax(n);
  return edit(ctx, { from: info(ctx)?.A, what, text: vsPrev(ctx, what), hitsMax: cap !== null && n >= cap ? null : n });
}
function chipWeek(P, g) {
  const c = weekOf(P, g)?.chip ?? P?.mem?.chips?.[g] ?? null;
  return c === "wc" || c === "fh" ? c : null;
}
function gwMode(P, g) {
  if (P.pins.some((p) => p.id === `roll:${g}` || p.id === "hold" && (p.rolls || []).includes(g))) return "roll";
  const mine = P.pins.some((p) => p.id === `hits:${g}`);
  if (!mine && P.pins.some((p) => p.id === "hold" && parseSpans(p.must || []).some(([, a, b]) => a <= g && g <= b))) return "roll";
  if (!mine && P.pins.some((p) => p.id === "hold" && p.caps?.[g] != null)) return "roll";
  const n = composePins(P.pins, { from: g, to: g }).hits[g];
  const cap = hitCap(P.base);
  if (n === void 0 || cap !== null && n >= cap) return "auto";
  return n === 0 ? "free" : `h${n}`;
}
var takenBack = (P, pins, gone = []) => {
  const sold = [...pins, ...gone].filter((q) => q?.kind === "sell").map((q) => Number(q.gw));
  const said = pins.filter((q) => !(isRoll(q) && Number(q.caps?.[q.gw] ?? 0) > 0 && sold.includes(Number(q.gw))));
  return said.length ? { pins, text: COPY.altClash(said.map((q) => plainRule(P, q))) } : null;
};
var plainRule = (P, q) => {
  const nm = P.L.name;
  if (q.kind === "sell" && q.in != null) return `${nm(q.player)} \u2192 ${nm(q.in)}`;
  if (q.kind === "slide") return `${nm(q.out)} \u2192 ${nm(q.player)}`;
  return ruleOf(P, q).text;
};
var rowName = (P, q) => `${plainRule(P, q)}${q.kind === "sell" && q.in != null || q.kind === "slide" ? ` \xB7 GW${q.gw}` : ""}`;
var WATCHES = /* @__PURE__ */ new WeakMap();
function watchOf(ctx) {
  const P = plan(ctx);
  if (!P) return null;
  const minute = Math.floor(Date.now() / 6e4);
  let c = WATCHES.get(P);
  if (!c || c.minute !== minute) WATCHES.set(P, c = { minute, watch: priceWatch(inputs(ctx), draftOf(ctx)) });
  return c.watch;
}
function watchView(watch, { move = null, cls = "", wait = null } = {}) {
  if (!watch) return null;
  if (move) {
    const m = watch.moves.find((x) => x.out === Number(move.out) && x.in === Number(move.in));
    if (!m?.parts.length) return null;
    return h(`span.pw-move${cls}`, null, m.parts.flatMap((p, i) => [
      i ? " \xB7 " : null,
      h("span", { "aria-hidden": "true", class: { "pw-up": p.dir > 0, "pw-down": p.dir < 0, "pw-maybe": !p.sure } }, p.text.slice(0, 1)),
      p.text.slice(1)
    ]));
  }
  if (!watch.line) return null;
  return h(
    `div.pw-foot${cls}`,
    { class: { act: watch.tone === "act" }, role: watch.tone === "act" ? "status" : null },
    // the reading's time as the line's quiet tail, after its sentence without the full stop ("… gains £0.1m · as of 00:50")
    h("p.pw-line", null, watch.note ? watch.line.replace(/\.$/, "") : watch.line, watch.note ? h("span.pw-note", null, ` \xB7 ${watch.note}`) : null),
    wait ? h("button.ah-lnk.pw-wait", { type: "button", "aria-label": COPY.watchWaitSaid, onClick: wait }, COPY.watchWait) : null
  );
}
var DL_WORDS = { ms: NaN, hm: "", wd: "", date: "", long: "" };
function deadlineWords(ms) {
  if (DL_WORDS.ms !== ms) {
    const d = new Date(ms);
    const hm = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const wd = d.toLocaleDateString("en-GB", { weekday: "short" });
    const dm = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    DL_WORDS = { ms, hm, wd, date: `${wd} ${dm} ${hm}`, long: `${wd} ${dm} at ${hm}` };
  }
  return DL_WORDS;
}
function deadlineInfo(epoch) {
  const ms = toMs(epoch);
  if (!Number.isFinite(ms)) return { ms, left: NaN, date: "", long: "", short: "", text: "", said: "", tone: "" };
  const { hm, wd, date, long } = deadlineWords(ms);
  const left = ms - Date.now();
  let sec = Math.max(0, Math.floor(left / 1e3));
  const dd = Math.floor(sec / 86400);
  sec -= dd * 86400;
  const hh = Math.floor(sec / 3600);
  sec -= hh * 3600;
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  const p2 = (n) => String(n).padStart(2, "0");
  const text = left <= 0 ? "deadline passed" : dd > 0 ? `${dd}d ${hh}h` : hh > 0 ? `${hh}h ${p2(mm)}m` : `${p2(mm)}:${p2(ss)}`;
  const said = left <= 0 ? text : COPY.leftSaid(dd, hh, mm, ss);
  return { ms, left, date, long, short: left >= 7 * 864e5 ? date : `${wd} ${hm}`, text, said, tone: left <= 0 ? "" : left < 2 * 36e5 ? "urgent" : left < 864e5 ? "soon" : "" };
}
var isLive = (ctx) => deadlinePassed(ctx.bundle?.meta);
var fplOf = (ctx, P, w) => w?.gw === P.A ? ctx.data?.fpl ?? null : null;
var fplGw = (P) => {
  const fh = new Set((P.b?.entry?.chips_used || []).filter((u) => u.chip === "fh").map((u) => Number(u.gw)));
  let s = P.A - 1;
  while (s > 0 && fh.has(s)) s--;
  return s > 0 ? s : null;
};
function fplSubs(fpl, w, L) {
  const was = applyLineup(w, fpl, L);
  const gk = (id) => L.pos(id) === "GK";
  const field = (b) => b.filter((id) => !gk(id));
  const xi = w.xi.map(Number), want2 = field(w.bench.map(Number)), bench = field(was.bench);
  const off = was.xi.filter((id) => w.bench.map(Number).includes(id));
  const subs = xi.filter((id) => was.bench.includes(id)).map((id) => {
    const k = bench.indexOf(id);
    const out = gk(id) ? off.find(gk) : off.includes(want2[k]) ? want2[k] : off.find((x) => !gk(x));
    if (out != null) off.splice(off.indexOf(out), 1);
    return { on: id, off: out };
  }).filter((s) => s.off != null);
  const after = bench.map((id) => subs.find((s) => s.on === id)?.off ?? id);
  return { subs, order: after.every((id, i) => id === want2[i]) ? null : want2, buys: new Set(w.moves.map((m) => Number(m.in))) };
}
function fplSets(ctx, P, w) {
  if (!w || isLive(ctx)) return null;
  const fpl = fplOf(ctx, P, w);
  const marks = [...fplMarks(fpl, w)];
  const x = fpl && fplSubs(fpl, w, P.L);
  if (!x) return null;
  const nm = P.L.name;
  const of = (move) => marks.filter(([, m]) => m.move === move).map(([id]) => nm(id));
  const arm = (k) => w[k] != null && num(fpl[k]) !== num(w[k]) ? nm(w[k]) : null;
  const captain2 = arm("captain"), vice2 = arm("vice");
  if (!x.subs.length && !x.order && !captain2 && !vice2) return null;
  return {
    start: of("start"),
    bench: of("bench"),
    gw: fplGw(P),
    subs: x.subs.map((s) => ({ on: nm(s.on), off: nm(s.off), buy: x.buys.has(s.on) || x.buys.has(s.off) })),
    captain: captain2,
    vice: vice2,
    order: x.order?.map(nm) ?? null,
    buys: [...x.buys].map(nm)
  };
}
var inkAt = (ctx, P, g) => isFrozen(P, g) || Number(g) === P.A && isLive(ctx);
var sellWeek = (ctx, P, id, g) => P.gws.find((x) => x >= g && squadBefore(P, x).includes(id) && !inkAt(ctx, P, x) && squadWeek(weekOf(P, x)) !== "fh") ?? null;
var liftFrom = (P, p) => Math.max(P.A, num(p.gw) ?? P.A);
var liftsLive = (ctx, P, p) => isLive(ctx) && liftFrom(P, p) === P.A;
function initials(e) {
  const words = String(e?.manager || e?.team_name || "?").trim().split(/\s+/).filter(Boolean);
  const str = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2);
  return str.toUpperCase();
}
function reroute(g) {
  const ticks = [...document.querySelectorAll(".ah-tick[data-gw]")].filter((t) => Number(t.dataset.gw) >= g);
  ticks.forEach((t, i) => setTimeout(() => {
    t.classList.remove("reroute");
    void t.offsetWidth;
    t.classList.add("reroute");
  }, (reduceMotion() ? 0 : 140) * i));
}

// js/m/ahead/plans/suggest.js
var SUGGESTIONS = /* @__PURE__ */ new WeakMap();
var SUGGEST_TRIES = 3;
function suggestionsOf(ctx, P, g) {
  if (inkAt(ctx, P, g) || !weekOf(P, g)) return [];
  let by = SUGGESTIONS.get(P);
  if (!by) SUGGESTIONS.set(P, by = /* @__PURE__ */ new Map());
  const asked = placesAsked(P, g), at = `${g}|${asked.join(",")}`;
  if (by.has(at)) return by.get(at);
  const w = weekOf(P, g), squad = w.squad, into = squadBefore(P, g);
  const no = barred(P, g), refused = refusedAt(P, g);
  const mine = movedFrom(P, g, true);
  const kept = keptFrom(P, g);
  const d0 = draftOf(ctx);
  const before = baseline(ctx, g);
  const hitsAt = (ev) => ev.gws.find((x) => x.gw === g)?.hits ?? 0;
  const gone = removedAt(P, g);
  const fits = (m) => into.includes(m.out) && squad.includes(m.out) && !squad.includes(m.in) && !mine.has(m.out) && !mine.has(m.in) && !no.has(m.in) && !refused.has(`${m.out}>${m.in}`) && !kept.has(m.out);
  const measured = (m) => {
    const r = addYours(ctx, P, g, m.out, m.in, d0);
    return r.problem ? null : { ...m, r, cmp: compare2(ctx, r.ev, before) };
  };
  const out = [];
  const push = ({ r, ...m }) => {
    const removed = gone.has(`${m.out}>${m.in}`);
    const early = earlyOf(ctx, P, g, [m], r.ev, before, d0);
    out.push({ ...m, instead: r.instead, hit: hitsAt(r.ev) > hitsAt(before), ...early ? { early } : {}, ...removed ? { removed: true } : {} });
  };
  for (const m of modelMoves(P, g, { now: true }).values()) {
    const x = fits(m) ? measured(m) : null;
    if (x) push(x);
  }
  const pool = /* @__PURE__ */ new Map(), bank = w.bank ?? 0;
  const buysOf = (pos) => pool.get(pos) ?? pool.set(pos, buyCandidates(P, { pos, from: g, limit: 80 })).get(pos);
  const bestOf2 = (o) => {
    const room = bank + (P.L.price(o) ?? 0) + 1e-6;
    const tries = buysOf(P.L.pos(o)).filter((id) => (P.L.price(id) ?? Infinity) <= room).slice(0, SUGGEST_TRIES).map((id) => ({ out: o, in: id, model: false }));
    return tries.filter(fits).map(measured).filter(Boolean).sort((a, b) => b.cmp.delta - a.cmp.delta).slice(0, 1);
  };
  for (const o of asked.filter((a) => !out.some((x) => x.out === a))) for (const x of bestOf2(o)) push({ ...x, asked: true });
  out.sort((a, b) => !!a.early - !!b.early || b.cmp.delta - a.cmp.delta || b.model - a.model);
  by.set(at, out);
  return out;
}
function earlyOf(ctx, P, g, ms, ev, before, d0, measure = null) {
  if (!P.mem?.hold || extraWeek(P, g) || owedAt(P, weekOf(P, g))) return null;
  if (compare2(ctx, ev, before).delta <= 0.05) return true;
  return waitsAWeek(ctx, P, g, ms, ev, before, d0, measure) ? P.gws.find((x) => x > g) : null;
}
function waitsAWeek(ctx, P, g, ms, ev, before, d0, measure = null) {
  const nx = P.gws.find((x) => x > g);
  if (!P.mem?.hold || nx == null || extraWeek(P, g) || squadWeek(weekOf(P, nx))) return false;
  const at = (e) => e.gws.find((s) => s.gw === g)?.points ?? 0;
  if (at(ev) - at(before) > 0.05) return false;
  let d = d0;
  for (const m of ms) {
    const r = addYours(ctx, P, nx, m.out, m.in, d, measure);
    if (r.problem) return false;
    d = r.draft;
  }
  return compare2(ctx, measure ? measure(d, g) : estimate(ctx, d, g), ev).delta >= -0.05;
}
function modelMoves(P, g, { now = false } = {}) {
  const pool = /* @__PURE__ */ new Map();
  for (const r of P.base ? [P.base] : []) {
    for (const w of (r.weeks || []).filter((x) => !now || Number(x.gw) === g)) {
      for (const m of pairedMoves(w.out, w.in, P.L)) {
        const k = `${m.out}>${m.in}`;
        const model = r === P.base && Number(w.gw) === g;
        if (!pool.has(k) || model) pool.set(k, { out: Number(m.out), in: Number(m.in), model });
      }
    }
  }
  const wished = wishWeeks(P);
  for (const w of P.weeks.filter((x) => x.gw > g && wished.has(x.gw) && !squadWeek(x))) {
    for (const m of w.moves.filter((x) => !pinOfMove(P, { ...x, gw: w.gw }))) {
      const k = `${m.out}>${m.in}`;
      if (!pool.has(k)) pool.set(k, { out: Number(m.out), in: Number(m.in), model: false });
    }
  }
  return pool;
}
var PLANS = /* @__PURE__ */ new WeakMap();
var FORK_MAX = 8;
var PLACE_ALTS = 3;
var MORE_SUGGESTIONS = 10;
var listedOf = (plans) => {
  let n = 0;
  return plans.filter((x) => x.placed || n++ < MORE_SUGGESTIONS);
};
var PLACES = { sig: null, at: /* @__PURE__ */ new Set() };
var rulesSig = (P) => P.pins.map((p) => p.id).join(",");
var placesAsked = (P, g) => PLACES.sig === rulesSig(P) ? [...PLACES.at].filter((k) => k.startsWith(`${g}:`)).map((k) => Number(k.slice(k.indexOf(":") + 1))) : [];
function askPlace(ctx, P, g, a) {
  const sig = rulesSig(P), k = `${g}:${a}`;
  if (PLACES.sig !== sig) Object.assign(PLACES, { sig, at: /* @__PURE__ */ new Set() });
  if (PLACES.at.has(k)) return false;
  PLACES.at.add(k);
  pairChanged(ctx);
  return true;
}
var SQUAD_CHIPS = /* @__PURE__ */ new Set(["wc", "fh"]);
var ownAfter = (P, g) => P.weeks.filter((w) => w.gw > g && !squadWeek(w)).flatMap((w) => w.moves.filter((m) => pinOfMove(P, m)).map((m) => ({ gw: w.gw, out: m.out, in: m.in })));
var movesSig = (ms) => ms.map((m) => `${m.gw}:${m.out}>${m.in}`).sort().join(",");

// js/m/ahead/presolve.js
var PRESOLVE_MAX = { week: 1, next: 1, sheet: 5 };
var SOLVE_MAX = 6;
var PRESOLVE_RATE = { all: 30, week: 16 };
var PRESOLVE_WINDOW_MS = 6e4;
var DRY = null;
var AHEAD = { srcs: /* @__PURE__ */ new Map(), failed: /* @__PURE__ */ new Set(), at: null, ctx: null, watching: false, asked: [], dropped: /* @__PURE__ */ new Map(), landed: /* @__PURE__ */ new Map(), took: null, tapped: null, tappedOn: null, showing: /* @__PURE__ */ new Set(), suggested: /* @__PURE__ */ new Set(), urgent: /* @__PURE__ */ new Set() };
var teamOn = () => (AHEAD.ctx ?? attach()?.ctx)?.store.get("entry") ?? null;
var pressedAt = 0;
var tapNow = () => {
  AHEAD.tapped = SOLVES.asked;
  AHEAD.tappedOn = teamOn();
};
if (typeof document !== "undefined" && document.addEventListener) {
  const opt = { capture: true, passive: true };
  document.addEventListener("pointerdown", () => {
    pressedAt = Date.now();
    tapNow();
  }, opt);
  document.addEventListener("click", () => {
    if (Date.now() - pressedAt > 1e3) tapNow();
  }, opt);
  document.addEventListener("keydown", tapNow, opt);
}
var showTransfer = (P, g, on = true) => {
  AHEAD.showing[on ? "add" : "delete"](`${P.entry}|${g}`);
  PAIR.rev++;
};
var showingAt = (P, g) => AHEAD.showing.has(`${P.entry}|${g}`);
var showSuggestion = (P, g, on = true) => {
  AHEAD.suggested[on ? "add" : "delete"](`${P.entry}|${g}`);
  PAIR.rev++;
};
var suggestedAt = (P, g) => !!globalThis.__fcSuggested || tappedSuggestion(P, g);
var tappedSuggestion = (P, g) => AHEAD.suggested.has(`${P.entry}|${g}`);
var tapSpent = (reserve = 0) => AHEAD.tapped !== null && AHEAD.tappedOn === teamOn() && SOLVES.asked - AHEAD.tapped >= SOLVE_MAX - reserve;
var swapAsked = (P, g) => {
  const own = AHEAD.srcs.get("week");
  return !!own && sameView(own.P, P) && own.gw === g;
};
var movesKey = (ms) => ms.map((m) => `${m.out}>${m.in}`).sort().join(",");
var rulesKey = (P) => JSON.stringify(P.pins.filter((p) => p.id !== "hold" && p.id !== "hits"));
function tookOf(P, w) {
  const t = AHEAD.took;
  if (!t || t.g !== w.gw || t.team !== `${P.entry}|${P.A}` || t.version !== P.b.version) return null;
  const pins = rulesKey(P);
  if (pins === t.before) return null;
  if (t.pins === null) t.pins = pins;
  if (t.pins !== pins) {
    AHEAD.took = null;
    return null;
  }
  return movesKey(w.moves) === t.sig ? t : null;
}
var tookCmp = (P, w) => tookOf(P, w)?.cmp ?? null;
function dryEdit(run) {
  const was = DRY, mine = DRY = { got: null };
  try {
    return run() ? mine.got : null;
  } catch (e) {
    console.warn("Forkcast: a tap made dry", e);
    return null;
  } finally {
    DRY = was;
  }
}
function askOf(ctx, P, t, src) {
  const a = t.kind === "reset" ? { pins: [], drop: P.pins.filter((p) => !derivedPin(p)).map((p) => p.id), hitsMax: null } : dryEdit(t.run);
  if (!a) return null;
  let values;
  try {
    values = memOf(ctx).values({ extra: [...t.extra ?? [], ...a.pins], drop: a.drop, hitsMax: a.hitsMax, order: a.inPlace ? (list) => inPlaceOf(list, a.inPlace, a.was) : null });
  } catch {
    return null;
  }
  let root = null;
  if (t.kind === "take" && !t.bare) try {
    const v = rootValues(ctx, P, t.gw ?? P.A, a.pins, a.drop);
    root = { key: valuesKey(P, v), values: v };
  } catch {
  }
  let ref = null;
  if (t.kind === "take" && !t.bare) try {
    const g = t.gw ?? P.A, v = forkValues(ctx, P, g, { moves: [], chips: {} }, a.pins.filter((p) => num(p.gw) !== g));
    ref = { key: valuesKey(P, v), values: v };
  } catch {
  }
  return { key: valuesKey(P, values), values, gw: t.gw ?? P.A, kind: t.kind, src, prep: true, ahead: true, root, ref };
}
function presolve(ctx, P, src, taps, { gw = P.A, sig = "", owner = null } = {}) {
  if (DRY || !ctx.api?.solve || ctx.store.get("conn")?.state === "offline") return;
  if (!ctx.presolveOn?.()) return;
  watchPage(ctx);
  let cur = AHEAD.srcs.get(src);
  const grows = taps.every((t) => t.id != null);
  if (!(sameView(cur?.P, P) && cur.gw === gw && cur.owner === owner && (cur.sig === sig || grows))) AHEAD.srcs.set(src, cur = { P, gw, sig: null, owner, asks: [], made: [], tried: /* @__PURE__ */ new Set() });
  if (cur.sig !== sig) {
    cur.sig = sig;
    const others = [...AHEAD.srcs].filter(([k, x]) => k !== src && sameView(x.P, P)).flatMap(([, x]) => x.asks.map((a) => a.key));
    const room = () => cur.made.length < PRESOLVE_MAX[src];
    for (const t0 of taps) {
      const t = typeof t0 === "function" ? t0() : t0;
      if (!room() || t.id != null && cur.tried.has(t.id)) continue;
      if (t.id != null) cur.tried.add(t.id);
      const a = askOf(ctx, P, t, src);
      if (a) cur.made.push(a);
      if (a && !cur.asks.some((x) => x.key === a.key) && !others.includes(a.key) && !memOf(ctx).solved(a.values)) cur.asks.push({ ...a, pri: t.pri ?? cur.asks.length });
      if (a?.root && !cur.asks.some((x) => x.key === a.root.key) && !others.includes(a.root.key) && !forkRead(a.root.key)) cur.asks.push({ ...a, ...a.root, kind: "root", root: null, take: a.key, pri: (t.pri ?? cur.asks.length) + 0.5 });
      if (a?.ref && !cur.asks.some((x) => x.key === a.ref.key) && !others.includes(a.ref.key) && !forkRead(a.ref.key)) cur.asks.push({ ...a, ...a.ref, kind: "ref", root: null, ref: null, pri: (t.pri ?? cur.asks.length) + 0.6 });
    }
    cur.asks.sort((x, y) => x.pri - y.pri);
  }
  pumpAhead(ctx);
}
function weekTaps(ctx, P, g, list) {
  const ready = list.filter((pl) => pl.state === "ready" && !pl.self && !rollOnly(pl) && !pl.removed).sort((a, b) => plPays(b) - plPays(a) || byGain(a, b));
  const takes = ready.map((pl, i) => ({ kind: "take", gw: g, id: `take:${forkKey(pl.choice, g)}`, pri: i, solver: !!pl.solver, run: () => addPlan(ctx, g, pl) }));
  const rules = rulesOf(P).filter((p) => ruleOf(P, p).removable);
  const removes = [...rules.filter((p) => num(p.gw) === g), ...rules.filter((p) => num(p.gw) !== g)].map((p, i) => ({ kind: "remove", gw: g, id: `rm:${p.id}`, pri: 100 + i, run: () => removeRule(ctx, p.id) }));
  return { takes, removes, sig: `${ready.map((pl) => forkKey(pl.choice, g)).join(";")}|${rules.map((p) => p.id).join(",")}` };
}
function presolveSwap(ctx, P, g, pl) {
  if (P.healing || leftBehind(ctx, P) || inkAt(ctx, P, g)) return;
  const [take] = weekTaps(ctx, P, g, [pl]).takes;
  if (take) presolve(ctx, P, "week", [take], { gw: g, sig: take.id, owner: take.id });
}
var ownIn = (mem, a) => mem.solved(a.values) || (a.kind === "root" || a.kind === "ref") && forkRead(a.key) != null || AHEAD.failed.has(a.key);
var ownSwapIn = (ctx, P, g) => {
  const own = AHEAD.srcs.get("week"), mem = memOf(ctx);
  return swapAsked(P, g) && !own.asks.some((a) => !ownIn(mem, a));
};
var ownLeft = (ctx, P, g) => {
  if (!swapAsked(P, g)) return 1;
  const mem = memOf(ctx), flying = new Set(forkFlights().map(([, f]) => f.key));
  return AHEAD.srcs.get("week").asks.filter((a) => !ownIn(mem, a) && !flying.has(a.key)).length;
};
function presolveNext(ctx, P, g, road, refusals, d0) {
  if (P.healing || leftBehind(ctx, P) || inkAt(ctx, P, g) || DRY) return;
  if (!ownSwapIn(ctx, P, g)) return;
  const plan2 = planOfRoad(ctx, P, road, g, d0)?.plan;
  if (!plan2) return;
  const key = valuesKey(P, rootValues(ctx, P, g, refusals));
  presolve(ctx, P, "next", [{ kind: "take", gw: g, id: `next:${key}`, bare: true, extra: refusals, run: () => addPlan(ctx, g, { ...plan2, state: "ready" }) }], { gw: g, sig: key, owner: key });
}
function swapGain(ctx, P, g, pl) {
  const road = swapRoad(ctx, P, g, pl);
  return road ? sum(asYours(ctx, road).weeks.map((w) => w.points)) - P.total : null;
}
var sameWindow = (a, b, g) => {
  const ra = new Set(Object.values(a?.windows?.[g] ?? {}).flatMap((by) => Object.keys(by ?? {})));
  const rb = new Set(Object.values(b?.windows?.[g] ?? {}).flatMap((by) => Object.keys(by ?? {})));
  return ra.size && ra.size === rb.size && [...ra].every((r) => rb.has(r)) ? ra.size : 0;
};
var windowRounds = (road, g) => new Set(Object.values(road?.windows?.[g] ?? {}).flatMap((by) => Object.keys(by ?? {}))).size;
var cardGain = (ctx, P, g, pl) => pl?.state === "ready" && pl.cmp ? pl.cmp.delta : null;
function shownGain2(ctx, P, g, pl) {
  const gain = cardGain(ctx, P, g, pl);
  if (gain != null) return gain;
  return swapComing(ctx, P, g, pl) ? null : -Infinity;
}
function swapComing(ctx, P, g, pl) {
  const [take] = weekTaps(ctx, P, g, [pl]).takes, a = take ? askOf(ctx, P, take, "week") : null;
  if (!a || AHEAD.failed.has(a.key)) return false;
  return true;
}
var swapRoad = (ctx, P, g, pl) => {
  const [take] = weekTaps(ctx, P, g, [pl]).takes;
  const a = take ? askOf(ctx, P, take, "week") : null;
  return a ? memOf(ctx).solvedRoad(a.values) : null;
};
function swapWeek(ctx, P, g, pl) {
  const road = swapRoad(ctx, P, g, pl);
  return road ? asYours(ctx, road).weeks.find((w) => Number(w.gw) === g) ?? null : null;
}
function presolveTaps(ctx, taps, { gw = null, sig = "", owner = null } = {}) {
  const P = plan(ctx);
  if (!taps || !P) {
    if (!owner || AHEAD.srcs.get("sheet")?.owner === owner) stopAhead("sheet");
    return [];
  }
  if (P.healing || leftBehind(ctx, P)) return [];
  presolve(ctx, P, "sheet", taps, { gw: gw ?? P.A, sig, owner });
  return AHEAD.srcs.get("sheet")?.made ?? [];
}
function pumpAhead(ctx) {
  const P = plan(ctx), mem = memOf(ctx);
  if (P?.healing) {
    urgentRoots(ctx, P);
    return false;
  }
  if (!P || leftBehind(ctx, P)) return false;
  let left = false;
  const now = Date.now();
  AHEAD.asked = AHEAD.asked.filter((x) => x.at > now - PRESOLVE_WINDOW_MS);
  let seen = 0;
  const all = /* @__PURE__ */ new Set(), week = /* @__PURE__ */ new Set();
  const counts = () => {
    for (; seen < AHEAD.asked.length; seen++) {
      const x = AHEAD.asked[seen];
      all.add(x.key);
      if (x.src === "week") week.add(x.key);
    }
  };
  for (const src of ["sheet", "week", "next"]) {
    const s = AHEAD.srcs.get(src);
    if (!s || !sameView(s.P, P)) continue;
    if (src !== "sheet" && (!sameView(AHEAD.at?.P, P) || AHEAD.at.g !== s.gw)) continue;
    for (const a of s.asks) {
      const held = mem.solved(a.values) || a.kind === "root" && forkRead(a.key) != null;
      const lost = !held && AHEAD.landed.get(a.key) === (ctx.bundle?.version ?? null);
      if (AHEAD.failed.has(a.key) || held || AHEAD.landed.has(a.key) && !lost) continue;
      const sent = answeredBy(P, a.key, a.values);
      if (sent) {
        noteAnswered(ctx, P, { ...a, ahead: true }, sent);
        if (a.kind === "root") forkKept(a.key, sent);
        else mem.offer(sent, { values: a.values, version: P.b?.version });
        AHEAD.landed.set(a.key, P.b?.version ?? null);
        continue;
      }
      left = true;
      if (forkFlights().some(([, f]) => f.key === a.key)) continue;
      counts();
      const again = all.has(a.key);
      if (!again && (all.size >= PRESOLVE_RATE.all || src === "week" && week.size >= PRESOLVE_RATE.week)) {
        forkAgain(ctx, AHEAD.asked[0].at + PRESOLVE_WINDOW_MS - now);
        continue;
      }
      forkPump(ctx, P, a);
    }
  }
  return left;
}
function urgentRoots(ctx, P) {
  const take = memOf(ctx)?.getPlan().pending?.ahead;
  if (!take) return;
  for (const [, s] of AHEAD.srcs) {
    for (const a of s.asks) {
      if (a.kind !== "root" || a.take !== take || AHEAD.urgent.has(a.key) || forkRead(a.key) != null) continue;
      const f = forkFlights().find(([, x]) => x.key === a.key);
      if (f && !f[1].sk) continue;
      AHEAD.urgent.add(a.key);
      if (f) ctx.api.urgentSolve?.(f[1].sk).catch(() => {
      });
      else forkPump(ctx, P, { ...a, ahead: true, card: true, urgent: true });
    }
  }
}
var aheadAsks = (f, P, g) => {
  if (!f.ahead) return false;
  if (aheadWaited(f)) return true;
  const s = AHEAD.srcs.get(f.src);
  return !!s && s.P.entry === P.entry && s.P.A === P.A && (f.src === "sheet" || s.gw === g) && s.asks.some((a) => a.key === f.key);
};
var aheadWaited = (f) => !!f.ahead && !!AHEAD.ctx && memOf(AHEAD.ctx)?.getPlan().pending?.ahead === f.key;
function stopAhead(src = null) {
  for (const k of src ? [src] : [...AHEAD.srcs.keys()]) AHEAD.srcs.delete(k);
  let gone = 0;
  for (const [lane, f] of forkFlights()) {
    if (!f.ahead || src && f.src !== src || aheadWaited(f)) continue;
    f.cancel?.();
    if (lane) FORK_FLIGHTS.delete(lane);
    else PAIR.flight = null;
    gone++;
  }
  if (gone && AHEAD.ctx && attach()?.ctx === AHEAD.ctx) forkAgain(AHEAD.ctx, 0);
}
function watchPage(ctx) {
  AHEAD.ctx = ctx;
  if (AHEAD.watching || typeof document === "undefined" || !document.addEventListener) return;
  AHEAD.watching = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") stopAhead();
    else if (AHEAD.ctx && attach()?.ctx === AHEAD.ctx) pairChanged(AHEAD.ctx);
  });
}
var owedAt = (P, w) => !!P?.mem?.hold && !!w?.moves?.length && w.bank != null && w.bank < -1e-9;
var paysBack = (w, pl) => {
  const g = w.gw;
  const keeps = w.moves.every((m) => pl.choice.moves.some((x) => x.gw === g && x.out === m.out && x.in === m.in));
  const bank = num((pl.road?.weeks || []).find((x) => Number(x.gw) === g)?.bank) ?? pl.ev?.gws.find((s) => s.gw === g)?.bank;
  return keeps && bank != null && bank >= -1e-9;
};
function owedRoad(ctx, P, g, { peek = false, prep = false } = {}) {
  const values = noHitsFrom(P, g, valuesFor(ctx, [pinHits(hitCap(P.base) ?? 2, g)]), true, P.end);
  const key = valuesKey(P, values);
  const got = peek ? forkRead(key) : forkAsk(ctx, P, { key, values, gw: g, ...prep ? { prep } : { card: true } });
  return { key, road: got?.weeks ? got : null };
}
var ROOTS = /* @__PURE__ */ new Map();
var clearRoots = () => ROOTS.clear();
var ROOT_NARROW = /* @__PURE__ */ new Set(["must_have", "exclude", "not_for", "no_buys_gw", "max_buys_gw", "to"]);
var sameRest = (was, now) => {
  const last = now.to != null ? Number(now.to) : Number(now.from_r) + Number(now.w) - 1;
  const rolled = new Set(String(now.no_buys_gw ?? "").split(",").filter(Boolean).map(Number));
  const noHits = Number.isFinite(last) && last >= Number(now.from_r) && Array.from({ length: last - Number(now.from_r) + 1 }, (_, i) => Number(now.from_r) + i).every((g) => rolled.has(g));
  return [.../* @__PURE__ */ new Set([...Object.keys(was), ...Object.keys(now)])].every((k) => ROOT_NARROW.has(k) || noHits && (k === "max_hits" || k === "max_hits_gw") || JSON.stringify(was[k] ?? null) === JSON.stringify(now[k] ?? null));
};
var spanWeeks = (v) => new Set(String(v ?? "").split(",").filter(Boolean).flatMap((t) => {
  const [id, span2] = t.split("@"), [a, b] = (span2 ?? "").split("-").map(Number);
  return Array.from({ length: Math.max(0, (b || a) - a + 1) }, (_, i) => `${id}@${a + i}`);
}));
var buysNoneTo = (v, g) => {
  const nn = new Set(String(v.no_buys_gw ?? "").split(",").filter(Boolean).map(Number));
  for (let x = Number(v.from_r); x <= g; x++) if (!nn.has(x)) return false;
  return true;
};
function mayAnswer(was0, now0) {
  const was = solveGap(was0), now = solveGap(now0);
  if (!sameRest(was, now)) return false;
  if (now.to == null ? was.to != null : was.to != null && Number(was.to) < Number(now.to)) return false;
  const toks = (v) => new Set(String(v ?? "").split(",").filter(Boolean));
  const weekly = ["must_have", "exclude"].every((k) => {
    const cur = spanWeeks(now[k]);
    return [...spanWeeks(was[k])].every((t) => cur.has(t) || buysNoneTo(now, Number(t.split("@")[1])));
  });
  return weekly && ["not_for", "no_buys_gw", "max_buys_gw"].every((k) => [...toks(was[k])].every((t) => toks(now[k]).has(t)));
}
function rootStill(was0, now0, road) {
  const was = solveGap(was0), now = solveGap(now0);
  const toks = (v) => new Set(String(v ?? "").split(",").filter(Boolean));
  if (road?.anchor != null) return false;
  if (!sameRest(was, now)) return false;
  const first = Number(now.from_r);
  if (now.to == null && was.to != null || now.to != null && was.to != null && Number(was.to) < Number(now.to)) return false;
  const weeks = new Map((road.weeks || []).map((w) => [Number(w.gw), w]));
  if (!weeks.has(first)) return false;
  const squad = (g) => {
    const w = weeks.get(g) ?? weeks.get(first);
    return /* @__PURE__ */ new Set([...ids(w.xi), ...ids(w.bench)]);
  };
  const held = new Set([...toks(was.no_buys_gw)].map(Number));
  if (now.to != null && was.to == null && [...weeks.keys()].filter((g) => g >= Number(now.to)).every((g) => held.has(g))) return false;
  const fixed = (g) => g === first || Array.from({ length: g - first + 1 }, (_, i) => first + i).every((x) => held.has(x));
  const start = (weeks.get(first).in || []).length ? null : squad(first);
  for (const [k, want2] of [["must_have", true], ["exclude", false]]) {
    const old = spanWeeks(was[k]), cur = spanWeeks(now[k]);
    if ([...old].some((t) => {
      const [id, g] = t.split("@");
      return !cur.has(t) && !(start && buysNoneTo(now, Number(g)) && start.has(Number(id)) === want2);
    })) return false;
    for (const t of [...cur].filter((x) => !old.has(x))) {
      const [id, g] = t.split("@");
      if (!fixed(Number(g)) || squad(Number(g)).has(Number(id)) !== want2) return false;
    }
  }
  const fw = toks(was.not_for), fn = toks(now.not_for);
  if ([...fw].some((t) => !fn.has(t))) return false;
  for (const t of [...fn].filter((x) => !fw.has(x))) {
    const [g, out, inn] = t.split(":").map(Number), w = weeks.get(g);
    if (!fixed(g) || w && ids(w.in).includes(inn) && ids(w.out).includes(out)) return false;
  }
  const nn = new Set([...toks(now.no_buys_gw)].map(Number));
  if ([...held].some((g) => !nn.has(g))) return false;
  const caps = (v) => new Map([...toks(v)].map((t) => t.split(":").map(Number)));
  const capn = caps(now.max_buys_gw), capw = caps(was.max_buys_gw);
  if ([...capw].some(([g, n]) => !capn.has(g) || capn.get(g) > n)) return false;
  const narrower = [...[...nn].filter((g) => !held.has(g)).map((g) => [g, 0]), ...[...capn].filter(([g, n]) => (capw.get(g) ?? 99) > n)];
  return narrower.every(([g, n]) => g === first && (weeks.get(first).in || []).length <= n);
}
function rootValues(ctx, P, g, extra = [], drop = []) {
  const cap = hitCap(P.base) ?? 2, roll = `roll:${g}`;
  drop = [...drop, ...P.pins.filter((p) => p.kind === "notfor" && Number(p.gw) > g).map((p) => p.id)];
  const values = valuesFor(ctx, [...P.gws.filter((x) => x >= g).map((x) => pinHits(cap, x)), ...extra.filter((p) => p.id !== roll)], [...drop, ...P.pins.filter((p) => p.id === roll).map((p) => p.id)]);
  return { ...noHitsFrom(P, g, values), to: g };
}
function buysValues(P, g, values, buys) {
  const caps = new Map(String(values.max_buys_gw ?? "").split(",").filter(Boolean).map((t) => t.split(":").map(Number)));
  const n = (weekOf(P, g)?.moves.length ?? 0) + buys;
  caps.set(g, Math.min(caps.get(g) ?? n, n));
  return { ...values, max_buys_gw: [...caps].sort(([x], [y]) => x - y).map(([y, k]) => `${y}:${k}`).join(",") };
}
function noHitsFrom(P, g, values, own = false, last = g) {
  if (g <= P.A) return values;
  const caps = Object.fromEntries(String(values.max_hits_gw ?? "").split(",").filter(Boolean).map((t) => t.split(":").map(Number)));
  const was = num(values.max_hits) ?? hitCap(P.base) ?? 2;
  const yours = (y) => Math.max(0, num(weekOf(P, y)?.hits) ?? 0);
  const rolled = new Set(String(values.no_buys_gw ?? "").split(",").filter(Boolean).map(Number));
  if (P.gws.filter((y) => y <= last).every((y) => rolled.has(y))) return values;
  for (const y of P.gws) if (!rolled.has(y)) caps[y] = y <= P.A || own && y === g ? caps[y] ?? was : Math.min(caps[y] ?? was, yours(y));
  for (const y of rolled) delete caps[y];
  const spec = Object.entries(caps).sort(([x], [y]) => x - y).map(([y, n]) => `${y}:${n}`).join(",");
  return { ...values, max_hits: 0, ...spec ? { max_hits_gw: spec } : {} };
}
var sideBusy = (g, key) => forkFlights().some(([, f]) => f.side && !f.root && f.key !== key && f.gw !== g);
function refusalRoads(ctx, P, g, { peek = false, prep = false, depth = 1, lead: best = null } = {}) {
  const yours = weekOf(P, g)?.moves || [], out = [], seen = /* @__PURE__ */ new Set(), d0 = draftOf(ctx);
  const walk = (extra, d, chain = false) => {
    const values = rootValues(ctx, P, g, extra), key = valuesKey(P, values);
    if (seen.has(key)) return;
    seen.add(key);
    const root = d === depth, busy = !root && sideBusy(g, key);
    const last = root ? ROOTS.get(`${P.entry}|${g}`) : null;
    const lane = { gw: g, side: true, ...prep || !root ? { prep: true } : {}, ...root ? { root: true } : {}, ...root && !prep ? { card: true } : {} };
    if (last && !forkRead(key) && last.version === P.b.version && rootStill(last.values, values, last.road)) {
      forkKept(key, { ...last.road, key, values, from: last.road.from ?? last.road.key });
      noteAnswered(ctx, P, { key, values, ...lane }, last.road);
    }
    const ask = (k, v) => peek || busy ? forkRead(k) : forkAsk(ctx, P, { key: k, values: v, ...lane });
    const got = ask(key, values);
    const free = got?.weeks ? got : null;
    if (root && free) ROOTS.set(`${P.entry}|${g}`, { version: P.b.version, values, road: free });
    const yo = new Set(yours.map((y) => Number(y.out))), yi = new Set(yours.map((y) => Number(y.in)));
    const movesOf = (r) => {
      const x = r?.weeks.find((y) => Number(y.gw) === g);
      if (!x) return [];
      const ms2 = planOfRoad(ctx, P, r, g, d0)?.choice.moves ?? pairedMoves(x.out || [], x.in || [], P.L);
      if (!yours.length) return ms2;
      const outs = ms2.map((m) => Number(m.out)).filter((o) => !yo.has(o)), ins = ms2.map((m) => Number(m.in)).filter((i) => !yi.has(i));
      const kept = ms2.filter((m) => outs.includes(Number(m.out)) && ins.includes(Number(m.in)));
      return kept.length === outs.length ? kept : pairedMoves(outs, ins, P.L).map((m) => ({ gw: g, ...m }));
    };
    let road = free;
    const halves = [];
    const all = free ? movesOf(free) : [];
    if (root && !prep && free && !SQUAD_CHIPS.has(weekOf(P, g)?.chip) && all.length > 1) {
      const apart = all.every((x) => fitsAt(ctx, P, g, { moves: [...yours.map((y) => ({ gw: g, out: y.out, in: y.in })), x], chips: {} }, d0));
      if (apart) {
        const v = buysValues(P, g, rootValues(ctx, P, g, extra), 1), k = valuesKey(P, v), got2 = ask(k, v);
        halves.push({ k });
        road = !got2 ? null : got2.weeks && movesOf(got2).length === 1 ? got2 : free;
      }
    }
    const w = d > 0 && road ? road.weeks.find((x) => Number(x.gw) === g) : null;
    const ms = w ? movesOf(road) : [];
    out.push({ key, road });
    for (const x of halves) out.push({ key: x.k, road: null });
    const lead = root && best && ms.find((m) => Number(m.out) === Number(best.out) && Number(m.in) === Number(best.in)) || ms[0] || null;
    if (!lead) {
      return;
    }
    if (chain && road && ms.length === 1 && !peek && !prep) presolveNext(ctx, P, g, road, extra, d0);
    const nx = [...extra, pinNotFor(lead.out, lead.in, g)];
    walk(nx, d - 1, root);
  };
  walk([], depth);
  return out;
}
function extraWeek(P, g) {
  const w = weekOf(P, g);
  if (!w || squadWeek(w)) return false;
  const n = repicks(P, g) ? w.moves.filter((m) => pinOfMove(P, m)).length : w.moves.length;
  return n > 0 && n >= Math.max(0, w.ft ?? 1);
}
function repicks(P, g) {
  const w = weekOf(P, g);
  return !!w && !squadWeek(w) && gwMode(P, g) !== "roll";
}
function addYours(ctx, P, g, out, inn, d0 = draftOf(ctx), measure = null) {
  let r = { ...addMove(ctx, d0, g, out, inn, measure), instead: null };
  const before = baseline(ctx, g);
  const hitsAt = (ev, x) => ev.gws.find((s) => s.gw === x)?.hits ?? 0;
  for (const x of P.gws.filter((y) => y >= g && repicks(P, y))) {
    if (hitsAt(r.ev, x) <= hitsAt(before, x)) continue;
    const mode = gwMode(P, x);
    const room = mode === "free" ? 0 : mode.startsWith("h") ? Number(mode.slice(1)) : hitCap(P.base) ?? Infinity;
    const drops = /* @__PURE__ */ new Map();
    for (const m of weekOf(P, x).moves.filter((y) => !pinOfMove(P, { ...y, gw: x }) && (x !== g || y.out !== out))) {
      const dm = flatMoves(r.draft).find((y) => y.gw === x && y.out === m.out && y.in === m.in);
      if (dm) drops.set(dropMove(r.draft, dm), { gw: x, out: m.out, in: m.in });
    }
    const best = bestOf(ctx, [...hitsAt(r.ev, x) <= room ? [r.draft] : [], ...drops.keys()], g, measure);
    if (best) r = { ...best, instead: r.instead ?? drops.get(best.draft) ?? null };
  }
  return r;
}
var OWN_ALTS = 6;
var OWN_ALT_TRIES = 12;
var OWN_ALTS_ALONE = 3;
var OWNALTS = /* @__PURE__ */ new WeakMap();
function ownAltsOf(ctx, P, w, m, all = false) {
  const g = w?.gw;
  const made = !!w?.moves.some((x) => x.out === m.out && x.in === m.in);
  if (!w || isFrozen(P, g) || squadWeek(w) || (made ? pinOfMove(P, m)?.kind !== "sell" || fundingOf(P, g, m) : !w.squad.includes(m.out) || w.squad.includes(m.in))) return [];
  let by = OWNALTS.get(P);
  if (!by) OWNALTS.set(P, by = /* @__PURE__ */ new Map());
  const key = `${g}:${m.out}>${m.in}${all ? ":all" : ""}`;
  if (by.has(key)) return by.get(key);
  const d0 = draftOf(ctx);
  let rg = null, d = d0, bank = w.bank ?? 0;
  if (made) {
    rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const ms = movesInOrder(P, w);
    const k = ms.findIndex((x) => x.out === m.out && x.in === m.in);
    for (let j = ms.length - 1; j > k; j--) d = dropMove(d, flatMoves(d).find((x) => x.gw === g && x.out === ms[j].out) ?? { gw: g, ...ms[j] });
  } else {
    const r = addMove(ctx, d0, g, m.out, m.in, takenBy(ctx, P)), without = planBaseline(ctx, P, g);
    if (!r.problem) {
      rg = { cmp: compare2(ctx, r.ev, without), without };
      d = r.draft;
      bank = r.ev.gws.find((s) => s.gw === g)?.bank ?? 0;
    }
  }
  const cut = made && d !== d0;
  let list = [];
  if (rg) {
    const no = barred(P, g), refused = refusedAt(P, g);
    const mine = movedFrom(P, g);
    const measure = (ids2) => ids2.flatMap((id) => {
      if (id === m.in || w.squad.includes(id) || mine.has(id) || no.has(id) || refused.has(`${m.out}>${id}`)) return [];
      const r = addMove(ctx, d, g, m.out, id, takenBy(ctx, P));
      if (r.problem || cut && addMove(ctx, d0, g, m.out, id).problem) return [];
      return [{ out: m.out, in: id, cmp: compare2(ctx, r.ev, rg.without) }];
    }).sort((a, b) => b.cmp.delta - a.cmp.delta);
    const model = measure([...new Set([...modelMoves(P, g).values()].filter((x) => x.out === m.out).map((x) => x.in))]);
    const room = bank + (P.L.price(m.in) ?? 0) + 1e-6;
    const fits = buyCandidates(P, { pos: P.L.pos(m.out), from: g, not: [m.in], limit: 80 }).filter((x) => (P.L.price(x) ?? Infinity) <= room);
    const more = measure(fits.slice(0, OWN_ALT_TRIES).filter((id) => !model.some((x) => x.in === id)));
    const better = more.filter((x) => x.cmp.delta > rg.cmp.delta + 0.05);
    list = all ? [...model, ...more] : model.length || better.length ? [...model, ...better] : more.slice(0, OWN_ALTS_ALONE);
    list = cheaperFirst(list, P.noise, P.L.price);
  }
  list = list.slice(0, OWN_ALTS);
  by.set(key, list);
  return list;
}
var choiceGain = (x) => x?.cmp?.delta ?? x?.gain ?? 0;
var tiedBuy = (x, c, noise) => !!x && verdictLabel(choiceGain(x) - choiceGain(c), noise) === "coin";
function cheaperFirst(list, noise = 0, price = null) {
  const out = [...list || []].sort((a, b) => choiceGain(b) - choiceGain(a));
  if (!price || !out.length) return out;
  const cost = (x) => price(x.in) ?? Infinity;
  const tied = out.filter((x) => tiedBuy(out[0], x, noise)).sort((a, b) => cost(a) - cost(b));
  return [...tied, ...out.filter((x) => !tied.includes(x))];
}
var OTHERUSE = /* @__PURE__ */ new WeakMap();
function otherUseOf(ctx, P, w, m) {
  const g = w?.gw;
  if (!P?.mem?.hold || !w || isFrozen(P, g) || squadWeek(w) || !extraWeek(P, g)) return null;
  let by = OTHERUSE.get(P);
  if (!by) OTHERUSE.set(P, by = /* @__PURE__ */ new Map());
  const key = `${g}:${m.out}>${m.in}`;
  if (by.has(key)) return by.get(key);
  const rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
  let best = null;
  if (rg && !rg.hit) {
    const into = squadBefore(P, g), squad = rg.without.gws.find((s) => s.gw === g)?.squad ?? [];
    const no = barred(P, g), refused = refusedAt(P, g), kept = keptFrom(P, g), mine = movedFrom(P, g);
    mine.delete(m.out);
    mine.delete(m.in);
    for (const x of modelMoves(P, g, { now: true }).values()) {
      if (x.out === m.out && x.in === m.in || !into.includes(x.out) || !squad.includes(x.out) || squad.includes(x.in) || mine.has(x.out) || mine.has(x.in) || no.has(x.in) || refused.has(`${x.out}>${x.in}`) || kept.has(x.out)) continue;
      const r = addYours(ctx, P, g, x.out, x.in, rg.dWithout, takenBy(ctx, P));
      if (r.problem) continue;
      const cmp = compare2(ctx, r.ev, rg.without);
      if (!best || cmp.delta > best.cmp.delta) best = { out: x.out, in: x.in, cmp };
    }
  }
  by.set(key, best);
  return best;
}
function draftWithout(ctx, P, g, m, from = -Infinity) {
  const d0 = draftOf(ctx);
  let d = dropMove(d0, flatMoves(d0).find((x) => x.gw === g && x.out === m.out) ?? { gw: g, out: m.out, in: m.in });
  for (const x of P.gws) if (x >= from && d.lineups?.[x]) d = setLineup(d, x, null);
  return d;
}
function whenOf(ctx, P, m) {
  const g = Number(m.gw);
  const w = weekOf(P, g);
  if (!P?.mem?.hold || !w || squadWeek(w) || pinOfMove(P, m)?.kind !== "sell" || fundingOf(P, g, m)) return null;
  const d = draftWithout(ctx, P, g, m);
  const without = estimate(ctx, d, P.A);
  const own = rowGains(ctx, P, w).get(`${m.out}>${m.in}`)?.cmp ?? null;
  return P.gws.map((x) => {
    const current = x === g;
    const no = { gw: x, ok: false, current, delta: null, label: null };
    const wx = weekOf(P, x);
    if (current && own) return { gw: x, ok: true, current, delta: own.delta, label: own.label };
    if (!wx || inkAt(ctx, P, x) || squadWeek(wx) || inkAt(ctx, P, g)) return no;
    const r = addMove(ctx, d, x, m.out, m.in);
    if (r.problem) return no;
    const c = compare2(ctx, r.ev, without);
    return { gw: x, ok: true, current, delta: c.delta, label: c.label };
  });
}
function moveTo(ctx, m, g2) {
  const P = plan(ctx);
  const g = Number(m.gw), to = Number(g2);
  const pin = P ? pinOfMove(P, m) : null;
  if (!P || to === g || !P.gws.includes(to) || pin?.kind !== "sell" || !weekOf(P, g)?.moves.some((x) => x.out === m.out && x.in === m.in)) return false;
  const nm = P.L.name;
  const lo = Math.min(g, to);
  const d = draftWithout(ctx, P, g, m, lo);
  const r = addMove(ctx, d, to, m.out, m.in);
  if (r.problem) {
    toastOf(ctx)(problemText(ctx, r.problem, nm(m.in)), "warn");
    return false;
  }
  const next = pinSell(m.out, to, P.end, { in: m.in, label: `${nm(m.out)} \u2192 ${nm(m.in)} from GW${to}` });
  const taken = clashing(P, next).filter((q) => q.id !== pin.id);
  const what = withTaken(P, COPY.movedTo(`${nm(m.out)} \u2192 ${nm(m.in)}`, to), taken);
  return edit(ctx, {
    pins: [next],
    drop: [pin.id, ...wishDrop(P, m.in), ...taken.map((q) => q.id)],
    from: lo,
    what,
    taken,
    text: withPoints(ctx, what, (Q, prev) => endingOf(Q, prev, to, { own: m.out }))
  });
}
function pairMovesOf(road, g, have = [], L = null) {
  const w = (road?.weeks || []).find((x) => Number(x.gw) === Number(g));
  if (!w) return [];
  const outs = (w.out || []).map(Number).filter((id) => !have.some((m) => Number(m.out) === id));
  const ins = (w.in || []).map(Number).filter((id) => !have.some((m) => Number(m.in) === id));
  return pairedMoves(outs, ins, L);
}
var PAIR = { flight: null, until: 0, prepUntil: 0, rev: 0 };
var PAIR_AGAIN_MS = 1500;
var PAIR_HOLD_MS = 3e4;
var PAIR_TAKES = /* @__PURE__ */ new Set(["chipprep", "speculative", "pair", "card", "pairnext", "presolve"]);
var PREP_BESIDE = /* @__PURE__ */ new Set(["chipprep", "pair", "card", "pairnext", "presolve"]);
var pairChanged = (ctx) => ctx.store.set("aheadPair", ++PAIR.rev);
function planTake(P, g, pl) {
  const chip = pl.chips?.[g] ?? null;
  const own = SQUAD_CHIPS.has(chip) ? [] : pl.moves.filter((m) => m.gw === g && !(isYours(P, m) && isExact(pinOfMove(P, m))));
  return { own, chips: chip ? [[g, chip]] : [], gone: yoursTakenBack(P, g, pl.moves), back: chipBackOf(P, g, pl) };
}
var goneIds = (P, gone) => [...new Set(gone.map((m) => pinOfMove(P, m)?.id).filter(Boolean))];
function takenKeep(P, g, pl) {
  const gone = new Set(goneIds(P, planTake(P, g, pl).gone));
  return pairsOf(P.pins.filter((p) => !gone.has(p.id)));
}
function planTakeDraft(ctx, P, g, base, now) {
  const wished = wishWeeks(P);
  const keeps = (m) => m.gw < g || m.gw > g && (!!squadWeek(weekOf(P, m.gw)) || (!!pinOfMove(P, m) || wished.has(m.gw)) && !madeEarlier(now, m));
  return withMoves(base, [...flatMoves(draftOf(ctx)).filter(keeps), ...now]);
}
var madeEarlier = (ms, m) => ms.some((y) => y.out === m.out || y.in === m.in);
var wishWeeks = (P) => new Set(asksOf(P).filter((p) => p.kind === "wish" && !isPick(p)).map((p) => Number(p.gw)));
var weekOnto = (base, from, g) => {
  const d = withMoves(base, [...flatMoves(base).filter((m) => m.gw !== g), ...flatMoves(from).filter((m) => m.gw === g)]);
  const c = setLineup(setChip(d, g, from.chips?.[g] ?? null), g, null), lu = from.lineups?.[g];
  return lu ? setLineup(c, g, lu) : c;
};
function takeSaid(ctx, g, head, cmp, tail) {
  const line = () => {
    const Q = plan(ctx), w = Q && weekOf(Q, g);
    return w ? weekRollOf(ctx, Q, w, (x) => plansListed(ctx, Q, x)) : null;
  };
  const now = line();
  if (now) return `${head}${fmt.signed(shownDelta(now))}${tail}`;
  setTimeout(() => {
    const was = saidNow();
    let off = null;
    const stop = setTimeout(() => off?.(), 6e4);
    stop.unref?.();
    off = ctx.store.on("aheadPair", () => {
      const r = saidNow() === was ? line() : null;
      if (saidNow() !== was) {
        off();
        clearTimeout(stop);
        return;
      }
      if (r) {
        off();
        clearTimeout(stop);
        sayAgain(was, `${head}${fmt.signed(shownDelta(r))}${tail}`);
      }
    });
  }, 0);
  return `${head}${fmt.signed(shownDelta(cmp))}${tail}`;
}
function addPlan(ctx, g, pl) {
  const P = plan(ctx);
  if (pl?.state !== "ready") return false;
  const nm = P.L.name;
  const { own, chips, gone, back } = planTake(P, g, pl);
  const locks = !!pl.rolls && !P.pins.some((p2) => p2.id === `roll:${g}`);
  if (!own.length && !chips.length && !gone.length && !back && !locks) return false;
  const draft = planTakeDraft(ctx, P, g, pl.draft, flatMoves(pl.draft).filter((m) => m.gw === g));
  const ev = estimate(ctx, draft, g);
  const funder = new Map((() => {
    if (own.length !== 2) return [];
    const needs = (m) => freedBy(ev, g, m) > 0 && problemOf(ctx, estimate(ctx, dropDrafted(draft, m), g), g)?.code === "budget";
    const f = own.filter(needs).sort((a, c) => freedBy(ev, g, c) - freedBy(ev, g, a))[0];
    return f ? [[f, own.find((m) => m !== f).in]] : [];
  })());
  const later = flatMoves(draftOf(ctx)).filter((x) => x.gw > g && pinOfMove(P, x));
  const pins = own.map((m) => {
    const p2 = pinSell(m.out, m.gw, P.end, { in: m.in, funds: funder.get(m) ?? null, label: `${nm(m.out)} \u2192 ${nm(m.in)} in GW${m.gw}`, week: true });
    const resold = later.find((x) => x.out === m.in);
    return resold ? { ...p2, must: p2.must.map(([id, a]) => [id, a, resold.gw - 1]) } : p2;
  });
  const drop = goneIds(P, gone);
  const off = back ? chipOffParts(P, g, { locked: true }) : null;
  if (off) {
    pins.push(...off.pins);
    drop.push(...off.drop);
  }
  const chipSaid = /* @__PURE__ */ new Map(), chipTaken = [...off?.picks ?? []];
  for (const [x, c] of chips) {
    const e = chipEdit(P, x, c);
    const cw = chipWords(P, x, c, e.drop, { inPlace: true });
    pins.push(...e.pins);
    drop.push(...e.drop);
    chipSaid.set(x, cw.what);
    chipTaken.push(...cw.taken);
  }
  const roll = chips.length ? null : pinRoll(g, pl.moves.filter((m) => m.gw === g).length);
  if (roll) pins.push(roll);
  const { chain, asks } = chainOf(P, g, own);
  pins.push(...chain.values());
  const rule = !chips.length && repicks(P, g) ? P.pins.filter((p2) => p2.id === `hits:${g}`) : [];
  drop.push(...rule.map((p2) => p2.id));
  const ids2 = new Set(pins.map((p2) => p2.id));
  const hits = ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  const limit = asksOf(P).filter((p2) => p2.kind === "hits" && !drop.includes(p2.id) && Number(p2.hits?.[g] ?? Infinity) < hits);
  const wished = new Set(own.flatMap((m) => wishDrop(P, m.in)));
  const taken = [...new Map([...pins.filter((p2) => !isRoll(p2) && !chain.has(p2.id)).flatMap((p2) => clashing(P, p2, asks)), ...limit].filter((q) => !ids2.has(q.id) && !drop.includes(q.id) && !wished.has(q.id)).map((q) => [q.id, q])).values()];
  const move = (m) => `${nm(m.out)} \u2192 ${nm(m.in)}`;
  const hit = own.length && pl.hits?.[g] ? ` (${MINUS}${HIT_COST * pl.hits[g]})` : "";
  const head = chipSaid.get(g) ?? (own.length ? `GW${g} ${own.map(move).join(" + ")}${hit}` : !pl.moves.some((m) => m.gw === g) ? COPY.planRoll(g) : null);
  const rg = `GW${g} `;
  const made = roll && roll.label !== head && !P.pins.some((p2) => p2.id === roll.id && rollKeeps(p2) === rollKeeps(roll)) ? head?.startsWith(rg) && roll.label.startsWith(rg) ? roll.label.slice(rg.length) : roll.label : null;
  const nAt = pl.moves.filter((m) => m.gw === g).length;
  const kept = own.length && !chips.length && nAt > own.length && (weekOf(P, g)?.moves.length ?? 0) > 0 ? COPY.weekTransfers(nAt, g) : null;
  const swapped = own.length === 1 && gone.length === 1 && gone[0].out === own[0].out && head?.endsWith(move(own[0]) + hit) && !chips.length && !back;
  const said = [
    swapped ? `${head} ${COPY.planInsteadOf(nm(gone[0].in))}` : head,
    made,
    kept,
    gone.length && !swapped ? COPY.removed(gone.map((m, i) => `${head || i ? "" : `GW${g} `}${move(m)}`)) : null,
    off ? COPY.chipTakenOff(chipName(back), g) : null,
    ...(off?.pins ?? []).map((q) => COPY.chipBack(autoRuleName(q, g))),
    ...rule.map((q) => COPY.chipRemoves(autoRuleName(q, g)))
  ].filter(Boolean);
  const what = withTaken(P, said.join(" \xB7 "), taken);
  const p = !pl.road && !chips.some(([, c]) => SQUAD_CHIPS.has(c)) ? problemOf(ctx, ev, g) : null;
  if (p) {
    toastOf(ctx)(problemText(ctx, p), "warn");
    return false;
  }
  if (!DRY && pl.vsRoll && !pl.refRow && weekOf(P, g)?.moves.length) AHEAD.took = null;
  else if (!DRY && pl.vsRoll && !pl.refRow) AHEAD.took = { team: `${P.entry}|${P.A}`, version: P.b.version, g, sig: movesKey(pl.choice.moves.filter((m) => (m.gw ?? g) === g)), cmp: pl.cmp, forced: !!pl.forced, rounds: windowRounds(pl.road, g), before: rulesKey(P), pins: null };
  return edit(ctx, {
    pins,
    drop: [...own.flatMap((m) => wishDrop(P, m.in)), ...drop, ...taken.map((q) => q.id)],
    road: pl.road,
    inPlace: chain.keys().next().value ?? null,
    // a GW-g armband the plan moves is said, as every edit's ending says it (B21)
    from: g,
    what,
    taken: [...chipTaken, ...rule, ...taken],
    // a Roll + that takes nothing back and changes no number says the rule it made (rollMade), not "GW8 roll · total
    // 0.0"
    text: locks && !own.length && !chips.length && !gone.length && !back ? () => COPY.rollMade(g) : pl.vsRoll && !pl.refRow ? (Q, prev) => takeSaid(ctx, g, `${what}${lineupMoved(Q, prev, g)} \xB7 `, pl.cmp, ` vs ${choiceVs(P, pl)}`) : withPoints(ctx, what, (Q, prev) => lineupMoved(Q, prev, g), { total: true }),
    more: own.length && WHY_SHEET ? [whyAct(g, own[0].in)] : [],
    // a take's receipt: two rows on a phone, its head one line, "frozen", the week's count and the lineup's words clipping
    // after the sales, anything it takes back whole (ui.toast; owner, 2026-10-26; the lineup's since QA manyft, 2026-11-04:
    // a row with a hit beside your transfer took four lines with "Vuskovic to bench" kept whole)
    take: (Q, prev) => [made, kept, ...lineupMoved(Q, prev, g).split(" \xB7 ").slice(1)].filter(Boolean)
  });
}
var isYours = (P, m) => !!pinOfMove(P, m) && !!weekOf(P, m.gw)?.moves.some((y) => y.out === m.out && y.in === m.in);
var yoursTakenBack = (P, g, moves) => (weekOf(P, g)?.moves || []).map((m) => ({ gw: g, out: m.out, in: m.in })).filter((m) => (!squadWeek(weekOf(P, g)) || isYours(P, m)) && !moves.some((x) => sameMove(x, m)));
var rollingAt = (P, g) => {
  const w = weekOf(P, g);
  return !!w && !w.moves.length && !squadWeek(w) && P.pins.some((p) => p.id === `roll:${g}` && !rollKeeps(p));
};
var pinOfMove = (P, m) => asksOf(P).find((p) => p.kind === "sell" && Number(p.player) === Number(m.out) && (p.in == null || Number(p.in) === Number(m.in)) || (p.kind === "slide" || p.kind === "wish") && Number(p.player) === Number(m.in) && !(isPick(p) && (m.gw == null || Number(m.gw) !== Number(p.gw)))) ?? null;
function movesInOrder(P, w) {
  const asks = asksOf(P);
  const rank = (m) => {
    const p = pinOfMove(P, { ...m, gw: w.gw });
    const i = p ? asks.indexOf(p) : -1;
    return i < 0 ? Infinity : i;
  };
  return (w?.moves || []).map((m, i) => [m, i]).sort(([a, i], [b, j]) => rank(a) - rank(b) || i - j).map(([m]) => m);
}
function fundingOf(P, g, m) {
  const w = weekOf(P, g);
  const pin = w ? pinOfMove(P, { ...m, gw: g }) : null;
  if (!pin) return null;
  const fp = pin.funds != null ? pin : asksOf(P).find((p) => p.kind === "sell" && p.funds != null && Number(p.funds) === Number(m.in));
  if (!fp) return null;
  const main = w.moves.find((x) => x.in === Number(fp.funds));
  const fund = w.moves.find((x) => x.out === Number(fp.player) && x.in === Number(fp.in));
  const mp = main ? pinOfMove(P, { ...main, gw: g }) : null;
  return main && fund && mp && mp !== fp ? { fund: { pin: fp, move: fund }, main: { pin: mp, move: main } } : null;
}
var soldBy = (q) => q.kind === "sell" ? q.player : q.kind === "slide" ? q.out : null;
var boughtBy = (q) => q.kind === "sell" ? q.in : q.kind === "slide" || q.kind === "wish" ? q.player : null;
var moveSaid = (nm, x) => `${nm(x.out)} \u2192 ${nm(x.in)}`;
function removeMove(ctx, m) {
  const P = plan(ctx);
  const nm = P.L.name;
  if (m.gw === P.A && isLive(ctx)) {
    toastOf(ctx)(COPY.live(P.A), "warn");
    return false;
  }
  const pin = pinOfMove(P, m);
  if (!pin) return m.gw != null ? keep(ctx, m.out, { gw: m.gw, scope: "gw" }) : false;
  const taken = m.gw == null ? [] : P.pins.filter((q) => q.id === `roll:${m.gw}`);
  const from = Math.max(P.A, num(pin.gw) ?? P.A);
  const own = { ...m, gw: m.gw ?? from };
  const what = withTaken(P, COPY.removed(moveSaid(nm, own)), taken);
  const end = (Q, prev) => endingOf(Q, prev, own.gw, { own: m.out, named: [own] });
  const w = weekOf(P, own.gw);
  const rolls = !!w && !squadWeek(w) && w.moves.every((x) => x.out === own.out && x.in === own.in);
  const vr = rolls ? weekRollOf(ctx, P, w, (x) => plansListed(ctx, P, x)) : null;
  const text = vr ? (Q, prev) => `${what}${end(Q, prev)}` : withPoints(ctx, what, end, { total: true });
  return edit(ctx, { drop: [pin.id, ...taken.map((q) => q.id)], from, what, taken, text, also: () => noteRemoved(P, [own]) });
}
function removeWeek(ctx, g) {
  const P = plan(ctx), own = (weekOf(P, g)?.moves || []).map((m) => ({ ...m, gw: g }));
  const sold = new Set(own.map((m) => Number(m.out)));
  const back = P.gws.filter((x) => x > g).flatMap((x) => (weekOf(P, x)?.moves || []).filter((m) => sold.has(Number(m.in))).map((m) => ({ ...m, gw: x })));
  const moves = [...own, ...back];
  if (g === P.A && isLive(ctx)) {
    toastOf(ctx)(COPY.live(P.A), "warn");
    return false;
  }
  const taken = P.pins.filter((q) => q.id === `roll:${g}`);
  const gone = goneIds(P, moves), had = new Set(P.pins.map((q) => q.id));
  const again = [...new Map(P.pins.filter((q) => gone.includes(q.id)).flatMap((q) => q.took ?? []).filter((q) => !had.has(q.id)).map((q) => [q.id, q])).values()];
  const what = withTaken(P, COPY.removed(moves.map((m) => moveSaid(P.L.name, m)).join(", ")), taken);
  return edit(ctx, { pins: again, drop: [...gone, ...taken.map((q) => q.id)], from: g, what, taken, text: withPoints(ctx, what, () => "", { total: true }) });
}
var ROWGAINS = /* @__PURE__ */ new WeakMap();
function rowGains(ctx, P, w) {
  let by = ROWGAINS.get(P);
  if (!by) ROWGAINS.set(P, by = /* @__PURE__ */ new Map());
  if (by.has(w.gw)) return by.get(w.gw);
  const g = w.gw;
  const ms = movesInOrder(P, w);
  const evs = [planBaseline(ctx, P, g)];
  let d = draftOf(ctx);
  const ds = [d];
  for (let k = ms.length - 1; k >= 0; k--) {
    const dm = flatMoves(d).find((x) => x.gw === g && x.out === ms[k].out) ?? { gw: g, ...ms[k] };
    d = dropMove(d, dm);
    evs.unshift(asTaken(ctx, P, d, g));
    ds.unshift(d);
  }
  const hitsAt = (ev) => ev.gws.find((x) => x.gw === g)?.hits ?? 0;
  const out = new Map(ms.map((m, k) => [`${m.out}>${m.in}`, {
    cmp: compare2(ctx, evs[k + 1], evs[k]),
    hit: Math.max(0, hitsAt(evs[k + 1]) - hitsAt(evs[k])),
    withIt: evs[k + 1],
    without: evs[k],
    dWith: ds[k + 1],
    dWithout: ds[k]
  }]));
  by.set(g, out);
  return out;
}
var onBase = (delta, own, head = null) => head == null ? delta : delta - own + head;
function whenOnBase(weeks, head = null) {
  const cur = weeks?.find((x) => x.current && x.ok);
  return head == null || !cur ? weeks : weeks.map((x) => x.ok ? { ...x, delta: onBase(x.delta, cur.delta, head) } : x);
}
function ifMisses(ctx, P, g, m, dWith, dWithout) {
  const score = { xp: (id, x) => id === m.in && x === g ? 0 : P.L.xp(id, x), fixedLineups: true };
  const base = compare2(ctx, asTaken(ctx, P, dWith, g), asTaken(ctx, P, dWithout, g)).delta;
  return { ...compare2(ctx, asTaken(ctx, P, dWith, g, score), asTaken(ctx, P, dWithout, g, score)), base };
}
function whyFacts(ctx, P, g, m, withIt, without, { drafts = null, c = null, yours = false, vs = null, head = null } = {}) {
  const nm = P.L.name;
  const wa = withIt.gws.find((x) => x.gw === g), wb = without.gws.find((x) => x.gw === g);
  const nx = P.gws.find((x) => x > g);
  const mv = wa?.moves.find((x) => x.out === m.out && x.in === m.in);
  const hit = (wa?.hits ?? 0) - (wb?.hits ?? 0);
  const gone = without.gws.filter((s) => s.gw >= g).flatMap((s) => s.moves.filter((x) => x.ok && !(s.gw === g && x.out === m.out) && !withIt.gws.find((y) => y.gw === s.gw)?.moves.some((y) => y.in === x.in)).map((x) => `${nm(x.out)} \u2192 ${nm(x.in)}${s.gw === g ? "" : ` in GW${s.gw}`}`));
  const miss = drafts ? ifMisses(ctx, P, g, m, ...drafts) : null;
  const use = yours && c ? otherUseOf(ctx, P, weekOf(P, g), m) : null;
  const better = use && use.cmp.delta > c.delta && verdictLabel(use.cmp.delta - c.delta, P.noise) !== "coin";
  const evB = yours ? planBaseline(ctx, P, g) : withIt;
  const wk = evB.gws.find((x) => x.gw === g);
  const others = (wk?.moves || []).some((x) => x.ok && x.out !== m.out);
  const bank = wk ? COPY.bankNow(fmt.money(wk.bank - freedBy(evB, g, m)), g, P.A, others) : null;
  const fa = evB.gws.find((x) => x.gw === nx)?.ft;
  const fb = !yours ? without.gws.find((x) => x.gw === nx)?.ft : wk && nx != null && !SQUAD_CHIPS.has(wk.chip) ? nextFt(wk.ft, Math.min(wk.ft, Math.max(0, wk.transfers - 1)), ftGrant(P.season, nx)) : null;
  const nOff = yours ? 1 : Math.max(1, (wa?.transfers ?? 0) - (wb?.transfers ?? 0));
  return [
    mv ? COPY.frees(freedBy(withIt, g, m), bank) : null,
    hit > 0 ? `${MINUS}${HIT_COST * hit}: the extra transfer` : null,
    gone.length ? COPY.replaces(gone.join(", ")) : null,
    fa != null && fb != null && fa !== fb ? COPY.ftWithout(nx, fa, fb, nOff) : null,
    ...hitsLater(withIt.gws, without.gws, g),
    miss ? COPY.ifMisses(nm(m.in), g, onBase(miss.delta, miss.base, head), head ?? miss.base, vs) : null,
    better ? COPY.instead(`${nm(use.out)} \u2192 ${nm(use.in)}`, onBase(use.cmp.delta, c.delta, head), head ?? c.delta, vs) : null
  ].filter(Boolean);
}
var pairOf = (ev, g, m) => {
  const x = ev?.gws.find((s) => s.gw === g)?.moves.find((y) => y.out === m.out && y.in === m.in);
  return { in: m.in, out: m.out, buy: x?.buy ?? null, sell: x?.sell ?? null };
};
var withFlag = (ctx, id, text) => (Q, prev) => {
  const t = text(Q, prev);
  const flag = statusText(Q.L.name(id), Q.L.get(id)?.row);
  return flag && compare2(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }).delta <= -0.05 ? `${t} \xB7 ${flag}` : t;
};

// js/m/ahead/edits/lineups.js
function lineup(ctx, g, patch, what, opts = {}) {
  const I = info(ctx);
  return lineupEdit(ctx, [g], () => {
    if (g === I.A) memOf(ctx).setLineup(patch);
    else setLineups(ctx, I, { ...lineups(ctx, I), [g]: { ...lineups(ctx, I)[g] || {}, ...patch } });
  }, what, opts);
}
function lineupEdit(ctx, gws, change, what, { points = true } = {}) {
  const I = info(ctx);
  if (gws.includes(I.A) && isLive(ctx)) {
    toastOf(ctx)(COPY.live(I.A), "warn");
    return false;
  }
  const weeks = () => gws.map((g) => weekOf(plan(ctx), g)).filter(Boolean);
  const before = weeks();
  const snap = snapshot(ctx);
  const prevP = plan(ctx);
  change();
  flashLanding(ctx, prevP, { gws });
  const c = compare2(ctx, { weeks: weeks() }, { weeks: before });
  const subject = gws.length === 1 && gws[0] !== I.A ? COPY.inGw(what, gws[0]) : what;
  const why = lineupWhy(ctx, prevP, plan(ctx), gws);
  say(ctx, [points ? COPY.lineup(subject, gws, c.delta, c.label) : subject, ...why].join(" \xB7 "), undoOf(ctx, subject, () => restore(ctx, snap)));
  return true;
}
function benchedBuys(P, g, pl) {
  const w = weekOf(P, g);
  if (!w?.lineup || pl?.state !== "ready" || SQUAD_CHIPS.has(pl.choice.chips?.[g])) return [];
  const bench = new Set((pl.ev?.gws.find((x) => x.gw === g)?.bench ?? []).map(Number));
  const benched = new Set(w.bench.map(Number));
  return planBack(P, g, pl).adds.filter((m) => benched.has(Number(m.out)) && bench.has(Number(m.in))).map((m) => Number(m.in));
}
function lineupWhy(ctx, P0, Q, gws) {
  const out = [];
  for (const g of gws) {
    if (!weekOf(Q, g)?.lineup || !weekOf(P0, g)) continue;
    const now = plansListed(ctx, Q, g).filter((x) => x.state === "ready");
    const names = [], chips = [];
    for (const a of plansListed(ctx, P0, g)) {
      if (a.state !== "ready" || a.refRow || a.cmp.delta <= 0.05) continue;
      const k = forkKey(a.choice, g), b = now.find((x) => forkKey(x.choice, g) === k);
      if (b && b.cmp.delta > a.cmp.delta - 0.05) continue;
      const chip = a.choice.chips?.[g];
      if (SQUAD_CHIPS.has(chip)) {
        if (!chips.includes(chip)) chips.push(chip);
        continue;
      }
      const was = new Set(benchedBuys(P0, g, a));
      for (const id of b ? benchedBuys(Q, g, b) : []) if (!was.has(id) && !names.includes(Q.L.name(id))) names.push(Q.L.name(id));
    }
    if (names.length) out.push(COPY.onYourBench(names));
    out.push(...chips.map((c) => COPY.chipLineup(chipName(c), g)));
  }
  return out;
}
function resetLineups(ctx, gws) {
  const I = info(ctx);
  if (!gws.length) return;
  if (gws.includes(I.A) && memPlan(ctx)?.lineup) memOf(ctx).setLineup({ xi: null, bench: null, captain: null, vice: null });
  setLineups(ctx, I, Object.fromEntries(Object.entries(lineups(ctx, I)).filter(([g]) => !gws.includes(Number(g)))));
}
function resetLineup(ctx, gws) {
  const P = plan(ctx);
  let own = [].concat(gws).map(Number).filter((g) => weekOf(P, g)?.lineup);
  if (own.length > 1) own = own.filter((g) => !isFrozen(P, g));
  if (!own.length) return false;
  return lineupEdit(ctx, own, () => resetLineups(ctx, own), own.length > 1 ? "Best lineups back" : "Best lineup back");
}
function chipEdit(P, g, chip) {
  const half = halfEnd(P);
  const drop = P.pins.filter((p) => p.kind === "chip" && Object.values(p.chips || {}).includes(chip) && Number(p.gw) <= half === g <= half).map((p) => p.id);
  const restores = [];
  if (chip === "wc" || chip === "fh") {
    const auto = P.pins.filter((p) => p.id === `roll:${g}` || p.id === `hits:${g}`);
    drop.push(...auto.map((p) => p.id));
    drop.push(...transferPinsAt(P, g));
    restores.push(...auto, ...P.pins.find((p) => p.id === `chip:${g}`)?.restores ?? []);
  }
  const was = (x) => chipPins(P).find((c) => c.gw === x)?.chip ?? weekOf(P, x)?.chip ?? null;
  const moved = P.pins.filter((p) => drop.includes(p.id) && p.kind === "chip").map((p) => Number(p.gw));
  drop.push(...picksAt(P, [...moved, ...was(g) !== chip ? [g] : []]).map((p) => p.id));
  return { pins: [pinChip(g, chip, { label: `${chipName(chip)} GW${g}`, ...restores.length ? { restores } : {} })], drop };
}
var autoRuleName = (q, g) => isRoll(q) ? COPY.rollRule(g, Number(q.caps?.[g] ?? 0)) : num(q.hits?.[g]) ? COPY.hitsUpTo(num(q.hits[g]), g) : COPY.freeOnly(g);
function chipWords(P, g, chip, drop, { inPlace = false } = {}) {
  const prev = chipPins(P).find((x) => x.gw === g)?.chip ?? weekOf(P, g)?.chip ?? null;
  const swap = prev && prev !== chip ? chipName(prev) : null;
  const gone = P.pins.filter((p) => p.kind === "hits" && drop.includes(p.id));
  const rolls = P.pins.filter((p) => isRoll(p) && drop.includes(p.id));
  const picks = P.pins.filter((p) => isPick(p) && drop.includes(p.id));
  const mine = new Set(SQUAD_CHIPS.has(chip) ? transferPinsAt(P, g) : []);
  const moved = P.pins.filter((p) => mine.has(p.id) && drop.includes(p.id) && !picks.includes(p));
  const head = `${chipName(chip)} planned for GW${g}`;
  const what = [withTaken(P, inPlace && swap ? COPY.inPlaceOf(head, swap) : head, [...rolls, ...picks, ...moved]), ...gone.map((q) => COPY.chipRemoves(autoRuleName(q, g)))].join(" \xB7 ");
  return { what, swap, taken: [...rolls, ...picks, ...moved, ...gone] };
}
var transferPinsAt = (P, g) => squadWeek(weekOf(P, g)) ? [] : goneIds(P, yoursTakenBack(P, g, []));
function chipPlan(ctx, g, chip, road = null, { less = null } = {}) {
  const P = plan(ctx);
  const { pins, drop } = chipEdit(P, g, chip);
  const was = plannedAt(P, chip, g);
  const { what, swap, taken } = chipWords(P, g, chip, drop, { inPlace: true });
  const row = SQUAD_CHIPS.has(chip) && P.mem?.hold ? chipStates(ctx, P, g, chipPreps(ctx, P)).find((x) => x.chip === chip) : null;
  const gap = row?.cmp && row.best && row.best.gw !== g && row.best.delta != null && row.best.vs === row.vs ? COPY.chipLess(row.best.delta - row.cmp.delta, row.best.gw) : null;
  return edit(ctx, {
    pins,
    drop,
    road,
    from: g,
    what,
    taken,
    text: row ? () => COPY.chipToast(what, gap) : (Q, prev) => {
      const c = compare2(ctx, { weeks: Q.weeks }, { weeks: prev.weeks });
      if (was == null && !swap && SQUAD_CHIPS.has(chip)) chipTold(Q, g, c);
      return COPY.chipToast(what, swap ? null : less);
    }
  });
}
function chipOff(ctx, g) {
  const P = plan(ctx);
  const { mine, picks, pins: back, drop } = chipOffParts(P, g);
  const off = withTaken(P, `No chip in GW${g}`, picks);
  if (!mine) return edit(ctx, { pins: [pinChip(g, null)], drop, from: g, what: off, taken: picks, text: vsPrev(ctx, off) });
  const what = [off, ...back.map((q) => COPY.chipBack(autoRuleName(q, g)))].join(" \xB7 ");
  return edit(ctx, { pins: back, drop, from: g, what, taken: picks, text: vsPrev(ctx, what) });
}
function useChip(ctx, c, g) {
  const P = plan(ctx);
  if (weekOf(P, g)?.chip === c || chipPins(P).some((x) => x.chip === c && x.gw === g)) return chipOff(ctx, g);
  const check = chipCheck(ctx, P, c, g);
  if (!check.ok) {
    toastOf(ctx)(check.reason, "warn");
    return false;
  }
  const src = chipPreps(ctx, P);
  const pre = src.at(c, g);
  const best = honestBest(halfBests(P, src, g), c);
  const less = best && best.gw !== g && pre.state === "ready" ? COPY.chipLess(best.delta - pre.cmp.delta, best.gw) : null;
  return chipPlan(ctx, g, c, pre.state === "ready" ? pre.road : null, { less });
}
function chipOffParts(P, g, { locked = false } = {}) {
  const mine = P.pins.find((p) => p.id === `chip:${g}`) ?? null;
  const picks = picksAt(P, [g]);
  const drop = [...mine ? [`chip:${g}`] : [], ...picks.map((p) => p.id)];
  const stays = asksOf(P).filter((p) => !drop.includes(p.id));
  const back = (mine?.restores ?? []).filter((q) => !isRoll(q) || !locked && !clashing(P, q, stays).length);
  return { mine, picks, pins: back, drop };
}
var chipBackOf = (P, g, c) => {
  const ch = weekOf(P, g)?.chip ?? null;
  return SQUAD_CHIPS.has(ch) && !SQUAD_CHIPS.has(c?.chips?.[g]) ? ch : null;
};

// js/m/ahead/edits/rules.js
function endingOf(Q, prev, g, { own = null, named = [] } = {}) {
  const key = (m) => `${m.out}>${m.in}`;
  const off = new Set(named.map(key));
  const bare = (V) => ({ ...V, weeks: V.weeks.map((w) => w.gw === g ? { ...w, moves: w.moves.filter((m) => !off.has(key(m))) } : w) });
  const chose = (x) => !prev.mem?.hold || repicks(prev, x);
  const theirs = (V) => ({ ...V, weeks: V.weeks.map((w) => ({ ...w, moves: (w.moves || []).filter((m) => !pinOfMove(prev, { ...m, gw: w.gw }) && !pinOfMove(Q, { ...m, gw: w.gw })) })) });
  const later = Q.weeks.filter((w) => w.gw > g && chose(w.gw) && !squadWeek(w) && !squadWeek(weekOf(prev, w.gw))).flatMap((w) => sideEffects(theirs(prev), theirs(Q), w.gw, null).split(" \xB7 ").filter(Boolean).map((c) => ` \xB7 ${c} in GW${w.gw}`));
  return [
    hitAfter(Q, prev, g),
    chose(g) ? sideEffects(bare(prev), bare(Q), g, own) : "",
    ...later,
    ...hitsLater(Q.weeks, prev.weeks, g).map((x) => ` \xB7 ${x}`),
    captainMoved(Q, prev, g)
  ].join("");
}
function sellsOn(asks, out, g) {
  const chain = asks.flatMap((q) => {
    const held = MOVE_KINDS.has(q.kind) ? (q.must || []).find(([id, a, b]) => Number(id) === Number(out) && a < g && b >= g) : null;
    return held ? [{ ...q, must: q.must.map((x) => x === held ? [x[0], x[1], g - 1] : x) }] : [];
  });
  return { chain, asks: asks.map((q) => chain.find((c) => c.id === q.id) ?? q) };
}
function chainOf(P, g, moves) {
  let asks = asksOf(P);
  const chain = /* @__PURE__ */ new Map();
  for (const m of moves) {
    const r = sellsOn(asks, m.out, g);
    asks = r.asks;
    for (const c of r.chain) chain.set(c.id, c);
  }
  return { chain, asks };
}
function sellFrom(ctx, g, out, inn) {
  const P = plan(ctx);
  const r = addYours(ctx, P, g, out, inn);
  if (r.problem) {
    toastOf(ctx)(problemText(ctx, r.problem, P.L.name(inn)), "warn");
    return false;
  }
  const label = `${P.L.name(out)} \u2192 ${P.L.name(inn)} from GW${g}`;
  const pin = pinSell(out, g, P.end, { in: inn, label });
  const { chain, asks } = sellsOn(asksOf(P), out, g);
  const taken = clashing(P, pin, asks);
  const what = withTaken(P, COPY.cameIn([P.L.name(inn)], g === P.A ? null : g), taken);
  return edit(ctx, {
    pins: [pin, ...chain],
    drop: [...wishDrop(P, inn), ...taken.map((q) => q.id)],
    from: g,
    what,
    taken,
    inPlace: chain[0]?.id ?? null,
    ending: (Q, prev) => endingOf(Q, prev, g, { own: out })
  });
}
function sellAny(ctx, g, out) {
  const P = plan(ctx);
  const nm = P.L.name;
  const sold = (Q) => Q.weeks.filter((w) => w.gw <= g).flatMap((w) => w.moves.filter((m) => m.out === out).map((m) => ({ ...m, gw: w.gw }))).at(-1) ?? null;
  const pin = pinSell(out, g, P.end, { label: `Sell ${nm(out)} from GW${g}` });
  const { chain, asks } = sellsOn(asksOf(P), out, g);
  const taken = clashing(P, pin, asks);
  const sale = `${nm(out)} sold from GW${g}`;
  const said = (Q) => {
    const m = sold(Q);
    return withTaken(P, m ? `${nm(out)} \u2192 ${nm(m.in)} in GW${m.gw}` : sale, taken);
  };
  return edit(ctx, {
    pins: [pin, ...chain],
    drop: taken.map((q) => q.id),
    inPlace: chain[0]?.id ?? null,
    from: g,
    what: withTaken(P, sale, taken),
    taken,
    text: withPoints(ctx, said, (Q, prev) => endingOf(Q, prev, sold(Q)?.gw ?? g, { own: out }), { total: true })
  });
}
function veto(ctx, m, { scope = "gw" } = {}) {
  const P = plan(ctx);
  const nm = P.L.name;
  const pair = scope === "pair", one = pair || scope === "gw";
  const label = pair ? `Not ${nm(m.in)} for ${nm(m.out)} in GW${m.gw}` : `Not ${nm(m.in)} in GW${m.gw}`;
  const pin = pair ? pinNotFor(m.out, m.in, m.gw, { label }) : one ? pinVeto(m.in, m.gw, m.gw, { scope, label }) : pinVeto(m.in, P.A, P.end, { label: `Not ${nm(m.in)}` });
  const said = one ? label : ruleOf(P, pin).text;
  const mine = (() => {
    const q = pinOfMove(P, m);
    return q?.kind === "sell" && Number(q.in) === Number(m.in) ? q : null;
  })();
  if (mine) {
    const g0 = Number(mine.gw);
    const sale = pinSell(m.out, g0, P.end, { label: `Sell ${nm(m.out)} from GW${g0}` });
    const others = [...new Map([...clashing(P, pin), ...clashing(P, sale, asksOf(P).filter((q) => q.id !== mine.id))].filter((q) => q.id !== mine.id).map((q) => [q.id, q])).values()];
    const what2 = (Q) => {
      const x = weekOf(Q, m.gw)?.moves.find((y) => y.out === m.out);
      return withTaken(P, x ? `${said} \xB7 ${COPY.cameInFor(nm(x.in), nm(m.out), m.gw === P.A ? null : m.gw)}` : said, others);
    };
    return edit(ctx, {
      pins: [pin, sale],
      drop: [mine.id, ...others.map((q) => q.id), ...meeting(P, ["veto", "never"], m.in, pin)],
      from: m.gw,
      text: withFlag(ctx, m.in, vsPrev(ctx, what2)),
      what: withTaken(P, said, others),
      taken: others
    });
  }
  const taken = clashing(P, pin);
  const what = withTaken(P, said, taken);
  const drop = [...taken.map((q) => q.id), ...meeting(P, ["veto", "never"], m.in, pin)];
  const text = withFlag(ctx, m.in, vsPrevOr(ctx, () => what, drop, vsPrev(ctx, what)));
  const road = baked(ctx, [pin], drop);
  return edit(ctx, { pins: [pin], drop, road, from: road ? P.A : m.gw, text, what, taken });
}
function want(ctx, id, g, road) {
  const P = plan(ctx);
  const bp = holdBuy(ctx, id, g, road);
  if (bp?.kind === "none") {
    sayBuyProblem(ctx, P, id, bp);
    return false;
  }
  return bringIn(ctx, id, g, bp);
}
function keepPin(P, id, { gw = P.A, scope = "all", from = null } = {}) {
  const nm = P.L.name(id);
  if (scope === "gw") return pinKeep(id, gw, gw, { scope, label: `Keep ${nm} in GW${gw}` });
  const since = P.owned.includes(id) ? P.A : P.weeks.find((w) => w.squad.includes(id))?.gw ?? P.A;
  const a = Math.max(since, from ?? since);
  return pinKeep(id, a, P.end, { label: a > P.A ? `Keep ${nm} from GW${a}` : `Keep ${nm}` });
}
function keep(ctx, id, { gw, scope = "all", from = null } = {}) {
  const P = plan(ctx);
  const nm = P.L.name;
  const pin = keepPin(P, id, { gw, scope, from });
  const [, a, b] = pin.must[0];
  const sales = P.weeks.filter((w) => w.gw >= a && w.gw <= b).flatMap((w) => w.moves.filter((m) => m.out === id).map((m) => ({ gw: w.gw, ...m })));
  const sc = scopeOf(pin, { start: P.A, end: P.end });
  const when = sc === "all weeks" ? "" : sc.startsWith("from") ? ` ${sc}` : ` in ${sc}`;
  const taken = clashing(P, pin);
  const own = taken.filter((q) => q.kind === "sell" && Number(q.player) === Number(id) && q.in != null);
  const what = withTaken(P, `${nm(id)} kept${when}${own.length ? ` ${COPY.planInsteadOf(own.map((q) => nm(q.in)).join(" + "))}` : ""}`, taken.filter((q) => !own.includes(q)), own);
  const off = taken.map((q) => q.id);
  const fhOnly = scope === "gw" && squadWeek(weekOf(P, a)) === "fh";
  const drop = [...off, ...fhOnly ? [] : meeting(P, "keep", id, pin)];
  const g = sales.length ? Math.min(...sales.map((m) => m.gw)) : a;
  const gone = sales.filter((m) => taken.some((q) => q.id === pinOfMove(P, m)?.id));
  const ending = (Q, prev) => endingOf(Q, prev, g, { own: id });
  return edit(ctx, {
    pins: [pin],
    drop,
    from: g,
    what,
    taken,
    also: gone.length ? () => noteRemoved(P, gone) : null,
    text: vsPrevOr(ctx, () => COPY.keptFromChoices(nm(id), when || ` through GW${P.end}`), off, withPoints(ctx, what, ending, { total: true }))
  });
}
function never(ctx, id) {
  const P = plan(ctx);
  const buy = P.weeks.flatMap((w) => w.moves.map((m) => ({ ...m, gw: w.gw }))).find((m) => m.in === id);
  if (buy) return veto(ctx, buy, { scope: "all" });
  const pin = pinNever(id, P.A, P.end, { label: `Never ${P.L.name(id)}` });
  const taken = clashing(P, pin);
  const drop = [...taken.map((q) => q.id), ...meeting(P, ["veto", "never"], id, pin)];
  const said = ruleOf(P, pin).text;
  const what = withTaken(P, said, taken);
  return edit(ctx, { pins: [pin], drop, from: P.A, what, taken, text: vsPrevOr(ctx, () => sentence(said), drop, vsPrev(ctx, what)) });
}
var scopeLabels = (kind, g, end) => kind === "keep" ? { gw: `GW${g} only`, all: span([g, end]) } : { gw: `Not in GW${g}`, all: "Never" };
function rescope(ctx, pin, scope) {
  const P = plan(ctx);
  const id = Number(pin.player);
  const g = num(pin.gw) ?? P.A;
  if (pin.kind === "keep") return keep(ctx, id, { gw: g, scope, from: g });
  return scope === "all" ? never(ctx, id) : veto(ctx, { gw: g, out: null, in: id }, { scope });
}
function buyCandidates(P, { pos, from, not = [], limit = 25 } = {}) {
  const have = new Set(P.weeks.flatMap((w) => w.squad));
  const no = /* @__PURE__ */ new Set([...barred(P, from), ...not.map(Number)]);
  const gain = (r) => sum(ids(r.xp).slice(0, P.gws.length));
  return P.d.rows.filter((r) => r.buyable && P.L.pos(r.id) === pos && !have.has(Number(r.id)) && !no.has(Number(r.id))).sort((a, b) => gain(b) - gain(a)).slice(0, limit).map((r) => Number(r.id));
}
var asksOf = (P) => (P?.pins || []).filter((p) => p.id !== "road" && p.id !== "hold" && p.id !== "hits");
var pinsOf = (P, kind, id) => asksOf(P).filter((p) => Number(p.player) === Number(id) && [].concat(kind).includes(p.kind));
var windowOf = (p) => {
  const w = [...parseSpans(p.must || []), ...parseSpans(p.excl || [])].filter(([id]) => id === Number(p.player));
  return w.length ? [Math.min(...w.map(([, a]) => a)), Math.max(...w.map(([, , b]) => b))] : null;
};
var overlaps = (p, q) => {
  const a = windowOf(p), b = windowOf(q);
  return !!a && !!b && a[0] <= b[1] && b[0] <= a[1];
};
var meeting = (P, kind, id, pin) => pinsOf(P, kind, id).filter((q) => q.id !== pin.id && overlaps(q, pin)).map((q) => q.id);
var clashing = (P, pin, asks = asksOf(P)) => [...new Set(pinConflicts(asks, pin, { from: P.A, to: P.end, into: (g) => squadBefore(P, g) }).map((c) => c.pin).filter((q) => q && q.id !== "hold"))];
var withTaken = (P, what, pins, gone = []) => {
  const t = takenBack(P, pins, gone)?.text;
  return !t ? what : / removed$/.test(what) && / removed$/.test(t) ? `${what.replace(/ removed$/, "")}, ${t}` : [what, t].filter(Boolean).join(" \xB7 ");
};
var ruleOf = (P, p) => ruleText(p, P.L.name, { end: P.end, start: P.A, cap: hitCap(P.base), hold: !!P.mem?.hold });
var pinOf = (P, kind, id, gw = null) => pinsOf(P, kind, id).find((p) => gw == null || overlaps(p, { player: id, must: [[Number(id), gw, gw]] })) ?? null;
var refusedAt = (P, g) => new Set(P.pins.filter((p) => p.kind === "notfor" && Number(p.gw) === g).map((p) => `${p.out}>${p.player}`));
var barred = (P, from, to = P.end) => barredAt(P.pins.map((p) => p.kind === "sell" && Number(p.gw) > from ? { ...p, in: null, excl: (p.excl || []).filter(([id]) => Number(id) !== Number(p.player)) } : p), from, to);
function keptFrom(P, g) {
  const out = /* @__PURE__ */ new Map();
  for (const id of new Set(asksOf(P).filter((p) => p.kind === "keep").map((p) => Number(p.player)))) {
    const x = P.gws.find((y) => y >= g && pinOf(P, "keep", id, y));
    if (x != null) out.set(id, x);
  }
  return out;
}
function keptCells(P, g, chip = null) {
  const asks = asksOf(P), keeps = new Set(asks.filter((p) => p.kind === "keep").map((p) => p.id));
  if (!keeps.size) return [];
  const { cells } = composePins([...asks, pinChip(g, chip)], { from: g, to: P.end });
  return [...cells].flatMap(([id, by]) => [...by].filter(([, c]) => c.want === "in" && keeps.has(c.pin)).map(([x]) => [id, x]));
}
var barringRules = (P, id, g = null) => rulesOf(P).filter((p) => parseSpans(p.excl || []).some(([x, a, b]) => x === Number(id) && a <= P.end && b >= (g ?? P.A)));
var barringRule = (P, id, g = null) => barringRules(P, id, g)[0] ?? null;
function sellOut(ctx, g, out, inn = null) {
  return inn == null ? sellAny(ctx, g, out) : sellFrom(ctx, g, out, inn);
}
function liftAsk(ctx, id) {
  const P = plan(ctx);
  const pin = asksOf(P).find((p) => p.id === id);
  if (!pin) return false;
  if (liftsLive(ctx, P, pin)) {
    toastOf(ctx)(COPY.live(P.A), "warn");
    return false;
  }
  const what = `Without \u201C${ruleOf(P, pin).text}\u201D`;
  return edit(ctx, { drop: [id], from: liftFrom(P, pin), what, text: vsPrev(ctx, what) });
}
function removeRule(ctx, id) {
  const P = plan(ctx);
  const pin = asksOf(P).find((p) => p.id === id);
  if (!pin) return false;
  const m = MOVE_KINDS.has(pin.kind) ? P.weeks.filter((w) => !squadWeek(w)).flatMap((w) => w.moves.map((x) => ({ ...x, gw: w.gw }))).find((x) => pinOfMove(P, x) === pin) : null;
  return m ? removeMove(ctx, m) : liftAsk(ctx, id);
}
function captain(ctx, g, id) {
  const P = plan(ctx);
  const w = weekOf(P, g);
  if (!w?.xi.includes(id)) return false;
  return lineup(ctx, g, { captain: id, vice: w.vice === id ? w.captain : w.vice }, COPY.captainNow(P.L.name(id)));
}
function vice(ctx, g, id) {
  const P = plan(ctx);
  const w = weekOf(P, g);
  if (!w?.xi.includes(id) || w.captain === id) return false;
  return lineup(ctx, g, { vice: id }, COPY.viceNow(P.L.name(id)), { points: false });
}
function subLineup(w, a, b, L) {
  const s = w && swapLineup(w, a, b, L.pos);
  if (!s) return null;
  const top = (not) => [...s.xi].filter((p) => !not.includes(p)).sort((x, y) => (L.xp(y, w.gw) ?? 0) - (L.xp(x, w.gw) ?? 0))[0] ?? null;
  const captain2 = s.xi.includes(w.captain) ? w.captain : s.xi.includes(w.vice) ? w.vice : top([]);
  const vice2 = s.xi.includes(w.vice) && w.vice !== captain2 ? w.vice : top([captain2]);
  const into = s.xi.includes(Number(a)) && !w.xi.includes(Number(a)) ? Number(a) : Number(b);
  const order = !s.xi.includes(Number(a)) && !s.xi.includes(Number(b));
  return { xi: s.xi, bench: s.bench, captain: captain2, vice: vice2, into, out: into === Number(a) ? Number(b) : Number(a), order };
}
function subWords(P, w, s) {
  const nth = (p) => subOrder(s.bench, P.L.pos).get(p);
  return s.order ? COPY.benchOrder([s.into, s.out].sort((x, y) => nth(x) - nth(y)).map((p) => [P.L.name(p), nth(p)])) : `${P.L.name(s.into)} in for ${P.L.name(s.out)}${s.captain !== w.captain ? ` \xB7 ${COPY.captainNow(P.L.name(s.captain))}` : ""}`;
}
function sub(ctx, g, a, b) {
  const P = plan(ctx);
  const s = subLineup(weekOf(P, g), a, b, P.L);
  if (!s) return false;
  const w = weekOf(P, g);
  const arm = { ...s.captain !== w.captain ? { captain: s.captain } : {}, ...s.vice !== w.vice ? { vice: s.vice } : {} };
  return lineup(ctx, g, { xi: s.xi, bench: s.bench, ...arm }, subWords(P, w, s), { points: !s.order });
}
function subChoices(ctx, P, g, id) {
  const w = weekOf(P, g);
  const other = w?.bench.includes(Number(id)) ? w.xi : w?.xi.includes(Number(id)) ? w.bench : null;
  if (!other) return [];
  return swapCandidates(w, id, P.L.pos).filter((p) => other.includes(p)).map((p) => {
    const s = subLineup(w, id, p, P.L);
    return { id: p, s, what: subWords(P, w, s), cmp: subGap(inputs(ctx), w, s) };
  }).sort((x, y) => y.cmp.delta - x.cmp.delta || (P.L.xp(x.id, g) ?? 0) - (P.L.xp(y.id, g) ?? 0));
}

// js/m/ahead/edits/say.js
var OV = null;
var ovOf = (ctx, I) => OV && OV.mem === memOf(ctx) && OV.entry === I?.entry && OV.A === I?.A ? OV : null;
var ovFor = (ctx, I, chain) => ({ mem: memOf(ctx), entry: I.entry, A: I.A, ...chain.at(-1).own, from: Math.min(...chain.map((c) => c.own.from)), chain, armed: false });
var roadVersion = (P) => P?.mem?.source === "yours" ? P.mem.road?.version ?? null : P?.mem?.version ?? null;
var plannerVs = (road, v, prev) => prev?.comparable && v && v === roadVersion(prev) ? plannerOf(road, prev.road) : null;
var plannerFor = (Q, prev) => Q?.comparable ? plannerVs(Q.road, roadVersion(Q), prev) : null;
var dirOf = (I, before, after) => pinsDir(before, after, { from: I.A, to: I.end });
var vsPrev = (ctx, what, { total = false } = {}) => (Q, prev) => changeText(
  typeof what === "function" ? what(Q) : what,
  compare2(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }),
  {
    dir: dirOf(Q, prev.pins, Q.pins),
    gws: Q.gws,
    transfers: [transfersOf(prev), transfersOf(Q)],
    planner: plannerFor(Q, prev),
    noise: Q.noise,
    total
  }
);
var withPoints = (ctx, what, ending, { total = false } = {}) => (Q, prev) => `${vsPrev(ctx, what, { total })(Q, prev)}${ending(Q, prev)}`;
var vsPrevOr = (ctx, same, drop, changed) => (Q, prev) => {
  const kept = !drop.length && Q.weeks.every((w) => sameSet(w.squad, weekOf(prev, w.gw)?.squad ?? [])) && Math.abs(compare2(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }).delta) < 1e-6;
  return kept ? same(Q) : changed(Q, prev);
};
var toastOf = (ctx) => DRY ? () => () => {
} : ctx.ui?.toast ?? toast;
var lastSay = null;
var lastUndo = null;
var backing = false;
var watching = false;
var cardUndo = (ctx, g) => lastUndo?.entry === ctx.store.get("entry") && lastUndo.gw === g ? lastUndo.fn : null;
var takingBack = (fn) => () => {
  backing = true;
  lastUndo = null;
  return fn();
};
var saidNow = () => lastSay;
var sayAgain = (was, text) => {
  if (was && was === lastSay) was.update?.(text);
};
var PENDING = null;
function say(ctx, text, undo, kind = "info", tag = null, more = [], take = null) {
  if (lastSay !== PENDING?.toast) lastSay?.();
  const action = undo ? { label: "Undo", onClick: undo } : void 0;
  const doc = globalThis.document, quiet = cardSaysIt(kind);
  if (doc && !watching) {
    watching = true;
    doc.addEventListener("click", () => {
      backing = false;
    }, { capture: true, passive: true });
  }
  if (undo && !backing) {
    const P = plan(ctx);
    lastUndo = { entry: ctx.store.get("entry"), gw: P ? viewedGw(ctx, P) : null, fn: () => {
      lastUndo = null;
      undo();
    } };
    if (doc) queueMicrotask(() => bump(ctx));
  }
  lastSay = toastOf(ctx)(text, kind, { timeout: kind === "info" ? 6500 : 9e3, action, actions: more.length ? [...more, action].filter(Boolean) : void 0, tag, replaces: "pending", take, quiet });
  PENDING = null;
}
function sayPending(ctx, said, back, more = {}) {
  say(ctx, COPY.pendingEdit(said), back ? undoOf(ctx, said, back) : null, "info", "pending");
  PENDING = { said, toast: lastSay, text: COPY.pendingEdit(said), ...more };
}
function checkEdit(ctx, ov) {
  const mem = memOf(ctx), chain = ov.chain;
  mem.noteEdit({ what: chainSaid(chain), dir: dirOf(info(ctx), chain[0].snap.pins, mem.getPlan().pins), pins: chain[0].snap.pins, edit: ov.from });
  pendingSay(ctx, chain);
}
var undoOf = (ctx, words, fn) => () => {
  const t = Date.now();
  const before = plan(ctx);
  const r = fn();
  if (r === false) return;
  bump(ctx);
  const after = plan(ctx);
  const ch = before && after ? changedOf(after, before) : { gws: [], rows: {}, cards: {} };
  setFlash(after ?? before, { ...FLASH?.at >= t ? FLASH : ch, undo: true });
  const g = r === "again" || !after ? null : viewedGw(ctx, after);
  const to = g != null && !ch.gws.includes(g) ? after.gws.find((x) => ch.gws.includes(x)) ?? null : null;
  if (to != null) (GO_GW ?? ((x) => ctx.store.set("gw", x)))(to);
  if (r === "again") return;
  if (PENDING) {
    PENDING.toast?.();
    PENDING = null;
  }
  say(ctx, COPY.undone(words, to), null);
};
var subjectOf = (text) => text.split(": ")[0];
var PENDING_AGE_S = 5;
function pendingTick(ctx) {
  const p = PENDING && memPlan(ctx)?.pending;
  if (PENDING?.reopened && !p?.edit) PENDING = null;
  if (!p || !PENDING) return;
  const s = (Date.now() - p.since) / 1e3;
  const text = p.state === "offline" ? COPY.pendingOffline(PENDING.said) : COPY.pendingEdit(PENDING.said, s >= PENDING_AGE_S ? clockText(s) : null);
  if (text === PENDING.text) return;
  PENDING.text = text;
  PENDING.toast?.update?.(text);
}
var REOPENED = null;
function pendingAgain(ctx, gp = memPlan(ctx)) {
  const e = gp?.pending?.edit;
  if (!e || ovOf(ctx, info(ctx)) || REOPENED === e.at) return;
  REOPENED = e.at;
  const mem = memOf(ctx);
  sayPending(ctx, e.what, Array.isArray(e.pins) ? () => {
    mem.claimEdit();
    return mem.restorePins(e.pins);
  } : null, { reopened: true });
}
var CHEER_KEY = (entry) => `fc:cheer:${entry}`;
var CHEER_MS = 8e3;
var CHEERED = { local: null, said: null };
function sayCheer(ctx, P, el, planning = false, act = 0, { linger = false } = {}) {
  const c = P?.b?.rank?.cheer, local = ctx.api?.local, cs = ctx.store.get("conn");
  const show = (on) => {
    clearTimeout(el._cheerT);
    return !!ctx.factPanel?.(el, on ? waitFacts(P.b) : null, on ? waitFact(P.b, planning ? act : 1) : null);
  };
  if (!el) return false;
  if (!c || !local || cs?.snapshot || cs?.state === "offline") return show(false);
  const k = CHEER_KEY(P.entry), s = P.season, sig = `${P.entry}:${s}:${c.gw}`;
  const was = local.json(k);
  const said = was?.s === s && was.gw === c.gw || CHEERED.local === local && CHEERED.said === sig;
  if (!planning && (said || ctx.sheets?.depth?.())) return el.dataset.planning ? show(false) : !el.hidden;
  el.dataset.planning = planning && !linger ? "1" : "";
  if (!said) {
    CHEERED = { local, said: sig };
    local.set(k, JSON.stringify({ s, gw: c.gw }));
  }
  const up = show(true);
  if (!planning || linger) el._cheerT = setTimeout(() => show(false), CHEER_MS);
  return up;
}
function snapshot(ctx) {
  const I = info(ctx), gp = memPlan(ctx);
  return { pins: clone(gp?.pins || []), road: gp?.source === "yours" && !gp.pending && !gp.error ? clone(gp.road) : null, hitsMax: gp?.hitsMax ?? null, lineup: clone(gp?.lineup ?? null), lus: clone(lineups(ctx, I)), removed: clone(removedBy(I)) };
}
var derivedPin = (p) => p.id === "hold" || p.id === "hits";
var pinSig = (p) => JSON.stringify([p.id, p.must, p.excl, p.max_hits ?? 0, p.hits ?? null, p.chips ?? null, p.cash ?? null, p.funds ?? null, p.caps ?? null]);
function restore(ctx, snap) {
  const mem = memOf(ctx);
  OV = null;
  mem.batch(() => restoreIn(ctx, mem, snap));
}
function restoreIn(ctx, mem, snap) {
  const I = info(ctx);
  removedBy(I);
  REMOVED.by = clone(snap.removed ?? {});
  const want2 = new Map(snap.pins.map((p) => [p.id, p]));
  if ((mem.getPlan().hitsMax ?? null) !== (snap.hitsMax ?? null)) mem.setHitsMax(snap.hitsMax ?? null);
  for (const p of mem.getPlan().pins) if (p.id !== "road" && !derivedPin(p) && (!want2.has(p.id) || pinSig(want2.get(p.id)) !== pinSig(p))) mem.removePin(p.id);
  const have = new Map(mem.getPlan().pins.map((p) => [p.id, p]));
  for (const p of snap.pins) if (!derivedPin(p) && (!have.has(p.id) || pinSig(have.get(p.id)) !== pinSig(p))) mem.addPin(p);
  const now = new Map(mem.getPlan().pins.map((p) => [p.id, p]));
  const order = (ps) => ps.filter((p) => !derivedPin(p)).map((p) => p.id).filter((id) => id !== "road").join();
  if (order(mem.getPlan().pins) !== order(snap.pins)) {
    mem.restorePins([...mem.getPlan().pins.filter((p) => !want2.has(p.id)), ...snap.pins.map((p) => now.get(p.id) ?? p)]);
  }
  if (snap.road) mem.setPlan(snap.road, { why: "undo" });
  mem.markSeen();
  if (JSON.stringify(mem.getPlan().lineup ?? null) !== JSON.stringify(snap.lineup)) mem.setLineup(Object.fromEntries(["xi", "bench", "captain", "vice"].map((k) => [k, snap.lineup?.[k] ?? null])));
  setLineups(ctx, I, snap.lus || {});
}
var listening = null;
function listen(ctx) {
  const mem = memOf(ctx);
  if (!mem || listening === mem) return;
  listening = mem;
  mem.onChange((gp, why) => {
    if (!OV?.armed || OV.mem !== mem || OV.entry !== String(gp.entry) || OV.A !== gp.gw) return;
    if (why === "plan" && !gp.pending) land(ctx);
    else if (why === "error") fail(ctx, gp.error);
    else if (why === "heal" && !gp.pending) {
      const ov = OV;
      setTimeout(() => {
        const now = memPlan(ctx);
        if (OV !== ov || !ov.armed || !now || now.pending) return;
        if (now.error) fail(ctx, now.error);
        else if (now.current) land(ctx);
        else fail(ctx, { code: "solver", plain: COPY.unfinished });
      }, 0);
    }
  });
}
function land(ctx, { instant = false } = {}) {
  const ov = OV;
  forgetEdit();
  bump(ctx);
  const P = plan(ctx);
  setFlash(P, changedOf(P, ov.prevP));
  const verdict = instant && ov.plain ? ov.plain : ov.text;
  const line = withForced(verdict(P, ov.prevP), P.forced, ov.prevP?.forced);
  memOf(ctx).markSeen();
  memOf(ctx).claimEdit();
  say(ctx, line, undoOf(ctx, chainSaid(ov.chain.slice(-1)), () => undoNewest(ctx, ov.chain)), "info", null, ov.more ?? [], ov.take?.(P, ov.prevP) ?? null);
}
function changedOf(Q, prev) {
  const gws = [], rows = {}, cards = {};
  for (const w of Q.weeks) {
    const b = weekOf(prev, w.gw);
    const fresh = freshMoves(w, b);
    if (fresh.length) rows[w.gw] = fresh;
    const moved = b ? changedCards(w, b) : [];
    if (moved.length) cards[w.gw] = moved;
    if (weekChanged(w, b)) gws.push(w.gw);
  }
  return { gws, rows, cards };
}
var freshMoves = (w, b) => {
  const key = (m) => `${m.out}>${m.in}`;
  const was = new Set((b?.moves || []).map(key));
  return w.moves.map(key).filter((k) => !was.has(k));
};
var weekChanged = (w, b) => !b || freshMoves(w, b).length > 0 || w.moves.length !== b.moves.length || !sameSet(w.squad, b.squad) || (w.chip ?? null) !== (b.chip ?? null) || w.captain !== b.captain || Math.abs(w.points - b.points) >= 0.05;
var tickWas = (w, was) => {
  const then = was ? fmt.num(was.points) : null;
  return then != null && then !== fmt.num(w.points) ? then : null;
};
function totalShift(tot, v, undo) {
  const before = tot?.before ?? [];
  if (!tot || Math.abs(tot.v - v) < 0.05) return { before, shift: null };
  if (undo && before.length && Math.abs(before.at(-1) - v) < 0.05) return { before: before.slice(0, -1), shift: "back" };
  return { before: [...before, tot.v], shift: v - tot.v };
}
function changedCards(w, b) {
  const was = new Map([...(b?.xi || []).map((id) => [Number(id), "xi"]), ...(b?.bench || []).map((id) => [Number(id), "bench"])]);
  return [...(w.xi || []).map((id) => [Number(id), "xi"]), ...(w.bench || []).map((id) => [Number(id), "bench"])].filter(([id, at]) => was.get(id) !== at).map(([id]) => id);
}
var chainSaid = (chain) => {
  const names = chain.map((c) => c.said).filter(Boolean);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0] ?? "Your edit";
};
function fail(ctx, error) {
  const ov = OV;
  OV = null;
  memOf(ctx).claimEdit();
  bump(ctx);
  const newest = ov.chain?.at(-1);
  const P = plan(ctx);
  const rules = aboutRules(error);
  if (!CLASH || !P.pins.some((p) => p.id === CLASH.id)) CLASH = rules && newest?.id ? { id: newest.id, what: newest.what } : null;
  const c = P ? clashParts(P, CLASH) : { what: null };
  const why = COPY.clashWhy(error?.why, error?.gw);
  const text = !rules ? error?.plain || COPY.unfinished : newest?.id ? COPY.rulesClash(c.what ?? null, CLASH?.what ?? newest.what, why) : COPY.dropClash(newest?.said ?? null, c.what, why);
  const again = rules ? [] : [{ label: "Try again", onClick: () => {
    OV = ov;
    memOf(ctx).heal({ now: true });
    if (!memPlan(ctx)?.pending) return land(ctx);
    checkEdit(ctx, ov);
    bump(ctx);
  } }];
  say(ctx, text, newest ? undoOf(ctx, chainSaid([newest]), () => undoNewest(ctx, ov.chain)) : null, "warn", null, again);
}
var CLASH = null;
function forgetEdit() {
  OV = null;
  CLASH = null;
}
var aboutRules = (error) => !error?.code || error.code === "infeasible" || error.code === "pins";
function clashParts(P, clash = CLASH) {
  const err = P.mem?.error;
  const asks = asksOf(P);
  const by = asks.find((p) => p.id === clash?.id) ?? null;
  const d = err?.dropped?.[0] ?? null;
  const cell = d && composePins(asks, { from: P.A, to: P.end }).cells.get(Number(d.id))?.get(Number(d.gw));
  const held = cell?.want === "in" ? asks.find((p) => p.id === cell.pin) ?? null : null;
  const g = num(err?.gw) ?? num(d?.gw);
  const at = (p) => num(p.gw) === g || ((w) => !!w && w[0] <= g && g <= w[1])(windowOf(p));
  const there = !d && g != null ? asks.filter((p) => p !== by && at(p)) : [];
  const what = d && !(by && held === by) ? `${P.L.name(d.id)} in GW${d.gw}` : there.length ? COPY.choicesAt(g, there.map((p) => plainRule(P, p))) : null;
  const rest = !what && !by ? asks : [];
  const pins = [by, what ? held : null, ...there, ...rest].filter((p, i, xs) => p && xs.indexOf(p) === i && ruleOf(P, p).removable);
  return { what, pins };
}
function clashLine(P, clash = CLASH) {
  const err = P.mem?.error;
  if (!err || P.healing) return null;
  if (!aboutRules(err)) return { text: err.plain || COPY.unfinished, pins: [] };
  const by = asksOf(P).find((p) => p.id === clash?.id) ?? null;
  const { what, pins } = clashParts(P, clash);
  return { text: COPY.rulesStuck(what, by ? rowName(P, by) : null, COPY.clashWhy(err.why, err.gw)), pins };
}
function edit(ctx, { pins = [], drop = [], road = null, from, text = null, what = null, also = null, inPlace = null, ending = null, taken = [], more = [], take = null, hitsMax }) {
  if (!editable(ctx)) {
    toastOf(ctx)(OFFLINE_EDIT, "warn");
    return false;
  }
  const ink = memOf(ctx).inkOf(pins);
  if (ink) {
    toastOf(ctx)(ink.text, "warn");
    return false;
  }
  if (DRY) {
    DRY.got = { pins, drop, inPlace, hitsMax, was: memPlan(ctx)?.pins.map((p) => p.id) ?? [] };
    return true;
  }
  if (lastSay !== PENDING?.toast) lastSay?.();
  lastSay = null;
  listen(ctx);
  const I = info(ctx);
  const f = from ?? I.A;
  const prevP = plan(ctx);
  const cur = ovOf(ctx, I);
  const here = cur ? { ...snapshot(ctx), road: null } : snapshot(ctx);
  const said = what ?? (pins.length ? ruleOf(I, pins[0]).text : null);
  const verdict = text ?? (ending ? withPoints(ctx, what, ending, { total: true }) : null);
  const plain = text || !ending ? null : (Q, prev) => `${what}${ending(Q, prev)}`;
  const chain = [...cur?.chain || [], {
    snap: here,
    id: pins[0]?.id ?? null,
    what: pins.length ? rowName(I, pins[0]) : null,
    said,
    own: { from: f, prevP, text: verdict, plain, more, take }
  }];
  OV = ovFor(ctx, I, chain);
  bump(ctx);
  const mem = memOf(ctx);
  noteRemoved(I, pins.filter((p) => soldBy(p) != null && boughtBy(p) != null).map((p) => ({ gw: Number(p.gw), out: Number(soldBy(p)), in: Number(boughtBy(p)) })), false);
  also?.();
  if (road) mem.offer(road);
  mem.batch(() => {
    if (hitsMax !== void 0) mem.setHitsMax(hitsMax);
    for (const id of drop) if (mem.getPlan().pins.some((p) => p.id === id)) mem.removePin(id);
    for (const p of pins) mem.addPin(p);
    if (inPlace) {
      const now = mem.getPlan().pins, was = here.pins.map((p) => p.id);
      const ordered = inPlaceOf(now, inPlace, was);
      if (ordered.some((p, i) => p !== now[i])) mem.restorePins(ordered);
    }
  });
  OV.armed = true;
  if (!mem.getPlan().pending) landNow(ctx);
  else checkEdit(ctx, OV);
  return true;
}
var landNow = (ctx) => {
  const gp = memPlan(ctx);
  if (gp?.ahead && gp.error) fail(ctx, gp.error);
  else land(ctx, { instant: !gp?.ahead });
};
var pendingSay = (ctx, chain) => sayPending(ctx, chainSaid(chain.slice(-1)), () => undoNewest(ctx, chain));
function undoNewest(ctx, chain) {
  restore(ctx, chain.at(-1).snap);
  const rest = chain.slice(0, -1);
  if (!rest.length) return;
  OV = { ...ovFor(ctx, info(ctx), rest), armed: true };
  bump(ctx);
  if (!memOf(ctx).getPlan().pending) landNow(ctx);
  else pendingSay(ctx, rest);
  return "again";
}
function inPlaceOf(list, id, was) {
  const p = list.find((x) => x.id === id);
  if (!p || !was.includes(id)) return list;
  const rest = list.filter((x) => x !== p);
  const next = was.slice(was.indexOf(id) + 1).find((x) => rest.some((q) => q.id === x));
  const at = next == null ? rest.length : rest.findIndex((q) => q.id === next);
  return [...rest.slice(0, at), p, ...rest.slice(at)];
}
function sideEffects(prev, Q, g, own) {
  const nm = Q.L.name;
  const key = (m) => `${m.out}>${m.in}`;
  const was = weekOf(prev, g)?.moves || [], now = weekOf(Q, g)?.moves || [];
  const gone = was.filter((m) => m.out !== own && !now.some((x) => key(x) === key(m)));
  const came = now.filter((m) => m.out !== own && !was.some((x) => key(x) === key(m)));
  const list = (ms) => ms.map((m) => `${nm(m.out)} \u2192 ${nm(m.in)}`).join(", ");
  return [gone.length ? COPY.replaces(list(gone)) : null, came.length ? COPY.adds(list(came)) : null].filter(Boolean).map((x) => ` \xB7 ${x}`).join("");
}
var hitAfter = (Q, prev, g) => {
  const n = Math.max(0, (weekOf(Q, g)?.hits ?? 0) - (weekOf(prev, g)?.hits ?? 0));
  return n ? ` ${COPY.afterHit(n)}` : "";
};
var hitsLater = (a, b, g) => a.filter((w) => w.gw > g).map((w) => [w.gw, (w.hits ?? 0) - (b.find((x) => x.gw === w.gw)?.hits ?? 0)]).filter(([, n]) => n > 0).map(([x, n]) => `${COPY.hitsIn(n)} in GW${x}`);

// js/m/ahead/core.js
var LONG_MS = 430;
var SWIPE_PX = 90;
var SWIPE_MS = 260;
var GRIP_MS = 150;
var TC_MS = 600;
var EDGE_PX = 16;
var SPENT_PX = 24;
var MINUS = "\u2212";
var afterPaint = (fn) => typeof requestAnimationFrame === "function" && globalThis.document?.visibilityState === "visible" ? requestAnimationFrame(() => setTimeout(fn, 0)) : fn();
var num = (v) => v === null || v === void 0 || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
var ids = (xs) => Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : [];
var sum = (xs) => xs.reduce((s, x) => s + x, 0);
var span = (gws) => COPY.span(gws);
function waitView() {
  return { t: h("span.m-wl", { "aria-hidden": "true" }, h("b"), h("span")), bar: h("span.m-wlb", { "aria-hidden": "true" }, h("i")), key: null };
}
function paintWaitView(v, W) {
  const [b, r] = v.t.children, i = v.bar.firstChild;
  if (b.textContent !== W.word) b.textContent = W.word;
  for (const x of waitLines(W)) {
    r.textContent = x;
    if (v.t.scrollWidth <= v.t.clientWidth + 0.5) break;
  }
  if (W.p != null) {
    i.classList.remove("sweep");
    i.style.width = `${(100 * Math.min(1, W.p)).toFixed(1)}%`;
  } else if (v.key !== W.key) {
    i.classList.remove("sweep");
    i.style.width = "";
    void i.offsetWidth;
    i.classList.add("sweep");
  }
  v.key = W.key;
}
var sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
var clone = (x) => x == null ? x : JSON.parse(JSON.stringify(x));
var capFirst = (t) => t.charAt(0).toUpperCase() + t.slice(1);
function info(ctx) {
  const b = ctx.bundle, d = ctx.data;
  if (!b?.entry || !d?.base) return null;
  const gws = d.horizon, base = (ctx.store.get("memory") ?? memPlan(ctx))?.model ?? null;
  return {
    // reach: the GWs the longest plan reaches; those past gws show locked (Settings → Plan ahead)
    b,
    d,
    A: d.gw,
    gws,
    reach: d.reach ?? gws,
    end: gws[gws.length - 1],
    L: playerLookup({ base: d.base, players: d.players }),
    seeds: d.seeds,
    noise: num(base?.noise) ?? d.noise ?? 0,
    base,
    entry: String(b.entry.id),
    owned: ids(d.base.squad.map((s) => s.id)),
    season: d.base.season
  };
}
var ownFirst = (ctx, gp = memPlan(ctx)) => ctx.presolveOn?.() === false && !!gp?.road?.weeks?.length;
var editable = (ctx) => ctx.store.get("conn")?.state !== "offline" && !!(info(ctx)?.base || ownFirst(ctx));
var lockedFrom = (I, n) => I.reach.slice(n - 1).every((_, i) => (I.b.meta?.locked || []).includes(horizonFeature(n + i)));
var leftBehind = (ctx, I) => {
  const n = ctx.weeks?.();
  return n != null && n !== I.gws.length;
};
var OFFLINE_EDIT = "Edits need a connection. Your plan is unchanged.";
var memOf = (ctx) => attach(ctx);
var memPlan = (ctx) => memOf(ctx)?.getPlan() ?? null;
var RULES_ASK = null;
function openRules(ctx, g) {
  RULES_ASK = g;
  bump(ctx);
}
function takeRulesAsk(g) {
  if (RULES_ASK !== g) return false;
  RULES_ASK = null;
  return true;
}
var FLASH = null;
var viewedGw = (ctx, P) => {
  const g = Number(ctx.store?.get?.("gw"));
  return P?.gws.includes(g) ? g : P?.A ?? ctx.data?.gw;
};
var WHY_SHEET = false;
var whyAct = (g, id) => ({ label: COPY.whyAct, keep: true, onClick: () => TAP_IN?.(g, id) });
var closedOf = (p) => Promise.resolve(p).then((sh) => sh && new Promise((done) => {
  const was = sh.onClose;
  sh.onClose = () => {
    was?.();
    done();
  };
}));
function flashLanding(ctx, prevP, more = {}) {
  bump(ctx);
  const P = plan(ctx);
  const ch = P && prevP ? changedOf(P, prevP) : { gws: [], rows: {}, cards: {} };
  setFlash(P, { ...ch, ...more });
}
var setFlash = (P, x) => {
  FLASH = { ...x, team: P ? `${P.entry}|${P.A}` : null, at: Date.now() };
};
var REMOVED = { key: null, mem: null, by: {} };
var removedBy = (I) => {
  const k = `${I.entry}:${I.A}`, mem = attach();
  if (REMOVED.key !== k || REMOVED.mem !== mem) REMOVED = { key: k, mem, by: {} };
  return REMOVED.by;
};
function noteRemoved(I, ms, on = true) {
  const by = removedBy(I);
  for (const m of ms) {
    const k = `${m.out}>${m.in}`, rest = (by[m.gw] || []).filter((x) => x !== k);
    by[m.gw] = on ? [...rest, k] : rest;
  }
}
var removedAt = (I, g) => new Set(removedBy(I)[g] || []);
var LU = { key: null, local: null, by: {} };
var rev = 0;
var bump = (ctx) => {
  rev++;
  ctx.store.set("aheadRev", rev);
};
var luKey = (I, g) => `fc:ahead:lu:${I.entry}:${g}`;
var laterGws = (I) => I.gws.filter((g) => g > I.A);
var luWindow = (I) => `${I.entry}:${I.gws.join()}`;
var WAIT_KEY = "fc:ahead:pwait";
var NIGHT_KEY = "fc:ahead:pwnight";
var LEARN_KEY = "fc:ahead:learnt";
function showTipsAgain(ctx) {
  ctx.api?.local?.set?.(LEARN_KEY, null);
  ctx.store.set("learnt", Date.now());
}
function lineups(ctx, I) {
  const k = luWindow(I), local = ctx.api.local;
  if (LU.key !== k || LU.local !== local) {
    const old = local.json(luKey(I, I.A));
    if (old && typeof old === "object" && Object.keys(old).every((g) => /^\d+$/.test(g))) {
      for (const [g, lu] of Object.entries(old)) if (Number(g) > I.A && lu && local.get(luKey(I, g)) == null) local.set(luKey(I, g), JSON.stringify(lu));
      local.set(luKey(I, I.A), null);
    }
    LU = { key: k, local, by: Object.fromEntries(laterGws(I).map((g) => [g, local.json(luKey(I, g))]).filter(([, lu]) => lu)) };
  }
  return LU.by;
}
function setLineups(ctx, I, by) {
  const local = ctx.api.local;
  LU = { key: luWindow(I), local, by: Object.fromEntries(laterGws(I).filter((g) => by[g]).map((g) => [g, by[g]])) };
  for (const g of laterGws(I)) local.set(luKey(I, g), LU.by[g] ? JSON.stringify(LU.by[g]) : null);
  bump(ctx);
}
var baseOf = (ctx) => withBank(ctx.data.base, (ctx.store.get("memory") ?? attach()?.getPlan())?.pins);
var roadId = (road) => road?.weeks ?? road;
var DRAFTS = /* @__PURE__ */ new WeakMap();
function roadDraft(ctx, road) {
  let d = DRAFTS.get(roadId(road));
  const keep2 = pairsOf((ctx.store.get("memory") ?? memPlan(ctx))?.pins);
  if (!d) DRAFTS.set(roadId(road), d = roadToDraft(road, ctx.data.base, { players: ctx.data.players, keep: keep2 }));
  return d;
}
var BANKS = /* @__PURE__ */ new WeakMap();
function banksOf(ctx, road) {
  const base = baseOf(ctx);
  let b = BANKS.get(roadId(road));
  if (b?.base !== base) BANKS.set(roadId(road), b = { base, gw: planBanks({ base, players: ctx.data.players, draft: roadDraft(ctx, road), horizon: ctx.data.horizon }) });
  return b.gw;
}
var pairsOf = (pins) => (pins || []).flatMap((p) => p.kind === "sell" && p.in != null ? [{ out: p.player, in: p.in }] : p.kind === "slide" ? [{ out: p.out, in: p.player }] : []);
var pairedMoves = (outs, ins, L, keep2 = []) => pairMoves(outs, ins, L, keep2).filter((m) => m.out !== null && m.in !== null);
function viewOfRoadWeek(w, L, { bank = null, keep: keep2 = [] } = {}) {
  const xi = ids(w.xi), bench = ids(w.bench), hits = num(w.hits) ?? 0;
  const moves = pairedMoves(w.out, w.in, L, keep2);
  return {
    gw: Number(w.gw),
    xi,
    bench,
    squad: [...xi, ...bench],
    captain: num(w.captain),
    vice: num(w.vice),
    chip: w.chip ?? null,
    bank: bank ?? num(w.bank),
    ft: num(w.ft_avail),
    used: num(w.ft_used),
    hits,
    points: weekPoints({ ...w, xi, bench, hits }, L.xp),
    moves,
    in: moves.map((m) => m.in),
    out: moves.map((m) => m.out),
    approx: false
  };
}
function viewOfState(s, L = null, keep2 = []) {
  const moves = L && SQUAD_CHIPS.has(s.chip) ? pairedMoves(s.sold, s.bought, L, keep2) : s.moves.filter((m) => m.ok).map((m) => ({ out: m.out, in: m.in }));
  return {
    gw: s.gw,
    xi: s.xi,
    bench: s.bench,
    squad: s.squad,
    captain: s.captain,
    vice: s.vice,
    chip: s.chip,
    bank: s.bank,
    ft: s.ft,
    used: s.used,
    hits: s.hits,
    points: s.points,
    moves,
    in: moves.map((m) => m.in),
    out: moves.map((m) => m.out),
    approx: true
  };
}
function withLineup(w, lu, L) {
  if (!lu || !["xi", "bench", "captain", "vice"].some((k) => lu[k] != null)) return w;
  const { xi, bench, captain: captain2, vice: vice2 } = applyLineup(w, lu, L);
  if (sameSet(xi, w.xi) && sameList(bench, w.bench) && captain2 === w.captain && vice2 === w.vice) return w;
  const delta = weekPoints({ ...w, xi, bench, captain: captain2 }, L.xp) - weekPoints(w, L.xp);
  return { ...w, xi, bench, captain: captain2, vice: vice2, points: w.points + delta, lineup: true, lineupDelta: delta };
}
var sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
var lineupOf = (ctx, I, gp, g) => gp?.frozenLineups?.[g] ?? (g === I.A ? gp?.lineup : lineups(ctx, I)[g]);
var frozenOf = (P) => P?.mem?.frozen ?? [];
var isFrozen = (P, g) => frozenOf(P).includes(Number(g));
function asYours(ctx, road, gp = memPlan(ctx)) {
  const I = info(ctx);
  return { weeks: (road?.weeks || []).filter((w) => I.gws.includes(Number(w.gw))).map((w) => withLineup(viewOfRoadWeek(w, I.L), lineupOf(ctx, I, gp, Number(w.gw)), I.L)) };
}
var memo = { key: null, P: null };
var SAME_SKIP = /* @__PURE__ */ new Set(["saving", "doc"]);
var sameMemPlan = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => SAME_SKIP.has(k) || a[k] === b[k] || JSON.stringify(a[k]) === JSON.stringify(b[k]));
};
var sameView = (a, b) => a === b || !!a && !!b && String(a.entry) === String(b.entry) && a.A === b.A && a.b?.version === b.b?.version && (a.pins ?? []).map((p) => p.id).sort().join() === (b.pins ?? []).map((p) => p.id).sort().join();
function plan(ctx) {
  const I = info(ctx);
  const gp = ctx.store.get("memory") ?? memPlan(ctx);
  if (!I || !I.base && !ownFirst(ctx, gp)) return null;
  const conn = ctx.store.get("conn")?.state;
  const key = [gp, I.b, I.d, conn, rev];
  if (memo.key && key.every((x, i) => x === memo.key[i])) return memo.P;
  if (memo.key && key.every((x, i) => i === 0 || x === memo.key[i]) && sameMemPlan(gp, memo.key[0])) {
    memo.key = key;
    return memo.P;
  }
  if (gp?.hold && !gp.road?.weeks?.length) return null;
  const ov = ovOf(ctx, I);
  const road = gp?.road?.weeks?.length ? gp.road : I.base;
  const byGw = new Map(road.weeks.map((w) => [Number(w.gw), w]));
  const pins = gp?.pins || [];
  const pendFrom = gp?.pending ? gp.pending.edit?.gw ?? Math.min(I.end, ...pins.map((p) => num(p.gw) ?? I.A)) : null;
  const from = ov?.from ?? pendFrom;
  const approx = new Set(from == null ? [] : I.gws.filter((g) => g >= from));
  const mark = new Set(from != null && approx.has(from) ? [from] : []);
  const made = pairsOf(pins);
  const weeks = I.gws.map((g) => {
    if (!byGw.has(g)) return null;
    const w = viewOfRoadWeek(byGw.get(g), I.L, { bank: banksOf(ctx, road)[g], keep: made });
    w.approx = mark.has(g);
    return withLineup(w, lineupOf(ctx, I, gp, g), I.L);
  }).filter(Boolean);
  const total = sum(weeks.map((w) => w.points));
  const drawn = (list) => list(road).filter((f) => !approx.has(f.gw));
  const forced = drawn((r) => forcedHits(r, I.gws));
  const edited = weeks.filter((w) => w.lineup);
  const lineupGap = edited.length ? { delta: sum(edited.map((w) => w.lineupDelta ?? 0)), gws: edited.map((w) => w.gw) } : null;
  const comparable = !ov && !gp?.pending && (gp?.source !== "yours" || !gp.stale && !!road.objective);
  const bareRoad = bareRef(ctx, I, pins);
  const bare = bareRoad ? new Map(bareRoad.weeks.map((w) => [Number(w.gw), viewOfRoadWeek(w, I.L)])) : null;
  const ok = editable(ctx);
  const P = {
    ...I,
    mem: gp,
    road,
    pins,
    weeks,
    total,
    approx,
    mark,
    forced,
    healing: !!(ov || gp?.pending),
    bare,
    editable: ok,
    why: ok ? "" : OFFLINE_EDIT,
    lineupGap,
    comparable
  };
  memo = { key, P };
  return P;
}
var OPTIONS = /* @__PURE__ */ new Map();
var valuesKey = (I, values) => solvedKey(I.b.version, values);
function bareRef(ctx, I, pins) {
  const own = pins.filter((p) => !derivedPin(p));
  if (!own.length || !specOk(ctx, I)) return null;
  return specRoad(ctx, I, valuesFor(ctx, [], own.map((p) => p.id)));
}
var specOk = (ctx, I) => !!ctx.api?.solve && !leftBehind(ctx, I);
function specRoad(ctx, I, values) {
  const key = valuesKey(I, values);
  const got = OPTIONS.get(key);
  if (got?.weeks) return got;
  if (got || ctx.api.slotBusy?.("spec") || ctx.store.get("conn")?.state === "offline") return null;
  OPTIONS.set(key, "solving");
  solveKept(ctx.api, { entry: Number(I.entry), purpose: "speculative", values }).then((r) => {
    if (r.road) OPTIONS.set(key, r.road);
    else if (r.state === "error") OPTIONS.set(key, "error");
    else {
      OPTIONS.delete(key);
      if (r.state === "superseded") ctx.api.whenFree?.("spec").then(() => {
        if (attach()?.ctx === ctx) bump(ctx);
      });
    }
    bump(ctx);
  }, () => OPTIONS.delete(key));
  return null;
}
var weekOf = (P, g) => P?.weeks?.find((w) => w.gw === Number(g)) ?? null;
var squadBefore = (P, g) => squadInto((x) => weekOf(P, x), g, P.A, P.owned);
var inTeamAt = (P, g) => /* @__PURE__ */ new Set([...squadBefore(P, g), ...weekOf(P, g)?.squad ?? []]);
var placesTaken = (was, now, pos) => {
  const outs = was.filter((x) => !now.includes(x));
  return now.filter((x) => !was.includes(x)).map((x) => {
    const i = Math.max(0, outs.findIndex((o) => pos(o) === pos(x)));
    return [outs.splice(i, 1)[0], x];
  }).filter(([o]) => o != null);
};
function boardMarks(w, after, pos) {
  const sells = new Map(placesTaken([...w.xi, ...w.bench], [...after.xi, ...after.bench], pos).map(([out, id]) => [id, out]));
  return [...placesTaken(w.xi, after.xi, pos), ...placesTaken(w.bench, after.bench, pos)].map(([place, id]) => {
    const sold = sells.get(id) ?? null;
    return { place, id, sold, kind: sold != null ? "in" : w.xi.includes(id) ? "down" : "up" };
  });
}
function pairAsPlaced(w, after, pos, moves) {
  if (!after || moves.length < 2) return moves;
  const by = new Map(boardMarks(w, after, pos).filter((m) => m.kind === "in").map((m) => [Number(m.sold), m.id]));
  const out = moves.map((m) => ({ ...m, in: by.get(Number(m.out)) ?? m.in }));
  const same = (a, b) => a.map((m) => Number(m.in)).sort().join() === b.map((m) => Number(m.in)).sort().join();
  return same(out, moves) ? out : moves;
}
function inFor(P, w) {
  const out = {};
  const squad = w?.chip === "wc" || w?.chip === "fh";
  for (const m of w?.moves || []) out[m.in] = squad ? true : P.L.name(m.out);
  return out;
}
function boughtIn(P, g) {
  const out = {};
  for (const id of weekOf(P, g)?.squad ?? []) {
    if (!P.owned.includes(id)) out[id] = P.weeks.filter((x) => x.gw <= g && x.in.includes(id)).at(-1)?.gw ?? g;
  }
  return out;
}
function draftOf(ctx) {
  const P = plan(ctx);
  let d = roadDraft(ctx, P.road);
  for (const w of P.weeks) if (w.lineup) d = setLineup(d, w.gw, { xi: w.xi, bench: w.bench, captain: w.captain, vice: w.vice });
  return d;
}
function estimate(ctx, draft, from) {
  const I = info(ctx);
  let d = draft;
  for (const g of I.gws) if (g >= from && d.lineups?.[g]) d = setLineup(d, g, null);
  return evaluate({ base: baseOf(ctx), players: I.d.players, draft: d, horizon: I.gws });
}
var INPUTS = /* @__PURE__ */ new WeakMap();
function inputsOf(ctx) {
  const base = baseOf(ctx), model = info(ctx)?.base ?? null;
  let c = INPUTS.get(ctx.data);
  if (!c || c.b !== ctx.bundle || c.base !== base || c.model !== model) INPUTS.set(ctx.data, c = { b: ctx.bundle, base, model, inputs: planInputs(ctx.bundle, { ...ctx.data, base }, model) });
  return c.inputs;
}
var inputs = inputsOf;
var compare2 = (ctx, a, b) => compare(inputs(ctx), a, b);
var ownCount = (ctx, cmp, a, b, g) => counted(inputs(ctx), cmp, a, b, g);
var BASELINES = /* @__PURE__ */ new WeakMap();
function baseline(ctx, from) {
  const P = plan(ctx);
  if (!P) return null;
  let m = BASELINES.get(P);
  if (!m) BASELINES.set(P, m = /* @__PURE__ */ new Map());
  if (!m.has(from)) m.set(from, estimate(ctx, draftOf(ctx), from));
  return m.get(from);
}
var clubCounts = (L, squad) => {
  const n = /* @__PURE__ */ new Map();
  for (const p of squad || []) {
    const c = L.club(p);
    if (c) n.set(c, (n.get(c) || 0) + 1);
  }
  return n;
};
function problemsOf(ctx, ev, from) {
  const I = info(ctx);
  const before = baseline(ctx, from);
  for (const s of ev.gws.filter((x) => x.gw >= from)) {
    const b = before?.gws.find((x) => x.gw === s.gw);
    const bad = s.moves.find((m) => !m.ok);
    if (bad) return [{ code: "move", gw: s.gw, reason: bad.reason }];
    const out = [];
    const was = Math.min(0, b?.bank ?? 0);
    if (s.bank < -1e-9 && s.bank < was - 1e-9) out.push({ code: "budget", gw: s.gw, short: was - s.bank });
    const had = clubCounts(I.L, b?.squad);
    for (const [club, n] of clubCounts(I.L, s.squad)) if (n > MAX_PER_CLUB && n > (had.get(club) ?? 0)) out.push({ code: "club", gw: s.gw, club, count: n });
    if (out.length) return out;
  }
  return [];
}
var problemOf = (ctx, ev, from) => problemsOf(ctx, ev, from)[0] ?? null;
function problemText(ctx, p, name = null) {
  if (!p) return "";
  if (p.code === "budget") return COPY.noFit(name, p.short, p.gw);
  if (p.code === "club") return COPY.club(p.count, p.club, p.gw);
  if (p.code === "kept") {
    const by = /* @__PURE__ */ new Map();
    for (const [id, gw] of p.kept) by.set(gw, [...by.get(gw) ?? [], info(ctx).L.name(id)]);
    return [...by].map(([gw, names]) => COPY.keptIn(names, gw)).join(" ");
  }
  return COPY.infeasible(p.gw);
}
var problemShort = (p) => p?.code === "budget" ? COPY.moneyShort(p.short) : p?.code === "club" ? COPY.clubFull(p.club) : "can't fit";
var flatMoves = (draft) => Object.entries(draft?.moves || {}).flatMap(([g, ms]) => (ms || []).map((m) => ({ gw: Number(g), out: Number(m.out), in: Number(m.in) })));
var withMoves = (draft, list) => {
  const moves = {};
  for (const m of list) if (m.out !== m.in) (moves[m.gw] ||= []).push({ out: m.out, in: m.in });
  return { ...draft, moves };
};
var sameMove = (a, b) => a.gw === b.gw && a.out === b.out && a.in === b.in;
function swapIn(list, m, inn) {
  return list.map((x) => sameMove(x, m) ? { ...x, in: inn } : x.gw > m.gw && x.out === m.in ? { ...x, out: inn } : x).filter((x) => !(!sameMove(x, { ...m, in: inn }) && x.gw > m.gw && x.in === inn));
}
function addMove(ctx, draft, g, out, inn, measure = null) {
  const list = flatMoves(draft);
  const variants = [];
  const same = list.find((x) => x.gw === g && x.out === out);
  if (same) variants.push(swapIn(list, same, inn));
  else {
    const kept = list.filter((x) => !(x.gw >= g && x.in === inn));
    const later = kept.filter((x) => x.gw > g && x.out === out);
    const add = (l) => [...l, { gw: g, out, in: inn }];
    variants.push(add(kept.filter((x) => !later.includes(x))));
    if (later.length) variants.push(add(kept.map((x) => later.includes(x) ? { ...x, out: inn } : x)));
  }
  return bestOf(ctx, variants.map((v) => withMoves(draft, v)), g, measure);
}
function bestOf(ctx, drafts, from, measure = null) {
  return drafts.map((d) => {
    const ev = measure ? measure(d, from) : estimate(ctx, d, from);
    return { draft: d, ev, problem: problemOf(ctx, ev, from) };
  }).sort((a, b) => !!a.problem - !!b.problem || b.ev.total - a.ev.total)[0];
}
var movedFrom = (P, g, own = false) => new Set(P.weeks.filter((w) => w.gw >= g && !squadWeek(w)).flatMap((w) => (w.moves || []).filter((m) => !own || pinOfMove(P, m)).flatMap((m) => [m.out, m.in])));
function dropMove(draft, m) {
  const list = flatMoves(draft);
  return withMoves(draft, list.filter((x) => !sameMove(x, m)).map((x) => x.gw > m.gw && x.out === m.in ? { ...x, out: m.out } : x));
}
var draftMove = (d, x) => flatMoves(d).find((y) => sameMove(y, x));
var dropDrafted = (d, x) => {
  const y = draftMove(d, x);
  return y ? dropMove(d, y) : d;
};
function wishPin(P, id, g) {
  const chip = squadWeek(weekOf(P, g));
  if (chip) return makePin({ id: `wish:${id}`, kind: "wish", chip, player: Number(id), gw: g, label: `${P.L.name(id)} in your GW${g} ${chipName(chip)}`, must: [[id, g, g]] });
  return makePin({
    id: `wish:${id}`,
    kind: "wish",
    player: Number(id),
    gw: g,
    label: `${P.L.name(id)} from GW${g}`,
    must: [[id, g, P.end]],
    excl: g > P.A ? [[id, P.A, g - 1]] : []
  });
}
var isPick = (p) => p?.kind === "wish" && !!p.chip;
var wishDrop = (P, id) => isPick(asksOf(P).find((p) => p.id === `wish:${id}`)) ? [] : [`wish:${id}`];
var picksAt = (P, gws) => asksOf(P).filter((p) => isPick(p) && gws.includes(Number(p.gw)));
var valuesFor = (ctx, extra = [], drop = []) => memOf(ctx).values({ extra, drop });
function solveFor(ctx, extra, purpose, drop = []) {
  const I = info(ctx);
  const go = () => solveKept(ctx.api, { entry: Number(I.entry), purpose, values: valuesFor(ctx, extra, drop) });
  if (ctx.api.SOLVE_CLASS[purpose] !== "user") return go();
  let inner = null, stopped = false;
  const p = memOf(ctx).settled().then(() => stopped ? { key: null, state: "cancelled", road: null, error: null } : inner = go());
  p.cancel = () => {
    stopped = true;
    inner?.cancel?.();
  };
  return p;
}
function baked(ctx, extra = [], drop = [], P = plan(ctx)) {
  const c = composePins([...P.pins.filter((p) => !drop.includes(p.id)), ...extra], { from: P.A, to: P.end });
  return findRoad(P.base, c, P.gws);
}

export {
  litOf,
  weekBest,
  litShown,
  rollOnly,
  planBack,
  decksOf,
  benchOnly,
  takesBack,
  singleMove,
  placeDealt,
  placePages,
  placeBuys,
  placeLine,
  multiMove,
  placeSplit,
  lineMoves,
  placeOrder,
  placeFirst,
  slotsBeside,
  failedWords,
  noteOf,
  plansOf,
  chipShown,
  chipNumber,
  weekRollOf,
  plansWait,
  weekWait,
  lineNotices,
  planWeeks,
  countedAfter,
  squadChanges,
  litEdges,
  weekKey,
  weekSettled,
  settlesAt,
  choices_exports,
  planOfRoad,
  planBaseline,
  takenBy,
  forkValues,
  forkFlights,
  resetForks,
  forks_exports,
  rulesOf,
  listedRules,
  oneLook,
  headScale,
  reachOf,
  TAB_MIN,
  EDGE_MIN,
  PLATE_MIN,
  boxesMeet,
  pitchLeast,
  mount,
  shirtOf,
  clearGain,
  plPays,
  emptyHead,
  factsWords,
  itbWords,
  rollFt,
  weekFacts,
  chipsAsked,
  chipBests,
  chipBack,
  chipsAvail,
  squadWeek,
  chipGain,
  chipWeekGain,
  xpShown,
  chipStates,
  PREP_TIMING,
  chipPreps,
  pieces_exports,
  buyPlan,
  saleOptions,
  saleBuy,
  bringIn,
  choosing,
  stopChoosing,
  replaceable,
  chooseOnPitch,
  replaceWith,
  wishSolve,
  bringInTakes,
  removesText,
  holdBuy,
  weekWith,
  inWords,
  buyProblem,
  fitsLater,
  bringInFrom,
  sayBuyProblem,
  solvesRound,
  resetPlan,
  planHasYours,
  hitsChoices,
  setHitsMaxWithUndo,
  chipWeek,
  gwMode,
  watchOf,
  watchView,
  deadlineInfo,
  isLive,
  fplSubs,
  fplSets,
  inkAt,
  sellWeek,
  liftsLive,
  initials,
  reroute,
  suggestionsOf,
  listedOf,
  askPlace,
  presolveTaps,
  stopAhead,
  owedAt,
  rootStill,
  extraWeek,
  repicks,
  addYours,
  OWN_ALTS,
  ownAltsOf,
  tiedBuy,
  cheaperFirst,
  otherUseOf,
  whenOf,
  moveTo,
  pairMovesOf,
  planTake,
  takenKeep,
  addPlan,
  yoursTakenBack,
  rollingAt,
  pinOfMove,
  movesInOrder,
  fundingOf,
  removeMove,
  rowGains,
  onBase,
  whenOnBase,
  ifMisses,
  whyFacts,
  presolve_exports,
  benchedBuys,
  resetLineup,
  chipEdit,
  chipPlan,
  chipOff,
  useChip,
  endingOf,
  sellFrom,
  sellAny,
  veto,
  want,
  keepPin,
  keep,
  never,
  scopeLabels,
  rescope,
  buyCandidates,
  asksOf,
  pinsOf,
  windowOf,
  clashing,
  ruleOf,
  pinOf,
  barred,
  keptFrom,
  keptCells,
  barringRules,
  barringRule,
  sellOut,
  liftAsk,
  removeRule,
  captain,
  vice,
  subLineup,
  sub,
  subChoices,
  plannerFor,
  pendingTick,
  pendingAgain,
  sayCheer,
  changedOf,
  weekChanged,
  tickWas,
  totalShift,
  changedCards,
  clashParts,
  clashLine,
  inPlaceOf,
  sideEffects,
  afterPaint,
  waitView,
  paintWaitView,
  editable,
  openRules,
  showTipsAgain,
  baseOf,
  viewOfRoadWeek,
  frozenOf,
  isFrozen,
  asYours,
  plan,
  weekOf,
  squadBefore,
  inTeamAt,
  inFor,
  boughtIn,
  draftOf,
  estimate,
  inputsOf,
  compare2 as compare,
  baseline,
  problemsOf,
  problemOf,
  problemText,
  problemShort,
  addMove,
  dropMove,
  wishPin,
  isPick,
  valuesFor,
  solveFor,
  baked,
  core_exports,
  ahead_exports
};
