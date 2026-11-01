// ahead.js: small shared view pieces (sheets reuse them)

import * as E from '../../plan/engine.js';
import { fmt } from '../../ui.js';
import { shirt } from '../../plan/kits.js';
import { COPY } from '../calls.js';
import { attach, pinChip, solveKept } from '../memory.js';
import { asYours, baked, compare, info, inputs, isFrozen, leftBehind, lineups, memOf, plan, valuesFor, valuesKey, weekOf } from './core.js';
import { asksOf, chipEdit } from './edits.js';
import { SQUAD_CHIPS, approxAt, chipNumber, chipShown, plansListed, plansOf, solverCmp, weekRollOf } from './plans.js';
import { chipPins } from './screen.js';

// ---------------------------------------------------------------- small shared view pieces (sheets reuse them)

/** A kit shirt for a player id (kits.js; the GK kit by position). */
export const shirtOf = (L, id, size = 28) => shirt({ club: L.club(id), gk: L.pos(id) === 'GK', size });

/** A gain that beats the forecast's noise: green, a solid +, a filled button, a "Best". cmp {delta, label}: a compare
 *  result (its label: engine.verdictLabel against the noise), or a bare gap g as {delta: g, label: E.verdictLabel(g,
 *  noise)}. */
export const clearGain = (cmp) => { const c = solverCmp(cmp); return !!c && c.delta > 0 && c.label !== 'coin'; };
/** A suggested plan row's green, solid + and filled Why button (plansOf's rows): its number past the noise; the roll's
 *  own row (no number: `refRow`) when its plan beats the best other row's past the noise (`vsBest`); with your
 *  transfer, Wildcard or Free Hit in the week, past your own choice's too (`vsMine`), and a move you took off this
 *  session (`removed`). Never one the 2026-10-18 bars keep from being the week's suggestion (plansOf `early`). */
export const plPays = (pl) => !pl.early && clearGain(pl.refRow ? pl.vsBest : pl.cmp) && (!pl.vsMine || clearGain(pl.vsMine));
/** What a checked choice's row, its spoken line and its card's note in his place say of the 2026-10-18 bar it doesn't
 *  pass where its number may not show it (plansOf `early`, a GW: "as good in GW9"; one that adds next to nothing when
 *  taken says so by its number, or by its Why sheet's "Your total" where that differs), else null. Pure. */
/** The head of GW g's row when it has no transfer says who left it empty, the week's status beside the goal
 *  (statusTok): no edit reaches it (`ink`: inkAt) "No transfers"; your Roll (`lock`: rollingAt) "Rolling ✓"; under the
 *  hold (`hold`) the week you roll, "Rolling" ("Rolling is best" is the corner's token: tokensOf), never "No transfers
 *  yet" (owner, 2026-10-26) nor "No transfer pays this week" (owner, 2026-10-18); off the hold (`off`: rollFacts;
 *  gwMode 'roll' too) a week Forkcast adds no transfer to "No transfers", one its plan leaves empty "Forkcast rolls
 *  GW8". Pure. */
export const emptyHead = (g, { ink = false, hold = false, off = false, lock = false } = {}) => (ink ? COPY.noTransfers
  : lock ? COPY.rollingOn : hold ? COPY.rollingNow : off ? COPY.noTransfers : COPY.forkcastRolls(g));
/** The facts under a week with no transfer (the week line's second line, rollFacts), each with its spoken words: GW
 *  `gw`'s free transfers (`ft`), then its bank after the week's moves (owner, 2026-10-21; `bank`: w.bank, as Replace's
 *  header counts it) in FPL's word, "£0.8m ITB", then what rolling makes next week (`next`; none in the window's last
 *  GW): "2 FT · £0.8m ITB · 3 FT in GW10", read "2 free transfers, £0.8 million in the bank, 3 free transfers in
 *  gameweek 10". No bank below 0: a short one is bankWarn's words (after these, never both). Pure. → [[text, said]] */
export function factsWords({ gw, ft, next = null, bank = null }) {
  return [[COPY.ftNow(ft), COPY.ftNowSaid(ft)], itbWords(bank),
    next != null ? [COPY.rollKeeps(next, gw + 1), COPY.rollKeepsSaid(next, gw + 1)] : null].filter(Boolean);
}
/** A week's bank in FPL's word with its spoken words (factsWords; the week line's lead where its facts aren't drawn:
 *  bankLead), "£0.8m ITB": the solver's plan's, never an edit's ≈ estimate (owner, 2026-10-26); null for none or a
 *  short one (bankWarn's words). Pure. → [text, said] | null */
