import {
  __export
} from "./chunk-WSFCRVEQ.js";

// js/api.js
var ApiError = class extends Error {
  constructor(message, { status = 0, detail = "", path = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.path = path;
  }
};
function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === void 0 || v === null || v === "" || v === false) continue;
    sp.set(k, v === true ? "1" : String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
var enc = encodeURIComponent;
async function request(method, path, { query, body } = {}) {
  const url = path + qs(query);
  const init = { method, headers: { Accept: "application/json" } };
  if (body !== void 0) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new ApiError("The Studio server is not reachable. Is `python forkcast/ui/server.py` still running?", {
      detail: String(e),
      path
    });
  }
  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(`${method} ${path} returned HTTP ${res.status} that is not JSON`, {
      status: res.status,
      detail: text.slice(0, 2e3),
      path
    });
  }
  if (!res.ok || !payload || payload.ok !== true) {
    throw new ApiError(payload?.error || `${method} ${path} failed with HTTP ${res.status}`, {
      status: res.status,
      detail: payload?.detail || "",
      path
    });
  }
  return payload.data;
}
var get = (path, query) => request("GET", path, { query });
function memo(fn) {
  let p = null;
  const wrapped = ({ force = false } = {}) => {
    if (force || !p) p = fn().catch((e) => {
      p = null;
      throw e;
    });
    return p;
  };
  wrapped.clear = () => {
    p = null;
  };
  return wrapped;
}
var getMeta = memo(() => get("/api/meta"));
var getFlags = memo(() => get("/api/flags"));
function sleep(ms, signal) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });
}

// js/ui.js
var ui_exports = {};
__export(ui_exports, {
  DASH: () => DASH,
  FLICK_MS: () => FLICK_MS,
  ICONS: () => ICONS,
  POS: () => POS,
  append: () => append,
  cardSaysIt: () => cardSaysIt,
  chipName: () => chipName,
  fill: () => fill,
  fin: () => fin,
  flick: () => flick,
  fmt: () => fmt,
  focusKey: () => focusKey,
  h: () => h,
  holdTouch: () => holdTouch,
  icon: () => icon,
  norm: () => norm,
  overlapOf: () => overlapOf,
  plural: () => plural,
  posCode: () => posCode,
  posName: () => posName,
  reduceMotion: () => reduceMotion,
  refocus: () => refocus,
  roving: () => roving,
  rowKey: () => rowKey,
  setToastPlace: () => setToastPlace,
  shownGain: () => shownGain,
  statusDot: () => statusDot,
  statusInfo: () => statusInfo,
  svg: () => svg,
  toMs: () => toMs,
  toNum: () => toNum,
  toast: () => toast,
  toastLead: () => toastLead,
  toastParts: () => toastParts,
  toastRegion: () => toastRegion,
  uid: () => uid,
  whileConnected: () => whileConnected,
  xpGain: () => xpGain,
  xpMark: () => xpMark,
  xpNum: () => xpNum,
  xpOf: () => xpOf
});
var SVG_NS = "http://www.w3.org/2000/svg";
var PROPS = /* @__PURE__ */ new Set(["value", "checked", "selected", "indeterminate", "muted"]);
var uidSeq = 0;
var uid = (prefix = "u") => `${prefix}-${++uidSeq}`;
function setClass(el, v) {
  if (!v) return;
  const names = Array.isArray(v) ? v.flat(Infinity) : typeof v === "object" ? Object.keys(v).filter((k) => v[k]) : String(v).split(/\s+/);
  for (const n of names) if (n) el.classList.add(n);
}
function applyAttrs(el, attrs) {
  if (!attrs) return;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class" || k === "className") setClass(el, v);
    else if (k === "style") {
      if (v == null) continue;
      if (typeof v === "string") el.style.cssText += `;${v}`;
      else for (const [p, val] of Object.entries(v)) {
        if (val == null || val === false) continue;
        if (p.startsWith("--") || p.includes("-")) el.style.setProperty(p, String(val));
        else el.style[p] = val;
      }
    } else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k === "html") el.innerHTML = v ?? "";
    else if (k === "ref") v?.(el);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (PROPS.has(k)) el[k] = v;
    else if (v === true) el.setAttribute(k === "htmlFor" ? "for" : k, "");
    else if (v !== false && v != null) el.setAttribute(k === "htmlFor" ? "for" : k, String(v));
  }
}
function append(el, ...children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
var fill = (el, ...kids) => {
  el.replaceChildren();
  return append(el, kids);
};
function parseTag(tag) {
  const [name, ...rest] = tag.split(/(?=[.#])/);
  const cls = [];
  let id = null;
  for (const r of rest) r[0] === "." ? cls.push(r.slice(1)) : id = r.slice(1);
  return { name: name || "div", cls, id };
}
function h(tag, attrs, ...children) {
  const { name, cls, id } = parseTag(tag);
  const el = document.createElement(name);
  if (cls.length) el.classList.add(...cls);
  if (id) el.id = id;
  applyAttrs(el, attrs);
  return append(el, children);
}
function svg(tag, attrs, ...children) {
  const { name, cls, id } = parseTag(tag);
  const el = document.createElementNS(SVG_NS, name);
  if (cls.length) el.setAttribute("class", cls.join(" "));
  if (id) el.id = id;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.setAttribute("class", [el.getAttribute("class"), Array.isArray(v) ? v.join(" ") : v].filter(Boolean).join(" "));
    else if (k === "style" && typeof v === "object") for (const [p, val] of Object.entries(v)) el.style.setProperty(p, String(val));
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
var xpNum = (text, tag = "span", attrs = null, mark = true) => [h(`${tag}.xp`, attrs, text), mark ? xpMark() : null];
var xpGain = (d, tag = "span", attrs = null, mark = true, pre = "") => xpNum(`${pre}${fmt.signed(d)}`, `${tag}.xp-g`, attrs, mark);
var shownGain = (d) => fmt.signed(d).startsWith("+");
var xpMark = () => h("span.xp-u", { "aria-hidden": "true" }, "xP");
function whileConnected(el, fn, ms = 1e3, onEnd) {
  let seen = false;
  let idle = 0;
  const t = setInterval(() => {
    if (el.isConnected) {
      seen = true;
      fn();
      return;
    }
    if (seen || ++idle * ms > 1e4) {
      clearInterval(t);
      onEnd?.();
    }
  }, ms);
  return () => clearInterval(t);
}
var ICONS = {
  dashboard: "M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z",
  planner: "M7 4 3 8l4 4M3 8h13M17 12l4 4-4 4M21 16H8",
  players: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c.5-3.6 3.8-5.6 8-5.6s7.5 2 8 5.6",
  compare: "M5 20V11M10 20V5M15 20v-6M20 20V9",
  fixtures: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2",
  runs: "M4 5h16v14H4zM8 10l3 2-3 2M13 15h3",
  backtests: "M3 12a9 9 0 1 0 2.6-6.4M3 4v5h5M12 8v4l3 2",
  preview: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  data: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  docs: "M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  close: "M6 6l12 12M18 6 6 18",
  reset: "M4 4v6h6M5.1 15a8 8 0 1 0 1.8-8.4L4 10",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7",
  chevron: "M9 6l6 6-6 6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  ban: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5",
  warn: "M12 3.5 2.5 20h19zM12 10v4.5M12 17v.5",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  stop: "M7 7h10v10H7z",
  play: "M7 5l12 7-12 7z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  arrow: "M4 12h15M13 6l6 6-6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  swap: "M7 4 3 8l4 4M3 8h13M17 12l4 4-4 4M21 16H8"
};
function icon(name, { size = 18, label } = {}) {
  if (!name) return null;
  const d = ICONS[name] || (/^[Mm][\d\s.,-]/.test(name) ? name : null);
  if (!d) return h("span.icon-txt", { "aria-hidden": label ? null : "true" }, name);
  const el = svg("svg", {
    class: "icon",
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 1.8,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": label ? null : "true",
    role: label ? "img" : null,
    "aria-label": label || null
  }, svg("path", { d }));
  return el;
}
var DASH = "\u2014";
var MINUS = "\u2212";
var toNum = (v) => v == null || v === "" || typeof v === "boolean" ? NaN : Number(v);
var fin = (v) => Number.isFinite(toNum(v));
var plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
function toMs(t) {
  if (t == null || t === "") return NaN;
  if (t instanceof Date) return t.getTime();
  if (typeof t === "number") return t > 1e12 ? t : t * 1e3;
  const n = Number(t);
  return Number.isFinite(n) ? toMs(n) : Date.parse(t);
}
var dateFmt = () => new Intl.DateTimeFormat(void 0, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});
var fmt = {
  dash: DASH,
  num(x, d = 1) {
    return fin(x) ? toNum(x).toFixed(d).replace("-", MINUS) : DASH;
  },
  /** £m float → "£9.5m" */
  money(m, d = 1) {
    if (!fin(m)) return DASH;
    const v = toNum(m);
    return `${v < 0 ? MINUS : ""}\xA3${Math.abs(v).toFixed(d)}m`;
  },
  pts(x, d = 1) {
    return fmt.num(x, d);
  },
  /** percent units in (13.7 → "13.7%") */
  pct(x, d = 1) {
    return fin(x) ? `${fmt.num(x, d)}%` : DASH;
  },
  gw(n) {
    return n == null || n === "" ? DASH : `GW${n}`;
  },
  signed(x, d = 1) {
    if (!fin(x)) return DASH;
    const v = toNum(x);
    const s = (Math.round(Math.abs(v) * 10 ** d + 1e-6) / 10 ** d).toFixed(d);
    return Number(s) === 0 ? s : `${v > 0 ? "+" : MINUS}${s}`;
  },
  int(n) {
    return fin(n) ? Math.round(toNum(n)).toLocaleString("en-GB").replace("-", MINUS) : DASH;
  },
  /** 1 → "1st", 12 → "12th", 23 → "23rd" (player card ranks) */
  ordinal(r) {
    return `${r}${r % 100 >= 11 && r % 100 <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[r % 10] ?? "th"}`;
  },
  /** 795123 → "795K", 8200 → "8K", 1234567 → "1.2M"; d: the M's decimals if given (rank "2.18M" at 2), else one below
   *  10M, none above. One whole capital K, never "8.2k". */
  compact(n, d = null) {
    if (!fin(n)) return DASH;
    const v = toNum(n), a = Math.abs(v), sign = v < 0 ? MINUS : "";
    if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(d ?? (a >= 1e7 ? 0 : 1))}M`;
    if (a >= 1e3) return `${sign}${Math.round(a / 1e3)}K`;
    return `${sign}${Math.round(a)}`;
  },
  /** seconds → "45s", "3m 05s", "1h 02m" */
  dur(sec) {
    if (!fin(sec)) return DASH;
    const s = Math.max(0, Math.round(toNum(sec)));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
    return `${Math.floor(s / 3600)}h ${String(Math.floor(s % 3600 / 60)).padStart(2, "0")}m`;
  },
  /** any time → "Sat 10 Oct, 13:00" in the viewer's timezone */
  date(t) {
    const ms = toMs(t);
    return Number.isFinite(ms) ? dateFmt().format(ms) : DASH;
  },
  ago(t) {
    const ms = toMs(t);
    if (!Number.isFinite(ms)) return DASH;
    const s = (Date.now() - ms) / 1e3;
    if (s < 45) return "just now";
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400 * 2) return `${Math.round(s / 3600)}h ago`;
    return `${Math.round(s / 86400)}d ago`;
  },
  pos(p) {
    return posName(p) || DASH;
  }
};
var POS = ["GK", "DEF", "MID", "FWD"];
function posName(p) {
  if (p == null) return null;
  if (fin(p)) return POS[toNum(p) - 1] || null;
  const s = String(p).toUpperCase();
  return s === "GKP" ? "GK" : POS.includes(s) ? s : null;
}
var posCode = (p) => {
  const k = posName(p);
  return k === "GK" ? "GKP" : k;
};
function xpOf(p, i = 0) {
  if (!p) return null;
  if (fin(p.xp_value)) return toNum(p.xp_value);
  if (fin(p.pred)) return toNum(p.pred);
  if (Array.isArray(p.xp)) return fin(p.xp[i]) ? toNum(p.xp[i]) : null;
  return fin(p.xp) ? toNum(p.xp) : null;
}
var STATUS_INT = { 1: "a", 2: "d", 3: "i", 4: "n", 5: "s", 0: "u" };
var STATUS_LABEL = { a: "Available", d: "Doubtful", i: "Injured", s: "Suspended", u: "Unavailable", n: "Not available" };
function statusInfo(status, chance) {
  let code = "a";
  let pct = fin(chance) ? toNum(chance) : null;
  if (fin(status)) code = STATUS_INT[Math.trunc(toNum(status))] || "a";
  else if (typeof status === "string" && status) {
    code = status[0].toLowerCase();
    const n = parseInt(status.slice(1), 10);
    if (Number.isFinite(n)) pct = n;
  }
  const partial = pct != null && pct > 0 && pct < 100;
  const tone = code === "a" ? partial ? "warn" : "ok" : code === "d" ? "warn" : "bad";
  const label = (STATUS_LABEL[code] || "Unknown") + (partial ? ` \xB7 ${pct}%` : "");
  return { code, label, tone, chance: pct };
}
function statusDot(status, { chance, news, always = false } = {}) {
  const s = statusInfo(status, chance);
  if (s.tone === "ok" && !always) return null;
  const title = news ? `${s.label}: ${news}` : s.label;
  return h("span.sdot", { class: s.tone, title, role: "img", "aria-label": title });
}
var reduceMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
var holdTouch = (e) => {
  if (e.cancelable) e.preventDefault();
};
var FLICK_WINDOW_MS = 100;
var FLICK_MS = 150;
function flick() {
  const pts2 = [];
  const self = {
    /** A sample: pos (px) at t (ms, event timeStamp); samples older than FLICK_WINDOW_MS go. */
    add(pos, t = performance.now()) {
      pts2.push({ pos, t });
      while (t - pts2[0].t > FLICK_WINDOW_MS) pts2.shift();
      return self;
    },
    velocity() {
      if (pts2.length < 2) return 0;
      const mt = pts2.reduce((s, p) => s + p.t, 0) / pts2.length, mp = pts2.reduce((s, p) => s + p.pos, 0) / pts2.length;
      const den = pts2.reduce((s, p) => s + (p.t - mt) ** 2, 0);
      return den ? pts2.reduce((s, p) => s + (p.t - mt) * (p.pos - mp), 0) / den : 0;
    },
    project: (pos) => pos + self.velocity() * FLICK_MS
  };
  return self;
}
var rowKey = (row) => `[data-row="${globalThis.CSS?.escape ? CSS.escape(row) : String(row).replace(/["\\]/g, "\\$&")}"]`;
function focusKey(el) {
  const row = el?.closest?.("[data-row]");
  if (row) return rowKey(row.dataset.row);
  const mv = el?.closest?.("[data-gw][data-out][data-in]");
  if (mv) return `[data-gw="${mv.dataset.gw}"][data-out="${mv.dataset.out}"][data-in="${mv.dataset.in}"]`;
  return el?.closest?.("[data-focus-home]") ? "[data-focus-home]" : null;
}
var FOCUSABLE = "button:not(:disabled), a[href], input, select, textarea, [tabindex]";
function refocus(root, key, fallback = null) {
  const at = key ? root?.querySelector(key) : null;
  const t = at && (at.matches(FOCUSABLE) ? at : at.querySelector(FOCUSABLE));
  ((t?.getClientRects().length ? t : null) || fallback)?.focus({ preventScroll: true });
}
var cardSaysIt = (kind = "info") => {
  const doc = globalThis.document;
  return kind !== "warn" && !!doc?.querySelector(".ah-ticket") && !doc.querySelector(".m-sheet");
};
function toastRegion() {
  let r = document.getElementById("toasts");
  if (!r) document.body.append(r = h("div#toasts", { "aria-live": "polite", "aria-atomic": "false" }));
  return r;
}
var toastPlace = null;
var setToastPlace = (fn) => {
  toastPlace = typeof fn === "function" ? fn : null;
};
function overlapOf(r, o, pad = 0) {
  const left = Math.max(r.left, o.left - pad), right = Math.min(r.right, o.right + pad);
  const top = Math.max(r.top, o.top - pad), bottom = Math.min(r.bottom, o.bottom + pad);
  return right > left && bottom > top ? { left, top, right, bottom } : null;
}
var STAYING = /* @__PURE__ */ new Set();
var END_MS = 400;
if (typeof addEventListener === "function") {
  addEventListener("pointerdown", (e) => {
    const now = performance.now();
    for (const s of STAYING) if (s.until < now && !s.el.contains(e.target) && s.el.dataset.tag !== "pending") s.ending = true;
  }, { capture: true });
  for (const k of ["pointerup", "pointercancel"]) {
    addEventListener(k, () => {
      const go = [...STAYING].filter((s) => s.ending);
      if (go.length) setTimeout(() => {
        for (const s of go) s.dismiss();
      }, END_MS);
    }, { capture: true });
  }
}
var toastParts = (m) => {
  const cut = [...m.matchAll(/ · (?:[+−-]?\d[\d.,]* pts\b(?: \([a-z ]+\))?|[+−-]?\d[\d,]*(?:\.\d+)? vs (?:rolling|your plan)(?: · total [+−-]?\d[\d,]*(?:\.\d+)?)?|total [+−-]?\d[\d,]*(?:\.\d+)?)/g)].at(-1);
  return cut ? [m.slice(0, cut.index), cut[0], m.slice(cut.index + cut[0].length)] : [m, "", ""];
};
var toastLead = (head) => {
  const i = head.indexOf(" \xB7 ");
  return i < 0 ? [head, ""] : [head.slice(0, i), head.slice(i)];
};
var toastWords = (m, clips = null) => {
  if (typeof m !== "string") return m;
  const [head, num3, rest] = toastParts(m);
  const [lead, also] = toastLead(head);
  const to = lead.lastIndexOf(" \u2192 ");
  const words = h(
    "span.toast-head",
    null,
    h("span.toast-lead", { class: { moves: to > 0 } }, to > 0 ? [h("span.toast-from", null, lead.slice(0, to)), h("span.toast-to", null, lead.slice(to))] : lead),
    also ? h("span.toast-also", null, also.split(/(?= · )/).map((c) => h("span", { class: { "toast-may": !!clips?.includes(c.slice(3)) } }, c))) : null
  );
  if (!num3) return words;
  const nums = num3.split(/(?= · total )/).flatMap((x, j) => j ? [" ", h("span", null, x.slice(1))] : [h("span", null, h("span.toast-sep", null, x.slice(0, 3)), x.slice(3))]);
  return [words, h("span.toast-tail", null, h("span.toast-num", null, nums), rest)];
};
var SPLITS = !!globalThis.CSS?.supports?.("grid-template-columns", "subgrid");
function toast(msg, kind = "info", opts = {}) {
  const region = toastRegion();
  const up = opts.replaces ? [...region.children].find((t) => t.dataset.tag === opts.replaces && !t.classList.contains("leaving")) : null;
  if (up?.retoast) return up.retoast(msg, kind, opts);
  let ic = null, kd = null, btns = [], ms = 0, timer = 0, ondis = null, take = null;
  const dismiss = () => {
    if (!el.isConnected || el.classList.contains("leaving")) return;
    STAYING.delete(stay);
    el.classList.add("leaving");
    ro?.disconnect();
    setTimeout(() => el.remove(), 160);
    const f = ondis;
    ondis = null;
    f?.();
  };
  const text = h("span.toast-msg");
  const x = h("button.icon-btn", { type: "button", "aria-label": "Dismiss", onClick: () => dismiss() }, icon("close", { size: 14 }));
  const el = h("div.toast", { class: { quiet: !!opts.quiet } }, text, x);
  const stay = { el, until: 0, dismiss, held: 0 };
  const restart = () => {
    stay.until = stay.held ? Infinity : performance.now() + ms;
  };
  const hold = (r) => {
    if (typeof r?.then !== "function") return;
    stay.held++;
    restart();
    const back = () => {
      stay.held--;
      restart();
    };
    r.then(back, back);
  };
  el.addEventListener("toast-armed", restart, { once: true });
  const fit = () => globalThis.requestAnimationFrame?.(() => {
    if (!text.isConnected) return;
    text.classList.remove("long", "tailrow");
    el.classList.remove("under", "split");
    for (const c of text.querySelectorAll(".toast-may.off")) c.classList.remove("off");
    const lh = parseFloat(getComputedStyle(text).lineHeight) || 17;
    const lines = (e) => e ? Math.round(e.getBoundingClientRect().height / lh) : 0;
    const tail = text.querySelector(".toast-tail");
    if (take && SPLITS && btns.length && text.getBoundingClientRect().height > lh + 1) {
      el.classList.add("split");
      const whole = (e) => !e || e.scrollWidth <= e.clientWidth + 1;
      const head = text.querySelector(".toast-head");
      const may = [...text.querySelectorAll(".toast-may")], buy = text.querySelector(".toast-to");
      while (may.length && (!whole(buy) || may.some((c) => !whole(c)))) may.pop().classList.add("off");
      if (whole(tail) && lines(tail) <= 1 && whole(head) && whole(text.querySelector(".toast-to")) && [...text.querySelectorAll(".toast-also > span:not(.toast-may)")].every(whole)) return;
      el.classList.remove("split");
    }
    const under = btns.some((b) => {
      const r = b.el.getBoundingClientRect();
      return r.height && r.top + r.height / 2 > text.getBoundingClientRect().bottom;
    });
    el.classList.toggle("under", under);
    const box = text.getBoundingClientRect();
    const most = under ? 2 : 3;
    const long = box.height > most * lh + 1;
    if (long) {
      const t = lines(text.querySelector(".toast-head")) ? Math.min(lines(text.querySelector(".toast-tail")), 2) : most;
      text.style.setProperty("--tail-lines", t);
      text.classList.add("long");
      text.style.setProperty("--lead-lines", Math.max(1, most - t - lines(text.querySelector(".toast-also"))));
    }
    text.classList.toggle("long", long);
    const tl = text.querySelector(".toast-tail"), hd = text.querySelector(".toast-head");
    text.classList.toggle("tailrow", !!tl && !!hd && tl.getBoundingClientRect().top >= hd.getBoundingClientRect().bottom - 0.5);
  });
  let fitW = 0;
  const ro = globalThis.ResizeObserver ? new ResizeObserver(([e]) => {
    const w = e.contentRect.width;
    if (Math.abs(w - fitW) > 0.5) {
      fitW = w;
      fit();
    }
  }) : null;
  ro?.observe(el);
  dismiss.update = (m) => {
    if (el.isConnected && !el.classList.contains("leaving")) {
      fill(text, toastWords(m, take));
      fit();
    }
  };
  el.retoast = (m, k, { timeout = 4500, action, actions, tag = null, onDismiss = null, take: tk = null } = {}) => {
    take = tk;
    const left = ondis;
    ondis = null;
    left?.();
    if (kd !== k) {
      if (kd) el.classList.remove(kd);
      el.classList.add(kd = k);
      el.setAttribute("role", k === "error" ? "alert" : "status");
      const i = icon(k === "ok" ? "check" : k === "error" || k === "warn" ? "warn" : "info");
      if (ic) ic.replaceWith(i);
      else el.prepend(i);
      ic = i;
    }
    fill(text, toastWords(m, take));
    fit();
    const list = actions ?? (action ? [action] : []);
    const had = new Map(btns.map((b) => [b.label, b]));
    btns = list.map((a) => {
      const b = had.get(a.label) ?? { label: a.label };
      had.delete(a.label);
      b.act = a;
      b.el ??= h("button.btn.sm.ghost", { type: "button", onClick: () => {
        if (b.act.keep) {
          hold(b.act.onClick?.());
          return;
        }
        ondis = null;
        b.act.onClick?.();
        dismiss();
      } }, a.label);
      return b;
    });
    for (const b of had.values()) b.el.remove();
    let next = x;
    for (const b of [...btns].reverse()) {
      if (b.el.nextSibling !== next) next.before(b.el);
      next = b.el;
    }
    if (tag) el.dataset.tag = tag;
    else delete el.dataset.tag;
    ondis = onDismiss;
    ms = k === "error" ? Math.max(timeout, 8e3) : timeout;
    clearTimeout(timer);
    if (list.length) {
      for (const s of [...STAYING]) if (s !== stay && s.el.dataset.tag !== "pending") s.dismiss();
      STAYING.add(stay);
      restart();
    } else {
      STAYING.delete(stay);
      if (timeout) timer = setTimeout(dismiss, ms);
    }
    return dismiss;
  };
  el.retoast(msg, kind, opts);
  region.append(el);
  if (toastPlace) {
    const p = toastPlace(region, el);
    if (typeof p === "string") region.dataset.place = p;
  }
  return dismiss;
}
var ROVING = /* @__PURE__ */ new WeakMap();
function roving(group, { items = () => [...group.querySelectorAll(':scope > [role="radio"]')], attr = "aria-checked", pick } = {}) {
  let r = ROVING.get(group);
  if (!r) {
    r = {
      paint() {
        const all = items();
        const on = all.filter((b) => !b.disabled);
        const cur = on.find((b) => b.getAttribute(attr) === "true") ?? on[0];
        for (const b of all) b.tabIndex = b === cur ? 0 : -1;
      }
    };
    group.addEventListener("keydown", (e) => {
      const enabled = items().filter((b2) => !b2.disabled);
      const i = enabled.indexOf(document.activeElement);
      if (i < 0) return;
      const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: enabled.length - 1 }[e.key];
      if (next == null) return;
      e.preventDefault();
      const b = enabled[(next + enabled.length) % enabled.length];
      b.focus();
      pick?.(b);
      if (!b.isConnected) {
        r.paint();
        items().find((x) => x.tabIndex === 0)?.focus({ preventScroll: true });
      }
    });
    ROVING.set(group, r);
  }
  r.paint();
  return group;
}
var CHIPS = {
  wc: "Wildcard",
  wildcard: "Wildcard",
  fh: "Free Hit",
  freehit: "Free Hit",
  bb: "Bench Boost",
  bboost: "Bench Boost",
  tc: "Triple Captain",
  "3xc": "Triple Captain"
};
var chipName = (c) => c ? CHIPS[String(c).toLowerCase()] || String(c).toUpperCase() : null;
var FOLD = { \u00F8: "o", \u00E6: "ae", \u0153: "oe", \u00DF: "ss", \u0142: "l", \u0111: "d", \u00F0: "d", \u00FE: "th", \u0131: "i" };
var norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[øæœßłđðþı]/g, (c) => FOLD[c]);

// js/m/api.js
var api_exports2 = {};
__export(api_exports2, {
  BUNDLE_TIMEOUT_MS: () => BUNDLE_TIMEOUT_MS,
  CARDS_TIMEOUT_MS: () => CARDS_TIMEOUT_MS,
  CARD_POLL_MS: () => CARD_POLL_MS,
  FIRST_BUNDLE_TIMEOUT_MS: () => FIRST_BUNDLE_TIMEOUT_MS,
  LOOPBACK: () => LOOPBACK,
  SOLVE_CLASS: () => SOLVE_CLASS,
  SOLVE_POLL_MS: () => SOLVE_POLL_MS,
  TIMEOUT_MS: () => TIMEOUT_MS,
  access: () => access,
  cancelSolve: () => cancelSolve,
  clearSolves: () => clearSolves,
  clientId: () => clientId,
  endBareWait: () => endBareWait,
  getBundle: () => getBundle,
  getCards: () => getCards,
  getMeta: () => getMeta2,
  getPlayer: () => getPlayer,
  getScouts: () => getScouts,
  getSolves: () => getSolves,
  holdBare: () => holdBare,
  isDown: () => isDown,
  loadSnapshot: () => loadSnapshot,
  local: () => local,
  offlineNow: () => offlineNow,
  plain: () => plain,
  putMemory: () => putMemory,
  readAccess: () => readAccess,
  recent: () => recent,
  request: () => request2,
  saveSnapshot: () => saveSnapshot,
  servedRelease: () => servedRelease,
  slotBusy: () => slotBusy,
  slotHolder: () => slotHolder,
  solve: () => solve,
  solveGap: () => solveGap,
  unpackCards: () => unpackCards,
  urgentSolve: () => urgentSolve,
  waitBare: () => waitBare,
  whenFree: () => whenFree
});
var KEYS = { client: "fc:client", recent: "fc:recent", snapshot: "fc:snapshot" };
var local = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
      return true;
    } catch {
      return false;
    }
  },
  json(k) {
    try {
      return JSON.parse(local.get(k));
    } catch {
      return null;
    }
  },
  /** Keys starting with `prefix` (app.js signOut clears one team's). */
  keys(prefix = "") {
    try {
      return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((k) => k?.startsWith(prefix));
    } catch {
      return [];
    }
  }
};
var CLIENT_ID = /^[0-9a-f]{32}$/;
var clientMemo = null;
function clientId() {
  const kept = local.get(KEYS.client);
  if (kept && CLIENT_ID.test(kept)) return kept;
  if (!clientMemo) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    clientMemo = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  local.set(KEYS.client, clientMemo);
  return clientMemo;
}
var LOOPBACK = /* @__PURE__ */ new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
async function access() {
  const fallback = { local: LOOPBACK.has(globalThis.location?.hostname ?? ""), share: [] };
  let meta;
  try {
    meta = await getMeta2();
  } catch {
    return fallback;
  }
  return readAccess(meta, fallback);
}
var releaseName = (v) => typeof v === "string" && /^v\d+(\.\d+)*$/.test(v) ? v : null;
async function servedRelease() {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), RELEASE_TIMEOUT_MS);
  try {
    const r = await fetch("/m/", { method: "HEAD", cache: "no-store", signal: stop.signal });
    return releaseName(r.headers.get("X-Forkcast-Release"));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
var RELEASE_TIMEOUT_MS = 3e3;
function readAccess(meta, fallback = { local: false, share: [] }) {
  const a = meta?.access;
  if (!a || typeof a !== "object") return { ...fallback, mode: null, release: null };
  const isLocal = typeof a.local === "boolean" ? a.local : fallback.local;
  const mode = typeof a.mode === "string" ? a.mode : null;
  const urls = [a.urls].flat().filter((u) => typeof u === "string" && /^https?:\/\//.test(u));
  const at = Number(a.released_at), released = releaseName(a.release) && Number.isFinite(at) && at > 0 ? { released_at: at } : {};
  return { local: isLocal, mode, share: isLocal && (mode === "lan" || mode === "public") ? [...new Set(urls)] : [], release: releaseName(a.release), ...released };
}
var RECENT_MAX = 6;
var isEntry = (v) => /^\d{1,10}$/.test(String(v ?? ""));
var recent = {
  list() {
    const xs = local.json(KEYS.recent);
    return Array.isArray(xs) ? xs.filter((r) => isEntry(r?.entry_id)) : [];
  },
  add(entry, { team_name = null, manager = null, total = null } = {}) {
    if (!isEntry(entry)) return;
    const id = String(entry);
    const pts2 = total != null && Number.isFinite(Number(total)) ? Number(total) : null;
    const row = { entry_id: id, team_name: team_name || null, manager: manager || null, total: pts2 };
    local.set(KEYS.recent, JSON.stringify([row, ...recent.list().filter((r) => String(r.entry_id) !== id)].slice(0, RECENT_MAX)));
  }
};
var TIMEOUT_MS = 1e4;
var BUNDLE_TIMEOUT_MS = 3e4;
var FIRST_BUNDLE_TIMEOUT_MS = 12e4;
var CARDS_TIMEOUT_MS = 18e4;
function fail(code, message, { status = 0, detail = "", path = "" } = {}) {
  const e = new ApiError(message, { status, detail, path });
  e.code = code;
  return e;
}
async function request2(method, path, { query, body, timeout = TIMEOUT_MS, signal } = {}) {
  const headers = { Accept: "application/json", "X-Forkcast-Client": clientId() };
  const init = { method, headers, cache: "no-store" };
  if (body !== void 0) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeout);
  const forward = () => ctrl.abort();
  if (signal?.aborted) ctrl.abort();
  signal?.addEventListener("abort", forward, { once: true });
  init.signal = ctrl.signal;
  let res, text;
  try {
    res = await fetch(path + qs(query), init);
    text = await res.text();
  } catch (e) {
    if (signal?.aborted) throw fail("aborted", "Cancelled", { path });
    throw timedOut ? fail("timeout", BUSY, { detail: `no answer in ${timeout / 1e3} s`, path }) : fail("unreachable", UNREACHABLE, { detail: String(e), path });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forward);
  }
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw fail("http", `${method} ${path} returned HTTP ${res.status} that is not JSON`, { status: res.status, detail: text.slice(0, 500), path });
  }
  if (!res.ok || payload?.ok !== true) {
    throw fail("http", payload?.error || `${method} ${path} failed with HTTP ${res.status}`, { status: res.status, detail: payload?.detail || "", path });
  }
  return payload.data;
}
var get2 = (path, query, opts) => request2("GET", path, { ...opts, query });
var post = (path, body, opts) => request2("POST", path, { ...opts, body: body ?? {} });
var getMeta2 = () => get2("/api/meta");
var getBundle = (entry, { refresh, have, hc, hl, w, cl, signal } = {}) => get2("/api/m/bundle", { entry, refresh, have, hc, hl, w, cl: cl ? 1 : null }, { timeout: have ? BUNDLE_TIMEOUT_MS : FIRST_BUNDLE_TIMEOUT_MS, signal }).then((b) => b?.cards ? { ...b, cards: unpackCards(b.cards) } : b);
var getCards = ({ entry, hc, w, signal } = {}) => get2("/api/m/cards", { entry, hc, w }, { timeout: CARDS_TIMEOUT_MS, signal }).then((c) => ({ cards: unpackCards(c?.cards ?? null), cards_v: c?.cards_v ?? null }));
var MATCH = { fields: ["season", "gw", "opp", "home", "minutes", "points", "kickoff", "fdr"], own: ["minutes", "points"] };
var CUP = { fields: ["league", "season", "kickoff", "minutes", "in_squad", "after_gw", "opp", "opp_name", "home"], own: ["minutes", "in_squad"] };
var VIEW = ["n", "min", "peer_min", "matches", "n_all"];
function unpackCards(c) {
  if (!c || c.pack == null) return c ?? null;
  if (c.pack !== 1) return null;
  const matches = (flat, { fields, own }, table) => {
    const shared = fields.filter((k) => !own.includes(k));
    const out = [];
    for (let i = 0; i < flat.length; i += 1 + own.length) {
      const m = {};
      shared.forEach((k, j) => {
        m[k] = table[flat[i]][j];
      });
      own.forEach((k, j) => {
        m[k] = flat[i + 1 + j];
      });
      out.push(Object.fromEntries(fields.map((k) => [k, m[k]])));
    }
    return out;
  };
  const players = {};
  for (const [id, [pos, pos_avg, club, lm, cups, ...more]] of Object.entries(c.players)) {
    const me = { pos, pos_avg, club, last_matches: matches(lm, MATCH, c.fx), cups: matches(cups, CUP, c.cupfx) };
    if (more.length) {
      const [rows, kinds, views] = more;
      me.rows = [...c.lists[rows]];
      me.kinds = [...c.lists[kinds]];
      const n = VIEW.length;
      me.stats = Object.fromEntries(Object.entries(views).map(([v, a]) => [v, {
        ...Object.fromEntries(VIEW.map((k, j) => [k, a[j]])),
        rows: Object.fromEntries(c.keys[pos].map((k, i) => [k, a.slice(n + 3 * i, n + 3 * i + 3)]))
      }]));
    }
    players[id] = me;
  }
  return { season: c.season, season_rounds: c.season_rounds, dist: c.dist, cup_next: c.cup_next, players, v: c.v };
}
var getPlayer = ({ id, entry, vs }) => get2("/api/m/player", { id, entry, vs });
var getScouts = () => get2("/api/m/scouts");
var getSolves = (entry) => get2("/api/m/solves", { entry });
var clearSolves = (entry) => request2("DELETE", `/api/m/solves?entry=${enc(entry)}`);
async function putMemory(doc) {
  const saved = await request2("PUT", "/api/m/memory", { body: doc });
  mirrorMemory(saved);
  return saved;
}
var SOLVE_POLL_MS = 700;
var CARD_POLL_MS = 250;
var FINAL = /* @__PURE__ */ new Set(["done", "error", "cancelled"]);
var SOLVE_CLASS = { heal: "user", chip: "user", cash: "user", wish: "spec", speculative: "spec", chipprep: "spec", pair: "spec", card: "spec", pairnext: "spec", presolve: "spec", plan: "plan" };
var inflight = /* @__PURE__ */ new Map();
var slotBusy = (slot) => inflight.has(slot);
var slotHolder = (slot) => inflight.get(slot)?.purpose ?? null;
var freed = /* @__PURE__ */ new Map();
function whenFree(slot) {
  if (!inflight.has(slot)) return Promise.resolve();
  return new Promise((res) => {
    if (!freed.has(slot)) freed.set(slot, []);
    freed.get(slot).push(res);
  });
}
var cancelSolve = (key) => request2("DELETE", `/api/m/solve/${enc(key)}`);
var urgentSolve = (key) => request2("POST", `/api/m/solve/${enc(key)}/urgent`);
var BARE = null;
var BARE_WAIT = null;
var settleBare = () => {
  BARE_WAIT?.done();
  BARE_WAIT = null;
};
var holdBare = (road, version = null) => {
  BARE = road?.weeks?.length && road.values ? { road, version } : null;
  settleBare();
};
var waitBare = () => {
  BARE = null;
  if (!BARE_WAIT) {
    let done;
    BARE_WAIT = { p: new Promise((r) => {
      done = r;
    }), done };
  }
};
var endBareWait = settleBare;
var BARE_KEYS = /* @__PURE__ */ new Set(["season", "entry", "from_r", "w", "no_buys_gw", "poll_max_age", "no_table"]);
var isBare = (values) => !!values && Object.keys(values).every((k) => BARE_KEYS.has(k)) && String(values.no_buys_gw ?? "") === Array.from({ length: Number(values.w) }, (_, i) => Number(values.from_r) + i).join(",");
var bareFor = (values) => {
  const v = BARE?.road.values;
  if (!v || !isBare(values)) return null;
  return ["season", "entry", "from_r", "w", "no_buys_gw"].every((k) => String(values[k] ?? "") === String(v[k] ?? "")) ? BARE : null;
};
var bareDone = (held) => ({ key: held.road.key ?? null, state: "done", road: held.road, error: null, version: held.version });
function solveGap(values) {
  if (!values || !("later_gap" in values || "gap" in values)) return values;
  const { gap, later_gap: later, ...rest } = values;
  const g = values.to != null && Number(values.to) > Number(values.from_r) ? later : gap;
  return g > 0 ? { ...rest, gap: g } : rest;
}
function solve({ entry, purpose, values: asked, lane = 0, said = null }, { slot = SOLVE_CLASS[purpose] ?? purpose, onUpdate, signal } = {}) {
  const values = solveGap(asked);
  const held = bareFor(values);
  if (held) {
    const r = bareDone(held);
    onUpdate?.(r);
    const p2 = Promise.resolve(r);
    p2.cancel = () => {
    };
    return p2;
  }
  const prev = inflight.get(slot);
  if (prev) {
    prev.superseded = true;
    prev.ctrl.abort();
  }
  const mine = { key: null, ctrl: new AbortController(), superseded: false, purpose };
  inflight.set(slot, mine);
  if (signal?.aborted) mine.ctrl.abort();
  signal?.addEventListener("abort", () => mine.ctrl.abort(), { once: true });
  const stopped = () => {
    if (mine.key && !mine.superseded) cancelSolve(mine.key).catch(() => {
    });
    return { key: mine.key, state: mine.superseded ? "superseded" : "cancelled", road: null, error: null };
  };
  const run = async () => {
    const sig = mine.ctrl.signal;
    try {
      if (BARE_WAIT && isBare(values)) {
        await Promise.race([BARE_WAIT.p, new Promise((r) => sig.addEventListener("abort", r, { once: true }))]);
        if (sig.aborted) return stopped();
        const late = bareFor(values);
        if (late) {
          const r = bareDone(late);
          onUpdate?.(r);
          return r;
        }
      }
      let s = await post("/api/m/solve", { entry, purpose, values, supersedes: prev?.key ?? null, ...lane ? { lane } : {}, ...said ? { said } : {} }, { signal: sig });
      mine.key = s?.key ?? null;
      onUpdate?.(s);
      let misses = 0;
      while (!s?.road && !FINAL.has(s?.state)) {
        await sleep(purpose === "card" ? CARD_POLL_MS : SOLVE_POLL_MS, sig);
        if (sig.aborted) return stopped();
        try {
          s = { key: mine.key, ...await get2(`/api/m/solve/${enc(mine.key)}`, null, { signal: sig }) };
          misses = 0;
          onUpdate?.(s);
        } catch (e) {
          if (sig.aborted) return stopped();
          if (!(e.code === "unreachable" || e.code === "timeout") || ++misses >= 5) throw e;
        }
      }
      return { key: mine.key, state: s.road ? "done" : s.state, road: s.road ?? null, error: s.error ?? null, version: s.version ?? null };
    } catch (e) {
      if (sig.aborted) return stopped();
      throw e;
    } finally {
      if (inflight.get(slot) === mine) {
        inflight.delete(slot);
        const waiting = freed.get(slot);
        freed.delete(slot);
        waiting?.forEach((f) => f());
      }
    }
  };
  const p = run();
  p.cancel = () => mine.ctrl.abort();
  return p;
}
function saveSnapshot(entry, bundle) {
  return local.set(KEYS.snapshot, JSON.stringify({ entry: String(entry), at: Date.now(), bundle }));
}
function loadSnapshot(entry) {
  const s = local.json(KEYS.snapshot);
  return s && s.bundle && String(s.entry) === String(entry) ? s : null;
}
function mirrorMemory(doc) {
  const s = loadSnapshot(doc?.entry);
  if (!s || Number(s.bundle.meta?.gw) !== Number(doc.gw)) return;
  local.set(KEYS.snapshot, JSON.stringify({ ...s, bundle: { ...s.bundle, memory: doc } }));
}
var UNREACHABLE = "Forkcast can't reach its server. Try again in a minute.";
var BUSY = "Busy right now. Try again in a minute.";
var SERVER_ERROR = "Something went wrong on Forkcast's side. Try again in a minute.";
var isDown = (err) => !!err && (err.code === "unreachable" || err.code === "timeout" || err.status === 503 || err.status === 504);
var offlineNow = (misses, waitedMs) => misses >= 1 || waitedMs >= TIMEOUT_MS;
function plain(err, { entry } = {}) {
  if (!err) return "";
  if (err.code === "timeout" || err.status === 504) return BUSY;
  if (isDown(err)) return UNREACHABLE;
  if (err.status === 429) return BUSY;
  if (err.status === 404 && entry != null && /entry/i.test(err.message || "")) return `No FPL team with ID ${entry}. Check the number in your FPL web address.`;
  if (err.status === 502) return "FPL didn't answer. Try again in a minute.";
  console.warn("Forkcast:", err.message || String(err), err.detail || "");
  return SERVER_ERROR;
}

