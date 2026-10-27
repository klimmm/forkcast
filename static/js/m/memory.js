// Forkcast plan memory (IPHONE_DESIGN §7.7, §7.4 GET / PUT /api/m/memory, §3 M12 / M13): your plan for the
// next deadline, the pins it is made of, GW A and the pencil weeks after it (an older document's ink, its frozen
// weeks, is thawed on load since Freeze went, 2026-10-12), and drift, which Ahead says as a toast (ahead.driftSay).
// The pure half (pins, values, legality, drift) is DOM-free and node-tested; the live half is one memory per
// page, attached to the shell's ctx. No side effects at import time.
//
// ================================================================ model
// Your plan is the latest base road plus your pins (§7.7). A Pin is one thing you asked of the plan, kept as
// solver windows: {id, kind, label, gw, must: [[player, a, b]], excl: [[player, a, b]], max_hits, hits? {gw: cap},
// chips? {gw: chip}, cash? (tenths), at (epoch s), ...meta}. Pins compose oldest first and a newer pin overrides an
// older one on the GWs where they disagree (as a move overrides a Keep in engine.constraintsFromDraft), so
// no must-have and exclude window ever overlap (the solver exits on that: player_data.py:772-780). Ids are
// stable, so a second pin with the same id replaces the first:
//   'road'        pinRoad(road, A)          GW A held as a squad: an older document's road call; or, `locked`, an
//                                           older document's frozen weeks (ink, lockPin: each frozen GW's squad as 15
//                                           must-haves that week and its chip, `frozen` [gw]; a lock: GW A), thawed on
//                                           load since Freeze went (normalizeAccepted, thawPin). The windows such a road was solved
//                                           under (a variant's vetoes, the −4 road's hits, a chip) are never hidden
//                                           inside it (QA-1): splitRoad makes each a rule of its own, marked `via:
//                                           <road key>`, shown as a chip like any rule and taken back with it
//   'wish:<id>'   pinWish(id, g, end)       buy him by GW g (must id@g-end); with `chip` (ahead.wishPin) him in that
//                                           Wildcard or Free Hit week's squad alone (must id@g-g)
//   'sell:<id>'   pinSell(out, g, end, {in, funds}) sell him from GW g (exclude out@g-end; with a pick, must in@g-end,
//                                           composed as made in g: out held in g−1, in out until then, B36;
//                                           without one the solver picks the replacement: "Let the plan choose")
//   'slide:<in>'  pinSlide(in, out, g, A, end)  the GW-A move made in GW g instead (the bake's slide windows)
//   'out:<id>'    pinVeto / pinNever(id, A, end)  not him in GW A-end (one id: a veto and a Never are one rule)
//   'out:<id>@<g>'  pinVeto(id, g, g, {scope: 'gw'})  not him in GW g only (F11: he may come later)
//   'keep:<id>'   pinKeep(id, from, end)    keep him through the window; 'keep:<id>@<g>' (scope 'gw') in GW g only
//   'roll:<gw>'   pinRoll(gw, k)            a suggested plan's + (ahead.addPlan, the user 2026-10-13: "Lock it, both
//                                           modes"; an older plan's Auto-plan Off too): no transfers in GW gw, whatever earlier weeks do (values.no_buys_gw:
//                                           the tap's --no-buys-gw, Rules.buys_max_at {gw: 0}; and no hit: cap 0); with
//                                           k of your exact moves there (B20) the week capped at them (values.max_buys_gw).
//                                           No player windows: composePins lists its GW in `rolls` (or `caps`)
//   'hits:<gw>'   pinHits(n, gw)            at most n hits in GW gw (--max-hits-gw, F13): F17 a restriction below the
//                                           solver's own default cap (meta.hit_cap), which a GW with no rule takes; 0 is
//                                           no hit. Made now by splitRoad (a road's own caps) and Ahead's forkValues
//                                           (a suggested plan's later weeks), no longer by a week's Auto-plan (gone 2026-10-12: the hits
//                                           Forkcast may take are You → Hits, the derived pin 'hits': withHits). No hits
//                                           or Roll rule stands in a Wildcard or Free Hit week
//                                           (composePins skips them, chipEdit and normalizeAccepted take them off)
//   'chip:<gw>'   pinChip(gw, chip)  'cash'  pinCash(tenths)   plan options as pins
// A rule scoped to one GW (F11) is a window of one round: a Keep in GW6 only never clashes with a sale in GW8 (pins
// compose by cell). Every pin but the road is one of "your rules" (RULES_V2): they accumulate until you remove one, nothing drops
// them silently (a Switch to the new best keeps them; a heal that can't keep them all leaves them in place and
// sets Plan.error), and ruleText(pin) is each in words. An older document's frozen weeks (ink, "Freeze GW8" until
// 2026-10-12: GW A..8) are the road pin with `locked`, which normalizeAccepted thaws on load, so the guards that kept
// one (pinsAfter, removePin, clearPins, adoptDrift; F5, frozenClash: an ask that changed one was refused) find none;
// inkRepair still mends an older document whose ticket lock lost its pin, and the read thaws that lock too.
// A plan's road is found without a solve when a road in the bundle (or one this page offered: a chip prepared with
// your rules) was solved under some of your windows with the same options and keeps all of yours (it is then optimal
// for yours too: roadFits); else the plan heals with one solve (POST /api/m/solve via api.solve, purpose 'heal',
// debounced 600 ms, §7.8).
// The hold (the user, 2026-10-08): your plan is your team as it is, no transfers unless you add them (holdOn). Memory puts the
// derived pin 'hold' first (holdOf, never stored): every GW where no pin of yours moves anyone rolls, a GW of exact
// moves of yours (a sale with its buy, a slide) holds the squad they make, a GW where a Wish or a hits rule of yours
// lets the planner choose is the planner's. Every plan under it is the solver's: a bundle road that fits, else a heal
// (the phone's evaluation of a plan your moves determine, holdRoad, went: the owner, 2026-10-26).
// The switch to the model's own plan with your rules ("Let Forkcast make your transfers") went (the user, 2026-10-19);
// ctx.planDefault 'model' (the node tests only; unset in the app) is that plan unless held (accepted.hold).
// Captain, vice, XI and bench are phone-only (the solver has no force-captain flag): accepted.lineup {xi, bench,
// captain, vice} is GW A's lineup on both screens (calls.planFromRoad / engine.applyLineup, F7).
// GW A is next and every later GW pencil (weekState). Ink (a frozen GW, always GW A..g: a week's squad comes from the
// weeks before it; its lineup kept in accepted.frozen_lineups) is an older document's: Freeze is gone (the user,
// 2026-10-12), and an older document's frozen weeks and their lineups are thawed on load (normalizeAccepted).
//
// The stored document (one per entry and GW; api/mobile.py memory_put keeps {entry, gw, accepted, ticket}):
//   accepted {at, roads_version (the roads the plan was made on), data_version, roads_taken [{call: 'transfer' |
//     'armband', road (key) | captain, label, not: [labels], at}], pins {must_have, exclude, items: [Pin]},
//     plan {key, item, version, values, weeks: [Week]} | null (null = the model's road), lineup {captain,
//     vice, bench} | null, chip, verdicts [{call, delta, votes, runs, noise, label, vs}], frozen [gw] (an older
//     document's frozen GWs, A..g), frozen_lineups {gw: {xi, bench, captain, vice}}, frozen_at {gw: {at, version}}
//     (when each froze, on which roads: B128), locked_at (an older reader's lock: GW A frozen; inkRepair still sets
//     it): all four emptied on load since Freeze went (normalizeAccepted), notes [{kind: 'kept' |
//     'adopted' | 'carried' | 'frozen' | 'locked', at, text, delta, label}]}
//   ticket: an older document's (the retired Lock in checklist: {ticks, bank_seen, locked, plan}); never written now.
//     A ticket all ticked still has its lock written back (inkRepair), which the read thaws again (normalizeAccepted),
//     so no GW reads as frozen (frozenNow passes frozenWeeks no ticket).
// This module is the document's only writer. Older documents (accepted.pins as plain strings, no plan; a window-wide
// 'hits' rule) are read through normalizeAccepted; a change made here writes the full shape and keeps every other key.
//
// ================================================================ live API
// attach(ctx) → Memory (one per page; attach() with no ctx returns it or null). Call it from every screen
//   or sheet that reads the plan. It follows ctx.store 'data' (a new bundle) and 'conn' and mirrors its snapshot
//   into ctx.store 'memory'. Writes go to the server at once (PUT /api/m/memory, kept per
//   browser by its X-Forkcast-Client id) and every document is mirrored in localStorage (fc:mem:<entry>), so
//   the plan still shows when the server is unreachable and unsent changes go once it answers.
// Memory:
//   getPlan() → Plan {entry, gw (A), gws, end, version (roads), doc, accepted, road (your plan's Road: the
//     accepted plan, else the model's base), model (base Road), source 'yours' | 'model', stale (solved on
//     older data), pins [Pin], must_have, exclude, hits ({gw: cap}: your restrictions), chips, cash, taken {transfer: key |
//     null (null when that key's road no longer has your GW-A squad), armband: id | null}, roads_taken, lineup, frozen
//     [gw], frozenLineups {gw: lineup}, locked (GW A frozen), lockedAt, frozenOn ({gw: {at, version}}: frozenOnOf)
//     (all empty since Freeze went: the read thaws an older document's), weeks [Week + state 'ink' | 'next' | 'pencil'
//     ('ink' none now)], drift (Drift | null), pending
//     ({purpose, state, key, position, since, edit? {gw, what, pins, at}: B141, the receipt of an edit made before a
//     reload whose check this is} while a heal solves) | null, error ({code, plain}) | null, saving,
//     carried (B2: what this page carried over from the GW before into GW A, COPY.carried; Ahead says it once) | null}
//   onChange(fn(plan, why)) → off. why: 'bundle' | 'take' | 'pins' | 'plan' | 'lineup' | 'lock' |
//     'drift' | 'heal' | 'error' | 'saved' | 'undo'
//   note({kind, text, cmp}) → {undo}: a journal note
//   addPin(pin, {replace = true}) → {ok, conflicts: [{pin, id, was, gws}], clash (one line), undo}; with
//     replace false a clash is returned, not applied (§7.9 "Which one?"). An ask that remakes GW A makes the road
//     pin yield its GW-A hold (yieldRoad: the call is then not in force, Plan.taken.transfer null); one that changes
//     GW A under way (its deadline passed) is refused instead: {ok: false, locked: true, clash: COPY.live(gw)} (a
//     frozen week's COPY.frozenEdit(gw) only for an older lock, which the read thaws)
//   inkOf([Pin]) → {gw: null, text} when one of the pins would change GW A under way ({gw, text} for a frozen week,
//     frozenClash: none since Freeze went), else null (Ahead asks first); inkClash([Pin]) → its text | null
//   removePin(id) → {undo} (a locked road pin: {refused: true}); restorePins(pins) (Undo: exactly these, in this order); clearPins({keepRoad = true}) → {undo} (the call's
//     road pin goes with its roads_taken entry; a locked one stays)
//   setLineup({xi, bench, captain, vice}) → {undo}: GW A's lineup (F7); setPlan(road, {why}) → {undo} (a road
//     you chose: Adopt); values({extra: [Pin], drop: [id]}) → engine.solveValues values for your pins as an edit
//     that drops `drop` and adds `extra` would leave them (pinsAfter; the edit not made)
//   setHitsMax(n) → {undo}: the hits Forkcast may take a week, every week (You → Hits; the user, 2026-10-12: "auto plan
//     allowed hits must be somewhere in settings"): 0 none, 1 up to −4, null the solver's own cap (Plan.hitsMax;
//     accepted.hits_max), sent by planValues as every solve's cap
//   offer(road): a road this page solved for some pins (a chip prepared with your rules, F14; a Wish pill): a re-plan
//     takes it as your plan when it fits your pins (findRoad / roadFits, as a bundle road), with no solve
//   noteEdit({what, dir, pins, edit}) / claimEdit() → the receipt of an edit Ahead is healing (dir: pinsDir of `pins` → yours,
//     what its verdict reads the planner's count against; QA-2: kept on this
//     device, so a heal that lands after a reload still says what your edit did, with Undo, and is never taken
//     for "new data re-planned your pencil weeks"); claimEdit takes it (Ahead's own verdict toast)
//   heal({purpose = 'heal', now}) → Promise<{state, road, error}>: solve your pins now (else debounced)
//   settled() → Promise that resolves once no plan heal is waiting or solving (or the server is away)
//   compare() → engine.compareRoads(your plan, the model's base) | null (Ahead's "Model's plan +0.8")
//   weekState(gw) → 'ink' | 'next' | 'pencil' | 'past'
//   pencilDiff() → {n, gws, items: [{gw, was: [Move], now: [Move]}], text: '2 changes in GW7–9'} | null:
//     what a re-plan changed in your pencil weeks since this device last looked; markSeen() clears it
//   forecastChange() → {version, gwA, pencil, held} | null: on the suggested plan (under the hold, the model's best road
//     the suggested plans follow), what a new forecast changed in its moves beyond the noise since this device last
//     looked at it (B14: Ahead's quiet line, then markSeen)
//   keepMine({text}) / adoptDrift() → {undo}: the drift toast's answers (ahead.driftSay: its action, through
//     switchWithUndo, adopts; leaving it any other way keeps yours) (text: the journal note, optional; keepMine's
//     note carries the new idea's gain, Drift.fresh with its freshLabel, never the whole gap); adoptDrift
//     keeps your rules and re-plans with them, and is refused ({refused: true}) when GW A is ink and the new best
//     would remake it (Drift.reach false: never since Freeze went, the read thawing every lock)
//   journal() → Promise<[JournalRow]> newest first ({gw, at, kind, text, not, label, delta}; GET ?gw=all)
//   detach()
// Drift (§7.7) {kind: 'drift' | 'kept' | 'same', version, gw, since (epoch s), sinceText ("10:23", "yesterday
//   18:05", "Tue 18:05"), cmp (compareRoads new best vs yours), delta, label, illegal [{code: 'status' | 'budget' |
//   'club', id?, gw, text}], what, main (the main difference in words, diffWords, or null), best (main, else 'the new
//   plan'), diff (planDiff items), same (the new best is your plan: only legality broke), locked, reach (false: GW A
//   is ink and the new best remakes it; no ink since Freeze went, so locked false and reach true),
//   broken (the ids of your rules the new best ignores, the hold's too) / ruleNames (yours by name, never the hold's),
//   fresh (what the new data gains: today's best against the
//   model's road your plan was made against; null when unknown; freshLabel its verdict), wins (the new best beats yours by that: else only
//   legality drifted), without ({id, name}: a player FPL now flags that the
//   forecast still plays, planWithout's "Plan without him", which nothing in js/m offers now), text (COPY.drift: the whole plan's verdict, then the
//   main difference; F1), mine, bestPlan (calls.planFromRoad results)}
// DOM (Ahead says the drift as a toast, ahead.driftSay, B22: Drift.text, COPY.drift with its head COPY.driftHead,
//   F10): switchWithUndo(ctx) [the toast's action, COPY.driftAct: "Use it" | "Re-plan with your rules" | "Keep only your
//   transfers"], planWithout(ctx, d) [Plan
//   without him: no caller in js/m]. ctx defaults to the attached memory's (Memory.ctx).
//
// ================================================================ pure exports (node: memory.test.mjs)
// parseSpans, spanString, composePins, pinConflicts, pinsDir, makePin, barredAt, changesGwA, yieldRoad, pinsAfter,
// holdOf, pinRoad, splitRoad, ticketSquad, lockPin, pinFrozen, frozenHolds, thawPin, frozenClash, frozenWeeks, frozenOnOf, frozenSince, inkRepair, pinWish, pinSell, pinSlide, pinVeto, pinNever, pinKeep, pinChip, pinCash, withBank,
// pinHits, squadInto, movesIn, pinRoll, isRoll, isExact, exactAt, scopeOf, carryPins, planValues, roadCaps, forcedHits, idleRules, bundleRoads, roadFits, optionPins, optionsRoad,
// optionsValues, brokenCells, rulesBroken, ruleText, findRoad, legality,
// detectDrift, sinceText, planDiff, diffWords, pencilChanges, movesChanged, lockNote, withLockNote, journalRows, madeOn, normalizeAccepted,
// createMemory

import * as E from '../plan/engine.js';
import { COPY, planInputs, planFromRoad, compare as compareIn, changeText, transfersOf, withForced, hitBook, hitCap, OUT, statusText, FORGET_MS } from './calls.js';
import { chipName, fin, fmt, statusInfo, toMs } from '../ui.js';

const EPS = 1e-6;
const SQUAD = Object.values(E.POS_LIMITS).reduce((s, [n]) => s + n, 0);  // 15: engine.POS_LIMITS' squad counts
/** §7.8: every heal waits 600 ms after the gesture ends; a dirty plan is flushed 250 ms after the last change. One
 *  object so the unit tests can shorten both (memory.test.mjs: 42 waits of 700 ms took 30 of its 34 s); the app
 *  never changes them. */
export const TIMING = { heal: 600, flush: 250 };
/** How long your choices are kept away from Forkcast (calls.js, beside the words that say it): app.js and the tests read
 *  it here. */
export { FORGET_MS };
const OFFERED_MAX = 24;  // roads offered (Memory.offer) kept per roads version: a window's chips × GWs and then some
// solves of exactly their values asked ahead (Memory.offer with `values`: ahead.js presolve) kept per roads version: a
// view's takes, your rules' Removes and an open sheet's taps (PRESOLVE_MAX each) and the views an Undo goes back to
const SOLVED_MAX = 48;
const LOCAL = (entry) => `fc:mem:${entry}`;
const SEEN = (entry) => `fc:mem:seen:${entry}`;
const EDIT = (entry) => `fc:mem:edit:${entry}`;
/** When this browser last used a team (ms: app.js seen, a touch, a key, the page hidden, while it is open). A team
 *  loaded here FORGET_MS after its last use, here or (editedAt: your last edit in its documents) on any device, starts
 *  as Reset plan leaves it, the server's copy too, with no Restore: signed in to after it (the user, 2026-10-14: "i
 *  signed to team B - why it still remember plan (wc) and not reset my plan"); a sign-out forgets it at once (forget). */
export const USED = (entry) => `fc:mem:used:${entry}`;
/** A team whose forgetting (forget) has not reached the server yet: its next load here starts as Reset plan leaves it. */
const FORGET = (entry) => `fc:mem:forget:${entry}`;

const num = (v) => (fin(v) ? Number(v) : null);
const ids = (xs) => (Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : []);
const range = (a, b) => (b >= a ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : []);
const nowS = () => Math.round(Date.now() / 1000);
const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
const weekAt = (road, gw) => (road?.weeks || []).find((w) => Number(w.gw) === Number(gw)) || null;
const squadOf = (w) => [...ids(w?.xi), ...ids(w?.bench)];
/** A set of player ids as one string (sorted): two squads are the same squad when their keys are. */
const idsKey = (xs) => ids(xs).sort((a, b) => a - b).join(',');
const squadKey = (w) => idsKey(squadOf(w));
/** A pin's kind, an older document's 'fork' read as what it was ('roll:<gw>' a Roll, else a hits rule). */
const kindOf = (p) => (p?.kind === 'fork' ? (String(p.id).startsWith('roll:') ? 'roll' : 'hits') : p?.kind);
/** Whether a pin is a Roll ('roll:<gw>', F13). */
export const isRoll = (p) => !!p && (kindOf(p) === 'roll' || String(p.id).startsWith('roll:'));
/** One of your exact moves (a sale with its buy, a slide): what the hold keeps in its week (holdOf), as an older plan's
 *  Auto-plan Off kept it (pinRoll's cap). */
export const isExact = (p) => (kindOf(p) === 'sell' && p.in != null) || kindOf(p) === 'slide';
/** Your exact moves of `list` made in GW g → [Pin]. */
export const exactAt = (list, g) => (list || []).filter((p) => p && isExact(p) && num(p.gw) === Number(g));
/** B20: the exact moves of yours a Roll keeps in its GW (pinRoll's k), 0 for "no transfers". */
export const rollKeeps = (p) => num(p?.caps?.[p.gw]) ?? 0;
const span = (gws) => COPY.span(gws);

// ================================================================ pins

const TOKEN = /^(\d{1,10})@(\d{1,2})-(\d{1,2})$/;  // api/mobile.py _TOKEN: a scoped id@a-b window

/** "id@a-b,…" (or [[id, a, b]]) → [[id, a, b]]. A bare "@g" would mean g..38 (player_data.py:960-964): refused. */
export function parseSpans(spec) {
  if (Array.isArray(spec)) return spec.map(([p, a, b]) => [Number(p), Number(a), Number(b)]);
  const out = [];
  for (const tok of String(spec ?? '').split(',').map((t) => t.trim()).filter(Boolean)) {
    const m = TOKEN.exec(tok);
    if (!m) throw new Error(`pins: ${tok} is not an id@a-b window`);
    out.push([Number(m[1]), Number(m[2]), Number(m[3])]);
  }
  return out;
}

/** [[id, a, b]] → "id@a-b,…" sorted by (id, a) with touching windows joined: api/mobile.py pins(), so equal
 *  plans give equal argv. Joining changes nothing for the solver (solve.py:326-347 holds every round). */
export function spanString(spans) {
  const merged = [];
  const sorted = parseSpans(spans).sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
  for (const [p, a, b] of sorted) {
    const last = merged.at(-1);
    if (last && last[0] === p && a <= last[2] + 1) last[2] = Math.max(last[2], b);
    else merged.push([p, a, b]);
  }
  return merged.map(([p, a, b]) => `${p}@${a}-${b}`).join(',');
}

/** A pin's hit caps over GW from..to: [[gw, cap]] (its `hits` map; an older window-wide `max_hits`: every GW). */
const capsOf = (pin, from, to) => (pin.hits ? Object.entries(pin.hits).map(([g, n]) => [Number(g), num(n) ?? 0])
  : (num(pin.max_hits) ?? 0) > 0 ? range(from, to).map((g) => [g, Number(pin.max_hits)]) : []).filter(([g]) => g >= from && g <= to);

/** The last GW up to g in which an exact sale of yours in `list` (a sale with its buy, a slide) sells player `id`, or
 *  -Infinity: composePins' B36 window for a buy of him starts there. */
const lastSale = (list, id, g) => Math.max(-Infinity, ...list.filter((p) => p && isExact(p) && num(p.gw) <= g
  && Number(kindOf(p) === 'slide' ? p.out : kindOf(p) === 'sell' ? p.player : NaN) === id).map((p) => num(p.gw)));

/** The bank the newest cash pin of `list` plans from (tenths), or null. */
const cashOf = (list) => list.reduce((cash, pin) => (pin && num(pin.cash) !== null ? num(pin.cash) : cash), null);

