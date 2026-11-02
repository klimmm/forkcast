// ahead/edits.js: edits: your rules (sell, veto, want, keep, rescope), the armband and subs

import * as E from '../../../plan/engine.js';
import { subOrder } from '../../../plan/pitch.js';
import { COPY, subGap, sentence, hitCap } from '../../calls.js';
import { pinSell, pinVeto, pinNever, pinKeep, pinChip, composePins, pinConflicts, barredAt, ruleText, scopeOf, parseSpans } from '../../memory.js';
import { baked, ids, inputs, noteRemoved, num, plan, problemText, span, squadBefore, sum, weekOf, wishDrop } from '../core.js';
import { addYours, pinOfMove, removeMove, repicks, withFlag } from '../presolve.js';
import { bringIn, captainMoved, holdBuy, liftFrom, liftsLive, sayBuyProblem, takenBack } from '../buys.js';
import { squadWeek } from '../pieces.js';
import { MOVE_KINDS, rulesOf } from '../screen.js';
import { edit, hitAfter, hitsLater, sideEffects, toastOf, vsPrev, vsPrevOr, withPoints } from './say.js';
import { lineup } from './lineups.js';

/**
 * The one ending of every verdict that changes GW g's moves, after its points: a hit there (hitAfter), the moves the
 * planner swapped there (sideEffects) only where it chose them and never one the toast names already (`named`), moves
 * swapped in each later week ("replaces … in GW8"), a hit in each later week (hitsLater), a new GW-g captain
 * (captainMoved: toast only). → " after a −4 · replaces Scott → Groß · adds Mbeumo → Andrews in GW8 · −4 in GW8 · Saka
 * captain" | ''
 */
export function endingOf(Q, prev, g, { own = null, named = [] } = {}) {
  const key = (m) => `${m.out}>${m.in}`;
  const off = new Set(named.map(key));
  const bare = (V) => ({ ...V, weeks: V.weeks.map((w) => (w.gw === g ? { ...w, moves: w.moves.filter((m) => !off.has(key(m))) } : w)) });
  const chose = (x) => !prev.mem?.hold || repicks(prev, x);
  // a later week whose moves the planner changed (where it chose them; a Wildcard or Free Hit week is its chip's), each
  // clause with its GW; only Forkcast's moves
  const theirs = (V) => ({ ...V, weeks: V.weeks.map((w) => ({ ...w, moves: (w.moves || []).filter((m) => !pinOfMove(prev, { ...m, gw: w.gw }) && !pinOfMove(Q, { ...m, gw: w.gw })) })) });
  const later = Q.weeks.filter((w) => w.gw > g && chose(w.gw) && !squadWeek(w) && !squadWeek(weekOf(prev, w.gw)))
    .flatMap((w) => sideEffects(theirs(prev), theirs(Q), w.gw, null).split(' · ').filter(Boolean).map((c) => ` · ${c} in GW${w.gw}`));
  return [hitAfter(Q, prev, g), chose(g) ? sideEffects(bare(prev), bare(Q), g, own) : '', ...later,
    ...hitsLater(Q.weeks, prev.weeks, g).map((x) => ` · ${x}`), captainMoved(Q, prev, g)].join('');
}

/** Your own transfer among `asks` that brings `out` in before GW g (a sale's buy, a slide or a Wish of him), remade
 *  with his hold ending at GW g − 1, so selling him from g continues that transfer. → {chain: [Pin] (same ids), asks:
 *  `asks` with them in place} */
function sellsOn(asks, out, g) {
  const chain = asks.flatMap((q) => {
    const held = MOVE_KINDS.has(q.kind) ? (q.must || []).find(([id, a, b]) => Number(id) === Number(out) && a < g && b >= g) : null;
    return held ? [{ ...q, must: q.must.map((x) => (x === held ? [x[0], x[1], g - 1] : x)) }] : [];
  });
  return { chain, asks: asks.map((q) => chain.find((c) => c.id === q.id) ?? q) };
}
/** sellsOn for each of GW g's `moves` in turn: what selling them from g does to your rules besides GW g. → {chain:
 *  Map(id → Pin), asks} */
