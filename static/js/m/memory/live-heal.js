// live.js createMemory: re-plans and heals: the solver asked for your rules' plan

import { detectDrift, madeOn, planOfRoad, sigOf, solvedKey } from './drift.js';
import { SOLVE_KINDS, brokenCells, findRoad, noteAnswer, planValues, ruleText, solveKept } from './values.js';
import { OFFERED_MAX, SOLVED_MAX, TIMING, idsKey, nowS, num, pinsAfter, squadKey, weekAt } from './pins.js';
import { COPY } from '../calls.js';

export function healPart(V) {

  // ---------------------------------------------------------------- planning
  /** Your plan's road for the current pins: a bundle road (or one offered: offer) when one fits, else a heal
   *  (debounced). */
  // (the ?solves=1 panel's words for your plan, under its kind "Your team": the transfers and rules you added, each
  // named; none: no transfers; owner, 2026-11-09, "what means 'your plan / your rules as set' - what my plan, what rules?")
  const healWords = () => { const { S } = V;
    const mine = V.pinsNow().filter((p) => p.id !== 'hold' && p.id !== 'hits');
    return mine.length ? mine.map((p) => ruleText(p, V.lookupNow().name, { start: S.A, end: V.endNow() }).text).join(', ') : COPY.healNone;
  };
  // (your plan answered with no solve of its own, `road` its answer: listed in the panel all the same, ANSWERED)
  const healAnswered = (road) => { try { noteAnswer(keyNow(), { gw: V.S.A, kind: SOLVE_KINDS.heal, what: healWords() }, road); } catch { /* the panel's words only */ } };
  function replan(why = 'pins') { const { S, accNow, composeNow, ctx, emit, ensure, gwsNow, holdNow, lockedNow, markSeen, mutate, pinsNow, receipt, versionNow } = V;
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
    const hit = findRoad(V.model().road, c, gwsNow(), also);
    if (hit) {
      globalThis.__fcTrace?.('plan', hit.key);  // (the QA's solve audit)
      healAnswered(hit);
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
    // (a plan of these rules solved for other GWs is not theirs: 2026-11-02, TORPEDO's plan solved for GW10 alone was
    // kept once the plan was GW10–13 again, one GW tile, GW13 "past your plan")
    const gws = gwsNow().join(','), spans = (p) => (p?.weeks || []).map((w) => Number(w.gw)).join(',') === gws;
    if (!acc && baseNow()?.sig === sig && baseNow().version === v && spans(baseNow())) return;
    if (acc?.plan?.sig === sig && [v, ctx.bundle?.version].includes(acc.plan.version) && spans(acc.plan) && !brokenCells(acc.plan, c).length) {
      // the plan is already the one for these rules (an Undo took the failing one back): nothing to solve. Never one
      // whose squads break them
      healAnswered(acc.plan);
      cancelHeal();
      S.aheadSig = null;
      if (S.error) { S.error = null; emit('plan'); }
      return;
    }
    // a solve of exactly the values the heal would send, asked ahead (offer `values`: ahead.js presolve): its answer at
    // once (owner, 2026-10-26)
    const k = keyNow();
    const got = k && S.offered.v === v ? S.offered.solved.get(k) : null;
    if (got) { globalThis.__fcTrace?.('plan', got.road?.key); healAnswered(got.road); cancelHeal(); took(got, sig, why, true); return; }
    // the plan heal is a user-class solve (api/mobile.py PURPOSES): one per client, a newer one supersedes it.
    // Debounced for an edit; a re-plan of no edit (a team opened, new roads: 'sync') asks at once
    scheduleHeal('heal', { reason: why, now: why === 'sync', ahead: k });
  }
  /** The key (solvedKey) of the solve your pins' heal sends now, or null while it can't be made (no bundle yet). */
  const keyNow = () => { const { ctx } = V; try { return solvedKey(ctx.bundle?.version ?? null, values()); } catch { return null; } };

  /** A solve's answer for your pins as they are (`sig`): its road your plan (a team with no document: keepBase), or its
   *  error said (Plan.error); `ahead`: a solve of exactly these values asked ahead (Plan.ahead). One way for heal and
   *  ask-ahead answers (runHeal, replan, offer). */
  function took(r, sig, reason, ahead = false) { const { S, accNow, ctx, emit, ensure, markSeen, mutate, receipt, versionNow } = V;
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
   *  never a plan found or solved for the rules half changed in between (owner, 2026-10-26). → fn's result */
  function batch(fn) { const { S } = V;
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
   * returned for it (replan), kept on this page alone, so looking at a team writes nothing (editedAt); offered too, so
   * Reset plan lands on it at once. Until it lands there is no plan to draw (getPlan: road null; Ahead waits as for
   * the bake).
   */
  function keepBase(road, v, sig) { const { S, emit } = V;
    S.base = { entry: S.entry, A: S.A, plan: planOfRoad(road, v, sig) };
    S.last = S.base;
    offer(road);
    emit('plan');
  }
  const baseNow = () => { const { S } = V; return (S.base?.entry === S.entry && S.base.A === S.A ? S.base.plan : null); };
  /** The plan the solver returned that this page drew last, for this team and GW A (getPlan's while none is stored). */
  const lastNow = () => { const { S } = V; return (S.last?.entry === S.entry && S.last.A === S.A ? S.last.plan : null); };

  function cancelHeal() { const { S, emit } = V;
    clearTimeout(S.healTimer);
    S.healTimer = null;
    S.queued = null;
    if (S.pending) { S.pending.cancel?.(); S.pending = null; S.healSeq++; emit('heal'); }
  }

  function scheduleHeal(purpose = 'heal', { now = false, reason = 'pins', ahead = null } = {}) { const { S, emit } = V;
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
   * whether a re-plan is your own edit's: asked for by you, or (after a reload, 'sync') for pins the plan wasn't
   * solved for yet. New data alone re-plans a plan already solved for these pins: the pencil diff's "New forecast
   * re-planned these pencil weeks".
   */
  const yours = (why, acc, sig) => why !== 'sync' || acc?.plan?.sig !== sig;

  async function runHeal(purpose, my) { const { S, composeNow, ctx, emit } = V;
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
    }, { what: healWords() });
    if (S.pending) S.pending.cancel = p.cancel;
    try {
      const r = await p;
      if (my !== S.healSeq) return r;
      S.pending = null;
      S.queued = null;
      if (sigOf(composeNow()) !== sig) {
        // your pins changed while it solved and nothing re-planned them (plan memory from another device, arriving with
        // the bundle): a road solved for other pins is never your plan. It is kept as one that may fit again (offer:
        // roadFits decides), and the plan re-plans for the pins as they are now.
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
  function settled() { const { S } = V;
    return new Promise((res) => {
      const check = () => (S.pending && S.pending.state !== 'offline' ? setTimeout(check, 250) : res());
      check();
    });
  }

  /** The solve values of your pins after an edit that drops `drop` (ids) and adds `extra` (pinsAfter), the edit not
   *  made, so its heal asks for the same values. `order`: the edit's own reorder of your rules (ahead.js edit's
   *  inPlace); `hitsMax`: Settings → Hits as the edit leaves it (null: the solver's cap), else as it is. */
  function values({ extra = [], drop = [], order = null, hitsMax } = {}) { const { S, accNow, cctxNow, ownedNow, storedNow, withHits, withHold } = V;
    const after = pinsAfter(storedNow(), { add: extra, drop }, S.A, ownedNow());
    const list = withHits(withHold(order ? order(after) : after), hitsMax === undefined ? num(accNow()?.hits_max) : num(hitsMax));
    const cctx = cctxNow(list);
    if (!cctx) throw new Error('Forkcast memory: no bundle yet');
    return planValues(cctx, list);
  }

  /** A road this page solved for some pins (a chip prepared with your rules; a Wish pill; a plan your pins had before):
   *  replan takes it as your plan when it fits your pins as a bundle road would (findRoad: roadFits), so the edit lands
   *  without a solve. Kept per roads version (the newest few, one per solve key). With `values` (ahead.js presolve: a
   *  tap's solve asked before the tap), the answer of a solve of exactly those values, a road or its error ({road,
   *  error}: only the solver's 'infeasible'), kept apart (SOLVED_MAX): replan takes it only for pins whose heal would
   *  send exactly those values (solvedKey), never for others a road fits (owner, 2026-10-26). */
  function offer(road, { values: vals = null, error = null, version = null } = {}) { const { S, composeNow, versionNow } = V;
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
  function rejudge() { const { S, accNow, cctxNow, ctx, ensure, frozenNow, ideaOf, mutate, pinsNow, roadOf, stamp, versionNow } = V;
    const acc = accNow();
    const version = versionNow();
    const fresh = version && version === ctx.bundle?.version;
    if (!acc?.plan || !fresh) { S.drift = null; return; }
    const sig = `${version}|${V.model().key}|${!!V.model().road}|${madeOn(acc)}|${acc.plan.key}|${acc.plan.version}|${acc.lineup?.captain}|${JSON.stringify(acc.pins?.items?.map((p) => p.id))}`;
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
  return { replan, keyNow, took, batch, keepBase, baseNow, lastNow, cancelHeal, scheduleHeal, yours, runHeal, settled, values, offer, rejudge, round2 };
}
