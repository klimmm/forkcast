// memory.js: the default plan, values and roads

import * as E from '../../plan/engine.js';
import { COPY, hitBook, hitCap } from '../calls.js';
import { chipName } from '../../ui.js';
import { capsOf, composePins, parseSpans, spanString, heldAt, ids, idsKey, isExact, isRoll, kindOf, makePin, movedAt, movesIn, num, parseCaps, pinFrozen, range, rollKeeps, scopeOf, span, squadKey, squadOf, weekAt } from './pins.js';
import { sigOf } from './drift.js';

// ================================================================ the default plan: your team, no transfers

/**
 * "No transfers unless you add them" (owner, 2026-10-08): the pin 'hold' derived from your pins `list` (never stored;
 * Memory puts it first while the plan holds, accepted.hold). Over GW A..end, the squad going into each GW known from
 * yours:
 *   · no pin of yours moves anyone (movedAt): rolled (values.no_buys_gw);
 *   · all moves exact ones of yours: holds the squad they make (15 must-haves);
 * · your moves plus a sale whose buy the plan picks (Replace's "Let Forkcast choose"): holds the rest of the squad,
 * the planner choosing only that buy (buys capped at your moves); after it the squad is the solve's;
 * · another ask moves someone (a Wish, a veto of a player you have) or a hits rule lifts the hold: the planner's week;
 * after it the squad is unknown, so a later week of exact moves is the planner's too (under no hit: hits 0);
 * · a Wildcard or Free Hit week is the chip's (a Free Hit's squad is thrown away: the squad after it stays known); a
 * Roll keeps its own.
 * From the first week of your exact moves on, each week the hold makes may leave the bank below 0 (`debts`,
 * values.debt_gw: --debt-gw), as FPL lets a draft stand short of money until confirmed (owner, 2026-10-28); a week the
 * planner plans pays it back. Every plan under it is the solver's (replan). → {pin (or null: nothing to hold)}
 */
export function holdOf(list = [], { A, end, owned = [] } = {}) {
  const user = (list || []).filter((p) => p && p.id !== 'hold');
  const c = composePins(user, { from: A, to: end });
  const rp = user.find((p) => p.id === 'road' && p.locked);
  const frozen = rp ? pinFrozen(rp, A) : [];
  let squad = ids(owned), known = true;
  const rolls = [], must = [], excl = [], hits = {}, caps = {}, debts = [];
  // owes: a week of your exact moves came before (debts)
  let owes = false;
  const owe = (g) => { if (owes) debts.push(g); };
  for (const g of range(A, end)) {
    const chip = c.chips[g];
    if (frozen.includes(g)) {
      // a frozen week (an older document's) holds its own squad; one that makes no transfer is a rolled week too
      const held = heldAt(rp.must, g);
      if (known && idsKey(held) === idsKey(squad)) rolls.push(g);
      squad = held; known = true;
      owe(g);
      continue;
    }
    if (chip === 'wc') { known = false; continue; }
    if (chip === 'fh') continue;
    if (c.rolls.includes(g)) { owe(g); continue; }  // your Roll: no transfer there
    const free = user.some((p) => kindOf(p) === 'hits' && Object.keys(p.hits || {}).map(Number).includes(g));
    // an exact move of yours moves someone in its own GW only (its "still yours in g − 1" is the week before's, not a
    // move there)
    const moving = known ? user.filter((p) => !['road', 'chip', 'cash', 'hits', 'roll'].includes(kindOf(p)) && (!isExact(p) || num(p.gw) === g) && movedAt(p, g, squad).length)
      : user.filter((p) => ['sell', 'slide', 'wish'].includes(kindOf(p)) && num(p.gw) === g);
    if (!free && !moving.length) { rolls.push(g); owe(g); continue; }
    if (!free && known && moving.every(isExact)) {
      const outs = new Set(moving.map((p) => Number(kindOf(p) === 'slide' ? p.out : p.player)));
      const ins = moving.map((p) => Number(kindOf(p) === 'slide' ? p.player : p.in));
      squad = [...squad.filter((x) => !outs.has(x)), ...ins.filter((x) => !squad.includes(x))];
      must.push(...squad.map((x) => [x, g, g]));
      owes = true;
      owe(g);
      continue;
    }
    // a sale of yours whose buy Forkcast picks (Replace's "Let Forkcast choose", ahead.sellAny; owner, 2026-10-13),
    // with any exact moves that week: the rest of the squad stays (must-haves) and buys are capped at your moves
    // (--max-buys-gw), so the planner picks only that buy; the squad after it is the solve's
    const open = (p) => kindOf(p) === 'sell' && p.in == null;
    if (!free && known && moving.some(open) && moving.every((p) => isExact(p) || open(p))) {
      const outs = new Set(moving.map((p) => Number(kindOf(p) === 'slide' ? p.out : p.player)));
      const ins = moving.filter(isExact).map((p) => Number(kindOf(p) === 'slide' ? p.player : p.in));
      must.push(...[...squad.filter((x) => !outs.has(x)), ...ins.filter((x) => !squad.includes(x))].map((x) => [x, g, g]));
      caps[g] = moving.length;
      known = false;
      continue;
    }
    // a week of your exact moves after a week the planner chose (squad unknown): those moves, in that week only: each
    // sale kept until then, each buy not made before, buys capped at your moves (--max-buys-gw). Its squad stays
    // unknown.
    if (!free && !known && moving.length && moving.every(isExact)) {
      for (const p of moving) {
        const o = Number(kindOf(p) === 'slide' ? p.out : p.player), i = Number(kindOf(p) === 'slide' ? p.player : p.in);
        if (g > A) {
          must.push([o, ids(owned).includes(o) ? A : g - 1, g - 1]);
          excl.push([i, A, g - 1]);
        }
      }
      caps[g] = moving.length;
      owes = true;
      owe(g);
      continue;
    }
    // the planner's week: its squad is the solve's
    if (!free && !known) hits[g] = 0;
    known = false;
  }
  if (!rolls.length && !must.length && !excl.length && !Object.keys(hits).length && !Object.keys(caps).length) return { pin: null };
  const pin = makePin({ id: 'hold', kind: 'hold', label: 'No transfers unless you add them', gw: A, must, excl, hits, rolls, ...(Object.keys(caps).length ? { caps } : {}), ...(debts.length ? { debts } : {}) });
  return { pin };
}

