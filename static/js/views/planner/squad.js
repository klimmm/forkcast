// Solver lab: the entry (load an FPL team), squad locks and bans, and manual squad editing (POST /api/team-state).

import * as api from '../../api.js';
import { h, toast, fmt, icon, statusDot, chipName, posName, fill, plural } from '../../ui.js';
import {
  card, statTile, modal, loading, errorCard, field, pill, pick, errText, readNum, entryId, entryTitle, callout,
} from '../../studio/kit.js';
import { playerPicker } from '../../studio/tables.js';
import { toks, findTok } from '../../marks.js';
import { seasonLabel } from '../fixtures.js';
import { POS_SLOTS, XI_RANGE, num } from './model.js';

export const squadMethods = {
  // ---- entry

  async loadRecent() {
    const season = this.season();
    let list = [];
    try {
      list = await api.getRecentEntries({ season });
    } catch (e) {
      if (e.status !== 404) console.warn('recent entries unavailable', e);
    }
    if (season !== this.season()) return;
    const items = (Array.isArray(list) ? list : []).slice(0, 6);
    fill(this.recentEl, ...(items.length ? [h('div.small.muted', null, 'Recent teams'),
      h('div.pl-recent-list', null, items.map((r) => h('button.pl-recent-item', {
        type: 'button', title: `Load: ${entryTitle(r)}`, onClick: () => this.loadEntry(r.entry_id, { apply: true }),
      }, h('span.strong.truncate', null, r.team_name || `Team ${r.entry_id}`),
      h('span.small.muted.truncate', null, [r.manager, r.overall_rank ? `OR ${fmt.compact(r.overall_rank)}` : null, `#${r.entry_id}`].filter(Boolean).join(' · ')))))] : []));
  },

  async loadEntry(raw, { apply = false, refresh = false } = {}) {
    const id = entryId(raw);
    if (!id) {
      toast('An FPL team ID is digits only: the number in your points-page address.', 'warn');
      return;
    }
    this.entryInput.value = id;
    const seq = ++this.entrySeq;
    fill(this.managerSlot, card({ title: `Team ${id}`, body: loading(refresh ? 'Fetching from FPL…' : 'Loading your team…') }));
    let e;
    try {
      e = await api.getEntry(id, { season: this.season(), pool: this.values.dir || undefined, refresh });
    } catch (err) {
      if (seq !== this.entrySeq) return;
      this.entry = null;
      fill(this.managerSlot, errorCard(err, { title: `Team ${id} could not be loaded`, retry: () => this.loadEntry(id, { apply, refresh }) }));
      this.renderSquad();
      return;
    }
    if (seq !== this.entrySeq) return;
    this.entry = e;
    this.store.set('lastEntry', id);
    this.save({ entry: id });
    if (apply) {
      const p = { entry: id };
      if (this.values.team_state) { p.team_state = undefined; this.save({ manual: null }); }
      // A bare --entry run replays the season from GW1: plan the next deadline unless a round was chosen.
      if (!this.st.fromTouched) p.from_r = e.gw;
      this.patch(p);
      this.ctx.setParams({ ...this.ctx.params, entry: id });
    }
    this.renderManager();
    this.renderSquad();
    this.renderEntryHint();
    this.renderChips();
  },

  clearEntry() {
    this.entrySeq++;
    this.entry = null;
    this.entryInput.value = '';
    this.save({ entry: undefined, manual: null });
    this.patch({ entry: undefined, team_state: undefined, ...(this.st.fromTouched ? {} : { from_r: undefined }) });
    const { entry, ...rest } = this.ctx.params;
    this.ctx.setParams(rest);
    this.renderManager();
    this.renderSquad();
    this.renderChips();
  },

  renderEntryHint() {
    const v = this.values;
    const next = this.entry?.gw ?? num(this.meta?.next_gw);
    const from = num(v.from_r);
    const planNext = next ? h('button.btn.sm', {
      type: 'button', onClick: () => { this.save({ fromTouched: false }); this.patch({ from_r: next }); },
    }, `Plan GW${next} only`) : null;
    let body;
    if (v.team_state) body = callout('info', `Starting from your edited squad (--team-state); the plan starts at GW${from ?? '?'}.`);
    else if (v.entry && next && from > next) body = callout('warn', `GW${from} is past the next deadline (GW${next}): FPL has no squad for it yet, so a team run can start at GW${next} at the latest. `, planNext);
    else if (v.entry && from > 1) body = callout('gain', `Planning from GW${from}: the solver starts from this squad, bank and free transfers (--entry ${v.entry} --from-r ${from}).`);
    else if (v.entry) body = callout('warn', 'With a team but no First gameweek, the run re-simulates the whole season from GW1 using your history. ', planNext);
    else body = h('p.small.muted', null, 'No team loaded: the solver builds a squad from £100.0m. A bare run (no First gameweek) re-simulates the season from GW1 up to the next deadline. ', from ? null : planNext);
    fill(this.entryHint, body);
    this.ctx.setTitle([this.entry?.team_name, from ? `from GW${from}` : null].filter(Boolean).join(' · ') || null);
  },

  renderManager() {
    const e = this.entry;
    if (!e) { this.managerSlot.replaceChildren(); return; }
    const left = (e.chips_available || []).map((c) => pill(chipName(c), 'gain'));
    const used = (e.chips_used || []).map((c) => pill(`${chipName(c.chip)} GW${c.gw}`));
    fill(this.managerSlot, card({
      title: e.team_name || `Team ${e.entry_id}`, className: 'pl-manager',
      sub: [e.manager, `ID ${e.entry_id}`, seasonLabel(e.season)].filter(Boolean).join(' · '),
      actions: [
        h('button.icon-btn', { type: 'button', title: `Refetch from FPL: writes the entry cache under ml/solver/data/entry_data/${e.season}/${e.entry_id}/ (tracked in git)`, 'aria-label': 'Refetch from FPL', onClick: () => this.loadEntry(e.entry_id, { refresh: true }) }, icon('reset', { size: 16 })),
        h('button.icon-btn', { type: 'button', title: 'Forget this team', 'aria-label': 'Forget this team', onClick: () => this.clearEntry() }, icon('close', { size: 16 })),
      ],
      body: [
        h('div.pl-tiles', null,
          statTile({ label: 'Overall rank', value: fmt.int(e.overall_rank), sub: e.gw_rank ? `GW${e.state_gw}: ${fmt.int(e.gw_rank)}` : null }),
          statTile({ label: 'Points', value: fmt.int(e.points), sub: e.gw_points != null ? `GW${e.state_gw}: ${e.gw_points}` : null }),
          statTile({ label: 'Bank', value: fmt.money(e.bank), tone: e.bank < 0 ? 'loss' : null }),
          statTile({ label: 'Free transfers', value: e.ft ?? '—', sub: `for GW${e.gw}` }),
          statTile({ label: 'Squad value', value: fmt.money(e.squad_value), sub: `selling ${fmt.money(e.selling_value)}` })),
        h('div.pl-chiprow', null, h('span.small.muted', null, 'Chips left'), left.length ? left : h('span.small', null, 'none'),
          used.length ? [h('span.small.muted', null, 'played'), used] : null),
        (e.warnings || []).map((w) => callout('warn', w)),
        h('p.small.muted', null, e.cached ? 'From the local cache' : 'Fetched from FPL',
          e.fetched_epoch ? ` · history ${fmt.ago(e.fetched_epoch)}` : '',
          '. Transfers already made for the coming GW are not visible to the public API.'),
      ],
    }));
  },

  // ---- squad, locks and bans

  squadSource() {
    const m = this.values.team_state ? this.st.manual : null;
    if (m) return { ...m, manual: true };
    const e = this.entry;
    return e && { xi: e.xi, bench: e.bench, captain: e.captain, vice: e.vice, gw: e.gw, horizon: e.horizon,
      players: Object.fromEntries((e.squad || []).map((p) => [p.id, p])) };
  },

  renderSquad() {
    this.squadSeason = this.season();
    const src = this.squadSource();
    const row = (id) => {
      const p = src.players?.[id] || { id, name: `#${id}` };
      const pos = posName(p.pos);
      return h('li.pl-sq', { dataset: { pid: id } },
        h('span.pl-pos', { class: pos?.toLowerCase() }, pos || '?'),
        h('div.pl-sq-main', null,
          h('div.pl-sq-name', null, h('span.truncate', null, p.name),
            id === src.captain ? h('span.badge', { title: 'Captain' }, 'C') : id === src.vice ? h('span.badge', { title: 'Vice-captain' }, 'V') : null,
            statusDot(p.status, { chance: p.chance, news: p.news })),
          h('div.pl-sq-sub', null, [p.club, fmt.money(p.sell_price ?? p.price), num(p.xp_sum) != null ? `${fmt.pts(p.xp_sum)} xP` : null].filter(Boolean).join(' · '))),
        this.markBtn('lock', id, p.name), this.markBtn('ban', id, p.name));
    };
    const horizon = src?.horizon?.length ? ` · xP = GW${src.horizon[0]}–${src.horizon.at(-1)}` : '';
    const back = this.st.entry
      ? h('button.btn.sm', { type: 'button', onClick: () => this.useEntrySquad() }, 'Back to my FPL squad')
      : h('button.btn.sm', { type: 'button', onClick: () => this.useEntrySquad() }, 'Discard edited squad');
    fill(this.squadSlot, card({
      title: src ? `Squad going into GW${src.manual ? src.from_r ?? src.gw + 1 : src.gw}` : 'Squad, locks & bans', className: 'pl-squad',
      sub: `Lock = must keep (--must-have) · Ban = sell, never buy (--exclude)${horizon}`,
      actions: h('button.btn.sm', { type: 'button', onClick: () => this.openSquadEditor() }, icon('swap', { size: 14 }), src ? 'Edit squad' : 'Build a squad'),
      body: [
        src?.manual ? callout('info', 'Using your edited squad (--team-state). ', back) : null,
        src ? h('ul.list.pl-squad-list', null,
          (src.xi || []).map(row),
          src.bench?.length ? h('li.pl-bench-label', null, 'Bench') : null,
          (src.bench || []).map(row))
          : h('p.small.muted', null, 'Load your team to lock or ban squad players, or build a squad by hand. Locks and bans below work for fresh builds too.'),
        h('h3.pl-h3', null, 'Lock in or ban other players'),
        h('div.stack.tight', null, this.ctl('must_have'), this.ctl('exclude')),
      ],
    }));
    this.paintMarks();
  },

  markBtn(kind, id, name) {
    return h('button.icon-btn.pl-mark', {
      type: 'button', class: kind, dataset: { kind }, 'aria-pressed': 'false',
      'aria-label': `${kind === 'lock' ? 'Lock' : 'Ban'} ${name}`, onClick: () => this.toggleMark(kind, id),
    }, icon(kind, { size: 16 }));
  },

  paintMarks() {
    const lists = { lock: toks(this.values.must_have), ban: toks(this.values.exclude) };
    for (const li of this.squadSlot.querySelectorAll('.pl-sq[data-pid]')) {
      const id = li.dataset.pid;
      for (const b of li.querySelectorAll('.pl-mark')) {
        const kind = b.dataset.kind;
        const tok = findTok(lists[kind], id);
        const win = tok?.includes('@') ? ` (GW${tok.split('@')[1]})` : '';
        b.setAttribute('aria-pressed', String(!!tok));
        b.title = kind === 'lock'
          ? (tok ? `Locked${win}: the squad must keep him. Click to unlock.` : 'Lock: the squad must keep him (--must-have)')
          : (tok ? `Banned${win}: sold and never bought back. Click to lift.` : 'Ban: sell him and never buy him back (--exclude)');
      }
      li.classList.toggle('locked', !!findTok(lists.lock, id));
      li.classList.toggle('banned', !!findTok(lists.ban, id));
    }
  },

  useEntrySquad() {
    this.save({ manual: null });
    const entry = this.st.entry;
    this.patch({ team_state: undefined, entry });
    if (entry && !this.entry) this.loadEntry(entry);
    else this.renderSquad();
  },

  // ---- manual squad editing → POST /api/team-state → --team-state

  async openSquadEditor() {
    const season = this.season();
    const m = this.values.team_state && this.st.manual?.season === season ? this.st.manual : null;
    const e = this.entry?.season === season ? this.entry : null;
    const ts = m || e?.team_state || null;
    const body = h('div.pl-ed', null, loading('Loading players…'));
    let save = () => false;  // until the players have loaded
    const dlg = modal({
      title: 'Edit squad', wide: true, body,
      actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Use this squad', kind: 'primary', onClick: () => save() }],
    });
    const list = await this.players(season);
    const byId = new Map(list.map((p) => [Number(p.id), p]));
    const known = { ...(m?.players || {}), ...Object.fromEntries((e?.squad || []).map((p) => [p.id, p])) };
    const info = (id) => byId.get(Number(id)) || known[id] || { id, name: `#${id}` };
    const d = {
      gw: ts?.gw ?? Math.max(1, (num(this.meta?.next_gw) || 2) - 1),
      slots: Object.fromEntries(Object.keys(POS_SLOTS).map((p) => [p, []])),
      xi: new Set((ts?.xi || []).map(Number)), captain: num(ts?.captain), vice: num(ts?.vice),
      bank: num(ts?.bank) ?? 0, ft: num(ts?.ft) ?? 1, pp: { ...(ts?.purchase_prices || {}) },
      chips: ts?.chips_used || [], benchOrder: (ts?.bench || []).map(Number), replacing: null,
    };
    for (const id of [...(ts?.xi || []), ...(ts?.bench || [])].map(Number)) {
      const pos = posName(info(id).pos);
      if (pos && d.slots[pos].length < POS_SLOTS[pos]) d.slots[pos].push(id);
    }
    for (const pos of Object.keys(POS_SLOTS)) while (d.slots[pos].length < POS_SLOTS[pos]) d.slots[pos].push(null);
    const squad = () => Object.values(d.slots).flat().filter((x) => x != null);
    // The GW the plan starts at: the state's own from_r (a GW later after a free hit straight after the state round;
    // api/entry.py), else the GW after the one typed in.
    const planFrom = () => (num(ts?.from_r) != null && d.gw === num(ts.gw) ? num(ts.from_r) : d.gw + 1);
    const xiCount = (pos) => d.slots[pos].filter((id) => id != null && d.xi.has(id)).length;

    const setSlot = (pos, i, id) => {
      const old = d.slots[pos][i];
      d.slots[pos][i] = id;
      d.replacing = null;
      if (old != null) {
        if (d.xi.delete(old) && id != null) d.xi.add(id);
        if (d.captain === old) d.captain = id;
        if (d.vice === old) d.vice = id;
        d.benchOrder = d.benchOrder.map((x) => (x === old ? id : x)).filter((x) => x != null);
      } else if (id != null && d.xi.size < 11 && xiCount(pos) < XI_RANGE[pos][1]) d.xi.add(id);
      paint();
    };
    const benchOutfield = () => {
      const out = squad().filter((id) => !d.xi.has(id) && posName(info(id).pos) !== 'GK');
      return [...d.benchOrder.filter((id) => out.includes(id)), ...out.filter((id) => !d.benchOrder.includes(id))];
    };
    const problems = () => {
      const errs = [];
      const ids = squad();
      if (ids.length < 15) errs.push(`${15 - ids.length} empty slot(s)`);
      if (d.xi.size !== 11) errs.push(`the XI has ${plural(d.xi.size, 'player')}, needs 11`);
      for (const [pos, [lo, hi]] of Object.entries(XI_RANGE)) {
        const n = xiCount(pos);
        if (n < lo || n > hi) errs.push(`XI needs ${lo === hi ? lo : `${lo}–${hi}`} ${pos}, has ${n}`);
      }
      const clubs = {};
      for (const id of ids) { const c = info(id).club; if (c) clubs[c] = (clubs[c] || 0) + 1; }
      for (const [c, n] of Object.entries(clubs)) if (n > 3) errs.push(`${n} players from ${c} (max 3)`);
      if (!d.xi.has(d.captain)) errs.push('pick a captain in the XI');
      if (!d.xi.has(d.vice) || d.vice === d.captain) errs.push('pick a different vice-captain in the XI');
      if (!(d.bank >= 0 && d.bank <= 100)) errs.push('bank must be £0–100m');
      if (!(Number.isInteger(d.ft) && d.ft >= 1 && d.ft <= 5)) errs.push('free transfers must be 1–5');
      return errs;
    };

    const slotRow = (pos, i) => {
      const id = d.slots[pos][i];
      const key = `${pos}:${i}`;
      if (id == null || d.replacing === key) {
        return h('li.pl-ed-slot.empty', null,
          h('span.pl-pos', { class: pos.toLowerCase() }, pos),
          playerPicker({
            players: list.filter((p) => posName(p.pos) === pos), exclude: squad(),
            placeholder: id == null ? `Add a ${pos}…` : `Replace ${info(id).name}…`, label: `Pick a ${pos}`,
            onPick: (p) => setSlot(pos, i, Number(p.id)),
          }),
          id != null ? h('button.btn.sm.ghost', { type: 'button', onClick: () => { d.replacing = null; paint(); } }, 'Cancel') : null);
      }
      const p = info(id);
      const radio = (role) => h('label.pl-ed-arm', { title: role === 'captain' ? 'Captain' : 'Vice-captain' },
        h('input', { type: 'radio', name: `${dlg.el.id || 'ed'}-${role}`, checked: d[role] === id, disabled: !d.xi.has(id),
          onChange: () => { d[role] = id; if (role === 'captain' && d.vice === id) d.vice = null; if (role === 'vice' && d.captain === id) d.captain = null; paint(); } }),
        role === 'captain' ? 'C' : 'V');
      return h('li.pl-ed-slot', { class: { 'is-bench': !d.xi.has(id) } },
        h('span.pl-pos', { class: pos.toLowerCase() }, pos),
        h('label.check.pl-ed-xi', { title: 'In the starting XI' },
          h('input', { type: 'checkbox', checked: d.xi.has(id), onChange: (ev) => {
            if (ev.target.checked) d.xi.add(id); else { d.xi.delete(id); if (d.captain === id) d.captain = null; if (d.vice === id) d.vice = null; }
            paint();
          } }), 'XI'),
        radio('captain'), radio('vice'),
        h('div.pl-ed-name', null, h('span.strong.truncate', null, p.name),
          h('span.small.muted', null, [p.club, fmt.money(p.price)].filter(Boolean).join(' · '))),
        h('button.icon-btn', { type: 'button', title: 'Replace', 'aria-label': `Replace ${p.name}`, onClick: () => { d.replacing = key; paint(); } }, icon('swap', { size: 15 })),
        h('button.icon-btn', { type: 'button', title: 'Remove', 'aria-label': `Remove ${p.name}`, onClick: () => setSlot(pos, i, null) }, icon('close', { size: 15 })));
    };

    const numInput = (label, key, attrs, hint) => field(label, h('input.input.num', {
      type: 'number', value: d[key], ...attrs,
      onChange: (ev) => {
        const { n } = readNum(ev.target);
        if (n === undefined) ev.target.value = d[key];
        else { d[key] = n; paint(); }
      },
    }), hint);

    function paint() {
      const errs = problems();
      const bench = benchOutfield();
      fill(body,
        h('div.pl-ed-top', null,
          numInput('Squad after GW', 'gw', { min: 1, max: 37, step: 1 }, `the plan starts at GW${planFrom()}`),
          numInput('Bank (£m)', 'bank', { min: 0, max: 100, step: 0.1 }),
          numInput(`Free transfers for GW${planFrom()}`, 'ft', { min: 1, max: 5, step: 1 })),
        Object.keys(POS_SLOTS).map((pos) => h('section.pl-ed-pos', null,
          h('h4.pl-h4', null, `${pos} · ${d.slots[pos].filter((x) => x != null).length}/${POS_SLOTS[pos]}`),
          h('ul.list', null, d.slots[pos].map((_, i) => slotRow(pos, i))))),
        h('section.pl-ed-pos', null, h('h4.pl-h4', null, 'Bench order (after the goalkeeper)'),
          bench.length ? h('ol.pl-ed-bench', null, bench.map((id, i) => h('li', null, h('span.truncate', null, info(id).name),
            i ? h('button.icon-btn', { type: 'button', title: 'Move up', 'aria-label': `Move ${info(id).name} up`, onClick: () => {
              const o = bench.slice(); [o[i - 1], o[i]] = [o[i], o[i - 1]]; d.benchOrder = o; paint();
            } }, '↑') : null)))
            : h('p.small.muted', null, 'Untick XI on four players to fill the bench.')),
        errs.length ? callout('warn', h('strong', null, 'Not ready: '), errs.join('; '), '.') : callout('gain', 'Valid squad. Purchase prices you do not know default to the current price.'));
    }

    save = async () => {
      const errs = problems();
      if (errs.length) { toast(errs[0], 'warn'); return false; }
      const order = (ids) => ids.sort((a, b) => Object.keys(POS_SLOTS).indexOf(posName(info(a).pos)) - Object.keys(POS_SLOTS).indexOf(posName(info(b).pos)));
      const xi = order(squad().filter((id) => d.xi.has(id)));
      const bench = [...squad().filter((id) => !d.xi.has(id) && posName(info(id).pos) === 'GK'), ...benchOutfield()];
      const ids = [...xi, ...bench];
      const tag = this.values.entry || this.st.entry || 'manual';
      let res;
      try {
        res = await api.saveTeamState({
          season, gw: d.gw, xi, bench, captain: d.captain, vice: d.vice, bank: d.bank, ft: d.ft,
          purchase_prices: pick(d.pp, ids.map(String)), chips_used: d.chips, name: `planner-${tag}-gw${d.gw}`,
        });
      } catch (err) {
        toast(errText(err), 'error');
        return false;
      }
      const brief = (id) => pick(info(id), ['id', 'name', 'club', 'pos', 'price', 'status', 'chance', 'news']);
      this.save({
        manual: { season, gw: d.gw, from_r: res.from_r, xi, bench, captain: d.captain, vice: d.vice, bank: d.bank, ft: d.ft, path: res.path,
          purchase_prices: pick(d.pp, ids.map(String)), chips_used: d.chips,
          players: Object.fromEntries(ids.map((id) => [id, brief(id)])) },
      });
      const from = num(this.values.from_r);
      // --from-r must come after the state's round (main._load_team_state), and after a free hit that follows it
      this.patch({ team_state: res.path, entry: undefined, from_r: this.st.fromTouched && from >= res.from_r ? from : res.from_r });
      this.renderSquad();
      for (const w of res.warnings || []) toast(w, 'warn');
      toast(`Squad saved: the plan starts at GW${res.from_r}`, 'ok');
      return true;
    };
    paint();
  },
};
