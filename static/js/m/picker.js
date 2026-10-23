// Forkcast's team picker (FOLLOWUPS F6, F6b): ONE component for every place a team is chosen, the Connect screen and
// the Switch team sheet. A text field ("FPL team ID or team name": the text keyboard, never the number pad) with live
// name search (GET /api/m/search, 150 ms after the last keystroke, 1–40 characters, at most 8 suggestions: flag, the
// name with the typed part bold, then manager · country · #id) as an accessible combobox (aria-autocomplete list, a listbox, ↑ ↓ Enter
// Escape, tap); an all-digit entry or a pasted FPL address is the Team ID, its name shown once the search confirms
// it; the teams opened in this browser as the Recent list (localStorage only: ACCESS_V2), a section of its own that
// the caller places under its Find my team button (DESIGN_V2 §3 Connect). Among the teams called exactly what was typed, the
// host's private leagues' teams come first, silently (the server ranks them; the row looks like any other). Search needs the server: offline it says so and
// the ID still works. A 429 is a quiet "Searching too fast".
// A11 (the fix pass): while team search is unavailable (a 503 or no answer from it, this page), the field asks for the
// ID only (placeholderId: no "or Raketa") and Find my team keeps "Team search isn't available. Type your team ID" (never
// "Pick your team from the list" over a list that can't come).
//
// teamPicker(ctx, {value, onPick(id, name), onWhere(id), recent = 3, label}) → {el, recent, field, submit() → bool,
//   focus(), destroy()}: el is the label, field, suggestions and message; recent the "Recent" section (rows: team
//   name, manager · ID, points when known; empty with no recent team). submit picks the highlighted suggestion, the
//   typed ID, or the one suggestion there is.
// Pure (node: picker.test.mjs): readId(text) → Team ID string | null (digits, or /entry/<id> in a pasted address);
// fold(text) (case, accents and marks away, as the server's index folds); parts(name, query) → [{text, hit}]: the
// matched part (at a word start first, as the server ranks); SEARCH (debounce, lengths, limit); COPY.

export const SEARCH = Object.freeze({ debounceMs: 150, min: 1, max: 40, limit: 8 });

export const COPY = Object.freeze({
  placeholder: 'Such as 383130 or Raketa',
  placeholderId: 'Such as 383130',
  label: 'FPL team ID or team name',
  where: 'Where do I find my ID?',
  recent: 'Recent',
  none: (q) => `No team called “${q}”. Use your team ID.`,
  // one character matches whole names only (api/search.py PREFIX_MIN), and thousands share some: only the ID tells
  // them apart
  named: (n, q) => `${n.toLocaleString('en')} teams are called “${q}”. Use your team ID.`,
  tooFast: 'Searching too fast. One moment.',
  offline: "Team search isn't available. Type your team ID.",
  pick: 'Pick your team from the list, or type your team ID.',
  empty: 'Type your team name or your FPL team ID.',
  confirm: (r) => `${r.name}${r.region ? ` · ${r.region}` : ''}`,
  idOnly: (id) => `Team ID ${id}`,
});

/** The Team ID in what was typed or pasted: all digits (spaces ignored), or the id of an FPL address. */
export function readId(text) {
  const s = String(text ?? '').trim();
  const m = s.match(/entry\/(\d{1,10})/);
  const d = m ? m[1] : s.replace(/\s+/g, '');
  // never 0 (the reviews, 2026-10-11: "0" was looked up as a team): FPL's IDs start at 1
  return /^\d{1,10}$/.test(d) && Number(d) > 0 ? String(Number(d)) : null;
}

