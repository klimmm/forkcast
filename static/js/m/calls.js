// Forkcast phone logic (IPHONE_DESIGN §5.4, §7.6, §9): the one measure and the planner's count, the alternatives
// for GW A, the verdict copy and the price watch. Pure and DOM-free (node static/js/m/calls.test.mjs); no side
// effects at import. Scoring, votes and verdicts stay in ../plan/engine.js; the phone's copy lives here once, in COPY.
//
// ---------------------------------------------------------------- inputs
// ctx = planInputs(bundle, data?) (GET /api/m/bundle data; `data` = app.js's derived ctx.data, whose
//   base / players / seeds / noise are reused) or the same shape built by hand:
//   {A (the next GW), gws (planned GWs), meta, base (engine base), players (engine players form),
//    seeds (decoded), noise, roads {base, roll, veto: {id: Road}, slide, chip}, bake, rank}
//
// ---------------------------------------------------------------- exports
// planInputs(bundle, data?) → ctx
// compare(ctx, a, b) → engine.compareRoads in the one measure: forecast points minus hits (what you score), from one
//   source (the bundle's mean xP), labelled by the pooled delta against the noise floor (the runs never move it, F8)
// plannerOf(a, b) → {delta, terms, hits} | null: the planner's own count (engine.objectiveOf of two solved roads), and
//   the hits each road takes that its count never charged (hits: {gap, a, b})
// changeText(what, cmp, {dir, gws, transfers, hits, planner, noise, total}) → an edit's verdict toast: the points, and the
//   planner's word whenever it parts from them (QA: never "better" by a count the planner disagrees with)
// withForced(line, now, was) → that verdict with the hits its new plan takes that its rules don't allow, or that its
//   planner never priced (memory.forcedHits), plainly (forcedNew(now, was): the ones the plan before didn't take);
//   hitCap(meta) → the solver's
//   own hit cap per GW (F17: the bundle's meta.hit_cap, what a GW without a hits rule of yours allows) | null
// rulesCost(ctx, yours, model) → {cost (≥ 0: the planner's count), label, points, transfers} | null: what your rules
//   cost, never your lineup; transfersOf(plan) → n; hitsOf(plan) → n
// captainGap(ctx, week, c, vs) → compare: captain c against vs in one week (the C-badge drag tip); subGap(ctx, week, s) →
//   compare: a sub against the lineup now (a sub's list)
// planFromRoad(ctx, road, lineup {xi, bench, captain, vice}) → {draft, evaluation, week (GW-A GwState)}: GW A with
//   your saved lineup (engine.applyLineup: repaired onto the road's squad, else the road's own; FOLLOWUPS F7)
// priceWatch(ctx, draft, {now, tz}) → GW A's price watch: per FPL price-change night before the deadline, what making
//   GW A's moves after it costs (the half-profit rule on a sale, the whole step on a buy) and what it puts out of reach
//   (engine.planBanks of the plan at those prices), each move's line and the call to act (`line`; `short`, one line of it
//   for the week line's second line) | null (nothing predicted)
// priceMorning(kept, meta, {now, prices, bank, name}) → the word the morning after a watch's night ("Groß rose
//   overnight (+£0.1m): your GW6 moves still fit", "Prices held overnight") | null while the bundle predates it
// withPrices(cols, prices) → the bundle's players columns with its prices block (FPL's projections read since the
//   snapshot) laid over them by id; shownPlayers(bundle) → its players with its live block (the newest capture's display
//   fields) and then its prices block laid over them: the rows derive and planInputs build
// priceNights(meta, {now, until}) → {nights [{k, epoch}], stale, asOf}; priceOutlook(row, nights) → a player's FPL outlook
//   {dir, sure, night, likelihood, word, held}; nightWords(epoch, now, tz) → a night in words; pricePlate(row, meta,
//   {now, tz}) → the Player data plate ("▲ tonight", "▼ Wed", "▲ likely", "Locked", "—"); PRICE_WORD (FPL's labels);
//   priceSaid(outlook, when) → the price watch's word ("very likely to drop", "may rise (FPL: likely)")
// roundedParts(parts, d) → the parts rounded to d decimals so they add up to their sum rounded (a table's rows and its
//   total; its one caller, the drift's Compare sheet, went in v1.1, 2026-10-10: only the unit tests call it now)
// handoffMoves(week) → GW A's moves as you make them in FPL (the engine's legal ones: the price watch's)
// toneOf(cmp) → 'clear'|'lean'|'coin'|'loss': a gap's colour, the loss tone when it backs the other side
// statusText(name, row) → a player's FPL flag in words ("Scott is injured (knee)") | null; OUT, newsReason(row)
// driftHeadOf(delta, label, fresh, freshLabel, gws) → {gap, label, part}: the drift toast's head in parts (COPY.driftHead in words)
// liveCheck(published, week, L) → GW A's live line: FPL's published squad against the plan's GW A (squad only)
// sentence(text) → text ending in one full stop; COPY (DESIGN_V2 §6 strings)

import * as E from '../plan/engine.js';
import { fmt, fin, chipName, plural, statusInfo } from '../ui.js';

/** How long your choices are kept away from Forkcast (the user, 2026-10-13: "make the app not to remember user choice for
 *  more than like 5 minutes and loading as if 'reset plan'"; 2026-10-14: "sign out and not remember any choices";
 *  2026-10-18: "make 30 mins instead of 5 mins"): this long after this browser last used it, the team is signed out
 *  (app.js away, also on a page left open on screen) and its choices forgotten (memory forget, as a sign-out by hand
 *  forgets them); and a team not used this long (memory USED, editedAt: your own edits, never an automatic re-save)
 *  loads as Reset plan leaves it, whichever way it is opened.
 *  Here, beside the words that say it (AWAY: COPY.awaySignedOut, Help's "Start over"); memory.js re-exports it. */
export const FORGET_MS = 30 * 60 * 1000;
const AWAY = `${FORGET_MS / 60000} minutes`;

/** A10: GW gw's marks on the switcher from the window's doubles and blanks (meta.dgw_bgw.window, api/mobile.py
 *  dgw_bgw): ['DGW'] where a club plays twice, ['BGW'] where a club doesn't play, both when both, [] otherwise. */
export function gwFlags(win, gw) {
  const has = (xs) => (xs || []).map(Number).includes(Number(gw));
  return [has(win?.doubles) ? 'DGW' : null, has(win?.blanks) ? 'BGW' : null].filter(Boolean);
}
/** The colour of a gap next to its delta: its label's, or the loss tone when the delta is a loss (a clear −1.5 is
 *  clearly worse, never a green light). Use as `g-${toneOf(cmp)}`. */
export const toneOf = (cmp) => (cmp && cmp.label !== 'coin' && (cmp.delta ?? 0) < -1e-6 ? 'loss' : cmp?.label ?? 'coin');

/** FPL's statuses a player is out with (§7.7: "a player now i/u/s"). */
export const OUT = { i: 'injured', u: 'unavailable', s: 'suspended' };
/** FPL news "Knock - 75% chance of playing" → "knock". */
export const newsReason = (row) => String(row?.news || '').split(' - ')[0].trim().toLowerCase();
/** A player's FPL flag in words (B29: memory's drift and legality, the Why line, a losing edit's toast): "Scott is
 *  injured (knee)", "Groß is 75% (knock)"; null when nothing is flagged. */
export const statusText = (name, row) => {
  const st = statusInfo(row?.status, row?.chance);
  const why = newsReason(row);
  if (OUT[st.code]) return `${name} is ${OUT[st.code]}${why && why !== OUT[st.code] ? ` (${why})` : ''}`;
  if (st.code === 'd' || (st.chance !== null && st.chance < 100)) return `${name} is ${st.chance !== null ? `${st.chance}%` : 'doubtful'}${why ? ` (${why})` : ''}`;
  return null;
};

// ---------------------------------------------------------------- small helpers

const num = (v) => (fin(v) ? Number(v) : null);
const EPS = 1e-6;
const ids = (xs) => (Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : []);
const MINUS = '−';
const pts = (x) => fmt.signed(x);
/** [7, 9] → "GW7, GW9". */
const gwList = (gws) => gws.map((g) => `GW${g}`).join(', ');
/** [6, 7, 8, 9] or a window [6, 9] → "GW6–9"; [9] or [9, 9] → "GW9" (B144: the one scope label). */
const span = (gws) => (gws.length > 1 && gws[0] !== gws.at(-1) ? `GW${gws[0]}–${gws.at(-1)}` : gws.length ? `GW${gws[0]}` : '');
/** B121 (review3 Part 7 §10: ranges built by hand next to span): GW a to GW b as span writes it, "GW6" | "GW6–9". */
const range = (a, b) => span(a === b ? [a] : [a, b]);
/** ['Saka', 'Bassey', 'Isak'] → "Saka, Bassey and Isak". */
const andList = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '');
/** ahead.fplSets → the week line's advice: whom to start ("start Justin, Barry"), else whom to bench, else (only buys
 *  change places) the buy to bench, never a buy to start: he isn't in your FPL team yet (the review of the first-use
 *  proposals, 2026-10-21). */
const setsSaid = ({ start, bench, subs }) => (start.length ? `start ${start.join(', ')}` : `bench ${(bench.length ? bench : subs.map((x) => x.off)).join(', ')}`);
/** …and its Week-sheet row's, true of what FPL has (the review of the first-use proposals, 2026-10-21: FPL's team is the
 *  last deadline's): what that team did ("benched Justin and Barry"), then each change that makes the pitch of it, one
 *  step a line in FPL's order (the user, 2026-10-22; johnson r7 §5, podmajersky r7 §8: three actions in one sentence):
 *  each substitution, the armbands and the bench's order where they differ, "(after the transfer)" on a step whose
 *  player is a buy (`buys`: his name; it asked to make Palmer vice-captain before the transfer bought him). */
const setsRow = ({ start, bench, subs, captain, vice, order, buys = [] }) => {
  const after = (on) => (on ? ' (after the transfer)' : '');
  const had = start.length ? `benched ${andList(start)}` : bench.length ? `started ${andList(bench)}` : null;
  return [had, [...subs.map((x) => `Start ${x.on} for ${x.off}${after(x.buy)}`), captain && `Captain: ${captain}${after(buys.includes(captain))}`,
    vice && `Vice-captain: ${vice}${after(buys.includes(vice))}`, order && `Bench: ${order.join(', ')}`].filter(Boolean)];
};
/** One of three words for a drift's answer (COPY.driftAct, driftDone, driftAdopted; memory.detectDrift: ruleNames your
 *  rules by name, never the hold's, broken the ids of all it ignores, the hold's too): `rules` when it ignores a rule of
 *  yours, `hold` when only the hold (your team with no transfers but yours), else `none`. */
