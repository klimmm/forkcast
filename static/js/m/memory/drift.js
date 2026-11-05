// memory.js: legality, drift, the pencil diff, the journal and documents

import * as E from '../../plan/engine.js';
import { COPY, planFromRoad, compare as compareIn, OUT, statusText } from '../calls.js';
import { chipName, fmt, statusInfo } from '../../ui.js';
import { EPS, clone, composePins, frozenWeeks, ids, num, pinRoad, splitItems, squadKey, thawPin, weekAt } from './pins.js';
import { idleRules, ruleText, rulesBroken } from './values.js';

// ================================================================ legality and drift (§7.7)

/** The players drift watches: your GW-A XI (the call you made) and the players you asked for (wish, keep, a
 *  pick). The taken road's hold on the whole GW-A squad is left out: a loaned-out bench GK is not news. */
function watched(cctx, evaluation, pinList) {
  const s = evaluation.gws.find((x) => x.gw === cctx.A);
  const asked = composePins(pinList.filter((p) => p.kind !== 'road'), { from: cctx.A, to: E.LAST_ROUND }).must.map(([id]) => id);
  return [...new Set([...ids(s?.xi), ...asked])];
}

/**
 * Why your plan no longer works on today's data (§7.7): a player it plays in GW A or pins now injured,
 * unavailable or suspended (FPL status i / u / s), a GW over budget (engine.evaluate banks: today's prices
 * and sale values), or a GW over the club limit (rules.py:93 max_per_team). [{code, id?, gw, text}]
 */
export function legality(cctx, evaluation, pinList = []) {
  const L = E.playerLookup({ base: cctx.base, players: cctx.players });
  const out = [];
  for (const id of watched(cctx, evaluation, pinList)) {
    const row = L.get(id)?.row;
    if (OUT[statusInfo(row?.status, row?.chance).code]) out.push({ code: 'status', id, gw: cctx.A, text: statusText(L.name(id), row) });
  }
  for (const s of evaluation.gws.filter((x) => num(x.bank) !== null && x.bank < -EPS)) {
    out.push({ code: 'budget', gw: s.gw, short: -s.bank, text: `your plan is ${fmt.money(-s.bank)} over budget in GW${s.gw}` });
  }
  for (const s of evaluation.gws) {
    const n = new Map();
    for (const p of s.squad) { const c = L.club(p); if (c) n.set(c, (n.get(c) || 0) + 1); }
    const over = [...n].find(([, k]) => k > E.MAX_PER_CLUB);
    if (over) { out.push({ code: 'club', gw: s.gw, club: over[0], count: over[1], text: `your plan has ${over[1]} ${over[0]} players in GW${s.gw}` }); break; }
  }
  return out;
}

const sameSquads = (a, b) => a.gws.length === b.gws.length && a.gws.every((s, i) => [...s.squad].sort().join() === [...(b.gws[i]?.squad || [])].sort().join());

/** When your plan was made, in local time, for "Since …" (F1): "10:23" today, "yesterday 18:05", else "Tue 18:05". */
export function sinceText(epoch, now = Date.now()) {
  const ms = Number(epoch) * (Number(epoch) > 1e12 ? 1 : 1000);
  if (!Number.isFinite(ms)) return 'your last plan';
  const d = new Date(ms);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const day0 = (t) => new Date(t).setHours(0, 0, 0, 0);
  const days = Math.round((day0(now) - day0(ms)) / 864e5);
  if (days === 0) return hm;
  if (days === 1) return `yesterday ${hm}`;
  return `${new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d)} ${hm}`;
}

/**
 * How two plans' squads part over the window, biggest first: [{id, kind: 'keep' (the new best keeps a player yours
 * sells) | 'buy' (it buys one yours doesn't) | 'skip' (yours buys one it doesn't), gw (where they first part), with
 * (the player on the other side of that GW's move in yours), weight (Σ his xP over the weeks the squads differ on
 * him)}].
 */