// js/plan/engine.js
var engine_exports = {};
__export(engine_exports, {
  CHIPS: () => CHIPS2,
  FT_CAP: () => FT_CAP,
  FT_WEEKLY: () => FT_WEEKLY,
  HALF: () => HALF,
  HIT_COST: () => HIT_COST,
  LAST_ROUND: () => LAST_ROUND,
  MAX_HORIZON: () => MAX_HORIZON,
  MAX_PER_CLUB: () => MAX_PER_CLUB,
  POS_LIMITS: () => POS_LIMITS,
  VERDICT: () => VERDICT,
  anchorRef: () => anchorRef,
  applyLineup: () => applyLineup,
  applyMove: () => applyMove,
  bankCredit: () => bankCredit,
  baseFromSolverResult: () => baseFromSolverResult,
  bestXI: () => bestXI,
  canUseChip: () => canUseChip,
  chipHalf: () => chipHalf,
  compareRoads: () => compareRoads,
  constraintsFromDraft: () => constraintsFromDraft,
  createDraft: () => createDraft,
  decodeSeeds: () => decodeSeeds,
  draftFromSolverResult: () => draftFromSolverResult,
  evaluate: () => evaluate,
  ftGrant: () => ftGrant,
  nextFt: () => nextFt,
  noiseFloor: () => noiseFloor,
  objectiveOf: () => objectiveOf,
  pairMoves: () => pairMoves,
  payback: () => payback,
  planBanks: () => planBanks,
  planGws: () => planGws,
  planPoints: () => planPoints,
  playerLookup: () => playerLookup,
  playersFromSolverResult: () => playersFromSolverResult,
  roadAnchor: () => roadAnchor,
  roadFromResult: () => roadFromResult,
  roadToDraft: () => roadToDraft,
  runTotals: () => runTotals,
  runXp: () => runXp,
  setChip: () => setChip,
  setLineup: () => setLineup,
  solveValues: () => solveValues,
  swapCandidates: () => swapCandidates,
  swapLineup: () => swapLineup,
  validFormation: () => validFormation,
  verdictLabel: () => verdictLabel,
  weekPoints: () => weekPoints
});

// js/plan/engine/evaluate.js
function createDraft({ name = "My plan", source = "manual", id } = {}) {
  return { id: id ?? newId(), name, source, created: Date.now(), moves: {}, chips: {}, lineups: {} };
}
function withGw(draft, field, gw, value) {
  const next = { ...draft?.[field] || {} };
  if (value === void 0) delete next[String(gw)];
  else next[String(gw)] = value;
  return { ...draft, [field]: next };
}
var movesAt = (draft, gw) => Array.isArray(draft?.moves?.[gw]) ? draft.moves[gw] : [];
var chipAt = (draft, gw) => CHIPS2.includes(draft?.chips?.[gw]) ? draft.chips[gw] : null;
function applyMove(draft, gw, outId, inId) {
  const o = Number(outId), n = Number(inId);
  if (!Number.isFinite(o) || !Number.isFinite(n) || o === n) return draft;
  const list = movesAt(draft, gw).map((m) => ({ out: Number(m.out), in: Number(m.in) }));
  const j = list.findIndex((m) => m.in === o);
  const k = list.findIndex((m) => m.out === n);
  if (j >= 0) {
    if (list[j].out === n) list.splice(j, 1);
    else list[j] = { out: list[j].out, in: n };
  } else if (k >= 0) {
    if (list[k].in === o) list.splice(k, 1);
    else list[k] = { out: o, in: list[k].in };
  } else list.push({ out: o, in: n });
  return withGw(draft, "moves", gw, list.length ? list : void 0);
}
function setChip(draft, gw, chip) {
  if (chip && !CHIPS2.includes(chip)) throw new Error(`unknown chip ${chip}`);
  const chips = { ...draft?.chips || {} };
  if (chip) {
    for (const [g, c] of Object.entries(chips)) {
      if (c === chip && Number(g) !== Number(gw) && chipHalf(g) === chipHalf(gw)) delete chips[g];
    }
    chips[String(gw)] = chip;
  } else delete chips[String(gw)];
  return { ...draft, chips };
}
function setLineup(draft, gw, patch) {
  if (patch === null) return withGw(draft, "lineups", gw, void 0);
  const cur = { ...draft?.lineups?.[gw] || {}, ...patch || {} };
  for (const k of Object.keys(cur)) if (cur[k] === null || cur[k] === void 0) delete cur[k];
  for (const k of ["xi", "bench"]) if (cur[k]) cur[k] = ids(cur[k]);
  for (const k of ["captain", "vice"]) if (cur[k] !== void 0) cur[k] = Number(cur[k]);
  return withGw(draft, "lineups", gw, Object.keys(cur).length ? cur : void 0);
}
function canUseChip({ base, draft, gw, chip } = {}) {
  if (!CHIPS2.includes(chip)) return { ok: false, reason: `unknown chip ${chip}` };
  const label = chip.toUpperCase();
  const g = Number(gw);
  const first = Number(base?.gw ?? base?.next_gw);
  const long = seasonLong(base?.season, chip);
  const other = sortedGws(draft?.chips).find((x) => x !== g && draft.chips[x] === chip && (long || chipHalf(x) === chipHalf(g)));
  if (other !== void 0) return { ok: false, reason: `${label} is already planned for GW${other}` };
  const left = base?.chips_available;
  if (Array.isArray(left) && (long || chipHalf(g) === chipHalf(first)) && !left.includes(chip)) {
    return { ok: false, reason: `${label} is already used this ${long ? "season" : "half"}` };
  }
  return { ok: true, reason: "" };
}
function planGws(base, horizon = 4) {
  if (Array.isArray(horizon)) return ids(horizon).sort((a, b) => a - b);
  const first = Number(base?.gw ?? base?.next_gw);
  if (!Number.isFinite(first)) return [];
  const n = Math.max(1, Math.min(MAX_HORIZON, Math.round(num(horizon) ?? 4)));
  return Array.from({ length: n }, (_, i) => first + i).filter((g) => g <= LAST_ROUND);
}
function weekPoints(week, xpOf2) {
  const v = (p) => num(xpOf2(p, week?.gw)) ?? 0;
  const cap = num(week?.captain);
  const xiPts = sum(ids(week?.xi).map(v));
  const capPts = cap === null ? 0 : v(cap) * (week?.chip === "tc" ? 2 : 1);
  const benchPts = week?.chip === "bb" ? sum(ids(week?.bench).map(v)) : 0;
  return xiPts + capPts + benchPts - HIT_COST * (num(week?.hits) ?? 0);
}
function applyOne(L, squad, sale, m) {
  const o = Number(m?.out), n = Number(m?.in);
  const idx = squad.indexOf(o);
  if (idx < 0) return { ok: false, reason: `${L.name(o)} is not in the squad` };
  if (squad.includes(n)) return { ok: false, reason: `${L.name(n)} is already in the squad` };
  if (!L.has(n) || L.priceT(n) === null) return { ok: false, reason: `no price for player ${L.name(n)}` };
  if (L.pos(o) !== L.pos(n)) return { ok: false, reason: `${L.name(o)} (${L.pos(o)}) and ${L.name(n)} (${L.pos(n)}) play different positions` };
  const sellT = sale.get(o) ?? L.priceT(o) ?? 0;
  const buyT = L.priceT(n);
  squad[idx] = n;
  sale.delete(o);
  sale.set(n, buyT);
  return { ok: true, sellT, buyT };
}
function overClubs(L, squad, held = []) {
  const count = (ps) => {
    const n = /* @__PURE__ */ new Map();
    for (const p of ps) {
      const c = L.club(p);
      if (c) n.set(c, (n.get(c) || 0) + 1);
    }
    return n;
  };
  const h2 = count(held);
  return [...count(squad)].filter(([c, k]) => k > Math.max(MAX_PER_CLUB, h2.get(c) || 0)).map(([c, k]) => ({ club: c, count: k }));
}
function evaluate({ base, players, draft, horizon = 4, xp: xpAt, fixedLineups = false, banksOnly = false } = {}) {
  const L = playerLookup({ base, players });
  const score = typeof xpAt === "function" ? (id, g) => num(xpAt(id, g)) : L.xp;
  const pick = fixedLineups ? L.xp : score;
  const gws = planGws(base, horizon);
  const season = base?.season;
  const warnings = [];
  const first = Number(base?.gw ?? base?.next_gw);
  if (gws.length && Number.isFinite(first) && gws[0] !== first) warnings.push(`the plan starts at GW${gws[0]}, the team is for GW${first}`);
  for (const g of /* @__PURE__ */ new Set([...sortedGws(draft?.moves), ...sortedGws(draft?.chips)])) {
    if (!gws.includes(g) && (movesAt(draft, g).length || chipAt(draft, g))) warnings.push(`GW${g} is outside the planned GWs and is ignored`);
  }
  let squad = ids((base?.squad || []).map((r) => r.id));
  const held = base?.fresh === true ? [] : [...squad];
  let sale = new Map(squad.map((p) => [p, L.sellT(p) ?? L.priceT(p) ?? 0]));
  let bank = T(base?.bank) ?? 0;
  let ft = num(base?.ft) ?? FT_WEEKLY;
  let replacedBy = /* @__PURE__ */ new Map();
  let prevUsed = 0;
  const out = [];
  gws.forEach((gw, i) => {
    if (i > 0) ft = nextFt(ft, prevUsed, ftGrant(season, gw));
    const w = [];
    const chip = chipAt(draft, gw);
    if (chip) {
      const c = canUseChip({ base, draft, gw, chip });
      if (!c.ok) w.push(c.reason);
    }
    const free = chip === "wc" || chip === "fh" || i === 0 && base?.fresh === true;
    const sq = [...squad], sp = new Map(sale), repl = new Map(replacedBy);
    let bk = bank;
    const moves = movesAt(draft, gw).map((m) => {
      const r = applyOne(L, sq, sp, m);
      if (r.ok) {
        bk += r.sellT - r.buyT;
        repl.set(Number(m.out), Number(m.in));
      } else w.push(`move ${L.name(m.out)} \u2192 ${L.name(m.in)} skipped: ${r.reason}`);
      return { out: Number(m.out), in: Number(m.in), ok: r.ok, reason: r.ok ? "" : r.reason, sell: M(r.sellT), buy: M(r.buyT), xpDelta: 0 };
    });
    const before = new Set(squad), after = new Set(sq);
    const bought = sq.filter((p) => !before.has(p));
    const sold = squad.filter((p) => !after.has(p));
    const transfers = bought.length;
    const used = free ? FT_WEEKLY : Math.min(ft, transfers);
    const hits = free ? 0 : Math.max(0, transfers - ft);
    if (bk < 0) w.push(`over budget by ${money(bk)}`);
    for (const { club, count } of overClubs(L, sq, free ? [] : held)) w.push(`${count} players from ${club} (max ${MAX_PER_CLUB})`);
    if (banksOnly) out.push({ gw, chip, squad: sq, bank: M(bk), ft, transfers, used, hits, moves, bought, sold, warnings: w, ok: !w.length });
    else {
      const lineup = lineupFor(L, gw, sq, draft?.lineups?.[gw], repl, w, pick);
      const xp = {};
      for (const p of sq) {
        const v = score(p, gw);
        if (v === null) w.push(`no forecast for ${L.name(p)}: counted as 0`);
        xp[p] = v ?? 0;
      }
      const gross = weekPoints({ ...lineup, chip }, (p) => xp[p]);
      const hitCost = HIT_COST * hits;
      out.push({
        gw,
        chip,
        squad: sq,
        ...lineup,
        bank: M(bk),
        ft,
        transfers,
        used,
        hits,
        hitCost,
        moves,
        bought,
        sold,
        points: gross - hitCost,
        gross,
        xp,
        sell: Object.fromEntries([...sp].map(([p, t]) => [p, M(t)])),
        warnings: w,
        ok: !w.length
      });
    }
    if (chip !== "fh") {
      squad = sq;
      sale = sp;
      bank = bk;
      replacedBy = repl;
    }
    prevUsed = used;
  });
  if (banksOnly) return { gws: out, warnings: [], ok: true };
  for (const s of out) {
    const span2 = s.chip === "fh" ? [s.gw] : gws.filter((g) => g >= s.gw);
    for (const m of s.moves) if (m.ok) m.xpDelta = sum(span2.map((g) => (score(m.in, g) ?? 0) - (score(m.out, g) ?? 0)));
  }
  for (const s of out) for (const x of s.warnings) warnings.push(`GW${s.gw}: ${x}`);
  return { gws: out, total: sum(out.map((s) => s.points)), warnings, ok: !warnings.length };
}
var planBanks = (o) => Object.fromEntries(evaluate({ ...o, banksOnly: true }).gws.map((s) => [s.gw, s.bank]));

