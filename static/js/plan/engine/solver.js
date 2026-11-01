// engine.js: solver results and constraints

import { posName } from '../../ui.js';
import { CHIPS, FT_WEEKLY, HALF, LAST_ROUND, M, T, ids, num, playerLookup, posRank, seasonLong, sortedGws } from './squad.js';
import { chipAt, createDraft, movesAt, planGws } from './evaluate.js';

// ---------------------------------------------------------------- solver results

/** OUT → IN pairs, same position first, dearest first, one price by id (the solver's order: solve_tap.py), so the same
 *  players pair alike in any input order (owner, 2026-10-21); leftovers alone. `keep` ([{out, in}]): pairs made as
 *  given wherever both are there (a phone plan's own transfers). */
export function pairMoves(outIds, inIds, players, keep = []) {
  const L = playerLookup({ players });
  const order = (xs) => ids(xs).sort((a, b) => posRank(L.pos(a)) - posRank(L.pos(b)) || (L.price(b) ?? 0) - (L.price(a) ?? 0) || a - b);
  const outs = order(outIds), ins = order(inIds);
  const made = new Map();
  for (const m of keep) {
    const o = outs.indexOf(Number(m.out)), i = ins.indexOf(Number(m.in));
    if (o >= 0 && i >= 0 && L.pos(outs[o]) === L.pos(ins[i])) made.set(outs.splice(o, 1)[0], ins.splice(i, 1)[0]);
  }
  const pairs = order([...made.keys(), ...outs]).map((o) => {
    if (made.has(o)) return { out: o, in: made.get(o) };
    const i = ins.findIndex((p) => L.pos(p) === L.pos(o));
    return { out: o, in: i >= 0 ? ins.splice(i, 1)[0] : null };
  });
  return [...pairs, ...ins.map((p) => ({ out: null, in: p }))];
}

/**
 * The solve's rows {gw, t: TeamJSON} from its first GW on: committed rounds from meta.from, then the last anchor's
 * window plan (solve_tap.py Doc.committed / anchors).
 */
export function solverRows(result) {
  const committed = result?.committed || {};
  const gws = sortedGws(committed).filter((g) => committed[g]?.team);
  const from = num(result?.meta?.from) ?? gws[0];
  const rows = gws.filter((g) => g >= from).map((gw) => ({ gw, t: committed[gw].team }));
  const anchors = result?.anchors || {};
  const last = sortedGws(anchors).at(-1);
  const plan = last === undefined ? {} : anchors[last]?.plan || {};
  for (const gw of sortedGws(plan)) if (!committed[gw]) rows.push({ gw, t: plan[gw] });
  return rows;
}

/** Every player of the solve's rows, xp by GW as each row's own round saw it (its `pred` inputs). */
export function playersFromSolverResult(result) {
  const rows = solverRows(result);
  const by = new Map();
  for (const { gw, t } of rows) {
    const xg = ids(t.xp_gws);
    for (const [id, p] of Object.entries(t.players || {})) {
      const r = by.get(Number(id)) || { ...p, id: Number(id), xpBy: new Map() };
      xg.forEach((g, i) => { if (!r.xpBy.has(g) || g === gw) r.xpBy.set(g, p.xp?.[i] ?? null); });
      if (num(p.pred) !== null) r.xpBy.set(gw, Number(p.pred));
      by.set(Number(id), r);
    }
  }
  const players = [...by.values()].map(({ xpBy, ...p }) => {
    const xg = [...xpBy.keys()].sort((a, b) => a - b);
    return { ...p, xp_gws: xg, xp: xg.map((g) => xpBy.get(g)) };
  });
  return { horizon: rows.length ? ids(rows[0].t.xp_gws) : [], players };
}

/** From-scratch builds: every player bought, none sold (the lab's isBuild). */
const isBuild = (t) => !(t?.out || []).length && (t?.in || []).length >= 15;

/** The chips left at GW `first` after `played` [{chip, gw}]: chips.py:213-224 ChipAuto stock. */
function chipsLeft(season, first, played) {
  const lo = first > HALF ? HALF + 1 : 1;
  return CHIPS.filter((c) => !played.some((x) => x.chip === c && (seasonLong(season, c) || x.gw >= lo)));
}

/**
 * The team a solve started from, at its first GW (meta.from): the squad before that GW's moves with the sale prices,
 * bank and FTs the solver used. A fresh build: the built 15 at their prices, `fresh`, its free moves made.
 */
