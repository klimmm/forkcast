// ahead.js: the screen: mount

import * as E from '../../plan/engine.js';
import { h, svg, fmt, fill, append, toast, toastRegion, chipName, plural, icon, statusInfo, roving, reduceMotion, holdTouch, flick, focusKey, refocus, xpNum, xpGain, shownGain } from '../../ui.js';
import { subOrder, fitFixtures } from '../../plan/pitch.js';
import { COPY, captainGap, priceMorning, pricePlate, gwFlags, liveCheck, clockText, stepShare } from '../calls.js';
import { rollKeeps } from '../memory.js';
import { EDGE_PX, FLASH, GRIP_MS, LEARN_KEY, LONG_MS, MINUS, NIGHT_KEY, SPENT_PX, SWIPE_MS, SWIPE_PX, TC_MS, WAIT_KEY, boughtIn, capFirst, closedOf, clubCounts, compare, draftOf, dropMove, editable, flatMoves, ids, inFor, info, inputs, lockedFrom, memOf, memPlan, num, paintWaitView, plan, removedAt, span, squadBefore, takeRulesAsk, viewedGw, waitView, weekOf } from './core.js';
import { aboutRules, asksOf, benchedBuys, captain, clashLine, clashParts, driftSay, edit, keep, pendingAgain, pendingTick, removeRule, rescope, resetLineup, ruleOf, sayCheer, scopeLabels, sub, subChoices, tickWas, toastOf, totalShift, useChip, veto, vice, vsPrev } from './edits.js';
import { PLACE_SLOTS, SQUAD_CHIPS, approxAt, asTaken, askPlace, byGain, choiceVs, countedAfter, decksOf, failedWords, forkKey, lineMoves, lineNotices, listedOf, litOf, litShown, mineAny, multiMove, noteOf, placeBuys, placeFirst, placeOrder, placePages, placeSplit, planBack, planBaseline, planWeeks, plansOf, rollOnly, settleDue, singleMove, slotsBeside, squadChanges, takesBack, weekKey, weekRollOf, weekSettled, weekWait, yoursAt } from './plans.js';
import { addPlan, fundingOf, moveTo, movesInOrder, pairOf, pinOfMove, planTake, presolveTaps, removeMove, rollingAt, rowGains, takenKeep, weekTaps, whenOf, whenOnBase, whyFacts } from './presolve.js';
import { choosing, deadlineInfo, fplOf, fplSets, freedBy, gwMode, initials, inkAt, isLive, liftsLive, planHasYours, resetPlan, rowName, watchOf, watchView } from './buys.js';
import { chipBack, chipWeekGain, chipsAvail, clearGain, emptyHead, factsWords, itbWords, plPays, rollFt, shirtOf, squadWeek, weekFacts, xpShown } from './pieces.js';
import { headPart } from './screen-head.js';
import { linePart } from './screen-line.js';
import { decksPart } from './screen-decks.js';
import { placePart } from './screen-place.js';
import { weekPart } from './screen-week.js';
import { rowsPart } from './screen-rows.js';
import { pitchPart } from './screen-pitch.js';
import { mountSolveLog } from './solvelog.js';
import { touchPart } from './screen-touch.js';
import { ticketPart } from './screen-ticket.js';

// ================================================================ THE SCREEN (§5.5)

/** The mounted screen's own week switch (mount's setGw), for an Undo that shows where it changed the plan (undoOf);
 *  null with no screen (the node tests: the address alone). */
export let GO_GW = null;
/** …and its tap on a player of GW g (mount's tapIn: his transfer's Why sheet if a buy, else his card), for a take's
 *  toast's Why (whyAct). */
export let TAP_IN = null;

/** Your rules as the Week sheet lists them (RULES_V2 §4): every ask, newest first. */
export const rulesOf = (P) => [...asksOf(P)].reverse();
/** The rules the Week sheet's "Your rules" lists: every ask but the ones it already shows as rows (a sale, slide or
 *  Wish is a transfer of yours; a chip is its GW's tile; an older plan's hits cap is not listed; a week's Roll, a
 *  plan's +, is, with its ×: owner, 2026-10-13), plus a sale, slide or Wish the plan makes no transfer for (with its ×:
 *  else a rule no plan could keep would show nowhere). `g`: the viewed week, whose block shows the rows (a later week's
 *  sale is listed too); null: every week's. */
const ROW_KINDS = new Set(['sell', 'slide', 'wish', 'hits', 'chip']);
export const MOVE_KINDS = new Set(['sell', 'slide', 'wish']);
export const listedRules = (P, g = null) => {
  // a move the viewed week or an earlier one shows as its own row and tile is not listed again; one in a later week
  // still is
  const made = new Set(P.weeks.filter((w) => g == null || w.gw <= g).flatMap((w) => (w.moves || []).map((m) => pinOfMove(P, { ...m, gw: w.gw })?.id)).filter(Boolean));
  return rulesOf(P).filter((p) => !ROW_KINDS.has(p.kind) || (MOVE_KINDS.has(p.kind) && !made.has(p.id)));
};

/** The chips your pins plan: [{gw, chip}] (memory.pinChip pins; 'none' lifts a GW's chip). */
const CHIP_PINS = new WeakMap();  // per pin list (the preparations ask for every chip × GW)
export const chipPins = (P) => {
  if (!CHIP_PINS.has(P.pins)) CHIP_PINS.set(P.pins, P.pins.flatMap((p) => Object.entries(p.chips || {}).map(([g, c]) => ({ gw: Number(g), chip: c }))).filter((x) => E.CHIPS.includes(x.chip)));
  return CHIP_PINS.get(P.pins);
};


