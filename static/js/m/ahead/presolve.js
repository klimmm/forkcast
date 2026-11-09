// ahead.js: a tap's solve asked before the tap; When; a suggested plan's solve in the speculative slot

import * as E from '../../plan/engine.js';
import { fmt, chipName } from '../../ui.js';
import { COPY, hitCap, shownDelta, statusText } from '../calls.js';
import { SOLVES, attach, pinSell, pinHits, pinNotFor, pinRoll, isRoll, isExact, rollKeeps } from '../memory.js';
import { MINUS, WHY_SHEET, addMove, asYours, sum, ids, baseOf, baseline, bestOf, compare, draftOf, dropDrafted, dropMove, estimate, flatMoves, isFrozen, isPick, leftBehind, memOf, movedFrom, noteRemoved, num, pairedMoves, pairsOf, plan, problemOf, sameView, problemText, sameMove, squadBefore, valuesFor, valuesKey, weekOf, whyAct, wishDrop, withMoves } from './core.js';
import { saidNow, sayAgain, asksOf, autoRuleName, barred, refusedAt, buyCandidates, chainOf, chipBackOf, chipEdit, chipOffParts, chipWords, clashing, derivedPin, edit, endingOf, hitsLater, inPlaceOf, keep, keptFrom, removeRule, ruleOf, toastOf, withPoints, withTaken } from './edits.js';
import { FORK_FLIGHTS, SQUAD_CHIPS, answeredBy, asTaken, byGain, choiceVs, fitsAt, forkAgain, forkAsk, forkFlights, forkKey, forkKept, forkPump, forkRead, forkValues, modelMoves, planBaseline, planOfRoad, plansListed, rollOnly, settledList, takenBy, weekRollOf } from './plans.js';
import { freedBy, lineupMoved, gwMode, inkAt, isLive } from './buys.js';
import { windowGap } from '../calls/measure.js';
import { plPays, squadWeek } from './pieces.js';
import { rulesOf } from './screen.js';

// ---------------------------------------------------------------- a tap's solve asked before the tap
/**
 * Owner, 2026-10-26: "fix speed so all pre solved and done without no cost". A tap that changes your plan lands at
 * once on the solver's plan for its rules, because that solve was asked before the tap: the tap's edit made dry
 * (dryEdit), the values its heal would send (memory.values), asked in the fork lanes the view leaves free (forkPump
 * `prep`, purpose 'presolve': speculative, unmetered, pre-empted by any solve someone waits on, joined by the heal in
 * flight), the answer offered to memory (memory.offer) so the heal lands it with no wait (memory.replan, landNow). An
 * Undo needs none.
 * Asked most likely first, at most PRESOLVE_MAX a source (each solve costs a plan's worth of solver time:
 * presolve_report.md), a sheet's before the week's: 'week' (presolveSwap): once its choices are settled, the week's
 * best's take; 'sheet' (presolveTaps): the taps of an
 * open sheet's buttons, until it closes.
 * Never while your plan heals or the bundle is behind. A source is made again for each plan view; a flight no source
 * asks is let go (plansOf's L5), as is every one when the page is hidden (stopAhead), except the one your rules' heal
 * waits on (aheadWaited).
 */
// (the week's: Make the swap alone, the one take on its card (owner, 2026-11-05: "delete all solves which are not
// needed"; a row of the Week sheet is asked while that sheet is open, `sheet`); a Remove's own week answers from memory,
// an Undo needs none)
const PRESOLVE_MAX = { week: 1, sheet: 5 };
// and nothing asked ahead past the owner's 6 after a tap (2026-11-02), whichever asks first: the rest waits for the
// next tap (forkPump: tapSpent; QA solve-budget, 2026-11-04: 8 on a card's ×, a place's own four and four ahead)
const SOLVE_MAX = 6;
// and at most PRESOLVE_RATE distinct solves a minute on a page, the week's at most its share, so an open sheet's taps
// (the likelier) always have room
const PRESOLVE_RATE = { all: 30, week: 16 }, PRESOLVE_WINDOW_MS = 60000;
// the tap's edit made dry (dryEdit): {got} while one is, edit's args then
export let DRY = null;
// srcs: 'week' | 'sheet' → {P, gw, sig, owner, asks: [ask], made: [ask], tried: Set(tap id)}; failed: keys of failed
// solves (not your rules'); at: viewed week {P, g} (plansOf); ctx: the page's; tapped: SOLVES.asked at your last tap
// (null before the first: a page's load is no action), tappedOn: the team it was on
export const AHEAD = { srcs: new Map(), failed: new Set(), at: null, ctx: null, watching: false, asked: [], dropped: new Map(), landed: new Map(), took: null, tapped: null, tappedOn: null, showing: new Set() };
const teamOn = () => AHEAD.ctx?.store.get('entry') ?? null;
// (your taps counted from the page's first: a page reloaded onto a week with your transfer made presolves nothing before
// its first tap, so the listener watchPage added missed it and that tap's preparation went past the 6; qa-cold trace)
if (typeof document !== 'undefined' && document.addEventListener)
  for (const t of ['click', 'keydown']) document.addEventListener(t, () => { AHEAD.tapped = SOLVES.asked; AHEAD.tappedOn = teamOn(); }, { capture: true, passive: true });
/** The weeks whose card shows a transfer though the plan rolls them (their Show a transfer, AHEAD.showing; owner, 2026-11-06:
 *  shown as any other transfer, not a list, and there when you come back), till its Previous or Reset all weeks. */
export const showTransfer = (P, g, on = true) => { AHEAD.showing[on ? 'add' : 'delete'](`${P.entry}|${g}`); PAIR.rev++; };
export const showingAt = (P, g) => AHEAD.showing.has(`${P.entry}|${g}`);
/** Your last tap on this team has asked the 6 it may (SOLVE_MAX). No tap yet is no action, nor the tap that opened it, a
 *  load like any other: its own solves spent the 6 and left Make the swap and Show another unsolved (owner, 2026-11-05,
 *  "Yes, full preparation"). */
export const tapSpent = () => AHEAD.tapped !== null && AHEAD.tappedOn === teamOn() && SOLVES.asked - AHEAD.tapped >= SOLVE_MAX;
/** A week's moves as one key ("out>in" sorted): the take's (addPlan, AHEAD.took) against the week's (weekRollOf). */
export const movesKey = (ms) => ms.map((m) => `${m.out}>${m.in}`).sort().join(',');
/** The take's number for week w while your plan is what the take made (AHEAD.took: its rules landed, none changed
 *  since, its GW-g moves the week's) → its cmp | null. */
/** Your rules as one key (the derived hold and Settings → Hits' cap left out: the take's landing re-derives them). */
const rulesKey = (P) => JSON.stringify(P.pins.filter((p) => p.id !== 'hold' && p.id !== 'hits'));
export function tookOf(P, w) {
  const t = AHEAD.took;
  if (!t || t.g !== w.gw || t.team !== `${P.entry}|${P.A}` || t.version !== P.b.version) return null;
  const pins = rulesKey(P);
  if (pins === t.before) return null;  // not landed yet (or taken back by its Undo)
  if (t.pins === null) t.pins = pins;
  if (t.pins !== pins) { AHEAD.took = null; return null; }
  return movesKey(w.moves) === t.sig ? t : null;
}
export const tookCmp = (P, w) => tookOf(P, w)?.cmp ?? null;

/** The rules tap `run` (an edit call: addPlan, removeRule, keep…) would make, made dry → edit's args {pins, drop,
 *  inPlace, hitsMax, was} | null (changes nothing, or refused: no solve). */
function dryEdit(run) {
  const was = DRY, mine = (DRY = { got: null });
  try { return run() ? mine.got : null; } catch (e) { console.warn('Forkcast: a tap made dry', e); return null; } finally { DRY = was; }
}

/** Tap t ({kind, gw, run} | {kind: 'reset'}) as the solve its heal would ask on plan view P: {key, values, version, gw,
 *  kind, src, prep, ahead} | null. Reset plan is no edit: all rules off, Settings → Hits the solver's own
 *  (memory.reset). */
function askOf(ctx, P, t, src) {
  const a = t.kind === 'reset' ? { pins: [], drop: P.pins.filter((p) => !derivedPin(p)).map((p) => p.id), hitsMax: null } : dryEdit(t.run);
  if (!a) return null;
  let values;
  try {
    values = memOf(ctx).values({ extra: a.pins, drop: a.drop, hitsMax: a.hitsMax, order: a.inPlace ? (list) => inPlaceOf(list, a.inPlace, a.was) : null });
  } catch { return null; }
  // (a take's: the week's choices its plan will ask first, refusalRoads' root under its rules, solved ahead too, so the
  // pitch after it never waits on a solve: 2026-11-02, Raketa GW10 Murillo → Hill greyed 8 s on a cold cache)
  let root = null;
  if (t.kind === 'take') try { const v = rootValues(ctx, P, t.gw ?? P.A, a.pins, a.drop); root = { key: valuesKey(P, v), values: v }; } catch {}
  // (…and what its week's rows count against after it, the roll ("No transfer") under the take's other-week rules: asked
  // at the tap it greyed GW14 13.9 s on a cold server, a 14.5 s solve; qa-tk91 trace o)
  let ref = null;
  if (t.kind === 'take') try { const g = t.gw ?? P.A, v = forkValues(ctx, P, g, { moves: [], chips: {} }, a.pins.filter((p) => num(p.gw) !== g)); ref = { key: valuesKey(P, v), values: v }; } catch {}
  return { key: valuesKey(P, values), values, gw: t.gw ?? P.A, kind: t.kind, src, prep: true, ahead: true, root, ref };
}

/** Source `src`'s taps (most likely first) on plan view P: the first PRESOLVE_MAX[src] that make a solve asked; those
 *  memory has (memory.solved) or that failed are not asked again. `sig`: what the taps were made from (once per it). */