// js/plan/engine/solver.js
function pairMoves(outIds, inIds, players, keep = []) {
  const L = playerLookup({ players });
  const order = (xs) => ids(xs).sort((a, b) => posRank(L.pos(a)) - posRank(L.pos(b)) || (L.price(b) ?? 0) - (L.price(a) ?? 0) || a - b);
  const outs = order(outIds), ins = order(inIds);
  const made = /* @__PURE__ */ new Map();
  for (const m of keep) {
    const o = outs.indexOf(Number(m.out)), i = ins.indexOf(Number(m.in));
    if (o >= 0 && i >= 0 && L.pos(outs[o]) === L.pos(ins[i])) made.set(outs.splice(o, 1)[0], ins.splice(i, 1)[0]);
  }
  const pairs = order([...made.keys(), ...outs]).map((o) => {
    if (made.has(o)) return { out: o, in: made.get(o) };
    const i = ins.findIndex((p) => L.pos(p) === L.pos(o));
    return { out: o, in: i >= 0 ? ins.splice(i, 1)[0] : null };
  });
  return [...pairs, ...ins.map((p) => ({ out: null, in: p }))];
}
function solverRows(result) {
  const committed = result?.committed || {};
  const gws = sortedGws(committed).filter((g) => committed[g]?.team);
  const from = num(result?.meta?.from) ?? gws[0];
  const rows = gws.filter((g) => g >= from).map((gw) => ({ gw, t: committed[gw].team }));
  const anchors = result?.anchors || {};
  const last = sortedGws(anchors).at(-1);
  const plan = last === void 0 ? {} : anchors[last]?.plan || {};
  for (const gw of sortedGws(plan)) if (!committed[gw]) rows.push({ gw, t: plan[gw] });
  return rows;
}
function playersFromSolverResult(result) {
  const rows = solverRows(result);
  const by = /* @__PURE__ */ new Map();
  for (const { gw, t } of rows) {
    const xg = ids(t.xp_gws);
    for (const [id, p] of Object.entries(t.players || {})) {
      const r = by.get(Number(id)) || { ...p, id: Number(id), xpBy: /* @__PURE__ */ new Map() };
      xg.forEach((g, i) => {
        if (!r.xpBy.has(g) || g === gw) r.xpBy.set(g, p.xp?.[i] ?? null);
      });
      if (num(p.pred) !== null) r.xpBy.set(gw, Number(p.pred));
      by.set(Number(id), r);
    }
  }
  const players = [...by.values()].map(({ xpBy, ...p }) => {
    const xg = [...xpBy.keys()].sort((a, b) => a - b);
    return { ...p, xp_gws: xg, xp: xg.map((g) => xpBy.get(g)) };
  });
  return { horizon: rows.length ? ids(rows[0].t.xp_gws) : [], players };
}
var isBuild = (t) => !(t?.out || []).length && (t?.in || []).length >= 15;
function chipsLeft(season, first, played) {
  const lo = first > HALF ? HALF + 1 : 1;
  return CHIPS2.filter((c) => !played.some((x) => x.chip === c && (seasonLong(season, c) || x.gw >= lo)));
}
function baseFromSolverResult(result) {
  const rows = solverRows(result);
  if (!rows.length) return null;
  const { gw, t } = rows[0];
  const meta = result?.meta || {};
  const P = t.players || {};
  const played = sortedGws(result?.committed).filter((g) => g < gw && result.committed[g]?.team?.chip).map((g) => ({ chip: result.committed[g].team.chip, gw: g }));
  const squadNow = ids([...t.xi || [], ...t.bench || []]);
  const fresh = isBuild(t);
  let squad = squadNow, bankT = T(t.bank) ?? 0;
  if (!fresh) {
    const pairs = pairMoves(t.out, t.in, { players: Object.values(P) });
    squad = squadNow.map((p) => pairs.find((m) => m.in === p)?.out ?? p);
    for (const p of ids(t.in)) bankT += T(t.purchase_prices?.[p] ?? P[p]?.price) ?? 0;
    for (const p of ids(t.out)) bankT -= T(t.sale_prices?.[p] ?? P[p]?.sell_price) ?? 0;
  }
  const xpGws = ids(t.xp_gws);
  return {
    season: num(meta.season),
    entry_id: num(meta.entry),
    gw,
    next_gw: num(meta.next_gw),
    fresh,
    bank: M(bankT),
    ft: num(t.ft_avail) ?? FT_WEEKLY,
    chips_used: played,
    chips_available: chipsLeft(meta.season, gw, played),
    horizon: xpGws,
    squad: squad.map((p) => {
      const r = P[p] || { id: p };
      const price = num(r.price);
      return {
        ...r,
        id: p,
        pos: posName(r.pos),
        sell_price: fresh ? price : num(r.sell_price) ?? price,
        purchase_price: num(t.purchase_prices?.[p]) ?? price,
        xp_gws: xpGws
      };
    })
  };
}
var hhmm = (sec) => {
  const d = num(sec) === null ? /* @__PURE__ */ new Date() : new Date(Number(sec) * 1e3);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
function draftFromSolverResult(result, base, { name, players, keep = [] } = {}) {
  const b = base || baseFromSolverResult(result);
  const rows = solverRows(result);
  const meta = result?.meta || {};
  const L = playerLookup({ base: b, players: players ?? playersFromSolverResult(result) });
  const warnings = [];
  const first = Number(b?.gw ?? b?.next_gw);
  if (rows.length && Number.isFinite(first) && rows[0].gw !== first) {
    warnings.push(`the solve starts at GW${rows[0].gw}, the team is for GW${first}`);
  }
  const draft = { ...createDraft({ name: name ?? `Solver plan ${hhmm(meta.finished_at)}`, source: "solver" }) };
  let prev = new Set(ids((b?.squad || []).map((r) => r.id)));
  const pred = {}, hits = {};
  for (const { gw, t } of rows) {
    const sq = ids([...t.xi || [], ...t.bench || []]);
    const now = new Set(sq);
    const pairs = pairMoves([...prev].filter((p) => !now.has(p)), sq.filter((p) => !prev.has(p)), L, keep);
    const whole = pairs.filter((m) => m.out !== null && m.in !== null);
    if (whole.length !== pairs.length) warnings.push(`GW${gw}: the squad change does not pair by position`);
    if (whole.length) draft.moves[gw] = whole;
    if (CHIPS2.includes(t.chip)) draft.chips[gw] = t.chip;
    draft.lineups[gw] = {
      xi: ids(t.xi),
      bench: ids(t.bench),
      ...num(t.captain) !== null ? { captain: Number(t.captain) } : {},
      ...num(t.vice) !== null ? { vice: Number(t.vice) } : {}
    };
    pred[gw] = num(t.pred);
    hits[gw] = num(t.hits);
    if (t.chip !== "fh") prev = now;
  }
  draft.solver = {
    from: rows[0]?.gw ?? null,
    w: num(meta.w),
    pool: meta.pool ?? null,
    argv: meta.argv || result?.argv || [],
    finishedAt: num(meta.finished_at),
    pred,
    hits,
    warnings
  };
  return draft;
}
function constraintsFromDraft(draft, { keep = [], avoid = [], horizonEnd, fromGw = 1, keepMoves = true, players } = {}) {
  const end = num(horizonEnd) ?? LAST_ROUND;
  const from = num(fromGw) ?? 1;
  const name = players ? playerLookup({ players }).name : (id) => `#${id}`;
  const req = /* @__PURE__ */ new Map();
  const dropped = /* @__PURE__ */ new Map();
  const set = (id, g, want, why) => {
    if (!req.has(id)) req.set(id, /* @__PURE__ */ new Map());
    const cur = req.get(id).get(g);
    if (cur && cur.want !== want && (cur.why === "Keep" || cur.why === "Avoid")) {
      const k = `${why}|${cur.why}|${id}`;
      dropped.set(k, [...dropped.get(k) || [], g]);
    }
    req.get(id).set(g, { want, why });
  };
  const span2 = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  for (const p of ids(keep)) for (const g of span2(from, end)) set(p, g, "in", "Keep");
  for (const p of ids(avoid)) for (const g of span2(from, end)) set(p, g, "out", "Avoid");
  if (keepMoves) {
    const gws = sortedGws(draft?.moves).filter((g) => g >= from && g <= end);
    const later = (g, pred) => gws.find((x) => x > g && chipAt(draft, x) !== "fh" && movesAt(draft, x).some(pred));
    for (const g of gws) {
      const fh = chipAt(draft, g) === "fh";
      for (const m of movesAt(draft, g)) {
        const o = Number(m.out), n = Number(m.in);
        const sellsIn = later(g, (x) => Number(x.out) === n);
        const buysOut = later(g, (x) => Number(x.in) === o);
        for (const x of span2(g, fh ? g : (sellsIn ?? end + 1) - 1)) set(n, x, "in", `your GW${g} move`);
        for (const x of span2(g, fh ? g : (buysOut ?? end + 1) - 1)) set(o, x, "out", `your GW${g} move`);
      }
    }
  }
  const must = [], excl = [];
  for (const id of [...req.keys()].sort((a, b) => a - b)) {
    const byGw = req.get(id);
    const gws = [...byGw.keys()].sort((a, b) => a - b);
    let start = null;
    gws.forEach((g, i) => {
      start ??= g;
      const want = byGw.get(g).want;
      const next = gws[i + 1];
      if (next !== g + 1 || byGw.get(next).want !== want) {
        (want === "in" ? must : excl).push(`${id}@${start}-${g}`);
        start = null;
      }
    });
  }
  const warnings = [...dropped].map(([k, gws]) => {
    const [why, kept, id] = k.split("|");
    const when = gws.length > 1 ? `GW${gws[0]}-${gws.at(-1)}` : `GW${gws[0]}`;
    return `${kept} ${name(id)} dropped for ${when}: ${why} says otherwise`;
  });
  return { must_have: must.join(","), exclude: excl.join(","), warnings };
}
function solveValues({ base, draft, horizon = 4, maxHits = null, maxHitsGw = null, hitCap: hitCap2 = null, keepMoves = false, keep = [], avoid = [], pool, chipDefaults, players } = {}) {
  const gws = planGws(base, horizon);
  const from = gws[0], end = gws.at(-1);
  const c = constraintsFromDraft(draft, { keep, avoid, horizonEnd: end, fromGw: from, keepMoves, players: playerLookup({ base, players }) });
  const values = { season: num(base?.season), from_r: from, w: gws.length };
  const dflt = num(hitCap2);
  const hits = num(maxHits);
  if (hits !== null && hits !== dflt) values.max_hits = hits;
  const at = hits ?? dflt;
  const caps = gws.map((g) => [g, num(maxHitsGw?.[g])]).filter(([, n]) => n !== null && n !== at);
  if (caps.length) values.max_hits_gw = caps.map(([g, n]) => `${g}:${n}`).join(",");
  if (base?.entry_id != null) values.entry = String(base.entry_id);
  if (c.must_have) values.must_have = c.must_have;
  if (c.exclude) values.exclude = c.exclude;
  const defaults = chipDefaults?.[String(values.season)] || {};
  for (const chip of CHIPS2) {
    const rounds = gws.filter((g) => chipAt(draft, g) === chip).map(String);
    if (rounds.length) values[chip] = rounds;
    else if (defaults[chip]?.length) values[chip] = ["0"];
  }
  if (pool) values.dir = pool;
  return { values, warnings: c.warnings };
}

// js/plan/engine/squad.js
var FT_WEEKLY = 1;
var FT_CAP = 5;
var LAST_ROUND = 38;
var HIT_COST = 4;
var MAX_PER_CLUB = 3;
var HALF = 19;
var CHIPS2 = ["wc", "fh", "bb", "tc"];
var MAX_HORIZON = 5;
var SEASON_LONG = { 2024: ["fh", "bb", "tc"] };
var POS_LIMITS = { GK: [2, 1, 1], DEF: [5, 3, 5], MID: [5, 2, 5], FWD: [3, 1, 3] };
var XI_SIZE = 11;
var ftGrant = (season, gw) => Number(season) === 2025 && Number(gw) === 16 ? 5 : FT_WEEKLY;
var nextFt = (avail, used, grant = FT_WEEKLY) => Math.min(FT_CAP, avail - used + grant);
var chipHalf = (gw) => Number(gw) <= HALF ? 1 : 2;
var seasonLong = (season, chip) => (SEASON_LONG[Number(season)] || []).includes(chip);
var EMPTY = Object.freeze({});
var num = (v) => v === null || v === void 0 || v === "" || typeof v === "boolean" || !Number.isFinite(Number(v)) ? null : Number(v);
var T = (m) => num(m) === null ? null : Math.round(Number(m) * 10);
var M = (t) => t === null || t === void 0 ? null : Math.round(t) / 10;
var money = (t) => `\xA3${(Math.abs(t) / 10).toFixed(1)}m`;
var sum = (xs) => xs.reduce((s, x) => s + x, 0);
var ids = (xs) => Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : [];
var sortedGws = (o) => Object.keys(o || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
var posRank = (pos) => {
  const i = POS.indexOf(pos);
  return i < 0 ? 9 : i;
};
var idSeq = 0;
var newId = () => `d${Date.now().toString(36)}${(++idSeq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
function rowsOf(players) {
  if (!players) return [[], []];
  if (players instanceof Map) return [[...players.values()], []];
  if (Array.isArray(players)) return [players, []];
  if (Array.isArray(players.players)) return [players.players, ids(players.horizon)];
  if (Array.isArray(players.fields) && Array.isArray(players.rows)) {
    const f = players.fields;
    return [players.rows.map((r) => Object.fromEntries(f.map((k, i) => [k, r[i]]))), ids(players.horizon)];
  }
  return [Object.values(players), []];
}
function record(row, gws) {
  const price = num(row.price) ?? num(row.solver_price);
  return {
    id: Number(row.id),
    name: row.name ?? `#${row.id}`,
    pos: posName(row.pos),
    club: row.club ?? null,
    clubId: num(row.club_id),
    price,
    priceT: T(price),
    xp: Array.isArray(row.xp) ? row.xp : [],
    xpGws: Array.isArray(row.xp_gws) ? ids(row.xp_gws) : gws,
    row
  };
}
function buildLookup(base, players) {
  const [rows, gws] = rowsOf(players);
  const baseGws = ids(base?.horizon);
  const by = /* @__PURE__ */ new Map();
  const sellT = /* @__PURE__ */ new Map();
  for (const r of base?.squad || []) {
    by.set(Number(r.id), record(r, baseGws));
    sellT.set(Number(r.id), T(r.sell_price) ?? T(r.price));
  }
  for (const r of rows) {
    if (r?.id == null) continue;
    const rec = record(r, gws);
    const had = by.get(rec.id);
    if (had && !rec.xp.length) {
      rec.xp = had.xp;
      rec.xpGws = had.xpGws;
    }
    if (had) {
      rec.pos ??= had.pos;
      rec.club ??= had.club;
      rec.clubId ??= had.clubId;
      rec.price ??= had.price;
      rec.priceT ??= had.priceT;
    }
    by.set(rec.id, rec);
  }
  const get3 = (id) => by.get(Number(id));
  return {
    get: get3,
    has: (id) => by.has(Number(id)),
    name: (id) => get3(id)?.name ?? `#${id}`,
    pos: (id) => get3(id)?.pos ?? null,
    club: (id) => get3(id)?.club ?? null,
    price: (id) => get3(id)?.price ?? null,
    priceT: (id) => get3(id)?.priceT ?? null,
    /** What an owned-at-base player sells for, in tenths (undefined for anyone else). */
    sellT: (id) => sellT.get(Number(id)) ?? void 0,
    /** xP for GW gw (null when the player or that GW has no forecast; a blank GW is 0 in the data). */
    xp(id, gw) {
      const r = get3(id);
      if (!r) return null;
      const i = r.xpGws.indexOf(Number(gw));
      return i < 0 ? null : num(r.xp[i]);
    },
    horizon: gws.length ? gws : baseGws,
    all: () => [...by.values()]
  };
}
var LOOKUPS = /* @__PURE__ */ new WeakMap();
var isLookup = (x) => x && typeof x.get === "function" && typeof x.pos === "function" && typeof x.xp === "function";
function playerLookup({ base, players } = {}) {
  if (isLookup(players)) return players;
  const kp = players && typeof players === "object" ? players : EMPTY;
  const kb = base && typeof base === "object" ? base : EMPTY;
  let inner = LOOKUPS.get(kp);
  if (!inner) LOOKUPS.set(kp, inner = /* @__PURE__ */ new WeakMap());
  let L = inner.get(kb);
  if (!L) inner.set(kb, L = buildLookup(base, players));
  return L;
}
var posFn = (posOf) => typeof posOf === "function" ? posOf : playerLookup({ players: posOf }).pos;
function validFormation(xi, posOf) {
  const pos = posFn(posOf);
  if (!Array.isArray(xi) || xi.length !== XI_SIZE || new Set(xi.map(Number)).size !== XI_SIZE) return false;
  const n = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of xi) {
    const k = pos(p);
    if (!(k in n)) return false;
    n[k] += 1;
  }
  return Object.entries(POS_LIMITS).every(([k, [, lo, hi]]) => n[k] >= lo && n[k] <= hi);
}
var orderXi = (xi, xpOf2, posOf) => [...xi].sort((a, b) => posRank(posOf(a)) - posRank(posOf(b)) || xpOf2(b) - xpOf2(a));
var orderBench = (bench, xpOf2, posOf) => [...bench].sort((a, b) => (posOf(a) !== "GK") - (posOf(b) !== "GK") || xpOf2(b) - xpOf2(a));
var gkFirst = (bench, posOf) => [...bench].sort((a, b) => (posOf(a) !== "GK") - (posOf(b) !== "GK"));
function bestXI(squad, xpOf2, posOf) {
  const pos = posFn(posOf);
  const xp = (p) => num(xpOf2(p)) ?? 0;
  const byPos = /* @__PURE__ */ new Map();
  for (const p of ids(squad)) {
    const k = pos(p);
    if (!byPos.has(k)) byPos.set(k, []);
    byPos.get(k).push(p);
  }
  for (const list of byPos.values()) list.sort((a, b) => xp(b) - xp(a));
  const limits = Object.entries(POS_LIMITS);
  let best = { total: -Infinity, xi: [] };
  const walk = (i, left, total, picked) => {
    if (i === limits.length) {
      if (left === 0 && total > best.total) best = { total, xi: picked };
      return;
    }
    const [k, [, lo, hi]] = limits[i];
    const avail = byPos.get(k) || [];
    for (let n = lo; n <= Math.min(hi, avail.length, left); n++) {
      const sel = avail.slice(0, n);
      walk(i + 1, left - n, total + sum(sel.map(xp)), [...picked, ...sel]);
    }
  };
  walk(0, XI_SIZE, 0, []);
  if (!best.xi.length) return { xi: [], bench: [], total: 0 };
  const inXi = new Set(best.xi);
  return {
    xi: orderXi(best.xi, xp, pos),
    bench: orderBench(ids(squad).filter((p) => !inXi.has(p)), xp, pos),
    total: best.total
  };
}
function repairLineup(xi, bench, squad, replacedBy, pos) {
  const inSquad = new Set(squad);
  const used = /* @__PURE__ */ new Set();
  const follow = (p) => {
    let q = p;
    const seen = /* @__PURE__ */ new Set();
    while (!inSquad.has(q) && replacedBy.has(q) && !seen.has(q)) {
      seen.add(q);
      q = replacedBy.get(q);
    }
    return inSquad.has(q) && !used.has(q) ? q : null;
  };
  const place = (list) => list.map((p) => {
    const q = follow(p);
    if (q !== null) used.add(q);
    return q;
  });
  const xi0 = ids(xi), bench0 = ids(bench);
  const xi1 = place(xi0), bench1 = place(bench0);
  const fill2 = (orig, got) => got.map((q, i) => {
    if (q !== null) return q;
    const want = pos(orig[i]);
    const r = squad.find((p) => !used.has(p) && (want === null || pos(p) === want));
    if (r !== void 0) used.add(r);
    return r ?? null;
  });
  const xi2 = fill2(xi0, xi1);
  if (xi2.includes(null)) return null;
  const bench2 = bench0.length ? fill2(bench0, bench1).filter((p) => p !== null) : [];
  const rest = squad.filter((p) => !used.has(p));
  return { xi: xi2, bench: [...bench2, ...rest], ordered: bench0.length > 0 };
}
function lineupFor(L, gw, squad, saved, replacedBy, warnings, pick = L.xp) {
  const xpOf2 = (p) => num(pick(p, gw)) ?? 0;
  const pos = L.pos;
  let xi = null, bench = null;
  if (saved && Array.isArray(saved.xi) && saved.xi.length) {
    const fixed = repairLineup(saved.xi, saved.bench, squad, replacedBy, pos);
    if (fixed && validFormation(fixed.xi, pos) && fixed.xi.length + fixed.bench.length === squad.length) {
      xi = [...fixed.xi].sort((a, b) => posRank(pos(a)) - posRank(pos(b)));
      bench = fixed.ordered ? gkFirst(fixed.bench, pos) : orderBench(fixed.bench, xpOf2, pos);
    } else {
      warnings.push("the saved lineup no longer fits this squad: best XI used");
    }
  }
  if (!xi) ({ xi, bench } = bestXI(squad, xpOf2, pos));
  if (xi.length !== XI_SIZE) warnings.push("the squad cannot field a legal XI");
  const byXp = [...xi].sort((a, b) => xpOf2(b) - xpOf2(a));
  const savedCap = num(saved?.captain), savedVice = num(saved?.vice);
  const captain = savedCap !== null && xi.includes(savedCap) ? savedCap : byXp[0] ?? null;
  const vice = savedVice !== null && xi.includes(savedVice) && savedVice !== captain ? savedVice : byXp.find((p) => p !== captain) ?? null;
  return { xi, bench, captain, vice };
}
function applyLineup(week, saved, players) {
  const L = playerLookup({ players });
  const own = { xi: ids(week?.xi), bench: ids(week?.bench), captain: num(week?.captain), vice: num(week?.vice) };
  const squad = [...own.xi, ...own.bench];
  const moves = Array.isArray(week?.moves) ? week.moves.filter((m) => m.ok !== false) : pairMoves(week?.out, week?.in, L);
  const replacedBy = new Map(moves.filter((m) => m.out != null && m.in != null).map((m) => [Number(m.out), Number(m.in)]));
  const arm = { captain: num(saved?.captain) ?? own.captain, vice: num(saved?.vice) ?? own.vice };
  if (ids(saved?.xi).length && ids(saved?.bench).length) {
    const warnings = [];
    const lu = lineupFor(L, week.gw, squad, { xi: ids(saved.xi), bench: ids(saved.bench), ...arm }, replacedBy, warnings);
    if (!warnings.length) return lu;
  }
  return lineupFor(L, week?.gw, squad, { ...own, ...arm }, replacedBy, []);
}
function swapLineup(state, aId, bId, posOf) {
  const pos = posFn(posOf);
  const a = Number(aId), b = Number(bId);
  const xi = ids(state?.xi), bench = ids(state?.bench);
  if (a === b) return null;
  const ia = xi.indexOf(a), ib = xi.indexOf(b), ja = bench.indexOf(a), jb = bench.indexOf(b);
  if (ia >= 0 && jb >= 0) {
    xi[ia] = b;
    bench[jb] = a;
  } else if (ib >= 0 && ja >= 0) {
    xi[ib] = a;
    bench[ja] = b;
  } else if (ja >= 0 && jb >= 0) {
    if (pos(a) === "GK" || pos(b) === "GK") return null;
    bench[ja] = b;
    bench[jb] = a;
  } else return null;
  if (!validFormation(xi, pos)) return null;
  return { xi, bench: gkFirst(bench, pos) };
}
function swapCandidates(state, id, posOf) {
  return [...ids(state?.xi), ...ids(state?.bench)].filter((p) => p !== Number(id) && swapLineup(state, id, p, posOf));
}