/** GW g's lineup as a solve has it for squad `sq` under `chip`: the first of solved `roads` whose week g holds the same
 *  15 and chip → {xi, bench, captain, vice} | null (ahead.js asTaken). */
export function solvedLineup(roads, g, sq, chip) {
  const k = idsKey(sq);
  const w = roads.filter((r) => r?.weeks?.length).map((r) => weekAt(r, g)).find((x) => x && squadKey(x) === k && (x.chip ?? null) === chip);
  return w ? { xi: ids(w.xi), bench: ids(w.bench), captain: num(w.captain), vice: num(w.vice) } : null;
}

// ================================================================ values and roads

/**
 * engine.solveValues for your pins over the planned GWs (api/mobile.py clean_values whitelists them): the base values
 * (chip defaults '0'), your hit caps per GW where they restrict (--max-hits-gw; elsewhere the solver's
 * default cap, hitCap of the model's plan), your chips through a draft (setChip), your windows, your Rolls (no_buys_gw "7,8"), the
 * weeks whose bank may go below 0 (debt_gw "9,10": the hold's) and cash. A Wildcard or Free Hit week sends neither
 * hits cap nor Roll.
 */
/** The first plan's values, the solver's best with no rule of yours: GW A alone under the hold (planDefault 'hold', the
 *  app's), as every other solve its own week. The card reads it, each later week solves its own plan, and GW11-13 were
 *  three more solves in a row the first card waited on: 10.5 s against 3.65 s, the same transfer (owner, 2026-11-05, "why
 *  these solved"). */
export const firstPlanValues = (cctx, planDefault = 'hold') => {
  const values = planValues(cctx, []);
  return planDefault === 'hold' ? { ...values, to: values.from_r } : values;
};
/** Excludes `spec` ("id@a-b,…") less the weeks no rule could ever put him in: a player you don't have, in a week that
 *  every week from the plan's first, `from`, up to it makes no buy (rolled: --no-buys-gw), is not in your squad there
 *  whatever the solver does, so "not him" those weeks binds nothing; the span starts at the first week that can buy.
 *  owner, 2026-11-09: GW13's swap of Muharemović → Murillo solved with "not Murillo GW11-12" under no buys in
 *  GW11-12 ("if not buys in gw11-12 how it will buy murillo"). → the excludes left ('' none) */