export function chainOf(P, g, moves) {
  let asks = asksOf(P);
  const chain = new Map();
  for (const m of moves) { const r = sellsOn(asks, m.out, g); asks = r.asks; for (const c of r.chain) chain.set(c.id, c); }
  return { chain, asks };
}

/** Sell `out` from GW g for `inn` (§5.7; memory.pinSell). The verdict names what the pick did to the rest of GW g
 *  (sideEffects); one Undo. addYours checks first: a pick that can't fit is refused before any solve. */
export function sellFrom(ctx, g, out, inn) {
  const P = plan(ctx);
  const r = addYours(ctx, P, g, out, inn);
  if (r.problem) { toastOf(ctx)(problemText(ctx, r.problem, P.L.name(inn)), 'warn'); return false; }
  const label = `${P.L.name(out)} → ${P.L.name(inn)} from GW${g}`;
  const pin = pinSell(out, g, P.end, { in: inn, label });
  // a wish of the player you pick is said by the pick; a Keep of the one you sell, a veto of the one you pick, a Roll
  // of that GW go, named in the verdict (withTaken). Your transfer that bought him stays, its hold ending the GW before
  // (sellsOn)
  const { chain, asks } = sellsOn(asksOf(P), out, g);
  const taken = clashing(P, pin, asks);
  const what = withTaken(P, COPY.cameIn([P.L.name(inn)], g === P.A ? null : g), taken);
  return edit(ctx, {
    pins: [pin, ...chain], drop: [...wishDrop(P, inn), ...taken.map((q) => q.id)], from: g, what, taken, inPlace: chain[0]?.id ?? null,
    ending: (Q, prev) => endingOf(Q, prev, g, { own: out }),
  });
}

/** Replace's "Let Forkcast choose": memory.pinSell without a pick, from GW g on; until the heal names the buy the plan
 *  before it shows (owner, 2026-10-26). Under the hold the week keeps the rest of its squad and takes one buy
 *  (memory.holdOf). */
export function sellAny(ctx, g, out) {
  const P = plan(ctx);
  const nm = P.L.name;
  const sold = (Q) => Q.weeks.filter((w) => w.gw <= g).flatMap((w) => w.moves.filter((m) => m.out === out).map((m) => ({ ...m, gw: w.gw }))).at(-1) ?? null;
  const pin = pinSell(out, g, P.end, { label: `Sell ${nm(out)} from GW${g}` });
  const { chain, asks } = sellsOn(asksOf(P), out, g);
  const taken = clashing(P, pin, asks);
  // the act in the past tense ("Scott sold from GW6"); its verdict names the buy the plan made and its number as the
  // Sell list row does ("total +3.3")
  const sale = `${nm(out)} sold from GW${g}`;
  const said = (Q) => { const m = sold(Q); return withTaken(P, m ? `${nm(out)} → ${nm(m.in)} in GW${m.gw}` : sale, taken); };
  return edit(ctx, {
    pins: [pin, ...chain], drop: taken.map((q) => q.id), inPlace: chain[0]?.id ?? null,
    from: g, what: withTaken(P, sale, taken), taken, text: withPoints(ctx, said, (Q, prev) => endingOf(Q, prev, sold(Q)?.gw ?? g, { own: out }), { total: true }),
  });
}

/** The best plan without the player a move buys (the baked veto road when it is the model's GW-A buy). scope: 'gw'
 *  (default from a move) or 'all' (any planned GW). A verdict that loses points ends with his FPL flag (withFlag). */
