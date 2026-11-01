// Studio's small components: pills, states, fields, entries, cards, modal and confirm, segmented, countdown,
// clipboard and download. The phone never loads this file (only ui.js).

import { DASH, append, fmt, h, icon, roving, svg, toMs, toast, uid, whileConnected } from '../ui.js';

/** The Studio mark: a chalk pitch with a rising plan line. */
export function logo(size = 28) {
  return svg('svg', { class: 'logo', viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': 'true' },
    svg('rect', { x: 1.5, y: 1.5, width: 29, height: 29, rx: 7, class: 'logo-bg' }),
    svg('path', { d: 'M16 6v20M6 12h4v8H6M26 12h-4v8h4', class: 'logo-chalk' }),
    svg('circle', { cx: 16, cy: 16, r: 3.6, class: 'logo-chalk' }),
    svg('path', { d: 'M7 23.5 13 18l5 2.5 7.5-9', class: 'logo-line' }),
    svg('circle', { cx: 25.5, cy: 11.5, r: 2.2, class: 'logo-dot' }));
}
/** Listed keys of `o` that are set (not undefined). */
export const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] !== undefined).map((k) => [k, o[k]]));

// ---------------------------------------------------------------- small pieces

export const pill = (text, tone = '', attrs = {}) => h('span.pill', { ...attrs, class: [tone, attrs.class] }, text);

export const loading = (text = 'Loading…') => h('div.loading', { role: 'status' }, h('span.spinner', { 'aria-hidden': 'true' }), text);

export const empty = (text, action) => h('div.empty', null, h('p', null, text), action || null);

/** An error as one line: "message: detail". */
export const errText = (e) => (e?.detail ? `${e.message}: ${e.detail}` : e?.message || String(e));

/** Server message, traceback behind a disclosure, optional retry button. */
function errorBody(err, retry) {
  const detail = err?.detail;
  return [
    h('p.error-msg', null, err?.message || String(err)),
    detail ? h('details.error-detail', null, h('summary', null, 'Details'), h('pre.log', null, detail)) : null,
    retry ? h('div', null, h('button.btn', { type: 'button', onClick: () => retry() }, icon('reset'), 'Try again')) : null,
  ];
}

/** errorBody as a card under a title. */
export const errorCard = (err, { title = 'This could not be loaded', retry } = {}) =>
  card({ title, className: 'card-error', body: errorBody(err, retry) });

const TONE_ICON = { info: 'info', gain: 'check' };
/** A note in a tone ('loss'|'warn'|'info'|'gain') with its icon. */
export const callout = (tone, ...body) => h('div.callout', { class: tone }, icon(TONE_ICON[tone] || 'warn'), h('div', null, ...body));

/** errorBody inside another card, in a callout. */
export const errorCallout = (err, { retry } = {}) =>
  h('div.callout.loss', null, icon('warn'), h('div.stack.tight', null, errorBody(err, retry)));

/** Labelled form row: field('Horizon', inputEl, 'rounds ahead') */
export function field(label, control, hint) {
  return h('label.field', null, h('span.field-label', null, label), control, hint ? h('span.field-hint', null, hint) : null);
}

/**
 * A number box's value: {bad: true} for text the browser can't read as a number ('6e', '-': input.value gives ''), {}
 * when blank, else {n}.
 */
export function readNum(input) {
  if (input.validity?.badInput) return { bad: true };
  const s = input.value.trim();
  return s ? { n: Number(s) } : {};
}

/**
 * Blank = the server's default GW (`placeholder`). onChange(gw | undefined) fires for a whole 1..max or blank;
 * anything else restores get().
 */
export function gwInput({ get, onChange, max = 38, ...attrs }) {
  const input = h('input.input.num', { type: 'number', min: 1, max, step: 1, inputmode: 'numeric', placeholder: 'next', ...attrs, value: get() ?? '' });
  input.addEventListener('change', () => {
    const { bad, n } = readNum(input);
    if (!bad && (n === undefined || (Number.isInteger(n) && n >= 1 && n <= max))) onChange(n);
    input.value = get() ?? '';
  });
  return input;
}

