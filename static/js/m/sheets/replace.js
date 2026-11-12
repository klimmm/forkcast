import {
  barTop,
  bars,
  found,
  orderOf,
  ownWeeks,
  sortChips,
  sortsOf,
  weekPills,
  who
} from "../chunks/chunk-E4EVUW6K.js";
import {
  addMove,
  barred,
  barringRules,
  baseOf,
  bringIn,
  buyPlan,
  draftOf,
  inTeamAt,
  openRules,
  plan,
  planBaseline,
  presolveTaps,
  problemShort,
  problemText,
  removeRule,
  saleBuy,
  sayBuyProblem,
  sellOut,
  squadBefore,
  takenBy,
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
  posName,
  toast,
  xpGain
} from "../chunks/chunk-TCPZEJ5A.js";
import "../chunks/chunk-WSFCRVEQ.js";

// js/m/sheets/replace.js
var CAP = 30;
var hitsFrom = (ev, g) => ev.gws.filter((s) => s.gw >= g).reduce((n, s) => n + (s.hits || 0), 0);
var POS_WORD = { GK: "goalkeeper", DEF: "defender", MID: "midfielder", FWD: "forward" };
var BEST = { key: "plan", name: (P) => `Best ${COPY.span(P.gws)}`, val: (P, r, g, o) => o.delta ?? null };
function open(ctx, rawOut, rawGw) {
  const out = Number(rawOut);
  const P0 = plan(ctx);
  if (!P0) return null;
  const valid = P0.gws.filter((g) => squadBefore(P0, g).includes(out));
  if (!valid.length) {
    toast(`${P0.L.name(out)} isn't in your plan's squad in ${COPY.span(P0.gws)}.`, "info");
    return null;
  }
  const st = { g: valid.includes(Number(rawGw)) ? Number(rawGw) : valid[0], sort: "plan", flip: false, q: "", busy: false };
  const cache = /* @__PURE__ */ new Map();
  const pos = P0.L.pos(out);
  const word = POS_WORD[pos] || "player";
  const titleOf = (g) => `Sell ${P0.L.name(out)} from GW${g}`;
  function fund(o, g, ev0 = score(g).ev0) {
    o.funded = true;
    const bp = buyPlan(ctx, o.id, g, { out });
    if (bp.kind === "two") Object.assign(o, { delta: bp.ev.total - ev0.total, fund: bp.fund });
  }
  function score(g) {
    if (cache.has(g)) return cache.get(g);
    const P = plan(ctx);
    const d0 = draftOf(ctx);
    const ev0 = planBaseline(ctx, P, g);
    const owned = inTeamAt(P, g);
    const no = barred(P, g);
    const list = ctx.data.rows.filter((r) => posName(r.pos) === pos && Number(r.id) !== out).map((r) => {
      const id = Number(r.id);
      if (owned.has(id)) return { id, row: r, blocked: "In team", code: "owned" };
      if (no.has(id)) return { id, row: r, blocked: "your rule", code: "vetoed" };
      const res = addMove(ctx, d0, g, out, id, takenBy(ctx, P));
      const p = res.problem;
      if (p) return { id, row: r, blocked: problemShort(p), code: p.code, problem: p, ...p.code === "budget" ? { over: res.ev.total - ev0.total } : {} };
      return { id, row: r, ev: res.ev, draft: res.draft, delta: res.ev.total - ev0.total, hit: hitsFrom(res.ev, g) > hitsFrom(ev0, g) };
    });
    const cut = list.filter((o) => o.delta != null).map((o) => o.delta).sort((a, b) => b - a)[CAP - 1] ?? -Infinity;
    for (const o of list.filter((x) => x.code === "budget" && x.over > cut)) fund(o, g, ev0);
    const out0 = { list, ev0, P };
    cache.set(g, out0);
    return out0;
  }
  let me = null;
  return ctx.sheets.open({
    title: titleOf(st.g),
    detent: "large",
    cls: "rs",
    onClose: () => presolveTaps(ctx, null, { owner: me }),
    build(body, sheet) {
      me = sheet;
      const subEl = h("p.rs-sub");
      const pills = h("div.ah-pills", { role: "group", "aria-label": "From gameweek" });
      const input = h("input", { type: "search", placeholder: `Search ${word}s by surname`, "aria-label": `Search ${word}s by surname`, autocomplete: "off", spellcheck: "false", enterkeyhint: "search" });
      const sortEl = h("div.ws-sorts", { role: "radiogroup", "aria-label": "Sort by" });
      const list = h("div.ah-list", { role: "list" });
      const foot = h("p.m-foot.rs-foot");
      const hitNote = h("p.rs-hitnote", { hidden: true });
      body.append(subEl, pills, h("label.ah-search", null, icon("search", { size: 16 }), input), sortEl, hitNote, list, foot);
      input.addEventListener("input", () => {
        st.q = input.value;
        draw();
      });
      const title = sheet.el.querySelector(".m-sh h2");
      function draw() {
        const { list: all, ev0, P } = score(st.g);
        const L = P.L;
        if (title) title.textContent = titleOf(st.g);
        const prev = ev0.gws.find((s) => s.gw === st.g - 1);
        const sellM = prev ? prev.sell[out] : L.sellT(out) / 10;
        const wk = ev0.gws.find((s) => s.gw === st.g);
        const besides = (wk?.moves || []).some((m) => m.ok && m.out !== out);
        const own = (wk?.moves || []).filter((m) => m.ok && m.out === out).reduce((n, m) => n + m.sell - m.buy, 0);
        const bank = besides ? wk.bank - own : prev ? prev.bank : baseOf(ctx).bank;
        const banked = COPY.bankNow(fmt.money(bank), st.g, P.A, besides);
        fill(subEl, bank < -1e-9 ? `Sells for ${fmt.money(sellM)}, ${banked} (the plan's own): up to ${fmt.money(sellM)}` : `Sells for ${fmt.money(sellM)}, ${banked}: up to ${fmt.money(sellM + bank)}`);
        const others = P.mem?.hold ? "" : (weekOf(P, st.g)?.moves || []).filter((m) => m.out !== out).map((m) => `${L.name(m.out)} \u2192 ${L.name(m.in)}`).join(", ");
        const anyHit = all.some((o) => o.hit);
        fill(hitNote, anyHit ? COPY.replaceHit(st.g, others || null) : null);
        hitNote.hidden = !anyHit;
        weekPills(pills, P.gws, st.g, (g2) => valid.includes(g2), (g2) => {
          st.g = g2;
          draw();
        });
        const sorts = sortsOf(ctx, [BEST]), x = sorts.find((y) => y.key === st.sort) ?? BEST;
        sortChips(sortEl, sorts, st, P, st.g, draw);
        const statOf = x === BEST || x.xp || x.key === "price" ? () => null : (o) => {
          const v = x.val(P, o.row, st.g);
          return v == null ? null : h("span.rs-stat", null, ` \xB7 ${x.num(v)} ${x.unit(P, st.g)}`);
        };
        const q = norm(st.q.trim());
        const by = orderOf(x, st.flip, P, st.g, (o) => o.row);
        const last = (o) => !!o.blocked && o.code !== "budget";
        const shown = all.filter((o) => !q || found(o.row, q)).sort((a, b) => last(a) - last(b) || by(a, b)).filter((o, i) => i < CAP);
        for (const o of shown.filter((x2) => x2.code === "budget" && x2.delta == null && !x2.funded)) fund(o, st.g);
        const weeks = ownWeeks(P, st.g), top = barTop(L, shown, weeks);
        fill(list, shown.length ? shown.map((o) => {
          const rowEl = h(
            "button.ah-lrow",
            {
              // (one the bank can't pay for is made as it is: pick, never greyed)
              type: "button",
              role: "listitem",
              class: { blocked: !!o.blocked && o.code !== "budget" },
              disabled: (!o.blocked || o.code === "budget") && !plan(ctx)?.editable,
              "aria-label": o.blocked && o.code !== "budget" ? null : o.delta == null ? `Sell ${L.name(out)} for ${o.row.name} from GW${st.g}` : `Sell ${L.name(out)} for ${o.row.name} from GW${st.g}: ${COPY.listTotalSaid(o.delta, true)}`,
              onClick: () => pick(o)
            },
            // (no "bench in GW11" under a name: owner, 2026-11-10, "удали 'bench in gw11'")
            who(L, o.row, [statOf(o)]),
            bars(L, o.id, weeks, st.g, top, st.sort),
            // its ≈ over what it counts, your total; forecast points, blue with "xP" (ui.js xpGain; owner, 2026-10-22), no word
            // under it (owner, 2026-11-11, "fix this 'total' crap"); one the bank can't pay for its number as any row's, never
            // "£1.4m short" (owner, 2026-11-11, "remove x '£1.4m short' crap completely"), none where not even one more sale
            // pays for him (buyPlan 'none'); one you can't take says why (In team, your rule)
            h("span.rt.m-num", null, o.delta != null ? xpGain(o.delta, "span", null, true, "\u2248 ") : o.code === "budget" ? null : h("small", null, o.blocked))
          );
          return rowEl;
        }) : h("p.ah-empty", null, COPY.noneCalled(word, st.q.trim())));
        fill(foot, `"${BEST.name(P)}" is an estimate over ${COPY.span(P.gws)} (best XI each week but a lineup you saved); Forkcast confirms it.`);
        const g = st.g;
        if (P.editable) {
          presolveTaps(ctx, [
            ...shown.filter((o) => !o.blocked).map((o) => ({ kind: "sell", gw: g, run: () => sellOut(ctx, g, out, o.id) })),
            ...shown.filter((o) => o.code === "budget").map((o) => ({ kind: "bring", gw: g, run: () => {
              const bp = saleBuy(ctx, o.id, g, out);
              return bp.kind === "one" && bringIn(ctx, o.id, g, bp);
            } }))
          ], { gw: g, sig: `${g}|${st.sort}|${st.flip}|${q}`, owner: sheet });
        }
      }
      function pick(o) {
        if (o.blocked && o.code === "budget") {
          const P = plan(ctx), g = st.g;
          const bp = saleBuy(ctx, o.id, g, out);
          if (bp.kind !== "one") {
            sayBuyProblem(ctx, P, o.id, bp, "info");
            return;
          }
          if (!bringIn(ctx, o.id, g, bp)) return;
          sheet.close();
          ctx.navigate("ahead", { gw: g }, { replace: true, top: true });
          return;
        }
        const bar = o.code === "vetoed" ? barringRules(plan(ctx), o.id, st.g) : [];
        if (bar.length === 1) {
          toast(`Your rules keep ${o.row.name} out.`, "info", { action: { label: "Remove", onClick: () => {
            if (removeRule(ctx, bar[0].id)) {
              cache.clear();
              draw();
            }
          } } });
          return;
        }
        if (bar.length > 1) {
          const review = () => {
            sheet.close();
            openRules(ctx, st.g);
            ctx.navigate("ahead", { gw: st.g }, { replace: true });
          };
          toast(`Your rules keep ${o.row.name} out.`, "info", { action: { label: "Review", onClick: review } });
          return;
        }
        if (o.blocked) {
          toast(o.code === "owned" ? "Already in your team." : o.code === "vetoed" ? `Your rules keep ${o.row.name} out. Remove the rule on Ahead to allow him.` : problemText(ctx, o.problem, o.row.name), "info");
          return;
        }
        sell(o.id);
      }
      async function sell(inn) {
        if (st.busy) return;
        st.busy = true;
        const g = st.g;
        try {
          if (!sellOut(ctx, g, out, inn)) return;
          sheet.close();
          ctx.navigate("ahead", { gw: g }, { replace: true, top: true });
        } finally {
          st.busy = false;
        }
      }
      draw();
    }
  });
}
export {
  open
};