export function veto(ctx, m, { scope = 'gw' } = {}) {
  const P = plan(ctx);
  const nm = P.L.name;
  const one = scope === 'gw';
  const pin = one ? pinVeto(m.in, m.gw, m.gw, { scope, label: `Not ${nm(m.in)} in GW${m.gw}` }) : pinVeto(m.in, P.A, P.end, { label: `Not ${nm(m.in)}` });
  // his asks it contradicts go (a wish or pick of him, a Keep holding him then), named in the verdict (withTaken), and
  // every veto of him whose weeks meet it. One rule, one name: its chip's, "Not Groß · all weeks"
  const said = one ? `Not ${nm(m.in)} in GW${m.gw}` : ruleOf(P, pin).text;
  // your sale stays and only its buy changes (owner, 2026-10-10: the released row springs back with the new buy in
  // place), to the solver's pick (sellAny's rule), named once it lands. Never a phone-picked buy (owner, 2026-10-26)
  const mine = (() => { const q = pinOfMove(P, m); return q?.kind === 'sell' && Number(q.in) === Number(m.in) ? q : null; })();
  if (mine) {
    const g0 = Number(mine.gw);
    const sale = pinSell(m.out, g0, P.end, { label: `Sell ${nm(m.out)} from GW${g0}` });
    // the sale's own clashes too: it is open, which the week's Roll (a plan's +) forbids, so the Roll goes with it,
    // named
    const others = [...new Map([...clashing(P, pin), ...clashing(P, sale, asksOf(P).filter((q) => q.id !== mine.id))].filter((q) => q.id !== mine.id).map((q) => [q.id, q])).values()];
    const what = (Q) => {
      const x = weekOf(Q, m.gw)?.moves.find((y) => y.out === m.out);
      return withTaken(P, x ? `${said} · ${COPY.cameInFor(nm(x.in), nm(m.out), m.gw === P.A ? null : m.gw)}` : said, others);
    };
    return edit(ctx, {
      pins: [pin, sale], drop: [mine.id, ...others.map((q) => q.id), ...meeting(P, ['veto', 'never'], m.in, pin)], from: m.gw,
      text: withFlag(ctx, m.in, vsPrev(ctx, what)), what: withTaken(P, said, others), taken: others,
    });
  }
  const taken = clashing(P, pin);
  const what = withTaken(P, said, taken);
  const drop = [...taken.map((q) => q.id), ...meeting(P, ['veto', 'never'], m.in, pin)];
  // a veto of a buy your plan doesn't make leaves it as it is: its words alone, no "0.0 pts" (read as a refusal that
  // costs nothing: review 7, 2026-11-02); the corner shows the next best
  const text = withFlag(ctx, m.in, vsPrevOr(ctx, () => what, drop, vsPrev(ctx, what)));
  // the bake's veto road is the plan at once when it fits; else the solver plans without him
  const road = baked(ctx, [pin], drop);
  return edit(ctx, { pins: [pin], drop, road, from: road ? P.A : m.gw, text, what, taken });
}

/** Him from GW g, with the road the Wish pill already returned for him (null: the phone's buy): his wish pin with that
 *  road, the sale and money the solver's (holdBuy's 'pick'; owner, 2026-10-29: "rules only set gabriel to must have
 *  gw10"), else the phone's buy as your transfer (bringIn). No hits rule is set. One it can't make says why. */
export function want(ctx, id, g, road) {
  const P = plan(ctx);
  const bp = holdBuy(ctx, id, g, road);
  if (bp?.kind === 'none') { sayBuyProblem(ctx, P, id, bp); return false; }
  return bringIn(ctx, id, g, bp);
}

/** The keep pin for `id`: scope 'gw' (in GW gw only: the default from a planned sale) or 'all' (from when your plan has
 *  him, now or the GW it buys him, to the end; from GW `from` if given: a chip's "GW8–9"). */
export function keepPin(P, id, { gw = P.A, scope = 'all', from = null } = {}) {
  const nm = P.L.name(id);
  if (scope === 'gw') return pinKeep(id, gw, gw, { scope, label: `Keep ${nm} in GW${gw}` });
  // a Keep protects him from a sale, it never buys him early
  const since = P.owned.includes(id) ? P.A : P.weeks.find((w) => w.squad.includes(id))?.gw ?? P.A;
  const a = Math.max(since, from ?? since);
  return pinKeep(id, a, P.end, { label: a > P.A ? `Keep ${nm} from GW${a}` : `Keep ${nm}` });
}

/** Keep him (memory.pinKeep): in GW gw only (scope 'gw') or through the window ('all', the default; from GW `from` if
 *  given: keepPin). One verdict from every door: a Keep that leaves the plan as it is says what it changed
 *  (COPY.keptFromChoices); one that changes it says what and its points. A sale of yours it takes back goes, named,
 *  removed by you, one Undo; the solver plans what other rules then need (owner, 2026-10-26). */
