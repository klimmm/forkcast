// memory.js: pins: compose, parse and word your rules

import * as E from '../../plan/engine.js';
import { COPY, FORGET_MS } from '../calls.js';
import { fin, toMs } from '../../ui.js';
import { sinceText } from './drift.js';

export const EPS = 1e-6;
const SQUAD = Object.values(E.POS_LIMITS).reduce((s, [n]) => s + n, 0);  // 15: engine.POS_LIMITS' squad counts
/** §7.8: a heal waits 600 ms after the gesture ends; a dirty plan is flushed 250 ms after the last change. One object
 *  so tests can shorten both. */
export const TIMING = { heal: 600, flush: 250 };
/** How long your choices stay away from Forkcast (calls.js); app.js and the tests read it here. */
export { FORGET_MS };
export const OFFERED_MAX = 24;  // offered roads kept per roads version: a window's chips × GWs and some
// solves asked ahead (Memory.offer `values`, ahead.js presolve), kept per roads version: takes, Removes, open-sheet
// taps (PRESOLVE_MAX each), Undo views
export const SOLVED_MAX = 48;
export const LOCAL = (entry) => `fc:mem:${entry}`;
export const SEEN = (entry) => `fc:mem:seen:${entry}`;
export const EDIT = (entry) => `fc:mem:edit:${entry}`;
/** When this browser last used a team (ms; app.js seen). A team unused for FORGET_MS (here, or editedAt on any device)
 *  loads as Reset plan leaves it, server copy too (owner, 2026-10-14); a sign-out forgets it at once (forget). */
export const USED = (entry) => `fc:mem:used:${entry}`;
/** A team whose forgetting (forget) hasn't reached the server: its next load here starts as Reset plan leaves it. */
export const FORGET = (entry) => `fc:mem:forget:${entry}`;

export const num = (v) => (fin(v) ? Number(v) : null);
export const ids = (xs) => (Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : []);
export const range = (a, b) => (b >= a ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : []);
export const nowS = () => Math.round(Date.now() / 1000);
export const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
export const weekAt = (road, gw) => (road?.weeks || []).find((w) => Number(w.gw) === Number(gw)) || null;
export const squadOf = (w) => [...ids(w?.xi), ...ids(w?.bench)];
/** A sorted id set as one string: equal keys, same squad. */
export const idsKey = (xs) => ids(xs).sort((a, b) => a - b).join(',');
export const squadKey = (w) => idsKey(squadOf(w));
/** A pin's kind (an older 'fork' is a Roll when its id is 'roll:<gw>', else a hits rule). */
export const kindOf = (p) => (p?.kind === 'fork' ? (String(p.id).startsWith('roll:') ? 'roll' : 'hits') : p?.kind);
/** Whether a pin is a Roll ('roll:<gw>'). */
export const isRoll = (p) => !!p && (kindOf(p) === 'roll' || String(p.id).startsWith('roll:'));
/** One of your exact moves (a sale with its buy, a slide): what the hold keeps in its week (holdOf, pinRoll's cap). */
export const isExact = (p) => (kindOf(p) === 'sell' && p.in != null) || kindOf(p) === 'slide';
/** Your exact moves of `list` made in GW g → [Pin]. */
export const exactAt = (list, g) => (list || []).filter((p) => p && isExact(p) && num(p.gw) === Number(g));
/** The exact moves of yours a Roll keeps in its GW (pinRoll's k); 0: no transfers. */
export const rollKeeps = (p) => num(p?.caps?.[p.gw]) ?? 0;
export const span = (gws) => COPY.span(gws);

// ================================================================ pins

const TOKEN = /^(\d{1,10})@(\d{1,2})-(\d{1,2})$/;  // api/mobile.py _TOKEN: a scoped id@a-b window

/** "id@a-b,…" (or [[id, a, b]]) → [[id, a, b]]. A bare "@g" would mean g..38 (player_data.py:960-964): refused. */
export function parseSpans(spec) {
  if (Array.isArray(spec)) return spec.map(([p, a, b]) => [Number(p), Number(a), Number(b)]);
  const out = [];
  for (const tok of String(spec ?? '').split(',').map((t) => t.trim()).filter(Boolean)) {
    const m = TOKEN.exec(tok);
    if (!m) throw new Error(`pins: ${tok} is not an id@a-b window`);
    out.push([Number(m[1]), Number(m[2]), Number(m[3])]);
  }
  return out;
}

/** [[id, a, b]] → "id@a-b,…" sorted by (id, a), touching windows joined (as api/mobile.py pins(): equal plans give
 *  equal argv). */
export function spanString(spans) {
  const merged = [];
  const sorted = parseSpans(spans).sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
  for (const [p, a, b] of sorted) {
    const last = merged.at(-1);
    if (last && last[0] === p && a <= last[2] + 1) last[2] = Math.max(last[2], b);
    else merged.push([p, a, b]);
  }
  return merged.map(([p, a, b]) => `${p}@${a}-${b}`).join(',');
}

/** A pin's hit caps over GW from..to: [[gw, cap]] (its `hits` map; an older window-wide `max_hits`: every GW). */
export const capsOf = (pin, from, to) => (pin.hits ? Object.entries(pin.hits).map(([g, n]) => [Number(g), num(n) ?? 0])
  : (num(pin.max_hits) ?? 0) > 0 ? range(from, to).map((g) => [g, Number(pin.max_hits)]) : []).filter(([g]) => g >= from && g <= to);

/** The last GW up to g in which an exact sale of yours in `list` sells player `id`, or -Infinity: where a buy of him
 *  may start. */
const lastSale = (list, id, g) => Math.max(-Infinity, ...list.filter((p) => p && isExact(p) && num(p.gw) <= g
  && Number(kindOf(p) === 'slide' ? p.out : kindOf(p) === 'sell' ? p.player : NaN) === id).map((p) => num(p.gw)));

/** The bank the newest cash pin of `list` plans from (tenths), or null. */
const cashOf = (list) => list.reduce((cash, pin) => (pin && num(pin.cash) !== null ? num(pin.cash) : cash), null);

