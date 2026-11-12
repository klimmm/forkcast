import {
  USED,
  kits_exports,
  pitch_exports,
  release,
  xpAt
} from "./chunks/chunk-IBIGFFAK.js";
import {
  COPY,
  FORGET_MS,
  HELP_OFF,
  LOOPBACK,
  api_exports,
  bestXI,
  calls_exports,
  decodeSeeds,
  endBareWait,
  engine_exports,
  fill,
  flick,
  fmt,
  focusKey,
  getBundle,
  getCards,
  h,
  holdBare,
  holdTouch,
  isDown,
  loadSnapshot,
  local,
  noiseFloor,
  offlineNow,
  overlapOf,
  plain,
  planWeeks,
  posCode,
  posName,
  qs,
  recent,
  reduceMotion,
  refocus,
  saveSnapshot,
  servedRelease,
  setToastPlace,
  shownPlayers,
  toast,
  toastRegion,
  ui_exports,
  waitBare,
  waitFact,
  waitFacts,
  xpNum
} from "./chunks/chunk-TCPZEJ5A.js";
import "./chunks/chunk-WSFCRVEQ.js";

// js/m/picker.js
var SEARCH = Object.freeze({ debounceMs: 150, min: 1, max: 40, limit: 8 });
var COPY2 = Object.freeze({
  placeholder: "Such as 383130 or Raketa",
  placeholderId: "Such as 383130",
  label: "FPL team ID or team name",
  where: "Where do I find my ID?",
  recent: "Recent",
  none: (q) => `No team called \u201C${q}\u201D. Use your team ID.`,
  // one character matches whole names only (api/search.py PREFIX_MIN); thousands share some: only the ID tells them
  // apart
  named: (n, q) => `${n.toLocaleString("en")} teams are called \u201C${q}\u201D. Use your team ID.`,
  tooFast: "Searching too fast. One moment.",
  offline: "Team search isn't available. Type your team ID.",
  pick: "Pick your team from the list, or type your team ID.",
  empty: "Type your team name or your FPL team ID.",
  confirm: (r) => `${r.name}${r.region ? ` \xB7 ${r.region}` : ""}`,
  idOnly: (id) => `Team ID ${id}`
});
function readId(text) {
  const s = String(text ?? "").trim();
  const m = s.match(/entry\/(\d{1,10})/);
  const d = m ? m[1] : s.replace(/\s+/g, "");
  return /^\d{1,10}$/.test(d) && Number(d) > 0 ? String(Number(d)) : null;
}
var fold = (s) => String(s ?? "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
function parts(name, query) {
  const src = String(name ?? "");
  const q = fold(query).trim();
  if (!q) return [{ text: src, hit: false }];
  let folded = "";
  const from = [];
  const chars = [...src];
  let at = 0;
  for (const ch of chars) {
    const f = fold(ch);
    for (const c of f) {
      folded += c;
      from.push(at);
    }
    at += ch.length;
  }
  from.push(src.length);
  const starts = [];
  for (let i = folded.indexOf(q); i >= 0; i = folded.indexOf(q, i + 1)) starts.push(i);
  if (!starts.length) return [{ text: src, hit: false }];
  const word = starts.find((i) => i === 0 || !/[\p{L}\p{N}]/u.test(folded[i - 1])) ?? starts[0];
  const a = from[word], b = from[word + q.length] ?? src.length;
  return [{ text: src.slice(0, a), hit: false }, { text: src.slice(a, b), hit: true }, { text: src.slice(b), hit: false }].filter((p) => p.text);
}
var seq = 0;
var searchDown = false;
function teamPicker(ctx2, { value = "", onPick, onWhere = null, recent: recent2 = 3, label = COPY2.label } = {}) {
  const { h: h2, fill: fill2 } = ctx2.ui;
  const id = `fc-tp-${++seq}`;
  const field = h2("input.m-field", {
    id,
    type: "text",
    inputmode: "text",
    autocomplete: "off",
    autocapitalize: "off",
    autocorrect: "off",
    spellcheck: "false",
    enterkeyhint: "go",
    placeholder: searchDown ? COPY2.placeholderId : COPY2.placeholder,
    value,
    role: "combobox",
    "aria-autocomplete": "list",
    "aria-expanded": "false",
    "aria-controls": `${id}-list`,
    "aria-describedby": `${id}-msg`
  });
  const list = h2("ul.m-tp-list", { id: `${id}-list`, role: "listbox", "aria-label": "Teams", hidden: true });
  const msg = h2("div.m-tp-msg", { id: `${id}-msg`, "aria-live": "polite" });
  const el = h2("div.m-tp", null, h2("label.m-label", { htmlFor: id }, label), h2("div.m-tp-box", null, field, list), msg);
  const S = { results: [], active: -1, timer: null, ctrl: null, q: "", confirmed: null };
  const say = (text, tone = "", extra = null) => {
    msg.className = `m-tp-msg ${tone}`;
    fill2(msg, text || null, extra);
  };
  const where = (idHint) => onWhere ? [" ", h2("span.m-tp-nw", null, "(", h2("button.m-tp-where", { type: "button", onClick: () => onWhere(idHint) }, COPY2.where), ")")] : null;
  function close() {
    list.hidden = true;
    field.setAttribute("aria-expanded", "false");
    field.removeAttribute("aria-activedescendant");
    S.active = -1;
  }
  function paint() {
    if (!S.results.length) {
      fill2(list);
      close();
      return;
    }
    fill2(list, S.results.map((r, i) => h2(
      "li.m-tp-opt",
      {
        id: `${id}-o${i}`,
        role: "option",
        "aria-selected": String(i === S.active),
        dataset: { id: r.id },
        // keep the field focused (the keyboard up) while a finger picks
        onPointerdown: (e) => e.preventDefault(),
        onClick: () => pick(r)
      },
      h2("span.m-tp-flag", { "aria-hidden": "true" }, r.flag || "\xB7"),
      h2("span.m-tp-name", null, parts(r.name, S.q).map((p) => p.hit ? h2("b", null, p.text) : p.text)),
      h2("span.m-tp-sub", null, [r.manager, r.region, `#${r.id}`].filter(Boolean).join(" \xB7 "))
    )));
    list.hidden = false;
    field.setAttribute("aria-expanded", "true");
    if (S.active >= 0) field.setAttribute("aria-activedescendant", `${id}-o${S.active}`);
    else field.removeAttribute("aria-activedescendant");
  }
  function move(d) {
    const n = S.results.length;
    if (!n) return;
    S.active = ((S.active + 1 + d) % (n + 1) + n + 1) % (n + 1) - 1;
    paint();
    list.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest" });
  }
  function pick(r) {
    close();
    field.value = String(r.id);
    say(r.name ? COPY2.confirm(r) : COPY2.idOnly(r.id), "ok");
    onPick?.(String(r.id), r.name ?? null);
  }
  async function search(q, { idOnly = null } = {}) {
    S.ctrl?.abort();
    const ctrl = new AbortController();
    S.ctrl = ctrl;
    try {
      const out = await ctx2.api.request("GET", "/api/m/search", { query: { q, limit: SEARCH.limit }, signal: ctrl.signal });
      if (ctrl.signal.aborted || S.ctrl !== ctrl) return;
      down(false);
      const results = (out?.results || []).slice(0, SEARCH.limit);
      if (idOnly) {
        const r = results.find((x) => String(x.id) === idOnly);
        S.confirmed = r ?? null;
        if (readId(field.value) === idOnly) say(r ? COPY2.confirm(r) : COPY2.idOnly(idOnly), r ? "ok" : "");
        return;
      }
      S.results = results;
      S.active = -1;
      paint();
      if (!results.length) say(COPY2.none(q), "warn", where(null));
      else if (out.named > results.length) say(COPY2.named(out.named, q), "warn", where(null));
      else say(null);
    } catch (e) {
      if (ctrl.signal.aborted || e?.code === "aborted") return;
      S.results = [];
      paint();
      if (e?.code === "unreachable" || e?.code === "timeout" || e?.status === 503) down(true);
      if (idOnly) {
        say(COPY2.idOnly(idOnly));
        return;
      }
      if (e?.status === 429) {
        say(COPY2.tooFast, "quiet");
        clearTimeout(S.timer);
        S.timer = setTimeout(() => {
          if (field.value.trim().replace(/\s+/g, " ").slice(0, SEARCH.max) === q) search(q);
        }, 2100);
      } else if (e?.code === "unreachable" || e?.code === "timeout" || e?.status === 503) say(COPY2.offline, "warn");
      else if (e?.status !== 400) say(ctx2.api.plain(e), "warn");
    }
  }
  function onInput() {
    field.classList.remove("bad");
    el.classList.toggle("active", !!field.value.trim());
    clearTimeout(S.timer);
    const v = field.value;
    const idv = readId(v);
    S.q = v.trim().replace(/\s+/g, " ");
    S.confirmed = null;
    if (idv) {
      S.results = [];
      paint();
      say(COPY2.idOnly(idv));
      if (idv.length >= SEARCH.min) S.timer = setTimeout(() => search(idv, { idOnly: idv }), SEARCH.debounceMs);
      return;
    }
    if (S.q.length < SEARCH.min) {
      S.ctrl?.abort();
      S.results = [];
      paint();
      say(null);
      return;
    }
    S.timer = setTimeout(() => search(S.q.slice(0, SEARCH.max)), SEARCH.debounceMs);
  }
  function submit() {
    const idv = readId(field.value);
    if (S.active >= 0 && S.results[S.active]) {
      pick(S.results[S.active]);
      return true;
    }
    if (idv) {
      pick(S.confirmed ?? { id: idv, name: null });
      return true;
    }
    if (S.results.length === 1) {
      pick(S.results[0]);
      return true;
    }
    field.classList.add("bad");
    say(!field.value.trim() ? COPY2.empty : searchDown ? COPY2.offline : COPY2.pick, "bad", where(null));
    return false;
  }
  function down(on) {
    searchDown = on;
    field.placeholder = on ? COPY2.placeholderId : COPY2.placeholder;
  }
  field.addEventListener("input", onInput);
  field.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape" && !list.hidden) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  });
  field.addEventListener("blur", () => setTimeout(close, 150));
  field.addEventListener("focus", () => {
    if (S.results.length) paint();
  });
  const rows = ctx2.api.recent.list().slice(0, recent2);
  const recentEl = h2(
    "section.m-recent",
    { hidden: !rows.length, "aria-label": COPY2.recent },
    h2("h3.m-recent-h", null, COPY2.recent),
    rows.map((r) => h2(
      "button.m-recent-row",
      {
        type: "button",
        "aria-label": `${r.team_name ? `${r.team_name}, team ID` : "Team ID"} ${r.entry_id}`,
        onClick: () => pick({ id: r.entry_id, name: r.team_name })
      },
      h2(
        "span.m-recent-t",
        null,
        h2("b", null, r.team_name || `Team ${r.entry_id}`),
        h2("small.m-num", null, [r.manager, r.entry_id].filter(Boolean).join(" \xB7 "))
      ),
      r.total != null && Number.isFinite(Number(r.total)) ? h2("span.m-recent-pts.m-num", null, `${r.total} pts`) : null
    ))
  );
  if (readId(value)) onInput();
  return {
    el,
    recent: recentEl,
    field,
    submit,
    focus: () => field.focus({ preventScroll: true }),
    destroy() {
      clearTimeout(S.timer);
      S.ctrl?.abort();
    }
  };
}

// js/m/shell/store.js
var range = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b >= a ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [];
function createStore(initial) {
  const state = { ...initial };
  const subs = /* @__PURE__ */ new Map();
  const saved = /* @__PURE__ */ new Set();
  const store2 = {
    get: (k) => state[k],
    set(k, v) {
      if (k && typeof k === "object") {
        for (const [a, b] of Object.entries(k)) store2.set(a, b);
        return;
      }
      if (Object.is(state[k], v)) return;
      const prev = state[k];
      state[k] = v;
      if (saved.has(k)) local.set(`fc:s:${k}`, v == null ? null : JSON.stringify(v));
      for (const fn of [...subs.get(k) || []]) fn(v, prev);
    },
    on(k, fn) {
      if (!subs.has(k)) subs.set(k, /* @__PURE__ */ new Set());
      subs.get(k).add(fn);
      return () => subs.get(k)?.delete(fn);
    },
    /** Persists `k` in localStorage (fc:s:<k>); loads the saved value now, else `fallback`. */
    persist(k, fallback) {
      saved.add(k);
      const v = local.json(`fc:s:${k}`);
      state[k] = v ?? state[k] ?? fallback;
      return state[k];
    }
  };
  return store2;
}
function lineupNow(entry, data) {
  if (Array.isArray(entry?.xi) && entry.xi.length === 11) {
    return { xi: entry.xi.map(Number), bench: (entry.bench || []).map(Number), captain: entry.captain, vice: entry.vice };
  }
  const xpOf = (id) => xpAt(data.byId.get(Number(id)), data.gw, data.xpGws) ?? 0;
  const posOf = (id) => posName(data.byId.get(Number(id))?.pos);
  const { xi, bench } = bestXI(data.base.squad.map((s) => s.id), xpOf, posOf);
  const ranked = [...xi].sort((a, b) => xpOf(b) - xpOf(a));
  return { xi, bench, captain: ranked[0] ?? null, vice: ranked[1] ?? null };
}
function fplTeam(e, gw) {
  const t = e?.published?.gw === gw ? e.published : e;
  if (!Array.isArray(t?.xi) || t.xi.length !== 11) return null;
  const id = (v) => v == null || !Number.isFinite(Number(v)) ? null : Number(v);
  return { xi: t.xi.map(Number), bench: (t.bench || []).map(Number), captain: id(t.captain), vice: id(t.vice) };
}
var horizonOf = (m = {}) => Array.isArray(m.horizon) ? m.horizon.map(Number) : range(Number(m.gw), Number(m.gw) + 3);
var reachOf = (m = {}) => Array.isArray(m.reach) ? m.reach.map(Number) : horizonOf(m);
function derive(b, receivedAt) {
  const m = b.meta || {};
  const cols = shownPlayers(b);
  const fields = cols?.fields || [];
  const rows = (cols?.rows || []).map((r) => Object.fromEntries(fields.map((f, i) => [f, r[i]])));
  const byId = new Map(rows.map((r) => [Number(r.id), r]));
  const gw = Number(m.gw);
  const horizon = horizonOf(m), reach = reachOf(m);
  const xpGws = range(gw, Number(m.forecast_edge ?? reach[reach.length - 1]));
  const e = b.entry || {};
  const squad = (e.squad || []).map((s) => ({ ...byId.get(Number(s.id)), ...s, id: Number(s.id) }));
  const base = {
    season: m.season,
    entry_id: e.id,
    gw,
    squad,
    bank: e.bank,
    ft: e.ft,
    chips_available: e.chips_available || [],
    chips_used: e.chips_used || [],
    horizon: xpGws
  };
  const data = { rows, byId, players: { horizon: xpGws, players: rows }, base, gw, horizon, reach, xpGws, noise: noiseFloor(m, gw), receivedAt };
  data.lineup = squad.length ? lineupNow(e, data) : { xi: [], bench: [], captain: null, vice: null };
  data.fpl = fplTeam(e, gw);
  try {
    data.seeds = decodeSeeds(b.seeds);
  } catch (err) {
    console.error("Forkcast: bad seed matrix", err);
    data.seeds = null;
  }
  return data;
}

// js/m/shell/sheets.js
var $ = (s, el = document) => el.querySelector(s);
var $$ = (s, el = document) => [...el.querySelectorAll(s)];
var SHEET_PX = { small: 320, medium: 470 };
var FIT_ROOM = 12;
var DISMISS_PX = 130;
function createSheets(app2, { landed = () => {
} } = {}) {
  const stack = [];
  const sync = () => {
    app2.classList.toggle("sheet-large", stack.some((s) => s.detent === "large"));
    document.documentElement.classList.toggle("m-sheeted", stack.length > 0);
    stack.forEach((s, i) => s.el.classList.toggle("back", i < stack.length - 1));
    const modal = stack.length > 0;
    const gated = document.documentElement.classList.contains("m-gated");
    for (const c of app2.children) {
      const off = modal || gated && c.matches(".m-screen");
      if (!c.matches(".m-sheet, .m-scrim") && c.inert !== off) c.inert = off;
    }
    stack.forEach((s, i) => {
      const off = modal && i < stack.length - 1;
      if (s.el.inert !== off) s.el.inert = off;
    });
  };
  const heightOf = (sheet, d = sheet.detent) => {
    const H = sheet.el.offsetHeight;
    if (d === "large") return H;
    const at = Math.min(H, d === "small" ? SHEET_PX.small : Math.min(SHEET_PX.medium, Math.round(app2.clientHeight * 0.58)));
    return sheet.fit ? Math.min(at, contentOf(sheet)) : at;
  };
  const contentOf = (sheet) => {
    const b = sheet.body;
    let bottom = b.getBoundingClientRect().top;
    for (const c of b.children) bottom = Math.max(bottom, c.getBoundingClientRect().bottom);
    return Math.ceil(bottom + b.scrollTop - sheet.el.getBoundingClientRect().top + FIT_ROOM);
  };
  const offset = (sheet, d = sheet.detent) => Math.max(0, sheet.el.offsetHeight - heightOf(sheet, d));
  const place = (sheet) => {
    const off = offset(sheet);
    sheet.el.style.transform = `translateY(${off}px)`;
    sheet.el.style.setProperty("--sheet-off", `${off}px`);
    sync();
  };
  const orderOf = (sheet) => ["small", "medium", "large"].filter((d) => sheet.detents.includes(d));
  const atTop = (sheet) => sheet.detent === orderOf(sheet).at(-1);
  let owed = 0, popping = 0, from = null, bare = false;
  const later = [];
  const entries = () => stack.filter((s) => s.entry).length;
  const flush = () => {
    if (!owed) return;
    const n = owed;
    owed = 0;
    popping++;
    from = location.hash;
    history.go(-n);
  };
  const afterPop = (fn) => {
    if (owed || popping) later.push(fn);
    else fn();
  };
  const push = (sheet) => afterPop(() => {
    if (!stack.includes(sheet)) return;
    sheet.entry = true;
    history.pushState({ sheet: entries() }, "");
  });
  if (history.state?.sheet) history.replaceState(null, "");
  addEventListener("popstate", () => {
    const ours = popping > 0, want = history.state?.sheet ?? 0;
    if (ours) popping--;
    let closed = false;
    for (let s = stack.findLast((x) => x.entry); s && entries() > want; s = stack.findLast((x) => x.entry)) {
      if (!s.dismissible) {
        history.pushState({ sheet: entries() }, "");
        break;
      }
      dismiss(s, { popped: true });
      closed = true;
    }
    if (ours || closed) landed(ours ? from : null);
    while (later.length && !owed && !popping) later.shift()();
  });
  function dismiss(sheet, { instant = false, keep = false, popped = false } = {}) {
    const i = stack.indexOf(sheet);
    if (i < 0) return;
    stack.splice(i, 1);
    if (sheet.entry && !keep && !popped && !owed++) queueMicrotask(flush);
    if (reduceMotion()) sheet.el.classList.add("m-fade");
    else sheet.el.style.transform = "translateY(100%)";
    sheet.scrim.classList.remove("on");
    sync();
    setTimeout(() => {
      sheet.el.remove();
      sheet.scrim.remove();
    }, instant ? 0 : 450);
    if (i === stack.length) {
      const under = stack[stack.length - 1];
      if (sheet.opener?.isConnected && !sheet.opener.closest("[inert]")) sheet.opener.focus?.({ preventScroll: true });
      else if (under) refocus(under.el, sheet.key, under.el);
      else refocus(app2, sheet.key, $("[data-focus-home]", app2));
    }
    sheet.onClose?.();
  }
  function setDetent(sheet, d) {
    if (!sheet.detents.includes(d) || d === sheet.detent) return place(sheet);
    sheet.detent = d;
    place(sheet);
    const grab = $(".m-grab span", sheet.el);
    grab?.classList.remove("m-bump");
    void grab?.offsetWidth;
    grab?.classList.add("m-bump");
  }
  function wireDrag(sheet) {
    const { el } = sheet;
    let y0 = null, base = 0, last = 0, fl = null;
    const start = (y, t) => {
      if (!stack.includes(sheet)) return;
      y0 = y;
      last = y;
      base = new DOMMatrix(getComputedStyle(el).transform).m42;
      fl = flick().add(y, t);
      el.classList.add("dragging");
      el.style.transform = `translateY(${base}px)`;
      el.style.setProperty("--sheet-off", "0px");
    };
    const move = (y, t) => {
      if (y0 == null) return;
      last = y;
      fl.add(y, t);
      const at = base + y - y0;
      el.style.transform = `translateY(${at < 0 ? at / 3 : at}px)`;
    };
    const end = (y = last, t = null) => {
      if (y0 == null) return;
      if (t != null) fl.add(y, t);
      const to = base + fl.project(y) - y0;
      y0 = null;
      el.classList.remove("dragging");
      const order = orderOf(sheet);
      if (sheet.dismissible && to > Math.max(base, offset(sheet, order[0])) + DISMISS_PX) return dismiss(sheet);
      setDetent(sheet, order.reduce((a, d) => Math.abs(offset(sheet, d) - to) < Math.abs(offset(sheet, a) - to) ? d : a));
    };
    const down = (e) => {
      if (e.target.closest("button, input, a, select, textarea")) return;
      start(e.clientY, e.timeStamp);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
      }
    };
    for (const t of [$(".m-grab", el), ...$$(".m-sh", el)]) {
      t.addEventListener("pointerdown", down);
      t.addEventListener("pointermove", (e) => move(e.clientY, e.timeStamp));
      t.addEventListener("pointerup", (e) => end(e.clientY, e.timeStamp));
      t.addEventListener("pointercancel", () => end());
    }
    const body = sheet.body;
    let ty = null, tt = 0;
    body.addEventListener("touchstart", (e) => {
      ty = (body.scrollTop <= 0 || !atTop(sheet)) && !e.target.closest("[data-nodrag], input, textarea") ? e.touches[0].clientY : null;
      tt = e.timeStamp;
    }, { passive: true });
    body.addEventListener("touchmove", (e) => {
      if (ty == null) return;
      if (e.defaultPrevented && y0 == null) {
        ty = null;
        return;
      }
      const y = e.touches[0].clientY;
      if (y0 == null) {
        if (y - ty > 6) {
          if (body.scrollTop > 0) {
            ty = null;
            return;
          }
          start(ty, tt);
        } else if (ty - y > 6) {
          if (atTop(sheet)) {
            ty = null;
            return;
          }
          start(ty, tt);
        } else return;
      }
      holdTouch(e);
      move(y, e.timeStamp);
    }, { passive: false });
    body.addEventListener("touchend", (e) => {
      ty = null;
      end(e.changedTouches[0]?.clientY, e.timeStamp);
    });
    body.addEventListener("touchcancel", () => {
      ty = null;
      end();
    });
  }
  function open({ title, sub, detent = "medium", detents, build, onClose, label, cls, close = true, dismissible = true, fit = false } = {}) {
    const gone = stack.length >= 2 ? stack[stack.length - 1] : null;
    if (gone) dismiss(gone, { instant: true, keep: true });
    const routed = bare;
    bare = false;
    const z = 240 + stack.length * 20;
    const scrim = h("div.m-scrim", { style: { zIndex: z } });
    const body = h("div.m-sbody");
    const el = h("div.m-sheet", {
      class: cls,
      role: "dialog",
      "aria-modal": "false",
      tabindex: "-1",
      "aria-label": label || (typeof title === "string" ? title : null),
      style: { zIndex: z + 10 }
    }, h("div.m-grab", { "aria-hidden": "true" }, h("span")), body);
    const sheet = {
      el,
      body,
      scrim,
      detent,
      dismissible,
      onClose,
      fit,
      entry: !!gone?.entry,
      detents: detents || (detent === "large" ? ["large"] : [detent, "large"]),
      opener: document.activeElement,
      key: focusKey(document.activeElement),
      refresh: null,
      close: () => dismiss(sheet),
      setDetent: (d) => setDetent(sheet, d)
    };
    if (title) {
      body.append(h(
        "div.m-sh",
        null,
        h("div", null, h("h2", null, title), sub ? h("p.m-sub", null, sub) : null),
        close ? h("button.m-xbtn", { type: "button", "aria-label": "Close", onClick: () => dismiss(sheet) }, "\u2715") : null
      ));
    }
    app2.append(scrim, el);
    stack.push(sheet);
    if (!sheet.entry && !routed) push(sheet);
    build?.(body, sheet);
    wireDrag(sheet);
    scrim.addEventListener("click", () => {
      if (sheet.dismissible) dismiss(sheet);
    });
    const still = reduceMotion();
    if (still) el.classList.add("m-fade");
    void el.offsetHeight;
    scrim.classList.add("on");
    place(sheet);
    if (still) requestAnimationFrame(() => {
      if (stack.includes(sheet)) el.classList.remove("m-fade");
    });
    el.focus({ preventScroll: true });
    return sheet;
  }
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stack.length && stack[stack.length - 1].dismissible) dismiss(stack[stack.length - 1]);
  });
  addEventListener("resize", () => stack.forEach(place));
  return {
    open,
    closeAll: () => [...stack].reverse().forEach((s) => dismiss(s)),
    depth: () => stack.length,
    afterPop,
    /** The next sheet opened is the #/player route's: its hash entry is its history entry (false: cancel). */
    routed: (on = true) => {
      bare = on;
    },
    /** The top sheet: {el, top, bottom}, its viewport edges once resting at its detent; bottom is where its body's room
     *  ends (screen bottom at any detent: place); null with no sheet. */
    top: () => {
      const s = stack[stack.length - 1];
      if (!s) return null;
      const y = app2.getBoundingClientRect().top + s.el.offsetTop;
      return { el: s.el, top: y + offset(s), bottom: y + s.el.offsetHeight };
    }
  };
}

