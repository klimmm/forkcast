// calls.js: the price watch

import * as E from '../../plan/engine.js';
import { fmt } from '../../ui.js';
import { EPS, andList, lookupOf, num, tenths } from './helpers.js';
import { COPY } from './copy.js';
import { handoffMoves } from './measure.js';

// ---------------------------------------------------------------- price watch (FPL's price changes before GW A)

/** FPL's status words by likelihood (price_change_projections[0].likelihood: ±5 "Very likely to rise / drop", ±4
 *  "Likely to …", else "Unlikely to change"). On our 2026 snapshots a ±5 changed that night 97% of the time read within
 *  3 h of the change (85–92% earlier), so it is counted; a ±4 1.5–53%, so it is said and never counted. */
export const PRICE_WORD = Object.freeze({ 5: 'very likely to rise', 4: 'likely to rise', [-4]: 'likely to drop', [-5]: 'very likely to drop' });
/** FPL's reading as Forkcast says it, the price watch's word (o: priceOutlook's; when: the night, "tonight" / "by
 *  Wednesday night", or none): a "very likely" in FPL's words; a "likely", right 1.5–53% of the time, as "may rise" /
 *  "may drop" with FPL's word in brackets, so it claims no odds and no money. → "very likely to drop tonight" | "may
 *  rise tonight (FPL: likely)" | null. */
export const priceSaid = (o, when = '') => {
  if (!o?.dir) return null;
  const at = when ? ` ${when}` : '';
  return o.sure ? `${o.word}${at}` : `may ${o.dir > 0 ? 'rise' : 'drop'}${at} (FPL: likely)`;
};
const SURE = 5, MAYBE = 4;
const DAY_S = 86400;
/** A reading this long before the change is "early" (watchNote: a ±5 read 3–8 h before changed 85%). */
const WATCH_OLD_S = 8 * 3600;
const LONDON = 'Europe/London';  // FPL changes prices at 00:00 UK time (premierleague.com, 2026/27)

/** Intl formatters by time zone and options, made once (a formatter costs tens of ms on a phone). tz undefined: this
 *  browser's. */
const FMTS = new Map();
function fmtIn(tz, opts) {
  const k = `${tz ?? ''}|${JSON.stringify(opts)}`;
  let f = FMTS.get(k);
  if (!f) FMTS.set(k, (f = new Intl.DateTimeFormat('en-GB', { ...opts, ...(tz ? { timeZone: tz } : {}) })));
  return f;
}
const HM = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };

/** FPL's price-change nights (meta.price_change_deadlines: the snapshot's next nights; offset k of a player's
 *  price_watch is the projection at the k-th) → {nights: [{k, epoch}] still ahead and before `until` (GW A's deadline),
 *  stale: the snapshot predates a change already made (its prices and the entry's sale prices are from before it), asOf
 *  (epoch s: FPL's last update of the rows' projections: meta.prices_as_of when the bundle's prices block brought
 *  fresher ones (withPrices), else meta.price_change_as_of)}. */
export function priceNights(meta, { now = Date.now() / 1000, until = null } = {}) {
  const all = (Array.isArray(meta?.price_change_deadlines) ? meta.price_change_deadlines : []).map(num);
  const nights = all.map((epoch, k) => ({ k, epoch })).filter((n) => n.epoch !== null && n.epoch > now && (until === null || n.epoch < until));
  return { nights, stale: all.some((e) => e !== null && e <= now), asOf: num(meta?.prices_as_of ?? meta?.price_change_as_of) };
}

/** The bundle's players columns ({fields, rows}) with its prices block laid over them (api/mobile.py bundle `prices`:
 *  FPL's projections read since the snapshot, {fields: ['id', …], rows}, sent even while the version is unchanged), by
 *  id and field name: a player the block leaves out keeps his row, a field the players lack is skipped. → `cols` itself
 *  without a block. The bundle's own players are never changed. app.js derive and planInputs build their rows from it. */
/** The bundle's players columns as the phone shows them: its live block laid over them (the newest capture's display
 *  fields, api/data.py live_block: kept players' status, news, price, ownership...), then its prices block. */
export const shownPlayers = (b) => withPrices(withPrices(b?.players, b?.live), b?.prices);