export function unbuyableDropped(spec, rolls, from, squad = []) {
  if (!spec) return '';
  const owned = new Set(ids((squad || []).map((s) => s?.id ?? s))), rolled = new Set(ids(rolls));
  let free = from;
  while (rolled.has(free)) free++;
  return spanString(parseSpans(spec).map(([id, a, b]) => [id, owned.has(id) ? a : Math.max(a, free), b]).filter(([, a, b]) => a <= b));
}
/** The hold's weeks that may leave the bank below 0 (composePins' debts) where your exact moves up to each (its for_gw)
 *  leave it short: your bank (a cash rule's, else the team's), each sale's price in, each buy's out. → [gw] */
function shortWeeks(cctx, c) {
  if (!c.debts.length) return [];
  const L = E.playerLookup({ base: cctx.base, players: cctx.players });
  const moves = String(c.for_gw ?? '').split(',').filter(Boolean).map((t) => t.split(':').map(Number));
  let bank = c.cash != null ? Number(c.cash) / 10 : Number(cctx.base?.bank ?? 0);
  const short = new Set();
  for (const g of cctx.gws) {
    for (const [x, out, inn] of moves) if (x === g) bank += (L.sellT(out) ?? L.priceT(out) ?? 0) / 10 - (L.price(inn) ?? 0);
    if (bank < -1e-9) short.add(g);
  }
  return c.debts.filter((g) => short.has(Number(g)));
}
export function planValues(cctx, list) {
  const gws = cctx.gws;
  const c = composePins(list, { from: gws[0], to: gws.at(-1) });
  let draft = E.createDraft({ name: 'Your plan' });
  for (const [g, chip] of Object.entries(c.chips)) draft = E.setChip(draft, Number(g), chip);
  const { values } = E.solveValues({
    base: cctx.base, draft, horizon: gws, maxHitsGw: c.hits, hitCap: hitCap(cctx.model),
    chipDefaults: cctx.meta?.chip_defaults, players: cctx.players,
  });
  if (c.sent_must) values.must_have = c.sent_must;  // (a held week capped at your moves: their buys alone, composePins)
  const exclude = unbuyableDropped(c.sent_exclude, c.rolls, gws[0], cctx.base?.squad);
  if (exclude) values.exclude = exclude;
  if (c.for_gw) values.for_gw = c.for_gw;  // (your exact moves as transfers: --for-gw, composePins)
  if (c.rolls.length) values.no_buys_gw = c.rolls.join(',');
  const capped = Object.entries(c.caps).sort(([a], [b]) => a - b);
  if (capped.length) values.max_buys_gw = capped.map(([g, n]) => `${g}:${n}`).join(',');
  // (a week the hold makes may leave the bank below 0 only where your own transfers so far do: your bank, each exact
  // move's sale price in and buy price out, week by week; owner, 2026-11-09, "what the fuck is '-debt-gw' - fix": it
  // went on every week from your first transfer, short or not)
  const debts = shortWeeks(cctx, c);
  if (debts.length) values.debt_gw = debts.join(',');
  if (c.not_for) values.not_for = c.not_for;
  if (c.cash !== null) values.cash = c.cash;
  // Settings → Solver gap: this GW's and later GWs', where not exact (planInputs' gap); the solve's own one is picked when
  // it is asked, its `to` known (api.js solveGap)
  if (cctx.gap?.now > 0) values.gap = cctx.gap.now;
  if (cctx.gap?.later > 0) values.later_gap = cctx.gap.later;
  return values;
}

/** A road's hit cap per GW of `gws` as solved: {gw: cap} (values.max_hits, or the round's values.max_hits_gw); null
 *  where it sent none (the solver's default cap). */
export function roadCaps(v, gws) {
  const own = parseCaps(v?.max_hits_gw);
  return Object.fromEntries(gws.map((g) => [g, num(own[g]) ?? num(v?.max_hits)]));
}

/**
 * The weeks of a solved road whose hits are not the planner's own call under the caps it was solved under (roadCaps; a
 * GW with none takes the solver's default cap): more hits than the caps allow, or a hit they allow that the planner
 * never priced (its objective has no hit term there) → [{gw, hits, cap (null: the default), allowed (the caps cover
 * the hits: only the pricing is off), ft (free transfers its result counts there), buys, cause, from}], said plainly
 * wherever its GW is. cause 'relief': the planner priced the hit itself (rolling._solve_relief); 'moved': the planner
 * took the hit in another GW (from: [{gw, hits}], calls.hitBook) and kept this week's free transfer, while FPL's order
 * books it here; else null. gws: the GWs to read (default: the road's). [] for a road without its solve values.
 */