export function baseFromSolverResult(result) {
  const rows = solverRows(result);
  if (!rows.length) return null;
  const { gw, t } = rows[0];
  const meta = result?.meta || {};
  const P = t.players || {};
  const played = sortedGws(result?.committed)
    .filter((g) => g < gw && result.committed[g]?.team?.chip)
    .map((g) => ({ chip: result.committed[g].team.chip, gw: g }));
  const squadNow = ids([...(t.xi || []), ...(t.bench || [])]);
  const fresh = isBuild(t);
  let squad = squadNow, bankT = T(t.bank) ?? 0;
  if (!fresh) {
    // undo the first GW's moves: in-players back to the players they replaced, in their slots
    const pairs = pairMoves(t.out, t.in, { players: Object.values(P) });
    squad = squadNow.map((p) => pairs.find((m) => m.in === p)?.out ?? p);
    for (const p of ids(t.in)) bankT += T(t.purchase_prices?.[p] ?? P[p]?.price) ?? 0;
    for (const p of ids(t.out)) bankT -= T(t.sale_prices?.[p] ?? P[p]?.sell_price) ?? 0;
  }
  const xpGws = ids(t.xp_gws);
  return {
    season: num(meta.season),
    entry_id: num(meta.entry),
    gw,
    next_gw: num(meta.next_gw),
    fresh,
    bank: M(bankT),
    ft: num(t.ft_avail) ?? FT_WEEKLY,
    chips_used: played,
    chips_available: chipsLeft(meta.season, gw, played),
    horizon: xpGws,
    squad: squad.map((p) => {
      const r = P[p] || { id: p };
      const price = num(r.price);
      return {
        ...r,
        id: p,
        pos: posName(r.pos),
        sell_price: fresh ? price : num(r.sell_price) ?? price,
        purchase_price: num(t.purchase_prices?.[p]) ?? price,
        xp_gws: xpGws,
      };
    }),
  };
}

