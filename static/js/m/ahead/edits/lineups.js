// ahead/edits.js: lineup and chip edits

import { chipName } from '../../../ui.js';
import { COPY } from '../../calls.js';
import { pinChip, isRoll } from '../../memory.js';
import { compare, flashLanding, info, isFrozen, isPick, lineups, memOf, memPlan, num, picksAt, plan, setLineups, weekOf } from '../core.js';
import { SQUAD_CHIPS, forkKey, planBack, plansListed } from '../plans.js';
import { goneIds, yoursTakenBack } from '../presolve.js';
import { isLive } from '../buys.js';
import { chipCheck, chipPreps, chipStates, chipTold, halfBests, halfEnd, honestBest, plannedAt, squadWeek } from '../pieces.js';
import { chipPins } from '../screen.js';
import { edit, restore, say, snapshot, toastOf, undoOf, vsPrev } from './say.js';
import { asksOf, clashing, withTaken } from './rules.js';

/**
 * A phone-only lineup change in GW g (a sub, the armband): GW A's is plan memory's lineup, a later GW's this device's.
 * The verdict is that GW alone ("Ajayi in for Gabriel, GW6: −1.2 · you lose 1.2 pts").
 */
export function lineup(ctx, g, patch, what, opts = {}) {
  const I = info(ctx);
  return lineupEdit(ctx, [g], () => {
    if (g === I.A) memOf(ctx).setLineup(patch);
    else setLineups(ctx, I, { ...lineups(ctx, I), [g]: { ...(lineups(ctx, I)[g] || {}), ...patch } });
  }, what, opts);
}

/** The one lineup edit (a sub, the armband, a reset): GWs `gws` changed by `change` (phone-only: no solve), each
 *  flashed, with Undo (restore). GW A under way is FPL's: never changed (COPY.live). */
function lineupEdit(ctx, gws, change, what, { points = true } = {}) {
  const I = info(ctx);
  // GW A under way is FPL's
  if (gws.includes(I.A) && isLive(ctx)) { toastOf(ctx)(COPY.live(I.A), 'warn'); return false; }
  const weeks = () => gws.map((g) => weekOf(plan(ctx), g)).filter(Boolean);
  const before = weeks();
  const snap = snapshot(ctx);
  const prevP = plan(ctx);
  change();
  flashLanding(ctx, prevP, { gws });
  const c = compare(ctx, { weeks: weeks() }, { weeks: before });
  const subject = gws.length === 1 && gws[0] !== I.A ? COPY.inGw(what, gws[0]) : what;
  // what it did to the week's suggestions, said (lineupWhy; owner, 2026-10-22: saved-lineup moves are explained, not
  // changed)
  const why = lineupWhy(ctx, prevP, plan(ctx), gws);
  say(ctx, [points ? COPY.lineup(subject, gws, c.delta, c.label) : subject, ...why].join(' · '), undoOf(ctx, subject, () => restore(ctx, snap)));
  return true;
}

/** The GW-g buys of choice pl (planBack's `adds`) your saved GW-g lineup leaves on your bench: the choice is measured
 *  with it (asTaken). None without a lineup of yours that week, for a Wildcard's or Free Hit's squad, or a choice not
 *  ready. → [id] */
export function benchedBuys(P, g, pl) {
  const w = weekOf(P, g);
  if (!w?.lineup || pl?.state !== 'ready' || SQUAD_CHIPS.has(pl.choice.chips?.[g])) return [];
  const bench = new Set((pl.ev?.gws.find((x) => x.gw === g)?.bench ?? []).map(Number));
  const benched = new Set(w.bench.map(Number));
  return planBack(P, g, pl).adds.filter((m) => benched.has(Number(m.out)) && bench.has(Number(m.in))).map((m) => Number(m.in));
}
/** What a lineup edit of GWs `gws` did to their suggestions (owner, 2026-10-22: saved-lineup moves are explained, not
 *  changed): each choice of plan view `P0` that gained and that `Q` lowers or no longer lists, in words (benchedBuys; a
 *  Wildcard or Free Hit played in your lineup's places). → [text] */
