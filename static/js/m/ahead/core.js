// ahead.js: the plan view: context, Ahead's own state, the plan as drawn, phone estimates, pins and solves

import * as E from '../../plan/engine.js';
import { h, chipName } from '../../ui.js';
import { COPY, planInputs, compare as compareIn, counted as countedIn, clockText, waitedText, horizonFeature, waitLines, stepShare } from '../calls.js';
import { attach, makePin, squadInto, composePins, findRoad, withBank, forcedHits, solveKept, solvedKey } from '../memory.js';
import { asksOf, changedOf, derivedPin, ovOf } from './edits.js';
import { SQUAD_CHIPS } from './plans.js';
import { pinOfMove } from './presolve.js';
import { squadWeek } from './pieces.js';
import { TAP_IN } from './screen.js';

export { clockText, waitedText, stepShare };

export const LONG_MS = 430;           // long-press to lift a shirt
export const SWIPE_PX = 90;           // a row swiped left past this rules its buy out
export const SWIPE_MS = 260;          // the Why sheet's row travels left (vetoFromWhy: --dur), then the veto
export const GRIP_MS = 150;           // a short hold: the C badge's drag (a move before it scrolls)
export const TC_MS = 600;             // the C held still this long: the Triple Captain (a move before it drags the armband)
export const EDGE_PX = 16;            // §5.5: a swipe or scrub starts ≥ 16 pt from the screen edges (the iOS back-swipe: atEdge)
export const SPENT_PX = 24;           // a spent gesture's click lands this near its point
export const MINUS = '−';
/** fn in its own task once the frame in flight is painted, so a tap's feedback draws first. Without frames (hidden
 *  page, node tests): at once. */
export const afterPaint = (fn) => (typeof requestAnimationFrame === 'function' && globalThis.document?.visibilityState === 'visible'
  ? requestAnimationFrame(() => setTimeout(fn, 0)) : fn());
export const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
export const ids = (xs) => (Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : []);
export const sum = (xs) => xs.reduce((s, x) => s + x, 0);
export const span = (gws) => COPY.span(gws);
/**
 * The wait line (owner, 2026-10-28), every wait told one way: verb in ink at 600 ("Planning", "Planning"), then what,
 * how far and the clock, the longest that fits whole, never an ellipsis (calls.waitLines); a bar on the container's
 * edge, determinate where a count or time left is known. → {t: the words, bar}
 */
export function waitView() {
  return { t: h('span.m-wl', { 'aria-hidden': 'true' }, h('b'), h('span')), bar: h('span.m-wlb', { 'aria-hidden': 'true' }, h('i')), key: null };
}
/** Draws wait W {key, word, scope, long, prog, so, p: 0..1 | null} as wait line `v` (waitView): longest words that fit
 *  whole, bar at p, else (p null) a sweep once per wait (W.key), ended after three. */
export function paintWaitView(v, W) {
  const [b, r] = v.t.children, i = v.bar.firstChild;
  if (b.textContent !== W.word) b.textContent = W.word;
  for (const x of waitLines(W)) { r.textContent = x; if (v.t.scrollWidth <= v.t.clientWidth + 0.5) break; }
  if (W.p != null) { i.classList.remove('sweep'); i.style.width = `${(100 * Math.min(1, W.p)).toFixed(1)}%`; }
  else if (v.key !== W.key) { i.classList.remove('sweep'); i.style.width = ''; void i.offsetWidth; i.classList.add('sweep'); }
  v.key = W.key;
}
export const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
export const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
/** "instead of Palmer" → "Instead of Palmer": words that lead their line. */
export const capFirst = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ---------------------------------------------------------------- context

/** The bundle-derived facts every plan function needs (null before a bundle with an entry); base: the solver's plan with
 *  none of your rules (memory model), null until it lands, its noise the plan's. */
export function info(ctx) {
  const b = ctx.bundle, d = ctx.data;
  if (!b?.entry || !d?.base) return null;
  const gws = d.horizon, base = (ctx.store.get('memory') ?? memPlan(ctx))?.model ?? null;
  return {
    // reach: the GWs the longest plan reaches; those past gws show locked (Settings → Plan ahead)
    b, d, A: d.gw, gws, reach: d.reach ?? gws, end: gws[gws.length - 1], L: E.playerLookup({ base: d.base, players: d.players }),
    seeds: d.seeds, noise: num(base?.noise) ?? d.noise ?? 0, base, entry: String(b.entry.id),
    owned: ids(d.base.squad.map((s) => s.id)), season: d.base.season,
  };
}
/** Your plan drawn while the model's is not asked (Settings → Solve ahead Off, memory model): with it On Ahead waits for
 *  the model's as before. */
const ownFirst = (ctx, gp = memPlan(ctx)) => ctx.presolveOn?.() === false && !!gp?.road?.weeks?.length;
export const editable = (ctx) => ctx.store.get('conn')?.state !== 'offline' && !!(info(ctx)?.base || ownFirst(ctx));
/** Plans of n weeks or more are locked for this browser (the bundle's meta.locked): the reach's n-th GW can't be
 *  planned. */