export function itbWords(bank) {
  const money = bank != null && bank >= -1e-9 ? fmt.money(Math.max(0, bank)) : null;
  return money ? [COPY.itb(money), COPY.itbSaid(money)] : null;
}
/** A roll's Why sheet line (openPlanWhy: a choice with no move or chip in GW g; owner, 2026-10-22): what it leads to
 *  next GW, "4 FT in GW9" (engine.nextFt with next week's grant), at the cap that rolling adds none; none in the
 *  window's last GW. Pure. → [text] */
export function rollFt(P, g, pl) {
  const w = weekOf(P, g), nx = P.gws.find((x) => x > g);
  if (pl.choice.moves.some((m) => m.gw === g) || pl.choice.chips?.[g] || !w || nx == null) return [];
  const ft = w.ft ?? 1, next = E.nextFt(ft, 0, E.ftGrant(P.season, nx));
  return [next > ft ? COPY.rollKeeps(next, nx) : COPY.rollCapped(ft, nx)];
}
/** GW w's facts on plan view P (factsWords): its free transfers, its bank, and the free transfers rolling makes next
 *  week (engine.nextFt, with next week's grant). Pure. → [[text, said]] */
export function weekFacts(P, w) {
  const g = w.gw, ft = w.ft ?? 1;
  const next = g < P.end ? E.nextFt(ft, w.used ?? 0, E.ftGrant(P.season, g + 1)) : null;
  return factsWords({ gw: g, ft, next, bank: w.bank });
}


/**
 * The bundle's chip pre-solves (api/mobile.py chip_plan: one pooled solve per chip still available × GW, made in the
 * background once the roads are in), each against the model's road: {at(chip, gw) → {state: 'ready' (road, cmp) |
 * 'solving' | 'none'}, best: {chip: {gw, delta, label, final}} (chipBests), asked(chip, gw) → when its solve started
 * (ms) | null}. Both roads are the model's (no rules of yours), so the gap is the chip's own, with your lineups on it
 * (asYours). Memoised per bundle and your lineups.
 */
/** The GWs Chips… was opened on for the team on screen (app.js askChips): only their chips are solved, the server's
 *  pre-solves and your rules' preparations (chipPreps) alike (owner, 2026-10-28). → [gw] */
export const chipsAsked = (ctx) => {
  const v = ctx.store?.get('chipsAt');
  return v && String(v.entry) === String(ctx.bundle?.entry?.id ?? ctx.store.get('entry')) ? v.gws : [];
};

const CHIPS_AT = new WeakMap();
export function chipPresolves(ctx) {
  const b = ctx.bundle;
  if (!b?.roads?.base) return { at: () => ({ state: 'none' }), best: {} };
  // (plan memory read from the store: a background caller never attaches it)
  const gp = ctx.store.get('memory') ?? null;
  const lu = JSON.stringify([gp?.lineup ?? null, lineups(ctx, info(ctx)), chipsAsked(ctx)]);
  let r = CHIPS_AT.get(b);
  if (r?.lu === lu) return r;
  const prog = b.bake?.chips ?? null;
  const itemOf = (k) => prog?.items?.find((x) => x.key === `chip:${k}`);
  const memo = new Map();
  const at = (c, g) => {
    const k = `${c}@${g}`;
    if (memo.has(k)) return memo.get(k);
    const road = b.roads.chip?.[k] ?? null;
    const it = itemOf(k);
    // (a GW whose chips nobody asked for (chipsAsked): none, never "checking…", and `unasked`: no best week stands
    // while it is, chipBests)
    const asked = chipsAsked(ctx).includes(g);
    const v = road ? { state: 'ready', road, cmp: compare(ctx, asYours(ctx, road, gp), asYours(ctx, b.roads.base, gp)) }
      : (it ? ['waiting', 'queued', 'running'].includes(it.state) : !!prog?.pending && asked) ? { state: 'solving' }
        : { state: 'none', error: it?.error ?? null, ...(it || asked ? {} : { unasked: true }) };
    memo.set(k, v);
    return v;
  };
  const asked = (c, g) => { const s = Number(itemOf(`${c}@${g}`)?.started); return s > 0 ? s * 1000 : null; };
  CHIPS_AT.set(b, (r = { lu, at, asked, best: chipBests(at, ctx.data?.horizon || [], inputs(ctx).noise) }));
  return r;
}