export function withPrices(cols, prices) {
  const pf = prices?.fields, cf = cols?.fields;
  if (!Array.isArray(pf) || !Array.isArray(prices.rows) || !Array.isArray(cf) || !Array.isArray(cols.rows)) return cols;
  const pid = pf.indexOf('id'), cid = cf.indexOf('id');
  if (pid < 0 || cid < 0) return cols;
  const at = pf.flatMap((f, j) => (f !== 'id' && cf.includes(f) ? [[cf.indexOf(f), j]] : []));
  const fresh = new Map(prices.rows.map((r) => [Number(r[pid]), r]));
  return {
    ...cols,
    rows: cols.rows.map((r) => {
      const p = fresh.get(Number(r[cid]));
      if (!p) return r;
      const out = [...r];
      for (const [i, j] of at) out[i] = p[j];
      return out;
    }),
  };
}

/**
 * A player's FPL price outlook over `nights` (priceNights) from his bundle row (price_watch [[likelihood, %] by
 * offset], price_locked_until, price_calibrating) → {dir (+1 rise, −1 drop, 0), sure (FPL's "very likely": counted),
 * night (index into nights) | null, likelihood, word (PRICE_WORD), held ('locked' | 'calibrating' | null)}. His first
 * "very likely" night is the one (offset k at 100% or more is a change by night k, never a second one); else his first
 * "likely" night (said, not counted). Locked through a night or calibrating (just changed or added): no change.
 */
export function priceOutlook(row, nights) {
  const none = { dir: 0, sure: false, night: null, likelihood: 0, word: null, held: null };
  if (!row) return none;
  if (row.price_calibrating) return { ...none, held: 'calibrating' };
  const lock = Date.parse(row.price_locked_until ?? '') / 1000;  // NaN when not locked
  const pw = Array.isArray(row.price_watch) ? row.price_watch : [];
  let maybe = null, locked = false;
  for (const [j, n] of nights.entries()) {
    if (lock >= n.epoch) { locked = true; continue; }
    const l = num(pw[n.k]?.[0]) ?? 0;
    const at = { dir: Math.sign(l), night: j, likelihood: l, word: PRICE_WORD[l] ?? null, held: null };
    if (Math.abs(l) >= SURE) return { ...at, sure: true };
    if (Math.abs(l) >= MAYBE) maybe ??= { ...at, sure: false };
  }
  return maybe ?? { ...none, held: locked ? 'locked' : null };
}

/** A price-change night in words, for the viewer (tz: theirs, default this browser's) → {tonight (less than a day
 *  away), when ('tonight' | 'tomorrow' | 'Saturday night': the UK evening it ends, as FPL changes prices at 00:00 UK),
 *  short ('tonight' | 'tomorrow' | 'Sat'), clock ("00:00 UK · 02:00 your time"; "Thu 00:00 UK · Thu 02:00 your time"
 *  for a later night; the UK time alone when the viewer's is the same)}. The night after tonight is "tomorrow", never
 *  its UK evening's day (owner, 2026-10-29). */
export function nightWords(epoch, now, tz) {
  const ms = epoch * 1000;
  const tonight = epoch - now <= DAY_S, tomorrow = !tonight && epoch - now <= 2 * DAY_S;
  const eve = fmtIn(LONDON, { weekday: 'long' }).format(ms - 3600e3);
  const day = (z) => (tonight ? '' : `${fmtIn(z, { weekday: 'short' }).format(ms)} `);
  const uk = `${day(LONDON)}${fmtIn(LONDON, HM).format(ms)}`, local = `${day(tz)}${fmtIn(tz, HM).format(ms)}`;
  return {
    tonight, when: tonight ? 'tonight' : tomorrow ? 'tomorrow' : `${eve} night`, short: tonight ? 'tonight' : tomorrow ? 'tomorrow' : eve.slice(0, 3),
    clock: uk === local ? `${uk} UK` : `${uk} UK · ${local} your time`,
  };
}

/** The Player data plate "Price change" (priceOutlook over every night FPL projects): "▲ tonight" / "▼ Wed" (very
 *  likely, the night), "▲ likely", "Locked", "Calibrating", else "—" (unlikely to change, or a snapshot from before a
 *  change already made). */
