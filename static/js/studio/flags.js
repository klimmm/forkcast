// Studio's solver flag controls and form, and the job runner. The phone never loads this file.

import * as api from '../api.js';
import { fill, fin, fmt, h, icon, norm, plural, toNum, toast, uid, whileConnected } from '../ui.js';
import { copyText, empty, modal, pick, pill, readNum } from './kit.js';
import { combo, playerOption, playerRank } from './tables.js';

// ---------------------------------------------------------------- flags

export const blankish = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
/** A flag value as text: lists joined by `sep`, blank as "not set". */
export const showValue = (v, sep = ',') => (blankish(v) ? 'not set' : Array.isArray(v) ? v.join(sep) : String(v));
/** "2024: 18,23 · 2025: 4,32" for a flag whose default depends on the season, else null. */
export const seasonDefaults = (f, sep) => (f.default_by_season
  ? Object.entries(f.default_by_season).map(([s, v]) => `${s}: ${showValue(v, sep)}`).join(' · ') : null);
function canon(v) {
  if (blankish(v)) return null;
  if (Array.isArray(v)) return v.map(String).join(',');
  return fin(v) ? String(toNum(v)) : String(v);
}

/** True when `value` means "leave the solver default" for this flag. */
export function isDefaultValue(flag, value) {
  if (value === undefined) return true;
  if (flag.kind === 'bool' || flag.widget === 'toggle') return Boolean(value) === Boolean(flag.default);
  return canon(value) === canon(flag.default);
}

/** snake_case key → "Snake case key". */
export const humanise = (key) => key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
// /api/flags sets every flag's label and widget (api/flags.py _static_catalogue).
export const flagLabel = (f) => f.label;

/** Flags in their catalogue groups ([{...group, fs}]), then an "Other settings" group for leftovers. */
export function groupFlags(flags, groups) {
  const byDest = new Map(flags.map((f) => [f.dest, f]));
  const grouped = new Set();
  const gs = (groups || []).map((g) => {
    const fs = (g.flags || []).map((d) => byDest.get(d)).filter(Boolean);
    fs.forEach((f) => grouped.add(f.dest));
    return { ...g, fs };
  });
  const rest = flags.filter((f) => !grouped.has(f.dest));
  if (rest.length) gs.push({ key: '_other', title: 'Other settings', blurb: '', fs: rest });
  return gs;
}

/** What a settings search matches: label, help, flag, dest, aliases, special-values note. */
export const flagHaystack = (f) => norm([f.label, f.help, f.flag, f.dest, ...(f.aliases || []), f.sentinel_note].filter(Boolean).join(' '));

// Solver units the number boxes show in a friendlier one (api/flags.py DOCS). Only the widget converts: values,
// presets, overrides and argv stay in the solver's unit.
const UNIT_VIEWS = { 'tenths of £m': { unit: '£m', scale: 10, dp: 1, min: 0, text: (m) => fmt.money(m) } };  // money is never negative
/**
 * How flag f's number box shows its value when it differs from the solver's unit: {unit, step, dp, show(solverValue) →
 * box text, text(solverValue) → "£100.0m", solver(boxNumber) → solverValue}; null for other flags.
 */
export function unitView(f) {
  const u = UNIT_VIEWS[f?.unit];
  return u ? {
    ...u, step: 10 ** -u.dp,
    show: (v) => (toNum(v) / u.scale).toFixed(u.dp),
    text: (v) => u.text(toNum(v) / u.scale),
    solver: (n) => Number((n * u.scale).toFixed(6)),  // 0.7 * 10 = 7.000000000000001
  } : null;
}

