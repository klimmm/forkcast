// engine.js: drafts, chips and the evaluation

import { CHIPS, FT_WEEKLY, HIT_COST, LAST_ROUND, M, MAX_HORIZON, MAX_PER_CLUB, T, chipHalf, ftGrant, ids, lineupFor, money, newId, nextFt, num, playerLookup, seasonLong, sortedGws, sum } from './squad.js';

// ---------------------------------------------------------------- drafts (immutable)

export function createDraft({ name = 'My plan', source = 'manual', id } = {}) {
  return { id: id ?? newId(), name, source, created: Date.now(), moves: {}, chips: {}, lineups: {} };
}



/** draft with draft[field][gw] = value (undefined drops the key). */
function withGw(draft, field, gw, value) {
  const next = { ...(draft?.[field] || {}) };
  if (value === undefined) delete next[String(gw)];
  else next[String(gw)] = value;
  return { ...draft, [field]: next };
}

export const movesAt = (draft, gw) => (Array.isArray(draft?.moves?.[gw]) ? draft.moves[gw] : []);
export const chipAt = (draft, gw) => (CHIPS.includes(draft?.chips?.[gw]) ? draft.chips[gw] : null);

/** Sell outId for inId in GW gw, kept net per GW (the solver counts transfers as net buys, team.py:91). */
export function applyMove(draft, gw, outId, inId) {
  const o = Number(outId), n = Number(inId);
  if (!Number.isFinite(o) || !Number.isFinite(n) || o === n) return draft;
  const list = movesAt(draft, gw).map((m) => ({ out: Number(m.out), in: Number(m.in) }));
  const j = list.findIndex((m) => m.in === o);   // selling a player bought this GW: A→o, o→n = A→n
  const k = list.findIndex((m) => m.out === n);  // buying back a player sold this GW: n→B, o→n = o→B
  if (j >= 0) {
    if (list[j].out === n) list.splice(j, 1);
    else list[j] = { out: list[j].out, in: n };
  } else if (k >= 0) {
    if (list[k].in === o) list.splice(k, 1);
    else list[k] = { out: o, in: list[k].in };
  } else list.push({ out: o, in: n });
  return withGw(draft, 'moves', gw, list.length ? list : undefined);
}


/** Play `chip` in GW gw (null clears it). One per half: the same chip elsewhere in gw's half moves here (a season-long
 * 2024 chip is checked by canUseChip / evaluate). */
export function setChip(draft, gw, chip) {
  if (chip && !CHIPS.includes(chip)) throw new Error(`unknown chip ${chip}`);
  const chips = { ...(draft?.chips || {}) };
  if (chip) {
    for (const [g, c] of Object.entries(chips)) {
      if (c === chip && Number(g) !== Number(gw) && chipHalf(g) === chipHalf(gw)) delete chips[g];
    }
    chips[String(gw)] = chip;
  } else delete chips[String(gw)];
  return { ...draft, chips };
}


export function setLineup(draft, gw, patch) {
  if (patch === null) return withGw(draft, 'lineups', gw, undefined);
  const cur = { ...(draft?.lineups?.[gw] || {}), ...(patch || {}) };
  for (const k of Object.keys(cur)) if (cur[k] === null || cur[k] === undefined) delete cur[k];
  for (const k of ['xi', 'bench']) if (cur[k]) cur[k] = ids(cur[k]);
  for (const k of ['captain', 'vice']) if (cur[k] !== undefined) cur[k] = Number(cur[k]);
  return withGw(draft, 'lineups', gw, Object.keys(cur).length ? cur : undefined);
}

// ---------------------------------------------------------------- chips

/**
 * Whether `chip` can be planned for GW gw. One per half (chips.py:216-224, HALF = 19), once a season for 2024's
 * fh/bb/tc (chips.py:50); in base.gw's own half (or season) only the chips /api/entry lists as left.
 */
export function canUseChip({ base, draft, gw, chip } = {}) {
  if (!CHIPS.includes(chip)) return { ok: false, reason: `unknown chip ${chip}` };
  const label = chip.toUpperCase();
  const g = Number(gw);
  const first = Number(base?.gw ?? base?.next_gw);
  const long = seasonLong(base?.season, chip);
  const other = sortedGws(draft?.chips).find((x) => x !== g && draft.chips[x] === chip && (long || chipHalf(x) === chipHalf(g)));
  if (other !== undefined) return { ok: false, reason: `${label} is already planned for GW${other}` };
  const left = base?.chips_available;
  if (Array.isArray(left) && (long || chipHalf(g) === chipHalf(first)) && !left.includes(chip)) {
    return { ok: false, reason: `${label} is already used this ${long ? 'season' : 'half'}` };
  }
  return { ok: true, reason: '' };
}

