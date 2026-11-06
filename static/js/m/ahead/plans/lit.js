// ahead/plans.js: the lit plates and places, the decks, fits

import * as E from '../../../plan/engine.js';
import { chipName, shownGain } from '../../../ui.js';
import { COPY } from '../../calls.js';
import { capFirst, estimate, flatMoves, problemOf, problemShort, problemsOf, weekOf } from '../core.js';
import { chipBackOf } from '../edits.js';
import { owedAt, paysBack, pinOfMove, planTakeDraft, rollingAt, showingAt, yoursTakenBack } from '../presolve.js';
import { plPays, squadWeek } from '../pieces.js';
import { SQUAD_CHIPS } from './suggest.js';
import { litEdges } from './choices.js';

/** The marks on the pitch (design_marks/DECISION.md), none until the week's choices settle (M.settled: weekSettled):
 *  the week's one best (weekBest: an ink plate, its places `best`; no take on the pitch, his place's headers take:
 *  owner, 2026-10-25) and each other place's best single move that beats rolling (`best` false: a quiet green plate;
 *  owner, 2026-10-22). Each beats rolling while the week has no transfer, chip or Roll of yours, else clears the noise
 *  against your plan (litCan). Never a move you took off this session (plansOf `removed`), nor one the 2026-10-18 bars
 *  keep from being the week's suggestion (`early`): his place keeps it, a plate of his place's first choice where
 *  nothing else is (placeFirst, renderDecks). `D`: the places; `toks`: the week's own choices beside the goal, a chip
 *  there the best where its number is higher (`chip`: its token drawn as any, never ink, no Play: owner, 2026-10-26; no
 *  "Rolling is best" then), the best move still its places' `best`, ink (owner, 2026-10-25). → Map(a → {e, best}) with
 *  .best (the best choice), .chip (the token's, or null), .move (the best move: its places' `best`) */
export function litOf(P, w, M, D, toks = []) {
  const at = Object.assign(new Map(), { best: null, chip: null, move: null });
  const can = litCan(P, w);
  const best = weekBest(P, w, M, D, toks);
  at.best = best;
  at.chip = best && toks.includes(best) ? best : null;
  // (the best move, a chip's token aside: weekBest of the moves alone)
  const move = at.move = at.chip ? weekBest(P, w, M, D) : best;
  if (move) for (const d of placesOf(D, move)) at.set(d.a, { e: d.entries.find((x) => x.pl === move), best: true });
  if (!M.settled) return at;
  for (const d of D) {
    // (your own buys get none of litOf's quiet plates: theirs is their take-back's, placeFirst; ink where it is the
    // week's best, weekBest)
    if (at.has(d.a) || d.mine) continue;
    // (a place's entries in the week's order, best first: heldOrder)
    const e = d.entries.find((x) => singleMove(x) && !x.pl.early && !x.pl.refRow && !x.pl.placeOnly && can(x.pl));
    if (e) at.set(d.a, { e, best: false });
  }
  return at;
}
/** Whether litOf lights choice pl: the solver's own move (plPays; owner, 2026-11-02: no threshold); where your plan
 *  leaves the week short of money (owedAt), one that pays it back keeping your transfers (paysBack). → (pl) → bool */
const litCan = (P, w) => (owedAt(P, w) ? (pl) => pl?.state === 'ready' && paysBack(w, pl) : (pl) => plPays(pl) || (pl?.state === 'ready' && !!pl.forced && showingAt(P, w.gw)));
/** The places choice pl is drawn at (decksOf): behind each player it replaces; a take-back of a transfer of yours behind
 *  your buy. → [deck] */
const placesOf = (D, pl) => D.filter((d) => d.entries.some((e) => e.pl === pl));
/** Show a transfer's rows still to come in: a row's solve out, its number not in (weekModel's pl.gain; a failed row comes to
 *  nothing). → boolean */
export const shownWaits = (plans) => plans.some((pl) => pl.forced && pl.state !== 'failed' && pl.gain == null);
/** The week's one best (design_marks/design.md: one ink plate): the solver's own move for the week (litCan: plansOf
 *  `solver`; owner, 2026-11-02, "remove all threshold and suggest what solver suggests"), the highest of its moves
 *  offered apart, never one whose take would also take back a buy of yours elsewhere (litEdges); a Wildcard or Free Hit
 *  beside the goal (`toks`) where its number is higher than that move's, or than rolling where the solver rolls. None
 *  until the week settles. Pure. → pl | null */