/** A "?" button with a tooltip bubble (hover, focus or click; Esc closes); `label` is its accessible name. */
export function infoTip(label, ...body) {
  const id = uid('tip');
  const bubble = h('div.tip-body', { id, role: 'tooltip' }, ...body);
  const btn = h('button.tip-btn', { type: 'button', 'aria-label': label, 'aria-describedby': id }, '?');
  const wrap = h('span.tip', null, btn, bubble);
  // Keep the bubble inside the viewport (no horizontal page scroll on phones).
  const place = () => {
    const room = innerWidth - 8 - btn.getBoundingClientRect().left;
    bubble.style.left = `${Math.min(-8, room - Math.min(340, innerWidth - 24))}px`;  // 340 = CSS max-width
  };
  wrap.addEventListener('pointerenter', place);
  wrap.addEventListener('focusin', place);
  btn.addEventListener('click', () => { wrap.classList.toggle('open'); place(); });
  btn.addEventListener('blur', () => wrap.classList.remove('open'));
  btn.addEventListener('keydown', (e) => { if (e.key === 'Escape') wrap.classList.remove('open'); });
  return wrap;
}

function helpTip(f) {
  const uv = unitView(f);
  const def = f.kind === 'bool' ? (f.default ? 'on' : 'off') : blankish(f.default) ? showValue(f.default)
    : uv ? uv.text(f.default) : `${showValue(f.default)}${f.unit ? ` ${f.unit}` : ''}`;
  const bySeason = seasonDefaults(f);
  // the box's unit against the flag's: 1.5 → --cash=15 (the default, if any, as the example)
  const eg = uv && (fin(f.default) ? toNum(f.default) : uv.solver(1.5));
  return infoTip(`About ${flagLabel(f)}`,
    h('code.tip-flag', null, f.flag || `--${f.dest.replace(/_/g, '-')}`),
    f.help ? h('p', null, f.help) : null,
    f.sentinel_note ? h('p.muted', null, f.sentinel_note) : null,
    uv ? h('p.muted', null, `Enter ${uv.unit} here; the command gets ${f.unit} (${uv.show(eg)} → ${f.flag}=${eg}).`) : null,
    h('p.muted', null, f.inverted
      ? `Default: on · passing ${f.flag} turns it off`
      : `Default: ${def}${f.aliases?.length ? ` · also ${f.aliases.join(', ')}` : ''}`),
    bySeason ? h('p.muted', null, `Season defaults: ${bySeason}`) : null);
}

let defaultPlayersP = null;
const lazyPlayers = () => (defaultPlayersP ||= api.getPlayers().then((d) => d?.players || []).catch((e) => { defaultPlayersP = null; throw e; }));

