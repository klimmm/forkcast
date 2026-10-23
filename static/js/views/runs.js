// Runs: every job the Studio started (solves, backtests, previews, ratings, data ops) with filters,
// a detail panel (commands, live log, result, report page) and a per-GW diff of two solve results
// (#/runs?diff=a,b). The result helpers exported below are shared with the Backtests view.

import * as api from '../api.js';
import { enc } from '../api.js';
import {
  h, card, table, lineChart, statTile, pill, jobStatusPill, jobRunner, toast, confirm, copyText, fmt, icon,
  empty, loading, errorCard, chipName, toMs, norm, fill, fin, callout,
} from '../ui.js';

export const KINDS = ['solve', 'backtest', 'preview', 'rate', 'fetch', 'build', 'infer'];  // api/jobs.py KINDS
export const KIND_TONE = { solve: 'gain', backtest: 'info', fetch: 'warn', build: 'warn', infer: 'warn' };
const RESULT_KINDS = new Set(['solve', 'backtest']);  // tap/solve_tap.py writes their result.json
const SOLVER_KINDS = new Set(['solve', 'backtest', 'preview', 'rate']);
const STATUSES = [['active', 'Queued or running'], ['done', 'Done'], ['error', 'Error'], ['cancelled', 'Cancelled']];
const LOG_CALLS = 16;  // jobs.py serves 256 KB per log call: show up to 4 MB