export function weekBest(P, w, M, D, toks = []) {
  const g = w.gw;
  if (!M.settled) return null;
  const can = litCan(P, w);
  // (the 2026-10-18 bars, `early`, no part of it: the solver's move lights whatever they say; owner, 2026-11-02)
  const ok = (pl) => !pl.refRow && !pl.placeOnly;
  // (Show a transfer's by the number the card shows, each swap solved first: the solver's order put +0.7 before +1.0;
  // owner, 2026-11-06, "why muha to hill +1 but it goes after murillo to hill")
  const waits = shownWaits(M.plans), worth = (pl) => (pl.forced ? pl.gain : pl.cmp.delta);
  const moves = M.plans.filter((pl) => ok(pl) && can(pl) && (!pl.forced || (!waits && pl.gain > -Infinity)) && placesOf(D, pl).length && !placesOf(D, pl).some((d) => litEdges(d.a, d.entries.find((e) => e.pl === pl))));
  const move = moves.reduce((m, pl) => (!m || worth(pl) > worth(m) ? pl : m), null);
  const chips = toks.filter((pl) => ok(pl) && pl.state === 'ready' && !rollOnly(pl) && !!pl.choice.chips?.[g] && pl.cmp.delta > (move?.cmp.delta ?? 0));
  return chips.reduce((m, pl) => (!m || pl.cmp.delta > m.cmp.delta ? pl : m), null) ?? move;
}
/** The choices the pitch shows lit, green (owner, 2026-10-22: one rule for pitch and Week sheet): those litOf lights
 *  that pay (plPays), and a token beside the goal that pays (`toks`). The Week sheet's rows are green with a solid +
 *  exactly these (planRow), the others neutral with an outlined +. Each other place's plate too (placeFirst), once the
 *  week settles, where it pays (owner, 2026-10-25: every place has a plate; the sheet follows the pitch), never one at
 *  a place the pitch as last drawn gave no plate (`D.drawn`); the best's wherever it is (ringed). Pure. → Set(pl) */
export function litShown(P, w, M, D, toks = [], lit = litOf(P, w, M, D, toks)) {
  const on = (a) => !D.drawn || D.drawn.has(a);
  const first = M.settled ? D.filter((d) => !lit.has(d.a) && on(d.a)).map(placeFirst).filter((e) => e?.pl?.state === 'ready').map((e) => e.pl) : [];
  // (the plates as last drawn, a sentence's sellers' own singles among them: D.drawnPl, renderDecks)
  // (a chip's token green where it is the week's best, litOf `chip`: no solver's move of its own)
  return new Set([...[...lit].filter(([a, x]) => x.best || on(a)).map(([, x]) => x.e.pl), ...first, ...(M.settled ? D.drawnPl ?? [] : []), ...toks.filter((pl) => pl.state === 'ready' && !pl.refRow)].filter((pl) => plPays(pl) || pl === lit.chip));
}
/** The Roll of a week you roll (plansOf `rolls`: no transfer, chip or Roll of yours there): its + would only make the
 *  roll one of your rules, changing nothing on screen, so it has none (owner, 2026-10-22): a "Rolling" status beside
 *  the goal (tokensOf), its Week sheet row and Why sheet with no + or Take. A Roll that takes a transfer or chip of
 *  yours back keeps its +. */
export const rollOnly = (pl) => !!pl?.rolls;
/** Plan pl's GW g in a week with transfers of yours: only what it adds to them (`adds`) and what its + takes back of
 *  yours (`back`: "instead of Scott → Xhaka"), with its GW-g moves (`now`), whether GW g plays a squad chip
 *  (`chipNow`), your GW-g transfers its + takes back (`taken`: yoursTakenBack, none in your chip week), what it takes
 *  back named short (`lost`: the buys, "Palmer", the chip, "Wildcard", or your Roll, "rolling": rollingAt), and the
 *  same as a row or place note says it (`gone`): the buy alone, "instead of Palmer" (owner, 2026-10-22), your move
 *  whole only where the choice buys him too ("instead of Murillo → Hill"). Pure. */
/** Choice c's GW-g moves your week doesn't make already (`yours`: its moves; none in your chip week, where a choice's
 *  moves are all its own): what its + adds (planBack's `adds`; weekBest's single or several). Pure. */