export function forcedHits(road, gws = (road?.weeks || []).map((w) => Number(w.gw))) {
  if (!road?.values || !road.weeks?.length) return [];
  const caps = roadCaps(road.values, gws);
  const book = new Map((hitBook(road) || []).map((b) => [b.gw, b]));
  const relief = road.planner ? !!road.planner.relief : true;  // a road stored before planner: any priced week over its cap
  return road.weeks.filter((w) => {
    const g = Number(w.gw), n = num(w.hits) ?? 0;
    return gws.includes(g) && n > 0 && (n > (caps[g] ?? Infinity) || (book.get(g)?.unpriced ?? 0) > 0);
  }).map((w) => {
    const g = Number(w.gw), cap = caps[g] ?? null, b = book.get(g);
    const cause = b?.from.length && !b.unpriced ? 'moved' : relief && b?.lp > 0 ? 'relief' : null;
    return { gw: g, hits: num(w.hits), cap, allowed: cap === null || num(w.hits) <= cap, ft: num(w.ft_avail), buys: ids(w.in).length, cause, from: b?.from ?? [] };
  });
}

/**
 * The rules of `list` that are no rule over GW from..to → [id]: a hits or Roll rule in a Wildcard or Free Hit GW, and
 * a hits rule at or above the solver's default cap (hitCap). normalizeAccepted cleans a saved plan of them on load.
 */
export function idleRules(list = [], { from = 1, to = E.LAST_ROUND, hitCap = null } = {}) {
  const chips = composePins(list, { from, to }).chips;
  const remade = (g) => chips[g] === 'wc' || chips[g] === 'fh';
  return (list || []).filter((p) => {
    if (isRoll(p)) return remade(num(p.gw));
    if (kindOf(p) !== 'hits') return false;
    const caps = capsOf(p, from, to);
    return caps.length > 0 && caps.every(([g, n]) => remade(g) || (hitCap !== null && n >= hitCap));
  }).map((p) => p.id);
}

const chipRounds = (v, chip) => [].concat(v?.[chip] ?? []).map(String).filter((g) => g !== '0').sort().join(',');

/** "7,8" (a road's values.no_buys_gw) → [7, 8]. */
const parseRolls = (spec) => String(spec ?? '').split(',').map((t) => Number(t.trim())).filter((g) => Number.isInteger(g) && g > 0);

/**
 * Whether `road` is your plan without a solve: solved for the same GWs, hits, chips and cash, under windows and Rolls
 * all among yours, and its squads keep all of yours (and make no transfer in a GW you roll: movesIn); then it is
 * optimal for yours too.
 */
export function roadFits(road, c, gws) {
  const v = road?.values;
  if (!v || !road.weeks?.length || !sameOptions(v, c, gws, road)) return false;
  const own = ownPins(v, gws);
  for (const [id, byGw] of own.cells) for (const [g, { want }] of byGw) if (c.cells.get(id)?.get(g)?.want !== want) return false;
  if (parseRolls(v.no_buys_gw).some((g) => !c.rolls.includes(g)) || c.rolls.some((g) => movesIn(road, g))) return false;
  // a week capped at your moves (holdOf): the road makes no more there and was solved under no cap we lack
  const buysAt = (g) => { const w = weekAt(road, g); return w ? ids(w.in).length : 0; };
  if (Object.entries(c.caps ?? {}).some(([g, n]) => buysAt(Number(g)) > n)) return false;
  if (String(v.max_buys_gw ?? '').split(',').filter(Boolean).some((t) => { const [g, n] = t.split(':').map(Number); return !(c.caps?.[g] <= n); })) return false;
  // a road solved letting a week's bank go below 0 (debt_gw, holdOf) is short there only where your plan lets it be
  if (parseRolls(v.debt_gw).some((g) => !c.debts?.includes(g) && (num(weekAt(road, g)?.bank) ?? 0) < -1e-9)) return false;
  // a road solved refusing a transfer you don't refuse, or making one you do
  const refused = c.notFor ?? [];
  if (String(v.not_for ?? '').split(',').filter(Boolean).some((t) => !refused.includes(t))) return false;
  if (refused.some((t) => { const [g, o, i] = t.split(':').map(Number), w = weekAt(road, g); return ids(w?.out).includes(o) && ids(w?.in).includes(i); })) return false;
  return brokenCells(road, c).length === 0;
}

