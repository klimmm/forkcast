// ahead/plans.js: a choice as a plan of yours; the fork roads asked in the background

import * as E from '../../../plan/engine.js';
import { hitCap } from '../../calls.js';
import { attach, makePin, pinSell, pinHits, pinRoll, solveKept, solvedLineup } from '../../memory.js';
import { baseOf, compare, draftOf, flatMoves, info, inputs, leftBehind, memOf, num, problemOf, roadDraft, sameMove, valuesFor, valuesKey, weekOf, withMoves } from '../core.js';
import { chainOf, chipBackOf, chipEdit, chipOffParts, derivedPin } from '../edits.js';
import { AHEAD, PAIR, PAIR_AGAIN_MS, PAIR_HOLD_MS, PAIR_TAKES, PREP_BESIDE, aheadAsks, aheadWaited, clearRoots, madeEarlier, pairChanged, pinOfMove, pumpAhead, repicks, rootStill, tapSpent } from '../presolve.js';
import { prepsWaiting, squadWeek } from '../pieces.js';
import { SQUAD_CHIPS, ownAfter } from './suggest.js';
import { keepNewest } from './choices.js';

/** Road r as a plan from GW g on, on your plan (d0: draftOf): its moves from g (roadDraft), your weeks before g as they
 *  are, and a Wildcard or Free Hit it plays in GW g. No plan of yours (solved without your other weeks): a road that
 *  plays a Wildcard or Free Hit after g that yours doesn't, or leaves out one yours plays, or has a transfer or Roll of
 *  yours after g; nor one that plays a Bench Boost or Triple Captain from g on other than yours (owner, 2026-10-28).
 *  Its GW-g choice stands either way, solved on its own.
 *  → {choice: {moves (GW g's), chips}, plan: {moves: [{gw, out, in}] (no chip squad's), chips: {gw: chip} (GW g's),
 *  yours: {gw: chip} (your Wildcard and Free Hit weeks after g), draft} | null} | null (r's weeks before g aren't
 *  yours) */
export function planOfRoad(ctx, P, r, g, d0) {
  // (GW g's choice on your plan: your moves and chips after it, whatever weeks its road solved, a choice's (forkValues
  // `to`) or the model's plan; owner, 2026-11-03, "fix bugs in fh / wc so they not use other weeks")
  const last = Math.min(roadLast(r), g);
  // (a later move of your plan that the road's own weeks make earlier goes from the later week: madeEarlier)
  const rd = roadDraft(ctx, r), mine = flatMoves(d0), made = flatMoves(rd).filter((m) => m.gw <= last), own = made.filter((m) => m.gw >= g);
  const chipAt = (d, x) => (d === rd && x > last ? d0 : d).chips?.[x] ?? null;
  const sq = SQUAD_CHIPS.has(chipAt(rd, g));
  // (in your Wildcard week a choice without it keeps none of your later moves: they were made on the Wildcard's squad,
  // which it never has; its weeks after it roll. Owner, 2026-11-03, "fix wildcard bug": the Wildcard's held roll sold
  // players it never had in GW8, never a plan, so the week line had no number)
  const wcBack = !sq && chipAt(d0, g) === 'wc';
  const theirs = [...made, ...(wcBack ? [] : mine.filter((m) => m.gw > last && !madeEarlier(own, m)))];
  const at = (ms, x) => ms.filter((m) => m.gw === x).map((m) => `${m.out}>${m.in}`).sort().join(',');
  if (P.gws.some((x) => x < g && at(theirs, x) !== at(mine, x))) return null;
  const choice = { moves: sq ? [] : theirs.filter((m) => m.gw === g), chips: sq ? { [g]: chipAt(rd, g) } : {} };
  const later = P.gws.filter((x) => x > g);
  const yours = Object.fromEntries(later.map((x) => [x, squadWeek(weekOf(P, x))]).filter(([, c]) => c));
  // (a Bench Boost or Triple Captain from g on that your plan doesn't play there, or yours left out)
  const otherBoost = [g, ...later].some((x) => !SQUAD_CHIPS.has(chipAt(rd, x)) && chipAt(rd, x) !== (SQUAD_CHIPS.has(chipAt(d0, x)) ? null : chipAt(d0, x)));
  if (otherBoost || later.some((x) => (SQUAD_CHIPS.has(chipAt(rd, x)) || yours[x]) && chipAt(rd, x) !== (yours[x] ?? null))
    || (!wcBack && ownAfter(P, g).some((m) => !theirs.some((y) => sameMove(y, m))))) return { choice, plan: null };
  const moves = theirs.filter((m) => m.gw >= g && P.gws.includes(m.gw) && !(sq && m.gw === g) && !yours[m.gw]);
  let draft = withMoves(d0, [...mine.filter((m) => m.gw < g), ...theirs.filter((m) => m.gw >= g && P.gws.includes(m.gw))]);
  if (sq) draft = E.setChip(draft, g, chipAt(rd, g));
  else if (SQUAD_CHIPS.has(chipAt(d0, g))) draft = E.setChip(draft, g, null);  // your chip week, its choice no chip (chipBackOf)
  return { choice, plan: { moves, chips: choice.chips, yours, draft } };
}