// ---------------------------------------------------------------- evaluation

/** The GWs a plan covers: `horizon` GWs from base.gw (1..5, never past GW38), or the GW list given. */
export function planGws(base, horizon = 4) {
  if (Array.isArray(horizon)) return ids(horizon).sort((a, b) => a - b);
  const first = Number(base?.gw ?? base?.next_gw);
  if (!Number.isFinite(first)) return [];
  const n = Math.max(1, Math.min(MAX_HORIZON, Math.round(num(horizon) ?? 4)));
  return Array.from({ length: n }, (_, i) => first + i).filter((g) => g <= LAST_ROUND);
}

/**
 * A GW's points: team.py:256-264 calc_pts. XI + the captain once more (twice under TC) + the bench only under BB,
 * minus HIT_COST per hit. xpOf(id, gw) → xP (null / missing counts 0).
 */
export function weekPoints(week, xpOf) {
  const v = (p) => num(xpOf(p, week?.gw)) ?? 0;
  const cap = num(week?.captain);
  const xiPts = sum(ids(week?.xi).map(v));
  const capPts = cap === null ? 0 : v(cap) * (week?.chip === 'tc' ? 2 : 1);
  const benchPts = week?.chip === 'bb' ? sum(ids(week?.bench).map(v)) : 0;
  return xiPts + capPts + benchPts - HIT_COST * (num(week?.hits) ?? 0);
}

/** One move on working copies of the squad and its sale prices; prices in tenths. */
function applyOne(L, squad, sale, m) {
  const o = Number(m?.out), n = Number(m?.in);
  const idx = squad.indexOf(o);
  if (idx < 0) return { ok: false, reason: `${L.name(o)} is not in the squad` };
  if (squad.includes(n)) return { ok: false, reason: `${L.name(n)} is already in the squad` };
  if (!L.has(n) || L.priceT(n) === null) return { ok: false, reason: `no price for player ${L.name(n)}` };
  if (L.pos(o) !== L.pos(n)) return { ok: false, reason: `${L.name(o)} (${L.pos(o)}) and ${L.name(n)} (${L.pos(n)}) play different positions` };
  const sellT = sale.get(o) ?? L.priceT(o) ?? 0;
  const buyT = L.priceT(n);
  squad[idx] = n;
  sale.delete(o);
  sale.set(n, buyT);
  return { ok: true, sellT, buyT };
}

/** The clubs a squad has too many of. The cap is the solver's, max(max_per_team, the club's players held at the anchor)
 *  (solve.py:834-845), none held under a wildcard, a free hit or a fresh build. */
function overClubs(L, squad, held = []) {
  const count = (ps) => {
    const n = new Map();
    for (const p of ps) { const c = L.club(p); if (c) n.set(c, (n.get(c) || 0) + 1); }
    return n;
  };
  const h = count(held);
  return [...count(squad)].filter(([c, k]) => k > Math.max(MAX_PER_CLUB, h.get(c) || 0)).map(([c, k]) => ({ club: c, count: k }));
}

/**
 * The draft played out over the planned GWs, accounted as the solver's Team does (team.py:84-97, 155-176, 208-264).
 */