function lineupWhy(ctx, P0, Q, gws) {
  const out = [];
  for (const g of gws) {
    if (!weekOf(Q, g)?.lineup || !weekOf(P0, g)) continue;
    const now = plansListed(ctx, Q, g).filter((x) => x.state === 'ready');
    const names = [], chips = [];
    for (const a of plansListed(ctx, P0, g)) {
      if (a.state !== 'ready' || a.refRow || a.cmp.delta <= 0.05) continue;
      const k = forkKey(a.choice, g), b = now.find((x) => forkKey(x.choice, g) === k);
      if (b && b.cmp.delta > a.cmp.delta - 0.05) continue;
      const chip = a.choice.chips?.[g];
      if (SQUAD_CHIPS.has(chip)) { if (!chips.includes(chip)) chips.push(chip); continue; }
      const was = new Set(benchedBuys(P0, g, a));
      for (const id of b ? benchedBuys(Q, g, b) : []) if (!was.has(id) && !names.includes(Q.L.name(id))) names.push(Q.L.name(id));
    }
    if (names.length) out.push(COPY.onYourBench(names));
    out.push(...chips.map((c) => COPY.chipLineup(chipName(c), g)));
  }
  return out;
}

/** Your phone-only lineups of GWs `gws` back to the plan's own (GW A's in plan memory, later ones on this device). */
function resetLineups(ctx, gws) {
  const I = info(ctx);
  if (!gws.length) return;
  if (gws.includes(I.A) && memPlan(ctx)?.lineup) memOf(ctx).setLineup({ xi: null, bench: null, captain: null, vice: null });
  setLineups(ctx, I, Object.fromEntries(Object.entries(lineups(ctx, I)).filter(([g]) => !gws.includes(Number(g)))));
}

/** "Reset lineup" (the pitch's top-left pill: the viewed GW; or every GW in P.lineupGap.gws): those GWs' lineups back
 *  to the plan's best, an edit like any other (lineupEdit). Only GWs whose lineup is yours (ViewWeek.lineup). */
export function resetLineup(ctx, gws) {
  const P = plan(ctx);
  let own = [].concat(gws).map(Number).filter((g) => weekOf(P, g)?.lineup);
  if (own.length > 1) own = own.filter((g) => !isFrozen(P, g));
  if (!own.length) return false;
  return lineupEdit(ctx, own, () => resetLineups(ctx, own), own.length > 1 ? 'Best lineups back' : 'Best lineup back');
}

/** Pins planning `chip` for GW g, {pins: [memory.pinChip], drop: [id]}: the same chip in another GW of its half goes
 *  (one per half); one already in GW g is replaced; a wildcard or free hit makes every transfer free, so GW g's Roll or
 *  hits rule goes too (owner's call, "−4 not relevant when wc/fh is on"). Shared by chipPlan's edit and its preparation
 *  (chipPreps). The hits rules it takes off ride on its pin (`restores`); chipOff puts them back. P: plan(ctx). */
export function chipEdit(P, g, chip) {
  const half = halfEnd(P);
  const drop = P.pins.filter((p) => p.kind === 'chip' && Object.values(p.chips || {}).includes(chip) && (Number(p.gw) <= half) === (g <= half)).map((p) => p.id);
  const restores = [];
  if (chip === 'wc' || chip === 'fh') {
    const auto = P.pins.filter((p) => p.id === `roll:${g}` || p.id === `hits:${g}`);
    drop.push(...auto.map((p) => p.id));
    // your transfers of GW g go with it, as the chip row's + takes them back (owner, 2026-10-27)
    drop.push(...transferPinsAt(P, g));
    restores.push(...auto, ...(P.pins.find((p) => p.id === `chip:${g}`)?.restores ?? []));
  }
  // your picks of a Wildcard or Free Hit week whose chip goes or changes go with it, named (chipWords)
  const was = (x) => chipPins(P).find((c) => c.gw === x)?.chip ?? weekOf(P, x)?.chip ?? null;
  const moved = P.pins.filter((p) => drop.includes(p.id) && p.kind === 'chip').map((p) => Number(p.gw));
  drop.push(...picksAt(P, [...moved, ...(was(g) !== chip ? [g] : [])]).map((p) => p.id));
  return { pins: [pinChip(g, chip, { label: `${chipName(chip)} GW${g}`, ...(restores.length ? { restores } : {}) })], drop };
}
/** A Roll (a plan's +: "GW7 roll", "GW7 lock", COPY.rollRule) or a hits rule of GW g ("Up to −4 in GW7", "FT only in
 *  GW7") in words, for the chip toasts that take it off (chipPlan) and bring it back (chipOff). */
