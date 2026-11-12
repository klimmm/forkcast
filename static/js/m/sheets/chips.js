import {
  afterPaint,
  chipPreps,
  chipStates,
  inkAt,
  paintWaitView,
  plan,
  presolveTaps,
  useChip,
  waitView
} from "../chunks/chunk-677LBVT3.js";
import "../chunks/chunk-IBIGFFAK.js";
import {
  COPY,
  chipName,
  fill,
  fmt,
  h,
  reduceMotion,
  shownDelta,
  stepShare,
  xpGain
} from "../chunks/chunk-TCPZEJ5A.js";
import "../chunks/chunk-WSFCRVEQ.js";

// js/m/sheets/chips.js
function open(ctx, { gw } = {}) {
  const P0 = plan(ctx);
  if (!P0) return null;
  const g = Number(gw);
  const act = (c) => useChip(ctx, c, g);
  const offs = [];
  let tick = null;
  return ctx.sheets.open({
    title: COPY.chipsIn(g),
    detent: "medium",
    fit: true,
    cls: "cs",
    label: COPY.chipsIn(g),
    onClose: () => {
      clearInterval(tick);
      offs.forEach((f) => f());
      presolveTaps(ctx, null, { owner: offs });
    },
    build(body, sheet) {
      const sub = h("p.rs-sub", null, COPY.chipsSub(P0.gws.filter((x) => x >= g)));
      const list = h("div.ah-list", { role: "group", "aria-label": COPY.chipsIn(g) });
      const foot = h("p.m-foot", { hidden: true });
      const wv = waitView(), wbox = h("div.m-wait", { hidden: true }, wv.t, wv.bar), opened = Date.now(), seen = /* @__PURE__ */ new Set();
      let step = { done: -1, at: opened, max: 0 };
      body.append(sub, wbox, list, foot);
      let drawn = null;
      const vsOf = (r) => r.vs ?? (r.state === "swap" ? COPY.chipVsIt : COPY.chipNoChip);
      const factOf = (r, P) => {
        const vs = r.cmp || r.state === "swap" && !r.vs ? COPY.chipVs(vsOf(r)) : null;
        if (r.state === "on") return COPY.chipFact(r.mine ? COPY.chipTakeOff : COPY.chipByForkcast, vs);
        if (r.state === "off") return COPY.chipPlayed(r.at, r.back);
        if (r.state === "moved") return COPY.chipMoveHere(r.at);
        if (r.state === "swap") return COPY.chipFact(COPY.chipInstead(r.instead), vs);
        if (r.best) {
          return COPY.chipFact(
            r.best.gw === g ? COPY.chipBestHere : COPY.chipBestAt(r.best.gw, r.best.delta, vs && r.best.vs === r.vs ? null : r.best.vs ?? (r.best.delta != null ? COPY.chipNoChip : null)),
            vs,
            r.after != null ? COPY.chipAfter(r.after) : null
          );
        }
        if (!r.final) return COPY.chipFact(r.wait ? COPY.chipBestPlanning(r.wait.g, r.wait.i, r.wait.n, r.wait.part) : null, vs) || null;
        return COPY.chipFact(r.top && !r.top.clear ? COPY.chipNoBest(r.top, r.after, (r.chip === "fh" || r.chip === "wc") && !!P?.mem?.hold) : COPY.chipNoGain, vs);
      };
      const t0Of = (r) => r.state === "free" && !r.best && !r.final ? r.wait?.t0 ?? null : null;
      const clockOf = () => null;
      const paintWait = (rows) => {
        const waiting = rows.filter((r) => r.solving || t0Of(r) != null), now = Date.now();
        for (const r of waiting) seen.add(r.chip);
        wbox.hidden = !waiting.length;
        if (!waiting.length) {
          wv.key = null;
          return;
        }
        const n = seen.size, done = n - waiting.length, t0 = Math.min(...waiting.map((r) => t0Of(r) ?? opened));
        if (step.done !== done) step = { done, at: now, max: step.max };
        const p = step.max = Math.max(step.max, stepShare(done, n, reduceMotion() ? 0 : now - step.at, done ? (step.at - t0) / done : 4e3));
        paintWaitView(wv, { key: "chips", word: COPY.waitWord, scope: "chips", long: `GW${g}'s chips`, prog: `${done + 1} of ${n}`, so: (now - t0) / 1e3, p });
      };
      const clocksOf = (rows) => rows.map(t0Of).join("|");
      const numberOf = (r) => r.cmp ? [xpGain(shownDelta(r.cmp))] : r.solving ? h("small", null, COPY.waitShort) : null;
      const saidOf = (r, fact) => {
        const n = chipName(r.chip);
        const pts = r.cmp ? `: ${fmt.signed(shownDelta(r.cmp))} points over ${COPY.span(P0.gws.filter((x) => x >= g))} vs ${r.vs ?? (r.state === "swap" ? chipName(r.instead) : COPY.chipNoChip)}` : "";
        if (r.state === "on") return `${n} planned for GW${g}${r.mine ? "" : " by Forkcast"}${pts}. Takes it off.`;
        if (r.state === "off") return `${n}: ${fact.toLowerCase()}.`;
        if (r.state === "moved") return `Move ${n} from GW${r.at} to GW${g}.`;
        if (r.state === "swap") return `Play ${n} in GW${g} instead of ${chipName(r.instead)}${pts}.`;
        return `Play ${n} in GW${g}${pts}${fact ? `. ${fact}` : ""}.`;
      };
      function draw(numbers) {
        const P = plan(ctx);
        if (!P) return;
        const src = numbers ? chipPreps(ctx, P) : null;
        const rows = chipStates(ctx, P, g, src);
        if (numbers) drawn = [P, src, clocksOf(rows)];
        const can = P.editable && !inkAt(ctx, P, g);
        const focused = globalThis.document?.activeElement?.closest?.(".cs [data-chip]")?.dataset.chip ?? null;
        fill(list, rows.map((r) => {
          const fact = factOf(r, P);
          return h(
            "button.ah-lrow",
            {
              type: "button",
              dataset: { chip: r.chip },
              disabled: !can || r.state === "off",
              "aria-pressed": r.state === "on" ? "true" : null,
              "aria-label": saidOf(r, fact),
              onClick: () => {
                if (act(r.chip)) sheet.close();
              }
            },
            h("span.mk.rs-automk", { class: { on: r.state === "on" }, "aria-hidden": "true" }, r.chip.toUpperCase()),
            h("span.nm", null, h("b", null, r.state === "on" ? COPY.chipOn(r.chip) : chipName(r.chip)), fact ? h("span", null, fact, clockOf(r)) : null),
            h("span.rt.m-num", null, numberOf(r))
          );
        }));
        if (focused) list.querySelector(`[data-chip="${focused}"]`)?.focus();
        paintWait(rows);
        if (can && src) {
          const chips = rows.filter((r) => r.state !== "off" && (r.state === "on" || src.at(r.chip, g)?.state !== "ready")).map((r) => r.chip);
          presolveTaps(ctx, chips.map((c) => ({ kind: "chip", gw: g, run: () => act(c) })), { gw: g, sig: chips.join(), owner: offs });
        }
        const why = inkAt(ctx, P, g) ? COPY.live(g) : null;
        fill(foot, why);
        foot.hidden = !why;
      }
      draw(false);
      afterPaint(() => draw(true));
      offs.push(ctx.store.on("memory", () => queueMicrotask(() => draw(true))));
      offs.push(ctx.store.on("aheadPair", () => queueMicrotask(() => draw(true))));
      tick = setInterval(() => {
        const P = plan(ctx);
        const src = P ? chipPreps(ctx, P) : null;
        const rows = P ? chipStates(ctx, P, g, src) : null;
        if (P && (!drawn || drawn[0] !== P || drawn[1] !== src || drawn[2] !== clocksOf(rows))) draw(true);
        else if (rows) paintWait(rows);
      }, 1e3);
    }
  });
}
export {
  open
};