/** A chip week's check is in: solved or failed, not still solving, and asked (a week nobody opened Chips… on reads
 *  `unasked`: chipsAsked; owner, 2026-10-28: no best week while the others are unsolved). */
const chipSettled = (x) => x.state !== 'solving' && !x.unasked;

/**
 * Each chip's best GW of `gws` by at(chip, gw) when it gains: {chip: {chip, gw, delta, label, final, clear, runner,
 * next}}.
 * final: none of that chip's GWs is still solving (until then the best may move). clear: the best beats the runner-up
 * week (`next`, its gain `runner`; 0 and null when no other is solved) under the alternatives' verdict
 * (engine.verdictLabel(best − runner-up, noise) is not 'coin'): a "best week" inside the noise is no best week. The
 * gaps are the shown ones. Exported for the node tests.
 */
export function chipBests(at, gws, noise = 0) {
  const best = {};
  const gap = (x) => x.cmp.delta;
  for (const c of E.CHIPS) {
    const ready = gws.map((g) => ({ g, x: at(c, g) })).filter(({ x }) => x.state === 'ready');
    const top = ready.filter(({ x }) => x.cmp.delta > 0.05).sort((a, b) => b.x.cmp.delta - a.x.cmp.delta)[0];
    if (!top) continue;
    const next = ready.filter(({ g }) => g !== top.g).sort((a, b) => gap(b.x) - gap(a.x))[0] ?? null;
    const runner = next ? gap(next.x) : 0;
    const clear = E.verdictLabel(gap(top.x) - runner, noise) !== 'coin';
    best[c] = { chip: c, gw: top.g, delta: top.x.cmp.delta, label: top.x.cmp.label, runner, next: next?.g ?? null, clear,
      final: gws.every((g) => chipSettled(at(c, g))) };
  }
  return best;
}
/** A chip's honest best GW: final and clear, else null. The one rule for its choice's week (plansOf) and the chip
 *  toast's "less than GW9" (owner, 2026-10-10: no mark on a week that only ties the next). */
export const honestBest = (src, c) => (src.best[c]?.final && src.best[c].clear ? src.best[c] : null);
/** A new forecast's pre-solves come in after its roads (api/mobile.py: the chips start once every road is queued), and
 *  while any week of a chip's still solves it has no honest best week. So the last one seen for the team and GW A
 *  (entry:GW A → {chip: best}) stands until the newer pre-solves of that chip are all in; then their own verdict. The
 *  suggested plans' chip week (plansOf) → the honest best | null */
const CHIP_KEPT = new Map();
export const keptBest = (P, src, c, g) => {
  // over GW g's half of the window, as every chip's best week is (halfBests)
  const { here, best } = halfBests(P, src, g);
  const k = `${P.entry}:${P.A}:${here[0]}`;
  if (!CHIP_KEPT.has(k)) CHIP_KEPT.set(k, {});
  const kept = CHIP_KEPT.get(k);
  if (here.some((x) => src.at(c, x).state === 'solving')) return here.includes(kept[c]?.gw) ? kept[c] : null;
  return (kept[c] = honestBest({ best }, c));
};
/** The week the pitch offers Wildcard or Free Hit `c` in (plansOf's squadOk: its kept honest best of the pre-solves
 *  `src`, where it beats not playing it past the noise) → that best | null. One rule for the pitch's chip week and the
 *  Chips sheet's best week (chipStates). */
export const chipWeekOf = (P, src, c, g) => { const b = keptBest(P, src, c, g); return b && clearGain(b) ? b : null; };
/** GW g's half of the window (`here`) and each chip's best week inside it (chipBests over src.at): the Chips sheet's
 *  and the chip toast's rival weeks, a chip being one per half. */
export const halfBests = (P, src, g) => {
  const half = halfEnd(P);
  const here = P.gws.filter((x) => (x <= half) === (g <= half));
  return { here, best: src ? chipBests(src.at, here, P.noise) : null };
};

/** The chips, in their order. */
const CHIP_ROW = ['bb', 'tc', 'fh', 'wc'];
/** The first half's last GW (the bundle's meta.chip_half, else engine.HALF): chips refill after it. */
export const halfEnd = (P) => Number(P.b.meta?.chip_half ?? E.HALF);
/** The GW a chip played in GW g comes back (the second half's first, halfEnd), null in the second half: Chips…'s "back
 *  GW20" and a Wildcard's or Free Hit's Why sheet's "next one GW20" (COPY.chipUses). */
