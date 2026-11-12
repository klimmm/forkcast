import {
  SORTS,
  barTop,
  bars,
  found,
  orderOf,
  ownWeeks,
  shirt,
  sortChips,
  sortsOf,
  tabs,
  weekPills
} from "../chunks/chunk-E4EVUW6K.js";
import {
  barred,
  barringRule,
  bringIn,
  chooseOnPitch,
  inkAt,
  plan,
  reroute,
  ruleOf,
  saleBuy,
  sayBuyProblem,
  squadBefore,
  weekOf
} from "../chunks/chunk-677LBVT3.js";
import "../chunks/chunk-IBIGFFAK.js";
import {
  COPY,
  fill,
  fmt,
  h,
  icon,
  norm,
  xpNum
} from "../chunks/chunk-TCPZEJ5A.js";
import "../chunks/chunk-WSFCRVEQ.js";

// js/m/sheets/wish.js
var POSITIONS = ["GK", "DEF", "MID", "FWD"];
function open(ctx, preId = null, { gw = null, pos = null, out = null, compare = null } = {}) {
  const P0 = plan(ctx);
  if (!P0) return null;
  const live = (g) => !inkAt(ctx, P0, g);
  const G = [gw, ctx.store.get("gw")].map(Number).find((g) => P0.gws.includes(g) && live(g)) ?? P0.gws.find(live) ?? P0.A;
  const leave = (g) => {
    ctx.sheets.closeAll();
    ctx.navigate("ahead", { gw: g }, { replace: true, top: true });
  };
  const pick = (id, g = G) => {
    if (chooseOnPitch(ctx, id, g)) leave(g);
  };
  if (preId != null) {
    pick(Number(preId));
    return null;
  }
  const st = { q: "", g: G, pos: POSITIONS.includes(pos) ? pos : "all", place: out != null ? Number(out) : null, lock: (out != null || !!compare) && POSITIONS.includes(pos), sort: "pts", flip: false };
  let picked = false;
  const no = barred(P0, P0.A);
  return ctx.sheets.open({
    title: compare?.title ?? COPY.bringInSheet,
    detent: "large",
    cls: "ws",
    onClose: () => {
      if (compare && !picked) compare.back();
    },
    build(body) {
      const input = h("input", { type: "search", placeholder: "Search by surname", "aria-label": "Search by surname", autocomplete: "off", spellcheck: "false", enterkeyhint: "search" });
      const pillsEl = h("div.ah-pills", { role: "group", "aria-label": "From gameweek" });
      const posEl = h("div.m-seg.small", { role: "radiogroup", "aria-label": "Position" });
      const main = h("div.ws-main");
      const sortEl = h("div.ws-sorts", { role: "radiogroup", "aria-label": "Sort by" });
      body.append(h("label.ah-search", null, icon("search", { size: 16 }), input), pillsEl, posEl, sortEl, main);
      input.addEventListener("input", () => {
        st.q = input.value;
        draw();
      });
      const sorts = () => sortsOf(ctx);
      const sortOf = () => sorts().find((x) => x.key === st.sort) ?? SORTS[0];
      function row(id, sub2 = null, top = 1, mine = false) {
        const P = plan(ctx);
        const r = ctx.data.byId.get(id);
        const name = r?.name ?? P.L.name(id);
        const x = sortOf();
        const v = r && !sub2 ? x.val(P, r, st.g) : null;
        const bar = !mine && no.has(id) ? barringRule(P, id) : null;
        const yours = mine ? COPY.inYours(squadBefore(P, P.A).includes(id), st.g) : null;
        return h(
          "div.ws-item",
          { class: { mine } },
          h(
            "div.ah-lrow.static",
            null,
            shirt(P.L, id),
            // his card on the list's week, so its Bring him in… keeps that week (one of yours: his sale, his place)
            h(
              "button.nm.ws-name",
              { type: "button", onClick: () => ctx.openSheet("player", id, { gw: st.g }) },
              h("b", null, name),
              h("span", null, sub2 ?? [mine ? yours : bar ? ruleOf(P, bar).text : no.has(id) ? "Ruled out by you" : null, r?.club, fmt.money(r?.price)].filter(Boolean).join(" \xB7 "))
            ),
            sub2 ? null : bars(P.L, id, ownWeeks(P, st.g), st.g, top, x.key),
            // (a forecast sort's number in the forecast's blue, its unit under it naming the weeks: ui.js xpNum; owner,
            // 2026-10-22)
            sub2 ? null : h("span.rt.m-num", null, v == null ? "\u2014" : x.xp ? xpNum(x.num(v), "span", null, false) : x.num(v), h("small", null, x.unit(P, st.g))),
            // its first letter alone lowered: "in your GW8 plan", never "gw8"
            compare ? h("button.ws-add.m-swap.quiet", { type: "button", "aria-label": `${COPY.compareGo} ${name}`, onClick: () => {
              picked = true;
              ctx.sheets.closeAll();
              compare.pick(id);
            } }, COPY.compareGo) : mine ? h("button.ws-add.ws-mine", { type: "button", "aria-label": `${name}, ${yours[0].toLowerCase()}${yours.slice(1)}: his card`, onClick: () => ctx.openSheet("player", id, { gw: st.g }) }, "\u22EF") : st.lock ? h("button.ws-add.m-swap.quiet", { type: "button", disabled: !P.editable, "aria-label": `${COPY.bringIn(name, st.g)} for ${P.L.name(st.place)}`, onClick: () => swapIn(id) }, COPY.placeSwap) : h("button.ws-add", { type: "button", disabled: !P.editable, "aria-label": COPY.bringIn(name, st.g), onClick: () => pick(id, st.g) }, icon("plus", { size: 16 }))
          )
        );
      }
      function players(P) {
        const g = st.g;
        const q = norm(st.q.trim());
        const squad = new Set(weekOf(P, g)?.squad ?? squadBefore(P, g));
        const mine = (r) => squad.has(Number(r.id));
        const at = (r) => (!q || found(r, q)) && (q && !st.lock || st.pos === "all" || P.L.pos(Number(r.id)) === st.pos);
        const ok = (r) => mine(r) || r.buyable;
        return ctx.data.rows.filter((r) => at(r) && ok(r)).sort(orderOf(sortOf(), st.flip, P, g)).map((r) => ({ row: r, mine: mine(r) }));
      }
      function draw() {
        const P = plan(ctx);
        if (!P) return;
        const L = P.L, g = st.g, q = norm(st.q.trim());
        weekPills(pillsEl, P.gws, g, live, (x) => {
          st.g = x;
          draw();
        });
        tabs(posEl, [["all", "All"], ...POSITIONS.map((x) => [x, x])], st.pos, (k) => {
          st.pos = k;
          draw();
        }, (k) => st.lock && k !== st.pos);
        posEl.hidden = !!q;
        sortChips(sortEl, sorts(), st, P, g, draw);
        const items = players(P).map((o) => ({ ...o, id: Number(o.row.id) }));
        const ids = items.map((o) => o.id);
        const top = barTop(L, items, ownWeeks(P, st.g));
        const later = P.weeks.filter((w) => w.gw > g).flatMap((w) => w.in.map((id) => ({ id, gw: w.gw }))).filter((x) => !st.lock || L.pos(x.id) === st.pos);
        fill(
          main,
          P.editable || compare ? null : h("p.ps-off", null, P.why),
          h("div.m-sec", null, items.length ? items.map((o) => row(o.id, null, top, o.mine)) : h("p.ah-empty", null, q ? COPY.noneCalled("player", st.q.trim()) : "No one fits this filter.")),
          !q && !compare && later.length ? h(
            "div.m-sec",
            null,
            h("h3", null, "Your plan buys later"),
            later.map(({ id, gw: at }) => row(id, `arrives GW${at} \xB7 bring him in earlier`))
          ) : null
        );
      }
      function swapIn(id) {
        const g = st.g, bp = saleBuy(ctx, id, g, st.place);
        if (bp.kind !== "one") {
          sayBuyProblem(ctx, plan(ctx), id, bp, "info");
          return;
        }
        if (!bringIn(ctx, id, g, bp)) return;
        leave(g);
        setTimeout(() => reroute(g), 160);
      }
      draw();
      setTimeout(() => input.focus({ preventScroll: true }), 380);
    }
  });
}
export {
  open
};
