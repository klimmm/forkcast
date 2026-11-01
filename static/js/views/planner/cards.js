// Solver lab: the result cards (pure): why, recommendation, timeline, pitch, history, warnings, scenarios.

import { h, fmt, icon, chipName, plural } from '../../ui.js';
import { card, statTile, empty, pill, callout } from '../../studio/kit.js';
import { pitch, transferCard, table } from '../../studio/tables.js';
import { infoTip, humanise } from '../../studio/flags.js';
import { committedCells, committedRows, cellsTable, spanText, noteTone } from '../runs.js';
import {
  MOVES_SHOWN, MOVE_CHARGES, OBJ_TERMS, hitCostOf, isBuild, movesList, num, pairMoves, playerIn, prevTeam, rowTag,
  sum, timelineOf, xpSum,
} from './model.js';

// ---------------------------------------------------------------- result cards (pure)

/**
 * "Why": the anchor's solved objective by term for its GW and the whole window (TransferLab's Gain / Needs / Net,
 * generalised), plus gain vs charge for this GW's moves; a result without a recorded objective gets a one-line note.
 */
function whyBlock(res, gw, t, moved) {
  const an = res.anchors?.[gw];
  const obj = an?.objective;
  if (!obj || !Object.keys(obj).length) {
    return h('p.small.muted.pl-whyrow', null, 'No objective breakdown in this result (older runs did not record it): solve again to see why.');
  }
  const win = an.window?.length ? an.window : [gw];
  const span = spanText({ from: win[0], to: win.at(-1) });
  const multi = win.length > 1;
  const tags = [...Object.keys(OBJ_TERMS).filter((k) => obj[k]), ...Object.keys(obj).filter((k) => !OBJ_TERMS[k])];
  const rows = tags.map((tag) => ({
    tag, label: OBJ_TERMS[tag]?.[0] ?? humanise(tag), help: OBJ_TERMS[tag]?.[1] ?? 'A rule\'s own term.',
    now: num(obj[tag][gw]) ?? 0, win: sum(Object.values(obj[tag])),
  }));
  const total = { now: sum(rows.map((r) => r.now)), win: sum(rows.map((r) => r.win)) };
  const val = (v) => h('td.num', { class: { loss: v < 0 } }, fmt.num(v, 2));
  const tbl = h('div.tbl-scroll', null, h('table.tbl.dense.pl-obj', null,
    h('caption.sr-only', null, `Objective by term, ${fmt.gw(gw)}${multi ? ` and ${span}` : ''}`),
    h('thead', null, h('tr', null, h('th', null, h('span.th-txt', null, 'Term')),
      h('th.num', null, h('span.th-txt', null, fmt.gw(gw))), multi ? h('th.num', null, h('span.th-txt', null, span)) : null)),
    h('tbody', null, rows.map((r) => h('tr', { title: r.help }, h('td', null, r.label), val(r.now), multi ? val(r.win) : null)),
      h('tr.pl-total', null, h('td', null, 'Objective'), val(total.now), multi ? val(total.win) : null))));
  // Gain: this GW's moves against holding, best XI only, over the window (Team.d_ws); needs: their charge here.
  const gain = moved ? num(t.d_ws) : null;
  const needs = -sum(rows.filter((r) => MOVE_CHARGES.includes(r.tag)).map((r) => r.now));
  const net = gain == null ? null : gain - needs;
  const relaxed = num(res.meta?.int_squad_rounds);
  const tip = infoTip('About this breakdown',
    h('p', null, `The solver picks the plan with the highest objective over ${span}: forecast points plus each rule's charges and credits, all in points. These are the chosen plan's terms.`),
    gain != null ? h('p', null, `Gain: how much this GW's moves raise the best XI's forecast over ${span} against holding (no captain or bench). Needs: what the objective charges those moves in ${fmt.gw(gw)}. Net is a guide: the solver weighs the whole objective, later moves included.`) : null,
    multi && relaxed != null && relaxed < win.length ? h('p', null, `Rounds after the first ${plural(relaxed, 'round')} are solved as a relaxation, so their terms can be fractional.`) : null,
    h('dl.pl-obj-terms', null, rows.map((r) => [h('dt', null, r.label), h('dd', null, r.help)])));
  return h('section.pl-whyrow', null,
    h('div.pl-whyhead', null, h('h3.pl-h3', null, 'Why'), tip,
      gain != null ? h('div.row.tight.pl-gnn', null,
        pill(`Gain ${fmt.signed(gain, 2)}`, 'gain', { title: `Best-XI xP over ${span}, vs holding` }),
        pill(`Needs ${fmt.num(needs, 2)}`, '', { title: `This GW's transfer charges in the objective` }),
        pill(`Net ${fmt.signed(net, 2)}`, net >= 0 ? 'gain' : 'loss', { title: 'Gain minus needs' })) : null),
    tbl);
}

