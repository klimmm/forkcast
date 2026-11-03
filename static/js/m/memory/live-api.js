// live.js createMemory: the memory's operations: rules, lineups, drift, documents and the bundle's arrival

import * as E from '../../plan/engine.js';
import { COPY, planFromRoad, compare as compareIn, changeText, transfersOf, withForced, FORGET_MS } from '../calls.js';
import { EDIT, FORGET, SEEN, USED, carryPins, changesGwA, deadlinePassed, frozenClash, frozenOnOf, frozenSince, heldAt, ids, inkRepair, isRoll, kindOf, makePin, nowS, num, pinConflicts, pinsAfter, rollKeeps, weekAt } from './pins.js';
import { freshOf, isNews, journalRows, madeOn, movesChanged, pencilChanges, planOfRoad, sigOf } from './drift.js';
import { forcedHits, idleRules, ruleText } from './values.js';
import { blankAccepted, editedAt, forget } from './live.js';

export function apiPart(V) {
  /** What a drift's new data gains (d.fresh, d.freshLabel) as a journal note's {delta, label}, or null when unknown;
   *  the drift's toast says it too (COPY.driftHead). */
  const ideaOf = (d) => { const { cctxNow, round2 } = V; return (d?.fresh == null ? null : { delta: round2(d.fresh), label: d.freshLabel ?? E.verdictLabel(d.fresh, cctxNow()?.noise ?? 0) }); };

  /** Keep mine (the drift's toast left any way but its action: ahead.driftSay): your plan stays, and the journal notes
   *  what you kept it over: the new idea (ideaOf) when the new best won by it, else what drifted (a player now flagged,
   *  a week over budget). text: the note in other words. */
  function keepMine({ text } = {}) { const { S, ensure, mutate, op, replan, stamp } = V;
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

  /** The drift toast's "Use it" (switchWithUndo): this GW goes back to today's best plan (a picked alternative goes
   *  with it). Your rules stay (RULES_V2): the plan re-plans with them. A locked GW A (ink) is refused unless the new
   *  best keeps it (d.reach). */
  function adoptDrift() { const { S, cancelHeal, ctx, ensure, lockedNow, mutate, op, replan, round2, setPins, stamp } = V;
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
        // ink (an older lock, which the read thaws): the calls and the lock stay (the new best has the same GW A); else
        // a blank plan with your rules
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
  /** GW A under way: when one of `pins` would change it (changesLiveA), {gw: null, text: COPY.live}. A frozen GW never
   *  changes either: a pin that would change one (frozenClash) gives {gw, text} (COPY.frozenEdit). Else null.
   *  inkClash(pins): that text, or null (Ahead asks first). */
  function inkOf(pins = []) { const { S, accNow, ctx, frozenNow, lockedNow, pinsNow } = V;
    const live = deadlinePassed(ctx.bundle?.meta);
    if (!lockedNow() && !live) return null;
    const rp = pinsNow().find((p) => p.id === 'road');
    for (const p of pins) {
      const pin = p?.must ? p : makePin(p);
      // GW A under way (its deadline passed; the bundle keeps it as next until FPL publishes its picks): FPL has its
      // transfers, so no edit changes it; said first, frozen or not
      if (live && changesLiveA(pin)) return { gw: null, text: COPY.live(S.A) };
      const g = lockedNow() ? frozenClash(rp, pin, S.A) : null;
      if (g != null) return { gw: g, text: COPY.frozenEdit(g, frozenSince(frozenOnOf(accNow(), frozenNow()), g).at) };
    }
    return null;
  }
  const inkClash = (pins = []) => inkOf(pins)?.text ?? null;
  /** GW A under way: `pin` would change GW A as the plan has it (its squad after GW A's moves, intoNow(A + 1)): someone
   *  brought in that squad hasn't, someone kept out it has, or a Roll, hits rule or chip of GW A. A Keep of a player it
   *  has, or a rule of a later week, is no change. */
  const changesLiveA = (pin) => { const { S, intoNow } = V;
    const A = S.A, squad = new Set(intoNow(A + 1));
    if (heldAt(pin.must, A).some((id) => !squad.has(id)) || heldAt(pin.excl, A).some((id) => squad.has(id))) return true;
    return (num(pin.gw) === A && (isRoll(pin) || ['hits', 'chip'].includes(kindOf(pin)))) || Object.keys(pin.hits || {}).map(Number).includes(A) || !!(pin.chips && A in pin.chips);
  };

  function addPin(pin, { replace = true } = {}) { const { S, endNow, ensure, intoNow, mutate, op, ownedNow, pinsNow, replan, setPins, stamp } = V;
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

  function clashText(c, p) { const { lookupNow } = V;
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
  function dropPins(a, drop) { const { setPins } = V;
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

  function removePin(id) { const { ensure, mutate, op, pinsNow, replan } = V;
    if (id === 'hold' || (id === 'road' && pinsNow().find((p) => p.id === 'road')?.locked)) return { undo: () => false, refused: true };
    return op(() => {
      mutate((doc) => { if (doc.accepted) dropPins(ensure(doc), (p) => p.id === id); }, 'pins');
      replan('pins');
    });
  }




  /** "Reset plan" (the You sheet; owner, 2026-10-10): this GW's document as a new team's (no rules, no transfers of
   *  yours, nothing frozen or locked, no lineup: accepted and ticket none), this browser's edit receipt and seen plan
   *  gone; the bundle's roads and the ones you were offered stay. The plan re-plans. → {undo} */
  function reset() { const { S, local, mutate, replan } = V;
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
  function setHitsMax(n) { const { ensure, mutate, replan } = V;
    const r = mutate((doc) => { const a = ensure(doc); if (num(n) == null) delete a.hits_max; else a.hits_max = num(n); a.plan = null; }, 'pins');
    replan('pins');
    return r;
  }


  function setLineup(patch = {}) { const { ensure, mutate } = V;
    return mutate((doc) => {
      const a = ensure(doc);
      a.lineup = { ...(a.lineup || {}), ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) };
    }, 'lineup');
  }

  function setPlan(road, { why = 'plan' } = {}) { const { cancelHeal, composeNow, ctx, ensure, mutate, versionNow } = V;
    cancelHeal();
    return mutate((doc) => { ensure(doc).plan = planOfRoad(road, ctx.bundle?.version ?? versionNow(), sigOf(composeNow())); }, why);
  }

  function heal({ purpose = 'heal', now = false } = {}) { const { accNow, getPlan, holdNow, pinsNow, scheduleHeal } = V;
    // (under the hold a team with no document of yours is planned too: keepBase)
    if ((!accNow() && !holdNow()) || !pinsNow().length) return Promise.resolve({ state: 'done', road: getPlan().road });
    return scheduleHeal(purpose, { now });
  }

  function compare() { const { cctxNow, getPlan } = V;
    const cctx = cctxNow();
    const plan = getPlan();
    if (!cctx || !plan.model || plan.source === 'model') return null;
    const mine = planFromRoad(cctx, plan.road, plan.lineup || {});
    const model = planFromRoad(cctx, plan.model);
    return compareIn(cctx, mine.evaluation, model.evaluation);
  }

  // ---------------------------------------------------------------- edit receipts (QA-2)
  /** GW A's lineup and the plan as engine evaluations (calls.planFromRoad): what a receipt compares. */
  const evalOf = (road) => { const { accNow, cctxNow } = V;
    const cctx = cctxNow();
    return cctx && road?.weeks?.length ? planFromRoad(cctx, road, accNow()?.lineup || {}).evaluation : null;
  };
  const lite = (ev) => ev.gws.map((w) => ({ gw: w.gw, xi: w.xi, bench: w.bench, captain: w.captain, chip: w.chip, hits: w.hits, ft: w.ft, used: w.used, points: w.points, moves: w.moves.filter((m) => m.ok).map((m) => ({ out: m.out, in: m.in })) }));
  /** Ahead's edit, healing: what it was, the plan before it and your pins before it; `edit`, the GW it changes first
   *  (the week a reload marks ≈ while its check runs; gw stays GW A). */
  function noteEdit({ what, dir = null, pins = null, edit = null } = {}) { const { S, composeNow, getPlan, local } = V;
    if (!S.entry) return;
    const before = evalOf(getPlan().road);
    local.set(EDIT(S.entry), JSON.stringify({ gw: S.A, edit, what, dir, pins, sig: sigOf(composeNow()), before: before ? lite(before) : null, at: Date.now() }));
  }
  /** Ahead speaks for its own edit (its toast): the receipt is taken, so nothing speaks twice. */
  function claimEdit() { const { S, local } = V;
    const r = S.entry ? local.json(EDIT(S.entry)) : null;
    if (S.entry) local.set(EDIT(S.entry), null);
    S.reopened = null;
    return r;
  }
  /** A heal for the pins of a receipt nobody took landed (`error`: failed): say what the edit did, with Undo, in place
   *  of its pending toast (Ahead raises it again after a reload: Plan.pending.edit). */
  function receipt(sig, error = null) { const { S, cctxNow, ctx, getPlan, gwsNow, local } = V;
    const r = S.entry ? local.json(EDIT(S.entry)) : null;
    if (!r || Number(r.gw) !== S.A || r.sig !== sig) return;
    local.set(EDIT(S.entry), null);
    S.reopened = null;
    const toast = ctx.ui?.toast;
    if (!toast) return;
    const undo = Array.isArray(r.pins) ? { label: 'Undo', onClick: () => restorePins(r.pins) } : undefined;
    // (a failure about your rules said as one; the solver's own, the connection's, in their own words)
    const rules = !error?.code || error.code === 'infeasible' || error.code === 'pins';
    if (error) { toast(rules ? COPY.rulesClash(null, r.what) : error.plain || COPY.unfinished, 'warn', { timeout: 9000, action: undo, replaces: 'pending' }); return; }
    const now = evalOf(getPlan().road);
    if (!now || !r.before) return;
    const cmp = compareIn(cctxNow(), now, { gws: r.before });
    // a hit the plan takes that its rules don't allow is said with it: every such week of the plan now is named (the
    // plan before is a phone evaluation)
    toast(withForced(changeText(r.what, cmp, { dir: r.dir, transfers: [transfersOf({ gws: r.before }), transfersOf(now)] }), forcedHits(getPlan().road, gwsNow())),
      'info', { timeout: 6500, action: undo, replaces: 'pending' });
  }
  /** Your pins back as they were before an edit (a receipt's Undo); the plan re-plans for them. */
  function restorePins(pins) { const { ensure, mutate, op, replan, setPins } = V;
    return op(() => {
      mutate((doc) => { setPins(ensure(doc), pins); }, 'undo');
      replan('pins');
    });
  }

  // ---------------------------------------------------------------- pencil diff (per device)
  function pencilDiff() { const { S, getPlan, local, lookupNow } = V;
    const plan = getPlan();
    if (!S.entry || !plan.road?.weeks) return null;
    const seen = local.json(SEEN(S.entry));
    const sig = `${plan.road.key}|${plan.version}`;
    if (!seen || Number(seen.gw) !== S.A) { markSeen(); return null; }
    if (seen.sig === sig) return null;
    const L = lookupNow();
    return pencilChanges(seen.weeks, plan.road.weeks, S.A, L);
  }
  function markSeen() { const { S, getPlan, local } = V;
    const plan = getPlan();
    if (!S.entry || !plan.road?.weeks) return;
    local.set(SEEN(S.entry), JSON.stringify({ gw: S.A, sig: `${plan.road.key}|${plan.version}`, v: plan.version, src: !plan.hold && plan.source === 'model' ? 'model' : 'yours', weeks: plan.road.weeks.map((w) => ({ gw: w.gw, in: w.in, out: w.out })) }));
  }
  /**
   * On the suggested plan with no rules of yours (source 'model', off the hold): what the new forecast changed in its
   * moves since this device last looked at it (markSeen), when today's best gains on the model's road it was seen on
   * beyond the noise (isNews; that road archived here, else nothing). Under the hold the suggested plans follow the
   * model's best road (the bake's base): what the new forecast changed in that road since then (owner, 2026-10-12) →
   * {version, gwA: GW A's moves in words (movesChanged) | null, pencil: later weeks' (pencilChanges) | null, held} |
   * null.
   */
  function forecastChange() { const { S, cctxNow, getPlan, local, lookupNow, roadByKey, roadOf } = V;
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
  async function loadAll() { const { S, ctx } = V;
    if (!S.entry) return {};
    const out = await ctx.api.request('GET', '/api/m/memory', { query: { entry: S.entry, gw: 'all' } });
    S.docs = out?.docs || {};
    return S.docs;
  }
  async function journal() { const { S, lookupNow } = V;
    let docs = {};
    try { docs = await loadAll(); } catch (e) { if (e?.code !== 'unreachable' && e?.code !== 'timeout') throw e; docs = S.docs || {}; }
    if (S.doc) docs = { ...docs, [S.A]: S.doc };
    const L = lookupNow();
    return journalRows(docs, { nameOf: L.name });
  }

  // ---------------------------------------------------------------- following the shell
  /** A team whose choices have gone unused FORGET_MS: the later of this browser's last use (USED) and your last edit in
   *  its documents (editedAt, any device) is that long ago. No document: nothing to clear. */
  function unused(entry, ...docs) { const { local } = V;
    const last = Math.max(Number(local.get(USED(entry))) || 0, ...docs.map((d) => editedAt(d) * 1000));
    return last > 0 && Date.now() - last > FORGET_MS;
  }
  function onData() { const { S, cancelHeal, capFor, ctx, emit, endNow, ensure, flushSoon, loadLocal, local, lookupNow, mutate, rejudge, replan, saveLocal } = V;
    const b = ctx.bundle;
    if (!b?.entry || !b.meta || !ctx.data) return;
    const entry = String(b.entry.id);
    const A = Number(b.meta.gw);
    let why = 'bundle';
    if (entry !== S.entry || A !== S.A) {
      cancelHeal();
      const kept = loadLocal(entry, A);
      // an edit noted before a reload, its check not landed yet: its receipt, while the heal running is its own
      // (getPlan)
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
    // unused or forgotten (USED, editedAt, FORGET): loaded as Reset plan leaves it (reset), once, before anything reads
    // it. Always written, so a new GW A has a document of its own and nothing carries into it from the GW before
    // (carryOver)
    if (S.wipe) {
      S.wipe = false;
      reset();
    }
    if (S.dirty) flushSoon();
    // an older document's ticket locked in FPL was GW A's ink; one that lost it (a Switch kept the ticket) is mended,
    // and the read thaws that lock again (accNow: normalizeAccepted)
    const fix = S.doc ? inkRepair(S.doc, { A, model: V.model().road, nameOf: lookupNow().name }) : null;
    if (fix) { mutate((doc) => { doc.accepted = fix; }, 'lock'); replan('pins'); }
    // a saved plan's idle hits or Roll rule (Wildcard / Free Hit week, or a hits rule at the solver's default cap)
    // reads without it (normalizeAccepted) and the cleaned document is written back once
    const idle = S.doc?.accepted ? idleRules(S.doc.accepted.pins?.items || [], { from: A, to: endNow(), hitCap: capFor(S.doc.accepted) }) : [];
    if (idle.length) mutate((doc) => { ensure(doc); }, 'pins');
    if (!S.doc && S.carried !== A) carryOver(entry, A);
    const before = S.drift;
    rejudge();
    if (S.drift !== before) why = 'drift';
    syncPlan();
    emit(why);
  }

  /** On new roads, a plan made of pins finds its road again (pencil weeks re-plan freely, §7.7); a stored plan
   *  with no rule left under it (GW A unlocked, its last rule gone) is the model's again. */
  function syncPlan() { const { S, accNow, baseNow, ctx, holdNow, lockedNow, pinsNow, replan, versionNow } = V;
    const acc = accNow();
    if (S.drift || S.pending) return;
    // under the hold with no plan the solver returned for your rules yet (a team you only look at, Reset plan, an older
    // app's phone-made plan: normalizeAccepted), or one on older roads: asked (replan)
    if (holdNow() && !acc?.plan && !S.error && (acc || baseNow()?.version !== versionNow())) { replan('sync'); return; }
    if (!acc?.plan || madeOn(acc) !== versionNow()) return;
    if (!pinsNow().length && lockedNow()) return;
    replan('sync');
  }

  /** A new GW with no plan yet: carry the previous GW's later pins over (once). The note says what carried
   *  (COPY.carried); Plan.carried hands it to Ahead, which says it once (no Undo). */
  async function carryOver(entry, A) { const { S, ctx, endNow, ensure, lookupNow, mutate, replan, setPins } = V;
    S.carried = A;
    let docs;
    try { docs = await loadAll(); } catch { return; }
    if (S.entry !== entry || S.A !== A || S.doc) return;
    const prev = docs[String(A - 1)];
    // to the longest plan's end (meta.reach), not this plan's: a shorter one (Settings → Plan ahead) carries your rules for
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
  return { ideaOf, keepMine, adoptDrift, inkOf, inkClash, changesLiveA, addPin, clashText, dropPins, removePin, reset, setHitsMax, setLineup, setPlan, heal, compare, evalOf, lite, noteEdit, claimEdit, receipt, restorePins, pencilDiff, markSeen, forecastChange, loadAll, journal, unused, onData, syncPlan, carryOver };
}