/** Comma-joined token list editor (players / pools): chips + a combobox + raw-text escape hatch. */
function tokenWidget({ id, value, emit, combo: comboOpts, describe, placeholder }) {
  let tokens = String(value ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  const chips = h('div.chips');
  const raw = h('input.input.mono', { type: 'text', hidden: true, placeholder, spellcheck: 'false', 'aria-label': 'Raw value' });
  const cb = combo({
    ...comboOpts,
    onPick: (it) => {
      const t = comboOpts.token(it);
      if (!tokens.includes(t)) tokens.push(t);
      commit();
    },
  });
  cb.input.id = id;
  const toggle = h('button.btn.sm.ghost', { type: 'button', title: 'Edit the raw comma-separated value' }, 'Edit as text');
  toggle.addEventListener('click', () => {
    const toRaw = raw.hidden;
    raw.hidden = !toRaw;
    cb.el.hidden = toRaw;
    chips.hidden = toRaw;
    toggle.textContent = toRaw ? 'Done' : 'Edit as text';
    if (toRaw) { raw.value = tokens.join(','); raw.focus(); } else sync(raw.value, true);
  });
  raw.addEventListener('change', () => sync(raw.value, true));
  function paint() {
    chips.replaceChildren(...tokens.map((t, i) => h('span.chip', { title: t }, describe(t),
      h('button.chip-x', { type: 'button', 'aria-label': `Remove ${t}`, onClick: () => { tokens.splice(i, 1); commit(); } }, icon('close', { size: 12 })))));
  }
  function commit() { paint(); emit(tokens.length ? tokens.join(',') : undefined); }
  function sync(v, fire) {
    tokens = String(v ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    paint();
    if (fire) emit(tokens.length ? tokens.join(',') : undefined);
  }
  paint();
  return { el: h('div.token-widget', null, chips, h('div.row.tight', null, cb.el, toggle), raw), sync: (v) => sync(v, false), refresh: paint, cb };
}

/**
 * → one setting row; opts {players, meta}. Values by widget: toggle → bool; number → number; text/select/pool/players
 * → string; rounds → int[]; season → int. onChange(value, flag); undefined = back to default (drop the key). Inverted
 * (store_false) flags show by effect: checked = the dest's value (default true). Element: .setValue(v) re-syncs
 * without firing onChange.
 */
export function flagControl(flag, value, onChange, opts = {}) {
  const f = flag;
  const id = uid(`f-${f.dest}`);
  const kind = f.widget;
  let cur = value;
  const wrap = h('div.flag', { class: `w-${kind}`, dataset: { dest: f.dest } });
  const dot = h('span.flag-dot', { title: 'Changed from default', 'aria-hidden': 'true' });
  const reset = h('button.icon-btn.flag-reset', {
    type: 'button', title: 'Reset to default', 'aria-label': `Reset ${flagLabel(f)} to default`,
    onClick: () => { set(undefined); w.sync(undefined); },
  }, icon('reset', { size: 14 }));
  const err = h('span.flag-err', { role: 'alert' });
  function refresh() {
    const changed = !isDefaultValue(f, cur);
    wrap.classList.toggle('changed', changed);
    reset.hidden = !changed;
  }
  function set(v) { cur = v; err.textContent = ''; refresh(); onChange?.(v, f); }
  const fail = (msg) => { err.textContent = msg; };
  const w = buildWidget(f, kind, id, () => cur, set, fail, opts);
  w.sync(cur);
  const label = h('label.flag-label', { htmlFor: id }, flagLabel(f));
  wrap.append(
    h('div.flag-head', null, label, helpTip(f), dot, f.advanced ? h('span.flag-adv', { title: 'Advanced setting' }, 'adv') : null, h('span.spacer'), reset),
    w.el, err);
  refresh();
  wrap.setValue = (v) => { cur = v; w.sync(v); err.textContent = ''; refresh(); };
  return wrap;
}

const isToken = (v) => typeof v === 'string' && v.startsWith('@');  // e.g. "@next_gw", resolved server-side
const hint = (f, fallback) => f.placeholder || fallback;

function buildWidget(f, kind, id, get, set, fail, opts) {
  const dflt = f.default;
  const shown = (v) => (blankish(v) ? (blankish(dflt) ? '' : String(dflt)) : String(v));
  if (kind === 'toggle') {
    const box = h('input.switch', { type: 'checkbox', id, role: 'switch' });
    box.addEventListener('change', () => set(box.checked === Boolean(dflt) ? undefined : box.checked));
    return { el: box, sync: (v) => { box.checked = v === undefined ? Boolean(dflt) : Boolean(v); } };
  }
  if (kind === 'number') {
    const isInt = f.kind === 'int';
    const uv = unitView(f);  // e.g. --cash: the box takes £m, the value stays in tenths
    const view = (v) => (uv && fin(v) ? uv.show(v) : String(v));
    const empty = blankish(dflt) ? hint(f, f.sentinel_note ? 'auto' : 'not set') : `default ${view(dflt)}`;
    const input = h('input.input.num', {
      type: 'number', id, step: uv ? uv.step : isInt ? 1 : 'any', inputmode: isInt && !uv ? 'numeric' : 'decimal', placeholder: empty,
    });
    // The box shows the default as its value, so typing must replace it; the focusing click would drop the selection on
    // mouseup, so that mouseup is cancelled.
    let focusing = false;
    input.addEventListener('focus', () => { input.select(); focusing = true; });
    input.addEventListener('mouseup', (e) => { if (focusing) e.preventDefault(); focusing = false; });
    input.addEventListener('keydown', () => { focusing = false; });
    input.addEventListener('change', () => {
      const { bad, n } = readNum(input);  // blank: n undefined = back to the default
      const v = uv && n !== undefined ? uv.solver(n) : n;
      if (bad || (v !== undefined && !(isInt ? Number.isInteger(v) : Number.isFinite(v)))) {
        return fail(uv && Number.isFinite(n) ? `Enter ${uv.unit} to ${plural(uv.dp, 'decimal place')}, e.g. ${(1.5).toFixed(uv.dp)}.`
          : isInt ? 'Enter a whole number.' : 'Enter a number.');
      }
      if (uv && v !== undefined && v < uv.min) return fail(`Enter at least ${uv.text(uv.min)}.`);
      set(v);
      if (uv && v !== undefined) input.value = view(v);  // "1.50" → "1.5": the box shows what was sent
    });
    const sync = (v) => {
      input.placeholder = isToken(v) ? v.slice(1).replace(/_/g, ' ') : empty;
      input.value = isToken(v) ? '' : blankish(v) ? (blankish(dflt) ? '' : view(dflt)) : view(v);
    };
    const unit = uv?.unit ?? f.unit;
    return { el: unit ? h('div.with-unit', null, input, h('span.unit', null, unit)) : input, sync };
  }
  if (kind === 'rounds') {
    // Chip rounds default per season (2026 has none), so a fixed example would mislead.
    const ph = f.default_by_season ? 'season default' : hint(f, blankish(dflt) ? 'none, e.g. 19' : String(dflt));
    const input = h('input.input.mono', { type: 'text', id, inputmode: 'numeric', spellcheck: 'false', placeholder: ph });
    input.addEventListener('change', () => {
      const parts = input.value.split(/[\s,]+/).filter(Boolean);
      if (!parts.length) return set(undefined);
      const nums = [...new Set(parts.map(Number))];
      if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 38)) return fail('Use gameweek numbers 1-38 separated by commas, or 0 for none.');
      // 0 = none: drops the season default (main.py skips rounds <= 0), so it only means something alone
      if (nums.includes(0) && nums.length > 1) return fail('0 means no rounds: enter it on its own.');
      set(nums.sort((a, b) => a - b));
    });
    return { el: input, sync: (v) => { input.value = Array.isArray(v) ? v.join(', ') : blankish(v) ? '' : String(v); } };
  }
  if ((kind === 'select' || kind === 'season') && f.kind === 'str' && f.placeholder) {
    // Suggested values, but any string is valid (e.g. "auto-raw" or "0.001,0.25,0.2,0.15").
    const dl = h('datalist', { id: `${id}-dl` }, (f.choices || []).map((c) => h('option', { value: String(c) })));
    const input = h('input.input.mono', { type: 'text', id, list: `${id}-dl`, spellcheck: 'false', placeholder: blankish(dflt) ? hint(f, 'not set') : String(dflt) });
    input.addEventListener('change', () => { const s = input.value.trim(); set(!s || s === String(dflt) ? undefined : s); });
    return { el: h('div', null, input, dl), sync: (v) => { input.value = blankish(v) ? '' : String(v); } };
  }
  if (kind === 'select' || kind === 'season') {
    const labels = f.choice_labels || {};
    const sel = h('select.select', { id });
    const fill = (choices) => {
      const list = choices.map(String);
      if (!blankish(dflt) && !list.includes(String(dflt))) list.unshift(String(dflt));
      sel.replaceChildren(
        blankish(dflt) ? h('option', { value: '' }, 'Default') : null,
        ...list.map((c) => h('option', { value: c }, (labels[c] ?? c) + (c === String(dflt) ? ' (default)' : ''))));
      sel.value = shown(get());
    };
    sel.addEventListener('change', () => {
      const v = sel.value;
      if (v === '' || v === String(dflt)) return set(undefined);
      set(kind === 'season' || f.kind === 'int' ? Number(v) : v);
    });
    if (f.choices?.length) fill(f.choices);
    else {
      fill([]);
      if (kind === 'season') Promise.resolve(opts.meta || api.getMeta()).then((m) => fill(m?.seasons || [])).catch(() => {});
    }
    return { el: sel, sync: (v) => { sel.value = shown(v); } };
  }
  if (kind === 'players') {
    const known = new Map();
    const describe = (t) => {
      const [who, win] = t.split('@');
      const name = known.get(who.trim())?.name ?? who;
      return win ? `${name} (GW${win.replace('-', '–')})` : name;
    };
    const tw = tokenWidget({
      id, value: get(), emit: set, describe, placeholder: hint(f, '123456@6-8,Salah'),
      combo: { items: [], rank: playerRank, renderItem: playerOption, placeholder: 'Add a player…', label: flagLabel(f), token: (p) => String(p.id) },
    });
    const load = (list) => {
      for (const p of list || []) known.set(String(p.id), p);
      tw.cb.setItems(list);
      tw.refresh();
    };
    if (opts.players) Promise.resolve(opts.players).then(load).catch(() => {});
    else if (!blankish(get())) lazyPlayers().then(load).catch(() => {});  // name the ids already set
    else tw.cb.input.addEventListener('focus', () => lazyPlayers().then(load).catch((e) => fail(e.message)), { once: true });
    return tw;
  }
  if (kind === 'pool') {
    const rank = (p, q) => (!q ? 0 : norm(p.name).startsWith(q) ? 1 : norm(p.name).includes(q) ? 2 : null);
    const tw = tokenWidget({
      id, value: get(), emit: set, describe: (t) => t, placeholder: 'dir1,dir2 or prod',
      combo: {
        items: (f.choices || []).map((name) => ({ name, sub: '' })), rank, openOnFocus: true, label: flagLabel(f),
        placeholder: blankish(dflt) ? 'Season default pool' : `default ${dflt}`,
        renderItem: (p) => [h('span.opt-main', null, p.name), h('span.opt-sub', null, p.sub)],
        token: (p) => p.name,
      },
    });
    // meta.pools (prod alias first) carries file counts and ages; f.choices is the bare name list.
    Promise.resolve(opts.meta || api.getMeta()).then((m) => {
      const aliasDirs = (m?.prod_alias?.dirs || []).join(', ');
      if (m?.pools?.length) tw.cb.setItems(m.pools.map((p) => ({
        name: p.name,
        sub: [p.alias && `= ${aliasDirs}`, p.is_default && 'season default', fin(p.n_files) && `${p.n_files} files`, p.archived && 'archived', p.mtime && fmt.ago(p.mtime)].filter(Boolean).join(' · '),
      })));
    }).catch(() => {});
    return tw;
  }
  // text
  const input = h('input.input', { type: 'text', id, spellcheck: 'false', placeholder: hint(f, blankish(dflt) ? 'not set' : String(dflt)) });
  input.addEventListener('change', () => { const s = input.value.trim(); set(!s || s === String(dflt) ? undefined : s); });
  return { el: input, sync: (v) => { input.value = blankish(v) ? '' : String(v); } };
}