export function recommendationCard(res, rows) {
  const meta = res.meta || {};
  const i = rows.findIndex((r) => r.kind === 'committed' && r.gw === num(meta.to));
  const at = i >= 0 ? i : rows.map((r) => r.kind).lastIndexOf('committed');
  if (at < 0) return null;
  const { gw, t } = rows[at];
  const prev = prevTeam(res, rows, at);
  const pairs = pairMoves(t, prev);
  const n = Math.max(t.in?.length || 0, t.out?.length || 0);
  const chip = chipName(t.chip);
  const win = res.anchors?.[gw]?.window || [gw];
  const end = win.at(-1);
  const hitPts = hitCostOf(res) * (t.hits || 0);
  const nextFt = rows[at + 1]?.t?.ft_avail;
  const build = isBuild(t);
  const head = build ? `Best 15 for ${fmt.gw(gw)}${chip ? ` · ${chip}` : ''}`
    : chip ? `Play ${chip}${n ? ` · ${plural(n, 'move')}` : ''}` : n ? `Make ${plural(n, 'transfer')} now` : 'Roll the transfer';
  const why = build
    ? [`A squad picked from scratch: ${fmt.pts(t.pred)} xP this GW for ${fmt.money(t.team_value)}. The lineup is below.`]
    : n
      ? [`Plan gains ${fmt.signed(t.d_ws)} xPts over ${spanText({ from: gw, to: end })} vs holding`, ` (${fmt.signed(t.d_h0)} this GW, best-XI forecast before hits)`]
      : [`No move beats holding this GW`, nextFt != null ? `; ${plural(nextFt, 'free transfer')} next GW` : ''];
  const cards = pairs.map(([o, p]) => transferCard({
    out: o && { ...o, xp_value: xpSum(o) },
    in: p && { ...p, xp_value: xpSum(p) },
    gain: o && p ? xpSum(p) - xpSum(o) : null,
    cost: p ? num(p.price) : null,
    note: t.xp_gws?.length ? `xP over GW${t.xp_gws[0]}–${t.xp_gws.at(-1)}` : null,
  }));
  const shown = h('div.pl-xfers', null, cards.slice(0, MOVES_SHOWN));
  const more = cards.length > MOVES_SHOWN
    ? h('button.btn.sm.ghost', { type: 'button', onClick: (e) => { shown.append(...cards.slice(MOVES_SHOWN)); e.currentTarget.remove(); } },
      `Show all ${cards.length} moves`)
    : null;
  const nm = (id) => playerIn(t, prev, id).name;
  return card({
    title: `${fmt.gw(gw)} recommendation`, className: 'pl-rec',
    body: [
      h('p.pl-headline', null, head),
      h('p.pl-why', null, ...why),
      h('div.row.pl-facts', null,
        build ? null : pill(`FT ${t.ft_used ?? 0} of ${t.ft_avail ?? 0} used`),
        t.hits ? pill(`${plural(t.hits, 'hit')} · −${hitPts} pts`, 'loss') : pill('No hits'),
        pill(`Bank ${fmt.money(t.bank)}`, t.bank < 0 ? 'loss' : ''),
        pill(`C ${nm(t.captain)} · V ${nm(t.vice)}`, 'info'),
        chip ? h('span.chip-badge', { class: t.chip }, chip) : null),
      t.played ? callout('info', `GW${gw} has been played: this is the move the solver would have made.`) : null,
      t.bank < 0 ? callout('loss', 'The bank goes negative here: this squad is not affordable at current prices.') : null,
      cards.length && !build ? [shown, more] : null,
      whyBlock(res, gw, t, n > 0 && !build),
    ],
  });
}