const hhmm = (sec) => {
  const d = num(sec) === null ? new Date() : new Date(Number(sec) * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * A solve as a draft over `base`: each GW's moves the diff of consecutive squads paired by position (a free hit's
 * squad is diffed but not carried: team.py:161, 175; solve_tap.py _net_moves), its chips and lineups. draft.solver
 * keeps per-GW pred and hits, first GW, argv, warnings.
 */
export function draftFromSolverResult(result, base, { name, players, keep = [] } = {}) {
  const b = base || baseFromSolverResult(result);
  const rows = solverRows(result);
  const meta = result?.meta || {};
  const L = playerLookup({ base: b, players: players ?? playersFromSolverResult(result) });
  const warnings = [];
  const first = Number(b?.gw ?? b?.next_gw);
  if (rows.length && Number.isFinite(first) && rows[0].gw !== first) {
    warnings.push(`the solve starts at GW${rows[0].gw}, the team is for GW${first}`);
  }
  const draft = { ...createDraft({ name: name ?? `Solver plan ${hhmm(meta.finished_at)}`, source: 'solver' }) };
  let prev = new Set(ids((b?.squad || []).map((r) => r.id)));
  const pred = {}, hits = {};
  for (const { gw, t } of rows) {
    const sq = ids([...(t.xi || []), ...(t.bench || [])]);
    const now = new Set(sq);
    const pairs = pairMoves([...prev].filter((p) => !now.has(p)), sq.filter((p) => !prev.has(p)), L, keep);
    const whole = pairs.filter((m) => m.out !== null && m.in !== null);
    if (whole.length !== pairs.length) warnings.push(`GW${gw}: the squad change does not pair by position`);
    if (whole.length) draft.moves[gw] = whole;
    if (CHIPS.includes(t.chip)) draft.chips[gw] = t.chip;
    draft.lineups[gw] = {
      xi: ids(t.xi), bench: ids(t.bench),
      ...(num(t.captain) !== null ? { captain: Number(t.captain) } : {}),
      ...(num(t.vice) !== null ? { vice: Number(t.vice) } : {}),
    };
    pred[gw] = num(t.pred);
    hits[gw] = num(t.hits);
    if (t.chip !== 'fh') prev = now;
  }
  draft.solver = {
    from: rows[0]?.gw ?? null, w: num(meta.w), pool: meta.pool ?? null, argv: meta.argv || result?.argv || [],
    finishedAt: num(meta.finished_at), pred, hits, warnings,
  };
  return draft;
}

// ---------------------------------------------------------------- solver constraints

/**
 * Keep / Avoid choices and (keepMoves) the draft's moves as --must-have / --exclude, in player_data.py:951-967
 * _parse_windowed's grammar "id@a-b,…" (a bare "@g" means g to GW38); solve.py:326-347 holds must-haves in the squad
 * and excluded players out in every round a..b. Keep / Avoid cover fromGw..horizonEnd. A move at GW g holds its
 * in-player and bars its out-player from g until a later (non free hit) move reverses it, or for g alone under a free
 * hit. A move overrides a Keep / Avoid on the same player for its GWs (warned): windows must not overlap
 * (player_data.py:772-781).
 */
export function constraintsFromDraft(draft, { keep = [], avoid = [], horizonEnd, fromGw = 1, keepMoves = true, players } = {}) {
  const end = num(horizonEnd) ?? LAST_ROUND;
  const from = num(fromGw) ?? 1;
  const name = players ? playerLookup({ players }).name : (id) => `#${id}`;
  const req = new Map();  // id → Map(gw → {want: 'in'|'out', why})
  const dropped = new Map();  // "why|kept|id" → GWs where a move overrides a Keep / Avoid
  const set = (id, g, want, why) => {
    if (!req.has(id)) req.set(id, new Map());
    const cur = req.get(id).get(g);
    // only a Keep / Avoid being overridden is news: a later move ending an earlier one's span is the plan
    if (cur && cur.want !== want && (cur.why === 'Keep' || cur.why === 'Avoid')) {
      const k = `${why}|${cur.why}|${id}`;
      dropped.set(k, [...(dropped.get(k) || []), g]);
    }
    req.get(id).set(g, { want, why });
  };
  const span = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  for (const p of ids(keep)) for (const g of span(from, end)) set(p, g, 'in', 'Keep');
  for (const p of ids(avoid)) for (const g of span(from, end)) set(p, g, 'out', 'Avoid');
  if (keepMoves) {
    const gws = sortedGws(draft?.moves).filter((g) => g >= from && g <= end);
    const later = (g, pred) => gws.find((x) => x > g && chipAt(draft, x) !== 'fh' && movesAt(draft, x).some(pred));
    for (const g of gws) {
      const fh = chipAt(draft, g) === 'fh';
      for (const m of movesAt(draft, g)) {
        const o = Number(m.out), n = Number(m.in);
        const sellsIn = later(g, (x) => Number(x.out) === n);
        const buysOut = later(g, (x) => Number(x.in) === o);
        for (const x of span(g, fh ? g : (sellsIn ?? end + 1) - 1)) set(n, x, 'in', `your GW${g} move`);
        for (const x of span(g, fh ? g : (buysOut ?? end + 1) - 1)) set(o, x, 'out', `your GW${g} move`);
      }
    }
  }
  const must = [], excl = [];
  for (const id of [...req.keys()].sort((a, b) => a - b)) {
    const byGw = req.get(id);
    const gws = [...byGw.keys()].sort((a, b) => a - b);
    let start = null;
    gws.forEach((g, i) => {
      start ??= g;
      const want = byGw.get(g).want;
      const next = gws[i + 1];
      if (next !== g + 1 || byGw.get(next).want !== want) {
        (want === 'in' ? must : excl).push(`${id}@${start}-${g}`);
        start = null;
      }
    });
  }
  const warnings = [...dropped].map(([k, gws]) => {
    const [why, kept, id] = k.split('|');
    const when = gws.length > 1 ? `GW${gws[0]}-${gws.at(-1)}` : `GW${gws[0]}`;
    return `${kept} ${name(id)} dropped for ${when}: ${why} says otherwise`;
  });
  return { must_have: must.join(','), exclude: excl.join(','), warnings };
}

/**
 * The values for POST /api/jobs {kind: 'solve', values}: the planned GWs from base.gw (--from-r, --w), all solved as
 * integers (--int-rounds H: the default relaxes later GWs, whose rounded plan can overspend), hit caps only where they
 * restrict (F17: --max-hits / --max-hits-gw below the default; maxHits, else hitCap = meta.hit_cap; no --hit-cost),
 * Keep / Avoid, kept moves and the draft's chips in the window (lists of GW strings). A chip with a default round
 * (meta.chip_defaults, main.py:691-696) that the draft doesn't play is set to '0' (main.py:758). A base without
 * entry_id (a fresh build) sends no --entry.
 */
export function solveValues({ base, draft, horizon = 4, maxHits = null, maxHitsGw = null, hitCap = null, keepMoves = false, keep = [], avoid = [], pool, chipDefaults, players } = {}) {
  const gws = planGws(base, horizon);
  const from = gws[0], end = gws.at(-1);
  const c = constraintsFromDraft(draft, { keep, avoid, horizonEnd: end, fromGw: from, keepMoves, players: playerLookup({ base, players }) });
  const values = { season: num(base?.season), from_r: from, w: gws.length, int_rounds: String(gws.length) };
  // F17: no --max-hits unless it restricts (main.py resolves its own default cap, hitCap)
  const dflt = num(hitCap);
  const hits = num(maxHits);
  if (hits !== null && hits !== dflt) values.max_hits = hits;
  // per-round caps (--max-hits-gw, main.py SolverArgs.max_hits_gw: a listed round's cap replaces the default there):
  // the window's rounds only, not those at that cap anyway (api/mobile.py hits_gw)
  const at = hits ?? dflt;
  const caps = gws.map((g) => [g, num(maxHitsGw?.[g])]).filter(([, n]) => n !== null && n !== at);
  if (caps.length) values.max_hits_gw = caps.map(([g, n]) => `${g}:${n}`).join(',');
  if (base?.entry_id != null) values.entry = String(base.entry_id);
  if (c.must_have) values.must_have = c.must_have;
  if (c.exclude) values.exclude = c.exclude;
  const defaults = chipDefaults?.[String(values.season)] || {};
  for (const chip of CHIPS) {
    const rounds = gws.filter((g) => chipAt(draft, g) === chip).map(String);
    if (rounds.length) values[chip] = rounds;
    else if (defaults[chip]?.length) values[chip] = ['0'];
  }
  if (pool) values.dir = pool;
  return { values, warnings: c.warnings };
}
