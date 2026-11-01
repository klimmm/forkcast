// ahead.js: a buy does only what it says

import * as E from '../../plan/engine.js';
import { h, toMs, reduceMotion } from '../../ui.js';
import { fplMarks } from '../../plan/pitch.js';
import { COPY, priceWatch, hitCap } from '../calls.js';
import { pinSell, isRoll, composePins, parseSpans, deadlinePassed } from '../memory.js';
import { OFFLINE_EDIT, REMOVED, addMove, asYours, clone, compare, draftOf, dropMove, editable, flashLanding, flatMoves, ids, info, inputs, isFrozen, lineups, memOf, movedFrom, num, pairedMoves, plan, problemText, problemsOf, removedBy, setLineups, solveFor, squadBefore, weekOf, wishDrop, wishPin } from './core.js';
import { asksOf, buyCandidates, clashing, derivedPin, edit, endingOf, forgetEdit, keptFrom, ruleOf, say, subjectOf, toastOf, undoOf, vsPrev, withTaken } from './edits.js';
import { planBaseline, takenBy } from './plans.js';
import { pairMovesOf } from './presolve.js';
import { squadWeek } from './pieces.js';

// ---------------------------------------------------------------- A1: a buy does only what it says

const FUND_MAINS = 3, FUND_SELLS = 8, FUND_BUYS = 4;
/**
 * How player `id` comes in from GW g as exact moves of yours (an action does only what it says; more is asked first),
 * each measured on the engine as adding it to your plan (under the hold the plan of exact moves is the engine's own
 * evaluation, memory.holdRoad):
 * {kind: 'one', out, in, draft, ev, cmp, hits}: the best sale of his position going into g, none your week already
 * makes nor your Keeps hold (keptFrom), that fits the bank and the club limit (`out`'s, when the sale is chosen:
 * Replace);
 * {kind: 'two', out, in, fund: {out, in}, short, draft, ev, cmp, hits}: none fits, so that sale with one more that
 * frees the money (`short`: what the buy alone lacks): asked first ("Also sell Calafiori → Bassey (−4)? Do both");
 * {kind: 'none', short (null: not the money), problem}: not even with one more sale (problem 'kept': every sale of his
 * position is a player your Keeps hold, {gw, kept: [[id, first GW his Keep holds him]]}).
 * hits: the hits GW g takes more than now. Never drops a move of yours or sets a hits rule. Memoised per plan view.
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
 *  buy of him dropped: draftFor), never a player your plan already moves from GW g on (movedFrom) but one your later
 *  buy of him sells (movedBesides); `fixed` alone when given; as taken (takenBy). → [{o, r: addMove's {draft, ev,
 *  problem}}] best first. buyPlan's one sale and Add a player's sales (saleOptions) are these. */
function saleTries(ctx, P, id, g, fixed = null) {
  const d0 = draftFor(ctx, P, id, g);
  const mine = movedBesides(P, id, g);
  const sells = fixed != null ? [fixed] : squadBefore(P, g).filter((p) => P.L.pos(p) === P.L.pos(id) && !mine.has(p));
  return sells.map((o) => ({ o, r: addMove(ctx, d0, g, o, id, takenBy(ctx, P)) })).sort((a, b) => b.r.ev.total - a.r.ev.total);
}