function presolve(ctx, P, src, taps, { gw = P.A, sig = '', owner = null } = {}) {
  // (none from inside a tap made dry: a draw it reads settling)
  if (DRY || !ctx.api?.solve || ctx.store.get('conn')?.state === 'offline') return;
  watchPage(ctx);
  let cur = AHEAD.srcs.get(src);
  // taps with ids (the week's: a take's choice, a Remove's rule) of the same view add to what it asked as more are
  // ready, each made dry once (tried); another view's are asked afresh
  const grows = taps.every((t) => t.id != null);
  if (!(sameView(cur?.P, P) && cur.gw === gw && cur.owner === owner && (cur.sig === sig || grows))) AHEAD.srcs.set(src, (cur = { P, gw, sig: null, owner, asks: [], made: [], tried: new Set() }));
  if (cur.sig !== sig) {
    cur.sig = sig;
    // (none another source asks, nor one memory has: a sheet's taps besides the week's)
    const others = [...AHEAD.srcs].filter(([k, x]) => k !== src && sameView(x.P, P)).flatMap(([, x]) => x.asks.map((a) => a.key));
    // (the room counts every tap made, its solve asked or memory's already: one solved before never makes room for the
    // next likeliest; 2026-11-03, a new team's load asked the Swap of Barry and of Hill, the band's best Evanilson's
    // solved, a new plan view later: 22 solves)
    const room = () => cur.made.length < PRESOLVE_MAX[src];
    for (const t0 of taps) {
      const t = typeof t0 === 'function' ? t0() : t0;
      if (!room() || (t.id != null && cur.tried.has(t.id))) continue;
      if (t.id != null) cur.tried.add(t.id);
      const a = askOf(ctx, P, t, src);
      if (a) cur.made.push(a);  // (every tap's, asked here or not: presolveTaps)
      if (a && !cur.asks.some((x) => x.key === a.key) && !others.includes(a.key) && !memOf(ctx).solved(a.values)) cur.asks.push({ ...a, pri: t.pri ?? cur.asks.length });
      // (its root after it, just after it: never counted in the source's room)
      if (a?.root && !cur.asks.some((x) => x.key === a.root.key) && !others.includes(a.root.key) && !forkRead(a.root.key)) cur.asks.push({ ...a, ...a.root, kind: 'root', root: null, pri: (t.pri ?? cur.asks.length) + 0.5 });
      // (its roll reference after the root: never counted in the room either)
      if (a?.ref && !cur.asks.some((x) => x.key === a.ref.key) && !others.includes(a.ref.key) && !forkRead(a.ref.key)) cur.asks.push({ ...a, ...a.ref, kind: 'ref', root: null, ref: null, pri: (t.pri ?? cur.asks.length) + 0.6 });
    }
    cur.asks.sort((x, y) => x.pri - y.pri);
  }
  pumpAhead(ctx);
}

/** GW g's taps on plan view P (`list`: plansOf's choices): ready choices' takes (addPlan), those that pay first by
 *  number (the week's best, the lit plates: litShown), and the Removes of your rules (removeRule: that week's first,
 *  newest first). → {takes, removes, sig} */
export function weekTaps(ctx, P, g, list) {
  const ready = list.filter((pl) => pl.state === 'ready' && !pl.self && !rollOnly(pl) && !pl.removed)
    .sort((a, b) => plPays(b) - plPays(a) || byGain(a, b));
  // (`pri`: ask order, takes first by number; `id`: one tap of the view's, made dry once)
  const takes = ready.map((pl, i) => ({ kind: 'take', gw: g, id: `take:${forkKey(pl.choice, g)}`, pri: i, solver: !!pl.solver, run: () => addPlan(ctx, g, pl) }));
  const rules = rulesOf(P).filter((p) => ruleOf(P, p).removable);
  const removes = [...rules.filter((p) => num(p.gw) === g), ...rules.filter((p) => num(p.gw) !== g)]
    .map((p, i) => ({ kind: 'remove', gw: g, id: `rm:${p.id}`, pri: 100 + i, run: () => removeRule(ctx, p.id) }));
  return { takes, removes, sig: `${ready.map((pl) => forkKey(pl.choice, g)).join(';')}|${rules.map((p) => p.id).join(',')}` };
}
/** Make the swap on GW g's card, solved ahead: the move the card shows (screen-ticket.js paintTicket; of a week's several
 *  moves the one highest on the pitch, so never read from the rows' order), in the fork lanes its own checks leave free. */
export function presolveSwap(ctx, P, g, pl) {
  if (P.healing || leftBehind(ctx, P) || inkAt(ctx, P, g)) return;
  const [take] = weekTaps(ctx, P, g, [pl]).takes;
  if (take) presolve(ctx, P, 'week', [take], { gw: g, sig: take.id, owner: take.id });
}

/** What Make the swap on GW g's card moves your weeks' xP by, so what the tabs' numbers change by (the plan its solve
 *  brings less the plan on screen, both yours with no later transfers; owner, 2026-11-05: the card counted against a roll
 *  that makes later transfers, "+2.7" for tabs that moved +10.9). → number | null till its solve is in */
export function swapGain(ctx, P, g, pl) {
  const road = swapRoad(ctx, P, g, pl);
  return road ? sum(asYours(ctx, road).weeks.map((w) => w.points)) - P.total : null;
}
/** The card's number for choice pl of GW g: the solver's whole count over the window it commits GW g from (counted's
 *  `delta`: every week put on GW g's own scale, the free transfer it spends or keeps counted), the number the solver
 *  orders its moves by, so the card's first move always reads the highest (owner, 2026-11-08: "why konsa van hecke
 *  higher if dewsbury hall optimal fix bug": points with no later transfer read Tavernier → Dewsbury-Hall +2.6, Konsa →
 *  Van Hecke +3.3; each week on its own scale read Konsa → Van Hecke −0.05, a move the solver makes). → number | null
 *  till its row is in */
/** The rounds the card's numbers count for GW g: the window the solver committed it from (road.windows[g], every term's
 *  rounds), never the weeks left in the header's span: GW14 said "over the next week" counting GW14-17 (books review,
 *  2026-11-08). 0 where the road has none. */
export const windowRounds = (road, g) => new Set(Object.values(road?.windows?.[g] ?? {}).flatMap((by) => Object.keys(by ?? {}))).size;
export const cardGain = (ctx, P, g, pl) => (pl?.state === 'ready' && pl.cmp ? pl.cmp.delta : null);
/** What Show a transfer's row pl is ordered by (cardGain): -Infinity where no number will come, no swap of it to solve, its
 *  solve failed or your tap's 6 spent. → number | null while its solve is out */
export function shownGain(ctx, P, g, pl) {
  const gain = cardGain(ctx, P, g, pl);
  if (gain != null) return gain;
  const [take] = weekTaps(ctx, P, g, [pl]).takes, a = take ? askOf(ctx, P, take, 'week') : null;
  if (!a || AHEAD.failed.has(a.key)) return -Infinity;
  // (a solve already out brings its number, your tap's 6 spent or not: read as none, the card showed the row before it for
  // 90 ms; owner, 2026-11-08, "back and forth")
  return tapSpent() && !forkFlights().some(([, f]) => f.key === a.key) ? -Infinity : null;
}
/** The plan Make the swap brings, as yours. → {weeks} | null till its solve is in */
const swapRoad = (ctx, P, g, pl) => {
  const [take] = weekTaps(ctx, P, g, [pl]).takes;
  const a = take ? askOf(ctx, P, take, 'week') : null;
  return a ? memOf(ctx).solvedRoad(a.values) : null;
};
/** GW g's team as Make the swap would leave it: what the pitch shows before the tap. → the week's view | null till its
 *  solve is in */
export function swapWeek(ctx, P, g, pl) {
  const road = swapRoad(ctx, P, g, pl);
  return road ? asYours(ctx, road).weeks.find((w) => Number(w.gw) === g) ?? null : null;
}

/** An open sheet's taps, asked ahead while it is open (presolve 'sheet'): each {kind, gw, run} (or a function making
 *  one when its turn comes), most likely first; `taps` null when it closes. `owner`: the sheet. → each tap's solve
 *  ({key, values, kind, …}) */
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

/** Ask the next solves of the sources, a sheet's first, each in order (forkPump: in a lane the view leaves free) →
 *  whether any is still to land. A source of another plan view asks nothing (presolve replaces it); the week's waits
 *  while another week is viewed. */
export function pumpAhead(ctx) {
  const P = plan(ctx), mem = memOf(ctx);
  if (!P || P.healing || leftBehind(ctx, P)) return false;
  let left = false;
  // (PRESOLVE_RATE a minute: the window's asks, all and the week's, made once a pump and again only when a solve asked
  // here adds one; each ask's own filter and two Sets were the suites' hottest path)
  const now = Date.now();
  AHEAD.asked = AHEAD.asked.filter((x) => x.at > now - PRESOLVE_WINDOW_MS);
  // (a solve asked here only appends: the Sets take the new asks alone)
  let seen = 0;
  const all = new Set(), week = new Set();
  const counts = () => {
    for (; seen < AHEAD.asked.length; seen++) {
      const x = AHEAD.asked[seen];
      all.add(x.key);
      if (x.src === 'week') week.add(x.key);
    }
  };
  // (sheet first: while it is up its buttons are what a tap can reach)
  for (const src of ['sheet', 'week']) {
    const s = AHEAD.srcs.get(src);
    if (!s || !sameView(s.P, P)) continue;
    if (src === 'week' && (!sameView(AHEAD.at?.P, P) || AHEAD.at.g !== s.gw)) continue;
    for (const a of s.asks) {
      // (`landed`: its answer came on this page, for these values on this bundle (the key is the version's): never asked
      // again even where memory keeps it under the plan service's version, not the bundle's (a re-bake serving the
      // previous code's roads); else every landing pumped the same solve again at once, 19,000 times in a suite run.
      // `landed` keeps the version it came for: one for this bundle that memory no longer holds (its store reset or full)
      // is asked again, else the card waited on it for ever, "planning…" with nothing solving (owner, 2026-11-08, TORPEDO
      // Tavernier → Dewsbury-Hall)
      const held = mem.solved(a.values) || (a.kind === 'root' && forkRead(a.key) != null);
      const lost = !held && AHEAD.landed.get(a.key) === (ctx.bundle?.version ?? null);
      if (AHEAD.failed.has(a.key) || held || (AHEAD.landed.has(a.key) && !lost)) continue;
      // (one a road in hand answers already, no solve: answeredBy)
      const sent = answeredBy(P, a.key, a.values);
      if (sent) {
        if (a.kind === 'root') forkKept(a.key, sent); else mem.offer(sent, { values: a.values, version: P.b?.version });
        AHEAD.landed.set(a.key, P.b?.version ?? null);
        continue;
      }
      left = true;
      if (forkFlights().some(([, f]) => f.key === a.key)) continue;
      // (the rest waits for the window to move on, a re-draw then asks it; one asked again, an Undo back to its rules,
      // counts once)
      counts();
      const again = all.has(a.key);
      if (!again && (all.size >= PRESOLVE_RATE.all || (src === 'week' && week.size >= PRESOLVE_RATE.week))) {
        forkAgain(ctx, AHEAD.asked[0].at + PRESOLVE_WINDOW_MS - now);
        continue;
      }
      forkPump(ctx, P, a);
    }
  }
  return left;
}