/**
 * Pins (oldest first) → the windows they ask for over GW from..to: {must_have, exclude (canonical strings),
 * must, excl ([[id, a, b]]), hits {gw: cap} (F13: the newest pin's per GW; none in a rolled GW; a GW without one takes
 * the solver's own default cap, F17), rolls [gw] (the GWs your Rolls make no transfer in, ascending), caps {gw: n} (at
 * most n transfers: the hold's, a Roll keeping your exact moves there), chips {gw: chip}
 * (newest per GW; a Wildcard or Free Hit GW takes no hits cap and no Roll: the chip makes every transfer free there),
 * cash (the newest), cells Map(id → Map(gw → {want, pin})), overridden [{pin, by, id, gw, was}] (cells a newer pin
 * took)}.
 */
export function composePins(list = [], { from = 1, to = E.LAST_ROUND } = {}) {
  const cells = new Map();
  const overridden = [];
  const chips = {};
  for (const pin of list) {
    for (const [g, c] of Object.entries(pin?.chips || {})) {
      if (Number(g) < from || Number(g) > to) continue;
      if (E.CHIPS.includes(c)) chips[g] = c; else delete chips[g];
    }
  }
  // A Free Hit week's fifteen is that week's alone: FPL gives the squad before it back the week after (holdOf keeps it
  // known across), so what you own is decided around it, never in it (the user, 2026-10-12, "why it forces anyone to
  // fh team": Scott → Xhaka from GW8 held Scott, 0%, in GW7's Free Hit and kept Xhaka out of it). There a must-have binds
  // only from a pin made for that week (a pick for it: Bring in a player there, a plan taken there, a Keep
  // "GW8"), never one carried in or running on past it (a Keep from GW A, a sale's buy, a dragged sale's or the hold's
  // "still yours": review 5, 2026-10-12), and only a veto, a Never or a window of that week alone keeps anyone out (a
  // sale's, a later buy's or the hold's "not before" does not)
  const fh = (g) => chips[g] === 'fh';
  const fhIn = (pin, g, a, b) => g === a && (b === g || kindOf(pin) === 'wish');
  const fhOut = (pin, g, a, b) => (a === g && b === g) || ['veto', 'never'].includes(kindOf(pin));
  // a pin holding a whole squad in a GW (a taken road at GW A, a week the hold holds): 15 must-haves that week. A newer ask that brings
  // someone else in that week releases the hold there (the solver picks who goes; else 16 are held and the solve is
  // infeasible). gw → {pin, ids}
  const holds = new Map();
  const release = (g) => {
    const hd = holds.get(g);
    for (const id of hd.ids) if (cells.get(id)?.get(g)?.pin === hd.pin && cells.get(id).get(g).want === 'in') cells.get(id).delete(g);
    holds.delete(g);
  };
  const hits = {};
  const rolls = new Set();
  const caps = {};  // gw → at most n transfers (the hold's: a week of your exact moves after a planner week, holdOf)
  for (const pin of list) {
    if (!pin) continue;
    const put = (id, g, want) => {
      if (!cells.has(id)) cells.set(id, new Map());
      const cur = cells.get(id).get(g);
      if (cur && cur.want !== want && cur.pin !== pin.id) overridden.push({ pin: cur.pin, by: pin.id, id, gw: g, was: cur.want });
      cells.get(id).set(g, { want, pin: pin.id });
    };
    const hold = kindOf(pin) === 'hold';
    const ins = new Map();  // gw → this pin's must-haves that week
    for (const [id, a, b] of parseSpans(pin.must || [])) {
      for (const g of range(Math.max(a, from), Math.min(b, to))) if (!fh(g) || (!hold && fhIn(pin, g, a, b))) (ins.get(g) || ins.set(g, new Set()).get(g)).add(id);
    }
    for (const [g, ids] of ins) if (holds.has(g) && holds.get(g).pin !== pin.id && [...ids].some((id) => !holds.get(g).ids.has(id))) release(g);
    for (const [g, ids] of ins) for (const id of ids) put(id, g, 'in');
    for (const [id, a, b] of parseSpans(pin.excl || [])) for (const g of range(Math.max(a, from), Math.min(b, to))) if (!fh(g) || (!hold && fhOut(pin, g, a, b))) put(id, g, 'out');
    // B36 / B20: your exact sale from GW g (a pick, isExact) is made in g, never sooner: the player it sells still yours
    // in g − 1 and the one it buys not before g (holdOf's rule for a week of yours after the planner's), so on the
    // suggested plan the planner can't sell him in GW6 and fill GW7 with a move of its own. L2 (the plans review,
    // 2026-10-11): "not before g" runs from his last exact sale of yours before g (a buy back: sold in GW7, bought again
    // in GW9), never over the weeks he was still yours. A Free Hit in g − 1: still yours in the last week before it (the
    // squad going into g), and the buy free to be in the Free Hit's fifteen
    const g1 = kindOf(pin) === 'sell' && isExact(pin) ? (num(pin.gw) ?? 0) - 1 : -1;
    if (g1 >= from && g1 <= to) {
      let own = g1;
      while (own >= from && fh(own)) own--;
      if (own >= from) put(Number(pin.player), own, 'in');
      for (const g of range(Math.max(from, lastSale(list, Number(pin.in), g1)), g1)) if (!fh(g)) put(Number(pin.in), g, 'out');
    }
    for (const [g, ids] of ins) if (ids.size >= SQUAD) holds.set(g, { pin: pin.id, ids });
    for (const [g, n] of capsOf(pin, from, to)) hits[g] = n;
    if (isRoll(pin)) {
      // B20: a Roll keeping your exact moves there (an older plan's Auto-plan Off, never "no transfer") caps its GW at those still yours, as the
      // hold caps such a week (holdOf); with none left it is "no transfers"
      const g = num(pin.gw) ?? 0, keep = Math.min(rollKeeps(pin), exactAt(list, g).length);
      if (g >= from && g <= to) { if (keep) caps[g] = keep; else rolls.add(g); }
    }
    for (const g of pin.rolls || []) if (Number(g) >= from && Number(g) <= to) rolls.add(Number(g));  // the hold's (holdOf)
    if (!isRoll(pin)) for (const [g, n] of Object.entries(pin.caps || {})) if (Number(g) >= from && Number(g) <= to) caps[Number(g)] = Number(n);
  }
  // F17: a Wildcard or Free Hit week: no hits cap and no Roll is sent for it (the chip makes every transfer free there)
  for (const [g, c] of Object.entries(chips)) if (c === 'wc' || c === 'fh') { delete hits[g]; rolls.delete(Number(g)); delete caps[g]; }
  for (const g of rolls) delete caps[g];  // a Roll is the tightest cap
  // a rolled GW makes no transfer (values.no_buys_gw), so no hit either: no cap of its own is sent (the bake's roll road is
  // solved with none, and stays the plan of your Roll)
  for (const g of rolls) delete hits[g];
  const cash = cashOf(list);
  const must = [], excl = [];
  for (const [id, byGw] of cells) for (const [g, { want }] of byGw) (want === 'in' ? must : excl).push([id, g, g]);
  const must_have = spanString(must), exclude = spanString(excl);
  return {
    must_have, exclude, must: parseSpans(must_have), excl: parseSpans(exclude), hits,
    rolls: [...rolls].sort((a, b) => a - b), caps, chips, cash, cells, overridden,
  };
}

/** The players `pin` moves in GW g on a plan whose squad going into g is `into` ([id]), once the pin's own GW g − 1
 *  holds there (a slide keeps the player it sells until then; a Never, a sale or a Wish from an earlier GW decides who
 *  goes into g): its cells in g that take a player the other way from that squad (a sale from g of one it has, a Wish or
 *  a slide arriving in g of one it hasn't). A Keep holds a player the squad has: it moves nobody. → [id] */
function movedAt(pin, g, into) {
  const cells = composePins([pin], { from: g - 1, to: g }).cells;
  const have = new Set(ids(into));
  for (const [id, byGw] of cells) { const w = byGw.get(g - 1)?.want; if (w === 'in') have.add(id); else if (w === 'out') have.delete(id); }
  const out = [];
  for (const [id, byGw] of cells) { const c = byGw.get(g); if (c && (c.want === 'in') !== have.has(id)) out.push(id); }
  return out;
}

/**
 * What adding `pin` would override in the pins already there: [{pin (the older Pin), id, was, gws}]. Windows clash
 * where they meet (a newer cell takes an older one the other way). A Roll of GW g (no transfers there) clashes with an
 * ask that moves someone in g (movedAt) on your plan (`into(g)`: the squad going into g, memory.squadInto), either
 * way round: a Roll added over a sale from g, or a sale from g added under the Roll (`was` 'roll'). An ask that wants
 * a player as that squad has him (a Keep, a Never, a sale or a Wish from an earlier GW) changes who goes into g, it
 * moves nobody in it: no clash. B20: a Roll that keeps k exact moves of yours in its GW clashes with none of them while
 * they are no more than k (a buy of yours swapped keeps the count). Without `into` no Roll clash is judged.
 */
export function pinConflicts(list, pin, { into = null, ...opts } = {}) {
  const others = (list || []).filter((p) => p.id !== pin.id);
  const by = new Map();
  const add = (older, id, was, g) => {
    const k = `${older?.id}|${id}`;
    if (!by.has(k)) by.set(k, { pin: older ?? null, id, was, gws: [] });
    by.get(k).gws.push(g);
  };
  for (const o of composePins([...others, pin], opts).overridden) {
    if (o.by === pin.id) add(others.find((p) => p.id === o.pin), o.id, o.was, o.gw);
  }
  if (into) {
    const inWindow = (g) => g !== null && g >= (opts.from ?? 1) && g <= (opts.to ?? E.LAST_ROUND);
    const g0 = num(pin.gw);
    const kept = (r, q, g, list) => isExact(q) && num(q.gw) === g && exactAt(list, g).length <= rollKeeps(r);
    // the squad a Roll of GW g leaves: going into g with the exact moves it keeps there made, so a later sale of a player
    // one of them buys in g holds him as the week already does (the user's phone, 2026-10-19: GW9's "Murillo → Hill"
    // took back GW8's "Only your transfers", which keeps the "Branthwaite → Murillo" that buys him)
    const leaves = (r, g, list) => {
      const s = new Set(ids(into(g)));
      for (const q of list.filter((x) => !isRoll(x) && kept(r, x, g, list))) {
        const [out, inn] = q.kind === 'slide' ? [q.out, q.player] : [q.player, q.in];
        s.delete(Number(out));
        if (inn != null) s.add(Number(inn));
      }
      return [...s];
    };
    if (isRoll(pin) && inWindow(g0)) for (const q of others.filter((x) => !isRoll(x) && !kept(pin, x, g0, others))) for (const id of movedAt(q, g0, leaves(pin, g0, others))) add(q, id, 'moves', g0);
    if (!isRoll(pin)) for (const r of others.filter(isRoll)) { const g = num(r.gw); if (inWindow(g) && !kept(r, pin, g, [...others, pin])) for (const id of movedAt(pin, g, leaves(r, g, [...others, pin]))) add(r, id, 'roll', g); }
  }
  return [...by.values()];
}

/**
 * Which way a change of your pins (`before` → `after`, each oldest first) moves the planner's freedom over GW from..to:
 * 'restrict' (every window and Roll of `before` still holds and no GW allows more hits: the new optimum can't beat the old by
 * the planner's count), 'relax' (the other way round), else null: nothing changed, windows went both ways, or a chip
 * or the cash differs (another plan, not a tighter or a looser one: a chip pin forces the chip). An edit's verdict
 * reads the planner's count against it (calls.changeText), so it is derived from the pins, never labelled by hand.
 */
export function pinsDir(before, after, { from = 1, to = E.LAST_ROUND } = {}) {
  const a = composePins(before, { from, to }), b = composePins(after, { from, to });
  const chipsKey = (c) => JSON.stringify(Object.entries(c.chips).sort());
  if (a.cash !== b.cash || chipsKey(a) !== chipsKey(b)) return null;
  // every cell of x is the same cell in y (y keeps all of x's windows)
  const within = (x, y) => [...x.cells].every(([id, byGw]) => [...byGw].every(([g, { want }]) => y.cells.get(id)?.get(g)?.want === want));
  // a GW with no hits rule takes the solver's own default cap, at least any rule's (F17: a rule restricts)
  const capAt = (x, g) => (x.rolls.includes(g) ? 0 : x.hits[g] ?? Infinity);  // a rolled GW takes no hit
  const fewerHits = (x, y) => range(from, to).every((g) => capAt(x, g) <= capAt(y, g));
  // a Roll is a restriction (no transfers in its GW), and so is a cap on them (B20: a Roll keeping your moves, the
  // hold's): y allows no more transfers than x in any GW
  const buysAt = (x, g) => (x.rolls.includes(g) ? 0 : x.caps[g] ?? Infinity);
  const fewerBuys = (x, y) => range(from, to).every((g) => buysAt(x, g) <= buysAt(y, g));
  const tighter = within(a, b) && fewerHits(b, a) && fewerBuys(b, a), looser = within(b, a) && fewerHits(a, b) && fewerBuys(a, b);
  return tighter === looser ? null : tighter ? 'restrict' : 'relax';
}

/** A pin, checked: its windows parsed (id@a-b), numbers as numbers. */
export function makePin({ id, kind, label = '', gw = null, must = [], excl = [], max_hits = 0, hits, chips, cash, at, ...meta } = {}) {
  if (!id || !kind) throw new Error('a pin needs an id and a kind');
  const pin = { ...meta, id: String(id), kind, label, gw: num(gw), must: parseSpans(must), excl: parseSpans(excl), max_hits: num(max_hits) ?? 0, at: num(at) ?? nowS() };
  if (hits && Object.keys(hits).length) pin.hits = Object.fromEntries(Object.entries(hits).map(([g, n]) => [String(Number(g)), num(n) ?? 0]));
  if (chips && Object.keys(chips).length) pin.chips = { ...chips };
  if (num(cash) !== null) pin.cash = num(cash);
  return pin;
}

/** The players your pins (the taken road's too) keep out in any GW from..to: Set(id). A buy the phone guesses
 *  for an edit (Ahead's Plan B, Replace, Wish) skips them: the solve would only sell them again (UX-1). */
export function barredAt(list, from, to = from) {
  return new Set(composePins(list || [], { from, to }).excl.map(([id]) => id));
}

/** The players a pin holds in (`must`) or keeps out (`excl`) at GW g: [id]. */
const heldAt = (spans, g) => parseSpans(spans || []).filter(([, a, b]) => a <= g && g <= b).map(([id]) => id);

/** Whether `pin` makes GW A something other than the road pin's GW-A squad: it brings in someone that squad
 *  hasn't, or keeps out someone it has (a sell, a slide, a veto, a wish), or rolls GW A (no transfers: GW A is `owned`,
 *  the entry's squad) where that squad has moves. */
export function changesGwA(roadPin, pin, A, owned = null) {
  if (!roadPin || !pin) return false;
  const squad = new Set(heldAt(roadPin.must, A));
  if (isRoll(pin) && num(pin.gw) === A) return owned != null && idsKey([...squad]) !== idsKey(owned);
  return heldAt(pin.must, A).some((id) => !squad.has(id)) || heldAt(pin.excl, A).some((id) => squad.has(id));
}

/** The road pin once an ask from Ahead remade GW A: its GW-A squad hold goes (else a GW-A buy would make 16
 *  must-haves), its other windows stay (a veto road's exclude, a slide's later weeks). The call it records is
 *  then not in force (Plan.taken.transfer null) until a road is taken again. */
export const yieldRoad = (rp, A) => ({ ...rp, must: parseSpans(rp.must).filter(([, a, b]) => !(a === A && b === A)), yielded: true });

/**
 * The pins (oldest first) after an edit drops `drop` (ids, or a predicate) and then adds `add`, as Memory.removePin /
 * clearPins and addPin make it: a dropped road pin takes the rules it came with (`via`) along, a locked one (ink) never
 * goes; an added pin replaces the one with its id and goes last, and one that remakes GW A makes an unlocked road pin
 * yield its GW-A hold (yieldRoad; A: GW A, owned: the entry's squad, changesGwA). The one rule for the pins an edit makes
 * and the values a solve of that edit sends before it is made (Memory.values {extra, drop}: F14's chip preparations, a
 * Wish pill), so the two are the same.
 */
export function pinsAfter(list = [], { add = [], drop = [] } = {}, A = null, owned = null) {
  const off = typeof drop === 'function' ? drop : (p) => drop.includes(p.id);
  const ink = (p) => p.id === 'road' && !!p.locked;
  const road = list.some((p) => p.id === 'road' && !ink(p) && off(p));
  let out = list.filter((p) => ink(p) || !(off(p) || (road && p.via)));
  for (const pin of add) {
    const rp = out.find((x) => x.id === 'road');
    const yields = A != null && !!rp && !rp.yielded && !rp.locked && changesGwA(rp, pin, A, owned);
    out = [...out.filter((x) => x.id !== pin.id).map((x) => (yields && x.id === 'road' ? yieldRoad(x, A) : x)), pin];
  }
  return out;
}

/** "g:n,…" (a road's values.max_hits_gw) → {g: n}. */
const parseCaps = (spec) => Object.fromEntries(String(spec ?? '').split(',').map((t) => t.trim().split(':').map(Number))
  .filter(([g, n]) => Number.isFinite(g) && Number.isFinite(n)).map(([g, n]) => [String(g), n]));

/** The road you took for GW A (§7.7 "pins come from taken roads"): its own windows plus its GW-A squad for GW A. */
export function pinRoad(road, A, { key, label = '' } = {}) {
  const v = road?.values || {};
  const chips = {};
  for (const c of E.CHIPS) for (const g of [].concat(v[c] ?? []).map(String)) if (g !== '0' && Number(g)) chips[g] = c;
  return makePin({
    id: 'road', kind: 'road', key: key ?? road?.item ?? road?.key ?? null, label, gw: A,
    must: [...parseSpans(v.must_have || ''), ...squadOf(weekAt(road, A)).map((p) => [p, A, A])],
    excl: parseSpans(v.exclude || ''), max_hits: num(v.max_hits) ?? 0, hits: parseCaps(v.max_hits_gw), chips, cash: v.cash,
  });
}
/**
 * QA-1: a road pin holds only its GW-A squad; every other window it carries (the variant's vetoes, the −4 road's
 * hits, a chip, cash, a later must-have) becomes a rule of its own, marked `via` (the road's key), so each shows
 * as a chip ("✕ Not Groß"), can be removed, and goes back with the call when another road is taken. end: the
 * plan's last GW (an older road's window-wide hits are a −4 rule in each GW A..end).
 * → [road pin, ...rules] (the pin unchanged, alone, when it carries nothing else).
 */
export function splitRoad(rp, A, end = A) {
  if (!rp) return [];
  // a frozen pin holds each frozen GW's squad and chip (pinFrozen); the rest it carries is split as any road pin's
  const F = rp.locked ? pinFrozen(rp, A) : [A];
  const last = F.at(-1);
  const holds = F.flatMap((g) => [...new Set(heldAt(rp.must, g))].map((p) => [p, g, g]));
  const hold = [...new Set(heldAt(rp.must, A))];
  const later = parseSpans(rp.must || []).filter(([, a, b]) => !(a === b && F.includes(a))).map(([id, a, b]) => [id, Math.max(a, last + 1), b]).filter(([, a, b]) => a <= b);
  const excl = parseSpans(rp.excl || []);
  const chips = Object.entries(rp.chips || {}).filter(([g, c]) => c && !(rp.locked && F.includes(Number(g))));
  // every cap it was solved under is a restriction of yours (F17), Free only (0) too
  const caps = capsOf(rp, A, end);
  if (!later.length && !excl.length && !caps.length && !chips.length && rp.cash == null) return [rp];
  const via = String(rp.key ?? 'road');
  const kept = rp.locked ? Object.fromEntries(Object.entries(rp.chips || {}).filter(([g]) => F.includes(Number(g)))) : {};
  const pin = { ...rp, must: holds, excl: [], max_hits: 0 };
  delete pin.hits;
  delete pin.chips;
  delete pin.cash;
  if (Object.keys(kept).length) pin.chips = kept;
  const byPlayer = (spans) => {
    const m = new Map();
    for (const sp of spans) (m.get(sp[0]) || m.set(sp[0], []).get(sp[0])).push(sp);
    return [...m];
  };
  const from = (spans) => Math.min(...spans.map(([, a]) => a));
  const rules = [
    ...byPlayer(excl).map(([id, sp]) => makePin({ id: `out:${id}`, kind: 'veto', player: id, gw: from(sp), excl: sp, via })),
    ...byPlayer(later).map(([id, sp]) => (hold.includes(id)
      ? makePin({ id: `keep:${id}`, kind: 'keep', player: id, gw: from(sp), must: sp, via })
      : makePin({ id: `wish:${id}`, kind: 'wish', player: id, gw: from(sp), must: sp, via }))),
    ...caps.map(([g, n]) => pinHits(n, g, { via })),
    ...chips.map(([g, c]) => pinChip(Number(g), c, { via })),
    ...(rp.cash != null ? [pinCash(rp.cash, { via })] : []),
  ];
  return [pin, ...rules];
}

/** A pin list whose road pin carries windows of its own (a document from before QA-1, or a lock of one): split
 *  (splitRoad), its rules after it, never replacing a pin of yours with the same id. */
function splitItems(items, A, end) {
  const i = items.findIndex((p) => p.id === 'road');
  if (i < 0) return items;
  const [pin, ...rules] = splitRoad(items[i], A, end);
  if (!rules.length) return items;
  const have = new Set(items.map((p) => p.id));
  return [...items.slice(0, i), pin, ...rules.filter((r) => !have.has(r.id)), ...items.slice(i + 1)];
}

/** An older document's ticket's GW-A squad (ticket.plan of the retired Lock in checklist: xi + bench): [id] (empty
 *  unless all 15 are there). */
export const ticketSquad = (plan) => {
  const s = [...ids(plan?.xi), ...ids(plan?.bench)];
  return s.length === SQUAD ? s : [];
};

/** The GWs a frozen road pin holds (its `frozen`; an older document's lock: GW A alone), ascending. */
export const pinFrozen = (rp, A) => (!rp?.locked ? [] : Array.isArray(rp.frozen) && rp.frozen.length ? rp.frozen.map(Number).sort((a, b) => a - b) : [A]);

/**
 * The road pin of frozen weeks (ink: "Freeze GW6" made it until 2026-10-12; now only inkRepair, from an older
 * document's ticket, and thawPin's kept weeks, both thawed on read by normalizeAccepted): each frozen GW g held as its squad `squads[g]` (15 must-haves
 * that week) and its chip `chips[g]` ('none': no chip there), `locked` (no ask, Adopt, Switch or clearPins remakes
 * it) and `frozen` [g]; the call's own windows after the last frozen GW kept. squads: {gw: [id]}, or one squad: GW A's
 * (an older "Lock in GW6"). Frozen weeks are always GW A..g (a week's squad comes from the weeks before it).
 */
