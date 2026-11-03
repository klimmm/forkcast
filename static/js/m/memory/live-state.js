// live.js createMemory: the memory's state as derived, stored and mutated

import { COPY, planInputs, hitCap } from '../calls.js';
import { LOCAL, TIMING, clone, composePins, frozenWeeks, ids, makePin, num, range, roadWeek, squadInto, squadKey, weekAt, withBank } from './pins.js';
import { normalizeAccepted, sigOf } from './drift.js';
import { holdOf } from './values.js';
import * as E from '../../plan/engine.js';
import { blankAccepted } from './live.js';

export function statePart(V) {

  // ---------------------------------------------------------------- inputs
  // the plan's inputs, from the bank pins `list` (yours) start from (withBank: a "Bank as FPL shows" rule's), with the
  // model's plan (model: its noise and hit cap)
  const cctxNow = (list = pinsNow()) => { const { ctx, model } = V; return (ctx.bundle?.entry && ctx.data ? planInputs(ctx.bundle, { ...ctx.data, base: withBank(ctx.data.base, list) }, model().road) : null); };
  const versionNow = () => { const { ctx } = V; return ctx.bundle?.version ?? null; };
  const gwsNow = () => { const { ctx } = V; return ids(ctx.data?.horizon ?? ctx.bundle?.meta?.horizon); };
  const endNow = () => { const { S } = V; return gwsNow().at(-1) ?? S.A; };
  const accNow = () => { const { S } = V;
    const v = versionNow();
    if (V.accMemo.doc !== S.doc || V.accMemo.v !== v) V.accMemo = { doc: S.doc, v, acc: normalizeAccepted(S.doc?.accepted, { A: S.A, end: endNow(), roadOf, hitCap: capFor(S.doc?.accepted), hold: holdOn(S.doc?.accepted ?? null) }) };
    return V.accMemo.acc;
  };
  /**
   * The plan holds (holdOf: your team, no transfers unless you add them; Plan.pins carries the derived 'hold' first).
   * A stored accepted.model (the removed switch to the model's plan; owner, 2026-10-19) and a stored hold: false
   * (owner, 2026-10-08) are no choice any more; an alternative taken whole in the older app (an unfrozen road pin) is
   * no longer your plan: its moves are suggestions again (withHold; owner, 2026-10-09). ctx.planDefault 'model'
   * (tests; unset in the app): the model's way unless held.
   */
  const holdOn = (acc) => { const { ctx } = V;
    if ((ctx.planDefault ?? 'hold') !== 'hold') return acc?.hold === true;
    return true;
  };
  const holdNow = () => { const { S } = V; return holdOn(S.doc?.accepted ?? null); };
  /** A hits rule at the solver's default cap is no rule, except under the hold (there it lifts the hold for its GW: the
   *  planner plans that week). */
  const capFor = (acc) => (holdOn(acc ?? null) ? null : hitCap(V.model().road));
  /** Your pins as stored, and with the hold first while the plan holds (withHold: the one list everything composes). */
  const storedNow = () => accNow()?.pins?.items || [];
  const withHold = (list) => { const { S } = V;
    const user = list.filter((p) => p.id !== 'hold');
    if (!holdNow()) return user;
    // under the hold an unfrozen road pin (an alternative taken whole, or an untacked lock) holds nothing of yours:
    // your transfers are your sales and slides
    const mine = user.filter((p) => !(p.id === 'road' && !p.locked));
    const { pin } = holdOf(mine, { A: S.A, end: endNow(), owned: ownedNow() });
    return pin ? [pin, ...mine] : mine;
  };
  /** Settings → Hits below the solver's cap (accepted.hits_max; setHitsMax): a derived pin 'hits' (never stored), at
   *  most that many hits in every GW of the window, composed last so it bounds every per-week cap; after the hold is
   *  derived, so it lifts no week of it. */
  const withHits = (list, most = num(accNow()?.hits_max)) => { const { S } = V;
    const cap = hitCap(V.model().road);
    if (most === null || (cap !== null && most >= cap)) return list;
    return [...list.filter((p) => p.id !== 'hits'), makePin({ id: 'hits', kind: 'hits', label: COPY.hitsMax(most), hits: Object.fromEntries(range(S.A, endNow()).map((g) => [g, most])) })];
  };
  const pinsNow = () => withHits(withHold(storedNow()));
  /** The frozen GWs (frozenWeeks: accepted.frozen; an older document's lock, GW A), ascending. */
  const frozenNow = () => { const { S } = V; return frozenWeeks(accNow(), S.A, endNow()); };  // none: normalizeAccepted thaws them
  const lockedNow = () => frozenNow().length > 0;
  const composeNow = (list = pinsNow()) => { const { S } = V; return composePins(list, { from: S.A, to: endNow() }); };
  /** GW A's squad as the entry has it (the squad going into GW A: a Roll there keeps it). */
  const ownedNow = () => { const { ctx } = V; return ids((ctx.data?.base?.squad || []).map((s) => s.id)); };
  /** The squad going into GW g on your plan as it stands (squadInto): what a Roll's clashes are judged on. */
  const intoNow = (g) => { const { S } = V; return squadInto(roadWeek(getPlan().road), g, S.A, ownedNow()); };
  /** The engine's player lookup over the shell's data (names, positions): every name this memory writes. */
  const lookupNow = () => { const { ctx } = V; return E.playerLookup({ base: ctx.data?.base, players: ctx.data?.players }); };

  // ---------------------------------------------------------------- snapshot
  function getPlan() { const { S, baseNow, ctx, lastNow } = V;
    const acc = accNow();
    const version = versionNow();
    const model = V.model().road;
    const hold = holdNow();
    // your plan is the one the solver returned for your rules (a bundle road that fits, or a heal's: replan), never one
    // the phone evaluates (owner, 2026-10-26). Under the hold, before the first lands, none (Ahead waits for it as for
    // the bake: keepBase). While a change that clears the stored plan is solved (Settings → Hits, "Use it", Reset
    // plan): the last plan the solver returned on this page, lastNow.
    if (acc?.plan?.weeks?.length) S.last = { entry: S.entry, A: S.A, plan: acc.plan };
    const last = lastNow() ?? baseNow();
    const road = acc?.plan?.weeks?.length ? { ...acc.plan, weeks: acc.plan.weeks } : hold ? (last && { ...last, weeks: last.weeks }) : model;
    const c = composeNow();
    const gws = gwsNow();
    const tArm = (acc?.roads_taken || []).find((t) => t.call === 'armband') ?? null;
    const transfer = transferInForce(acc);
    // the receipt of an edit made before a reload (onData) whose check this heal is (the same pins)
    const r = S.reopened;
    const edit = S.pending && r && r.sig === sigOf(c) ? { gw: num(r.edit), what: r.what, pins: r.pins, at: r.at } : null;
    return {
      entry: S.entry, gw: S.A, gws, end: endNow(), version, doc: S.doc, accepted: acc,
      road, model, source: acc?.plan?.weeks?.length || hold ? 'yours' : 'model', stale: !!acc?.plan && acc.plan.version !== version, hold,
      hitsMax: num(acc?.hits_max) ?? null,
      pins: pinsNow(), must_have: c.must_have, exclude: c.exclude, hits: c.hits, chips: c.chips, cash: c.cash,
      taken: { transfer, armband: tArm ? num(tArm.captain) : null }, roads_taken: acc?.roads_taken || [],
      lineup: acc?.lineup ?? null, frozen: frozenNow(), frozenLineups: acc?.frozen_lineups ?? {}, locked: frozenNow().includes(S.A),
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
  function transferInForce(acc = accNow()) { const { S } = V;
    const t = (acc?.roads_taken || []).find((x) => x.call === 'transfer');
    if (!t) return null;
    const rp = (acc.pins?.items || []).find((p) => p.id === 'road');
    const cur = roadByKey(t.road);
    return cur && acc.plan && !rp?.yielded && squadKey(weekAt(cur, S.A)) === squadKey(weekAt(acc.plan, S.A)) ? t.road : null;
  }

  function weekState(gw) { const { S } = V;
    const g = Number(gw);
    if (frozenNow().includes(g)) return 'ink';
    if (g === S.A) return 'next';
    return g > S.A ? 'pencil' : 'past';
  }

  function emit(why) { const { store, subs } = V;
    const plan = getPlan();
    store.set('memory', plan);
    for (const fn of [...subs]) {
      try { fn(plan, why); } catch (e) { console.error('Forkcast memory: a listener failed', e); }
    }
  }

  function roadByKey(key) { const { S } = V;
    if (!key) return null;
    // your own plan taken as the call (an older document's 'yours'): the plan itself
    if (key === 'yours') return S.doc?.accepted?.plan?.weeks?.length ? S.doc.accepted.plan : null;
    // (an older document's taken road: the model's plan, 'base'; its other roads went with the bake, 2026-11-03)
    return key === 'base' ? V.model().road : null;
  }
  /** A road by its taken key for a data version: the model's plan now, else the one this device kept then (modelOn). */
  function roadOf(version, key) {
    if (!version || version === versionNow()) return roadByKey(key);
    return key === 'base' ? V.modelOn(version) : null;
  }

  // ---------------------------------------------------------------- persistence
  function saveLocal() { const { S, local } = V;
    if (S.entry) local.set(LOCAL(S.entry), JSON.stringify({ gw: S.A, doc: S.doc, dirty: S.dirty }));
  }
  /** The mirrored document for (entry, A) → {doc, dirty} | null: unsent
   *  changes, or the last saved document (shown when the server can't be reached; a newer server document replaces it
   *  in onData). */
  function loadLocal(entry, A) { const { local } = V;
    const s = local.json(LOCAL(entry));
    return s && Number(s.gw) === A && s.doc ? { doc: s.doc, dirty: !!s.dirty } : null;
  }

  function flushSoon(ms = TIMING.flush) { const { S } = V;
    clearTimeout(S.flushTimer);
    S.flushTimer = setTimeout(flush, ms);
  }
  async function flush() { const { S, ctx } = V;
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

  /** doc, with its plan the object `prev` holds when they are the same plan (pins or ticket changed, or the saved
   *  echo): a plan is never changed in place, so what Ahead draws from it isn't made again for a copy. */
  function samePlan(doc, prev) {
    const a = doc?.accepted, b = prev?.accepted;
    if (a?.plan && b?.plan && a.plan !== b.plan && JSON.stringify(a.plan) === JSON.stringify(b.plan)) a.plan = b.plan;
    return doc;
  }

  /** Change the document; returns {undo} (it restores the document as it was, if nothing changed since). */
  function mutate(fn, why) { const { S } = V;
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

  /** Run one user action (it may change the document more than once) → {undo}: back to the document before it, while
   *  nothing else has changed it since. */
  function op(fn) { const { S, rejudge, replan } = V;
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
  const ensure = (doc) => { const { S, ctx } = V;
    // the hold is written once the plan is yours to change (an untouched document's default made explicit)
    const hold = holdOn(doc.accepted ?? null);
    doc.accepted = doc.accepted ? normalizeAccepted(doc.accepted, { A: S.A, end: endNow(), roadOf, hitCap: capFor(doc.accepted), hold: holdOn(doc.accepted) }) : blankAccepted(versionNow(), ctx.bundle?.version, hold);
    if (typeof doc.accepted.hold !== 'boolean') doc.accepted.hold = hold;
    return doc.accepted;
  };
  /** Mark the plan as made on roads version v (and the data version it came with). */
  const stamp = (a, v = versionNow()) => { const { ctx } = V; a.roads_version = v; a.data_version = ctx.bundle?.version ?? v; };
  const setPins = (acc, all) => { const { S } = V;
    const items = all.filter((p) => p.id !== 'hold' && p.id !== 'hits');  // derived, never stored (withHold, withHits)
    const c = composePins(items, { from: S.A, to: endNow() });
    acc.pins = { must_have: c.must_have, exclude: c.exclude, items };
  };
  return { cctxNow, versionNow, gwsNow, endNow, accNow, holdOn, holdNow, capFor, storedNow, withHold, withHits, pinsNow, frozenNow, lockedNow, composeNow, ownedNow, intoNow, lookupNow, getPlan, transferInForce, weekState, emit, roadByKey, roadOf, saveLocal, loadLocal, flushSoon, flush, samePlan, mutate, op, ensure, stamp, setPins };
}
