// engine.js: the solver's rules, players and lineups

import { POS, posName } from '../../ui.js';
import { pairMoves } from './solver.js';

// ---------------------------------------------------------------- the solver's rules

export const FT_WEEKLY = 1;      // rules.py:24 ft_weekly
export const FT_CAP = 5;         // rules.py:26 ft_cap
export const LAST_ROUND = 38;    // rules.py:28 last_round
export const HIT_COST = 4;       // rules.py:49 hit_cost_actual: what a hit REALLY costs in points (team.py:256: FPL's −4);
                                 // never sent to the solver, which prices a hit itself (F17: the bundle's meta.hit_cost)
export const MAX_PER_CLUB = 3;   // rules.py:93 max_per_team
export const HALF = 19;          // chips.py:48: chips refill after GW19
export const CHIPS = ['wc', 'fh', 'bb', 'tc'];  // chips.py:47 (that tuple's order is wc, bb, fh, tc)
export const MAX_HORIZON = 5;    // api/data.py:38 HORIZON: the pools forecast h0..h4
const SEASON_LONG = { 2024: ['fh', 'bb', 'tc'] };  // chips.py:50 _SEASON_LONG
/** {pos: [squad count, XI min, XI max]}: rules.py:103-108 pos_limits. */
export const POS_LIMITS = { GK: [2, 1, 1], DEF: [5, 3, 5], MID: [5, 2, 5], FWD: [3, 1, 3] };
const XI_SIZE = 11;              // rules.py:96 starter_size

/** FTs granted into GW gw: 5 at 2025's GW16 (rules.py:148-149), else the weekly one. */
export const ftGrant = (season, gw) => (Number(season) === 2025 && Number(gw) === 16 ? 5 : FT_WEEKLY);
/** FTs at the next GW from this one's (rules.py:176-177 next_ft, applied by team.py:87). */
export const nextFt = (avail, used, grant = FT_WEEKLY) => Math.min(FT_CAP, avail - used + grant);
/** 1 for GW1-19, 2 after (chips.py:216-217). */
export const chipHalf = (gw) => (Number(gw) <= HALF ? 1 : 2);
export const seasonLong = (season, chip) => (SEASON_LONG[Number(season)] || []).includes(chip);

// ---------------------------------------------------------------- small helpers

const EMPTY = Object.freeze({});
export const num = (v) => (v === null || v === undefined || v === '' || typeof v === 'boolean' || !Number.isFinite(Number(v)) ? null : Number(v));
export const T = (m) => (num(m) === null ? null : Math.round(Number(m) * 10));
export const M = (t) => (t === null || t === undefined ? null : Math.round(t) / 10);
export const money = (t) => `£${(Math.abs(t) / 10).toFixed(1)}m`;
export const sum = (xs) => xs.reduce((s, x) => s + x, 0);
export const ids = (xs) => (Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : []);
export const sortedGws = (o) => Object.keys(o || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
export const posRank = (pos) => { const i = POS.indexOf(pos); return i < 0 ? 9 : i; };
let idSeq = 0;
export const newId = () => `d${Date.now().toString(36)}${(++idSeq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------------------------------------------------------------- players

function rowsOf(players) {
  if (!players) return [[], []];
  if (players instanceof Map) return [[...players.values()], []];
  if (Array.isArray(players)) return [players, []];
  if (Array.isArray(players.players)) return [players.players, ids(players.horizon)];
  if (Array.isArray(players.fields) && Array.isArray(players.rows)) {
    const f = players.fields;
    return [players.rows.map((r) => Object.fromEntries(f.map((k, i) => [k, r[i]]))), ids(players.horizon)];
  }
  return [Object.values(players), []];
}

function record(row, gws) {
  const price = num(row.price) ?? num(row.solver_price);
  return {
    id: Number(row.id),
    name: row.name ?? `#${row.id}`,
    pos: posName(row.pos),
    club: row.club ?? null,
    clubId: num(row.club_id),
    price,
    priceT: T(price),
    xp: Array.isArray(row.xp) ? row.xp : [],
    xpGws: Array.isArray(row.xp_gws) ? ids(row.xp_gws) : gws,
    row,
  };
}