const driftWay = (d, rules, hold, none) => (d?.ruleNames?.length ? rules : d?.broken?.length ? hold : none);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const ORD = (n) => { const v = n % 100, s = ['th', 'st', 'nd', 'rd']; return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`; };
/** A rank in words with its thousands grouped: 1566 → "1,566th", 12 → "12th" (fmt.ordinal's ending). */
const rankOrd = (n) => fmt.ordinal(n).replace(/^\d+/, fmt.int(n));
/** A rank as the You sheet's tile has it: "1,000", "670K", "1.30M" (never "1K"). */
const rankShort = (n) => (n < 1e4 ? fmt.int(n) : fmt.compact(n, 2));
/** n hits in words: "a −4", "two hits (−8)". */
/** [{gw}] → "GW7" | "GW7 and GW8". */
const gwsWords = (list) => list.map((x) => `GW${x.gw}`).join(' and ');
const hitsWords = (n) => (n > 1 ? `${WORDS[n] ?? n} hits (${MINUS}${E.HIT_COST * n})` : `a ${MINUS}${E.HIT_COST}`);
/** The solver's own hit cap per GW (F17): the bundle's meta.hit_cap (api/mobile.py, read back from the base road's Rules),
 *  what a GW with no hits rule of yours allows; null before the plan service has one. */
export const hitCap = (meta) => num(meta?.hit_cap);
/** A plan length's feature, as the server names it when it locks it (the bundle's meta.locked; api/mobile.py
 *  horizon_feature): "horizon:2", the 2-week plan of You → Plan ahead. */
export const horizonFeature = (n) => `horizon:${n}`;
/**
 * The plan's weeks this browser asks for (You → Plan ahead; the user, 2026-10-14): `choice`, its stored pick (1..most;
 * none or out of range: most, the longest), or, when that length is locked (`locked`: the bundle's meta.locked), the
 * longest one that is not (one week never is), as the server falls back (api/mobile.py plan_weeks). most: the plan's
 * reach (meta.reach's length); with neither a choice nor a reach (no bundle yet) null: the server's own, its longest.
 */
export function planWeeks(choice, locked = [], most = null) {
  const n = num(choice), top = num(most);
  const want = Number.isInteger(n) && n >= 1 && (top === null || n <= top) ? n : top;
  if (want === null) return null;
  const off = (k) => k > 1 && (locked || []).includes(horizonFeature(k));
  return off(want) ? Math.max(...Array.from({ length: top ?? want }, (_, i) => i + 1).filter((k) => !off(k))) : want;
}
/** Tenths of £m as a signed amount: 1 → "+£0.1m", −2 → "−£0.2m". */
const signedMoney = (t) => `${t > 0 ? '+' : ''}${fmt.money(t / 10)}`;
const tenths = (m) => (num(m) === null ? null : Math.round(Number(m) * 10));
const lookupOf = (ctx) => E.playerLookup({ base: ctx.base, players: ctx.players });
const weekAt = (road, gw) => (road?.weeks || []).find((w) => Number(w.gw) === Number(gw)) || null;

// ---------------------------------------------------------------- copy (IPHONE_DESIGN §9, §7.9, §5)

/** A sentence that ends in a name ends once: "Not Bruno G." never reads "Bruno G..". */
export const sentence = (text) => (/[.!?…]$/.test(String(text)) ? String(text) : `${text}.`);

/** F17 / N7: a Wildcard or Free Hit week in words: what the chip makes of it, and (a Free Hit) the free transfers it
 *  keeps for the week after (ftNext). */
const chipWeekWhat = (chip, gw, ftNext = null) => (chip === 'fh'
  ? `one-week squad, back to your team in GW${gw + 1}${ftNext == null ? '' : ` · ${ftNext} FT kept for GW${gw + 1}`}`
  : 'unlimited transfers this week');
export const COPY = Object.freeze({
  span,
  range,
  /** A C-badge drag tip: the armband on him against the captain now, in the one measure (no weak-call mark: the verdict
   *  words went, the user 2026-10-18, "remove 'negligible' / 'a negligible gap to the best' and similiar crap"). */
  capGap: (delta, vsName) => `${pts(delta)} pts vs ${vsName} (C)`,
  capNow: 'Captain now',
  /** The V's drag (ahead.js dragBadge; the user, 2026-10-13: "also vices", as the C's): its words beside the finger,
   *  no number (the vice scores nothing unless the captain misses, A9): over a starter, over the vice, over the captain
   *  (the armbands swap, as FPL's), and with no starter under it. */
  viceTo: (name) => `${name} · vice`,
  viceStays: 'Vice now',
  viceSwap: (name) => `${name} · the armbands swap`,
  viceDrop: 'Drop the vice armband on a starter',
  /** The armband's list (ahead.armbandSheet: a tap on the C or the V): its title. */
  armIn: (arm, gw) => `${arm === 'v' ? 'Vice-captain' : 'Captain'} · GW${gw}`,
  /** A sub's list (ahead.subSheet: a tap on his label on the bench, "1" (his order: m-ahead.css .pm-blp); the user, 2026-10-21: fix all,
   *  first-use proposal #5): its title, as his card names him (pitch.js: "substitute 1", the keeper "goalkeeper"); n his
   *  place in the bench order (pitch.subOrder), null for the keeper. */
  subIn: (n, gw) => `${n == null ? 'Goalkeeper' : `Substitute ${n}`} · GW${gw}`,
  /** Replace's "Let Forkcast choose" (the user, 2026-10-13): the sale alone yours, the buy the full plan's (ahead.sellAny). */
  autoBuy: 'The full plan picks who comes in',
  /** A lifted shirt's line under the switcher (ahead.js liftShirt; the user, 2026-10-13: subs "the same way it let
   *  move the captain"): the players he can swap with outlined on the pitch (engine.swapCandidates: the legal swaps), the
   *  weeks he can be sold from glowing; whichever he has. `out`: the Wildcard or Free Hit week that brought him in, where
   *  a drop rules him out of its squad (the review, 2026-10-13: the line said "sell" there). */
  liftShirt: (name, swap, sell, out = null) => (out != null
    ? `Drop ${name} ${[swap ? 'on a player to swap them' : null, `on GW${out} to rule him out`, sell ? 'on a later week to sell him' : null].filter(Boolean).join(', or ')}`
    : swap && sell ? `Drop ${name} on a player to swap them, or on a week to sell him`
      : swap ? `Drop ${name} on a player to swap them` : sell ? `Drop ${name} on a week to sell him from then`
        : `No swap or week works for ${name}`),
  /** How many forecast runs back the pooled call: information for the Why sheet only, never a verdict (F8). */
  agreement: (lead, runs) => `${lead} of ${runs} forecast runs`,
  /** An edit against the plan before it (Ahead's verdict toast, changeText): forecast points minus hits, the
   *  direction in words, not only colour. `total`: the take and remove toasts name it as what your total moves by, the
   *  header's change at that moment (changeNum; the user, 2026-10-21: fix all (first-use proposal #1): Sam's "+2.6"
   *  beside "(+4.0)", "Is it +2.6 or +4.0?"). */
  change: (what, delta, label, gws, total = false) => `${what} · ${COPY.changeNum(delta, total)}`,
  changeNum: (delta, total = false) => (total ? `total ${pts(delta)}` : `${pts(delta)} pts`),
  /** A9 (the fix pass): an edit's subject in plain words, one form for every way in (B90): "Bassey in your plan" (GW A:
   *  B55, the move is the plan's until you make it in FPL), "Bassey in GW7", "Saka and Bassey in your plan"; with the
   *  player he replaces, "Bassey in for Chilwell in your plan", "Bassey in for Chilwell · GW7". */
  cameIn: (names, gw = null) => `${andList(names)} in ${gw != null ? `GW${gw}` : 'your plan'}`,
  cameInFor: (name, outName, gw = null) => `${name} in for ${outName}${gw != null ? ` · GW${gw}` : ' in your plan'}`,
  /** What an edit takes off: one thing, or a list said once ("Groß → Dewsbury-Hall and Calvert-Lewin → Mateta removed":
   *  ahead.addPlan, the first-use findings 2026-10-21: one "removed" a move ran a Roll's toast to three lines). */
  removed: (what) => `${Array.isArray(what) ? andList(what) : what} removed`,
  /** B129: a choice making a move you removed this session (ahead.plansOf `removed`: after the others, never lit; its
   *  Week sheet row, its spoken line, its card's note in his place). The user, 2026-10-21: fix the known issues. */
  removedByYou: 'removed by you',
  /** A choice whose moves made the next week are worth no less (ahead.plansOf `early`, earlyOf; the user, 2026-10-18:
   *  "why murillo-hill suggested in gw8 if worse points"), listed since 2026-10-21 ("Same both times, worse ones too"),
   *  never lit: its Week sheet row, its spoken line, its card's note in his place (ahead.earlyWords). */
  asGoodIn: (gw) => `as good in GW${gw}`,
  /** …with your later sale of the player it bought, which has no one to sell then (ahead.removeMove). */
  /** The review (2026-10-08: "there is no 'move to next week'"): your transfer made in another GW, its toast's subject
   *  ("Chilwell → Bassey moved to GW7", ahead.moveTo). */
  movedTo: (move, gw) => `${move} moved to GW${gw}`,
  /** …and the Why sheet's When line ("why this week and not next"): its label, and each week read out: one you can move
   *  your transfer to (ahead.whenSheet), the move's own week, one where it can't be made ("—"). B79: a tap chooses a
   *  week and the button under the line carries the verb ("Move it to GW7", whenVerb; read out whenMove); the first-use
   *  findings (#8, 2026-10-21): "When … each week" read as a per-week split, so it is labelled "If made in" and its
   *  weeks are Add a player's week tiles (css/m-a.css), a picker for timing. */
  whenHead: 'If made in',
  /** …what its numbers count against, under it and in its label (ahead.whenSheet): `vs` the sheet's own baseline, its
   *  header's ("vs rolling": each week's number set on rolling as the header is, ahead.onBase; the user, 2026-10-22:
   *  one baseline per sheet), else keeping the player it sells (vsKeeping), as Chips… says each row's own: chipNoChip. */
  whenVs: (vs, gws) => `Points over ${span(gws)} ${vs}`,
  whenVerb: 'Move it to',
  whenMove: (gw, delta) => (delta == null ? `${COPY.whenVerb} GW${gw}` : `${COPY.whenVerb} GW${gw}: ${pts(delta)} pts`),
  whenHere: (gw, delta) => (delta == null ? `GW${gw}, its week` : `GW${gw}, its week: ${pts(delta)} pts`),
  whenNone: (gw) => `GW${gw}: can't be made`,
  /** B79: a week you can choose (a tap selects it; the button under the line moves it there: whenMove). */
  whenWeek: (gw, delta) => (delta == null ? `GW${gw}` : `GW${gw}: ${pts(delta)} pts`),
  /** B63: the Why table's forecast group (sheets/why.js pairTable). */
  gridUnit: 'Forecast pts',
  /** The stats' head, the Why table's and the player card's: their rounds, and in the Why table whom its ranks are among
   *  (Dana, the first-use findings #15, 2026-10-21: "xG 18th vs 2nd" said among whom nowhere; the user, 2026-10-21: fix
   *  all (first-use proposal #6)): "Stats · GW1–7 · ranks among 84 midfielders", `n` his position's ranked players (api/
   *  card.py _strip `n`), `word` its plural (sheets/player.js WORD); the rounds alone without them. */
  statsHead: (g0, g1, n = 0, word = null) => `Stats · ${range(g0, g1)}${n > 0 && word ? ` · ranks among ${n} ${word}` : ''}`,
  /** …and under the Why table, once, the stats set apart from the forecast (#15: "The evidence on this page argues for
   *  keeping Saka, and the model says sell him"): the table's own GWs, so the last matches' points above aren't taken
   *  for the forecast. */
  statsPast: (gws) => `Stats are past matches; the ${span(gws)} points above are the forecast.`,
  captainNow: (name) => `${name} captain`,
  viceNow: (name) => `${name} vice`,
  /** A1: a buy that needs a second sale, asked in place before anything changes: "Saka needs £1.2m more · Also sell
   *  Calafiori → Bassey (−4)?" (the hit when the extra sale takes one: FPL's count). */
  /** …its button, with what doing both gives (Replace's ask: the reviews, 2026-10-11, no points was asked for): "Do both ·
   *  +1.2", spoken "Do both, +1.2 points over GW6–9". */
  doBoth: (delta) => `Do both · ${fmt.signed(delta)}`,
  doBothSaid: (delta, gws) => `Do both, ${fmt.signed(delta)} points over ${span(gws)}`,
  fundAsk: (name, short, outName, inName, hits = 0, forName = null) => `${name}${forName ? ` for ${forName}` : ''} ${COPY.moneyNeeds(short)} · Also sell ${outName} → ${inName}${hits ? ` (${MINUS}${E.HIT_COST * hits})` : ''}?`,
  /** A2: a funding sale's row and its Why: what it frees, and what it scores on its own. */
  funds: (money, name) => `Frees ${money} so ${name} fits`,
  /** B95: the tie's other end, on the buy's row: the sales that fund it ("with Haaland → Thiago"); a sale of yours whose
   *  money a later week's buy needs ("Pays for B.Fernandes in GW8 and Palmer in GW9"). */
  fundedBy: (moves) => `with ${andList(moves)}`,
  /** B54: a transfer's money on its Why line, in words ('→' is a transfer's alone: "£6.1m → £5.9m" read as a price drop):
   *  what its sale frees beyond its buy, or what the buy takes from the bank, with the bank it takes it from where known
   *  (`bank`: bankNow's words, first-use findings #7: "£2.3m from the bank?" with the bank shown nowhere); null when
   *  they're equal. */
  frees: (x, bank = null) => (Math.abs(x) < 0.05 ? null : x > 0 ? `frees ${fmt.money(x)}` : `${fmt.money(-x)} from the bank${bank ? ` (${bank})` : ''}`),
  /** A4: a week with no transfer, its verdict in its row; B52: who left it empty (ahead.emptyHead): under the hold the
   *  Roll's own words, "Rolling" (COPY.rollingNow; "No transfers yet" went: the owner, 2026-10-26, "no transfer yeat
   *  remove since rolling already show it"); no edit reaches it (GW A under way) "No transfers"; off the hold a week Forkcast's plan leaves empty "Forkcast rolls GW8" ("No transfers" while
   *  an edit's check may still re-plan it: review 5, 2026-10-12; and in a week a Roll rule holds, rollRule: a suggested
   *  plan's + since 2026-10-13, or an older plan's Roll, kept on load by memory.normalizeAccepted). */
  noTransfers: 'No transfers',
  forkcastRolls: (gw) => `Forkcast rolls GW${gw}`,
  rollKeeps: (ft, gw) => `${ft} FT in GW${gw}`,
  /** B92: …read out, FPL's codes in full (the row's aria-label): "2 free transfers in gameweek 7". */
  rollKeepsSaid: (ft, gw) => `${plural(ft, 'free transfer')} in gameweek ${gw}`,
  /** The week's free transfers, said first on a week with none of yours: "1 FT". */
  ftNow: (ft) => `${ft} FT`,
  ftNowSaid: (ft) => plural(ft, 'free transfer'),
  /** The week's bank after its moves (fmt.money's words), said after its free transfers (ahead.factsWords; the user,
   *  2026-10-21: "where it shows itb money", "On the week line"), in FPL's word, never shortened: "£0.8m ITB"; read out
   *  "£0.8 million in the bank". */
  itb: (money) => `${money} ITB`,
  itbSaid: (money) => `${money.replace(/m$/, ' million')} in the bank`,
  inTeam: (name) => `${name} is in your team already.`,
  /** B8: a buy whose every sale of his position is a player your Keeps hold, by the first GW a Keep holds them. */
  keptIn: (names, gw) => `${andList(names)} ${names.length > 1 ? 'are' : 'is'} kept in GW${gw}.`,
  /** A3: a buy no single extra sale pays for: what it needs, and another week only when that week fits him. Any edit
   *  short of money says it so, the buy named where it is known (B53b; null: "Needs £1.2m more in GW6."). */
  noFit: (name, short, gw, tryGw = null) => `${name ? `${name} ${COPY.moneyNeeds(short)}` : COPY.moneyNeeds(short).replace(/^n/, 'N')} in GW${gw}.${tryGw ? ` He fits in GW${tryGw}.` : ''}`,
  /** B26 (the user, 2026-10-10): the weeks a later week's numbers count, its GW to the window's end ("GW8–9"; was the
   *  last GW's "valued over GW9 only", generalised to a span): the suggested plans' label names them (COPY.suggested). */
  valuedOver: (gws) => span(gws),
  /** B29: the move if its buy misses its GW (scored 0 there, the lineups as planned: ahead.ifMisses), and what it makes
   *  when he plays (`base`, where the two differ as shown: first-use findings #7, "−9.3" read as what a miss costs). */
  ifMisses: (name, gw, delta, base = null, vs = null) => `if ${name} misses GW${gw}: ${pts(delta)}${base != null && pts(base) !== pts(delta) ? `, not ${pts(base)}${vs ? ` ${vs}` : ''}` : ''}`,
  /** B5b: the week's better use of the free transfer your transfer takes (ahead.otherUseOf), a move now in its place,
   *  never a fallback (first-use findings #7), and what your transfer makes with it (`mine`): "Better use of this free
   *  transfer: Scott → Groß +7.5, not +2.3". */
  instead: (move, delta, mine = null, vs = null) => `Better use of this free transfer: ${move} ${pts(delta)}${mine != null ? `, not ${pts(mine)}${vs ? ` ${vs}` : ''}` : ''}`,
  /** The baseline a Why fact's ", not X" names when the sheet's header counts against rolling instead (the review of the
   *  first-use fixes, 2026-10-21: "+0.4 vs rolling" over "…, not +2.8" read as two numbers for one move). */
  vsKeeping: (name) => `vs keeping ${name}`,
  /** A buy the money can't pay, in the same words shown and said (Add a player's Sells chip, Replace's row; first-use
   *  findings #7: "Groß −£5.0m" read as money lost on the sale): "£5.0m short". */
  moneyShort: (x) => `${fmt.money(x)} short`,
  /** …the same fact where it follows the sale or buy it is about, in the words noFit and fundAsk say it (the user,
   *  2026-10-22: Bring in…'s "Groß £5.2m short" read as Groß short of money): "Groß · needs £5.2m more". */
  moneyNeeds: (x) => `needs ${fmt.money(x)} more`,
  /** A Sell list row's ≈ and a Bring in week pill's number (replace.js, wish.js pillWords): what your total moves by when
   *  it is made, its word under it as a list row's unit is ("pts GW8–11"), said with it (the user, 2026-10-21: fix all
   *  (first-use proposal #1): Priya's "≈ +3.3" then "−1.2" against rolling, "Is Vuskovic good or bad?"). */
  listTotal: 'total',
  listTotalSaid: (delta, about = false) => `${about ? 'about ' : ''}${pts(delta)} points to your total`,
  offCaptain: (gw) => `He has the armband in GW${gw}`,
  /** QA check6 (s48): an edit's toast at once, with its Undo, while the full plan solves (its verdict replaces it in
   *  place); B23: from 5 s its age after the ellipsis ("Checking Groß in your plan… 0:12": so, ahead.js clockText), and
   *  while the server is away the wait it is in. */
  pendingEdit: (what, so = null) => `Checking ${what}…${so ? ` ${so}` : ''}`,
  pendingOffline: (what) => `${what} · waiting for the connection`,
  /** B24: an Undo said once, with no button, in the edit's own words ("Undone: Groß in your plan", ahead.undoOf); K4: the
   *  week it shows (`gw`) after them, unless they name it already (the phone recheck of the first-use proposals,
   *  2026-10-21: "Undone: Murillo → Truffert removed · GW9 lock removed · GW9", "Undone: E.Le Fée in GW7 · GW7"). The
   *  state it leaves, never a double reversal (the user, 2026-10-22: "Undone: Saka → Palmer removed · GW8 lock removed"
   *  read as two negatives; podmajersky r7 §9): each clause the edit said "… removed" or "… taken off" now "… back", one
   *  it said "… back" now "… removed"; "Undone: " only before a first clause that stays as it was said ("Undone: GW8
   *  Saka → Palmer · GW8 frozen"), else none ("Saka → Palmer back · GW8 frozen back"). (A removal takes its own rules
   *  alone since the owner, 2026-10-26, "no hardcoded logic whatsoever": no "also removed" nor "… needed the money"
   *  clause to turn.) */
  undone: (what, gw = null) => {
    const turn = (c) => c.replace(/ (removed|taken off)$/, '\u0000').replace(/ back$/, ' removed').replace(/\u0000/g, ' back');
    const parts = what.split(' · '), said = parts.map(turn).join(' · ');
    return `${turn(parts[0]) === parts[0] ? 'Undone: ' : ''}${said}${gw != null && !new RegExp(`\\bGW${gw}(?!\\d)`).test(what) ? ` · GW${gw}` : ''}`;
  },
  /** The forecast noise (the bundle's meta.noise, its GW): the You sheet's Status row and the Player data sheet's note. */
  noiseValue: (noise, gw) => `${fmt.num(noise, 2)} pts (GW${gw})`,
  /** Help (the header's "Help", You → Help; the user, 2026-10-13: "rewrite help so it readable"): a three-sentence
   *  lead, then one section per task, each a short list of actions in the app's own control names, each folding on its
   *  own (helpSheet: its head a button, the first open). It replaced six paragraphs of how the planner works (B76, review 5) and the
   *  tips list (the hints' lines are its bullets now; the button that shows them again stays). Checked line by line
   *  against the code on 2026-10-13: a plan's + freezes its week (a Roll in Your rules), the card's Keep / Force out, the
   *  pitch's drags and holds, Chips… and Bring in… on the week line, the sign-out after FORGET_MS away. */
  helpShort: 'Help',
  /** The first-use hints, each one line until its action is done once (ahead LEARN_KEY), in Help's words: the Week
   *  sheet's first transfer row's (its swipe; the veto's own words, "Not Groß", B19; no hold since the rows left the
   *  screen: a transfer moves through its Why sheet's When line, the user's 5b, 2026-10-19), the pitch's two lines (a shirt's
   *  hold: a sub or a sale; the C's or the V's drag) and, in the same corner once those are learnt, the chips' two (the
   *  user, 2026-10-13: "why help says nothing about activating bb or tc"; the codes the GW tiles show, the corner too
   *  narrow for the chips' names at 375 px). Help brings them back (tipsAgain). */
  // the veto's one word, as its Why button and rule chip say it (the user, 2026-10-22: one word per concept)
  hintRow: (name) => `Swipe left: Not ${name}`,
  hintPitch: ['Hold a shirt: sub, sell', 'Hold C or V: move it'],
  hintChips: ['Hold C still: TC', 'Hold bench: BB'],
  tipsAgain: 'Show tips on the screen again',
  helpLead: 'Forkcast plans your FPL team up to four gameweeks (GWs) ahead. It can\'t change your FPL team: make your transfers in the FPL app before the deadline. Each change shows a message with Undo.',
  /** → [[head, [bullet], clip?]], the order a first visit needs them; `clip`: the section's recording of its steps done
   *  on the real app (static/m/clips, sheets/about.js clip; the user, 2026-10-14, "in help missing illustrations how to
   *  actually do it", "STOP USING RANDOM CRAP PICTURES"); `noise` and `gw` (ahead.inputsOf) are read by no line now
   *  (the noise's points are Dev mode's). The first-use findings (#9, 2026-10-21): what each number counts against (the total:
   *  your plan, renderTotal; a choice: rolling, plansOf; the ≈ of a Sell list: keeping him, replace.js score), a chip's
   *  best week (chipBests, honestBest) and how long checks take (minutes for the Chips sheet's, as the managers timed
   *  them); never the noise's points (a model internal, Dev mode's: you.js paintDev). A take's message, its two numbers
   *  and its Why (the user, 2026-10-21: fix all (first-use proposals #1, #2)). The week line's facts in a GW with no
   *  transfers, its bank among them (the user, 2026-10-21: "where it shows itb money", "On the week line": ahead.factsWords). */
  help: (noise = null, gw = null) => [
    ['Plan your transfers', [
      'Pick a GW at the top, or swipe the pitch.',
      'Forkcast\'s best buy waits behind the player he would replace, once that GW\'s plans are checked.',
      // plain words for the stacked cards and the take (the user, 2026-10-22: no coined "Edges", "card behind", "bring
      // him on": a transfer, not a substitute)
      `Tap the card behind a player to take that transfer; ${COPY.whyAct} on its message shows why.`,
      'Stacked cards behind a player are more choices for his place: tap them (or hold the card) to spread them out, each with its +.',
      'In a player\'s place, Keep over his own card keeps him that GW: nothing sells him.',
      'Roll and chips sit beside the goal.',
      // the rule a take adds, by its own word (rollRule; the user, 2026-10-22: never "lock", the plan length's padlock): a
      // transfer's "GW8 frozen", the Roll's "GW8 roll", a Wildcard's or Free Hit's its chip (the review of round 7: not
      // every take freezes its GW)
      'Taken transfers freeze their GW (Your rules: frozen): Forkcast changes nothing there. Roll adds a roll rule; Wildcard or Free Hit, the chip.',
      'Tap a choice\'s card, or a player tagged IN, to see why.',
      `Tap the line above the pitch for that GW's transfers, ${COPY.plansHead} and your rules.`,
      // its free transfers in every week, before its transfers (the user, 2026-10-22: renderLine's weekLead)
      'The line above the pitch shows each GW\'s free transfers (FT) and money in the bank (ITB); with no transfers, the next GW\'s FT too.',
    ], 'plans'],
    ['Bring in a player', [
      `Tap ${COPY.bringInShort} (above the pitch, beside ${COPY.chipsDoor}), then + beside a player.`,
      'Pick a GW, then under Sells tap who goes out, or Forkcast picks.',
    ], 'bringin'],
    ['Your players', [
      'Tap a shirt for his card: Keep, or Force out (one week, or sold from a week on).',
      'Under Force out, From GW… lets you choose who comes in, or Let Forkcast choose.',
      'Hold a shirt, then drop it on an outlined player to swap them, or on a GW to sell him from then.',
      'Tap the C or the V to pick who wears it from a list.',
      'Tap a sub\'s order on the bench (1st, 2nd or 3rd) to pick who he replaces from a list.',
      'Hold the C or the V, then drop it on a starter. The V on the C swaps them.',
    ], 'replace'],
    ['Change a transfer', [
      'Tap the line above the pitch, then × on your transfer to remove it.',
      `Tap the player tagged IN, then a GW under “${COPY.whenHead}”, then ${COPY.whenVerb} that GW.`,
    ], 'xfer'],
    ['Keep a player, or say Not to one', [
      'Tap the line above the pitch. Swipe a transfer left: Not the player it buys, in that GW.',
      `On the card of a player you don't have, ${COPY.notHim} keeps him out.`,
      'A Wildcard or Free Hit week\'s changes work the same.',
      'Your rules, at the end of that list, shows what you set. Tap one, then Remove.',
    ], 'rules'],
    ['Settings', [
      `Hits: tap your initials, then set ${COPY.hitsHead}.`,
      `How many GWs it plans: tap your initials, then set ${COPY.aheadHead}.`,
    ]],
    ['Play a chip', [
      `Tap ${COPY.chipsDoor} (above the pitch, beside ${COPY.bringInShort}), then a chip. Each shows its best week.`,
      'Triple Captain: hold the C still.',
      'Bench Boost: hold the bench where no shirt is.',
      `The same hold again, or ${COPY.chipTakeOff} in ${COPY.chipsDoor}, takes it off.`,
      'Best week: of the GWs your plan covers in its half of the season, where it gains most against not playing it.',
      // one baseline per chip (the user, 2026-10-22: "vs rolling everywhere"; ahead.chipNumber), each row naming its own
      'A Wildcard or Free Hit\'s number is vs rolling that GW, as a plan\'s. Bench Boost and Triple Captain: vs not playing it.',
      `${COPY.chipNoBestName}: no GW beats the next best by enough to act on. GWs past your plan aren't checked.`,
      `A chip's numbers can take minutes; its row says ${COPY.chipChecking} until then.`,
    ], 'chips'],
    ['What the numbers mean', [
      'Points are forecast FPL points for a typical week, not a promise, minus 4 for each hit.',
      'The total at the top: your plan\'s points, no transfers unless you add them.',
      // one phrase for the baseline, "vs rolling" (the user, 2026-10-22: no "beats rolling", "against rolling")
      'A transfer\'s number: its gain vs rolling that GW, to the end of the plan.',
      'A plan\'s number: its gain vs rolling that GW. Roll has no number: the others are vs it.',
      // decision K (the owner, 2026-10-25: "compare + poitns not to rolling now but to transfer made")
      'In a GW with a transfer, Wildcard or Free Hit of yours, every choice, Roll too, is vs your plan: worse than yours is negative.',
      'Vs rolling, both sides get Forkcast\'s best later moves (none after a Wildcard), so the free transfer rolling saves can be used.',
      'Taking a choice adds its GW\'s moves alone, not the later ones its number counts, so the total can move by another amount.',
      // (the owner, 2026-10-26: "what means +1.6 vs rolling but total +5.1"; its message says no number since the owner,
      // 2026-10-27: "remove this 'vs ..' message from black tab appearing")
      'The total at the top shows its own change once the message goes.',
      'Green: it beats the alternative by enough to act on.',
      'Grey: not worth acting on: a plan or chip that doesn\'t beat what it counts against by enough, or a gap too small to matter.',
      // (the user, 2026-10-21, "Same both times, worse ones too": the moves the 2026-10-18 bars keep from being the week's
      // suggestion are listed, grey: ahead.plPays `early`)
      'Grey too: a move that adds next to nothing or loses when taken, or is as good a GW later.',
      'A transfer, Wildcard or Free Hit in your plan: amber when its gain is small, red when it loses by enough to matter.',
      // (the owner, 2026-10-26: "fix so every squad is solver squad": the plan is never drawn from an estimate)
      'While a change is checked, the plan before it shimmers until the new one is in. A check can take from seconds to several minutes.',
      '≈ before a number in a list: Forkcast\'s quick estimate. Every squad and number of your plan is its solver\'s.',
      '≈ in a Sell list is vs keeping him. Once made, the transfer\'s number is vs rolling instead, so it can differ.',
    ]],
    ['What the marks mean', [
      // (decision I: the ink plate the transfer week's, an ink ring after it; the owner, 2026-10-26, picked "Black ring")
      'Black name plate: bought this GW; tap him for who he replaces and why.',
      'Black ring round a name: bought in an earlier GW of your plan, not in your FPL team yet.',
      // (B61: the owner, 2026-10-26, picked "Struck old points" for the bar he asked about: "what this green line")
      'Struck number on a GW: its points with no transfers of yours, beside its points with them.',
      'Dot in a GW\'s corner: your own lineup there. Reset lineup (pitch, top right, under Player data) brings the best one back.',
      `Lock on a GW: past your plan (${COPY.aheadHead}). Tap it to see how to plan it.`,
    ]],
    ['Prices and news', [
      'Before a price change, the line above the pitch says whether to make your transfer tonight. Hide, in its list, puts it away.',
      `New forecast: ${COPY.driftUseAct} takes its plan; ${COPY.driftReplanAct} or ${COPY.driftHoldAct} re-plans yours. Ignore it to keep your plan.`,
      'Player data (pitch, top right): choose what shows under each shirt.',
      'On a player\'s card, tap ⓘ to read what a chart shows.',
    ]],
    ['Start over', [
      'Tap your initials, then Reset plan.',
      // (the pitch's pill, the user, 2026-10-21: "maybe place it small on pitch"; ahead.planHasYours, resetFits)
      'Reset plan is on the pitch too (top right, where there\'s room) while your plan has a transfer, chip or rule of yours.',
      `Leave Forkcast for more than ${AWAY} and it signs you out of the team and clears its choices.`,
    ]],
  ],
  /** About Forkcast (sheets/about.js): under Connect's form for whoever reads on, and from Help and the You sheet (the
   *  user, 2026-10-14: "show this tab at loading - any one want to read will read, others will click find my team"; "dont
   *  name 'why forkcast'"; "rewrite full why forkcast section"). Its questions are the ones r/FantasyPL's Rate My Team
   *  threads ask most, in managers' words, the most asked first (14,944 posts, Aug 2025 - Oct 2026: A or B 17%, a
   *  Wildcard or Free Hit team 15%, who starts 14%, the bank 11%, a hit 7%, now or next week 5%, roll 5%; a third never
   *  answered, 43% of those stating their bank), each answered by a recording of the screen that answers it (whyApp:
   *  static/m/clips, tools/qa/scenarios/about-clips.mjs); no Reddit figure on the page (the user: "learn managers pain
   *  using rmt and what to advertise by it"). Results are finishing ranks inside a season, never points across seasons
   *  (the user: "showing points for 2024 / 2025 is just meaningless"); nothing says when to play a chip (the user: "chips
   *  are for all season and can't be decided within 4 gameweek horizon"). Never "beats", "proven" or "guaranteed". */
  whyTitle: 'About Forkcast',
  whyHero: 'Your team\'s questions, answered before the deadline.',
  whySub: 'Roll or transfer, A or B, who to bench, whether the −4 pays: Forkcast works it out for your squad, your bank and your free transfers, in points over the next four gameweeks.',
  whyStart: 'Find my team',
  /** One a question (`clip`: static/m/clips/<clip>.webp, recorded on the real app), the most asked first. */
  whyApp: [
    { clip: 'plans', ask: 'Roll or make a transfer?', text: 'Forkcast\'s best buy waits behind the player he would replace, scored vs rolling the transfer: the points it adds over the next four gameweeks. One tap takes the transfer, and the player you sold waits behind him to take back.' },
    { clip: 'replace', ask: 'A or B? Who replaces him?', text: 'Drag a player onto a gameweek and everyone who could come in for him is ranked, with the money your bank allows.' },
    { clip: 'rules', ask: 'Keep your player, or rule one out?', text: 'Tap the line above the pitch, then swipe a transfer left: Not the player it buys. It holds for that gameweek, goes into Your rules, and the plan is made again around it.' },
    { clip: 'bench', ask: 'Who starts? Who\'s on the bench?', text: 'Forkcast picks your XI, captain and bench order for every gameweek, the bench in the order FPL\'s auto-subs use.' },
    { clip: 'bringin', ask: 'Take a −4 now, or wait a week?', text: 'Name any player: see what bringing him in gains in each of the next four gameweeks, a −4 taken off in a week that costs one, and who Forkcast would sell to pay for him. Take the best week in one tap.' },
    { clip: 'player', ask: 'Will he start? Is he worth it?', text: 'Tap a player for his card: his team news, his last six matches with the cup and international games between them, his next five forecasts, and the stats that best foretell his points, ranked against his position.' },
  ],
  /** The seasons replayed (why.json records: the rank after each GW, on the solver's own tables). */
  /** How it works' folded row over the seasons replayed and the scouts' tables (sheets/about.js `proof`). */
  // (the scouts' tables open on this season's live one: the user, 2026-10-14, "why it says past if fresh 15 also scored on
  // this season")
  whyProof: 'How it did: past seasons replayed, and this season against the scouts',
  whyRecordHead: 'Replayed over whole seasons',
  whyRecordLead: 'The planner run through a past season one deadline at a time, knowing only what was known then: every transfer, captain and bench its own. Its chips were played in weeks set beforehand.',
  whyPlace: (r) => `${fmt.ordinal(r.ranks.at(-1))} overall`,
  whyPlaceOf: (r) => `in ${COPY.seasonOf(r.season)}, replayed`,
  whyRankAxis: 'Overall rank after each gameweek',
  whyRecordNote: (r) => `A replay, not a real entry: nobody played this team.${r.estimated ? ' Its weekly ranks are estimated; the final one is from FPL\'s final table.' : ''}${r.am ? ` It can't play the Assistant Manager chip, so +${r.am} is credited for it.` : ''} Forkcast's settings were tuned on these seasons, so they flatter it, and one season is partly luck.`,
  /** The same replays at 1-4 GWs (why.json horizons: each one's final rank). */
  whyHorizon: 'The same replays planning one to four gameweeks at a time. Across both seasons four came out best, so Forkcast plans four; each season\'s best is in bold.',
  whyHorizonCols: ['Plans ahead', 'Final rank'],
  whyHorizonRow: (w) => (w === 1 ? '1 gameweek' : `${w} gameweeks`),
  /** The fresh-team benchmark (GET /api/m/scouts this season, why.json scouts the seasons replayed): every team's XI
   *  after FPL's auto-subs, net of its captain (the user, 2026-10-14: "must be net of captains for all teams"), the
   *  scouts named; no count of weeks won (the user: "dont understand what the points of showing 2 out 6"). */
  whyScoutsHead: 'Against the scouts',
  whyScoutsLead: 'Every week Forkcast also picks a fresh fifteen, as the scouts do. Each team is scored the same way: its XI after FPL\'s auto-subs, without the captain\'s double.',
  whyScoutsLive: (s) => `${COPY.seasonOf(s.season)} so far, live: a real FPL team (ID ${s.entry}) built from Forkcast's fifteen before every deadline. Updated after every gameweek.`,
  whyScoutsReplay: (s) => `${COPY.seasonOf(s.season)}, replayed: Forkcast's fifteen each gameweek against every squad a scout posted.`,
  whyScoutsCols: ['', 'GWs', 'Forkcast', 'Scout'],
  // the tuning caveat once, in the replays' note above it (the user, 2026-10-14: "no need to dublicate it in two places")
  whyScoutsNote: 'Scored on the gameweeks each scout posted a squad.',
  seasonOf: (s) => `${s}/${String(s + 1).slice(2)}`,
  whyHowHead: 'How it works',
  /** [lead, rest]: only what holds through a retrain (the user, 2026-10-14: "model description must be slim"; "learned not
   *  only from premier league but also from other competitions": modules/leagues.py BUILD_LEAGUES, the club cups and
   *  Europe; national-team games are fetched but read by no model input; "need to say that it multiple models also with
   *  differnt architecture averaged": the pool, ml/configs/utils/paths.py PROD_PRED_DIRS, is checkpoint sets of different
   *  structure, a dozen or more seeds each, averaged). Nothing says Forkcast is free ("maybe later adding a paywall"). */
  whyHow: [
    ['It forecasts every player.', 'Several neural networks built for FPL, with different architectures, forecast each player\'s points for his next five fixtures, and Forkcast averages them. They learned from every Premier League season since 2009/10 and its players\' cup and European matches, and read match data, team news and prices, never ownership.'],
    ['It plans four gameweeks at once.', 'Transfers, XI, captain and bench are solved together within FPL\'s rules (your players\' selling prices and your bank, three per club, free transfers banked, −4 hits), around any chip you play.'],
    ['It\'s fresh before every deadline.', 'The data is fetched and the forecast re-run every night and again before each deadline, ready 75 minutes before it for the late team news.'],
  ],
  whyFacts: [
    ['No login.', 'Type your team\'s name or ID: no account, no password.'],
    ['It never touches your FPL team.', 'You make the moves in the FPL app.'],
    ['A forecast is a typical week, not a promise.', 'A good plan still loses some weeks: judge it over a run of them.'],
  ],
  whyLegal: 'Not affiliated with the Premier League or FPL.',
  /** B38: the noise's one name on screen (the solver's per-transfer charge at the anchor; `noise` stays the code's
   *  name), never "margin of error": the You sheet's Dev row, the Why sheet's sentences and its run strip. */
  /** The Player sheet's stats key, first (api/stats_pick.json, tools/stats_pick.py; the user, 2026-10-14: "make to be
   *  chosen by data", "show stats which actually not dead and distinguish players"): `word` his position's plural
   *  ("midfielders"), `kinds` the kinds of points his rows foretell in his order (api/card.py _kinds, _rows), `his`
   *  false when he has too few minutes to be ranked (the position's order then). */
  chargeName: "Forkcast's charge for a transfer",
  charge: (noise) => `${COPY.chargeName} (${fmt.num(noise, 2)} pts)`,
  /** M8: the player sheet's match strip legend: the run ticks are the model runs' agreement, not the points he may score;
   *  `ticks` false (B105: off a local page none are drawn) leaves their clause out. */
  barWidth: 'Bar width = minutes.',
  runSpread: (ticks = true) => `${COPY.barWidth} Forecast = a typical week, not a ceiling${ticks ? '; its ticks show how far the forecasts agree' : ''}.`,
  /** An opponent's venue as every screen writes it (pitch.oppText): the player sheet's chart key and Player data's. */
  // in words too: a screen reader says "EVE" and "eve" alike (the review of the first-use fixes, 2026-10-21)
  oppCase: 'capitals at home (EVE), lower case away (eve)',
  /** M6: an own pick's side effects in its GW (ahead.sideEffects) and the hit it may take (the Replace rows). */
  replaces: (moves) => `replaces ${moves}`,
  adds: (moves) => `adds ${moves}`,
  hitsIn: (n) => (n ? `${MINUS}${E.HIT_COST * n}` : 'no hit'),
  afterHit: (n) => `after ${n > 1 ? `${WORDS[n] ?? n} hits (${MINUS}${E.HIT_COST * n})` : `a ${MINUS}${E.HIT_COST}`}`,
  hitOrInstead: (moves) => `${MINUS}${E.HIT_COST}, or instead of ${moves}`,
  /** A8: Replace's hit, said once over its list: the rows' numbers count it. */
  replaceHit: (gw, others = null) => `A buy here is an extra transfer in GW${gw}: its ${MINUS}${E.HIT_COST} is counted in each number${others ? `, or Forkcast drops ${others} instead` : ''}.`,
  /** B93 (podmajersky P1 §8): Replace's and Add a player's search that finds no one, the typed text quoted, and the way
   *  out (FPL's names are mostly surnames: "Emile" finds no one): "No midfielder called “Emile”. …". */
  noneCalled: (who, q) => `No ${who} called “${q}”. Try his surname as FPL writes it.`,
  /** M10: the bank a Replace row spends from: GW A's is the bank now, a later GW's the one after the week before; with
   *  other transfers that week (`others`: your own GW6 move spends or frees money too), the one after them. */
  bankNow: (money, gw, A, others = false) => (others ? `${money} in the bank after GW${gw}'s other transfers`
    : gw === A ? `${money} in the bank now` : `${money} in the bank after GW${gw - 1}`),
  chipLess: (x, gw) => `${fmt.num(Math.max(0, x))} less than in GW${gw}`,
  /** M1: a chip planned (its verdict toast, ahead.chipPlan): what was played, then what the week gives up against the
   *  chip's honest best (`less`, chipLess: "3.0 less than in GW8", the chip played there; the review of the first-use
   *  proposals, 2026-10-21: "less than GW8" was unclear), left out where it isn't known; no number "vs …" (the owner,
   *  2026-10-27: "remove this 'vs ..' message from black tab appearing": its Chips… row and the pitch's token have it). */
  chipToast: (what, less = null) => [what, less].filter(Boolean).join(' · '),
  /** …when the planner's own count parts from the points (QA: a rule is never called better by a count the planner
   *  disagrees with): the points, then why, plainly. way: 'better' | 'worse' by its count, 'no better' | 'no worse' with
   *  none (B39: an estimate claims no count; a count inside the noise is changeLevel's). */
  changeAgainst: (what, delta, gws, reason, way, total = false) => `${what} · ${COPY.changeNum(delta, total)} · Forkcast rates it ${way}: ${reason}`,
  changeLevel: (what, delta, gws, reason, total = false) => `${what} · ${COPY.changeNum(delta, total)} · Forkcast rates them level: ${reason}`,
  /** A lineup change (a sub, the armband, a reset): its GWs' points (gw: one GW or a list), said as a gain or a loss
   *  (F7). */
  lineup: (what, gw, delta, label) => `${what}${[].concat(gw).length > 1 ? ` (${gwList([].concat(gw))})` : ''} · ${pts(delta)} pts`,
  /** …of one GW after GW A: the GW said with it ("Saka captain in GW8"). */
  inGw: (what, gw) => `${what} in GW${gw}`,
  /** H17: two subs swapped (ahead.sub): the bench order they make, [[name, n]] ("Bench order: Walle Egeli 1st, Murillo
   *  3rd"; n counts the subs after the keeper). */
  benchOrder: (subs) => `Bench order: ${subs.map(([name, n]) => `${name} ${ORD(n)}`).join(', ')}`,
  /** F9 / F13 / F17: a per-GW Roll or hits rule in words (ahead.autoRuleName's chip toasts, memory.ruleText), as the
   *  per-GW Auto-plan control named its choices until it went (2026-10-12: the hits Forkcast may take are You → Hits;
   *  memory.normalizeAccepted drops a stored hits rule on load; a Roll is a suggested plan's + since 2026-10-13,
   *  COPY.rollRule): every one is that GW's. A hits rule restricts
   *  the solver's own default (n hits a GW: hitCap), and the default is no rule at all. AUTO-PLAN (the user, 2026-10-08:
   *  "what does Roll mean if Groß is added?") was whether Forkcast may add transfers of its own to the week; Off was
   *  never "no transfer" (your own still counted). "Roll" stays the FPL word for making none: GW A's Roll alternative
   *  (rollGw: no caller since pickAlternative went, 2026-10-12), "rolling keeps 2 FT", a gain "vs rolling". */
  rollGw: (gw) => `Roll GW${gw}`,
  /** A week's Roll rule (memory.pinRoll; the user, 2026-10-13, "Lock it, both modes": a suggested plan's + keeps that
   *  week exactly its choice, whoever makes the rest): "GW8 roll", the Roll row's and the plan row's words (planRoll), or
   *  with k moves of yours kept there "GW8 frozen" (the user, 2026-10-22: "lock" was the plan length's padlock, a
   *  paywalled length's and FPL's price lock too; "frozen" is free since Freeze went, 2026-10-12). A noun, as it is named in a toast too ("Vuskovic in your plan · GW8 roll
   *  removed"; the first-use findings, 2026-10-21: "… · No transfers · GW8 removed" read as "no transfers" right after
   *  one was made). */
  rollRule: (gw, k = 0) => (k ? `GW${gw} frozen` : COPY.planRoll(gw)),
  /** A Roll + in a week with nothing to take back (ahead.addPlan; saffer r7 §7: "GW8 roll · total 0.0" changed no
   *  number and named no rule): the rule it made and what it does. */
  rollMade: (gw) => `${COPY.rollRule(gw)} in Your rules: no transfer in GW${gw} until you take one`,
  /** The retired Auto-plan control's segments (ahead.gwModes, gone 2026-10-12): "Off", "FT only", "Up to −4", "Up to
   *  −8" (the solver's own cap); one line each (the user, 2026-10-08: "Free transfers" took two). "FT only" still names
   *  a hits rule of 0 (freeOnly, gwNote, memory.ruleText); segUpTo has no caller. */
  segFreeOnly: 'FT only',
  segUpTo: (n) => `Up to ${MINUS}${E.HIT_COST * n}`,
  /** You → Hits (the user, 2026-10-12: "auto plan allowed hits must be somewhere in settings"; ahead.hitsChoices): the
   *  hits Forkcast may take a week, every week, one setting: its heading, its segments ("None", "−4", "−8": n hits), the
   *  line under it, its toast's subject and the rule it is (memory's derived 'hits' pin). */
  // (podmajersky r7 §12: "a week" read as a duration, "Its … take no more" pointed two phrases back)
  hitsHead: 'Most hits per GW',
  hitsSeg: (n) => (n === 0 ? 'None' : `${MINUS}${E.HIT_COST * n}`),
  hitsNote: 'Forkcast\'s suggestions and the transfers it adds stay within this.',
  hitsMax: (n) => (n === 0 ? 'Hits: none in any week' : `Hits: up to ${MINUS}${E.HIT_COST * n} a week`),
  /** You → Plan ahead (the user, 2026-10-14: "to the setting where hit cost are set also add forecast horizon"): how
   *  many GWs Forkcast plans from the next deadline (planWeeks): its heading, its segments, the line under it, and the
   *  one line why the options with a lock can't be picked (meta.locked). */
  aheadHead: 'Plan ahead',
  aheadSeg: (n) => (n === 1 ? '1 week' : `${n} weeks`),
  aheadNote: 'The GWs after your plan show a lock at the top.',
  aheadLocked: 'Options with a lock aren\'t available on this Forkcast.',
  /** A GW past your plan, tapped on the GW switcher (ahead.js edgeTicks): how to plan it, or that its length is
   *  locked. */
  weekOff: (gw, n) => `Your plan covers ${COPY.aheadSeg(n)}. To plan GW${gw}, tap your initials, then ${COPY.aheadHead}.`,
  weekLocked: (gw) => `GW${gw} is past your plan, and longer plans aren't available on this Forkcast.`,
  hitsUpTo: (n, gw) => `Up to ${MINUS}${E.HIT_COST * n} in GW${gw}`,
  defaultHits: (n, gw) => (num(n) === null ? `When hits pay in GW${gw}` : `Up to ${MINUS}${E.HIT_COST * n} in GW${gw} (default)`),
  /** Review 5 (2026-10-12): one name for a hits rule of 0, the retired Auto-plan segment's ("FT only"), on the chip
   *  toasts that take it off or bring it back (ahead.autoRuleName) and its rule chip and note (memory.ruleText). */
  freeOnly: (gw) => `${COPY.segFreeOnly} in GW${gw}`,
  notWorthIt: ' · not worth it',
  /** F17: a Wildcard or Free Hit week, said over its changes in the Week sheet (ahead.drawWeek; the chip makes every
   *  transfer free there). */
  chipWeek: (chip, gw, ftNext = null) => `${chipName(chip)} GW${gw}: ${chipWeekWhat(chip, gw, ftNext)}.`,
  /** …what that week is, alone (N7: the plan card's second line until the card went, 2026-10-08; nothing calls it now). */
  chipWeekWhat: (chip, gw, ftNext = null) => { const t = chipWeekWhat(chip, gw, ftNext); return t[0].toUpperCase() + t.slice(1); },
  /** N7: a Free Hit or Wildcard week's moves as the squad they make, the week line's second line ("Wildcard +14.7" over
   *  "8 changes": ahead.renderLine). */
  nChanges: (n) => plural(n, 'change'),
  /** A GW tile's struck points, your team's as it is, without your transfers (the owner, 2026-10-26: "they must cross
   *  points without transfers so it can be compared how transfers benefit"): "~~60.0~~ 61.8 xP", a shop's was-price
   *  (ahead.renderRail, tickWas), spoken "60.0 points without your transfers". */
  tileWas: (pts) => `${pts} points without your transfers`,
  /** A bring-in's changes to a Wildcard or Free Hit week's squad, ending its moves line (ahead.inWords): "1 change to your
   *  Free Hit" (review 5, 2026-10-12: it read "12 transfers, no hit", the chip's own count, after one arrow). */
  chipChanges: (chip, n) => `${plural(n, 'change')} to your ${chipName(chip)}`,
  /** …and the rule a chip planned there takes off with it (its verdict toast): "Up to −4 in GW6 removed"; B58: the chip
   *  taken off brings it back (ahead.chipOff): "Up to −4 in GW6 back". */
  chipRemoves: (rule) => `${rule} removed`,
  /** M4: a chip planned in a week that played another, as a taken plan's toast names it (ahead.chipWords). */
  inPlaceOf: (what, chip) => `${what} in place of ${chip}`,
  chipBack: (rule) => `${rule} back`,
  /** A week's "FT only" rule described (memory.ruleOf, an older plan's per-week rule read back). */
  gwNote: { free: (gw) => `${COPY.segFreeOnly} in GW${gw}.` },
  /** QA-5 #3: a week that takes more hits than the rules it was solved under allow (memory.forcedHits: f), with what the
   *  solver did (its cause), plainly: the note under a week's Auto-plan control until that went (gwNoteOf, 2026-10-12);
   *  only the unit tests call it now. QA-7 #3: a hit your rules allow that the planner never
   *  priced (f.allowed) says so with its cause, never "the plan takes it". B116: one fact a sentence, the consequence
   *  first ("The −4 lands in GW8, where your rules don't allow it. Forkcast planned it in GW7 …"). */
  hitForbidden: (f) => {
    const it = f.hits > 1 ? 'them' : 'it';
    const over = f.cap ? `, more than your ${MINUS}${E.HIT_COST * f.cap} allows` : null;
    if (f.cause === 'moved') {
      return `The ${f.hits > 1 ? `${hitsWords(f.hits)} land` : `${MINUS}${E.HIT_COST} lands`} in GW${f.gw}${f.allowed ? `, where Forkcast didn't plan for ${it}` : over ?? `, where your rules don't allow ${it}`}. Forkcast planned ${it} in ${gwsWords(f.from)} and kept a free transfer there. FPL uses free transfers first.`;
    }
    return `GW${f.gw} takes ${hitsWords(f.hits)}${f.allowed ? " Forkcast didn't plan for" : over ?? " your rules don't allow"}. ${f.cause === 'relief' ? 'Forkcast found no plan without it.'
      : `You have ${plural(f.ft, 'free transfer')} there for ${plural(f.buys, 'transfer')}.`}`;
  },
  /** …the same in a verdict (the toast of the edit that brought it, a chip's line). */
  hitForbiddenShort: (f) => `the plan takes ${hitsWords(f.hits)} in GW${f.gw} ${f.allowed ? "Forkcast didn't plan for" : "your rules don't allow"}${f.cause === 'relief' ? ' (no plan without it)'
    : f.cause === 'moved' ? ` (planned in ${gwsWords(f.from)}; FPL uses free transfers first)` : ''}`,
  /** F15a: the hits the planner took in a GW that FPL's order books in another (calls.hitBook's `to`), after its note. */
  hitBooked: (to) => ` FPL books ${to.reduce((n, x) => n + x.hits, 0) > 1 ? 'them' : 'it'} in ${gwsWords(to)}: it uses free transfers first.`,
  /** The one button that brings him in, under the line naming its moves: Add a player's week (the fix pass,
   *  2026-10-09: one way in, one word for it); no name on the money toast's action, which names him already
   *  ("Bring in from GW7", B74). */
  bringIn: (name, gw) => `Bring in ${name ? `${name} ` : ''}from GW${gw}`,
  /** A Wildcard or Free Hit week's bring-in (ahead.wishPin): him in that week's chip squad, the rest the solver's. */
  bringInChip: (name, gw, chip) => `Bring ${name} into your GW${gw} ${chipName(chip)}`,
  /** B35 (2026-10-10: one verb on every bring-in label): Add a player's title, and its footer link with "…". */
  bringInSheet: 'Bring in a player',
  /** Its door at the week line's right end (ahead.js bringDoor; the footer went 2026-10-13). */
  bringInShort: 'Bring in…',
  /** The week line's Chips… door and its sheet (ahead.chipsDoor, sheets/chips.js; the user, 2026-10-13: "add 'chip..'
   *  button next to 'bring in..' every where instead of having play wc play fh inside suggestion"): its title, spoken
   *  label, the line under the title (each number's span; its baseline is each row's own, in its fact: chipNoChip),
   *  and each row's name and one fact (chipStates: played here, by Forkcast, planned in another week, instead of the
   *  week's chip, its best week, played this half). */
  chipsDoor: 'Chips…',
  chipsIn: (gw) => `Chips in GW${gw}`,
  chipsSaid: (gw, chip = null) => (chip ? `Chips in GW${gw}, ${chipName(chip)} planned` : `Chips in GW${gw}`),
  chipsSub: (gws) => `Points over ${span(gws)}`,
  /** A Chips… row's baseline, said in its fact (the user, 2026-10-22: "vs rolling everywhere"; one sheet-wide "vs not
   *  playing it" went): a Wildcard's or Free Hit's its own (`vs`: rolling, ahead.chipNumber), a Bench Boost's or Triple
   *  Captain's not playing it (they change no transfer: vs rolling would fold the week's transfers into it), a swap
   *  row's the chip it replaces ("vs it"). */
  chipNoChip: 'not playing it',
  // a row whose chip replaces the week's: its number is against that chip (the review, 2026-10-13), said on the row
  chipOn: (c) => `${chipName(c)} ✓`,
  chipByForkcast: 'By Forkcast · Take it off',
  chipMoveHere: (gw) => `In GW${gw} · Move it here`,
  chipInstead: (c) => `Instead of ${chipName(c)}`,
  chipVsIt: 'it',
  chipBestHere: 'Its best week',
  /** \u2026another week's: its number where known (a Wildcard's or Free Hit's the pitch's choice in that week, `vs` its
   *  baseline: ahead.chipShown; the user, 2026-10-22: one Free Hit number), none while that choice is still checked. */
  chipBestAt: (gw, delta = null, vs = null) => `Best week: GW${gw}${delta != null ? `\u00a0${fmt.signed(delta)}${vs ? ` ${COPY.chipVs(vs)}` : ''}` : ''}`,
  /** A row's baseline in its fact: "vs rolling", "vs not playing it" (chipNoChip), "vs it" (chipVsIt). */
  chipVs: (vs) => `vs ${vs}`,
  /** The weeks of its half after the plan's last, never looked at (findings #13, Kenji, 2026-10-21), said with a clear
   *  best week too (the user, 2026-10-22: "Its best week" from four weeks of a chip that lasts to GW19). */
  chipAfter: (after) => `weeks after GW${after} aren't checked`,
  /** A row's fact and what follows it, joined once (sheets/chips.js factOf). */
  chipFact: (...parts) => parts.filter(Boolean).join(' \u00b7 '),
  /** A Wildcard or Free Hit choice's Why sheet: the chip it spends and when the next one comes (the second half's first
   *  GW: ahead.halfEnd, the season's chip rules), "Uses your last Free Hit" in the second half (the user, 2026-10-22). */
  chipUses: (chip, next = null) => (next != null ? `Uses your ${chip}; next one GW${next}` : `Uses your last ${chip}`),
  /** …while its weeks are checked (ahead.chipWait, findings #2): Add a player's count (checkingWeek), its clock after it. */
  chipBestChecking: (gw, i, n) => `Best week · ${COPY.checkingWeek(gw, i, n)}`,
  /** …when the best week doesn't beat the runner-up (`next`, its gain `runner`; none in: not playing it) by more than a
   *  toss-up (ahead.chipBests' clear: engine.verdictLabel's 'coin', under VERDICT.lean × the noise), and the weeks of
   *  its half after the plan's last (`after`) never looked at (findings #13, Kenji, 2026-10-21). The noise itself is
   *  Dev mode's (you.js paintDev: a model internal), so the words say the toss-up, never its points. */
  chipNoBestName: 'No clear best week',
  /*  `bare`: the weeks without their gains (a Wildcard's or Free Hit's row, whose number is vs rolling: those gains are
   *  the pre-solves' against not playing it, which pick its best week; the user, 2026-10-22: "vs rolling everywhere"). */
  chipNoBest: ({ gw, delta, next, runner }, after = null, bare = false) => `${COPY.chipNoBestName}: GW${gw}${bare ? '' : ` ${fmt.signed(delta)}`} ${next == null
    ? 'is too close to not playing it' : `and GW${next}${bare ? '' : ` ${fmt.signed(runner)}`} are too close to call`}${after != null ? `. ${COPY.chipAfter(after).replace(/^w/, 'W')}` : ''}`,
  chipNoGain: 'No week gains',
  chipPlayed: (gw, back = null) => `Played${gw != null ? ` GW${gw}` : ''}${back != null ? ` · back GW${back}` : ''}`,
  chipChecking: 'checking…',
  /** Chips…'s row of a chip you played in that week. */
  chipTakeOff: 'Take it off',
  /** …and its check, verb first (B87: "Checking" is an edit's or a bring-in's wait, "Planning" a new forecast's): Add a
   *  player's "Checking GW7 · 2 of 4 weeks" (the week in flight, its place among the weeks that need a solve), with its
   *  clock after it (ahead.clockText, B87b); the Week sheet's suggested plans while they check, "Checking GW8 · 3 of 9
   *  plans" (`of` 'plan': ahead.plansWait; the first-use run, 2026-10-21, #2: "checking…" with no progress), the week
   *  line's second line in the same words until they are lit on the pitch, "Checking GW8 · 3 of 9" where they don't fit
   *  (`of` null; the user, 2026-10-21: fix all (first-use proposal #8)), "Checking · 3 of 9" where that doesn't either
   *  (`gw` null: the week line is the viewed week's; the review of the first-use proposals, 2026-10-21: at 375–390 px
   *  the count was cut, "Checking GW9 · 1 o… · 0:00"). */
  checkingWeek: (gw, i, n, of = 'week') => `Checking${gw != null ? ` GW${gw}` : ''} · ${i} of ${of ? plural(n, of) : n}`,
  /** B51: Add a player's line when no week works, as its pills say: every check failed (each "offline": no connection),
   *  every week not possible, else each pill's own reason. */
  weeksUnchecked: (offline) => `Couldn't check the weeks${offline ? ': no connection' : ''}. Try again in a minute.`,
  noWeekPossible: (gws) => `No plan brings him in during ${span(gws)}.`,
  noWeekWorks: 'No week works: each week above says why.',
  /** B30 (podmajersky P2 §10): FPL's club limit by its own number (engine.MAX_PER_CLUB) and the way out. */
  club: (count, club, gw) => `GW${gw} would have ${count} ${club} players; FPL allows ${E.MAX_PER_CLUB}. Sell one of them first.`,
  /** …as a list row or a week pill says it (Replace's blocked row, Add a player's pill a solve couldn't fit): "3 from ARS". */
  clubFull: (club) => `${E.MAX_PER_CLUB} from ${club}`,
  /** No plan has it (B53), with "Your plan is unchanged." after it. */
  noPlan: (gw) => `No plan fits that from GW${gw}.`,
  unchanged: 'Your plan is unchanged.',
  infeasible: (gw) => `${COPY.noPlan(gw)} ${COPY.unchanged}`,
  /** RULES_V2 §5: a heal that can't keep every rule. The rules stay; the plan is the last one that worked. The choice
   *  named as its row says it (ahead.rowName: "Scott → Groß · GW6"), and "rule" kept for what Your rules lists (johnson
   *  Part 4 §5: a transfer was called a rule, under a name no row showed). */
  rulesClash: (stuck, what) => `No plan keeps ${stuck ?? 'all your choices'}${what ? ` with “${what}”` : ''}. Your plan is unchanged. Remove one, or Undo.`,
  /** …for an edit that adds no rule (a removal, Reset plan, "Without …"): its own words, then what the rules left can't
   *  keep, as the solver said it (ahead.clashParts; the owner, 2026-10-26: a Remove left four Arsenal players' worth of
   *  rules, and the phone drew them): "Calafiori → Hill removed: no plan keeps your GW9 choices (Leno → Raya and João
   *  Pedro → Evanilson). Your plan is unchanged. Remove one, or Undo." */
  dropClash: (said, stuck) => `${said ? `${said}: no` : 'No'} plan keeps ${stuck ?? 'your other choices'}. Your plan is unchanged. Remove one, or Undo.`,
  /** The week the solver found no plan for and your choices there (ahead.clashParts): "your GW9 choices (Leno → Raya and
   *  João Pedro → Evanilson)". */
  choicesAt: (gw, names) => `your GW${gw} choices (${andList(names)})`,
  /** B12: the Week sheet's status row (its first words the week line's second line) while that failure stands (ahead.clashLine): what the solve couldn't keep ("Groß in
   *  GW6", else all of these) with the choice that broke it, as its row says it ("Keep Scott · GW6"). Its Removes are on
   *  the row; the toast's Undo is gone by then, so the row never offers it. */
  rulesStuck: (what, by) => `No plan keeps ${what ?? 'all of these'}${by ? ` with ${by}` : ''}. Remove one.`,
  unfinished: "Forkcast couldn't finish checking that. Your plan is unchanged.",
  pinClash: (name, keepTo, sellGw) => `Keeping ${name} through GW${keepTo} clashes with selling him in GW${sellGw}. Which one?`,
  /** A week of your plan that takes hits: a fact, never "needs" (the plan takes a hit only where its count says it pays,
   *  at the solver's own price: F17). Its last caller, the "In FPL…" checklist, went 2026-10-10: only the unit tests
   *  call it now. */
  hitTaken: (gw, hits) => `GW${gw} takes ${hits > 1 ? `${WORDS[hits] ?? hits} hits` : 'a hit'}: ${MINUS}${E.HIT_COST * hits}.`,
  /** The drift (F1; its toast, ahead.driftSay): the whole new plan against yours (never one player's verdict), then the
   *  main way they part, and the rules of yours it ignores (its "Re-plan with your rules" re-plans with them). `what`
   *  null: no news to name, no "Since …" sentence (review 5, 2026-10-12: in a three-line toast it pushed out the
   *  rules). The gap and the rules first, the news after (review 6, 2026-10-13: led by the news, the three-line toast cut
   *  its own number off). */
  drift: (since, what, main, delta, label, gws, rules = [], fresh = null, freshLabel = label) => `${COPY.driftHead(delta, label, fresh, freshLabel, gws)}${rules.length
    ? ` (it ignores your rule${rules.length > 1 ? 's' : ''}: ${rules.join(', ')})` : ''}.${what ? ` ${sentence(`Since ${since}: ${what}`)}` : ''}${main ? ` ${sentence(`Main difference: ${main}`)}` : ''}`,
  /** …its head (F10: one compact element): the gap, then the part of it that is news
   *  (driftHeadOf; the reviews, 2026-10-11: the toast credited the whole gap, your own choices' part too, to the new
   *  forecast). */
  driftHead: (delta, label, fresh = null, freshLabel = label, gws = null) => {
    const x = driftHeadOf(delta, label, fresh, freshLabel, gws);
    return `${x.gap}${x.part ? ` (${x.part.gap})` : ''}`;
  },
  /** The drift toast's answers (ahead.driftSay, memory.switchWithUndo): "Use it" takes the updated plan; "Re-plan with
   *  your rules" (it ignores a rule of yours) keeps your plan on your rules, re-planned on the updated forecast; "Keep only
   *  your transfers" (it ignores only the hold, your team with no transfers but yours: no one added it, so it is never
   *  named as a rule of yours; the first-use findings, 2026-10-21) the same. Each in one word for every way in: the
   *  toast's button (driftAct), the toast after it (driftDone) and the journal note (driftAdopted). */
  driftUseAct: 'Use it',
  driftSwitched: 'Switched to the updated plan.',
  driftReplan: 'Re-planning with your rules on the updated forecast.',
  driftReplanAct: 'Re-plan with your rules',
  driftHold: 'Re-planning with only your transfers on the updated forecast.',
  driftHoldAct: 'Keep only your transfers',
  driftAct: (d) => driftWay(d, COPY.driftReplanAct, COPY.driftHoldAct, COPY.driftUseAct),
  driftDone: (d) => driftWay(d, COPY.driftReplan, COPY.driftHold, COPY.driftSwitched),
  driftAdopted: (d) => driftWay(d, `Re-planned with your rules on the updated forecast (the updated plan ignored ${(d.ruleNames || []).join(', ')})`,
    'Re-planned with only your transfers on the updated forecast', `Switched to the updated plan: ${d.best}`),
  driftWhy: (since, what, main, rules = []) => [sentence(`Since ${since}${what ? `: ${what}` : ''}`),
    rules.length ? sentence(`It ignores your rule${rules.length > 1 ? 's' : ''}: ${rules.join(', ')}`) : '', main ? sentence(`Main difference: ${main}`) : ''].filter(Boolean).join(' '),
  /** The journal's notes of a forecast update you kept your plan over (memory writes them; the You sheet drew them, with
   *  their gain, until its History went: the user, 2026-10-08). */
  kept: 'New forecast: no change worth making',
  keptLocked: (gw) => `The new forecast changes GW${gw}, which is locked in. Your plan stays`,
  keptOver: 'Kept your plan after a forecast update',
  /** B14: what a new forecast changed in the suggested plan (memory.forecastChange), the week line's second line and a row of the Week sheet: GW A's
   *  moves in words, then the later weeks' count ("New forecast: GW6 Scott → Le Fée (was Groß) · 2 changes in GW7–9"). */
  newForecast: (A, gwA, later, held = false) => `New forecast${held ? ', best plan' : ''}: ${[gwA ? `GW${A} ${gwA}` : null, later].filter(Boolean).join(' · ')}`,
  /** What a choice takes back of your rules (ahead.takenBack: an alternative, Roll), named as their chips say them
   *  (ruleOf), on the line and in the sheet that asks first alike. Taken back is gone: the plan no longer keeps them. */
  altClash: (words) => `${words.join(', ')} removed`,
  removedRules: (n) => `Removed ${n} rule${n === 1 ? '' : 's'}`,
  /** A later week's bank below 0 at FPL's prices (a sale FPL pays £0.1m less for than the solver's data): drift, not
   *  an overspend (the solver keeps every week in budget at its prices). B103: its amount and when it is checked again
   *  ("−£0.1m at FPL's sale prices · checked again before GW8"), never a bare "≈ price drift". */
  priceDrift: (bank, gw) => `${fmt.money(bank)} at FPL's sale prices · checked again before GW${gw}`,
  /** The price watch (priceWatch): a player's predicted change in a move's line, in FPL's reading's words (priceSaid: "▲ Groß
   *  very likely to rise tonight (+£0.1m to buy)"); what a "very likely" does to the money (by the half-profit rule on a
   *  sale), or "not counted" without the entry's stepped sale price. A "likely" is never counted and its word says so
   *  ("▲ Groß may rise tonight (FPL: likely)", B49): one bracket, never "(FPL: likely) (not counted)". */
  watchPart: (p, when) => `${p.dir > 0 ? '▲' : '▼'} ${p.name} ${priceSaid(p, when)}${!p.sure ? '' : ` (${!p.counted ? 'not counted'
    : p.role === 'buy' ? `${signedMoney(p.step)} to buy` : p.step === 0 ? `sale stays ${fmt.money(p.sale)}` : `sale ${signedMoney(p.step)}`})`}`,
  /** …the first night waiting costs: a move it puts out of reach (this GW's or a later GW's) is the call to act before
   *  it (its UK time and the viewer's), in short sentences; money only is a fact (B25: "Make it before tonight" in
   *  amber over £0.1m that blocked nothing). */
  watchAct: (x) => {
    const lead = `${x.before ? `Waiting past ${x.before} costs nothing. ` : ''}`;
    const make = `${lead}Make ${x.n > 1 ? 'these transfers' : 'it'} before ${x.ref} (${x.clock}). Waiting costs ${fmt.money(x.w)} and`;
    if (x.verdict === 'thisMove') return `${make} leaves you ${fmt.money(x.short)} short. ${x.buys} would be out of reach.`;
    if (x.verdict === 'laterMove') return `${make} GW${x.gw}'s ${x.later} would be ${fmt.money(x.short)} short.`;
    return `${lead}Waiting past ${x.ref} costs ${fmt.money(x.w)}${x.allOk ? '; your moves still fit' : ''}.`;
  },
  /** …the same verdict in one short line, for the week line's second line (ahead.renderLine; the
   *  design review, 2026-10-13: the foot's whole sentence, cut to one line, could read "costs nothing" in amber): the call
   *  to act, what waiting costs, or what it gains. */
  watchShort: (x) => (x.verdict === 'thisMove' || x.verdict === 'laterMove' ? `Make ${x.n > 1 ? 'them' : 'it'} before ${x.ref}`
    : x.w > EPS ? `Waiting past ${x.ref} costs ${fmt.money(x.w)}` : `No rush: waiting gains ${fmt.money(-x.w)}`),
  /** …no night costs: waiting gains money (a sale that rises, a buy that drops), or changes nothing a move costs. */
  watchGain: (w, ref) => `No rush: waiting past ${ref} gains ${fmt.money(w)}.`,
  watchFree: (n) => `No cost to wait: the price changes leave ${n > 1 ? 'these transfers' : 'this transfer'} as it is.`,
  /** …how old FPL's reading is, the line's quiet tail (the user, 2026-10-11: four lines for one fact; FPL refreshes it
   *  about every 15 minutes, the server reads it every 30, every 10 in the 3 h before a change: the bundle's prices
   *  block and meta.prices_as_of, else the snapshot's); "early" when read 8 h or more before the change. */
  watchNote: (asOf, old) => `as of ${asOf}${old ? ', early' : ''}`,
  /** …put away until its verdict changes (B139: it nagged until the night passed), and the morning after its night
   *  (priceMorning): what the night did to the counted players' prices and GW A's bank. Review 5 (2026-10-12): the button
   *  says what it does, "Hide" (its spoken label's verb); "Waiting" read as the app's state. */
  watchWait: 'Hide',
  /** Add a player's row for one of week g's squad (sheets/wish.js): "In your team" when he is in your FPL team now, else
   *  only the plan buys him by then (review 5, 2026-10-12: "In your team" claimed a buy not made yet). */
  inYours: (inTeam, gw) => (inTeam ? 'In your team' : `In your GW${gw} plan`),
  /** GW A's countdown as VoiceOver says it (review 5, 2026-10-12: "5d 17h" was read letter by letter; ahead.deadlineInfo's
   *  `said`): its two largest parts in words, the visible text unchanged (B37). */
  leftSaid: (d, hr, m, s) => `${d ? `${plural(d, 'day')} ${plural(hr, 'hour')}` : hr ? `${plural(hr, 'hour')} ${plural(m, 'minute')}` : `${plural(m, 'minute')} ${plural(s, 'second')}`} left`,
  watchWaitSaid: 'Hide the price watch until it changes',
  watchMorning: (moved, gw, bank) => (!moved.length ? 'Prices held overnight'
    : `${andList(moved.map((x, i) => `${x.name} ${x.t > 0 ? 'rose' : 'dropped'}${i ? '' : ' overnight'} (${signedMoney(x.t)})`))}${bank == null ? ''
      : bank < -EPS ? `: ${fmt.money(-bank)} short now` : `: your GW${gw} moves still fit`}`),
  /** An older plan's frozen week as plan memory still reads one (Freeze is gone, 2026-10-12: normalizeAccepted thaws
   *  them, so it is never said). */
  frozenEdit: (gw, at = null) => `GW${gw} is frozen${at ? ` (${at})` : ''}.`,
  /** You → Reset plan (ahead.resetPlan): the toast, with Undo. */
  planReset: 'Plan reset: your team as it is, no rules or transfers of yours.',
  /** The pitch's Reset plan pill (the user, 2026-10-21: "maybe place it small on pitch"), as VoiceOver names it: what
   *  ahead.resetPlan resets (memory.reset: your document as a new team's, You → Hits with it; this browser's later
   *  lineups). */
  planResetSaid: 'Reset plan: take off every transfer, chip, rule and lineup of yours, and set Hits back to its default',
  /** Back after FORGET_MS away: signed out, its choices gone (app.js signOut away). */
  awaySignedOut: (name) => `Signed out of ${name} after ${AWAY} away; its choices are cleared.`,
  /** The suggested plans' label, once (the Week sheet's plans heading and the pitch's choices' hidden one, ahead.plansHeading,
   *  `lead` plansHead; uppercase by CSS): the rows
   *  come best first once none still checks, said by no tag (the user, 2026-10-13, the books review: "best first" was
   *  untrue while plans checked); the weeks its numbers count, in every week (gws: valuedOver), "Suggested plans ·
   *  GW8–9" (B26: a GW9 gain counts one week, a GW6 gain four); then what its numbers count against (B3, review3 Part 2
   *  §8: a row's baseline was only spoken), `vsPlan` planVs's words ("· vs no transfers", "· vs your plan"; true / false
   *  say "your plan" / "rolling"). Closed, "Suggested plans" alone (the user, 2026-10-13: no count). */
  suggested: (gws = null, vsPlan = null, lead = 'Suggested') => `${lead}${gws?.length ? ` · ${COPY.valuedOver(gws)}` : ''}${vsPlan === null ? '' : ` · vs ${typeof vsPlan === 'string' ? vsPlan : vsPlan ? 'your plan' : 'rolling'}`}`,
  /** The suggested plans (the user, 2026-10-11: "make him to suggest plans, not just players"; decision 6, in every
   *  week; the single-move suggestions, their other buys and the pair row went 2026-10-13): each week's choices
   *  (ahead.plansOf), under "Suggested plans", ranked by their numbers, each against rolling (the Roll row, no number); a row is the week's own moves alone ("GW7 Kayode → Vuskovic",
   *  none: "GW7 roll"; the user, 2026-10-12: no "best after: …" line, the + takes this week only: planTake) and its
   *  number; on the pitch, a place's "⋯ N more" (placeMore) for the choices it has no room for. A choice whose solve failed keeps its row, no number, with why (planFailed:
   *  a failure is asked again soon, review 5, 2026-10-12; a solve that found no plan keeping your rules says so, not
   *  "couldn't check"). */
  plansHead: 'Suggested plans',
  planRoll: (g) => (g == null ? 'Roll' : `GW${g} roll`),
  /** A plan row's + and its Why sheet's button: "Take GW7 Scott → Dewsbury-Hall" (its week alone: ahead.planTake). */
  planTake: (head) => `Take ${head}`,
  /** …the Why sheet's button as shown (podmajersky r7 §10: "Take GW8 Saka → Palmer" wrapped under a title naming both;
   *  its spoken label stays planTake's). */
  takeIt: 'Take it',
  /** …its toast's action before Undo (ahead.addPlan, every way a choice is taken; the user, 2026-10-21: fix all
   *  (first-use proposal #2): Sam and Dana tapped the card behind to read it, and it made the transfer): the transfer's
   *  Why sheet, as a tap on his IN card opens it. */
  whyAct: 'Why',
  /** In a week with transfers of yours a plan row draws only what it adds, then what its + takes back of yours (review
   *  5, 2026-10-12): "GW7 Scott → Dewsbury-Hall instead of Scott → Xhaka", "GW7 roll instead of Scott → Xhaka"; one that
   *  only drops some, "GW7 without Saka → Palmer". */
  planInsteadOf: (moves) => `instead of ${moves}`,
  planWithout: (moves) => `without ${moves}`,
  /** Why a plan's moves go together, read off its solved road (ahead.openPlanWhy; design 1026e "line"): "Neto's sale
   *  makes room: Palmer is your 3rd CHE player". */
  planRoom: (sold, buy, n, club) => `${sold}'s sale makes room: ${buy} is your ${fmt.ordinal(n)} ${club} player`,
  planFailed: (why) => ({ offline: "can't check it offline", nofit: 'Forkcast found no plan that keeps your other weeks', infeasible: 'no plan keeps your rules with it' }[why]
    ?? "Forkcast couldn't check it, trying again soon"),
  /** A choice whose solve failed, under its card in a player's place (the Week sheet's row says planFailed in full). */
  planFailedShort: (why) => ({ offline: 'offline', nofit: 'no plan fits', infeasible: 'breaks your rules' }[why] ?? "couldn't check"),
  /** The card behind (ahead.renderDecks; the user, 2026-10-20: "make palmer wait behind saka with others"): a pair's second
   *  tab, a player's place (its stack's label, the header over his own card, its notes, its bar), the week's Roll locked
   *  beside the goal. A choice of several moves lit on several tabs: each tab its part mark, "1/3" (the main, before its
   *  number), "2/3", "3/3" (the user, 2026-10-22: "these shirt labels with words 'with' confusing", decided: part marks),
   *  read "part 2 of a 3-transfer plan, +5.8 points vs rolling", never as that one player's sale. */
  placeOf: (name) => `Replace ${name}`,
  /** The marks on the pitch (ahead.renderDecks; the user, 2026-10-23: "these + points or round 2 / 3 confusing - i cant
   *  see which transfer best"; forkcast/design_marks/DECISION.md, design.md §4): a take's words, "Swap", "Swap both",
   *  "Swap all 3", spoken now by a place's card ("Swap both: …", swapSaid; the pitch's plates take nothing since the
   *  owner, 2026-10-25, after v1.3.79: "no need green 'swap' in preview"); a move said "Kayode out, Truffert in"; the
   *  best plate's label, "Best this week: …"; a plan's tag in another row, never its number twice; a place's first
   *  choice's plate where nothing there beats rolling, or your plan in a week of yours (placeNoneSaid's `vs`: decision
   *  K; no ⇄ handle since the same day). */
  swapGo: (n) => (n > 2 ? `Swap all ${n}` : n === 2 ? 'Swap both' : 'Swap'),
  /** A plan's plate over its sellers in one row, the buys of its sellers in other rows counted (the owner, 2026-10-25:
   *  "Rice & 2 more +5.0 xP Swap all 3"; each of those keeps his ring and his tag). */
  planMore: (n) => `& ${n} more`,
  swapSaid: (pairs, num = null) => `${COPY.swapGo(pairs.length)}: ${pairs.map(([o, i]) => `${o} for ${i}`).join(', ')}${num ? `, ${num}` : ''}`,
  moveSaid: (out, inn) => `${out} out, ${inn} in`,
  // (`move`: the best move beside a chip's token, the week's best: never two "Best this week"; the owner, 2026-10-25,
  // "fix so chips not interfer in ths behaviour")
  bestSaid: (moves, num, move = false) => `Best ${move ? 'move ' : ''}this week: ${moves.length > 1 ? `${moves.length} transfers, ${num}: ${moves.join('; ')}` : `${moves[0]}, ${num}`}`,
  partSaid: (mine, others, move = false) => `Part of the best ${move ? 'move ' : ''}this week: ${mine}${others.length ? `, with ${others.join('; ')}` : ''}`,
  placeNoneSaid: (name, n, vs = null) => `${name}: ${plural(n, 'choice')} for his place, none better than ${vs ?? 'rolling'}. Shows ${n === 1 ? 'it' : 'them'}`,
  placeSwap: 'Swap',
  /** The week's best move as a token beside the goal, first in its stack (ahead.tokensOf; the owner, 2026-10-26: "Ink
   *  token, top of stack"): "Evanilson +1.6" (no "Best:" since "yes do both"), said "Best move this week: …, shows his
   *  choices". */
  showsChoices: 'shows his choices',
  /** …a multi-move best's plate (design 1026e "line"): it opens that plan's Why sheet, whose one button takes it. */
  showsWhy: 'Shows why',
  bestSwaps: 'swaps him in',
  /** A buy of yours's plate (ahead.swapPlate; the owner, 2026-10-26: "i bough justin but where is no tab on his head so i
   *  can keep prebious player"): the player you sold, said "Keep Gabriel, not Justin, +0.8 points vs your plan". */
  keepSoldSaid: (sold, buy) => `Keep ${sold}, not ${buy}`,
  rollingBest: 'Rolling is best',
  /** A pair card's note, its other moves (ahead.noteOf; the user, 2026-10-22: "+ Gvardiol → …" began with the take's
   *  glyph): "also Semenyo → Palmer, Cunha → Rice". */
  placeAlso: (moves) => `also ${moves.join(', ')}`,
  placeChoices: (n) => `${plural(n, 'choice')} for his place ›`,
  placeInstead: 'What could go there instead ›',
  placeSaid: (name, n, best) => `${name}: ${plural(n, 'choice')} for his place${best ? `, best ${best}` : ''}. Shows them`,
  placeNow: 'Now',
  placeYours: 'Yours',
  placeRemove: 'Remove',
  placeKeep: 'Keep',
  /** The veto on the card of a player you don't have (sheets/player.js ruledSeg; the user, 2026-10-22: "Force out" for a
   *  player you can't sell), "Not", as the rule chip ("Not Groß · GW8") and the swipe say it. */
  notHim: 'Not him',
  placeKeepSaid: (name, g) => `Keep ${name} in GW${g}: no transfer sells him`,
  /** A Keep that leaves your plan as it is (ahead.keep), from his place or his card's Force keep alike, whichever Keep
   *  of his it remakes (the user, 2026-10-21: fix the known issues: "Gabriel kept in GW8 · 0.0 pts" after GW8–11): what
   *  it changed, the suggestions (the first-use findings, 2026-10-21: "your plan keeps him already", right after a
   *  suggestion sold him, read as a keep that did nothing). */
  keptFromChoices: (name, when) => `${name} kept${when}: suggestions won't sell him`,
  keepIn: (name, g) => `Keep ${name} in GW${g}`,
  placeRemoveSaid: (out, inn) => `Remove ${out} to ${inn} from your plan`,
  placeCantCheck: "can't check",
  /** A move of a pair the week can't make alone (ahead.plansOf `needs`; the user, 2026-10-21, on GW9's "De Cuyper → Hill
   *  + Kayode → …": "why it not suggests de cuyper to hill as a separate transfer - and only in combination?"): the
   *  pair's sales that make it fit, "needs Kayode's sale" (its card's note in his place; its Week sheet row and spoken
   *  line after what it lacks alone, ahead.problemShort's "£1.2m short"). */
  needsSale: (names) => `needs ${andList(names.map((n) => `${n}'s`))} ${names.length > 1 ? 'sales' : 'sale'}`,
  placeNth: (n) => `a ${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 > 3 ? 0 : n % 10]} transfer`,
  placeMore: (n) => `⋯ ${n} more`,
  /** A place's last slot (ahead.drawPlace; the owner, 2026-10-27: "one slot be left for 'other'"): Bring in… at his
   *  position, for a player its cards don't offer. */
  placeOther: 'Other…',
  placeOtherSaid: (name, gw) => `Other players for ${name}'s place: Bring in… in GW${gw}`,
  placeAll: (n) => `All ${n}`,
  placeAt: (i, n) => `${i} of ${n}`,
  /** …its bar's second line: what its numbers are, "Gain vs rolling · GW8–11" (the user, 2026-10-22: one baseline phrase;
   *  was "numbers: gain over rolling, GW8–11"); while what they count against
   *  is still checked (ahead.plansVs null), its weeks alone. */
  placeNumbers: (vs, gws) => `${vs ? `Gain vs ${vs} · ` : ''}${span(gws)}`,
  /** Your Roll, the week's status beside the goal (ahead.emptyHead, statusTok), alone: no "until you take a move" under
   *  it (the first-use run, 2026-10-21, "Why is it still dangling Silva in front of me?", had it say a move's Swap takes
   *  the Roll back; the owner, 2026-10-26: "remove 'until you take a move'"). */
  rollingOn: 'Rolling ✓',
  /** The week's status beside the goal (ahead.statusTok; the owner, 2026-10-26, of "Rolling": "why need button
   *  'rolling' here if nothing happens if click it"): its words, then where its tap goes, "Rolling; opens GW9
   *  transfers" (the strip under the GW tiles says the facts alone: the week said once). */
  statusSaid: (said, g) => `${said}; opens ${COPY.weekTitle(g)}`,
  /** The Roll row's Why sheet in a week you roll (ahead.openPlanWhy; the first-use run, 2026-10-21: "Take GW8 roll" beside
   *  "No transfers yet"): nothing to take, so no Take there (the user, 2026-10-22: "+" offered only where it would change
   *  something). */
  rollAlready: (g) => `Your plan makes no transfer in GW${g} already`,
  /** A roll's Why sheet (ahead.openPlanWhy; the user, 2026-10-22): the free transfers rolling leads to, "4 FT in GW9"
   *  (rollKeeps), at FPL's cap (engine.nextFt adds none) that it adds none. */
  rollCapped: (ft, gw) => `${ft} FT already, the most: rolling adds none in GW${gw}`,
  /** A move's Why sheet: the next GW's free transfers in the plan you have, then without the move (ahead.whyFacts, read
   *  as its bank line is; the user, 2026-10-22: "GW9: 3 FT, not 4" while the plan had 1 FT there). */
  /** …the sub of a move's Why sheet in a week of two or more transfers, which has no number of its own (the week's is on
   *  its line: the user, 2026-10-22, "No row numbers"). */
  whyOneOf: (gw, n) => `GW${gw} · one of ${n} transfers: the week's number is on its line`,
  ftWithout: (gw, ft, without, n = 1) => `GW${gw}: ${ft} FT (${without} without ${n > 1 ? `these ${n} transfers` : 'this transfer'})`,
  /** …on the pitch the week's status beside the goal (ahead.emptyHead, statusTok), its Week sheet row with no + either. */
  rollingNow: 'Rolling',
  /** A lineup of yours that leaves a suggested buy on your bench (the buy takes the slot of the player he replaces:
   *  ahead.asTaken, ahead.benchedBuys), said in the lineup edit's toast and in his place's bar (the user, 2026-10-22:
   *  saved-lineup moves are explained, not changed): "Palmer would start on your bench". */
  onYourBench: (names) => `${andList(names)} would start on your bench`,
  /** …and a Wildcard or Free Hit it lowers or takes off the pitch (its squad played in your lineup's places). */
  chipLineup: (chip, g) => `${chip} counted with your GW${g} lineup`,
  /** What a plan counts against, said on its heading, row and Why sheet ("· vs no transfers": your team as it is, every
   *  week rolled; never "rolling, no later transfer", which read as the plan's own; N9, the plans review 2026-10-11:
   *  "· vs your plan" once your plan has a transfer in any week, kept by every plan), and its Why sheet's two sides. */
  planVs: (mine = false) => (mine ? 'your plan' : 'no transfers'),
  /** Under the hold a plan counts against rolling, Forkcast's best moves after it on both sides (ahead.plansOf; the user,
   *  2026-10-19: "Gain over rolling"): its row, heading and Why sheet say so; the Roll row is what they count against
   *  (spoken, no number); a +'s toast says no number (the owner, 2026-10-27, of "−0.8 vs your plan": "remove this 'vs
   *  ..' message from black tab appearing"; its row has it), nor a × that rolls the week again (ahead.removeMove); what
   *  your total moves by is the header's change, and the Why sheet says it where that differs (planAdds, totalMoved). */
  planVsRoll: 'rolling',
  planRefSaid: 'what the plans count against',
  vsRolling: (delta) => COPY.pointsVs(delta, COPY.planVsRoll),
  /** A number and what it counts against, "+1.6 vs rolling"; in a week with a transfer, Wildcard or Free Hit of yours
   *  "−0.2 vs your plan" (decision K, the owner, 2026-10-25: "compare + poitns not to rolling now but to transfer made";
   *  ahead.choiceVs). */
  pointsVs: (delta, vs) => `${pts(delta)} vs ${vs}`,
  planAdds: (delta) => `Your total: ${pts(delta)} when you take it`,
  /** A taken move's Why sheet (ahead.openWhy), under its number vs rolling where your total moved by another amount: what
   *  that total counts it against, in the plans' own words (planVs: "no transfers", "your plan"; the owner, 2026-10-26:
   *  "what means +1.6 vs rolling but total +5.1"). One line: the take's toast says the number alone. */
  totalMoved: (delta, mine = false) => `Your total moved ${pts(delta)}: vs ${mine ? 'your plan without it' : COPY.planVs(false)}, not vs rolling`,
  /** A choice's Why sheet, what its number counts after its week (ahead.countedAfter; the user, 2026-10-21: fix all
   *  (first-use proposal #3)): its head, the roll's plan named, and a plan's line, "Rolling: GW9 Saka → Palmer · GW11
   *  Rice → Wirtz" (its weeks in words: ahead.planWeeks), one that makes no later move "no transfers". */
  countedAfter: (g) => `Counted after GW${g}`,
  countedRoll: 'Rolling',
  countedLine: (name, weeks) => `${name}: ${weeks.length ? weeks.join(' · ') : 'no transfers'}`,
  /** A Wildcard or Free Hit choice's Why sheet, its changes (ahead.squadChanges, proposal #7): a player a Keep of yours
   *  holds in its squad. */
  keptRule: 'kept: your rule',
  /** A plan row's + in your Wildcard or Free Hit week whose choice plays none (the user, 2026-10-13): the chip off. */
  chipTakenOff: (chip, gw) => `${chip} in GW${gw} taken off`,
  /** The week line's words (ahead.renderLine; the pitch research's step 3, the user 2026-10-19: one line above the pitch,
   *  your transfers on it as IN cards): how many more notices than the one it shows; GW A under way (the head every live
   *  sentence starts with); your week's transfers, "1 transfer" over "Out: Saka" (the players the pitch no longer
   *  shows); its sheet's title, "GW8 transfers" (the week line's own label). */
  moreNotices: (n) => ` · +${n}`,
  /** GW A's lineup on the pitch where it differs from the one set in FPL (ahead.fplSets; the user, 2026-10-21: fix all
   *  (first-use proposal #4)): the week line's notice names whom to start (whom to bench when none starts: setsSaid),
   *  advice as approved; its Week sheet row only what is true (the review of the first-use proposals, 2026-10-21: FPL's
   *  team is the last deadline's, so a lineup set in FPL since reads as not done), the GW that team is for, what it
   *  did and every change that makes this pitch of it, a step a line (setsRow): "Your FPL team for GW7 benched Justin and
   *  Barry. To match this pitch in FPL:" over "Start Justin for Gvardiol", "Captain: Saka"; the week line its one change,
   *  else how many ("Set in FPL: 3 changes"; the user, 2026-10-22: it named the first of three). */
  setInFpl: (sets) => { const n = setsRow(sets)[1].length; return `Set in FPL: ${n > 1 ? COPY.nChanges(n) : setsSaid(sets)}`; },
  /** …→ [lead, [step]]: the row's sentence and its steps (ahead.noteRow draws them a line each). */
  setInFplRow: (sets) => {
    const [had, steps] = setsRow(sets);
    return [`Your FPL team${sets.gw ? ` for GW${sets.gw}` : ''} ${had ?? 'differs from this pitch'}. To match this pitch in FPL:`, steps];
  },
  liveHead: (gw) => `GW${gw} is live`,
  nTransfers: (n) => plural(n, 'transfer'),
  /** A take's toast where the week keeps transfers of yours beside its own (ahead.addPlan): the week's count its number
   *  belongs to, "3 transfers in GW8". */
  weekTransfers: (n, gw) => `${plural(n, 'transfer')} in GW${gw}`,
  outNames: (names) => `Out: ${names.join(', ')}`,
  // (johnson r7 §3: "plan" named the week, the suggestions, the whole and the horizon)
  weekTitle: (gw) => `GW${gw} transfers`,
  rulesHead: 'Your rules',
  /** A player's name in a Why sheet's comparison, said as what it opens. */
  cardOf: (name) => `${name}'s card`,
  /** A suggested plan while it is solved (B17; ahead.plansOf's wait, on its row): no number guessed, only what it waits
   *  for: "checking…" its own solve (also the week line's while its transfers' plans solve), "waiting" the slot (a sheet's solve, a
   *  refused ask), "waiting for your edit's check" (review 5, 2026-10-12: "after your edit" read as advice to make the
   *  move later). */
  pairChecking: 'checking…',
  pairWaiting: 'waiting',
  pairAfterEdit: 'waiting for your edit\'s check',
  frozenStays: (gws, end) => `${span(gws)} ${gws.length > 1 ? 'are' : 'is'} frozen, so your plan stays${gws.at(-1) < end ? `: the new forecast re-plans GW${gws.at(-1) + 1} on` : ''}.`,
  /** B2, a new GW's one notice (memory.carryOver, said once by Ahead): what the last GW's plan handed on (your rules as
   *  their chips); '' with none. */
  carried: (from, what) => (what.length ? `Carried over from GW${from}: ${what.join(', ')}.` : ''),
  /** B118: in a sentence the whole number, to the thousand ("≈" says it is rounded; a rate under 1,000, at the top
   *  ranks, as it is, never "0 places"): "At your rank, 1 pt ≈ 80,000 places (GW5 standings)." */
  exchange: (placesPerPt, source) => `At your rank, 1 pt ≈ ${fmt.int(Math.abs(placesPerPt) >= 1e3 ? Math.round(placesPerPt / 1e3) * 1e3 : placesPerPt)} places (${source}).`,
  /** The line every GW (the user, 2026-10-21: "just saying rank still achieved by manager at your rank this gw last
   *  season"; "just every gameweek"; "why not it show 29th … and show 99th instead - fix"): the bundle's rank.cheer
   *  (api/cheer.py: {gw, rank, best, at}, last season's best final rank among the managers ranked at or below yours
   *  after the same GW, `at` that manager's rank then), ranks as the You sheet's tile has them, as the toast
   *  (ahead.sayCheer) and the You row (sheets/you.js) say it: "Last season a manager ranked 1.80M after GW7, below your
   *  1.30M, finished 29th."; "just below you" where the two read alike. */
  cheerLine: (c) => {
    const at = rankShort(c.at ?? c.rank), mine = rankShort(c.rank);
    return `Last season a manager ranked ${at} after GW${c.gw}, ${at === mine ? 'just below you' : `below your ${mine}`}, finished ${rankOrd(c.best)}.`;
  },
  /** While it plans (waitFacts; the owner, 2026-10-27: "more catching … so user can read it while his plan is loading"):
   *  two true lines about you, each [before, its number, after] (the number bold: the eye's landing). Your rank before
   *  and after the last GW FPL has checked: "GW8 took you from 1.30M to **670K** overall."; the line every GW in 11
   *  words: "Last season a manager ranked below you after GW8 finished **29th**." ("like you" where the two ranks read
   *  alike). */
  factMove: (gw, from, to) => (rankShort(from) === rankShort(to) ? [`GW${gw} kept you at `, rankShort(to), ' overall.']
    : [`GW${gw} took you from ${rankShort(from)} to `, rankShort(to), ' overall.']),
  factRank: (c) => [`Last season a manager ranked ${rankShort(c.at ?? c.rank) === rankShort(c.rank) ? 'like' : 'below'} you after GW${c.gw} finished `, rankOrd(c.best), '.'],
  /** F15b: what the points on screen are (the bundle's meta.scale {k, k_h, seasons}: the plan service puts every
   *  forecast number on the real-points scale, by horizon when k_h is there; a hit is FPL's −4 as it is). */
  realScale: (s) => {
    const lo = Math.min(...s.seasons), hi = Math.max(...s.seasons);
    const kh = Array.isArray(s.k_h) && s.k_h.length > 1 ? s.k_h.map(Number) : null;
    const x = (k) => `×${k.toFixed(2)}`, n = kh ? kh.length - 1 : 0;
    const by = kh ? `${x(kh[0])} this week up to ${x(kh[n])} ${WORDS[n] ?? n} week${n === 1 ? '' : 's'} ahead` : x(Number(s.k));
    return `Points shown ≈ real points: the forecast ${by} (actual per forecast point, ${lo === hi ? lo : `${lo}–${hi}`}).`;
  },
  forecastEdge: (gw) => `The forecast stops at GW${gw}.`,
  /** A10: the quiet note while the plan on screen is a saved copy (the server away). */
  offline: (time) => `Offline · data from ${time}`,
  updating: 'The forecast is updating. Your plan refreshes in a minute.',
  replanning: (time) => `New forecast: re-planning. Showing your ${time} plan.`,
  preseason: 'No deadline coming up. Plans start before GW1.',
  // B68: GW A under way says only what is true: what FPL published against your plan (liveCheck), or the next plan,
  // which starts the moment FPL publishes your GW A team (api/mobile.py live_week: the bundle moves to GW A+1)
  live: (gw) => `${COPY.liveHead(gw)}. Forkcast plans from GW${gw + 1} once FPL publishes your GW${gw} team.`,
  liveMatch: (gw) => `${COPY.liveHead(gw)}. Your FPL team matches your plan.`,
  liveDiff: (gw, fpl, plan) => `${COPY.liveHead(gw)}. FPL has ${andList(fpl)} where your plan had ${andList(plan)}.`,
});

