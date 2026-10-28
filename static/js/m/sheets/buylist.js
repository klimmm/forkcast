// Forkcast · the buy list's parts, shared by Replace (replace.js) and Add a player (wish.js) so both lists read and sort
// the same (the user, 2026-10-10: "when i replace a player it shows graphics like this and with tabs like best this gw,
// best for plan, cheapest etc. why when i click add player it shows just a few players and that's it"): the week pills,
// the sort tabs, the order each tab means, a player's forecast bars, and the row's left side (shirt, name, club · price).

import { h, fill, fmt, norm, roving } from '../../ui.js';
import { COPY } from '../calls.js';
import { shirtOf } from '../ahead.js';

/** The sort tabs: the estimate over the window, the week's forecast, the price; each named by its weeks (B88b,
 *  podmajersky P1 §9: "Best for plan · This week" named none), (gws, g) → "Best GW6–9 · Best GW6 · Cheapest". */
export const SORTS = [['plan', (gws) => `Best ${COPY.span(gws)}`], ['week', (gws, g) => `Best GW${g}`], ['cheap', () => 'Cheapest']];
/** A sort's name for the window `gws` from GW g (its tab, and Replace's footnote quoting it). */
export const sortName = (key, gws, g) => SORTS.find(([k]) => k === key)[1](gws, g);

/** The week pills into `host`: one per GW of `gws`, `sel` pressed, `ok(g)` false disables one. */
export function weekPills(host, gws, sel, ok, onPick) {
  fill(host, gws.map((g) => h('button', { type: 'button', 'aria-pressed': String(g === sel), disabled: !ok(g), onClick: () => onPick(g) }, `GW${g}`)));
}

/** Tabs into `seg` (an .m-seg.small radio group: they choose the list's order or filter, they have no panels of their
 *  own, B113): items [[key, label]], `sel` checked; the arrow keys pick as a tap does (ui.roving). */
export function tabs(seg, items, sel, onPick) {
  seg.style.setProperty('--n', items.length);
  seg.style.setProperty('--i', items.findIndex(([k]) => k === sel));
  fill(seg, h('span.m-seg-thumb'), items.map(([k, l]) => h('button', {
    type: 'button', role: 'radio', 'aria-checked': String(sel === k), onClick: () => onPick(k),
  }, l)));
  roving(seg, { pick: (b) => b.click() });
}
/** The sort tabs: `sort` selected, named for the window `gws` and GW g; a 1-week plan (You → Plan ahead) has no week's
 *  own tab (it would read "Best GW7" twice). */
export const sortTabs = (seg, sort, g, onPick, gws) => tabs(seg, SORTS.filter(([k]) => k !== 'week' || gws.length > 1).map(([k]) => [k, sortName(k, gws, g)]), sort, onPick);

/** A row the search finds (`q` normalised, ui.norm): his name holding it, or his club's short name starting with it, so
 *  "ar" already lists Arsenal's (B93, johnson Part 3 §9: no club search). */
export const found = (r, q) => norm(r.name).includes(q) || norm(r.club).startsWith(q);

/** The order a tab means for rows {row, delta}: the estimate (rows without one last), GW g's forecast, the price. */
export const sorter = (L, sort, g) => ({
  plan: (a, b) => (b.delta ?? -99) - (a.delta ?? -99),
  week: (a, b) => (L.xp(b.row.id, g) ?? 0) - (L.xp(a.row.id, g) ?? 0),
  cheap: (a, b) => (a.row.price ?? 99) - (b.row.price ?? 99),
})[sort];

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

