// Studio's table, line chart, heat cell, pitch and transfer card, and the type-ahead player picker. The phone
// never loads this file.

import { DASH, chipName, fin, fmt, h, icon, norm, posName, statusInfo, svg, toNum, uid, xpOf } from '../ui.js';
import { download } from './kit.js';

const csvCell = (v) => {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const textOf = (x) => (x instanceof Node ? x.textContent : x == null ? '' : String(x));

// ---------------------------------------------------------------- table

const isBlank = (v) => v == null || v === '' || (typeof v === 'number' && Number.isNaN(v));
/**
 * table()'s order for two cell values: blanks last either way, numbers by value, text numeric-aware and
 * case-insensitive; sign 1 ascending, -1 descending.
 */
export function compareValues(a, b, sign = 1) {
  const ba = isBlank(a), bb = isBlank(b);
  if (ba || bb) return ba === bb ? 0 : ba ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return sign * (a - b);
  return sign * String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
function defaultCell(v) {
  if (isBlank(v)) return DASH;
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(+v.toFixed(2));
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return String(v);
}

/**
 * table({columns, rows, …}) → wrapper with .update(rows), .getRows() (current order), .toCSV(). A column: {key, label,
 * num, fmt(value,row), sort:false|fn(row), render(row,i), title, width, className, csv:false|fn(row)}; csv:
 * 'file.csv'|false. num columns are right-aligned mono and sort descending first.
 */
export function table({
  columns = [], rows = [], sortKey = null, sortDir = null, onRow, stickyFirst = false, csv = 'table.csv',
  empty: emptyText = 'Nothing to show yet.', rowClass, maxHeight, dense = false, caption,
} = {}) {
  let data = rows.slice();
  let key = sortKey;
  const colOf = (k) => columns.find((c) => c.key === k);
  let dir = sortDir || (key && colOf(key)?.num ? 'desc' : 'asc');
  const thead = h('thead');
  const tbody = h('tbody');
  const tbl = h('table.tbl', { class: { 'sticky-first': stickyFirst, dense } },
    caption ? h('caption.sr-only', null, caption) : null, thead, tbody);
  const scroll = h('div.tbl-scroll', {
    tabindex: 0, 'aria-label': caption || 'Table',
    style: maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : null,
  }, tbl);
  const count = h('span.tbl-count');
  const tools = csv === false ? null : h('div.tbl-tools', null, count,
    h('button.btn.sm.ghost', { type: 'button', onClick: () => download(csv, toCSV()) }, icon('download', { size: 15 }), 'Download CSV'));
  const el = h('div.tbl-wrap', null, tools, scroll);

  const sortVal = (c, r) => (typeof c.sort === 'function' ? c.sort(r) : r[c.key]);
  function sorted() {
    const c = colOf(key);
    if (!c) return data;
    const sign = dir === 'desc' ? -1 : 1;
    return data.slice().sort((ra, rb) => compareValues(sortVal(c, ra), sortVal(c, rb), sign));
  }
  function head() {
    thead.replaceChildren(h('tr', null, columns.map((c) => {
      const sortable = c.sort !== false && (c.key != null || typeof c.sort === 'function');
      const active = sortable && c.key === key;
      const th = h('th', {
        scope: 'col', class: [c.num && 'num', c.className, active && 'sorted'], title: c.title,
        style: c.width ? { width: typeof c.width === 'number' ? `${c.width}px` : c.width } : null,
        'aria-sort': active ? (dir === 'asc' ? 'ascending' : 'descending') : null,
      }, sortable
        ? h('button.th-btn', {
          type: 'button',
          onClick: () => {
            if (key === c.key) dir = dir === 'asc' ? 'desc' : 'asc';
            else { key = c.key; dir = c.num ? 'desc' : 'asc'; }
            render();
          },
        }, c.label ?? c.key, h('span.sort-ind', { 'aria-hidden': 'true' }))
        : h('span.th-txt', null, c.label ?? ''));
      return th;
    })));
  }
  function body() {
    const list = sorted();
    if (!list.length) {
      tbody.replaceChildren(h('tr', null, h('td.tbl-empty', { colspan: columns.length }, emptyText)));
    } else {
      const frag = document.createDocumentFragment();
      list.forEach((r, i) => {
        const tr = h('tr', { class: [rowClass?.(r), onRow && 'clickable'], tabindex: onRow ? 0 : null });
        for (const c of columns) {
          const v = c.key != null ? r[c.key] : undefined;
          const content = c.render ? c.render(r, i) : c.fmt ? c.fmt(v, r) : defaultCell(v);
          tr.append(h('td', { class: [c.num && 'num', c.className] }, content));
        }
        if (onRow) {
          const go = (e) => { if (!e.target.closest('button, a, input, select, label, textarea')) onRow(r, e); };
          tr.addEventListener('click', go);
          tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) onRow(r, e); });
        }
        frag.append(tr);
      });
      tbody.replaceChildren(frag);
    }
    count.textContent = `${data.length} row${data.length === 1 ? '' : 's'}`;
  }
  function render() { head(); body(); }
  function toCSV() {
    const cols = columns.filter((c) => c.csv !== false && (c.key != null || typeof c.csv === 'function'));
    const lines = [cols.map((c) => csvCell(c.csvLabel ?? textOf(c.label ?? c.key))).join(',')];
    for (const r of sorted()) lines.push(cols.map((c) => csvCell(typeof c.csv === 'function' ? c.csv(r) : r[c.key])).join(','));
    return lines.join('\n');
  }
  render();
  el.update = (next) => { data = (next || []).slice(); body(); return el; };
  el.getRows = sorted;
  el.toCSV = toCSV;
  return el;
}

