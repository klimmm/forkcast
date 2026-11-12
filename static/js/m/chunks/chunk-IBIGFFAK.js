import {
  CHIPS,
  COPY,
  FORGET_MS,
  HIT_COST,
  LAST_ROUND,
  MAX_PER_CLUB,
  OUT,
  POS_LIMITS,
  cardSaysIt,
  changeText,
  chipName,
  compare,
  createDraft,
  fin,
  fmt,
  h,
  hitBook,
  hitCap,
  icon,
  pairMoves,
  planFromRoad,
  planInputs,
  playerLookup,
  posCode,
  posName,
  reduceMotion,
  roving,
  setChip,
  solveGap,
  solveValues,
  statusDot,
  statusInfo,
  statusText,
  svg,
  toMs,
  transfersOf,
  uid,
  verdictLabel,
  withForced,
  xpNum
} from "./chunk-TCPZEJ5A.js";
import {
  __export
} from "./chunk-WSFCRVEQ.js";

// js/plan/kits.js
var kits_exports = {};
__export(kits_exports, {
  FPL_FRAME: () => FPL_FRAME,
  KITS: () => KITS,
  clubColor: () => clubColor,
  kitSourceRow: () => kitSourceRow,
  setKitSource: () => setKitSource,
  shirt: () => shirt
});
var WHITE = "#ffffff";
var BLACK = "#16181d";
var stripes = (a, p, w, gap = false, angle = 0) => [a, p, w, gap ? p / 2 : 0, angle];
var two = (a) => [a, 2, 1.2, 0.7];
var arsenal = (a) => [a, 2, [1.05, 1.5], 0.9, -0.55];
var KITS = {
  ARS: {
    code: 3,
    b: "#dc1d29",
    s: "#f4f4f4",
    rg: "#f4f4f4",
    k: "#b0232f",
    kw: 1.5,
    c: "#b81e24",
    n: "#761b26",
    sh: arsenal(["#a51e2a", "#6d3c46"]),
    g: { b: "#dcdbd7", gr: "#c4c1b6", c: "#cfcfcd", n: "#a4a4a4", k: "#d6d6d6", sh: arsenal(BLACK) }
  },
  AVL: {
    code: 7,
    b: "#471828",
    c: "#c9e0f5",
    cs: "polo",
    ct: ["#5b1a2c"],
    n: "#a1bfe7",
    pk: "#d4e8fc",
    bt: false,
    k: "#b9d3ee",
    kw: 1.8,
    sh: two("#c1d6ec"),
    g: { b: "#fcf30a", gr: "#f4d42a", c: "#ebe006", n: "#8f8200", k: "#fcf30a", sh: two(BLACK) }
  },
  BOU: {
    code: 91,
    b: "#d2202b",
    v: [stripes("#1d1719", 9.9, 4.6)],
    s: "#d2202b",
    sv: [["#1d1719", 9.9, 4.6, 2.5]],
    k: "#b8a774",
    kw: 0.6,
    c: "#1d1719",
    x: "#d2202b",
    sh: [["#1d1719", "#b8a774"], 2, [2.2, 0.8], 0, -0.55, 0.42],
    ch: ["#b8a774", 2, 1, 1.1],
    g: {
      b: "#7652a0",
      v: [["#4fa7b4", 9, 2.6, 0, -30], ["#1e2e4f", 9, 1.2, 4.5, 40]],
      sv: [["#4fa7b4", 9, 2.6, 0, -30]],
      c: "#1e1c22",
      k: "#7652a0",
      sh: [WHITE, 1, 0.9, 0, 2.7, 0.42],
      ch: [WHITE, 3, 2.2, 1.4, 0.06, 0.04, 0.035]
    }
  },
  BRE: {
    code: 94,
    b: "#f3f1f1",
    v: [stripes("#cd0c2b", 14.6, 7.4, true)],
    s: "#cd0c2b",
    c: "#1c1a19",
    ct: ["#e5bb53"],
    n: "#f4f4f4",
    k: ["#e9b631", "#1c1a19"],
    kw: [1.1, 0.6],
    g: { b: "#e3a9ef", c: "#141414", n: "#c48fcf", k: "#e3a9ef", ar: ["#1c1c1c", 2.2] }
  },
  BHA: {
    code: 36,
    b: "#1b60b6",
    v: [stripes("#cfe1f7", 3.8, 0.45, true)],
    sv: [stripes("#cfe1f7", 3.8, 0.45)],
    cs: "v",
    vd: 13.6,
    c: "#edeff1",
    n: "#2a5ea6",
    k: "#155ab0",
    x: "#0a5bbf",
    g: { b: "#f2508a", gr: "#d83f89", v: [["#e84a9f", 4.2, 1.3, 0, 90]], sv: [["#e84a9f", 4.2, 1.3, 0, 90]], c: "#e44397", n: "#f1f3f2", k: "#e04b87", ar: ["#3a1022", 0.45, 0.6] }
  },
  CHE: {
    code: 8,
    b: "#1d3f9a",
    cs: "polo",
    c: "#1a3c8f",
    pk: false,
    ar: ["#e9cf6a", 0.5, 0.45],
    sl: ["#e9cf6a", 0.45],
    g: { b: "#22292c", gr: "#151c1f", v: [["#343b3e", 3.2, 1, 0, 90]], sv: [["#343b3e", 3.2, 1, 0, 90]], c: "#101416", n: "#e9e9e9", k: "#101416" }
  },
  COV: {
    code: 9,
    b: "#fcfcfc",
    v: [stripes("#1d6db1", 7.4, 4)],
    s: "#226cae",
    sv: [[WHITE, 0, 2.2, 1]],
    cs: "v",
    vd: 13.6,
    c: "#14223b",
    n: "#e1e5df",
    k: "#226cae",
    kw: 1,
    sh: ["#226cae", 1, 3.4, 0, -0.55],
    ch: ["#123d73", 3, 1.1, 1.4],
    x: "#1d6db1",
    g: {
      b: "#164c31",
      cs: "v",
      vd: 13.6,
      c: "#060f45",
      n: "#0b492b",
      k: "#11402a",
      sp: ["#1a3f8a", 1.6],
      sh: ["#1f4a95", 1, 3.4, 0, -0.55, 0.42],
      ch: [WHITE, 3, 1.2, 1.4]
    }
  },
  CRY: {
    code: 31,
    b: "#fdfdfd",
    x: "#d4202f",
    c: "#ececec",
    ct: ["#28264f", "#d4202f"],
    n: "#e6e6e6",
    k: [WHITE, "#28264f", WHITE, "#d4202f"],
    kw: [1, 0.45, 0.3, 0.35],
    sh: [["#1b458f", "#1b458f", ...Array(5).fill("#d4202f")], 7, 0.35, 0.28, 0],
    v: [[-3.6, 1.2, "r"], [-1.9, 1, "r"], [-0.4, 0.8, "r"], [1.1, 1.3, "b"], [2.8, 1.1, "b"], [4.3, 0.8, "b"], [5.5, 0.6, "b"]].map(([o, w, c]) => [c === "r" ? "#d4202f" : "#1b458f", 0, w, o, 32]),
    g: { b: "#62c741", c: "#4ee434", n: "#0b2a07", k: "#58d037", sp: ["#b23e74", 1.8] }
  },
  EVE: {
    code: 11,
    b: "#1c439a",
    c: "#f8fcfd",
    n: "#13306b",
    ci: "#e9aa10",
    k: "#f2f4f5",
    kw: 1.2,
    g: { b: "#77e909", c: "#0b1607", n: "#193900", k: "#70dc06" }
  },
  FUL: {
    code: 54,
    b: "#f1f0f0",
    c: BLACK,
    n: "#c91e23",
    sh: two(BLACK),
    k: ["#d2202b", BLACK],
    kw: [0.5, 0.9],
    x: BLACK,
    g: { b: "#33a8e1", gr: "#3995d1", c: "#2a9fe0", n: "#1f7fc0", k: "#0f6cb5", kw: 10, sh: two("#9fdcf5") }
  },
  HUL: {
    code: 88,
    b: "#f0980d",
    v: [stripes("#2a2424", 14.6, 6.6)],
    cs: "polo",
    c: "#faf9fa",
    pk: false,
    n: "#de9822",
    k: "#faf9fa",
    kw: 1.3,
    sh: ["#2a2424", 1, 1.4, 0, -0.55],
    g: { b: "#093224", c: "#e6f2ec", cw: 0.8, n: "#113328", k: ["#093224", "#e6f2ec", "#093224"], kw: [0.5, 0.45, 0.5] }
  },
  IPS: {
    code: 40,
    b: "#113b85",
    sp: [WHITE, 2],
    c: "#f2f4f8",
    cw: 0.8,
    ct: ["#0f2f66", "#0f2f66"],
    n: "#123c87",
    k: WHITE,
    kw: 0.6,
    g: { b: "#6ec3b1", s: "#6fd8c6", v: [["#c9f0b0", 8, 0.7, 0, 30], ["#c9f0b0", 11, 0.55, 3, -50]], c: "#50b1a5", n: "#4da998", k: "#6fd8c6" }
  },
  LEE: {
    code: 2,
    b: "#fdfefe",
    v: [stripes("#1d3c7f", 5.4, 0.5, false, 90), stripes("#f5d000", 5.4, 0.5, true, 90)],
    c: "#f4d23a",
    cw: 0.7,
    ct: ["#1d4f94", "#1d4f94"],
    n: "#1d3c7f",
    k: ["#f5d000", "#1d4f94"],
    kw: [0.6, 1.3],
    x: "#1d3c7f",
    sh: two("#1d4f94"),
    g: { b: "#81fd8a", gr: "#4bc053", sh: two("#05300f"), c: "#54f05e", n: "#3d7a3a", k: "#6ee879" }
  },
  LIV: {
    code: 14,
    b: "#a61434",
    c: "#f4eef0",
    cw: 0.7,
    ct: ["#8e1029", "#8e1029"],
    n: "#d88b9c",
    sh: two(WHITE),
    k: "#f4eef0",
    kw: 0.5,
    g: { b: "#2d5c4b", gr: "#1f4436", c: "#24503f", n: "#c8d6d4", k: "#2d5c4b", sh: two(WHITE) }
  },
  MCI: {
    code: 43,
    b: "#7eb6db",
    gr: "#e7fefd",
    c: "#e8fcfd",
    n: "#71a9c8",
    k: "#eef7fb",
    kw: 1.4,
    sp: ["#e3f2f8", 1.4],
    g: {
      b: "#f0694f",
      gr: "#140f0d",
      v: [["#3b1812", 5.2, 0.45, 0, 30], ["#3b1812", 5.2, 0.45, 0, -30]],
      s: "#e8664f",
      c: "#0e1011",
      n: "#f86a63",
      k: "#1c1413",
      kw: 12
    }
  },
  MUN: {
    code: 1,
    b: "#bc0924",
    cs: "polo",
    c: "#b00c22",
    ct: [WHITE, BLACK],
    pk: false,
    n: "#961125",
    sh: two(WHITE),
    k: [WHITE, BLACK, WHITE],
    kw: [0.35, 0.3, 0.3],
    g: { b: "#282828", gr: "#101010", sh: two("#c8c8c8"), c: "#1c1c1c", n: "#090909", k: "#1c1c1c" }
  },
  NEW: {
    code: 4,
    b: "#1a1a1a",
    v: [
      stripes(WHITE, 15.2, 3.4, true),
      ...[[2.5, 0.74], [3.6, 0.5], [4.4, 0.3]].flatMap(([d, w]) => [-d, d].map((o) => [WHITE, 15.2, w, 7.6 + o]))
    ],
    s: "#f4f4f4",
    sv: [[BLACK, 2.6, 1.2]],
    sh: two("#53a8d0"),
    c: "#5aa9d0",
    cw: 0.7,
    ct: [BLACK, BLACK],
    n: "#fbfbfb",
    k: ["#5aa9d0", BLACK],
    kw: [0.45, 1],
    g: { b: "#f6ee12", gr: "#ebd238", sh: two(BLACK), c: "#ece40e", n: "#c9bf0a", k: "#f6ee12" }
  },
  NFO: {
    code: 17,
    b: "#bf272e",
    cs: "v",
    vd: 12.8,
    c: "#e5222b",
    n: "#7f0c18",
    k: "#e5222b",
    kw: 1,
    sh: two(WHITE),
    g: { b: "#42aaf3", gr: "#3284ce", c: "#2b9bea", n: "#155fa1", k: "#056fcb", kw: 10, sh: two("#9eeefd") }
  },
  SUN: {
    code: 56,
    b: "#d01b1f",
    v: [stripes(WHITE, 7.4, 3.7)],
    sv: [[WHITE, 3.8, 1.6]],
    cs: "polo",
    c: WHITE,
    n: "#e9e9e9",
    pk: WHITE,
    k: WHITE,
    g: { b: "#fed819", c: "#ecc812", n: "#c9a80c", k: "#fed819", sh: [BLACK, 1, 0.9, 0, 2.7, 0.42], ch: [BLACK, 3, 2.2, 1.4, 0.06, 0.04, 0.035] }
  },
  TOT: {
    code: 6,
    b: "#f5f6f6",
    sc: "#132257",
    cs: "v",
    vd: 12.6,
    c: "#ececec",
    n: "#f7f7f7",
    k: ["#132257", "#a9acae"],
    kw: [0.4, 0.3],
    x: "#132257",
    g: {
      b: "#f2508a",
      gr: "#d83e89",
      v: [["#e84a9f", 4.2, 1.3, 0, 90]],
      sv: [["#e84a9f", 4.2, 1.3, 0, 90]],
      c: "#fa3b7b",
      n: "#f3f0f3",
      k: "#df4b87",
      ar: ["#3a1022", 0.45, 0.6]
    }
  }
};
var NEUTRAL = { b: "#9aa3b2", s: "#8b94a3", c: "#6b7383" };
var TURF_GK = "#d4d9de";
var rgb = (hex2) => [1, 3, 5].map((i) => parseInt(hex2.slice(i, i + 2), 16));
var hex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
var shade = (h2, amt) => hex(rgb(h2).map((v) => amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
var luma = (h2) => {
  const [r, g, b] = rgb(h2);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
function greenish(h2) {
  const [r, g, b] = rgb(h2).map((v) => v / 255);
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  if (d < 0.25) return false;
  const hue = mx === g ? 60 * ((b - r) / d + 2) : mx === r ? 60 * ((g - b) / d % 6) : 60 * ((r - g) / d + 4);
  return hue >= 60 && hue <= 190;
}
var clubKey = (club) => String(club ?? "").toUpperCase();
var kitOf = (club) => KITS[clubKey(club)] || null;
function clubColor(club) {
  const k = kitOf(club);
  if (!k) return NEUTRAL.b;
  return k.x || (luma(k.b) > 0.85 ? k.v?.[0]?.[0] || k.c : k.b);
}
var TORSO = "M23 6.5 13.5 10 17 24 17.5 57Q32 59.6 46.5 57L47 24 50.5 10 41 6.5C38 12 26 12 23 6.5Z";
var SLEEVE = "M13.5 10C9.5 12 6.2 16 3.5 21.5L11.2 28.6 17 24Z";
var NECK_BACK = "M23 6.5Q32 4.6 41 6.5C38 12 26 12 23 6.5Z";
var CUFF = "M3.5 21.5 11.2 28.6";
var SLEEVE_AXIS = [11.3, 21, 44.5];
var SEAM = "M23.5 6.9 13.8 10.5C9.9 12.5 6.6 16.3 4 21.6";
var SEAM_IN = [0.5, 0.86];
var RAGLAN = "M23 6.5 13.5 10 17 24C18.6 17.5 21.8 12.6 26.4 10.4Z";
var ARMHOLE = "M14.4 9.66C15.5 14 16.5 18.5 17.9 24";
var SIDE_LINE = "M17.1 28.5C19.7 36 19.9 47.5 17.9 58";
var CUFF_TRIM = [1.9, -1.9];
var ARMS = {
  short: { sleeve: SLEEVE, cuff: CUFF, axis: SLEEVE_AXIS, seam: SEAM, trim: CUFF_TRIM },
  long: {
    sleeve: "M13.5 10C9.6 11.8 7.2 15.5 6.2 21L4 49.2 11.2 50.6 12.9 35C13.6 30 15 26.5 17 24Z",
    cuff: "M4 49.2 11.2 50.6",
    axis: [8.6, 33, 6],
    seam: "M23.5 6.9 13.8 10.5C10.1 12.2 7.8 15.4 6.7 20.2",
    trim: [0.5, -2.65]
  }
};
var POLO = {
  wing: "M22.4 6C22.9 9.9 25.6 13.6 29.9 15.9L31.9 11.7C28.2 11.2 25.5 9.5 24 6.7Z",
  edge: "M22.4 6C22.9 9.9 25.6 13.6 29.9 15.9",
  stand: "M23.2 6.3Q32 4.2 40.8 6.3",
  placket: "M30.4 10.8H33.6V20.6H30.4Z",
  buttons: [[32, 17.1], [32, 19.4]]
};
var COLLARS = {
  crew: { d: "M23 6.5C26 12 38 12 41 6.5" },
  v: { d: "M23 6.5 32 15.2 41 6.5", notch: true },
  polo: { d: "M23 6.5C26 12 38 12 41 6.5", polo: true },
  wrap: { d: "M23 6.5C25 11 29.5 13.6 35 14.6M41 6.5C39 11 34.5 13.6 29 14.6" }
};
var MIRROR = "matrix(-1 0 0 1 64 0)";
var sides = (make) => [svg("g", null, make()), svg("g", { transform: MIRROR }, make())];
var pair = (d, attrs) => sides(() => svg("path", { d, ...attrs }));
var clipPair = (d) => [svg("path", { d }), svg("path", { d, transform: MIRROR })];
var at = (dx, dy) => `translate(${dx} ${dy})`;
function bands(list = [], cx = 32, cy = 32, turn = 0) {
  return list.map(([fill, period, w, off = 0, angle = 0]) => {
    const xs = [];
    if (period) for (let x = off - Math.ceil((64 + off) / period) * period; x <= 64; x += period) xs.push(x);
    else xs.push(off);
    return svg(
      "g",
      { transform: `rotate(${angle + turn} ${cx} ${cy})` },
      xs.map((x) => svg("rect", { fill, x: cx + x - w / 2, y: cy - 64, width: w, height: 128 }))
    );
  });
}
var FPL_FRAME = { w: 220, h: 290, out: { l: 15, t: 4, r: 208, b: 288 }, gk: { l: 7, t: 3, r: 214, b: 286 } };
var DRAWN = { l: 3.5, r: 60.5, t: 5.55 };
var TALL_VIEWBOX = (() => {
  const { w, h: h2, out } = FPL_FRAME;
  const u = (DRAWN.r - DRAWN.l) / (out.r - out.l);
  return [DRAWN.l - out.l * u, DRAWN.t - out.t * u, w * u, h2 * u].map((x) => Math.round(x * 100) / 100).join(" ");
})();
var boxHeight = (size, tall) => tall ? Math.round(size * FPL_FRAME.h / FPL_FRAME.w) : size;
function shirt(opts = {}) {
  const el = source === "official" && officialCode(opts.club) != null ? officialShirt(opts) : drawnShirt(opts);
  el.setAttribute("data-kit", JSON.stringify(opts));
  return el;
}
function specOf(club, gk, turf2) {
  const k = kitOf(club) || NEUTRAL;
  if (!gk) return k;
  const g = typeof k.g === "object" ? k.g : { b: k.g || "#f5d327" };
  return turf2 && greenish(g.b) ? { ...g, b: TURF_GK, gr: null } : g;
}
function drawnShirt({ club, gk = false, size = 56, title, turf: turf2 = false, tall = false } = {}) {
  const k = specOf(club, gk, turf2);
  const body = k.b;
  const sleeves = k.s || body;
  const collar = k.c || shade(body, gk ? -0.38 : -0.3);
  const cuffs = k.k || collar;
  const light = luma(body) > 0.85;
  const neck = k.cs === "v" && k.vd ? { ...COLLARS.v, d: `M23 6.5 32 ${k.vd} 41 6.5` } : COLLARS[k.cs] || COLLARS.crew;
  const id = uid("kit");
  const clip = (s, ...kids) => svg("g", { "clip-path": `url(#${id}-${s})` }, ...kids);
  const ring = (stroke, width, dy = 0) => svg("path", { d: neck.d, stroke, "stroke-width": width, fill: "none", "stroke-linecap": "round", transform: at(0, dy) });
  const arm = ARMS[k.ls ?? gk ? "long" : "short"];
  const [sx, sy, sa] = arm.axis;
  return svg(
    "svg",
    {
      class: gk ? "kit-shirt gk" : "kit-shirt",
      viewBox: tall ? TALL_VIEWBOX : "0 0 64 64",
      width: size,
      height: boxHeight(size, tall),
      "aria-hidden": title ? null : "true",
      role: title ? "img" : null,
      "aria-label": title || null
    },
    svg(
      "defs",
      null,
      svg("clipPath", { id: `${id}-t` }, svg("path", { d: TORSO })),
      k.ci && svg("clipPath", { id: `${id}-n` }, svg("path", { d: NECK_BACK })),
      svg("clipPath", { id: `${id}-s` }, clipPair(arm.sleeve)),
      svg("clipPath", { id: `${id}-l` }, svg("path", { d: arm.sleeve })),
      svg("clipPath", { id: `${id}-a` }, svg("path", { d: TORSO }), clipPair(arm.sleeve)),
      k.gr && svg(
        "linearGradient",
        { id: `${id}-b`, x1: 0, x2: 0, y1: 0, y2: 1 },
        svg("stop", { offset: 0.42, "stop-color": body }),
        svg("stop", { offset: 0.9, "stop-color": k.gr })
      ),
      svg(
        "linearGradient",
        { id: `${id}-g`, x1: 0, x2: 1, y1: 0, y2: 0.25 },
        svg("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": 0.16 }),
        svg("stop", { offset: 0.4, "stop-color": "#fff", "stop-opacity": 0 }),
        svg("stop", { offset: 0.62, "stop-color": "#000", "stop-opacity": 0 }),
        svg("stop", { offset: 1, "stop-color": "#000", "stop-opacity": light ? 0.12 : 0.22 })
      )
    ),
    svg("path", { d: NECK_BACK, fill: k.n || shade(body, light ? -0.22 : -0.42) }),
    pair(arm.sleeve, { fill: sleeves }),
    // bands clipped to their own sleeve (-l, mirrored): they span the box
    clip(
      "s",
      sides(() => clip("l", bands(k.sv, sx, sy, sa))),
      cuffBands(cuffs, k.kw).map(([c, w]) => pair(arm.cuff, { stroke: c, "stroke-width": 2 * w, fill: "none" })),
      k.kt && pair(arm.cuff, { stroke: k.kt, "stroke-width": 0.8, fill: "none", transform: at(...arm.trim) })
    ),
    svg("path", { d: TORSO, fill: k.gr ? `url(#${id}-b)` : body }),
    clip(
      "t",
      bands(k.v),
      k.sp && sides(() => svg("rect", { fill: k.sp[0], x: 10, y: 20, width: 7 + k.sp[1], height: 44 })),
      k.rg && pair(RAGLAN, { fill: k.rg })
    ),
    k.sh && clip("a", (() => {
      const [c, n, w, gap = w, from = 0.25, len] = k.sh;
      const part = len ? { pathLength: 1, "stroke-dasharray": `${len} 2` } : {};
      const each = (v, i) => Array.isArray(v) ? v[i] : v;
      let edge = from;
      return Array.from({ length: n }, (_, i) => {
        const wi = each(w, i), d = edge + wi / 2;
        edge += wi + gap;
        return pair(arm.seam, { stroke: each(c, i), "stroke-width": wi, fill: "none", ...part, transform: at(SEAM_IN[0] * d, SEAM_IN[1] * d) });
      });
    })()),
    k.ch && clip("a", (() => {
      const [c, n = 3, w = 1.2, d = 1.4, start = 0.06, dash = 0.05, gap = 0.035] = k.ch;
      const dashes = [0, start, ...Array.from({ length: n - 1 }, () => [dash, gap]).flat(), dash, 2].join(" ");
      return pair(arm.seam, {
        stroke: c,
        "stroke-width": w,
        fill: "none",
        pathLength: 1,
        "stroke-dasharray": dashes,
        transform: at(SEAM_IN[0] * d, SEAM_IN[1] * d)
      });
    })()),
    k.ar && clip("a", pair(ARMHOLE, { stroke: k.ar[0], "stroke-width": k.ar[1], fill: "none", pathLength: 1, "stroke-dasharray": `${k.ar[2] ?? 1} 2` })),
    k.sc && clip("t", pair(`${SIDE_LINE}L10 58 10 28.5Z`, { fill: k.sc })),
    k.sl && clip("t", pair(SIDE_LINE, { stroke: k.sl[0], "stroke-width": k.sl[1], fill: "none" })),
    svg("g", { fill: `url(#${id}-g)` }, svg("path", { d: TORSO }), pair(arm.sleeve, {})),
    neck.notch && svg("path", { d: `${neck.d}Z`, fill: k.n || shade(body, light ? -0.22 : -0.42) }),
    ...neck.polo ? polo(k, body, collar) : [
      clip("t", (k.ct || []).map((c, i) => ring(c, 0.9, (k.cw ?? 2.6) / 2 + 0.45 + i))),
      k.ci && clip("n", ring(k.ci, 1.6, -1.5)),
      ring(collar, k.cw ?? 2.6)
    ],
    // edge: plan-pitch.css strokes it in the text colour (or --kit-edge)
    svg(
      "g",
      { class: "kit-edge", fill: "none", stroke: "#000", "stroke-opacity": 0.3, "stroke-width": 1.1, "stroke-linejoin": "round" },
      svg("path", { d: TORSO }),
      pair(arm.sleeve, {})
    )
  );
}
function cuffBands(k, kw = 2.3) {
  const cs = [k].flat(), ws = [kw].flat();
  let up = 0;
  return cs.map((c, i) => [c, up += ws[i] ?? ws[0]]).reverse();
}
function polo(k, body, collar) {
  const line = { stroke: "#000", "stroke-opacity": 0.28, "stroke-width": 0.45, "stroke-linejoin": "round" };
  const id = uid("polo");
  const trims = () => (k.ct || []).map((c, i) => svg("path", {
    d: POLO.edge,
    stroke: c,
    "stroke-width": 0.8,
    fill: "none",
    transform: at(0.75 + 0.8 * i, -0.6 - 0.6 * i)
  }));
  return [
    svg("path", { d: POLO.stand, stroke: collar, "stroke-width": 1.3, fill: "none" }),
    k.pk !== false && svg("path", { d: POLO.placket, fill: k.pk || body, ...line, ...k.pe && { stroke: k.pe, "stroke-opacity": 1, "stroke-width": 0.6 } }),
    k.pk !== false && k.bt !== false && POLO.buttons.map(([cx, cy]) => svg("circle", { cx, cy, r: 0.6, fill: k.bt || collar, ...line })),
    svg("defs", null, svg("clipPath", { id }, svg("path", { d: POLO.wing }))),
    sides(() => [
      svg("path", { d: POLO.wing, fill: collar }),
      k.ct && svg("g", { "clip-path": `url(#${id})` }, trims()),
      svg("path", { d: POLO.wing, fill: "none", ...line })
    ])
  ];
}
var SOURCE_KEY = "fc:kits";
var SOURCES = [["drawn", "Drawn"], ["official", "Official"]];
var FPL_SHIRTS = "https://fantasy.premierleague.com/dist/img/shirts/standard/";
var WIDTHS = [66, 110, 220];
var failed = /* @__PURE__ */ new Set();
var storage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};
var source = (() => {
  try {
    return storage()?.getItem(SOURCE_KEY) === "official" ? "official" : "drawn";
  } catch {
    return "drawn";
  }
})();
var officialCode = (club) => failed.has(clubKey(club)) ? null : kitOf(club)?.code ?? null;
function officialShirt(opts) {
  const { club, gk = false, size = 56, title, tall = false } = opts;
  const url = (w) => `${FPL_SHIRTS}shirt_${kitOf(club).code}${gk ? "_1" : ""}-${w}.webp`;
  const img = h("img", {
    class: gk ? "kit-shirt official gk" : "kit-shirt official",
    alt: title ?? "",
    width: size,
    height: boxHeight(size, tall),
    loading: "lazy",
    decoding: "async",
    referrerpolicy: "no-referrer",
    draggable: "false",
    sizes: `${size}px`,
    srcset: WIDTHS.map((w) => `${url(w)} ${w}w`).join(", "),
    src: url(110)
  });
  img.addEventListener("error", () => {
    failed.add(clubKey(club));
    img.replaceWith(shirt(opts));
  }, { once: true });
  return img;
}
function redrawShirts(root = globalThis.document) {
  for (const el of root?.querySelectorAll?.("[data-kit]") ?? []) {
    let opts;
    try {
      opts = JSON.parse(el.getAttribute("data-kit"));
    } catch {
      continue;
    }
    el.replaceWith(shirt(opts));
  }
}
function setKitSource(s) {
  source = s === "official" ? "official" : "drawn";
  try {
    storage()?.setItem(SOURCE_KEY, source);
  } catch {
  }
  redrawShirts();
}
function kitSourceRow() {
  const id = uid("kitsrc");
  const at2 = () => SOURCES.findIndex(([k]) => k === source);
  const seg = h(
    "div.m-seg.small.kit-src-seg",
    { role: "radiogroup", "aria-labelledby": id, style: { "--n": SOURCES.length, "--i": at2() } },
    h("span.m-seg-thumb"),
    SOURCES.map(([k, label]) => h("button", {
      type: "button",
      role: "radio",
      "aria-checked": String(k === source),
      dataset: { kits: k },
      onClick: () => {
        setKitSource(k);
        seg.style.setProperty("--i", at2());
        for (const b of seg.querySelectorAll("button")) b.setAttribute("aria-checked", String(b.dataset.kits === source));
        roving(seg);
      }
    }, label))
  );
  roving(seg, { pick: (b) => b.click() });
  return h(
    "div.kit-src",
    null,
    h("div.kit-src-row", null, h("span.kit-src-l", { id }, "Shirts"), seg),
    h("p.kit-src-note", null, "Official shirts are loaded by your browser from FPL's site.")
  );
}

// js/plan/pitch.js
var pitch_exports = {};
__export(pitch_exports, {
  availabilityTone: () => availabilityTone,
  benchNth: () => benchNth,
  benchTag: () => benchTag,
  benchTagSaid: () => benchTagSaid,
  fitFixtures: () => fitFixtures,
  fixturesAt: () => fixturesAt,
  fplMarks: () => fplMarks,
  gwIndex: () => gwIndex,
  mountPitch: () => mountPitch,
  oppLabel: () => oppLabel,
  oppText: () => oppText,
  pitchCard: () => pitchCard,
  platePts: () => platePts,
  renderPitch: () => renderPitch,
  setPitchChip: () => setPitchChip,
  subOrder: () => subOrder,
  xpAt: () => xpAt
});
var ROWS = ["GK", "DEF", "MID", "FWD"];
var DASH = fmt.dash;
function gwIndex(gw, horizon) {
  const h0 = Array.isArray(horizon) ? horizon[0] : horizon;
  return fin(gw) && fin(h0) ? Number(gw) - Number(h0) : 0;
}
function xpAt(p, gw, horizon) {
  const v = p?.xp?.[gwIndex(gw, horizon)];
  return fin(v) ? Number(v) : null;
}
var fixtureOf = (f, fdr) => {
  const d = typeof f === "string" ? fdr : f?.fdr;
  return {
    ...typeof f === "string" ? { opp: f.toUpperCase(), home: f === f.toUpperCase() } : { opp: String(f?.opp ?? "").toUpperCase(), home: !!f?.home },
    fdr: fin(d) && d >= 1 && d <= 5 ? Math.round(Number(d)) : null
  };
};
function fixturesAt(p, gw, horizon) {
  const i = gwIndex(gw, horizon);
  const day = p?.fixtures?.[i];
  return Array.isArray(day) ? day.map((f, j) => fixtureOf(f, p?.fdr?.[i]?.[j])) : null;
}
var oppText = (f) => f.home === false ? String(f.opp).toLowerCase() : String(f.opp).toUpperCase();
function oppLabel(fixtures) {
  if (!Array.isArray(fixtures)) return "";
  if (!fixtures.length) return DASH;
  return fixtures.map((f) => oppText(fixtureOf(f))).join(", ");
}
var oppSpoken = (fx) => !Array.isArray(fx) ? null : !fx.length ? "no fixture" : `vs ${fx.map((f) => fixtureOf(f)).map((f) => `${f.opp} (${f.home ? "home" : "away"}${f.fdr ? `, difficulty ${f.fdr}` : ""})`).join(" and ")}`;
var lookup = (players) => (id) => players instanceof Map ? players.get(Number(id)) ?? players.get(String(id)) : players?.[id];
var asSet = (s) => s == null ? null : new Set([...s].map(Number));
function node(id, p, o) {
  const pos = posName(p?.pos);
  const name = p?.name ?? `#${id}`;
  const xp = xpAt(p, o.gw, o.horizon);
  const fx = fixturesAt(p, o.gw, o.horizon);
  const st = statusInfo(p?.status, p?.chance);
  const isCap = id === o.captain, isVice = id === o.vice;
  const badge = isCap ? o.tc ? "3\xD7" : "C" : isVice ? "V" : null;
  const isIn = o.incoming?.has(id);
  const target = o.selectable?.has(id);
  const hl = o.highlight?.has(id);
  const dim = o.selectable && !target && !hl;
  const spoken = [
    name,
    [p?.club, pos].filter(Boolean).join(" "),
    isCap ? o.tc ? "triple captain" : "captain" : isVice ? "vice-captain" : null,
    xp != null ? `${fmt.pts(xp)} expected points` : null,
    oppSpoken(fx),
    st.tone !== "ok" ? p?.news ? `${st.label}: ${p.news}` : st.label : null,
    isIn ? "transferred in" : null
  ].filter(Boolean).join(", ");
  const kids = [
    h(
      "span.pp-kit",
      null,
      shirt({ club: p?.club, gk: pos === "GK", size: 64 }),
      badge ? h("span.pp-badge", { class: isCap ? "cap" : "vice", "aria-hidden": "true" }, badge) : null,
      statusDot(p?.status, { chance: p?.chance, news: p?.news }),
      isIn ? h("span.pp-in", { "aria-hidden": "true" }, "IN") : null
    ),
    h("span.pp-name", null, name),
    h(
      "span.pp-info",
      { class: { dgw: fx?.length > 1, blank: fx?.length === 0 } },
      h("b.pp-xp", null, xp == null ? DASH : fmt.pts(xp)),
      h("span.pp-opp", null, oppLabel(fx) || DASH)
    )
  ];
  const attrs = {
    class: [
      "pp-player",
      isCap && "is-cap",
      isIn && "is-in",
      target && "is-target",
      hl && "is-hl",
      dim && "is-dim",
      o.animate?.has(id) && "is-new"
    ],
    dataset: { id, pos: pos || "" },
    title: spoken,
    "aria-label": spoken
  };
  if (!o.onPlayer) return h("div", { ...attrs, role: "group" }, kids);
  return h("button", {
    ...attrs,
    type: "button",
    disabled: dim,
    "aria-pressed": hl ? "true" : null,
    onClick: (e) => o.onPlayer(id, e)
  }, kids);
}
function markings() {
  const id = uid("pp");
  const chalk = { class: "pp-chalk" };
  return svg(
    "svg",
    { class: "pp-lines", "aria-hidden": "true", width: "100%", height: "100%" },
    svg("defs", null, svg("clipPath", { id: `${id}-d` }, svg("rect", { x: 0, y: "17%", width: "100%", height: "100%" }))),
    svg("rect", { ...chalk, x: "21%", y: -2, width: "58%", height: "17%" }),
    svg("rect", { ...chalk, x: "37.5%", y: -2, width: "25%", height: "6.5%" }),
    svg("circle", { class: "pp-spot", cx: "50%", cy: "11.5%", r: 2 }),
    svg("circle", { ...chalk, cx: "50%", cy: "11.5%", r: "8.5%", "clip-path": `url(#${id}-d)` }),
    svg("circle", { ...chalk, cx: "50%", cy: "100%", r: "12%" }),
    svg("circle", { class: "pp-spot", cx: "50%", cy: "100%", r: 2.5 })
  );
}
function renderPitch({
  xi = [],
  bench = [],
  captain,
  vice,
  players = {},
  gw,
  horizon,
  chip,
  incoming,
  onPlayer,
  selectable = null,
  highlight = null,
  animate = null,
  caption = false
} = {}) {
  const P = lookup(players);
  const chipKey = chip ? String(chip).toLowerCase() : null;
  const o = {
    gw,
    horizon: horizon ?? gw,
    captain: fin(captain) ? Number(captain) : null,
    vice: fin(vice) ? Number(vice) : null,
    tc: chipKey === "tc",
    incoming: asSet(incoming),
    selectable: asSet(selectable),
    highlight: asSet(highlight),
    animate: asSet(animate),
    onPlayer
  };
  const rows = Object.fromEntries([...ROWS, "other"].map((r) => [r, []]));
  for (const id of xi) rows[posName(P(id)?.pos) || "other"].push(Number(id));
  const chipLabel = chipName(chipKey);
  const field = h(
    "div.pp-field",
    { role: "group", "aria-label": `Starting eleven${fin(gw) ? `, GW${gw}` : ""}` },
    markings(),
    chipLabel ? h(
      "span.pp-chip",
      { class: chipKey, title: chipLabel },
      h("span.pp-chip-long", null, chipLabel),
      h("span.pp-chip-short", null, chipKey.toUpperCase())
    ) : null,
    Object.entries(rows).filter(([, ids2]) => ids2.length).map(([pos, ids2]) => h("div.pp-row", { dataset: { pos } }, ids2.map((id) => node(id, P(id), o))))
  );
  let outfield = 0;
  const benchEl = bench?.length ? h(
    "div.pp-bench",
    { class: { boosted: chipKey === "bb" }, role: "group", "aria-label": "Bench, in order" },
    h("span.pp-bench-label", null, chipKey === "bb" ? "Bench Boost" : "Bench"),
    h("div.pp-bench-row", null, bench.map((raw) => {
      const id = Number(raw);
      const gk = posName(P(id)?.pos) === "GK";
      return h("div.pp-slot", null, h("span.pp-order", { "aria-hidden": "true" }, gk ? "GK" : ++outfield), node(id, P(id), o));
    }))
  ) : null;
  const nm = (id) => id == null ? DASH : P(id)?.name ?? `#${id}`;
  const cap = caption && (o.captain != null || bench?.length) ? h("p.pp-caption", null, `${o.tc ? "Triple captain" : "Captain"}: ${nm(o.captain)} \xB7 Vice: ${nm(o.vice)}${bench?.length ? " \xB7 Bench in order shown" : ""}`) : null;
  return h("div.pp", { dataset: { chip: chipKey || "" } }, field, benchEl, cap);
}
var PM_ROWS = [...ROWS, "other"];
var POS_WORD = { GK: "goalkeeper", DEF: "defender", MID: "midfielder", FWD: "forward" };
var PREVIEW_WORD = { O: "predicted out", D: "doubtful", DS: "doubtful", B: "predicted on the bench" };
var asSetOrNull = (s) => s ? asSet(s) : null;
var PW = 390;
var PH = 446;
var ROW_TOP = { GK: 13, DEF: 120, MID: 226, FWD: 332, other: 332 };
function availabilityTone(p) {
  if (!p) return null;
  const st = statusInfo(p.status, p.chance);
  if (st.tone === "bad" || st.chance != null && st.chance <= 25) return "red";
  if (st.tone === "warn") return "amber";
  return null;
}
var chanceText = (p) => {
  const st = statusInfo(p?.status, p?.chance);
  const c = st.chance ?? (st.tone === "bad" ? 0 : null);
  return c == null ? "" : `${c}%`;
};
function availabilityWords(p, first) {
  const st = statusInfo(p?.status, p?.chance);
  if (st.tone !== "ok" || st.chance === 0) return p?.news ? `${st.label}: ${p.news}` : st.label;
  return first ? PREVIEW_WORD[p?.ws_preview] ?? null : null;
}
var ORDER_KEY = "fc:pitch:order";
function storedOrder() {
  try {
    const v = JSON.parse(globalThis.localStorage?.getItem(ORDER_KEY) ?? "null");
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}
function storeOrder(rows) {
  try {
    globalThis.localStorage?.setItem(ORDER_KEY, JSON.stringify(rows));
  } catch {
  }
}
function arrangeRows(prev, xi, posOf) {
  const rows = {};
  const flips = /* @__PURE__ */ new Map();
  for (const r of PM_ROWS) {
    const now = xi.filter((id) => posOf(id) === r);
    const before = prev?.[r] || [];
    const incoming = now.filter((id) => !before.includes(id));
    const kept = [];
    for (const id of before) {
      if (now.includes(id)) kept.push(id);
      else if (before.length === now.length && incoming.length) {
        const n = incoming.shift();
        flips.set(n, id);
        kept.push(n);
      }
    }
    rows[r] = [...kept, ...incoming];
  }
  return { rows, flips };
}
var face = (p, side) => h(`span.pm-face.${side}`, null, shirt({ club: p?.club, gk: posName(p?.pos) === "GK", size: 64, turf: true, tall: true }));
var flag = (tone, words) => h(
  "span.pm-flag",
  { class: tone, "aria-hidden": "true" },
  svg("svg", { class: "pm-flag-g", viewBox: "0 0 15 13" }, ...tone === "red" ? [
    svg("circle", { class: "pm-flag-t", cx: 7.5, cy: 6.5, r: 6.1 }),
    svg("rect", { class: "pm-flag-i", x: 3.9, y: 5.5, width: 7.2, height: 2, rx: 0.4 })
  ] : [
    svg("path", { class: "pm-flag-t", d: "M7.5 .8 14.3 12.3H.7z" }),
    svg("rect", { class: "pm-flag-i", x: 6.8, y: 4.3, width: 1.4, height: 4.2, rx: 0.5 }),
    svg("circle", { class: "pm-flag-i", cx: 7.5, cy: 10.2, r: 0.85 })
  ]),
  words ? h("span.pm-flag-w", null, words) : null
);
function fplMarks(fpl, { xi = [], bench = [], captain = null } = {}) {
  const out = /* @__PURE__ */ new Map();
  if (!fpl || !Array.isArray(fpl.xi)) return out;
  const n = (v) => fin(v) ? Number(v) : null;
  const fxi = new Set(fpl.xi.map(Number)), fbench = new Set((fpl.bench || []).map(Number));
  const ids2 = { xi: xi.map(Number), bench: bench.map(Number) };
  const put = (id, k, v) => out.set(id, { move: null, arm: null, ...out.get(id), [k]: v });
  for (const id of ids2.xi) if (fbench.has(id)) put(id, "move", "start");
  for (const id of ids2.bench) if (fxi.has(id)) put(id, "move", "bench");
  const shown = /* @__PURE__ */ new Set([...ids2.xi, ...ids2.bench]);
  const fc = n(fpl.captain);
  if (fc != null && fc !== n(captain) && shown.has(fc)) put(fc, "arm", "c");
  return out;
}
var FPL_MOVE_SAID = { start: "on your FPL bench: the plan starts him", bench: "starts in your FPL team: the plan benches him" };
var FPL_ARM_SAID = { c: "your FPL captain" };
var fplBuySaid = (gw, by = null) => `not in your FPL team: the plan buys him in GW${gw}${by ? ` for ${by}` : ""}`;
var buyBackSaid = (gw, by = null) => `the plan buys him back in GW${gw}${by && by !== true ? ` for ${by}` : ""}`;
var platePts = (xp, mult = 1) => xp == null ? DASH : fmt.pts(Number(xp.toFixed(1)) * mult);
function secondPlate(id, p, o, fx, pts, approx) {
  const fxEl = () => h("span.pm-fx", null, !fx?.length ? oppLabel(fx) || DASH : fx.map((f, i) => [i ? ", " : null, h("span.pm-opp", {
    class: f.fdr ? `fdr-${f.fdr}` : null,
    dataset: { fdr: f.fdr ?? "" }
  }, oppText(f))]));
  const ptsEl = () => xpNum(pts, "b.pm-px", { class: { approx } });
  const s = o.second ?? "both";
  if (s === "fx") return [h("span.pm-pf", null, fxEl()), null];
  if (s === "pts") return [h("span.pm-pf", null, ptsEl()), null];
  if (typeof s === "object") {
    const text = s.text(id, p) ?? DASH, bar = s.bar?.(id, p);
    const plate = h("span.pm-pf.data", bar ? { class: `bar t${bar.tone}` } : null, h("b.pm-px", null, bar?.locked ? icon("lock", { size: 9 }) : text));
    if (bar) plate.style.setProperty("--pm-fill", `${bar.fill}%`);
    return [plate, `${s.label} ${text}`];
  }
  return [h("span.pm-pf", null, fxEl(), ptsEl()), null];
}
function fitFixtures(root) {
  const range2 = document.createRange();
  const over = (fx) => {
    const boxes = [fx, fx.closest(".pm-pf")].filter(Boolean);
    if (boxes.some((b) => b.scrollWidth > b.clientWidth)) return true;
    range2.selectNodeContents(fx);
    const r = fx.getBoundingClientRect();
    return r.width > 0 && range2.getBoundingClientRect().width > r.width + 0.01;
  };
  const fxs = [...root.querySelectorAll(".pm-fx")].filter((fx) => fx.querySelector(".pm-opp") && fx.nextElementSibling?.matches(".pm-px"));
  for (const fx of fxs) fx.parentElement.classList.remove("two", "nomark");
  const short = fxs.filter(over);
  for (const fx of short) fx.parentElement.classList.add("nomark");
  for (const fx of short.filter(over)) fx.parentElement.classList.replace("nomark", "two");
  const lone = [...root.querySelectorAll(".pm-pf:not(:has(.pm-fx)):has(.xp-u)")];
  for (const pf of lone) pf.classList.remove("nomark");
  for (const pf of lone.filter((x) => x.scrollWidth > x.clientWidth + 0.5)) pf.classList.add("nomark");
  const marked = [...root.querySelectorAll(".pm-pf:has(.xp-u)")];
  if (marked.some((pf) => pf.classList.contains("nomark"))) for (const pf of marked) pf.classList.add("nomark");
}
function card(id, P, o, { flipFrom = null, order = null } = {}) {
  const p = P(id);
  const pos = posName(p?.pos);
  const name = p?.name ?? `#${id}`;
  const fx = fixturesAt(p, o.gw, o.horizon);
  const xp = xpAt(p, o.gw, o.horizon);
  const isCap = id === o.captain, isVice = id === o.vice;
  const mult = isCap && o.capPoints ? o.tc ? 3 : 2 : 1;
  const tone = availabilityTone(p);
  const blank = Array.isArray(fx) && !fx.length;
  const low = !tone && !blank && xp != null && xp < 1;
  const dgw = fx?.length > 1;
  const bought = o.bought?.[id] ?? null;
  const sold = o.sold?.[id] ?? null;
  const approx = o.approx === true || !!o.approx?.has(id);
  const pts = platePts(xp, mult);
  const by = o.inFor?.[id];
  const tagIn = by != null || bought != null && bought === o.gw ? "IN" : null;
  const mk = o.marks?.get(id) ?? null;
  const [plate2, said] = secondPlate(id, p, o, fx, pts, approx);
  const spoken = [
    order ? `${order}: ${name}` : name,
    POS_WORD[pos],
    p?.club,
    isCap ? o.tc ? "triple captain" : "captain" : isVice ? "vice-captain" : null,
    FPL_ARM_SAID[mk?.arm] ?? null,
    FPL_MOVE_SAID[mk?.move] ?? null,
    xp == null ? null : `${approx ? "about " : ""}${mult > 1 ? `${fmt.pts(xp)} times ${mult}` : pts} expected points${dgw ? ", double gameweek" : ""}`,
    oppSpoken(fx),
    availabilityWords(p, o.first),
    bought != null ? fplBuySaid(bought, tagIn && by !== true ? by : null) : by != null ? buyBackSaid(o.gw, by) : null,
    sold != null ? `sold in GW${sold}` : null,
    said
  ].filter(Boolean).join(", ") + (o.why?.has(id) ? "; shows why" : "");
  const kids = [
    h(
      "span.pm-kit",
      null,
      h("span.pm-flip", { class: { from: flipFrom != null } }, face(p, "front"), flipFrom != null ? face(P(flipFrom), "back") : null),
      isCap || isVice ? h(
        "span.pm-badge",
        { class: isCap ? ["c", o.tc && "tc"] : "v", dataset: { badge: isCap ? "c" : "v" }, "aria-hidden": "true" },
        isCap ? o.tc ? "3\xD7" : "C" : "V"
      ) : null,
      tone ? flag(tone, chanceText(p)) : null,
      sold != null ? h("span.pm-out", { "aria-hidden": "true" }, `OUT GW${sold}`) : null
    ),
    h("span.pm-plate", { class: { chg: flipFrom != null }, "aria-hidden": "true" }, h("span.pm-pn", null, name), plate2)
  ];
  const attrs = {
    class: [
      order ? "pm-bs" : "pm-pl",
      "pm-card",
      tone && `f-${tone}`,
      low && "low",
      bought != null && "bought",
      tagIn && "is-in",
      sold != null && "sold",
      blank && "blank",
      o.animate?.has(id) && "new"
    ],
    dataset: { id, pos: pos || "", pts },
    "aria-label": spoken
  };
  return o.onPlayer ? h("button", { ...attrs, type: "button", onClick: (e) => o.onPlayer(id, e) }, kids) : h("div", { ...attrs, role: "img" }, kids);
}
function turf() {
  const bands2 = 11, bh = PH / bands2;
  const box = { viewBox: `0 0 ${PW} ${PH}`, preserveAspectRatio: "none", "aria-hidden": "true" };
  const chalk = (tag, a) => svg(tag, { class: "pm-chalk", ...a });
  const net = [];
  for (let x = 167; x <= 223; x += 5) net.push(svg("line", { x1: x, y1: 1, x2: x, y2: 25 }));
  for (let y = 5; y <= 25; y += 5) net.push(svg("line", { x1: 164, y1: y, x2: 226, y2: y }));
  return [
    h("div.pm-turf", null, svg(
      "svg",
      { class: "pm-lines", ...box },
      // the last band is turf-1, so it runs on into the bench's fade
      Array.from({ length: bands2 }, (_, i) => svg("rect", { class: (bands2 - 1 - i) % 2 ? "pm-band b" : "pm-band", x: 0, y: i * bh, width: PW, height: bh + 0.5 })),
      chalk("path", { d: "M-2 107 L44 25 H346 L392 107" }),
      // touchlines and goal line
      chalk("path", { d: "M103 25 L84 66 H306 L287 25" }),
      // penalty area
      chalk("path", { d: "M150 25 L147 45 H243 L240 25" }),
      // goal area
      chalk("path", { d: "M155 66 Q195 84 235 66" }),
      // penalty arc
      chalk("path", { d: "M51 25 Q49.2 34 40.6 31.1 M339 25 Q340.8 34 349.4 31.1" }),
      // corner arcs, 7 units round each corner
      chalk("line", { x1: 0, y1: 303, x2: PW, y2: 303 }),
      // halfway line, through the MID plates
      chalk("ellipse", { cx: 195, cy: 303, rx: 64, ry: 54 })
    )),
    svg(
      "svg",
      { class: "pm-goal", ...box },
      svg("rect", { class: "pm-goal-in", x: 164, y: 0, width: 62, height: 25 }),
      svg("g", { class: "pm-net" }, net),
      svg("path", { class: "pm-goal-frame", d: "M164 25 V1 H226 V25" })
    )
  ];
}
var benchLabel = (chipKey) => chipKey === "bb" ? "Bench, in order (Bench Boost: it counts)" : "Bench, in order";
function subOrder(bench, posOf) {
  let n = 0;
  return new Map((bench || []).map(Number).map((id) => [id, posOf(id) === "GK" ? null : ++n]));
}
var benchTag = (pos, n) => n == null ? posCode(pos) ?? "GKP" : `${n} \xB7 ${posCode(pos) ?? ""}`;
var benchNth = (n) => n == null ? "" : fmt.ordinal(n);
var benchOrder = (n) => n == null ? "goalkeeper" : `substitute ${n}`;
var benchTagSaid = (pos, n, name) => `${benchTag(pos, n)}, ${benchOrder(n)}: ${name}, pick who he replaces`;
function benchPanel(bench, P, o, posOf, chipKey) {
  const nos = subOrder(bench, posOf);
  const bo = { ...o, captain: null, vice: null, animate: null };
  return h("div.pm-benchzone", null, h(
    "div.pm-bench",
    { role: "group", "aria-label": benchLabel(chipKey) },
    bench.map((id) => {
      const n = nos.get(id), order = benchOrder(n), pos = P(id)?.pos;
      const t = benchTag(pos, n), at2 = t.indexOf(" \xB7 ");
      const tag = h("span", null, at2 < 0 ? h("span.pm-blp", null, t) : [t.slice(0, at2), h("span.pm-blo", null, benchNth(n).slice(String(n).length)), h("span.pm-blp", null, t.slice(at2))]);
      return h(
        "div.pm-slot",
        null,
        o.onBench ? h("button.pm-bl", { type: "button", dataset: { id }, "aria-label": benchTagSaid(pos, n, P(id)?.name ?? `#${id}`), onClick: (e) => o.onBench(id, e) }, tag) : h("span.pm-bl", { "aria-hidden": "true" }, tag),
        card(id, P, bo, { order })
      );
    })
  ));
}
function armbandHop(root, fromRect, captain) {
  const to = root.querySelector(`.pm-pl[data-id="${captain}"] .pm-badge.c`);
  if (!to || !fromRect?.width) return;
  const box = root.getBoundingClientRect();
  const tr = to.getBoundingClientRect();
  const x0 = fromRect.left - box.left, y0 = fromRect.top - box.top;
  const x1 = tr.left - box.left, y1 = tr.top - box.top;
  const fly = h("span.pm-badge.c.pm-fly", { "aria-hidden": "true" }, to.textContent);
  root.append(fly);
  to.style.visibility = "hidden";
  const at2 = (x, y, s = 1) => ({ transform: `translate(${x}px, ${y}px) scale(${s})` });
  const anim = fly.animate(
    [at2(x0, y0), at2((x0 + x1) / 2, Math.min(y0, y1) - 34, 1.35), at2(x1, y1)],
    { duration: 220, easing: "cubic-bezier(.3, .7, .3, 1)" }
  );
  anim.onfinish = anim.oncancel = () => {
    fly.remove();
    to.style.visibility = "";
    to.closest(".pm-pl")?.classList.add("bump");
  };
}
function pitchCard(id, { players = {}, gw, horizon, second = "both", bought = null, inFor = null, approx = false, onPlayer = null, order = null, first = false } = {}) {
  const o = {
    gw,
    horizon: horizon ?? gw,
    first,
    capPoints: false,
    onPlayer,
    bought,
    inFor,
    second,
    captain: null,
    vice: null,
    approx: approx === true ? true : asSetOrNull(approx),
    marks: /* @__PURE__ */ new Map()
  };
  return card(Number(id), lookup(players), o, { order });
}
function mountPitch(host, {
  xi = [],
  bench = [],
  captain,
  vice,
  chip,
  players = {},
  gw,
  horizon,
  first = false,
  bought = null,
  inFor = null,
  second = "both",
  sold = null,
  approx = false,
  capPoints = false,
  animate,
  flip = true,
  benchRow = false,
  fpl = null,
  onPlayer,
  onBench = null,
  label,
  why = null,
  gapRows = false
} = {}) {
  const P = lookup(players);
  const st = host._pm || (host._pm = { rows: null, cap: null });
  const chipKey = chip ? String(chip).toLowerCase() : null;
  const o = {
    gw,
    horizon: horizon ?? gw,
    first,
    capPoints,
    sold,
    onPlayer,
    onBench,
    tc: chipKey === "tc",
    bought,
    inFor,
    second,
    captain: fin(captain) ? Number(captain) : null,
    vice: fin(vice) ? Number(vice) : null,
    why: asSetOrNull(why),
    animate: asSetOrNull(animate),
    approx: approx === true ? true : asSetOrNull(approx),
    // computed once over XI and bench: a bench card is drawn without the plan's armbands (benchPanel), never its marks
    marks: fplMarks(fpl, { xi: xi || [], bench: bench || [], captain, vice })
  };
  const posOf = (id) => posName(P(id)?.pos) || "other";
  const benchIds = (bench || []).map(Number);
  const { rows, flips } = arrangeRows(flip ? st.rows ?? storedOrder() : null, (xi || []).map(Number), posOf);
  if (!st.rows) flips.clear();
  const old = host.querySelector(":scope > .pm");
  const hop = old && !reduceMotion() && st.cap != null && o.captain != null && st.cap !== o.captain ? old.querySelector(`.pm-pl[data-id="${st.cap}"] .pm-badge.c`)?.getBoundingClientRect() : null;
  const rowsEl = h("div.pm-rows", null, PM_ROWS.filter((r) => rows[r].length).map((r) => h(
    "div.pm-row",
    { dataset: { pos: r, n: rows[r].length }, style: { [gapRows ? "--pm-share" : "top"]: `${ROW_TOP[r] / PH * 100}%` } },
    rows[r].map((id) => card(id, P, o, { flipFrom: flips.get(id) ?? null }))
  )));
  const field = h(
    "div.pm-field",
    { role: "group", "aria-label": label ?? `Starting eleven${fin(gw) ? `, GW${gw}` : ""}` },
    turf(),
    rowsEl
  );
  const root = h(
    "div.pm",
    { dataset: { chip: chipKey || "", ...gapRows ? { rows: "gap" } : {} } },
    field,
    benchRow && benchIds.length ? benchPanel(benchIds, P, o, posOf, chipKey) : null
  );
  host.replaceChildren(root);
  const fitKey = (r) => `${host.clientWidth}|${r.querySelector(".pm-plate")?.offsetHeight}`;
  fitFixtures(root);
  st.fit = fitKey(root);
  document.fonts?.ready.then(() => {
    if (root.isConnected) fitFixtures(root);
  });
  if (!st.ro && typeof ResizeObserver === "function") {
    st.ro = new ResizeObserver(() => {
      const r = host.querySelector(":scope > .pm");
      if (r && fitKey(r) !== st.fit) {
        st.fit = fitKey(r);
        fitFixtures(r);
      }
    });
    st.ro.observe(host);
  }
  const plate = root.querySelector(".pm-plate");
  if (st.ro && plate) {
    if (st.plate) st.ro.unobserve(st.plate);
    st.ro.observe(plate);
    st.plate = plate;
  }
  const flipping = root.querySelectorAll(".pm-flip.from");
  if (flipping.length) {
    void root.offsetWidth;
    for (const f of flipping) f.classList.remove("from");
  }
  if (hop) armbandHop(root, hop, o.captain);
  st.rows = rows;
  st.cap = o.captain;
  if (flip) storeOrder(rows);
  return host;
}
function setPitchChip(host, chip) {
  const root = host?.querySelector(":scope > .pm");
  const chipKey = chip ? String(chip).toLowerCase() : null;
  if (!root?.querySelector(":scope > .pm-field > .pm-rows") || [chipKey, root.dataset.chip].includes("tc")) return false;
  root.querySelector(":scope > .pm-benchzone > .pm-bench")?.setAttribute("aria-label", benchLabel(chipKey));
  root.dataset.chip = chipKey || "";
  return true;
}

// js/m/memory/values.js
function holdOf(list = [], { A, end, owned = [] } = {}) {
  const user = (list || []).filter((p) => p && p.id !== "hold");
  const c = composePins(user, { from: A, to: end });
  const rp = user.find((p) => p.id === "road" && p.locked);
  const frozen = rp ? pinFrozen(rp, A) : [];
  let squad = ids(owned), known = true;
  const rolls = [], must = [], excl = [], hits = {}, caps = {}, debts = [];
  let owes = false;
  const owe = (g) => {
    if (owes) debts.push(g);
  };
  for (const g of range(A, end)) {
    const chip = c.chips[g];
    if (frozen.includes(g)) {
      const held = heldAt(rp.must, g);
      if (known && idsKey(held) === idsKey(squad)) rolls.push(g);
      squad = held;
      known = true;
      owe(g);
      continue;
    }
    if (chip === "wc") {
      known = false;
      continue;
    }
    if (chip === "fh") continue;
    if (c.rolls.includes(g)) {
      owe(g);
      continue;
    }
    const free = user.some((p) => kindOf(p) === "hits" && Object.keys(p.hits || {}).map(Number).includes(g));
    const moving = known ? user.filter((p) => !["road", "chip", "cash", "hits", "roll"].includes(kindOf(p)) && (!isExact(p) || num(p.gw) === g) && movedAt(p, g, squad).length) : user.filter((p) => ["sell", "slide", "wish"].includes(kindOf(p)) && num(p.gw) === g);
    if (!free && !moving.length) {
      rolls.push(g);
      owe(g);
      continue;
    }
    if (!free && known && moving.every(isExact)) {
      const outs = new Set(moving.map((p) => Number(kindOf(p) === "slide" ? p.out : p.player)));
      const ins = moving.map((p) => Number(kindOf(p) === "slide" ? p.player : p.in));
      squad = [...squad.filter((x) => !outs.has(x)), ...ins.filter((x) => !squad.includes(x))];
      must.push(...squad.map((x) => [x, g, g]));
      owes = true;
      owe(g);
      continue;
    }
    const open = (p) => kindOf(p) === "sell" && p.in == null;
    if (!free && known && moving.some(open) && moving.every((p) => isExact(p) || open(p))) {
      const outs = new Set(moving.map((p) => Number(kindOf(p) === "slide" ? p.out : p.player)));
      const ins = moving.filter(isExact).map((p) => Number(kindOf(p) === "slide" ? p.player : p.in));
      must.push(...[...squad.filter((x) => !outs.has(x)), ...ins.filter((x) => !squad.includes(x))].map((x) => [x, g, g]));
      caps[g] = moving.length;
      known = false;
      continue;
    }
    if (!free && !known && moving.length && moving.every(isExact)) {
      for (const p of moving) {
        const o = Number(kindOf(p) === "slide" ? p.out : p.player), i = Number(kindOf(p) === "slide" ? p.player : p.in);
        if (g > A) {
          must.push([o, ids(owned).includes(o) ? A : g - 1, g - 1]);
          excl.push([i, A, g - 1]);
        }
      }
      caps[g] = moving.length;
      owes = true;
      owe(g);
      continue;
    }
    if (!free && !known) hits[g] = 0;
    known = false;
  }
  if (!rolls.length && !must.length && !excl.length && !Object.keys(hits).length && !Object.keys(caps).length) return { pin: null };
  const pin = makePin({ id: "hold", kind: "hold", label: "No transfers unless you add them", gw: A, must, excl, hits, rolls, ...Object.keys(caps).length ? { caps } : {}, ...debts.length ? { debts } : {} });
  return { pin };
}
function solvedLineup(roads, g, sq, chip) {
  const k = idsKey(sq);
  const w = roads.filter((r) => r?.weeks?.length).map((r) => weekAt(r, g)).find((x) => x && squadKey(x) === k && (x.chip ?? null) === chip);
  return w ? { xi: ids(w.xi), bench: ids(w.bench), captain: num(w.captain), vice: num(w.vice) } : null;
}
var firstPlanValues = (cctx, planDefault = "hold") => {
  const values = planValues(cctx, []);
  return planDefault === "hold" ? { ...values, to: values.from_r } : values;
};
function unbuyableDropped(spec, rolls, from, squad = []) {
  if (!spec) return "";
  const owned = new Set(ids((squad || []).map((s) => s?.id ?? s))), rolled = new Set(ids(rolls));
  let free = from;
  while (rolled.has(free)) free++;
  return spanString(parseSpans(spec).map(([id, a, b]) => [id, owned.has(id) ? a : Math.max(a, free), b]).filter(([, a, b]) => a <= b));
}
function shortWeeks(cctx, c) {
  if (!c.debts.length) return [];
  const L = playerLookup({ base: cctx.base, players: cctx.players });
  const moves = String(c.for_gw ?? "").split(",").filter(Boolean).map((t) => t.split(":").map(Number));
  let bank = c.cash != null ? Number(c.cash) / 10 : Number(cctx.base?.bank ?? 0);
  const short = /* @__PURE__ */ new Set();
  for (const g of cctx.gws) {
    for (const [x, out, inn] of moves) if (x === g) bank += (L.sellT(out) ?? L.priceT(out) ?? 0) / 10 - (L.price(inn) ?? 0);
    if (bank < -1e-9) short.add(g);
  }
  return c.debts.filter((g) => short.has(Number(g)));
}
function planValues(cctx, list) {
  const gws = cctx.gws;
  const c = composePins(list, { from: gws[0], to: gws.at(-1) });
  let draft = createDraft({ name: "Your plan" });
  for (const [g, chip] of Object.entries(c.chips)) draft = setChip(draft, Number(g), chip);
  const { values } = solveValues({
    base: cctx.base,
    draft,
    horizon: gws,
    maxHitsGw: c.hits,
    hitCap: hitCap(cctx.model),
    chipDefaults: cctx.meta?.chip_defaults,
    players: cctx.players
  });
  if (c.sent_must) values.must_have = c.sent_must;
  const exclude = unbuyableDropped(c.sent_exclude, c.rolls, gws[0], cctx.base?.squad);
  if (exclude) values.exclude = exclude;
  if (c.for_gw) values.for_gw = c.for_gw;
  if (c.rolls.length) values.no_buys_gw = c.rolls.join(",");
  const capped = Object.entries(c.caps).sort(([a], [b]) => a - b);
  if (capped.length) values.max_buys_gw = capped.map(([g, n]) => `${g}:${n}`).join(",");
  const debts = shortWeeks(cctx, c);
  if (debts.length) values.debt_gw = debts.join(",");
  if (c.not_for) values.not_for = c.not_for;
  if (c.cash !== null) values.cash = c.cash;
  if (cctx.gap?.now > 0) values.gap = cctx.gap.now;
  if (cctx.gap?.later > 0) values.later_gap = cctx.gap.later;
  return values;
}
function roadCaps(v, gws) {
  const own = parseCaps(v?.max_hits_gw);
  return Object.fromEntries(gws.map((g) => [g, num(own[g]) ?? num(v?.max_hits)]));
}
function forcedHits(road, gws = (road?.weeks || []).map((w) => Number(w.gw))) {
  if (!road?.values || !road.weeks?.length) return [];
  const caps = roadCaps(road.values, gws);
  const book = new Map((hitBook(road) || []).map((b) => [b.gw, b]));
  const relief = road.planner ? !!road.planner.relief : true;
  return road.weeks.filter((w) => {
    const g = Number(w.gw), n = num(w.hits) ?? 0;
    return gws.includes(g) && n > 0 && (n > (caps[g] ?? Infinity) || (book.get(g)?.unpriced ?? 0) > 0);
  }).map((w) => {
    const g = Number(w.gw), cap = caps[g] ?? null, b = book.get(g);
    const cause = b?.from.length && !b.unpriced ? "moved" : relief && b?.lp > 0 ? "relief" : null;
    return { gw: g, hits: num(w.hits), cap, allowed: cap === null || num(w.hits) <= cap, ft: num(w.ft_avail), buys: ids(w.in).length, cause, from: b?.from ?? [] };
  });
}
function idleRules(list = [], { from = 1, to = LAST_ROUND, hitCap: hitCap2 = null } = {}) {
  const chips = composePins(list, { from, to }).chips;
  const remade = (g) => chips[g] === "wc" || chips[g] === "fh";
  return (list || []).filter((p) => {
    if (isRoll(p)) return remade(num(p.gw));
    if (kindOf(p) !== "hits") return false;
    const caps = capsOf(p, from, to);
    return caps.length > 0 && caps.every(([g, n]) => remade(g) || hitCap2 !== null && n >= hitCap2);
  }).map((p) => p.id);
}
var chipRounds = (v, chip) => [].concat(v?.[chip] ?? []).map(String).filter((g) => g !== "0").sort().join(",");
var parseRolls = (spec) => String(spec ?? "").split(",").map((t) => Number(t.trim())).filter((g) => Number.isInteger(g) && g > 0);
function roadFits(road, c, gws) {
  const v = road?.values;
  if (!v || !road.weeks?.length || !sameOptions(v, c, gws, road)) return false;
  const own = ownPins(v, gws);
  for (const [id, byGw] of own.cells) for (const [g, { want }] of byGw) if (c.cells.get(id)?.get(g)?.want !== want) return false;
  if (parseRolls(v.no_buys_gw).some((g) => !c.rolls.includes(g)) || c.rolls.some((g) => movesIn(road, g))) return false;
  const buysAt = (g) => {
    const w = weekAt(road, g);
    return w ? ids(w.in).length : 0;
  };
  if (Object.entries(c.caps ?? {}).some(([g, n]) => buysAt(Number(g)) > n)) return false;
  if (String(v.max_buys_gw ?? "").split(",").filter(Boolean).some((t) => {
    const [g, n] = t.split(":").map(Number);
    return !(c.caps?.[g] <= n);
  })) return false;
  if (parseRolls(v.debt_gw).some((g) => !c.debts?.includes(g) && (num(weekAt(road, g)?.bank) ?? 0) < -1e-9)) return false;
  const refused = c.notFor ?? [];
  if (String(v.not_for ?? "").split(",").filter(Boolean).some((t) => !refused.includes(t))) return false;
  if (refused.some((t) => {
    const [g, o, i] = t.split(":").map(Number), w = weekAt(road, g);
    return ids(w?.out).includes(o) && ids(w?.in).includes(i);
  })) return false;
  return brokenCells(road, c).length === 0;
}
var ownPins = (v, gws) => solvedFor(v, gws).own ??= composePins([{ id: "road", must: v.must_have || "", excl: v.exclude || "" }], { from: gws[0], to: gws.at(-1) });
var SOLVES = { asked: 0 };
var SOLVE_KINDS = { heal: "Your team", chip: "your chip", cash: "your bank", wish: "a wish", speculative: "without your transfers", chipprep: "a chip, ahead", pair: "a choice", pairnext: "a choice, ahead", presolve: "a tap, ahead", plan: "the plan" };
var ANSWERED = /* @__PURE__ */ new Map();
function noteAnswer(key, said, road) {
  if (key == null) return;
  ANSWERED.set(key, { at: ANSWERED.get(key)?.at ?? Date.now(), ...said, byKey: String(road?.from ?? road?.key ?? "").slice(-8), job: road?.job ?? null });
}
function solveKept(api, args, opts, said = {}) {
  SOLVES.asked++;
  const p = api.solve({ ...args, said: { gw: said.gw ?? (Number(args.values?.from_r) || null), kind: said.kind ?? SOLVE_KINDS[args.purpose] ?? args.purpose, what: said.what ?? "your rules as set" } }, opts);
  const q = p.then((r) => {
    const v = r?.road?.values;
    const gws = (r?.road?.weeks || []).map((w) => Number(w.gw));
    const broken = r?.state === "done" && v && gws.length ? brokenCells(r.road, ownPins(v, gws)).filter((x) => x.want === "in") : [];
    if (!broken.length) return r;
    const g = Math.min(...broken.map((x) => x.gw));
    const dropped = broken.map((x) => ({ id: x.id, gw: x.gw })).sort((a, b) => a.gw - b.gw);
    return { ...r, state: "error", road: null, error: { code: "infeasible", plain: COPY.infeasible(g), detail: `the solve dropped ${broken.map((x) => `${x.id}@${x.gw} ${x.want}`).join(", ")}`, dropped } };
  });
  q.cancel = p.cancel;
  return q;
}
function brokenCells(road, c) {
  const out = [];
  for (const [id, byGw] of c.cells) {
    for (const [g, { want, pin }] of byGw) {
      const w = weekAt(road, g);
      if (!w || squadOf(w).includes(id) !== (want === "in")) out.push({ id, gw: g, want, pin });
    }
  }
  return out;
}
function rulesBroken(road, list = [], { from, to } = {}) {
  const c = composePins(list, { from, to });
  const ids0 = new Set(brokenCells(road, c).map((x) => x.pin));
  for (const p of list) {
    const rg = num(p.gw);
    if (isRoll(p) && rg !== null && rg >= from && rg <= to && movesIn(road, rg, c.caps[rg] ?? 0)) ids0.add(p.id);
    const inside = (g) => Number(g) >= from && Number(g) <= to;
    if (!isRoll(p)) {
      for (const g of p.rolls || []) if (inside(g) && movesIn(road, Number(g))) ids0.add(p.id);
    }
    if (!isRoll(p)) {
      for (const [g, n] of Object.entries(p.caps || {})) if (inside(g) && movesIn(road, Number(g), Number(n))) ids0.add(p.id);
    }
    for (const [g, chip] of Object.entries(p.chips || {})) {
      if (Number(g) < from || Number(g) > to) continue;
      const has = weekAt(road, g)?.chip ?? null;
      if (chip === "none" ? has !== null : has !== chip) ids0.add(p.id);
    }
  }
  return list.filter((p) => ids0.has(p.id));
}
function ruleText(p, nameOf = (id) => `#${id}`, { end, start, cap = null, hold = false } = {}) {
  const r = ruleWords(p, nameOf, { end, start, cap, hold });
  return p?.via ? { ...r, desc: `${r.desc} It came with the alternative you picked; picking another takes it back.`, via: true } : r;
}
function ruleWords(p, nameOf, { end, start, cap = null, hold = false } = {}) {
  const nm = (id) => nameOf(Number(id));
  const to = end ?? Math.max(...[...p.must || [], ...p.excl || []].map(([, , b]) => b), Number(p.gw) || 0);
  const kind = kindOf(p);
  const g = num(p.gw);
  switch (kind) {
    case "road":
      if (p.locked) {
        const f = pinFrozen(p, g), many = f.length > 1;
        return { icon: "lock", text: `${span(f)} frozen`, desc: `${span(f)} ${many ? "are" : "is"} as you froze ${many ? "them" : "it"}. Turn off Freeze GW${f[0]} to change ${many ? "them" : "it"}.`, removable: false };
      }
      return { icon: "check", text: `GW${g}: ${p.label || "your pick"}`, desc: `The move you picked for GW${g}.`, removable: true };
    case "veto":
    case "never": {
      const sc = scopeOf(p, { start, end: to });
      const one = /^GW\d+$/.test(sc);
      return {
        icon: "ban",
        text: `Not ${nm(p.player)}${sc ? ` \xB7 ${sc}` : ""}`,
        scope: one ? "gw" : "all",
        removable: true,
        desc: one ? `The plan doesn't buy ${nm(p.player)} in ${sc}; it may later.` : `The plan never buys ${nm(p.player)}${g ? ` in ${COPY.range(g, to)}` : ""}.`
      };
    }
    case "notfor":
      return {
        icon: "ban",
        text: `Not ${nm(p.player)} for ${nm(p.out)} \xB7 GW${g}`,
        removable: true,
        desc: `The plan doesn't swap ${nm(p.out)} for ${nm(p.player)} in GW${g}. ${nm(p.player)} can still come for someone else, and ${nm(p.out)} can still go for someone else.`
      };
    case "keep": {
      const sc = scopeOf(p, { start, end: to });
      const one = /^GW\d+$/.test(sc);
      const win = !sc || sc === "all weeks" || sc.startsWith("from") ? span([Math.max(g ?? 0, start ?? 0) || to, to]) : sc;
      return {
        icon: "lock",
        text: `Keep ${nm(p.player)}${sc ? ` \xB7 ${sc === "all weeks" ? win : sc}` : ""}`,
        scope: one ? "gw" : "all",
        removable: true,
        desc: one ? `The plan keeps ${nm(p.player)} in ${sc}; it may sell him in another week.` : `Forkcast never sells ${nm(p.player)} in ${win}.`
      };
    }
    case "sell":
      return {
        icon: "arrow",
        text: p.in != null ? `${nm(p.player)} \u2192 ${nm(p.in)} \xB7 GW${g}` : `Sell ${nm(p.player)} from GW${g}`,
        desc: p.in != null ? `${nm(p.player)} goes in GW${g} and ${nm(p.in)} comes in.` : `${nm(p.player)} goes in GW${g}; the plan picks his replacement.`,
        removable: true
      };
    case "wish":
      if (p.chip) return { icon: "plus", text: `${nm(p.player)} in your GW${g} ${chipName(p.chip)}`, desc: `${nm(p.player)} is in your GW${g} ${chipName(p.chip)} squad; the chip picks the rest.`, removable: true };
      return { icon: "plus", text: `${nm(p.player)} from GW${g}`, desc: `The plan brings ${nm(p.player)} in by GW${g} and keeps him through GW${to}.`, removable: true };
    case "slide":
      return { icon: "swap", text: p.label || `${nm(p.out)} \u2192 ${nm(p.player)} in GW${g}`, desc: `That move is made in GW${g}.`, removable: true };
    case "chip": {
      const [cg, c] = Object.entries(p.chips || {})[0] || [g, null];
      return c && c !== "none" ? { icon: "play", text: `${c.toUpperCase()} \xB7 GW${cg}`, desc: `${chipName(c)} is planned for GW${cg}.`, removable: true } : { icon: "stop", text: `No chip \xB7 GW${cg}`, desc: `No chip in GW${cg}.`, removable: true };
    }
    case "roll":
      return {
        icon: "reset",
        text: COPY.rollRule(g, rollKeeps(p)),
        removable: true,
        desc: rollKeeps(p) ? `Forkcast adds no transfers of its own in GW${g}.` : `Forkcast makes no transfers in GW${g}: the free transfer rolls on.`
      };
    case "hits": {
      const [[cg, n] = [g, p.max_hits || 1]] = Object.entries(p.hits || {});
      const without = hold ? ` Without it: no transfers in GW${cg}.` : cap != null ? ` Without it: ${COPY.defaultHits(cap, cg).replace(/^U/, "u")}.` : "";
      if (!num(n)) return { icon: "minus", text: `${COPY.segFreeOnly} \xB7 GW${cg}`, desc: `${COPY.gwNote.free(cg)}${without}`, removable: true };
      return { icon: "minus", text: `Up to \u2212${HIT_COST * n} \xB7 GW${cg}`, desc: `${COPY.hitsUpTo(n, cg)} only: the plan takes a hit only where its count says it pays.${without}`, removable: true };
    }
    case "cash":
      return { icon: "info", text: `Bank as FPL shows`, desc: "Your plan starts from the bank FPL showed you.", removable: true };
    default:
      return { icon: "info", text: p.label || kind || "rule", desc: p.label || "", removable: true };
  }
}
function findRoad(model, c, gws, also = []) {
  let by = MODEL_FIT.get(model ?? MODEL_FIT);
  if (!by) MODEL_FIT.set(model ?? MODEL_FIT, by = /* @__PURE__ */ new Map());
  const k = `${gws.join(",")}#${sigOf(c)}`;
  if (!by.has(k)) by.set(k, model?.weeks?.length && roadFits(model, c, gws) ? model : null);
  return by.get(k) ?? also.filter((r) => r?.weeks?.length).find((r) => roadFits(r, c, gws)) ?? null;
}
var MODEL_FIT = /* @__PURE__ */ new WeakMap();
function sameOptions(v, c, gws, road = null) {
  if (num(v.from_r) !== gws[0] || num(v.w) !== gws.length) return false;
  const { caps, chips } = solvedFor(v, gws);
  const capFits = (g) => {
    const mine = c.hits[g] ?? null, its = caps[g];
    if (mine === its) return true;
    const hits = num(weekAt(road, g)?.hits);
    return mine !== null && (its === null || mine < its) && hits !== null && hits <= mine;
  };
  if (!gws.every(capFits) || (num(v.cash) ?? null) !== c.cash) return false;
  const want = chipsAsked(c);
  return CHIPS.every((chip) => chips[chip] === want[chip]);
}
var SOLVED_FOR = /* @__PURE__ */ new WeakMap();
function solvedFor(v, gws) {
  const k = gws.join(",");
  let by = SOLVED_FOR.get(v);
  if (!by) SOLVED_FOR.set(v, by = /* @__PURE__ */ new Map());
  if (!by.has(k)) by.set(k, { caps: roadCaps(v, gws), chips: Object.fromEntries(CHIPS.map((chip) => [chip, chipRounds(v, chip)])), own: null });
  return by.get(k);
}
var CHIPS_ASKED = /* @__PURE__ */ new WeakMap();
function chipsAsked(c) {
  if (!CHIPS_ASKED.has(c)) CHIPS_ASKED.set(c, Object.fromEntries(CHIPS.map((chip) => [chip, Object.entries(c.chips).filter(([, x]) => x === chip).map(([g]) => g).sort().join(",")])));
  return CHIPS_ASKED.get(c);
}
var optionPins = (list = []) => (list || []).filter((p) => p.id === "road" && !!p.locked || ["chip", "cash"].includes(kindOf(p)));
function optionsRoad(model, list, gws, also = []) {
  return findRoad(model, composePins(optionPins(list), { from: gws[0], to: gws.at(-1) }), gws, also);
}
var optionsValues = (cctx, list) => planValues(cctx, optionPins(list));

// js/m/memory/drift.js
function watched(cctx, evaluation, pinList) {
  const s = evaluation.gws.find((x) => x.gw === cctx.A);
  const asked = composePins(pinList.filter((p) => p.kind !== "road"), { from: cctx.A, to: LAST_ROUND }).must.map(([id]) => id);
  return [.../* @__PURE__ */ new Set([...ids(s?.xi), ...asked])];
}
function legality(cctx, evaluation, pinList = []) {
  const L = playerLookup({ base: cctx.base, players: cctx.players });
  const out = [];
  for (const id of watched(cctx, evaluation, pinList)) {
    const row = L.get(id)?.row;
    if (OUT[statusInfo(row?.status, row?.chance).code]) out.push({ code: "status", id, gw: cctx.A, text: statusText(L.name(id), row) });
  }
  for (const s of evaluation.gws.filter((x) => num(x.bank) !== null && x.bank < -EPS)) {
    out.push({ code: "budget", gw: s.gw, short: -s.bank, text: `your plan is ${fmt.money(-s.bank)} over budget in GW${s.gw}` });
  }
  for (const s of evaluation.gws) {
    const n = /* @__PURE__ */ new Map();
    for (const p of s.squad) {
      const c = L.club(p);
      if (c) n.set(c, (n.get(c) || 0) + 1);
    }
    const over = [...n].find(([, k]) => k > MAX_PER_CLUB);
    if (over) {
      out.push({ code: "club", gw: s.gw, club: over[0], count: over[1], text: `your plan has ${over[1]} ${over[0]} players in GW${s.gw}` });
      break;
    }
  }
  return out;
}
var sameSquads = (a, b) => a.gws.length === b.gws.length && a.gws.every((s, i) => [...s.squad].sort().join() === [...b.gws[i]?.squad || []].sort().join());
function sinceText(epoch, now = Date.now()) {
  const ms = Number(epoch) * (Number(epoch) > 1e12 ? 1 : 1e3);
  if (!Number.isFinite(ms)) return "your last plan";
  const d = new Date(ms);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const day0 = (t) => new Date(t).setHours(0, 0, 0, 0);
  const days = Math.round((day0(now) - day0(ms)) / 864e5);
  if (days === 0) return hm;
  if (days === 1) return `yesterday ${hm}`;
  return `${new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d)} ${hm}`;
}
function planDiff(best, mine, L) {
  const at2 = (ev, g) => ev.gws.find((x) => x.gw === g);
  const items = /* @__PURE__ */ new Map();
  for (const s of best.gws) {
    const m = at2(mine, s.gw);
    if (!m) continue;
    for (const [id, side] of [
      ...s.squad.filter((p) => !m.squad.includes(p)).map((p) => [p, "in"]),
      ...m.squad.filter((p) => !s.squad.includes(p)).map((p) => [p, "out"])
    ]) {
      const it = items.get(id) || { id, gw: s.gw, weight: 0, side };
      it.weight += L.xp(id, s.gw) ?? 0;
      items.set(id, it);
    }
  }
  const movesOfWeek = (ev, g) => (at2(ev, g)?.moves || []).filter((x) => x.ok !== false);
  return [...items.values()].map((it) => {
    const ownedBefore = it.side === "in" && (mine.gws.some((x) => x.gw < it.gw && x.squad.includes(it.id)) || movesOfWeek(mine, it.gw).some((x) => x.out === it.id));
    const kind = it.side === "out" ? "skip" : ownedBefore ? "keep" : "buy";
    const mv = movesOfWeek(mine, it.gw).find((x) => x.out === it.id || x.in === it.id) ?? movesOfWeek(best, it.gw).find((x) => x.in === it.id);
    const withId = mv ? mv.out === it.id ? mv.in : mv.out : null;
    return { id: it.id, kind, gw: it.gw, with: withId, weight: it.weight };
  }).sort((a, b) => b.weight - a.weight);
}
function diffWords(it, L) {
  if (!it) return null;
  const nm = L.name;
  if (it.kind === "keep") return `keep ${nm(it.id)} (yours sells him${it.with != null ? ` for ${nm(it.with)}` : ""} in GW${it.gw})`;
  if (it.kind === "buy") return `${nm(it.id)} in GW${it.gw}${it.with != null ? ` for ${nm(it.with)}` : ""}`;
  return `no ${nm(it.id)} (yours buys him in GW${it.gw})`;
}
var freshOf = (cctx, best, before) => before?.weeks?.length ? compare(cctx, best, planFromRoad(cctx, before).evaluation) : null;
var isNews = (cctx, fc) => fc != null && fc.ref > (cctx?.noise ?? 0) && fc.label !== "coin";
function detectDrift(cctx, accepted, version, { frozen = null, locked = false, now, before = null, hold = null } = {}) {
  if (!accepted?.plan?.weeks?.length || !cctx?.model?.weeks?.length || !version || madeOn(accepted) === version) return null;
  const L = playerLookup({ base: cctx.base, players: cctx.players });
  const mine = planFromRoad(cctx, { weeks: accepted.plan.weeks }, accepted.lineup || {});
  const bestPlan = planFromRoad(cctx, cctx.model);
  const cmp = compare(cctx, bestPlan.evaluation, mine.evaluation);
  const pinList = accepted.pins?.items || [];
  const ink = frozen?.length ? frozen : locked ? [cctx.A] : [];
  const reach = ink.every((g) => squadKey(weekAt(cctx.model, g)) === squadKey(weekAt(accepted.plan, g)));
  const broken = rulesBroken(cctx.model, [...hold ? [hold] : [], ...pinList.filter((p) => p.id !== "road" && p.id !== "hold")], { from: cctx.A, to: cctx.gws.at(-1) });
  const shared = new Map(legality(cctx, bestPlan.evaluation).filter((x) => x.code !== "status" && x.gw > cctx.A).map((x) => [`${x.code}:${x.gw}`, x.short ?? 0]));
  const illegal = legality(cctx, mine.evaluation, pinList).filter((x) => !shared.has(`${x.code}:${x.gw}`) || x.code === "budget" && x.short > shared.get(`${x.code}:${x.gw}`) + EPS);
  const same = sameSquads(bestPlan.evaluation, mine.evaluation);
  const chosen = broken.length > 0 || ["xi", "bench", "captain", "vice"].some((k) => accepted.lineup?.[k] != null);
  const fc = freshOf(cctx, bestPlan.evaluation, before) ?? (chosen ? null : cmp);
  const fresh = fc ? fc.delta : null;
  const wins = reach && !same && cmp.label !== "coin" && isNews(cctx, fc);
  const kind = illegal.length || wins ? "drift" : !same && cmp.delta > EPS ? "kept" : "same";
  let what = illegal[0]?.text ?? null;
  if (!what) {
    const since = (row) => {
      const t = Date.parse(row?.news_added ?? "");
      return Number.isFinite(t) && t / 1e3 > (num(accepted.at) ?? Infinity);
    };
    for (const id of watched(cctx, mine.evaluation, pinList)) {
      if (!since(L.get(id)?.row)) continue;
      what = statusText(L.name(id), L.get(id)?.row);
      if (what) break;
    }
  }
  const news = what;
  what ??= "the forecast changed";
  const diff = planDiff(bestPlan.evaluation, mine.evaluation, L);
  const main = diffWords(diff[0], L);
  const sinceStr = sinceText(accepted.at, now);
  const out = same ? illegal.find((x) => x.code === "status") : null;
  const ruleNames = broken.filter((p) => p.id !== "hold").map((p) => ruleText(p, L.name, { start: cctx.A, end: cctx.gws.at(-1) }).text);
  return {
    kind,
    version,
    gw: cctx.A,
    since: accepted.at,
    sinceText: sinceStr,
    cmp,
    delta: cmp.delta,
    label: cmp.label,
    what,
    main,
    best: main ?? "the new plan",
    diff,
    same,
    locked: ink.length > 0,
    frozen: ink,
    reach,
    broken: broken.map((p) => p.id),
    ruleNames,
    fresh,
    freshLabel: fc ? fc.label : null,
    wins,
    without: out ? { id: out.id, name: L.name(out.id) } : null,
    mine,
    bestPlan
  };
}
var movesOf = (w, L) => pairMoves(ids(w?.out), ids(w?.in), L).filter((m) => m.out !== null && m.in !== null).map((m) => ({ ...m, outName: L.name(m.out), inName: L.name(m.in) }));
var weekChanges = (was, now, L) => {
  const a = movesOf(was, L), b = movesOf(now, L);
  const key = (m) => `${m.out}>${m.in}`;
  const ka = new Set(a.map(key)), kb = new Set(b.map(key));
  return { a, b, gone: a.filter((m) => !kb.has(key(m))), added: b.filter((m) => !ka.has(key(m))) };
};
function pencilChanges(was, now, A, L) {
  const items = [];
  for (const w of (now || []).filter((x) => Number(x.gw) > A)) {
    const before = (was || []).find((x) => Number(x.gw) === Number(w.gw));
    if (!before) continue;
    const { a, b, gone, added } = weekChanges(before, w, L);
    if (gone.length || added.length) items.push({ gw: Number(w.gw), was: a, now: b, n: Math.max(gone.length, added.length) });
  }
  if (!items.length) return null;
  const n = items.reduce((s, x) => s + x.n, 0);
  const gws = items.map((x) => x.gw);
  return { n, gws, items, text: `${n} change${n === 1 ? "" : "s"} in ${COPY.range(gws[0], gws.at(-1))}` };
}
function movesChanged(was, now, L) {
  const { gone, added } = weekChanges(was, now, L);
  const parts = added.map((m) => {
    const w = gone.find((x) => x.out === m.out);
    return `${m.outName} \u2192 ${m.inName}${w ? ` (was ${w.inName})` : ""}`;
  });
  for (const m of gone) if (!added.some((x) => x.out === m.out)) parts.push(`no ${m.outName} \u2192 ${m.inName}`);
  return parts.length ? parts.join(", ") : null;
}
function roadWords(key, nameOf) {
  const [kind, rest = ""] = String(key ?? "").split(":");
  const [id, g] = rest.split("@");
  if (kind === "base") return "the suggested plan";
  if (kind === "hit") return `the ${MINUS}4 move`;
  if (kind === "veto") return `the plan without ${nameOf(Number(id))}`;
  if (kind === "slide") return `${nameOf(Number(id))} from GW${g}`;
  return String(key ?? "a move");
}
var MINUS = "\u2212";
var TAKEN = (t, nameOf) => t.call === "armband" ? `${t.label || nameOf(t.captain)} captain` : t.call === "chip" ? t.chip ? `played ${chipName(t.chip)}` : "held the chips" : t.label === "Roll" || !t.label && t.road === "roll" ? "rolled the transfer" : `took ${t.label || roadWords(t.road, nameOf)}`;
var LOCKS = ["locked", "frozen"];
var sameLock = (prev, n) => !!prev && LOCKS.includes(n?.kind) && prev.kind === n.kind && prev.text === n.text;
function journalRows(docs, { nameOf = (id) => `#${id}` } = {}) {
  const rows = [];
  for (const doc of Object.values(docs || {})) {
    const acc = doc?.accepted;
    if (!acc) continue;
    const gw = Number(doc.gw);
    for (const t of acc.roads_taken || []) {
      const v = (acc.verdicts || []).find((x) => x.call === t.call);
      rows.push({ gw, at: t.at ?? acc.at ?? 0, kind: t.call, text: TAKEN(t, nameOf), not: t.not || [], label: v?.label ?? null, delta: num(v?.delta) });
    }
    const lock = {};
    for (const n of acc.notes || []) {
      if (LOCKS.includes(n.kind)) {
        if (sameLock(lock[n.kind], n)) continue;
        lock[n.kind] = n;
      }
      rows.push({ gw, at: n.at ?? 0, kind: n.kind, text: n.text, not: [], label: n.label ?? null, delta: num(n.delta) });
    }
  }
  return rows.sort((a, b) => b.gw - a.gw || b.at - a.at);
}
var madeOn = (acc) => acc?.roads_version ?? acc?.data_version ?? null;
var solvedKey = (version, values) => {
  const v = solveGap(values);
  return `${version}|${JSON.stringify(Object.keys(v).sort().map((k) => [k, v[k]]))}`;
};
var sigOf = (c) => `${c.must_have}|${c.exclude}|${JSON.stringify(c.hits)}|${JSON.stringify(c.chips)}|${c.cash}${c.not_for ? `|notfor:${c.not_for}` : ""}${c.rolls.length ? `|roll:${c.rolls.join(",")}` : ""}${Object.keys(c.caps ?? {}).length ? `|cap:${JSON.stringify(c.caps)}` : ""}`;
var planOfRoad = (road, version, sig = null) => road ? {
  key: road.key ?? null,
  item: road.item ?? null,
  version: version ?? null,
  sig,
  values: road.values ?? null,
  weeks: clone(road.weeks),
  objective: road.objective ? clone(road.objective) : null,
  ...road.windows ? { windows: clone(road.windows) } : {},
  ...road.planner ? { planner: clone(road.planner) } : {},
  ...Array.isArray(road.k_h) ? { k_h: [...road.k_h] } : {}
} : null;
function normalizeAccepted(acc, { A, end, roadOf = () => null, hitCap: hitCap2 = null, hold = false } = {}) {
  if (!acc) return null;
  const made = madeOn(acc);
  const t = (acc.roads_taken || []).find((x) => x.call === "transfer");
  const road = t?.road ? roadOf(made, t.road) : null;
  const out = { ...acc, roads_version: made, roads_taken: acc.roads_taken || [], verdicts: acc.verdicts || [], notes: acc.notes || [] };
  let items = Array.isArray(acc.pins?.items) ? acc.pins.items : null;
  if (!items) {
    const src = road ?? (acc.plan?.weeks ? { values: { must_have: acc.pins?.must_have, exclude: acc.pins?.exclude, max_hits: acc.pins?.max_hits }, weeks: acc.plan.weeks } : null);
    items = t?.road && src ? [pinRoad(src, A, { key: t.road, label: t.label })] : [];
  } else {
    const rp = items.find((p) => p.id === "road");
    if (rp && !rp.locked && (!t ? true : road && rp.key !== t.road)) items = items.filter((p) => p.id !== "road" && !p.via);
    if (road && !items.some((p) => p.id === "road")) items = [pinRoad(road, A, { key: t.road, label: t.label }), ...items];
  }
  items = items.filter((p) => p.kind !== "hits");
  items = splitItems(items, A, end);
  if (frozenWeeks(acc, A, end).length || items.some((p) => p.id === "road" && p.locked)) {
    const rp = items.find((p) => p.id === "road");
    const thawed = rp ? thawPin(rp, A, A) : null;
    items = [...thawed ? [thawed] : [], ...items.filter((p) => p.id !== "road")];
    Object.assign(out, { frozen: [], frozen_lineups: {}, frozen_at: {}, locked_at: null });
    delete out.locked_by;
  }
  const idle = idleRules(items, { from: A, to: end, hitCap: hitCap2 });
  if (idle.length) items = items.filter((p) => !idle.includes(p.id));
  const c = composePins(items, { from: A, to: end });
  if (items !== acc.pins?.items) out.pins = { ...acc.pins || {}, must_have: c.must_have, exclude: c.exclude, items };
  if (!hold && road && out.plan?.weeks && out.plan.sig !== sigOf(c) && squadKey(weekAt(out.plan, A)) !== squadKey(weekAt(road, A))) out.plan = null;
  if (!out.plan && road && !hold) out.plan = planOfRoad(road, made, items.length === 1 && items[0].id === "road" ? sigOf(c) : null);
  if (String(out.plan?.key ?? "").startsWith("hold:")) out.plan = null;
  return out;
}

// js/m/memory/pins.js
var EPS = 1e-6;
var SQUAD = Object.values(POS_LIMITS).reduce((s, [n]) => s + n, 0);
var TIMING = { heal: 600, flush: 250 };
var OFFERED_MAX = 24;
var SOLVED_MAX = 48;
var LOCAL = (entry) => `fc:mem:${entry}`;
var SEEN = (entry) => `fc:mem:seen:${entry}`;
var EDIT = (entry) => `fc:mem:edit:${entry}`;
var USED = (entry) => `fc:mem:used:${entry}`;
var FORGET = (entry) => `fc:mem:forget:${entry}`;
var num = (v) => fin(v) ? Number(v) : null;
var ids = (xs) => Array.isArray(xs) ? xs.map(Number).filter(Number.isFinite) : [];
var range = (a, b) => b >= a ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [];
var nowS = () => Math.round(Date.now() / 1e3);
var clone = (x) => x == null ? x : JSON.parse(JSON.stringify(x));
var weekAt = (road, gw) => (road?.weeks || []).find((w) => Number(w.gw) === Number(gw)) || null;
var squadOf = (w) => [...ids(w?.xi), ...ids(w?.bench)];
var idsKey = (xs) => ids(xs).sort((a, b) => a - b).join(",");
var squadKey = (w) => idsKey(squadOf(w));
var kindOf = (p) => p?.kind === "fork" ? String(p.id).startsWith("roll:") ? "roll" : "hits" : p?.kind;
var isRoll = (p) => !!p && (kindOf(p) === "roll" || String(p.id).startsWith("roll:"));
var isExact = (p) => kindOf(p) === "sell" && p.in != null || kindOf(p) === "slide";
var exactAt = (list, g) => (list || []).filter((p) => p && isExact(p) && num(p.gw) === Number(g));
var rollKeeps = (p) => num(p?.caps?.[p.gw]) ?? 0;
var span = (gws) => COPY.span(gws);
var TOKEN = /^(\d{1,10})@(\d{1,2})-(\d{1,2})$/;
function parseSpans(spec) {
  if (Array.isArray(spec)) return spec.map(([p, a, b]) => [Number(p), Number(a), Number(b)]);
  const out = [];
  for (const tok of String(spec ?? "").split(",").map((t) => t.trim()).filter(Boolean)) {
    const m = TOKEN.exec(tok);
    if (!m) throw new Error(`pins: ${tok} is not an id@a-b window`);
    out.push([Number(m[1]), Number(m[2]), Number(m[3])]);
  }
  return out;
}
function spanString(spans) {
  const merged = [];
  const sorted = parseSpans(spans).sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
  for (const [p, a, b] of sorted) {
    const last = merged.at(-1);
    if (last && last[0] === p && a <= last[2] + 1) last[2] = Math.max(last[2], b);
    else merged.push([p, a, b]);
  }
  return merged.map(([p, a, b]) => `${p}@${a}-${b}`).join(",");
}
var capsOf = (pin, from, to) => (pin.hits ? Object.entries(pin.hits).map(([g, n]) => [Number(g), num(n) ?? 0]) : (num(pin.max_hits) ?? 0) > 0 ? range(from, to).map((g) => [g, Number(pin.max_hits)]) : []).filter(([g]) => g >= from && g <= to);
var lastSale = (list, id, g) => Math.max(-Infinity, ...list.filter((p) => p && isExact(p) && num(p.gw) <= g && Number(kindOf(p) === "slide" ? p.out : kindOf(p) === "sell" ? p.player : NaN) === id).map((p) => num(p.gw)));
var cashOf = (list) => list.reduce((cash, pin) => pin && num(pin.cash) !== null ? num(pin.cash) : cash, null);
function composePins(list = [], { from = 1, to = LAST_ROUND } = {}) {
  const cells = /* @__PURE__ */ new Map();
  const overridden = [];
  const chips = {};
  for (const pin of list) {
    for (const [g, c] of Object.entries(pin?.chips || {})) {
      if (Number(g) < from || Number(g) > to) continue;
      if (CHIPS.includes(c)) chips[g] = c;
      else delete chips[g];
    }
  }
  const fh = (g) => chips[g] === "fh";
  const fhIn = (pin, g, a, b) => g === a && (b === g || kindOf(pin) === "wish");
  const fhOut = (pin, g, a, b) => a === g && b === g || ["veto", "never"].includes(kindOf(pin));
  const holds = /* @__PURE__ */ new Map();
  const release2 = (g) => {
    const hd = holds.get(g);
    for (const id of hd.ids) if (cells.get(id)?.get(g)?.pin === hd.pin && cells.get(id).get(g).want === "in") cells.get(id).delete(g);
    holds.delete(g);
  };
  const hits = {};
  const rolls = /* @__PURE__ */ new Set();
  const caps = {};
  const refused = [];
  const debts = /* @__PURE__ */ new Set();
  const implied = [];
  for (const pin of list) {
    if (!pin) continue;
    const put = (id, g, want) => {
      if (!cells.has(id)) cells.set(id, /* @__PURE__ */ new Map());
      const cur = cells.get(id).get(g);
      if (cur && cur.want !== want && cur.pin !== pin.id) overridden.push({ pin: cur.pin, by: pin.id, id, gw: g, was: cur.want });
      cells.get(id).set(g, { want, pin: pin.id });
    };
    const hold = kindOf(pin) === "hold";
    const ins = /* @__PURE__ */ new Map();
    for (const [id, a, b] of parseSpans(pin.must || [])) {
      for (const g of range(Math.max(a, from), Math.min(b, to))) if (!fh(g) || !hold && fhIn(pin, g, a, b)) (ins.get(g) || ins.set(g, /* @__PURE__ */ new Set()).get(g)).add(id);
    }
    for (const [g, ids2] of ins) if (holds.has(g) && holds.get(g).pin !== pin.id && [...ids2].some((id) => !holds.get(g).ids.has(id))) release2(g);
    for (const [g, ids2] of ins) for (const id of ids2) put(id, g, "in");
    for (const [id, a, b] of parseSpans(pin.excl || [])) for (const g of range(Math.max(a, from), Math.min(b, to))) if (!fh(g) || !hold && fhOut(pin, g, a, b)) put(id, g, "out");
    const g1 = kindOf(pin) === "sell" && isExact(pin) ? (num(pin.gw) ?? 0) - 1 : -1;
    if (g1 >= from && g1 <= to) {
      let own = g1;
      while (own >= from && fh(own)) own--;
      if (own >= from) {
        put(Number(pin.player), own, "in");
        implied.push([Number(pin.player), own, pin.id]);
      }
      for (const g of range(Math.max(from, lastSale(list, Number(pin.in), g1)), g1)) if (!fh(g)) {
        put(Number(pin.in), g, "out");
        implied.push([Number(pin.in), g, pin.id]);
      }
    }
    for (const [g, ids2] of ins) if (ids2.size >= SQUAD) holds.set(g, { pin: pin.id, ids: ids2 });
    for (const [g, n] of capsOf(pin, from, to)) hits[g] = n;
    if (isRoll(pin)) {
      const g = num(pin.gw) ?? 0, keep = Math.min(rollKeeps(pin), exactAt(list, g).length);
      if (g >= from && g <= to) {
        if (keep) caps[g] = keep;
        else rolls.add(g);
      }
    }
    if (kindOf(pin) === "notfor") refused.push([num(pin.gw), Number(pin.out), Number(pin.player)]);
    for (const g of pin.rolls || []) if (Number(g) >= from && Number(g) <= to) rolls.add(Number(g));
    for (const g of pin.debts || []) if (Number(g) >= from && Number(g) <= to) debts.add(Number(g));
    if (!isRoll(pin)) {
      for (const [g, n] of Object.entries(pin.caps || {})) if (Number(g) >= from && Number(g) <= to) caps[Number(g)] = Number(n);
    }
  }
  for (const [g, c] of Object.entries(chips)) if (c === "wc" || c === "fh") {
    delete hits[g];
    rolls.delete(Number(g));
    delete caps[g];
  }
  for (const g of rolls) delete caps[g];
  for (const g of rolls) delete hits[g];
  for (const [id, g, by] of implied) if (rolls.has(g) && cells.get(id)?.get(g)?.pin === by) cells.get(id).delete(g);
  const cash = cashOf(list);
  const must = [], excl = [];
  for (const [id, byGw] of cells) for (const [g, { want }] of byGw) (want === "in" ? must : excl).push([id, g, g]);
  const implicit = /* @__PURE__ */ new Set();
  for (const [g, hd] of holds) {
    const ex = exactAt(list, g), buys = new Set(ex.map((p) => Number(p.in)));
    if (!(rolls.has(Number(g)) || caps[g] != null && Number(caps[g]) === ex.length)) continue;
    for (const id of hd.ids) if (!buys.has(id) && cells.get(id)?.get(g)?.pin === hd.pin && cells.get(id).get(g).want === "in") implicit.add(`${id}@${g}`);
  }
  const made = [];
  for (const p of list.filter((x) => x && isExact(x))) {
    const g = num(p.gw), [out, inn] = kindOf(p) === "slide" ? [Number(p.out), Number(p.player)] : [Number(p.player), Number(p.in)];
    if (g == null || g < from || g > to || fh(g) || cells.get(inn)?.get(g)?.want !== "in" || cells.get(out)?.get(g)?.want !== "out") continue;
    made.push(`${g}:${out}:${inn}`);
    implicit.add(`${inn}@${g}`);
  }
  const outsMade = new Set(made.map((t) => {
    const [g, o] = t.split(":");
    return `${o}@${g}`;
  }));
  const sent = must.filter(([id, g]) => !implicit.has(`${id}@${g}`));
  const sentExcl = excl.filter(([id, g]) => !outsMade.has(`${id}@${g}`));
  const must_have = spanString(must), exclude = spanString(excl);
  const notFor = [...new Set(refused.filter(([g, o, i]) => g >= from && g <= to && !["wc", "fh"].includes(chips[g]) && !holds.has(g) && !rolls.has(g) && !makesMove(cells, g, o, i)).map((x) => x.join(":")))].sort();
  return {
    must_have,
    sent_must: spanString(sent),
    exclude,
    sent_exclude: spanString(sentExcl),
    for_gw: [...new Set(made)].sort().join(","),
    must: parseSpans(must_have),
    excl: parseSpans(exclude),
    hits,
    notFor,
    not_for: notFor.join(","),
    rolls: [...rolls].sort((a, b) => a - b),
    caps,
    debts: [...debts].sort((a, b) => a - b),
    chips,
    cash,
    cells,
    overridden
  };
}
var makesMove = (cells, g, out, inn) => cells.get(out)?.get(g)?.want === "out" && cells.get(inn)?.get(g)?.want === "in";
function movedAt(pin, g, into) {
  const cells = composePins([pin], { from: g - 1, to: g }).cells;
  const have = new Set(ids(into));
  for (const [id, byGw] of cells) {
    const w = byGw.get(g - 1)?.want;
    if (w === "in") have.add(id);
    else if (w === "out") have.delete(id);
  }
  const out = [];
  for (const [id, byGw] of cells) {
    const c = byGw.get(g);
    if (c && c.want === "in" !== have.has(id)) out.push(id);
  }
  return out;
}
function pinConflicts(list, pin, { into = null, ...opts } = {}) {
  const others = (list || []).filter((p) => p.id !== pin.id);
  const by = /* @__PURE__ */ new Map();
  const add = (older, id, was, g) => {
    const k = `${older?.id}|${id}`;
    if (!by.has(k)) by.set(k, { pin: older ?? null, id, was, gws: [] });
    by.get(k).gws.push(g);
  };
  const c = composePins([...others, pin], opts);
  for (const o of c.overridden) {
    if (o.by === pin.id) add(others.find((p) => p.id === o.pin), o.id, o.was, o.gw);
  }
  for (const q of others) if (kindOf(q) === "notfor" && makesMove(c.cells, num(q.gw), Number(q.out), Number(q.player))) add(q, Number(q.player), "out", num(q.gw));
  if (into) {
    const inWindow = (g) => g !== null && g >= (opts.from ?? 1) && g <= (opts.to ?? LAST_ROUND);
    const g0 = num(pin.gw);
    const kept = (r, q, g, list2) => isExact(q) && num(q.gw) === g && exactAt(list2, g).length <= rollKeeps(r);
    const leaves = (r, g, list2) => {
      const s = new Set(ids(into(g)));
      for (const q of list2.filter((x) => !isRoll(x) && kept(r, x, g, list2))) {
        const [out, inn] = q.kind === "slide" ? [q.out, q.player] : [q.player, q.in];
        s.delete(Number(out));
        if (inn != null) s.add(Number(inn));
      }
      return [...s];
    };
    if (isRoll(pin) && inWindow(g0)) for (const q of others.filter((x) => !isRoll(x) && !kept(pin, x, g0, others))) for (const id of movedAt(q, g0, leaves(pin, g0, others))) add(q, id, "moves", g0);
    if (!isRoll(pin)) for (const r of others.filter(isRoll)) {
      const g = num(r.gw);
      if (inWindow(g) && !kept(r, pin, g, [...others, pin])) for (const id of movedAt(pin, g, leaves(r, g, [...others, pin]))) add(r, id, "roll", g);
    }
  }
  return [...by.values()];
}
function pinsDir(before, after, { from = 1, to = LAST_ROUND } = {}) {
  const a = composePins(before, { from, to }), b = composePins(after, { from, to });
  const chipsKey = (c) => JSON.stringify(Object.entries(c.chips).sort());
  if (a.cash !== b.cash || chipsKey(a) !== chipsKey(b)) return null;
  const within = (x, y) => [...x.cells].every(([id, byGw]) => [...byGw].every(([g, { want }]) => y.cells.get(id)?.get(g)?.want === want));
  const capAt = (x, g) => x.rolls.includes(g) ? 0 : x.hits[g] ?? Infinity;
  const fewerHits = (x, y) => range(from, to).every((g) => capAt(x, g) <= capAt(y, g));
  const buysAt = (x, g) => x.rolls.includes(g) ? 0 : x.caps[g] ?? Infinity;
  const fewerBuys = (x, y) => range(from, to).every((g) => buysAt(x, g) <= buysAt(y, g));
  const tighter = within(a, b) && fewerHits(b, a) && fewerBuys(b, a), looser = within(b, a) && fewerHits(a, b) && fewerBuys(a, b);
  return tighter === looser ? null : tighter ? "restrict" : "relax";
}
function makePin({ id, kind, label = "", gw = null, must = [], excl = [], max_hits = 0, hits, chips, cash, at: at2, ...meta } = {}) {
  if (!id || !kind) throw new Error("a pin needs an id and a kind");
  const pin = { ...meta, id: String(id), kind, label, gw: num(gw), must: parseSpans(must), excl: parseSpans(excl), max_hits: num(max_hits) ?? 0, at: num(at2) ?? nowS() };
  if (hits && Object.keys(hits).length) pin.hits = Object.fromEntries(Object.entries(hits).map(([g, n]) => [String(Number(g)), num(n) ?? 0]));
  if (chips && Object.keys(chips).length) pin.chips = { ...chips };
  if (num(cash) !== null) pin.cash = num(cash);
  return pin;
}
function barredAt(list, from, to = from) {
  return new Set(composePins(list || [], { from, to }).excl.map(([id]) => id));
}
var heldAt = (spans, g) => parseSpans(spans || []).filter(([, a, b]) => a <= g && g <= b).map(([id]) => id);
function changesGwA(roadPin, pin, A, owned = null) {
  if (!roadPin || !pin) return false;
  const squad = new Set(heldAt(roadPin.must, A));
  if (isRoll(pin) && num(pin.gw) === A) return owned != null && idsKey([...squad]) !== idsKey(owned);
  return heldAt(pin.must, A).some((id) => !squad.has(id)) || heldAt(pin.excl, A).some((id) => squad.has(id));
}
var yieldRoad = (rp, A) => ({ ...rp, must: parseSpans(rp.must).filter(([, a, b]) => !(a === A && b === A)), yielded: true });
function pinsAfter(list = [], { add = [], drop = [] } = {}, A = null, owned = null) {
  const off = typeof drop === "function" ? drop : (p) => drop.includes(p.id);
  const ink = (p) => p.id === "road" && !!p.locked;
  const road = list.some((p) => p.id === "road" && !ink(p) && off(p));
  let out = list.filter((p) => ink(p) || !(off(p) || road && p.via));
  for (const pin of add) {
    const rp = out.find((x) => x.id === "road");
    const yields = A != null && !!rp && !rp.yielded && !rp.locked && changesGwA(rp, pin, A, owned);
    out = [...out.filter((x) => x.id !== pin.id).map((x) => yields && x.id === "road" ? yieldRoad(x, A) : x), pin];
  }
  return out;
}
var parseCaps = (spec) => Object.fromEntries(String(spec ?? "").split(",").map((t) => t.trim().split(":").map(Number)).filter(([g, n]) => Number.isFinite(g) && Number.isFinite(n)).map(([g, n]) => [String(g), n]));
function pinRoad(road, A, { key, label = "" } = {}) {
  const v = road?.values || {};
  const chips = {};
  for (const c of CHIPS) for (const g of [].concat(v[c] ?? []).map(String)) if (g !== "0" && Number(g)) chips[g] = c;
  return makePin({
    id: "road",
    kind: "road",
    key: key ?? road?.item ?? road?.key ?? null,
    label,
    gw: A,
    must: [...parseSpans(v.must_have || ""), ...squadOf(weekAt(road, A)).map((p) => [p, A, A])],
    excl: parseSpans(v.exclude || ""),
    max_hits: num(v.max_hits) ?? 0,
    hits: parseCaps(v.max_hits_gw),
    chips,
    cash: v.cash
  });
}
function splitRoad(rp, A, end = A) {
  if (!rp) return [];
  const F = rp.locked ? pinFrozen(rp, A) : [A];
  const last = F.at(-1);
  const holds = F.flatMap((g) => [...new Set(heldAt(rp.must, g))].map((p) => [p, g, g]));
  const hold = [...new Set(heldAt(rp.must, A))];
  const later = parseSpans(rp.must || []).filter(([, a, b]) => !(a === b && F.includes(a))).map(([id, a, b]) => [id, Math.max(a, last + 1), b]).filter(([, a, b]) => a <= b);
  const excl = parseSpans(rp.excl || []);
  const chips = Object.entries(rp.chips || {}).filter(([g, c]) => c && !(rp.locked && F.includes(Number(g))));
  const caps = capsOf(rp, A, end);
  if (!later.length && !excl.length && !caps.length && !chips.length && rp.cash == null) return [rp];
  const via = String(rp.key ?? "road");
  const kept = rp.locked ? Object.fromEntries(Object.entries(rp.chips || {}).filter(([g]) => F.includes(Number(g)))) : {};
  const pin = { ...rp, must: holds, excl: [], max_hits: 0 };
  delete pin.hits;
  delete pin.chips;
  delete pin.cash;
  if (Object.keys(kept).length) pin.chips = kept;
  const byPlayer = (spans) => {
    const m = /* @__PURE__ */ new Map();
    for (const sp of spans) (m.get(sp[0]) || m.set(sp[0], []).get(sp[0])).push(sp);
    return [...m];
  };
  const from = (spans) => Math.min(...spans.map(([, a]) => a));
  const rules = [
    ...byPlayer(excl).map(([id, sp]) => makePin({ id: `out:${id}`, kind: "veto", player: id, gw: from(sp), excl: sp, via })),
    ...byPlayer(later).map(([id, sp]) => hold.includes(id) ? makePin({ id: `keep:${id}`, kind: "keep", player: id, gw: from(sp), must: sp, via }) : makePin({ id: `wish:${id}`, kind: "wish", player: id, gw: from(sp), must: sp, via })),
    ...caps.map(([g, n]) => pinHits(n, g, { via })),
    ...chips.map(([g, c]) => pinChip(Number(g), c, { via })),
    ...rp.cash != null ? [pinCash(rp.cash, { via })] : []
  ];
  return [pin, ...rules];
}
function splitItems(items, A, end) {
  const i = items.findIndex((p) => p.id === "road");
  if (i < 0) return items;
  const [pin, ...rules] = splitRoad(items[i], A, end);
  if (!rules.length) return items;
  const have = new Set(items.map((p) => p.id));
  return [...items.slice(0, i), pin, ...rules.filter((r) => !have.has(r.id)), ...items.slice(i + 1)];
}
var ticketSquad = (plan) => {
  const s = [...ids(plan?.xi), ...ids(plan?.bench)];
  return s.length === SQUAD ? s : [];
};
var pinFrozen = (rp, A) => !rp?.locked ? [] : Array.isArray(rp.frozen) && rp.frozen.length ? rp.frozen.map(Number).sort((a, b) => a - b) : [A];
function lockPin(rp, squads, A, key = "base", chips = null) {
  const by = Array.isArray(squads) ? { [A]: squads } : squads || {};
  const gws = Object.keys(by).map(Number).filter((g) => by[g]?.length).sort((a, b) => a - b);
  const last = gws.length ? gws.at(-1) : A;
  const after = (spans) => parseSpans(spans || []).filter(([, , b]) => b > last).map(([p, a, b]) => [p, Math.max(a, last + 1), b]);
  const ch = Object.fromEntries(gws.filter((g) => chips && g in chips).map((g) => [String(g), chips[g] ?? "none"]));
  const pin = makePin({
    ...rp || {},
    id: "road",
    kind: "road",
    key: rp?.key ?? key,
    label: rp?.label || "Frozen",
    gw: A,
    must: [...after(rp?.must), ...gws.flatMap((g) => by[g].map((p) => [Number(p), g, g]))],
    excl: after(rp?.excl),
    locked: true,
    yielded: false,
    frozen: gws,
    chips: Object.keys(ch).length ? ch : void 0
  });
  if (!Object.keys(ch).length) delete pin.chips;
  return pin;
}
function frozenHolds(rp, A) {
  const gws = pinFrozen(rp, A);
  return {
    squads: Object.fromEntries(gws.map((g) => [g, heldAt(rp.must, g)])),
    chips: Object.fromEntries(gws.filter((g) => rp.chips?.[g] != null).map((g) => [g, rp.chips[g]]))
  };
}
function frozenPart(rp, keep, from, A = from) {
  const { squads, chips } = frozenHolds(rp, from);
  return lockPin({ ...rp, must: [], excl: [], chips: void 0 }, Object.fromEntries(keep.map((x) => [x, squads[x]])), A, rp.key, Object.fromEntries(keep.filter((x) => x in chips).map((x) => [x, chips[x]])));
}
function thawPin(rp, g, A) {
  if (!rp?.locked) return rp ?? null;
  const keep = pinFrozen(rp, A).filter((x) => x < g);
  if (keep.length) return frozenPart(rp, keep, A);
  const { squads } = frozenHolds(rp, A);
  const { frozen, chips: _c, ...rest } = rp;
  return makePin({ ...rest, must: (squads[A] || []).map((p) => [p, A, A]), excl: [], locked: false });
}
function frozenClash(rp, pin, A) {
  const gws = pinFrozen(rp, A);
  if (!gws.length || !pin) return null;
  for (const g of gws) {
    const squad = new Set(heldAt(rp.must, g));
    if (heldAt(pin.must, g).some((id) => !squad.has(id)) || heldAt(pin.excl, g).some((id) => squad.has(id))) return g;
    const own = num(pin.gw) === g && (isRoll(pin) || ["hits", "chip"].includes(kindOf(pin)));
    if (own || Object.keys(pin.hits || {}).map(Number).includes(g) || pin.chips && g in pin.chips && pin.chips[g] !== (rp.chips?.[g] ?? "none")) return g;
  }
  return null;
}
var deadlinePassed = (meta, now = Date.now()) => {
  const ms = toMs(meta?.deadline_epoch);
  return Number.isFinite(ms) && now >= ms;
};
function frozenWeeks(acc, A, end = A, ticket = null) {
  const f = Array.isArray(acc?.frozen) ? acc.frozen.map(Number).filter((g) => g >= A && g <= end).sort((a, b) => a - b) : [];
  if (f.length) return f;
  return acc?.locked_at || ticket?.locked ? [A] : [];
}
function frozenOnOf(acc, frozen = []) {
  const at2 = (g) => acc?.frozen_at?.[g] ?? (acc?.locked_at ? { at: acc.locked_at, version: null } : null);
  return Object.fromEntries(frozen.map((g) => [g, at2(g)]).filter(([, x]) => x));
}
function frozenSince(frozenOn, g, version = null) {
  const f = frozenOn?.[g];
  return { at: f?.at ? sinceText(f.at) : null, newer: !!f?.version && !!version && f.version !== version };
}
function inkRepair(doc, { A, model, nameOf = (id) => `#${id}` } = {}) {
  const acc = doc?.accepted, t = doc?.ticket;
  const squad = ticketSquad(t?.plan);
  if (!acc || !t?.locked || !squad.length || Number(t.plan.gw ?? A) !== A) return null;
  const key = [...squad].sort((a, b) => a - b).join(",");
  const items = Array.isArray(acc.pins?.items) ? acc.pins.items : [];
  const rp = items.find((p) => p.id === "road");
  const pinOk = rp?.locked && heldAt(rp.must, A).sort((a, b) => a - b).join(",") === key;
  const planOk = !acc.plan?.weeks || squadKey(weekAt(acc.plan, A)) === key;
  if (pinOk && planOk && acc.locked_at) return null;
  const match = model?.weeks && squadKey(weekAt(model, A)) === key ? ["base", model] : null;
  const call = (acc.roads_taken || []).find((x) => x.call === "transfer");
  const keyOf = match?.[0] ?? call?.road ?? "yours";
  const pin = lockPin(rp && heldAt(rp.must, A).sort((a, b) => a - b).join(",") === key ? rp : null, squad, A, keyOf);
  const others = items.filter((p) => p.id !== "road");
  const out = { ...acc, locked_at: acc.locked_at ?? nowS(), locked_by: acc.locked_by ?? "ticket", pins: { ...acc.pins || {}, items: [pin, ...others] } };
  if (match && call?.road !== match[0]) {
    const ins = ids(weekAt(match[1], A).in);
    const label = ins.length ? `${ins.map(nameOf).join(" + ")} in` : "Roll";
    out.roads_taken = [...(acc.roads_taken || []).filter((x) => x.call !== "transfer"), { ...call || { call: "transfer", at: num(acc.at) ?? nowS() }, road: match[0], label, not: [] }];
    out.verdicts = (acc.verdicts || []).filter((v) => v.call !== "transfer");
  }
  if (!planOk || !pinOk) out.plan = null;
  return out;
}
var pinWish = (id, gw, end, { label } = {}) => makePin({ id: `wish:${id}`, kind: "wish", player: Number(id), label, gw, must: [[id, gw, end]] });
var pinSell = (out, gw, end, { in: inn = null, label, funds = null, week = false } = {}) => makePin({
  ...num(funds) !== null ? { funds: num(funds) } : {},
  id: `sell:${out}`,
  kind: "sell",
  player: Number(out),
  in: num(inn),
  label,
  gw,
  excl: [[out, gw, week && inn != null ? gw : end]],
  must: inn == null ? [] : [[inn, gw, week ? gw : end]]
});
var pinSlide = (inn, out, g, A, end, { label } = {}) => makePin({
  id: `slide:${inn}`,
  kind: "slide",
  player: Number(inn),
  out: Number(out),
  label,
  gw: g,
  must: [[inn, g, end], ...g > A ? [[out, A, g - 1]] : []],
  excl: [...g > A ? [[inn, A, g - 1]] : [], [out, g, end]]
});
var scoped = (prefix, id, g, end, scope) => scope === "gw" ? { id: `${prefix}:${id}@${g}`, span: [[id, g, g]], scope } : { id: `${prefix}:${id}`, span: [[id, g, end]], scope: "all" };
function pinVeto(id, A, end, { label, kind = "veto", scope = "all", ...o } = {}) {
  const s = scoped("out", id, A, end, scope);
  return makePin({ ...o, id: s.id, kind, scope: s.scope, player: Number(id), label, gw: A, excl: s.span });
}
var pinNever = (id, A, end, o = {}) => pinVeto(id, A, end, { ...o, kind: "never" });
var pinNotFor = (out, inn, g, { label, ...o } = {}) => makePin({ ...o, id: `notfor:${out}>${inn}@${g}`, kind: "notfor", player: Number(inn), out: Number(out), label, gw: g });
function pinKeep(id, from, end, { label, scope = "all", ...o } = {}) {
  const s = scoped("keep", id, from, end, scope);
  return makePin({ ...o, id: s.id, kind: "keep", scope: s.scope, player: Number(id), label, gw: from, must: s.span });
}
function scopeOf(p, { start, end } = {}) {
  const w = [...parseSpans(p?.must || []), ...parseSpans(p?.excl || [])].filter(([id]) => id === Number(p?.player));
  if (!w.length) return "";
  const a = Math.min(...w.map(([, x]) => x)), b = Math.max(...w.map(([, , y]) => y));
  if (a !== b && end != null && b >= end) return start != null && a <= start ? "all weeks" : `from GW${a}`;
  return COPY.range(a, b);
}
var pinChip = (gw, chip, o = {}) => makePin({ ...o, id: `chip:${gw}`, kind: "chip", gw, chips: { [gw]: chip ?? "none" } });
var pinCash = (tenths, o = {}) => makePin({ ...o, id: "cash", kind: "cash", cash: tenths });
var BANKED = /* @__PURE__ */ new WeakMap();
function withBank(base, pins) {
  const cash = cashOf(pins || []);
  if (!base || cash === null) return base;
  let by = BANKED.get(base);
  if (!by) BANKED.set(base, by = /* @__PURE__ */ new Map());
  if (!by.has(cash)) by.set(cash, { ...base, bank: cash / 10 });
  return by.get(cash);
}
var pinHits = (n, gw, o = {}) => makePin({ ...o, id: `hits:${gw}`, kind: "hits", gw, hits: { [gw]: n } });
var roadWeek = (road) => (x) => {
  const w = weekAt(road, x);
  return w ? { squad: squadOf(w), chip: w.chip ?? null } : null;
};
function movesIn(road, g, n = 0) {
  const w = weekAt(road, g);
  return !w || w.chip === "wc" || w.chip === "fh" || ids(w.in).length > n || ids(w.out).length > n;
}
function squadInto(weekOf, g, A, owned = []) {
  for (let x = Number(g) - 1; x >= A; x--) {
    const w = weekOf(x);
    if (!w) return owned;
    if (w.chip !== "fh") return w.squad;
  }
  return owned;
}
var pinRoll = (g, k = 0) => makePin({ id: `roll:${g}`, kind: "roll", gw: g, label: COPY.rollRule(g, k), ...k > 0 ? { caps: { [g]: k } } : {} });
function carryPins(prevDoc, A, end) {
  const out = [];
  for (const p of prevDoc?.accepted?.pins?.items || []) {
    if (p.kind === "road" || p.kind === "cash" || p.via) continue;
    const clip = (xs) => parseSpans(xs || []).map(([id, a, b]) => [id, Math.max(a, A), p.scope === "all" ? end : Math.min(b, end)]).filter(([, a, b]) => a <= b);
    const chips = Object.fromEntries(Object.entries(p.chips || {}).filter(([g]) => Number(g) >= A && Number(g) <= end));
    const hits = Object.fromEntries(capsOf(p, A, end));
    const must = clip(p.must), excl = clip(p.excl);
    const roll = isRoll(p) && num(p.gw) >= A && num(p.gw) <= end;
    if (!roll && !must.length && !excl.length && !Object.keys(chips).length && !Object.keys(hits).length) continue;
    const { chips: _c, hits: _h, ...rest } = p;
    out.push({ ...rest, must, excl, max_hits: 0, ...Object.keys(chips).length ? { chips } : {}, ...Object.keys(hits).length ? { hits } : {}, gw: p.gw === null ? null : Math.max(p.gw, A) });
  }
  return out;
}

// js/m/memory/live-state.js
function statePart(V) {
  const cctxNow = (list = pinsNow()) => {
    const { ctx, model } = V;
    return ctx.bundle?.entry && ctx.data ? planInputs(ctx.bundle, { ...ctx.data, base: withBank(ctx.data.base, list) }, model().road) : null;
  };
  const versionNow = () => {
    const { ctx } = V;
    return ctx.bundle?.version ?? null;
  };
  const gwsNow = () => {
    const { ctx } = V;
    return ids(ctx.data?.horizon ?? ctx.bundle?.meta?.horizon);
  };
  const endNow = () => {
    const { S } = V;
    return gwsNow().at(-1) ?? S.A;
  };
  const accNow = () => {
    const { S } = V;
    const v = versionNow();
    if (V.accMemo.doc !== S.doc || V.accMemo.v !== v) V.accMemo = { doc: S.doc, v, acc: normalizeAccepted(S.doc?.accepted, { A: S.A, end: endNow(), roadOf, hitCap: capFor(S.doc?.accepted), hold: holdOn(S.doc?.accepted ?? null) }) };
    return V.accMemo.acc;
  };
  const holdOn = (acc) => {
    const { ctx } = V;
    if ((ctx.planDefault ?? "hold") !== "hold") return acc?.hold === true;
    return true;
  };
  const holdNow = () => {
    const { S } = V;
    return holdOn(S.doc?.accepted ?? null);
  };
  const capFor = (acc) => holdOn(acc ?? null) ? null : hitCap(V.model().road);
  const storedNow = () => accNow()?.pins?.items || [];
  const withHold = (list) => {
    const { S } = V;
    const user = list.filter((p) => p.id !== "hold");
    if (!holdNow()) return user;
    const mine = user.filter((p) => !(p.id === "road" && !p.locked));
    const { pin } = holdOf(mine, { A: S.A, end: endNow(), owned: ownedNow() });
    return pin ? [pin, ...mine] : mine;
  };
  const withHits = (list, most = num(accNow()?.hits_max)) => {
    const { S } = V;
    const cap = hitCap(V.model().road);
    if (most === null || cap !== null && most >= cap) return list;
    return [...list.filter((p) => p.id !== "hits"), makePin({ id: "hits", kind: "hits", label: COPY.hitsMax(most), hits: Object.fromEntries(range(S.A, endNow()).map((g) => [g, most])) })];
  };
  const pinsNow = () => withHits(withHold(storedNow()));
  const frozenNow = () => {
    const { S } = V;
    return frozenWeeks(accNow(), S.A, endNow());
  };
  const lockedNow = () => frozenNow().length > 0;
  const composeNow = (list = pinsNow()) => {
    const { S } = V;
    return composePins(list, { from: S.A, to: endNow() });
  };
  const ownedNow = () => {
    const { ctx } = V;
    return ids((ctx.data?.base?.squad || []).map((s) => s.id));
  };
  const intoNow = (g) => {
    const { S } = V;
    return squadInto(roadWeek(getPlan().road), g, S.A, ownedNow());
  };
  const lookupNow = () => {
    const { ctx } = V;
    return playerLookup({ base: ctx.data?.base, players: ctx.data?.players });
  };
  function getPlan() {
    const { S, baseNow, ctx, lastNow } = V;
    const acc = accNow();
    const version = versionNow();
    const model = V.model().road;
    const hold = holdNow();
    if (acc?.plan?.weeks?.length) S.last = { entry: S.entry, A: S.A, plan: acc.plan };
    const last = lastNow() ?? baseNow();
    const road = acc?.plan?.weeks?.length ? { ...acc.plan, weeks: acc.plan.weeks } : hold ? last && { ...last, weeks: last.weeks } : model;
    const c = composeNow();
    const gws = gwsNow();
    const tArm = (acc?.roads_taken || []).find((t) => t.call === "armband") ?? null;
    const transfer = transferInForce(acc);
    const r = S.reopened;
    const edit = S.pending && r && r.sig === sigOf(c) ? { gw: num(r.edit), what: r.what, pins: r.pins, at: r.at } : null;
    return {
      entry: S.entry,
      gw: S.A,
      gws,
      end: endNow(),
      version,
      doc: S.doc,
      accepted: acc,
      road,
      model,
      source: acc?.plan?.weeks?.length || hold ? "yours" : "model",
      stale: !!acc?.plan && acc.plan.version !== version,
      hold,
      hitsMax: num(acc?.hits_max) ?? null,
      pins: pinsNow(),
      must_have: c.must_have,
      exclude: c.exclude,
      hits: c.hits,
      chips: c.chips,
      cash: c.cash,
      taken: { transfer, armband: tArm ? num(tArm.captain) : null },
      roads_taken: acc?.roads_taken || [],
      lineup: acc?.lineup ?? null,
      frozen: frozenNow(),
      frozenLineups: acc?.frozen_lineups ?? {},
      locked: frozenNow().includes(S.A),
      weeks: (road?.weeks || []).map((w) => ({ ...w, state: weekState(w.gw) })),
      // the plan stored is the one solved for these rules (its sig): an edit whose heal ends with no plan and no error
      // lands on it (ahead.js listen)
      current: acc ? !!acc.plan?.weeks?.length && acc.plan.sig === sigOf(c) : baseNow()?.sig === sigOf(c),
      // the plan (or the error) for these rules came from a solve of exactly their values asked ahead (offer `values`):
      // the answer their heal gets, landed with no wait (ahead.js edit: its verdict as a heal's)
      ahead: S.aheadSig != null && S.aheadSig === sigOf(c),
      pending: S.pending ? { ...S.pending, cancel: void 0, ...edit ? { edit } : {} } : null,
      error: S.error,
      saving: S.dirty,
      carried: S.notice?.gw === S.A ? S.notice.text : null
    };
  }
  function transferInForce(acc = accNow()) {
    const { S } = V;
    const t = (acc?.roads_taken || []).find((x) => x.call === "transfer");
    if (!t) return null;
    const rp = (acc.pins?.items || []).find((p) => p.id === "road");
    const cur = roadByKey(t.road);
    return cur && acc.plan && !rp?.yielded && squadKey(weekAt(cur, S.A)) === squadKey(weekAt(acc.plan, S.A)) ? t.road : null;
  }
  function weekState(gw) {
    const { S } = V;
    const g = Number(gw);
    if (frozenNow().includes(g)) return "ink";
    if (g === S.A) return "next";
    return g > S.A ? "pencil" : "past";
  }
  function emit(why) {
    const { store, subs } = V;
    const plan = getPlan();
    store.set("memory", plan);
    for (const fn of [...subs]) {
      try {
        fn(plan, why);
      } catch (e) {
        console.error("Forkcast memory: a listener failed", e);
      }
    }
  }
  function roadByKey(key) {
    const { S } = V;
    if (!key) return null;
    if (key === "yours") return S.doc?.accepted?.plan?.weeks?.length ? S.doc.accepted.plan : null;
    return key === "base" ? V.model().road : null;
  }
  function roadOf(version, key) {
    if (!version || version === versionNow()) return roadByKey(key);
    return key === "base" ? V.modelOn(version) : null;
  }
  function saveLocal() {
    const { S, local } = V;
    if (S.entry) local.set(LOCAL(S.entry), JSON.stringify({ gw: S.A, doc: S.doc, dirty: S.dirty }));
  }
  function loadLocal(entry, A) {
    const { local } = V;
    const s = local.json(LOCAL(entry));
    return s && Number(s.gw) === A && s.doc ? { doc: s.doc, dirty: !!s.dirty } : null;
  }
  function flushSoon(ms = TIMING.flush) {
    const { S } = V;
    clearTimeout(S.flushTimer);
    S.flushTimer = setTimeout(flush, ms);
  }
  async function flush() {
    const { S, ctx } = V;
    if (!S.dirty || S.inflight || !S.entry) return;
    const seq = S.seq;
    const doc = S.doc;
    S.inflight = ctx.api.putMemory({ entry: Number(S.entry), gw: S.A, accepted: doc?.accepted ?? null, ticket: doc?.ticket ?? null });
    try {
      const saved = await S.inflight;
      if (seq === S.seq && S.doc === doc) {
        S.doc = samePlan(saved, doc);
        S.dirty = false;
        saveLocal();
        emit("saved");
      }
    } catch (e) {
      if (e?.code !== "unreachable" && e?.code !== "timeout") console.error("Forkcast memory: saving the plan failed", e);
    } finally {
      S.inflight = null;
      if (S.dirty && seq !== S.seq) flushSoon();
    }
  }
  function samePlan(doc, prev) {
    const a = doc?.accepted, b = prev?.accepted;
    if (a?.plan && b?.plan && a.plan !== b.plan && JSON.stringify(a.plan) === JSON.stringify(b.plan)) a.plan = b.plan;
    return doc;
  }
  function mutate(fn, why) {
    const { S } = V;
    if (!S.entry || !Number.isFinite(S.A)) throw new Error("Forkcast memory: no plan loaded yet");
    return op(() => {
      const doc = clone(S.doc) || { entry: Number(S.entry), gw: S.A, accepted: null, ticket: null };
      fn(doc);
      S.doc = samePlan(doc, S.doc);
      S.dirty = true;
      S.seq++;
      saveLocal();
      emit(why);
      flushSoon();
    });
  }
  function op(fn) {
    const { S, rejudge, replan } = V;
    const before = clone(S.doc);
    fn();
    const end = S.seq;
    return {
      undo() {
        if (S.seq !== end) return false;
        S.doc = before ?? { entry: Number(S.entry), gw: S.A, accepted: null, ticket: null };
        S.dirty = true;
        S.seq++;
        saveLocal();
        S.judged = null;
        rejudge();
        emit("undo");
        flushSoon();
        replan("undo");
        return true;
      }
    };
  }
  const ensure = (doc) => {
    const { S, ctx } = V;
    const hold = holdOn(doc.accepted ?? null);
    doc.accepted = doc.accepted ? normalizeAccepted(doc.accepted, { A: S.A, end: endNow(), roadOf, hitCap: capFor(doc.accepted), hold: holdOn(doc.accepted) }) : blankAccepted(versionNow(), ctx.bundle?.version, hold);
    if (typeof doc.accepted.hold !== "boolean") doc.accepted.hold = hold;
    return doc.accepted;
  };
  const stamp = (a, v = versionNow()) => {
    const { ctx } = V;
    a.roads_version = v;
    a.data_version = ctx.bundle?.version ?? v;
  };
  const setPins = (acc, all) => {
    const { S } = V;
    const items = all.filter((p) => p.id !== "hold" && p.id !== "hits");
    const c = composePins(items, { from: S.A, to: endNow() });
    acc.pins = { must_have: c.must_have, exclude: c.exclude, items };
  };
  return { cctxNow, versionNow, gwsNow, endNow, accNow, holdOn, holdNow, capFor, storedNow, withHold, withHits, pinsNow, frozenNow, lockedNow, composeNow, ownedNow, intoNow, lookupNow, getPlan, transferInForce, weekState, emit, roadByKey, roadOf, saveLocal, loadLocal, flushSoon, flush, samePlan, mutate, op, ensure, stamp, setPins };
}

// js/m/memory/live-heal.js
function healPart(V) {
  const healWords = () => {
    const { S } = V;
    const mine = V.pinsNow().filter((p) => p.id !== "hold" && p.id !== "hits");
    return mine.length ? mine.map((p) => ruleText(p, V.lookupNow().name, { start: S.A, end: V.endNow() }).text).join(", ") : COPY.healNone;
  };
  const healAnswered = (road) => {
    try {
      noteAnswer(keyNow(), { gw: V.S.A, kind: SOLVE_KINDS.heal, what: healWords() }, road);
    } catch {
    }
  };
  function replan(why = "pins") {
    const { S, accNow, composeNow, ctx, emit, ensure, gwsNow, holdNow, lockedNow, markSeen, mutate, pinsNow, receipt, versionNow } = V;
    if (S.batch) {
      S.batch.why = why;
      return;
    }
    const acc = accNow();
    const list = pinsNow();
    if (!acc && !holdNow()) return;
    if (!list.length) {
      if (!acc) return;
      cancelHeal();
      S.error = null;
      if (acc.plan && !lockedNow()) mutate((d) => {
        ensure(d).plan = null;
      }, "plan");
      return;
    }
    const c = composeNow(list);
    const sig = sigOf(c);
    const v = versionNow();
    if (acc?.plan?.weeks?.length && acc.plan.version === v) offer(acc.plan);
    const also = S.offered.v === v ? S.offered.roads : [];
    const hit = findRoad(V.model().road, c, gwsNow(), also);
    if (hit) {
      globalThis.__fcTrace?.("plan", hit.key);
      healAnswered(hit);
      cancelHeal();
      S.error = null;
      S.aheadSig = null;
      if (!acc) {
        keepBase(hit, v, sig);
        return;
      }
      if (acc.plan?.key !== hit.key || acc.plan?.version !== v || acc.plan?.sig !== sig) {
        const own = yours(why, acc, sig);
        mutate((d) => {
          ensure(d).plan = planOfRoad(hit, v, sig);
        }, "plan");
        if (own) {
          markSeen();
          receipt(sig);
        }
      }
      return;
    }
    const gws = gwsNow().join(","), spans = (p) => (p?.weeks || []).map((w) => Number(w.gw)).join(",") === gws;
    if (!acc && baseNow()?.sig === sig && baseNow().version === v && spans(baseNow())) return;
    if (acc?.plan?.sig === sig && [v, ctx.bundle?.version].includes(acc.plan.version) && spans(acc.plan) && !brokenCells(acc.plan, c).length) {
      healAnswered(acc.plan);
      cancelHeal();
      S.aheadSig = null;
      if (S.error) {
        S.error = null;
        emit("plan");
      }
      return;
    }
    const k = keyNow();
    const got = k && S.offered.v === v ? S.offered.solved.get(k) : null;
    if (got) {
      globalThis.__fcTrace?.("plan", got.road?.key);
      healAnswered(got.road);
      cancelHeal();
      took(got, sig, why, true);
      return;
    }
    scheduleHeal("heal", { reason: why, now: why === "sync", ahead: k });
  }
  const keyNow = () => {
    const { ctx } = V;
    try {
      return solvedKey(ctx.bundle?.version ?? null, values());
    } catch {
      return null;
    }
  };
  function took(r, sig, reason, ahead = false) {
    const { S, accNow, ctx, emit, ensure, markSeen, mutate, receipt, versionNow } = V;
    S.aheadSig = ahead ? sig : null;
    if (r.road) {
      S.error = null;
      if (!accNow()) {
        keepBase(r.road, versionNow(), sig);
        return;
      }
      const own = yours(reason, accNow(), sig);
      mutate((d) => {
        ensure(d).plan = planOfRoad(r.road, ctx.bundle?.version ?? versionNow(), sig);
      }, "plan");
      if (own) {
        markSeen();
        receipt(sig);
      }
    } else {
      S.error = r.error ?? { code: "solver", plain: COPY.infeasible(S.A) };
      emit("error");
      receipt(sig, S.error);
    }
  }
  function batch(fn) {
    const { S } = V;
    if (S.batch) return fn();
    S.batch = { why: null };
    try {
      return fn();
    } finally {
      const { why } = S.batch;
      S.batch = null;
      if (why) replan(why);
    }
  }
  function keepBase(road, v, sig) {
    const { S, emit } = V;
    S.base = { entry: S.entry, A: S.A, plan: planOfRoad(road, v, sig) };
    S.last = S.base;
    offer(road);
    emit("plan");
  }
  const baseNow = () => {
    const { S } = V;
    return S.base?.entry === S.entry && S.base.A === S.A ? S.base.plan : null;
  };
  const lastNow = () => {
    const { S } = V;
    return S.last?.entry === S.entry && S.last.A === S.A ? S.last.plan : null;
  };
  function cancelHeal() {
    const { S, emit } = V;
    clearTimeout(S.healTimer);
    S.healTimer = null;
    S.queued = null;
    if (S.pending) {
      S.pending.cancel?.();
      S.pending = null;
      S.healSeq++;
      emit("heal");
    }
  }
  function scheduleHeal(purpose = "heal", { now = false, reason = "pins", ahead = null } = {}) {
    const { S, emit } = V;
    clearTimeout(S.healTimer);
    const my = ++S.healSeq;
    S.pending?.cancel?.();
    S.pending = { purpose, reason, state: "waiting", key: null, position: null, since: Date.now(), ahead };
    emit("heal");
    return new Promise((resolve) => {
      S.healTimer = setTimeout(() => resolve(runHeal(purpose, my)), now ? 0 : TIMING.heal);
    });
  }
  const yours = (why, acc, sig) => why !== "sync" || acc?.plan?.sig !== sig;
  async function runHeal(purpose, my) {
    const { S, composeNow, ctx, emit } = V;
    if (my !== S.healSeq || !S.entry) return { state: "superseded" };
    let vals, sig;
    try {
      vals = values();
      sig = sigOf(composeNow());
    } catch (e) {
      console.warn("Forkcast: pins", e);
      S.pending = null;
      S.error = { code: "pins", plain: COPY.unfinished, detail: String(e?.message || e) };
      emit("error");
      return { state: "error", error: S.error };
    }
    const reason = S.pending?.reason;
    const p = solveKept(ctx.api, { entry: Number(S.entry), purpose, values: vals }, {
      onUpdate: (s) => {
        if (my === S.healSeq && S.pending) {
          Object.assign(S.pending, { key: s.key, state: s.state, position: s.position ?? null });
          emit("heal");
        }
      }
    }, { what: healWords() });
    if (S.pending) S.pending.cancel = p.cancel;
    try {
      const r = await p;
      if (my !== S.healSeq) return r;
      S.pending = null;
      S.queued = null;
      if (sigOf(composeNow()) !== sig) {
        if (r.state === "done" && r.road) offer(r.road);
        emit("heal");
        replan(reason ?? "pins");
        return { state: "superseded" };
      }
      if (r.state === "done" && r.road || r.state === "error") took(r, sig, reason);
      else emit("heal");
      return r;
    } catch (e) {
      if (my !== S.healSeq) return { state: "superseded" };
      if (e?.code === "unreachable" || e?.code === "timeout") {
        S.queued = purpose;
        if (S.pending) Object.assign(S.pending, { state: "offline", cancel: void 0 });
        emit("heal");
        return { state: "offline" };
      }
      S.pending = null;
      S.error = { code: "http", plain: ctx.api?.plain ? ctx.api.plain(e) : COPY.unfinished, detail: e?.message || String(e) };
      emit("error");
      return { state: "error", error: S.error };
    }
  }
  function settled() {
    const { S } = V;
    return new Promise((res) => {
      const check = () => S.pending && S.pending.state !== "offline" ? setTimeout(check, 250) : res();
      check();
    });
  }
  function values({ extra = [], drop = [], order = null, hitsMax } = {}) {
    const { S, accNow, cctxNow, ownedNow, storedNow, withHits, withHold } = V;
    const after = pinsAfter(storedNow(), { add: extra, drop }, S.A, ownedNow());
    const list = withHits(withHold(order ? order(after) : after), hitsMax === void 0 ? num(accNow()?.hits_max) : num(hitsMax));
    const cctx = cctxNow(list);
    if (!cctx) throw new Error("Forkcast memory: no bundle yet");
    return planValues(cctx, list);
  }
  function offer(road, { values: vals = null, error = null, version = null } = {}) {
    const { S, composeNow, versionNow } = V;
    const v = versionNow();
    if (S.offered.v !== v) S.offered = { v, roads: [], solved: /* @__PURE__ */ new Map() };
    if (vals) {
      if (version == null || !road?.weeks?.length && error?.code !== "infeasible") return;
      const k = solvedKey(version, vals), got = road?.weeks?.length ? { road, error: null } : { road: null, error };
      const solved = S.offered.solved;
      solved.delete(k);
      solved.set(k, got);
      for (const old of solved.keys()) {
        if (solved.size <= SOLVED_MAX) break;
        solved.delete(old);
      }
      if (S.pending?.ahead === k && S.pending.state !== "offline" && keyNow() === k) {
        const { reason } = S.pending;
        cancelHeal();
        took(got, sigOf(composeNow()), reason, true);
      }
      return;
    }
    if (!road?.weeks?.length) return;
    const same = (r) => r === road || road.key != null && r.key === road.key;
    S.offered.roads = [road, ...S.offered.roads.filter((r) => !same(r))].slice(0, OFFERED_MAX);
  }
  function rejudge() {
    const { S, accNow, cctxNow, ctx, ensure, frozenNow, ideaOf, mutate, pinsNow, roadOf, stamp, versionNow } = V;
    const acc = accNow();
    const version = versionNow();
    const fresh = version && version === ctx.bundle?.version;
    if (!acc?.plan || !fresh) return;
    const sig = `${version}|${V.model().key}|${!!V.model().road}|${madeOn(acc)}|${acc.plan.key}|${acc.plan.version}|${acc.lineup?.captain}|${JSON.stringify(acc.pins?.items?.map((p) => p.id))}`;
    if (S.judged === sig) return;
    S.judged = sig;
    let d = null;
    try {
      d = detectDrift(cctxNow(), acc, version, { frozen: frozenNow(), before: roadOf(madeOn(acc), "base"), hold: pinsNow().find((p) => p.id === "hold") ?? null });
    } catch (e) {
      console.error("Forkcast memory: drift check failed", e);
    }
    if (d) {
      mutate((doc) => {
        const a = ensure(doc);
        stamp(a, version);
        const idea = ideaOf(d);
        if (d.kind === "kept" && idea && idea.delta >= 0.05) a.notes = [...a.notes || [], { kind: "kept", at: nowS(), text: d.reach ? COPY.kept : COPY.keptLocked(d.gw), ...idea }].slice(-20);
      }, "drift");
      replan("sync");
    }
  }
  const round2 = (x) => Math.round(x * 100) / 100;
  return { replan, keyNow, took, batch, keepBase, baseNow, lastNow, cancelHeal, scheduleHeal, yours, runHeal, settled, values, offer, rejudge, round2 };
}

// js/m/memory/live-api.js
function apiPart(V) {
  const ideaOf = (d) => {
    const { cctxNow, round2 } = V;
    return d?.fresh == null ? null : { delta: round2(d.fresh), label: d.freshLabel ?? verdictLabel(d.fresh, cctxNow()?.noise ?? 0) };
  };
  function inkOf(pins = []) {
    const { S, accNow, ctx, frozenNow, lockedNow, pinsNow } = V;
    const live = deadlinePassed(ctx.bundle?.meta);
    if (!lockedNow() && !live) return null;
    const rp = pinsNow().find((p) => p.id === "road");
    for (const p of pins) {
      const pin = p?.must ? p : makePin(p);
      if (live && changesLiveA(pin)) return { gw: null, text: COPY.live(S.A) };
      const g = lockedNow() ? frozenClash(rp, pin, S.A) : null;
      if (g != null) return { gw: g, text: COPY.frozenEdit(g, frozenSince(frozenOnOf(accNow(), frozenNow()), g).at) };
    }
    return null;
  }
  const inkClash = (pins = []) => inkOf(pins)?.text ?? null;
  const changesLiveA = (pin) => {
    const { S, intoNow } = V;
    const A = S.A, squad = new Set(intoNow(A + 1));
    if (heldAt(pin.must, A).some((id) => !squad.has(id)) || heldAt(pin.excl, A).some((id) => squad.has(id))) return true;
    return num(pin.gw) === A && (isRoll(pin) || ["hits", "chip"].includes(kindOf(pin))) || Object.keys(pin.hits || {}).map(Number).includes(A) || !!(pin.chips && A in pin.chips);
  };
  function addPin(pin, { replace = true } = {}) {
    const { S, endNow, ensure, intoNow, mutate, op, ownedNow, pinsNow, replan, setPins, stamp } = V;
    const p = pin?.must ? pin : makePin(pin);
    if (p.id === "hold") return { ok: false, conflicts: [], clash: null, undo: () => false };
    const ink = inkClash([p]);
    if (ink) return { ok: false, locked: true, conflicts: [], clash: ink, undo: () => false };
    const rp = pinsNow().find((x) => x.id === "road");
    const yields = !!rp && !rp.yielded && changesGwA(rp, p, S.A, ownedNow());
    const conflicts = pinConflicts(pinsNow(), p, { from: S.A, to: endNow(), into: intoNow }).filter((c) => !(yields && c.pin?.id === "road") && c.pin?.id !== "hold");
    const clash = conflicts.length ? clashText(conflicts[0], p) : null;
    if (conflicts.length && !replace) return { ok: false, conflicts, clash, undo: () => false };
    const r = op(() => {
      mutate((doc) => {
        const a = ensure(doc);
        setPins(a, pinsAfter(a.pins.items, { add: [p] }, S.A, ownedNow()));
        if (!madeOn(a)) stamp(a);
      }, "pins");
      replan("pins");
    });
    return { ok: true, conflicts, clash, undo: r.undo };
  }
  function clashText(c, p) {
    const { lookupNow } = V;
    const L = lookupNow();
    const name = L.name(c.id);
    const held = (c.pin?.must || []).filter(([id]) => id === c.id).map(([, , b]) => b);
    if (c.was === "in") return COPY.pinClash(name, held.length ? Math.max(...held) : Math.max(...c.gws), Math.min(...c.gws));
    const g = Math.min(...c.gws);
    if (c.was === "roll") return `Moving ${name} in GW${g} clashes with ${COPY.rollRule(g, rollKeeps(c.pin))}. Which one?`;
    if (c.was === "moves") return `${COPY.rollRule(g, rollKeeps(p))} clashes with ${c.pin?.label || "an earlier pick"} (it moves ${name} in GW${g}). Which one?`;
    return `Buying ${name} in GW${g} clashes with ${c.pin?.label || "an earlier pick"}. Which one?`;
  }
  function dropPins(a, drop) {
    const { setPins } = V;
    const items = pinsAfter(a.pins.items, { drop });
    if (items.length === a.pins.items.length) return false;
    const road = a.pins.items.some((p) => p.id === "road") && !items.some((p) => p.id === "road");
    setPins(a, items);
    if (road) {
      a.roads_taken = a.roads_taken.filter((t) => t.call !== "transfer");
      a.verdicts = a.verdicts.filter((v) => v.call !== "transfer");
    }
    return true;
  }
  function removePin(id) {
    const { ensure, mutate, op, pinsNow, replan } = V;
    if (id === "hold" || id === "road" && pinsNow().find((p) => p.id === "road")?.locked) return { undo: () => false, refused: true };
    return op(() => {
      mutate((doc) => {
        if (doc.accepted) dropPins(ensure(doc), (p) => p.id === id);
      }, "pins");
      replan("pins");
    });
  }
  function reset() {
    const { S, local, mutate, replan } = V;
    const r = mutate((doc) => {
      doc.accepted = null;
      doc.ticket = null;
    }, "pins");
    if (S.entry) {
      local.set(EDIT(S.entry), null);
      local.set(SEEN(S.entry), null);
    }
    S.reopened = null;
    S.judged = null;
    S.error = null;
    replan("pins");
    return r;
  }
  function setHitsMax(n) {
    const { ensure, mutate, replan } = V;
    const r = mutate((doc) => {
      const a = ensure(doc);
      if (num(n) == null) delete a.hits_max;
      else a.hits_max = num(n);
      a.plan = null;
    }, "pins");
    replan("pins");
    return r;
  }
  function setLineup(patch = {}) {
    const { ensure, mutate } = V;
    return mutate((doc) => {
      const a = ensure(doc);
      a.lineup = { ...a.lineup || {}, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== void 0)) };
    }, "lineup");
  }
  function setPlan(road, { why = "plan" } = {}) {
    const { cancelHeal, composeNow, ctx, ensure, mutate, versionNow } = V;
    cancelHeal();
    return mutate((doc) => {
      ensure(doc).plan = planOfRoad(road, ctx.bundle?.version ?? versionNow(), sigOf(composeNow()));
    }, why);
  }
  function heal({ purpose = "heal", now = false } = {}) {
    const { accNow, getPlan, holdNow, pinsNow, scheduleHeal } = V;
    if (!accNow() && !holdNow() || !pinsNow().length) return Promise.resolve({ state: "done", road: getPlan().road });
    return scheduleHeal(purpose, { now });
  }
  function compare2() {
    const { cctxNow, getPlan } = V;
    const cctx = cctxNow();
    const plan = getPlan();
    if (!cctx || !plan.model || plan.source === "model") return null;
    const mine = planFromRoad(cctx, plan.road, plan.lineup || {});
    const model = planFromRoad(cctx, plan.model);
    return compare(cctx, mine.evaluation, model.evaluation);
  }
  const evalOf = (road) => {
    const { accNow, cctxNow } = V;
    const cctx = cctxNow();
    return cctx && road?.weeks?.length ? planFromRoad(cctx, road, accNow()?.lineup || {}).evaluation : null;
  };
  const lite = (ev) => ev.gws.map((w) => ({ gw: w.gw, xi: w.xi, bench: w.bench, captain: w.captain, chip: w.chip, hits: w.hits, ft: w.ft, used: w.used, points: w.points, moves: w.moves.filter((m) => m.ok).map((m) => ({ out: m.out, in: m.in })) }));
  function noteEdit({ what, dir = null, pins = null, edit = null } = {}) {
    const { S, composeNow, getPlan, local } = V;
    if (!S.entry) return;
    const before = evalOf(getPlan().road);
    local.set(EDIT(S.entry), JSON.stringify({ gw: S.A, edit, what, dir, pins, sig: sigOf(composeNow()), before: before ? lite(before) : null, at: Date.now() }));
  }
  function claimEdit() {
    const { S, local } = V;
    const r = S.entry ? local.json(EDIT(S.entry)) : null;
    if (S.entry) local.set(EDIT(S.entry), null);
    S.reopened = null;
    return r;
  }
  function receipt(sig, error = null) {
    const { S, cctxNow, ctx, getPlan, gwsNow, local } = V;
    const r = S.entry ? local.json(EDIT(S.entry)) : null;
    if (!r || Number(r.gw) !== S.A || r.sig !== sig) return;
    local.set(EDIT(S.entry), null);
    S.reopened = null;
    const toast = ctx.ui?.toast;
    if (!toast) return;
    const undo = Array.isArray(r.pins) ? { label: "Undo", onClick: () => restorePins(r.pins) } : void 0;
    const rules = !error?.code || error.code === "infeasible" || error.code === "pins";
    if (error) {
      toast(rules ? COPY.rulesClash(null, r.what) : error.plain || COPY.unfinished, "warn", { timeout: 9e3, action: undo, replaces: "pending" });
      return;
    }
    const now = evalOf(getPlan().road);
    if (!now || !r.before) return;
    const cmp = compare(cctxNow(), now, { gws: r.before });
    toast(
      withForced(changeText(r.what, cmp, { dir: r.dir, transfers: [transfersOf({ gws: r.before }), transfersOf(now)] }), forcedHits(getPlan().road, gwsNow())),
      "info",
      { timeout: 6500, action: undo, replaces: "pending", quiet: cardSaysIt() }
    );
  }
  function restorePins(pins) {
    const { ensure, mutate, op, replan, setPins } = V;
    return op(() => {
      mutate((doc) => {
        setPins(ensure(doc), pins);
      }, "undo");
      replan("pins");
    });
  }
  function pencilDiff() {
    const { S, getPlan, local, lookupNow } = V;
    const plan = getPlan();
    if (!S.entry || !plan.road?.weeks) return null;
    const seen = local.json(SEEN(S.entry));
    const sig = `${plan.road.key}|${plan.version}`;
    if (!seen || Number(seen.gw) !== S.A) {
      markSeen();
      return null;
    }
    if (seen.sig === sig) return null;
    const L = lookupNow();
    return pencilChanges(seen.weeks, plan.road.weeks, S.A, L);
  }
  function markSeen() {
    const { S, getPlan, local } = V;
    const plan = getPlan();
    if (!S.entry || !plan.road?.weeks) return;
    local.set(SEEN(S.entry), JSON.stringify({ gw: S.A, sig: `${plan.road.key}|${plan.version}`, v: plan.version, src: !plan.hold && plan.source === "model" ? "model" : "yours", weeks: plan.road.weeks.map((w) => ({ gw: w.gw, in: w.in, out: w.out })) }));
  }
  function forecastChange() {
    const { S, cctxNow, getPlan, local, lookupNow, roadByKey, roadOf } = V;
    const plan = getPlan();
    const seen = S.entry ? local.json(SEEN(S.entry)) : null;
    const held = !!plan.hold;
    if (!held && (plan.source !== "model" || seen?.src !== "model") || Number(seen?.gw) !== S.A || !seen.v || seen.v === plan.version) return null;
    const was = roadOf(seen.v, "base"), now = held ? roadByKey("base") : plan.road;
    const cctx = cctxNow();
    if (!cctx || !now?.weeks || !isNews(cctx, freshOf(cctx, planFromRoad(cctx, now).evaluation, was))) return null;
    const L = lookupNow();
    const gwA = movesChanged(weekAt(held ? was : seen, S.A), weekAt(now, S.A), L);
    const pencil = held ? pencilChanges(was.weeks, now.weeks, S.A, L) : pencilDiff();
    return gwA || pencil ? { version: plan.version, gwA, pencil, held } : null;
  }
  async function loadAll() {
    const { S, ctx } = V;
    if (!S.entry) return {};
    const out = await ctx.api.request("GET", "/api/m/memory", { query: { entry: S.entry, gw: "all" } });
    S.docs = out?.docs || {};
    return S.docs;
  }
  async function journal() {
    const { S, lookupNow } = V;
    let docs = {};
    try {
      docs = await loadAll();
    } catch (e) {
      if (e?.code !== "unreachable" && e?.code !== "timeout") throw e;
      docs = S.docs || {};
    }
    if (S.doc) docs = { ...docs, [S.A]: S.doc };
    const L = lookupNow();
    return journalRows(docs, { nameOf: L.name });
  }
  function unused(entry, ...docs) {
    const { local } = V;
    const last = Math.max(Number(local.get(USED(entry))) || 0, ...docs.map((d) => editedAt(d) * 1e3));
    return last > 0 && Date.now() - last > FORGET_MS;
  }
  function onData() {
    const { S, cancelHeal, capFor, ctx, emit, endNow, ensure, flushSoon, loadLocal, local, lookupNow, mutate, rejudge, replan, saveLocal } = V;
    const b = ctx.bundle;
    if (!b?.entry || !b.meta || !ctx.data) return;
    const entry = String(b.entry.id);
    const A = Number(b.meta.gw);
    let why = "bundle";
    if (entry !== S.entry || A !== S.A) {
      cancelHeal();
      const kept = loadLocal(entry, A);
      const r = local.json(EDIT(entry));
      Object.assign(S, {
        entry,
        A,
        doc: kept?.doc ?? null,
        docs: null,
        dirty: !!kept?.dirty,
        judged: null,
        error: null,
        carried: null,
        notice: null,
        base: null,
        reopened: r && Number(r.gw) === A ? r : null,
        // not used for FORGET_MS (USED), or signed out of before its forgetting reached the server (forget): wiped as it
        // loads, with no way back
        wipe: unused(entry, kept?.doc, b.memory) || !!local.get(FORGET(entry))
      });
      if (local.get(FORGET(entry))) forget(ctx.api, entry);
    }
    const server = b.memory ?? null;
    if (!S.dirty && server && server !== S.doc && (!S.doc || (server.updated_epoch ?? 0) >= (S.doc.updated_epoch ?? 0))) {
      S.doc = server;
      saveLocal();
    }
    if (S.wipe) {
      S.wipe = false;
      reset();
    }
    if (S.dirty) flushSoon();
    const fix = S.doc ? inkRepair(S.doc, { A, model: V.model().road, nameOf: lookupNow().name }) : null;
    if (fix) {
      mutate((doc) => {
        doc.accepted = fix;
      }, "lock");
      replan("pins");
    }
    const idle = S.doc?.accepted ? idleRules(S.doc.accepted.pins?.items || [], { from: A, to: endNow(), hitCap: capFor(S.doc.accepted) }) : [];
    if (idle.length) mutate((doc) => {
      ensure(doc);
    }, "pins");
    if (!S.doc && S.carried !== A) carryOver(entry, A);
    rejudge();
    syncPlan();
    emit(why);
  }
  function syncPlan() {
    const { S, accNow, baseNow, ctx, holdNow, lockedNow, pinsNow, replan, versionNow } = V;
    const acc = accNow();
    if (S.pending) return;
    if (holdNow() && !acc?.plan && !S.error && (acc || baseNow()?.version !== versionNow())) {
      replan("sync");
      return;
    }
    if (!acc?.plan || madeOn(acc) !== versionNow()) return;
    if (!pinsNow().length && lockedNow()) return;
    replan("sync");
  }
  async function carryOver(entry, A) {
    const { S, ctx, endNow, ensure, lookupNow, mutate, replan, setPins } = V;
    S.carried = A;
    let docs;
    try {
      docs = await loadAll();
    } catch {
      return;
    }
    if (S.entry !== entry || S.A !== A || S.doc) return;
    const prev = docs[String(A - 1)];
    const end = ids(ctx.bundle?.meta?.reach).at(-1) ?? endNow();
    const carried = carryPins(prev, A, end);
    const said = (p) => ruleText(p, lookupNow().name, { start: A, end }).text;
    const text = COPY.carried(A - 1, carried.map(said));
    if (!text) return;
    S.notice = { gw: A, text };
    mutate((doc) => {
      const a = ensure(doc);
      setPins(a, carried);
      a.at = editedAt(prev) || a.at;
      a.notes = [{ kind: "carried", at: nowS(), text }];
    }, "pins");
    replan("sync");
  }
  return { ideaOf, inkOf, inkClash, changesLiveA, addPin, clashText, dropPins, removePin, reset, setHitsMax, setLineup, setPlan, heal, compare: compare2, evalOf, lite, noteEdit, claimEdit, receipt, restorePins, pencilDiff, markSeen, forecastChange, loadAll, journal, unused, onData, syncPlan, carryOver };
}