export const chipBack = (P, g) => (g <= halfEnd(P) ? halfEnd(P) + 1 : null);
/** The chips GW g may play: each one still available in g's half (a used one is left out), in CHIP_ROW's order. The
 *  entry's chips_available is GW A's half's stock (the solver's ChipAuto.stock), so it counts only there
 *  (engine.canUseChip); in the other half only the chips played there do. */
export const chipsAvail = (P, g) => {
  const e = P.b.entry;
  const half = halfEnd(P);
  const here = (x) => (x <= half) === (g <= half);
  return CHIP_ROW.filter((c) => !(e.chips_used || []).some((u) => u.chip === c && here(u.gw)) && (!here(P.A) || (e.chips_available || []).includes(c)));
};
/** A Free Hit or Wildcard week ('fh' | 'wc'), whose moves are the squad the chip makes, or null. */
export const squadWeek = (w) => (w?.chip === 'fh' || w?.chip === 'wc' ? w.chip : null);
/**
 * A Free Hit or Wildcard week's gain against the same plan without that chip, the chip toast's measure off the hold
 * (chipPlan): your plan against the bundle road that is your plan with that GW's chip pin taken off (baked; the
 * model's own chip there: a 'none' chip pin), your lineups on it (asYours) → {delta, label} | null while no such road
 * is in; then the gain the chip's own toast said (chipTold), as long as your rules stand. Once per plan view. Under
 * your team as it is, against rolling instead (chipWeekGain; owner, 2026-10-22); a Bench Boost's or Triple Captain's
 * always against not playing it (they change no transfer).
 */
const CHIP_GAINS = new WeakMap();
// entry:GW A → {sig, by: Map(g → the chip toast's cmp)}: kept while your rules and the hold stand (keyed on them, not
// the plan memory, which every emit makes afresh)
const CHIP_TOLD = new Map();
const toldSig = (P) => JSON.stringify([!!P.mem?.hold, asksOf(P)]);
export const chipTold = (Q, g, cmp) => {
  if (!Q?.mem || typeof Q.mem !== 'object') return;
  const k = `${Q.entry}:${Q.A}`, sig = toldSig(Q);
  if (CHIP_TOLD.get(k)?.sig !== sig) CHIP_TOLD.set(k, { sig, by: new Map() });
  CHIP_TOLD.get(k).by.set(g, cmp);
};
const toldOf = (P, g) => { const t = CHIP_TOLD.get(`${P.entry}:${P.A}`); return t?.sig === toldSig(P) ? t.by.get(g) : null; };
export function chipGain(ctx, P, g) {
  let by = CHIP_GAINS.get(P);
  if (!by) CHIP_GAINS.set(P, (by = new Map()));
  if (!by.has(g)) {
    const id = `chip:${g}`;
    const ref = P.pins.some((p) => p.id === id) ? baked(ctx, [], [id], P) : baked(ctx, [pinChip(g, null)], [], P);
    by.set(g, ref?.weeks ? compare(ctx, { weeks: P.weeks }, asYours(ctx, ref)) : null);
  }
  return by.get(g) ?? (P.mem && typeof P.mem === 'object' ? toldOf(P, g) : null) ?? null;
}
/** Your Wildcard or Free Hit week's number (the week line's, Chips…'s row; owner, 2026-10-22): under your team as it is
 *  your chip's plan against the week's roll plan, Forkcast's later moves on both sides (weekRollOf, weekGain; vsRollOf
 *  in plansOf's chipOf), `wait` while either still solves (plansOf `pending`); off the hold against not playing it
 *  (chipGain). `listed`: the week's list (plansOf; Chips…: plansListed, no solve asked) → {cmp | null, wait, vs: its
 *  baseline's words | null} */
export function chipWeekGain(ctx, P, g, listed = (x) => plansOf(ctx, P, x)) {
  if (!P.mem?.hold) return { cmp: chipGain(ctx, P, g), wait: false, vs: null };
  const r = weekRollOf(ctx, P, weekOf(P, g), listed);
  return { cmp: r, wait: !r && !approxAt(P, g) && !!listed(g)?.pending, vs: r ? COPY.planVsRoll : null };
}
/** A player's forecast for GW g as the pitch draws it (pitch.xpAt on the bundle's row, fmt.pts), '–' when none: the
 *  why line, the week line and the player sheet's rows read this one number. */
