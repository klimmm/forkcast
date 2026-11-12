import {
  shirtOf
} from "./chunk-677LBVT3.js";
import {
  COPY,
  fill,
  fmt,
  h,
  norm,
  roving
} from "./chunk-TCPZEJ5A.js";

// js/m/sheets/buylist.js
var ownWeeks = (P, g) => P.d.xpGws.filter((x) => x >= g).slice(0, P.gws.length);
var two = (v) => Number(v).toFixed(2);
var SORTS = [
  { key: "pts", xp: true, name: (P, g) => `Predicted ${COPY.span(ownWeeks(P, g))}`, val: (P, r, g) => ownWeeks(P, g).reduce((t, x) => t + (P.L.xp(Number(r.id), x) ?? 0), 0), num: (v) => fmt.num(v), unit: (P, g) => `xP ${COPY.span(ownWeeks(P, g))}` },
  { key: "week", xp: true, name: (P, g) => `GW${g}`, val: (P, r, g) => P.L.xp(Number(r.id), g) ?? 0, num: (v) => fmt.num(v), unit: (P, g) => `xP GW${g}` },
  { key: "price", name: () => "Price", val: (P, r) => r.price, num: (v) => fmt.money(v), unit: () => "price", low: true },
  { key: "own", name: () => "Owned", field: "sel_pct", val: (P, r) => r.sel_pct, num: (v) => fmt.pct(v), unit: () => "owned" },
  { key: "form", name: () => "Form", field: "form", val: (P, r) => r.form, num: (v) => fmt.num(v), unit: () => "form" },
  { key: "xgi", name: () => "xGI", field: "xgi90", val: (P, r) => r.xgi90, num: two, unit: () => "xGI per 90" },
  { key: "xgc", name: () => "xGC", field: "xgc90", val: (P, r) => r.xgc90, num: two, unit: () => "xGC per 90", low: true },
  { key: "dc", name: () => "DefCon", field: "dc90", val: (P, r) => r.dc90, num: (v) => fmt.num(v), unit: () => "DefCon per 90" }
];
var sortsOf = (ctx, own = []) => [...own, ...SORTS.filter((x) => !x.field || ctx.bundle?.players?.fields?.includes(x.field) && ctx.data.rows.some((r) => r[x.field] != null))];
var orderOf = (x, flip, P, g, rowOf = (a) => a) => {
  const dir = (x.low ? 1 : -1) * (flip ? -1 : 1), pts = SORTS[0];
  return (a, b) => {
    const va = x.val(P, rowOf(a), g, a), vb = x.val(P, rowOf(b), g, b);
    return (va == null) - (vb == null) || (va != null && vb != null ? dir * (va - vb) : 0) || pts.val(P, rowOf(b), g) - pts.val(P, rowOf(a), g);
  };
};
function sortChips(host, list, st, P, g, draw) {
  const cur = list.find((x) => x.key === st.sort) ?? list[0];
  fill(host, list.map((x) => {
    const on = x === cur, down = !x.low !== st.flip;
    return h("button", {
      type: "button",
      role: "radio",
      "aria-checked": String(on),
      "aria-label": `Sort by ${x.name(P, g)}${on ? down ? ", highest first" : ", lowest first" : ""}`,
      onClick: () => {
        if (on) st.flip = !st.flip;
        else {
          st.sort = x.key;
          st.flip = false;
        }
        draw();
      }
    }, x.name(P, g), on ? h("span.ws-dir", { "aria-hidden": "true" }, down ? " \u2193" : " \u2191") : null);
  }));
  roving(host, { pick: (b) => b.click() });
}
function weekPills(host, gws, sel, ok, onPick) {
  fill(host, gws.map((g) => h("button", { type: "button", "aria-pressed": String(g === sel), disabled: !ok(g), onClick: () => onPick(g) }, `GW${g}`)));
}
function tabs(seg, items, sel, onPick, off = () => false) {
  seg.style.setProperty("--n", items.length);
  seg.style.setProperty("--i", items.findIndex(([k]) => k === sel));
  fill(seg, h("span.m-seg-thumb"), items.map(([k, l]) => h("button", {
    type: "button",
    role: "radio",
    "aria-checked": String(sel === k),
    disabled: off(k),
    onClick: () => onPick(k)
  }, l)));
  roving(seg, { pick: (b) => b.click() });
}
var found = (r, q) => norm(r.name).includes(q) || norm(r.club).startsWith(q);
var barTop = (L, rows, gws) => Math.max(1, ...gws.flatMap((g) => rows.map((o) => L.xp(o.row.id, g) ?? 0)));
var bars = (L, id, gws, from, top, sort = null) => h(
  "span.ah-micro",
  { "aria-hidden": "true" },
  gws.map((g) => h("i", { class: { f: sort === "week" ? g !== from : g < from }, style: { height: `${Math.max(8, (L.xp(id, g) ?? 0) / top * 100)}%` } }))
);
var shirt = (L, id) => h("span.mk", { "aria-hidden": "true" }, shirtOf(L, Number(id), 32));
var who = (L, r, extra = null) => [shirt(L, r.id), h("span.nm", null, h("b", null, r.name), h("span", null, `${r.club} \xB7 ${fmt.money(r.price)}`, extra))];

export {
  ownWeeks,
  SORTS,
  sortsOf,
  orderOf,
  sortChips,
  weekPills,
  tabs,
  found,
  barTop,
  bars,
  shirt,
  who
};