/** A road's last committed week: its values' `to` (a choice's own week, forkValues), else its last week; past it a
 *  plan is your plan's (planOfRoad). */
const roadLast = (r) => num(r?.values?.to) ?? Math.max(...(r?.weeks || []).map((w) => Number(w.gw)), -Infinity);
/** Draft d played as taking a plan makes it, from GW `from` on: the engine's best XI in each week, your saved lineup
 *  (engine.applyLineup) where you made one. Under the hold (`held`) a week's XI, bench and armband the solve's where a
 *  model's plan holds that week's squad, as the plan a take lands plays them (memory.holdRoad's solvedLineup; owner,
 *  2026-10-23), else a + says less than it gave. `held` false: the xP order. `score`: evaluate's {xp, fixedLineups}. →
 *  evaluate's state */
export function asTaken(ctx, P, d, from, score = {}, held = true) {
  const I = info(ctx);
  let x = d;
  for (const g of P.gws) if (g >= from && !weekOf(P, g)?.lineup && x.lineups?.[g]) x = E.setLineup(x, g, null);
  const run = (y) => E.evaluate({ base: baseOf(ctx), players: I.d.players, draft: y, horizon: I.gws, ...score });
  const ev = run(x);
  if (!held || !P.mem?.hold) return ev;
  let y = x;
  for (const s of ev.gws) {
    // the solve's lineup for that squad: your plan's own road first (the solver's, memory's), then the model's plan's
    const lu = s.gw >= from && P.gws.includes(s.gw) && !weekOf(P, s.gw)?.lineup ? solvedLineup([P.road, P.base], s.gw, s.squad, s.chip ?? null) : null;
    if (lu) y = E.setLineup(y, s.gw, lu);
  }
  return y === x ? ev : run(y);
}
/** Your plan from GW g as asTaken plays it: what a plan's number counts against (plansOf, its Why sheet); `held`
 *  false: in the xP order (asTaken's). Once per plan view, GW and order. */
const PLAN_BASE = new WeakMap();
export function planBaseline(ctx, P, g, held = true) {
  let m = PLAN_BASE.get(P);
  if (!m) PLAN_BASE.set(P, (m = new Map()));
  const k = `${g}:${held}`;
  if (!m.has(k)) m.set(k, asTaken(ctx, P, draftOf(ctx), g, {}, held));
  return m.get(k);
}
/** asTaken as addMove's `measure` (not estimate, which drops your saved lineups, so after a sub the number beat what
 *  the tap gave): your transfer rows, Add a player's pills and Replace price a single move as the plan rows are,
 *  against planBaseline. */
export const takenBy = (ctx, P) => (d, from) => asTaken(ctx, P, d, from);