/**
 * Pins (oldest first) → windows over GW from..to: {must_have, exclude (canonical strings), must, excl ([[id, a, b]]),
 * hits {gw: cap} (newest pin's; none in a rolled GW; a GW without one takes the solver's default cap), rolls [gw],
 * caps {gw: n} (at most n transfers: the hold's, a Roll keeping exact moves), chips {gw: chip} (newest; a Wildcard or
 * Free Hit GW takes no hits cap or Roll), debts [gw] (bank may go below 0: the hold's), cash (newest), cells Map(id →
 * Map(gw → {want, pin})), overridden [{pin, by, id, gw, was}] (cells a newer pin took)}.
 */
export function composePins(list = [], { from = 1, to = E.LAST_ROUND } = {}) {
  const cells = new Map();
  const overridden = [];
  const chips = {};
  for (const pin of list) {
    for (const [g, c] of Object.entries(pin?.chips || {})) {
      if (Number(g) < from || Number(g) > to) continue;
      if (E.CHIPS.includes(c)) chips[g] = c; else delete chips[g];
    }
  }
  // A Free Hit week's fifteen is that week's alone (FPL gives the squad before it back the week after), so what you own
  // is decided around it, never in it (owner, 2026-10-12). There a must-have binds only from a pin made for that week,
  // never one carried in or running past it; only a veto, a Never or a window of that week alone keeps anyone out.
  const fh = (g) => chips[g] === 'fh';
  const fhIn = (pin, g, a, b) => g === a && (b === g || kindOf(pin) === 'wish');
  const fhOut = (pin, g, a, b) => (a === g && b === g) || ['veto', 'never'].includes(kindOf(pin));
  // a pin holding a whole squad in a GW (taken road at GW A, a held week): 15 must-haves. A newer ask bringing someone
  // else in releases it there. gw → {pin, ids}
  const holds = new Map();
  const release = (g) => {
    const hd = holds.get(g);
    for (const id of hd.ids) if (cells.get(id)?.get(g)?.pin === hd.pin && cells.get(id).get(g).want === 'in') cells.get(id).delete(g);
    holds.delete(g);
  };
  const hits = {};
  const rolls = new Set();
  const caps = {};  // gw → at most n transfers (the hold's: exact moves after a planner week, holdOf)
  const refused = [];  // [g, out, in]: the transfers you refused (pinNotFor)
  const debts = new Set();  // bank may go below 0 (the hold's, holdOf)
  const implied = [];  // [id, gw, pin]: what an exact sale implies before its week (the seller kept, the buy not yet)
  for (const pin of list) {
    if (!pin) continue;
    const put = (id, g, want) => {
      if (!cells.has(id)) cells.set(id, new Map());
      const cur = cells.get(id).get(g);
      if (cur && cur.want !== want && cur.pin !== pin.id) overridden.push({ pin: cur.pin, by: pin.id, id, gw: g, was: cur.want });
      cells.get(id).set(g, { want, pin: pin.id });
    };
    const hold = kindOf(pin) === 'hold';
    const ins = new Map();  // gw → this pin's must-haves that week
    for (const [id, a, b] of parseSpans(pin.must || [])) {
      for (const g of range(Math.max(a, from), Math.min(b, to))) if (!fh(g) || (!hold && fhIn(pin, g, a, b))) (ins.get(g) || ins.set(g, new Set()).get(g)).add(id);
    }
    for (const [g, ids] of ins) if (holds.has(g) && holds.get(g).pin !== pin.id && [...ids].some((id) => !holds.get(g).ids.has(id))) release(g);
    for (const [g, ids] of ins) for (const id of ids) put(id, g, 'in');
    for (const [id, a, b] of parseSpans(pin.excl || [])) for (const g of range(Math.max(a, from), Math.min(b, to))) if (!fh(g) || (!hold && fhOut(pin, g, a, b))) put(id, g, 'out');
    // your exact sale from GW g (a pick, isExact) is made in g, never sooner: the player sold stays yours in g − 1 and
    // the one bought is not before g (holdOf); "not before g" runs from his last exact sale of yours before g. A Free
    // Hit in g − 1: still yours in the last week before it, and the buy free to be in the Free Hit's fifteen
    const g1 = kindOf(pin) === 'sell' && isExact(pin) ? (num(pin.gw) ?? 0) - 1 : -1;
    if (g1 >= from && g1 <= to) {
      let own = g1;
      while (own >= from && fh(own)) own--;
      if (own >= from) { put(Number(pin.player), own, 'in'); implied.push([Number(pin.player), own, pin.id]); }
      for (const g of range(Math.max(from, lastSale(list, Number(pin.in), g1)), g1)) if (!fh(g)) { put(Number(pin.in), g, 'out'); implied.push([Number(pin.in), g, pin.id]); }
    }
    for (const [g, ids] of ins) if (ids.size >= SQUAD) holds.set(g, { pin: pin.id, ids });
    for (const [g, n] of capsOf(pin, from, to)) hits[g] = n;
    if (isRoll(pin)) {
      // a Roll keeping your exact moves caps its GW at those still yours, as the hold does (holdOf); none left: "no
      // transfers"
      const g = num(pin.gw) ?? 0, keep = Math.min(rollKeeps(pin), exactAt(list, g).length);
      if (g >= from && g <= to) { if (keep) caps[g] = keep; else rolls.add(g); }
    }
    if (kindOf(pin) === 'notfor') refused.push([num(pin.gw), Number(pin.out), Number(pin.player)]);
    for (const g of pin.rolls || []) if (Number(g) >= from && Number(g) <= to) rolls.add(Number(g));  // the hold's (holdOf)
    for (const g of pin.debts || []) if (Number(g) >= from && Number(g) <= to) debts.add(Number(g));  // the hold's (holdOf)
    if (!isRoll(pin)) for (const [g, n] of Object.entries(pin.caps || {})) if (Number(g) >= from && Number(g) <= to) caps[Number(g)] = Number(n);
  }
  // a Wildcard or Free Hit week: no hits cap and no Roll (every transfer is free there)
  for (const [g, c] of Object.entries(chips)) if (c === 'wc' || c === 'fh') { delete hits[g]; rolls.delete(Number(g)); delete caps[g]; }
  for (const g of rolls) delete caps[g];  // a Roll is the tightest cap
  // a rolled GW makes no transfer, so no hit: no cap is sent (the bake's roll road is solved with none)
  for (const g of rolls) delete hits[g];
  // (…and in a week of no transfers, what an exact sale implies before it: no one is sold or bought there anyway; owner,
  // 2026-11-09, "fix bug": a half solve sent --must-have=Tavernier@11-11 under --no-buys-gw=11)
  for (const [id, g, by] of implied) if (rolls.has(g) && cells.get(id)?.get(g)?.pin === by) cells.get(id).delete(g);
  const cash = cashOf(list);
  const must = [], excl = [];
  for (const [id, byGw] of cells) for (const [g, { want }] of byGw) (want === 'in' ? must : excl).push([id, g, g]);
  // (the must-haves sent to the solver: a squad held whole in a week capped at exactly your own moves there (a Roll
  // keeping them, caps[g]) or with no transfers is the week before's but for those moves, so only their buys are sent,
  // never the other fourteen; `must` and `cells` keep them all, as your plan's record; owner, 2026-11-09, "why it pass
  // full team in must haves instead of passing only the swap")
  const implicit = new Set();
  for (const [g, hd] of holds) {
    const ex = exactAt(list, g), buys = new Set(ex.map((p) => Number(p.in)));
    if (!(rolls.has(Number(g)) || (caps[g] != null && Number(caps[g]) === ex.length))) continue;
    for (const id of hd.ids) if (!buys.has(id) && cells.get(id)?.get(g)?.pin === hd.pin && cells.get(id).get(g).want === 'in') implicit.add(`${id}@${g}`);
  }
  // (an exact move of yours in a week, its sale and buy that week both standing: sent as the transfer itself, --for-gw
  // GW:out:in (main.py), never as a must-have and an exclusion; owner, 2026-11-09, "replace '--must-have=Vuskovic@11-11
  // --exclude=Thomas@11-11' with --for-gw=11:Thomas:Vuskovic")
  const made = [];
  for (const p of list.filter((x) => x && isExact(x))) {
    const g = num(p.gw), [out, inn] = kindOf(p) === 'slide' ? [Number(p.out), Number(p.player)] : [Number(p.player), Number(p.in)];
    if (g == null || g < from || g > to || fh(g) || cells.get(inn)?.get(g)?.want !== 'in' || cells.get(out)?.get(g)?.want !== 'out') continue;
    made.push(`${g}:${out}:${inn}`);
    implicit.add(`${inn}@${g}`);
  }
  const outsMade = new Set(made.map((t) => { const [g, o] = t.split(':'); return `${o}@${g}`; }));
  const sent = must.filter(([id, g]) => !implicit.has(`${id}@${g}`));
  const sentExcl = excl.filter(([id, g]) => !outsMade.has(`${id}@${g}`));
  const must_have = spanString(must), exclude = spanString(excl);
  // a refused transfer binds in its own week of the window: never in a Wildcard or Free Hit (a rebuild has no transfers),
  // a squad held whole, a week of no transfers (the roll a Show another's next card counts against is the solve it was,
  // so its tap waits on none: owner, 2026-11-05, "why it never presolves next moves"), or a week your rules make that
  // very move (pinConflicts takes such a refusal back)
  const notFor = [...new Set(refused.filter(([g, o, i]) => g >= from && g <= to && !['wc', 'fh'].includes(chips[g]) && !holds.has(g) && !rolls.has(g) && !makesMove(cells, g, o, i))
    .map((x) => x.join(':')))].sort();
  return {
    must_have, sent_must: spanString(sent), exclude, sent_exclude: spanString(sentExcl), for_gw: [...new Set(made)].sort().join(','), must: parseSpans(must_have), excl: parseSpans(exclude), hits, notFor, not_for: notFor.join(','),
    rolls: [...rolls].sort((a, b) => a - b), caps, debts: [...debts].sort((a, b) => a - b), chips, cash, cells, overridden,
  };
}