export const lockedFrom = (I, n) => I.reach.slice(n - 1).every((_, i) => (I.b.meta?.locked || []).includes(horizonFeature(n + i)));
/** While Settings → Plan ahead asks a different length than the plan on screen (ctx.weeks, kept at the tap; bundle on
 *  the way: app.js setWeeks), no background solve is asked (forkPump, pumpPreps, optionsRef). */
export const leftBehind = (ctx, I) => { const n = ctx.weeks?.(); return n != null && n !== I.gws.length; };
export const OFFLINE_EDIT = 'Edits need a connection. Your plan is unchanged.';
export const memOf = (ctx) => attach(ctx);
export const memPlan = (ctx) => memOf(ctx)?.getPlan() ?? null;

// ---------------------------------------------------------------- what Ahead keeps beside memory

/** A sheet's ask to open GW g's Your rules on Ahead (openRules), taken by the screen's next draw of that week. */
let RULES_ASK = null;
/** Opens GW g's Your rules on Ahead on the screen's next draw of that week (a sheet's toast action, e.g. Replace's). */
export function openRules(ctx, g) {
  RULES_ASK = g;
  bump(ctx);
}
/** Whether a sheet asked for GW g's Your rules (openRules); the ask is taken. */
export function takeRulesAsk(g) {
  if (RULES_ASK !== g) return false;
  RULES_ASK = null;
  return true;
}
/** The last landing, drawn once by mount's render (the screen reads it, never a plan view): {gws (weeks changed), at,
 *  rows ({gw: [`${out}>${in}`]}: transfers made), cards ({gw: [id]}: players brought in or moved, changedCards), chg
 *  (weeks keeping a mark until shown), undo (an Undo brought it)}. */
export let FLASH = null;
/** The week the screen shows of plan view P: the address's GW when the plan has it, else GW A (mount's gwNow). */
export const viewedGw = (ctx, P) => {
  const g = Number(ctx.store?.get?.('gw'));
  return P?.gws.includes(g) ? g : P?.A ?? ctx.data?.gw;
};
/** The Why sheet shown (owner, 2026-11-02: "hide Why sheet and its tests"): off, a transfer's or plan's Why opens its
 *  buy's player sheet and a take's toast has no Why. */
export const WHY_SHEET = false;
/** A take's toast action before its Undo (addPlan; owner, 2026-10-21): GW g's buy `id`'s transfer Why sheet; toast and
 *  Undo stay until it closes (ui.toast `keep`). */
export const whyAct = (g, id) => ({ label: COPY.whyAct, keep: true, onClick: () => TAP_IN?.(g, id) });
/** A sheet opening (ctx.openSheet's promise) → a promise settled once it has closed (its onClose, kept), at once when
 *  none opened. */
export const closedOf = (p) => Promise.resolve(p).then((sh) => sh && new Promise((done) => { const was = sh.onClose; sh.onClose = () => { was?.(); done(); }; }));
/** An edit made at once (a lineup edit, Reset plan, "Without your rules") landed: what it changed against plan view
 *  `prevP` (changedOf: tiles, rows, cards) flashed once by mount's render, `more` over it (its own weeks: … */
export function flashLanding(ctx, prevP, more = {}) {
  bump(ctx);
  const P = plan(ctx);
  const ch = P && prevP ? changedOf(P, prevP) : { gws: [], rows: {}, cards: {} };
  setFlash(P, { ...ch, ...more });
}
/** A landing's changes (changedOf) for mount's render to flash once, stamped with P's team and GW A (`team`) so a team
 *  switch doesn't show them on another team's tiles. */
export const setFlash = (P, x) => { FLASH = { ...x, team: P ? `${P.entry}|${P.A}` : null, at: Date.now() }; };
/** Moves taken off this session ("removed by you"; removeMove), per entry and GW A: {key, by: {gw: [`${out}>${in}`]}}.
 *  A choice selling and buying only such players carries the label (plansOf `removed`) but keeps its rank (owner,
 *  2026-10-26). Its Undo restores the record. */
export let REMOVED = { key: null, mem: null, by: {} };
export const removedBy = (I) => {
  // this page's memory's: a sign-out takes them with it, as it takes your choices
  const k = `${I.entry}:${I.A}`, mem = attach();
  if (REMOVED.key !== k || REMOVED.mem !== mem) REMOVED = { key: k, mem, by: {} };
  return REMOVED.by;
};
/** Moves `ms` ([{gw, out, in}]) noted as removed by you, or forgotten (on false). */
export function noteRemoved(I, ms, on = true) {
  const by = removedBy(I);
  for (const m of ms) {
    const k = `${m.out}>${m.in}`, rest = (by[m.gw] || []).filter((x) => x !== k);
    by[m.gw] = on ? [...rest, k] : rest;
  }
}
/** The moves you took off GW g this session, `${out}>${in}` each. */
export const removedAt = (I, g) => new Set(removedBy(I)[g] || []);
/** Phone-only lineups for GWs after A: {gw: {captain?, vice?, xi?, bench?}} (per entry and window). */
let LU = { key: null, local: null, by: {} };
let rev = 0;               // bumped on every Ahead-side change (the plan view is memoised on it)
export const bump = (ctx) => { rev++; ctx.store.set('aheadRev', rev); };