export function keep(ctx, id, { gw, scope = 'all', from = null } = {}) {
  const P = plan(ctx);
  const nm = P.L.name;
  const pin = keepPin(P, id, { gw, scope, from });
  const [, a, b] = pin.must[0];
  const sales = P.weeks.filter((w) => w.gw >= a && w.gw <= b).flatMap((w) => w.moves.filter((m) => m.out === id).map((m) => ({ gw: w.gw, ...m })));
  const sc = scopeOf(pin, { start: P.A, end: P.end });
  const when = sc === 'all weeks' ? '' : sc.startsWith('from') ? ` ${sc}` : ` in ${sc}`;
  // what it overrules goes (a sale or a veto of him then, named in its verdict), and a keep of him whose weeks meet it
  const taken = clashing(P, pin);
  // The act done: "Raya kept in GW6", "Raya kept", "Raya kept from GW8"; a sale of his it takes back said with him
  // ("Saka kept in GW8 instead of Palmer": owner, 2026-10-22, two lines at most), other rules it takes back after it
  const own = taken.filter((q) => q.kind === 'sell' && Number(q.player) === Number(id) && q.in != null);
  const what = withTaken(P, `${nm(id)} kept${when}${own.length ? ` ${COPY.planInsteadOf(own.map((q) => nm(q.in)).join(' + '))}` : ''}`, taken.filter((q) => !own.includes(q)), own);
  const off = taken.map((q) => q.id);
  // a Keep of a Free Hit week stands beside a wider one, which never reaches that week (memory.composePins)
  const fhOnly = scope === 'gw' && squadWeek(weekOf(P, a)) === 'fh';
  const drop = [...off, ...(fhOnly ? [] : meeting(P, 'keep', id, pin))];
  const g = sales.length ? Math.min(...sales.map((m) => m.gw)) : a;  // the first week it changes: its ending's
  // its sales of yours it takes back, remembered as removed by you; no FPL flag after it (his card says it)
  const gone = sales.filter((m) => taken.some((q) => q.id === pinOfMove(P, m)?.id));
  const ending = (Q, prev) => endingOf(Q, prev, g, { own: id });
  return edit(ctx, {
    pins: [pin], drop, from: g, what, taken, also: gone.length ? () => noteRemoved(P, gone) : null,
    text: vsPrevOr(ctx, () => COPY.keptFromChoices(nm(id), when || ` through GW${P.end}`), off, withPoints(ctx, what, ending, { total: true })),
  });
}

/** Never buy: an exclude pin over every planned GW (memory.pinNever). When the plan buys him it is a veto of every
 *  planned GW. */
export function never(ctx, id) {
  const P = plan(ctx);
  const buy = P.weeks.flatMap((w) => w.moves.map((m) => ({ ...m, gw: w.gw }))).find((m) => m.in === id);
  if (buy) return veto(ctx, buy, { scope: 'all' });
  const pin = pinNever(id, P.A, P.end, { label: `Never ${P.L.name(id)}` });
  // an ask of him it contradicts goes, named as veto's (withTaken); the rule said as its chip, "Not Groß · all weeks"
  const taken = clashing(P, pin);
  const drop = [...taken.map((q) => q.id), ...meeting(P, ['veto', 'never'], id, pin)];
  const said = ruleOf(P, pin).text;
  const what = withTaken(P, said, taken);
  return edit(ctx, { pins: [pin], drop, from: P.A, what, taken, text: vsPrevOr(ctx, () => sentence(said), drop, vsPrev(ctx, what)) });
}

/** A Keep's or a veto's two scopes in words, {gw, all}: Keep · "GW8 only" | "GW8–9" (COPY.span); Not · "Not in GW8" |
 *  "Never" (a rule chip's sheet). */
export const scopeLabels = (kind, g, end) => (kind === 'keep' ? { gw: `GW${g} only`, all: span([g, end]) } : { gw: `Not in GW${g}`, all: 'Never' });

/** A Keep or a veto made one GW's (scope 'gw', its first GW) or wider (scope 'all': a Keep through the end, a veto
 *  every week: Never), as scopeLabels names them. The rule it was goes. */
export function rescope(ctx, pin, scope) {
  const P = plan(ctx);
  const id = Number(pin.player);
  const g = num(pin.gw) ?? P.A;
  if (pin.kind === 'keep') return keep(ctx, id, { gw: g, scope, from: g });
  return scope === 'all' ? never(ctx, id) : veto(ctx, { gw: g, out: null, in: id }, { scope });
}