/** Your rules (composePins' cells) put `out` out of GW g and `inn` in it. */
const makesMove = (cells, g, out, inn) => cells.get(out)?.get(g)?.want === 'out' && cells.get(inn)?.get(g)?.want === 'in';

/** The players `pin` moves in GW g on a plan whose squad going into g is `into` ([id]), once the pin's own g − 1 holds:
 *  its cells in g that take a player the other way from that squad (a sale from g of one it has; a Wish or slide
 *  arriving in g of one it hasn't). A Keep moves nobody. → [id] */
export function movedAt(pin, g, into) {
  const cells = composePins([pin], { from: g - 1, to: g }).cells;
  const have = new Set(ids(into));
  for (const [id, byGw] of cells) { const w = byGw.get(g - 1)?.want; if (w === 'in') have.add(id); else if (w === 'out') have.delete(id); }
  const out = [];
  for (const [id, byGw] of cells) { const c = byGw.get(g); if (c && (c.want === 'in') !== have.has(id)) out.push(id); }
  return out;
}

/**
 * What adding `pin` would override in the pins already there: [{pin (the older Pin), id, was, gws}]. Windows clash
 * where they meet (a newer cell takes an older one the other way). A Roll of GW g clashes, either way round, with an
 * ask that moves someone in g (movedAt) on your plan (`into(g)`: memory.squadInto; `was` 'roll': an older Roll); an
 * ask for a player as that squad has him moves nobody in g. A Roll keeping k exact moves clashes with none while they
 * are at most k. No `into`: no Roll clash is judged.
 */