/** The sales that can bring player `id` in from GW g, for you to choose from (owner, 2026-10-10): each as saleTries
 *  makes it, against your plan (planBaseline): [{out, cmp | null, problem (budget: its `short`; club)}], best first.
 *  Once per plan view, player and GW. */
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
  // as taken (takenBy, planBaseline): the number is what the tap gives, your saved lineups kept
  const ev0 = planBaseline(ctx, P, g);
  const by = takenBy(ctx, P);
  const into = squadBefore(P, g), w = weekOf(P, g);
  // a Wildcard or Free Hit week remakes the squad: no one sale brings him in there, the solve for him does
  // (solvesRound), one of yours too whom that week's squad leaves out
  if (squadWeek(w)) return { kind: 'none', short: null, problem: { code: w.squad.includes(id) ? 'owned' : 'chip', gw: g } };
  if (into.includes(id) || w.squad.includes(id)) return { kind: 'none', short: null, problem: { code: 'owned', gw: g } };
  const hitsAt = (ev) => ev.gws.find((s) => s.gw === g)?.hits ?? 0;
  const done = (kind, r, extra) => ({ kind, in: id, draft: r.draft, ev: r.ev, cmp: compare(ctx, r.ev, ev0), hits: Math.max(0, hitsAt(r.ev) - hitsAt(ev0)), ...extra });
  // he comes in for one of his position, as one more transfer (saleTries), never one your Keeps hold from GW g on
  // (keptFrom) but the sale you chose (`fixed`: it takes the Keep back, named); every sale kept says so
  const mine = movedBesides(P, id, g), kept = keptFrom(P, g);
  const all = saleTries(ctx, P, id, g, fixed);
  const tries = fixed != null ? all : all.filter((t) => !kept.has(t.o));
  if (all.length && !tries.length) return { kind: 'none', short: null, problem: { code: 'kept', gw: g, kept: all.map((t) => [t.o, kept.get(t.o)]) } };
  const fits = tries.find((t) => !t.r.problem);
  const broke = tries.filter((t) => t.r.problem?.code === 'budget');
  if (!fits && !broke.length) return { kind: 'none', short: null, problem: tries[0]?.r.problem ?? null };
  // one more sale that frees the money: the squad's weakest few from GW g on (never one your plan moves, mine, nor one
  // your Keeps hold, kept), each for the best few buys of his position his sale pays for. Each is weighed net of the
  // funding move, the plan with that move alone (`alone`) its baseline, not by its whole total with the funding move's
  // own gain
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

/** A sale chip's bring-in (Bring in…'s Sells; owner, 2026-10-28, as FPL allows a negative ITB): him for exactly that
 *  sale from GW g, as buyPlan's 'one' even where the bank can't pay (`short`: what it lacks; the plan then shows the
 *  bank below 0, memory.holdOf's debts, and Forkcast's way to pay it back: owedRoad); one the club limit stops, or none
 *  his place has, is buyPlan's answer. */
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
 * Player `id` in from GW g as buyPlan found him (bp, 'one' or an asked 'two'): his sale, and with 'two' the sale that
 * frees the money (marked `funds`: its row says so, its Why weighs it with the buy, its × takes that buy with it:
 * removeMove), as sales of yours (memory.pinSell): one edit, one Undo. Under the hold no week becomes the planner's
 * and no hits rule is set; the toast names what came in, the points, a hit and a new GW-g captain. → bool
 */
