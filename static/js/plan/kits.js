// Club kits: a flat inline-SVG shirt per club, for the pitch and player lists; or, when this browser opts in, FPL's
// official shirt image for the club (off by default, kitSource).
//   shirt({club, gk, size, title, turf, tall}) → <svg> | <img>      clubColor(club) → '#rrggbb' for small accents
//   FPL_FRAME: FPL's shirt image frame (220 × 290) and where its shirt sits in it, which shirt({tall}) gives both sources
//   kitSource() / setKitSource(s) 'drawn' | 'official'      kitSourceRow() → the "Shirts: Drawn | Official" control
// Keyed by the club short codes /api/players returns in `teams` (2026: the 20 below). Unknown → grey.
// Official images are never copied or stored by Forkcast: the viewer's browser loads them from FPL's own server, only
// while this browser has chosen them (Premier League terms allow private, personal use only).

import { h, svg, uid, roving } from '../ui.js';

// A kit spec: a club's outfield shirt, and `g` its goalkeeper's (a spec of its own, or just a body colour). Drawn from
// FPL's 2026/27 shirt images, measured (2026-10-07, details 2026-10-08); missing fields fall back to the body colour (see paint).
//   b body · gr the body's lower colour (fades in below the chest) · s sleeves · kt a trim line above the cuff
//   k cuffs: a colour, or a list of bands from the cuff's edge up · kw their reach up the sleeve (default 2.3; a list with k's)
//   ls long sleeves (default: a goalkeeper's, as FPL draws them; false: short) — a long sleeve's cuff band (kw ≈ 10) is
//     a forearm panel
//   c collar · cs its shape: 'crew' (default) | 'v' | 'polo' | 'wrap' · vd a V's depth (its point's y, default 15.2)
//     cw the collar band's width (default 2.6; a thin one in a light colour over ct rings is a piped edge) · ct trim rings
//     under the collar (a polo's: along its wings' edge) · ci the collar's inside at the front (above its band)
//     n back of the neck · pk a polo's placket (default the body colour; false: none, so no buttons) · pe its edge colour
//     bt its buttons (default the collar; false: none)
//   v body bands, sv sleeve bands: [colour, period, width, offset, angle°] — repeated every `period` (0: one band) at
//     `offset` from the centre line, upright (angle 0: stripes), level (90: hoops) or slanted (a sash); in the 64-unit
//     box, the torso ≈ 30 wide (x 17–47); a sleeve's bands run along its length
//   rg raglan: the sleeves' colour carried over the shoulder to the collar
//   sh shoulder stripes [colour, n, width, gap = width, from = 0.25] along the shoulder seam, the first `from` inside it (the
//     seam runs 0.55 inside the shirt's edge: -0.55 puts it flush with the edge); colour and width may be lists (one per
//     stripe, seam first); a 6th item `len` stops them that share of the way from the neck to the cuff (on the shoulder)
//   ch chevrons (a kit maker's short bars across the shoulder seam) [colour, n = 3, width (across the seam) = 1.2, in from
//     the seam = 1.4, start = 0.06, length = 0.05, gap = 0.035] — the last three as shares of the seam from the neck
//   ar piping beside the armhole seam [colour, width, length = 1 (share of the way from the shoulder to the armpit)]
//   sl a side line [colour, width]: from under the arm, bowing in, to the hem · sc the side crescent outside that line
//   sp side panels [colour, width] · x accent (clubColor)
// code: FPL's team code (bootstrap teams[].code, not the team id: Arsenal = 3), the official shirt image's name
const WHITE = '#ffffff', BLACK = '#16181d';
/** Stripes period p, width w; a stripe on the centre line (gap = false) or a gap there (gap = true). */
const stripes = (a, p, w, gap = false, angle = 0) => [a, p, w, gap ? p / 2 : 0, angle];
/** The kit maker's three shoulder stripes as FPL's image shows them: two visible at its angle (the third under the arm). */
const two = (a) => [a, 2, 1.2, 0.7];
/** Arsenal's (2026-10-07, FPL's right shoulder, 1 px = 0.295): a 1.05 stripe flush with the edge, 0.9 gap, a 1.5 stripe. */
const arsenal = (a) => [a, 2, [1.05, 1.5], 0.9, -0.55];