export const autoRuleName = (q, g) => (isRoll(q) ? COPY.rollRule(g, Number(q.caps?.[g] ?? 0)) : num(q.hits?.[g]) ? COPY.hitsUpTo(num(q.hits[g]), g) : COPY.freeOnly(g));

/** A chip planned for GW g in words, the one way chipPlan and addPlan say it: "Free Hit planned for GW8", the chip GW g
 *  played before it (`swap`: "vs Bench Boost"; `inPlace`: "in place of Bench Boost"), the Roll and hits rules it takes
 *  off (`drop`: "Up to −4 in GW8 removed"). → {what, swap, taken: [Pin]} */
export function chipWords(P, g, chip, drop, { inPlace = false } = {}) {
  const prev = chipPins(P).find((x) => x.gw === g)?.chip ?? weekOf(P, g)?.chip ?? null;
  const swap = prev && prev !== chip ? chipName(prev) : null;
  const gone = P.pins.filter((p) => p.kind === 'hits' && drop.includes(p.id));
  const rolls = P.pins.filter((p) => isRoll(p) && drop.includes(p.id));
  const picks = P.pins.filter((p) => isPick(p) && drop.includes(p.id));
  const mine = new Set(SQUAD_CHIPS.has(chip) ? transferPinsAt(P, g) : []);
  const moved = P.pins.filter((p) => mine.has(p.id) && drop.includes(p.id) && !picks.includes(p));
  const head = `${chipName(chip)} planned for GW${g}`;
  const what = [withTaken(P, inPlace && swap ? COPY.inPlaceOf(head, swap) : head, [...rolls, ...picks, ...moved]), ...gone.map((q) => COPY.chipRemoves(autoRuleName(q, g)))].join(' · ');
  return { what, swap, taken: [...rolls, ...picks, ...moved, ...gone] };
}
/** The rules of yours (ids) that make GW g's transfers, none in a Wildcard or Free Hit week (its picks are its own):
 *  what such a chip takes back (planTake's `gone`). */
const transferPinsAt = (P, g) => (squadWeek(weekOf(P, g)) ? [] : goneIds(P, yoursTakenBack(P, g, [])));

/** A chip made the plan (chipEdit). road: the solve of exactly these pins (a prepared chip, or the bake's pre-solve):
 *  the plan at once (memory.offer / findRoad); else the plan heals. Verdict: the chip's gap against not playing it (or
 *  the week it was planned in); `less`: what this week gives up against the chip's honest best week ("3.9 less than
 *  GW9", useChip). A Wildcard or Free Hit is measured vs rolling (owner, 2026-10-22): its Chips… row's number
 *  (chipStates: chipNumber). */
export function chipPlan(ctx, g, chip, road = null, { less = null } = {}) {
  const P = plan(ctx);
  const { pins, drop } = chipEdit(P, g, chip);
  const was = plannedAt(P, chip, g);
  // (the chip it replaces there named in its words, "Bench Boost planned for GW10 in place of Free Hit": no "· +x vs
  // Free Hit" in its toast; owner, 2026-10-27)
  const { what, swap, taken } = chipWords(P, g, chip, drop, { inPlace: true });
  const row = SQUAD_CHIPS.has(chip) && P.mem?.hold ? chipStates(ctx, P, g, chipPreps(ctx, P)).find((x) => x.chip === chip) : null;
  const gap = row?.cmp && row.best && row.best.gw !== g && row.best.delta != null && row.best.vs === row.vs ? COPY.chipLess(row.best.delta - row.cmp.delta, row.best.gw) : null;
  // the gain is the new plan against the one before, or against the chip it replaces (named as such); then no "less
  // than" the best week
  return edit(ctx, {
    pins, drop, road, from: g, what, taken,
    text: row ? () => COPY.chipToast(what, gap) : (Q, prev) => {
      const c = compare(ctx, { weeks: Q.weeks }, { weeks: prev.weeks });
      if (was == null && !swap && SQUAD_CHIPS.has(chip)) chipTold(Q, g, c);
      return COPY.chipToast(what, swap ? null : less);
    },
  });
}