export function planDiff(best, mine, L) {
  const at = (ev, g) => ev.gws.find((x) => x.gw === g);
  const items = new Map();
  for (const s of best.gws) {
    const m = at(mine, s.gw);
    if (!m) continue;
    for (const [id, side] of [...s.squad.filter((p) => !m.squad.includes(p)).map((p) => [p, 'in']),
      ...m.squad.filter((p) => !s.squad.includes(p)).map((p) => [p, 'out'])]) {
      const it = items.get(id) || { id, gw: s.gw, weight: 0, side };
      it.weight += L.xp(id, s.gw) ?? 0;
      items.set(id, it);
    }
  }
  const movesOfWeek = (ev, g) => (at(ev, g)?.moves || []).filter((x) => x.ok !== false);
  return [...items.values()].map((it) => {
    // a player the new best has that yours lacks: yours sold him (keep) or never had him (buy); one yours has: skip
    const ownedBefore = it.side === 'in' && (mine.gws.some((x) => x.gw < it.gw && x.squad.includes(it.id)) || movesOfWeek(mine, it.gw).some((x) => x.out === it.id));
    const kind = it.side === 'out' ? 'skip' : ownedBefore ? 'keep' : 'buy';
    const mv = movesOfWeek(mine, it.gw).find((x) => x.out === it.id || x.in === it.id) ?? movesOfWeek(best, it.gw).find((x) => x.in === it.id);
    const withId = mv ? (mv.out === it.id ? mv.in : mv.out) : null;
    return { id: it.id, kind, gw: it.gw, with: withId, weight: it.weight };
  }).sort((a, b) => b.weight - a.weight);
}

/** A planDiff item in words: "keep Szoboszlai (yours sells him for Dewsbury-Hall in GW6)", "Groß in GW6". */
export function diffWords(it, L) {
  if (!it) return null;
  const nm = L.name;
  if (it.kind === 'keep') return `keep ${nm(it.id)} (yours sells him${it.with != null ? ` for ${nm(it.with)}` : ''} in GW${it.gw})`;
  if (it.kind === 'buy') return `${nm(it.id)} in GW${it.gw}${it.with != null ? ` for ${nm(it.with)}` : ''}`;
  return `no ${nm(it.id)} (yours buys him in GW${it.gw})`;
}

/** What the new data gains: today's best against `before` (the model's road an earlier plan was made or seen on), both
 *  on today's forecast (calls.compare) | null without that road. */
export const freshOf = (cctx, best, before) => (before?.weeks?.length ? compareIn(cctx, best, planFromRoad(cctx, before).evaluation) : null);
/** That gain is news when, on the anchor's scale (fc.ref), it is above the plan's noise and no coin flip. One test for
 *  detectDrift and forecastChange. */
export const isNews = (cctx, fc) => fc != null && fc.ref > (cctx?.noise ?? 0) && fc.label !== 'coin';

/**
 * Re-score the plan you accepted on today's forecast against the new base road (§7.7): drift when the new base wins by
 * more than the noise with a verdict that isn't a coin flip (votes only downgrade), or when your plan broke
 * (legality); 'kept' when it is better by less; 'same' when the squads agree. null when there is nothing to judge (no
 * accepted plan, no new roads, or already judged on this version). frozen: the frozen GWs (ink): a new best that
 * remakes one is out of reach, so only legality can drift. Your rules (every pin but the road) stay yours: `broken`
 * lists the ones the new best ignores (its "Switch" re-plans with them, adoptDrift). Your rules and lineup are never
 * news: the new best wins only by what the new data gains, `fresh`: today's best against `before` (the model's road
 * your plan was made against) on today's forecast; without that road, the whole gap when your plan holds none of your
 * choices, else null (unknown: 'kept').
 */