const stripAnsi = (s) => String(s || '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

// ---------------------------------------------------------------- shared result helpers

/** "GW6" / "GW1–38" from anything with from/to. */
export const spanText = (s) => (s?.from == null ? '' : s.to == null || +s.to === +s.from ? `GW${s.from}` : `GW${s.from}–${s.to}`);

function movesText(m) {
  const i = m?.in || [], o = m?.out || [];
  if (!i.length && !o.length) return 'hold';
  if (i.length > 3 || o.length > 3) return `${i.length} in / ${o.length} out`;
  return `${i.join(', ') || '—'} in / ${o.join(', ') || '—'} out`;
}

/** One line for a job's outcome, from job.summary (api/jobs.py summarize / _finalize). */
export function summaryText(job) {
  const s = job?.summary;
  if (api.isActive(job)) return job.status === 'queued' ? 'Waiting for a free slot' : 'Running…';
  if (job?.status === 'error' || job?.status === 'cancelled') return job.error || s?.error || job.status;
  if (!s) return '';
  if (RESULT_KINDS.has(job.kind)) {
    if (s.error) return s.error;
    // --entry runs carry the manager's earlier rounds as history rows, inside total_pred
    const hist = Object.keys(s.captains || {}).some((g) => +g < +s.from);
    const played = fin(s.total_act) && +s.total_act > 0;
    if (job.kind === 'backtest' || (s.to != null && +s.to !== +s.from)) {
      return [spanText(s), !hist && fin(s.total_pred) && `pred ${fmt.pts(s.total_pred)}`,
        played && `${fmt.int(s.total_act)} pts`, s.rank && `rank ${s.rank}`].filter(Boolean).join(' · ');
    }
    const gw = s.from;
    return [`${spanText(s)}: ${movesText(s.gw_moves?.[gw])}`, chipName(s.chips?.[gw]),
      s.captains?.[gw] && `C ${s.captains[gw]}`, !hist && fin(s.total_pred) && `pred ${fmt.pts(s.total_pred)}`]
      .filter(Boolean).join(' · ');
  }
  if (s.gw != null) return [job.kind === 'rate' ? 'Rating' : 'Preview', s.season, `GW${s.gw}`, s.full && '(full)'].filter(Boolean).join(' ');
  return s.last_line || '';
}

/** The committed table and its totals: table_cells[meta.committed_table] (api/jobs.py _committed_table). */
export function committedCells(res) {
  const all = res?.table_cells || [];
  let i = res?.meta?.committed_table;
  if (!Number.isInteger(i) || i < 0 || i >= all.length) i = all.length - 1;
  return { cells: all[i] || [], totals: res?.table_totals?.[i] || {} };
}

// Realised columns of a round not played yet hold 0 placeholders: blank them (shown as —).
const REALISED = ['act', 'pred.s', 'avg', 'diff', 'asub', 'ia', 'da', 'fa', 'ca', 'bna', 'dact', 'cap.rk'];

/** Committed rows with `_played`, realised fields of unplayed rounds set to null. */
export function committedRows(res) {
  const committed = res?.committed || {};
  const last = res?.meta?.last_played;
  return committedCells(res).cells.map((c) => {
    const gw = Number(c.GW);
    const t = committed[gw]?.team;
    const played = typeof t?.played === 'boolean' ? t.played : last == null || gw <= last;
    const r = { ...c, _played: played };
    if (!played) {
      for (const k of REALISED) if (k in r) r[k] = null;
      if (typeof r['my.cap'] === 'string') r['my.cap'] = r['my.cap'].replace(/\s+-?\d+$/, '');
    }
    return r;
  });
}

// The solver's committed-table columns in print order (solver/data_io/results.py _table_spec):
// [key, label, decimals (null = text), title]. Columns a run did not print are skipped.
const CELL_COLS = [
  ['GW', 'GW', 0],
  ['CH', 'Chip', null, 'Chip played'],
  ['A', 'FT', 0, 'Free transfers available'],
  ['F', 'Used', 0, 'Free transfers used'],
  ['H', 'Hits', 0, 'Paid transfers'],
  ['pred', 'Pred', 1, 'Predicted points: the eleven and the captain'],
  ['pred.s', 'Pred AS', 1, 'Predicted points after auto-subs'],
  ['bnv', 'Bench v', 1, "The bench's weight in the solver objective (not in Pred)"],
  ['asub', 'Auto-sub', 0, 'Points the auto-subs added'],
  ['act', 'Actual', 0, 'Points scored'],
  ['avg', 'Avg', 0, 'FPL average score'],
  ['diff', '± avg', 0, 'Actual minus the FPL average'],
  ['rank', 'Rank', null, 'Overall rank after the round, from rank brackets (~ = estimated)'],
  ['ip', 'Ideal p', 1], ['ia', 'Ideal a', 0], ['dp', 'Δ ideal p', 1], ['da', 'Δ ideal a', 0],
  ['fp', 'Fresh p', 1], ['fa', 'Fresh a', 0],
  ['cp', 'Cap p', 1, "Captain's prediction"], ['ca', 'Cap a', 0, "Captain's points"],
  ['bnp', 'Bench p', 1, "Bench's prediction"], ['bna', 'Bench a', 0, "Bench's points"],
  ['my.cap', 'Captain', null, 'Captain after auto-subs, with his points'],
  ['cap.rk', 'Cap rank', null, "#n: the crowd's captaincy rank of your captain; pk: his points place among the crowd's ten most captained"],
  ['in', 'In', null], ['out', 'Out', null],
  ['dh0', 'Δ h0', 1], ['dws', 'Δ ws', 1], ['dact', 'Δ act', 0],
  ['burn', 'Burn £', 1, 'Sale value lost on the players sold (£m)'],
  ['TV', 'TV £', 1, 'Team value (£m)'], ['ITB', 'Bank £', 1, 'Money in the bank (£m)'],
  ['Tot', 'Value £', 1, 'Team value + bank (£m)'], ['LV', 'Liquid £', 1, 'Liquid value (£m)'],
  ['t.cap', 'Most capt.', null], ['t.vc', 'Most vice', null], ['t.in', 'Most in', null], ['t.sel', 'Most owned', null],
  ['miss', 'Missed', null, 'Best scorer among the 20 most-owned players not in the squad (#n = his prediction rank)'],
  ['top5', 'Top 5 owned', null],
];
const SIGNED = new Set(['diff', 'dp', 'da', 'dh0', 'dws', 'dact', 'burn']);

/** Sortable per-GW committed table (table_cells) with CSV export. */
export function cellsTable(res, { maxHeight = 460, csv = 'committed.csv' } = {}) {
  const rows = committedRows(res);
  if (!rows.length) return empty('This run printed no committed table.');
  const keys = new Set(rows.flatMap(Object.keys));
  const known = new Set(CELL_COLS.map((c) => c[0]));
  const extra = [...keys].filter((k) => !known.has(k) && !k.startsWith('_')).map((k) => [k, k, null]);
  const columns = [...CELL_COLS.filter(([k]) => keys.has(k)), ...extra].map(([key, label, d, title]) => ({
    key, label, title, num: d != null,
    fmt: d == null ? undefined
      : (v) => (typeof v === 'number' ? (SIGNED.has(key) ? fmt.signed(v, d) : fmt.num(v, d)) : v || fmt.dash),
  }));
  const el = table({
    columns, rows, sortKey: 'GW', sortDir: 'asc', stickyFirst: true, dense: true, maxHeight, csv,
    rowClass: (r) => [!r._played && 'rs-unplayed', r.CH && 'rs-chip'], caption: 'Committed rounds',
  });
  el.classList.add('rs-cells');
  return el;
}

/** "455k" / "~1.2m" / ">5.0m" / "40" (results.py rank_at) → number, else null. */
export function parseRank(s) {
  const m = /^[~>]?\s*([\d.]+)\s*([km])?$/i.exec(String(s ?? '').trim().replace(/,/g, ''));
  return m ? Math.round(parseFloat(m[1]) * ({ k: 1e3, m: 1e6 }[m[2]?.toLowerCase()] || 1)) : null;
}

/** Cumulative pred and act per GW (act stops at the last played round) and rank per GW. */
export function cumulative(res) {
  let p = 0, a = 0;
  const pred = [], act = [], rank = [];
  for (const r of committedRows(res)) {
    const gw = Number(r.GW);
    if (!Number.isFinite(gw)) continue;
    if (fin(r.pred)) p += Number(r.pred);
    pred.push([gw, +p.toFixed(2)]);
    const played = r._played && fin(r.act);
    if (played) a += Number(r.act);
    act.push([gw, played ? a : null]);
    rank.push([gw, r._played ? parseRank(r.rank) : null]);
  }
  return { pred, act, rank };
}

/** Rank by GW: ranks span 10 to 10M, so y = −log10(rank) (better ranks sit higher). */
export function rankChart(series, opts = {}) {
  return lineChart({
    xFmt: (x) => `GW${x}`, yLabel: 'Overall rank', yZero: false, height: 200, ...opts,
    yFmt: (v) => fmt.compact(10 ** -v),
    series: series.map((s) => ({ ...s, points: s.points.map(([x, r]) => [x, r > 0 ? -Math.log10(r) : null]) })),
  });
}

/** Totals: predicted, actual, last rank, hits (+ pool and τ). */
export function resultTiles(job, res) {
  const s = job?.summary || {};
  const m = res?.meta || {};
  const { totals } = committedCells(res);
  const rows = committedRows(res);
  const played = rows.filter((r) => r._played);
  const ranked = [...played].reverse().find((r) => parseRank(r.rank) != null);
  const pred = totals.pred ?? s.total_pred, act = totals.act ?? s.total_act, hits = totals.hits ?? s.hits;
  const hist = rows.some((r) => +r.GW < +(m.from ?? s.from));
  return h('div.grid-4', null,
    statTile({ label: 'Predicted', value: fmt.pts(pred), sub: [spanText(m.from != null ? m : s), hist && 'incl. entry history'].filter(Boolean).join(' · ') }),
    statTile({
      label: 'Actual points', value: played.length ? fmt.int(act) : fmt.dash, tone: played.length ? 'gain' : null,
      sub: played.length ? `${played.length} of ${rows.length} rounds played` : 'not played yet',
    }),
    statTile({ label: 'Rank', value: ranked?.rank || s.rank || fmt.dash, sub: ranked ? `after GW${ranked.GW}` : 'no rank available' }),
    statTile({
      label: 'Hits', value: fmt.int(hits), tone: +hits > 0 ? 'warn' : null,
      sub: [m.pool || s.pool, fin(m.tau ?? s.tau) && `τ ${fmt.num(m.tau ?? s.tau, 2)}`].filter(Boolean).join(' · ') || null,
    }));
}

/**
 * A result note's tone (tap/solve_tap.py warnings): a plan that overspends or stops short is a loss; the
 * row caveats and the solver's data notices (no captain poll, no rank rows: [poll] / [rank]) are info.
 */
export const noteTone = (w) => (/NEGATIVE|INCOMPLETE|goes negative/i.test(w) ? 'loss'
  : /not played yet|reuse the anchor|^\s*\[(poll|rank)\] |no manager rows/i.test(w) ? 'info' : 'warn');

/** The result's notes, one callout per tone, worst first. */
export function warningsBlock(res) {
  const w = res?.warnings || [];
  const groups = ['loss', 'warn', 'info'].map((t) => [t, w.filter((x) => noteTone(x) === t)]).filter(([, xs]) => xs.length);
  return groups.length ? h('div.stack.tight', null, groups.map(([t, xs]) =>
    callout(t, h('ul.rs-notes', null, xs.map((x) => h('li', null, x)))))) : null;
}

/** The run's error (job or result), with the traceback behind a disclosure. */
export function errorBlock(job, res) {
  const msg = res?.error || (job?.status === 'error' || job?.status === 'cancelled' ? job.error : null);
  if (!msg) return null;
  return h('div.callout', { class: job?.status === 'cancelled' ? 'warn' : 'loss' }, icon('warn'),
    h('div.stack.tight', null, h('strong', null, msg),
      res?.traceback ? h('details', null, h('summary.muted', null, 'Traceback'), h('pre.log.rs-pre', null, res.traceback)) : null));
}

function cmdLine(label, cmd) {
  return cmd ? h('div.rs-cmd', null, h('span.rs-cmd-label', null, label), h('code.mono', null, cmd),
    h('button.icon-btn', { type: 'button', title: `Copy ${label.toLowerCase()} command`, 'aria-label': `Copy ${label.toLowerCase()} command`, onClick: () => copyText(cmd) },
      icon('copy', { size: 14 }))) : null;
}

/** The solver command (what to paste in a terminal) and, unless `ran` is false, the command the Studio ran. */
export const cmdBlock = (job, { ran = true } = {}) => h('div.rs-cmds', null, cmdLine('Solver', job.solver_cmd),
  ran && job.cmd !== job.solver_cmd ? cmdLine('Ran', job.cmd) : null);

async function fetchLog(id) {
  let offset = 0, text = '', calls = 0, done = false;
  while (calls++ < LOG_CALLS) {
    const c = await api.getJobLog(id, offset);
    text += c?.text || '';
    done = !c || c.done || !(c.offset > offset);
    if (done) break;
    offset = c.offset;
  }
  return done ? text : `${text}\n[Studio] log truncated after ${LOG_CALLS} reads`;
}

/** A finished job's whole log, fetched when the disclosure first opens. */
export function logBlock(job, { open = false, summary = 'Log' } = {}) {
  const pre = h('pre.log.rs-pre', { tabindex: 0, 'aria-label': 'Job output' });
  let loaded = false;
  const load = async () => {
    if (loaded) return;
    loaded = true;
    pre.textContent = 'Loading…';
    try {
      pre.textContent = stripAnsi(await fetchLog(job.id)) || '(empty log)';
      pre.scrollTop = pre.scrollHeight;
    } catch (e) {
      loaded = false;
      pre.textContent = e.message;
    }
  };
  const d = h('details.rs-log', { open }, h('summary', null, summary), pre);
  d.addEventListener('toggle', () => { if (d.open) load(); });
  if (open) load();
  return d;
}

/** Ask, delete, toast. Resolves true when deleted. */
export async function deleteJobFlow(job) {
  const ok = await confirm({
    title: 'Delete this run?',
    body: `${job.label || job.id}: its log${RESULT_KINDS.has(job.kind) ? ', result' : ''}${job.html_url ? ', page' : ''} and record are removed${api.isActive(job) ? ' after it is cancelled' : ''}. This cannot be undone.`,
    confirmLabel: 'Delete', danger: true,
  });
  if (!ok) return false;
  try {
    await api.deleteJob(job.id);
    toast('Run deleted', 'ok', { timeout: 2500 });
    return true;
  } catch (e) {
    toast(e.message, 'error');
    return false;
  }
}

// ---------------------------------------------------------------- job detail

function movesTable(s) {
  const gws = [...new Set([...Object.keys(s.captains || {}), ...Object.keys(s.gw_moves || {})])].map(Number).sort((a, b) => a - b);
  if (!gws.length) return null;
  const src = (gw) => s.gw_moves?.[gw]?.source || (gw < s.from ? 'history' : gw <= s.to ? 'committed' : 'plan');
  const rows = gws.map((gw) => ({
    gw, source: src(gw), in: s.gw_moves?.[gw]?.in || [], out: s.gw_moves?.[gw]?.out || [],
    captain: s.captains?.[gw], chip: s.chips?.[gw],
  }));
  const names = (xs, cls) => (xs.length ? h('span', { class: cls, title: xs.join(', ') }, xs.length > 4 ? `${xs.length} players` : xs.join(', ')) : h('span.muted', null, '—'));
  return table({
    columns: [
      { key: 'gw', label: 'GW', num: true },
      { key: 'source', label: 'Row', render: (r) => pill(r.source, r.source === 'committed' ? 'gain' : r.source === 'plan' ? 'info' : '') },
      { key: 'in', label: 'In', sort: false, render: (r) => names(r.in, 'gain'), csv: (r) => r.in.join('; ') },
      { key: 'out', label: 'Out', sort: false, render: (r) => names(r.out, 'loss'), csv: (r) => r.out.join('; ') },
      { key: 'captain', label: 'Captain' },
      { key: 'chip', label: 'Chip', fmt: (v) => chipName(v) || '' },
    ],
    rows, sortKey: 'gw', sortDir: 'asc', dense: true, maxHeight: 360, csv: 'moves.csv', caption: 'Moves by gameweek',
    rowClass: (r) => r.source === 'committed' && 'rs-now',
  });
}

function resultBody(job, result) {
  if (!committedCells(result).cells.length) return [warningsBlock(result)];  // failed before the first round
  const s = job.summary || {};
  const c = cumulative(result);
  const multi = c.act.filter(([, y]) => y != null).length > 1;
  return [
    resultTiles(job, result),
    multi ? h('div.rs-chart', null, h('h3.rs-h', null, 'Cumulative points'), lineChart({
      series: [{ name: 'Predicted', points: c.pred, dashed: true }, { name: 'Actual', points: c.act }],
      xFmt: (x) => `GW${x}`, yLabel: 'Points', height: 220,
    })) : null,
    s.chip_auto ? h('p.small.muted', null, `Chip auto: ${typeof s.chip_auto === 'string' ? s.chip_auto : JSON.stringify(s.chip_auto)}`) : null,
    h('h3.rs-h', null, 'Moves, captain and chips by GW'),
    movesTable(s) || empty('No moves recorded.'),
    warningsBlock(result),
    h('details.rs-log', null, h('summary', null, 'Committed table'), cellsTable(result, { csv: `run_${job.id}.csv` })),
  ];
}

/** The label of a phone run started again here (QA-7 #4): a Studio run, never the phone's own "phone · …" label:
 *  "phone · bake roll GW6 · 383130" → "Studio re-run · bake roll GW6 · 383130". */
export function rerunLabel(job) {
  const what = String(job?.label ?? '').replace(/^phone\s*·\s*/, '').trim();
  return what ? `Studio re-run · ${what}` : 'Studio re-run';
}

function detailCard(job, result, { reopen, close }) {
  const active = api.isActive(job);
  const actions = [
    jobStatusPill(job.status),
    job.kind === 'solve' && job.status === 'done'
      ? h('a.btn.sm.primary', { href: `#/planner?job=${enc(job.id)}` }, icon('planner', { size: 15 }), 'Open in Planner') : null,
    job.kind === 'backtest' ? h('a.btn.sm', { href: `#/backtests?job=${enc(job.id)}` }, icon('backtests', { size: 15 }), 'Open in Backtests') : null,
    SOLVER_KINDS.has(job.kind) && !active ? h('button.btn.sm', {
      type: 'button', title: 'Start the same command again',
      onClick: async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
          // its values when it has them (the server rebuilds the argv from them), so the new run keeps them; a phone run
          // goes again as the exact command it ran (its argv: the tap's own --no-buys-gw of a Roll included, which no
          // main.py flag in its values is), on the same tap, as a Studio run labelled so (rerunLabel)
          const out = await api.createJob(job.source === 'phone'
            ? { kind: job.kind, argv: job.argv || [], label: rerunLabel(job) }
            : { kind: job.kind, values: job.values, argv: job.argv || [], label: job.label });
          reopen((out?.job ?? out).id);
        } catch (err) { toast(err.message, 'error'); btn.disabled = false; }
      },
    }, icon('play', { size: 14 }), 'Run again') : null,
    h('button.btn.sm.danger', { type: 'button', onClick: async () => { if (await deleteJobFlow(job)) close(); } }, icon('trash', { size: 14 }), 'Delete'),
    h('button.icon-btn', { type: 'button', title: 'Close', 'aria-label': 'Close details', onClick: close }, icon('close')),
  ];
  const meta = [job.kind, `created ${fmt.date(job.created)} (${fmt.ago(job.created)})`,
    !active && fin(job.elapsed) && `took ${fmt.dur(job.elapsed)}`, job.exit_code != null && job.exit_code !== 0 && `exit ${job.exit_code}`];
  const body = [cmdBlock(job, { ran: !active })];  // jobRunner shows the command it runs
  if (active) {
    body.push(jobRunner({ job, title: job.label, onDone: () => reopen(job.id, { scroll: false }) }));
  } else {
    body.push(errorBlock(job, result));
    if (RESULT_KINDS.has(job.kind) && result) body.push(...resultBody(job, result));
    else if (RESULT_KINDS.has(job.kind) && job.status === 'done') body.push(empty('This run left no result file.'));
    if (job.html_url) {
      const url = api.jobHtmlUrl(job.id);
      body.push(h('div.row', null, h('span.muted.small', null, summaryText(job)), h('span.spacer'),
        h('a.btn.sm.ghost', { href: url, target: '_blank', rel: 'noopener' }, icon('external', { size: 14 }), 'Open in a new tab')),
      h('iframe.report', { src: url, title: `${job.kind} page`, loading: 'lazy' }));
    } else if (!RESULT_KINDS.has(job.kind) && job.summary?.last_line) {
      body.push(h('p.small', null, h('span.muted', null, 'Last line: '), h('code.mono', null, job.summary.last_line)));
    }
    body.push(logBlock(job, { open: job.status === 'error' && !result?.traceback && !committedCells(result).cells.length }));
  }
  return card({ title: job.label || job.id, sub: meta.filter(Boolean).join(' · '), actions, body, className: 'rs-detail', id: 'run-detail' });
}