/** A road's own rules, its solve values' --must-have / --exclude, composed over GWs `gws` (once per values). */
const ownPins = (v, gws) => (solvedFor(v, gws).own ??= composePins([{ id: 'road', must: v.must_have || '', excl: v.exclude || '' }], { from: gws[0], to: gws.at(-1) }));

/** Solves this page has asked (solveKept, the one place it asks): what a tap has started so far (presolve.js SOLVE_MAX). */
export const SOLVES = { asked: 0 };
/** What Transfer on a suggested card makes, brought back with the solve that suggested it (`swap` asked: api/mobile_bundle.py
 *  _swap, its weeks then its last week's squad rolled), by that solve's road key → {weeks: {GW g: {road}}, version}; presolve.js
 *  presolveSwap keeps it under the values Transfer will ask (owner, 2026-11-12, "fix so lineups are provided by solve
 *  suggested this transfer not by some other make the swap request and in both ahead and no ahead modes"). */
export const SWAPS = new Map();
const SWAPS_MAX = 64;

/**
 * api.solve, except that a road missing a player it was solved to have (its own values' --must-have: brokenCells 'in')
 * resolves as the error it is, {state: 'error', road: null, error: {code: 'infeasible', plain, detail, dropped}}: an
 * exclude beats a must-have in the solver (solve.py add_per_player) and its bench-buy guard (rolling.py
 * _bench_buy_round) re-solves with the bench buy excluded, so "Do it anyway" for a bench player would come back
 * without him. Every phone solve goes through here (RULES_V2 §5: nothing you said is silently dropped). `dropped`:
 * [{id, gw}] earliest GW first (Ahead's status row names the first). Keeps .cancel().
 */
// (what each purpose's solve is for, in the ?solves=1 panel's words, where its caller says nothing more: the server
// logs every ask with them, GET /api/m/solves)
export const SOLVE_KINDS = { heal: 'Your team', chip: 'your chip', cash: 'your bank', wish: 'a wish', speculative: 'without your transfers', chipprep: 'a chip, ahead', pair: 'a choice', pairnext: 'a choice, ahead', presolve: 'a tap, ahead', plan: 'the plan' };
/** The asks this page answered with no solve of their own, for the ?solves=1 panel beside the server's list (ahead/
 *  solvelog.js): ask key → {at, gw, kind, what, byKey (the answering road's solve key, as the panel names solves), job
 *  (its solve's job: when it ran)}; owner, 2026-11-09, "fix so no solves are missing from the list", "what other solves
 *  'clear' and / or logs missing". */
export const ANSWERED = new Map();
export function noteAnswer(key, said, road) {
  if (key == null) return;
  // (its first answer's time: a re-plan answering it again on every draw never moves its line)
  ANSWERED.set(key, { at: ANSWERED.get(key)?.at ?? Date.now(), ...said, byKey: String(road?.from ?? road?.key ?? '').slice(-8), job: road?.job ?? null });
}
export function solveKept(api, args, opts, said = {}) {
  SOLVES.asked++;
  const p = api.solve({ ...args, said: { gw: said.gw ?? (Number(args.values?.from_r) || null), kind: said.kind ?? SOLVE_KINDS[args.purpose] ?? args.purpose, what: said.what ?? 'your rules as set' } }, opts);
  const q = p.then((r) => {
    if (r?.swap && r.road?.key != null && r.version != null) {
      SWAPS.delete(r.road.key);
      SWAPS.set(r.road.key, { weeks: r.swap, version: r.version });
      for (const k of SWAPS.keys()) { if (SWAPS.size <= SWAPS_MAX) break; SWAPS.delete(k); }
    }
    const v = r?.road?.values;
    const gws = (r?.road?.weeks || []).map((w) => Number(w.gw));
    const broken = r?.state === 'done' && v && gws.length ? brokenCells(r.road, ownPins(v, gws)).filter((x) => x.want === 'in') : [];
    if (!broken.length) return r;
    const g = Math.min(...broken.map((x) => x.gw));
    const dropped = broken.map((x) => ({ id: x.id, gw: x.gw })).sort((a, b) => a.gw - b.gw);
    return { ...r, state: 'error', road: null, error: { code: 'infeasible', plain: COPY.infeasible(g), detail: `the solve dropped ${broken.map((x) => `${x.id}@${x.gw} ${x.want}`).join(', ')}`, dropped } };
  });
  q.cancel = p.cancel;
  return q;
}

