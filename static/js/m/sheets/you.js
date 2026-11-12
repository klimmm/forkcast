import {
  clip
} from "../chunks/chunk-BPLCWC2A.js";
import {
  hitsChoices,
  initials,
  inputsOf,
  plan,
  planHasYours,
  presolveTaps,
  resetPlan,
  setHitsMaxWithUndo,
  showTipsAgain,
  stopAhead
} from "../chunks/chunk-677LBVT3.js";
import "../chunks/chunk-IBIGFFAK.js";
import {
  COPY,
  HELP_OFF,
  horizonFeature
} from "../chunks/chunk-TCPZEJ5A.js";
import "../chunks/chunk-WSFCRVEQ.js";

// js/m/sheets/you.js
function when(epoch) {
  const ms = Number(epoch) * (Number(epoch) > 1e12 ? 1 : 1e3);
  if (!Number.isFinite(ms) || !ms) return null;
  const d = new Date(ms);
  const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return d.toDateString() === (/* @__PURE__ */ new Date()).toDateString() ? t : `${new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d)} ${t}`;
}
function solvedAt(road) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/.exec(road?.job || "");
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() / 1e3 + (Number(road.elapsed) || 0) : null;
}
var offNote = HELP_OFF ? ` ${COPY.offForNow}` : null;
function open(ctx, what = null) {
  if (what === "help") return helpSheet(ctx);
  if (what === "settings") return settingsSheet(ctx);
  const { h, fmt, fill } = ctx.ui;
  const offs = [];
  return ctx.sheets.open({
    title: "You",
    detent: "large",
    label: "You",
    onClose: () => {
      offs.forEach((f) => f());
      presolveTaps(ctx, null, { owner: offs });
    },
    build(body) {
      const team = h("div");
      const engine = h("div.m-sec");
      const dev = h("div.m-sec", { hidden: true });
      body.append(team, engine, settings(), dev);
      function presolveReset() {
        const P = plan(ctx);
        if (P?.editable && planHasYours(P)) presolveTaps(ctx, [{ kind: "reset" }], { sig: "reset", owner: offs });
      }
      function paintTeam() {
        const b = ctx.bundle;
        const e = b?.entry || {};
        const r = b?.rank || {};
        const gw = r.gw ?? b?.meta?.last_played;
        fill(
          team,
          h(
            "div.y-team",
            null,
            h("span.y-avatar", { "aria-hidden": "true" }, initials(e)),
            h(
              "div",
              null,
              h("h2.y-name", null, e.team_name || `Team ${e.id ?? ""}`),
              h("p.y-sub", null, [e.manager, e.id ? `Team ID ${e.id}` : null].filter(Boolean).join(" \xB7 "))
            )
          ),
          h(
            "div.y-stats",
            null,
            // 1928767 → "1.93M", 795123 → "795K": fmt.compact, two decimals on the M
            h("div", null, h("b.m-num", null, r.rank ? fmt.compact(r.rank, 2) : "\u2014"), h("span", null, gw ? `overall rank after GW${gw}` : "overall rank")),
            h("div", null, h("b.m-num", null, r.total ?? e.total ?? "\u2014"), h("span", null, gw ? `points after GW${gw}` : "points"))
          ),
          // the line every GW (COPY.cheerLine) while the bundle has it
          r.cheer ? h("p.m-foot.y-cheer", null, COPY.cheerLine(r.cheer)) : null,
          r.places_per_pt ? h("p.m-foot.y-rate", null, COPY.exchange(r.places_per_pt, r.source || `GW${gw} standings`)) : null
        );
      }
      function paintEngine() {
        const b = ctx.bundle;
        const conn = ctx.store.get("conn") || {};
        const f = b?.meta?.forecast || {};
        const model = b?.entry ? inputsOf(ctx)?.model ?? null : null;
        const baked = when(solvedAt(model));
        let plan2;
        if (conn.state === "updating") plan2 = "waiting: the forecast is updating";
        else if (b?.entry && !model) plan2 = COPY.waitShort;
        else plan2 = baked ? `ready since ${baked}` : "\u2014";
        const link = conn.state === "offline" ? `Forkcast server unreachable \xB7 data from ${when((conn.at || 0) / 1e3) ?? "\u2014"}` : "online";
        fill(
          engine,
          h("h3", null, "Status"),
          h("div.m-kv", null, h("span", null, "Forecast"), h("span", null, when(f.updated_epoch) ? `updated ${when(f.updated_epoch)}` : "\u2014")),
          h("div.m-kv", null, h("span", null, "Plan"), h("span", null, plan2)),
          h("div.m-kv", null, h("span", null, "Connection"), h("span", { class: conn.state === "offline" ? "g-loss" : "" }, link)),
          // the front end's release (api.access), "dev" for the tree's own; none until the server has said
          // (…and when it was released, as Forecast and Plan show theirs; owner, 2026-11-09, "why time of version not displayed")
          acc ? h("div.m-kv", null, h("span", null, "Version"), h("span.m-num", null, [acc.release ?? "dev", when(acc.released_at)].filter(Boolean).join(" \xB7 "))) : null,
          // (rows to their sheets, green with ›, not buttons: design 1028d K2)
          h("button.m-nav", { type: "button", disabled: HELP_OFF, onClick: () => helpSheet(ctx) }, COPY.helpShort, offNote),
          // the app's pitch, from inside it too (owner, 2026-10-14)
          h("button.m-nav", { type: "button", disabled: HELP_OFF, onClick: () => ctx.openSheet("about") }, COPY.whyTitle, offNote)
        );
        paintDev();
      }
      function settings() {
        const refresh = h("button.m-secondary", {
          type: "button",
          onClick: async () => {
            refresh.disabled = true;
            refresh.textContent = "Refreshing\u2026";
            const b = await ctx.refresh({ hard: true });
            refresh.disabled = false;
            refresh.textContent = "Refresh";
            const conn = ctx.store.get("conn");
            if (b) ctx.ui.toast("Your team is up to date. Forkcast re-plans if anything changed.", "ok");
            else if (conn?.state === "offline") ctx.ui.toast(ctx.api.plain(conn.error), "warn");
          }
        }, "Refresh");
        return h(
          "div.m-sec",
          null,
          h("h3", null, "Team"),
          h("button.m-secondary.y-change", { type: "button", onClick: () => switchTeam(ctx) }, "Change team\u2026"),
          refresh,
          // your choices off at once, as for a new team (the model's solves stay); the toast has Undo
          h("button.m-secondary.m-danger", { type: "button", onClick: () => {
            ctx.sheets.closeAll();
            if (resetPlan(ctx)) ctx.navigate("ahead", {}, { replace: true, top: true });
          } }, COPY.resetAll),
          signOutButton(ctx)
        );
      }
      let acc = null;
      function paintDev() {
        if (!acc?.local || !dev.isConnected) return;
        const b = ctx.bundle;
        const f = b?.meta?.forecast || {};
        const noise = b?.entry ? inputsOf(ctx)?.model?.noise : null;
        dev.hidden = false;
        fill(
          dev,
          h("h3", null, "Dev mode"),
          f.runs || f.pool ? h("div.m-kv", null, h("span", null, "Forecast"), h("span", null, [f.runs ? `${f.runs} runs` : null, f.pool ?? null].filter(Boolean).join(" \xB7 "))) : null,
          Number.isFinite(noise) ? h("div.m-kv", null, h("span", null, COPY.chargeName), h("span", null, COPY.noiseValue(noise, b.meta.gw))) : null,
          b?.meta?.scale ? h("p.m-foot.y-scale", null, COPY.realScale(b.meta.scale)) : null,
          acc.share.length ? h("button.m-nav", { type: "button", onClick: () => shareSheet(ctx, acc) }, "Open on iPhone") : null,
          h("a.m-nav.y-studio", { href: "/studio/", target: "_blank", rel: "noopener" }, "Open Studio (Dev mode)"),
          h("p.m-foot.y-center", null, "Every solver setting, the runs and the data jobs live in the Studio.")
        );
      }
      ctx.api.access().then((a) => {
        acc = a;
        paintEngine();
      });
      paintTeam();
      paintEngine();
      presolveReset();
      offs.push(
        ctx.store.on("conn", paintEngine),
        ctx.store.on("data", () => {
          paintTeam();
          paintEngine();
          presolveReset();
        }),
        ctx.store.on("memory", presolveReset)
      );
    }
  });
}
function planSettings(ctx, planSec, offs) {
  const { h, fill } = ctx.ui;
  function paintPlan() {
    const P = plan(ctx);
    const reach = P?.reach ?? ctx.data?.reach;
    if (!P) {
      fill(planSec, ...reach?.length ? [h("h3", null, "Plan"), ...weeksCtl(reach, true), ...gapCtl(), ...aheadCtl()] : []);
      return;
    }
    const { at, choices } = hitsChoices(P);
    const i = choices.findIndex(([n]) => n === at);
    fill(
      planSec,
      h("h3", null, "Plan"),
      h("div.ah-optl", { id: "y-hits-l" }, COPY.hitsHead),
      ctx.ui.roving(h(
        "div.m-seg.y-hits",
        { role: "radiogroup", "aria-labelledby": "y-hits-l", style: { "--n": choices.length, "--i": i } },
        h("span.m-seg-thumb"),
        choices.map(([n, l]) => h("button", {
          type: "button",
          role: "radio",
          "aria-checked": String(n === at),
          dataset: { hits: n },
          disabled: !P.editable,
          onClick: () => setHitsMaxWithUndo(ctx, n)
        }, l))
      ), { pick: (b) => b.click() }),
      h("p.m-foot", null, COPY.hitsNote),
      ...weeksCtl(reach, P.editable),
      ...gapCtl(),
      ...aheadCtl()
    );
    if (P.editable) {
      presolveTaps(
        ctx,
        choices.filter(([n]) => n !== at).map(([n]) => ({ kind: "hits", run: () => setHitsMaxWithUndo(ctx, n) })),
        { sig: `${at}`, owner: offs }
      );
    }
  }
  function weeksCtl(reach, editable) {
    const locked = ctx.bundle?.meta?.locked || [];
    const ns = reach.map((_, k) => k + 1), at = ctx.weeks();
    const off = (n) => n > 1 && locked.includes(horizonFeature(n));
    return [
      h("div.ah-optl", { id: "y-weeks-l" }, COPY.aheadHead),
      ctx.ui.roving(h(
        "div.m-seg.y-weeks",
        { role: "radiogroup", "aria-labelledby": "y-weeks-l", style: { "--n": ns.length, "--i": Math.max(0, ns.indexOf(at)) } },
        h("span.m-seg-thumb"),
        ns.map((n) => h("button", {
          type: "button",
          role: "radio",
          "aria-checked": String(n === at),
          dataset: { weeks: n },
          disabled: !editable || off(n),
          "aria-label": off(n) ? `${COPY.aheadSeg(n)}, locked` : null,
          onClick: () => {
            if (n !== at) {
              ctx.setWeeks(n);
              paintPlan();
            }
          }
        }, off(n) ? ctx.ui.icon("lock", { size: 12 }) : null, COPY.aheadSeg(n)))
      ), { pick: (b) => b.click() }),
      ns.some(off) ? h("p.m-foot.y-weeks-lock", null, COPY.aheadLocked) : null,
      h("p.m-foot", null, COPY.aheadNote)
    ];
  }
  function gapCtl() {
    const at = ctx.gap();
    const row = (k) => {
      const i = Math.max(0, GAPS.indexOf(at[k])), id = `y-gap-${k}-l`;
      return [
        h("div.ah-optl", { id }, COPY.gapHead(k === "later")),
        ctx.ui.roving(h(
          `div.m-seg.y-gap.${k}`,
          { role: "radiogroup", "aria-labelledby": id, style: { "--n": GAPS.length, "--i": i } },
          h("span.m-seg-thumb"),
          GAPS.map((g) => h("button", {
            type: "button",
            role: "radio",
            "aria-checked": String(g === at[k]),
            dataset: { gap: g },
            onClick: () => {
              if (g !== at[k]) ctx.setGap({ [k]: g });
            }
          }, COPY.gapSeg(g)))
        ), { pick: (b) => b.click() })
      ];
    };
    return [...row("now"), ...row("later"), h("p.m-foot", null, COPY.gapNote)];
  }
  function aheadCtl() {
    const at = ctx.presolveOn();
    return [
      h("div.ah-optl", { id: "y-ahead-l" }, COPY.presolveHead),
      ctx.ui.roving(h(
        "div.m-seg.y-presolve",
        { role: "radiogroup", "aria-labelledby": "y-ahead-l", style: { "--n": 2, "--i": at ? 1 : 0 } },
        h("span.m-seg-thumb"),
        [false, true].map((on) => h("button", {
          type: "button",
          role: "radio",
          "aria-checked": String(on === at),
          dataset: { presolve: on ? "1" : "0" },
          onClick: () => {
            if (on !== at) {
              ctx.setPresolve(on);
              if (!on) stopAhead();
              paintPlan();
            }
          }
        }, COPY.presolveSeg(on)))
      ), { pick: (b) => b.click() }),
      h("p.m-foot", null, COPY.presolveNote)
    ];
  }
  return paintPlan;
}
var GAPS = [0, 1e-3, 2e-3, 5e-3, 0.01];
function settingsSheet(ctx) {
  const offs = [];
  return ctx.sheets.open({
    title: COPY.settingsTitle,
    detent: "large",
    label: COPY.settingsTitle,
    onClose: () => {
      offs.forEach((f) => f());
      presolveTaps(ctx, null, { owner: offs });
    },
    build(body) {
      const planSec = ctx.ui.h("div.m-sec");
      body.append(planSec);
      const paintPlan = planSettings(ctx, planSec, offs);
      paintPlan();
      body.append(ctx.kits.kitSourceRow());
      offs.push(ctx.store.on("data", paintPlan), ctx.store.on("memory", paintPlan));
    }
  });
}
function helpSheet(ctx) {
  const { h, uid } = ctx.ui;
  const I = ctx.bundle && ctx.data ? inputsOf(ctx) : null;
  return ctx.sheets.open({
    title: COPY.helpShort,
    detent: "large",
    build(body) {
      body.append(
        h("p.y-lead", null, COPY.helpLead),
        h("button.m-nav.y-why", { type: "button", onClick: () => ctx.openSheet("about") }, COPY.whyTitle),
        ...COPY.help(I?.noise ?? null, I?.A).map(([head, items, key], i) => helpFold(
          h,
          uid,
          head,
          [key ? clip(key, head) : null, h("ul", null, items.map((t) => h("li", null, t)))],
          i === 0
        )),
        h("button.m-secondary", { type: "button", onClick: () => {
          showTipsAgain(ctx);
          ctx.sheets.closeAll();
        } }, COPY.tipsAgain)
      );
    }
  });
}
function helpFold(h, uid, head, body, open2) {
  const parts = body.filter(Boolean);
  for (const el of parts) {
    el.id = uid("help");
    el.hidden = !open2;
  }
  const btn = h("button", {
    type: "button",
    "aria-expanded": String(open2),
    "aria-controls": parts.map((el) => el.id).join(" "),
    onClick: () => {
      const on = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(on));
      for (const el of parts) el.hidden = !on;
    }
  }, head);
  return h("section.y-help", null, h("h3", null, btn), parts);
}
var teamName = (ctx) => ctx.bundle?.entry?.team_name || ctx.api.recent.list().find((r) => String(r.entry_id) === String(ctx.store.get("entry")))?.team_name || `Team ${ctx.store.get("entry") ?? ""}`.trim();
function signOutButton(ctx) {
  const { h } = ctx.ui;
  return h("button.m-secondary.m-danger.y-signout", { type: "button", onClick: () => ctx.signOut() }, `Sign out of ${teamName(ctx)}`);
}
function switchTeam(ctx) {
  const { h } = ctx.ui;
  let picker = null;
  ctx.sheets.open({
    title: "Change team",
    detent: "large",
    onClose: () => picker?.destroy(),
    build(body) {
      picker = ctx.teamPicker({ onPick: (id) => {
        ctx.sheets.closeAll();
        ctx.connect(id);
      }, recent: 4 });
      body.append(
        h("div.y-switch", null, picker.el, h("button.m-primary", { type: "button", onClick: () => picker.submit() }, "Find my team")),
        picker.recent,
        signOutButton(ctx)
      );
      setTimeout(() => picker.focus(), 350);
    }
  });
}
function shareSheet(ctx, acc) {
  const { h, fill } = ctx.ui;
  const [url, ...more] = acc.share;
  const qrBox = h("div.y-qr", { hidden: true });
  import("../chunks/qr-G3YWNXVJ.js").then(({ qrSvg }) => {
    fill(qrBox, qrSvg(url));
    qrBox.hidden = false;
  }).catch((e) => console.error("Forkcast: no QR code", e));
  const where = acc.mode === "lan" ? "The iPhone needs to be on the same Wi-Fi as this computer." : "Works from anywhere.";
  ctx.sheets.open({
    title: "Open on iPhone",
    sub: "Scan with the iPhone's Camera, or type the address into Safari.",
    detent: "large",
    build(body) {
      body.append(
        h(
          "div.y-share",
          null,
          qrBox,
          h("div.y-url.m-num", null, url),
          h("button.m-chipbtn", { type: "button", onClick: () => ctx.ui.copyText(url, "Address copied.") }, "Copy address"),
          more.length ? h("p.m-foot", null, "Also: ", more.join(" \xB7 ")) : null
        ),
        h("p.m-note", null, where, " Then tap Share, then Add to Home Screen, to keep Forkcast one tap away.")
      );
    }
  });
}
export {
  open
};