/** GW g's phone lineup, its own key (B9: keyed by GW A, a later GW's captain was gone once GW A's deadline passed). */
const luKey = (I, g) => `fc:ahead:lu:${I.entry}:${g}`;
const laterGws = (I) => I.gws.filter((g) => g > I.A);
const luWindow = (I) => `${I.entry}:${I.gws.join()}`;
/** This browser's (ctx.api.local; failures only forget): the price watch put away by "Hide" (signature: team, night,
 *  verdict, amount; a new verdict shows again), and the counted players' prices while it shows (calls.priceMorning's
 *  `kept`). */
export const WAIT_KEY = 'fc:ahead:pwait';
export const NIGHT_KEY = 'fc:ahead:pwnight';
/** Hints done, kept like WAIT_KEY (JSON list of LEARNT's names; owner, 2026-10-13: "fading hints"): each shows until
 *  you've done its action once. 'row' a transfer row swiped left, 'pitch' a shirt held or the C/V dragged, 'chips' a
 *  chip played from the pitch or Chips… opened. */
export const LEARN_KEY = 'fc:ahead:learnt';
/** Help's "Show tips on the screen again": forgets the learnt hints; a mounted Ahead redraws them ('learnt'). */
export function showTipsAgain(ctx) {
  ctx.api?.local?.set?.(LEARN_KEY, null);
  ctx.store.set('learnt', Date.now());
}
export function lineups(ctx, I) {
  const k = luWindow(I), local = ctx.api.local;
  if (LU.key !== k || LU.local !== local) {
    // old format: GW A's key held all later GWs' lineups ({gw: lineup}); each moves to its own key, never over a newer
    // one
    const old = local.json(luKey(I, I.A));
    if (old && typeof old === 'object' && Object.keys(old).every((g) => /^\d+$/.test(g))) {
      for (const [g, lu] of Object.entries(old)) if (Number(g) > I.A && lu && local.get(luKey(I, g)) == null) local.set(luKey(I, g), JSON.stringify(lu));
      local.set(luKey(I, I.A), null);
    }
    LU = { key: k, local, by: Object.fromEntries(laterGws(I).map((g) => [g, local.json(luKey(I, g))]).filter(([, lu]) => lu)) };
  }
  return LU.by;
}
/** `by` the later GWs' lineups: each GW's key written, a GW absent from it removed. */
export function setLineups(ctx, I, by) {
  const local = ctx.api.local;
  LU = { key: luWindow(I), local, by: Object.fromEntries(laterGws(I).filter((g) => by[g]).map((g) => [g, by[g]])) };
  for (const g of laterGws(I)) local.set(luKey(I, g), LU.by[g] ? JSON.stringify(LU.by[g]) : null);
  bump(ctx);
}

// ---------------------------------------------------------------- the plan as drawn

/** The engine base GW A starts from: the entry's, with the bank your "Bank as FPL shows" rule plans from
 *  (memory.withBank). */
export const baseOf = (ctx) => withBank(ctx.data.base, (ctx.store.get('memory') ?? attach()?.getPlan())?.pins);

/** Per road, by its weeks. */
const roadId = (road) => road?.weeks ?? road;
const DRAFTS = new WeakMap();
export function roadDraft(ctx, road) {
  let d = DRAFTS.get(roadId(road));
  const keep = pairsOf((ctx.store.get('memory') ?? memPlan(ctx))?.pins);
  if (!d) DRAFTS.set(roadId(road), (d = E.roadToDraft(road, ctx.data.base, { players: ctx.data.players, keep })));
  return d;
}

/** gw → bank of a road at FPL's prices (engine.planBanks: half-profit sale values, today's buy prices, no lineups) from
 *  baseOf, memoised per road and base. */
const BANKS = new WeakMap();
function banksOf(ctx, road) {
  const base = baseOf(ctx);
  let b = BANKS.get(roadId(road));
  if (b?.base !== base) BANKS.set(roadId(road), (b = { base, gw: E.planBanks({ base, players: ctx.data.players, draft: roadDraft(ctx, road), horizon: ctx.data.horizon }) }));
  return b.gw;
}
/** Your transfers as your rules make them, [{out, in}]: a sale with its buy, a slide; each row finds its rule
 *  (pinOfMove). */
export const pairsOf = (pins) => (pins || []).flatMap((p) => (p.kind === 'sell' && p.in != null ? [{ out: p.player, in: p.in }]
  : p.kind === 'slide' ? [{ out: p.out, in: p.player }] : []));
/** A week's sales `outs` and buys `ins` paired by position (engine.pairMoves), your transfers as their rules make them
 *  (`keep`: pairsOf); whole pairs only. → [{out, in}] */
export const pairedMoves = (outs, ins, L, keep = []) => E.pairMoves(outs, ins, L, keep).filter((m) => m.out !== null && m.in !== null);
/** A Road week as a ViewWeek (moves paired: pairedMoves; points = the engine's on today's mean xP, the one source of
 *  every gap). bank: the engine's (FPL sale prices) else the road's. keep: pairsOf. */