/**
 * flagForm({flags, groups, values, onChange(values, dest, value), filter, players, meta, showAdvanced, open}): grouped
 * accordion of flagControls with search, "Show advanced" and "Changed only" toggles, per-group changed counts. filter:
 * fn(flag)→bool or a string pre-filling the search; open: group keys expanded initially. Element: .setValues(values),
 * .getValues().
 */
export function flagForm({ flags = [], groups = [], values = {}, onChange, filter, players, meta, showAdvanced = false, open = [] } = {}) {
  let vals = { ...values };
  const pool = typeof filter === 'function' ? flags.filter(filter) : flags;
  const gs = groupFlags(pool, groups);

  const opened = new Set(open);
  let query = typeof filter === 'string' ? filter : '';
  let adv = showAdvanced;
  let changedOnly = false;
  const controls = new Map();
  const search = h('input.input', { type: 'search', placeholder: `Search ${pool.length} settings`, value: query, 'aria-label': 'Search settings' });
  const advBox = h('input', { type: 'checkbox', checked: adv });
  const chgBox = h('input', { type: 'checkbox' });
  const total = h('span.muted.small');
  const resetAll = h('button.btn.sm.ghost', { type: 'button' }, icon('reset', { size: 14 }), 'Reset all');
  const list = h('div.acc-list');
  const el = h('div.flag-form', null,
    h('div.flag-tools', null,
      h('div.search-box', null, icon('search', { size: 16 }), search),
      h('label.check', null, advBox, 'Show advanced'),
      h('label.check', null, chgBox, 'Changed only'),
      h('span.spacer'), total, resetAll),
    list);

  const changed = (f) => !isDefaultValue(f, vals[f.dest]);
  const index = new Map(pool.map((f) => [f.dest, flagHaystack(f)]));

  function control(f) {
    if (!controls.has(f.dest)) {
      controls.set(f.dest, flagControl(f, vals[f.dest], (v) => {
        if (v === undefined) delete vals[f.dest]; else vals[f.dest] = v;
        counts();
        onChange?.({ ...vals }, f.dest, v);
      }, { players, meta }));
    }
    return controls.get(f.dest);
  }

  function counts() {
    for (const sec of list.children) {
      const g = gs.find((x) => x.key === sec.dataset.key);
      const c = g ? g.fs.filter(changed).length : 0;
      const b = sec.querySelector('.acc-changed');
      if (b) { b.textContent = c ? `${c} changed` : ''; b.hidden = !c; }
    }
    const n = pool.filter(changed).length;
    total.textContent = n ? `${n} changed from default` : 'All defaults';
    resetAll.disabled = !n;
  }

  function render() {
    const q = norm(query.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    list.replaceChildren();
    let shownAny = false;
    for (const g of gs) {
      const visible = g.fs.filter((f) => (!terms.length || terms.every((t) => index.get(f.dest).includes(t)))
        && (adv || !f.advanced || changed(f) || terms.length)
        && (!changedOnly || changed(f)));
      if (!visible.length) continue;
      shownAny = true;
      const isOpen = opened.has(g.key) || terms.length > 0 || changedOnly;
      const panelId = uid('acc');
      const headBtn = h('button.acc-head', {
        type: 'button', 'aria-expanded': String(isOpen), 'aria-controls': panelId,
        onClick: () => {
          opened.has(g.key) ? opened.delete(g.key) : opened.add(g.key);
          render();
          list.querySelector(`[data-key="${CSS.escape(g.key)}"] .acc-head`)?.focus();
        },
      }, icon('chevron', { size: 16 }),
      h('span.acc-title', null, g.title || humanise(g.key)),
      h('span.acc-count', null, visible.length === g.fs.length ? `${g.fs.length}` : `${visible.length}/${g.fs.length}`),
      h('span.acc-changed', { hidden: true }));
      const panel = h('div.acc-panel', { id: panelId, hidden: !isOpen },
        g.blurb ? h('p.acc-blurb', null, g.blurb) : null,
        h('div.flag-grid', null, isOpen ? visible.map(control) : null));
      list.append(h('section.acc', { dataset: { key: g.key }, class: { open: isOpen } }, h('h3.acc-h', null, headBtn), panel));
    }
    if (!shownAny) list.append(empty(query ? `No setting matches “${query}”.` : 'No settings to show.'));
    counts();
  }

  list.addEventListener('keydown', (e) => {
    if (!e.target.classList?.contains('acc-head')) return;
    const heads = [...list.querySelectorAll('.acc-head')];
    const i = heads.indexOf(e.target);
    const j = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: heads.length - 1 }[e.key];
    if (j == null) return;
    e.preventDefault();
    heads[(j + heads.length) % heads.length].focus();
  });
  let t = 0;
  search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { query = search.value; render(); }, 120); });
  advBox.addEventListener('change', () => { adv = advBox.checked; render(); });
  chgBox.addEventListener('change', () => { changedOnly = chgBox.checked; render(); });
  resetAll.addEventListener('click', () => {
    vals = {};
    for (const c of controls.values()) c.setValue(undefined);
    render();
    onChange?.({}, null, undefined);
  });

  render();
  el.setValues = (next) => {
    vals = { ...(next || {}) };
    for (const [dest, c] of controls) c.setValue(vals[dest]);
    render();
  };
  el.getValues = () => ({ ...vals });
  return el;
}

