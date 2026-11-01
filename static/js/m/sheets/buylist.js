// Forkcast · the buy list's parts, shared by Replace (replace.js) and Add a player (wish.js) so both read and sort
// alike (owner, 2026-10-10): week pills, sort chips and orders, forecast bars, the row's left side.

import { h, fill, fmt, norm, roving } from '../../ui.js';
import { COPY } from '../calls.js';
import { shirtOf } from '../ahead.js';

const after = (P, g) => P.gws.filter((x) => x >= g);
const two = (v) => Number(v).toFixed(2);
/** The lists' sorts as chips (owner, 2026-10-10, 2026-10-28): key, chip name, his value (P, row, g), its number and
 *  small line, low first (xGC: fewer conceded; Price: cheapest), the bundle field it needs. */
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
/** Sorts the bundle can back (its field with a value for someone: a past GW has no per-90 rates), after the list's
 *  `own`. */
export const sortsOf = (ctx, own = []) => [...own, ...SORTS.filter((x) => !x.field || (ctx.bundle?.players?.fields?.includes(x.field) && ctx.data.rows.some((r) => r[x.field] != null)))];
/** Order by sort `x` (`rowOf`: item → player row): valueless last, low first where the sort says so, `flip` reverses;
 *  ties by the window's forecast. `val` gets (P, row, g, item). */
export const orderOf = (x, flip, P, g, rowOf = (a) => a) => {
  const dir = (x.low ? 1 : -1) * (flip ? -1 : 1), pts = SORTS[0];
  return (a, b) => {
    const va = x.val(P, rowOf(a), g, a), vb = x.val(P, rowOf(b), g, b);
    return (va == null) - (vb == null) || (va != null && vb != null ? dir * (va - vb) : 0) || pts.val(P, rowOf(b), g) - pts.val(P, rowOf(a), g);
  };
};
/** Sort chips into `host` (.ws-sorts), one sideways row: `st.sort` chosen; a tap chooses, a second flips (`st.flip`,
 *  shown by its arrow), then `draw`. Radio group, no panels; arrow keys pick (ui.roving). */
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

/** Week pills into `host`: one per GW of `gws`, `sel` pressed, `ok(g)` false disables. */
export function weekPills(host, gws, sel, ok, onPick) {
  fill(host, gws.map((g) => h('button', { type: 'button', 'aria-pressed': String(g === sel), disabled: !ok(g), onClick: () => onPick(g) }, `GW${g}`)));
}

/** Tabs into `seg` (.m-seg.small radio group, no panels): items [[key, label]], `sel` checked, `off(key)` can't be
 *  picked (greyed, arrows skip it); arrows pick (ui.roving). */
export function tabs(seg, items, sel, onPick, off = () => false) {
  seg.style.setProperty('--n', items.length);
  seg.style.setProperty('--i', items.findIndex(([k]) => k === sel));
  fill(seg, h('span.m-seg-thumb'), items.map(([k, l]) => h('button', {
    type: 'button', role: 'radio', 'aria-checked': String(sel === k), disabled: off(k), onClick: () => onPick(k),
  }, l)));
  roving(seg, { pick: (b) => b.click() });
}
/** Search match (`q` normalised, ui.norm): name contains it or club short name starts with it, so "ar" lists Arsenal's. */
export const found = (r, q) => norm(r.name).includes(q) || norm(r.club).startsWith(q);

/** Bars' scale: tallest forecast of `rows` over `gws`, one per list. */
export const barTop = (L, rows, gws) => Math.max(1, ...gws.flatMap((g) => rows.map((o) => L.xp(o.row.id, g) ?? 0)));

/** Forecast per GW as small bars, weeks before `from` faint; sorted by one week (`sort` 'week': "GW8", "Best GW8") only
 *  that week is blue (owner, 2026-10-23). */
export const bars = (L, id, gws, from, top, sort = null) => h('span.ah-micro', { 'aria-hidden': 'true' },
  gws.map((g) => h('i', { class: { f: sort === 'week' ? g !== from : g < from }, style: { height: `${Math.max(8, ((L.xp(id, g) ?? 0) / top) * 100)}%` } })));

/** A row's shirt. */
export const shirt = (L, id) => h('span.mk', { 'aria-hidden': 'true' }, shirtOf(L, Number(id), 32));
/** A row's shirt and name block: "Groß" over "BHA · £6.5m" (`extra`: nodes after it, e.g. "· bench in GW6"). */
export const who = (L, r, extra = null) => [shirt(L, r.id), h('span.nm', null, h('b', null, r.name), h('span', null, `${r.club} · ${fmt.money(r.price)}`, extra))];