export function viewOfRoadWeek(w, L, { bank = null, keep = [] } = {}) {
  const xi = ids(w.xi), bench = ids(w.bench), hits = num(w.hits) ?? 0;
  const moves = pairedMoves(w.out, w.in, L, keep);
  return {
    gw: Number(w.gw), xi, bench, squad: [...xi, ...bench], captain: num(w.captain), vice: num(w.vice), chip: w.chip ?? null,
    bank: bank ?? num(w.bank), ft: num(w.ft_avail), used: num(w.ft_used), hits,
    points: E.weekPoints({ ...w, xi, bench, hits }, L.xp),
    moves, in: moves.map((m) => m.in), out: moves.map((m) => m.out), approx: false,
  };
}
/** An engine state as a ViewWeek (≈). With `L`, a Wildcard's or Free Hit's changes (chip squad vs the week before) pair
 *  as a road's week does (pairedMoves, `keep`). */
export function viewOfState(s, L = null, keep = []) {
  const moves = L && SQUAD_CHIPS.has(s.chip) ? pairedMoves(s.sold, s.bought, L, keep) : s.moves.filter((m) => m.ok).map((m) => ({ out: m.out, in: m.in }));
  return {
    gw: s.gw, xi: s.xi, bench: s.bench, squad: s.squad, captain: s.captain, vice: s.vice, chip: s.chip, bank: s.bank,
    ft: s.ft, used: s.used, hits: s.hits, points: s.points, moves, in: moves.map((m) => m.in), out: moves.map((m) => m.out),
    approx: true,
  };
}

/** A phone-only lineup over a week (engine.applyLineup: the one rule GW A as you play it uses too, calls.planFromRoad),
 *  re-scored by the one rule (engine.weekPoints); lineupDelta: what it changes against the plan's own … */
function withLineup(w, lu, L) {
  if (!lu || !['xi', 'bench', 'captain', 'vice'].some((k) => lu[k] != null)) return w;
  const { xi, bench, captain, vice } = E.applyLineup(w, lu, L);
  if (sameSet(xi, w.xi) && sameList(bench, w.bench) && captain === w.captain && vice === w.vice) return w;
  const delta = E.weekPoints({ ...w, xi, bench, captain }, L.xp) - E.weekPoints(w, L.xp);
  return { ...w, xi, bench, captain, vice, points: w.points + delta, lineup: true, lineupDelta: delta };
}
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/** Your phone lineup for GW g (memory's frozenLineups first: a frozen GW's, none since Freeze went, 2026-10-12): GW A's
 *  from plan memory, a later GW's from this device. */
const lineupOf = (ctx, I, gp, g) => gp?.frozenLineups?.[g] ?? (g === I.A ? gp?.lineup : lineups(ctx, I)[g]);
/** The frozen GWs of a plan view (memory's frozen), ascending: none since Freeze went (memory.normalizeAccepted thaws
 *  an older plan's); isFrozen(P, g): GW g is one of them. */
export const frozenOf = (P) => P?.mem?.frozen ?? [];
export const isFrozen = (P, g) => frozenOf(P).includes(Number(g));

/** A road with your lineups on its planned weeks (withLineup): what a solve of an alternative is measured in against
 *  your plan (P.weeks), so your subs and armbands never count. → {weeks} */
export function asYours(ctx, road, gp = memPlan(ctx)) {
  const I = info(ctx);
  return { weeks: (road?.weeks || []).filter((w) => I.gws.includes(Number(w.gw))).map((w) => withLineup(viewOfRoadWeek(w, I.L), lineupOf(ctx, I, gp, Number(w.gw)), I.L)) };
}

let memo = { key: null, P: null };
/** Plan memory hands out a new plan object on every change; some draw nothing (a save's echo, memory.flush): for such a
 *  copy the plan view and its memoised work are kept. */
const SAME_SKIP = new Set(['saving', 'doc']);
const sameMemPlan = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => SAME_SKIP.has(k) || a[k] === b[k] || JSON.stringify(a[k]) === JSON.stringify(b[k]));
};

/** Plan views a and b for the same team, week, data and rules (pins): a view drawn anew for a bundle sent again (a
 *  first plan's solve landing, a refresh) is the same one, so a solve in flight for it is never let go and asked
 *  again (2026-11-03: a new team's load asked GW11's preparation and the ✕'s refusal up to seven times each). */
export const sameView = (a, b) => a === b || (!!a && !!b && String(a.entry) === String(b.entry) && a.A === b.A && a.b?.version === b.b?.version
  && (a.pins ?? []).map((p) => p.id).sort().join() === (b.pins ?? []).map((p) => p.id).sort().join());