/**
 * The buys the phone may guess for an edit: buyable players of `pos` the plan doesn't have, never one your rules keep
 * out from GW `from` on (barred) nor one of `not`, best mean xP over the planned GWs first: [id] (at most `limit`).
 */
export function buyCandidates(P, { pos, from, not = [], limit = 25 } = {}) {
  const have = new Set(P.weeks.flatMap((w) => w.squad));
  const no = new Set([...barred(P, from), ...not.map(Number)]);
  const gain = (r) => sum(ids(r.xp).slice(0, P.gws.length));
  return P.d.rows.filter((r) => r.buyable && P.L.pos(r.id) === pos && !have.has(Number(r.id)) && !no.has(Number(r.id)))
    .sort((a, b) => gain(b) - gain(a)).slice(0, limit).map((r) => Number(r.id));
}

/** Your asks: every pin but the road's, oldest first. */
export const asksOf = (P) => (P?.pins || []).filter((p) => p.id !== 'road' && p.id !== 'hold' && p.id !== 'hits');
/** Your pins of `kind` about player `id` (vetoes, Nevers, Keeps, sales, wishes: F11 lets one GW's stand beside another). */
export const pinsOf = (P, kind, id) => asksOf(P).filter((p) => Number(p.player) === Number(id) && [].concat(kind).includes(p.kind));
/** The GWs a pin holds its player in or keeps him out of: [a, b] (null without a window). */
export const windowOf = (p) => {
  const w = [...parseSpans(p.must || []), ...parseSpans(p.excl || [])].filter(([id]) => id === Number(p.player));
  return w.length ? [Math.min(...w.map(([, a]) => a)), Math.max(...w.map(([, , b]) => b))] : null;
};
/** Whether two pins' windows share a GW (F11: a GW6-only keep never clashes with a sale from GW8). */
const overlaps = (p, q) => { const a = windowOf(p), b = windowOf(q); return !!a && !!b && a[0] <= b[1] && b[0] <= a[1]; };
/** Your pins of `kind` about `id` whose weeks meet `pin`'s, but `pin` itself: their ids. A Keep or a veto replaces
 *  these (one rule per player). */
const meeting = (P, kind, id, pin) => pinsOf(P, kind, id).filter((q) => q.id !== pin.id && overlaps(q, pin)).map((q) => q.id);
/** Your asks `pin` contradicts: the older ones whose cells it takes the other way over the planned GWs
 *  (memory.pinConflicts) → [Pin]. They go with the edit. */
export const clashing = (P, pin, asks = asksOf(P)) => [...new Set(pinConflicts(asks, pin, { from: P.A, to: P.end, into: (g) => squadBefore(P, g) }).map((c) => c.pin).filter((q) => q && q.id !== 'hold'))];
/** The Rolls of yours `pin` takes back (clashing: it moves someone in a GW you roll) → [Pin]. */
/** An edit's words with the rules of yours it takes back, each in its chip's words ("Keeping Saka · Sell Saka from GW8
 *  removed"; a week's Roll "GW7 roll removed": takenBack). `gone`: the transfers' rules the edit takes off itself. */
// after words that end "removed" one clause, "Saka → Palmer, GW8 frozen removed" (owner, 2026-10-22: two lines at most)
export const withTaken = (P, what, pins, gone = []) => {
  const t = takenBack(P, pins, gone)?.text;
  return !t ? what : / removed$/.test(what) && / removed$/.test(t) ? `${what.replace(/ removed$/, '')}, ${t}` : [what, t].filter(Boolean).join(' · ');
};
/** A rule in words (memory.ruleText) as the plan's chips say it, scoped against the planned GWs (P: a plan view or
 *  info). */
export const ruleOf = (P, p) => ruleText(p, P.L.name, { end: P.end, start: P.A, cap: hitCap(P.b?.meta), hold: !!P.mem?.hold });
/** Your pin of `kind` about player `id` (a veto, Never, Keep, sale or wish) — one whose window covers GW `gw` when
 *  given — or null. */
export const pinOf = (P, kind, id, gw = null) => pinsOf(P, kind, id).find((p) => gw == null || overlaps(p, { player: id, must: [[Number(id), gw, gw]] })) ?? null;
/** The players your pins keep out in any GW from..to (memory.barredAt), but not the player a sale of yours sells from a
 *  later GW (he can come in before it), nor its buy before it (laterBuys). */