// ---------------------------------------------------------------- line chart

function niceStep(span, count) {
  const raw = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
function niceTicks(lo, hi, count = 5) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const step = niceStep(hi - lo, count);
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const out = [];
  for (let v = a; v <= b + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

/**
 * lineChart({series:[{name, points:[[x,y]], band:[[x,lo,hi]], color, dashed}], …}) → <figure> with legend, SVG plot
 * (redrawn on resize), crosshair tooltip. yZero (default: all y ≥ 0) pulls the axis to 0; labels=false drops
 * end-of-line names. Colours follow series order (--s1…--s8) unless `color`. y=null breaks a line.
 */
export function lineChart({
  series = [], xLabel = '', yLabel = '', height = 240, xFmt = (x) => String(x), yFmt,
  yZero, labels = true, ariaLabel,
} = {}) {
  const color = (s, i) => s.color || `var(--s${(i % 8) + 1})`;
  const legend = series.length > 1
    ? h('div.chart-legend', null, series.map((s, i) => h('span.lg-item', null,
      h('span.lg-key', { class: { dashed: s.dashed }, style: { '--c': color(s, i) } }), s.name)))
    : null;
  const plot = h('div.chart-plot', { tabindex: 0, style: { height: `${height}px` }, 'aria-label': ariaLabel || [yLabel, xLabel].filter(Boolean).join(' by ') || 'Chart' });
  const tip = h('div.chart-tip', { hidden: true });
  const root = h('figure.chart', null, legend, plot);
  plot.append(tip);

  const xsAll = [...new Set(series.flatMap((s) => [...(s.points || []), ...(s.band || [])].map((p) => toNum(p[0])).filter(Number.isFinite)))].sort((a, b) => a - b);
  const ys = series.flatMap((s) => [
    ...(s.points || []).map((p) => p[1]),
    ...(s.band || []).flatMap((b) => [b[1], b[2]]),
  ]).filter(fin).map(toNum);
  if (!xsAll.length || !ys.length) {
    plot.append(h('div.chart-empty', null, 'No data to chart.'));
    return root;
  }
  let yLo = Math.min(...ys), yHi = Math.max(...ys);
  if (yZero ?? yLo >= 0) yLo = Math.min(0, yLo);
  const yt = niceTicks(yLo, yHi, Math.max(3, Math.round(height / 55)));
  yLo = yt[0]; yHi = yt[yt.length - 1];
  // Without a yFmt, ticks get just enough decimals for their step, values one more.
  const step = yt.length > 1 ? yt[1] - yt[0] : 1;
  const tickD = step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step) - 1e-9));
  const tickFmt = yFmt || ((v) => fmt.num(v, tickD));
  const valFmt = yFmt || ((v) => fmt.num(v, step >= 10 ? 0 : Math.max(1, tickD + 1)));
  let hover = -1;
  let geom = null;

  function draw(W) {
    const H = height;
    const direct = labels && series.length > 1 && series.length <= 4 && W >= 480;
    const labW = direct ? Math.min(120, 10 + 6.6 * Math.max(...series.map((s) => String(s.name).length))) : 0;
    const m = { l: yLabel ? 50 : 38, r: 12 + labW, t: 10, b: xLabel ? 40 : 26 };
    const pw = Math.max(10, W - m.l - m.r), ph = Math.max(10, H - m.t - m.b);
    const x0 = xsAll[0], x1 = xsAll[xsAll.length - 1];
    const X = (x) => (x1 === x0 ? m.l + pw / 2 : m.l + ((x - x0) / (x1 - x0)) * pw);
    const Y = (y) => m.t + ph - ((y - yLo) / (yHi - yLo || 1)) * ph;
    const maxXT = Math.max(2, Math.floor(pw / 52));
    let xt = xsAll;
    if (xt.length > maxXT) {
      xt = niceTicks(x0, x1, maxXT).filter((v) => v >= x0 && v <= x1);
      if (xsAll.every(Number.isInteger)) xt = xt.filter(Number.isInteger);
    }
    const g = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-hidden': 'true' });
    for (const v of yt) {
      g.append(svg('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), class: v === 0 && yLo < 0 ? 'axis' : 'grid' }));
      g.append(svg('text', { x: m.l - 6, y: Y(v), class: 'tick', 'text-anchor': 'end', 'dominant-baseline': 'middle' }, tickFmt(v)));
    }
    g.append(svg('line', { x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph, class: 'axis' }));
    for (const v of xt) g.append(svg('text', { x: X(v), y: m.t + ph + 16, class: 'tick', 'text-anchor': 'middle' }, xFmt(v)));
    if (xLabel) g.append(svg('text', { x: m.l + pw / 2, y: H - 4, class: 'axis-label', 'text-anchor': 'middle' }, xLabel));
    if (yLabel) g.append(svg('text', { x: 12, y: m.t + ph / 2, class: 'axis-label', 'text-anchor': 'middle', transform: `rotate(-90 12 ${m.t + ph / 2})` }, yLabel));

    const ends = [];
    series.forEach((s, i) => {
      const style = { '--c': color(s, i) };
      const band = (s.band || []).filter((b) => fin(b[0]) && fin(b[1]) && fin(b[2])).map((b) => b.map(toNum)).sort((a, b) => a[0] - b[0]);
      if (band.length > 1) {
        const up = band.map((b) => `${X(b[0])},${Y(b[2])}`), lo = band.slice().reverse().map((b) => `${X(b[0])},${Y(b[1])}`);
        g.append(svg('path', { d: `M${up.join('L')}L${lo.join('L')}Z`, class: 'band', style }));
      }
      const pts = (s.points || []).filter((p) => fin(p[0])).map((p) => [toNum(p[0]), fin(p[1]) ? toNum(p[1]) : null]).sort((a, b) => a[0] - b[0]);
      let d = '', pen = false;
      for (const [x, y] of pts) {
        if (y == null) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`;
        pen = true;
      }
      if (d) g.append(svg('path', { d, class: ['line', s.dashed && 'dashed'], style }));
      const valid = pts.filter((p) => p[1] != null);
      if (valid.length <= 40) for (const [x, y] of valid) g.append(svg('circle', { cx: X(x), cy: Y(y), r: 3, class: 'dot', style }));
      if (direct && valid.length) { const [x, y] = valid[valid.length - 1]; ends.push({ x: X(x), y: Y(y), name: s.name }); }
    });
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
    for (const e of ends) g.append(svg('text', { x: m.l + pw + 8, y: e.y, class: 'end-label', 'dominant-baseline': 'middle' }, e.name));
    const cross = svg('line', { y1: m.t, y2: m.t + ph, class: 'crosshair', visibility: 'hidden' });
    const marks = svg('g');
    g.append(cross, marks);
    plot.querySelector('svg')?.remove();
    plot.prepend(g);
    geom = { X, Y, m, pw, cross, marks };
    if (hover >= 0) showAt(hover);
  }

  function showAt(i) {
    if (!geom) return;
    hover = Math.max(0, Math.min(xsAll.length - 1, i));
    const x = xsAll[hover];
    const { X, Y, cross, marks, m, pw } = geom;
    const px = X(x);
    cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
    marks.replaceChildren();
    const rows = [];
    series.forEach((s, si) => {
      const p = (s.points || []).find((q) => toNum(q[0]) === x);
      const b = (s.band || []).find((q) => toNum(q[0]) === x);
      const y = p && fin(p[1]) ? toNum(p[1]) : null;
      if (y != null) marks.append(svg('circle', { cx: px, cy: Y(y), r: 4.5, class: 'dot hot', style: { '--c': color(s, si) } }));
      if (y != null || b) rows.push({ s, si, y, b });
    });
    rows.sort((a, b) => (b.y ?? -Infinity) - (a.y ?? -Infinity));
    tip.replaceChildren(h('div.tip-x', null, xFmt(x)), ...rows.map(({ s, si, y, b }) => h('div.tip-row', null,
      h('span.lg-key', { class: { dashed: s.dashed }, style: { '--c': color(s, si) } }),
      h('strong.num', null, y == null ? DASH : valFmt(y)),
      h('span.tip-name', null, s.name),
      b && fin(b[1]) && fin(b[2]) ? h('span.tip-band', null, `${valFmt(toNum(b[1]))}–${valFmt(toNum(b[2]))}`) : null)));
    tip.hidden = false;
    const right = px > m.l + pw / 2;
    tip.style.left = right ? '' : `${px + 12}px`;
    tip.style.right = right ? `${plot.clientWidth - px + 12}px` : '';
  }
  function hide() {
    hover = -1;
    tip.hidden = true;
    geom?.cross.setAttribute('visibility', 'hidden');
    geom?.marks.replaceChildren();
  }
  plot.addEventListener('pointermove', (e) => {
    if (!geom) return;
    const r = plot.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    xsAll.forEach((x, i) => { if (Math.abs(geom.X(x) - px) < Math.abs(geom.X(xsAll[best]) - px)) best = i; });
    showAt(best);
  });
  plot.addEventListener('pointerleave', hide);
  plot.addEventListener('blur', hide);
  plot.addEventListener('focus', () => showAt(hover >= 0 ? hover : xsAll.length - 1));
  plot.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); showAt(hover + (e.key === 'ArrowRight' ? 1 : -1)); }
    if (e.key === 'Escape') hide();
  });

  let lastW = 0;
  const redraw = () => {
    const w = Math.round(plot.clientWidth);
    if (w > 0 && w !== lastW) { lastW = w; draw(w); }
  };
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => { if (!root.isConnected && lastW) ro.disconnect(); else redraw(); });
    ro.observe(plot);
  } else draw(640);
  return root;
}

// ---------------------------------------------------------------- heat cell

/**
 * heatCell(value, scale, {text, title}) → <span class="heat">. scale 'fdr' (default): FPL difficulty 1-5 colours;
 * {min, max, reverse}: continuous bad→neutral→good (high = good unless reverse). null → muted dash.
 */
export function heatCell(value, scale = 'fdr', { text, title } = {}) {
  const label = text ?? (fin(value) ? (scale === 'fdr' ? String(Math.round(toNum(value))) : fmt.num(value, 2)) : DASH);
  if (!fin(value)) return h('span.heat.heat-none', { title }, text ?? DASH);
  const v = toNum(value);
  if (scale === 'fdr' || scale == null) {
    const k = Math.max(1, Math.min(5, Math.round(v)));
    return h('span.heat', { class: `fdr-${k}`, title: title ?? `Difficulty ${k}` }, label);
  }
  const { min = 0, max = 1, reverse = false } = scale;
  let t = max === min ? 0.5 : (v - min) / (max - min);
  t = Math.max(0, Math.min(1, reverse ? 1 - t : t));
  const pole = t >= 0.5 ? 'var(--heat-good)' : 'var(--heat-bad)';
  const pct = Math.round(Math.abs(t - 0.5) * 200);
  return h('span.heat', { title, style: { background: `color-mix(in oklab, ${pole} ${pct}%, var(--heat-mid))` } }, label);
}

// ---------------------------------------------------------------- pitch & transfer card

const SHIRT = 'M11 3.5 6.5 5.5 2.5 10l3.2 3.4 2.3-1.6V28.5h16V11.8l2.3 1.6 3.2-3.4-4-4.5L21 3.5c-.6 2.3-2.6 3.6-5 3.6s-4.4-1.3-5-3.6z';

function kit(pos) {
  return svg('svg', { class: ['kit', pos === 'GK' && 'gk'], viewBox: '0 0 32 32', 'aria-hidden': 'true' }, svg('path', { d: SHIRT }));
}

function playerChip(id, p, { captain, vice, chip, showXp, onPlayer, isNew, benchNo }) {
  const pos = posName(p?.pos);
  const xp = xpOf(p);
  const st = statusInfo(p?.status, p?.chance ?? p?.chance_pct);
  const badge = id === captain ? (String(chip).toLowerCase() === 'tc' ? '3×' : 'C') : id === vice ? 'V' : null;
  const name = p?.name ?? `#${id}`;
  const parts = [name, p?.club, pos, id === captain ? 'captain' : id === vice ? 'vice-captain' : null,
    showXp && xp != null ? `${fmt.pts(xp)} xP` : null, st.tone !== 'ok' ? st.label : null].filter(Boolean);
  const inner = [
    h('span.pl-kit', null, kit(pos),
      badge ? h('span.pl-badge', { class: badge === 'V' ? 'vice' : 'cap', 'aria-hidden': 'true' }, badge) : null,
      st.tone !== 'ok' ? h('span.sdot', { class: st.tone, 'aria-hidden': 'true', title: p?.news ? `${st.label}: ${p.news}` : st.label }) : null,
      benchNo != null ? h('span.pl-order', { 'aria-hidden': 'true' }, benchNo) : null),
    h('span.pl-name', null, name),
    h('span.pl-meta', null, p?.club ?? '', showXp ? h('b.num', null, xp == null ? DASH : fmt.pts(xp)) : null),
  ];
  const attrs = { class: ['pl', isNew && 'is-new'], title: parts.join(' · '), 'aria-label': parts.join(', '), dataset: { id } };
  return onPlayer
    ? h('button', { ...attrs, type: 'button', onClick: (e) => onPlayer(id, p, e) }, inner)
    : h('div', attrs, inner);
}

/**
 * players: {id: {name, club, pos (1-4|'GK'..), xp|pred, price, status, chance, news}}. xi rows group by position in
 * the given order; the bench keeps its order (numbered).
 */
export function pitch({ xi = [], bench = [], captain, vice, players = {}, chip, showXp = true, onPlayer, title, newIds = [] } = {}) {
  const P = (id) => players[id] ?? players[String(id)];
  const fresh = new Set((newIds || []).map(Number));
  const opts = (id, extra) => ({ captain: Number(captain), vice: Number(vice), chip, showXp, onPlayer, isNew: fresh.has(Number(id)), ...extra });
  const rows = { GK: [], DEF: [], MID: [], FWD: [], other: [] };
  for (const id of xi) rows[posName(P(id)?.pos) || 'other'].push(id);
  const chipLabel = chipName(chip);
  const field = h('div.pitch', { role: 'group', 'aria-label': 'Starting eleven' },
    h('div.pitch-lines', { 'aria-hidden': 'true' }, h('i.pl-box'), h('i.pl-six'), h('i.pl-arc'), h('i.pl-half'), h('i.pl-centre')),
    title || chipLabel ? h('div.pitch-top', null,
      title ? h('span.pitch-title', null, title) : h('span'),
      chipLabel ? h('span.chip-badge', { class: String(chip).toLowerCase() }, chipLabel) : null) : null,
    Object.entries(rows).filter(([, ids]) => ids.length).map(([pos, ids]) =>
      h('div.pitch-row', { dataset: { pos } }, ids.map((id) => playerChip(Number(id), P(id), opts(id))))));
  const benchEl = bench?.length
    ? h('div.bench', { class: { boosted: String(chip).toLowerCase() === 'bb' }, role: 'group', 'aria-label': 'Bench, in order' },
      h('span.bench-label', null, 'Bench'),
      h('div.bench-row', null, bench.map((id, i) => playerChip(Number(id), P(id), opts(id, { benchNo: i + 1 })))))
    : null;
  const nm = (id) => (id == null ? DASH : P(id)?.name ?? `#${id}`);
  const caption = captain != null || bench?.length
    ? h('p.pitch-caption', null, `Captain: ${nm(captain)} · Vice: ${nm(vice)}${bench?.length ? ' · Bench in order shown' : ''}`)
    : null;
  return h('div.pitch-wrap', null, field, benchEl, caption);
}

function xferSide(kind, p) {
  if (!p) return h('div.xfer-side', { class: kind }, h('span.xfer-tag', null, kind === 'out' ? 'Out' : 'In'), h('span.muted', null, DASH));
  const pos = posName(p.pos);
  const xp = xpOf(p);
  return h('div.xfer-side', { class: kind },
    h('span.xfer-tag', null, kind === 'out' ? 'Out' : 'In'),
    h('span.xfer-name', null, p.name ?? `#${p.id}`),
    h('span.xfer-meta', null, [p.club, pos, fin(p.price) ? fmt.money(p.price) : null].filter(Boolean).join(' · ')),
    xp != null ? h('span.xfer-xp.num', null, `${fmt.pts(xp)} xP`) : null);
}

/**
 * out/in: {name, club, pos, price, xp|pred}. gain → "+1.3 xPts"; cost: number → "costs £9.6m", string as is (e.g. "−4
 * hit").
 */
export function transferCard({ out, in: inn, gain, cost, note } = {}) {
  const foot = [
    fin(gain) ? h('span.xfer-gain.num', { class: toNum(gain) >= 0 ? 'gain' : 'loss' }, `${fmt.signed(gain)} xPts`) : null,
    cost != null && cost !== '' ? h('span.xfer-cost', null, fin(cost) ? `costs ${fmt.money(cost)}` : cost) : null,
    note ? h('span.xfer-note', null, note) : null,
  ].filter(Boolean);
  return h('div.xfer', null,
    h('div.xfer-pair', null, xferSide('out', out), h('span.xfer-arrow', null, icon('arrow', { size: 18 })), xferSide('in', inn)),
    foot.length ? h('div.xfer-foot', null, foot) : null);
}

// ---------------------------------------------------------------- combobox & player picker

/** Type-ahead: items (array or Promise), rank(item, q) → number|null (lower = better). */
export function combo({ items = [], rank, renderItem, onPick, placeholder = 'Search…', label, limit = 12, openOnFocus = false }) {
  const listId = uid('lb');
  const input = h('input.input', {
    type: 'search', role: 'combobox', placeholder, autocomplete: 'off', spellcheck: 'false',
    'aria-expanded': 'false', 'aria-autocomplete': 'list', 'aria-controls': listId, 'aria-label': label || placeholder,
  });
  const list = h('ul.combo-list', { id: listId, role: 'listbox', hidden: true });
  const el = h('div.combo', null, input, list);
  let all = [], shown = [], active = -1, exclude = new Set();
  const setItems = (arr) => { all = arr || []; if (document.activeElement === input) render(); };
  if (Array.isArray(items)) all = items;
  else Promise.resolve(items).then((v) => setItems(v || [])).catch(() => {});
  function render() {
    const q = norm(input.value.trim());
    if (!q && !openOnFocus) return close();
    shown = all.map((it, i) => ({ it, i, r: rank(it, q) })).filter((x) => x.r != null && !exclude.has(x.it.id ?? x.it))
      .sort((a, b) => a.r - b.r || a.i - b.i).slice(0, limit).map((x) => x.it);
    active = shown.length ? 0 : -1;
    list.replaceChildren(...(shown.length
      ? shown.map((it, i) => h('li.combo-opt', {
        role: 'option', id: `${listId}-${i}`, 'aria-selected': String(i === active),
        onPointerdown: (e) => { e.preventDefault(); pick(i); },
      }, renderItem(it)))
      : [h('li.combo-none', null, all.length ? 'No matches' : 'Loading…')]));
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    paint();
  }
  function paint() {
    [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', active >= 0 ? `${listId}-${active}` : '');
    list.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }
  function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
  function pick(i) {
    const it = shown[i];
    if (!it) return;
    input.value = '';
    close();
    onPick(it);
  }
  input.addEventListener('input', render);
  input.addEventListener('focus', () => { if (openOnFocus || input.value) render(); });
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.hidden) return render();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % Math.max(1, shown.length);
      paint();
    } else if (e.key === 'Enter') {
      if (!list.hidden && active >= 0) { e.preventDefault(); pick(active); }
    } else if (e.key === 'Escape') close();
  });
  return { el, input, setItems, setExclude: (ids) => { exclude = new Set(ids); }, getItems: () => all };
}

export function playerRank(p, q) {
  const n = norm(p.name);
  if (n.startsWith(q) || String(p.id) === q) return 0;
  if (n.split(/[\s.'-]+/).some((w) => w.startsWith(q))) return 1;
  if (norm(p.club) === q || norm(posName(p.pos)) === q) return 2;
  return n.includes(q) ? 3 : null;
}
export const playerOption = (p) => [
  h('span.opt-main', null, p.name),
  h('span.opt-sub', null, [p.club, posName(p.pos), fin(p.price) ? fmt.money(p.price) : null].filter(Boolean).join(' · ')),
];

/**
 * players: [{id, name, club, pos, price}] or a Promise of it. single → onPick(player), box clears; multiple →
 * removable chips, onPick(selectedPlayers[]). Element: .setPlayers(list), .setSelected(ids), .getSelected(), .focus().
 */
export function playerPicker({ players = [], multiple = false, onPick, selected = [], exclude = [], placeholder = 'Search players…', label, limit = 12 } = {}) {
  let sel = (selected || []).map(Number);
  const chips = h('div.chips');
  const byId = () => new Map(c.getItems().map((p) => [Number(p.id), p]));
  const c = combo({
    items: players, rank: playerRank, renderItem: playerOption, placeholder, label, limit,
    onPick: (p) => {
      if (!multiple) return onPick?.(p);
      if (!sel.includes(Number(p.id))) sel.push(Number(p.id));
      sync();
      onPick?.(sel.map((id) => byId().get(id)).filter(Boolean));
    },
  });
  function sync() {
    c.setExclude([...exclude.map(Number), ...(multiple ? sel : [])]);
    if (!multiple) return;
    const m = byId();
    chips.replaceChildren(...sel.map((id) => h('span.chip', null, m.get(id)?.name ?? `#${id}`,
      h('button.chip-x', {
        type: 'button', 'aria-label': `Remove ${m.get(id)?.name ?? id}`,
        onClick: () => { sel = sel.filter((x) => x !== id); sync(); onPick?.(sel.map((x) => byId().get(x)).filter(Boolean)); },
      }, icon('close', { size: 12 })))));
  }
  const el = h('div.picker', null, c.el, multiple ? chips : null);
  Promise.resolve(players).then(() => sync()).catch(() => {});
  el.setPlayers = (list) => { c.setItems(list); sync(); };
  el.setSelected = (ids) => { sel = (ids || []).map(Number); sync(); };
  el.getSelected = () => sel.slice();
  el.focus = () => c.input.focus();
  sync();
  return el;
}