export function plan(ctx) {
  const I = info(ctx);
  const gp = ctx.store.get('memory') ?? memPlan(ctx);
  if (!I || (!I.base && !ownFirst(ctx, gp))) return null;
  const conn = ctx.store.get('conn')?.state;
  const key = [gp, I.b, I.d, conn, rev];
  if (memo.key && key.every((x, i) => x === memo.key[i])) return memo.P;
  if (memo.key && key.every((x, i) => i === 0 || x === memo.key[i]) && sameMemPlan(gp, memo.key[0])) {
    memo.key = key;
    return memo.P;
  }
  // under the hold, until the solver's first plan for your rules there is nothing to draw: Ahead waits as for the model's plan
  // (renderBaking), never showing the phone's evaluation (owner, 2026-10-26)
  if (gp?.hold && !gp.road?.weeks?.length) return null;
  const ov = ovOf(ctx, I);
  const road = gp?.road?.weeks?.length ? gp.road : I.base;
  const byGw = new Map(road.weeks.map((w) => [Number(w.gw), w]));
  const pins = gp?.pins || [];
  // after a reload, the week the edit being checked changes (memory's pending.edit), not the earliest pin's
  const pendFrom = gp?.pending ? gp.pending.edit?.gw ?? Math.min(I.end, ...pins.map((p) => num(p.gw) ?? I.A)) : null;
  const from = ov?.from ?? pendFrom;
  // every week is the solver's returned plan (memory's: the model's plan where it fits, or a heal's) with your lineups; while an
  // edit plans, the plan before it with the edit's weeks waiting (shimmer). The phone's own ≈ is never drawn (owner,
  // 2026-10-26)
  const approx = new Set(from == null ? [] : I.gws.filter((g) => g >= from));
  const mark = new Set(from != null && approx.has(from) ? [from] : []);
  const made = pairsOf(pins);
  const weeks = I.gws.map((g) => {
    if (!byGw.has(g)) return null;
    const w = viewOfRoadWeek(byGw.get(g), I.L, { bank: banksOf(ctx, road)[g], keep: made });
    w.approx = mark.has(g);
    return withLineup(w, lineupOf(ctx, I, gp, g), I.L);
  }).filter(Boolean);
  const total = sum(weeks.map((w) => w.points));
  // hits a shown week takes that its road's rules don't allow, or its planner never priced (memory.forcedHits); never a
  // waiting week's
  const drawn = (list) => list(road).filter((f) => !approx.has(f.gw));
  const forced = drawn((r) => forcedHits(r, I.gws));
  const edited = weeks.filter((w) => w.lineup);
  const lineupGap = edited.length ? { delta: sum(edited.map((w) => w.lineupDelta ?? 0)), gws: edited.map((w) => w.gw) } : null;
  const comparable = !ov && !gp?.pending && (gp?.source !== 'yours' || (!gp.stale && !!road.objective));
  const bareRoad = bareRef(ctx, I, pins);
  const bare = bareRoad ? new Map(bareRoad.weeks.map((w) => [Number(w.gw), viewOfRoadWeek(w, I.L)])) : null;
  const ok = editable(ctx);
  const P = {
    ...I, mem: gp, road, pins, weeks, total, approx, mark, forced, healing: !!(ov || gp?.pending), bare,
    editable: ok, why: ok ? '' : OFFLINE_EDIT, lineupGap, comparable,
  };
  memo = { key, P };
  return P;
}

/** Options solves (optionsRef), per roads version and options: a Road, 'solving', or 'error' (never asked again). */
const OPTIONS = new Map();
/** A background solve's cache key: the roads version and its values (key order aside). */
export const valuesKey = (I, values) => solvedKey(I.b.version, values);

/** Your team as it is, the plan to compare yours with (owner, 2026-10-26): the solver's plan with none of your rules,
 *  one speculative solve per roads version (specRoad). → Road | null */
function bareRef(ctx, I, pins) {
  const own = pins.filter((p) => !derivedPin(p));
  if (!own.length || !specOk(ctx, I)) return null;
  return specRoad(ctx, I, valuesFor(ctx, [], own.map((p) => p.id)));
}
/** A speculative solve can be asked (a solver there, this browser not left behind). */
const specOk = (ctx, I) => !!ctx.api?.solve && !leftBehind(ctx, I);
/** One speculative solve of `values` per roads version (OPTIONS). → Road | null. */
function specRoad(ctx, I, values) {
  const key = valuesKey(I, values);
  const got = OPTIONS.get(key);
  if (got?.weeks) return got;
  if (got || ctx.api.slotBusy?.('spec') || ctx.store.get('conn')?.state === 'offline') return null;
  OPTIONS.set(key, 'solving');
  solveKept(ctx.api, { entry: Number(I.entry), purpose: 'speculative', values })
    .then((r) => {
      if (r.road) OPTIONS.set(key, r.road);
      else if (r.state === 'error') OPTIONS.set(key, 'error');
      else {
        OPTIONS.delete(key);
        // asked again once the slot is free: the re-draw then asks it (api.whenFree)
        if (r.state === 'superseded') ctx.api.whenFree?.('spec').then(() => { if (attach()?.ctx === ctx) bump(ctx); });
      }
      bump(ctx);
    }, () => OPTIONS.delete(key));
  return null;
}

export const weekOf = (P, g) => P?.weeks?.find((w) => w.gw === Number(g)) ?? null;

/** The squad going into GW g's moves (memory.squadInto: a free hit's squad is thrown away, team.py:161, 175). */
export const squadBefore = (P, g) => squadInto((x) => weekOf(P, x), g, P.A, P.owned);

/** The players "in your team" for a buy in GW g (Replace's "In team"): the squad going in plus the week's own, never
 *  the week's alone (its sales would be buyable again). → Set(id) */
