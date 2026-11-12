import {
  inkAt,
  plan,
  shirtOf,
  sub,
  subChoices,
  weekOf,
  xpShown
} from "../chunks/chunk-677LBVT3.js";
import {
  subOrder
} from "../chunks/chunk-IBIGFFAK.js";
import {
  COPY,
  append,
  h,
  xpNum
} from "../chunks/chunk-TCPZEJ5A.js";
import "../chunks/chunk-WSFCRVEQ.js";

// js/m/sheets/sub.js
function open(ctx, id, g) {
  const P = plan(ctx), w = P && weekOf(P, g);
  const pid = Number(id);
  if (!w || !(w.bench.includes(pid) || w.xi.includes(pid))) return null;
  const can = !inkAt(ctx, P, g);
  const title = w.bench.includes(pid) ? COPY.subIn(subOrder(w.bench, P.L.pos).get(pid), g) : COPY.subOut(P.L.name(pid), g);
  return ctx.sheets.open({
    title,
    detent: "medium",
    fit: true,
    cls: "cs",
    label: title,
    build(body, sheet) {
      append(body, h("div.ah-list", { role: "group", "aria-label": title }, subChoices(ctx, P, g, pid).map((c) => {
        const said = COPY.lineup(c.what, g, c.cmp.delta);
        return h(
          "button.ah-lrow",
          {
            type: "button",
            disabled: !can,
            "aria-label": `${P.L.name(c.id)}, ${xpShown(ctx, c.id, g)} points, ${said}`,
            onClick: () => {
              if (sub(ctx, g, pid, c.id)) sheet.close();
            }
          },
          h("span.mk", { "aria-hidden": "true" }, shirtOf(P.L, c.id, 32)),
          h("span.nm", null, h("b", null, P.L.name(c.id)), h("span", null, said)),
          h("span.rt.m-num", null, xpNum(xpShown(ctx, c.id, g)))
        );
      })), can ? null : h("p.m-foot", null, COPY.live(g)));
    }
  });
}
export {
  open
};