/** Whether fork flight f is a solve asked ahead that a source of plan view P still asks for week g, or the one your
 *  rules' heal now waits on (letting it go would cancel the job under the heal) → plansOf's L5 and stopAhead keep it. */
export const aheadAsks = (f, P, g) => {
  if (!f.ahead) return false;
  if (aheadWaited(f)) return true;
  // (by key, not plan view object: a view drawn anew for the same rules asks the same solves; one for other rules
  // replaces the source before the next draw lets the flight go)
  const s = AHEAD.srcs.get(f.src);
  return !!s && s.P.entry === P.entry && s.P.A === P.A && (f.src !== 'week' || s.gw === g) && s.asks.some((a) => a.key === f.key);
};
/** Fork flight f is the solve asked ahead your rules' heal waits on (memory's pending heal of those values). */
export const aheadWaited = (f) => !!f.ahead && !!AHEAD.ctx && memOf(AHEAD.ctx)?.getPlan().pending?.ahead === f.key;

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
  // (lanes freed: the choices re-draw, so the next week's preparation a sheet's tap took a lane from asks again)
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

/** GW g's free transfers all used by your plan (its transfers there at least its FTs): another move there is an extra
 *  one, −4 each, so suggestionsOf's moves (plansOf's one-move choices) are each measured after its hit, losers too. In
 *  a week Forkcast re-picks (repicks) only your transfers count: its own give way to another of yours (addYours). */
/** GW w a week your plan leaves short of money (owner, 2026-10-28, as FPL allows a negative ITB): under the hold your
 *  transfers there take its bank below 0 (memory.holdOf's debts). plansOf offers Forkcast's way to pay it back
 *  (owedRoad); the week's best is a choice that does (litCan: paysBack). Pure. */
export const owedAt = (P, w) => !!P?.mem?.hold && !!w?.moves?.length && w.bank != null && w.bank < -1e-9;
/** Choice pl keeps your every transfer of GW w and leaves its bank at 0 or more (owedAt's week): its solve's bank, else
 *  its plan's as measured. Pure. */
export const paysBack = (w, pl) => {
  const g = w.gw;
  const keeps = w.moves.every((m) => pl.choice.moves.some((x) => x.gw === g && x.out === m.out && x.in === m.in));
  const bank = num((pl.road?.weeks || []).find((x) => Number(x.gw) === g)?.bank) ?? pl.ev?.gws.find((s) => s.gw === g)?.bank;
  return keeps && bank != null && bank >= -1e-9;
};
/** owedAt's GW g: your plan solved with that week the planner's (a hits rule there lifts the hold, memory.holdOf),
 *  asked as a fork is (forkAsk; read only when `peek`) → {key, road: its road once solved, else null}. Its moves on top
 *  of yours are the week's choices (plansOf). */
export function owedRoad(ctx, P, g, { peek = false, prep = false } = {}) {
  const values = valuesFor(ctx, [pinHits(hitCap(P.base) ?? 2, g)]);
  const key = valuesKey(P, values);
  const got = peek ? forkRead(key) : forkAsk(ctx, P, { key, values, gw: g, ...(prep ? { prep } : {}) });
  return { key, road: got?.weeks ? got : null };
}

/** GW g's moves as the solver ranks them, refusal by refusal (owner, 2026-11-02: "solve ... all possible options for
 *  this week until rolling is actually best"): your plan solved with GW g on the planner's, as main.py --must-have
 *  plans it under your rules, its GW-g move on top of yours the week's best; that move refused in GW g alone (Show another's "Not … for …") `depth` refusals ahead (2: the next
 *  is solved before you refuse), its sale kept (the lock's Keep) at the first refusal alone: 4 solves a plan view
 *  (owner, 2026-11-02: "follow the ✕ only", at most 6 solves after an action); a road with no move of its own in GW g
 *  (rolling is best there) goes on with one transfer forced (--min-buys-gw). Each asked as a fork is (forkAsk; read only when `peek`). → [{key, road}], the
 *  root first */
/** Each week's last root (refusalRoads): `${entry}|${g}` → {version, values, road}. */
const ROOTS = new Map();
/** …cleared with the fork solves' state (forks.resetForks: between the node tests). */
export const clearRoots = () => ROOTS.clear();
/** Whether `road`, the solver's best under `was` (solve values), is still its best under `now`: the same data and the
 *  same values but for must-haves and exclusions added, every one of which the road already keeps (a lock of a player
 *  it keeps, a take of its own move: the best of a narrower choice is the same plan). Pure. */
export function rootStill(was, now, road) {
  // (the plan service's own test, api/mobile_roads.road_answers, the same rules: owner, 2026-11-03, "find what else
  // solves do the repeated job between them ... fix all such cases". Under the solver's plan each week commits from its own
  // window, which reaches the weeks after it: a narrower rule on the first week, or the road's stop (`to`) earlier,
  // leaves every window as solved; one on a later week can change an earlier window's plan though the road keeps it
  // (2 of 3 such pairs solved another plan), unless no transfer is possible up to that week, no buys from the first)
  const toks = (v) => new Set(String(v ?? '').split(',').filter(Boolean));
  const NARROW = new Set(['must_have', 'exclude', 'not_for', 'no_buys_gw', 'max_buys_gw', 'to', 'quick_before']);
  if (road?.anchor != null) return false;
  if ([...new Set([...Object.keys(was), ...Object.keys(now)])].some((k) => !NARROW.has(k) && JSON.stringify(was[k] ?? null) !== JSON.stringify(now[k] ?? null))) return false;
  const first = Number(now.from_r);
  if ((now.to == null && was.to != null) || (now.to != null && was.to != null && Number(was.to) < Number(now.to))) return false;
  const qn = Number(now.quick_before ?? 0), qw = Number(was.quick_before ?? 0);
  if (qn !== qw && Math.max(qn, qw) > first) return false;
  const weeks = new Map((road.weeks || []).map((w) => [Number(w.gw), w]));
  if (!weeks.has(first)) return false;
  const squad = (g) => { const w = weeks.get(g) ?? weeks.get(first); return new Set([...ids(w.xi), ...ids(w.bench)]); };
  const held = new Set([...toks(was.no_buys_gw)].map(Number));
  // (a solve to week `to` counts that week over its whole window; a road solved with no `to` committed each week it rolls
  // from there to its last from that round alone (quick_rolled, rolling.round_window): the plan service's road_answers
  // alike; GW14 read +149.6 against such a cut, journeys 2026-11-08)
  if (now.to != null && was.to == null && [...weeks.keys()].filter((g) => g >= Number(now.to)).every((g) => held.has(g))) return false;
  // (a week whose squad is the first week's in every window: no buys in any week from the first to it)
  const fixed = (g) => g === first || Array.from({ length: g - first + 1 }, (_, i) => first + i).every((x) => held.has(x));
  for (const [k, want] of [['must_have', true], ['exclude', false]]) {
    const old = toks(was[k]), cur = toks(now[k]);
    if ([...old].some((t) => !cur.has(t))) return false;
    for (const t of [...cur].filter((x) => !old.has(x))) {
      const [id, span] = t.split('@'), [a, b] = (span ?? '').split('-').map(Number);
      for (let g = a; g <= (b || a); g++) if (!fixed(g) || squad(g).has(Number(id)) !== want) return false;
    }
  }
  // (a refusal added, "GW:out:in": the solver's add_not_for forbids buying `in` while selling `out` that week; a road
  // that doesn't make that pair there keeps its answer; Show another's next root was solved again after each refusal,
  // 1.5 s before its card could draw: journeys, 2026-11-08)
  const fw = toks(was.not_for), fn = toks(now.not_for);
  if ([...fw].some((t) => !fn.has(t))) return false;
  for (const t of [...fn].filter((x) => !fw.has(x))) {
    const [g, out, inn] = t.split(':').map(Number), w = weeks.get(g);
    if (!fixed(g) || (w && ids(w.in).includes(inn) && ids(w.out).includes(out))) return false;
  }
  const nn = new Set([...toks(now.no_buys_gw)].map(Number));
  if ([...held].some((g) => !nn.has(g))) return false;
  const caps = (v) => new Map([...toks(v)].map((t) => t.split(':').map(Number)));
  const capn = caps(now.max_buys_gw), capw = caps(was.max_buys_gw);
  if ([...capw].some(([g, n]) => !capn.has(g) || capn.get(g) > n)) return false;
  const narrower = [...[...nn].filter((g) => !held.has(g)).map((g) => [g, 0]), ...[...capn].filter(([g, n]) => (capw.get(g) ?? 99) > n)];
  return narrower.every(([g, n]) => g === first && (weeks.get(first).in || []).length <= n);
}
/** The values refusalRoads solves GW g's choices under: your rules plus `extra`, less `drop` (ids), the solver's hit cap
 *  in every week from g, GW g's Roll off (a take's cap at its moves, a Roll of k > 0 (addPlan), and your own Roll
 *  alike: the solver's moves on top of yours, or in place of your roll, "instead of rolling", are the week's choices;
 *  with the Roll kept the root after a take was the take's own solve again, and under your Roll no move was offered:
 *  2026-11-02). With a tap's pins made dry (askOf): the root that tap's plan will ask, solved ahead. */