export function evaluate({ base, players, draft, horizon = 4, xp: xpAt, fixedLineups = false, banksOnly = false } = {}) {
  const L = playerLookup({ base, players });
  const score = typeof xpAt === 'function' ? (id, g) => num(xpAt(id, g)) : L.xp;
  const pick = fixedLineups ? L.xp : score;
  const gws = planGws(base, horizon);
  const season = base?.season;
  const warnings = [];
  const first = Number(base?.gw ?? base?.next_gw);
  if (gws.length && Number.isFinite(first) && gws[0] !== first) warnings.push(`the plan starts at GW${gws[0]}, the team is for GW${first}`);
  for (const g of new Set([...sortedGws(draft?.moves), ...sortedGws(draft?.chips)])) {
    if (!gws.includes(g) && (movesAt(draft, g).length || chipAt(draft, g))) warnings.push(`GW${g} is outside the planned GWs and is ignored`);
  }

  // state carried into each GW: squad (ordered), sale prices (tenths), bank (tenths), FTs
  let squad = ids((base?.squad || []).map((r) => r.id));
  const held = base?.fresh === true ? [] : [...squad];  // owned at the anchor (solve.py owned_at_anchor)
  let sale = new Map(squad.map((p) => [p, L.sellT(p) ?? L.priceT(p) ?? 0]));
  let bank = T(base?.bank) ?? 0;
  let ft = num(base?.ft) ?? FT_WEEKLY;
  let replacedBy = new Map();
  let prevUsed = 0;
  const out = [];

  gws.forEach((gw, i) => {
    // FTs roll in with this GW's grant (team.py:87; api/entry.py:343 gives base.ft for the first GW)
    if (i > 0) ft = nextFt(ft, prevUsed, ftGrant(season, gw));
    const w = [];
    const chip = chipAt(draft, gw);
    if (chip) { const c = canUseChip({ base, draft, gw, chip }); if (!c.ok) w.push(c.reason); }
    // a wildcard, a free hit and a fresh build's first GW are unlimited (team.py:88-89; solve.py:564)
    const free = chip === 'wc' || chip === 'fh' || (i === 0 && base?.fresh === true);

    const sq = [...squad], sp = new Map(sale), repl = new Map(replacedBy);
    let bk = bank;
    const moves = movesAt(draft, gw).map((m) => {
      const r = applyOne(L, sq, sp, m);
      if (r.ok) { bk += r.sellT - r.buyT; repl.set(Number(m.out), Number(m.in)); }
      else w.push(`move ${L.name(m.out)} → ${L.name(m.in)} skipped: ${r.reason}`);
      return { out: Number(m.out), in: Number(m.in), ok: r.ok, reason: r.ok ? '' : r.reason, sell: M(r.sellT), buy: M(r.buyT), xpDelta: 0 };
    });
    const before = new Set(squad), after = new Set(sq);
    const bought = sq.filter((p) => !before.has(p));
    const sold = squad.filter((p) => !after.has(p));
    // team.py:88-93: transfers are the net buys; a wildcard / free hit "uses" ft_weekly, no hits
    const transfers = bought.length;
    const used = free ? FT_WEEKLY : Math.min(ft, transfers);
    const hits = free ? 0 : Math.max(0, transfers - ft);

    if (bk < 0) w.push(`over budget by ${money(bk)}`);
    for (const { club, count } of overClubs(L, sq, free ? [] : held)) w.push(`${count} players from ${club} (max ${MAX_PER_CLUB})`);
    if (banksOnly) out.push({ gw, chip, squad: sq, bank: M(bk), ft, transfers, used, hits, moves, bought, sold, warnings: w, ok: !w.length });
    else {
      const lineup = lineupFor(L, gw, sq, draft?.lineups?.[gw], repl, w, pick);
      const xp = {};
      for (const p of sq) {
        const v = score(p, gw);
        if (v === null) w.push(`no forecast for ${L.name(p)}: counted as 0`);
        xp[p] = v ?? 0;
      }
      // `gross` (no hits) is the solver's `pred`; `points` nets the hits (weekPoints)
      const gross = weekPoints({ ...lineup, chip }, (p) => xp[p]);
      const hitCost = HIT_COST * hits;

      out.push({
        gw, chip, squad: sq, ...lineup, bank: M(bk), ft, transfers, used, hits, hitCost, moves, bought, sold,
        points: gross - hitCost, gross, xp, sell: Object.fromEntries([...sp].map(([p, t]) => [p, M(t)])),
        warnings: w, ok: !w.length,
      });
    }
    // a free hit's squad and bank are thrown away; its FT accounting is not (team.py:161, 175)
    if (chip !== 'fh') { squad = sq; sale = sp; bank = bk; replacedBy = repl; }
    prevUsed = used;
  });

  if (banksOnly) return { gws: out, warnings: [], ok: true };
  // each move's xP gain over the plan: in − out for its GW on (its GW alone under a free hit)
  for (const s of out) {
    const span = s.chip === 'fh' ? [s.gw] : gws.filter((g) => g >= s.gw);
    for (const m of s.moves) if (m.ok) m.xpDelta = sum(span.map((g) => (score(m.in, g) ?? 0) - (score(m.out, g) ?? 0)));
  }
  for (const s of out) for (const x of s.warnings) warnings.push(`GW${s.gw}: ${x}`);
  return { gws: out, total: sum(out.map((s) => s.points)), warnings, ok: !warnings.length };
}

/** {gw: bank} of a draft (evaluate's, £m after each GW's moves): its accounting alone, lineups and points unscored. */
export const planBanks = (o) => Object.fromEntries(evaluate({ ...o, banksOnly: true }).gws.map((s) => [s.gw, s.bank]));
