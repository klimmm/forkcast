// memory.js: the live memory: createMemory

import * as E from '../../plan/engine.js';
import { COPY, planInputs, planFromRoad, compare as compareIn, changeText, transfersOf, withForced, hitCap, FORGET_MS } from '../calls.js';
import { EDIT, FORGET, LOCAL, OFFERED_MAX, SEEN, SOLVED_MAX, TIMING, USED, carryPins, changesGwA, clone, composePins, deadlinePassed, frozenClash, frozenOnOf, frozenSince, frozenWeeks, heldAt, ids, idsKey, inkRepair, isRoll, kindOf, makePin, nowS, num, pinConflicts, pinVeto, pinsAfter, range, roadWeek, rollKeeps, squadInto, squadKey, weekAt, withBank } from './pins.js';
import { brokenCells, bundleRoads, findRoad, forcedHits, holdOf, idleRules, planValues, ruleText, solveKept } from './values.js';
import { detectDrift, freshOf, isNews, journalRows, madeOn, movesChanged, normalizeAccepted, pencilChanges, planOfRoad, sigOf, solvedKey } from './drift.js';
import { statePart } from './live-state.js';
import { healPart } from './live-heal.js';
import { apiPart } from './live-api.js';

// ================================================================ the live memory

export const blankAccepted = (roadsV, dataV = roadsV, hold = false) => ({ hold,
  at: nowS(), roads_version: roadsV ?? null, data_version: dataV ?? null, roads_taken: [], pins: { must_have: '', exclude: '', items: [] },
  plan: null, lineup: null, chip: null, verdicts: [], locked_at: null, notes: [],
});
/** When you last changed a document (epoch s; 0: no choice of yours in it): the latest of its plan's start
 *  (accepted.at) and the times its rules (pins.items[].at) and calls (roads_taken[].at) were made. Never the server's
 *  updated_epoch (every PUT stamps it) nor an automatic re-save (a re-plan, inkRepair's lock, idleRules' clean-up, a
 *  carry-over): those are no use of the team (owner, 2026-10-22). Nor the notes: rejudge writes 'kept' ones on new data
 *  alone. A change that stamps nothing (a lineup, Hits, a rule taken off) reads as the edit before it: USED counts it. */
export function editedAt(doc) {
  const a = doc?.accepted;
  if (!a) return 0;
  return Math.max(0, num(a.at) ?? 0, ...(a.pins?.items || []).map((p) => num(p?.at) ?? 0), ...(a.roads_taken || []).map((t) => num(t?.at) ?? 0));
}
export const ROADS = (entry) => `fc:mem:roads:${entry}`;
export const ARCHIVE_VERSIONS = 3;