/** B68: GW A under way, the 15 FPL published for it (the bundle's entry.published: mobile.py _published, never the
 *  entry's own picks) against GW A's week as the plan has it (a ViewWeek), squad only (start / bench and the armband
 *  are spoken only, the tags stay removed: 2026-10-09): the same 15, FPL's players the plan hasn't paired by position
 *  with the plan's (engine.pairMoves), or COPY.live while FPL has published none (once FPL publishes them the bundle
 *  plans from the GW after: api/mobile.py live_week). */
export function liveCheck(published, week, L) {
  const fpl = published?.gw === week.gw ? ids([...(published.xi || []), ...(published.bench || [])]) : [];
  if (!fpl.length) return COPY.live(week.gw);
  const pairs = E.pairMoves(week.squad.filter((p) => !fpl.includes(p)), fpl.filter((p) => !week.squad.includes(p)), L);
  if (!pairs.length) return COPY.liveMatch(week.gw);
  const names = (k) => pairs.map((m) => m[k]).filter((p) => p != null).map((p) => L.name(p));
  return COPY.liveDiff(week.gw, names('in'), names('out'));
}

/** The drift's head (F10) in parts, each number beside its own verdict (the drift toast's head: COPY.driftHead):
 *  {gap ("Updated forecast: +2.4 pts vs your plan"), label (its verdict), part ({gap: "+0.5 of it new", label: drift.freshLabel}: the
 *  part that is news, when your own choices make the rest) | null}. */