const addsOf = (c, g, yours) => c.moves.filter((m) => m.gw === g && !yours.some((y) => y.out === m.out && y.in === m.in));
export function planBack(P, g, pl) {
  const nm = P.L.name;
  const c = pl.choice;
  const chipNow = SQUAD_CHIPS.has(c.chips?.[g]);
  const now = chipNow ? [] : c.moves.filter((m) => m.gw === g);
  // in your chip week, what its + takes back is the chip (chipBackOf): "instead of Wildcard"; the week's changes are
  // then the chip's squad, not transfers a choice adds to, so the row says every move it makes
  const ch = chipBackOf(P, g, c);
  const yoursNow = ch ? [] : weekOf(P, g)?.moves || [];
  const adds = chipNow ? [] : addsOf(c, g, yoursNow);
  const taken = ch ? [] : yoursTakenBack(P, g, c.moves);
  // under your Roll (rollingAt: "Rolling ✓") a choice that moves someone takes it back: "instead of rolling"
  const roll = !ch && adds.length && rollingAt(P, g) ? COPY.planVsRoll : '';
  const gone = ch ? chipName(ch) : roll || taken.map((m) => (adds.some((a) => a.in === m.in) ? `${nm(m.out)} → ${nm(m.in)}` : nm(m.in))).join(' + ');
  const lost = ch ? chipName(ch) : roll || taken.map((m) => nm(m.in)).join(' + ');
  // rolls: all it takes back is your Roll (no transfer, no chip): a single move stays a single there (multiMove)
  return { chipNow, now, adds, taken, lost, gone, rolls: !!roll, back: !gone ? '' : ch || adds.length || chipNow || !now.length ? COPY.planInsteadOf(gone) : COPY.planWithout(gone) };
}
/**
 * The card behind (owner, 2026-10-20): the week's choices (weekModel's order) on the pitch, each behind the card of
 * the player it would replace: his card when he is on it, else your buy that sold him; one that only takes transfers
 * of yours back (the Roll of a week with yours) behind those buys; one that changes no player (a Roll with none of
 * yours, a Wildcard, a Free Hit, a Bench Boost alone) beside the goal (`toks`). Each buy of yours has a place, first
 * the choice that takes that transfer alone back (its Roll), else Remove (removeMove); your buys' places first, then
 * by their best choice's rank. A choice with no card to wait behind is the Week sheet's alone. A pair's move alone
 * (plansOf) waits behind the same player as the pair's card. Pure.
 * → {decks: [{a, mine, entries: [{pl | remove, inId, back?, adds, pair: [{a, out, in}], taken, lost}]}], toks: [pl]}
 */
export function decksOf(P, w, M) {
  const g = w.gw, on = new Set([...w.xi, ...w.bench].map(Number));
  const mine = M.sq ? [] : w.moves;
  const anchorOf = (o) => (on.has(Number(o)) ? Number(o) : Number(mine.find((m) => Number(m.out) === Number(o))?.in) || null);
  const by = new Map(), toks = [];
  const put = (a, e, rank) => {
    if (!on.has(a) || a === e.inId) return;
    if (!by.has(a)) by.set(a, { a, mine: false, rank, entries: [] });
    by.get(a).entries.push(e);
  };
  M.plans.forEach((pl, i) => {
    // (no Wildcard or Free Hit on the pitch: owner, 2026-10-27; Chips… and the Week sheet offer them)
    if (SQUAD_CHIPS.has(pl.choice.chips?.[g])) return;
    const { chipNow, adds, taken, lost, gone, rolls } = planBack(P, g, pl);
    if (chipNow || (!adds.length && !taken.length)) toks.push(pl);
    else if (adds.length) {
      if (benchOnly(g, pl, adds) && !pl.forced) return;
      for (const m of adds) {
        const pair = adds.filter((x) => x !== m).map((x) => ({ a: anchorOf(x.out), out: Number(x.out), in: Number(x.in) }));
        put(anchorOf(m.out), { pl, inId: Number(m.in), adds, pair, taken, lost, gone, rolls }, i);
      }
    } else for (const m of taken) put(Number(m.in), { pl, inId: Number(m.out), back: true, adds, pair: [], taken, lost, gone, rolls }, i);
  });
  for (const m of mine) {
    const a = Number(m.in);
    if (!on.has(a)) continue;
    if (!by.has(a)) by.set(a, { a, mine: true, rank: -1, entries: [] });
    // the Roll that takes this transfer alone back, once it can be taken (checking or failed: Remove, which acts at once);
    // dealt last, as every take-back is (placeOrder)
    const one = (e) => e.back && e.taken.length === 1;
    const d = by.get(a), k = d.entries.findIndex((e) => one(e) && e.pl?.state === 'ready');
    d.mine = true;
    const first = k >= 0 ? d.entries.splice(k, 1)[0]
      : { remove: { gw: g, out: m.out, in: m.in }, inId: Number(m.out), back: true, adds: [], pair: [], taken: [m], lost: P.L.name(m.in) };
    d.entries = [first, ...d.entries.filter((e) => !one(e))];
  }
  return { decks: [...by.values()].sort((x, y) => y.mine - x.mine || x.rank - y.rank), toks };
}
/** Whether choice pl's GW-g buys (`adds`) all stay out of its XI in every week of its plan from g on (pl.ev, as taking
 *  it plays them): a transfer to the bench, no plate on the pitch and no card in a place, so never the week's best
 *  (owner, 2026-10-28). Known once checked; the player's Replace list still offers him. Pure. */
