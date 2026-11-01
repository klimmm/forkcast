// Planner (#/planner): load an FPL entry, set locks, bans, chips and solver settings, solve, and read the plan GW by
// GW; or run up to four scenario variants side by side.
// One source of truth: state.planner.values = {dest: value} in the flag widgets' value types (the solver's units).
// Every editor writes it (quick panel, squad lock/ban buttons, pickers, "All settings" drawer, other views such as the
// players table and marks.js; onStore picks their changes up); the command preview, solves and scenarios read it.
// URL: #/planner?entry=<id> loads that team; #/planner?job=<id> shows that run's result.

import * as api from '../api.js';
import { h, toast, fmt, icon, statusDot, chipName, POS, posName, fill, plural } from '../ui.js';
import { card, statTile, modal, confirm, segmented, loading, empty, errorCard, field, pill, copyText, pick, errText, readNum, entryId, entryTitle, callout } from '../studio/kit.js';
import { pitch, transferCard, table, playerPicker } from '../studio/tables.js';
import { flagControl, flagForm, jobRunner, jobStatusPill, flagLabel, infoTip, humanise } from '../studio/flags.js';
import { DEST, toks, findTok, applyMark } from '../marks.js';
import { committedCells, committedRows, cellsTable, spanText, noteTone } from './runs.js';
import { seasonLabel } from './fixtures.js';
import { CHIP_KEYS, CHIP_MODES, CHIP_ROUNDS, DATA_KEYS, KEEP, MAX_VARIANTS, POS_SLOTS, QUICK, XI_RANGE, canon, chipMode, hitCostOf, mergeValues, num, omit, rowTag, sum, timelineOf } from './planner/model.js';
import { historyCard, pitchCard, recommendationCard, scenarioTable, timelineCard, warningsCard } from './planner/cards.js';
import { squadMethods } from './planner/squad.js';
import { settingsMethods } from './planner/settings.js';
import { solveMethods } from './planner/solve.js';

// ---------------------------------------------------------------- the view

class Planner {
  constructor(el, ctx) {
    this.el = el;
    this.ctx = ctx;
    this.store = ctx.state;
    this.controls = new Map();   // dest → Set of flagControls showing it
    this.playerLists = new Map(); // season → Promise<PlayerRow[]>
    this.entry = null;
    this.scen = new Map();        // variant id → {id, job, res, error}
    this.inflight = new Set();    // once() keys of launches still being created
    this.abort = new AbortController();
    this.unsub = [];
    this.argvSeq = 0;
    this.entrySeq = 0;
    this.jobSeq = 0;
  }

  get st() { return this.store.get('planner', {}) || {}; }
  get variants() { return this.st.scenarios || []; }

  save(patch) {
    this.writing = true;
    try { this.store.update('planner', patch); } finally { this.writing = false; }
  }

  flag(dest) { return this.byDest.get(dest); }
  season() { return num(this.values.season) ?? num(this.flag('season')?.default) ?? num(this.meta?.season); }
  clean(v) { return Object.fromEntries(Object.entries(v || {}).filter(([k, x]) => this.byDest.has(k) && x !== undefined && x !== null)); }

  /**
   * Every player of the season (all=1: unforecast ones too, e.g. a long-term injured in a real squad), for the pickers
   * and squad editor; independent of the pool, no xP.
   */
  players(season = this.season()) {
    if (!this.playerLists.has(season)) {
      this.playerLists.set(season, api.getPlayers({ season, all: true }).then((d) => d?.players || []).catch((e) => {
        this.playerLists.delete(season);
        console.warn('players unavailable', e);
        return [];
      }));
    }
    return this.playerLists.get(season);
  }

  // ---- lifecycle

  async init() {
    this.el.classList.add('planner');
    this.el.append(loading('Loading solver settings…'));
    const [fl, meta] = await Promise.all([api.getFlags(), api.getMeta().catch(() => null)]);
    // Run-mode switches (--preview, --rate-team: flag.branch) stop main.py being a solve: the Preview / Rate buttons
    // run them. Left out of byDest, they drop from saved values, presets and scenario overrides (clean()).
    this.flags = (fl?.flags || []).filter((f) => !f.branch);
    this.groups = fl?.groups || [];
    this.presets = fl?.presets || [];
    this.byDest = new Map(this.flags.map((f) => [f.dest, f]));
    this.presetSeason = num(this.flag('season')?.default);  // /api/flags resolves @next_gw for the default season
    this.meta = meta;
    const st = this.st;
    this.values = this.clean(st.values);
    this.build();
    this.commit(null);
    this.unsub.push(this.store.subscribe('planner', (next) => this.onStore(next)));

    const p = this.ctx.params;
    const entry = p.entry || this.values.entry || st.entry;
    if (entry) this.loadEntry(entry, { apply: !!p.entry && String(p.entry) !== String(this.values.entry ?? '') });
    const job = p.job || st.lastJob;
    if (job) this.showJob(job, { fromUrl: !!p.job });
    this.resumeScenarios();
    this.ready = true;
  }