export function driftHeadOf(delta, label, fresh = null, freshLabel = label, gws = null) {
  const part = fresh !== null && Math.abs(fresh - delta) >= 0.05;
  return { gap: `Updated forecast: ${pts(delta)} pts${gws?.length ? ` over ${span(gws)}` : ''} vs your plan`, label, part: part ? { gap: `${pts(fresh)} of it new`, label: freshLabel } : null };
}

// ---------------------------------------------------------------- inputs

/**
 * GET /api/m/bundle data → ctx (the engine's base / players / seeds plus the roads and noise). Pass
 * app.js's derived `data` ({base, players, seeds, noise, gw, horizon}) to reuse it as is.
 */
export function planInputs(bundle, data) {
  if (!bundle) return null;
  const meta = bundle.meta || {}, entry = bundle.entry || {};
  const A = num(meta.gw ?? meta.next_gw);
  const rest = { meta, roads: bundle.roads || {}, bake: bundle.bake || null, rank: bundle.rank || null };
  if (data?.base && data?.players) {
    return {
      ...rest, A, gws: ids(data.horizon).length ? ids(data.horizon) : ids(meta.horizon), base: data.base, players: data.players,
      seeds: E.decodeSeeds(data.seeds ?? bundle.seeds), noise: num(data.noise) ?? E.noiseFloor(meta, A) ?? 0,
    };
  }
  const cols = shownPlayers(bundle) || {};
  const width = (Array.isArray(cols.players) ? cols.players[0]?.xp : cols.rows?.[0]?.[(cols.fields || []).indexOf('xp')])?.length ?? 5;
  const horizon = ids(cols.horizon).length ? ids(cols.horizon)
    : ids(bundle.seeds?.gws).length ? ids(bundle.seeds.gws) : Array.from({ length: width }, (_, i) => A + i);
  const players = { ...cols, horizon };
  const base = {
    season: num(meta.season), entry_id: num(entry.id ?? entry.entry_id), gw: A, next_gw: A,
    bank: num(entry.bank) ?? 0, ft: num(entry.ft) ?? E.FT_WEEKLY, chips_available: entry.chips_available || [],
    chips_used: entry.chips_used || [], horizon, squad: entry.squad || [],
  };
  return {
    ...rest, A, gws: ids(meta.horizon).length ? ids(meta.horizon) : E.planGws(base, 4), base, players,
    seeds: E.decodeSeeds(bundle.seeds), noise: E.noiseFloor(meta, A) ?? 0,
  };
}