function buildLookup(base, players) {
  const [rows, gws] = rowsOf(players);
  const baseGws = ids(base?.horizon);
  const by = new Map();
  const sellT = new Map();
  for (const r of base?.squad || []) {
    by.set(Number(r.id), record(r, baseGws));
    sellT.set(Number(r.id), T(r.sell_price) ?? T(r.price));
  }
  for (const r of rows) {
    if (r?.id == null) continue;
    const rec = record(r, gws);
    const had = by.get(rec.id);
    // the players payload wins; a base row fills what it lacks
    if (had && !rec.xp.length) { rec.xp = had.xp; rec.xpGws = had.xpGws; }
    if (had) { rec.pos ??= had.pos; rec.club ??= had.club; rec.clubId ??= had.clubId; rec.price ??= had.price; rec.priceT ??= had.priceT; }
    by.set(rec.id, rec);
  }
  const get = (id) => by.get(Number(id));
  return {
    get,
    has: (id) => by.has(Number(id)),
    name: (id) => get(id)?.name ?? `#${id}`,
    pos: (id) => get(id)?.pos ?? null,
    club: (id) => get(id)?.club ?? null,
    price: (id) => get(id)?.price ?? null,
    priceT: (id) => get(id)?.priceT ?? null,
    /** What an owned-at-base player sells for, in tenths (undefined for anyone else). */
    sellT: (id) => sellT.get(Number(id)) ?? undefined,
    /** xP for GW gw (null when the player or that GW has no forecast; a blank GW is 0 in the data). */
    xp(id, gw) {
      const r = get(id);
      if (!r) return null;
      const i = r.xpGws.indexOf(Number(gw));
      return i < 0 ? null : num(r.xp[i]);
    },
    horizon: gws.length ? gws : baseGws,
    all: () => [...by.values()],
  };
}

const LOOKUPS = new WeakMap();
const isLookup = (x) => x && typeof x.get === 'function' && typeof x.pos === 'function' && typeof x.xp === 'function';

/** Player facts by id over base.squad and the players payload, memoised per (players, base). */
export function playerLookup({ base, players } = {}) {
  if (isLookup(players)) return players;
  const kp = players && typeof players === 'object' ? players : EMPTY;
  const kb = base && typeof base === 'object' ? base : EMPTY;
  let inner = LOOKUPS.get(kp);
  if (!inner) LOOKUPS.set(kp, (inner = new WeakMap()));
  let L = inner.get(kb);
  if (!L) inner.set(kb, (L = buildLookup(base, players)));
  return L;
}

const posFn = (posOf) => (typeof posOf === 'function' ? posOf : playerLookup({ players: posOf }).pos);

// ---------------------------------------------------------------- lineups

/** 1 GK, DEF 3-5, MID 2-5, FWD 1-3, 11 in all (rules.py:103-108; team.py:274-276). */
export function validFormation(xi, posOf) {
  const pos = posFn(posOf);
  if (!Array.isArray(xi) || xi.length !== XI_SIZE || new Set(xi.map(Number)).size !== XI_SIZE) return false;
  const n = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of xi) {
    const k = pos(p);
    if (!(k in n)) return false;
    n[k] += 1;
  }
  return Object.entries(POS_LIMITS).every(([k, [, lo, hi]]) => n[k] >= lo && n[k] <= hi);
}

