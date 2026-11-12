import {
  STAT,
  WORD,
  cardOf,
  keepStatsView,
  pastSums,
  segControl,
  statsView,
  statusOf
} from "../chunks/chunk-TEOTBFD6.js";
import {
  inputsOf,
  plan,
  presolveTaps,
  xpShown
} from "../chunks/chunk-677LBVT3.js";
import {
  oppText
} from "../chunks/chunk-IBIGFFAK.js";
import {
  COPY,
  compare,
  fill,
  fmt,
  h,
  posCode,
  posName,
  svg,
  xpGain,
  xpMark,
  xpNum
} from "../chunks/chunk-TCPZEJ5A.js";
import "../chunks/chunk-Y6DMPKP6.js";
import "../chunks/chunk-WSFCRVEQ.js";

// js/m/sheets/why.js
var num = (v) => v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
var span = (gws) => COPY.span(gws);
var DASH = "\u2013";
var cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
function open(ctx, spec = {}) {
  const inputs = ctx.bundle?.entry && ctx.data ? inputsOf(ctx) : null;
  const P = inputs ? plan(ctx) : null;
  if (!P || !spec.a || !spec.b) return null;
  const why = { a: spec.a, b: spec.b, cmp: compare(inputs, spec.a.road, spec.b.road), noise: num(inputs.noise) ?? 0, A: inputs.A };
  let me = null;
  return ctx.sheets.open({
    title: spec.title,
    sub: spec.sub,
    detent: "medium",
    detents: ["medium", "large"],
    cls: "wy-sheet",
    // its taps (spec.presolve: Take it, Remove, Keep, Not, Move to GWn) solved ahead while it is open (owner,
    // 2026-10-26)
    onClose: () => presolveTaps(ctx, null, { owner: me }),
    build(body, sheet) {
      me = sheet;
      if (spec.presolve?.length) presolveTaps(ctx, spec.presolve, { gw: spec.gw ?? null, owner: sheet });
      if (spec.reason) body.append(h("p.wy-reason", null, spec.reason));
      if (spec.acts?.length) {
        const btn = (a, cls) => h(cls, {
          // `said`: its spoken label where the shown one is short ("Take it": the title names the move)
          // (a take, a.swap: the one mark, .m-swap, as its row's and its place's)
          type: "button",
          class: a.swap ? { "m-swap": true, best: a.swap === "best", quiet: a.swap === "quiet" } : { acc: !!a.fill, "m-danger": !!a.danger && !a.fill },
          disabled: !!a.disabled,
          "aria-label": a.said ?? null,
          onClick: () => {
            if (a.act() !== false) sheet.close();
          }
        }, a.label);
        const acts = spec.acts.filter((a) => !a.link), links = spec.acts.filter((a) => a.link);
        if (acts.length) body.append(h("div.ah-btnrow.wy-acts", null, acts.map((a) => btn(a, "button"))));
        for (const a of links) body.append(btn(a, "button.m-nav"));
      }
      const g = spec.gw ?? P.A, gws = P.gws.filter((x) => x >= g);
      const past = h("p.m-foot.wy-fn.wy-past", { hidden: true }, COPY.statsPast(gws));
      for (const pr of spec.pairs || []) body.append(pairTable(ctx, P, pr, g, gws, () => {
        past.hidden = false;
      }));
      body.append(past);
      if (spec.changes?.rows.length) body.append(h("div.m-sec.wy-chg", null, h("h3", null, spec.changes.head), h("div.ah-moves.sq", null, spec.changes.rows)));
      const when = spec.when?.weeks?.length ? whenLine(spec.when, sheet) : null;
      if (spec.facts?.length || when) {
        body.append(h(
          "div.m-sec.wy-also",
          null,
          h("h3", null, "What else changes"),
          spec.facts?.length ? h("ul.wy-facts", null, spec.facts.map((t) => h("li", null, cap(t)))) : null,
          when?.line,
          when?.note,
          when?.go
        ));
      }
      if (spec.later) body.append(h("div.m-sec.wy-after", null, h("h3", null, spec.later.head), h("ul.wy-facts", null, spec.later.lines.map((t) => h("li", null, t)))));
      const runs = h("div");
      body.append(runs);
      if (why.cmp?.runs) Promise.resolve(ctx.api?.access?.()).then((a) => {
        if (a?.local && runs.isConnected) runs.replaceWith(runStrip(why, sheet));
      }).catch(() => {
      });
    }
  });
}
function statusCell(r) {
  const fl = statusOf(r);
  if (!fl) return { node: h("span.wy-st.ok", null, h("i.dot", { "aria-hidden": "true" }), "Available"), said: "available" };
  return { node: h("span.wy-st", { class: fl.tone }, h("i.dot", { "aria-hidden": "true" }), fl.short), sub: fl.reason || null, said: [fl.short, fl.reason].filter(Boolean).join(", ") };
}
function pairTable(ctx, P, pr, g, gws, onStats) {
  const d = ctx.data, L = P.L;
  const ids = [Number(pr.in), Number(pr.out)];
  const rows = ids.map((id) => d.byId?.get(id));
  if (rows.some((r) => !r)) return null;
  const nm = ids.map((id) => L.name(id));
  const role = pr.yours ? ["Choice", "Yours"] : ["In", "Out"];
  const cellOf = (c, i) => {
    const o = c && typeof c === "object" && !Array.isArray(c) && "node" in c ? c : { node: c };
    return h(
      "div.c",
      { role: "cell", "aria-label": o.said ? `${nm[i]}, ${o.said}` : null },
      o.aux ? h("span.a", { class: { on: !!o.on } }, o.aux) : null,
      h("span.v", null, o.node ?? DASH),
      o.sub ? h("span.o", null, o.sub) : null
    );
  };
  const row = (label, cells, cls = "", dataset = null) => h(`div.r${cls}`, { role: "row", dataset }, h("div.n", { role: "rowheader" }, label), cells.map(cellOf));
  const grp = (label, extra = null, dataset = null) => h("div.grp", { role: "row", dataset }, h("span", { role: "rowheader" }, label), extra);
  const fxs = (row2, x) => ctx.pitch?.fixturesAt?.(row2, x, d.xpGws) || [];
  const opp = (row2, x) => {
    const f = fxs(row2, x);
    return f.length ? f.map((o, j) => h("span", { class: o.fdr ? `ah-fdrc fdr-${o.fdr}` : null }, j < f.length - 1 ? `${oppText(o)} +` : oppText(o))) : DASH;
  };
  const oppSaid = (row2, x) => fxs(row2, x).map((f) => `${String(f.opp).toUpperCase()} ${f.home ? "home" : "away"}`).join(" and ") || "no match";
  const xpAt = (row2, x) => num(ctx.pitch?.xpAt?.(row2, x, d.xpGws));
  const money = (x) => num(x) == null ? DASH : fmt.money(x);
  const sale = pr.sell ?? L.price(ids[1]), now = num(rows[1].price);
  const owned = (r) => num(r.sel_pct) == null ? DASH : fmt.pct(r.sel_pct);
  const later = h("div.wy-later");
  const box = h(
    "div.wy-cmp",
    { role: "table", "aria-label": pr.yours ? `${nm[0]}, your choice, against ${nm[1]}, yours` : `${nm[0]} in, ${nm[1]} out` },
    h(
      "div.r.hd",
      { role: "row" },
      h("div.n", { role: "columnheader" }),
      // each name his card: over a Week sheet it takes the Why sheet's place (app.js: two sheets at most), Back the
      // Week sheet; a link in the content's own ink, "Mbeumo ›" (m-ahead.css .wy-pn), never the accent's button green
      ids.map((id, i) => h(
        "div.c",
        { role: "columnheader", "aria-label": `${nm[i]}, ${role[i].toLowerCase()}` },
        h("span.o", { "aria-hidden": "true" }, role[i]),
        h("button.wy-pn", { type: "button", "aria-haspopup": "dialog", "aria-label": COPY.cardOf(nm[i]), onClick: () => ctx.openSheet("player", id, { gw: g }) }, nm[i])
      ))
    ),
    row("Club", rows.map((r, i) => `${r.club ?? DASH} \xB7 ${posCode(L.pos(ids[i]) ?? posName(r.pos))}`)),
    // against your buy both are buys, each his price; else the sale's at FPL's sale price, his price now under it
    row("Price", [money(pr.buy ?? L.price(ids[0])), pr.yours ? money(sale) : {
      node: money(sale),
      sub: num(sale) != null && now != null && Math.abs(sale - now) >= 0.05 ? `now ${fmt.money(now)}` : null,
      said: `sells for ${money(sale)}${now != null ? `, now ${fmt.money(now)}` : ""}`
    }]),
    row("Owned", rows.map(owned)),
    row("Status", rows.map(statusCell)),
    // each forecast in its blue (ui.js xpNum); "Total xP" says once what they all are, its unit in the row's label so
    // the totals' digits stand on the weeks' digit edge
    grp(`${COPY.gridUnit} \xB7 ${span(gws)}`),
    gws.map((x) => row(`GW${x}`, ids.map((id, i) => ({
      node: xpNum(xpShown(ctx, id, x), "span", null, false),
      aux: opp(rows[i], x),
      said: `GW${x} ${xpShown(ctx, id, x)}, ${oppSaid(rows[i], x)}`
    })))),
    row(["Total", xpMark()], rows.map((r) => {
      const xs = gws.map((x) => xpAt(r, x));
      return xs.some((v) => v != null) ? { node: xpNum(fmt.pts(xs.reduce((s, v) => s + (v ?? 0), 0)), "span", null, false) } : DASH;
    }), ".tot"),
    later
  );
  const cards = [void 0, void 0];
  let view = statsView(ctx);
  const paint = () => {
    const past = cards.map((c) => c === void 0 ? null : c?.last_matches ?? []);
    const sums = past.map((p) => p?.length ? pastSums(p) : null);
    const n = Math.max(0, ...past.map((p) => p?.length ?? 0)) || 6;
    const kids = [
      grp(`Last ${n} matches`),
      row("Points", sums.map((s) => s ? String(s.pts) : DASH)),
      row("Minutes", sums.map((s) => s ? `${s.mins}\u2032` : DASH))
    ];
    const st = cards[0]?.stats, mine = st?.[view], theirs = st?.vs?.[view];
    if (mine && theirs && Object.values(mine.rows).some((r) => r.value != null)) {
      const [g0, g1] = cards[0].season_rounds ?? [];
      kids.push(grp(COPY.statsHead(g0, g1, mine.n, WORD[mine.pos]), segControl({
        opts: [["match", "Match", "Per match"], ["p90", "Per 90", "Per 90 minutes"]],
        current: view,
        label: "Stats per match or per 90 minutes",
        cls: ".small",
        onPick: (v) => {
          view = v;
          keepStatsView(ctx, v);
          paint();
        }
      }), { view }));
      for (const [k, r] of Object.entries(mine.rows)) {
        const [lab, dp] = STAT[k] ?? [k, 1];
        const rk = [r?.rank, theirs.rows[k]?.rank];
        const best = rk.every((v) => v != null) && rk[0] !== rk[1] ? rk[0] < rk[1] ? 0 : 1 : -1;
        const cell = (x, of, i) => ({
          node: x?.value == null ? DASH : x.value.toFixed(dp),
          aux: x?.rank == null ? null : fmt.ordinal(x.rank),
          on: i === best,
          said: `${x?.value == null ? "none" : x.value.toFixed(dp)}${x?.rank == null ? "" : `, ${fmt.ordinal(x.rank)} of ${of.n} ${WORD[of.pos] ?? "players"}`}`
        });
        kids.push(row(lab, [cell(r, mine, 0), cell(theirs.rows[k], theirs, 1)], ".st", { key: k, in: r.value ?? "", out: theirs.rows[k]?.value ?? "" }));
      }
      onStats?.();
    }
    fill(later, kids);
  };
  paint();
  let shown = false;
  const alive = () => !shown || box.isConnected;
  (globalThis.requestAnimationFrame ?? setTimeout)(() => {
    shown = box.isConnected;
  });
  cardOf(ctx, ids[0], ids[1], alive).then((c) => {
    cards[0] = c;
  }, () => {
    cards[0] = null;
  }).then(paint);
  cardOf(ctx, ids[1], null, alive).then((c) => {
    cards[1] = c;
  }, () => {
    cards[1] = null;
  }).then(paint);
  return box;
}
function whenLine(when, sheet) {
  let sel = when.weeks.find((w) => w.current && w.ok)?.gw ?? null;
  const items = when.weeks.map((w) => {
    const unsaid = w.ok ? null : { "aria-hidden": "true" };
    const kids = [
      h("span.g", unsaid, `GW${w.gw}`),
      h("span.v.m-num.wy-wv", unsaid, w.ok ? w.delta == null ? "" : xpGain(w.delta) : "\u2014")
    ];
    if (w.ok) {
      return h("button.ah-ap.wy-wk", {
        type: "button",
        class: { cur: w.current },
        dataset: { gw: w.gw },
        "aria-pressed": "false",
        "aria-label": w.current ? COPY.whenHere(w.gw, w.delta) : COPY.whenWeek(w.gw, w.delta),
        onClick: () => {
          sel = w.gw;
          paint();
        }
      }, kids);
    }
    return h("span.ah-ap.bad.wy-wk.off", { dataset: { gw: w.gw } }, kids, h("span.sr-only", null, COPY.whenNone(w.gw)));
  });
  const line = h(
    "div.wy-when",
    { role: "group", "aria-label": when.vs ? `${COPY.whenHead}: ${when.vs}` : COPY.whenHead },
    h("span.wy-wl", { "aria-hidden": "true" }, COPY.whenHead),
    h("div.ah-apills", null, items)
  );
  const go = h("div.ah-btnrow.wy-go");
  function paint() {
    for (const b of line.querySelectorAll("button.wy-wk")) {
      const on = Number(b.dataset.gw) === sel;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("sel", on);
    }
    const w = when.weeks.find((x) => x.gw === sel && x.ok);
    const can = !!w && !w.current;
    go.hidden = !can;
    fill(go, can ? h("button", {
      type: "button",
      disabled: !!when.disabled,
      "aria-label": COPY.whenMove(w.gw, w.delta),
      onClick: () => {
        if (when.pick(w.gw) !== false) sheet.close();
      }
    }, `${COPY.whenVerb} GW${w.gw}`) : null);
  }
  paint();
  const note = when.vs ? h("p.wy-wnote", { "aria-hidden": "true" }, when.vs) : null;
  return { line, note, go };
}
function runStrip(why, sheet) {
  const c = why.cmp;
  const n = why.noise;
  const winner = c.delta >= 0 ? why.a.label : why.b.label;
  const lead = c.lead ?? 0;
  const agree = `${COPY.agreement(lead, c.runs)} back ${winner}`;
  const scale = runGaps(c) !== c.diffs ? ` on GW${why.A}'s scale` : "";
  const capDots = `Each dot is one forecast run: ${why.a.label} minus ${why.b.short}, ${span(c.gws)}, in points${scale}.${n > 0 ? ` Shaded: within \xB1${fmt.num(n, 2)} pts, ${COPY.chargeName}.` : ""}`;
  const capLines = `Each line is one forecast run: the running gain of ${why.a.label} over ${why.b.label}, ${span(c.gws)}.`;
  const box = h("div.m-well.wy-box");
  const caption = h("p.m-foot.wy-fn");
  let lines = false;
  const paint = () => {
    fill(box, lines ? linesSvg(c, n) : swarmSvg(c, n, agree));
    caption.textContent = lines ? capLines : capDots;
  };
  const multi = c.gws.length > 1;
  const btn = multi ? h("button.wy-tgl", {
    type: "button",
    "aria-pressed": "false",
    onClick: () => {
      lines = !lines;
      btn.classList.toggle("on", lines);
      btn.setAttribute("aria-pressed", String(lines));
      btn.textContent = lines ? "Show dots" : "Show runs";
      paint();
      if (lines) sheet.setDetent("large");
    }
  }, "Show runs") : null;
  paint();
  return h(
    "div.m-sec",
    null,
    h("h3", null, h("span", null, "Every forecast run"), btn),
    h("p.wy-agree", null, agree, h("span.m-foot", null, ". For information only: Forkcast plans on the average forecast.")),
    box,
    caption
  );
}
var runGaps = (c) => c?.diffsRef ?? c?.diffs ?? [];
var runTones = (c, noise) => Array.from(runGaps(c), (v) => v > noise ? "pos" : v < -noise ? "neg" : "mid");
function swarmSvg(c, noise, label) {
  const vals = [...runGaps(c)];
  const tones = runTones(c, noise);
  const w = 350, ht = 104, r = 4.3, cy = 56;
  const lo = Math.min(-noise * 2, ...vals), hi = Math.max(noise * 2, ...vals);
  const pad = (hi - lo) * 0.08 || 0.5;
  const x0 = lo - pad, x1 = hi + pad;
  const X = (v) => 10 + (v - x0) / (x1 - x0) * (w - 20);
  const placed = [];
  [...vals].map((v, i) => ({ v, i })).sort((p, q) => p.v - q.v).forEach((o) => {
    const x = X(o.v);
    let k = 0, y = cy;
    while (placed.some((p) => Math.hypot(p.x - x, p.y - y) < 2 * r + 0.8) && k < 40) {
      k++;
      y = cy + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * (r * 1.05);
    }
    placed.push({ x, y, v: o.v, i: o.i });
  });
  const step = x1 - x0 > 6 ? 2 : x1 - x0 > 2.5 ? 1 : 0.5;
  const ticks = [];
  for (let t = Math.ceil(x0 / step) * step; t <= x1; t += step) ticks.push(Number(t.toFixed(2)));
  return svg(
    "svg",
    { class: "wy-swarm", viewBox: `0 0 ${w} ${ht}`, width: "100%", role: "img", "aria-label": label },
    noise > 0 ? svg("rect", { class: "band", x: X(-noise), y: 10, width: X(noise) - X(-noise), height: ht - 34, rx: 6 }) : null,
    svg("line", { class: "zero", x1: X(0), x2: X(0), y1: 12, y2: ht - 24 }),
    ticks.map((t) => svg("text", { x: X(t), y: ht - 8, "text-anchor": "middle" }, `${t > 0 ? "+" : t < 0 ? "\u2212" : ""}${Math.abs(t)}`)),
    placed.map((p, j) => svg("circle", { class: `dot ${tones[p.i]}`, style: { "animation-delay": `${j * 20}ms` }, cx: p.x.toFixed(1), cy: p.y.toFixed(1), r }))
  );
}
function linesSvg(c, noise) {
  const w = 350, ht = 150;
  const all = c.cumRuns.flat();
  const lo = Math.min(-noise * 2, 0, ...all), hi = Math.max(noise * 2, 0, ...all);
  const pad = (hi - lo) * 0.1 || 0.5;
  const y = (v) => 14 + (1 - (v - lo + pad) / (hi - lo + 2 * pad)) * (ht - 34);
  const xs = c.gws.map((_, i) => 34 + i * ((w - 50) / Math.max(1, c.gws.length - 1)));
  const tones = runTones(c, noise);
  return svg(
    "svg",
    { class: "wy-swarm wy-lines", viewBox: `0 0 ${w} ${ht}`, width: "100%", role: "img", "aria-label": "Cumulative gain per forecast run" },
    noise > 0 ? svg("rect", { class: "band", x: 30, y: y(noise), width: w - 40, height: y(-noise) - y(noise), rx: 4 }) : null,
    svg("line", { class: "zero", x1: 30, x2: w - 10, y1: y(0), y2: y(0) }),
    c.gws.map((g, i) => svg("text", { x: xs[i], y: ht - 6, "text-anchor": "middle" }, `GW${g}`)),
    svg("text", { x: 4, y: y(0) + 3 }, "0"),
    c.cumRuns.map((run, r) => svg("polyline", { class: `ln ${tones[r]}`, style: { "animation-delay": `${r * 16}ms` }, points: run.map((v, i) => `${xs[i].toFixed(1)},${y(v).toFixed(1)}`).join(" ") }))
  );
}
export {
  open
};
