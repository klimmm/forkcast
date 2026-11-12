import {
  liftsLive,
  pinOf,
  pinsOf,
  plan,
  presolveTaps,
  removeRule,
  ruleOf,
  sellWeek,
  shirtOf,
  squadBefore,
  squadWeek,
  weekOf
} from "./chunk-677LBVT3.js";
import {
  oppText
} from "./chunk-IBIGFFAK.js";
import {
  COPY,
  fill,
  fmt,
  getPlayer,
  h,
  newsReason,
  posCode,
  posName,
  priceProgress,
  roving,
  statusInfo,
  xpNum
} from "./chunk-TCPZEJ5A.js";
import {
  CODE_SCALE,
  cupCode,
  cupMinutes,
  cupName,
  futureColumns,
  layout,
  pastColumns,
  within
} from "./chunk-Y6DMPKP6.js";
import {
  __export
} from "./chunk-WSFCRVEQ.js";

// js/m/sheets/player.js
var player_exports = {};
__export(player_exports, {
  NEXT_N: () => NEXT_N,
  STAT: () => STAT,
  WORD: () => WORD,
  cardOf: () => cardOf,
  keepStatsView: () => keepStatsView,
  open: () => open,
  pastSums: () => pastSums,
  segControl: () => segControl,
  statsView: () => statsView,
  statusLines: () => statusLines,
  statusOf: () => statusOf,
  stripKey: () => stripKey
});
var PREVIEW = { S: "Predicted to start", B: "Predicted bench", O: "Predicted out", D: "Predicted doubtful", DS: "Predicted doubtful" };
var LAST_N = 6;
var NEXT_N = 6;
var WORD = { GK: "goalkeepers", DEF: "defenders", MID: "midfielders", FWD: "forwards" };
var STAT = {
  shots_inside_box: ["Shots in box", 1],
  touches_inside_box: ["Touches in box", 1],
  key_passes: ["Key passes", 1],
  xg_opta: ["xG", 2],
  xa_opta: ["xA", 2],
  xgi_opta: ["xGI", 2],
  clearances: ["Clearances", 1],
  interceptions: ["Interceptions", 1],
  aerial_duel_won: ["Aerials won", 1],
  total_saves: ["Saves", 1],
  saves_inside_box: ["Saves in box", 1],
  recoveries: ["Recoveries", 1],
  defensive_contribution: ["Def. contribution", 1],
  clean_sheets: ["Clean sheets", 2],
  goals_conceded: ["Goals conceded", 2],
  expected_goals_conceded: ["xG conceded", 2],
  tackles_successful: ["Tackles won", 1],
  bcc: ["Big chances made", 2],
  shots_on_target: ["Shots on target", 1],
  successful_dribbles: ["Dribbles", 1],
  passes_inside_box: ["Passes into box", 1],
  goals_scored: ["Goals", 2],
  assists: ["Assists", 2],
  blocked_shots: ["Blocks", 1],
  cross_completed: ["Crosses", 1],
  cross_completed_open_play: ["Open-play crosses", 1],
  cross_completed_set_piece: ["Set-piece crosses", 1],
  through_ball_completed: ["Through balls", 2],
  shots_six_yards: ["Six-yard shots", 2],
  shots_outside_box: ["Shots outside box", 1],
  shots_middle_side: ["Central shots", 1],
  shots_left_side: ["Shots from left", 1],
  shots_right_side: ["Shots from right", 1],
  penalties_scored: ["Penalties scored", 2],
  saves_outside_box: ["Saves outside box", 1],
  penalties_saved: ["Penalties saved", 2],
  clearances_off_line: ["Off-line clearances", 2]
};
var CARDS = /* @__PURE__ */ new Map();
function cardOf(ctx, id, vs = null, alive = () => true) {
  const own = fromBundle(ctx.bundle?.cards, Number(id), vs == null ? null : Number(vs));
  if (own) return Promise.resolve(own);
  const key = `${ctx.bundle?.version ?? ""}:${id}:${vs ?? ""}`;
  if (!CARDS.has(key)) {
    if (CARDS.size > 40) CARDS.delete(CARDS.keys().next().value);
    const it2 = { alive: [] };
    const ask = (k) => getPlayer({ id, entry: ctx.bundle?.entry?.id, vs }).catch((e) => {
      if (e?.status === 404 || !it2.alive.some((f) => f())) throw e;
      return new Promise((ok) => setTimeout(ok, RETRY_MS[Math.min(k, RETRY_MS.length - 1)])).then(() => ask(k + 1));
    });
    it2.p = ask(0).catch((e) => {
      CARDS.delete(key);
      throw e;
    });
    CARDS.set(key, it2);
  }
  const it = CARDS.get(key);
  it.alive.push(alive);
  return it.p;
}
var RETRY_MS = [2e3, 4e3, 8e3, 15e3];
function fromBundle(cards, id, vs) {
  const me = cards?.players?.[id], other = vs == null ? null : cards?.players?.[vs];
  if (!me || vs != null && !other) return null;
  const p0 = (k) => !!me.stats?.[k];
  const strip = (p, view, all = false) => {
    const st = p.stats?.[view];
    return st ? {
      pos: p.pos,
      n: all ? st.n_all : st.n,
      min: st.min,
      peer_min: st.peer_min,
      matches: st.matches,
      rows: Object.fromEntries(me.rows.map((k) => [k, { value: st.rows[k]?.[0] ?? null, rank: st.rows[k]?.[all ? 2 : 1] ?? null }])),
      dist: Object.fromEntries(me.rows.map((k) => [k, cards.dist?.[view]?.[all ? "ALL" : p.pos]?.[k] ?? []]))
    } : null;
  };
  const KEYS = ["match", "p90", ...["match", "p90"].map((v) => `${v}${RECENT_SUFFIX}`).filter((k) => p0(k))];
  const views = (p) => ({ ...Object.fromEntries(KEYS.map((k) => [k, strip(p, k)])), all: Object.fromEntries(KEYS.map((k) => [k, strip(p, k, true)])) });
  const stats = me.rows ? {
    ...views(me),
    kinds: me.kinds,
    ...other?.stats && other.pos === me.pos ? { vs: views(other) } : {}
  } : null;
  return {
    season: cards.season,
    season_rounds: cards.season_rounds,
    pos: me.pos,
    pos_avg: me.pos_avg,
    last_matches: me.last_matches,
    cups: me.cups,
    cup_next: cards.cup_next?.[me.club] ?? [],
    stats
  };
}
function open(ctx, rawId, { gw, place = null, vs = null } = {}) {
  const id = Number(rawId);
  const d = ctx.data;
  const row = d?.byId.get(id);
  const P0 = plan(ctx);
  if (!row || !P0) {
    return ctx.sheets.open({
      title: row?.name ?? `Player ${id}`,
      detent: "small",
      build(body) {
        body.append(h("p.m-para", null, row ? "Your plan is still being found. Try again in a moment." : "Not in this forecast."));
      }
    });
  }
  const shownGw = Number(ctx.store.get("gw"));
  const g = P0.gws.includes(Number(gw)) ? Number(gw) : P0.gws.includes(shownGw) ? shownGw : P0.A;
  let off = null, card, cardState = "loading", local = false, closed = false;
  const entry = d.base?.squad?.find((r) => Number(r.id) === id);
  const subEl = h("small.ps-sub", null, headerSub(row, P0.L.pos(id), null, entry));
  const orow = vs == null ? null : d.byId.get(Number(vs)) ?? null, two = !!orow;
  let self = null, vsCard = null;
  const pick = (pid, to) => h("button.ps-pick", { type: "button", "aria-haspopup": "dialog", "aria-label": COPY.comparePick(P0.L.name(pid)), onClick: () => {
    ctx.openSheet("wish", null, { gw: g, pos: P0.L.pos(pid), compare: {
      title: COPY.comparePick(P0.L.name(pid)),
      pick: (x) => {
        const [a, b] = to(Number(x));
        ctx.openSheet("player", a, { gw: g, vs: b });
      },
      back: () => ctx.openSheet("player", id, { gw: g, vs })
    } });
  } }, P0.L.name(pid), h("i.ps-chev", { "aria-hidden": "true" }));
  const side = (pid, r, sub, me) => h(
    `span.ps-side${me ? "" : ".vs"}`,
    null,
    h("span.ps-kit", { "aria-hidden": "true" }, shirtOf(P0.L, pid, 40)),
    h(
      "span",
      null,
      h("span.ps-nm", null, h(`span.${me ? "ps-memark" : "ps-vsmark"}`, { "aria-hidden": "true" }), pick(pid, (x) => me ? [x, vs] : [id, x])),
      sub,
      statusLines(r, P0, { available: false, lineup: false })
    )
  );
  return self = ctx.sheets.open({
    title: two ? h("span.ps-title.ps-two", null, side(id, row, subEl, true), side(Number(vs), orow, h("small.ps-sub", null, headerSub(orow, P0.L.pos(vs), null, null)), false)) : h(
      "span.ps-title",
      null,
      h("span.ps-kit", { "aria-hidden": "true" }, shirtOf(P0.L, id, 56)),
      // full name (owner, 2026-10-16), FPL's short one in older data
      h("span", null, row.full_name || row.name, subEl)
    ),
    label: two ? COPY.compareOf(P0.L.name(id), P0.L.name(vs)) : `${row.full_name || row.name}, ${row.club}, ${fmt.money(row.price)}`,
    // full screen (owner, 2026-10-15)
    detent: "large",
    cls: "ps",
    onClose: () => {
      closed = true;
      off?.();
      presolveTaps(ctx, null, { owner: row });
    },
    build(body, sheet) {
      let view = statsView(ctx);
      const setView = (v) => {
        view = v;
        keepStatsView(ctx, v);
        draw();
      };
      let among = statsAmong(ctx);
      const setAmong = (v) => {
        among = v;
        try {
          ctx.api?.local?.set?.(STATS_AMONG_KEY, v);
        } catch {
        }
        draw();
      };
      let period = statsPeriod(ctx);
      const setPeriod = (v) => {
        period = v;
        try {
          ctx.api?.local?.set?.(STATS_SPAN_KEY, v);
        } catch {
        }
        draw();
      };
      off = ctx.store.on("memory", () => queueMicrotask(draw));
      const draw = () => {
        const P = plan(ctx);
        const main = body.querySelector(".ps-main") || body.appendChild(h("div.ps-main"));
        main.dataset.card = cardState;
        const W = widthOf(main);
        const m = model(ctx, P, row, id, card, cardState, local, vs, vsCard);
        const G = geometry(m, W);
        fill(subEl, headerSub(row, P.L.pos(id), card, entry));
        const grp = document.activeElement?.closest?.('.ps-main [role="radio"]')?.closest('[role="radiogroup"]');
        const info = document.activeElement?.closest?.(".ps-main .ps-info")?.getAttribute("aria-label");
        const kept = grp ? `${grp.getAttribute("aria-labelledby") ? `[aria-labelledby="${grp.getAttribute("aria-labelledby")}"]` : `[aria-label="${grp.getAttribute("aria-label")}"]`} [aria-checked="true"]` : info ? `.ps-info[aria-label="${info}"]` : null;
        fill(
          main,
          two ? null : actions(P),
          two ? null : askLine(P),
          two ? null : statusLines(row, P, { available: false, lineup: false }),
          // (two compared: one strip, the two in every GW column, league games only)
          stripSection(two ? { ...m, two: true, rows: [row, orow], nameA: P.L.name(id), from: g } : m, G, chartKey),
          statsSection(card, W, { view, setView, among, setAmong, period, setPeriod }, two)
        );
        if (kept) main.querySelector(kept)?.focus({ preventScroll: true });
        if (P.editable) presolveTaps(ctx, aheadTaps(P), { gw: g, owner: row });
      };
      const aheadTaps = (P) => [pinOf(P, "keep", id, g), pinOf(P, ["sell", "veto", "never"], id, g)].filter(Boolean).map((q) => ({ kind: "rule", gw: g, run: () => removeRule(ctx, q.id) }));
      const keyOf = () => {
        const k = { open: false, toggle: () => {
          k.open = !k.open;
          draw();
        } };
        return k;
      };
      const chartKey = keyOf();
      const close = () => sheet.close();
      const liveWhy = (P, q) => liftsLive(ctx, P, q) ? h("p.ps-off.m-foot", null, COPY.live(P.A)) : null;
      const owns = (P) => weekOf(P, g).squad.includes(id) || squadBefore(P, g).includes(id);
      function askLine(P) {
        const pin = pinOf(P, "sell", id) ?? pinOf(P, "wish", id) ?? pinsOf(P, ["keep", "veto", "never"], id)[0] ?? null;
        if (!pin) return null;
        const word = pin.kind === "sell" ? pin.label || "Sold by your pick" : pin.kind === "wish" ? pin.label || "Added by you" : ruleOf(P, pin).text;
        const undo = "Remove";
        return h(
          "div.ps-ask",
          null,
          h("span", null, word),
          h("button.m-chipbtn.m-danger", { type: "button", disabled: !P.editable || liftsLive(ctx, P, pin), onClick: () => removeRule(ctx, pin.id) }, undo),
          P.editable ? liveWhy(P, pin) : h("p.ps-off.m-foot", null, P.why)
        );
      }
      function actions(P) {
        const b = (label, onClick, cls = "", off2 = false) => h("button", { type: "button", class: cls, disabled: !P.editable || off2, onClick }, label);
        let grid;
        if (owns(P)) {
          const w = weekOf(P, g), from = pinOf(P, "sell", id) ? null : sellWeek(ctx, P, id, g);
          grid = [
            b(COPY.replaceGo, () => {
              close();
              ctx.openSheet("replace", id, from);
            }, "", from == null),
            b(COPY.subGo, () => {
              close();
              ctx.openSheet("sub", id, g);
            }, "", squadWeek(w) || !(w.xi.includes(id) || w.bench.includes(id)))
          ];
        } else {
          grid = [
            // no ask; a Never of him goes when a week is picked, and the verdict names it (Undo restores it)
            // the week you chose him in is preselected (owner, 2026-10-09); every sheet closes first
            // a secondary button; no Not him (owner, 2026-11-09, "hide 'not him'")
            b("Bring him in\u2026", () => {
              ctx.sheets.closeAll();
              ctx.openSheet("wish", id, { gw: g });
            }),
            // Compare: his position's players in Bring in a player's own list, a pick the two side by side, a close without
            // one his card again (the compared name's door, `pick` above); never off, it changes nothing (owner,
            // 2026-11-09, "add compare button")
            h("button", { type: "button", "aria-haspopup": "dialog", onClick: () => ctx.openSheet("wish", null, { gw: g, pos: P0.L.pos(id), compare: {
              title: COPY.comparePick(P0.L.name(id)),
              pick: (x) => ctx.openSheet("player", id, { gw: g, vs: Number(x) }),
              back: () => ctx.openSheet("player", id, { gw: g })
            } }) }, COPY.compareGo)
          ];
        }
        return h(
          "div.ps-acts",
          null,
          h("div.ps-grid", null, grid),
          P.editable ? null : h("p.ps-off", null, P.why),
          place ? h("button.ah-lnk.ps-place", { type: "button", onClick: () => {
            close();
            place.open();
          } }, COPY.placeChoices(place.n)) : null
        );
      }
      draw();
      if (two) cardOf(ctx, vs, null, () => !closed).then((c) => {
        vsCard = c;
        draw();
      }, () => {
      });
      cardOf(ctx, id, two ? vs : null, () => !closed).then((c) => {
        card = c;
        cardState = "ready";
      }, () => {
        cardState = "none";
      }).then(draw);
      Promise.resolve(ctx.api?.access?.()).then((a) => {
        if (a?.local) {
          local = true;
          draw();
        }
      }).catch(() => {
      });
    }
  });
}
function widthOf(el) {
  const w = el?.clientWidth || Math.min(globalThis.innerWidth || 390, 430) - 32;
  return Math.max(260, Math.round(w));
}
function priceFact(row, entry) {
  if (!Number.isFinite(row.price)) return null;
  const c = priceProgress(row, entry);
  return [
    fmt.money(row.price),
    c ? h(`span.ps-pg.t${c.tone}`, { role: "img", "aria-label": COPY.progressSaid(c.text) }, c.text) : null,
    c?.sale ? h("span.ps-sl", { role: "img", "aria-label": COPY.saleSaid(c.sale) }, COPY.saleDrops) : null
  ];
}
function headerSub(row, pos, card, entry) {
  const sel = card?.now?.sel_pct ?? row.sel_pct;
  return [row.club, posCode(pos), priceFact(row, entry), Number.isFinite(sel) ? `${fmt.pct(sel)} owned` : null].filter(Boolean).map((x) => h("span", null, x));
}
function statusOf(row) {
  const st = statusInfo(row.status, row.chance);
  if (st.tone === "ok" && st.chance !== 0) return null;
  const c = st.chance ?? (st.tone === "bad" ? 0 : null);
  return { tone: st.tone === "bad" || c != null && c <= 25 ? "red" : "amber", short: c != null ? `${c}%` : st.label.split(" \xB7 ")[0], reason: newsReason(row) };
}
function statusLines(row, P, { available = true, name = null, lineup = true } = {}) {
  const lines = [];
  const fl = statusOf(row);
  if (fl) lines.push(h("p.ps-st", { class: fl.tone }, h("i.dot", { "aria-hidden": "true" }), [name, fl.short, fl.reason || null].filter(Boolean).join(" \xB7 ")));
  const pre = lineup ? PREVIEW[row.ws_preview] : null;
  if (pre) lines.push(h("p.ps-st.ws", { class: row.ws_preview === "S" ? "ok" : "grey" }, h("i.dot", { "aria-hidden": "true" }), [name, `${pre} GW${P.A}`, "WhoScored"].filter(Boolean).join(" \xB7 ")));
  if (!available && lines.every((p) => p.classList.contains("ok"))) return null;
  if (!lines.length) lines.push(h("p.ps-st.ok", null, h("i.dot", { "aria-hidden": "true" }), "Available"));
  return h("div.ps-status", null, lines);
}
function xpRank(ctx, pos, xp, g) {
  if (!Number.isFinite(xp)) return null;
  const d = ctx.data;
  const vs = d.rows.filter((r) => posName(r.pos) === pos).map((r) => ctx.pitch.xpAt(r, g, d.xpGws)).filter(Number.isFinite);
  return { rank: 1 + vs.filter((v) => v > xp).length, n: vs.length };
}
function model(ctx, P, row, id, card, state, local = false, vs = null, vsCard = null) {
  const d = ctx.data;
  const pos = P.L.pos(id) ?? posName(row.pos);
  const runsOf = (pid, g) => {
    const s = d.seeds;
    if (!s?.has?.(pid)) return [];
    return Array.from({ length: s.runs }, (_, r) => s.at(pid, g, r)).filter(Number.isFinite);
  };
  const w = P.weeks.find((x) => x.in.includes(id) && !P.owned.includes(id));
  const out = vs ?? w?.moves.find((m) => m.in === id)?.out;
  const orow = out != null ? d.byId.get(Number(out)) : null;
  const futAll = d.xpGws.map((g) => ({
    gw: g,
    xp: ctx.pitch.xpAt(row, g, d.xpGws),
    rank: xpRank(ctx, pos, ctx.pitch.xpAt(row, g, d.xpGws), g),
    runs: local ? runsOf(id, g) : [],
    fx: ctx.pitch.fixturesAt(row, g, d.xpGws) ?? [],
    inPlan: !!weekOf(P, g)
  }));
  const past = card?.last_matches ?? [];
  return {
    pos,
    season: card?.season ?? null,
    avg: card?.pos_avg ?? null,
    past,
    slots: state === "loading" ? LAST_N : past.length,
    unavailable: state !== "loading" && !past.length,
    cups: card?.cups ?? [],
    cupNext: card?.cup_next ?? [],
    fut: futAll.slice(0, NEXT_N),
    futAll,
    comp: out == null ? null : {
      name: P.L.name(out),
      chance: orow?.chance ?? null,
      xp: d.xpGws.map((g) => ctx.pitch.xpAt(orow, g, d.xpGws)),
      // (his own matches by GW, his card's, and his coming opponents: the comparison's table)
      past: new Map((vsCard?.last_matches ?? []).filter((x) => x.gw != null).map((x) => [Number(x.gw), x])),
      fx: d.xpGws.map((g) => ctx.pitch.fixturesAt(orow, g, d.xpGws) ?? [])
    }
  };
}
function segControl({ opts, current, onPick, labelledBy = null, label = null, disabled = () => false, cls = "" }) {
  return roving(h(
    `div.m-seg${cls}`,
    { role: "radiogroup", "aria-labelledby": labelledBy, "aria-label": labelledBy ? null : label, style: { "--n": opts.length, "--i": opts.findIndex(([k]) => k === current) } },
    h("span.m-seg-thumb"),
    opts.map(([k, l, said]) => h("button", { type: "button", role: "radio", "aria-checked": String(k === current), "aria-label": said, disabled: disabled(k), onClick: () => onPick(k) }, l))
  ), { pick: (b) => b.click() });
}
var esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
var f1 = (x) => Number.isFinite(x) ? x.toFixed(1) : "\u2013";
function T(x, y, s, { anchor = "middle", fill: c = "var(--muted)", cls = "", mark = false } = {}) {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" fill="${c}"${cls ? ` class="${cls}"` : ""}>${esc(s)}${mark ? ' <tspan class="xp-u">xP</tspan>' : ""}</text>`;
}
var xpSvg = (x, y, s) => T(x, y, s, { fill: "var(--xp)", cls: "v" });
var L = (x1, y1, x2, y2, stroke = "var(--hair)", w = 1, extra = "") => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
var R = (x, y, w, hh, fillc, extra = "") => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, hh).toFixed(1)}" fill="${fillc}" ${extra}/>`;
function svgEl(W, H, body, label, cls) {
  const box = h(`div.${cls}`);
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${body}</svg>`;
  return box;
}
var niceMax = (v, step = 5, floor = 10) => Math.max(floor, Math.ceil(v / step) * step);
var LABEL_ROOM = 17;
var fixText = (opp, home) => opp == null ? "\u2013" : `${String(opp).toUpperCase()} ${home ? "H" : "A"}`;
var sum = (xs) => xs.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
var pastSums = (past) => ({ pts: sum(past.map((x) => x.points)), mins: sum(past.map((x) => x.minutes)) });
var WIDTHS = /* @__PURE__ */ new Map();
var PEN = null;
function measure(s, wt = 400) {
  const key = `${wt}|${s}`;
  if (WIDTHS.has(key)) return WIDTHS.get(key);
  let px = String(s).length * 8;
  try {
    PEN ??= document.createElement("canvas").getContext("2d");
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--f-text").trim() || "system-ui, sans-serif";
    PEN.font = `${wt} ${parseFloat(getComputedStyle(document.documentElement).fontSize) * 13 / 17 || 13}px ${fam}`;
    px = PEN.measureText(String(s)).width;
  } catch {
  }
  if (WIDTHS.size > 400) WIDTHS.clear();
  WIDTHS.set(key, px);
  return px;
}
function geometry(m, W) {
  const { cols: past, after } = pastColumns(m.past.map((x) => ({ ...x, opp: x.opp == null ? null : String(x.opp).toUpperCase() })), m.cups);
  const fut = futureColumns(m.fut.map((f) => ({ ...f, value: f1(f.xp), codes: f.fx.map((o) => o.opp) })), m.cupNext, after ?? []).cols;
  return layout({ pastCols: past, futCols: fut, W, measure, slots: m.past.length ? 0 : m.slots });
}
function infoBtn(key, label) {
  const b = h("button.ps-info", { type: "button", "aria-expanded": String(key.open), "aria-label": label, onClick: key.toggle });
  b.innerHTML = INFO;
  return b;
}
var INFO = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="5" r=".95" fill="currentColor"/><rect x="7.3" y="6.9" width="1.4" height="4.6" rx=".7" fill="currentColor"/></svg>';
function stripSums(m) {
  const { pts, mins } = pastSums(m.past);
  const next = sum(m.fut.map((f) => f.xp));
  const nb = (x) => x.replace(/ /g, "\xA0").replace(/–/g, "\u2060\u2013\u2060");
  return h("span.ps-sums", null, m.past.length ? `${nb(`${pts} pts in ${mins}\u2032`)} \xB7 ` : null, h("span.ps-sum", null, `${nb(COPY.span(m.fut.map((f) => f.gw)))}\xA0`, xpNum(f1(next))));
}
function stripSection(m, G, key) {
  if (m.two) return pairView(m, m.rows, G.W);
  const head = stripSums(m);
  const info = infoBtn(key, "What the chart shows");
  return h(
    "div.m-sec.ps-strip",
    null,
    h(
      "h3",
      null,
      h("span", null, m.slots ? `Last ${m.past.length || LAST_N} \xB7 next ${m.fut.length}` : `Next ${m.fut.length}`),
      h("span.ps-tot.m-num", null, head, info)
    ),
    matchStrip(m, G),
    m.unavailable ? h("p.ps-nopast", null, "Past matches unavailable") : null,
    key.open ? h("p.ps-note", null, stripKey(m, G.cols)) : null
  );
}
function stripKey(m, cols) {
  const cups = cols.filter((c) => c.kind === "cup");
  const ticks = m.fut.some((f) => f.runs.length);
  const among = [
    cups.some((c) => !c.next && c.ahead) ? "his cup games since his last league match" : null,
    cups.some((c) => c.next) ? "his club's coming cup games" : null
  ].filter(Boolean).join(", then ");
  const past = m.fut.filter((f) => !f.inPlan).map((f) => f.gw);
  const codes = [...new Set(cups.map((c) => c.league))].map((l) => `${cupCode(l)} ${cupName(l)}`).join(", ");
  const venue = cups.some((c) => c.home != null) ? "; H home, A away" : "";
  return `${COPY.runSpread(ticks)}${m.comp ? ` \u25CB ${m.comp.name}${m.comp.chance != null && m.comp.chance < 100 ? ` (${m.comp.chance}% to play)` : ""}, the player he replaces.` : ""} Opponent: FPL's difficulty, green easy to red hard; ${COPY.oppCase}.${past.length ? ` Dashed: ${COPY.span(past)}, past your plan.` : ""}${cups.some((c) => !c.next) ? " Grey: his other competitions, his minutes in each (0\u2032 an unused sub, \u2014 not in the squad)." : ""}${among ? ` Among the forecast, grey: ${among}.` : ""}${codes ? ` ${codes}${venue}.` : ""}`;
}
function oppChip(c, opp, home, fdr, y, W) {
  const shown = oppText({ opp, home });
  const chipW = Math.min(c.w - 1, measure(shown, 600) * CODE_SCALE + 6);
  const x = within(c.cx, chipW, 0, W) - chipW / 2;
  return `<g class="opp" data-club="${esc(opp)}" data-fdr="${fdr ?? ""}"><title>${esc(`${fixText(opp, home)}${fdr ? `, FPL difficulty ${fdr} of 5` : ""}`)}</title>` + (fdr ? `<rect x="${x.toFixed(1)}" y="${(y - 11).toFixed(1)}" width="${chipW.toFixed(1)}" height="15" rx="3" fill="var(--fdr-${fdr})"/>` : "") + T(x + chipW / 2, y, shown, { fill: "var(--ink)", cls: "v code" }) + "</g>";
}
function pairView(m, rows, W) {
  const c2 = m.comp;
  const past = m.past.filter((x) => x.gw != null), fut = m.futAll ?? m.fut;
  const ptsA = past.map((x) => x.minutes ? Number(x.points ?? 0) : null);
  const ptsB = past.map((x) => {
    const o = c2?.past?.get(Number(x.gw));
    return o?.minutes ? Number(o.points ?? 0) : null;
  });
  const from = m.from ?? fut.find((f) => f.inPlan)?.gw ?? fut[0]?.gw;
  const plan4 = fut.filter((f) => f.gw >= from).slice(0, 4), xp4A = plan4.map((f) => f.xp ?? null), xp4B = plan4.map((f) => c2?.xp[fut.indexOf(f)] ?? null);
  const tot = (xs) => xs.reduce((t, v) => t + (v ?? 0), 0);
  const lines = [
    past.length ? [`Points ${COPY.span(past.map((x) => x.gw))}`, tot(ptsA), tot(ptsB), String] : null,
    [`Forecast xP ${COPY.span(plan4.map((f) => f.gw))}`, tot(xp4A), tot(xp4B), f1]
  ].filter(Boolean);
  const cellOf = (v, w, show, side) => {
    const best = v > w + 1e-9;
    return h(`span.ps-hh-v.${side}.m-num`, { class: { best } }, side === "b" && best ? h("i.ps-ok", null, "\u2713") : null, show(v), side === "a" && best ? h("i.ps-ok", null, "\u2713") : null);
  };
  const table = h("div.ps-hh", null, lines.map(([l, a, b, show]) => h("div.ps-hh-r", null, cellOf(a, b, show, "a"), h("span.ps-hh-l", null, l), cellOf(b, a, show, "b"))));
  const GUT = 14, PH = 78, top = 34;
  const parts = [
    past.length ? { title: `Points \xB7 ${COPY.span(past.map((x) => x.gw))}`, gws: past.map((x) => x.gw), a: ptsA, b: ptsB, fa: past.map((x) => ({ fdr: x.fdr })), fb: past.map((x) => ({ fdr: c2?.past?.get(Number(x.gw))?.fdr })), xp: false } : null,
    { title: `Forecast xP \xB7 ${COPY.span(plan4.map((f) => f.gw))}`, gws: plan4.map((f) => f.gw), a: xp4A, b: xp4B, fa: plan4.map((f) => f.fx[0]), fb: plan4.map((f) => c2?.fx?.[fut.indexOf(f)]?.[0]), xp: true }
  ].filter(Boolean);
  const n = parts.reduce((t, p) => t + p.gws.length, 0), SEP = 10, cw = (W - GUT - SEP * (parts.length - 1)) / n;
  const out = [];
  let i0 = 0;
  parts.forEach((part, k) => {
    const x0 = GUT + i0 * cw + k * SEP, hi = Math.max(1, ...part.a.map((v) => v ?? 0), ...part.b.map((v) => v ?? 0));
    const y = (v) => top + PH - Math.max(v, 0) / hi * PH;
    const cx = (i) => x0 + i * cw + cw / 2;
    const say = (v) => part.xp ? f1(v) : String(v);
    out.push(T(x0, 12, part.title, { anchor: "start" }), L(x0, top + PH, x0 + part.gws.length * cw, top + PH, "var(--border-2)"));
    if (k) out.push(L(x0 - SEP / 2, 4, x0 - SEP / 2, top + PH + 60, "var(--hair)"));
    const line = (vals, color, dash) => {
      const runs = [[]];
      vals.forEach((v, i) => v == null ? runs.push([]) : runs.at(-1).push(`${cx(i).toFixed(1)},${y(v).toFixed(1)}`));
      return runs.filter((r) => r.length > 1).map((r) => `<polyline points="${r.join(" ")}" fill="none" stroke="${color}" stroke-width="2.2"${dash ? ' stroke-dasharray="5 3"' : ""}/>`).join("");
    };
    out.push(line(part.b, "var(--pair-b)", true), line(part.a, "var(--pair-a)", false));
    part.gws.forEach((g, i) => {
      const va = part.a[i], vb = part.b[i], aUp = vb == null || va != null && va >= vb;
      if (vb != null) out.push(`<circle cx="${cx(i).toFixed(1)}" cy="${y(vb).toFixed(1)}" r="3.8" fill="var(--surface)" stroke="var(--pair-b)" stroke-width="2"/>`, T(cx(i), y(vb) + (aUp ? 16 : -8), say(vb), { fill: "var(--pair-b)", cls: "v" }));
      if (va != null) out.push(`<circle cx="${cx(i).toFixed(1)}" cy="${y(va).toFixed(1)}" r="3.8" fill="var(--pair-a)"/>`, T(cx(i), y(va) + (aUp ? -8 : 16), say(va), { fill: "var(--pair-a)", cls: "v" }));
      out.push(T(cx(i), top + PH + 30, g));
      [[part.fa[i], top + PH + 40], [part.fb[i], top + PH + 52]].forEach(([o, yy]) => out.push(R(cx(i) - Math.min(9, cw / 2 - 2), yy, Math.min(18, cw - 4), 7, o?.fdr ? `var(--fdr-${o.fdr})` : "var(--hair)", 'rx="2"')));
    });
    i0 += part.gws.length;
  });
  out.push(`<circle cx="4.5" cy="${top + PH + 43.5}" r="3.5" fill="var(--pair-a)"/>`, `<circle cx="4.5" cy="${top + PH + 55.5}" r="3.2" fill="var(--surface)" stroke="var(--pair-b)" stroke-width="1.8"/>`);
  return h("div.m-sec.ps-pair", null, table, svgEl(W, top + PH + 64, out.join(""), `${c2?.name ?? ""} compared by gameweek`, "ps-chart.ps-pairline"));
}
function scaleOf(m, G) {
  const epl = G.cols.filter((c) => c.kind === "epl"), gws = G.cols.filter((c) => c.kind === "gw");
  const tops = [...epl.map((x) => x.points ?? 0), ...gws.flatMap((f) => [f.xp ?? 0, ...f.runs]), ...(m.comp?.xp ?? []).map((v) => v ?? 0)];
  return { low: Math.min(0, ...epl.map((x) => x.points ?? 0)), peak: Math.max(0, ...tops) };
}
function cupWords(c) {
  const day = Number.isFinite(c.kickoff) ? new Date(c.kickoff * 1e3).toLocaleDateString(void 0, { weekday: "short", day: "numeric", month: "short" }) : null;
  const opp = c.opp_name || c.opp;
  const mins = c.next ? null : c.in_squad === false ? "not in the squad" : Number.isFinite(c.minutes) ? `${c.minutes} minutes` : null;
  return [`${cupName(c.league)}${opp ? ` v ${opp}` : ""}`, c.home == null ? null : c.home ? "home" : "away", day, mins].filter(Boolean).join(", ");
}
function matchStrip(m, G, { low, peak } = scaleOf(m, G)) {
  const { W, lines, cols } = G;
  const H = 64, RH = 16, CAP = 18, GAP = 14;
  const epl = cols.filter((c) => c.kind === "epl"), gws = cols.filter((c) => c.kind === "gw");
  const ymin = low < 0 ? -5 * Math.ceil(-low / 5) : 0;
  let ymax = niceMax(peak);
  while ((ymax - peak) / (ymax - ymin) * H < LABEL_ROOM) ymax += 5;
  const avg = m.avg?.points;
  const avgText = Number.isFinite(avg) && epl.length ? `${posCode(m.pos)} avg ${f1(avg)}` : null;
  const b = [];
  let top = 0;
  lines.forEach((line, i) => {
    top = drawLine(line, top, i > 0 && !lines[i - 1].cols[0]?.ahead === !line.cols[0]?.ahead) + GAP;
  });
  const said = (c) => c.kind === "cup" ? cupWords(c) : `GW${c.gw} ${fixText(c.opp, c.home)} ${c.minutes ? `${c.points} pts in ${c.minutes} min` : c.minutes == null ? "not played yet" : "didn't play"}`;
  const past = cols.filter((c) => !c.ahead);
  const label = `${past.filter((c) => c.kind !== "slot").map(said).join(", ")}${avgText ? `; ${WORD[m.pos] ?? m.pos} averaged ${f1(avg)} a match in those rounds` : ""}; forecast ${cols.filter((c) => c.ahead).map((c) => c.kind === "cup" ? cupWords(c) : `GW${c.gw} ${c.fx.map((o) => fixText(o.opp, o.home)).join(" and ") || "no match"} ${f1(c.xp)}${c.rank ? `, ${rankWords(c, m.pos)}` : ""}`).join("; ")}`;
  return svgEl(W, top - GAP, b.join(""), label, "ps-chart.ps-match");
  function drawLine({ cols: lc }, top2, more) {
    const y0 = top2 + CAP;
    const sy = (v) => y0 + H - (v - ymin) / (ymax - ymin) * H;
    const lineOf = (c, q = 0) => c.row + q;
    const oppRows = Math.max(1, ...lc.filter((c) => c.kind !== "cup").map((c) => lineOf(c, Math.max(0, (c.fx?.length ?? 1) - 1)) + 1));
    const yGw = y0 + H + 16;
    const yOpp = (c, q = 0) => yGw + RH * (1 + lineOf(c, q));
    const end = lc.length ? lc.at(-1).x + lc.at(-1).w : W;
    const yEnd = yGw + RH * oppRows;
    for (const c of lc) if (c.kind === "cup") b.push(R(c.x + 1, y0 - 4, c.w - 2, yEnd + 10 - y0, "var(--track)"));
    for (let v = ymin; v <= ymax; v += 5) b.push(L(0, sy(v), end, sy(v), "var(--hair)"));
    const venue = (c, home) => home == null ? "" : T(c.cx, yGw + RH, home ? "H" : "A");
    const chip = (c, opp, home, fdr, y) => oppChip(c, opp, home, fdr, y, W);
    for (const c of lc) {
      if (c.kind === "epl") {
        const p = c.points ?? 0, mn = c.minutes ?? 0;
        if (!mn) {
          if (c.minutes != null) b.push(T(c.cx, sy(0) - 4, "0\u2032"));
        } else {
          const bw = Math.max(2, c.w * 0.66 * Math.min(mn, 90) / 90);
          b.push(`<g class="past" data-gw="${c.gw}" data-pts="${p}" data-min="${mn}">` + R(c.cx - bw / 2, Math.min(sy(p), sy(0)), bw, Math.abs(sy(0) - sy(p)), "var(--ink-2)") + T(c.cx, Math.min(sy(p), sy(0)) - 4, p, { fill: "var(--ink)", cls: "v" }) + "</g>");
        }
        b.push(T(c.cx, yGw, c.gw), c.opp ? chip(c, c.opp, c.home, c.fdr, yOpp(c)) : T(c.cx, yOpp(c), "\u2013", { fill: "var(--ink)", cls: "v" }));
      } else if (c.kind === "cup") {
        b.push(`<g class="cup${c.next ? " next" : ""}" data-league="${esc(c.league)}" data-min="${c.minutes ?? ""}" data-kickoff="${c.kickoff ?? ""}"${c.next ? ` data-before="${c.before}"` : ""}><title>${esc(cupWords(c))}</title>` + (c.next ? "" : T(c.cx, sy(0) - 4, cupMinutes(c))) + T(within(c.cx, measure(c.code), ...c.codeAt), yGw, c.code) + venue(c, c.home) + "</g>");
      } else if (c.kind === "gw") {
        const top22 = Math.max(c.xp ?? 0, ...c.runs);
        const opp = c.fx.map((o) => fixText(o.opp, o.home)).join(" + ") || "\u2013";
        const lo = c.runs.length ? Math.min(...c.runs) : null, hi = c.runs.length ? Math.max(...c.runs) : null;
        const aria = `GW${c.gw}, ${opp}, ${f1(c.xp)} expected points${rankWords(c, m.pos) ? `, ${rankWords(c, m.pos)}` : ""}${c.runs.length ? `, forecasts range ${f1(lo)} to ${f1(hi)}` : ""}${c.inPlan ? "" : ", forecast only"}`;
        const bw = c.w * 0.5;
        let g = `<g class="fc${c.inPlan ? "" : " edge"}" data-gw="${c.gw}" data-xp="${f1(c.xp)}" data-rank="${c.rank?.rank ?? ""}" data-n="${c.rank?.n ?? ""}"><title>${esc(aria)}</title>`;
        if (c.xp != null) {
          g += R(
            c.cx - bw / 2,
            sy(Math.max(c.xp, 0)),
            bw,
            Math.abs(sy(0) - sy(Math.max(c.xp, 0))),
            "var(--xp)",
            `fill-opacity=".12" stroke="var(--xp)" stroke-width="1"${c.inPlan ? "" : ' stroke-dasharray="3 2"'}`
          );
        }
        for (const r of c.runs) g += L(c.cx - bw / 2 - 3, sy(r), c.cx + bw / 2 + 3, sy(r), "var(--xp)", 0.6, 'opacity=".55" class="run"');
        g += xpSvg(c.cx, sy(top22) - 6, f1(c.xp));
        const vs = m.comp?.xp[m.fut.findIndex((x) => x.gw === c.gw)];
        if (vs != null) g += `<circle class="vs" data-xp="${f1(vs)}" cx="${(c.cx + bw / 2 + 1).toFixed(1)}" cy="${sy(vs).toFixed(1)}" r="3" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1.2"/>`;
        b.push(g + "</g>", T(c.cx, yGw, c.gw));
        const k = c.fx.length;
        if (!k) b.push(T(c.cx, yOpp(c), "\u2013", { fill: "var(--ink)", cls: "v" }));
        c.fx.forEach((o, q) => b.push(chip(c, o.opp, o.home, o.fdr, yOpp(c, q))));
      }
    }
    if (lc[0]?.ahead) {
      if (!more) b.push(T(0, y0 - 8, "forecast", { anchor: "start", mark: true }));
      return yEnd + 6;
    }
    const avgFits = !more && !!avgText && end - measure(avgText) >= 0;
    const avgX0 = avgFits ? end - measure(avgText) : end;
    const segs = [];
    lc.forEach((c, i) => {
      if (c.season == null) return;
      if (!segs.length || segs.at(-1).season !== c.season) segs.push({ season: c.season, i0: i });
    });
    segs.forEach((sg, k) => {
      const x = lc[sg.i0].x;
      if (k > 0) b.push(L(x - 1, y0 - 14, x - 1, y0 + H, "var(--border-2)", 1, 'stroke-dasharray="2 3"'));
      const word = `${sg.season}`;
      const [tx, anchor] = k === 0 && segs.length > 1 ? [lc[segs[1].i0].x - 5, "end"] : [x + 2, "start"];
      const [l, r] = anchor === "end" ? [tx - measure(word), tx] : [tx, tx + measure(word)];
      if (l >= 0 && r < avgX0 - 6) b.push(T(tx, y0 - 8, word, { anchor }));
    });
    if (avgText) {
      const runs = [];
      for (const c of lc) {
        if (c.kind !== "epl") continue;
        const r = runs.at(-1);
        if (r && Math.abs(r[1] - c.x) < 0.5) r[1] = c.x + c.w;
        else runs.push([c.x, c.x + c.w]);
      }
      b.push(`<g class="avg" data-v="${f1(avg)}">${runs.map(([a, z]) => L(a, sy(avg), z, sy(avg), "var(--ink)", 1, 'stroke-dasharray="1.5 2.5"')).join("")}` + (avgFits ? `<text x="${(end - 3).toFixed(1)}" y="${(y0 - 8).toFixed(1)}" text-anchor="end" fill="var(--muted)">${esc(avgText)}</text>` : "") + "</g>");
    }
    return yEnd + 6;
  }
}
var rankWords = (f, pos) => f.rank ? `${fmt.ordinal(f.rank.rank)} of ${f.rank.n} ${WORD[pos] ?? "players"} in GW${f.gw}` : "";
var STATS_VIEW_KEY = "fc:player:stats";
var statsView = (ctx) => {
  try {
    return ctx.api?.local?.get?.(STATS_VIEW_KEY) === "p90" ? "p90" : "match";
  } catch {
    return "match";
  }
};
var keepStatsView = (ctx, v) => {
  try {
    ctx.api?.local?.set?.(STATS_VIEW_KEY, v);
  } catch {
  }
};
var STATS_AMONG_KEY = "fc:player:among";
var statsAmong = (ctx) => {
  try {
    return ctx.api?.local?.get?.(STATS_AMONG_KEY) === "all" ? "all" : "pos";
  } catch {
    return "pos";
  }
};
var RECENT = 4;
var RECENT_SUFFIX = `_l${RECENT}`;
var STATS_SPAN_KEY = "fc:player:span";
var statsPeriod = (ctx) => {
  try {
    return ctx.api?.local?.get?.(STATS_SPAN_KEY) === "l4" ? "l4" : "season";
  } catch {
    return "season";
  }
};
function statsSection(card, W, { view, setView, among, setAmong, period = "season", setPeriod = null }, two = false) {
  const hasRecent = !!card?.stats?.[`${view}${RECENT_SUFFIX}`];
  const recent = hasRecent && period === "l4", vk = recent ? `${view}${RECENT_SUFFIX}` : view;
  const of = (s) => (among === "all" ? s?.all?.[vk] : s?.[vk]) ?? null;
  const p = of(card?.stats);
  if (!p || !Object.values(p.rows).some((r) => r.value != null)) return null;
  const o = two ? of(card?.stats?.vs) : null;
  const word = among === "all" ? "players" : WORD[p.pos] ?? "players";
  const per = view === "p90" ? "per 90 minutes" : "a match";
  const labs = Object.keys(p.rows).map((k) => (STAT[k] ?? [k])[0]);
  const RK = o ? 0 : 44, SW = W - RK, AX = Math.min(124, Math.ceil(Math.max(...labs.map((s) => measure(s)))) + 10), RV = o ? 84 : 44, span = SW - AX - RV, hh = 26, y = hh / 2;
  const rows = Object.entries(p.rows).map(([k, r]) => {
    const [lab, dp] = STAT[k] ?? [k, 1];
    const vals = p.dist[k] ?? [];
    const ov = o?.rows[k]?.value ?? null;
    const hi = Math.max(...vals, r.value ?? 0, ov ?? 0) * 1.02 || 1;
    const sx = (v) => AX + Math.min(Math.max(v, 0), hi) / hi * span;
    const b = [L(AX, y, AX + span, y, "var(--hair)"), T(0, y + 4.5, lab, { anchor: "start" })];
    for (const v of vals) b.push(`<circle class="peer" cx="${sx(v).toFixed(1)}" cy="${y}" r="2.6" fill="var(--border-2)" opacity=".7"/>`);
    if (o && ov != null) b.push(`<circle class="vs" cx="${sx(ov).toFixed(1)}" cy="${y}" r="4.3" fill="var(--surface)" stroke="var(--pair-b)" stroke-width="2"/>`);
    if (r.value != null) b.push(`<circle class="me" cx="${sx(r.value).toFixed(1)}" cy="${y}" r="5" fill="${o ? "var(--pair-a)" : "var(--ink)"}" stroke="var(--surface)" stroke-width="1.5"/>`);
    b.push(T(o ? SW - 42 : SW, y + 4.5, r.value == null ? "\u2013" : r.value.toFixed(dp), { anchor: "end", fill: o ? "var(--pair-a)" : "var(--ink)", cls: "v" }));
    if (o) b.push(T(SW, y + 4.5, ov == null ? "\u2013" : ov.toFixed(dp), { anchor: "end", fill: "var(--pair-b)", cls: "v" }));
    const rank = r.rank == null ? "\u2013" : fmt.ordinal(r.rank);
    const said = `${r.value == null ? "none" : r.value.toFixed(dp)}, ${r.rank == null ? "no rank" : `${fmt.ordinal(r.rank)} of ${p.n} ${word}`}`;
    return h(
      "div.ps-srow",
      { "data-key": k, "data-rank": r.rank ?? "", "data-value": r.value ?? "" },
      svgEl(SW, hh, b.join(""), `${lab} ${per}: ${said}`, "ps-chart"),
      o ? null : h("span.ps-rk.m-num", null, rank)
    );
  });
  const [s0, g1] = card.season_rounds ?? [];
  const g0 = recent && g1 != null ? Math.max(s0 ?? 1, g1 - RECENT + 1) : s0;
  return h(
    "div.m-sec.ps-stats",
    { "data-view": view, "data-among": among, "data-span": recent ? "l4" : "season" },
    // the switches alone on one line, no title on screen (owner, 2026-11-11, "all in one line and remove this crap": the
    // "Stats · GW1–10" cap); its words the section's heading to assistive tech alone (COPY.statsHead)
    h(
      "div.ps-stathead",
      null,
      h("h3.sr-only", null, COPY.statsHead(g0, g1)),
      // the ranked-among switch left of the per-match / per-90 one (owner, 2026-10-16)
      // (the season or his last 4 rounds first, then whom he is ranked among, then per what: one row of three alike under
      // the title, each as wide as the others; owner, 2026-11-11, the Last 4 switch alone on a line of its own)
      h(
        "div.ps-segs",
        { class: { three: hasRecent && !!setPeriod } },
        hasRecent && setPeriod ? segControl({ opts: [["season", "Season", "This season"], ["l4", `Last ${RECENT}`, `Last ${RECENT} gameweeks`]], current: recent ? "l4" : "season", onPick: setPeriod, label: "Stats over the season or the last 4 gameweeks", cls: ".small" }) : null,
        segControl({ opts: [["all", "All", "All positions"], ["pos", p.pos, WORD[p.pos] ?? p.pos]], current: among, onPick: setAmong, label: "Ranked among all positions or his own", cls: ".small.ps-among" }),
        // "Match" on a phone's one line ("Per match" its spoken name)
        segControl({ opts: [["match", "Match", "Per match"], ["p90", "Per 90", "Per 90 minutes"]], current: view, onPick: setView, label: "Stats per match or per 90 minutes", cls: ".small" })
      )
    ),
    rows
  );
}

export {
  NEXT_N,
  WORD,
  STAT,
  cardOf,
  open,
  statusOf,
  statusLines,
  segControl,
  pastSums,
  stripKey,
  statsView,
  keepStatsView,
  player_exports
};
