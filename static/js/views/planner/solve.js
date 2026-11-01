// Solver lab: solve, results and reattach, and scenarios (up to four variants side by side).

import * as api from '../../api.js';
import { h, toast, fmt, icon, fill, plural } from '../../ui.js';
import {
  card, statTile, modal, confirm, loading, empty, errorCard, copyText, pick, errText, callout,
} from '../../studio/kit.js';
import { flagControl, jobRunner, jobStatusPill, flagLabel } from '../../studio/flags.js';
import { spanText } from '../runs.js';
import { DATA_KEYS, KEEP, MAX_VARIANTS, hitCostOf, mergeValues, num, omit, rowTag, sum, timelineOf } from './model.js';
import { historyCard, pitchCard, recommendationCard, scenarioTable, timelineCard, warningsCard } from './cards.js';

export const solveMethods = {
  // ---- solve, results, reattach

  jobLabel(v) {
    const who = v.team_state ? 'edited squad' : v.entry ? `team ${v.entry}` : 'fresh build';
    const rounds = v.from_r ? `GW${v.from_r}${v.to ? `–${v.to}` : ''}` : 'season replay';
    const p = this.presets.find((x) => x.name === this.st.preset);
    return ['Planner', who, rounds, p && !this.presetModified(p) ? p.name : null].filter(Boolean).join(' · ');
  },

  /** Run fn unless a launch with the same key is still being created (double clicks, Try again, Run all). */
  async once(key, fn) {
    if (this.inflight.has(key)) return undefined;
    this.inflight.add(key);
    try { return await fn(); } finally { this.inflight.delete(key); }
  },

  solve() {
    if (this.argv?.errors?.length) { toast(this.argv.errors[0], 'error'); return undefined; }
    return this.once('solve', async () => {
      this.solveBtn.disabled = true;
      try {
        const { job } = await api.createJob({ kind: 'solve', values: { ...this.values }, label: this.jobLabel(this.values) });
        this.save({ lastJob: job.id });
        this.ctx.setParams({ ...this.ctx.params, job: job.id });
        this.showRunner(job);
        this.resultSlot.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        toast(errText(e), 'error');
      } finally {
        this.solveBtn.disabled = !!this.argv?.errors?.length;
      }
    });
  },

  showRunner(job) {
    const seq = ++this.jobSeq;
    const runner = jobRunner({
      job, title: job.label,
      onDone: ({ job: j, result }) => { if (seq === this.jobSeq) this.renderResult(j, result); },
    });
    fill(this.resultSlot, card({ title: 'Solving…', sub: 'The log streams below; results appear here when it finishes.', body: runner }));
  },

  async showJob(id, { fromUrl = false } = {}) {
    const seq = ++this.jobSeq;
    fill(this.resultSlot, loading('Loading the run…'));
    try {
      const { job, result } = await api.getJob(id);
      if (seq !== this.jobSeq || this.abort.signal.aborted) return;
      if (api.isActive(job)) this.showRunner(job);
      else this.renderResult(job, result);
    } catch (e) {
      if (seq !== this.jobSeq) return;
      if (e.status === 404 && !fromUrl) {
        if (this.st.lastJob === id) this.save({ lastJob: undefined });
        this.resultSlot.replaceChildren();
        return;
      }
      fill(this.resultSlot, errorCard(e, { title: `Run ${id} could not be loaded`, retry: () => this.showJob(id, { fromUrl }) }));
    }
  },

  renderResult(job, res) {
    const again = h('button.btn', { type: 'button', onClick: () => this.solve() }, icon('play', { size: 14 }), 'Solve again');
    if (!['solve', 'backtest'].includes(job.kind)) {
      fill(this.resultSlot, card({ title: job.label || job.id, body: [h('p', null, `This is a ${job.kind} job; open it in Runs.`), h('a.btn', { href: `#/runs?job=${encodeURIComponent(job.id)}` }, 'Open in Runs')] }));
      return;
    }
    const rows = res ? timelineOf(res) : [];
    if (job.status === 'cancelled' && !rows.length) {
      fill(this.resultSlot, card({ title: 'Solve cancelled', body: [h('p.muted', null, job.label), again] }));
      return;
    }
    if (!rows.length) {
      const err = { message: res?.error || job.error || 'The run left no plan.', detail: res?.traceback || res?.stdout_tail || '' };
      fill(this.resultSlot, errorCard(err, { title: 'The solve failed', retry: () => this.solve() }));
      return;
    }
    const meta = res.meta || {};
    const now = rows.find((r) => r.kind === 'committed' && r.gw === num(meta.to)) || rows.filter((r) => r.kind === 'committed').at(-1) || rows[0];
    this.result = { job, res, rows };
    this.selGw = now.gw;
    const planRows = rows.filter((r) => r.kind === 'plan' || r.gw >= now.gw);
    const span = planRows.length ? spanText({ from: planRows[0].gw, to: planRows.at(-1).gw }) : '';
    const playedRows = rows.filter((r) => r.t.played);
    const values = job.values || {};
    const entry = values.entry || meta.entry || (values.team_state ? null : this.st.entry);
    this.previewBtn = h('button.btn.sm', { type: 'button', onClick: () => this.sideJob('preview', this.selGw) });
    const rateBtn = h('button.btn.sm', {
      type: 'button', disabled: !entry, onClick: () => this.sideJob('rate', now.gw, entry),
      title: entry ? `Rate team ${entry}'s squad for GW${now.gw}` : 'Rating needs an FPL team (--entry); an edited squad cannot be rated',
    }, `Rate my squad (GW${now.gw})`);
    const cmd = job.solver_cmd || job.cmd;
    const head = card({
      title: 'Plan', className: 'pl-res-head',
      sub: [job.label, job.finished ? fmt.ago(job.finished) : null, job.elapsed != null ? `took ${fmt.dur(job.elapsed)}` : null,
        meta.pool ? `pool ${meta.pool}` : null, meta.tau != null ? `τ ${fmt.num(meta.tau, 2)}` : null].filter(Boolean).join(' · '),
      actions: [
        this.previewBtn, rateBtn,
        h('button.btn.sm', { type: 'button', onClick: () => this.compareDialog(job) }, icon('compare', { size: 14 }), 'Compare…'),
        cmd ? h('button.icon-btn', { type: 'button', title: 'Copy command', 'aria-label': 'Copy command', onClick: () => copyText(cmd) }, icon('copy', { size: 16 })) : null,
        job.values ? h('button.btn.sm.ghost', { type: 'button', title: 'Load this run\'s settings into the planner', onClick: () => this.adoptJobValues(job) }, 'Use these settings') : null,
        h('a.btn.sm.ghost', { href: `#/runs?job=${encodeURIComponent(job.id)}` }, 'Runs'),
      ],
      body: [
        h('div.pl-tiles', null,
          statTile({ label: `${fmt.gw(now.gw)} xP`, value: fmt.pts(now.t.pred), sub: now.t.played ? `scored ${fmt.int(now.t.act)}` : rowTag(now, meta) === 'Next' ? 'next deadline' : null }),
          statTile({ label: `Plan xP ${span}`, value: fmt.pts(sum(planRows.map((r) => r.t.pred))), sub: `${plural(planRows.length, 'GW')}, before hits` }),
          statTile({ label: 'Hits', value: String(sum(planRows.map((r) => r.t.hits))), tone: sum(planRows.map((r) => r.t.hits)) ? 'loss' : null, sub: `−${hitCostOf(res)} pts each` }),
          playedRows.length ? statTile({ label: 'Points scored', value: fmt.int(sum(playedRows.map((r) => r.t.act))), sub: `${plural(playedRows.length, 'played GW')}${job.summary?.rank ? ` · rank ${job.summary.rank}` : ''}` }) : null),
        res.error ? callout('loss', h('strong', null, 'The run stopped early: '), res.error) : null,
        job.status === 'cancelled' ? callout('warn', 'This run was cancelled; the plan below is what it had reached.') : null,
      ],
    });
    this.timeline = timelineCard(res, rows, (gw) => this.selectGw(gw));
    this.pitchSlot = h('div.pl-slot');
    fill(this.resultSlot,
      head,
      h('div.pl-res-grid', null, recommendationCard(res, rows), this.pitchSlot),
      this.timeline, historyCard(res, job.id), warningsCard(res, (n) => this.exactResolve(n)));
    this.selectGw(this.selGw, false);
  },

  selectGw(gw, scroll = true) {
    if (!this.result) return;
    this.selGw = gw;
    this.timeline.select(gw);
    fill(this.pitchSlot, pitchCard(this.result.res, this.result.rows, gw));
    fill(this.previewBtn, icon('preview', { size: 14 }), `Preview GW${gw}`);
    this.previewBtn.title = `The solver's HTML preview for GW${gw} (same pool and window)`;
    if (scroll) this.pitchSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  async adoptJobValues(job) {
    if (!await confirm({ title: 'Use this run\'s settings?', body: 'Your current planner settings are replaced by the ones this run used.', confirmLabel: 'Replace settings' })) return;
    this.loadJobValues(job);
    toast('Settings loaded from the run', 'ok');
  },

  loadJobValues(job) {
    this.save({ preset: undefined, fromTouched: job.values?.from_r != null });
    this.replaceValues(job.values || {});
  },

  /** Re-solve the run on screen with every window round integer, so the plan rows are exact. */
  async exactResolve(n) {
    this.loadJobValues(this.result.job);
    this.setValue('int_rounds', String(n));
    clearTimeout(this.argvTimer);
    await this.refreshArgv();  // solve() checks this.argv: the run's values, not the ones they replaced
    this.solve();
  },

  /** A preview or rating of `gw` with the solved run's data settings, shown in a dialog when done. */
  sideJob(kind, gw, entry) {
    return this.once(kind, () => this.sideJobNow(kind, gw, entry));
  },

  async sideJobNow(kind, gw, entry) {
    const base = this.result?.job?.values || this.values;
    // from_r = to = gw: τ is estimated up to --from-r (main.py:952-965), as a live run at gw would
    const values = { ...pick(base, DATA_KEYS), ...(kind === 'rate' ? { entry: String(entry) } : pick(base, ['must_have', 'exclude'])), from_r: gw, to: gw };
    const label = kind === 'rate' ? `Rating · team ${entry} · GW${gw}` : `Preview · GW${gw}`;
    let job;
    try {
      ({ job } = await api.createJob({ kind, values, label }));
    } catch (e) {
      toast(errText(e), 'error');
      return;
    }
    const out = h('div.pl-side-out');
    const runner = jobRunner({
      job, title: label,
      onDone: ({ job: j }) => {
        if (j.status !== 'done') return;
        if (!j.html_url) { fill(out, callout('warn', 'The run finished but its page was not found; see the log.')); return; }
        const url = api.jobHtmlUrl(j.id);
        fill(out, h('div.row', null, h('a.btn.sm', { href: url, target: '_blank', rel: 'noopener' }, icon('external', { size: 14 }), 'Open in a new tab')),
          h('iframe.report', { src: url, title: label }));
      },
    });
    modal({ title: label, wide: true, body: h('div.stack.tight', null, runner, out), actions: [{ label: 'Close', kind: 'ghost' }] });
  },

  async compareDialog(job) {
    const listEl = h('div.stack.tight', null, loading());
    modal({
      title: 'Compare with another run',
      body: [h('p.small.muted', null, 'Pick a finished solve; Runs shows the two plans GW by GW.'), listEl],
      actions: [{ label: 'Cancel', kind: 'ghost' }],
    });
    try {
      const jobs = (await api.listJobs()).filter((j) => ['solve', 'backtest'].includes(j.kind) && j.status === 'done' && j.id !== job.id);
      fill(listEl, ...(jobs.length
        ? jobs.slice(0, 40).map((j) => h('button.pl-pick', {
          type: 'button', onClick: () => this.ctx.navigate('runs', { diff: `${job.id},${j.id}` }),  // the route change closes the dialog
        }, h('span.strong.truncate', null, j.label || j.id),
        h('span.small.muted', null, [fmt.ago(j.finished || j.created), j.summary?.total_pred != null ? `${fmt.pts(j.summary.total_pred)} xP` : null, j.id].filter(Boolean).join(' · '))))
        : [empty('No other finished solves yet: run another solve or a scenario first.')]));
    } catch (e) {
      fill(listEl, errorCard(e));
    }
  },

  // ---- scenarios

  openScenarios() {
    const patch = { scenarioOpen: true };
    if (!this.variants.length) patch.scenarios = [{ id: 'v1', name: 'Current settings', overrides: {} }, { id: 'v2', name: 'Variant B', overrides: {} }];
    this.save(patch);
    this.renderScenarios();
    this.scenSlot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  setVariants(list) {
    this.save({ scenarios: list });
  },

  updateVariant(id, patch) {
    this.setVariants(this.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  },

  renderScenarios() {
    if (!this.st.scenarioOpen) { this.scenSlot.replaceChildren(); return; }
    const vs = this.variants;
    const add = () => {
      const cur = this.variants;  // not `vs`: edits since this render are saved, not re-rendered
      const used = new Set(cur.map((v) => v.id));
      let n = 1;
      while (used.has(`v${n}`)) n++;
      this.setVariants([...cur, { id: `v${n}`, name: `Variant ${String.fromCharCode(65 + cur.length)}`, overrides: {} }]);
      this.renderScenarios();
    };
    this.scenTable = h('div.pl-slot');
    fill(this.scenSlot, card({
      title: 'Scenarios', className: 'pl-scen',
      sub: 'Each variant is your current settings plus its own changes. Run them together and compare the plans side by side.',
      actions: [
        h('button.btn.sm', { type: 'button', disabled: vs.length >= MAX_VARIANTS, onClick: add }, icon('plus', { size: 14 }), 'Add variant'),
        this.scenRunBtn = h('button.btn.sm.primary', { type: 'button', onClick: () => this.runScenarios() }, icon('play', { size: 14 }), `Run ${vs.length > 1 ? `all ${vs.length}` : ''}`),
        h('button.icon-btn', { type: 'button', title: 'Close scenarios', 'aria-label': 'Close scenarios', onClick: () => { this.save({ scenarioOpen: false }); this.renderScenarios(); } }, icon('close', { size: 16 })),
      ],
      body: [
        h('div.pl-scen-grid', null, vs.length ? vs.map((v, i) => this.variantEditor(v, i)) : empty('No variants yet.')),
        this.scenTable,
      ],
    }));
    this.paintScenRun();
    this.paintScenStatus();
    this.renderScenTable();
  },

  /** "Run all" is off with no variants and while the last click's jobs are still being created. */
  paintScenRun() {
    if (this.scenRunBtn) this.scenRunBtn.disabled = !this.variants.length || this.inflight.has('scen');
  },

  variantEditor(v, i) {
    const ov = v.overrides || {};
    const live = () => this.variants.find((x) => x.id === v.id) || v;
    const setOv = (o) => this.updateVariant(v.id, { overrides: o });
    const name = h('input.input.pl-vname', {
      type: 'text', value: v.name, 'aria-label': 'Variant name', maxlength: 40,
      onChange: () => { this.updateVariant(v.id, { name: name.value.trim() || v.name }); this.renderScenTable(); },
    });
    const rows = Object.keys(ov).filter((d) => this.byDest.has(d)).map((dest) => h('div.pl-ovr', null,
      flagControl(this.flag(dest), ov[dest] ?? undefined, (val) => setOv({ ...live().overrides, [dest]: val ?? null }), { players: this.players(), meta: this.meta }),
      h('button.icon-btn', {
        type: 'button', title: 'Drop this change (use the current setting)', 'aria-label': `Drop the change to ${flagLabel(this.flag(dest))}`,
        onClick: () => { setOv(omit(live().overrides, [dest])); this.renderScenarios(); },
      }, icon('close', { size: 14 }))));
    const addSel = h('select.select', {
      'aria-label': 'Change a setting in this variant',
      onChange: () => { const d = addSel.value; if (d) { setOv({ ...live().overrides, [d]: this.values[d] ?? null }); this.renderScenarios(); } },
    }, h('option', { value: '' }, '+ Change a setting…'),
    this.groups.map((g) => h('optgroup', { label: g.title }, (g.flags || []).filter((d) => this.byDest.has(d) && !(d in ov))
      .map((d) => h('option', { value: d }, flagLabel(this.flag(d)))))));
    const presetSel = h('select.select', {
      'aria-label': 'Start this variant from a preset',
      onChange: () => {
        const p = this.presets.find((x) => x.name === presetSel.value);
        if (!p) return;
        this.updateVariant(v.id, { name: p.name.slice(0, 40), overrides: omit(p.values, KEEP) });
        this.renderScenarios();
      },
    }, h('option', { value: '' }, 'Start from a preset…'), this.presets.map((p) => h('option', { value: p.name }, p.name)));
    return h('div.pl-variant', null,
      h('div.row.tight', null, h('span.pl-vkey', null, String.fromCharCode(65 + i)), name,
        h('button.icon-btn', {
          type: 'button', title: 'Remove variant', 'aria-label': `Remove ${v.name}`,
          onClick: () => { this.setVariants(this.variants.filter((x) => x.id !== v.id)); this.scen.delete(v.id); this.renderScenarios(); },
        }, icon('trash', { size: 15 }))),
      h('div.pl-vstatus', { dataset: { vid: v.id } }),
      rows.length ? rows : h('p.small.muted', null, 'Same as the current settings.'),
      h('div.stack.tight', null, addSel, presetSel));
  },

  async runScenarios() {
    const run = this.once('scen', () => this.queueScenarios());
    this.paintScenRun();
    await run;
    this.paintScenRun();
  },

  async queueScenarios() {
    const vs = this.variants;
    const jobs = {};
    this.scenAbort?.abort();
    this.scen.clear();
    for (const v of vs) {
      // clean(): an override of a flag main.py no longer has (hidden in the editor) would fail every run
      const values = this.clean(mergeValues(this.values, v.overrides));
      try {
        const d = await api.buildArgv(values);
        if (d.errors?.length) { toast(`${v.name}: ${d.errors[0]}`, 'error'); continue; }
        jobs[v.id] = (await api.createJob({ kind: 'solve', values, label: `Scenario · ${v.name}` })).job.id;
      } catch (e) {
        toast(`${v.name}: ${e.message}`, 'error');
      }
    }
    this.save({ scenarioJobs: jobs });
    if (Object.keys(jobs).length) toast(`${plural(Object.keys(jobs).length, 'scenario')} queued (two solve at a time)`, 'info');
    this.trackScenarios();
  },

  resumeScenarios() {
    if (Object.keys(this.st.scenarioJobs || {}).length) this.trackScenarios();
  },

  trackScenarios() {
    const ctrl = this.scenAbort = new AbortController();
    this.abort.signal.addEventListener('abort', () => ctrl.abort(), { once: true });
    for (const [vid, id] of Object.entries(this.st.scenarioJobs || {})) {
      this.scen.set(vid, { id, job: { id, status: 'queued' } });
      api.pollJob(id, ({ job }) => { this.scen.set(vid, { id, job }); this.paintScenStatus(); },
        { interval: 2000, signal: ctrl.signal, withLog: false })
        .then((r) => {
          if (!r) return;
          this.scen.set(vid, { id, job: r.job, res: r.result });
          this.paintScenStatus();
          this.renderScenTable();
        })
        .catch((e) => {
          if (e.status === 404) {  // deleted in Runs: back to "not run yet"
            this.save({ scenarioJobs: omit(this.st.scenarioJobs, [vid]) });
            this.scen.delete(vid);
          } else this.scen.set(vid, { id, job: { id, status: 'lost' }, error: e });
          this.paintScenStatus();
          this.renderScenTable();
        });
    }
    this.paintScenStatus();
  },

  paintScenStatus() {
    for (const el of this.scenSlot.querySelectorAll('.pl-vstatus[data-vid]')) {
      const s = this.scen.get(el.dataset.vid);
      fill(el, ...(s
        ? [jobStatusPill(s.job.status), s.job.elapsed != null ? h('span.small.muted', null, fmt.dur(s.job.elapsed)) : null,
          h('a.small', { href: `#/runs?job=${encodeURIComponent(s.id)}` }, 'log')]
        : [h('span.small.muted', null, 'Not run yet')]).filter(Boolean));
    }
  },

  renderScenTable() {
    if (!this.scenTable?.isConnected) return;
    const items = this.variants.map((v) => ({ name: v.name, ...this.scen.get(v.id) })).filter((x) => x.res && timelineOf(x.res).length);
    const failed = this.variants.filter((v) => { const s = this.scen.get(v.id); return s && !api.isActive(s.job) && !(s.res && timelineOf(s.res).length); });
    fill(this.scenTable,
      failed.map((v) => callout('loss', `${v.name}: ${this.scen.get(v.id)?.res?.error || this.scen.get(v.id)?.job?.error || `no plan (${this.scen.get(v.id)?.job?.status})`}`)),
      items.length
        ? [h('h3.pl-h3', null, 'Comparison'),
          h('p.small.muted', null, 'Best xP per gameweek and the best window total are highlighted. Totals cover the gameweeks every variant planned; net subtracts the hit cost. Results reflect the settings at run time.'),
          scenarioTable(items)]
        : this.scen.size ? h('p.small.muted', null, 'The comparison appears as the variants finish.') : null);
  },
};