/** A plan from GW g measured as taking it makes it (asTaken: best XI each week but where you saved a lineup, or under
 *  the hold its solve's, `held`; its hits counted) against your plan `before` (planBaseline(g) of the same `held`): {…p, ev, cmp, hits: {gw: FPL hits it brings there}} | null (it
 *  doesn't fit: problemOf). */
export function measurePlan(ctx, P, g, p, before, held = true) {
  const ev = asTaken(ctx, P, p.draft, g, {}, held);
  if (problemOf(ctx, ev, g)) return null;
  const hitsAt = (e, x) => e.gws.find((s) => s.gw === x)?.hits ?? 0;
  const hits = Object.fromEntries(P.gws.map((x) => [x, Math.max(0, hitsAt(ev, x) - hitsAt(before, x))]).filter(([, n]) => n > 0));
  return { ...p, ev, cmp: compare(ctx, ev, before), hits };
}

/** The solve of GW g's choice c ({moves, chips}) with Forkcast's best plan after it, on your plan as it stands (owner,
 *  2026-10-11): your pins; each week before g held to your plan's squad (so planOfRoad keeps it); your GW-g transfers
 *  (and a hits rule there) giving way to c's moves as exact transfers (memory.pinSell) or its chip (chipEdit); each
 *  week after g the planner's up to the bake's cap (Settings → Hits: memory's derived 'hits' pin) or an older plan's
 *  hits rule's (memory.holdOf), your exact transfers there kept (composePins). A transfer of yours that bought a player
 *  its GW-g moves sell (or `c.ends`'s) held only to g − 1 (chainOf); `c.held`: your later weeks kept (a Wildcard row's
 *  roll). → solve values */
export function forkValues(ctx, P, g, c, more = []) {
  const squad = SQUAD_CHIPS.has(c.chips?.[g]);
  const drop = [...new Set((weekOf(P, g)?.moves || []).map((m) => pinOfMove(P, { ...m, gw: g })?.id).filter(Boolean))];
  if (!squad && repicks(P, g)) drop.push(...P.pins.filter((p) => p.id === `hits:${g}`).map((p) => p.id));
  const held = P.gws.filter((x) => x < g).flatMap((x) => (weekOf(P, x)?.squad ?? []).map((id) => [id, x, x]));
  // (`more`: rules a tap not yet made adds, its plan view's solve asked ahead: refusalRoads)
  const extra = [...more, ...(held.length ? [makePin({ id: 'fork:before', kind: 'road', label: 'Your weeks before', gw: P.A, must: held })] : [])];
  // GW g is exactly the choice in both modes (a Roll capping it at the choice's moves, as the + stores it: addPlan):
  // under the hold the derived hold caps it so already; while Forkcast makes your transfers nothing else would, and the
  // solve would add its own GW-g moves (owner, 2026-10-13)
  if (!squad) {
    const now = c.moves.filter((m) => m.gw === g);
    extra.push(...chainOf(P, g, c.ends ?? now).chain.values(), ...now.map((m) => pinSell(m.out, g, P.end, { in: m.in })), pinRoll(g, now.length));
  }
  for (const [x, chip] of Object.entries(c.chips || {})) { const e = chipEdit(P, Number(x), chip); extra.push(...e.pins); drop.push(...e.drop); }
  // your Wildcard or Free Hit there, a choice that plays none: taken off as chipOff takes it (chipBackOf)
  if (chipBackOf(P, g, c)) { const o = chipOffParts(P, g, { locked: true }); extra.push(...o.pins); drop.push(...o.drop); }
  const cap = hitCap(P.base) ?? 2;
  // a later week with a hits rule of yours keeps it (the bake's cap has the same id, so it would replace "FT only" in
  // the fork's solve and the + take it back)
  const ruled = (y) => P.pins.some((p) => p.id === `hits:${y}`);
  // (none for a Wildcard under the hold: its squad lasts, so it is solved with your later weeks as they are, the squad
  // the + gets; nor for the roll it counts against, `held`: like with like, plansOf)
  const follow = !(P.mem?.hold && (c.chips?.[g] === 'wc' || c.held));
  if (follow) for (const x of P.gws.filter((y) => y > g && !SQUAD_CHIPS.has(c.chips?.[y]) && !squadWeek(weekOf(P, y)) && !ruled(y))) extra.push(pinHits(cap, x));
  // every choice's solve commits its own week only (`to`; owner, 2026-10-28): its number is the solver's count over GW
  // g's window (calls.counted), which later weeks never change, and its later weeks are your plan's (planOfRoad). A
  // roll's and a chip's too (owner, 2026-11-03, "why anytime goes to GW11–13", "fix bugs in fh / wc so they not use
  // other weeks")
  return { ...valuesFor(ctx, extra, drop), to: g };
}