// ---------------------------------------------------------------- the one measure, and the planner's count

/** The one measure for a gap between two plans (engine.compareRoads): forecast points minus hits over the GWs both
 *  cover, what you score, labelled by the pooled delta against the noise floor. The planner's own terms (its
 *  per-transfer charge, banked transfers, bench cover) are not in it: plannerOf has them. ctx: planInputs. */
export const compare = (ctx, a, b) => E.compareRoads(a, b, { seeds: ctx.seeds, noise: ctx.noise, xp: lookupOf(ctx).xp, ref: E.anchorRef(ctx.meta?.scale?.k_h, ctx.A) });

/** Transfers a plan makes over its weeks (a Road's buys, a GwState's or view week's moves). */
export const transfersOf = (plan) => (plan?.weeks ?? plan?.gws ?? []).reduce((n, w) => n + (w.moves ?? w.bought ?? w.in ?? []).length, 0);
/** Hits a plan takes over its weeks (a Road's, a GwState's or view week's). */
export const hitsOf = (plan) => (plan?.weeks ?? plan?.gws ?? []).reduce((n, w) => n + (num(w.hits) ?? 0), 0);

/**
 * The planner's own count (engine.objectiveOf) of plan a against plan b: {delta, ref (delta with each round back on the
 * anchor's scale, objectiveOf atAnchor: what a label reads, F15b by horizon), terms {term: Δ}, hits {gap (a's hits
 * the points charge beyond its count, less b's: hitGap), a, b (unpricedHits)}} | null when either is not a road the
 * solver gave (a phone estimate, an older stored plan). Both must be solved on the same data for
 * the count to compare like with like: the caller checks that (Ahead: the plan's roads version).
 */
