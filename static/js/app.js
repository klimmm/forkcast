// FPL Solver Studio (Dev mode) — app shell at /studio/: hash router, top bar (every tool as a tab, deadline,
// running jobs, theme, the ⚙ menu), bottom tab bar on narrow windows, state store.
// Forkcast (static/m/, at /m/) is the app; the Studio is its Dev mode for this computer only, so every tool
// is always shown (server.py refuses /studio/ and these APIs to any other device: api/access.py).
//
// View module contract — static/js/views/<name>.js:
//   export default {
//     route: 'lab',            // hash route, e.g. #/lab?entry=383130
//     title: 'Solver lab',     // tab label and page heading
//     icon: 'players',         // a ui.ICONS key, a 24×24 stroke SVG path ('M…'), or an emoji
//     mount(el, ctx) { …; return cleanup }   // may be async; the optional cleanup runs when the route is left
//   }
//   ctx = { api, ui, state, params, route, dev, navigate(route, params), setParams(params), setTitle(sub) }
//     api        static/js/api.js (one function per endpoint, pollJob)
//     ui         static/js/ui.js (components, fmt)
//     state      store: get(key, fallback), set(key, value | prev => next), update(key, patch),
//                subscribe(key, fn(next, prev)) → unsubscribe. Persisted in localStorage (fss:<key>): planner
//                {values, entry, preset, …}, compare (player ids, newest COMPARE_MAX kept), theme, lastEntry,
//                playersFilters. Any other key lives in memory for the session.
//     params     the hash query as {name: string}
//     dev        always true: the Studio is Dev mode (kept for views written against the old toggle)
//     navigate   go to a view; navigating to the current hash remounts it
//     setParams  rewrite the current view's query string without remounting (shareable state)
//     setTitle   secondary text beside the page heading (null clears)
//
// Routes: NAV are the tabs. Old links: #/planner and #/plan go to #/lab, keeping their query.
// ⚙ → Open on iPhone (only when the server runs with --lan or --public): Forkcast's address for another
// device as a QR and text (GET /api/meta access.urls). Nothing to pair: the phone just opens the address.
// Jobs: the header announces a finished job with a toast unless an element with data-job-id="<id>" is in
// the page (the view showing that job already tells the user).

import * as api from './api.js';
import * as ui from './ui.js';
import { qrSvg } from './vendor/qr.js';
import lab from './views/planner.js';
import dashboard from './views/dashboard.js';
import players, { COMPARE_MAX, compareIds } from './views/players.js';
import compare from './views/compare.js';
import fixtures from './views/fixtures.js';
import runs from './views/runs.js';
import backtests from './views/backtests.js';
import preview from './views/preview.js';
import data from './views/data.js';
import docs from './views/docs.js';

const { h } = ui;
const ICON = {
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  phone: 'M8 2.5h8A1.5 1.5 0 0 1 17.5 4v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM10.5 18.5h3',
};

// ---------------------------------------------------------------- Open on iPhone (⚙)

const urlRow = (url) => h('div.row.tight', null, h('code.share-url', null, url),
  h('button.btn.sm.ghost', { type: 'button', title: 'Copy link', 'aria-label': `Copy ${url}`, onClick: () => ui.copyText(url, 'Link copied') },
    ui.icon('copy', { size: 14 })));

/** urls: where another device opens Forkcast, best first (access.share_urls). */
function openOnPhone(urls) {
  ui.modal({
    title: 'Open on iPhone',
    body: h('div.share', null,
      h('div.share-qr', null, qrSvg(urls[0])),
      h('div.stack.tight', null,
        h('p', null, 'Scan this with the iPhone’s Camera, or type the address into Safari. To keep Forkcast on the Home Screen: Share → Add to Home Screen.'),
        urlRow(urls[0]),
        urls.length > 1 ? h('p.small.muted', null, 'If that address doesn’t open:') : null,
        urls.slice(1).map(urlRow))),
  });
}

// ---------------------------------------------------------------- routes

const VIEWS = [lab, dashboard, players, compare, fixtures, runs, backtests, preview, data, docs];
const byRoute = new Map(VIEWS.map((v) => [v.route, v]));
const NAV = ['lab', 'dashboard', 'players', 'compare', 'fixtures', 'runs', 'backtests', 'preview', 'data', 'docs'];
const DEFAULT_ROUTE = 'lab';
const ALIAS = { planner: 'lab', plan: 'lab' };