export const KITS = {
  ARS: { code: 3, b: '#dc1d29', s: '#f4f4f4', rg: '#f4f4f4', k: '#b0232f', kw: 1.5, c: '#b81e24', n: '#761b26', sh: arsenal(['#a51e2a', '#6d3c46']),
    g: { b: '#dcdbd7', gr: '#c4c1b6', c: '#cfcfcd', n: '#a4a4a4', k: '#d6d6d6', sh: arsenal(BLACK) } },
  AVL: { code: 7, b: '#471828', c: '#c9e0f5', cs: 'polo', ct: ['#5b1a2c'], n: '#a1bfe7', pk: '#d4e8fc', bt: false, k: '#b9d3ee', kw: 1.8,
    sh: two('#c1d6ec'),
    g: { b: '#fcf30a', gr: '#f4d42a', c: '#ebe006', n: '#8f8200', k: '#fcf30a', sh: two(BLACK) } },
  BOU: { code: 91, b: '#d2202b', v: [stripes('#1d1719', 9.9, 4.6)], s: '#d2202b', sv: [['#1d1719', 9.9, 4.6, 2.5]], k: '#b8a774', kw: 0.6,
    c: '#1d1719', x: '#d2202b', sh: [['#1d1719', '#b8a774'], 2, [2.2, 0.8], 0, -0.55, 0.42], ch: ['#b8a774', 2, 1, 1.1],
    g: { b: '#7652a0', v: [['#4fa7b4', 9, 2.6, 0, -30], ['#1e2e4f', 9, 1.2, 4.5, 40]], sv: [['#4fa7b4', 9, 2.6, 0, -30]], c: '#1e1c22', k: '#7652a0',
      sh: [WHITE, 1, 0.9, 0, 2.7, 0.42], ch: [WHITE, 3, 2.2, 1.4, 0.06, 0.04, 0.035] } },
  BRE: { code: 94, b: '#f3f1f1', v: [stripes('#cd0c2b', 14.6, 7.4, true)], s: '#cd0c2b', c: '#1c1a19', ct: ['#e5bb53'], n: '#f4f4f4',
    k: ['#e9b631', '#1c1a19'], kw: [1.1, 0.6],
    g: { b: '#e3a9ef', c: '#141414', n: '#c48fcf', k: '#e3a9ef', ar: ['#1c1c1c', 2.2] } },
  BHA: { code: 36, b: '#1b60b6', v: [stripes('#cfe1f7', 3.8, 0.45, true)], sv: [stripes('#cfe1f7', 3.8, 0.45)], cs: 'v', vd: 13.6, c: '#edeff1',
    n: '#2a5ea6', k: '#155ab0', x: '#0a5bbf',
    g: { b: '#f2508a', gr: '#d83f89', v: [['#e84a9f', 4.2, 1.3, 0, 90]], sv: [['#e84a9f', 4.2, 1.3, 0, 90]], c: '#e44397', n: '#f1f3f2', k: '#e04b87', ar: ['#3a1022', 0.45, 0.6] } },
  CHE: { code: 8, b: '#1d3f9a', cs: 'polo', c: '#1a3c8f', pk: false, ar: ['#e9cf6a', 0.5, 0.45], sl: ['#e9cf6a', 0.45],
    g: { b: '#22292c', gr: '#151c1f', v: [['#343b3e', 3.2, 1, 0, 90]], sv: [['#343b3e', 3.2, 1, 0, 90]], c: '#101416', n: '#e9e9e9', k: '#101416' } },
  COV: { code: 9, b: '#fcfcfc', v: [stripes('#1d6db1', 7.4, 4)], s: '#226cae', sv: [[WHITE, 0, 2.2, 1]], cs: 'v', vd: 13.6, c: '#14223b', n: '#e1e5df',
    k: '#226cae', kw: 1, sh: ['#226cae', 1, 3.4, 0, -0.55], ch: ['#123d73', 3, 1.1, 1.4], x: '#1d6db1',
    g: { b: '#164c31', cs: 'v', vd: 13.6, c: '#060f45', n: '#0b492b', k: '#11402a', sp: ['#1a3f8a', 1.6], sh: ['#1f4a95', 1, 3.4, 0, -0.55, 0.42],
      ch: [WHITE, 3, 1.2, 1.4] } },
  CRY: { code: 31, b: '#fdfdfd', x: '#d4202f', c: '#ececec', ct: ['#28264f', '#d4202f'], n: '#e6e6e6',
    k: [WHITE, '#28264f', WHITE, '#d4202f'], kw: [1, 0.45, 0.3, 0.35],
    sh: [['#1b458f', '#1b458f', ...Array(5).fill('#d4202f')], 7, 0.35, 0.28, 0],
    v: [[-3.6, 1.2, 'r'], [-1.9, 1, 'r'], [-0.4, 0.8, 'r'], [1.1, 1.3, 'b'], [2.8, 1.1, 'b'], [4.3, 0.8, 'b'], [5.5, 0.6, 'b']]
      .map(([o, w, c]) => [c === 'r' ? '#d4202f' : '#1b458f', 0, w, o, 32]),
    g: { b: '#62c741', c: '#4ee434', n: '#0b2a07', k: '#58d037', sp: ['#b23e74', 1.8] } },
  EVE: { code: 11, b: '#1c439a', c: '#f8fcfd', n: '#13306b', ci: '#e9aa10', k: '#f2f4f5', kw: 1.2,
    g: { b: '#77e909', c: '#0b1607', n: '#193900', k: '#70dc06' } },
  FUL: { code: 54, b: '#f1f0f0', c: BLACK, n: '#c91e23', sh: two(BLACK), k: ['#d2202b', BLACK], kw: [0.5, 0.9], x: BLACK,
    g: { b: '#33a8e1', gr: '#3995d1', c: '#2a9fe0', n: '#1f7fc0', k: '#0f6cb5', kw: 10, sh: two('#9fdcf5') } },
  HUL: { code: 88, b: '#f0980d', v: [stripes('#2a2424', 14.6, 6.6)], cs: 'polo', c: '#faf9fa', pk: false, n: '#de9822', k: '#faf9fa', kw: 1.3,
    sh: ['#2a2424', 1, 1.4, 0, -0.55],
    g: { b: '#093224', c: '#e6f2ec', cw: 0.8, n: '#113328', k: ['#093224', '#e6f2ec', '#093224'], kw: [0.5, 0.45, 0.5] } },
  IPS: { code: 40, b: '#113b85', sp: [WHITE, 2], c: '#f2f4f8', cw: 0.8, ct: ['#0f2f66', '#0f2f66'], n: '#123c87', k: WHITE, kw: 0.6,
    g: { b: '#6ec3b1', s: '#6fd8c6', v: [['#c9f0b0', 8, 0.7, 0, 30], ['#c9f0b0', 11, 0.55, 3, -50]], c: '#50b1a5', n: '#4da998', k: '#6fd8c6' } },
  LEE: { code: 2, b: '#fdfefe', v: [stripes('#1d3c7f', 5.4, 0.5, false, 90), stripes('#f5d000', 5.4, 0.5, true, 90)], c: '#f4d23a', cw: 0.7,
    ct: ['#1d4f94', '#1d4f94'], n: '#1d3c7f', k: ['#f5d000', '#1d4f94'], kw: [0.6, 1.3], x: '#1d3c7f', sh: two('#1d4f94'),
    g: { b: '#81fd8a', gr: '#4bc053', sh: two('#05300f'), c: '#54f05e', n: '#3d7a3a', k: '#6ee879' } },
  LIV: { code: 14, b: '#a61434', c: '#f4eef0', cw: 0.7, ct: ['#8e1029', '#8e1029'], n: '#d88b9c', sh: two(WHITE), k: '#f4eef0', kw: 0.5,
    g: { b: '#2d5c4b', gr: '#1f4436', c: '#24503f', n: '#c8d6d4', k: '#2d5c4b', sh: two(WHITE) } },
  MCI: { code: 43, b: '#7eb6db', gr: '#e7fefd', c: '#e8fcfd', n: '#71a9c8', k: '#eef7fb', kw: 1.4, sp: ['#e3f2f8', 1.4],
    g: { b: '#f0694f', gr: '#140f0d', v: [['#3b1812', 5.2, 0.45, 0, 30], ['#3b1812', 5.2, 0.45, 0, -30]], s: '#e8664f', c: '#0e1011',
      n: '#f86a63', k: '#1c1413', kw: 12 } },
  MUN: { code: 1, b: '#bc0924', cs: 'polo', c: '#b00c22', ct: [WHITE, BLACK], pk: false, n: '#961125', sh: two(WHITE),
    k: [WHITE, BLACK, WHITE], kw: [0.35, 0.3, 0.3],
    g: { b: '#282828', gr: '#101010', sh: two('#c8c8c8'), c: '#1c1c1c', n: '#090909', k: '#1c1c1c' } },
  NEW: { code: 4, b: '#1a1a1a', v: [stripes(WHITE, 15.2, 3.4, true),
    ...[[2.5, 0.74], [3.6, 0.5], [4.4, 0.3]].flatMap(([d, w]) => [-d, d].map((o) => [WHITE, 15.2, w, 7.6 + o]))],
    s: '#f4f4f4', sv: [[BLACK, 2.6, 1.2]], sh: two('#53a8d0'), c: '#5aa9d0', cw: 0.7, ct: [BLACK, BLACK], n: '#fbfbfb',
    k: ['#5aa9d0', BLACK], kw: [0.45, 1],
    g: { b: '#f6ee12', gr: '#ebd238', sh: two(BLACK), c: '#ece40e', n: '#c9bf0a', k: '#f6ee12' } },
  NFO: { code: 17, b: '#bf272e', cs: 'v', vd: 12.8, c: '#e5222b', n: '#7f0c18', k: '#e5222b', kw: 1, sh: two(WHITE),
    g: { b: '#42aaf3', gr: '#3284ce', c: '#2b9bea', n: '#155fa1', k: '#056fcb', kw: 10, sh: two('#9eeefd') } },
  SUN: { code: 56, b: '#d01b1f', v: [stripes(WHITE, 7.4, 3.7)], sv: [[WHITE, 3.8, 1.6]], cs: 'polo', c: WHITE, n: '#e9e9e9', pk: WHITE, k: WHITE,
    g: { b: '#fed819', c: '#ecc812', n: '#c9a80c', k: '#fed819', sh: [BLACK, 1, 0.9, 0, 2.7, 0.42], ch: [BLACK, 3, 2.2, 1.4, 0.06, 0.04, 0.035] } },
  TOT: { code: 6, b: '#f5f6f6', sc: '#132257', cs: 'v', vd: 12.6, c: '#ececec', n: '#f7f7f7', k: ['#132257', '#a9acae'], kw: [0.4, 0.3],
    x: '#132257',
    g: { b: '#f2508a', gr: '#d83e89', v: [['#e84a9f', 4.2, 1.3, 0, 90]], sv: [['#e84a9f', 4.2, 1.3, 0, 90]], c: '#fa3b7b', n: '#f3f0f3',
      k: '#df4b87', ar: ['#3a1022', 0.45, 0.6] } },
};
const NEUTRAL = { b: '#9aa3b2', s: '#8b94a3', c: '#6b7383' };
/** A goalkeeper shirt drawn on the turf (shirt({turf})) in this grey when its own colour is green-family. */
const TURF_GK = '#d4d9de';