export function pinConflicts(list, pin, { into = null, ...opts } = {}) {
  const others = (list || []).filter((p) => p.id !== pin.id);
  const by = new Map();
  const add = (older, id, was, g) => {
    const k = `${older?.id}|${id}`;
    if (!by.has(k)) by.set(k, { pin: older ?? null, id, was, gws: [] });
    by.get(k).gws.push(g);
  };
  const c = composePins([...others, pin], opts);
  for (const o of c.overridden) {
    if (o.by === pin.id) add(others.find((p) => p.id === o.pin), o.id, o.was, o.gw);
  }
  // (a transfer you refused, now one you ask for: the refusal goes)
  for (const q of others) if (kindOf(q) === 'notfor' && makesMove(c.cells, num(q.gw), Number(q.out), Number(q.player))) add(q, Number(q.player), 'out', num(q.gw));
  if (into) {
    const inWindow = (g) => g !== null && g >= (opts.from ?? 1) && g <= (opts.to ?? E.LAST_ROUND);
    const g0 = num(pin.gw);
    const kept = (r, q, g, list) => isExact(q) && num(q.gw) === g && exactAt(list, g).length <= rollKeeps(r);
    // the squad a Roll of GW g leaves: going into g with the exact moves it keeps made, so a later sale of a player one
    // of them buys holds him
    const leaves = (r, g, list) => {
      const s = new Set(ids(into(g)));
      for (const q of list.filter((x) => !isRoll(x) && kept(r, x, g, list))) {
        const [out, inn] = q.kind === 'slide' ? [q.out, q.player] : [q.player, q.in];
        s.delete(Number(out));
        if (inn != null) s.add(Number(inn));
      }
      return [...s];
    };
    if (isRoll(pin) && inWindow(g0)) for (const q of others.filter((x) => !isRoll(x) && !kept(pin, x, g0, others))) for (const id of movedAt(q, g0, leaves(pin, g0, others))) add(q, id, 'moves', g0);
    if (!isRoll(pin)) for (const r of others.filter(isRoll)) { const g = num(r.gw); if (inWindow(g) && !kept(r, pin, g, [...others, pin])) for (const id of movedAt(pin, g, leaves(r, g, [...others, pin]))) add(r, id, 'roll', g); }
  }
  return [...by.values()];
}

/**
 * Which way a change of your pins (`before` → `after`, each oldest first) moves the planner's freedom over GW
 * from..to: 'restrict' (every window and Roll of `before` still holds and no GW allows more hits), 'relax' (the other
 * way round), else null: nothing changed, windows went both ways, or a chip or the cash differs. An edit's verdict
 * reads the planner's count against it (calls.changeText).
 */
export function pinsDir(before, after, { from = 1, to = E.LAST_ROUND } = {}) {
  const a = composePins(before, { from, to }), b = composePins(after, { from, to });
  const chipsKey = (c) => JSON.stringify(Object.entries(c.chips).sort());
  if (a.cash !== b.cash || chipsKey(a) !== chipsKey(b)) return null;
  // every cell of x is the same cell in y (y keeps all of x's windows)
  const within = (x, y) => [...x.cells].every(([id, byGw]) => [...byGw].every(([g, { want }]) => y.cells.get(id)?.get(g)?.want === want));
  // a GW with no hits rule takes the solver's default cap, at least any rule's (a rule restricts)
  const capAt = (x, g) => (x.rolls.includes(g) ? 0 : x.hits[g] ?? Infinity);  // a rolled GW takes no hit
  const fewerHits = (x, y) => range(from, to).every((g) => capAt(x, g) <= capAt(y, g));
  // a Roll and a cap on transfers (a Roll keeping your moves, the hold's) are restrictions: y allows no more transfers
  // than x in any GW
  const buysAt = (x, g) => (x.rolls.includes(g) ? 0 : x.caps[g] ?? Infinity);
  const fewerBuys = (x, y) => range(from, to).every((g) => buysAt(x, g) <= buysAt(y, g));
  const tighter = within(a, b) && fewerHits(b, a) && fewerBuys(b, a), looser = within(b, a) && fewerHits(a, b) && fewerBuys(a, b);
  return tighter === looser ? null : tighter ? 'restrict' : 'relax';
}

/** A pin, checked: its windows parsed (id@a-b), numbers as numbers. */
export function makePin({ id, kind, label = '', gw = null, must = [], excl = [], max_hits = 0, hits, chips, cash, at, ...meta } = {}) {
  if (!id || !kind) throw new Error('a pin needs an id and a kind');
  const pin = { ...meta, id: String(id), kind, label, gw: num(gw), must: parseSpans(must), excl: parseSpans(excl), max_hits: num(max_hits) ?? 0, at: num(at) ?? nowS() };
  if (hits && Object.keys(hits).length) pin.hits = Object.fromEntries(Object.entries(hits).map(([g, n]) => [String(Number(g)), num(n) ?? 0]));
  if (chips && Object.keys(chips).length) pin.chips = { ...chips };
  if (num(cash) !== null) pin.cash = num(cash);
  return pin;
}

/** The players your pins (the taken road's too) keep out in any GW from..to: Set(id). The phone's guessed buy for an
 *  edit (Plan B, Replace, Wish) skips them. */
export function barredAt(list, from, to = from) {
  return new Set(composePins(list || [], { from, to }).excl.map(([id]) => id));
}

/** The players a pin holds in (`must`) or keeps out (`excl`) at GW g: [id]. */
export const heldAt = (spans, g) => parseSpans(spans || []).filter(([, a, b]) => a <= g && g <= b).map(([id]) => id);

/** Whether `pin` makes GW A something other than the road pin's GW-A squad: brings in someone it hasn't, keeps out
 *  someone it has, or rolls GW A (`owned`: the entry's squad) where that squad has moves. */
export function changesGwA(roadPin, pin, A, owned = null) {
  if (!roadPin || !pin) return false;
  const squad = new Set(heldAt(roadPin.must, A));
  if (isRoll(pin) && num(pin.gw) === A) return owned != null && idsKey([...squad]) !== idsKey(owned);
  return heldAt(pin.must, A).some((id) => !squad.has(id)) || heldAt(pin.excl, A).some((id) => squad.has(id));
}

/** The road pin once an ask remade GW A: its GW-A squad hold goes (a GW-A buy would make 16 must-haves), its other
 *  windows stay; its call is then not in force (Plan.taken.transfer null). */