/** The cells of composed pins `c` (composePins) a road's squads break: [{id, gw, want, pin}] (a player kept out
 *  that it has, or held in that it hasn't, or a GW it doesn't plan). */
export function brokenCells(road, c) {
  const out = [];
  for (const [id, byGw] of c.cells) {
    for (const [g, { want, pin }] of byGw) {
      const w = weekAt(road, g);
      if (!w || squadOf(w).includes(id) !== (want === 'in')) out.push({ id, gw: g, want, pin });
    }
  }
  return out;
}

/** The pins (of `list`) a road ignores over GW from..to: a cell it breaks (brokenCells) or a chip it doesn't play where
 *  the pin plans one. Hits and cash allow, never require: never broken. A Roll is broken by a road that makes a
 *  transfer there (movesIn), or more than the moves of yours it keeps. */
export function rulesBroken(road, list = [], { from, to } = {}) {
  const c = composePins(list, { from, to });
  const ids0 = new Set(brokenCells(road, c).map((x) => x.pin));
  for (const p of list) {
    const rg = num(p.gw);
    if (isRoll(p) && rg !== null && rg >= from && rg <= to && movesIn(road, rg, c.caps[rg] ?? 0)) ids0.add(p.id);
    // the hold's own rolled and capped weeks (holdOf; the drift counts the hold among your rules)
    const inside = (g) => Number(g) >= from && Number(g) <= to;
    if (!isRoll(p)) for (const g of p.rolls || []) if (inside(g) && movesIn(road, Number(g))) ids0.add(p.id);
    if (!isRoll(p)) for (const [g, n] of Object.entries(p.caps || {})) if (inside(g) && movesIn(road, Number(g), Number(n))) ids0.add(p.id);
    for (const [g, chip] of Object.entries(p.chips || {})) {
      if (Number(g) < from || Number(g) > to) continue;
      const has = weekAt(road, g)?.chip ?? null;
      if (chip === 'none' ? has !== null : has !== chip) ids0.add(p.id);
    }
  }
  return list.filter((p) => ids0.has(p.id));
}

/**
 * A rule in words, for the "Your rules" chips and sheet (RULES_V2 §4): {icon (ui.js ICONS name), text (the chip),
 * desc, removable, scope ('gw' | 'all' for a Keep or a veto)}. nameOf(id) names players; start / end: the plan's first
 * and last GW.
 */
export function ruleText(p, nameOf = (id) => `#${id}`, { end, start, cap = null, hold = false } = {}) {
  const r = ruleWords(p, nameOf, { end, start, cap, hold });
  // a rule the alternative you picked came with (never hidden inside the call)
  return p?.via ? { ...r, desc: `${r.desc} It came with the alternative you picked; picking another takes it back.`, via: true } : r;
}

