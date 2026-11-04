// ahead/plans.js: a week's suggested moves: the bake's roads' moves that week, a place's asked buys

import { baseline, compare, draftOf, estimate, movedFrom, pairedMoves, removedAt, squadBefore, weekOf } from '../core.js';
import { barred, buyCandidates, keptFrom } from '../edits.js';
import { addYours, extraWeek, owedAt, pairChanged, pinOfMove, wishWeeks } from '../presolve.js';
import { inkAt } from '../buys.js';
import { squadWeek } from '../pieces.js';

// ---------------------------------------------------------------- the hold: your team, the model's moves as suggested plans

/**
 * The model's single moves for GW g on your plan (under the hold, memory.holdOf; both modes, owner 2026-10-13): every
 * move the bundle's roads make in GW g (never one they plan later: owner, 2026-11-02) that GW g's squad on your plan can make, each measured as that move added
 * to your plan in GW g (addMove's ≈) against your plan: {out, in, cmp {delta, label}, model (the model's own plan
 * makes it in GW g)}. Every one that fits, losers too, before your first transfer of the week as after (owner,
 * 2026-10-21); once your plan uses the week's free transfers (extraWeek) the number is after the −4. Under the hold,
 * one the 2026-10-18 bars keep from being the week's suggestion is `early` (earlyOf): listed after the passing ones,
 * never lit, + quiet (litOf, plPays). Never a move of yours or one touching a player your plan moves from GW g on
 * (movedFrom), nor one your rules forbid (a buy kept out, a sale of a Keep then or later: pinOf). None for GW A under
 * way (inkAt). In a week Forkcast re-picks, a move is measured as the plan makes it (addYours): `instead` of that
 * transfer ({gw, out, in}), `hit` (its number is after the hit). Once per plan view and GW.
 */
const SUGGESTIONS = new WeakMap();
const SUGGEST_TRIES = 3;   // a sale's buys measured for a place you opened (bestOf: buyCandidates' order)
export function suggestionsOf(ctx, P, g) {
  if (inkAt(ctx, P, g) || !weekOf(P, g)) return [];
  let by = SUGGESTIONS.get(P);
  if (!by) SUGGESTIONS.set(P, (by = new Map()));
  // (the places you opened are part of it: a player's × asks his sale, below)
  const asked = placesAsked(P, g), at = `${g}|${asked.join(',')}`;
  if (by.has(at)) return by.get(at);
  const w = weekOf(P, g), squad = w.squad, into = squadBefore(P, g);
  const no = barred(P, g);
  const mine = movedFrom(P, g, true);
  const kept = keptFrom(P, g);
  const d0 = draftOf(ctx);
  const before = baseline(ctx, g);
  const hitsAt = (ev) => ev.gws.find((x) => x.gw === g)?.hits ?? 0;
  // a move you took off this session is still offered, as yours (`removed`)
  const gone = removedAt(P, g);
  const fits = (m) => into.includes(m.out) && squad.includes(m.out) && !squad.includes(m.in) && !mine.has(m.out) && !mine.has(m.in) && !no.has(m.in) && !kept.has(m.out);
  // (null where the week can't make it)
  const measured = (m) => {
    const r = addYours(ctx, P, g, m.out, m.in, d0);
    return r.problem ? null : { ...m, r, cmp: compare(ctx, r.ev, before) };
  };
  const out = [];
  const push = ({ r, ...m }) => {
    const removed = gone.has(`${m.out}>${m.in}`);
    // (barred, keptFrom hold from GW g on, so next week too)
    const early = earlyOf(ctx, P, g, [m], r.ev, before, d0);
    out.push({ ...m, instead: r.instead, hit: hitsAt(r.ev) > hitsAt(before), ...(early ? { early } : {}), ...(removed ? { removed: true } : {}) });
  };
  for (const m of modelMoves(P, g, { now: true }).values()) {
    const x = fits(m) ? measured(m) : null;
    if (x) push(x);
  }
  // sale o's best buy of the few his money pays for (buyCandidates' order, as Replace's ownAltsOf), measured → [x] | []
  // (no engine top-up of the week's own moves since owner, 2026-11-02: the solver's, refusal by refusal, refusalRoads)
  const pool = new Map(), bank = w.bank ?? 0;
  const buysOf = (pos) => pool.get(pos) ?? pool.set(pos, buyCandidates(P, { pos, from: g, limit: 80 })).get(pos);
  const bestOf = (o) => {
    const room = bank + (P.L.price(o) ?? 0) + 1e-6;
    const tries = buysOf(P.L.pos(o)).filter((id) => (P.L.price(id) ?? Infinity) <= room).slice(0, SUGGEST_TRIES).map((id) => ({ out: o, in: id, model: false }));
    return tries.filter(fits).map(measured).filter(Boolean).sort((a, b) => b.cmp.delta - a.cmp.delta).slice(0, 1);
  };
  // a player whose × you tapped (askPlace) and no move here sells: his best sale (`asked`), his place's alone, never
  // a suggestion of the week (plansOf: its card and its other buys; owner, 2026-11-02: every card's × opens his place)
  for (const o of asked.filter((a) => !out.some((x) => x.out === a))) for (const x of bestOf(o)) push({ ...x, asked: true });
  out.sort((a, b) => !!a.early - !!b.early || b.cmp.delta - a.cmp.delta || b.model - a.model);
  by.set(at, out);
  return out;
}