/** XI by (position, xp desc) as team.py:179 orders starters; bench GK first, then xp desc (team.py:180). */
const orderXi = (xi, xpOf, posOf) => [...xi].sort((a, b) => posRank(posOf(a)) - posRank(posOf(b)) || xpOf(b) - xpOf(a));
const orderBench = (bench, xpOf, posOf) => [...bench].sort((a, b) => (posOf(a) !== 'GK') - (posOf(b) !== 'GK') || xpOf(b) - xpOf(a));
/** GK to the first bench slot, the outfield order kept (solve.py:319 open_slots; api/entry.py:520-521). */
const gkFirst = (bench, posOf) => [...bench].sort((a, b) => (posOf(a) !== 'GK') - (posOf(b) !== 'GK'));

/**
 * The highest-xp legal XI of a squad: team.py:99-127 best_xi. Each position sorted by xp, every count from its XI
 * minimum to maximum walked in GK, DEF, MID, FWD order; the first best total wins.
 */
export function bestXI(squad, xpOf, posOf) {
  const pos = posFn(posOf);
  const xp = (p) => num(xpOf(p)) ?? 0;
  const byPos = new Map();
  for (const p of ids(squad)) {
    const k = pos(p);
    if (!byPos.has(k)) byPos.set(k, []);
    byPos.get(k).push(p);
  }
  for (const list of byPos.values()) list.sort((a, b) => xp(b) - xp(a));
  const limits = Object.entries(POS_LIMITS);
  let best = { total: -Infinity, xi: [] };
  const walk = (i, left, total, picked) => {
    if (i === limits.length) {
      if (left === 0 && total > best.total) best = { total, xi: picked };
      return;
    }
    const [k, [, lo, hi]] = limits[i];
    const avail = byPos.get(k) || [];
    for (let n = lo; n <= Math.min(hi, avail.length, left); n++) {
      const sel = avail.slice(0, n);
      walk(i + 1, left - n, total + sum(sel.map(xp)), [...picked, ...sel]);
    }
  };
  walk(0, XI_SIZE, 0, []);
  if (!best.xi.length) return { xi: [], bench: [], total: 0 };
  const inXi = new Set(best.xi);
  return {
    xi: orderXi(best.xi, xp, pos),
    bench: orderBench(ids(squad).filter((p) => !inXi.has(p)), xp, pos),
    total: best.total,
  };
}

/**
 * A saved lineup mapped onto this GW's squad: a player no longer there is replaced by whoever replaced him (this
 * plan's moves), else by an unplaced squad player of his position; null if it can't cover the squad.
 */
function repairLineup(xi, bench, squad, replacedBy, pos) {
  const inSquad = new Set(squad);
  const used = new Set();
  const follow = (p) => {
    let q = p;
    const seen = new Set();
    while (!inSquad.has(q) && replacedBy.has(q) && !seen.has(q)) { seen.add(q); q = replacedBy.get(q); }
    return inSquad.has(q) && !used.has(q) ? q : null;
  };
  const place = (list) => list.map((p) => { const q = follow(p); if (q !== null) used.add(q); return q; });
  const xi0 = ids(xi), bench0 = ids(bench);
  const xi1 = place(xi0), bench1 = place(bench0);
  const fill = (orig, got) => got.map((q, i) => {
    if (q !== null) return q;
    const want = pos(orig[i]);
    const r = squad.find((p) => !used.has(p) && (want === null || pos(p) === want));
    if (r !== undefined) used.add(r);
    return r ?? null;
  });
  const xi2 = fill(xi0, xi1);
  if (xi2.includes(null)) return null;
  const bench2 = bench0.length ? fill(bench0, bench1).filter((p) => p !== null) : [];
  const rest = squad.filter((p) => !used.has(p));
  return { xi: xi2, bench: [...bench2, ...rest], ordered: bench0.length > 0 };
}

