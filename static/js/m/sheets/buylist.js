// Forkcast · the buy list's parts, shared by Replace (replace.js) and Add a player (wish.js) so both lists read and sort
// the same (the user, 2026-10-10: "when i replace a player it shows graphics like this and with tabs like best this gw,
// best for plan, cheapest etc. why when i click add player it shows just a few players and that's it"): the week pills,
// the sort chips and the order each means, a player's forecast bars, and the row's left side (shirt, name, club · price).

import { h, fill, fmt, norm, roving } from '../../ui.js';
import { COPY } from '../calls.js';
import { shirtOf } from '../ahead.js';

const after = (P, g) => P.gws.filter((x) => x >= g);
const two = (v) => Number(v).toFixed(2);
/** The lists' sorts, as chips (Add a player's since the user's 2026-10-10 "instead of cheapest add sorting by - price,
 *  ownership, form, xgi, predicted points etc."; "also defcon, xg conceded"; Replace's after its own "Best GW6–9", the
 *  owner, 2026-10-28: "why sorting by price, ownership etc. is missing"): key, the chip's name, his value (P, row, g),
 *  its number and its small line, low values first (xGC: fewer conceded is better; Price: the cheapest), the bundle field
 *  it needs. */
export const SORTS = [
  { key: 'pts', xp: true, name: (P, g) => `Predicted ${COPY.span(after(P, g))}`, val: (P, r, g) => after(P, g).reduce((t, x) => t + (P.L.xp(Number(r.id), x) ?? 0), 0), num: (v) => fmt.num(v), unit: (P, g) => `xP ${COPY.span(after(P, g))}` },
  { key: 'week', xp: true, name: (P, g) => `GW${g}`, val: (P, r, g) => P.L.xp(Number(r.id), g) ?? 0, num: (v) => fmt.num(v), unit: (P, g) => `xP GW${g}` },
  { key: 'price', name: () => 'Price', val: (P, r) => r.price, num: (v) => fmt.money(v), unit: () => 'price', low: true },
  { key: 'own', name: () => 'Owned', field: 'sel_pct', val: (P, r) => r.sel_pct, num: (v) => fmt.pct(v), unit: () => 'owned' },
  { key: 'form', name: () => 'Form', field: 'form', val: (P, r) => r.form, num: (v) => fmt.num(v), unit: () => 'form' },
  { key: 'xgi', name: () => 'xGI', field: 'xgi90', val: (P, r) => r.xgi90, num: two, unit: () => 'xGI per 90' },
  { key: 'xgc', name: () => 'xGC', field: 'xgc90', val: (P, r) => r.xgc90, num: two, unit: () => 'xGC per 90', low: true },
  { key: 'dc', name: () => 'DefCon', field: 'dc90', val: (P, r) => r.dc90, num: (v) => fmt.num(v), unit: () => 'DefCon per 90' },
];
/** The sorts this bundle can back (a field it carries with a value for someone: a past GW's has no per-90 rates), after
 *  a list's own (`own`: Replace's "Best GW6–9"). */
export const sortsOf = (ctx, own = []) => [...own, ...SORTS.filter((x) => !x.field || (ctx.bundle?.players?.fields?.includes(x.field) && ctx.data.rows.some((r) => r[x.field] != null)))];
/** Sort `x`'s order of a list's items (`rowOf`: an item's player row), its values (those without one last), low first
 *  where it says so, `flip` reversed; ties by the window's forecast. A sort's `val` gets the item too (P, row, g, item). */
export const orderOf = (x, flip, P, g, rowOf = (a) => a) => {
  const dir = (x.low ? 1 : -1) * (flip ? -1 : 1), pts = SORTS[0];
  return (a, b) => {
    const va = x.val(P, rowOf(a), g, a), vb = x.val(P, rowOf(b), g, b);
    return (va == null) - (vb == null) || (va != null && vb != null ? dir * (va - vb) : 0) || pts.val(P, rowOf(b), g) - pts.val(P, rowOf(a), g);
  };
};
/** The sorts as chips in one sideways row into `host` (.ws-sorts): `st.sort` chosen, a tap chooses one, a second tap
 *  turns it round (`st.flip`; its arrow says which way), then `draw`; a radio group (no panels of their own: B113), the
 *  arrow keys picking as a tap does (ui.roving). */