// js/plan/engine/phone.js
var VERDICT = Object.freeze({ clear: 2, lean: 1 });
var EPS = 1e-6;
function noiseFloor(meta, gw) {
  return num(meta?.noise) ?? num(meta?.tau_by_anchor?.[gw]) ?? num(meta?.tau);
}
var SEEDS = /* @__PURE__ */ new WeakMap();
var isSeeds = (x) => x && typeof x.at === "function" && x.data instanceof Float32Array;
function f32FromBase64(b64) {
  const bin = atob(b64);
  if (bin.length % 4) throw new Error(`seeds: ${bin.length} bytes is not a Float32 array`);
  const dv = new DataView(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) dv.setUint8(i, bin.charCodeAt(i));
  const out = new Float32Array(bin.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = dv.getFloat32(i * 4, true);
  return out;
}
function decodeSeeds(seeds) {
  if (!seeds || typeof seeds !== "object") return null;
  if (isSeeds(seeds)) return seeds;
  let S = SEEDS.get(seeds);
  if (S) return S;
  const pids = ids(seeds.ids), gws = ids(seeds.gws);
  const runs = Math.max(0, Math.round(num(seeds.runs) ?? 0));
  const data = seeds.data instanceof Float32Array ? seeds.data : Array.isArray(seeds.data) ? Float32Array.from(seeds.data, (v) => num(v) ?? NaN) : typeof seeds.f32 === "string" ? f32FromBase64(seeds.f32) : new Float32Array(0);
  if (data.length !== pids.length * gws.length * runs) {
    throw new Error(`seeds: ${data.length} values for ${pids.length} players \xD7 ${gws.length} GWs \xD7 ${runs} runs`);
  }
  const pi = new Map(pids.map((p, i) => [p, i]));
  const gi = new Map(gws.map((g, i) => [g, i]));
  const at0 = (id, gw) => {
    const i = pi.get(Number(id)), j = gi.get(Number(gw));
    return i === void 0 || j === void 0 ? -1 : (i * gws.length + j) * runs;
  };
  S = Object.freeze({
    ids: pids,
    gws,
    runs,
    data,
    has: (id) => pi.has(Number(id)),
    /** where (id, gw)'s runs start in data (run r at offset + r), or -1 if the matrix has no such cell */
    offset: at0,
    /** run r's xP for GW gw (null when the matrix has no such cell) */
    at(id, gw, r) {
      const o = at0(id, gw);
      if (o < 0 || !(r >= 0 && r < runs)) return null;
      const v = data[o + r];
      return Number.isFinite(v) ? v : null;
    },
    /** the mean over runs (null when no run has the cell) */
    mean(id, gw) {
      const o = at0(id, gw);
      if (o < 0) return null;
      let s = 0, n = 0;
      for (let r = 0; r < runs; r++) {
        const v = data[o + r];
        if (Number.isFinite(v)) {
          s += v;
          n++;
        }
      }
      return n ? s / n : null;
    }
  });
  SEEDS.set(seeds, S);
  return S;
}
function runXp(seeds, r, fallback) {
  const S = decodeSeeds(seeds);
  return (id, gw) => S?.at(id, gw, r) ?? (fallback ? num(fallback(id, gw)) : null);
}
var scores = (week, xpOf2) => [...week.xi, ...week.chip === "bb" ? week.bench : []].every((p) => num(xpOf2(p, week.gw)) !== null);
function planWeeks(plan, xp) {
  const list = Array.isArray(plan?.gws) ? plan.gws : Array.isArray(plan?.weeks) ? plan.weeks : Array.isArray(plan) ? plan : [];
  return list.filter((w) => num(w?.gw) !== null).map((w) => {
    const own = w.xp && typeof w.xp === "object" && !Array.isArray(w.xp) ? w.xp : null;
    const meanOf = (id, g) => own && num(own[id]) !== null ? Number(own[id]) : xp ? num(xp(id, g)) : null;
    const week = {
      gw: Number(w.gw),
      xi: ids(w.xi),
      bench: ids(w.bench),
      captain: num(w.captain),
      chip: CHIPS2.includes(w.chip) ? w.chip : null,
      hits: num(w.hits) ?? 0,
      ft: num(w.ft ?? w.ft_avail),
      used: num(w.used ?? w.ft_used)
    };
    const pred = num(w.pred);
    const points = num(w.points) ?? (pred === null || scores(week, meanOf) ? weekPoints(week, meanOf) : pred - HIT_COST * week.hits);
    return { ...week, points, meanOf, src: w, xpOf: xp };
  }).sort((a, b) => a.gw - b.gw);
}
function bankCredit(week, rate) {
  const r = num(rate), ft = num(week?.ft ?? week?.ft_avail), used = num(week?.used ?? week?.ft_used);
  if (!(r > 0) || ft === null || used === null || week?.chip === "wc" || week?.chip === "fh" || Number(week?.gw) >= LAST_ROUND) return 0;
  return r * Math.min(FT_CAP - 1, Math.max(0, ft - used));
}
function planPoints(plan, { xp, ftValue } = {}) {
  const weeks = planWeeks(plan, xp);
  const points = weeks.map((w) => w.points);
  const bank = weeks.length ? bankCredit(weeks.at(-1), ftValue) : 0;
  return { gws: weeks.map((w) => w.gw), points, bank, total: sum(points) + bank };
}
function runWeeks(weeks, S) {
  if (typeof S.offset !== "function") {
    return weeks.map((w) => {
      const out = new Float64Array(S.runs);
      for (let r = 0; r < S.runs; r++) out[r] = weekPoints(w, (id, g) => S.at(id, g, r) ?? w.meanOf(id, g));
      return out;
    });
  }
  const { data, runs } = S;
  return weeks.map((w) => {
    const kept = w.src && RUN_WEEKS.get(w.src);
    if (kept && kept.S === S && kept.xp === w.xpOf) return kept.out;
    const g = w.gw;
    const col = (p) => ({ o: S.offset(p, g), fill: void 0, p });
    const val = (c, r) => {
      if (c.o >= 0) {
        const v = data[c.o + r];
        if (Number.isFinite(v)) return v;
      }
      if (c.fill === void 0) c.fill = num(w.meanOf(c.p, g)) ?? 0;
      return c.fill;
    };
    const xi = ids(w.xi).map(col);
    const cap = num(w.captain);
    const capCol = cap === null ? null : col(cap);
    const mult = w.chip === "tc" ? 2 : 1;
    const bench = w.chip === "bb" ? ids(w.bench).map(col) : null;
    const hit = HIT_COST * (num(w.hits) ?? 0);
    const out = new Float64Array(runs);
    for (let r = 0; r < runs; r++) {
      let xiPts = 0;
      for (const c of xi) xiPts += val(c, r);
      const capPts = capCol === null ? 0 : val(capCol, r) * mult;
      let benchPts = 0;
      if (bench) for (const c of bench) benchPts += val(c, r);
      out[r] = xiPts + capPts + benchPts - hit;
    }
    if (w.src) RUN_WEEKS.set(w.src, { S, xp: w.xpOf, out });
    return out;
  });
}
var RUN_WEEKS = /* @__PURE__ */ new WeakMap();
function runTotals(plan, seeds, { xp } = {}) {
  const S = decodeSeeds(seeds);
  if (!S) return new Float32Array(0);
  const per = runWeeks(planWeeks(plan, xp), S);
  const out = new Float32Array(S.runs);
  for (let r = 0; r < S.runs; r++) out[r] = sum(per.map((a) => a[r]));
  return out;
}
function anchorRef(kh, anchor) {
  const k = Array.isArray(kh) ? kh.map(num) : [];
  const a = num(anchor);
  if (k.length < 2 || a === null || !k.every((x) => x > 0)) return null;
  return (gw) => k[0] / k[Math.min(Math.max(Number(gw) - a, 0), k.length - 1)];
}
function verdictLabel(delta, noise) {
  const d = Math.abs(num(delta) ?? 0), n = Math.max(0, num(noise) ?? 0);
  if (d <= EPS) return "coin";
  if (d >= VERDICT.clear * n) return "clear";
  if (d >= VERDICT.lean * n) return "lean";
  return "coin";
}
function payback(cum, gws) {
  const n = cum?.length ?? 0;
  if (!n) return null;
  let k = n;
  while (k > 0 && cum[k - 1] >= -EPS) k--;
  const last = gws[n - 1];
  if (k === n) return { kind: "never", gw: last, text: `Doesn't pay back by GW${last}` };
  if (k > 0) return { kind: "pays", gw: gws[k], text: `Pays back GW${gws[k]}` };
  const i = cum.findIndex((c) => c > EPS);
  if (i < 0) return { kind: "level", gw: last, text: `Level through GW${last}` };
  return { kind: "ahead", gw: gws[i], text: `Ahead from GW${gws[i]}` };
}
function compareRoads(a, b, { seeds, noise, xp, ftValue, ref = null } = {}) {
  const wb = new Map(planWeeks(b, xp).map((w) => [w.gw, w]));
  const A = planWeeks(a, xp).filter((w) => wb.has(w.gw));
  const B = A.map((w) => wb.get(w.gw));
  const gws = A.map((w) => w.gw);
  const perGw = A.map((w, i) => w.points - B[i].points);
  const bank = A.length ? bankCredit(A.at(-1), ftValue) - bankCredit(B.at(-1), ftValue) : 0;
  const cum = [];
  perGw.reduce((s, x, i) => cum[i] = s + x + (i === perGw.length - 1 ? bank : 0), 0);
  const delta = cum.at(-1) ?? 0;
  const f = A.map((w) => ref ? ref(w.gw) : 1);
  const fixed = sum(A.map((w, i) => HIT_COST * (w.hits - B[i].hits) * (f[i] - 1))) + (A.length ? bank * f.at(-1) : 0);
  const onA = (d) => !ref ? sum(d) + bank : sum(d.map((x, i) => x * f[i])) + fixed;
  const atA = !ref ? delta : onA(perGw);
  const S = decodeSeeds(seeds);
  const runs = S?.runs ?? 0;
  let votes = null, against = null, diffs = null, diffsRef = null, cumRuns = null;
  if (runs) {
    const ra = runWeeks(A, S), rb = runWeeks(B, S);
    diffs = new Float32Array(runs);
    diffsRef = ref ? new Float32Array(runs) : diffs;
    cumRuns = [];
    votes = 0;
    against = 0;
    for (let r = 0; r < runs; r++) {
      let s = 0;
      const d = gws.map((_, i) => ra[i][r] - rb[i][r]);
      const c = d.map((x, i) => s += x + (i === gws.length - 1 ? bank : 0));
      diffs[r] = s;
      if (ref) diffsRef[r] = onA(d);
      cumRuns.push(c);
      if (s > EPS) votes++;
      else if (s < -EPS) against++;
    }
  }
  const lead = runs ? delta >= 0 ? votes : against : null;
  return {
    gws,
    delta,
    ref: atA,
    points: sum(perGw),
    bank,
    perGw,
    cum,
    votes,
    against,
    lead,
    runs,
    label: verdictLabel(atA, noise),
    payback: payback(cum, gws),
    diffs,
    diffsRef,
    cumRuns,
    winner: delta > EPS ? "a" : delta < -EPS ? "b" : null
  };
}
function objectiveOf(road, { atAnchor = false } = {}) {
  const o = road?.objective;
  if (!o || typeof o !== "object" || !Object.keys(o).length) return null;
  const ref = atAnchor ? anchorRef(road.k_h, roadAnchor(road)) : null;
  const w = ref ?? (() => 1);
  const terms = Object.fromEntries(Object.entries(o).map(([k, by]) => [k, sum(Object.entries(by || {}).map(([g, v]) => (num(v) ?? 0) * w(g)))]));
  return { terms, total: sum(Object.values(terms)) };
}
function roadAnchor(road) {
  const a = road?.values?.from_r;
  if (Number.isInteger(a)) return a;
  const gws = (road?.weeks || []).map((w) => num(w?.gw)).filter((g) => g !== null);
  return gws.length ? Math.min(...gws) : null;
}
var WEEK_FIELDS = ["gw", "in", "out", "xi", "bench", "captain", "vice", "chip", "bank", "ft_avail", "ft_used", "hits", "pred"];
function roadFromResult(result, { key = "base", job = null, values = null } = {}) {
  const rows = solverRows(result);
  const from = rows[0]?.gw;
  return {
    key,
    job,
    values,
    argv: result?.meta?.argv || result?.argv || [],
    weeks: rows.map(({ gw, t }) => ({
      ...Object.fromEntries(WEEK_FIELDS.map((k) => [k, t?.[k] ?? null])),
      gw,
      in: ids(t?.in),
      out: ids(t?.out),
      xi: ids(t?.xi),
      bench: ids(t?.bench)
    })),
    objective: (from === void 0 ? null : result?.anchors?.[from]?.objective) || {},
    warnings: result?.warnings || []
  };
}
function resultOfRoad(road) {
  const weeks = (road?.weeks || []).filter((w) => num(w?.gw) !== null).sort((a, b) => a.gw - b.gw);
  const first = weeks[0];
  if (!first) return { meta: {}, committed: {}, anchors: {} };
  return {
    meta: { from: first.gw, to: first.gw, w: weeks.length, argv: road.argv || [], pool: road.values?.dir ?? null },
    committed: { [first.gw]: { team: first } },
    anchors: { [first.gw]: { plan: Object.fromEntries(weeks.slice(1).map((w) => [w.gw, w])) } }
  };
}
function roadToDraft(road, base, { players, name, keep = [] } = {}) {
  return draftFromSolverResult(resultOfRoad(road), base, { players, keep, name: name ?? `Road ${road?.key ?? ""}`.trim() });
}

// js/m/calls/helpers.js
var FORGET_MS = 30 * 60 * 1e3;
var AWAY = `${FORGET_MS / 6e4} minutes`;
function gwFlags(win, gw) {
  const has = (xs) => (xs || []).map(Number).includes(Number(gw));
  return [has(win?.doubles) ? "DGW" : null, has(win?.blanks) ? "BGW" : null].filter(Boolean);
}
var OUT = { i: "injured", u: "unavailable", s: "suspended" };
var newsReason = (row) => String(row?.news || "").split(" - ")[0].trim().toLowerCase();
var statusText = (name, row) => {
  const st = statusInfo(row?.status, row?.chance);
  const why = newsReason(row);
  if (OUT[st.code]) return `${name} is ${OUT[st.code]}${why && why !== OUT[st.code] ? ` (${why})` : ""}`;
  if (st.code === "d" || st.chance !== null && st.chance < 100) return `${name} is ${st.chance !== null ? `${st.chance}%` : "doubtful"}${why ? ` (${why})` : ""}`;
  return null;
};
var num2 = (v) => fin(v) ? Number(v) : null;
var EPS2 = 1e-6;
var ids2 = (xs) => Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : [];
var MINUS2 = "\u2212";
var pts = (x) => fmt.signed(x);
var gwList = (gws) => gws.map((g) => `GW${g}`).join(", ");
var span = (gws) => gws.length > 1 && gws[0] !== gws.at(-1) ? `GW${gws[0]}\u2013${gws.at(-1)}` : gws.length ? `GW${gws[0]}` : "";
var range = (a, b) => span(a === b ? [a] : [a, b]);
var andList = (xs) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "";
var setsSaid = ({ start, bench, subs, captain, vice }) => start.length ? `start ${start.join(", ")}` : bench.length || subs.length ? `bench ${(bench.length ? bench : subs.map((x) => x.off)).join(", ")}` : captain ? `captain ${captain}` : vice ? `vice-captain ${vice}` : "bench order";
var setsRow = ({ start, bench, subs, captain, vice, order, buys = [] }) => {
  const after = (on) => on ? " (after the transfer)" : "";
  const had = start.length ? `benched ${andList(start)}` : bench.length ? `started ${andList(bench)}` : null;
  return [had, [
    ...subs.map((x) => `Start ${x.on} for ${x.off}${after(x.buy)}`),
    captain && `Captain: ${captain}${after(buys.includes(captain))}`,
    vice && `Vice-captain: ${vice}${after(buys.includes(vice))}`,
    order && `Bench: ${order.join(", ")}`
  ].filter(Boolean)];
};
var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
var ORD = (n) => {
  const v = n % 100, s = ["th", "st", "nd", "rd"];
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};
var rankOrd = (n) => fmt.ordinal(n).replace(/^\d+/, fmt.int(n));
var rankShort = (n) => n < 1e4 ? fmt.int(n) : fmt.compact(n, 2);
var gwsWords = (list) => list.map((x) => `GW${x.gw}`).join(" and ");
var hitsWords = (n) => n > 1 ? `${WORDS[n] ?? n} hits (${MINUS2}${HIT_COST * n})` : `a ${MINUS2}${HIT_COST}`;
var hitCap = (model) => num2(model?.hit_rule?.cap);
var horizonFeature = (n) => `horizon:${n}`;
function planWeeks2(choice, locked = [], most = null) {
  const n = num2(choice), top = num2(most);
  const want = Number.isInteger(n) && n >= 1 && (top === null || n <= top) ? n : top;
  if (want === null) return null;
  const off = (k) => k > 1 && (locked || []).includes(horizonFeature(k));
  return off(want) ? Math.max(...Array.from({ length: top ?? want }, (_, i) => i + 1).filter((k) => !off(k))) : want;
}
var signedMoney = (t) => `${t > 0 ? "+" : ""}${fmt.money(t / 10)}`;
var tenths = (m) => num2(m) === null ? null : Math.round(Number(m) * 10);
var lookupOf = (ctx) => playerLookup({ base: ctx.base, players: ctx.players });
var weekAt = (road, gw) => (road?.weeks || []).find((w) => Number(w.gw) === Number(gw)) || null;

// js/m/calls/prices.js
var PRICE_WORD = Object.freeze({ 5: "very likely to rise", 4: "likely to rise", [-4]: "likely to drop", [-5]: "very likely to drop" });
var priceSaid = (o, when = "") => {
  if (!o?.dir) return null;
  const at = when ? ` ${when}` : "";
  return o.sure ? `${o.word}${at}` : `may ${o.dir > 0 ? "rise" : "drop"}${at} (FPL: likely)`;
};
var SURE = 5;
var MAYBE = 4;
var DAY_S = 86400;
var WATCH_OLD_S = 8 * 3600;
var LONDON = "Europe/London";
var FMTS = /* @__PURE__ */ new Map();
function fmtIn(tz, opts) {
  const k = `${tz ?? ""}|${JSON.stringify(opts)}`;
  let f = FMTS.get(k);
  if (!f) FMTS.set(k, f = new Intl.DateTimeFormat("en-GB", { ...opts, ...tz ? { timeZone: tz } : {} }));
  return f;
}
var HM = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
function priceNights(meta, { now = Date.now() / 1e3, until = null } = {}) {
  const all = (Array.isArray(meta?.price_change_deadlines) ? meta.price_change_deadlines : []).map(num2);
  const nights = all.map((epoch, k) => ({ k, epoch })).filter((n) => n.epoch !== null && n.epoch > now && (until === null || n.epoch < until));
  return { nights, stale: all.some((e) => e !== null && e <= now), asOf: num2(meta?.prices_as_of ?? meta?.price_change_as_of) };
}
var shownPlayers = (b) => withPrices(withPrices(b?.players, b?.live), b?.prices);
function withPrices(cols, prices) {
  const pf = prices?.fields, cf = cols?.fields;
  if (!Array.isArray(pf) || !Array.isArray(prices.rows) || !Array.isArray(cf) || !Array.isArray(cols.rows)) return cols;
  const pid = pf.indexOf("id"), cid = cf.indexOf("id");
  if (pid < 0 || cid < 0) return cols;
  const at = pf.flatMap((f, j) => f !== "id" && cf.includes(f) ? [[cf.indexOf(f), j]] : []);
  const fresh = new Map(prices.rows.map((r) => [Number(r[pid]), r]));
  return {
    ...cols,
    rows: cols.rows.map((r) => {
      const p = fresh.get(Number(r[cid]));
      if (!p) return r;
      const out = [...r];
      for (const [i, j] of at) out[i] = p[j];
      return out;
    })
  };
}
function priceOutlook(row, nights) {
  const none = { dir: 0, sure: false, night: null, likelihood: 0, word: null, held: null };
  if (!row) return none;
  if (row.price_calibrating) return { ...none, held: "calibrating" };
  const lock = Date.parse(row.price_locked_until ?? "") / 1e3;
  const pw = Array.isArray(row.price_watch) ? row.price_watch : [];
  let maybe = null, locked = false;
  for (const [j, n] of nights.entries()) {
    if (lock >= n.epoch) {
      locked = true;
      continue;
    }
    const l = num2(pw[n.k]?.[0]) ?? 0;
    const at = { dir: Math.sign(l), night: j, likelihood: l, word: PRICE_WORD[l] ?? null, held: null };
    if (Math.abs(l) >= SURE) return { ...at, sure: true };
    if (Math.abs(l) >= MAYBE) maybe ??= { ...at, sure: false };
  }
  return maybe ?? { ...none, held: locked ? "locked" : null };
}
function nightWords(epoch, now, tz) {
  const ms = epoch * 1e3;
  const tonight = epoch - now <= DAY_S, tomorrow = !tonight && epoch - now <= 2 * DAY_S;
  const eve = fmtIn(LONDON, { weekday: "long" }).format(ms - 36e5);
  const day = (z) => tonight ? "" : `${fmtIn(z, { weekday: "short" }).format(ms)} `;
  const uk = `${day(LONDON)}${fmtIn(LONDON, HM).format(ms)}`, local2 = `${day(tz)}${fmtIn(tz, HM).format(ms)}`;
  return {
    tonight,
    when: tonight ? "tonight" : tomorrow ? "tomorrow" : `${eve} night`,
    short: tonight ? "tonight" : tomorrow ? "tomorrow" : eve.slice(0, 3),
    clock: uk === local2 ? `${uk} UK` : `${uk} UK \xB7 ${local2} your time`
  };
}
var PRICE_TONE = Object.freeze({ 5: 1, 4: 2, [-4]: 4, [-5]: 5 });
var toneOf = (p) => PRICE_TONE[p?.price_watch?.[0]?.[0]] ?? 3;
var lockedNow = (p) => Date.parse(p?.price_locked_until ?? "") > Date.now();
function priceProgress(p, r) {
  const says = (text) => ({ text, tone: 3, sale: null });
  if (p?.price_calibrating) return says("Calibrating");
  if (lockedNow(p)) return says("Locked");
  const n = fmt.signed(p?.price_watch?.[0]?.[1]);
  if (n === fmt.dash) return null;
  const tone = toneOf(p), step = tone > 3 ? saleStep(r, -1) : null;
  return { text: /^[+−]/.test(n) ? `${n}%` : "0%", tone, sale: step < 0 ? step : null };
}
function pricePlate(p) {
  if (lockedNow(p)) return { text: "Locked", tone: 3, fill: 0, locked: true };
  const n = num2(p?.price_progress);
  const text = n === null ? fmt.dash : n ? `${n > 0 ? "+" : MINUS2}${Math.abs(n)}%` : "0%";
  return { text, tone: toneOf(p), fill: Math.min(Math.abs(n ?? 0), 100), locked: false };
}
function saleStep(r, dir) {
  const now = tenths(r?.sell_price), after = tenths(dir > 0 ? r?.sell_price_up : r?.sell_price_down);
  return now === null || after === null ? null : after - now;
}
function priceWatch(ctx, draft, { now = Date.now() / 1e3, tz } = {}) {
  const meta = ctx?.meta || {};
  const { nights, stale, asOf } = priceNights(meta, { now, until: num2(meta.deadline_epoch) });
  if (stale || !nights.length || !draft || !ctx?.base) return null;
  const L = lookupOf(ctx), A = ctx.A;
  const ev = evaluate({ base: ctx.base, players: ctx.players, draft, horizon: ctx.gws, banksOnly: true });
  const moves = handoffMoves(ev.gws.find((s) => s.gw === A));
  const owned = new Map((ctx.base.squad || []).map((r) => [Number(r.id), r]));
  const players = {};
  for (const m of moves) {
    for (const [id, role] of [[m.out, "sell"], [m.in, "buy"]]) {
      const o = priceOutlook(L.get(id)?.row, nights);
      const r = owned.get(Number(id));
      const sale = role === "sell" ? num2(r?.sell_price) : null;
      const step = !o.dir ? 0 : role === "buy" ? o.dir : saleStep(r, o.dir);
      players[id] = { ...o, id: Number(id), role, name: L.name(id), sale, step, counted: o.sure && step !== null };
    }
  }
  const list = Object.values(players);
  if (!list.some((p) => p.dir)) return null;
  const banks = (base, pl) => planBanks({ base, players: pl, draft, horizon: ctx.gws });
  const now0 = banks(ctx.base, ctx.players);
  const neg = (b) => num2(b) !== null && b < -EPS2;
  const out = nights.map((n, j) => {
    const ps = list.filter((p) => p.counted && p.night <= j);
    const sale = new Map(ps.filter((p) => p.role === "sell").map((p) => [p.id, p.step]));
    const buy = new Map(ps.filter((p) => p.role === "buy").map((p) => [p.id, p.step]));
    const wT = ps.reduce((s, p) => s + (p.role === "buy" ? p.step : -p.step), 0);
    const base = !sale.size ? ctx.base : { ...ctx.base, squad: ctx.base.squad.map((r) => sale.has(Number(r.id)) ? { ...r, sell_price: (tenths(r.sell_price) + sale.get(Number(r.id))) / 10 } : r) };
    const pl = !buy.size ? ctx.players : new Map(L.all().map((r) => [r.id, buy.has(r.id) ? { ...r.row, id: r.id, price: (r.priceT + buy.get(r.id)) / 10 } : r.row]));
    const wait = ps.length ? banks(base, pl) : now0;
    const gw = wT > 0 ? ctx.gws.find((g) => !neg(now0[g]) && neg(wait[g])) ?? null : null;
    const verdict = wT > 0 ? gw === null ? "money" : gw === A ? "thisMove" : "laterMove" : wT < 0 ? "gain" : "free";
    return { epoch: n.epoch, k: n.k, w: wT / 10, verdict, gw, short: gw === null ? 0 : -wait[gw], bank: { now: now0[A], wait: wait[A] }, allOk: ctx.gws.every((g) => !neg(wait[g])), counted: ps.length };
  });
  const act = out.findIndex((x) => x.w > EPS2);
  const words = nights.map((n) => nightWords(n.epoch, now, tz));
  const by = (j) => words[j].tonight ? "tonight" : `by ${words[j].when}`;
  const lines = moves.map((m) => {
    const parts = [players[m.out], players[m.in]].filter((p) => p.dir).map((p) => ({ id: p.id, dir: p.dir, sure: p.sure, text: COPY.watchPart(p, by(p.night)) }));
    return { out: m.out, in: m.in, parts, text: parts.length ? parts.map((p) => p.text).join(" \xB7 ") : null };
  });
  const ref = (j) => `${words[j].when}'s price change`;
  let line = null, short = null, at = null;
  if (act >= 0) {
    const x = out[act];
    const later = x.verdict === "laterMove" ? andList((draft.moves?.[x.gw] || []).map((m) => `${L.name(m.out)} \u2192 ${L.name(m.in)}`)) : null;
    line = COPY.watchAct({
      ...x,
      n: moves.length,
      ref: ref(act),
      clock: words[act].clock,
      before: act > 0 ? ref(act - 1) : null,
      buys: andList(moves.map((m) => L.name(m.in))),
      later
    });
    short = COPY.watchShort({ ...x, n: moves.length, ref: ref(act) });
    at = act;
  } else if (out.some((x) => x.counted)) {
    const best = out.reduce((a, x, j) => x.w < out[a].w - EPS2 ? j : a, 0);
    line = out[best].w < -EPS2 ? COPY.watchGain(-out[best].w, ref(best)) : COPY.watchFree(moves.length);
    short = out[best].w < -EPS2 ? COPY.watchShort({ ...out[best], ref: ref(best) }) : null;
    at = best;
  }
  const date = (e) => fmtIn(tz, { dateStyle: "short" }).format(e * 1e3);
  const asOfText = asOf === null ? null : `${date(asOf) !== date(now) ? `${fmtIn(tz, { weekday: "short" }).format(asOf * 1e3)} ` : ""}${fmtIn(tz, HM).format(asOf * 1e3)}`;
  const old = asOf !== null && nights[act >= 0 ? act : 0].epoch - asOf >= WATCH_OLD_S;
  const moveAtStake = act >= 0 && (out[act].verdict === "thisMove" || out[act].verdict === "laterMove");
  return {
    nights: out,
    act: act >= 0 ? act : null,
    at,
    players,
    moves: lines,
    line,
    short,
    tone: moveAtStake ? "act" : "info",
    note: asOfText ? COPY.watchNote(asOfText, old) : null,
    asOf
  };
}
function priceMorning(kept, meta, { now = Date.now() / 1e3, prices = {}, bank = null, name = String } = {}) {
  if (!kept || !(kept.epoch <= now) || priceNights(meta, { now }).stale) return null;
  const moved = Object.entries(kept.prices || {}).map(([id, t]) => ({ name: name(Number(id)), t: (prices[id] ?? t) - t })).filter((x) => x.t);
  return COPY.watchMorning(moved, kept.gw, bank);
}
var clockText = (s) => {
  const t = Math.max(0, Math.floor(s)), hh = Math.floor(t / 3600), mm = Math.floor(t % 3600 / 60), ss = String(t % 60).padStart(2, "0");
  return hh ? `${hh}:${String(mm).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
};
var waitedText = (t0, now = Date.now()) => ` \xB7 ${clockText((now - t0) / 1e3)}`;
function waitLines({ scope = null, long = null, prog = null, so = null }) {
  const t = so == null ? null : clockText(so);
  const one = (s, ...xs) => `${s ? ` ${s}` : ""}${xs.filter(Boolean).map((x) => ` \xB7 ${x}`).join("")}`;
  const mid = so != null && so >= 10 ? [one(null, prog, t), one(scope, prog)] : [one(scope, prog), one(null, prog, t)];
  return [...new Set([long && one(long, prog, t), one(scope, prog, t), ...mid, one(scope, t), one(null, prog), one(null, t), one(scope), ""].filter((x) => typeof x === "string"))];
}
var stepShare = (done, n, since = 0, tau = 4e3) => n > 0 ? Math.min(1, (done + 0.8 * (1 - Math.exp(-Math.max(0, since) / Math.max(1e3, tau)))) / n) : 0;
function waitFacts(b) {
  const r = b?.rank, [prev, last] = (b?.entry?.history ?? []).slice(-2);
  if (!r?.cheer) return [];
  const moved = last?.gw === r.gw && prev?.gw === r.gw - 1 && last.overall_rank > 0 && prev.overall_rank > 0;
  return [moved && COPY.factMove(r.gw, prev.overall_rank, last.overall_rank), COPY.factRank(r.cheer)].filter(Boolean);
}
var waitFact = (b, act = 0) => {
  const f = waitFacts(b);
  return f[Math.min(act, f.length - 1)] ?? null;
};

// js/m/calls/copy.js
var sentence = (text) => /[.!?…]$/.test(String(text)) ? String(text) : `${text}.`;
var chipWeekWhat = (chip, gw, ftNext = null) => chip === "fh" ? `one-week squad, back to your team in GW${gw + 1}${ftNext == null ? "" : ` \xB7 ${ftNext} FT kept for GW${gw + 1}`}` : "unlimited transfers this week";
var COPY = Object.freeze({
  span,
  range,
  /** C-badge drag tip: the armband on him against the captain now, in the one measure; no weak-call mark (owner,
   *  2026-10-18). */
  capGap: (delta, vsName) => `${pts(delta)} pts vs ${vsName} (C)`,
  capNow: "Captain now",
  /** The V's drag (ahead.js dragBadge; owner, 2026-10-13): words beside the finger, no number (the vice scores only if
   *  the captain misses): over a starter, the vice, the captain (the armbands swap), or no starter. */
  viceTo: (name) => `${name} \xB7 vice`,
  viceStays: "Vice now",
  viceSwap: (name) => `${name} \xB7 the armbands swap`,
  viceDrop: "Drop the vice armband on a starter",
  /** ahead.armbandSheet's title. */
  armIn: (arm, gw) => `${arm === "v" ? "Vice-captain" : "Captain"} \xB7 GW${gw}`,
  /** A sub's list title (ahead.subSheet), as his card names him ("substitute 1", the keeper "goalkeeper"); n his place
   *  in the bench order (pitch.subOrder), null for the keeper. */
  subIn: (n, gw) => `${n == null ? "Goalkeeper" : `Substitute ${n}`} \xB7 GW${gw}`,
  /** A player-you-have's card buttons: sell him and choose who comes in; swap him with a sub. */
  replaceGo: "Replace\u2026",
  subGo: "Sub\u2026",
  /** A starter's sub list (his card's Sub): who can come on for him. */
  subOut: (name, gw) => `Sub off ${name} \xB7 GW${gw}`,
  /** Replace's "Let Forkcast choose" (owner, 2026-10-13): the sale alone yours, the buy the full plan's
   *  (ahead.sellAny). */
  autoBuy: "The full plan picks who comes in",
  /** A lifted shirt's line under the switcher (ahead.js liftShirt): the players he can swap with outlined on the pitch
   *  (engine.swapCandidates), the weeks he can be sold from glowing. `out`: the Wildcard or Free Hit week that brought
   *  him in, where a drop rules him out of its squad. */
  liftShirt: (name, swap, sell, out = null) => out != null ? `Drop ${name} ${[swap ? "on a player to swap them" : null, `on GW${out} to rule him out`, sell ? "on a later week to sell him" : null].filter(Boolean).join(", or ")}` : swap && sell ? `Drop ${name} on a player to swap them, or on a week to sell him` : swap ? `Drop ${name} on a player to swap them` : sell ? `Drop ${name} on a week to sell him from then` : `No swap or week works for ${name}`,
  /** How many forecast runs back the pooled call: for the Why sheet, never a verdict. */
  agreement: (lead, runs) => `${lead} of ${runs} forecast runs`,
  /** An edit's verdict against the plan before it (changeText): forecast points minus hits, the direction in words, not
   *  only colour. `total`: take and remove toasts name what your total moves by (changeNum; owner, 2026-10-21). */
  change: (what, delta, label, gws, total = false) => `${what} \xB7 ${COPY.changeNum(delta, total)}`,
  changeNum: (delta, total = false) => total ? `total ${pts(delta)}` : `${pts(delta)} pts`,
  /** An edit's subject in plain words, one form for every way in: "Bassey in your plan" (GW A: the move is the plan's
   *  until you make it in FPL), "Bassey in GW7"; with the player he replaces, "Bassey in for Chilwell in your plan". */
  cameIn: (names, gw = null) => `${andList(names)} in ${gw != null ? `GW${gw}` : "your plan"}`,
  cameInFor: (name, outName, gw = null) => `${name} in for ${outName}${gw != null ? ` \xB7 GW${gw}` : " in your plan"}`,
  /** What an edit takes off: one thing, or a list said once ("Groß → Dewsbury-Hall and Calvert-Lewin → Mateta
   *  removed"). */
  removed: (what) => `${Array.isArray(what) ? andList(what) : what} removed`,
  /** A choice making a move you removed this session (ahead.plansOf `removed`: after the others, never lit): its Week
   *  sheet row, spoken line and card note (owner, 2026-10-21). */
  removedByYou: "removed by you",
  /** …with your later sale of the player it bought, which has no one to sell then (ahead.removeMove). */
  /** Your transfer made in another GW, its toast's subject ("Chilwell → Bassey moved to GW7"). */
  movedTo: (move, gw) => `${move} moved to GW${gw}`,
  /** The Why sheet's When line ("why this week and not next"), labelled "If made in" ("When … each week" read as a
   *  per-week split): each week read out as one you can move your transfer to, the move's own week, or "—" where it
   *  can't be made. A tap chooses a week; the button under the line carries the verb ("Move it to GW7", whenVerb; read
   *  out whenMove). */
  whenHead: "If made in",
  /** …what its numbers count against, under it and in its label (owner, 2026-10-22: one baseline per sheet): `vs` the
   *  header's ("vs rolling"), else keeping the player it sells (vsKeeping); Chips… says each row's own: chipNoChip. */
  whenVs: (vs, gws) => `Points over ${span(gws)} ${vs}`,
  whenVerb: "Move it to",
  whenMove: (gw, delta) => delta == null ? `${COPY.whenVerb} GW${gw}` : `${COPY.whenVerb} GW${gw}: ${pts(delta)} pts`,
  whenHere: (gw, delta) => delta == null ? `GW${gw}, its week` : `GW${gw}, its week: ${pts(delta)} pts`,
  whenNone: (gw) => `GW${gw}: can't be made`,
  /** A week you can choose (a tap selects it; whenMove moves it there). */
  whenWeek: (gw, delta) => delta == null ? `GW${gw}` : `GW${gw}: ${pts(delta)} pts`,
  /** The Why table's forecast group (sheets/why.js pairTable). */
  gridUnit: "Forecast xP",
  // a forecast's unit is "xP" everywhere
  /** The stats' head, the Why table's and the player card's: their rounds, and in the Why table whom its ranks are
   *  among: "Stats · GW1–7 · ranks among 84 midfielders", `n` his position's ranked players (api/card.py _strip),
   *  `word` its plural (sheets/player.js WORD); rounds alone without them. */
  statsHead: (g0, g1, n = 0, word = null) => `Stats \xB7 ${range(g0, g1)}${n > 0 && word ? ` \xB7 ranks among ${n} ${word}` : ""}`,
  /** …and under the Why table, once, the stats set apart from the forecast, so the last matches' points above aren't
   *  taken for the forecast. */
  statsPast: (gws) => `Stats are past matches; the ${span(gws)} points above are the forecast.`,
  captainNow: (name) => `${name} captain`,
  viceNow: (name) => `${name} vice`,
  /** A funding sale's row and Why: what it frees, and what it scores alone. */
  funds: (money2, name) => `Frees ${money2} so ${name} fits`,
  /** The tie's other end, on the buy's row: the sales that fund it ("with Haaland → Thiago"); on a sale whose money a
   *  later week's buy needs ("Pays for B.Fernandes in GW8 and Palmer in GW9"). */
  fundedBy: (moves) => `with ${andList(moves)}`,
  /** A transfer's money on its Why line ('→' is a transfer's alone): what its sale frees beyond its buy, or what the
   *  buy takes from the bank, with the bank it takes it from where known (`bank`); null when equal. */
  frees: (x, bank = null) => Math.abs(x) < 0.05 ? null : x > 0 ? `frees ${fmt.money(x)}` : `${fmt.money(-x)} from the bank${bank ? ` (${bank})` : ""}`,
  /** A week with no transfer, its verdict by who left it empty (ahead.emptyHead): under the hold the Roll's own
   *  "No transfer made" (COPY.noTransferMade; owner, 2026-11-05: one name, whether or not there is a move); no edit reaches it (GW A under way) "No transfers"; off the hold,
   *  a week Forkcast's plan leaves empty "Forkcast rolls GW8" ("No transfers" while an edit's check may still re-plan
   *  it, or where a Roll rule holds: rollRule). */
  noTransfers: "No transfers",
  forkcastRolls: (gw) => `Forkcast rolls GW${gw}`,
  rollKeeps: (ft, gw) => `${ft} FT in GW${gw}`,
  /** …on the card, spelled out (books review 2026-11-08: "2 FT" never spelled out under a title that spells it). */
  rollKeepsCard: (ft, gw) => `${plural(ft, "free transfer")} in GW${gw}`,
  /** …read out in full (aria-label): "2 free transfers in gameweek 7". */
  rollKeepsSaid: (ft, gw) => `${plural(ft, "free transfer")} in gameweek ${gw}`,
  /** The week's free transfers, said first on a week with none of yours: "1 FT". */
  ftNow: (ft) => `${ft} FT`,
  ftNowSaid: (ft) => plural(ft, "free transfer"),
  /** The week's bank after its moves (fmt.money's words), said after its free transfers (ahead.factsWords; owner,
   *  2026-10-21), in FPL's word, never shortened: "£0.8m ITB"; read out "£0.8 million in the bank". */
  itb: (money2) => `${money2} ITB`,
  itbSaid: (money2) => `${money2.replace(/m$/, " million")} in the bank`,
  inTeam: (name) => `${name} is in your team already.`,
  /** A buy whose every sale of his position is a player your Keeps hold, by the first GW a Keep holds them. */
  keptIn: (names, gw) => `${andList(names)} ${names.length > 1 ? "are" : "is"} kept in GW${gw}.`,
  /** A buy no single extra sale pays for: what it needs, and another week only when that week fits him. Any edit short
   *  of money says it, the buy named where known (null: "Needs £1.2m more in GW6."). */
  noFit: (name, short, gw, tryGw = null) => `${name ? `${name} ${COPY.moneyNeeds(short)}` : COPY.moneyNeeds(short).replace(/^n/, "N")} in GW${gw}.${tryGw ? ` He fits in GW${tryGw}.` : ""}`,
  /** The weeks a later week's numbers count, its GW to the window's end ("GW8–9"); the suggested plans' label names
   *  them (COPY.suggested). */
  valuedOver: (gws) => span(gws),
  /** The move if its buy misses its GW (scored 0 there: ahead.ifMisses), and what it makes when he plays (`base`, where
   *  the two differ as shown). */
  ifMisses: (name, gw, delta, base = null, vs = null) => `if ${name} misses GW${gw}: ${pts(delta)}${base != null && pts(base) !== pts(delta) ? `, not ${pts(base)}${vs ? ` ${vs}` : ""}` : ""}`,
  /** The week's better use of the free transfer your transfer takes (ahead.otherUseOf), a move now in its place, never
   *  a fallback, and what your transfer makes with it (`mine`): "Better use of this free transfer: Scott → Groß +7.5,
   *  not +2.3". */
  instead: (move, delta, mine = null, vs = null) => `Better use of this free transfer: ${move} ${pts(delta)}${mine != null ? `, not ${pts(mine)}${vs ? ` ${vs}` : ""}` : ""}`,
  /** The baseline a Why fact's ", not X" names when the sheet's header counts against rolling ("+0.4 vs rolling" over
   *  "…, not +2.8" read as two numbers for one move). */
  vsKeeping: (name) => `vs keeping ${name}`,
  /** A buy the money can't pay, shown and said alike (Add a player's Sells chip, Replace's row): "£5.0m short". */
  moneyShort: (x) => `${fmt.money(x)} short`,
  /** …the same fact after the sale or buy it is about, in noFit's words: "Groß · needs £5.2m more". */
  moneyNeeds: (x) => `needs ${fmt.money(x)} more`,
  /** A Sell list row's ≈ and a Bring in week pill's number (replace.js, wish.js pillWords): what your total moves by
   *  when it is made, said to VoiceOver; no word under it on screen (owner, 2026-11-11, "fix this 'total' crap"). */
  listTotalSaid: (delta, about = false) => `${about ? "about " : ""}${pts(delta)} points to your total`,
  /** An edit's toast at once, with its Undo, while the full plan solves (its verdict replaces it in place); from 5 s
   *  its age after the ellipsis ("Planning Groß in your plan… 0:12"), and while the server is away the wait it is in. */
  // (every solve's wait has one word, an edit's, a week's checks, a chip's, a bring-in's and the plan's alike: owner,
  // 2026-11-03, "not split Planning and Planning solves and not treat them differently")
  waitWord: "Planning",
  pendingEdit: (what, so = null) => `${COPY.waitWord} ${what}\u2026${so ? ` ${so}` : ""}`,
  pendingOffline: (what) => `${what} \xB7 waiting for the connection`,
  /** An Undo said once, with no button, in the edit's own words ("Undone: Groß in your plan", ahead.undoOf); `gw`: the
   *  week after them unless they name it already. The state it leaves, never a double reversal (owner, 2026-10-22): a
   *  clause the edit said "… removed" or "… taken off" now reads "… back", one it said "… back" now "… removed";
   *  "Undone: " only before a first clause that stays as said ("Undone: GW8 Saka → Palmer · GW8 frozen"), else none
   *  ("Saka → Palmer back · GW8 frozen back"). A removal takes its own rules alone (owner, 2026-10-26): no clause to
   *  turn. */
  undone: (what, gw = null) => {
    const turn = (c) => c.replace(/ (removed|taken off)$/, "\0").replace(/ back$/, " removed").replace(/\u0000/g, " back");
    const parts = what.split(" \xB7 "), said = parts.map(turn).join(" \xB7 ");
    return `${turn(parts[0]) === parts[0] ? "Undone: " : ""}${said}${gw != null && !new RegExp(`\\bGW${gw}(?!\\d)`).test(what) ? ` \xB7 GW${gw}` : ""}`;
  },
  /** The forecast noise (meta.noise, its GW): the You sheet's Status row and the Player data sheet's note. */
  noiseValue: (noise, gw) => `${fmt.num(noise, 2)} pts (GW${gw})`,
  /** Help (the header's "Help", You → Help): a three-sentence lead, then one section per task, each a short list of
   *  actions in the app's own control names, each folding on its own (helpSheet: its head a button, the first open).
   *  Covers: a plan's + freezes its week (a Roll in Your rules), the card's Keep / Force out, the pitch's drags and
   *  holds, Chips… and Bring in… on the week line, the sign-out after FORGET_MS away. */
  helpShort: "Help",
  /** Settings (Ahead's header gear, in Help's old place; owner, 2026-10-29): its sheet's title and the gear's name. */
  settingsTitle: "Settings",
  /** …and the way to it, in Help's lines and a locked week's toast. */
  settingsDoor: "tap the settings icon at the top left",
  /** The first-use hints, each one line until its action is done once (ahead LEARN_KEY), in Help's words: the Week
   *  sheet's first transfer row's (its swipe; the veto's own words, "Not Groß"), the pitch's two lines (a shirt's hold:
   *  a sub or a sale; the C's or the V's drag) and, in the same corner once those are learnt, the chips' two (the GW
   *  tiles' codes: the corner is too narrow for names at 375 px). Help brings them back (tipsAgain). */
  // the veto's one word, as its Why button and rule chip say it (owner, 2026-10-22)
  hintRow: (name) => `Swipe left: Not ${name}`,
  // the chips' names whole (review 7 B18: no codes in a hint); each line whole or the hint gives way (placeHint)
  hintChips: ["Hold C: Triple Captain", "Hold bench: Bench Boost"],
  tipsAgain: "Show tips on the screen again",
  helpLead: "Forkcast plans your FPL team up to four gameweeks (GWs) ahead. It can't change your FPL team: make your transfers in the FPL app before the deadline. Each change shows a message with Undo.",
  /** → [[head, [bullet], clip?]], in the order a first visit needs them; `clip`: the section's recording on the real
   *  app (static/m/clips, sheets/about.js clip); `noise` and `gw` (ahead.inputsOf) are read by no line now. Bullets say
   *  what each number counts against (the total: your plan; a choice: rolling; a Sell list's ≈: keeping him), a chip's
   *  best week (chipBests, honestBest), how long checks take (minutes for the Chips sheet's), a take's message with its
   *  two numbers and Why, and the week line's facts in a GW with no transfers (ahead.factsWords); never the noise's
   *  points (Dev mode's: you.js paintDev). */
  help: (noise = null, gw = null) => [
    ["Plan your transfers", [
      "Pick a GW at the top, or swipe the pitch.",
      // (the band, its marks and his place: owner, 2026-11-03, design_1103b "Place header + Help text")
      "Forkcast's best move for a GW is the dark strip above the pitch; the player it sells is framed on the pitch.",
      "Swap takes it. \u2715 by the player coming in: not him this GW, and the next best shows.",
      "The lock by the player going out: keep him this GW.",
      // (a card's ×, not ⇄: FPL's substitution sign; owner, 2026-11-03, "Back to ×")
      "Tap \xD7 on a player's card for his place: the choices for his spot, each with its number and Swap.",
      "In a player's place, Keep over his own card keeps him that GW: nothing sells him.",
      "Rolling is making no transfer: your free transfer carries over to the next GW.",
      // the rule a take adds, by its own word (rollRule; owner, 2026-10-22: never "lock", the plan length's padlock): a
      // transfer's "GW8 frozen", the Roll's "GW8 roll", a Wildcard's or Free Hit's its chip
      "Taken transfers lock their GW (Your rules: locked): Forkcast changes nothing there. Roll adds a roll rule; Wildcard or Free Hit, the chip.",
      `Tap the line above the pitch for that GW's transfers, ${COPY.plansHead} and your rules.`,
      // its free transfers in every week, before its transfers (renderLine's weekLead)
      "The line above the pitch shows each GW's free transfers (FT) and money in the bank (ITB); with no transfers, the next GW's FT too."
    ], "plans"],
    ["Bring in a player", [
      `Tap ${COPY.bringInShort} (above the pitch, beside ${COPY.chipsDoor}), then + beside a player.`,
      "Pick a GW, then under Sells tap who goes out, even short of money."
    ], "bringin"],
    ["Your players", [
      "Tap a shirt for his card: Keep, or Force out (one week, or sold from a week on).",
      // the venue's case in words (review 7 B17: never case alone)
      `Opponents under the shirts: ${COPY.oppCase}.`,
      "Under Force out, From GW\u2026 lets you choose who comes in, or Let Forkcast choose.",
      "Hold a shirt, then drop it on an outlined player to swap them, or on a GW to sell him from then.",
      "Tap the C or the V to pick who wears it from a list.",
      "Tap a sub's order on the bench (1st, 2nd or 3rd) to pick who he replaces from a list.",
      "Hold the C or the V, then drop it on a starter. The V on the C swaps them."
    ], "replace"],
    ["Change a transfer", [
      "Tap the line above the pitch, then \xD7 on your transfer to remove it.",
      `Tap the player tagged IN, then a GW under \u201C${COPY.whenHead}\u201D, then ${COPY.whenVerb} that GW.`
    ], "xfer"],
    ["Keep a player, or say Not to one", [
      "Tap the line above the pitch. Swipe a transfer left: Not the player it buys, in that GW.",
      "A Wildcard or Free Hit week's changes work the same.",
      "Your rules, at the end of that list, shows what you set. Tap one, then Remove."
    ], "rules"],
    ["Settings", [
      `Hits: ${COPY.settingsDoor}, then ${COPY.hitsHead}.`,
      `How many GWs it plans: ${COPY.settingsDoor}, then ${COPY.aheadHead}.`
    ]],
    ["Play a chip", [
      `Tap ${COPY.chipsDoor} (above the pitch, beside ${COPY.bringInShort}), then a chip. Each shows its best week.`,
      "Triple Captain: hold the C still.",
      "Bench Boost: hold the bench where no shirt is.",
      `The same hold again, or ${COPY.chipTakeOff} in ${COPY.chipsDoor}, takes it off.`,
      "Best week: of the GWs your plan covers in its half of the season, where it gains most against not playing it.",
      // one baseline per chip (owner, 2026-10-22; ahead.chipNumber), each row naming its own
      "A Wildcard or Free Hit's number is vs rolling that GW, as a plan's. Bench Boost and Triple Captain: vs not playing it.",
      `${COPY.chipNoBestName}: no GW beats the next best by enough to act on. GWs past your plan aren't planned.`,
      `A chip's numbers can take minutes; its row says ${COPY.waitShort} until then.`
    ], "chips"],
    ["What the numbers mean", [
      "Points are forecast FPL points for a typical week, not a promise, minus 4 for each hit.",
      "The total at the top: your plan's points, no transfers unless you add them.",
      // one phrase for the baseline, "vs rolling" (owner, 2026-10-22: no "beats rolling", "against rolling")
      "A transfer's number: what it adds to your weeks' xP, the change you then see on the tabs.",
      "A plan's number: the same, all its transfers together. Roll has no number: it keeps your team as it is.",
      // compared to the transfer made, not rolling (owner, 2026-10-25)
      "In a GW with a transfer, Wildcard or Free Hit of yours, every choice, Roll too, is vs your plan: worse than yours is negative.",
      "Vs rolling, both sides get Forkcast's best later moves (none after a Wildcard), so the free transfer rolling saves can be used.",
      "Taking a choice adds its GW's moves alone, not the later ones its number counts, so the total can move by another amount.",
      // (owner, 2026-10-26: "what means +1.6 vs rolling but total +5.1"; the message carries no number since
      // 2026-10-27)
      "The total at the top shows its own change once the message goes.",
      "Green: it beats the alternative by enough to act on.",
      "Grey: not worth acting on: a plan or chip that doesn't beat what it counts against by enough, or a gap too small to matter.",
      // (owner, 2026-10-21: worse ones are listed too, grey; the moves the bars keep from being the week's suggestion:
      // ahead.plPays `early`)
      "Grey too: a move that adds next to nothing or loses when taken, or is as good a GW later.",
      "A transfer, Wildcard or Free Hit in your plan: amber when its gain is small, red when it loses by enough to matter.",
      // (owner, 2026-10-26: the plan is never drawn from an estimate; every squad is the solver's)
      "While a change is planned, the plan before it shimmers until the new one is in. Planning can take from seconds to several minutes.",
      "\u2248 before a number in a list: Forkcast's quick estimate. Every squad and number of your plan is its solver's.",
      "\u2248 in a Sell list is vs keeping him. Once made, the transfer's number is vs rolling instead, so it can differ."
    ]],
    ["What the marks mean", [
      // (owner, 2026-10-26: the black plate the transfer week's, a black ring after it)
      "Black name plate: bought this GW; tap him for who he replaces and why.",
      "Black ring round a name: bought in an earlier GW of your plan, not in your FPL team yet.",
      // (owner, 2026-10-26: struck old points)
      "Struck number on a GW: its points with no transfers of yours, beside its points with them.",
      "Dot in a GW's corner: your own lineup there. Reset (pitch, top left) brings the best one back.",
      `Lock on a GW: past your plan (${COPY.aheadHead}). Tap it to see how to plan it.`
    ]],
    ["Prices and news", [
      "Before a price change, the line above the pitch says whether to make your transfer tonight. Hide, in its list, puts it away.",
      "Player data (pitch, top right): choose what shows under each shirt.",
      "On a player's card, tap \u24D8 to read what a chart shows."
    ]],
    ["Start over", [
      "Tap your initials, then Reset all weeks.",
      // (the pitch's pill, owner, 2026-10-21; ahead.planHasYours, resetFits)
      "Reset all weeks is on the week's card too while your plan has a transfer, chip or rule of yours.",
      `Leave Forkcast for more than ${AWAY} and it signs you out of the team and clears its choices.`
    ]]
  ],
  /** About Forkcast (sheets/about.js): under Connect's form for whoever reads on, and from Help and the You sheet
   *  (owner, 2026-10-14). Its questions are those r/FantasyPL's Rate My Team threads ask most, in managers' words, most
   *  asked first, each answered by a recording of the screen (whyApp: static/m/clips,
   *  tools/qa/scenarios/about-clips.mjs); no Reddit figure on the page. Results are finishing ranks inside a season,
   *  never points across seasons; nothing says when to play a chip. Never "beats", "proven" or "guaranteed". */
  whyTitle: "About Forkcast",
  whySub: "Roll or transfer, A or B, who to bench, whether the \u22124 pays: Forkcast works it out for your squad, your bank and your free transfers, in points over the next four gameweeks.",
  whyStart: "Find my team",
  /** One a question (`clip`: static/m/clips/<clip>.webp, recorded on the real app), the most asked first. */
  whyApp: [
    { clip: "plans", ask: "Roll or make a transfer?", text: "Forkcast's best buy waits behind the player he would replace, scored vs rolling the transfer: the points it adds over the next four gameweeks. One tap takes the transfer, and the player you sold waits behind him to take back." },
    { clip: "replace", ask: "A or B? Who replaces him?", text: "Drag a player onto a gameweek and everyone who could come in for him is ranked, with the money your bank allows." },
    { clip: "rules", ask: "Keep your player, or rule one out?", text: "Tap the line above the pitch, then swipe a transfer left: Not the player it buys. It holds for that gameweek, goes into Your rules, and the plan is made again around it." },
    { clip: "bench", ask: "Who starts? Who's on the bench?", text: "Forkcast picks your XI, captain and bench order for every gameweek, the bench in the order FPL's auto-subs use." },
    { clip: "bringin", ask: "Take a \u22124 now, or wait a week?", text: "Name any player: see what bringing him in gains in each of the next four gameweeks, a \u22124 taken off in a week that costs one, and who Forkcast would sell to pay for him. Take the best week in one tap." },
    { clip: "player", ask: "Will he start? Is he worth it?", text: "Tap a player for his card: his team news, his last six matches with the cup and international games between them, his next seven forecasts, and the stats that best foretell his points, ranked against his position." }
  ],
  /** The seasons replayed (why.json records: the rank after each GW, on the solver's own tables). */
  /** How it works' folded row over the seasons replayed and the scouts' tables (sheets/about.js `proof`). */
  // (the scouts' tables open on this season's live one: owner, 2026-10-14)
  whyProof: "How it did: past seasons replayed, and this season against the scouts",
  whyRecordHead: "Replayed over whole seasons",
  whyRecordLead: "The planner run through a past season one deadline at a time, knowing only what was known then: every transfer, captain and bench its own. Its chips were played in weeks set beforehand.",
  whyPlace: (r) => `${fmt.ordinal(r.ranks.at(-1))} overall`,
  whyPlaceOf: (r) => `in ${COPY.seasonOf(r.season)}, replayed`,
  whyRankAxis: "Overall rank after each gameweek",
  whyRecordNote: (r) => `A replay, not a real entry: nobody played this team.${r.estimated ? " Its weekly ranks are estimated; the final one is from FPL's final table." : ""}${r.am ? ` It can't play the Assistant Manager chip, so +${r.am} is credited for it.` : ""} Forkcast's settings were tuned on these seasons, so they flatter it, and one season is partly luck.`,
  /** The same replays at 1-4 GWs (why.json horizons: each one's final rank). */
  whyHorizon: "The same replays planning one to four gameweeks at a time. Across both seasons four came out best, so Forkcast plans four; each season's best is in bold.",
  whyHorizonCols: ["Plans ahead", "Final rank"],
  whyHorizonRow: (w) => w === 1 ? "1 gameweek" : `${w} gameweeks`,
  /** The fresh-team benchmark (GET /api/m/scouts this season, why.json scouts the seasons replayed): every team's XI
   *  after FPL's auto-subs, net of its captain, the scouts named; no count of weeks won (owner, 2026-10-14). */
  whyScoutsHead: "Against the scouts",
  whyScoutsLead: "Every week Forkcast also picks a fresh fifteen, as the scouts do. Each team is scored the same way: its XI after FPL's auto-subs, without the captain's double.",
  whyScoutsLive: (s) => `${COPY.seasonOf(s.season)} so far, live: a real FPL team (ID ${s.entry}) built from Forkcast's fifteen before every deadline. Updated after every gameweek.`,
  whyScoutsReplay: (s) => `${COPY.seasonOf(s.season)}, replayed: Forkcast's fifteen each gameweek against every squad a scout posted.`,
  whyScoutsCols: ["", "GWs", "Forkcast", "Scout"],
  // the tuning caveat once, in the replays' note above it (owner, 2026-10-14)
  whyScoutsNote: "Scored on the gameweeks each scout posted a squad.",
  seasonOf: (s) => `${s}/${String(s + 1).slice(2)}`,
  whyHowHead: "How it works",
  /** [lead, rest]: only what holds through a retrain (owner, 2026-10-14); it learned from other competitions too
   *  (modules/leagues.py BUILD_LEAGUES: the club cups and Europe; national-team games are fetched but read by no model
   *  input); the pool (ml/configs/utils/paths.py PROD_PRED_DIRS) is checkpoint sets of different structure, a dozen or
   *  more seeds each, averaged. Nothing says Forkcast is free. */
  whyHow: [
    // (no model talk: owner, 2026-11-03, design_1103b "Place header + Help text": Podmajersky, Johnson)
    ["It forecasts every player.", "Each player's points for his next seven fixtures, learned from every Premier League season since 2009/10 and his cup and European matches, from match data, team news and prices, never ownership."],
    ["It plans four gameweeks at once.", "Transfers, XI, captain and bench are solved together within FPL's rules (your players' selling prices and your bank, three per club, free transfers banked, \u22124 hits), around any chip you play."],
    ["It's fresh before every deadline.", "The data is fetched and the forecast re-run every night and again before each deadline, ready 75 minutes before it for the late team news."]
  ],
  whyFacts: [
    ["No login.", "Type your team's name or ID: no account, no password."],
    ["It never touches your FPL team.", "You make the moves in the FPL app."],
    ["A forecast is a typical week, not a promise.", "A good plan still loses some weeks: judge it over a run of them."]
  ],
  whyLegal: "Not affiliated with the Premier League or FPL.",
  /** The noise's one name on screen (the solver's per-transfer charge at the anchor; `noise` stays the code's name),
   *  never "margin of error": the You sheet's Dev row, the Why sheet's sentences and run strip. */
  /** The Player sheet's stats key, first (api/stats_pick.json, tools/stats_pick.py; chosen by data, owner, 2026-10-14):
   *  `word` his position's plural ("midfielders"), `kinds` the kinds of points his rows foretell in his order
   *  (api/card.py _kinds, _rows), `his` false when he has too few minutes to be ranked (the position's order then). */
  chargeName: "Forkcast's charge for a transfer",
  charge: (noise) => `${COPY.chargeName} (${fmt.num(noise, 2)} pts)`,
  /** The player sheet's match-strip legend: the run ticks are the model runs' agreement, not the points he may score;
   *  `ticks` false (off a local page none are drawn) drops their clause. */
  barWidth: "Bar width = minutes.",
  runSpread: (ticks = true) => `${COPY.barWidth} Forecast = a typical week, not a ceiling${ticks ? "; its ticks show how far the forecasts agree" : ""}.`,
  /** An opponent's venue as every screen writes it (pitch.oppText): the player sheet's chart key and Player data's. */
  // in words too: a screen reader says "EVE" and "eve" alike
  oppCase: "capitals at home (EVE), lower case away (eve)",
  /** An own pick's side effects in its GW (ahead.sideEffects) and the hit it may take (the Replace rows). */
  replaces: (moves) => `replaces ${moves}`,
  adds: (moves) => `adds ${moves}`,
  hitsIn: (n) => n ? `${MINUS2}${HIT_COST * n}` : "no hit",
  afterHit: (n) => `after ${n > 1 ? `${WORDS[n] ?? n} hits (${MINUS2}${HIT_COST * n})` : `a ${MINUS2}${HIT_COST}`}`,
  /** A8: Replace's hit, said once over its list: the rows' numbers count it. */
  replaceHit: (gw, others = null) => `A buy here is an extra transfer in GW${gw}: its ${MINUS2}${HIT_COST} is counted in each number${others ? `, or Forkcast drops ${others} instead` : ""}.`,
  /** Replace's and Add a player's search that finds no one, the typed text quoted, and the way out (FPL's names are
   *  mostly surnames): "No midfielder called “Emile”. …". */
  noneCalled: (who, q) => `No ${who} called \u201C${q}\u201D. Try his surname as FPL writes it.`,
  /** The bank a Replace row spends from: GW A's is the bank now, a later GW's the one after the week before; with other
   *  transfers that week (`others`) the one after them. */
  bankNow: (money2, gw, A, others = false) => others ? `${money2} in the bank after GW${gw}'s other transfers` : gw === A ? `${money2} in the bank now` : `${money2} in the bank after GW${gw - 1}`,
  chipLess: (x, gw) => `${fmt.num(Math.max(0, x))} less than in GW${gw}`,
  /** A chip planned (its verdict toast, ahead.chipPlan): what was played, then what the week gives up against the
   *  chip's honest best (`less`, chipLess: "3.0 less than in GW8"), left out where unknown; no number "vs …" (owner,
   *  2026-10-27). */
  chipToast: (what, less = null) => [what, less].filter(Boolean).join(" \xB7 "),
  /** …when the planner's own count parts from the points (a rule is never called better by a count the planner
   *  disagrees with): the points, then why. way: 'better' | 'worse' by its count, 'no better' | 'no worse' with none
   *  (an estimate claims no count; a count inside the noise is changeLevel's). */
  changeAgainst: (what, delta, gws, reason, way, total = false) => `${what} \xB7 ${COPY.changeNum(delta, total)} \xB7 Forkcast rates it ${way}: ${reason}`,
  changeLevel: (what, delta, gws, reason, total = false) => `${what} \xB7 ${COPY.changeNum(delta, total)} \xB7 Forkcast rates them level: ${reason}`,
  /** A lineup change (a sub, the armband, a reset): its GWs' points (gw: one GW or a list), as a gain or a loss. */
  lineup: (what, gw, delta, label) => `${what}${[].concat(gw).length > 1 ? ` (${gwList([].concat(gw))})` : ""} \xB7 ${pts(delta)} pts`,
  /** …of one GW after GW A: the GW said with it ("Saka captain in GW8"). */
  inGw: (what, gw) => `${what} in GW${gw}`,
  /** Two subs swapped (ahead.sub): the bench order they make, [[name, n]] ("Bench order: Walle Egeli 1st, Murillo 3rd";
   *  n counts subs after the keeper). */
  benchOrder: (subs) => `Bench order: ${subs.map(([name, n]) => `${name} ${ORD(n)}`).join(", ")}`,
  /** A week's Roll rule (memory.pinRoll; owner, 2026-10-13: a suggested plan's + keeps that week exactly its choice):
   *  "GW8 roll", the Roll row's and plan row's words (planRoll), or with k moves of yours kept there "GW8 frozen"
   *  (owner, 2026-10-22: not "lock", the plan length's padlock and FPL's price lock). A noun, as named in a toast too
   *  ("Vuskovic in your plan · GW8 roll removed"). */
  // ("locked", the GW tile's lock: review 7, 2026-11-02, "frozen" read as jargon)
  rollRule: (gw, k = 0) => k ? `GW${gw} locked` : COPY.planRoll(gw),
  /** A Roll + in a week with nothing to take back (ahead.addPlan): the rule it made and what it does. */
  rollMade: (gw) => `${COPY.rollRule(gw)} in Your rules: no transfer in GW${gw} until you take one`,
  /** The retired Auto-plan segments (ahead.gwModes): "Off", "FT only", "Up to −4", "Up to −8" (the solver's own cap);
   *  one line each (owner, 2026-10-08). "FT only" still names a hits rule of 0 (freeOnly, gwNote, memory.ruleText). */
  segFreeOnly: "FT only",
  /** Settings → Hits (owner, 2026-10-12; ahead.hitsChoices): the hits Forkcast may take a week, every week, one
   *  setting: its heading, its segments ("None", "−4", "−8"), the line under it, its toast's subject and the rule it is
   *  (memory's derived 'hits' pin). */
  // ("a week" read as a duration, "Its … take no more" pointed two phrases back)
  hitsHead: "Most hits per GW",
  hitsSeg: (n) => n === 0 ? "None" : `${MINUS2}${HIT_COST * n}`,
  hitsNote: "Forkcast's suggestions and the transfers it adds stay within this.",
  hitsMax: (n) => n === 0 ? "Hits: none in any week" : `Hits: up to ${MINUS2}${HIT_COST * n} a week`,
  /** Settings → Plan ahead (owner, 2026-10-14): how many GWs Forkcast plans from the next deadline (planWeeks): its
   *  heading, segments, the line under it, and the one line why the locked options can't be picked (meta.locked). */
  aheadHead: "Plan ahead",
  aheadSeg: (n) => n === 1 ? "1 week" : `${n} weeks`,
  aheadNote: "The GWs after your plan show a lock at the top.",
  // Settings → Solver gap (owner, 2026-11-03): how close to the best the solver must prove its plan, this GW and later
  gapHead: (later) => later ? "Solver gap \xB7 later GWs" : "Solver gap \xB7 this GW",
  gapSeg: (g) => g > 0 ? `${+(g * 100).toFixed(2)}%` : "Exact",
  gapNote: "A looser gap plans faster; the plan may then be that much short of the best.",
  // Settings → Solve ahead (sheets/you.js aheadCtl)
  presolveHead: "Solve ahead",
  presolveSeg: (on) => on ? "On" : "Off",
  presolveNote: "On: what you are likely to tap next, and the next week, is planned before you tap, so it shows at once. Off: Forkcast plans only what you ask for.",
  aheadLocked: "Options with a lock aren't available on this Forkcast.",
  /** A GW past your plan, tapped on the GW switcher (ahead.js edgeTicks): how to plan it, or that its length is locked. */
  weekOff: (gw, n) => `Your plan covers ${COPY.aheadSeg(n)}. To plan GW${gw}, ${COPY.settingsDoor}, then ${COPY.aheadHead}.`,
  weekLocked: (gw) => `GW${gw} is past your plan, and longer plans aren't available on this Forkcast.`,
  hitsUpTo: (n, gw) => `Up to ${MINUS2}${HIT_COST * n} in GW${gw}`,
  defaultHits: (n, gw) => num2(n) === null ? `When hits pay in GW${gw}` : `Up to ${MINUS2}${HIT_COST * n} in GW${gw} (default)`,
  /** One name for a hits rule of 0, the retired Auto-plan segment's ("FT only"), on the chip toasts that take it off or
   *  bring it back (ahead.autoRuleName) and its rule chip and note (memory.ruleText). */
  freeOnly: (gw) => `${COPY.segFreeOnly} in GW${gw}`,
  /** A Wildcard or Free Hit week, said over its changes in the Week sheet (ahead.drawWeek; every transfer is free
   *  there). */
  chipWeek: (chip, gw, ftNext = null) => `${chipName(chip)} GW${gw}: ${chipWeekWhat(chip, gw, ftNext)}.`,
  /** A Free Hit or Wildcard week's moves as the squad they make, the week line's second line ("Wildcard +14.7" over "8
   *  changes"). */
  nChanges: (n) => plural(n, "change"),
  /** A GW tile's struck points, your team's as it is, without your transfers (owner, 2026-10-26): "~~60.0~~ 61.8 xP", a
   *  shop's was-price (ahead.renderRail, tickWas), spoken "60.0 points without your transfers". */
  tileWas: (pts2) => `${pts2} points without your transfers`,
  /** A bring-in's changes to a Wildcard or Free Hit week's squad, ending its moves line (ahead.inWords): "1 change to
   *  your Free Hit" (not the chip's own "12 transfers, no hit" count). */
  chipChanges: (chip, n) => `${plural(n, "change")} to your ${chipName(chip)}`,
  /** …and the rule a chip planned there takes off with it (its verdict toast): "Up to −4 in GW6 removed"; the chip
   *  taken off brings it back (ahead.chipOff): "Up to −4 in GW6 back". */
  chipRemoves: (rule) => `${rule} removed`,
  /** A chip planned in a week that played another, as a taken plan's toast names it (ahead.chipWords). */
  inPlaceOf: (what, chip) => `${what} in place of ${chip}`,
  chipBack: (rule) => `${rule} back`,
  /** A week's "FT only" rule described (memory.ruleOf, an older plan's per-week rule read back). */
  gwNote: { free: (gw) => `${COPY.segFreeOnly} in GW${gw}.` },
  /** …the same in a verdict (the edit's toast, a chip's line). */
  hitForbiddenShort: (f) => `the plan takes ${hitsWords(f.hits)} in GW${f.gw} ${f.allowed ? "Forkcast didn't plan for" : "your rules don't allow"}${f.cause === "relief" ? " (no plan without it)" : f.cause === "moved" ? ` (planned in ${gwsWords(f.from)}; FPL uses free transfers first)` : ""}`,
  /** The one button that brings him in, under the line naming its moves: Add a player's week; no name on the money
   *  toast's action, which names him already. */
  bringIn: (name, gw) => `Bring in ${name ? `${name} ` : ""}from GW${gw}`,
  /** A Wildcard or Free Hit week's bring-in (ahead.wishPin): him in that week's chip squad, the rest the solver's. */
  bringInChip: (name, gw, chip) => `Bring ${name} into your GW${gw} ${chipName(chip)}`,
  /** Add a player's title, and its footer link with "…". */
  bringInSheet: "Bring in a player",
  /** Its door at the week line's right end (ahead.js bringDoor). */
  bringInShort: "Bring in",
  /* its "…" a "›" (m-ahead.css .ah-door::after; "…" only a cut word) */
  /** The week line's Chips… door and sheet (ahead.chipsDoor, sheets/chips.js): title, spoken label, the line under the
   *  title (each number's span; the baseline is each row's own: chipNoChip), and each row's name and one fact
   *  (chipStates). */
  chipsDoor: "Chips",
  /* as Bring in's: "›" drawn, FPL's own word */
  chipsIn: (gw) => `Chips in GW${gw}`,
  chipsSaid: (gw, chip = null) => chip ? `Chips in GW${gw}, ${chipName(chip)} planned` : `Chips in GW${gw}`,
  chipsSub: (gws) => `Points over ${span(gws)}`,
  /** A Chips… row's baseline, in its fact (owner, 2026-10-22: "vs rolling everywhere"): a Wildcard's or Free Hit's its
   *  own (`vs`: rolling), a Bench Boost's or Triple Captain's not playing it (they change no transfer: vs rolling would
   *  fold the week's transfers into it), a swap row's the chip it replaces ("vs it"). */
  chipNoChip: "not playing it",
  // a row whose chip replaces the week's: its number is against that chip
  chipOn: (c) => `${chipName(c)} \u2713`,
  chipByForkcast: "By Forkcast \xB7 Take it off",
  chipMoveHere: (gw) => `In GW${gw} \xB7 Move it here`,
  chipInstead: (c) => `Instead of ${chipName(c)}`,
  chipVsIt: "it",
  chipBestHere: "Its best week",
  /** …another week's: its number where known (for a Wildcard or Free Hit the pitch's choice that week, `vs` its
   *  baseline), none while that choice is checked. */
  chipBestAt: (gw, delta = null, vs = null) => `Best week: GW${gw}${delta != null ? `\xA0${fmt.signed(delta)}${vs ? ` ${COPY.chipVs(vs)}` : ""}` : ""}`,
  /** A row's baseline in its fact: "vs rolling", "vs not playing it" (chipNoChip), "vs it" (chipVsIt). */
  chipVs: (vs) => `vs ${vs}`,
  /** The weeks of its half after the plan's last, never looked at, said with a clear best week too (owner, 2026-10-22). */
  chipAfter: (after) => `weeks after GW${after} aren't planned`,
  /** A row's fact and what follows it, joined once (sheets/chips.js factOf). */
  chipFact: (...parts) => parts.filter(Boolean).join(" \xB7 "),
  /** A Wildcard or Free Hit choice's Why sheet: the chip it spends and when the next one comes (the second half's first
   *  GW: ahead.halfEnd); "Uses your last Free Hit" in the second half. */
  chipUses: (chip, next = null) => next != null ? `Uses your ${chip}; next one GW${next}` : `Uses your last ${chip}`,
  /** …while its weeks are checked (ahead.chipWait): Add a player's count (planningWeek), its clock after it; no "Best
   *  week" while a week of the span was never asked (`part`; owner, 2026-10-28). */
  chipBestPlanning: (gw, i, n, part = false) => part ? COPY.planningWeek(gw, i, n) : `Best week \xB7 ${COPY.planningWeek(gw, i, n)}`,
  /** …when the best week doesn't beat the runner-up (`next`, its gain `runner`; none in: not playing it) by more than a
   *  toss-up (engine.verdictLabel's 'coin'), and the weeks of its half after the plan's last (`after`) never looked at.
   *  The noise itself is Dev mode's: the words say the toss-up, never its points. */
  chipNoBestName: "No clear best week",
  /* `bare`: the weeks without their gains (a Wildcard's or Free Hit's row, whose number is vs rolling: those gains are
   *  the pre-solves' against not playing it, which pick its best week). */
  chipNoBest: ({ gw, delta, next, runner }, after = null, bare = false) => `${COPY.chipNoBestName}: GW${gw}${bare ? "" : `\xA0${fmt.signed(delta)}`} ${next == null ? "is too close to not playing it" : `and GW${next}${bare ? "" : `\xA0${fmt.signed(runner)}`} are too close to call`}${after != null ? `. ${COPY.chipAfter(after).replace(/^w/, "W")}` : ""}`,
  chipNoGain: "No week gains",
  chipPlayed: (gw, back = null) => `Played${gw != null ? ` GW${gw}` : ""}${back != null ? ` \xB7 back GW${back}` : ""}`,
  /** Chips…'s row of a chip you played in that week. */
  chipTakeOff: "Take it off",
  /** …and its wait, verb first (COPY.waitWord, every solve's): Add a
   *  player's "Planning GW7 · 2 of 4 weeks" (week in flight, its place among the weeks needing a solve), clock after it
   *  (ahead.clockText); the Week sheet's suggested plans, "Planning GW8 · 3 of 9 plans" (`of` 'plan'); the week line's
   *  second line the same, "Planning GW8 · 3 of 9" where it doesn't fit (`of` null), "Planning · 3 of 9" where that
   *  doesn't either (`gw` null). */
  planningWeek: (gw, i, n, of = "week") => `${COPY.waitWord}${gw != null ? ` GW${gw}` : ""} \xB7 ${i} of ${of ? plural(n, of) : n}`,
  /** Add a player's line when no week works, as its pills say: every check failed (each "offline": no connection),
   *  every week not possible, else each pill's own reason. */
  weeksUnplanned: (offline) => `Couldn't plan the weeks${offline ? ": no connection" : ""}. Try again in a minute.`,
  noWeekPossible: (gws) => `No plan brings him in during ${span(gws)}.`,
  noWeekWorks: "No week works: each week above says why.",
  /** FPL's club limit by its own number (engine.MAX_PER_CLUB) and the way out. */
  club: (count, club, gw) => `GW${gw} would have ${count} ${club} players; FPL allows ${MAX_PER_CLUB}. Sell one of them first.`,
  /** …as a list row or week pill says it: "3 from ARS". */
  clubFull: (club) => `${MAX_PER_CLUB} from ${club}`,
  /** No plan has it, with "Your plan is unchanged." after it. */
  noPlan: (gw) => `No plan fits that from GW${gw}.`,
  unchanged: "Your plan is unchanged.",
  infeasible: (gw) => `${COPY.noPlan(gw)} ${COPY.unchanged}`,
  /** A heal that can't keep every rule: the rules stay, the plan is the last one that worked. The choice named as its
   *  row says it (ahead.rowName: "Scott → Groß · GW6"); "rule" only for what Your rules lists. */
  rulesClash: (stuck, what, why = null) => `No plan keeps ${stuck ?? "all your choices"}${what ? ` with \u201C${what}\u201D` : ""}${why ? `: ${why}` : ""}. Your plan is unchanged. Remove one, or Undo.`,
  /** …for an edit that adds no rule (a removal, Reset plan, "Without …"): its own words, then what the rules left can't
   *  keep, as the solver said it (ahead.clashParts): "Calafiori → Hill removed: no plan keeps your GW9 choices (Leno →
   *  Raya and João Pedro → Evanilson). Your plan is unchanged. Remove one, or Undo." */
  dropClash: (said, stuck, why = null) => `${said ? `${said}: no` : "No"} plan keeps ${stuck ?? "your other choices"}${why ? `; ${why}` : ""}. Your plan is unchanged. Remove one, or Undo.`,
  /** The week the solver found no plan for and your choices there: "your GW9 choices (Leno → Raya and João Pedro →
   *  Evanilson)". */
  choicesAt: (gw, names) => `your GW${gw} choices (${andList(names)})`,
  /** The Week sheet's status row (its first words the week line's second line) while that failure stands
   *  (ahead.clashLine): what the solve couldn't keep ("Groß in GW6", else all of these) with the choice that broke it
   *  ("Keep Scott · GW6"). Its Removes are on the row; the toast's Undo is gone by then, so the row never offers it. */
  rulesStuck: (what, by, why = null) => `No plan keeps ${what ?? "all of these"}${by ? ` with ${by}` : ""}${why ? `: ${why}` : ""}. Remove one.`,
  /** Why the week the solver found no plan for has none (api/mobile.py _road_error's `why`: rolling._why_unsolvable,
   *  `short` in £0.1m): "they need 4 transfers in GW9, where 3 are allowed", "they need £0.4m more than you have", or
   *  both; null when nothing lifts it. */
  clashWhy: (why, gw) => {
    const xf = why?.transfers != null ? `${why.transfers} transfers in GW${gw}, where ${why.allowed} are allowed` : null;
    const money2 = why?.short ? `${fmt.money(why.short / 10)} more than you have` : null;
    return xf || money2 ? `they need ${xf && money2 ? `${xf}, and ${money2}` : xf || money2}` : null;
  },
  unfinished: "Forkcast couldn't finish planning that. Your plan is unchanged.",
  pinClash: (name, keepTo, sellGw) => `Keeping ${name} through GW${keepTo} clashes with selling him in GW${sellGw}. Which one?`,
  /** The journal's notes of a forecast update you kept your plan over (memory writes them). */
  kept: "New forecast: no change worth making",
  keptLocked: (gw) => `The new forecast changes GW${gw}, which is locked in. Your plan stays`,
  keptOver: "Kept your plan after a forecast update",
  /** What a new forecast changed in the suggested plan (memory.forecastChange), the week line's second line and a Week
   *  sheet row: GW A's moves in words, then the later weeks' count ("New forecast: GW6 Scott → Le Fée (was Groß) · 2
   *  changes in GW7–9"). */
  newForecast: (A, gwA, later, held = false) => `New forecast${held ? ", best plan" : ""}: ${[gwA ? `GW${A} ${gwA}` : null, later].filter(Boolean).join(" \xB7 ")}`,
  /** What a choice takes back of your rules (ahead.takenBack: an alternative, Roll), named as their chips say them
   *  (ruleOf), on the line and in the sheet that asks first alike; taken back = the plan no longer keeps them. */
  altClash: (words) => `${words.join(", ")} removed`,
  removedRules: (n) => `Removed ${n} rule${n === 1 ? "" : "s"}`,
  /** A later week's bank below 0 at FPL's prices (a sale FPL pays £0.1m less for than the solver's data): drift, not an
   *  overspend (the solver keeps every week in budget at its prices); its amount and when it is checked again, never a
   *  bare "≈ price drift". */
  priceDrift: (bank, gw) => `${fmt.money(bank)} at FPL's sale prices \xB7 checked again before GW${gw}`,
  /** The price watch (priceWatch): a player's predicted change in a move's line, in FPL's words (priceSaid: "▲ Groß
   *  very likely to rise tonight (+£0.1m to buy)"); what a "very likely" does to the money (half-profit rule on a
   *  sale), or "not counted" without the entry's stepped sale price. A "likely" is never counted and says so ("▲ Groß
   *  may rise tonight (FPL: likely)"): one bracket, never "(FPL: likely) (not counted)". */
  watchPart: (p, when) => `${p.dir > 0 ? "\u25B2" : "\u25BC"} ${p.name} ${priceSaid(p, when)}${!p.sure ? "" : ` (${!p.counted ? "not counted" : p.role === "buy" ? `${signedMoney(p.step)} to buy` : p.step === 0 ? `sale stays ${fmt.money(p.sale)}` : `sale ${signedMoney(p.step)}`})`}`,
  /** …the first night waiting costs: a move it puts out of reach (this GW's or a later one's) is the call to act before
   *  it (its UK time and the viewer's), in short sentences; money only is a fact, not a call. */
  watchAct: (x) => {
    const lead = `${x.before ? `Waiting past ${x.before} costs nothing. ` : ""}`;
    const make = `${lead}Make ${x.n > 1 ? "these transfers" : "it"} before ${x.ref} (${x.clock}). Waiting costs ${fmt.money(x.w)} and`;
    if (x.verdict === "thisMove") return `${make} leaves you ${fmt.money(x.short)} short. ${x.buys} would be out of reach.`;
    if (x.verdict === "laterMove") return `${make} GW${x.gw}'s ${x.later} would be ${fmt.money(x.short)} short.`;
    return `${lead}Waiting past ${x.ref} costs ${fmt.money(x.w)}${x.allOk ? "; your moves still fit" : ""}.`;
  },
  /** …the same verdict in one short line, for the week line's second line (ahead.renderLine): the call to act, what
   *  waiting costs, or what it gains. */
  watchShort: (x) => x.verdict === "thisMove" || x.verdict === "laterMove" ? `Make ${x.n > 1 ? "them" : "it"} before ${x.ref}` : x.w > EPS2 ? `${x.ref[0].toUpperCase()}${x.ref.slice(1)} costs ${fmt.money(x.w)}` : `No rush: waiting gains ${fmt.money(-x.w)}`,
  /** …no night costs: waiting gains money (a sale that rises, a buy that drops), or changes nothing a move costs. */
  watchGain: (w, ref) => `No rush: waiting past ${ref} gains ${fmt.money(w)}.`,
  watchFree: (n) => `No cost to wait: the price changes leave ${n > 1 ? "these transfers" : "this transfer"} as it is.`,
  /** …how old FPL's reading is, the line's quiet tail: FPL refreshes it about every 15 minutes, the server reads it
   *  every 30, every 10 in the 3 h before a change (the bundle's prices block and meta.prices_as_of, else the
   *  snapshot's); "early" when read 8 h or more before the change. */
  watchNote: (asOf, old) => `as of ${asOf}${old ? ", early" : ""}`,
  /** …put away until its verdict changes, and the morning after its night (priceMorning): what the night did to the
   *  counted players' prices and GW A's bank. The button says what it does, "Hide" (its spoken label's verb). */
  watchWait: "Hide",
  /** Add a player's row for one of week g's squad (sheets/wish.js): "In your team" when he is in your FPL team now,
   *  else only the plan buys him by then. */
  inYours: (inTeam, gw) => inTeam ? "In your team" : `In your GW${gw} plan`,
  /** GW A's countdown as VoiceOver says it (ahead.deadlineInfo's `said`): its two largest parts in words, the visible
   *  text unchanged. */
  leftSaid: (d, hr, m, s) => `${d ? `${plural(d, "day")} ${plural(hr, "hour")}` : hr ? `${plural(hr, "hour")} ${plural(m, "minute")}` : `${plural(m, "minute")} ${plural(s, "second")}`} left`,
  watchWaitSaid: "Hide the price watch until it changes",
  watchMorning: (moved, gw, bank) => !moved.length ? "Prices held overnight" : `${andList(moved.map((x, i) => `${x.name} ${x.t > 0 ? "rose" : "dropped"}${i ? "" : " overnight"} (${signedMoney(x.t)})`))}${bank == null ? "" : bank < -EPS2 ? `: ${fmt.money(-bank)} short now` : `: your GW${gw} moves still fit`}`,
  /** An older plan's frozen week as plan memory still reads one (Freeze is gone: normalizeAccepted thaws them, so it is
   *  never said). */
  frozenEdit: (gw, at = null) => `GW${gw} is frozen${at ? ` (${at})` : ""}.`,
  /** You → Reset plan (ahead.resetPlan): the toast, with Undo. */
  planReset: "Plan reset: your team as it is, no rules or transfers of yours.",
  /** The pitch's Reset plan pill, as VoiceOver names it: what ahead.resetPlan resets (memory.reset: your document as a
   *  new team's, Settings → Hits with it; this browser's later lineups). */
  resetAll: "Reset all weeks",
  planResetSaid: "Reset all weeks: take off every transfer, chip, rule and lineup of yours, and set Hits back to its default",
  /** The pitch's one Reset where your viewed GW's lineup and your plan both have something to take back (owner,
   *  2026-10-29: top-left corner): its words "Reset ⌄", as VoiceOver names it, and its choice sheet, each row what it
   *  takes back (planResetSaid's words for the plan). */
  resetSaid: (g) => `Reset: your GW${g} lineup or your whole plan`,
  resetTitle: "Reset",
  resetLineupName: (g) => `Reset GW${g} lineup`,
  resetLineupWhat: (g) => `The plan's best lineup in GW${g} again; your transfers stay`,
  resetPlanWhat: "Every transfer, chip, rule and lineup of yours off; Hits back to its default",
  /** Back after FORGET_MS away: signed out, its choices gone (app.js signOut away). */
  awaySignedOut: (name) => `Signed out of ${name} after ${AWAY} away; its choices are cleared.`,
  /** The suggested plans' label, once (the Week sheet's plans heading and the pitch's hidden choices heading; `lead`
   *  plansHead; uppercase by CSS): rows come best first once none still checks, said by no tag; the weeks its numbers
   *  count (gws: valuedOver), "Suggested plans · GW8–9"; then what they count against, `vsPlan` planVs's words ("· vs
   *  no transfers", "· vs your plan"; true / false say "your plan" / "rolling"). Closed: "Suggested plans" alone
   *  (owner, 2026-10-13). */
  // (`short`: fewer weeks than the plan's window, said so, "GW12–13 only": review 7, 2026-11-02, a GW12 +1.3 next to a
  // GW10 +1.2 counts fewer weeks)
  suggested: (gws = null, vsPlan = null, lead = "Suggested", short = false) => `${lead}${gws?.length ? ` \xB7 ${COPY.valuedOver(gws)}${short ? " only" : ""}` : ""}${vsPlan === null ? "" : ` \xB7 vs ${typeof vsPlan === "string" ? vsPlan : vsPlan ? "your plan" : "rolling"}`}`,
  /** The suggested plans (owner, 2026-10-11): each week's choices (ahead.plansOf) under "Suggested plans", ranked by
   *  their numbers, each against rolling (the Roll row, no number); a row is the week's own moves alone ("GW7 Kayode →
   *  Vuskovic", none: "GW7 roll"; the + takes this week only: planTake) and its number; on the pitch, a place's "⋯ N
   *  more" (placeMore) for the choices it has no room for. A choice whose solve failed keeps its row, no number, with
   *  why (planFailed; a solve that found no plan keeping your rules says so, not "couldn't plan"). */
  plansHead: "Suggested plans",
  planRoll: (g) => g == null ? "Roll" : `GW${g} roll`,
  /** A plan row's + and its Why sheet's button: "Take GW7 Scott → Dewsbury-Hall" (its week alone: ahead.planTake). */
  planTake: (head) => `Take ${head}`,
  /** …its toast's action before Undo (ahead.addPlan, every way a choice is taken; owner, 2026-10-21): the transfer's
   *  Why sheet, as a tap on his IN card opens it. */
  whyAct: "Why",
  /** In a week with transfers of yours a plan row draws only what it adds, then what its + takes back of yours: "GW7
   *  Scott → Dewsbury-Hall instead of Scott → Xhaka", "GW7 roll instead of Scott → Xhaka"; one that only drops some,
   *  "GW7 without Saka → Palmer". */
  planInsteadOf: (moves) => `instead of ${moves}`,
  planWithout: (moves) => `without ${moves}`,
  /** Why a plan's moves go together, read off its solved road (ahead.openPlanWhy): "Neto's sale makes room: Palmer is
   *  your 3rd CHE player". */
  planRoom: (sold, buy, n, club) => `${sold}'s sale makes room: ${buy} is your ${fmt.ordinal(n)} ${club} player`,
  planFailed: (why) => ({ offline: "can't plan it offline", nofit: "Forkcast found no plan that keeps your other weeks", infeasible: "no plan keeps your rules with it" })[why] ?? "Forkcast couldn't plan it, trying again soon",
  /** A choice whose solve failed, under its card in a player's place (the Week sheet's row says planFailed in full). */
  planFailedShort: (why) => ({ offline: "offline", nofit: "no plan fits", infeasible: "breaks your rules" })[why] ?? "couldn't plan",
  /** The card behind (ahead.renderDecks; owner, 2026-10-20): a pair's second tab, a player's place (its stack's label,
   *  header, notes, bar), the week's Roll locked beside the goal. A choice of several moves lit on several tabs: each
   *  tab its part mark, "1/3" (the main), "2/3", "3/3" (owner, 2026-10-22), read "part 2 of a 3-transfer plan, +5.8
   *  points vs rolling", never as that one player's sale. */
  placeOf: (name) => `Replace ${name}`,
  /** The marks on the pitch (ahead.renderDecks; owner, 2026-10-23; forkcast/studies/design_marks/DECISION.md): a take's words,
   *  "Swap", "Swap both", "Swap all 3", spoken by a place's card ("Swap both: …", swapSaid; the pitch's plates take
   *  nothing: owner, 2026-10-25); a move said "Kayode out, Truffert in"; the best plate's label, "Best this week: …"; a
   *  plan's tag in another row, never its number twice; a place's first choice's plate where nothing there beats
   *  rolling, or your plan in a week of yours (placeNoneSaid's `vs`). */
  swapGo: (n) => n > 2 ? `Swap all ${n}` : n === 2 ? "Swap both" : "Swap",
  /** A plan's plate over its sellers in one row, the buys of its sellers in other rows counted (owner, 2026-10-25):
   *  "Rice & 2 more +5.0 xP Swap all 3"; each of those keeps his ring and his tag. */
  planMore: (n) => `& ${n} more`,
  swapSaid: (pairs, num3 = null) => `${COPY.swapGo(pairs.length)}: ${pairs.map(([o, i]) => `${o} for ${i}`).join(", ")}${num3 ? `, ${num3}` : ""}`,
  moveSaid: (out, inn) => `${out} out, ${inn} in`,
  // (`move`: the best move beside a chip's token, the week's best: never two "Best this week"; owner, 2026-10-25)
  bestSaid: (moves, num3, move = false) => `Best ${move ? "move " : ""}this week: ${moves.length > 1 ? `${moves.length} transfers, ${num3}: ${moves.join("; ")}` : `${moves[0]}, ${num3}`}`,
  partSaid: (mine, others, move = false) => `Part of the best ${move ? "move " : ""}this week: ${mine}${others.length ? `, with ${others.join("; ")}` : ""}`,
  placeNoneSaid: (name, n, vs = null) => `${name}: ${plural(n, "choice")} for his place, none better than ${vs ?? "rolling"}. Shows ${n === 1 ? "it" : "them"}`,
  placeSwap: "Swap",
  /** A take's one word wherever it is drawn (owner, 2026-10-28): "Swap" ("Swap both", "Swap all 3") for its transfers,
   *  "Roll" for a Roll, "Take" for a chip alone; on the place's header and line, the best move's ink token, the Week
   *  sheet's row and the Why sheet's button. */
  takeWord: (n, chip = false) => n ? COPY.swapGo(n) : chip ? "Take" : "Roll",
  /** The week's best move as a token beside the goal, first in its stack (ahead.tokensOf; owner, 2026-10-26):
   *  "Evanilson +1.6", said "Best move this week: …, shows his choices". */
  showsChoices: "shows his choices",
  /** Who a take's re-picked lineup benches (ahead lineupMoved). */
  toBench: (names) => `${names.join(", ")} to bench`,
  /** The header's total's change after an edit, named apart from a week's "vs rolling" (renderTotal). */
  totalChange: "total",
  /** …a chip's token while the Why sheet is hidden (ahead WHY_SHEET): it opens the Week sheet, its row's + plays it. */
  showsWeek: "shows the week's plans",
  /** The week's runner-up token's name (ahead.js tokensOf; the owner, 2026-10-29), as bestSaid says the best's. */
  nextSaid: (moves, num3) => `Next best this week: ${moves.length > 1 ? `${moves.length} transfers, ${num3}: ${moves.join("; ")}` : `${moves[0]}, ${num3}`}`,
  /** …a multi-move best's plate: it opens that plan's Why sheet, whose one button takes it. */
  showsWhy: "Shows why",
  /** The best token's spoken name where its tap takes (ahead.tokensOf): its visible verb first. */
  bestSwapSaid: (said) => `Swap. ${said}`,
  /** His card's chip spoken (priceProgress): "Predicted progress +26.4%". */
  progressSaid: (text) => `Predicted progress ${text}`,
  /** The £↓ beside it, where a drop takes your sale down as well, and it spoken, step in tenths: "sale −£0.1m". */
  saleDrops: "\xA3\u2193",
  saleSaid: (step) => `sale ${signedMoney(step)}`,
  /** A buy of yours's plate (ahead.swapPlate; owner, 2026-10-26): the player you sold, said "Keep Gabriel, not Justin,
   *  +0.8 points vs your plan". */
  keepSoldSaid: (sold, buy) => `Keep ${sold}, not ${buy}`,
  /** The ✕ on the best move's token (ahead.js renderDecks; owner, 2026-11-02): its buy refused in this week alone. */
  notBuySaid: (buy, g) => `Not ${buy} in GW${g}: the next best move`,
  /** A pair card's note, its other moves (ahead.noteOf): "also Semenyo → Palmer, Cunha → Rice". */
  placeAlso: (moves) => `also ${moves.join(", ")}`,
  placeChoices: (n) => `${plural(n, "choice")} for his place \u203A`,
  placeInstead: "What could go there instead",
  // a row to his place, its › drawn (.m-nav)
  placeSaid: (name, n, best) => `${name}: ${plural(n, "choice")} for his place${best ? `, best ${best}` : ""}. Shows them`,
  placeNow: "Now",
  placeYours: "Yours",
  placeRemove: "Remove",
  placeKeep: "Keep",
  /** The veto on the card of a player you don't have (sheets/player.js ruledSeg), "Not", as the rule chip ("Not Groß ·
   *  GW8") and the swipe say it. */
  placeKeepSaid: (name, g) => `Keep ${name} in GW${g}: no transfer sells him`,
  // a card's corner marks (ahead renderDecks: cardMarks): × his place, the lock a GW Keep of him (owner, 2026-11-02)
  cardOutSaid: (name, g) => `Replace ${name} in GW${g}: his choices`,
  cardNoBuy: (name, g) => `No buy fits ${name}'s money in GW${g}`,
  cardLockSaid: (name, g, on) => on ? `${name} kept in GW${g}. Unlock` : `Lock ${name} in GW${g}: no transfer sells him`,
  /** A Keep that leaves your plan as it is (ahead.keep), from his place or his card's Force keep, whichever Keep of his
   *  it remakes: what it changed, the suggestions. */
  keptFromChoices: (name, when) => `${name} kept${when}: suggestions won't sell him`,
  keepIn: (name, g) => `Keep ${name} in GW${g}`,
  placeRemoveSaid: (out, inn) => `Remove ${out} to ${inn} from your plan`,
  placeCantPlan: "can't plan",
  /** A move of a pair the week can't make alone (ahead.plansOf `needs`): the pair's sales that make it fit, "needs
   *  Kayode's sale" (its card's note in his place; its Week sheet row and spoken line after what it lacks alone,
   *  ahead.problemShort's "£1.2m short"). */
  needsSale: (names) => `needs ${andList(names.map((n) => `${n}'s`))} ${names.length > 1 ? "sales" : "sale"}`,
  placeNth: (n) => `a ${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 > 3 ? 0 : n % 10]} transfer`,
  placeMore: (n) => `${n} more \u203A`,
  // "⋯" is a row's menu (Bring in's, his card); a next page reads as the bar's ›
  /** A place's last slot (ahead.drawPlace; owner, 2026-10-27): Bring in… at his position, for a player its cards don't
   *  offer. */
  placeOther: "Bring in\u2026",
  placeOtherSaid: (name, gw) => `Other players for ${name}'s place: Bring in\u2026 in GW${gw}`,
  placeAll: (n) => `All ${n} choices`,
  placeAt: (i, n) => `${i} of ${n}`,
  /** …its bar's second line: what its numbers are, "Gain vs rolling · GW8–11" (owner, 2026-10-22); while what they
   *  count against is still checked (ahead.plansVs null), its weeks alone. */
  placeNumbers: (vs, gws) => `${vs ? `Gain vs ${vs} \xB7 ` : ""}${span(gws)}`,
  /** Your Roll, the week's status beside the goal (ahead.emptyHead, statusTok), alone: no "until you take a move" under
   *  it (owner, 2026-10-26). */
  rollingOn: "Rolling \u2713",
  /** The week's status beside the goal (ahead.statusTok; owner, 2026-10-26): its words, then where its tap goes,
   *  "Rolling; opens GW9 transfers". */
  statusSaid: (said, g) => `${said}; opens ${COPY.weekTitle(g)}`,
  /** The Roll row's Why sheet in a week you roll: nothing to take, so no Take there (owner, 2026-10-22: "+" only where
   *  it would change something). */
  rollAlready: (g) => `Your plan makes no transfer in GW${g} already`,
  /** A roll's Why sheet: the free transfers rolling leads to, "4 FT in GW9" (rollKeeps), at FPL's cap (engine.nextFt
   *  adds none) that it adds none. */
  rollCapped: (ft, gw) => `${ft} FT already, the most: rolling adds none in GW${gw}`,
  /** A move's Why sheet: the next GW's free transfers in the plan you have, then without the move (ahead.whyFacts):
   *  "GW9: 3 FT, not 4". */
  /** …the sub of a move's Why sheet in a week of two or more transfers, which has no number of its own (owner,
   *  2026-10-22: no row numbers). */
  whyOneOf: (gw, n) => `GW${gw} \xB7 one of ${n} transfers: the week's number is on its line`,
  ftWithout: (gw, ft, without, n = 1) => `GW${gw}: ${ft} FT (${without} without ${n > 1 ? `these ${n} transfers` : "this transfer"})`,
  /** …on the pitch the week's status beside the goal (ahead.emptyHead, statusTok), its Week sheet row with no + either. */
  noTransferMade: "No transfer made",
  /** The strip's answer, in every week you can change (owner, 2026-11-05, design_1105b A, "like save more"): Forkcast's move
   *  under its title, a week it saves, or your moves with nothing to add. */
  answerMove: "Make this transfer",
  /** The suggestion card's green button, at its right: FPL's word for the act, the one the card, its header and its
   *  take-back say ("Swap" beside "1 transfer made" and "Save your free transfer"; card audit 2026-11-10). */
  swap: "Transfer",
  showAnother: "Show another",
  showATransfer: "Show a transfer",
  /** The card's take-backs, each saying what it takes back (owner, 2026-11-05, "fix undo / reset buttions signs and theier
   *  meaning and wording"): this week's transfers, or the card before your Show another. */
  undoSwaps: (n) => n === 1 ? "Undo transfer" : `Undo ${n} transfers`,
  previous: "Previous",
  undoLast: "Undo",
  seeChanges: "See the changes",
  onToWeek: (g) => `On to GW${g}`,
  showSuggestion: "Show suggestion",
  /** The card's one number's words, at its left (owner, 2026-11-09, design_1109a slip): the move's points over the weeks
   *  shown against `vs`, what it counts against (card audit 2026-11-10: "vs saving it for later" named no "it", and on a
   *  pay-back saving was no choice): vsSaving where a free transfer is left to save, else planVs's. */
  vsNext: (n, vs) => `${n === 1 ? "Next week" : `Next ${n} weeks`}, vs ${vs}`,
  vsSaving: "saving a free transfer",
  /** The week card's Bring in: one of its two buttons, or its links row's door where both are taken (screen-ticket.js). */
  bringInPlayer: "Bring in a player",
  offForNow: "(off for now)",
  /** The card while the pitch asks who he replaces (design_1109a slip): "B.Fernandes → ?", the ask under it. */
  bringWho: (name) => `${name} \u2192 ?`,
  bringTap: "Tap the player he replaces",
  bringCancel: "Cancel",
  /** A place on the pitch the card's swap would change, said. */
  boardSaid: (name, out) => `${name} would come in for ${out}`,
  boardBench: (name) => `${name} would go to the bench`,
  playAChip: "Play a chip",
  yourFplTeam: "Your FPL team:",
  answerSave: (ft) => ft > 1 ? "Save your free transfers" : "Save your free transfer",
  answerDone: "Nothing more to do this week",
  /** The band's number's scope and its toss-up (ahead tokensOf; owner, 2026-11-03, design_1103b): "· 4 GW", "Close call". */
  overGws: (n) => `\xB7 ${n} GW`,
  closeCall: "Close call",
  /** A lineup of yours that leaves a suggested buy on your bench (the buy takes the slot of the player he replaces:
   *  ahead.asTaken), said in the lineup edit's toast and in his place's bar: "Palmer would start on your bench". */
  onYourBench: (names) => `${andList(names)} would start on your bench`,
  /** …and a Wildcard or Free Hit it lowers or takes off the pitch (its squad played in your lineup's places). */
  chipLineup: (chip, g) => `${chip} counted with your GW${g} lineup`,
  /** What a plan counts against, said on its heading, row and Why sheet ("· vs no transfers": your team as it is, every
   *  week rolled; "· vs your plan" once your plan has a transfer in any week), and its Why sheet's two sides. */
  planVs: (mine = false) => mine ? "your plan" : "no transfers",
  /** The ?solves=1 panel's words for your plan's solve with nothing of yours added (memory/live-heal.js runHeal). */
  healNone: "no transfers added",
  /** Under the hold a plan counts against rolling (ahead.plansOf; owner, 2026-10-19: "Gain over rolling"): its row,
   *  heading and Why sheet say so; the Roll row is what they count against (spoken, no number); a +'s toast says no
   *  number (owner, 2026-10-27), nor a × that rolls the week again; what your total moves by is the header's change,
   *  and the Why sheet says it where that differs (planAdds, totalMoved). */
  planVsRoll: "rolling",
  planRefSaid: "what the plans count against",
  planAdds: (delta) => `Your total: ${pts(delta)} when you take it`,
  /** A taken move's Why sheet, under its number vs rolling where your total moved by another amount: what that total
   *  counts it against, in the plans' words (planVs: "no transfers", "your plan"). One line: the take's toast says the
   *  number alone. */
  totalMoved: (delta, mine = false) => `Your total moved ${pts(delta)}: vs ${mine ? "your plan without it" : COPY.planVs(false)}, not vs rolling`,
  /** A choice's Why sheet, what its number counts after its week (ahead.countedAfter): its head, the roll's plan named,
   *  and a plan's line, "Rolling: GW9 Saka → Palmer · GW11 Rice → Wirtz", one that makes no later move "no transfers". */
  countedAfter: (g) => `Counted after GW${g}`,
  countedRoll: "Rolling",
  countedLine: (name, weeks) => `${name}: ${weeks.length ? weeks.join(" \xB7 ") : "no transfers"}`,
  /** A Wildcard or Free Hit choice's Why sheet, its changes (ahead.squadChanges): a player a Keep of yours holds in its
   *  squad. */
  keptRule: "kept: your rule",
  /** A plan row's + in your Wildcard or Free Hit week whose choice plays none: the chip off. */
  chipTakenOff: (chip, gw) => `${chip} in GW${gw} taken off`,
  /** The week line's words (ahead.renderLine; owner, 2026-10-19: one line above the pitch, your transfers on it as IN
   *  cards): how many more notices than the one it shows; GW A under way (the head every live sentence starts with);
   *  your week's transfers, "1 transfer" over "Out: Saka"; its sheet's title, "GW8 transfers". */
  moreNotices: (n) => ` \xB7 +${n}`,
  /** GW A's lineup on the pitch where it differs from the one set in FPL (ahead.fplSets): the week line's notice names
   *  whom to start (setsSaid); its Week sheet row says only what is true (FPL's team is the last deadline's): the GW
   *  that team is for, what it did and each change that makes this pitch, a step a line (setsRow): "Your FPL team for
   *  GW7 benched Justin and Barry. To match this pitch in FPL:" over "Start Justin for Gvardiol", "Captain: Saka"; the
   *  week line its one change, else how many ("Set in FPL: 3 changes"). */
  setInFpl: (sets) => {
    const n = setsRow(sets)[1].length;
    return `Set in FPL: ${n > 1 ? COPY.nChanges(n) : setsSaid(sets)}`;
  },
  /** …→ [lead, [step]]: the row's sentence and its steps (ahead.noteRow draws them a line each). */
  setInFplRow: (sets) => {
    const [had, steps] = setsRow(sets);
    return [`Your FPL team${sets.gw ? ` for GW${sets.gw}` : ""} ${had ?? "differs from this pitch"}. To match this pitch in FPL:`, steps];
  },
  /** …its words alone where the bar's line has no room for what to set (whole, never "Set in FPL: 2 ch…"; the Week
   *  sheet's row says what). */
  // (a to-do, never a status: review 7, 2026-11-02)
  setInFplShort: "To set in FPL",
  liveHead: (gw) => `GW${gw} is live`,
  nTransfers: (n) => plural(n, "transfer"),
  /** A take's toast where the week keeps transfers of yours beside its own (ahead.addPlan): the week's count its number
   *  belongs to, "3 transfers in GW8". */
  weekTransfers: (n, gw) => `${plural(n, "transfer")} in GW${gw}`,
  outNames: (names) => `Out: ${names.join(", ")}`,
  // ("plan" named the week, the suggestions, the whole and the horizon)
  weekTitle: (gw) => `GW${gw} transfers`,
  rulesHead: "Your rules",
  /** A player's name in a Why sheet's comparison, said as what it opens. */
  cardOf: (name) => `${name}'s card`,
  /** Two players side by side (sheets/player.js), said: the first against the second. */
  compareOf: (a, b) => `${a} against ${b}`,
  /** Its name menus' spoken label. */
  comparePick: (name) => `Compare instead of ${name}`,
  /** A row's button in that list. */
  compareGo: "Compare",
  /** The card's link under its line: its one transfer's two players side by side, else any two (its first list's title). */
  comparePlayers: "Compare players",
  /** Its second list's title. */
  compareWith: (name) => `Compare with ${name}`,
  /** A suggested plan while it is solved (on its row): no number guessed, only what it waits for: "planning…" its own
   *  solve (also the week line's while its transfers' plans solve), "waiting" the slot (a sheet's solve, a refused
   *  ask), "waiting for your edit's plan". */
  waitShort: "planning\u2026",
  pairWaiting: "waiting",
  pairAfterEdit: "waiting for your edit's plan",
  /** A new GW's one notice (memory.carryOver, said once by Ahead): what the last GW's plan handed on (your rules as
   *  their chips); '' with none. */
  carried: (from, what) => what.length ? `Carried over from GW${from}: ${what.join(", ")}.` : "",
  /** In a sentence the whole number, to the thousand ("≈" says it is rounded; a rate under 1,000, at the top ranks, as
   *  it is, never "0 places"): "At your rank, 1 pt ≈ 80,000 places (GW5 standings)." */
  exchange: (placesPerPt, source) => `At your rank, 1 pt \u2248 ${fmt.int(Math.abs(placesPerPt) >= 1e3 ? Math.round(placesPerPt / 1e3) * 1e3 : placesPerPt)} places (${source}).`,
  /** The line every GW (owner, 2026-10-21): the bundle's rank.cheer (api/cheer.py: {gw, rank, best, at}: last season's
   *  best final rank among the managers ranked at or below yours after the same GW, `at` that manager's rank then),
   *  ranks as the You tile has them: "Last season a manager ranked 1.80M after GW7, below your 1.30M, finished 29th.";
   *  "just below you" where the two read alike. */
  cheerLine: (c) => {
    const at = rankShort(c.at ?? c.rank), mine = rankShort(c.rank);
    return `Last season a manager ranked ${at} after GW${c.gw}, ${at === mine ? "just below you" : `below your ${mine}`}, finished ${rankOrd(c.best)}.`;
  },
  /** While it plans (waitFacts; owner, 2026-10-27): two true lines about you, each [before, its number, after] (the
   *  number bold). Your rank before and after the last GW FPL has checked: "GW8 took you from 1.30M to **670K**
   *  overall."; the line every GW in 11 words: "Last season a manager ranked below you after GW8 finished **29th**."
   *  ("like you" where the two ranks read alike). */
  factMove: (gw, from, to) => rankShort(from) === rankShort(to) ? [`GW${gw} kept you at `, rankShort(to), " overall."] : [`GW${gw} took you from ${rankShort(from)} to `, rankShort(to), " overall."],
  factRank: (c) => [`Last season a manager ranked ${rankShort(c.at ?? c.rank) === rankShort(c.rank) ? "like" : "below"} you after GW${c.gw} finished `, rankOrd(c.best), "."],
  /** What the points on screen are (the bundle's meta.scale {k, k_h, seasons}: the plan service puts every forecast
   *  number on the real-points scale, by horizon when k_h is there; a hit is FPL's −4 as it is). */
  realScale: (s) => {
    const lo = Math.min(...s.seasons), hi = Math.max(...s.seasons);
    const kh = Array.isArray(s.k_h) && s.k_h.length > 1 ? s.k_h.map(Number) : null;
    const x = (k) => `\xD7${k.toFixed(2)}`, n = kh ? kh.length - 1 : 0;
    const by = kh ? `${x(kh[0])} this week up to ${x(kh[n])} ${WORDS[n] ?? n} week${n === 1 ? "" : "s"} ahead` : x(Number(s.k));
    return `Points shown \u2248 real points: the forecast ${by} (actual per forecast point, ${lo === hi ? lo : `${lo}\u2013${hi}`}).`;
  },
  forecastEdge: (gw) => `The forecast stops at GW${gw}.`,
  /** The quiet note while the plan on screen is a saved copy (the server away). */
  offline: (time) => `Offline \xB7 data from ${time}`,
  updating: "The forecast is updating. Your plan refreshes in a minute.",
  preseason: "No deadline coming up. Plans start before GW1.",
  // GW A under way says only what is true: what FPL published against your plan (liveCheck), or the next plan, which
  // starts the moment FPL publishes your GW A team (api/mobile.py live_week: the bundle moves to GW A+1)
  live: (gw) => `${COPY.liveHead(gw)}. Forkcast plans from GW${gw + 1} once FPL publishes your GW${gw} team.`,
  liveMatch: (gw) => `${COPY.liveHead(gw)}. Your FPL team matches your plan.`,
  liveDiff: (gw, fpl, plan) => `${COPY.liveHead(gw)}. FPL has ${andList(fpl)} where your plan had ${andList(plan)}.`
});
function liveCheck(published, week, L) {
  const fpl = published?.gw === week.gw ? ids2([...published.xi || [], ...published.bench || []]) : [];
  if (!fpl.length) return COPY.live(week.gw);
  const pairs = pairMoves(week.squad.filter((p) => !fpl.includes(p)), fpl.filter((p) => !week.squad.includes(p)), L);
  if (!pairs.length) return COPY.liveMatch(week.gw);
  const names = (k) => pairs.map((m) => m[k]).filter((p) => p != null).map((p) => L.name(p));
  return COPY.liveDiff(week.gw, names("in"), names("out"));
}