  destroy() {
    this.abort.abort();
    this.scenAbort?.abort();
    clearTimeout(this.argvTimer);
    for (const f of this.unsub) f();
  }

  // ---- values: the single source of truth

  setValue(dest, v, source) {
    if (dest === 'from_r') this.save({ fromTouched: v !== undefined });
    this.patch({ [dest]: v }, { source });
  }

  patch(obj, opts = {}) {
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) delete this.values[k];
      else this.values[k] = v;
    }
    this.commit(Object.keys(obj), opts);
  }

  replaceValues(next, changed = null) {
    this.values = this.clean(next);
    this.commit(changed);
  }

  commit(changed, { source, persist = true } = {}) {
    if (persist) this.save({ values: { ...this.values } });
    for (const [dest, set] of this.controls) {
      if (changed && !changed.includes(dest)) continue;
      for (const c of set) {
        if (!c.isConnected) set.delete(c);
        else if (c !== source) c.setValue(this.values[dest]);
      }
    }
    const touched = (...k) => !changed || k.some((x) => changed.includes(x));
    if (touched(...CHIP_KEYS, 'season', 'from_r', 'entry', 'team_state')) this.renderChips();
    if (touched('entry', 'team_state', 'from_r', 'season')) this.renderEntryHint();
    if (touched('must_have', 'exclude')) this.paintMarks();
    if (this.squadSeason !== this.season()) this.renderSquad();  // the lock / ban pickers list that season's players
    if (touched('season')) {
      this.loadRecent();
      const id = this.entry?.entry_id ?? this.values.entry;
      if (this.ready && id && this.entry?.season !== this.season()) this.loadEntry(id, { apply: true });
      if (this.presetSeason !== this.season()) this.reloadPresets();
    }
    this.renderPresetNote();
    this.queueArgv();
  }

  onStore(next) {
    if (this.writing) return;
    const nv = this.clean(next?.values);
    if (canon(nv) !== canon(this.values)) {  // another tab, or a view that edits values directly
      this.values = nv;
      this.commit(null, { persist: false });
    }
  }

  toggleMark(kind, id) {
    const v = applyMark(this.values, kind, id, !findTok(toks(this.values[DEST[kind]]), id));
    this.patch({ must_have: v.must_have, exclude: v.exclude });  // undefined = cleared
  }

  /** A flagControl bound to values[dest]; every control of a dest is kept in step by commit(). */
  ctl(dest, flag = this.flag(dest)) {
    if (!flag) return null;
    const c = flagControl(flag, this.values[dest], (v) => this.setValue(dest, v, c), { players: this.players(), meta: this.meta });
    if (!this.controls.has(dest)) this.controls.set(dest, new Set());
    this.controls.get(dest).add(c);
    return c;
  }

  // ---- layout

  build() {
    this.entryInput = h('input.input.mono.pl-entry-input', {
      type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: 'FPL team ID, e.g. 353468',
      'aria-label': 'FPL team ID', value: this.values.entry || this.st.entry || '',
    });
    this.recentEl = h('div.pl-recent');
    this.entryHint = h('div.pl-entry-hint');
    const entryCard = card({
      title: 'Your FPL team', className: 'pl-entry',
      sub: 'Start from your real squad, bank, free transfers and chips.',
      body: [
        h('form.row.tight', { onSubmit: (e) => { e.preventDefault(); this.loadEntry(this.entryInput.value, { apply: true }); } },
          this.entryInput, h('button.btn.primary', { type: 'submit' }, 'Load team')),
        h('p.small.muted', null, 'The ID is the number in your FPL points-page address (…/entry/', h('b', null, 'ID'), '/event/…).'),
        this.recentEl, this.entryHint,
      ],
    });
    this.managerSlot = h('div.pl-slot');
    this.squadSlot = h('div.pl-slot');
    this.resultSlot = h('div.stack.pl-result');
    this.scenSlot = h('div.pl-slot');
    fill(this.el, h('div.pl-layout', null,
      h('aside.stack.pl-side', null, entryCard, this.managerSlot, this.squadSlot),
      h('div.stack.pl-main', null, this.buildSettings(), this.buildRun(), this.resultSlot, this.scenSlot)));
    this.renderSquad();
    this.renderPresets();
    this.renderScenarios();
  }

  buildSettings() {
    this.presetSel = h('select.select.pl-preset', { 'aria-label': 'Preset', onChange: () => this.applyPreset(this.presetSel.value) });
    this.delBtn = h('button.icon-btn', { type: 'button', title: 'Delete this saved preset', 'aria-label': 'Delete preset', onClick: () => this.deletePreset() }, icon('trash', { size: 16 }));
    this.presetNote = h('div.pl-preset-note');
    this.chipSeg = segmented({ items: CHIP_MODES, value: chipMode(this.values), label: 'Chip mode', onChange: (m) => this.setChipMode(m) });
    this.chipBody = h('div.stack.tight');    // re-rendered on a mode change only (renderChips)
    this.chipChecks = h('div.stack.tight');  // the wildcard shortcut and the chips-played checks, on every change
    this.chipPanel = h('div.pl-chip-panel.stack.tight', null, this.chipBody, this.chipChecks);
    const sections = QUICK.map(([title, dests]) => h('section.pl-qs', null,
      h('h3.pl-h3', null, title), h('div.flag-grid', null, dests.map((d) => this.ctl(d)))));
    return card({
      title: 'Solver settings', className: 'pl-settings',
      sub: 'Quick settings; every other flag is under All settings. Nothing runs until you press Solve.',
      actions: [
        this.presetSel, this.delBtn,
        h('button.btn.sm', { type: 'button', onClick: () => this.savePresetDialog() }, icon('plus', { size: 14 }), 'Save as…'),
        h('button.btn.sm', { type: 'button', onClick: () => this.openDrawer() }, 'All settings', h('span.badge', null, this.flags.length)),
      ],
      body: [
        this.presetNote, ...sections,
        h('section.pl-qs', null, h('h3.pl-h3', null, 'Chips'), this.chipSeg, this.chipPanel),
      ],
    });
  }

  buildRun() {
    this.cmdEl = h('code.mono.pl-cmd-text', null, '…');
    this.cmdMsgs = h('div.stack.tight.pl-cmd-msgs');
    this.solveBtn = h('button.btn.primary.lg', { type: 'button', onClick: () => this.solve() }, icon('play', { size: 16 }), 'Solve');
    return card({
      title: 'Run', className: 'pl-run',
      body: [
        h('div.pl-cmd', null, this.cmdEl,
          h('button.icon-btn', { type: 'button', title: 'Copy command', 'aria-label': 'Copy command', onClick: () => copyText(this.argv?.cmd || this.cmdEl.textContent) }, icon('copy', { size: 15 }))),
        this.cmdMsgs,
        h('div.row', null, this.solveBtn,
          h('button.btn', { type: 'button', onClick: () => this.openScenarios() }, icon('compare', { size: 15 }), 'Scenarios…'),
          h('span.spacer'),
          h('span.small.muted', null, 'Runs in the background: you can leave this page and come back.')),
      ],
    });
  }

  // ---- command preview

  queueArgv() {
    clearTimeout(this.argvTimer);
    this.argvTimer = setTimeout(() => this.refreshArgv(), 250);
  }

  async refreshArgv() {
    const seq = ++this.argvSeq;
    let d;
    try {
      d = await api.buildArgv(this.values);
    } catch (e) {
      d = { cmd: '', errors: [e.message], warnings: [] };
    }
    if (seq !== this.argvSeq || !this.cmdEl.isConnected) return;
    this.argv = d;
    this.cmdEl.textContent = d.cmd || '';
    fill(this.cmdMsgs, ...(d.errors || []).map((m) => callout('loss', m)), ...(d.warnings || []).map((m) => callout('warn', m)));
    this.solveBtn.disabled = !!d.errors?.length;
    this.solveBtn.title = d.errors?.length ? 'Fix the errors above first' : '';
  }
}

// Planner's methods by section (planner/*.js), on its prototype as its own are: not enumerable
for (const part of [squadMethods, settingsMethods, solveMethods]) {
  for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(part))) Object.defineProperty(Planner.prototype, k, { ...d, enumerable: false });
}

export default {
  route: 'lab',
  title: 'Solver lab',
  icon: 'M9 3h6M10 3v6.5L4.6 18.7A1.5 1.5 0 0 0 5.9 21h12.2a1.5 1.5 0 0 0 1.3-2.3L14 9.5V3M7.2 15h9.6',
  async mount(el, ctx) {
    const p = new Planner(el, ctx);
    try {
      await p.init();
    } catch (e) {
      p.destroy();
      throw e;
    }
    return () => p.destroy();
  },
};