// (the newest FORK_ROADS_MAX by their last use, keepNewest: a week drawn before an edit asked its solves first, and an
// Undo back to it needs them all again; twice 48)
const FORK_ROADS = new Map();  // valuesKey → Road | 'infeasible' | {failedAt}
const FORK_ROADS_MAX = 96;
/** A fork's solve ({key: valuesKey, values}): its road, 'infeasible' (no plan keeps your rules with the choice: kept
 *  for the forecast), 'error' (it failed, or no solve service / offline: the road plans stand), or null while it is
 *  asked (forkPump). A failure is asked again PAIR_HOLD_MS after it, the choices re-drawn then. */
/** A road already in hand that answers an ask of `values` (key `key`) with no solve: the model's plan (P.base) or one
 *  this page's solves brought (FORK_ROADS, the same data version), solved for exactly those values, or for fewer rules
 *  that it keeps already (rootStill: the best under looser rules that keeps the
 *  stricter ones is their best too) → road | null. 2026-11-03: the week's plan asked again as "already solved"; a
 *  Swap's "buy Evanilson, sell João Pedro GW10" solved though the plan makes that move; GW11's preparation solved again
 *  after each ✕ in GW10 though its GW10 squad, all 15 kept, had neither player ("why they not hit cache"). */
export function answeredBy(P, key, values) {
  const v = `${P.b?.version}|`, solved = [...FORK_ROADS].filter(([k, r]) => k.startsWith(v) && r?.weeks?.length && r.values).map(([, r]) => r);
  const model = P.base?.weeks?.length && P.base.values ? [P.base] : [];
  const r = model.find((x) => valuesKey(P, x.values) === key) ?? [...model, ...solved].find((x) => rootStill(x.values, values, x));
  if (r) globalThis.__fcTrace?.('answered', r.key);  // (the QA's solve audit: which solves were ever used)
  // (a road solved past the ask's last week (rootStill) answers it as its own solve would: those weeks and their terms,
  // its last week's window alone, as api/mobile_roads.road_cut)
  const to = num(values.to), cut = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([t, by]) => [t, Object.fromEntries(Object.entries(by ?? {}).filter(([x]) => Number(x) <= to))]).filter(([, by]) => Object.keys(by).length));
  const own = r && to != null && (r.values?.to == null || num(r.values.to) > to)
    ? { weeks: r.weeks.filter((w) => Number(w.gw) <= to), ...(r.objective ? { objective: cut(r.objective) } : {}), ...(r.windows ? { windows: Object.fromEntries(Object.entries(r.windows).filter(([x]) => Number(x) === to)) } : {}) }
    : {};
  return r ? { ...r, ...own, key, values } : null;
}
export function forkAsk(ctx, P, ask) {
  const { key } = ask;
  const sent = !FORK_ROADS.has(key) && answeredBy(P, key, ask.values);
  if (sent) return keepNewest(FORK_ROADS, key, sent, FORK_ROADS_MAX);
  const got = FORK_ROADS.get(key);
  if (got?.failedAt != null) {
    const left = got.failedAt + PAIR_HOLD_MS - Date.now();
    if (left > 0) { forkAgain(ctx, left); return 'error'; }
    FORK_ROADS.delete(key);
  } else if (got) { globalThis.__fcTrace?.('drawn', got.key); return keepNewest(FORK_ROADS, key, got, FORK_ROADS_MAX); }
  if (!ctx.api?.solve || ctx.store.get('conn')?.state === 'offline') return 'error';
  forkPump(ctx, P, ask);
  return null;
}
/** …as solved so far, never asked (plansOf's peek): its road, 'infeasible', 'error' (failed), or null (not solved). */
/** A road kept under `key` as if its solve had answered it (refusalRoads' root still the best under rules it already
 *  keeps: rootStill). */