// ---------------------------------------------------------------- diff of two solves

/** --flag=value / --flag value / --switch → Map(flag → value). */
function argvMap(argv = []) {
  const m = new Map();
  for (let i = 0; i < argv.length; i++) {
    const a = String(argv[i]);
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq > 0) m.set(a.slice(0, eq), a.slice(eq + 1));
    else if (argv[i + 1] != null && !String(argv[i + 1]).startsWith('--')) m.set(a, String(argv[++i]));
    else m.set(a, 'on');
  }
  return m;
}

function settingsDiff(a, b) {
  const A = argvMap(a), B = argvMap(b);
  const rows = [...new Set([...A.keys(), ...B.keys()])].filter((k) => A.get(k) !== B.get(k));
  if (!rows.length) return h('p.small.muted', null, 'Same solver flags.');
  return h('div.df-flags', null, h('span.small.muted', null, 'Flags that differ:'),
    rows.map((k) => h('code.df-flag', null, k, ' ', h('span.df-a', null, A.get(k) ?? 'default'), ' → ', h('span.df-b', null, B.get(k) ?? 'default'))));
}

function movesCell(x, other) {
  if (!x) return h('span.muted', null, '—');
  const same = other && JSON.stringify([...x.in_ids].sort()) === JSON.stringify([...other.in_ids].sort())
    && JSON.stringify([...x.out_ids].sort()) === JSON.stringify([...other.out_ids].sort());
  if (!x.in.length && !x.out.length) return h('span', { class: same ? 'muted' : 'df-diff' }, 'hold');
  const list = (xs) => (xs.length > 4 ? `${xs.length} players` : xs.join(', '));
  return h('div.df-moves', { class: { 'df-diff': !same }, title: `In: ${x.in.join(', ')}\nOut: ${x.out.join(', ')}` },
    x.in.length ? h('span.gain', null, `+ ${list(x.in)}`) : null,
    x.out.length ? h('span.loss', null, `− ${list(x.out)}`) : null);
}