export function detectDrift(cctx, accepted, version, { frozen = null, locked = false, now, before = null, hold = null } = {}) {
  if (!accepted?.plan?.weeks?.length || !cctx?.model?.weeks?.length || !version || madeOn(accepted) === version) return null;
  const L = E.playerLookup({ base: cctx.base, players: cctx.players });
  const mine = planFromRoad(cctx, { weeks: accepted.plan.weeks }, accepted.lineup || {});
  const bestPlan = planFromRoad(cctx, cctx.model);
  const cmp = compareIn(cctx, bestPlan.evaluation, mine.evaluation);
  const pinList = accepted.pins?.items || [];
  const ink = frozen?.length ? frozen : locked ? [cctx.A] : [];
  const reach = ink.every((g) => squadKey(weekAt(cctx.model, g)) === squadKey(weekAt(accepted.plan, g)));
  // the hold is kept as your rules are: a new best that moves where it rolls ignores it, so its action re-plans with
  // it; never named as yours (ruleNames)
  const broken = rulesBroken(cctx.model, [...(hold ? [hold] : []), ...pinList.filter((p) => p.id !== 'road' && p.id !== 'hold')], { from: cctx.A, to: cctx.gws.at(-1) });
  // a pencil GW the model's own new plan breaks the same way is no news about yours: the solver prices it on its data's
  // prices and a later solve re-plans it. Only as far as the model's own; a bigger shortfall of yours still counts. GW
  // A always counts.
  const shared = new Map(legality(cctx, bestPlan.evaluation).filter((x) => x.code !== 'status' && x.gw > cctx.A).map((x) => [`${x.code}:${x.gw}`, x.short ?? 0]));
  const illegal = legality(cctx, mine.evaluation, pinList)
    .filter((x) => !shared.has(`${x.code}:${x.gw}`) || (x.code === 'budget' && x.short > shared.get(`${x.code}:${x.gw}`) + EPS));
  const same = sameSquads(bestPlan.evaluation, mine.evaluation);
  const chosen = broken.length > 0 || ['xi', 'bench', 'captain', 'vice'].some((k) => accepted.lineup?.[k] != null);
  const fc = freshOf(cctx, bestPlan.evaluation, before) ?? (chosen ? null : cmp);
  const fresh = fc ? fc.delta : null;  // shown; its label and the win read fc.ref, the gap on the anchor's scale
  const wins = reach && !same && cmp.label !== 'coin' && isNews(cctx, fc);
  const kind = illegal.length || wins ? 'drift' : !same && cmp.delta > EPS ? 'kept' : 'same';
  let what = illegal[0]?.text ?? null;
  if (!what) {
    // a player's flag only when it came after your plan was made (its news_added; else the toast would lead with old
    // news as "Since …"); none known: not said
    const since = (row) => { const t = Date.parse(row?.news_added ?? ''); return Number.isFinite(t) && t / 1000 > (num(accepted.at) ?? Infinity); };
    for (const id of watched(cctx, mine.evaluation, pinList)) { if (!since(L.get(id)?.row)) continue; what = statusText(L.name(id), L.get(id)?.row); if (what) break; }
  }
  // the toast leaves the default out: it took the three lines' room the ignored rules need
  const news = what;
  what ??= 'the forecast changed';
  const diff = planDiff(bestPlan.evaluation, mine.evaluation, L);
  const main = diffWords(diff[0], L);
  const sinceStr = sinceText(accepted.at, now);
  // FPL flagged him but the forecast (re-inferred separately, §7.7 honest limit) still plays him: no new best to show
  // yet, so the drift names him (`without`)
  const out = same ? illegal.find((x) => x.code === 'status') : null;
  // the hold is no rule anyone added: never named as yours (ruleNames); its answer says what it keeps (COPY.driftAct:
  // "Keep only your transfers")
  const ruleNames = broken.filter((p) => p.id !== 'hold').map((p) => ruleText(p, L.name, { start: cctx.A, end: cctx.gws.at(-1) }).text);
  return {
    kind, version, gw: cctx.A, since: accepted.at, sinceText: sinceStr, cmp, delta: cmp.delta, label: cmp.label,
    what, main, best: main ?? 'the new plan', diff, same, locked: ink.length > 0, frozen: ink, reach, broken: broken.map((p) => p.id), ruleNames, fresh,
    freshLabel: fc ? fc.label : null, wins,
    without: out ? { id: out.id, name: L.name(out.id) } : null,
    text: same ? `Since ${sinceStr}: ${what}. ${out ? "The forecast hasn't caught up yet." : 'No better plan yet.'}`
      : !reach ? `Since ${sinceStr}: ${what}. ${COPY.frozenStays(ink, cctx.gws.at(-1))}`
        : COPY.drift(sinceStr, news, main, cmp.delta, cmp.label, cmp.gws, ruleNames, fresh, fc ? fc.label : cmp.label),
    mine, bestPlan,
  };
}