/**
 * The 2026-10-18 bars under the hold (owner: more than 0.05 over your plan): GW g's transfers `ms` (on top of yours;
 * `ev`, `before`, `measure`: addMove's) that don't pass are no suggestion: listed, never lit, + quiet (litOf, plPays).
 * `true`: they gain no more than 0.05 from GW g on; the next GW: the same moves made then are worth no less
 * (waitsAWeek; no words of it on their row, owner 2026-10-29). None off the hold or once GW g's free transfers are
 * used (extraWeek). → true | GW | null (they pass)
 */
export function earlyOf(ctx, P, g, ms, ev, before, d0, measure = null) {
  // (none in a week short of money, owedAt: paying it back is no loss)
  if (!P.mem?.hold || extraWeek(P, g) || owedAt(P, weekOf(P, g))) return null;
  if (compare(ctx, ev, before).delta <= 0.05) return true;
  return waitsAWeek(ctx, P, g, ms, ev, before, d0, measure) ? P.gws.find((x) => x > g) : null;
}

/**
 * Under the hold, whether GW g's transfers `ms` (on top of yours; row `ev` from GW g on your plan d0) are a later
 * week's: the same moves made next week, measured from GW g, are worth no less (owner, 2026-10-18); a row must beat
 * waiting by more than the list's 0.05. Under the hold only, as the suggestions' gain bar (earlyOf): off it a move
 * takes a Forkcast transfer's place (addYours' `instead`). Never once GW g's free transfers are used (extraWeek), nor
 * where the next week takes no sale (a Wildcard or Free Hit week) or can't take these (problem). `before`, `measure`:
 * the row's.
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

/** Every move of the model's plan (P.base: whichever GW makes it; with `now`, GW g's alone: a move it plans for a later
 *  week is never a GW-g suggestion, owner 2026-11-02), and the solver's own moves in a later week of your plan
 *  that a wish of yours makes the planner's (him from then: Add a player's button), the sale that pays for him among
 *  them, so an earlier week offers it too (owner, 2026-10-30), once each: `${out}>${in}` → {out, in, model (the model's
 *  own plan makes it in GW g)}. Source of suggestionsOf (`now`) and ownAltsOf. */