function pairCell(a, b, f = (v) => v) {
  const va = a == null ? null : f(a), vb = b == null ? null : f(b);
  return [va ?? '—', vb ?? '—'].map((v, i) => h('span', { class: va !== vb && (i ? 'df-b df-diff' : 'df-a') }, v));
}

function diffCard(d, { swap, close }) {
  const T = d.totals || {};
  let onlyDiff = false;
  const sideHead = (tag, x) => h('div.df-side', null, h('span.df-tag', { class: tag }, tag.toUpperCase()),
    h('div.stack.tight', null,
      h('a.strong', { href: `#/runs?job=${enc(x?.id)}` }, x?.label || x?.id || '—'),
      h('span.small.muted', null, [x?.kind, summaryText({ ...x, status: 'done' })].filter(Boolean).join(' · '))));
  const delta = (b, a) => (fin(a) && fin(b) ? b - a : null);
  const dPred = delta(T.b_pred, T.a_pred), dAct = delta(T.b_act, T.a_act);
  const tone = (v) => (v == null || Math.abs(v) < 0.05 ? null : v > 0 ? 'gain' : 'loss');
  const rows = (d.gws || []).map((r) => ({ ...r, d_pred: r.d_pred ?? null, d_act: r.d_act ?? null }));
  const tbl = table({
    columns: [
      { key: 'gw', label: 'GW', num: true },
      { key: 'source', label: 'Row', sort: (r) => r.a?.source || r.b?.source, render: (r) => h('span.small.muted', null, r.a?.source || r.b?.source || ''), csv: (r) => r.a?.source || r.b?.source },
      { key: 'moves_a', label: 'Moves A', sort: false, render: (r) => movesCell(r.a, r.b), csv: (r) => r.a && movesText(r.a) },
      { key: 'moves_b', label: 'Moves B', sort: false, render: (r) => movesCell(r.b, r.a), csv: (r) => r.b && movesText(r.b) },
      { key: 'captain', label: 'Captain A / B', sort: false, render: (r) => h('div.df-pair', null, pairCell(r.a?.captain, r.b?.captain)), csv: (r) => `${r.a?.captain ?? ''} / ${r.b?.captain ?? ''}` },
      { key: 'chip', label: 'Chip A / B', sort: false, render: (r) => h('div.df-pair', null, pairCell(r.a && (r.a.chip || ''), r.b && (r.b.chip || ''), (c) => chipName(c) || 'none')), csv: (r) => `${r.a?.chip ?? ''} / ${r.b?.chip ?? ''}` },
      { key: 'pred_a', label: 'Pred A', num: true, sort: (r) => r.a?.pred, render: (r) => fmt.pts(r.a?.pred), csv: (r) => r.a?.pred },
      { key: 'pred_b', label: 'Pred B', num: true, sort: (r) => r.b?.pred, render: (r) => fmt.pts(r.b?.pred), csv: (r) => r.b?.pred },
      { key: 'd_pred', label: 'Δ pred', num: true, title: 'B − A', render: (r) => h('span', { class: tone(r.d_pred) }, fmt.signed(r.d_pred, 2)) },
      { key: 'd_act', label: 'Δ act', num: true, title: 'B − A, played rounds only', render: (r) => h('span', { class: tone(r.d_act) }, fmt.signed(r.d_act, 0)) },
    ],
    rows, sortKey: 'gw', sortDir: 'asc', dense: true, stickyFirst: true, maxHeight: 520, csv: 'diff.csv',
    rowClass: (r) => (!r.a || !r.b ? 'df-one' : r.same === false ? 'df-row' : null), caption: 'Per-GW differences',
  });
  const only = h('input', {
    type: 'checkbox',
    onChange: () => { onlyDiff = only.checked; tbl.update(onlyDiff ? rows.filter((r) => r.same !== true) : rows); },
  });
  return card({
    title: 'Compare two solves', sub: 'B minus A, per gameweek of each run\'s committed rounds and plan', className: 'rs-detail', id: 'run-detail',
    actions: [
      h('label.check', null, only, 'Differences only'),
      h('button.btn.sm', { type: 'button', onClick: swap }, icon('swap', { size: 14 }), 'Swap'),
      h('button.icon-btn', { type: 'button', title: 'Close', 'aria-label': 'Close comparison', onClick: close }, icon('close')),
    ],
    body: [
      h('div.grid-2.df-heads', null, sideHead('a', d.a), sideHead('b', d.b)),
      settingsDiff(d.a?.argv, d.b?.argv),
      h('div.grid-4', null,
        statTile({ label: 'Pred A', value: fmt.pts(T.a_pred), sub: `${T.n_common ?? 0} common GWs` }),
        statTile({ label: 'Pred B', value: fmt.pts(T.b_pred), sub: dPred == null ? null : `${fmt.signed(dPred, 2)} vs A`, tone: tone(dPred) }),
        statTile({ label: 'Actual B − A', value: dAct == null ? fmt.dash : fmt.signed(dAct, 0), tone: tone(dAct), sub: dAct == null ? 'no played rounds in common' : `${fmt.int(T.a_act)} vs ${fmt.int(T.b_act)}` }),
        statTile({ label: 'GWs that differ', value: `${T.n_different ?? 0} / ${T.n_common ?? 0}`, sub: 'moves, captain or chip', tone: T.n_different ? 'warn' : null })),
      tbl,
    ],
  });
}