/** The server's folding, near enough for highlighting (api/search.py fold: NFKD, marks dropped, case-folded). */
export const fold = (s) => String(s ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

/** name split around the query's match (folded), a word-start match first: [{text, hit}]. */
export function parts(name, query) {
  const src = String(name ?? '');
  const q = fold(query).trim();
  if (!q) return [{ text: src, hit: false }];
  // the folded name, and for each folded character the index of the original character it came from
  let folded = '';
  const from = [];
  const chars = [...src];
  let at = 0;
  for (const ch of chars) {
    const f = fold(ch);
    for (const c of f) { folded += c; from.push(at); }
    at += ch.length;
  }
  from.push(src.length);
  const starts = [];
  for (let i = folded.indexOf(q); i >= 0; i = folded.indexOf(q, i + 1)) starts.push(i);
  if (!starts.length) return [{ text: src, hit: false }];
  const word = starts.find((i) => i === 0 || !/[\p{L}\p{N}]/u.test(folded[i - 1])) ?? starts[0];
  const a = from[word], b = from[word + q.length] ?? src.length;
  return [{ text: src.slice(0, a), hit: false }, { text: src.slice(a, b), hit: true }, { text: src.slice(b), hit: false }].filter((p) => p.text);
}

let seq = 0;
/** A11: team search answered "unavailable" (or not at all) on this page: every picker asks for the ID only until it
 *  answers again. */
let searchDown = false;

export function teamPicker(ctx, { value = '', onPick, onWhere = null, recent = 3, label = COPY.label } = {}) {
  const { h, fill } = ctx.ui;
  const id = `fc-tp-${++seq}`;
  const field = h('input.m-field', {
    id, type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false',
    enterkeyhint: 'go', placeholder: searchDown ? COPY.placeholderId : COPY.placeholder, value, role: 'combobox', 'aria-autocomplete': 'list',
    'aria-expanded': 'false', 'aria-controls': `${id}-list`, 'aria-describedby': `${id}-msg`,
  });
  const list = h('ul.m-tp-list', { id: `${id}-list`, role: 'listbox', 'aria-label': 'Teams', hidden: true });
  const msg = h('div.m-tp-msg', { id: `${id}-msg`, 'aria-live': 'polite' });
  const el = h('div.m-tp', null, h('label.m-label', { htmlFor: id }, label), h('div.m-tp-box', null, field, list), msg);
  const S = { results: [], active: -1, timer: null, ctrl: null, q: '', confirmed: null };

  const say = (text, tone = '', extra = null) => { msg.className = `m-tp-msg ${tone}`; fill(msg, text || null, extra); };
  // the brackets stay on the link's line (no "(" left at a line end)
  const where = (idHint) => (onWhere ? [' ', h('span.m-tp-nw', null, '(', h('button.m-tp-where', { type: 'button', onClick: () => onWhere(idHint) }, COPY.where), ')')] : null);

  function close() {
    list.hidden = true;
    field.setAttribute('aria-expanded', 'false');
    field.removeAttribute('aria-activedescendant');
    S.active = -1;
  }
  function paint() {
    if (!S.results.length) { fill(list); close(); return; }
    fill(list, S.results.map((r, i) => h('li.m-tp-opt', {
      id: `${id}-o${i}`, role: 'option', 'aria-selected': String(i === S.active), dataset: { id: r.id },
      // keep the field focused (the keyboard up) while a finger picks
      onPointerdown: (e) => e.preventDefault(),
      onClick: () => pick(r),
    },
    h('span.m-tp-flag', { 'aria-hidden': 'true' }, r.flag || '·'),
    h('span.m-tp-name', null, parts(r.name, S.q).map((p) => (p.hit ? h('b', null, p.text) : p.text))),
    h('span.m-tp-sub', null, [r.manager, r.region, `#${r.id}`].filter(Boolean).join(' · ')))));
    list.hidden = false;
    field.setAttribute('aria-expanded', 'true');
    if (S.active >= 0) field.setAttribute('aria-activedescendant', `${id}-o${S.active}`);
    else field.removeAttribute('aria-activedescendant');
  }
  /** ↑ ↓ through the suggestions and back to the field (−1). */
  function move(d) {
    const n = S.results.length;
    if (!n) return;
    S.active = ((((S.active + 1 + d) % (n + 1)) + n + 1) % (n + 1)) - 1;
    paint();
    list.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }
  function pick(r) {
    close();
    field.value = String(r.id);
    say(r.name ? COPY.confirm(r) : COPY.idOnly(r.id), 'ok');
    onPick?.(String(r.id), r.name ?? null);
  }

  async function search(q, { idOnly = null } = {}) {
    S.ctrl?.abort();
    const ctrl = new AbortController();
    S.ctrl = ctrl;
    try {
      const out = await ctx.api.request('GET', '/api/m/search', { query: { q, limit: SEARCH.limit }, signal: ctrl.signal });
      if (ctrl.signal.aborted || S.ctrl !== ctrl) return;
      down(false);
      const results = (out?.results || []).slice(0, SEARCH.limit);
      if (idOnly) {
        const r = results.find((x) => String(x.id) === idOnly);
        S.confirmed = r ?? null;
        if (readId(field.value) === idOnly) say(r ? COPY.confirm(r) : COPY.idOnly(idOnly), r ? 'ok' : '');
        return;
      }
      S.results = results;
      S.active = -1;
      paint();
      if (!results.length) say(COPY.none(q), 'warn', where(null));
      else if (out.named > results.length) say(COPY.named(out.named, q), 'warn', where(null));
      else say(null);
    } catch (e) {
      if (ctrl.signal.aborted || e?.code === 'aborted') return;
      S.results = [];
      paint();
      if (e?.code === 'unreachable' || e?.code === 'timeout' || e?.status === 503) down(true);
      if (idOnly) { say(COPY.idOnly(idOnly)); return; }
      if (e?.status === 429) {
        // the server's burst window is 2 s: ask once more after it, if the text is still the same
        say(COPY.tooFast, 'quiet');
        clearTimeout(S.timer);
        S.timer = setTimeout(() => { if (field.value.trim().replace(/\s+/g, ' ').slice(0, SEARCH.max) === q) search(q); }, 2100);
      }
      else if (e?.code === 'unreachable' || e?.code === 'timeout' || e?.status === 503) say(COPY.offline, 'warn');
      else if (e?.status !== 400) say(ctx.api.plain(e), 'warn');
    }
  }

  function onInput() {
    field.classList.remove('bad');
    el.classList.toggle('active', !!field.value.trim());  // Connect lifts its form while you type (m.css)
    clearTimeout(S.timer);
    const v = field.value;
    const idv = readId(v);
    S.q = v.trim().replace(/\s+/g, ' ');
    S.confirmed = null;
    if (idv) {
      // a Team ID (or a pasted address): no list; the search confirms whose it is
      S.results = [];
      paint();
      say(COPY.idOnly(idv));
      if (idv.length >= SEARCH.min) S.timer = setTimeout(() => search(idv, { idOnly: idv }), SEARCH.debounceMs);
      return;
    }
    if (S.q.length < SEARCH.min) { S.ctrl?.abort(); S.results = []; paint(); say(null); return; }
    S.timer = setTimeout(() => search(S.q.slice(0, SEARCH.max)), SEARCH.debounceMs);
  }

  /** Enter / Find my team: the highlighted suggestion, else the typed ID, else the only suggestion. */
  function submit() {
    const idv = readId(field.value);
    if (S.active >= 0 && S.results[S.active]) { pick(S.results[S.active]); return true; }
    if (idv) { pick(S.confirmed ?? { id: idv, name: null }); return true; }
    if (S.results.length === 1) { pick(S.results[0]); return true; }
    field.classList.add('bad');
    say(!field.value.trim() ? COPY.empty : searchDown ? COPY.offline : COPY.pick, 'bad', where(null));
    return false;
  }
  /** Team search unavailable (or back): the placeholder asks for the ID only while it is down. */
  function down(on) {
    searchDown = on;
    field.placeholder = on ? COPY.placeholderId : COPY.placeholder;
  }

  field.addEventListener('input', onInput);
  field.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); } else if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); e.stopPropagation(); close(); }
  });
  field.addEventListener('blur', () => setTimeout(close, 150));
  field.addEventListener('focus', () => { if (S.results.length) paint(); });

  // Recent: a full-width row per team (its name, the manager and the ID under it, its points on the right when the
  // browser kept them)
  const rows = ctx.api.recent.list().slice(0, recent);
  const recentEl = h('section.m-recent', { hidden: !rows.length, 'aria-label': COPY.recent },
    h('h3.m-recent-h', null, COPY.recent),
    rows.map((r) => h('button.m-recent-row', {
      type: 'button', 'aria-label': `${r.team_name ? `${r.team_name}, team ID` : 'Team ID'} ${r.entry_id}`,
      onClick: () => pick({ id: r.entry_id, name: r.team_name }),
    },
    h('span.m-recent-t', null, h('b', null, r.team_name || `Team ${r.entry_id}`),
      h('small.m-num', null, [r.manager, r.entry_id].filter(Boolean).join(' · '))),
    r.total != null && Number.isFinite(Number(r.total)) ? h('span.m-recent-pts.m-num', null, `${r.total} pts`) : null)));
  if (readId(value)) onInput();

  return {
    el, recent: recentEl, field, submit,
    focus: () => field.focus({ preventScroll: true }),
    destroy() { clearTimeout(S.timer); S.ctrl?.abort(); },
  };
}