// ---------------------------------------------------------------- store

const PREFIX = 'fss:';
const PERSIST = ['planner', 'compare', 'theme', 'lastEntry', 'playersFilters'];
const NORMALISE = {
  compare: (v) => compareIds(v).slice(-COMPARE_MAX),
};

function createStore() {
  const mem = new Map();
  const subs = new Map();
  const read = (k) => {
    try {
      const raw = localStorage.getItem(PREFIX + k);
      if (raw != null) mem.set(k, JSON.parse(raw));
    } catch { /* storage blocked or corrupt: start empty */ }
  };
  PERSIST.forEach(read);
  const notify = (k, next, prev) => {
    for (const fn of subs.get(k) || []) {
      try { fn(next, prev); } catch (e) { console.error(e); }
    }
  };
  const store = {
    get: (k, fallback) => (mem.has(k) && mem.get(k) !== undefined ? mem.get(k) : fallback),
    set(k, v) {
      const prev = mem.get(k);
      let next = typeof v === 'function' ? v(prev) : v;
      if (NORMALISE[k] && next !== undefined) next = NORMALISE[k](next);
      mem.set(k, next);
      if (PERSIST.includes(k)) {
        try {
          if (next === undefined) localStorage.removeItem(PREFIX + k);
          else localStorage.setItem(PREFIX + k, JSON.stringify(next));
        } catch { /* quota or blocked storage: keep in memory */ }
      }
      notify(k, next, prev);
      return next;
    },
    update: (k, patch) => store.set(k, (prev) => ({ ...(prev || {}), ...patch })),
    subscribe(k, fn) {
      if (!subs.has(k)) subs.set(k, new Set());
      subs.get(k).add(fn);
      return () => subs.get(k)?.delete(fn);
    },
  };
  // Keep several open tabs in step.
  addEventListener('storage', (e) => {
    const k = e.key?.startsWith(PREFIX) && e.key.slice(PREFIX.length);
    if (!k || !PERSIST.includes(k)) return;
    const prev = mem.get(k);
    read(k);
    if (e.newValue == null) mem.delete(k);
    notify(k, mem.get(k), prev);
  });
  return store;
}

const state = createStore();

// ---------------------------------------------------------------- theme

const $ = (id) => document.getElementById(id);
const themeBtn = $('theme-btn');
const darkMq = matchMedia('(prefers-color-scheme: dark)');
const effectiveTheme = () => {
  const t = state.get('theme');
  return t === 'light' || t === 'dark' ? t : darkMq.matches ? 'dark' : 'light';
};

function applyTheme() {
  const t = state.get('theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  themeBtn.replaceChildren(ui.icon(next === 'light' ? 'sun' : 'moon'));
  themeBtn.title = `Switch to ${next} theme`;
  themeBtn.setAttribute('aria-label', themeBtn.title);
}
themeBtn.addEventListener('click', () => state.set('theme', effectiveTheme() === 'dark' ? 'light' : 'dark'));
state.subscribe('theme', applyTheme);
darkMq.addEventListener('change', applyTheme);

// ---------------------------------------------------------------- the ⚙ menu

const menus = new Set();  // each open menu's close()

/**
 * A button that opens a panel below it. Closes on Esc (focus back on the button), a click outside, and
 * a click on a link inside the panel. Up / Down move between the panel's links, buttons and inputs.
 */
function dropdown(root, { button, panel, label }) {
  const panelId = ui.uid('menu');
  const btn = h('button.menu-btn', {
    type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId,
    'aria-label': label, title: label,
  }, button);
  const box = h('div.menu-panel', { id: panelId, hidden: true }, panel);
  const items = () => [...box.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled)')];
  const close = (focus = false) => {
    if (box.hidden) return;
    box.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    menus.delete(close);
    if (focus) btn.focus();
  };
  const open = () => {
    for (const c of [...menus]) c();
    box.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    menus.add(close);
  };
  btn.addEventListener('click', () => (box.hidden ? open() : close()));
  root.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (!step) return;
    const list = items();
    if (!list.length) return;
    e.preventDefault();
    const i = list.indexOf(document.activeElement);
    list[(i + step + list.length) % list.length].focus();
  });
  box.addEventListener('click', (e) => { if (e.target.closest('a[href]')) close(); });
  root.replaceChildren(btn, box);
  return { btn, box, close };
}
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest?.('.menu')) for (const c of [...menus]) c();
});