export const inTeamAt = (P, g) => new Set([...squadBefore(P, g), ...(weekOf(P, g)?.squad ?? [])]);

/** Who takes whose place between lists `was` and `now`: of his own position first. → [[out, in]] */
const placesTaken = (was, now, pos) => { const outs = was.filter((x) => !now.includes(x));
  return now.filter((x) => !was.includes(x)).map((x) => { const i = Math.max(0, outs.findIndex((o) => pos(o) === pos(x))); return [outs.splice(i, 1)[0], x]; }).filter(([o]) => o != null); };
/** What the card's swap changes on the pitch, week view `w` to `after` (paintBoard): `place`, the one he stands where in the
 *  team as it is; `sold`, who a transfer sells for him, null for a player only changing places; `kind`: 'in' bought, 'up'
 *  bench to pitch, 'down' pitch to bench. → [{place, id, sold, kind}] */
export function boardMarks(w, after, pos) {
  const sells = new Map(placesTaken([...w.xi, ...w.bench], [...after.xi, ...after.bench], pos).map(([out, id]) => [id, out]));
  return [...placesTaken(w.xi, after.xi, pos), ...placesTaken(w.bench, after.bench, pos)].map(([place, id]) => {
    const sold = sells.get(id) ?? null;
    return { place, id, sold, kind: sold != null ? 'in' : w.xi.includes(id) ? 'down' : 'up' };
  });
}
/** The card's moves paired as the pitch draws them (boardMarks: a buy who starts over the seller who started), so its
 *  title reads as the board shows it: "Raya, Dovin → Verbruggen, Trafford" when Verbruggen takes Raya's place in goal
 *  (qa-tk105, two keepers bought, one benched; the engine pairs a position dearest-first). Words only: the moves stay
 *  as they are for every rule. Unchanged where the board pairs other players. → [{out, in}] */
export function pairAsPlaced(w, after, pos, moves) {
  if (!after || moves.length < 2) return moves;
  const by = new Map(boardMarks(w, after, pos).filter((m) => m.kind === 'in').map((m) => [Number(m.sold), m.id]));
  const out = moves.map((m) => ({ ...m, in: by.get(Number(m.out)) ?? m.in }));
  const same = (a, b) => a.map((m) => Number(m.in)).sort().join() === b.map((m) => Number(m.in)).sort().join();
  return same(out, moves) ? out : moves;
}
/** {id: name} for the players week w buys, each with the player he replaces (pitch.js). A Wildcard or Free Hit week is
 *  a new squad, not swaps: each buy is just "IN" (owner, 2026-10-07). */
export function inFor(P, w) {
  const out = {};
  const squad = w?.chip === 'wc' || w?.chip === 'fh';
  for (const m of w?.moves || []) out[m.in] = squad ? true : P.L.name(m.out);
  return out;
}

/** {id: gw} for players of GW g's squad not in the real squad (the pitch's IN marker): the GW each was bought in. */
export function boughtIn(P, g) {
  const out = {};
  for (const id of weekOf(P, g)?.squad ?? []) {
    if (!P.owned.includes(id)) out[id] = P.weeks.filter((x) => x.gw <= g && x.in.includes(id)).at(-1)?.gw ?? g;
  }
  return out;
}

// ---------------------------------------------------------------- phone estimates (the engine, instantly)

/** The plan as an engine draft: your road's, the solver's (with the phone lineups); never an edit's ≈ (none since the
 *  owner, 2026-10-26: "fix so every squad is solver squad"), so every choice is measured against the … */
export function draftOf(ctx) {
  const P = plan(ctx);
  let d = roadDraft(ctx, P.road);
  for (const w of P.weeks) if (w.lineup) d = E.setLineup(d, w.gw, { xi: w.xi, bench: w.bench, captain: w.captain, vice: w.vice });
  return d;
}

/** evaluate() with the lineups from `from` on left to the engine (best XI per week, §5.7 "Best for plan"). */
export function estimate(ctx, draft, from) {
  const I = info(ctx);
  let d = draft;
  for (const g of I.gws) if (g >= from && d.lineups?.[g]) d = E.setLineup(d, g, null);
  return E.evaluate({ base: baseOf(ctx), players: I.d.players, draft: d, horizon: I.gws });
}

/** The shell's bundle as calls.js reads it (planInputs) from the bank your plan starts from (baseOf), memoised per
 *  derived data and base. */
const INPUTS = new WeakMap();
export function inputsOf(ctx) {
  const base = baseOf(ctx), model = info(ctx)?.base ?? null;
  let c = INPUTS.get(ctx.data);
  if (!c || c.b !== ctx.bundle || c.base !== base || c.model !== model) INPUTS.set(ctx.data, (c = { b: ctx.bundle, base, model, inputs: planInputs(ctx.bundle, { ...ctx.data, base }, model) }));
  return c.inputs;
}
export const inputs = inputsOf;
/** calls.compare: the one measure. */
export const compare = (ctx, a, b) => compareIn(inputs(ctx), a, b);
/** calls.counted: a choice's number, the solver's own count over GW g's window where solved roads a and b carry it. */
export const ownCount = (ctx, cmp, a, b, g) => countedIn(inputs(ctx), cmp, a, b, g);