function ruleWords(p, nameOf, { end, start, cap = null, hold = false } = {}) {
  const nm = (id) => nameOf(Number(id));
  const to = end ?? Math.max(...[...(p.must || []), ...(p.excl || [])].map(([, , b]) => b), Number(p.gw) || 0);
  const kind = kindOf(p);
  const g = num(p.gw);
  switch (kind) {
    case 'road':
      if (p.locked) {
        const f = pinFrozen(p, g), many = f.length > 1;
        return { icon: 'lock', text: `${span(f)} frozen`, desc: `${span(f)} ${many ? 'are' : 'is'} as you froze ${many ? 'them' : 'it'}. Turn off Freeze GW${f[0]} to change ${many ? 'them' : 'it'}.`, removable: false };
      }
      return { icon: 'check', text: `GW${g}: ${p.label || 'your pick'}`, desc: `The move you picked for GW${g}.`, removable: true };
    case 'veto': case 'never': {
      const sc = scopeOf(p, { start, end: to });
      const one = /^GW\d+$/.test(sc);
      return { icon: 'ban', text: `Not ${nm(p.player)}${sc ? ` · ${sc}` : ''}`, scope: one ? 'gw' : 'all', removable: true,
        desc: one ? `The plan doesn't buy ${nm(p.player)} in ${sc}; it may later.` : `The plan never buys ${nm(p.player)}${g ? ` in ${COPY.range(g, to)}` : ''}.` };
    }
    case 'notfor':
      return { icon: 'ban', text: `Not ${nm(p.player)} for ${nm(p.out)} · GW${g}`, removable: true,
        desc: `The plan doesn't swap ${nm(p.out)} for ${nm(p.player)} in GW${g}. ${nm(p.player)} can still come for someone else, and ${nm(p.out)} can still go for someone else.` };
    case 'keep': {
      const sc = scopeOf(p, { start, end: to });
      const one = /^GW\d+$/.test(sc);
      // a Keep's whole window reads as its scope button does, its span ("GW6–9", COPY.span), never "all weeks"; "holds"
      // is the plan's own choice, never a rule of yours
      const win = !sc || sc === 'all weeks' || sc.startsWith('from') ? span([Math.max(g ?? 0, start ?? 0) || to, to]) : sc;
      return { icon: 'lock', text: `Keep ${nm(p.player)}${sc ? ` · ${sc === 'all weeks' ? win : sc}` : ''}`, scope: one ? 'gw' : 'all', removable: true,
        desc: one ? `The plan keeps ${nm(p.player)} in ${sc}; it may sell him in another week.` : `Forkcast never sells ${nm(p.player)} in ${win}.` };
    }
    case 'sell':
      // an exact sale has the name its row and toasts give it ("Saka → B.Fernandes · GW9", ahead.rowName); a sale with
      // no buy stays "Sell Saka from GW9"
      return { icon: 'arrow', text: p.in != null ? `${nm(p.player)} → ${nm(p.in)} · GW${g}` : `Sell ${nm(p.player)} from GW${g}`,
        desc: p.in != null ? `${nm(p.player)} goes in GW${g} and ${nm(p.in)} comes in.` : `${nm(p.player)} goes in GW${g}; the plan picks his replacement.`, removable: true };
    case 'wish':
      // a Wildcard or Free Hit week's pick (ahead.wishPin's `chip`): him in that week's squad alone
      if (p.chip) return { icon: 'plus', text: `${nm(p.player)} in your GW${g} ${chipName(p.chip)}`, desc: `${nm(p.player)} is in your GW${g} ${chipName(p.chip)} squad; the chip picks the rest.`, removable: true };
      return { icon: 'plus', text: `${nm(p.player)} from GW${g}`, desc: `The plan brings ${nm(p.player)} in by GW${g} and keeps him through GW${to}.`, removable: true };
    case 'slide':
      return { icon: 'swap', text: p.label || `${nm(p.out)} → ${nm(p.player)} in GW${g}`, desc: `That move is made in GW${g}.`, removable: true };
    case 'chip': {
      const [cg, c] = Object.entries(p.chips || {})[0] || [g, null];
      return c && c !== 'none' ? { icon: 'play', text: `${c.toUpperCase()} · GW${cg}`, desc: `${chipName(c)} is planned for GW${cg}.`, removable: true }
        : { icon: 'stop', text: `No chip · GW${cg}`, desc: `No chip in GW${cg}.`, removable: true };
    }
    case 'roll':
      // a suggested plan's + (see pinRoll); one may keep your exact moves there
      return { icon: 'reset', text: COPY.rollRule(g, rollKeeps(p)), removable: true,
        desc: rollKeeps(p) ? `Forkcast adds no transfers of its own in GW${g}.` : `Forkcast makes no transfers in GW${g}: the free transfer rolls on.` };
    case 'hits': {
      // a restriction of the solver's default (cap: meta.hit_cap), which the GW takes again without it
      const [[cg, n] = [g, p.max_hits || 1]] = Object.entries(p.hits || {});
      // under the hold the week goes back to Off without it (holdOf), never "(default)"
      const without = hold ? ` Without it: no transfers in GW${cg}.`
        : cap != null ? ` Without it: ${COPY.defaultHits(cap, cg).replace(/^U/, 'u')}.` : '';
      if (!num(n)) return { icon: 'minus', text: `${COPY.segFreeOnly} · GW${cg}`, desc: `${COPY.gwNote.free(cg)}${without}`, removable: true };
      return { icon: 'minus', text: `Up to −${E.HIT_COST * n} · GW${cg}`, desc: `${COPY.hitsUpTo(n, cg)} only: the plan takes a hit only where its count says it pays.${without}`, removable: true };
    }
    case 'cash':
      return { icon: 'info', text: `Bank as FPL shows`, desc: 'Your plan starts from the bank FPL showed you.', removable: true };
    default:
      return { icon: 'info', text: p.label || kind || 'rule', desc: p.label || '', removable: true };
  }
}