/** The GW's lineup: the saved one repaired onto the squad, else the best XI; `pick` (id, gw) → xP ranks. */
export function lineupFor(L, gw, squad, saved, replacedBy, warnings, pick = L.xp) {
  const xpOf = (p) => num(pick(p, gw)) ?? 0;
  const pos = L.pos;
  let xi = null, bench = null;
  if (saved && Array.isArray(saved.xi) && saved.xi.length) {
    const fixed = repairLineup(saved.xi, saved.bench, squad, replacedBy, pos);
    if (fixed && validFormation(fixed.xi, pos) && fixed.xi.length + fixed.bench.length === squad.length) {
      xi = [...fixed.xi].sort((a, b) => posRank(pos(a)) - posRank(pos(b)));  // rows by position, order kept within
      bench = fixed.ordered ? gkFirst(fixed.bench, pos) : orderBench(fixed.bench, xpOf, pos);
    } else {
      warnings.push('the saved lineup no longer fits this squad: best XI used');
    }
  }
  if (!xi) ({ xi, bench } = bestXI(squad, xpOf, pos));
  if (xi.length !== XI_SIZE) warnings.push('the squad cannot field a legal XI');
  const byXp = [...xi].sort((a, b) => xpOf(b) - xpOf(a));  // stable: ties keep XI order
  const savedCap = num(saved?.captain), savedVice = num(saved?.vice);
  const captain = savedCap !== null && xi.includes(savedCap) ? savedCap : (byXp[0] ?? null);
  const vice = savedVice !== null && xi.includes(savedVice) && savedVice !== captain
    ? savedVice : (byXp.find((p) => p !== captain) ?? null);
  return { xi, bench, captain, vice };
}

/**
 * A saved lineup on a week's squad, as evaluate() plays it (lineupFor): the saved XI and bench repaired onto the
 * squad, or the week's own when they no longer fit; the saved captain and vice when they start, else the week's, else
 * the XI's top xP. week: a Road week ({in, out}) or a GwState / view week ({moves}).
 */
export function applyLineup(week, saved, players) {
  const L = playerLookup({ players });
  const own = { xi: ids(week?.xi), bench: ids(week?.bench), captain: num(week?.captain), vice: num(week?.vice) };
  const squad = [...own.xi, ...own.bench];
  const moves = Array.isArray(week?.moves) ? week.moves.filter((m) => m.ok !== false) : pairMoves(week?.out, week?.in, L);
  const replacedBy = new Map(moves.filter((m) => m.out != null && m.in != null).map((m) => [Number(m.out), Number(m.in)]));
  const arm = { captain: num(saved?.captain) ?? own.captain, vice: num(saved?.vice) ?? own.vice };
  if (ids(saved?.xi).length && ids(saved?.bench).length) {
    const warnings = [];
    const lu = lineupFor(L, week.gw, squad, { xi: ids(saved.xi), bench: ids(saved.bench), ...arm }, replacedBy, warnings);
    if (!warnings.length) return lu;
  }
  return lineupFor(L, week?.gw, squad, { ...own, ...arm }, replacedBy, []);
}

/** XI ↔ bench (or two outfield bench players) swapped, or null if that breaks the formation. */
export function swapLineup(state, aId, bId, posOf) {
  const pos = posFn(posOf);
  const a = Number(aId), b = Number(bId);
  const xi = ids(state?.xi), bench = ids(state?.bench);
  if (a === b) return null;
  const ia = xi.indexOf(a), ib = xi.indexOf(b), ja = bench.indexOf(a), jb = bench.indexOf(b);
  if (ia >= 0 && jb >= 0) { xi[ia] = b; bench[jb] = a; }
  else if (ib >= 0 && ja >= 0) { xi[ib] = a; bench[ja] = b; }
  else if (ja >= 0 && jb >= 0) {
    if (pos(a) === 'GK' || pos(b) === 'GK') return null;
    bench[ja] = b; bench[jb] = a;
  } else return null;
  if (!validFormation(xi, pos)) return null;
  return { xi, bench: gkFirst(bench, pos) };
}

/** The squad players `id` can swap with (swapLineup not null). */
export function swapCandidates(state, id, posOf) {
  return [...ids(state?.xi), ...ids(state?.bench)].filter((p) => p !== Number(id) && swapLineup(state, id, p, posOf));
}