export const benchOnly = (g, pl, adds) => pl?.state === 'ready' && !!pl.ev?.gws && adds.length > 0
  && adds.every((m) => pl.ev.gws.every((s) => s.gw < g || !(s.xi ?? []).some((x) => Number(x) === Number(m.in))));
/** A place's entry that takes a transfer back (the Roll of a week with yours, Remove): dealt last (placeOrder), and
 *  dealt even where the place has room for fewer cards than it holds (drawPlace: before "⋯ N more"). */
export const takesBack = (e) => !!(e.back || e.remove || e.pl?.refRow);
/** A place's entry that is one move alone (no other move of the choice: `pair` empty), a choice of its own, not a
 *  take-back, checked or checking: never a failed one ("needs Gvardiol's sale", can't be checked). */
export const singleMove = (e) => !!e.pl && !e.pair?.length && !takesBack(e) && e.pl.state !== 'failed';
/** The cards a place deals into its n slots (placeOrder's order): all where they fit, else the best that fit, then what
 *  takes your transfer back, leaving the last slot to "⋯ N more"; the best single move holds a slot as the take-back
 *  does, where the best ones are all pairs; all only with a slot to spare where the last is always the tile (`tile`:
 *  its "Other…", placePages). Pure. */
export const placeDealt = (entries, n, tile = false) => {
  const all = entries;
  // (one card per buy, its next way a line under it: placeBuys, placeLine)
  entries = placeBuys(entries);
  if (entries.length <= n - (tile ? 1 : 0)) return entries;
  const back = entries.find(takesBack) ?? null;
  const k = Math.max(0, n - 1 - (back ? 1 : 0));
  const best = entries.filter((e) => e !== back).slice(0, k);
  // (a single move shown as a dealt card's line counts, placeLine; one that is a later way of a buy is dealt by that
  // buy's card, its line then the single)
  const shows = (e) => singleMove(e) || singleMove(placeLine(all, e) ?? {});
  const one = all.find((e) => singleMove(e) && e.pl.state === 'ready') ?? all.find(singleMove);
  if (one && k && !best.some(shows)) best.splice(k - 1, 1, entries.find((e) => e === one || (!takesBack(e) && e.inId != null && e.inId === one.inId)));
  return [...best, ...(back ? [back] : [])];
};
/** A place's cards page by page (drawPlace): placeDealt's first, then every buy it had no room for (placeBuys, in
 *  placeOrder's order), n − 1 to a page, its last slot the tile that deals the next page, the first again after the
 *  last; one page where all fit, beside the tile's slot where it is always drawn (`tile`: its "Other…"). Pure. →
 *  [[entry]] */
export const placePages = (entries, n, tile = false) => {
  const buys = placeBuys(entries);
  if (buys.length <= n - (tile ? 1 : 0)) return [buys];
  const first = placeDealt(entries, n, tile), per = Math.max(1, n - 1);
  const rest = buys.filter((e) => !first.includes(e));
  const pages = [first];
  for (let i = 0; i < rest.length; i += per) pages.push(rest.slice(i, i + per));
  return pages;
};
/** A place's entries (placeOrder's order) one card per buy (owner, 2026-10-26): the first of each buy (`inId`), the
 *  better as the order has it, every take-back its own (the Roll, Remove); the next way of the same buy is its card's
 *  line (placeLine), any further way the Week sheet's (and "All N"), so freed cards deal other buys. Pure. */