export function plannerOf(a, b) {
  const oa = E.objectiveOf(a), ob = E.objectiveOf(b);
  if (!oa || !ob) return null;
  const terms = {};
  for (const k of new Set([...Object.keys(oa.terms), ...Object.keys(ob.terms)])) if (!SLACK.includes(k)) terms[k] = (oa.terms[k] ?? 0) - (ob.terms[k] ?? 0);
  // two roads of the same data are on one scale: a plan stored before plan memory kept its k_h reads its partner's
  const onScale = (r, o) => (r && !Array.isArray(r.k_h) && Array.isArray(o?.k_h) ? { ...r, k_h: o.k_h } : r);
  const ra = E.objectiveOf(onScale(a, b), { atAnchor: true }).terms, rb = E.objectiveOf(onScale(b, a), { atAnchor: true }).terms;
  return {
    delta: Object.values(terms).reduce((s, x) => s + x, 0), terms,
    ref: Object.keys(terms).reduce((s, k) => s + (ra[k] ?? 0) - (rb[k] ?? 0), 0),
    hits: { gap: hitGap(a) - hitGap(b), a: unpricedHits(a), b: unpricedHits(b), n: hitsOf(a) - hitsOf(b) },
  };
}

/** What a solved road's hits cost in points (HIT_COST a hit: what compare counts) beyond what its planner's count
 *  charged for them (its objective's hit term, −hit_cost a hit: solve.py add_ft): FPL's 4 less the planner's price where
 *  it priced them (F17: the solver's own, the bundle's meta.hit_charge on the shown scale: above 4 once ×k), all 4 where
 *  it never counted them (memory.forcedHits: a hit no planner hit covers). */
