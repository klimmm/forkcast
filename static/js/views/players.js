// Players: every player's projected points per GW (fixtures under each value, seed spread on hover) or
// season stats. Filters persist in state.playersFilters; sorting runs over the whole filtered list and
// the table shows it a page at a time. "+" adds to Compare; lock / ban write the planner's
// --must-have / --exclude values. Also exports the helpers Compare shares.

import * as api from '../api.js';
import {
  h, append, card, table, segmented, field, flagControl, statusDot, statusInfo, heatCell, icon, toast,
  loading, errorCard, download, fmt, norm, fin, POS, compareValues, gwInput, readNum, uid,
} from '../ui.js';
import { applyMark, idsOf, DEST } from '../marks.js';
import { fixtureText, fixtureLabel, fixtureTitle } from './fixtures.js';

export const COMPARE_MAX = 4;
/** Compare's player ids: whole numbers above 0, each once (the store keeps the newest COMPARE_MAX). */
export const compareIds = (list) => [...new Set((list || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
const PAGE = 100;
const FILTERS = { q: '', pos: 'all', club: '', status: 'any', maxPrice: null, ownMin: null, ownMax: null, buyable: false };
const DEFAULTS = { ...FILTERS, mode: 'proj', all: false, season: undefined, gw: undefined, pool: undefined, sortKey: 'xp_sum', sortDir: 'desc' };
const DEFAULT_SORT = { proj: 'xp_sum', season: 'season_pts' };
const STATUS = [['any', 'Any status'], ['ok', 'Available'], ['flagged', 'Flagged'], ['warn', 'Doubtful'], ['bad', 'Out']];
export const LUCK_FREE = 'Points with finishing luck taken out: goals, assists, clean sheets and goals conceded '
  + 'replaced by their expectations from the match xG / xA / xGC (solver player_data.expected_points)';

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
export const filtersOf = (state) => ({ ...DEFAULTS, ...(state.get('playersFilters') || {}) });
/** The {season, gw, pool} the Players table shows; Compare reads the same so both agree. */
export function sourceOf(state) {
  const { season, gw, pool } = filtersOf(state);
  return { season, gw, pool };
}


/** Adds the derived fields both views show (mutates the freshly fetched rows). */
export function prepRows(d) {
  const clubs = new Map((d.teams || []).map((t) => [t.id, t.name]));
  for (const r of d.players || []) {
    r.xp_per_m = fin(r.xp_sum) && r.price > 0 ? round(r.xp_sum / r.price, 3) : null;
    r.net_tx = fin(r.transfers_in_event) ? r.transfers_in_event - (r.transfers_out_event || 0) : null;
    r.pts90 = r.minutes >= 90 ? round((r.season_pts * 90) / r.minutes, 2) : null;
    r._q = norm(`${r.name} ${r.club} ${clubs.get(r.club_id) || ''}`);
  }
  return d;
}

const span = (hz, gw) => (hz?.length > 1 ? `GW${hz[0]}–${hz[hz.length - 1]}` : fmt.gw(hz?.[0] ?? gw));
export function describeSource(d) {
  const pool = d.pool_dir && d.pool_dir !== d.pool ? `${d.pool} (${d.pool_dir.split(',').join(', ')})` : d.pool;
  const n = d.n_seeds;
  return `Season ${d.season} · ${span(d.horizon, d.gw)} · pool ${pool}${fin(n) ? ` · ${n} seed file${n === 1 ? '' : 's'}` : ''}`;
}

export const signedCompact = (v) => (fin(v) ? `${v > 0 ? '+' : ''}${fmt.compact(v)}` : fmt.dash);

/** One FDR-coloured tag per fixture in a GW (two in a double, "blank" in a blank): the ticker's chip text, smaller. */
export function fixtureTags(list) {
  if (!list?.length) return h('span.pv-fx.blank', { title: 'No fixture (blank gameweek)' }, 'blank');
  return h('span.pv-fx', null, list.map((f) => heatCell(f.fdr, 'fdr', { text: fixtureLabel(f), title: fixtureTitle(f) })));
}

/** Hover text for one xP value: fixture, xP and the spread across the pool's seed files. */
export function xpTitle(r, i, g, nSeeds) {
  const sd = r.xp_sd?.[i];
  return [
    `GW${g} ${fixtureText(r.fixtures?.[i])}`,
    `xP ${fmt.num(r.xp?.[i], 2)}`,
    fin(sd)
      ? `seed sd ${fmt.num(sd, 2)}, range ${fmt.num(r.xp_lo?.[i], 2)}–${fmt.num(r.xp_hi?.[i], 2)} over ${nSeeds} seed files`
      : 'no seed spread (fewer than 2 seed values)',
  ].join(' · ');
}

// WhoScored's predicted line-up for the first fixture (solver data_io/data.py ws_preview): code → [label, tone].
export const XI = { S: ['start', ''], DS: ['doubt · XI', 'warn'], D: ['doubtful', 'warn'], B: ['bench', 'warn'], O: ['out', 'loss'] };
const XI_ORDER = { S: 0, DS: 1, D: 2, B: 3, O: 4 };
export const XI_TITLE = 'WhoScored predicted line-up for the first fixture of the GW';
export const xiText = (code) => XI[code]?.[0] ?? null;
const xiTag = (code) => (XI[code] ? h('span.pv-xi', { class: XI[code][1] }, XI[code][0]) : h('span.muted', null, fmt.dash));

/** Add a player to Compare (state.compare); refuses a fifth player, and says so when he is already in. */
export function addToCompare(state, p, navigate) {
  const ids = state.get('compare', []);
  const id = Number(p.id);
  const open = { label: 'Open Compare', onClick: () => navigate('compare') };
  if (ids.includes(id)) return toast(`${p.name} is already in Compare`, 'info', { action: open });
  if (ids.length >= COMPARE_MAX) return toast(`Compare holds ${COMPARE_MAX} players: remove one first`, 'warn', { action: open });
  state.set('compare', [...ids, id]);
  toast(`${p.name} added to Compare (${ids.length + 1}/${COMPARE_MAX})`, 'ok', { timeout: 2500, action: open });
}

/** Remove a player from Compare, or add him (addToCompare). */
export function toggleCompare(state, p, navigate) {
  const ids = state.get('compare', []);
  if (ids.includes(Number(p.id))) return state.set('compare', ids.filter((x) => x !== Number(p.id)));
  addToCompare(state, p, navigate);
}

// ---------------------------------------------------------------- planner locks / bans
// state.planner.values is the planner's single source of truth (planner.js header); the lock / ban
// buttons here edit its --must-have / --exclude there (marks.js).

export function plannerMarks(state) {
  const values = state.get('planner')?.values || {};
  return { lock: new Set(idsOf(values[DEST.lock])), ban: new Set(idsOf(values[DEST.ban])) };
}

function setMark(state, id, kind, on) {
  state.set('planner', (prev) => ({ ...prev, values: applyMark(prev?.values || {}, kind, id, on) }));
}

// ---------------------------------------------------------------- table

/** ui.table's order over the whole filtered list, so each page is the table's own top slice. */
function sortRows(rows, col, dir) {
  if (!col) return rows;
  const val = typeof col.sort === 'function' ? col.sort : (r) => r[col.key];
  const sign = dir === 'asc' ? 1 : -1;
  return rows.map((r) => [r, val(r)]).sort(([, a], [, b]) => compareValues(a, b, sign)).map(([r]) => r);
}

function columns(mode, d, view) {
  const S = d.sources || {};
  const hz = d.horizon || [];
  const lead = [
    { key: 'name', label: 'Player', render: view.playerCell, csv: (r) => r.name },
    { key: 'pos', label: 'Pos', sort: (r) => POS.indexOf(r.pos), fmt: (v) => v ?? fmt.dash },
    { key: 'price', label: '£m', num: true, fmt: (v) => fmt.num(v, 1), title: S.market },
    { key: 'sel_pct', label: 'Own%', num: true, fmt: (v) => fmt.num(v, 1), title: 'Selected by (overall FPL ownership, %)' },
  ];
  const plan = {
    key: 'plan', label: 'Plan', sort: view.markRank, render: view.planCell, csv: false,
    title: 'Lock in (--must-have) or ban (--exclude) for the Planner',
  };
  if (mode === 'season') {
    return [...lead,
      d.cohort_known && { key: 'top_own_pct', label: 'Top own%', num: true, fmt: (v) => fmt.num(v, 1), title: S.top_own_pct },
      { key: 'season_pts', label: 'Pts', num: true, title: `FPL points before GW${d.gw}` },
      { key: 'season_xpts', label: 'Luck-free', num: true, fmt: (v) => fmt.num(v, 1), title: LUCK_FREE },
      { key: 'minutes', label: 'Mins', num: true, fmt: (v) => fmt.int(v) },
      { key: 'pts90', label: 'Pts/90', num: true, fmt: (v) => fmt.num(v, 1), title: 'Points per 90 minutes (90+ minutes played)' },
      { key: 'form', label: 'Form', num: true, fmt: (v) => fmt.num(v, 1), title: S.form },
      { key: 'starts60', label: 'Starts', num: true, fmt: (v, r) => (fin(v) ? `${v}/${r.games4 ?? '?'}` : fmt.dash), title: S.form },
      { key: 'net_tx', label: 'Net xfers', num: true, fmt: signedCompact, title: 'FPL transfers in minus out this GW' },
      { key: 'price_change_pct', label: 'Price Δ', num: true, title: S.market,
        render: (r) => (fin(r.price_change_pct) ? h('span', { class: r.price_change_pct > 0 ? 'gain' : r.price_change_pct < 0 ? 'loss' : '' }, `${fmt.signed(r.price_change_pct)}%`) : fmt.dash) },
      d.poll_known && { key: 'cap_share', label: 'Cap%', num: true, fmt: (v) => fmt.num(v, 1), title: S.cap_share },
      plan].filter(Boolean);
  }
  return [...lead,
    { key: 'ws_preview', label: 'XI', sort: (r) => XI_ORDER[r.ws_preview], render: (r) => xiTag(r.ws_preview), csv: (r) => xiText(r.ws_preview), title: XI_TITLE },
    ...hz.map((g, i) => ({
      key: `gw${g}`, label: `GW${g}`, num: true, className: 'pv-gw', sort: (r) => r.xp?.[i],
      render: (r) => h('div.pv-xp', { title: xpTitle(r, i, g, d.n_seeds) }, h('span.pv-xp-v', null, fmt.pts(r.xp?.[i])), fixtureTags(r.fixtures?.[i])),
      csv: (r) => r.xp?.[i], csvLabel: `GW${g} xP`, title: `Expected points in GW${g}; hover a value for its seed spread`,
    })),
    { key: 'xp_sum', label: 'Sum', num: true, className: 'pv-sum', fmt: (v) => fmt.pts(v), title: `xP summed over ${span(hz, d.gw)}` },
    { key: 'xp_per_m', label: 'xP/£m', num: true, fmt: (v) => fmt.num(v, 2), title: `xP over ${span(hz, d.gw)} per £m of price` },
    d.players?.some((r) => r.act != null) && { key: 'act', label: `Pts GW${d.gw}`, num: true, title: `Actual FPL points in GW${d.gw}` },
    plan].filter(Boolean);
}

function matches(r, f, q) {
  const tone = f.status === 'any' ? null : statusInfo(r.status, r.chance).tone;
  return (f.pos === 'all' || r.pos === f.pos)
    && (!f.club || String(r.club_id) === String(f.club))
    && (!tone || (f.status === 'flagged' ? tone !== 'ok' : tone === f.status))
    && (!fin(f.maxPrice) || (r.price ?? 0) <= f.maxPrice + 1e-9)
    && (!fin(f.ownMin) || (r.sel_pct ?? 0) >= f.ownMin)
    && (!fin(f.ownMax) || (r.sel_pct ?? 0) <= f.ownMax)
    && (!f.buyable || r.buyable)
    && (!q || r._q.includes(q));
}

const debounce = (fn, ms = 150) => {
  let t = 0;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

// ---------------------------------------------------------------- view

export default {
  route: 'players',
  title: 'Players',
  icon: 'players',
  mount(el, ctx) {
    const { state, navigate, setTitle } = ctx;
    let f = filtersOf(state);
    let d = null;
    let cols = [];
    let tbl = null;
    let rows = [];  // filtered, in the global sort order
    let limit = PAGE;
    let seq = 0;
    let marks = plannerMarks(state);
    let cmp = state.get('compare', []);
    const save = (patch) => { f = { ...f, ...patch }; state.set('playersFilters', f); };

    const view = {
      playerCell(r) {
        const on = cmp.includes(r.id);
        const st = statusInfo(r.status, r.chance);
        return h('div.pv-player', null,
          h('button.icon-btn.pv-add', {
            type: 'button', class: { on }, 'aria-pressed': String(on),
            title: on ? 'Remove from Compare' : 'Add to Compare', 'aria-label': `${on ? 'Remove' : 'Add'} ${r.name} ${on ? 'from' : 'to'} Compare`,
            onClick: () => toggleCompare(state, r, navigate),
          }, icon(on ? 'check' : 'plus', { size: 15 })),
          h('div.pv-who', null,
            h('div.pv-name', null, h('span.truncate', null, r.name), statusDot(r.status, { chance: r.chance, news: r.news })),
            h('div.pv-meta', null, r.club, st.tone !== 'ok' ? h('span', { class: st.tone === 'bad' ? 'loss' : 'warn', title: r.news || null }, ` · ${st.label}`) : null)));
      },
      planCell(r) {
        const btn = (kind, ic, on, label) => h(`button.icon-btn.pv-${kind}`, {
          type: 'button', class: { on }, 'aria-pressed': String(on), title: `${label}${on ? ' (on: click to clear)' : ''}`,
          'aria-label': `${label}: ${r.name}`,
          onClick: () => {
            setMark(state, r.id, kind, !on);
            if (!on) toast(`${r.name} ${kind === 'lock' ? 'locked in' : 'banned'} for the Planner`, 'ok', { timeout: 2500, action: { label: 'Open Planner', onClick: () => navigate('planner') } });
          },
        }, icon(ic, { size: 15 }));
        return h('div.pv-plan', null,
          btn('lock', 'lock', marks.lock.has(r.id), 'Lock in for the Planner (--must-have)'),
          btn('ban', 'ban', marks.ban.has(r.id), 'Ban for the Planner (--exclude)'));
      },
      markRank: (r) => (marks.lock.has(r.id) ? 2 : marks.ban.has(r.id) ? 1 : null),
    };
    const rowClass = (r) => [marks.lock.has(r.id) && 'pv-locked', marks.ban.has(r.id) && 'pv-banned'];

    // -------- filters
    const search = h('input.input', { type: 'search', placeholder: 'Search player or club', value: f.q, 'aria-label': 'Search players' });
    search.addEventListener('input', debounce(() => { save({ q: search.value }); apply(); }, 120));
    const posSeg = segmented({
      label: 'Position', value: f.pos, onChange: (v) => { save({ pos: v }); apply(); },
      items: [{ key: 'all', label: 'All' }, ...POS.map((p) => ({ key: p, label: p }))],
    });
    const clubSel = h('select.select', { onChange: () => { save({ club: clubSel.value }); apply(); } }, h('option', { value: '' }, 'All clubs'));
    const statusSel = h('select.select', { onChange: () => { save({ status: statusSel.value }); apply(); } },
      STATUS.map(([k, label]) => h('option', { value: k }, label)));
    statusSel.value = f.status;
    const numIn = (key, attrs) => {
      const inp = h('input.input.num.pv-num', { type: 'number', inputmode: 'decimal', step: 0.1, min: 0, placeholder: 'any', value: f[key] ?? '', ...attrs });
      inp.addEventListener('input', debounce(() => {
        const { bad, n } = readNum(inp);
        if (bad) return;  // half-typed ('1e', '-'): keep the last filter
        save({ [key]: fin(n) ? n : null });
        apply();
      }));
      return inp;
    };
    const check = (key, label, onChange) => {
      const box = h('input', { type: 'checkbox', checked: Boolean(f[key]), onChange: () => { save({ [key]: box.checked }); onChange(); } });
      return h('label.check', null, box, label);
    };
    const buyable = check('buyable', 'Buyable only', () => apply());
    const all = check('all', 'Include players with no forecast', () => load());
    all.title = 'By default only players the pool forecasts are listed';
    const resetBtn = h('button.btn.sm.ghost', {
      type: 'button', title: 'Clear the filters (keeps the view, source and sort)',
      onClick: () => { save(FILTERS); navigate('players'); },
    }, icon('reset', { size: 14 }), 'Reset filters');

    // -------- source (season / anchor GW / pool): the planner's own flag widgets
    const srcSummary = h('span.truncate', null, 'Data source');
    const srcBody = h('div.pv-src-grid', null, loading('Loading settings…'));
    const srcBox = h('details.pv-src', null, h('summary', null, icon('data', { size: 15 }), srcSummary), srcBody);
    const gwId = uid('pv-gw');
    const gwIn = gwInput({ id: gwId, get: () => f.gw, onChange: (gw) => { save({ gw }); load(); } });
    api.getFlags().then((cat) => {
      const flag = (dest) => cat?.flags?.find((x) => x.dest === dest);
      const season = flag('season');
      const dir = flag('dir');
      srcBody.replaceChildren();
      append(srcBody,
        season ? flagControl(season, f.season, (v) => { save({ season: v, gw: undefined }); gwIn.value = ''; load(); }) : null,
        h('div.flag', null,
          h('div.flag-head', null, h('label.flag-label', { htmlFor: gwId }, 'First gameweek shown')),
          gwIn,
          h('span.field-hint', null, 'The forecast anchor: xP columns start here. Blank = the next deadline.')),
        dir ? flagControl(dir, f.pool, (v) => { save({ pool: v }); load(); }) : null);
    }).catch((e) => srcBody.replaceChildren(h('p.muted.small', null, `Source settings unavailable: ${e.message}`)));

    // -------- layout
    const modeSeg = segmented({
      label: 'Columns', value: f.mode, onChange: (v) => { save({ mode: v }); if (d) build(); },
      items: [{ key: 'proj', label: 'Projections' }, { key: 'season', label: 'Season stats' }],
    });
    const csvBtn = h('button.btn.sm.ghost', { type: 'button', onClick: exportCsv, disabled: true }, icon('download', { size: 15 }), 'Download CSV');
    const subEl = h('span', null, 'Loading…');
    const count = h('span.pv-count');
    const tray = h('div.pv-tray', { hidden: true });
    const host = h('div.pv-host');
    const pager = h('div.pv-pager');
    el.append(card({
      title: 'Players', sub: subEl, className: 'pv-card', actions: [modeSeg, csvBtn],
      body: [
        h('div.pv-filters', null,
          h('div.pv-frow', null, h('div.search-box', null, icon('search', { size: 16 }), search), posSeg),
          h('div.pv-frow', null,
            field('Club', clubSel), field('Status', statusSel),
            field('Max price £m', numIn('maxPrice', { min: 3.5, max: 20 })),
            field('Own % at least', numIn('ownMin', { max: 100 })),
            field('Own % at most', numIn('ownMax', { max: 100 })),
            h('div.pv-checks', null, buyable, all),
            resetBtn),
          srcBox),
        h('div.pv-tools', null, count, h('span.spacer'), tray),
        host, pager,
      ],
    }));

    function fillClubs() {
      clubSel.replaceChildren(h('option', { value: '' }, 'All clubs'),
        ...(d.teams || []).map((t) => h('option', { value: String(t.id) }, `${t.short} · ${t.name}`)));
      const known = d.teams?.some((t) => String(t.id) === String(f.club));
      clubSel.value = known ? String(f.club) : '';
    }

    function paintTray() {
      const name = (id) => d?.players?.find((p) => p.id === id)?.name ?? `#${id}`;
      tray.hidden = !cmp.length;
      tray.replaceChildren(
        h('span.muted.small', null, `Compare ${cmp.length}/${COMPARE_MAX}`),
        ...cmp.map((id) => h('span.chip', null, name(id), h('button.chip-x', {
          type: 'button', 'aria-label': `Remove ${name(id)} from Compare`,
          onClick: () => state.set('compare', (prev) => (prev || []).filter((x) => x !== id)),
        }, icon('close', { size: 12 })))),
        h('a.btn.sm.primary', { href: '#/compare' }, 'Compare', icon('arrow', { size: 14 })));
    }

    async function load() {
      const my = ++seq;
      d = null;
      tbl = null;
      csvBtn.disabled = true;
      host.replaceChildren(loading('Loading players…'));
      pager.replaceChildren();
      count.textContent = '';
      try {
        const res = prepRows(await api.getPlayers({ season: f.season, gw: f.gw, pool: f.pool, all: f.all }));
        if (my !== seq) return;
        d = res;
        subEl.textContent = describeSource(d);
        srcSummary.textContent = `Source: ${describeSource(d)}`;
        gwIn.placeholder = String(d.gw);
        buyable.title = d.sources?.buyable || '';
        fillClubs();
        paintTray();
        build();
      } catch (e) {
        if (my !== seq) return;
        subEl.textContent = 'Not loaded';
        host.replaceChildren(errorCard(e, { title: 'Players could not be loaded', retry: load }));
        srcBox.open = true;  // a bad season / GW / pool is the usual cause
      }
    }

    function build() {
      cols = columns(f.mode, d, view);
      if (!cols.some((c) => c.key === f.sortKey)) save({ sortKey: DEFAULT_SORT[f.mode], sortDir: 'desc' });
      tbl = table({
        columns: cols, rows: [], sortKey: f.sortKey, sortDir: f.sortDir, csv: false, stickyFirst: true, dense: true,
        maxHeight: 'min(74vh, 980px)', empty: 'No players match these filters.', rowClass, caption: 'Players',
      });
      tbl.classList.add('pv-table');
      // ui.table sorts only the page it holds: take its new sort and re-page the whole list.
      tbl.addEventListener('click', (e) => {
        if (!e.target.closest('.th-btn')) return;
        const th = tbl.querySelector('thead th[aria-sort]');
        const c = th && cols[th.cellIndex];
        if (!c) return;
        save({ sortKey: c.key, sortDir: th.getAttribute('aria-sort') === 'ascending' ? 'asc' : 'desc' });
        apply(false);
      });
      host.replaceChildren(tbl);
      csvBtn.disabled = false;
      apply();
    }

    function apply(newPage = true) {
      if (!tbl) return;
      const q = norm(f.q.trim());
      rows = sortRows(d.players.filter((r) => matches(r, f, q)), cols.find((c) => c.key === f.sortKey), f.sortDir);
      if (newPage) limit = PAGE;
      paint();
    }

    function paint() {
      if (!tbl) return;
      const n = rows.length;
      const total = d.players.length;
      const shown = Math.min(limit, n);
      tbl.update(rows.slice(0, shown));
      count.textContent = `${n === total ? `${n}` : `${n} of ${total}`} players`;
      pager.replaceChildren(...(shown < n ? [
        h('span.muted.small', null, `Showing ${shown} of ${n}`),
        h('button.btn.sm', { type: 'button', onClick: () => { limit += PAGE; paint(); } }, `Show ${Math.min(PAGE, n - shown)} more`),
        h('button.btn.sm.ghost', { type: 'button', onClick: () => { limit = n; paint(); } }, `Show all ${n}`),
      ] : []));
      setTitle(`${span(d.horizon, d.gw)} · ${n} player${n === 1 ? '' : 's'}`);
    }

    function exportCsv() {
      if (!d || !tbl) return;
      const hz = f.mode === 'proj' ? d.horizon || [] : [];
      const csvCols = [
        { key: 'id', label: 'ws_id' }, { key: 'fpl_id', label: 'fpl_id' }, { key: 'club', label: 'Club' },
        ...cols, ...hz.map((g, i) => ({ key: `fx${g}`, label: `GW${g} fixture`, csv: (r) => fixtureText(r.fixtures?.[i]) })),
        // a detached table only for its CSV writer: drop the cell renderers so it stays cheap
      ].map(({ render, fmt: _fmt, ...c }) => c);
      const name = `players_${d.season}_gw${d.gw}${f.mode === 'season' ? '_season' : ''}.csv`;
      download(name, table({ columns: csvCols, rows, csv: false }).toCSV());
    }

    const unsubs = [
      state.subscribe('compare', (next) => { cmp = next || []; paintTray(); paint(); }),
      state.subscribe('planner', () => { marks = plannerMarks(state); paint(); }),
    ];
    load();
    return () => unsubs.forEach((u) => u());
  },
};