export function lockPin(rp, squads, A, key = 'base', chips = null) {
  const by = Array.isArray(squads) ? { [A]: squads } : squads || {};
  const gws = Object.keys(by).map(Number).filter((g) => by[g]?.length).sort((a, b) => a - b);
  const last = gws.length ? gws.at(-1) : A;
  // the frozen GWs are the squads held there; the call's other windows count from the week after (none may overlap a hold)
  const after = (spans) => parseSpans(spans || []).filter(([, , b]) => b > last).map(([p, a, b]) => [p, Math.max(a, last + 1), b]);
  const ch = Object.fromEntries(gws.filter((g) => chips && g in chips).map((g) => [String(g), chips[g] ?? 'none']));
  const pin = makePin({
    ...(rp || {}), id: 'road', kind: 'road', key: rp?.key ?? key, label: rp?.label || 'Frozen', gw: A,
    must: [...after(rp?.must), ...gws.flatMap((g) => by[g].map((p) => [Number(p), g, g]))], excl: after(rp?.excl), locked: true, yielded: false,
    frozen: gws, chips: Object.keys(ch).length ? ch : undefined,
  });
  if (!Object.keys(ch).length) delete pin.chips;
  return pin;
}

/** A frozen road pin's holds: {squads: {gw: [id]}, chips: {gw: chip | 'none'}} (pinFrozen's weeks). */
export function frozenHolds(rp, A) {
  const gws = pinFrozen(rp, A);
  return {
    squads: Object.fromEntries(gws.map((g) => [g, heldAt(rp.must, g)])),
    chips: Object.fromEntries(gws.filter((g) => rp.chips?.[g] != null).map((g) => [g, rp.chips[g]])),
  };
}

/** The frozen road pin `rp` (its GW A `from`) holding only its weeks `keep`, each with its squad and chip, as a pin of
 *  the plan whose GW A is `A` (thawPin: the weeks before an unfrozen one). */
function frozenPart(rp, keep, from, A = from) {
  const { squads, chips } = frozenHolds(rp, from);
  return lockPin({ ...rp, must: [], excl: [], chips: undefined }, Object.fromEntries(keep.map((x) => [x, squads[x]])), A, rp.key, Object.fromEntries(keep.filter((x) => x in chips).map((x) => [x, chips[x]])));
}

/** A frozen road pin with GW g on unfrozen (g..end: a week's squad comes from the weeks before it, so a later week
 *  can't stay frozen over an unfrozen one): the holds of g on go; with none left, the pin is the call's again (unlocked,
 *  its GW-A squad its hold, as an unticked lock was) or null when it held nothing else. */
export function thawPin(rp, g, A) {
  if (!rp?.locked) return rp ?? null;
  const keep = pinFrozen(rp, A).filter((x) => x < g);
  if (keep.length) return frozenPart(rp, keep, A);
  const { squads } = frozenHolds(rp, A);
  const { frozen, chips: _c, ...rest } = rp;
  return makePin({ ...rest, must: (squads[A] || []).map((p) => [p, A, A]), excl: [], locked: false });
}

/**
 * §7.7 ink: the first frozen GW `pin` would change (the frozen road pin `rp`'s weeks), else null: one that brings
 * someone in that a frozen week's squad hasn't, or keeps out someone it has; a Roll, a hits rule or a chip of a frozen
 * GW (its transfers and chip are held as they are); a Roll of a frozen GW whose squad differs from the one before it.
 */
export function frozenClash(rp, pin, A) {
  const gws = pinFrozen(rp, A);
  if (!gws.length || !pin) return null;
  for (const g of gws) {
    const squad = new Set(heldAt(rp.must, g));
    if (heldAt(pin.must, g).some((id) => !squad.has(id)) || heldAt(pin.excl, g).some((id) => squad.has(id))) return g;
    const own = num(pin.gw) === g && (isRoll(pin) || ['hits', 'chip'].includes(kindOf(pin)));
    if (own || Object.keys(pin.hits || {}).map(Number).includes(g) || (pin.chips && g in pin.chips && pin.chips[g] !== (rp.chips?.[g] ?? 'none'))) return g;
  }
  return null;
}

/** GW A's deadline has passed (the bundle's meta.deadline_epoch): FPL has GW A, Forkcast edits it no more (ahead.isLive,
 *  inkClash). */
export const deadlinePassed = (meta, now = Date.now()) => {
  const ms = toMs(meta?.deadline_epoch);
  return Number.isFinite(ms) && now >= ms;
};

/** The GWs frozen in a document (accepted.frozen within A..end; an older document's lock, accepted.locked_at or a ticket
 *  all ticked: GW A), ascending. */
export function frozenWeeks(acc, A, end = A, ticket = null) {
  const f = Array.isArray(acc?.frozen) ? acc.frozen.map(Number).filter((g) => g >= A && g <= end).sort((a, b) => a - b) : [];
  if (f.length) return f;
  return acc?.locked_at || ticket?.locked ? [A] : [];
}

/** B128: when each of the `frozen` GWs froze and on which roads version, {gw: {at (epoch s), version}}: accepted.frozen_at
 *  (freeze), else an older document's locked_at (the first freeze; version unknown); a week with neither has none. */
export function frozenOnOf(acc, frozen = []) {
  const at = (g) => acc?.frozen_at?.[g] ?? (acc?.locked_at ? { at: acc.locked_at, version: null } : null);
  return Object.fromEntries(frozen.map((g) => [g, at(g)]).filter(([, x]) => x));
}
/** GW g's freeze in words (frozenOn: Plan.frozenOn): {at: "Tue 21:40" (sinceText) | null, newer: the plan's roads
 *  (`version`) are not the ones it froze on}: COPY.frozenEdit's time (an older plan's; Freeze is gone, 2026-10-12). */
export function frozenSince(frozenOn, g, version = null) {
  const f = frozenOn?.[g];
  return { at: f?.at ? sinceText(f.at) : null, newer: !!f?.version && !!version && f.version !== version };
}

/**
 * F5 (ink = what the ticket says): a document whose ticket is locked (every step ticked: those transfers are in
 * FPL) but whose plan, road pin or transfer call has another GW-A squad (an older "Switch to the new best" kept
 * the ticket and dropped the call) → its accepted repaired: the road pin holds the ticket's squad (locked), the
 * call is the bundle road with that GW A (when one has it) and the plan that road (else null: it re-plans). null
 * when the document is consistent. roads: the bundle's roads. Since Freeze went (2026-10-12) the read thaws the lock
 * it writes (normalizeAccepted: its road pin unlocked, locked_at null).
 */
export function inkRepair(doc, { A, roads, nameOf = (id) => `#${id}` } = {}) {
  const acc = doc?.accepted, t = doc?.ticket;
  const squad = ticketSquad(t?.plan);
  if (!acc || !t?.locked || !squad.length || Number(t.plan.gw ?? A) !== A) return null;
  const key = [...squad].sort((a, b) => a - b).join(',');
  const items = Array.isArray(acc.pins?.items) ? acc.pins.items : [];
  const rp = items.find((p) => p.id === 'road');
  const pinOk = rp?.locked && heldAt(rp.must, A).sort((a, b) => a - b).join(',') === key;
  const planOk = !acc.plan?.weeks || squadKey(weekAt(acc.plan, A)) === key;
  if (pinOk && planOk && acc.locked_at) return null;
  const match = Object.entries({ base: roads?.base, roll: roads?.roll,
    ...Object.fromEntries(Object.entries(roads?.veto || {}).map(([k, r]) => [`veto:${k}`, r])) })
    .find(([, r]) => r?.weeks && squadKey(weekAt(r, A)) === key);
  const call = (acc.roads_taken || []).find((x) => x.call === 'transfer');
  const keyOf = match?.[0] ?? call?.road ?? 'yours';
  const pin = lockPin(rp && heldAt(rp.must, A).sort((a, b) => a - b).join(',') === key ? rp : null, squad, A, keyOf);
  const others = items.filter((p) => p.id !== 'road');
  const out = { ...acc, locked_at: acc.locked_at ?? nowS(), locked_by: acc.locked_by ?? 'ticket', pins: { ...(acc.pins || {}), items: [pin, ...others] } };
  if (match && call?.road !== match[0]) {
    const ins = ids(weekAt(match[1], A).in);
    const label = ins.length ? `${ins.map(nameOf).join(' + ')} in` : 'Roll';
    // a call the repair names is as old as the plan (editedAt: a repair on load is no use of the team)
    out.roads_taken = [...(acc.roads_taken || []).filter((x) => x.call !== 'transfer'), { ...(call || { call: 'transfer', at: num(acc.at) ?? nowS() }), road: match[0], label, not: [] }];
    out.verdicts = (acc.verdicts || []).filter((v) => v.call !== 'transfer');
  }
  if (!planOk || !pinOk) out.plan = null;
  return out;
}

export const pinWish = (id, gw, end, { label } = {}) => makePin({ id: `wish:${id}`, kind: 'wish', player: Number(id), label, gw, must: [[id, gw, end]] });
/** A2: `funds` (a player id) marks a sale made so that buy fits (Ahead's "Do both"): its row says so, and its × takes
 *  that buy with it, named in the toast (ahead.removeMove). */
export const pinSell = (out, gw, end, { in: inn = null, label, funds = null } = {}) => makePin({
  ...(num(funds) !== null ? { funds: num(funds) } : {}),
  id: `sell:${out}`, kind: 'sell', player: Number(out), in: num(inn), label, gw, excl: [[out, gw, end]], must: inn == null ? [] : [[inn, gw, end]],
});
/** The bake's slide windows (api/mobile.py bake_plan): in held from g, out until g − 1, and neither the other way. */
export const pinSlide = (inn, out, g, A, end, { label } = {}) => makePin({
  id: `slide:${inn}`, kind: 'slide', player: Number(inn), out: Number(out), label, gw: g,
  must: [[inn, g, end], ...(g > A ? [[out, A, g - 1]] : [])], excl: [...(g > A ? [[inn, A, g - 1]] : []), [out, g, end]],
});
/** F11: a Keep or a veto for GW g only (scope 'gw': the window g..g, id '<kind>:<player>@<g>', so one per GW can
 *  stand beside another), or from g to the end (scope 'all', the default: one per player). */
const scoped = (prefix, id, g, end, scope) => (scope === 'gw' ? { id: `${prefix}:${id}@${g}`, span: [[id, g, g]], scope } : { id: `${prefix}:${id}`, span: [[id, g, end]], scope: 'all' });
export function pinVeto(id, A, end, { label, kind = 'veto', scope = 'all', ...o } = {}) {
  const s = scoped('out', id, A, end, scope);
  return makePin({ ...o, id: s.id, kind, scope: s.scope, player: Number(id), label, gw: A, excl: s.span });
}
export const pinNever = (id, A, end, o = {}) => pinVeto(id, A, end, { ...o, kind: 'never' });
export function pinKeep(id, from, end, { label, scope = 'all', ...o } = {}) {
  const s = scoped('keep', id, from, end, scope);
  return makePin({ ...o, id: s.id, kind: 'keep', scope: s.scope, player: Number(id), label, gw: from, must: s.span });
}
/** A rule's window in words (F11): "GW6" (one GW), "all weeks" (start..end), "from GW8" (to the end), else "GW6–8".
 *  start / end: the plan's first and last GW. */
export function scopeOf(p, { start, end } = {}) {
  const w = [...parseSpans(p?.must || []), ...parseSpans(p?.excl || [])].filter(([id]) => id === Number(p?.player));
  if (!w.length) return '';
  const a = Math.min(...w.map(([, x]) => x)), b = Math.max(...w.map(([, , y]) => y));
  if (a !== b && end != null && b >= end) return start != null && a <= start ? 'all weeks' : `from GW${a}`;
  return COPY.range(a, b);
}
/** A chip in GW gw (null takes it out: composePins drops the GW). */
export const pinChip = (gw, chip, o = {}) => makePin({ ...o, id: `chip:${gw}`, kind: 'chip', gw, chips: { [gw]: chip ?? 'none' } });
/** --cash in tenths (calls.cashTenths: £0.0m goes as £0.1m, rolling.py:592-593). */
export const pinCash = (tenths, o = {}) => makePin({ ...o, id: 'cash', kind: 'cash', cash: tenths });

const BANKED = new WeakMap();
/**
 * The engine base your plan starts GW A from: the entry's, with the bank your "Bank as FPL shows" rule plans from
 * (pinCash: the --cash the solve starts from, the newest as composePins reads it) when you set one. The one source of
 * every bank the phone shows (ahead.baseOf: the week line, the rail, Replace) and of the drift's budget check (QA:
 * a plan re-planned from FPL's bank never shows beside the entry's). Memoised per base and cash, so views keyed on it
 * stay put. → base
 */
export function withBank(base, pins) {
  const cash = cashOf(pins || []);
  if (!base || cash === null) return base;
  let by = BANKED.get(base);
  if (!by) BANKED.set(base, (by = new Map()));
  if (!by.has(cash)) by.set(cash, { ...base, bank: cash / 10 });
  return by.get(cash);
}
/** At most n hits in GW gw (F13): sent as --max-hits-gw "gw:n" (main.py max_hits_gw: the round's own cap in place of
 *  the default). F17: a restriction below the solver's own default cap (meta.hit_cap; a GW with no rule takes it). n 0
 *  is no hit there. Made by splitRoad and Ahead's forkValues (a week's Auto-plan, which made it too, is gone:
 *  2026-10-12). */
export const pinHits = (n, gw, o = {}) => makePin({ ...o, id: `hits:${gw}`, kind: 'hits', gw, hits: { [gw]: n } });

/** A road's week as squadInto reads it: gw → {squad, chip} | null. */
const roadWeek = (road) => (x) => { const w = weekAt(road, x); return w ? { squad: squadOf(w), chip: w.chip ?? null } : null; };

/** Whether `road` makes a transfer in GW g (more than n: B20, a Roll keeping n moves of yours there): its week there
 *  buys or sells someone (a Road week's in / out are the solver's net moves against the squad going into g: team.py
 *  apply_solution), or a wildcard or a free hit remakes it; a GW it doesn't plan counts (it can't be shown to roll).
 *  What a Roll forbids (rulesBroken, roadFits). */
export function movesIn(road, g, n = 0) {
  const w = weekAt(road, g);
  return !w || w.chip === 'wc' || w.chip === 'fh' || ids(w.in).length > n || ids(w.out).length > n;
}

/** The squad going into GW g's moves on a plan: the week before's (a free hit's is thrown away after it: team.py:161,
 *  175), else GW A's own (`owned`: before GW A, or past the plan's weeks). weekOf(gw) → {squad, chip} | null: Ahead's
 *  plan view (squadBefore) and plan memory's (a Roll's clashes, pinConflicts' into) read it by this one rule. */
export function squadInto(weekOf, g, A, owned = []) {
  for (let x = Number(g) - 1; x >= A; x--) {
    const w = weekOf(x);
    if (!w) return owned;
    if (w.chip !== 'fh') return w.squad;
  }
  return owned;
}

/**
 * "Roll GW g" (F13): no transfers in GW g, whatever earlier weeks do. Sent as values.no_buys_gw (planValues: the tap's
 * --no-buys-gw, Rules.buys_max_at {g: 0}: the solver itself makes no buy there), so it holds no player and is never
 * stale: an edit of an earlier week only changes who goes into g. composePins lists g in `rolls` (and caps its hits at
 * 0); a road keeps it when it moves nobody in g (movesIn). B20, Auto-plan Off with k exact moves of yours in GW g (the
 * user, 2026-10-08: Off was "Forkcast adds no transfers of its own", never "no transfer"): those moves stay and GW g is
 * capped at them (composePins' `caps`, values.max_buys_gw, as the hold caps such a week), k the most it keeps.
 * Made by a suggested plan's + (ahead.addPlan) and in a fork's solve (ahead.forkValues): the user, 2026-10-13, "Lock it,
 * both modes" (the week is exactly the choice, whoever makes the rest).
 */
export const pinRoll = (g, k = 0) => makePin({ id: `roll:${g}`, kind: 'roll', gw: g, label: COPY.rollRule(g, k), ...(k > 0 ? { caps: { [g]: k } } : {}) });

/**
 * The pins a GW's plan hands to the next one once its deadline passes: your asks for later GWs, clipped to
 * start at the new GW. A Keep or a veto of every week (scope 'all': Ruled out, Keep · all weeks, a Keep from GW8) runs
 * to the new window's end (B10, saffer Part 3 §2: it kept its old end, so the week the window gained could buy him
 * again while the card still read Ruled out); any other keeps its own end. The road you took (that GW's call) and the
 * rules it came with, cash (the bank moved on) and past chips stay behind.
 */
export function carryPins(prevDoc, A, end) {
  const out = [];
  for (const p of prevDoc?.accepted?.pins?.items || []) {
    if (p.kind === 'road' || p.kind === 'cash' || p.via) continue;  // the call and the rules it came with stay
    const clip = (xs) => parseSpans(xs || []).map(([id, a, b]) => [id, Math.max(a, A), p.scope === 'all' ? end : Math.min(b, end)]).filter(([, a, b]) => a <= b);
    const chips = Object.fromEntries(Object.entries(p.chips || {}).filter(([g]) => Number(g) >= A && Number(g) <= end));
    const hits = Object.fromEntries(capsOf(p, A, end));
    const must = clip(p.must), excl = clip(p.excl);
    const roll = isRoll(p) && num(p.gw) >= A && num(p.gw) <= end;
    if (!roll && !must.length && !excl.length && !Object.keys(chips).length && !Object.keys(hits).length) continue;
    const { chips: _c, hits: _h, ...rest } = p;
    out.push({ ...rest, must, excl, max_hits: 0, ...(Object.keys(chips).length ? { chips } : {}), ...(Object.keys(hits).length ? { hits } : {}), gw: p.gw === null ? null : Math.max(p.gw, A) });
  }
  return out;
}

// ================================================================ the default plan: your team, no transfers

/**
 * "No transfers unless you add them" (the user, 2026-10-08: a new plan is your team as it is, every GW rolled; the
 * model's moves are suggestions you add one by one): the pin 'hold' derived from your pins `list` (never stored: Memory
 * puts it first while the plan holds, accepted.hold). Over GW A..end, the squad going into each GW known from yours:
 *   · a GW where no pin of yours moves anyone (movedAt) is rolled (no transfer: values.no_buys_gw);
 *   · a GW whose moves are all exact ones of yours (a sale with its buy, a slide) holds the squad they make (15
 *     must-haves that week: the planner adds no transfer of its own there);
 *   · a GW whose moves are yours but a sale the plan picks the buy for (Replace's "Let Forkcast choose") holds the
 *     rest of the squad, the planner choosing only that buy (its buys capped at your moves); after it the squad is the
 *     solve's;
 *   · a GW where another ask moves someone (a Wish, a veto of a player you have), or
 *     a hits rule lifts the hold (the planner plans that week: one a split road brings, splitRoad, or Ahead's
 *     forkValues adds), is the planner's; after it the
 *     squad is no longer known, so a later week of exact moves is the planner's too (under no hit: hits 0);
 *   · a Wildcard or Free Hit week is the chip's (a Free Hit's squad is thrown away: the squad after it stays known); a
 *     Roll (a suggested plan's +, addPlan) keeps its own, as a frozen week (the road pin's hold) did (an older
 *     document's: thawed on load since 2026-10-12, normalizeAccepted).
 * Every plan under it is the solver's (replan), never the engine's evaluation of your moves (holdRoad went: the owner,
 * 2026-10-26). → {pin (or null: nothing to hold)}
 */
export function holdOf(list = [], { A, end, owned = [] } = {}) {
  const user = (list || []).filter((p) => p && p.id !== 'hold');
  const c = composePins(user, { from: A, to: end });
  const rp = user.find((p) => p.id === 'road' && p.locked);
  const frozen = rp ? pinFrozen(rp, A) : [];
  let squad = ids(owned), known = true;
  const rolls = [], must = [], excl = [], hits = {}, caps = {};
  for (const g of range(A, end)) {
    const chip = c.chips[g];
    if (frozen.includes(g)) {
      // a frozen week (an older document's) holds its own squad; one that makes no transfer is a rolled week too
      const held = heldAt(rp.must, g);
      if (known && idsKey(held) === idsKey(squad)) rolls.push(g);
      squad = held; known = true;
      continue;
    }
    if (chip === 'wc') { known = false; continue; }
    if (chip === 'fh') continue;
    if (c.rolls.includes(g)) continue;  // your Roll: no transfer there
    const free = user.some((p) => kindOf(p) === 'hits' && Object.keys(p.hits || {}).map(Number).includes(g));
    // L3 (the plans review, 2026-10-11: a buy resold the next week made GW6 a 16-player hold): an exact move of yours
    // moves someone in its own GW only (its "still yours in g − 1" is the week before's, not a move there)
    const moving = known ? user.filter((p) => !['road', 'chip', 'cash', 'hits', 'roll'].includes(kindOf(p)) && (!isExact(p) || num(p.gw) === g) && movedAt(p, g, squad).length)
      : user.filter((p) => ['sell', 'slide', 'wish'].includes(kindOf(p)) && num(p.gw) === g);
    if (!free && !moving.length) { rolls.push(g); continue; }
    if (!free && known && moving.every(isExact)) {
      const outs = new Set(moving.map((p) => Number(kindOf(p) === 'slide' ? p.out : p.player)));
      const ins = moving.map((p) => Number(kindOf(p) === 'slide' ? p.player : p.in));
      squad = [...squad.filter((x) => !outs.has(x)), ...ins.filter((x) => !squad.includes(x))];
      must.push(...squad.map((x) => [x, g, g]));
      continue;
    }
    // a sale of yours whose buy Forkcast picks (Replace's "Let Forkcast choose", ahead.sellAny; the user, 2026-10-13:
    // "only add player to must sell list and let model choose alternative"), with any exact moves of yours that week: the
    // rest of the squad stays that week (must-haves) and the week takes no more buys than your moves (caps: the tap's
    // --max-buys-gw), so the planner picks the one buy for each such sale and nothing else; the squad after it is the
    // solve's
    const open = (p) => kindOf(p) === 'sell' && p.in == null;
    if (!free && known && moving.some(open) && moving.every((p) => isExact(p) || open(p))) {
      const outs = new Set(moving.map((p) => Number(kindOf(p) === 'slide' ? p.out : p.player)));
      const ins = moving.filter(isExact).map((p) => Number(kindOf(p) === 'slide' ? p.player : p.in));
      must.push(...[...squad.filter((x) => !outs.has(x)), ...ins.filter((x) => !squad.includes(x))].map((x) => [x, g, g]));
      caps[g] = moving.length;
      known = false;
      continue;
    }
    // a week of your exact moves after a week the planner chose (its squad unknown): those moves, in that week only
    // (the review, 2026-10-08: GW6 set to "FT only" pulled a GW7 transfer of yours into GW6, gave GW7 another and set
    // it to FT only): each sale kept until then and each buy not made before, the week capped at your moves
    // (values.max_buys_gw, the tap's --max-buys-gw). Its squad stays unknown: the weeks after are as before
    if (!free && !known && moving.length && moving.every(isExact)) {
      for (const p of moving) {
        const o = Number(kindOf(p) === 'slide' ? p.out : p.player), i = Number(kindOf(p) === 'slide' ? p.player : p.in);
        if (g > A) {
          must.push([o, ids(owned).includes(o) ? A : g - 1, g - 1]);
          excl.push([i, A, g - 1]);
        }
      }
      caps[g] = moving.length;
      continue;
    }
    // the planner's week: its squad is the solve's
    if (!free && !known) hits[g] = 0;
    known = false;
  }
  if (!rolls.length && !must.length && !excl.length && !Object.keys(hits).length && !Object.keys(caps).length) return { pin: null };
  const pin = makePin({ id: 'hold', kind: 'hold', label: 'No transfers unless you add them', gw: A, must, excl, hits, rolls, ...(Object.keys(caps).length ? { caps } : {}) });
  return { pin };
}