export const yieldRoad = (rp, A) => ({ ...rp, must: parseSpans(rp.must).filter(([, a, b]) => !(a === A && b === A)), yielded: true });

/**
 * The pins (oldest first) after an edit drops `drop` (ids, or a predicate) and then adds `add`, as Memory.removePin /
 * addPin makes it: a dropped road pin takes its `via` rules along, a locked one never goes; an added pin
 * replaces the one with its id and goes last; one that remakes GW A makes an unlocked road pin yield its GW-A hold
 * (yieldRoad; A: GW A, owned: the entry's squad). Also the values a solve sends before the edit is made
 * (Memory.values).
 */
export function pinsAfter(list = [], { add = [], drop = [] } = {}, A = null, owned = null) {
  const off = typeof drop === 'function' ? drop : (p) => drop.includes(p.id);
  const ink = (p) => p.id === 'road' && !!p.locked;
  const road = list.some((p) => p.id === 'road' && !ink(p) && off(p));
  let out = list.filter((p) => ink(p) || !(off(p) || (road && p.via)));
  for (const pin of add) {
    const rp = out.find((x) => x.id === 'road');
    const yields = A != null && !!rp && !rp.yielded && !rp.locked && changesGwA(rp, pin, A, owned);
    out = [...out.filter((x) => x.id !== pin.id).map((x) => (yields && x.id === 'road' ? yieldRoad(x, A) : x)), pin];
  }
  return out;
}

/** "g:n,…" (a road's values.max_hits_gw) → {g: n}. */
export const parseCaps = (spec) => Object.fromEntries(String(spec ?? '').split(',').map((t) => t.trim().split(':').map(Number))
  .filter(([g, n]) => Number.isFinite(g) && Number.isFinite(n)).map(([g, n]) => [String(g), n]));

/** The road you took for GW A (§7.7 "pins come from taken roads"): its own windows plus its GW-A squad for GW A. */
export function pinRoad(road, A, { key, label = '' } = {}) {
  const v = road?.values || {};
  const chips = {};
  for (const c of E.CHIPS) for (const g of [].concat(v[c] ?? []).map(String)) if (g !== '0' && Number(g)) chips[g] = c;
  return makePin({
    id: 'road', kind: 'road', key: key ?? road?.item ?? road?.key ?? null, label, gw: A,
    must: [...parseSpans(v.must_have || ''), ...squadOf(weekAt(road, A)).map((p) => [p, A, A])],
    excl: parseSpans(v.exclude || ''), max_hits: num(v.max_hits) ?? 0, hits: parseCaps(v.max_hits_gw), chips, cash: v.cash,
  });
}
/**
 * A road pin holds only its GW-A squad; every other window it carries (vetoes, the −4 road's hits, a chip, cash, a
 * later must-have) becomes a rule of its own marked `via` (the road's key): a chip, removable, back with the call when
 * another road is taken. end: the plan's last GW (an older road's window-wide hits become a −4 rule in each GW
 * A..end). → [road pin, ...rules]
 */
export function splitRoad(rp, A, end = A) {
  if (!rp) return [];
  // a frozen pin holds each frozen GW's squad and chip (pinFrozen); the rest it carries is split as any road pin's
  const F = rp.locked ? pinFrozen(rp, A) : [A];
  const last = F.at(-1);
  const holds = F.flatMap((g) => [...new Set(heldAt(rp.must, g))].map((p) => [p, g, g]));
  const hold = [...new Set(heldAt(rp.must, A))];
  const later = parseSpans(rp.must || []).filter(([, a, b]) => !(a === b && F.includes(a))).map(([id, a, b]) => [id, Math.max(a, last + 1), b]).filter(([, a, b]) => a <= b);
  const excl = parseSpans(rp.excl || []);
  const chips = Object.entries(rp.chips || {}).filter(([g, c]) => c && !(rp.locked && F.includes(Number(g))));
  // every cap it was solved under is a restriction of yours, Free only (0) too
  const caps = capsOf(rp, A, end);
  if (!later.length && !excl.length && !caps.length && !chips.length && rp.cash == null) return [rp];
  const via = String(rp.key ?? 'road');
  const kept = rp.locked ? Object.fromEntries(Object.entries(rp.chips || {}).filter(([g]) => F.includes(Number(g)))) : {};
  const pin = { ...rp, must: holds, excl: [], max_hits: 0 };
  delete pin.hits;
  delete pin.chips;
  delete pin.cash;
  if (Object.keys(kept).length) pin.chips = kept;
  const byPlayer = (spans) => {
    const m = new Map();
    for (const sp of spans) (m.get(sp[0]) || m.set(sp[0], []).get(sp[0])).push(sp);
    return [...m];
  };
  const from = (spans) => Math.min(...spans.map(([, a]) => a));
  const rules = [
    ...byPlayer(excl).map(([id, sp]) => makePin({ id: `out:${id}`, kind: 'veto', player: id, gw: from(sp), excl: sp, via })),
    ...byPlayer(later).map(([id, sp]) => (hold.includes(id)
      ? makePin({ id: `keep:${id}`, kind: 'keep', player: id, gw: from(sp), must: sp, via })
      : makePin({ id: `wish:${id}`, kind: 'wish', player: id, gw: from(sp), must: sp, via }))),
    ...caps.map(([g, n]) => pinHits(n, g, { via })),
    ...chips.map(([g, c]) => pinChip(Number(g), c, { via })),
    ...(rp.cash != null ? [pinCash(rp.cash, { via })] : []),
  ];
  return [pin, ...rules];
}

/** A pin list whose road pin carries windows of its own: split (splitRoad), its rules after it, never replacing a pin
 *  of yours with the same id. */
export function splitItems(items, A, end) {
  const i = items.findIndex((p) => p.id === 'road');
  if (i < 0) return items;
  const [pin, ...rules] = splitRoad(items[i], A, end);
  if (!rules.length) return items;
  const have = new Set(items.map((p) => p.id));
  return [...items.slice(0, i), pin, ...rules.filter((r) => !have.has(r.id)), ...items.slice(i + 1)];
}