/**
 * "Extra flags" button with a count badge for a run form that shows a few flags itself: opens every other flag (not in
 * `own`, not a run-mode switch: flag.branch) in a flagForm modal; edits go into `values`, then onChange().
 */
export function extraFlagsButton({ flags = [], groups = [], meta, values, own, onChange }) {
  const extra = () => Object.keys(values).filter((k) => !own.has(k));
  const btn = h('button.btn.sm', { type: 'button', disabled: !flags.length });
  const paint = () => fill(btn, icon('menu', { size: 15 }), 'Extra flags', extra().length ? h('span.badge', null, extra().length) : null);
  btn.addEventListener('click', () => modal({
    title: 'Extra solver flags', wide: true,
    body: flagForm({
      flags, groups, meta, values: pick(values, extra()), filter: (f) => !own.has(f.dest) && !f.branch,
      onChange: (vals) => {
        for (const k of extra()) delete values[k];
        Object.assign(values, vals);
        paint();
        onChange?.();
      },
    }),
    actions: [{ label: 'Done', kind: 'primary' }],
  }));
  paint();
  return btn;
}

// ---------------------------------------------------------------- job runner

const STATUS_TONE = { queued: 'info', running: 'run', done: 'gain', error: 'loss', cancelled: 'warn' };
export const jobStatusPill = (status) => pill(status || 'unknown', STATUS_TONE[status] || '', { role: 'status' });