/** GW g's lineup as a solve has it for squad `sq` under `chip`: the first bundle road (bundleRoads) whose week g holds the
 *  same 15 and the same chip → {xi, bench, captain, vice} | null (no solve has that squad there): what a take
 *  is measured as playing under the hold (ahead.js asTaken). */
export function solvedLineup(roads, g, sq, chip) {
  const k = idsKey(sq);
  const w = bundleRoads(roads).map((r) => weekAt(r, g)).find((x) => x && squadKey(x) === k && (x.chip ?? null) === chip);
  return w ? { xi: ids(w.xi), bench: ids(w.bench), captain: num(w.captain), vice: num(w.vice) } : null;
}

// ================================================================ values and roads

/**
 * engine.solveValues for your pins over the planned GWs (the phone never writes argv: api/mobile.py
 * clean_values whitelists these): the base values (int_rounds = w, chip defaults as '0'), your hit caps per GW where
 * they restrict (--max-hits-gw; F13, F17: no --max-hits and no --hit-cost, the solver's own default cap at its own price
 * elsewhere, meta.hit_cap), your chips through a draft (setChip), then your windows, your Rolls (no_buys_gw "7,8":
 * api/mobile.py rolls_gw, the tap's --no-buys-gw) and cash. A Wildcard or Free Hit week sends neither (composePins).
 */
export function planValues(cctx, list) {
  const gws = cctx.gws;
  const c = composePins(list, { from: gws[0], to: gws.at(-1) });
  let draft = E.createDraft({ name: 'Your plan' });
  for (const [g, chip] of Object.entries(c.chips)) draft = E.setChip(draft, Number(g), chip);
  const { values } = E.solveValues({
    base: cctx.base, draft, horizon: gws, maxHitsGw: c.hits, hitCap: hitCap(cctx.meta),
    chipDefaults: cctx.meta?.chip_defaults, players: cctx.players,
  });
  if (c.must_have) values.must_have = c.must_have;
  if (c.exclude) values.exclude = c.exclude;
  if (c.rolls.length) values.no_buys_gw = c.rolls.join(',');
  const capped = Object.entries(c.caps).sort(([a], [b]) => a - b);
  if (capped.length) values.max_buys_gw = capped.map(([g, n]) => `${g}:${n}`).join(',');
  if (c.cash !== null) values.cash = c.cash;
  return values;
}

/** The bundle's roads, the model's first: base, roll, vetoes, slides, the chip pre-solves (F12). */
export function bundleRoads(roads) {
  const r = roads || {};
  return [r.base, r.roll, ...Object.values(r.veto || {}), ...Object.values(r.slide || {}), ...Object.values(r.chip || {})].filter((x) => x?.weeks?.length);
}

/** A road's hit cap per GW of `gws` as it was solved: {gw: cap} (values.max_hits, each listed round's
 *  values.max_hits_gw in its place); null where it sent none (F17: the solver's own default cap). */
export function roadCaps(v, gws) {
  const own = parseCaps(v?.max_hits_gw);
  return Object.fromEntries(gws.map((g) => [g, num(own[g]) ?? num(v?.max_hits)]));
}

/**
 * QA-5 #3, QA-7 #3: the weeks of a solved road whose hits are not the planner's own call under the caps it was solved
 * under (roadCaps of its values: a GW it sent none for takes the solver's own default cap, which its planner keeps): more
 * hits than the caps allow, or a hit they allow that the planner never priced (a road with its objective, and no hit term
 * there: its result charged a hit its planner planned as free) → [{gw, hits, cap (null: the default), allowed (the caps
 * cover the hits: only the pricing is off), ft (the free transfers its result counts there: the tap's ft_avail, team.py),
 * buys, cause, from}]: what the road did, said plainly wherever its GW is (never only your rule's words, nor "the plan
 * takes it" for a −4 the planner never weighed). cause 'relief': the planner priced the hit itself (its relief ladder: no
 * plan without one, rolling._solve_relief); 'moved': the planner took the hit in another GW (from: [{gw, hits}],
 * calls.hitBook), where its caps allow one, and kept this week's free transfer, while FPL's order (free transfers first)
 * books it here; else null. A hit FPL books in another GW than the planner where both GWs allow one is none of these (its
 * notes say where each books it). gws: the GWs to read (default: the road's). [] for a road without its solve values
 * (what it was solved under is unknown).
 */
export function forcedHits(road, gws = (road?.weeks || []).map((w) => Number(w.gw))) {
  if (!road?.values || !road.weeks?.length) return [];
  const caps = roadCaps(road.values, gws);
  const book = new Map((hitBook(road) || []).map((b) => [b.gw, b]));
  const relief = road.planner ? !!road.planner.relief : true;  // a road stored before planner: any priced week over its cap
  return road.weeks.filter((w) => {
    const g = Number(w.gw), n = num(w.hits) ?? 0;
    return gws.includes(g) && n > 0 && (n > (caps[g] ?? Infinity) || (book.get(g)?.unpriced ?? 0) > 0);
  }).map((w) => {
    const g = Number(w.gw), cap = caps[g] ?? null, b = book.get(g);
    const cause = b?.from.length && !b.unpriced ? 'moved' : relief && b?.lp > 0 ? 'relief' : null;
    return { gw: g, hits: num(w.hits), cap, allowed: cap === null || num(w.hits) <= cap, ft: num(w.ft_avail), buys: ids(w.in).length, cause, from: b?.from ?? [] };
  });
}

/**
 * F17: the rules of `list` that are no rule over GW from..to → [id]: a hits or Roll rule in a GW whose plan plays a
 * Wildcard or Free Hit (the chip makes every transfer free there; composePins sends neither for it, and chipEdit takes
 * them off with the chip), and a hits rule at or above the solver's own default cap (hitCap, meta.hit_cap: no
 * restriction; an older document's "−8"). normalizeAccepted cleans a saved plan of them on load.
 */
export function idleRules(list = [], { from = 1, to = E.LAST_ROUND, hitCap = null } = {}) {
  const chips = composePins(list, { from, to }).chips;
  const remade = (g) => chips[g] === 'wc' || chips[g] === 'fh';
  return (list || []).filter((p) => {
    if (isRoll(p)) return remade(num(p.gw));
    if (kindOf(p) !== 'hits') return false;
    const caps = capsOf(p, from, to);
    return caps.length > 0 && caps.every(([g, n]) => remade(g) || (hitCap !== null && n >= hitCap));
  }).map((p) => p.id);
}

const chipRounds = (v, chip) => [].concat(v?.[chip] ?? []).map(String).filter((g) => g !== '0').sort().join(',');

/** "7,8" (a road's values.no_buys_gw) → [7, 8]. */
const parseRolls = (spec) => String(spec ?? '').split(',').map((t) => Number(t.trim())).filter((g) => Number.isInteger(g) && g > 0);

/**
 * Whether `road` is your plan without a solve: it was solved for the same GWs, hits, chips and cash, under
 * windows and Rolls that are all among yours, and its squads keep every one of yours (and make no transfer in a GW
 * you roll: movesIn). A plan optimal under fewer constraints that meets the rest is optimal under them all (same
 * objective), so the solver would give it.
 */
export function roadFits(road, c, gws) {
  const v = road?.values;
  if (!v || !road.weeks?.length || !sameOptions(v, c, gws, road)) return false;
  const own = ownPins(v, gws);
  for (const [id, byGw] of own.cells) for (const [g, { want }] of byGw) if (c.cells.get(id)?.get(g)?.want !== want) return false;
  if (parseRolls(v.no_buys_gw).some((g) => !c.rolls.includes(g)) || c.rolls.some((g) => movesIn(road, g))) return false;
  // a week capped at your moves (holdOf): the road makes no more there, and was solved under no cap of its own we lack
  const buysAt = (g) => { const w = weekAt(road, g); return w ? ids(w.in).length : 0; };
  if (Object.entries(c.caps ?? {}).some(([g, n]) => buysAt(Number(g)) > n)) return false;
  if (String(v.max_buys_gw ?? '').split(',').filter(Boolean).some((t) => { const [g, n] = t.split(':').map(Number); return !(c.caps?.[g] <= n); })) return false;
  return brokenCells(road, c).length === 0;
}

/** A road's own rules, its solve values' --must-have / --exclude, composed over GWs `gws` (once per values). */
const ownPins = (v, gws) => (solvedFor(v, gws).own ??= composePins([{ id: 'road', must: v.must_have || '', excl: v.exclude || '' }], { from: gws[0], to: gws.at(-1) }));

/**
 * api.solve, except that a road missing a player it was solved to have (its own values' --must-have: brokenCells 'in')
 * resolves as the error it is, {state: 'error', road: null, error: {code: 'infeasible', plain, detail, dropped}}: an
 * exclude beats a must-have in the solver (solve.py add_per_player: `s == 0 if se else s == 1 if mh`), and its bench-buy
 * guard (rolling.py _bench_buy_round) re-solved with the bench buy excluded, so "Do it anyway" for a bench player came
 * back without him (2026-10-05, Forster), read as "Forster from GW6: −2.2" and became the plan with his rule broken. (An
 * exclude is never broken: it always wins.) Every phone solve goes through here (the heal, a Wish, a chip
 * preparation, the options road): RULES_V2 §5, nothing you said is silently dropped. `dropped`: the cells it dropped,
 * [{id, gw}] earliest GW first (B12: Ahead's status row names the first). Keeps .cancel().
 */
export function solveKept(api, args, opts) {
  const p = api.solve(args, opts);
  const q = p.then((r) => {
    const v = r?.road?.values;
    const gws = (r?.road?.weeks || []).map((w) => Number(w.gw));
    const broken = r?.state === 'done' && v && gws.length ? brokenCells(r.road, ownPins(v, gws)).filter((x) => x.want === 'in') : [];
    if (!broken.length) return r;
    const g = Math.min(...broken.map((x) => x.gw));
    const dropped = broken.map((x) => ({ id: x.id, gw: x.gw })).sort((a, b) => a.gw - b.gw);
    return { ...r, state: 'error', road: null, error: { code: 'infeasible', plain: COPY.infeasible(g), detail: `the solve dropped ${broken.map((x) => `${x.id}@${x.gw} ${x.want}`).join(', ')}`, dropped } };
  });
  q.cancel = p.cancel;
  return q;
}

/** The cells of composed pins `c` (composePins) a road's squads break: [{id, gw, want, pin}] (a player kept out
 *  that it has, or held in that it hasn't, or a GW it doesn't plan). */
export function brokenCells(road, c) {
  const out = [];
  for (const [id, byGw] of c.cells) {
    for (const [g, { want, pin }] of byGw) {
      const w = weekAt(road, g);
      if (!w || squadOf(w).includes(id) !== (want === 'in')) out.push({ id, gw: g, want, pin });
    }
  }
  return out;
}

/** The pins (of `list`) a road ignores over GW from..to: a cell it breaks (brokenCells) or a chip it doesn't
 *  play where the pin plans one ('none': plays one there). Hits and cash allow, they never require: never broken. A
 *  Roll is "no transfers in its GW" (F13): broken by a road that makes one there (movesIn), or more than the moves of
 *  yours it keeps there (B20: the composed cap). */
export function rulesBroken(road, list = [], { from, to } = {}) {
  const c = composePins(list, { from, to });
  const ids0 = new Set(brokenCells(road, c).map((x) => x.pin));
  for (const p of list) {
    const rg = num(p.gw);
    if (isRoll(p) && rg !== null && rg >= from && rg <= to && movesIn(road, rg, c.caps[rg] ?? 0)) ids0.add(p.id);
    // the hold's own rolled and capped weeks (holdOf; the drift counts the hold among your rules, review 5, 2026-10-12)
    const inside = (g) => Number(g) >= from && Number(g) <= to;
    if (!isRoll(p)) for (const g of p.rolls || []) if (inside(g) && movesIn(road, Number(g))) ids0.add(p.id);
    if (!isRoll(p)) for (const [g, n] of Object.entries(p.caps || {})) if (inside(g) && movesIn(road, Number(g), Number(n))) ids0.add(p.id);
    for (const [g, chip] of Object.entries(p.chips || {})) {
      if (Number(g) < from || Number(g) > to) continue;
      const has = weekAt(road, g)?.chip ?? null;
      if (chip === 'none' ? has !== null : has !== chip) ids0.add(p.id);
    }
  }
  return list.filter((p) => ids0.has(p.id));
}

/**
 * A rule (a pin of yours) in words, for the "Your rules" chips and their sheet (RULES_V2 §4): {icon (ui.js ICONS
 * name), text (the chip), desc (what it does), removable, scope ('gw' | 'all' for a Keep or a veto, F11)}.
 * nameOf(id) names players; start / end: the plan's first and last GW.
 */
export function ruleText(p, nameOf = (id) => `#${id}`, { end, start, cap = null, hold = false } = {}) {
  const r = ruleWords(p, nameOf, { end, start, cap, hold });
  // a rule the alternative you picked came with (QA-1: never hidden inside the call)
  return p?.via ? { ...r, desc: `${r.desc} It came with the alternative you picked; picking another takes it back.`, via: true } : r;
}

function ruleWords(p, nameOf, { end, start, cap = null, hold = false } = {}) {
  const nm = (id) => nameOf(Number(id));
  const to = end ?? Math.max(...[...(p.must || []), ...(p.excl || [])].map(([, , b]) => b), Number(p.gw) || 0);
  const kind = kindOf(p);
  const g = num(p.gw);
  switch (kind) {
    case 'road':
      if (p.locked) {
        const f = pinFrozen(p, g), many = f.length > 1;
        return { icon: 'lock', text: `${span(f)} frozen`, desc: `${span(f)} ${many ? 'are' : 'is'} as you froze ${many ? 'them' : 'it'}. Turn off Freeze GW${f[0]} to change ${many ? 'them' : 'it'}.`, removable: false };
      }
      return { icon: 'check', text: `GW${g}: ${p.label || 'your pick'}`, desc: `The move you picked for GW${g}.`, removable: true };
    case 'veto': case 'never': {
      const sc = scopeOf(p, { start, end: to });
      const one = /^GW\d+$/.test(sc);
      return { icon: 'ban', text: `Not ${nm(p.player)}${sc ? ` · ${sc}` : ''}`, scope: one ? 'gw' : 'all', removable: true,
        desc: one ? `The plan doesn't buy ${nm(p.player)} in ${sc}; it may later.` : `The plan never buys ${nm(p.player)}${g ? ` in ${COPY.range(g, to)}` : ''}.` };
    }
    case 'keep': {
      const sc = scopeOf(p, { start, end: to });
      const one = /^GW\d+$/.test(sc);
      // F11 / review #20 / B144: a Keep's whole window reads as its scope button does, its span ("GW6–9", COPY.span),
      // never "all weeks"; "holds" is the plan's own choice, never a rule of yours
      const win = !sc || sc === 'all weeks' || sc.startsWith('from') ? span([Math.max(g ?? 0, start ?? 0) || to, to]) : sc;
      return { icon: 'lock', text: `Keep ${nm(p.player)}${sc ? ` · ${sc === 'all weeks' ? win : sc}` : ''}`, scope: one ? 'gw' : 'all', removable: true,
        desc: one ? `The plan keeps ${nm(p.player)} in ${sc}; it may sell him in another week.` : `Forkcast never sells ${nm(p.player)} in ${win}.` };
    }
    case 'sell':
      // review 5 (2026-10-12): an exact sale has the name its row and toasts give it ("Saka → B.Fernandes · GW9",
      // ahead.rowName), so "It removes …" quotes the same words; a sale with no buy stays "Sell Saka from GW9"
      return { icon: 'arrow', text: p.in != null ? `${nm(p.player)} → ${nm(p.in)} · GW${g}` : `Sell ${nm(p.player)} from GW${g}`,
        desc: p.in != null ? `${nm(p.player)} goes in GW${g} and ${nm(p.in)} comes in.` : `${nm(p.player)} goes in GW${g}; the plan picks his replacement.`, removable: true };
    case 'wish':
      // a Wildcard or Free Hit week's pick (ahead.wishPin's `chip`): him in that week's squad alone
      if (p.chip) return { icon: 'plus', text: `${nm(p.player)} in your GW${g} ${chipName(p.chip)}`, desc: `${nm(p.player)} is in your GW${g} ${chipName(p.chip)} squad; the chip picks the rest.`, removable: true };
      return { icon: 'plus', text: `${nm(p.player)} from GW${g}`, desc: `The plan brings ${nm(p.player)} in by GW${g} and keeps him through GW${to}.`, removable: true };
    case 'slide':
      return { icon: 'swap', text: p.label || `${nm(p.out)} → ${nm(p.player)} in GW${g}`, desc: `That move is made in GW${g}.`, removable: true };
    case 'chip': {
      const [cg, c] = Object.entries(p.chips || {})[0] || [g, null];
      return c && c !== 'none' ? { icon: 'play', text: `${c.toUpperCase()} · GW${cg}`, desc: `${chipName(c)} is planned for GW${cg}.`, removable: true }
        : { icon: 'stop', text: `No chip · GW${cg}`, desc: `No chip in GW${cg}.`, removable: true };
    }
    case 'roll':
      // a suggested plan's + (the user, 2026-10-13: "Lock it, both modes"); B20: one keeping your exact moves there
      return { icon: 'reset', text: COPY.rollRule(g, rollKeeps(p)), removable: true,
        desc: rollKeeps(p) ? `Forkcast adds no transfers of its own in GW${g}.` : `Forkcast makes no transfers in GW${g}: the free transfer rolls on.` };
    case 'hits': {
      // F17: a restriction of the solver's own default (cap: meta.hit_cap), which the GW takes again without it
      const [[cg, n] = [g, p.max_hits || 1]] = Object.entries(p.hits || {});
      // review 5 (2026-10-12): under the hold the week goes back to Off without it (holdOf), never "(default)"
      const without = hold ? ` Without it: no transfers in GW${cg}.`
        : cap != null ? ` Without it: ${COPY.defaultHits(cap, cg).replace(/^U/, 'u')}.` : '';
      if (!num(n)) return { icon: 'minus', text: `${COPY.segFreeOnly} · GW${cg}`, desc: `${COPY.gwNote.free(cg)}${without}`, removable: true };
      return { icon: 'minus', text: `Up to −${E.HIT_COST * n} · GW${cg}`, desc: `${COPY.hitsUpTo(n, cg)} only: the plan takes a hit only where its count says it pays.${without}`, removable: true };
    }
    case 'cash':
      return { icon: 'info', text: `Bank as FPL shows`, desc: 'Your plan starts from the bank FPL showed you.', removable: true };
    default:
      return { icon: 'info', text: p.label || kind || 'rule', desc: p.label || '', removable: true };
  }
}

/** The first bundle road that is your plan (roadFits), the model's road first, then one of `also` (roads this page
 *  solved for some pins: Memory.offer); null when it needs a solve. The bake's hold road (your team as it is, no transfer
 *  in any GW: api/mobile.py bake_plan; the owner, 2026-10-26: "all pre solved", an untouched team's plan drawn at once)
 *  is one of them here alone: no choice, lineup or chip of Ahead's reads it (bundleRoads). */
export function findRoad(roads, c, gws, also = []) {
  // the bundle's part once per roads and what the pins ask (sigOf: all roadFits reads of them): an edit's replan and its
  // plan view's options road ask the same of the same roads
  let by = BUNDLE_FIT.get(roads ?? BUNDLE_FIT);
  if (!by) BUNDLE_FIT.set(roads ?? BUNDLE_FIT, (by = new Map()));
  const k = `${gws.join(',')}#${sigOf(c)}`;
  if (!by.has(k)) by.set(k, [...bundleRoads(roads), roads?.hold].filter((r) => r?.weeks?.length).find((r) => roadFits(r, c, gws)) ?? null);
  return by.get(k) ?? also.filter((r) => r?.weeks?.length).find((r) => roadFits(r, c, gws)) ?? null;
}
const BUNDLE_FIT = new WeakMap();

/** Whether a road was solved (values v) for the same GWs and the same options as composed pins c: hit caps per GW,
 *  chips, cash (what a plan may do, as against the windows that hold it in). */
function sameOptions(v, c, gws, road = null) {
  if (num(v.from_r) !== gws[0] || num(v.w) !== gws.length) return false;
  const { caps, chips } = solvedFor(v, gws);
  // the same cap per GW: a rule's, or none (the solver's own default, F17) on both sides; or a tighter cap of yours that
  // the road's week keeps anyway (it takes no more hits there: a bound that never bound leaves the optimum, as a Roll
  // keeps a road that moves nobody in its GW)
  const capFits = (g) => {
    const mine = c.hits[g] ?? null, its = caps[g];
    if (mine === its) return true;
    const hits = num(weekAt(road, g)?.hits);
    return mine !== null && (its === null || mine < its) && hits !== null && hits <= mine;
  };
  if (!gws.every(capFits) || (num(v.cash) ?? null) !== c.cash) return false;
  const want = chipsAsked(c);
  return E.CHIPS.every((chip) => chips[chip] === want[chip]);
}
/** What a road was solved for over `gws`, read once per its solve values (findRoad reads every bundle road on each
 *  edit, and each edit's plan view again): its hit caps (roadCaps), each chip's rounds (chipRounds) and, once asked,
 *  its own windows composed (roadFits). */