/** The round controls' glyphs (× remove, + add): drawn, never text (no font of their own). */
export const glyph = (k) => svg('svg', { viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': 'true', class: 'ah-glyph' },
  svg('path', { d: k === '+' ? 'M6 1.5v9M1.5 6h9' : 'M2.5 2.5l7 7M9.5 2.5l-7 7', fill: 'none', stroke: 'currentColor', 'stroke-width': k === '+' ? 1.8 : 1.6, 'stroke-linecap': 'round' }));

/** A number never cut on the pitch (a place header's: `v` its number's box inside `el`): its "xP" first (as a plate's:
 *  fitFixtures), then its chip and −4 marks (its label and its place keep them), then a smaller size (m-ahead.css .noxp
 *  .nomark .tight). A token beside the goal the same, its words' boxes too, its name among them (`v` a list:
 *  renderDecks). A plate the same by its own `steps` (PLATE_TRIMS), `v` then whether it is over its room. → whether it
 *  fits */
/** A place's note's words, a hyphened name kept on one line (.ah-nw: "Calvert-/Lewin" in a card-wide note, a name
 *  broken; fitBlocks then makes room for it) → [text | span] */
export const whole = (t) => String(t).split(/(\S*-\S*)/).map((x, i) => (i % 2 ? h('span.ah-nw', null, x) : x));
export const fitNum = (el, v, steps = ['noxp', 'nomark', 'tight']) => {
  const over = typeof v === 'function' ? v : () => [v].flat().some((x) => !!x && x.scrollWidth > x.clientWidth + 0.5);
  el.classList.remove(...steps);
  for (const k of steps) if (over()) el.classList.add(k);
  return !over();
};
/** One look across `els` (a place's dealt headers; a pitch's plates and its tokens beside the goal): each class of `ks`
 *  ("noxp", "tight": fitNum's trims) one of them took, every one takes (a place's: design_marks/design.md §3; the
 *  pitch's "xP", all or none: owner, 2026-10-26; renderDecks). → the classes taken */
export const oneLook = (els, ks) => {
  const on = ks.filter((k) => els.some((x) => x.classList.contains(k)));
  for (const x of els) x.classList.add(...on);
  return on;
};
/** The least type of a place's header, px: its last trim (headScale) goes no smaller. */
export const HEAD_LEAST = 8;
/** A place's header's trims (fitNum's), before its type gets smaller (scaleHeads): a plate's, then its spacing (.snug:
 *  its padding and gap, its take's word's padding), which at 320 wide frees the 2 px "−0.4" lacked beside "Swap" at its
 *  least type. */
export const HEAD_TRIMS = ['noxp', 'nomark', 'tight', 'snug'];
/** A place's header's number, never cut; "planning…" in its place gives way at its end, as a plate's (m-ahead.css
 *  .ah-pv.wait), never trimming the place's headers. */
export const HEAD_NUM = '.ah-pv:not(.wait)';
/** A place's header still over its card after its own trims (fitNum's): the scale of its whole type, its number and its
 *  take's word alike (m-ahead.css --ph-k), that fits `need` px of that type in `room` px, never under HEAD_LEAST in its
 *  smallest type (`px`, at scale 1); 1 where it fits (owner, 2026-10-25: "never its number nor its Swap"). Pure. */
export const headScale = (need, room, px) => (need <= room + 0.5 ? 1 : Math.max(HEAD_LEAST / px, room / need));
/** A GW's deadline (epoch seconds): the bundle's per-GW meta.deadlines, else GW A's meta.deadline_epoch. */
/** A plate's own trims, each never hiding who comes in (owner, 2026-10-25: each plate fits on its own; cramped quiet
 *  plates become number-only handles, .only; the black best always shows its full name; a name still too long is
 *  shortened like the cards'; no shirts): its "xP", then its chip and −4 marks (its place keeps them), then a smaller
 *  type (m-ahead.css .ah-sp.noxp .nomark .tight; fitNum, renderDecks). Its "xP" is off on all or none beside the goal
 *  (owner, 2026-10-26; renderDecks' oneXp). */
export const PLATE_TRIMS = ['noxp', 'nomark', 'tight'];
/** The week's status's trims beside the goal (renderDecks fits): its own spacing first (.snug), then a token's. */
export const ST_TRIMS = ['snug', 'noxp', 'nomark', 'tight'];
/** The least of a buy's name a shortened plate shows (m-ahead.css .ah-sp.cut: a few letters and "…", as the cards'
 *  "Calvert-L..."), in its type's ems; under it the best shows its number alone, ink (.only: renderDecks). */
export const NAME_LEAST = 3;
export const deadlineOf = (b, A, g) => b?.meta?.deadlines?.[g] ?? (g === A ? b?.meta?.deadline_epoch : null) ?? null;
/** The countdown, only under 7 days (DESIGN_V2 §3.2; the header line puts it after a " · "). */
const countdown = (info) => (info.left > 0 && info.left < 7 * 86400e3 ? info.text : '');
/** …its parts (the GW line's .ah-dl): the abbreviation shown, its words spoken after a comma (the " · " is CSS, so
 *  VoiceOver would run "Sat 13:00" into "5d 17h"). */
export const countdownParts = (info) => (countdown(info) ? [h('span', { 'aria-hidden': 'true' }, countdown(info)), h('span.sr-only', null, `, ${info.said}`)] : []);

/** A hold's progress at the finger (owner, 2026-10-22): a ring round the point (x, y) filling over `ms` (m-ahead.css
 *  .ah-hold), `word` over it, what the hold plays ("TC", "BB"); its caller stops it when the hold fires, or the finger
 *  lifts or moves first, so a ring that hasn't filled never acts. Nothing without a page (the node tests). → stop() */
const holdFill = (x, y, ms, word = null) => {
  if (!globalThis.document?.body) return () => {};
  const n = h('div.ah-hold', { 'aria-hidden': 'true', style: { left: `${x}px`, top: `${y}px`, '--ms': `${ms}ms` } },
    svg('svg', { viewBox: '0 0 56 56' }, svg('circle', { class: 'tr', cx: 28, cy: 28, r: 25 }), svg('circle', { class: 'fl', cx: 28, cy: 28, r: 25, pathLength: 100 })),
    word ? h('span.ah-holdw', null, word) : null);
  document.body.append(n);
  return () => n.remove();
};

/** How far up a target over card c, `m` px wider on each side, may reach (owner, 2026-10-20): to 44 px over his card,
 *  only over free turf, never onto another card, a corner pill or a token (`walls`), nor above the pitch (the keeper's:
 *  the week line is over it). c and walls are boxes on the pitch ({n, x, y, w, h}: mount's cardBoxes). → its top, on
 *  the pitch */
export const reachOf = (c, walls, m = 2) => Math.max(0, c.y - 44, ...walls.filter((q) => q.n !== c.n && q.x < c.x + c.w + m && q.x + q.w > c.x - m && q.y < c.y).map((q) => q.y + q.h + 2));
/** The least room over a card for a tab (its one line) and for edges (their slivers), px; the most of the gap beside a
 *  card a sliver of his took each side once, px . */
export const TAB_MIN = 16, EDGE_MIN = 6;
/** The least room over a card for a plate (renderDecks: its one line at its .tight 10 px type), px; under it its number
 *  alone (.only), as short as the room. */
export const PLATE_MIN = 14;
/** Boxes a and b on the pitch ({x, y, w, h}) meet, b taken `down` px taller (a target under it). */
export const boxesMeet = (a, b, down = 0) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h + down && b.y < a.y + a.h;
/** The least height of the pitch (m-ahead.css .ah-pitch, the bench inside it) at which no card meets another row's nor
 *  a sub's label (his order, "1"; the keeper's none: .pm-blp): the bench's chrome (--pm-chrome), five cards at the
 *  tile's floor (--pm-hlo: four rows and the bench), a plate more in each row (a fixture on a line of its own where the
 *  tile can't flatten: every row's, so the pitch is one height every week) and the forwards' foot (--pm-foot). At that
 *  height or more the rows' gaps (--pm-gaps) are never under 0, so no row drops to its ROW_TOP share (--pm-floor) and
 *  the forwards' cards end --pm-foot over the field's foot, less a sub's two-line card's plate: over the bench's panel.
 *  Each in px, as it resolves on the pitch (fitPitch) → px */
export const pitchLeast = ({ chrome, hlo, plate, foot }) => chrome + 5 * hlo + 4 * plate + foot;
/** CSS lengths as they resolve inside `host` (the pitch's tokens, m-ahead.css: 'var(--pm-tab)', …), each the height of
 *  an absolutely placed probe there, read in one layout → [px, …] */
export const cssPx = (host, ...lengths) => {
  const probes = lengths.map((v) => h('span', { style: { position: 'absolute', height: v } }));
  host.append(...probes);
  const px = probes.map((p) => p.getBoundingClientRect().height);
  for (const p of probes) p.remove();
  return px;
};

export function mount(el, ctx) {
  // (?solves=1 only: the fork solves in words, and the server's planning of a new team while it bakes)
  mountSolveLog(ctx);
  // the parts' view of this function's scope (live getters) and the parts' functions, by their own names
  const V = {
    get ADD_HOLD_MS() { return ADD_HOLD_MS; },
    get COPY_FPL_TEAM() { return COPY_FPL_TEAM; },
    get FACTS_PROBE() { return FACTS_PROBE; },
    get FLY_EASE() { return FLY_EASE; },
    get FLY_MS() { return FLY_MS; },
    get HINTS() { return HINTS; },
    get LAND_MAX() { return LAND_MAX; },
    get LATE_S() { return LATE_S; },
    get LIFT_MS() { return LIFT_MS; },
    get LINE_LEAST() { return LINE_LEAST; },
    get PLATES() { return PLATES; },
    get PLATE_KEY() { return PLATE_KEY; },
    get S() { return S; },
    get TOTAL_MS() { return TOTAL_MS; },
    get WAIT_DIM_MS() { return WAIT_DIM_MS; },
    get addOnce() { return addOnce; },
    get ap0() { return ap0; },
    get armbandSheet() { return armbandSheet; },
    get asksHost() { return asksHost; },
    get avatar() { return avatar; },
    get bankWarn() { return bankWarn; },
    get barNode() { return barNode; },
    get boxOf() { return boxOf; },
    get bringDoor() { return bringDoor; },
    get bsep() { return bsep; },
    get cardBoxes() { return cardBoxes; },
    get cardIn() { return cardIn; },
    get changeRow() { return changeRow; },
    get cheerEl() { return cheerEl; },
    get chipsDoor() { return chipsDoor; },
    get chipsHint() { return chipsHint; },
    get clashRow() { return clashRow; },
    get closePlace() { return closePlace; },
    get covered() { return covered; },
    get ctl() { return ctl; },
    get ctx() { return ctx; },
    get decks() { return decks; },
    get dlEl() { return dlEl; },
    get doorStubs() { return doorStubs; },
    get drawPlace() { return drawPlace; },
    get drawWeek() { return drawWeek; },
    get edgeTicks() { return edgeTicks; },
    get tabAt() { return tabAt; },
    get el() { return el; },
    get entryKey() { return entryKey; },
    get factSpans() { return factSpans; },
    get fitDrawn() { return fitDrawn; }, set fitDrawn(v) { fitDrawn = v; },
    get fitFacts() { return fitFacts; },
    get fitKey() { return fitKey; }, set fitKey(v) { fitKey = v; },
    get forecastLine() { return forecastLine; },
    get frozenAt() { return frozenAt; },
    get ftAfter() { return ftAfter; },
    get fitPitch() { return fitPitch; },
    get gainOf() { return gainOf; },
    get gwNow() { return gwNow; },
    get gwline() { return gwline; },
    get head() { return head; },
    get hint() { return hint; },
    get hitSaid() { return hitSaid; },
    get hitTag() { return hitTag; },
    get itbNode() { return itbNode; },
    get keepGwLine() { return keepGwLine; },
    get keepNight() { return keepNight; },
    get labelWalls() { return labelWalls; },
    get landMotion() { return landMotion; },
    get learn() { return learn; },
    get litPays() { return litPays; },
    get mountHere() { return mountHere; },
    get movesTitle() { return movesTitle; },
    get notAct() { return notAct; },
    get noteRow() { return noteRow; },
    get noticeSaid() { return noticeSaid; },
    get numOf() { return numOf; },
    get numParts() { return numParts; },
    get numSaid() { return numSaid; },
    get openPlace() { return openPlace; },
    get openPlanWhy() { return openPlanWhy; },
    get openWeek() { return openWeek; },
    get openWhy() { return openWhy; },
    get paintWait() { return paintWait; },
    get waitNow() { return waitNow; },
    get pdBtn() { return pdBtn; },
    get pitchHost() { return pitchHost; },
    get plNumSaid() { return plNumSaid; },
    get placeHint() { return placeHint; },
    get placeLink() { return placeLink; },
    get planKey() { return planKey; },
    get planRow() { return planRow; },
    get planSaid() { return planSaid; },
    get plansHeading() { return plansHeading; },
    get plansVs() { return plansVs; },
    get plateOf() { return plateOf; },
    get priceDrift() { return priceDrift; },
    get rail() { return rail; },
    get reachLabels() { return reachLabels; },
    get redeck() { return redeck; },
    get remProbe() { return remProbe; },
    get render() { return render; },
    get renderDecks() { return renderDecks; },
    get renderLine() { return renderLine; },
    get renderPdBtn() { return renderPdBtn; },
    get renderPitch() { return renderPitch; },
    get paintChoosing() { return paintChoosing; },
    get paintBoard() { return paintBoard; },
    get renderRail() { return renderRail; },
    get renderTotal() { return renderTotal; },
    get replanning() { return replanning; },
    get roadOfEv() { return roadOfEv; },
    get rollFacts() { return rollFacts; },
    get rollOf() { return rollOf; },
    get rolling() { return rolling; },
    get ruleSheet() { return ruleSheet; },
    get rowTies() { return rowTies; },
    get rsBtn() { return rsBtn; },
    get sayCarried() { return sayCarried; },
    get sayDrift() { return sayDrift; },
    get sayNight() { return sayNight; },
    get schedule() { return schedule; },
    get setBtn() { return setBtn; },
    get flag() { return flag; },
    get stand() { return stand; },
    get stack() { return stack; },
    get paintTicket() { return paintTicket; },
    get adviceOf() { return adviceOf; },
    get firstCard() { return firstCard; },
    get sizeTitle() { return sizeTitle; },
    get atEdge() { return atEdge; },
    get holdStack() { return holdStack; },
    get spanOf() { return spanOf; },
    get inkAt() { return inkAt; },
    get setGw() { return setGw; },
    get settle() { return settle; },
    get shareWeek() { return shareWeek; },
    get shell() { return shell; },
    get sideRoom() { return sideRoom; },
    get slot() { return slot; },
    get spend() { return spend; },
    get letGo() { return letGo; },
    get spent() { return spent; },
    get statusLine() { return statusLine; },
    get strip() { return strip; },
    get subSheet() { return subSheet; },
    get takeFrom() { return takeFrom; },
    get tapIn() { return tapIn; },
    get textOf() { return textOf; },
    get ticks() { return ticks; },
    get toastGone() { return toastGone; },
    get topRow() { return topRow; },
    get totLine() { return totLine; },
    get totSaid() { return totSaid; },
    get totalEl() { return totalEl; },
    get uncovered() { return uncovered; },
    get vetoBack() { return vetoBack; },
    get vetoFromWhy() { return vetoFromWhy; },
    get waitClock() { return waitClock; },
    get waitSaid() { return waitSaid; },
    get waitSig() { return waitSig; },
    get waitV() { return waitV; },
    get waitWatch() { return waitWatch; },
    get waited() { return waited; },
    get weekGain() { return weekGain; },
    get weekLead() { return weekLead; },
    get weekModel() { return weekModel; },
    get weekPending() { return weekPending; },
    get weekRoll() { return weekRoll; },
    get weekSheet() { return weekSheet; },
    get whyMove() { return whyMove; },
    get whyPart() { return whyPart; },
    get whySub() { return whySub; },
    get wireMoveRow() { return wireMoveRow; },
    get xferRow() { return xferRow; },
  };
  const { pageName, resetTap, resetSheet, learn, gwNow, setGw, outerH, fitBlock, fitHead, fitPitch, redeck, schedule, covered, paintAvatar, renderHead, renderGwLine, paintDeadline, replanning, paintPlanStatus, tick, hosts, focusedKeys, keepFocus, renderPair, render, renderBaking, renderRules, ruleSheet, clearAll, driftRoom, owes, priceDrift, heldOrder, renderWeek, waitNow, paintWait, paintDim, weekModel, waited, clockShown, waitClock, plansHeading } = headPart(V);
  const { openWeek, renderLine, fitFacts, weekGain, boxOf, cardBoxes, reachLabels, labelWalls, sideRoom, cardIn, entryKey, topRow } = linePart(V);
  const { adviceOf, bindStack, firstCard, holdStack, paintTicket, sizeTitle } = ticketPart(V);
  const { renderDecks, spanOf, sheetFollows, swapPlate, placeLabel, statusLine, tokensOf, numParts, takeFrom, landMotion, land, openPlace, placeKey, closePlace } = decksPart(V);
  const { drawPlace, planLine, fitLine, scaleHeads, fitBlocks, stepPlace, shadeTap, weekSheet } = placePart(V);
  const { drawWeek, clashRow, noteRow, sayDrift, forecastLine, waitSig, waitWatch, keepNight, sayNight, sayCarried, barNode, dotted, bsep, textOf, bankWarn, bankLead, weekLead, roadOfEv, movesTitle, openWhy, deckOf, placeLink, whenFree, placeAct, whyTaps, whyActs, notOf, vetoBack, notAct, whenSheet, gainOf, whySub, numOf, numSaid, plNumSaid, hitTag, hitSaid, plansVs, whyPart, rowTies } = weekPart(V);
  const { moveX, xferRow, factSpans, itbNode, rollFacts, door, openChips, chipsDoor, bringDoor, doorStubs, changeRow, priceOf, addOnce, litPays, planKey, planSaid, takePlan, planRow, openPlanWhy, ftAfter, weekRoll, rollOf, shareWeek, moveGain, moveNum, weekPending, rollPending, rolling, whyMove, tapIn } = rowsPart(V);
  const { paintBoard, paintChoosing, pitchProps, renderPitch, mountHere, placeHint, frozenAt, renderRail, fitRail, edgeTicks, tabAt, toastOver, renderTotal, totalNum, keepGwLine, sellOf, hasField, plateOk, plateOf, renderPdBtn, playerDataSheet } = pitchPart(V);
  const { spend, letGo, atEdge, tickAt, railEnd, unfill, benchBare, swipeGw, pitchEnd, settle, releaseSoon, gesture, cancelGesture, dragBadge, dropBadge, armTo, armbandSheet, subSheet, lift, dragTo, dropOn, pitchChip, liftShirt, wireMoveRow, vetoRow, vetoFromWhy, pressed, stray, lifted, spentUp, spentDown, spentClick } = touchPart(V);
  el.classList.add('ah');
  // the legacy suggestions' hide (v1.3.27 or earlier: one for every team), let go
  ctx.api?.local?.set?.('fc:ahead:sugg', null);
  // learnt: the first-use hints done (LEARN_KEY: learn)
  const learntNow = ctx.api?.local?.json?.(LEARN_KEY);
  const S = { drag: null, flashAt: 0, queued: false, live: isLive(ctx), down: new Set(), held: false, week: null,
    learnt: new Set(Array.isArray(learntNow) ? learntNow : []),
    // the wait now (waitNow): the plan's solve and the viewed week's checks as one, {t0: its first solve's start (ms),
    // plan: a plan solve in it, max: the most its bar showed}
    waitAll: null };
  // the header is the team's name, centred, and the avatar; the page is named for assistive tech (a visually hidden h1,
  // the header's label) and the browser tab by the team and the app ("Raketa · Forkcast"): the one screen has no name
  // of its own (owner, 2026-10-07)
  const head = h('header.ah-head', { 'aria-label': 'Forkcast' });
  const avatar = h('button.ah-avatar', { type: 'button', onClick: () => ctx.openSheet('you') });
  // the header's left column, the avatar's mirror: the Settings gear, the plan's settings at once (owner, 2026-10-29;
  // Help is the You sheet's row). A toast stops short of it, as of the avatar (m.css #toasts)
  const setBtn = h('button.ah-set', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.settingsTitle, onClick: () => ctx.openSheet('you', 'settings') }, icon('settings', { size: 22 }));
  // the header's second line, under the team's name (owner, 2026-10-22): two facts on one line: GW A's deadline,
  // whatever GW is viewed ("Deadline Sat 13:00 · 4d 17h": tick() runs the countdown), and the window's total where it
  // fits (keepGwLine; renderTotal: "GW6–9 218.9"; an edit's change for a few seconds, "229.0 (+10.1)"; shimmering while
  // the full plan checks it; totalEl says it to assistive tech)
  const dlEl = h('span.ah-dlpart');
  const totLine = h('span.ah-tot.m-num', { 'aria-hidden': 'true' });
  const gwline = h('p.ah-gwline.m-num', null, dlEl, totLine);
  const slot = h('div', { dataset: { bannerSlot: '' } });
  // FPL's Pick Team: one control row under the header: the GW switcher, each GW with its points and the viewed one
  // selected, the row's whole width. Player data (FPL's "Opponent ⌄": what the second plate shows, playerDataSheet) is
  // a small button on the pitch's top-right corner, beside the goal (mountHere).
  // To assistive tech a radio group "Gameweek", each GW a radio named by its full label (renderRail); keys the radio
  // group's (ui.roving: one Tab stop, the viewed GW; arrows wrap, Home / End), a key moving the week as a tap on its
  // tile does
  const hint = h('div.ah-hint', { 'aria-hidden': 'true' });
  const ticks = roving(h('div.ah-ticks', { role: 'radiogroup', 'aria-label': 'Gameweek' }), { pick: (b) => setGw(Number(b.dataset.gw)) });
  const rail = h('div.ah-rail', null, h('span.ah-thumb', { 'aria-hidden': 'true' }), ticks);
  const totalEl = h('span.ah-total.sr-only');  // the window's total, the switcher's accessible summary
  // the total's change as it shows (renderTotal), said politely: the line drawing it is hidden from assistive tech, and
  // an edit that lands at once says no number in its toast (B24)
  const totSaid = h('span.sr-only', { 'aria-live': 'polite' });
  // the wait line's start and end said politely ("busy" that simply vanishes reads as done to the eye alone;
  // paintWait), never its every second
  const waitSaid = h('span.sr-only', { role: 'status' }), waitV = waitView();
  const railWrap = h('nav.ah-railwrap', { 'aria-label': 'Gameweeks', dataset: { nopull: '' } }, rail, totalEl, totSaid, waitSaid);
  const pdBtn = h('button.ah-pp.ah-pdbtn', { type: 'button', 'aria-haspopup': 'dialog', onClick: () => { playerDataSheet(); } });
  // "↺ Reset": the pitch's one take-back, in its top-left corner with the week's own choices (one corner for acts on
  // your plan, the other for what you see: owner, 2026-10-29), under the corner's tokens (placePills), only while
  // something of yours is there to take back (renderPitch, S.reset): the viewed GW's lineup ("Reset lineup":
  // resetLineup), your plan's transfers, chips and rules ("Reset plan": planHasYours, resetPlan; owner, 2026-10-21);
  // one tap where one applies (toast, Undo); where both do, "Reset ⌄" and its tap the choice (resetSheet; the wider
  // wipe never the one a tap lands on)
  const rsBtn = h('button.ah-rsbtn', { type: 'button', hidden: true, onClick: () => { resetTap(); } });
  // the pitch's first-use hint (LEARN_KEY), two short lines on the turf (placeHint): the chips' holds in the field's
  // bottom-left corner ('chips'); the help's Swipes paragraph says the holds in full
  const chipsHint = h('div.ah-ph.chips', { 'aria-hidden': 'true', hidden: true }, ...COPY.hintChips.map((t) => h('span', null, t)));
  // (no hint of the shirt's hold: owner, 2026-11-02, its "Hold a shirt: sub, sell" over the turf "remove")
  const HINTS = [[chipsHint, 'chips']];
  // the line every GW under the status bar, over the GW tiles' top (sayCheer: for as long as it plans, else once a GW)
  const cheerEl = h('div.ah-cheer.m-facts', { role: 'status', hidden: true });
  const ctl = h('div.ah-ctl', null, railWrap, hint, cheerEl);
  // the week line (renderWeek: the viewed GW's plan in one row, its Week sheet behind it); the preseason line takes its
  // place
  const strip = h('div.ah-blockhost');
  const pitchHost = h('div.ah-pitch', { dataset: { nopull: '' } });
  // the week's choices on the pitch (renderDecks: the card behind each player a choice would replace, the week's own
  // choices beside the goal), a layer over its cards put back on each mount (mountHere); a player's place opens over
  // them (openPlace). Its buttons are its own: the pitch's swipe and holds never start on them
  const decks = h('div.ah-decks', { role: 'group' });
  // a 1rem square, never seen: the root text size changing (Dynamic Type) resizes it (fitPitch)
  const remProbe = h('span.ah-remprobe', { 'aria-hidden': 'true' });
  // a notice that comes to the week line's second line, said once (the line is a button's, read only on focus)
  const noticeSaid = h('span.sr-only', { 'aria-live': 'polite' });
  // the screen top to bottom: the pitch, then the weeks as one stack, the front week's ticket among them (screen-ticket.js)
  const flag = h('button.ah-fplflag', { type: 'button', hidden: true, dataset: { row: 'fpl' } });
  const stand = h('div.ah-stand');
  // (nopull: a swipe down on it is the next week, never the page's refresh; owner, 2026-11-06, "what it loading")
  const stack = h('div.ah-stack', { dataset: { nopull: '' } }, ctl, strip);
  bindStack();
  el.append(head, slot, h('div.ah-pitchwrap', null, pitchHost, flag), noticeSaid, stack, remProbe);
  // the node Ahead keeps drawing into, placed in the Week sheet: your rules (every GW's)
  const asksHost = h('div.ah-rules-host');
  GO_GW = setGw;  // an Undo shows where it changed the plan (undoOf)
  /**
   * The pitch's height, the same every week (owner, 2026-10-08): sized from the screen alone, never from what the week
   * line holds: the height left under what is there as it renders, measured, never assumed (so the text size is in
   * it): the header with its GW line (fitHead), a banner that keeps a row (offline, with Retry; a re-plan's is a thin
   * line with no height), the switcher (tiles always two lines: renderRail) and the week line (fitBlock), so header →
   * bench is one screen in every week (nothing pushes the pitch down, no state scrolls; the choices are drawn in its
   * row gaps: renderDecks); never under --ah-pitch-min, nor its rows' least (--ah-pitch-least: pitchLeast), the CSS
   * taking the largest. Measured again only when the screen's size changes (.m-app is 100svh, so never Safari's
   * toolbars), the root text size does (remProbe) or a banner's row comes or goes (slot), all seen by one
   * ResizeObserver, and once the fonts have loaded; never on a GW switch. render() asks until the plan's own week line
   * is drawn and the pitch is mounted (drawn hidden before the switcher showed).
   */
  let fitKey = '', fitDrawn = false;
  /** The widest facts a week with no transfer has (factsWords): the most free transfers, a two-digit bank and the
   *  season's last GW, "5 FT · £99.9m ITB · 5 FT in GW38" (fitBlock's probe, never seen). */
  const FACTS_PROBE = { gw: 37, ft: 5, next: 5, bank: 99.9 };
  // a new width (rotation, text size) refits the GW line (keepGwLine) and the week line's facts (fitFacts); the choices
  // are placed over the cards again (renderDecks) in this same frame, before paint, the pitch's own fixtures fitted
  // first (a two-line fixture moves the rows: m-ahead.css --pm-x-*; pitch.js's observer refits them after, to the same
  // lines). A task later, the first frame of a new text size showed plates over the cards (owner, 2026-10-26)
  const refitPitch = globalThis.ResizeObserver ? new ResizeObserver(() => {
    fitPitch();
    keepGwLine();
    fitFacts();
    // the switcher rests under the header as drawn (m-ahead.css .ah-ctl), its GW line on two lines where the deadline
    // alone wraps (a larger text size)
    ctl.style.setProperty('--ah-head-h', `${head.getBoundingClientRect().height}px`);
    const pm = pitchHost.querySelector(':scope > .pm');
    if (pm) fitFixtures(pm);
    fitRail();
    redeck();
  }) : null;
  refitPitch?.observe(el);
  refitPitch?.observe(pitchHost);
  refitPitch?.observe(remProbe);
  refitPitch?.observe(slot);
  // the header's height (its GW line wrapping or not: a new countdown, deadline or re-plan status) refits the pitch
  // (fitPitch's key) and places the switcher under it
  refitPitch?.observe(head);
  globalThis.document?.fonts?.ready?.then(() => { if (ctl.isConnected) { fitKey = ''; fitPitch(); setTimeout(redeck, 0); } });
  const shell = el.closest('.m-app');
  const uncovered = new MutationObserver(() => { if (S.held && !covered() && !S.down.size) { S.held = false; render(); } });
  if (shell) uncovered.observe(shell, { attributes: true, attributeFilter: ['class'] });
  const clock = setInterval(tick, 1000);
  const COPY_FPL_TEAM = 'Your team as set in FPL';

  const ap0 = approxAt;

  /**
   * The pitch dimmed while the wait line shows (owner, 2026-10-28): the same state as the line (waitNow). A dim, never
   * a blur; only the turf and chalk (m-ahead.css .ah-pitch.ah-wait), everything else and every tap as ever. Shown once
   * a wait has run WAIT_DIM_MS without a break, so a quick take never flashes it: the start is kept across the line's
   * kinds (a bake, its checks, the week's).
   */
  const WAIT_DIM_MS = 1000;
  /** The viewed week's checks' time so far (S.wait: weekModel), on the bake's and Add a player's clock (clockText), no
   *  estimate: in "planning…"'s place (the week line, a transfer row: numOf), after the count of the week's plans (the
   *  Week sheet: drawWeek; the week line's second line until they are lit: renderLine); never in a number's slot of a
   *  choice (token, place header: "Roll 0:00" read as the Roll's value; owner, 2026-10-22). On the week line (`late`)
   *  only once the checks have taken LATE_S, `pre` until then, `sep` before it. Put in place each second (tick:
   *  clockShown), never a whole draw; never read out. null while nothing waits. */
  const LATE_S = 10;
  /** The landing's motion (owner, 2026-10-20): on a pitch mounted anew after an edit landed (a take, its Undo, an
   *  "instead of", a pair: FLASH) each new player comes forward into his card's place (200 ms) and the one who stood
   *  there goes up behind him and fades (his card's copy, .ah-ghost); the buy a tap took (takeFrom: S.fly) comes from
   *  where he was drawn. More than LAND_MAX new at once (a Wildcard's squad): the pitch's own cross-fade. Reduce
   *  Motion: a 150 ms cross-fade in place. Their cards' own flip (pitch.js) gives way to it; keyboard or VoiceOver
   *  focus moves to the tapped buy. S.fly once, on the first draw of the week that has him, within FLY_MS of the take;
   *  the cards as they stood: S.snap (mountHere). */
  const FLY_MS = 2500, LAND_MAX = 3;
  const FLY_EASE = 'cubic-bezier(.2, .8, .2, 1)';
  /** A place's line (planLine) on one line: its "xP" off, then its words' type a step smaller (--pl-k) to LINE_LEAST of
   *  it; still over (two long names at 320 wide), its take gives way (.nogo: the words, "›", open its Why sheet, whose
   *  one button takes it, as the pitch's sentence does) and the type is tried again; a sentence still wider (three
   *  moves at 320) wraps between its moves, never a name cut. */
  const LINE_LEAST = 0.8;

  /** After a +, the choices re-flow (the list re-sorts, the pitch's tabs move): a tap within ADD_HOLD_MS of that redraw
   *  lands on whatever moved under the finger, so it is ignored; never in an open place, whose order is held while it
   *  is open (drawPlace, askPlace). Every + of a choice goes through it; one whose edit was made (`act()` true) leaves
   *  its `moves` for xferRow's one tint (S.tint). */
  const ADD_HOLD_MS = 500;
  TAP_IN = tapIn;

  /**
   * The window's total at the end of the header's GW line where it fits (keepGwLine): "GW6–9 218.9" (shimmering while
   * the full plan checks an edit). A plan landing with another total than the last one shown (an edit, a lineup
   * change, Undo, new data) shows the change for a few seconds, "229.0 (+10.1)", then fades back (TOTAL_MS); on a line
   * that is there anyway, so nothing moves. An Undo back to the total its edit started from shows none (totalShift).
   * The seconds count from when no page toast lies over the header's row (m.css #toasts: an edit's toast stands until
   * the next touch), so it is seen once.
   */
  const TOTAL_MS = 6000;
  /** The change waiting for the toast over it to go (S.totDelta.at null): its time from then, drawn then. */
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
    { key: 'fxpts', label: 'Points + opponent', spoken: 'Points and opponent', short: 'Points + opp', second: 'both' },
    { key: 'opp', label: 'Opponent', short: 'Opponent', second: 'fx' },
    { key: 'pts', label: 'Points', spoken: 'Points only', short: 'Points', second: 'pts' },
    { key: 'price', label: 'Price', spoken: 'Current price', short: 'Price', field: 'price', text: (id, p) => fmt.money(p?.price) },
    // FPL pays back what it sells him for (half the profit): a buy of the plan's is sold at what he costs today
    { key: 'sell', label: 'Selling', spoken: 'Selling price', short: 'Selling', field: 'price', ok: () => sellOf().size > 0, text: (id, p) => fmt.money(S.sell?.get(Number(id)) ?? p?.price) },
    // FPL's Progress towards the next price change, as its pitch shows it: pricePlate
    { key: 'pchg', label: 'Price change', spoken: 'Price change progress', short: 'Price change', field: 'price_progress',
      text: (id, p) => pricePlate(p).text, bar: (id, p) => pricePlate(p) },
    { key: 'own', label: 'Owned', spoken: 'Ownership', short: 'Owned', field: 'sel_pct', text: (id, p) => fmt.pct(p?.sel_pct) },
    { key: 'form', label: 'Form', short: 'Form', field: 'form', text: (id, p) => fmt.num(p?.form) },
    { key: 'chance', label: 'Chance', spoken: 'Chance of playing', short: 'Chance', field: 'status', text: (id, p) => {
      const st = statusInfo(p?.status, p?.chance);
      return st.chance != null ? `${st.chance}%` : st.tone === 'ok' ? '100%' : st.label;
    } },
  ];
  const PLATE_KEY = 'fc:ahead:plate';

  // ---------------------------------------------------------------- the GW switcher: tap, scrub, keys

  /** The last gesture whose pointerup acted (spend: its point), while its click may still come: that click is swallowed
   *  (spentClick, below). */
  const spent = { on: false, x: 0, y: 0 };
  rail.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    S.drag = { rail: { x: e.clientX, y: e.clientY, dragging: false, pid: e.pointerId, edge: atEdge(e), end: railEnd } };
  });
  rail.addEventListener('pointermove', (e) => {
    const st = S.drag?.rail;
    if (!st || st.pid !== e.pointerId) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    // a scrub once the finger goes sideways (over 10 px, more than up or down); one that goes up or down first is the
    // page's scroll (the switcher is pan-y: pointercancel ends it), never a pick of the week under it
    if (!st.dragging && !st.edge && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      st.dragging = true;
      rail.classList.add('dragging');
      try { rail.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    } else if (!st.dragging && Math.abs(dy) > 10) { S.drag = null; return; }
    if (!st.dragging) return;
    // a GW past the plan (edgeTicks) is passed over: its word comes from a tap, not from every scrub across it
    const tk = tickAt(e.clientX, e.clientY);
    const gg = tk && !tk.classList.contains('edge') ? Number(tk.dataset.gw) : NaN;
    if (Number.isFinite(gg) && gg !== Number(ctx.store.get('gw'))) setGw(gg);
  });
  rail.addEventListener('pointerup', railEnd);
  rail.addEventListener('pointercancel', railEnd);
  rail.addEventListener('contextmenu', (e) => e.preventDefault());
  // the keys: the tiles' radio group (ui.roving, where ticks is made)

  // ---------------------------------------------------------------- the pitch: swipe ±1 GW, long-press a shirt → a
  // tick (M6), drag the C badge onto another shirt (M4, phone-only)

  pitchHost.addEventListener('pointerdown', (e) => {
    // a tab (a bench player's too: the Bench Boost is the empty bench's), a token and an open place have their own taps
    // and hold (renderDecks, drawPlace): no lift, swipe or Bench Boost starts there (a plate's every one: the ⇄ handle
    // is a plate; owner, 2026-10-25); a card's mark (cardMarks: its 44 px target over the card, review 7 B13) still
    // starts the pitch's swipe, its tap its own
    if (e.button > 0 || e.target.closest('.ah-place, .ah-decks button:not(.ah-cm:not(.tno))')) return;
    const P = plan(ctx);
    // the C's armband or the V's
    const badge = e.target.closest('.pm-badge[data-badge="c"], .pm-badge[data-badge="v"]');
    const bare = benchBare(e);
    const pl = bare ? null : e.target.closest('.pm-pl[data-id], .pm-bs[data-id]');
    const st = { x: e.clientX, y: e.clientY, id: pl ? Number(pl.dataset.id) : null, pl, moved: false, lifted: false, pid: e.pointerId, src: pitchHost, edge: atEdge(e), fl: flick().add(e.clientX, e.timeStamp), end: pitchEnd };
    S.drag = { pitch: st, used: false };
    // the armband drags after a short hold (GRIP_MS): a finger that moves before it scrolls; the C held still (TC_MS)
    // plays the Triple Captain there or takes it off (owner, 2026-10-13): a drag moves it, a still hold plays it
    if (badge && P) {
      st.badge = badge.dataset.badge;
      st.timer = setTimeout(() => { st.held = true; }, GRIP_MS);
      if (st.badge === 'c' && P.editable) {
        st.fill = holdFill(e.clientX, e.clientY, TC_MS, 'TC');
        st.chip = setTimeout(() => { unfill(st); if (!st.flying) pitchChip(st, 'tc'); }, TC_MS);
      }
      return;
    }
    if (pl && P?.editable && !choosing(ctx, P)) st.timer = setTimeout(() => liftShirt(st, e), LONG_MS);
    // the bench held where no shirt is (its labels, its edges): the Bench Boost there, or off (owner, 2026-10-13); its
    // progress fills at the finger (holdFill)
    else if (bare && P?.editable) {
      st.fill = holdFill(e.clientX, e.clientY, LONG_MS, 'BB');
      st.timer = setTimeout(() => { unfill(st); pitchChip(st, 'bb'); }, LONG_MS);
    }
  });
  pitchHost.addEventListener('pointermove', (e) => {
    const st = S.drag?.pitch;
    if (!st || st.pid !== e.pointerId || st.done) return;
    st.fl.add(e.clientX, e.timeStamp);
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (st.badge) {
      const far = Math.hypot(dx, dy) > 6;
      // the armband gripped (GRIP_MS) and moving past a still finger's 3 px: it can only move now, its Triple Captain
      // off (owner, 2026-10-22)
      if (st.held && Math.hypot(dx, dy) > 3) { clearTimeout(st.chip); unfill(st); }
      if (st.flying || (st.held && far)) dragBadge(st, e);
      if (st.held || !far) return;
      // moved before the hold: no armband drag, no Triple Captain; the finger is the shirt's (the screen scrolls, or
      // the pitch swipes)
      clearTimeout(st.timer);
      clearTimeout(st.chip);
      unfill(st);
      st.badge = false;
    }
    if (!st.lifted && Math.hypot(dx, dy) > 8) {
      st.moved = true;
      clearTimeout(st.timer);
      unfill(st);
      // sideways: the swipe's lock (never from the screen's edge: atEdge)
      if (!st.edge && Math.abs(dx) > Math.abs(dy)) {
        st.swipe = true;
        try { pitchHost.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
      }
    }
    // the pitch follows the finger, a third as far where no week is that way (the window's first or last); under Reduce
    // Motion it stays put and the week swaps on the lift
    if (st.swipe && !reduceMotion()) {
      st.tx = swipeGw(dx) != null ? dx : dx / 3;
      pitchHost.classList.remove('settle');
      pitchHost.style.transform = `translateX(${st.tx}px)`;
    }
    if (st.lifted) dragTo(e);
  });
  pitchHost.addEventListener('pointerup', pitchEnd);
  pitchHost.addEventListener('pointercancel', pitchEnd);
  pitchHost.addEventListener('transitionend', (e) => { if (e.target === pitchHost) pitchHost.classList.remove('settle'); });
  // shirts are touch-action: pan-y so the screen scrolls from them; once a shirt is lifted (long-press) or the C badge
  // is held (GRIP_MS), the drag owns the finger: stop the scroll (needs a non-passive listener)
  pitchHost.addEventListener('touchmove', (e) => {
    const st = S.drag?.pitch;
    if (st && (st.lifted || (st.badge && st.held))) holdTouch(e);
  }, { passive: false });
  pitchHost.addEventListener('contextmenu', (e) => e.preventDefault());
  globalThis.addEventListener('pointerdown', pressed, true);
  const strays = ['pointerup', 'pointercancel', 'keydown', 'blur'];
  for (const t of strays) globalThis.addEventListener(t, stray);
  const LIFT_MS = 350;
  const lifts = ['pointerup', 'pointercancel', 'blur'];
  for (const t of lifts) globalThis.addEventListener(t, lifted);
  globalThis.addEventListener('pointerup', spentUp);
  globalThis.addEventListener('pointerdown', spentDown, true);
  globalThis.addEventListener('click', spentClick, true);
  /** A GW's toast with an Undo while another GW is shown shrinks to its chip, "GW10: Undo" (m.css .toast.away; review 7
   *  B15: no old news over another week), whole again back on its GW. */
  const awayToasts = () => {
    const g = viewedGw(ctx, plan(ctx));
    for (const t of toastRegion().querySelectorAll('.toast')) {
      const m = t.querySelector('button.btn') && /\bGW(\d+)\b/.exec(t.querySelector('.toast-msg')?.textContent ?? '');
      const away = !!m && g != null && Number(m[1]) !== g;
      t.classList.toggle('away', away);
      if (away) t.dataset.chip = `GW${m[1]}:`;
    }
  };
  const offs = [ctx.store.on('gw', () => { awayToasts(); schedule(); }), ctx.store.on('memory', () => schedule('mem')), ctx.store.on('aheadRev', () => schedule()), ctx.store.on('bringing', () => schedule()),
    ctx.store.on('learnt', () => { S.learnt = new Set(); schedule(); }),
    ctx.store.on('aheadPair', () => schedule('pair'))];
  // (plan memory at once: it asks the plan, renderBaking waits for it)
  memOf(ctx);
  render();
  return {
    // a bundle or connection change waits as any store change does (schedule: never under a finger or a large sheet)
    update() { schedule(); },
    show() { render(); },
    hide() {},
    unmount() {
      if (GO_GW === setGw) GO_GW = null;
      if (TAP_IN === tapIn) TAP_IN = null;
      offs.forEach((f) => f());
      for (const t of lifts) globalThis.removeEventListener(t, lifted);
      for (const t of strays) globalThis.removeEventListener(t, stray);
      globalThis.removeEventListener('pointerdown', pressed, true);
      globalThis.removeEventListener('pointerup', spentUp);
      globalThis.removeEventListener('pointerdown', spentDown, true);
      globalThis.removeEventListener('click', spentClick, true);
      clearInterval(clock);
      clearTimeout(S.totTimer);
      clearTimeout(S.chipWake);
      clearTimeout(S.dimTimer);
      closePlace(false);
      refitPitch?.disconnect();
      toastGone?.disconnect();
      uncovered.disconnect();
    },
  };
}