export const barred = (P, from, to = P.end) => barredAt(P.pins.map((p) => (p.kind === 'sell' && Number(p.gw) > from
  ? { ...p, in: null, excl: (p.excl || []).filter(([id]) => Number(id) !== Number(p.player)) } : p)), from, to);
/** The players your Keeps hold in GW g or later: Map(id → the first such GW). A sale from GW g has him out from g on,
 *  so a Keep of him then or later forbids it, in every sale the phone picks itself; a sale you choose takes the Keep
 *  back, named. */
export function keptFrom(P, g) {
  const out = new Map();
  for (const id of new Set(asksOf(P).filter((p) => p.kind === 'keep').map((p) => Number(p.player)))) {
    const x = P.gws.find((y) => y >= g && pinOf(P, 'keep', id, y));
    if (x != null) out.set(id, x);
  }
  return out;
}
/** The players your Keeps hold in each GW from g on of a plan that plays `chip` in GW g (null: none there, your own
 *  taken back) and your chip rules' chips in the other weeks (memory.composePins). A Wildcard's or Free Hit's squad
 *  keeps each of them. → [[id, GW]] */
export function keptCells(P, g, chip = null) {
  const asks = asksOf(P), keeps = new Set(asks.filter((p) => p.kind === 'keep').map((p) => p.id));
  if (!keeps.size) return [];
  const { cells } = composePins([...asks, pinChip(g, chip)], { from: g, to: P.end });
  return [...cells].flatMap(([id, by]) => [...by].filter(([, c]) => c.want === 'in' && keeps.has(c.pin)).map(([x]) => [id, x]));
}
/** The asks of yours that keep `id` out in GW g or after, or in any planned GW without g, newest first; barringRule,
 *  the newest | null: a list that leaves him out says why in that rule's chip words ("Not Groß · all weeks"). */
export const barringRules = (P, id, g = null) => rulesOf(P).filter((p) => parseSpans(p.excl || [])
  .some(([x, a, b]) => x === Number(id) && a <= P.end && b >= (g ?? P.A)));
export const barringRule = (P, id, g = null) => barringRules(P, id, g)[0] ?? null;

/** Sell `out` from GW g: for `inn` (sellFrom), or the plan's pick (sellAny). A Keep of him then or a Roll of that GW
 *  goes with it at once, named in its verdict. */
export function sellOut(ctx, g, out, inn = null) {
  return inn == null ? sellAny(ctx, g, out) : sellFrom(ctx, g, out, inn);
}

/** Take one ask off (a veto lifted, a Keep released…): the plan re-plans without it. */
export function liftAsk(ctx, id) {
  const P = plan(ctx);
  const pin = asksOf(P).find((p) => p.id === id);
  if (!pin) return false;
  // GW A under way is FPL's (liftsLive: a drop adds no pin for memory.inkClash to judge), as removeMove
  if (liftsLive(ctx, P, pin)) { toastOf(ctx)(COPY.live(P.A), 'warn'); return false; }
  const what = `Without “${ruleOf(P, pin).text}”`;
  return edit(ctx, { drop: [id], from: liftFrom(P, pin), what, text: vsPrev(ctx, what) });
}

/** One removal behind every door (card Remove, Keep's Off, a rule's switch; Your rules' Remove, a rule's sheet). A rule
 *  whose move the plan shows (a sale, a slide or a Wish: pinOfMove) comes off as its row's × takes it (removeMove); any
 *  other (a veto, a Keep, a chip, a hits rule, cash, a Wildcard or Free Hit week's buy) as liftAsk. → bool */
export function removeRule(ctx, id) {
  const P = plan(ctx);
  const pin = asksOf(P).find((p) => p.id === id);
  if (!pin) return false;
  const m = MOVE_KINDS.has(pin.kind) ? P.weeks.filter((w) => !squadWeek(w)).flatMap((w) => w.moves.map((x) => ({ ...x, gw: w.gw }))).find((x) => pinOfMove(P, x) === pin) : null;
  return m ? removeMove(ctx, m) : liftAsk(ctx, id);
}