export const placeBuys = (entries) => {
  const seen = new Set();
  return entries.filter((e) => takesBack(e) || e.inId == null || (!seen.has(e.inId) && !!seen.add(e.inId)));
};
/** The line under a place's card `e` (placeBuys): the next way of its buy in `entries` (placeOrder's order), "or 2nd
 *  transfer −4.3 ›" (drawPlace), which takes that choice as a header's Swap does; none for a take-back or a card that
 *  is no single move; else the buy's move alone where there is one (placeDealt's held single). Pure. → entry | null */
export const placeLine = (entries, e) => {
  if (takesBack(e) || e.inId == null) return null;
  const ways = entries.filter((x) => x !== e && !takesBack(x) && x.inId === e.inId && entries.indexOf(x) > entries.indexOf(e));
  if (!ways.length) return null;
  // (its move alone that can't be made alone too, "needs Kayode's sale")
  const lone = (x) => !x.pair?.length;
  return singleMove(e) || lone(ways[0]) ? ways[0] : ways.find((x) => singleMove(x) && x.pl.state === 'ready') ?? ways.find(lone) ?? ways[0];
};
/** A place's choice of more than one move (design 1026e "line"; owner, 2026-10-26): a plan with other moves (`pair`),
 *  or one whose take also takes back a buy of his elsewhere (`gone`; in his own buy's place, `a`, the one it replaces
 *  is the place's title: a single there). Such a choice is one sentence, never a card. Pure. */
export const multiMove = (e, a = null) => {
  if (!e?.pl || e.pl.refRow) return false;
  const own = a != null && e.taken?.length === 1 && Number(e.taken[0].in) === Number(a);
  // (a Roll taking back more than the place's own buy too: "Instead of Palmer + Tavernier + Evanilson")
  if (takesBack(e)) return !own && !!e.taken?.length;
  // (a single move under your Roll takes back only the Roll, "instead of rolling": a single, "Tavernier +1.6" on Slater
  // opening his place, never "Slater → Tavernier instead of rolling" over the bench opening its Why sheet; owner,
  // 2026-10-28)
  return !!e.pair?.length || (!!e.gone && !own && !e.rolls);
};
/** A place's entries split (design 1026e "line"): his own single moves, the cards (and his take-backs: Roll, Remove),
 *  and at most one line, the best plan he is part of, first in placeOrder's order (a checked one before one checking).
 *  A pair's move the week can't make alone (plansOf `needs`) is neither: it is that plan's move, and its reason was the
 *  phone's sum (fitOf), never the solver's (owner, 2026-10-26). Pure. → {singles, line} */
export const placeSplit = (entries, a = null) => {
  // (nor a Roll taking back more than the place's own buy: owner rejected that line; it is the Week sheet's row, the
  // place's own take-back its Remove card)
  const live = entries.filter((e) => !e.pl?.needs && !(takesBack(e) && multiMove(e, a)));
  const multi = live.filter((e) => multiMove(e, a));
  return { singles: live.filter((e) => !multi.includes(e)), line: multi.find((e) => e.pl.state === 'ready') ?? multi.find((e) => e.pl.state !== 'failed') ?? null };
};
/** A multi-move choice as one sentence (design 1026e "line"): its GW-g moves in the order its solved road makes them
 *  (`adds`: planBack's), "Neto → Tavernier, Cunha → Palmer", a take-back's words after them, "instead of Palmer". Never
 *  re-derived on the phone. Pure. → [move words] with `.back` (its "instead of …" | '') */
export const lineMoves = (P, e) => {
  const nm = P.L.name;
  const back = e.gone ? COPY.planInsteadOf(e.gone) : '';
  return Object.assign(e.adds.map((m) => `${nm(m.out)} → ${nm(m.in)}`), { back: e.adds.length ? back : capFirst(back) });
};
/** A place's entries (decksOf's) in the order its cards are dealt, nearest his own card first: the checked choices best
 *  first, then those still checking or failed, then what takes a transfer back (the Roll of a week with yours, Remove)
 *  last; ties as listed. Pure. */
