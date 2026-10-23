// Backtests: replay a season round by round as a 'backtest' job (tap/solve_tap.py), then totals,
// cumulative pred vs actual, rank by GW and the per-GW committed table. Past backtests overlay on
// one chart; the canonical benchmark tables come from ml/solver/sweeps/canonical_results.md (api/jobs.py).

import * as api from '../api.js';
import { enc } from '../api.js';
import {
  h, card, table, lineChart, segmented, flagControl, field, jobRunner, jobStatusPill, toast,
  copyText, fmt, icon, empty, loading, toMs, fill, fin, pick, errText, errorCallout, extraFlagsButton,
} from '../ui.js';
import {
  spanText, committedCells, cellsTable, cumulative, rankChart, resultTiles, warningsBlock, errorBlock, cmdBlock, logBlock, parseRank,
} from './runs.js';

const FORM_KEY = 'backtests:form';  // in-memory store key: kept while the tab is open
const CHIP_KEYS = ['wc', 'fh', 'bb', 'tc'];
const MODE_KEYS = ['plan', 'chip_auto', 'no_chips', ...CHIP_KEYS];
const OWN = new Set(['season', 'from_r', 'to', 'dir', ...MODE_KEYS]);  // the form's own fields; the rest live in "Extra flags"
const MODES = [
  { key: 'default', label: 'Season default' },
  { key: 'plan', label: 'Named plan' },
  { key: 'auto', label: 'Auto' },
  { key: 'none', label: 'No chips' },
  { key: 'manual', label: 'Manual' },
];
const METRICS = [{ key: 'act', label: 'Actual' }, { key: 'pred', label: 'Predicted' }, { key: 'rank', label: 'Rank' }];
const MAX_OVERLAY = 8;  // chart palette --s1…--s8

const gwSpan = (from, to) => `GW${from ?? 1}–${to ?? 'end'}`;

function modeOf(v) {
  if (v.plan) return 'plan';
  if (v.chip_auto) return 'auto';
  if (v.no_chips) return 'none';
  return CHIP_KEYS.some((k) => v[k] != null) ? 'manual' : 'default';
}

/** {wc: ['4','32'] | '4,32' | [4, 32], …} (CHIP_DEFAULTS, canonical plans, form values) → "WC 4, 32 · BB 5, 33". */
function chipsText(chips) {
  const parts = CHIP_KEYS.map((k) => {
    const v = chips?.[k];
    const rounds = (Array.isArray(v) ? v : String(v ?? '').split(/[\s,]+/)).map(String).filter((r) => +r > 0);  // round 0 = unused
    return rounds.length ? `${k.toUpperCase()} ${rounds.join(', ')}` : null;
  }).filter(Boolean);
  return parts.length ? parts.join(' · ') : 'no chips';
}

/** summary.chips {gw: 'wc'} → "WC 4 · BB 5" in GW order. */
const playedChips = (chips) => Object.entries(chips || {}).sort((a, b) => a[0] - b[0]).map(([gw, c]) => `${String(c).toUpperCase()} ${gw}`).join(' · ');

/** Progress of a running backtest from its log: the committed table prints one row per solved round
 * under "COMMITTED (rounds a-b)" (solver/data_io/results.py ResultsTable.row). */
function progressOf(log) {
  const i = log.lastIndexOf('COMMITTED (rounds ');
  if (i < 0) return null;
  const [head, ...lines] = log.slice(i).split('\n');
  const m = /\(rounds (\d+)-(\d+)\)/.exec(head);
  if (!m) return null;
  const a = +m[1], b = +m[2];
  let last = null;
  for (const line of lines) {
    if (line.startsWith('TOTAL:')) break;
    const r = /^\s+(\d+)\s/.exec(line);
    if (r && +r[1] >= a && +r[1] <= b && (last == null || +r[1] > last)) last = +r[1];
  }
  return { a, b, last };
}