// js/m/memory/live-model.js
var AGAIN_MS = 5e3;
function modelPart(V) {
  let asked = { b: null, d: null, ask: null };
  const modelAsk = () => {
    const { ctx } = V;
    const b = ctx.bundle, d = ctx.data;
    if (!b?.entry || !d) return null;
    if (asked.b !== b || asked.d !== d) {
      let ask = null;
      try {
        const values = firstPlanValues(planInputs(b, d), ctx.planDefault);
        ask = { key: solvedKey(b.version ?? null, values), values };
      } catch {
      }
      asked = { b, d, ask };
    }
    return asked.ask;
  };
  const keptModel = (key) => {
    const { S, local } = V;
    const a = S.entry ? local.json(ROADS(S.entry)) : null;
    return a?.versions?.find((x) => x.key === key)?.road ?? null;
  };
  const keepModel = (key, road) => {
    const { S, ctx, local } = V;
    const v = ctx.bundle?.version ?? null;
    const a = local.json(ROADS(S.entry)) || { versions: [] };
    local.set(ROADS(S.entry), JSON.stringify({ versions: [{ v, key, road }, ...(a.versions || []).filter((x) => x.v !== v && x.road)].slice(0, ARCHIVE_VERSIONS) }));
  };
  const modelOn = (version) => {
    const { S, local } = V;
    const a = S.entry ? local.json(ROADS(S.entry)) : null;
    return a?.versions?.find((x) => x.v === version)?.road ?? null;
  };
  function model() {
    const { S, ctx } = V;
    const ask = modelAsk();
    if (!ask) return { key: null, road: null, error: null, since: null, values: null };
    if (S.model?.key !== ask.key) S.model = { key: ask.key, road: keptModel(ask.key), error: null, since: null, p: null };
    const m = S.model;
    if (m.error?.code === "unreachable" && Date.now() - m.error.at > AGAIN_MS) m.error = null;
    const conn = ctx.store.get("conn");
    const want = ctx.presolveOn?.() !== false || m.want;
    if (want && !m.road && !m.p && !m.error && ctx.api?.solve && conn?.state !== "offline" && !conn?.snapshot) {
      m.since = Date.now();
      m.p = solveKept(ctx.api, { entry: Number(S.entry), purpose: "plan", values: ask.values }, void 0, { what: "the solver's best \xB7 none of your rules" });
      m.p.then((r) => {
        if (S.model !== m) return;
        m.p = null;
        if (r.road) {
          m.road = r.road;
          keepModel(m.key, r.road);
        } else if (r.state === "error") m.error = r.error ?? { code: "solver" };
        else return;
        V.landed();
      }, () => {
        if (S.model === m) {
          m.p = null;
          m.error = { code: "unreachable", at: Date.now() };
          V.landed();
        }
      });
    }
    return { key: m.key, road: m.road, error: m.error, since: m.road ? null : m.since, values: ask.values };
  }
  function wantModel() {
    const { S } = V;
    model();
    if (S.model) S.model.want = true;
    return model();
  }
  function retryModel() {
    const { S } = V;
    if (S.model?.error) S.model = null;
    model();
  }
  return { model, wantModel, retryModel, modelOn };
}