// js/m/calls/measure.js
function planInputs(bundle, data, model = null) {
  if (!bundle) return null;
  const meta = bundle.meta || {}, entry = bundle.entry || {};
  const A = num2(meta.gw ?? meta.next_gw);
  const rest = { meta, model, rank: bundle.rank || null };
  if (data?.base && data?.players) {
    return {
      ...rest,
      A,
      gws: ids2(data.horizon).length ? ids2(data.horizon) : ids2(meta.horizon),
      base: data.base,
      players: data.players,
      seeds: decodeSeeds(data.seeds ?? bundle.seeds),
      noise: num2(model?.noise) ?? num2(data.noise) ?? noiseFloor(meta, A) ?? 0,
      // (Settings → Solver gap: app.js gapOf, every solve's values; memory.planValues)
      gap: data.gap ?? null
    };
  }
  const cols = shownPlayers(bundle) || {};
  const width = (Array.isArray(cols.players) ? cols.players[0]?.xp : cols.rows?.[0]?.[(cols.fields || []).indexOf("xp")])?.length ?? 5;
  const horizon = ids2(cols.horizon).length ? ids2(cols.horizon) : ids2(bundle.seeds?.gws).length ? ids2(bundle.seeds.gws) : Array.from({ length: width }, (_, i) => A + i);
  const players = { ...cols, horizon };
  const base = {
    season: num2(meta.season),
    entry_id: num2(entry.id ?? entry.entry_id),
    gw: A,
    next_gw: A,
    bank: num2(entry.bank) ?? 0,
    ft: num2(entry.ft) ?? FT_WEEKLY,
    chips_available: entry.chips_available || [],
    chips_used: entry.chips_used || [],
    horizon,
    squad: entry.squad || []
  };
  return {
    ...rest,
    A,
    gws: ids2(meta.horizon).length ? ids2(meta.horizon) : planGws(base, 4),
    base,
    players,
    seeds: decodeSeeds(bundle.seeds),
    noise: num2(model?.noise) ?? noiseFloor(meta, A) ?? 0
  };
}
var compare = (ctx, a, b) => compareRoads(a, b, { seeds: ctx.seeds, noise: ctx.noise, xp: lookupOf(ctx).xp, ref: anchorRef(ctx.meta?.scale?.k_h, ctx.A) });
var transfersOf = (plan) => (plan?.weeks ?? plan?.gws ?? []).reduce((n, w) => n + (w.moves ?? w.bought ?? w.in ?? []).length, 0);
var hitsOf = (plan) => (plan?.weeks ?? plan?.gws ?? []).reduce((n, w) => n + (num2(w.hits) ?? 0), 0);
function plannerOf(a, b) {
  const oa = objectiveOf(a), ob = objectiveOf(b);
  if (!oa || !ob) return null;
  const terms = {};
  for (const k of /* @__PURE__ */ new Set([...Object.keys(oa.terms), ...Object.keys(ob.terms)])) if (!SLACK.includes(k)) terms[k] = (oa.terms[k] ?? 0) - (ob.terms[k] ?? 0);
  const onScale = (r, o) => r && !Array.isArray(r.k_h) && Array.isArray(o?.k_h) ? { ...r, k_h: o.k_h } : r;
  const ra = objectiveOf(onScale(a, b), { atAnchor: true }).terms, rb = objectiveOf(onScale(b, a), { atAnchor: true }).terms;
  return {
    delta: Object.values(terms).reduce((s, x) => s + x, 0),
    terms,
    ref: Object.keys(terms).reduce((s, k) => s + (ra[k] ?? 0) - (rb[k] ?? 0), 0),
    pts: Object.keys(terms).filter((k) => POINTS.includes(k)).reduce((s, k) => s + (ra[k] ?? 0) - (rb[k] ?? 0), 0),
    hits: { gap: hitGap(a) - hitGap(b), a: unpricedHits(a), b: unpricedHits(b), n: hitsOf(a) - hitsOf(b) }
  };
}
function windowGap(a, b, g) {
  const win = (r) => r?.windows?.[g] ? { ...r, objective: r.windows[g], weeks: [] } : null;
  const wa = win(a), wb = win(b);
  return wa && wb ? plannerOf(wa, wb) : null;
}
function counted(ctx, cmp, a, b, g) {
  const w = cmp ? windowGap(a, b, g) : null;
  if (!w) return cmp;
  return {
    ...cmp,
    delta: w.ref,
    ref: w.ref,
    shown: w.pts,
    label: verdictLabel(w.ref, ctx.noise),
    winner: w.ref > EPS2 ? "a" : w.ref < -EPS2 ? "b" : null,
    votes: null,
    against: null,
    lead: null,
    count: w.terms,
    pts: cmp
  };
}
var shownDelta = (cmp) => cmp?.shown ?? cmp?.delta;
var hitGap = (road) => (road?.weeks || []).reduce((s, w) => s + HIT_COST * (num2(w.hits) ?? 0) + (num2(road.objective?.hit?.[w.gw]) ?? 0), 0);
function hitBook(road) {
  if (!road?.objective || !road.weeks?.length) return null;
  const own = road.planner?.hits;
  const weeks = road.weeks.map((w) => {
    const g = Number(w.gw), hits = num2(w.hits) ?? 0;
    const lp = own ? num2(own[g]) ?? 0 : (num2(road.objective.hit?.[g]) ?? 0) < -EPS2 ? Math.max(hits, 1) : 0;
    return { gw: g, hits, lp, from: [], to: [], unpriced: 0 };
  }).sort((a, b) => a.gw - b.gw);
  const spare = weeks.flatMap((w) => Array(Math.max(0, w.lp - w.hits)).fill(w));
  const add = (list, gw) => {
    const x = list.find((y) => y.gw === gw);
    if (x) x.hits += 1;
    else list.push({ gw, hits: 1 });
  };
  for (const w of weeks) {
    for (let i = w.lp; i < w.hits; i++) {
      const j = spare.reduce((b, s2, k) => b < 0 || Math.abs(s2.gw - w.gw) < Math.abs(spare[b].gw - w.gw) ? k : b, -1);
      if (j < 0) {
        w.unpriced += 1;
        continue;
      }
      const [s] = spare.splice(j, 1);
      add(w.from, s.gw);
      add(s.to, w.gw);
    }
  }
  return weeks;
}
var unpricedHits = (road) => (hitBook(road) || []).filter((w) => w.unpriced > 0).map((w) => ({ gw: w.gw, hits: w.unpriced }));
var SLACK = ["ft_short"];
var POINTS = ["xi", "bench", "cap", "vice", "doubt_sub", "hit"];
var LEVEL = 5e-3;
var CROWD = ["cap_tie"];
function reasonParts(planner, dir) {
  const t = planner?.terms || {};
  const hg = planner?.hits ?? { gap: 0, a: [], b: [] };
  const crowd = CROWD.reduce((x, k) => x + (t[k] ?? 0), 0);
  return [["ft_cost", t.ft_cost ?? 0], ["ft_value", t.ft_value ?? 0], ["bench", t.bench ?? 0], ["hit", hg.gap], ["crowd", crowd]].filter(([, v]) => Math.sign(v) === dir && Math.abs(v) >= LEVEL).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
}
function unpricedWhere(planner, dir) {
  const hg = planner?.hits ?? { a: [], b: [] };
  const [own, other] = dir > 0 ? [hg.a, hg.b] : [hg.b, hg.a];
  return forcedNew(own, other).map((x) => `${hitsWords(x.hits)} in GW${x.gw}`).join(" and ");
}
function plannerReason(planner, dTransfers, dir) {
  const k = reasonParts(planner, dir)[0]?.[0] ?? (dTransfers ? "ft_cost" : null);
  const n = Math.abs(dTransfers);
  if (k === "ft_cost" && n) return `it uses ${n} ${dTransfers > 0 ? "more" : "fewer"} transfer${n === 1 ? "" : "s"}`;
  if (k === "ft_value" || k === "ft_cost") return dir < 0 ? "it keeps fewer free transfers for later weeks" : "it keeps more free transfers for later weeks";
  if (k === "bench") return dir < 0 ? "it leaves a weaker bench" : "it leaves a stronger bench";
  if (k === "hit") {
    const where = unpricedWhere(planner, dir);
    if (where) return dir > 0 ? `it takes ${where} that Forkcast didn't plan for` : `the plan before took ${where} that Forkcast didn't plan for`;
    return dir < 0 ? "it takes a hit" : "it takes no hit";
  }
  if (k === "crowd") return dir < 0 ? "it strays from the crowd (ownership, the captain poll)" : "it follows the crowd (ownership, the captain poll)";
  return dir < 0 ? "it costs free transfers or bench strength" : "it saves free transfers or bench strength";
}
function changeText(what, cmp, { dir = null, gws = null, transfers = [0, 0], planner = null, noise = 0, total = false } = {}) {
  let p = planner ? planner.delta : null;
  if (p !== null && (dir === "restrict" && p > 0 || dir === "relax" && p < 0)) p = 0;
  const sign = p !== null ? Math.abs(p) < LEVEL ? 0 : Math.sign(p) : dir === "restrict" ? -1 : dir === "relax" ? 1 : null;
  const n = gws ?? cmp.gws;
  const pointsWay = cmp.delta > EPS2 ? 1 : cmp.delta < -EPS2 ? -1 : 0;
  if (sign === null || pointsWay === 0 || sign === pointsWay) return COPY.change(what, cmp.delta, cmp.label, n, total);
  const dT = transfers[1] - transfers[0];
  if (sign === 0 || p !== null && verdictLabel(planner.ref ?? p, noise) === "coin") return COPY.changeLevel(what, cmp.delta, n, plannerReason(planner, dT, -pointsWay), total);
  return COPY.changeAgainst(what, cmp.delta, n, plannerReason(planner, dT, sign), p === null ? sign > 0 ? "no worse" : "no better" : sign > 0 ? "better" : "worse", total);
}
var forcedNew = (now = [], was = []) => (now || []).filter((f) => !(was || []).some((x) => x.gw === f.gw && x.hits === f.hits));
function withForced(line, now = [], was = []) {
  const fresh = forcedNew(now, was);
  if (!fresh.length) return line;
  const t = fresh.map(COPY.hitForbiddenShort).join("; ");
  return `${sentence(line)} ${sentence(t.charAt(0).toUpperCase() + t.slice(1))}`;
}
function rulesCost(ctx, yours, model) {
  const pl = plannerOf(yours, model);
  if (!pl) return null;
  const cost = Math.max(0, -pl.delta), atA = Math.max(0, -pl.ref);
  return {
    cost: cost < LEVEL ? 0 : cost,
    label: verdictLabel(atA < LEVEL ? 0 : atA, ctx.noise ?? 0),
    points: compare(ctx, yours, model).delta,
    transfers: transfersOf(yours) - transfersOf(model),
    planner: pl
  };
}
var lineupRoad = (week, lu = {}) => ({ weeks: [{ gw: Number(week.gw), xi: week.xi, bench: week.bench, captain: week.captain, chip: week.chip ?? null, hits: 0, ...lu }] });
var captainGap = (ctx, week, c, vs) => compare(ctx, lineupRoad(week, { captain: c }), lineupRoad(week, { captain: vs }));
var subGap = (ctx, week, s) => compare(ctx, lineupRoad(week, { xi: s.xi, bench: s.bench, captain: s.captain }), lineupRoad(week));
function planFromRoad(ctx, road, lineup = {}) {
  let draft = roadToDraft(road, ctx.base, { players: ctx.players });
  const w = weekAt(road, ctx.A);
  if (w && ["captain", "vice", "xi", "bench"].some((k) => lineup?.[k] != null)) draft = setLineup(draft, ctx.A, applyLineup(w, lineup, lookupOf(ctx)));
  const evaluation = evaluate({ base: ctx.base, players: ctx.players, draft, horizon: ctx.gws });
  return { draft, evaluation, week: evaluation.gws.find((s) => s.gw === ctx.A) ?? null };
}
var handoffMoves = (week) => (week?.moves || []).filter((m) => m.ok !== false);

