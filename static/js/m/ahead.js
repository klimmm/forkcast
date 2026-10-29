// Forkcast · Ahead (IPHONE_DESIGN §5.5, §6, §7.7, §7.8; FOLLOWUPS F10, F16; DESIGN_V2 §3: the app's one screen): FPL's
// Pick Team on one screen: the header with GW A's deadline and the window's total on one line, the GW switcher saying
// what each week does (its incoming player, its chip and hit, and its points), the week line (the viewed GW's plan in
// one row under the switcher, the pitch research's steps 3 and 4, the user 2026-10-19: "go make actual changes": your
// week in words over what the pitch can't show, "Bring in…" and "Chips…" at its right end, bringDoor, chipsDoor; a tap
// opens the Week sheet: your transfers with ×, the notices, every suggested plan and Your rules), your pitch with your
// transfers on it (each bought player tagged IN, a tap his transfer's Why sheet), Player data on its top-right corner
// (Reset lineup under it while the lineup is yours), its bench, and the week's choices on it (plansOf; the card behind,
// the user 2026-10-20: renderDecks): Forkcast's best buy waits behind the player he would replace, one tap takes that
// week's moves alone (planTake / addPlan: decision 6, the user 2026-10-11; 2026-10-12), the edges over a player open
// his place (every choice for him dealt out in his row, each with its +), the Roll and chips beside the goal; a choice
// opens its Why sheet (the per-GW grid, its one line of why, then the receipt). Header to bench is one screen, the pitch
// one size every week (fitPitch). Every way to
// change the plan by touch (M5-M8, M11) is on it: a choice's +, an IN card's Why (Remove, Keep, Not, its When line), a
// Week sheet transfer's × and left swipe, Bring in a player…, the chips (the Bench Boost held on the bench, the Triple
// Captain on the C, any chip from Chips…: useChip, the user 2026-10-13), "Your rules" (RULES_V2: every veto, keep and
// cash rule you ask for stays a visible, removable row). A new plan is your team with no transfers (memory's hold). The hits Forkcast may take are one
// setting for every week, You → Plan → "Hits Forkcast may take a week": None · −4 · −8 up to the solver's own cap
// (sheets/you.js, hitsChoices / setHitsMaxWithUndo, memory's derived 'hits' pin; the user, 2026-10-12, when Freeze and
// each week's Auto-plan went). The plan covers You → Plan → "Plan ahead"'s weeks (1-4, the bundle's meta.horizon; the
// user, 2026-10-14), the switcher showing the longest plan's GWs past it locked (edgeTicks). A Wildcard or Free Hit
// week says over its squad what the chip does there (COPY.chipWeek). The first half of this file is the PLAN VIEW the
// sheets (sheets/player.js, replace.js, wish.js) share; the second half is the screen. "Roll" is only ever the FPL word for making no transfer (a Why sheet's "Roll GW6", a week's "GW7 roll"
// plan, a gain "vs rolling").
//
// ================================================================ PLAN VIEW (exports)
// "Your plan" is plan memory's (./memory.js, B7: pins, the plan's road, the heal solve, baked-road reuse,
// lineup, pencil diff). Ahead adds what a touch needs on top of it:
//   · an edit records rules; the plan drawn stays the one the solver returned until its plan for the new rules lands
//     (a bundle road that fits, or memory's heal), the weeks from the edited one waiting meanwhile: never an engine
//     estimate of the edit (the owner, 2026-10-26: "fix so every squad is solver squad, no hardcoded logic whatsoever");
//   · the honest one-line verdict when it lands (calls.changeText: forecast points, and the planner's own count
//     whenever it parts from them), with Undo; a heal that finds no plan keeps your rules and says what it couldn't keep
//     (§7.9, RULES_V2 §5);
//   · phone-only lineups for the later GWs (GW A's XI, bench and armband are memory's lineup: F7), kept in
//     localStorage fc:ahead:lu:<entry>:<gw>; engine.applyLineup plays them.
// Every gap it shows is calls.compare's one measure (forecast points minus hits, labelled by the pooled delta alone);
// what your rules cost is the planner's count (calls.rulesCost: ≥ 0, never your lineup, which is reported apart).
// Pins are memory.js pins (makePin and its pinSell / pinSlide / pinVeto / pinNever / pinKeep / pinChip /
// pinHits); a solve that already happened for exactly the pins (a wish pill, a chip prepared with your rules or
// pre-solved, the hits preview) is the plan at once: offered to memory (memory.offer), it is the plan when it fits your
// pins, and otherwise memory's heal asks the plan service for the same values and gets its cache.
//
// plan(ctx) → P | null    the plan as the screens draw it (null: none yet; under the hold, your team before its solve):
//   {A, gws, end, L (engine lookup), b (bundle), d (ctx.data), base (the model's Road), road (your Road),
//    mem (memory.getPlan()), pins ([Pin]), weeks: [ViewWeek] (every one the plan the solver returned, memory's: never an
//    edit's estimate, the owner 2026-10-26), total, approx: Set(gw) (the weeks waiting on an edit's solve, the plan
//    before it drawn), mark (the edited week), forced (memory.forcedHits: the hits a shown week takes that the rules its
//    road was solved under don't allow, or that its planner never priced, never a waiting week's), healing,
//    cmp (calls.compare yours vs the model), onLine, editable, why (when not editable),
//    lineupGap ({delta, gws}: your lineup edits against the plan's own lineups), rules (calls.rulesCost of your
//    rules: the planner's count, ≥ 0) | null, comparable (your road and the model's are solves of the same data)}
//   ViewWeek {gw, xi, bench, squad, captain, vice, chip, bank, ft, used, hits, points, moves: [{out, in}],
//             in, out, approx, lineup (a phone lineup of yours), lineupDelta}
// weekOf(P, gw) · squadBefore(P, gw) · inFor(P, week) → {id: 'Scott'} ·
//   viewOfRoadWeek(week, L) · shirtOf(L, id, size)
//   ("−0.8 ● Clear: worse" in the loss colour: a list row's gap) · clearGain(cmp) (B1: a gain beyond the noise, the one
//   test for green, a solid +, a filled button and a "Best") · editable(ctx)
// The bank: baseOf(ctx) → the engine base GW A starts from (memory.withBank: the entry's, with your "Bank as FPL
//   shows" rule's bank). Every bank shown (the week line, the rail, Replace) counts from it.
// Estimates (what a list or a check counts, never a squad drawn: the owner, 2026-10-26): draftOf(ctx) → engine draft of
//   the plan (the solver's) · estimate(ctx, draft, from) → engine evaluate() (best XI from `from`) · addMove(ctx, draft, gw, out, in) → {draft, ev, problem} · dropMove(draft, move) ·
//   problemOf(ctx, ev, from) · problemsOf(ctx, ev, from) · problemText(ctx, problem, name?) · compare(ctx, a, b)
//   (calls.compare: the one measure) · asYours(ctx, road) → {weeks} (a road with your lineups on it: what a solve
//   of an alternative is measured in against your plan) · inputsOf(ctx) (calls.planInputs, memoised) · baked(ctx, extraPins) → the
//   bundle road that already is the plan with those pins (memory.findRoad), or null
// Pins for an edit: wishPin(P, id, gw) ("him from GW gw": must id@gw-end, out before gw) · keepPin(P, id, {gw, scope, from}) (a Keep: the Player sheet labels its span) ·
//   memory.pinRoll(gw, k) (no transfers in GW gw but your k exact moves there: the solver's own per-round cap)
// Solves: valuesFor(ctx, extraPins, drop) → memory.values() (+ extra) · solveFor(ctx, extraPins, purpose, drop) → api.solve
//   · wishSolve(ctx, P, id, g, purpose) (him from GW g, your later buy of him off)
// Edits (rules only: the plan drawn the solver's last until memory's heal, 600 ms after the last edit, lands, then the
//   verdict with Undo in the pending toast's place; what the solver couldn't keep said: fail, clashParts; pendingTick(ctx) its age meanwhile, pendingAgain(ctx) that toast again after a reload (B141), a
//   failed check's "Try again" (fail, B89), endingOf(Q, prev, gw, {own, named}) the verdict's one ending;
//   false with a toast when blocked): sellFrom(ctx, gw, out, in) · sellAny(ctx, gw, out) (sell him, the plan
//   picks the buy) · moveTo(ctx, move, gw) (the Why sheet's When line) · veto(ctx, move, {scope}) (F11: 'gw' — not him in the move's GW, the
//   default — or 'all') · want(ctx, id, gw, road) · keep(ctx, id, {gw, scope, from}) (F11: 'gw' — in GW gw
//   only — or 'all': from `from`, a transfer's GW, else from when the plan has him, to the end; a sale of yours it
//   takes back goes, named) · never(ctx, id) ·
//   rescope(ctx, pin, scope) (scopeLabels(kind, gw, end): the two scopes in words; the rule it was goes, a Keep's
//   verdict the Keep's one wording, a veto's the change's, before → after) ·
//   liftAsk(ctx, pinId) (one ask off) · removeRule(ctx, pinId) (every Remove: a rule whose move the plan shows as its
//   row's × takes it, removeMove; else liftAsk) · captain(ctx, gw, id)
//   · sub(ctx, gw, a, b) (subLineup(week, a, b, L): the swap with the armband as FPL moves it; subChoices(ctx, P, gw, id):
//   a sub's list, the starters he can replace, each in its toast's words and number) · resetLineup(ctx, gws)
//   (those GWs' lineups back to the plan's best: the pitch's Reset lineup pill) · resetPlan(ctx) (You → Reset plan, and
//   the pitch's Reset plan pill while planHasYours(P), where it fits: resetFits(box, cards)) · chipPlan(ctx, gw,
//   chip, road) (chipEdit(P, gw, chip) → {pins, drop}: the one pin set the tap and its preparation share; chipSource(ctx)
//   → each chip × GW's plan: chipPreps(ctx), your chips prepared with your rules in the background, or with none
//   chipPresolves(ctx), the bake's)
//   · chipOff(ctx, gw) · adoptModel(ctx, {drop}) (Compare: the model's plan, or `drop` = the blockers'
//   pin ids off) · gwMode(P, gw) → 'roll' | 'free' | 'h<n>' (at most n hits, below the default: You → Hits) | 'auto'
//   (the solver's own default cap, F17) · hitsChoices(P) / setHitsMaxWithUndo(ctx, n) (You → Hits: the hits Forkcast may
//   take a week, one setting for every week; the user, 2026-10-12) ·
//   chipWeek(P, gw) → 'wc' | 'fh' | null (a week whose plan plays one: its options say so, COPY.chipWeek) ·
//   reroute(gw)
// Freeze is gone (the user, 2026-10-12: "Remove it"): plan memory thaws an older plan's frozen weeks (normalizeAccepted),
//   so frozenOf(P) → [] and isFrozen(P, g) false; inkAt(ctx, P, g) is GW A under way.
// A new forecast: driftSay(ctx, drift) (memory's drift as a toast, "Use it" or kept: B22); on the suggested plan the
//   week line's notice of what it changed, its row in the Week sheet (mount's forecastLine: memory.forecastChange, B14).
// No yes/no asks (critique v3 A6, the user's 2026-10-07 decision over RULES_V2 §3): a newer ask that takes back a rule
//   of yours acts at once, its verdict toast names what it took back (withTaken: "· Keep Saka removed"; no Roll rule is left to name, "· auto-plan back on in GW7", since
//   memory.normalizeAccepted drops an older plan's on load) and its one Undo restores every rule as it was; so does Clear all ("Removed 3 rules: …").
//   sellOut(ctx, gw, out, in | null) (sellFrom, or sellAny with the plan's pick)
// An edit drops the asks it contradicts (memory.pinConflicts) and, for a Keep or a veto, the same player's Keeps or
//   vetoes whose weeks meet it (one rule says when); its verdict reads the planner's count against the way the pins
//   moved (memory.pinsDir: a chip or cash is another plan, never "looser").
// Your rules: ruleOf(P, pin) (memory.ruleText scoped to the planned GWs: the chip's words everywhere) · clashing(P,
//   pin) → [Pin] the asks a new pin takes off (memory.pinConflicts) · asksOf(P) →
//   [Pin] (every pin but the road) · rulesOf(P) (Your rules: asks newest first)
//   pinOf(P, kind, id, gw?) (one whose window covers gw, when given) · pinsOf(P, kind, id) · barred(P,
//   from, to) → Set(id) the pins keep out (memory.barredAt) · keptFrom(P, g) → Map(id → GW) the players your Keeps hold
//   from GW g on (no sale the phone picks sells one) · keptCells(P, g, chip) → [[id, GW]] those a plan playing `chip` in
//   GW g keeps in its squads (a Free Hit week: only a Keep of that week) · barringRule(P, id, g?) → the ask that keeps
//   him out (B90b; barringRules: every one) ·
//   clashLine(P) → {text, pins} the status row of a re-plan that
//   couldn't keep your choices (B12; clashParts: what the solver couldn't keep) · buyCandidates(P, {pos, from, not,
//   limit}) → [id] the buys a bring-in may weigh (never one your rules bar) · blockersOf(P) → [{pin, icon, text, desc, why, locked, lineup}]
//   what keeps your plan off the model's (F5; a lineup of yours too, F7: no pin, nothing to drop) ·
// GW A and the deadline: watchOf(ctx) → GW A's price watch for the plan as drawn (calls.priceWatch) | null · watchView(watch, {move, wait}) → its
//   nodes (a GW-A transfer row's details and their foot, "Hide" putting it away: B139) · deadlineInfo(epoch) · isLive(ctx) · inkAt(ctx, P, g) (B7: no
//   edit reaches GW g, GW A under way: no suggested plan, + or Bring in a player… there) · liftsLive(ctx, P, p)
//   (B7: taking ask p off would re-plan GW A under way: no Remove or Off for it) · initials(entry)
// A heal that can't keep every rule leaves them all in place (RULES_V2 §5): the Week sheet's status row says so, Undo takes back the
//   newest, and the copy names the rule that broke the set and what the solver couldn't keep (clashParts).
// The fix pass (2026-10-08; the core rule: an action does only what it says, anything more is asked first):
//   A1 buyPlan(ctx, id, g, {out}) → {kind: 'one' | 'two' | 'none', out, in, fund?, short?, draft, ev, cmp, hits}: a buy as
//     exact moves of yours (his best sale that fits; else that sale with one more that frees the money); saleBuy(ctx, id,
//     g, out) a sale you chose made as it is, the money short or not (the owner, 2026-10-28: FPL's draft, its bank below
//     0, memory.holdOf's debts; "Do both" and its ask went); bringIn(ctx, id, g, bp) makes it
//     (memory.pinSell, the funding sale marked `funds`; one Undo), taking back bringInTakes(P, id, g, bp) (a later buy of
//     him and its funding too); holdBuy(ctx, id, g, road) is the buy Add a player shows and want makes (a solve's
//     road as its GW-g moves; B36: in both modes); buyProblem(ctx, P, id, bp) says why not (A3: "it fits in
//     GW7" only when it does: fitsLater, whose week sayBuyProblem's action takes, bringInFrom, B74).
//     want / Add a player / Replace never hand a week to the planner (on the suggested plan Forkcast plans the rest around
//     your exact moves, B36), never set a hits rule, and under the hold gwMode reads a week of your exact moves as
//     'roll' (Forkcast adds nothing there): no setting changes as a side effect. Replace's "Let Forkcast
//     choose" is the one sale the planner picks the buy for (sellAny; the user, 2026-10-13): under the hold that week
//     takes the one buy only, the rest of its squad held (memory.holdOf).
//   A2 movesInOrder(P, w) (a week's transfers in the order made), rowGains(ctx, P, w) (each measured on top of the ones
//     before it: the free transfers go first, a hit is the extra move's, the rows add up), pinOfMove(P, m),
//     fundingOf(P, g, m) (a funding sale and the buy it pays for: its rows' ties), removeMove(ctx, m) (its own rule
//     alone: the owner, 2026-10-26, "no hardcoded logic whatsoever").
//   whyFacts(ctx, P, g, m, withIt, without, {drafts, c, yours, vs}) (what a move changes besides its two players' numbers,
//     the Why sheet's list: B54 its money in words, a hit, what it replaces, the next GW's free transfers, a later hit,
//     B29 ifMisses(ctx, P, g, m, dWith, dWithout), the move if its buy misses GW g; B5b a better use of its free
//     transfer).
//   vice(ctx, g, id): the vice armband (the pitch's V dragged onto a starter), a lineup edit like the captain's.
// Suggested plans (decision 6, the user 2026-10-11: plans in every week, in either mode): plansOf(ctx, P, g) (GW g's choices, each a
//   whole plan on your plan as it stands, its follow-up the best known: a bake road's or its own solve's, forkValues),
//   addPlan(ctx, g, pl) (its +: GW g's moves
//   your exact transfers and its GW-g chip, planTake (the user, 2026-10-12: that week alone), one Undo, its toast the
//   week's moves, the row's number vs rolling and what your total moves by, Why before its Undo: first-use proposals
//   #1, #2).
//   They retire the single moves, the pair and the "Instead of" rows: their moves are plans.
//   The next week's are solved in the background once the viewed week's settle (prepNext; the owner, 2026-10-22:
//   "prepared - at least the next one from which you are viewing"), so a switch to it draws them at once.
//   Each move of a pair (a road's two or more GW-g moves) is a choice alone too (the user, 2026-10-21: "why it not
//   suggests de cuyper to hill as a separate transfer - and only in combination?"; "why not offer alternatives without
//   also buying palmer": another road's pair only with room for them); one the week can't make alone,
//   `needs` the pair's other sale, listed with it, its + off (failedWords: "£1.7m short" · "needs Kayode's sale";
//   problemShort). The places they wait in: decksOf(P, w, M), each choice's words there planBack(P, g, pl) and
//   noteOf(P, w, e) (pure, for the screen's mount).
// Once the week has your transfer (the user, 2026-10-08): extraWeek(P, g) (its free transfers all used: suggestionsOf's
//   moves are each measured after their hit), ownAltsOf(ctx, P, w, m)
//   (your transfer's other buys, measured as its row is: its Why sheet's grid and plansOf's choices). Before it the
//   same kind (the user, 2026-10-21: "Same both times, worse ones too"): every move that fits, losers too, a move the
//   2026-10-18 bars keep from being the week's suggestion `early` (earlyOf: listed, never lit, its + quiet), and a
//   suggestion's sale with its other buys (ownAltsOf of a move the week doesn't make yet). repicks(P, g): a
//   week Forkcast plans (gwMode not 'roll'; no Wildcard or Free Hit week): only your transfers
//   use its free transfers, and addYours(ctx, P, g, out, in) measures a sale of yours there in place of one of
//   Forkcast's (a free transfer back, not a −4 the week's cap refuses).
//   otherUseOf(ctx, P, w, m): the week's best single move for the free transfer your transfer takes (its Why's
//     "Better use of this free transfer").
// A blocked edit is one that makes a week's bank or club count worse than the plan already has it (problemOf
//   against baseline(ctx, from)): a later week's bank below 0 at FPL's prices on a solved plan is price drift (the
//   solver keeps every week in budget at its prices), shown as such and never blocking an edit that leaves it.

import * as E from '../plan/engine.js';
import { h, svg, fmt, fill, append, toast, toastRegion, chipName, plural, icon, toMs, statusInfo, roving, reduceMotion, holdTouch, flick, focusKey, refocus, xpNum, xpGain, shownGain } from '../ui.js';
import { shirt, clubColor } from '../plan/kits.js';
import { fplMarks, subOrder, fitFixtures } from '../plan/pitch.js';
import {
  COPY, planInputs, compare as compareIn, counted as countedIn, captainGap, subGap, changeText, transfersOf, hitsOf, plannerOf,
  rulesCost, sentence, withForced, forcedNew,
  hitBook, priceWatch, priceMorning, pricePlate, hitCap, gwFlags, statusText, liveCheck, planEta, planShare, steadyEta, clockText,
  waitedText, horizonFeature, waitFact, waitFacts, waitLines, stepShare, leftText,
} from './calls.js';
export { clockText, waitedText, stepShare };  // the sheets' clocks and wait lines (wish.js, chips.js) read them here
import {
  attach, makePin, pinSell, pinVeto, pinNever, pinKeep, pinChip, pinHits, pinRoll, squadInto, isRoll, isExact, exactAt, composePins, pinConflicts, pinsDir,
  findRoad, optionsRoad, optionsValues, barredAt, ruleText, scopeOf, rulesBroken, brokenCells, parseSpans, withBank, forcedHits, solveKept, bundleRoads,
  deadlinePassed, switchWithUndo, frozenSince, sinceText, rollKeeps, solvedLineup, solvedKey,
} from './memory.js';

const LONG_MS = 430;           // long-press to lift a shirt
const SWIPE_PX = 90;           // a row swiped left past this rules its buy out (B19)
const SWIPE_MS = 260;          // the Why sheet's row travelling left (vetoFromWhy: its transition, --dur, ended), then the veto
const GRIP_MS = 150;           // a short hold: the C badge's drag (a move before it is the page's scroll)
const TC_MS = 600;             // the C held still this long: the Triple Captain (a move before it drags the armband)
const EDGE_PX = 16;            // §5.5: a swipe or scrub starts ≥ 16 pt from the screen edges (the iOS back-swipe: atEdge)
const SPENT_PX = 24;           // a gesture whose pointerup acted (spent): its click comes this near its point (a tap's slop)
const MINUS = '−';
/** fn in a task of its own once the frame in flight is painted (a frame callback, then a task): a tap's own feedback
 *  is drawn first, and the edit it makes (its plan, the screen re-drawn for it: one long task of seconds on a phone, the
 *  first time that code runs) never holds that frame. Without frames (a hidden page, the node tests) at once. */
export const afterPaint = (fn) => (typeof requestAnimationFrame === 'function' && globalThis.document?.visibilityState === 'visible'
  ? requestAnimationFrame(() => setTimeout(fn, 0)) : fn());
const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const ids = (xs) => (Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : []);
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const span = (gws) => COPY.span(gws);
/**
 * The wait line (design 1028d W2-line; the owner, 2026-10-28, of GW10 after his GW9 change: "user just can miss it needs
 * to wait for something because this checking line is not that obvious"): every wait of the phone told the same way in
 * one place (M10, M12, H13, R22): its verb in ink at 600 ("Checking", "Planning"), then what, how far and the clock, the
 * longest that fits whole, never an ellipsis (calls.waitLines; B3); and a bar on its container's edge (M12): determinate
 * where a count or a time left is known (H9, H11, M13, N8), a few sweeps where not, never an endless loop (N7, W6, W7);
 * Reduce Motion: no sweep, no glide (H19, W8; m.css). The pitch's waits on the strip (Ahead paintWait), Chips…'s and Bring
 * in's at the top of what they check (sheets/chips.js, sheets/wish.js). → {t: the words, bar}
 */
export function waitView() {
  return { t: h('span.m-wl', { 'aria-hidden': 'true' }, h('b'), h('span')), bar: h('span.m-wlb', { 'aria-hidden': 'true' }, h('i')), key: null };
}
/** The wait line `v` (waitView) drawn for wait W {key, word, scope, long, prog, so, p: 0..1 | null}: its longest words that
 *  fit whole (laid out: a hidden one shows its shortest until drawn again, each second), its bar's share, else (p null) a
 *  sweep that starts once per wait (W.key) and ends after three (m.css). */
export function paintWaitView(v, W) {
  const [b, r] = v.t.children, i = v.bar.firstChild;
  if (b.textContent !== W.word) b.textContent = W.word;
  for (const x of waitLines(W)) { r.textContent = x; if (v.t.scrollWidth <= v.t.clientWidth + 0.5) break; }
  if (W.p != null) { i.classList.remove('sweep'); i.style.width = `${(100 * Math.min(1, W.p)).toFixed(1)}%`; }
  else if (v.key !== W.key) { i.classList.remove('sweep'); i.style.width = ''; void i.offsetWidth; i.classList.add('sweep'); }
  v.key = W.key;
}
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
/** "instead of Palmer" → "Instead of Palmer": words that lead their line. */
const capFirst = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ---------------------------------------------------------------- context

/** The bundle-derived facts every plan function needs (null before a bundle with an entry). */
function info(ctx) {
  const b = ctx.bundle, d = ctx.data;
  if (!b?.entry || !d?.base) return null;
  const gws = d.horizon;
  return {
    // reach: the GWs the longest plan reaches, those past gws shown locked on the GW switcher (You → Plan ahead)
    b, d, A: d.gw, gws, reach: d.reach ?? gws, end: gws[gws.length - 1], L: E.playerLookup({ base: d.base, players: d.players }),
    seeds: d.seeds, noise: d.noise ?? 0, base: b.roads?.base ?? null, entry: String(b.entry.id),
    owned: ids(d.base.squad.map((s) => s.id)), season: d.base.season,
  };
}
export const editable = (ctx) => ctx.store.get('conn')?.state !== 'offline' && !!info(ctx)?.base;
/** Every plan of n weeks or more is locked for this browser (the bundle's meta.locked; You → Plan ahead): the reach's
 *  n-th GW can't be planned here. I: info(ctx) or a plan view. */
const lockedFrom = (I, n) => I.reach.slice(n - 1).every((_, i) => (I.b.meta?.locked || []).includes(horizonFeature(n + i)));
/** You → Plan ahead now asks another length than the plan on screen plans (ctx.weeks, kept at the tap; its bundle still
 *  on its way: app.js setWeeks): no background solve is asked for it (a suggested plan's fork or the next week's
 *  preparation: forkPump; a chip preparation: pumpPreps; the options road: optionsRef), the new plan's draw asks its
 *  own. A landing meanwhile asked the old length again (the horizon QA, "every solve sent since is one week": a 4-week
 *  fork asked after the tap on "1 week"; the owner, 2026-10-26: "fix the failures"). The server plans meta.horizon
 *  from the same ask (api/mobile.py plan_weeks, calls.planWeeks), so a bundle in force always matches. I: info(ctx) or a
 *  plan view. */
const leftBehind = (ctx, I) => { const n = ctx.weeks?.(); return n != null && n !== I.gws.length; };
const OFFLINE_EDIT = 'Edits need a connection. Your plan is unchanged.';
const memOf = (ctx) => attach(ctx);
const memPlan = (ctx) => memOf(ctx)?.getPlan() ?? null;

// ---------------------------------------------------------------- what Ahead keeps beside memory

/** The edit being healed: {mem, entry, A, from (the chain's first edited GW), prevP (the plan before it: the solver's),
 *  text, plain (B24: its words landed at once), more, take (the newest edit's own: ovFor), chain, armed}. */
let OV = null;
/** OV when it is an edit of this page's memory, team and GW A (a memory let go, by a sign-out, takes its edit along:
 *  never a stale "before" under another memory's plan), else null. I: info(ctx). */
const ovOf = (ctx, I) => (OV && OV.mem === memOf(ctx) && OV.entry === I?.entry && OV.A === I?.A ? OV : null);
/** OV for `chain`, the edits made while the full plan checks them (B133): the newest one's own (the plan before it and
 *  its verdict), its weeks from the chain's first edited GW. */
const ovFor = (ctx, I, chain) => ({ mem: memOf(ctx), entry: I.entry, A: I.A, ...chain.at(-1).own, from: Math.min(...chain.map((c) => c.own.from)), chain, armed: false });
/** A sheet's ask to open GW g's Your rules on Ahead (openRules), taken by the screen's next draw of that week. */
let RULES_ASK = null;
/** Your rules of GW g opened on Ahead (the Week sheet at Your rules, as the week line opens it) once the screen draws that week:
 *  a sheet's toast action (Replace's, when several rules of yours keep a player out: review 5, 2026-10-12, it said
 *  only "Remove the rule on Ahead"). The caller navigates there. */
export function openRules(ctx, g) {
  RULES_ASK = g;
  bump(ctx);
}
/** The last landing (B61), drawn once by mount's render (the screen reads it, never a plan view: a landing knows what it
 *  changed only once its plan view is made): {gws (the weeks it changed: their tiles tint once), at, rows ({gw:
 *  [`${out}>${in}`]}: the transfers it made, their rows tint once in their week), cards ({gw: [id]}: the players it
 *  brought into the XI or bench or moved between them, changedCards: their name plates tint once on the pitch, the
 *  pitch research 2026-10-19), chg (the weeks that keep a mark until shown; gws when not given), undo (an Undo brought
 *  it: the total's change in plain ink)}. */
let FLASH = null;
/** The week the screen shows of plan view P: the address's GW when the plan has it, else GW A (mount's gwNow). */
const viewedGw = (ctx, P) => {
  const g = Number(ctx.store?.get?.('gw'));
  return P?.gws.includes(g) ? g : P?.A ?? ctx.data?.gw;
};
/** The mounted screen's own week switch (mount's setGw), for an Undo that shows where it
 *  changed the plan (undoOf); null with no screen (the node tests: the address alone). */
let GO_GW = null;
/** …and its tap on a player of GW g (mount's tapIn: his transfer's Why sheet when he is a buy, the pitch research's 4a;
 *  else his card), for a take's toast's Why (whyAct); null with no screen (the node tests: the action does nothing). */
let TAP_IN = null;
/** A take's toast action before its Undo (addPlan, every way a choice is taken; the user, 2026-10-21: fix all (first-use
 *  proposal #2): Sam and Dana tapped the card behind to read it, and it made the transfer): GW g's buy `id`'s transfer's
 *  Why sheet, as a tap on his IN card opens it, the plan as it is at the tap. Its answer (tapIn's: settled once that
 *  sheet has closed) holds the toast, its Undo there, until then (ui.toast `keep`; the review of the first-use
 *  proposals, 2026-10-21). */
const whyAct = (g, id) => ({ label: COPY.whyAct, keep: true, onClick: () => TAP_IN?.(g, id) });
/** A sheet opening (ctx.openSheet's promise) → a promise settled once it has closed (its onClose, kept), at once when
 *  none opened. */
const closedOf = (p) => Promise.resolve(p).then((sh) => sh && new Promise((done) => { const was = sh.onClose; sh.onClose = () => { was?.(); done(); }; }));
/** An edit made at once (a lineup edit, Reset plan, "Without your rules") landed: what it changed against plan view
 *  `prevP` (changedOf: tiles, rows, cards) flashed once by mount's render, `more` over it (its own weeks: `gws`). */
function flashLanding(ctx, prevP, more = {}) {
  bump(ctx);
  const P = plan(ctx);
  const ch = P && prevP ? changedOf(P, prevP) : { gws: [], rows: {}, cards: {} };
  setFlash(P, { ...ch, ...more });
}
/** A landing's changes (changedOf) for mount's render to flash and mark once, stamped with plan view P's team and GW
 *  A (`team`): a team switch mounts the screen anew (S.flashAt 0), and the last landing of the
 *  team before drew its changes on the next one's tiles (the owner, 2026-10-26, Moriarty's CoffeeBoy after Raketa's
 *  Evanilson: "why there are crossed points on later weeks if i have not made any changes", ~~60.0~~ 57.1 the struck
 *  60.0 Raketa's GW10). */
const setFlash = (P, x) => { FLASH = { ...x, team: P ? `${P.entry}|${P.A}` : null, at: Date.now() }; };
/** B129 (saffer Part 4 §8: a transfer you just removed came straight back at the top of the suggestions, as if new):
 *  the moves you took off this session (removeMove: the ones its toast names), per entry and GW A: {key, by: {gw:
 *  [`${out}>${in}`]}}. A choice selling and buying only players they sold and bought is yours ("removed by you": plansOf
 *  `removed`, its words; in its rank, lit and green as any since the owner, 2026-10-26, after Raya +2.4 lost its ink to Tavernier +0.8 once its moves were removed: "find why and fix"); its edit's Undo puts the record
 *  back as it was (snapshot / restore),
 *  and adding the move again forgets it, from any door (edit: a transfer its rules make exact; the user, 2026-10-21: fix
 *  the known issues: a + took it back still "removed"). */
let REMOVED = { key: null, mem: null, by: {} };
const removedBy = (I) => {
  // this page's memory's: a sign-out (memory released) takes them with it, as it takes your choices
  const k = `${I.entry}:${I.A}`, mem = attach();
  if (REMOVED.key !== k || REMOVED.mem !== mem) REMOVED = { key: k, mem, by: {} };
  return REMOVED.by;
};
/** Moves `ms` ([{gw, out, in}]) noted as removed by you, or forgotten (on false). I: info or a plan view. */
function noteRemoved(I, ms, on = true) {
  const by = removedBy(I);
  for (const m of ms) {
    const k = `${m.out}>${m.in}`, rest = (by[m.gw] || []).filter((x) => x !== k);
    by[m.gw] = on ? [...rest, k] : rest;
  }
}
/** The moves you took off GW g this session (B129), `${out}>${in}` each. I: info or a plan view. */
const removedAt = (I, g) => new Set(removedBy(I)[g] || []);
/** Phone-only lineups for GWs after A: {gw: {captain?, vice?, xi?, bench?}} (per entry and window, from this storage). */
let LU = { key: null, local: null, by: {} };
let rev = 0;               // bumped on every Ahead-side change (the plan view is memoised on it)
const bump = (ctx) => { rev++; ctx.store.set('aheadRev', rev); };

/** GW g's phone lineup, its own key (B9: keyed by GW A, a later GW's captain was gone once GW A's deadline passed). */
const luKey = (I, g) => `fc:ahead:lu:${I.entry}:${g}`;
const laterGws = (I) => I.gws.filter((g) => g > I.A);
const luWindow = (I) => `${I.entry}:${I.gws.join()}`;
/** B139, this browser's (ctx.api.local: try/catch, so private mode or a full store only forgets it): the price watch put away by "Hide" (its signature: team, night, verdict and
 *  amount; a new verdict shows again), and the counted players' prices while it shows ({entry, gw, epoch, prices}:
 *  calls.priceMorning's `kept`, said the morning after its night, then forgotten). */
const WAIT_KEY = 'fc:ahead:pwait';
const NIGHT_KEY = 'fc:ahead:pwnight';
/** The first-use hints done, this browser's as WAIT_KEY (a JSON list of LEARNT's names; the user, 2026-10-13: "fading
 *  hints", each one calm line shown until you have done its action once, then never again here; Saffer's progressive
 *  reduction, Birman's calm note that needs no dismissing): 'row' a transfer row swiped left, 'pitch' a shirt
 *  held or the C or V dragged, 'chips' a chip played from the pitch or Chips… opened (its note in the pitch's corner once 'pitch' is
 *  learnt: one note there at a time) (the plans' line went 2026-10-13, the books review: its span is the plans heading's own). Help's
 *  "Show tips on the screen again" brings them back (showTipsAgain); its sections say the same actions. */
const LEARN_KEY = 'fc:ahead:learnt';
/** Help's "Show tips on the screen again" (the user, 2026-10-13): this browser's learnt hints forgotten; a mounted
 *  Ahead hears it ('learnt') and draws them again until each is done once more. */
export function showTipsAgain(ctx) {
  ctx.api?.local?.set?.(LEARN_KEY, null);
  ctx.store.set('learnt', Date.now());
}
function lineups(ctx, I) {
  const k = luWindow(I), local = ctx.api.local;
  if (LU.key !== k || LU.local !== local) {
    // the old format: GW A's key held every later GW's lineup ({gw: lineup}, its keys all digits; GW A's own lineup
    // is plan memory's, so the new format never writes that key): each to its own key, never over a newer one
    const old = local.json(luKey(I, I.A));
    if (old && typeof old === 'object' && Object.keys(old).every((g) => /^\d+$/.test(g))) {
      for (const [g, lu] of Object.entries(old)) if (Number(g) > I.A && lu && local.get(luKey(I, g)) == null) local.set(luKey(I, g), JSON.stringify(lu));
      local.set(luKey(I, I.A), null);
    }
    LU = { key: k, local, by: Object.fromEntries(laterGws(I).map((g) => [g, local.json(luKey(I, g))]).filter(([, lu]) => lu)) };
  }
  return LU.by;
}
/** `by` the later GWs' lineups: each GW's key written, a GW absent from it removed. */
function setLineups(ctx, I, by) {
  const local = ctx.api.local;
  LU = { key: luWindow(I), local, by: Object.fromEntries(laterGws(I).filter((g) => by[g]).map((g) => [g, by[g]])) };
  for (const g of laterGws(I)) local.set(luKey(I, g), LU.by[g] ? JSON.stringify(LU.by[g]) : null);
  bump(ctx);
}

// ---------------------------------------------------------------- the plan as drawn

/** The engine base GW A starts from: the entry's, with the bank your "Bank as FPL shows" rule plans from
 *  (memory.withBank). Every bank Ahead and its sheets show is counted from it (banksOf, estimate, inputsOf). Reading
 *  it never makes a memory (attach() without ctx): before one is attached there is no rule of yours. */
export const baseOf = (ctx) => withBank(ctx.data.base, (ctx.store.get('memory') ?? attach()?.getPlan())?.pins);

/** Per road, by its weeks (QA-7 #2: plan memory hands out a copy of the same plan on each read, its weeks shared). */
const roadId = (road) => road?.weeks ?? road;
const DRAFTS = new WeakMap();
function roadDraft(ctx, road) {
  let d = DRAFTS.get(roadId(road));
  // its moves paired as your rules make them (pairsOf), as the rows are: a row's gain drops its own move (rowGains)
  const keep = pairsOf((ctx.store.get('memory') ?? memPlan(ctx))?.pins);
  if (!d) DRAFTS.set(roadId(road), (d = E.roadToDraft(road, ctx.data.base, { players: ctx.data.players, keep })));
  return d;
}

/** {gw: bank} of a road at FPL's prices (engine.planBanks: evaluate's accounting, sale values by the half-profit rule,
 *  today's buy prices; no lineups scored) from the bank your plan starts from (baseOf), memoised per road and base: what
 *  the week line and the rail show, so they agree with Replace. */
const BANKS = new WeakMap();
function banksOf(ctx, road) {
  const base = baseOf(ctx);
  let b = BANKS.get(roadId(road));
  if (b?.base !== base) BANKS.set(roadId(road), (b = { base, gw: E.planBanks({ base, players: ctx.data.players, draft: roadDraft(ctx, road), horizon: ctx.data.horizon }) }));
  return b.gw;
}
/** Your transfers as your rules make them, [{out, in}]: a sale with its buy, a slide. A week of two midfield sales
 *  pairs them so (viewOfRoadWeek), as its toast and rules say, and each row finds its rule (pinOfMove) (the checker,
 *  2026-10-09: Scott → Groß then Tavernier → E.Le Fée read "Tavernier → Groß · Scott → E.Le Fée", by price). */
const pairsOf = (pins) => (pins || []).flatMap((p) => (p.kind === 'sell' && p.in != null ? [{ out: p.player, in: p.in }]
  : p.kind === 'slide' ? [{ out: p.out, in: p.player }] : []));
/** A week's sales `outs` and buys `ins` as the plan view pairs them: by position (engine.pairMoves), your transfers as
 *  their rules make them (`keep`: pairsOf); whole pairs only. Pure. → [{out, in}] */
const pairedMoves = (outs, ins, L, keep = []) => E.pairMoves(outs, ins, L, keep).filter((m) => m.out !== null && m.in !== null);
/** A Road week as a ViewWeek (moves paired by position: pairedMoves; points = the engine's on today's mean xP, the one
 *  source every gap is measured in: QA-6, never the solver's pred on one side). bank: the engine's (FPL's sale
 *  prices, as Replace counts it) when given, else the road's. keep: your transfers as their rules make them (pairsOf). */
export function viewOfRoadWeek(w, L, { bank = null, keep = [] } = {}) {
  const xi = ids(w.xi), bench = ids(w.bench), hits = num(w.hits) ?? 0;
  const moves = pairedMoves(w.out, w.in, L, keep);
  return {
    gw: Number(w.gw), xi, bench, squad: [...xi, ...bench], captain: num(w.captain), vice: num(w.vice), chip: w.chip ?? null,
    bank: bank ?? num(w.bank), ft: num(w.ft_avail), used: num(w.ft_used), hits,
    points: E.weekPoints({ ...w, xi, bench, hits }, L.xp),
    moves, in: moves.map((m) => m.in), out: moves.map((m) => m.out), approx: false,
  };
}
/** An engine state as a ViewWeek (≈): the moves the engine made. With `L`, a Wildcard's or Free Hit's changes (the
 *  chip's squad against the week before) paired as a road's week is (pairedMoves, `keep`: your transfers as your rules
 *  make them), so the Week sheet's rows read the same while its plan checks as once it lands, and a choice's Why sheet
 *  the same before its + (squadChanges; the user, 2026-10-21: fix the known issues: a Free Hit's Why sheet paired a sale
 *  of yours its + takes back as you made it, the Week sheet once taken re-paired it, the rule gone). */
function viewOfState(s, L = null, keep = []) {
  const moves = L && SQUAD_CHIPS.has(s.chip) ? pairedMoves(s.sold, s.bought, L, keep) : s.moves.filter((m) => m.ok).map((m) => ({ out: m.out, in: m.in }));
  return {
    gw: s.gw, xi: s.xi, bench: s.bench, squad: s.squad, captain: s.captain, vice: s.vice, chip: s.chip, bank: s.bank,
    ft: s.ft, used: s.used, hits: s.hits, points: s.points, moves, in: moves.map((m) => m.in), out: moves.map((m) => m.out),
    approx: true,
  };
}

/** A phone-only lineup over a week (engine.applyLineup: the one rule GW A as you play it uses too, calls.planFromRoad), re-scored by the one
 *  rule (engine.weekPoints); lineupDelta: what it changes against the plan's own lineup. */
function withLineup(w, lu, L) {
  if (!lu || !['xi', 'bench', 'captain', 'vice'].some((k) => lu[k] != null)) return w;
  const { xi, bench, captain, vice } = E.applyLineup(w, lu, L);
  if (sameSet(xi, w.xi) && sameList(bench, w.bench) && captain === w.captain && vice === w.vice) return w;
  const delta = E.weekPoints({ ...w, xi, bench, captain }, L.xp) - E.weekPoints(w, L.xp);
  return { ...w, xi, bench, captain, vice, points: w.points + delta, lineup: true, lineupDelta: delta };
}
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/** Your phone lineup for GW g (memory's frozenLineups first: a frozen GW's, none since Freeze went, 2026-10-12): GW A's
 *  from plan memory (F7), a later GW's from this device. */
const lineupOf = (ctx, I, gp, g) => gp?.frozenLineups?.[g] ?? (g === I.A ? gp?.lineup : lineups(ctx, I)[g]);
/** The frozen GWs of a plan view (memory's frozen), ascending: none since Freeze went (memory.normalizeAccepted thaws
 *  an older plan's); isFrozen(P, g): GW g is one of them. */
export const frozenOf = (P) => P?.mem?.frozen ?? [];
export const isFrozen = (P, g) => frozenOf(P).includes(Number(g));

/** A road as your plan would draw it: its weeks over the planned GWs with your lineups on them (withLineup). What a
 *  solve of an alternative (a chip prepared with your rules, a Wish, a slide) is measured in against your
 *  plan (P.weeks), so your own subs and armbands never count for or against it (QA: they are reported apart). → {weeks} */
export function asYours(ctx, road, gp = memPlan(ctx)) {
  const I = info(ctx);
  return { weeks: (road?.weeks || []).filter((w) => I.gws.includes(Number(w.gw))).map((w) => withLineup(viewOfRoadWeek(w, I.L), lineupOf(ctx, I, gp, Number(w.gw)), I.L)) };
}

let memo = { key: null, P: null };
/** Plan memory hands out a new plan object on every change (memory.getPlan), and some changes draw nothing: the saved
 *  echo of the document just sent (memory.flush: `saving` goes false, the document gets its updated_epoch), the same
 *  plan written again. The plan view and everything memoised on it (the chips' plans, the moves' gains, the
 *  alternatives) is kept for such a copy: it is never made again, and the screen never re-drawn, for a save. */
const SAME_SKIP = new Set(['saving', 'doc']);
const sameMemPlan = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => SAME_SKIP.has(k) || a[k] === b[k] || JSON.stringify(a[k]) === JSON.stringify(b[k]));
};

export function plan(ctx) {
  const I = info(ctx);
  if (!I || !I.base) return null;
  const gp = ctx.store.get('memory') ?? memPlan(ctx);
  const conn = ctx.store.get('conn')?.state;
  const key = [gp, I.b, I.d, conn, rev];
  if (memo.key && key.every((x, i) => x === memo.key[i])) return memo.P;
  if (memo.key && key.every((x, i) => i === 0 || x === memo.key[i]) && sameMemPlan(gp, memo.key[0])) {
    memo.key = key;
    return memo.P;
  }
  // under the hold, before the solver's first plan for your rules lands, there is none to draw: Ahead waits as for the
  // bake (render's renderBaking; memory.getPlan: never the phone's evaluation of your moves, holdRoad, which drew four
  // Arsenal players on the owner's phone, 2026-10-26: "fix so every squad is solver squad, no hardcoded logic whatsoever
  // so shit like this not happens")
  if (gp?.hold && !gp.road?.weeks?.length) return null;
  const ov = ovOf(ctx, I);
  const road = gp?.road?.weeks?.length ? gp.road : I.base;
  const byGw = new Map(road.weeks.map((w) => [Number(w.gw), w]));
  const pins = gp?.pins || [];
  // B141: after a reload, the week the edit being checked changes (memory's pending.edit), not the earliest pin's
  const pendFrom = gp?.pending ? gp.pending.edit?.gw ?? Math.min(I.end, ...pins.map((p) => num(p.gw) ?? I.A)) : null;
  const from = ov?.from ?? pendFrom;
  // every week is the plan the solver returned (memory's: a bundle road that fits your rules, or a heal's), with your
  // lineups on it; while it plans an edit, the plan before it, its weeks from the edit's on waiting (the shimmer) and
  // the edited week marked (A7). The phone's ≈ of an edit (B56: drawn at once, "never the old plan with the move you
  // just undid", QA-5; a removal's or a Keep's drawn over budget or a club's three, its bank in coral) is never drawn:
  // the owner, 2026-10-26, after a Remove drew four Arsenal players: "fix so every squad is solver squad"
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
  // QA-5 #3: the hits a shown week takes that the rules its road was solved under don't allow, or that its planner never
  // priced (QA-7 #3; memory.forcedHits), never a week waiting on the solver's plan (the full plan says)
  const drawn = (list) => list(road).filter((f) => !approx.has(f.gw));
  const forced = drawn((r) => forcedHits(r, I.gws));
  // F15a: each shown week's hits, FPL's against the planner's (calls.hitBook: a hit the LP books a GW before FPL's order)
  const book = drawn((r) => (hitBook(r) || []).filter((b) => I.gws.includes(b.gw)));
  const cmp = compare(ctx, { weeks }, I.base);
  const edited = weeks.filter((w) => w.lineup);
  const lineupGap = edited.length ? { delta: sum(edited.map((w) => w.lineupDelta ?? 0)), gws: edited.map((w) => w.gw) } : null;
  // your road and the model's are solves of the same data (the planner's counts compare like with like): the model's
  // own road, or a plan solved on these roads' version (not one an older forecast gave, nor the ≈ of an edit)
  const comparable = !ov && !gp?.pending && (gp?.source !== 'yours' || (!gp.stale && !!road.objective));
  // what your rules cost, like with like: against the planner's best with your options (chips, hits, cash) and none of
  // your rules (optionsRef); until it is there: no number (never one that mixes them in)
  const ref = gp?.source !== 'yours' ? I.base : comparable ? optionsRef(ctx, I, pins, road) : null;
  const rules = !comparable || !ref ? null : gp?.source === 'yours' ? rulesCost(inputs(ctx), road, ref) : { cost: 0, label: 'coin', points: 0, transfers: 0 };
  // each week as your team as it is would play it (bareRef: its tile's struck points), scored as yours are
  const bareRoad = bareRef(ctx, I, pins);
  const bare = bareRoad ? new Map(bareRoad.weeks.map((w) => [Number(w.gw), viewOfRoadWeek(w, I.L)])) : null;
  const baseWeeks = new Map(I.base.weeks.map((w) => [Number(w.gw), w]));
  const onLine = !ov && !gp?.pending && weeks.every((w) => {
    const b = baseWeeks.get(w.gw);
    return b && sameSet(w.squad, [...ids(b.xi), ...ids(b.bench)]) && sameSet(w.xi, ids(b.xi)) && (w.chip ?? null) === (b.chip ?? null) && w.captain === num(b.captain);
  });
  const ok = editable(ctx);
  const P = {
    ...I, mem: gp, road, pins, weeks, total, approx, mark, forced, book, healing: !!(ov || gp?.pending), cmp, onLine, bare,
    editable: ok, why: ok ? '' : OFFLINE_EDIT, lineupGap, rules, comparable,
  };
  memo = { key, P };
  return P;
}

/** Options solves (optionsRef), per roads version and options: a Road, 'solving', or 'error' (never asked again). */
const OPTIONS = new Map();
/** A background solve's cache key: the roads version and its values (key order aside). I: info(ctx) or a plan view. */
const valuesKey = (I, values) => solvedKey(I.b.version, values);

/**
 * What your rules' cost is measured against (QA: rules only): the planner's best with your options (chips, hit caps,
 * cash) and none of your rules (memory.optionsRoad, with a locked GW A: an older document's, which the read thaws since
 * Freeze went, 2026-10-12, so none now; a bundle road, or your own plan's road when it has no rule of yours). When none
 * is there (a −4 in GW8 beside a veto), one speculative solve of exactly those pins is asked for
 * (memory.optionsValues), once per those pins and roads version, while this browser's speculative slot is free (a Wish
 * solve keeps it); its landing re-draws. → Road | null (meanwhile).
 */
function optionsRef(ctx, I, pins, road) {
  const found = optionsRoad(I.b.roads, pins, I.gws, [road]);
  if (found || !specOk(ctx, I)) return found;
  return specRoad(ctx, I, optionsValues(inputs(ctx), pins));
}
/** Your team as it is, the plan to compare yours with (the owner, 2026-10-26: "crossed points must appear once any
 *  transfer made and they must cross points without transfers so it can be compared how transfers benefit", "if i
 *  make transfer in first gameweek it also impact all others obvisouly so therre sjould also updated and croessed"):
 *  the solver's plan with none of your rules (Reset plan's: under the hold every week rolled), one speculative solve
 *  per roads version (specRoad); none where the plan has no rule of yours (it is that plan) or while it solves.
 *  → Road | null */
function bareRef(ctx, I, pins) {
  const own = pins.filter((p) => !derivedPin(p));
  return own.length && specOk(ctx, I) ? specRoad(ctx, I, valuesFor(ctx, [], own.map((p) => p.id))) : null;
}
/** A speculative solve can be asked for these roads (the newest, a solver there, this browser not left behind). */
const specOk = (ctx, I) => !!ctx.api?.solve && I.b.version === I.b.meta?.roads_version && !leftBehind(ctx, I);
/** One speculative solve of `values` per roads version (OPTIONS), asked while this browser's speculative slot is free
 *  (a Wish solve keeps it); its landing re-draws. → Road | null (meanwhile). */
function specRoad(ctx, I, values) {
  const key = valuesKey(I, values);
  const got = OPTIONS.get(key);
  if (got?.weeks) return got;
  if (got || ctx.api.slotBusy?.('spec') || ctx.store.get('conn')?.state === 'offline') return null;
  OPTIONS.set(key, 'solving');
  solveKept(ctx.api, { entry: Number(I.entry), purpose: 'speculative', values })
    .then((r) => {
      if (r.road) OPTIONS.set(key, r.road);
      else if (r.state === 'error') OPTIONS.set(key, 'error');
      else {
        OPTIONS.delete(key);  // superseded (a suggested plan's fork, a Wish solve took the slot) or cancelled
        // asked again once the slot is free: the re-draw then asks it (api.whenFree)
        if (r.state === 'superseded') ctx.api.whenFree?.('spec').then(() => { if (attach()?.ctx === ctx) bump(ctx); });
      }
      bump(ctx);
    }, () => OPTIONS.delete(key));
  return null;
}

export const weekOf = (P, g) => P?.weeks?.find((w) => w.gw === Number(g)) ?? null;

/** The squad going into GW g's moves (memory.squadInto: a free hit's squad is thrown away, team.py:161, 175). */
export const squadBefore = (P, g) => squadInto((x) => weekOf(P, x), g, P.A, P.owned);

/** The players "in your team" for a buy in GW g (Replace's "In team"): the squad going in and the week's own (the
 *  reviews, 2026-10-11, High: a player the week already buys was offered, and picking him cancelled that transfer, its
 *  rule left behind); never the week's alone, whose sales would then be buyable again. → Set(id) */
export const inTeamAt = (P, g) => new Set([...squadBefore(P, g), ...(weekOf(P, g)?.squad ?? [])]);

/** M9 / M5: {id: name} for the players week w buys, each with the player he comes in for (pitch.js: the ink name plate, the
 *  player he replaces said on his card; the pitch tags only the viewed GW's own moves, never a later sale). A Wildcard or Free Hit week is a new
 *  squad, not swaps: each buy is just "IN" (true; the user, 2026-10-07: "for someone" makes no sense there). */
export function inFor(P, w) {
  const out = {};
  const squad = w?.chip === 'wc' || w?.chip === 'fh';
  for (const m of w?.moves || []) out[m.in] = squad ? true : P.L.name(m.out);
  return out;
}

/** {id: gw} for the players of GW g's squad who are not in the real squad (F16, the pitch's IN marker): the GW each was
 *  bought in, his latest arrival up to g (a Free Hit week's own buys are that week's). */
export function boughtIn(P, g) {
  const out = {};
  for (const id of weekOf(P, g)?.squad ?? []) {
    if (!P.owned.includes(id)) out[id] = P.weeks.filter((x) => x.gw <= g && x.in.includes(id)).at(-1)?.gw ?? g;
  }
  return out;
}

// ---------------------------------------------------------------- phone estimates (the engine, instantly)

/** The plan as an engine draft: your road's, the solver's (with the phone lineups); never an edit's ≈ (none since the
 *  owner, 2026-10-26: "fix so every squad is solver squad"), so every choice is measured against the plan drawn. */
export function draftOf(ctx) {
  const P = plan(ctx);
  let d = roadDraft(ctx, P.road);
  for (const w of P.weeks) if (w.lineup) d = E.setLineup(d, w.gw, { xi: w.xi, bench: w.bench, captain: w.captain, vice: w.vice });
  return d;
}

/** evaluate() with the lineups from `from` on left to the engine (best XI per week, §5.7 "Best for plan"). */
export function estimate(ctx, draft, from) {
  const I = info(ctx);
  let d = draft;
  for (const g of I.gws) if (g >= from && d.lineups?.[g]) d = E.setLineup(d, g, null);
  return E.evaluate({ base: baseOf(ctx), players: I.d.players, draft: d, horizon: I.gws });
}

/** The shell's bundle as calls.js reads it (planInputs) from the bank your plan starts from (baseOf), memoised per
 *  derived data and base. */
const INPUTS = new WeakMap();
export function inputsOf(ctx) {
  const base = baseOf(ctx);
  let c = INPUTS.get(ctx.data);
  if (!c || c.b !== ctx.bundle || c.base !== base) INPUTS.set(ctx.data, (c = { b: ctx.bundle, base, inputs: planInputs(ctx.bundle, { ...ctx.data, base }) }));
  return c.inputs;
}
const inputs = inputsOf;
/** calls.compare: the one measure. */
export const compare = (ctx, a, b) => compareIn(inputs(ctx), a, b);
/** calls.counted: a choice's number, the solver's own count over GW g's window where solved roads a and b carry it. */
const ownCount = (ctx, cmp, a, b, g) => countedIn(inputs(ctx), cmp, a, b, g);

/** The plan as it stands, estimated from GW `from` (memoised per plan view): what an edit is measured against. */
const BASELINES = new WeakMap();
export function baseline(ctx, from) {
  const P = plan(ctx);
  if (!P) return null;
  let m = BASELINES.get(P);
  if (!m) BASELINES.set(P, (m = new Map()));
  if (!m.has(from)) m.set(from, estimate(ctx, draftOf(ctx), from));
  return m.get(from);
}

const clubCounts = (L, squad) => {
  const n = new Map();
  for (const p of squad || []) { const c = L.club(p); if (c) n.set(c, (n.get(c) || 0) + 1); }
  return n;
};

/**
 * The reasons (from GW `from`) the phone blocks an edit before any solve (§5.5, §7.9), all those of the first week
 * that has one, else []: a move that can't be made (alone), else a week's bank and each club count the edit makes
 * worse than the plan already has it (the plan's own shortfall, e.g. the solver's price for a sale FPL now pays
 * £0.1m less for, is not the edit's: it shows on its tick, PC-1). short: what the edit adds to that week's
 * shortfall. All of them where a pair's move alone says what it lacks (fitOf: the user, 2026-10-26, Leno → Raya
 * "£1.3m short · needs Calafiori's and João Pedro's sales", Raya a 4th Arsenal player: "why three transfers depend
 * on each other if raya+evanilson are affordable without selling califiori"); problemOf the first.
 */
export function problemsOf(ctx, ev, from) {
  const I = info(ctx);
  const before = baseline(ctx, from);
  for (const s of ev.gws.filter((x) => x.gw >= from)) {
    const b = before?.gws.find((x) => x.gw === s.gw);
    const bad = s.moves.find((m) => !m.ok);
    if (bad) return [{ code: 'move', gw: s.gw, reason: bad.reason }];
    const out = [];
    const was = Math.min(0, b?.bank ?? 0);
    if (s.bank < -1e-9 && s.bank < was - 1e-9) out.push({ code: 'budget', gw: s.gw, short: was - s.bank });
    const had = clubCounts(I.L, b?.squad);
    for (const [club, n] of clubCounts(I.L, s.squad)) if (n > E.MAX_PER_CLUB && n > (had.get(club) ?? 0)) out.push({ code: 'club', gw: s.gw, club, count: n });
    if (out.length) return out;
  }
  return [];
}
export const problemOf = (ctx, ev, from) => problemsOf(ctx, ev, from)[0] ?? null;

/** A problem (problemOf, findBuy's) in one line; `name`: the buy's, where the caller knows it (B53b: "Groß needs £1.2m
 *  more in GW6.", not "Needs …"). */
export function problemText(ctx, p, name = null) {
  if (!p) return '';
  // A3: never "Try GW7" unless GW7 fits (the caller that knows says it: buyProblem)
  if (p.code === 'budget') return COPY.noFit(name, p.short, p.gw);
  if (p.code === 'club') return COPY.club(p.count, p.club, p.gw);
  if (p.code === 'kept') {
    // B8 (findBuy): each by the first GW your Keep holds him, "Scott is kept in GW6. Rogers is kept in GW7."
    const by = new Map();
    for (const [id, gw] of p.kept) by.set(gw, [...(by.get(gw) ?? []), info(ctx).L.name(id)]);
    return [...by].map(([gw, names]) => COPY.keptIn(names, gw)).join(' ');
  }
  return COPY.infeasible(p.gw);
}
/** …as a list row says it in its number's place (Replace's blocked row; a pair's move the week can't make alone, in
 *  his place: plansOf `needs`): "£1.2m short", "3 from ARS", else "can't fit". Pure. */
export const problemShort = (p) => (p?.code === 'budget' ? COPY.moneyShort(p.short) : p?.code === 'club' ? COPY.clubFull(p.club) : "can't fit");

const flatMoves = (draft) => Object.entries(draft?.moves || {})
  .flatMap(([g, ms]) => (ms || []).map((m) => ({ gw: Number(g), out: Number(m.out), in: Number(m.in) })));
const withMoves = (draft, list) => {
  const moves = {};
  for (const m of list) if (m.out !== m.in) (moves[m.gw] ||= []).push({ out: m.out, in: m.in });
  return { ...draft, moves };
};
const sameMove = (a, b) => a.gw === b.gw && a.out === b.out && a.in === b.in;

/** Same sale, a different buy (a later sale of the old buy now sells the new one). */
function swapIn(list, m, inn) {
  return list.map((x) => (sameMove(x, m) ? { ...x, in: inn } : x.gw > m.gw && x.out === m.in ? { ...x, out: inn } : x))
    .filter((x) => !(!sameMove(x, { ...m, in: inn }) && x.gw > m.gw && x.in === inn));
}

/**
 * Sell `out` from GW g for `inn` on a draft, as the shirt-drop means it: a move already selling him that GW
 * just changes its buy; a later buy of `inn` is void; a later sale of `out` is either dropped or carried onto
 * `inn`. Every variant is estimated (`measure`: bestOf's); the legal one with the most points wins → {draft, ev, problem}.
 */
export function addMove(ctx, draft, g, out, inn, measure = null) {
  const list = flatMoves(draft);
  const variants = [];
  const same = list.find((x) => x.gw === g && x.out === out);
  if (same) variants.push(swapIn(list, same, inn));
  else {
    const kept = list.filter((x) => !(x.gw >= g && x.in === inn));
    const later = kept.filter((x) => x.gw > g && x.out === out);
    const add = (l) => [...l, { gw: g, out, in: inn }];
    variants.push(add(kept.filter((x) => !later.includes(x))));
    if (later.length) variants.push(add(kept.map((x) => (later.includes(x) ? { ...x, out: inn } : x))));
  }
  return bestOf(ctx, variants.map((v) => withMoves(draft, v)), g, measure);
}

/** `measure(d, from)` → evaluate's state: estimate by default (best XI from `from` on); takenBy for a number the tap
 *  or your row must give. */
function bestOf(ctx, drafts, from, measure = null) {
  return drafts.map((d) => {
    const ev = measure ? measure(d, from) : estimate(ctx, d, from);
    return { draft: d, ev, problem: problemOf(ctx, ev, from) };
  }).sort((a, b) => (!!a.problem - !!b.problem) || (b.ev.total - a.ev.total))[0];
}

/** The players plan view P moves (sells or buys) in GW g or later: Set(id). A new move of one of them in GW g changes
 *  that transfer unsaid (addMove swaps its buy, voids a later buy of him, drops or carries a later sale of his) and his
 *  sale rule would overwrite his own (one 'sell:<id>' a player), so a suggestion, a row's other buy and a bring-in's
 *  sale never use one (the checker, 2026-10-09: GW6's "Scott → Groß" + said "Groß in" and took your GW7 move). Never
 *  a Wildcard or Free Hit week's changes (squadWeek): the chip picks a whole squad, no transfer of yours, so a GW9 Free
 *  Hit's twelve swaps barred every GW6 suggestion and bring-in sale (the user's phone, 2026-10-10: TORPEDO's GW6 showed
 *  only the pair, Scott → Groß +4.9 and Konsa → Vuskovic +3.2 dropped as "moved later"). `own`: your moves only
 *  (pinOfMove; review 5, 2026-10-12: a later week Forkcast plans is re-planned around a new move, so its moves
 *  emptied GW7's choices). */
const movedFrom = (P, g, own = false) => new Set(P.weeks.filter((w) => w.gw >= g && !squadWeek(w))
  .flatMap((w) => (w.moves || []).filter((m) => !own || pinOfMove(P, m)).flatMap((m) => [m.out, m.in])));

/** Drop a move: keep the player it sold (a later sale of the player it bought now sells him). */
export function dropMove(draft, m) {
  const list = flatMoves(draft);
  return withMoves(draft, list.filter((x) => !sameMove(x, m)).map((x) => (x.gw > m.gw && x.out === m.in ? { ...x, out: m.out } : x)));
}
/** The draft's own move for transfer x ({gw, out, in}) | undefined, and the draft without it (dropMove; as it is when
 *  it has none): what a take's sale frees (addPlan's funder) and a bring-in measured without your later buys of him. */
const draftMove = (d, x) => flatMoves(d).find((y) => sameMove(y, x));
const dropDrafted = (d, x) => { const y = draftMove(d, x); return y ? dropMove(d, y) : d; };

// ---------------------------------------------------------------- pins and solves

/** "Him from GW g" (Wish): memory's wish pin plus "not before g", so each arrival pill is its week. */
export function wishPin(P, id, g) {
  // a Wildcard or Free Hit week: him in that week's chip squad, the rest of it the solver's (the user, 2026-10-12:
  // "if i use wildcard or free hit and click bring in player … not recalculate wildcard with this player in": he came in
  // for one of your squad as a sale to the window's end, so a Free Hit sold Saka for good)
  const chip = squadWeek(weekOf(P, g));
  if (chip) return makePin({ id: `wish:${id}`, kind: 'wish', chip, player: Number(id), gw: g, label: `${P.L.name(id)} in your GW${g} ${chipName(chip)}`, must: [[id, g, g]] });
  return makePin({
    id: `wish:${id}`, kind: 'wish', player: Number(id), gw: g, label: `${P.L.name(id)} from GW${g}`,
    must: [[id, g, P.end]], excl: g > P.A ? [[id, P.A, g - 1]] : [],
  });
}

/** Whether pin p is a Wildcard or Free Hit week's pick (wishPin's `chip`: him in that week's chip squad alone). */
export const isPick = (p) => p?.kind === 'wish' && !!p.chip;
/** The wish of player `id` an edit buying him drops ([id]), but never a chip week's pick: that stands beside the buy,
 *  or goes named where they clash (clashing; review 5, 2026-10-12: a later buy, a Replace or a plan's + dropped it
 *  unsaid). */
const wishDrop = (P, id) => (isPick(asksOf(P).find((p) => p.id === `wish:${id}`)) ? [] : [`wish:${id}`]);
/** Your picks (isPick) of the GWs `gws`: [Pin]. A chip that goes or moves takes its week's with it, named. */
const picksAt = (P, gws) => asksOf(P).filter((p) => isPick(p) && gws.includes(Number(p.gw)));

/** memory.values() for your pins as an edit adding `extra` and dropping the pins `drop` (ids) would leave them (never
 *  kept: memory.pinsAfter): POST /api/m/solve values (engine.solveValues), the same values that edit's heal sends. */
export const valuesFor = (ctx, extra = [], drop = []) => memOf(ctx).values({ extra, drop });

/** One solve of your pins plus `extra`, less the pins `drop` (ids) → memory.solveKept (api.solve; a road that drops a
 *  rule it was solved for is an error: resolves {state, road, error}; .cancel()). */
export function solveFor(ctx, extra, purpose, drop = []) {
  const I = info(ctx);
  const go = () => solveKept(ctx.api, { entry: Number(I.entry), purpose, values: valuesFor(ctx, extra, drop) });
  // The plan service runs one user-class solve per browser and a newer one supersedes the older
  // (api/mobile.py solve_post): a user-class solve waits for a pending plan heal instead of
  // cancelling it (which would leave the edit waiting until the next change).
  if (ctx.api.SOLVE_CLASS[purpose] !== 'user') return go();
  let inner = null, stopped = false;
  const p = memOf(ctx).settled().then(() => (stopped ? { key: null, state: 'cancelled', road: null, error: null } : (inner = go())));
  p.cancel = () => { stopped = true; inner?.cancel?.(); };
  return p;
}

/** The bundle road that already is your plan with `extra` pinned too and the pins `drop` (ids) taken off
 *  (memory.findRoad), else null. */
export function baked(ctx, extra = [], drop = [], P = plan(ctx)) {
  const c = composePins([...P.pins.filter((p) => !drop.includes(p.id)), ...extra], { from: P.A, to: P.end });
  return findRoad(P.b.roads, c, P.gws);
}

// ---------------------------------------------------------------- edits: rules now, the solver's plan, the verdict

const BACK = 'Back to the suggested plan.';
/** The roads version a plan view's road was solved on (the model's road: the roads'), for like-with-like counts. */
const roadVersion = (P) => (P?.mem?.source === 'yours' ? P.mem.road?.version ?? null : P?.mem?.version ?? null);
/** The planner's own count of solved road `road` (of roads version v) against plan view prev (calls.plannerOf), when
 *  both are solves of the same data. */
const plannerVs = (road, v, prev) => (prev?.comparable && v && v === roadVersion(prev) ? plannerOf(road, prev.road) : null);
/** …of plan view Q against prev. */
export const plannerFor = (Q, prev) => (Q?.comparable ? plannerVs(Q.road, roadVersion(Q), prev) : null);
/** Which way pins `before` → `after` move the planner's freedom over the plan's GWs (memory.pinsDir: 'restrict' |
 *  'relax' | null; a chip, cash or a change both ways is null). I: a plan view (or info). */
const dirOf = (I, before, after) => pinsDir(before, after, { from: I.A, to: I.end });
/** The verdict of an edit against the plan before it (calls.changeText: the points, and the planner's own count when
 *  it parts from them, read against the way your pins moved: dirOf, never a label an edit gives itself); `total`: its
 *  number named as what your total moves by (changeText's). */
const vsPrev = (ctx, what, { total = false } = {}) => (Q, prev) => changeText(typeof what === 'function' ? what(Q) : what,
  compare(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }), {
    dir: dirOf(Q, prev.pins, Q.pins), gws: Q.gws, transfers: [transfersOf(prev), transfersOf(Q)], planner: plannerFor(Q, prev), noise: Q.noise, total,
  });
/** An edit's verdict with its points and its ending (endingOf) even when it lands at once (edit's `text`): for an edit
 *  whose row leaves the screen (a removal, a move to another week), where B24's "its number is on its row" fails (the
 *  reviews, 2026-10-11). `total`: vsPrev's. */
const withPoints = (ctx, what, ending, { total = false } = {}) => (Q, prev) => `${vsPrev(ctx, what, { total })(Q, prev)}${ending(Q, prev)}`;
/** The verdict of a rule that may leave the plan as it is (a Keep of a player it doesn't sell then, a Never of one it
 *  doesn't buy): `same(Q)` when it took no rule of yours off (`drop`: their ids) and the full plan kept every week's
 *  squad and points, else `changed(Q, prev)` (vsPrev, withPoints). A veto's rescope (Never from its chip) passes the
 *  rule it was too, so it says what the change did, before → after; a Keep passes only the rules it takes back, the Keep
 *  of his it remakes being none: its words say its weeks now ("kept in GW8", "kept through GW11"), true whichever it was
 *  (QA: never "keeps him already" over a wider Keep it lifted; the user, 2026-10-21: fix the known issues: the phone's
 *  "Gabriel kept in GW8 · 0.0 pts" after GW8–11 and "…: suggestions won't sell him" after Off, for one plan). */
const vsPrevOr = (ctx, same, drop, changed) => (Q, prev) => {
  const kept = !drop.length && Q.weeks.every((w) => sameSet(w.squad, weekOf(prev, w.gw)?.squad ?? []))
    && Math.abs(compare(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }).delta) < 1e-6;
  return kept ? same(Q) : changed(Q, prev);
};

/** The shell's toast (ctx.ui: app.js passes ui.js; the node tests a recorder), so the plan view needs no DOM; none while
 *  a tap's edit is made dry (DRY: presolve), which says nothing. */
const toastOf = (ctx) => (DRY ? () => () => {} : ctx.ui?.toast ?? toast);
let lastSay = null;  // the verdict toast on screen: a newer edit replaces it (UX-7)
/** An edit's pending toast while the full plan checks it: {said, toast (its dismiss), text}, for pendingTick. */
let PENDING = null;
function say(ctx, text, undo, kind = 'info', tag = null, more = [], take = null) {
  // B23 (review3 A9: the pending toast left after 6.5 s, and the verdict came in as a new toast whose Undo was dead
  // for its entrance): the pending toast is never dismissed first; what follows it (its verdict, its failure, a chained
  // edit's) changes it in place (ui.toast replaces), so its Undo takes a tap throughout. `more`: actions before its
  // Undo (B89: a failed check's "Try again"); `take`: a take's receipt, the clauses of its words that may clip (ui.toast's
  // two rows: addPlan)
  if (lastSay !== PENDING?.toast) lastSay?.();
  const action = undo ? { label: 'Undo', onClick: undo } : undefined;
  lastSay = toastOf(ctx)(text, kind, { timeout: kind === 'info' ? 6500 : 9000, action, actions: more.length ? [...more, action].filter(Boolean) : undefined, tag, replaces: 'pending', take });
  PENDING = null;
}
/** An edit's pending toast ("Checking Groß in…", tag 'pending'), its Undo `back` (undoOf), kept as PENDING for
 *  pendingTick; `more`: PENDING's other fields (reopened: B141's). */
function sayPending(ctx, said, back, more = {}) {
  say(ctx, COPY.pendingEdit(said), back ? undoOf(ctx, said, back) : null, 'info', 'pending');
  PENDING = { said, toast: lastSay, text: COPY.pendingEdit(said), ...more };
}
/** The full plan checks edit `ov`: its receipt (memory.noteEdit: a reload meanwhile still says what it did, and marks the
 *  week it changes), which names the chain whole and takes all of it back, as its number (memory's plan before the
 *  chain's first edit) counts it, and the newest edit's pending toast (pendingSay, B133). */
function checkEdit(ctx, ov) {
  const mem = memOf(ctx), chain = ov.chain;
  mem.noteEdit({ what: chainSaid(chain), dir: dirOf(info(ctx), chain[0].snap.pins, mem.getPlan().pins), pins: chain[0].snap.pins, edit: ov.from });
  pendingSay(ctx, chain);
}
/**
 * B24 (review3 Part 4 §9, podmajersky P3 §6: after an Undo nothing was said and the total flashed a red loss): every
 * Undo `say` hands out. `fn` goes back, the plan it brings is marked an Undo's (FLASH.undo: the total's change in plain
 * ink) and lands as an edit's does (changedOf: its tiles and cards tint once; the weeks `fn` flashes itself kept), and
 * one short toast with no button says so in the edit's own words ("Undone: Groß in your plan", COPY.undone), through
 * the live region (the total is aria-hidden). K4 (HIG Undo and redo, the pitch research 2026-10-19): when the week on
 * screen shows none of it (its tile unchanged), the first week it changed is shown, by the screen's own switch (GO_GW),
 * and the toast names it ("… · GW7") where its words don't (COPY.undone). An edit's pending
 * toast goes first: say would change it in place, and its button's own dismiss would then take the words away. A way
 * back that could not go (`fn` → false: memory's undo after another change) says nothing, and one that made the edit
 * before it the edit again (`fn` → 'again': undoNewest, B133) leaves that edit's own toast up, its Undo on it.
 */
const undoOf = (ctx, words, fn) => () => {
  const t = Date.now();
  const before = plan(ctx);
  const r = fn();
  if (r === false) return;
  bump(ctx);
  const after = plan(ctx);
  const ch = before && after ? changedOf(after, before) : { gws: [], rows: {}, cards: {} };
  setFlash(after ?? before, { ...(FLASH?.at >= t ? FLASH : ch), undo: true });
  // the edit before it made again ('again') speaks for itself: no switch under its toast
  const g = r === 'again' || !after ? null : viewedGw(ctx, after);
  const to = g != null && !ch.gws.includes(g) ? after.gws.find((x) => ch.gws.includes(x)) ?? null : null;
  if (to != null) (GO_GW ?? ((x) => ctx.store.set('gw', x)))(to);
  if (r === 'again') return;
  if (PENDING) { PENDING.toast?.(); PENDING = null; }
  say(ctx, COPY.undone(words, to), null);
};
/** A sentence toast's act, its words before the first ": " ("Plan reset": COPY.planReset's): what its Undo names. */
const subjectOf = (text) => text.split(': ')[0];
const PENDING_AGE_S = 5;  // B23: the pending toast shows how long the check has run from then on
/** B23: the pending toast as its check goes on (mount's tick, every second; the toast changes in place, no new line):
 *  from PENDING_AGE_S its age after the ellipsis, on the bake's clock (clockText), and while the server is away the
 *  wait it is in (memory's pending.state 'offline'). A toast with no update() (the node tests') stays as it is. */
export function pendingTick(ctx) {
  const p = PENDING && memPlan(ctx)?.pending;
  if (PENDING?.reopened && !p?.edit) PENDING = null;  // B141: its check is over (memory.receipt spoke in its place)
  if (!p || !PENDING) return;
  const s = (Date.now() - p.since) / 1000;
  const text = p.state === 'offline' ? COPY.pendingOffline(PENDING.said) : COPY.pendingEdit(PENDING.said, s >= PENDING_AGE_S ? clockText(s) : null);
  if (text === PENDING.text) return;
  PENDING.text = text;
  PENDING.toast?.update?.(text);
}
let REOPENED = null;  // the receipt (its `at`) pendingAgain raised its toast for: once per page
/** B141 (review3 Part 4 §11: the app reopened during a check showed neither your edit nor its wait): an edit noted before
 *  the reload whose check is the one running (memory's pending.edit) has its pending toast again, as edit raised it,
 *  its Undo your rules as they were before it (memory.restorePins); its verdict takes this toast's place (memory.receipt,
 *  replaces 'pending'), and its week is the one marked waiting (plan's pendFrom). Mount's render, every draw. */
export function pendingAgain(ctx, gp = memPlan(ctx)) {
  const e = gp?.pending?.edit;
  if (!e || ovOf(ctx, info(ctx)) || REOPENED === e.at) return;
  REOPENED = e.at;
  const mem = memOf(ctx);
  sayPending(ctx, e.what, Array.isArray(e.pins) ? () => { mem.claimEdit(); return mem.restorePins(e.pins); } : null, { reopened: true });
}

/** B22 (review3 A4: the "Updated forecast" toast left after 4.5 s with no button, and your plan then stood behind the
 *  drift, no longer following the forecast): memory's drift `d` said as a toast with one action, "Use it" (memory's
 *  switchWithUndo: its own toast and Undo), which stays
 *  until your next touch; gone any other way (a touch elsewhere, a newer toast with an action, its ×) your plan is
 *  kept (keepMine), so it re-plans on the new forecast with your rules. Either, only while `d` is the drift standing. */
export function driftSay(ctx, d) {
  const standing = () => memPlan(ctx)?.drift?.version === d.version;
  return toastOf(ctx)(d.text, 'info', {
    // what the tap does (the reviews, 2026-10-11: "Use it" re-planned on your rules when the new plan ignored one)
    action: { label: COPY.driftAct(d), onClick: () => { if (standing()) switchWithUndo(ctx); } },
    onDismiss: () => { if (standing()) memOf(ctx).keepMine(); },
  });
}

/** The line every GW (COPY.cheerLine; the user, 2026-10-21: "just every gameweek"): this browser's CHEER_KEY(entry),
 *  {s: the season, gw: the GW last said} (ctx.api.local, as WAIT_KEY), and the GW said on this page (CHEERED: a store
 *  that keeps nothing still says it once a page). */
const CHEER_KEY = (entry) => `fc:cheer:${entry}`;
const CHEER_MS = 8000;
let CHEERED = { local: null, said: null };
/** The bundle's rank.cheer (api/cheer.py) in `el`, its place under the status bar over the GW tiles' top (m-ahead.css
 *  .ah-cheer; a toast lay over the header: the owner, 2026-10-27, "display always when there is waiting time and
 *  planning at load but not overlap status bar"): for as long as it waits (`planning`: a bake, a new forecast's, the
 *  forecast updating, and on a first load the checks of its moves after it: the owner, 2026-10-27, "that cheer-up note
 *  not dissappear when it goes from planning to checking") the wait's lines, both where they fit the panel (app.js
 *  factPanel; the owner, 2026-10-29), else the one for its act (calls.waitFact, `act` 0 while it plans: your rank's move;
 *  1 while it checks: this line; design study 1027a, B-facts), and
 *  otherwise this line alone once a GW and team on this browser (CHEER_KEY, written as it shows; one said while
 *  planning counts) for CHEER_MS, while no sheet is open (else the next draw asks again). Only from a live bundle (a
 *  warm start's saved one may be a GW past: the review, 2026-10-21), never offline. Mount's renderWeek, every draw,
 *  last. P: a plan view. → whether it shows */
export function sayCheer(ctx, P, el, planning = false, act = 0, { linger = false } = {}) {
  const c = P?.b?.rank?.cheer, local = ctx.api?.local, cs = ctx.store.get('conn');
  const show = (on) => {
    clearTimeout(el._cheerT);
    // (both lines where they fit, else the act's: app.js factPanel; outside a wait the GW's line, the second)
    return !!ctx.factPanel?.(el, on ? waitFacts(P.b) : null, on ? waitFact(P.b, planning ? act : 1) : null);
  };
  if (!el) return false;
  if (!c || !local || cs?.snapshot || cs?.state === 'offline') return show(false);
  const k = CHEER_KEY(P.entry), s = P.season, sig = `${P.entry}:${s}:${c.gw}`;
  const was = local.json(k);
  const said = (was?.s === s && was.gw === c.gw) || (CHEERED.local === local && CHEERED.said === sig);
  if (!planning && (said || ctx.sheets?.depth?.())) return el.dataset.planning ? show(false) : !el.hidden;
  // (`linger`: a wait's act said once its wait has ended, up for CHEER_MS as the once-a-GW line is, never taken down by
  // the next draw: the plan's second act where its checks ended while it planned)
  el.dataset.planning = planning && !linger ? '1' : '';
  if (!said) {
    CHEERED = { local, said: sig };
    local.set(k, JSON.stringify({ s, gw: c.gw }));
  }
  const up = show(true);
  if (!planning || linger) el._cheerT = setTimeout(() => show(false), CHEER_MS);
  return up;
}

/** The state an edit can be undone to: memory's pins and plan, You → Hits (hitsMax), GW A's lineup, the later GWs' lineups and the moves you removed (B129). */
function snapshot(ctx) {
  const I = info(ctx), gp = memPlan(ctx);
  // (its road only where it is the plan solved for these rules: none while one is solved or after a failure, so an Undo
  // never stamps an older plan as theirs; reviewer 1 of solversquad, 2026-10-26)
  return { pins: clone(gp?.pins || []), road: gp?.source === 'yours' && !gp.pending && !gp.error ? clone(gp.road) : null, hitsMax: gp?.hitsMax ?? null, lineup: clone(gp?.lineup ?? null), lus: clone(lineups(ctx, I)), removed: clone(removedBy(I)) };
}
/** Memory's derived pins (the hold's, You → Hits'): never removed or added by an Undo, made again from the rest. */
const derivedPin = (p) => p.id === 'hold' || p.id === 'hits';

// (a Roll's caps too: the Undo of a move taken under "No transfers · GW8" brings that back, never its "Only your
// transfers · GW8" with none; the first-use run's fixes, 2026-10-21)
const pinSig = (p) => JSON.stringify([p.id, p.must, p.excl, p.max_hits ?? 0, p.hits ?? null, p.chips ?? null, p.cash ?? null, p.funds ?? null, p.caps ?? null]);

/** Undo: memory's pins, plan and lineup back as they were (memory's own undo stops at the next write, and a
 *  heal landing is one), the phone lineups and the moves you removed. */
function restore(ctx, snap) {
  const mem = memOf(ctx);
  OV = null;
  mem.batch(() => restoreIn(ctx, mem, snap));
}
/** restore's changes, planned once (memory.batch). */
function restoreIn(ctx, mem, snap) {
  const I = info(ctx);
  removedBy(I);
  REMOVED.by = clone(snap.removed ?? {});
  const want = new Map(snap.pins.map((p) => [p.id, p]));
  // the hits setting first (the rules then read as they were made under it); the hold's and the setting's pins are
  // derived from the rest (memory.holdOf, withHits): never removed or added here
  if ((mem.getPlan().hitsMax ?? null) !== (snap.hitsMax ?? null)) mem.setHitsMax(snap.hitsMax ?? null);
  for (const p of mem.getPlan().pins) if (p.id !== 'road' && !derivedPin(p) && (!want.has(p.id) || pinSig(want.get(p.id)) !== pinSig(p))) mem.removePin(p.id);
  const have = new Map(mem.getPlan().pins.map((p) => [p.id, p]));
  for (const p of snap.pins) if (!derivedPin(p) && (!have.has(p.id) || pinSig(have.get(p.id)) !== pinSig(p))) mem.addPin(p);
  // in their order too (rulesOf shows them newest first): a rule Undo brings back sits where it was, not on top (A6)
  const now = new Map(mem.getPlan().pins.map((p) => [p.id, p]));
  const order = (ps) => ps.filter((p) => !derivedPin(p)).map((p) => p.id).filter((id) => id !== 'road').join();
  if (order(mem.getPlan().pins) !== order(snap.pins)) {
    mem.restorePins([...mem.getPlan().pins.filter((p) => !want.has(p.id)), ...snap.pins.map((p) => now.get(p.id) ?? p)]);
  }
  if (snap.road) mem.setPlan(snap.road, { why: 'undo' });
  mem.markSeen();
  if (JSON.stringify(mem.getPlan().lineup ?? null) !== JSON.stringify(snap.lineup)) mem.setLineup(Object.fromEntries(['xi', 'bench', 'captain', 'vice'].map((k) => [k, snap.lineup?.[k] ?? null])));
  setLineups(ctx, I, snap.lus || {});
}

let listening = null;
/** Memory tells Ahead when its heal lands ('plan') or fails ('error'); Ahead then speaks (once per page). */
function listen(ctx) {
  const mem = memOf(ctx);
  if (!mem || listening === mem) return;
  listening = mem;
  mem.onChange((gp, why) => {
    // (never another team's or GW's landing: a switch mid-solve; reviewer 2 of solversquad, 2026-10-26)
    if (!OV?.armed || OV.mem !== mem || OV.entry !== String(gp.entry) || OV.A !== gp.gw) return;
    if (why === 'plan' && !gp.pending) land(ctx);
    else if (why === 'error') fail(ctx, gp.error);
    else if (why === 'heal' && !gp.pending) {
      // a heal that ended with neither a plan nor an error (cancelled or superseded by the plan service, the rules
      // already planned): once the re-plan it may start has had its turn, the edit lands on the plan for its rules, or
      // says it couldn't finish, with Try again; never "Checking…" for ever (reviewer 2 of solversquad, 2026-10-26)
      const ov = OV;
      setTimeout(() => {
        const now = memPlan(ctx);
        if (OV !== ov || !ov.armed || !now || now.pending) return;
        if (now.error) fail(ctx, now.error);
        else if (now.current) land(ctx);
        else fail(ctx, { code: 'solver', plain: COPY.unfinished });
      }, 0);
    }
  });
}

/** The edit's plan has landed: its verdict. instant: it landed in the edit's own tap (a baked or prepared road fitted),
 *  so it says what happened in its own words (B24: ov.plain). */
function land(ctx, { instant = false } = {}) {
  const ov = OV;
  OV = null;
  CLASH = null;
  bump(ctx);
  const P = plan(ctx);
  // B61: what it changed against the plan before the edit, flashed once and marked until shown (mount's render)
  setFlash(P, changedOf(P, ov.prevP));
  // B24 (review3 Part 4 §9: "+7.5" three times): landed at once, the default verdict says what happened (the edit's
  // words and its ending, ov.plain), its number on the total and its row; after a check, its points
  const verdict = instant && ov.plain ? ov.plain : ov.text;
  // QA-5 #3: a hit the new plan takes that its rules don't allow is said with it, plainly
  const line = withForced(verdict(P, ov.prevP), P.forced, ov.prevP?.forced);
  memOf(ctx).markSeen();  // your own edit is not "new data re-planned your pencil weeks" (§5.5)
  memOf(ctx).claimEdit();  // this toast is its receipt
  // B133: the newest edit's verdict, against the plan before it (ov.prevP), and its Undo takes back that one only (B24:
  // said once, "Undone: …": undoOf), its other actions before it (edit's `more`)
  say(ctx, line, undoOf(ctx, chainSaid(ov.chain.slice(-1)), () => undoNewest(ctx, ov.chain)), 'info', null, ov.more ?? [], ov.take ?? null);
}
/** B61 (johnson A6: nothing marked where a change landed): the weeks plan view Q changes against `prev` (weekChanged),
 *  each one's transfers `prev` didn't make there and its cards that changed (changedCards). → {gws, rows: {gw:
 *  [`${out}>${in}`]}, cards: {gw: [id]}} */
export function changedOf(Q, prev) {
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
/** The transfers of week `w` the same week `b` before didn't make. → [`${out}>${in}`] */
const freshMoves = (w, b) => {
  const key = (m) => `${m.out}>${m.in}`;
  const was = new Set((b?.moves || []).map(key));
  return w.moves.map(key).filter((k) => !was.has(k));
};
/** Week `w` changed against the same week `b` before (none: changed): a squad, a move, the chip, the captain or the
 *  points by 0.05 or more. Pure. */
export const weekChanged = (w, b) => !b || freshMoves(w, b).length > 0 || w.moves.length !== b.moves.length || !sameSet(w.squad, b.squad)
  || (w.chip ?? null) !== (b.chip ?? null) || w.captain !== b.captain || Math.abs(w.points - b.points) >= 0.05;
/** The struck points of week `w`'s tile (renderRail; the owner, 2026-10-26, picked "Struck old points", then "they must
 *  cross points without transfers"): week `was`'s points (your team as it is: P.bare, bareRef) as the tile shows points,
 *  where that shows another number than `w`'s; null where it shows the same, or there is no `was`. The week's own
 *  forecast, no sign: never a choice's number, so "vs rolling everywhere" is not its rule (DECISION.md). Pure. →
 *  string | null */
export const tickWas = (w, was) => {
  const then = was ? fmt.num(was.points) : null;
  return then != null && then !== fmt.num(w.points) ? then : null;
};
/** The window's total as a draw shows it (renderTotal): `tot` the last drawn ({v, before: the totals each change drawn
 *  since replaced, newest last}) or null, `v` this draw's, `undo` an Undo brought it. shift: null (no change), 'back'
 *  (an Undo back to the total before the change it takes back: no change to show; Sam, first use 2026-10-21, read
 *  "229.2 (−4.0)" after his Undo as 4.0 lost) or the change. Pure. → {before, shift} */
export function totalShift(tot, v, undo) {
  const before = tot?.before ?? [];
  if (!tot || Math.abs(tot.v - v) < 0.05) return { before, shift: null };
  if (undo && before.length && Math.abs(before.at(-1) - v) < 0.05) return { before: before.slice(0, -1), shift: 'back' };
  return { before: [...before, tot.v], shift: v - tot.v };
}
/** The cards of week `w` that differ from the same week `b` before (the landing's tint on the pitch: B61, the pitch
 *  research 2026-10-19): each player of its XI or bench who was in neither, or who moved between them (a sub), in the
 *  week's order, XI first. Pure. → [id] */
export function changedCards(w, b) {
  const was = new Map([...(b?.xi || []).map((id) => [Number(id), 'xi']), ...(b?.bench || []).map((id) => [Number(id), 'bench'])]);
  return [...(w.xi || []).map((id) => [Number(id), 'xi']), ...(w.bench || []).map((id) => [Number(id), 'bench'])]
    .filter(([id, at]) => was.get(id) !== at).map(([id]) => id);
}
/** "Groß in and Schade in": every edit of a chain by name (the receipt that covers them all: edit's noteEdit); one
 *  edit's own name for its toast (chainSaid([edit])). */
const chainSaid = (chain) => {
  const names = chain.map((c) => c.said).filter(Boolean);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? 'Your edit';
};

/**
 * The heal could not keep every rule (RULES_V2 §5): the rules stay (nothing you said is silently dropped) and the
 * plan stays the last one the solver returned; the toast says the solver's answer (clashParts: the player its plan
 * dropped, else the week it found no plan for and your choices there) with the choice that broke it, and Undo takes
 * back the newest; the Week sheet's status row says the same, a Remove on each. Never a shortfall the phone counted on
 * its ≈ (COPY.ruleShort went with the ≈: the owner, 2026-10-26, "no hardcoded logic whatsoever"). A solver failure that
 * is not about your rules (code 'solver') just says so.
 */
function fail(ctx, error) {
  const ov = OV;
  OV = null;
  memOf(ctx).claimEdit();
  bump(ctx);
  const newest = ov.chain?.at(-1);
  const P = plan(ctx);
  const rules = aboutRules(error);
  // the rule that first broke the set stays the one named while it is still yours (a later ask is not to blame)
  if (!CLASH || !P.pins.some((p) => p.id === CLASH.id)) CLASH = rules && newest?.id ? { id: newest.id, what: newest.what } : null;
  // an edit that adds no rule (a removal, Reset plan, "Without …") is named by its own words, then what the rules left
  // can't keep (the owner's phone, 2026-10-26: Remove of Calafiori → Hill left Leno → Raya and João Pedro → Evanilson,
  // four Arsenal players: no plan keeps your GW9 choices)
  const c = P ? clashParts(P, CLASH) : { what: null };
  // (an edit that added no rule is always named by its own words, whatever earlier rule still clashes: reviewer 2 of
  // solversquad, 2026-10-26)
  const why = COPY.clashWhy(error?.why, error?.gw);
  const text = !rules ? error?.plain || COPY.unfinished
    : newest?.id ? COPY.rulesClash(c.what ?? null, CLASH?.what ?? newest.what, why) : COPY.dropClash(newest?.said ?? null, c.what, why);
  // B89 (johnson Part 3 §12: "couldn't finish checking" with nothing to do about it): a failure not about your choices
  // (the solver's own, the connection's) offers "Try again": the same check at once (memory.heal), its pending toast back
  // and the edit armed again, so its verdict is spoken; Undo stays beside it
  const again = rules ? [] : [{ label: 'Try again', onClick: () => {
    OV = ov;
    memOf(ctx).heal({ now: true });
    if (!memPlan(ctx)?.pending) return land(ctx);  // nothing to solve: as edit lands it
    checkEdit(ctx, ov);
    bump(ctx);
  } }];
  say(ctx, text, newest ? undoOf(ctx, chainSaid([newest]), () => undoNewest(ctx, ov.chain)) : null, 'warn', null, again);
}
/** The rule named when the full plan can't keep them all: {id, what} (cleared once a plan lands). */
let CLASH = null;
/** A heal's error about your choices (no plan keeps them all), not the solver's own or the connection's. */
const aboutRules = (error) => !error?.code || error.code === 'infeasible' || error.code === 'pins';
/**
 * What the solver couldn't keep, while memory's error about your choices stands: the player its plan dropped
 * (memory.solveKept's error.dropped, the first) as "Groß in GW6", with the choice of yours that holds him then (composePins'
 * cell: a sale's buy, a Wish, a slide, a Keep); else the week it found no plan for (the server's error.gw, api/mobile.py
 * _road_error; a dropped player's GW) and your choices there ("your GW9 choices"; the owner's phone, 2026-10-26: after a
 * Remove no plan kept Leno → Raya and João Pedro → Evanilson, and nothing said which). `clash`: the choice fail named
 * (CLASH). Pure. → {what: string | null, pins: [Pin] (each with a Remove: `clash`'s first)}
 */
export function clashParts(P, clash = CLASH) {
  const err = P.mem?.error;
  const asks = asksOf(P);
  const by = asks.find((p) => p.id === clash?.id) ?? null;
  const d = err?.dropped?.[0] ?? null;
  const cell = d && composePins(asks, { from: P.A, to: P.end }).cells.get(Number(d.id))?.get(Number(d.gw));
  const held = cell?.want === 'in' ? asks.find((p) => p.id === cell.pin) ?? null : null;
  const g = num(err?.gw) ?? num(d?.gw);
  // your rules that GW: made there, or holding a player in or out then (a transfer from an earlier week)
  const at = (p) => num(p.gw) === g || ((w) => !!w && w[0] <= g && g <= w[1])(windowOf(p));
  const there = !d && g != null ? asks.filter((p) => p !== by && at(p)) : [];
  const what = d && !(by && held === by) ? `${P.L.name(d.id)} in GW${d.gw}`
    : there.length ? COPY.choicesAt(g, there.map((p) => plainRule(P, p))) : null;
  // nothing narrower known: a Remove on every rule of yours (reviewer 2 of solversquad, 2026-10-26: "all of these" with
  // no Remove at all)
  const rest = !what && !by ? asks : [];
  const pins = [by, what ? held : null, ...there, ...rest].filter((p, i, xs) => p && xs.indexOf(p) === i && ruleOf(P, p).removable);
  return { what, pins };
}
/**
 * B12 (johnson A1: once fail's toast went, the plan looked as if it kept every choice, and the one that clashed was never
 * named): the Week sheet's status row (its words the week line's second line) while memory's error stands (not while an
 * edit is checked), in every week: "No plan keeps Groß in GW6 with Keep Scott · GW6. Remove one." What the solver
 * couldn't keep (clashParts) with the choice fail named (CLASH) as its row says it (rowName), each with a Remove (`pins`);
 * "all of these" when nothing is known. A failure not about your choices (aboutRules) says its own words, nothing to
 * remove. Pure. → {text, pins: [Pin]} | null
 */
export function clashLine(P, clash = CLASH) {
  const err = P.mem?.error;
  if (!err || P.healing) return null;
  if (!aboutRules(err)) return { text: err.plain || COPY.unfinished, pins: [] };
  const by = asksOf(P).find((p) => p.id === clash?.id) ?? null;
  const { what, pins } = clashParts(P, clash);
  return { text: COPY.rulesStuck(what, by ? rowName(P, by) : null, COPY.clashWhy(err.why, err.gw)), pins };
}

/**
 * One edit: `pins` added to memory (after `drop`, the ids it replaces); it records rules only. The plan drawn stays the
 * last one the solver returned (plan: the weeks from the edit's on waiting, its pending toast "Checking…") until the
 * solver's plan for the new rules lands: at once when a bundle road fits them, or `road`, offered to memory
 * (memory.offer: a solved choice's, a Wish pill's, a prepared chip's); else memory heals (one solve), and the verdict
 * says when it lands (land), or what the solver couldn't keep (fail). The owner, 2026-10-26 (a Remove drew the phone's ≈
 * of the rules left, four Arsenal players and its bank in coral, until the heal: "fix so every squad is solver squad, no
 * hardcoded logic whatsoever so shit like this not happens"): no squad the phone builds is ever drawn or measured
 * against, not even for the seconds a solve takes (B56's ≈ at once and QA-5's "never the old plan with the move you
 * just undid" overturned). A move you make is checked for budget and club before any solve by its own door (§5.5,
 * sellFrom, moveTo, addPlan: whether a solve is worth asking), never here. `what` names the edit for its receipt
 * (memory.noteEdit: a heal that lands after a reload still says what it did, its direction dirOf the pins before and
 * after, as vsPrev reads it). Its verdict is `text(Q, prev)`, else `what` with its points named as what your total
 * moves by, as the Sell and Bring in lists whose picks take this default name them (withPoints `total`: "total +3.3";
 * the review of the first-use proposals, 2026-10-21: "≈ +3.3 total" in the list, "+3.3 pts" on its toast), and
 * `ending(Q, prev)` after them (endingOf, B21); that default landed at once is `what` and its ending alone (B24: its
 * number is on the total and its row). Every edit passes one of the two: land has no verdict of its own. Nothing goes
 * with it that it doesn't name (RULES_V2 §5): what else a rule needs is the solver's to plan, or to say it can't (fail).
 * `more`: actions its verdict toast carries before its Undo (a take's Why: whyAct); `take`: its verdict a take's
 * receipt, the clauses of its words that may clip (addPlan; ui.toast).
 */
function edit(ctx, { pins = [], drop = [], road = null, from, text = null, what = null, also = null, inPlace = null, ending = null, taken = [], more = [], take = null, hitsMax }) {
  if (!editable(ctx)) { toastOf(ctx)(OFFLINE_EDIT, 'warn'); return false; }
  const ink = memOf(ctx).inkOf(pins);  // GW A under way is FPL's (B7)
  if (ink) { toastOf(ctx)(ink.text, 'warn'); return false; }
  // made dry (presolve): the rules it would make, recorded, nothing changed
  if (DRY) { DRY.got = { pins, drop, inPlace, hitsMax, was: memPlan(ctx)?.pins.map((p) => p.id) ?? [] }; return true; }
  // the verdict toast goes; an edit's pending toast stays for what replaces it (say)
  if (lastSay !== PENDING?.toast) lastSay?.();
  lastSay = null;
  listen(ctx);
  const I = info(ctx);
  const f = from ?? I.A;
  const prevP = plan(ctx);
  // each edit of a chain still healing keeps its own way back and its verdict (B133: Undo takes back the newest only,
  // undoNewest); under a chain the plan memory holds is the one before its first edit, never the plan for these pins,
  // so this edit's Undo leaves memory to plan them again (restore sets no road)
  const cur = ovOf(ctx, I);
  const here = cur ? { ...snapshot(ctx), road: null } : snapshot(ctx);
  const said = what ?? (pins.length ? ruleOf(I, pins[0]).text : null);
  // its verdict: `text`, else `what` with its points and its ending; landed at once, `what` and its ending (B24: plain)
  const verdict = text ?? (ending ? withPoints(ctx, what, ending, { total: true }) : null);
  const plain = text || !ending ? null : (Q, prev) => `${what}${ending(Q, prev)}`;
  const chain = [...(cur?.chain || []), {
    // `what`: the choice as its row says it (rowName: a transfer "Scott → Groß · GW6", never as a rule), fail's name
    snap: here, id: pins[0]?.id ?? null, what: pins.length ? rowName(I, pins[0]) : null, said, own: { from: f, prevP, text: verdict, plain, more, take },
  }];
  OV = ovFor(ctx, I, chain);
  bump(ctx);
  const mem = memOf(ctx);
  // B129: a transfer the edit's rules make exact (a sale with its buy, a slide: a +, Bring in…, a pick, a move to another
  // week) is yours again, no longer "removed by you", from every door alike (the user, 2026-10-21: fix the known issues:
  // a + took it back still marked); after the snapshot, so its Undo puts the mark back
  noteRemoved(I, pins.filter((p) => soldBy(p) != null && boughtBy(p) != null).map((p) => ({ gw: Number(p.gw), out: Number(soldBy(p)), in: Number(boughtBy(p)) })), false);
  also?.();  // a phone-only part of the edit (a lineup reset, the moves you removed), after the snapshot Undo goes back to
  // a road solved for these pins (a chip prepared with your rules, a Wish pill, a solved choice) is the plan at once when
  // it fits them
  if (road) mem.offer(road);
  // its rules changed as one (memory.batch: planned once, never for the rules half changed), You → Hits with them
  mem.batch(() => {
    if (hitsMax !== undefined) mem.setHitsMax(hitsMax);
    for (const id of drop) if (mem.getPlan().pins.some((p) => p.id === id)) mem.removePin(id);
    for (const p of pins) mem.addPin(p);
    // a rule remade in its place (`inPlace`, its id: sellFrom's and sellAny's chain) keeps its place among your asks, as
    // the snapshot had it
    if (inPlace) {
      const now = mem.getPlan().pins, was = here.pins.map((p) => p.id);
      const ordered = inPlaceOf(now, inPlace, was);
      if (ordered.some((p, i) => p !== now[i])) mem.restorePins(ordered);
    }
  });
  OV.armed = true;
  if (!mem.getPlan().pending) landNow(ctx);   // a baked, offered or pre-solved road fitted, or nothing to solve
  // s48 (QA check6: an own pick's Undo came only with its verdict, 38 s later): the newest edit's toast at once, its Undo
  // with it while the full plan solves, the receipt naming the chain whole (checkEdit); the verdict changes this toast in
  // place when it lands (land, fail; B23), its age meanwhile pendingTick's
  else checkEdit(ctx, OV);
  return true;
}

/** The armed edit's plan memory has with no wait: a baked or offered road (B24: said in its own words, `instant`), or the
 *  answer of a solve of exactly its values asked before the tap (memory's Plan.ahead: presolve), its plan or its error
 *  said as that heal's would be (land, fail): the same solve, the same verdict. */
const landNow = (ctx) => {
  const gp = memPlan(ctx);
  if (gp?.ahead && gp.error) fail(ctx, gp.error);
  else land(ctx, { instant: !gp?.ahead });
};

/** s48 (QA check6: an own pick's Undo came only with its verdict, 38 s later): the newest edit's toast while the full
 *  plan checks it, its Undo at once; the verdict replaces it when it lands (land, fail). B133: it names that edit only
 *  (the six-book review, 2026-10-09: the toast named the last edit and Undo took back both), and so does its Undo. */
const pendingSay = (ctx, chain) => sayPending(ctx, chainSaid(chain.slice(-1)), () => undoNewest(ctx, chain));

/**
 * B133 (johnson Part 4 §7; the user, 2026-10-10: Undo takes back only the newest edit, everywhere): the newest edit of
 * `chain` taken back (its snapshot). The edits before it, checked with it, are checked again without it: the one before
 * is the edit again (OV, its own verdict) and its toast comes back with its own Undo (its pending toast, or its
 * verdict when memory has the plan for its rules at once: land). → 'again' then (undoOf says no "Undone" over it)
 */
function undoNewest(ctx, chain) {
  restore(ctx, chain.at(-1).snap);
  const rest = chain.slice(0, -1);
  if (!rest.length) return;
  OV = { ...ovFor(ctx, info(ctx), rest), armed: true };
  bump(ctx);
  if (!memOf(ctx).getPlan().pending) landNow(ctx);
  else pendingSay(ctx, rest);
  return 'again';
}

/** Pins `list` with the one of id `id` back where it was in the id order `was` (before the first pin that followed it
 *  there and is still in `list`; at the end when none is). Pure. → [Pin] */
export function inPlaceOf(list, id, was) {
  const p = list.find((x) => x.id === id);
  if (!p || !was.includes(id)) return list;
  const rest = list.filter((x) => x !== p);
  const next = was.slice(was.indexOf(id) + 1).find((x) => rest.some((q) => q.id === x));
  const at = next == null ? rest.length : rest.findIndex((q) => q.id === next);
  return [...rest.slice(0, at), p, ...rest.slice(at)];
}

/** M6: what an own pick in GW g did to the rest of that GW (plan view before → after): the suggested moves it replaced,
 *  the moves it brought, and its hits there, as clauses after the pick (" · replaces Scott → Groß · no hit"). `own`:
 *  the player the pick sells (his own sale is the pick, not a side effect). */
export function sideEffects(prev, Q, g, own) {
  const nm = Q.L.name;
  const key = (m) => `${m.out}>${m.in}`;
  const was = weekOf(prev, g)?.moves || [], now = weekOf(Q, g)?.moves || [];
  const gone = was.filter((m) => m.out !== own && !now.some((x) => key(x) === key(m)));
  const came = now.filter((m) => m.out !== own && !was.some((x) => key(x) === key(m)));
  const list = (ms) => ms.map((m) => `${nm(m.out)} → ${nm(m.in)}`).join(', ');
  return [gone.length ? COPY.replaces(list(gone)) : null, came.length ? COPY.adds(list(came)) : null]
    .filter(Boolean).map((x) => ` · ${x}`).join('');
}
/** A9: " after a −4" when an edit brought GW g a hit (its points count it: FPL's −4 is the extra transfer's). */
const hitAfter = (Q, prev, g) => {
  const n = Math.max(0, (weekOf(Q, g)?.hits ?? 0) - (weekOf(prev, g)?.hits ?? 0));
  return n ? ` ${COPY.afterHit(n)}` : '';
};
/** B21: "−4 in GW8" for each GW after g whose weeks `a` take more hits than weeks `b` (a plan view's weeks, or an
 *  estimate's gws): a hit a move brings to a later week (the verdict's ending, the Why sheet's line before the tap). */
const hitsLater = (a, b, g) => a.filter((w) => w.gw > g).map((w) => [w.gw, (w.hits ?? 0) - (b.find((x) => x.gw === w.gw)?.hits ?? 0)])
  .filter(([, n]) => n > 0).map(([x, n]) => `${COPY.hitsIn(n)} in GW${x}`);
/**
 * B21 (Saffer A4: removal and keep toasts left out the hit, the captain and what the planner put in its place): the one
 * ending of every verdict that changes GW g's moves, after its points: a hit there (hitAfter, next to the points it
 * counts in), the moves the planner swapped there (sideEffects) only where it chose them (off the hold, or a week it
 * re-picks: repicks) and never one the toast names already (`named`: a removal's dependent buys, a pair's or a
 * bring-in's other moves), the moves it swapped in each later week where it chose them ("replaces … in GW8"), a hit in
 * each later week (hitsLater), and a new GW-g captain (captainMoved: the toast, never a row). own: the player the
 * edit's own move sells. Pure. → " after a −4 · replaces Scott → Groß · adds Mbeumo → Andrews in GW8 · −4 in GW8 ·
 * Saka captain" | ''
 */
export function endingOf(Q, prev, g, { own = null, named = [] } = {}) {
  const key = (m) => `${m.out}>${m.in}`;
  const off = new Set(named.map(key));
  const bare = (V) => ({ ...V, weeks: V.weeks.map((w) => (w.gw === g ? { ...w, moves: w.moves.filter((m) => !off.has(key(m))) } : w)) });
  const chose = (x) => !prev.mem?.hold || repicks(prev, x);
  // a later week whose moves the planner changed (where it chose them; a Wildcard or Free Hit week is its chip's), each
  // clause with its GW (review 5, 2026-10-12: an edit re-planned GW8 unsaid); only Forkcast's moves there, as a move a
  // rule of yours makes before or after is the edit's own, named by its toast (review 5, 2026-10-12: "Scott → Groß
  // moved to GW6 · replaces Scott → Groß in GW8")
  const theirs = (V) => ({ ...V, weeks: V.weeks.map((w) => ({ ...w, moves: (w.moves || []).filter((m) => !pinOfMove(prev, { ...m, gw: w.gw }) && !pinOfMove(Q, { ...m, gw: w.gw })) })) });
  const later = Q.weeks.filter((w) => w.gw > g && chose(w.gw) && !squadWeek(w) && !squadWeek(weekOf(prev, w.gw)))
    .flatMap((w) => sideEffects(theirs(prev), theirs(Q), w.gw, null).split(' · ').filter(Boolean).map((c) => ` · ${c} in GW${w.gw}`));
  return [hitAfter(Q, prev, g), chose(g) ? sideEffects(bare(prev), bare(Q), g, own) : '', ...later,
    ...hitsLater(Q.weeks, prev.weeks, g).map((x) => ` · ${x}`), captainMoved(Q, prev, g)].join('');
}

/** Your own transfer among `asks` that brings `out` in before GW g (a sale's buy, a slide or a Wish of him: held from
 *  its GW to the end), remade with his hold ending at GW g − 1, so selling him from g carries on from that transfer
 *  instead of contradicting it (the user's phone, 2026-10-10: Replace Groß from GW8 took back "Szoboszlai → Groß from
 *  GW6" as a clash, then no plan could sell a Groß never bought and the sale was refused; 2026-10-19: a suggested plan's
 *  + did the same to "Branthwaite → Murillo"). → {chain: [Pin] (same ids), asks: `asks` with them in place, for
 *  clashing} */
function sellsOn(asks, out, g) {
  const chain = asks.flatMap((q) => {
    const held = MOVE_KINDS.has(q.kind) ? (q.must || []).find(([id, a, b]) => Number(id) === Number(out) && a < g && b >= g) : null;
    return held ? [{ ...q, must: q.must.map((x) => (x === held ? [x[0], x[1], g - 1] : x)) }] : [];
  });
  return { chain, asks: asks.map((q) => chain.find((c) => c.id === q.id) ?? q) };
}
/** sellsOn for each of GW g's `moves` in turn, on your rules (P's asks): what selling them from g does to your rules
 *  besides GW g, the transfers of yours that bought them held only to g − 1. One rule for a suggested plan's + (addPlan)
 *  and its solves (forkValues). → {chain: Map(id → Pin), asks} */
function chainOf(P, g, moves) {
  let asks = asksOf(P);
  const chain = new Map();
  for (const m of moves) { const r = sellsOn(asks, m.out, g); asks = r.asks; for (const c of r.chain) chain.set(c.id, c); }
  return { chain, asks };
}

/** M6 / §5.7: sell `out` from GW g for `inn` (memory.pinSell: out gone from g, in held from g). Its verdict names what
 *  the pick did to the rest of GW g (sideEffects), and its one Undo brings all of it back. addYours checks it first
 *  (in a week Forkcast re-picks, in place of one of its transfers there, as the suggestion's number): one that can't
 *  fit is refused before any solve; meanwhile the plan before it is drawn. */
export function sellFrom(ctx, g, out, inn) {
  const P = plan(ctx);
  const r = addYours(ctx, P, g, out, inn);
  if (r.problem) { toastOf(ctx)(problemText(ctx, r.problem, P.L.name(inn)), 'warn'); return false; }
  const label = `${P.L.name(out)} → ${P.L.name(inn)} from GW${g}`;
  const pin = pinSell(out, g, P.end, { in: inn, label });
  // a wish of the player you pick is said by the pick; a Keep of the one you sell, a veto of the one you pick, a Roll of
  // that GW go, and its verdict names them (withTaken). A9: the toast in one plain line, "Bassey in · +5.7 pts". Your
  // transfer that bought him stays, his hold ending the GW before (sellsOn)
  const { chain, asks } = sellsOn(asksOf(P), out, g);
  const taken = clashing(P, pin, asks);
  const what = withTaken(P, COPY.cameIn([P.L.name(inn)], g === P.A ? null : g), taken);
  // (B129: a move you removed and add again is no longer "removed by you": edit, as every door that makes it yours)
  return edit(ctx, {
    pins: [pin, ...chain], drop: [...wishDrop(P, inn), ...taken.map((q) => q.id)], from: g, what, taken, inPlace: chain[0]?.id ?? null,
    ending: (Q, prev) => endingOf(Q, prev, g, { own: out }),
  });
}

/** "Sell him from GW g, the plan picks who comes in" (UX-4): memory.pinSell without a pick (he goes from g on,
 *  the heal names the buy; meanwhile the plan before it, never the phone's guess of the buy: the owner, 2026-10-26). Replace's
 *  "Let Forkcast choose" in both modes (the user, 2026-10-13: "only add player to must sell list and let model choose
 *  alternative"): under the hold that week keeps the rest of its squad and takes the one buy (memory.holdOf). */
export function sellAny(ctx, g, out) {
  const P = plan(ctx);
  const nm = P.L.name;
  // the sale the full plan made: from GW g, or earlier (the rule keeps him out from g; the plan may sell him sooner)
  const sold = (Q) => Q.weeks.filter((w) => w.gw <= g).flatMap((w) => w.moves.filter((m) => m.out === out).map((m) => ({ ...m, gw: w.gw }))).at(-1) ?? null;
  const pin = pinSell(out, g, P.end, { label: `Sell ${nm(out)} from GW${g}` });
  const { chain, asks } = sellsOn(asksOf(P), out, g);
  const taken = clashing(P, pin, asks);
  // B90: the act in the past tense, as every receipt ("Scott sold from GW6"); its verdict names the buy the plan made,
  // and its number as its Sell list row does, what your total moves by ("total +3.3": edit's default)
  const sale = `${nm(out)} sold from GW${g}`;
  const said = (Q) => { const m = sold(Q); return withTaken(P, m ? `${nm(out)} → ${nm(m.in)} in GW${m.gw}` : sale, taken); };
  return edit(ctx, {
    pins: [pin, ...chain], drop: taken.map((q) => q.id), inPlace: chain[0]?.id ?? null,
    from: g, what: withTaken(P, sale, taken), taken, text: withPoints(ctx, said, (Q, prev) => endingOf(Q, prev, sold(Q)?.gw ?? g, { own: out }), { total: true }),
  });
}

/** M8 Plan B: the best plan without the player a move buys (the baked veto road when it is the model's GW-A buy).
 *  scope (F11): 'gw' (the default from a move: not him in the move's GW, the plan may buy him later) or 'all' (not
 *  him in any planned GW). A verdict that loses points ends with his FPL flag (withFlag, B29). */
export function veto(ctx, m, { scope = 'gw' } = {}) {
  const P = plan(ctx);
  const nm = P.L.name;
  const one = scope === 'gw';
  const pin = one ? pinVeto(m.in, m.gw, m.gw, { scope, label: `Not ${nm(m.in)} in GW${m.gw}` }) : pinVeto(m.in, P.A, P.end, { label: `Not ${nm(m.in)}` });
  // his asks it contradicts go (a wish or a pick of him, a Keep that holds him then), named in its verdict as Keep's are
  // (withTaken: the checker, 2026-10-09, "Not McBurnie in GW8" took your Calvert-Lewin → McBurnie unsaid), and every
  // veto of him whose weeks meet it: one rule says when (a wider one replaces it, a narrower one too: "Not him · GW6"
  // from "all weeks"). B90b (saffer rule 3: one rule, one name): every week's is said as its chip, "Not Groß · all weeks"
  const said = one ? `Not ${nm(m.in)} in GW${m.gw}` : ruleOf(P, pin).text;
  // B19 (the user, 2026-10-10: "released, the row springs back with the new buy in place, never fades to nothing"; the
  // reviews, 2026-10-11: on your own transfer the swipe took your sale back): your sale stays and only its buy changes,
  // to the solver's pick (the sale without a buy, sellAny's rule; under the hold that week keeps the rest of its squad:
  // memory.holdOf), named once it lands. Never a buy the phone picks by its estimate (the best other buy that fit, made
  // your exact transfer under the hold, until the owner, 2026-10-26: "no hardcoded logic whatsoever")
  const mine = (() => { const q = pinOfMove(P, m); return q?.kind === 'sell' && Number(q.in) === Number(m.in) ? q : null; })();
  if (mine) {
    const g0 = Number(mine.gw);
    const sale = pinSell(m.out, g0, P.end, { label: `Sell ${nm(m.out)} from GW${g0}` });
    // the sale's own clashes too: it is open (the plan picks the buy), which the week's Roll (a plan's +) forbids, so
    // the Roll goes with it, named, and the week is Forkcast's again (the review, 2026-10-13: no plan fit)
    const others = [...new Map([...clashing(P, pin), ...clashing(P, sale, asksOf(P).filter((q) => q.id !== mine.id))].filter((q) => q.id !== mine.id).map((q) => [q.id, q])).values()];
    // the buy the solver made in his place, as its row will read ("Not Groß in GW6 · Xhaka in for Scott")
    const what = (Q) => {
      const x = weekOf(Q, m.gw)?.moves.find((y) => y.out === m.out);
      return withTaken(P, x ? `${said} · ${COPY.cameInFor(nm(x.in), nm(m.out), m.gw === P.A ? null : m.gw)}` : said, others);
    };
    return edit(ctx, {
      pins: [pin, sale], drop: [mine.id, ...others.map((q) => q.id), ...meeting(P, ['veto', 'never'], m.in, pin)], from: m.gw,
      text: withFlag(ctx, m.in, vsPrev(ctx, what)), what: withTaken(P, said, others), taken: others,
    });
  }
  const taken = clashing(P, pin);
  const what = withTaken(P, said, taken);
  const text = withFlag(ctx, m.in, vsPrev(ctx, what));
  const drop = [...taken.map((q) => q.id), ...meeting(P, ['veto', 'never'], m.in, pin)];
  // the bake's veto road is that plan at once when it fits (memory.findRoad would find it too: offered, it lands so from
  // GW A); else the solver plans without him
  const road = baked(ctx, [pin], drop);
  return edit(ctx, { pins: [pin], drop, road, from: road ? P.A : m.gw, text, what, taken });
}

/** M9 / M14: him from GW g, with the road the Wish pill already returned for him (null: the phone's
 *  buy). A1 / B36: in both modes a buy is your transfer, exactly (holdBuy, the buy Add a player measured and
 *  named: bringIn, a rule of yours it contradicts taken back and named); no hits rule is set, and on the suggested plan
 *  Forkcast plans the rest around it. One it can't make says why (sayBuyProblem). */
export function want(ctx, id, g, road) {
  const P = plan(ctx);
  const bp = holdBuy(ctx, id, g, road);
  if (bp?.kind === 'none') { sayBuyProblem(ctx, P, id, bp); return false; }
  return bringIn(ctx, id, g, bp);
}

/** The keep pin for player `id` (F11): scope 'gw' (in GW gw only: the default from a planned sale, it blocks exactly
 *  that sale) or 'all' (from when your plan has him, now or the GW it buys him, to the end; from GW `from` when given:
 *  a rule chip's "GW8–9" keeps him from that GW, id@n-end). */
export function keepPin(P, id, { gw = P.A, scope = 'all', from = null } = {}) {
  const nm = P.L.name(id);
  if (scope === 'gw') return pinKeep(id, gw, gw, { scope, label: `Keep ${nm} in GW${gw}` });
  // a Keep protects him from a sale, it never buys him early
  const since = P.owned.includes(id) ? P.A : P.weeks.find((w) => w.squad.includes(id))?.gw ?? P.A;
  const a = Math.max(since, from ?? since);
  return pinKeep(id, a, P.end, { label: a > P.A ? `Keep ${nm} from GW${a}` : `Keep ${nm}` });
}

/** Keep him (memory.pinKeep): in GW gw only (scope 'gw') or through the window (scope 'all', the default; from GW
 *  `from` when given: keepPin). One event, one verdict from every door (his card's Force keep, his place's Keep, a
 *  row's Keep, the rule's chip: rescope), whichever Keep of his it remakes: one that leaves your plan as it is says what
 *  it changed, the suggestions (COPY.keptFromChoices); one that changes it says what and its points, even landed at once
 *  (a sale it takes back leaves no row to carry its number, as a removal's: removeMove), in two lines at most (no FPL
 *  flag since 2026-10-22: his card has it). A sale of yours it takes back goes, named, removed by you (B129), one Undo;
 *  what your other rules then need is the solver's (the buys that needed its money no longer go with it by the phone's
 *  count, dependentBuys: the owner, 2026-10-26, "no hardcoded logic whatsoever"). */
export function keep(ctx, id, { gw, scope = 'all', from = null } = {}) {
  const P = plan(ctx);
  const nm = P.L.name;
  const pin = keepPin(P, id, { gw, scope, from });
  const [, a, b] = pin.must[0];
  const sales = P.weeks.filter((w) => w.gw >= a && w.gw <= b).flatMap((w) => w.moves.filter((m) => m.out === id).map((m) => ({ gw: w.gw, ...m })));
  // "in GW6" | "" (all weeks) | "from GW8": the rule's own scope (memory.scopeOf), as its chip reads
  const sc = scopeOf(pin, { start: P.A, end: P.end });
  const when = sc === 'all weeks' ? '' : sc.startsWith('from') ? ` ${sc}` : ` in ${sc}`;
  // what it overrules goes (a sale or a veto of him then: its verdict names it), and a keep of him whose weeks meet it
  // (narrowed or widened by it: one rule says when)
  const taken = clashing(P, pin);
  // B90: "Raya kept in GW6", "Raya kept", "Raya kept from GW8": the act done, as every receipt; a sale of his it takes
  // back said with him, what a choice undoes in its one form ("Saka kept in GW8 instead of Palmer": the user, 2026-10-22,
  // two lines at most; "Saka kept · Saka → Palmer removed" named him twice), the other rules it takes back after it
  const own = taken.filter((q) => q.kind === 'sell' && Number(q.player) === Number(id) && q.in != null);
  const what = withTaken(P, `${nm(id)} kept${when}${own.length ? ` ${COPY.planInsteadOf(own.map((q) => nm(q.in)).join(' + '))}` : ''}`, taken.filter((q) => !own.includes(q)), own);
  // the rules of yours it takes off; the Keep of his it remakes is none of them (its words say its weeks now)
  const off = taken.map((q) => q.id);
  // a Keep of a Free Hit week stands beside a wider one, which never reaches that week (memory.composePins)
  const fhOnly = scope === 'gw' && squadWeek(weekOf(P, a)) === 'fh';
  const drop = [...off, ...(fhOnly ? [] : meeting(P, 'keep', id, pin))];
  const g = sales.length ? Math.min(...sales.map((m) => m.gw)) : a;  // the first week it changes: its ending's
  // its sales of yours it takes back, remembered as removed by you (B129); no FPL flag after it (B29's withFlag until
  // the user, 2026-10-22: two lines at most, saffer r7 §6: his card says it)
  const gone = sales.filter((m) => taken.some((q) => q.id === pinOfMove(P, m)?.id));
  const ending = (Q, prev) => endingOf(Q, prev, g, { own: id });
  return edit(ctx, {
    pins: [pin], drop, from: g, what, taken, also: gone.length ? () => noteRemoved(P, gone) : null,
    text: vsPrevOr(ctx, () => COPY.keptFromChoices(nm(id), when || ` through GW${P.end}`), off, withPoints(ctx, what, ending, { total: true })),
  });
}

/** Never buy: an exclude pin over every planned GW (memory.pinNever). When the plan buys him it is a veto of every
 *  planned GW (the player sheet's Never is all weeks, F11). */
export function never(ctx, id) {
  const P = plan(ctx);
  const buy = P.weeks.flatMap((w) => w.moves.map((m) => ({ ...m, gw: w.gw }))).find((m) => m.in === id);
  if (buy) return veto(ctx, buy, { scope: 'all' });
  const pin = pinNever(id, P.A, P.end, { label: `Never ${P.L.name(id)}` });
  // an ask of him it contradicts goes, named as veto's (withTaken); B90b: the rule said as its chip, "Not Groß · all
  // weeks", whether or not it changes the plan (it was "Never Groß" and "Noted: the plan won't suggest Groß")
  const taken = clashing(P, pin);
  const drop = [...taken.map((q) => q.id), ...meeting(P, ['veto', 'never'], id, pin)];
  const said = ruleOf(P, pin).text;
  const what = withTaken(P, said, taken);
  return edit(ctx, { pins: [pin], drop, from: P.A, what, taken, text: vsPrevOr(ctx, () => sentence(said), drop, vsPrev(ctx, what)) });
}

/** F11: a Keep's or a veto's two scopes in words, {gw, all}: Keep · "GW8 only" | "GW8–9" (B144: its span, COPY.span);
 *  Not · "Not in GW8" | "Never" (a rule chip's sheet). */
export const scopeLabels = (kind, g, end) => (kind === 'keep' ? { gw: `GW${g} only`, all: span([g, end]) } : { gw: `Not in GW${g}`, all: 'Never' });

/** F11: a Keep or a veto made one GW's (scope 'gw', its first GW) or wider (scope 'all': a Keep through the end from
 *  its first GW, a veto every week: Never), as scopeLabels names them: the chip's sheet. The rule it was goes (keep,
 *  veto: one rule per player says when). */
export function rescope(ctx, pin, scope) {
  const P = plan(ctx);
  const id = Number(pin.player);
  const g = num(pin.gw) ?? P.A;
  if (pin.kind === 'keep') return keep(ctx, id, { gw: g, scope, from: g });
  return scope === 'all' ? never(ctx, id) : veto(ctx, { gw: g, out: null, in: id }, { scope });
}

/**
 * The buys the phone may guess for an edit (Plan B, "the plan picks", a −4): buyable players of `pos` the plan
 * doesn't have, never one your rules keep out from GW `from` on (barred: an earlier veto, a Never, a sale from then)
 * nor one of `not`, best by mean xP over the planned GWs first: [id] (at most `limit`).
 * P: the plan view (plan()) or {d: {rows}, L, weeks, pins, gws, end}.
 */
export function buyCandidates(P, { pos, from, not = [], limit = 25 } = {}) {
  const have = new Set(P.weeks.flatMap((w) => w.squad));
  const no = new Set([...barred(P, from), ...not.map(Number)]);
  const gain = (r) => sum(ids(r.xp).slice(0, P.gws.length));
  return P.d.rows.filter((r) => r.buyable && P.L.pos(r.id) === pos && !have.has(Number(r.id)) && !no.has(Number(r.id)))
    .sort((a, b) => gain(b) - gain(a)).slice(0, limit).map((r) => Number(r.id));
}

/** Your asks (UX-6): every pin but the road's, oldest first. */
export const asksOf = (P) => (P?.pins || []).filter((p) => p.id !== 'road' && p.id !== 'hold' && p.id !== 'hits');
/** Your pins of `kind` about player `id` (vetoes, Nevers, Keeps, sales, wishes: F11 lets one GW's stand beside another). */
export const pinsOf = (P, kind, id) => asksOf(P).filter((p) => Number(p.player) === Number(id) && [].concat(kind).includes(p.kind));
/** The GWs a pin holds its player in or keeps him out of: [a, b] (null without a window). */
export const windowOf = (p) => {
  const w = [...parseSpans(p.must || []), ...parseSpans(p.excl || [])].filter(([id]) => id === Number(p.player));
  return w.length ? [Math.min(...w.map(([, a]) => a)), Math.max(...w.map(([, , b]) => b))] : null;
};
/** Whether two pins' windows share a GW (F11: a GW6-only keep never clashes with a sale from GW8). */
const overlaps = (p, q) => { const a = windowOf(p), b = windowOf(q); return !!a && !!b && a[0] <= b[1] && b[0] <= a[1]; };
/** Your pins of `kind` about player `id` whose weeks meet `pin`'s, but `pin` itself: their ids. A Keep or a veto
 *  replaces these (one rule per player says when: a wider one, and a narrower one too); one of another GW stays. */
const meeting = (P, kind, id, pin) => pinsOf(P, kind, id).filter((q) => q.id !== pin.id && overlaps(q, pin)).map((q) => q.id);
/** Your asks `pin` contradicts: the older ones whose cells it takes the other way over the planned GWs
 *  (memory.pinConflicts: a veto of a player your Keep, wish or pick holds then; a wish or a Keep of one you keep out
 *  then; a one-GW rule of another GW is none) → [Pin]. They go with the edit: no contradicting chip stays on screen
 *  (the Wish sheet names them first). */
export const clashing = (P, pin, asks = asksOf(P)) => [...new Set(pinConflicts(asks, pin, { from: P.A, to: P.end, into: (g) => squadBefore(P, g) }).map((c) => c.pin).filter((q) => q && q.id !== 'hold'))];
/** The Rolls of yours `pin` takes back (clashing: it moves someone in a GW you roll) → [Pin]. */
/** An edit's words with the rules of yours it takes back said (A6: it acts at once, so its verdict toast and receipt
 *  name them, and its one Undo brings them back), each in its chip's words ("Keeping Saka · Sell Saka from GW8
 *  removed"; a week's Roll "GW7 roll removed": takenBack). `gone`: the transfers' rules the edit takes off itself. */
// after words that end "removed" one clause, "Saka → Palmer, GW8 frozen removed" (the user, 2026-10-22: two lines at most)
const withTaken = (P, what, pins, gone = []) => {
  const t = takenBack(P, pins, gone)?.text;
  return !t ? what : / removed$/.test(what) && / removed$/.test(t) ? `${what.replace(/ removed$/, '')}, ${t}` : [what, t].filter(Boolean).join(' · ');
};
/** A rule in words (memory.ruleText) as the plan's chips say it: scoped against the planned GWs (P: a plan view or
 *  info, {L, A, end}). */
export const ruleOf = (P, p) => ruleText(p, P.L.name, { end: P.end, start: P.A, cap: hitCap(P.b?.meta), hold: !!P.mem?.hold });
/** Your pin of `kind` about player `id` (a veto, Never, Keep, sale or wish) — one whose window covers GW `gw`
 *  when given — or null. */
export const pinOf = (P, kind, id, gw = null) => pinsOf(P, kind, id).find((p) => gw == null || overlaps(p, { player: id, must: [[Number(id), gw, gw]] })) ?? null;
/** The players your pins keep out in any GW from..to (memory.barredAt), but not the player a sale of yours sells from a
 *  later GW: he can come in before it, the chain sellsOn keeps (the user's phone, 2026-10-10: "Groß → Xhaka from GW8"
 *  kept Groß out of GW6's Replace list and suggestions); nor its buy before it (composePins keeps him out until then
 *  for the planner; a buy of him sooner takes that sale back, named: laterBuys). */
export const barred = (P, from, to = P.end) => barredAt(P.pins.map((p) => (p.kind === 'sell' && Number(p.gw) > from
  ? { ...p, in: null, excl: (p.excl || []).filter(([id]) => Number(id) !== Number(p.player)) } : p)), from, to);
/** The players your Keeps hold in GW g or later: Map(id → the first such GW). A sale from GW g has him out from g on, so
 *  a Keep of him then or later forbids it, in every sale the phone picks itself (suggestionsOf, findBuy, whenOf;
 *  saffer, 2026-10-09: "Keep Scott · GW6" and Add a player still sold Scott, and the tap took the Keep
 *  back). A sale you choose yourself takes the Keep back instead, named (A6). */
export function keptFrom(P, g) {
  const out = new Map();
  for (const id of new Set(asksOf(P).filter((p) => p.kind === 'keep').map((p) => Number(p.player)))) {
    const x = P.gws.find((y) => y >= g && pinOf(P, 'keep', id, y));
    if (x != null) out.set(id, x);
  }
  return out;
}
/** The players your Keeps hold in each GW from g on of a plan that plays `chip` in GW g (null: none there, your own
 *  taken back) and your chip rules' chips in the other weeks, as its solve holds them (memory.composePins: a Free Hit week's
 *  fifteen takes only a Keep made for that week, a wider one never reaching it). A Wildcard's or Free Hit's squad
 *  keeps each of them then: its changes are no sale keptFrom bars (the review of the first-use proposals, 2026-10-21:
 *  "Keep Gabriel in GW8", the GW8 Free Hit row's Why sheet listed "Gabriel → N.Williams" while its + kept him). The one
 *  rule for plansOf's plans and a chip choice's kept rows (squadChanges). → [[id, GW]] */
export function keptCells(P, g, chip = null) {
  const asks = asksOf(P), keeps = new Set(asks.filter((p) => p.kind === 'keep').map((p) => p.id));
  if (!keeps.size) return [];
  const { cells } = composePins([...asks, pinChip(g, chip)], { from: g, to: P.end });
  return [...cells].flatMap(([id, by]) => [...by].filter(([, c]) => c.want === 'in' && keeps.has(c.pin)).map(([x]) => [id, x]));
}
/** B90b: the asks of yours that keep player `id` out (their own excl windows, memory.parseSpans) in GW g or after (a
 *  buy from GW g holds him to the end: barred's window), or in any planned GW without g, the newest first (as Your
 *  rules lists them); barringRule, the newest | null: a list that leaves him out says why in that rule's chip words
 *  ("Not Groß · all weeks", ruleOf), and Replace's toast removes it when it is the one (B89). */
export const barringRules = (P, id, g = null) => rulesOf(P).filter((p) => parseSpans(p.excl || [])
  .some(([x, a, b]) => x === Number(id) && a <= P.end && b >= (g ?? P.A)));
export const barringRule = (P, id, g = null) => barringRules(P, id, g)[0] ?? null;

/** Sell `out` from GW g: for `inn` (sellFrom), or the plan's pick (sellAny). A Keep of
 *  him then or a Roll of that GW goes with it at once, named in its verdict (A6: no ask first; Undo brings them back). */
export function sellOut(ctx, g, out, inn = null) {
  return inn == null ? sellAny(ctx, g, out) : sellFrom(ctx, g, out, inn);
}

/** Take one ask off (a veto lifted, a Keep released…): the plan re-plans without it (UX-6). */
export function liftAsk(ctx, id) {
  const P = plan(ctx);
  const pin = asksOf(P).find((p) => p.id === id);
  if (!pin) return false;
  // GW A under way is FPL's (liftsLive: a drop adds no pin for memory.inkClash to judge), as removeMove
  if (liftsLive(ctx, P, pin)) { toastOf(ctx)(COPY.live(P.A), 'warn'); return false; }
  const what = `Without “${ruleOf(P, pin).text}”`;
  return edit(ctx, { drop: [id], from: liftFrom(P, pin), what, text: vsPrev(ctx, what) });
}

/** B4 (saffer A5, johnson A4: the card's Remove on a sale only dropped the rule, over budget and unchecked, while the
 *  row's × took the buy that needed its money too): one removal behind every door (the player card's Remove, Keep's
 *  Off and a rule's switch; Your rules' Remove and a rule's sheet). A rule whose move the plan shows (a sale, a slide or
 *  a Wish: pinOfMove) comes off as its row's × takes it (removeMove: the live GW, the buys that needed its money, "Scott
 *  → Groß removed"); any other (a veto, a Keep, a chip, a hits rule, cash, a move rule the plan makes no transfer for, a
 *  Wildcard or Free Hit week's buy) as liftAsk. → bool */
export function removeRule(ctx, id) {
  const P = plan(ctx);
  const pin = asksOf(P).find((p) => p.id === id);
  if (!pin) return false;
  const m = MOVE_KINDS.has(pin.kind) ? P.weeks.filter((w) => !squadWeek(w)).flatMap((w) => w.moves.map((x) => ({ ...x, gw: w.gw }))).find((x) => pinOfMove(P, x) === pin) : null;
  return m ? removeMove(ctx, m) : liftAsk(ctx, id);
}

/** M4 on Ahead: the armband in GW g. Phone-only (no force-captain flag): GW A is memory's lineup. */
export function captain(ctx, g, id) {
  const P = plan(ctx);
  const w = weekOf(P, g);
  if (!w?.xi.includes(id)) return false;
  return lineup(ctx, g, { captain: id, vice: w.vice === id ? w.captain : w.vice }, COPY.captainNow(P.L.name(id)));
}

/** The vice-captain in GW g (the pitch's V dragged on a starter; the player card's "Make vice" until 2026-10-13), phone-only like the armband (lineup: GW A's is
 *  plan memory's, GW A under way refuses it, Undo). A9: its toast is "Mbeumo vice · Undo" (no points: the vice scores
 *  nothing unless the captain misses). Not the captain himself, and only a starter. → bool */
export function vice(ctx, g, id) {
  const P = plan(ctx);
  const w = weekOf(P, g);
  if (!w?.xi.includes(id) || w.captain === id) return false;
  return lineup(ctx, g, { vice: id }, COPY.viceNow(P.L.name(id)), { points: false });
}

/** A sub in week w (engine.swapLineup) with the armband as FPL moves it: a captain sent to the bench hands it to
 *  the vice, and a vice gone (or now captain) is the XI's best other (F7). → {xi, bench, captain, vice, into, out,
 *  order (two subs swapped: nobody enters the XI, the bench order only)} | null when the swap breaks the formation. */
export function subLineup(w, a, b, L) {
  const s = w && E.swapLineup(w, a, b, L.pos);
  if (!s) return null;
  const top = (not) => [...s.xi].filter((p) => !not.includes(p)).sort((x, y) => (L.xp(y, w.gw) ?? 0) - (L.xp(x, w.gw) ?? 0))[0] ?? null;
  const captain = s.xi.includes(w.captain) ? w.captain : s.xi.includes(w.vice) ? w.vice : top([]);
  const vice = s.xi.includes(w.vice) && w.vice !== captain ? w.vice : top([captain]);
  const into = s.xi.includes(Number(a)) && !w.xi.includes(Number(a)) ? Number(a) : Number(b);
  const order = !s.xi.includes(Number(a)) && !s.xi.includes(Number(b));
  return { xi: s.xi, bench: s.bench, captain, vice, into, out: into === Number(a) ? Number(b) : Number(a), order };
}

/** A sub's words in week w (subLineup's s): its toast's, and a sub's list's rows (subChoices). */
function subWords(P, w, s) {
  // H17: two subs swapped say the new order, never "Murillo in for Walle Egeli" (nobody came in)
  const nth = (p) => subOrder(s.bench, P.L.pos).get(p);  // the pitch's "substitute n"
  // a captain sent to the bench hands the armband on, said as every edit's ending says it (B21; review 5, 2026-10-12)
  return s.order ? COPY.benchOrder([s.into, s.out].sort((x, y) => nth(x) - nth(y)).map((p) => [P.L.name(p), nth(p)]))
    : `${P.L.name(s.into)} in for ${P.L.name(s.out)}${s.captain !== w.captain ? ` · ${COPY.captainNow(P.L.name(s.captain))}` : ''}`;
}

/** Sub: swap two players of GW g's lineup (phone-only; subLineup moves the armband as FPL does). */
export function sub(ctx, g, a, b) {
  const P = plan(ctx);
  const s = subLineup(weekOf(P, g), a, b, P.L);
  if (!s) return false;
  // the armband is written only when the sub moves it
  const w = weekOf(P, g);
  const arm = { ...(s.captain !== w.captain ? { captain: s.captain } : {}), ...(s.vice !== w.vice ? { vice: s.vice } : {}) };
  // H17: two subs swapped, no points: the bench scores nothing unless a starter misses (as the vice, A9)
  return lineup(ctx, g, { xi: s.xi, bench: s.bench, ...arm }, subWords(P, w, s), { points: !s.order });
}

/** A sub's list (the user, 2026-10-21: fix all, first-use proposal #5; Tom: "Where's the 'sub him on' button?"): the
 *  starters bench player `id` can replace in GW g, the drag's own legal swaps (engine.swapCandidates, as liftShirt
 *  outlines them), each with its sub (subLineup), its toast's words (subWords) and what it changes the week's points
 *  by (calls.subGap: its toast's number); the best first, as the captain list puts its best first (GW A under way: its
 *  sheet lists them, none taken, as the captain list). → [{id, s, what, cmp}] */
export function subChoices(ctx, P, g, id) {
  const w = weekOf(P, g);
  if (!w?.bench.includes(Number(id))) return [];
  return E.swapCandidates(w, id, P.L.pos).filter((p) => w.xi.includes(p)).map((p) => {
    const s = subLineup(w, id, p, P.L);
    return { id: p, s, what: subWords(P, w, s), cmp: subGap(inputs(ctx), w, s) };
  }).sort((x, y) => y.cmp.delta - x.cmp.delta || (P.L.xp(x.id, g) ?? 0) - (P.L.xp(y.id, g) ?? 0));
}

/**
 * A phone-only lineup change in GW g (a sub, the armband): GW A's is plan memory's lineup ({xi, bench, captain,
 * vice}: drift and receipts play the same one, F7), a later GW's this device's. The verdict is that GW alone, the lineup
 * change only ("Ajayi in for Gabriel, GW6: −1.2 · you lose 1.2 pts").
 */
function lineup(ctx, g, patch, what, opts = {}) {
  const I = info(ctx);
  return lineupEdit(ctx, [g], () => {
    if (g === I.A) memOf(ctx).setLineup(patch);
    else setLineups(ctx, I, { ...lineups(ctx, I), [g]: { ...(lineups(ctx, I)[g] || {}), ...patch } });
  }, what, opts);
}

/** The one lineup edit (a sub, the armband, a reset): GWs `gws` changed by `change` (phone-only: no solve), each
 *  flashed, the verdict those GWs alone against before (COPY.lineup), with Undo (restore). GW A under way is FPL's:
 *  never changed here (the toast says so, COPY.live). */
function lineupEdit(ctx, gws, change, what, { points = true } = {}) {
  const I = info(ctx);
  // GW A under way is FPL's
  if (gws.includes(I.A) && isLive(ctx)) { toastOf(ctx)(COPY.live(I.A), 'warn'); return false; }
  const weeks = () => gws.map((g) => weekOf(plan(ctx), g)).filter(Boolean);
  const before = weeks();
  const snap = snapshot(ctx);
  const prevP = plan(ctx);
  change();
  flashLanding(ctx, prevP, { gws });
  const c = compare(ctx, { weeks: weeks() }, { weeks: before });
  // A9: one plain line, "Mbeumo captain · −0.7 pts (narrow call)"; a later GW's says its GW
  const subject = gws.length === 1 && gws[0] !== I.A ? COPY.inGw(what, gws[0]) : what;
  // what it did to the week's suggestions, said (lineupWhy; the user, 2026-10-22: saved-lineup moves are explained, not
  // changed)
  const why = lineupWhy(ctx, prevP, plan(ctx), gws);
  say(ctx, [points ? COPY.lineup(subject, gws, c.delta, c.label) : subject, ...why].join(' · '), undoOf(ctx, subject, () => restore(ctx, snap)));
  return true;
}

/** The GW-g buys of choice pl (planBack's `adds`) your saved GW-g lineup leaves on your bench: the choice is measured
 *  with it (asTaken: a sold player's slot his buy's, as FPL places him), so a buy for a player you bench starts on the
 *  bench and his number drops (the reviews, 2026-10-22: "Palmer 0.0" after a sub, Saka on your GW8 bench). None
 *  without a lineup of yours that week, for a Wildcard's or Free Hit's squad, or a choice not ready. Pure. → [id] */
export function benchedBuys(P, g, pl) {
  const w = weekOf(P, g);
  if (!w?.lineup || pl?.state !== 'ready' || SQUAD_CHIPS.has(pl.choice.chips?.[g])) return [];
  const bench = new Set((pl.ev?.gws.find((x) => x.gw === g)?.bench ?? []).map(Number));
  const benched = new Set(w.bench.map(Number));
  return planBack(P, g, pl).adds.filter((m) => benched.has(Number(m.out)) && bench.has(Number(m.in))).map((m) => Number(m.in));
}
/** What a lineup edit of GWs `gws` did to their suggestions (the reviews, 2026-10-22: a sub turned "Palmer +2.8" into
 *  0.0 and took the Free Hit off, unsaid; the user: saved-lineup moves are explained, not changed): each choice of plan
 *  view `P0` (before) that gained and that `Q` (after) lowers or no longer lists, in words: its buys your lineup now
 *  leaves on your bench (benchedBuys, newly), a Wildcard or Free Hit played in your lineup's places. Never a solve asked
 *  (plansListed). → [text] */
function lineupWhy(ctx, P0, Q, gws) {
  const out = [];
  for (const g of gws) {
    if (!weekOf(Q, g)?.lineup || !weekOf(P0, g)) continue;
    const now = plansListed(ctx, Q, g).filter((x) => x.state === 'ready');
    const names = [], chips = [];
    for (const a of plansListed(ctx, P0, g)) {
      if (a.state !== 'ready' || a.refRow || a.cmp.delta <= 0.05) continue;
      const k = forkKey(a.choice, g), b = now.find((x) => forkKey(x.choice, g) === k);
      if (b && b.cmp.delta > a.cmp.delta - 0.05) continue;
      const chip = a.choice.chips?.[g];
      if (SQUAD_CHIPS.has(chip)) { if (!chips.includes(chip)) chips.push(chip); continue; }
      const was = new Set(benchedBuys(P0, g, a));
      for (const id of b ? benchedBuys(Q, g, b) : []) if (!was.has(id) && !names.includes(Q.L.name(id))) names.push(Q.L.name(id));
    }
    if (names.length) out.push(COPY.onYourBench(names));
    out.push(...chips.map((c) => COPY.chipLineup(chipName(c), g)));
  }
  return out;
}

/** Your phone-only lineups of GWs `gws` back to the plan's own (GW A's in plan memory, later ones on this device). */
function resetLineups(ctx, gws) {
  const I = info(ctx);
  if (!gws.length) return;
  if (gws.includes(I.A) && memPlan(ctx)?.lineup) memOf(ctx).setLineup({ xi: null, bench: null, captain: null, vice: null });
  setLineups(ctx, I, Object.fromEntries(Object.entries(lineups(ctx, I)).filter(([g]) => !gws.includes(Number(g)))));
}

/** "Reset lineup" (the pitch's top-left pill: the viewed GW; or every GW in P.lineupGap.gws): those GWs' lineups back to the plan's best (resetLineups), an edit like any other (lineupEdit: the
 *  verdict, Undo). Only GWs whose lineup is yours (ViewWeek.lineup: a sub, a bench order or an armband the plan's own
 *  lineup there doesn't have); "Reset all" skips a frozen GW (isFrozen: none since Freeze went, 2026-10-12), and GW A
 *  under way refuses it (lineupEdit). */
export function resetLineup(ctx, gws) {
  const P = plan(ctx);
  let own = [].concat(gws).map(Number).filter((g) => weekOf(P, g)?.lineup);
  if (own.length > 1) own = own.filter((g) => !isFrozen(P, g));
  if (!own.length) return false;
  return lineupEdit(ctx, own, () => resetLineups(ctx, own), own.length > 1 ? 'Best lineups back' : 'Best lineup back');
}

/** F14: the pins planning `chip` for GW g makes, {pins: [memory.pinChip], drop: [id]} (the same chip planned in
 *  another GW of its half goes: one per half; a chip already planned in GW g is replaced, the pin's id being the GW's;
 *  a wildcard or a free hit makes every transfer of GW g free, so GW g's Roll or hits rule goes too: F17, the user's
 *  call, "−4 not relevant when wc/fh is on"). The one rule for chipPlan's edit and the background preparation of that
 *  edit (chipPreps: valuesFor with exactly these, so the tap's heal asks the same values, and the prepared road fits it).
 *  B58: the hits rules (an older road call's caps, memory.splitRoad; the per-week Auto-plan's hits rules are dropped on load since 2026-10-12, normalizeAccepted; a week's Roll, a plan's +) a wildcard
 *  or free hit takes off ride on its pin (`restores`, whole pins: composePins and
 *  planValues never read them, so the values are the same), with those of the one it replaces in GW g, and chipOff
 *  puts them back. P: plan(ctx). */
export function chipEdit(P, g, chip) {
  const half = halfEnd(P);
  const drop = P.pins.filter((p) => p.kind === 'chip' && Object.values(p.chips || {}).includes(chip) && (Number(p.gw) <= half) === (g <= half)).map((p) => p.id);
  const restores = [];
  if (chip === 'wc' || chip === 'fh') {
    const auto = P.pins.filter((p) => p.id === `roll:${g}` || p.id === `hits:${g}`);
    drop.push(...auto.map((p) => p.id));
    // your transfers of GW g go with it, as the chip row's + takes them back, so its Chips… tap is what the number it shows
    // counts (the owner, 2026-10-27, "fix all": option (b) of "two actions, one number"; Chips… kept them)
    drop.push(...transferPinsAt(P, g));
    restores.push(...auto, ...(P.pins.find((p) => p.id === `chip:${g}`)?.restores ?? []));
  }
  // your picks of a Wildcard or Free Hit week whose chip goes or changes (moved from GW8, or another chip in GW g) go
  // with it, named (chipWords): left, one became an ordinary buy that week (review 5, 2026-10-12)
  const was = (x) => chipPins(P).find((c) => c.gw === x)?.chip ?? weekOf(P, x)?.chip ?? null;
  const moved = P.pins.filter((p) => drop.includes(p.id) && p.kind === 'chip').map((p) => Number(p.gw));
  drop.push(...picksAt(P, [...moved, ...(was(g) !== chip ? [g] : [])]).map((p) => p.id));
  return { pins: [pinChip(g, chip, { label: `${chipName(chip)} GW${g}`, ...(restores.length ? { restores } : {}) })], drop };
}
/** B58: a Roll (a plan's +: "GW7 roll", "GW7 lock", COPY.rollRule) or a hits rule of GW g
 *  ("Up to −4 in GW7" or "FT only in GW7") in words: the chip toasts that take it off (chipPlan) and bring it back
 *  (chipOff). */
const autoRuleName = (q, g) => (isRoll(q) ? COPY.rollRule(g, Number(q.caps?.[g] ?? 0)) : num(q.hits?.[g]) ? COPY.hitsUpTo(num(q.hits[g]), g) : COPY.freeOnly(g));

/** A chip planned for GW g in words, the one way chipPlan and addPlan say it (B58): "Free Hit planned for GW8", the chip
 *  GW g played before it (`swap`, a pin of yours or the model's own: chipPlan's verdict counts against it, "vs Bench
 *  Boost"; `inPlace`, addPlan's toast says it, "in place of Bench Boost": M4, the plans review, 2026-10-11, a take
 *  dropped your chip unnamed), and the Roll and hits rules it takes off (chipEdit's `drop`) as autoRuleName names them
 *  ("Up to −4 in GW8 removed"; a Roll as withTaken says it). → {what, swap, taken: [Pin]} */
function chipWords(P, g, chip, drop, { inPlace = false } = {}) {
  const prev = chipPins(P).find((x) => x.gw === g)?.chip ?? weekOf(P, g)?.chip ?? null;
  const swap = prev && prev !== chip ? chipName(prev) : null;
  const gone = P.pins.filter((p) => p.kind === 'hits' && drop.includes(p.id));
  const rolls = P.pins.filter((p) => isRoll(p) && drop.includes(p.id));
  const picks = P.pins.filter((p) => isPick(p) && drop.includes(p.id));
  // (your transfers a Wildcard or Free Hit takes back: chipEdit)
  const mine = new Set(SQUAD_CHIPS.has(chip) ? transferPinsAt(P, g) : []);
  const moved = P.pins.filter((p) => mine.has(p.id) && drop.includes(p.id) && !picks.includes(p));
  const head = `${chipName(chip)} planned for GW${g}`;
  const what = [withTaken(P, inPlace && swap ? COPY.inPlaceOf(head, swap) : head, [...rolls, ...picks, ...moved]), ...gone.map((q) => COPY.chipRemoves(autoRuleName(q, g)))].join(' · ');
  return { what, swap, taken: [...rolls, ...picks, ...moved, ...gone] };
}
/** The rules of yours (ids) that make GW g's transfers, none in a Wildcard or Free Hit week (its picks are its own:
 *  chipEdit): what a Wildcard or Free Hit played there takes back, as the chip row's + does (planTake's `gone`). */
const transferPinsAt = (P, g) => (squadWeek(weekOf(P, g)) ? [] : goneIds(P, yoursTakenBack(P, g, [])));

/** M11 / F12 / F14: a chip made the plan (chipEdit). road: the solve of exactly these pins (a chip prepared with your
 *  rules, or with none the bake's pre-solve): the plan at once (memory.offer / findRoad); else the plan heals, the plan
 *  before it drawn meanwhile (a preparation of it still solving is the same values: the plan service joins it at your priority). The
 *  Roll or hits rule of GW g it takes off (a Wildcard or Free Hit) is named in its verdict ("Wildcard planned for GW6 ·
 *  Up to −4 in GW6 removed", B58: autoRuleName), and its one Undo brings both back. M1: the verdict is the chip's gap against not playing it (or
 *  against the week it was planned in), never "better than before"; `less`: what this week gives up against the chip's
 *  honest best week ("3.9 less than GW9", useChip). A Wildcard or Free Hit under your team as it is (the user,
 *  2026-10-22: "vs rolling everywhere"): its Chips… row's number, against the week's roll plan (chipStates: chipNumber),
 *  and its "less than" that row's best week's number less it, both vs rolling (none where either isn't known), as its
 *  row and the week line say them. */
export function chipPlan(ctx, g, chip, road = null, { less = null } = {}) {
  const P = plan(ctx);
  const { pins, drop } = chipEdit(P, g, chip);
  const was = plannedAt(P, chip, g);
  // (the chip it replaces there named in its words, "Bench Boost planned for GW10 in place of Free Hit": its toast's "· +x
  // vs Free Hit" said it until the owner, 2026-10-27, "remove this 'vs ..' message from black tab appearing")
  const { what, swap, taken } = chipWords(P, g, chip, drop, { inPlace: true });
  const row = SQUAD_CHIPS.has(chip) && P.mem?.hold ? chipStates(ctx, P, g, chipSource(ctx, P)).find((x) => x.chip === chip) : null;
  // (both on one basis: a week of yours counts against your plan, another against rolling, decision K)
  const gap = row?.cmp && row.best && row.best.gw !== g && row.best.delta != null && row.best.vs === row.vs ? COPY.chipLess(row.best.delta - row.cmp.delta, row.best.gw) : null;
  // the gain is the new plan against the one before: against the chip it replaces when it replaces one, named as such
  // (the review, 2026-10-08: "Wildcard … +14.8 vs not playing it" was +14.8 vs the Free Hit it replaced); H15: and then
  // no "less than" the best week: that week's figure kept the chip this one replaces (BB for TC in GW9 "5.1 less than
  // GW8", BB in GW8 measured with TC still in GW9; moved there, BB lost 0.6)
  return edit(ctx, {
    pins, drop, road, from: g, what, taken,
    text: row ? () => COPY.chipToast(what, gap) : (Q, prev) => {
      const c = compare(ctx, { weeks: Q.weeks }, { weeks: prev.weeks });
      // against no chip only when it replaced none, here or in another week: then its row's number too (chipGain)
      if (was == null && !swap && SQUAD_CHIPS.has(chip)) chipTold(Q, g, c);
      return COPY.chipToast(what, swap ? null : less);
    },
  });
}

/** The chip GW g plays taken off (a pin of yours goes; the model's own chip there is lifted by a 'none' pin): the
 *  weeks wait for the solve, the plan before it drawn (engine.planChip's ≈ went: the owner, 2026-10-26).
 *  B58: the Roll and hits rules your chip took off (chipEdit's `restores`) come back in the same edit, named in its toast
 *  ("No chip in GW7 · Up to −4 in GW7 back"); its one Undo takes back both. */
export function chipOff(ctx, g) {
  const P = plan(ctx);
  const { mine, picks, pins: back, drop } = chipOffParts(P, g);
  const off = withTaken(P, `No chip in GW${g}`, picks);
  if (!mine) return edit(ctx, { pins: [pinChip(g, null)], drop, from: g, what: off, taken: picks, text: vsPrev(ctx, off) });
  const what = [off, ...back.map((q) => COPY.chipBack(autoRuleName(q, g)))].join(' · ');
  return edit(ctx, { pins: back, drop, from: g, what, taken: picks, text: vsPrev(ctx, what) });
}
/** F14 / M1: chip c played in GW g, or taken off when GW g already plays it (the user, 2026-10-13: from the pitch, the
 *  Bench Boost by holding the bench and the Triple Captain by holding the C still; any chip from the week line's Chips…, sheets/chips.js; a Wildcard or Free Hit also as a suggested plan's +, addPlan). Its background solve (chipSource: prepared with your rules,
 *  or with none the bake's pre-solve) is that plan at once; one not in yet heals (joining its preparation in flight). Its
 *  toast says the gap against not playing it (or the week it was planned in), and what a week other than its honest
 *  best gives up ("3.9 less than GW9"; never in place of another chip: chipPlan), with Undo; a Wildcard's or Free Hit's
 *  under your team as it is against rolling, its Chips… row's (chipPlan); one it can't play says why (chipCheck). → bool */
export function useChip(ctx, c, g) {
  const P = plan(ctx);
  if (weekOf(P, g)?.chip === c || chipPins(P).some((x) => x.chip === c && x.gw === g)) return chipOff(ctx, g);
  const check = chipCheck(ctx, P, c, g);
  if (!check.ok) { toastOf(ctx)(check.reason, 'warn'); return false; }
  const src = chipSource(ctx, P);
  const pre = src.at(c, g);
  // (a Wildcard's or Free Hit's under your team as it is: chipPlan's own, vs rolling)
  const best = honestBest(halfBests(P, src, g), c);
  const less = best && best.gw !== g && pre.state === 'ready' ? COPY.chipLess(best.delta - pre.cmp.delta, best.gw) : null;
  return chipPlan(ctx, g, c, pre.state === 'ready' ? pre.road : null, { less });
}
/** What taking GW g's chip off changes in your rules (chipOff; a plan row in your chip week whose choice plays none:
 *  its fork and its +, the user 2026-10-13): your chip rule (`mine`) and that week's picks go, named (as chipEdit's),
 *  and the Roll and hits rules the chip took off come back (B58: a Roll only while nothing of yours moves someone in
 *  GW g, an ask you added under the chip: clashing). → {mine, picks, pins (back), drop (ids)} */
function chipOffParts(P, g, { locked = false } = {}) {
  const mine = P.pins.find((p) => p.id === `chip:${g}`) ?? null;
  const picks = picksAt(P, [g]);
  const drop = [...(mine ? [`chip:${g}`] : []), ...picks.map((p) => p.id)];
  // `locked`: the caller makes GW g exactly a choice with its own Roll (a plan's + and its fork's solve: the review,
  // 2026-10-13), so a Roll the chip had taken off never comes back over it; else it comes back unless an ask that
  // stays clashes (the week's picks go with the chip: the pre-release review, 2026-10-13, a pick lost the Roll)
  const stays = asksOf(P).filter((p) => !drop.includes(p.id));
  const back = (mine?.restores ?? []).filter((q) => !isRoll(q) || (!locked && !clashing(P, q, stays).length));
  return { mine, picks, pins: back, drop };
}
/** Your Wildcard or Free Hit in GW g that choice c ({moves, chips}) doesn't play there (the user, 2026-10-13: after the
 *  Wildcard's plan row the week's other choices stay, each "instead of Wildcard", as after a transfer's) | null. */
const chipBackOf = (P, g, c) => { const ch = weekOf(P, g)?.chip ?? null; return SQUAD_CHIPS.has(ch) && !SQUAD_CHIPS.has(c?.chips?.[g]) ? ch : null; };

/**
 * What keeps your plan off the model's (F5): your rules the model's road breaks (memory.rulesBroken: a Keep it
 * sells, a veto it buys, your GW-A call, a chip), a hits rule whose GW the model's road takes more hits in (F17: a
 * restriction), and a locked road pin (`locked`: frozen weeks, none since Freeze went, 2026-10-12).
 * → [{pin, icon, text, desc, why, locked}]
 */
export function blockersOf(P) {
  const c = composePins(P.pins, { from: P.A, to: P.end });
  const cells = brokenCells(P.base, c);
  const nm = P.L.name;
  // the hold is not a rule of yours (memory's derived pin)
  const list = rulesBroken(P.base, P.pins.filter((p) => p.id !== 'hold'), { from: P.A, to: P.end });
  // a hits rule of yours (a restriction, F17) whose GW the model's road takes more hits in than it allows
  for (const w of P.base.weeks || []) {
    const cap = c.hits[Number(w.gw)];
    const hits = P.pins.find((p) => p.id === `hits:${w.gw}`);
    if (hits && cap !== undefined && (num(w.hits) ?? 0) > cap && !list.includes(hits)) list.push(hits);
  }
  // a player your rule keeps out that the model's road has in GW g: it keeps him (he was in its squad before g)
  // or buys him
  const baseSquad = (g) => { const w = P.base.weeks.find((x) => Number(x.gw) === g); return w ? [...ids(w.xi), ...ids(w.bench)] : []; };
  const keeps = (id, g) => (g <= P.A ? P.owned ?? [] : baseSquad(g - 1)).includes(id);
  return list.map((p) => {
    // a Roll is broken by the model's transfer in its GW (memory.rulesBroken: it holds no player)
    const roll = isRoll(p);
    const cell = roll ? null : cells.find((x) => x.pin === p.id);
    const locked = p.id === 'road' && !!p.locked;
    // a rule that holds him where the model's road hasn't him: a sale it makes (it had him the GW before), else a buy
    // it never makes (a Wish of a player it never owns); one that keeps him out where it has him: a keep or a buy
    const had = cell && keeps(cell.id, cell.gw);
    const what = !cell ? null : cell.want === 'in' ? (had ? `blocks selling ${nm(cell.id)} in GW${cell.gw}` : `the suggested plan has no ${nm(cell.id)} in GW${cell.gw}`)
      : `blocks ${had ? 'keeping' : 'buying'} ${nm(cell.id)} in GW${cell.gw}`;
    const why = p.id === 'road' ? (locked ? `the suggested plan would remake ${span(frozenOf(P).length ? frozenOf(P) : [P.A])}` : 'the suggested plan differs')
      : roll ? `the suggested plan makes a transfer in GW${p.gw}` : what ?? (p.kind === 'hits' ? `the suggested plan takes a hit in GW${p.gw}` : null);
    return { pin: p, ...ruleOf(P, p), why, locked };
  }).concat((P.weeks || []).filter((w) => w.lineup).map((w) => ({
    // a sub or armband of yours is part of the gap too (phone-only: no rule to drop; F7)
    pin: null, id: `lineup:${w.gw}`, icon: 'swap', text: `your GW${w.gw} lineup`, desc: '', why: 'a sub or the armband', locked: false, lineup: true,
  })));
}

/**
 * Compare → the model's plan, honestly (F5): with nothing of yours in the way it is the model's plan (your calls,
 * rules and later lineups go, with Undo); else `drop` (the blockers' pin ids, never a locked road pin or a frozen
 * week's lineup: none since Freeze went) come off and
 * the plan re-plans without them. Never a ✓ for a no-op: the line says what happened when the plan lands.
 */
export function adoptModel(ctx, { drop = null } = {}) {
  if (!editable(ctx)) { toastOf(ctx)(OFFLINE_EDIT, 'warn'); return false; }
  const I = info(ctx);
  const P = plan(ctx);
  if (drop) {
    const off = P.pins.filter((p) => drop.includes(p.id) && !(p.id === 'road' && p.locked));
    // 'lineup:<gw>': your lineup there back to the plan's own (blockersOf)
    const lus = drop.filter((d) => String(d).startsWith('lineup:')).map((d) => Number(String(d).slice(7))).filter((g) => !isFrozen(P, g));
    if (!off.length && !lus.length) return false;
    const words = [...off.map((p) => ruleOf(P, p).text), ...lus.map((g) => `your GW${g} lineup`)];
    const what = `Without ${words.join(', ')}`;
    return edit(ctx, {
      drop: off.map((p) => p.id), from: P.A, what, also: () => resetLineups(ctx, lus),
      text: (Q, prev) => (Q.onLine ? BACK : vsPrev(ctx, what)(Q, prev)),
    });
  }
  const snap = snapshot(ctx);
  OV = null;
  memOf(ctx).clearPins({ keepRoad: false });
  resetLineups(ctx, I.gws.filter((g) => !isFrozen(P, g)));
  flashLanding(ctx, P, { gws: I.gws });
  const Q = plan(ctx);
  say(ctx, Q.onLine ? BACK : 'Re-planning without your rules…', undoOf(ctx, 'Without your rules', () => restore(ctx, snap)));
  return true;
}

// ---------------------------------------------------------------- the hold: your team, the model's moves as suggested plans

/**
 * The model's single moves for GW g on your plan (under the hold, memory.holdOf, the user 2026-10-08: your team, no
 * transfer unless you add one; since 2026-10-13 in both modes, "Same list, both modes"), plansOf's one-move choices (decision 6: no row of their own since the plans came in,
 * the user 2026-10-11): every move of the bundle's roads (the model's plan, the roll, its vetoes and
 * slides, the chips' pre-solves: whichever GW they make it in) that GW g's squad on your plan can make (it sells a player
 * the squad has, for one it hasn't, none your rules keep out), each measured as that move added to your plan in GW g
 * (addMove's ≈: the engine, best XI each week from GW g, its hits counted) against your plan (baseline): {out, in,
 * cmp {delta, label}, model (the model's own plan makes it in GW g)}. Under the hold a plan of exact moves
 * is the engine's own evaluation (memory.holdRoad), so the number is the one adding it gives. Every one that fits, losers
 * too, before your first transfer of the week as after it (the user, 2026-10-21: "why all other players only suggested as
 * a second transfer when saka changed to palmer but not as first", then "Same both times, worse ones too"; once your plan
 * uses the week's free transfers, extraWeek, its number after the −4 it takes: the user, 2026-10-08, a lone losing pair
 * under "Suggested" read as advice and hid the other moves; 2026-10-10, "Extra transfers (−4 each)" read as transfers
 * made). Under the hold one the 2026-10-18 bars keep from being the week's suggestion is `early` (earlyOf: no more than
 * 0.05 over your plan, or worth no less made the next week; the user, 2026-10-18, Murillo → Hill offered in GW8 for
 * +1.8, +2.2 from GW9; Dovin → Petrović +0.07 from either): listed, never lit, its + quiet (litOf, plPays). Those that
 * pass first, then the `early` ones, each best first (plansOf takes its one-move choices in this order). Never a move of yours: the player you sell there is not the
 * squad's, the one you buy is, and none sells or buys a player your plan moves from GW g on (movedFrom: a buy back of
 * one you sell there, or your GW7 Scott → Groß offered again in GW6; your moves only, Forkcast's later ones are planned
 * around it). Never one your rules forbid: a buy they keep out
 * then, a sale of one your Keep holds then or later (pinOf: "Keep Scott · GW6" still offered Scott → Groß, and the
 * pair was measured against it: the checker, 2026-10-09). None for GW A under way (inkAt, B7). In a week Forkcast re-picks (or before one) a move is measured as the plan makes it (addYours: in place of one
 * of Forkcast's transfers there, not with a −4 its rule refuses): `instead` that transfer ({gw, out, in}), `hit` (the
 * move brings GW g a hit: its number is after it). Once per plan view and GW.
 */
const SUGGESTIONS = new WeakMap();
export function suggestionsOf(ctx, P, g) {
  if (inkAt(ctx, P, g) || !weekOf(P, g)) return [];
  let by = SUGGESTIONS.get(P);
  if (!by) SUGGESTIONS.set(P, (by = new Map()));
  if (by.has(g)) return by.get(g);
  const w = weekOf(P, g), squad = w.squad, into = squadBefore(P, g);
  const no = barred(P, g);
  const mine = movedFrom(P, g, true);
  const kept = keptFrom(P, g);
  const d0 = draftOf(ctx);
  const before = baseline(ctx, g);
  const hitsAt = (ev) => ev.gws.find((x) => x.gw === g)?.hits ?? 0;
  // B129: a move you took off this session is still offered, as yours (`removed`: "removed by you")
  const gone = removedAt(P, g);
  const out = [];
  for (const m of modelMoves(P, g).values()) {
    if (!into.includes(m.out) || !squad.includes(m.out) || squad.includes(m.in) || mine.has(m.out) || mine.has(m.in) || no.has(m.in) || kept.has(m.out)) continue;
    const r = addYours(ctx, P, g, m.out, m.in, d0);
    if (r.problem) continue;
    const cmp = compare(ctx, r.ev, before);
    const removed = gone.has(`${m.out}>${m.in}`);
    // (your rules already hold for it the next week: barred, keptFrom are from GW g on)
    const early = earlyOf(ctx, P, g, [m], r.ev, before, d0);
    out.push({ ...m, cmp, instead: r.instead, hit: hitsAt(r.ev) > hitsAt(before), ...(early ? { early } : {}), ...(removed ? { removed: true } : {}) });
  }
  out.sort((a, b) => !!a.early - !!b.early || b.cmp.delta - a.cmp.delta || b.model - a.model);
  by.set(g, out);
  return out;
}

/**
 * The 2026-10-18 bars under the hold (the user: "why murillo-hill suggested in gw8 if worse points"; "more than 0.05
 * over your plan"), GW g's transfers `ms` (on top of yours; their row `ev`, measured from GW g on your plan d0 against
 * `before`, by addMove's `measure`) don't pass, so they are no suggestion of the week: listed since 2026-10-21 (the user:
 * "Same both times, worse ones too"), never lit on the pitch, their + quiet (litOf, plPays). `true`: from GW g on they
 * gain no more than 0.05 over your plan (their number, or their Why sheet's "Your total", says so); the next GW: the same moves
 * made then are worth no less (waitsAWeek; their row says "as good in GW9": COPY.asGoodIn). One rule for every move a
 * week lists (suggestionsOf, plansOf). None off the hold, nor once GW g's free transfers are used (extraWeek: every move
 * that fits is a choice there, after its −4). → true | GW | null (they pass)
 */
function earlyOf(ctx, P, g, ms, ev, before, d0, measure = null) {
  // (none in a week your plan leaves short of money: owedAt, a choice paying it back is no loss next to it)
  if (!P.mem?.hold || extraWeek(P, g) || owedAt(P, weekOf(P, g))) return null;
  if (compare(ctx, ev, before).delta <= 0.05) return true;
  return waitsAWeek(ctx, P, g, ms, ev, before, d0, measure) ? P.gws.find((x) => x > g) : null;
}

/**
 * Under the hold, whether GW g's transfers `ms` (on top of yours; their row `ev`, measured from GW g on your plan d0)
 * are a later week's: the same moves made the next week instead, measured from GW g as their row is, are worth no less
 * (the user, 2026-10-18: "why murillo-hill suggested in gw8 if worse points": Murillo → Hill +1.8 from GW8, Hill on the
 * bench there, +2.2 from GW9, where the model's own plan made it; "why Dovin → Petrović in suggestions in gw8": +0.07
 * either way, all of it GW9's, the free transfer spent a week early). A row must beat waiting by more than the list's
 * 0.05. From the next week on both have the same squad and, the week after, the same free transfers, so moves that gain
 * GW g itself beat waiting without the second measure. Under the hold only, as the suggestions' gain bar (earlyOf): off it a move
 * takes the place of one of Forkcast's transfers in its week (addYours' `instead`), so the two weeks would give way to
 * different transfers, and its fork's solve plans what follows. Never once GW g's free transfers are used (extraWeek:
 * every move that fits is a choice, after its −4), nor where the next week takes no sale (a Wildcard or Free Hit week)
 * or can't take these (problem). `before` and `measure`: the row's (what it counts against, addMove's measure).
 */
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
  return compare(ctx, measure ? measure(d, g) : estimate(ctx, d, g), ev).delta >= -0.05;
}

/** Every move of the bundle's roads (the model's plan, the roll, its vetoes and slides, the chips' pre-solves: whichever
 *  GW they make it in), once each: `${out}>${in}` → {out, in, model (the model's own plan makes it in GW g)}. The
 *  suggestions' source (suggestionsOf) and your transfer's other buys' (ownAltsOf). */
function modelMoves(P, g) {
  const pool = new Map();
  for (const r of bundleRoads(P.b.roads)) {
    for (const w of r.weeks || []) {
      for (const m of pairedMoves(w.out, w.in, P.L)) {
        const k = `${m.out}>${m.in}`;
        const model = r === P.base && Number(w.gw) === g;
        if (!pool.has(k) || model) pool.set(k, { out: Number(m.out), in: Number(m.in), model });
      }
    }
  }
  return pool;
}

/**
 * The suggested plans (the user, 2026-10-11: "why in suggestion top transfers is dewsbery hull but in suggested plan is
 * kayode-vuskovic. make him to suggest plans, not just players"; decision 6, plans in every week: "why on gw8 different
 * design … i again suggest transfers"): in either mode (the user, 2026-10-13: "Same list, both modes"), in every GW g
 * you can change (none under way: inkAt; in your Wildcard or Free Hit week each choice takes the chip back: chipBackOf),
 * GW g's choices as a fork, one row each: the moves it makes in GW g, none (a roll), or
 * a Wildcard or Free Hit played in GW g ("i must show 'play wc' and 'play fh' in plan also"; only in its best week of the
 * window past the noise, 2026-10-12: squadOk), each with the best plan
 * after it ("for GW7 we choose only Tavernier → Dewsbury-Hall": what follows is re-planned each week anyway), all on
 * your plan as it stands: your transfers in other weeks kept, Forkcast planning the rest around them. In a week with
 * transfers of yours its choices are their alternatives (your own choice is your plan: no row): a roll takes them back,
 * another buy for a sale of yours (ownAltsOf: the "Instead of" row before), one more move (suggestionsOf). A chip in a
 * later week is that week's own decision, its row there ("why gw7 roll duplicated"; "Barry → Walle Egeli · Free Hit
 * GW8": the chip's points read as the sale's), so no follow-up plays one but yours, and the numbers compare like with
 * like.
 *  · the choices: those of every plan the bundle's roads hold from g on whose weeks before g are yours (the model's
 *    plan, its Roll, vetoes, slides, its Wildcard and Free Hit pre-solves for GW g; M2: one that plays a Wildcard or Free
 *    Hit later still gives its GW-g moves as a choice, its own solve), a Wildcard and a Free Hit in GW g while you have
 *    them and none is planned in their half (L6: chipEdit would take that one off), your transfers' other buys and the
 *    best single moves there, then a roll (none where your own GW-g choice is itself a roll: that is your plan);
 *    the same kind before your first transfer of the week as after it (the user, 2026-10-21: "why when i change saka
 *    first it only shows palmer and only shows rice when i change palmer but never suggest saka to rice as alternative
 *    here", then "Same both times, worse ones too"): every single move that fits, losers too (suggestionsOf), and while
 *    the week has a free transfer the best two suggestions' sales with their other buys (ownAltsOf: the best two each,
 *    as your transfer's once taken, so a lit suggestion's place lists what its buy's place will), and each move of a
 *    pair alone (the user, 2026-10-21, TORPEDO's GW9: "why it not suggests de cuyper to hill as a separate transfer -
 *    and only in combination?"; pairSingles: asked after the pair and the week's best two; a pair whose moves the week
 *    can make in parts, each alone, is no choice itself, never one take, only its parts are, each group a choice of its
 *    own in the room it would have taken, or none where the budget can't hold them all: splitOf, the owner, 2026-10-25,
 *    "when transfers can be splitted they are shown separately"), another road's pair than
 *    the model's only with room for its moves alone after it, best first (the user, 2026-10-21, Raketa's GW9: "why not
 *    offer alternatives without also buying palmer": four roads' "… + Saka → Palmer" took the room); the transfer
 *    choices asked at most FORK_MAX besides a move you removed there (B129: yours, never crowded out), none whose GW-g moves can't be
 *    made on your plan (fitsAt) but a pair's move that needs the pair's other sale (`needs`: listed, never asked, its +
 *    off); under the hold one the 2026-10-18 bars keep from being the week's suggestion `early`
 *    (earlyOf: suggestionsOf's for a single move, else measured as its + takes the week; the user, 2026-10-18: "GW8
 *    Dovin → Leno 0.0", a Bench Boost pre-solve's move without its chip), never lit (litOf), its + quiet (plPays), its
 *    solve asked after the others' (the lit choice's never waits behind it);
 *  · each choice's plan: the best known one (the highest number: the best follow-up Forkcast found, never drawn: the
 *    user, 2026-10-12, "show only this week moves") of
 *    the road plans that keep your plan's other weeks (planOfRoad) and its own solve's (forkValues), asked unless a road
 *    solved the whole window from your team for it with no other chip (in GW A the model's plan, its Roll, its GW-A chip
 *    pre-solves); while it solves "checking…", "waiting" or "waiting for your edit's check" (`wait`, the pair's words) and no number
 *    (B17); a solve that fails or can't be asked, with no road plan of the choice, keeps its row with the reason
 *    (`failed`, why: 'offline' | 'error' (asked again soon: forkAsk) | 'infeasible' (no plan keeps your rules with it)
 *    | 'nofit'; under the hold also a choice whose week alone can't be made, its money from a later move: 'nofit'; a
 *    pair's move the week can't make alone, 'needs': `needs` the sales it needs, `problems` all it lacks alone);
 *  · its number: its moves and chips made yours on the engine (best XI each week, its hits counted) against your plan
 *    (baseline): the list's order (the + takes GW g alone: planTake, addPlan); none with a move your rules forbid (barred, keptFrom), a
 *    squad without a player your Keeps hold then (keptCells: a Wildcard's or Free Hit's changes), a
 *    player sold twice (one 'sell:<id>' rule a player), a buy back of a player your plan has after his
 *    last sale of yours (L2: rebought), one that doesn't fit (problemOf), or one that is your plan itself (L1);
 * Ready ones best first, then those failed, then those solving; after them all each choice making a move you took off
 * GW g this session (B129, saffer Part 4 §8: a transfer you removed came straight back at the top, as if new; the user,
 * 2026-10-21: fix the known issues: once removed it was never offered again that session), `removed`: yours ("removed
 * by you"), whichever road or move offers it, never lit (litOf), its + quiet (plPays). Once per plan view and GW (and
 * per landed solve: PAIR.rev).
 * Your team as it is (the hold): each row's number is its plan against the roll's, Forkcast's later moves on both sides
 * (the user, 2026-10-19: "Gain over rolling"), the roll's own row the reference (`refRow`, no number); what its + gives,
 * GW g's choice alone, is `alone` (the total's change), and no roll row where it would be your plan itself (review 6,
 * 2026-10-13). The list carries the two plans your week's transfer row compares (`ref`, `mine`: rollOf),
 * `refWait` while the roll's plan solves, and `full` where its asked transfer choices reached FORK_MAX.
 * `peek`: the list as the solves already in stand (FORK_ROADS: forkRead), none asked, none let go, nothing kept (a
 * week not drawn: plansListed's, the removal toast's words whichever week is drawn; the review of the first-use
 * proposals, 2026-10-21). `prep`: the next week prepared while the viewed one is settled (prepNext): its solves asked as
 * a draw of it would ask them, at the lowest priority (purpose 'pairnext'), none let go, nothing kept.
 * → [{state: 'ready', choice, moves: [{gw, out, in}], chips: {gw: chip}, draft, ev, cmp, hits: {gw: n}, road, model,
 *    taken?, alone?, full?, fullEv?, vsRoll?, refEv?, refRow?, vsBest?, best?, bestFrom?, vsMine?, rolls?, removed?, early?, placed?} | {state: 'solving', choice, wait, removed?, early?, placed?} | {state:
 *    'failed', choice, why, needs?, problems?, removed?, early?, placed?}] (under the hold `taken`: the week-alone draft its `ev` and `alone` are measured on, `draft`
 *    the solve's whole plan, `full` / `fullEv` that plan measured; `placed`: a place's other buys you opened, beside
 *    FORK_MAX and the ten listed: placesAsked)
 */
const PLANS = new WeakMap();
const FORK_MAX = 8;
/** The places you opened (openPlace; the owner, 2026-10-26, of Calvert-Lewin's place dealing Evanilson alone after a
 *  take: "why it not suggest more players if space allows ... could also offer other affordable variants which go after
 *  evanilson like N.Jackson", then "build it"): GW g's cards whose other buys the week's choices take beside FORK_MAX
 *  (plansOf), PLACE_ALTS each, until your rules change (another plan: its places opened anew). */
const PLACE_ALTS = 3;
/** The choices listed (on the pitch and in the Week sheet): ten at most, a place's other buys you opened beside them
 *  (plansOf's `placed`). The single-move rows they replaced (decision 6) went with their renderers on 2026-10-13 ("Same
 *  list, both modes"): their moves are choices. Pure. plans (in their order) → those listed */
const MORE_SUGGESTIONS = 10;
export const listedOf = (plans) => { let n = 0; return plans.filter((x) => x.placed || n++ < MORE_SUGGESTIONS); };
const PLACES = { sig: null, at: new Set() };
const rulesSig = (P) => P.pins.map((p) => p.id).join(',');
const placesAsked = (P, g) => (PLACES.sig === rulesSig(P) ? [...PLACES.at].filter((k) => k.startsWith(`${g}:`)).map((k) => Number(k.slice(k.indexOf(':') + 1))) : []);
/** Card `a`'s place opened in GW g: his other buys asked (plansOf), the week's choices drawn again where it is new →
 *  whether it is. */
export function askPlace(ctx, P, g, a) {
  const sig = rulesSig(P), k = `${g}:${a}`;
  if (PLACES.sig !== sig) Object.assign(PLACES, { sig, at: new Set() });
  if (PLACES.at.has(k)) return false;
  PLACES.at.add(k);
  pairChanged(ctx);
  return true;
}
const SQUAD_CHIPS = new Set(['wc', 'fh']);
/** Your transfers (a rule of yours makes each: pinOfMove) in the weeks after GW g that aren't a Wildcard's or Free Hit's
 *  squad: every plan from GW g keeps them (decision 6). → [{gw, out, in}] */
const ownAfter = (P, g) => P.weeks.filter((w) => w.gw > g && !squadWeek(w))
  .flatMap((w) => w.moves.filter((m) => pinOfMove(P, m)).map((m) => ({ gw: w.gw, out: m.out, in: m.in })));
const movesSig = (ms) => ms.map((m) => `${m.gw}:${m.out}>${m.in}`).sort().join(',');
export function plansOf(ctx, P, g, { peek = false, prep = false } = {}) {
  const w = weekOf(P, g);
  // in both modes (the user, 2026-10-13, "Same list, both modes": the switch only decides who makes the rest of the plan)
  if (inkAt(ctx, P, g) || !w) return [];
  // your Wildcard or Free Hit this week (the user, 2026-10-13: its plan row taken, the list "stop showing other
  // suggestion"): your choice is the chip, its changes are its squad's, and the alternatives take it back (chipBackOf)
  const chipMine = SQUAD_CHIPS.has(w.chip) ? w.chip : null;
  let by = PLANS.get(P);
  if (!by || by.rev !== PAIR.rev) PLANS.set(P, (by = { rev: PAIR.rev, gw: new Map() }));
  if (by.gw.has(g)) {
    // (its taps' solves asked as its choices are checked, at every draw: presolveWeek; none from inside a tap made dry)
    const got = by.gw.get(g);
    if (!peek && !prep && !DRY) presolveWeek(ctx, P, g, got);
    return got;
  }
  const d0 = draftOf(ctx), before = planBaseline(ctx, P, g), mine = flatMoves(d0);
  // (the plans set against rolling measured alike on both sides, in the xP order: asTaken's `held` false; what a + gives,
  // `alone`, on the lineups the plan it lands plays, `before`'s)
  const asIs = planBaseline(ctx, P, g, false);
  const ownMoves = mine.filter((m) => pinOfMove(P, m));  // your transfers: their sales start a buy back's window (rebought)
  const squadAt = (x) => !!squadWeek(weekOf(P, x));
  // your own GW-g choice (no row: it is your plan), and your plan's moves from g (a plan that repeats them is yours)
  const now = chipMine ? [] : w.moves.map((m) => ({ gw: g, out: m.out, in: m.in }));
  const yours = forkKey({ moves: now, chips: chipMine ? { [g]: chipMine } : {} }, g);
  // while Forkcast makes your transfers (the node tests' planDefault 'model') a row's number is its solve's against your
  // plan; under the hold against the roll's (vsRef, below)
  const followed = !P.mem?.hold;
  // a Wildcard row keeps your later weeks as they are (forkValues: the squad its + lands lasts; review 6): its plan always
  // its own solve so (never a bake road, solved with Forkcast's later moves: the + would heal another squad), set against
  // a roll that keeps them too (`held`: neither side has Forkcast's later moves; the plans review, 2026-10-19)
  const heldOf = (c) => !followed && c.chips?.[g] === 'wc';
  const mineFrom = movesSig(mine.filter((m) => m.gw >= g && P.gws.includes(m.gw) && !squadAt(m.gw)));
  const allowed = (p) => {
    // a Wildcard or Free Hit week's changes are the chip's squad, no sale rule of yours: only the other weeks' sales
    // must be one per player
    const sold = p.moves.map((m) => m.out);
    return new Set(sold).size === sold.length && !p.moves.some((m) => isFrozen(P, m.gw) || barred(P, m.gw).has(m.in) || keptFrom(P, m.gw).has(m.out));
  };
  // You → Hits (P.mem.hitsMax): no week of a plan takes more hits than it allows or your plan takes there already (a
  // bake road was solved at the solver's own cap; a fork's own solve under the setting: memory's derived 'hits' pin)
  const most = P.mem?.hitsMax ?? null;
  const hitsAt = (e, x) => e.gws.find((s) => s.gw === x)?.hits ?? 0;
  const withinHits = (m) => most === null || m.ev.gws.every((s) => s.hits <= Math.max(most, hitsAt(before, s.gw)));
  // every player your Keeps hold from g on is in the plan's squad then (keptCells, by the chip it plays in GW g), as the
  // row's own solve keeps him (forkValues: your pins): a Wildcard's or Free Hit's changes, in GW g or in a chip week of
  // yours after it, are no moves allowed sees (planOfRoad leaves them out), so a bake road solved without your rules
  // (GW A's exact pre-solve; a road beating the fork's solve by gain) is never the row's plan when it drops one (the
  // review of the first-use proposals, 2026-10-21: "Keep Gabriel in GW8", the Free Hit token still +2.9, its Why sheet
  // "Gabriel → N.Williams" and no kept row, while its + kept him)
  const keptBy = new Map();
  const keepsAll = (m) => {
    const chip = m.chips?.[g] ?? null;
    if (!keptBy.has(chip)) keptBy.set(chip, keptCells(P, g, chip));
    return keptBy.get(chip).every(([id, x]) => m.ev.gws.find((s) => s.gw === x)?.squad.includes(id) ?? true);
  };
  const measured = (p) => {
    // in your chip week a choice without the chip is never your plan (the user, 2026-10-13: "also it again remove all
    // suggestions if i chose to play wc": the window's last GW listed none)
    if (!p || !allowed(p) || (!chipMine && movesSig(p.moves) === mineFrom && !Object.keys(p.chips).length)) return null;
    const m = measurePlan(ctx, P, g, p, asIs, false);
    return m && withinHits(m) && keepsAll(m) && !rebought(P, m.moves, m.ev, ownMoves) ? m : null;
  };
  const exactRoads = g === P.A ? new Set([P.base, P.b.roads?.roll, ...Object.values(P.b.roads?.chip || {})].filter(Boolean)) : new Set();
  const choices = new Map();  // forkKey → GW g's choice {moves, chips}, in the order they are offered
  // never your plan's own GW-g choice (yours: your transfers or your Wildcard / Free Hit there, or while Forkcast makes
  // your transfers its moves there; a roll where it is none of those): it is your plan
  // a Wildcard or Free Hit row only in that chip's best week of the window, and only where it beats not playing it beyond
  // the noise (the user, 2026-10-12: "make that wc, fh show in suggested not each and every week but only if clear some
  // bar"): the best week of the bake's pre-solves (chipBests over chipPresolves, every week of the window in), its gain
  // clearGain's; never a week still unknown, nor one that only ties the next (the user, 2026-10-12: honestBest, the chip
  // toast's own rule; a new forecast's still solving: the last one's, keptBest). The pre-solves, never your rules'
  // preparations (chipPreps): those are solved on reading, so every draw of the week would start them. The week line's
  // Chips… plays it in any week (chipsDoor)
  const chipSrc = chipPresolves(ctx);
  const chipBest = chipSrc.best;
  const squadOk = (c) => !SQUAD_CHIPS.has(c.chips?.[g]) || chipWeekOf(P, chipSrc, c.chips[g], g)?.gw === g;
  // under the hold a week you roll offers its roll too, a choice as the others are (the Roll row: the reference the rows
  // count against; its + locks the week, addPlan), until its + has locked it (the user, 2026-10-19: "roll missing from
  // suggested fix bug": Raketa's GW8, where Forkcast's plan makes Saka → Palmer, listed none)
  const rollOffered = !followed && !now.length && !chipMine && !P.pins.some((p) => p.id === `roll:${g}`);
  // (never one a rule of yours forbids: a Keep of the player it sells, a veto of the one it buys: allowed; the user,
  // 2026-10-21, Keep in a player's place: "what if i do not want to sell de cuyper" left a road's choice selling him);
  // `e`: the 2026-10-18 bars it doesn't pass (earlyOf), kept with its first offer (`early`: forkKey → true | GW)
  const early = new Map();
  // the week's single moves (suggestionsOf; none in your chip week: their moves are on its squad, which goes with the
  // chip), each its choice with your GW-g transfers (singleOf; in a week Forkcast re-picks the move takes the place of
  // one of its transfers there: addYours' `instead`), and choice c with move m on top (plus: one with m's sale or buy
  // giving way)
  const singles = chipMine ? [] : suggestionsOf(ctx, P, g);
  const singleOf = (x, inn = x.in) => ({ moves: [...now.filter((y) => !(x.instead?.gw === g && y.out === x.instead.out && y.in === x.instead.in)), { gw: g, out: x.out, in: inn }], chips: {} });
  const plus = (c, m) => ({ moves: [...c.moves.filter((y) => y.out !== m.out && y.in !== m.in), { gw: g, out: m.out, in: m.in }], chips: {} });
  // a move m of a choice made alone: the suggestion's choice where it is one (`x`), else your GW-g transfers with it
  const partOf = (m) => { const x = singles.find((y) => sameMove(y, m)); return { x, one: x ? singleOf(x) : plus({ moves: now }, m) }; };
  // the sales of the choice's other moves (`adds`) that pay for m's choice alone (`one`) where the week can't make it
  // alone: the fewest that do, the first of them by the choice's order (one sale, else two, … else them all; the split
  // review, 2026-10-25: a move two of three sales paid for took all three, so the third never split off), none where
  // none do → [move] | undefined
  const fundOf = (m, adds, one) => {
    const others = adds.filter((o) => o !== m);
    const sets = (k, from = 0) => (k === 0 ? [[]] : others.slice(from).flatMap((o, i) => sets(k - 1, from + i + 1).map((r) => [o, ...r])));
    for (let k = 1; k <= others.length; k++) { const by = sets(k).find((os) => fitsAt(ctx, P, g, os.reduce(plus, one), d0)); if (by) return by; }
    return undefined;
  };
  // the owner, 2026-10-25: "does 'swap both' appear only when transfers depend on each other i.e. one can't possible
  // without other due to funds for example - make sure it is and when transfers can be splitted they are shown
  // separately": a choice of two or more GW-g moves besides yours (no chip) in the groups the week can make each alone,
  // a move alone where it fits (fitOf: the money and a club's room) else with the sales that pay for it (fundOf: a funded
  // pair stays one); more than one group, each made alone (a group merged of several funded moves checked whole too:
  // two moves one sale pays for each may not fit together), it splits (`split`: never a row, a solve, a plate or one
  // take of its own; its groups are the week's choices, each its own: pairSingles). Only a choice that keeps your GW-g
  // transfers, each part keeping them too (the split review, 2026-10-25: one taking a transfer of yours back split
  // into parts that kept it, so it was offered nowhere). → [[move]] | null (it can't be split)
  const keeps = (c) => now.every((y) => c.moves.some((m) => sameMove(m, y)));
  // a group's choice: your GW-g transfers with its moves
  const groupOf = (gr) => gr.reduce(plus, { moves: now, chips: {} });
  const splitOf = (c) => {
    const adds = c.moves.filter((m) => !now.some((y) => sameMove(y, m)));
    if (chipMine || adds.length < 2 || Object.keys(c.chips).length || !keeps(c) || !fitsAt(ctx, P, g, c, d0)) return null;
    const grp = new Map(adds.map((m) => [m, [m]]));
    for (const m of adds) {
      const { one } = partOf(m);
      if (!keeps(one)) return null;
      if (fitsAt(ctx, P, g, one, d0)) continue;
      const by = fundOf(m, adds, one);
      if (!by) return null;
      for (const o of by) {
        const x = grp.get(m), y = grp.get(o);
        if (x !== y) { x.push(...y); for (const q of y) grp.set(q, x); }
      }
    }
    const groups = [...new Set(grp.values())];
    return groups.length > 1 && groups.every((gr) => gr.length === 1 || fitsAt(ctx, P, g, groupOf(gr), d0)) ? groups : null;
  };
  const split = new Map();  // forkKey → the groups of a choice that splits (splitOf)
  const add = (c, e = null) => {
    const k = forkKey(c, g);
    if ((k !== yours || rollOffered) && squadOk(c) && allowed(c) && !choices.has(k)) { choices.set(k, c); if (e) early.set(k, e); const gs = splitOf(c); if (gs) split.set(k, gs); }
  };
  // the groups of a choice that splits (splitOf) the week doesn't list yet, each its choice ({x: a single's suggestion,
  // c}); none for one that doesn't split, nor a move you removed (yours, listed after them all, never crowded out: B129;
  // the split review, 2026-10-25 second pass: it took the room of the others)
  const groupsOf = (c) => (split.get(forkKey(c, g)) ?? splitOf(c) ?? []).map((gr) => ({ x: gr.length === 1 ? partOf(gr[0]).x : null, c: groupOf(gr) }))
    .filter((q) => !q.x?.removed && !choices.has(forkKey(q.c, g)));
  // what a choice is expected to gain before its own solve: the chip pre-solve's number, the phone's estimate of its move
  // (suggestionsOf, ownAltsOf), or its bake road's measured one (rankOf): the order its solve is asked in and its
  // waiting row drawn in (the user, 2026-10-12: a Wildcard worth +18 waited eighth, under More plans, behind five single
  // moves solved first)
  const est = new Map();
  const guess = (c, v) => { if (Number.isFinite(v)) { const k = forkKey(c, g); est.set(k, Math.max(est.get(k) ?? -Infinity, v)); } };
  const known = new Map(), seen = new Set();  // forkKey → the road plans of that choice, measured
  const rankOf = (k) => Math.max(est.get(k) ?? -Infinity, ...(known.get(k) ?? []).map((p) => p.cmp?.delta ?? -Infinity));
  // under the hold a road's GW-g transfers on top of yours meet the suggestions' bars (the user, 2026-10-18: "GW8 Dovin →
  // Leno 0.0", the GW8 Bench Boost pre-solve's move without its chip): more than 0.05 over your plan, the week alone
  // measured as its + takes it, and more than made the next week (earlyOf). Not once the week's free transfers are
  // used (extraWeek: every move that fits is a choice, after its −4), in your Wildcard or Free Hit week, for a chip's
  // choice, nor for one that changes a transfer of yours (an alternative to it). One that doesn't is offered after the
  // single moves that do (`late`; the user, 2026-10-21: "Same both times, worse ones too")
  const extra = extraWeek(P, g), measureBy = takenBy(ctx, P);
  const sameMove = (a, b) => a.out === b.out && a.in === b.in;
  const earlyAt = (c) => {
    if (followed || extra || chipMine || Object.keys(c.chips).length || !now.every((y) => c.moves.some((m) => sameMove(m, y)))) return null;
    const ms = c.moves.filter((m) => !now.some((y) => sameMove(m, y)));
    if (!ms.length) return null;
    let d = d0, ev = null;
    for (const m of ms) {
      const r = addYours(ctx, P, g, m.out, m.in, d, measureBy);
      if (r.problem) return null;  // the week alone can't make it: its row says so ('nofit')
      ({ draft: d, ev } = r);
    }
    return earlyOf(ctx, P, g, ms, ev, before, d0, measureBy);
  };
  const late = [];  // [{c, e}]: the choices offered after those that pass the bars
  // a road's choice of two or more GW-g moves besides yours, no chip: a pair. The model's own (Forkcast's suggestion) is
  // offered at once; another road's (`pairs`) only after the week's best two single moves and each listed pair's moves
  // alone, best first, while the week's transfer choices have room (the user, 2026-10-21, Raketa's GW9: "why not offer
  // alternatives without also buying palmer": five roads' pairs, four of them "… + Saka → Palmer", took the room before
  // Calvert-Lewin → Evanilson alone was asked)
  const pairLike = (c) => !Object.keys(c.chips).length && c.moves.filter((m) => !now.some((y) => sameMove(y, m))).length >= 2;
  const pairs = [];
  // a week your plan leaves short of money (owedAt): Forkcast's way to pay it back (owedRoad), offered at once as the
  // model's own is (the owner, 2026-10-28: "show it as black transfer suggested as usual")
  const owed = owedAt(P, w) ? owedRoad(ctx, P, g, { peek, prep }) : null;
  for (const r of [...bundleRoads(P.b.roads), ...(owed?.road ? [owed.road] : [])]) {
    const x = planOfRoad(ctx, P, r, g, d0);
    if (!x) continue;
    if (!choices.has(forkKey(x.choice, g))) {
      const e = earlyAt(x.choice);
      if (e) late.push({ c: x.choice, e }); else if (r !== P.base && r !== owed?.road && pairLike(x.choice)) pairs.push(x.choice); else add(x.choice);
    }
    const s = x.plan && `${movesSig(x.plan.moves)}|${JSON.stringify(x.plan.chips)}`;
    if (!s || seen.has(s)) continue;
    seen.add(s);
    const m = measured(x.plan);
    const k = forkKey(x.choice, g);
    if (m && !heldOf(x.choice)) known.set(k, [...(known.get(k) ?? []), { ...m, road: r, model: r === P.base, exact: exactRoads.has(r) }]);
  }
  // a Wildcard and a Free Hit this week when you have them (the user: "i must show 'play wc' and 'play fh'"; never
  // crowded out), none planned in their half (L6); add keeps it only in its best week (squadOk)
  for (const chip of chipsAvail(P, g).filter((c) => SQUAD_CHIPS.has(c))) {
    if (plannedAt(P, chip, g) == null) { const c = { moves: [], chips: { [g]: chip } }; add(c); guess(c, (keptBest(P, chipSrc, chip, g) ?? chipBest[chip])?.delta); }
  }
  // your transfers' other buys (the best two each), then the best single moves on top of yours (the transfer choices
  // asked at most FORK_MAX: a pair's move the week can't make alone, `needs`, is asked nothing), then a roll
  const needs = new Map(), pairOf = new Map();  // pairSingles': forkKey → {ids, problem}; forkKey → its pair's
  const placed = new Set();  // forkKey: a place's other buys asked beside FORK_MAX (placesAsked)
  const plain = () => [...choices].filter(([k, c]) => c.moves.length && !Object.keys(c.chips).length && !needs.has(k) && !split.has(k) && !placed.has(k)).length;
  const room = () => plain() < FORK_MAX - 1;
  // sale m's other buys (ownAltsOf: the best two while the week's choices have room), each the choice `choiceOf(buy)`;
  // `alts` and no `cap` for a place you opened (placesAsked: its buys beside FORK_MAX)
  const otherBuys = (m, choiceOf, alts = room() ? ownAltsOf(ctx, P, w, m).slice(0, 2) : [], cap = true) => {
    for (const a of alts) {
      if (cap && !room()) break;
      const c = choiceOf(a.in), k = forkKey(c, g);
      if (!choices.has(k)) { add(c, earlyAt(c)); if (!cap && choices.has(k)) placed.add(k); }
      guess(c, a.cmp?.delta);
    }
  };
  // your GW-g transfer m with another buy
  const swapIn = (m, inn) => ({ moves: now.map((x) => (x === m ? { ...x, in: inn } : x)), chips: {} });
  // (none in your chip week: suggestionsOf's moves are on its squad, which goes with the chip); a move you took off this
  // session after them, whatever their count, its solve asked after theirs (no estimate: rankOf) (B129: yours, never
  // crowded out; the user, 2026-10-21: fix the known issues: it was skipped, so never offered again that session)
  const single = (x) => {
    const c = singleOf(x);
    add(c, x.early);
    if (!x.removed) guess(c, x.cmp?.delta);
  };
  const offered = singles.filter((y) => !y.removed && !y.early);
  // a choice that splits offers its groups (groupsOf) in the room it would have taken, or none of them where the ask
  // budget can't hold them all → whether it could
  const offerGroups = (c) => {
    const gs = groupsOf(c);
    if (plain() + gs.length > FORK_MAX - 1) return false;
    for (const q of gs) { if (q.x) single(q.x); else add(q.c, earlyAt(q.c)); }
    return true;
  };
  // the roads' choices offered at once (the model's own, never crowded out) that split: their groups first, before your
  // transfers' other buys and the best two take the room (the split review, 2026-10-25 second pass: the model's choice of
  // four split, and its groups lost the room it had held whole)
  for (const c of [...choices.values()]) if (split.has(forkKey(c, g))) offerGroups(c);
  for (const m of now) otherBuys(m, (inn) => swapIn(m, inn));
  // while the week has a free transfer, the best two suggestions (asked first: litOf lights the best single), then each one's sale with
  // its other buys, as your transfer's are once taken (the user, 2026-10-21: "never suggest saka to rice as alternative
  // here": Saka's place before the take lists what Palmer's lists after it), then the rest that pass the bars
  const leads = extra ? [] : offered.slice(0, 2);
  for (const x of leads) if (room()) single(x);
  // each move of a pair alone (a choice of two or more GW-g moves besides yours: a road's), as a single move is (the
  // user, 2026-10-21, on TORPEDO's GW9, its lit "De Cuyper → Hill + Kayode → …": "not obvious - why it not suggests de
  // cuyper to hill as a separate transfer - and only in combination?"): in its player's place and the Week sheet, its own
  // number vs rolling, the bars and the colour as every choice's; the suggestion's choice where it is one (singleOf),
  // else your GW-g transfers with it (one with its sale or its buy giving way: plus), asked while the week's transfer
  // choices have room (FORK_MAX). One the week can't make alone (fitOf: the money, or a club's room, comes from the
  // pair's other sale) is listed all the same, no solve asked for it (no room taken): `needs` the sales that make it fit
  // (the first of the pair's others that does alone, else them all) and all it lacks without them (`problems`), its +
  // off as a failed row's (the pair's own + makes it with them). None for a pair that doesn't fit, nor for a move you
  // removed (yours, after them all). Asked after the pair and the week's best two (`pairOf`: the asks' order), as is one
  // listed already (a suggestion the bars keep, a road's), never one of those two
  const leadKeys = new Set(leads.map((x) => forkKey(singleOf(x), g)));
  // a pair's moves, each alone: [{m, x (its suggestion), one (its choice), k}] (none for a pair that doesn't fit, nor
  // one you removed, nor one of the week's best two)
  const partsOf = (c) => {
    const adds = c.moves.filter((m) => !now.some((y) => sameMove(y, m)));
    if (chipMine || adds.length < 2 || Object.keys(c.chips).length || !fitsAt(ctx, P, g, c, d0)) return [];
    return adds.map((m) => {
      const { x, one } = partOf(m);
      return { m, x, one, k: forkKey(one, g), adds };
    }).filter((q) => !q.x?.removed && !leadKeys.has(q.k));
  };
  const pairSingles = (c) => {
    if (!choices.has(forkKey(c, g))) return;
    // a choice that splits is never one take, with no exception (the owner, 2026-10-25: "when transfers can be splitted
    // they are shown separately"): each of its groups a choice of its own first, a single as any single, a funded group
    // of two or more one choice with your GW-g transfers (asked, measured, the week's best where it is, its place's
    // card "Swap" taking both), in the room the choice itself would have taken (the pairs' `need`). Where the ask budget (FORK_MAX) can't hold
    // them all none is offered: the whole can't be one take (the owner's rule C), and a part without the others would
    // offer the plan's moves as if the rest weren't worth making; its moves stay as the week's other choices offer them
    if (split.has(forkKey(c, g)) && !offerGroups(c)) return;
    // its moves the week can make alone first, then those that need another of its sales (funded, or the dead row): a
    // funded choice never takes the room a move alone needed (the review of the many-FT fixes, 2026-10-22: a road's pair
    // [C, A, B], C needing A's sale: {C, A} took the last slot and B alone was never offered)
    const parts = partsOf(c).map((p) => ({ ...p, fit: choices.has(p.k) ? null : fitOf(ctx, P, g, p.one, d0) }));
    for (const { m, x, one, k, adds, fit } of [...parts.filter((p) => !p.fit || p.fit.ok), ...parts.filter((p) => p.fit && !p.fit.ok)]) {
      if (choices.has(k)) { if (!pairOf.has(k)) pairOf.set(k, forkKey(c, g)); continue; }
      if (fit.ok) {
        if (!room()) continue;
        if (x) single(x); else add(one, earlyAt(one));
      } else {
        const by = fundOf(m, adds, one);
        if (!by) continue;
        // the move with just the sales that pay for it, a choice of its own solved as any pair (the user, 2026-10-22, Boss
        // of the gym's GW8: "Semenyo → Palmer · £0.8m short · needs Gvardiol's sale" was listed with its + off and nothing
        // offered it with Gvardiol → Muharemović alone, keeping Cunha), in the dead row's place while the week's choices
        // have room, or already offered; else (the pair's own sales all: the pair itself, nothing new) the dead row as
        // before (no room taken)
        const funded = by.reduce(plus, one), fk = forkKey(funded, g);
        if (fk !== forkKey(c, g)) {
          if (!choices.has(fk) && room()) { add(funded, earlyAt(funded)); if (choices.has(fk)) pairOf.set(fk, forkKey(c, g)); }
          if (choices.has(fk)) continue;
        }
        needs.set(k, { ids: by.map((o) => o.out), problems: fit.problems });
        add(one);
        if (!choices.has(k)) needs.delete(k);
      }
      if (choices.has(k)) pairOf.set(k, forkKey(c, g));
    }
  };
  for (const c of [...choices.values()]) pairSingles(c);
  // the other roads' pairs, best first by their road plans' numbers, each only with room for its moves alone after it
  // (those the week can make alone: fitOf; one that needs the pair's other sale takes none)
  const seenPair = new Set();
  for (const c of pairs.sort((a, b) => rankOf(forkKey(b, g)) - rankOf(forkKey(a, g)))) {
    const k = forkKey(c, g);
    if (seenPair.has(k) || choices.has(k)) continue;
    seenPair.add(k);
    // (one that splits, splitOf, takes no room of its own: its groups', each its own choice: pairSingles)
    const need = splitOf(c) ? groupsOf(c).length : 1 + partsOf(c).filter((q) => !choices.has(q.k) && fitOf(ctx, P, g, q.one, d0).ok).length;
    if (plain() + need > FORK_MAX - 1) continue;
    add(c);
    pairSingles(c);
  }
  for (const x of leads) otherBuys(x, (inn) => singleOf(x, inn));
  for (const x of offered) {
    if (!room()) break;
    single(x);
  }
  // then those the bars keep from being the week's suggestion, a road's and a single move's, best first by estimate (a
  // pair's moves alone after it)
  late.push(...singles.filter((y) => !y.removed && y.early).map((x) => { const c = singleOf(x); if (!choices.has(forkKey(c, g))) guess(c, x.cmp?.delta); return { c, e: x.early }; }));
  for (const { c, e } of late.sort((a, b) => rankOf(forkKey(b.c, g)) - rankOf(forkKey(a.c, g)))) {
    if (!room()) break;
    add(c, e);
    pairSingles(c);
  }
  for (const x of singles.filter((y) => y.removed)) single(x);
  // each place you opened (askPlace), its card's other buys beside the week's FORK_MAX, PLACE_ALTS of them, worse ones
  // too (ownAltsOf's `all`): your transfer's with that buy in its place, else his best single move's (suggestionsOf: the
  // move the place deals first) with another buy; none for a player no single move sells
  for (const a of placesAsked(P, g)) {
    const m = now.find((y) => Number(y.in) === a), x = m ? null : singles.find((y) => Number(y.out) === a && !y.removed);
    if (m) otherBuys(m, (inn) => swapIn(m, inn), ownAltsOf(ctx, P, w, m, true).slice(0, PLACE_ALTS), false);
    else if (x) otherBuys(x, (inn) => singleOf(x, inn), ownAltsOf(ctx, P, w, x, true).slice(0, PLACE_ALTS), false);
  }
  // a roll: your GW-g transfers (or your chip) taken back; never where it would be your plan itself (add)
  const roll = { moves: [], chips: {} };
  add(roll);
  // under the hold every row counts against rolling, Forkcast's best moves after it on both sides (the user, 2026-10-19:
  // "why roll 0.0 but saka to palmer is +2.7 while … saka to palmer next week is actually 0.4", then "Gain over
  // rolling"): the roll's plan (the reference) and your own GW-g transfers' (what every other row takes back, vsMine;
  // your week's transfer row, rollOf), each solved first, a row or not
  const rollK = forkKey(roll, g);
  // in your Wildcard or Free Hit week your chip's plan too, solved as its row was (the user, 2026-10-22: "vs rolling
  // everywhere": the week line's number is the pitch token's, your chip against the week's roll plan, chipWeekGain), its
  // week your plan's own squad (list.mine below)
  const chipOwn = chipMine ? { moves: [], chips: { [g]: chipMine } } : null;
  const refs = new Map(followed ? [] : [[rollK, roll], ...(now.length && !chipMine ? [[yours, { moves: now, chips: {} }]] : []), ...(chipOwn ? [[yours, chipOwn]] : [])]);
  // a row that sells a player a transfer of yours bought before g counts against rolling with him free from g too, as
  // its + leaves your rules (chainOf: that transfer's hold ending at g − 1), so the transfer row it leaves says its
  // number (the user's phone, 2026-10-19: "Murillo → Hill +1.0", its row "+0.4" once taken: the roll it was set
  // against kept Murillo for good, never making the same move a week later). `ends`: the sales whose holds that roll ends
  const endsOf = (c) => (SQUAD_CHIPS.has(c.chips?.[g]) ? [] : c.moves.filter((m) => m.gw === g));
  const refKeyOf = (c) => {
    if (heldOf(c)) return `${rollK}|held`;
    const ids = [...chainOf(P, g, endsOf(c)).chain.keys()].sort();
    return ids.length ? `${rollK}|${ids.join(',')}` : rollK;
  };
  // (only for a choice that can be made: none is asked for a row that is never listed)
  if (!followed) for (const c of [...[...choices].filter(([k]) => !split.has(k)).map(([, c]) => c), ...(chipOwn ? [chipOwn] : [])]) { const k = refKeyOf(c); if (!refs.has(k) && fitsAt(ctx, P, g, c, d0)) refs.set(k, heldOf(c) ? { ...roll, held: true } : { ...roll, ends: endsOf(c) }); }
  // a Wildcard you could play here that the week lists no row of (Chips…: chipOf) counts against the held roll as its
  // row would (the owner's Free Hit, 2026-10-22: a chip solved apart set against the roll WITH Forkcast's later moves read
  // "+1.1" in Chips… and its toast, "+5.3" on the week line once played): asked after the week's choices, never a row
  // (your plan itself where you roll the week: no solve)
  const heldK = `${rollK}|held`, wcRow = { moves: [], chips: { [g]: 'wc' } };
  const apart = !followed && !refs.has(heldK) && chipMine !== 'wc' && chipsAvail(P, g).includes('wc') && plannedAt(P, 'wc', g) == null
    && fitsAt(ctx, P, g, wcRow, d0) ? [[heldK, { ...roll, held: true }]] : [];
  // the owner, 2026-10-26 (fhland; asked "Closing it means choosing one squad for both; I'd make the token describe the
  // squad Chips… actually lands": "yes"): under the hold a Wildcard or Free Hit row's squad is the plan Chips…'s tap
  // lands, your rules' preparation of it (prepItems: chipEdit's values, which useChip lands and the row's + then lands
  // too, memory.offer), asked as the row's own solve (`land`) where Chips… hasn't prepared it yet, never a solve of its
  // own that picks another squad (the fork's values, GW A's exact pre-solve: fixnums, "Left as it was", the token and
  // its toast said one squad, the week line another). Not in a week with your transfers: the row's + takes them back
  // and the preparation keeps them (planTake's `gone`), so its + lands neither
  // (the tap's own values where Chips… prepares none, its chip planned in the other half or the roads re-baking: chipEdit's,
  // as its heal sends them; the fhland review, 2026-10-26)
  const landOf = (c) => {
    const chip = c.chips?.[g];
    if (followed || now.length || c.moves.length || !SQUAD_CHIPS.has(chip)) return null;
    const it = prepItems(ctx, P).find((x) => x.chip === chip && x.gw === g);
    if (it) return it;
    const e = chipEdit(P, g, chip), values = valuesFor(ctx, e.pins, e.drop);
    return { chip, gw: g, values, key: valuesKey(P, values) };
  };
  // …and a Free Hit the week lists no row of, or one whose row is its preparation (landOf), its own solve (`fhLater`:
  // Forkcast's later moves after it, the later weeks Chips…, its toast and its row count it on, as the week line does
  // once it is played: chipApart, `ours`)
  const fhK = forkKey({ moves: [], chips: { [g]: 'fh' } }, g), fhRow = { moves: [], chips: { [g]: 'fh' } }, fhLater = `${fhK}|later`;
  // (a Free Hit's later weeks solved only once Chips… was opened on g: chipsAsked)
  if (!followed && !chipMine && (!choices.has(fhK) || landOf(choices.get(fhK))) && chipsAvail(P, g).includes('fh') && plannedAt(P, 'fh', g) == null && chipsAsked(ctx).includes(g) && fitsAt(ctx, P, g, fhRow, d0)) apart.push([fhLater, fhRow]);
  const ready = (list, c) => ({ ...list.sort(byGain)[0], state: 'ready', choice: c });
  // a reference whose solve makes no move your plan doesn't is your plan itself (never a row: L1)
  // (`counts`: its own solve's road, where it was solved, for the solver's own count against it: countRoad)
  const self = (c, counts = null) => ({ state: 'ready', choice: c, self: true, moves: [], chips: c.chips, draft: d0, ev: asIs, cmp: compare(ctx, asIs, asIs), hits: {}, road: null, model: false, ...(counts ? { counts } : {}) });
  // each choice's solve, unless a road solved it exactly; L5 (the plans review, 2026-10-11: new rows waited behind a fork
  // from before an edit or another week): a fork in flight that this view no longer asks is let go
  // (a choice that splits none: splitOf)
  const asks = [...new Map([...choices, ...refs, ...apart])].filter(([k]) => !split.has(k)).flatMap(([k, c]) => {
    if (c.held && !now.length && !chipMine) return [{ k, c, roads: [], same: true }];  // rolling, your later weeks as they are: your plan
    // (a pair's move the week can't make alone: its row, no solve)
    if (!fitsAt(ctx, P, g, c, d0)) return needs.has(k) ? [{ k, c, roads: [], need: needs.get(k) }] : [];
    const land = choices.has(k) ? landOf(c) : null;
    if (land) return [{ k, c, roads: [], land, ask: { key: land.key, values: land.values, gw: g, ...(prep ? { prep } : {}) } }];
    const roads = known.get(k === fhLater ? fhK : k) ?? [];
    if (roads.some((p) => p.exact)) return [{ k, c, roads }];
    const values = forkValues(ctx, P, g, c);
    return [{ k, c, roads, ask: { key: valuesKey(P, values), values, gw: g, ...(prep ? { prep } : {}) } }];
  });
  // (stable: choices with no estimate keep the order they were offered in; those the bars keep from being the week's
  // suggestion after the rest, so a choice that can be lit never waits behind one: the user, 2026-10-21; a pair's move
  // alone after the rest of its pair's kind, the pair and the week's best two among them)
  // (a part of a choice that splits, splitOf, asked as a single move is: its choice is asked nothing)
  const tier = (k) => (early.has(k) || (early.has(pairOf.get(k)) && !split.has(pairOf.get(k))) ? 2 : 0) + (pairOf.has(k) && !split.has(pairOf.get(k)) ? 1 : 0);
  asks.sort((x, y) => tier(x.k) - tier(y.k) || rankOf(y.k) - rankOf(x.k));
  let letGo = false;
  // (the later weeks' flights of this plan view stay: their preparation, prepNext, or their own draw's before you came
  // back; every later week since the owner, 2026-10-28, "Pre-solve GW10-12")
  if (!peek && !prep) AHEAD.at = { P, g };
  for (const [lane, f] of peek || prep ? [] : forkFlights()) {
    if (asks.some((a) => a.ask?.key === f.key) || f.key === owed?.key || (f.P === P && f.gw > g && !f.ahead) || aheadAsks(f, P, g)) continue;
    f.cancel?.();
    if (lane) FORK_FLIGHTS.delete(lane); else PAIR.flight = null;
    letGo = true;
  }
  // a week whose flight was let go draws "checking…" from no flight: every memo goes (no re-draw: this draw asks its
  // own), so going back to it asks again (review 5, 2026-10-12: rows stuck at "checking…" after GW6 → GW8 → GW6 → GW8)
  if (letGo) PLANS.set(P, (by = { rev: ++PAIR.rev, gw: new Map() }));
  // (chip's plan p, {draft}, on plan r's later weeks: a Free Hit's week alone, its squad reverting after it, a Wildcard's
  // plan as it is, its squad lasting; chipApart's and a row's of its preparation on its own solve's, your own chip week's
  // on its solve below)
  const chipOn = (chip, r, p) => (chip === 'fh' ? { ...r, chips: { [g]: chip }, draft: weekOnto(r.draft, p.draft, g) } : p);
  const solveOf = ({ k, c, roads, ask, same, need, land }) => {
    if (same) return self(c);
    if (need) return { state: 'failed', choice: c, why: 'needs', needs: need.ids, problems: need.problems };
    if (!ask) return ready(roads, c);
    const key = ask.key;
    // (a row of its preparation: Chips…'s where it has prepared it, else asked here and kept as that preparation, so
    // Chips… and its tap find it: one solve)
    const kept = land ? PREPS.get(key) : null;
    const got = kept?.weeks ? kept : peek ? forkRead(key) : forkAsk(ctx, P, ask);
    if (land && !peek && got?.weeks && kept !== got) prepKeep(key, got);
    if (got && typeof got === 'object') {
      const x = planOfRoad(ctx, P, got, g, d0);
      let p = x?.plan && forkKey(x.plan, g) === forkKey(c, g) ? x.plan : null;
      // its solve made no move after the choice your plan doesn't: the choice is your plan, or a road's
      if (p && !chipMine && movesSig(p.moves) === mineFrom && !Object.keys(p.chips).length) return roads.length ? ready(roads, c) : refs.has(k) ? self(c, got) : null;
      // a Free Hit row of its preparation: its week on its own solve's later weeks, as chipApart counts it (the roll
      // plan's where that failed)
      if (p && land?.chip === 'fh') {
        const f = solveK(fhLater), r = f?.state === 'ready' ? f : solved.get(rollK);
        if (f?.state === 'solving' || r?.state === 'solving') return { state: 'solving', choice: c, wait: (f?.state === 'solving' ? f : r).wait };
        if (r?.state === 'ready') p = chipOn('fh', r, p);
      }
      const m = measured(p);
      if (m) return ready([...roads, { ...m, road: got, model: false }], c);
    }
    const why = got === 'infeasible' ? 'infeasible' : got !== 'error' ? 'nofit' : ctx.store.get('conn')?.state === 'offline' || !ctx.api?.solve ? 'offline' : 'error';
    if (got) return roads.length ? ready(roads, c) : { state: 'failed', choice: c, why };
    return { state: 'solving', choice: c, wait: forkFlights().some(([, f]) => f.key === key) ? 'flight' : P.healing ? 'heal' : 'queue' };
  };
  // the references asked first, each row still waiting in its own place (a Free Hit row of its preparation asks its
  // later weeks with it: solveK)
  const solved = new Map(), byK = new Map(asks.map((a) => [a.k, a]));
  const solveK = (k) => { if (!solved.has(k) && byK.has(k)) solved.set(k, solveOf(byK.get(k))); return solved.get(k); };
  for (const a of [...asks.filter((x) => refs.has(x.k)), ...asks.filter((x) => !refs.has(x.k))]) solveK(a.k);
  // (the Roll row of a week you roll stays where rolling, Forkcast's later moves after it, is your plan itself: no move
  // after it; the first-use run, 2026-10-21: Raketa's Roll there in GW8 and GW9, gone in GW10 once its check landed)
  const out = asks.filter((a) => choices.has(a.k)).map((a) => solved.get(a.k)).filter((x) => x && (!x.self || rollOffered));
  // your team as it is (the hold): what a row's + gives is GW g's choice alone on your plan as it stands (planTakeDraft:
  // `taken`), measured as your plan is (measurePlan: `alone`, what the total moves by; `ev`, the weeks it draws), its
  // best known plan with Forkcast's later moves after it (a road's or its own solve's) kept as `full` / `fullEv`. One
  // the week alone can't make (its money came from a later move) fails
  const alone = (x) => {
    if (followed || x.state !== 'ready') return x;
    const draft = planTakeDraft(ctx, P, g, x.draft, flatMoves(x.draft).filter((m) => m.gw === g));
    const m = measurePlan(ctx, P, g, { ...x, draft }, before);
    return m ? { ...x, taken: draft, ev: m.ev, alone: m.cmp, full: x.cmp, fullEv: x.ev } : { state: 'failed', choice: x.choice, why: 'nofit' };
  };
  // a row's number (`cmp`: the order, the colour, the toast) is its plan against the roll's, Forkcast's later moves on
  // both sides (`vsRoll`, `refEv` the roll's plan); the roll's own row (`refRow`) is what the rows count against: no number,
  // its + solid only when its own plan (what its + makes) beats the best other row's past the noise (`vsBest`, that row
  // `best`: the best plan, by its total; Raketa's GW8, 2026-10-19: Saka → Palmer +5.6 and Roll +5.3, a toss-up, neither
  // green). While the roll's plan solves the rows wait for it; with none (it failed, or rolling can't be made: fitsAt)
  // each is what its + gives (`alone`, against your plan). In a week with your transfer, Wildcard or Free Hit each row is
  // also set against your own choice (`vsMine`: its + solid only when it beats that too, as a row taking it back loses
  // what it had; in your chip week what its + gives, against your plan with the chip and your picks). The Roll row of a
  // week you roll (`rolls`: rollOffered) locks the week as a roll (addPlan)
  const ref = followed ? null : solved.get(rollK) ?? null;
  const ours = solved.get(yours)?.state === 'ready' ? solved.get(yours) : null;
  const yoursToo = ours && yours !== rollK ? ours : null;
  // a row's own roll (refKeyOf), the plain one where its own failed
  const refOf = (c) => { const r = solved.get(refKeyOf(c)); return r && r.state !== 'failed' ? r : ref; };
  const own = refs.has(yours) && yours !== rollK && !chipMine ? solved.get(yours) : null;  // your own transfers' plan (a week of yours)
  // the road a row is counted against (ownCount: the solver's own count over GW g's window; the owner, 2026-10-28,
  // "Solver's own count, own window"): its own, else, where it is your plan, its own solve's (a reference solved this
  // view, `counts`), else your plan's road where it is of these data (GW11's Trafford read +1.0 on the points after
  // v1.3.111: your stored plan, of the roads before, carried no window)
  const mineRoad = P.comparable ? P.road : null;
  const countRoad = (x) => x?.road ?? (x?.self ? x.counts ?? mineRoad : null);
  // (your plan's: your choice's own solve this week, else your plan's road)
  const yourRoad = ours ? countRoad(ours) : mineRoad;
  const vsRef = (x) => {
    if (followed || x.state !== 'ready') return x;
    const r = refOf(x.choice);
    if (r?.state === 'solving') return { state: 'solving', choice: x.choice, wait: r.wait };
    // (a row of a week with your transfers waits for their plan too: its colour sets it against them)
    if (r?.state !== 'ready') return { ...x, cmp: x.alone };
    if (own?.state === 'solving' && !heldOf(x.choice)) return { state: 'solving', choice: x.choice, wait: own.wait };
    // (vsMine by what its + gives, the week alone against your plan, where both keep your later weeks: in your Wildcard
    // or Free Hit week, your picks in it; a Wildcard row; your transfers' plan failed)
    // (each the solver's own count over GW g's window where both sides are solved roads carrying it: ownCount; the owner,
    // 2026-10-28, "Solver's own count, own window"; your plan's own road where the row is set against your plan)
    const vsMine = chipMine || (now.length && (heldOf(x.choice) || !yoursToo)) ? ownCount(ctx, x.alone, x.road, yourRoad, g)
      : yoursToo ? ownCount(ctx, compare(ctx, x.fullEv, yoursToo.ev), x.road, countRoad(yoursToo), g) : null;
    // decision K (the owner, 2026-10-25, GW9 after João Pedro → Evanilson +1.8, Cherki's place "+1.6 Swap Tavernier":
    // "shouldnt it compare + poitns not to rolling now but to transfer made … it seems that cherking to tavrnier is
    // better by 1.6 poitns than jp to evanilson wichj is not it actually worse"): in a week of yours the number shown
    // (the order, the plates, the cards, the rows, the toast) is `vsMine`, what the choice changes on your plan as it
    // stands (a choice in place of your transfer −0.2 there, a 2nd transfer what it adds to yours); a week with none of
    // yours, your plan the roll, as before. There the rows count against your plan, not the roll: the roll that takes
    // yours back is a choice as any, its number yours turned round (no reference row: `refRow` only with none of yours)
    return { ...x, cmp: vsMine ?? ownCount(ctx, compare(ctx, x.fullEv, r.ev), x.road, countRoad(r), g), refEv: r.ev, refRoad: countRoad(r), vsRoll: true, refRow: !vsMine && forkKey(x.choice, g) === rollK, ...(vsMine ? { vsMine } : {}) };
  };
  const rolls = (x) => rollOffered && !x.choice.moves.length && !Object.keys(x.choice.chips).length;
  // B129: a choice whose + makes again only what you took off GW g this session (every move of it your plan doesn't make
  // there sells a player one of your removed moves sold and buys one one of them bought: the week's sales and buys pair by
  // position, so the same change can come back paired otherwise), whichever road or move offers it, is yours: `removed`
  // (the user, 2026-10-21: fix the known issues: a road's came back at the top as if new, a suggestion's never came back).
  // One selling or buying anyone else beside it is another plan, offered as it comes (the user, 2026-10-22, Cunha's place
  // on Boss of the gym, two trios "removed by you" for one move of theirs: "what 'removed by you' means here - fix")
  const gone = [...removedAt(P, g)].map((k) => k.split('>'));
  const goneOut = new Set(gone.map(([o]) => o)), goneIn = new Set(gone.map(([, i]) => i));
  const yoursAgain = (x) => {
    const adds = x.choice.moves.filter((m) => m.gw === g && !now.some((y) => sameMove(y, m)));
    return adds.length > 0 && adds.every((m) => goneOut.has(String(m.out)) && goneIn.has(String(m.in)));
  };
  const all = out.map(alone).map(vsRef).map((x) => (rolls(x) ? { ...x, rolls: true } : x)).map((x) => (yoursAgain(x) ? { ...x, removed: true } : x))
    // (a row numbered by the solver's own count that beats the roll is no early one: its window counts making it next week
    // instead, so a count past the 0.05 bar says now; the owner, 2026-10-28, "Why it shows Trafford +1 and rolling the
    // best at the same time": an early row's plate beside "Rolling is best")
    .map((x) => (early.has(forkKey(x.choice, g)) && !(x.cmp?.count && x.cmp.delta > 0.05) ? { ...x, early: early.get(forkKey(x.choice, g)) } : x))
    .map((x) => (placed.has(forkKey(x.choice, g)) ? { ...x, placed: true } : x));
  const done = all.filter((x) => x.state === 'ready');
  // the Roll row against the hardest of: the best transfer row's plan (Forkcast's later moves on both sides) and the best
  // Wildcard row's (your later weeks kept on both: its held roll) → {vsBest, best, bestFrom (the Roll side's plan)}; never
  // one the 2026-10-18 bars keep from being the week's suggestion (`early`: waiting is what they say)
  // (by its number where that is the solver's count, ownCount: one way to rank the rows and the roll against them)
  const gainOf = (x) => (x.cmp?.count ? x.cmp.delta : x.full.delta);
  const top = done.filter((x) => !x.refRow && !x.early && x.vsRoll && !heldOf(x.choice)).sort((a, b) => gainOf(b) - gainOf(a))[0] ?? null;
  const topHeld = done.filter((x) => x.vsRoll && heldOf(x.choice)).sort(byGain)[0] ?? null;
  // (one it doesn't clear first, else the narrowest by the gap its label reads: compare's `ref`)
  const against = (x) => {
    const cs = [top && { vsBest: ownCount(ctx, compare(ctx, x.fullEv, top.fullEv), countRoad(x), top.road, g), best: top, bestFrom: x.fullEv },
      topHeld && { vsBest: ownCount(ctx, compare(ctx, topHeld.refEv, topHeld.fullEv), topHeld.refRoad, topHeld.road, g), best: topHeld, bestFrom: topHeld.refEv }].filter(Boolean);
    return cs.find((c) => !clearGain(c.vsBest)) ?? cs.sort((a, b) => (a.vsBest.ref ?? a.vsBest.delta) - (b.vsBest.ref ?? b.vsBest.delta))[0] ?? {};
  };
  const ranked = [...done.map((x) => (x.refRow ? { ...x, ...against(x) } : x)).sort(byGain),
    ...all.filter((x) => x.state === 'failed'), ...all.filter((x) => x.state === 'solving')];
  // (a move you removed in its rank, "removed by you" its words alone: B129 kept it after them all, quiet and never lit,
  // until the owner, 2026-10-26, after Raya +2.4 lost its ink to Tavernier +0.8 once its moves were removed: "find why and fix")
  const list = ranked;
  // the two plans your week's transfer row sets side by side (rollOf): the roll's and your own choice's, each with
  // Forkcast's later moves; `pending` while either still solves (the row says so, never the week alone in its place)
  if (ref?.state === 'ready') Object.assign(list, { ref, mine: ours });
  // (the roads weekRollOf counts these two by, as the rows are: ownCount)
  Object.assign(list, { mineRoad: yourRoad, countRoad });
  // …in your Wildcard or Free Hit week your chip's plan against its own roll (refOf: a Wildcard's keeps your later weeks
  // as its row's did, `held`), as the pitch's token set that chip's (weekRollOf's `mineRef`). Its week is your plan's
  // own, the squad its tap landed and the pitch draws, as Chips… and its toast counted it before the tap: QA chipweek N7
  // (2026-10-26, "the week line's one number is the toast's", +2.9 then +3.1 in 383130's GW10): the chip's solve here
  // picks its squad afresh (two players apart there, 63.05 points to your plan's 62.86), so the week line counted a squad
  // you don't have. A Free Hit's week on that solve's later weeks (Forkcast's after a Free Hit, as its row's), a
  // Wildcard's your plan as it is (its later weeks yours, as its held roll's)
  const mineRef = chipOwn ? refOf(chipOwn) : ref;
  if (chipOwn && mineRef?.state === 'ready') list.mineRef = mineRef;
  // (a Free Hit's later weeks the roll's where its own solve failed, as chipApart's)
  const onto = chipMine === 'fh' ? ours ?? (solved.get(yours)?.state === 'failed' ? mineRef : null) : mineRef;
  // (your plan as it is: never dropped for a problem of its own, measurePlan's problemOf)
  if (chipOwn && onto?.state === 'ready') { const p = chipOn(chipMine, onto, { draft: d0 }); list.mine = { ...p, ev: asTaken(ctx, P, p.draft, g, {}, false) }; }
  list.pending = !followed && [ref, mineRef, solved.get(yours)].some((x) => x?.state === 'solving');
  // a Wildcard or Free Hit the week lists no row of (not its best week, or planned elsewhere: Chips…'s other weeks) from
  // a plan of it solved apart (chipSource's road: your rules' preparation, the plan its tap lands), measured as a row's
  // (measured) and counted against the week's roll plan (the user, 2026-10-22, "vs rolling everywhere") with the same
  // later weeks on both sides, as the week line counts your chip once played (vsRollOf: weekRollOf's `mine` and
  // `mineRef`). The owner's Free Hit in GW9 (2026-10-22): its preparation under the hold has none of Forkcast's later
  // moves, the roll plan has them, so Chips… and its toast said "+1.1" and the week line "+5.3" once it was played (QA
  // chipweek N7). A Free Hit's squad reverts after its week, so its week alone (squad, lineup, chip: weekOnto) goes on
  // the later weeks of its own solve (`fhK`: Forkcast's later moves after a Free Hit, as the week line's once it is
  // played), the roll plan's where that failed: QA chipweek N7 (6076699 GW10, 2026-10-26: "+6.1" in the toast, "+8.1" on
  // the week line) put it on the roll plan's, whose GW11 makes five transfers on the five free transfers rolling gives,
  // four after a Free Hit, so −4 the plan of it never takes. A Wildcard's squad lasts: its plan as solved against the held roll, your later weeks as they are on
  // both sides as its row's (heldOf; `apart` asks it), never the roll with Forkcast's later moves → {cmp, vs} | {wait:
  // true} (that roll still solves) | null (none, or it isn't a plan of yours: planOfRoad). Once per road (Chips… draws
  // each second)
  const counted = new Map();
  const chipApart = (chip, road) => {
    const p = planOfRoad(ctx, P, road, g, d0)?.plan;
    if (p?.chips?.[g] !== chip) return null;
    const r = chip === 'wc' ? solved.get(heldK) : ref;
    if (r?.state === 'solving') return { wait: true };
    if (r?.state !== 'ready') return null;
    const f = chip === 'fh' ? solved.get(fhLater) : null;
    if (f?.state === 'solving') return { wait: true };
    const m = measured(chipOn(chip, f?.state === 'ready' ? f : r, p));
    if (!m) return null;
    // in a week of yours against your plan, as its row would count (vsRef's `vsMine`; decision K, the owner, 2026-10-25:
    // "compare + poitns not to rolling now but to transfer made"): a Free Hit's plan against your transfers' (Forkcast's
    // later moves on both sides), a Wildcard's, or either in your chip week, by what its + gives (`alone`)
    if (now.length && !chipMine && own?.state === 'solving') return { wait: true };
    if (chipMine || now.length) {
      const v = chip === 'fh' && !chipMine && yoursToo ? ownCount(ctx, compare(ctx, m.ev, yoursToo.ev), road, countRoad(yoursToo), g)
        : ownCount(ctx, alone({ ...m, state: 'ready', choice: { moves: [], chips: { [g]: chip } } }).alone, road, yourRoad, g);
      return v ? { cmp: v, vs: COPY.planVs(true) } : null;
    }
    return { cmp: vsRollOf(ctx, m, r, g, road, countRoad(r)), vs: COPY.planVsRoll };
  };
  list.chipOf = (chip, road) => {
    if (followed || !road || !SQUAD_CHIPS.has(chip)) return null;
    if (counted.get(chip)?.road !== road) counted.set(chip, { road, out: chipApart(chip, road) });
    return counted.get(chip).out;
  };
  // the roll's plan still solving: what the rows count against not known yet (plansVs says none; the first-use run,
  // 2026-10-21, #4: the heading read "vs no transfers", then "vs rolling"; the user, 2026-10-21: fix all (first-use
  // proposal #8))
  list.refWait = ref?.state === 'solving';
  // the week's checks (weekKey): the solve of each choice listed, then of each only counted against, or the choice
  // where a bake road answers it exactly, on this bundle (sorted: asks are in their estimates' order); a take makes
  // other ones, its choice now counted against (yours), though their solves are the same
  list.sig = [P.b.version, ...asks.map((a) => `${choices.has(a.k) ? '' : 'ref:'}${a.ask?.key ?? a.k}`).sort()].join('\n');
  // the week's asked transfer choices full (FORK_MAX): a choice offered after it, a pair's move alone among them, isn't
  // listed (the QA's plan-week reads it: q2-pair-singles)
  list.full = !room();
  if (peek || prep) return list;
  by.gw.set(g, list);
  // its taps' solves asked ahead as its choices are checked (presolve), in the lanes its checks leave; the week settled
  // (none checks, nor what its rows count against), the next one prepared
  if (!DRY) presolveWeek(ctx, P, g, list);
  if (settledList(list)) prepNext(ctx, P, g);
  return list;
}
/** A week's choices (plansOf's list) settled: none checks, nor what its rows count against. */
const settledList = (list) => !list.pending && !list.some((x) => x.state === 'solving');
/** The GW after g in the plan's window, or null at its end. */
const nextGw = (P, g) => P.gws.reduce((m, x) => (x > g && (m === null || x < m) ? x : m), null);
/**
 * The later weeks' choices solved in the background once the viewed week's have settled, one week at a time (the owner,
 * 2026-10-22: "why it only start checking next gameweek only when you switch to it and not does job at background so it
 * prepared - at least the next one from which you are viewing"; the next week only then; every later week since
 * 2026-10-28, "Pre-solve GW10-12"): plansOf in its
 * `prep` mode, so the same choices and values a draw of GW g + 1 asks, each at the lowest priority (purpose 'pairnext':
 * the plan service's SPECULATIVE, unmetered), in the fork lanes forkPump leaves free. Order (forkPump): the viewed
 * week's forks first in every lane (one waiting takes a lane from a preparation); then chip preparations (chipPreps)
 * keep the speculative slot, lane 0, one at a time, beside the next week's forks in lanes 1..; lane 0 goes to the
 * next week only once no chip preparation waits, so neither starves. Switching to GW g + 1 draws what landed at once
 * (FORK_ROADS) and joins the rest in flight (raised to VIEWED); another week lets them go (plansOf's L5).
 */
function prepNext(ctx, P, g) {
  // every later week in turn, the first not settled yet (the owner, 2026-10-28, "Pre-solve GW10-12", after "the next week
  // only" of 2026-10-22: tapping GW11 or GW12 then waited 7-39 s for its checks)
  for (let nx = nextGw(P, g); nx !== null; nx = nextGw(P, nx)) if (!settledList(plansOf(ctx, P, nx, { prep: true }))) return;
}
/** GW g's choices on plan view P, never a solve asked: as plansOf last listed them (its memo), else as the solves in
 *  stand (plansOf's peek), so the same words whichever week is drawn (the review of the first-use proposals,
 *  2026-10-21: a removal from Your rules of a week not drawn said less than the same from that week's ×). */
const plansListed = (ctx, P, g) => {
  const by = PLANS.get(P);
  const got = by?.rev === PAIR.rev ? by.gw.get(g) : null;
  if (got) return got;
  // a peek kept per plan view until a solve lands (PAIR.rev), so a sheet drawn each second (Chips…: chipShown) peeks once
  // (…or a preparation lands, PREP.gen: a Wildcard or Free Hit row is its preparation, plansOf's `land`; the fhland
  // review, 2026-10-26: Chips… opened from another week read "checking…" for it until a fork landed)
  let pk = PEEKS.get(P);
  if (!pk || pk.rev !== PAIR.rev || pk.gen !== PREP.gen) PEEKS.set(P, (pk = { rev: PAIR.rev, gen: PREP.gen, gw: new Map() }));
  if (!pk.gw.has(g)) pk.gw.set(g, plansOf(ctx, P, g, { peek: true }));
  return pk.gw.get(g);
};
const PEEKS = new WeakMap();
/** What a choice's number counts against, in words (its row's, its token's, its tab's, its plate's and card's spoken
 *  number, its toast, its Why sheet: planSaid, plNumSaid; Chips…: chipShown): your plan in a week with a transfer of
 *  yours or your Wildcard or Free Hit (plansOf `vsMine`, decision K: the owner, 2026-10-25, "compare + poitns not to
 *  rolling now but to transfer made"), else rolling under the hold once the roll's plan is in (plansOf `vsRoll`), else
 *  your plan as it stands (COPY.planVs). */
const choiceVs = (P, pl) => (pl.vsMine ? COPY.planVs(true) : pl.vsRoll ? COPY.planVsRoll : COPY.planVs(mineAny(P)));
/** GW w has a transfer of yours or your Wildcard or Free Hit: under the hold its choices count against your plan
 *  (plansOf's `vsMine`, from `now` and `chipMine`: decision K), its plans heading and a place's bar say so (plansVs). */
const yoursAt = (w) => !!w && (SQUAD_CHIPS.has(w.chip) || w.moves.length > 0);
/** The one Free Hit number (the user, 2026-10-22: the pitch's "+5.9 vs rolling" and Chips…'s "+6.2" or "Best week: GW9
 *  +2.9" vs not playing it, for one chip one tap apart): Wildcard or Free Hit `c` in GW g as the pitch shows it, its
 *  choice there (plansOf, never a solve asked: plansListed) once ready → {cmp, pays (plPays: its token green), vs
 *  (choiceVs)} | {wait: true} while it is checked | null (the pitch offers it nowhere that week, or its check failed). The Chips sheet's number and
 *  best week read this (chipStates), as the token and the Week sheet's row read the choice itself. */
export function chipShown(ctx, P, g, c) {
  if (!SQUAD_CHIPS.has(c) || !P.gws.includes(g)) return null;
  const pl = plansListed(ctx, P, g).find((x) => x.choice.chips?.[g] === c && !x.choice.moves.length && x.state !== 'failed');
  return !pl ? null : pl.state === 'ready' ? { cmp: pl.cmp, pays: plPays(pl), vs: choiceVs(P, pl) } : { wait: true };
}
/** The one Wildcard or Free Hit number of GW g under your team as it is (the user, 2026-10-22: "vs rolling everywhere",
 *  after a cloud review: Chips…'s row went from vs rolling to vs not playing it one tap apart, and its toast's "less
 *  than" read another best week than its "Best week" line): the pitch's where it shows the chip (chipShown), else the
 *  plan of it solved apart (`pre`: chipSource's at(c, g), the plan its tap lands) counted as a row of the week would be
 *  (plansOf's chipOf, never a solve asked: plansListed), on the week's roll plan either way → {cmp, vs, pays?} | {wait:
 *  true} (that plan or the week's roll plan still checked) | null. Off the hold (no roll plan) the pitch's alone. Chips…'s
 *  rows and best week (chipStates) and the chip toast (chipPlan) read this. A week your plan plays it in: the week
 *  line's (chipWeekGain), one measure either way (vsRollOf; the owner's Free Hit in GW9, 2026-10-22: "+1.1" in Chips…
 *  and its toast, "+5.3" on the week line). */
export function chipNumber(ctx, P, g, c, pre = null) {
  if (P.mem?.hold && SQUAD_CHIPS.has(c) && weekOf(P, g)?.chip === c) {
    const v = chipWeekGain(ctx, P, g, (x) => plansListed(ctx, P, x));
    return v.cmp ? { cmp: v.cmp, vs: v.vs } : v.wait ? { wait: true } : null;
  }
  const shown = chipShown(ctx, P, g, c);
  if (shown || !P.mem?.hold || !SQUAD_CHIPS.has(c) || !P.gws.includes(g)) return shown;
  if (pre?.state === 'solving') return { wait: true };
  return pre?.state === 'ready' ? plansListed(ctx, P, g).chipOf?.(c, pre.road) ?? null : null;
}
/** GW g of plan view P is the week of the edit the full plan is still checking, the plan before it drawn (A7: the edited
 *  week alone is marked). */
const approxAt = (P, g) => (P.mark ?? P.approx).has(g);
/** Your week w's transfers against rolling: your plan against the week's roll plan, Forkcast's later moves on both
 *  sides (plansOf's `mine` and `ref`, from `listed(g)`: its list, or as they stand: plansListed), as every choice
 *  counts, so the move a + just took reads what its choice read (the user, 2026-10-19: "Gain over rolling"; with the
 *  roll's week alone it read "−2.9" after "+6.4", carrying them on one side only "−5.8"), and the week names one roll
 *  (review 5, 2026-10-12); null with none, under ≈, or off the hold (no roll plan). `ev` the roll's plan, `mine` yours.
 *  Mount's weekRoll; a × that rolls the week (removeMove). A Wildcard or Free Hit week (squadWeek): your
 *  plan's chip week against its own roll (plansOf's `mine`, your plan on it, and `mineRef`), the number its token said
 *  (the user, 2026-10-22: "vs rolling everywhere"; chipWeekGain). */
function weekRollOf(ctx, P, w, listed = (g) => plansOf(ctx, P, g)) {
  const sq = !!squadWeek(w);
  if ((!sq && !w.moves.length) || approxAt(P, w.gw)) return null;
  const L = listed(w.gw) ?? {};
  const ref = sq ? L.mineRef : L.ref;
  return ref && L.mine ? vsRollOf(ctx, L.mine, ref, w.gw, L.mineRoad, L.countRoad?.(ref)) : null;
}
/** Plan `mine` against roll plan `ref` ({ev, road}), the same later weeks on both sides: the one measure of a week's
 *  number against rolling (weekRollOf: your transfers', your Wildcard's or Free Hit's week line; plansOf's chipOf: that
 *  chip in a week your plan doesn't play it, Chips… and its toast; the owner's Free Hit, 2026-10-22: "+1.1" there, "+5.3"
 *  on the week line, for one chip in one week), counted as every choice is (ownCount: the solver's own count over GW g's
 *  window where roads `a`, mine's, and `b`, the roll's, carry it; the owner, 2026-10-29, "fix all": a chip's number and
 *  a week line's were still the points, so a chip's could change once tapped). → compare's {…, road, ev (the roll's),
 *  mine} */
const vsRollOf = (ctx, mine, ref, g, a, b) => ({ ...ownCount(ctx, compare(ctx, mine.ev, ref.ev), a, b, g), road: ref.road, ev: ref.ev, mine: mine.ev });
/** How far a week's listed choices (plansOf's rows) are checked, counted as Add a player counts its weeks (COPY.checkingWeek,
 *  B87b; the first-use run, 2026-10-21, #2: "checking…" rows with no progress): the one now checked, the rows ready or
 *  failed + 1, of them all; null once none waits. Pure. → {i, n} | null */
export function plansWait(plans) {
  const n = plans.length, done = plans.filter((x) => x.state !== 'solving').length;
  return done < n ? { i: done + 1, n } : null;
}
/** How far a week's checks are as its week line and Week sheet say them ("Checking GW8 · 3 of 9 plans": renderLine,
 *  drawWeek): plansWait over the list that settles it (`plans`: plansOf's whole list; the review of the first-use
 *  proposals, 2026-10-21: counted over the ten listed, the count went while an eleventh still checked, nothing lit),
 *  until one of its choices is lit on the pitch (`lit`: litOf's count), settled or not (the phone recheck of the
 *  first-use proposals, 2026-10-21: a settled week back from an Undo whose choices were asked again drew plain edges
 *  under "Set in FPL" for a minute, with neither a tab nor a checking line). Pure. → {i, n} | null */
export const weekWait = (plans, lit) => (lit ? null : plansWait(plans));
/** The week's notices where they are drawn (renderLine): on the strip the first problem of `notices` (a clash, the price
 *  watch, a new forecast; weekModel's order), " · +N" for the others standing (`more`); GW A's lineup notice (`quiet`: an
 *  instruction that stands, FPL's to do) never on the strip but on the week's status beside the goal, in every week
 *  (statusTok; the owner, 2026-10-26, "find why 'set in fpl' move to tab above pitch once transfer is made and fix
 *  inconsistency": on the strip once a transfer was made, cut "Set in FPL: 3 c…", and a problem notice there hid it as
 *  "+1"), so a short bank, the week's checks or a squad still worked out keep the strip from it no longer (the review of
 *  the first-use proposals, 2026-10-21: in GW A it hid #8's checking line almost every week); none while GW A is under
 *  way (`live`). Its Week-sheet row stands all the while. Pure. → {problem, more, lineup: its words | null} */
export const lineNotices = (notices, live = false) => {
  const loud = notices.filter((n) => !n.quiet);
  return { problem: loud[0] ?? null, more: Math.max(0, loud.length - 1), lineup: live ? null : notices.find((n) => n.quiet)?.text ?? null };
};
/** A plan's weeks in words, from GW `from` on (each with its moves joined by " + ", the hit it takes there "(−4)"; a
 *  Wildcard or Free Hit week its chip's name, its changes being the chip's squad; a Bench Boost or Triple Captain after
 *  the week's moves), each led by its week ("GW7 …"; `tag` false: not, a row under its week's own tab). Pure.
 *  → [[gw, text]] for the weeks that do something */
export function planWeeks(P, pl, from, tag = true) {
  const nm = P.L.name;
  return P.gws.filter((x) => x >= from).map((x) => {
    const chip = pl.chips?.[x] ?? pl.yours?.[x] ?? null, ms = pl.moves.filter((m) => m.gw === x);
    const hit = pl.hits?.[x] ? ` (${MINUS}${E.HIT_COST * pl.hits[x]})` : '';
    const at = tag ? `GW${x} ` : '';
    if (SQUAD_CHIPS.has(chip)) return [x, `${at}${chipName(chip)}`];
    const moves = ms.map((m) => `${nm(m.out)} → ${nm(m.in)}`).join(' + ');
    return ms.length || chip ? [x, `${at}${[moves, chip ? chipName(chip) : ''].filter(Boolean).join(' · ')}${hit}`] : null;
  }).filter(Boolean);
}
/** An engine estimate as a plan planWeeks reads: the moves each week makes (viewOfState's: those the engine made), its
 *  chip and the hits it takes there. → {moves: [{gw, out, in}], chips: {gw: chip}, hits: {gw: n}} */
const planOfEv = (ev) => {
  const gws = ev?.gws || [];
  return { moves: gws.flatMap((s) => viewOfState(s).moves.map((m) => ({ gw: s.gw, ...m }))),
    chips: Object.fromEntries(gws.filter((s) => s.chip).map((s) => [s.gw, s.chip])), hits: Object.fromEntries(gws.map((s) => [s.gw, s.hits ?? 0])) };
};
/** What a choice's number counts after its week, in its Why sheet (the user, 2026-10-21: fix all (first-use proposal
 *  #3); Dana: "If everything is measured against rolling, show me the rolling plan"): each of the two plans the sheet
 *  sets side by side (`sides`: [[name, ev]], plansOf's `refEv` and `fullEv`, rolling's first), its weeks after GW g in
 *  words (planWeeks), "Rolling: GW9 Saka → Palmer + Calvert-Lewin → Evanilson · GW11 Rice → Wirtz"; a plan that makes
 *  none, "no transfers". Read-only: a row stays GW g's alone and its + takes GW g alone. Pure. → {head, lines} | null
 *  (neither makes a later move: "no later transfer" plans) */
export function countedAfter(P, g, sides) {
  const weeks = sides.map(([name, ev]) => [name, planWeeks(P, planOfEv(ev), g + 1).map(([, t]) => t)]);
  return weeks.some(([, ws]) => ws.length) ? { head: COPY.countedAfter(g), lines: weeks.map(([name, ws]) => COPY.countedLine(name, ws)) } : null;
}
/** A Wildcard or Free Hit choice's changes in its week, for its Why sheet (the user, 2026-10-21: fix all (first-use
 *  proposal #7); Maria couldn't see "whether Kayode, whom she had kept, plays"): plan `ev`'s GW-g changes (the chip's
 *  squad against the week before, as your chip week's own changes: changeRow), paired as the Week sheet pairs them once
 *  its + takes it (viewOfState, `keep`: your transfers as the rules its + leaves make them, takenKeep; the user,
 *  2026-10-21: fix the known issues), then each player a Keep of yours holds in that squad then, `kept`: as its solve
 *  holds him (keptCells: in a Free Hit week only a Keep made for that week; plansOf lists no plan that drops one). Pure.
 *  → [{out, in} | {in, kept: true}] */
export function squadChanges(P, g, ev, keep = []) {
  const s = ev?.gws.find((x) => x.gw === g);
  if (!s) return [];
  const kept = keptCells(P, g, s.chip ?? null).filter(([id, x]) => x === g && s.squad.includes(id)).map(([id]) => ({ in: id, kept: true }));
  return [...viewOfState(s, P.L, keep).moves, ...kept];
}
/** A lit choice drawn as its place's edges, never a one-tap tab (renderDecks), where its + takes back more than the
 *  player it waits behind: a buy of yours elsewhere, so his place says so ("instead of Palmer": noteOf) before its +.
 *  Your Wildcard or Free Hit in your chip week no longer (chipBackOf; the user, 2026-10-21, Kenji's "Petrović +3.3" tab
 *  inside his Free Hit, was a one-tap take): no plate takes since the owner's 2026-10-25 "make it always first click on
 *  tab and then click swap inside", and its place says "instead of Free Hit" before its Swap, so the best move there is
 *  ink as in any week (the owner, 2026-10-26, asked "should the best one be marked black like in other weeks?": "yes").
 *  `a`: the player whose place it is; `e`: its entry there (decksOf). Pure. */
export const litEdges = (a, e) => !!e.taken?.some((t) => Number(t.in) !== Number(a));
/** Value `v` kept under key `k` of `map` as its newest, the oldest let go past `max` (an entry used again is kept
 *  longest). → v */
const keepNewest = (map, k, v, max) => {
  map.delete(k);
  map.set(k, v);
  while (map.size > max) map.delete(map.keys().next().value);
  return v;
};
/** GW g's checks as one key: weekSettled's and settlesAt's, the checks' clock's and the lit fade's (weekModel). The
 *  solves of the week's choices (plansOf's `sig`), so a plan view made anew with the same ones (an Undo back to the plan
 *  before an edit, a bundle poll, a lineup edit) is the same week and one with other solves (an edit's rules, a new
 *  forecast) a new one (the phone recheck of the first-use proposals, 2026-10-21); a list without (the node tests')
 *  its plan view's. → string */
const VIEWS = new WeakMap();
let VIEW_N = 0;
export function weekKey(P, g, plans) {
  if (plans?.sig != null) return `${g}|${plans.sig}`;
  if (!VIEWS.has(P)) VIEWS.set(P, `view:${++VIEW_N}`);
  return `${g}|${VIEWS.get(P)}`;
}
/** The first-use run, 2026-10-21, #4 (Maria: the tabs changed three or four times in a minute; Tom: "Hill +4.1" became
 *  "Silva +4.8"; the user, 2026-10-21: fix all (first-use proposal #8)): GW g's choices on plan view P are settled once
 *  none of them (`plans`: plansOf's whole list) still checks, the draw heldOrder re-sorts them in; or once PAIR_HOLD_MS
 *  has run since the week's last landing (or since this visit's first draw of it) with one still checking (the review
 *  of the first-use proposals, 2026-10-21: a fork ask refused every time, asked again only after PAIR_HOLD_MS, or a
 *  solve that never ends, held the week unlit with its checking line forever, its ready choices too; a fork solve lands
 *  in 8–25 s, so a week that hears nothing for a whole retry pause has a check that isn't answering): the landed
 *  choices are lit then, the one still checking keeps its "checking…" in its place and the Week sheet. From then on,
 *  for those checks (weekKey), they stay so (litOf lights them), a failed check asked again (forkAsk) taking nothing
 *  off, a plan view made anew with them too (the phone recheck of the first-use proposals, 2026-10-21: an Undo back to
 *  a week already settled started it over); never while a choice waits for your edit's check. `now` for the tests.
 *  → boolean */
const SETTLED = { last: null, by: new Map() };  // the week last drawn (weekKey), and weekKey → {settled, done: its rows in, at: its last landing}
const SETTLED_MAX = 64;
export function weekSettled(P, g, plans, now = Date.now()) {
  const k = weekKey(P, g, plans);
  const s = keepNewest(SETTLED.by, k, SETTLED.by.get(k) ?? { settled: false, done: 0, at: now }, SETTLED_MAX);
  const done = plans.filter((x) => x.state !== 'solving').length;
  // a visit's first draw (another week's let its forks go: plansOf's L5), or a landing, starts the bound again; an
  // edit's check that rows wait for (`wait` 'heal': its own toast and clock; its landing is a new plan view) holds it,
  // the week unsettled meanwhile though its checks settled before
  const heal = plans.some((x) => x.state === 'solving' && x.wait === 'heal');
  if (SETTLED.last !== k || done > s.done || heal) s.at = now;
  SETTLED.last = k;
  s.done = done;
  if (done === plans.length || now - s.at >= PAIR_HOLD_MS) s.settled = true;
  return s.settled && !heal;
}
/** When GW g's choices on plan view P settle unless one lands first (weekSettled's bound), for tick() to draw them
 *  then (nothing else draws a week whose solve never ends); null once settled or before its first draw. */
const settleDue = (k) => { const s = SETTLED.by.get(k); return s && !s.settled ? s.at + PAIR_HOLD_MS : null; };
export const settlesAt = (P, g, plans) => settleDue(weekKey(P, g, plans));
/** The marks on the pitch (the user, 2026-10-23, after the card-behind marks: "these + points or round 2 / 3 confusing - i
 *  cant see which transfer best, also its rather ugly"; the design he chose: forkcast/design_marks/DECISION.md, design.md),
 *  none until the week's choices are settled (M.settled: weekSettled; the user, 2026-10-21: fix all (first-use proposal
 *  #8), so the best is shown once and never one still checking): the week's one best (weekBest: an ink plate, its places
 *  `best`; no take on the pitch, his place's headers take: the owner, 2026-10-25, after v1.3.79, "make it always first
 *  click on tab and then click swap inside") and each other place's best single move that beats rolling (`best` false: a quiet
 *  green plate, named and numbered, so the best single stays seen where a plan wins; the user, 2026-10-22: "the one ...
 *  and combinations of two if they higher"). Each beats rolling while the week has no transfer, chip or Roll of yours,
 *  else clears the noise against your plan (litCan). Never a move you took off this session (plansOf `removed`, B129),
 *  nor one the 2026-10-18 bars keep from being the week's suggestion (plansOf `early`): his place keeps it, a plate of
 *  his place's first choice on the pitch where nothing else is (placeFirst, renderDecks: no ⇄ handle since the owner,
 *  2026-10-25). `D`: the places (decksOf); `toks`: the week's own choices beside the goal
 *  (decksOf), a chip there the best where its number is higher (`chip`: its token drawn as any, never ink and no Play
 *  since the owner's 2026-10-26 "make that free hit tab on top left not coloroud black and remove button 'play' from
 *  it"; "Rolling is best" none then), the best move then still its places' `best`, ink (the owner, 2026-10-25, Raketa's
 *  GW9, its Free Hit +3.3 over Evanilson
 *  +1.6: "where is black tab with green swap sign", then "fix so chips not interfer in ths behaviour").
 *  → Map(a → {e, best}) with .best (the best choice, a place's or a token's), .chip (the token's, or null) and .move (the
 *  best move: its places' `best`) */
export function litOf(P, w, M, D, toks = []) {
  const at = Object.assign(new Map(), { best: null, chip: null, move: null });
  const can = litCan(P, w, M);
  const best = weekBest(P, w, M, D, toks);
  at.best = best;
  at.chip = best && toks.includes(best) ? best : null;
  // (the best move, a chip's token aside: weekBest of the moves alone)
  const move = at.move = at.chip ? weekBest(P, w, M, D) : best;
  if (move) for (const d of placesOf(D, move)) at.set(d.a, { e: d.entries.find((x) => x.pl === move), best: true });
  if (!M.settled) return at;
  for (const d of D) {
    // (your own buys none of litOf's quiet plates: their plate is their take-back's, placeFirst, the owner, 2026-10-26;
    // ink where it is the week's best, weekBest)
    if (at.has(d.a) || d.mine) continue;
    // (a place's entries in the week's order, best first: heldOrder)
    const e = d.entries.find((x) => singleMove(x) && !x.pl.early && !x.pl.refRow && can(x.pl));
    if (e) at.set(d.a, { e, best: false });
  }
  return at;
}
/** Whether choice pl beats rolling as litOf counts it: checked, and past 0.05 while the week has no transfer, chip or
 *  Roll of yours (`fresh`), else past the noise against your plan (plPays); in a week your plan leaves short of money
 *  (owedAt) one that pays it back, keeping your transfers (paysBack). → (pl) → bool */
const litCan = (P, w, M) => {
  const g = w.gw;
  // a week your plan leaves short of money (owedAt): a choice that keeps your transfers and pays it back, whatever its
  // number (FPL confirms no team short of money: the owner, 2026-10-28, "show it as black transfer suggested as usual")
  if (owedAt(P, w)) return (pl) => pl?.state === 'ready' && paysBack(w, pl);
  const fresh = !w.moves.length && !M.sq && !P.pins.some((p) => p.id === `roll:${g}`);
  return (pl) => pl?.state === 'ready' && (fresh ? pl.cmp.delta > 0.05 : plPays(pl));
};
/** The places choice pl is drawn at (decksOf): behind each player it replaces; a take-back of a transfer of yours behind
 *  your buy. → [deck] */
const placesOf = (D, pl) => D.filter((d) => d.entries.some((e) => e.pl === pl));
/** The week's one best (the user, 2026-10-23: "i cant see which transfer best"; design_marks/design.md: one ink plate):
 *  the choice that beats rolling with the highest number, single moves and plans of several together (a plan only where
 *  its number is higher: the user, 2026-10-22, "combinations of two if they higher"), the take-back of a transfer of yours
 *  too, its plate over your buy naming the player you sold (the owner, 2026-10-28, of "Gabriel +4.8" over Hill: "why it
 *  not suggest in black to keep gabriel here instead of using -4 on him to hill"), never one whose take would also take
 *  back a buy of yours elsewhere (litEdges: its Swap would change more than the plate shows; the next best is the best
 *  then, that one a quiet plate whose place says "instead of …"); a Wildcard or Free Hit beside the goal (`toks`) where
 *  its number is higher still. None until the week settles. Pure. → pl | null */
export function weekBest(P, w, M, D, toks = []) {
  const g = w.gw;
  if (!M.settled) return null;
  const can = litCan(P, w, M);
  const ok = (pl) => !pl.refRow && !pl.early && can(pl);
  const moves = M.plans.filter((pl) => ok(pl) && placesOf(D, pl).length && !placesOf(D, pl).some((d) => litEdges(d.a, d.entries.find((e) => e.pl === pl))));
  const chips = toks.filter((pl) => ok(pl) && !rollOnly(pl) && !!pl.choice.chips?.[g]);
  return [...moves, ...chips].reduce((m, pl) => (!m || pl.cmp.delta > m.cmp.delta ? pl : m), null);
}
/** The choices the pitch shows lit, green (the user, 2026-10-22: the Week sheet greened every gain while the pitch lit
 *  two; one rule): those litOf lights that pay (plPays: a lit lead inside the noise has its tab, never green), and a
 *  token beside the goal that pays (a Wildcard, a Free Hit, `toks`: decksOf's). The Week sheet's rows green with a solid
 *  + exactly these (planRow), the others neutral with an outlined +. Each other place's plate too, its first choice
 *  (placeFirst), once the week settles, where it pays (a pair's, one past the best): every place has a plate since the
 *  owner's 2026-10-25 "instead use either names with points ... or just points if space tough", and the sheet's green
 *  follows the pitch (the owner, 2026-10-25: "Follow the pitch"); a number-only plate the same, never one that doesn't
 *  pay, nor one at a place the pitch as last drawn gave no plate (`D.drawn`: renderDecks' places, none under a plan's
 *  plate or with no turf over him; the review of plates3, 2026-10-25: such a row stayed green); the best's wherever it
 *  is (ringed). Pure. → Set(pl) */
export function litShown(P, w, M, D, toks = [], lit = litOf(P, w, M, D)) {
  const on = (a) => !D.drawn || D.drawn.has(a);
  const first = M.settled ? D.filter((d) => !lit.has(d.a) && on(d.a)).map(placeFirst).filter((e) => e?.pl?.state === 'ready').map((e) => e.pl) : [];
  // (the plates as last drawn, a sentence's sellers' own singles among them: D.drawnPl, renderDecks; design 1026e)
  return new Set([...[...lit].filter(([a, x]) => x.best || on(a)).map(([, x]) => x.e.pl), ...first, ...(M.settled ? D.drawnPl ?? [] : []), ...toks.filter((pl) => pl.state === 'ready' && !pl.refRow)].filter(plPays));
}
/** The Roll of a week you roll (plansOf `rolls`: no transfer, chip or Roll of yours there): its + would only make the
 *  roll one of your rules, changing nothing on screen, so it has none (the user, 2026-10-22: "+" offered only where it
 *  would change something): a "Rolling" status beside the goal (tokensOf), its Week sheet row and Why sheet with no + or
 *  Take. A Roll that takes a transfer or chip of yours back keeps its +. */
export const rollOnly = (pl) => !!pl?.rolls;
/** Plan pl's GW g in a week with transfers of yours: only what it adds to them (`adds`) and what its + takes back of
 *  yours, "instead of Scott → Xhaka" (`back`; review 5, 2026-10-12: rows repeated your moves, and a + took yours back
 *  said only by its toast), with its GW-g moves (`now`), whether GW g plays a squad chip (`chipNow`), your GW-g
 *  transfers its + takes back (`taken`: yoursTakenBack, none in your chip week) and what it takes back named short
 *  (`lost`: the buys, "Palmer", the chip, "Wildcard", or your Roll, "rolling": rollingAt), and the same as a row or a
 *  place's note says it (`gone`): the buy alone, "instead of Palmer" (the user, 2026-10-22: one form everywhere;
 *  "Saka → Rice instead of Saka → Palmer" named Saka twice), your move whole only where the choice buys him too
 *  ("instead of Murillo → Hill" on a Hill card: the user, 2026-10-21, "why hill 'instead of hill'"). Pure. */
/** Choice c's GW-g moves your week doesn't make already (`yours`: its moves; none in your Wildcard or Free Hit week, where
 *  a choice's moves are all its own): what its + adds (planBack's `adds`; weekBest's single or several). Pure. */
const addsOf = (c, g, yours) => c.moves.filter((m) => m.gw === g && !yours.some((y) => y.out === m.out && y.in === m.in));
export function planBack(P, g, pl) {
  const nm = P.L.name;
  const c = pl.choice;
  const chipNow = SQUAD_CHIPS.has(c.chips?.[g]);
  const now = chipNow ? [] : c.moves.filter((m) => m.gw === g);
  // in your Wildcard or Free Hit week, what its + takes back is the chip (chipBackOf): "instead of Wildcard"; the
  // week's changes are then the chip's squad, not transfers of yours a choice adds to, so the row says every move it
  // makes (the user, 2026-10-13: a Wildcard week's row read "GW7 −16.4", its moves all among the chip's changes)
  const ch = chipBackOf(P, g, c);
  const yoursNow = ch ? [] : weekOf(P, g)?.moves || [];
  const adds = chipNow ? [] : addsOf(c, g, yoursNow);
  const taken = ch ? [] : yoursTakenBack(P, g, c.moves);
  // under your Roll (rollingAt: "Rolling ✓") a choice that moves someone takes it back: "instead of rolling"
  const roll = !ch && adds.length && rollingAt(P, g) ? COPY.planVsRoll : '';
  const gone = ch ? chipName(ch) : roll || taken.map((m) => (adds.some((a) => a.in === m.in) ? `${nm(m.out)} → ${nm(m.in)}` : nm(m.in))).join(' + ');
  const lost = ch ? chipName(ch) : roll || taken.map((m) => nm(m.in)).join(' + ');
  // rolls: all it takes back is your Roll (no transfer, no chip): a single move stays a single there (multiMove)
  return { chipNow, now, adds, taken, lost, gone, rolls: !!roll, back: !gone ? '' : ch || adds.length || chipNow || !now.length ? COPY.planInsteadOf(gone) : COPY.planWithout(gone) };
}
/**
 * The card behind (the user, 2026-10-20: "make palmer wait behind saka with others"; the design: forkcast/work/
 * pitch-design-v2/final/proposal.md): the week's choices (weekModel's, in its order) on the pitch, each behind the card
 * of the player it would replace: his card when he is on it, else the card of your buy that sold him (a choice that
 * changes a transfer of yours); one that only takes transfers of yours back (the Roll of a week with yours) behind those
 * buys; one that changes no player (a Roll with none of yours, a Wildcard, a Free Hit, a Bench Boost alone) beside the
 * goal (`toks`). Each buy of yours has a place, first the player it replaced: the choice that takes that transfer alone
 * back (a week's one transfer: its Roll), else Remove (the Week sheet's ×: removeMove). Your buys' places first, then by
 * their best choice's rank. A choice with no card to wait behind (a move in your Wildcard week whose seller the chip
 * sold) is the Week sheet's alone. A pair's move alone (plansOf; the user, 2026-10-21: "why it not suggests de cuyper to
 * hill as a separate transfer") waits behind the same player as the pair's card for him. Pure.
 * → {decks: [{a, mine, entries: [{pl | remove, inId, back?, adds, pair: [{a, out, in}], taken, lost}]}], toks: [pl]}
 */
export function decksOf(P, w, M) {
  const g = w.gw, on = new Set([...w.xi, ...w.bench].map(Number));
  const mine = M.sq ? [] : w.moves;
  const anchorOf = (o) => (on.has(Number(o)) ? Number(o) : Number(mine.find((m) => Number(m.out) === Number(o))?.in) || null);
  const by = new Map(), toks = [];
  const put = (a, e, rank) => {
    if (!on.has(a) || a === e.inId) return;
    if (!by.has(a)) by.set(a, { a, mine: false, rank, entries: [] });
    by.get(a).entries.push(e);
  };
  M.plans.forEach((pl, i) => {
    // (no Wildcard or Free Hit on the pitch: the owner, 2026-10-27, "Remove free hit / wc pils from pitch"; Chips… and
    // the Week sheet offer them)
    if (SQUAD_CHIPS.has(pl.choice.chips?.[g])) return;
    const { chipNow, adds, taken, lost, gone, rolls } = planBack(P, g, pl);
    if (chipNow || (!adds.length && !taken.length)) toks.push(pl);
    else if (adds.length) {
      if (benchOnly(g, pl, adds)) return;
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
    // the Roll that takes this transfer alone back, once it can be taken (checking or failed: Remove, which acts at once);
    // dealt last, as every take-back is (placeOrder)
    const one = (e) => e.back && e.taken.length === 1;
    const d = by.get(a), k = d.entries.findIndex((e) => one(e) && e.pl?.state === 'ready');
    d.mine = true;
    const first = k >= 0 ? d.entries.splice(k, 1)[0]
      : { remove: { gw: g, out: m.out, in: m.in }, inId: Number(m.out), back: true, adds: [], pair: [], taken: [m], lost: P.L.name(m.in) };
    d.entries = [first, ...d.entries.filter((e) => !one(e))];
  }
  return { decks: [...by.values()].sort((x, y) => y.mine - x.mine || x.rank - y.rank), toks };
}
/** Whether choice pl's GW-g buys (`adds`) all stay out of its XI in every week of its plan from g on (pl.ev, as taking it
 *  plays them): a transfer to the bench, no plate on the pitch and no card in a place, so never the week's best (the
 *  owner, 2026-10-28: "Why transfer to bench (petrovich) even suggested - fix": Dovin → Petrović +0.2, Raya's
 *  understudy). Known once it is checked; the player's Replace list still offers him. Pure. */
export const benchOnly = (g, pl, adds) => pl?.state === 'ready' && !!pl.ev?.gws && adds.length > 0
  && adds.every((m) => pl.ev.gws.every((s) => s.gw < g || !(s.xi ?? []).some((x) => Number(x) === Number(m.in))));
/** A place's entry that takes a transfer back (the Roll of a week with yours, Remove): dealt last (placeOrder), and
 *  dealt even where the place has room for fewer cards than it holds (drawPlace: before "⋯ N more"). */
export const takesBack = (e) => !!(e.back || e.remove || e.pl?.refRow);
/** A place's entry that is one move alone (no other move of the choice: `pair` empty), a choice of its own, not a
 *  take-back, checked or checking: never a failed one ("needs Gvardiol's sale", can't be checked; the review of the
 *  many-FT fixes, 2026-10-22: it took the held slot from a choice you could take). */
export const singleMove = (e) => !!e.pl && !e.pair?.length && !takesBack(e) && e.pl.state !== 'failed';
/** The cards a place deals into its n slots (placeOrder's order): all where they fit, else the best that fit, then what
 *  takes your transfer back, leaving the last slot to "⋯ N more" (the review of round 7, 2026-10-22: with four or more
 *  other choices the Roll or Remove, dealt last, went under "⋯ N more"); the best single move held a slot as the
 *  take-back is, where the best ones are all pairs (the user, 2026-10-22: "i dont see where suggestion to sell gvardiol
 *  only without multiple other players at the same time": Cunha's place dealt two pair cards, Cunha → Rice +2.0 under
 *  "⋯ 3 more"), in the last best one's slot; all only with a slot to spare where the last is always the tile (`tile`:
 *  its "Other…", placePages). Pure. */
export const placeDealt = (entries, n, tile = false) => {
  const all = entries;
  // (one card per buy, its next way a line under it: placeBuys, placeLine)
  entries = placeBuys(entries);
  if (entries.length <= n - (tile ? 1 : 0)) return entries;
  const back = entries.find(takesBack) ?? null;
  const k = Math.max(0, n - 1 - (back ? 1 : 0));
  const best = entries.filter((e) => e !== back).slice(0, k);
  // (a single move shown as a dealt card's line counts, placeLine; one that is a later way of a buy is dealt by that
  // buy's card, its line then the single: the review of cards4, 2026-10-26, Rice alone lost behind two Rice pairs)
  const shows = (e) => singleMove(e) || singleMove(placeLine(all, e) ?? {});
  const one = all.find((e) => singleMove(e) && e.pl.state === 'ready') ?? all.find(singleMove);
  if (one && k && !best.some(shows)) best.splice(k - 1, 1, entries.find((e) => e === one || (!takesBack(e) && e.inId != null && e.inId === one.inId)));
  return [...best, ...(back ? [back] : [])];
};
/** A place's cards page by page (drawPlace): placeDealt's first, then every buy it had no room for (placeBuys, in
 *  placeOrder's order), n − 1 to a page, its last slot the tile that deals the next page, the first again after the last
 *  (the owner, 2026-10-27: "⋯ 2 more" on Evanilson's place opened the Week sheet's list, "all various combinations not
 *  just evanilson and in some random format"); one page where all fit, beside the tile's slot where it is always drawn
 *  (`tile`: its "Other…", drawPlace). Pure. → [[entry]] */
export const placePages = (entries, n, tile = false) => {
  const buys = placeBuys(entries);
  if (buys.length <= n - (tile ? 1 : 0)) return [buys];
  const first = placeDealt(entries, n, tile), per = Math.max(1, n - 1);
  const rest = buys.filter((e) => !first.includes(e));
  const pages = [first];
  for (let i = 0; i < rest.length; i += per) pages.push(rest.slice(i, i + per));
  return pages;
};
/** A place's entries (placeOrder's order) one card per buy (the owner, 2026-10-26, of Murillo's place dealing Silva
 *  −4.3 "a 2nd transfer" and Silva −1.9 "instead of Evanilson" as two cards: "find if there is a way to combine 'a
 *  second transfer' and 'instead of..' for a player in one card not two"; chosen: "Better one + line"): the first of
 *  each buy (`inId`), the better as the order has it, every take-back its own (the Roll, Remove: what keeps a player of
 *  yours, never a buy's way); the next way of the same buy is its card's line (placeLine), any further way the Week
 *  sheet's (and "All N"), so the cards freed deal other buys. Pure. */
export const placeBuys = (entries) => {
  const seen = new Set();
  return entries.filter((e) => takesBack(e) || e.inId == null || (!seen.has(e.inId) && !!seen.add(e.inId)));
};
/** The line under a place's card `e` (placeBuys): the next way of its buy in `entries` (placeOrder's order), "or 2nd
 *  transfer −4.3 ›" (drawPlace), which takes that choice as a header's Swap does; a card that is no single move, its
 *  next way none either, the buy's move alone where there is one (one it can't make alone too, its sale said) (the place's held single, placeDealt: the owner,
 *  2026-10-22, "sell gvardiol only without multiple other players"); none for a take-back. Pure. → entry | null */
export const placeLine = (entries, e) => {
  if (takesBack(e) || e.inId == null) return null;
  const ways = entries.filter((x) => x !== e && !takesBack(x) && x.inId === e.inId && entries.indexOf(x) > entries.indexOf(e));
  if (!ways.length) return null;
  // (its move alone that can't be made alone too, "needs Kayode's sale": the owner, 2026-10-21, q2-pair-singles)
  const lone = (x) => !x.pair?.length;
  return singleMove(e) || lone(ways[0]) ? ways[0] : ways.find((x) => singleMove(x) && x.pl.state === 'ready') ?? ways.find(lone) ?? ways[0];
};
/** A place's choice of more than one move (design 1026e "line"; the owner, 2026-10-26, of rings, tags, "also …" notes and
 *  "or needs …" lines: "messy dirty crap"): a plan with other moves (`pair`), or one whose take also takes back a buy of
 *  his elsewhere (`gone`; in his own buy's place, `a`, the one it replaces is the place's title: a single there). Such a
 *  choice is one sentence, never a card. Pure. */
export const multiMove = (e, a = null) => {
  if (!e?.pl || e.pl.refRow) return false;
  const own = a != null && e.taken?.length === 1 && Number(e.taken[0].in) === Number(a);
  // (a Roll taking back more than the place's own buy too: "Instead of Palmer + Tavernier + Evanilson")
  if (takesBack(e)) return !own && !!e.taken?.length;
  // (a single move under your Roll takes back only the Roll, "instead of rolling": a single, "Tavernier +1.6" on Slater
  // opening his place, never "Slater → Tavernier instead of rolling" over the bench opening its Why sheet; the owner,
  // 2026-10-28: "why it shows text 'slater to tavernier instead of rolling' instead of just tavernier")
  return !!e.pair?.length || (!!e.gone && !own && !e.rolls);
};
/** A place's entries split (design 1026e "line"; Johnson, The Elements of Choice: grouping decides comparison): his own
 *  single moves, the cards (and his take-backs: Roll, Remove), and at most one line, the best plan he is part of, first in
 *  placeOrder's order (a checked one before one checking). A pair's move the week can't make alone (plansOf `needs`) is
 *  neither: it is that plan's move, and its reason was the phone's sum (fitOf), never the solver's (the owner's "no
 *  hardcoded logic whatsoever", 2026-10-26). `entries` in placeOrder's order. Pure. → {singles, line} */
export const placeSplit = (entries, a = null) => {
  // (nor a Roll taking back more than the place's own buy, "Instead of Palmer + Tavernier + Evanilson": the owner
  // rejected exactly that line; it is the Week sheet's row, the place's own take-back its Remove card)
  const live = entries.filter((e) => !e.pl?.needs && !(takesBack(e) && multiMove(e, a)));
  const multi = live.filter((e) => multiMove(e, a));
  return { singles: live.filter((e) => !multi.includes(e)), line: multi.find((e) => e.pl.state === 'ready') ?? multi.find((e) => e.pl.state !== 'failed') ?? null };
};
/** A multi-move choice as one sentence (design 1026e "line"; Podmajersky, Strategic Writing for UX: a label says what
 *  happens): its GW-g moves in the order its solved road makes them (`adds`: planBack's, the choice's own order), "Neto →
 *  Tavernier, Cunha → Palmer", a take-back's words after them, "instead of Palmer". Never re-derived on the phone. Pure.
 *  → [move words] with `.back` (its "instead of …" | '') */
export const lineMoves = (P, e) => {
  const nm = P.L.name;
  const back = e.gone ? COPY.planInsteadOf(e.gone) : '';
  return Object.assign(e.adds.map((m) => `${nm(m.out)} → ${nm(m.in)}`), { back: e.adds.length ? back : capFirst(back) });
};
/** A place's entries (decksOf's) in the order its cards are dealt, nearest his own card first (the reviews, 2026-10-22: the
 *  ranks zig-zagged, "Mbeumo +0.6 · Rice +1.8 · Roll · Yours +2.8"): the checked choices best first, then those still
 *  checking or failed, then what takes a transfer back (the Roll of a week with yours, Remove) last; ties as listed. Pure. */
export const placeOrder = (entries) => {
  const tier = (e) => (takesBack(e) ? 2 : e.pl?.state === 'ready' ? 0 : 1);
  return entries.map((e, i) => [e, i]).sort(([a, i], [b, j]) => tier(a) - tier(b) || (tier(a) === 0 ? b.pl.cmp.delta - a.pl.cmp.delta : 0) || i - j).map(([e]) => e);
};
/** The most cards a player's place deals beside him (drawPlace: slotsBeside's n). */
const PLACE_SLOTS = 4;
/** A place's first choice, the card it deals first (placeDealt in placeOrder's order): the plate of a place no plate of
 *  litOf's names (the owner, 2026-10-25, after v1.3.79, of the ⇄ handle: "instead use either names with points
 *  (positive or negative like with gabriel) or just points if space tough; this sign is confsing as suggest differnt
 *  behaviour which it isnt"), its number whatever its sign; none for one with no choice checked or checking (as the
 *  handle was). Your own buy's place its take-back, the Roll or Remove decksOf puts first there, naming the player you
 *  sold (the owner, 2026-10-26, Raketa's GW11 after buying Justin for Gabriel: "i bough justin but where is no tab on
 *  his head so i can keep prebious player"; H had none). Pure. → its entry | null */
export const placeFirst = (d) => {
  if (d.mine) return d.entries[0] && takesBack(d.entries[0]) ? d.entries[0] : null;
  const live = (e) => !takesBack(e) && (e.pl?.state === 'ready' || e.pl?.state === 'solving');
  // (his own moves alone: a plan he is part of has its one mark elsewhere, its sentence; design 1026e "line")
  const own = placeSplit(placeOrder(d.entries), d.a).singles;
  if (!own.some(live)) return null;
  // (a failed one listed before one still checking: the checking one, "checking…", never "can't check" while it may land)
  const dealt = placeDealt(own, PLACE_SLOTS);
  return dealt.find(live) ?? dealt[0];
};
/** Up to n x's for a place's dealt cards beside his card at x0, `step` apart, each a whole card (cw) inside [3, W − 3], in
 *  one direction so the rank reads outward from him (the reviews, 2026-10-22: right, left, right zig-zagged): rightwards,
 *  then, once the right has no more room, on his left nearest first (at the right touchline every one leftwards). Pure. */
export function slotsBeside(x0, step, n, W, cw) {
  const side = (s) => [1, 2, 3, 4, 5].map((k) => x0 + s * k * step).filter((x) => x >= 3 && x + cw <= W - 3);
  return [...side(1), ...side(-1)].slice(0, n);
}
/** A choice that failed (plansOf `failed`) in words: `head` in its number's place in a player's place, `note` under its
 *  card there, `row` its Week sheet row's and its spoken line's: a check that failed "can't check", "can't check: no
 *  plan fits", and why in full (COPY.planFailed); a pair's move the week can't make alone (`needs`: the user,
 *  2026-10-21, "why it not suggests de cuyper to hill as a separate transfer - and only in combination?") all it lacks
 *  alone ("£1.7m short"; "£1.3m short, 3 from ARS": problemShort each, as Bring in's sale chip says a sale the money
 *  can't pay alone) and the sales it needs ("needs Kayode's sale"). Pure. → {head, note, row} */
export function failedWords(P, pl) {
  if (!pl.needs) return { head: COPY.placeCantCheck, note: `${COPY.placeCantCheck}: ${COPY.planFailedShort(pl.why)}`, row: COPY.planFailed(pl.why) };
  const lack = pl.problems.length ? pl.problems.map(problemShort).join(', ') : problemShort(null), need = COPY.needsSale(pl.needs.map((id) => P.L.name(id)));
  return { head: lack, note: need, row: `${lack} · ${need}` };
}
/** What else a place's choice does, under its card: "checking…", why it can't be checked or made alone (failedWords),
 *  what its + takes back ("instead of Palmer", as a Roll behind your buy says it too; "instead of Murillo → Hill", named whole, as its
 *  Week-sheet row does: the user, 2026-10-21, "why hill 'instead of hill'" on a Hill card that moves your Hill buy to
 *  another place), a pair's other moves ("also Dovin → Leno, Saka → Rice": COPY.placeAlso), a transfer it adds to yours ("a 2nd transfer"), a Bench Boost
 *  or Triple Captain it plays, "as good in GW9" (earlyWords: the same move made then is worth no less; the user,
 *  2026-10-21: listed, never lit); last, a move you took off this session, "removed by you" (plansOf `removed`, as its
 *  Week sheet row says it: B129; the user, 2026-10-21: fix the known issues). `e`: its entry in the place (decksOf). Pure. */
export function noteOf(P, w, e, a = null) {
  const nm = P.L.name, pl = e.pl, chip = pl?.choice.chips?.[w.gw];
  // (no "about as good as Truffert" under a card: the owner, 2026-10-25, "why needed these silly comments 'about as good
  // as tavernier' which only takes space not adding any value")
  const said = (...xs) => [...xs, earlyWords(pl), pl?.removed ? COPY.removedByYou : null].filter(Boolean).join(' · ') || null;
  if (pl?.state === 'solving') return said(COPY.pairChecking);
  if (pl?.state === 'failed') return said(failedWords(P, pl).note);
  // in the place of a buy of yours (`a`: the place's player) every card takes that buy back: its title says so ("Rice's
  // place"), so a note naming that buy alone says nothing more (the user, 2026-10-22, Rice's place on TORPEDO: "why note
  // dublicated three times"); one taking back more than it still says so
  const own = a != null && e.taken?.length === 1 && Number(e.taken[0].in) === Number(a);
  const what = own ? (e.pair.length ? COPY.placeAlso(e.pair.map((p) => `${nm(p.out)} → ${nm(p.in)}`)) : null)
    : e.back ? COPY.planInsteadOf(e.lost)
    : e.pair.length ? [COPY.placeAlso(e.pair.map((p) => `${nm(p.out)} → ${nm(p.in)}`)), e.gone ? COPY.planInsteadOf(e.gone) : null].filter(Boolean).join(' · ')
      : e.gone ? COPY.planInsteadOf(e.gone) : w.moves.length && !squadWeek(w) ? COPY.placeNth(w.moves.length + 1) : null;
  return said(what, chip && !SQUAD_CHIPS.has(chip) ? chipName(chip) : null);
}
/** N9 (the plans review, 2026-10-11): your plan has a transfer in some week (every plan keeps the others), so plans
 *  count against "your plan", never "no transfers". */
const mineAny = (P) => P.weeks.some((w) => w.moves.length);
/** Best first: the higher number, the model's own plan on a tie. */
const byGain = (a, b) => b.cmp.delta - a.cmp.delta || b.model - a.model;

/** GW g's choice c ({moves, chips}) can be made on your plan as it stands (decision 6): its moves in place of your GW-g
 *  ones, your other weeks kept (estimate: every move legal, and no week's bank or clubs worse off than your plan has
 *  them: the + takes GW g alone, so no later move of Forkcast's fixes a later week; the user, 2026-10-12), and none buys back a player your plan has between his last sale
 *  and g (rebought). A Wildcard or Free Hit is its solve's to make. Once per plan view and choice: no solve asked for one
 *  that can't be (fitsAt). → {ok, problems: problemsOf's that stop it (a pair's move alone says what it lacks: plansOf
 *  `needs`, problemShort), [] for one your plan has already or a buy back} */
const FITS = new WeakMap();
function fitOf(ctx, P, g, c, d0) {
  if (Object.keys(c.chips || {}).length) return { ok: true, problems: [] };
  let by = FITS.get(P);
  if (!by) FITS.set(P, (by = new Map()));
  const k = `${g}|${forkKey(c, g)}`;
  if (!by.has(k)) {
    const mine = flatMoves(d0);
    const d1 = planTakeDraft(ctx, P, g, d0, c.moves);
    const ev = estimate(ctx, chipBackOf(P, g, c) ? E.setChip(d1, g, null) : d1, g);
    const ps = problemsOf(ctx, ev, g), p = ps[0] ?? null, p0 = p && problemOf(ctx, estimate(ctx, d0, g), g);
    const own = !!p && p0?.code === p.code && p0.gw === p.gw;
    by.set(k, { ok: (!p || own) && !rebought(P, c.moves, ev, mine.filter((m) => pinOfMove(P, m))), problems: own ? [] : ps });
  }
  return by.get(k);
}
const fitsAt = (ctx, P, g, c, d0) => fitOf(ctx, P, g, c, d0).ok;

/** L2: a move of `moves` from GW x > A buys back a player plan `ev` has in a week (no Free Hit's) between his last sale
 *  (by a move of `moves` or a transfer of yours, `mine`; else GW A) and x: the exact sale's rule keeps the player it buys out from
 *  then until x (memory.composePins' B36), so taking it couldn't be planned. → bool */
function rebought(P, moves, ev, mine) {
  return moves.some((m) => {
    if (m.gw <= P.A) return false;
    const sold = [...moves, ...mine].filter((x) => x.out === m.in && x.gw < m.gw).map((x) => x.gw);
    const from = Math.max(P.A, ...sold);
    return ev.gws.some((s) => s.gw >= from && s.gw < m.gw && s.chip !== 'fh' && s.squad.includes(m.in));
  });
}

/** A plan's GW-g choice as a key: GW g's decision only, the moves it makes there or the Wildcard or Free Hit it plays
 *  there (the user, 2026-10-11: "why gw7 roll duplicated": a chip in a later week is that week's decision, its own row
 *  there, never a second "GW7 roll"). */
const forkKey = (p, g) => (SQUAD_CHIPS.has(p.chips?.[g]) ? p.chips[g]
  : p.moves.filter((m) => m.gw === g).map((m) => `${m.out}>${m.in}`).sort().join(','));

/** Road r as a plan from GW g on, on your plan (d0: draftOf) as it stands (decision 6): its moves from g (roadDraft: a
 *  Free Hit's week that week's squad), your weeks before g as they are, and a Wildcard or Free Hit it plays in GW g.
 *  Chips are each week's own decision (the user, 2026-10-11: "Barry → Walle Egeli · Free Hit GW8": the Free Hit's points
 *  read as a GW7 sale's), so a road that plays a Wildcard or Free Hit after g that your plan doesn't, or leaves out one
 *  yours plays, a transfer of yours after g or a Roll of yours there, is no plan of yours (it was solved without your other
 *  weeks); nor one that plays a Bench Boost or Triple Captain from g on other than yours (the owner, 2026-10-28, "find why
 *  gw9 transfers affected after the change and fix introduced bug": Raketa's GW12 Bench Boost road, its chip left out and
 *  its moves kept, swapped both keepers in GW12 to fill the bench, a move no solve without the chip makes, and its GW9
 *  "Murillo → Hill" read +1.67, the week's best, over the model's Calvert-Lewin → Evanilson +1.55). Its GW-g choice
 *  stands either way, solved on its own (M2: the model's GW-A moves are a choice when its plan plays a Free Hit later).
 *  → {choice: {moves (GW g's), chips}, plan: {moves: [{gw, out, in}] (no chip squad's), chips: {gw: chip} (GW g's), yours:
 *  {gw: chip} (your Wildcard and Free Hit weeks after g), draft} | null} | null (r's weeks before g aren't yours: it was
 *  solved from another squad) */
export function planOfRoad(ctx, P, r, g, d0) {
  // (a road solved to its own week only, a choice's: forkValues `to`, is your plan after it: your moves and chips)
  const last = roadLast(r);
  const rd = roadDraft(ctx, r), mine = flatMoves(d0), theirs = [...flatMoves(rd).filter((m) => m.gw <= last), ...mine.filter((m) => m.gw > last)];
  const at = (ms, x) => ms.filter((m) => m.gw === x).map((m) => `${m.out}>${m.in}`).sort().join(',');
  if (P.gws.some((x) => x < g && at(theirs, x) !== at(mine, x))) return null;
  const chipAt = (d, x) => (d === rd && x > last ? d0 : d).chips?.[x] ?? null;
  const sq = SQUAD_CHIPS.has(chipAt(rd, g));
  const choice = { moves: sq ? [] : theirs.filter((m) => m.gw === g), chips: sq ? { [g]: chipAt(rd, g) } : {} };
  const later = P.gws.filter((x) => x > g);
  const yours = Object.fromEntries(later.map((x) => [x, squadWeek(weekOf(P, x))]).filter(([, c]) => c));
  // nor one that moves where a Roll of yours after g says no transfers, or no more than yours (memory.rulesBroken: the
  // fork solves keep it; the plans review, 2026-10-19: the reference and road rows made GW8 moves "No transfers · GW8"
  // forbids, the fork-solved rows didn't)
  const locks = P.pins.filter((p) => (isRoll(p) || isExact(p)) && num(p.gw) > g);  // (a Roll keeping your moves there: their caps)
  // (a Bench Boost or Triple Captain from g on that your plan doesn't play there, or yours left out)
  const otherBoost = [g, ...later].some((x) => !SQUAD_CHIPS.has(chipAt(rd, x)) && chipAt(rd, x) !== (SQUAD_CHIPS.has(chipAt(d0, x)) ? null : chipAt(d0, x)));
  if (otherBoost || later.some((x) => (SQUAD_CHIPS.has(chipAt(rd, x)) || yours[x]) && chipAt(rd, x) !== (yours[x] ?? null))
    || ownAfter(P, g).some((m) => !theirs.some((y) => sameMove(y, m)))
    || (locks.some(isRoll) && rulesBroken(r, locks, { from: g + 1, to: P.end }).some(isRoll))) return { choice, plan: null };
  const moves = theirs.filter((m) => m.gw >= g && P.gws.includes(m.gw) && !(sq && m.gw === g) && !yours[m.gw]);
  let draft = withMoves(d0, [...mine.filter((m) => m.gw < g), ...theirs.filter((m) => m.gw >= g && P.gws.includes(m.gw))]);
  if (sq) draft = E.setChip(draft, g, chipAt(rd, g));
  else if (SQUAD_CHIPS.has(chipAt(d0, g))) draft = E.setChip(draft, g, null);  // your chip week, its choice no chip (chipBackOf)
  return { choice, plan: { moves, chips: choice.chips, yours, draft } };
}

/** A road's last committed week: its values' `to` (a choice's own week, forkValues), else its last week; past it a
 *  plan is your plan's (planOfRoad). */
const roadLast = (r) => num(r?.values?.to) ?? Math.max(...(r?.weeks || []).map((w) => Number(w.gw)), -Infinity);
/** Draft d played as taking a plan makes it, from GW `from` on (decision 3: a plan's number is what taking it gives;
 *  the reviews, 2026-10-11, High: after a sub the row said +4.65 and the take gave +3.55, its buy in the benched
 *  player's slot): the engine's best XI in each week, your saved lineup (repaired onto the week's squad as the plan view
 *  plays it: engine.applyLineup, a sold player's slot his buy's, as FPL places him) where you made one. Under the hold
 *  (`held`) a week's XI, bench and armband the solve's where a bundle road holds that week's squad, as the plan a take
 *  lands plays them (memory.holdRoad's solvedLineup; the user, 2026-10-23: a doubtful starter the solve starts for the
 *  autosub behind him): QA plan-week (6076699 GW9, 2026-10-26, "the total moved by what its + gives (the week alone)",
 *  13.49 then 14.38): your plan benched Cunha there as its solve does, the xP order started him, so every + there said
 *  0.89 less than it gave. `held` false: the xP order (plansOf's plans set against rolling, both sides measured alike).
 *  `score`: evaluate's {xp, fixedLineups} (ifMisses: the held lineups are saved ones to evaluate, so its miss is scored
 *  on the lineups its sheet's own number plays). → evaluate's state */
function asTaken(ctx, P, d, from, score = {}, held = true) {
  const I = info(ctx);
  let x = d;
  for (const g of P.gws) if (g >= from && !weekOf(P, g)?.lineup && x.lineups?.[g]) x = E.setLineup(x, g, null);
  const run = (y) => E.evaluate({ base: baseOf(ctx), players: I.d.players, draft: y, horizon: I.gws, ...score });
  const ev = run(x);
  if (!held || !P.mem?.hold) return ev;
  let y = x;
  for (const s of ev.gws) {
    // the solve's lineup for that squad: your plan's own road first (the solver's, memory's), then a bundle road's
    // (reviewer 1 of solversquad, 2026-10-26: a heal's lineups were the xP order's here, never the pitch's)
    const lu = s.gw >= from && P.gws.includes(s.gw) && !weekOf(P, s.gw)?.lineup ? solvedLineup({ base: P.road }, s.gw, s.squad, s.chip ?? null) ?? solvedLineup(inputs(ctx).roads, s.gw, s.squad, s.chip ?? null) : null;
    if (lu) y = E.setLineup(y, s.gw, lu);
  }
  return y === x ? ev : run(y);
}
/** Your plan from GW g as asTaken plays it: what a plan's number counts against (plansOf, its Why sheet); `held`
 *  false: in the xP order (asTaken's). Once per plan view, GW and order. */
const PLAN_BASE = new WeakMap();
export function planBaseline(ctx, P, g, held = true) {
  let m = PLAN_BASE.get(P);
  if (!m) PLAN_BASE.set(P, (m = new Map()));
  const k = `${g}:${held}`;
  if (!m.has(k)) m.set(k, asTaken(ctx, P, draftOf(ctx), g, {}, held));
  return m.get(k);
}
/** asTaken as addMove's `measure` (review 5, 2026-10-12: your transfer rows, Add a player's pills and Replace
 *  priced a buy with estimate, which drops your saved lineups, so after a sub their number beat what the tap gave): a
 *  single move measured as the plan rows are, against planBaseline. */
export const takenBy = (ctx, P) => (d, from) => asTaken(ctx, P, d, from);

/** A plan from GW g measured as taking it makes it (asTaken: best XI each week but where you saved a lineup, or under
 *  the hold its solve's, `held`; its hits counted) against your plan `before` (planBaseline(g) of the same `held`): {…p, ev, cmp, hits: {gw: FPL hits it brings there}} | null (it
 *  doesn't fit: problemOf). */
function measurePlan(ctx, P, g, p, before, held = true) {
  const ev = asTaken(ctx, P, p.draft, g, {}, held);
  if (problemOf(ctx, ev, g)) return null;
  const hitsAt = (e, x) => e.gws.find((s) => s.gw === x)?.hits ?? 0;
  const hits = Object.fromEntries(P.gws.map((x) => [x, Math.max(0, hitsAt(ev, x) - hitsAt(before, x))]).filter(([, n]) => n > 0));
  return { ...p, ev, cmp: compare(ctx, ev, before), hits };
}

/** The solve of GW g's choice c ({moves, chips}) with Forkcast's best plan after it, on your plan as it stands (the
 *  user, 2026-10-11: what to do after Tavernier → Dewsbury-Hall, not the best of the plans that happened to be baked;
 *  decision 6: your transfers in other weeks kept, Forkcast planning the rest around them): your pins; each week before
 *  g held to your plan's squad (M3: a Wildcard's, a Free Hit's and a week Forkcast plans under a hits rule of yours
 *  too, so the solve's weeks before g are yours and planOfRoad keeps it); your GW-g transfers (and a hits rule there:
 *  the week makes exactly the choice's moves) giving way to c's moves as your exact transfers (memory.pinSell) or its
 *  chip (chipEdit); each week after g the planner's up to the bake's cap (You → Hits below it bounds it:
 *  memory's derived 'hits' pin, composed last), or an older plan's hits rule's there (a hits rule lifts the hold there:
 *  memory.holdOf), your exact transfers there kept (their rules stay: composePins' B36), as the suggested plan plans.
 *  A transfer of yours that bought a player its GW-g moves sell (or `c.ends`'s: the roll a row that sells him counts
 *  against, plansOf) held only to g − 1, as its + leaves it (chainOf); `c.held`: your later weeks kept (a Wildcard
 *  row's roll). → solve values */
export function forkValues(ctx, P, g, c) {
  const squad = SQUAD_CHIPS.has(c.chips?.[g]);
  const drop = [...new Set((weekOf(P, g)?.moves || []).map((m) => pinOfMove(P, { ...m, gw: g })?.id).filter(Boolean))];
  if (!squad && repicks(P, g)) drop.push(...P.pins.filter((p) => p.id === `hits:${g}`).map((p) => p.id));
  const held = P.gws.filter((x) => x < g).flatMap((x) => (weekOf(P, x)?.squad ?? []).map((id) => [id, x, x]));
  const extra = held.length ? [makePin({ id: 'fork:before', kind: 'road', label: 'Your weeks before', gw: P.A, must: held })] : [];
  // GW g is exactly the choice in both modes (a Roll capping it at the choice's moves, as the + stores it: addPlan): under
  // the hold the derived hold caps it so already; while Forkcast makes your transfers nothing else would, and the solve
  // would add its own GW-g moves (the user, 2026-10-13: "Same list, both modes"; "Lock it, both modes")
  if (!squad) {
    const now = c.moves.filter((m) => m.gw === g);
    extra.push(...chainOf(P, g, c.ends ?? now).chain.values(), ...now.map((m) => pinSell(m.out, g, P.end, { in: m.in })), pinRoll(g, now.length));
  }
  for (const [x, chip] of Object.entries(c.chips || {})) { const e = chipEdit(P, Number(x), chip); extra.push(...e.pins); drop.push(...e.drop); }
  // your Wildcard or Free Hit there, a choice that plays none: taken off as chipOff takes it (chipBackOf)
  if (chipBackOf(P, g, c)) { const o = chipOffParts(P, g, { locked: true }); extra.push(...o.pins); drop.push(...o.drop); }
  const cap = hitCap(P.b?.meta) ?? 2;
  // a later week with a hits rule of yours keeps it (review 5, 2026-10-12: the bake's cap had the same id, so it
  // replaced "FT only" in the fork's solve and the + took it back)
  const ruled = (y) => P.pins.some((p) => p.id === `hits:${y}`);
  // (none for a Wildcard under the hold: its squad lasts, so it is solved with your later weeks as they are, the squad
  // the + gets: review 6, 2026-10-13, a squad chosen for Forkcast's later moves listed one number and took another; nor
  // for the roll it counts against, `held`: like with like, plansOf)
  const follow = !(P.mem?.hold && (c.chips?.[g] === 'wc' || c.held));
  if (follow) for (const x of P.gws.filter((y) => y > g && !SQUAD_CHIPS.has(c.chips?.[y]) && !squadWeek(weekOf(P, y)) && !ruled(y))) extra.push(pinHits(cap, x));
  // a transfer choice's solve commits its own week only (`to`; the owner, 2026-10-28, "Choices: own week only"): its
  // number is the solver's count over GW g's window (calls.counted), which the later weeks' windows never change, and
  // its later weeks are your plan's (planOfRoad); a chip's solve and a roll's stay whole (a Free Hit's number is
  // counted on the roll plan's later weeks, chipOn; Chips… counts a chip's)
  const v = valuesFor(ctx, extra, drop);
  return Object.keys(c.chips || {}).length || !c.moves?.length ? v : { ...v, to: g };
}

// (the newest FORK_ROADS_MAX by their last use, keepNewest: a week drawn before an edit asked its solves first, and an
// Undo back to it needs them all again; the phone recheck of the first-use proposals, 2026-10-21)
const FORK_ROADS = new Map();  // valuesKey → Road | 'infeasible' | {failedAt}
const FORK_ROADS_MAX = 48;
/** A fork's solve ({key: valuesKey, values}): its road, 'infeasible' (no plan keeps your rules with the choice: kept
 *  for the forecast), 'error' (it failed, or no solve service / offline: the road plans stand), or null while it is
 *  asked (forkPump). A failure is asked again PAIR_HOLD_MS after it (review 5, 2026-10-12: a failed check stayed dead
 *  until your plan changed), the choices re-drawn then. */
function forkAsk(ctx, P, ask) {
  const { key } = ask;
  const got = FORK_ROADS.get(key);
  if (got?.failedAt != null) {
    const left = got.failedAt + PAIR_HOLD_MS - Date.now();
    if (left > 0) { forkAgain(ctx, left); return 'error'; }
    FORK_ROADS.delete(key);
  } else if (got) return keepNewest(FORK_ROADS, key, got, FORK_ROADS_MAX);
  if (!ctx.api?.solve || ctx.store.get('conn')?.state === 'offline') return 'error';
  forkPump(ctx, P, ask);
  return null;
}
/** …as solved so far, never asked (plansOf's peek): its road, 'infeasible', 'error' (failed), or null (not solved). */
const forkRead = (key) => { const got = FORK_ROADS.get(key); return got?.failedAt != null ? 'error' : got ?? null; };
/** The on-screen solves, the suggested plans' forks (purpose 'pair': the plan service queues them above every prefetch, chip
 *  preparation and bake, jobs.VIEWED): lane 0 is PAIR.flight, in the speculative slot; a fork's ask also goes in lanes
 *  1.. up to the bundle's meta.pair_lanes (api/mobile.py PAIR_LANES; one at a time without it), each a slot of its own
 *  the service holds beside it, so a week's suggested plans solve side by side (measured 2026-10-11 on 3 solver slots:
 *  6 forks one at a time 47-55 s). A landing re-draws the choices (pairChanged), which asks the next; your plan's heal goes
 *  first (its landing re-draws them); a sheet's solve keeps the speculative slot and every lane waits for it
 *  (api.whenFree); a refused or cancelled ask waits (PAIR.until), then their draw asks again. A fork the view no longer
 *  asks is let go (plansOf: L5). The next week's preparation (prepNext: `ask.prep`, purpose 'pairnext') takes only
 *  what the viewed week leaves: lanes 1.. that are free, lane 0 only with the speculative slot free and no chip
 *  preparation waiting (prepsWaiting), never beside a Wish or options solve, its own pause (PAIR.prepUntil) so a refused
 *  one never holds the viewed week's; a viewed ask finding every lane busy takes one from another week's flight, and
 *  one of a solve a preparation has in flight joins it: asked again in its lane as 'pair', the plan service's job in
 *  flight raised to VIEWED (api/mobile.py _ensure_solve, jobs.raise_priority), never solved twice. */
const FORK_FLIGHTS = new Map();  // lane (1..) → {key, fork, cancel, gw, P, prep}
/** Every fork solve in flight as [lane, flight]: lane 0 while a fork holds PAIR.flight, then lanes 1.. */
const forkFlights = () => [...(PAIR.flight?.fork ? [[0, PAIR.flight]] : []), ...FORK_FLIGHTS];
function forkPump(ctx, P, ask) {
  const prep = !!ask.prep;
  const same = forkFlights().find(([, f]) => f.key === ask.key);
  if (same && (prep || !same[1].prep)) return;
  if (P.healing) return;  // L4: no timer: the heal's landing re-draws the choices, which asks at once
  if (leftBehind(ctx, P)) return;  // no timer: the new plan's bundle re-draws the choices, which asks its own
  const holder = ctx.api.slotHolder?.('spec') ?? (ctx.api.slotBusy?.('spec') ? 'busy' : null);
  const free = Array.from({ length: (P.b?.meta?.pair_lanes ?? 1) - 1 }, (_, i) => i + 1).find((i) => !FORK_FLIGHTS.has(i));
  // (a viewed ask with every lane busy: another week's flight, the next week's preparation, or a tap's solve asked ahead
  // gives its lane up)
  const other = !same && !prep && PAIR.flight && free === undefined ? forkFlights().find(([, f]) => (f.gw !== ask.gw || f.ahead) && !aheadWaited(f)) : null;
  // (a tap's solve asked ahead with every lane busy: the next week's preparation gives its lane up, asked again once
  // the taps' are in: prepNext; then one asked ahead that no source asks any more (its rules replaced, the next draw
  // would let it go: L5); for an open sheet's, a week's tap asked ahead too: the sheet
  // covers its plates, and a tap in the sheet makes another plan view, whose own week's are asked then)
  const yielded = !same && ask.ahead && free === undefined
    ? forkFlights().find(([, f]) => f.prep && !f.ahead) ?? forkFlights().find(([, f]) => f.ahead && !aheadWaited(f) && !aheadAsks(f, P, ask.gw))
      ?? (ask.src === 'sheet' ? forkFlights().find(([, f]) => f.ahead && f.src === 'week' && !aheadWaited(f)) : null) ?? null : null;
  const lane = same ? same[0] : prep ? free ?? (!PAIR.flight && !holder && !prepsWaiting(ctx, P) ? 0 : yielded?.[0])
    : !PAIR.flight ? 0 : free ?? other?.[0];
  if (lane === undefined) return;  // every lane busy: a landing re-draws the choices, which asks again
  if (holder && !(prep ? PREP_BESIDE : PAIR_TAKES).has(holder)) {
    const f = ctx.api.whenFree?.('spec');
    if (f) f.then(() => forkAgain(ctx, 0)); else forkAgain(ctx, PAIR_AGAIN_MS);
    return;
  }
  const pause = prep ? 'prepUntil' : 'until';
  const wait = Math.max(0, PAIR.until - Date.now(), prep ? PAIR.prepUntil - Date.now() : 0);
  if (wait > 0) { forkAgain(ctx, wait); return; }
  if (other) other[1].cancel?.();
  if (yielded && yielded[0] === lane) yielded[1].cancel?.();
  const flight = { key: ask.key, fork: true, cancel: null, gw: ask.gw, P, prep, ahead: !!ask.ahead, src: ask.src ?? null };
  if (lane) FORK_FLIGHTS.set(lane, flight); else PAIR.flight = flight;
  const ours = () => (lane ? FORK_FLIGHTS.get(lane) : PAIR.flight) === flight;
  const purpose = ask.ahead ? 'presolve' : prep ? 'pairnext' : 'pair';
  if (ask.ahead) AHEAD.asked.push({ at: Date.now(), key: ask.key, src: ask.src });
  const p = solveKept(ctx.api, { entry: Number(P.entry), purpose, values: ask.values, ...(lane ? { lane } : {}) }, lane ? { slot: `fork${lane}` } : undefined);
  flight.cancel = () => p.cancel?.();
  p.then((res) => {
      // a tap's solve asked ahead: its answer memory's for exactly those values (presolve); one that failed for another
      // reason than your rules is never asked again on this page (no cost: the tap heals as before)
      if (ask.ahead && (res.road || res.state === 'error')) {
        // (kept for the data version the plan service solved it on, never the one the view was drawn on: the review of
        // presolve, 2026-10-26, an older code's roads served while it solved on the newer; none told, none kept)
        if (res.version != null) memOf(ctx).offer(res.road, { values: ask.values, error: res.error, version: res.version });
        // (one that can't be kept, an error not your rules' or no version told, is never asked again on this page)
        if (res.version == null || (!res.road && res.error?.code !== 'infeasible')) AHEAD.failed.add(ask.key);
      } else if (res.road || res.state === 'error') {
        keepNewest(FORK_ROADS, ask.key, res.road ?? (res.error?.code === 'infeasible' ? 'infeasible' : { failedAt: Date.now() }), FORK_ROADS_MAX);
      } else if (ours() && res.state === 'cancelled') {
        // (one the plan service dropped for another's room, never let go here: asked once more after the pause, then never
        // again on this page, no churn)
        if (ask.ahead && (AHEAD.dropped.set(ask.key, (AHEAD.dropped.get(ask.key) ?? 0) + 1).get(ask.key)) > 1) AHEAD.failed.add(ask.key);
        else PAIR[pause] = Date.now() + PAIR_AGAIN_MS;
      }
    }, () => { if (ours()) PAIR[pause] = Date.now() + PAIR_HOLD_MS; })
    .finally(() => {
      if (!ours()) return;
      if (lane) FORK_FLIGHTS.delete(lane); else PAIR.flight = null;
      // (a solve asked ahead changes nothing drawn: the next one asked in its lane, the choices re-drawn only once none
      // is left, so the next week's preparation takes the lane: prepNext)
      if (!ask.ahead || !pumpAhead(ctx)) pairChanged(ctx);
    });
}
/** The block re-drawn in `ms` (one timer), so its plans ask their next solve. */
let FORK_TIMER = null;
function forkAgain(ctx, ms) {
  if (FORK_TIMER) return;
  FORK_TIMER = setTimeout(() => { FORK_TIMER = null; if (attach()?.ctx === ctx) pairChanged(ctx); }, ms);
}
/** The fork solves' state (flights, landed roads, the pause, the retry timer) cleared: between the node tests
 *  (memory.test.mjs), where a solve one test's shell never answers would hold a lane the next test asks. */
export function resetForks() {
  for (const [, f] of forkFlights()) f.cancel?.();
  FORK_FLIGHTS.clear();
  PAIR.flight = null;
  PAIR.until = PAIR.prepUntil = 0;
  clearTimeout(FORK_TIMER);
  FORK_TIMER = null;
  FORK_ROADS.clear();
  AHEAD.srcs.clear();
  AHEAD.failed.clear();
  AHEAD.at = null;
  AHEAD.asked = [];
  AHEAD.dropped.clear();
}

// ---------------------------------------------------------------- a tap's solve asked before the tap
/**
 * The owner, 2026-10-26 (once every squad drawn was the solver's, solversquad: a take went 0.4 s → 1.5 s, a Remove 0.4 →
 * 2.5 s): "fix speed so all pre solved and done without no cost". A tap that changes your plan lands at once on the
 * solver's plan for its rules, because that solve was asked before the tap: its edit made dry (dryEdit: the very edit
 * function the tap calls, edit recording the rules it would make, nothing changed, nothing said), the values its heal
 * would send (memory.values with the edit's own order and You → Hits), asked in the fork lanes the view leaves free at
 * the lowest priority (forkPump's `prep` way, purpose 'presolve': the plan service's SPECULATIVE, unmetered, pre-empted
 * by any solve someone waits on, joined by the tap's heal while in flight), its answer offered to memory for exactly those
 * values (memory.offer `values`): the tap's heal finds it (memory.replan) and lands it with no wait, the same request's
 * answer, said as that heal's verdict (landNow); a heal of those values already waiting takes it as it lands.
 * Asked, most likely first, at most PRESOLVE_MAX a source (each solve a plan's worth of the solver's time: the bound,
 * presolve_report.md), an open sheet's before the week's (its buttons are what a tap can reach while it is up):
 *  · 'week' (presolveWeek): a Remove of your rules (that week's first) once the view is drawn, then, once its choices
 *    are settled, the takes of the week's best and the next lit plate (those that pay, by their number);
 *  · 'sheet', when a sheet opens and as it re-draws (presolveTaps: a Why sheet's Take, Remove, Keep, Not and Move to
 *    GWn; a player's Keep, Not, Never and Off; the Sell list's Let Forkcast choose and first rows; Bring in's weeks;
 *    Chips…'s play and off; You → Hits and Reset plan; the Week sheet's other takes and Removes), until it closes.
 * An Undo needs none: memory offers the plan it replaces (replan) and the snapshot keeps it (restore).
 * Never asked while your plan heals or the bundle is behind; a source is made again for each plan view (a view for the
 * same rules asks the same solves: its flights go on), and a flight no source asks is let go (plansOf's L5: the rules
 * changed, the week left), as is every one when the page is hidden (stopAhead), but the one the heal of your rules
 * waits on (aheadWaited).
 */
const PRESOLVE_MAX = { week: { take: 2, remove: 1 }, sheet: 3 };
// and at most PRESOLVE_RATE solves (distinct) asked a minute on a page, the week's at most its share, so an open
// sheet's taps (the likelier) always have room (the review of presolve, 2026-10-26: a sheet opened and closed again and
// again, a search typed in the Sell list, each made its taps' solves again, unbounded)
const PRESOLVE_RATE = { all: 30, week: 16 }, PRESOLVE_WINDOW_MS = 60000;
// the tap's edit made dry (dryEdit): {got} while one is, edit's args then
let DRY = null;
// srcs: 'week' | 'sheet' → {P, gw, sig, owner, asks: [ask], made: [ask], tried: Set(tap id)}; failed: keys whose solve
// failed (not your rules'); at: the viewed week {P, g} (plansOf); ctx: the page's (stopAhead, aheadWaited)
const AHEAD = { srcs: new Map(), failed: new Set(), at: null, ctx: null, watching: false, asked: [], dropped: new Map() };

/** The rules tap `run` (an edit function's call: addPlan, removeRule, keep…) would make, made dry → edit's args
 *  {pins, drop, inPlace, hitsMax, was} | null (it changes nothing, or is refused: no solve to ask). */
function dryEdit(run) {
  const was = DRY, mine = (DRY = { got: null });
  try { return run() ? mine.got : null; } catch (e) { console.warn('Forkcast: a tap made dry', e); return null; } finally { DRY = was; }
}

/** Tap t ({kind, gw, run} | {kind: 'reset'}) as the solve its heal would ask on plan view P: {key, values, version, gw,
 *  kind, src, prep, ahead} | null. Reset plan is no edit: your rules all off and You → Hits back to the solver's own
 *  (memory.reset). */
function askOf(ctx, P, t, src) {
  const a = t.kind === 'reset' ? { pins: [], drop: P.pins.filter((p) => !derivedPin(p)).map((p) => p.id), hitsMax: null } : dryEdit(t.run);
  if (!a) return null;
  let values;
  try {
    values = memOf(ctx).values({ extra: a.pins, drop: a.drop, hitsMax: a.hitsMax, order: a.inPlace ? (list) => inPlaceOf(list, a.inPlace, a.was) : null });
  } catch { return null; }
  return { key: valuesKey(P, values), values, gw: t.gw ?? P.A, kind: t.kind, src, prep: true, ahead: true };
}

/** Source `src`'s taps (most likely first) on plan view P: the first PRESOLVE_MAX[src] that make a solve asked, those
 *  memory has (memory.solved) or that failed not again. `sig`: what the taps were made from (once per it). */
function presolve(ctx, P, src, taps, { gw = P.A, sig = '', owner = null } = {}) {
  // (none from inside a tap made dry: a draw it reads settling)
  if (DRY || !ctx.api?.solve || ctx.store.get('conn')?.state === 'offline') return;
  watchPage(ctx);
  let cur = AHEAD.srcs.get(src);
  // the same view's taps with ids (the week's: a take's choice, a Remove's rule) add to what it asked as more are ready,
  // each made dry once (tried); another's are asked afresh
  const grows = taps.every((t) => t.id != null);
  if (!(cur?.P === P && cur.gw === gw && cur.owner === owner && (cur.sig === sig || grows))) AHEAD.srcs.set(src, (cur = { P, gw, sig: null, owner, asks: [], made: [], tried: new Set() }));
  if (cur.sig !== sig) {
    cur.sig = sig;
    // (none another source asks, nor one memory has: a sheet's taps besides the week's)
    const others = [...AHEAD.srcs].filter(([k, x]) => k !== src && x.P === P).flatMap(([, x]) => x.asks.map((a) => a.key));
    const cap = PRESOLVE_MAX[src], room = (kind) => (typeof cap === 'number' ? cur.asks.length < cap : cur.asks.filter((a) => a.kind === kind).length < (cap[kind] ?? 0));
    for (const t0 of taps) {
      const t = typeof t0 === 'function' ? t0() : t0;
      if (!room(t.kind) || (t.id != null && cur.tried.has(t.id))) continue;
      if (t.id != null) cur.tried.add(t.id);
      const a = askOf(ctx, P, t, src);
      if (a) cur.made.push(a);  // (every tap's, asked here or not: presolveTaps)
      if (a && !cur.asks.some((x) => x.key === a.key) && !others.includes(a.key) && !memOf(ctx).solved(a.values)) cur.asks.push({ ...a, pri: t.pri ?? cur.asks.length });
    }
    cur.asks.sort((x, y) => x.pri - y.pri);
  }
  pumpAhead(ctx);
}

/** GW g's taps on plan view P (`list`: its choices, plansOf's): its ready choices' takes (addPlan), those that pay first
 *  by their number (the week's best, the lit plates: litShown's), and the Removes of your rules (removeRule: that week's
 *  first, the newest first). → {takes, removes, sig} */
function weekTaps(ctx, P, g, list) {
  const ready = list.filter((pl) => pl.state === 'ready' && !pl.self && !rollOnly(pl) && !pl.removed)
    .sort((a, b) => plPays(b) - plPays(a) || b.cmp.delta - a.cmp.delta);
  // (`pri`: the order they are asked in, the takes first by their number; `id`: one tap of the view's, made dry once)
  const takes = ready.map((pl, i) => ({ kind: 'take', gw: g, id: `take:${forkKey(pl.choice, g)}`, pri: i, run: () => addPlan(ctx, g, pl) }));
  const rules = rulesOf(P).filter((p) => ruleOf(P, p).removable);
  const removes = [...rules.filter((p) => num(p.gw) === g), ...rules.filter((p) => num(p.gw) !== g)]
    .map((p, i) => ({ kind: 'remove', gw: g, id: `rm:${p.id}`, pri: 100 + i, run: () => removeRule(ctx, p.id) }));
  return { takes, removes, sig: `${ready.map((pl) => forkKey(pl.choice, g)).join(';')}|${rules.map((p) => p.id).join(',')}` };
}
/** The viewed week's taps (weekTaps), asked in the fork lanes its own checks leave free: a Remove of your rules at
 *  once, and once its choices are settled (the week's best and its lit plates known: litOf) its first takes
 *  (PRESOLVE_MAX). */
function presolveWeek(ctx, P, g, list) {
  if (P.healing || leftBehind(ctx, P) || inkAt(ctx, P, g)) return;
  const { takes, removes, sig } = weekTaps(ctx, P, g, list);
  const settled = settledList(list);
  presolve(ctx, P, 'week', [...(settled ? takes : []), ...removes], { gw: g, sig: `${settled}|${sig}` });
}

/** An open sheet's taps, asked ahead while it is open (presolve 'sheet'): each {kind, gw, run} (or a function making
 *  one, made only if its turn comes), most likely first; none (`taps` null) when it closes. `owner`: the sheet (its
 *  closing stops its own taps only, never a sheet's opened over it). → each tap's solve ({key, values, kind, …}: asked
 *  here, or already by the week's own taps or memory's) */
export function presolveTaps(ctx, taps, { gw = null, sig = '', owner = null } = {}) {
  const P = plan(ctx);
  if (!taps || !P) {
    if (!owner || AHEAD.srcs.get('sheet')?.owner === owner) stopAhead('sheet');
    return [];
  }
  if (P.healing || leftBehind(ctx, P)) return [];
  presolve(ctx, P, 'sheet', taps, { gw: gw ?? P.A, sig, owner });
  return AHEAD.srcs.get('sheet')?.made ?? [];
}

/** Ask the next solves of the sources, an open sheet's first, each in its order (forkPump: in a lane the view leaves
 *  free) → whether any is still to land. A source of another plan view asks nothing (the view's own draw replaces it: presolve); the week's
 *  waits while another week is viewed. */
function pumpAhead(ctx) {
  const P = plan(ctx), mem = memOf(ctx);
  if (!P || P.healing || leftBehind(ctx, P)) return false;
  let left = false;
  // (an open sheet's first: while it is up its buttons are what a tap can reach, the plates under it)
  for (const src of ['sheet', 'week']) {
    const s = AHEAD.srcs.get(src);
    if (!s || s.P !== P) continue;
    if (src === 'week' && (AHEAD.at?.P !== P || AHEAD.at.g !== s.gw)) continue;
    for (const a of s.asks) {
      if (AHEAD.failed.has(a.key) || mem.solved(a.values)) continue;
      left = true;
      if (forkFlights().some(([, f]) => f.key === a.key)) continue;
      // (PRESOLVE_RATE a minute: the rest waits for the window to move on, a re-draw then asks it; one asked again, an
      // Undo back to its rules, counts once)
      const now = Date.now();
      AHEAD.asked = AHEAD.asked.filter((x) => x.at > now - PRESOLVE_WINDOW_MS);
      const keys = (s0) => new Set(AHEAD.asked.filter((x) => !s0 || x.src === s0).map((x) => x.key));
      const again = keys().has(a.key);
      if (!again && (keys().size >= PRESOLVE_RATE.all || (src === 'week' && keys('week').size >= PRESOLVE_RATE.week))) {
        forkAgain(ctx, AHEAD.asked[0].at + PRESOLVE_WINDOW_MS - now);
        continue;
      }
      forkPump(ctx, P, a);
    }
  }
  return left;
}

/** Whether fork flight f is a solve asked ahead that a source of plan view P still asks for week g, or the one the heal
 *  of your rules now waits on (a tap made from a sheet that then closed, or whose plan view went: tapped before its
 *  solve landed, the heal joins it in flight at its own priority, api/mobile.py _ensure_solve, and memory takes its
 *  answer as it lands: offer; letting it go would cancel the job under the heal, the plan service's DELETE releasing
 *  every slot of this browser's) → plansOf's L5 and stopAhead keep it. */
const aheadAsks = (f, P, g) => {
  if (!f.ahead) return false;
  if (aheadWaited(f)) return true;
  // (by its key, not its plan view's object: a view drawn anew for the same rules asks the same solves, and one for
  // other rules replaces the source before the next draw lets the flight go)
  const s = AHEAD.srcs.get(f.src);
  return !!s && s.P.entry === P.entry && s.P.A === P.A && (f.src !== 'week' || s.gw === g) && s.asks.some((a) => a.key === f.key);
};
/** Fork flight f is the solve asked ahead your rules' heal waits on (memory's pending heal of those values). */
const aheadWaited = (f) => !!f.ahead && !!AHEAD.ctx && memOf(AHEAD.ctx)?.getPlan().pending?.ahead === f.key;

/** The solves asked ahead of source `src` (every source: null) let go, its taps forgotten. */
function stopAhead(src = null) {
  for (const k of src ? [src] : [...AHEAD.srcs.keys()]) AHEAD.srcs.delete(k);
  let gone = 0;
  for (const [lane, f] of forkFlights()) {
    if (!f.ahead || (src && f.src !== src) || aheadWaited(f)) continue;
    f.cancel?.();
    if (lane) FORK_FLIGHTS.delete(lane); else PAIR.flight = null;
    gone++;
  }
  // (their lanes free: the choices re-drawn, so the next week's preparation a sheet's tap took a lane from asks again)
  if (gone && AHEAD.ctx && attach()?.ctx === AHEAD.ctx) forkAgain(AHEAD.ctx, 0);
}

/** The page hidden: every solve asked ahead let go; shown again, the choices re-drawn, which asks them again. */
function watchPage(ctx) {
  AHEAD.ctx = ctx;
  if (AHEAD.watching || typeof document === 'undefined' || !document.addEventListener) return;
  AHEAD.watching = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stopAhead();
    else if (AHEAD.ctx && attach()?.ctx === AHEAD.ctx) pairChanged(AHEAD.ctx);
  });
}

/** GW g's free transfers all used by your plan (its transfers there at least its FTs): another move
 *  there is an extra one, −4 each. suggestionsOf's moves (plansOf's one-move choices) are then each measured after its
 *  hit, losers too. In a week Forkcast re-picks (repicks) only your transfers count: its own there give
 *  way to another of yours (addYours; the checker, 2026-10-09: GW8 on "FT only" counted Forkcast's three as yours, and
 *  the tap took no hit and swapped one of them out). */
/** GW w a week your plan leaves short of money (the owner, 2026-10-28: "make it to add player even with negative itb like
 *  official fpl allow"): under the hold your transfers there take its bank below 0 (memory.holdOf's debts: a draft, as
 *  FPL holds one until it is confirmed). plansOf offers Forkcast's way to pay it back (owedRoad), and the week's best is
 *  a choice that does (litCan: paysBack). Pure. */
export const owedAt = (P, w) => !!P?.mem?.hold && !!w?.moves?.length && w.bank != null && w.bank < -1e-9;
/** Choice pl keeps your every transfer of GW w and leaves its bank at 0 or more (owedAt's week): its solve's bank, else
 *  its plan's as measured. Pure. */
const paysBack = (w, pl) => {
  const g = w.gw;
  const keeps = w.moves.every((m) => pl.choice.moves.some((x) => x.gw === g && x.out === m.out && x.in === m.in));
  const bank = num((pl.road?.weeks || []).find((x) => Number(x.gw) === g)?.bank) ?? pl.ev?.gws.find((s) => s.gw === g)?.bank;
  return keeps && bank != null && bank >= -1e-9;
};
/** owedAt's GW g: your plan solved with that week the planner's (a hits rule there lifts the hold, memory.holdOf: it
 *  keeps your transfers and pays for them, its bank never below 0), asked as a fork is (forkAsk; read only when `peek`)
 *  → {key, road: its road once solved, else null}. Its moves on top of yours are the week's choices (plansOf). */
function owedRoad(ctx, P, g, { peek = false, prep = false } = {}) {
  const values = valuesFor(ctx, [pinHits(hitCap(P.b?.meta) ?? 2, g)]);
  const key = valuesKey(P, values);
  const got = peek ? forkRead(key) : forkAsk(ctx, P, { key, values, gw: g, ...(prep ? { prep } : {}) });
  return { key, road: got?.weeks ? got : null };
}

export function extraWeek(P, g) {
  const w = weekOf(P, g);
  if (!w || squadWeek(w)) return false;
  const n = repicks(P, g) ? w.moves.filter((m) => pinOfMove(P, m)).length : w.moves.length;
  return n > 0 && n >= Math.max(0, w.ft ?? 1);
}

/** GW g is a week Forkcast plans itself (gwMode not 'roll'; never a Wildcard or Free Hit week): it picks its own
 *  transfers there again at each solve, so they give way to one of yours (addYours) and never count as yours
 *  (extraWeek). Under the hold one the hold leaves to the planner (memory.holdOf: another ask of yours moves someone
 *  there); off it every week but one a Roll locks (a plan's +; the review, 2026-10-13: "Same list, both modes" stacked
 *  each single move on Forkcast's own with a −4). */
export function repicks(P, g) {
  const w = weekOf(P, g);
  return !!w && !squadWeek(w) && gwMode(P, g) !== 'roll';
}

/**
 * Your sale of `out` for `inn` in GW g added to your plan (addMove on draftOf) as the plan then makes it: each week from
 * g on that Forkcast re-picks (repicks) where it would bring a hit (the move there, or the free transfer it no longer
 * rolls into it) has one of Forkcast's own transfers there give way instead (each dropped in turn: a free transfer
 * back), the legal one with the most points; the hit stays a choice only while that week's cap allows it (gwMode: none
 * under 'free', at most n under 'h<n>', else the solver's own cap). → addMove's {draft, ev, problem} and `instead` (the first transfer of Forkcast's it replaces,
 * {gw, out, in} | null). A suggestion's number (suggestionsOf), its Why and When line, and the sale you make (sellFrom)
 * are measured so. d0: draftOf (passed in a loop); measure: addMove's.
 */
export function addYours(ctx, P, g, out, inn, d0 = draftOf(ctx), measure = null) {
  let r = { ...addMove(ctx, d0, g, out, inn, measure), instead: null };
  const before = baseline(ctx, g);
  const hitsAt = (ev, x) => ev.gws.find((s) => s.gw === x)?.hits ?? 0;
  for (const x of P.gws.filter((y) => y >= g && repicks(P, y))) {
    if (hitsAt(r.ev, x) <= hitsAt(before, x)) continue;
    const mode = gwMode(P, x);
    const room = mode === 'free' ? 0 : mode.startsWith('h') ? Number(mode.slice(1)) : hitCap(P.b?.meta) ?? Infinity;
    const drops = new Map();
    for (const m of weekOf(P, x).moves.filter((y) => !pinOfMove(P, { ...y, gw: x }) && (x !== g || y.out !== out))) {
      const dm = flatMoves(r.draft).find((y) => y.gw === x && y.out === m.out && y.in === m.in);
      if (dm) drops.set(dropMove(r.draft, dm), { gw: x, out: m.out, in: m.in });
    }
    const best = bestOf(ctx, [...(hitsAt(r.ev, x) <= room ? [r.draft] : []), ...drops.keys()], g, measure);
    if (best) r = { ...best, instead: r.instead ?? drops.get(best.draft) ?? null };
  }
  return r;
}

/**
 * Your transfer's other buys, for its Why sheet's grid and the week's suggested plans (xferRow, plansOf: the best two
 * each; the user, 2026-10-08: "Scott → Groß +5.3 · Schade +5.3 ·
 * E.Le Fée +5.2"): the same sale in the same GW with another buy, from the suggestions' source (the model's buys for him
 * on the bundle's roads, modelMoves: the row the suggestion had before you added it) and Replace's (the best of his
 * position your rules allow that the week's money pays for: buyCandidates) where one gains more than your buy (or, when
 * the model has none for him, Replace's best OWN_ALTS_ALONE), each measured as your row is (rowGains: the week's moves
 * before it and this sale with that buy, against those moves alone; a hit counted), only those the swap can make
 * (addMove: the plan as it stands, its bank and club limit) and none your plan moves from GW g on (movedFrom: a later
 * buy of yours voided unsaid), best first (those inside the noise of the best cheaper first: cheaperFirst), at most
 * OWN_ALTS; `all` (a place you opened: plansOf's placesAsked) every one Replace's tries find, worse ones too. None in a Wildcard / Free Hit week, for a funding sale or the buy it pays for (their money ties them), or for a move no sale
 * of yours makes. A suggested move the week doesn't make yet (suggestionsOf's: the user, 2026-10-21, "never suggest saka
 * to rice as alternative here", Saka's place listing Palmer alone until Saka → Palmer was taken) has the list it will
 * have once taken: measured as its row will be (your plan with it added, the week's last, against your plan), its money
 * the week's bank then. Once per plan view and move. → [{out, in, cmp}]
 */
export const OWN_ALTS = 6;
const OWN_ALT_TRIES = 12;   // Replace's best few of his position that fit (buyCandidates' order: mean xP)
const OWN_ALTS_ALONE = 3;   // …shown when the model has no other buy for him (a buy you chose yourself)
const OWNALTS = new WeakMap();
export function ownAltsOf(ctx, P, w, m, all = false) {
  const g = w?.gw;
  const made = !!w?.moves.some((x) => x.out === m.out && x.in === m.in);
  if (!w || isFrozen(P, g) || squadWeek(w) || (made ? pinOfMove(P, m)?.kind !== 'sell' || fundingOf(P, g, m) : !w.squad.includes(m.out) || w.squad.includes(m.in))) return [];
  let by = OWNALTS.get(P);
  if (!by) OWNALTS.set(P, (by = new Map()));
  const key = `${g}:${m.out}>${m.in}${all ? ':all' : ''}`;
  if (by.has(key)) return by.get(key);
  const d0 = draftOf(ctx);
  // the plan as the row measures it (`d`: the week's moves up to this one, its later ones dropped, last first; `cut`
  // when some are), against those before it (rowGains); a suggestion's, your plan with it added against your plan
  let rg = null, d = d0, bank = w.bank ?? 0;
  if (made) {
    rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const ms = movesInOrder(P, w);
    const k = ms.findIndex((x) => x.out === m.out && x.in === m.in);
    for (let j = ms.length - 1; j > k; j--) d = dropMove(d, flatMoves(d).find((x) => x.gw === g && x.out === ms[j].out) ?? { gw: g, ...ms[j] });
  } else {
    const r = addMove(ctx, d0, g, m.out, m.in, takenBy(ctx, P)), without = planBaseline(ctx, P, g);
    if (!r.problem) { rg = { cmp: compare(ctx, r.ev, without), without }; d = r.draft; bank = r.ev.gws.find((s) => s.gw === g)?.bank ?? 0; }
  }
  const cut = made && d !== d0;
  let list = [];
  if (rg) {
    const no = barred(P, g);
    const mine = movedFrom(P, g);
    const measure = (ids) => ids.flatMap((id) => {
      if (id === m.in || w.squad.includes(id) || mine.has(id) || no.has(id)) return [];
      const r = addMove(ctx, d, g, m.out, id, takenBy(ctx, P));
      if (r.problem || (cut && addMove(ctx, d0, g, m.out, id).problem)) return [];
      return [{ out: m.out, in: id, cmp: compare(ctx, r.ev, rg.without) }];
    }).sort((a, b) => b.cmp.delta - a.cmp.delta);
    const model = measure([...new Set([...modelMoves(P, g).values()].filter((x) => x.out === m.out).map((x) => x.in))]);
    const room = bank + (P.L.price(m.in) ?? 0) + 1e-6;  // the bank after the week, and what its buy costs back
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

/** A suggestion's (or another buy's) gain: its cmp's, or a bare gain. */
const choiceGain = (x) => x?.cmp?.delta ?? x?.gain ?? 0;
/** B6: buy c is inside the noise of the row's chosen buy x (engine.verdictLabel of main minus alt is 'coin'): tied
 *  with it: the cheaper goes first (cheaperFirst). */
export const tiedBuy = (x, c, noise) => !!x && E.verdictLabel(choiceGain(x) - choiceGain(c), noise) === 'coin';
/** B6 (the user, 2026-10-10: a tie mark and the cheaper buy first, no run count): one sale's buys best first, those tied
 *  with the best (tiedBuy) cheaper first, so a tenth never crowns one of them. price(id) → £m | null (an unknown price
 *  after the known ones); without it the gain order. Pure. [{in, cmp: {delta}}] → a new list */
export function cheaperFirst(list, noise = 0, price = null) {
  const out = [...(list || [])].sort((a, b) => choiceGain(b) - choiceGain(a));
  if (!price || !out.length) return out;
  const cost = (x) => price(x.in) ?? Infinity;
  const tied = out.filter((x) => tiedBuy(out[0], x, noise)).sort((a, b) => cost(a) - cost(b));
  return [...tied, ...out.filter((x) => !tied.includes(x))];
}

/**
 * B5b (choice_bets, 2026-10-09: your transfer's Why weighed it only against keeping the player it sells, and the week's
 * better use of the same free transfer showed only as an extra move after its −4): the best single move for the free
 * transfer your transfer `m` of GW g takes, found as the suggestions are (suggestionsOf: the model's moves on the
 * bundle's roads, modelMoves, none whose buy your rules keep out, barred, nor whose sale your Keeps hold, keptFrom, nor
 * one of a player your plan moves from GW g on, movedFrom, but this transfer's own two) on the plan without it, measured
 * against that plan as its row is (rowGains' without: the week's moves before it; addYours, compare). Only while it takes
 * a free transfer (no hit of its own) and the week has none left (extraWeek): none off the hold. Once per plan view and
 * move. → {out, in, cmp} | null
 */
const OTHERUSE = new WeakMap();
export function otherUseOf(ctx, P, w, m) {
  const g = w?.gw;
  if (!P?.mem?.hold || !w || isFrozen(P, g) || squadWeek(w) || !extraWeek(P, g)) return null;
  let by = OTHERUSE.get(P);
  if (!by) OTHERUSE.set(P, (by = new Map()));
  const key = `${g}:${m.out}>${m.in}`;
  if (by.has(key)) return by.get(key);
  const rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
  let best = null;
  if (rg && !rg.hit) {
    const into = squadBefore(P, g), squad = rg.without.gws.find((s) => s.gw === g)?.squad ?? [];
    const no = barred(P, g), kept = keptFrom(P, g), mine = movedFrom(P, g);
    mine.delete(m.out);
    mine.delete(m.in);
    for (const x of modelMoves(P, g).values()) {
      if ((x.out === m.out && x.in === m.in) || !into.includes(x.out) || !squad.includes(x.out) || squad.includes(x.in) || mine.has(x.out) || mine.has(x.in) || no.has(x.in) || kept.has(x.out)) continue;
      const r = addYours(ctx, P, g, x.out, x.in, rg.dWithout, takenBy(ctx, P));
      if (r.problem) continue;
      const cmp = compare(ctx, r.ev, rg.without);
      if (!best || cmp.delta > best.cmp.delta) best = { out: x.out, in: x.in, cmp };
    }
  }
  by.set(key, best);
  return best;
}

// ---------------------------------------------------------------- When: the same move in another GW

/**
 * The usability review (2026-10-08, a manager planning four weeks ahead): "Nothing answers 'why this week and not next'.
 * Every explanation says 'vs rolling', and the cost of waiting (+6.2 in GW6 vs +4.0 in GW7) only shows as unlabelled
 * numbers on different tabs." The Why sheet's When line: the same move (the same sale, the same buy) made in each GW of
 * the plan's window, P.A to P.end, each measured as the sheet's own number is: your plan without it (dropMove), then
 * the move added in that GW, against your plan without it at all (so two weeks' numbers differ by what moving it there
 * does; the phone lineups left to the engine from GW A on in both, so no lineup names a player one side doesn't have);
 * its own GW is the move's own number there (rowGains). One measure in every week, so two weeks differ by what moving it
 * does (moveTo's change), never the sheet's "vs rolling" number, which counts Forkcast's later moves on both sides (the
 * user, 2026-10-19: "saka to palmer next week is actually 0.4").
 * A GW where the move can't be made is {ok: false} ("—"): the bank, the club limit or the squad can't take it (addMove's
 * problem), it is GW A under way (inkAt, B7; or its own GW is: moving it changes that week), or it is a Wildcard or Free
 * Hit week. Single moves under the hold only: null for a funding sale or the buy it pays for (their money ties them, as
 * ownAltsOf), a move no sale of yours makes, or a squad week's change.
 * m: {gw (the move's own GW), out, in}. → [{gw, ok, current, delta, label}] | null
 */
export function whenOf(ctx, P, m) {
  const g = Number(m.gw);
  const w = weekOf(P, g);
  if (!P?.mem?.hold || !w || squadWeek(w) || pinOfMove(P, m)?.kind !== 'sell' || fundingOf(P, g, m)) return null;
  const d0 = draftOf(ctx);
  let d = dropMove(d0, flatMoves(d0).find((x) => x.gw === g && x.out === m.out) ?? { gw: g, out: m.out, in: m.in });
  for (const x of P.gws) if (d.lineups?.[x]) d = E.setLineup(d, x, null);
  const without = estimate(ctx, d, P.A);
  const own = rowGains(ctx, P, w).get(`${m.out}>${m.in}`)?.cmp ?? null;
  return P.gws.map((x) => {
    const current = x === g;
    const no = { gw: x, ok: false, current, delta: null, label: null };
    const wx = weekOf(P, x);
    if (current && own) return { gw: x, ok: true, current, delta: own.delta, label: own.label };  // made there, frozen or not
    if (!wx || inkAt(ctx, P, x) || squadWeek(wx) || inkAt(ctx, P, g)) return no;
    const r = addMove(ctx, d, x, m.out, m.in);
    if (r.problem) return no;
    const c = compare(ctx, r.ev, without);
    return { gw: x, ok: true, current, delta: c.delta, label: c.label };
  });
}

/**
 * The review (2026-10-08): "There is no 'move to next week'. It took 4 steps: remove it in GW6, open GW7, find the same
 * suggestion again, tap +." Your transfer m ({gw, out, in}) made in GW g2 instead, keeping its buy, in ONE edit (one
 * Undo): its sale rule (memory.pinSell, keyed by the player sold: sell:<out>) dropped and made again from g2, checked
 * first on your plan without it (dropMove) with it added in g2 (addMove, the When line's own measure). Made again it is your newest rule, so in a week that has a transfer of
 * yours already it is the extra one (rowGains: the hit is its own). A rule of yours it contradicts goes and is named
 * (withTaken), as sellFrom's; a move into GW A under way is refused (edit: memory.inkOf judges the new sale, B7; one out of it is never offered: whenOf, whyActs). Its toast "Chilwell → Bassey moved to GW7 ·
 * −2.2 pts" (vsPrev) with Undo. → bool
 */
export function moveTo(ctx, m, g2) {
  const P = plan(ctx);
  const g = Number(m.gw), to = Number(g2);
  const pin = P ? pinOfMove(P, m) : null;
  if (!P || to === g || !P.gws.includes(to) || pin?.kind !== 'sell' || !weekOf(P, g)?.moves.some((x) => x.out === m.out && x.in === m.in)) return false;
  const nm = P.L.name;
  const lo = Math.min(g, to);
  const d0 = draftOf(ctx);
  let d = dropMove(d0, flatMoves(d0).find((x) => x.gw === g && x.out === m.out) ?? { gw: g, out: m.out, in: m.in });
  for (const x of P.gws) if (x >= lo && d.lineups?.[x]) d = E.setLineup(d, x, null);
  const r = addMove(ctx, d, to, m.out, m.in);
  if (r.problem) { toastOf(ctx)(problemText(ctx, r.problem, nm(m.in)), 'warn'); return false; }
  const next = pinSell(m.out, to, P.end, { in: m.in, label: `${nm(m.out)} → ${nm(m.in)} from GW${to}` });
  const taken = clashing(P, next).filter((q) => q.id !== pin.id);
  const what = withTaken(P, COPY.movedTo(`${nm(m.out)} → ${nm(m.in)}`, to), taken);
  // its row leaves the week on screen: its points even when it lands at once (B24's premise fails; the reviews, 2026-10-11)
  return edit(ctx, {
    pins: [next], drop: [pin.id, ...wishDrop(P, m.in), ...taken.map((q) => q.id)], from: lo, what, taken,
    text: withPoints(ctx, what, (Q, prev) => endingOf(Q, prev, to, { own: m.out })),
  });
}

// ---------------------------------------------------------------- a suggested plan's solve in the speculative slot

/** GW g's moves on a solved `road` that your plan doesn't make yet: its sales and buys there less the plan's own moves
 *  `have` ([{out, in}]), paired by position (pairedMoves). Pure. → [{out, in}] */
export function pairMovesOf(road, g, have = [], L = null) {
  const w = (road?.weeks || []).find((x) => Number(x.gw) === Number(g));
  if (!w) return [];
  const outs = (w.out || []).map(Number).filter((id) => !have.some((m) => Number(m.out) === id));
  const ins = (w.in || []).map(Number).filter((id) => !have.some((m) => Number(m.in) === id));
  return pairedMoves(outs, ins, L);
}

// the slot's fork solve in flight (lane 0: forkFlights), when a refused or cancelled ask may go again, and the landed
// solves' count (pairChanged: the choices re-draw, plansOf's cache keys on it)
const PAIR = { flight: null, until: 0, prepUntil: 0, rev: 0 };
const PAIR_AGAIN_MS = 1500, PAIR_HOLD_MS = 30000;

/** The speculative-slot solves of this browser a suggested plan's solve takes the slot from: its own background asks
 *  (a chip preparation, the options road; each is asked again later) and an older fork. A Wish solve is a
 *  sheet you are looking at (closing it cancels it): the fork waits for it. */
const PAIR_TAKES = new Set(['chipprep', 'speculative', 'pair', 'pairnext', 'presolve']);
/** …and those the next week's preparation (prepNext) goes beside, in a lane of its own: never a Wish's or the options
 *  road's (the speculative slot then holds every fork lane). */
const PREP_BESIDE = new Set(['chipprep', 'pair', 'pairnext', 'presolve']);
/** A suggested plan's solve landed: the week line, the choices on the pitch and an open Week sheet alone re-draw (Ahead's
 *  mount listens to aheadPair: renderPair). */
const pairChanged = (ctx) => ctx.store.set('aheadPair', ++PAIR.rev);

/** What a suggested plan's + takes in GW g (the user, 2026-10-12: "show only this week moves and apply only this week
 *  moves … apply future transfers only if let Forkcast plan"; it was the whole plan, decision 3): its GW-g moves not
 *  yet yours (`own`), its GW-g chip (`chips`, [[g, chip]]: a Wildcard's or Free Hit's changes there are the chip's
 *  squad) and your GW-g transfers it doesn't make (`gone`: decision 6, the choice is GW g's instead of yours). Its
 *  later weeks are Forkcast's follow-up, never taken: the number's while Forkcast makes your transfers (it makes them
 *  next), never under the hold (the row is the week alone there: plansOf's `alone`). Pure. */
export function planTake(P, g, pl) {
  const chip = pl.chips?.[g] ?? null;
  // a move of yours the plan's choice keeps stays yours only when exact (an open sale, "Let Forkcast choose", is made
  // the choice's: the week's Roll caps it at exactly these moves, addPlan)
  const own = SQUAD_CHIPS.has(chip) ? [] : pl.moves.filter((m) => m.gw === g && !(isYours(P, m) && isExact(pinOfMove(P, m))));
  // `back`: your Wildcard or Free Hit there that it doesn't play, taken off (chipBackOf; the user, 2026-10-13)
  return { own, chips: chip ? [[g, chip]] : [], gone: yoursTakenBack(P, g, pl.moves), back: chipBackOf(P, g, pl) };
}
/** The rules of yours (ids) that make the GW-g transfers a choice's + takes back (planTake's `gone`): its + drops them
 *  (addPlan). */
const goneIds = (P, gone) => [...new Set(gone.map((m) => pinOfMove(P, m)?.id).filter(Boolean))];
/** Your transfers as the rules a choice's + leaves make them (pairsOf, less goneIds'): how the Week sheet pairs GW g once
 *  it is taken (viewOfRoadWeek), so its Why sheet pairs a Wildcard's or Free Hit's changes so before (squadChanges; the
 *  user, 2026-10-21: fix the known issues). Pure. → [{out, in}] */
export function takenKeep(P, g, pl) {
  const gone = new Set(goneIds(P, planTake(P, g, pl).gone));
  return pairsOf(P.pins.filter((p) => !gone.has(p.id)));
}
/** The draft taking GW g's choice makes on `base` (the plan's draft, its GW-g chip with it; or yours): GW g's moves
 *  `now`, your plan's weeks before g, and after g only the moves the + keeps (a transfer of yours, a Wildcard's or Free
 *  Hit's squad); Forkcast's own later moves are the next solve's (the user, 2026-10-13: "Same list, both modes": a
 *  choice buying a player Forkcast buys later fits). One rule for the +'s draft (addPlan) and the list's (fitsAt). */
function planTakeDraft(ctx, P, g, base, now) {
  const keeps = (m) => m.gw < g || (m.gw > g && (!!squadWeek(weekOf(P, m.gw)) || !!pinOfMove(P, m)));
  return withMoves(base, [...flatMoves(draftOf(ctx)).filter(keeps), ...now]);
}

/** Draft `base` with GW g's week taken from draft `from`: its moves, its chip and its saved lineup, every other week
 *  `base`'s (a Free Hit's week alone on the roll plan's later weeks, its squad reverting after it: plansOf's chipOf).
 *  Pure. */
const weekOnto = (base, from, g) => {
  const d = withMoves(base, [...flatMoves(base).filter((m) => m.gw !== g), ...flatMoves(from).filter((m) => m.gw === g)]);
  const c = E.setLineup(E.setChip(d, g, from.chips?.[g] ?? null), g, null), lu = from.lineups?.[g];
  return lu ? E.setLineup(c, g, lu) : c;
};

/** A suggested plan's GW g taken (plansOf; planTake): each of its GW-g moves not yet yours your exact transfer from GW g
 *  (memory.pinSell), a player it buys whom a later transfer of yours sells held only until the GW before
 *  that sale; your GW-g transfers it doesn't make taken back, and in a week Forkcast re-picks under a hits rule of
 *  yours that rule too (the week makes exactly the plan's moves); a Wildcard or Free Hit it plays there planned as
 *  useChip plans it (chipEdit: that week's changes are the chip's squad, its Roll or hits rule goes, its
 *  road offered so the plan lands at once when it fits its rules); a rule of yours a move contradicts, or a hits limit
 *  below the week's hits, taken back (withTaken). Its toast names the week's moves with its GW ("GW6 Scott → Groß +
 *  Tavernier → Xhaka (−4)"), the chip with the rule it replaces (chipWords) and the transfers it takes back; under the
 *  hold no number (its row has it: the owner, 2026-10-27, "remove this 'vs ..' message from black tab appearing"), with no
 *  roll plan the total's (withPoints); what your total moves by is the header's change (the owner, 2026-10-26: "what
 *  means +1.6 vs rolling but total +5.1"). One
 *  edit, one Undo, and Why before it (whyAct: its first transfer's Why sheet; first-use proposal #2). → bool (false: it
 *  changes nothing, L1) */
export function addPlan(ctx, g, pl) {
  const P = plan(ctx);
  if (pl?.state !== 'ready') return false;
  const nm = P.L.name;
  const { own, chips, gone, back } = planTake(P, g, pl);
  // the Roll row (plansOf: Forkcast's plan rolling a week you roll) changes your week by its Roll alone: taken while the
  // week has none (the user, 2026-10-19: "make roll also clickable same way as others via + …")
  const locks = !!pl.rolls && !P.pins.some((p) => p.id === `roll:${g}`);
  if (!own.length && !chips.length && !gone.length && !back && !locks) return false;
  const draft = planTakeDraft(ctx, P, g, pl.draft, flatMoves(pl.draft).filter((m) => m.gw === g));
  // a sale whose money its week's other buy needs (the week without it over budget) funds that buy, as a bring-in's
  // does (buyPins; review 5, 2026-10-12: taken plain, its row read as a weak move on its own, never "Frees £x so Y fits");
  // of two that each need the other, the one that frees more
  const ev = estimate(ctx, draft, g);
  const funder = new Map((() => {
    if (own.length !== 2) return [];
    const needs = (m) => freedBy(ev, g, m) > 0 && problemOf(ctx, estimate(ctx, dropDrafted(draft, m), g), g)?.code === 'budget';
    const f = own.filter(needs).sort((a, c) => freedBy(ev, g, c) - freedBy(ev, g, a))[0];
    return f ? [[f, own.find((m) => m !== f).in]] : [];
  })());
  // a player it buys whom a later transfer of yours sells: held only until the GW before that sale (as sellsOn remakes a
  // transfer of yours)
  const later = flatMoves(draftOf(ctx)).filter((x) => x.gw > g && pinOfMove(P, x));
  const pins = own.map((m) => {
    const p = pinSell(m.out, m.gw, P.end, { in: m.in, funds: funder.get(m) ?? null, label: `${nm(m.out)} → ${nm(m.in)} from GW${m.gw}` });
    const resold = later.find((x) => x.out === m.in);
    return resold ? { ...p, must: p.must.map(([id, a]) => [id, a, resold.gw - 1]) } : p;
  });
  const drop = goneIds(P, gone);
  // your chip week, a choice that plays none: the chip off as chipOff takes it, its picks named
  const off = back ? chipOffParts(P, g, { locked: true }) : null;
  if (off) { pins.push(...off.pins); drop.push(...off.drop); }
  const chipSaid = new Map(), chipTaken = [...(off?.picks ?? [])];
  for (const [x, c] of chips) {
    const e = chipEdit(P, x, c);
    const cw = chipWords(P, x, c, e.drop, { inPlace: true });
    pins.push(...e.pins);
    drop.push(...e.drop);
    chipSaid.set(x, cw.what);
    chipTaken.push(...cw.taken);
  }
  // the week is exactly the choice in both modes (the user, 2026-10-13: "Lock it, both modes"): a Roll capping GW g at
  // its moves (none: no transfers), in Your rules with its ×, which hands the week back (removeMove); a Wildcard or Free
  // Hit makes its own squad
  const roll = chips.length ? null : pinRoll(g, pl.moves.filter((m) => m.gw === g).length);
  if (roll) pins.push(roll);
  // a player its moves sell whom a transfer of yours bought before GW g: that transfer stays, his hold ending the GW
  // before (sellsOn, as Sell and Replace keep it), and the rules are judged with it so (the user's phone, 2026-10-19:
  // "why it removed gw8 transfer")
  const { chain, asks } = chainOf(P, g, own);
  pins.push(...chain.values());
  const rule = !chips.length && repicks(P, g) ? P.pins.filter((p) => p.id === `hits:${g}`) : [];
  drop.push(...rule.map((p) => p.id));
  const ids = new Set(pins.map((p) => p.id));
  // a limit counts the week's hits, not only those the take adds (review 5, 2026-10-12: a second −4 under "Up to −4"
  // slipped past while your plan already took one)
  const hits = ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  const limit = asksOf(P).filter((p) => p.kind === 'hits' && !drop.includes(p.id) && Number(p.hits?.[g] ?? Infinity) < hits);
  // the week's Roll is the choice itself, never a rule against your moves it keeps (the review, 2026-10-13: judged against
  // your rules before the take, it took back a kept transfer); a Wish the take makes an exact sale is no rule taken back
  const wished = new Set(own.flatMap((m) => wishDrop(P, m.in)));
  const taken = [...new Map([...pins.filter((p) => !isRoll(p) && !chain.has(p.id)).flatMap((p) => clashing(P, p, asks)), ...limit].filter((q) => !ids.has(q.id) && !drop.includes(q.id) && !wished.has(q.id)).map((q) => [q.id, q])).values()];
  const move = (m) => `${nm(m.out)} → ${nm(m.in)}`;
  const hit = own.length && pl.hits?.[g] ? ` (${MINUS}${E.HIT_COST * pl.hits[g]})` : '';
  const head = chipSaid.get(g) ?? (own.length ? `GW${g} ${own.map(move).join(' + ')}${hit}` : !pl.moves.some((m) => m.gw === g) ? COPY.planRoll(g) : null);
  // the rule it adds, named as Your rules lists it, its GW once after a head that names it ("GW8 Saka → Palmer ·
  // frozen": two lines at 375 px), unless its words are the head's ("GW8 roll") or it stands already (the user,
  // 2026-10-22; johnson r7 §3, saffer r7 §5: "GW8 lock" was first heard of when it was removed)
  const rg = `GW${g} `;
  // (one that stands judged by what it keeps, never its stored label: a rule saved before 2026-10-22 says "GW8 lock";
  // the review of round 7)
  const made = roll && roll.label !== head && !P.pins.some((p) => p.id === roll.id && rollKeeps(p) === rollKeeps(roll))
    ? (head?.startsWith(rg) && roll.label.startsWith(rg) ? roll.label.slice(rg.length) : roll.label) : null;
  // the transfers it takes back in one clause, its GW said once (the first-use findings, 2026-10-21: "GW8 roll · GW8 Groß →
  // Dewsbury-Hall removed · GW8 Calvert-Lewin → …" ran to three lines over the header)
  // where the week keeps transfers of yours beside its own, their count named (the user, 2026-10-22: "GW8 Semenyo →
  // Palmer + Cunha → Rice · frozen · 3 transfers in GW8")
  const nAt = pl.moves.filter((m) => m.gw === g).length;
  const kept = own.length && !chips.length && nAt > own.length && (weekOf(P, g)?.moves.length ?? 0) > 0 ? COPY.weekTransfers(nAt, g) : null;
  // one move in place of your one transfer of the same player, the place's own words (decision L, "instead of
  // Evanilson"): "GW9 Calvert-Lewin → Barry instead of Evanilson", not "… · Calvert-Lewin → Evanilson removed", whose
  // "removed" a one-line toast head would clip first (ui.js toastWords; the owner, 2026-10-26: two lines at 320 px)
  const swapped = own.length === 1 && gone.length === 1 && gone[0].out === own[0].out && head?.endsWith(move(own[0]) + hit)
    && !chips.length && !back;
  const said = [swapped ? `${head} ${COPY.planInsteadOf(nm(gone[0].in))}` : head, made, kept, gone.length && !swapped ? COPY.removed(gone.map((m, i) => `${head || i ? '' : `GW${g} `}${move(m)}`)) : null, off ? COPY.chipTakenOff(chipName(back), g) : null,
    ...(off?.pins ?? []).map((q) => COPY.chipBack(autoRuleName(q, g))), ...rule.map((q) => COPY.chipRemoves(autoRuleName(q, g)))].filter(Boolean);
  const what = withTaken(P, said.join(' · '), taken);
  // a choice the solver hasn't planned (no road of its own) is checked for budget and club before its solve is asked
  // (§5.5: whether a solve is worth asking; never what is drawn: the solver's plan is, once it lands)
  const p = !pl.road && !chips.some(([, c]) => SQUAD_CHIPS.has(c)) ? problemOf(ctx, ev, g) : null;
  if (p) { toastOf(ctx)(problemText(ctx, p), 'warn'); return false; }
  return edit(ctx, {
    pins, drop: [...own.flatMap((m) => wishDrop(P, m.in)), ...drop, ...taken.map((q) => q.id)], road: pl.road, inPlace: chain.keys().next().value ?? null,
    // a GW-g armband the plan moves is said, as every edit's ending says it (B21; review 5, 2026-10-12)
    from: g, what, taken: [...chipTaken, ...rule, ...taken],
    // a Roll + that takes nothing back and changes no number says the rule it made (rollMade; saffer r7 §7: "GW8 roll ·
    // total 0.0")
    text: locks && !own.length && !chips.length && !gone.length && !back ? () => COPY.rollMade(g)
      // no number: the row's is on its row, "−0.8 vs your plan" under its words read as a second message (the owner,
      // 2026-10-27: "remove this 'vs ..' message from black tab appearing"); never what your total moved by (the owner,
      // 2026-10-26: "what means +1.6 vs rolling but total +5.1"): the header's own change (renderTotal) and the Why
      // sheet's line under its number (COPY.totalMoved)
      : pl.vsRoll && !pl.refRow ? (Q, prev) => `${what}${captainMoved(Q, prev, g)}` : withPoints(ctx, what, (Q, prev) => captainMoved(Q, prev, g), { total: true }),
    more: own.length ? [whyAct(g, own[0].in)] : [],
    // a take's receipt: two rows on a phone, its head one line, "frozen" and the week's count clipping after the sales,
    // anything it takes back whole (ui.toast; the owner, 2026-10-26: "why this takes 3 lines")
    take: [made, kept].filter(Boolean),
  });
}

/** Transfer m ({gw, out, in}) is one of yours in your plan: a rule of yours makes it and its week has it. */
const isYours = (P, m) => !!pinOfMove(P, m) && !!weekOf(P, m.gw)?.moves.some((y) => y.out === m.out && y.in === m.in);
/** GW g's transfers that `moves` (a plan's) doesn't make, yours and (the user, 2026-10-13: "Same list, both modes")
 *  Forkcast's, never a Wildcard's or Free Hit's squad (the chip names them): what taking it takes back (addPlan's toast,
 *  the plan row's "instead of": review 5, 2026-10-12, the + took them back unsaid). → [{gw, out, in}] */
export const yoursTakenBack = (P, g, moves) => (weekOf(P, g)?.moves || []).map((m) => ({ gw: g, out: m.out, in: m.in }))
  .filter((m) => (!squadWeek(weekOf(P, g)) || isYours(P, m)) && !moves.some((x) => sameMove(x, m)));
/** Your Roll holds GW g (a Roll row's +: addPlan; "Rolling ✓" beside the goal) while the week has no transfer and no
 *  Wildcard or Free Hit: a choice that moves someone there takes it back (its + a Roll capped at its moves, addPlan; a
 *  sale or a bring-in clashes with it), so its rows and cards say "instead of rolling" (the first-use run, 2026-10-21: "I
 *  just said no transfers. Why is it still dangling Silva in front of me?"). */
export const rollingAt = (P, g) => { const w = weekOf(P, g); return !!w && !w.moves.length && !squadWeek(w) && P.pins.some((p) => p.id === `roll:${g}` && !rollKeeps(p)); };

/** The rule of yours that makes transfer m (a sale, with its buy or the plan's pick; a slide or a Wish that buys him;
 *  a chip week's pick only in its week, so only a move that names its gw: review 5, 2026-10-12, a later Scott → Groß
 *  found the GW8 Free Hit's pick of Groß, not sell:Scott) | null: the row's × lifts it. P: a plan view. */
export const pinOfMove = (P, m) => asksOf(P).find((p) => (p.kind === 'sell' && Number(p.player) === Number(m.out) && (p.in == null || Number(p.in) === Number(m.in)))
  || ((p.kind === 'slide' || p.kind === 'wish') && Number(p.player) === Number(m.in) && !(isPick(p) && (m.gw == null || Number(m.gw) !== Number(p.gw))))) ?? null;

/**
 * A2: GW g's transfers in the order they were made (their rules' order, oldest first; the planner's own after yours), so
 * a week's free transfers go to the first and a hit to the extra one (FPL counts them so: the hit is the extra move's).
 * P: a plan view; w: its week. → [move]
 */
export function movesInOrder(P, w) {
  const asks = asksOf(P);
  const rank = (m) => { const p = pinOfMove(P, { ...m, gw: w.gw }); const i = p ? asks.indexOf(p) : -1; return i < 0 ? Infinity : i; };
  return (w?.moves || []).map((m, i) => [m, i]).sort(([a, i], [b, j]) => rank(a) - rank(b) || i - j).map(([m]) => m);
}

/**
 * A2: a funding move (a sale of yours made so another buy fits: pin.funds, bringIn's "Do both") and the move it funds,
 * both in GW g of plan view P: {fund: {pin, move}, main: {pin, move}} | null. m: either of the two moves.
 */
export function fundingOf(P, g, m) {
  const w = weekOf(P, g);
  const pin = w ? pinOfMove(P, { ...m, gw: g }) : null;
  if (!pin) return null;
  const fp = pin.funds != null ? pin : asksOf(P).find((p) => p.kind === 'sell' && p.funds != null && Number(p.funds) === Number(m.in));
  if (!fp) return null;
  const main = w.moves.find((x) => x.in === Number(fp.funds));
  const fund = w.moves.find((x) => x.out === Number(fp.player) && x.in === Number(fp.in));
  const mp = main ? pinOfMove(P, { ...main, gw: g }) : null;
  return main && fund && mp && mp !== fp ? { fund: { pin: fp, move: fund }, main: { pin: mp, move: main } } : null;
}

/** The player a sale of yours sells (a sale's own; a slide's `out`), and the one a rule of yours brings in (a sale's buy,
 *  a slide's player, a Wish's), else null. */
const soldBy = (q) => (q.kind === 'sell' ? q.player : q.kind === 'slide' ? q.out : null);
const boughtBy = (q) => (q.kind === 'sell' ? q.in : q.kind === 'slide' || q.kind === 'wish' ? q.player : null);
/** A transfer as a removal's toast names it: "Tavernier → Gomez". */
const moveSaid = (nm, x) => `${nm(x.out)} → ${nm(x.in)}`;
/**
 * A transfer off the plan by its row's × (or its place's Remove): its rule of yours (a sale, a slide or a Wish that
 * makes it) goes, with Undo, and the week's Roll a take made with it (addPlan: the week locked to the choice, said);
 * under the hold its GW rolls again. Nothing else goes with it: what the rules left need is the solver's to plan, or to
 * say it can't (fail: "… removed: no plan keeps your GW9 choices …"). The owner, 2026-10-26 (a Remove of Calafiori →
 * Hill kept Leno → Raya and João Pedro → Evanilson, four Arsenal players drawn): "fix so every squad is solver squad, no
 * hardcoded logic whatsoever" — the phone's arithmetic of what goes with a removal (A2's funded buy alone and a funding
 * sale with its buy, fundingOf; B95's buys that needed its money, dependentBuys; a later sale of its buy, orphanedBy)
 * went with it. A move the planner made (a week you let it plan) has no rule: × keeps the player it sells in that GW
 * (keep, scope 'gw'). → bool
 */
export function removeMove(ctx, m) {
  const P = plan(ctx);
  const nm = P.L.name;
  // GW A under way is FPL's (memory.inkClash judges added pins; a removal adds none, so it is judged here)
  if (m.gw === P.A && isLive(ctx)) { toastOf(ctx)(COPY.live(P.A), 'warn'); return false; }
  const pin = pinOfMove(P, m);
  if (!pin) return m.gw != null ? keep(ctx, m.out, { gw: m.gw, scope: 'gw' }) : false;
  // the week's Roll (a plan's + stored it: addPlan): the × hands the week back to whoever makes the rest, said as
  // every rule an edit takes back is (withTaken; the review, 2026-10-13: it went from Your rules unsaid)
  const taken = m.gw == null ? [] : P.pins.filter((q) => q.id === `roll:${m.gw}`);
  const from = Math.max(P.A, num(pin.gw) ?? P.A);
  const own = { ...m, gw: m.gw ?? from };
  const what = withTaken(P, COPY.removed(moveSaid(nm, own)), taken);
  // the verdict's ending (endingOf, B21): a hit, what the planner put in its place, a later week's hit and a new captain
  // of the edit's week (A1: an edit never moves the armband unsaid), never the move its own words name
  const end = (Q, prev) => endingOf(Q, prev, own.gw, { own: m.out, named: [own] });
  // the reviews, 2026-10-11 (B24's premise, "its number is on its row", fails here: the row is gone): its points even
  // when it lands at once, named as what your total moves by; where it was GW g's one move (it rolls again, its week's
  // choices standing: weekRollOf on plansListed, no solve asked) no number, as a take's toast (the owner, 2026-10-27, of
  // "−0.8 vs your plan": "remove this 'vs ..' message from black tab appearing")
  const w = weekOf(P, own.gw);
  const rolls = !!w && !squadWeek(w) && w.moves.every((x) => x.out === own.out && x.in === own.in);
  const vr = rolls ? weekRollOf(ctx, P, w, (x) => plansListed(ctx, P, x)) : null;
  const text = vr ? (Q, prev) => `${what}${end(Q, prev)}` : withPoints(ctx, what, end, { total: true });
  // B129: the move its toast names is remembered as removed by you, part of its Undo (edit's `also`, after the snapshot)
  return edit(ctx, { drop: [pin.id, ...taken.map((q) => q.id)], from, what, taken, text, also: () => noteRemoved(P, [own]) });
}

/**
 * A2: each of GW g's transfers measured in the order they were made (movesInOrder): the plan with it and the ones before
 * it against the plan with only the ones before it, from GW g on (asTaken: best XI each week but your saved lineups). The week's free
 * transfers go to the first moves, so a hit is the extra move's, and the rows add up to the week's gain. Once per plan
 * view and GW. → Map(`${out}>${in}` → {cmp, hit (FPL's hits the move brings), withIt, without (estimates), dWith, dWithout
 * (their drafts)})
 */
const ROWGAINS = new WeakMap();
export function rowGains(ctx, P, w) {
  let by = ROWGAINS.get(P);
  if (!by) ROWGAINS.set(P, (by = new Map()));
  if (by.has(w.gw)) return by.get(w.gw);
  const g = w.gw;
  const ms = movesInOrder(P, w);
  // evs[k]: the plan with the week's first k moves (its later ones dropped, last first); ds[k] its draft
  // (as taken: your saved lineups kept, as a plan row counts them; review 5, 2026-10-12)
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
    cmp: compare(ctx, evs[k + 1], evs[k]), hit: Math.max(0, hitsAt(evs[k + 1]) - hitsAt(evs[k])), withIt: evs[k + 1], without: evs[k],
    dWith: ds[k + 1], dWithout: ds[k],
  }]));
  by.set(g, out);
  return out;
}

/** A Why sheet's number set on the sheet's own baseline (the user, 2026-10-22: one baseline per sheet, everything vs
 *  rolling): `delta` measured against the same plan as `own` (keeping the player it sells, or your plan as it stands),
 *  moved by the gap between that baseline and the header's (`head`, the same choice against rolling): own − head is what
 *  rolling makes over that plan, the same for every number measured against it. Pure. → delta (head null: as it is) */
export const onBase = (delta, own, head = null) => (head == null ? delta : delta - own + head);
/** The When line's weeks (whenOf, against keeping the player it sells) on the header's baseline (`head`, its number
 *  against rolling: onBase, its own week's number the base), so its own week reads the header's number and another week
 *  what moving it there gives against rolling ("GW9 0.0": rolling makes the same move then). Pure. → weeks */
export function whenOnBase(weeks, head = null) {
  const cur = weeks?.find((x) => x.current && x.ok);
  return head == null || !cur ? weeks : weeks.map((x) => (x.ok ? { ...x, delta: onBase(x.delta, cur.delta, head) } : x));
}

/** B29 (digest A8: "if he misses"): move `m` of GW g if its buy misses that GW, the plan with it (draft dWith) against
 *  the plan without it (dWithout) from GW g on, his GW-g forecast 0 in both and the lineups still picked on the forecasts
 *  (engine.evaluate fixedLineups: he starts where the plan starts him), both played as taken (asTaken: your saved
 *  lineups kept, your armband on him too, as the move's own number counts them). `base`: that number, the same two plans
 *  with his forecast (first-use findings #7, 2026-10-21: "If Rice misses GW8: −9.3" read as what a miss costs; the
 *  two differ by his GW-g points as the plan plays him) → compare + {base}. */
export function ifMisses(ctx, P, g, m, dWith, dWithout) {
  const score = { xp: (id, x) => (id === m.in && x === g ? 0 : P.L.xp(id, x)), fixedLineups: true };
  const base = compare(ctx, asTaken(ctx, P, dWith, g), asTaken(ctx, P, dWithout, g)).delta;
  return { ...compare(ctx, asTaken(ctx, P, dWith, g, score), asTaken(ctx, P, dWithout, g, score)), base };
}

/**
 * A12: what a move changes besides its two players' numbers (the Why sheet's list under its table, which has their
 * forecasts, prices and status: the user, 2026-10-19, "many random and dublicated info"), from the data: "frees £0.2m"
 * (B54; money it takes from the bank with the bank it takes it from, as Replace's header says it: "£0.3m from the bank
 * (£0.9m in the bank now)"), "−4: the extra transfer", "replaces Szoboszlai → Gibbs-White" (a transfer of Forkcast's it
 * takes the place of, addYours). The plan with it (withIt) against the plan without it (without), estimates from GW g
 * on. B21 (choice_bets Part 4 §2: nothing before the tap said what the move does to the weeks after): "GW7: 1 FT, not 2"
 * when it changes the next GW's free transfers, and "−4 in GW8" for a later week it brings a hit (hitsLater). B29: what
 * it makes if its buy misses GW g, and what it makes when he plays ("if Bassey misses GW6: −1.2, not +3.4": ifMisses on
 * `drafts`, [with it, without it]). B5b: your transfer (`yours`) beside a better use of its free transfer by more than
 * the noise, now and in its place, against `c`, the sheet's number ("Better use of this free transfer: Scott → Groß
 * +7.5, not +2.3": otherUseOf; first-use findings #7, 2026-10-21: "Instead:" under the miss line read as a fallback).
 * No bench remark (the user's order, 2026-10-09). `head`: the sheet's own number where its header counts against another
 * baseline than `without` (rolling): the miss and the better use set on it (onBase), so the sheet has one baseline (the
 * user, 2026-10-22: "If Palmer misses GW8: +2.0, not +8.2 vs keeping Saka" under "+2.8 vs rolling"). → [text]
 */
export function whyFacts(ctx, P, g, m, withIt, without, { drafts = null, c = null, yours = false, vs = null, head = null } = {}) {
  const nm = P.L.name;
  const wa = withIt.gws.find((x) => x.gw === g), wb = without.gws.find((x) => x.gw === g);
  const nx = P.gws.find((x) => x > g);
  const mv = wa?.moves.find((x) => x.out === m.out && x.in === m.in);
  const hit = (wa?.hits ?? 0) - (wb?.hits ?? 0);
  // a transfer the plan without it makes and the plan with it doesn't (its buy not made that week): one of Forkcast's
  // it takes the place of (addYours), in its week from g on
  const gone = without.gws.filter((s) => s.gw >= g).flatMap((s) => s.moves
    .filter((x) => x.ok && !(s.gw === g && x.out === m.out) && !withIt.gws.find((y) => y.gw === s.gw)?.moves.some((y) => y.in === x.in))
    .map((x) => `${nm(x.out)} → ${nm(x.in)}${s.gw === g ? '' : ` in GW${s.gw}`}`));
  const miss = drafts ? ifMisses(ctx, P, g, m, ...drafts) : null;
  const use = yours && c ? otherUseOf(ctx, P, weekOf(P, g), m) : null;
  const better = use && use.cmp.delta > c.delta && E.verdictLabel(use.cmp.delta - c.delta, P.noise) !== 'coin';
  // the bank it spends from (first-use findings #7: "£2.3m from the bank" with the bank shown nowhere): after the
  // week's other transfers where it has some (their money in it), as Replace's header says it (bankNow, M10); your
  // transfer's in your plan as it stands (rowGains' plan with it drops the week's later moves: a buy's funding sale)
  const evB = yours ? planBaseline(ctx, P, g) : withIt;
  const wk = evB.gws.find((x) => x.gw === g);
  const others = (wk?.moves || []).some((x) => x.ok && x.out !== m.out);
  const bank = wk ? COPY.bankNow(fmt.money(wk.bank - freedBy(evB, g, m)), g, P.A, others) : null;
  // the next GW's free transfers read as the bank is (the user, 2026-10-22: rowGains' partial plans said "GW9: 3 FT, not
  // 4" while the plan had 1 FT there): your transfer's in your plan as it stands, and without it there one transfer fewer
  // in its week (the engine's own rules: evaluate's `used`, nextFt, ftGrant); a choice's with it and without it
  // (a choice of two or more transfers: without it is without them all, said so: "4 without these 3 transfers", never
  // "without this transfer"; the review of the many-FT fixes, 2026-10-22)
  const fa = evB.gws.find((x) => x.gw === nx)?.ft;
  const fb = !yours ? without.gws.find((x) => x.gw === nx)?.ft
    : wk && nx != null && !SQUAD_CHIPS.has(wk.chip) ? E.nextFt(wk.ft, Math.min(wk.ft, Math.max(0, wk.transfers - 1)), E.ftGrant(P.season, nx)) : null;
  const nOff = yours ? 1 : Math.max(1, (wa?.transfers ?? 0) - (wb?.transfers ?? 0));
  return [
    mv ? COPY.frees(freedBy(withIt, g, m), bank) : null,
    hit > 0 ? `${MINUS}${E.HIT_COST * hit}: the extra transfer` : null,
    gone.length ? COPY.replaces(gone.join(', ')) : null,
    fa != null && fb != null && fa !== fb ? COPY.ftWithout(nx, fa, fb, nOff) : null,
    ...hitsLater(withIt.gws, without.gws, g),
    miss ? COPY.ifMisses(nm(m.in), g, onBase(miss.delta, miss.base, head), head ?? miss.base, vs) : null,
    better ? COPY.instead(`${nm(use.out)} → ${nm(use.in)}`, onBase(use.cmp.delta, c.delta, head), head ?? c.delta, vs) : null,
  ].filter(Boolean);
}
/** Move m's prices in an estimate's GW g (engine: FPL's sale price, the half-profit rule; the buy's price), as the Why
 *  sheet's table shows them: {in, out, buy, sell}. */
const pairOf = (ev, g, m) => {
  const x = ev?.gws.find((s) => s.gw === g)?.moves.find((y) => y.out === m.out && y.in === m.in);
  return { in: m.in, out: m.out, buy: x?.buy ?? null, sell: x?.sell ?? null };
};

/** B29: an edit's verdict (`text`, edit's) with player `id`'s FPL flag after it when the edit loses points: a Why sheet
 *  act's reason ("Keeping Scott in GW6 · −7.5 pts · Scott is injured (knee)": keep, veto). */
const withFlag = (ctx, id, text) => (Q, prev) => {
  const t = text(Q, prev);
  const flag = statusText(Q.L.name(id), Q.L.get(id)?.row);
  return flag && compare(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }).delta <= -0.05 ? `${t} · ${flag}` : t;
};

// ---------------------------------------------------------------- A1: a buy does only what it says

const FUND_MAINS = 3, FUND_SELLS = 8, FUND_BUYS = 4;
/**
 * A1 (the fix pass, 2026-10-08: an action does only what it says; anything more is asked first): how player `id` comes in
 * from GW g as exact moves of yours, each measured on the engine as adding it to your plan (under the hold the plan of
 * exact moves is the engine's own evaluation, memory.holdRoad, so the number is the one you get):
 *   {kind: 'one', out, in, draft, ev, cmp, hits}: the best sale of his position going into g, none your week already
 *     makes nor one your Keeps hold (keptFrom), that fits the bank and the club limit (`out`'s, when the sale is chosen:
 *     Replace);
 *   {kind: 'two', out, in, fund: {out, in}, short, draft, ev, cmp, hits}: none fits, so that sale with one more
 *     that frees the money (`short`: what the buy alone lacks): asked first, "Also sell Calafiori → Bassey (−4)? Do both";
 *   {kind: 'none', short (null: not the money), problem}: not even with one more sale (problem 'kept': every sale of
 *     his position is a player your Keeps hold, {gw, kept: [[id, the first GW his Keep holds him]]}).
 * hits: the hits GW g takes more than now (FPL's count of the moves: free transfers first). Never drops a move of yours
 * and never sets a hits rule. Memoised per plan view.
 */
const BUYS = new WeakMap();
export function buyPlan(ctx, id, g, { out = null } = {}) {
  const P = plan(ctx);
  if (!P || !weekOf(P, g)) return { kind: 'none', short: null, problem: null };
  let by = BUYS.get(P);
  if (!by) BUYS.set(P, (by = new Map()));
  const k = `${id}:${g}:${out ?? ''}`;
  if (!by.has(k)) by.set(k, findBuy(ctx, P, Number(id), Number(g), out == null ? null : Number(out)));
  return by.get(k);
}

/** Each sale of player `id`'s position going into GW g with him in its place, on the engine (the plan as it is, a later
 *  buy of him dropped: draftFor), never a player your plan already moves from GW g on (movedFrom: selling Scott again
 *  swapped your Scott → Groß unsaid, the checker, 2026-10-09: "E.Le Fée in for Scott", GW6 then ['Scott → E.Le Fée']) but
 *  one your later buy of him sells (movedBesides: the tap takes that buy back);
 *  `fixed` alone when given; measured as taken (takenBy: your saved lineups kept). → [{o, r: addMove's {draft, ev,
 *  problem}}] best first. buyPlan's one sale and the sales
 *  Add a player offers (saleOptions) are these. */
function saleTries(ctx, P, id, g, fixed = null) {
  const d0 = draftFor(ctx, P, id, g);
  const mine = movedBesides(P, id, g);
  const sells = fixed != null ? [fixed] : squadBefore(P, g).filter((p) => P.L.pos(p) === P.L.pos(id) && !mine.has(p));
  return sells.map((o) => ({ o, r: addMove(ctx, d0, g, o, id, takenBy(ctx, P)) })).sort((a, b) => b.r.ev.total - a.r.ev.total);
}

/** The sales that can bring player `id` in from GW g, for you to choose from (the user, 2026-10-10: "when i click sell
 *  player - it let me choose to whom with option to let model choose. but when i bring player in - it not let me choose"):
 *  each as saleTries makes it, against your plan (planBaseline): [{out, cmp | null, problem (budget: its `short`; club)}],
 *  best first. Once per plan view, player and GW. */
const SALES = new WeakMap();
export function saleOptions(ctx, id, g) {
  const P = plan(ctx);
  if (!P || !weekOf(P, g)) return [];
  let by = SALES.get(P);
  if (!by) SALES.set(P, (by = new Map()));
  const k = `${id}:${g}`;
  if (!by.has(k)) {
    const ev0 = planBaseline(ctx, P, g);
    by.set(k, saleTries(ctx, P, Number(id), Number(g)).map(({ o, r }) => ({ out: o, cmp: r.problem ? null : compare(ctx, r.ev, ev0), problem: r.problem })));
  }
  return by.get(k);
}

function findBuy(ctx, P, id, g, fixed) {
  // as taken (takenBy, planBaseline): the number is what the tap gives, your saved lineups kept (review 5, 2026-10-12)
  const ev0 = planBaseline(ctx, P, g);
  const by = takenBy(ctx, P);
  const into = squadBefore(P, g), w = weekOf(P, g);
  // a Wildcard or Free Hit week remakes the squad: no one sale brings him in there, the solve for him does (solvesRound),
  // one of yours too whom that week's squad leaves out (review 5, 2026-10-12: he read "can't fit")
  if (squadWeek(w)) return { kind: 'none', short: null, problem: { code: w.squad.includes(id) ? 'owned' : 'chip', gw: g } };
  if (into.includes(id) || w.squad.includes(id)) return { kind: 'none', short: null, problem: { code: 'owned', gw: g } };
  const hitsAt = (ev) => ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  const done = (kind, r, extra) => ({ kind, in: id, draft: r.draft, ev: r.ev, cmp: compare(ctx, r.ev, ev0), hits: Math.max(0, hitsAt(r.ev) - hitsAt(ev0)), ...extra });
  // he comes in for one of his position, as one more transfer (saleTries), never one your Keeps hold from GW g on
  // (keptFrom) but the sale you chose (`fixed`: it takes the Keep back, named, A6); every sale kept says so
  const mine = movedBesides(P, id, g), kept = keptFrom(P, g);
  const all = saleTries(ctx, P, id, g, fixed);
  const tries = fixed != null ? all : all.filter((t) => !kept.has(t.o));
  if (all.length && !tries.length) return { kind: 'none', short: null, problem: { code: 'kept', gw: g, kept: all.map((t) => [t.o, kept.get(t.o)]) } };
  const fits = tries.find((t) => !t.r.problem);
  const broke = tries.filter((t) => t.r.problem?.code === 'budget');
  if (!fits && !broke.length) return { kind: 'none', short: null, problem: tries[0]?.r.problem ?? null };
  // one more sale that frees the money: the squad's weakest few from GW g on (never one your plan moves, mine, nor one
  // your Keeps hold, kept), each for the best few buys of his position his sale pays for. The reviews, 2026-10-11
  // (High; choice H4 / F4, duke F3, birman H5): a funded way was weighed only when no single sale fit, and by its whole
  // total, the funding move's own gain included (Mbeumo's +5.7 held Tavernier → Xhaka's +2.0, Palmer's +4.4 Scott →
  // Xhaka's +6.5): each is weighed net of that move, the plan with the funding move alone (`alone`) its baseline
  const d0 = draftFor(ctx, P, id, g);
  const fromG = (p) => P.gws.filter((x) => x >= g).reduce((s, x) => s + (P.L.xp(p, x) ?? 0), 0);
  const prev = ev0.gws.find((s) => s.gw === g - 1);
  const sale = (p) => prev?.sell?.[p] ?? (P.L.sellT(p) ?? P.L.priceT(p) ?? 0) / 10;
  const pool = new Map();  // position → the buys your rules allow, best first
  const buysOf = (pos) => pool.get(pos) ?? pool.set(pos, buyCandidates(P, { pos, from: g, not: [id], limit: 80 })).get(pos);
  const solo = new Map();  // `${y}>${z}` → the plan with that funding move alone
  const aloneOf = (y, z) => solo.get(`${y}>${z}`) ?? solo.set(`${y}>${z}`, addMove(ctx, d0, g, y, z, by)).get(`${y}>${z}`);
  const ev1 = by(d0, g), base = ev1.total;
  let best = null;
  for (const t of broke.filter((x) => !fits || x.r.ev.total > fits.r.ev.total).slice(0, FUND_MAINS)) {
    const need = t.r.problem.short;
    // the weakest few whose sale can pay for it at all (a cheaper buy of his position exists)
    const held = into.filter((p) => p !== t.o && !mine.has(p) && !kept.has(p)).sort((a, b) => fromG(a) - fromG(b))
      .map((y) => [y, buysOf(P.L.pos(y)).filter((z) => (P.L.price(z) ?? Infinity) <= sale(y) - need + 1e-6).slice(0, FUND_BUYS)])
      .filter(([, zs]) => zs.length).slice(0, FUND_SELLS);
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
  const two = best && done('two', best.r, { out: best.o, fund: { out: best.y, in: best.z }, short: best.need });
  if (fits) {
    // a single sale fits: the funded way only when, net of its funding move, it beats that sale beyond the noise
    const gap = best ? best.net - (fits.r.ev.total - base) : 0;
    return best && gap > 0 && E.verdictLabel(gap, P.noise) !== 'coin' ? two : done('one', fits.r, { out: fits.o });
  }
  const short = Math.min(...broke.map((t) => t.r.problem.short));
  return two ?? { kind: 'none', short, problem: { code: 'budget', gw: g, short } };
}

/** A sale chip's bring-in (Bring in…'s Sells; the owner, 2026-10-28: "make it to add player even with negative itb like
 *  official fpl allow"): him for exactly that sale from GW g, as buyPlan's 'one' even where the bank can't pay for it
 *  (`short`: what it lacks; the plan then shows the bank below 0, memory.holdOf's debts, and Forkcast's way to pay it back
 *  on the pitch: plansOf, owedRoad); one the club limit stops, or none his place has, is buyPlan's answer. */
export function saleBuy(ctx, id, g, out) {
  const bp = buyPlan(ctx, id, g, { out });
  if (bp.kind === 'one' || (bp.kind === 'none' && bp.problem?.code !== 'budget')) return bp;
  const P = plan(ctx);
  const t = saleTries(ctx, P, Number(id), Number(g), Number(out))[0];
  if (!t || problemsOf(ctx, t.r.ev, g).some((p) => p.code !== 'budget')) return bp;
  const ev0 = planBaseline(ctx, P, g);
  const hitsAt = (ev) => ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  return { kind: 'one', out: Number(out), in: Number(id), draft: t.r.draft, ev: t.r.ev, cmp: compare(ctx, t.r.ev, ev0), hits: Math.max(0, hitsAt(t.r.ev) - hitsAt(ev0)), short: t.r.problem?.short ?? 0 };
}

/**
 * A1: player `id` in from GW g as buyPlan found him (bp, 'one' or an asked 'two'): his sale, and with 'two' the sale that
 * frees the money (marked `funds`: its row says so, its Why weighs it with the buy, and its × takes that buy with it,
 * never asking: removeMove), as sales of yours with their buys (memory.pinSell): one edit, one Undo. Under the hold no
 * week becomes the planner's and no hits rule is set (the setting stays as it was); the toast names what came in, the
 * points, a hit and a new GW-g captain. → bool
 */
export function bringIn(ctx, id, g, bp) {
  const P = plan(ctx);
  if (bp?.kind === 'pick') {
    // his wish pin with the solve that made it, your later buy of him off as wishSolve solved it (bringInTakes)
    // a wish of him it replaces (another week's pick, one he came with) is named too: one wish a player
    const pin = wishPin(P, id, g), was = asksOf(P).find((q) => q.id === pin.id && JSON.stringify(q.must) !== JSON.stringify(pin.must));
    const taken = [...bringInTakes(P, id, g, bp), ...(was ? [was] : [])], what = withTaken(P, pin.label, taken);
    // its number named as its week pill's, what your total moves by (edit's default's)
    return edit(ctx, { pins: [pin], drop: [pin.id, ...taken.map((q) => q.id)], road: bp.road, from: g, what, taken, text: vsPrev(ctx, what, { total: true }) });
  }
  if (!bp || (bp.kind !== 'one' && bp.kind !== 'two')) return false;
  const nm = P.L.name;
  const pins = buyPins(P, id, g, bp);
  const funds = fundsOf(bp);
  const taken = bringInTakes(P, id, g, bp);
  const what = withTaken(P, funds.length ? COPY.cameIn([id, ...funds.map((f) => f.in)].map(nm), g === P.A ? null : g) : COPY.cameInFor(nm(id), nm(bp.out), g === P.A ? null : g), taken);
  return edit(ctx, {
    pins, drop: [...wishDrop(P, id), ...funds.flatMap((f) => wishDrop(P, f.in)), ...taken.map((q) => q.id)], from: g, what, taken,
    ending: (Q, prev) => endingOf(Q, prev, g, { own: bp.out, named: funds }),
  });
}

/** A bring-in's other sales: [{out, in}] (a solve's road may need several: buyOfRoad's `funds`; buyPlan's one `fund`). */
const fundsOf = (bp) => bp.funds ?? (bp.fund ? [bp.fund] : []);
/** What transfer m (a sale's `out`) frees in GW g on estimate ev: its sale less its buy, £m (below 0 it spends). */
const freedBy = (ev, g, m) => { const x = ev?.gws.find((s) => s.gw === g)?.moves.find((y) => y.out === m.out); return (x?.sell ?? 0) - (x?.buy ?? 0); };
/** A bring-in's sales as your exact transfers (memory.pinSell): his, then each other sale, marked `funds` only when it
 *  frees money (the checker, 2026-10-09: a road's Scott → Gibbs-White, £6.1m → £8.0m, read "Frees £0.0m so
 *  B.Fernandes fits"). */
const buyPins = (P, id, g, bp) => [
  pinSell(bp.out, g, P.end, { in: id, label: `${P.L.name(bp.out)} → ${P.L.name(id)} from GW${g}` }),
  ...fundsOf(bp).map((f) => pinSell(f.out, g, P.end, { in: f.in, funds: freedBy(bp.ev, g, f) > 0 ? Number(id) : null, label: `${P.L.name(f.out)} → ${P.L.name(f.in)} from GW${g}` })),
];
/** Your later buy of player `id` (a sale of yours for him after GW g) and the sales that fund it, that GW: [Pin]. Him
 *  from GW g voids that buy (addMove) and leaves its money moves paying for nothing, so they go with it, named (the
 *  checker, 2026-10-09: Palmer from GW6 left "Saka → Palmer from GW7" and its Scott → E.Le Fée standing, and GW7 was
 *  re-picked unsaid, −11.4 where the bring-in said −8.8). */
/** "Him from GW g" solved as the tap would leave your rules (Add a player's weeks): his wish pin, your later
 *  buy of him and its funding off (laterBuys: the tap takes them back, bringInTakes; the reviews, 2026-10-11: "Bring him
 *  in earlier" was solved under the very buy it removes, so it read "No plan fits that" where one did). → solveFor */
// the rules its tap takes back left out of the solve too (bringInTakes): your later buy of him (laterBuys) and every rule
// his wish clashes with, a Roll of yours in GW g first (the user, 2026-10-21: Palmer's card behind Saka offered "+0.4
// instead of rolling" while Bring in said "GW8 not possible": the solve kept the GW8 roll his buy takes back)
export const wishSolve = (ctx, P, id, g, purpose) => solveFor(ctx, [wishPin(P, id, g)], purpose,
  [...new Set([...clashing(P, wishPin(P, id, g)), ...laterBuys(P, id, g)].map((p) => p.id))]);
const laterBuys = (P, id, g) => {
  // a Free Hit pick is his for that week alone (the squad comes back after it), so your later buy of him stands beside
  // it, as composePins lets both bind (review 5, 2026-10-12: "Bring Groß into your GW8 Free Hit" removed "Scott → Groß
  // from GW10"); a Wildcard's squad is kept, so him from then voids that buy
  if (squadWeek(weekOf(P, g)) === 'fh') return [];
  const buys = asksOf(P).filter((p) => p.kind === 'sell' && p.in === Number(id) && p.gw > g);
  return [...buys, ...asksOf(P).filter((p) => p.kind === 'sell' && p.funds === Number(id) && buys.some((b) => b.gw === p.gw))];
};
/** movedFrom(P, g) but the players your later buy of `id` and its funding sell (laterBuys: a buy of him from GW g takes
 *  them back, so they are free to sell; review 5, 2026-10-12: "Saka a week earlier" never offered the Scott your
 *  later Scott → Saka sells, and that week went unsolved). */
const movedBesides = (P, id, g) => {
  const s = movedFrom(P, g);
  for (const p of laterBuys(P, id, g)) if (p.funds == null) s.delete(Number(p.player));
  return s;
};
/** The plan's draft without the funding sales laterBuys takes back (his later buy itself addMove voids): what a buy
 *  of `id` from GW g is added to, so its number is the plan the tap makes. */
const draftFor = (ctx, P, id, g) => laterBuys(P, id, g).filter((p) => p.funds != null).reduce((d, p) => {
  const m = flatMoves(d).find((x) => x.gw === p.gw && x.out === p.player);
  return m ? dropMove(d, m) : d;
}, draftOf(ctx));
/** The rules of yours bringing `id` in from GW g as bp takes back: the asks its sales contradict (clashing) and your
 *  later buy of him with its funding (laterBuys), never one its own sales replace. bringIn drops them, its verdict
 *  names them (withTaken), and Add a player names them before the tap. → [Pin] */
export function bringInTakes(P, id, g, bp) {
  if (bp?.kind === 'pick') return laterBuys(P, id, g);
  const pins = buyPins(P, id, g, bp);
  const ids = new Set(pins.map((p) => p.id));
  return [...new Map([...pins.flatMap((p) => clashing(P, p)), ...laterBuys(P, id, g)].filter((q) => !ids.has(q.id)).map((q) => [q.id, q])).values()];
}
/** Rules of yours `pins` a tap takes back, said before it in their chips' words (ruleOf): "It removes “Sell Saka from
 *  GW7 for Palmer”, …", '' with none (Add a player's line). */
export const removesText = (P, pins) => (pins.length ? `It removes ${pins.map((q) => `“${ruleOf(P, q).text}”`).join(', ')}.` : '');
/** Him from GW g as your exact transfers (A1, the hold's rule; B36, the user 2026-10-10: every mode's, so on the
 *  suggested plan too a bring-in makes exactly the moves it showed and Forkcast plans the rest around them): a solve's
 *  road for him gives its GW-g moves (buyOfRoad: the sale it made for him and those that free the money), else the
 *  phone's (buyPlan: his best sale, or with one more that funds it). The buy Add a player measures and names
 *  before the tap and want makes, never the road's later weeks (the checker, 2026-10-09). → buyPlan's shape | null */
export function holdBuy(ctx, id, g, road = null) {
  const P = plan(ctx);
  if (!P) return null;
  if (road && squadWeek(weekOf(P, g))) return pickOfRoad(ctx, P, id, g, road);
  return road ? buyOfRoad(ctx, P, id, g, road) : buyPlan(ctx, id, g);
}

/** A Wildcard or Free Hit week's solve with him in its squad (wishSolve: his wish pin there) as a buyPlan of its own
 *  kind, 'pick': that road against your plan (cmp), the hits it takes there more than now; bringIn makes it his wish pin
 *  with that road, so the plan is the solve at once. */
function pickOfRoad(ctx, P, id, g, road) {
  const rw = (road.weeks || []).find((x) => Number(x.gw) === Number(g));
  if (!ids([...(rw?.xi || []), ...(rw?.bench || [])]).includes(Number(id))) return buyPlan(ctx, id, g);
  return { kind: 'pick', in: Number(id), road, cmp: compare(ctx, asYours(ctx, road), { weeks: P.weeks }), hits: Math.max(0, (rw?.hits ?? 0) - (weekOf(P, g)?.hits ?? 0)) };
}

/** A solve's road for "him from GW g" as a buyPlan: its GW-g sale for him and every other new move it made
 *  there (`funds`, the first also `fund`: a premium often takes three: the review, 2026-10-08, a four-move Haaland road
 *  refused as "needs £6.2m more"; those that free money are pinned as funding: buyPins); a move the phone can't make is
 *  the phone's own buyPlan. */
function buyOfRoad(ctx, P, id, g, road) {
  // the moves your week makes already are taken off before pairing (pairMovesOf), so a sale of yours is never re-paired
  // with his buy (Scott → Groß read as "Tavernier → Groß · Scott → E.Le Fée", both new: the checker, 2026-10-09)
  const fresh = pairMovesOf(road, g, weekOf(P, g)?.moves || [], P.L);
  const main = fresh.find((m) => m.in === id);
  const others = fresh.filter((m) => m !== main);
  if (!main) return buyPlan(ctx, id, g);
  const ev0 = planBaseline(ctx, P, g);
  const by = takenBy(ctx, P);
  // B36 on the suggested plan: Forkcast plans the rest around your moves, so a GW-g move of its own (no rule of yours
  // behind it) that the solve for him doesn't make is gone after the tap: dropped first (`drops`), the number, the
  // transfers and the hit those of the week the tap leaves (the checker, 2026-10-10: "3 transfers, −8" shown, "after a
  // −4 · replaces Szoboszlai → Xhaka" made)
  const rw = (road.weeks || []).find((x) => Number(x.gw) === Number(g));
  const drops = P.mem?.hold ? [] : (weekOf(P, g)?.moves || [])
    .filter((m) => !pinOfMove(P, { ...m, gw: g }) && !(ids(rw?.out).includes(Number(m.out)) && ids(rw?.in).includes(Number(m.in))));
  const d1 = drops.reduce((d, m) => dropDrafted(d, { gw: g, ...m }), draftFor(ctx, P, id, g));
  const r1 = addMove(ctx, d1, g, main.out, id, by);
  let r = r1;
  for (const o of others) r = addMove(ctx, r.draft, g, o.out, o.in, by);
  if (r.problem) return buyPlan(ctx, id, g);
  const hitsAt = (ev) => ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  const funds = others.map((o) => ({ out: o.out, in: o.in }));
  return {
    kind: others.length ? 'two' : 'one', out: main.out, in: id, draft: r.draft, ev: r.ev, cmp: compare(ctx, r.ev, ev0), hits: Math.max(0, hitsAt(r.ev) - hitsAt(ev0)),
    ...(others.length ? { fund: funds[0], funds, short: r1.problem?.code === 'budget' ? r1.problem.short : 0 } : {}),
    ...(drops.length ? { drops: drops.map((m) => ({ out: m.out, in: m.in })) } : {}),
  };
}

/** GW g with player `id` brought in: the moves your plan doesn't make yet, and the WEEK's transfers and hits in all
 *  (the checker, 2026-10-09: "3 transfers, −4" printed the hits he adds after a bp and the week's own after a road, in a
 *  week paying −8): road, a solve's GW g; else bp, a buy (holdBuy) as its sale and funding sales, its engine week (as
 *  hitsAt reads it), with the moves of Forkcast's it drops (bp.drops); a chip week's pick, its changes to that squad
 *  (`chip`). → {moves, n, hits, drops, chip} | null */
export function weekWith(P, g, { road = null, bp = null } = {}) {
  if (bp?.kind === 'pick') {
    // a Wildcard or Free Hit week's pick (pickOfRoad): who leaves that week's chip squad for whom, and how many such
    // changes (never the chip's own transfers against the week before: review 5, 2026-10-12)
    const w = (bp.road.weeks || []).find((x) => Number(x.gw) === g);
    if (!w) return null;
    const now = weekOf(P, g)?.squad ?? [], sq = ids([...(w.xi || []), ...(w.bench || [])]);
    const moves = pairedMoves(now.filter((x) => !sq.includes(x)), sq.filter((x) => !now.includes(x)), P.L);
    return { moves, n: moves.length, hits: w.hits ?? 0, chip: squadWeek(weekOf(P, g)) };
  }
  if (road) {
    const w = (road.weeks || []).find((x) => Number(x.gw) === g);
    if (!w) return null;
    return { moves: pairMovesOf(road, g, weekOf(P, g)?.moves ?? [], P.L), n: (w.in || []).length, hits: w.hits ?? 0 };
  }
  if (bp?.kind !== 'one' && bp?.kind !== 'two') return null;
  const w = bp.ev.gws.find((s) => s.gw === g);
  return { moves: [{ out: bp.out, in: bp.in }, ...fundsOf(bp)], n: w?.transfers ?? 0, hits: w?.hits ?? 0, drops: bp.drops ?? [] };
}

/** How player `id` comes in from GW g in words, every move it makes and then the week's transfers and hit (weekWith):
 *  "Scott → B.Fernandes · Haaland → Thiago · 2 transfers, −4". The one description Add a player shows
 *  before the tap (the user, 2026-10-09: "why 'bring him in', 'find funds' and '+' all do different things"). */
export function inWords(P, g, how) {
  const nm = (x) => (x == null ? '—' : P.L.name(x));
  const w = weekWith(P, g, how);
  if (!w?.moves.length) return null;
  const said = (ms) => ms.map((m) => `${nm(m.out)} → ${nm(m.in)}`);
  // …and a move of Forkcast's own it replaces there (buyOfRoad's drops: the bring-in's verdict says the same, sideEffects)
  return [...said(w.moves), ...(w.drops?.length ? [COPY.replaces(said(w.drops).join(', '))] : []),
    w.chip ? COPY.chipChanges(w.chip, w.n) : `${w.n} transfer${w.n === 1 ? '' : 's'}, ${COPY.hitsIn(w.hits)}`].join(' · ');
}

/** Why `id` can't come in from GW g (a buyPlan 'none'), in one line: in your team already, the money even with one
 *  more sale (A3: "Try GW7" only when GW7 fits him), the club limit, every sale kept (B8), or no plan. */
export function buyProblem(ctx, P, id, bp) {
  const p = bp?.problem;
  const g = p?.gw ?? P.A;
  if (p?.code === 'owned') return COPY.inTeam(P.L.name(id));
  if (p?.code === 'club' || p?.code === 'kept') return problemText(ctx, p);
  if (p?.code === 'budget') {
    const next = fitsLater(ctx, P, id, bp);
    return COPY.noFit(P.L.name(id), p.short, g, next);
  }
  return COPY.infeasible(g);
}
/** The later week buyProblem names for a buy the money stops ("He fits in GW7"): the first after it one sale pays for
 *  him in (buyPlan 'one'), else null. */
export const fitsLater = (ctx, P, id, bp) => (bp?.problem?.code !== 'budget' ? null
  : P.gws.find((x) => x > (bp.problem.gw ?? P.A) && buyPlan(ctx, id, x).kind === 'one') ?? null);
/** B74 (the user, 2026-10-10): him from the later week a money refusal names (fitsLater), exactly the buy the other
 *  doors make there (buyPlan 'one' → bringIn, as Add a player's pill); then every sheet closes and
 *  Ahead opens on that week at its top, as theirs do (H1; B45: the address replaced, no new entry). → bool */
export function bringInFrom(ctx, id, g) {
  if (!bringIn(ctx, id, g, buyPlan(ctx, id, g))) return false;
  ctx.sheets?.closeAll();
  ctx.navigate?.('ahead', { gw: g }, { replace: true, top: true });
  return true;
}
/** buyProblem as a toast (kind as its caller's), with "Bring in from GW7" (bringInFrom) when it names a later week. */
export function sayBuyProblem(ctx, P, id, bp, kind = 'warn') {
  const next = fitsLater(ctx, P, id, bp);
  toastOf(ctx)(buyProblem(ctx, P, id, bp), kind, next == null ? {} : { action: { label: COPY.bringIn(null, next), onClick: () => bringInFrom(ctx, id, next) } });
}
/** B30: a buyPlan 'none' a solve may still get round with more sales (the money, a club's limit), so Add a
 *  player solves it; any other (in your team, every sale kept) is said at once. */
export const solvesRound = (bp) => bp?.kind === 'none' && ['budget', 'club', 'chip'].includes(bp.problem?.code);

/** " · Saka captain" when GW g's armband is another player's after an edit (A1: an edit never moves it unsaid). */
const captainMoved = (Q, prev, g) => {
  const c = weekOf(Q, g)?.captain, was = weekOf(prev, g)?.captain;
  return c != null && was != null && c !== was ? ` · ${COPY.captainNow(Q.L.name(c))}` : '';
};

/** "Reset plan" (the You sheet; the user, 2026-10-10: "a 'reset' button … so it forget all my choice rules and everything it
 *  cached … reset to the state of new team … the model side solves might still be cached"; and the pitch's Reset plan
 *  pill, 2026-10-21: "there is no easy reset all transfers button (currently it is behind user menu) - maybe place it
 *  small on pitch"): this GW's plan as a new team's (memory.reset) and this browser's lineups of the later GWs gone; the
 *  bundle's solves (the bake, the chips' pre-solves, a pair) stay. At once, its toast with Undo (both back). → bool */
export function resetPlan(ctx) {
  if (!editable(ctx)) { toastOf(ctx)(OFFLINE_EDIT, 'warn'); return false; }
  const I = info(ctx);
  const lus = clone(lineups(ctx, I)), gone = clone(removedBy(I));
  const prevP = plan(ctx);
  OV = null;
  CLASH = null;
  const r = memOf(ctx).reset();
  setLineups(ctx, I, {});
  REMOVED.by = {};  // nothing of yours: no move "removed by you" either (B129)
  flashLanding(ctx, prevP, { gws: I.gws });
  say(ctx, COPY.planReset, undoOf(ctx, subjectOf(COPY.planReset), () => { if (!r.undo()) return false; setLineups(ctx, I, lus); REMOVED.by = gone; }));
  return true;
}
/** Plan view P holds a transfer, chip or rule of yours (any pin but the derived ones, the hold's and You → Hits': your
 *  asks, asksOf, and a call's road pin), or a move you took off this session (B129: "removed by you"), which Reset plan
 *  takes off: the pitch's Reset plan pill shows (the user, 2026-10-21: "there is no easy reset all transfers button";
 *  the owner, 2026-10-26: "find why reset button also hid if something was preventing raya from suggestions": it
 *  counted your pins alone); a lineup of yours alone is Reset lineup's. → bool */
export const planHasYours = (P) => (P?.pins || []).some((p) => !derivedPin(p)) || Object.values(removedBy(P)).some((x) => x.length > 0);

/** You → Hits (the user, 2026-10-12: "auto plan allowed hits must be somewhere in settings, in here only chips"): the
 *  hits Forkcast may take a week, one setting for every week, its choices [[n, label]]: None, then each cap up to the
 *  solver's own (meta.hit_cap: "−4", "−8"), and the one in force (`at`: memory's Plan.hitsMax, else the solver's own cap;
 *  none known, None and −4). */
export function hitsChoices(P) {
  const cap = hitCap(P?.b?.meta);
  const top = cap ?? 1;
  const at = P?.mem?.hitsMax ?? top;
  return { at: Math.min(at, top), choices: Array.from({ length: top + 1 }, (_, n) => [n, COPY.hitsSeg(n)]) };
}
/** Set You → Hits to n (an edit: its toast, its verdict against the plan before, Undo; the solver's own cap is no
 *  setting). → bool */
export function setHitsMaxWithUndo(ctx, n) {
  const P = plan(ctx);
  const { at } = hitsChoices(P);
  if (n === at) return false;
  const cap = hitCap(P?.b?.meta);
  const what = COPY.hitsMax(n);
  return edit(ctx, { from: info(ctx)?.A, what, text: vsPrev(ctx, what), hitsMax: cap !== null && n >= cap ? null : n });
}

/** F17: the chip GW g's plan plays when it is a Wildcard or Free Hit ('wc' | 'fh'), else null: such a week says over its
 *  squad what the chip does there (COPY.chipWeek). */
export function chipWeek(P, g) {
  const c = weekOf(P, g)?.chip ?? P?.mem?.chips?.[g] ?? null;
  return c === 'wc' || c === 'fh' ? c : null;
}

/** F9 / F13 / F17: GW g's transfer mode (no control of its own since 2026-10-12):
 *  'roll' (Forkcast adds no transfer that GW: the hold's, or a Roll rule, memory.pinRoll: a suggested plan's +), 'free'
 *  (no hits: a cap of 0, You → Hits' None or an older plan's pinHits 0), 'h<n>' (at most n hits, below the default),
 *  else 'auto' (no cap: the solver's own default, meta.hit_cap). */
export function gwMode(P, g) {
  // a Roll of yours, or the hold's (no transfer unless you add one: memory.holdOf)
  if (P.pins.some((p) => p.id === `roll:${g}` || (p.id === 'hold' && (p.rolls || []).includes(g)))) return 'roll';
  // a hits rule of GW g (pinHits: an older plan's) is its setting whatever the hold keeps there: a week under a hits
  // rule is the planner's (holdOf), the hold only keeps a player you sell later through it (the checker, 2026-10-09: "Up to −8" in
  // GW7 with Calvert-Lewin sold in GW8 read Off, and Off did nothing)
  const mine = P.pins.some((p) => p.id === `hits:${g}`);
  // A1: a week the hold keeps to your own moves (it holds the squad they make) is still 'roll': Forkcast adds no transfer
  // of its own there, so adding one of yours never changes the week's mode
  if (!mine && P.pins.some((p) => p.id === 'hold' && parseSpans(p.must || []).some(([, a, b]) => a <= g && g <= b))) return 'roll';
  // …and one it caps at your moves after a week the planner chose (holdOf's caps): 'roll' too
  if (!mine && P.pins.some((p) => p.id === 'hold' && p.caps?.[g] != null)) return 'roll';
  const n = composePins(P.pins, { from: g, to: g }).hits[g];
  const cap = hitCap(P.b?.meta);
  if (n === undefined || (cap !== null && n >= cap)) return 'auto';
  return n === 0 ? 'free' : `h${n}`;
}

/** Rules of yours `pins` a choice takes back, as one clause: {pins, text (COPY.altClash: "Roll · GW6, Groß from GW7
 *  removed", each named as its chip says it, ruleOf)} | null when there are none. */
// A week's freeze (a take's Roll with its moves, "GW8 frozen") goes unnamed beside a sale of that week said as what a
// Keep undoes (`gone`: "Saka kept in GW8 instead of Palmer"; the user, 2026-10-22: two lines at most; the take's toast
// named it as it was made); the × names it (the review, 2026-10-13: it went unsaid)
const takenBack = (P, pins, gone = []) => {
  const sold = [...pins, ...gone].filter((q) => q?.kind === 'sell').map((q) => Number(q.gw));
  const said = pins.filter((q) => !(isRoll(q) && Number(q.caps?.[q.gw] ?? 0) > 0 && sold.includes(Number(q.gw))));
  return said.length ? { pins, text: COPY.altClash(said.map((q) => plainRule(P, q))) } : null;
};
/** A9: a rule as a toast names it, plainly: a transfer as its move ("Chilwell → Bassey"), a buy as "Saka in", any other
 *  as its chip says it. */
const plainRule = (P, q) => {
  const nm = P.L.name;
  if (q.kind === 'sell' && q.in != null) return `${nm(q.player)} → ${nm(q.in)}`;
  if (q.kind === 'slide') return `${nm(q.out)} → ${nm(q.player)}`;
  return ruleOf(P, q).text;
};
/** B12: a choice of yours as its row in the plan says it: a transfer as its move and GW ("Scott → Groß · GW6", plainRule),
 *  any other as its chip ("Keep Scott · GW6", "Up to −4 · GW8", "BB · GW9"). */
const rowName = (P, q) => `${plainRule(P, q)}${(q.kind === 'sell' && q.in != null) || q.kind === 'slide' ? ` · GW${q.gw}` : ''}`;

/** GW A's price watch (calls.priceWatch: FPL's price changes before the deadline, what waiting costs and puts out of
 *  reach) for the plan as drawn (draftOf: the solver's) from the bank it starts from (inputs: baseOf), per plan view
 *  and minute (a night passing changes it). */
const WATCHES = new WeakMap();
export function watchOf(ctx) {
  const P = plan(ctx);
  if (!P) return null;
  const minute = Math.floor(Date.now() / 60000);
  let c = WATCHES.get(P);
  if (!c || c.minute !== minute) WATCHES.set(P, (c = { minute, watch: priceWatch(inputs(ctx), draftOf(ctx)) }));
  return c.watch;
}

/** A price watch drawn (a GW-A transfer row's details): with `move` {out, in}, that move's line (each
 *  player's arrow in FPL's colours: green rises, red drops) | null; without, the foot: the call to act (or what waiting
 *  costs or gains) and how old FPL's reading is, with a "Hide" when `wait` is given (B139: it puts the watch
 *  away) | null. */
export function watchView(watch, { move = null, cls = '', wait = null } = {}) {
  if (!watch) return null;
  if (move) {
    const m = watch.moves.find((x) => x.out === Number(move.out) && x.in === Number(move.in));
    if (!m?.parts.length) return null;
    // the arrow is colour and shape only: the words after it say the direction ("very likely to rise")
    return h(`span.pw-move${cls}`, null, m.parts.flatMap((p, i) => [
      i ? ' · ' : null, h('span', { 'aria-hidden': 'true', class: { 'pw-up': p.dir > 0, 'pw-down': p.dir < 0, 'pw-maybe': !p.sure } }, p.text.slice(0, 1)), p.text.slice(1)]));
  }
  if (!watch.line) return null;
  return h(`div.pw-foot${cls}`, { class: { act: watch.tone === 'act' }, role: watch.tone === 'act' ? 'status' : null },
    // the reading's time as the line's quiet tail, after its sentence without the full stop ("… gains £0.1m · as of 00:50")
    h('p.pw-line', null, watch.note ? watch.line.replace(/\.$/, '') : watch.line, watch.note ? h('span.pw-note', null, ` · ${watch.note}`) : null),
    wait ? h('button.ah-lnk.pw-wait', { type: 'button', 'aria-label': COPY.watchWaitSaid, onClick: wait }, COPY.watchWait) : null);
}

/** The deadline's words, per deadline (QA-7 #2: toLocale*String makes a formatter each call, tens of ms on a phone, and
 *  the countdown asks every second). */
let DL_WORDS = { ms: NaN, hm: '', wd: '', date: '', long: '' };
function deadlineWords(ms) {
  if (DL_WORDS.ms !== ms) {
    const d = new Date(ms);
    const hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const wd = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const dm = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    DL_WORDS = { ms, hm, wd, date: `${wd} ${dm} ${hm}`, long: `${wd} ${dm} at ${hm}` };
  }
  return DL_WORDS;
}

/** The deadline as the header shows it: local "Sat 10 Oct 11:00" (long: "Sat 10 Oct at 11:00"), "7d 14h" / "3h 05m" / "42:10" (< 1 h),
 *  tone '' | 'soon' (< 24 h, amber) | 'urgent' (< 2 h, coral); left ≤ 0 once it has passed. */
export function deadlineInfo(epoch) {
  const ms = toMs(epoch);
  if (!Number.isFinite(ms)) return { ms, left: NaN, date: '', long: '', short: '', text: '', said: '', tone: '' };
  const { hm, wd, date, long } = deadlineWords(ms);
  const left = ms - Date.now();
  let sec = Math.max(0, Math.floor(left / 1000));
  const dd = Math.floor(sec / 86400); sec -= dd * 86400;
  const hh = Math.floor(sec / 3600); sec -= hh * 3600;
  const mm = Math.floor(sec / 60); const ss = sec % 60;
  const p2 = (n) => String(n).padStart(2, '0');
  const text = left <= 0 ? 'deadline passed' : dd > 0 ? `${dd}d ${hh}h` : hh > 0 ? `${hh}h ${p2(mm)}m` : `${p2(mm)}:${p2(ss)}`;
  // under seven days the weekday is enough; from seven days on the date, else "Sat 13:00" reads as this Saturday
  const said = left <= 0 ? text : COPY.leftSaid(dd, hh, mm, ss);
  return { ms, left, date, long, short: left >= 7 * 86400e3 ? date : `${wd} ${hm}`, text, said, tone: left <= 0 ? '' : left < 2 * 3600e3 ? 'urgent' : left < 86400e3 ? 'soon' : '' };
}

/** GW A's deadline has passed (the bundle keeps GW A as next until FPL publishes this team's GW A picks, then plans
 *  from GW A+1: api/mobile.py live_week). */
export const isLive = (ctx) => deadlinePassed(ctx.bundle?.meta);
/** Your FPL team to set week w of plan view P against (app.js fplTeam: FPL's XI, bench and armbands as of the last
 *  deadline): GW A's alone, a later GW has none (the pitch's marks: pitchProps; the week line's notice: fplSets). */
const fplOf = (ctx, P, w) => (w?.gw === P.A ? ctx.data?.fpl ?? null : null);
/** The GW whose team FPL's last published picks are, the team fplOf sets GW A against (api/entry.py: the solver's
 *  state_round, the last GW before GW A not played as a Free Hit: FPL gives the squad before it back), or null. */
const fplGw = (P) => {
  const fh = new Set((P.b?.entry?.chips_used || []).filter((u) => u.chip === 'fh').map((u) => Number(u.gw)));
  let s = P.A - 1;
  while (s > 0 && fh.has(s)) s--;
  return s > 0 ? s : null;
};
/** The substitutions that make GW A's pitch of your FPL team `fpl` (fplSets' Week-sheet row; the review of the first-use
 *  proposals, 2026-10-21: "to match this pitch" was false where a buy took a sold starter's place in FPL, or the bench's
 *  order still differed): FPL's lineup once week w's transfers are made there, each buy in his sold player's place, as
 *  FPL places him (engine.applyLineup, as asTaken plays your saved lineup), set against the pitch's: each of its subs
 *  the pitch starts (`on`, in the pitch's order) for one of its starters the pitch benches (`off`), who takes his place
 *  on the bench as FPL swaps them: the one the pitch puts in that place of the bench where it can (the keeper for the
 *  keeper), so the bench's order follows; `order` the pitch's outfield subs in its order where it still differs, else
 *  null (pitch.subOrder: the keeper has no number); `buys` the week's. Pure. → {subs: [{on, off}], order, buys: Set} */
export function fplSubs(fpl, w, L) {
  const was = E.applyLineup(w, fpl, L);
  const gk = (id) => L.pos(id) === 'GK';
  const field = (b) => b.filter((id) => !gk(id));
  const xi = w.xi.map(Number), want = field(w.bench.map(Number)), bench = field(was.bench);
  const off = was.xi.filter((id) => w.bench.map(Number).includes(id));
  const subs = xi.filter((id) => was.bench.includes(id)).map((id) => {
    const k = bench.indexOf(id);
    const out = gk(id) ? off.find(gk) : off.includes(want[k]) ? want[k] : off.find((x) => !gk(x));
    if (out != null) off.splice(off.indexOf(out), 1);
    return { on: id, off: out };
  }).filter((s) => s.off != null);
  const after = bench.map((id) => subs.find((s) => s.on === id)?.off ?? id);
  return { subs, order: after.every((id, i) => id === want[i]) ? null : want, buys: new Set(w.moves.map((m) => Number(m.in))) };
}
/** GW A's lineup as the pitch draws it where it differs from the one set in FPL (the user, 2026-10-21: fix all
 *  (first-use proposal #4); Tom, first use: "Is this my team or the app's version of it?"): the players the cards call
 *  "on your FPL bench: the plan starts him" and "starts in your FPL team: the plan benches him" (pitch.js fplMarks),
 *  their names in the pitch's order, {start, bench}; null where nothing is left to set in FPL once the week's transfers
 *  are made there (no player changing places, the same armbands, the same bench order: the owner, 2026-10-29, "fix all",
 *  of "set in fpl ... appeared randomly ... now it just missing": an armband or a bench order alone said nothing), in a
 *  later GW, with no FPL team, or while GW A is under way (FPL has it).
 *  Said as a notice of the week line (weekModel), never a mark on the shirts (the user, 2026-10-09: "remove these
 *  labels"). Its Week-sheet row says only what is true (the review of the first-use proposals, 2026-10-21: FPL's team is
 *  the last deadline's, a lineup set in FPL since is not seen): the GW that team is for (`gw`: fplGw), the substitutions
 *  that make the pitch of it (`subs`: fplSubs, by name, `buy` where one is a buy: after the transfers), the pitch's
 *  captain and vice where FPL's differ (`captain`, `vice`), its bench order where the subs leave another (`order`) and
 *  the buys by name (`buys`: a step for one is said after the transfer, COPY.setInFplRow). */
export function fplSets(ctx, P, w) {
  if (!w || isLive(ctx)) return null;
  const fpl = fplOf(ctx, P, w);
  const marks = [...fplMarks(fpl, w)];
  const x = fpl && fplSubs(fpl, w, P.L);
  if (!x) return null;
  const nm = P.L.name;
  const of = (move) => marks.filter(([, m]) => m.move === move).map(([id]) => nm(id));
  const arm = (k) => (w[k] != null && num(fpl[k]) !== num(w[k]) ? nm(w[k]) : null);
  const captain = arm('captain'), vice = arm('vice');
  if (!x.subs.length && !x.order && !captain && !vice) return null;
  return {
    start: of('start'), bench: of('bench'), gw: fplGw(P),
    subs: x.subs.map((s) => ({ on: nm(s.on), off: nm(s.off), buy: x.buys.has(s.on) || x.buys.has(s.off) })),
    captain, vice, order: x.order?.map(nm) ?? null, buys: [...x.buys].map(nm),
  };
}
/** No edit reaches GW g: GW A under way (FPL has it: memory.inkClash judges added pins so); a frozen GW too (§7.7 ink,
 *  isFrozen: none since Freeze went, 2026-10-12). */
export const inkAt = (ctx, P, g) => isFrozen(P, g) || (Number(g) === P.A && isLive(ctx));
/** The card's Sell · From GW…: the first week from GW g player `id` can be sold in (still yours going into it, and an
 *  edit reaches it: inkAt; the reviews, 2026-10-11: a frozen GW8 offered a sale the edit refused), never a Free Hit
 *  week (review 5, 2026-10-12: FPL makes no lasting transfer there, but the sale stood from it to the end), or null. */
export const sellWeek = (ctx, P, id, g) => P.gws.find((x) => x >= g && squadBefore(P, x).includes(id) && !inkAt(ctx, P, x) && squadWeek(weekOf(P, x)) !== 'fh') ?? null;
/** The GW taking ask `p` off re-plans from (liftAsk): its own, GW A for one of every week. */
const liftFrom = (P, p) => Math.max(P.A, num(p.gw) ?? P.A);
/** B7: taking ask `p` off re-plans GW A under way (liftFrom): FPL has it, so no Remove (Your rules, a rule's sheet, the
 *  status row, the player card's Remove and Off) and liftAsk refuses it (memory.inkClash judges added pins; a drop adds
 *  none). */
export const liftsLive = (ctx, P, p) => isLive(ctx) && liftFrom(P, p) === P.A;

/** The avatar's letters (Ahead's header and the You sheet): the manager's initials, else the team's. */
export function initials(e) {
  const words = String(e?.manager || e?.team_name || '?').trim().split(/\s+/).filter(Boolean);
  const str = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2);
  return str.toUpperCase();
}

/** The rail's "reroute like Apple Maps" sweep from GW g on (after a Wish lands). */
export function reroute(g) {
  const ticks = [...document.querySelectorAll('.ah-tick[data-gw]')].filter((t) => Number(t.dataset.gw) >= g);
  ticks.forEach((t, i) => setTimeout(() => { t.classList.remove('reroute'); void t.offsetWidth; t.classList.add('reroute'); }, (reduceMotion() ? 0 : 140) * i));
}

// ---------------------------------------------------------------- small shared view pieces (sheets reuse them)

/** A kit shirt for a player id (kits.js; the GK kit by position). */
export const shirtOf = (L, id, size = 28) => shirt({ club: L.club(id), gk: L.pos(id) === 'GK', size });

/** B1: a gain that beats the forecast's noise: green, a solid +, a filled button, a "Best". cmp {delta, label}: a
 *  compare result (its label: engine.verdictLabel against the noise), or a bare gap g as
 *  {delta: g, label: E.verdictLabel(g, noise)}. */
export const clearGain = (cmp) => !!cmp && cmp.delta > 0 && cmp.label !== 'coin';
/** A suggested plan row's green, solid + and filled Why button (plansOf's rows): its number past the noise; the roll's
 *  own row (no number: `refRow`) when its plan beats the best other row's past the noise (`vsBest`); in a week with your
 *  transfer, Wildcard or Free Hit, past your own choice's too (`vsMine`), a move you took off this session too (plansOf
 *  `removed`: its words say so; B129's quiet, its number grey, went: the owner, 2026-10-26, after Raya +2.4 lost its ink to Tavernier +0.8 once its moves were removed: "find why and fix"). Never one the 2026-10-18 bars
 *  keep from being the week's suggestion (plansOf `early`: listed since the user's "Same both times, worse ones too",
 *  2026-10-21, never recommended). */
export const plPays = (pl) => !pl.early && clearGain(pl.refRow ? pl.vsBest : pl.cmp) && (!pl.vsMine || clearGain(pl.vsMine));
/** What a checked choice's row, its spoken line and its card's note in his place say of the 2026-10-18 bar it doesn't
 *  pass where its number may not show it (plansOf `early`, a GW: "as good in GW9"; one that adds next to nothing when
 *  taken says so by its number, or by its Why sheet's "Your total" where that differs), else null. Pure. */
export const earlyWords = (pl) => (pl?.state === 'ready' && typeof pl.early === 'number' ? COPY.asGoodIn(pl.early) : null);
/** B52 (podmajersky): the head of GW g's row when it has no transfer says who left it empty, the week's status beside
 *  the goal (statusTok): no edit reaches it (`ink`: GW A under way, inkAt) "No transfers"; your Roll (`lock`: rollingAt)
 *  "Rolling ✓"; under the hold (`hold`) the week you roll, "Rolling", "Rolling is best" once settled with nothing
 *  better (`best`: the user, 2026-10-23), never "No transfers yet" (the owner, 2026-10-26: "no transfer yeat remove since
 *  rolling already show it"; its "No transfer pays this week" when no listed plan beat yours went: the user, 2026-10-18,
 *  "remove 'no transfer pays the week'"); off the hold a week Forkcast adds no transfer to (`off`:
 *  a later week drawn from the plan before an edit still checked: rollFacts; gwMode 'roll' too, a Roll a plan's + stored, addPlan) "No transfers", one
 *  Forkcast's plan leaves empty "Forkcast rolls GW8". Pure. */
export const emptyHead = (g, { ink = false, hold = false, off = false, lock = false, best = false } = {}) => (ink ? COPY.noTransfers
  : lock ? COPY.rollingOn : hold ? (best ? COPY.rollingBest : COPY.rollingNow) : off ? COPY.noTransfers : COPY.forkcastRolls(g));
/** A4: the facts under a week with no transfer (the week line's second line, rollFacts), each with its spoken words: GW
 *  `gw`'s free transfers first (`ft`), then its bank after the week's moves (the user, 2026-10-21: "where it shows itb
 *  money", chose "On the week line": `bank`, the plan view's week bank, w.bank, the figure Replace's header and the
 *  transfer rows' money ties count in), in FPL's word, "£0.8m ITB", then what rolling makes next week (`next`; none in the window's last GW): "2 FT · £0.8m ITB · 3 FT in
 *  GW10", read "2 free transfers, £0.8 million in the bank, 3 free transfers in gameweek 10". No bank below 0: a short
 *  one is bankWarn's words (after these, as before: never both). Pure. → [[text, said]] */
export function factsWords({ gw, ft, next = null, bank = null }) {
  return [[COPY.ftNow(ft), COPY.ftNowSaid(ft)], itbWords(bank),
    next != null ? [COPY.rollKeeps(next, gw + 1), COPY.rollKeepsSaid(next, gw + 1)] : null].filter(Boolean);
}
/** A week's bank in FPL's word with its spoken words (factsWords; the week line's lead where its facts aren't drawn:
 *  bankLead), "£0.8m ITB": the solver's plan's, never an edit's ≈ ("≈£0.5m" while its check marked the week, until the
 *  owner, 2026-10-26: "fix so every squad is solver squad"); null for none or a short one (bankWarn's words). Pure. →
 *  [text, said] | null */
export function itbWords(bank) {
  const money = bank != null && bank >= -1e-9 ? fmt.money(Math.max(0, bank)) : null;
  return money ? [COPY.itb(money), COPY.itbSaid(money)] : null;
}
/** A roll's Why sheet line (openPlanWhy: a choice with no move or chip in GW g; the user, 2026-10-22: rolling never said
 *  what it does to the free transfers): what it leads to next GW, "4 FT in GW9" (the week's own before its transfers,
 *  engine.nextFt with next week's grant, as weekFacts), at the cap (nextFt adds none: the rules', never typed here) that
 *  rolling adds none; none in the window's last GW. Pure. → [text] */
export function rollFt(P, g, pl) {
  const w = weekOf(P, g), nx = P.gws.find((x) => x > g);
  if (pl.choice.moves.some((m) => m.gw === g) || pl.choice.chips?.[g] || !w || nx == null) return [];
  const ft = w.ft ?? 1, next = E.nextFt(ft, 0, E.ftGrant(P.season, nx));
  return [next > ft ? COPY.rollKeeps(next, nx) : COPY.rollCapped(ft, nx)];
}
/** GW w's facts on plan view P (factsWords): its free transfers, its bank, and the free transfers rolling makes next
 *  week (engine.nextFt, with next week's grant). Pure. → [[text, said]] */
export function weekFacts(P, w) {
  const g = w.gw, ft = w.ft ?? 1;
  const next = g < P.end ? E.nextFt(ft, w.used ?? 0, E.ftGrant(P.season, g + 1)) : null;
  return factsWords({ gw: g, ft, next, bank: w.bank });
}


/**
 * F12: the bundle's chip pre-solves (api/mobile.py chip_plan: one pooled solve per chip still available × GW, made in
 * the background once the roads are in), each against the model's road: {at(chip, gw) → {state: 'ready' (road, cmp)
 * | 'solving' | 'none'}, best: {chip: {gw, delta, label, final}} (its best GW when it gains: chipBests), asked(chip, gw)
 * → when its solve started (ms, the bake's item `started`) | null}. Both roads are the model's (no
 * rules of yours), so the gap is the chip's own on the model's plan, each with your lineups on it (asYours, as the
 * preparations are measured: the reviews, 2026-10-11, a Triple Captain counted the model's captain, not your
 * armband). Memoised per bundle and your lineups.
 */
/** The GWs Chips… was opened on for the team on screen (app.js askChips): only their chips are solved, the server's
 *  pre-solves (the bundle's cg) and your rules' preparations (chipPreps) alike (the owner, 2026-10-28: "fix so no chips
 *  are presolved until 'chips..' button is clicked and then solve on the gw it clicked"). → [gw] */
export const chipsAsked = (ctx) => {
  const v = ctx.store?.get('chipsAt');
  return v && String(v.entry) === String(ctx.bundle?.entry?.id ?? ctx.store.get('entry')) ? v.gws : [];
};

const CHIPS_AT = new WeakMap();
export function chipPresolves(ctx) {
  const b = ctx.bundle;
  if (!b?.roads?.base) return { at: () => ({ state: 'none' }), best: {} };
  // (plan memory read from the store: a background caller never attaches it)
  const gp = ctx.store.get('memory') ?? null;
  const lu = JSON.stringify([gp?.lineup ?? null, lineups(ctx, info(ctx)), chipsAsked(ctx)]);
  let r = CHIPS_AT.get(b);
  if (r?.lu === lu) return r;
  const prog = b.bake?.chips ?? null;
  const itemOf = (k) => prog?.items?.find((x) => x.key === `chip:${k}`);
  const memo = new Map();
  const at = (c, g) => {
    const k = `${c}@${g}`;
    if (memo.has(k)) return memo.get(k);
    const road = b.roads.chip?.[k] ?? null;
    const it = itemOf(k);
    // (a GW whose chips nobody asked for (chipsAsked): none, never "checking…", and `unasked`: no best week stands
    // while it is, chipBests)
    const asked = chipsAsked(ctx).includes(g);
    const v = road ? { state: 'ready', road, cmp: compare(ctx, asYours(ctx, road, gp), asYours(ctx, b.roads.base, gp)) }
      : (it ? ['waiting', 'queued', 'running'].includes(it.state) : !!prog?.pending && asked) ? { state: 'solving' }
        : { state: 'none', error: it?.error ?? null, ...(it || asked ? {} : { unasked: true }) };
    memo.set(k, v);
    return v;
  };
  const asked = (c, g) => { const s = Number(itemOf(`${c}@${g}`)?.started); return s > 0 ? s * 1000 : null; };
  CHIPS_AT.set(b, (r = { lu, at, asked, best: chipBests(at, ctx.data?.horizon || [], inputs(ctx).noise) }));
  return r;
}

/** A chip week's check is in: solved or failed, not still solving, and asked (a week nobody opened Chips… on reads
 *  `unasked`: chipsAsked; the owner, 2026-10-28, "should not say which is best since others not solved"). */
const chipSettled = (x) => x.state !== 'solving' && !x.unasked;

/**
 * Each chip's best GW of `gws` by at(chip, gw) when it gains: {chip: {chip, gw, delta, label, final, clear, runner,
 * next}}.
 * final: none of that chip's GWs is still solving; until then the best may move (never a best picked from the finished
 * solves alone as if it were the answer). clear (M3): the best beats the runner-up week (`next`, the next best GW, its
 * gain `runner`; or 0 and null when no other week is solved) by more than a negligible gap under the same verdict the
 * alternatives use (engine.verdictLabel(best − runner-up, noise) is not 'coin'): a "best week" inside the forecast
 * noise is no best week. The gaps are the shown ones (each chip week's delta, as the sheet lists them). Exported for
 * the node tests.
 */
export function chipBests(at, gws, noise = 0) {
  const best = {};
  const gap = (x) => x.cmp.delta;
  for (const c of E.CHIPS) {
    const ready = gws.map((g) => ({ g, x: at(c, g) })).filter(({ x }) => x.state === 'ready');
    const top = ready.filter(({ x }) => x.cmp.delta > 0.05).sort((a, b) => b.x.cmp.delta - a.x.cmp.delta)[0];
    if (!top) continue;
    const next = ready.filter(({ g }) => g !== top.g).sort((a, b) => gap(b.x) - gap(a.x))[0] ?? null;
    const runner = next ? gap(next.x) : 0;
    const clear = E.verdictLabel(gap(top.x) - runner, noise) !== 'coin';
    best[c] = { chip: c, gw: top.g, delta: top.x.cmp.delta, label: top.x.cmp.label, runner, next: next?.g ?? null, clear,
      final: gws.every((g) => chipSettled(at(c, g))) };
  }
  return best;
}
/** A chip's honest best GW (M3): final and clear, else null. The one rule for its choice's week (plansOf)
 *  and the chip toast's "less than GW9" (B72, the user, 2026-10-10: no mark on a week that only ties the next). */
const honestBest = (src, c) => (src.best[c]?.final && src.best[c].clear ? src.best[c] : null);
/** Findings #14 (Kenji, 2026-10-21: after a new forecast the "Free Hit +9.2" pill went for minutes, unsaid): a new
 *  forecast's pre-solves come in after its roads (api/mobile.py: the chips start once every road is queued), and while
 *  any week of a chip's still solves it has no honest best week. So the last one seen for the team and GW A (entry:GW A
 *  → {chip: best}) stands until the newer pre-solves of that chip are all in; then their own verdict (none: gone). The
 *  suggested plans' chip week (plansOf) → the honest best | null */
const CHIP_KEPT = new Map();
const keptBest = (P, src, c, g) => {
  // over GW g's half of the window, as every chip's best week is (halfBests; the review of round 7, 2026-10-22: over the
  // whole window a Free Hit's best week in the other half left this half's "too close to call" when its best was clear)
  const { here, best } = halfBests(P, src, g);
  const k = `${P.entry}:${P.A}:${here[0]}`;
  if (!CHIP_KEPT.has(k)) CHIP_KEPT.set(k, {});
  const kept = CHIP_KEPT.get(k);
  if (here.some((x) => src.at(c, x).state === 'solving')) return here.includes(kept[c]?.gw) ? kept[c] : null;
  return (kept[c] = honestBest({ best }, c));
};
/** The week the pitch offers Wildcard or Free Hit `c` in (plansOf's squadOk: its kept honest best of the pre-solves `src`,
 *  chipPresolves, where it beats not playing it past the noise) → that best | null. The one rule for the pitch's chip
 *  week and the Chips sheet's best week of those chips (chipStates; the user, 2026-10-22: Chips… said "Best week: GW9"
 *  beside a GW8 Free Hit token). */
const chipWeekOf = (P, src, c, g) => { const b = keptBest(P, src, c, g); return b && clearGain(b) ? b : null; };
/** GW g's half of the window (`here`) and each chip's best week inside it (chipBests over src.at): the Chips sheet's
 *  and the chip toast's rival weeks, a chip being one per half (the pre-release review, 2026-10-13: "Best week: GW20"
 *  on a first-half week). */
const halfBests = (P, src, g) => {
  const half = halfEnd(P);
  const here = P.gws.filter((x) => (x <= half) === (g <= half));
  return { here, best: src ? chipBests(src.at, here, P.noise) : null };
};

/** The chips, in their order. */
const CHIP_ROW = ['bb', 'tc', 'fh', 'wc'];
/** The first half's last GW (the bundle's meta.chip_half, else engine.HALF): chips refill after it. */
const halfEnd = (P) => Number(P.b.meta?.chip_half ?? E.HALF);
/** The GW a chip played in GW g comes back (the second half's first, halfEnd), null in the second half: Chips…'s "back
 *  GW20" and a Wildcard's or Free Hit's Why sheet's "next one GW20" (COPY.chipUses; the user, 2026-10-22). */
export const chipBack = (P, g) => (g <= halfEnd(P) ? halfEnd(P) + 1 : null);
/** The chips GW g may play: each one still available in g's half (a used one is left out), in CHIP_ROW's order. The
 *  entry's chips_available is GW A's half's stock (the solver's ChipAuto.stock), so it counts only there, as
 *  engine.canUseChip reads it; in the other half only the chips played there do (the review, 2026-10-13: a Wildcard
 *  refilled after GW19 read "Played" in GW20). */
export const chipsAvail = (P, g) => {
  const e = P.b.entry;
  const half = halfEnd(P);
  const here = (x) => (x <= half) === (g <= half);
  return CHIP_ROW.filter((c) => !(e.chips_used || []).some((u) => u.chip === c && here(u.gw)) && (!here(P.A) || (e.chips_available || []).includes(c)));
};
/** N7: a Free Hit or Wildcard week ('fh' | 'wc'), whose moves are the squad the chip makes, or null. */
export const squadWeek = (w) => (w?.chip === 'fh' || w?.chip === 'wc' ? w.chip : null);
/**
 * N7: a Free Hit or Wildcard week's gain against the same plan without that chip, the chip toast's measure off the hold
 * (chipPlan: the plan with it against the plan before it): your plan against the bundle road that is your plan with
 * that GW's chip pin taken off (baked; the model's own chip there: with a 'none' chip pin for that GW), with your lineups
 * on it (asYours) → {delta, label} | null while no such road is in. Once per plan view. Review 5 (2026-10-12): with no
 * such road, the gain the chip's own toast said (chipPlan: the plan with it against the plan before it, chipTold), as
 * long as your rules stand (a Free Hit's value left the row the moment its toast had said it). Under your team as it
 * is a Wildcard's or Free Hit's week counts against rolling instead (chipWeekGain; the user, 2026-10-22: "vs rolling
 * everywhere"); a Bench Boost's or Triple Captain's always against not playing it (they change no transfer).
 */
const CHIP_GAINS = new WeakMap();
// entry:GW A → {sig, by: Map(g → the chip toast's cmp)}: kept while your rules and the hold stand (review 5,
// 2026-10-12: keyed on the plan memory, which every emit makes afresh, the gain left the row at once)
const CHIP_TOLD = new Map();
const toldSig = (P) => JSON.stringify([!!P.mem?.hold, asksOf(P)]);
const chipTold = (Q, g, cmp) => {
  if (!Q?.mem || typeof Q.mem !== 'object') return;
  const k = `${Q.entry}:${Q.A}`, sig = toldSig(Q);
  if (CHIP_TOLD.get(k)?.sig !== sig) CHIP_TOLD.set(k, { sig, by: new Map() });
  CHIP_TOLD.get(k).by.set(g, cmp);
};
const toldOf = (P, g) => { const t = CHIP_TOLD.get(`${P.entry}:${P.A}`); return t?.sig === toldSig(P) ? t.by.get(g) : null; };
export function chipGain(ctx, P, g) {
  let by = CHIP_GAINS.get(P);
  if (!by) CHIP_GAINS.set(P, (by = new Map()));
  if (!by.has(g)) {
    const id = `chip:${g}`;
    const ref = P.pins.some((p) => p.id === id) ? baked(ctx, [], [id], P) : baked(ctx, [pinChip(g, null)], [], P);
    by.set(g, ref?.weeks ? compare(ctx, { weeks: P.weeks }, asYours(ctx, ref)) : null);
  }
  return by.get(g) ?? (P.mem && typeof P.mem === 'object' ? toldOf(P, g) : null) ?? null;
}
/** Your Wildcard or Free Hit week's number (the week line's, Chips…'s row of it; the user, 2026-10-22: "vs rolling
 *  everywhere", after the week line's "vs not playing it" beside the token's and toast's "vs rolling"): under your team
 *  as it is your chip's plan against the week's roll plan, Forkcast's later moves on both sides (weekRollOf, as a week
 *  with transfers says its own: weekGain; the measure Chips… and the toast read before it is played: vsRollOf in plansOf's
 *  chipOf), `wait` while either still solves (plansOf `pending`); off the hold against not
 *  playing it (chipGain). `listed`: the week's list (plansOf; Chips…: plansListed, no solve asked) → {cmp | null, wait,
 *  vs: its baseline's words | null} */
export function chipWeekGain(ctx, P, g, listed = (x) => plansOf(ctx, P, x)) {
  if (!P.mem?.hold) return { cmp: chipGain(ctx, P, g), wait: false, vs: null };
  const r = weekRollOf(ctx, P, weekOf(P, g), listed);
  return { cmp: r, wait: !r && !approxAt(P, g) && !!listed(g)?.pending, vs: r ? COPY.planVsRoll : null };
}
/** A player's forecast for GW g as the pitch draws it (pitch.xpAt on the bundle's row, fmt.pts), '–' when none: the
 *  why line, the week line and the player sheet's rows read this one number. */
export const xpShown = (ctx, id, g) => {
  const d = ctx.data;
  const x = ctx.pitch?.xpAt?.(d?.byId?.get(Number(id)), g, d?.xpGws);
  return x == null ? '–' : fmt.pts(x);
};
/** The GW your plan plays chip c in (its road's, else a chip pin of yours), or null; with `g`, the one in g's half other
 *  than g (a chip is one per half: the pre-release review, 2026-10-13, a Wildcard planned in both halves read as free
 *  in the second). */
const plannedAt = (P, c, g = null) => {
  const half = halfEnd(P);
  const ok = (x) => g == null || (x !== g && (x <= half) === (g <= half));
  const k = [...P.weeks.filter((x) => x.chip === c), ...chipPins(P).filter((x) => x.chip === c)].map((x) => Number(x.gw)).find(ok);
  return k ?? null;
};
/** Whether a tap may plan chip c for GW g beside your other chips (engine.canUseChip: one left in g's half, not planned
 *  in another GW of it; the same chip elsewhere moves, chipEdit) → {ok, reason}. */
const chipCheck = (ctx, P, c, g) => E.canUseChip({
  base: ctx.data.base, gw: g, chip: c,
  draft: { chips: Object.fromEntries(chipPins(P).filter((x) => x.gw !== g && x.chip !== c).map((x) => [x.gw, x.chip])) },
});
/**
 * The Chips sheet's rows for GW g (sheets/chips.js; the user, 2026-10-13: "add 'chip..' button next to 'bring in..'
 * every where"), one per chip in CHIP_ROW's order, so no row moves as solves land: {chip, state, …}
 *   · 'on': GW g plays it, `mine` a pin of yours (else Forkcast's own), `cmp` its gain against not playing it
 *     (chipGain) unless the week is still an estimate (`solving`); a Wildcard's or Free Hit's under your team as it is
 *     the week line's (chipWeekGain: against rolling, `vs`; `solving` while it is checked);
 *   · 'off': none left in g's half: `at` the GW it was played, `back` the second half's first GW (g in the first half);
 *   · 'moved': planned in GW `at` of g's half (a tap moves it here: chipEdit);
 *   · 'swap' (GW g plays another chip, `instead`, which a tap replaces) or 'free': `cmp` the chip's prepared solve's gap
 *     once it is in (src.at), `solving` while it runs; `best` its honest best week (honestBest), `top` the best so far,
 *     `final` every week's solve in and one at least measured (none measured, a forecast whose roads aren't in or
 *     preparations that failed: no verdict; the review, 2026-10-13), each over g's half of the window (chipBests: a
 *     best week in the other half is no rival, the chip is one per half; the pre-release review, 2026-10-13); `wait`
 *     its checks while any runs (chipWait), `after` the half's last week the plan covers when the half goes on past it
 *     (findings #13, Kenji, 2026-10-21: a later Bench Boost was never judged, and nothing said so), else null. A Wildcard
 *     or Free Hit (the user, 2026-10-22: "+5.9 vs rolling" on the pitch, "Best week: GW9 +2.9" in Chips…): its best week
 *     the pitch's (chipWeekOf: `best`, `top`, `final` and `wait` from the pre-solves the pitch reads), the best week's
 *     number the pitch's there (chipShown: `best.delta`, `best.vs`; none while it is checked), and where the pitch shows
 *     it in GW g its number the token's (`cmp`, `pays`, `vs`; `solving` while that choice is checked). Under your team
 *     as it is (the user, 2026-10-22: "vs rolling everywhere") every number of theirs is chipNumber's, against the
 *     week's roll plan, in a week the pitch doesn't show it too (its `src` plan counted as a row; a swap row's as well),
 *     `solving` while that week's roll plan is checked, never a number on another baseline.
 * `src`: chipSource(ctx, P) (reading it asks for the preparations), or null for the first draw (no numbers). Pure but
 * for chipGain's memo. */
export function chipStates(ctx, P, g, src = null) {
  const w = weekOf(P, g), half = halfEnd(P), avail = chipsAvail(P, g);
  const used = P.b.entry?.chips_used || [];
  const { here, best: bests } = halfBests(P, src, g);
  const last = here[here.length - 1];
  const after = last < (g <= half ? half : E.LAST_ROUND) ? last : null;
  return CHIP_ROW.map((c) => {
    if (w?.chip === c) {
      const mine = chipPins(P).some((x) => x.chip === c && x.gw === g);
      if ((P.mark ?? P.approx).has(g)) return { chip: c, state: 'on', mine, solving: true };
      if (!SQUAD_CHIPS.has(c)) return { chip: c, state: 'on', mine, cmp: chipGain(ctx, P, g) };
      const v = chipWeekGain(ctx, P, g, (x) => plansListed(ctx, P, x));
      return { chip: c, state: 'on', mine, cmp: v.cmp, solving: v.wait, ...(v.vs ? { vs: v.vs } : {}) };
    }
    if (!avail.includes(c)) {
      const u = used.find((x) => x.chip === c && (x.gw <= half) === (g <= half));
      return { chip: c, state: 'off', at: u?.gw ?? null, back: chipBack(P, g) };
    }
    const at = plannedAt(P, c, g);
    if (at != null) return { chip: c, state: 'moved', at };
    // a Wildcard's or Free Hit's best week is the pitch's (chipWeekOf over the pre-solves, in g's half), its number and the
    // row's own where the pitch shows it the pitch's (chipShown; the user, 2026-10-22: one Free Hit number); its number
    // elsewhere from the same pre-solves as its best week, top, final and wait (the review of round 7, 2026-10-22: a
    // number from your rules' preparation beside a fact quoting the pre-solve's)
    // …and under your team as it is every number of theirs on the week's roll plan (chipNumber; the user, 2026-10-22:
    // "vs rolling everywhere"): elsewhere your rules' plan of it (src, the plan its tap lands) counted as a row, a swap
    // row's too; never the pre-solve's gap against not playing it
    const squad = !!src && SQUAD_CHIPS.has(c);
    const rolled = squad && !!P.mem?.hold;
    const s = squad ? chipPresolves(ctx) : src;
    const pre = s ? s.at(c, g) : null;
    const sb = squad ? halfBests(P, s, g).best : bests;
    const wk = squad ? chipWeekOf(P, s, c, g) : null;
    const pick = squad ? (here.includes(wk?.gw) ? wk : null) : sb ? honestBest({ best: sb }, c) : null;
    const numAt = (x) => (rolled ? chipNumber(ctx, P, x, c, src.at(c, x)) : chipShown(ctx, P, x, c));
    const far = squad && pick && pick.gw !== g ? numAt(pick.gw) : null;
    const near = squad && (rolled || !w?.chip) ? numAt(g) : null;
    const own = near?.cmp ? near : null;
    return {
      chip: c, state: w?.chip ? 'swap' : 'free', instead: w?.chip ?? null,
      cmp: own?.cmp ?? (near?.wait || rolled ? null : pre?.state === 'ready' ? pre.cmp : null), solving: !!near?.wait || (!own && !rolled && pre?.state === 'solving'),
      ...(rolled ? { vs: COPY.planVsRoll } : {}), ...(own ? { pays: own.pays, vs: own.vs } : {}),
      best: pick && squad ? { ...pick, delta: far?.cmp?.delta ?? (pick.gw === g ? own?.cmp.delta ?? null : null), vs: far?.vs ?? own?.vs ?? null } : pick, top: sb?.[c] ?? null,
      final: !!s && here.every((x) => chipSettled(s.at(c, x))) && here.some((x) => s.at(c, x).state === 'ready'),
      wait: s ? chipWait(s, c, here) : null, after,
    };
  });
}
/** Chip c's checks over the weeks `here` while any still runs (findings #2, Kenji, 2026-10-21: "Best week: checking…"
 *  for six minutes, no progress), as Add a player's line counts its own (B87b): the week out (one already asked, else
 *  the first still waiting), its place among the weeks checked (those measured, running or failed with a reason), and
 *  when the first of them went out (src.asked, ms; null before any has) → {g, i, n, t0} | null. The same in every week
 *  of the half (one source, one half). */
function chipWait(src, c, here) {
  const need = here.filter((x) => { const s = src.at(c, x); return s.state !== 'none' || !!s.error; });
  const left = need.filter((x) => src.at(c, x).state === 'solving');
  if (!left.length) return null;
  const asked = need.map((x) => src.asked?.(c, x)).filter((t) => t != null);
  // (`part`: a week of the span nobody asked for, so no best week can come of these checks: chipSettled)
  return { g: left.find((x) => src.asked?.(c, x) != null) ?? left[0], i: need.length - left.length + 1, n: need.length, t0: asked.length ? Math.min(...asked) : null,
    ...(here.some((x) => src.at(c, x).unasked) ? { part: true } : {}) };
}

/** F14 preparations, per values key (valuesKey): the Road, or 'error' (not asked again). PREP: the plan memory they
 *  serve (`mem`: a sign-out lets its flight and wait go with it), the one in flight ({key}), the look-again timer, and
 *  when a refused ask may go again (`until`, ms). PREP_ASKED: when each was first asked (ms; the Chips sheet's clock,
 *  chipWait). */
const PREPS = new Map();
const PREP_ASKED = new Map();
const PREP = { mem: null, flight: null, timer: null, until: 0, gen: 0 };  // gen: bumped by each landing (chipPreps' views)
const PREPS_MAX = 96;
const PREP_AGAIN_MS = 1500;   // your plan healing, this browser's speculative slot busy, a preparation superseded
const PREP_HOLD_MS = 30000;   // the plan service refused one (busy) or was away
/** A preparation landed (pumpPreps; a Wildcard or Free Hit row of it, plansOf's `land`): kept, the newest PREPS_MAX,
 *  and chipPreps' views made again (a landing counts only under the rules it was made for). */
function prepKeep(key, got) {
  PREPS.set(key, got);
  while (PREPS.size > PREPS_MAX) PREPS.delete(PREPS.keys().next().value);
  PREP.gen++;
}

/** What the chip preparations of a plan view are made of besides the data (PREP_MEMO's key): the roads, whether you
 *  may edit, GW A, your pins (what they ask: never when or in which words, so the same rules made again, a chip tapped
 *  on, off and on, are the same) and the chip each GW of your plan plays (prepSlots, chipEdit and valuesFor read no
 *  more). */
const PREP_SIGS = new WeakMap();
function prepSig(P) {
  if (!PREP_SIGS.has(P)) {
    const pins = P.pins.map(({ at, label, ...p }) => p);
    PREP_SIGS.set(P, JSON.stringify([P.b.version, P.b.meta?.roads_version ?? null, P.editable, P.A, pins, P.weeks.map((w) => w.chip ?? null)]));
  }
  return PREP_SIGS.get(P);
}
/** Per derived data and prepSig (the newest few): {slots, items} once made, so a re-draw under the same rules never
 *  makes them again (QA-7 #2: 16 valuesFor each time the chip row drew). */
const PREP_MEMO = new WeakMap();
const PREP_MEMO_MAX = 8;
function prepMemo(ctx, P) {
  const sig = prepSig(P);
  let by = PREP_MEMO.get(ctx.data);
  if (!by) PREP_MEMO.set(ctx.data, (by = new Map()));
  let m = by.get(sig);
  if (!m) {
    by.set(sig, (m = { slots: null, items: null, made: null }));
    while (by.size > PREP_MEMO_MAX) by.delete(by.keys().next().value);
  }
  return m;
}

/** The chip × GW slots a tap may plan with your pins (prepItems without their values): every chip of the row your plan
 *  doesn't play (plannedAt) that chipCheck allows, in every GW → [{chip, gw, taken (your plan plays another chip that
 *  GW)}]; none without pins of yours, off line, or while the bundle's roads are of another version (re-baking). */
function prepSlots(ctx, P) {
  const m = prepMemo(ctx, P);
  if (m.slots) return m.slots;
  if (!P.pins.length || !P.editable || !ctx.api?.solve || P.b.version !== P.b.meta?.roads_version) return (m.slots = []);
  const taken = new Set(P.weeks.filter((w) => w.chip).map((w) => w.gw));
  // a frozen week's chip is held: nothing to prepare there (isFrozen: none since Freeze went, 2026-10-12)
  return (m.slots = P.gws.filter((g) => !isFrozen(P, g)).flatMap((g) => CHIP_ROW.filter((c) => plannedAt(P, c) == null && chipCheck(ctx, P, c, g).ok).map((c) => ({ chip: c, gw: g, taken: taken.has(g) }))));
}

/** The chips a tap may plan, prepared with your pins (chipPreps): prepSlots with the values of exactly the tap's edit
 *  (chipEdit → valuesFor) and their key → [{chip, gw, taken, values, key}], memoised per rules (prepMemo). */
function prepItems(ctx, P) {
  const m = prepMemo(ctx, P);
  if (m.items) return m.items;
  try {
    m.items = prepSlots(ctx, P).map((x) => {
      const e = chipEdit(P, x.gw, x.chip);
      const values = valuesFor(ctx, e.pins, e.drop);
      return { ...x, edit: e, values, key: valuesKey(P, values) };
    });
  } catch (e) { console.error('Forkcast: chip preparations', e); m.items = []; }
  return m.items;
}

/**
 * F14: your chips prepared WITH your rules. With pins (P.pins: a rule of yours, or memory's derived hold or hits pin) the bake's pre-solves are the
 * model's plan with a chip, not yours: the phone solves, in the background, each chip × GW a tap may plan (prepItems:
 * exactly the tap's pins, so the tap finds the road at once, memory.offer, or its heal joins the solve in flight): the
 * viewed GW's chips first, then from GW A on (a GW your plan plays another chip in last: planning one there replaces
 * it). One at a time (purpose 'chipprep': speculative, never counted in the plan service's hourly quota), once your
 * plan has landed and while no Wish or options solve of this browser holds the speculative slot (a superseded
 * or refused one is asked again later, never an error toast). Kept per values (PREPS), so new rules start over and a
 * preparation made for older ones never paints. Each is measured against your plan (asYours vs P.weeks), and reading
 * it asks for the next one. → {at(chip, gw) → {state: 'ready' (road, cmp) | 'solving' | 'none'}, best, items,
 * asked(chip, gw) → when it was first asked (ms) | null}
 */
const PREP_VIEW = new WeakMap();
export function chipPreps(ctx, P = plan(ctx)) {
  if (!P) return { at: () => ({ state: 'none' }), best: {}, items: [] };
  let r = PREP_VIEW.get(P);
  const ak = chipsAsked(ctx).join();
  if (r?.gen !== PREP.gen || r.ak !== ak) {
    const items = prepItems(ctx, P);
    const by = new Map(items.map((x) => [`${x.chip}@${x.gw}`, x]));
    // (never memoised: the one in flight was asked after this view was made)
    const asked = (c, g) => PREP_ASKED.get(by.get(`${c}@${g}`)?.key) ?? null;
    const memo = new Map();
    const at = (c, g) => {
      const k = `${c}@${g}`;
      if (!memo.has(k)) {
        // (one of a GW whose chips nobody asked for: none, `unasked`, as the bake's: chipPresolves)
        const asked = chipsAsked(ctx).includes(g), it = asked ? by.get(k) : null;
        const got = it ? PREPS.get(it.key) : null;
        memo.set(k, !it ? { state: 'none', ...(!asked && by.has(k) ? { unasked: true } : {}) } : got?.weeks ? { state: 'ready', road: got, cmp: compare(ctx, asYours(ctx, got), { weeks: P.weeks }) }
          : got ? { state: 'none', error: got } : { state: 'solving' });
      }
      return memo.get(k);
    };
    PREP_VIEW.set(P, (r = { at, asked, best: chipBests(at, P.gws, P.noise), items, gen: PREP.gen, ak }));
  }
  pumpPreps(ctx, P, r.items);
  return r;
}

/** Each chip × GW's plan (F12, F14): with pins of yours your plan's own preparations (chipPreps), else the bake's
 *  pre-solves, which then are your plan with that chip (chipPresolves). */
export const chipSource = (ctx, P = plan(ctx)) => (P?.pins.length ? chipPreps(ctx, P) : chipPresolves(ctx));

/** Ask for the next preparation not yet answered (chipPreps), unless one is in flight; else look again later. */
function pumpPreps(ctx, P, items) {
  // another page memory's flight or wait (the team was signed out of) never holds this one's back
  if (PREP.mem !== memOf(ctx)) Object.assign(PREP, { mem: memOf(ctx), flight: null, until: 0 });
  if (PREP.flight || leftBehind(ctx, P)) return;
  const viewed = Number(ctx.store.get('gw'));
  const order = (x) => (x.taken ? 2 : 0) + (x.gw === viewed ? 0 : 1);
  const asked = chipsAsked(ctx);
  const next = items.filter((x) => asked.includes(x.gw) && !PREPS.has(x.key)).sort((a, b) => order(a) - order(b) || a.gw - b.gw)[0];
  if (!next) return;
  // your plan's heal first; a Wish this browser is solving keeps the speculative slot (api.solve would
  // supersede it); a refused ask waits
  const wait = P.healing || ctx.api.slotBusy?.('spec') ? PREP_AGAIN_MS : Math.max(0, PREP.until - Date.now());
  if (wait > 0) { prepAgain(ctx, wait); return; }
  const flight = (PREP.flight = { key: next.key });
  const ours = () => PREP.flight === flight;
  if (!PREP_ASKED.has(next.key)) PREP_ASKED.set(next.key, Date.now());
  while (PREP_ASKED.size > PREPS_MAX) PREP_ASKED.delete(PREP_ASKED.keys().next().value);
  solveKept(ctx.api, { entry: Number(P.entry), purpose: 'chipprep', values: next.values })
    .then((res) => {
      if (res.road || res.state === 'error') prepKeep(next.key, res.road ?? 'error');
      else if (ours()) PREP.until = Date.now() + PREP_AGAIN_MS;  // superseded (a Wish took the slot) or cancelled (a full queue)
    }, () => { if (ours()) PREP.until = Date.now() + PREP_HOLD_MS; })  // busy (429) or away: later
    .finally(() => {
      if (PREP.flight === flight) PREP.flight = null;
      prepAgain(ctx, 0);  // and asks for the next
    });
}

/** A chip preparation of plan view P still to ask (chipPreps): the next week's preparation leaves it the speculative
 *  slot (forkPump, prepNext). */
const prepsWaiting = (ctx, P) => prepItems(ctx, P).some((x) => !PREPS.has(x.key));

/** chipPreps again in `ms`, for this page's memory only (a sign-out, or a test's release, ends the loop). */
function prepAgain(ctx, ms) {
  clearTimeout(PREP.timer);
  PREP.timer = setTimeout(() => { PREP.timer = null; if (attach()?.ctx === ctx) chipPreps(ctx); }, ms);
}

// ================================================================ THE SCREEN (§5.5)

/** Your rules as the Week sheet lists them (RULES_V2 §4): every ask, newest first. */
export const rulesOf = (P) => [...asksOf(P)].reverse();
/** The rules the Week sheet's "Your rules" lists: every ask but the ones it already shows as rows (a sale, a
 *  slide or a Wish is a transfer of yours; a chip is its GW's tile and pitch; a hits cap, an older plan's, is not
 *  listed; a week's Roll, a plan's +, is, with its ×: the user 2026-10-13, "Lock it, both modes"). A sale, slide or Wish the
 *  plan makes no transfer for is listed too, with its × (the user's phone, 2026-10-10: "Sell Groß from GW8 for Xhaka",
 *  a rule no plan could keep, stayed and was shown nowhere, so Groß could not come in and nothing said why). `g`: the
 *  viewed week, whose block shows the rows (review 5, 2026-10-12: a sale of yours made in GW8 was missing from GW6's
 *  list, though GW6 shows no row for it); null: every week's. */
const ROW_KINDS = new Set(['sell', 'slide', 'wish', 'hits', 'chip']);
const MOVE_KINDS = new Set(['sell', 'slide', 'wish']);
export const listedRules = (P, g = null) => {
  // a move the viewed week or an earlier one shows as its own row and tile is not listed again (the books review,
  // 2026-10-13: "Scott → Dewsbury-Hall · GW7" under GW8's rules); one in a later week still is (review 5)
  const made = new Set(P.weeks.filter((w) => g == null || w.gw <= g).flatMap((w) => (w.moves || []).map((m) => pinOfMove(P, { ...m, gw: w.gw })?.id)).filter(Boolean));
  return rulesOf(P).filter((p) => !ROW_KINDS.has(p.kind) || (MOVE_KINDS.has(p.kind) && !made.has(p.id)));
};

/** The chips your pins plan: [{gw, chip}] (memory.pinChip pins; 'none' lifts a GW's chip). */
const CHIP_PINS = new WeakMap();  // per pin list (the preparations ask for every chip × GW)
const chipPins = (P) => {
  if (!CHIP_PINS.has(P.pins)) CHIP_PINS.set(P.pins, P.pins.flatMap((p) => Object.entries(p.chips || {}).map(([g, c]) => ({ gw: Number(g), chip: c }))).filter((x) => E.CHIPS.includes(x.chip)));
  return CHIP_PINS.get(P.pins);
};


/** The round controls' glyphs (× remove, + add): drawn, never text (no font of their own). */
// (no ⇄ any more: a place's handle is a plate, its first choice named and numbered; the owner, 2026-10-25, "this sign is
// confsing as suggest differnt behaviour which it isnt (its more like subs then transfers actuavlly)")
const glyph = (k) => svg('svg', { viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': 'true', class: 'ah-glyph' },
  svg('path', { d: k === '+' ? 'M6 1.5v9M1.5 6h9' : 'M2.5 2.5l7 7M9.5 2.5l-7 7', fill: 'none', stroke: 'currentColor', 'stroke-width': k === '+' ? 1.8 : 1.6, 'stroke-linecap': 'round' }));

/** A number never cut on the pitch (a place header's, "Yours" over his own card: `v` its number's box inside `el`): its
 *  "xP" first (as a plate's: fitFixtures; the user, 2026-10-22, after v1.3.68), then its chip and −4 marks (its label
 *  and its place keep them), then a smaller size (m-ahead.css .noxp .nomark .tight; a pair card's "+ shirts" and a
 *  plan's "1/3" are gone: the user, 2026-10-23, "these + points or round 2 / 3 confusing"). A token beside the goal
 *  the same, its words' boxes too, its name among them (`v` a list: renderDecks; a name never broken mid-word in them).
 *  A plate the same by its own `steps` (PLATE_TRIMS), `v` then whether it is over its room. → whether it fits */
/** A place's note's words, a hyphened name kept on one line (.ah-nw: "Calvert-/Lewin" in a card-wide note, a name
 *  broken; fitBlocks then makes room for it) → [text | span] */
const whole = (t) => String(t).split(/(\S*-\S*)/).map((x, i) => (i % 2 ? h('span.ah-nw', null, x) : x));
const fitNum = (el, v, steps = ['noxp', 'nomark', 'tight']) => {
  const over = typeof v === 'function' ? v : () => [v].flat().some((x) => !!x && x.scrollWidth > x.clientWidth + 0.5);
  el.classList.remove(...steps);
  for (const k of steps) if (over()) el.classList.add(k);
  return !over();
};
/** One look across `els` (a place's dealt headers; a pitch's plates and its tokens beside the goal): each class of `ks`
 *  ("noxp", "tight": fitNum's trims) one of them took, every one takes (a place's: design_marks/design.md §3; the
 *  pitch's "xP": the owner, 2026-10-26, "why it sometimes write xp sometimes not write fix", renderDecks). → the
 *  classes taken */
export const oneLook = (els, ks) => {
  const on = ks.filter((k) => els.some((x) => x.classList.contains(k)));
  for (const x of els) x.classList.add(...on);
  return on;
};
/** The least type of a place's header, px: its last trim (headScale) goes no smaller. */
const HEAD_LEAST = 8;
/** A place's header's trims (fitNum's), before its type gets smaller (scaleHeads): a plate's, then its spacing (.snug: its
 *  padding and gap, its take's word's padding), which at 320 wide was the 2 px "−0.4" lacked beside "Swap" at its least
 *  type (the 320 px QA, 2026-10-27). */
const HEAD_TRIMS = ['noxp', 'nomark', 'tight', 'snug'];
/** A place's header's number, never cut; "checking…" in its place gives way at its end, as a plate's (m-ahead.css
 *  .ah-pv.wait), never trimming the place's headers: at 320 wide it drew them all at their least type. */
const HEAD_NUM = '.ah-pv:not(.wait)';
/** A place's header still over its card after its own trims (fitNum's: "xP", the marks, the smaller number): the scale
 *  of its whole type, its number and its take's word alike (m-ahead.css --ph-k), that fits `need` px of that type in
 *  `room` px, never under HEAD_LEAST in its smallest type (`px`, at scale 1); 1 where it fits. The take's word kept its size while its number
 *  shrank, so at 320 wide "−0.6 Swap" read "−0." (the fixreset probe, 2026-10-26: 21 px of number in 14 at the default
 *  text size, 35 in 0 at 28 px; the owner, 2026-10-25: "never its number nor its Swap"; 2026-10-26: "fix the
 *  failures"). Pure. */
export const headScale = (need, room, px) => (need <= room + 0.5 ? 1 : Math.max(HEAD_LEAST / px, room / need));
/** A GW's deadline (epoch seconds): the bundle's per-GW meta.deadlines, else GW A's meta.deadline_epoch. */
/** A plate's own trims, each never hiding who comes in (the owner, 2026-10-25, "Best keeps its name": "Each plate fits on
 *  its own. Cramped quiet plates turn into ⇄ handles first, so the black best always shows its full name. A name still
 *  too long is shortened like the cards do. No shirts."; the handles since the number alone, .only: the owner,
 *  2026-10-25, after v1.3.79, "or just points if space tough"): its "xP", then its chip and −4 marks (its place keeps
 *  them; a loss's number alone with its −4 ran past a 320 px screen at a 28 px text size, QA fit, 2026-10-28), then a
 *  smaller type (m-ahead.css .ah-sp.noxp .nomark .tight; fitNum, renderDecks). The best's "both" / "all 3" went with its Swap (the same day: "no need green 'swap'
 *  in preview"). Its "xP" the pitch's: off on one plate or token beside the goal, off on all (the owner, 2026-10-26: "why
 *  it sometimes write xp sometimes not write fix"; renderDecks' oneXp). */
const PLATE_TRIMS = ['noxp', 'nomark', 'tight'];
/** The week's status's trims beside the goal (renderDecks fits): its own spacing first (.snug), then a token's. */
const ST_TRIMS = ['snug', 'noxp', 'nomark', 'tight'];
/** The least of a buy's name a shortened plate shows (m-ahead.css .ah-sp.cut: a few letters and "…", as the cards'
 *  "Calvert-L..."), in its type's ems; under it the best shows its number alone, ink (.only: renderDecks). */
const NAME_LEAST = 3;
const deadlineOf = (b, A, g) => b?.meta?.deadlines?.[g] ?? (g === A ? b?.meta?.deadline_epoch : null) ?? null;
/** The countdown, only under 7 days (DESIGN_V2 §3.2; the header line puts it after a " · "). */
const countdown = (info) => (info.left > 0 && info.left < 7 * 86400e3 ? info.text : '');
/** …its parts (the GW line's .ah-dl): the abbreviation shown, its words spoken after a comma (review 5, 2026-10-12: the
 *  " · " is CSS, so VoiceOver ran "Sat 13:00" into "5d 17h"). */
const countdownParts = (info) => (countdown(info) ? [h('span', { 'aria-hidden': 'true' }, countdown(info)), h('span.sr-only', null, `, ${info.said}`)] : []);

/** A hold's progress at the finger (the user, 2026-10-22; Saffer's review the same day: "Holding gives no sign it is
 *  armed"): a ring round the point (x, y) on the screen filling over `ms` (m-ahead.css .ah-hold: unseen for a tap's first
 *  moments), `word` over it, what the hold plays ("TC", "BB"); its caller stops it when the hold fires, or the finger
 *  lifts or moves first, so a ring that hasn't filled never acts. Nothing without a page (the node tests). → stop() */
const holdFill = (x, y, ms, word = null) => {
  if (!globalThis.document?.body) return () => {};
  const n = h('div.ah-hold', { 'aria-hidden': 'true', style: { left: `${x}px`, top: `${y}px`, '--ms': `${ms}ms` } },
    svg('svg', { viewBox: '0 0 56 56' }, svg('circle', { class: 'tr', cx: 28, cy: 28, r: 25 }), svg('circle', { class: 'fl', cx: 28, cy: 28, r: 25, pathLength: 100 })),
    word ? h('span.ah-holdw', null, word) : null);
  document.body.append(n);
  return () => n.remove();
};

/** The shell's states (app.js conn) of a re-plan under way: the bake (baking; stale: a new forecast's roads while the
 *  old ones show) or the forecast updating. Ahead draws them as a thin line under the header, never a row. */
const REPLANNING = new Set(['baking', 'stale', 'updating']);

/** How far up a target over card c, `m` px wider on each side, may reach (the user's 4th answer, 2026-10-20): to 44 px
 *  over his card, only over free turf, never onto another card, a corner pill or a token (`walls`), nor above the pitch
 *  (the keeper's: the week line is over it). c and walls are boxes on the pitch ({n, x, y, w, h}: mount's cardBoxes).
 *  → its top, on the pitch */
export const reachOf = (c, walls, m = 2) => Math.max(0, c.y - 44, ...walls.filter((q) => q.n !== c.n && q.x < c.x + c.w + m && q.x + q.w > c.x - m && q.y < c.y).map((q) => q.y + q.h + 2));
/** The least room over a card for a tab (its one line) and for edges (their slivers), px; the most of the gap beside a
 *  card a sliver of his took each side once, px (resetFits keeps that room). */
export const TAB_MIN = 16, EDGE_MIN = 6, GAP_MAX = 8;
/** The least room over a card for a plate (renderDecks: its one line at its .tight 10 px type), px; under it its number
 *  alone (.only), as short as the room (the ⇄ handle's place before the owner's 2026-10-25 "or just points if space
 *  tough"). */
export const PLATE_MIN = 14;
/** Boxes a and b on the pitch ({x, y, w, h}) meet, b taken `down` px taller (a target under it). */
export const boxesMeet = (a, b, down = 0) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h + down && b.y < a.y + a.h;
/** The pitch's Reset plan pill fits at its place, box p (m-ahead.css: under Player data, or under Reset lineup while that
 *  shows), over the cards as drawn (`boxes`: mount's cardBoxes): it meets no card and leaves each card under it a card
 *  behind's least room, a tab's over him (reachOf, TAB_MIN: one tap on a lit card behind takes it) and his edges' at
 *  their widest (GAP_MAX, EDGE_MIN). Where it doesn't (a short pitch, a large text size, both pills shown) it is not
 *  drawn: Reset plan is still the You sheet's. → bool */
export const resetFits = (p, boxes) => {
  const takes = (c, m, least) => { const top = reachOf(c, [p], m); return top > reachOf(c, [], m) && c.y - top < least; };
  return !boxes.some((c) => boxesMeet(c, p) || takes(c, 2, TAB_MIN) || takes(c, GAP_MAX + 2, EDGE_MIN));
};
/** The least height of the pitch (m-ahead.css .ah-pitch, the bench inside it) at which no card meets another row's nor
 *  a sub's label (his order, "1"; the keeper's none: m-ahead.css .pm-blp): the bench's chrome (--pm-chrome: the zone's 2 px, the panel's padding, the label and
 *  the gap under it), five cards at the tile's floor (--pm-hlo: the four rows and the bench), a plate more in each row (a
 *  fixture on a line of its own where the tile can't flatten, B27: every row's, so the pitch is one height every week
 *  whatever its rows hold) and the forwards' foot (--pm-foot). At that height or more the rows' gaps (--pm-gaps) are
 *  never under 0, so no row drops to its ROW_TOP share (--pm-floor) and the forwards' cards end --pm-foot over the
 *  field's foot, less a sub's two-line card's plate: over the bench's panel (the user, 2026-10-21: fix the known issues;
 *  at AX1, a 28 px text at 375 × 667, a pitch of about 357 px drew its rows at their shares, Haaland's and Evanilson's cards
 *  over "1 · DEF" and "2 · DEF"). Each in px, as it resolves on the pitch (fitPitch) → px */
export const pitchLeast = ({ chrome, hlo, plate, foot }) => chrome + 5 * hlo + 4 * plate + foot;
/** CSS lengths as they resolve inside `host` (the pitch's tokens, m-ahead.css: 'var(--pm-tab)', …), each the height of
 *  an absolutely placed probe there, read in one layout → [px, …] */
const cssPx = (host, ...lengths) => {
  const probes = lengths.map((v) => h('span', { style: { position: 'absolute', height: v } }));
  host.append(...probes);
  const px = probes.map((p) => p.getBoundingClientRect().height);
  for (const p of probes) p.remove();
  return px;
};

export function mount(el, ctx) {
  el.classList.add('ah');
  // the suggestions' hide, before it was a team's own (v1.3.27 or earlier: one for every team), let go
  ctx.api?.local?.set?.('fc:ahead:sugg', null);
  // learnt: the first-use hints done (LEARN_KEY: learn)
  const learntNow = ctx.api?.local?.json?.(LEARN_KEY);
  const S = { drag: null, flashAt: 0, queued: false, live: isLive(ctx), down: new Set(), held: false, week: null,
    learnt: new Set(Array.isArray(learntNow) ? learntNow : []),
    // the wait's one story (tellStory: design 1027a A-stages), after Connect's first load only (ctx.reveal; a warm start
    // has none), until its first week is settled: {t0: the plan's start (ms), seen: GW → its choices checked (forkKeys),
    // wait: {g, n} while it checks, f: the share of the week's listed checks in, p: the most its bar showed}
    story: ctx.reveal ? { t0: null, seen: new Map(), wait: null, f: 0, p: 0 } : null };
  // DESIGN_V2 §3: the header is the team's name, centred, and the avatar; the page is named for assistive tech (a
  // visually hidden h1, the header's label) and the browser tab by the team and the app ("Raketa · Forkcast"): the one
  // screen has no name of its own (the user, 2026-10-07: "why is the tab called Ahead")
  const head = h('header.ah-head', { 'aria-label': 'Forkcast' });
  const pageName = (team) => h('h1.sr-only', null, team ? `${team} · Forkcast` : 'Forkcast');
  const avatar = h('button.ah-avatar', { type: 'button', onClick: () => ctx.openSheet('you') });
  // the header's left column, the avatar's mirror: "Help", the Help sheet at once (the user, 2026-10-13: help on the
  // main screen, not only avatar → You → Help; Podmajersky: how-to findable). Hidden while a toast
  // lies over it (m-ahead.css), so a tap on the toast never opens it
  const helpBtn = h('button.ah-help', { type: 'button', 'aria-haspopup': 'dialog', onClick: () => ctx.openSheet('you', 'help') }, COPY.helpShort);
  // the header's second line, under the team's name (the user, 2026-10-22: "DEADLINE INTO THE HEADER", its row of its
  // own gone), two facts on one line: GW A's deadline, whatever GW is viewed ("Deadline Sat 13:00 · 4d 17h": N10, one
  // fact, one place; tick() runs the countdown), and the window's total where it fits (keepGwLine; renderTotal: "GW6–9
  // 218.9"; an edit's change for a few seconds, "229.0 (+10.1)"; shimmering while the full plan checks it; the switcher's
  // summary says it to assistive tech, totalEl)
  const dlEl = h('span.ah-dlpart');
  const totLine = h('span.ah-tot.m-num', { 'aria-hidden': 'true' });
  const gwline = h('p.ah-gwline.m-num', null, dlEl, totLine);
  const slot = h('div', { dataset: { bannerSlot: '' } });
  // F16, FPL's Pick Team: one control row under the header (FPL's "Pitch | List"): the GW switcher, each GW with its
  // points and the viewed one selected (it was the GW bar docked at the foot: under Safari's floating toolbar there), the
  // row's whole width. Player data (FPL's "Opponent ⌄": what the second plate shows, playerDataSheet) is a small button
  // on the pitch's top-right corner, beside the goal (mountHere)
  // to assistive tech a radio group "Gameweek", each GW a radio named by its full label (renderRail: its points,
  // provisional, the moves, the hit, the chip; B46: a slider hid them); the keys the radio group's (ui.roving: one Tab
  // stop, the viewed GW; the arrows wrap, Home / End), a key moving the week as a tap on its tile does (renderRail
  // paints the tiles again and keeps the focus on the one checked)
  const hint = h('div.ah-hint', { 'aria-hidden': 'true' });
  const ticks = roving(h('div.ah-ticks', { role: 'radiogroup', 'aria-label': 'Gameweek' }), { pick: (b) => setGw(Number(b.dataset.gw)) });
  const rail = h('div.ah-rail', null, h('span.ah-thumb', { 'aria-hidden': 'true' }), ticks);
  const totalEl = h('span.ah-total.sr-only');  // the window's total, the switcher's accessible summary
  // the total's change as it shows (renderTotal), said politely: the line drawing it is hidden from assistive tech, and an
  // edit that lands at once says no number in its toast (B24; review 5, 2026-10-12: VoiceOver heard no result)
  const totSaid = h('span.sr-only', { 'aria-live': 'polite' });
  // the wait line's start and end said politely (W9, W10: "busy" that simply vanishes reads as done to the eye alone;
  // design 1028d W2-line, paintWait), never its every second
  const waitSaid = h('span.sr-only', { role: 'status' }), waitV = waitView();
  const railWrap = h('nav.ah-railwrap', { 'aria-label': 'Gameweeks', dataset: { nopull: '' } }, rail, totalEl, totSaid, waitSaid);
  const pdBtn = h('button.ah-pp.ah-pdbtn', { type: 'button', 'aria-haspopup': 'dialog', onClick: () => { playerDataSheet(); } });
  // "Reset lineup": Player data's mirror on the pitch's top-left corner, only while the viewed GW's lineup is yours (a
  // sub, a bench order, an armband: renderPitch); one tap is the plan's best lineup there again (resetLineup, Undo)
  const luBtn = h('button.ah-pp.ah-lubtn', { type: 'button', hidden: true, onClick: () => { resetLineup(ctx, gwNow(plan(ctx))); } },
    h('span.ah-pdl', null, 'Reset lineup'));
  // "Reset plan" (the user, 2026-10-21: "there is no easy reset all transfers button (currently it is behind user menu) -
  // maybe place it small on pitch"): Reset lineup's look, under Player data (under Reset lineup while that shows), only
  // while your plan holds a transfer, chip or rule of yours (planHasYours: renderPitch) and only where it fits
  // (placePills); one tap is You → Reset plan (resetPlan: the same toast, Undo)
  const rpBtn = h('button.ah-pp.ah-rpbtn', { type: 'button', hidden: true, 'aria-label': COPY.planResetSaid, onClick: () => { resetPlan(ctx); } },
    h('span.ah-pdl', null, 'Reset plan'));
  // the pitch's first-use hints (LEARN_KEY), each two short lines on the turf (placeHint): the shirt's hold and the C's
  // drag in Reset lineup's corner while that is hidden ('pitch'; under Reset plan while that shows, m-ahead.css), and the
  // chips' holds in the field's bottom-left corner, beside the forwards and over the bench they speak of ('chips'; the
  // user, 2026-10-13: "why still no hints how to play bb of tc only caps and subs": both at once, never one after the
  // other); the help's Swipes paragraph says them in full
  const pitchHint = h('div.ah-ph', { 'aria-hidden': 'true', hidden: true }, ...COPY.hintPitch.map((t) => h('span', null, t)));
  const chipsHint = h('div.ah-ph.chips', { 'aria-hidden': 'true', hidden: true }, ...COPY.hintChips.map((t) => h('span', null, t)));
  const HINTS = [[pitchHint, 'pitch'], [chipsHint, 'chips']];
  /** First-use hint `name` done (LEARN_KEY): never drawn again on this browser. The Week sheet's go with the edit's own
   *  re-draw; the pitch's at once (a C dropped off a starter draws nothing). */
  function learn(name) {
    if (S.learnt.has(name)) return;
    S.learnt.add(name);
    ctx.api?.local?.set?.(LEARN_KEY, JSON.stringify([...S.learnt]));
    for (const [n, k] of HINTS) if (k === name) n.hidden = true;
  }
  // the line every GW under the status bar, over the GW tiles' top (sayCheer: for as long as it plans, else once a GW)
  const cheerEl = h('div.ah-cheer.m-facts', { role: 'status', hidden: true });
  const ctl = h('div.ah-ctl', null, railWrap, hint, cheerEl);
  // the week line (renderWeek: the viewed GW's plan in one row, its Week sheet behind it); the preseason line takes its
  // place
  const strip = h('div.ah-blockhost');
  const pitchHost = h('div.ah-pitch', { dataset: { nopull: '' } });
  // the week's choices on the pitch (renderDecks: the card behind each player a choice would replace, the week's own
  // choices beside the goal), a layer over its cards put back on each mount (mountHere); a player's place opens over
  // them (openPlace). Its buttons are its own: the pitch's swipe and holds (a week, a sale, the Bench Boost) never start
  // on them
  const decks = h('div.ah-decks', { role: 'group' });
  // a 1rem square, never seen: the root text size changing (Dynamic Type) resizes it (fitPitch)
  const remProbe = h('span.ah-remprobe', { 'aria-hidden': 'true' });
  // a notice that comes to the week line's second line, said once (the line is a button's, read only on focus)
  const noticeSaid = h('span.sr-only', { 'aria-live': 'polite' });
  el.append(head, slot, ctl, strip, noticeSaid, pitchHost, remProbe);
  // the node Ahead keeps drawing into, placed in the Week sheet: your rules
  const asksHost = h('div.ah-rules-host');                                  // your rules (every GW's)

  const gwNow = (P) => viewedGw(ctx, P);
  const setGw = (g) => {
    const P = plan(ctx);
    if (!P) return;
    if (!P.gws.includes(g)) {
      // a GW past your plan (You → Plan ahead): how to plan it, or that every plan reaching it is locked (edgeTicks)
      const n = P.reach.indexOf(g) + 1;
      if (n > 0 && g > P.end) toast(lockedFrom(P, n) ? COPY.weekLocked(g) : COPY.weekOff(g, P.gws.length), 'info');
      else if (g > P.end) toast(`${COPY.forecastEdge(g)} Plans cover ${span(P.gws)}.`, 'info');
      return;
    }
    ctx.store.set('gw', g);
  };
  GO_GW = setGw;  // an Undo shows where it changed the plan (undoOf)
  /**
   * The pitch's height, the same every week (the user, 2026-10-08: GW7's four suggestions shrank its pitch and cards
   * under GW6's two; a bench cut off under the planning banner, a three-line switcher and a larger text size). The
   * pitch (and so its cards: m-ahead.css .ah-pitch .pm) is sized from the screen alone, never from what the week line
   * holds: the height left under what is there as it renders, measured, never assumed (so the user's text size is in
   * it): the header with its GW line (as the deadline draws it: fitHead; again where its height changes), a banner that keeps a row (offline, with Retry;
   * a re-plan's is a thin line with no height: m-ahead.css), the switcher (its tiles always two lines, "GW6" with its
   * marks and the week's change, then the points: renderRail) and the week line (fitBlock), so header → bench is one
   * screen in every week (the pitch research's step 4: nothing pushes the pitch down, no state scrolls; the choices
   * are drawn in its row gaps: renderDecks); never under
   * --ah-pitch-min, nor its rows' least (--ah-pitch-least: pitchLeast, from the pitch's own tokens at this width and
   * text size; the user, 2026-10-21: fix the known issues), the CSS taking the largest. Measured again only when the
   * screen's size changes (a rotation, a resize;
   * .m-app is 100svh, so never Safari's toolbars), the root text size does (Dynamic Type: remProbe) or a banner's row
   * comes or goes (slot), all seen by one ResizeObserver, and once the fonts have loaded; never on a GW switch. render()
   * asks until the plan's own week line is drawn and the pitch is mounted (drawn hidden, before the switcher showed: the
   * preseason line, or while the first week is planned: the reference line).
   */
  let fitKey = '', fitDrawn = false;
  const outerH = (x) => {
    const s = getComputedStyle(x);
    return x.getBoundingClientRect().height + parseFloat(s.marginTop) + parseFloat(s.marginBottom);
  };
  /** The widest facts a week with no transfer has (factsWords): the most free transfers, a two-digit bank and the
   *  season's last GW, "5 FT · £99.9m ITB · 5 FT in GW38" (fitBlock's probe, never seen). */
  const FACTS_PROBE = { gw: 37, ft: 5, next: 5, bank: 99.9 };
  /** The week line as it renders at its width: one strip (the week's status on the pitch beside the goal: statusTok;
   *  the owner, 2026-10-26: "find fit transfer line from tab above on pich can be moved to pitch"), the doors at its
   *  right end (the user, 2026-10-22: "WEEK LINE AT MOST 2 LINES": its line one line, what doesn't fit beside the doors
   *  shortened or left to the Week sheet the line opens); your week's facts with their bank whole, next GW's free
   *  transfers where they fit (fitFacts: "2 FT · £0.8m ITB · 3 FT in GW10"), the checks after the bank (renderLine:
   *  "£0.5m ITB · Checking GW9 · 3 of 6 plans · 0:12", its words giving way), "Out: …" or GW A's lineup notice after it,
   *  each probed, so the pitch is fitted for the tallest week line and every week's line keeps that height (--ah-bar-h,
   *  m-ahead.css): the pitch never moves on a GW switch; the line as drawn where taller (a larger text size: its doors
   *  under it). */
  function fitBlock() {
    const real = strip.querySelector(':scope > .ah-block:not(.ah-fitprobe)');
    strip.style.removeProperty('--ah-bar-h');
    const { gw, bank } = FACTS_PROBE, sep = '\u00a0·\u00a0';
    const facts = () => factSpans(factsWords(FACTS_PROBE), true), chk = h('span.ah-chk', null,
      h('span.ah-bn.ah-cw', null, COPY.checkingWeek(gw, 10, 10, 'plan')), h('span.ah-wclock.m-num', null, `${sep}0:00`));
    const checks = [h('span.ah-blead', null, h('span.ah-fact', null, COPY.ftNow(FACTS_PROBE.ft)), ' · ', h('span.ah-fact', null, itbWords(bank)[0]), sep),
      h('span.ah-brest', null, chk)];
    // (the strip's one line, two probes: the facts, the lead and checks)
    const probes = [facts(), checks].map((two) => {
      const b = h('section.ah-block.ah-fitprobe', { 'aria-hidden': 'true' }, barNode({ two, doors: doorStubs() }));
      b.style.width = `${strip.clientWidth}px`;
      strip.append(b);
      return b;
    });
    const hgt = (x) => x.getBoundingClientRect().height;
    const v = Math.max(...probes.map((b) => hgt(b)), real ? hgt(real) : 0);
    const bar = real?.querySelector(':scope > .ah-pbar');
    strip.style.setProperty('--ah-bar-h', `${Math.max(...probes.map((b) => hgt(b.firstChild)), bar ? hgt(bar) : 0)}px`);
    for (const b of probes) b.remove();
    return v;
  }
  /** The header's height with its GW line as the deadline draws it, without the total's passing extras (≈, an edit's
   *  change; keepGwLine fitting the line without them): while it re-plans the line says how far instead, on one line
   *  (paintPlanStatus), never taller. */
  function fitHead() {
    const busy = gwline.classList.contains('ah-planning');
    if (busy && S.dl) paintDeadline(S.dl.A);
    gwline.classList.add('ah-bare');
    keepGwLine();
    const v = outerH(head);
    gwline.classList.remove('ah-bare');
    if (busy) paintPlanStatus();
    keepGwLine();
    return v;
  }
  function fitPitch() {
    const W = el.clientWidth, H = el.clientHeight, rem = remProbe.getBoundingClientRect().height;
    const drawn = !!strip.querySelector(':scope > .ah-block > .ah-pbar:not(.ah-pbake)');
    const pm = pitchHost.querySelector(':scope > .pm');
    const key = `${W}x${H}@${rem}|${head.offsetHeight}|${slot.offsetHeight}|${drawn}|${!!pm}`;
    if (!W || !H || ctl.hidden || key === fitKey) return;
    fitKey = key;
    fitDrawn = drawn && !!pm;
    const s = getComputedStyle(el);
    const above = parseFloat(s.paddingTop) + fitHead() + outerH(slot) + outerH(ctl) + parseFloat(getComputedStyle(strip).marginTop)
      + fitBlock() + parseFloat(getComputedStyle(pitchHost).marginTop) + parseFloat(s.paddingBottom);
    el.style.setProperty('--ah-pitch-fit', `${Math.floor(H - above)}px`);
    // its rows' least (pitchLeast), from its tokens as they resolve on it: the width's and the text size's (W, rem)
    if (!pm) return;
    const [chrome, hlo, plate, foot] = cssPx(pm, 'var(--pm-chrome)', 'var(--pm-hlo)', 'var(--pm-plate)', 'var(--pm-foot)');
    el.style.setProperty('--ah-pitch-least', `${Math.ceil(pitchLeast({ chrome, hlo, plate, foot }))}px`);
  }
  // a new width (a rotation, a text size) fits the GW line on its one line again (keepGwLine), as the header is sized
  // for it, and the week line's facts on theirs (fitFacts); the choices on the pitch are placed over its cards again
  // (renderDecks) in this same frame, before it is painted, the pitch's own fixtures fitted first (a two-line fixture
  // moves the rows: m-ahead.css --pm-x-*; pitch.js's own observer fits them again after this one, to the same lines).
  // Placed a task later, the frame a text size first draws showed every plate where the old size had put it, over the
  // cards and cut (the fixreset probe, 2026-10-26: 2–4 plates over a card, up to 8 cut, in that frame at 320–393 wide
  // and 17–28 px, for 40–110 ms, iOS's text-size control changing it live: -apple-system-body; the owner, 2026-10-26,
  // of decks' "375×667 GW9 text 28px" flake: "fix the failures")
  const refitPitch = globalThis.ResizeObserver ? new ResizeObserver(() => {
    fitPitch();
    keepGwLine();
    fitFacts();
    // the switcher rests under the header as drawn (m-ahead.css .ah-ctl): its GW line on two lines where the deadline
    // alone wraps (a larger text size; the v1.3.75 review #3: stuck at the one-line height it covered the countdown)
    ctl.style.setProperty('--ah-head-h', `${head.getBoundingClientRect().height}px`);
    const pm = pitchHost.querySelector(':scope > .pm');
    if (pm) fitFixtures(pm);
    fitRail();
    redeck();
  }) : null;
  /** The choices on the pitch placed again where its rows moved (a resize, the web fonts, a fixture fitted on two lines),
   *  a focused tab, edge or token focused again. */
  function redeck() {
    if (S.landing) return;  // the cards still moving into their places: placed once they have landed (landMotion)
    const keys = focusedKeys();
    renderDecks();
    placeHint();
    keepFocus(keys);
  }
  refitPitch?.observe(el);
  refitPitch?.observe(pitchHost);
  refitPitch?.observe(remProbe);
  refitPitch?.observe(slot);
  // the header's height (its GW line wrapping or not: a countdown of other words, a new deadline, a re-plan's status)
  // fits the pitch again (fitPitch's key; the v1.3.75 review #4) and places the switcher under it
  refitPitch?.observe(head);
  globalThis.document?.fonts?.ready?.then(() => { if (ctl.isConnected) { fitKey = ''; fitPitch(); setTimeout(redeck, 0); } });
  /** Store changes re-render once per task (a plan change inside a render must not re-enter it), but not while a
   *  finger is down on the screen (S.down; the GW bar's scrub draws as it goes): a landing in the background (a chip
   *  preparation, a heal) would replace the chip, shirt or move row under it mid-gesture and strand the gesture (its
   *  long-press firing on a detached element: a ghost that never drops, and the next tap swallowed). It waits for the
   *  finger to lift (lifted). Nor while a large sheet covers the screen (QA-7 #2: each tick of a sheet re-drew the
   *  whole of Ahead behind it): once, when it goes (uncovered). part 'mem': only plan memory changed; a change that leaves the plan view as drawn (plan: a saved
   *  echo of the document) draws nothing. */
  const schedule = (part = 'all') => {
    // a whole re-draw takes in a memory-only one asked for in the same task
    S.part = !S.queued || S.part === part ? part : 'all';
    if (S.queued) return;
    S.queued = true;
    queueMicrotask(() => {
      S.queued = false;
      if (S.down.size || covered()) S.held = true;
      else if (S.part === 'pair' && S.drawn && plan(ctx) === S.drawn) renderPair();
      else if (S.part !== 'mem' || !S.drawn || plan(ctx) !== S.drawn) render();
    });
  };
  const shell = el.closest('.m-app');
  /** A large sheet is up over the screen (app.js createSheets: .sheet-large), unless the Week sheet is the top one (app.js
   *  sync: every sheet under the top one is inert): it is drawn by render (renderWeek), so it keeps drawing pulled up to
   *  its large detent; a sheet over it holds it as the screen, until it is the top one again (its inert gone: weekSheet
   *  has `uncovered` watch it, as Escape or Back close the sheet over it with .sheet-large unchanged). */
  const covered = () => !!shell?.classList.contains('sheet-large') && !(S.week && !S.week.sheet.el.inert);
  const uncovered = new MutationObserver(() => { if (S.held && !covered() && !S.down.size) { S.held = false; render(); } });
  if (shell) uncovered.observe(shell, { attributes: true, attributeFilter: ['class'] });

  // ---------------------------------------------------------------- render

  /** The avatar (the You sheet: your team, Switch team, Sign out…): grey initials, a dot only when the plan is not up
   *  to date (amber: updating or stale; hollow: offline). */
  function paintAvatar() {
    const e = ctx.bundle?.entry;
    const st = ctx.status();
    fill(avatar, initials(e), st.tone === 'fresh' ? null : h('span.ah-dot', { class: st.tone }));
    avatar.setAttribute('aria-label', `You${e?.team_name ? ` · ${e.team_name}` : ''} · ${st.text}`);
  }
  /** The header: Help on the left, the team's name centred over the GW line (the user, 2026-10-22), the avatar
   *  (DESIGN_V2 §3.1). */
  function renderHead() {
    const team = ctx.bundle?.entry?.team_name ?? '';
    if (globalThis.document) document.title = team ? `${team} · Forkcast` : 'Forkcast';
    fill(head, pageName(team), helpBtn, h('div.ah-hmid', null, h('div.ah-team', null, team), gwline), avatar);
  }
  /** "Gameweek 6 • Deadline: Sat 10 Oct at 13:00 (4d 17h)": always GW A, the week you act on (N10), whatever GW g is
   *  viewed; data-gw is the GW the screen last drew (the harness waits on it). While it re-plans, how far it is
   *  (paintPlanStatus). */
  function renderGwLine(g, A) {
    S.dl = { g: A, A };
    gwline.dataset.gw = g;
    if (!paintPlanStatus()) paintDeadline(A);
  }
  /** GW A's deadline on the GW line: "Sat 13:00 · 4d 17h" (tick() runs the countdown). */
  function paintDeadline(A) {
    const info = deadlineInfo(deadlineOf(ctx.bundle, A, A));
    gwline.classList.remove('ah-planning');
    // "Sat 10:00 · 1d 11h", no "GW6" before it (the selected tile under it names the week; the review, 2026-10-08: the
    // prefix wrapped the line at 375 with larger text, the pitch then cut); its title names the GW. "Deadline" said, not
    // shown: under the team's name the time and its countdown say it (the user, 2026-10-22: "Fri 20:30 · 22h 54m"), the
    // room the window's total's
    fill(dlEl, info.date ? [h('b', null, info.left <= 0 ? 'Deadline passed' : [h('span.sr-only', null, 'Deadline '), info.short]), h('span.ah-dl', { class: info.tone }, countdownParts(info))] : null);
    dlEl.title = info.date ? `Gameweek ${A} deadline: ${info.long}` : '';
  }
  /** A re-plan under way: a bake (baking; stale: a new forecast's) or the forecast itself updating. The shell's state
   *  banner is then its words for assistive tech alone (m-ahead.css), the window's total shimmers (totalNum) and the
   *  strip's wait line says how far it is (paintWait). */
  const replanning = () => REPLANNING.has(ctx.store.get('conn')?.state);
  /** While it re-plans the GW line said how far it was in place of the deadline (the user, 2026-10-08); since design
   *  1028d W2-line the strip's wait line says it (paintWait) and the GW line keeps GW A's deadline. → false (none shows) */
  function paintPlanStatus() {
    // (design 1028d W2-line, the owner, 2026-10-28: "user just can miss it needs to wait": every wait is told in one
    // place, the strip's wait line (paintWait), the first plan's too; the GW line keeps the deadline all the while: R25,
    // M10, M12, H13)
    gwline.classList.remove('ah-planning', 'ah-story');
    return false;
  }
  /** Every second: GW A's countdown (or a re-plan's progress), an edit's pending toast (pendingTick), the viewed week's
   *  checks' clock (waitClock), its choices drawn once their checks have stopped landing (weekSettled's bound: a solve
   *  that never ends draws nothing itself), and a re-render once GW A's deadline passes. */
  function tick() {
    // (the countdown's words as they were, before a re-plan's status draws it anew: the v1.3.75 review #2)
    const was = gwline.querySelector('.ah-dl')?.textContent;
    if (!ctl.hidden && (replanning() || S.story?.wait)) paintPlanStatus();
    paintStoryBar();
    pendingTick(ctx);
    if (S.wait) for (const c of [strip, pitchHost, S.week?.host].flatMap((x) => [...(x?.querySelectorAll('.ah-wclock') ?? [])])) c.textContent = clockShown(c);
    // the week line's checks placed again for a clock of more digits ("10:00": fitFacts places them for it as shown)
    if (S.wait && S.line && waited().length !== S.line.n) { S.line.n = waited().length; fitFacts(); }
    const due = S.drawn && S.M && !S.M.settled ? settleDue(S.M.key) : null;
    if (due != null && Date.now() >= due) schedule('pair');
    const dl = gwline.querySelector('.ah-dl');
    if (dl && S.dl) {
      const info = deadlineInfo(deadlineOf(ctx.bundle, S.dl.A, S.dl.g));
      fill(dl, countdownParts(info));
      dl.className = `ah-dl ${info.tone}`;
      // a countdown of other words ("1d 0h" to "23h 59m") fitted on the header's line again (keepGwLine)
      if (dl.textContent !== was) keepGwLine();
    }
    if (isLive(ctx) !== S.live) { S.live = isLive(ctx); render(); }
  }
  const clock = setInterval(tick, 1000);

  /** The focused control of each part the plan draws anew (ui.focusKey: a choice, its +, a transfer, the week line;
   *  B48: a + that made its transfer finds that transfer), focused again once it is drawn (keepFocus); the Week sheet's
   *  in the sheet (its rows), never another sheet's. */
  const hosts = () => [strip, decks, S.week?.host].filter(Boolean);
  const focusedKeys = () => hosts().map((x) => [x, x.contains(document.activeElement) ? focusKey(document.activeElement) ?? '[data-focus-home]' : null]);
  /** …a control gone (or one with no key of its own: a choice's +, Your rules' Remove, Hide), or hidden (ui.refocus):
   *  the week line on the screen (its focus home), the sheet itself in the Week sheet. */
  const keepFocus = (keys) => {
    for (const [x, key] of keys) if (key && x.isConnected) refocus(x, key, x === S.week?.host ? S.week.sheet.el : strip.querySelector('[data-focus-home]'));
  };
  /** A suggested plan's solve (forkPump) landed (pairChanged) on the plan view drawn: the week line, the choices on the
   *  pitch and an open Week sheet alone re-draw. */
  function renderPair() {
    const P = S.drawn, w = weekOf(P, gwNow(P));
    if (!w) { render(); return; }
    const keys = focusedKeys();
    renderWeek(P, w);
    renderDecks();
    placeHint();
    keepFocus(keys);
  }

  function render() {
    const b = ctx.bundle;
    S.drawn = null;
    if (!b) return;
    paintAvatar();
    renderHead();
    if (b.state === 'offline-data' || !b.entry) {
      fill(strip, h('p.m-para.ah-pre', null, COPY.preseason));
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
    S.drawn = P;  // the plan view on screen (schedule: a memory change that leaves it draws nothing)
    // B61 (johnson A6): a landing not drawn yet (FLASH), this team's (setFlash)
    const fresh = FLASH && FLASH.at !== S.flashAt && FLASH.team === `${P.entry}|${P.A}` ? FLASH : null;
    if (fresh) S.flashAt = fresh.at;
    // the focused control of the week line, the choices on the pitch or the Week sheet, focused again once it is drawn
    // anew (a keyboard or VoiceOver user stays on it)
    const keys = focusedKeys();
    // a sheet's ask to open this week's Your rules (openRules): the Week sheet there, once this draw is done
    if (RULES_ASK === g) { RULES_ASK = null; queueMicrotask(() => weekSheet(g, 'rules')); }
    renderGwLine(g, P.A);
    renderRules(P);
    renderWeek(P, w);
    S.snap = null;  // the cards as they stood, set by a mount (mountHere) for this draw's landing (landMotion)
    renderPitch(P, w);
    renderRail(P, g);
    renderTotal(P);
    renderPdBtn();
    if (!fitKey || !fitDrawn) fitPitch();
    renderDecks();
    placeHint(P, w);
    keepFocus(keys);
    landMotion(fresh, g);
    if (fresh) {
      // ...and tint once (m.css .m-shimmer.once: one fade within --dur, none under Reduce Motion): its changed tiles,
      // the week line when it made a transfer of the viewed week, and its rows in an open Week sheet
      const tint = (x) => { x.classList.add('m-shimmer', 'once'); setTimeout(() => x.classList.remove('m-shimmer', 'once'), 950); };
      for (const t of ticks.querySelectorAll('.ah-tick')) if (fresh.gws.includes(Number(t.dataset.gw))) tint(t);
      const line = strip.querySelector('[data-row="week"]');
      if (line && fresh.rows?.[g]?.length) tint(line);
      for (const r of S.week?.host.querySelectorAll('.ah-mrow') ?? []) if (fresh.rows?.[g]?.includes(`${r.dataset.out}>${r.dataset.in}`)) tint(r.querySelector('.ah-fg') ?? r);
      // ...and the viewed week's cards it changed, on their name plates (the card itself is see-through: the turf)
      for (const id of fresh.cards?.[g] ?? []) { const pn = pitchHost.querySelector(`.pm-card[data-id="${id}"] .pm-pn`); if (pn) tint(pn); }
    }
  }

  function renderBaking() {
    const d = ctx.data;
    renderGwLine(d.gw, d.gw);
    // the week line while the first week is planned: what it waits for (how far: the GW line, paintPlanStatus), its
    // doors' place (no control yet), the pitch your squad as it is, no choice on it (the pitch keeps its size when the
    // plan lands)
    S.week?.sheet.close();
    // your team's first plan under the hold is the solver's (memory.keepBase): one it couldn't finish says so, a tap asks
    // again (never a plan the phone made in its place: the owner, 2026-10-26)
    // Plan memory only once the bake's base road is in (mount): landed before it (app.js firstLoad), a memory attached
    // now would ask its heal of roads not baked yet
    const gp = ctx.bundle?.roads?.base ? memPlan(ctx) : null, failed = !!gp?.hold && !!gp.error && !gp.pending;
    // …and, where your rules are what no plan keeps (an older app's phone-made plan dropped on load, its rules left), the
    // clash row with a Remove on each rule it names: your rules taken off one by one, each said with its Undo, never
    // silently (reviewer 2 of solversquad, 2026-10-26: only Try again, which failed the same way)
    const V = failed ? { ...info(ctx), mem: gp, pins: gp.pins, weeks: [], healing: false, editable: editable(ctx) } : null;
    const c = V && aboutRules(gp.error) ? clashParts(V, null) : null;
    const off = (p) => { const said = COPY.removed(rowName(V, p)), r = memOf(ctx).removePin(p.id); toastOf(ctx)(said, 'info', { action: { label: 'Undo', onClick: () => r.undo() } }); };
    fill(strip, h('section.ah-block', { 'aria-label': 'Your plan' }, failed
      ? barNode({ one: gp.error.plain || COPY.unfinished, two: 'Try again', warn: true, label: `${gp.error.plain || COPY.unfinished} Try again`, onClick: () => memOf(ctx).heal({ now: true }), doors: doorStubs(), cls: '.ah-pbake' })
      // (in the story the header says how far: here the squad drawn is named, FPL's lineup until the plan's comes)
      : S.story ? barNode({ one: h('span.ah-bn', null, COPY_FPL_TEAM), doors: doorStubs(), cls: '.ah-pbake' })
      : barNode({ one: [h('span.ah-spin', { 'aria-hidden': 'true' }), h('span.ah-bn', null, planning(d.horizon))], status: true, doors: doorStubs(), cls: '.ah-pbake' }),
    c?.pins.length ? h('div.ah-brow.ah-ask.ah-clash', { role: 'status' }, icon('warn', { size: 16 }), h('p.ah-askt', null, COPY.rulesStuck(c.what, null, COPY.clashWhy(gp.error.why, gp.error.gw))),
      h('div.ah-askb', null, c.pins.map((p) => h('button.ah-askno', { type: 'button', disabled: !V.editable, onClick: () => off(p) }, `Remove ${rowName(V, p)}`)))) : null));
    fill(decks);
    S.M = null;
    S.wl = null;
    S.lineKeep = false;
    paintWait();
    S.pitch = null;
    luBtn.hidden = true;
    S.planReset = false;
    rpBtn.hidden = true;
    mountHere({
      ...d.lineup, players: d.byId, gw: d.gw, horizon: d.xpGws, first: true, benchRow: true, gapRows: true, second: plateOf().second,
      onPlayer: (id) => ctx.openSheet('player', id, { gw: d.gw }),
    });
    fill(asksHost);
    const past = edgeTicks({ reach: d.reach ?? d.horizon, gws: d.horizon });
    rail.style.setProperty('--n', d.horizon.length + past.length);
    rail.style.setProperty('--i', 0);
    fill(ticks, d.horizon.map((x) => h('div.ah-tick', { dataset: { gw: x } }, h('span.g', null, `GW${x}`), h('span.p', null, h('span.m-skel')))), past);
    fill(totLine, h('span.k', null, `${span(d.horizon)} `), h('span.m-skel'));
    fill(totalEl, span(d.horizon), ' ', h('span.m-skel'));
    renderPdBtn();
    if (!fitKey || !fitDrawn) fitPitch();
  }
  const planning = (gws) => `Planning ${span(gws)}…`;
  const COPY_FPL_TEAM = 'Your team as set in FPL';

  /** "Your rules" (RULES_V2 §4, DESIGN_V2 §3.7), the Week sheet's last part (asksHost): every veto, keep and cash rule you
   *  asked for (listedRules: a transfer of yours in the viewed week is its own row, a GW's chip its options) is a row until you
   *  remove it (Remove; the row: what it does, its scope); "Clear all" acts at once (Undo). When the full plan can't
   *  keep them all, the Week sheet's status row says so in every week (clashRow, §5). Drawn only when there is one. */
  function renderRules(P) {
    const rules = listedRules(P, gwNow(P));
    if (!rules.length) { fill(asksHost); return; }
    const live = isLive(ctx);
    // B7: a Remove that re-plans GW A under way is off, its reason once under the list (GW A's own block says it already)
    const offLive = rules.some((p) => ruleOf(P, p).removable && liftsLive(ctx, P, p)) || (live && rules.length > 1);
    fill(asksHost, h('section.ah-rules', { 'aria-label': COPY.rulesHead },
      h('div.ah-list', null,
        h('div.ah-rules-row', { role: 'list' },
          rules.map((p) => {
            const r = ruleOf(P, p);
            return h('div.ah-rrow', { role: 'listitem' },
              h('button.ah-rule', { type: 'button', class: { lock: !r.removable }, 'aria-label': `${r.text}. ${r.desc}`, onClick: () => ruleSheet(p) }, r.text),
              r.removable ? h('button.m-chipbtn.m-danger.ah-rmv', { type: 'button', disabled: !P.editable || liftsLive(ctx, P, p), 'aria-label': `Remove ${r.text}`, dataset: { rule: p.id }, onClick: () => removeRule(ctx, p.id) }, 'Remove') : null);
          }),
          // Remove all edits from GW A (clearAll)
          rules.length > 1 ? h('div.ah-rrow.all', { role: 'listitem' }, h('button.m-chipbtn.m-danger.ah-rmv', { type: 'button', disabled: !P.editable || live, onClick: () => clearAll() }, 'Remove all')) : null),
        offLive && gwNow(P) !== P.A ? h('p.ah-rules-note.m-foot', null, COPY.live(P.A)) : null)));
  }

  /** A rule's sheet: what it does; a Keep or a veto can change its scope (F11: scopeLabels, "GW6 only" · "GW6–9",
   *  "Not in GW6" · "Never"); [Remove]. No second button: its ✕ and a swipe down close it (B94: "Keep it" closed it, and
   *  Keep is a rule's own name). */
  function ruleSheet(p) {
    const P = plan(ctx);
    const r = ruleOf(P, p);
    ctx.sheets.open({
      title: r.text, sub: r.desc, detent: 'small',
      build(body, sheet) {
        if (r.scope && !p.via) {
          const g = num(p.gw) ?? P.A;
          const words = scopeLabels(p.kind, g, P.end);
          const opts = [['gw', words.gw], ['all', words.all]];
          body.append(roving(h('div.m-seg.ah-scope', { role: 'radiogroup', 'aria-label': 'When', style: { '--n': 2, '--i': r.scope === 'gw' ? 0 : 1 } }, h('span.m-seg-thumb'),
            opts.map(([k, l]) => h('button', {
              type: 'button', role: 'radio', 'aria-checked': String(k === r.scope), disabled: !P.editable,
              onClick: () => { if (k === r.scope) return; sheet.close(); rescope(ctx, p, k); },
            }, l))), { pick: (b) => b.click() }));
        }
        const live = liftsLive(ctx, P, p);  // B7: its Remove would re-plan GW A under way
        body.append(h('div.ah-btnrow', null,
          h('button.m-danger', { type: 'button', disabled: !P.editable || live, onClick: () => { sheet.close(); removeRule(ctx, p.id); } }, 'Remove')));
        if (!P.editable || live) body.append(h('p.ah-why', null, P.editable ? COPY.live(P.A) : P.why));
      },
    });
  }

  /** Clear all (A6): every rule of the list off at once, "Removed 3 rules: … pts over GW6–9" with one Undo (no ask). */
  function clearAll() {
    const P = plan(ctx);
    const asks = listedRules(P, gwNow(P));
    const what = COPY.removedRules(asks.length);
    edit(ctx, { drop: asks.map((p) => p.id), from: P.A, what, text: vsPrev(ctx, what) });
  }

  const ap0 = approxAt;
  /** A later week's bank below 0 on a solved plan by no more than FPL's sale prices explain: price drift, not an
   *  overspend (COPY.priceDrift; the solver prices a player you own at today's price, FPL pays the half-profit price,
   *  so the room is that gap for each one the plan sells by then). More is short ("−£1.8m in bank": the checker,
   *  2026-10-09, a plan £1.8m over budget read "≈ price drift"); GW A's short bank is real (FPL pays less for a sale
   *  than the plan counted). */
  const driftRoom = (P, w) => P.weeks.filter((x) => x.gw <= w.gw).flatMap((x) => x.moves.map((m) => m.out))
    .reduce((s, p) => s + Math.max(0, (P.L.priceT(p) ?? 0) - (P.L.sellT(p) ?? P.L.priceT(p) ?? 0)), 0) / 10;
  // (never a week your transfers leave short of money: the hold's debts, memory.holdOf)
  const owes = (P, g) => P.pins.some((p) => p.id === 'hold' && (p.debts || []).includes(g));
  const priceDrift = (P, w) => w.gw > P.A && !ap0(P, w.gw) && w.bank != null && w.bank < -1e-9 && -w.bank <= driftRoom(P, w) + 1e-9 && !owes(P, w.gw);

  // ---------------------------------------------------------------- the week line, the choices on the pitch and the Week sheet

  /** M1 (the plans review, 2026-10-11; B17's rule for the pair, johnson: a thumb aimed at one + met another as rows
   *  landed): while a plan of the week still checks, each keeps the slot it was first drawn in for the same plan view
   *  and GW, a landing changing its number and line in place, a new choice after them. Once none checks, the list is
   *  best first (plansOf's order), as its heading says (review 5, 2026-10-12: landed rows stayed in estimate order, the
   *  best under More plans): that draw re-sorts once, and a +
   *  tapped within ADD_HOLD_MS of it is ignored (addOnce, S.addAt as after a +'s re-flow). Keyed by its GW-g choice. */
  function heldOrder(P, g, plans) {
    const key = (pl) => `${pl.choice.moves.map((m) => `${m.out}>${m.in}`).sort().join(',')}|${JSON.stringify(pl.choice.chips)}`;
    const busy = plans.some((x) => x.state === 'solving');
    const was = S.planAt?.P === P && S.planAt.g === g ? S.planAt : null;
    const at = new Map((busy && was ? was.keys : []).map((k, i) => [k, i]));
    const out = busy && was ? plans.slice().sort((a, b) => (at.get(key(a)) ?? 1e9) - (at.get(key(b)) ?? 1e9)) : plans;
    if (!busy && was?.busy && out.some((pl, i) => key(pl) !== was.keys[i])) S.addAt = Date.now();
    S.planAt = { P, g, busy, keys: out.map(key) };
    return out;
  }

  /**
   * The plan on the screen (the pitch research's steps 3 and 4; the user, 2026-10-19: "go make actual changes" after
   * the try-on; 2026-10-20: the card behind): the week line over the pitch (renderLine), the choices on the pitch
   * (renderDecks, drawn once the pitch is mounted: S.M) and, while it is open, the Week sheet (drawWeek), all three from
   * one model of the viewed week (weekModel), so they share one order of the choices (heldOrder) and one +'s re-flow
   * hold (addOnce).
   */
  function renderWeek(P, w) {
    const M = weekModel(P, w);
    S.M = M;
    tellStory(w.gw, M);
    renderLine(P, w, M);
    if (S.week) drawWeek(P, w, M);
    S.tint = null;  // B31: the transfer a + made is tinted the first time it is drawn (xferRow), only then
    // B31: addOnce ignores a + tapped this soon after the choices re-flowed: the first draw after a + or the list's
    // re-sort (S.addAt), never a later one that moved nothing (review 6, 2026-10-13: every redraw, a hidden plan
    // landing, armed it again, so a + went unanswered while the list's other plans landed)
    if (S.addAt && !(S.flowAt >= S.addAt)) S.flowAt = Date.now();
    sayDrift(P);
    sayCarried(P);
    pendingAgain(ctx, P.mem);
    // the line every GW: last, so a toast above (a reopened check's, with its Undo) never takes its place at once; on a
    // first load up through the story's checks too, in its second act (tellStory set S.story.wait this draw)
    // (its second act up for CHEER_MS more once the wait ends, whether or not its checks outlasted the planning (when
    // they all ended while it planned, the story went from planning straight to done, and a short checking stage showed
    // it for a moment): the owner, 2026-10-28, "why it only showed me what my new rank but never showed the next message
    // about last season manager place")
    const checking = !replanning() && !!S.story?.wait;
    if (replanning() || checking) S.act2 = 'due';
    const late = !replanning() && !checking && S.act2 === 'due';
    if (late) S.act2 = 'said';
    sayCheer(ctx, P, cheerEl, replanning() || checking || late, checking || late ? 1 : 0, { linger: late });
  }
  /**
   * The wait's one story (design 1027a A-stages; the owner, 2026-10-27: "Why planning happening in three places - first in
   * main screen when loading team after at team screen during cheer up sign and then also 'Checking..'"): Connect's
   * "Raketa ✓ · Planning GW9–12 · 0:12 · ~40 s left" (app.js planning) goes on in the GW line as "Planning GW9–12 · 0:38
   * · ~20 s left" (paintPlanStatus; calls.steadyEta) while the bake's roads land, then, the plan in, "Checking GW9's moves · 1:06 · 5 done" (its
   * clock the plan's, from the bake's start), until GW g's choices are settled (weekModel's M.settled): then the deadline,
   * and the story is over for this screen (later checks the week line's, as before: renderLine). Its count is GW g's
   * choices checked so far, every one listed since the plan started (`seen`), never back and with no total: each road and
   * chip pre-solve that lands can add a choice or take one's room (plansOf: FORK_MAX, rankOf), so a count of the list
   * went "3 of 8", "3 of 5", "4 of 8". The strip's own checks and its clock stay off meanwhile (renderLine).
   */
  function tellStory(g, M) {
    const st = S.story;
    if (!st) return;
    const bake = ctx.bundle?.bake, conn = ctx.store.get('conn')?.state;
    if (st.t0 == null) st.t0 = conn === 'baking' && Number(bake?.started) > 0 ? Number(bake.started) * 1000 : Date.now();
    const seen = st.seen.get(g) ?? new Set();
    st.seen.set(g, seen);
    for (const x of M.all) if (x.state !== 'solving') seen.add(forkKey(x.choice, g));
    st.f = M.all.length ? M.all.filter((x) => x.state !== 'solving').length / M.all.length : 1;
    if (replanning()) return;
    st.wait = M.wait && !M.settled ? { g, n: seen.size } : null;
    if (!st.wait) S.story = null;
    // (the GW line drawn before the week: its stage as this draw has it)
    if (!paintPlanStatus() && S.dl) paintDeadline(S.dl.A);
    paintStoryBar();
  }
  /** The story's one bar (the judges of design 1027a: the banner's stopped at the bake's end, the checks left with no
   *  meter; on the strip's wait line since design 1028d W2-line, paintWait): the bake's share by time (calls.planShare) over its first STORY_PLAN, then the viewed week's
   *  listed checks in over the rest; never back (the most it showed: a list that grows holds it), a sweep while the bake
   *  has nothing estimated yet; gone with the story. Each second (tick) and each draw. */
  const STORY_PLAN = 0.7;
  function paintStoryBar() {
    // (its share kept for the strip's wait line, which draws it: design 1028d W2-line; the bar under the header gone)
    const st = S.story;
    if (st && !ctl.hidden) {
      const baking = ctx.store.get('conn')?.state === 'baking', share = baking ? planShare(ctx.bundle?.bake) : null;
      const p = baking ? (share == null ? null : share * STORY_PLAN) : STORY_PLAN + (1 - STORY_PLAN) * st.f;
      if (p != null) st.p = Math.max(st.p, p);
    }
    paintWait();
  }
  /**
   * The wait now, as the strip's wait line says it (design 1028d W2-line; the owner, 2026-10-28, his GW10 after a GW9
   * change: nothing on screen said it waited; R15, R18, N1, N5): one process at a time, the widest first. The forecast
   * updating (no measure: a few sweeps); a re-plan or the first plan baking ("Planning GW9–12 · ~10 s left · 0:04":
   * steadyEta in the story, planEta else; its share planShare's, the story's own st.p); the story's checks of the
   * viewed week ("Checking GW9's moves · 5 checked · 0:24", the story's clock and share); else the viewed week's own
   * checks (S.wl: renderLine), the take's, an Undo's, a later week's after a change, "Checking GW10 · 1 of 2 · 0:03" on
   * the checks' clock (waitClock's S.wait), its share by the count with the step under way creeping on (calls.stepShare;
   * none counted: a few sweeps). null while nothing the pitch shows waits.
   */
  function waitNow() {
    if (ctl.hidden) return null;
    const conn = ctx.store.get('conn')?.state, st = S.story, now = Date.now();
    if (conn === 'updating') return { key: 'updating', word: 'Updating', scope: 'the forecast', p: null };
    if (replanning()) {
      const bake = ctx.bundle?.bake, e = st ? steadyEta(bake) : planEta(bake), gws = ctx.data?.horizon;
      return { key: `bake@${bake?.started}`, word: 'Planning', scope: gws?.length ? span(gws) : null, prog: e.left != null ? leftText(e) : null, so: e.so, p: st ? st.p || null : planShare(bake) };
    }
    if (st?.wait) {
      const g = st.wait.g;
      return { key: `story@${g}`, word: 'Checking', scope: `GW${g}`, long: `GW${g}'s moves`, prog: st.wait.n ? `${st.wait.n} checked` : null, so: st.t0 == null ? null : (now - st.t0) / 1000, p: st.p || null };
    }
    const w = S.wl;
    if (!w || !S.wait) return null;
    const p = w.n ? (w.max = Math.max(w.max, stepShare(w.done, w.n, reduceMotion() ? 0 : now - w.at, w.tau))) : null;
    return { key: `week@${w.key}`, word: 'Checking', scope: `GW${w.g}`, long: `GW${w.g}'s moves`, prog: w.n ? `${w.done + 1} of ${w.n}` : null, so: (now - S.wait.t0) / 1000, p };
  }
  /** The strip's wait line (waitView) while anything waits (waitNow), in place of the line's own words, its doors kept
   *  (H16: Bring in… and Chips… work meanwhile), its bar on the strip's lower edge; the line's words back as they fit
   *  (fitFacts) once it ends, which is said (waitSaid). Each draw and each second (tick, via paintStoryBar). */
  function paintWait() {
    const W = waitNow(), block = strip.querySelector(':scope > .ah-block:not(.ah-fitprobe)'), pbt = block?.querySelector('.ah-pbt');
    const on = !!W && !!pbt, was = !!block?.classList.contains('ah-waiting');
    block?.classList.toggle('ah-waiting', on);
    // (a money short or an amber notice keeps the line's words, the wait its bar, the dim and the plates' "checking…":
    // a problem is never hidden behind a wait, as on main before the wait line; design 1028d W12-dimline, the build
    // judge of W: "a money-short warning yields to the wait line")
    block?.classList.toggle('ah-wkeep', on && !!S.lineKeep);
    paintDim(W);
    if (on) {
      if (waitV.t.parentNode !== pbt) pbt.append(waitV.t);
      if (waitV.bar.parentNode !== block) block.append(waitV.bar);
      paintWaitView(waitV, W);
    } else { waitV.t.remove(); waitV.bar.remove(); waitV.key = null; }
    if (was && !on) fitFacts();
    const said = W ? `${W.word} ${W.long ?? W.scope ?? ''}`.trim() : S.waitWas ? `${S.waitWas === 'Planning' ? 'Plan ready' : 'Checked'}` : '';
    if (W || S.waitWas) { if (waitSaid.textContent !== said) waitSaid.textContent = said; S.waitWas = W?.word ?? null; }
  }

  /**
   * The pitch dimmed while the wait line shows (design 1028d W12-dimline: W1-dim's dim under W2-line's words; the owner,
   * 2026-10-28: "maybe it must to blur pitch or similar while it's not ready"): the same state as the line (waitNow), so
   * GW10 right after a GW9 change dims as its line says "Checking GW10 · 1 of 1", the first plan and a take's re-check
   * too. A dim, never a blur (T2, T3, H19); only the turf and chalk (m-ahead.css .ah-pitch.ah-wait), the shirts, plates,
   * names and xP as ever and every tap as ever (H16, R19); static for as long as it waits (W 2.2.2, N15), its end the
   * green back (J13, J14, R24). Shown once a wait has run WAIT_DIM_MS without a break, so a quick take never flashes it
   * (N7, N17, M11): its start kept across the line's kinds (a bake, its checks, the week's) and timed to the ms.
   */
  const WAIT_DIM_MS = 1000;
  function paintDim(W) {
    const now = Date.now();
    if (!W) { S.dimT0 = null; clearTimeout(S.dimTimer); S.dimTimer = null; pitchHost.classList.remove('ah-wait'); return; }
    S.dimT0 ??= now;
    const left = S.dimT0 + WAIT_DIM_MS - now;
    pitchHost.classList.toggle('ah-wait', left <= 0);
    if (left > 0 && !S.dimTimer) S.dimTimer = setTimeout(() => { S.dimTimer = null; paintWait(); }, left + 5);
  }

  /**
   * The viewed week's model, once per draw: its choices (the user, 2026-10-11, "make him to suggest plans, not just
   * players"; decision 6, every week you can change, in both modes, in your Wildcard or Free Hit week too, each taking
   * the chip back: plansOf, in heldOrder, ten at most), the "instead of …" every listed choice's + takes back (said once,
   * on the Week sheet's plans heading: the books review, 2026-10-13), GW A under way (B7: no choice there, nothing drawn
   * that can't act; its live sentence, B68: liveCheck) and the notices that stand, in this order: B12's re-plan that
   * couldn't keep your choices (clashLine), GW A's price watch (watchOf: amber while waiting puts a move out of reach,
   * quiet while it only costs or gains money, not drawn while it changes nothing, B25; the morning after its night says
   * what the prices did, B139), B14's new forecast that changed the suggested plan (forecastLine), GW A's lineup where
   * it differs from the one set in FPL (fplSets; the user, 2026-10-21: fix all (first-use proposal #4): last, so it
   * never takes the line from the three before it; `quiet`: an instruction that stands, not a problem, so it gives the
   * week line's second line to a short bank and the week's checks too: renderLine). The first notice is the week line's
   * second line where it shows there, said once to VoiceOver (noticeSaid); each is a row of the Week sheet in this
   * order (`row`, drawn there only). (Rules an edit took back are its toast's alone: B81's Restore row went, the user
   * 2026-10-19.)
   */
  function weekModel(P, w) {
    const g = w.gw, sq = squadWeek(w);
    const ink = inkAt(ctx, P, g);
    const all = plansOf(ctx, P, g);
    const plans = ink ? [] : listedOf(heldOrder(P, g, all));
    // none lit on the pitch until none checks (weekSettled, litOf; the user, 2026-10-21: fix all (first-use proposal #8)),
    // each behind the card of the player it would replace (decksOf), for the pitch (renderDecks) and the checking line
    // (never while the story's first plan still bakes: each road that lands can add a choice, or take one's room
    // (FORK_MAX), so a week lit then went back to "checking…" when the bake's last road came; design 1027a A-stages)
    const settled = weekSettled(P, g, all) && !(S.story && ctx.store.get('conn')?.state === 'baking'), key = weekKey(P, g, all);
    const { decks, toks } = decksOf(P, w, { sq, plans });
    const lit = litOf(P, w, { sq, plans, settled }, decks, toks);
    // what the pitch shows lit and green, the Week sheet's green too (litShown; the user, 2026-10-22: one rule), as the
    // pitch last drew this week's places (renderDecks' `drawn`, drawn again after this: sheetFollows; the owner,
    // 2026-10-25, "Follow the pitch")
    decks.drawn = S.decks?.gw === g ? S.decks.drawn : null;
    // (and the choices whose plates it drew, a sentence's sellers' own singles among them: design 1026e)
    decks.drawnPl = S.decks?.gw === g ? S.decks.drawnPl : null;
    const shown = litShown(P, w, { sq, plans, settled }, decks, toks, lit);
    // how far the week's checks are (weekWait); the checks' clock from its first draw with a choice or its transfers'
    // number waiting, until none waits (waitClock), from 0:00 again for checks of their own (weekKey: the phone recheck
    // of the first-use proposals, 2026-10-21, "Checking · 2 of 8 · 0:03" right after a take, the clock of the checks
    // before it)
    const wait = weekWait(all, lit.size);
    S.wait = wait || weekPending(P, w) ? (S.wait?.key === key ? S.wait : { key, t0: Date.now() }) : null;
    // the "instead of …" two rows or more take back, said once over them (johnson r7 §4: "instead of Saka → Palmer" on
    // four rows of the Week sheet), the one most rows share
    const backs = new Map();
    for (const pl of plans) { const b = planBack(P, g, pl).back; if (b) backs.set(b, (backs.get(b) ?? 0) + 1); }
    const [top, many] = [...backs].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
    const sharedBack = many > 1 ? top : null;
    const live = g === P.A && isLive(ctx);
    sayNight(P);
    const watch = g === P.A && !sq && w.moves.length && !frozenAt(P, g) ? watchOf(ctx) : null;
    const said = watch?.at != null && watch.nights[watch.at].verdict !== 'free' ? watch : null;
    if (said) keepNight(P, said);
    const watching = said && ctx.api?.local?.get?.(WAIT_KEY) !== waitSig(P, said) ? said : null;
    const clash = clashLine(P), news = forecastLine(P), sets = fplSets(ctx, P, w);
    // (the price watch's row with its Hide in the same order: the week line's, the lineup's last; the first-use phones,
    // 2026-10-21: drawn after the lineup's row, the opposite of the week line)
    const notices = [clash && { text: clash.text, warn: true, row: () => clashRow(P, clash) },
      watching && { text: watching.short, warn: watching.tone === 'act', row: () => watchView(watching, { cls: '.ah-pwatch', wait: () => waitWatch(P, watching) }) },
      news && { text: news, row: () => noteRow('.ah-news', news) },
      sets && { text: COPY.setInFpl(sets), quiet: true, row: () => noteRow('.ah-fplset', COPY.setInFplRow(sets)) }].filter(Boolean);
    return { key, all, sq, plans, decks, toks, lit, shown, wait, settled, sharedBack, live, liveText: live ? liveCheck(ctx.bundle?.entry?.published, w, P.L) : null, notices };
  }
  /** The first-use run, 2026-10-21, #2 (first-time managers waited 6 s to 6 min on "checking…", not knowing "whether to
   *  wait or whether something was broken"): the viewed week's checks' time so far (S.wait: weekModel) on the bake's and
   *  Add a player's clock (clockText, B87b), no estimate (none is known for a choice's solve): in "checking…"'s place
   *  (the week line, a transfer row: numOf), after the count of the week's plans (the Week sheet's: drawWeek; the week
   *  line's second line until they are lit: renderLine); never in a number's slot of a choice (a token's, a place's
   *  header: "Roll 0:00" read as the Roll's value; Johnson's review, 2026-10-22, the user's order the same day). On the
   *  week line (`late`) only once the checks have taken LATE_S (the same: it mostly read 0:00), `pre` until then, `sep`
   *  before it. Put in place each second (tick: clockShown), never a whole draw; never read out (the labels say
   *  "checking…"). null while nothing waits. */
  const LATE_S = 10;
  const waited = () => clockText((Date.now() - S.wait.t0) / 1000);
  const clockShown = (n) => ((Date.now() - S.wait.t0) / 1000 < LATE_S && n.dataset.late != null ? n.dataset.pre ?? '' : `${n.dataset.sep ?? ''}${waited()}`);
  const waitClock = (cls = '', { late = false, pre = '', sep = '' } = {}) => {
    if (!S.wait) return null;
    const n = h(`span.ah-wclock.m-num${cls}`, { 'aria-hidden': 'true', dataset: { ...(late ? { late: '' } : {}), pre, sep } });
    n.textContent = clockShown(n);
    return n;
  };
  /** What the viewed week's choices count against and over which weeks, "Suggested plans · GW8–11 · vs rolling"
   *  (COPY.suggested, B3, B26): the Week sheet's plans heading and the pitch's choices' spoken name (renderDecks). */
  const plansHeading = (P, g) => COPY.suggested(P.gws.filter((x) => x >= g), plansVs(P, g), COPY.plansHead);
  /**
   * The week line (the pitch research's step 3; the user's 3a, 2026-10-19: "one week line stays above the pitch"), the
   * strip since the owner's pick of 2026-10-26 (design 1026c: "find fit transfer line from tab above on pich can be
   * moved to pitch - so no transfer yeat remove since rolling already show it and when transfer done it sidplaye where
   * rolling or best transfer is not in plate above pitch"): the week's status said once, on the pitch beside the goal
   * (statusTok, `S.status`), the strip ONE line of the one fact the pitch can't show:
   *   · no transfer: "Rolling" ("Rolling is best" once settled with nothing better, "Rolling ✓" under your Roll:
   *     emptyHead) over "1 FT · £0.5m ITB · 2 FT in GW9" (rollFacts: the bank after the week's moves, the user,
   *     2026-10-21: "where it shows itb money", "On the week line"; a short bank's words in its place), "2 FT in GW9"
   *     left to the Week sheet where the line doesn't hold it (fitFacts; the user, 2026-10-22: "WEEK LINE AT MOST 2
   *     LINES");
   *   · your transfers, each an IN card on the pitch: "1 transfer +0.4" ("2 transfers −4 +5.0") over "Out: Saka"; its
   *     number weekGain's;
   *   · a Wildcard or Free Hit: "Wildcard +14.7" over "8 changes", "checking…" while its squad is worked out (≈); its
   *     number under your team as it is your chip's plan against the week's roll plan, as a week with transfers says its
   *     own (chipWeekGain: weekRollOf; the user, 2026-10-22: "vs rolling everywhere", the token's and the toast's
   *     number), "checking…" while either still solves; off the hold against not playing it (chipGain);
   *   · GW A under way: its sentence alone, cut at its end (liveCheck; whole in the Week sheet; no stack that week:
   *     renderDecks);
   * a problem notice that stands takes the line after the lead (the first, "· +1" for more; amber for a clash or a
   * price that won't wait), else a short bank keeps it, else, until the week's choices are lit, how far their checks
   * are ("Checking GW9 · 3 of 6 plans · 0:12"). GW A's lineup notice (quiet: weekModel), only where none of them
   * stands, is never on the strip: on the week's status beside the goal in every week, under its words, one look (the
   * owner, 2026-10-26: "fix inconsistency", of it moving to the strip once a transfer was made; 2026-10-29, "fix all",
   * of its two designs: "Rolling"'s own words in a week with no transfer since 2026-10-22). Wherever the facts aren't drawn
   * (all but GW A under way) the week's FT and bank lead the line, "1 FT · £0.3m ITB · Out: Saka", a short bank's words
   * in its place (weekLead; the user, 2026-10-21: "why itb missing", of GW8's line under "Set in FPL: start Murillo");
   * the checks' words then give way beside it, never their clock (fitFacts).
   * "Bring in…" then "Chips…" at its right end (the user, 2026-10-13: Bring in… first; none where no edit reaches:
   * GW A under way; off on a plan you can't change). A tap opens the Week sheet (weekSheet), as the status's does. The
   * page's focus home (B48: focus lands here when a sheet closes and what opened it has gone: app.js dismiss).
   */
  function renderLine(P, w, M) {
    const g = w.gw, n = w.moves.length;
    const ap = ap0(P, g);
    // a take of k transfers this week still checked, the plan before it drawn (no move there yet): its rule keeps them
    // (memory.pinRoll's caps, "GW9 frozen"), so the line says "1 transfer" and "checking…", never the week as drawn (the
    // owner, 2026-10-27, of João Pedro → Evanilson: "it shows 'Rolling' first as if i chose rolling")
    const kept = !n && !M.live && !M.sq && ap ? rollKeeps(P.pins.find((p) => p.id === `roll:${g}`)) : 0;
    // (`mine`: the week's own words on the line, said whatever takes it: "Out: Saka", "8 changes")
    let one = null, gain = null, wait = false, two, said, short = null, facts = false, factsSaid = '', mine = null;
    if (M.live) {
      two = said = M.liveText;
    } else if (M.sq) {
      const v = chipWeekGain(ctx, P, g);
      one = chipName(M.sq);
      gain = v.cmp;
      wait = v.wait;
      // its changes are its squad's, none counted while that is worked out (the first-use phones, 2026-10-21: "Free Hit"
      // over "0 changes", then "12 changes"): "checking…", as Chips… says it
      two = mine = ap ? COPY.chipChecking : COPY.nChanges(n);
      said = `${one}${wait || v.cmp ? `, ${numSaid(wait, v.cmp, ap, !!v.vs)}${v.cmp && !v.vs ? ' against no chip' : ''}` : ''}`;
    } else if (n) {
      const v = weekGain(P, w);
      one = COPY.nTransfers(n);
      gain = v.cmp;
      wait = v.wait;
      short = bankWarn(P, w);
      two = mine = COPY.outNames(movesInOrder(P, w).map((m) => P.L.name(m.out)));
      said = `${one}${hitSaid(w.hits)}, ${numSaid(wait, v.cmp, ap, v.vs)}`;
    } else {
      // ("Rolling is best" where the Roll's token said it: the week settled, no move its best, its Roll offered)
      const f = rollFacts(P, w, !!M.settled && !M.lit.best && M.toks.some(rollOnly));
      one = kept ? COPY.nTransfers(kept) : f.head;
      wait = kept > 0;
      two = f.rest;
      said = kept ? `${one}, ${numSaid(true)}` : f.head;
      factsSaid = f.said;
      facts = true;
    }
    // a problem notice on the line, with " · +1" for each other one standing; GW A's lineup notice on the status (lineNotices)
    const { problem, more, lineup } = lineNotices(M.notices, M.live);
    // until the week's choices are lit on the pitch (litOf), how far their checks are (weekWait), in the Week sheet's
    // words (the user, 2026-10-21: fix all (first-use proposal #8): "Checking GW9 · 3 of 6 plans · 0:12"), where no problem
    // notice or short bank stands; where they don't fit, "plans" goes, then the GW ("Checking · 3 of 6": the line is the
    // viewed week's; the review of the first-use proposals, 2026-10-21: cut at 375–390 px), then the words ellipsise,
    // then they go; the clock is never cut (fitFacts)
    // (design 1028d W2-line: the checks told on the strip's wait line in its place, over a notice or a short bank too,
    // which come back when they end: paintWait; S.wl what it counts, the step under way timed from its last landing)
    const checking = null;
    const wl = !M.live && S.wait ? M.wait ?? { i: 1, n: 0 } : null, was = S.wl?.key === S.wait?.key ? S.wl : null;
    S.wl = wl ? { key: S.wait.key, g, n: wl.n, done: wl.i - 1, at: was?.done === wl.i - 1 ? was.at : Date.now(), max: was?.n === wl.n ? was.max : 0,
      tau: wl.i > 1 ? (Date.now() - S.wait.t0) / (wl.i - 1) : 4000 } : null;
    const notice = problem ? `${problem.text}${more ? COPY.moreNotices(more) : ''}` : null;
    // (an amber notice or a short bank keeps the line over the wait's words: paintWait, design 1028d W12-dimline)
    S.lineKeep = !M.live && (!!problem?.warn || !!bankWarn(P, w));
    // (the lineup notice under the status's words in every week, one look, S.status's `sub`: "1 transfer +1.2" or
    // "Rolling" over "Set in FPL: 3 changes"; the owner, 2026-10-29, "fix all", of "set in fpl note have different
    // designs": in "Rolling"'s place as its words since 2026-10-22, a small line under any other); a problem notice keeps
    // the line after the week's FT and bank
    if (problem) two = notice;
    // (the checks' words and their clock after the lead, fitFacts shedding their words; the clock carries its own " · ")
    const chk = checking && h('span.ah-chk', null, h('span.ah-bn.ah-cw', null, checking[0]), waitClock('', { late: true, sep: '\u00a0·\u00a0' }));
    if (checking) two = chk;
    // the week's bank leads the line wherever its facts don't say it (the user, 2026-10-21: "why itb missing", of GW8's
    // line under "Set in FPL: start Murillo"): "£0.3m ITB · Out: Saka", a short bank's words in its place (bankLead);
    // its free transfers before it, in every state (the user, 2026-10-22, Boss of the gym's GW8 under "Set in FPL: 3
    // changes": "3 FT · £0.6m ITB · Out: Gvardiol, …"; weekLead): a notice or the checks after the week's own words, cut
    // from the end where they don't fit (m-ahead.css .ah-bs; fitFacts)
    const own = facts && !checking && !problem;
    const lead = M.live || own ? null : weekLead(P, w);
    const rest = notice ?? (checking ? checking[0] : null);
    // (the rest after it giving way, never the lead: .ah-brest)
    if (lead) two = [h('span.ah-blead', null, lead.node, bsep('\u00a0·\u00a0')), h('span.ah-brest', null, two)];
    // the notice on the line said once to VoiceOver, and nothing once none is on it (the first-use phones, 2026-10-21:
    // "Set in FPL: start Murillo" outlived its notice, onto weeks with none)
    const told = [problem?.text, lineup].filter(Boolean).join('. ');
    if (noticeSaid.textContent !== told) fill(noticeSaid, told || null);
    // the status token's (statusTok): the week's −4 only where its words are its transfers (a squad chip's are free);
    // green where the week is yours (your transfers, your chip, your Roll), as "Wildcard · yours" and "Rolling ✓" were;
    // the lineup notice under its words (never green: FPL's to do, not yours) said after the week's own words ("Rolling.
    // Set in FPL: 3 changes", its words in its name)
    S.status = M.live ? null : { g, one, hits: n && !M.sq ? w.hits : 0, wait, gain, ap, said: lineup ? `${said}. ${lineup}` : said, sub: lineup, mine: n > 0 || kept > 0 || !!M.sq || (facts && rollingAt(P, g)) };
    fill(strip, h('section.ah-block', { 'aria-label': COPY.weekTitle(g), tabindex: '-1', dataset: { focusHome: '' } },
      barNode({
        two, warn: !!problem?.warn,
        // (the facts said where they are drawn, "1 free transfer, £0.5 million in the bank, …"; the week's status the
        // token's alone, so VoiceOver hears the week once: the owner's strip, must-fix 4; GW A under way its sentence)
        label: [M.live ? said : own ? factsSaid : null, lead?.said, mine, rest].filter(Boolean).join('. '),
        onClick: () => weekSheet(g), moves: w.moves.map((m) => `${m.out}>${m.in}`).join(' '),
        doors: inkAt(ctx, P, g) ? [] : [bringDoor(P, g), chipsDoor(P, g)],
      })));
    // what fitFacts places and sheds: the checks' words, shortest last
    S.line = chk ? { bar: strip.querySelector(':scope > .ah-block > .ah-pbar'), chk, texts: checking } : null;
    fitFacts();
    paintWait();
  }
  /** The week line's one line fitted beside its doors (the user, 2026-10-22: "WEEK LINE AT MOST 2 LINES"; the owner's
   *  orders of 2026-10-21 and -22 together, the v1.3.75 review's group A; one line since the strip, the owner,
   *  2026-10-26), after renderLine and again on a new width (refitPitch) or a clock of more digits (tick):
   *   · your week's facts: next GW's free transfers (.ah-fnext: rollFacts) only where they fit, else left to the Week
   *     sheet, whose facts say them (drawWeek);
   *   · "N FT · £x ITB" leads the line whole in every state (the owner, 2026-10-22): its "ITB" alone gives way where
   *     even the bank can't stay whole (a £10m bank at 320 px; the review's #6/#16), never the amount; words longer than
   *     the line (a price drift's) end in "…" (m-ahead.css), never cut mid-glyph;
   *   · the checks after the lead: the clock never cut, their words giving way first ("Checking GW9 · 3 of 6 plans", then
   *     "plans", then the GW, then an ellipsis, then none: the owner, 2026-10-21, first-use #8; their words placed and
   *     shed with the clock as it reads once shown, so nothing moves when it shows); where even the clock has no room
   *     after them, their words go and the clock stays beside the lead (the strip has no first line to take them);
   *   · what follows the lead ("Out: …", "8 changes", a notice) cut at its end, never a " · " left with nothing after
   *     it (under 1.5 em left it goes, its separator too); a problem notice (amber) never goes: the lead's separators
   *     narrow for it ("shed the lead's separator spacing, not the facts": the owner, 2026-10-22; at 320 px its first
   *     letter and "…" in amber, the Week sheet's row saying it whole). */
  function fitFacts() {
    const bar = strip.querySelector(':scope > .ah-block:not(.ah-fitprobe) > .ah-pbar'), bs = bar?.querySelector('.ah-pbt .ah-bs');
    if (!bs) return;
    const L = S.line?.bar === bar ? S.line : null, em = parseFloat(getComputedStyle(bs).fontSize);
    const fits = (x) => x.scrollWidth <= x.clientWidth + 0.5, right = (x) => x.getBoundingClientRect().right;
    // the checks' clock as it reads once shown (" · 0:12": waitClock's `late` form) while it is measured
    const clock = S.wait ? L?.chk.querySelector(':scope > .ah-wclock') : null, was = clock?.textContent;
    if (clock) clock.textContent = `${clock.dataset.sep ?? ''}${waited()}`;
    const cw = L?.chk.querySelector(':scope > .ah-cw');
    /** The checks' words: the longest that fits, else the shortest cut at its end, else (under 2 em) none. */
    const shed = () => {
      cw.hidden = false;
      for (const t of L.texts) { cw.textContent = t; if (fits(cw)) return; }
      if (cw.clientWidth < 2 * em) cw.hidden = true;
    };
    const nx = bs.querySelector('.ah-fnext'), lead = bs.querySelector(':scope > .ah-blead'), rest = bs.querySelector(':scope > .ah-brest');
    const seps = [...(lead?.querySelectorAll('.ah-bsep') ?? [])], sep = seps.at(-1);
    for (const x of [nx, rest, ...seps, ...bs.querySelectorAll('.ah-itb')]) if (x) x.hidden = false;
    for (const x of seps) x.textContent = x.dataset.t;
    if (nx) nx.hidden = !fits(bs);
    // (the lead without its separator after it: that one goes with what follows)
    if (sep) sep.hidden = true;
    if (!(lead ? lead.scrollWidth <= bs.clientWidth + 0.5 : fits(bs))) for (const x of bs.querySelectorAll('.ah-itb')) x.hidden = true;
    if (sep) sep.hidden = false;
    if (L && rest) {
      shed();
      // (the clock says its own " · "; no room for it after the words: the words go, the clock beside the lead)
      if (clock && !cw.hidden && right(clock) > right(bs) + 0.5) cw.hidden = true;
      if (cw.hidden && sep) sep.hidden = true;
    }
    if (rest && !rest.hidden && !rest.querySelector('.ah-chk') && rest.clientWidth < 1.5 * em) {
      if (bs.classList.contains('warn')) for (const x of seps) x.textContent = x.dataset.t.replace(/[\s\u00a0]+/g, '\u200a');
      else rest.hidden = sep.hidden = true;
    }
    if (clock) clock.textContent = was;
  }
  /** Your week's transfers' number (the week line's; the user, 2026-10-19, "Fold into step 3": a week with two or more
   *  says the week's gain over rolling): your plan against the week's roll plan, Forkcast's later moves on both sides
   *  (weekRoll: every choice's measure, the +'s toast's number), "checking…" (`wait`) while either still solves; off
   *  the hold (no roll plan solved: plansOf) or while an edit is checked the rows' sum (rowGains: they add up to the week's gain, A2).
   *  → {cmp | null, wait, vs (against rolling)} */
  function weekGain(P, w) {
    const r = weekRoll(P, w);
    if (r) return { cmp: r, wait: false, vs: true };
    if (weekPending(P, w)) return { cmp: null, wait: true, vs: false };
    const gains = rowGains(ctx, P, w);
    const sum = w.moves.reduce((t, m) => t + (gains.get(`${m.out}>${m.in}`)?.cmp?.delta ?? 0), 0);
    return { cmp: { delta: sum, label: E.verdictLabel(sum, P.noise) }, wait: false, vs: false };
  }
  /** Node n's box on the pitch whose own box is `b`: {n, x, y, w, h} */
  const boxOf = (n, b) => { const r = n.getBoundingClientRect(); return { n, x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height }; };
  /** The pitch's cards as drawn, each by its box on the pitch (.pm, `root`): [{id, n, x, y, w, h, bench}]; never a
   *  landing's ghost (land: the card that left, going up behind the one that came, there until its fade's finish event,
   *  after the landing's end has placed the choices again: the phone recheck of the first-use proposals, 2026-10-21) */
  function cardBoxes(root) {
    const b = root.getBoundingClientRect();
    return [...root.querySelectorAll(':scope > :is(.pm-field, .pm-benchzone) .pm-card:not(.ah-ghost)')].map((n) => ({ id: Number(n.dataset.id), ...boxOf(n, b), bench: !!n.closest('.pm-bench') }));
  }
  /** Each sub's label (pitch.js benchPanel's button: his sub list, subSheet) a target from his card's top up over free
   *  turf (m-ahead.css .pm-bl::before, --up): 44 px where the turf has them, never onto a card (reachOf, over the label's
   *  own width); the whole label the target (the user, 2026-10-21: fix all, first-use proposal #5). A sub's card behind
   *  waits under his label on his own card (labelWalls; the user, 2026-10-22): the target then ends at its top (--dn), so
   *  his list and his choice each keep their own. Placed after the choices (renderDecks: a mount, a resize), in a week that
   *  draws none too. */
  function reachLabels(root) {
    const b = root.getBoundingClientRect(), boxes = cardBoxes(root);
    const behind = [...decks.querySelectorAll('.ah-sp')].map((n) => boxOf(n, b));
    for (const c of boxes.filter((x) => x.bench)) {
      const bl = c.n.previousElementSibling;
      if (!bl?.matches('button.pm-bl')) continue;
      const q = { ...boxOf(bl, b), n: bl }, foot = q.y + q.h;
      const lo = Math.min(c.y, ...behind.filter((t) => t.x < q.x + q.w && q.x < t.x + t.w && t.y >= foot - 0.5 && t.y < c.y).map((t) => t.y));
      bl.style.setProperty('--dn', `${Math.max(0, lo - foot)}px`);
      bl.style.setProperty('--up', `${lo - reachOf(q, boxes)}px`);
    }
  }
  /** The subs' labels on the pitch as drawn (its box `b`), each a wall a card behind rises to: a sub's tab or edges wait
   *  on his own card under his label, never over the bench's panel on the turf (the user, 2026-10-22: Saka's "+2.8" hung
   *  under Calvert-Lewin's plate, read as his; m-ahead.css --pm-bl-gap holds its one line), nor on the label (the review
   *  of the first-use proposals, 2026-10-21: a lit tab over "2 · DEF" took its choice, so his sub list couldn't be
   *  reached). */
  const labelWalls = (root, b) => [...root.querySelectorAll(':scope > .pm-benchzone .pm-bl')].map((n) => boxOf(n, b));
  /** The room a plate over card c (a plan's span of its sellers) may take past his card on each side (design_marks/design.md
   *  §1; in place of the edges' gap beside him): to a row-mate with a plate of his own (`held`: the cards with one),
   *  the gap less 2 px and less what that plate, centred, takes of it (`ext`(card) px: half the gap less 1 px where not
   *  given), but never more than this plate takes of it centred (`own` px), so two plates never meet (the QA,
   *  2026-10-25: half the gap each cramped a bench best between a quiet plate and a card at 393×702, design.md
   *  §1: nothing past step 1 there); to one with none (under a plan's plate, or no turf over him), the gap and his half
   *  card less 4 px (free turf over him; no ⇄ handle since the owner, 2026-10-25, after v1.3.79: every place a plate);
   *  6 px short of a touchline (`W` the pitch's width);
   *  2 px short of anything else in the plate's band beside him (`side`: the walls, a card hanging into the row gap, a
   *  sub's label, a token beside the goal, a corner pill; the QA, 2026-10-25: GW12's Free Hit token over the keeper's
   *  plate at 390×844, and at a 28 px text size Gabriel's plate over Raya's card; `th` the plate's height). `free`: the
   *  best's plate past its own room (renderDecks) takes the free turf over row-mates with neither, as far as the nearest
   *  with a mark, a touchline or whatever hangs into its band. → [left, right], px */
  const sideRoom = (c, boxes, held, W, side = [], th = 0, ext = null, own = Infinity, free = false) => {
    const mates = boxes.filter((q) => Math.abs(q.y - c.y) < 2 && (q.x + q.w <= c.x + 0.5 || q.x >= c.x + c.w - 0.5) && (!free || held.has(q)));
    const to = (q, gap) => (held.has(q) ? Math.min(gap - 2 - (ext?.(q) ?? gap / 2 - 1), own) : gap + q.w / 2 - 4);
    // (the nearest row-mate each side: one further off is past his card, whose own terms are less; a plate there never
    // caps this one at `own`: the fit review, 2026-10-25, a quiet plate across the row kept the best from free turf)
    const lm = mates.filter((q) => q.x < c.x).sort((a, b) => b.x - a.x)[0], rm = mates.filter((q) => q.x > c.x).sort((a, b) => a.x - b.x)[0];
    const left = Math.min(c.x - 6, ...(lm ? [to(lm, c.x - lm.x - lm.w)] : []));
    const right = Math.min(W - 6 - c.x - c.w, ...(rm ? [to(rm, rm.x - c.x - c.w)] : []));
    const band = side.filter((q) => q.y < c.y && q.y + q.h > c.y - th);
    const l2 = Math.min(left, ...band.filter((q) => q.x + q.w <= c.x + c.w / 2).map((q) => c.x - q.x - q.w - 2));
    const r2 = Math.min(right, ...band.filter((q) => q.x >= c.x + c.w / 2).map((q) => q.x - c.x - c.w - 2));
    return [Math.max(0, l2), Math.max(0, r2)];
  };
  const cardIn = (root, id) => root?.querySelector(`:scope > :is(.pm-field, .pm-benchzone) .pm-card[data-id="${id}"]`) ?? null;
  /** An entry's key in its place (its held order): its choice's (planKey) and the buy it shows. */
  const entryKey = (g, e) => `${e.pl ? planKey(g, e.pl) : `rm:${e.remove.out}>${e.remove.in}`}|${e.inId}`;
  /** The corner pills under Player data over the cards as drawn (the pitch's box b, the cards' `boxes`: cardBoxes; m-ahead.css:
   *  Reset lineup, then Reset plan, each 2 px under the one shown over it): Reset plan while your plan holds something of
   *  yours (S.planReset: renderPitch) only where it fits (resetFits); each one's target reaching down only to the card under
   *  it (a defender's at a large text size). A pill hidden with the focus on it hands it to Player data. Placed by every
   *  draw of the choices (renderDecks), before they reach up to the pills. */
  function placePills(b, boxes) {
    rpBtn.hidden = !S.planReset;
    if (!rpBtn.hidden && !resetFits(boxOf(rpBtn, b), boxes)) rpBtn.hidden = true;
    for (const n of [luBtn, rpBtn]) {
      if (n.hidden) { if (n === document.activeElement) pdBtn.focus({ preventScroll: true }); continue; }
      const p = boxOf(n, b);
      const under = Math.min(Infinity, ...boxes.filter((c) => c.x < p.x + p.w && p.x < c.x + c.w && c.y >= p.y).map((c) => c.y - p.y - p.h));
      n.style.setProperty('--down', `${Math.max(-1, Math.min(9, under - 1))}px`);
    }
  }
  /**
   * The choices on the pitch as drawn (decksOf, litOf; S.M: the week's model renderWeek drew), placed from the mounted
   * cards' boxes (the user, 2026-10-23: "these + points or round 2 / 3 confusing - i cant see which transfer best, also
   * its rather ugly"; the design he chose: forkcast/design_marks/DECISION.md, design.md): the week's one best an ink
   * plate over the player it replaces naming the buy and its gain (swapPlate; a plan of several moves ONE plate naming
   * every buy with the plan's one number, over its sellers in the top-most of their rows, each other seller a small ink
   * tag of his buy, every seller ringed: the user, 2026-10-23, DECISION.md; the plate naming its own row's buys and "& 2
   * more", no dots to the tags: the owner, 2026-10-25), each other place whose best single move beats rolling a quiet
   * named plate, every other place with a choice ready or checking a quiet plate of its first choice (placeFirst), named
   * with its number whatever its sign, "checking…" in its number's place while the week checks, your own buy's a quiet
   * plate naming the player you sold with its take-back's number (placeFirst; the owner, 2026-10-26: "i bough justin but
   * where is no tab on his head so i can keep prebious player"); every plate the same, a tap opening his place, whose dealt cards' headers take
   * ("+1.8 Swap"), the best only ink (the owner, 2026-10-25, after v1.3.79: "no need green 'swap' in preview - make it
   * always first click on tab and then click swap inside when players for selection are shown . so all tabs are same but
   * the best transfer just highlighted black"; of the ⇄ handle: "instead use either names with points (positive or
   * negative like with gabriel) or just points if space tough"); nothing named until the week's checks are in, then
   * once with a fade; the week's own choices beside the goal (tokensOf); a hidden heading naming them for VoiceOver.
   * Nothing where nothing can act (a plan you can't change, GW A under way: weekModel lists none). An open place is
   * drawn again in its held order (drawPlace). Drawn after the pitch mounts (render), after a solve lands (renderPair)
   * and on a resize (refitPitch).
   */
  /** Places ({c: his card's box}) in reading order, top row first, and those in its top-most row: the best's plate spans
   *  these (renderDecks), its token beside the goal names their buys (tokensOf). → [row0, all] */
  const topRow = (xs) => { const all = [...xs].sort((p, q) => p.c.y - q.c.y || p.c.x - q.c.x); return [all.filter((x) => Math.abs(x.c.y - all[0].c.y) < 2), all]; };
  function renderDecks() {
    const root = pitchHost.querySelector(':scope > .pm');
    const P = S.drawn, w = P && weekOf(P, gwNow(P)), M = S.M;
    if (!root || !w || !M || frozenAt(P, w.gw) || !decks.isConnected) {
      // (a plan you can't change keeps its week's status beside the goal, alone: statusTok; the owner's strip)
      const st = root && w && decks.isConnected ? statusTok(w) : null;
      decks.removeAttribute('aria-label');
      fill(decks, st);
      if (st) st.style.top = '6px';
      S.decks = []; closePlace(false); if (root) { placePills(root.getBoundingClientRect(), cardBoxes(root)); reachLabels(root); } return;
    }
    const g = w.gw;
    const { decks: D, toks, lit } = M;
    S.decks = Object.assign(D, { gw: g });  // the week they are drawn for (deckOf)
    // the draw that names the week's choices, none named on its draw before, its checks just in (litOf; the user,
    // 2026-10-21: fix all (first-use proposal #8)), its checks asked again in too (the phone recheck of the first-use
    // proposals, 2026-10-21: lit with no fade a minute after an Undo): a re-flow (addOnce, B31: a place's header under a
    // finger as its cards re-deal), shown with a landing's fade. The same checks drawn on a plan view made anew are
    // the same week (weekKey)
    const n = lit.size + (lit.chip ? 1 : 0);
    const was = S.litAt?.key === M.key ? S.litAt : null;
    S.litAt = { key: M.key, lit: n };
    const lights = n > 0 && !!was && !was.lit;
    if (lights) S.addAt = S.flowAt = Date.now();
    // named for VoiceOver by a hidden heading, only while it holds a choice
    const b = root.getBoundingClientRect(), W = root.clientWidth;
    const boxes = cardBoxes(root);
    // (the best move's places in its plate's top-most row, for its token beside the goal: tokensOf)
    const lead = topRow(D.filter((d) => lit.get(d.a)?.best).map((d) => ({ d, c: boxes.find((x) => x.id === d.a), L: lit.get(d.a) })).filter((x) => x.c))[0];
    const name = plansHeading(P, g), tk = tokensOf(P, w, toks, lit, lead), any = D.length || tk.length;
    if (any) decks.setAttribute('aria-label', name);
    else decks.removeAttribute('aria-label');
    fill(decks, any ? h('h3.sr-only', null, name) : null, tk);
    const meetsCard = (el, down = 0, side = 0) => { const q = boxOf(el, b); return boxes.some((c) => boxesMeet(c, { ...q, w: q.w + side }, down)); };
    // each whole in its room beside the goal, a name in its words never broken mid-word (the v1.3.72 QA, 2026-10-22:
    // the Free Hit's "instead of Muharemov/ić + Palmer + Rice" at 390 px; the user, 2026-10-22: a name broken mid-word is
    // a bug): its "xP", then a smaller number give its words room, as a plate's number (fitNum); then it is as much wider as
    // they still want, measured as drawn as a place's header is (scaleHeads), while it and its side target (6 px: m-ahead.css
    // .ah-tok::before) clear the cards; else it is the Week sheet's, as one that meets a card. Its name too (the owner,
    // 2026-10-25: GW12's "Fre… +4.6 xP Play" at 393×702; "A name still too long is shortened like the cards do" is the
    // plates', never a chip's): its words' line (.ah-tbody's first span, ellipsed by m-ahead.css) whole
    // (a status's words too, "Wildcard · yours", and its body whole, its number: the QA review, 2026-10-25)
    const wordsOf = (t) => [...t.querySelectorAll('.ah-tw, .ah-tbody > span:first-child, :scope > .ah-tl, .ah-tbody, .ah-tn')];
    // (a status's number wrapped under its words, the room it lacks there: "2 transfers −4 −3.3 xP" over "Set in FPL: 2
    // changes" is two lines, not three, where a trim gives it room; the owner, 2026-10-28, "why this pill takes 3 lines
    // instead of two fix")
    const wrapOf = (t) => {
      const words = t.querySelector(':scope > .ah-tl'), num = t.querySelector(':scope > .ah-tnum');
      return words && num && num.offsetTop >= words.offsetTop + words.offsetHeight - 1 ? num.offsetWidth + (parseFloat(getComputedStyle(t).columnGap) || 0) : 0;
    };
    const overOf = (t, tw = wordsOf(t)) => () => tw.some((x) => x.scrollWidth > x.clientWidth + 0.5) || wrapOf(t) > 0;
    // (a status's own spacing first, m-ahead.css .ah-tok.st.snug: no word or number changes for it)
    const trimsOf = (t) => (t.matches('.st') ? ST_TRIMS : undefined);
    const fits = (t) => {
      const tw = wordsOf(t);
      if (fitNum(t, overOf(t, tw), trimsOf(t))) return true;
      t.style.maxWidth = `${t.offsetWidth + Math.ceil(Math.max(wrapOf(t), ...tw.map((x) => x.scrollWidth - x.clientWidth)))}px`;
      if (fitNum(t, overOf(t, tw), trimsOf(t)) && !meetsCard(t, 9, 6)) return true;
      // the best move's token (.mv) then its name shortened as the plates' are (m-ahead.css .ah-tok.mv.cut), never its number, in the room it has (its CSS max-width), each name NAME_LEAST at least, before anything else
      // in the stack gives way (the owner, 2026-10-26, "Ink token, top of stack"); else it gives way as the others
      if (!t.matches('.mv')) return false;
      t.style.removeProperty('max-width');
      const least = NAME_LEAST * parseFloat(getComputedStyle(t).fontSize), ns = [...t.querySelectorAll('.ah-tn')];
      // (its take's word first, its name shortened for it; where that leaves the name under NAME_LEAST, the word off and
      // the name whole again: design 1028d K1)
      const fitsWith = (steps) => fitNum(t, tw.filter((x) => !x.matches('.ah-tn')), steps) && ns.every((x) => x.scrollWidth <= x.clientWidth + 0.5 || x.clientWidth >= least) && !meetsCard(t, 9, 6);
      t.classList.remove('nogo');
      return fitsWith(['noxp', 'nomark', 'tight', 'cut']) || fitsWith(['noxp', 'nomark', 'tight', 'nogo', 'cut']);
    };
    // the week's own choices stacked beside the goal, each under the one before, only while they and their targets (9 px
    // under each: m-ahead.css .ah-tok) clear the cards (a short pitch, three of them: the rest are the Week sheet's);
    // the week's status never (statusTok; the owner's strip, 2026-10-26, its must-fix 2: the week said nowhere else on
    // screen): the best move's token shortens first (fits), then the tokens under the status give way, then the best's
    // over it, the status then first in the stack, kept there whether or not it clears the cards
    const st = tk.find((t) => t.matches('.st'));
    const stack = () => { let top = 6; for (const t of tk) if (t.isConnected) { t.style.top = `${top}px`; top += t.offsetHeight + 8; } };
    let top = 6;
    for (const t of tk) {
      t.style.top = `${top}px`;
      // (the status where it can't fit wider: in its own room, trimmed as there, its words wrapping, never over the
      // keeper's card; its trims kept only where they fit it, so its "xP" goes from no plate for nothing: oneLook)
      if (fits(t)) top += t.offsetHeight + 8;
      else if (t === st) { t.style.removeProperty('max-width'); if (!fitNum(t, overOf(t), ST_TRIMS)) t.classList.remove(...ST_TRIMS); top += t.offsetHeight + 8; }
      else t.remove();
    }
    for (;;) {
      const tkIn = tk.filter((t) => t.isConnected), cut = tkIn.findIndex((t) => meetsCard(t, 9));
      if (cut < 0) break;
      const gone = tkIn.slice(cut).filter((t) => t !== st);
      if (gone.length) for (const t of gone) t.remove();
      else if (tkIn[0] !== st) tkIn[0].remove();
      // (then the status's lineup notice under it, the Week sheet's row: a large text size, "1 transfer +1.6" over "Set
      // in FPL: 2 changes" over the defenders' cards at 320 × 568 and 21 px)
      else if (st.querySelector(':scope > .ah-tw:not([hidden])')) st.querySelector(':scope > .ah-tw').hidden = true;
      else break;
      stack();
    }
    // (the best move's token given way for room, its plate still on the pitch: for the QA, a size the stack can't hold it)
    decks.toggleAttribute('data-mv-out', tk.some((t) => t.matches('.mv') && !t.isConnected));
    // (and the choices whose tokens gave way, their plan keys, for the QA: the Roll that takes your Free Hit off at
    // 320 × 568, its words and Take wider than the room before the keeper's card, is the Week sheet's row then)
    const gone = tk.filter((t) => !t.isConnected && t.dataset.plan).map((t) => t.dataset.plan).join(' ');
    if (gone) decks.dataset.tokOut = gone;
    else delete decks.dataset.tokOut;
    // Reset lineup and Reset plan under Player data, before the choices reach up to them (placePills)
    placePills(b, boxes);
    const walls = [...boxes, ...labelWalls(root, b), ...[...root.querySelectorAll(':scope > .ah-pp:not([hidden]), .ah-tok')].map((x) => boxOf(x, b))];
    // a plate's height (m-ahead.css --pm-tab: the text size's), in whole px
    const tabH = Math.round(cssPx(decks, 'var(--pm-tab)')[0]);
    // each place's plate: the best's (`best`), a quiet plate (`alt`: litOf's, else his place's first choice, placeFirst),
    // by the free turf over him (`up`: reachOf; a sub's from his own card, under his label: labelWalls); its number alone
    // where the turf holds less than a plate at its least (PLATE_MIN: a short pitch, a large text size; `only`), none
    // under EDGE_MIN (the Week sheet lists them)
    const marks = [];
    // a multi-move best is ONE mark, its sentence (design 1026e "line"; a chess engine's best line): one ink plate as
    // wide as its words, centred over its top-most sellers' row, "Cunha → Palmer, Neto → Tavernier +3.8", its other
    // sellers' places each a plate of his own single moves, as every place has; never a tag, a ring or "& 1 more"
    // (in his own buy's place, a choice in place of that buy is a single: "Evanilson +0.8" on Thiago, never "João Pedro →
    // Evanilson instead of Thiago" over the row, whose tap opened its Why sheet, not his place; the owner, 2026-10-27)
    const lineBest = !!lead?.length && multiMove(lead[0].L.e, lead[0].d.a);
    const litAt = (a) => (lineBest && lit.get(a)?.best && !lead.some((x) => x.d.a === a) ? null : lit.get(a));
    // (a buy the sentence names is no other plate's: one name, one number; the owner's judge of design 1026e, of
    // "Tavernier +1.2" beside "Tavernier … +3.8")
    const lineBuys = new Set(lineBest ? lead[0].L.e.adds.map((m) => Number(m.in)) : []);
    const firstOf = (d) => placeFirst(lineBuys.size ? { ...d, entries: d.entries.filter((e) => !lineBuys.has(e.inId) || takesBack(e)) } : d);
    for (const d of D) {
      const c = boxes.find((x) => x.id === d.a), first = litAt(d.a) ? null : firstOf(d), L = litAt(d.a) ?? (first && { e: first, best: false, first: true });
      if (!c || !L) continue;
      const up = c.y - reachOf(c, walls);
      if (up < EDGE_MIN) continue;
      // (a Remove of yours, no number: its name alone, never its number alone; renderDecks' steps leave it named, .bare)
      marks.push({ d, c, L, up, kind: L.best ? 'best' : 'alt', best: !!L.best, only: up < PLATE_MIN && !!L.e.pl });
    }
    // (no ring: the ink plate says it is the best; design 1026e, the clutter budget's "no rings")
    // a plan's plate over its sellers in the top-most of their rows (one there: over him; more: spanning them, its middle
    // over the span), its other sellers each a tag of his buy (DECISION.md), no line to the plate (the owner's
    // decision, 2026-10-25: the yellow dots from it to its tags removed); its buys in their sellers' order
    const [row0, bests] = topRow(marks.filter((x) => x.kind === 'best')), tags = bests.filter((x) => !row0.includes(x));
    const span = !row0.length ? null : lineBest ? { x: 3, y: row0[0].c.y, w: W - 6, h: row0[0].c.h, bench: row0[0].c.bench }
      : (() => { const l = row0[0].c, r = row0.at(-1).c; return { x: l.x, y: l.y, w: r.x + r.w - l.x, h: l.h, bench: l.bench }; })();
    // (a row-mate under the span keeps no mark of his own there: his place is his card's, the Week sheet's and ‹ ›'s)
    // (a sentence's plate takes only the turf its words need: a row-mate's plate goes only where they meet, below)
    const under = (x) => !lineBest && span && !x.best && Math.abs(x.c.y - span.y) < 2 && x.c.x >= span.x && x.c.x + x.c.w <= span.x + span.w;
    // (one buy, one plate: two places offering the same buy, "Truffert +1.3" and "Truffert +1.0", keep the better, the
    // other's his place's; the owner's judge of design 1026e)
    const plateGain = (x) => (x.L.e.pl?.state === 'ready' ? x.L.e.pl.cmp.delta : -Infinity);
    const byBuy = new Map();
    for (const x of marks) if (!x.best && x.L.e.pl && !takesBack(x.L.e) && (!byBuy.has(x.L.e.inId) || plateGain(x) > plateGain(byBuy.get(x.L.e.inId)))) byBuy.set(x.L.e.inId, x);
    const bestIns = new Set(marks.filter((x) => x.best).map((x) => x.L.e.inId));
    const twice = (x) => !x.best && !!x.L.e.pl && !takesBack(x.L.e) && (bestIns.has(x.L.e.inId) || lineBuys.has(x.L.e.inId) || byBuy.get(x.L.e.inId) !== x);
    marks.splice(0, marks.length, ...marks.filter((x) => !under(x) && !twice(x)));
    // (the places drawn, for the Week sheet's green: sheetFollows)
    D.drawn = new Set(marks.map((x) => x.d.a));
    const plates = marks.filter((x) => x.kind === 'alt' || (x.kind === 'best' && tags.includes(x)));
    // its neighbours' room by whether each holds a plate (sideRoom)
    const held = new Set(marks.map((x) => x.c));
    const drawn = [];
    // (its row's buys named, the others' "& 2 more": the owner, 2026-10-25, "Rice & 2 more +5.0 xP Swap all 3")
    // (every move of the plan counted and said, its row's first, a seller drawn as no plate too: one with no room is
    // still one of its moves)
    const rest = span ? row0[0].L.e.adds.filter((m) => !row0.some((x) => x.L.e.inId === Number(m.in))) : [];
    // (a sentence's plate, `line`, is no part of the plates' fit steps: its words never shortened nor dropped; it is
    // sized after them, below)
    let spEl = null;
    if (span) (lineBest ? (x) => { spEl = x.el; append(decks, x.el); } : (x) => drawn.push(x))({ el: swapPlate(P, g, row0[0].d, row0[0].L, span, Math.min(...row0.map((x) => x.up)), tabH, { buys: [...row0.map((x) => x.L.e.inId), ...rest.map((m) => Number(m.in))], shown: row0.map((x) => x.L.e.inId), sellers: [...row0.map((x) => x.d.a), ...rest.map((m) => Number(m.out))], only: row0.some((x) => x.only), ...(lineBest ? { line: lineMoves(P, row0[0].L.e) } : {}) }), c: span, m: row0[0] });
    for (const m of plates) drawn.push({ el: swapPlate(P, g, m.d, m.L, m.c, m.up, tabH, { ...(m.best ? { tag: bests.find((x) => !tags.includes(x)).d.a } : {}), only: m.only }), c: m.c, m });
    for (const p of drawn) append(decks, p.el);
    // each card's plate (a plan's span: every seller's), and how far past his card a plate takes the gap beside it, centred
    // (as wide as its words at the fit step tried)
    const plateOf = new Map(drawn.flatMap((p) => (p.c === span ? row0.map((x) => [x.c, p]) : [[p.c, p]])));
    const over = (p) => (p ? Math.max(0, (p.el.getBoundingClientRect().width - p.c.w) / 2) : 0);
    // (a freed plate's mate with a plate: as far as that plate may reach toward it, its room that side, never only its
    // centred half: the reach review, 2026-10-25 second pass, a quiet plate one card along moved toward the freed best,
    // its own room set by the free card between them)
    const reach = (q, p) => { const x = plateOf.get(q); return Math.max(over(x), x?.room ? x.room[x.c.x < p.c.x ? 1 : 0] : 0); };
    const roomOf = (p) => sideRoom(p.c, boxes, held, W, walls, parseFloat(p.el.style.height), (q) => (p.free ? reach(q, p) : over(plateOf.get(q))), over(p), p.free);
    // each plate fitted on its own, never the whole pitch at once (the owner, 2026-10-25, "Best keeps its name": "Each plate
    // fits on its own. Cramped quiet plates turn into ⇄ handles first, so the black best always shows its full name. A
    // name still too long is shortened like the cards do. No shirts."; its number alone in the handle's place: the owner,
    // 2026-10-25, after v1.3.79, "or just points if space tough"), never a cut number
    // (its middle over his card's middle third, it reads as his; the best's past its room the free turf's whole: `free`)
    const most = (p) => { const [l, r] = (p.room = roomOf(p)), s = p.free ? Infinity : p.c.w / 3; return p.c.w + Math.min(l, r + s) + Math.min(r, l + s); };
    const wider = (p) => p.el.getBoundingClientRect().width > most(p) + 0.5;
    const excess = (q) => q.el.getBoundingClientRect().width - most(q);
    const quiet = (p) => p.el.matches('.alt');
    // (a Remove of yours, its name and no number, is never a number alone: .bare, it yields as a quiet plate does by its
    // name shortened to the plates' least instead, .cut, m-ahead.css; the review of cards4, 2026-10-26: beside the best
    // it kept its name whole while the best's went)
    const named = (p) => !p.el.matches('.only, .bare.cut');
    // (one named again past (2), `was` the excess of every plate as it was named: over too while it crowds one past
    // that, its own trims giving that room back; the fixreset QA, 2026-10-26, 353468 GW10 at 390×844: Evanilson
    // "+0.5 xP" alone, his name tried again in his room's type, with its "xP", crowded Vuskovic's beside him, at its own
    // smallest 86 px in 89; the owner: "yes" fix it)
    const cramped = (p) => wider(p) || (!!p.was && drawn.some((q) => q !== p && Math.max(0, excess(q)) > p.was.get(q) + 0.5));
    // "xP" one look per pitch (the owner, 2026-10-26, of "Silva −4 −2.4 xP" beside "Thomas −1.2": "why it sometimes
    // write xp sometimes not write fix"): where any plate or token beside the goal drops its "xP", every one drops it,
    // as a place's dealt headers do; from then a plate's own trims are its smaller type alone, its size its own
    let steps = PLATE_TRIMS;
    const oneXp = () => {
      if (!steps.includes('noxp') || !oneLook([...decks.querySelectorAll('.ah-sp, .ah-tok')], ['noxp']).length) return false;
      steps = PLATE_TRIMS.filter((k) => k !== 'noxp');
      return true;
    };
    // (1) its own trims that never hide who (PLATE_TRIMS: fitNum), again while one's gave a neighbour room, its "xP"
    // the pitch's (oneXp) before any name is shortened or gone
    const trim = () => {
      for (let i = 0; i < 4; i++) {
        let moved = false;
        for (const p of drawn.filter((x) => !x.el.matches('.cut'))) { const was = p.el.className; fitNum(p.el, () => cramped(p), steps); moved ||= was !== p.el.className; }
        if (!oneXp() && !moved) break;
      }
    };
    // a plate's number alone, its names gone (m-ahead.css .ah-sp.only; a plan's "& 2 more" too; a tag his plan's number)
    const toOnly = (p) => { if (p.el.matches('.bare')) { p.el.classList.add('cut'); return; } p.el.classList.remove('cut'); p.el.style.removeProperty('width'); p.el.classList.add('only'); };
    // (what a quiet plate yielded: its name, or a Remove's shortened)
    const yielded = (p) => (p.el.matches('.bare') ? 'cut' : 'only');
    // (its gain: one still checking the lowest)
    const gain = (p) => (p.m.L.e.pl?.state === 'ready' ? p.m.L.e.pl.cmp.delta : -Infinity);
    // the nearest cards beside a plate's (its span's) in his row, each side, with a quiet plate still named
    const beside = (p) => [boxes.filter((q) => Math.abs(q.y - p.c.y) < 2 && q.x + q.w <= p.c.x + 0.5).sort((a, b) => b.x - a.x)[0],
      boxes.filter((q) => Math.abs(q.y - p.c.y) < 2 && q.x >= p.c.x + p.c.w - 0.5).sort((a, b) => a.x - b.x)[0]]
      .map((q) => q && plateOf.get(q)).filter((q) => q && quiet(q) && named(q));
    trim();
    // (2) still over its room: quiet plates show their number alone ("+0.7": in A's ⇄ handles' order; a loss's, or 0.0,
    // shows it from the start, swapPlate .loss, so only a gain's name yields here), those beside an ink plate over its
    // room first, then the lowest gain (a tie: the right-hand one), each fitting them all again
    for (;;) {
      const long = drawn.filter(wider);
      const ink = long.filter((p) => !quiet(p)).flatMap(beside);
      const cands = ink.length ? ink : [...long.filter((p) => quiet(p) && named(p)), ...long.flatMap(beside)];
      if (!cands.length) break;
      toOnly(cands.sort((a, b) => gain(a) - gain(b) || b.c.x - a.c.x)[0]);
      trim();
    }
    // (2b) an ink plate (the best's: a single, a plan, a tag) still over: it reaches over the free turf past his card's
    // middle third, as far as its band is clear (no plate, card or label hanging into it; a touchline: sideRoom
    // `free`), his ring keeping it his (the owner, 2026-10-25: "Best keeps its name ... the black best always shows its
    // full name"; Raketa's GW10, its plan an ink handle over Murillo with his row-mates' turf free); quiet plates keep
    // the middle third
    for (const p of drawn.filter((x) => !quiet(x) && named(x) && wider(x))) p.free = true;
    trim();
    // (3) an ink plate still over (no quiet plate beside it left named, nor free turf enough): its names shortened as the
    // cards' are, never its number nor its "& 2 more" (m-ahead.css .ah-sp.cut), each showing NAME_LEAST at least; (4)
    // else its number alone, ink (the best keeps its name longest: the owner, 2026-10-25, after v1.3.79)
    for (const p of drawn.filter((x) => !quiet(x) && named(x) && wider(x))) {
      p.el.classList.add('cut');
      // (its room counts its own width: set until it holds, so the width checked is the width drawn)
      for (let i = 0; i < 6; i++) { const wd = most(p); if (Math.abs(wd - parseFloat(p.el.style.width)) < 0.5) break; p.el.style.width = `${wd}px`; }
      const body = p.el.querySelector('.ah-spb'), least = NAME_LEAST * parseFloat(getComputedStyle(body).fontSize);
      const shows = [...body.querySelectorAll('.ah-spn')].every((n) => n.scrollWidth <= n.clientWidth + 0.5 || n.clientWidth >= least);
      if (!shows || body.scrollWidth > body.clientWidth + 0.5) toOnly(p);
    }
    trim();
    // (its number alone only where its name had no room: each quiet one named again, the highest first, where it and
    // every plate beside it still fit, the room the steps after (2) left: the free turf, a shortened name)
    // (never one beside an ink plate showing its number alone: the best keeps its name longest; nor where any plate's
    // excess past its room grows: the fit review of plates3, 2026-10-25; nor a loss's: its number alone is its look, not a
    // fit step, swapPlate .loss)
    const nearInk = new Set(drawn.filter((x) => !quiet(x) && !named(x)).flatMap((x) => [...plateOf].filter(([q]) => Math.abs(q.y - x.c.y) < 2 && (Math.abs(q.x + q.w - x.c.x) < q.w || Math.abs(x.c.x + x.c.w - q.x) < q.w)).map(([, y]) => y)));
    // (its name tried at its own trims as far as they go, never at the type its own room allows alone: cramped; fitted
    // first, before the plates beside it, so none of theirs answers for it; and taking no other plate's trim: the
    // platefit review, 2026-10-26)
    const excesses = () => new Map(drawn.map((q) => [q, Math.max(0, excess(q))]));
    const took = (x, k) => { const was = k.split(' '); return [...x.classList].some((c) => c !== 'noxp' && !was.includes(c)); };
    for (const p of drawn.filter((x) => quiet(x) && !named(x) && !x.m.only && !x.el.matches('.loss') && !nearInk.has(x)).sort((a, b) => gain(b) - gain(a))) {
      const look = new Map([...decks.querySelectorAll('.ah-sp, .ah-tok')].map((x) => [x, x.className])), was = steps;
      p.was = excesses();
      p.el.classList.remove(yielded(p));
      fitNum(p.el, () => cramped(p), steps);
      trim();
      // (else every plate and token as before it, the pitch's "xP" too, each room read again; the pitch's "xP" off is
      // no plate's trim: it only frees room)
      if (cramped(p) || [...look].some(([x, k]) => x !== p.el && took(x, k))) { delete p.was; for (const [x, k] of look) x.className = k; steps = was; trim(); }
      else p.was = excesses();
    }
    // as wide as its words, never narrower than his card (the span), centred on him, moved aside only as far as a
    // touchline or a plated neighbour makes it, its middle over his card's middle third (it reads as his; the best's past
    // its room over the free turf: 2b)
    // (every room read before any width is set: a neighbour's is its words' at the step the fit ended on)
    const wide = new Map(drawn.map((p) => { const m = most(p); return [p, [Math.min(Math.max(p.c.w, Math.ceil(p.el.getBoundingClientRect().width)), m), m]]; }));
    for (const p of drawn) {
      const [wd, room] = wide.get(p), extra = wd - p.c.w;
      const r = Math.min(extra - Math.min(extra / 2, p.room[0]), p.room[1]), left = p.c.x - (extra - r), top = parseFloat(p.el.style.top);
      Object.assign(p.el.style, { width: `${wd}px`, left: `${left}px` });
      // (the most it may take, for the QA: a number alone only where its name had no room)
      p.el.dataset.room = Math.floor(room);
      // its target up over the free turf over its own width as drawn, to 44 px over his card at most (reachOf: a plate
      // wider than his card never reaches onto a card over the next column)
      p.el.style.setProperty('--up', `${Math.max(0, top - Math.max(reachOf({ n: p.el, x: left, y: top, w: wd }, walls), p.c.y - 44))}px`);
    }
    // a sentence's plate (lineBest) as wide as its words, centred over its sellers in its row, inside the touchlines; a
    // row-mate's plate it meets gives way, his place his card's, the Week sheet's and ‹ ›'s (E's spirit: no plate under
    // another; the owner's judge of design 1026e, of the pitch-wide band: "a banner")
    if (spEl) {
      const sp = { el: spEl };
      sp.el.style.width = 'max-content';
      const wantOf = () => Math.ceil(sp.el.getBoundingClientRect().width) + 2, mid = (row0[0].c.x + row0.at(-1).c.x + row0.at(-1).c.w) / 2;
      // (wider than the pitch: a plate's own trims first, its "xP" (the pitch's one look: oneLook) then its smaller type
      // (PLATE_TRIMS), the release QA of design 1026e at a 28 px text size: two lines' height reached onto the keeper's
      // card over words that fitted one; still wider, three moves at 320: two lines, between its moves, up into the turf
      // over them; never a name cut)
      let want = wantOf();
      for (const k of PLATE_TRIMS) {
        if (want <= W - 6) break;
        sp.el.classList.add(k);
        if (k === 'noxp') oneLook([...decks.querySelectorAll('.ah-sp, .ah-tok')], ['noxp']);
        want = wantOf();
      }
      if (want > W - 6) {
        const th = parseFloat(sp.el.style.height);
        sp.el.classList.add('two');
        Object.assign(sp.el.style, { height: `${2 * th}px`, top: `${span.y - 2 * th}px` });
      }
      const wd = Math.min(W - 6, want), left = Math.min(W - 3 - wd, Math.max(3, mid - wd / 2));
      Object.assign(sp.el.style, { width: `${wd}px`, left: `${left}px` });
      // (no taller than the turf over it across its own width, never onto a card above, its type smaller as a plate's
      // in less than its least height (swapPlate): its height its sellers' turf, a pitch-wide sentence under the keeper
      // at a 28 px text size reached 6 px onto his card; the release QA of design 1026e) (.two: its line-height 1.15)
      const lines = sp.el.classList.contains('two') ? 2 : 1, room = span.y - reachOf({ n: sp.el, x: left, y: span.y, w: wd }, walls);
      if (parseFloat(sp.el.style.height) > room) Object.assign(sp.el.style, { height: `${room}px`, top: `${span.y - room}px`, fontSize: `${Math.floor(room / (lines === 2 ? 2.3 : 1)) - 1}px` });
      const top = parseFloat(sp.el.style.top);
      sp.el.style.setProperty('--up', `${Math.max(0, top - Math.max(reachOf({ n: sp.el, x: left, y: top, w: wd }, walls), span.y - 44))}px`);
      for (const q of drawn) {
        const l = parseFloat(q.el.style.left), r = l + parseFloat(q.el.style.width);
        if (Math.abs(q.c.y - span.y) < 2 && r > left - 4 && l < left + wd + 4) { q.el.remove(); D.drawn.delete(q.m.d.a); }
      }
    }
    // (the choices whose plates are drawn, for the Week sheet's green: litShown; a sentence's sellers' own singles too)
    D.drawnPl = new Set(drawn.filter((p) => p.el.isConnected).map((p) => p.m.L.e.pl).filter(Boolean));
    if (spEl) D.drawnPl.add(row0[0].L.e.pl);
    // each sub's label a target to the choices drawn (reachLabels)
    reachLabels(root);
    // (as a landing's ink name plate: in 150 ms after 170 ms, m-ahead.css ah-in; Reduce Motion: the 150 ms fade, as land's;
    // a place's first choice drawn while the week checked too: no fade)
    if (lights) for (const x of decks.querySelectorAll('.ah-sp:not(.first), .ah-tok.mv')) x.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 150, delay: reduceMotion() ? 0 : 170, fill: 'backwards' });
    if (S.place) drawPlace(false);
    sheetFollows(P, w, M);
  }
  /** The Week sheet's green as the pitch was just drawn (the owner, 2026-10-25: "Follow the pitch"): the week's `shown`
   *  again from the places as drawn (litShown: `D.drawn`) and, where that changed it, the open sheet of that week drawn
   *  again (a resize, a text size, a take: whatever drew the pitch again). */
  function sheetFollows(P, w, M) {
    const shown = litShown(P, w, M, M.decks, M.toks, M.lit);
    if (shown.size === M.shown.size && [...shown].every((pl) => M.shown.has(pl))) return;
    M.shown = shown;
    if (S.week?.g === w.gw) drawWeek(P, w, M);
  }
  /** A named plate (litOf, placeFirst; m-ahead.css .ah-sp; design_marks/design.md §1): one flat line in the row gap over
   *  the player it would replace (`c` his card's box, a plan's span of its sellers in one row; a sub's under his label:
   *  labelWalls), its foot on his tile's top, `tabH` tall at the most (less where the turf over him, `up`, holds less:
   *  never under PLATE_MIN, but for its number alone, `o.only`), its target the free turf over it. It names who comes in
   *  (the user, 2026-10-23: "i cant see which transfer best"; a name on every plate, never a shirt, shortened only as
   *  the cards' are: the owner, 2026-10-25, "A name still too long is shortened like the cards do. No shirts.",
   *  renderDecks) and what it gains vs rolling (blue with "xP": numParts), or its number alone where its name has no
   *  room (.only; the owner, 2026-10-25, after v1.3.79, of the ⇄ handle: "instead use either names with points
   *  (positive or negative like with gabriel) or just points if space tough"); a quiet one that gains nothing always, a
   *  small chip: .loss, the owner, 2026-10-26, "mabe negatice plates not need names in them"). The best (`L.best`) ink (a plan's one
   *  plate naming the buys of its row's sellers, `o.shown`, and the others' count, "Rice & 2 more" (the owner,
   *  2026-10-25), said whole, every buy, `o.buys`, in its sellers' order, `o.sellers`); a plan's other seller in another
   *  row its buy's name alone (`o.tag`: his plan's main seller), no number but where his name has no room; any other a
   *  quiet green plate, the buy and the gain: litOf's, or his place's first choice (`L.first`: placeFirst, a pair's
   *  other buys counted, "Rice & 1 more", its number whatever its sign; while the week checks "checking…" in its
   *  number's place, as his place's header says it, never a clock: waitClock); your own buy's his take-back's (`back`:
   *  placeFirst), the player you sold and its number, "Gabriel +0.8", a Remove his name alone (.bare; the owner,
   *  2026-10-26: "i bough justin but where is no tab on his head so i can keep prebious player"). No take on any (the owner, 2026-10-25,
   *  after v1.3.79: "no need green 'swap' in preview - make it always first click on tab and then click swap inside when
   *  players for selection are shown . so all tabs are same but the best transfer just highlighted black"): its body
   *  opens his place (his choices, best first), whose headers take ("+1.8 Swap"). → its element */
  function swapPlate(P, g, d, { e, best, first }, c, up, tabH, o = {}) {
    const nm = P.L.name, pl = e.pl, s = pl ? planSaid(P, g, pl) : null;
    // (a Remove of yours, its name and no number, never its number alone: as short as the turf too; the review of cards4)
    const th = Math.max(o.only || !pl ? Math.min(up, PLATE_MIN) : PLATE_MIN, Math.min(c.bench ? tabH - 2 : tabH, up));
    // (a sentence's plate its plan's own sheet, its why and its one take: the first move it names is not this place's)
    const open = () => (o.line && pl ? openPlanWhy(P, g, pl) : openPlace(d.a));
    const buys = o.buys ?? (o.tag != null ? [e.inId] : [e.inId, ...e.pair.map((q) => q.in)]), sellers = o.sellers ?? [d.a, ...e.pair.map((q) => q.out)], shown = o.shown ?? [e.inId];
    // (a first choice: its number once the week settles, else "checking…", or why it can't be checked: as his place's header;
    // a Remove of yours, no number: its name alone once the week settles)
    const ready = !!pl && pl.state === 'ready' && (!first || !!S.M?.settled);
    const v = ready ? numParts(g, pl) : !pl ? (S.M?.settled ? null : COPY.pairChecking) : pl.state === 'failed' ? failedWords(P, pl).head : COPY.pairChecking;
    // (your own buy's: his take-back, naming the player you sold, the owner, 2026-10-26: "i bough justin but where is no tab
    // on his head so i can keep prebious player"; ink where it is the week's best, weekBest: the owner, 2026-10-28)
    const back = d.mine && takesBack(e);
    // a quiet plate whose number gains nothing as shown (a loss, or 0.0: shownGain, the sign its number is drawn with) its
    // number alone, a small chip, whatever its room, so the shape tells it from a gain's named plate (the owner,
    // 2026-10-26: "potential positive moves but not the best like murillo to hill must be somehow distinguidshewd from
    // negative moves like gabriel to hill maybe negative moves must be fade away more or somethign like it so negative not
    // attrackt same ttention as positive", then "mabe negatice plates not need names in them"; DECISION.md H): never the
    // best, a tag, your own buy's take-back (N names the player you sold) or one still checking; VoiceOver still says who
    // and what (`said`)
    const loss = !best && o.tag == null && !back && ready && !shownGain(pl.cmp.delta);
    const num = ready ? plNumSaid(P, pl) : v, places = COPY.placeSaid(nm(d.a), d.entries.length, null);
    const moves = back ? [COPY.keepSoldSaid(nm(e.inId), nm(d.a))] : sellers.map((a, i) => COPY.moveSaid(nm(a), nm(buys[i])));
    // (beside a chip's token, the week's best: "Best move this week", litOf `chip`)
    const move = !!S.M?.lit?.chip;
    // (a first choice: what his place holds as the handle said it, "none better than rolling" (in a week of yours "than
    // your plan": plansVs, decision K) where none gains; a move you removed or one the 2026-10-18 bars hold back said
    // so, as its note: the review of plates3, 2026-10-25)
    const none = !!first && !back && ready && !d.entries.some((x) => x.pl?.state === 'ready' && (plPays(x.pl) || x.pl.cmp.delta > 0.05));
    const why = first && ready ? [earlyWords(pl), pl.removed ? COPY.removedByYou : null].filter(Boolean).map((x) => `, ${x}`).join('') : '';
    const said = o.tag != null ? `${COPY.partSaid(moves[0], e.adds.filter((m) => Number(m.in) !== e.inId).map((m) => COPY.moveSaid(nm(m.out), nm(m.in))), move)}. ${places}`
      : back && !best ? `${moves[0]}${v == null ? '' : `, ${num}`}${why}. ${places}`
      : best ? `${COPY.bestSaid(moves, num, move)}. ${o.line ? COPY.showsWhy : places}`
        : `${moves.join('; ')}, ${num}${why}. ${!first ? places : !ready ? placeLabel(P, d) : none ? COPY.placeNoneSaid(nm(d.a), d.entries.length, plansVs(P, g)) : places}`;
    const body = h('button.ah-spb', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': `${said}${o.line?.back ? `, ${o.line.back}` : ''}`, onClick: open },
      // (a multi-move best's sentence, every move named in its road's order: design 1026e "line")
      o.line ? [...o.line.map((x, i) => h('span.ah-spn', { 'aria-hidden': 'true' }, x, i < o.line.length - 1 ? ',' : null)), o.line.back ? h('span.ah-spn', { 'aria-hidden': 'true' }, o.line.back) : null] : shown.map((id, i) => [i ? h('span.ah-spj', { 'aria-hidden': 'true' }, ' + ') : null, h('span.ah-spn', { 'aria-hidden': 'true' }, nm(id))]),
      !o.line && shown.length < buys.length ? h('span.ah-spm', { 'aria-hidden': 'true' }, COPY.planMore(buys.length - shown.length)) : null,
      // (a tag's his plan's number, shown only where his name has no room: .only)
      v == null ? null : h('span.ah-spv.m-num', { 'aria-hidden': 'true', class: { wait: !ready } }, v));
    const plate = h('div.ah-sp', {
      // (a sub's by data-bench, never a class: app.css .bench is the desktop bench's panel)
      class: { best, alt: !best, first: !!first, part: o.tag != null, line: !!o.line, pays: ready && s.pays, only: !!o.only || loss, loss, back, bare: v == null },
      dataset: { row: `deck:${d.a}`, deck: d.a, ...(pl ? { plan: planKey(g, pl) } : {}), in: e.inId, ...(c.bench ? { bench: '' } : {}) },
      // (its number alone in less than a plate's least height: its type no taller than the turf, never onto his card;
      // the fit review of plates3, 2026-10-25)
      style: { left: `${c.x}px`, top: `${c.y - th}px`, height: `${th}px`, '--up': `${Math.max(0, up - th)}px`, ...(th < PLATE_MIN ? { fontSize: `${th - 1}px` } : {}) },
      // the free turf over it (its ::before) opens his place too
      onClick: (ev) => { if (ev.target === plate) open(); },
    }, body);
    return plate;
  }
  /** What a player's place holds, said (a first choice's plate while the week checks: COPY.placeSaid), its best never a
   *  move you took off this session (B129, as litOf). */
  const placeLabel = (P, d) => {
    // (in the order his place deals them, as the plate names its first: placeOrder)
    const nm = P.L.name, best = placeOrder(d.entries).find((x) => !x.back && x.pl?.state === 'ready');
    return COPY.placeSaid(nm(d.a), d.entries.length, best && `${nm(best.inId)}, ${plNumSaid(P, best.pl)}`);
  };
  /** The week's status beside the goal (the owner, 2026-10-26, of the Roll's "Rolling": "why need button 'rolling' here
   *  if nothing happens if click it and it dublicates whats alread y in tab over the pitch"; chosen the same day: the
   *  strip, design 1026c): what the week line's first line said, said once, on the pitch, in the place of "Rolling",
   *  "Rolling is best", "Rolling ✓" and "Wildcard · yours" / "Free Hit · yours": "Rolling" (emptyHead: "Rolling is best"
   *  once settled with nothing better, "Rolling ✓" under your Roll, never "No transfers yet"), "2 transfers −4 +3.8",
   *  "Free Hit +4.3", GW A's lineup notice under the words of any ("Rolling" or "1 transfer +1.2" over "Set in FPL: 3
   *  changes", renderLine); yours green as "· yours" was;
   *  its number the week line's (renderLine: vs rolling everywhere, decision K's "The week line keeps your plan's own
   *  number against rolling"), "checking…" under its words while it solves (never a clock in its slot: waitClock), a
   *  number kept on its word where the words wrap. A tap opens the Week sheet, the week it
   *  names, as the strip does (under your Roll at Your rules, where its Remove is: the unlock "Rolling ✓"'s tap was).
   *  Its words said here alone, the strip's label its facts (VoiceOver hears the week once). Never given way for room
   *  (renderDecks; but the lineup notice under its words, the first to give way). renderLine's words (S.status). →
   *  node | null */
  function statusTok(w) {
    const g = w.gw, st = S.status?.g === g ? S.status : null;
    if (!st) return null;
    // ("Rolling is best" ink as the week's best move's token: the owner, 2026-10-27, "Why rolling is best not black similar
    // how other best moves are black", then "Make it black"; its tap the Week sheet's still)
    return h('button.ah-tok.st', { class: { done: st.mine, best: st.one === COPY.rollingBest }, type: 'button', 'aria-haspopup': 'dialog', dataset: { row: `tok:week:${g}` },
      'aria-label': COPY.statusSaid(st.said, g), onClick: (ev) => {
        const rules = !!S.drawn && rollingAt(S.drawn, g);
        weekSheet(g, rules ? 'rules' : null);
        // (a keyboard's or VoiceOver's focus on your Roll's Remove there: a click with no pointer, detail 0, as takeFrom)
        if (rules && ev.detail === 0) S.week?.host.querySelector(`.ah-rmv[data-rule="roll:${g}"]`)?.focus({ preventScroll: true });
      } },
      // (dashed while an edit is checked, as the week line's first line was: m-pending)
      h('span.ah-tl', { 'aria-hidden': 'true', class: { 'm-pending': st.ap } }, typeof st.one === 'string' ? st.one.replace(/(\d) /g, '$1\u00a0') : st.one,
        st.wait ? h('small.ah-tw', null, COPY.pairChecking) : null),
      // (its number the week line's: gainOf, blue with "xP", shimmering while an edit is checked; its −4 before it)
      st.hits || (st.gain && !st.wait) ? h('span.ah-tnum', { 'aria-hidden': 'true' }, hitTag(st.hits), st.gain && !st.wait ? gainOf(st.gain, st.ap) : null) : null,
      // (GW A's lineup notice under its words and number, the token's whole width, as a chip token's "instead of …": "1
      // transfer +1.6" over "Set in FPL: 2 changes", two lines, not three; the first of it to give way for room: renderDecks)
      st.sub ? h('small.ah-tw', { 'aria-hidden': 'true' }, st.sub.replace(/(\d) /g, '$1\u00a0')) : null);
  }
  /** The week's own choices beside the goal (top-left; the corner pills' look, m-ahead.css .ah-tok): the week's status
   *  (statusTok, in the place of your chip's "· yours", "Rolling ✓" and the Roll of a week you roll), a Bench Boost or
   *  Triple Captain alone with its number (the user, 2026-10-23: no "+" but a gain's sign; no Wildcard or Free Hit since
   *  the owner, 2026-10-27, "Remove free hit / wc pils from pitch": decksOf), a Roll that takes yours back ("instead of
   *  Free Hit"): each its body alone, its Why sheet, whose Play or Take takes it, never ink, the week's best chip too (the
   *  owner, 2026-10-26: "make that free hit tab on top left not coloroud black and remove button 'play' from it", "remove
   *  button 'take'"); while one solves, "checking…" under its words and no number (never a clock in its slot:
   *  waitClock), its body off.
   *  First, above them all, the week's best move while one beats your plan or rolling (litOf `move`; `lead` its places
   *  in its plate's top-most row: renderDecks' topRow), ink, its plate's first buy and its number, "Evanilson +1.6", a
   *  plan's too, "Tavernier +3.8" (no "Best:", no "+ Vuskovic" or "& 1 more": its ink says it is the best, and its plate
   *  names the plan whole; the owner, 2026-10-26, of a token that gave way at 320 wide and for every plan: "yes do
   *  both" (drop "Best:", and a plan's "& 1 more" in the token)), VoiceOver the move whole (the owner, 2026-10-26: "also
   *  find if best transfer suggestion which marked black somehow can be also mentioned as tab or similiar where chips and
   *  rolling are (top left corner) so it no lost somewhere on bench for example and user instanrtly see what it was
   *  suggested"; chosen: "Ink token, top of stack"; the plate stays). A tap takes it, as its place's Swap does
   *  (takeFrom: its toast with Undo, the buy flying in from the token), his place skipped (the owner, 2026-10-26, of
   *  "Evanilson +1.6": "fix so if clicking on evanilson on left top corner it swap to evanilson straight away skipping
   *  options"; G's "a tap opens, the take is inside" stays the plates' and the chip tokens'); a week you can't change
   *  or a move still checked opens his place, as before. */
  function tokensOf(P, w, toks, lit = new Map(), lead = null) {
    const g = w.gw, out = [];
    // (a multi-move best none: its one mark is its sentence's plate over its sellers' row, renderDecks; design 1026e
    // "line": "Cunha → Palmer, Neto → Tavernier +3.8" never stands whole in the room beside the goal, 149 px at 393 wide)
    const mv = lit.move, top = mv && lead?.[0]?.L.e.pl === mv && !multiMove(lead[0].L.e, lead[0].d.a) ? lead : null;
    if (top) {
      const nm = P.L.name, e = top[0].L.e;
      // (the take-back of a transfer of yours "Keep Gabriel, not Hill": weekBest)
      const moves = takesBack(e) ? [COPY.keepSoldSaid(nm(e.inId), nm(top[0].d.a))] : e.adds.map((m) => COPY.moveSaid(nm(m.out), nm(m.in)));
      const swap = mv.state === 'ready' && !frozenAt(P, g);
      out.push(h('button.ah-tok.mv', { type: 'button', 'aria-haspopup': swap ? null : 'dialog', dataset: { row: `tok:best:${g}`, deck: top[0].d.a, best: planKey(g, mv), ...(swap ? { add: `plan:${planKey(g, mv)}` } : {}) },
        'aria-label': `${COPY.bestSaid(moves, plNumSaid(P, mv), true)}, ${swap ? COPY.bestSwaps : COPY.showsChoices}`,
        onClick: (ev) => (swap ? takeFrom(ev, P, g, mv, ev.currentTarget, top[0].d.a, e.inId) : openPlace(top[0].d.a)) },
        h('span.ah-tl', { 'aria-hidden': 'true' }, h('span.ah-tn', null, nm(e.inId))),
        // (its number as its plate's, blue with "xP", as every forecast's: numParts)
        h('span.ah-tnum.m-num', { 'aria-hidden': 'true' }, numParts(g, mv)),
        // its take's word where its tap takes (the owner, 2026-10-28, design 1028d K1: one act, one word, one look;
        // N2, W4/W5): "Swap" in the mint of its place's best header, a keep-back "Keep"; none where it opens his place
        swap ? h('span.ah-tgo.m-swap.best', { 'aria-hidden': 'true' }, takesBack(e) ? COPY.placeKeep : COPY.placeSwap) : null));
    }
    // the week's status, under the best's token, in the place of "Wildcard · yours", "Rolling ✓" and the Roll's "Rolling"
    // (the owner's strip, 2026-10-26)
    const st = statusTok(w);
    if (st) out.push(st);
    for (const pl of toks) {
      // what its take takes back of yours, under its words: a take never takes a transfer of yours back unsaid
      const s = planSaid(P, g, pl), key = planKey(g, pl), { lost } = planBack(P, g, pl);
      const said = lost && !pl.refRow;
      // the Roll of a week you roll (no take: rollOnly; the user, 2026-10-22): the week's status says it, "Rolling",
      // "Rolling is best" once settled with no best (statusTok; the owner's strip, 2026-10-26: its Why sheet the Week
      // sheet's row's)
      if (rollOnly(pl)) continue;
      // no take on any token, a chip the week's best too, never ink: its body its Why sheet, whose Play or Take takes it
      // (the owner, 2026-10-26: "make that free hit tab on top left not coloroud black and remove button 'play' from
      // it", then of the Roll's "Take": "remove button 'take'"; as G's plates: a tap opens, the take is inside)
      const what = planWeeks(P, { ...pl.choice, moves: [], hits: {} }, g, false).find(([x]) => x === g)?.[1] ?? COPY.planRoll(null);
      out.push(h('span.ah-tok.two', { class: { pays: s.pays, wait: !!s.wait }, dataset: { plan: key } },
        h('button.ah-tbody', { type: 'button', disabled: !!s.wait, dataset: { row: `tok:${key}` }, 'aria-label': `${s.label}; shows why`, onClick: () => openPlanWhy(P, g, pl) },
          // its words and its number on one line (its number blue with "xP", as every forecast's: ui.js xpGain), what it
          // takes back or "checking…" under both, the token's whole width (the owner, 2026-10-26, of "Roll / instead of
          // Free / Hit −3.2": "fix so this not take three lines with so much empty space"; never a clock in its number's
          // slot: waitClock)
          h('span', null, what),
          s.wait || pl.refRow ? null : xpGain(pl.cmp.delta, 'span.ah-tnum.m-num'),
          said ? h('small.ah-tw', null, COPY.planInsteadOf(lost)) : null, pl.state === 'solving' ? h('small.ah-tw', null, COPY.pairChecking) : null)));
    }
    return out;
  }
  /** A choice's number on the pitch (a plate's, a place's header): a Bench Boost or Triple Captain it plays too ("BB": its
   *  one tap plays it; the reviews, 2026-10-20) and the −4 it takes, each a small mark before the number; the number
   *  forecast points, blue with "xP" (ui.js xpGain; the user, 2026-10-22, after v1.3.68: its sign its direction, never
   *  green). */
  const numParts = (g, pl) => {
    const chip = SQUAD_CHIPS.has(pl.choice.chips?.[g]) ? null : pl.choice.chips?.[g], hit = pl.hits?.[g] ?? 0;
    return [chip ? h('small.ah-dchip', null, chip.toUpperCase()) : null, hit ? h('small.ah-dhit.m-hit', null, `${MINUS}${E.HIT_COST * hit}`) : null, xpGain(pl.cmp.delta)];
  };
  /** Take choice pl (or, `act`, take a transfer of yours back) from where it is drawn (`from`: its tab, or its card dealt
   *  in a place), through addOnce (one tap, 2a; ignored just after the choices re-flowed): the pitch drawn after it
   *  lands brings the buy `inId` from there into his card's place and sends the player in front (`a`'s card) up behind
   *  him (landMotion). */
  function takeFrom(ev, P, g, pl, from, a, inId, act = () => addPlan(ctx, g, pl)) {
    addOnce(ev, () => {
      const card = cardIn(pitchHost.querySelector(':scope > .pm'), a);
      // focus goes to him for a keyboard or VoiceOver (a click with no pointer: detail 0), never a ring after a finger's tap
      S.fly = { gw: g, at: Date.now(), inId, a, focus: ev.detail === 0, from: from.getBoundingClientRect(), ghost: card && { node: card.cloneNode(true), rect: card.getBoundingClientRect() } };
      const ok = act();
      if (ok) closePlace(false);
      else S.fly = null;
      return ok;
    }, pl ? planTake(P, g, pl).own : []);
  }
  /** The landing's motion (the user's 1st answer, 2026-10-20; the design's §3.2 and §5): on a pitch mounted anew after an
   *  edit landed (a take, its Undo, an "instead of", a pair: the landing's cards of the week, FLASH) each player new on it
   *  comes forward into his card's place (200 ms, no bounce) and the one who stood there goes up behind him and fades
   *  (his card's copy, .ah-ghost); the buy a tap took (takeFrom: S.fly) comes from where he was drawn (his tab, his card
   *  dealt in a place), the player he waited behind going up. More than LAND_MAX new at once (a Wildcard's squad): the
   *  pitch's own cross-fade (1b). Reduce Motion: a 150 ms cross-fade in place. Their cards' own flip (pitch.js) gives way
   *  to it; a keyboard's or VoiceOver's focus moves to the tapped buy. S.fly once, on the first draw of the week that has
   *  him, within FLY_MS of the take; the cards as they stood: S.snap (mountHere). */
  const FLY_MS = 2500, LAND_MAX = 3;
  function landMotion(fresh, g) {
    const snap = S.snap;
    S.snap = null;
    if (S.fly && (Date.now() - S.fly.at > FLY_MS || S.fly.gw !== g)) S.fly = null;
    const f = S.fly;
    const root = pitchHost.querySelector(':scope > .pm'), rows = root?.querySelector(':scope > .pm-field > .pm-rows');
    if (!root || !rows || !snap || (!f && !fresh?.cards?.[g]?.length)) return;
    if (f && !cardIn(root, f.inId)) return;  // his card not drawn yet (the take still lands): the next draw's
    S.fly = null;
    const ids = new Set([...(fresh?.cards?.[g] ?? []), ...(f ? [f.inId] : [])].map(Number));
    const now = cardBoxes(root);
    const here = new Set(now.map((c) => c.id));
    const fresh2 = now.filter((c) => ids.has(c.id) && !snap.has(c.id));
    // the cards that left this pitch, by where they stood (the tapped buy's: the card he waited behind)
    const gone = [...snap].filter(([id]) => !here.has(id) && id !== f?.a).map(([id, x]) => ({ id, ...x }));
    if (fresh2.length > LAND_MAX) return;
    const moves = fresh2.map((c) => {
      const r = c.n.getBoundingClientRect(), mine = f?.inId === c.id ? f : null;
      const dist = (x) => Math.hypot(x.rect.left - r.left, x.rect.top - r.top);
      const was = mine ? mine.ghost : gone.filter((x) => dist(x) < Math.max(8, r.width / 2)).sort((x, y) => dist(x) - dist(y))[0] ?? null;
      if (was && !mine) gone.splice(gone.indexOf(was), 1);
      return land(c.n, r, rows, mine?.from ?? null, was);
    }).filter(Boolean);
    if (f?.focus) cardIn(root, f.inId)?.focus({ preventScroll: true });
    // the choices are placed from the cards' boxes (renderDecks), which their motion holds off their places until it
    // ends: placed meanwhile (a resize the mount made: refitPitch's redeck, a task after it), a card behind found less
    // turf over his card than a tab, so its edges were drawn or none, until the next draw (the phone recheck of the
    // first-use proposals, 2026-10-21: after an Undo the week's lit tabs stayed edges for over a minute). None is placed
    // while they move (redeck); once they have landed the choices are placed again
    if (!moves.length) return;
    const landing = S.landing = Promise.allSettled(moves.map((a) => a.finished));
    landing.then(() => {
      if (S.landing !== landing) return;
      S.landing = null;
      if (ctl.isConnected) redeck();
    });
  }
  /** Card `to` (at r) lands: from `from` (a rect) or from behind his slot, `was` (the card that stood there: {rect, node})
   *  going up behind him and fading. → his card's motion (an Animation) | null */
  function land(to, r, rows, from, was) {
    to.querySelector('.pm-face.back')?.remove();
    for (const a of to.querySelector('.pm-face.front')?.getAnimations?.() ?? []) a.finish();
    to.classList.add('ah-landed');
    const base = rows.getBoundingClientRect();
    const ghost = was?.node ?? null;
    if (ghost) {
      ghost.removeAttribute('data-id');
      ghost.classList.remove('ah-stepout', 'ah-landed');
      ghost.classList.add('ah-ghost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.inert = true;
      Object.assign(ghost.style, { left: `${was.rect.left - base.left}px`, top: `${was.rect.top - base.top}px` });
      rows.append(ghost);
    }
    const off = () => ghost?.remove();
    if (!to.animate) { off(); return null; }
    if (reduceMotion()) {
      const a = to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
      if (ghost) ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).onfinish = off;
      return a;
    }
    // behind him: a tab's height and its 4 px up (the card behind's place)
    const lift = from && was ? Math.max(24, was.rect.top - from.top) : 28;
    const a = to.animate(from ? [{ transform: `translate(${from.left - r.left}px, ${from.top - r.top}px)`, zIndex: 6 }, { transform: 'none', zIndex: 6 }]
      : [{ transform: `translateY(${-lift}px) scale(.94)`, opacity: 0.7, zIndex: 1 }, { transform: 'none', opacity: 1, zIndex: 4 }], { duration: 200, easing: FLY_EASE });
    if (ghost) ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-lift}px) scale(.94)`, opacity: 0 }], { duration: 200, easing: FLY_EASE, fill: 'forwards' }).onfinish = off;
    return a;
  }
  const FLY_EASE = 'cubic-bezier(.2, .8, .2, 1)';
  /**
   * A player's place (the design's §3.4; the user's 2nd answer, 2026-10-20): his row steps aside and every choice for his
   * card deals out beside him on the turf in rank order, one way (placeOrder, slotsBeside: best nearest, the Roll last; a
   * row-mate stepping out where one takes his slot), each a pitch card (pitch.pitchCard: this week's fixture and
   * points; a tap its Why sheet) under its number and its + (takeFrom), over what else it does (noteOf); his own card
   * stays, under "Keep" (keeps him that GW: no suggestion sells him) or "Yours +0.4" on your buy; a tap is his card's own. The rest of the pitch under a shade,
   * nothing drawn on it (the rings, tags and chalk lines to the other cards a choice changes went: the owner, 2026-10-26,
   * of Ødegaard's place after a take, "what this dirty messy crap, fix"; design study 1026e on how to say them). A bar at the pitch's foot (its
   * head for a bench place): ‹ › the places in their order, All N (the Week sheet), ✕, and what its numbers are. Its
   * order is held while it is open (a solve landing fills its number in place: renderDecks). Closed by ✕, Escape, a tap
   * outside it (on another place's edges: that place, in one tap), a take, a new week or a pitch mounted anew.
   */
  function openPlace(a) {
    if (S.drag?.pitch?.lifted || !S.decks?.some((d) => d.a === a)) return;
    closePlace(false);
    S.place = { a, order: null };
    globalThis.addEventListener('keydown', placeKey);
    drawPlace(true);
    // his other buys asked beside the week's choices (askPlace), dealt after the choices it shows, before the take-backs
    if (S.drawn) askPlace(ctx, S.drawn, gwNow(S.drawn), a);
    const layer = pitchHost.querySelector(':scope > .pm > .ah-place');
    ([...layer?.querySelectorAll('.ah-pgo') ?? []].find((x) => !x.disabled) ?? layer?.querySelector('.ah-walk button:not(:disabled)'))?.focus({ preventScroll: true });
  }
  const placeKey = (e) => { if (e.key === 'Escape' && (e.target === document.body || pitchHost.contains(e.target))) { e.stopPropagation(); closePlace(); } };
  /** The open place closed (`back`: fading out, focus back on his card). */
  function closePlace(back = true) {
    if (!S.place) return;
    const { a } = S.place;
    S.place = null;
    globalThis.removeEventListener('keydown', placeKey);
    const root = pitchHost.querySelector(':scope > .pm'), layer = root?.querySelector(':scope > .ah-place');
    for (const n of root?.querySelectorAll('.ah-stepout') ?? []) { n.classList.remove('ah-stepout'); n.inert = false; }
    if (back) cardIn(root, a)?.focus({ preventScroll: true });
    if (!layer) return;
    if (!back || reduceMotion() || !layer.animate) { layer.remove(); return; }
    layer.style.pointerEvents = 'none';
    layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }).onfinish = () => layer.remove();
  }
  /** The open place drawn (openPlace), its choices dealt out from behind him (`deal`: 180 ms, 18 ms apart; under Reduce
   *  Motion a fade) or drawn again where they are (a solve landed, a resize). */
  function drawPlace(deal) {
    const root = pitchHost.querySelector(':scope > .pm');
    const P = S.drawn, w = P && weekOf(P, gwNow(P)), d = w && S.decks?.find((x) => x.a === S.place?.a);
    // the control focused in it (a keyboard's, VoiceOver's), focused again once it is drawn anew (a solve landed)
    const was = document.activeElement?.closest?.('.ah-place') ? document.activeElement : null;
    const focusKeyOf = (n) => n && (n.dataset.key ? `[data-key="${CSS.escape(n.dataset.key)}"]` : n.dataset.add ? `[data-add="${CSS.escape(n.dataset.add)}"]`
      : n.getAttribute('aria-label') ? `[aria-label="${CSS.escape(n.getAttribute('aria-label'))}"]` : null);
    const again = focusKeyOf(was);
    root?.querySelector(':scope > .ah-place')?.remove();
    for (const n of root?.querySelectorAll('.ah-stepout') ?? []) { n.classList.remove('ah-stepout'); n.inert = false; }
    const boxes = root && d ? cardBoxes(root) : [], c = boxes.find((x) => x.id === d?.a);
    if (!c) { closePlace(false); return; }
    const g = w.gw, nm = P.L.name, W = root.clientWidth, data = ctx.data;
    const px = (x, y) => ({ left: `${x}px`, top: `${y}px`, width: `${c.w}px` });
    // its order held while it is open: a solve landing fills a number in place, nothing moves under a finger
    // (one listed after it opened, his other buys askPlace asked, in placeOrder's order after those held, the take-backs
    // still last: the cloud's presolve QA, 2026-10-27, Hill's place "−1.3 · −1.7 · Remove · −1.1")
    S.place.order ??= placeOrder(d.entries).map((e) => entryKey(g, e));
    const rank = new Map([...S.place.order, ...placeOrder(d.entries).map((e) => entryKey(g, e))].map((k, i) => [k, i]).reverse());
    const at = (e) => [takesBack(e) ? 1 : 0, rank.get(entryKey(g, e))];
    const entries = d.entries.slice().sort((x, y) => { const [p, i] = at(x), [q, j] = at(y); return p - q || i - j; });
    const row = c.n.closest('.pm-row, .pm-bench');
    const mates = boxes.filter((q) => q !== c && q.n.closest('.pm-row, .pm-bench') === row);
    const xs = [c, ...mates].map((q) => q.x).sort((p, q) => p - q);
    const step = c.bench && xs.length > 1 ? Math.min(...xs.slice(1).map((x, i) => x - xs[i])) : c.w + Math.max(4, (W - 5 * c.w) / 6);
    const room = slotsBeside(c.x, step, PLACE_SLOTS, W, c.w);
    // his own single moves the cards, at most one line for a plan he is part of (placeSplit; design 1026e "line": no "or
    // …" line under a card, no "also …" note, the owner, 2026-10-26, "what means 'or' here if it repeat same thing")
    const { singles, line: pline } = placeSplit(entries, d.a);
    // its last slot a tile (placePages): "Other…", Bring in… on this week at his position, any player the cards don't
    // offer (the owner, 2026-10-27: "one slot be left for 'other' clicking on which the 'bring in.' window pop up so i
    // can choose other defenders not suggested here"), under "⋯ N more" where his choices take more than a page (its
    // next page dealt)
    const other = P.editable && !frozenAt(P, g);
    const pages = placePages(singles, room.length, other), pg = (S.place.page ?? 0) % pages.length;
    const over = pages.length > 1;
    const shown = pages[pg];
    const tileAt = over ? room.at(-1) : other ? room[shown.length] ?? null : null;
    // his row steps aside only where a dealt card (or the tile) takes a row-mate's slot: the rest stay, under the shade
    // (the user, 2026-10-21: "why players dissapering from pitch": one choice dealt hid the whole row)
    const used = room.slice(0, shown.length + (tileAt != null ? 1 : 0));
    const out = mates.filter((q) => used.some((x) => Math.abs(q.x - x) < q.w));
    for (const q of out) { q.n.classList.add('ah-stepout'); q.n.inert = true; }
    const tab = (x) => `calc(${c.y}px - var(--pm-tab))`;
    const P2 = plateOf().second;
    const shade = h('div.ah-pshade', { onClick: (e) => shadeTap(e, boxes) });
    // his own card, bright, under what he is now
    const own = c.n.cloneNode(true);
    own.removeAttribute('data-id');
    own.classList.remove('ah-landed');
    own.classList.add('ah-pown');
    Object.assign(own.style, px(c.x, c.y));
    // (his real card focused first: the sheet it opens gives focus back to it)
    own.addEventListener('click', (e) => { e.stopPropagation(); c.n.focus({ preventScroll: true }); closePlace(false); c.n.click(); });
    // "Yours" over a transfer of yours, with no number: the choices beside it count against your plan, which yours is
    // (decision K; its own number vs rolling stays on the week line: "Yours +1.6" beside "−2.9" read as a 4.5-point gap,
    // the vsplan review, 2026-10-25); "Now" over a player or a buy Forkcast made (a week it re-picks: no rule of yours)
    const myMove = d.mine ? w.moves.find((m) => Number(m.in) === d.a) : null;
    const yours = !!myMove && !!pinOfMove(P, { ...myMove, gw: g });
    // a player the choices would sell (not a buy of yours): "Keep", his slot's no-transfer as the Roll is a buy's: a GW-g
    // Keep of him (keep), every choice selling him gone, at once with Undo (the user, 2026-10-21: "what if i do not want
    // to sell de cuyper": three taps on his card before)
    const keeps = !d.mine && P.editable && !frozenAt(P, g);
    const nowHead = keeps
      ? h('button.ah-phead.now.ah-pkeep.outl', { type: 'button', dataset: { key: 'keep' }, 'aria-label': COPY.placeKeepSaid(nm(d.a), g), style: { ...px(c.x, 0), top: tab() },
        onClick: () => { closePlace(false); keep(ctx, d.a, { gw: g, scope: 'gw' }); } }, COPY.placeKeep)
      : h('div.ah-phead.now', { 'aria-hidden': 'true', style: { ...px(c.x, 0), top: tab() } },
        // (your number blue with "xP": xpGain)
        // (in a span fitNum fits, as a dealt card's number: "Yours +12.5 xP" spilled out of its plate)
        yours ? h('span.ah-pv.m-num', null, COPY.placeYours) : COPY.placeNow);
    const dealt = [];
    shown.forEach((e, i) => {
      const x = room[i], pl = e.pl, s = pl ? planSaid(P, g, pl) : null;
      const ready = !pl || pl.state === 'ready';
      // a buy Forkcast made (no rule of yours): its × keeps the player it sold (removeMove), as the Week sheet's row says
      const fk = !!e.remove && !pinOfMove(P, e.remove);
      const said = e.remove ? (fk ? COPY.keepIn(nm(e.remove.out), g) : COPY.placeRemoveSaid(nm(e.remove.out), nm(e.remove.in))) : s.label;
      const card = ctx.pitch.pitchCard(e.inId, {
        players: data.byId, gw: g, horizon: data.xpGws, second: P2, first: g === P.A,
        onPlayer: () => (pl && ready ? openPlanWhy(P, g, pl) : ctx.openSheet('player', e.inId, { gw: g })),
      });
      card.removeAttribute('data-id');
      card.classList.add('ah-pcard');
      card.dataset.deal = i;
      card.dataset.key = entryKey(g, e);
      card.setAttribute('aria-label', `${said}${pl && ready ? '; shows why' : ''}. ${card.getAttribute('aria-label')}`);
      Object.assign(card.style, px(x, c.y));
      const num = e.remove ? (fk ? COPY.placeKeep : COPY.placeRemove) : pl.refRow ? COPY.planRoll(null) : !ready ? (pl.state === 'failed' ? failedWords(P, pl).head : COPY.pairChecking) : null;
      // its take in words where the + was (the user, 2026-10-23: "these + points ... confusing"; design_marks/design.md
      // §3): "Swap" (a pair's card swaps all its moves: its note names the others), a take-back its own word ("Remove",
      // "Roll"), the number beside it; the same handler and fly-in as before (takeFrom)
      // (the Roll of a week of yours, a choice counted against your plan: its word and its number, decision K)
      const rollBack = !!pl && !pl.refRow && !pl.choice.moves.length && !Object.keys(pl.choice.chips).length;
      const word = e.remove || pl.refRow ? num : rollBack && ready ? COPY.planRoll(null) : null;
      const swaps = e.remove ? [] : [[nm(d.a), nm(e.inId)], ...e.pair.map((q) => [nm(q.out), nm(q.in)])];
      const go = h('button.ah-pgo', {
        type: 'button', disabled: !ready || frozenAt(P, g),
        dataset: { add: pl ? `plan:${planKey(g, pl)}` : `rm:${e.remove.out}>${e.remove.in}` },
        'aria-label': e.remove ? said : pl.refRow ? COPY.planTake(s.head) : rollBack && ready ? `${COPY.planTake(s.head)}, ${plNumSaid(P, pl)}` : COPY.swapSaid(swaps, ready ? plNumSaid(P, pl) : null),
        onClick: (ev) => takeFrom(ev, P, g, pl, card, d.a, e.inId, e.remove ? () => removeMove(ctx, e.remove) : undefined),
      }, word ?? COPY.placeSwap);
      // white where it beats rolling past the noise (plPays: the place's every such choice, not only the one its plate
      // names; design_marks/design.md §3), ink where it is the week's best (weekBest, as the pitch's plate), dark with an
      // outlined Swap where it doesn't: the zero line seen without moving his card (the best move's beside a chip's ink
      // token too, as its plate: litOf `move`; the owner, 2026-10-25, "fix so chips not interfer in ths behaviour")
      const top1 = !!pl && S.M?.lit?.move === pl, pays = !top1 && !!pl && ready && plPays(pl);
      // (its take the one mark, .m-swap, its look the header's verdict: design 1028d K1)
      go.classList.add('m-swap', ...(top1 ? ['best'] : pays ? [] : ['quiet']));
      const head = h('div.ah-phead', { class: { best: top1, pays, lo: !top1 && !pays }, dataset: { deal: i }, style: { ...px(x, 0), top: tab() } },
        word && !(rollBack && ready) ? null : h('span.ah-pv.m-num', { 'aria-hidden': 'true', class: { wait: !ready } }, num ?? numParts(g, pl)),
        go);
      // (a card's one line is its header: a take-back alone says what it undoes under it, a single only its own state,
      // "removed by you", "as good in GW10", why it can't be checked; never another move; design 1026e)
      const text = takesBack(e) ? noteOf(P, w, e, d.a)
        : [earlyWords(pl), pl?.removed ? COPY.removedByYou : null, pl?.state === 'failed' ? failedWords(P, pl).note : null].filter(Boolean).join(' · ') || null;
      // one block on top of its card, read down: its header, its note, its line, then his name and fixture (the owner,
      // 2026-10-26, of "instead of Evanilson" / "or 2nd transfer −4 −6.1 xP ›" in the gap between rows, a neighbour's
      // header next to them: "here not clear what refer to what"): the note and the line in his card's own column, flush
      // under its header over his shirt (his card's tile), never in a gap a neighbour's header or card shares (fitBlocks);
      // a failed check's in the warning colour, never a pair's move that needs its other sale (checked: it can't alone)
      const note = text ? h('div.ah-pnote', { class: { warn: pl?.state === 'failed' && !pl.needs },
        style: { left: `${x}px`, top: `${c.y}px`, width: `${c.w}px` } },
        h('span.ah-pnt', { 'aria-hidden': 'true' }, whole(text))) : null;
      // (his flag, "⚠ 75%", drawn over the band at its top-right as on his tile, never hidden by it: the owner's judge of
      // design study 1026, "a card's flag stays drawn on top of the band, top-right as today"; last, so its line can be
      // the band's first: m-ahead.css)
      const flagged = note && card.querySelector('.pm-flag');
      if (flagged) note.append(flagged);
      dealt.push([card, head, note, x]);
    });
    // All N: the Week sheet at its plans, his card focused first (the sheet gives focus back to it)
    const toWeek = (plan = null) => { c.n.focus({ preventScroll: true }); closePlace(false); weekSheet(g, 'plans', plan); };
    // ⋯ N more: his choices on the place's other pages, the next page dealt in his cards (placePages; it opened the Week
    // sheet's list of every choice of the week until the owner's "not just evanilson", 2026-10-27); "Other…" under it,
    // the two then taking the slot from its header's top, each a 44 pt target
    const unseen = placeBuys(singles).length - shown.length;
    const both = over && other;
    const tile = tileAt == null ? null : h('div.ah-ptile', { style: { ...px(tileAt, 0), top: both ? tab() : `${c.y}px`, height: both ? `calc(${c.h}px + var(--pm-tab))` : `${c.h}px` } },
      over ? h('button.ah-pmore', { type: 'button', dataset: { key: 'more' }, onClick: () => { S.place.page = pg + 1; drawPlace(true); } }, COPY.placeMore(unseen)) : null,
      other ? h('button.ah-pmore.ah-pother', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.placeOtherSaid(nm(d.a), g), dataset: { key: 'other' },
        onClick: () => { c.n.focus({ preventScroll: true }); closePlace(false); ctx.openSheet('wish', null, { gw: g, pos: P.L.pos(d.a), out: d.a }); } }, COPY.placeOther) : null);
    const i = S.decks.indexOf(d), n = S.decks.length, place = COPY.placeOf(nm(d.a));
    // its buys your saved lineup leaves on your bench, said under its numbers (benchedBuys; the user, 2026-10-22: a sub's
    // "Palmer 0.0" explained, the number as computed)
    const benched = [...new Set(entries.flatMap((e) => (e.pl ? benchedBuys(P, g, e.pl) : [])))].map(nm);
    const onBench = benched.length ? COPY.onYourBench(benched) : null;
    const walk = h('div.ah-walk', { class: { top: c.bench }, role: 'group', 'aria-label': `${place}, ${COPY.placeAt(i + 1, n)}${onBench ? `. ${onBench}` : ''}` },
      h('button', { type: 'button', 'aria-label': 'Previous place', dataset: { key: 'prev' }, disabled: n < 2, onClick: () => stepPlace(-1) }, '‹'),
      h('span.ah-wl', { 'aria-hidden': 'true' }, h('span.ah-wl1', null, `${place} · ${COPY.placeAt(i + 1, n)}`),
        h('span.ah-wl2', null, COPY.placeNumbers(plansVs(P, g), P.gws.filter((x) => x >= g))), onBench ? h('span.ah-wl2.ah-wl3', null, onBench) : null),
      h('button', { type: 'button', 'aria-label': 'Next place', dataset: { key: 'next' }, disabled: n < 2, onClick: () => stepPlace(1) }, '›'),
      h('button', { type: 'button', 'aria-haspopup': 'dialog', dataset: { key: 'all' }, onClick: () => toWeek() }, COPY.placeAll(S.M.plans.filter((x) => !x.needs).length)),
      // (the sheets' ✕, their grey circle: design 1028d K5-rec, B11)
      h('button.m-xbtn', { type: 'button', 'aria-label': 'Close', dataset: { key: 'close' }, onClick: () => closePlace() }, '✕'),
      pline ? planLine(P, g, d, pline) : null);
    const layer = h('div.ah-place', { role: 'group', 'aria-label': `${place}, ${COPY.placeAt(i + 1, n)}` },
      // (read in the block's order, a header's Swap, its note's line, then his card: VoiceOver too)
      shade, own, nowHead, dealt.map(([card, head, note]) => [head, note, card]), tile, walk);
    root.append(layer);
    // the dealt cards' fixtures fitted as the pitch's are (a two-line one: his tile shorter, fitBlocks measures it); each header's
    // number never cut, as a tab's (fitNum)
    ctx.pitch.fitFixtures(layer);
    // (one look per place: "xP" from every header together, then a smaller number for all, then their spacing;
    // design_marks/design.md §3)
    for (const head of [nowHead, ...dealt.map(([, x]) => x)]) fitNum(head, head.querySelector(HEAD_NUM), HEAD_TRIMS);
    oneLook(dealt.map(([, x]) => x), ['noxp', 'tight', 'snug']);
    // then, still over, the whole header's type smaller (headScale), the dealt ones by one scale (one look per place)
    scaleHeads([nowHead]);
    scaleHeads(dealt.map(([, x]) => x));
    // its one line on one line (design 1026e: one line of words per choice), its "xP" first, then a smaller type
    fitLine(layer.querySelector('.ah-pline'));
    // (dropped into the turf under his row: its tile with them)
    const drop = fitBlocks(root, boxes, c, dealt);
    if (drop && tile) tile.style.top = both ? `calc(${c.y + drop}px - var(--pm-tab))` : `${c.y + drop}px`;
    // a sideways swipe only closes it (never a week: the pitch's swipe starts nowhere in it), its click then swallowed
    let from = null;
    layer.addEventListener('pointerdown', (e) => { from = [e.clientX, e.clientY]; });
    layer.addEventListener('pointercancel', () => { from = null; });
    layer.addEventListener('pointerup', (e) => {
      if (!from) return;
      const dx = e.clientX - from[0], dy = e.clientY - from[1];
      from = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) { spend(e); closePlace(); }
    });
    if (again) (layer.querySelector(again) ?? layer.querySelector('.ah-walk button:not(:disabled)'))?.focus({ preventScroll: true });
    if (!deal || !layer.animate) return;
    // the deal: his choices come out from behind him into his row (the user's 1st answer); Reduce Motion: they fade in
    shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    dealt.forEach(([card, head, note, x], k) => {
      const kf = reduceMotion() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: `translateX(${c.x - x}px) scale(.94)`, opacity: 0 }, { transform: 'none', opacity: 1 }];
      const o = { duration: reduceMotion() ? 150 : 180, delay: reduceMotion() ? 0 : k * 18, easing: FLY_EASE, fill: 'backwards' };
      for (const n2 of [card, head, note]) n2?.animate(kf, o);
    });
  }
  /** A place's one line (placeSplit; design 1026e "line", a chess engine's best line): the plan he is part of as one
   *  sentence, its moves in its road's order with its one number, "Cunha → Palmer, Neto → Tavernier +3.8", a take-back's
   *  words after them (lineMoves), on the place's bar under its title, never on a card. Its words open its Why sheet,
   *  where the solver's reason is (openPlanWhy: the second tap); its take says what it does, "Swap both" (Podmajersky:
   *  the label says what happens), taking it whole (takeFrom: its toast with Undo). Ink where it is the week's best. */
  function planLine(P, g, d, e) {
    const pl = e.pl, nm = P.L.name, ready = pl.state === 'ready', s = planSaid(P, g, pl), ms = lineMoves(P, e);
    const swaps = e.adds.map((m) => [nm(m.out), nm(m.in)]);
    const why = () => openPlanWhy(P, g, pl);
    return h('div.ah-pline', { class: { best: S.M?.lit?.move === pl }, dataset: { plan: planKey(g, pl) } },
      h('button.ah-plw', { type: 'button', 'aria-haspopup': 'dialog', disabled: !ready, dataset: { key: `line:${planKey(g, pl)}` }, 'aria-label': `${s.label}; shows why`, onClick: why },
        // (each move unbroken, the line wrapping only between them)
        ms.map((x, i) => [h('span.ah-tmv', null, x, i < ms.length - 1 ? ',' : null), ' ']), ms.back ? [h('span.ah-tmv', null, ms.back), ' '] : null,
        h('span.ah-tmv.m-num', { class: { wait: !ready } }, ready ? numParts(g, pl) : pl.state === 'failed' ? COPY.placeCantCheck : COPY.pairChecking),
        // (its take given way for room, fitLine: the words open the sheet that takes it)
        h('span.ah-plm', { 'aria-hidden': 'true' }, ' ›')),
      h('button.ah-plgo.m-swap', { type: 'button', class: { best: S.M?.lit?.move === pl }, disabled: !ready || frozenAt(P, g), dataset: { add: `plan:${planKey(g, pl)}` },
        'aria-label': swaps.length ? COPY.swapSaid(swaps, ready ? plNumSaid(P, pl) : null) : `${COPY.planTake(s.head)}${ready ? `, ${plNumSaid(P, pl)}` : ''}`,
        onClick: (ev) => takeFrom(ev, P, g, pl, ev.currentTarget, d.a, e.inId) }, swaps.length ? COPY.swapGo(swaps.length) : COPY.planRoll(null)));
  }
  /** A place's line (planLine) on one line (the clutter budget: one line of words per choice): its "xP" off, then its
   *  words' type a step smaller (--pl-k) to LINE_LEAST of it; still over (two long names at 320 wide), its take gives way
   *  (.nogo: the words, "›", open its Why sheet, whose one button takes it, as the pitch's sentence does) and the type is
   *  tried again; a sentence still wider (three moves at 320) wraps between its moves, never a name cut. */
  const LINE_LEAST = 0.8;
  function fitLine(line) {
    const w = line?.querySelector('.ah-plw');
    if (!w) return;
    const over = () => w.scrollWidth > w.clientWidth + 0.5;
    const smaller = () => { for (let k = 1; over() && k > LINE_LEAST; ) { k = Math.max(LINE_LEAST, k - 0.03); line.style.setProperty('--pl-k', k.toFixed(3)); } };
    if (!over()) return;
    line.classList.add('noxp');
    smaller();
    if (!over()) return;
    line.classList.add('nogo');
    line.style.removeProperty('--pl-k');
    smaller();
    if (over()) line.classList.add('wrap');
  }
  /** Headers `heads` of a place, each still over its card after fitNum (its number or its take's word cut), at one
   *  scale of their type (headScale: --ph-k), the least they need, never one under HEAD_LEAST in its smallest type (its
   *  number at .tight's .85em, the take's word at its .56 of the tab: the review, 2026-10-26, a floor on the header's own
   *  type drew a 6.8 px number); one still over there is left at its least. */
  function scaleHeads(heads) {
    const px = (e, k) => parseFloat(getComputedStyle(e)[k]) || 0;
    // (the smallest type drawn in it, at --ph-k 1: every part scales with it)
    const type = (x) => Math.min(px(x, 'fontSize'), ...[...x.querySelectorAll('.ah-pv, .ah-pgo')].map((e) => px(e, 'fontSize')));
    const over = () => heads.some((x) => [x, x.querySelector(HEAD_NUM)].some((e) => !!e && e.scrollWidth > e.clientWidth + 0.5));
    for (const x of heads) x.style.removeProperty('--ph-k');
    if (!heads.length || !over()) return;
    // each one's type (its children's widths less their padding) against its room (its width less its padding and gaps)
    const k = Math.min(...heads.map((x) => {
      const kids = [...x.children], pad = (e) => px(e, 'paddingLeft') + px(e, 'paddingRight');
      // (a "checking…" needs none: it gives way, HEAD_NUM)
      const need = kids.length ? kids.reduce((a, e) => a + (e.matches('.ah-pv.wait') ? 0 : e.scrollWidth - pad(e)), 0) : x.scrollWidth - pad(x);
      const room = x.clientWidth - pad(x) - px(x, 'columnGap') * Math.max(0, kids.length - 1) - kids.reduce((a, e) => a + pad(e), 0);
      return headScale(need, room, type(x));
    }));
    // (its marks' margins and the rounding: a step smaller while one is still over, as far as its least)
    const least = Math.min(1, Math.max(...heads.map((x) => HEAD_LEAST / type(x))));
    for (let j = Math.max(k, least); ; j = Math.max(least, j - 0.04)) {
      for (const x of heads) x.style.setProperty('--ph-k', j.toFixed(3));
      if (!over() || j <= least) return;
    }
  }
  /** A place's blocks (drawPlace) each in its card's column, its note and line flush under its header over his shirt
   *  (his card's tile, its height `room`: from his card's top to his name plate), never over his name or fixture nor
   *  outside the column (the owner, 2026-10-26: "here not clear what refer to what", a note in the gap between rows by
   *  a neighbour's header). Measured as drawn, one look per place (as scaleHeads): taller than his tile, its block (its
   *  header with it) up into the free turf over its row (to the row over it, its cards' plates 2 px clear; a bench
   *  place's under the forwards: 31 px at 393 × 702), then the dealt cards, all of them (one row), down into the turf
   *  under it and over the shirts of the row under it (to its plates, 2 px clear: under the shade, its names and points
   *  stay read; a tile only 25 px tall at 320 × 568); still over, or a word wider than its card (a name never breaks,
   *  never "Muharemovi/ć": the user, 2026-10-22), the notes' type a step smaller (--pn-k, to HEAD_LEAST
   *  as its headers': one floor per place), then the blocks up past the turf (data-rise "over", for QA); a word still
   *  wider than its card the note that wide, centred on it. Each line's target then as tall as 44 px where its band
   *  allows (design.md §6), never over its note's words or his flag (a tap there is his card's Why) nor past the band
   *  onto his name plate. → the dealt cards' drop, px */
  function fitBlocks(root, boxes, c, dealt) {
    const blocks = dealt.filter(([, , note]) => note);
    if (!blocks.length) return 0;
    const W = root.clientWidth, tab = blocks[0][1].offsetHeight;
    const room = (card) => (card.querySelector('.pm-plate')?.getBoundingClientRect().top ?? 0) - card.getBoundingClientRect().top;
    const rooms = blocks.map(([card]) => Math.max(0, room(card)));
    // (its words and its line: his flag is his tile's, drawn over the band, drawPlace)
    const words = (note) => [note, ...note.querySelectorAll(':scope > :not(.pm-flag)')];
    const wide = (note) => words(note).some((e) => e.scrollWidth > e.clientWidth + 0.5);
    const need = () => Math.max(...blocks.map(([, , note], i) => note.scrollHeight - rooms[i]));
    for (const [, , note] of blocks) note.style.removeProperty('--pn-k');
    for (const [i, [, , note]] of blocks.entries()) note.style.minHeight = `${rooms[i]}px`;
    // (the turf over his row, to the row over it's plates; under it, over the row under it's shirts to its plates, the
    // shaded row's names and points never covered: the keeper's over him to the pitch's top, the bench's to its foot)
    const top = root.getBoundingClientRect().top, plateY = (q) => (q.n.querySelector('.pm-plate')?.getBoundingClientRect().top ?? top + q.y) - top;
    const above = boxes.filter((q) => q.y + q.h <= c.y - 1).reduce((m, q) => Math.max(m, q.y + q.h), 0);
    // (a field place's bar at the pitch's foot, over the bench: the review of pick1026a)
    const rb = (e) => e.getBoundingClientRect().top - top;
    const below = [...boxes.filter((q) => q.y >= c.y + c.h + 1).map(plateY), ...(c.bench ? [] : [...root.querySelectorAll('.ah-place .ah-walk')]).map(rb).filter((y) => y >= c.y + c.h + 1)]
      .reduce((m, y) => Math.min(m, y), root.clientHeight);
    const up = Math.max(0, c.y - tab - above - 2), down = Math.max(0, below - c.y - c.h - 2);
    const least = Math.min(1, HEAD_LEAST / parseFloat(getComputedStyle(blocks[0][2]).fontSize));
    for (let k = 1; (need() > up + down + 0.5 || blocks.some(([, , note]) => wide(note))) && k > least; ) {
      k = Math.max(least, k - 0.04);
      for (const [, , note] of blocks) note.style.setProperty('--pn-k', k.toFixed(3));
    }
    // (each block as tall as its own words: the least it covers; the cards one row, dropped as the tallest needs)
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
    if (n > up + down + 0.5) root.querySelector(':scope > .ah-place').dataset.rise = 'over';
    for (const [, , note, x] of blocks) {
      if (!wide(note)) continue;
      const w = Math.min(W - 6, Math.max(...words(note).map((e) => e.scrollWidth)) + 2);
      note.style.width = `${w}px`;
      note.style.left = `${Math.min(W - 3 - w, Math.max(3, x + (c.w - w) / 2))}px`;
    }
    // (its line's target, m-ahead.css .ah-por::before: the free band over it up to its note's words or his flag, under it
    // down to the band's foot, his name plate's top; 44 px where they allow, the rest under 44 there)
    for (const [, , note] of blocks) {
      const line = note.querySelector(':scope > .ah-por');
      if (!line) continue;
      const r = line.getBoundingClientRect(), nb = note.getBoundingClientRect();
      const roof = Math.max(nb.top, ...[...note.children].filter((e) => e !== line).map((e) => e.getBoundingClientRect().bottom));
      const want = Math.max(0, 44 - r.height), under = Math.max(0, Math.min(nb.bottom - r.bottom, want / 2)), over = Math.max(0, Math.min(r.top - roof, want - under));
      line.style.setProperty('--por-t', `${over}px`);
      line.style.setProperty('--por-b', `${Math.max(0, Math.min(nb.bottom - r.bottom, want - over))}px`);
    }
    return drop;
  }
  /** ‹ › in a place's bar: the place before or after it in their order (yours first, then best first), dealt out. */
  function stepPlace(dir) {
    const D = S.decks ?? [], i = D.findIndex((x) => x.a === S.place?.a);
    if (i < 0 || D.length < 2) return;
    // a keyboard or VoiceOver walking the places stays on the bar's ‹ / ›
    const bar = document.activeElement?.closest?.('.ah-walk') ? document.activeElement.dataset.key : null;
    openPlace(D[(i + dir + D.length) % D.length].a);
    if (bar) pitchHost.querySelector(`:scope > .pm > .ah-place .ah-walk [data-key="${bar}"]`)?.focus({ preventScroll: true });
  }
  /** A tap on the shade of an open place: on another place's edges or tab (its card's gap over him), that place, in one
   *  tap; anywhere else, closed. */
  function shadeTap(e, boxes) {
    const b = pitchHost.querySelector(':scope > .pm')?.getBoundingClientRect();
    const x = e.clientX - (b?.left ?? 0), y = e.clientY - (b?.top ?? 0);
    // (never a row-mate stepped out for the dealt cards: he isn't there to tap)
    const to = (S.decks ?? []).find((d) => {
      const q = d.a !== S.place?.a && boxes.find((c) => c.id === d.a);
      return q && !q.n.classList.contains('ah-stepout') && x >= q.x - 4 && x <= q.x + q.w + 4 && y >= q.y - 44 && y <= q.y + 16;
    });
    if (to) openPlace(to.a);
    else closePlace();
  }
  /**
   * The Week sheet (the pitch research's step 4: the panel's successor; the week line's tap, a place's "All N" and "⋯ N
   * more" at its plans, a sheet's ask for Your rules: openRules, a carried plan's Review: at Your rules): the viewed GW's
   * notices, each with its own control (clashRow, B12: Remove; a new forecast's line, B14), GW A under way its whole
   * sentence (B68), GW A's price watch with Hide (watchView, B139); your transfers, one row each (xferRow: its money
   * lines, ×, its left swipe; the user's 6a, 2026-10-19), or a Wildcard or Free Hit week's note over its changes
   * (changeRow); every choice (planRow) under what they count against; then Your rules (renderRules). Drawn by render
   * while open (drawWeek), so it follows the plan as it lands. A + taken here closes it: its change lands on the pitch.
   */
  function weekSheet(g, at = null, plan = null) {
    const P = S.drawn, w = P && weekOf(P, g);
    if (!w) return;
    if (!S.week) {
      const title = COPY.weekTitle(g);
      ctx.sheets.open({
        title, label: title, detent: 'medium', cls: 'ah-wsheet',
        build(body, sheet) {
          S.week = { sheet, g, host: h('section.ah-block.ah-wk', { 'aria-label': title }), title: body.querySelector('.m-sh h2') };
          body.append(S.week.host);
          uncovered.observe(sheet.el, { attributes: true, attributeFilter: ['inert'] });
        },
        onClose: () => { presolveTaps(ctx, null, { owner: S.week?.sheet }); S.week = null; },
      });
    }
    drawWeek(P, w, weekModel(P, w));
    // (`plan`: a row's key, the place's "⋯ N more" opening at the first of his choices it had no room for)
    const to = (plan && S.week.host.querySelector(`[data-plan="${CSS.escape(plan)}"]`)) || (at && S.week.host.querySelector(`[data-at="${at}"]`));
    if (to) { S.week.sheet.setDetent('large'); to.scrollIntoView({ block: 'start' }); }
  }
  function drawWeek(P, w, M) {
    const g = w.gw, W = S.week;
    if (W.g !== g) {
      W.g = g;
      if (W.title) W.title.textContent = COPY.weekTitle(g);
      W.sheet.el.setAttribute('aria-label', COPY.weekTitle(g));
      W.host.setAttribute('aria-label', COPY.weekTitle(g));
    }
    const rows = M.sq ? [h('p.ah-gwnote.m-foot', null, COPY.chipWeek(M.sq, g, M.sq === 'fh' ? ftAfter(P, w) : null)), h('div.ah-moves.sq', null, w.moves.map((m) => changeRow(P, w, m)))]
      : movesInOrder(P, w).map((m, i) => xferRow(P, w, m, i));
    const name = plansHeading(P, g);
    // the week's facts under the title, as the week line's (rollFacts: weekFacts with a short bank's words; the user,
    // 2026-10-22: "3 FT · £0.6m ITB · 4 FT in GW9", Help's promise), in every week but GW A under way (its sentence)
    const facts = M.live ? null : rollFacts(P, w);
    // a week of two or more transfers: the week's number over them, the line's (its rows have none: shareWeek)
    const wg = !M.live && !M.sq && shareWeek(w) ? weekGain(P, w) : null;
    fill(W.host,
      wg ? h('p.ah-bs.ah-wfacts.ah-wgain', { dataset: { row: 'weekgain' } }, h('b', null, COPY.nTransfers(w.moves.length)), hitTag(w.hits), ' ', numOf(wg.wait, wg.cmp, ap0(P, g)),
        wg.cmp && !wg.wait && wg.vs ? ` vs ${COPY.planVsRoll}` : null) : null,
      facts ? h('p.ah-bs.ah-wfacts', { 'aria-label': facts.said }, facts.rest) : null,
      M.live ? h('div.ah-brow.ah-bq.ah-blive', { role: 'status' }, h('span.ah-bt', null, M.liveText)) : null,
      M.notices.map((x) => x.row?.()),
      rows,
      // while they check, how far, as Add a player says it: "Checking GW8 · 3 of 9 plans · 0:12" (plansWait, waitClock)
      // the rows that share an "instead of …" under it as their subheading ("Instead of Palmer")
      M.plans.length ? [h('div.ah-wh', { dataset: { at: 'plans' } }, h('h3', null, name),
        M.wait ? h('p.ah-bs', null, COPY.checkingWeek(g, M.wait.i, M.wait.n, 'plan'), S.wait ? h('span', { 'aria-hidden': 'true' }, ' · ', waitClock()) : null) : null),
        // the two groups (the rows that add to your transfer, those sharing the "instead of …") in their best rows' order,
        // rows within each best first: both by M.plans' own order, best first once none checks (plansOf's byGain), the
        // slots held while they check (heldOrder, M1) (the user, 2026-10-22: the "Instead of Palmer" group last put a +5.9
        // Free Hit under a −0.1 row)
        // (never a pair's move the week can't make alone, plansOf `needs`: a dead row whose reason was the phone's sum,
        // fitOf; its plan's row says it whole; design 1026e "line")
        ...[false, true].map((sh) => ({ sh, grp: M.plans.filter((pl) => !pl.needs && (planBack(P, g, pl).back === M.sharedBack) === sh) }))
          .filter((x) => x.grp.length).sort((x, y) => M.plans.indexOf(x.grp[0]) - M.plans.indexOf(y.grp[0])).map(({ sh, grp }) => {
            const rows = grp.map((pl) => planRow(P, g, pl, { shared: M.sharedBack, closes: true, lit: litPays(pl, M), best: M.lit?.move === pl }));
            // (those under it marked, data-under="instead": the QA's chip-week-plans reads which rows it heads)
            if (sh) for (const r of rows) r.dataset.under = 'instead';
            return sh ? [h('div.ah-wh', { dataset: { at: 'instead' } }, h('p.ah-bs', null, capFirst(M.sharedBack))), rows] : rows;
          })] : null,
      asksHost.firstChild ? [h('div.ah-wh', { dataset: { at: 'rules' } }, h('h3', null, COPY.rulesHead)), asksHost] : null);
    // its rows' taps solved ahead while it is open (presolveTaps): the takes and Removes the week's own leave (weekTaps)
    if (P.editable && !M.live && M.settled) {
      const { takes, removes, sig } = weekTaps(ctx, P, g, M.plans);
      presolveTaps(ctx, [...takes, ...removes], { gw: g, sig, owner: W.sheet });
    }
  }
  /** B12: the status row of a re-plan that couldn't keep your choices (clashLine): a warning glyph, its words, and a
   *  Remove for each choice they name (removeRule: Undo), in the look of a question asked in place (m-a.css .ah-ask). B7:
   *  a Remove that would re-plan GW A under way is off (liftsLive), its reason after the words in another week (GW A's
   *  own block says it in its live line). */
  function clashRow(P, c) {
    const held = c.pins.some((p) => liftsLive(ctx, P, p)) && gwNow(P) !== P.A;
    return h('div.ah-brow.ah-ask.ah-clash', { role: 'status' }, icon('warn', { size: 16 }), h('p.ah-askt', null, held ? `${c.text} ${COPY.live(P.A)}` : c.text),
      c.pins.length ? h('div.ah-askb', null, c.pins.map((p) => h('button.ah-askno', {
        type: 'button', disabled: !P.editable || liftsLive(ctx, P, p), onClick: () => removeRule(ctx, p.id),
      }, `Remove ${rowName(P, p)}`))) : null);
  }
  /** A notice's status row with no control (in the look of a question asked in place, on the card: m-a.css): B14's new
   *  forecast (.ah-news), GW A's lineup to set in FPL (.ah-fplset, fplSets). */
  // text, or [lead, [step]]: the steps a line each under it (COPY.setInFplRow; the user, 2026-10-22: a to-do list, not a
  // sentence)
  const noteRow = (cls, text) => h(`div.ah-brow.ah-ask${cls}`, { role: 'status' }, Array.isArray(text)
    ? h('div.ah-askt', null, h('p', null, text[0]), h('ul.ah-steps', null, text[1].map((x) => h('li', null, x)))) : h('p.ah-askt', null, text));
  /** A new forecast whose best plan beats yours (memory's drift, judged once per roads version): said once per version,
   *  as a toast whose one action takes it ("Use it") and whose leaving any other way keeps yours (driftSay, B22). */
  function sayDrift(P) {
    const d = P.mem?.drift;
    if (!d?.text || S.driftSaid === d.version) return;
    S.driftSaid = d.version;
    driftSay(ctx, d);
  }
  /** B14 (review3 Part 1 §2, saffer Part 1 §8: a new forecast swapped the suggested plan's GW6 buy and nothing said what
   *  changed): on the suggested plan with no rules of yours, a new forecast that changed its moves beyond the noise is
   *  said once (under the hold, the model's best road the suggested plans follow: "New forecast, best plan: …", the user,
   *  2026-10-12), a notice of the week line (after a clash and the price watch): "New forecast: GW6 Scott → Le Fée
   *  (was Groß) · 2 changes in GW7–9" (memory.forecastChange). Worked out once per forecast version, the plan then
   *  seen on this device (markSeen: a reload doesn't say it again); on screen for this page until your next edit (FLASH:
   *  each landing, Undo or lineup change) or the next forecast. The window total stays the headline; Choice's
   *  gain shift ("Groß +7.5 → +6.9") would need the earlier gains, which markSeen doesn't keep. → its text | null */
  function forecastLine(P) {
    const m = P.mem;
    if (!m || P.healing) { if (S.fc) S.fc.text = null; return null; }
    if (S.fc?.version !== m.version) {
      const mem = memOf(ctx), fc = mem.forecastChange();
      S.fc = { version: m.version, at: FLASH?.at ?? 0, text: fc ? COPY.newForecast(P.A, fc.gwA, fc.pencil?.text, fc.held) : null };
      mem.markSeen();
    }
    if ((FLASH?.at ?? 0) !== S.fc.at || (!m.hold && m.source !== 'model')) S.fc.text = null;
    return S.fc.text;
  }
  /** B139: GW A's price watch's signature (team, the night its line speaks of, its verdict and amount): "Hide" keeps
   *  it away in this browser (WAIT_KEY) while this stays the same; a new verdict shows again. */
  const waitSig = (P, watch) => { const n = watch.nights[watch.at]; return `${P.entry}:${n.epoch}:${n.verdict}:${n.w}`; };
  function waitWatch(P, watch) {
    ctx.api?.local?.set?.(WAIT_KEY, waitSig(P, watch));
    render();
  }
  /** B139: while GW A's price watch shows (or is put away), its counted players' FPL prices and the night its line
   *  speaks of, kept in this browser (NIGHT_KEY: written only when they change) for the morning after (sayNight). */
  function keepNight(P, watch) {
    const counted = Object.values(watch.players).filter((p) => p.counted && P.L.priceT(p.id) != null);
    const kept = { entry: P.entry, gw: P.A, epoch: watch.nights[watch.at].epoch, prices: Object.fromEntries(counted.map((p) => [p.id, P.L.priceT(p.id)])) };
    const s = JSON.stringify(kept);
    if (s === S.nightKept) return;
    S.nightKept = s;
    S.night = kept;
    ctx.api?.local?.set?.(NIGHT_KEY, s);
  }
  /** B139: the morning after: once the kept night has passed and the bundle is from after it (calls.priceMorning), one
   *  quiet toast with no Undo (nothing changed: "Groß rose overnight (+£0.1m): your GW6 moves still fit", "Prices held
   *  overnight"), then the night is forgotten; another team's or an earlier GW A's is forgotten unsaid. */
  function sayNight(P) {
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
    if (text) toastOf(ctx)(text, 'info');
  }
  /** B2 (the user, 2026-10-10): a new GW's plan carried over from the last one (memory.carryOver: Plan.carried): said
   *  once, as a toast with no Undo (a notice, not a history); its one action, Review, opens the Week sheet at Your rules
   *  when one carried. */
  function sayCarried(P) {
    const t = P.mem?.carried;
    if (!t || S.carriedSaid === t) return;
    S.carriedSaid = t;
    const review = () => { if (S.drawn) weekSheet(gwNow(S.drawn), 'rules'); };
    toastOf(ctx)(t, 'info', listedRules(P, gwNow(P)).length ? { action: { label: 'Review', onClick: review } } : {});
  }

  /** The week line's node (renderLine's; fitBlock's probe and renderBaking's): one strip, its one line (`two`, quiet,
   *  amber when `warn`; the user, 2026-10-22: "WEEK LINE AT MOST 2 LINES"; the week's status on the pitch since the
   *  owner's strip, 2026-10-26: statusTok; `one` the first week's baking words alone) and its `doors` at its right end.
   *  A button opening the Week sheet
   *  (`onClick`, its spoken `label`, in a heading for VoiceOver's rotor; `moves` its week's transfers, `${out}>${in}`; the
   *  doors one group, wrapping under the line together where they leave it too little room: m-ahead.css), a
   *  status (`status`: while the first week is planned) or, with neither, a probe hidden from VoiceOver. */
  function barNode({ one = null, two = null, warn = false, label = null, onClick = null, status = false, moves = '', doors = [], cls = '' }) {
    const at = onClick ? { type: 'button', dataset: { row: 'week', ...(moves ? { moves } : {}) }, 'aria-haspopup': 'dialog', 'aria-label': label, onClick }
      : status ? { role: 'status' } : { 'aria-hidden': 'true' };
    return h(`div.ah-pbar${cls}`, null,
      h('div.ah-pbh', onClick ? { role: 'heading', 'aria-level': '3' } : null,
        h(`${onClick ? 'button' : 'div'}.ah-brow.ah-pbt`, at, one ? h('span.ah-bt', null, one) : null,
          two ? h('span.ah-bs', { class: { warn } }, two) : null)),
      doors.length ? h('div.ah-doors', null, doors) : null);
  }

  /** Nodes joined by " · ". */
  const dotted = (xs) => xs.filter(Boolean).flatMap((x, i) => [i ? ' · ' : null, x]);
  /** A separator of the week line's lead (weekLead, renderLine: " · " after it), its words kept (data-t) for fitFacts,
   *  which narrows it to hair spaces where a problem notice after the lead has no room ("shed the lead's separator
   *  spacing, not the facts": the owner, 2026-10-22). */
  const bsep = (t) => h('span.ah-bsep', { dataset: { t } }, t);
  const textOf = (nodes) => [].concat(nodes).flat(Infinity).map((x) => (x?.textContent ?? x ?? '')).join('');
  /** The week's money only when it is a problem: short at FPL's prices ("−£0.4m in bank", coral), or a later week's
   *  bank below 0 by no more than FPL's sale prices explain (price drift, said with its amount and when it is checked
   *  again: "−£0.1m at FPL's sale prices · checked again before GW8", B103). No bank otherwise and no captain,
   *  and no week's summary under the first transfer (the user, 2026-10-09: "why captain and bank shown even and why in
   *  first transfer, thats just confusing"): the hit is on its own row. */
  function bankWarn(P, w) {
    if (priceDrift(P, w)) return COPY.priceDrift(w.bank, w.gw);
    const short = w.bank != null && w.bank < -1e-9 && !ap0(P, w.gw);
    return short ? h('span.g-loss', null, `${fmt.money(w.bank)} in bank`) : null;
  }
  /** The week's bank as the week line's second line leads with it where its facts aren't drawn (renderLine): a short
   *  one's words (bankWarn), else "£0.5m ITB" (itbWords, as the facts say it), whole. → {node, said} | null */
  function bankLead(P, w) {
    const warn = bankWarn(P, w);
    if (warn) return { node: warn, said: textOf(warn) };
    const x = itbWords(w.bank);
    return x && { node: h('span.ah-fact', null, itbNode(x[0])), said: x[1] };
  }
  /** The week line's lead where its facts aren't drawn (renderLine): the week's free transfers (before its transfers)
   *  and its bank, weekFacts' first words with bankLead's: "3 FT · £0.6m ITB" (the user's form, 2026-10-21; Help says
   *  it: calls.js help, "Plans"), a short bank's words in its bank's place. → {node, said} */
  function weekLead(P, w) {
    const [[ft, ftSaid]] = weekFacts(P, w), bank = bankLead(P, w);
    // (its " · " a separator of its own, .ah-bsep: fitFacts narrows it where a problem notice after it has no room)
    return { node: [h('span.ah-fact', null, ft), bank ? [bsep(' · '), bank.node] : null], said: [ftSaid, bank?.said].filter(Boolean).join(', ') };
  }
  /** An engine estimate as a road (memory.holdRoad's shape) from GW g on: the Why sheet's run strip reads its weeks. */
  const roadOfEv = (ev, g) => ({ weeks: ev.gws.filter((x) => x.gw >= g).map((x) => ({
    gw: x.gw, in: x.bought, out: x.sold, xi: x.xi, bench: x.bench, captain: x.captain, vice: x.vice, chip: x.chip ?? null,
    bank: x.bank, ft_avail: x.ft, ft_used: x.used, hits: x.hits, pred: x.gross,
  })) });
  /**
   * A12: a move's Why sheet (the user, 2026-10-08: a transfer row has no details in place; 2026-10-19: "get in order
   * players comparison page … make it clean and structured"): title "Chilwell → Bassey", sub "GW6 · +5.7 xP over
   * GW6–9 vs rolling", its buttons, the two players side by side (sheets/why.js: club and position, price, owned,
   * status, each GW's forecast and its total, their last six, the stats), what else it changes (whyFacts), then the When
   * line. Its number: the plan with the move against the same plan without it, from its GW on (engine estimates, yours
   * as taken, your saved lineups kept), as its row measures it (rowGains); a funding sale: weighed with the buy it pays
   * for, both against neither ("Frees £1.4m so Saka fits · on its own −1.4"), both moves side by side.
   */
  /** A Why sheet's title, each of its moves' players a link to his card, its words as before: "Calvert-Lewin →
   *  Evanilson", a plan's "Saka → Rice, Gabriel → Saliba" (`nb`: their spaces kept, as titled since; `tail`: what it takes
   *  back). The owner, 2026-10-27: "players on comparison not clickable so go to their profile", the title's names
   *  tapped; the table's own "Mbeumo ›" links stay. Drawn in the title's one look, no underline (design 1027b: a link
   *  look on half a heading; the table's heads under it carry the visible link): the names still tap and say "X's
   *  card". → node */
  function movesTitle(P, g, moves, { nb = false, tail = '' } = {}) {
    const name = (id) => (nb ? P.L.name(id).replace(/ /g, ' ') : P.L.name(id));
    const link = (id) => h('button.wy-tn', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.cardOf(P.L.name(id)), onClick: () => ctx.openSheet('player', id, { gw: g }) }, name(id));
    return h('span.wy-ttl', null, moves.map((m, i) => [i ? ', ' : null, link(m.out), nb ? ' → ' : ' → ', link(m.in)]), tail ? ` ${tail}` : null);
  }
  function openWhy(P, g, m) {
    const nm = P.L.name;
    const w = weekOf(P, g);
    let withIt, without, drafts = null, lead = null, label = null, pairs = null;
    const vr = rollOf(P, w), shares = shareWeek(w);
    const rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const f = fundingOf(P, g, m);
    if (rg && f && f.fund.move === w.moves.find((x) => x.out === m.out && x.in === m.in)) {
      // the funding sale with the buy it pays for, against neither
      const both = new Set([`${f.main.move.out}>${f.main.move.in}`, `${f.fund.move.out}>${f.fund.move.in}`]);
      let d = draftOf(ctx);
      for (const x of movesInOrder(P, w).filter((y) => both.has(`${y.out}>${y.in}`))) d = dropMove(d, flatMoves(d).find((z) => z.gw === g && z.out === x.out) ?? { gw: g, ...x });
      withIt = planBaseline(ctx, P, g);
      without = asTaken(ctx, P, d, g);
      lead = [COPY.funds(fmt.money(freedBy(rg.withIt, g, m)), nm(f.main.move.in)), shares ? null : `on its own ${fmt.signed(rg.cmp.delta)}`].filter(Boolean);
      label = `with ${nm(f.main.move.in)}`;
      pairs = [pairOf(withIt, g, m), pairOf(withIt, g, f.main.move)];
    } else if (rg) { withIt = rg.withIt; without = rg.without; drafts = [rg.dWith, rg.dWithout]; } else {
      const d0 = draftOf(ctx);
      drafts = [d0, dropMove(d0, flatMoves(d0).find((x) => x.gw === g && x.out === m.out) ?? { gw: g, ...m })];
      withIt = planBaseline(ctx, P, g);
      without = asTaken(ctx, P, drafts[1], g);
    }
    // a week's one move: its row's number (rollOf), your plan against the week's roll plan, in the header and the
    // receipt; the line under the grid reads the move's own facts (the plan without it: `own`)
    const own = compare(ctx, withIt, without);
    const c = vr ?? own;
    // "vs rolling" when the move is the week's only one (without it the week rolls), else against the plan without it;
    // B3: "vs rolling, no later transfer" when that roll never spends the free transfer it saves (rolling)
    const rolls = !!vr || !(without.gws.find((x) => x.gw === g)?.moves || []).some((x) => x.ok);
    const vs = rolls ? `vs ${rolling(P, g, vr?.ev ?? without)}` : 'vs without it';
    // in a week of two or more transfers no number of its own (shareWeek): the sub names the week's transfers, the facts
    // keep the money, hits and free transfers but no share (no miss, no better use: both read against it), its own week
    // on the When line bare
    const sub = shares ? COPY.whyOneOf(g, w.moves.length) : whySub(g, c.delta, `over ${span(P.gws.filter((x) => x >= g))}${label ? ` ${label}` : ''} ${vs}`);
    // under a number vs rolling, where your total moved by another amount (the header's change: the move against your
    // plan without it, which makes no later transfer; rolling's plan spends the one it saves): that amount and what it
    // counts against, one line (COPY.totalMoved; the owner, 2026-10-26: "what means +1.6 vs rolling but total +5.1",
    // the take's toast saying the row's number alone)
    const others = P.weeks.some((x) => x.moves.some((y) => !(x.gw === g && y.out === m.out && y.in === m.in)));
    const moved = vr && !shares && !lead && Math.abs(own.delta - vr.delta) >= 0.05 ? h('span.wy-tot', null, COPY.totalMoved(own.delta, others)) : null;
    return ctx.openSheet('why', {
      a: { road: roadOfEv(vr ? vr.mine : withIt, g), label: `${nm(m.out)} → ${nm(m.in)}` },
      b: { road: vr ? roadOfEv(vr.ev, g) : roadOfEv(without, g), label: vr ? `Roll GW${g}` : `Keeping ${nm(m.out)}`, short: rolls ? 'Rolling' : `Keeping ${nm(m.out)}` },
      title: movesTitle(P, g, [m]), sub: moved ? [...[sub].flat(), moved] : sub, gw: g,
      // the two players side by side, the one bought first (the user, 2026-10-14: "see the stats fixtures and stats
      // comparison which players card show"), each with the price the move pays and gets
      pairs: pairs ?? [pairOf(withIt, g, m)],
      // a header against rolling (vr): the facts' ", not X" (the move's own number, `own`) names its baseline
      // (the user, 2026-10-22: one baseline per sheet): its facts' numbers set on the header's, against rolling (onBase)
      facts: lead ?? whyFacts(ctx, P, g, m, withIt, without, shares ? { yours: true } : { drafts, c: own, yours: true, head: vr ? vr.delta : null }),
      // the review (2026-10-08): "why this week and not next", and "move to next week": the same move in each GW
      // (whenOf); a week tapped is chosen and the button under the line (B79) moves your transfer there (moveTo), with its
      // toast and Undo, and the sheet closes
      when: whenSheet(P, g, m, vr ? { head: vr.delta, vs } : null, shares),
      acts: [...(whyActs(P, g, m, c) ?? []), ...placeAct(m.in, g)],
      // its taps solved ahead (presolve): its buttons', then your transfer moved to each other week of the When line
      presolve: frozenAt(P, g) ? null : [...whyTaps(P, g, m), ...(pinOfMove(P, { ...m, gw: g }) ? P.gws.filter((x) => x !== g).map((x) => ({ kind: 'move', gw: g, run: () => moveTo(ctx, { ...m, gw: g }, x) })) : [])],
    });
  }
  /** Player `id`'s place on the pitch as drawn, when it draws GW g (S.decks.gw: renderDecks) | null. */
  const deckOf = (id, g) => (S.decks?.gw === g ? S.decks.find((x) => x.a === Number(id)) ?? null : null);
  /** A player's place in GW g for his sheet's line, "3 choices for his place ›" (the hold's visible twin) | null: none
   *  drawn. */
  const placeLink = (id, g) => { const d = deckOf(id, g); return d ? { n: d.entries.length, open: () => whenFree(() => openPlace(d.a)) } : null; };
  /** `fn` once the pitch takes taps again: a sheet closing leaves the screen inert until it has gone (app.js sync), so a
   *  place opened from a sheet is dealt out (and focused) on a pitch that answers; a second at most. */
  const whenFree = (fn, n = 40) => (pitchHost.closest('[inert]') && n > 0 ? setTimeout(() => whenFree(fn, n - 1), 25) : fn());
  /** A buy's place in GW g, from his Why sheet (the card behind: the hold's visible twin): "What could go there instead
   *  ›", the sheet closing first (and the Week sheet under it: the place is dealt on the pitch in view); none where his
   *  place isn't on the pitch drawn, nor while it draws another week. */
  const placeAct = (id, g) => (deckOf(id, g) ? [{ label: COPY.placeInstead, link: true, act: () => { S.week?.sheet.close(); setTimeout(() => whenFree(() => openPlace(Number(id))), 0); } }] : []);
  /** The Why sheet's buttons (sheets/why.js), this GW's only (F11): "Keep Scott · GW6" and "Not Groß · GW6". "Not" is
   *  the row's swipe by tap, its row leaving the swipe's way (vetoFromWhy, B98b); Keep has no swipe (B19). B99 (saffer
   *  A8; the user, 2026-10-10): the row's own button too, filled only when what it does beats the noise (clearGain), so a
   *  veto is never the easiest control. Your transfer's ×: "Remove" first (removeMove, as the row's; none where the row
   *  has no ×), filled when taking it off gains beyond the noise (c, the sheet's number, turned round); a move Forkcast
   *  made has no rule of yours, so its × is the Keep (removeMove), and the Keep button is that one. None in GW A under
   *  way (frozenAt). */
  /** The Why sheet's edits (whyActs: Remove, Keep, Not) as taps solved ahead while it is open (presolve). */
  function whyTaps(P, g, m) {
    const mv = { out: m.out, in: m.in, gw: g };
    return [
      ...(pinOfMove(P, mv) ? [{ kind: 'remove', gw: g, run: () => removeMove(ctx, mv) }] : []),
      { kind: 'keep', gw: g, run: () => keep(ctx, m.out, { gw: g, scope: 'gw' }) },
      { kind: 'veto', gw: g, run: () => veto(ctx, mv) },
    ];
  }
  function whyActs(P, g, m, c) {
    if (frozenAt(P, g)) return null;
    const nm = P.L.name;
    const mv = { out: m.out, in: m.in, gw: g };
    const mine = !!pinOfMove(P, mv);
    const off = clearGain({ delta: -c.delta, label: c.label });
    // the safe act first, the take-backs after it (`danger`: red words; design 1028d K2, H5, N4, R4)
    return [
      { label: `Keep ${nm(m.out)} · GW${g}`, act: () => keep(ctx, m.out, { gw: g, scope: 'gw' }), fill: !mine && off },
      mine && P.editable ? { label: 'Remove', act: () => removeMove(ctx, mv), fill: off, danger: true } : null,
      notAct(P, g, m),
    ].filter(Boolean);
  }
  /** B19: a veto in this GW in words, the rule chip's form (memory.ruleText): "Not Groß · GW6", the same on the row's
   *  swipe backdrop (vetoBack) and the Why sheet's button. m: {in, gw}. */
  const notOf = (P, m) => `Not ${P.L.name(m.in)} · GW${m.gw}`;
  /** The backdrop a row's left swipe shows under it (B19): its veto's words, right-aligned. */
  const vetoBack = (P, m) => h('div.ah-veto', { 'aria-hidden': 'true' }, h('span', null, notOf(P, m)));
  /** The Why sheet's "Not Groß · GW6" for move m's buy (the left swipe's tap twin, vetoFromWhy: GW g only): whyActs' and,
   *  one per GW-g buy, openPlanWhy's (B19c). */
  function notAct(P, g, m) {
    const mv = { out: m.out, in: m.in, gw: g };
    return { label: notOf(P, mv), act: () => vetoFromWhy(mv), danger: true };
  }
  /** The Why sheet's When line (sheets/why.js): {weeks: whenOf, pick(gw) → bool, disabled} | null. A week made goes to
   *  that GW, as a row dropped on it does (B18: the view stayed on the old week). `on`: the header's number and its
   *  baseline in words ({head, vs}: the move against rolling), each week's number set on it (whenOnBase; the user,
   *  2026-10-22: one baseline per sheet), else against keeping the player it sells. */
  function whenSheet(P, g, m, on = null, bare = false) {
    // (`bare`: no week with a number, nor what they count against, a week of two or more transfers: shareWeek; its other
    // weeks' were this move's alone against keeping its seller, the per-move share the user ordered out, 2026-10-22; the
    // review of the many-FT fixes the same day)
    const weeks = whenOnBase(whenOf(ctx, P, { gw: g, out: m.out, in: m.in }), on?.head)?.map((x) => (bare ? { ...x, delta: null, label: null } : x));
    if (!weeks || weeks.length < 2) return null;  // a 1-week plan (You → Plan ahead): no other week to move it to
    const pick = (x) => {
      const ok = moveTo(ctx, { gw: g, out: m.out, in: m.in }, x);
      if (ok) setGw(x);
      return ok;
    };
    // what each week counts against, said (the plans review, 2026-10-19: "+0.6 vs rolling" over "GW6 +2.7")
    return { weeks, pick, disabled: !P.editable, vs: bare ? null : COPY.whenVs(on?.vs ?? COPY.vsKeeping(P.L.name(m.out)), P.gws) };
  }
  /** A move's gain: "+6.2 xP", shimmering while the full plan checks an edit (the plan before it: no ≈, the owner,
   *  2026-10-26: "fix so every squad is solver squad"); no weak word after it (the user,
   *  2026-10-18: "remove 'negligible' … and similiar crap"); blue as every forecast number, its sign its direction, never a
   *  verdict's green or red (ui.js xpGain; the user, 2026-10-22, after v1.3.68: worth doing is the solid + alone). */
  const gainOf = (cmp, ap = false) => h('span.ah-bg.m-num', { class: { 'm-pending': ap } }, xpGain(cmp.delta, 'span', null, true));
  /** A Why sheet's headline (openWhy, openPlanWhy): "GW8 · +5.6 xP over GW8–11 vs rolling", its gain forecast points
   *  blue with "xP" as the rows' (ui.js xpGain; the user, 2026-10-22, after v1.3.68), "points" said for the unspoken
   *  marker; `rest` its words after it. */
  const whySub = (g, d, rest) => [`GW${g} · `, xpGain(d), h('span.sr-only', null, ' points'), ` ${rest}`];
  /** A number's cell on a line (the week line's, a transfer row's): "· …" while it solves (`wait`), "· 0:12" once its
   *  checks have taken LATE_S (waitClock's `late`; the clock in "checking…"'s place: both beside the words cut
   *  "1 transfer" to "1 tran…" on a 390 px phone, the review of the first-use fixes, 2026-10-21), else its gain (gainOf), else nothing; and as its label says it ("checking…",
   *  "about +6.2 points vs rolling": `vs`, true for rolling, else its words, "vs your plan": decision K; the user,
   *  2026-10-22: one baseline phrase, VoiceOver reads it "versus"). */
  const numOf = (wait, cmp, ap) => (wait ? h('span.ah-bq2', { 'aria-hidden': 'true' }, waitClock('', { late: true, pre: ' · …', sep: ' · ' }) ?? [' · ', COPY.pairChecking]) : cmp ? gainOf(cmp, ap) : null);
  const numSaid = (wait, cmp, ap, vs = false) => (wait ? COPY.pairChecking : cmp ? `${ap ? 'about ' : ''}${fmt.signed(cmp.delta)} points${vs ? ` vs ${vs === true ? COPY.planVsRoll : vs}` : ''}` : '');
  /** …a checked choice's number as a plate, a place's card, a token and a handle say it, against what its row counts
   *  (choiceVs: "vs your plan" in a week of yours, decision K; none off the hold, as before). */
  const plNumSaid = (P, pl) => numSaid(false, pl.cmp, false, pl.vsRoll && choiceVs(P, pl));
  /** The −4 of n hits beside a line's words (the week line's, a transfer's, a choice's), quiet, and as its label says it. */
  const hitTag = (n) => (n ? h('small.ah-hit.m-hit.m-num', { 'aria-hidden': 'true' }, `${MINUS}${E.HIT_COST * n}`) : null);
  const hitSaid = (n) => (n ? `, a ${MINUS}${E.HIT_COST * n} hit included` : '');
  /** What GW g's suggested plans count against (the plans heading, a row, its Why sheet, a place's bar): rolling once the
   *  week's roll plan is in (plansOf `ref`), your plan then in a week of yours (yoursAt, its rows' `vsMine`: decision K;
   *  the owner, 2026-10-25: "Gain vs rolling" under Cherki's place in a week of his transfer), none while it solves
   *  (`refWait`: the user, 2026-10-21, fix all (first-use proposal #8): it read "vs no transfers", then "vs rolling"),
   *  else your plan (COPY.planVs). → its words | null */
  const plansVs = (P, g) => { const L = plansOf(ctx, P, g); return L.ref ? (yoursAt(weekOf(P, g)) ? COPY.planVs(true) : COPY.planVsRoll) : L.refWait ? null : COPY.planVs(mineAny(P)); };
  /** B47: a row's main part is its button (its Why sheet), never the whole row: inside a row that was one button
   *  VoiceOver reached none of its own controls, so its +, ×, other buys and "+n" are controls of their own beside it.
   *  The row keeps its tap on its empty part and its gestures. Spoken `label` ("…; shows why"), Enter / Space; `row`
   *  keys it for the focus kept across a redraw (render: `[data-row]`). */
  const whyPart = (label, why, row) => ({
    role: 'button', tabindex: '0', 'aria-haspopup': 'dialog', 'aria-label': label, dataset: { row },
    onKeydown: (e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); why(); } },
  });


  /**
   * A transfer, a row of the Week sheet: "Ndiaye → Groß +6.2" (A2: its gain in the order the week's moves were made, rowGains, so a hit is the extra
   * move's and its row says "−4"; GW A's one move against rolling off the hold, M4; waiting while the full plan checks an
   * edit, the plan before it as it was, no × on a move you just removed; its other buys for the same sale are in its Why sheet and among
   * the week's suggested plans, ownAltsOf), the week's facts under the week's first, a funding sale's
   * "Frees £1.4m so Saka fits" under it; a small grey × (28 px, a 44 px target) on every row takes it off at once, never
   * asking (removeMove, Undo: a funded buy goes alone, its funding sales kept as transfers of their own; a sale whose money
   * other buys needed takes them with it; the toast names either); on a move Forkcast made (no rule of yours behind it)
   * the × keeps the player it sells in that GW instead, and is named so, "Keep Scott in GW8", the row a quiet "by Forkcast"
   * after its gain (B33; the user, 2026-10-11: "+0.3 negligible Forkcast" read as one phrase); GW A under way's has no ×
   * (frozenAt). Its main part is the row's button, as is a tap on its
   * empty part: its Why sheet (openWhy; whyPart, B47). Its surface keeps the move row's swipe (wireMoveRow: a swipe
   * left rules out the buy, its backdrop "Not Groß · GW6", vetoBack); no long press (the user's 5b, 2026-10-19: a
   * transfer moves to another week only through its Why sheet's When line; the switcher is under the sheet).
   */
  /** B95: a transfer row's money ties, its second line: the week's bank on its first row when short (bankWarn) and a
   *  funding tie at both ends (the sale "Frees £x so B.Fernandes fits", the buy it pays for "with Haaland → Thiago": every
   *  sale of the week that funds it). No "Pays for B.Fernandes in GW8" since the owner, 2026-10-26: it named the buys the
   *  phone counted × would take along (paysFor, dependentBuys), and × takes its own rule alone. → nodes ([] when none) */
  function rowTies(P, w, m, i) {
    const g = w.gw, nm = P.L.name, rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const f = fundingOf(P, g, m);
    const funding = f && f.fund.move.out === m.out && f.fund.move.in === m.in;
    const funders = f && !funding ? w.moves.filter((x) => { const fx = fundingOf(P, g, x); return fx?.main.move.in === m.in && fx.fund.move.out === x.out && fx.fund.move.in === x.in; }) : [];
    return dotted([
      i === 0 ? bankWarn(P, w) : null,
      funding ? COPY.funds(fmt.money(freedBy(rg?.withIt, g, m)), nm(f.main.move.in)) : null,
      funders.length ? COPY.fundedBy(funders.map((x) => `${nm(x.out)} → ${nm(x.in)}`)) : null]);
  }
  function xferRow(P, w, m, i) {
    const g = w.gw, nm = P.L.name;
    const ap = ap0(P, g);
    // a move you removed, still on the plan before it while the solver plans without it or once it found no plan without
    // it (removedAt, B129; its rule gone): no second × (it would keep the player it sold); the status row's Removes and
    // the toast's Undo say what to do
    const gone = removedAt(P, g).has(`${m.out}>${m.in}`) && !pinOfMove(P, { ...m, gw: g });
    // (no number in a week of two or more: the week's is on its line and the sheet's header, shareWeek)
    const shares = shareWeek(w);
    const vr = rollOf(P, w), n = moveNum(P, w, m), wait = !shares && n.wait;
    const rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const head = shares ? null : n.cmp ?? { delta: 0, label: 'coin' };
    const ties = rowTies(P, w, m, i);
    const sub = ties.length ? ties : null;
    // the first row's first-use hint (LEARN_KEY 'row'), only on its empty second line (a row with ties keeps them) and
    // only where its swipe acts (wireMoveRow below); aria-hidden as every second line, the Why sheet's Not being the
    // swipe's twin
    const learnRow = i === 0 && !sub && !gone && P.editable && !frozenAt(P, g) && !S.learnt.has('row');
    const hit = !vr && rg?.hit ? rg.hit : 0;
    const canX = !frozenAt(P, g) && P.editable && !gone;  // a frozen week's or a live GW A's transfer is FPL's: no ×
    const forkcast = canX && !pinOfMove(P, { ...m, gw: g });  // Forkcast's move: its × is a Keep (removeMove)
    const what = `${nm(m.out)} to ${nm(m.in)}`;
    const label = `${what}${head || wait ? `, ${numSaid(wait, head, ap, !!vr)}` : ''}${hitSaid(hit)}${forkcast ? ", Forkcast's move" : ''}${sub ? `. ${textOf(sub)}` : ''}; shows why`;
    // its other buys are among the week's suggested plans (plansOf), never on its line: "· 2 more" there read as three
    // transfers made (the user, 2026-10-10)
    const why = () => openWhy(P, g, m);
    const main = [
      h('span.ah-bn', null, h('s', null, `${nm(m.out)} → `), h('b', null, nm(m.in))),
      hitTag(hit), numOf(wait, head, ap),
      forkcast ? h('small.ah-bk', { 'aria-hidden': 'true' }, 'by Forkcast') : null];
    // B47: the main part is the row's button (whyPart), the × a control of its own; the second line is in its label
    const fg = h('div.ah-fg.ah-btgt', { onClick: why },
    h('span.ah-bt', whyPart(label, why, `x${g}:${m.out}>${m.in}`), main),
    sub ? h('span.ah-bs', { 'aria-hidden': 'true' }, sub) : learnRow ? h('span.ah-bs.ah-learn', { 'aria-hidden': 'true' }, COPY.hintRow(nm(m.in))) : null,
    canX ? h('button.ah-x', {
        type: 'button', 'aria-label': forkcast ? COPY.keepIn(nm(m.out), g) : COPY.placeRemoveSaid(nm(m.out), nm(m.in)),
        onClick: (e) => {
          e.stopPropagation();
          // at once, with Undo; a sale whose money a buy needed takes that buy with it; Forkcast's move: a Keep (removeMove)
          removeMove(ctx, { ...m, gw: g });
        },
      }, glyph('x')) : null);
    // B31 / B61's hook: the transfer a + just made, tinted once (S.tint, this first draw only)
    const tint = !!S.tint?.some((x) => Number(x.out) === Number(m.out) && Number(x.in) === Number(m.in));
    const row = h('div.ah-mrow', { class: { 'm-shimmer': tint, once: tint }, dataset: { out: m.out, in: m.in, gw: g } }, vetoBack(P, { in: m.in, gw: g }), fg);
    if (P.editable && !frozenAt(P, g)) wireMoveRow(row, fg, { ...m, gw: g });
    return row;
  }
  /** The week's facts (factsWords) as the week line draws them, each whole (.ah-fact: where they take two lines, the
   *  Week sheet's, the line breaks between them, never inside "3 FT in GW10"), joined by " · ": rollFacts' and fitBlock's
   *  probe's; `next`: the last, next GW's free transfers, with its " · " (.ah-fnext), the one the week line leaves to
   *  the Week sheet where it doesn't fit (fitFacts). */
  const factSpans = (facts, next = false) => facts.map(([t], i) => (next && i && i === facts.length - 1
    ? h('span.ah-fnext', null, ' · ', h('span.ah-fact', null, t)) : [i ? ' · ' : null, h('span.ah-fact', null, itbNode(t))]));
  /** A bank's words with FPL's "ITB" its own (.ah-itb), the part the week line lets go where even the bank alone can't
   *  stay whole (fitFacts: a £10m bank at 320 px; the v1.3.75 review #6/#16), the amount never. */
  const itbNode = (t) => (typeof t === 'string' && t.endsWith(COPY.itb('')) ? [t.slice(0, -COPY.itb('').length), h('span.ah-itb', null, COPY.itb(''))] : t);
  /** A4: no transfer in the viewed GW in words (the week line's): who left the week empty (emptyHead, B52: "Rolling",
   *  "Forkcast rolls GW8") over this week's free transfers, its bank and what rolling them makes next
   *  week (weekFacts: "1 FT · £0.5m ITB · 2 FT in GW7"), or a short bank's words in its bank's place, after them (bankWarn).
   *  Decision 6 (the user, 2026-10-11): no "· moving +2.1 over rolling" (the old forkOf): the choices on the pitch are
   *  that fork. The head the week's status beside the goal (statusTok: "Rolling", "Rolling is best" once settled with
   *  nothing better, `best`; "Rolling ✓" under your Roll). → {head, rest (nodes: next GW's free transfers the strip may
   *  leave to the Week sheet, fitFacts), said} */
  function rollFacts(P, w, best = false) {
    const g = w.gw;
    const ink = inkAt(ctx, P, g), hold = !!P.mem?.hold;
    // this week's free transfers first, then what rolling them makes next week (the reviews, 2026-10-08: "2 FT in GW7"
    // alone never said how many you have now; the last GW of the window has no next week to name), the bank between
    // them (the user, 2026-10-21: "2 FT · £0.8m ITB · 3 FT in GW10")
    const facts = weekFacts(P, w), bank = bankWarn(P, w);
    // while an edit is checked, a later week still drawn from the plan before it claims no choice of Forkcast's ("No
    // transfers", not "Forkcast rolls GW8": the check may re-plan it; review 5, 2026-10-12)
    const stale = !hold && P.healing && P.approx.has(g) && !ap0(P, g);
    return {
      head: emptyHead(g, { ink, hold, off: gwMode(P, g) === 'roll' || stale, lock: rollingAt(P, g), best }),
      // (next GW's the last of them in every GW but the window's last: weekFacts)
      rest: [factSpans(facts, g < P.end), bank ? [' · ', bank] : null],
      // B92: read out with FPL's codes in full ("1 free transfer, £0.5 million in the bank, 2 free transfers in gameweek 7")
      said: [...facts.map(([, s]) => s), bank && textOf(bank)].filter(Boolean).join(', '),
    };
  }
  /** The week line's doors at its right end, each behind a hairline, its full height its target, its sheet for GW g:
   *  Chips… (the user, 2026-10-13: "add 'chip..' button next to 'bring in..' every where"; sheets/chips.js; opening it is
   *  the chips hint learnt, the user: "why this hint never dissappears like subs / captains are") and Bring in… (the
   *  Wish sheet). */
  const door = (P, cls, row, text, label, onClick) => h(`button.ah-lnk.ah-door${cls}`, { type: 'button', disabled: !P.editable, 'aria-haspopup': 'dialog', 'aria-label': label, dataset: { row }, onClick }, text);
  /** The Chips sheet for GW g (the week line's Chips…). */
  const openChips = (g) => { learn('chips'); ctx.askChips?.(g); ctx.openSheet('chips', { gw: g }); };
  const chipsDoor = (P, g) => door(P, '.ah-chips', 'chips', COPY.chipsDoor, COPY.chipsSaid(g, weekOf(P, g)?.chip ?? null), () => openChips(g));
  const bringDoor = (P, g) => door(P, '.ah-bring', 'bring', COPY.bringInShort, `${COPY.bringInSheet} in GW${g}`, () => ctx.openSheet('wish', null, { gw: g }));
  /** The doors as fitBlock's probe and the first week's baking line draw them: their place, no control. */
  const doorStubs = () => [h('span.ah-lnk.ah-door.ah-bring', { 'aria-hidden': 'true' }, COPY.bringInShort), h('span.ah-lnk.ah-door.ah-chips', { 'aria-hidden': 'true' }, COPY.chipsDoor)];
  /** N7: a Free Hit or Wildcard week's change: the shirt, "Out → In" and the prices; no gain (the chip remakes the squad:
   *  no one change has its own) and no Why sheet. Where the week can change, a transfer row's × and left swipe (the
   *  user, 2026-10-14: "why swipes and x not work in wildcard transfers"): × keeps the player it sells in that GW
   *  (removeMove: a change of yours goes), a left swipe rules out the player it buys there (vetoRow). A row of the Week
   *  sheet, under the chip's note (COPY.chipWeek). `read`: a Wildcard or Free Hit choice's Why sheet's (squadChanges;
   *  the user, 2026-10-21: fix all (first-use proposal #7)), no × and no swipe, a player your Keep holds there his name
   *  over "kept: your rule". */
  function changeRow(P, w, m, read = false) {
    const nm = P.L.name, g = w.gw;
    const can = !read && !frozenAt(P, g) && P.editable;
    const forkcast = can && !pinOfMove(P, { ...m, gw: g });
    const fg = h('div.ah-fg', null, h('span.mk', { 'aria-hidden': 'true' }, shirtOf(P.L, m.in, 28)),
      h('span.mt', null, m.kept ? [h('span.a', null, nm(m.in)), h('span.b', null, COPY.keptRule)]
        : [h('span.a', null, h('s', null, `${nm(m.out)} → `), nm(m.in)), h('span.b.m-num', null, `${priceOf(P, m.out)} → ${priceOf(P, m.in)}`)]),
      can ? h('button.ah-x', {
        type: 'button', 'aria-label': forkcast ? COPY.keepIn(nm(m.out), g) : COPY.placeRemoveSaid(nm(m.out), nm(m.in)),
        onClick: (e) => { e.stopPropagation(); removeMove(ctx, { ...m, gw: g }); },
      }, glyph('x')) : null);
    const row = h('div.ah-mrow.sq', { class: { kept: !!m.kept }, dataset: { ...(m.kept ? {} : { out: m.out }), in: m.in, gw: g } }, can ? vetoBack(P, { in: m.in, gw: g }) : null, fg);
    if (can) wireMoveRow(row, fg, { ...m, gw: g });
    return row;
  }
  /** "£4.5m" with its club: "CRY £4.5m". */
  const priceOf = (P, id) => { const x = P.L.price(id); return `${P.L.club(id) ?? ''} ${x == null ? '' : fmt.money(x)}`.trim(); };

  /** B31: after a +, the choices re-flow (the list re-sorts, the pitch's tabs move): a tap within ADD_HOLD_MS of that
   *  redraw lands on whatever moved under the finger (ui.js, Birman s50: nothing changes under a finger already
   *  moving), so it is ignored; never one in an open place, whose order is held while it is open (drawPlace: the
   *  place's other buys landing re-sorted the week, askPlace, and its Swap went unanswered). Every + of a choice goes
   *  through it; one whose edit was made (`act()` true) leaves its `moves` for xferRow's one tint (S.tint). */
  const ADD_HOLD_MS = 500;
  const addOnce = (e, act, moves = []) => {
    e.stopPropagation();
    if (S.addAt && S.flowAt >= S.addAt && Date.now() - S.flowAt < ADD_HOLD_MS && !e.target?.closest?.('.ah-place')) return;
    S.addAt = Date.now();
    if (act()) S.tint = moves;
  };

  /** Whether choice pl is green with a solid + (a Week sheet row, a place's dealt card, its Why sheet's Take filled):
   *  exactly where the pitch lights it (weekModel's `shown`: litShown; the user, 2026-10-22: one rule, the Why sheet's
   *  Take and a place's colours followed plPays while the Week sheet followed the pitch). `M`: the week's model, the one
   *  drawn by default (S.M). */
  const litPays = (pl, M = S.M) => !!pl && !!M?.shown.has(pl);
  /** A suggested plan's row key: its GW-g choice (planRow's data-plan: a Week sheet row's, a tab's, a token's). */
  const planKey = (g, pl) => `${g}:${pl.choice.moves.map((m) => `${m.out}>${m.in}`).join(',')}|${JSON.stringify(pl.choice.chips)}`;
  /** A choice's words wherever it is drawn (a Week sheet row, a tab, a token, a place's header): `head` ("GW8 Saka →
   *  Palmer", what its + takes back after it), `label` (its spoken line: its number over the weeks it counts, against
   *  what; or what it waits for; a move you took off this session "removed by you" after its head: plansOf `removed`,
   *  B129), `wait` (what its solve waits for, its failure's reason; null once ready) and `pays` (plPays: its + solid, its
   *  number green). */
  function planSaid(P, g, pl) {
    const { now, adds, back } = planBack(P, g, pl);
    const base = planWeeks(P, { ...pl.choice, moves: adds, hits: pl.hits }, g).find(([x]) => x === g)?.[1] ?? (now.length ? `GW${g}` : COPY.planRoll(g));
    const head = back ? `${base} ${back}` : base;
    const wait = pl.state === 'ready' ? null : pl.state === 'failed' ? failedWords(P, pl).row : { flight: COPY.pairChecking, heal: COPY.pairAfterEdit }[pl.wait] ?? COPY.pairWaiting;
    const who = pl.removed ? `${head}, ${COPY.removedByYou}` : head;
    // the roll's own row is what the others count against: no number (the user, 2026-10-19: "Gain over rolling"); a
    // choice worth no less a week later says so after it (earlyWords)
    const ew = earlyWords(pl);
    const label = wait ? `${who}: ${wait}` : pl.refRow ? `${who}, ${COPY.planRefSaid}`
      : `${who}, ${fmt.signed(pl.cmp.delta)} points over ${span(P.gws.filter((x) => x >= g))} vs ${pl.vsRoll ? choiceVs(P, pl) : plansVs(P, g)}${ew ? `, ${ew}` : ''}`;
    return { head, label, wait, pays: !wait && plPays(pl) };
  }
  /** A choice's + (a Week sheet row's, a token's): GW g alone taken (planTake, addPlan) through addOnce; `then` once it
   *  changed the plan (the Week sheet closes, so the change lands on the pitch in view). */
  const takePlan = (P, g, pl, then = null) => (e) => addOnce(e, () => { const ok = addPlan(ctx, g, pl); if (ok) then?.(); return ok; }, planTake(P, g, pl).own);
  /**
   * A suggested plan (plansOf; the user, 2026-10-11: "make him to suggest plans, not just players"), a row of the Week
   * sheet: its GW-g choice on its line, "GW7 Kayode → Vuskovic" (several joined by " + "; none: "GW7 roll"; "GW8 Free
   * Hit"), the −4 it takes there, and its number, the list's order (plansOf: its plan against the roll's, Forkcast's
   * later moves on both sides; the roll's own row no number, what the others count against; green only when it beats
   * the noise: plPays). Nothing of its later weeks (the user, 2026-10-12: "show only this week moves … not showing 'best
   * after'"): a small outlined + takes GW g alone (takePlan: your exact transfers there or its chip, one Undo; every
   * listed row changes something), and closes the sheet so the change lands on the pitch in view (`closes`); the row
   * opens its Why sheet (openPlanWhy). While its own solve runs: its choice and what it waits for, the pair's words ("·
   * checking…" its solve, "· waiting" the slot, "· waiting for your edit's check"), no number, its + off (B17); a solve
   * that failed with no road plan of the choice: its choice and why (COPY.planFailed), no number, its + off. No swipe
   * and no long press. Drawn under its week's own tab, the row leaves the week out (the user, 2026-10-18: "why need to
   * repeat gw8 if we already chose gw8"); its label, its + and the +'s toast keep it.
   */
  function planRow(P, g, pl, { shared = null, closes = false, lit = null, best = null } = {}) {
    const nm = P.L.name;
    const key = planKey(g, pl);
    // `shared`: the "instead of …" every listed row's + takes back, said once on the Week sheet's plans heading
    const { chipNow, now, adds, back } = planBack(P, g, pl);
    const s = planSaid(P, g, pl);
    const own = back && back !== shared ? back : '';
    const shown = planWeeks(P, { ...pl.choice, moves: adds, hits: pl.hits }, g, false).find(([x]) => x === g)?.[1] ?? (now.length ? '' : COPY.planRoll(null));
    const tail = !own ? null : shown || adds.length ? ` ${own}` : capFirst(own);
    // the first line wraps between its moves, never inside one, and never cuts one (the plans reviews, 2026-10-11: a
    // second GW-g buy the + makes sat in the ellipsis; m-ahead.css .ah-bplan); quiet after them, a choice worth no less a
    // week later, "· as good in GW9" (earlyWords; the user, 2026-10-21: listed, never lit), and a move you took off this
    // session, "· removed by you" (B129; the user, 2026-10-21: fix the known issues)
    const ew = earlyWords(pl);
    // (its moves one sentence, "Cunha → Palmer, Neto → Tavernier", as the pitch's line says it: design 1026e)
    const line = [adds.length ? adds.flatMap((m, i) => [i ? ', ' : null, h('span.ah-pmv', null, h('s', null, `${nm(m.out)} → `), nm(m.in))]) : shown,
      tail ? h('span.ah-bq2', null, tail) : null, ew ? h('span.ah-bq2', null, ' · ', ew) : null, pl.removed ? h('span.ah-bq2', null, ' · ', COPY.removedByYou) : null];
    // its take worded as everywhere else (design 1028d K1: "Swap", "Swap both", a Roll's "Roll", a chip alone's "Take"),
    // the one mark (.m-swap), ink for the week's best, green where it pays, outlined where it doesn't; never a + (Bring
    // in's opened a player's weeks: R9, R12)
    const word = COPY.takeWord(adds.length, !adds.length && !!pl.choice?.chips?.[g]);
    if (s.wait) {
      const off = h('button.ah-add.m-swap.quiet', { type: 'button', disabled: true, tabindex: '-1', 'aria-hidden': 'true' }, word);
      return h('div.ah-brow.ah-bpair.ah-bplan.solving', { role: 'status', dataset: { row: 'plan', plan: key }, 'aria-label': s.label },
        h('span.ah-bt', { 'aria-hidden': 'true' }, h('span.ah-bn', null, line, h('span.ah-bq2', null, ' · ', s.wait))), off);
    }
    const hit = chipNow ? null : hitTag(pl.hits[g]);
    // a solid + exactly where the pitch lights it (`lit`: weekModel's litShown, litPays; the user, 2026-10-22: one rule),
    // its Why sheet's Take filled the same, the others an outlined +; the number blue in every row (gainOf; the user,
    // 2026-10-22, after v1.3.68: the + alone says worth doing); the Roll of a week you roll no + at all (rollOnly)
    const pays = lit ?? litPays(pl);
    const why = () => openPlanWhy(P, g, pl, pays);
    const gain = pl.refRow ? null : gainOf(pl.cmp);
    const top1 = best ?? S.M?.lit?.move === pl;
    const add = rollOnly(pl) ? null : h('button.ah-add.m-swap', {
      type: 'button', disabled: frozenAt(P, g), dataset: { add: `plan:${key}` }, class: { best: top1, quiet: !pays && !top1 }, 'aria-label': COPY.planTake(s.head),
      onClick: takePlan(P, g, pl, closes ? () => S.week?.sheet.close() : null),
    }, word);
    // B47: the main part is the row's button (whyPart), the + a control of its own
    return h('div.ah-brow.ah-bpair.ah-bplan.ah-btgt', { dataset: { gw: g, plan: key }, onClick: why },
      h('span.ah-bt', whyPart(`${s.label}; shows why`, why, `plan:${key}`), h('span.ah-bn', null, line), hit, gain), add);
  }
  /** A plan's Why sheet: the two plans the row's number compares side by side (under the hold its plan and the roll's,
   *  Forkcast's later moves in both: plansOf `vsRoll`; in a week of yours its plan and yours: `vsMine`, decision K; the roll's own row's plan against the best other row's, `vsBest`; else what
   *  its + gives against your plan), titled with its GW-g choice alone (the user, 2026-10-12: only this week's moves; its
   *  −4 among what else it changes, the user 2026-10-19: one fact once), as openWhy is laid out: its buttons (the row's
   *  own, "Take it", said "Take GW7 Scott → Dewsbury-Hall": planTake, filled as the row's + is solid: litPays, `lit`; a "Not Groß · GW6" per GW-g
   *  buy: B19 / B99), each GW-g move's two players side by side (none for a chip's squad or a roll), then what else it
   *  changes (each move's whyFacts on the week alone, once each, and what your total moves by when its number says
   *  another: COPY.planAdds; for the Roll row of a week you roll, that your plan makes no transfer there already, and
   *  no Take: COPY.rollAlready, rollOnly; the first-use run, 2026-10-21: "Take GW8 roll" beside "No transfers yet"; the
   *  user, 2026-10-22: "+" only where it changes something). The user, 2026-10-22 (one baseline per sheet): a move's
   *  miss case set on the header's number against rolling (whyFacts `head`), a Wildcard's or Free Hit's chip spent and
   *  when the next comes (COPY.chipUses). The user, 2026-10-21: fix all (first-use proposals #3 and #7), read-only, no buttons:
   *  what its number counts after its week on both sides, rolling's first (countedAfter: none where neither moves later),
   *  and a Wildcard's or Free Hit's changes in changeRow's rows with no × or swipe (squadChanges; never on the pitch: the
   *  try-on, rejected 2026-10-19). */
  function openPlanWhy(P, g, pl, lit = litPays(pl)) {
    const nm = P.L.name;
    const without = planBaseline(ctx, P, g);
    const gws = P.gws.filter((x) => x >= g);
    const moved = (x) => (SQUAD_CHIPS.has(x.chips?.[g]) ? [] : x.moves.filter((m) => m.gw === g));
    const titleOf = (x) => planWeeks(P, { ...x, moves: moved(x), hits: {} }, g, false).find(([y]) => y === g)?.[1] ?? COPY.planRoll(null);
    const now = moved(pl);
    const best = pl.refRow && pl.vsBest ? pl.best : null;
    // in a week of yours its plan against yours, Forkcast's later moves in both (plansOf `vsMine`, the list's `mine`:
    // decision K; the owner, 2026-10-25, "compare + poitns not to rolling now but to transfer made"), where vsMine is
    // that; else (your chip week, a Wildcard row) what its + gives against your plan, as below
    const mine = pl.vsMine && pl.vsMine !== pl.alone && !pl.refRow ? plansOf(ctx, P, g).mine : null;
    const [ev, other, cmp, vs, short] = best ? [pl.bestFrom ?? pl.fullEv, best.fullEv, pl.vsBest, titleOf(best), titleOf(best)]
      : mine ? [pl.fullEv, mine.ev, pl.cmp, COPY.planVs(true), COPY.planVs(true)]
        : pl.vsRoll && !pl.refRow && !pl.vsMine ? [pl.fullEv, pl.refEv, pl.cmp, COPY.planVsRoll, COPY.planRoll(null)]
          : [pl.ev, without, pl.alone ?? pl.cmp, COPY.planVs(!!pl.vsMine || mineAny(P)), COPY.planVs(!!pl.vsMine || mineAny(P))];
    const d0 = draftOf(ctx);
    // (the user, 2026-10-22: one baseline per sheet): a miss set on the header's number where it counts against rolling
    // (onBase), never against your plan under it; a Wildcard or Free Hit says the chip it spends and when the next comes
    const onHead = best || mine || (pl.vsRoll && !pl.refRow && !pl.vsMine) ? cmp.delta : null;
    const sqChip = SQUAD_CHIPS.has(pl.chips?.[g]) ? pl.chips[g] : null;
    // why its moves go together, the solver's own (design 1026e "line"; the owner's "no hardcoded logic whatsoever"):
    // its solved road's own GW-g squad (pl.road, never the phone's composed pl.ev) holds a club's most with a buy, a sale of the same club its other move ("Neto's sale
    // makes room: Palmer is your 3rd CHE player"); never the phone's sums (fitOf), no solve asked
    const rw = (pl.road?.weeks || []).find((x) => Number(x.gw) === g), clubs = clubCounts(P.L, rw ? ids([...(rw.xi || []), ...(rw.bench || [])]) : []);
    // (over the moves it adds to yours, planBack's `adds`: a take-back's reason is never one of your own transfers')
    const { adds: added, back: undone, taken } = SQUAD_CHIPS.has(pl.chips?.[g]) ? { adds: [], back: '', taken: [] } : planBack(P, g, pl);
    const several = added.length > 1 || (!!undone && added.length > 0);
    const room = added.length < 2 ? [] : added.flatMap((m) => {
      const club = P.L.club(m.in), by = added.find((o) => o !== m && P.L.club(o.out) === club);
      return club && by && clubs.get(club) === E.MAX_PER_CLUB ? [COPY.planRoom(nm(by.out), nm(m.in), E.MAX_PER_CLUB, club)] : [];
    });
    const facts = [...new Set([...now.flatMap((m) => whyFacts(ctx, P, g, m, pl.ev, without, { drafts: [pl.taken ?? pl.draft, d0], head: onHead })),
      ...(sqChip ? [COPY.chipUses(chipName(sqChip), chipBack(P, g))] : []),
      ...(pl.alone && !pl.rolls && Math.abs(pl.alone.delta - cmp.delta) >= 0.05 ? [COPY.planAdds(pl.alone.delta)] : []),
      ...(pl.rolls ? [COPY.rollAlready(g)] : []), ...rollFt(P, g, pl)])];
    const head = planWeeks(P, { ...pl, moves: now }, g).find(([x]) => x === g)?.[1] ?? COPY.planRoll(g);
    // (its moves one sentence, as its line on the pitch and in a place says them: design 1026e "line")
    // (each move unbroken, "Cunha → Palmer," never split inside a move or a name)
    const title = several ? `${added.map((m) => `${nm(m.out)} → ${nm(m.in)}`.replace(/ /g, '\u00a0')).join(', ')}${undone ? ` ${undone}` : ''}` : titleOf(pl);
    // the two plans' later weeks, rolling's (else what it counts against) first
    const later = countedAfter(P, g, best ? [[COPY.countedRoll, ev], [short, other]]
      : pl.vsRoll && !pl.refRow && !pl.vsMine ? [[COPY.countedRoll, other], [title, ev]] : [[short[0].toUpperCase() + short.slice(1), other], [title, ev]]);
    // what its + gives in GW g (pl.ev, paired as the Week sheet will pair it once taken: takenKeep), a player your Keep
    // holds there "kept: your rule"
    const sq = SQUAD_CHIPS.has(pl.chips?.[g]) ? squadChanges(P, g, pl.ev, takenKeep(P, g, pl)) : [];
    const swapLook = S.M?.lit?.move === pl ? 'best' : lit ? 'pays' : 'quiet';
    ctx.openSheet('why', {
      a: { road: roadOfEv(ev, g), label: title },
      b: { road: roadOfEv(other, g), label: short, short },
      // (its players each a link to his card where the title names its moves: movesTitle)
      title: several ? movesTitle(P, g, added, { nb: true, tail: undone }) : now.length === 1 && title === `${nm(now[0].out)} → ${nm(now[0].in)}` ? movesTitle(P, g, now) : title,
      sub: whySub(g, cmp.delta, `over ${span(gws)} vs ${vs}`), gw: g, reason: room.join('. ') || null,
      // each GW-g move's two players: a move in place of your buy of the same seller (planBack's `taken`), its buy against
      // YOURS it replaces, each at his buy price (sheets/why.js `yours`; design 1027b: the seller leaves in both plans,
      // so his column answered nothing; the sheet's number is against your plan); any other, its buy against its sale
      pairs: now.map((m) => {
        const t = taken.find((y) => Number(y.out) === Number(m.out) && Number(y.in) !== Number(m.in));
        return t ? { ...pairOf(pl.ev, g, m), out: t.in, sell: pairOf(without, g, t).buy, yours: true } : pairOf(pl.ev, g, m);
      }), facts, later,
      changes: sq.length ? { head: COPY.nChanges(sq.filter((m) => !m.kept).length), rows: sq.map((m) => changeRow(P, { gw: g }, m, true)) } : null,
      // (a choice of several moves: its one take named for what it does, "Swap both", and nothing else: the sheet says
      // why, its "Not …" vetoes are each player's own sheet's; the owner's judge of design 1026e)
      // (its take the one mark, worded as its row's and its place's: "Swap", "Swap both", "Roll"; ink the week's best,
      // green where it pays, outlined where not: design 1028d K1, the owner, 2026-10-28)
      acts: frozenAt(P, g) ? null : several ? [{ label: COPY.swapGo(added.length), said: COPY.planTake(head), fill: lit, swap: swapLook, act: () => addPlan(ctx, g, pl) }]
        : [...(rollOnly(pl) ? [] : [{ label: COPY.takeWord(now.length, !now.length && !!pl.chips?.[g]), said: COPY.planTake(head), fill: lit, swap: swapLook, act: () => addPlan(ctx, g, pl) }]), ...now.map((m) => notAct(P, g, m))],
      // (its buttons' edits, solved ahead while it is open: presolve)
      presolve: frozenAt(P, g) ? null : [...(rollOnly(pl) ? [] : [{ kind: 'take', gw: g, run: () => addPlan(ctx, g, pl) }]), ...(several ? [] : now.map((m) => ({ kind: 'veto', gw: g, run: () => veto(ctx, { ...m, gw: g }) })))],
    });
  }
  /** N7: the free transfers a Free Hit week keeps for the week after it: the plan's own count there, else FPL's
   *  roll of an unused week (engine.nextFt). */
  const ftAfter = (P, w) => weekOf(P, w.gw + 1)?.ft ?? E.nextFt(w.ft ?? 1, 0, E.ftGrant(P.season, w.gw + 1));

  /** Your week's transfers against rolling (weekRollOf): the week line's number (weekGain); a week's one move's row and
   *  Why sheet (rollOf: the checker, 2026-10-09, the row "+2.3 against rolling", its Why "+7.5 vs rolling"). */
  const weekRoll = (P, w) => weekRollOf(ctx, P, w);
  const rollOf = (P, w) => (w.moves.length === 1 && !squadWeek(w) ? weekRoll(P, w) : null);
  /** A week of two or more transfers (no Wildcard or Free Hit): its number is the week's against rolling alone (the
   *  week line's, the Week sheet's header, "Yours" in each of its buys' places: weekGain), never a share per move (the
   *  user, 2026-10-22, decided "No row numbers": rowGains' shares summed to 21.7 under a +5.8 line); its rows and their
   *  Why sheets list the moves and their facts. */
  const shareWeek = (w) => w.moves.length > 1 && !squadWeek(w);
  /** Transfer m of week w's number: the week's against rolling where it is the week's one (rollOf), else its own share
   *  (rowGains, A2) | null. Its Week sheet row's and, on the pitch, its buy's place's "Yours +0.4". */
  const moveGain = (P, w, m) => (m ? rollOf(P, w) ?? rowGains(ctx, P, w).get(`${m.out}>${m.in}`)?.cmp ?? null : null);
  /** …as shown: none while the week's roll plan or your choice still solves (`wait`: "checking…", never the week alone in
   *  its place), `ap` the week waiting on an edit's check (shimmering). */
  const moveNum = (P, w, m) => { const vr = rollOf(P, w); return { cmp: moveGain(P, w, m), wait: !vr && rollPending(P, w), ap: ap0(P, w.gw) }; };
  /** …still to come: the week's roll plan or your own choice's still solves (plansOf `pending`), so the week line and a
   *  week's one move's row say "checking…", never the week alone in its place, to change in place once they land (the
   *  plans review, 2026-10-19). */
  const weekPending = (P, w) => !!w.moves.length && !ap0(P, w.gw) && !!plansOf(ctx, P, w.gw).pending;
  const rollPending = (P, w) => w.moves.length === 1 && !squadWeek(w) && weekPending(P, w);
  /** B3 (choice_bets Part 4 §1): a roll of GW g as a move there is measured against it, in words. When the plan against
   *  it (`ev`, an estimate from GW g) makes no transfer after GW g, the free transfer the roll saves is never spent, and
   *  moving now looks better than against a roll that spends it: "rolling, no later transfer"; else "rolling". The Why
   *  sheet's sub says so. */
  const rolling = (P, g, ev) => (!ev?.gws.some((x) => x.gw > g && x.moves.some((y) => y.ok)) ? 'rolling, no later transfer' : 'rolling');
  /** The transfer of week w that buys player `id` and has a Why sheet (openWhy), or null: none in a Wildcard or Free
   *  Hit week (its changes are the chip's squad: changeRow). */
  const whyMove = (P, w, id) => (!w || squadWeek(w) ? null
    : w.moves.find((m) => Number(m.in) === Number(id)) ?? null);
  /** A tap on player `id` of GW g, the plan as it is at the tap: his transfer's Why sheet when the week buys him (tagged
   *  IN: the pitch research's 4a, the user 2026-10-19), else his sheet. The pitch's (pitchProps) and a take's toast's
   *  Why (TAP_IN: whyAct), which may come from another week: GW g is shown first and the sheet opens on its draw, as
   *  his IN card there opens it, so its place ("What could go there instead ›": placeAct, placeLink) is GW g's (the
   *  review of the first-use proposals, 2026-10-21: GW9's sheet offered GW10's place). → a promise settled once the
   *  sheet has closed (closedOf) */
  const tapIn = (g, id) => {
    const Q = plan(ctx);
    // (the draw a week's switch asks runs in a microtask queued before this one: schedule)
    if (Q && gwNow(Q) !== g && Q.gws.includes(g)) { setGw(g); return Promise.resolve().then(() => tapIn(g, id)); }
    const m = Q && whyMove(Q, weekOf(Q, g), id);
    return closedOf(m ? openWhy(Q, g, m) : ctx.openSheet('player', id, { gw: g, place: placeLink(id, g) }));
  };
  TAP_IN = tapIn;
  /** The pitch's props for week w of plan view P (renderPitch's): its lineup, buys, plate and taps. */
  function pitchProps(P, w, plate = plateOf()) {
    const d = ctx.data;
    return {
      xi: w.xi, bench: w.bench, captain: w.captain, vice: w.vice, chip: w.chip, players: d.byId, gw: w.gw, horizon: d.xpGws,
      first: w.gw === P.A, bought: boughtIn(P, w.gw), inFor: inFor(P, w), second: plate.second, approx: w.approx,
      why: w.moves.filter((m) => whyMove(P, w, m.in)).map((m) => Number(m.in)),
      benchRow: true, gapRows: true, label: `Your plan at GW${w.gw}`,
      // GW A's differences from your FPL team marked (pitch.js fplMarks; the review of 2026-10-08: the plan's XI and
      // captain read as yours); a later GW has no FPL team to set it against (fplOf). d's own, so S.pitch.data keys it
      fpl: fplOf(ctx, P, w),
      // a tap on the C or the V: the armband's list (armbandSheet); on a player the week buys (tagged IN), his
      // transfer's Why sheet (the pitch research's 4a, the user 2026-10-19; his card a tap on his name there); anywhere
      // else on a card, his sheet (tapIn). The plan as it is at the tap: a pitch drawn the same is not mounted again
      // (renderPitch)
      onPlayer: (id, e) => {
        const b = e?.target?.closest?.('.pm-badge[data-badge="c"], .pm-badge[data-badge="v"]');
        if (b) { armbandSheet(b.dataset.badge, w.gw); return; }
        tapIn(w.gw, id);
      },
      // a tap on a sub's label on the bench ("1", his order; the keeper's none: m-ahead.css .pm-blp): the starters he can replace (subSheet)
      onBench: (id) => subSheet(id, w.gw),
    };
  }
  function renderPitch(P, w) {
    const d = ctx.data;
    luBtn.hidden = !w.lineup;
    luBtn.disabled = !P.editable;
    luBtn.setAttribute('aria-label', `Reset GW${w.gw} lineup to the plan's best`);
    // (where it fits: placePills, once the pitch is drawn)
    S.planReset = planHasYours(P);
    rpBtn.hidden = !S.planReset;
    rpBtn.disabled = !P.editable;
    const plate = plateOf();
    const props = pitchProps(P, w, plate);
    // the same pitch as drawn (a re-draw for a chip, a rule or the week line): nothing to mount again (QA-7 #2); the same
    // but its chip (a Bench Boost planned or taken off): only the bench's label changes (pitch.setPitchChip)
    const key = JSON.stringify([...['xi', 'bench', 'captain', 'vice', 'gw', 'first', 'bought', 'inFor', 'why', 'approx'].map((k) => props[k] ?? null), plate.key]);
    const same = S.pitch?.key === key && S.pitch.data === d && pitchHost.isConnected && pitchHost.firstChild;
    if (same && S.pitch.chip === (props.chip ?? null)) return;
    if (same && ctx.pitch.setPitchChip(pitchHost, props.chip)) { S.pitch.chip = props.chip ?? null; return; }
    S.pitch = { key, data: d, chip: props.chip ?? null };
    mountHere(props);
  }
  /** The pitch on Ahead (pitch.mountPitch), Player data, Reset lineup, Reset plan and the choices on it first (m-ahead.css:
   *  its top-right corner, beside the goal, then the layer the choices are drawn in: renderDecks; read before the eleven).
   *  An open place closes: its cards were the pitch's. */
  function mountHere(props) {
    const pill = [luBtn, rpBtn, pdBtn].find((b) => b === document.activeElement);
    // a place open with the focus in it: on his card once the pitch is mounted anew (a keyboard's, VoiceOver's)
    const inPlace = S.place && pitchHost.querySelector(':scope > .pm > .ah-place')?.contains(document.activeElement) ? S.place.a : null;
    closePlace(false);
    // the cards as they stand, for a landing's motion on the pitch mounted now (landMotion)
    const old = pitchHost.querySelector(':scope > .pm');
    S.snap = old ? new Map(cardBoxes(old).map((c) => [c.id, { rect: c.n.getBoundingClientRect(), node: c.n.cloneNode(true) }])) : null;
    ctx.pitch.mountPitch(pitchHost, props);
    if (inPlace) cardIn(pitchHost.querySelector(':scope > .pm'), inPlace)?.focus({ preventScroll: true });
    pitchHost.querySelector(':scope > .pm')?.prepend(pdBtn, luBtn, rpBtn, decks, pitchHint);
    if (pill) (pill.hidden ? pdBtn : pill).focus({ preventScroll: true });  // a corner pill keeps focus over a pitch drawn anew
    pitchHost.querySelector(':scope > .pm > .pm-field')?.append(chipsHint);
    // a swipe's new week comes in from the side the finger went (pitchEnd: S.slide, where it starts)
    if (S.slide != null) { settle(S.slide); S.slide = null; }
  }

  /** The pitch's hints (HINTS) while each is still to learn on a plan you can change (P, w: the drawn plan view and
   *  week; none: as last drawn, a resize): the shirt's while Reset lineup's corner is free (under Reset plan while that
   *  shows: placePills, before it), the chips' while the week can
   *  still play a Bench Boost or a Triple Captain; each only where it covers no card and no corner pill (a narrow screen,
   *  a large text size, a front three: not drawn). */
  function placeHint(P = S.hintAt?.P, w = S.hintAt?.w) {
    S.hintAt = { P, w };
    for (const [n, k] of HINTS) {
      n.hidden = !P?.editable || !w || S.learnt.has(k) || (k === 'pitch' ? !!w.lineup : !chipsAvail(P, w.gw).some((c) => c === 'bb' || c === 'tc'));
      if (n.hidden || !n.isConnected) continue;
      // a line wider than its room (each kept whole: m-ahead.css) is no hint there either
      if (n.scrollWidth > n.clientWidth + 1) { n.hidden = true; continue; }
      const hits = () => {
        const r = n.getBoundingClientRect();
        const meets = (b) => b.left < r.right && r.left < b.right && b.top < r.bottom && r.top < b.bottom;
        return [...pitchHost.querySelectorAll('.pm-pl, .pm-bs, .ah-pp:not([hidden]), .ah-sp, .ah-tok')]
          .map((x) => [x, x.getBoundingClientRect()]).filter(([, b]) => meets(b));
      };
      n.style.removeProperty('--ph-lift');
      let over = hits();
      // the chips' hint lifts over a sub's card behind in the field's foot (the review of the first-use proposals,
      // 2026-10-21: #5 moved a bench sub's tab up into its corner, and the hint went for good); over anything else, or
      // still over it lifted, it hides
      if (k === 'chips' && over.length && over.every(([x]) => x.matches('.ah-sp'))) {
        const top = Math.min(...over.map(([, b]) => b.top));
        n.style.setProperty('--ph-lift', `${Math.ceil(n.getBoundingClientRect().bottom - top + 4)}px`);
        over = hits();
      }
      if (over.length) n.hidden = true;
    }
  }

  /** No change can be made in GW g: a plan not yours, or GW A under way (inkAt). */
  const frozenAt = (P, g) => !P.editable || inkAt(ctx, P, g);


  /**
   * F16 / N1 the GW switcher (FPL's segmented control): per GW "GW6" (its chip's code, a hit) over what the week does
   * (N1, values not points): the buy's name (one move) or "2 in" (nothing on a week with no transfer, A15; a Free Hit or
   * Wildcard week its chip's code alone, its "8 changes" spoken only); the weeks after GW A in pencil ink (re-planned
   * each week); GW A short at FPL's prices its bank in coral.
   * The week's points are on it and in its spoken label. A chip is on a tile only when your plan plays it there ("BB" on
   * its token colour), none for a chip not planned (the user, 2026-10-08: "FH" and "TC" marks on weeks that play no
   * chip read as random). A10: a GW of the window where a club plays twice says "DGW", one
   * where a club doesn't play "BGW" (meta.dgw_bgw.window, calls.gwFlags), in muted ink.
   * The viewed GW sits on the thumb; the window's total is the switcher's accessible summary and the line under it.
   */
  function renderRail(P, g) {
    const past = edgeTicks(P);
    rail.style.setProperty('--n', P.weeks.length + past.length);
    rail.style.setProperty('--i', Math.max(0, P.weeks.findIndex((w) => w.gw === g)));
    const win = P.b?.meta?.dgw_bgw?.window;
    // the fill replaces a focused tile (an arrow key moved the week): the one now checked takes the focus
    const had = ticks.contains(document.activeElement);
    fill(ticks,
      P.weeks.map((w) => {
        const sq = squadWeek(w);
        const n = w.moves.length;
        // N1, the user 2026-10-08: the tile says what the week does (the buy's name, "2 in", "Roll", a Wildcard or Free
        // Hit week's chip) and its points (see at once which week sags)
        // A15: the incoming name only when the week has a transfer (no "Roll" on every tile)
        // a Wildcard or Free Hit week says so by its chip token alone (the user, 2026-10-09: "WC" twice on GW6)
        const change = sq || !n ? '' : n === 1 ? P.L.name(w.moves[0].in) : `${n} in`;
        const shown = fmt.num(w.points);
        const flags = gwFlags(win, w.gw);
        // GW A short at FPL's prices shows in coral in place of its change (FPL can't make the moves as they are); a later
        // week's is price drift (the solver keeps it in budget at its prices: the card says so), and never a ≈
        // week's (the estimate keeps the moves an edit leaves unfunded, the solve re-funds them: QA)
        const over = w.gw === P.A && w.bank != null && w.bank < -1e-9 && !P.approx.has(w.gw);
        // the week's points with no transfers of yours, struck before its own ("~~60.0~~ 61.8 xP": a shop's was-price,
        // the week's own forecast, no sign, so never read as a choice's number: tickWas), on every week your plan
        // changes, the one on screen too, for as long as your plan has them (P.bare, bareRef; the owner, 2026-10-26:
        // "crossed points must appear once any transfer made and they must cross points without transfers so it can be
        // compared how transfers benefit": no more a landing's mark that went once its week was shown, B61); spoken
        // "60.0 points without your transfers"; where the tile has no room it goes before the "xP" (fitNum below)
        const was = P.bare?.has(w.gw) ? tickWas(w, P.bare.get(w.gw)) : null;
        const chg = !!was;
        const chgMark = was ? h('s.ah-was', { 'aria-hidden': 'true' }, was) : null;
        return h('button.ah-tick', {
          type: 'button', role: 'radio', 'aria-checked': String(w.gw === g), dataset: { gw: w.gw }, class: { sel: w.gw === g, heal: (P.mark ?? P.approx).has(w.gw), lu: !!w.lineup, pencil: w.gw > P.A, chg },
          // VoiceOver and Switch Control activate with a click and no pointer (detail 0); a touch is the bar's own
          onClick: (e) => { if (e.detail === 0) { setGw(w.gw); } },
          'aria-label': `Gameweek ${w.gw}, ${fmt.num(w.points)} points, ${w.gw > P.A ? 'provisional, ' : ''}${sq ? plural(n, 'change') : !n ? 'roll' : `${w.moves.map((m) => P.L.name(m.in)).join(', ')} in`}${w.hits ? `, ${MINUS}${E.HIT_COST * w.hits}` : ''}${w.chip ? `, ${chipName(w.chip)}` : ''}${flags.length ? `, ${flags.map((f) => (f === 'DGW' ? 'a double gameweek' : 'a blank gameweek')).join(' and ')}` : ''}${w.lineup ? ', your lineup' : ''}${was ? `, ${COPY.tileWas(was)}` : ''}`,
        },
        // two lines, every week the same height (the user, 2026-10-09: a blank middle line on a week with no transfer):
        // "GW6" with its marks and what the week does (the buy's name, "2 in"; it ellipsises first, GW6 never), then
        // the points
        h('span.g', null, h('span.gn', null, `GW${w.gw}`), w.chip || w.hits || flags.length ? h('span.m.dots', { 'aria-hidden': 'true' }, flags.map((f) => h('span.gwk', null, f)),
          w.chip ? h('em', null, w.chip.toUpperCase()) : null,
          w.hits ? h('i.hit', null, ` ${MINUS}${E.HIT_COST * w.hits}`) : null) : null,
          change ? h('span.c', null, change) : null),
        // A15: the points never recoloured for the window's lowest week (GW A short at FPL's prices stays coral: a fact);
        // the week's forecast in its blue with "xP" (xpNum; the user, 2026-10-22), a change's mark before it
        h('span.p.m-num', { class: { 'g-loss': over } }, over ? fmt.money(w.bank) : [chgMark, xpNum(shown)]));
      }), past);
    fitRail();
    roving(ticks);
    if (had) ticks.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
    fill(totalEl, `${span(P.gws)} total, `, totalNum(P), ' points');
  }
  /** A changed week's mark (renderRail) where its tile has no room for it whole beside the points and their "xP", inside
   *  the tile's padding (a 320 pt screen, a larger text size): closer first, then the points' "xP" goes, the struck
   *  number last (the owner, 2026-10-27, "fix all", of it dropped at 320 px: crossed points appear once any transfer is
   *  made, his 2026-10-26 order; the 1026b judges had dropped it before the "xP"); one look across the rail's marked
   *  tiles, as the pitch's plates (oneLook). Again on a resize or a new text size (refitPitch). */
  function fitRail() {
    const marked = [...ticks.querySelectorAll('.ah-tick:has(.ah-was)')];
    for (const t of marked) {
      const p = t.querySelector('.p'), cs = getComputedStyle(t);
      fitNum(t, () => p.getBoundingClientRect().width > t.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 0.5, ['close', 'noxp', 'nowas']);
    }
    oneLook(marked, ['close', 'noxp', 'nowas']);
  }
  /** The GW switcher's GWs past the plan (the user, 2026-10-14: "in main tab gw 8-10 also locked depending on horizons
   *  chosen"): the longest plan's GWs (reach) the plan doesn't cover (You → Plan ahead), each a tile with a lock and no
   *  points (.edge: none of the plan's); a tap, a scrub's end or a key says how to plan it, or that it is locked
   *  (setGw). I: info(ctx), a plan view, or {reach, gws} while the first week is planned (renderBaking). */
  const edgeTicks = (I) => I.reach.filter((x) => !I.gws.includes(x)).map((x) => h('button.ah-tick.edge.pencil', {
    type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-disabled': 'true', dataset: { gw: x },
    onClick: (e) => { if (e.detail === 0) setGw(x); },
    'aria-label': `Gameweek ${x}, locked: past your plan`,
  }, h('span.g', null, h('span.gn', null, `GW${x}`)), h('span.p', null, h('span.ah-tlock', { 'aria-hidden': 'true' }, icon('lock', { size: 13 })))));

  /**
   * The window's total at the end of the header's GW line where it fits (keepGwLine): "GW6–9 218.9" (shimmering while the full plan
   * checks an edit). When a plan lands with another total than the last one shown (an edit, a lineup change, Undo, new data) it
   * shows the change for a few seconds, "229.0 (+10.1)", then fades back (TOTAL_MS); on a line that is there anyway,
   * so nothing moves. An Undo back to the total its edit started from shows none (totalShift). Its seconds count from
   * when no page toast lies over the header's row (m.css #toasts: an edit's toast stands until the next touch, A9; the
   * v1.3.75 review #18: the change ran out under it, never seen), so it is seen once; the toasts stay where they are.
   */
  const TOTAL_MS = 6000;
  const toastOver = () => !!globalThis.document?.querySelector('#toasts:not([data-place="dock"]) > .toast:not(.leaving)');
  /** The change waiting for the toast over it to go (S.totDelta.at null): its time from then, drawn then. */
  const toastGone = globalThis.MutationObserver ? new MutationObserver(() => {
    if (S.totDelta && S.totDelta.at === null && toastOver()) return;
    toastGone.disconnect();
    if (S.totDelta?.at !== null) return;
    S.totDelta.at = Date.now();
    const Q = plan(ctx);
    if (Q && el.isConnected) renderTotal(Q);
  }) : null;
  function renderTotal(P) {
    const key = `${P.entry}|${P.A}`;
    if (!P.healing) {
      // B24: a change an Undo brought (FLASH.undo, the first total drawn since it) in plain ink: no gain or loss of yours;
      // none when it is back where the change it takes back started (totalShift)
      const undo = !!FLASH?.undo && FLASH.at !== S.tot?.flash;
      const was = S.tot?.key === key ? S.tot : null;
      const t = totalShift(was, P.total, undo);
      if (t.shift === 'back') { S.totDelta = null; fill(totSaid); }
      else if (t.shift != null) {
        const over = !!toastGone && toastOver();
        S.totDelta = { from: was.v, to: P.total, at: over ? null : Date.now(), undo };
        if (over) toastGone.observe(toastRegion(), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        fill(totSaid, `${span(P.gws)} total ${fmt.num(P.total)}, ${fmt.signed(t.shift)} points`);
      }
      S.tot = { key, v: P.total, flash: FLASH?.at, before: t.before };
    }
    const d = S.totDelta?.at != null && !P.healing && Date.now() - S.totDelta.at < TOTAL_MS ? S.totDelta : null;
    fill(totLine, h('span.k', null, `${span(P.gws)} `),
      totalNum(P),
      // the change blue with "xP" as the total, an Undo's too (xpGain; the user, 2026-10-22, after v1.3.68: no green or red
      // number, its sign its direction)
      d ? h('span.ah-tdelta', { style: { '--left': `${TOTAL_MS - (Date.now() - d.at)}ms` } }, ' (', xpGain(d.to - d.from), ')') : null);
    clearTimeout(S.totTimer);
    if (d) S.totTimer = setTimeout(() => { S.totDelta = null; fill(totSaid); const Q = plan(ctx); if (Q && el.isConnected) renderTotal(Q); }, TOTAL_MS - (Date.now() - d.at));
    keepGwLine();
  }
  /** The window's total as drawn, the solver's plan's: shimmering while an edit is checked or a re-plan runs
   *  (replanning), the plan before it, never an edit's ≈ ("≈" before it until the owner, 2026-10-26: "fix so every squad
   *  is solver squad"), a forecast in its blue with "xP" (xpNum; the user, 2026-10-22): the switcher's summary and the
   *  total line under it. */
  const totalNum = (P) => h('span.v.m-num', { class: { 'm-pending': P.healing || replanning() } }, xpNum(fmt.num(P.total), 'span.ah-tnum'));
  /** The GW line on its one line under the team's name (the header is sized for it: fitHead; the user, 2026-10-22:
   *  "never cutting the countdown (shed the total's label, then the total, first)"): where the total with its passing
   *  extras (an edit's change "(+10.1 xP)") would take it to another line or past its column, the change's "xP"
   *  makes room, then the window's label ("GW6–9"), then the change isn't shown, then the total isn't (the switcher's
   *  summary still says it, totalEl); the deadline alone wraps only where it can't hold one line (a larger text size).
   *  Nor past the screen's side: the total never wraps (m-ahead.css .ah-tot; the v1.3.71 follow-ups, 2026-10-22: fit at
   *  320×568, AX1 text, "GW8–11 227.4 xP (+21.6 xP)" 327 px on a 320 px screen). While it re-plans the same (the v1.3.75
   *  review #2: the total never gave way then, the countdown cut in the header's column): its words ellipsise first
   *  (paintPlanStatus), the total's parts going only where the countdown would be cut or the words left under 2 em (a
   *  " · 22h" with nothing before it); the change once gone, its label back where it then fits (the review's #7). */
  function keepGwLine() {
    gwline.classList.remove('ah-tight', 'ah-nomark', 'ah-nototal');
    const one = parseFloat(getComputedStyle(gwline).lineHeight) * 1.5, words = gwline.classList.contains('ah-planning') ? dlEl.querySelector('.ah-plw') : null;
    const keeps = () => gwline.getBoundingClientRect().height <= one && gwline.scrollWidth <= gwline.clientWidth + 0.5
      && (!words || (dlEl.scrollWidth <= dlEl.clientWidth + 0.5 && words.clientWidth + 0.5 >= Math.min(words.scrollWidth, 2 * parseFloat(getComputedStyle(words).fontSize))));
    if (keeps()) return;
    // the change's "xP" goes first, the total beside it saying it (QA horizon, 2026-10-22: "58.1 xP (−165.6 xP)" dropped
    // the window's "GW8"), then the label
    for (const c of ['ah-nomark', 'ah-tight']) {
      gwline.classList.add(c);
      if (keeps()) return;
    }
    const d = totLine.querySelector('.ah-tdelta');
    if (d) {
      d.remove();
      gwline.classList.remove('ah-tight');
      if (keeps()) return;
      gwline.classList.add('ah-tight');
      if (keeps()) return;
    }
    gwline.classList.add('ah-nototal');
  }

  // ---------------------------------------------------------------- F16 Player data: what the second plate shows

  /** FPL's "Player data" options this bundle can back (a field it carries): the second plate's content (mountPitch
   *  `second`), the sheet's label and the button's short one. */
  const sellOf = () => new Map((ctx.data?.base?.squad || []).filter((x) => x.sell_price != null).map((x) => [Number(x.id), x.sell_price]));
  const hasField = (f) => !!ctx.bundle?.players?.fields?.includes(f);
  /** The Price change plate: FPL's projected progress towards the next night's change, "▲ 26%" / "▼ 83%" ("0%" when it
   *  rounds to nothing), "Locked" / "Calibrating" while FPL holds the price, "—" without a projection. */
  const pchgText = (p) => {
    if (p?.price_calibrating) return 'Calibrating';
    if (Date.parse(p?.price_locked_until ?? '') > Date.now()) return 'Locked';
    const pct = Number(p?.price_watch?.[0]?.[1]);
    if (!Number.isFinite(pct)) return fmt.dash;
    const r = Math.round(Math.abs(pct));
    return r === 0 ? '0%' : `${pct > 0 ? '▲' : '▼'} ${r}%`;
  };
  const PLATES = [
    // A17: the sheet's names are the pill's, word for word (the spoken label says more)
    { key: 'fxpts', label: 'Points + opponent', spoken: 'Points and opponent', short: 'Points + opp', second: 'both' },
    { key: 'opp', label: 'Opponent', short: 'Opponent', second: 'fx' },
    { key: 'pts', label: 'Points', spoken: 'Points only', short: 'Points', second: 'pts' },
    { key: 'price', label: 'Price', spoken: 'Current price', short: 'Price', field: 'price', text: (id, p) => fmt.money(p?.price) },
    // FPL pays back what it sells him for (half the profit): a buy of the plan's is sold at what he costs today
    { key: 'sell', label: 'Selling', spoken: 'Selling price', short: 'Selling', field: 'price', ok: () => sellOf().size > 0, text: (id, p) => fmt.money(S.sell?.get(Number(id)) ?? p?.price) },
    // FPL's own projection for the next price-change night, as FPL shows it (user 2026-10-08): the progress towards
    // the change in percent, "▲ 26%" / "▼ 83%" (price_watch offset 0: [likelihood, projected_percent]); "Locked" /
    // "Calibrating" when FPL holds the price; "—" without a projection
    { key: 'pchg', label: 'Price change', spoken: 'Price change tonight', short: 'Price change', field: 'price_watch',
      text: (id, p) => pchgText(p) },
    { key: 'own', label: 'Owned', spoken: 'Ownership', short: 'Owned', field: 'sel_pct', text: (id, p) => fmt.pct(p?.sel_pct) },
    { key: 'form', label: 'Form', short: 'Form', field: 'form', text: (id, p) => fmt.num(p?.form) },
    { key: 'chance', label: 'Chance', spoken: 'Chance of playing', short: 'Chance', field: 'status', text: (id, p) => {
      const st = statusInfo(p?.status, p?.chance);
      return st.chance != null ? `${st.chance}%` : st.tone === 'ok' ? '100%' : st.label;
    } },
  ];
  const PLATE_KEY = 'fc:ahead:plate';
  const plateOk = (x) => (!x.field || hasField(x.field)) && (x.ok?.() ?? true);
  /** The chosen option (this browser's, localStorage: ctx.api.local never throws), the default when the bundle can't
   *  back it → {key, label, short, second}. */
  function plateOf() {
    const k = ctx.api.local.get(PLATE_KEY);
    const x = PLATES.find((o) => o.key === k && plateOk(o)) ?? PLATES[0];
    if (x.key === 'sell') S.sell = sellOf();
    return { ...x, second: x.second ?? { label: x.label, text: x.text } };
  }
  function renderPdBtn() {
    const x = plateOf();
    fill(pdBtn, h('span.ah-pdl', null, x.short), h('span.ah-chev', { 'aria-hidden': 'true' }));
    pdBtn.setAttribute('aria-label', `Player data: ${x.spoken ?? x.label}`);
  }
  /** FPL's "Player data" sheet: a radio list; a choice re-draws the plates, is kept in this browser and closes it. */
  function playerDataSheet() {
    const now = plateOf().key;
    ctx.sheets.open({
      title: 'Player data', detent: 'large', cls: 'ah-pdsheet',
      build(body, sheet) {
        body.append(roving(h('div.ah-pd', { role: 'radiogroup', 'aria-label': 'Player data' }, PLATES.filter(plateOk).map((x) => h('button.ah-pdo', {
          type: 'button', role: 'radio', 'aria-checked': String(x.key === now), dataset: { plate: x.key }, 'aria-label': x.spoken ?? x.label,
          onClick: () => { ctx.api.local.set(PLATE_KEY, x.key); sheet.close(); render(); },
        }, h('span', null, x.label), h('span.ah-radio', { 'aria-hidden': 'true' })))), { pick: (b) => b.click() }));
        // Shirts: Drawn | Official (kits.js kitSourceRow: this browser's, applies to every shirt at once; the sheet stays)
        body.append(ctx.kits.kitSourceRow());
        // A17: what the opponents' colours mean, in one line (FPL's fixture difficulty in pale tints, app.css --fdr-2..4,
        // plan-pitch.css --fdr-1 and --fdr-5), each chip marked as the plates are (B27: the ends underlined)
        body.append(h('p.ah-fdr', { 'aria-label': 'Opponent colours: fixture difficulty from very easy to very hard' }, h('span', null, 'Opponent colour:'),
          [['1', 'very easy'], ['2', 'easy'], ['3', 'average'], ['4', 'hard'], ['5', 'very hard']].map(([n, t]) => h(`span.ah-fdrc.fdr-${n}`, { 'aria-hidden': 'true' }, t))));
        // …and its case, the venue (pitch.oppText: one style on every screen; Dana, first use 2026-10-21, met "EVE H" and "liv")
        body.append(h('p.ah-fdr', null, h('span', null, 'Opponent name:'), COPY.oppCase));
        // the forecast's scale and noise are model internals: the You sheet's Dev mode section shows them (review #3)
      },
    });
  }

  // ---------------------------------------------------------------- the GW switcher: tap, scrub, keys

  /** The last gesture whose pointerup acted (spend: its point), while its click may still come: that click is swallowed
   *  (spentClick, below). */
  const spent = { on: false, x: 0, y: 0 };
  const spend = (e) => Object.assign(spent, { on: true, x: e.clientX, y: e.clientY });
  /** A swipe that acts (the pitch's week, a move row's veto) lets its finger go at once: spent, its click is
   *  swallowed (spentClick), so it holds no re-draw (S.down, lifted) and the screen draws the change now, not LIFT_MS on. */
  const letGo = (e) => S.down.delete(e.pointerId);
  /** A finger down within EDGE_PX of the screen's sides: the system's back / forward swipe, never a swipe or scrub of
   *  ours (the switcher, the pitch, a move row); a tap or long press there stays one. */
  const atEdge = (e) => { const box = el.getBoundingClientRect(); return e.clientX - box.left < EDGE_PX || box.right - e.clientX < EDGE_PX; };
  const tickAt = (x) => [...ticks.querySelectorAll('.ah-tick')].find((t) => { const r = t.getBoundingClientRect(); return x >= r.left && x <= r.right; });
  rail.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    S.drag = { rail: { x: e.clientX, y: e.clientY, dragging: false, pid: e.pointerId, edge: atEdge(e), end: railEnd } };
  });
  rail.addEventListener('pointermove', (e) => {
    const st = S.drag?.rail;
    if (!st || st.pid !== e.pointerId) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    // a scrub once the finger goes sideways (over 10 px, more than up or down); one that goes up or down first is the
    // page's scroll (the switcher is pan-y: the browser's pointercancel ends it), never a pick of the week under it
    if (!st.dragging && !st.edge && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      st.dragging = true;
      rail.classList.add('dragging');
      try { rail.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    } else if (!st.dragging && Math.abs(dy) > 10) { S.drag = null; return; }
    if (!st.dragging) return;
    // a GW past the plan (edgeTicks) is passed over: its word comes from a tap, not from every scrub across it
    const tk = tickAt(e.clientX);
    const gg = tk && !tk.classList.contains('edge') ? Number(tk.dataset.gw) : NaN;
    if (Number.isFinite(gg) && gg !== Number(ctx.store.get('gw'))) setGw(gg);
  });
  const railEnd = (e) => {
    const st = S.drag?.rail;
    if (!st) return;
    S.drag = null;
    rail.classList.remove('dragging');
    // a tap on a GW, or a scrub that ended (it switched GW as it went): the gesture is spent, its click is not a tap
    if (e.type !== 'pointerup') return;
    if (st.dragging) { spend(e); return; }
    // a tap moved under 10 px in all: a finger that went further (sideways at the screen's edge) picks nothing
    if (Math.hypot(e.clientX - st.x, e.clientY - st.y) >= 10) return;
    const t = tickAt(e.clientX);
    if (t) { spend(e); setGw(Number(t.dataset.gw)); }
  };
  rail.addEventListener('pointerup', railEnd);
  rail.addEventListener('pointercancel', railEnd);
  rail.addEventListener('contextmenu', (e) => e.preventDefault());
  // the keys: the tiles' radio group (ui.roving, where ticks is made)

  // ---------------------------------------------------------------- the pitch: swipe ±1 GW, long-press a shirt → a
  // tick (M6), drag the C badge onto another shirt (M4, phone-only)

  pitchHost.addEventListener('pointerdown', (e) => {
    // a tab (a bench player's too: the Bench Boost is the empty bench's), a token and an open place have their own taps
    // and hold (renderDecks, drawPlace): no lift, swipe or Bench Boost starts there (a plate's every one, since the ⇄
    // handle that let a swipe through is a plate: the owner, 2026-10-25, after v1.3.79)
    if (e.button > 0 || e.target.closest('.ah-place, .ah-decks button')) return;
    const P = plan(ctx);
    // the C's armband or the V's (the user, 2026-10-13: "also vices")
    const badge = e.target.closest('.pm-badge[data-badge="c"], .pm-badge[data-badge="v"]');
    const bare = benchBare(e);
    const pl = bare ? null : e.target.closest('.pm-pl[data-id], .pm-bs[data-id]');
    const st = { x: e.clientX, y: e.clientY, id: pl ? Number(pl.dataset.id) : null, pl, moved: false, lifted: false, pid: e.pointerId, src: pitchHost, edge: atEdge(e), fl: flick().add(e.clientX, e.timeStamp), end: pitchEnd };
    S.drag = { pitch: st, used: false };
    // the armband drags after a short hold (GRIP_MS): a finger that moves before it scrolls; the C
    // held still (TC_MS) plays the Triple Captain there or takes it off (the user, 2026-10-13: "by interaction on cap (but
    // so it not conflict with switching)": a drag moves it, a still hold plays it)
    if (badge && P) {
      st.badge = badge.dataset.badge;
      st.timer = setTimeout(() => { st.held = true; }, GRIP_MS);
      // (its progress filling round the finger from the first frame: holdFill; the user, 2026-10-22)
      if (st.badge === 'c' && P.editable) {
        st.fill = holdFill(e.clientX, e.clientY, TC_MS, 'TC');
        st.chip = setTimeout(() => { unfill(st); if (!st.flying) pitchChip(st, 'tc'); }, TC_MS);
      }
      return;
    }
    // a bench shirt lifts as a starter's does (IPHONE_DESIGN §5.5 "long-press a shirt")
    if (pl && P?.editable) st.timer = setTimeout(() => liftShirt(st, e), LONG_MS);
    // the bench held where no shirt is (its labels, its edges): the Bench Boost there, or off (the user, 2026-10-13: "by
    // holding bench")
    // (its progress filling at the finger: holdFill; the user, 2026-10-22)
    else if (bare && P?.editable) {
      st.fill = holdFill(e.clientX, e.clientY, LONG_MS, 'BB');
      st.timer = setTimeout(() => { unfill(st); pitchChip(st, 'bb'); }, LONG_MS);
    }
  });
  /** A pitch gesture's hold ring gone (holdFill: its hold fired, or it was let go or moved first). */
  const unfill = (st) => { st.fill?.(); st.fill = null; };
  /** The finger on the bench where no shirt is (its labels, its edges), by its point: a touch browser moves a touch on
   *  the labels' thin strip onto the card under it (Chrome's touch adjustment: QA 375x667, the target a bench shirt at
   *  the label's own point), so the event's target can't say. */
  const benchBare = (e) => {
    const inside = (n) => { const r = n.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
    const bench = pitchHost.querySelector('.pm-bench');
    // (nor a sub's plate, on his card under his label: labelWalls; its tap opens his place)
    return !!bench && inside(bench) && ![...bench.querySelectorAll('.pm-bs'), ...decks.querySelectorAll('.ah-sp')].some(inside);
  };
  pitchHost.addEventListener('pointermove', (e) => {
    const st = S.drag?.pitch;
    if (!st || st.pid !== e.pointerId || st.done) return;
    st.fl.add(e.clientX, e.timeStamp);
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (st.badge) {
      const far = Math.hypot(dx, dy) > 6;
      // the armband gripped (GRIP_MS) and moving past a still finger's 3 px: it can only move now, its Triple Captain off
      // (the user, 2026-10-22; Saffer's review: a C pressed, then dragged after a hesitation, played the TC)
      if (st.held && Math.hypot(dx, dy) > 3) { clearTimeout(st.chip); unfill(st); }
      if (st.flying || (st.held && far)) dragBadge(st, e);
      if (st.held || !far) return;
      // moved before the hold: no armband drag, no Triple Captain; the finger is the shirt's (the screen scrolls, or the
      // pitch swipes)
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
    // the pitch follows the finger, a third as far where no week is that way (the window's first or last); under
    // Reduce Motion it stays put and the week swaps on the lift
    if (st.swipe && !reduceMotion()) {
      st.tx = swipeGw(dx) != null ? dx : dx / 3;
      pitchHost.classList.remove('settle');
      pitchHost.style.transform = `translateX(${st.tx}px)`;
    }
    if (st.lifted) dragTo(e);
  });
  /** The week a swipe of dx px goes to (left: the next, right: the one before), null past the window's last or first. */
  const swipeGw = (dx) => { const P = plan(ctx); return P?.gws[P.gws.indexOf(gwNow(P)) + (dx < 0 ? 1 : -1)] ?? null; };
  const pitchEnd = (e) => {
    const st = S.drag?.pitch;
    if (!st || st.pid !== e.pointerId) return;
    clearTimeout(st.timer);
    clearTimeout(st.chip);
    unfill(st);
    if (st.done) { releaseSoon(st); return; }
    // a gesture the system cancels (a call, the phone locked: pointercancel) never acts: it only cleans up
    const act = e.type === 'pointerup';
    if (st.lifted) { dropOn({ act }); return; }
    if (st.badge && st.flying) { dropBadge(st, { act }); return; }
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    // B43: 45 px, or a quick flick of a swipe (its lock: st.swipe) whose release carries it that far (ui.flick)
    const far = Math.abs(dx) > 45 ? dx : st.swipe ? st.fl.add(e.clientX, e.timeStamp).project(e.clientX) - st.x : 0;
    if (act && !st.edge && Math.abs(far) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      S.drag.used = true;
      const g = swipeGw(far);
      if (g != null) {
        // the new week's pitch comes in from the side the finger went, beside where it left this one (mountHere), now
        settle();
        if (st.tx != null) S.slide = dx + (far < 0 ? 1 : -1) * pitchHost.clientWidth;
        letGo(e);
        setGw(g);
        releaseSoon(st);
        return;
      }
    }
    if (st.tx != null) settle(st.tx);  // back in place: short of a week, no week that way, or cancelled
    releaseSoon(st);
  };
  pitchHost.addEventListener('pointerup', pitchEnd);
  pitchHost.addEventListener('pointercancel', pitchEnd);
  /** The pitch to its place from x px over --dur (.settle, m-ahead.css: --ease, no overshoot): from where a swipe left
   *  it, or from beside it (a swipe's new week); with no x, or under Reduce Motion, at once. Its inline transform goes
   *  at once (mountPitch and fitPitch never meet a stale one); .settle at the transition's end or the next swipe. */
  function settle(x = 0) {
    const s = pitchHost.style;
    pitchHost.classList.remove('settle');
    s.transform = x && !reduceMotion() ? `translateX(${x}px)` : '';
    if (!s.transform) return;
    void pitchHost.offsetWidth;  // from x: the transition starts there
    pitchHost.classList.add('settle');
    s.transform = '';
  }
  pitchHost.addEventListener('transitionend', (e) => { if (e.target === pitchHost) pitchHost.classList.remove('settle'); });
  // shirts are touch-action: pan-y so the screen scrolls from them; once a shirt is lifted (long-press) or the
  // C badge is held (GRIP_MS), the drag owns the finger: stop the scroll (needs a non-passive listener)
  pitchHost.addEventListener('touchmove', (e) => {
    const st = S.drag?.pitch;
    if (st && (st.lifted || (st.badge && st.held))) holdTouch(e);
  }, { passive: false });
  pitchHost.addEventListener('contextmenu', (e) => e.preventDefault());
  /** The gesture ended (gesture(): no longer under way); cleared once its pointerup has run everywhere (the window's
   *  `spentUp` reads S.drag.used). */
  const releaseSoon = (st) => {
    st.ended = true;
    setTimeout(() => { if (S.drag && Object.values(S.drag).includes(st)) S.drag = null; }, 0);
  };
  /** The gesture under way (the switcher's, the pitch's or a move row's), null once its release has been handled. */
  const gesture = () => [S.drag?.rail, S.drag?.pitch, S.drag?.row].find((st) => st && !st.ended) ?? null;
  /** End the gesture under way as the system's cancel ends it, by its own handler: nothing acts; a lifted shirt or
   *  row, or the armband, goes back and the pitch to its place. */
  const cancelGesture = () => { const st = gesture(); st?.end({ type: 'pointercancel', pointerId: st.pid, clientX: st.x, clientY: st.y, timeStamp: performance.now() }); };

  function dragBadge(st, e) {
    const P = plan(ctx);
    const w = weekOf(P, gwNow(P));
    if (!st.flying) {
      st.flying = true;
      S.drag.used = true;
      clearTimeout(st.chip);
      unfill(st);
      learn('pitch');
      try { pitchHost.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
      // the gap rides above the badge, beside the finger (the hint under the switcher was far from it, or scrolled away)
      st.gap = h('span.ah-ghostgap');
      const vice = st.badge === 'v';
      st.ghost = h('div.ah-dragghost.badge', { 'aria-hidden': 'true' }, st.gap, h(vice ? 'span.pm-badge.v' : 'span.pm-badge.c', null, vice ? 'V' : w.chip === 'tc' ? '3×' : 'C'));
      document.body.append(st.ghost);
    }
    st.ghost.style.transform = `translate(${e.clientX - 12}px, ${e.clientY - 28}px)`;
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.pm-pl[data-id]');
    const id = under && pitchHost.contains(under) ? Number(under.dataset.id) : null;
    st.target = id !== null && w.xi.includes(id) ? id : null;
    for (const n of pitchHost.querySelectorAll('.pm-pl.ah-captarget')) n.classList.remove('ah-captarget');
    if (st.target !== null) under.classList.add('ah-captarget');
    // the armband on him against the captain now: the pooled forecast (calls.captainGap), never a run count (F8); "≈" when
    // the call is weak (B28: its label). The V's: who it lands on, no number (COPY.viceTo: on the captain the armbands swap)
    if (st.badge === 'v') {
      const nm = st.target === null ? null : P.L.name(st.target);
      st.gap.textContent = st.target === null ? COPY.viceDrop : st.target === w.vice ? COPY.viceStays : st.target === w.captain ? COPY.viceSwap(nm) : COPY.viceTo(nm);
    } else {
      const cg = st.target !== null && st.target !== w.captain ? captainGap(inputs(ctx), w, st.target, w.captain) : null;
      const gap = st.target === null ? null : st.target === w.captain ? COPY.capNow : COPY.capGap(cg.delta, P.L.name(w.captain), cg.label);
      st.gap.textContent = st.target !== null ? `${P.L.name(st.target)} · ${gap}` : 'Drop the armband on a starter';
    }
    // centred on the badge, kept 8 px inside the screen's sides (--gx)
    const box = el.getBoundingClientRect(), wd = st.gap.offsetWidth, x0 = e.clientX - wd / 2;
    st.gap.style.setProperty('--gx', `${Math.max(box.left + 8, Math.min(x0, box.right - 8 - wd)) - x0}px`);
  }
  /** The armband dropped: on a starter, he is captain (act: a pointerup; a cancelled drag only cleans up). The V's
   *  (the user, 2026-10-13): he is vice (ahead.vice, Make vice's); on the captain the two swap, as FPL's (captain: the
   *  vice made captain hands the old captain the V). */
  function dropBadge(st, { act = true } = {}) {
    st.ghost?.remove();
    for (const n of pitchHost.querySelectorAll('.pm-pl.ah-captarget')) n.classList.remove('ah-captarget');
    releaseSoon(st);
    const P = plan(ctx);
    const g = gwNow(P);
    const w = weekOf(P, g);
    if (!act || st.target === null || !w) return;
    armTo(st.badge, g, w, st.target);
  }
  /** The C's armband (`arm` 'c') or the V's to starter `id` in GW g: the C makes him captain; the V makes him vice, and
   *  on the captain the two swap, as FPL's. The drag's drop and the list's tap (armbandSheet). → bool */
  const armTo = (arm, g, w, id) => (arm === 'v' ? (id === w.captain ? captain(ctx, g, w.vice) : id !== w.vice && vice(ctx, g, id)) : id !== w.captain && captain(ctx, g, id));
  /** The armband by a tap on the C or the V (review 6: captain and vice were drags alone, nothing to tap; the user,
   *  2026-10-13: "Tap C or V for a list"): GW g's starters by their forecast, each with the drag's own words (the C's:
   *  his gap to the captain now, calls.captainGap; the V's: who it lands on), the one wearing it checked; a tap moves it
   *  (armTo: the edit's toast with Undo). No buttons on the player card (the user, 2026-10-13). */
  function armbandSheet(arm, g) {
    const P = plan(ctx), w = weekOf(P, g);
    if (!P || !w) return;
    const isV = arm === 'v', on = isV ? w.vice : w.captain;
    // the drag's rule (lineupEdit): GW A under way is FPL's; a lineup is the phone's own, so offline it still moves
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
      title, detent: 'medium', fit: true, cls: 'cs', label: title,
      build(body, sheet) {
        append(body, h('div.ah-list', { role: 'group', 'aria-label': title }, [...w.xi].sort((a, b) => (xp(b) ?? -Infinity) - (xp(a) ?? -Infinity)).map((id) => {
          const fact = words(id);
          return h('button.ah-lrow', {
            type: 'button', disabled: !can || id === on, 'aria-pressed': id === on ? 'true' : null,
            'aria-label': `${P.L.name(id)}, ${fmt.pts(xp(id))} points${fact ? `, ${fact}` : ''}`,
            onClick: () => { if (armTo(arm, g, w, id)) sheet.close(); },
          },
          h('span.mk.rs-automk', { class: { on: id === on }, 'aria-hidden': 'true' }, id === on ? (isV ? 'V' : 'C') : ''),
          h('span.nm', null, h('b', null, P.L.name(id)), fact ? h('span', null, fact) : null),
          // (his forecast in its blue with "xP": ui.js xpNum; the user, 2026-10-22)
          h('span.rt.m-num', null, xpNum(fmt.pts(xp(id)))));
        })), can ? null : h('p.m-foot', null, COPY.live(g)));
      },
    });
  }
  /** A sub's list (the user, 2026-10-21: fix all, first-use proposal #5; Tom: "Where's the 'sub him on' button?"), as the
   *  captain list is the armband's: a tap on his label on the bench ("1", his order: pitch.js benchPanel, m-ahead.css .pm-blp) lists the
   *  starters he can replace in GW g (subChoices: the drag's legal swaps, the best first), each with its toast's words and
   *  number and the starter's forecast; a tap makes the sub (sub: the drag's, its toast with Undo). GW A under way is
   *  FPL's: the rows off, and why (COPY.live), as the captain list. The hold and the drag stay as they are. */
  function subSheet(id, g) {
    const P = plan(ctx), w = weekOf(P, g);
    if (!P || !w?.bench.includes(Number(id))) return;
    const can = !inkAt(ctx, P, g);
    const title = COPY.subIn(subOrder(w.bench, P.L.pos).get(Number(id)), g);
    ctx.sheets.open({
      title, detent: 'medium', fit: true, cls: 'cs', label: title,
      build(body, sheet) {
        append(body, h('div.ah-list', { role: 'group', 'aria-label': title }, subChoices(ctx, P, g, id).map((c) => {
          const said = COPY.lineup(c.what, g, c.cmp.delta);
          return h('button.ah-lrow', {
            type: 'button', disabled: !can, 'aria-label': `${P.L.name(c.id)}, ${xpShown(ctx, c.id, g)} points, ${said}`,
            onClick: () => { if (sub(ctx, g, id, c.id)) sheet.close(); },
          },
          h('span.mk', { 'aria-hidden': 'true' }, shirtOf(P.L, c.id, 32)),
          h('span.nm', null, h('b', null, P.L.name(c.id)), h('span', null, said)),
          // (his forecast in its blue with "xP": ui.js xpNum; the user, 2026-10-22)
          h('span.rt.m-num', null, xpNum(xpShown(ctx, c.id, g))));
        })), can ? null : h('p.m-foot', null, COPY.live(g)));
      },
    });
  }

  /** The shirt's drag to a tick: a lifted ghost follows the finger, valid ticks glow; also onto a player (`subs`: the
   *  ids he can swap with, outlined on the pitch; `onPlayer(id)` the drop there). */
  function lift(st, e, { ghost, valid, onDrop, hintText, subs = [], onPlayer = null }) {
    st.lifted = true;
    S.drag.used = true;
    try { st.src.setPointerCapture(e.pointerId); } catch { /* the finger already left */ }
    st.ghost = h('div.ah-dragghost', { 'aria-hidden': 'true' }, ghost);
    document.body.append(st.ghost);
    st.onDrop = onDrop;
    st.subs = new Set(subs);
    st.onPlayer = onPlayer;
    for (const n of pitchHost.querySelectorAll('.pm-pl[data-id], .pm-bs[data-id]')) n.classList.toggle('ah-subok', st.subs.has(Number(n.dataset.id)));
    fill(hint, h('span', null, hintText));
    hint.classList.add('on');
    for (const t of ticks.querySelectorAll('.ah-tick')) {
      const ok = valid.includes(Number(t.dataset.gw));
      t.classList.toggle('glow', ok);
      t.classList.toggle('bad', !ok);
    }
    dragTo(st.last ?? e);
  }
  function dragTo(e) {
    const st = S.drag?.pitch;
    if (!st?.ghost) { if (st) st.last = e; return; }
    st.ghost.style.transform = `translate(${e.clientX - 28}px, ${e.clientY - 50}px) scale(1.06)`;
    st.over = null;
    if (st.subs?.size) {
      const under = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.pm-pl[data-id], .pm-bs[data-id]');
      const id = under && pitchHost.contains(under) ? Number(under.dataset.id) : null;
      st.overPl = id !== null && st.subs.has(id) ? id : null;
      for (const n of pitchHost.querySelectorAll('.ah-captarget')) n.classList.toggle('ah-captarget', n === under && st.overPl !== null);
      if (st.overPl !== null) under.classList.add('ah-captarget');
    }
    for (const t of ticks.querySelectorAll('.ah-tick')) {
      const r = t.getBoundingClientRect();
      const on = t.classList.contains('glow') && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 28 && e.clientY <= r.bottom + 12;
      t.classList.toggle('hover', on);
      if (on) st.over = Number(t.dataset.gw);
    }
  }
  /** The lifted shirt let go: on a glowing week, its onDrop (act: a pointerup; a cancelled drag only cleans up,
   *  its redraw scheduled: a cancel from the next press's capture would otherwise redraw the screen under that press
   *  before its own handlers run, the pre-release review, 2026-10-14). */
  function dropOn({ act = true } = {}) {
    const st = S.drag?.pitch;
    if (!st) return;
    st.ghost?.remove();
    hint.classList.remove('on');
    st.pl?.classList.remove('ah-lifted');
    for (const t of ticks.querySelectorAll('.ah-tick')) t.classList.remove('glow', 'bad', 'hover');
    for (const n of pitchHost.querySelectorAll('.ah-subok, .ah-captarget')) n.classList.remove('ah-subok', 'ah-captarget');
    releaseSoon(st);
    if (act) render();
    else schedule();
    if (act && st.over != null) st.onDrop(st.over);
    else if (act && st.overPl != null) st.onPlayer?.(st.overPl);
  }

  /** The pitch's chip gestures (the user, 2026-10-13): the C held still plays the Triple Captain in the viewed week, the
   *  bench held where no shirt is the Bench Boost, either taken off when the week plays it (useChip: its toast, Undo, or
   *  why it can't); the gesture is spent (the finger's moves and its click). */
  function pitchChip(st, chip) {
    st.done = true;
    S.drag.used = true;
    learn('chips');
    useChip(ctx, chip, gwNow(plan(ctx)));
  }
  /** A shirt held (LONG_MS): dropped on a glowing week, sold from then (Replace); dropped on an outlined player of the
   *  viewed week, swapped with him (the user, 2026-10-13: subs "the same way it let move the captain"; ahead.sub, Sub
   *  with…'s: engine.swapCandidates keeps a legal formation, the armband moving as FPL moves it; none while GW A is under
   *  way, FPL's). */
  function liftShirt(st, e) {
    const P = plan(ctx);
    const id = st.id;
    const g = gwNow(P);
    const w = weekOf(P, g);
    // a Wildcard's or Free Hit's own player (the chip brought him in: not in the squad going into its week) dropped on
    // that week is ruled out of its squad there, the chip picking another (the user, 2026-10-13: "why i cant drop hill
    // from wc team by moving him to gw7 week drop"; the player card's Sell · Not GW7: veto, scope 'gw')
    const chipOut = !!squadWeek(w) && w.squad.includes(id) && !squadBefore(P, g).includes(id) && !inkAt(ctx, P, g);
    const valid = P.gws.filter((x) => (squadBefore(P, x).includes(id) || (chipOut && x === g)) && !inkAt(ctx, P, x));
    const subs = w && !inkAt(ctx, P, g) ? E.swapCandidates(w, id, P.L.pos) : [];
    // nothing to swap or sell: it lifts all the same and says so (every week .bad, a drop does nothing), as a row does
    learn('pitch');
    st.pl.classList.add('ah-lifted');
    lift(st, e, {
      ghost: shirtOf(P.L, id, 56), valid, subs,
      hintText: COPY.liftShirt(P.L.name(id), subs.length > 0, valid.some((x) => !(chipOut && x === g)), chipOut ? g : null),
      onDrop: (x) => (chipOut && x === g ? veto(ctx, { gw: g, out: null, in: id }, { scope: 'gw' }) : ctx.openSheet('replace', id, x)),
      onPlayer: (o) => sub(ctx, g, id, o),
    });
  }

  // ---------------------------------------------------------------- move rows: swipe left → veto (M8)

  /** A Week sheet move row's gesture: its surface `fg` over the frame `row` (whose backdrop, "Not Groß · GW6", shows
   *  under it as it moves). B19 (the user, 2026-10-10: one swipe, the left one): left past SWIPE_PX, or a quick flick
   *  whose release carries it that far (B43: ui.flick), rules the buy out in this GW (vetoRow); a move to the right
   *  moves nothing. No long press (the user's 5b, 2026-10-19: a transfer moves only through its Why sheet's When line). */
  function wireMoveRow(row, fg, m) {
    fg.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      // a swipe may start on the row's × too (the reviews, 2026-10-11: one begun at the row's right edge, where a left
      // swipe starts, did nothing): a tap there stays the button's (no swipe: its click; a swipe: spent, its click
      // swallowed)
      const st = { x: e.clientX, y: e.clientY, dx: 0, swiping: false, row, pid: e.pointerId, src: fg, edge: atEdge(e), fl: flick().add(e.clientX, e.timeStamp), end: up };
      S.drag = { row: st, used: false };
    });
    fg.addEventListener('pointermove', (e) => {
      const st = S.drag?.row;
      if (!st || st.row !== row || st.pid !== e.pointerId) return;
      st.fl.add(e.clientX, e.timeStamp);
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      // a move of more than 6 px down or up decides too: in the Week sheet that is where the sheet's own drag starts
      // (app.js wireDrag), so a row never swipes while the sheet moves
      if (!st.swiping && (Math.hypot(dx, dy) > 8 || Math.abs(dy) > 6)) {
        // sideways from the screen's edge is the system's back swipe (atEdge): the row lets it go, as it does a scroll
        if (!st.edge && Math.abs(dx) > Math.abs(dy)) {
          st.swiping = true;
          S.drag.used = true;
          fg.classList.add('dragging');
          try { fg.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
        } else { S.drag = null; return; }
      }
      // left only: veto the buy (red); the right swipe's Keep is gone (B19: Keep is the Why sheet's button)
      if (st.swiping) { st.dx = Math.min(0, dx); fg.style.transform = `translateX(${st.dx}px)`; }
    });
    const up = (e) => {
      const st = S.drag?.row;
      if (!st || st.row !== row) return;
      releaseSoon(st);
      fg.classList.remove('dragging');
      // B19: left only; B43: past SWIPE_PX, or a quick flick whose release carries it that far (ui.flick)
      const far = !st.swiping || e.type !== 'pointerup' ? 0 : st.dx < -SWIPE_PX ? st.dx : st.fl.add(e.clientX, e.timeStamp).project(e.clientX) - st.x;
      if (far < -SWIPE_PX) {
        letGo(e);  // the swipe is spent: the row is drawn again when its veto lands, not LIFT_MS later (B109)
        learn('row');
        vetoRow(row, fg, m);
      } else fg.style.transform = '';
    };
    fg.addEventListener('pointerup', up);
    fg.addEventListener('pointercancel', up);
    fg.addEventListener('touchmove', (e) => { if (S.drag?.row?.row === row && S.drag.row.swiping) holdTouch(e); }, { passive: false });
  }
  /** B19: a swipe released past SWIPE_PX: the row springs back (its backdrop showing under it as it goes: .out) and
   *  the veto starts at once (F11: not him in this GW only; review3 Part 4 §10: its toast never waits for the
   *  motion), the row drawn again (the plan before it until the solver's lands with the new buy: no "Le Fée?" guess since
   *  the owner, 2026-10-26), never faded to nothing; a veto refused draws the row as it was. */
  function vetoRow(row, fg, m) {
    row.classList.add('out');
    fg.style.transform = '';
    if (!veto(ctx, m, { scope: 'gw' })) render();
  }
  /** B98b (review3 Part 5 §10: nothing taught the swipe; no hint motion, no tour): the Why sheet's "Not Groß · GW6" sends
   *  its row in the Week sheet under it the swipe's own way, left until its backdrop's words show, then releases it as a
   *  swipe (vetoRow). The row not drawn (no Week sheet under it: an IN card's Why sheet), Reduce Motion or no edit
   *  possible: the veto at once (a refusal
   *  says why and keeps the sheet). → bool */
  function vetoFromWhy(m) {
    const at = `[data-gw="${m.gw}"][data-out="${m.out}"][data-in="${m.in}"]`;
    const row = S.week?.host.querySelector(`.ah-mrow${at}`), fg = row?.querySelector(':scope > .ah-fg');
    if (!row || !fg || reduceMotion() || !editable(ctx)) return veto(ctx, m, { scope: 'gw' });
    const words = row.querySelector(':scope > .ah-veto > span');
    row.classList.add('out');
    fg.style.transform = `translateX(-${Math.max(SWIPE_PX, (words?.offsetWidth ?? 0) + 32)}px)`;  // the words and their 16 px each side
    setTimeout(() => vetoRow(row, fg, m), SWIPE_MS);
    return true;
  }

  // ---------------------------------------------------------------- wiring

  // a finger down anywhere but the rail holds the background re-renders (schedule) until it lifts: then they draw, once
  // the gesture's own pointerup handlers (and releaseSoon) have run and its click has landed (lifted)
  // (a chip control re-drawn under a finger sent its click to the row). A press first ends what was held before it whose
  // release never came (Chrome on macOS, the user, 2026-10-14: a lifted shirt left on the screen, "no way recover it
  // without reloading"; QA mouse-drag): its gesture as cancelled, and, with no other pointer down (isPrimary: a mouse's,
  // a first finger's), its pointer no longer counted down
  const pressed = (e) => {
    cancelGesture();
    if (e.isPrimary) S.down.clear();
    // the Week sheet's too: it is drawn by render (a landing must not draw its rows anew under a finger)
    if ((!rail.contains(e.target) && el.contains(e.target)) || S.week?.sheet.el.contains(e.target)) S.down.add(e.pointerId);
  };
  globalThis.addEventListener('pointerdown', pressed, true);
  // so does a release its gesture's own handler never had (bubbling: after it), Escape, or the window losing focus
  const stray = (e) => {
    const st = gesture();
    if (st && (e.type === 'blur' || (e.type === 'keydown' ? e.key === 'Escape' : e.pointerId === st.pid))) cancelGesture();
  };
  const strays = ['pointerup', 'pointercancel', 'keydown', 'blur'];
  for (const t of strays) globalThis.addEventListener(t, stray);
  const LIFT_MS = 350;
  const lifted = (e) => {
    const draw = () => setTimeout(() => { if (!S.down.size && S.held && !covered()) { S.held = false; render(); } }, 0);
    if (e.type === 'blur') { S.down.clear(); if (S.held) draw(); return; }
    if (!S.down.has(e.pointerId)) { if (!S.down.size && S.held) draw(); return; }  // a finger on the rail (never held)
    // a tap's click comes after its pointerup: its finger counts as down until that click has landed on the control it
    // was on, or LIFT_MS on when no click comes (a scroll, a drag), so nothing re-draws in between (QA: a chip row drawn
    // there sent "Take Bench Boost off" to the row, a Clear all to its rules row)
    const id = e.pointerId;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      globalThis.removeEventListener('click', soon, true);
      S.down.delete(id);
      if (!S.down.size && S.held) draw();
    };
    // (caught as it starts, gone a task later: after every handler of it, a control's that stops its propagation too, a
    // take's + (addOnce), whose plan pre-solved lands in its tap and waited LIFT_MS to be drawn: the presolve merge's QA,
    // 2026-10-27, its Week sheet still closing when the next one was opened)
    const soon = () => setTimeout(go, 0);
    globalThis.addEventListener('click', soon, true);
    setTimeout(go, LIFT_MS);
  };
  const lifts = ['pointerup', 'pointercancel', 'blur'];
  for (const t of lifts) globalThis.addEventListener(t, lifted);
  // a gesture its own pointerup acted on (a GW tapped or scrubbed on the switcher: railEnd; a swipe, a drop or a row
  // swiped away: S.drag.used) is not also a tap: the browser's click after it lands on whatever the re-draw put under
  // the finger by then (a touch's comes a task later: QA 2026-10-06, a GW8 tick tap opened a sheet when GW7's
  // chip note left the rows). That one click is swallowed, in the window's capture phase (before any control's own,
  // a sheet's too): only within SPENT_PX of the pointerup's point and only until the next finger goes down (every
  // pointer's own click comes after its pointerdown); a keyboard's or assistive tech's click (detail 0) never is. No
  // time limit: a busy page (the GW's re-draw) dispatches that click late, and its timeStamp with it.
  const spentUp = (e) => { if (S.drag?.used) spend(e); };  // bubbling: after the gesture's own pointerup handlers
  const spentDown = () => { spent.on = false; };
  const spentClick = (e) => {
    if (!spent.on || e.detail === 0) return;
    const ours = Math.hypot(e.clientX - spent.x, e.clientY - spent.y) <= SPENT_PX;
    spent.on = false;
    if (!ours) return;
    e.stopPropagation();
    e.preventDefault();
  };
  globalThis.addEventListener('pointerup', spentUp);
  globalThis.addEventListener('pointerdown', spentDown, true);
  globalThis.addEventListener('click', spentClick, true);
  const offs = [ctx.store.on('gw', () => schedule()), ctx.store.on('memory', () => schedule('mem')), ctx.store.on('aheadRev', () => schedule()),
    ctx.store.on('learnt', () => { S.learnt = new Set(); schedule(); }),
    ctx.store.on('aheadPair', () => schedule('pair'))];
  // (plan memory once the bake's base road is in: renderBaking)
  if (ctx.bundle?.roads?.base) memOf(ctx);
  render();
  return {
    // a bundle or connection change waits as any store change does (schedule: never under a finger or a large sheet;
    // review 5, 2026-10-12: a swipe during it left a drag chip stuck)
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