// ---------------------------------------------------------------- FPL entries

const ENTRY_RE = /^\d{1,10}$/;  // api/entry.py _entry_id
/** FPL entry id from text or a recent-entry row ({entry_id | id | entry}) → its digits or null. */
export function entryId(v) {
  const id = v && typeof v === 'object' ? v.entry_id ?? v.id ?? v.entry : v;
  const s = id == null ? '' : String(id).trim();
  return ENTRY_RE.test(s) ? s : null;
}

/** Hover text for a /api/entries/recent row: manager · rank · points · id. */
export const entryTitle = (r) => [r.manager, r.overall_rank ? `overall rank ${fmt.int(r.overall_rank)}` : null,
  r.points != null ? `${r.points} pts` : null, `#${r.entry_id}`].filter(Boolean).join(' · ');

/** "Recent:" and a chip per recent entry (team name, id); onPick(id). [] when none. */
export function recentEntryChips(list, { limit = 6, onPick } = {}) {
  const top = (list || []).slice(0, limit);
  if (!top.length) return [];
  return [h('span.muted.small', null, 'Recent:'), ...top.map((r) => {
    const name = r.team_name || r.manager;
    return h('button.btn.sm.ghost.entry-chip', { type: 'button', title: entryTitle(r), onClick: () => onPick(String(r.entry_id)) },
      name || `#${r.entry_id}`, name ? h('span.muted.num', null, r.entry_id) : null);
  })];
}

/** Section card. Returns <section> with .bodyEl and .setBody(...children). */
export function card({ title, sub, actions, body, className, id, attrs } = {}) {
  const bodyEl = h('div.card-body', null, body);
  const head = title || sub || actions
    ? h('header.card-head', null,
      h('div.card-titles', null, title ? h('h2.card-title', null, title) : null, sub ? h('p.card-sub', null, sub) : null),
      actions ? h('div.card-actions', null, actions) : null)
    : null;
  const el = h('section.card', { ...attrs, class: className, id }, head, bodyEl);
  el.bodyEl = bodyEl;
  el.setBody = (...children) => { bodyEl.replaceChildren(); append(bodyEl, children); return el; };
  return el;
}

/** value may be a Node (e.g. a countdown); tone: 'gain'|'loss'|'warn'. */
export function statTile({ label, value, sub, tone, title, icon: ic } = {}) {
  return h('div.stat', { class: tone, title },
    h('div.stat-label', null, ic ? icon(ic, { size: 15 }) : null, label),
    h('div.stat-value', null, value instanceof Node ? value : value ?? DASH),
    sub ? h('div.stat-sub', null, sub) : null);
}

// ---------------------------------------------------------------- modal / confirm

const openModals = new Set();  // each open modal's close()
/** Close every open modal as Esc would (each resolves null); the router calls it on route change. */
export function closeAllModals() { for (const close of [...openModals]) close(null); }

/**
 * modal({title, body, actions:[{label, kind:'primary'|'danger'|'ghost', value, onClick(close)}], wide}) → {el,
 * close(value), result: Promise<value|null>}. An onClick returning false keeps it open; Esc / backdrop resolve null.
 */
export function modal({ title, body, actions, wide = false, onClose } = {}) {
  let resolve;
  const result = new Promise((r) => { resolve = r; });
  const close = (value = null) => {
    if (!dlg.open) return;
    openModals.delete(close);
    dlg.close();
    dlg.remove();
    onClose?.(value);
    resolve(value);
  };
  const acts = (actions?.length ? actions : [{ label: 'Close' }]).map((a) =>
    h('button.btn', {
      type: 'button', class: a.kind,
      onClick: async () => { if ((await a.onClick?.(close)) !== false) close(a.value ?? a.label); },
    }, a.label));
  const titleId = uid('dlg');
  const dlg = h('dialog.modal', { class: { wide }, 'aria-labelledby': titleId },
    h('header.modal-head', null, h('h2', { id: titleId }, title || ''),
      h('button.icon-btn', { type: 'button', 'aria-label': 'Close', onClick: () => close(null) }, icon('close'))),
    h('div.modal-body', null, body),
    h('footer.modal-foot', null, acts));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(null); });
  document.body.append(dlg);
  dlg.showModal();
  openModals.add(close);
  return { el: dlg, close, result };
}

