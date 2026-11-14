// calls.js: inputs, exports and small helpers

import * as E from '../../plan/engine.js';
import { fmt, fin, statusInfo } from '../../ui.js';

/** GW gw's switcher marks from meta.dgw_bgw.window: ['DGW'] where a club plays twice, ['BGW'] where one doesn't play,
 *  both, or []. */
export function gwFlags(win, gw) {
  const has = (xs) => (xs || []).map(Number).includes(Number(gw));
  return [has(win?.doubles) ? 'DGW' : null, has(win?.blanks) ? 'BGW' : null].filter(Boolean);
}

/** FPL statuses that mean out. */
export const OUT = { i: 'injured', u: 'unavailable', s: 'suspended' };
/** FPL news "Knock - 75% chance of playing" → "knock". */
export const newsReason = (row) => String(row?.news || '').split(' - ')[0].trim().toLowerCase();
/** A player's FPL flag in words: "Scott is injured (knee)", "Groß is 75% (knock)"; null when none. */
export const statusText = (name, row) => {
  const st = statusInfo(row?.status, row?.chance);
  const why = newsReason(row);
  if (OUT[st.code]) return `${name} is ${OUT[st.code]}${why && why !== OUT[st.code] ? ` (${why})` : ''}`;
  if (st.code === 'd' || (st.chance !== null && st.chance < 100)) return `${name} is ${st.chance !== null ? `${st.chance}%` : 'doubtful'}${why ? ` (${why})` : ''}`;
  return null;
};

// ---------------------------------------------------------------- small helpers

export const num = (v) => (fin(v) ? Number(v) : null);
export const EPS = 1e-6;
export const ids = (xs) => (Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : []);
export const MINUS = '−';
export const pts = (x) => fmt.signed(x);
/** [7, 9] → "GW7, GW9". */
export const gwList = (gws) => gws.map((g) => `GW${g}`).join(', ');
/** [6, 7, 8, 9] or [6, 9] → "GW6–9"; [9] or [9, 9] → "GW9". */
export const span = (gws) => (gws.length > 1 && gws[0] !== gws.at(-1) ? `GW${gws[0]}–${gws.at(-1)}` : gws.length ? `GW${gws[0]}` : '');
/** GW a to GW b as span writes it. */
export const range = (a, b) => span(a === b ? [a] : [a, b]);
/** ['Saka', 'Bassey', 'Isak'] → "Saka, Bassey and Isak". */
export const andList = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '');
/** ahead.fplSets → the week line's advice: whom to start ("start Justin, Barry"), else whom to bench, else (only buys
 *  change places) the buy to bench, never a buy to start (not yet in your FPL team); where no one changes places, its
 *  one other change: "captain Haaland", "vice-captain Palmer", "bench order" (owner, 2026-10-29). */
export const setsSaid = ({ start, bench, subs, captain, vice }) => (start.length ? `start ${start.join(', ')}`
  : bench.length || subs.length ? `bench ${(bench.length ? bench : subs.map((x) => x.off)).join(', ')}`
  : captain ? `captain ${captain}` : vice ? `vice-captain ${vice}` : 'bench order');
/** …and its Week-sheet row's, true of what FPL has (the last deadline's team): what it did ("benched Justin and
 *  Barry"), then each change that makes this pitch, a step a line in FPL's order: substitutions, armbands and bench
 *  order where they differ, "(after the transfer)" on a step whose player is a buy (`buys`). */
export const setsRow = ({ start, bench, subs, captain, vice, order, buys = [] }) => {
  const after = (on) => (on ? ' (after the transfer)' : '');
  const had = start.length ? `benched ${andList(start)}` : bench.length ? `started ${andList(bench)}` : null;
  return [had, [...subs.map((x) => `Start ${x.on} for ${x.off}${after(x.buy)}`), captain && `Captain: ${captain}${after(buys.includes(captain))}`,
    vice && `Vice-captain: ${vice}${after(buys.includes(vice))}`, order && `Bench: ${order.join(', ')}`].filter(Boolean)];
};
export const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const ORD = (n) => { const v = n % 100, s = ['th', 'st', 'nd', 'rd']; return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`; };
/** A rank with grouped thousands: 1566 → "1,566th". */
export const rankOrd = (n) => fmt.ordinal(n).replace(/^\d+/, fmt.int(n));
/** A rank as the You tile has it: "1,000", "670K", "1.30M" (never "1K"). */
export const rankShort = (n) => (n < 1e4 ? fmt.int(n) : fmt.compact(n, 2));
/** n hits in words: "a −4", "two hits (−8)". */
/** [{gw}] → "GW7" | "GW7 and GW8". */
export const gwsWords = (list) => list.map((x) => `GW${x.gw}`).join(' and ');
export const hitsWords = (n) => (n > 1 ? `${WORDS[n] ?? n} hits (${MINUS}${E.HIT_COST * n})` : `a ${MINUS}${E.HIT_COST}`);
/** The solver's hit cap per GW (its Rules' hit_rule, as the model's plan was solved under: memory model): what a GW
 *  with no hits rule of yours allows; null before that plan is in. */
export const hitCap = (model) => num(model?.hit_rule?.cap);
/** A plan length's feature as the server names it when locking it (meta.locked; api/mobile.py horizon_feature):
 *  "horizon:2". */
export const horizonFeature = (n) => `horizon:${n}`;
/**
 * The plan's weeks this browser asks for (Settings → Plan ahead): `choice`, its stored pick (1..most; none or out of
 * range: most), or, when that length is `locked` (meta.locked), the longest unlocked one (one week never is), as the
 * server falls back (api/mobile.py plan_weeks). most: meta.reach's length; with neither choice nor reach: null, the
 * server's longest.
 */
export function planWeeks(choice, locked = [], most = null) {
  const n = num(choice), top = num(most);
  const want = Number.isInteger(n) && n >= 1 && (top === null || n <= top) ? n : top;
  if (want === null) return null;
  const off = (k) => k > 1 && (locked || []).includes(horizonFeature(k));
  return off(want) ? Math.max(...Array.from({ length: top ?? want }, (_, i) => i + 1).filter((k) => !off(k))) : want;
}
/** Tenths of £m as a signed amount: 1 → "+£0.1m", −2 → "−£0.2m". */
export const signedMoney = (t) => `${t > 0 ? '+' : ''}${fmt.money(t / 10)}`;
export const tenths = (m) => (num(m) === null ? null : Math.round(Number(m) * 10));
export const lookupOf = (ctx) => E.playerLookup({ base: ctx.base, players: ctx.players });
export const weekAt = (road, gw) => (road?.weeks || []).find((w) => Number(w.gw) === Number(gw)) || null;
