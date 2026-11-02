// ahead/plans.js: plansOf: a week's choices, listed, and the weeks' settling

import * as E from '../../../plan/engine.js';
import { chipName } from '../../../ui.js';
import { COPY } from '../../calls.js';
import { bundleRoads } from '../../memory.js';
import { MINUS, compare, draftOf, flatMoves, isFrozen, ownCount, removedAt, valuesFor, valuesKey, viewOfState, weekOf } from '../core.js';
import { barred, chainOf, chipEdit, keptCells, keptFrom } from '../edits.js';
import { AHEAD, DRY, PAIR, tookCmp, PAIR_HOLD_MS, addYours, aheadAsks, extraWeek, owedAt, owedRoad, ownAltsOf, refusalRoads, pinOfMove, planTakeDraft, presolveWeek, weekOnto } from '../presolve.js';
import { inkAt } from '../buys.js';
import { PREP, PREPS, chipPresolves, chipWeekGain, chipWeekOf, chipsAsked, chipsAvail, clearGain, keptBest, plPays, plannedAt, prepItems, prepKeep, squadWeek } from '../pieces.js';
import { FORK_MAX, PLACE_ALTS, PLANS, SQUAD_CHIPS, earlyOf, movesSig, placesAsked, suggestionsOf } from './suggest.js';
import { byGain, fitOf, fitsAt, forkKey, mineAny, rebought } from './lit.js';
import { FORK_FLIGHTS, asTaken, forkAsk, forkFlights, forkRead, forkValues, measurePlan, planBaseline, planOfRoad, takenBy } from './forks.js';