export function pricePlate(row, meta, { now = Date.now() / 1000, tz } = {}) {
  const { nights, stale } = priceNights(meta, { now });
  if (stale || !nights.length) return fmt.dash;
  const o = priceOutlook(row, nights);
  if (o.held) return o.held === 'locked' ? 'Locked' : 'Calibrating';
  if (!o.dir) return fmt.dash;
  const arrow = o.dir > 0 ? '▲' : '▼';
  return o.sure ? `${arrow} ${nightWords(nights[o.night].epoch, now, tz).short}` : `${arrow} likely`;
}

/**
 * GW A's price watch: FPL changes prices once a night (00:00 UK, meta.price_change_deadlines), so for each night
 * before GW A's deadline, what making GW A's moves after it costs and what that puts out of reach, by FPL's
 * projections (priceOutlook: "very likely" counted, "likely" said). A sale moves by the half-profit rule (entry
 * sell_price_up / sell_price_down: api/entry.py through the solver's net_at, never re-done here), a buy by its whole
 * £0.1m step. The consequence is the engine's accounting (planBanks) of the same plan at those prices: GW A's bank
 * going below 0 (these moves out of reach), a later GW's (that GW's moves), else money only. A GW-A buy's resale after
 * the rise is FPL's (half of £0.1m rounds down to nothing), so a later sale of him nets the rise out.
 * ctx: planInputs (base: the bank your plan starts from; meta: the bundle's); draft: the plan (planFromRoad's).
 * → null when no player of GW A's moves has a change predicted before the deadline (or the snapshot predates a change
 * already made), else {nights: [{epoch, k, w (£m waiting past it costs; < 0 gains), verdict ('thisMove' | 'laterMove'
 * | 'money' | 'gain' | 'free'), gw (the GW put out of reach) | null, short (£m), bank {now, wait} (GW A's), allOk}],
 * act (the first night waiting costs) | null, at (the night the line speaks of: act, else the best one to wait past) |
 * null, players {id: outlook + {id, role, name, step (tenths: his sale's or buy's), sale (£m now), counted}}, moves
 * [{out, in, parts [{id, dir, sure, text}], text}], line (the call to act, what waiting costs, or why waiting is free)
 * | null, tone ('act' | 'info'), note (FPL's reading's time), asOf}
 */