const hitGap = (road) => (road?.weeks || []).reduce((s, w) => s + E.HIT_COST * (num(w.hits) ?? 0) + (num(road.objective?.hit?.[w.gw]) ?? 0), 0);
/**
 * A solved road's hits, FPL's against its planner's, matched over the window (F15a; since the solver spends every free
 * transfer before a hit, solve.py add_ft hit_ok, the two agree GW by GW, and a road that parts says where: README
 * Notes) → [{gw, hits (FPL's: the Team's), lp (the planner's), from [{gw, hits}] (FPL's hits here the planner booked in
 * another GW), to [{gw, hits}] (the planner's hits here FPL books in another GW), unpriced (FPL's hits here no hit of the
 * planner's covers)}] | null (a road without its planner's count). The planner's per GW is the
 * plan service's road.planner.hits (api/mobile.py with_planner: its hit term over the price it charged); a road stored
 * before it reads one hit at least wherever its count charged one. Each FPL hit no planner hit of its own GW covers
 * takes the nearest one of another GW (the earlier on a tie).
 */
export function hitBook(road) {
  if (!road?.objective || !road.weeks?.length) return null;
  const own = road.planner?.hits;
  const weeks = road.weeks.map((w) => {
    const g = Number(w.gw), hits = num(w.hits) ?? 0;
    const lp = own ? num(own[g]) ?? 0 : (num(road.objective.hit?.[g]) ?? 0) < -EPS ? Math.max(hits, 1) : 0;
    return { gw: g, hits, lp, from: [], to: [], unpriced: 0 };
  }).sort((a, b) => a.gw - b.gw);
  const spare = weeks.flatMap((w) => Array(Math.max(0, w.lp - w.hits)).fill(w));
  const add = (list, gw) => { const x = list.find((y) => y.gw === gw); if (x) x.hits += 1; else list.push({ gw, hits: 1 }); };
  for (const w of weeks) {
    for (let i = w.lp; i < w.hits; i++) {
      const j = spare.reduce((b, s, k) => (b < 0 || Math.abs(s.gw - w.gw) < Math.abs(spare[b].gw - w.gw) ? k : b), -1);
      if (j < 0) { w.unpriced += 1; continue; }
      const [s] = spare.splice(j, 1);
      add(w.from, s.gw);
      add(s.to, w.gw);
    }
  }
  return weeks;
}
/** The weeks of a solved road whose hits its planner's count has no charge for: [{gw, hits}] (hitBook's unpriced). */
const unpricedHits = (road) => (hitBook(road) || []).filter((w) => w.unpriced > 0).map((w) => ({ gw: w.gw, hits: w.unpriced }));
/** Objective terms that are no plan's merit, left out of the planner's count: ft_short, a slack an older solver paid
 *  (−10000 a unit) in the round after a Free Hit (QA-5: 383130's Free Hit in GW6 pre-solves carried one). solve.py add_ft
 *  rolls free transfers on from the round before since, and has no such term; a road stored before keeps it out. */
const SLACK = ['ft_short'];

const LEVEL = 0.005;  // the planner's count rounds to 0.00: level whatever the noise (above it, level is the coin band)
const CROWD = ['eo', 'own_cal', 'cap_top', 'cap_tie'];

/** What the planner's count has and the points don't, signed the planner's way `dir`, biggest first: [[part, Δ]]. */
function reasonParts(planner, dir) {
  const t = planner?.terms || {};
  const hg = planner?.hits ?? { gap: 0, a: [], b: [] };
  const crowd = CROWD.reduce((x, k) => x + (t[k] ?? 0), 0);
  return [['ft_cost', t.ft_cost ?? 0], ['ft_value', t.ft_value ?? 0], ['bench', t.bench ?? 0], ['hit', hg.gap], ['crowd', crowd]]
    .filter(([, v]) => Math.sign(v) === dir && Math.abs(v) >= LEVEL).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
}

/** The hits behind the planner's way `dir` that its count never charged (plannerOf's hits), in words ("a −4 in GW8"), or
 *  '': the planner rates a better (dir > 0) for hits of a's it never counted, or worse for b's. */
function unpricedWhere(planner, dir) {
  const hg = planner?.hits ?? { a: [], b: [] };
  const [own, other] = dir > 0 ? [hg.a, hg.b] : [hg.b, hg.a];
  return forcedNew(own, other).map((x) => `${hitsWords(x.hits)} in GW${x.gw}`).join(' and ');
}

/**
 * Why the planner's count parts from the points (the biggest of what one counts and the other doesn't, signed the
 * planner's way): a phrase. Its per-transfer charge, banked transfers, bench and crowd terms are the planner's alone; a
 * hit is in both (compare charges HIT_COST, the planner its hit term at the solver's own price, F17) except where the
 * planner never charged one (plannerOf's hits), which the points count and the planner doesn't (QA-6 #2: never "a
 * stronger bench" for a plan the planner rates better because its count left out a −4).
 */
function plannerReason(planner, dTransfers, dir) {
  const k = reasonParts(planner, dir)[0]?.[0] ?? (dTransfers ? 'ft_cost' : null);
  const n = Math.abs(dTransfers);
  if (k === 'ft_cost' && n) return `it uses ${n} ${dTransfers > 0 ? 'more' : 'fewer'} transfer${n === 1 ? '' : 's'}`;
  if (k === 'ft_value' || k === 'ft_cost') return dir < 0 ? 'it keeps fewer free transfers for later weeks' : 'it keeps more free transfers for later weeks';
  if (k === 'bench') return dir < 0 ? 'it leaves a weaker bench' : 'it leaves a stronger bench';
  if (k === 'hit') {
    const where = unpricedWhere(planner, dir);
    if (where) return dir > 0 ? `it takes ${where} that Forkcast didn't plan for` : `the plan before took ${where} that Forkcast didn't plan for`;
    return dir < 0 ? 'it takes a hit' : 'it takes no hit';
  }
  if (k === 'crowd') return dir < 0 ? 'it strays from the crowd (ownership, the captain poll)' : 'it follows the crowd (ownership, the captain poll)';
  return dir < 0 ? 'it costs free transfers or bench strength' : 'it saves free transfers or bench strength';
}

/**
 * A change of plan in words (Ahead's verdict toasts, plan memory's resumed one), in ONE presentation (QA): the number
 * is forecast points minus hits (`cmp`, compare: what you score), and the words never contradict the planner's own
 * count. planner: plannerOf(new, before) when both are solved roads of these data; without it, dir stands in: a rule
 * added ('restrict') can't make the plan better by the planner's count, nor one lifted ('relax') worse. When the points
 * and the planner part, the line says so plainly: "Plan without Xhaka · +0.7 pts · Forkcast rates it worse: it uses 1
 * more transfer". noise: the noise floor (a count the other way inside it is level: engine.verdictLabel's coin band,
 * B39). transfers: [before, after]. gws: the window it covers (A4: said by its GWs, "over GW6–9"; cmp.gws by default).
 * total: the number named as what your total moves by, "total −2.8" (COPY.changeNum: the take and remove toasts).
 */
export function changeText(what, cmp, { dir = null, gws = null, transfers = [0, 0], planner = null, noise = 0, total = false } = {}) {
  let p = planner ? planner.delta : null;
  // a rule added can't beat the plan without it by the planner's count (its optimum), nor a lifted one lose: a
  // count the other way is the solver's tolerance, level
  if (p !== null && ((dir === 'restrict' && p > 0) || (dir === 'relax' && p < 0))) p = 0;
  const sign = p !== null ? (Math.abs(p) < LEVEL ? 0 : Math.sign(p)) : dir === 'restrict' ? -1 : dir === 'relax' ? 1 : null;
  const n = gws ?? cmp.gws;
  const pointsWay = cmp.delta > EPS ? 1 : cmp.delta < -EPS ? -1 : 0;
  if (sign === null || pointsWay === 0 || sign === pointsWay) return COPY.change(what, cmp.delta, cmp.label, n, total);
  const dT = transfers[1] - transfers[0];
  // against the noise floor on the anchor's scale (plannerOf's ref, F15b by horizon), as a label reads it: a count the
  // other way inside it is level, the coin band every "level" is (B39: never "slightly", a second name for it)
  if (sign === 0 || (p !== null && E.verdictLabel(planner.ref ?? p, noise) === 'coin')) return COPY.changeLevel(what, cmp.delta, n, plannerReason(planner, dT, -pointsWay), total);
  // outside it, better or worse; without the planner's count (an estimate: plan memory's resumed toast) only dir is
  // known: a rule added is no better by it, one lifted no worse (B39: never a count it doesn't have)
  return COPY.changeAgainst(what, cmp.delta, n, plannerReason(planner, dT, sign), p === null ? (sign > 0 ? 'no worse' : 'no better') : sign > 0 ? 'better' : 'worse', total);
}

/** The forcedHits entries of `now` that `was` doesn't have (the same GW, the same hits): what a plan brings. */
export const forcedNew = (now = [], was = []) => (now || []).filter((f) => !(was || []).some((x) => x.gw === f.gw && x.hits === f.hits));

/**
 * QA-5 #3: an edit's verdict line with the hits its new plan takes that the rules it was solved under don't allow
 * (memory.forcedHits of the plan after, `now`, that the plan before, `was`, didn't take), said plainly after it: "… The
 * plan takes a −4 in GW8 your rules don't allow (no plan without it)."
 */
export function withForced(line, now = [], was = []) {
  const fresh = forcedNew(now, was);
  if (!fresh.length) return line;
  const t = fresh.map(COPY.hitForbiddenShort).join('; ');
  return `${sentence(line)} ${sentence(t.charAt(0).toUpperCase() + t.slice(1))}`;
}

/**
 * What your rules cost (the "Your rules" strip): the model's road against your plan's road by the planner's count, both
 * solved on these data — never your lineup (a sub or an armband is phone-only and reported on its own). The model's
 * road is the planner's best without your rules, so the cost is ≥ 0 by construction (a solver tolerance below 0 reads
 * 0). → {cost, label (cost against the noise floor), points (your road − the model's in the one measure: what you
 * score), transfers (yours − the model's)} | null when either road has no planner's count.
 */