export const placeOrder = (entries) => {
  const tier = (e) => (takesBack(e) ? 2 : e.pl?.state === 'ready' ? 0 : 1);
  return entries.map((e, i) => [e, i]).sort(([a, i], [b, j]) => tier(a) - tier(b) || (tier(a) === 0 ? b.pl.cmp.delta - a.pl.cmp.delta : 0) || i - j).map(([e]) => e);
};
/** The most cards a player's place deals beside him (drawPlace: slotsBeside's n). */
export const PLACE_SLOTS = 4;
/** A place's first choice, the card it deals first (placeDealt in placeOrder's order): the plate of a place no plate of
 *  litOf's names (owner, 2026-10-25), a checked one only where it gains (shownGain; the owner, 2026-11-01: "why
 *  Forkcast suggest negative move, fix": his choices stay behind his card's "N choices for his place ›"), else one
 *  still checking; none for one with no such choice.
 *  Your own buy's place its take-back, the Roll or Remove decksOf puts first there, naming the player you sold (owner,
 *  2026-10-26). Pure. → its entry | null */
export const placeFirst = (d) => {
  if (d.mine) return d.entries[0] && takesBack(d.entries[0]) ? d.entries[0] : null;
  // (never a buy its opened place asked for: plansOf `placeOnly`, its cards' alone)
  const live = (e) => !takesBack(e) && !e.pl?.placeOnly && ((e.pl?.state === 'ready' && shownGain(e.pl.cmp.delta)) || e.pl?.state === 'solving');
  // (his own moves alone: a plan he is part of has its one mark elsewhere, its sentence)
  const own = placeSplit(placeOrder(d.entries), d.a).singles;
  if (!own.some(live)) return null;
  // (a failed one listed before one still checking: the checking one, "planning…", never "can't plan" while it may land)
  const dealt = placeDealt(own, PLACE_SLOTS);
  return dealt.find(live) ?? own.find(live);
};
/** Up to n x's for a place's dealt cards beside his card at x0, `step` apart, each a whole card (cw) inside [3, W − 3],
 *  in one direction so the rank reads outward from him: rightwards, then, once the right has no more room, on his left
 *  nearest first (at the right touchline every one leftwards). Pure. */
export function slotsBeside(x0, step, n, W, cw) {
  const side = (s) => [1, 2, 3, 4, 5].map((k) => x0 + s * k * step).filter((x) => x >= 3 && x + cw <= W - 3);
  return [...side(1), ...side(-1)].slice(0, n);
}
/** A choice that failed (plansOf `failed`) in words: `head` in its number's place in a player's place, `note` under its
 *  card there, `row` its Week sheet row's and its spoken line's: "can't plan", "can't plan: no plan fits", and why in
 *  full (COPY.planFailed); a pair's move the week can't make alone (`needs`) all it lacks alone ("£1.7m short"; "£1.3m
 *  short, 3 from ARS": problemShort each) and the sales it needs ("needs Kayode's sale"). Pure. → {head, note, row} */
export function failedWords(P, pl) {
  if (!pl.needs) return { head: COPY.placeCantPlan, note: `${COPY.placeCantPlan}: ${COPY.planFailedShort(pl.why)}`, row: COPY.planFailed(pl.why) };
  const lack = pl.problems.length ? pl.problems.map(problemShort).join(', ') : problemShort(null), need = COPY.needsSale(pl.needs.map((id) => P.L.name(id)));
  return { head: lack, note: need, row: `${lack} · ${need}` };
}
/** What else a place's choice does, under its card: "planning…", why it can't be checked or made alone (failedWords),
 *  what its + takes back ("instead of Palmer"; "instead of Murillo → Hill", named whole, as its Week-sheet row does), a
 *  pair's other moves ("also Dovin → Leno, Saka → Rice": COPY.placeAlso), a transfer it adds to yours ("a 2nd
 *  transfer"), a Bench Boost or Triple Captain it plays (no words for one worth no less a week later: owner,
 *  2026-10-29); last, "removed by you". `e`: its entry in the place (decksOf). Pure. */
