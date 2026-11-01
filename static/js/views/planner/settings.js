// Solver lab: presets, chips and the all-settings drawer.

import * as api from '../../api.js';
import { h, toast, icon, chipName, fill, plural } from '../../ui.js';
import { modal, confirm, field, pill, pick, errText, callout } from '../../studio/kit.js';
import { flagForm } from '../../studio/flags.js';
import { CHIP_KEYS, CHIP_ROUNDS, KEEP, canon, chipMode, num, omit } from './model.js';

export const settingsMethods = {
  // ---- presets

  renderPresets() {
    const cur = this.st.preset || '';
    const opt = (p) => h('option', { value: p.name }, p.name);
    const mine = this.presets.filter((p) => !p.builtin);
    fill(this.presetSel, h('option', { value: '' }, 'Presets…'),
      h('optgroup', { label: 'Built-in' }, this.presets.filter((p) => p.builtin).map(opt)),
      mine.length ? h('optgroup', { label: 'Saved' }, mine.map(opt)) : null);
    this.presetSel.value = this.presets.some((p) => p.name === cur) ? cur : '';
    this.renderPresetNote();
  },

  presetModified(p) {
    const strip = (o) => omit(o, [...KEEP, ...('from_r' in p.values ? [] : ['from_r'])]);
    return canon(strip(this.values)) !== canon(strip(p.values));
  },

  renderPresetNote() {
    if (!this.presetNote) return;
    const p = this.presets.find((x) => x.name === this.st.preset);
    this.delBtn.hidden = !p || p.builtin;
    fill(this.presetNote, p
      ? h('p.small', null, h('strong', null, p.name), ' ', this.presetModified(p) ? pill('changed since', 'warn') : null, ' ',
        h('span.muted', null, p.description), p.note ? h('span.warn', null, ` (${p.note})`) : null)
      : h('p.small.muted', null, 'Start from a preset, or set anything below. Settings are kept in this browser.'));
  },

  /** What a preset or "Reset all" leaves alone: the squad and players, and the first GW when a team is loaded. */
  kept() {
    return pick(this.values, [...KEEP, ...(this.values.entry || this.values.team_state ? ['from_r'] : [])]);
  },

  applyPreset(name) {
    const p = this.presets.find((x) => x.name === name);
    if (!p) return;
    this.save({ preset: p.name });
    this.replaceValues({ ...this.kept(), ...p.values });
    this.presetSel.value = p.name;
    toast(`Preset “${p.name}” applied`, 'ok', { timeout: 2500 });
  },

  async reloadPresets() {
    const season = this.season();  // a preset's @next_gw is that season's next deadline
    try {
      const list = await api.listPresets(season);
      if (season !== this.season()) return;
      this.presets = list;
      this.presetSeason = season;
    } catch (e) { toast(e.message, 'error'); }
    this.renderPresets();
  },

  savePresetDialog() {
    const values = omit(this.values, ['entry', 'team_state']);
    const name = h('input.input', { type: 'text', placeholder: 'e.g. My live settings', maxlength: 60 });
    const desc = h('textarea.textarea', { placeholder: 'What it is for (optional)', rows: 3 });
    const dlg = modal({
      title: 'Save settings as a preset',
      body: h('div.stack.tight', null, field('Name', name), field('Description', desc),
        h('p.small.muted', null, `Saves ${plural(Object.keys(values).length, 'setting')}. Your team (--entry / --team-state) is not stored.`)),
      actions: [{ label: 'Cancel', kind: 'ghost' }, {
        label: 'Save', kind: 'primary',
        onClick: async () => {
          if (!name.value.trim()) { name.focus(); return false; }
          try {
            const p = await api.savePreset({ name: name.value.trim(), description: desc.value.trim(), values });
            this.save({ preset: p.name });
            await this.reloadPresets();
            toast(`Preset “${p.name}” saved`, 'ok');
            return true;
          } catch (e) {
            toast(errText(e), 'error');
            return false;
          }
        },
      }],
    });
    setTimeout(() => name.focus(), 0);
    return dlg;
  },

  async deletePreset() {
    const p = this.presets.find((x) => x.name === this.st.preset);
    if (!p || p.builtin) return;
    if (!await confirm({ title: 'Delete preset?', body: `“${p.name}” will be removed. Your current settings stay as they are.`, confirmLabel: 'Delete', danger: true })) return;
    try {
      await api.deletePreset(p.slug);
      this.save({ preset: undefined });
      await this.reloadPresets();
      toast('Preset deleted', 'ok');
    } catch (e) {
      toast(e.message, 'error');
    }
  },

  // ---- chips

  /** Switch the chip mode (one patch, with `extra` values); manual keeps the rounds already set. */
  setChipMode(mode, extra = {}) {
    this.chipUi = mode;  // "Stored plan" with no plan picked yet has no flag to show it
    const p = Object.fromEntries(CHIP_KEYS.map((k) => [k, undefined]));
    if (mode === 'manual') Object.assign(p, pick(this.values, CHIP_ROUNDS));
    if (mode === 'plan') p.plan = this.values.plan;
    if (mode === 'auto') p.chip_auto = true;
    if (mode === 'none') p.no_chips = true;
    this.patch({ ...p, ...extra });
  },

  /**
   * Manual chip rounds (or the season's defaults where unset) the loaded team cannot play: it already played that chip
   * in the half they fall in (entry.chips_available covers the half holding entry.gw; later halves are not checked).
   */
  chipClashes(season) {
    const e = this.entry;
    if (chipMode(this.values) !== 'manual') return [];
    return CHIP_ROUNDS.flatMap((c) => {
      const played = (e?.chips_used || []).filter((u) => u.chip === c).map((u) => `GW${u.gw}`).join(', ');
      const rounds = (this.values[c] ?? this.flag(c)?.default_by_season?.[season] ?? []).map(Number);
      return rounds.filter((r) => this.chipPlayed(c, r, season)).map((r) =>
        `${chipName(c)} in GW${r}: this team has already played its ${chipName(c)}${played ? ` (${played})` : ''} in this half of the season.`);
    });
  },

  /** The loaded team already played chip `c` in the half of `season` holding GW `r` (meta.chip_half:
   *  solver.chips.HALF). */
  chipPlayed(c, r, season) {
    const e = this.entry;
    const last = num(this.meta?.chip_half);  // the first half's last GW; unknown without /api/meta: no check
    const half = (gw) => gw > last;
    return last != null && !!e?.chips_available && e.season === season && !e.chips_available.includes(c)
      && r >= e.gw && half(r) === half(e.gw);
  },

  renderChips() {
    if (!this.chipPanel) return;
    const derived = chipMode(this.values);
    const mode = derived === 'manual' && this.chipUi === 'plan' ? 'plan' : derived;
    const season = this.season();
    this.chipSeg.setActive(mode);
    // A wildcard squad from the team for its first GW (--entry N --from-r N --wc N), not --fresh, which only moves one
    // GW from the real squad.
    const from = num(this.values.from_r);
    const wcNow = (this.values.entry || this.values.team_state) && from && !this.chipPlayed('wc', from, season)
      && !(mode === 'manual' && String(this.values.wc) === String(from))
      ? h('div', null, h('button.btn.sm', {
        type: 'button', onClick: () => this.setChipMode('manual', { wc: [from], fresh: undefined }),
        title: `Rebuild the squad in GW${from} with your wildcard: chip mode Manual, wildcard round ${from}, --fresh off`,
      }, icon('swap', { size: 14 }), `Wildcard in GW${from}`)) : null;
    fill(this.chipChecks, this.chipClashes(season).map((t) => callout('warn', t)), wcNow);
    this.chipChecks.hidden = !this.chipChecks.childElementCount;
    const left = this.entry?.season === season ? this.entry.chips_available : null;
    const leftNote = left ? h('p.small', null, h('span.muted', null, 'Chips left: '), left.length ? left.map(chipName).join(', ') : 'none') : null;
    const key = `${mode}|${season}|${left?.join(',') ?? ''}`;
    if (key === this.chipKey) return;  // re-render only on a mode change, so edits keep their focus
    this.chipKey = key;
    let body;
    if (mode === 'manual') {
      const defs = CHIP_ROUNDS.map((c) => [c, this.flag(c)?.default_by_season?.[season]]).filter(([, r]) => r?.length);
      body = [
        h('div.flag-grid', null, CHIP_ROUNDS.map((c) => this.ctl(c))),
        h('p.small.muted', null, defs.length
          ? `Unset uses ${season}'s default rounds (${defs.map(([c, r]) => `${c.toUpperCase()} ${r.join(',')}`).join(' · ')}); enter 0 to drop one. `
          : `${season} has no default chip rounds: only the rounds you enter are played. `,
        left ? 'Rounds in the current half of the season are checked against the chips your team has left.'
          : 'Load your team to check the rounds against the chips it has left.'),
      ];
    } else if (mode === 'plan') {
      const f = this.flag('plan');
      const choices = f?.choices_by_season?.[season] || [];
      body = choices.length
        ? [this.ctl('plan', { ...f, choices }), h('p.small.muted', null, 'A stored schedule from solver/chips.py CANONICAL_PLANS; it sets all four chips.')]
        : callout('warn', `No stored chip plans for ${season} (CANONICAL_PLANS has ${Object.keys(f?.choices_by_season || {}).join(' and ') || 'none'}). Pick another chip mode.`);
    } else if (mode === 'auto') {
      body = h('p.small.muted', null, this.flag('chip_auto')?.help || 'The solver times chips itself.');
    } else {
      body = h('p.small.muted', null, 'No chips are played, not even the season\'s default rounds (--no-chips).');
    }
    fill(this.chipBody, body, leftNote);
  },

  // ---- all settings drawer

  openDrawer() {
    const form = flagForm({
      flags: this.flags, groups: this.groups, values: this.values, players: this.players(), meta: this.meta,
      onChange: (vals, dest) => {
        if (dest == null) {  // "Reset all": keeps the team (as a preset does) and re-syncs the form's own copy
          this.replaceValues(this.kept());
          form.setValues(this.values);
          return;
        }
        if (dest === 'from_r') this.save({ fromTouched: vals.from_r !== undefined });
        this.replaceValues(vals, [dest]);
      },
    });
    const dlg = modal({
      title: `All settings (${this.flags.length})`, wide: true,
      body: [h('p.small.muted', null, 'Every solver flag, grouped. Changes apply to the planner at once; the quick settings show the same values.'), form],
      actions: [{ label: 'Done', kind: 'primary' }],
    });
    dlg.el.classList.add('pl-drawer');
  },
};