export const xpShown = (ctx, id, g) => {
  const d = ctx.data;
  const x = ctx.pitch?.xpAt?.(d?.byId?.get(Number(id)), g, d?.xpGws);
  return x == null ? '–' : fmt.pts(x);
};
/** The GW your plan plays chip c in (its road's, else a chip pin of yours), or null; with `g`, the one in g's half
 *  other than g (a chip is one per half). */
export const plannedAt = (P, c, g = null) => {
  const half = halfEnd(P);
  const ok = (x) => g == null || (x !== g && (x <= half) === (g <= half));
  const k = [...P.weeks.filter((x) => x.chip === c), ...chipPins(P).filter((x) => x.chip === c)].map((x) => Number(x.gw)).find(ok);
  return k ?? null;
};
/** Whether a tap may plan chip c for GW g beside your other chips (engine.canUseChip: one left in g's half, not planned
 *  in another GW of it; the same chip elsewhere moves, chipEdit) → {ok, reason}. */
export const chipCheck = (ctx, P, c, g) => E.canUseChip({
  base: ctx.data.base, gw: g, chip: c,
  draft: { chips: Object.fromEntries(chipPins(P).filter((x) => x.gw !== g && x.chip !== c).map((x) => [x.gw, x.chip])) },
});
/**
 * The Chips sheet's rows for GW g (sheets/chips.js; owner, 2026-10-13), one per chip in CHIP_ROW's order, so no row
 * moves as solves land: {chip, state, …}
 * · 'on': GW g plays it; `mine` a pin of yours (else Forkcast's), `cmp` its gain against not playing it (chipGain;
 * chipWeekGain against rolling, `vs`, for a Wildcard or Free Hit under your team as it is), `solving` while an
 * estimate;
 * · 'off': none left in g's half: `at` the GW it was played, `back` the second half's first GW;
 * · 'moved': planned in GW `at` of g's half (a tap moves it: chipEdit);
 * · 'swap' (GW g plays another chip, `instead`) or 'free': `cmp` the prepared solve's gap once in (src.at), `solving`
 * while it runs; `best` its honest best week (honestBest), `top` the best so far, `final` every week's solve in and
 * one measured at least, each over g's half (chipBests); `wait` its checks while any runs (chipWait), `after` the
 * half's last week the plan covers when the half goes on past it. A Wildcard or Free Hit (owner, 2026-10-22): best,
 * top, final, wait from the pitch's pre-solves (chipWeekOf), its number the pitch's (chipShown), in GW g the token's
 * (`cmp`, `pays`, `vs`); under your team as it is every number is chipNumber's, against the week's roll plan,
 * `solving` while checked.
 * `src`: chipSource(ctx, P) (reading it asks for the preparations), or null for the first draw (no numbers). Pure but
 * for chipGain's memo. */