// js/m/calls.js
var calls_exports = {};
__export(calls_exports, {
  CHIPS_OFF: () => CHIPS_OFF,
  COPY: () => COPY,
  FORGET_MS: () => FORGET_MS,
  HELP_OFF: () => HELP_OFF,
  OUT: () => OUT,
  PRICE_WORD: () => PRICE_WORD,
  captainGap: () => captainGap,
  changeText: () => changeText,
  clockText: () => clockText,
  compare: () => compare,
  counted: () => counted,
  forcedNew: () => forcedNew,
  gwFlags: () => gwFlags,
  handoffMoves: () => handoffMoves,
  hitBook: () => hitBook,
  hitCap: () => hitCap,
  hitsOf: () => hitsOf,
  horizonFeature: () => horizonFeature,
  liveCheck: () => liveCheck,
  newsReason: () => newsReason,
  nightWords: () => nightWords,
  planFromRoad: () => planFromRoad,
  planInputs: () => planInputs,
  planWeeks: () => planWeeks2,
  plannerOf: () => plannerOf,
  priceMorning: () => priceMorning,
  priceNights: () => priceNights,
  priceOutlook: () => priceOutlook,
  pricePlate: () => pricePlate,
  priceProgress: () => priceProgress,
  priceSaid: () => priceSaid,
  priceWatch: () => priceWatch,
  rulesCost: () => rulesCost,
  saleStep: () => saleStep,
  sentence: () => sentence,
  shownDelta: () => shownDelta,
  shownPlayers: () => shownPlayers,
  statusText: () => statusText,
  stepShare: () => stepShare,
  subGap: () => subGap,
  transfersOf: () => transfersOf,
  waitFact: () => waitFact,
  waitFacts: () => waitFacts,
  waitLines: () => waitLines,
  waitedText: () => waitedText,
  windowGap: () => windowGap,
  withForced: () => withForced,
  withPrices: () => withPrices
});
var HELP_OFF = true;
var CHIPS_OFF = true;