function progressView() {
  const bar = h('progress.bt-bar', { 'aria-label': 'Backtest progress' });
  const txt = h('span.small.muted', null, 'Loading predictions and τ before the first round…');
  const el = h('div.bt-progress', null, bar, txt);
  el.update = (log) => {
    const p = progressOf(log || '');
    if (!p) return;
    const n = p.b - p.a + 1, done = p.last == null ? 0 : p.last - p.a + 1;
    bar.max = n;
    bar.value = done;
    txt.textContent = p.last == null ? `Solving GW${p.a}…` : `GW${p.last} solved · ${done} of ${n} rounds (GW${p.a}–${p.b})`;
  };
  return el;
}

export default {
  route: 'backtests',
  title: 'Backtests',
  icon: 'backtests',
  mount(el, ctx) {
    let alive = true;
    let meta = null, F = {}, flagsData = null;
    let form = null;          // {values, mode, label}
    let shownId = null;       // the job in the result card
    let resSeq = 0;
    let past = null;          // GET /api/backtests
    let pastTimer = 0, pvTimer = 0, pvSeq = 0, ovSeq = 0;
    let metric = 'act';
    const ticked = new Set((ctx.params.cmp || '').split(',').map((s) => s.trim()).filter(Boolean));
    const resultCache = new Map();

    const formCard = card({ title: 'New backtest', sub: 'Replay a season round by round with any solver settings', body: loading(), className: 'bt-form' });
    const resCard = card({ title: 'Result', body: empty('Run a backtest, or pick one under Past backtests.'), className: 'bt-result' });
    const overlayBox = h('div.bt-overlay');
    const pastBox = h('div', null, loading('Loading backtests…'));
    const metricSeg = segmented({ items: METRICS, value: metric, label: 'Overlay metric', onChange: (k) => { metric = k; paintOverlay(); } });
    const pastCard = card({
      title: 'Past backtests', sub: `Click a run to open it; tick up to ${MAX_OVERLAY} to overlay their cumulative points`,
      actions: h('button.btn.sm.ghost', { type: 'button', onClick: () => loadPast() }, icon('reset', { size: 14 }), 'Refresh'),
      body: [pastBox, h('div.row.bt-overlay-head', null, h('h3.rs-h', null, 'Overlay'), h('span.spacer'), metricSeg), overlayBox],
    });
    const canonCard = card({ title: 'Canonical results', sub: "Benchmark tables recorded in the solver's sweeps notes", body: loading() });
    el.append(h('div.split.bt-top', null, formCard, resCard), pastCard, canonCard);

    // ------------------------------------------------------------ form

    const save = () => ctx.state.set(FORM_KEY, { ...form, values: { ...form.values } });
    const values = () => Object.fromEntries(Object.entries(form.values).filter(([, v]) => v !== undefined));
    const plansFor = (season) => meta?.canonical_plans?.[season] || [];
    const extraKeys = () => Object.keys(form.values).filter((k) => !OWN.has(k));

    function autoLabel() {
      const v = form.values;
      const chips = { default: 'default chips', auto: 'chip-auto', none: 'no chips', plan: `plan ${v.plan || '?'}`, manual: chipsText(pick(v, CHIP_KEYS)) }[form.mode];
      const n = extraKeys().length;
      return [`Backtest ${v.season} ${gwSpan(v.from_r, v.to)}`, chips, v.dir, n && `+${n} flag${n > 1 ? 's' : ''}`].filter(Boolean).join(' · ');
    }

    // Parts of the form repainted on change (the rest is built once by renderForm).
    let modeBox, toHint, extraBtn, labelInput, cmdCode, cmdWarn, runBtn;

    function setVal(k, v) {
      if (v === undefined) delete form.values[k];
      else form.values[k] = v;
      save();
      onChanged();
    }

    function onChanged() {
      labelInput.placeholder = autoLabel();
      clearTimeout(pvTimer);
      pvTimer = setTimeout(preview, 250);
    }

    /** POST /api/flags/argv → {cmd, errors (the solver would stop), warnings}; painted under the command. */
    async function preview() {
      const my = ++pvSeq;
      try {
        const r = await api.buildArgv(values());
        if (my !== pvSeq || !alive) return r;
        cmdCode.textContent = r?.cmd || '';
        cmdWarn.replaceChildren(...(r?.errors || []).map((e) => h('li.loss', null, e)), ...(r?.warnings || []).map((w) => h('li', null, w)));
        return r;
      } catch (e) {
        if (my !== pvSeq || !alive) return null;
        cmdCode.textContent = '';
        cmdWarn.replaceChildren(h('li.loss', null, errText(e)));
        return { errors: [e.message] };
      }
    }

    function setMode(m) {
      form.mode = m;
      for (const k of MODE_KEYS) delete form.values[k];
      if (m === 'auto') form.values.chip_auto = true;
      if (m === 'none') form.values.no_chips = true;
      if (m === 'plan') form.values.plan = plansFor(form.values.season)[0]?.tag;
      save();
      paintMode();
      onChanged();
    }

    function paintMode() {
      const { season } = form.values;
      // main.py: before 2025 only the last FH/BB/TC round given is played (one of each chip)
      const early = season < 2025 && form.mode !== 'none' && form.mode !== 'auto'
        ? h('p.small.muted', null, `In ${season} only the last Free Hit, Bench Boost and Triple Captain round given is played.`) : null;
      const defaults = meta.chip_defaults?.[season];
      const defText = defaults ? `${season} defaults: ${chipsText(defaults)}` : `No default chip rounds for ${season}: no chips are played.`;
      let body;
      if (form.mode === 'default') body = h('p.small', null, defText);
      else if (form.mode === 'plan') {
        const plans = plansFor(season);
        if (!plans.length) {
          if (form.values.plan) setVal('plan', undefined);
          body = h('p.small.warn', null, `No named plans for ${season}. Pick another chip strategy.`);
        } else {
          const desc = h('p.small.muted');
          const sel = h('select.select', { onChange: () => { setVal('plan', sel.value); desc.textContent = chipsText(plans.find((p) => p.tag === sel.value)?.chips); } },
            plans.map((p) => h('option', { value: p.tag }, p.tag)));
          if (!plans.some((p) => p.tag === form.values.plan)) setVal('plan', plans[0].tag);
          sel.value = form.values.plan;
          desc.textContent = chipsText(plans.find((p) => p.tag === sel.value)?.chips);
          body = [field('Plan', sel, F.plan?.help), desc];
        }
      } else if (form.mode === 'auto') body = h('p.small.muted', null, F.chip_auto?.help || 'The solver picks the chip rounds as the season goes.');
      else if (form.mode === 'none') body = h('p.small.muted', null, F.no_chips?.help || 'Play no chips.');
      else {
        body = [
          h('div.grid-2.bt-chips', null, CHIP_KEYS.filter((k) => F[k]).map((k) => flagControl(F[k], form.values[k], (v) => setVal(k, v), { meta }))),
          // main.py fills each chip left blank from CHIP_DEFAULTS
          h('p.small.muted', null, `A chip left blank keeps its season default. ${defText}`),
        ];
      }
      fill(modeBox, body, early);
    }

    function paintTo() {
      const { season } = form.values;
      // main.py: no --to ends at the next deadline (live season) or the season's last round
      toHint.textContent = season === meta.season && meta.next_gw
        ? `Blank = up to GW${meta.next_gw}, the next deadline (not played yet: no actual points).`
        : 'Blank = the last round of the season.';
    }

    async function run() {
      const v = values();
      if (fin(v.to) && +v.to < +(v.from_r ?? 1)) return toast('The last gameweek is before the first.', 'warn');
      if (form.mode === 'plan' && !v.plan) return toast(`There is no named plan for ${v.season}.`, 'warn');
      runBtn.disabled = true;
      try {
        clearTimeout(pvTimer);
        const check = await preview();
        if (check?.errors?.length) return toast(`Fix this first: ${check.errors[0]}`, 'error');
        const out = await api.createJob({ kind: 'backtest', values: v, label: labelInput.value.trim() || autoLabel() });
        const job = out?.job ?? out;
        toast('Backtest started', 'ok', { timeout: 2500 });
        showJob(job);
        loadPast();
      } catch (e) {
        toast(errText(e), 'error');
      } finally {
        runBtn.disabled = false;
      }
    }

    function renderForm() {
      const v = form.values;
      const seasons = (meta.seasons || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
      const seasonSel = h('select.select', {
        onChange: () => { setVal('season', Number(seasonSel.value)); paintMode(); paintTo(); },
      }, seasons.map((s) => h('option', { value: s }, s === meta.season ? `${s} (live)` : String(s))));
      seasonSel.value = String(v.season);
      modeBox = h('div.bt-mode');
      toHint = h('span.field-hint');
      extraBtn = extraFlagsButton({
        flags: flagsData?.flags, groups: flagsData?.groups, meta, values: form.values, own: OWN,
        onChange: () => { save(); onChanged(); },
      });
      labelInput = h('input.input', { type: 'text', value: form.label || '', placeholder: '', 'aria-label': 'Label' });
      labelInput.addEventListener('input', () => { form.label = labelInput.value; save(); });
      cmdCode = h('code.mono');
      cmdWarn = h('ul.rs-notes.small.warn');
      runBtn = h('button.btn.primary.lg.bt-run', { type: 'button', onClick: run }, icon('play', { size: 16 }), 'Run backtest');
      const ctl = (dest) => (F[dest] ? flagControl(F[dest], v[dest], (x) => setVal(dest, x), { meta }) : null);
      formCard.setBody(h('div.stack.bt-fields', null,
        field('Season', seasonSel),
        h('div.grid-2.bt-range', null, ctl('from_r'), ctl('to')),
        toHint,
        h('div.field', null, h('span.field-label', null, 'Chips'),
          segmented({ items: MODES, value: form.mode, label: 'Chip strategy', onChange: setMode }), modeBox),
        ctl('dir'),
        h('div.row', null, extraBtn, h('span.small.muted', null, 'Any other solver flag')),
        field('Label', labelInput),
        h('div.bt-cmd', null,
          h('div.row', null, h('span.field-label', null, 'Command'), h('span.spacer'),
            h('button.icon-btn', { type: 'button', title: 'Copy command', 'aria-label': 'Copy command', onClick: () => cmdCode.textContent && copyText(cmdCode.textContent) }, icon('copy', { size: 14 }))),
          cmdCode, cmdWarn),
        runBtn));
      paintMode();
      paintTo();
      onChanged();
    }

    function loadIntoForm(vals) {
      form = { values: { ...vals }, mode: modeOf(vals), label: '' };
      if (!(meta.seasons || []).includes(form.values.season)) form.values.season = meta.season;
      save();
      renderForm();
      toast('Settings loaded into the form', 'ok', { timeout: 2000 });
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function initForm() {
      formCard.setBody(loading());
      try {
        const [m, fl] = await Promise.all([api.getMeta(), api.getFlags().catch((e) => ({ error: e }))]);
        if (!alive) return;
        meta = m || {};
        flagsData = fl?.error ? null : fl;
        F = Object.fromEntries((flagsData?.flags || []).map((f) => [f.dest, f]));
        const seasons = (meta.seasons || []).map(Number);
        const finished = seasons.filter((s) => s < meta.season).sort((a, b) => a - b);
        const saved = ctx.state.get(FORM_KEY);
        form = saved && seasons.includes(saved.values?.season)
          ? { ...saved, values: { ...saved.values } }
          : { values: { season: finished.at(-1) ?? meta.season ?? seasons.at(-1) }, mode: 'default', label: '' };
        renderForm();
        if (fl?.error) formCard.bodyEl.prepend(errorCallout(fl.error, { retry: initForm }));
      } catch (e) {
        if (alive) formCard.setBody(errorCallout(e, { retry: initForm }));
      }
    }

    // ------------------------------------------------------------ one backtest

    function resultView(job, result) {
      const s = job.summary || {};
      const head = h('div.bt-head', null,
        h('div.stack.tight', null,
          h('strong.bt-title', null, job.label || job.id),
          h('span.small.muted', null, [s.season ?? job.values?.season, spanText(s), playedChips(s.chips), `${fmt.ago(job.created)}`].filter(Boolean).join(' · '))),
        h('span.spacer'),
        jobStatusPill(job.status),
        job.values ? h('button.btn.sm', { type: 'button', title: 'Put these settings in the form', onClick: () => loadIntoForm(job.values) }, icon('reset', { size: 14 }), 'Load settings') : null,
        h('a.btn.sm.ghost', { href: `#/runs?job=${enc(job.id)}` }, 'Open in Runs'));
      if (!committedCells(result).cells.length) {  // no result, or it failed before the first round
        return [head, cmdBlock(job, { ran: false }), errorBlock(job, result) || empty('This backtest left no result.'),
          warningsBlock(result), logBlock(job, { open: job.status === 'error' && !result?.traceback })];
      }
      const c = cumulative(result);
      return [
        head,
        cmdBlock(job, { ran: false }),
        errorBlock(job, result),
        resultTiles(job, result),
        h('div.bt-chart', null, h('h3.rs-h', null, 'Cumulative points'), lineChart({
          series: [{ name: 'Predicted', points: c.pred, dashed: true }, { name: 'Actual', points: c.act }],
          xFmt: (x) => `GW${x}`, yLabel: 'Points', height: 260,
        })),
        c.rank.some(([, r]) => r) ? h('div.bt-chart', null, h('h3.rs-h', null, 'Overall rank by GW'), rankChart([{ name: 'Rank', points: c.rank }])) : null,
        h('h3.rs-h', null, 'Per gameweek'),
        cellsTable(result, { csv: `backtest_${job.id}.csv`, maxHeight: 520 }),
        warningsBlock(result),
        logBlock(job),
      ];
    }

    async function showJob(jobOrId, { scroll = true } = {}) {
      const id = typeof jobOrId === 'object' ? jobOrId.id : jobOrId;
      const my = ++resSeq;
      shownId = id;
      ctx.setParams({ ...ctx.params, job: id });
      paintPast();
      resCard.setBody(loading('Loading backtest…'));
      if (scroll && matchMedia('(max-width: 1100px)').matches) resCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      let info;
      try {
        info = typeof jobOrId === 'object' && api.isActive(jobOrId) ? { job: jobOrId, result: null } : await api.getJob(id);
      } catch (e) {
        if (my === resSeq && alive) resCard.setBody(errorCallout(e, { retry: e.status === 404 ? null : () => showJob(id) }));
        return;
      }
      if (my !== resSeq || !alive) return;
      const job = info?.job ?? info;
      const result = info?.result ?? null;
      if (api.isActive(job)) {
        const prog = progressView();
        resCard.setBody(prog, jobRunner({
          job, title: job.label,
          onUpdate: (t) => prog.update(t.log),
          onDone: () => { resultCache.delete(id); loadPast(); if (my === resSeq && alive) showJob(id, { scroll: false }); },
        }));
        return;
      }
      if (result) resultCache.set(id, Promise.resolve(result));
      resCard.setBody(resultView(job, result));
    }

    // ------------------------------------------------------------ past backtests & overlay

    const loadResult = (id) => {
      if (!resultCache.has(id)) {
        resultCache.set(id, api.getJob(id).then((d) => d?.result ?? null).catch((e) => { resultCache.delete(id); throw e; }));
      }
      return resultCache.get(id);
    };

    function tickBox(r) {
      if (r.status !== 'done') return null;
      const box = h('input', {
        type: 'checkbox', checked: ticked.has(r.id), 'aria-label': `Overlay ${r.label || r.id}`,
        onChange: () => {
          if (box.checked) {
            ticked.add(r.id);
            if (ticked.size > MAX_OVERLAY) {
              ticked.delete(ticked.values().next().value);
              toast(`Up to ${MAX_OVERLAY} runs overlay at once: the first ticked was dropped.`, 'info');
              paintPast();
            }
          } else ticked.delete(r.id);
          paintOverlay();
        },
      });
      return box;
    }

    const S = (r) => r.summary || {};
    const pastTbl = table({
      columns: [
        { key: '_tick', label: '', sort: false, csv: false, width: 34, render: tickBox },
        { key: 'created', label: 'Created', fmt: (v) => h('span.nowrap', { title: fmt.ago(v) }, fmt.date(v)), csv: (r) => new Date(toMs(r.created)).toISOString() },
        { key: 'label', label: 'Label', render: (r) => h('span.rs-label', { title: r.label }, r.label || r.id) },
        { key: 'season', label: 'Season', sort: (r) => S(r).season, render: (r) => S(r).season ?? fmt.dash, csv: (r) => S(r).season },
        { key: 'gws', label: 'GWs', sort: (r) => S(r).from, render: (r) => spanText(S(r)) || fmt.dash, csv: (r) => spanText(S(r)) },
        { key: 'status', label: 'Status', render: (r) => jobStatusPill(r.status) },
        { key: 'pred', label: 'Pred', num: true, sort: (r) => S(r).total_pred, render: (r) => fmt.pts(S(r).total_pred), csv: (r) => S(r).total_pred },
        { key: 'act', label: 'Actual', num: true, sort: (r) => S(r).total_act, render: (r) => fmt.int(S(r).total_act), csv: (r) => S(r).total_act },
        { key: 'rank', label: 'Rank', num: true, sort: (r) => parseRank(S(r).rank), render: (r) => S(r).rank || fmt.dash, csv: (r) => S(r).rank },
        { key: 'hits', label: 'Hits', num: true, sort: (r) => S(r).hits, render: (r) => fmt.int(S(r).hits), csv: (r) => S(r).hits },
        { key: 'chips', label: 'Chips', sort: false, render: (r) => h('span.small', null, playedChips(S(r).chips) || fmt.dash), csv: (r) => playedChips(S(r).chips) },
        { key: 'elapsed', label: 'Took', num: true, fmt: (v) => fmt.dur(v) },
      ],
      rows: [], sortKey: 'created', sortDir: 'desc', maxHeight: 380, csv: 'backtests.csv', caption: 'Past backtests',
      empty: 'No backtests yet.', onRow: (r) => showJob(r.id), rowClass: (r) => r.id === shownId && 'is-selected',
    });

    /** → true when ticked runs were dropped (deleted or no longer done). */
    function paintPast() {
      if (!past) return false;
      const runs = past.runs || [];
      const n = ticked.size;
      for (const id of [...ticked]) if (!runs.some((r) => r.id === id && r.status === 'done')) ticked.delete(id);
      pastTbl.update(runs);
      if (!pastTbl.isConnected) pastBox.replaceChildren(pastTbl);
      return ticked.size !== n;
    }

    async function paintOverlay() {
      const ids = [...ticked];
      ctx.setParams({ ...ctx.params, cmp: ids.join(',') || undefined });
      if (!ids.length) return overlayBox.replaceChildren(empty('Tick backtests in the table above to overlay them here.'));
      const my = ++ovSeq;
      overlayBox.replaceChildren(loading('Loading results…'));
      const got = await Promise.allSettled(ids.map(loadResult));
      if (my !== ovSeq || !alive) return;
      const byId = new Map((past?.runs || []).map((r) => [r.id, r]));
      const seen = new Set();
      const series = [], missing = [];
      ids.forEach((id, i) => {
        const res = got[i].status === 'fulfilled' ? got[i].value : null;
        if (!res) return missing.push(byId.get(id)?.label || id);
        let name = byId.get(id)?.label || id;
        if (name.length > 44) name = `${name.slice(0, 43)}…`;
        if (seen.has(name)) name = `${name} (${id.slice(-4)})`;
        seen.add(name);
        series.push({ name, points: cumulative(res)[metric] });
      });
      const chart = metric === 'rank'
        ? rankChart(series, { height: 280, labels: false })
        : lineChart({ series, xFmt: (x) => `GW${x}`, yLabel: metric === 'act' ? 'Cumulative actual points' : 'Cumulative predicted points', height: 300, labels: false });
      fill(overlayBox, series.length ? chart : empty('None of the ticked runs has a result.'),
        missing.length ? h('p.small.warn', null, `No result for: ${missing.join(', ')}`) : null);
    }

    function canonTable(t) {
      const slug = String(t.heading || t.section || 'canonical').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
      return table({ columns: (t.columns || []).map((c) => ({ key: c, label: c })), rows: t.rows || [], csv: `${slug}.csv`, dense: true, stickyFirst: true, caption: t.heading || t.section });
    }

    let canonKey = null;
    function paintCanon() {
      const tables = past?.canonical || [];
      const src = past?.canonical_source;
      const key = `${src?.mtime_epoch}:${tables.length}`;
      if (key === canonKey) return;  // unchanged: keep the open tables as they are
      canonKey = key;
      if (!tables.length) return canonCard.setBody(empty('No canonical results file (ml/solver/sweeps/canonical_results.md).'));
      const sections = new Map();
      for (const t of tables) {
        if (!sections.has(t.section)) sections.set(t.section, []);
        sections.get(t.section).push(t);
      }
      let first = true;
      canonCard.setBody(
        src ? h('div.callout.info', null, icon('info'), h('div', null,
          src.note ? h('p', null, src.note) : null,
          h('p.small.muted', null, [src.path, src.mtime_epoch && `updated ${fmt.date(src.mtime_epoch)}`].filter(Boolean).join(' · ')))) : null,
        [...sections].map(([section, ts]) => h('section.bt-canon', null,
          h('h3.rs-h', null, section || 'Results'),
          ts.map((t) => {
            const d = h('details.bt-canon-t', { open: first }, h('summary', null, t.heading || (t.columns || []).join(' · ') || 'Table', ' ', h('span.badge', null, (t.rows || []).length)));
            const fill = () => { if (d.open && d.childElementCount < 2) d.append(canonTable(t)); };
            d.addEventListener('toggle', fill);
            fill();
            first = false;
            return d;
          }))));
    }

    async function loadPast() {
      clearTimeout(pastTimer);
      try {
        past = await api.getBacktests();
      } catch (e) {
        if (!alive) return;
        if (!past) {
          pastBox.replaceChildren(errorCallout(e, { retry: loadPast }));
          canonCard.setBody(errorCallout(e, { retry: loadPast }));
          canonKey = null;
        } else toast(`Backtests not refreshed: ${e.message}`, 'warn');
        return;
      }
      if (!alive) return;
      const first = !overlayBox.hasChildNodes();
      if (paintPast() || first) paintOverlay();
      paintCanon();
      if ((past.runs || []).some(api.isActive)) pastTimer = setTimeout(loadPast, 5000);
    }

    const onJobs = () => { clearTimeout(pastTimer); pastTimer = setTimeout(loadPast, 300); };
    addEventListener('fss:jobs', onJobs);
    initForm();
    loadPast();
    if (ctx.params.job) showJob(ctx.params.job, { scroll: false });

    return () => {
      alive = false;
      clearTimeout(pastTimer);
      clearTimeout(pvTimer);
      removeEventListener('fss:jobs', onJobs);
    };
  },
};