export function chipStates(ctx, P, g, src = null) {
  const w = weekOf(P, g), half = halfEnd(P), avail = chipsAvail(P, g);
  const used = P.b.entry?.chips_used || [];
  const { here, best: bests } = halfBests(P, src, g);
  const last = here[here.length - 1];
  const after = last < (g <= half ? half : E.LAST_ROUND) ? last : null;
  return CHIP_ROW.map((c) => {
    if (w?.chip === c) {
      const mine = chipPins(P).some((x) => x.chip === c && x.gw === g);
      if ((P.mark ?? P.approx).has(g)) return { chip: c, state: 'on', mine, solving: true };
      if (!SQUAD_CHIPS.has(c)) return { chip: c, state: 'on', mine, cmp: chipGain(ctx, P, g) };
      const v = chipWeekGain(ctx, P, g, (x) => plansListed(ctx, P, x));
      return { chip: c, state: 'on', mine, cmp: v.cmp, solving: v.wait, ...(v.vs ? { vs: v.vs } : {}) };
    }
    if (!avail.includes(c)) {
      const u = used.find((x) => x.chip === c && (x.gw <= half) === (g <= half));
      return { chip: c, state: 'off', at: u?.gw ?? null, back: chipBack(P, g) };
    }
    const at = plannedAt(P, c, g);
    if (at != null) return { chip: c, state: 'moved', at };
    // a Wildcard's or Free Hit's best week is the pitch's (chipWeekOf over the pre-solves, in g's half), its number and
    // the row's own where the pitch shows it the pitch's (chipShown; owner, 2026-10-22); elsewhere from the same
    // pre-solves. Under your team as it is: chipNumber, elsewhere your rules' plan of it (src) counted as a row; never
    // the pre-solve's gap against not playing it
    const squad = !!src && SQUAD_CHIPS.has(c);
    const rolled = squad && !!P.mem?.hold;
    const s = squad ? chipPresolves(ctx) : src;
    const pre = s ? s.at(c, g) : null;
    const sb = squad ? halfBests(P, s, g).best : bests;
    const wk = squad ? chipWeekOf(P, s, c, g) : null;
    const pick = squad ? (here.includes(wk?.gw) ? wk : null) : sb ? honestBest({ best: sb }, c) : null;
    const numAt = (x) => (rolled ? chipNumber(ctx, P, x, c, src.at(c, x)) : chipShown(ctx, P, x, c));
    const far = squad && pick && pick.gw !== g ? numAt(pick.gw) : null;
    const near = squad && (rolled || !w?.chip) ? numAt(g) : null;
    const own = near?.cmp ? near : null;
    return {
      chip: c, state: w?.chip ? 'swap' : 'free', instead: w?.chip ?? null,
      cmp: own?.cmp ?? (near?.wait || rolled ? null : pre?.state === 'ready' ? pre.cmp : null), solving: !!near?.wait || (!own && !rolled && pre?.state === 'solving'),
      ...(rolled ? { vs: COPY.planVsRoll } : {}), ...(own ? { pays: own.pays, vs: own.vs } : {}),
      best: pick && squad ? { ...pick, delta: far?.cmp?.delta ?? (pick.gw === g ? own?.cmp.delta ?? null : null), vs: far?.vs ?? own?.vs ?? null } : pick, top: sb?.[c] ?? null,
      final: !!s && here.every((x) => chipSettled(s.at(c, x))) && here.some((x) => s.at(c, x).state === 'ready'),
      wait: s ? chipWait(s, c, here) : null, after,
    };
  });
}
/** Chip c's checks over the weeks `here` while any still runs, as Add a player's line counts its own: the week out (one
 *  already asked, else the first still waiting), its place among the weeks checked (measured, running or failed with a
 *  reason), and when the first went out (src.asked, ms; null before any has) → {g, i, n, t0} | null. */
function chipWait(src, c, here) {
  const need = here.filter((x) => { const s = src.at(c, x); return s.state !== 'none' || !!s.error; });
  const left = need.filter((x) => src.at(c, x).state === 'solving');
  if (!left.length) return null;
  const asked = need.map((x) => src.asked?.(c, x)).filter((t) => t != null);
  // (`part`: a week of the span nobody asked for, so no best week can come of these checks: chipSettled)
  return { g: left.find((x) => src.asked?.(c, x) != null) ?? left[0], i: need.length - left.length + 1, n: need.length, t0: asked.length ? Math.min(...asked) : null,
    ...(here.some((x) => src.at(c, x).unasked) ? { part: true } : {}) };
}

/** Preparations, per values key (valuesKey): the Road, or 'error' (not asked again). PREP: the plan memory they serve
 *  (`mem`), the one in flight ({key}), the look-again timer, and when a refused ask may go again (`until`, ms).
 *  PREP_ASKED: when each was first asked (ms; chipWait's clock). */
export const PREPS = new Map();
const PREP_ASKED = new Map();
export const PREP = { mem: null, flight: null, timer: null, until: 0, gen: 0 };  // gen: bumped by each landing (chipPreps' views)
const PREPS_MAX = 96;
// your plan healing, this browser's speculative slot busy, a preparation superseded (Add a player's pill dropped too:
// sheets/wish.js askAgainWhileDropped)
export const PREP_AGAIN_MS = 1500;
const PREP_HOLD_MS = 30000;   // the plan service refused one (busy) or was away
/** A preparation landed (pumpPreps; a Wildcard or Free Hit row of it, plansOf's `land`): kept, the newest PREPS_MAX,
 *  and chipPreps' views made again (a landing counts only under the rules it was made for). */
export function prepKeep(key, got) {
  PREPS.set(key, got);
  while (PREPS.size > PREPS_MAX) PREPS.delete(PREPS.keys().next().value);
  PREP.gen++;
}