/** The chip GW g plays taken off (a pin of yours goes; the model's own chip there is lifted by a 'none' pin). The Roll
 *  and hits rules your chip took off (`restores`) come back in the same edit ("No chip in GW7 · Up to −4 in GW7 back");
 *  one Undo. */
export function chipOff(ctx, g) {
  const P = plan(ctx);
  const { mine, picks, pins: back, drop } = chipOffParts(P, g);
  const off = withTaken(P, `No chip in GW${g}`, picks);
  if (!mine) return edit(ctx, { pins: [pinChip(g, null)], drop, from: g, what: off, taken: picks, text: vsPrev(ctx, off) });
  const what = [off, ...back.map((q) => COPY.chipBack(autoRuleName(q, g)))].join(' · ');
  return edit(ctx, { pins: back, drop, from: g, what, taken: picks, text: vsPrev(ctx, what) });
}
/** Chip c played in GW g, or taken off when GW g already plays it (owner, 2026-10-13: from the pitch, the Bench Boost
 *  by holding the bench and the Triple Captain by holding the C still; any chip from Chips…; a Wildcard or Free Hit
 *  also as a suggested plan's +). Its background solve (chipPreps) is that plan at once; one not in yet heals. The
 *  toast gives the gap against not playing it, and for a week other than its honest best "3.9 less than GW9"
 *  (chipPlan). → bool */
export function useChip(ctx, c, g) {
  const P = plan(ctx);
  if (weekOf(P, g)?.chip === c || chipPins(P).some((x) => x.chip === c && x.gw === g)) return chipOff(ctx, g);
  const check = chipCheck(ctx, P, c, g);
  if (!check.ok) { toastOf(ctx)(check.reason, 'warn'); return false; }
  const src = chipPreps(ctx, P);
  const pre = src.at(c, g);
  const best = honestBest(halfBests(P, src, g), c);
  const less = best && best.gw !== g && pre.state === 'ready' ? COPY.chipLess(best.delta - pre.cmp.delta, best.gw) : null;
  return chipPlan(ctx, g, c, pre.state === 'ready' ? pre.road : null, { less });
}
/** What taking GW g's chip off changes in your rules (chipOff; owner, 2026-10-13): your chip rule (`mine`) and that
 *  week's picks go, named, and the Roll and hits rules the chip took off come back. → {mine, picks, pins (back), drop
 *  (ids)} */
export function chipOffParts(P, g, { locked = false } = {}) {
  const mine = P.pins.find((p) => p.id === `chip:${g}`) ?? null;
  const picks = picksAt(P, [g]);
  const drop = [...(mine ? [`chip:${g}`] : []), ...picks.map((p) => p.id)];
  // `locked`: the caller makes GW g exactly a choice with its own Roll (a plan's + and its fork's solve), so a Roll the
  // chip had taken off never comes back over it; else it comes back unless an ask that stays clashes
  const stays = asksOf(P).filter((p) => !drop.includes(p.id));
  const back = (mine?.restores ?? []).filter((q) => !isRoll(q) || (!locked && !clashing(P, q, stays).length));
  return { mine, picks, pins: back, drop };
}
/** Your Wildcard or Free Hit in GW g that choice c ({moves, chips}) doesn't play there (owner, 2026-10-13: the week's
 *  other choices stay, each "instead of Wildcard") | null. */
export const chipBackOf = (P, g, c) => { const ch = weekOf(P, g)?.chip ?? null; return SQUAD_CHIPS.has(ch) && !SQUAD_CHIPS.has(c?.chips?.[g]) ? ch : null; };