/** M4 on Ahead: the armband in GW g. */
export function captain(ctx, g, id) {
  const P = plan(ctx);
  const w = weekOf(P, g);
  if (!w?.xi.includes(id)) return false;
  return lineup(ctx, g, { captain: id, vice: w.vice === id ? w.captain : w.vice }, COPY.captainNow(P.L.name(id)));
}

/** The vice-captain in GW g (the pitch's V dragged on a starter), phone-only like the armband (GW A under way refuses
 *  it). Toast "Mbeumo vice · Undo" (no points). → bool */
export function vice(ctx, g, id) {
  const P = plan(ctx);
  const w = weekOf(P, g);
  if (!w?.xi.includes(id) || w.captain === id) return false;
  return lineup(ctx, g, { vice: id }, COPY.viceNow(P.L.name(id)), { points: false });
}

/** A sub in week w (engine.swapLineup) with the armband as FPL moves it: a captain sent to the bench hands it to the
 *  vice, and a vice gone (or now captain) is the XI's best other. → {xi, bench, captain, vice, into, out, order (two
 *  subs swapped: nobody enters the XI)} | null when the swap breaks the formation. */
export function subLineup(w, a, b, L) {
  const s = w && E.swapLineup(w, a, b, L.pos);
  if (!s) return null;
  const top = (not) => [...s.xi].filter((p) => !not.includes(p)).sort((x, y) => (L.xp(y, w.gw) ?? 0) - (L.xp(x, w.gw) ?? 0))[0] ?? null;
  const captain = s.xi.includes(w.captain) ? w.captain : s.xi.includes(w.vice) ? w.vice : top([]);
  const vice = s.xi.includes(w.vice) && w.vice !== captain ? w.vice : top([captain]);
  const into = s.xi.includes(Number(a)) && !w.xi.includes(Number(a)) ? Number(a) : Number(b);
  const order = !s.xi.includes(Number(a)) && !s.xi.includes(Number(b));
  return { xi: s.xi, bench: s.bench, captain, vice, into, out: into === Number(a) ? Number(b) : Number(a), order };
}

/** A sub's words in week w (subLineup's s): its toast's, and a sub's list's rows (subChoices). */
function subWords(P, w, s) {
  // two subs swapped say the new order, never "Murillo in for Walle Egeli" (nobody came in)
  const nth = (p) => subOrder(s.bench, P.L.pos).get(p);  // the pitch's "substitute n"
  return s.order ? COPY.benchOrder([s.into, s.out].sort((x, y) => nth(x) - nth(y)).map((p) => [P.L.name(p), nth(p)]))
    : `${P.L.name(s.into)} in for ${P.L.name(s.out)}${s.captain !== w.captain ? ` · ${COPY.captainNow(P.L.name(s.captain))}` : ''}`;
}

/** Sub: swap two players of GW g's lineup (phone-only; subLineup moves the armband as FPL does). */
export function sub(ctx, g, a, b) {
  const P = plan(ctx);
  const s = subLineup(weekOf(P, g), a, b, P.L);
  if (!s) return false;
  const w = weekOf(P, g);
  const arm = { ...(s.captain !== w.captain ? { captain: s.captain } : {}), ...(s.vice !== w.vice ? { vice: s.vice } : {}) };
  // two subs swapped, no points: the bench scores nothing unless a starter misses (as the vice)
  return lineup(ctx, g, { xi: s.xi, bench: s.bench, ...arm }, subWords(P, w, s), { points: !s.order });
}

/** A sub's list (owner, 2026-10-21): the starters bench player `id` can replace in GW g (engine.swapCandidates), each
 *  with its sub (subLineup) and points change (calls.subGap); best first. → [{id, s, what, cmp}] */
export function subChoices(ctx, P, g, id) {
  const w = weekOf(P, g);
  if (!w?.bench.includes(Number(id))) return [];
  return E.swapCandidates(w, id, P.L.pos).filter((p) => w.xi.includes(p)).map((p) => {
    const s = subLineup(w, id, p, P.L);
    return { id: p, s, what: subWords(P, w, s), cmp: subGap(inputs(ctx), w, s) };
  }).sort((x, y) => y.cmp.delta - x.cmp.delta || (P.L.xp(x.id, g) ?? 0) - (P.L.xp(y.id, g) ?? 0));
}