// ================================================================ pencil diff and journal

const movesOf = (w, L) => E.pairMoves(ids(w?.out), ids(w?.in), L).filter((m) => m.out !== null && m.in !== null)
  .map((m) => ({ ...m, outName: L.name(m.out), inName: L.name(m.in) }));

/** One week of two plans (their {in, out}): the moves of each, those `was` makes that `now` doesn't (gone) and the
 *  reverse (added). */
const weekChanges = (was, now, L) => {
  const a = movesOf(was, L), b = movesOf(now, L);
  const key = (m) => `${m.out}>${m.in}`;
  const ka = new Set(a.map(key)), kb = new Set(b.map(key));
  return { a, b, gone: a.filter((m) => !kb.has(key(m))), added: b.filter((m) => !ka.has(key(m))) };
};

/** Moves that differ between two plans' weeks after GW A (§5.5 "2 changes in GW7–9 ›"). */
export function pencilChanges(was, now, A, L) {
  const items = [];
  for (const w of (now || []).filter((x) => Number(x.gw) > A)) {
    const before = (was || []).find((x) => Number(x.gw) === Number(w.gw));
    if (!before) continue;
    const { a, b, gone, added } = weekChanges(before, w, L);
    if (gone.length || added.length) items.push({ gw: Number(w.gw), was: a, now: b, n: Math.max(gone.length, added.length) });
  }
  if (!items.length) return null;
  const n = items.reduce((s, x) => s + x.n, 0);
  const gws = items.map((x) => x.gw);
  return { n, gws, items, text: `${n} change${n === 1 ? '' : 's'} in ${COPY.range(gws[0], gws.at(-1))}` };
}

/** One week's moves a new forecast changed, in words (`was` the week of the plan seen before, then the plan now): a
 *  sale with another buy "Scott → Le Fée (was Groß)", any other new move as its row reads it, a move it no longer makes
 *  "no Scott → Groß" | null. */
export function movesChanged(was, now, L) {
  const { gone, added } = weekChanges(was, now, L);
  const parts = added.map((m) => {
    const w = gone.find((x) => x.out === m.out);
    return `${m.outName} → ${m.inName}${w ? ` (was ${w.inName})` : ''}`;
  });
  for (const m of gone) if (!added.some((x) => x.out === m.out)) parts.push(`no ${m.outName} → ${m.inName}`);
  return parts.length ? parts.join(', ') : null;
}

/** A road key in words, for a taken call stored without its label. */
function roadWords(key, nameOf) {
  const [kind, rest = ''] = String(key ?? '').split(':');
  const [id, g] = rest.split('@');
  if (kind === 'base') return 'the suggested plan';
  if (kind === 'hit') return `the ${MINUS}4 move`;
  if (kind === 'veto') return `the plan without ${nameOf(Number(id))}`;
  if (kind === 'slide') return `${nameOf(Number(id))} from GW${g}`;
  return String(key ?? 'a move');
}
const MINUS = '−';
const TAKEN = (t, nameOf) => (t.call === 'armband' ? `${t.label || nameOf(t.captain)} captain`
  : t.call === 'chip' ? (t.chip ? `played ${chipName(t.chip)}` : 'held the chips')
    : t.label === 'Roll' || (!t.label && t.road === 'roll') ? 'rolled the transfer' : `took ${t.label || roadWords(t.road, nameOf)}`);