export function bringIn(ctx, id, g, bp) {
  const P = plan(ctx);
  if (bp?.kind === 'pick') {
    // his wish pin with the solve that made it (any week's: holdBuy), the rules wishSolve solved without off
    // (bringInTakes); a wish of him it replaces (another week's, one he came with) is named too: one wish a player
    const pin = wishPin(P, id, g), was = asksOf(P).find((q) => q.id === pin.id && JSON.stringify(q.must) !== JSON.stringify(pin.must));
    const taken = [...new Map([...bringInTakes(P, id, g, bp), ...(was ? [was] : [])].map((q) => [q.id, q])).values()], what = withTaken(P, pin.label, taken);
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

/** A bring-in's other sales: [{out, in}] (buyPlan's one `fund`). */
const fundsOf = (bp) => (bp.fund ? [bp.fund] : []);
/** What transfer m (a sale's `out`) frees in GW g on estimate ev: its sale less its buy, £m (below 0 it spends). */
export const freedBy = (ev, g, m) => { const x = ev?.gws.find((s) => s.gw === g)?.moves.find((y) => y.out === m.out); return (x?.sell ?? 0) - (x?.buy ?? 0); };
/** A bring-in's sales as your exact transfers (memory.pinSell): his, then each other sale, marked `funds` only when it
 *  frees money. */
const buyPins = (P, id, g, bp) => [
  pinSell(bp.out, g, P.end, { in: id, label: `${P.L.name(bp.out)} → ${P.L.name(id)} from GW${g}` }),
  ...fundsOf(bp).map((f) => pinSell(f.out, g, P.end, { in: f.in, funds: freedBy(bp.ev, g, f) > 0 ? Number(id) : null, label: `${P.L.name(f.out)} → ${P.L.name(f.in)} from GW${g}` })),
];
/** Your later buy of player `id` (a sale of yours for him after GW g) and the sales that fund it, that GW: [Pin]. Him
 *  from GW g voids that buy (addMove) and leaves its money moves paying for nothing, so they go with it, named. */
/** "Him from GW g" solved as the tap would leave your rules (Add a player's weeks): his wish pin, your later buy of him
 *  and its funding off (laterBuys: the tap takes them back, bringInTakes). → solveFor */
// the rules its tap takes back left out of the solve too (bringInTakes): your later buy of him (laterBuys) and every
// rule his wish clashes with, a Roll of yours in GW g first
export const wishSolve = (ctx, P, id, g, purpose) => solveFor(ctx, [wishPin(P, id, g)], purpose, wishTakes(P, id, g).map((p) => p.id));
/** The rules of yours his wish from GW g takes back, each once: the ones it clashes with, a Roll of yours in GW g first,
 *  and your later buy of him with its funding (laterBuys). wishSolve solves without them and a 'pick' tap drops them
 *  (bringInTakes), so the road it lands is the plan of the rules it leaves. → [Pin] */
const wishTakes = (P, id, g) => [...new Map([...clashing(P, wishPin(P, id, g)), ...laterBuys(P, id, g)].map((p) => [p.id, p])).values()];
const laterBuys = (P, id, g) => {
  // a Free Hit pick is his for that week alone (the squad comes back after it), so your later buy of him stands beside
  // it, as composePins lets both bind; a Wildcard's squad is kept, so him from then voids that buy
  if (squadWeek(weekOf(P, g)) === 'fh') return [];
  const buys = asksOf(P).filter((p) => p.kind === 'sell' && p.in === Number(id) && p.gw > g);
  return [...buys, ...asksOf(P).filter((p) => p.kind === 'sell' && p.funds === Number(id) && buys.some((b) => b.gw === p.gw))];
};
/** movedFrom(P, g) but the players your later buy of `id` and its funding sell (laterBuys: a buy of him from GW g takes
 *  them back, so they are free to sell). */
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
  if (bp?.kind === 'pick') return wishTakes(P, id, g);
  const pins = buyPins(P, id, g, bp);
  const ids = new Set(pins.map((p) => p.id));
  return [...new Map([...pins.flatMap((p) => clashing(P, p)), ...laterBuys(P, id, g)].filter((q) => !ids.has(q.id)).map((q) => [q.id, q])).values()];
}
/** Rules of yours `pins` a tap takes back, said before it in their chips' words (ruleOf): "It removes “Sell Saka from
 *  GW7 for Palmer”, …", '' with none (Add a player's line). */
export const removesText = (P, pins) => (pins.length ? `It removes ${pins.map((q) => `“${ruleOf(P, q).text}”`).join(', ')}.` : '');
/** Him from GW g as Add a player's week button makes him: a solve's road for him (wishSolve) is his wish pin with that
 *  road ('pick': pickOfRoad), in every week as a Wildcard's or Free Hit's always was, so the sale for him and the money
 *  are the solver's and your rules say only "him from GW g" (owner, 2026-10-29: never the sales or buys that fund him);
 *  without a road the phone's buy (buyPlan: his best sale, or with one more that funds it). → buyPlan's shape | null */
export function holdBuy(ctx, id, g, road = null) {
  const P = plan(ctx);
  if (!P) return null;
  return road ? pickOfRoad(ctx, P, id, g, road) : buyPlan(ctx, id, g);
}

/** A week's solve with him in from GW g (wishSolve: his wish pin; in a Wildcard or Free Hit week, in its squad) as a
 *  buyPlan of its own kind, 'pick': that road against your plan (cmp), the hits it takes there more than now; bringIn
 *  makes it his wish pin with that road, so the plan is the solve at once. */
function pickOfRoad(ctx, P, id, g, road) {
  const rw = (road.weeks || []).find((x) => Number(x.gw) === Number(g));
  if (!ids([...(rw?.xi || []), ...(rw?.bench || [])]).includes(Number(id))) return buyPlan(ctx, id, g);
  return { kind: 'pick', in: Number(id), road, cmp: compare(ctx, asYours(ctx, road), { weeks: P.weeks }), hits: Math.max(0, (rw?.hits ?? 0) - (weekOf(P, g)?.hits ?? 0)) };
}

/** GW g with player `id` brought in: the moves your plan doesn't make yet, and the WEEK's transfers and hits in all (a
 *  bp's hits are those he adds, a road's the week's own): road, a solve's GW g; else bp, a buy (buyPlan) as its sale
 *  and funding sales; a chip week's pick, its changes to that squad (`chip`). → {moves, n, hits, chip} | null */
export function weekWith(P, g, { road = null, bp = null } = {}) {
  const chip = squadWeek(weekOf(P, g));
  if (bp?.kind === 'pick' && chip) {
    // a Wildcard or Free Hit week's pick (pickOfRoad): who leaves that week's chip squad for whom, and how many such
    // changes (never the chip's own transfers against the week before)
    const w = (bp.road.weeks || []).find((x) => Number(x.gw) === g);
    if (!w) return null;
    const now = weekOf(P, g)?.squad ?? [], sq = ids([...(w.xi || []), ...(w.bench || [])]);
    const moves = pairedMoves(now.filter((x) => !sq.includes(x)), sq.filter((x) => !now.includes(x)), P.L);
    return { moves, n: moves.length, hits: w.hits ?? 0, chip };
  }
  // (another week's pick: its road's GW g, the solver's transfers there)
  const rd = road ?? (bp?.kind === 'pick' ? bp.road : null);
  if (rd) {
    const w = (rd.weeks || []).find((x) => Number(x.gw) === g);
    if (!w) return null;
    return { moves: pairMovesOf(rd, g, weekOf(P, g)?.moves ?? [], P.L), n: (w.in || []).length, hits: w.hits ?? 0 };
  }
  if (bp?.kind !== 'one' && bp?.kind !== 'two') return null;
  const w = bp.ev.gws.find((s) => s.gw === g);
  return { moves: [{ out: bp.out, in: bp.in }, ...fundsOf(bp)], n: w?.transfers ?? 0, hits: w?.hits ?? 0 };
}

/** How player `id` comes in from GW g in words, every move it makes and then the week's transfers and hit (weekWith):
 *  "Scott → B.Fernandes · Haaland → Thiago · 2 transfers, −4". The one description Add a player shows before the tap
 *  (owner, 2026-10-09). */
export function inWords(P, g, how) {
  const nm = (x) => (x == null ? '—' : P.L.name(x));
  const w = weekWith(P, g, how);
  if (!w?.moves.length) return null;
  const said = (ms) => ms.map((m) => `${nm(m.out)} → ${nm(m.in)}`);
  return [...said(w.moves), w.chip ? COPY.chipChanges(w.chip, w.n) : `${w.n} transfer${w.n === 1 ? '' : 's'}, ${COPY.hitsIn(w.hits)}`].join(' · ');
}

/** Why `id` can't come in from GW g (a buyPlan 'none'), in one line: in your team already, the money even with one more
 *  sale ("Try GW7" only when GW7 fits him), the club limit, every sale kept, or no plan. */
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
/** Him from the later week a money refusal names (fitsLater), exactly the buy the other doors make there (buyPlan 'one'
 *  → bringIn, as Add a player's pill); then every sheet closes and Ahead opens on that week at its top, as theirs do
 *  (the address replaced, no new entry; owner, 2026-10-10). → bool */
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
/** A buyPlan 'none' a solve may still get round with more sales (the money, a club's limit), so Add a player solves it;
 *  any other (in your team, every sale kept) is said at once. */
export const solvesRound = (bp) => bp?.kind === 'none' && ['budget', 'club', 'chip'].includes(bp.problem?.code);

/** " · Saka captain" when GW g's armband is another player's after an edit (A1: an edit never moves it unsaid). */
export const captainMoved = (Q, prev, g) => {
  const c = weekOf(Q, g)?.captain, was = weekOf(prev, g)?.captain;
  return c != null && was != null && c !== was ? ` · ${COPY.captainNow(Q.L.name(c))}` : '';
};

/** "Reset plan" (the You sheet; owner, 2026-10-10; the pitch's pill, 2026-10-21): this GW's plan as a new team's
 *  (memory.reset) and this browser's lineups of the later GWs gone; the bundle's solves stay. At once, its toast with
 *  Undo (both back). → bool */
export function resetPlan(ctx) {
  if (!editable(ctx)) { toastOf(ctx)(OFFLINE_EDIT, 'warn'); return false; }
  const I = info(ctx);
  const lus = clone(lineups(ctx, I)), gone = clone(removedBy(I));
  const prevP = plan(ctx);
  forgetEdit();
  const r = memOf(ctx).reset();
  setLineups(ctx, I, {});
  REMOVED.by = {};  // nothing of yours: no move "removed by you" either (B129)
  flashLanding(ctx, prevP, { gws: I.gws });
  say(ctx, COPY.planReset, undoOf(ctx, subjectOf(COPY.planReset), () => { if (!r.undo()) return false; setLineups(ctx, I, lus); REMOVED.by = gone; }));
  return true;
}
/** Plan view P holds a transfer, chip or rule of yours (any pin but the derived ones: the hold's and Settings → Hits'),
 *  or a move you took off this session ("removed by you"), which Reset plan takes off: the pitch's Reset plan pill
 *  shows (owner, 2026-10-21; 2026-10-26). A lineup of yours alone is Reset lineup's. → bool */
export const planHasYours = (P) => (P?.pins || []).some((p) => !derivedPin(p)) || Object.values(removedBy(P)).some((x) => x.length > 0);

/** Settings → Hits (owner, 2026-10-12): the hits Forkcast may take a week, one setting for every week, its choices [[n,
 *  label]]: None, then each cap up to the solver's own (meta.hit_cap: "−4", "−8"), and the one in force (`at`: memory's
 *  Plan.hitsMax, else the solver's cap; none known, None and −4). */
export function hitsChoices(P) {
  const cap = hitCap(P?.b?.meta);
  const top = cap ?? 1;
  const at = P?.mem?.hitsMax ?? top;
  return { at: Math.min(at, top), choices: Array.from({ length: top + 1 }, (_, n) => [n, COPY.hitsSeg(n)]) };
}
/** Set Settings → Hits to n (an edit: its toast, its verdict against the plan before, Undo; the solver's own cap is no
 *  setting). → bool */
export function setHitsMaxWithUndo(ctx, n) {
  const P = plan(ctx);
  const { at } = hitsChoices(P);
  if (n === at) return false;
  const cap = hitCap(P?.b?.meta);
  const what = COPY.hitsMax(n);
  return edit(ctx, { from: info(ctx)?.A, what, text: vsPrev(ctx, what), hitsMax: cap !== null && n >= cap ? null : n });
}

/** The chip GW g's plan plays when it is a Wildcard or Free Hit ('wc' | 'fh'), else null: such a week says over its
 *  squad what the chip does there (COPY.chipWeek). */
export function chipWeek(P, g) {
  const c = weekOf(P, g)?.chip ?? P?.mem?.chips?.[g] ?? null;
  return c === 'wc' || c === 'fh' ? c : null;
}

/** GW g's transfer mode: 'roll' (Forkcast adds no transfer that GW: the hold's, or a Roll rule, memory.pinRoll: a
 *  suggested plan's +), 'free' (no hits: a cap of 0, Settings → Hits' None or an older plan's pinHits 0), 'h<n>' (at
 *  most n hits, below the default), else 'auto' (no cap: the solver's own default, meta.hit_cap). */
export function gwMode(P, g) {
  // a Roll of yours, or the hold's (no transfer unless you add one: memory.holdOf)
  if (P.pins.some((p) => p.id === `roll:${g}` || (p.id === 'hold' && (p.rolls || []).includes(g)))) return 'roll';
  // a hits rule of GW g (pinHits: an older plan's) is its setting whatever the hold keeps there: a week under a hits
  // rule is the planner's (holdOf), the hold only keeps a player you sell later through it
  const mine = P.pins.some((p) => p.id === `hits:${g}`);
  // a week the hold keeps to your own moves (it holds the squad they make) is still 'roll': Forkcast adds no transfer
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
// Keep undoes (`gone`: "Saka kept in GW8 instead of Palmer"; owner, 2026-10-22: two lines at most; the take's toast
// named it as it was made); the × names it
export const takenBack = (P, pins, gone = []) => {
  const sold = [...pins, ...gone].filter((q) => q?.kind === 'sell').map((q) => Number(q.gw));
  const said = pins.filter((q) => !(isRoll(q) && Number(q.caps?.[q.gw] ?? 0) > 0 && sold.includes(Number(q.gw))));
  return said.length ? { pins, text: COPY.altClash(said.map((q) => plainRule(P, q))) } : null;
};
/** A rule as a toast names it, plainly: a transfer as its move ("Chilwell → Bassey"), a buy as "Saka in", any other as
 *  its chip says it. */
export const plainRule = (P, q) => {
  const nm = P.L.name;
  if (q.kind === 'sell' && q.in != null) return `${nm(q.player)} → ${nm(q.in)}`;
  if (q.kind === 'slide') return `${nm(q.out)} → ${nm(q.player)}`;
  return ruleOf(P, q).text;
};
/** A choice of yours as its row in the plan says it: a transfer as its move and GW ("Scott → Groß · GW6", plainRule),
 *  any other as its chip ("Keep Scott · GW6", "Up to −4 · GW8", "BB · GW9"). */
export const rowName = (P, q) => `${plainRule(P, q)}${(q.kind === 'sell' && q.in != null) || q.kind === 'slide' ? ` · GW${q.gw}` : ''}`;

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

/** A price watch drawn (a GW-A transfer row's details): with `move` {out, in}, that move's line (each player's arrow in
 *  FPL's colours: green rises, red drops) | null; without, the foot: the call to act (or what waiting costs or gains)
 *  and how old FPL's reading is, with a "Hide" when `wait` is given (it puts the watch away) | null. */
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

/** The deadline's words, per deadline (toLocale*String makes a formatter each call, tens of ms on a phone, and the
 *  countdown asks every second). */
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
export const fplOf = (ctx, P, w) => (w?.gw === P.A ? ctx.data?.fpl ?? null : null);
/** The GW whose team FPL's last published picks are, the team fplOf sets GW A against (api/entry.py: the solver's
 *  state_round, the last GW before GW A not played as a Free Hit: FPL gives the squad before it back), or null. */
const fplGw = (P) => {
  const fh = new Set((P.b?.entry?.chips_used || []).filter((u) => u.chip === 'fh').map((u) => Number(u.gw)));
  let s = P.A - 1;
  while (s > 0 && fh.has(s)) s--;
  return s > 0 ? s : null;
};
/** The substitutions that make GW A's pitch of your FPL team `fpl` (fplSets' Week-sheet row): FPL's lineup once week
 *  w's transfers are made there, each buy in his sold player's place (engine.applyLineup), set against the pitch's:
 *  each sub the pitch starts (`on`, pitch order) for a starter the pitch benches (`off`), who takes his place on the
 *  bench as FPL swaps them (the keeper for the keeper); `order` the pitch's outfield subs in its order where it still
 *  differs, else null (pitch.subOrder); `buys` the week's. Pure. → {subs: [{on, off}], order, buys: Set} */
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
/** GW A's lineup as the pitch draws it where it differs from the one set in FPL (owner, 2026-10-21): the players the
 *  cards call "on your FPL bench: the plan starts him" and "starts in your FPL team: the plan benches him" (pitch.js
 *  fplMarks), names in the pitch's order, {start, bench}; null where nothing is left to set in FPL once the week's
 *  transfers are made there (no player changing places, same armbands, same bench order: owner, 2026-10-29), in a later
 *  GW, with no FPL team, or while GW A is under way. Said as a notice of the week line (weekModel), never a mark on the
 *  shirts (owner, 2026-10-09). Its Week-sheet row: the GW that team is for (`gw`: fplGw, FPL's team being the last
 *  deadline's), the substitutions (`subs`: fplSubs; `buy` where one is a buy, said after the transfers), the pitch's
 *  captain and vice where FPL's differ (`captain`, `vice`), the bench order where the subs leave another (`order`) and
 *  the buys by name (`buys`: COPY.setInFplRow). */
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
/** No edit reaches GW g: GW A under way (FPL has it: memory.inkClash judges added pins so); a frozen GW too (isFrozen:
 *  none since Freeze went). */
export const inkAt = (ctx, P, g) => isFrozen(P, g) || (Number(g) === P.A && isLive(ctx));
/** The card's Sell · From GW…: the first week from GW g player `id` can be sold in (still yours going into it, and an
 *  edit reaches it: inkAt), never a Free Hit week (FPL makes no lasting transfer there), or null. */
export const sellWeek = (ctx, P, id, g) => P.gws.find((x) => x >= g && squadBefore(P, x).includes(id) && !inkAt(ctx, P, x) && squadWeek(weekOf(P, x)) !== 'fh') ?? null;
/** The GW taking ask `p` off re-plans from (liftAsk): its own, GW A for one of every week. */
export const liftFrom = (P, p) => Math.max(P.A, num(p.gw) ?? P.A);
/** Taking ask `p` off re-plans GW A under way (liftFrom): FPL has it, so no Remove (Your rules, a rule's sheet, the
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