function rootValues(ctx, P, g, extra = [], drop = [], forced = false) {
  const cap = hitCap(P.base) ?? 2, roll = `roll:${g}`;
  // (solved to GW g alone, `to`, as a choice's (forkValues): only its GW-g moves are read, the weeks after it your
  // plan's (planOfRoad); owner, 2026-11-03, "why anytime goes to GW11–13": the ✕ and Keep refusals 8-10 s, GW10 0.3 s)
  // A forced road (Show a transfer, its Show another chain) under a made transfer of yours after GW g is solved from
  // the bank that leaves that move its money (floorCash): solved to GW g alone it never saw your GW13 Muharemović →
  // Murillo needed GW11's £0.5m, every GW11 buy came out £0.4–0.5m short, measured() dropped them all and Show a
  // transfer showed "Save your free transfer" (qa-tk86 j-ahead-random-b #13; qa-tk83 trace l; owner, 2026-11-09 "Yes")
  const own = forced && P.weeks.some((w) => w.gw > g && w.moves.some((m) => pinOfMove(P, { ...m, gw: w.gw })));
  const cash = own ? floorCash(ctx, P, g) : null;
  return { ...valuesFor(ctx, [...P.gws.filter((x) => x >= g).map((x) => pinHits(cap, x)), ...extra.filter((p) => p.id !== roll)], [...drop, ...P.pins.filter((p) => p.id === roll).map((p) => p.id)]), to: g, ...(forced ? { min_buys_gw: `${g}:1` } : {}), ...(cash !== null ? { cash } : {}) };
}
/** The bank (tenths, --cash: GW A's) a forced road at GW g is solved from so its GW-g buy leaves your later made moves
 *  their money: GW A's bank less F, F = GW g's bank on your plan minus the lowest bank of any week from g on (what your
 *  later moves need kept at GW g). Every round's bank falls by F, so "bank ≥ 0" reads "bank ≥ F" at GW g, its window
 *  and `to` unchanged. null: nothing needed, or a week before g holds less than F (the shift can't be exact there).
 *  The road's own banks are F off; nothing reads them (planOfRoad takes its GW-g moves, measurePlan re-prices from
 *  baseOf). */
function floorCash(ctx, P, g) {
  const gws = baseline(ctx, P.gws[0])?.gws || [], at = (k) => gws.find((s) => s.gw === k)?.bank ?? 0;
  const later = gws.filter((s) => s.gw >= g).map((s) => s.bank);
  const F = later.length ? at(g) - Math.min(...later) : 0;
  if (!(F > 1e-9) || gws.some((s) => s.gw < g && s.bank < F - 1e-9)) return null;
  const c = Math.round((baseOf(ctx).bank - F) * 10);
  return c >= 0 ? c : null;
}
/** `lead`: the move the week's best token shows (plansOf: the solver's row with the highest number), the one its ✕
 *  refuses, refused first at the root; else, and below the root, the road's first move as the week draws it (owner,
 *  2026-11-02, Boss of the gym GW10: the token Palmer, the refusal solved ahead Hill's, so each ✕ waited on a solve). */
/** Another week's refusal solving ahead (a side flight, not a root): what holds GW g's refusals ahead back. */
/** A refusal ahead's road with no solve of its own: the solver's plan under rules R with a GW-g buy is its forced road
 *  (R + min_buys g:1), and it makes that buy exactly when the card's own count says so: windowGap(forced, the week's
 *  roll road, g).ref ≥ 0, the count the card draws (measure.counted), on each road's own window for GW g, the one the
 *  solver commits GW g from. Else R rolls and the forced road is Show another's card. Asked instead of R: the card
 *  where the solver's own moves end waited on R, then on its forced road, one after the other (GW13 Show another 3,
 *  19-42 s on every cold run; qa-tk91 trace o). → true once kept under R's key, false while the forced road solves,
 *  null where it can't stand in (no roll road or window in hand, a bank floor on the forced road): R solved as before. */
function rollPart(ctx, P, g, extra, key, values, busy, root = false) {
  const rv = forkValues(ctx, P, g, { moves: [], chips: {} }), roll = forkRead(valuesKey(P, rv));
  if (!roll?.weeks || !roll.windows?.[g]) return null;
  const fv = rootValues(ctx, P, g, extra, [], true);
  if (fv.cash != null && fv.cash !== values.cash) return null;
  // (the card on screen's in its place, asked as its root would be: a background one (prep) is dropped once the tap's 6 are
  // spent, forkPump, and the card then waited on the plan's solve and the forced one after it; qa-tk96 log, 4 asks never sent)
  const fk = valuesKey(P, fv), f = forkRead(fk) ?? (busy ? null : forkAsk(ctx, P, { key: fk, values: fv, gw: g, side: true, ...(root ? { root: true } : { prep: true }) }));
  if (f === 'infeasible') { forkKept(key, { ...roll, key, values }); return true; }
  if (!f?.weeks) return f == null || !f.failedAt ? false : null;
  const ref = windowGap(f, roll, g)?.ref;
  if (ref == null) return null;
  forkKept(key, { ...(ref >= 0 ? f : roll), key, values });
  return true;
}
const sideBusy = (g, key) => forkFlights().some(([, f]) => f.side && !f.root && f.key !== key && f.gw !== g);
export function refusalRoads(ctx, P, g, { peek = false, prep = false, depth = 1, lead: best = null } = {}) {
  const yours = weekOf(P, g)?.moves || [], out = [], seen = new Set(), d0 = draftOf(ctx);
  const walk = (extra, d, forced = false) => {
    const values = rootValues(ctx, P, g, extra, [], forced), key = valuesKey(P, values);
    if (seen.has(key)) return;
    seen.add(key);
    // (the root's flight never let go by a later view: plansOf; an Undo back finds it. A refusal ahead is the plan
    // service's lowest priority (prep: 'pairnext'), one at a time: 2026-11-02, five at once beside a take's own solves
    // slowed each to 20–50 s)
    // (…but Show a transfer's first transfer, on: the card waits on it, so it is asked at once like the root, never queued
    // behind the refusals ahead other weeks' loads asked; qa-tk77 j-card-swap, Show a transfer still the roll's card 90 s on)
    const wanted = forced && showingAt(P, g) && !out.some((n) => n.forced);
    // (…one at a time against OTHER weeks' refusals only: the viewed week's own chain, the card after next beside the next,
    // goes at once in a lane of its own. Held behind each other a cold server solved GW13's Show another chain one card
    // per 4–7 s on one core of four, and a tap waited 11–19 s; qa-tk87 trace n)
    const root = d === depth && !forced, busy = !root && !wanted && sideBusy(g, key);
    // (the week's last root still its best under rules it already keeps: kept, no solve; owner, 2026-11-02, "nothing
    // greyed out after any choice made")
    const last = root ? ROOTS.get(`${P.entry}|${g}`) : null;
    if (last && !forkRead(key) && last.version === P.b.version && rootStill(last.values, values, last.road)) forkKept(key, { ...last.road, key, values });
    // (a refusal ahead, no move of yours that week: answered off its forced road and the week's roll, rollPart)
    // (the card on screen too, a refusal's root: QA taps the next Show another 0.3 s after a card lands, so the card
    // ahead becomes the root before its forced road is in; qa-tk95 [rollPart] log, 3 calls all "forced pending")
    const part = !forced && !wanted && !peek && extra.length && !yours.length && !weekOf(P, g)?.chip && forkRead(key) == null ? rollPart(ctx, P, g, extra, key, values, busy, root) : null;
    const got = part !== null ? forkRead(key) : peek || busy ? forkRead(key) : forkAsk(ctx, P, { key, values, gw: g, side: true, ...(prep || (!root && !wanted) ? { prep: true } : {}), ...(root ? { root: true } : {}) });
    const road = got?.weeks ? got : null;
    if (root && road) ROOTS.set(`${P.entry}|${g}`, { version: P.b.version, values, road });
    out.push({ key, road, forced });
    const wk = road ? road.weeks.find((x) => Number(x.gw) === g) : null, w = d > 0 ? wk : null;
    // (its first move as the week draws it, planOfRoad's: the one the best token's ✕ refuses)
    const ms = w ? (planOfRoad(ctx, P, road, g, d0)?.choice.moves ?? pairedMoves(w.out || [], w.in || [], P.L)).filter((m) => !yours.some((y) => Number(y.out) === Number(m.out) && Number(y.in) === Number(m.in))) : [];
    const lead = (root && best && ms.find((m) => Number(m.out) === Number(best.out) && Number(m.in) === Number(best.in))) || ms[0] || null;
    // (rolling best here: the best transfer all the same and the next, Show a transfer's rows, never the card's; owner,
    // 2026-11-06, "fix so it still show next suggestions": the week showed Roll alone)
    if (!lead) {
      if (wk && !forced && !yours.length) {
        // (the forced chain one deeper than the solver's own: its card and the next are both in when a Show another lands,
        // so the card shows the better of the two at once, no flip and no wait; journeys, 2026-11-08)
        if (d > 0) walk(extra, d, true);
        // (a refusal ahead that rolls: its first forced transfer asked too, so Show another lands on it solved, as on a
        // move's own refusal; never a row of this view; owner, 2026-11-08, "why it not pre solve show another")
        else if (!peek && !(wk.in || []).length) {
          const values = rootValues(ctx, P, g, extra, [], true), key = valuesKey(P, values), on = showingAt(P, g);
          if (!seen.has(key) && !forkRead(key) && (on || !sideBusy(g, key))) { seen.add(key); forkAsk(ctx, P, { key, values, gw: g, side: true, ...(on ? {} : { prep: true }) }); }
        }
      }
      return;
    }
    // (Show another, the card's one refusal: no Keep or per-name refusal solved ahead since the ticket took their buttons
    // off the screen; owner, 2026-11-05, "delete all solves which are not needed")
    const nx = [...extra, pinNotFor(lead.out, lead.in, g)];
    // (the forced chain's first node, the card on screen: the root its Show another lands on (your plan with this
    // refusal, no transfer forced) asked ahead beside the next forced road, unless the last root still answers it. In a
    // week after the window's first it was asked only at the tap, the forced road ahead let go until it landed: two
    // serial solves after every Show another, 10.9-14.4 s cold; qa-tk87 trace n)
    if (forced && d === depth && !peek && showingAt(P, g)) {
      const values = rootValues(ctx, P, g, nx), key = valuesKey(P, values), last = ROOTS.get(`${P.entry}|${g}`);
      if (last && last.version === P.b.version && rootStill(last.values, values, last.road)) {
        if (!forkRead(key)) forkKept(key, { ...last.road, key, values });
      } else if (!seen.has(key) && forkRead(key) == null) {
        seen.add(key);
        forkAsk(ctx, P, { key, values, gw: g, side: true, prep: true });
      }
    }
    walk(nx, d - 1, forced);
  };
  walk([], depth);
  return out;
}