/** The solved road that is your plan (roadFits): the model's plan (memory model) first, then one of `also` (roads
 *  this page solved: Memory.offer); null when it needs a solve. */
export function findRoad(model, c, gws, also = []) {
  // the model's part, once per road and what the pins ask (sigOf: all roadFits reads): an edit's replan and the plan
  // view's options road ask the same
  let by = MODEL_FIT.get(model ?? MODEL_FIT);
  if (!by) MODEL_FIT.set(model ?? MODEL_FIT, (by = new Map()));
  const k = `${gws.join(',')}#${sigOf(c)}`;
  if (!by.has(k)) by.set(k, model?.weeks?.length && roadFits(model, c, gws) ? model : null);
  return by.get(k) ?? also.filter((r) => r?.weeks?.length).find((r) => roadFits(r, c, gws)) ?? null;
}
const MODEL_FIT = new WeakMap();

/** Whether a road was solved (values v) for the same GWs and the same options as composed pins c: hit caps per GW,
 *  chips, cash (what a plan may do, as against the windows that hold it in). */
function sameOptions(v, c, gws, road = null) {
  if (num(v.from_r) !== gws[0] || num(v.w) !== gws.length) return false;
  const { caps, chips } = solvedFor(v, gws);
  // the same cap per GW: a rule's, or none (the solver's default) on both sides; or a tighter cap of yours the road's
  // week keeps anyway (no more hits there)
  const capFits = (g) => {
    const mine = c.hits[g] ?? null, its = caps[g];
    if (mine === its) return true;
    const hits = num(weekAt(road, g)?.hits);
    return mine !== null && (its === null || mine < its) && hits !== null && hits <= mine;
  };
  if (!gws.every(capFits) || (num(v.cash) ?? null) !== c.cash) return false;
  const want = chipsAsked(c);
  return E.CHIPS.every((chip) => chips[chip] === want[chip]);
}
/** What a road was solved for over `gws`, read once per its solve values (findRoad reads every bundle road per edit):
 *  hit caps (roadCaps), each chip's rounds (chipRounds) and, once asked, its own windows composed (roadFits). */
const SOLVED_FOR = new WeakMap();
function solvedFor(v, gws) {
  const k = gws.join(',');
  let by = SOLVED_FOR.get(v);
  if (!by) SOLVED_FOR.set(v, (by = new Map()));
  if (!by.has(k)) by.set(k, { caps: roadCaps(v, gws), chips: Object.fromEntries(E.CHIPS.map((chip) => [chip, chipRounds(v, chip)])), own: null });
  return by.get(k);
}
/** Composed pins' chips as chipRounds writes a road's: {chip: "7,9"}, once per composition. */
const CHIPS_ASKED = new WeakMap();
function chipsAsked(c) {
  if (!CHIPS_ASKED.has(c)) CHIPS_ASKED.set(c, Object.fromEntries(E.CHIPS.map((chip) => [chip, Object.entries(c.chips).filter(([, x]) => x === chip).map(([g]) => g).sort().join(',')])));
  return CHIPS_ASKED.get(c);
}

/** The pins your rules' cost keeps: what a plan may do, your options (chips, cash) and a locked GW A (ink, never one of
 *  your rules). A hits rule is a restriction (below the solver's default cap), so it is one of your rules, like a Roll,
 *  and its cost counts. */
export const optionPins = (list = []) => (list || []).filter((p) => (p.id === 'road' && !!p.locked) || ['chip', 'cash'].includes(kindOf(p)));

/**
 * The planner's best plan with your options and a locked GW A (optionPins) and none of your rules: the model's plan (or
 * one of `also`) that is that plan (findRoad: solved for the same options under no window but the lock's), else null.
 * Your rules' cost is measured against it (≥ 0 by construction). optionsValues(cctx, list): the solve values of those
 * pins alone.
 */
export function optionsRoad(model, list, gws, also = []) {
  return findRoad(model, composePins(optionPins(list), { from: gws[0], to: gws.at(-1) }), gws, also);
}
export const optionsValues = (cctx, list) => planValues(cctx, optionPins(list));