/** An older document's ticket's GW-A squad (ticket.plan: xi + bench): [id], empty unless all 15 are there. */
export const ticketSquad = (plan) => {
  const s = [...ids(plan?.xi), ...ids(plan?.bench)];
  return s.length === SQUAD ? s : [];
};

/** The GWs a frozen road pin holds (its `frozen`; an older document's lock: GW A alone), ascending. */
export const pinFrozen = (rp, A) => (!rp?.locked ? [] : Array.isArray(rp.frozen) && rp.frozen.length ? rp.frozen.map(Number).sort((a, b) => a - b) : [A]);

/**
 * The road pin of frozen weeks (now only inkRepair and thawPin make one; normalizeAccepted thaws it on read): each
 * frozen GW g held as its squad `squads[g]` (15 must-haves) and chip `chips[g]` ('none': no chip), `locked` (no ask,
 * Adopt or Switch remakes it) and `frozen` [g]; the call's later windows kept. squads: {gw: [id]}, or one
 * squad: GW A's. Frozen weeks are always GW A..g.
 */
export function lockPin(rp, squads, A, key = 'base', chips = null) {
  const by = Array.isArray(squads) ? { [A]: squads } : squads || {};
  const gws = Object.keys(by).map(Number).filter((g) => by[g]?.length).sort((a, b) => a - b);
  const last = gws.length ? gws.at(-1) : A;
  // the frozen GWs are the squads held there; the call's other windows count from the week after (none may overlap a hold)
  const after = (spans) => parseSpans(spans || []).filter(([, , b]) => b > last).map(([p, a, b]) => [p, Math.max(a, last + 1), b]);
  const ch = Object.fromEntries(gws.filter((g) => chips && g in chips).map((g) => [String(g), chips[g] ?? 'none']));
  const pin = makePin({
    ...(rp || {}), id: 'road', kind: 'road', key: rp?.key ?? key, label: rp?.label || 'Frozen', gw: A,
    must: [...after(rp?.must), ...gws.flatMap((g) => by[g].map((p) => [Number(p), g, g]))], excl: after(rp?.excl), locked: true, yielded: false,
    frozen: gws, chips: Object.keys(ch).length ? ch : undefined,
  });
  if (!Object.keys(ch).length) delete pin.chips;
  return pin;
}

/** A frozen road pin's holds: {squads: {gw: [id]}, chips: {gw: chip | 'none'}} (pinFrozen's weeks). */
export function frozenHolds(rp, A) {
  const gws = pinFrozen(rp, A);
  return {
    squads: Object.fromEntries(gws.map((g) => [g, heldAt(rp.must, g)])),
    chips: Object.fromEntries(gws.filter((g) => rp.chips?.[g] != null).map((g) => [g, rp.chips[g]])),
  };
}

/** The frozen road pin `rp` (its GW A `from`) holding only its weeks `keep`, each with squad and chip, as a pin of the
 *  plan whose GW A is `A` (thawPin). */
function frozenPart(rp, keep, from, A = from) {
  const { squads, chips } = frozenHolds(rp, from);
  return lockPin({ ...rp, must: [], excl: [], chips: undefined }, Object.fromEntries(keep.map((x) => [x, squads[x]])), A, rp.key, Object.fromEntries(keep.filter((x) => x in chips).map((x) => [x, chips[x]])));
}

/** A frozen road pin with GW g on unfrozen: the holds of g on go; with none left, the pin is the call's again
 *  (unlocked, its GW-A squad its hold) or null when it held nothing else. */
export function thawPin(rp, g, A) {
  if (!rp?.locked) return rp ?? null;
  const keep = pinFrozen(rp, A).filter((x) => x < g);
  if (keep.length) return frozenPart(rp, keep, A);
  const { squads } = frozenHolds(rp, A);
  const { frozen, chips: _c, ...rest } = rp;
  return makePin({ ...rest, must: (squads[A] || []).map((p) => [p, A, A]), excl: [], locked: false });
}

/**
 * The first frozen GW `pin` would change (the frozen road pin `rp`'s weeks), else null: someone brought in that a
 * frozen week's squad hasn't or kept out it has; a Roll, hits rule or chip of a frozen GW; a Roll of a frozen GW whose
 * squad differs from the one before.
 */
export function frozenClash(rp, pin, A) {
  const gws = pinFrozen(rp, A);
  if (!gws.length || !pin) return null;
  for (const g of gws) {
    const squad = new Set(heldAt(rp.must, g));
    if (heldAt(pin.must, g).some((id) => !squad.has(id)) || heldAt(pin.excl, g).some((id) => squad.has(id))) return g;
    const own = num(pin.gw) === g && (isRoll(pin) || ['hits', 'chip'].includes(kindOf(pin)));
    if (own || Object.keys(pin.hits || {}).map(Number).includes(g) || (pin.chips && g in pin.chips && pin.chips[g] !== (rp.chips?.[g] ?? 'none'))) return g;
  }
  return null;
}

/** GW A's deadline has passed (the bundle's meta.deadline_epoch): FPL has GW A, Forkcast edits it no more (ahead.isLive,
 *  inkClash). */
export const deadlinePassed = (meta, now = Date.now()) => {
  const ms = toMs(meta?.deadline_epoch);
  return Number.isFinite(ms) && now >= ms;
};

/** The GWs frozen in a document (accepted.frozen within A..end; an older document's lock, accepted.locked_at or a ticket
 *  all ticked: GW A), ascending. */
export function frozenWeeks(acc, A, end = A, ticket = null) {
  const f = Array.isArray(acc?.frozen) ? acc.frozen.map(Number).filter((g) => g >= A && g <= end).sort((a, b) => a - b) : [];
  if (f.length) return f;
  return acc?.locked_at || ticket?.locked ? [A] : [];
}

/** When each of the `frozen` GWs froze, {gw: {at (epoch s), version (roads)}}: accepted.frozen_at, else an older
 *  document's locked_at (version unknown); none for a week with neither. */