// js/m/memory/live.js
var blankAccepted = (roadsV, dataV = roadsV, hold = false) => ({
  hold,
  at: nowS(),
  roads_version: roadsV ?? null,
  data_version: dataV ?? null,
  roads_taken: [],
  pins: { must_have: "", exclude: "", items: [] },
  plan: null,
  lineup: null,
  chip: null,
  verdicts: [],
  locked_at: null,
  notes: []
});
function editedAt(doc) {
  const a = doc?.accepted;
  if (!a) return 0;
  return Math.max(0, num(a.at) ?? 0, ...(a.pins?.items || []).map((p) => num(p?.at) ?? 0), ...(a.roads_taken || []).map((t) => num(t?.at) ?? 0));
}
var ROADS = (entry) => `fc:mem:roads:${entry}`;
var ARCHIVE_VERSIONS = 3;
function createMemory(ctx) {
  const V = {
    get S() {
      return S;
    },
    get accMemo() {
      return accMemo;
    },
    set accMemo(v) {
      accMemo = v;
    },
    get accNow() {
      return accNow;
    },
    get baseNow() {
      return baseNow;
    },
    get cancelHeal() {
      return cancelHeal;
    },
    get capFor() {
      return capFor;
    },
    get cctxNow() {
      return cctxNow;
    },
    get composeNow() {
      return composeNow;
    },
    get ctx() {
      return ctx;
    },
    get emit() {
      return emit;
    },
    get endNow() {
      return endNow;
    },
    get ensure() {
      return ensure;
    },
    get flushSoon() {
      return flushSoon;
    },
    get frozenNow() {
      return frozenNow;
    },
    get getPlan() {
      return getPlan;
    },
    get gwsNow() {
      return gwsNow;
    },
    get holdNow() {
      return holdNow;
    },
    get ideaOf() {
      return ideaOf;
    },
    get intoNow() {
      return intoNow;
    },
    get lastNow() {
      return lastNow;
    },
    get loadLocal() {
      return loadLocal;
    },
    get local() {
      return local;
    },
    get lockedNow() {
      return lockedNow;
    },
    get lookupNow() {
      return lookupNow;
    },
    get markSeen() {
      return markSeen;
    },
    get model() {
      return model;
    },
    get modelOn() {
      return modelOn;
    },
    get landed() {
      return landed;
    },
    get mutate() {
      return mutate;
    },
    get op() {
      return op;
    },
    get ownedNow() {
      return ownedNow;
    },
    get pinsNow() {
      return pinsNow;
    },
    get receipt() {
      return receipt;
    },
    get rejudge() {
      return rejudge;
    },
    get replan() {
      return replan;
    },
    get roadByKey() {
      return roadByKey;
    },
    get roadOf() {
      return roadOf;
    },
    get syncPlan() {
      return syncPlan;
    },
    get round2() {
      return round2;
    },
    get saveLocal() {
      return saveLocal;
    },
    get scheduleHeal() {
      return scheduleHeal;
    },
    get setPins() {
      return setPins;
    },
    get stamp() {
      return stamp;
    },
    get store() {
      return store;
    },
    get storedNow() {
      return storedNow;
    },
    get subs() {
      return subs;
    },
    get versionNow() {
      return versionNow;
    },
    get withHits() {
      return withHits;
    },
    get withHold() {
      return withHold;
    }
  };
  const { cctxNow, versionNow, gwsNow, endNow, accNow, holdOn, holdNow, capFor, storedNow, withHold, withHits, pinsNow, frozenNow, lockedNow, composeNow, ownedNow, intoNow, lookupNow, getPlan, transferInForce, weekState, emit, roadByKey, roadOf, saveLocal, loadLocal, flushSoon, flush, samePlan, mutate, op, ensure, stamp, setPins } = statePart(V);
  const { replan, keyNow, took, batch, keepBase, baseNow, lastNow, cancelHeal, scheduleHeal, yours, runHeal, settled, values, offer, rejudge, round2 } = healPart(V);
  const { ideaOf, inkOf, inkClash, changesLiveA, addPin, clashText, dropPins, removePin, reset, setHitsMax, setLineup, setPlan, heal, compare: compare2, evalOf, lite, noteEdit, claimEdit, receipt, restorePins, pencilDiff, markSeen, forecastChange, loadAll, journal, unused, onData, syncPlan, carryOver } = apiPart(V);
  const S = {
    entry: null,
    A: null,
    doc: null,
    docs: null,
    dirty: false,
    seq: 0,
    inflight: null,
    flushTimer: null,
    judged: null,
    pending: null,
    healTimer: null,
    healSeq: 0,
    queued: null,
    error: null,
    carried: null,
    notice: null,
    offered: { v: null, roads: [], solved: /* @__PURE__ */ new Map() },
    reopened: null,
    base: null,
    last: null,
    batch: null,
    aheadSig: null,
    model: null
  };
  const { model, wantModel, retryModel, modelOn } = modelPart(V);
  function landed() {
    rejudge();
    syncPlan();
    emit("model");
  }
  const subs = /* @__PURE__ */ new Set();
  const store = ctx.store;
  const local = ctx.api.local;
  let accMemo = { doc: void 0, v: void 0, acc: null };
  const offs = [
    store.on("data", onData),
    store.on("conn", (c) => {
      if (c?.state === "offline") return;
      model();
      if (S.dirty) flushSoon(0);
      if (S.queued && S.pending?.state === "offline") scheduleHeal(S.queued, { now: true });
    })
  ];
  onData();
  return {
    ctx,
    getPlan,
    onChange(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    model,
    wantModel,
    retryModel,
    inkOf,
    inkClash,
    addPin,
    removePin,
    restorePins,
    batch,
    setHitsMax,
    reset,
    setLineup,
    setPlan,
    values,
    offer,
    heal,
    settled,
    compare: compare2,
    // whether a solve of exactly these values was offered (offer `values`): ahead.js presolve asks it no more
    solved: (vals) => S.offered.v === versionNow() && S.offered.solved.has(solvedKey(ctx.bundle?.version ?? null, vals)),
    solvedRoad: (vals) => S.offered.v === versionNow() ? S.offered.solved.get(solvedKey(ctx.bundle?.version ?? null, vals))?.road ?? null : null,
    pencilDiff,
    markSeen,
    forecastChange,
    journal,
    noteEdit,
    claimEdit,
    // detached: a save still in flight lands without writing this device's mirror (sign-out cleared it) → that save
    // (forget waits for it, so it never lands over the forgetting)
    flush,
    detach() {
      offs.forEach((f) => f());
      subs.clear();
      cancelHeal();
      S.model?.p?.cancel?.();
      S.model = null;
      clearTimeout(S.flushTimer);
      S.entry = null;
      return S.inflight;
    }
  };
}
var current = null;
function attach(ctx) {
  if (!current && ctx) current = createMemory(ctx);
  return current;
}
function release(api, entry) {
  const m = current;
  current = null;
  return forget(api, entry, m?.detach());
}
var forgetting = /* @__PURE__ */ new Map();
function forget(api, entry, after = null) {
  if (!api?.local || entry == null) return Promise.resolve(false);
  const e = String(entry);
  for (const k of [LOCAL, SEEN, EDIT, ROADS]) api.local.set(k(e), null);
  if (forgetting.has(e)) return forgetting.get(e);
  api.local.set(FORGET(e), "1");
  const p = (async () => {
    try {
      await Promise.resolve(after).catch(() => {
      });
      const out = await api.request("GET", "/api/m/memory", { query: { entry: Number(e), gw: "all" } });
      const kept = Object.entries(out?.docs || {}).filter(([, d]) => d?.accepted != null || d?.ticket != null);
      await Promise.all(kept.map(([gw]) => api.putMemory({ entry: Number(e), gw: Number(gw), accepted: null, ticket: null })));
      api.local.set(FORGET(e), null);
      return true;
    } catch {
      return false;
    } finally {
      forgetting.delete(e);
    }
  })();
  forgetting.set(e, p);
  return p;
}

// js/m/memory.js
var memory_exports = {};
__export(memory_exports, {
  FORGET_MS: () => FORGET_MS,
  ROADS: () => ROADS,
  SOLVES: () => SOLVES,
  TIMING: () => TIMING,
  USED: () => USED,
  attach: () => attach,
  barredAt: () => barredAt,
  brokenCells: () => brokenCells,
  carryPins: () => carryPins,
  changesGwA: () => changesGwA,
  composePins: () => composePins,
  createMemory: () => createMemory,
  deadlinePassed: () => deadlinePassed,
  detectDrift: () => detectDrift,
  diffWords: () => diffWords,
  editedAt: () => editedAt,
  exactAt: () => exactAt,
  findRoad: () => findRoad,
  firstPlanValues: () => firstPlanValues,
  forcedHits: () => forcedHits,
  forget: () => forget,
  frozenClash: () => frozenClash,
  frozenHolds: () => frozenHolds,
  frozenOnOf: () => frozenOnOf,
  frozenSince: () => frozenSince,
  frozenWeeks: () => frozenWeeks,
  holdOf: () => holdOf,
  idleRules: () => idleRules,
  inkRepair: () => inkRepair,
  isExact: () => isExact,
  isRoll: () => isRoll,
  journalRows: () => journalRows,
  legality: () => legality,
  lockPin: () => lockPin,
  madeOn: () => madeOn,
  makePin: () => makePin,
  movesChanged: () => movesChanged,
  movesIn: () => movesIn,
  normalizeAccepted: () => normalizeAccepted,
  optionPins: () => optionPins,
  optionsRoad: () => optionsRoad,
  optionsValues: () => optionsValues,
  parseSpans: () => parseSpans,
  pencilChanges: () => pencilChanges,
  pinCash: () => pinCash,
  pinChip: () => pinChip,
  pinConflicts: () => pinConflicts,
  pinFrozen: () => pinFrozen,
  pinHits: () => pinHits,
  pinKeep: () => pinKeep,
  pinNever: () => pinNever,
  pinNotFor: () => pinNotFor,
  pinRoad: () => pinRoad,
  pinRoll: () => pinRoll,
  pinSell: () => pinSell,
  pinSlide: () => pinSlide,
  pinVeto: () => pinVeto,
  pinWish: () => pinWish,
  pinsAfter: () => pinsAfter,
  pinsDir: () => pinsDir,
  planDiff: () => planDiff,
  planValues: () => planValues,
  release: () => release,
  roadCaps: () => roadCaps,
  roadFits: () => roadFits,
  rollKeeps: () => rollKeeps,
  ruleText: () => ruleText,
  rulesBroken: () => rulesBroken,
  scopeOf: () => scopeOf,
  sinceText: () => sinceText,
  solveKept: () => solveKept,
  solvedKey: () => solvedKey,
  solvedLineup: () => solvedLineup,
  spanString: () => spanString,
  splitRoad: () => splitRoad,
  squadInto: () => squadInto,
  thawPin: () => thawPin,
  ticketSquad: () => ticketSquad,
  unbuyableDropped: () => unbuyableDropped,
  withBank: () => withBank,
  yieldRoad: () => yieldRoad
});

export {
  shirt,
  kits_exports,
  xpAt,
  oppText,
  fplMarks,
  fitFixtures,
  subOrder,
  pitch_exports,
  solvedLineup,
  forcedHits,
  SOLVES,
  ANSWERED,
  noteAnswer,
  solveKept,
  ruleText,
  findRoad,
  solvedKey,
  USED,
  range,
  isRoll,
  isExact,
  rollKeeps,
  parseSpans,
  composePins,
  pinConflicts,
  pinsDir,
  makePin,
  barredAt,
  deadlinePassed,
  pinSell,
  pinVeto,
  pinNever,
  pinNotFor,
  pinKeep,
  scopeOf,
  pinChip,
  withBank,
  pinHits,
  squadInto,
  pinRoll,
  ROADS,
  attach,
  release,
  memory_exports
};