/**
 * jobRunner({job, onDone({job, result, log}), onUpdate(tick), title}); job object or id. Status pill, elapsed timer,
 * copyable command, live log (auto-scrolls while at the bottom), Cancel. Polling stops once the element leaves the
 * document; .stop() stops it.
 */
export function jobRunner({ job, onDone, onUpdate, title } = {}) {
  let j = typeof job === 'object' && job ? job : { id: job, status: 'queued' };
  const ctrl = new AbortController();
  let base = { elapsed: toNum(j.elapsed) || 0, at: Date.now() };
  const pillBox = h('span');
  const timer = h('span.job-time.num');
  const cancel = h('button.btn.sm.danger', {
    type: 'button',
    onClick: async () => {
      cancel.disabled = true;
      try { await api.cancelJob(j.id); toast('Cancel requested', 'info', { timeout: 2000 }); } catch (e) { toast(e.message, 'error'); cancel.disabled = false; }
    },
  }, icon('stop', { size: 14 }), 'Cancel');
  const logEl = h('pre.log', { role: 'log', 'aria-label': 'Job output', tabindex: 0 });
  const cmd = h('div.job-cmd');
  const el = h('div.job', { dataset: { jobId: j.id } },
    h('div.job-head', null, pillBox, h('span.job-label', null, title || j.label || j.kind || 'Job'), timer, h('span.spacer'),
      cancel, h('a.btn.sm.ghost', { href: `#/runs?job=${encodeURIComponent(j.id)}` }, 'Open in Runs')),
    cmd, logEl);

  function paint() {
    pillBox.replaceChildren(jobStatusPill(j.status));
    const active = api.isActive(j);
    cancel.hidden = !active;
    const secs = active && j.status === 'running' ? base.elapsed + (Date.now() - base.at) / 1000 : base.elapsed;
    timer.textContent = j.status === 'queued' ? 'waiting for a free slot' : fmt.dur(secs);
    if (j.cmd && !cmd.childElementCount) cmd.append(h('code.mono', null, j.cmd), h('button.icon-btn', { type: 'button', 'aria-label': 'Copy command', title: 'Copy command', onClick: () => copyText(j.cmd) }, icon('copy', { size: 14 })));
    el.dataset.status = j.status;
  }
  paint();
  // A runner removed from the page, or never shown, stops polling.
  const stopTimer = whileConnected(el, paint, 1000, () => ctrl.abort());
  api.pollJob(j.id, (tick) => {
    j = tick.job || j;
    base = { elapsed: toNum(j.elapsed) || base.elapsed, at: Date.now() };
    if (tick.text) {
      const atBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 24;
      logEl.append(tick.text);
      if (atBottom) logEl.scrollTop = logEl.scrollHeight;
    }
    paint();
    onUpdate?.(tick);
  }, { signal: ctrl.signal }).then((res) => {
    stopTimer();
    if (!res) return;
    j = res.job || j;
    paint();
    onDone?.(res);
  }).catch((e) => {
    stopTimer();
    pillBox.replaceChildren(pill('lost', 'loss'));
    logEl.append(`\n[Studio] stopped following this job: ${e.message}\n`);
  });
  el.stop = () => { ctrl.abort(); stopTimer(); };
  return el;
}