export function timelineCard(res, rows, onSelect) {
  const meta = res.meta || {};
  const hit = hitCostOf(res);
  const stat = (k, v, cls) => h('div', { class: cls }, h('dt', null, k), h('dd.num', null, v));
  const cols = rows.map((r, i) => {
    const { t } = r;
    const prev = prevTeam(res, rows, i);
    return h('button.pl-tl-col', {
      type: 'button', dataset: { gw: r.gw }, class: { plan: r.kind === 'plan', played: !!t.played },
      'aria-pressed': 'false', 'aria-label': `${fmt.gw(r.gw)}: show the lineup`, onClick: () => onSelect(r.gw),
    },
    h('div.pl-tl-head', null, h('strong', null, fmt.gw(r.gw)), h('span.pl-tl-tag', null, rowTag(r, meta)),
      t.chip ? h('span.chip-badge', { class: t.chip }, chipName(t.chip)) : null),
    movesList(t, prev, 4),
    h('dl.pl-tl-stats', null,
      stat('xP', fmt.pts(t.pred)),
      stat('Pts', t.played ? fmt.int(t.act) : '—'),
      stat('FT', `${t.ft_used ?? 0}/${t.ft_avail ?? 0}`),
      stat('Hits', t.hits ? `−${hit * t.hits}` : '0', t.hits ? 'loss' : null),
      stat('Bank', fmt.money(t.bank), ['wide', t.bank < 0 && 'loss']),
      stat('C', playerIn(t, prev, t.captain).name, 'wide')));
  });
  const strip = h('div.pl-timeline', { role: 'group', 'aria-label': 'Plan by gameweek' }, cols);
  const el = card({
    title: 'Plan timeline',
    sub: 'Committed rounds, then the rest of the last window as planned. Click a gameweek for its lineup.',
    body: strip,
  });
  el.select = (gw) => {
    for (const c of cols) c.setAttribute('aria-pressed', String(Number(c.dataset.gw) === gw));
  };
  return el;
}

export function pitchCard(res, rows, gw) {
  const i = rows.findIndex((r) => r.gw === gw);
  if (i < 0) return card({ title: 'Lineup', body: empty('No lineup for this gameweek.') });
  const { t, kind, anchor } = rows[i];
  const players = Object.fromEntries(Object.entries(t.players || {}).map(([id, p]) => [id, { ...p, xp_value: p.pred }]));
  const sub = [
    kind === 'plan' ? `Planned at GW${anchor}` : t.played ? `Played · scored ${fmt.int(t.act)}` : 'Committed',
    `${fmt.pts(t.pred)} xP`,
    t.hits ? `${plural(t.hits, 'hit')}` : null,
  ].filter(Boolean).join(' · ');
  return card({
    title: `${fmt.gw(gw)} lineup`, sub, className: 'pl-pitch',
    body: [
      pitch({ xi: t.xi, bench: t.bench, captain: t.captain, vice: t.vice, players, chip: t.chip, newIds: t.in,
        title: `${fmt.gw(gw)} · ${fmt.pts(t.pred)}` }),
      kind === 'plan' ? h('p.small.muted', null, `Plan rows reuse GW${anchor}'s prices and minutes; only xP, moves, XI, captain, chip, bank and FTs are forecasts.`) : null,
    ],
  });
}

export function historyCard(res, jobId) {
  const { cells, totals: tot } = committedCells(res);
  if (cells.length < 2) return null;
  const anyPlayed = committedRows(res).some((r) => r._played);
  return card({
    title: 'Committed rounds',
    sub: 'The solver\'s results table; realised columns are blank (—) for rounds not played yet.',
    body: [
      h('div.pl-tiles', null,
        statTile({ label: 'xP (committed)', value: fmt.pts(tot.pred) }),
        anyPlayed ? statTile({ label: 'Points scored', value: fmt.int(tot.act) }) : null,
        statTile({ label: 'Hits', value: fmt.int(tot.hits), tone: tot.hits ? 'loss' : null })),
      cellsTable(res, { csv: `plan_${jobId || 'run'}.csv` }),
    ],
  });
}