export function extraWeek(P, g) {
  const w = weekOf(P, g);
  if (!w || squadWeek(w)) return false;
  const n = repicks(P, g) ? w.moves.filter((m) => pinOfMove(P, m)).length : w.moves.length;
  return n > 0 && n >= Math.max(0, w.ft ?? 1);
}

/** GW g is a week Forkcast plans itself (gwMode not 'roll'; never a Wildcard or Free Hit week): it picks its own
 *  transfers there again at each solve, so they give way to one of yours (addYours) and never count as yours
 *  (extraWeek). Under the hold: a week the hold leaves to the planner (memory.holdOf); off it: every week but one a
 *  Roll locks. */
export function repicks(P, g) {
  const w = weekOf(P, g);
  return !!w && !squadWeek(w) && gwMode(P, g) !== 'roll';
}

/**
 * Your sale of `out` for `inn` in GW g added to your plan (addMove on draftOf) as the plan then makes it: in each week
 * from g on that Forkcast re-picks (repicks) where it would bring a hit, one of Forkcast's own transfers there gives
 * way instead (each dropped in turn: a free transfer back), the legal one with the most points; the hit stays a choice
 * only while that week's cap allows it (gwMode: none under 'free', at most n under 'h<n>', else the solver's cap). →
 * addMove's {draft, ev, problem} and `instead` (the first Forkcast transfer it replaces, {gw, out, in} | null).
 * Measures a suggestion's number (suggestionsOf), its Why and When line, and sellFrom. d0: draftOf; measure:
 * addMove's.
 */