export function noteOf(P, w, e, a = null) {
  const nm = P.L.name, pl = e.pl, chip = pl?.choice.chips?.[w.gw];
  // (no "about as good as Truffert" under a card: owner, 2026-10-25)
  const said = (...xs) => [...xs, pl?.removed ? COPY.removedByYou : null].filter(Boolean).join(' · ') || null;
  if (pl?.state === 'solving') return said(COPY.waitShort);
  if (pl?.state === 'failed') return said(failedWords(P, pl).note);
  // in the place of a buy of yours (`a`: the place's player) every card takes that buy back: its title says so ("Rice's
  // place"), so a note naming that buy alone says nothing more; one taking back more than it still says so
  const own = a != null && e.taken?.length === 1 && Number(e.taken[0].in) === Number(a);
  const what = own ? (e.pair.length ? COPY.placeAlso(e.pair.map((p) => `${nm(p.out)} → ${nm(p.in)}`)) : null)
    : e.back ? COPY.planInsteadOf(e.lost)
    : e.pair.length ? [COPY.placeAlso(e.pair.map((p) => `${nm(p.out)} → ${nm(p.in)}`)), e.gone ? COPY.planInsteadOf(e.gone) : null].filter(Boolean).join(' · ')
      : e.gone ? COPY.planInsteadOf(e.gone) : w.moves.length && !squadWeek(w) ? COPY.placeNth(w.moves.length + 1) : null;
  return said(what, chip && !SQUAD_CHIPS.has(chip) ? chipName(chip) : null);
}
/** Your plan has a transfer in some week (every plan keeps the others), so plans count against "your plan", never "no
 *  transfers". */
export const mineAny = (P) => P.weeks.some((w) => w.moves.length);
/** Best first: the higher count (calls.counted), the model's own plan on a tie. */
export const byGain = (a, b) => b.cmp.delta - a.cmp.delta || b.model - a.model;

/** GW g's choice c ({moves, chips}) can be made on your plan as it stands: its moves in place of your GW-g ones, your
 *  other weeks kept (estimate: every move legal, no week's bank or clubs worse off than your plan has them, since the +
 *  takes GW g alone), and none buys back a player your plan has between his last sale and g (rebought). A Wildcard or
 *  Free Hit is its solve's to make. Once per plan view and choice: no solve asked for one that can't be (fitsAt). →
 *  {ok, problems: problemsOf's that stop it (a pair's move alone says what it lacks: `needs`), [] for one your plan has
 *  already or a buy back} */
const FITS = new WeakMap();
export function fitOf(ctx, P, g, c, d0) {
  if (Object.keys(c.chips || {}).length) return { ok: true, problems: [] };
  let by = FITS.get(P);
  if (!by) FITS.set(P, (by = new Map()));
  const k = `${g}|${forkKey(c, g)}`;
  if (!by.has(k)) {
    const mine = flatMoves(d0);
    const d1 = planTakeDraft(ctx, P, g, d0, c.moves);
    const ev = estimate(ctx, chipBackOf(P, g, c) ? E.setChip(d1, g, null) : d1, g);
    const ps = problemsOf(ctx, ev, g), p = ps[0] ?? null, p0 = p && problemOf(ctx, estimate(ctx, d0, g), g);
    const own = !!p && p0?.code === p.code && p0.gw === p.gw;
    by.set(k, { ok: (!p || own) && !rebought(P, c.moves, ev, mine.filter((m) => pinOfMove(P, m))), problems: own ? [] : ps });
  }
  return by.get(k);
}
export const fitsAt = (ctx, P, g, c, d0) => fitOf(ctx, P, g, c, d0).ok;

/** a move of `moves` from GW x > A buys back a player plan `ev` has in a week (no Free Hit's) between his last sale (by
 *  a move of `moves` or a transfer of yours, `mine`; else GW A) and x: the exact sale's rule keeps the player it buys
 *  out from then until x (memory.composePins). → bool */
export function rebought(P, moves, ev, mine) {
  return moves.some((m) => {
    if (m.gw <= P.A) return false;
    const sold = [...moves, ...mine].filter((x) => x.out === m.in && x.gw < m.gw).map((x) => x.gw);
    const from = Math.max(P.A, ...sold);
    return ev.gws.some((s) => s.gw >= from && s.gw < m.gw && s.chip !== 'fh' && s.squad.includes(m.in));
  });
}

/** A plan's GW-g choice as a key: GW g's decision only, the moves it makes there or the Wildcard or Free Hit it plays
 *  there (a chip in a later week is that week's decision, never a second "GW7 roll"). */
export const forkKey = (p, g) => (SQUAD_CHIPS.has(p.chips?.[g]) ? p.chips[g]
  : p.moves.filter((m) => m.gw === g).map((m) => `${m.out}>${m.in}`).sort().join(','));