const SOLVED_FOR = new WeakMap();
function solvedFor(v, gws) {
  const k = gws.join(',');
  let by = SOLVED_FOR.get(v);
  if (!by) SOLVED_FOR.set(v, (by = new Map()));
  if (!by.has(k)) by.set(k, { caps: roadCaps(v, gws), chips: Object.fromEntries(E.CHIPS.map((chip) => [chip, chipRounds(v, chip)])), own: null });
  return by.get(k);
}
/** Composed pins' chips as chipRounds writes a road's: {chip: "7,9"}, once per composition. */
const CHIPS_ASKED = new WeakMap();
function chipsAsked(c) {
  if (!CHIPS_ASKED.has(c)) CHIPS_ASKED.set(c, Object.fromEntries(E.CHIPS.map((chip) => [chip, Object.entries(c.chips).filter(([, x]) => x === chip).map(([g]) => g).sort().join(',')])));
  return CHIPS_ASKED.get(c);
}

/** The pins your rules' cost keeps (QA honesty b): what a plan may do, your options (chips, cash), and a locked GW A
 *  (ink: the moves FPL already has, F10; a lock is never one of your rules; an older document's, which the read thaws
 *  since Freeze went, 2026-10-12, so none now). A hits rule is a
 *  restriction (F17: below the solver's own default cap), so it is one of your rules, like a Roll, and its cost counts. */
export const optionPins = (list = []) => (list || []).filter((p) => (p.id === 'road' && !!p.locked) || ['chip', 'cash'].includes(kindOf(p)));

/**
 * The planner's best plan with your options and a locked GW A (optionPins) and none of your rules: the bundle road (or
 * one of `also`: your own plan's road, a solve of exactly those pins) that is that plan (findRoad: solved for the same
 * options under no window but the lock's, keeping the lock: the model's road when you chose nothing and it keeps your
 * locked GW A, a chip's pre-solve, the −4 road), else null. Your rules' cost is measured against it (like with like:
 * only your rules make the gap, ≥ 0 by construction). optionsValues(cctx, list): the solve values of those pins alone
 * (what a solve of that reference sends).
 */
export function optionsRoad(roads, list, gws, also = []) {
  return findRoad(roads, composePins(optionPins(list), { from: gws[0], to: gws.at(-1) }), gws, also);
}
export const optionsValues = (cctx, list) => planValues(cctx, optionPins(list));

// ================================================================ legality and drift (§7.7)

/** The players drift watches: your GW-A XI (the call you made) and the players you asked for (wish, keep, a
 *  pick). The taken road's hold on the whole GW-A squad is left out: a loaned-out bench GK is not news. */
function watched(cctx, evaluation, pinList) {
  const s = evaluation.gws.find((x) => x.gw === cctx.A);
  const asked = composePins(pinList.filter((p) => p.kind !== 'road'), { from: cctx.A, to: E.LAST_ROUND }).must.map(([id]) => id);
  return [...new Set([...ids(s?.xi), ...asked])];
}

/**
 * Why your plan no longer works on today's data (§7.7): a player it plays in GW A or pins now injured,
 * unavailable or suspended (FPL status i / u / s), a GW over budget (engine.evaluate banks: today's prices
 * and sale values), or a GW over the club limit (rules.py:93 max_per_team). [{code, id?, gw, text}]
 */
export function legality(cctx, evaluation, pinList = []) {
  const L = E.playerLookup({ base: cctx.base, players: cctx.players });
  const out = [];
  for (const id of watched(cctx, evaluation, pinList)) {
    const row = L.get(id)?.row;
    if (OUT[statusInfo(row?.status, row?.chance).code]) out.push({ code: 'status', id, gw: cctx.A, text: statusText(L.name(id), row) });
  }
  for (const s of evaluation.gws.filter((x) => num(x.bank) !== null && x.bank < -EPS)) {
    out.push({ code: 'budget', gw: s.gw, short: -s.bank, text: `your plan is ${fmt.money(-s.bank)} over budget in GW${s.gw}` });
  }
  for (const s of evaluation.gws) {
    const n = new Map();
    for (const p of s.squad) { const c = L.club(p); if (c) n.set(c, (n.get(c) || 0) + 1); }
    const over = [...n].find(([, k]) => k > E.MAX_PER_CLUB);
    if (over) { out.push({ code: 'club', gw: s.gw, club: over[0], count: over[1], text: `your plan has ${over[1]} ${over[0]} players in GW${s.gw}` }); break; }
  }
  return out;
}

const sameSquads = (a, b) => a.gws.length === b.gws.length && a.gws.every((s, i) => [...s.squad].sort().join() === [...(b.gws[i]?.squad || [])].sort().join());

/** When your plan was made, in local time, for "Since …" (F1): "10:23" today, "yesterday 18:05", else "Tue 18:05". */
export function sinceText(epoch, now = Date.now()) {
  const ms = Number(epoch) * (Number(epoch) > 1e12 ? 1 : 1000);
  if (!Number.isFinite(ms)) return 'your last plan';
  const d = new Date(ms);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const day0 = (t) => new Date(t).setHours(0, 0, 0, 0);
  const days = Math.round((day0(now) - day0(ms)) / 864e5);
  if (days === 0) return hm;
  if (days === 1) return `yesterday ${hm}`;
  return `${new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d)} ${hm}`;
}

/**
 * How two plans' squads part over the window, biggest first (F1: the drift card names WHAT changes, never one
 * player's verdict): [{id, kind: 'keep' (the new best keeps a player yours sells) | 'buy' (it buys one yours
 * doesn't) | 'skip' (yours buys one it doesn't), gw (where they first part), with (the player on the other side
 * of that GW's move in yours), weight (Σ his xP over the weeks the squads differ on him)}].
 */
export function planDiff(best, mine, L) {
  const at = (ev, g) => ev.gws.find((x) => x.gw === g);
  const items = new Map();
  for (const s of best.gws) {
    const m = at(mine, s.gw);
    if (!m) continue;
    for (const [id, side] of [...s.squad.filter((p) => !m.squad.includes(p)).map((p) => [p, 'in']),
      ...m.squad.filter((p) => !s.squad.includes(p)).map((p) => [p, 'out'])]) {
      const it = items.get(id) || { id, gw: s.gw, weight: 0, side };
      it.weight += L.xp(id, s.gw) ?? 0;
      items.set(id, it);
    }
  }
  const movesOfWeek = (ev, g) => (at(ev, g)?.moves || []).filter((x) => x.ok !== false);
  return [...items.values()].map((it) => {
    // a player the new best has that yours lacks: yours sold him (keep) or never had him (buy); one yours has: skip
    const ownedBefore = it.side === 'in' && (mine.gws.some((x) => x.gw < it.gw && x.squad.includes(it.id)) || movesOfWeek(mine, it.gw).some((x) => x.out === it.id));
    const kind = it.side === 'out' ? 'skip' : ownedBefore ? 'keep' : 'buy';
    const mv = movesOfWeek(mine, it.gw).find((x) => x.out === it.id || x.in === it.id) ?? movesOfWeek(best, it.gw).find((x) => x.in === it.id);
    const withId = mv ? (mv.out === it.id ? mv.in : mv.out) : null;
    return { id: it.id, kind, gw: it.gw, with: withId, weight: it.weight };
  }).sort((a, b) => b.weight - a.weight);
}

/** A planDiff item in words: "keep Szoboszlai (yours sells him for Dewsbury-Hall in GW6)", "Groß in GW6". */
export function diffWords(it, L) {
  if (!it) return null;
  const nm = L.name;
  if (it.kind === 'keep') return `keep ${nm(it.id)} (yours sells him${it.with != null ? ` for ${nm(it.with)}` : ''} in GW${it.gw})`;
  if (it.kind === 'buy') return `${nm(it.id)} in GW${it.gw}${it.with != null ? ` for ${nm(it.with)}` : ''}`;
  return `no ${nm(it.id)} (yours buys him in GW${it.gw})`;
}

/** What the new data gains (F15b): today's best (an evaluation) against `before`, the model's road an earlier plan was
 *  made or seen on, both on today's forecast (calls.compare) | null without that road. */
const freshOf = (cctx, best, before) => (before?.weeks?.length ? compareIn(cctx, best, planFromRoad(cctx, before).evaluation) : null);
/** That gain is news, beyond the noise: on the anchor's scale (fc.ref) above the plan's noise and no coin flip. One test
 *  for the drift (detectDrift) and the suggested plan's new-forecast line (forecastChange, B14). */
const isNews = (cctx, fc) => fc != null && fc.ref > (cctx?.noise ?? 0) && fc.label !== 'coin';

/**
 * Re-score the plan you accepted on today's forecast against the new base road (§7.7): drift when the new
 * base wins by more than the noise with a verdict that isn't a coin flip (votes only downgrade), or when
 * your plan broke (legality); 'kept' when it is better by less than that; 'same' when the squads agree.
 * null when there is nothing to judge (no accepted plan, no new roads, or already judged on this version).
 * accepted: the memory document's accepted; version: the roads version of cctx.roads. frozen: the frozen GWs (ink, an
 * older document's `locked`: GW A): a new best that remakes one is out of reach, so only legality can drift then.
 * Your rules (every pin but the road) stay yours: `broken` lists the ones the new best ignores (its "Switch"
 * re-plans with them, adoptDrift). Your rules and your lineup are your choices, never news (QA: never "today's best
 * beats yours" for a rule you chose): the new best wins only by what the new data gains, `fresh`: today's best against
 * `before` (the model's road your plan was made against) on today's forecast; without that road, the whole gap when
 * your plan holds none of your choices, else null (unknown: no drift, the plan re-plans with your rules, 'kept').
 */
export function detectDrift(cctx, accepted, version, { frozen = null, locked = false, now, before = null, hold = null } = {}) {
  if (!accepted?.plan?.weeks?.length || !cctx?.roads?.base || !version || madeOn(accepted) === version) return null;
  const L = E.playerLookup({ base: cctx.base, players: cctx.players });
  const mine = planFromRoad(cctx, { weeks: accepted.plan.weeks }, accepted.lineup || {});
  const bestPlan = planFromRoad(cctx, cctx.roads.base);
  const cmp = compareIn(cctx, bestPlan.evaluation, mine.evaluation);
  const pinList = accepted.pins?.items || [];
  const ink = frozen?.length ? frozen : locked ? [cctx.A] : [];
  const reach = ink.every((g) => squadKey(weekAt(cctx.roads.base, g)) === squadKey(weekAt(accepted.plan, g)));
  // the hold (`hold`: its derived pin, never stored) is kept as your rules are: a new best that moves where it rolls
  // ignores it, so its action re-plans with it (review 5, 2026-10-12: under the hold "Use it" kept the plan held, changing
  // nothing), though it is never named as yours (ruleNames)
  const broken = rulesBroken(cctx.roads.base, [...(hold ? [hold] : []), ...pinList.filter((p) => p.id !== 'road' && p.id !== 'hold')], { from: cctx.A, to: cctx.gws.at(-1) });
  // a pencil GW the model's own new plan breaks the same way is not news about your plan: the solver prices it
  // on its data's prices (a sale FPL now pays £0.1m less for reads as over budget here) and a later solve
  // re-plans it. Only as far as the model's own: a bigger shortfall of yours there still counts. GW A always
  // counts: its moves are the ones you make in FPL.
  const shared = new Map(legality(cctx, bestPlan.evaluation).filter((x) => x.code !== 'status' && x.gw > cctx.A).map((x) => [`${x.code}:${x.gw}`, x.short ?? 0]));
  const illegal = legality(cctx, mine.evaluation, pinList)
    .filter((x) => !shared.has(`${x.code}:${x.gw}`) || (x.code === 'budget' && x.short > shared.get(`${x.code}:${x.gw}`) + EPS));
  const same = sameSquads(bestPlan.evaluation, mine.evaluation);
  const chosen = broken.length > 0 || ['xi', 'bench', 'captain', 'vice'].some((k) => accepted.lineup?.[k] != null);
  const fc = freshOf(cctx, bestPlan.evaluation, before) ?? (chosen ? null : cmp);
  const fresh = fc ? fc.delta : null;  // shown; its label and the win read fc.ref, the gap on the anchor's scale (F15b)
  const wins = reach && !same && cmp.label !== 'coin' && isNews(cctx, fc);
  const kind = illegal.length || wins ? 'drift' : !same && cmp.delta > EPS ? 'kept' : 'same';
  let what = illegal[0]?.text ?? null;
  if (!what) {
    // a player's flag only when it came after your plan was made (its news_added; the reviews, 2026-10-11: the toast
    // led with old news as "Since …"); none known: not said
    const since = (row) => { const t = Date.parse(row?.news_added ?? ''); return Number.isFinite(t) && t / 1000 > (num(accepted.at) ?? Infinity); };
    for (const id of watched(cctx, mine.evaluation, pinList)) { if (!since(L.get(id)?.row)) continue; what = statusText(L.name(id), L.get(id)?.row); if (what) break; }
  }
  // the toast leaves the default out (review 5, 2026-10-12: it took the three lines' room the ignored rules need)
  const news = what;
  what ??= 'the forecast changed';
  const diff = planDiff(bestPlan.evaluation, mine.evaluation, L);
  const main = diffWords(diff[0], L);
  const sinceStr = sinceText(accepted.at, now);
  // FPL flagged him but the forecast (re-inferred separately, §7.7 honest limit) still plays him: no new best
  // to show yet, so the drift names him (`without`: planWithout's, which nothing in js/m offers now)
  const out = same ? illegal.find((x) => x.code === 'status') : null;
  // the hold is no rule anyone added (your team with no transfers but yours): never named as one of yours (the first-use
  // findings, 2026-10-21: "it ignores your rule: No transfers unless you add them" to a manager who had added none); its
  // answer says what it keeps (COPY.driftAct: "Keep only your transfers")
  const ruleNames = broken.filter((p) => p.id !== 'hold').map((p) => ruleText(p, L.name, { start: cctx.A, end: cctx.gws.at(-1) }).text);
  return {
    kind, version, gw: cctx.A, since: accepted.at, sinceText: sinceStr, cmp, delta: cmp.delta, label: cmp.label,
    illegal, what, main, best: main ?? 'the new plan', diff, same, locked: ink.length > 0, frozen: ink, reach, broken: broken.map((p) => p.id), ruleNames, fresh,
    freshLabel: fc ? fc.label : null, wins,
    without: out ? { id: out.id, name: L.name(out.id) } : null,
    text: same ? `Since ${sinceStr}: ${what}. ${out ? "The forecast hasn't caught up yet." : 'No better plan yet.'}`
      : !reach ? `Since ${sinceStr}: ${what}. ${COPY.frozenStays(ink, cctx.gws.at(-1))}`
        : COPY.drift(sinceStr, news, main, cmp.delta, cmp.label, cmp.gws, ruleNames, fresh, fc ? fc.label : cmp.label),
    mine, bestPlan,
  };
}

// ================================================================ pencil diff and journal

const movesOf = (w, L) => E.pairMoves(ids(w?.out), ids(w?.in), L).filter((m) => m.out !== null && m.in !== null)
  .map((m) => ({ ...m, outName: L.name(m.out), inName: L.name(m.in) }));

/** One week of two plans (their {in, out}): the moves of each, those `was` makes that `now` doesn't (gone) and the
 *  reverse (added). */
const weekChanges = (was, now, L) => {
  const a = movesOf(was, L), b = movesOf(now, L);
  const key = (m) => `${m.out}>${m.in}`;
  const ka = new Set(a.map(key)), kb = new Set(b.map(key));
  return { a, b, gone: a.filter((m) => !kb.has(key(m))), added: b.filter((m) => !ka.has(key(m))) };
};

/** Moves that differ between two plans' weeks after GW A (§5.5 "2 changes in GW7–9 ›"). */
export function pencilChanges(was, now, A, L) {
  const items = [];
  for (const w of (now || []).filter((x) => Number(x.gw) > A)) {
    const before = (was || []).find((x) => Number(x.gw) === Number(w.gw));
    if (!before) continue;
    const { a, b, gone, added } = weekChanges(before, w, L);
    if (gone.length || added.length) items.push({ gw: Number(w.gw), was: a, now: b, n: Math.max(gone.length, added.length) });
  }
  if (!items.length) return null;
  const n = items.reduce((s, x) => s + x.n, 0);
  const gws = items.map((x) => x.gw);
  return { n, gws, items, text: `${n} change${n === 1 ? '' : 's'} in ${COPY.range(gws[0], gws.at(-1))}` };
}

/** B14: one week's moves a new forecast changed, in words (a week of the plan seen before, `was`, and of the plan now):
 *  a sale that now has another buy "Scott → Le Fée (was Groß)", any other new move as its row reads it, a move it no
 *  longer makes "no Scott → Groß" | null. */
export function movesChanged(was, now, L) {
  const { gone, added } = weekChanges(was, now, L);
  const parts = added.map((m) => {
    const w = gone.find((x) => x.out === m.out);
    return `${m.outName} → ${m.inName}${w ? ` (was ${w.inName})` : ''}`;
  });
  for (const m of gone) if (!added.some((x) => x.out === m.out)) parts.push(`no ${m.outName} → ${m.inName}`);
  return parts.length ? parts.join(', ') : null;
}

/** A road key in words, for a taken call stored without its label. */
function roadWords(key, nameOf) {
  const [kind, rest = ''] = String(key ?? '').split(':');
  const [id, g] = rest.split('@');
  if (kind === 'base') return 'the suggested plan';
  if (kind === 'hit') return `the ${MINUS}4 move`;
  if (kind === 'veto') return `the plan without ${nameOf(Number(id))}`;
  if (kind === 'slide') return `${nameOf(Number(id))} from GW${g}`;
  return String(key ?? 'a move');
}
const MINUS = '−';
const TAKEN = (t, nameOf) => (t.call === 'armband' ? `${t.label || nameOf(t.captain)} captain`
  : t.call === 'chip' ? (t.chip ? `played ${chipName(t.chip)}` : 'held the chips')
    : t.label === 'Roll' || (!t.label && t.road === 'roll') ? 'rolled the transfer' : `took ${t.label || roadWords(t.road, nameOf)}`);

/**
 * The journal's note of a lock (QA-5 #4): "Locked in GW6: Tavernier → E.Le Fée" (GW A's moves in words, so a lock after
 * they changed reads as a new line; "no transfers"; "10 transfers" past three; a chip named). plan: the ticket's GW A
 * (ticket.plan: {in, out, chip}); L: the engine's player lookup (the moves paired by position, as the ticket showed them).
 * No caller since Freeze per week replaced Lock in and its ticket (f543bdf7, 2026-10-08); journalRows still reads an
 * older document's "Locked in" notes.
 */
export function lockNote(A, plan, L) {
  const ms = movesOf(plan, L);
  const n = Math.max(ids(plan?.in).length, ms.length);
  const what = !n ? 'no transfers' : n <= 3 && ms.length === n ? ms.map((m) => `${m.outName} → ${m.inName}`).join(', ') : `${n} transfers`;
  return { kind: 'locked', at: nowS(), text: `Locked in GW${A}${plan?.chip ? ` with the ${chipName(plan.chip)}` : ''}: ${what}`, delta: null, label: null };
}
/** A lock note's kinds, both an older document's: Lock in's "Locked in GW6", Freeze's "Froze GW6–8" (gone 2026-10-12). */
const LOCKS = ['locked', 'frozen'];
/** Whether lock note n says what the lock note of its kind before it said (GW A locked again with the same moves, the
 *  same weeks frozen again): no new line. */
const sameLock = (prev, n) => !!prev && LOCKS.includes(n?.kind) && prev.kind === n.kind && prev.text === n.text;
/** notes with lock note n added, unless the newest lock note of its kind among them already says it (sameLock): one
 *  journal line per lock that matters (QA-5 #4: eleven re-locks of one ticket were eleven "Locked in GW6"). No caller
 *  since freeze() went with Freeze (2026-10-12). */
export function withLockNote(notes = [], n) {
  const prev = (notes || []).findLast((x) => x.kind === n?.kind);
  return sameLock(prev, n) ? notes || [] : [...(notes || []), n].slice(-20);
}

/**
 * The You sheet's calls journal (§5.10) from {gw: doc}: taken calls with their verdicts, and the plan notes:
 * [{gw, at, kind, text, not, label, delta}] (delta: the verdict's signed gap, which the row draws in its tone).
 * nameOf(id) names players for calls stored without a label. A lock note that repeats the lock note before it (sameLock:
 * an older document's re-locks) is one row, the first.
 */
export function journalRows(docs, { nameOf = (id) => `#${id}` } = {}) {
  const rows = [];
  for (const doc of Object.values(docs || {})) {
    const acc = doc?.accepted;
    if (!acc) continue;
    const gw = Number(doc.gw);
    for (const t of acc.roads_taken || []) {
      const v = (acc.verdicts || []).find((x) => x.call === t.call);
      rows.push({ gw, at: t.at ?? acc.at ?? 0, kind: t.call, text: TAKEN(t, nameOf), not: t.not || [], label: v?.label ?? null, delta: num(v?.delta) });
    }
    const lock = {};
    for (const n of acc.notes || []) {
      if (LOCKS.includes(n.kind)) { if (sameLock(lock[n.kind], n)) continue; lock[n.kind] = n; }
      rows.push({ gw, at: n.at ?? 0, kind: n.kind, text: n.text, not: [], label: n.label ?? null, delta: num(n.delta) });
    }
  }
  return rows.sort((a, b) => b.gw - a.gw || b.at - a.at);
}

// ================================================================ documents

/** The roads version a plan was made on: accepted.roads_version, else data_version. */
export const madeOn = (acc) => acc?.roads_version ?? acc?.data_version ?? null;
/** The pins a plan was made for, as one string (composePins output): a plan with the same one needs no solve. Rolls
 *  are added only when there are some, so a plan made before they had their own field keeps its signature. */
/** A solve's own key: the data version it is solved on and its values, key order aside (the plan service keys a solve
 *  by its argv on that data: api/mobile.py solve_key, so two asks of one key are one request with one answer). */
export const solvedKey = (version, values) => `${version}|${JSON.stringify(Object.keys(values).sort().map((k) => [k, values[k]]))}`;
const sigOf = (c) => `${c.must_have}|${c.exclude}|${JSON.stringify(c.hits)}|${JSON.stringify(c.chips)}|${c.cash}${c.rolls.length ? `|roll:${c.rolls.join(',')}` : ''}${Object.keys(c.caps ?? {}).length ? `|cap:${JSON.stringify(c.caps)}` : ''}`;
/** A road as the stored plan: its weeks, the values it was solved for, its objective (the planner's own count of
 *  it: calls.plannerOf compares it with another road of the same data), the scale by horizon that objective is on
 *  (k_h, api/scale.py road: engine.objectiveOf atAnchor puts it back on GW A's scale with it) and its planner's own
 *  hits per GW (the plan service's road.planner: calls.hitBook). */
const planOfRoad = (road, version, sig = null) => (road ? {
  key: road.key ?? null, item: road.item ?? null, version: version ?? null, sig, values: road.values ?? null, weeks: clone(road.weeks),
  objective: road.objective ? clone(road.objective) : null, ...(road.planner ? { planner: clone(road.planner) } : {}),
  ...(Array.isArray(road.k_h) ? { k_h: [...road.k_h] } : {}),
} : null);