const settingsList = h('nav.menu-list', { 'aria-label': 'Settings' },
  h('div.menu-head', null, 'Forkcast'),
  h('a.menu-item', { href: '/m/' }, ui.icon('external', { size: 16 }), h('span', null, 'Open Forkcast')));
const settings = dropdown($('settings-menu'), {
  label: 'Settings',
  button: ui.icon(ICON.cog, { size: 18 }),
  panel: settingsList,
});
settings.btn.classList.add('icon-btn');

/** ⚙ → Open on iPhone, when the server answers other devices (--lan / --public: access.urls). */
async function showShare() {
  let urls = [];
  try {
    urls = ((await api.getMeta())?.access?.urls || []).filter((u) => /^https?:\/\//.test(u));
  } catch { return; }  // showDeadline reports an unreachable server
  if (!urls.length) return;
  settingsList.append(h('button.menu-item', { type: 'button', onClick: () => { settings.close(); openOnPhone(urls); } },
    ui.icon(ICON.phone, { size: 16 }), h('span', null, 'Open on iPhone')));
}

// ---------------------------------------------------------------- nav (top tabs + narrow-window tab bar)

const tabLinks = [];  // [route, <a>] for both bars

function buildNav() {
  $('brand').prepend(ui.logo(26));
  const links = (cls, size) => NAV.filter((r) => byRoute.has(r)).map((r) => {
    const v = byRoute.get(r);
    const a = h(`a.${cls}`, { href: `#/${r}` }, ui.icon(v.icon || r, { size }), h('span', null, v.title));
    tabLinks.push([r, a]);
    return a;
  });
  $('nav').replaceChildren(...links('nav-tab', 17));
  $('tabbar').replaceChildren(...links('tabbar-item', 22));
}

function paintNav(route) {
  for (const [r, a] of tabLinks) {
    if (r === route) {
      a.setAttribute('aria-current', 'page');
      if (a.closest('#nav')) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else a.removeAttribute('aria-current');
  }
}

// ---------------------------------------------------------------- router

const viewRoot = $('view');
let current = { route: null, cleanup: null };
let mountSeq = 0;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  return { route: path.split('/')[0], params: Object.fromEntries(new URLSearchParams(query)) };
}

const hashFor = (route, params) => `#/${route}${api.qs(params)}`;

function runCleanup() {
  const fn = current.cleanup;
  current.cleanup = null;
  if (typeof fn === 'function') {
    try { fn(); } catch (e) { console.error('view cleanup failed', e); }
  }
}

function navigate(route, params) {
  const target = hashFor(route, params);
  if (location.hash === target) render();
  else location.hash = target;
}

async function render() {
  const asked = parseHash();
  const { params } = asked;
  let route = ALIAS[asked.route] || asked.route;
  if (!byRoute.has(route)) route = DEFAULT_ROUTE;
  if (route !== asked.route) history.replaceState(null, '', hashFor(route, params));
  const view = byRoute.get(route);
  const token = ++mountSeq;
  const moved = current.route !== route;
  ui.closeAllModals();  // a dialog belongs to the view it was opened from
  runCleanup();
  current = { route, cleanup: null };

  $('view-title').textContent = view.title;
  $('view-sub').textContent = '';
  // a tab names its page already: the heading stays for screen readers
  $('page-head').classList.toggle('quiet', NAV.includes(route));
  document.title = `${view.title} · FPL Solver Studio`;
  document.body.dataset.route = route;
  paintNav(route);
  if (moved) scrollTo({ top: 0 });

  const el = h('div.view', { dataset: { route } });
  viewRoot.replaceChildren(el);
  const ctx = {
    api, ui, state, params, route, dev: true, navigate,
    setParams(next) {
      if (token !== mountSeq) return;
      ctx.params = { ...next };
      history.replaceState(null, '', hashFor(route, next));
    },
    setTitle(sub) { if (token === mountSeq) $('view-sub').textContent = sub || ''; },
  };
  try {
    const out = await view.mount(el, ctx);
    if (token !== mountSeq) {
      if (typeof out === 'function') out();
      return;
    }
    current.cleanup = typeof out === 'function' ? out : null;
  } catch (e) {
    console.error(e);
    if (token === mountSeq) el.replaceChildren(ui.errorCard(e, { title: `${view.title} could not be shown`, retry: render }));
  }
}

// ---------------------------------------------------------------- header: deadline

const deadlineBox = $('deadline');

async function showDeadline() {
  try {
    const meta = await api.getMeta();
    if (!meta?.deadline_epoch) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    deadlineBox.replaceChildren(ui.icon('clock', { size: 15 }),
      h('span.deadline-gw', null, ui.fmt.gw(meta.next_gw)),
      ui.countdown(meta.deadline_epoch, { passed: 'deadline passed' }));
    deadlineBox.title = `${ui.fmt.gw(meta.next_gw)} deadline: ${ui.fmt.date(meta.deadline_epoch)} (${tz})`;
    deadlineBox.setAttribute('aria-label', deadlineBox.title);
    deadlineBox.hidden = false;
  } catch (e) {
    console.warn('meta unavailable', e);
  }
}

// ---------------------------------------------------------------- header: running jobs

// The app's one /api/jobs poller: each list is published to the views (api.watchJobs). The running-jobs
// pill links to Runs.
const jobsBox = $('jobs-ind');
let jobsTimer = 0;
let jobsSeq = 0;
let watching = new Map(); // id → label of jobs seen queued/running

function paintJobs(active) {
  jobsBox.hidden = !active.length;
  if (!active.length) return;
  const running = active.filter((j) => j.status === 'running').length;
  const queued = active.length - running;
  const text = [running && `${running} running`, queued && `${queued} queued`].filter(Boolean).join(', ');
  jobsBox.replaceChildren(h('span.pulse', { 'aria-hidden': 'true' }), text);
  jobsBox.title = `${text}: open Runs`;
}

async function refreshJobs() {
  clearTimeout(jobsTimer);
  const my = ++jobsSeq;
  let list;
  try {
    list = await api.listJobs();
  } catch (error) {
    if (my !== jobsSeq) return;
    api.publishJobs({ error });
    if (watching.size) jobsTimer = setTimeout(refreshJobs, 6000);
    return;
  }
  if (my !== jobsSeq) return;  // a newer refresh is on its way
  api.publishJobs({ jobs: list });
  // Forkcast's phone solves and bakes are background work here: no toasts, not in the header count
  const active = list.filter((j) => api.isActive(j) && !api.isPhone(j));
  for (const [id, label] of watching) {
    const j = list.find((x) => x.id === id);
    if (!j || api.isActive(j)) continue;
    // A view that shows this job already tells the user; otherwise announce it.
    if (document.querySelector(`[data-job-id="${CSS.escape(String(id))}"]`)) continue;
    const kind = { done: 'ok', error: 'error', cancelled: 'warn' }[j.status] || 'info';
    ui.toast(`${label} ${j.status === 'done' ? 'finished' : j.status}`, kind, {
      action: { label: 'Open', onClick: () => navigate('runs', { job: id }) },
    });
  }
  watching = new Map(active.map((j) => [j.id, j.label || j.kind || 'Job']));
  paintJobs(active);
  if (active.length) jobsTimer = setTimeout(refreshJobs, 3000);
}

addEventListener('fss:jobs', () => refreshJobs());
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshJobs(); });

// ---------------------------------------------------------------- errors & boot

let lastErr = { msg: '', at: 0 };
addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || String(e.reason);
  console.error(e.reason);
  if (msg === lastErr.msg && Date.now() - lastErr.at < 3000) return;
  lastErr = { msg, at: Date.now() };
  ui.toast(msg, 'error');
});

$('skip').addEventListener('click', () => viewRoot.focus());
addEventListener('hashchange', render);
applyTheme();
buildNav();
render();
showDeadline();
showShare();
refreshJobs();