/** A lock note's kinds, both an older document's: "Locked in GW6", "Froze GW6–8". */
const LOCKS = ['locked', 'frozen'];
/** Whether lock note n says what the lock note of its kind before it said (GW A locked again with the same moves, the
 *  same weeks frozen again): no new line. */
const sameLock = (prev, n) => !!prev && LOCKS.includes(n?.kind) && prev.kind === n.kind && prev.text === n.text;

/**
 * The You sheet's calls journal (§5.10) from {gw: doc}: taken calls with their verdicts, and the plan notes: [{gw, at,
 * kind, text, not, label, delta}]. nameOf(id) names players for calls stored without a label. A lock note repeating
 * the one before it (sameLock) is one row.
 */
export function journalRows(docs, { nameOf = (id) => `#${id}` } = {}) {
  const rows = [];
  for (const doc of Object.values(docs || {})) {
    const acc = doc?.accepted;
    if (!acc) continue;
    const gw = Number(doc.gw);
    for (const t of acc.roads_taken || []) {
      const v = (acc.verdicts || []).find((x) => x.call === t.call);
      rows.push({ gw, at: t.at ?? acc.at ?? 0, kind: t.call, text: TAKEN(t, nameOf), not: t.not || [], label: v?.label ?? null, delta: num(v?.delta) });
    }
    const lock = {};
    for (const n of acc.notes || []) {
      if (LOCKS.includes(n.kind)) { if (sameLock(lock[n.kind], n)) continue; lock[n.kind] = n; }
      rows.push({ gw, at: n.at ?? 0, kind: n.kind, text: n.text, not: [], label: n.label ?? null, delta: num(n.delta) });
    }
  }
  return rows.sort((a, b) => b.gw - a.gw || b.at - a.at);
}

// ================================================================ documents

/** The roads version a plan was made on: accepted.roads_version, else data_version. */
export const madeOn = (acc) => acc?.roads_version ?? acc?.data_version ?? null;
/** The pins a plan was made for, as one string (composePins output): the same string needs no solve. Rolls are added
 *  only when present, so an older plan keeps its signature. */
/** A solve's own key: the data version and its values, key order aside (the plan service keys a solve by its argv on
 *  that data, api/mobile.py solve_key: two asks of one key are one request). */
export const solvedKey = (version, values) => `${version}|${JSON.stringify(Object.keys(values).sort().map((k) => [k, values[k]]))}`;
export const sigOf = (c) => `${c.must_have}|${c.exclude}|${JSON.stringify(c.hits)}|${JSON.stringify(c.chips)}|${c.cash}${c.not_for ? `|notfor:${c.not_for}` : ''}${c.rolls.length ? `|roll:${c.rolls.join(',')}` : ''}${Object.keys(c.caps ?? {}).length ? `|cap:${JSON.stringify(c.caps)}` : ''}`;
/** A road as the stored plan: its weeks, the values it was solved for, its objective (the planner's own count:
 *  calls.plannerOf), its weeks' own windows (calls.windowGap), the scale by horizon those are on (k_h, api/scale.py
 *  road; engine.objectiveOf atAnchor puts it back on GW A's scale) and its planner's own hits per GW (road.planner:
 *  calls.hitBook). */
export const planOfRoad = (road, version, sig = null) => (road ? {
  key: road.key ?? null, item: road.item ?? null, version: version ?? null, sig, values: road.values ?? null, weeks: clone(road.weeks),
  objective: road.objective ? clone(road.objective) : null, ...(road.windows ? { windows: clone(road.windows) } : {}),
  ...(road.planner ? { planner: clone(road.planner) } : {}),
  ...(Array.isArray(road.k_h) ? { k_h: [...road.k_h] } : {}),
} : null);