/**
 * A memory document's accepted in this module's shape, whoever wrote it. An older document may hold
 * accepted.pins as the taken road's own strings {must_have, exclude, max_hits} and no plan: the plan is
 * then the taken road (roadOf(version, key): the bundle's, or one archived on this device) and its pin
 * the road pin. A stored pin of kind 'hits' (a week's Auto-plan, or a window-wide 'hits' rule from before F13) goes:
 * the hits Forkcast may take are one setting since 2026-10-12 (accepted.hits_max). A stored Roll stays (a suggested
 * plan's + locks its week with one, the user 2026-10-13: "Lock it, both modes"; in Your rules with its ×). A frozen week is thawed
 * (thawPin: the road pin the call's again; frozen, frozen_lineups, frozen_at and locked_at emptied). F17: a hits rule
 * splitRoad makes of a road's own cap, in a Wildcard or Free Hit week or at the solver's own default cap (hitCap:
 * meta.hit_cap), is no rule (idleRules): it goes, as chipEdit takes it off with the chip.
 * Other keys are kept as they are. → a new object, or null.
 */
export function normalizeAccepted(acc, { A, end, roadOf = () => null, hitCap = null, hold = false } = {}) {
  if (!acc) return null;
  const made = madeOn(acc);
  const t = (acc.roads_taken || []).find((x) => x.call === 'transfer');
  const road = t?.road ? roadOf(made, t.road) : null;
  const out = { ...acc, roads_version: made, roads_taken: acc.roads_taken || [], verdicts: acc.verdicts || [], notes: acc.notes || [] };
  let items = Array.isArray(acc.pins?.items) ? acc.pins.items : null;
  if (!items) {
    const src = road ?? (acc.plan?.weeks ? { values: { must_have: acc.pins?.must_have, exclude: acc.pins?.exclude, max_hits: acc.pins?.max_hits }, weeks: acc.plan.weeks } : null);
    items = t?.road && src ? [pinRoad(src, A, { key: t.road, label: t.label })] : [];
  } else {
    // the stored call is the newest word: a road pin for another road (or none taken, and not a lock's) goes,
    // with the rules it came with
    const rp = items.find((p) => p.id === 'road');
    if (rp && !rp.locked && (!t ? true : road && rp.key !== t.road)) items = items.filter((p) => p.id !== 'road' && !p.via);
    if (road && !items.some((p) => p.id === 'road')) items = [pinRoad(road, A, { key: t.road, label: t.label }), ...items];
  }
  // a week's Auto-plan hits limit (before 2026-10-12, when the hits Forkcast may take became one setting for every
  // week, accepted.hits_max; the user: "auto plan allowed hits must be somewhere in settings") is no rule now: it has no
  // control left to see or lift it. A Roll stays (a suggested plan's +, the user 2026-10-13: "Lock it, both modes";
  // Your rules lists it with its ×)
  items = items.filter((p) => p.kind !== 'hits');
  // Freeze is gone (the user, 2026-10-12: "Remove it"; your team holds unless you change it, and a move Forkcast makes
  // for you is kept by taking it): a plan's frozen weeks thawed as unfreeze(GW A) thawed them, the road pin the call's
  // again, so no week stays held by a control you can no longer see
  // (after splitItems: a rule an older lock held inside it is a rule of its own first, QA-1)
  items = splitItems(items, A, end);
  if (frozenWeeks(acc, A, end).length || items.some((p) => p.id === 'road' && p.locked)) {
    const rp = items.find((p) => p.id === 'road');
    const thawed = rp ? thawPin(rp, A, A) : null;
    items = [...(thawed ? [thawed] : []), ...items.filter((p) => p.id !== 'road')];
    Object.assign(out, { frozen: [], frozen_lineups: {}, frozen_at: {}, locked_at: null });
    delete out.locked_by;
  }
  const idle = idleRules(items, { from: A, to: end, hitCap });
  if (idle.length) items = items.filter((p) => !idle.includes(p.id));
  const c = composePins(items, { from: A, to: end });
  if (items !== acc.pins?.items) out.pins = { ...(acc.pins || {}), must_have: c.must_have, exclude: c.exclude, items };
  // a plan whose GW-A squad is not the taken road's predates that call: the call's road stands in until it
  // re-plans. A plan solved for exactly these pins is newer than all of them, so it stands (an ask from Ahead
  // remade GW A: the road pin yielded, and Plan.taken.transfer reads null). Never under the hold (`hold`), where an
  // alternative taken whole holds nothing (withHold): your plan is the one solved for your rules (the owner,
  // 2026-10-26: "fix so every squad is solver squad"; the phone's holdRoad drew over it until then)
  if (!hold && road && out.plan?.weeks && out.plan.sig !== sigOf(c) && squadKey(weekAt(out.plan, A)) !== squadKey(weekAt(road, A))) out.plan = null;
  if (!out.plan && road && !hold) out.plan = planOfRoad(road, made, items.length === 1 && items[0].id === 'road' ? sigOf(c) : null);
  // a plan the phone evaluated under the hold (an older app's holdRoad, key 'hold:…', stored as your plan) is no
  // solver's: it goes, and your rules are solved again (the owner, 2026-10-26, a 4th Arsenal player drawn from one: "fix
  // so every squad is solver squad, no hardcoded logic whatsoever so shit like this not happens")
  if (String(out.plan?.key ?? '').startsWith('hold:')) out.plan = null;
  return out;
}

// ================================================================ the live memory

const blankAccepted = (roadsV, dataV = roadsV, hold = false) => ({ hold,
  at: nowS(), roads_version: roadsV ?? null, data_version: dataV ?? null, roads_taken: [], pins: { must_have: '', exclude: '', items: [] },
  plan: null, lineup: null, chip: null, verdicts: [], locked_at: null, notes: [],
});
/** When you last changed a document (epoch s; 0: no choice of yours in it): the latest of its plan's start (accepted.at)
 *  and the times its rules (pins.items[].at) and calls (roads_taken[].at) were made. Never the server's updated_epoch:
 *  every PUT stamps that, and an automatic re-save (a re-plan on new roads, inkRepair's lock, idleRules' clean-up, a
 *  carry-over) is no use of the team (the user, 2026-10-22: Raketa's GW8 Palmer IN still there "even after 30 idle and
 *  absence and sign out": two restarts' new versions re-planned it, and each save looked like a use). Nor the notes:
 *  rejudge writes 'kept' ones on new data alone. A change that stamps nothing (a lineup, Hits, a rule taken off) reads
 *  as the edit before it: on this browser USED counts it. */
export function editedAt(doc) {
  const a = doc?.accepted;
  if (!a) return 0;
  return Math.max(0, num(a.at) ?? 0, ...(a.pins?.items || []).map((p) => num(p?.at) ?? 0), ...(a.roads_taken || []).map((t) => num(t?.at) ?? 0));
}
const ROADS = (entry) => `fc:mem:roads:${entry}`;
const ARCHIVE_VERSIONS = 3;