export function priceWatch(ctx, draft, { now = Date.now() / 1000, tz } = {}) {
  const meta = ctx?.meta || {};
  const { nights, stale, asOf } = priceNights(meta, { now, until: num(meta.deadline_epoch) });
  if (stale || !nights.length || !draft || !ctx?.base) return null;
  const L = lookupOf(ctx), A = ctx.A;
  const ev = E.evaluate({ base: ctx.base, players: ctx.players, draft, horizon: ctx.gws, banksOnly: true });
  const moves = handoffMoves(ev.gws.find((s) => s.gw === A));
  const owned = new Map((ctx.base.squad || []).map((r) => [Number(r.id), r]));
  const players = {};
  for (const m of moves) {
    for (const [id, role] of [[m.out, 'sell'], [m.in, 'buy']]) {
      const o = priceOutlook(L.get(id)?.row, nights);
      const r = owned.get(Number(id));
      const sale = role === 'sell' ? num(r?.sell_price) : null;
      const after = role === 'sell' && o.dir ? tenths(o.dir > 0 ? r?.sell_price_up : r?.sell_price_down) : null;
      // a sale without the entry's stepped price (an older server) is said, never guessed
      const step = !o.dir ? 0 : role === 'buy' ? o.dir : after === null || sale === null ? null : after - tenths(sale);
      players[id] = { ...o, id: Number(id), role, name: L.name(id), sale, step, counted: o.sure && step !== null };
    }
  }
  const list = Object.values(players);
  if (!list.some((p) => p.dir)) return null;

  const banks = (base, pl) => E.planBanks({ base, players: pl, draft, horizon: ctx.gws });
  const now0 = banks(ctx.base, ctx.players);
  const neg = (b) => num(b) !== null && b < -EPS;
  const out = nights.map((n, j) => {
    const ps = list.filter((p) => p.counted && p.night <= j);
    const sale = new Map(ps.filter((p) => p.role === 'sell').map((p) => [p.id, p.step]));
    const buy = new Map(ps.filter((p) => p.role === 'buy').map((p) => [p.id, p.step]));
    const wT = ps.reduce((s, p) => s + (p.role === 'buy' ? p.step : -p.step), 0);
    // the plan at the prices after night j: the entry's sales and the bundle's buy prices, overlaid (a Map of every row)
    const base = !sale.size ? ctx.base : { ...ctx.base, squad: ctx.base.squad.map((r) => (sale.has(Number(r.id)) ? { ...r, sell_price: (tenths(r.sell_price) + sale.get(Number(r.id))) / 10 } : r)) };
    const pl = !buy.size ? ctx.players : new Map(L.all().map((r) => [r.id, buy.has(r.id) ? { ...r.row, id: r.id, price: (r.priceT + buy.get(r.id)) / 10 } : r.row]));
    const wait = ps.length ? banks(base, pl) : now0;
    const gw = wT > 0 ? ctx.gws.find((g) => !neg(now0[g]) && neg(wait[g])) ?? null : null;
    const verdict = wT > 0 ? (gw === null ? 'money' : gw === A ? 'thisMove' : 'laterMove') : wT < 0 ? 'gain' : 'free';
    return { epoch: n.epoch, k: n.k, w: wT / 10, verdict, gw, short: gw === null ? 0 : -wait[gw], bank: { now: now0[A], wait: wait[A] }, allOk: ctx.gws.every((g) => !neg(wait[g])), counted: ps.length };
  });
  const act = out.findIndex((x) => x.w > EPS);

  const words = nights.map((n) => nightWords(n.epoch, now, tz));
  const by = (j) => (words[j].tonight ? 'tonight' : `by ${words[j].when}`);
  const lines = moves.map((m) => {
    const parts = [players[m.out], players[m.in]].filter((p) => p.dir).map((p) => ({ id: p.id, dir: p.dir, sure: p.sure, text: COPY.watchPart(p, by(p.night)) }));
    return { out: m.out, in: m.in, parts, text: parts.length ? parts.map((p) => p.text).join(' · ') : null };
  });
  const ref = (j) => `${words[j].when}'s price change`;
  let line = null, short = null, at = null;
  if (act >= 0) {
    const x = out[act];
    const later = x.verdict === 'laterMove' ? andList((draft.moves?.[x.gw] || []).map((m) => `${L.name(m.out)} → ${L.name(m.in)}`)) : null;
    line = COPY.watchAct({ ...x, n: moves.length, ref: ref(act), clock: words[act].clock, before: act > 0 ? ref(act - 1) : null,
      buys: andList(moves.map((m) => L.name(m.in))), later });
    short = COPY.watchShort({ ...x, n: moves.length, ref: ref(act) });
    at = act;
  } else if (out.some((x) => x.counted)) {
    const best = out.reduce((a, x, j) => (x.w < out[a].w - EPS ? j : a), 0);
    line = out[best].w < -EPS ? COPY.watchGain(-out[best].w, ref(best)) : COPY.watchFree(moves.length);
    short = out[best].w < -EPS ? COPY.watchShort({ ...out[best], ref: ref(best) }) : null;
    at = best;
  }
  // the reading's time, with its day when it is not today's (a snapshot from before last night)
  const date = (e) => fmtIn(tz, { dateStyle: 'short' }).format(e * 1000);
  const asOfText = asOf === null ? null : `${date(asOf) !== date(now) ? `${fmtIn(tz, { weekday: 'short' }).format(asOf * 1000)} ` : ''}${fmtIn(tz, HM).format(asOf * 1000)}`;
  const old = asOf !== null && nights[act >= 0 ? act : 0].epoch - asOf >= WATCH_OLD_S;
  // the act tone (amber) only while waiting puts a move out of reach; money only is a quiet fact
  const moveAtStake = act >= 0 && (out[act].verdict === 'thisMove' || out[act].verdict === 'laterMove');
  return {
    nights: out, act: act >= 0 ? act : null, at, players, moves: lines, line, short, tone: moveAtStake ? 'act' : 'info',
    note: asOfText ? COPY.watchNote(asOfText, old) : null, asOf,
  };
}

/** The word the morning after a price watch. `kept` ({epoch: the night its line spoke of, gw: GW A, prices {id:
 *  tenths}}: the counted players' FPL prices, kept while it showed) against `prices` ({id: tenths}: the bundle's now)
 *  and GW A's bank after its moves now (£m; null when none), once that night has passed and the bundle is from after it
 *  (priceNights: not stale) → "Groß rose overnight (+£0.1m): your GW6 moves still fit" | "…: £0.1m short now" | "Prices
 *  held overnight"; null until then. name: id → name. */