export function warningsCard(res, onExact) {
  const ws = res.warnings || [];
  if (!ws.length) return null;
  // Plan rows past the integer rounds are a rounded LP relaxation and can overspend (see solve_tap warnings);
  // all-integer windows are exact at a few seconds' extra cost.
  const m = res.meta || {};
  const overspent = Object.values(res.anchors || {}).some((a) => Object.values(a.plan || {}).some((t) => t.bank < 0));
  const exactN = m.window_len;
  const relaxed = overspent && onExact && exactN && m.int_squad_rounds != null && m.int_squad_rounds < exactN;
  return card({
    title: 'Notes from the run',
    body: h('div.stack.tight', null,
      ws.map((w) => callout(noteTone(w), w)),
      relaxed ? h('div', null, h('button.btn.sm', { type: 'button', onClick: () => onExact(exactN) },
        icon('play', { size: 14 }), `Re-solve with an exact plan (--int-rounds ${exactN})`)) : null),
  });
}

/** Scenario comparison: GW rows with each variant's moves / captain / chip / xP, then window totals. */
export function scenarioTable(items) {
  const tls = items.map(({ res }) => {
    const rows = timelineOf(res);
    return new Map(rows.map((r, i) => [r.gw, { ...r, prev: prevTeam(res, rows, i) }]));
  });
  const gws = [...new Set(tls.flatMap((m) => [...m.keys()]))].sort((a, b) => a - b);
  const common = gws.filter((g) => tls.every((m) => m.has(g)));
  const best = (vals) => {
    const xs = vals.filter(Number.isFinite);
    return xs.length > 1 && Math.max(...xs) !== Math.min(...xs) ? Math.max(...xs) : null;
  };
  const rows = gws.map((gw) => {
    const cells = tls.map((m) => m.get(gw));
    return { kind: 'gw', label: fmt.gw(gw), cells, top: best(cells.map((r) => num(r?.t?.pred) ?? NaN)) };
  });
  if (common.length) {
    const xp = tls.map((m) => sum(common.map((g) => m.get(g).t.pred)));
    const hits = tls.map((m) => sum(common.map((g) => m.get(g).t.hits)));
    const net = xp.map((x, i) => x - hits[i] * hitCostOf(items[i].res));
    const span = spanText({ from: common[0], to: common.at(-1) });
    rows.push(
      { kind: 'total', label: `xP ${span}`, vals: xp, top: best(xp), f: (v) => fmt.pts(v) },
      { kind: 'total', label: 'Hits', vals: hits, top: null, f: (v, i) => (v ? `${v} (−${v * hitCostOf(items[i].res)})` : '0') },
      { kind: 'total', label: `Net xP ${span}`, vals: net, top: best(net), f: (v) => fmt.pts(v) });
  }
  const cellView = (r, top) => {
    if (!r) return h('span.muted', null, '—');
    const { t } = r;
    return h('div.pl-sc-cell', null,
      movesList(t, r.prev, 3),
      h('div.pl-sc-meta', null,
        h('span.truncate', null, `C ${playerIn(t, r.prev, t.captain).name}`),
        t.chip ? h('span.chip-badge', { class: t.chip }, chipName(t.chip)) : null,
        h('span.num.pl-sc-xp', { class: { best: top != null && num(t.pred) === top } }, fmt.pts(t.pred))));
  };
  const cellText = (r) => {
    if (!r) return '';
    const mv = pairMoves(r.t, r.prev).map(([o, i]) => `${o?.name ?? '-'}>${i?.name ?? '-'}`).join('; ') || 'roll';
    return `${mv} | C ${playerIn(r.t, r.prev, r.t.captain).name}${r.t.chip ? ` | ${r.t.chip}` : ''} | ${fmt.pts(r.t.pred)}`;
  };
  const columns = [
    { key: 'label', label: 'GW', sort: false, render: (r) => (r.kind === 'total' ? h('strong', null, r.label) : r.label), csv: (r) => r.label },
    ...items.map((it, i) => ({
      key: `v${i}`, label: it.name, sort: false, className: 'pl-sc-col',
      render: (r) => (r.kind === 'gw' ? cellView(r.cells[i], r.top)
        : h('span.num', { class: { best: r.top != null && r.vals[i] === r.top } }, r.f(r.vals[i], i))),
      csv: (r) => (r.kind === 'gw' ? cellText(r.cells[i]) : r.vals[i]),
    })),
  ];
  return table({ columns, rows, csv: 'scenarios.csv', stickyFirst: true, rowClass: (r) => (r.kind === 'total' ? 'pl-total' : null), caption: 'Scenario comparison' });
}