export function plansOf(ctx, P, g, { peek = false, prep = false } = {}) {
  const w = weekOf(P, g);
  // in both modes: the switch only decides who makes the rest of the plan (owner, 2026-10-13)
  if (inkAt(ctx, P, g) || !w) return [];
  // your Wildcard or Free Hit this week (owner, 2026-10-13): your choice is the chip, its changes its squad's; the
  // alternatives take it back (chipBackOf)
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
  // a choice's moves that the week doesn't make yet
  const unmade = (c) => c.moves.filter((m) => !now.some((y) => sameMove(y, m)));
  const yours = forkKey({ moves: now, chips: chipMine ? { [g]: chipMine } : {} }, g);
  // while Forkcast makes your transfers (the node tests' planDefault 'model') a row's number is its solve's against your
  // plan; under the hold against the roll's (vsRef, below)
  const followed = !P.mem?.hold;
  // a Wildcard row keeps your later weeks as they are (forkValues: the squad its + lands lasts): its plan is always its
  // own solve (a bake road solved with Forkcast's later moves would heal another squad), set against a roll that keeps
  // them too (`held`)
  const heldOf = (c) => !followed && c.chips?.[g] === 'wc';
  const mineFrom = movesSig(mine.filter((m) => m.gw >= g && P.gws.includes(m.gw) && !squadAt(m.gw)));
  const allowed = (p) => {
    // a chip week's changes are the chip's squad, no sale rule of yours: only the other weeks' sales are one per player
    const sold = p.moves.map((m) => m.out);
    return new Set(sold).size === sold.length && !p.moves.some((m) => isFrozen(P, m.gw) || barred(P, m.gw).has(m.in) || keptFrom(P, m.gw).has(m.out));
  };
  // Settings → Hits (P.mem.hitsMax): no plan week takes more hits than it allows or your plan already takes there (bake
  // roads used the solver's cap; fork solves, memory's derived 'hits' pin)
  const most = P.mem?.hitsMax ?? null;
  const hitsAt = (e, x) => e.gws.find((s) => s.gw === x)?.hits ?? 0;
  const withinHits = (m) => most === null || m.ev.gws.every((s) => s.hits <= Math.max(most, hitsAt(before, s.gw)));
  // every player your Keeps hold from g on is in the plan's squad then (keptCells, by the chip played in GW g), as the
  // row's own solve keeps him (forkValues): a chip's changes are no moves allowed sees (planOfRoad leaves them out), so
  // a bake road solved without your rules is never the row's plan when it drops one
  const keptBy = new Map();
  const keepsAll = (m) => {
    const chip = m.chips?.[g] ?? null;
    if (!keptBy.has(chip)) keptBy.set(chip, keptCells(P, g, chip));
    return keptBy.get(chip).every(([id, x]) => m.ev.gws.find((s) => s.gw === x)?.squad.includes(id) ?? true);
  };
  const measured = (p) => {
    // in your chip week a choice without the chip is never your plan (owner, 2026-10-13)
    if (!p || !allowed(p) || (!chipMine && movesSig(p.moves) === mineFrom && !Object.keys(p.chips).length)) return null;
    const m = measurePlan(ctx, P, g, p, asIs, false);
    return m && withinHits(m) && keepsAll(m) && !rebought(P, m.moves, m.ev, ownMoves) ? m : null;
  };
  const exactRoads = g === P.A ? new Set([P.base, P.b.roads?.roll, ...Object.values(P.b.roads?.chip || {})].filter(Boolean)) : new Set();
  const choices = new Map();  // forkKey → GW g's choice {moves, chips}, in the order they are offered
  // never your plan's own GW-g choice (your transfers or chip there; Forkcast's moves there when it makes your
  // transfers; else a roll). A Wildcard or Free Hit row only in that chip's best week of the window, and only where it
  // beats not playing it beyond the noise (owner, 2026-10-12): the best week of the bake's pre-solves (chipBests over
  // chipPresolves), its gain clearGain's; never a week still unknown or one that only ties the next (honestBest,
  // keptBest). Not your rules' preparations (chipPreps). The week line's Chips… plays it in any week (chipsDoor)
  const chipSrc = chipPresolves(ctx);
  const chipBest = chipSrc.best;
  const squadOk = (c) => !SQUAD_CHIPS.has(c.chips?.[g]) || chipWeekOf(P, chipSrc, c.chips[g], g)?.gw === g;
  // under the hold a week you roll offers its roll too, a choice as the others are (the Roll row: the reference the
  // rows count against; its + locks the week, addPlan), until its + has locked it (owner, 2026-10-19)
  const rollOffered = !followed && !now.length && !chipMine && !P.pins.some((p) => p.id === `roll:${g}`);
  // (never one a rule of yours forbids: a Keep of the player it sells, a veto of the one it buys); `e`: the 2026-10-18
  // bars it doesn't pass (earlyOf), kept with its first offer (`early`: forkKey → true | GW)
  const early = new Map();
  // the week's single moves (suggestionsOf; none in your chip week), each its choice with your GW-g transfers
  // (singleOf; in a week Forkcast re-picks, the move takes the place of one of its transfers: addYours' `instead`), and
  // choice c with move m on top (plus: m's sale or buy giving way)
  // (a sale your × asked, `asked`, is its place's alone: below)
  const sales = chipMine ? [] : suggestionsOf(ctx, P, g), singles = sales.filter((y) => !y.asked);
  const singleOf = (x, inn = x.in) => ({ moves: [...now.filter((y) => !(x.instead?.gw === g && y.out === x.instead.out && y.in === x.instead.in)), { gw: g, out: x.out, in: inn }], chips: {} });
  const plus = (c, m) => ({ moves: [...c.moves.filter((y) => y.out !== m.out && y.in !== m.in), { gw: g, out: m.out, in: m.in }], chips: {} });
  // a move m of a choice made alone: the suggestion's choice where it is one (`x`), else your GW-g transfers with it
  const partOf = (m) => { const x = singles.find((y) => sameMove(y, m)); return { x, one: x ? singleOf(x) : plus({ moves: now }, m) }; };
  // the sales of the choice's other moves (`adds`) that pay for m's choice alone (`one`) where the week can't make it
  // alone: the fewest that do, the first by the choice's order (one sale, else two, … else all); none → [move] |
  // undefined
  const fundOf = (m, adds, one) => {
    const others = adds.filter((o) => o !== m);
    const sets = (k, from = 0) => (k === 0 ? [[]] : others.slice(from).flatMap((o, i) => sets(k - 1, from + i + 1).map((r) => [o, ...r])));
    for (let k = 1; k <= others.length; k++) { const by = sets(k).find((os) => fitsAt(ctx, P, g, os.reduce(plus, one), d0)); if (by) return by; }
    return undefined;
  };
  // a choice of two or more GW-g moves besides yours (no chip), in the groups the week can make each alone (owner,
  // 2026-10-25: "Swap both" only for dependent transfers): a move alone where it fits (fitOf: money and a club's room)
  // else with the sales that pay for it (fundOf: a funded pair stays one); with more than one group, each made alone (a
  // merged group of funded moves checked whole too), it splits (`split`: never a row, solve, plate or one take of its
  // own; its groups are the week's choices: pairSingles). Only a choice that keeps your GW-g transfers, each part
  // keeping them too. → [[move]] | null
  const keeps = (c) => now.every((y) => c.moves.some((m) => sameMove(m, y)));
  // a group's choice: your GW-g transfers with its moves
  const groupOf = (gr) => gr.reduce(plus, { moves: now, chips: {} });
  const splitOf = (c) => {
    const adds = unmade(c);
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
  // (`whole`: the solver's own moves for the week under your rules, refusalRoads' root or owedRoad, never split: the
  // week shows what the solver does, its moves one take; owner, 2026-11-02)
  const add = (c, e = null, whole = false) => {
    const k = forkKey(c, g);
    if ((k !== yours || rollOffered) && squadOk(c) && allowed(c) && !choices.has(k)) { choices.set(k, c); if (e) early.set(k, e); const gs = !whole && splitOf(c); if (gs) split.set(k, gs); }
  };
  // the groups of a choice that splits (splitOf) the week doesn't list yet, each its choice ({x: a single's suggestion,
  // c}); none for one that doesn't split, nor a move you removed (yours, listed last)
  const groupsOf = (c) => (split.get(forkKey(c, g)) ?? splitOf(c) ?? []).map((gr) => ({ x: gr.length === 1 ? partOf(gr[0]).x : null, c: groupOf(gr) }))
    .filter((q) => !q.x?.removed && !choices.has(forkKey(q.c, g)));
  // what a choice is expected to gain before its own solve: the chip pre-solve's number, the phone's estimate of its
  // move (suggestionsOf, ownAltsOf), or its bake road's measured one (rankOf): the order its solve is asked and its
  // waiting row drawn in (owner, 2026-10-12)
  const est = new Map();
  const guess = (c, v) => { if (Number.isFinite(v)) { const k = forkKey(c, g); est.set(k, Math.max(est.get(k) ?? -Infinity, v)); } };
  const known = new Map(), seen = new Set();  // forkKey → the road plans of that choice, measured
  const rankOf = (k) => Math.max(est.get(k) ?? -Infinity, ...(known.get(k) ?? []).map((p) => p.cmp?.delta ?? -Infinity));
  // under the hold a road's GW-g transfers on top of yours meet the suggestions' bars (owner, 2026-10-18): more than
  // 0.05 over your plan, the week alone measured as its + takes it, and more than made next week (earlyOf). Not once
  // the week's free transfers are used (extraWeek), in your chip week, for a chip's choice, nor for one that changes a
  // transfer of yours. One that doesn't pass is offered after the single moves that do (`late`)
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
  // a road's choice of two or more GW-g moves besides yours, no chip: a pair. The model's own is offered at once;
  // another road's (`pairs`) only after the week's best two single moves and each listed pair's moves alone, best
  // first, while the week's transfer choices have room (owner, 2026-10-21)
  const pairLike = (c) => !Object.keys(c.chips).length && unmade(c).length >= 2;
  const pairs = [];
  // a week your plan leaves short of money (owedAt): Forkcast's way to pay it back (owedRoad), offered at once like the
  // model's own (owner, 2026-10-28); else the solver's moves refusal by refusal (refusalRoads: the week's best, then
  // the best once its sale is kept or its buy kept out, two refusals ahead; one, the best alone, for a week prepared
  // ahead), each offered at once (owner, 2026-11-02)
  const owed = owedAt(P, w) ? owedRoad(ctx, P, g, { peek, prep }) : null;
  // (read here; asked after the roll's and the rows' own solves, below: rolling's count first)
  const depth = prep ? 0 : 2, tree = owed || followed ? [] : refusalRoads(ctx, P, g, { peek: true, depth });
  const solverRoads = new Set([owed?.road, ...tree.map((n) => n.road)].filter(Boolean));
  // (your GW-g transfers' own plan, the reference `yours` counts against, where a solver road makes no move beside
  // them: that road, never a fork of its own; owner, 2026-11-02, at most 6 solves after an action)
  const selfRoads = new Map();
  // (the solver's own roads first: a choice it and a bake road both make is counted from its solve, as what it counts
  // against (the roll, a keep) is: one kind of solve on both sides; 2026-11-02, a bake road against the keep's read
  // Murillo → Hill −0.03 where the solver's own read it best)
  for (const r of [...solverRoads, ...bundleRoads(P.b.roads)]) {
    const x = planOfRoad(ctx, P, r, g, d0);
    if (!x) continue;
    if (solverRoads.has(r) && forkKey(x.choice, g) === yours && !selfRoads.has(yours) && x.plan) {
      // (your plan itself where its later moves are yours too, else the plan it is, Forkcast's later moves counted)
      const own = !chipMine && movesSig(x.plan.moves) === mineFrom && !Object.keys(x.plan.chips).length, m = own ? null : measurePlan(ctx, P, g, x.plan, asIs, false);
      if (own || m) selfRoads.set(yours, { road: r, m });
    }
    const whole = r === tree[0]?.road || r === owed?.road;
    if (whole) split.delete(forkKey(x.choice, g));
    if (!choices.has(forkKey(x.choice, g))) {
      const e = earlyAt(x.choice);
      if (e) late.push({ c: x.choice, e }); else if (r !== P.base && !solverRoads.has(r) && pairLike(x.choice)) pairs.push(x.choice); else add(x.choice, null, whole);
    }
    const s = x.plan && `${movesSig(x.plan.moves)}|${JSON.stringify(x.plan.chips)}`;
    if (!s || seen.has(s)) continue;
    seen.add(s);
    const m = measured(x.plan);
    const k = forkKey(x.choice, g);
    // (a solver road of your plan's, refusalRoads' or owedRoad's, solved on your plan as it stands: its GW-g choice
    // exactly, in any week; never solved again as a fork)
    if (m && !heldOf(x.choice)) known.set(k, [...(known.get(k) ?? []), { ...m, road: r, model: r === P.base, exact: exactRoads.has(r) || solverRoads.has(r) }]);
  }
  // a Wildcard and a Free Hit this week when you have them (never crowded out), none planned in their half; add keeps
  // it only in its best week (squadOk)
  for (const chip of chipsAvail(P, g).filter((c) => SQUAD_CHIPS.has(c))) {
    if (plannedAt(P, chip, g) == null) { const c = { moves: [], chips: { [g]: chip } }; add(c); guess(c, (keptBest(P, chipSrc, chip, g) ?? chipBest[chip])?.delta); }
  }
  // your transfers' other buys (best two each), then the best single moves on top of yours (transfer choices asked at
  // most FORK_MAX; a pair's move the week can't make alone, `needs`, is asked nothing), then a roll
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
      if (!choices.has(k)) add(c, earlyAt(c));
      // (a place you opened: each buy it deals is its own, one the week listed too: asked, never held back as the
      // week's own suggestion)
      if (!cap && choices.has(k)) placed.add(k);
      guess(c, a.cmp?.delta);
    }
  };
  // your GW-g transfer m with another buy
  const swapIn = (m, inn) => ({ moves: now.map((x) => (x === m ? { ...x, in: inn } : x)), chips: {} });
  // (none in your chip week: suggestionsOf's moves are on its squad, which goes with the chip); a move you took off
  // this session after them, whatever their count, its solve asked after theirs (no estimate: rankOf); yours, never
  // crowded out
  const single = (x) => {
    const c = singleOf(x);
    add(c, x.early);
    if (!x.removed) guess(c, x.cmp?.delta);
  };
  const offered = singles.filter((y) => !y.removed && !y.early);
  // a choice that splits offers its groups (groupsOf) in the room it would have taken, or none where the ask budget
  // can't hold them all → whether it could
  const offerGroups = (c) => {
    const gs = groupsOf(c);
    if (plain() + gs.length > FORK_MAX - 1) return false;
    for (const q of gs) { if (q.x) single(q.x); else add(q.c, earlyAt(q.c)); }
    return true;
  };
  // the roads' choices offered at once (the model's own) that split: their groups first, before your transfers' other
  // buys and the best two take the room
  for (const c of [...choices.values()]) if (split.has(forkKey(c, g))) offerGroups(c);
  for (const m of now) otherBuys(m, (inn) => swapIn(m, inn));
  // while the week has a free transfer, the best two suggestions (asked first: litOf lights the best single), then each
  // one's sale with its other buys, as your transfer's are once taken (owner, 2026-10-21), then the rest that pass the
  // bars
  const leads = extra ? [] : offered.slice(0, 2);
  for (const x of leads) if (room()) single(x);
  // each move of a pair alone, as a single move is (owner, 2026-10-21): the suggestion's choice where it is one
  // (singleOf), else your GW-g transfers with it (plus), asked while the week's transfer choices have room (FORK_MAX).
  // One the week can't make alone (fitOf: money or a club's room comes from the pair's other sale) is listed, no solve
  // asked: `needs` the sales that make it fit, `problems` all it lacks without them, its + off as a failed row's. None
  // for a pair that doesn't fit or a move you removed. Asked after the pair and the week's best two (`pairOf`), as is
  // one listed already; never one of those two
  const leadKeys = new Set(leads.map((x) => forkKey(singleOf(x), g)));
  // a pair's moves, each alone: [{m, x (its suggestion), one (its choice), k}] (none: a pair that doesn't fit, a
  // removed move, the week's best two)
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
    // a choice that splits is never one take (owner, 2026-10-25): each group a choice of its own first, a single as any
    // single, a funded group one choice with your GW-g transfers (its place's card "Swap" takes both), in the room the
    // choice itself would have taken. Where the ask budget (FORK_MAX) can't hold them all none is offered: the whole
    // can't be one take, and a part alone would offer the plan's moves as if the rest weren't worth making
    if (split.has(forkKey(c, g)) && !offerGroups(c)) return;
    // its moves the week can make alone first, then those that need another of its sales (funded, or the dead row): a
    // funded choice never takes the room a move alone needed
    const parts = partsOf(c).map((p) => ({ ...p, fit: choices.has(p.k) ? null : fitOf(ctx, P, g, p.one, d0) }));
    for (const { m, x, one, k, adds, fit } of [...parts.filter((p) => !p.fit || p.fit.ok), ...parts.filter((p) => p.fit && !p.fit.ok)]) {
      if (choices.has(k)) { if (!pairOf.has(k)) pairOf.set(k, forkKey(c, g)); continue; }
      if (fit.ok) {
        if (!room()) continue;
        if (x) single(x); else add(one, earlyAt(one));
      } else {
        const by = fundOf(m, adds, one);
        if (!by) continue;
        // the move with just the sales that pay for it, a choice of its own solved as any pair (owner, 2026-10-22), in
        // the dead row's place while the week's choices have room, or already offered; else (the pair's own sales all:
        // nothing new) the dead row as before (no room taken)
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
  // the other roads' pairs, best first by road-plan number, each only with room for its moves alone after it (those
  // fitOf lets the week make alone; one needing the pair's other sale takes none)
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
  // too: your transfer's with that buy in its place, else his best single move's (suggestionsOf) with another buy, the
  // asked sale of a player no suggestion sells (his ×) first; none where no buy fits (a Keep of him, his money). Theirs alone: its place's cards and the Week sheet's rows, never a plate, the
  // corner or the week's best, so opening a place moves nothing else on the pitch (owner, 2026-10-29)
  const listed = new Set(choices.keys());
  for (const a of placesAsked(P, g)) {
    const m = now.find((y) => Number(y.in) === a), x = m ? null : sales.find((y) => Number(y.out) === a && !y.removed);
    if (m) otherBuys(m, (inn) => swapIn(m, inn), ownAltsOf(ctx, P, w, m, true).slice(0, PLACE_ALTS), false);
    else if (x) otherBuys(x, (inn) => singleOf(x, inn), [...(x.asked ? [x] : []), ...ownAltsOf(ctx, P, w, x, true).slice(0, PLACE_ALTS)], false);
  }
  // (what those places added, and nothing listed after them: the roll below is the week's own)
  const placeOnly = new Set([...choices.keys()].filter((k) => !listed.has(k)));
  // a roll: your GW-g transfers (or your chip) taken back; never where it would be your plan itself (add)
  const roll = { moves: [], chips: {} };
  add(roll);
  // under the hold every row counts against rolling, Forkcast's best moves after it on both sides (owner, 2026-10-19):
  // the roll's plan (the reference) and your own GW-g transfers' (what every other row takes back: vsMine, rollOf),
  // each solved first, a row or not
  const rollK = forkKey(roll, g);
  // in your Wildcard or Free Hit week your chip's plan too, solved as its row was (owner, 2026-10-22): the week line's
  // number is the pitch token's, your chip against the week's roll plan (chipWeekGain)
  const chipOwn = chipMine ? { moves: [], chips: { [g]: chipMine } } : null;
  const refs = new Map(followed ? [] : [[rollK, roll], ...(now.length && !chipMine ? [[yours, { moves: now, chips: {} }]] : []), ...(chipOwn ? [[yours, chipOwn]] : [])]);
  // a row that sells a player a transfer of yours bought before g counts against rolling with him free from g too, as
  // its + leaves your rules (chainOf: that transfer's hold ending at g − 1). `ends`: the sales whose holds that roll
  // ends
  const endsOf = (c) => (SQUAD_CHIPS.has(c.chips?.[g]) ? [] : c.moves.filter((m) => m.gw === g));
  const refKeyOf = (c) => {
    if (heldOf(c)) return `${rollK}|held`;
    const ids = [...chainOf(P, g, endsOf(c)).chain.keys()].sort();
    return ids.length ? `${rollK}|${ids.join(',')}` : rollK;
  };
  // (only for a choice that can be made: none is asked for a row that is never listed)
  if (!followed) for (const c of [...[...choices].filter(([k]) => !split.has(k)).map(([, c]) => c), ...(chipOwn ? [chipOwn] : [])]) { const k = refKeyOf(c); if (!refs.has(k) && fitsAt(ctx, P, g, c, d0)) refs.set(k, heldOf(c) ? { ...roll, held: true } : { ...roll, ends: endsOf(c) }); }
  // a Wildcard you could play here that the week lists no row of (Chips…: chipOf) counts against the held roll as its
  // row would (owner, 2026-10-22): asked after the week's choices, never a row (no solve where you roll the week)
  const heldK = `${rollK}|held`, wcRow = { moves: [], chips: { [g]: 'wc' } };
  const apart = !followed && !refs.has(heldK) && chipMine !== 'wc' && chipsAvail(P, g).includes('wc') && plannedAt(P, 'wc', g) == null
    && fitsAt(ctx, P, g, wcRow, d0) ? [[heldK, { ...roll, held: true }]] : [];
  // owner, 2026-10-26 (fhland): under the hold a Wildcard or Free Hit row's squad is the plan Chips…'s tap lands, your
  // rules' preparation of it (prepItems: chipEdit's values, memory.offer), asked as the row's own `land` solve where
  // Chips… hasn't prepared it yet, never a solve of its own that picks another squad. Not in a week with your
  // transfers: the row's + takes them back and the preparation keeps them (planTake's `gone`), so its + lands neither
  const landOf = (c) => {
    const chip = c.chips?.[g];
    if (followed || now.length || c.moves.length || !SQUAD_CHIPS.has(chip)) return null;
    const it = prepItems(ctx, P).find((x) => x.chip === chip && x.gw === g);
    if (it) return it;
    const e = chipEdit(P, g, chip), values = valuesFor(ctx, e.pins, e.drop);
    return { chip, gw: g, values, key: valuesKey(P, values) };
  };
  // …and a Free Hit the week lists no row of, or one whose row is its preparation (landOf), its own solve (`fhLater`:
  // Forkcast's later moves after it, which Chips…, its toast and its row count it on, as the week line does once
  // played: chipApart, `ours`)
  const fhK = forkKey({ moves: [], chips: { [g]: 'fh' } }, g), fhRow = { moves: [], chips: { [g]: 'fh' } }, fhLater = `${fhK}|later`;
  // (a Free Hit's later weeks solved only once Chips… was opened on g: chipsAsked)
  if (!followed && !chipMine && (!choices.has(fhK) || landOf(choices.get(fhK))) && chipsAvail(P, g).includes('fh') && plannedAt(P, 'fh', g) == null && chipsAsked(ctx).includes(g) && fitsAt(ctx, P, g, fhRow, d0)) apart.push([fhLater, fhRow]);
  // (a road solved for exactly this choice before one of other rules that makes it too, whatever the phone measures:
  // 2026-11-02, the roll's own road and a slide's, Murillo kept to GW11 and Hill from GW12, both GW10's roll; the
  // slide's measured more and the roll counted on it drew Murillo → Hill +2.8 until the keep's road came in, +1.9)
  const ready = (list, c) => { const ex = list.filter((p) => p.exact); return { ...(ex.length ? ex : list).sort(byGain)[0], state: 'ready', choice: c }; };
  // a reference whose solve makes no move your plan doesn't is your plan itself (never a row: L1)
  // (`counts`: its own solve's road, where it was solved, for the solver's own count against it: countRoad)
  const self = (c, counts = null) => ({ state: 'ready', choice: c, self: true, moves: [], chips: c.chips, draft: d0, ev: asIs, cmp: compare(ctx, asIs, asIs), hits: {}, road: null, model: false, ...(counts ? { counts } : {}) });
  // each choice's solve, unless a road solved it exactly; a fork in flight that this view no longer asks is let go (L5;
  // a choice that splits: none)
  const asks = [...new Map([...choices, ...refs, ...apart])].filter(([k]) => !split.has(k)).flatMap(([k, c]) => {
    if (c.held && !now.length && !chipMine) return [{ k, c, roads: [], same: true }];  // rolling, your later weeks as they are: your plan
    // (a pair's move the week can't make alone: its row, no solve)
    if (!fitsAt(ctx, P, g, c, d0)) return needs.has(k) ? [{ k, c, roads: [], need: needs.get(k) }] : [];
    const land = choices.has(k) ? landOf(c) : null;
    if (land) return [{ k, c, roads: [], land, ask: { key: land.key, values: land.values, gw: g, ...(prep ? { prep } : {}) } }];
    if (selfRoads.has(k)) return [{ k, c, roads: [], counts: selfRoads.get(k) }];
    // (…its root not in yet: it waits for it, asked below, rather than a solve of its own beside it)
    if (k === yours && k !== rollK && refs.has(k) && tree[0] && !tree[0].road && !prep) return [{ k, c, roads: [], root: true }];
    const roads = known.get(k === fhLater ? fhK : k) ?? [];
    if (roads.some((p) => p.exact)) return [{ k, c, roads }];
    // (a week prepared ahead, prepNext: its best alone, refusalRoads' root. Owner, 2026-11-02: "no action in any week
    // can trigger more than 6 solves after it ... nothing is greyed out after any choice made")
    if (prep) return [];
    const values = forkValues(ctx, P, g, c), key = valuesKey(P, values);
    // a transfer choice of the week's own, not the solver's (refusalRoads' roads answer theirs exactly: known), nor
    // what a choice counts against (refs), nor a place you opened: listed once solved (a road kept, or its solve in
    // flight), never asked, so an action asks only the solver's moves and nothing waits on the rest
    if (!refs.has(k) && !placeOnly.has(k) && !placed.has(k) && c.moves.length && !Object.keys(c.chips).length && !forkRead(key) && !forkFlights().some(([, f]) => f.key === key)) return [];
    return [{ k, c, roads, ask: { key, values, gw: g } }];
  });
  // (stable: choices with no estimate keep their offered order; those the bars keep from being the week's suggestion go
  // after the rest, so a lit-able choice never waits behind one; a pair's move alone after the rest of its pair's kind)
  // (a part of a choice that splits is asked as a single move: its choice is asked nothing)
  const tier = (k) => (early.has(k) || (early.has(pairOf.get(k)) && !split.has(pairOf.get(k))) ? 2 : 0) + (pairOf.has(k) && !split.has(pairOf.get(k)) ? 1 : 0);
  asks.sort((x, y) => tier(x.k) - tier(y.k) || rankOf(y.k) - rankOf(x.k));
  let letGo = false;
  // (the later weeks' flights of this plan view stay: their preparation, prepNext, or their own draw's; every later
  // week since owner, 2026-10-28)
  if (!peek && !prep) AHEAD.at = { P, g };
  for (const [lane, f] of peek || prep ? [] : forkFlights()) {
    if (asks.some((a) => a.ask?.key === f.key) || f.key === owed?.key || f.root || tree.some((n) => n.key === f.key) || (f.P === P && f.gw > g && !f.ahead) || aheadAsks(f, P, g)) continue;
    f.cancel?.();
    if (lane) FORK_FLIGHTS.delete(lane); else PAIR.flight = null;
    letGo = true;
  }
  // a week whose flight was let go draws "checking…" from no flight: every memo goes (this draw asks its own), so going
  // back to it asks again
  if (letGo) PLANS.set(P, (by = { rev: ++PAIR.rev, gw: new Map() }));
  // (chip plan p on plan r's later weeks: a Free Hit's week alone, its squad reverting after; a Wildcard's plan as it
  // is; chipApart's and a prepared row's on its own solve's)
  const chipOn = (chip, r, p) => (chip === 'fh' ? { ...r, chips: { [g]: chip }, draft: weekOnto(r.draft, p.draft, g) } : p);
  const solveOf = ({ k, c, roads, ask, same, need, land, counts, root }) => {
    if (same) return self(c);
    if (counts) return counts.m ? ready([{ ...counts.m, road: counts.road, model: false, exact: true }], c) : self(c, counts.road);
    if (root) return { state: 'solving', choice: c, wait: 'flight' };
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
  // (its root now, beside the rows; the refusals ahead once the week has settled, below: background work never beside
  // what you wait on)
  if (!peek && !owed && !followed) refusalRoads(ctx, P, g, { prep, depth: 0 });
  // (the Roll row of a week you roll stays where rolling, Forkcast's later moves after it, is your plan itself: no move
  // after it)
  const out = asks.filter((a) => choices.has(a.k)).map((a) => solved.get(a.k)).filter((x) => x && (!x.self || rollOffered));
  // your team as it is (the hold): what a row's + gives is GW g's choice alone on your plan as it stands
  // (planTakeDraft: `taken`), measured as your plan is (measurePlan: `alone`, the total's change; `ev`, the weeks it
  // draws), its best known plan with Forkcast's later moves kept as `full` / `fullEv`. One the week alone can't make
  // fails
  const alone = (x) => {
    if (followed || x.state !== 'ready') return x;
    const draft = planTakeDraft(ctx, P, g, x.draft, flatMoves(x.draft).filter((m) => m.gw === g));
    const m = measurePlan(ctx, P, g, { ...x, draft }, before);
    return m ? { ...x, taken: draft, ev: m.ev, alone: m.cmp, full: x.cmp, fullEv: x.ev } : { state: 'failed', choice: x.choice, why: 'nofit' };
  };
  // a row's number (`cmp`) is its plan against the roll's, Forkcast's later moves on both sides; the roll's own row
  // (`refRow`) is the reference: no number, its + solid only when its own plan beats the best other row's past the
  // noise (`vsBest`, that row `best`). While the roll's plan solves the rows wait for it; with none (failed, or rolling
  // can't be made: fitsAt) each is what its + gives (`alone`). In a week with your transfer, Wildcard or Free Hit each
  // row is also set against your own choice (`vsMine`: its + solid only when it beats that too). The Roll row of a week
  // you roll (`rolls`: rollOffered) locks the week as a roll (addPlan)
  const ref = followed ? null : solved.get(rollK) ?? null;
  const ours = solved.get(yours)?.state === 'ready' ? solved.get(yours) : null;
  const yoursToo = ours && yours !== rollK ? ours : null;
  // a row's own roll (refKeyOf), the plain one where its own failed
  const refOf = (c) => { const r = solved.get(refKeyOf(c)); return r && r.state !== 'failed' ? r : ref; };
  const own = refs.has(yours) && yours !== rollK && !chipMine ? solved.get(yours) : null;  // your own transfers' plan (a week of yours)
  // the road a row is counted against (ownCount: the solver's own count over GW g's window; owner, 2026-10-28): its
  // own, else, where it is your plan, its own solve's (`counts`), else your plan's road where it is of these data
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
    // (vsMine by what its + gives, the week alone against your plan, where both keep your later weeks: in a chip week,
    // a Wildcard row, or when your transfers' plan failed) (the solver's own count over GW g's window where both sides
    // are solved roads carrying it: ownCount; your plan's own road where set against your plan)
    const vsMine = chipMine || (now.length && (heldOf(x.choice) || !yoursToo)) ? ownCount(ctx, x.alone, x.road, yourRoad, g)
      : yoursToo ? ownCount(ctx, compare(ctx, x.fullEv, yoursToo.ev), x.road, countRoad(yoursToo), g) : null;
    // decision K (owner, 2026-10-25: compare the points to the transfer made, not to rolling): in a week of yours the
    // number shown (order, plates, cards, rows, toast) is `vsMine`, what the choice changes on your plan as it stands
    // (in place of your transfer −0.2 there, a 2nd transfer what it adds); a week with none of yours, your plan the
    // roll. There the rows count against your plan, not the roll: the roll that takes yours back is a choice as any,
    // its number yours turned round (`refRow` only with none of yours)
    return { ...x, cmp: vsMine ?? ownCount(ctx, compare(ctx, x.fullEv, r.ev), x.road, countRoad(r), g), refEv: r.ev, refRoad: countRoad(r), vsRoll: true, refRow: !vsMine && forkKey(x.choice, g) === rollK, ...(vsMine ? { vsMine } : {}) };
  };
  const rolls = (x) => rollOffered && !x.choice.moves.length && !Object.keys(x.choice.chips).length;
  // a choice whose + makes again only what you took off GW g this session (every move of it your plan doesn't make
  // there sells a player one of your removed moves sold and buys one of the removed buys: sales and buys pair by
  // position), whichever road or move offers it, is yours: `removed`. One touching anyone else beside it is another
  // plan, offered as it comes (owner, 2026-10-22)
  const gone = [...removedAt(P, g)].map((k) => k.split('>'));
  const goneOut = new Set(gone.map(([o]) => o)), goneIn = new Set(gone.map(([, i]) => i));
  const yoursAgain = (x) => {
    const adds = x.choice.moves.filter((m) => m.gw === g && !now.some((y) => sameMove(y, m)));
    return adds.length > 0 && adds.every((m) => goneOut.has(String(m.out)) && goneIn.has(String(m.in)));
  };
  const all = out.map(alone).map(vsRef).map((x) => (rolls(x) ? { ...x, rolls: true } : x)).map((x) => (placeOnly.has(forkKey(x.choice, g)) ? { ...x, placeOnly: true } : x)).map((x) => (yoursAgain(x) ? { ...x, removed: true } : x))
    // (a row numbered by the solver's own count that beats the roll is no early one: its window counts making it next
    // week instead, so a count past the 0.05 bar says now; owner, 2026-10-28)
    .map((x) => (early.has(forkKey(x.choice, g)) && !(x.cmp?.count && x.cmp.delta > 0.05) ? { ...x, early: early.get(forkKey(x.choice, g)) } : x))
    .map((x) => (placed.has(forkKey(x.choice, g)) ? { ...x, placed: true } : x));
  const done = all.filter((x) => x.state === 'ready');
  // the Roll row against the hardest of: the best transfer row's plan (Forkcast's later moves on both sides) and the
  // best Wildcard row's (your later weeks kept on both: its held roll) → {vsBest, best, bestFrom (the Roll side's
  // plan)}; never one the 2026-10-18 bars keep from being the week's suggestion (`early`); by the solver's count where
  // it carries one (ownCount)
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
  // (a move you removed in its rank, "removed by you" its words alone)
  const list = ranked;
  // the two plans your week's transfer row sets side by side (rollOf): the roll's and your own choice's, each with
  // Forkcast's later moves; `pending` while either solves (the row says so, never the week alone)
  if (ref?.state === 'ready') Object.assign(list, { ref, mine: ours });
  // (the roads weekRollOf counts these two by, as the rows are: ownCount)
  Object.assign(list, { mineRoad: yourRoad, countRoad });
  // …in your Wildcard or Free Hit week your chip's plan against its own roll (refOf: a Wildcard's keeps your later
  // weeks, `held`), as the pitch's token set that chip's (weekRollOf's `mineRef`). Its week is your plan's own, the
  // squad its tap landed, as Chips… and its toast counted it (the chip's own solve picks its squad afresh). A Free
  // Hit's week on that solve's later weeks, a Wildcard's your plan as it is (its later weeks yours, as its held roll's)
  const mineRef = chipOwn ? refOf(chipOwn) : ref;
  if (chipOwn && mineRef?.state === 'ready') list.mineRef = mineRef;
  // (a Free Hit's later weeks the roll's where its own solve failed, as chipApart's)
  const onto = chipMine === 'fh' ? ours ?? (solved.get(yours)?.state === 'failed' ? mineRef : null) : mineRef;
  // (your plan as it is: never dropped for a problem of its own, measurePlan's problemOf)
  if (chipOwn && onto?.state === 'ready') { const p = chipOn(chipMine, onto, { draft: d0 }); list.mine = { ...p, ev: asTaken(ctx, P, p.draft, g, {}, false) }; }
  // (and, for the week you view with no transfer of yours, the solver's own plan for it, refusalRoads' root: the
  // week's best is its move, so it never settles on another before it lands. Once you have one there the root only
  // looks for a further move: your numbers stand, nothing waits on it (owner, 2026-11-02: "why it grey out current gw
  // when solving"). A week prepared ahead asks it as a lane frees, never waiting on it)
  list.pending = !followed && ([ref, mineRef, solved.get(yours)].some((x) => x?.state === 'solving') || (!prep && !now.length && !!tree.length && forkRead(tree[0].key) == null));
  // a Wildcard or Free Hit the week lists no row of (not its best week, or planned elsewhere) from a plan of it solved
  // apart (chipSource's road: your rules' preparation, the plan its tap lands), counted against the week's roll plan
  // (owner, 2026-10-22) with the same later weeks on both sides, as the week line counts your chip once played
  // (vsRollOf: weekRollOf's `mine`, `mineRef`). A Free Hit's squad reverts after its week, so its week alone (weekOnto)
  // goes on the later weeks of its own solve (`fhK`), the roll plan's where that failed. A Wildcard's squad lasts: its
  // plan solved against the held roll, your later weeks as they are on both sides (heldOf; `apart` asks it). → {cmp,
  // vs} | {wait: true} (that roll still solves) | null (none, or not a plan of yours: planOfRoad). Once per road
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
    // in a week of yours against your plan, as its row would count (vsRef's `vsMine`): a Free Hit's plan against your
    // transfers' (Forkcast's later moves on both sides), a Wildcard's, or either in your chip week, by what its + gives
    // (`alone`)
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
  // the roll's plan still solving: what the rows count against is not known yet (plansVs says none)
  list.refWait = ref?.state === 'solving';
  // the week's checks (weekKey): the solve of each choice listed, then of each only counted against, or the choice
  // where a bake road answers it exactly, on this bundle (sorted); a take makes other keys, its choice now counted
  // against (yours)
  list.sig = [P.b.version, ...asks.map((a) => `${choices.has(a.k) ? '' : 'ref:'}${a.ask?.key ?? a.k}`).sort()].join('\n');
  // the week's asked transfer choices full (FORK_MAX): a choice offered after it, a pair's move alone among them, isn't
  // listed (the QA's plan-week reads it: q2-pair-singles)
  list.full = !room();
  if (peek || prep) return list;
  by.gw.set(g, list);
  // its taps' solves asked ahead as its choices are checked (presolve), in the lanes its checks leave; the week settled
  // (none checks, nor what its rows count against), the next one prepared
  if (!DRY) presolveWeek(ctx, P, g, list);
  if (settledList(list)) {
    if (!peek && !owed && !followed && depth) refusalRoads(ctx, P, g, { prep, depth });
    prepNext(ctx, P, g);
  }
  return list;
}
/** A week's choices (plansOf's list) settled: none checks, nor what its rows count against. */
export const settledList = (list) => !list.pending && !list.some((x) => x.state === 'solving');
/** The GW after g in the plan's window, or null at its end. */
const nextGw = (P, g) => P.gws.reduce((m, x) => (x > g && (m === null || x < m) ? x : m), null);
/**
 * The next week's choices solved in the background once the viewed week's have settled and its taps solved ahead
 * have landed (owner, 2026-10-22; every later week 2026-10-28 to 2026-11-02, the next alone since): plansOf in `prep`
 * mode (as a draw of GW g + 1 asks), at the lowest priority (purpose 'pairnext': the plan service's SPECULATIVE,
 * unmetered), in the fork lanes forkPump leaves free:
 * the viewed week's forks first in every lane; chip preparations (chipPreps) keep lane 0, one at a time, beside the
 * next week's forks in lanes 1..; lane 0 goes to the next week only once no chip preparation waits. Switching to GW g
 * + 1 draws what landed (FORK_ROADS) and joins the rest in flight; another week lets them go (plansOf's L5).
 */
function prepNext(ctx, P, g) {
  // the next week alone (owner, 2026-11-02: "make only next week prepared after this lands not all 3"; every later
  // week since 2026-10-28 before), once the viewed week's taps solved ahead have landed too (presolveWeek's, `ahead`):
  // never beside what you wait on
  if (forkFlights().some(([, f]) => f.ahead && f.P === P)) return;
  const nx = nextGw(P, g);
  if (nx !== null) plansOf(ctx, P, nx, { prep: true });
}
/** GW g's choices on plan view P, never a solve asked: as plansOf last listed them (its memo), else as the solves in
 *  stand (plansOf's peek), so the same words whichever week is drawn. */
export const plansListed = (ctx, P, g) => {
  const by = PLANS.get(P);
  const got = by?.rev === PAIR.rev ? by.gw.get(g) : null;
  if (got) return got;
  // a peek kept per plan view until a solve lands (PAIR.rev) or a preparation lands (PREP.gen: a Wildcard or Free Hit
  // row is its preparation, plansOf's `land`), so a sheet drawn each second (Chips…: chipShown) peeks once
  let pk = PEEKS.get(P);
  if (!pk || pk.rev !== PAIR.rev || pk.gen !== PREP.gen) PEEKS.set(P, (pk = { rev: PAIR.rev, gen: PREP.gen, gw: new Map() }));
  if (!pk.gw.has(g)) pk.gw.set(g, plansOf(ctx, P, g, { peek: true }));
  return pk.gw.get(g);
};
const PEEKS = new WeakMap();
/** What a choice's number counts against, in words (row, token, tab, plate, card, toast, Why sheet: planSaid,
 *  plNumSaid; Chips…: chipShown): your plan in a week with a transfer of yours or your Wildcard or Free Hit (plansOf
 *  `vsMine`), else rolling under the hold once the roll's plan is in (`vsRoll`), else your plan as it stands
 *  (COPY.planVs). */
export const choiceVs = (P, pl) => (pl.vsMine ? COPY.planVs(true) : pl.vsRoll ? COPY.planVsRoll : COPY.planVs(mineAny(P)));
/** GW w has a transfer of yours or your Wildcard or Free Hit: under the hold its choices count against your plan
 *  (plansOf's `vsMine`, decision K); its plans heading and a place's bar say so (plansVs). */
export const yoursAt = (w) => !!w && (SQUAD_CHIPS.has(w.chip) || w.moves.length > 0);
/** The one Free Hit number (owner, 2026-10-22): Wildcard or Free Hit `c` in GW g as the pitch shows it, its choice
 *  there (plansOf, never a solve asked: plansListed) once ready → {cmp, pays (plPays: its token green), vs (choiceVs)}
 *  | {wait: true} while checked | null (the pitch offers it nowhere that week, or its check failed). Chips…'s number
 *  and best week read this (chipStates). */
export function chipShown(ctx, P, g, c) {
  if (!SQUAD_CHIPS.has(c) || !P.gws.includes(g)) return null;
  const pl = plansListed(ctx, P, g).find((x) => x.choice.chips?.[g] === c && !x.choice.moves.length && x.state !== 'failed');
  return !pl ? null : pl.state === 'ready' ? { cmp: pl.cmp, pays: plPays(pl), vs: choiceVs(P, pl) } : { wait: true };
}
/** The one Wildcard or Free Hit number of GW g under your team as it is (owner, 2026-10-22): the pitch's where it shows
 *  the chip (chipShown), else the plan of it solved apart (`pre`: chipSource's at(c, g)) counted as a row of the week
 *  would be (plansOf's chipOf, never a solve asked: plansListed), on the week's roll plan either way → {cmp, vs, pays?}
 *  | {wait: true} (that plan or the roll plan still checked) | null. Off the hold the pitch's alone. Chips…'s rows and
 *  best week (chipStates) and the chip toast (chipPlan) read this; the week line's (chipWeekGain) uses the same measure
 *  (vsRollOf). */
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
/** GW g of plan view P is the week of the edit the full plan is still checking, the plan before it drawn (the edited
 *  week alone is marked). */
export const approxAt = (P, g) => (P.mark ?? P.approx).has(g);
/** Your week w's transfers against rolling: your plan against the week's roll plan, Forkcast's later moves on both
 *  sides (plansOf's `mine`, `ref` from `listed(g)`: plansListed), as every choice counts (owner, 2026-10-19); null with
 *  none, under ≈, or off the hold. `ev` the roll's plan, `mine` yours. Mount's weekRoll; a × that rolls the week
 *  (removeMove). A Wildcard or Free Hit week (squadWeek): your plan's chip week against its own roll (`mine`,
 *  `mineRef`), the number its token said (chipWeekGain). */
export function weekRollOf(ctx, P, w, listed = (g) => plansOf(ctx, P, g)) {
  const sq = !!squadWeek(w);
  if ((!sq && !w.moves.length) || approxAt(P, w.gw)) return null;
  const L = listed(w.gw) ?? {};
  const ref = sq ? L.mineRef : L.ref;
  const r = ref && L.mine ? vsRollOf(ctx, L.mine, ref, w.gw, L.mineRoad, L.countRoad?.(ref)) : null;
  // (the move you took, its number as its token said it, while your plan is what the take made: tookCmp)
  const took = r && !sq && tookCmp(P, w);
  return took ? { ...r, delta: took.delta, ref: took.ref, shown: took.shown, label: took.label } : r;
}
/** Plan `mine` against roll plan `ref` ({ev, road}), the same later weeks on both sides: the one measure of a week's
 *  number against rolling (weekRollOf: the week line of your transfers, Wildcard or Free Hit; plansOf's chipOf: that
 *  chip in a week your plan doesn't play it, Chips… and its toast), counted as every choice is (ownCount: the solver's
 *  count over GW g's window where roads `a` (mine's) and `b` (the roll's) carry it; owner, 2026-10-29). → compare's {…,
 *  road, ev (the roll's), mine} */
const vsRollOf = (ctx, mine, ref, g, a, b) => ({ ...ownCount(ctx, compare(ctx, mine.ev, ref.ev), a, b, g), road: ref.road, ev: ref.ev, mine: mine.ev });
/** How far a week's listed choices (plansOf's rows) are checked, counted as Add a player counts its weeks
 *  (COPY.checkingWeek): the one now checked, the rows ready or failed + 1, of them all; null once none waits. Pure. →
 *  {i, n} | null */
export function plansWait(plans) {
  // (a place's own cards, a card's × opened: its sheet's wait, never the week's or the pitch's dim)
  const of = plans.filter((x) => !x.placeOnly);
  const n = of.length, done = of.filter((x) => x.state !== 'solving').length;
  return done < n ? { i: done + 1, n } : null;
}
/** How far a week's checks are as its week line and Week sheet say them ("Checking GW8 · 3 of 9 plans": renderLine,
 *  drawWeek): plansWait over the list that settles it (`plans`: plansOf's whole list, not the ten listed), until one of
 *  its choices is lit on the pitch (`lit`: litOf's count). Pure. → {i, n} | null */
export const weekWait = (plans, lit) => (lit ? null : plansWait(plans));
/** The week's notices where they are drawn (renderLine): on the strip the first problem of `notices` (a clash, the
 *  price watch, a new forecast; weekModel's order), " · +N" for the others standing (`more`); GW A's lineup notice
 *  (`quiet`: an instruction that stands, FPL's to do) never on the strip but on the week's status beside the goal, in
 *  every week (statusTok; owner, 2026-10-26); none while GW A is under way (`live`). Pure. → {problem, more, lineup:
 *  its words | null} */
export const lineNotices = (notices, live = false) => {
  const loud = notices.filter((n) => !n.quiet);
  return { problem: loud[0] ?? null, more: Math.max(0, loud.length - 1), lineup: live ? null : notices.find((n) => n.quiet)?.text ?? null };
};
/** A plan's weeks in words, from GW `from` on (moves joined by " + ", the hit "(−4)"; a Wildcard or Free Hit week its
 *  chip's name; a Bench Boost or Triple Captain after the week's moves), each led by its week ("GW7 …"; `tag` false:
 *  not). Pure. → [[gw, text]] for the weeks that do something */
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
/** An engine estimate as a plan planWeeks reads: each week's moves (viewOfState's: those the engine made), chip and
 *  hits. → {moves: [{gw, out, in}], chips: {gw: chip}, hits: {gw: n}} */
const planOfEv = (ev) => {
  const gws = ev?.gws || [];
  return { moves: gws.flatMap((s) => viewOfState(s).moves.map((m) => ({ gw: s.gw, ...m }))),
    chips: Object.fromEntries(gws.filter((s) => s.chip).map((s) => [s.gw, s.chip])), hits: Object.fromEntries(gws.map((s) => [s.gw, s.hits ?? 0])) };
};
/** What a choice's number counts after its week, in its Why sheet: each of the two plans the sheet sets side by side
 *  (`sides`: [[name, ev]], plansOf's `refEv` and `fullEv`, rolling's first), its weeks after GW g in words (planWeeks),
 *  "Rolling: GW9 Saka → Palmer · GW11 Rice → Wirtz"; a plan that makes none, "no transfers". Read-only. Pure. → {head,
 *  lines} | null (neither makes a later move) */
export function countedAfter(P, g, sides) {
  const weeks = sides.map(([name, ev]) => [name, planWeeks(P, planOfEv(ev), g + 1).map(([, t]) => t)]);
  return weeks.some(([, ws]) => ws.length) ? { head: COPY.countedAfter(g), lines: weeks.map(([name, ws]) => COPY.countedLine(name, ws)) } : null;
}
/** A Wildcard or Free Hit choice's changes in its week, for its Why sheet: plan `ev`'s GW-g changes (the chip's squad
 *  against the week before: changeRow), paired as the Week sheet pairs them once its + takes it (viewOfState, `keep`:
 *  your transfers as the rules its + leaves make them, takenKeep), then each player a Keep of yours holds in that
 *  squad, `kept`: as its solve holds him (keptCells: in a Free Hit week only a Keep made for that week). Pure. → [{out,
 *  in} | {in, kept: true}] */
export function squadChanges(P, g, ev, keep = []) {
  const s = ev?.gws.find((x) => x.gw === g);
  if (!s) return [];
  const kept = keptCells(P, g, s.chip ?? null).filter(([id, x]) => x === g && s.squad.includes(id)).map(([id]) => ({ in: id, kept: true }));
  return [...viewOfState(s, P.L, keep).moves, ...kept];
}
/** A lit choice drawn as its place's edges, never a one-tap tab (renderDecks), where its + takes back more than the
 *  player it waits behind: a buy of yours elsewhere, so his place says so ("instead of Palmer": noteOf) before its +.
 *  Your chip in your chip week no longer takes (chipBackOf; owner, 2026-10-25: first click the tab, then Swap inside):
 *  its place says "instead of Free Hit" before its Swap, and the best move there is ink as in any week (owner,
 *  2026-10-26). `a`: the place's player; `e`: its entry (decksOf). Pure. */
export const litEdges = (a, e) => !!e.taken?.some((t) => Number(t.in) !== Number(a));
/** Value `v` kept under key `k` of `map` as its newest, the oldest let go past `max` (an entry used again is kept
 *  longest). → v */
export const keepNewest = (map, k, v, max) => {
  map.delete(k);
  map.set(k, v);
  while (map.size > max) map.delete(map.keys().next().value);
  return v;
};
/** GW g's checks as one key: weekSettled's and settlesAt's, the checks' clock's and the lit fade's (weekModel). The
 *  solves of the week's choices (plansOf's `sig`), so a plan view made anew with the same ones (an Undo, a bundle poll,
 *  a lineup edit) is the same week, one with other solves (an edit's rules, a new forecast) a new one. → string */
const VIEWS = new WeakMap();
let VIEW_N = 0;
export function weekKey(P, g, plans) {
  if (plans?.sig != null) return `${g}|${plans.sig}`;
  if (!VIEWS.has(P)) VIEWS.set(P, `view:${++VIEW_N}`);
  return `${g}|${VIEWS.get(P)}`;
}
/** GW g's choices on plan view P are settled once none of them (`plans`: plansOf's whole list) still checks, the draw
 *  heldOrder re-sorts them in; or once PAIR_HOLD_MS has run since the week's last landing (or this visit's first draw
 *  of it) with one still checking (a fork solve lands in 8–25 s): the landed choices are lit then, the one still
 *  checking keeps its "checking…". From then on, for those checks (weekKey), they stay so (litOf lights them), a failed
 *  check asked again (forkAsk) taking nothing off, a plan view made anew with them too (an Undo to a settled week);
 *  never while a choice waits for your edit's check. `now` for the tests. → boolean */
const SETTLED = { last: null, by: new Map() };  // the week last drawn (weekKey), and weekKey → {settled, done: its rows in, at: its last landing}
const SETTLED_MAX = 64;
export function weekSettled(P, g, plans, now = Date.now()) {
  const k = weekKey(P, g, plans);
  const s = keepNewest(SETTLED.by, k, SETTLED.by.get(k) ?? { settled: false, done: 0, at: now }, SETTLED_MAX);
  const done = plans.filter((x) => x.state !== 'solving').length;
  // a visit's first draw (another week's let its forks go: plansOf's L5), or a landing, starts the bound again; an
  // edit's check that rows wait for (`wait` 'heal': its own toast and clock; its landing is a new plan view) holds it,
  // the week unsettled meanwhile
  const heal = plans.some((x) => x.state === 'solving' && x.wait === 'heal');
  if (SETTLED.last !== k || done > s.done || heal) s.at = now;
  SETTLED.last = k;
  s.done = done;
  if (done === plans.length || now - s.at >= PAIR_HOLD_MS) s.settled = true;
  return s.settled && !heal;
}
/** When GW g's choices on plan view P settle unless one lands first (weekSettled's bound), for tick() to draw them then
 *  (nothing else draws a week whose solve never ends); null once settled or before its first draw. */
export const settleDue = (k) => { const s = SETTLED.by.get(k); return s && !s.settled ? s.at + PAIR_HOLD_MS : null; };
export const settlesAt = (P, g, plans) => settleDue(weekKey(P, g, plans));
