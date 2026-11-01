// ahead/edits.js: an edit: its words, toasts, Undo, its landing and failures

import { fmt, toast } from '../../../ui.js';
import { COPY, changeText, transfersOf, plannerOf, withForced, clockText, waitFact, waitFacts } from '../../calls.js';
import { composePins, pinsDir, switchWithUndo } from '../../memory.js';
import { FLASH, OFFLINE_EDIT, REMOVED, bump, clone, compare, editable, info, lineups, memOf, memPlan, noteRemoved, num, plan, removedBy, sameSet, setFlash, setLineups, viewedGw, weekOf } from '../core.js';
import { DRY, boughtBy, soldBy } from '../presolve.js';
import { plainRule, rowName } from '../buys.js';
import { GO_GW } from '../screen.js';
import { asksOf, ruleOf, windowOf } from './rules.js';

// ---------------------------------------------------------------- edits: rules now, the solver's plan, the verdict

/** The edit being healed: {mem, entry, A, from (chain's first edited GW), prevP (plan before it), text, plain, more,
 *  take (newest edit's own), chain, armed}. */
let OV = null;
/** OV when it is an edit of this page's memory, team and GW A (a released memory takes its edit along), else null. */
export const ovOf = (ctx, I) => (OV && OV.mem === memOf(ctx) && OV.entry === I?.entry && OV.A === I?.A ? OV : null);
/** OV for `chain`, the edits made while the full plan checks them: the newest one's own (the plan before it and its
 *  verdict), its weeks from the chain's first edited GW. */
const ovFor = (ctx, I, chain) => ({ mem: memOf(ctx), entry: I.entry, A: I.A, ...chain.at(-1).own, from: Math.min(...chain.map((c) => c.own.from)), chain, armed: false });

/** The roads version a plan view's road was solved on (the model's road: the roads'), for like-with-like counts. */
const roadVersion = (P) => (P?.mem?.source === 'yours' ? P.mem.road?.version ?? null : P?.mem?.version ?? null);
/** The planner's own count of solved road `road` (roads version v) against plan view prev (calls.plannerOf), when both
 *  solve the same data. */
const plannerVs = (road, v, prev) => (prev?.comparable && v && v === roadVersion(prev) ? plannerOf(road, prev.road) : null);
/** …of plan view Q against prev. */
export const plannerFor = (Q, prev) => (Q?.comparable ? plannerVs(Q.road, roadVersion(Q), prev) : null);
/** Which way pins `before` → `after` move the planner's freedom (memory.pinsDir: 'restrict' | 'relax' | null; a chip,
 *  cash or a change both ways is null). */
const dirOf = (I, before, after) => pinsDir(before, after, { from: I.A, to: I.end });
/** An edit's verdict against the plan before it (calls.changeText: points, and the planner's count where it differs,
 *  read against the way your pins moved: dirOf); `total`: its number as what your total moves by. */
export const vsPrev = (ctx, what, { total = false } = {}) => (Q, prev) => changeText(typeof what === 'function' ? what(Q) : what,
  compare(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }), {
    dir: dirOf(Q, prev.pins, Q.pins), gws: Q.gws, transfers: [transfersOf(prev), transfersOf(Q)], planner: plannerFor(Q, prev), noise: Q.noise, total,
  });
/** An edit's verdict with points and ending (endingOf) even when it lands at once: for an edit whose row leaves the
 *  screen. `total`: vsPrev's. */
export const withPoints = (ctx, what, ending, { total = false } = {}) => (Q, prev) => `${vsPrev(ctx, what, { total })(Q, prev)}${ending(Q, prev)}`;
/** Verdict of a rule that may leave the plan as it is (a Keep of a player it doesn't sell then, a Never of one it
 *  doesn't buy): `same(Q)` when no rule of yours came off (`drop`: ids) and the full plan kept every week's squad and
 *  points, else `changed(Q, prev)`. A Keep words its own weeks ("kept in GW8"). */
export const vsPrevOr = (ctx, same, drop, changed) => (Q, prev) => {
  const kept = !drop.length && Q.weeks.every((w) => sameSet(w.squad, weekOf(prev, w.gw)?.squad ?? []))
    && Math.abs(compare(ctx, { weeks: Q.weeks }, { weeks: prev.weeks }).delta) < 1e-6;
  return kept ? same(Q) : changed(Q, prev);
};