export function modelMoves(P, g, { now = false } = {}) {
  const pool = new Map();
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

/**
 * The suggested plans, in either mode (owner, 2026-10-11/13): in every GW g you can change (none under way: inkAt), GW
 * g's choices as a fork, one row each: the moves it makes in GW g, none (a roll), or a Wildcard or Free Hit played in
 * GW g (only in its best week past the noise: squadOk; in your chip week each choice takes the chip back: chipBackOf),
 * each with the best plan after it (your other weeks' transfers kept). In a week with transfers of yours the choices
 * are their alternatives (your own is your plan: no row): a roll, another buy for a sale of yours (ownAltsOf), one
 * more move (suggestionsOf). A chip in a later week is that week's own decision, so no follow-up plays one but yours.
 * · the choices: every plan the bundle's roads hold from g on whose weeks before g are yours; a Wildcard and a Free
 * Hit in GW g while you have them and none is planned in their half; your transfers' other buys and the best single
 * moves; then a roll (none where your own GW-g choice is one). Same before your first transfer of the week as after:
 * every single move that fits, losers too (suggestionsOf); with a free transfer left, the best two suggestions' sales
 * with their other buys (ownAltsOf); each move of a pair alone (pairSingles). A pair whose moves the week can make in
 * parts is no choice itself, never one take: its parts are, or none where the budget can't hold them (splitOf, owner
 * 2026-10-25). Transfer choices asked at most FORK_MAX besides a move you removed; none whose GW-g moves can't be made
 * on your plan (fitsAt) but a pair's move that needs the pair's other sale (`needs`: listed, never asked, + off).
 * `early` ones (earlyOf): never lit, + quiet (plPays), asked last;
 * · each choice's plan: the best known one (highest number; Forkcast's best follow-up, never drawn) of the road plans
 * that keep your other weeks (planOfRoad) and its own solve's (forkValues), asked unless a road solved the whole
 * window from your team with no other chip. While it solves: "planning…", "waiting" or "waiting for your edit's check"
 * (`wait`), no number. A failed or unaskable solve with no road plan keeps its row with the reason (`failed`, why:
 * 'offline' | 'error' (asked again: forkAsk) | 'infeasible' | 'nofit' (under the hold also a choice whose week alone
 * can't be made); a pair's move the week can't make alone: 'needs', `needs` the sales it needs, `problems` all it
 * lacks alone);
 * · its number: its moves and chips made yours on the engine (best XI each week, hits counted) against your plan
 * (baseline): the list's order (the + takes GW g alone: planTake, addPlan); none with a move your rules forbid
 * (barred, keptFrom), a squad without a Keep (keptCells), a player sold twice, a buy back after his last sale of yours
 * (rebought), a misfit (problemOf), or your plan itself;
 * Ready ones best first, then failed, then solving; last, each choice making a move you took off GW g this session
 * (`removed`), never lit, + quiet. Once per plan view and GW (and per landed solve: PAIR.rev).
 * The hold: a row's number is its plan against the roll's, Forkcast's later moves on both sides (owner, 2026-10-19);
 * `alone`: what its + gives, GW g's choice alone. The list carries `ref`, `mine` (rollOf), `refWait` while the roll's
 * plan solves, `full` where its asked transfer choices reached FORK_MAX. `peek`: the list as the solves in stand
 * (forkRead), none asked, let go or kept. `prep`: the next week prepared once the viewed one settles (prepNext),
 * purpose 'pairnext', none let go or kept.
 * → [{state: 'ready', choice, moves: [{gw, out, in}], chips: {gw: chip}, draft, ev, cmp, hits: {gw: n}, road, model,
 * taken?, alone?, full?, fullEv?, vsRoll?, refEv?, refRow?, vsBest?, best?, bestFrom?, vsMine?, rolls?, removed?,
 * early?, placed?} | {state: 'solving', choice, wait, removed?, early?, placed?} | {state: 'failed', choice, why,
 * needs?, problems?, removed?, early?, placed?}] (under the hold `taken`: the week-alone draft `ev` and `alone` are
 * measured on; `draft` the solve's whole plan, `full` / `fullEv` that plan measured; `placed`: a place's other buys
 * you opened: placesAsked)
 */
export const PLANS = new WeakMap();
export const FORK_MAX = 8;
/** The places you opened (openPlace; owner, 2026-10-26): GW g's cards whose other buys the week's choices take beside
 *  FORK_MAX (plansOf), PLACE_ALTS each, until your rules change. */
export const PLACE_ALTS = 3;
/** The choices listed on the pitch and in the Week sheet: ten at most, plus the other buys of places you opened
 *  (plansOf's `placed`). Pure. plans (in order) → those listed */
const MORE_SUGGESTIONS = 10;
export const listedOf = (plans) => { let n = 0; return plans.filter((x) => x.placed || n++ < MORE_SUGGESTIONS); };
const PLACES = { sig: null, at: new Set() };
const rulesSig = (P) => P.pins.map((p) => p.id).join(',');
export const placesAsked = (P, g) => (PLACES.sig === rulesSig(P) ? [...PLACES.at].filter((k) => k.startsWith(`${g}:`)).map((k) => Number(k.slice(k.indexOf(':') + 1))) : []);
/** Card `a`'s place opened in GW g: his other buys asked (plansOf), the week's choices redrawn if it is new → whether
 *  it is. */
export function askPlace(ctx, P, g, a) {
  const sig = rulesSig(P), k = `${g}:${a}`;
  if (PLACES.sig !== sig) Object.assign(PLACES, { sig, at: new Set() });
  if (PLACES.at.has(k)) return false;
  PLACES.at.add(k);
  pairChanged(ctx);
  return true;
}
export const SQUAD_CHIPS = new Set(['wc', 'fh']);
/** Your transfers (each made by a rule of yours: pinOfMove) in the weeks after GW g that aren't a Wildcard's or Free
 *  Hit's squad; every plan from GW g keeps them. → [{gw, out, in}] */
export const ownAfter = (P, g) => P.weeks.filter((w) => w.gw > g && !squadWeek(w))
  .flatMap((w) => w.moves.filter((m) => pinOfMove(P, m)).map((m) => ({ gw: w.gw, out: m.out, in: m.in })));
export const movesSig = (ms) => ms.map((m) => `${m.gw}:${m.out}>${m.in}`).sort().join(',');