/** What the chip preparations of a plan view are made of besides the data (PREP_MEMO's key): the roads, whether you may
 *  edit, GW A, your pins (what they ask: never when or in which words) and the chip each GW of your plan plays. */
const PREP_SIGS = new WeakMap();
function prepSig(P) {
  if (!PREP_SIGS.has(P)) {
    const pins = P.pins.map(({ at, label, ...p }) => p);
    PREP_SIGS.set(P, JSON.stringify([P.b.version, P.b.meta?.roads_version ?? null, P.editable, P.A, pins, P.weeks.map((w) => w.chip ?? null)]));
  }
  return PREP_SIGS.get(P);
}
/** Per derived data and prepSig (the newest few): {slots, items} once made, so a re-draw under the same rules never
 *  makes them again (16 valuesFor each time the chip row drew). */
const PREP_MEMO = new WeakMap();
const PREP_MEMO_MAX = 8;
function prepMemo(ctx, P) {
  const sig = prepSig(P);
  let by = PREP_MEMO.get(ctx.data);
  if (!by) PREP_MEMO.set(ctx.data, (by = new Map()));
  let m = by.get(sig);
  if (!m) {
    by.set(sig, (m = { slots: null, items: null, made: null }));
    while (by.size > PREP_MEMO_MAX) by.delete(by.keys().next().value);
  }
  return m;
}

/** The chip × GW slots a tap may plan with your pins (prepItems without their values): every chip of the row your plan
 *  doesn't play (plannedAt) that chipCheck allows, in every GW → [{chip, gw, taken (your plan plays another chip that
 *  GW)}]; none without pins of yours, off line, or while the bundle's roads are of another version (re-baking). */
function prepSlots(ctx, P) {
  const m = prepMemo(ctx, P);
  if (m.slots) return m.slots;
  if (!P.pins.length || !P.editable || !ctx.api?.solve || P.b.version !== P.b.meta?.roads_version) return (m.slots = []);
  const taken = new Set(P.weeks.filter((w) => w.chip).map((w) => w.gw));
  // a frozen week's chip is held: nothing to prepare there (isFrozen)
  return (m.slots = P.gws.filter((g) => !isFrozen(P, g)).flatMap((g) => CHIP_ROW.filter((c) => plannedAt(P, c) == null && chipCheck(ctx, P, c, g).ok).map((c) => ({ chip: c, gw: g, taken: taken.has(g) }))));
}

/** The chips a tap may plan, prepared with your pins (chipPreps): prepSlots with the values of exactly the tap's edit
 *  (chipEdit → valuesFor) and their key → [{chip, gw, taken, values, key}], memoised per rules (prepMemo). */
export function prepItems(ctx, P) {
  const m = prepMemo(ctx, P);
  if (m.items) return m.items;
  try {
    m.items = prepSlots(ctx, P).map((x) => {
      const e = chipEdit(P, x.gw, x.chip);
      const values = valuesFor(ctx, e.pins, e.drop);
      return { ...x, edit: e, values, key: valuesKey(P, values) };
    });
  } catch (e) { console.error('Forkcast: chip preparations', e); m.items = []; }
  return m.items;
}

/**
 * Your chips prepared WITH your rules. With pins (P.pins: a rule of yours, or memory's derived hold or hits pin) the
 * bake's pre-solves are the model's plan with a chip, not yours: the phone solves, in the background, each chip × GW a
 * tap may plan (prepItems: exactly the tap's pins, so the tap finds the road at once, memory.offer, or its heal joins
 * the solve in flight), the viewed GW's chips first, then from GW A on. One at a time (purpose 'chipprep':
 * speculative, not counted in the plan service's hourly quota), once your plan has landed and while no Wish or options
 * solve of this browser holds the speculative slot (a superseded or refused one is asked again later, never an error
 * toast). Kept per values (PREPS), so new rules start over. Each is measured against your plan (asYours vs P.weeks),
 * and reading it asks for the next. → {at(chip, gw) → {state: 'ready' (road, cmp) | 'solving' | 'none'}, best, items,
 * asked(chip, gw) → when first asked (ms) | null}
 */