// js/m/shell/toasts.js
var CONTROLS = 'button, a[href], input, select, textarea, summary, [role="button"], [role="slider"], [role="radio"], [role="tab"], [tabindex="0"]';
var PLACE_SETTLE_MS = 120;
var toastsPlaced = false;
function placeToasts(sheets2) {
  if (toastsPlaced) return;
  toastsPlaced = true;
  let pressed = null;
  const PRESS_MS = 500;
  const release2 = () => {
    if (!pressed) return;
    delete pressed.dataset.held;
    pressed = null;
    redrawn();
  };
  document.addEventListener("pointerdown", (e) => {
    const t = e.target.closest?.("#toasts .toast");
    if (t?.classList.contains("armed") && e.target.closest("button.btn")) {
      pressed = t;
      t.dataset.held = "1";
    }
  }, true);
  document.addEventListener("pointerup", () => {
    if (pressed) setTimeout(release2, PRESS_MS);
  }, true);
  for (const k of ["click", "pointercancel"]) document.addEventListener(k, () => {
    if (pressed) setTimeout(release2, 0);
  }, true);
  let ctrls = null;
  const controlsOf = (region) => ctrls ??= [...document.querySelectorAll(CONTROLS)].filter((c) => !region.contains(c));
  let docked = null;
  const undock = () => {
    docked?.style.removeProperty("--toast-dock");
    docked = null;
  };
  const DOCK_GAP = 8;
  const placeOnSheet = (region, sheet) => {
    region.dataset.place = "top";
    if (region.getBoundingClientRect().bottom + DOCK_GAP <= sheet.top) {
      undock();
      return "top";
    }
    region.dataset.place = "dock";
    const d = Math.ceil(sheet.bottom - region.getBoundingClientRect().top + DOCK_GAP);
    if (docked !== sheet.el) undock();
    docked = sheet.el;
    docked.style.setProperty("--toast-dock", `${d}px`);
    const room = parseFloat(docked.style.getPropertyValue("--toast-dock-room")) || 0;
    if (d > room) docked.style.setProperty("--toast-dock-room", `${d}px`);
    docked.dispatchEvent(new CustomEvent("m-dock"));
    return "bottom";
  };
  const place = (region, el = null) => {
    if (pressed?.isConnected) return;
    const sheet = sheets2.top();
    if (sheet) {
      el?.classList.toggle("up", placeOnSheet(region, sheet) === "bottom");
      return;
    }
    undock();
    region.dataset.place = "top";
    el?.classList.remove("up");
  };
  const blocks = (b, region, controls) => {
    const q = b.getBoundingClientRect();
    return controls.some((c) => {
      const x = overlapOf(q, c.getBoundingClientRect());
      if (!x) return false;
      const under = document.elementsFromPoint((x.left + x.right) / 2, (x.top + x.bottom) / 2).find((e) => !region.contains(e));
      return !!under && c.contains(under);
    });
  };
  let raf = 0;
  const guard = () => {
    const region = document.getElementById("toasts");
    const live = region ? [...region.querySelectorAll(".toast:not(.leaving)")].filter((t) => t.querySelector("button.btn")) : [];
    if (!live.length) return;
    let controls = null, stuck = false;
    const onSheet = !!sheets2.top();
    for (const t of live) {
      if (t === pressed) continue;
      let ok = !!t.dataset.in && !onSheet;
      if (t.dataset.in && onSheet) {
        controls ??= controlsOf(region);
        ok = ![...t.querySelectorAll("button")].some((b) => b.getClientRects().length && blocks(b, region, controls));
        stuck ||= !ok;
      }
      if (t.classList.contains("armed") !== ok) t.classList.toggle("armed", ok);
      if (ok && !t.dataset.armedOnce) {
        t.dataset.armedOnce = "1";
        t.dispatchEvent(new Event("toast-armed"));
      }
    }
    if (stuck) redrawn();
    raf ||= requestAnimationFrame(() => {
      raf = 0;
      guard();
    });
  };
  const added = (region, el) => {
    requestAnimationFrame(() => {
      if (!el.isConnected || el.classList.contains("leaving")) return;
      place(region, el);
      guard();
      Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(() => {
        if (el.isConnected) {
          el.dataset.in = "1";
          guard();
        }
      });
    });
  };
  let timer = 0;
  const again = () => {
    timer = 0;
    const r = document.getElementById("toasts");
    if (r?.querySelector(".toast")) {
      place(r);
      guard();
    }
  };
  const settle = () => {
    clearTimeout(timer);
    timer = setTimeout(again, PLACE_SETTLE_MS);
  };
  function redrawn() {
    if (!timer) timer = setTimeout(again, PLACE_SETTLE_MS);
  }
  setToastPlace(added);
  for (const o of [Element.prototype, window]) {
    for (const k of ["scrollIntoView", "scroll", "scrollTo", "scrollBy"]) {
      const f = o[k];
      if (typeof f === "function") o[k] = function(...a) {
        const r = f.apply(this, a);
        guard();
        return r;
      };
    }
  }
  for (const k of ["scrollTop", "scrollLeft"]) {
    const d = Object.getOwnPropertyDescriptor(Element.prototype, k);
    if (d?.set) Object.defineProperty(Element.prototype, k, { ...d, set(v) {
      d.set.call(this, v);
      guard();
    } });
  }
  document.addEventListener("scroll", () => {
    guard();
    settle();
  }, true);
  window.addEventListener("resize", () => {
    guard();
    settle();
  });
  new MutationObserver((records) => {
    const region = document.getElementById("toasts");
    const page = region ? records.filter((r) => r.type === "childList" || !region.contains(r.target)) : records;
    if (page.length) ctrls = null;
    if (!region?.querySelector(".toast")) {
      undock();
      return;
    }
    if (!page.length) return;
    guard();
    if (page.some((r) => r.type === "childList")) redrawn();
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
  new MutationObserver(() => {
    if (document.getElementById("toasts")?.querySelector(".toast")) {
      guard();
      redrawn();
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
}

// js/m/app.js
var wait = (ms) => new Promise((res) => setTimeout(res, ms));
var hhmm = (ms) => Number.isFinite(ms) ? new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "\u2014";
var SCREEN = "ahead";
var store = createStore({ bundle: null, data: null, gw: null, conn: { state: "ok", at: NaN, error: null } });
store.persist("entry", null);
var HORIZON_KEY = (entry) => `fc:horizon:${entry}`;
var GAP_KEY = "fc:gap2";
var PRESOLVE_KEY = "fc:presolve";
var GAP_DEFAULT = Object.freeze({ now: 0, later: 0 });
var gapOf = () => {
  try {
    return { ...GAP_DEFAULT, ...JSON.parse(local.get(GAP_KEY) || "{}") };
  } catch {
    return { ...GAP_DEFAULT };
  }
};
var weeksOf = (entry, b = store.get("bundle")) => planWeeks(local.get(HORIZON_KEY(entry)), b?.meta?.locked, b?.meta ? reachOf(b.meta).length : null);
var planning = (gws) => gws?.length ? `${COPY.waitWord} ${COPY.span(gws)}` : `${COPY.waitWord}\u2026`;
var modules = /* @__PURE__ */ new Map();
function optionalModule(rel) {
  const url = new URL(rel, import.meta.url).href;
  if (!modules.has(url)) {
    modules.set(url, (async () => {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" }).catch(() => null);
      if (!r) {
        modules.delete(url);
        return null;
      }
      if (!r.ok || !/javascript/.test(r.headers.get("content-type") || "")) return null;
      try {
        return await import(url);
      } catch (e) {
        console.error(`Forkcast: ${rel} failed to load`, e);
        return null;
      }
    })());
  }
  return modules.get(url);
}
var LAZY = [`./${SCREEN}.js`, ...["why", "player", "replace", "wish", "you", "chips", "about"].map((n) => `./sheets/${n}.js`)];
var preloaded = false;
function preloadModules() {
  if (preloaded) return;
  preloaded = true;
  setTimeout(() => LAZY.forEach((rel) => optionalModule(rel)), 400);
}
function linkCss(href) {
  if (!href || $(`link[data-m-css="${href}"], link[href^="${href}"]`)) return Promise.resolve();
  return new Promise((res) => {
    const l = h("link", { rel: "stylesheet", href, dataset: { mCss: href } });
    l.onload = l.onerror = () => res();
    document.head.append(l);
  });
}
var app = $("#app");
var sheets = createSheets(app, { landed: carry });
var screen = { el: $(`#m-${SCREEN}`), mod: null, handle: null, mounting: null, fresh: false };
var banner = h("div.m-banner", { hidden: true, role: "status", "aria-live": "polite" });
var gate = $("#m-gate");
var revealOnce = false;
var ctx = {
  get bundle() {
    return store.get("bundle");
  },
  get data() {
    return store.get("data");
  },
  get reveal() {
    return revealOnce;
  },
  store,
  api: api_exports,
  sheets,
  engine: engine_exports,
  calls: calls_exports,
  kits: kits_exports,
  pitch: pitch_exports,
  ui: ui_exports,
  navigate,
  openSheet: (name, ...args) => openSheet(name, ...args),
  // the bundle only when the refresh worked, else null (a toast or the off-line banner says why)
  refresh: (o) => loader.load({ refresh: !!o?.hard, manual: true }).then((b) => loader.ok ? b : null).catch(() => null),
  connect: (entry) => firstLoad(String(entry)),
  factPanel,
  signOut: () => signOut(),
  teamPicker: (opts) => teamPicker(ctx, opts),
  status,
  weeks: () => weeksOf(store.get("entry")),
  // the weeks picked: kept, and the bundle asked for that plan now
  setWeeks: (n) => {
    local.set(HORIZON_KEY(store.get("entry")), String(n));
    return ctx.refresh();
  },
  gap: () => gapOf(),
  // (the plan's data anew with it: every solve's values from it, so each is asked again under the new gap)
  setGap: (g) => {
    local.set(GAP_KEY, JSON.stringify({ ...gapOf(), ...g }));
    const d = store.get("data");
    if (d) store.set("data", { ...d, gap: gapOf() });
  },
  presolveOn: () => local.get(PRESOLVE_KEY) === "1",
  setPresolve: (on) => {
    local.set(PRESOLVE_KEY, on ? "1" : null);
  },
  // Chips… opened on GW g: its chips are solved now (ahead.chipPreps); none before, none of a GW never opened (owner,
  // 2026-10-28); kept for the team until sign-out
  askChips: (g) => {
    const entry = String(store.get("entry")), was = store.get("chipsAt");
    const gws = String(was?.entry) === entry ? was.gws : [];
    if (gws.includes(Number(g))) return;
    store.set("chipsAt", { entry, gws: [...gws, Number(g)] });
    notify("chips");
  }
};
function status() {
  const s = store.get("conn")?.state;
  if (s === "offline") return { tone: "none", text: "Forkcast server unreachable" };
  if (s === "ok" || s === "offline-data") return { tone: "fresh", text: "Up to date" };
  return { tone: "amber", text: s === "updating" ? "The forecast is updating" : "Plan is updating" };
}
function applyTheme() {
  document.documentElement.dataset.theme = "light";
}
function parseHash(hash = location.hash) {
  const [path, q = ""] = hash.replace(/^#\/?/, "").split("?");
  const [name, id] = path.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(q));
  if (name === "player" && /^\d+$/.test(id || "")) return { name, params: { ...params, id: Number(id) } };
  return { name: SCREEN, params: name === SCREEN ? params : {} };
}
var wantA = false;
var gwA = () => store.get("data")?.gw ?? null;
var hashOf = (name, params = {}) => {
  if (name === "player") {
    const { id, ...rest } = params;
    return `#/player/${id}${qs(rest)}`;
  }
  return `#/${name}${qs(params)}`;
};
function navigate(name, params = {}, { replace = false, top = !replace } = {}) {
  sheets.afterPop(() => {
    const hash = hashOf(name, params);
    if (name === SCREEN && top) screen.el?.scrollTo({ top: 0 });
    if (hash === location.hash) return route();
    if (replace) {
      history.replaceState(history.state, "", hash);
      route();
    } else location.hash = hash;
  });
}
var routeSheet = null;
function route() {
  const r = parseHash();
  if (r.name === "player") {
    sheets.routed();
    openSheet("player", r.params.id).finally(() => sheets.routed(false)).then((sh) => {
      routeSheet = sh || null;
      if (sh) {
        const prev = sh.onClose;
        sh.onClose = () => {
          prev?.();
          if (routeSheet === sh) {
            routeSheet = null;
            if (parseHash().name === "player") navigate(SCREEN, screenParams(), { replace: true });
          }
        };
      }
    });
    return;
  }
  if (routeSheet) {
    const sh = routeSheet;
    routeSheet = null;
    sh.close();
  }
  if (/^\d+$/.test(r.params.gw || "")) {
    wantA = false;
    store.set("gw", Number(r.params.gw));
  } else if (Number.isFinite(gwA())) {
    wantA = false;
    store.set("gw", gwA());
  } else wantA = true;
  const canon = canonical();
  if (location.hash !== canon) history.replaceState(history.state, "", canon);
  showScreen();
}
var screenParams = () => Number.isFinite(store.get("gw")) ? { gw: store.get("gw") } : {};
function canonical() {
  return parseHash().name === SCREEN ? hashOf(SCREEN, screenParams()) : null;
}
store.on("gw", () => {
  const canon = canonical();
  if (canon && location.hash !== canon) history.replaceState(history.state, "", canon);
});
var skipHash = null;
function carry(to) {
  to ??= canonical();
  if (!to || location.hash === to) return;
  skipHash = location.href;
  history.replaceState(history.state, "", to);
}
addEventListener("hashchange", (e) => {
  const skip = e.newURL === skipHash;
  skipHash = null;
  if (!skip) route();
});
function showScreen() {
  if (store.get("bundle")) ensureMounted().then(() => shown());
  placeBanner();
}
function shown() {
  screen.fresh = false;
  screen.handle?.show?.();
}
async function ensureMounted() {
  const s = screen;
  if (s.handle || !store.get("bundle")) return;
  if (!s.mounting) {
    s.mounting = (async () => {
      s.mod = s.mod || await optionalModule(`./${SCREEN}.js`);
      if (!s.mod?.mount) return;
      await linkCss(s.mod.css);
      s.el.replaceChildren();
      revealOnce = pendingReveal;
      try {
        s.handle = s.mod.mount(s.el, ctx) || {};
        s.fresh = true;
      } catch (e) {
        console.error(`Forkcast: ${SCREEN}.js mount failed`, e);
        s.handle = {};
        fill(s.el, h("div.m-card", { style: { marginTop: "24px" } }, h("p.m-para", null, "Something went wrong showing this screen. Your plan is unchanged. Reload the page to try again.")));
      } finally {
        pendingReveal = false;
        revealOnce = false;
      }
      placeBanner();
    })().finally(() => {
      s.mounting = null;
    });
  }
  return s.mounting;
}
function drop() {
  const s = screen;
  try {
    s.handle?.unmount?.();
  } catch (e) {
    console.error(`Forkcast: ${SCREEN}.js unmount failed`, e);
  }
  s.handle = null;
  s.el.replaceChildren();
}
function notify(why) {
  const s = screen;
  if (s.handle?.update) {
    try {
      s.handle.update(why);
    } catch (e) {
      console.error(`Forkcast: ${SCREEN}.js update failed`, e);
    }
  } else if (s.handle && why === "bundle") {
    drop();
    ensureMounted();
  }
  placeBanner();
}
function renderBanner() {
  const c = store.get("conn") || {};
  const at = hhmm(c.at);
  let kind = null, text = "", extra = null;
  if (c.state === "offline") {
    kind = "offline";
    text = store.get("bundle") ? COPY.offline(at) : plain(c.error);
    extra = h("button", { type: "button", onClick: () => loader.load({ manual: true }).catch(() => {
    }) }, "Retry");
  } else if (c.state === "updating") {
    kind = "updating";
    text = COPY.updating;
  }
  banner.className = `m-banner ${kind || ""}`;
  banner.hidden = !kind;
  fill(banner, h("span.m-banner-ic", { "aria-hidden": "true" }), h("span.m-banner-t", null, text), extra);
}
function placeBanner() {
  const el = screen.el;
  if (!el) return;
  const slot = $("[data-banner-slot]", el);
  if (slot) {
    if (banner.parentNode !== slot) slot.append(banner);
  } else if (banner.parentNode !== el || el.firstChild !== banner) el.prepend(banner);
}
store.on("conn", () => {
  renderBanner();
  notify("conn");
});
var POLL_MS = { updating: 5e3, "offline-data": 6e4, ready: 12e4 };
var pollMs = (b) => POLL_MS[b.state] ?? POLL_MS.ready;
var BACKOFF_MS = [5e3, 1e4, 2e4, 3e4];
async function fetchBundle(entry, { refresh = false, prev = null } = {}) {
  const same = String(prev?.entry?.id) === String(entry);
  const have = prev?.version && same ? prev.version : null;
  const hl = same ? prev.live_v ?? null : null;
  if (same && prev.cards && String(held.entry) !== String(entry)) Object.assign(held, { entry: String(entry), cards: prev.cards, v: prev.cards_v ?? null, version: prev.version ?? null, key: null, at: 0 });
  const w = weeksOf(entry, prev ?? void 0);
  const b = await getBundle(entry, { refresh, have, hl, w, cl: true });
  askCards(entry, b, w);
  const mine = String(held.entry) === String(entry) && held.version === b.version ? held : { cards: null, v: null };
  const kept = have && b.version === have && b.players == null && b.seeds == null;
  return {
    ...kept ? { ...b, players: prev.players, seeds: prev.seeds } : b,
    ...kept && b.live == null && hl && b.live_v === hl ? { live: prev.live ?? null } : {},
    // a server that sent cards anyway (pre-cl) is read as before
    ...b.cards ? {} : { cards: mine.cards, cards_v: mine.v }
  };
}
var held = { entry: null, cards: null, v: null, version: null, key: null, at: 0, asking: false };
var CARDS_AGAIN_MS = 12e4;
function askCards(entry, b, w) {
  if (!b?.entry || b.state === "updating" || held.asking && String(held.entry) === String(entry)) return;
  if (String(held.entry) !== String(entry)) Object.assign(held, { entry: String(entry), cards: null, v: null, version: null, key: null, at: 0 });
  const key = [b.version, b.state].join("|");
  if (held.key === key && Date.now() - held.at < CARDS_AGAIN_MS) return;
  const hc = held.cards ? held.v : null;
  held.asking = true;
  getCards({ entry, hc, w }).then((c) => {
    if (String(held.entry) !== String(entry)) return;
    const got = c.cards ?? (hc && c.cards_v === hc ? held.cards : null);
    Object.assign(held, { cards: got, v: got ? c.cards_v : null, version: b.version, key, at: Date.now() });
    landCards(entry);
  }, () => {
  }).finally(() => {
    if (String(held.entry) === String(entry)) held.asking = false;
  });
}
function landCards(entry) {
  const b = store.get("bundle");
  if (!b || String(store.get("entry")) !== String(entry) || String(b.entry?.id) !== String(entry) || b.version !== held.version || b.cards === held.cards) return;
  const was = loader.last === JSON.stringify(b);
  Object.assign(b, { cards: held.cards, cards_v: held.v });
  if (was) loader.last = JSON.stringify(b);
  if (store.get("conn")?.state !== "offline" && !store.get("conn")?.snapshot) saveSnapshot(entry, b);
}
var loader = {
  timer: null,
  seq: 0,
  misses: 0,
  last: "",
  plan: { v: void 0, at: NaN },
  ok: false,
  schedule(ms) {
    clearTimeout(this.timer);
    this.timer = ms ? setTimeout(() => this.load().catch(() => {
    }), ms) : null;
  },
  /** → the bundle for the connected entry (throws when there is nothing to show). */
  async load({ refresh = false, manual = false } = {}) {
    const entry = store.get("entry");
    if (!entry) return null;
    const my = ++this.seq;
    const t0 = Date.now();
    try {
      const b = await fetchBundle(entry, { refresh, prev: store.get("bundle") });
      if (my !== this.seq) return b;
      this.misses = 0;
      this.ok = true;
      accept(entry, b);
      this.schedule(pollMs(b));
      return b;
    } catch (e) {
      if (my !== this.seq) throw e;
      this.ok = false;
      const had = !!store.get("bundle");
      const offline = isDown(e) && (!had || offlineNow(this.misses, Date.now() - t0));
      if (!had) {
        const snap = loadSnapshot(entry);
        if (snap && offline) accept(entry, snap.bundle, { at: snap.at, offline: true, snapshot: true });
      }
      if (offline) store.set("conn", { ...store.get("conn"), state: "offline", error: e });
      else if (manual) toast(plain(e, { entry }), "error");
      this.schedule(BACKOFF_MS[Math.min(this.misses++, BACKOFF_MS.length - 1)]);
      if (!store.get("bundle")) throw e;
      return store.get("bundle");
    }
  }
};
function accept(entry, b, { at = Date.now(), offline = false, snapshot = false } = {}) {
  const sig = JSON.stringify(b);
  const changed = sig !== loader.last;
  loader.last = sig;
  const plan = b.version ?? null;
  if (plan !== loader.plan.v || snapshot) loader.plan = { v: plan, at };
  const conn = {
    state: offline ? "offline" : b.state === "ready" || !b.state ? "ok" : b.state,
    at: loader.plan.at,
    error: null,
    // the saved bundle of a warm start, until a live one lands (ahead.sayCheer)
    snapshot: !!snapshot
  };
  if (snapshot && !offline) waitBare();
  else holdBare(offline ? null : b.bare, b.version ?? null);
  if (changed) {
    const data = { ...derive(b, at), gap: gapOf() };
    const gw = store.get("gw");
    if (wantA || !Number.isFinite(gw) || !data.horizon.includes(gw)) store.set("gw", data.gw);
    wantA = false;
    store.set({ bundle: b, data });
    if (!offline && !snapshot) saveSnapshot(entry, b);
  }
  store.set("conn", conn);
  if (changed) notify("bundle");
  if (store.get("bundle")) {
    ensureMounted().then(() => {
      if (screen.fresh) shown();
    });
    if (!offline) preloadModules();
  }
}
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible") {
    if (!away()) seen(true);
    return;
  }
  shownCheck = true;
  if (await reloadIfReleased()) return;
  shownCheck = false;
  if (signOutIfAway() || !store.get("entry") || !gate.hidden) return;
  const at = store.get("conn")?.at;
  if (!Number.isFinite(at) || Date.now() - at > 3e4 || store.get("conn")?.state !== "ok") loader.load().catch(() => {
  });
});
var ptr = h("div.m-ptr", { "aria-hidden": "true" }, h("i"));
app.append(ptr);
{
  const el = screen.el;
  let y0 = null, x0 = 0, dy = 0, pulling = false;
  const paint = () => {
    const d = Math.min(dy * 0.5, 80);
    ptr.style.opacity = String(Math.min(1, d / 50));
    ptr.style.transform = `translateY(${d - 40}px) rotate(${d * 4}deg)`;
    ptr.classList.toggle("ready", d >= 60);
  };
  el.addEventListener("touchstart", (e) => {
    y0 = el.scrollTop <= 0 && e.touches.length === 1 && !e.target.closest("[data-nopull]") && !sheets.depth() ? e.touches[0].clientY : null;
    x0 = e.touches[0].clientX;
    dy = 0;
    pulling = false;
  }, { passive: true });
  el.addEventListener("touchmove", (e) => {
    if (y0 == null || e.defaultPrevented) return;
    dy = e.touches[0].clientY - y0;
    if (!pulling && (dy < 10 || Math.abs(e.touches[0].clientX - x0) > dy || el.scrollTop > 0)) {
      if (dy < 0 || Math.abs(e.touches[0].clientX - x0) > 10) y0 = null;
      dy = 0;
      return;
    }
    pulling = true;
    holdTouch(e);
    paint();
  }, { passive: false });
  const end = async () => {
    if (y0 == null || !pulling) {
      y0 = null;
      return;
    }
    y0 = null;
    pulling = false;
    if (Math.min(dy * 0.5, 80) >= 60) {
      ptr.classList.add("busy");
      ptr.style.transform = "translateY(20px)";
      await loader.load({ refresh: true, manual: true }).catch(() => {
      });
      ptr.classList.remove("busy");
    }
    dy = 0;
    ptr.style.transition = "opacity .3s, transform .3s";
    paint();
    setTimeout(() => {
      ptr.style.transition = "";
    }, 320);
  };
  el.addEventListener("touchend", end);
  el.addEventListener("touchcancel", end);
}
async function openSheet(name, ...args) {
  const mod = await optionalModule(`./sheets/${name}.js`);
  if (mod?.open) return mod.open(ctx, ...args);
  if (name === "player") return playerFallback(args[0]);
  toast("That part of Forkcast is still being built.", "info");
  return null;
}
function playerFallback(id) {
  const d = store.get("data");
  const p = d?.byId.get(Number(id));
  return sheets.open({
    title: p?.name ?? `Player ${id}`,
    sub: p ? `${p.club} \xB7 ${posCode(p.pos)} \xB7 ${fmt.money(p.price)}` : "",
    detent: "medium",
    build(body) {
      if (!p) {
        body.append(h("p.m-para", null, "Not in this forecast."));
        return;
      }
      body.append(h("div.m-well", null, d.xpGws.map((g, i) => h(
        "div.m-kv",
        null,
        h("span", null, `GW${g}${g > d.horizon[d.horizon.length - 1] ? " \xB7 forecast only" : ""}`),
        h("span.m-num", null, xpNum(fmt.pts(p.xp?.[i])))
      ))));
    }
  });
}
function showGate(...kids) {
  sheets.closeAll();
  gate.hidden = false;
  gate.className = "m-gate";
  document.documentElement.classList.add("m-gated");
  screen.el.inert = true;
  fill(gate, ...kids);
}
function hideGate() {
  document.documentElement.classList.remove("m-gated");
  screen.el.inert = false;
  gate.hidden = true;
  gate.className = "m-gate";
  gate.replaceChildren();
}
var vv = globalThis.visualViewport;
var kbSync = () => gate.style.setProperty("--kb", `${Math.max(0, innerHeight - vv.height - vv.offsetTop)}px`);
vv?.addEventListener("resize", kbSync);
vv?.addEventListener("scroll", kbSync);
function whereSheet(example) {
  sheets.open({
    title: COPY2.where,
    detent: "small",
    build(body) {
      body.append(
        h("p.m-para", null, "On the FPL site open ", h("b", null, "Points"), " and look at the address:"),
        h("p.m-idurl.m-num", null, "fantasy.premierleague.com/entry/", h("b", null, example || "1234567"), "/event/\u2026"),
        h("p.m-foot.m-idnote", null, "You can paste the whole address into the field.")
      );
    }
  });
}
function showConnect({ error = "", tone = "", retry = null, value = "" } = {}) {
  clearTimeout(loader.timer);
  const err = h("div.m-err", { class: tone, role: "alert" }, error, retry ? h("button", { type: "button", onClick: retry }, "Retry") : null);
  const picker = teamPicker(ctx, { value, onPick: (id) => firstLoad(id), onWhere: (id) => whereSheet(id), recent: 3 });
  picker.field.addEventListener("input", () => err.replaceChildren(), { once: true });
  const go = h("button.m-primary.lg", { type: "button", onClick: () => picker.submit() }, "Find my team");
  const where = h("button.m-where", { type: "button", onClick: () => whereSheet(readId(picker.field.value)) }, COPY2.where);
  const land = HELP_OFF ? null : h("div.m-land");
  const start = () => {
    gate.scrollTo({ top: 0 });
    if (picker.field.value.trim()) picker.submit();
    else picker.focus();
  };
  if (land) import("./sheets/about.js").then((m) => land.replaceWith(m.landing(ctx, { start }))).catch(() => land.remove());
  showGate(
    h("div.m-wordmark", null, h("h1", null, "Forkcast")),
    // an error sits right under its field
    h("div.m-form", null, picker.el, err, h("div.m-go", null, go), where),
    h("div.m-prog", { "aria-live": "polite" }),
    picker.recent,
    ...land ? [land] : [],
    h("p.m-legal", null, COPY.whyLegal)
  );
  setTimeout(() => {
    if (!gate.classList.contains("loading")) picker.focus();
  }, 350);
}
function signOut({ away: away2 = false } = {}) {
  const entry = store.get("entry");
  if (!entry) return null;
  const name = store.get("bundle")?.entry?.team_name || recent.list().find((r) => String(r.entry_id) === String(entry))?.team_name || `Team ${entry}`;
  release(api_exports, entry);
  const keys = [.../* @__PURE__ */ new Set([
    ...loadSnapshot(entry) ? ["fc:snapshot"] : [],
    ...[`fc:ahead:sugg:${entry}`, HORIZON_KEY(entry)],
    // its fc:mem mirror: memory forget's
    ...local.keys(`fc:ahead:lu:${entry}:`)
  ])];
  keys.forEach((k) => local.set(k, null));
  clearTimeout(loader.timer);
  loader.seq++;
  loading++;
  drop();
  store.set({ entry: null, bundle: null, data: null, memory: null });
  Object.assign(held, { entry: null, cards: null, v: null, version: null, key: null, at: 0, asking: false });
  loader.last = "";
  history.replaceState(history.state, "", `#/${SCREEN}`);
  showConnect();
  if (away2) toast(COPY.awaySignedOut(name), "info", { timeout: 8e3 });
  return { name };
}
var SEEN_KEY = "fc:seen";
var seenAt = 0;
var shownCheck = false;
function seen(force = false, team = true) {
  const now = Date.now();
  if (!force && now - seenAt < 15e3) return;
  seenAt = now;
  local.set(SEEN_KEY, String(now));
  const entry = team ? store.get("entry") : null;
  if (entry) local.set(USED(entry), String(now));
}
var away = () => {
  const t = Number(local.get(SEEN_KEY));
  return !(t > 0) || Date.now() - t > FORGET_MS;
};
function signOutIfAway() {
  const was = !!store.get("entry") && away();
  if (was) signOut({ away: true });
  seen(true);
  return was;
}
function awayOnScreen(e) {
  if (shownCheck) return true;
  if (!store.get("entry") || !away()) return false;
  signOutIfAway();
  if (e?.type === "pointerdown") {
    const eat = (c) => {
      c.stopPropagation();
      c.preventDefault();
    };
    document.addEventListener("click", eat, { capture: true, once: true });
    setTimeout(() => document.removeEventListener("click", eat, { capture: true }), 1e3);
  }
  return true;
}
setInterval(() => {
  if (document.visibilityState === "visible") awayOnScreen();
}, 6e4);
for (const t of ["pointerdown", "keydown"]) document.addEventListener(t, (e) => {
  if (!awayOnScreen(e)) seen();
}, { capture: true, passive: true });
var ownRelease = null;
async function reloadIfReleased() {
  const now = await servedRelease();
  ownRelease ??= $('meta[name="forkcast-release"]')?.content ?? now;
  if (!now || now === ownRelease) return false;
  const key = "fc:reloaded", tried = (() => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  })();
  if (tried === now) return false;
  try {
    sessionStorage.setItem(key, now);
  } catch {
  }
  location.reload();
  return true;
}
var pendingReveal = false;
var loading = 0;
var SLOW_MS = 12e3;
var FIRST_RETRY_MS = 3e3;
var SLOW_COPY = "Still loading: a slow connection can take a minute or two.";
function factPanel(el, lines, one = lines?.at(-1)) {
  el.hidden = !lines?.length;
  if (!lines?.length) return false;
  const para = (ls) => h("p", null, ls.flatMap(([pre, num, post], i) => [i ? " " : "", pre, h("b", null, num), post]));
  const was = el.textContent, key = `${lines.map((l) => l.join("")).join(" ")}|${one?.join("")}|${el.clientWidth}`;
  if (el._facts !== key) {
    el._facts = key;
    fill(el, para(lines));
    if (lines.length > 1 && one && el.firstChild.getBoundingClientRect().height > el.clientHeight + 0.5) fill(el, para([one]));
    if (el.textContent !== was && !reduceMotion()) el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
  }
  return true;
}
async function firstLoad(entry) {
  const my = ++loading;
  clearTimeout(loader.timer);
  const was = gate.hidden && store.get("bundle") ? store.get("entry") : null;
  if (gate.hidden) showConnect({ value: entry });
  document.activeElement?.blur?.();
  gate.classList.add("loading");
  const go = $(".m-go .m-primary", gate);
  if (go) {
    go.disabled = true;
    go.textContent = "Finding\u2026";
  }
  const prog = $(".m-prog", gate);
  const facts = h("div.m-facts");
  const show = (b2) => {
    fill(
      prog,
      h("p.m-prog-t.m-num", null, b2 ? planning(b2?.meta ? horizonOf(b2.meta) : null) : `Finding team ${entry}\u2026`),
      h("div.m-bar", { "aria-hidden": "true" }, h("i.m-eta.sweep")),
      b2?.state === "updating" ? h("p.m-prog-t.warn", null, COPY.updating) : null,
      facts
    );
    factPanel(facts, waitFacts(b2), waitFact(b2));
  };
  const back = (e) => {
    if (my !== loading) return;
    const retry = isDown(e) || e.status >= 500 ? () => firstLoad(entry) : null;
    if (was != null && String(was) !== String(entry) && store.get("entry") === was) {
      hideGate();
      loader.schedule(pollMs(store.get("bundle")));
      toast(plain(e, { entry }), "warn", retry ? { action: { label: "Retry", onClick: retry } } : {});
      return;
    }
    showConnect({ error: plain(e, { entry }), retry, value: entry });
  };
  show(null);
  const slow = setTimeout(() => {
    if (my === loading && $(".m-prog-t", prog)) prog.append(h("p.m-prog-t.m-prog-slow", null, SLOW_COPY));
  }, SLOW_MS);
  const fetchFirst = async (opts) => {
    try {
      return await fetchBundle(entry, opts);
    } catch (e) {
      if (!(isDown(e) || e.status >= 500)) throw e;
      await wait(FIRST_RETRY_MS);
      return my === loading ? fetchBundle(entry, opts) : null;
    }
  };
  let b;
  try {
    b = await fetchFirst();
  } catch (e) {
    return back(e);
  } finally {
    clearTimeout(slow);
  }
  if (my !== loading) return;
  if (b.state === "offline-data" || !b.entry) return enter(entry, b);
  while (b.state === "updating") {
    show(b);
    await wait(POLL_MS.updating);
    if (my !== loading) return;
    try {
      b = await fetchFirst({ prev: b });
    } catch (err) {
      return back(err);
    }
    if (my !== loading) return;
  }
  return enter(entry, b, { reveal: true });
}
async function enter(entry, b, { reveal = false } = {}) {
  seen(true, false);
  store.set("entry", entry);
  recent.add(entry, b.entry || {});
  drop();
  loader.last = "";
  loader.plan = { v: void 0, at: NaN };
  pendingReveal = reveal;
  const A = Number(b.meta?.gw);
  if (Number.isFinite(A)) store.set("gw", A);
  history.replaceState(null, "", hashOf(SCREEN, screenParams()));
  accept(entry, b);
  loader.schedule(pollMs(b));
  showScreen();
  await ensureMounted();
  hideGate();
}
var STUDIO_ROUTES = /^#\/(lab|planner|plan|dashboard|players|compare|fixtures|runs|backtests|preview|data|docs)(?:[/?]|$)/;
function studioLink() {
  if (!STUDIO_ROUTES.test(location.hash) || !LOOPBACK.has(location.hostname)) return false;
  location.replace(`/studio/${location.hash}`);
  return true;
}
async function boot() {
  if (studioLink()) return;
  placeToasts(sheets);
  toastRegion();
  applyTheme();
  document.addEventListener("touchstart", () => {
  }, { passive: true });
  renderBanner();
  if (globalThis.performance?.getEntriesByType?.("navigation")[0]?.type === "back_forward") {
    location.reload();
    return;
  }
  reloadIfReleased();
  if (signOutIfAway()) return;
  const entry = store.get("entry");
  if (!entry) return showConnect();
  if (!location.hash || location.hash === "#" || location.hash === "#/") history.replaceState(null, "", `#/${SCREEN}`);
  gate.hidden = true;
  route();
  const snap = loadSnapshot(entry);
  if (snap) accept(entry, snap.bundle, { at: snap.at, snapshot: true });
  try {
    await loader.load();
  } catch (e) {
    if (!store.get("bundle")) showConnect({ error: plain(e, { entry }), retry: () => boot(), value: entry });
  } finally {
    endBareWait();
  }
}
boot();