export const forkKept = (key, road) => keepNewest(FORK_ROADS, key, road, FORK_ROADS_MAX);
/** Each week's references' last solves (plansOf: the roll, your transfers'), `${entry}|${g}|${forkKey}` → {version,
 *  values, road}: a reference under rules its last road already keeps (presolve.rootStill) is that road, no solve
 *  (2026-11-02: a card's lock in GW13 re-solved the roll that already kept him: 2 s greyed on a cold cache). */
export const FORK_REFS = new Map();
export const forkRead = (key) => { const got = FORK_ROADS.get(key); return got?.failedAt != null ? 'error' : got ?? null; };
/** The on-screen solves, the suggested plans' forks (purpose 'pair': queued above every prefetch, chip preparation and
 *  bake, jobs.VIEWED): lane 0 is PAIR.flight, in the speculative slot; a fork's ask also goes in lanes 1.. up to the
 *  bundle's meta.pair_lanes (api/mobile.py PAIR_LANES), each its own slot. A landing re-draws the choices
 *  (pairChanged), which asks the next; your plan's heal goes first; a sheet's solve keeps the speculative slot and
 *  every lane waits for it (api.whenFree); a refused or cancelled ask waits (PAIR.until). The next week's preparation
 *  (prepNext: `ask.prep`, purpose 'pairnext') takes only what the viewed week leaves: free lanes 1.., lane 0 only with
 *  the speculative slot free and no chip preparation waiting (prepsWaiting), never beside a Wish or options solve, with
 *  its own pause (PAIR.prepUntil). A viewed ask finding every lane busy takes one from another week's flight, or joins
 *  a preparation's solve in flight (asked again as 'pair', the job raised to VIEWED: api/mobile.py _ensure_solve,
 *  jobs.raise_priority), never solved twice. */