export function frozenOnOf(acc, frozen = []) {
  const at = (g) => acc?.frozen_at?.[g] ?? (acc?.locked_at ? { at: acc.locked_at, version: null } : null);
  return Object.fromEntries(frozen.map((g) => [g, at(g)]).filter(([, x]) => x));
}
/** GW g's freeze in words (frozenOn: Plan.frozenOn): {at: "Tue 21:40" (sinceText) | null, newer: the plan's roads are
 *  not the ones it froze on}: COPY.frozenEdit's time. */
export function frozenSince(frozenOn, g, version = null) {
  const f = frozenOn?.[g];
  return { at: f?.at ? sinceText(f.at) : null, newer: !!f?.version && !!version && f.version !== version };
}

/**
 * Ink = what the ticket says: a document with a locked ticket (every step ticked: those transfers are in FPL) but
 * another GW-A squad in its plan, road pin or transfer call → its accepted repaired: the road pin holds the ticket's
 * squad (locked), the call is the model's plan when its GW A is that squad, the plan that road (else null: it re-plans);
 * null when consistent. model: memory's model plan. The read thaws the lock it writes.
 */
export function inkRepair(doc, { A, model, nameOf = (id) => `#${id}` } = {}) {
  const acc = doc?.accepted, t = doc?.ticket;
  const squad = ticketSquad(t?.plan);
  if (!acc || !t?.locked || !squad.length || Number(t.plan.gw ?? A) !== A) return null;
  const key = [...squad].sort((a, b) => a - b).join(',');
  const items = Array.isArray(acc.pins?.items) ? acc.pins.items : [];
  const rp = items.find((p) => p.id === 'road');
  const pinOk = rp?.locked && heldAt(rp.must, A).sort((a, b) => a - b).join(',') === key;
  const planOk = !acc.plan?.weeks || squadKey(weekAt(acc.plan, A)) === key;
  if (pinOk && planOk && acc.locked_at) return null;
  const match = model?.weeks && squadKey(weekAt(model, A)) === key ? ['base', model] : null;
  const call = (acc.roads_taken || []).find((x) => x.call === 'transfer');
  const keyOf = match?.[0] ?? call?.road ?? 'yours';
  const pin = lockPin(rp && heldAt(rp.must, A).sort((a, b) => a - b).join(',') === key ? rp : null, squad, A, keyOf);
  const others = items.filter((p) => p.id !== 'road');
  const out = { ...acc, locked_at: acc.locked_at ?? nowS(), locked_by: acc.locked_by ?? 'ticket', pins: { ...(acc.pins || {}), items: [pin, ...others] } };
  if (match && call?.road !== match[0]) {
    const ins = ids(weekAt(match[1], A).in);
    const label = ins.length ? `${ins.map(nameOf).join(' + ')} in` : 'Roll';
    // a call the repair names is as old as the plan (editedAt: a repair on load is no use of the team)
    out.roads_taken = [...(acc.roads_taken || []).filter((x) => x.call !== 'transfer'), { ...(call || { call: 'transfer', at: num(acc.at) ?? nowS() }), road: match[0], label, not: [] }];
    out.verdicts = (acc.verdicts || []).filter((v) => v.call !== 'transfer');
  }
  if (!planOk || !pinOk) out.plan = null;
  return out;
}

export const pinWish = (id, gw, end, { label } = {}) => makePin({ id: `wish:${id}`, kind: 'wish', player: Number(id), label, gw, must: [[id, gw, end]] });
/** `funds` (a player id) marks a sale made so that buy fits (Ahead's "Do both"): its × takes that buy with it
 *  (ahead.removeMove). */
// (`week`: a take of a suggested move, its transfer binding its week alone, GW gw: the weeks after it are the solver's
// to plan, a re-buy of the sale or a sale of the buy among them; owner, 2026-11-02, "That week only": Murillo → Hill's
// take kept Murillo out to GW13, the solver's +2.0 plan buying him back in GW12, the plan after the take +1.0. Else
// from gw to `end`: a sale you set, "Sell Saka from GW9")
export const pinSell = (out, gw, end, { in: inn = null, label, funds = null, week = false } = {}) => makePin({
  ...(num(funds) !== null ? { funds: num(funds) } : {}),
  id: `sell:${out}`, kind: 'sell', player: Number(out), in: num(inn), label, gw, excl: [[out, gw, week && inn != null ? gw : end]], must: inn == null ? [] : [[inn, gw, week ? gw : end]],
});
export const pinSlide = (inn, out, g, A, end, { label } = {}) => makePin({
  id: `slide:${inn}`, kind: 'slide', player: Number(inn), out: Number(out), label, gw: g,
  must: [[inn, g, end], ...(g > A ? [[out, A, g - 1]] : [])], excl: [...(g > A ? [[inn, A, g - 1]] : []), [out, g, end]],
});
/** A Keep or veto for GW g only (scope 'gw': window g..g, id '<kind>:<player>@<g>'), or from g to the end (scope 'all',
 *  the default: one per player). */
const scoped = (prefix, id, g, end, scope) => (scope === 'gw' ? { id: `${prefix}:${id}@${g}`, span: [[id, g, g]], scope } : { id: `${prefix}:${id}`, span: [[id, g, end]], scope: 'all' });
export function pinVeto(id, A, end, { label, kind = 'veto', scope = 'all', ...o } = {}) {
  const s = scoped('out', id, A, end, scope);
  return makePin({ ...o, id: s.id, kind, scope: s.scope, player: Number(id), label, gw: A, excl: s.span });
}
export const pinNever = (id, A, end, o = {}) => pinVeto(id, A, end, { ...o, kind: 'never' });
/** A transfer refused, `out` for `inn` in GW g alone (Show another; owner, 2026-11-05, "not rice for mbeumo"): no window
 *  of its own, so `inn` can still come for someone else and `out` go for someone else (values.not_for: --not-for-gw). */