/** confirm({title, body, confirmLabel, danger}) → Promise<boolean> */
export function confirm({ title = 'Are you sure?', body = '', confirmLabel = 'Confirm', danger = false } = {}) {
  return modal({
    title, body: typeof body === 'string' ? h('p', null, body) : body,
    actions: [{ label: 'Cancel', kind: 'ghost', value: false }, { label: confirmLabel, kind: danger ? 'danger' : 'primary', value: true }],
  }).result.then((v) => v === true);
}

// ---------------------------------------------------------------- segmented

function choiceGroup({ items, active, onChange, label, role, cls }) {
  const itemRole = role === 'tablist' ? 'tab' : 'radio';
  const selAttr = itemRole === 'tab' ? 'aria-selected' : 'aria-checked';
  let current = active ?? items[0]?.key;
  const buttons = items.map((it) => h('button', {
    type: 'button', role: itemRole, class: 'choice', dataset: { key: it.key }, disabled: it.disabled,
    title: it.title, onClick: () => select(it.key, true),
  }, it.icon ? icon(it.icon, { size: 15 }) : null, it.label ?? it.key,
  it.badge != null ? h('span.badge', null, it.badge) : null));
  const el = roving(h('div', { role, class: cls, 'aria-label': label }, buttons), { items: () => buttons, attr: selAttr, pick: (b) => select(b.dataset.key, true) });
  function paint() {
    for (const b of buttons) b.setAttribute(selAttr, String(b.dataset.key === String(current)));
    roving(el);
  }
  function select(key, fire) {
    const changed = String(key) !== String(current);
    current = items.find((i) => String(i.key) === String(key))?.key ?? key;
    paint();
    if (fire && changed) onChange?.(current);
  }
  paint();
  el.setActive = (key) => select(key, false);
  el.getActive = () => current;
  return el;
}


/** Compact radio-button group (e.g. FDR / Attack / Defence). */
export const segmented = ({ items = [], value, onChange, label } = {}) =>
  choiceGroup({ items, active: value, onChange, label, role: 'radiogroup', cls: 'seg' });

// ---------------------------------------------------------------- countdown

function remaining(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), hh = Math.floor((s % 86400) / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return d ? `${d}d ${p(hh)}h ${p(mm)}m` : `${hh}h ${p(mm)}m ${p(ss)}s`;
}

/** countdown(epoch, {onZero, passed}) → live <time> "2d 04h 13m", title = local date. */
export function countdown(epoch, { onZero, passed = 'Deadline passed' } = {}) {
  const ms = toMs(epoch);
  const el = h('time.countdown', Number.isFinite(ms) ? { datetime: new Date(ms).toISOString(), title: fmt.date(ms) } : null);
  let fired = false;
  const tick = () => {
    if (!Number.isFinite(ms)) { el.textContent = DASH; return; }
    const left = ms - Date.now();
    el.textContent = left > 0 ? remaining(left) : passed;
    el.classList.toggle('soon', left > 0 && left < 86400e3);
    if (left <= 0 && !fired) { fired = true; onZero?.(); }
  };
  tick();
  whileConnected(el, tick, 1000);
  return el;
}

// ---------------------------------------------------------------- clipboard / download / csv

export async function copyText(text, msg = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' }, text);
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (msg) toast(msg, 'ok', { timeout: 2000 });
}

export function download(filename, text, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