export function rulesCost(ctx, yours, model) {
  const pl = plannerOf(yours, model);
  if (!pl) return null;
  const cost = Math.max(0, -pl.delta), atA = Math.max(0, -pl.ref);
  return {
    cost: cost < LEVEL ? 0 : cost, label: E.verdictLabel(atA < LEVEL ? 0 : atA, ctx.noise ?? 0), points: compare(ctx, yours, model).delta,
    transfers: transfersOf(yours) - transfersOf(model), planner: pl,
  };
}

// ---------------------------------------------------------------- the armband

/** GW `week.gw`'s lineup as a one-week road, `lu` ({captain}, a sub's {xi, bench, captain}) over it: a lineup gap moves
 *  the lineup only. */
const lineupRoad = (week, lu = {}) => ({ weeks: [{ gw: Number(week.gw), xi: week.xi, bench: week.bench, captain: week.captain, chip: week.chip ?? null, hits: 0, ...lu }] });

/** Captain `c` against captain `vs` in one week (a Road week or a view week) in the one measure (compare): the
 *  pooled forecast of the captain's extra points. The C-badge drag tip reads it. */
export const captainGap = (ctx, week, c, vs) => compare(ctx, lineupRoad(week, { captain: c }), lineupRoad(week, { captain: vs }));
/** Sub `s` (ahead.subLineup's {xi, bench, captain}) against the week's lineup now, in the one measure: what the sub
 *  changes the week's points by, the number its toast says (ahead.sub: its week re-scored, engine.weekPoints). A sub's
 *  list reads it (ahead.subChoices; the user, 2026-10-21: fix all, first-use proposal #5). */
export const subGap = (ctx, week, s) => compare(ctx, lineupRoad(week, { xi: s.xi, bench: s.bench, captain: s.captain }), lineupRoad(week));

// ---------------------------------------------------------------- your plan as you play it

/**
 * A road as your plan on the phone: its draft (engine.roadToDraft) with your GW-A lineup (memory's accepted.lineup:
 * the XI and bench of a sub, the armband; phone-only, the solver has no force-captain flag), evaluated over the
 * planned GWs. engine.evaluate maps a saved XI and bench onto the road's squad (a sold player's slot goes to his
 * replacement) or, when they no longer fit, keeps the road's; a captain or vice outside the XI falls back
 * (lineupFor). The one path for GW A on the phone: drift, receipts, the price watch (FOLLOWUPS F7).
 */
export function planFromRoad(ctx, road, lineup = {}) {
  let draft = E.roadToDraft(road, ctx.base, { players: ctx.players });
  const w = weekAt(road, ctx.A);
  if (w && ['captain', 'vice', 'xi', 'bench'].some((k) => lineup?.[k] != null)) draft = E.setLineup(draft, ctx.A, E.applyLineup(w, lineup, lookupOf(ctx)));
  const evaluation = E.evaluate({ base: ctx.base, players: ctx.players, draft, horizon: ctx.gws });
  return { draft, evaluation, week: evaluation.gws.find((s) => s.gw === ctx.A) ?? null };
}

/** GW A's moves as you make them in FPL (a GwState's: the engine's legal ones; the price watch's). */
export const handoffMoves = (week) => (week?.moves || []).filter((m) => m.ok !== false);
// ---------------------------------------------------------------- price watch (FPL's price changes before GW A)

/** FPL's own status words by likelihood (its frontend's chip reads price_change_projections[0].likelihood: ±5 "Very
 *  likely to rise / drop", ±4 "Likely to …", anything else "Unlikely to change"). On our 2026 snapshots a ±5 changed
 *  that night 97% of the time read within 3 h of the change (85–92% earlier in the day), so it is counted; a ±4 1.5–53%,
 *  so it is said and never counted. */
export const PRICE_WORD = Object.freeze({ 5: 'very likely to rise', 4: 'likely to rise', [-4]: 'likely to drop', [-5]: 'very likely to drop' });
/** B49: FPL's reading as Forkcast says it, the price watch's word (the player card's too until its price block went,
 *  2026-10-13) (o: priceOutlook's;
 *  when: the night, "tonight" / "by Wednesday night", or none): a "very likely" in FPL's words; a "likely", right 1.5–53%
 *  of the time, as "may rise" / "may drop" with FPL's word in brackets, so it claims no odds and no money. → "very likely
 *  to drop tonight" | "may rise tonight (FPL: likely)" | null (no reading). */
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

/** Intl formatters by time zone and options, made once (QA-7 #2: a formatter costs tens of ms on a phone). tz undefined:
 *  this browser's. */
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
 *  stale: the snapshot predates a change already made (its prices and the entry's sale prices are from before it, so a
 *  fresher prices block changes nothing here), asOf (epoch s: FPL's last update of the projections the rows carry,
 *  meta.prices_as_of when the bundle's prices block brought fresher ones than the snapshot's (withPrices), else
 *  meta.price_change_as_of)}. */
export function priceNights(meta, { now = Date.now() / 1000, until = null } = {}) {
  const all = (Array.isArray(meta?.price_change_deadlines) ? meta.price_change_deadlines : []).map(num);
  const nights = all.map((epoch, k) => ({ k, epoch })).filter((n) => n.epoch !== null && n.epoch > now && (until === null || n.epoch < until));
  return { nights, stale: all.some((e) => e !== null && e <= now), asOf: num(meta?.prices_as_of ?? meta?.price_change_as_of) };
}

/** The bundle's players columns ({fields, rows}) with its prices block laid over them (api/mobile.py bundle `prices`:
 *  FPL's projections read since the snapshot the rows carry, {fields: ['id', …], rows}, sent even while the version is
 *  unchanged), by id and field name: a player the block leaves out keeps his row, a field the players lack is skipped.
 *  → `cols` itself without a block. The bundle's own players are never changed, so a reply without a block falls back
 *  to the snapshot's. app.js derive and planInputs build their rows from it: the price watch, the plates and the player
 *  card all read the overlaid rows. */
/** The bundle's players columns as the phone shows them: its live block laid over them (the newest capture's display
 *  fields, api/data.py live_block: kept players' status, news, price, ownership...), then its prices block (FPL's
 *  projections read since the snapshot). */
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
 * A player's FPL price outlook over `nights` (priceNights) from his bundle row (price_watch [[likelihood, %] by offset],
 * price_locked_until, price_calibrating) → {dir (+1 rise, −1 drop, 0), sure (FPL's "very likely": counted), night (index
 * into nights) | null, likelihood, word (PRICE_WORD), held ('locked' | 'calibrating' | null)}. His first "very likely"
 * night is the one (offset k at 100% or more is a change by night k, never a second one: no 2026 player changed twice in
 * three nights); else his first "likely" night (said, not counted). Locked through a night (none of 10,187 locked
 * readings changed) or calibrating (FPL's "Calibrating status": just changed or added): no change.
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
 *  away), when ('tonight' | 'Wednesday night': the UK evening it ends, as FPL changes prices at 00:00 UK), short
 *  ('tonight' | 'Wed'), clock ("00:00 UK · 02:00 your time"; "Thu 00:00 UK · Thu 02:00 your time" for a later night;
 *  the UK time alone when the viewer's is the same)}. */
export function nightWords(epoch, now, tz) {
  const ms = epoch * 1000;
  const tonight = epoch - now <= DAY_S;
  const eve = fmtIn(LONDON, { weekday: 'long' }).format(ms - 3600e3);
  const day = (z) => (tonight ? '' : `${fmtIn(z, { weekday: 'short' }).format(ms)} `);
  const uk = `${day(LONDON)}${fmtIn(LONDON, HM).format(ms)}`, local = `${day(tz)}${fmtIn(tz, HM).format(ms)}`;
  return { tonight, when: tonight ? 'tonight' : `${eve} night`, short: tonight ? 'tonight' : eve.slice(0, 3), clock: uk === local ? `${uk} UK` : `${uk} UK · ${local} your time` };
}

/** The Player data plate "Price change" (FPL's semantics, priceOutlook over every night FPL projects): "▲ tonight" /
 *  "▼ Wed" (very likely, the night), "▲ likely" (likely), "Locked", "Calibrating", else "—" (unlikely to change, or a
 *  snapshot from before a change already made). */
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
 * GW A's price watch: FPL changes prices once a night (00:00 UK, meta.price_change_deadlines), so for each such night
 * before GW A's deadline, what making GW A's moves after it instead of now costs and what that puts out of reach, by
 * FPL's own projections (priceOutlook: "very likely" counted, "likely" said). A sale moves by the half-profit rule (the
 * entry's sell_price_up / sell_price_down: api/entry.py through the solver's net_at, never re-done here), a buy by its
 * whole £0.1m step. The consequence is the engine's own accounting (planBanks) of the same plan at those prices, all
 * else equal (the engine's static prices): GW A's bank going below 0 (these moves out of reach), a later GW's (that
 * GW's moves), else money only. Its resale of a GW-A buy at the price paid after the rise is FPL's (half of £0.1m
 * rounds down to nothing), so a later sale of him nets the rise out.
 * ctx: planInputs (base: the bank your plan starts from; meta: the bundle's); draft: the plan (planFromRoad's, ahead's).
 * → null when no player of GW A's moves has a change predicted before the deadline (or the snapshot predates a change
 *   already made), else {nights: [{epoch, k, w (£m waiting past it costs; < 0 gains), verdict ('thisMove' | 'laterMove'
 *   | 'money' | 'gain' | 'free'), gw (the GW put out of reach) | null, short (£m), bank {now, wait} (GW A's), allOk}],
 *   act (the first night waiting costs) | null, at (the night the line speaks of: act, else the best one to wait past)
 *   | null, players {id: outlook + {id, role, name, step (tenths: his sale's or buy's), sale (£m now), counted}}, moves
 *   [{out, in, parts [{id, dir, sure, text}], text}], line (the call to act, what waiting costs, or why waiting is free)
 *   | null, tone ('act': waiting puts a move out of reach | 'info'), note (FPL's reading's time), asOf}
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
  // B25: the act tone (amber) only while waiting puts a move out of reach; money only is a quiet fact
  const moveAtStake = act >= 0 && (out[act].verdict === 'thisMove' || out[act].verdict === 'laterMove');
  return {
    nights: out, act: act >= 0 ? act : null, at, players, moves: lines, line, short, tone: moveAtStake ? 'act' : 'info',
    note: asOfText ? COPY.watchNote(asOfText, old) : null, asOf,
  };
}

/** B139: the word the morning after a price watch. `kept` ({epoch: the night its line spoke of, gw: GW A, prices {id:
 *  tenths}}: the counted players' FPL prices, kept while it showed) against `prices` ({id: tenths}: the bundle's now)
 *  and GW A's bank after its moves now (£m; null when it has none), once that night has passed and the bundle is from
 *  after it (priceNights: not stale) → "Groß rose overnight (+£0.1m): your GW6 moves still fit" | "…: £0.1m short now"
 *  | "Prices held overnight"; null until then. name: id → name. */
export function priceMorning(kept, meta, { now = Date.now() / 1000, prices = {}, bank = null, name = String } = {}) {
  if (!kept || !(kept.epoch <= now) || priceNights(meta, { now }).stale) return null;
  const moved = Object.entries(kept.prices || {}).map(([id, t]) => ({ name: name(Number(id)), t: (prices[id] ?? t) - t })).filter((x) => x.t);
  return COPY.watchMorning(moved, kept.gw, bank);
}

/** `parts` rounded to `d` decimals so that they add up to their sum rounded the same way (the largest remainders round
 *  up): a table's rows and its total read as one sum (made for the drift's Compare sheet, gone in v1.1, 2026-10-10:
 *  a row's Δ was its two shown points' difference, the rows adding up to the gap the drift bar showed; only the unit
 *  tests call it now). → [number] */
export function roundedParts(parts, d = 1) {
  const k = 10 ** d;
  const xs = parts.map((x) => Number(x) * k);
  const floors = xs.map(Math.floor);
  let left = Math.round(xs.reduce((a, b) => a + b, 0)) - floors.reduce((a, b) => a + b, 0);
  const order = xs.map((x, i) => [x - floors[i], i]).sort((a, b) => b[0] - a[0]);
  const out = [...floors];
  for (const [, i] of order) { if (left <= 0) break; out[i] += 1; left -= 1; }
  return out.map((n) => n / k);
}

/**
 * How far a bake is (Ahead's GW line and the shell's bar while it re-plans; the user, 2026-10-08: "why doesn't it show
 * how long it's been planning, nor how much time is left"): bake is the bundle's (api/mobile.py progress: done, total, started, items
 * {state, elapsed, started}; epoch seconds). → {done, total, so: seconds since it started (null: unknown), left: seconds
 * (null while none is done: "estimating…"), late: the estimate ran out ("almost done")}. left = what the running items
 * have left of the average a done item of this bake took (an item past it eats into the rest), plus the average for
 * each item not started (total counts the stages not added yet), ÷ the items running at once: between two landings it
 * counts down a second a second, and where it runs out it says so, never a negative or ever-growing time.
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
/** planEta as the wait's one story says it (Connect's line and Ahead's GW line: design 1027a A-stages; the owner,
 *  2026-10-27, "Why planning happening in three places"): its time left never back up, counting down a second a second
 *  from the least it said for this bake; once that ran out with a road still planned, none said again for this bake
 *  (`spent`: the clock and the bar go on alone; planEta's own went "almost done" ↔ "~10 s left" at each road's landing,
 *  and an "almost done" kept would have stood 18 s of a 20 s wait). `now` epoch seconds, for the tests. */
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
/** 84 → "1:24", 3725 → "1:02:05": every clock on the phone (the bake's and Add a player's checks: B87b); a time before
 *  0 is 0:00 (a server's start time read against a phone clock behind it printed "-1:-1:-1": the review, 2026-10-21). */
export const clockText = (s) => {
  const t = Math.max(0, Math.floor(s)), hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = String(t % 60).padStart(2, '0');
  return hh ? `${hh}:${String(mm).padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
};
/** B87b: a check's clock after its line's " · " ("Checking GW8 · 1 of 4 weeks · 0:12"): the time since `t0` (ms), on
 *  clockText. Add a player's and the Chips sheet's lines (sheets/wish.js, sheets/chips.js). */
export const waitedText = (t0, now = Date.now()) => ` · ${clockText((now - t0) / 1000)}`;
/** A time left, rounded as it is meant: "~20 s", "~1 min", "~3 min". */
export const aboutText = (s) => (s < 55 ? `~${Math.max(10, Math.round(s / 10) * 10)} s` : `~${Math.max(1, Math.round(s / 60))} min`);
/** What a time left reads (planEta's): "~1 min left", "almost done", "estimating…" before any road is done. */
export const leftText = (e) => (e.left == null ? 'estimating…' : e.late ? 'almost done' : `${aboutText(e.left)} left`);
/** planEta's progress as the GW line says it, longest first (each shorter one for a line it doesn't fit): "Planning ·
 *  1:24 so far · ~1 min left", "Planning · 1:24 · ~1 min left", "1:24 · ~1 min left". No count of the roads (the user,
 *  2026-10-13: "users not familiar with back end"): the bar under the header shows how far (planShare). */
export function planLines(e) {
  const so = e.so == null ? '' : clockText(e.so);
  const join = (...xs) => xs.filter(Boolean).join(' · ');
  return [join('Planning', so && `${so} so far`, leftText(e)), join('Planning', so, leftText(e)), join(so, leftText(e))];
}
/** The wait's one story on Ahead's GW line (design 1027a A-stages), in Connect's words (app.js planning), longest
 *  first: the plan, `gws` its weeks and `e` steadyEta's ("Planning GW9–12 · 0:12 · ~10 s left", "Planning GW9–12 ·
 *  0:12", "Planning · 0:12"); then GW g's moves checked (`g`), `n` the choices checked so far (ahead.js tellStory:
 *  counted up, never back, no total while the bake's roads and chip pre-solves can still add one), on the same clock
 *  ("Checking GW9's moves · 1:06 · 5 checked", "Checking GW9 · 1:06 · 5 checked", "1:06 · 5 checked"). */
export function storyLines({ gws = null, e = null, g = null, n = 0, so = null }) {
  const t = so == null ? '' : clockText(so);
  const join = (...xs) => xs.filter(Boolean).join(' · ');
  if (g == null) {
    const plan = gws?.length ? `Planning ${span(gws)}` : 'Planning';
    return [join(plan, t, e && e.left != null && leftText(e)), join(plan, t), join('Planning', t)];
  }
  const c = n ? `${n} checked` : '';
  return [join(`Checking GW${g}'s moves`, t, c), join(`Checking GW${g}`, t, c), join(t, c)];
}
/** A bake's progress as a share of its time, for a bar (the user, 2026-10-13: "not show 0/6 since users not familiar with
 *  back end but rather show a progress bar instead (smooth progress bar based on eta)"): so far ÷ (so far + left), from
 *  planEta; never back (a landing that lengthens the estimate holds the bar where it was: the most shown for this bake)
 *  and never full while a road is still planned (half the last road's share short at most); null while nothing is
 *  estimated (no road done yet: the bar sweeps). */
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
/** The lines a wait shows (waitFact; design study 1027a, B-facts), true of bundle b: your rank's move over the last GW, then the line every GW (rank.cheer). Both only
 *  once FPL has checked that GW for you: rank.cheer is null until then (api/mobile.py), and the history's last row holds
 *  a provisional rank. Pure. → [[before, number, after]] */
export function waitFacts(b) {
  const r = b?.rank, [prev, last] = (b?.entry?.history ?? []).slice(-2);
  if (!r?.cheer) return [];
  const moved = last?.gw === r.gw && prev?.gw === r.gw - 1 && last.overall_rank > 0 && prev.overall_rank > 0;
  return [moved && COPY.factMove(r.gw, prev.overall_rank, last.overall_rank), COPY.factRank(r.cheer)].filter(Boolean);
}
/** The wait's line for its act (app.js factPanel: Connect's, then Ahead's cheer slot for the whole wait; the owner,
 *  2026-10-27: "it can change text when goes from planning to checking … with two differnt acts"): while it plans (act
 *  0) the first of waitFacts, while it checks the plan's moves (act 1) the second; the one there is in both when there
 *  is one. Pure. → [before, number, after] | null */
export const waitFact = (b, act = 0) => { const f = waitFacts(b); return f[Math.min(act, f.length - 1)] ?? null; };