export const pinNotFor = (out, inn, g, { label, ...o } = {}) => makePin({ ...o, id: `notfor:${out}>${inn}@${g}`, kind: 'notfor', player: Number(inn), out: Number(out), label, gw: g });
export function pinKeep(id, from, end, { label, scope = 'all', ...o } = {}) {
  const s = scoped('keep', id, from, end, scope);
  return makePin({ ...o, id: s.id, kind: 'keep', scope: s.scope, player: Number(id), label, gw: from, must: s.span });
}
/** A rule's window in words: "GW6" (one GW), "all weeks" (start..end), "from GW8" (to the end), else "GW6–8". start /
 *  end: the plan's first and last GW. */
export function scopeOf(p, { start, end } = {}) {
  const w = [...parseSpans(p?.must || []), ...parseSpans(p?.excl || [])].filter(([id]) => id === Number(p?.player));
  if (!w.length) return '';
  const a = Math.min(...w.map(([, x]) => x)), b = Math.max(...w.map(([, , y]) => y));
  if (a !== b && end != null && b >= end) return start != null && a <= start ? 'all weeks' : `from GW${a}`;
  return COPY.range(a, b);
}
/** A chip in GW gw (null takes it out: composePins drops the GW). */
export const pinChip = (gw, chip, o = {}) => makePin({ ...o, id: `chip:${gw}`, kind: 'chip', gw, chips: { [gw]: chip ?? 'none' } });
/** --cash in tenths (calls.cashTenths: £0.0m goes as £0.1m, rolling.py:592-593). */
export const pinCash = (tenths, o = {}) => makePin({ ...o, id: 'cash', kind: 'cash', cash: tenths });

const BANKED = new WeakMap();
/**
 * The engine base your plan starts GW A from: the entry's, with the bank your "Bank as FPL shows" rule plans from
 * (pinCash) when you set one. The one source of every bank the phone shows (ahead.baseOf) and of the drift's budget
 * check. Memoised per base and cash. → base
 */
export function withBank(base, pins) {
  const cash = cashOf(pins || []);
  if (!base || cash === null) return base;
  let by = BANKED.get(base);
  if (!by) BANKED.set(base, (by = new Map()));
  if (!by.has(cash)) by.set(cash, { ...base, bank: cash / 10 });
  return by.get(cash);
}
/** At most n hits in GW gw: sent as --max-hits-gw "gw:n". A restriction below the solver's default cap (meta.hit_cap; a
 *  GW with no rule takes it); 0 is no hit. Made by splitRoad and Ahead's forkValues. */
export const pinHits = (n, gw, o = {}) => makePin({ ...o, id: `hits:${gw}`, kind: 'hits', gw, hits: { [gw]: n } });

/** A road's week as squadInto reads it: gw → {squad, chip} | null. */
export const roadWeek = (road) => (x) => { const w = weekAt(road, x); return w ? { squad: squadOf(w), chip: w.chip ?? null } : null; };

/** Whether `road` makes a transfer in GW g (more than n: a Roll keeping n moves of yours): its week buys or sells
 *  someone (a Road week's in / out are the solver's net moves against the squad going into g: team.py apply_solution),
 *  or a wildcard / free hit remakes it; a GW it doesn't plan counts. */
export function movesIn(road, g, n = 0) {
  const w = weekAt(road, g);
  return !w || w.chip === 'wc' || w.chip === 'fh' || ids(w.in).length > n || ids(w.out).length > n;
}

/** The squad going into GW g's moves on a plan: the week before's (a free hit's is thrown away after it: team.py:161,
 *  175), else GW A's own (`owned`: before GW A, or past the plan's weeks). weekOf(gw) → {squad, chip} | null; Ahead's
 *  plan view and plan memory read it by this one rule. */
export function squadInto(weekOf, g, A, owned = []) {
  for (let x = Number(g) - 1; x >= A; x--) {
    const w = weekOf(x);
    if (!w) return owned;
    if (w.chip !== 'fh') return w.squad;
  }
  return owned;
}

/**
 * "Roll GW g": no transfers in GW g, whatever earlier weeks do. Sent as values.no_buys_gw (planValues: --no-buys-gw),
 * so it holds no player and is never stale: an edit of an earlier week only changes who goes into g. composePins lists
 * g in `rolls` (and caps its hits at 0); a road keeps it when it moves nobody in g (movesIn). With k exact moves of
 * yours in GW g it caps the week at them (composePins' `caps`, values.max_buys_gw), k the most it keeps. Made by a
 * suggested plan's + (ahead.addPlan) and in a fork's solve (ahead.forkValues): owner, 2026-10-13, "Lock it, both
 * modes".
 */
export const pinRoll = (g, k = 0) => makePin({ id: `roll:${g}`, kind: 'roll', gw: g, label: COPY.rollRule(g, k), ...(k > 0 ? { caps: { [g]: k } } : {}) });

/**
 * The pins a GW's plan hands to the next one once its deadline passes: your asks for later GWs, clipped to start at
 * the new GW. A Keep or veto of every week (scope 'all') runs to the new window's end; any other keeps its own end.
 * The road you took, its rules, cash and past chips stay behind.
 */
export function carryPins(prevDoc, A, end) {
  const out = [];
  for (const p of prevDoc?.accepted?.pins?.items || []) {
    if (p.kind === 'road' || p.kind === 'cash' || p.via) continue;  // the call and the rules it came with stay
    const clip = (xs) => parseSpans(xs || []).map(([id, a, b]) => [id, Math.max(a, A), p.scope === 'all' ? end : Math.min(b, end)]).filter(([, a, b]) => a <= b);
    const chips = Object.fromEntries(Object.entries(p.chips || {}).filter(([g]) => Number(g) >= A && Number(g) <= end));
    const hits = Object.fromEntries(capsOf(p, A, end));
    const must = clip(p.must), excl = clip(p.excl);
    const roll = isRoll(p) && num(p.gw) >= A && num(p.gw) <= end;
    if (!roll && !must.length && !excl.length && !Object.keys(chips).length && !Object.keys(hits).length) continue;
    const { chips: _c, hits: _h, ...rest } = p;
    out.push({ ...rest, must, excl, max_hits: 0, ...(Object.keys(chips).length ? { chips } : {}), ...(Object.keys(hits).length ? { hits } : {}), gw: p.gw === null ? null : Math.max(p.gw, A) });
  }
  return out;
}