export const FORK_FLIGHTS = new Map();  // lane (1..) → {key, fork, cancel, gw, P, prep}
/** Every fork solve in flight as [lane, flight]: lane 0 while a fork holds PAIR.flight, then lanes 1.. */
export const forkFlights = () => [...(PAIR.flight?.fork ? [[0, PAIR.flight]] : []), ...FORK_FLIGHTS];
// (a solve's rules in words: what its values ask beyond `base`'s, by player and week)
function rulesWords(P, gw, values, base) {
  const set = (v) => new Set(String(v ?? '').split(',').filter(Boolean));
  const nm = (id) => P.L?.name?.(Number(id)) ?? id, squad = new Set((weekOf(P, gw)?.squad ?? []).map(Number));
  const span = (x) => { const [id, w] = x.split('@'); const [a, b] = (w ?? '').split('-'); return { id, at: a === b || !b ? `GW${a}` : `GW${a}-${b}` }; };
  const out = [];
  for (const [k, on, off] of [['must_have', 'keep', 'buy'], ['exclude', 'sell', 'not']]) {
    const now = set(values?.[k]), was = set(base?.[k]);
    for (const x of now) if (!was.has(x)) { const s = span(x); out.push(`${squad.has(Number(s.id)) ? on : off} ${nm(s.id)} ${s.at}`); }
    for (const x of was) if (!now.has(x)) { const s = span(x); out.push(`drop ${k === 'must_have' ? 'keep' : 'not'} ${nm(s.id)} ${s.at}`); }
  }
  // (rolls added and dropped both, in runs of weeks: "roll GW10, drop roll GW11-13"; owner, 2026-11-03, "what
  // difference in these": GW10's Roll choice, your GW11-13 rolls dropped, read "the plan as it stands")
  const roll = set(values?.no_buys_gw), rolled = set(base?.no_buys_gw);
  const runs = (gs) => [...gs].map(Number).sort((a, b) => a - b).reduce((rs, g) => (rs.at(-1)?.[1] === g - 1 ? (rs.at(-1)[1] = g) : rs.push([g, g]), rs), []).map(([a, b]) => (a === b ? `GW${a}` : `GW${a}-${b}`));
  const rolls = [...runs([...roll].filter((g) => !rolled.has(g))).map((at) => `roll ${at}`), ...runs([...rolled].filter((g) => !roll.has(g))).map((at) => `drop roll ${at}`)];
  // (a verb's run over one week grouped, its players named up to three: "keep 15 players GW10")
  const by = new Map();
  for (const x of out) { const [, v, rest] = /^(\S+(?: \S+)?) (.+) (GW[\d-]+)$/.exec(x) ? [, x.replace(/ .+$/, ''), x] : [, x, x]; const g = /GW[\d-]+$/.exec(x)?.[0] ?? ''; const k = `${v} ${g}`; by.set(k, [...(by.get(k) ?? []), rest]); }
  // (a transfer refused as its toast says it, "not Hill for Murillo GW10"; the rolls after the players, never counted among them)
  const was = set(base?.not_for), refused = [...set(values?.not_for)].filter((x) => !was.has(x)).map((x) => { const [g, o, i] = x.split(':'); return `not ${nm(i)} for ${nm(o)} GW${g}`; });
  return [...[...by].map(([k, xs]) => (xs.length > 3 ? `${k.split(' ')[0]} ${xs.length} players ${k.split(' ').at(-1)}` : xs.join(', '))), ...refused, ...rolls].join(', ');
}
// (what a solve asks beyond the plan as it stands, then your own rules it is solved under, apart: two lines in the same
// words the same solve; owner, 2026-11-03, "why these are different solves": GW11's preparation after each ✕ of yours
// read alike, the ✕ hidden in the plan as it stands)
function solveWords(ctx, P, ask) {
  let now = {}, free = {};
  try {
    now = valuesFor(ctx);
    free = memOf(ctx).values({ drop: P.pins.filter((p) => !derivedPin(p)).map((p) => p.id) });
  } catch { /* no plan memory: its rules whole */ }
  const asked = rulesWords(P, ask.gw, ask.values, now) || 'the plan as it stands', yours = rulesWords(P, ask.gw, now, free);
  return yours ? `${asked} · your rules: ${yours}` : asked;
}
export function forkPump(ctx, P, ask) {
  const prep = !!ask.prep;
  const same = forkFlights().find(([, f]) => f.key === ask.key);
  if (same && (prep || !same[1].prep)) return;
  if (P.healing) return;
  if (prep && tapSpent()) return;  // (asked again after your next tap: its draw asks it)
  if (leftBehind(ctx, P)) return;  // no timer: the new plan's bundle re-draws the choices, which asks its own
  const holder = ctx.api.slotHolder?.('spec') ?? (ctx.api.slotBusy?.('spec') ? 'busy' : null);
  const free = Array.from({ length: (P.b?.meta?.pair_lanes ?? 1) - 1 }, (_, i) => i + 1).find((i) => !FORK_FLIGHTS.has(i));
  // (refusalRoads' solves, `side`: the lanes 1.. alone where the plan service gives more than one, never lane 0,
  // whose speculative slot your team's own solves need (core.specRoad: P.bare, the tiles' "without your transfers");
  // none free: asked again on the next draw)
  const side = !!ask.side && (P.b?.meta?.pair_lanes ?? 1) > 1;
  // (…with every lane busy, the next week's preparation gives its lane up to them: the viewed week's ✕ first; owner,
  // 2026-11-02, "why nothing then after wait": Not Gibbs-White's next best asked only after the tap, GW11's
  // preparation in the lanes)
  // (never a prepared week's `need`, its roll and refs: the week it names next draws at once, owner, 2026-11-03)
  const sideYield = side && free === undefined ? forkFlights().find(([, f]) => f.prep && !f.side && !f.ahead && !f.need && f.gw !== ask.gw) ?? null : null;
  // (a viewed ask with every lane busy: another week's flight, the next week's preparation, or a tap's solve asked ahead
  // gives its lane up)
  const other = !same && !prep && !side && PAIR.flight && free === undefined ? forkFlights().find(([, f]) => (f.gw !== ask.gw || f.ahead) && !aheadWaited(f)) : null;
  // (a tap's solve asked ahead with every lane busy: the next week's preparation gives its lane up, asked again once
  // the taps' are in: prepNext; then a refusal solved ahead (refusalRoads, not its root: owner, 2026-11-02, a take's
  // own solve waited behind them); then one asked ahead that no source asks any more (its rules replaced: L5); for an open
  // sheet's, a week's tap asked ahead too: the sheet covers its plates)
  const yielded = !same && ask.ahead && free === undefined
    ? forkFlights().find(([, f]) => f.prep && !f.ahead && !f.need) ?? forkFlights().find(([, f]) => f.side && !f.root)
      ?? forkFlights().find(([, f]) => f.ahead && !aheadWaited(f) && !aheadAsks(f, P, ask.gw))
      ?? (ask.src === 'sheet' ? forkFlights().find(([, f]) => f.ahead && f.src === 'week' && !aheadWaited(f)) : null) ?? null : null;
  const lane = same ? same[0] : side ? free ?? sideYield?.[0] : prep ? free ?? (!PAIR.flight && !holder && !prepsWaiting(ctx, P) ? 0 : yielded?.[0])
    : !PAIR.flight ? 0 : free ?? other?.[0];
  if (lane === undefined) return;  // every lane busy: a landing re-draws the choices, which asks again
  if (holder && !(prep ? PREP_BESIDE : PAIR_TAKES).has(holder)) {
    const f = ctx.api.whenFree?.('spec');
    if (f) f.then(() => forkAgain(ctx, 0)); else forkAgain(ctx, PAIR_AGAIN_MS);
    return;
  }
  const pause = prep ? 'prepUntil' : 'until';
  const wait = Math.max(0, PAIR.until - Date.now(), prep ? PAIR.prepUntil - Date.now() : 0);
  if (wait > 0) { forkAgain(ctx, wait); return; }
  if (other) other[1].cancel?.();
  if (yielded && yielded[0] === lane) yielded[1].cancel?.();
  if (sideYield && sideYield[0] === lane) sideYield[1].cancel?.();
  const flight = { key: ask.key, fork: true, cancel: null, gw: ask.gw, P, prep, need: !!ask.need, ahead: !!ask.ahead, root: !!ask.root, side, src: ask.src ?? null };
  if (lane) FORK_FLIGHTS.set(lane, flight); else PAIR.flight = flight;
  const ours = () => (lane ? FORK_FLIGHTS.get(lane) : PAIR.flight) === flight;
  const purpose = ask.ahead ? 'presolve' : prep ? 'pairnext' : 'pair';
  if (ask.ahead) AHEAD.asked.push({ at: Date.now(), key: ask.key, src: ask.src });
  // (each named by the button or line it is for on the screen, owner 2026-11-05, "what means next x"; a week prepared
  // before you open it, "ahead", never "next week": its GW says which; owner, 2026-11-03, "what means gw11 and 'next
  // week' in same line")
  const p = solveKept(ctx.api, { entry: Number(P.entry), purpose, values: ask.values, ...(lane ? { lane } : {}) }, lane ? { slot: `fork${lane}` } : undefined,
    { gw: ask.gw, kind: ask.ahead ? ({ take: 'Make the swap', root: 'After the swap' }[ask.kind] ?? 'A tap, ahead') : ask.root ? 'The week\'s plan' : ask.side ? 'Show another' : `${ask.said ?? 'A choice'}${prep ? ', ahead' : ''}`, what: solveWords(ctx, P, ask), key: ask.key });
  flight.cancel = () => p.cancel?.();
  p.then((res) => {
      // a tap's solve asked ahead: its answer memory's for exactly those values (presolve); one that failed for another
      // reason than your rules is never asked again on this page (no cost: the tap heals as before)
      if (ask.ahead && (res.road || res.state === 'error')) {
        AHEAD.landed.add(ask.key);
        // (kept for the data version the plan service solved it on, never the one the view was drawn on (an older
        // code's roads could be served while it solved on the newer); none told, none kept)
        if (res.version != null) memOf(ctx).offer(res.road, { values: ask.values, error: res.error, version: res.version });
        // (one that can't be kept, an error not your rules' or no version told, is never asked again on this page)
        if (res.version == null || (!res.road && res.error?.code !== 'infeasible')) AHEAD.failed.add(ask.key);
      } else if (res.road || res.state === 'error') {
        keepNewest(FORK_ROADS, ask.key, res.road ?? (res.error?.code === 'infeasible' ? 'infeasible' : { failedAt: Date.now() }), FORK_ROADS_MAX);
      } else if (ours() && res.state === 'cancelled') {
        // (one the plan service dropped for another's room, never let go here: asked once more after the pause, then never
        // again on this page, no churn)
        if (ask.ahead && (AHEAD.dropped.set(ask.key, (AHEAD.dropped.get(ask.key) ?? 0) + 1).get(ask.key)) > 1) AHEAD.failed.add(ask.key);
        else PAIR[pause] = Date.now() + PAIR_AGAIN_MS;
      }
    }, () => { if (ours()) PAIR[pause] = Date.now() + PAIR_HOLD_MS; })
    .finally(() => {
      if (!ours()) return;
      if (lane) FORK_FLIGHTS.delete(lane); else PAIR.flight = null;
      // (a solve asked ahead changes nothing drawn: the next one asked in its lane, the choices re-drawn only once none
      // is left, so the next week's preparation takes the lane: prepNext)
      if (!ask.ahead || !pumpAhead(ctx)) pairChanged(ctx);
    });
}
/** The block re-drawn in `ms` (one timer), so its plans ask their next solve. */
let FORK_TIMER = null, FORK_DUE = 0;
export function forkAgain(ctx, ms) {
  if (FORK_TIMER) return;
  FORK_DUE = Date.now() + ms;
  FORK_TIMER = setTimeout(() => { FORK_TIMER = null; if (attach()?.ctx === ctx) pairChanged(ctx); }, ms);
}
/** When the block's re-draw (forkAgain) is due, null with none (the QA's solve-budget: the page quiet). */
export const forkDue = () => (FORK_TIMER ? FORK_DUE : null);
/** The fork solves' state (flights, landed roads, the pause, the retry timer) cleared: between the node tests
 *  (memory.test.mjs), where a solve one test's shell never answers would hold a lane the next test asks. */
export function resetForks() {
  for (const [, f] of forkFlights()) f.cancel?.();
  FORK_FLIGHTS.clear();
  PAIR.flight = null;
  PAIR.until = PAIR.prepUntil = 0;
  clearTimeout(FORK_TIMER);
  FORK_TIMER = null;
  FORK_ROADS.clear();
  FORK_REFS.clear();
  clearRoots();
  AHEAD.srcs.clear();
  AHEAD.failed.clear();
  AHEAD.showing.clear();
  AHEAD.at = null;
  AHEAD.asked = [];
  AHEAD.dropped.clear();
  AHEAD.landed.clear();
}