export function addYours(ctx, P, g, out, inn, d0 = draftOf(ctx), measure = null) {
  let r = { ...addMove(ctx, d0, g, out, inn, measure), instead: null };
  const before = baseline(ctx, g);
  const hitsAt = (ev, x) => ev.gws.find((s) => s.gw === x)?.hits ?? 0;
  for (const x of P.gws.filter((y) => y >= g && repicks(P, y))) {
    if (hitsAt(r.ev, x) <= hitsAt(before, x)) continue;
    const mode = gwMode(P, x);
    const room = mode === 'free' ? 0 : mode.startsWith('h') ? Number(mode.slice(1)) : hitCap(P.base) ?? Infinity;
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
 * each): the same sale in the same GW with another buy, from the suggestions' source (modelMoves: the model's buys for
 * him) and Replace's (buyCandidates) where one gains more than your buy (or, when the model has none for him,
 * Replace's best OWN_ALTS_ALONE), each measured as your row is (rowGains, a hit counted), only those the swap can make
 * (addMove) and none your plan moves from GW g on (movedFrom), best first (those inside the best's noise cheaper
 * first: cheaperFirst), at most OWN_ALTS; `all` (a place you opened: plansOf's placesAsked) every one Replace's tries
 * find. None in a Wildcard / Free Hit week, for a funding sale or the buy it pays for, or for a move no sale of yours
 * makes. A suggested move the week doesn't make yet has the list it will have once taken, measured as its row will be
 * (owner, 2026-10-21). Once per plan view and move. → [{out, in, cmp}]
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
  // the plan as the row measures it (`d`: the week's moves up to this one, later ones dropped last first; `cut` when
  // some are), against those before it (rowGains); a suggestion's: your plan with it added against your plan
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
    const no = barred(P, g), refused = refusedAt(P, g);
    const mine = movedFrom(P, g);
    const measure = (ids) => ids.flatMap((id) => {
      if (id === m.in || w.squad.includes(id) || mine.has(id) || no.has(id) || refused.has(`${m.out}>${id}`)) return [];
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
/** Buy c is tied with the row's chosen buy x, inside the noise (engine.verdictLabel of main minus alt is 'coin'): the
 *  cheaper goes first (cheaperFirst). */
export const tiedBuy = (x, c, noise) => !!x && E.verdictLabel(choiceGain(x) - choiceGain(c), noise) === 'coin';
/** One sale's buys best first, those tied with the best (tiedBuy) cheaper first, so a tenth never crowns one of them
 *  (owner, 2026-10-10). price(id) → £m | null (unknown after the known); without it the gain order. Pure. [{in, cmp:
 *  {delta}}] → a new list */
export function cheaperFirst(list, noise = 0, price = null) {
  const out = [...(list || [])].sort((a, b) => choiceGain(b) - choiceGain(a));
  if (!price || !out.length) return out;
  const cost = (x) => price(x.in) ?? Infinity;
  const tied = out.filter((x) => tiedBuy(out[0], x, noise)).sort((a, b) => cost(a) - cost(b));
  return [...tied, ...out.filter((x) => !tied.includes(x))];
}

/**
 * The best single move for the free transfer your transfer `m` of GW g takes, found as the suggestions are
 * (suggestionsOf: the model's moves on the bundle's roads, none barred, kept or moved from GW g on, but this
 * transfer's own two) on the plan without it, measured against that plan as its row is (rowGains' without; addYours,
 * compare). Only while it takes a free transfer (no hit of its own) and the week has none left (extraWeek): none off
 * the hold. Once per plan view and move. → {out, in, cmp} | null
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
    const no = barred(P, g), refused = refusedAt(P, g), kept = keptFrom(P, g), mine = movedFrom(P, g);
    mine.delete(m.out);
    mine.delete(m.in);
    for (const x of modelMoves(P, g, { now: true }).values()) {
      if ((x.out === m.out && x.in === m.in) || !into.includes(x.out) || !squad.includes(x.out) || squad.includes(x.in) || mine.has(x.out) || mine.has(x.in) || no.has(x.in) || refused.has(`${x.out}>${x.in}`) || kept.has(x.out)) continue;
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

/** Your draft without your GW-g transfer m (dropMove), your lineups from GW `from` on gone with it (they name its players). */
function draftWithout(ctx, P, g, m, from = -Infinity) {
  const d0 = draftOf(ctx);
  let d = dropMove(d0, flatMoves(d0).find((x) => x.gw === g && x.out === m.out) ?? { gw: g, out: m.out, in: m.in });
  for (const x of P.gws) if (x >= from && d.lineups?.[x]) d = E.setLineup(d, x, null);
  return d;
}

/**
 * The Why sheet's When line: the same move made in each GW of the plan's window, P.A to P.end, each measured as the
 * sheet's own number is: your plan without it (dropMove), then the move added in that GW, against your plan without it
 * at all (so two weeks differ by what moving it there does; lineups left to the engine from GW A on in both); its own
 * GW is the move's own number (rowGains). Never the sheet's "vs rolling" number (owner, 2026-10-19).
 * A GW where the move can't be made is {ok: false} ("—"): the bank, club limit or squad can't take it (addMove's
 * problem), it is GW A under way (inkAt) or its own GW, or a Wildcard or Free Hit week. Single moves under the hold
 * only: null for a funding sale or the buy it pays for, a move no sale of yours makes, or a squad week's change.
 * m: {gw (the move's own GW), out, in}. → [{gw, ok, current, delta, label}] | null
 */
export function whenOf(ctx, P, m) {
  const g = Number(m.gw);
  const w = weekOf(P, g);
  if (!P?.mem?.hold || !w || squadWeek(w) || pinOfMove(P, m)?.kind !== 'sell' || fundingOf(P, g, m)) return null;
  const d = draftWithout(ctx, P, g, m);
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
 * Your transfer m ({gw, out, in}) made in GW g2 instead, keeping its buy, in ONE edit (one Undo): its sale rule
 * (memory.pinSell, sell:<out>) dropped and made again from g2, checked first on your plan without it (dropMove) with
 * it added in g2 (addMove). Made again it is your newest rule, so in a week with a transfer of yours already it is the
 * extra one (rowGains). A rule of yours it contradicts goes and is named (withTaken); a move into GW A under way is
 * refused (memory.inkOf; one out of it is never offered: whenOf, whyActs). Toast "Chilwell → Bassey moved to GW7 ·
 * −2.2 pts" (vsPrev) with Undo. → bool
 */
export function moveTo(ctx, m, g2) {
  const P = plan(ctx);
  const g = Number(m.gw), to = Number(g2);
  const pin = P ? pinOfMove(P, m) : null;
  if (!P || to === g || !P.gws.includes(to) || pin?.kind !== 'sell' || !weekOf(P, g)?.moves.some((x) => x.out === m.out && x.in === m.in)) return false;
  const nm = P.L.name;
  const lo = Math.min(g, to);
  const d = draftWithout(ctx, P, g, m, lo);
  const r = addMove(ctx, d, to, m.out, m.in);
  if (r.problem) { toastOf(ctx)(problemText(ctx, r.problem, nm(m.in)), 'warn'); return false; }
  const next = pinSell(m.out, to, P.end, { in: m.in, label: `${nm(m.out)} → ${nm(m.in)} from GW${to}` });
  const taken = clashing(P, next).filter((q) => q.id !== pin.id);
  const what = withTaken(P, COPY.movedTo(`${nm(m.out)} → ${nm(m.in)}`, to), taken);
  // its row leaves the week on screen: its points even when it lands at once (B24's premise fails)
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
// solves' count (pairChanged; plansOf's cache keys on it)
export const PAIR = { flight: null, until: 0, prepUntil: 0, rev: 0 };
export const PAIR_AGAIN_MS = 1500, PAIR_HOLD_MS = 30000;

/** Speculative-slot solves of this browser a suggested plan's solve takes the slot from: its own background asks (a
 *  chip preparation, the options road; each asked again later) and an older fork. A Wish solve is a sheet you are
 *  looking at: the fork waits for it. */
export const PAIR_TAKES = new Set(['chipprep', 'speculative', 'pair', 'pairnext', 'presolve']);
/** …and those the next week's preparation (prepNext) goes beside, in a lane of its own: never a Wish's or the options
 *  road's. */
export const PREP_BESIDE = new Set(['chipprep', 'pair', 'pairnext', 'presolve']);
/** A suggested plan's solve landed: the week line, the choices on the pitch and an open Week sheet alone re-draw (Ahead's
 *  mount listens to aheadPair: renderPair). */
export const pairChanged = (ctx) => ctx.store.set('aheadPair', ++PAIR.rev);

/** What a suggested plan's + takes in GW g (owner, 2026-10-12: only this week's moves): its GW-g moves not yet yours
 *  (`own`), its GW-g chip (`chips`, [[g, chip]]) and your GW-g transfers it doesn't make (`gone`). Its later weeks are
 *  Forkcast's follow-up, never taken: the number's while Forkcast makes your transfers, never under the hold (plansOf's
 *  `alone`). Pure. */
export function planTake(P, g, pl) {
  const chip = pl.chips?.[g] ?? null;
  // a move of yours the plan's choice keeps stays yours only when exact (an open sale, "Let Forkcast choose", is made
  // the choice's: the week's Roll caps it at exactly these moves, addPlan)
  const own = SQUAD_CHIPS.has(chip) ? [] : pl.moves.filter((m) => m.gw === g && !(isYours(P, m) && isExact(pinOfMove(P, m))));
  // `back`: your Wildcard or Free Hit there that it doesn't play, taken off (chipBackOf; owner, 2026-10-13)
  return { own, chips: chip ? [[g, chip]] : [], gone: yoursTakenBack(P, g, pl.moves), back: chipBackOf(P, g, pl) };
}
/** The rules of yours (ids) that make the GW-g transfers a choice's + takes back (planTake's `gone`): its + drops them
 *  (addPlan). */
export const goneIds = (P, gone) => [...new Set(gone.map((m) => pinOfMove(P, m)?.id).filter(Boolean))];
/** Your transfers as the rules a choice's + leaves make them (pairsOf, less goneIds'): how the Week sheet pairs GW g
 *  once it is taken (viewOfRoadWeek), so its Why sheet pairs a Wildcard's or Free Hit's changes so before
 *  (squadChanges). Pure. → [{out, in}] */
export function takenKeep(P, g, pl) {
  const gone = new Set(goneIds(P, planTake(P, g, pl).gone));
  return pairsOf(P.pins.filter((p) => !gone.has(p.id)));
}
/** The draft taking GW g's choice makes on `base` (the plan's draft, its GW-g chip with it; or yours): GW g's moves
 *  `now`, your plan's weeks before g, and after g only the moves the + keeps (a transfer of yours, a Wildcard's or Free
 *  Hit's squad); Forkcast's own later moves are the next solve's (owner, 2026-10-13: "Same list, both modes"). One rule
 *  for the +'s draft (addPlan) and the list's (fitsAt). A later week your wish makes the planner's is kept whole as
 *  your plan has it, his buy with the sale that pays for him (owner, 2026-10-29), but a move of it the choice makes
 *  earlier goes (madeEarlier; owner, 2026-10-30). */
export function planTakeDraft(ctx, P, g, base, now) {
  const wished = wishWeeks(P);
  const keeps = (m) => m.gw < g || (m.gw > g && (!!squadWeek(weekOf(P, m.gw)) || ((!!pinOfMove(P, m) || wished.has(m.gw)) && !madeEarlier(now, m))));
  return withMoves(base, [...flatMoves(draftOf(ctx)).filter(keeps), ...now]);
}
/** Whether later move m sells or buys a player the moves `ms` (a choice's, made earlier) moved already: it is one of
 *  them made earlier, so it goes from its later week, as addMove takes it (planOfRoad, planTakeDraft). Pure. */
export const madeEarlier = (ms, m) => ms.some((y) => y.out === m.out || y.in === m.in);
/** The GWs a wish of yours makes the planner's (him from then: Add a player's button; never a chip week's pick). */
export const wishWeeks = (P) => new Set(asksOf(P).filter((p) => p.kind === 'wish' && !isPick(p)).map((p) => Number(p.gw)));

/** Draft `base` with GW g's week taken from draft `from`: its moves, its chip and its saved lineup, every other week
 *  `base`'s (a Free Hit's week alone on the roll plan's later weeks, its squad reverting after it: plansOf's chipOf).
 *  Pure. */
export const weekOnto = (base, from, g) => {
  const d = withMoves(base, [...flatMoves(base).filter((m) => m.gw !== g), ...flatMoves(from).filter((m) => m.gw === g)]);
  const c = E.setLineup(E.setChip(d, g, from.chips?.[g] ?? null), g, null), lu = from.lineups?.[g];
  return lu ? E.setLineup(c, g, lu) : c;
};

/** A suggested plan's GW g taken (plansOf; planTake): each of its GW-g moves not yet yours your exact transfer from GW
 *  g (memory.pinSell), a player it buys whom a later transfer of yours sells held only until the GW before that sale;
 *  your GW-g transfers it doesn't make taken back, and in a week Forkcast re-picks under a hits rule of yours that rule
 *  too; a Wildcard or Free Hit it plays planned as useChip plans it (chipEdit); a rule of yours a move contradicts, or
 *  a hits limit below the week's hits, taken back (withTaken). Toast: the week's moves with its GW ("GW6 Scott → Groß +
 *  Tavernier → Xhaka (−4)"), the chip with the rule it replaces (chipWords), the transfers taken back; no number under
 *  the hold (its row has it; owner, 2026-10-27), with no roll plan the total's (withPoints); your total's change is the
 *  header's (owner, 2026-10-26). One edit, one Undo, Why before it (whyAct). → bool (false: it changes nothing) */
/** A take's toast with its number: the week line's once your plan and its roll are in (weekRollOf: the take re-solves
 *  the weeks after it, so its count can part from the choice's own, QA landing: "0.0 vs rolling" under a line's +1.7),
 *  else the choice's (`cmp`) until then, the toast rewritten in place when the line's lands (sayAgain) while it is the
 *  one up, for a minute at most. → its words now */
function takeSaid(ctx, g, head, cmp, tail) {
  // (as drawn, never a solve asked: plansListed)
  const line = () => { const Q = plan(ctx), w = Q && weekOf(Q, g); return w ? weekRollOf(ctx, Q, w, (x) => plansListed(ctx, Q, x)) : null; };
  const now = line();
  if (now) return `${head}${fmt.signed(shownDelta(now))}${tail}`;
  // (the toast is made after these words: its handle a task later)
  setTimeout(() => {
    const was = saidNow();
    let off = null;
    // (unref: in node, the tests', a pending minute never holds the process open)
    const stop = setTimeout(() => off?.(), 60000);
    stop.unref?.();
    off = ctx.store.on('aheadPair', () => {
      const r = saidNow() === was ? line() : null;
      if (saidNow() !== was) { off(); clearTimeout(stop); return; }
      if (r) { off(); clearTimeout(stop); sayAgain(was, `${head}${fmt.signed(shownDelta(r))}${tail}`); }
    });
  }, 0);
  return `${head}${fmt.signed(shownDelta(cmp))}${tail}`;
}
export function addPlan(ctx, g, pl) {
  const P = plan(ctx);
  if (pl?.state !== 'ready') return false;
  const nm = P.L.name;
  const { own, chips, gone, back } = planTake(P, g, pl);
  // the Roll row (plansOf: Forkcast's plan rolling a week you roll) changes your week by its Roll alone: taken while
  // the week has none (owner, 2026-10-19: Roll clickable via + like the others)
  const locks = !!pl.rolls && !P.pins.some((p) => p.id === `roll:${g}`);
  if (!own.length && !chips.length && !gone.length && !back && !locks) return false;
  const draft = planTakeDraft(ctx, P, g, pl.draft, flatMoves(pl.draft).filter((m) => m.gw === g));
  // a sale whose money its week's other buy needs (the week without it over budget) funds that buy, as a bring-in's
  // does (buyPins), so its row reads "Frees £x so Y fits"; of two that each need the other, the one that frees more
  const ev = estimate(ctx, draft, g);
  const funder = new Map((() => {
    if (own.length !== 2) return [];
    const needs = (m) => freedBy(ev, g, m) > 0 && problemOf(ctx, estimate(ctx, dropDrafted(draft, m), g), g)?.code === 'budget';
    const f = own.filter(needs).sort((a, c) => freedBy(ev, g, c) - freedBy(ev, g, a))[0];
    return f ? [[f, own.find((m) => m !== f).in]] : [];
  })());
  // held only until the GW before that sale (as sellsOn remakes a transfer of yours)
  const later = flatMoves(draftOf(ctx)).filter((x) => x.gw > g && pinOfMove(P, x));
  const pins = own.map((m) => {
    const p = pinSell(m.out, m.gw, P.end, { in: m.in, funds: funder.get(m) ?? null, label: `${nm(m.out)} → ${nm(m.in)} in GW${m.gw}`, week: true });
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
  // the week is exactly the choice in both modes (owner, 2026-10-13: "Lock it, both modes"): a Roll capping GW g at its
  // moves (none: no transfers), in Your rules with its × that hands the week back (removeMove); a Wildcard or Free Hit
  // makes its own squad
  const roll = chips.length ? null : pinRoll(g, pl.moves.filter((m) => m.gw === g).length);
  if (roll) pins.push(roll);
  // a player its moves sell whom a transfer of yours bought before GW g: that transfer stays, his hold ending the GW
  // before (sellsOn, as Sell and Replace keep it), and the rules are judged with it so
  const { chain, asks } = chainOf(P, g, own);
  pins.push(...chain.values());
  const rule = !chips.length && repicks(P, g) ? P.pins.filter((p) => p.id === `hits:${g}`) : [];
  drop.push(...rule.map((p) => p.id));
  const ids = new Set(pins.map((p) => p.id));
  // a limit counts the week's hits, not only those the take adds
  const hits = ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  const limit = asksOf(P).filter((p) => p.kind === 'hits' && !drop.includes(p.id) && Number(p.hits?.[g] ?? Infinity) < hits);
  // the week's Roll is the choice itself, never a rule against your moves it keeps; a Wish the take makes an exact sale
  // is no rule taken back
  const wished = new Set(own.flatMap((m) => wishDrop(P, m.in)));
  const taken = [...new Map([...pins.filter((p) => !isRoll(p) && !chain.has(p.id)).flatMap((p) => clashing(P, p, asks)), ...limit].filter((q) => !ids.has(q.id) && !drop.includes(q.id) && !wished.has(q.id)).map((q) => [q.id, q])).values()];
  const move = (m) => `${nm(m.out)} → ${nm(m.in)}`;
  const hit = own.length && pl.hits?.[g] ? ` (${MINUS}${E.HIT_COST * pl.hits[g]})` : '';
  const head = chipSaid.get(g) ?? (own.length ? `GW${g} ${own.map(move).join(' + ')}${hit}` : !pl.moves.some((m) => m.gw === g) ? COPY.planRoll(g) : null);
  // the rule it adds, named as Your rules lists it, its GW once after a head that names it ("GW8 Saka → Palmer ·
  // frozen"), unless its words are the head's ("GW8 roll") or it stands already (owner, 2026-10-22)
  const rg = `GW${g} `;
  // (a standing rule is judged by what it keeps, never its stored label: rules saved before 2026-10-22 say "GW8 lock")
  const made = roll && roll.label !== head && !P.pins.some((p) => p.id === roll.id && rollKeeps(p) === rollKeeps(roll))
    ? (head?.startsWith(rg) && roll.label.startsWith(rg) ? roll.label.slice(rg.length) : roll.label) : null;
  // the transfers it takes back in one clause, its GW said once; where the week keeps transfers of yours beside its
  // own, their count named ("… · frozen · 3 transfers in GW8"; owner, 2026-10-22)
  const nAt = pl.moves.filter((m) => m.gw === g).length;
  const kept = own.length && !chips.length && nAt > own.length && (weekOf(P, g)?.moves.length ?? 0) > 0 ? COPY.weekTransfers(nAt, g) : null;
  // one move in place of your one transfer of the same player, in the place's words: "GW9 Calvert-Lewin → Barry instead
  // of Evanilson", not "… · Calvert-Lewin → Evanilson removed", whose "removed" a one-line toast head would clip first
  // (ui.js toastWords; owner, 2026-10-26)
  const swapped = own.length === 1 && gone.length === 1 && gone[0].out === own[0].out && head?.endsWith(move(own[0]) + hit)
    && !chips.length && !back;
  const said = [swapped ? `${head} ${COPY.planInsteadOf(nm(gone[0].in))}` : head, made, kept, gone.length && !swapped ? COPY.removed(gone.map((m, i) => `${head || i ? '' : `GW${g} `}${move(m)}`)) : null, off ? COPY.chipTakenOff(chipName(back), g) : null,
    ...(off?.pins ?? []).map((q) => COPY.chipBack(autoRuleName(q, g))), ...rule.map((q) => COPY.chipRemoves(autoRuleName(q, g)))].filter(Boolean);
  const what = withTaken(P, said.join(' · '), taken);
  // a choice the solver hasn't planned (no road of its own) is checked for budget and club before its solve is asked
  // (whether a solve is worth asking; never what is drawn)
  const p = !pl.road && !chips.some(([, c]) => SQUAD_CHIPS.has(c)) ? problemOf(ctx, ev, g) : null;
  if (p) { toastOf(ctx)(problemText(ctx, p), 'warn'); return false; }
  // the week line keeps the take's number while your plan is what it made (owner, 2026-11-02: "+1.9" after the take
  // too, not the re-plan's 1.74, a later week solved another way the solver counts the same): weekRollOf, until your
  // rules change again
  if (!DRY && pl.vsRoll && !pl.refRow) AHEAD.took = { team: `${P.entry}|${P.A}`, version: P.b.version, g, sig: movesKey(pl.choice.moves.filter((m) => (m.gw ?? g) === g)), cmp: pl.cmp, forced: !!pl.forced, rounds: windowRounds(pl.road, g), before: rulesKey(P), pins: null };
  return edit(ctx, {
    pins, drop: [...own.flatMap((m) => wishDrop(P, m.in)), ...drop, ...taken.map((q) => q.id)], road: pl.road, inPlace: chain.keys().next().value ?? null,
    // a GW-g armband the plan moves is said, as every edit's ending says it (B21)
    from: g, what, taken: [...chipTaken, ...rule, ...taken],
    // a Roll + that takes nothing back and changes no number says the rule it made (rollMade), not "GW8 roll · total
    // 0.0"
    text: locks && !own.length && !chips.length && !gone.length && !back ? () => COPY.rollMade(g)
      // the row's own number and what it counts against, as its plate said it, last (review 7, 2026-11-02: "a
      // confirmation states what the edit did, with its number", reversing the owner's 2026-10-27 no number): its row
      // beside the buttons (ui.toast .split), the lineup's words in the head, which clips; never what your total moved
      // by (owner, 2026-10-26): that is the header's change (renderTotal)
      : pl.vsRoll && !pl.refRow ? (Q, prev) => takeSaid(ctx, g, `${what}${lineupMoved(Q, prev, g)} · `, pl.cmp, ` vs ${choiceVs(P, pl)}`) : withPoints(ctx, what, (Q, prev) => lineupMoved(Q, prev, g), { total: true }),
    more: own.length && WHY_SHEET ? [whyAct(g, own[0].in)] : [],
    // a take's receipt: two rows on a phone, its head one line, "frozen", the week's count and the lineup's words clipping
    // after the sales, anything it takes back whole (ui.toast; owner, 2026-10-26; the lineup's since QA manyft, 2026-11-04:
    // a row with a hit beside your transfer took four lines with "Vuskovic to bench" kept whole)
    take: (Q, prev) => [made, kept, ...lineupMoved(Q, prev, g).split(' · ').slice(1)].filter(Boolean),
  });
}

/** Transfer m ({gw, out, in}) is one of yours in your plan: a rule of yours makes it and its week has it. */
const isYours = (P, m) => !!pinOfMove(P, m) && !!weekOf(P, m.gw)?.moves.some((y) => y.out === m.out && y.in === m.in);
/** GW g's transfers that `moves` (a plan's) doesn't make, yours and Forkcast's (owner, 2026-10-13), never a Wildcard's
 *  or Free Hit's squad: what taking it takes back (addPlan's toast, the plan row's "instead of"). → [{gw, out, in}] */
export const yoursTakenBack = (P, g, moves) => (weekOf(P, g)?.moves || []).map((m) => ({ gw: g, out: m.out, in: m.in }))
  .filter((m) => (!squadWeek(weekOf(P, g)) || isYours(P, m)) && !moves.some((x) => sameMove(x, m)));
/** Your Roll holds GW g (a Roll row's +: addPlan; "Rolling ✓" beside the goal) while the week has no transfer and no
 *  Wildcard or Free Hit: a choice that moves someone there takes it back, so its rows and cards say "instead of
 *  rolling". */
export const rollingAt = (P, g) => { const w = weekOf(P, g); return !!w && !w.moves.length && !squadWeek(w) && P.pins.some((p) => p.id === `roll:${g}` && !rollKeeps(p)); };

/** The rule of yours that makes transfer m (a sale, with its buy or the plan's pick; a slide or a Wish that buys him; a
 *  chip week's pick only in its week) | null: the row's × lifts it. P: a plan view. */
export const pinOfMove = (P, m) => asksOf(P).find((p) => (p.kind === 'sell' && Number(p.player) === Number(m.out) && (p.in == null || Number(p.in) === Number(m.in)))
  || ((p.kind === 'slide' || p.kind === 'wish') && Number(p.player) === Number(m.in) && !(isPick(p) && (m.gw == null || Number(m.gw) !== Number(p.gw))))) ?? null;

/**
 * GW g's transfers in the order they were made (their rules' order, oldest first; the planner's own after yours), so a
 * week's free transfers go to the first and a hit to the extra one. P: a plan view; w: its week. → [move]
 */
export function movesInOrder(P, w) {
  const asks = asksOf(P);
  const rank = (m) => { const p = pinOfMove(P, { ...m, gw: w.gw }); const i = p ? asks.indexOf(p) : -1; return i < 0 ? Infinity : i; };
  return (w?.moves || []).map((m, i) => [m, i]).sort(([a, i], [b, j]) => rank(a) - rank(b) || i - j).map(([m]) => m);
}

/**
 * A funding move (a sale of yours made so another buy fits: pin.funds, bringIn's "Do both") and the move it funds,
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
export const soldBy = (q) => (q.kind === 'sell' ? q.player : q.kind === 'slide' ? q.out : null);
export const boughtBy = (q) => (q.kind === 'sell' ? q.in : q.kind === 'slide' || q.kind === 'wish' ? q.player : null);
/** A transfer as a removal's toast names it: "Tavernier → Gomez". */
const moveSaid = (nm, x) => `${nm(x.out)} → ${nm(x.in)}`;
/**
 * A transfer off the plan by its row's × (or its place's Remove): its rule of yours goes, with Undo, and the week's
 * Roll a take made with it (addPlan); under the hold its GW rolls again. Nothing else goes with it: what the remaining
 * rules need is the solver's to plan, or to say it can't (fail: "… removed: no plan keeps your GW9 choices …"); no
 * phone arithmetic (owner, 2026-10-26: "fix so every squad is solver squad, no hardcoded logic whatsoever"). A move
 * the planner made (a week you let it plan) has no rule: × keeps the player it sells in that GW (keep, scope 'gw'). →
 * bool
 */
export function removeMove(ctx, m) {
  const P = plan(ctx);
  const nm = P.L.name;
  // GW A under way is FPL's (memory.inkClash judges added pins; a removal adds none, so it is judged here)
  if (m.gw === P.A && isLive(ctx)) { toastOf(ctx)(COPY.live(P.A), 'warn'); return false; }
  const pin = pinOfMove(P, m);
  if (!pin) return m.gw != null ? keep(ctx, m.out, { gw: m.gw, scope: 'gw' }) : false;
  // the week's Roll (a plan's + stored it: addPlan): the × hands the week back to whoever makes the rest, said as every
  // rule an edit takes back is (withTaken)
  const taken = m.gw == null ? [] : P.pins.filter((q) => q.id === `roll:${m.gw}`);
  const from = Math.max(P.A, num(pin.gw) ?? P.A);
  const own = { ...m, gw: m.gw ?? from };
  const what = withTaken(P, COPY.removed(moveSaid(nm, own)), taken);
  // the verdict's ending (endingOf, B21): a hit, what the planner put in its place, a later week's hit and a new
  // captain of the edit's week, never the move its own words name
  const end = (Q, prev) => endingOf(Q, prev, own.gw, { own: m.out, named: [own] });
  // B24's premise ("its number is on its row") fails here, the row is gone: its points even when it lands at once,
  // named as what your total moves by; where it was GW g's one move (it rolls again, its week's choices standing:
  // weekRollOf on plansListed) no number, as a take's toast (owner, 2026-10-27)
  const w = weekOf(P, own.gw);
  const rolls = !!w && !squadWeek(w) && w.moves.every((x) => x.out === own.out && x.in === own.in);
  const vr = rolls ? weekRollOf(ctx, P, w, (x) => plansListed(ctx, P, x)) : null;
  const text = vr ? (Q, prev) => `${what}${end(Q, prev)}` : withPoints(ctx, what, end, { total: true });
  // the move its toast names is remembered as removed by you, part of its Undo (edit's `also`, after the snapshot)
  return edit(ctx, { drop: [pin.id, ...taken.map((q) => q.id)], from, what, taken, text, also: () => noteRemoved(P, [own]) });
}

/** Every transfer of yours in GW g taken back in one edit: the card's Undo, which names them all (owner, 2026-11-05, "why
 *  ... when i click undo it not undo it and keep silva transfer"). → bool */
export function removeWeek(ctx, g) {
  const P = plan(ctx), own = (weekOf(P, g)?.moves || []).map((m) => ({ ...m, gw: g }));
  // …and a later week's swap that buys back a player this week sells: with this week's sale undone he is yours, the
  // buy can't stand, and the plan it asked for failed, the Undo taking nothing back (qa-tk110 j-moves-undo-earlier: GW11
  // Muharemović → Van Hecke, GW12 Gabriel → Muharemović, Undo in GW11 left both)
  const sold = new Set(own.map((m) => Number(m.out)));
  const back = P.gws.filter((x) => x > g).flatMap((x) => (weekOf(P, x)?.moves || []).filter((m) => sold.has(Number(m.in))).map((m) => ({ ...m, gw: x })));
  const moves = [...own, ...back];
  if (g === P.A && isLive(ctx)) { toastOf(ctx)(COPY.live(P.A), 'warn'); return false; }
  const taken = P.pins.filter((q) => q.id === `roll:${g}`);
  const what = withTaken(P, COPY.removed(moves.map((m) => moveSaid(P.L.name, m)).join(', ')), taken);
  // (no noteRemoved: an Undo, never a refusal, so the card it undid comes back)
  return edit(ctx, { drop: [...goneIds(P, moves), ...taken.map((q) => q.id)], from: g, what, taken, text: withPoints(ctx, what, () => '', { total: true }) });
}

/**
 * Each of GW g's transfers measured in the order they were made (movesInOrder): the plan with it and the ones before
 * it against the plan with only the ones before it, from GW g on (asTaken). Free transfers go to the first moves, so a
 * hit is the extra move's and the rows add up to the week's gain. Once per plan view and GW. → Map(`${out}>${in}` →
 * {cmp, hit, withIt, without (estimates), dWith, dWithout (drafts)})
 */
const ROWGAINS = new WeakMap();
export function rowGains(ctx, P, w) {
  let by = ROWGAINS.get(P);
  if (!by) ROWGAINS.set(P, (by = new Map()));
  if (by.has(w.gw)) return by.get(w.gw);
  const g = w.gw;
  const ms = movesInOrder(P, w);
  // evs[k]: the plan with the week's first k moves (later ones dropped last first); ds[k] its draft (as taken: your
  // saved lineups kept, as a plan row counts them)
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

/** A Why sheet's number set on the sheet's own baseline (owner, 2026-10-22: one baseline per sheet, all vs rolling):
 *  `delta` measured against the same plan as `own` (keeping the player it sells, or your plan as it stands), moved by
 *  the gap between that baseline and the header's (`head`, the same choice against rolling): own − head is what rolling
 *  makes over that plan. Pure. → delta (head null: as it is) */
export const onBase = (delta, own, head = null) => (head == null ? delta : delta - own + head);
/** The When line's weeks (whenOf, against keeping the player it sells) on the header's baseline (`head`, its number
 *  against rolling: onBase, its own week's number the base), so its own week reads the header's number and another week
 *  what moving it there gives against rolling ("GW9 0.0": rolling makes the same move then). Pure. → weeks */
export function whenOnBase(weeks, head = null) {
  const cur = weeks?.find((x) => x.current && x.ok);
  return head == null || !cur ? weeks : weeks.map((x) => (x.ok ? { ...x, delta: onBase(x.delta, cur.delta, head) } : x));
}

/** If move `m` of GW g's buy misses that GW: the plan with it (dWith) against the plan without it (dWithout) from GW g
 *  on, his GW-g forecast 0 in both and the lineups still picked on the forecasts (engine.evaluate fixedLineups), played
 *  as taken (asTaken). `base`: the same two plans with his forecast → compare + {base}. */
export function ifMisses(ctx, P, g, m, dWith, dWithout) {
  const score = { xp: (id, x) => (id === m.in && x === g ? 0 : P.L.xp(id, x)), fixedLineups: true };
  const base = compare(ctx, asTaken(ctx, P, dWith, g), asTaken(ctx, P, dWithout, g)).delta;
  return { ...compare(ctx, asTaken(ctx, P, dWith, g, score), asTaken(ctx, P, dWithout, g, score)), base };
}

/**
 * What a move changes besides its two players' numbers (the Why sheet's list under its table), from the data: "frees
 * £0.2m" (money it takes from the bank, with the bank it takes it from: "£0.3m from the bank (£0.9m in the bank
 * now)"), "−4: the extra transfer", "replaces Szoboszlai → Gibbs-White" (a Forkcast transfer it takes the place of,
 * addYours); the plan with it (withIt) against the plan without it (without), estimates from GW g on. "GW7: 1 FT, not
 * 2" when it changes the next GW's free transfers; "−4 in GW8" for a later week it brings a hit (hitsLater). If its
 * buy misses GW g, and when he plays ("if Bassey misses GW6: −1.2, not +3.4": ifMisses on `drafts`, [with it, without
 * it]). Your transfer (`yours`) beside a better use of its free transfer by more than the noise, against `c`, the
 * sheet's number (otherUseOf). No bench remark (owner, 2026-10-09). `head`: the sheet's own number where its header
 * counts against another baseline than `without` (rolling): the miss and the better use are set on it (onBase) so the
 * sheet has one baseline (owner, 2026-10-22). → [text]
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
  // the bank it spends from: after the week's other transfers where it has some (their money in it), as Replace's
  // header says it (bankNow); your transfer's in your plan as it stands (rowGains' plan with it drops the week's later
  // moves: a buy's funding sale)
  const evB = yours ? planBaseline(ctx, P, g) : withIt;
  const wk = evB.gws.find((x) => x.gw === g);
  const others = (wk?.moves || []).some((x) => x.ok && x.out !== m.out);
  const bank = wk ? COPY.bankNow(fmt.money(wk.bank - freedBy(evB, g, m)), g, P.A, others) : null;
  // the next GW's free transfers read as the bank is: your transfer's in your plan as it stands, and without it there
  // one transfer fewer in its week (engine: evaluate's `used`, nextFt, ftGrant); a choice's with and without (two or
  // more transfers: without all of them, said so: "4 without these 3 transfers")
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
export const pairOf = (ev, g, m) => {
  const x = ev?.gws.find((s) => s.gw === g)?.moves.find((y) => y.out === m.out && y.in === m.in);
  return { in: m.in, out: m.out, buy: x?.buy ?? null, sell: x?.sell ?? null };
};

/** An edit's verdict (`text`, edit's) with player `id`'s FPL flag after it when the edit loses points: a Why sheet
 *  act's reason ("Keeping Scott in GW6 · −7.5 pts · Scott is injured (knee)": keep, veto). */
export const withFlag = (ctx, id, text) => (Q, prev) => {
  const t = text(Q, prev);
  const flag = statusText(Q.L.name(id), Q.L.get(id)?.row);
  return flag && compare(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }).delta <= -0.05 ? `${t} · ${flag}` : t;
};