const PREP_VIEW = new WeakMap();
export function chipPreps(ctx, P = plan(ctx)) {
  if (!P) return { at: () => ({ state: 'none' }), best: {}, items: [] };
  let r = PREP_VIEW.get(P);
  const ak = chipsAsked(ctx).join();
  if (r?.gen !== PREP.gen || r.ak !== ak) {
    const items = prepItems(ctx, P);
    const by = new Map(items.map((x) => [`${x.chip}@${x.gw}`, x]));
    // (never memoised: the one in flight was asked after this view was made)
    const asked = (c, g) => PREP_ASKED.get(by.get(`${c}@${g}`)?.key) ?? null;
    const memo = new Map();
    const at = (c, g) => {
      const k = `${c}@${g}`;
      if (!memo.has(k)) {
        // (one of a GW whose chips nobody asked for: none, `unasked`, as the bake's: chipPresolves)
        const asked = chipsAsked(ctx).includes(g), it = asked ? by.get(k) : null;
        const got = it ? PREPS.get(it.key) : null;
        memo.set(k, !it ? { state: 'none', ...(!asked && by.has(k) ? { unasked: true } : {}) } : got?.weeks ? { state: 'ready', road: got, cmp: compare(ctx, asYours(ctx, got), { weeks: P.weeks }) }
          : got ? { state: 'none', error: got } : { state: 'solving' });
      }
      return memo.get(k);
    };
    PREP_VIEW.set(P, (r = { at, asked, best: chipBests(at, P.gws, P.noise), items, gen: PREP.gen, ak }));
  }
  pumpPreps(ctx, P, r.items);
  return r;
}

/** Each chip × GW's plan (F12, F14): with pins of yours your plan's own preparations (chipPreps), else the bake's
 *  pre-solves, which then are your plan with that chip (chipPresolves). */
export const chipSource = (ctx, P = plan(ctx)) => (P?.pins.length ? chipPreps(ctx, P) : chipPresolves(ctx));

/** Ask for the next preparation not yet answered (chipPreps), unless one is in flight; else look again later. */
function pumpPreps(ctx, P, items) {
  // another page memory's flight or wait (the team was signed out of) never holds this one's back
  if (PREP.mem !== memOf(ctx)) Object.assign(PREP, { mem: memOf(ctx), flight: null, until: 0 });
  if (PREP.flight || leftBehind(ctx, P)) return;
  const viewed = Number(ctx.store.get('gw'));
  const order = (x) => (x.taken ? 2 : 0) + (x.gw === viewed ? 0 : 1);
  const asked = chipsAsked(ctx);
  const next = items.filter((x) => asked.includes(x.gw) && !PREPS.has(x.key)).sort((a, b) => order(a) - order(b) || a.gw - b.gw)[0];
  if (!next) return;
  // your plan's heal first; a Wish this browser is solving keeps the speculative slot (api.solve would
  // supersede it); a refused ask waits
  const wait = P.healing || ctx.api.slotBusy?.('spec') ? PREP_AGAIN_MS : Math.max(0, PREP.until - Date.now());
  if (wait > 0) { prepAgain(ctx, wait); return; }
  const flight = (PREP.flight = { key: next.key });
  const ours = () => PREP.flight === flight;
  if (!PREP_ASKED.has(next.key)) PREP_ASKED.set(next.key, Date.now());
  while (PREP_ASKED.size > PREPS_MAX) PREP_ASKED.delete(PREP_ASKED.keys().next().value);
  solveKept(ctx.api, { entry: Number(P.entry), purpose: 'chipprep', values: next.values })
    .then((res) => {
      if (res.road || res.state === 'error') prepKeep(next.key, res.road ?? 'error');
      else if (ours()) PREP.until = Date.now() + PREP_AGAIN_MS;  // superseded (a Wish took the slot) or cancelled (a full queue)
    }, () => { if (ours()) PREP.until = Date.now() + PREP_HOLD_MS; })  // busy (429) or away: later
    .finally(() => {
      if (PREP.flight === flight) PREP.flight = null;
      prepAgain(ctx, 0);  // and asks for the next
    });
}

/** A chip preparation of plan view P still to ask (chipPreps): the next week's preparation leaves it the speculative
 *  slot (forkPump, prepNext). */
export const prepsWaiting = (ctx, P) => prepItems(ctx, P).some((x) => !PREPS.has(x.key));

/** chipPreps again in `ms`, for this page's memory only (a sign-out, or a test's release, ends the loop). */
function prepAgain(ctx, ms) {
  clearTimeout(PREP.timer);
  PREP.timer = setTimeout(() => { PREP.timer = null; if (attach()?.ctx === ctx) chipPreps(ctx); }, ms);
}
