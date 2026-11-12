import {
  __export
} from "./chunk-WSFCRVEQ.js";

// js/m/sheets/strip.js
var strip_exports = {};
__export(strip_exports, {
  CODE_SCALE: () => CODE_SCALE,
  CUP: () => CUP,
  NEAR: () => NEAR,
  cupCode: () => cupCode,
  cupMinutes: () => cupMinutes,
  cupName: () => cupName,
  futureColumns: () => futureColumns,
  layout: () => layout,
  pastColumns: () => pastColumns,
  within: () => within
});
var CUP = {
  champions_league: ["CL", null, "Champions League"],
  champions_league_qual: ["CL", null, "Champions League qualifier"],
  europa_league: ["EL", null, "Europa League"],
  europa_league_qual: ["EL", null, "Europa League qualifier"],
  conference_league: ["ECL", null, "Conference League"],
  conference_league_qual: ["ECL", null, "Conference League qualifier"],
  efl_cup: ["EFL", null, "EFL Cup"],
  fa_cup: ["FA", null, "FA Cup"],
  community_shield: ["Shield", "CS", "Community Shield"],
  uefa_super_cup: ["USC", null, "UEFA Super Cup"],
  club_world_cup: ["CWC", null, "Club World Cup"]
};
var slugName = (league) => String(league ?? "").split("_").filter(Boolean).map((x) => x === "qual" ? "qualifier" : x === "int" ? "International" : /^(uefa|afc|caf|conmebol|concacaf)$/.test(x) ? x.toUpperCase() : `${x[0].toUpperCase()}${x.slice(1)}`).join(" ");
var other = (league) => [/^(world_cup|euro|copa|africa|asian|confed|nations|concacaf|int_)/.test(String(league)) ? "Intl" : String(league ?? "").slice(0, 3).toUpperCase(), null, slugName(league)];
var cupCode = (league, short = false) => {
  const c = CUP[league] ?? other(league);
  return short && c[1] || c[0];
};
var cupName = (league) => (CUP[league] ?? other(league))[2];
var cupMinutes = (c) => c.in_squad === false ? "\u2014" : Number.isFinite(c.minutes) ? `${c.minutes}\u2032` : "\u2013";
function pastColumns(past, cups = []) {
  const eplKo = past.map((m) => m.kickoff).filter(Number.isFinite);
  if (!past.length) return { cols: [] };
  const start = eplKo.length ? Math.min(...eplKo) : null;
  const first = past[0];
  const inWindow = (c) => start != null && Number.isFinite(c.kickoff) ? c.kickoff >= start : c.season != null && first.season != null && (c.season > first.season || c.season === first.season && (c.after_gw ?? -1) >= first.gw);
  const mine = cups.filter(inWindow);
  const before = (c, m) => Number.isFinite(c.kickoff) && Number.isFinite(m.kickoff) ? c.kickoff < m.kickoff : c.season !== m.season ? (c.season ?? 0) < (m.season ?? 0) : (c.after_gw ?? Infinity) < m.gw;
  const left = [...mine].sort((a, z) => (a.kickoff ?? 0) - (z.kickoff ?? 0));
  const cols = [];
  for (const m of past) {
    while (left.length && before(left[0], m)) cols.push({ kind: "cup", ...left.shift() });
    cols.push({ kind: "epl", ...m });
  }
  return { cols, after: left.map((c) => ({ kind: "cup", ...c })) };
}
function futureColumns(fut, cupNext = [], played = []) {
  const left = [...cupNext].filter((c) => Number.isFinite(c.after_gw)).sort((a, z) => (a.kickoff ?? 0) - (z.kickoff ?? 0));
  const cols = [...played];
  for (const f of fut) {
    while (left.length && left[0].after_gw < f.gw) cols.push({ kind: "cup", next: true, before: f.gw, ...left.shift() });
    cols.push({ kind: "gw", ...f });
  }
  return { cols };
}
var CODE_SCALE = 11 / 13;
var NEAR = 4;
var within = (cx, width, lo, hi) => {
  const x = Math.min(Math.max(cx, lo + width / 2), hi - width / 2);
  return x >= hi - width / 2 ? Math.floor(x * 10) / 10 : x <= lo + width / 2 ? Math.ceil(x * 10) / 10 : x;
};
var needOf = (c, w) => {
  const venue = Math.max(w("H", 400), w("A", 400));
  if (c.kind === "epl") return Math.max(w(c.minutes ? c.points : "0\u2032", c.minutes ? 600 : 400), w(c.gw, 400)) + 1;
  if (c.kind === "gw") return Math.max(w(c.value, 600), w(c.gw, 400)) + 1;
  if (c.kind === "cup") return Math.max(c.next ? 0 : w(cupMinutes(c), 400), w(cupCode(c.league, true), 400), venue) + 1;
  return 0;
};
var unitOf = (cols, W) => cols.length ? W / cols.length : 0;
function placeRow(cols, x0, x1, u, w) {
  const width = () => u;
  const lends = (i) => {
    const n = cols[i];
    if (!n) return 0;
    return n.kind === "cup" ? Math.max(0, (width(n) - w(cupCode(n.league), 400)) / 2) : NEAR;
  };
  const codeW = (c) => c.kind === "epl" ? w(c.opp) * CODE_SCALE + 2 : c.kind === "gw" ? Math.max(0, ...(c.codes ?? []).map((s) => w(s) * CODE_SCALE)) + 2 : 0;
  const lend = (i) => {
    const n = cols[i];
    return n && n.kind === "cup" ? width(n) / 2 - 1 : 0;
  };
  const room = (i) => width(cols[i]) + 2 * Math.min(lend(i - 1), lend(i + 1));
  const ok = cols.every((c, i) => needOf(c, w) <= width(c) && (c.kind === "cup" || codeW(c) <= room(i)));
  let x = x0;
  const placed = cols.map((c, i) => {
    const cw = width(c);
    const out = { ...c, x, w: cw, cx: x + cw / 2, row: c.kind === "cup" ? null : 0 };
    if (c.kind === "cup") {
      const [cl, cr] = [lends(i - 1), lends(i + 1)];
      const full = cupCode(c.league);
      Object.assign(out, {
        code: w(full, 400) <= cw + cl + cr ? full : cupCode(c.league, true),
        // inside the row exactly (its columns' widths summed drift past x1 by a hair)
        codeAt: [Math.max(x0, x - cl), Math.min(x1, x + cw + cr)]
      });
    }
    x += cw;
    return out;
  });
  return { cols: placed, ok };
}
function cut(cols, n) {
  if (n <= 1) return [cols];
  const per = cols.length / n;
  const out = Array.from({ length: n }, () => []);
  cols.forEach((c, i) => out[Math.min(n - 1, Math.floor((i + 0.5) / per))].push(c));
  return out.filter((l) => l.length);
}
function layout({ pastCols, futCols, W, measure, slots = 0 }) {
  const held = !pastCols.length && slots ? Array.from({ length: slots }, () => ({ kind: "slot" })) : pastCols;
  const w = (s, wt = 600) => s == null || s === "" ? 0 : measure(String(s), wt);
  const rows = [held, futCols.map((c) => ({ ...c, ahead: true }))].filter((r) => r.length);
  const most = Math.max(0, ...rows.map((r) => r.length));
  let lines;
  for (let k = 1; ; k++) {
    const cuts = rows.flatMap((r) => cut(r, Math.ceil(r.length / (most / k) - 1e-9)));
    const us = cuts.filter((r) => r.length).map((r) => unitOf(r, W));
    const u = us.length ? Math.min(...us) : 0;
    lines = cuts.map((r) => placeRow(r, 0, W, u, w));
    if (lines.every((l) => l.ok) || k >= Math.max(1, ...rows.map((r) => r.length))) break;
  }
  return { lines, cols: lines.flatMap((l) => l.cols), ok: lines.every((l) => l.ok), W };
}

export {
  CUP,
  cupCode,
  cupName,
  cupMinutes,
  pastColumns,
  futureColumns,
  CODE_SCALE,
  NEAR,
  within,
  layout,
  strip_exports
};