/** The plan as it stands, estimated from GW `from` (memoised per plan view): what an edit is measured against. */
const BASELINES = new WeakMap();
export function baseline(ctx, from) {
  const P = plan(ctx);
  if (!P) return null;
  let m = BASELINES.get(P);
  if (!m) BASELINES.set(P, (m = new Map()));
  if (!m.has(from)) m.set(from, estimate(ctx, draftOf(ctx), from));
  return m.get(from);
}

export const clubCounts = (L, squad) => {
  const n = new Map();
  for (const p of squad || []) { const c = L.club(p); if (c) n.set(c, (n.get(c) || 0) + 1); }
  return n;
};

/**
 * Reasons (from GW `from`) the phone blocks an edit before any solve (§5.5, §7.9): all of the first week that has any,
 * else []. A move that can't be made (alone), else a bank or club count the edit makes worse than the plan already
 * has. short: what the edit adds to that week's shortfall. For a pair's move that alone says what it lacks: all of
 * them (fitOf; owner, 2026-10-26: "£1.3m short · needs Calafiori's and João Pedro's sales").
 */
export function problemsOf(ctx, ev, from) {
  const I = info(ctx);
  const before = baseline(ctx, from);
  for (const s of ev.gws.filter((x) => x.gw >= from)) {
    const b = before?.gws.find((x) => x.gw === s.gw);
    const bad = s.moves.find((m) => !m.ok);
    if (bad) return [{ code: 'move', gw: s.gw, reason: bad.reason }];
    const out = [];
    const was = Math.min(0, b?.bank ?? 0);
    if (s.bank < -1e-9 && s.bank < was - 1e-9) out.push({ code: 'budget', gw: s.gw, short: was - s.bank });
    const had = clubCounts(I.L, b?.squad);
    for (const [club, n] of clubCounts(I.L, s.squad)) if (n > E.MAX_PER_CLUB && n > (had.get(club) ?? 0)) out.push({ code: 'club', gw: s.gw, club, count: n });
    if (out.length) return out;
  }
  return [];
}
export const problemOf = (ctx, ev, from) => problemsOf(ctx, ev, from)[0] ?? null;

/** A problem (problemOf, findBuy's) in one line; `name`: the buy's, where known ("Groß needs £1.2m more in GW6.", not
 *  "Needs …"). */
export function problemText(ctx, p, name = null) {
  if (!p) return '';
  // never "Try GW7" unless GW7 fits (the caller that knows says it: buyProblem)
  if (p.code === 'budget') return COPY.noFit(name, p.short, p.gw);
  if (p.code === 'club') return COPY.club(p.count, p.club, p.gw);
  if (p.code === 'kept') {
    // findBuy: each by the first GW your Keep holds him, "Scott is kept in GW6. Rogers is kept in GW7."
    const by = new Map();
    for (const [id, gw] of p.kept) by.set(gw, [...(by.get(gw) ?? []), info(ctx).L.name(id)]);
    return [...by].map(([gw, names]) => COPY.keptIn(names, gw)).join(' ');
  }
  return COPY.infeasible(p.gw);
}
/** …as a list row says it in its number's place (plansOf `needs`): "£1.2m short", "3 from ARS", else "can't fit". */
export const problemShort = (p) => (p?.code === 'budget' ? COPY.moneyShort(p.short) : p?.code === 'club' ? COPY.clubFull(p.club) : "can't fit");

export const flatMoves = (draft) => Object.entries(draft?.moves || {})
  .flatMap(([g, ms]) => (ms || []).map((m) => ({ gw: Number(g), out: Number(m.out), in: Number(m.in) })));
export const withMoves = (draft, list) => {
  const moves = {};
  for (const m of list) if (m.out !== m.in) (moves[m.gw] ||= []).push({ out: m.out, in: m.in });
  return { ...draft, moves };
};
export const sameMove = (a, b) => a.gw === b.gw && a.out === b.out && a.in === b.in;

/** Same sale, a different buy (a later sale of the old buy now sells the new one). */
function swapIn(list, m, inn) {
  return list.map((x) => (sameMove(x, m) ? { ...x, in: inn } : x.gw > m.gw && x.out === m.in ? { ...x, out: inn } : x))
    .filter((x) => !(!sameMove(x, { ...m, in: inn }) && x.gw > m.gw && x.in === inn));
}

/**
 * Sell `out` from GW g for `inn` on a draft: a move already selling him that GW changes its buy; a later buy of `inn`
 * is void; a later sale of `out` is dropped or carried onto `inn`; the best legal variant wins → {draft, ev, problem}.
 */
export function addMove(ctx, draft, g, out, inn, measure = null) {
  const list = flatMoves(draft);
  const variants = [];
  const same = list.find((x) => x.gw === g && x.out === out);
  if (same) variants.push(swapIn(list, same, inn));
  else {
    const kept = list.filter((x) => !(x.gw >= g && x.in === inn));
    const later = kept.filter((x) => x.gw > g && x.out === out);
    const add = (l) => [...l, { gw: g, out, in: inn }];
    variants.push(add(kept.filter((x) => !later.includes(x))));
    if (later.length) variants.push(add(kept.map((x) => (later.includes(x) ? { ...x, out: inn } : x))));
  }
  return bestOf(ctx, variants.map((v) => withMoves(draft, v)), g, measure);
}