export function priceMorning(kept, meta, { now = Date.now() / 1000, prices = {}, bank = null, name = String } = {}) {
  if (!kept || !(kept.epoch <= now) || priceNights(meta, { now }).stale) return null;
  const moved = Object.entries(kept.prices || {}).map(([id, t]) => ({ name: name(Number(id)), t: (prices[id] ?? t) - t })).filter((x) => x.t);
  return COPY.watchMorning(moved, kept.gw, bank);
}


/**
 * How far a bake is (Ahead's GW line and the shell's bar while it re-plans): bake is the bundle's (api/mobile.py
 * progress: done, total, started, items {state, elapsed, started}; epoch seconds). → {done, total, so: seconds since
 * it started (null: unknown), left: seconds (null while none is done: "estimating…"), late: the estimate ran out
 * ("almost done")}. left = what the running items have left of the average a done item took (an item past it eats into
 * the rest), plus the average per item not started (total counts stages not added yet), ÷ the items running at once:
 * it counts down a second a second between landings, and where it runs out says so, never negative or ever-growing.
 */
export function planEta(bake, now = Date.now() / 1000) {
  const items = Array.isArray(bake?.items) ? bake.items : [];
  const done = Number(bake?.done) || 0, total = Number(bake?.total) || 0;
  const t0 = Number(bake?.started);
  const so = t0 > 0 ? Math.max(0, now - t0) : null;
  const took = items.filter((i) => i.state === 'done' && Number(i.elapsed) > 0).map((i) => Number(i.elapsed));
  if (!took.length || !total) return { done, total, so, left: null, late: false };
  const avg = took.reduce((a, b) => a + b, 0) / took.length;
  const running = items.filter((i) => i.state === 'running');
  const open = items.filter((i) => i.state === 'queued' || i.state === 'waiting').length + Math.max(0, total - items.length);
  const ran = (i) => (Number(i.started) > 0 ? Math.max(0, now - Number(i.started)) : 0);
  const left = (running.reduce((a, i) => a + avg - ran(i), 0) + open * avg) / Math.max(1, running.length);
  return { done, total, so, left: Math.max(0, left), late: left < 1 };
}
/** planEta as the wait's one story says it (Connect's line and Ahead's GW line; owner, 2026-10-27): its time left never
 *  backs up, counting down a second a second from the least it said for this bake; once that ran out with a road still
 *  planned, none is said again for this bake (`spent`: the clock and the bar go on alone). `now` epoch seconds, for the
 *  tests. */
const LEFTS = new Map();  // `${version}@${started}` → {left, at}: the least said, the newest few bakes
export function steadyEta(bake, now = Date.now() / 1000) {
  const e = planEta(bake, now);
  const k = `${bake?.version}@${bake?.started}`, was = LEFTS.get(k);
  if (was && was.left - (now - was.at) < 1) return { ...e, left: null, late: false, spent: true };
  if (e.left == null) return e;
  const left = was ? Math.min(e.left, was.left - (now - was.at)) : e.left;
  LEFTS.delete(k);
  LEFTS.set(k, { left, at: now });
  if (LEFTS.size > 4) LEFTS.delete(LEFTS.keys().next().value);
  return { ...e, left, late: left < 1 };
}
/** 84 → "1:24", 3725 → "1:02:05": every clock on the phone (the bake's and Add a player's checks); a time before 0 is
 *  0:00 (a server's start time read against a phone clock behind it printed "-1:-1:-1"). */