/** A memory for one page (attach() keeps the one the app uses; tests make their own). ctx: the shell's ctx. */
export function createMemory(ctx) {
  const S = {
    entry: null, A: null, doc: null, docs: null, dirty: false, seq: 0, inflight: null, flushTimer: null,
    drift: null, judged: null, pending: null, healTimer: null, healSeq: 0, queued: null, error: null, carried: null, notice: null,
    offered: { v: null, roads: [], solved: new Map() }, reopened: null, base: null, last: null, batch: null, aheadSig: null,
  };
  const subs = new Set();
  const store = ctx.store;
  const local = ctx.api.local;

  // ---------------------------------------------------------------- inputs
  // the plan's inputs, from the bank pins `list` (yours) start from (withBank: a "Bank as FPL shows" rule's)
  const cctxNow = (list = pinsNow()) => (ctx.bundle?.entry && ctx.data ? planInputs(ctx.bundle, { ...ctx.data, base: withBank(ctx.data.base, list) }) : null);
  const versionNow = () => ctx.bundle?.meta?.roads_version ?? ctx.bundle?.version ?? null;
  const gwsNow = () => ids(ctx.data?.horizon ?? ctx.bundle?.meta?.horizon);
  const endNow = () => gwsNow().at(-1) ?? S.A;
  /** S.doc's accepted, normalised (normalizeAccepted), memoised per document and roads version. */
  let accMemo = { doc: undefined, v: undefined, acc: null };
  const accNow = () => {
    const v = versionNow();
    if (accMemo.doc !== S.doc || accMemo.v !== v) accMemo = { doc: S.doc, v, acc: normalizeAccepted(S.doc?.accepted, { A: S.A, end: endNow(), roadOf, hitCap: capFor(S.doc?.accepted), hold: holdOn(S.doc?.accepted ?? null) }) };
    return accMemo.acc;
  };
  /**
   * The plan holds (holdOf: your team, no transfers unless you add them; Plan.pins carries the derived 'hold' first). The
   * switch to the model's own plan went (the user, 2026-10-19: "remove 'let forkcast make your transfers' switch"), so a
   * stored accepted.model (that switch on) is no choice any more; an older plan's rules stay, the hold around them; its stored
   * hold: false is no choice of yours (the user, 2026-10-08: a plan of three older rules, its hold written false by the
   * first edit or a Switch on a forecast update, showed the model's plan with no suggestion and no way back), and an
   * alternative taken whole in the older app (an unfrozen road pin) is no longer your plan: its moves are suggestions
   * again (withHold leaves it out; the user, 2026-10-09: a team still on the model's plan showed its Wildcard, Bench
   * Boost and Free Hit as if planned). ctx.planDefault 'model' (tests; unset in the app): the model's way unless held.
   */
  const holdOn = (acc) => {
    if ((ctx.planDefault ?? 'hold') !== 'hold') return acc?.hold === true;
    return true;
  };
  const holdNow = () => holdOn(S.doc?.accepted ?? null);
  /** F17 idle rules: a hits rule at the solver's own default cap is no rule, except under the hold (there it lifts the
   *  hold for its GW: the planner plans that week). */
  const capFor = (acc) => (holdOn(acc ?? null) ? null : hitCap(ctx.bundle?.meta));
  /** Your pins as stored, and with the hold first while the plan holds (withHold: the one list everything composes). */
  const storedNow = () => accNow()?.pins?.items || [];
  const withHold = (list) => {
    const user = list.filter((p) => p.id !== 'hold');
    if (!holdNow()) return user;
    // under the hold an unfrozen road pin (an alternative taken whole, or a lock untacked) holds nothing of yours: your
    // transfers are your sales and slides (an older document's frozen week, its locked pin, is thawed on load since
    // Freeze went: normalizeAccepted)
    const mine = user.filter((p) => !(p.id === 'road' && !p.locked));
    const { pin } = holdOf(mine, { A: S.A, end: endNow(), owned: ownedNow() });
    return pin ? [pin, ...mine] : mine;
  };
  /** You → Hits below the solver's own cap (accepted.hits_max; setHitsMax): a derived pin 'hits' (never stored, as the
   *  hold's), every GW of the window at most that many hits, composed last so it bounds every per-week cap a solve's own
   *  pins set (ahead.forkValues' later weeks at the bake's cap); after the hold is derived, so it lifts no week of it. */
  const withHits = (list, most = num(accNow()?.hits_max)) => {
    const cap = hitCap(ctx.bundle?.meta);
    if (most === null || (cap !== null && most >= cap)) return list;
    return [...list.filter((p) => p.id !== 'hits'), makePin({ id: 'hits', kind: 'hits', label: COPY.hitsMax(most), hits: Object.fromEntries(range(S.A, endNow()).map((g) => [g, most])) })];
  };
  const pinsNow = () => withHits(withHold(storedNow()));
  /** The frozen GWs (frozenWeeks: accepted.frozen; an older document's lock, GW A), ascending. */
  const frozenNow = () => frozenWeeks(accNow(), S.A, endNow());  // none since Freeze went (normalizeAccepted thaws them)
  const lockedNow = () => frozenNow().length > 0;
  const composeNow = (list = pinsNow()) => composePins(list, { from: S.A, to: endNow() });
  /** GW A's squad as the entry has it (the squad going into GW A: a Roll there keeps it). */
  const ownedNow = () => ids((ctx.data?.base?.squad || []).map((s) => s.id));
  /** The squad going into GW g on your plan as it stands (squadInto): what a Roll's clashes are judged on. */
  const intoNow = (g) => squadInto(roadWeek(getPlan().road), g, S.A, ownedNow());
  /** The engine's player lookup over the shell's data (names, positions): every name this memory writes. */
  const lookupNow = () => E.playerLookup({ base: ctx.data?.base, players: ctx.data?.players });

  // ---------------------------------------------------------------- snapshot
  function getPlan() {
    const acc = accNow();
    const version = versionNow();
    const model = ctx.bundle?.roads?.base ?? null;
    const hold = holdNow();
    // your plan is the one the solver returned for your rules (a bundle road that fits them, or a heal's: replan), never
    // one the phone evaluates; under the hold, before the first lands, none (Ahead waits for it as for the bake: an
    // untouched plan is your team as it is, never the model's: keepBase's, the plan before your first rule lands too).
    // The phone's evaluation of your exact moves (holdRoad)
    // went (the owner, 2026-10-26: its GW9 drew four Arsenal players after a Remove, "fix so every squad is solver
    // squad, no hardcoded logic whatsoever so shit like this not happens")
    // (and while a change that clears the stored plan is solved, You → Hits, a drift's "Use it", Reset plan: the last plan
    // the solver returned on this page, lastNow, never none or another's; reviewer 1 of solversquad, 2026-10-26)
    if (acc?.plan?.weeks?.length) S.last = { entry: S.entry, A: S.A, plan: acc.plan };
    const last = lastNow() ?? baseNow();
    const road = acc?.plan?.weeks?.length ? { ...acc.plan, weeks: acc.plan.weeks } : hold ? (last && { ...last, weeks: last.weeks }) : model;
    const c = composeNow();
    const gws = gwsNow();
    const tArm = (acc?.roads_taken || []).find((t) => t.call === 'armband') ?? null;
    const transfer = transferInForce(acc);
    // B141: the receipt of an edit made before a reload (onData) whose check this heal is (the same pins)
    const r = S.reopened;
    const edit = S.pending && r && r.sig === sigOf(c) ? { gw: num(r.edit), what: r.what, pins: r.pins, at: r.at } : null;
    return {
      entry: S.entry, gw: S.A, gws, end: endNow(), version, doc: S.doc, accepted: acc,
      road, model, source: acc?.plan?.weeks?.length || hold ? 'yours' : 'model', stale: !!acc?.plan && acc.plan.version !== version, hold,
      hitsMax: num(acc?.hits_max) ?? null,
      pins: pinsNow(), must_have: c.must_have, exclude: c.exclude, hits: c.hits, chips: c.chips, cash: c.cash,
      taken: { transfer, armband: tArm ? num(tArm.captain) : null }, roads_taken: acc?.roads_taken || [],
      lineup: acc?.lineup ?? null, frozen: frozenNow(), frozenLineups: acc?.frozen_lineups ?? {}, locked: frozenNow().includes(S.A), lockedAt: acc?.locked_at ?? null,
      frozenOn: frozenOnOf(acc, frozenNow()),
      weeks: (road?.weeks || []).map((w) => ({ ...w, state: weekState(w.gw) })),
      // the plan stored is the one solved for these rules (its sig): an edit whose heal ends with no plan and no error
      // lands on it (ahead.js listen)
      current: acc ? !!acc.plan?.weeks?.length && acc.plan.sig === sigOf(c) : baseNow()?.sig === sigOf(c),
      // the plan (or the error) for these rules came from a solve of exactly their values asked ahead (offer `values`):
      // the answer their heal gets, landed with no wait (ahead.js edit: its verdict as a heal's)
      ahead: S.aheadSig != null && S.aheadSig === sigOf(c),
      drift: S.drift, pending: S.pending ? { ...S.pending, cancel: undefined, ...(edit ? { edit } : {}) } : null, error: S.error, saving: S.dirty,
      carried: S.notice?.gw === S.A ? S.notice.text : null,
    };
  }

  /** The transfer call's road key while it is in force: taken, its road pin not yielded to a later ask, and the
   *  plan's GW-A squad still that road's (null otherwise: the alternative no longer stands). */
  function transferInForce(acc = accNow()) {
    const t = (acc?.roads_taken || []).find((x) => x.call === 'transfer');
    if (!t) return null;
    const rp = (acc.pins?.items || []).find((p) => p.id === 'road');
    const cur = roadByKey(t.road);
    return cur && acc.plan && !rp?.yielded && squadKey(weekAt(cur, S.A)) === squadKey(weekAt(acc.plan, S.A)) ? t.road : null;
  }

  function weekState(gw) {
    const g = Number(gw);
    if (frozenNow().includes(g)) return 'ink';
    if (g === S.A) return 'next';
    return g > S.A ? 'pencil' : 'past';
  }

  function emit(why) {
    const plan = getPlan();
    store.set('memory', plan);
    for (const fn of [...subs]) {
      try { fn(plan, why); } catch (e) { console.error('Forkcast memory: a listener failed', e); }
    }
  }

  function roadByKey(key) {
    const r = ctx.bundle?.roads || {};
    if (!key) return null;
    // your own plan taken as the call (an older document's 'yours'): the plan itself
    if (key === 'yours') return S.doc?.accepted?.plan?.weeks?.length ? S.doc.accepted.plan : null;
    if (key === 'base' || key === 'roll') return r[key] ?? null;
    const [kind, id] = String(key).split(':');
    return (kind === 'veto' ? r.veto?.[id] : kind === 'slide' ? r.slide?.[id] : null) ?? null;
  }
  /** A road by bake key for a roads version: the bundle's, else one this device archived (archiveRoads). */
  function roadOf(version, key) {
    if (!version || version === versionNow()) return roadByKey(key);
    const a = local.json(ROADS(S.entry));
    return a?.versions?.find((x) => x.v === version)?.roads?.[key] ?? null;
  }
  /** Keep the bundle's roads (weeks and values only) for the last few versions, so a plan taken on older
   *  roads can still be re-scored when only its key was stored. */
  function archiveRoads() {
    const v = versionNow();
    const roads = bundleRoads(ctx.bundle?.roads).filter((r) => r.item);
    if (!S.entry || !v || !roads.length) return;
    const a = local.json(ROADS(S.entry)) || { versions: [] };
    const have = a.versions.find((x) => x.v === v);
    if (have && Object.keys(have.roads).length >= roads.length) return;
    const entry = { v, roads: Object.fromEntries(roads.map((r) => [r.item, { key: r.key, item: r.item, values: r.values, weeks: r.weeks }])) };
    local.set(ROADS(S.entry), JSON.stringify({ versions: [entry, ...a.versions.filter((x) => x.v !== v)].slice(0, ARCHIVE_VERSIONS) }));
  }

  // ---------------------------------------------------------------- persistence
  function saveLocal() {
    if (S.entry) local.set(LOCAL(S.entry), JSON.stringify({ gw: S.A, doc: S.doc, dirty: S.dirty }));
  }
  /** The mirrored document for (entry, A) → {doc, dirty} | null: unsent
   *  changes, or the last saved document (shown when the server can't be reached; a newer server document replaces it
   *  in onData). */
  function loadLocal(entry, A) {
    const s = local.json(LOCAL(entry));
    return s && Number(s.gw) === A && s.doc ? { doc: s.doc, dirty: !!s.dirty } : null;
  }

  function flushSoon(ms = TIMING.flush) {
    clearTimeout(S.flushTimer);
    S.flushTimer = setTimeout(flush, ms);
  }
  async function flush() {
    if (!S.dirty || S.inflight || !S.entry) return;
    const seq = S.seq;
    const doc = S.doc;
    S.inflight = ctx.api.putMemory({ entry: Number(S.entry), gw: S.A, accepted: doc?.accepted ?? null, ticket: doc?.ticket ?? null });
    try {
      const saved = await S.inflight;
      if (seq === S.seq && S.doc === doc) { S.doc = samePlan(saved, doc); S.dirty = false; saveLocal(); emit('saved'); }
    } catch (e) {
      // unreachable or refused: kept locally (fc:mem:<entry>) and sent again once the server answers
      if (e?.code !== 'unreachable' && e?.code !== 'timeout') console.error('Forkcast memory: saving the plan failed', e);
    } finally {
      S.inflight = null;
      if (S.dirty && seq !== S.seq) flushSoon();
    }
  }

  /** doc, its plan the object `prev` holds when they are the same plan (a change of the pins or the ticket, the saved
   *  echo of the document sent): a plan is never changed in place, and what is drawn from it (Ahead's banks and drafts,
   *  memoised per its weeks) is not made again for a copy of it (QA-7 #2). */
  function samePlan(doc, prev) {
    const a = doc?.accepted, b = prev?.accepted;
    if (a?.plan && b?.plan && a.plan !== b.plan && JSON.stringify(a.plan) === JSON.stringify(b.plan)) a.plan = b.plan;
    return doc;
  }

  /** Change the document; returns {undo} (it restores the document as it was, if nothing changed since). */
  function mutate(fn, why) {
    if (!S.entry || !Number.isFinite(S.A)) throw new Error('Forkcast memory: no plan loaded yet');
    return op(() => {
      const doc = clone(S.doc) || { entry: Number(S.entry), gw: S.A, accepted: null, ticket: null };
      fn(doc);
      S.doc = samePlan(doc, S.doc);
      S.dirty = true;
      S.seq++;
      saveLocal();
      emit(why);
      flushSoon();
    });
  }

  /** Run one user action (it may change the document more than once, e.g. a change and the road it then
   *  finds) → {undo}: back to the document before it, while nothing else has changed it since. */
  function op(fn) {
    const before = clone(S.doc);
    fn();
    const end = S.seq;
    return {
      undo() {
        if (S.seq !== end) return false;
        S.doc = before ?? { entry: Number(S.entry), gw: S.A, accepted: null, ticket: null };
        S.dirty = true;
        S.seq++;
        saveLocal();
        S.judged = null;  // an undone Keep mine / Switch brings its drift back
        rejudge();
        emit('undo');
        flushSoon();
        if (!S.drift) replan('undo');  // a drift brought back keeps your plan as it was until you answer it
        return true;
      },
    };
  }
  /** doc.accepted in this module's shape (a blank one when there is none), ready to change. */
  const ensure = (doc) => {
    // the hold is written once the plan is yours to change (an untouched document's default made explicit)
    const hold = holdOn(doc.accepted ?? null);
    doc.accepted = doc.accepted ? normalizeAccepted(doc.accepted, { A: S.A, end: endNow(), roadOf, hitCap: capFor(doc.accepted), hold: holdOn(doc.accepted) }) : blankAccepted(versionNow(), ctx.bundle?.version, hold);
    if (typeof doc.accepted.hold !== 'boolean') doc.accepted.hold = hold;
    return doc.accepted;
  };
  /** Mark the plan as made on roads version v (and the data version it came with). */
  const stamp = (a, v = versionNow()) => { a.roads_version = v; a.data_version = ctx.bundle?.version ?? v; };
  const setPins = (acc, all) => {
    const items = all.filter((p) => p.id !== 'hold' && p.id !== 'hits');  // derived, never stored (withHold, withHits)
    const c = composePins(items, { from: S.A, to: endNow() });
    acc.pins = { must_have: c.must_have, exclude: c.exclude, items };
  };

  // ---------------------------------------------------------------- planning
  /** Your plan's road for the current pins: a bundle road (or one offered: offer) when one fits, else a heal
   *  (debounced). */
  function replan(why = 'pins') {
    if (S.batch) { S.batch.why = why; return; }
    const acc = accNow();
    const list = pinsNow();
    // under the hold a team with no document is still planned: your team as it is, the solver's (keepBase)
    if (!acc && !holdNow()) return;
    if (!list.length) {
      if (!acc) return;
      cancelHeal();
      S.error = null;
      if (acc.plan && !lockedNow()) mutate((d) => { ensure(d).plan = null; }, 'plan');
      return;
    }
    const c = composeNow(list);
    const sig = sigOf(c);
    const v = versionNow();
    // the plan these pins replace, solved on these roads, may be theirs again (a chip taken back off): offered too
    if (acc?.plan?.weeks?.length && acc.plan.version === v) offer(acc.plan);
    const also = S.offered.v === v ? S.offered.roads : [];
    const hit = findRoad(fitRoads(), c, gwsNow(), also);
    if (hit) {
      cancelHeal();
      S.error = null;  // these rules have a plan: an earlier "can't keep them all" is over
      S.aheadSig = null;
      if (!acc) { keepBase(hit, v, sig); return; }
      if (acc.plan?.key !== hit.key || acc.plan?.version !== v || acc.plan?.sig !== sig) {
        const own = yours(why, acc, sig);
        mutate((d) => { ensure(d).plan = planOfRoad(hit, v, sig); }, 'plan');
        if (own) { markSeen(); receipt(sig); }  // your own change, not "new data re-planned your pencil weeks" (§5.5)
      }
      return;
    }
    if (!acc && baseNow()?.sig === sig && baseNow().version === v) return;
    if (acc?.plan?.sig === sig && [v, ctx.bundle?.version].includes(acc.plan.version) && !brokenCells(acc.plan, c).length) {
      // the plan is already the one for these rules (an Undo took the failing one back): nothing to solve. Never one
      // whose squads break them (QA-5 #1: a lock never sits over a plan that buys someone else in GW A)
      cancelHeal();
      S.aheadSig = null;
      if (S.error) { S.error = null; emit('plan'); }
      return;
    }
    // a solve of exactly the values the heal would send, asked ahead (offer `values`: ahead.js presolve): its answer, the
    // same request's, at once (the owner, 2026-10-26: "fix speed so all pre solved and done without no cost")
    const k = keyNow();
    const got = k && S.offered.v === v ? S.offered.solved.get(k) : null;
    if (got) { cancelHeal(); took(got, sig, why, true); return; }
    // the plan heal is a user-class solve (api/mobile.py PURPOSES): one per client, a newer one supersedes it. Debounced
    // for an edit (a second tap re-plans once); a re-plan of no edit (a team opened, new roads: 'sync') asks at once (the
    // owner, 2026-10-26: opening the app went 1.7 s → 2.0 s once an untouched team's plan became a solve)
    scheduleHeal('heal', { reason: why, now: why === 'sync', ahead: k });
  }
  /** The bundle's roads a plan may be found in: its hold road (your team, every GW rolled) only on a bundle of this data
   *  and while its GW-A squad is your team's (the review of presolve, 2026-10-26: a stale bundle's, from before a
   *  transfer made on FPL, fitted the untouched rules whatever its squad). */
  const fitRoads = () => {
    const r = ctx.bundle?.roads, h = r?.hold;
    return !h || (ctx.bundle?.state !== 'stale' && squadKey(weekAt(h, S.A)) === idsKey(ownedNow())) ? r : { ...r, hold: null };
  };
  /** The key (solvedKey) of the solve your pins' heal sends now, or null while it can't be made (no bundle yet). */
  const keyNow = () => { try { return solvedKey(ctx.bundle?.version ?? null, values()); } catch { return null; } };

  /** A solve's answer for your pins as they are (`sig`): its road your plan (a team with no document: keepBase), or its
   *  error said (Plan.error); `ahead`: a solve of exactly these values asked ahead (Plan.ahead). One way for a heal's
   *  answer and one asked ahead (runHeal, replan, offer), so the two are the same plan. */
  function took(r, sig, reason, ahead = false) {
    S.aheadSig = ahead ? sig : null;
    if (r.road) {
      S.error = null;
      if (!accNow()) { keepBase(r.road, versionNow(), sig); return; }
      const own = yours(reason, accNow(), sig);
      mutate((d) => { ensure(d).plan = planOfRoad(r.road, ctx.bundle?.version ?? versionNow(), sig); }, 'plan');
      if (own) { markSeen(); receipt(sig); }
    } else {
      S.error = r.error ?? { code: 'solver', plain: COPY.infeasible(S.A) };
      emit('error');
      receipt(sig, S.error);
    }
  }

  /** `fn`'s changes of your rules (an edit's drops and adds, an Undo's restore) planned once, after the last of them:
   *  never a plan found or solved for the rules half changed in between (a drop's re-plan landed an older offered road,
   *  an unrelated solver plan, drawn while the edit's own solve ran; the owner, 2026-10-26: "fix so every squad is
   *  solver squad"). → fn's result */
  function batch(fn) {
    if (S.batch) return fn();
    S.batch = { why: null };
    try { return fn(); } finally {
      const { why } = S.batch;
      S.batch = null;
      if (why) replan(why);
    }
  }

  /**
   * Your team as it is under the hold, with no document of yours yet (a team you only look at): the plan the solver
   * returned for it (replan: a bundle road that fits, else a heal), kept on this page alone, so looking at a team writes
   * nothing (editedAt: never a use); offered too, so Reset plan lands on it at once. Until it lands there is no plan to
   * draw (getPlan: road null, Ahead waits as for the bake): the phone's evaluation of your team (holdRoad) went (the
   * owner, 2026-10-26: "fix so every squad is solver squad, no hardcoded logic whatsoever").
   */
  function keepBase(road, v, sig) {
    S.base = { entry: S.entry, A: S.A, plan: planOfRoad(road, v, sig) };
    S.last = S.base;
    offer(road);
    emit('plan');
  }
  const baseNow = () => (S.base?.entry === S.entry && S.base.A === S.A ? S.base.plan : null);
  /** The plan the solver returned that this page drew last, for this team and GW A (getPlan's while none is stored). */
  const lastNow = () => (S.last?.entry === S.entry && S.last.A === S.A ? S.last.plan : null);

  function cancelHeal() {
    clearTimeout(S.healTimer);
    S.healTimer = null;
    S.queued = null;
    if (S.pending) { S.pending.cancel?.(); S.pending = null; S.healSeq++; emit('heal'); }
  }

  function scheduleHeal(purpose = 'heal', { now = false, reason = 'pins', ahead = null } = {}) {
    clearTimeout(S.healTimer);
    const my = ++S.healSeq;
    S.pending?.cancel?.();
    // (`ahead`: its values' solvedKey, so a solve of them asked ahead that lands meanwhile is its answer: offer)
    S.pending = { purpose, reason, state: 'waiting', key: null, position: null, since: Date.now(), ahead };
    emit('heal');
    return new Promise((resolve) => {
      S.healTimer = setTimeout(() => resolve(runHeal(purpose, my)), now ? 0 : TIMING.heal);
    });
  }

  /**
   * QA-2: whether a re-plan is your own edit's: asked for by you, or (a re-plan that runs after a reload, as 'sync')
   * for pins the plan wasn't solved for yet. New data alone re-plans a plan already solved for these pins: that
   * is the pencil diff's "New forecast re-planned these pencil weeks".
   */
  const yours = (why, acc, sig) => why !== 'sync' || acc?.plan?.sig !== sig;

  async function runHeal(purpose, my) {
    if (my !== S.healSeq || !S.entry) return { state: 'superseded' };
    let vals, sig;
    try { vals = values(); sig = sigOf(composeNow()); } catch (e) {
      console.warn('Forkcast: pins', e);
      S.pending = null; S.error = { code: 'pins', plain: COPY.unfinished, detail: String(e?.message || e) }; emit('error');
      return { state: 'error', error: S.error };
    }
    const reason = S.pending?.reason;
    const p = solveKept(ctx.api, { entry: Number(S.entry), purpose, values: vals }, {
      onUpdate: (s) => { if (my === S.healSeq && S.pending) { Object.assign(S.pending, { key: s.key, state: s.state, position: s.position ?? null }); emit('heal'); } },
    });
    if (S.pending) S.pending.cancel = p.cancel;
    try {
      const r = await p;
      if (my !== S.healSeq) return r;
      S.pending = null;
      S.queued = null;
      if (sigOf(composeNow()) !== sig) {
        // QA-5 #1: your pins changed while it solved and nothing re-planned them (your plan memory from another device,
        // arriving with the bundle): a road solved for other pins is never your plan, it may break them (a GW-A buy under
        // a lock). It is kept as one that may fit again (offer: roadFits decides), and the plan re-plans for the pins as
        // they are now (a road that fits, the plan already theirs, or one heal).
        if (r.state === 'done' && r.road) offer(r.road);
        emit('heal');
        replan(reason ?? 'pins');
        return { state: 'superseded' };
      }
      if ((r.state === 'done' && r.road) || r.state === 'error') took(r, sig, reason);
      else emit('heal');
      return r;
    } catch (e) {
      if (my !== S.healSeq) return { state: 'superseded' };
      // the server is away: the solve waits until it answers again (§5.2 "Solves are queued until it is back")
      if (e?.code === 'unreachable' || e?.code === 'timeout') {
        S.queued = purpose;
        if (S.pending) Object.assign(S.pending, { state: 'offline', cancel: undefined });
        emit('heal');
        return { state: 'offline' };
      }
      S.pending = null;
      S.error = { code: 'http', plain: ctx.api?.plain ? ctx.api.plain(e) : COPY.unfinished, detail: e?.message || String(e) };
      emit('error');
      return { state: 'error', error: S.error };
    }
  }

  /** Resolves when no heal is waiting or in flight (an offline one counts as settled: it waits for the server). */
  function settled() {
    return new Promise((res) => {
      const check = () => (S.pending && S.pending.state !== 'offline' ? setTimeout(check, 250) : res());
      check();
    });
  }

  /** The solve values of your pins after an edit that drops `drop` (ids) and adds `extra` (pinsAfter: exactly the
   *  pins the edit makes, so its heal asks for the same values), the edit not made. `order`: the edit's own reorder of
   *  your rules after it (ahead.js edit's inPlace); `hitsMax`: You → Hits as the edit leaves it (null: the solver's own
   *  cap; Reset plan's), else as it is. */
  function values({ extra = [], drop = [], order = null, hitsMax } = {}) {
    const after = pinsAfter(storedNow(), { add: extra, drop }, S.A, ownedNow());
    const list = withHits(withHold(order ? order(after) : after), hitsMax === undefined ? num(accNow()?.hits_max) : num(hitsMax));
    const cctx = cctxNow(list);
    if (!cctx) throw new Error('Forkcast memory: no bundle yet');
    return planValues(cctx, list);
  }

  /** A road this page solved for some pins (F14: a chip prepared with your rules; a Wish pill; a plan your pins had
   *  before): replan takes it as your plan when it fits your pins as a bundle road would (findRoad: roadFits), so the
   *  edit it was solved for lands without a solve. Kept for the roads version it came on (the newest few, one per
   *  solve key). With `values` (ahead.js presolve: a tap's solve asked before the tap), the answer of a solve of exactly
   *  those values, a road or its error ({road, error}: the solver's own 'infeasible' alone, the one that never changes on
   *  the same data), kept apart (SOLVED_MAX): replan takes it only for pins whose heal would send exactly those values
   *  (solvedKey), never for others a road fits (the owner, 2026-10-26: "all pre solved and done without no cost", a
   *  pre-solved plan the very solve the tap would ask); the heal of those values already waiting takes it at once. */
  function offer(road, { values: vals = null, error = null, version = null } = {}) {
    const v = versionNow();
    if (S.offered.v !== v) S.offered = { v, roads: [], solved: new Map() };
    if (vals) {
      if (version == null || (!road?.weeks?.length && error?.code !== 'infeasible')) return;
      // (keyed by the data version its values were made on: a bundle that came since keys its own)
      const k = solvedKey(version, vals), got = road?.weeks?.length ? { road, error: null } : { road: null, error };
      const solved = S.offered.solved;
      solved.delete(k);
      solved.set(k, got);
      for (const old of solved.keys()) { if (solved.size <= SOLVED_MAX) break; solved.delete(old); }
      if (S.pending?.ahead === k && S.pending.state !== 'offline' && keyNow() === k) {
        const { reason } = S.pending;
        cancelHeal();
        took(got, sigOf(composeNow()), reason, true);
      }
      return;
    }
    if (!road?.weeks?.length) return;
    const same = (r) => r === road || (road.key != null && r.key === road.key);
    S.offered.roads = [road, ...S.offered.roads.filter((r) => !same(r))].slice(0, OFFERED_MAX);
  }

  // ---------------------------------------------------------------- drift
  /** Judge drift for the current roads (once per accepted plan × roads version); auto-notes a small new idea. */
  function rejudge() {
    const acc = accNow();
    const version = versionNow();
    const fresh = ctx.bundle?.state !== 'stale' && version && version === ctx.bundle?.version;
    if (!acc?.plan || !fresh) { S.drift = null; return; }
    const sig = `${version}|${madeOn(acc)}|${acc.plan.key}|${acc.plan.version}|${acc.lineup?.captain}|${JSON.stringify(acc.pins?.items?.map((p) => p.id))}`;
    if (S.judged === sig) return;
    S.judged = sig;
    let d = null;
    try { d = detectDrift(cctxNow(), acc, version, { frozen: frozenNow(), before: roadOf(madeOn(acc), 'base'), hold: pinsNow().find((p) => p.id === 'hold') ?? null }); } catch (e) { console.error('Forkcast memory: drift check failed', e); }
    S.drift = d?.kind === 'drift' ? d : null;
    if (d && d.kind !== 'drift') {
      // "Otherwise your plan stays, and the journal notes 'New idea +0.3, kept yours'" (§7.7)
      mutate((doc) => {
        const a = ensure(doc);
        stamp(a, version);
        // the new idea is what the new data gains (never your own rules' or lineup's cost): none, or unknown, is no note
        const idea = ideaOf(d);
        if (d.kind === 'kept' && idea && idea.delta >= 0.05) a.notes = [...(a.notes || []), { kind: 'kept', at: nowS(), text: d.reach ? COPY.kept : COPY.keptLocked(d.gw), ...idea }].slice(-20);
      }, 'drift');
      replan('sync');
    }
  }
  const round2 = (x) => Math.round(x * 100) / 100;
  /** What a drift's new data gains (d.fresh, its verdict d.freshLabel: never your own rules' or lineup's cost) as a
   *  journal note's {delta, label}, or null when unknown. The drift's toast says it (COPY.driftHead: "+0.5 of it
   *  new"), and so do the notes. */
  const ideaOf = (d) => (d?.fresh == null ? null : { delta: round2(d.fresh), label: d.freshLabel ?? E.verdictLabel(d.fresh, cctxNow()?.noise ?? 0) });

  /** Keep mine (the drift's toast left any way but its action: ahead.driftSay): your plan stays, and the journal notes
   *  what you kept it over: the new idea (ideaOf, the part of the
   *  gap that is news, as the toast said it) when the new best won by it, else what drifted (a player now flagged, a
   *  week over budget). text: the note in other words (planWithout's). */
  function keepMine({ text } = {}) {
    const d = S.drift;
    if (!d) return { undo: () => false };
    S.drift = null;
    const idea = !d.same && d.wins ? ideaOf(d) : null;
    return op(() => {
      mutate((doc) => {
        const a = ensure(doc);
        stamp(a, d.version);
        const note = text ?? (idea ? COPY.keptOver : `Kept your plan: ${d.what}`);
        a.notes = [...(a.notes || []), { kind: 'kept', at: nowS(), text: note, delta: idea?.delta ?? null, label: idea?.label ?? null }].slice(-20);
      }, 'drift');
      replan('sync');
    });
  }

  /** The drift toast's "Use it" (switchWithUndo): this GW goes back to today's best plan (a picked alternative goes with it). Your
   *  rules stay (RULES_V2: nothing you said is silently forgotten): the plan re-plans with them. A locked GW A
   *  (ink) is never switched: refused unless the new best keeps it (d.reach); none since Freeze went (the read thaws
   *  an older document's lock), so d.reach is always true. */
  function adoptDrift() {
    const d = S.drift;
    if (!d || !d.reach) return { undo: () => false, refused: !!d };
    S.drift = null;
    cancelHeal();
    let asks = [];
    return op(() => {
      mutate((doc) => {
        const old = ensure(doc);
        // a Switch gains today's best's gap; a re-plan with your rules is a new plan whose gap is not known yet: no number
        const note = { kind: 'adopted', at: nowS(), text: COPY.driftAdopted(d), delta: d.broken?.length ? null : round2(d.delta), label: d.broken?.length ? null : d.label };
        asks = old.pins.items.filter((p) => p.id !== 'road' || p.locked);
        // ink (an older lock: none since the read thaws it): the calls and the lock stay (the new best has the same
        // GW A); else a blank plan with your rules
        const a = lockedNow() ? { ...old, plan: null } : blankAccepted(d.version, ctx.bundle?.version, old.hold);
        stamp(a, d.version);
        setPins(a, asks);
        a.notes = [...(old.notes || []), note].slice(-20);
        doc.accepted = a;
      }, 'drift');
      if (asks.length) replan('pins');
    });
  }

  // ---------------------------------------------------------------- actions
  /** A journal note (the calls journal, journalRows; the You sheet drew it until its History went, 2026-10-08): {kind, text, cmp}. No caller since Ahead's
   *  pickAlternative (its 'picked') went, 2026-10-12. */
  function note({ kind, text, cmp = null } = {}) {
    return mutate((doc) => {
      const a = ensure(doc);
      a.notes = [...(a.notes || []), { kind, at: nowS(), text, delta: cmp ? round2(cmp.delta) : null, label: cmp?.label ?? null }].slice(-20);
    }, 'note');
  }

  /** §7.7 ink: GW A under way: when one of `pins` would change it (changesLiveA), {gw: null, text: COPY.live} (FPL's
   *  now; Ahead's edit says it as a warning toast). A frozen GW never changes either: one of `pins` that would change
   *  one (frozenClash: an ask that brings someone in or keeps someone out there, a Roll, hits rule or chip of that GW)
   *  gives {gw, text} (COPY.frozenEdit with when it froze), none since Freeze went (the read thaws an older document's
   *  lock, so lockedNow is false); else null. inkClash(pins): that text, or null (Ahead asks first). */
  function inkOf(pins = []) {
    const live = deadlinePassed(ctx.bundle?.meta);
    if (!lockedNow() && !live) return null;
    const rp = pinsNow().find((p) => p.id === 'road');
    for (const p of pins) {
      const pin = p?.must ? p : makePin(p);
      // GW A under way (its deadline passed; the bundle keeps it as next until FPL publishes its picks): FPL has its
      // transfers, so no edit changes it, as a frozen week's (the six-book review, 2026-10-09); said first, frozen or not
      // (B89: nothing to unfreeze there)
      if (live && changesLiveA(pin)) return { gw: null, text: COPY.live(S.A) };
      const g = lockedNow() ? frozenClash(rp, pin, S.A) : null;
      if (g != null) return { gw: g, text: COPY.frozenEdit(g, frozenSince(frozenOnOf(accNow(), frozenNow()), g).at) };
    }
    return null;
  }
  const inkClash = (pins = []) => inkOf(pins)?.text ?? null;
  /** GW A under way: `pin` would change GW A as the plan has it (its squad after GW A's moves, intoNow(A + 1), with or
   *  without a road pin): someone brought in that squad hasn't, someone kept out it has, or a Roll, hits rule or chip of
   *  GW A. A Keep of a player it has, or any rule of a later week, is no change of GW A. */
  const changesLiveA = (pin) => {
    const A = S.A, squad = new Set(intoNow(A + 1));
    if (heldAt(pin.must, A).some((id) => !squad.has(id)) || heldAt(pin.excl, A).some((id) => squad.has(id))) return true;
    return (num(pin.gw) === A && (isRoll(pin) || ['hits', 'chip'].includes(kindOf(pin)))) || Object.keys(pin.hits || {}).map(Number).includes(A) || !!(pin.chips && A in pin.chips);
  };

  function addPin(pin, { replace = true } = {}) {
    const p = pin?.must ? pin : makePin(pin);
    if (p.id === 'hold') return { ok: false, conflicts: [], clash: null, undo: () => false };  // derived, never yours to add
    const ink = inkClash([p]);
    if (ink) return { ok: false, locked: true, conflicts: [], clash: ink, undo: () => false };
    // an ask that remakes GW A outranks the transfer call there: the road pin yields its GW-A hold (yieldRoad)
    const rp = pinsNow().find((x) => x.id === 'road');
    const yields = !!rp && !rp.yielded && changesGwA(rp, p, S.A, ownedNow());
    const conflicts = pinConflicts(pinsNow(), p, { from: S.A, to: endNow(), into: intoNow }).filter((c) => !(yields && c.pin?.id === 'road') && c.pin?.id !== 'hold');
    const clash = conflicts.length ? clashText(conflicts[0], p) : null;
    if (conflicts.length && !replace) return { ok: false, conflicts, clash, undo: () => false };
    const r = op(() => {
      mutate((doc) => {
        const a = ensure(doc);
        setPins(a, pinsAfter(a.pins.items, { add: [p] }, S.A, ownedNow()));
        if (!madeOn(a)) stamp(a);
      }, 'pins');
      replan('pins');
    });
    return { ok: true, conflicts, clash, undo: r.undo };
  }

  function clashText(c, p) {
    const L = lookupNow();
    const name = L.name(c.id);
    const held = (c.pin?.must || []).filter(([id]) => id === c.id).map(([, , b]) => b);
    if (c.was === 'in') return COPY.pinClash(name, held.length ? Math.max(...held) : Math.max(...c.gws), Math.min(...c.gws));
    const g = Math.min(...c.gws);
    // a Roll of GW g against an ask that moves someone then (pinConflicts: 'roll' an older Roll, 'moves' an older ask),
    // said as its rule reads (COPY.rollRule)
    if (c.was === 'roll') return `Moving ${name} in GW${g} clashes with ${COPY.rollRule(g, rollKeeps(c.pin))}. Which one?`;
    if (c.was === 'moves') return `${COPY.rollRule(g, rollKeeps(p))} clashes with ${c.pin?.label || 'an earlier pick'} (it moves ${name} in GW${g}). Which one?`;
    return `Buying ${name} in GW${g} clashes with ${c.pin?.label || 'an earlier pick'}. Which one?`;
  }

  /** Drop the pins `drop(p)` picks; the road pin with them takes the transfer call along (else normalizeAccepted
   *  would make it again from roads_taken) and the rules it came with (`via`); a locked road pin (ink) never goes. */
  function dropPins(a, drop) {
    const items = pinsAfter(a.pins.items, { drop });
    if (items.length === a.pins.items.length) return false;
    const road = a.pins.items.some((p) => p.id === 'road') && !items.some((p) => p.id === 'road');
    setPins(a, items);
    if (road) {
      a.roads_taken = a.roads_taken.filter((t) => t.call !== 'transfer');
      a.verdicts = a.verdicts.filter((v) => v.call !== 'transfer');
    }
    return true;
  }

  function removePin(id) {
    if (id === 'hold' || (id === 'road' && pinsNow().find((p) => p.id === 'road')?.locked)) return { undo: () => false, refused: true };
    return op(() => {
      mutate((doc) => { if (doc.accepted) dropPins(ensure(doc), (p) => p.id === id); }, 'pins');
      replan('pins');
    });
  }

  /** Every rule off (keepRoad: the alternative you picked for GW A stays). A locked GW A stays (ink). */
  function clearPins({ keepRoad = true } = {}) {
    return op(() => {
      mutate((doc) => { if (doc.accepted) dropPins(ensure(doc), (p) => !(keepRoad && p.id === 'road')); }, 'pins');
      replan('pins');
    });
  }

  /** GW A becomes ink on `a` (F5: an older document's ticket, inkRepair): locked_at, and the road pin holds GW A's squad
   *  as the ticket handed it off (`squad`, else the plan's GW A) with `locked` set. No caller (none since f543bdf7,
   *  2026-10-08, when Freeze per week replaced Lock in: inkRepair locks on its own). */
  function inkIn(a, squad = null, by = null) {
    if (!a.plan) {
      const road = ctx.bundle?.roads?.base;
      if (road) a.plan = planOfRoad(road, versionNow(), sigOf(composePins([pinRoad(road, S.A)], { from: S.A, to: endNow() })));
    }
    const hold = squad?.length ? squad : squadOf(weekAt(a.plan, S.A));
    if (squad?.length && a.plan && squadKey(weekAt(a.plan, S.A)) !== [...squad].sort((x, y) => x - y).join(',')) a.plan = null;  // re-plans
    if (!a.locked_at) a.locked_at = nowS();
    if (by) a.locked_by = by;
    const rp = a.pins.items.find((p) => p.id === 'road');
    if (!hold.length) return;
    setPins(a, [lockPin(rp, hold, S.A, a.plan?.item ?? 'base'), ...a.pins.items.filter((p) => p.id !== 'road')]);
  }



  /** "Reset plan" (the You sheet; the user, 2026-10-10: "forget all my choice rules and everything it cached … reset to
   *  the state of new team … the model side solves might still be cached"): this GW's document as a new team's (no rules,
   *  no transfers of yours, nothing frozen or locked, no lineup, your team as it is: accepted and ticket none), this
   *  browser's edit receipt and seen plan gone; the bundle's roads and the ones you were offered stay. The plan
   *  re-plans. → {undo} (the document as it was) */
  function reset() {
    const r = mutate((doc) => { doc.accepted = null; doc.ticket = null; }, 'pins');
    if (S.entry) { local.set(EDIT(S.entry), null); local.set(SEEN(S.entry), null); }
    S.reopened = null;
    S.drift = null;
    S.judged = null;
    S.error = null;
    replan('pins');
    return r;
  }

  /** The hits Forkcast may take a week (n: 0, 1, …; null the solver's own cap: no field), for every solve after it. */
  function setHitsMax(n) {
    const r = mutate((doc) => { const a = ensure(doc); if (num(n) == null) delete a.hits_max; else a.hits_max = num(n); a.plan = null; }, 'pins');
    replan('pins');
    return r;
  }


  function setLineup(patch = {}) {
    return mutate((doc) => {
      const a = ensure(doc);
      a.lineup = { ...(a.lineup || {}), ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) };
    }, 'lineup');
  }

  function setPlan(road, { why = 'plan' } = {}) {
    cancelHeal();
    return mutate((doc) => { ensure(doc).plan = planOfRoad(road, ctx.bundle?.version ?? versionNow(), sigOf(composeNow())); }, why);
  }

  function heal({ purpose = 'heal', now = false } = {}) {
    // (under the hold a team with no document of yours is planned too: keepBase)
    if ((!accNow() && !holdNow()) || !pinsNow().length) return Promise.resolve({ state: 'done', road: getPlan().road });
    return scheduleHeal(purpose, { now });
  }

  function compare() {
    const cctx = cctxNow();
    const plan = getPlan();
    if (!cctx || !plan.model || plan.source === 'model') return null;
    const mine = planFromRoad(cctx, plan.road, plan.lineup || {});
    const model = planFromRoad(cctx, plan.model);
    return compareIn(cctx, mine.evaluation, model.evaluation);
  }

  // ---------------------------------------------------------------- edit receipts (QA-2)
  /** GW A's lineup and the plan as engine evaluations (calls.planFromRoad): what a receipt compares. */
  const evalOf = (road) => {
    const cctx = cctxNow();
    return cctx && road?.weeks?.length ? planFromRoad(cctx, road, accNow()?.lineup || {}).evaluation : null;
  };
  const lite = (ev) => ev.gws.map((w) => ({ gw: w.gw, xi: w.xi, bench: w.bench, captain: w.captain, chip: w.chip, hits: w.hits, ft: w.ft, used: w.used, points: w.points, moves: w.moves.filter((m) => m.ok).map((m) => ({ out: m.out, in: m.in })) }));
  /** Ahead's edit, healing: what it was, the plan before it and your pins before it, for the pins it made; `edit`, the
   *  GW it changes first (B141: the week a reload marks ≈ while its check runs; gw stays GW A, the receipt's). */
  function noteEdit({ what, dir = null, pins = null, edit = null } = {}) {
    if (!S.entry) return;
    const before = evalOf(getPlan().road);
    local.set(EDIT(S.entry), JSON.stringify({ gw: S.A, edit, what, dir, pins, sig: sigOf(composeNow()), before: before ? lite(before) : null, at: Date.now() }));
  }
  /** Ahead speaks for its own edit (its toast): the receipt is taken, so nothing speaks twice. */
  function claimEdit() {
    const r = S.entry ? local.json(EDIT(S.entry)) : null;
    if (S.entry) local.set(EDIT(S.entry), null);
    S.reopened = null;
    return r;
  }
  /** A heal for the pins of a receipt nobody took landed (`error`: failed): say what the edit did, with Undo, in the
   *  place of its pending toast (B141: Ahead raises it again after a reload: Plan.pending.edit). */
  function receipt(sig, error = null) {
    const r = S.entry ? local.json(EDIT(S.entry)) : null;
    if (!r || Number(r.gw) !== S.A || r.sig !== sig) return;
    local.set(EDIT(S.entry), null);
    S.reopened = null;
    const toast = ctx.ui?.toast;
    if (!toast) return;
    const undo = Array.isArray(r.pins) ? { label: 'Undo', onClick: () => restorePins(r.pins) } : undefined;
    // (a failure about your rules said as one; the solver's own, the connection's, in their own words: reviewer 2 of
    // solversquad, 2026-10-26)
    const rules = !error?.code || error.code === 'infeasible' || error.code === 'pins';
    if (error) { toast(rules ? COPY.rulesClash(null, r.what) : error.plain || COPY.unfinished, 'warn', { timeout: 9000, action: undo, replaces: 'pending' }); return; }
    const now = evalOf(getPlan().road);
    if (!now || !r.before) return;
    const cmp = compareIn(cctxNow(), now, { gws: r.before });
    // a hit the plan takes that its rules don't allow is said with it (QA-5 #3: the plan before is a phone evaluation, so
    // every such week of the plan now is named)
    toast(withForced(changeText(r.what, cmp, { dir: r.dir, transfers: [transfersOf({ gws: r.before }), transfersOf(now)] }), forcedHits(getPlan().road, gwsNow())),
      'info', { timeout: 6500, action: undo, replaces: 'pending' });
  }
  /** Your pins back as they were before an edit (a receipt's Undo); the plan re-plans for them. */
  function restorePins(pins) {
    return op(() => {
      mutate((doc) => { setPins(ensure(doc), pins); }, 'undo');
      replan('pins');
    });
  }

  // ---------------------------------------------------------------- pencil diff (per device)
  function pencilDiff() {
    const plan = getPlan();
    if (!S.entry || !plan.road?.weeks) return null;
    const seen = local.json(SEEN(S.entry));
    const sig = `${plan.road.key}|${plan.version}`;
    if (!seen || Number(seen.gw) !== S.A) { markSeen(); return null; }
    if (seen.sig === sig) return null;
    const L = lookupNow();
    return pencilChanges(seen.weeks, plan.road.weeks, S.A, L);
  }
  function markSeen() {
    const plan = getPlan();
    if (!S.entry || !plan.road?.weeks) return;
    local.set(SEEN(S.entry), JSON.stringify({ gw: S.A, sig: `${plan.road.key}|${plan.version}`, v: plan.version, src: !plan.hold && plan.source === 'model' ? 'model' : 'yours', weeks: plan.road.weeks.map((w) => ({ gw: w.gw, in: w.in, out: w.out })) }));
  }
  /**
   * B14 (review3 Part 1 §2, choice_bets "forecast updates as a change of path": a new forecast swapped the suggested
   * plan's GW6 buy and nothing said so): on the suggested plan with no rules of yours (source 'model', off the hold), what
   * the new forecast changed in its moves since this device last looked at that plan (markSeen), when today's best gains
   * on the model's road it was seen on beyond the noise (isNews, detectDrift's test; that road archived here, else
   * nothing). Under the hold your plan stays as it is, but the suggested plans follow the model's best road (the bake's
   * base): what the new forecast changed in that road since then (the user, 2026-10-12, review 5: a new forecast changed
   * the week's top plan unsaid) → {version, gwA: GW A's moves in words (movesChanged) | null, pencil: the later weeks'
   * (pencilChanges) | null, held} | null (nothing new, or no change of moves).
   */
  function forecastChange() {
    const plan = getPlan();
    const seen = S.entry ? local.json(SEEN(S.entry)) : null;
    const held = !!plan.hold;
    if ((!held && (plan.source !== 'model' || seen?.src !== 'model')) || Number(seen?.gw) !== S.A || !seen.v || seen.v === plan.version) return null;
    const was = roadOf(seen.v, 'base'), now = held ? roadByKey('base') : plan.road;
    const cctx = cctxNow();
    if (!cctx || !now?.weeks || !isNews(cctx, freshOf(cctx, planFromRoad(cctx, now).evaluation, was))) return null;
    const L = lookupNow();
    const gwA = movesChanged(weekAt(held ? was : seen, S.A), weekAt(now, S.A), L);
    const pencil = held ? pencilChanges(was.weeks, now.weeks, S.A, L) : pencilDiff();
    return gwA || pencil ? { version: plan.version, gwA, pencil, held } : null;
  }

  // ---------------------------------------------------------------- journal
  async function loadAll() {
    if (!S.entry) return {};
    const out = await ctx.api.request('GET', '/api/m/memory', { query: { entry: S.entry, gw: 'all' } });
    S.docs = out?.docs || {};
    return S.docs;
  }
  async function journal() {
    let docs = {};
    try { docs = await loadAll(); } catch (e) { if (e?.code !== 'unreachable' && e?.code !== 'timeout') throw e; docs = S.docs || {}; }
    if (S.doc) docs = { ...docs, [S.A]: S.doc };
    const L = lookupNow();
    return journalRows(docs, { nameOf: L.name });
  }

  // ---------------------------------------------------------------- following the shell
  /** A team whose choices have gone unused FORGET_MS: the later of this browser's last use of it (USED) and your last
   *  edit in its documents (editedAt: the mirror's, the server's, any device's; never an automatic re-save's PUT) is that
   *  long ago. No document: nothing to clear. */
  function unused(entry, ...docs) {
    const last = Math.max(Number(local.get(USED(entry))) || 0, ...docs.map((d) => editedAt(d) * 1000));
    return last > 0 && Date.now() - last > FORGET_MS;
  }
  function onData() {
    const b = ctx.bundle;
    if (!b?.entry || !b.meta || !ctx.data) return;
    const entry = String(b.entry.id);
    const A = Number(b.meta.gw);
    let why = 'bundle';
    if (entry !== S.entry || A !== S.A) {
      cancelHeal();
      const kept = loadLocal(entry, A);
      // B141: an edit noted before a reload, its check not landed yet: its receipt, while the heal running is its own (getPlan)
      const r = local.json(EDIT(entry));
      Object.assign(S, { entry, A, doc: kept?.doc ?? null, docs: null, dirty: !!kept?.dirty, drift: null, judged: null, error: null, carried: null, notice: null, base: null,
        reopened: r && Number(r.gw) === A ? r : null,
        // not used for FORGET_MS (USED), or signed out of before its forgetting reached the server (forget): wiped as it
        // loads, with no way back
        wipe: unused(entry, kept?.doc, b.memory) || !!local.get(FORGET(entry)) });
      // a forgetting that has not reached the server (offline, or still on its way): its other GWs' documents too
      if (local.get(FORGET(entry))) forget(ctx.api, entry);
    }
    const server = b.memory ?? null;
    if (!S.dirty && server && server !== S.doc && (!S.doc || (server.updated_epoch ?? 0) >= (S.doc.updated_epoch ?? 0))) {
      S.doc = server;
      saveLocal();  // the mirror the plan shows from when the server can't be reached
    }
    // unused (USED, editedAt) or forgotten (FORGET): loaded as Reset plan leaves it (reset: no rule, transfer, frozen week or lineup of yours, your team as it
    // is), once, before anything reads it. Always written, so a new GW A has a document of its own and nothing carries
    // into it from the GW before (carryOver; the review, 2026-10-14: a deadline passed while away brought GW A-1's
    // rules back)
    if (S.wipe) {
      S.wipe = false;
      reset();
    }
    if (S.dirty) flushSoon();
    // F5: an older document's ticket locked in FPL was GW A's ink; one that lost it (a Switch kept the ticket) is mended,
    // and the read thaws that lock again (accNow: normalizeAccepted, since Freeze went 2026-10-12)
    const fix = S.doc ? inkRepair(S.doc, { A, roads: b.roads, nameOf: lookupNow().name }) : null;
    if (fix) { mutate((doc) => { doc.accepted = fix; }, 'lock'); replan('pins'); }
    // F17: a saved plan with a hits or Roll rule its Wildcard / Free Hit week makes idle (or a hits rule at the solver's
    // own default) reads without it (normalizeAccepted); the cleaned document is written back once, so the rule row is
    // gone on every device too
    const idle = S.doc?.accepted ? idleRules(S.doc.accepted.pins?.items || [], { from: A, to: endNow(), hitCap: capFor(S.doc.accepted) }) : [];
    if (idle.length) mutate((doc) => { ensure(doc); }, 'pins');
    if (ctx.bundle?.state !== 'stale') archiveRoads();
    if (!S.doc && S.carried !== A) carryOver(entry, A);
    const before = S.drift;
    rejudge();
    if (S.drift !== before) why = 'drift';
    syncPlan();
    emit(why);
  }

  /** On new roads, a plan made of pins finds its road again (pencil weeks re-plan freely, §7.7); a stored plan
   *  with no rule left under it (GW A unlocked, its last rule gone) is the model's again. */
  function syncPlan() {
    const acc = accNow();
    if (S.drift || S.pending || ctx.bundle?.state === 'stale') return;
    // under the hold with no plan the solver returned for your rules yet (a team you only look at, Reset plan, an older
    // app's phone-made plan: normalizeAccepted), or one on older roads: asked (replan)
    if (holdNow() && !acc?.plan && !S.error && (acc || baseNow()?.version !== versionNow())) { replan('sync'); return; }
    if (!acc?.plan || madeOn(acc) !== versionNow()) return;
    if (!pinsNow().length && lockedNow()) return;
    replan('sync');
  }

  /** A new GW with no plan yet: carry the previous GW's later pins over (once; no frozen weeks since Freeze went,
   *  2026-10-12). The note says what carried (COPY.carried); Plan.carried hands it to Ahead, which says it once (a notice, not a history: no Undo). */
  async function carryOver(entry, A) {
    S.carried = A;
    let docs;
    try { docs = await loadAll(); } catch { return; }
    if (S.entry !== entry || S.A !== A || S.doc) return;
    const prev = docs[String(A - 1)];
    // to the longest plan's end (meta.reach), not this plan's: a shorter one (You → Plan ahead) carries your rules for
    // the weeks past it too, as it keeps them while they are past its weeks (planValues sends its weeks' alone)
    const end = ids(ctx.bundle?.meta?.reach).at(-1) ?? endNow();
    const carried = carryPins(prev, A, end);
    const said = (p) => ruleText(p, lookupNow().name, { start: A, end }).text;
    const text = COPY.carried(A - 1, carried.map(said));
    if (!text) return;
    S.notice = { gw: A, text };
    mutate((doc) => {
      const a = ensure(doc);
      setPins(a, carried);
      a.at = editedAt(prev) || a.at;  // carried, not made: as old as your last edit of the GW before (editedAt)
      a.notes = [{ kind: 'carried', at: nowS(), text }];
    }, 'pins');
    replan('sync');
  }

  const offs = [
    store.on('data', onData),
    store.on('conn', (c) => {
      if (c?.state === 'offline') return;
      if (S.dirty) flushSoon(0);
      if (S.queued && S.pending?.state === 'offline') scheduleHeal(S.queued, { now: true });
    }),
  ];
  onData();

  return {
    ctx, getPlan, onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
    note, inkOf, inkClash, addPin, removePin, restorePins, clearPins, batch, setHitsMax, reset, setLineup, setPlan, values, offer, heal, settled, compare,
    // whether a solve of exactly these values was offered (offer `values`): ahead.js presolve asks it no more
    solved: (vals) => S.offered.v === versionNow() && S.offered.solved.has(solvedKey(ctx.bundle?.version ?? null, vals)),
    weekState, pencilDiff, markSeen, forecastChange, keepMine, adoptDrift, journal, noteEdit, claimEdit,
    // detached: a save still in flight lands without writing this device's mirror (sign-out cleared it) → that save
    // (forget waits for it, so it never lands over the forgetting)
    flush, detach() { offs.forEach((f) => f()); subs.clear(); cancelHeal(); clearTimeout(S.flushTimer); S.entry = null; return S.inflight; },
  };
}