/** `measure(d, from)` → evaluate's state (default: estimate); takenBy for a number the tap or your row must give. */
export function bestOf(ctx, drafts, from, measure = null) {
  return drafts.map((d) => {
    const ev = measure ? measure(d, from) : estimate(ctx, d, from);
    return { draft: d, ev, problem: problemOf(ctx, ev, from) };
  }).sort((a, b) => (!!a.problem - !!b.problem) || (b.ev.total - a.ev.total))[0];
}

/** Players plan view P moves (sells or buys) in GW g or later: Set(id). A new move of one in GW g would silently change
 *  that transfer (addMove swaps its buy, voids a later buy, drops or carries a later sale) and his sale rule would
 *  overwrite his own, so suggestions, a row's other buy and a bring-in's sale avoid them. Never a Wildcard or Free Hit
 *  week's changes. `own`: your moves only. */
export const movedFrom = (P, g, own = false) => new Set(P.weeks.filter((w) => w.gw >= g && !squadWeek(w))
  .flatMap((w) => (w.moves || []).filter((m) => !own || pinOfMove(P, m)).flatMap((m) => [m.out, m.in])));

/** Drop a move: keep the player it sold (a later sale of the player it bought now sells him). */
export function dropMove(draft, m) {
  const list = flatMoves(draft);
  return withMoves(draft, list.filter((x) => !sameMove(x, m)).map((x) => (x.gw > m.gw && x.out === m.in ? { ...x, out: m.out } : x)));
}
/** The draft's own move for transfer x | undefined, and the draft without it (dropMove). */
const draftMove = (d, x) => flatMoves(d).find((y) => sameMove(y, x));
export const dropDrafted = (d, x) => { const y = draftMove(d, x); return y ? dropMove(d, y) : d; };

// ---------------------------------------------------------------- pins and solves

/** "Him from GW g" (Wish): memory's wish pin plus "not before g", so each arrival pill is its week. */
export function wishPin(P, id, g) {
  // a Wildcard or Free Hit week: him in that week's chip squad, the rest the solver's (owner, 2026-10-12)
  const chip = squadWeek(weekOf(P, g));
  if (chip) return makePin({ id: `wish:${id}`, kind: 'wish', chip, player: Number(id), gw: g, label: `${P.L.name(id)} in your GW${g} ${chipName(chip)}`, must: [[id, g, g]] });
  return makePin({
    id: `wish:${id}`, kind: 'wish', player: Number(id), gw: g, label: `${P.L.name(id)} from GW${g}`,
    must: [[id, g, P.end]], excl: g > P.A ? [[id, P.A, g - 1]] : [],
  });
}

/** Whether pin p is a Wildcard or Free Hit week's pick (wishPin's `chip`: him in that week's chip squad alone). */
export const isPick = (p) => p?.kind === 'wish' && !!p.chip;
/** The wish of player `id` an edit buying him drops ([id]), but never a chip week's pick: that stands beside the buy,
 *  or goes named where they clash (clashing; review 5, 2026-10-12: a later buy, a Replace or a plan's + … */
export const wishDrop = (P, id) => (isPick(asksOf(P).find((p) => p.id === `wish:${id}`)) ? [] : [`wish:${id}`]);
/** Your picks (isPick) of the GWs `gws`: [Pin]. */
export const picksAt = (P, gws) => asksOf(P).filter((p) => isPick(p) && gws.includes(Number(p.gw)));

/** memory.values() for your pins after an edit adding `extra` and dropping `drop` (ids): the POST /api/m/solve values
 *  its heal sends. */
export const valuesFor = (ctx, extra = [], drop = []) => memOf(ctx).values({ extra, drop });

/** One solve of your pins plus `extra`, less `drop` (ids) → memory.solveKept (api.solve): resolves {state, road,
 *  error}; a road that drops a rule it was solved for is an error. */
export function solveFor(ctx, extra, purpose, drop = []) {
  const I = info(ctx);
  const go = () => solveKept(ctx.api, { entry: Number(I.entry), purpose, values: valuesFor(ctx, extra, drop) });
  // one user-class solve per browser, a newer superseding the older (api/mobile.py solve_post): wait for a pending plan
  // heal, never cancel it
  if (ctx.api.SOLVE_CLASS[purpose] !== 'user') return go();
  let inner = null, stopped = false;
  const p = memOf(ctx).settled().then(() => (stopped ? { key: null, state: 'cancelled', road: null, error: null } : (inner = go())));
  p.cancel = () => { stopped = true; inner?.cancel?.(); };
  return p;
}

/** The model's plan when it already is your plan with `extra` pinned too and the pins `drop` (ids) taken off
 *  (memory.findRoad), else null. */
export function baked(ctx, extra = [], drop = [], P = plan(ctx)) {
  const c = composePins([...P.pins.filter((p) => !drop.includes(p.id)), ...extra], { from: P.A, to: P.end });
  return findRoad(P.base, c, P.gws);
}