export const clockText = (s) => {
  const t = Math.max(0, Math.floor(s)), hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = String(t % 60).padStart(2, '0');
  return hh ? `${hh}:${String(mm).padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
};
/** A check's clock after its line's " · " ("Checking GW8 · 1 of 4 weeks · 0:12"): the time since `t0` (ms), on
 *  clockText (sheets/wish.js, sheets/chips.js). */
export const waitedText = (t0, now = Date.now()) => ` · ${clockText((now - t0) / 1000)}`;
/** A time left, rounded as it is meant: "~20 s", "~1 min", "~3 min". */
export const aboutText = (s) => (s < 55 ? `~${Math.max(10, Math.round(s / 10) * 10)} s` : `~${Math.max(1, Math.round(s / 60))} min`);
/** What a time left reads (planEta's): "~1 min left", "almost done", "estimating…" before any road is done. */
export const leftText = (e) => (e.left == null ? 'estimating…' : e.late ? 'almost done' : `${aboutText(e.left)} left`);
/** The wait line's words after its verb (owner, 2026-10-28), longest first, for ahead.paintWait to show the longest
 *  that fits whole (never an ellipsis): what it works on (`long` "GW10's moves", `scope` "GW10"), how far (`prog` "2 of
 *  6", "~10 s left"), the clock (`so` seconds; past 10 s kept before what it works on); the bar under it says how far
 *  in any case. The verb itself never goes. Pure. → [string] */
export function waitLines({ scope = null, long = null, prog = null, so = null }) {
  const t = so == null ? null : clockText(so);
  const one = (s, ...xs) => `${s ? ` ${s}` : ''}${xs.filter(Boolean).map((x) => ` · ${x}`).join('')}`;
  // (past 10 s the clock before what it works on, the clock alone before the GW alone: the GW tile above says the week)
  const mid = so != null && so >= 10 ? [one(null, prog, t), one(scope, prog)] : [one(scope, prog), one(null, prog, t)];
  return [...new Set([long && one(long, prog, t), one(scope, prog, t), ...mid, one(scope, t), one(null, prog), one(null, t), one(scope), ''].filter((x) => typeof x === 'string'))];
}
/** A determinate share for a count of steps: `done` of `n` in, the step under way creeping towards 80 % of its share as
 *  the steps so far took (`tau` ms each, `since` ms into it), so a 1-of-1 check moves without jumping to full and stops
 *  short of the next mark until it lands. Pure. → 0..1 */
export const stepShare = (done, n, since = 0, tau = 4000) => (n > 0 ? Math.min(1, (done + 0.8 * (1 - Math.exp(-Math.max(0, since) / Math.max(1000, tau)))) / n) : 0);
/** A bake's progress as a share of its time, for a bar (owner, 2026-10-13: smooth, based on eta, not 0/6): so far ÷ (so
 *  far + left), from planEta; never back (a landing that lengthens the estimate holds the bar at the most shown for
 *  this bake) and never full while a road is still planned; null while nothing is estimated (no road done yet: the bar
 *  sweeps). */
const SHARES = new Map();  // `${version}@${started}` → the most shown, the newest few bakes
export function planShare(bake, now = Date.now() / 1000) {
  const e = planEta(bake, now);
  if (e.left == null || !e.so || !e.total) return null;
  const k = `${bake.version}@${bake.started}`;
  const p = Math.min(Math.max(SHARES.get(k) ?? 0, e.so / (e.so + e.left)), 1 - 0.5 / e.total);
  SHARES.delete(k);
  SHARES.set(k, p);
  if (SHARES.size > 4) SHARES.delete(SHARES.keys().next().value);
  return p;
}
/** The lines a wait shows (waitFact), true of bundle b: your rank's move over the last GW, then the line every GW
 *  (rank.cheer). Both only once FPL has checked that GW for you: rank.cheer is null until then (api/mobile.py), and the
 *  history's last row holds a provisional rank. Pure. → [[before, number, after]] */
export function waitFacts(b) {
  const r = b?.rank, [prev, last] = (b?.entry?.history ?? []).slice(-2);
  if (!r?.cheer) return [];
  const moved = last?.gw === r.gw && prev?.gw === r.gw - 1 && last.overall_rank > 0 && prev.overall_rank > 0;
  return [moved && COPY.factMove(r.gw, prev.overall_rank, last.overall_rank), COPY.factRank(r.cheer)].filter(Boolean);
}
/** The wait's line for its act (app.js factPanel: Connect's, then Ahead's cheer slot for the whole wait; owner,
 *  2026-10-27): while it plans (act 0) the first of waitFacts, while it checks the plan's moves (act 1) the second; the
 *  one there is in both when there is one. Pure. → [before, number, after] | null */
export const waitFact = (b, act = 0) => { const f = waitFacts(b); return f[Math.min(act, f.length - 1)] ?? null; };