// ---------------------------------------------------------------- colour helpers

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
/** Mix toward black (amt < 0) or white (amt > 0), amt in -1..1. */
const shade = (h, amt) => hex(rgb(h).map((v) => (amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
const luma = (h) => { const [r, g, b] = rgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
/** A saturated colour of hue 60–190° (lime, green, teal): it vanishes on a green pitch. */
function greenish(h) {
  const [r, g, b] = rgb(h).map((v) => v / 255);
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  if (d < 0.25) return false;
  const hue = mx === g ? 60 * ((b - r) / d + 2) : mx === r ? 60 * (((g - b) / d) % 6) : 60 * ((r - g) / d + 4);
  return hue >= 60 && hue <= 190;
}

const clubKey = (club) => String(club ?? '').toUpperCase();
const kitOf = (club) => KITS[clubKey(club)] || null;

/** The club's identifying colour for small accents (x; else a white kit gives its first band or collar colour). */
export function clubColor(club) {
  const k = kitOf(club);
  if (!k) return NEUTRAL.b;
  return k.x || (luma(k.b) > 0.85 ? k.v?.[0]?.[0] || k.c : k.b);
}

// ---------------------------------------------------------------- geometry (viewBox 0 0 64 64)

const TORSO = 'M23 6.5 13.5 10 17 24 17.5 57Q32 59.6 46.5 57L47 24 50.5 10 41 6.5C38 12 26 12 23 6.5Z';
const SLEEVE = 'M13.5 10C9.5 12 6.2 16 3.5 21.5L11.2 28.6 17 24Z';
const NECK_BACK = 'M23 6.5Q32 4.6 41 6.5C38 12 26 12 23 6.5Z';
const CUFF = 'M3.5 21.5 11.2 28.6';
/** The left sleeve's middle and the angle of its length (cuff to shoulder), for its bands. */
const SLEEVE_AXIS = [11.3, 21, 44.5];
/** The shoulder seam (neck to the cuff's top) and the way into the shirt from it: shoulder stripes run along it. */
const SEAM = 'M23.5 6.9 13.8 10.5C9.9 12.5 6.6 16.3 4 21.6';
const SEAM_IN = [0.5, 0.86];
/** A raglan sleeve's panel on the torso: the shoulder from the neck to the armpit (the left one). */
const RAGLAN = 'M23 6.5 13.5 10 17 24C18.6 17.5 21.8 12.6 26.4 10.4Z';
/** Piping beside the armhole seam (`ar`), on the torso just inside the shirt's outline: from the shoulder's edge toward the armpit. */
const ARMHOLE = 'M14.4 9.66C15.5 14 16.5 18.5 17.9 24';
/** A side line (`sl` piping): from under the arm, bowing in from the torso's side, out to its edge at the hem. */
const SIDE_LINE = 'M17.1 28.5C19.7 36 19.9 47.5 17.9 58';
/** The cuff trim sits this far up the sleeve from the cuff's edge. */
const CUFF_TRIM = [1.9, -1.9];
/**
 * The sleeves drawn: short (an outfield shirt's), or long (`ls`: a goalkeeper's, as FPL draws them) — the arm hangs from
 * the shoulder to a cuff at the hips, slanted out from the torso and inside the short sleeve's extent (x ≥ 3.5, so the
 * shirt sits in FPL's frame as before). Each: the sleeve, its cuff's edge, its axis (SLEEVE_AXIS), the shoulder seam
 * (SEAM: a long sleeve's ends on the shoulder cap, where FPL's keeper stripes end) and the cuff trim's offset.
 */
const ARMS = {
  short: { sleeve: SLEEVE, cuff: CUFF, axis: SLEEVE_AXIS, seam: SEAM, trim: CUFF_TRIM },
  long: {
    sleeve: 'M13.5 10C9.6 11.8 7.2 15.5 6.2 21L4 49.2 11.2 50.6 12.9 35C13.6 30 15 26.5 17 24Z',
    cuff: 'M4 49.2 11.2 50.6', axis: [8.6, 33, 6], seam: 'M23.5 6.9 13.8 10.5C10.1 12.2 7.8 15.4 6.7 20.2', trim: [0.5, -2.65],
  },
};
/**
 * A polo collar (the left half; mirrored for the right): its wing folds down from the back of the neck to a point beside
 * the placket, `edge` its outer edge (the trims run just inside it); the back stand shows above the neckline; the placket
 * runs down the centre from the neckline, under the wings' points, with two buttons.
 */
const POLO = {
  wing: 'M22.4 6C22.9 9.9 25.6 13.6 29.9 15.9L31.9 11.7C28.2 11.2 25.5 9.5 24 6.7Z',
  edge: 'M22.4 6C22.9 9.9 25.6 13.6 29.9 15.9',
  stand: 'M23.2 6.3Q32 4.2 40.8 6.3',
  placket: 'M30.4 10.8H33.6V20.6H30.4Z',
  buttons: [[32, 17.1], [32, 19.4]],
};
/** Collar shapes: the line the collar band follows, and a V's notch (shows the back of the neck). */
const COLLARS = {
  crew: { d: 'M23 6.5C26 12 38 12 41 6.5' },
  v: { d: 'M23 6.5 32 15.2 41 6.5', notch: true },
  polo: { d: 'M23 6.5C26 12 38 12 41 6.5', polo: true },
  wrap: { d: 'M23 6.5C25 11 29.5 13.6 35 14.6M41 6.5C39 11 34.5 13.6 29 14.6' },
};
const MIRROR = 'matrix(-1 0 0 1 64 0)';
/** The left side's elements and their mirror image on the right. */
const sides = (make) => [svg('g', null, make()), svg('g', { transform: MIRROR }, make())];
/** A left-side path and its mirror image on the right. */
const pair = (d, attrs) => sides(() => svg('path', { d, ...attrs }));
/** A left-side path and its mirror as bare paths: a <clipPath> ignores <g> children (sides' groups), so it takes these. */
const clipPair = (d) => [svg('path', { d }), svg('path', { d, transform: MIRROR })];
const at = (dx, dy) => `translate(${dx} ${dy})`;

/** Bands ([colour, period, width, offset, angle]) about (cx, cy), the box's 64 units covered whatever the angle. */
function bands(list = [], cx = 32, cy = 32, turn = 0) {
  return list.map(([fill, period, w, off = 0, angle = 0]) => {
    const xs = [];
    if (period) for (let x = off - Math.ceil((64 + off) / period) * period; x <= 64; x += period) xs.push(x);
    else xs.push(off);
    return svg('g', { transform: `rotate(${angle + turn} ${cx} ${cy})` },
      xs.map((x) => svg('rect', { fill, x: cx + x - w / 2, y: cy - 64, width: w, height: 128 })));
  });
}

/**
 * FPL's official shirt image: 220 × 290, the shirt's opaque pixels at x 15–208, y 4–288 (a goalkeeper's long sleeves:
 * x 7–214, y 3–286), measured from shirt_<code>[_1]-220.webp of five clubs drawn on a solid colour (2026-10-06).
 */
export const FPL_FRAME = { w: 220, h: 290, out: { l: 15, t: 4, r: 208, b: 288 }, gk: { l: 7, t: 3, r: 214, b: 286 } };
/** The drawn shirt's extent in its 64-unit geometry: the sleeves' cuffs x 3.5–60.5, the back of the neck's top y 5.55. */
const DRAWN = { l: 3.5, r: 60.5, t: 5.55 };
/** shirt({tall}): the drawn shirt in FPL's frame (an outfield shirt's width share and top), so either source sits the same. */
const TALL_VIEWBOX = (() => {
  const { w, h, out } = FPL_FRAME;
  const u = (DRAWN.r - DRAWN.l) / (out.r - out.l);  // shirt units per image pixel
  return [DRAWN.l - out.l * u, DRAWN.t - out.t * u, w * u, h * u].map((x) => Math.round(x * 100) / 100).join(' ');
})();
/** A shirt box `size` wide: square, or tall (FPL's frame). */
const boxHeight = (size, tall) => (tall ? Math.round((size * FPL_FRAME.h) / FPL_FRAME.w) : size);

/**
 * shirt({club, gk=false, size=56, title, turf=false, tall=false}) → the club's shirt as this browser shows them
 * (kitSource): FPL's official image (officialShirt) for a club with a team code whose image has not failed this session,
 * else the drawn one. Either is .kit-shirt and carries data-kit (its options), so setKitSource re-draws every shirt on the
 * page. tall: `size` wide in FPL's 220 × 290 frame (FPL_FRAME), the drawn shirt placed in it as FPL's image places its
 * own (Forkcast's pitch cards); else a size × size square.
 */
export function shirt(opts = {}) {
  const el = source === 'official' && officialCode(opts.club) != null ? officialShirt(opts) : drawnShirt(opts);
  el.setAttribute('data-kit', JSON.stringify(opts));
  return el;
}

/** The spec drawn: the club's outfield kit, or its goalkeeper's (gk; a bare colour is its body), greyed on the turf. */
function specOf(club, gk, turf) {
  const k = kitOf(club) || NEUTRAL;
  if (!gk) return k;
  const g = typeof k.g === 'object' ? k.g : { b: k.g || '#f5d327' };
  return turf && greenish(g.b) ? { ...g, b: TURF_GK, gr: null } : g;
}

/**
 * drawnShirt({club, gk=false, size=56, title, turf=false, tall=false}) → <svg class="kit-shirt"> drawn from KITS (neutral grey for
 * an unknown club). gk draws the club's goalkeeper shirt. Decorative (aria-hidden) unless `title` is given.
 * turf (a shirt drawn on the green pitch, Forkcast's): a green-family goalkeeper colour becomes grey. tall: see shirt.
 */
function drawnShirt({ club, gk = false, size = 56, title, turf = false, tall = false } = {}) {
  const k = specOf(club, gk, turf);
  const body = k.b;
  const sleeves = k.s || body;
  const collar = k.c || shade(body, gk ? -0.38 : -0.3);
  const cuffs = k.k || collar;
  const light = luma(body) > 0.85;
  const neck = k.cs === 'v' && k.vd ? { ...COLLARS.v, d: `M23 6.5 32 ${k.vd} 41 6.5` } : COLLARS[k.cs] || COLLARS.crew;
  const id = uid('kit');
  const clip = (s, ...kids) => svg('g', { 'clip-path': `url(#${id}-${s})` }, ...kids);
  const ring = (stroke, width, dy = 0) => svg('path', { d: neck.d, stroke, 'stroke-width': width, fill: 'none', 'stroke-linecap': 'round', transform: at(0, dy) });
  const arm = ARMS[(k.ls ?? gk) ? 'long' : 'short'];
  const [sx, sy, sa] = arm.axis;
  return svg('svg', {
    class: gk ? 'kit-shirt gk' : 'kit-shirt', viewBox: tall ? TALL_VIEWBOX : '0 0 64 64', width: size, height: boxHeight(size, tall),
    'aria-hidden': title ? null : 'true', role: title ? 'img' : null, 'aria-label': title || null,
  },
  svg('defs', null,
    svg('clipPath', { id: `${id}-t` }, svg('path', { d: TORSO })),
    k.ci && svg('clipPath', { id: `${id}-n` }, svg('path', { d: NECK_BACK })),
    svg('clipPath', { id: `${id}-s` }, clipPair(arm.sleeve)),
    svg('clipPath', { id: `${id}-l` }, svg('path', { d: arm.sleeve })),
    svg('clipPath', { id: `${id}-a` }, svg('path', { d: TORSO }), clipPair(arm.sleeve)),
    k.gr && svg('linearGradient', { id: `${id}-b`, x1: 0, x2: 0, y1: 0, y2: 1 },
      svg('stop', { offset: 0.42, 'stop-color': body }), svg('stop', { offset: 0.9, 'stop-color': k.gr })),
    svg('linearGradient', { id: `${id}-g`, x1: 0, x2: 1, y1: 0, y2: 0.25 },
      svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.16 }),
      svg('stop', { offset: 0.4, 'stop-color': '#fff', 'stop-opacity': 0 }),
      svg('stop', { offset: 0.62, 'stop-color': '#000', 'stop-opacity': 0 }),
      svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': light ? 0.12 : 0.22 }))),
  svg('path', { d: NECK_BACK, fill: k.n || shade(body, light ? -0.22 : -0.42) }),
  pair(arm.sleeve, { fill: sleeves }),
  // each side's bands on its own sleeve (-l, mirrored with it): they span the box, so they would cross the other sleeve
  clip('s', sides(() => clip('l', bands(k.sv, sx, sy, sa))),
    cuffBands(cuffs, k.kw).map(([c, w]) => pair(arm.cuff, { stroke: c, 'stroke-width': 2 * w, fill: 'none' })),
    k.kt && pair(arm.cuff, { stroke: k.kt, 'stroke-width': 0.8, fill: 'none', transform: at(...arm.trim) })),
  svg('path', { d: TORSO, fill: k.gr ? `url(#${id}-b)` : body }),
  clip('t', bands(k.v), k.sp && sides(() => svg('rect', { fill: k.sp[0], x: 10, y: 20, width: 7 + k.sp[1], height: 44 })),
    k.rg && pair(RAGLAN, { fill: k.rg })),
  k.sh && clip('a', (() => {
    const [c, n, w, gap = w, from = 0.25, len] = k.sh;
    const part = len ? { pathLength: 1, 'stroke-dasharray': `${len} 2` } : {};
    const each = (v, i) => (Array.isArray(v) ? v[i] : v);
    let edge = from;  // the next stripe's seam-side edge
    return Array.from({ length: n }, (_, i) => {
      const wi = each(w, i), d = edge + wi / 2;
      edge += wi + gap;
      return pair(arm.seam, { stroke: each(c, i), 'stroke-width': wi, fill: 'none', ...part, transform: at(SEAM_IN[0] * d, SEAM_IN[1] * d) });
    });
  })()),
  k.ch && clip('a', (() => {
    const [c, n = 3, w = 1.2, d = 1.4, start = 0.06, dash = 0.05, gap = 0.035] = k.ch;
    const dashes = [0, start, ...Array.from({ length: n - 1 }, () => [dash, gap]).flat(), dash, 2].join(' ');
    return pair(arm.seam, { stroke: c, 'stroke-width': w, fill: 'none', pathLength: 1, 'stroke-dasharray': dashes,
      transform: at(SEAM_IN[0] * d, SEAM_IN[1] * d) });
  })()),
  k.ar && clip('a', pair(ARMHOLE, { stroke: k.ar[0], 'stroke-width': k.ar[1], fill: 'none', pathLength: 1, 'stroke-dasharray': `${k.ar[2] ?? 1} 2` })),
  k.sc && clip('t', pair(`${SIDE_LINE}L10 58 10 28.5Z`, { fill: k.sc })),
  k.sl && clip('t', pair(SIDE_LINE, { stroke: k.sl[0], 'stroke-width': k.sl[1], fill: 'none' })),
  svg('g', { fill: `url(#${id}-g)` }, svg('path', { d: TORSO }), pair(arm.sleeve, {})),
  neck.notch && svg('path', { d: `${neck.d}Z`, fill: k.n || shade(body, light ? -0.22 : -0.42) }),
  ...(neck.polo ? polo(k, body, collar) : [clip('t', (k.ct || []).map((c, i) => ring(c, 0.9, (k.cw ?? 2.6) / 2 + 0.45 + i))),
    k.ci && clip('n', ring(k.ci, 1.6, -1.5)), ring(collar, k.cw ?? 2.6)]),
  // edge: plan-pitch.css strokes it in the text colour (or --kit-edge) so it shows on any background
  svg('g', { class: 'kit-edge', fill: 'none', stroke: '#000', 'stroke-opacity': 0.3, 'stroke-width': 1.1, 'stroke-linejoin': 'round' },
    svg('path', { d: TORSO }), pair(arm.sleeve, {})));
}

/**
 * The cuff's bands, outermost first, as [colour, reach up the sleeve from its edge]: `k` one colour (kw its width, 2.3 by
 * default) or a list from the edge up (kw then a list of widths), each band drawn over the one beyond it.
 */
function cuffBands(k, kw = 2.3) {
  const cs = [k].flat(), ws = [kw].flat();
  let up = 0;
  return cs.map((c, i) => [c, (up += ws[i] ?? ws[0])]).reverse();
}

/** A polo collar's parts (POLO), in draw order: the back stand, the placket and its buttons, the wings and their trims. */
function polo(k, body, collar) {
  const line = { stroke: '#000', 'stroke-opacity': 0.28, 'stroke-width': 0.45, 'stroke-linejoin': 'round' };
  const id = uid('polo');
  // the trims run just inside the wing's outer edge (each 0.95 further in), clipped to the wing
  const trims = () => (k.ct || []).map((c, i) => svg('path', {
    d: POLO.edge, stroke: c, 'stroke-width': 0.8, fill: 'none', transform: at(0.75 + 0.8 * i, -0.6 - 0.6 * i) }));
  return [
    svg('path', { d: POLO.stand, stroke: collar, 'stroke-width': 1.3, fill: 'none' }),
    k.pk !== false && svg('path', { d: POLO.placket, fill: k.pk || body, ...line, ...(k.pe && { stroke: k.pe, 'stroke-opacity': 1, 'stroke-width': 0.6 }) }),
    k.pk !== false && k.bt !== false && POLO.buttons.map(([cx, cy]) => svg('circle', { cx, cy, r: 0.6, fill: k.bt || collar, ...line })),
    svg('defs', null, svg('clipPath', { id }, svg('path', { d: POLO.wing }))),
    sides(() => [svg('path', { d: POLO.wing, fill: collar }),
      k.ct && svg('g', { 'clip-path': `url(#${id})` }, trims()),
      svg('path', { d: POLO.wing, fill: 'none', ...line })]),
  ];
}

// ---------------------------------------------------------------- official shirts (opt-in, this browser's)

const SOURCE_KEY = 'fc:kits';
const SOURCES = [['drawn', 'Drawn'], ['official', 'Official']];
/** FPL's shirt images: shirt_<code>-<w>.webp outfield, shirt_<code>_1-<w>.webp goalkeeper, w = 66, 110 or 220 px. */
const FPL_SHIRTS = 'https://fantasy.premierleague.com/dist/img/shirts/standard/';
const WIDTHS = [66, 110, 220];
/** Clubs whose official image failed to load this session: drawn from then on (no retry on every re-draw). */
const failed = new Set();

const storage = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
let source = (() => { try { return storage()?.getItem(SOURCE_KEY) === 'official' ? 'official' : 'drawn'; } catch { return 'drawn'; } })();

/** 'drawn' (the default) or 'official': which shirts this browser shows. */
export const kitSource = () => source;

/** The club's FPL team code while its official image is usable this session, else null. */
const officialCode = (club) => (failed.has(clubKey(club)) ? null : kitOf(club)?.code ?? null);

/**
 * <img class="kit-shirt official"> of FPL's shirt for the club (the goalkeeper's for gk), size wide (size × size, or in
 * its own 220 × 290 frame when tall), the browser picking 66 / 110 / 220 by its pixel density. Lazy, no referrer; alt '' (decorative: the card's label names the
 * player) unless `title`. When it fails (FPL down, blocked, renamed) it becomes the drawn shirt, and so does every
 * later shirt of that club this session.
 */
function officialShirt(opts) {
  const { club, gk = false, size = 56, title, tall = false } = opts;
  const url = (w) => `${FPL_SHIRTS}shirt_${kitOf(club).code}${gk ? '_1' : ''}-${w}.webp`;
  // loading and referrerpolicy before src: the request is made with them
  const img = h('img', {
    class: gk ? 'kit-shirt official gk' : 'kit-shirt official', alt: title ?? '', width: size, height: boxHeight(size, tall),
    loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer', draggable: 'false',
    sizes: `${size}px`, srcset: WIDTHS.map((w) => `${url(w)} ${w}w`).join(', '), src: url(110),
  });
  img.addEventListener('error', () => {
    failed.add(clubKey(club));
    img.replaceWith(shirt(opts));  // drawn now: the club has failed
  }, { once: true });
  return img;
}

/** Every shirt under `root` drawn again as the current source has it (data-kit: shirt's options). */
function redrawShirts(root = globalThis.document) {
  for (const el of root?.querySelectorAll?.('[data-kit]') ?? []) {
    let opts;
    try { opts = JSON.parse(el.getAttribute('data-kit')); } catch { continue; }
    el.replaceWith(shirt(opts));
  }
}

/** Show 'drawn' or 'official' shirts, kept in this browser (localStorage); every shirt on the page changes now. */
export function setKitSource(s) {
  source = s === 'official' ? 'official' : 'drawn';
  try { storage()?.setItem(SOURCE_KEY, source); } catch { /* private mode: this page only */ }
  redrawShirts();
}

/**
 * The "Shirts: Drawn | Official" row (Player data's sheet): a segmented radio group (the arrow keys pick as a tap does:
 * ui.roving); a choice applies at once (setKitSource) and the sheet stays open. Its note says where official shirts come
 * from.
 */
export function kitSourceRow() {
  const id = uid('kitsrc');
  const at = () => SOURCES.findIndex(([k]) => k === source);
  const seg = h('div.m-seg.small.kit-src-seg', { role: 'radiogroup', 'aria-labelledby': id, style: { '--n': SOURCES.length, '--i': at() } },
    h('span.m-seg-thumb'),
    SOURCES.map(([k, label]) => h('button', {
      type: 'button', role: 'radio', 'aria-checked': String(k === source), dataset: { kits: k },
      onClick: () => {
        setKitSource(k);
        seg.style.setProperty('--i', at());
        for (const b of seg.querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.kits === source));
        roving(seg);
      },
    }, label)));
  roving(seg, { pick: (b) => b.click() });
  return h('div.kit-src', null,
    h('div.kit-src-row', null, h('span.kit-src-l', { id }, 'Shirts'), seg),
    h('p.kit-src-note', null, "Official shirts are loaded by your browser from FPL's site."));
}