/**
 * A memory document's accepted in this module's shape, whoever wrote it. An older document may hold accepted.pins as
 * the taken road's own strings {must_have, exclude, max_hits} and no plan: the plan is then the taken road
 * (roadOf(version, key)) and its pin the road pin. A stored 'hits' pin goes (the hits Forkcast may take are one
 * setting, accepted.hits_max); a stored Roll stays (owner, 2026-10-13). Frozen weeks are thawed (thawPin; frozen,
 * frozen_lineups, frozen_at, locked_at emptied). A hits rule splitRoad makes of a road's own cap, in a Wildcard or
 * Free Hit week or at the solver's default cap (hitCap), is no rule (idleRules): it goes.
 * Other keys are kept. → a new object, or null.
 */
export function normalizeAccepted(acc, { A, end, roadOf = () => null, hitCap = null, hold = false } = {}) {
  if (!acc) return null;
  const made = madeOn(acc);
  const t = (acc.roads_taken || []).find((x) => x.call === 'transfer');
  const road = t?.road ? roadOf(made, t.road) : null;
  const out = { ...acc, roads_version: made, roads_taken: acc.roads_taken || [], verdicts: acc.verdicts || [], notes: acc.notes || [] };
  let items = Array.isArray(acc.pins?.items) ? acc.pins.items : null;
  if (!items) {
    const src = road ?? (acc.plan?.weeks ? { values: { must_have: acc.pins?.must_have, exclude: acc.pins?.exclude, max_hits: acc.pins?.max_hits }, weeks: acc.plan.weeks } : null);
    items = t?.road && src ? [pinRoad(src, A, { key: t.road, label: t.label })] : [];
  } else {
    // the stored call is the newest word: a road pin for another road (or none taken, and not a lock's) goes,
    // with the rules it came with
    const rp = items.find((p) => p.id === 'road');
    if (rp && !rp.locked && (!t ? true : road && rp.key !== t.road)) items = items.filter((p) => p.id !== 'road' && !p.via);
    if (road && !items.some((p) => p.id === 'road')) items = [pinRoad(road, A, { key: t.road, label: t.label }), ...items];
  }
  // a week's Auto-plan hits limit is no rule now (the hits Forkcast may take are one setting, accepted.hits_max; owner,
  // 2026-10-12). A Roll stays (Your rules lists it with its ×)
  items = items.filter((p) => p.kind !== 'hits');
  // a plan's frozen weeks are thawed (owner, 2026-10-12), the road pin the call's again (after splitItems: a rule an
  // older lock held inside it is a rule of its own first)
  items = splitItems(items, A, end);
  if (frozenWeeks(acc, A, end).length || items.some((p) => p.id === 'road' && p.locked)) {
    const rp = items.find((p) => p.id === 'road');
    const thawed = rp ? thawPin(rp, A, A) : null;
    items = [...(thawed ? [thawed] : []), ...items.filter((p) => p.id !== 'road')];
    Object.assign(out, { frozen: [], frozen_lineups: {}, frozen_at: {}, locked_at: null });
    delete out.locked_by;
  }
  const idle = idleRules(items, { from: A, to: end, hitCap });
  if (idle.length) items = items.filter((p) => !idle.includes(p.id));
  const c = composePins(items, { from: A, to: end });
  if (items !== acc.pins?.items) out.pins = { ...(acc.pins || {}), must_have: c.must_have, exclude: c.exclude, items };
  // a plan whose GW-A squad is not the taken road's predates that call: the call's road stands in until it re-plans. A
  // plan solved for exactly these pins is newer, so it stands. Never under the hold (`hold`), where an alternative
  // taken whole holds nothing (withHold): your plan is the one solved for your rules (owner, 2026-10-26)
  if (!hold && road && out.plan?.weeks && out.plan.sig !== sigOf(c) && squadKey(weekAt(out.plan, A)) !== squadKey(weekAt(road, A))) out.plan = null;
  if (!out.plan && road && !hold) out.plan = planOfRoad(road, made, items.length === 1 && items[0].id === 'road' ? sigOf(c) : null);
  // a plan the phone evaluated under the hold (an older app's holdRoad, key 'hold:…') is no solver's: it goes, and your
  // rules are solved again (owner, 2026-10-26: "fix so every squad is solver squad")
  if (String(out.plan?.key ?? '').startsWith('hold:')) out.plan = null;
  return out;
}