export function sortChips(host, list, st, P, g, draw) {
  const cur = list.find((x) => x.key === st.sort) ?? list[0];
  fill(host, list.map((x) => {
    const on = x === cur, down = !x.low !== st.flip;
    return h('button', {
      type: 'button', role: 'radio', 'aria-checked': String(on),
      'aria-label': `Sort by ${x.name(P, g)}${on ? (down ? ', highest first' : ', lowest first') : ''}`,
      onClick: () => { if (on) st.flip = !st.flip; else { st.sort = x.key; st.flip = false; } draw(); },
    }, x.name(P, g), on ? h('span.ws-dir', { 'aria-hidden': 'true' }, down ? ' ↓' : ' ↑') : null);
  }));
  roving(host, { pick: (b) => b.click() });
}

/** The week pills into `host`: one per GW of `gws`, `sel` pressed, `ok(g)` false disables one. */
export function weekPills(host, gws, sel, ok, onPick) {
  fill(host, gws.map((g) => h('button', { type: 'button', 'aria-pressed': String(g === sel), disabled: !ok(g), onClick: () => onPick(g) }, `GW${g}`)));
}

/** Tabs into `seg` (an .m-seg.small radio group: they choose the list's order or filter, they have no panels of their
 *  own, B113): items [[key, label]], `sel` checked, `off(key)` those that can't be picked (greyed, skipped by the arrow
 *  keys); the arrow keys pick as a tap does (ui.roving). */
export function tabs(seg, items, sel, onPick, off = () => false) {
  seg.style.setProperty('--n', items.length);
  seg.style.setProperty('--i', items.findIndex(([k]) => k === sel));
  fill(seg, h('span.m-seg-thumb'), items.map(([k, l]) => h('button', {
    type: 'button', role: 'radio', 'aria-checked': String(sel === k), disabled: off(k), onClick: () => onPick(k),
  }, l)));
  roving(seg, { pick: (b) => b.click() });
}
/** A row the search finds (`q` normalised, ui.norm): his name holding it, or his club's short name starting with it, so
 *  "ar" already lists Arsenal's (B93, johnson Part 3 §9: no club search). */
export const found = (r, q) => norm(r.name).includes(q) || norm(r.club).startsWith(q);

/** The tallest forecast of `rows` over `gws` (the bars' scale, one per list). */
export const barTop = (L, rows, gws) => Math.max(1, ...gws.flatMap((g) => rows.map((o) => L.xp(o.row.id, g) ?? 0)));

/** A player's forecast for each GW as small bars, the weeks before `from` faint; under the list's sort by one week's
 *  forecast (`sort` 'week': "GW8", "Best GW8") every other week faint, the sorted week alone blue (the user, 2026-10-23:
 *  "when i choose gw8 sort it not grey out other weeks only keeping blue gw8"). */
export const bars = (L, id, gws, from, top, sort = null) => h('span.ah-micro', { 'aria-hidden': 'true' },
  gws.map((g) => h('i', { class: { f: sort === 'week' ? g !== from : g < from }, style: { height: `${Math.max(8, ((L.xp(id, g) ?? 0) / top) * 100)}%` } })));

/** A row's shirt. */
export const shirt = (L, id) => h('span.mk', { 'aria-hidden': 'true' }, shirtOf(L, Number(id), 32));
/** A row's shirt and name block: "Groß" over "BHA · £6.5m" (`extra`: nodes after it, e.g. "· bench in GW6"). */
export const who = (L, r, extra = null) => [shirt(L, r.id), h('span.nm', null, h('b', null, r.name), h('span', null, `${r.club} · ${fmt.money(r.price)}`, extra))];