export {
  qs,
  uid,
  append,
  fill,
  h,
  svg,
  xpNum,
  xpGain,
  shownGain,
  xpMark,
  icon,
  fin,
  plural,
  toMs,
  fmt,
  posName,
  posCode,
  statusInfo,
  statusDot,
  reduceMotion,
  holdTouch,
  flick,
  focusKey,
  refocus,
  cardSaysIt,
  toastRegion,
  setToastPlace,
  overlapOf,
  toast,
  roving,
  chipName,
  norm,
  ui_exports,
  local,
  LOOPBACK,
  servedRelease,
  recent,
  getBundle,
  getCards,
  getPlayer,
  getScouts,
  holdBare,
  waitBare,
  endBareWait,
  solveGap,
  saveSnapshot,
  loadSnapshot,
  isDown,
  offlineNow,
  plain,
  api_exports2 as api_exports,
  createDraft,
  setChip,
  setLineup,
  canUseChip,
  weekPoints,
  evaluate,
  planBanks,
  pairMoves,
  solveValues,
  LAST_ROUND,
  HIT_COST,
  MAX_PER_CLUB,
  HALF,
  CHIPS2 as CHIPS,
  POS_LIMITS,
  ftGrant,
  nextFt,
  playerLookup,
  bestXI,
  applyLineup,
  swapLineup,
  swapCandidates,
  noiseFloor,
  decodeSeeds,
  verdictLabel,
  roadToDraft,
  engine_exports,
  FORGET_MS,
  gwFlags,
  OUT,
  newsReason,
  statusText,
  hitCap,
  horizonFeature,
  planWeeks2 as planWeeks,
  planInputs,
  compare,
  transfersOf,
  plannerOf,
  counted,
  shownDelta,
  hitBook,
  changeText,
  withForced,
  captainGap,
  subGap,
  planFromRoad,
  shownPlayers,
  priceProgress,
  pricePlate,
  priceWatch,
  priceMorning,
  clockText,
  waitedText,
  waitLines,
  stepShare,
  waitFacts,
  waitFact,
  sentence,
  COPY,
  liveCheck,
  HELP_OFF,
  CHIPS_OFF,
  calls_exports
};