let current = null;
/** The page's memory (created on the first call with the shell's ctx). */
export function attach(ctx) {
  if (!current && ctx) current = createMemory(ctx);
  return current;
}
/** Sign-out (F6b), by you or after FORGET_MS away: the page's memory lets go of the team (its timers and heal stop,
 *  unsent changes are dropped; the next screen to attach makes a fresh one) and the team's choices go (forget). →
 *  forget's promise */
export function release(api, entry) {
  const m = current;
  current = null;
  return forget(api, entry, m?.detach());
}

const forgetting = new Map();  // entry → its forget under way
/**
 * The one way a team's choices go (the user, 2026-10-14: "sign out and not remember any choices"; 2026-10-22: "When
 * you sign out yourself, forget that team's choices too"): every GW document the server keeps of it for this browser
 * written back as Reset plan leaves one (accepted and ticket none: the PUT reset writes; the server has no delete),
 * once a save already sent (`after`) has landed, so none lands over it. Until the server has them all, the team is
 * marked here (FORGET): a sign-in before that (offline, or a tap on its recent chip at once) loads it as Reset plan
 * leaves it and tries again (onData). This device's mirror of it (the document, its seen plan, edit receipt and roads
 * archive) goes at once. The solves stay cached; the recent chips keep the team (a fresh plan). → Promise<boolean>:
 * whether the server has forgotten
 */
export function forget(api, entry, after = null) {
  if (!api?.local || entry == null) return Promise.resolve(false);
  const e = String(entry);
  for (const k of [LOCAL, SEEN, EDIT, ROADS]) api.local.set(k(e), null);
  if (forgetting.has(e)) return forgetting.get(e);
  api.local.set(FORGET(e), '1');
  const p = (async () => {
    try {
      await Promise.resolve(after).catch(() => {});
      const out = await api.request('GET', '/api/m/memory', { query: { entry: Number(e), gw: 'all' } });
      const kept = Object.entries(out?.docs || {}).filter(([, d]) => d?.accepted != null || d?.ticket != null);
      await Promise.all(kept.map(([gw]) => api.putMemory({ entry: Number(e), gw: Number(gw), accepted: null, ticket: null })));
      api.local.set(FORGET(e), null);
      return true;
    } catch {
      return false;  // kept marked: the team's next load here wipes it and tries again
    } finally {
      forgetting.delete(e);
    }
  })();
  forgetting.set(e, p);
  return p;
}

// ================================================================ DOM: the drift's answers (Ahead's compare bar, F10)

/** [Plan without him]: a player FPL now flags that the forecast still plays (d.without): your plan stays (a journal
 *  note) and re-plans without him (a veto, Undo). */
export function planWithout(ctx = attach()?.ctx, d = attach(ctx)?.getPlan().drift) {
  const mem = attach(ctx);
  if (!d?.without) return;
  const plan = mem.getPlan();
  mem.keepMine({ text: `Planned without ${d.without.name}: ${d.what}` });
  const r = mem.addPin(pinVeto(d.without.id, plan.gw, plan.end, { label: `Not ${d.without.name}` }));
  ctx.ui.toast(`Re-planning without ${d.without.name}…`, 'info', { action: { label: 'Undo', onClick: () => r.undo() } });
}

/** The drift toast's action, "Use it" / "Re-plan with your rules" (ahead.driftSay; adoptDrift), with Undo (no frozen
 *  week refuses it since Freeze went, 2026-10-12). */
export function switchWithUndo(ctx = attach()?.ctx) {
  const d = attach(ctx).getPlan().drift;
  const r = attach(ctx).adoptDrift();
  if (r.refused) return;
  // today's best ignores a rule of yours (or the hold): the plan stays on them, re-planned on today's forecast (never
  // "switched")
  ctx.ui.toast(COPY.driftDone(d), 'ok', { action: { label: 'Undo', onClick: () => r.undo() } });
}