/** A memory for one page (attach() keeps the one the app uses; tests make their own). ctx: the shell's ctx. */
export function createMemory(ctx) {
  // the parts' view of this function's scope (live getters) and the parts' functions, by their own names
  const V = {
    get S() { return S; },
    get accMemo() { return accMemo; }, set accMemo(v) { accMemo = v; },
    get accNow() { return accNow; },
    get archiveRoads() { return archiveRoads; },
    get baseNow() { return baseNow; },
    get cancelHeal() { return cancelHeal; },
    get capFor() { return capFor; },
    get cctxNow() { return cctxNow; },
    get composeNow() { return composeNow; },
    get ctx() { return ctx; },
    get emit() { return emit; },
    get endNow() { return endNow; },
    get ensure() { return ensure; },
    get flushSoon() { return flushSoon; },
    get frozenNow() { return frozenNow; },
    get getPlan() { return getPlan; },
    get gwsNow() { return gwsNow; },
    get holdNow() { return holdNow; },
    get ideaOf() { return ideaOf; },
    get intoNow() { return intoNow; },
    get lastNow() { return lastNow; },
    get loadLocal() { return loadLocal; },
    get local() { return local; },
    get lockedNow() { return lockedNow; },
    get lookupNow() { return lookupNow; },
    get markSeen() { return markSeen; },
    get mutate() { return mutate; },
    get op() { return op; },
    get ownedNow() { return ownedNow; },
    get pinsNow() { return pinsNow; },
    get receipt() { return receipt; },
    get rejudge() { return rejudge; },
    get replan() { return replan; },
    get roadByKey() { return roadByKey; },
    get roadOf() { return roadOf; },
    get round2() { return round2; },
    get saveLocal() { return saveLocal; },
    get scheduleHeal() { return scheduleHeal; },
    get setPins() { return setPins; },
    get stamp() { return stamp; },
    get store() { return store; },
    get storedNow() { return storedNow; },
    get subs() { return subs; },
    get versionNow() { return versionNow; },
    get withHits() { return withHits; },
    get withHold() { return withHold; },
  };
  const { cctxNow, versionNow, gwsNow, endNow, accNow, holdOn, holdNow, capFor, storedNow, withHold, withHits, pinsNow, frozenNow, lockedNow, composeNow, ownedNow, intoNow, lookupNow, getPlan, transferInForce, weekState, emit, roadByKey, roadOf, archiveRoads, saveLocal, loadLocal, flushSoon, flush, samePlan, mutate, op, ensure, stamp, setPins } = statePart(V);
  const { replan, fitRoads, keyNow, took, batch, keepBase, baseNow, lastNow, cancelHeal, scheduleHeal, yours, runHeal, settled, values, offer, rejudge, round2 } = healPart(V);
  const { ideaOf, keepMine, adoptDrift, inkOf, inkClash, changesLiveA, addPin, clashText, dropPins, removePin, reset, setHitsMax, setLineup, setPlan, heal, compare, evalOf, lite, noteEdit, claimEdit, receipt, restorePins, pencilDiff, markSeen, forecastChange, loadAll, journal, unused, onData, syncPlan, carryOver } = apiPart(V);
  const S = {
    entry: null, A: null, doc: null, docs: null, dirty: false, seq: 0, inflight: null, flushTimer: null,
    drift: null, judged: null, pending: null, healTimer: null, healSeq: 0, queued: null, error: null, carried: null, notice: null,
    offered: { v: null, roads: [], solved: new Map() }, reopened: null, base: null, last: null, batch: null, aheadSig: null,
  };
  const subs = new Set();
  const store = ctx.store;
  const local = ctx.api.local;
  /** S.doc's accepted, normalised (normalizeAccepted), memoised per document and roads version. */
  let accMemo = { doc: undefined, v: undefined, acc: null };

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
    inkOf, inkClash, addPin, removePin, restorePins, batch, setHitsMax, reset, setLineup, setPlan, values, offer, heal, settled, compare,
    // whether a solve of exactly these values was offered (offer `values`): ahead.js presolve asks it no more
    solved: (vals) => S.offered.v === versionNow() && S.offered.solved.has(solvedKey(ctx.bundle?.version ?? null, vals)),
    pencilDiff, markSeen, forecastChange, keepMine, adoptDrift, journal, noteEdit, claimEdit,
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
/** Sign-out, by you or after FORGET_MS away: the page's memory lets go of the team (timers and heal stop, unsent
 *  changes are dropped; the next screen to attach makes a fresh one) and the team's choices go (forget). → forget's
 *  promise */
export function release(api, entry) {
  const m = current;
  current = null;
  return forget(api, entry, m?.detach());
}

const forgetting = new Map();  // entry → its forget under way
/**
 * The one way a team's choices go (owner, 2026-10-14, 2026-10-22): every GW document the server keeps of it for this
 * browser written back as Reset plan leaves one (accepted and ticket none; the server has no delete), once a save
 * already sent (`after`) has landed. Until the server has them all, the team is marked here (FORGET): a sign-in before
 * that loads it as Reset plan leaves it and tries again (onData). This device's mirror of it (document, seen plan,
 * edit receipt, roads archive) goes at once. The solves stay cached; the recent chips keep the team. →
 * Promise<boolean>: whether the server has forgotten
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

/** The drift toast's action, "Use it" / "Re-plan with your rules" (ahead.driftSay; adoptDrift), with Undo. */
export function switchWithUndo(ctx = attach()?.ctx) {
  const d = attach(ctx).getPlan().drift;
  const r = attach(ctx).adoptDrift();
  if (r.refused) return;
  // today's best ignores a rule of yours (or the hold): the plan stays on them, re-planned on today's forecast (never
  // "switched")
  ctx.ui.toast(COPY.driftDone(d), 'ok', { action: { label: 'Undo', onClick: () => r.undo() } });
}