/** The shell's toast (ctx.ui; the node tests a recorder); none while a tap's edit is made dry (DRY: presolve). */
export const toastOf = (ctx) => (DRY ? () => () => {} : ctx.ui?.toast ?? toast);
let lastSay = null;  // the verdict toast on screen: a newer edit replaces it (UX-7)
/** An edit's pending toast while the full plan checks it: {said, toast (its dismiss), text}, for pendingTick. */
let PENDING = null;
export function say(ctx, text, undo, kind = 'info', tag = null, more = [], take = null) {
  // the pending toast is never dismissed first: what follows (verdict, failure, chained edit) changes it in place, so
  // its Undo stays tappable. `more`: actions before Undo ("Try again"); `take`: a take's receipt (addPlan)
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
/** The full plan checks edit `ov`: its receipt (memory.noteEdit: survives a reload) names the whole chain and takes all
 *  back; plus the newest edit's pending toast. */
function checkEdit(ctx, ov) {
  const mem = memOf(ctx), chain = ov.chain;
  mem.noteEdit({ what: chainSaid(chain), dir: dirOf(info(ctx), chain[0].snap.pins, mem.getPlan().pins), pins: chain[0].snap.pins, edit: ov.from });
  pendingSay(ctx, chain);
}
/**
 * Every Undo `say` hands out. `fn` goes back; the plan it brings is marked an Undo's (FLASH.undo) and lands as an
 * edit's does (changedOf); one buttonless toast says "Undone: Groß in your plan" (COPY.undone). If the week on screen
 * shows none of it, the first week it changed is shown (GO_GW) and the toast adds "· GW7". The pending toast goes
 * first. `fn` → false (memory's undo after another change): nothing said; → 'again' (undoNewest remade the edit before
 * it): that edit's toast stays.
 */
export const undoOf = (ctx, words, fn) => () => {
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
export const subjectOf = (text) => text.split(': ')[0];
const PENDING_AGE_S = 5;
/** The pending toast as its check goes on (mount's tick, each second; changes in place): its age after the ellipsis
 *  from PENDING_AGE_S, and while the server is away the wait it is in (pending.state 'offline'). */
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
/** After a reload mid-check: an edit noted before it whose check is the one running (memory's pending.edit) gets its
 *  pending toast again, its Undo restoring your rules from before it (memory.restorePins); its verdict takes this
 *  toast's place (memory.receipt). */
export function pendingAgain(ctx, gp = memPlan(ctx)) {
  const e = gp?.pending?.edit;
  if (!e || ovOf(ctx, info(ctx)) || REOPENED === e.at) return;
  REOPENED = e.at;
  const mem = memOf(ctx);
  sayPending(ctx, e.what, Array.isArray(e.pins) ? () => { mem.claimEdit(); return mem.restorePins(e.pins); } : null, { reopened: true });
}

/** Memory's drift `d` as a toast with one action, "Use it" (memory's switchWithUndo), staying until your next touch;
 *  gone any other way your plan is kept (keepMine). Only while `d` is the drift standing. */
export function driftSay(ctx, d) {
  const standing = () => memPlan(ctx)?.drift?.version === d.version;
  return toastOf(ctx)(d.text, 'info', {
    action: { label: COPY.driftAct(d), onClick: () => { if (standing()) switchWithUndo(ctx); } },
    onDismiss: () => { if (standing()) memOf(ctx).keepMine(); },
  });
}

/** The line every GW (COPY.cheerLine; owner, 2026-10-21): CHEER_KEY(entry) {s: season, gw: GW last said} in this
 *  browser, plus CHEERED, the GW said on this page. */
const CHEER_KEY = (entry) => `fc:cheer:${entry}`;
const CHEER_MS = 8000;
let CHEERED = { local: null, said: null };
/** The bundle's rank.cheer (api/cheer.py) in `el`, under the status bar over the GW tiles (m-ahead.css .ah-cheer;
 *  owner, 2026-10-27: never over the status bar). While it waits (`planning`: a bake, a new forecast's, the forecast
 *  updating; on a first load also the checks after) it shows the wait's lines that fit the panel (app.js factPanel;
 *  owner, 2026-10-29), else the one for its act (calls.waitFact; `act` 0 while planning: your rank's move; 1 while
 *  checking: this line); else this line alone, once per GW and team (CHEER_KEY) for CHEER_MS, while no sheet is open.
 *  Live bundle only. → whether it shows */
export function sayCheer(ctx, P, el, planning = false, act = 0, { linger = false } = {}) {
  const c = P?.b?.rank?.cheer, local = ctx.api?.local, cs = ctx.store.get('conn');
  const show = (on) => {
    clearTimeout(el._cheerT);
    return !!ctx.factPanel?.(el, on ? waitFacts(P.b) : null, on ? waitFact(P.b, planning ? act : 1) : null);
  };
  if (!el) return false;
  if (!c || !local || cs?.snapshot || cs?.state === 'offline') return show(false);
  const k = CHEER_KEY(P.entry), s = P.season, sig = `${P.entry}:${s}:${c.gw}`;
  const was = local.json(k);
  const said = (was?.s === s && was.gw === c.gw) || (CHEERED.local === local && CHEERED.said === sig);
  if (!planning && (said || ctx.sheets?.depth?.())) return el.dataset.planning ? show(false) : !el.hidden;
  // (`linger`: a wait's act said after its wait ended, up for CHEER_MS, surviving the next draw)
  el.dataset.planning = planning && !linger ? '1' : '';
  if (!said) {
    CHEERED = { local, said: sig };
    local.set(k, JSON.stringify({ s, gw: c.gw }));
  }
  const up = show(true);
  if (!planning || linger) el._cheerT = setTimeout(() => show(false), CHEER_MS);
  return up;
}

/** The state an edit can be undone to: memory's pins and plan, Settings → Hits (hitsMax), GW A's lineup, the later GWs'
 *  lineups and the moves you removed. */
export function snapshot(ctx) {
  const I = info(ctx), gp = memPlan(ctx);
  // (road only where it is the plan solved for these rules, so an Undo never stamps an older plan as theirs)
  return { pins: clone(gp?.pins || []), road: gp?.source === 'yours' && !gp.pending && !gp.error ? clone(gp.road) : null, hitsMax: gp?.hitsMax ?? null, lineup: clone(gp?.lineup ?? null), lus: clone(lineups(ctx, I)), removed: clone(removedBy(I)) };
}
/** Memory's derived pins (the hold's, Settings → Hits'): never removed or added by an Undo, made again from the rest. */
export const derivedPin = (p) => p.id === 'hold' || p.id === 'hits';

// (a Roll's caps too: the Undo of a move taken under "No transfers · GW8" brings that back)
const pinSig = (p) => JSON.stringify([p.id, p.must, p.excl, p.max_hits ?? 0, p.hits ?? null, p.chips ?? null, p.cash ?? null, p.funds ?? null, p.caps ?? null]);

/** Undo: memory's pins, plan and lineup back as they were (memory's own undo stops at the next write, a heal landing
 *  included), plus the phone lineups and removed moves. */
export function restore(ctx, snap) {
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
  // the hits setting first (rules then read as made under it); the hold's and the setting's pins are derived from the
  // rest (memory.holdOf, withHits): never removed or added here
  if ((mem.getPlan().hitsMax ?? null) !== (snap.hitsMax ?? null)) mem.setHitsMax(snap.hitsMax ?? null);
  for (const p of mem.getPlan().pins) if (p.id !== 'road' && !derivedPin(p) && (!want.has(p.id) || pinSig(want.get(p.id)) !== pinSig(p))) mem.removePin(p.id);
  const have = new Map(mem.getPlan().pins.map((p) => [p.id, p]));
  for (const p of snap.pins) if (!derivedPin(p) && (!have.has(p.id) || pinSig(have.get(p.id)) !== pinSig(p))) mem.addPin(p);
  // in their order too: a rule Undo brings back sits where it was, not on top
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
    // (never another team's or GW's landing: a switch mid-solve)
    if (!OV?.armed || OV.mem !== mem || OV.entry !== String(gp.entry) || OV.A !== gp.gw) return;
    if (why === 'plan' && !gp.pending) land(ctx);
    else if (why === 'error') fail(ctx, gp.error);
    else if (why === 'heal' && !gp.pending) {
      // a heal with neither a plan nor an error (cancelled or superseded): once its re-plan has had its turn, the edit
      // lands on its rules' plan or says it couldn't finish (Try again); never "Checking…" for ever
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

/** The edit's plan has landed: its verdict. instant: landed in the edit's own tap (a baked or prepared road fitted), so
 *  it says what happened plainly (ov.plain). */
function land(ctx, { instant = false } = {}) {
  const ov = OV;
  forgetEdit();
  bump(ctx);
  const P = plan(ctx);
  setFlash(P, changedOf(P, ov.prevP));
  // landed at once: the edit's words and ending (ov.plain); after a check: its points
  const verdict = instant && ov.plain ? ov.plain : ov.text;
  // a hit the new plan takes that its rules don't allow is said with it, plainly
  const line = withForced(verdict(P, ov.prevP), P.forced, ov.prevP?.forced);
  memOf(ctx).markSeen();  // your own edit is not "new data re-planned your pencil weeks" (§5.5)
  memOf(ctx).claimEdit();  // this toast is its receipt
  // the newest edit's verdict, against the plan before it (ov.prevP); its Undo takes back that one only (undoOf), other
  // actions before it (edit's `more`)
  say(ctx, line, undoOf(ctx, chainSaid(ov.chain.slice(-1)), () => undoNewest(ctx, ov.chain)), 'info', null, ov.more ?? [], ov.take ?? null);
}
/** The weeks plan view Q changes against `prev` (weekChanged): their new transfers and changed cards (changedCards). →
 *  {gws, rows: {gw: [`${out}>${in}`]}, cards: {gw: [id]}} */
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
/** The transfers of week `w` the same week `b` before didn't make. */
const freshMoves = (w, b) => {
  const key = (m) => `${m.out}>${m.in}`;
  const was = new Set((b?.moves || []).map(key));
  return w.moves.map(key).filter((k) => !was.has(k));
};
/** Week `w` changed against the same week `b` before (none: changed): a squad, move, chip, captain or points by 0.05 or
 *  more. Pure. */
export const weekChanged = (w, b) => !b || freshMoves(w, b).length > 0 || w.moves.length !== b.moves.length || !sameSet(w.squad, b.squad)
  || (w.chip ?? null) !== (b.chip ?? null) || w.captain !== b.captain || Math.abs(w.points - b.points) >= 0.05;
/** The struck points of week `w`'s tile (renderRail; owner, 2026-10-26): week `was`'s points (your team as it is:
 *  P.bare, bareRef) where they differ from `w`'s, else null. The week's own forecast, no sign: not a choice's number
 *  (DECISION.md). → string | null */
export const tickWas = (w, was) => {
  const then = was ? fmt.num(was.points) : null;
  return then != null && then !== fmt.num(w.points) ? then : null;
};
/** The window's total as a draw shows it (renderTotal): `tot` the last drawn ({v, before: totals of earlier changes})
 *  or null, `v` this draw's, `undo` an Undo brought it. shift: null, 'back' (an Undo to the total before the change it
 *  takes back) or the change. → {before, shift} */
export function totalShift(tot, v, undo) {
  const before = tot?.before ?? [];
  if (!tot || Math.abs(tot.v - v) < 0.05) return { before, shift: null };
  if (undo && before.length && Math.abs(before.at(-1) - v) < 0.05) return { before: before.slice(0, -1), shift: 'back' };
  return { before: [...before, tot.v], shift: v - tot.v };
}
/** The cards of week `w` differing from the same week `b` before (the landing's pitch tint): players of its XI or bench
 *  in neither, or moved between them, XI first. → [id] */
export function changedCards(w, b) {
  const was = new Map([...(b?.xi || []).map((id) => [Number(id), 'xi']), ...(b?.bench || []).map((id) => [Number(id), 'bench'])]);
  return [...(w.xi || []).map((id) => [Number(id), 'xi']), ...(w.bench || []).map((id) => [Number(id), 'bench'])]
    .filter(([id, at]) => was.get(id) !== at).map(([id]) => id);
}
/** "Groß in and Schade in": the edits of a chain by name (noteEdit's receipt); one edit's own name for its toast. */
const chainSaid = (chain) => {
  const names = chain.map((c) => c.said).filter(Boolean);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? 'Your edit';
};

/**
 * The heal couldn't keep every rule (RULES_V2 §5): the rules stay, the plan stays the solver's last; the toast gives
 * the solver's answer (clashParts) with the choice that broke it; Undo takes back the newest; the Week sheet's status
 * row says the same (clashLine).
 */
function fail(ctx, error) {
  const ov = OV;
  OV = null;
  memOf(ctx).claimEdit();
  bump(ctx);
  const newest = ov.chain?.at(-1);
  const P = plan(ctx);
  const rules = aboutRules(error);
  // the rule that first broke the set stays the one named while it is still yours
  if (!CLASH || !P.pins.some((p) => p.id === CLASH.id)) CLASH = rules && newest?.id ? { id: newest.id, what: newest.what } : null;
  // an edit adding no rule (a removal, Reset plan, "Without …") is named by its own words, then what the remaining
  // rules can't keep
  const c = P ? clashParts(P, CLASH) : { what: null };
  // an edit adding no rule is always named by its own words
  const why = COPY.clashWhy(error?.why, error?.gw);
  const text = !rules ? error?.plain || COPY.unfinished
    : newest?.id ? COPY.rulesClash(c.what ?? null, CLASH?.what ?? newest.what, why) : COPY.dropClash(newest?.said ?? null, c.what, why);
  // a failure not about your choices (the solver's own, the connection's) offers "Try again": the same check at once
  // (memory.heal), the edit armed again; Undo stays beside it
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
/** No edit being healed, no rule named for it. */
export function forgetEdit() { OV = null; CLASH = null; }
/** A heal's error about your choices (no plan keeps them all), not the solver's own or the connection's. */
export const aboutRules = (error) => !error?.code || error.code === 'infeasible' || error.code === 'pins';
/**
 * What the solver couldn't keep, while memory's error about your choices stands: the player its plan dropped
 * (memory.solveKept's error.dropped, the first) as "Groß in GW6", with your choice that holds him then; else the week
 * it found no plan for (the server's error.gw) and your choices there ("your GW9 choices"). `clash`: the choice fail
 * named (CLASH). → {what: string | null, pins: [Pin]}
 */
export function clashParts(P, clash = CLASH) {
  const err = P.mem?.error;
  const asks = asksOf(P);
  const by = asks.find((p) => p.id === clash?.id) ?? null;
  const d = err?.dropped?.[0] ?? null;
  const cell = d && composePins(asks, { from: P.A, to: P.end }).cells.get(Number(d.id))?.get(Number(d.gw));
  const held = cell?.want === 'in' ? asks.find((p) => p.id === cell.pin) ?? null : null;
  const g = num(err?.gw) ?? num(d?.gw);
  const at = (p) => num(p.gw) === g || ((w) => !!w && w[0] <= g && g <= w[1])(windowOf(p));
  const there = !d && g != null ? asks.filter((p) => p !== by && at(p)) : [];
  const what = d && !(by && held === by) ? `${P.L.name(d.id)} in GW${d.gw}`
    : there.length ? COPY.choicesAt(g, there.map((p) => plainRule(P, p))) : null;
  const rest = !what && !by ? asks : [];
  const pins = [by, what ? held : null, ...there, ...rest].filter((p, i, xs) => p && xs.indexOf(p) === i && ruleOf(P, p).removable);
  return { what, pins };
}
/**
 * The Week sheet's status row while memory's error stands (not while an edit is checked): "No plan keeps Groß in GW6
 * with Keep Scott · GW6. Remove one." What the solver couldn't keep (clashParts) with the choice fail named (CLASH),
 * each with a Remove (`pins`); "all of these" when nothing is known. → {text, pins: [Pin]} | null
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
 * One edit: `pins` added to memory (after `drop`, the ids it replaces); rules only. The plan drawn stays the solver's
 * last (the edit's weeks waiting, pending toast "Checking…") until its plan for the new rules lands: at once when a
 * bundle road fits or `road` is offered (memory.offer), else memory heals (one solve); the verdict says when it lands
 * (land) or what the solver couldn't keep (fail). Verdict: `text(Q, prev)`, else `what` with its points as what your
 * total moves by ("total +3.3": withPoints), then `ending(Q, prev)` (endingOf); landed at once, `what` and its ending
 * alone. Nothing goes with it that it doesn't name (RULES_V2 §5). `more`: actions before its Undo; `take`: a take's
 * receipt.
 */
export function edit(ctx, { pins = [], drop = [], road = null, from, text = null, what = null, also = null, inPlace = null, ending = null, taken = [], more = [], take = null, hitsMax }) {
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
  // each edit of a chain still healing keeps its own way back and verdict (undoNewest); under a chain memory holds the
  // plan before the first edit, so this Undo leaves memory to re-plan (restore sets no road)
  const cur = ovOf(ctx, I);
  const here = cur ? { ...snapshot(ctx), road: null } : snapshot(ctx);
  const said = what ?? (pins.length ? ruleOf(I, pins[0]).text : null);
  const verdict = text ?? (ending ? withPoints(ctx, what, ending, { total: true }) : null);
  const plain = text || !ending ? null : (Q, prev) => `${what}${ending(Q, prev)}`;
  const chain = [...(cur?.chain || []), {
    snap: here, id: pins[0]?.id ?? null, what: pins.length ? rowName(I, pins[0]) : null, said, own: { from: f, prevP, text: verdict, plain, more, take },
  }];
  OV = ovFor(ctx, I, chain);
  bump(ctx);
  const mem = memOf(ctx);
  // a transfer the edit's rules make exact (a sale with its buy, a slide: a +, Bring in…, a pick, a move to another
  // week) is yours again, no longer "removed by you"; after the snapshot, so Undo restores the mark
  noteRemoved(I, pins.filter((p) => soldBy(p) != null && boughtBy(p) != null).map((p) => ({ gw: Number(p.gw), out: Number(soldBy(p)), in: Number(boughtBy(p)) })), false);
  also?.();  // a phone-only part of the edit (a lineup reset, removed moves), after the snapshot Undo goes back to
  if (road) mem.offer(road);
  mem.batch(() => {
    if (hitsMax !== undefined) mem.setHitsMax(hitsMax);
    for (const id of drop) if (mem.getPlan().pins.some((p) => p.id === id)) mem.removePin(id);
    for (const p of pins) mem.addPin(p);
    if (inPlace) {
      const now = mem.getPlan().pins, was = here.pins.map((p) => p.id);
      const ordered = inPlaceOf(now, inPlace, was);
      if (ordered.some((p, i) => p !== now[i])) mem.restorePins(ordered);
    }
  });
  OV.armed = true;
  if (!mem.getPlan().pending) landNow(ctx);   // a baked, offered or pre-solved road fitted, or nothing to solve
  // the newest edit's toast at once with its Undo while the full plan solves; the receipt names the whole chain
  // (checkEdit); the verdict changes the toast in place (land, fail)
  else checkEdit(ctx, OV);
  return true;
}

/** The armed edit's plan memory has with no wait: a baked or offered road (`instant`), or the answer of a solve of
 *  exactly its values asked before the tap (memory's Plan.ahead: presolve), said as that heal's would be (land, fail). */
const landNow = (ctx) => {
  const gp = memPlan(ctx);
  if (gp?.ahead && gp.error) fail(ctx, gp.error);
  else land(ctx, { instant: !gp?.ahead });
};

/** The newest edit's toast while the full plan checks it, with its Undo; the verdict replaces it (land, fail). Names
 *  that edit only. */
const pendingSay = (ctx, chain) => sayPending(ctx, chainSaid(chain.slice(-1)), () => undoNewest(ctx, chain));

/**
 * Undo takes back only the newest edit, everywhere (owner, 2026-10-10): the newest of `chain`, by its snapshot. The
 * edits before it are checked again without it: the one before becomes the edit again (OV) with its own Undo. →
 * 'again' then
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

/** Pins `list` with pin `id` back in its place in id order `was` (before the first pin that followed it there and is
 *  still in `list`, else at the end). → [Pin] */
export function inPlaceOf(list, id, was) {
  const p = list.find((x) => x.id === id);
  if (!p || !was.includes(id)) return list;
  const rest = list.filter((x) => x !== p);
  const next = was.slice(was.indexOf(id) + 1).find((x) => rest.some((q) => q.id === x));
  const at = next == null ? rest.length : rest.findIndex((q) => q.id === next);
  return [...rest.slice(0, at), p, ...rest.slice(at)];
}

/** Clauses after an own pick in GW g saying what it did to the rest of that GW (plan view before → after): suggested
 *  moves it replaced, moves it brought, hits there (" · replaces Scott → Groß · no hit"). `own`: the player the pick
 *  sells. */
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
/** " after a −4" when an edit brought GW g a hit (its points count it). */
export const hitAfter = (Q, prev, g) => {
  const n = Math.max(0, (weekOf(Q, g)?.hits ?? 0) - (weekOf(prev, g)?.hits ?? 0));
  return n ? ` ${COPY.afterHit(n)}` : '';
};
/** "−4 in GW8" per GW after g whose weeks `a` take more hits than weeks `b`: a hit a move brings to a later week. */
export const hitsLater = (a, b, g) => a.filter((w) => w.gw > g).map((w) => [w.gw, (w.hits ?? 0) - (b.find((x) => x.gw === w.gw)?.hits ?? 0)])
  .filter(([, n]) => n > 0).map(([x, n]) => `${COPY.hitsIn(n)} in GW${x}`);