// ---------------------------------------------------------------- view

const isComparable = (j) => RESULT_KINDS.has(j.kind) && j.status === 'done';

export default {
  route: 'runs',
  title: 'Runs',
  icon: 'runs',
  mount(el, ctx) {
    let jobs = [];
    let loaded = false;
    let listErr = null;
    let openId = null;
    let detailParams = {};  // the open detail in the URL: {job} or {diff}
    let alive = true;
    let seq = 0;
    // src: '' = the Studio's own runs (Forkcast's phone solves hidden), 'phone', or 'all'
    const filt = { kind: ctx.params.kind || '', status: ctx.params.status || '', q: ctx.params.q || '', src: ctx.params.src || '' };
    const picked = new Set();

    const syncParams = (detail = detailParams) => {
      detailParams = detail;
      const p = { kind: filt.kind, status: filt.status, q: filt.q, src: filt.src, ...detail };
      ctx.setParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v)));
    };

    // -- filters
    const kindSel = h('select.select', { 'aria-label': 'Kind', onChange: () => { filt.kind = kindSel.value; syncParams(); paint(); } });
    const statusSel = h('select.select', { 'aria-label': 'Status', onChange: () => { filt.status = statusSel.value; syncParams(); paint(); } },
      h('option', { value: '' }, 'Any status'), STATUSES.map(([v, l]) => h('option', { value: v }, l)));
    statusSel.value = filt.status;
    const srcSel = h('select.select', { 'aria-label': 'Source', onChange: () => { filt.src = srcSel.value; syncParams(); paint(); } },
      [['', 'Studio runs'], ['phone', 'Phone runs'], ['all', 'All sources']].map(([v, l]) => h('option', { value: v }, l)));
    srcSel.value = filt.src;
    let qT = 0;
    const search = h('input.input', { type: 'search', placeholder: 'Search label, flags, id', value: filt.q, 'aria-label': 'Search runs' });
    search.addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { filt.q = search.value.trim(); syncParams(); paint(); }, 150); });
    const refreshBtn = h('button.btn.sm.ghost', { type: 'button', onClick: api.jobsChanged }, icon('reset', { size: 14 }), 'Refresh');

    // -- compare bar
    const cmpText = h('span.small');
    const cmpBtn = h('button.btn.sm.primary', { type: 'button', disabled: true, onClick: () => { const [a, b] = orderPicked(); openDiff(a, b); } }, icon('compare', { size: 14 }), 'Compare');
    const cmpClear = h('button.btn.sm.ghost', { type: 'button', onClick: () => { picked.clear(); paint(); } }, 'Clear');
    const cmpBar = h('div.rs-cmpbar', null, icon('compare', { size: 16 }), cmpText, h('span.spacer'), cmpClear, cmpBtn);

    const pickBox = (j) => {
      if (!isComparable(j)) return null;
      const box = h('input', {
        type: 'checkbox', checked: picked.has(j.id), 'aria-label': `Select ${j.label || j.id} to compare`,
        onChange: () => {
          if (box.checked) {
            picked.add(j.id);
            if (picked.size > 2) picked.delete(picked.values().next().value);  // keep the latest two
          } else picked.delete(j.id);
          paint();
        },
      });
      return box;
    };

    const tbl = table({
      columns: [
        { key: '_pick', label: '', sort: false, csv: false, width: 34, render: pickBox },
        { key: 'created', label: 'Created', fmt: (v) => h('span.nowrap', { title: fmt.ago(v) }, fmt.date(v)), csv: (j) => new Date(toMs(j.created)).toISOString() },
        { key: 'kind', label: 'Kind', render: (j) => pill(j.kind, KIND_TONE[j.kind] || '') },
        { key: 'label', label: 'Label', render: (j) => h('span.rs-label', { title: j.label }, j.label || j.id) },
        { key: 'status', label: 'Status', render: (j) => jobStatusPill(j.status) },
        { key: 'elapsed', label: 'Elapsed', num: true, fmt: (v) => fmt.dur(v) },
        { key: '_summary', label: 'Summary', sort: false, render: (j) => h('span.rs-sum', { class: { loss: j.status === 'error' }, title: summaryText(j) }, summaryText(j)), csv: summaryText },
        { key: '_del', label: '', sort: false, csv: false, width: 40, render: (j) => h('button.icon-btn', { type: 'button', title: 'Delete', 'aria-label': `Delete ${j.label || j.id}`, onClick: () => deleteJobFlow(j).then((ok) => { if (ok && j.id === openId) closeDetail(); }) }, icon('trash', { size: 15 })) },
      ],
      rows: [], sortKey: 'created', sortDir: 'desc', maxHeight: 460, csv: 'runs.csv', caption: 'Runs',
      empty: 'No runs match these filters.', onRow: (j) => openJob(j.id), rowClass: (j) => j.id === openId && 'is-selected',
    });
    const listBox = h('div.stack.tight', null, loading('Loading runs…'));
    const listCard = card({
      title: 'All runs', sub: 'Newest first. Click a run for its command, log and result; tick two solve results to compare them.',
      actions: refreshBtn,
      body: [h('div.rs-filters', null, kindSel, statusSel, srcSel, h('div.search-box', null, icon('search', { size: 16 }), search)), cmpBar, listBox],
    });
    const detail = h('div.rs-detail-host');
    el.append(listCard, detail);

    function orderPicked() {
      const byId = new Map(jobs.map((j) => [j.id, j]));
      return [...picked].sort((a, b) => (toMs(byId.get(a)?.created) || 0) - (toMs(byId.get(b)?.created) || 0));
    }

    const matches = (j) => {
      if (filt.src !== 'all' && api.isPhone(j) !== (filt.src === 'phone')) return false;
      if (filt.kind && j.kind !== filt.kind) return false;
      if (filt.status && (filt.status === 'active' ? !api.isActive(j) : j.status !== filt.status)) return false;
      if (!filt.q) return true;
      const hay = norm([j.label, j.id, j.kind, ...(j.argv || []), summaryText(j)].join(' '));
      return norm(filt.q).split(/\s+/).every((t) => hay.includes(t));
    };

    function paint() {
      const counts = Object.fromEntries(KINDS.map((k) => [k, jobs.filter((j) => j.kind === k).length]));
      const kinds = [...new Set([...KINDS, ...jobs.map((j) => j.kind)])];
      fill(kindSel, h('option', { value: '' }, `All kinds (${jobs.length})`),
        kinds.map((k) => h('option', { value: k }, `${k} (${counts[k] ?? jobs.filter((j) => j.kind === k).length})`)));
      kindSel.value = filt.kind;
      for (const id of [...picked]) if (loaded && !jobs.some((j) => j.id === id && isComparable(j))) picked.delete(id);
      cmpText.textContent = picked.size === 2 ? 'Two runs selected' : picked.size === 1 ? 'Pick one more solve or backtest result' : 'Tick two solve or backtest results to compare them per gameweek';
      cmpBtn.disabled = picked.size !== 2;
      cmpClear.hidden = !picked.size;
      if (listErr && !loaded) return listBox.replaceChildren(errorCard(listErr, { title: 'Runs could not be listed', retry: api.jobsChanged }));
      if (!loaded) return;
      const rows = jobs.filter(matches);
      tbl.update(rows);
      fill(listBox,
        listErr ? h('div.callout.warn', null, icon('warn'), `Not refreshed: ${listErr.message}`) : null,
        jobs.length ? tbl : empty('No runs yet. Solves, backtests, previews and data jobs appear here.', h('a.btn.primary', { href: '#/planner' }, 'Open the Planner')));
      const active = jobs.filter(api.isActive).length;
      ctx.setTitle(`${jobs.length} run${jobs.length === 1 ? '' : 's'}${active ? ` · ${active} active` : ''}`);
    }


    function closeDetail() {
      seq++;
      openId = null;
      detail.replaceChildren();
      syncParams({});
      paint();
    }

    function show(node, scroll = true) {
      detail.replaceChildren(node);
      if (scroll) requestAnimationFrame(() => detail.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }

    async function openJob(id, { scroll = true } = {}) {
      const my = ++seq;
      openId = id;
      syncParams({ job: id });
      paint();
      detail.replaceChildren(card({ body: loading('Loading run…'), className: 'rs-detail' }));
      try {
        const info = await api.getJob(id);
        if (my !== seq || !alive) return;
        const job = info?.job ?? info;
        show(detailCard(job, info?.result ?? null, { reopen: openJob, close: closeDetail }), scroll);
      } catch (e) {
        if (my !== seq || !alive) return;
        show(errorCard(e, { title: e.status === 404 ? 'This run no longer exists' : 'This run could not be loaded', retry: e.status === 404 ? null : () => openJob(id) }));
      }
    }

    async function openDiff(a, b) {
      const my = ++seq;
      openId = null;
      picked.clear();
      picked.add(a);
      if (b) picked.add(b);
      syncParams({ diff: [a, b].filter(Boolean).join(',') });
      paint();
      if (!b) {
        detail.replaceChildren(h('div.callout.info', null, icon('info'), 'Tick a second solve or backtest result above to compare it with the selected one.'));
        return;
      }
      detail.replaceChildren(card({ body: loading('Comparing…'), className: 'rs-detail' }));
      try {
        const d = await api.diffJobs(a, b);
        if (my !== seq || !alive) return;
        show(diffCard(d, { swap: () => openDiff(b, a), close: closeDetail }));
      } catch (e) {
        if (my !== seq || !alive) return;
        show(errorCard(e, { title: 'These runs could not be compared', retry: () => openDiff(a, b) }));
      }
    }

    // The header polls the job list while jobs run and after every change (api.watchJobs).
    const unwatch = api.watchJobs((list) => { jobs = list; loaded = true; listErr = null; paint(); },
      (e) => { listErr = e; paint(); });
    const [da, db] = (ctx.params.diff || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (da) openDiff(da, db);
    else if (ctx.params.job) openJob(ctx.params.job);

    return () => {
      alive = false;
      clearTimeout(qT);
      unwatch();
    };
  },
};
