// Dashboard: TransferLab's dashboard on the solver's own data (GET /api/dashboard) plus the market,
// DGW/BGW, a ticker preview and data freshness. The entry box hands off to the planner.

import {
  h, card, statTile, countdown, fmt, icon, empty, errorCard, loading, toast, statusDot, statusInfo, pill, posName, toMs,
  humanise, entryId, recentEntryChips, gwInput,
} from '../ui.js';
import { ticker, modeSwitch, dgwBgwNote, gwCell, seasonLabel, group, int } from './fixtures.js';
import { addToCompare, COMPARE_MAX, XI, XI_TITLE } from './players.js';

const TZ_KEY = 'fss:dashTz'; // per-browser convenience; not part of the shared store

const localTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
function readTz() {
  try { return localStorage.getItem(TZ_KEY) || localTz(); } catch { return localTz(); }
}
function saveTz(tz) {
  try { tz === localTz() ? localStorage.removeItem(TZ_KEY) : localStorage.setItem(TZ_KEY, tz); } catch { /* storage blocked */ }
}
function dateIn(epoch, timeZone) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    }).format(toMs(epoch));
  } catch { return fmt.date(epoch); }
}

const owned = { label: 'owned', value: (r) => fmt.pct(r.sel_pct) };

// ---------------------------------------------------------------- pieces

/** Ranked player rows: name + status, club·pos·price, fixture chips, metrics, "+ compare". */
function playerList(ctx, rows, metrics, { fixture = true, rank = true, note, emptyText = 'Nothing to show.' } = {}) {
  if (!rows?.length) return empty(emptyText);
  return h('ol.dash-list', { class: { withfix: fixture } }, rows.map((r, i) => {
    const [ws, tone] = XI[r.ws_preview] || [];  // only the risky ones (a tone) get a badge
    return h('li.dash-item', null,
      rank ? h('span.dash-rank.num', null, i + 1) : null,
      h('div.dash-who', null,
        h('div.dash-name', null, h('span.truncate', { title: r.name }, r.name),
          statusDot(r.status, { chance: r.chance, news: r.news }),
          tone ? pill(ws, tone, { title: `${XI_TITLE}: ${ws}`, class: 'dash-ws' }) : null),
        h('div.dash-meta', null, [r.club, posName(r.pos), fmt.money(r.price)].filter(Boolean).join(' · ')),
        note?.(r) ? h('div.dash-note', null, note(r)) : null),
      h('div.dash-more', null,
        fixture ? h('div.dash-fix', null, gwCell(r.fixture, 'fdr')) : null,
        metrics.map((m) => h('div.dash-stat', { title: m.title?.(r) },
          h('b.num', { class: m.tone?.(r) }, m.value(r)), h('span', null, m.label)))),
      h('button.icon-btn.dash-add', {
        type: 'button', title: `Add ${r.name} to Compare`, 'aria-label': `Add ${r.name} to Compare`,
        onClick: () => addToCompare(ctx.state, r, ctx.navigate),
      }, icon('plus', { size: 16 })));
  }));
}

function hero(ctx) {
  const input = h('input.input.dash-entry', {
    type: 'text', inputmode: 'numeric', autocomplete: 'off', spellcheck: 'false', placeholder: 'e.g. 353468',
    'aria-label': 'Your FPL team ID', value: String(ctx.state.get('lastEntry') ?? ''),
  });
  const err = h('p.dash-entry-err', { role: 'alert' });
  const recent = h('div.dash-recent');
  const go = (raw) => {
    const id = entryId(raw);
    if (!id) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = 'Use the number from your team’s points page: fantasy.premierleague.com/entry/<ID>/event/…';
      input.focus();
      return;
    }
    ctx.state.set('lastEntry', id);
    ctx.navigate('planner', { entry: id });
  };
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); err.textContent = ''; });
  const el = card({
    className: 'dash-hero',
    body: [
      h('div.dash-hero-text', null,
        h('h2', null, 'Want the maths applied to your squad?'),
        h('p', null, 'Enter your FPL team ID and the solver plans your transfers, captain and chips over the coming gameweeks. Every setting is exposed and nothing is behind a paywall.')),
      h('div.dash-hero-form', null,
        h('form.dash-entry-form', { onSubmit: (e) => { e.preventDefault(); go(input.value); } },
          input, h('button.btn.primary.lg', { type: 'submit' }, icon('planner'), 'Plan my transfers')),
        err, recent,
        h('button.btn.ghost.sm.dash-noentry', { type: 'button', onClick: () => ctx.navigate('planner') }, 'Open the planner without a team', icon('arrow', { size: 14 }))),
    ],
  });
  el.fillRecent = (list, fallback) => {
    if (!input.value && fallback) input.value = String(fallback);
    recent.replaceChildren(...recentEntryChips(list, { limit: 5, onPick: go }));
  };
  return el;
}

function deadlineTile(d) {
  const tz = readTz();
  const when = h('span', null, dateIn(d.deadline_epoch, tz));
  const zones = [...new Set([localTz(), 'Europe/London', 'UTC', ...(Intl.supportedValuesOf?.('timeZone') || [])])];
  const sel = h('select.select.dash-tz', {
    'aria-label': 'Time zone',
    onChange: () => { saveTz(sel.value); when.textContent = dateIn(d.deadline_epoch, sel.value); },
  }, zones.map((z) => h('option', { value: z, selected: z === tz }, z === localTz() ? `${z} (local)` : z)));
  return statTile({
    label: `${fmt.gw(d.gw)} deadline`, icon: 'clock',
    value: d.deadline_epoch ? countdown(d.deadline_epoch, { passed: 'Passed' }) : fmt.dash,
    sub: d.deadline_epoch ? h('span.dash-when', null, when, sel) : 'No deadline in the data',
  });
}

function tiles(d) {
  const mc = d.model_captain;
  const tin = d.most_transferred_in?.[0];
  const by = d.flagged?.by_status || {};
  const named = ['i', 'd', 's'].reduce((a, k) => a + (by[k] || 0), 0);
  const parts = [[by.i, 'injured'], [by.d, 'doubtful'], [by.s, 'suspended']].filter(([n]) => n).map(([n, t]) => `${n} ${t}`);
  return h('div.grid-4.dash-tiles', null,
    deadlineTile(d),
    statTile({
      label: 'Model captain', icon: 'players', title: d.criteria?.model_captain,
      value: mc?.name ?? fmt.dash,
      sub: mc ? h('span.dash-tile-sub', null, h('b.num.gain', null, `${fmt.pts(mc.xp)} xP`), gwCell(mc.fixture, 'fdr'),
        h('span', null, [mc.club, fmt.money(mc.price)].join(' · '))) : 'No predictions for this gameweek',
    }),
    statTile({
      label: 'Most transferred in', icon: 'swap', title: d.criteria?.transfers,
      value: tin?.name ?? fmt.dash,
      sub: tin ? h('span.dash-tile-sub', null, h('b.num.gain', null, `+${fmt.compact(tin.transfers_in_event)}`), `this GW · ${fmt.pct(tin.sel_pct)} owned`) : null,
    }),
    statTile({
      label: 'Flagged players', icon: 'warn', tone: named ? 'warn' : null,
      title: [d.criteria?.flagged, by.u ? `${by.u} more unavailable (left the league)` : null].filter(Boolean).join(' · '),
      value: fmt.int(named),
      sub: parts.join(' · ') || 'Everyone is available',
    }));
}

function picksCard(ctx, d) {
  const picks = d.captain_picks || [];
  const poll = picks.some((r) => r.cap_share != null);
  return card({
    title: 'Captain picks', sub: d.criteria?.captain_picks,
    actions: picks.length >= 2 ? h('button.btn.sm', {
      type: 'button', title: `Put the top ${COMPARE_MAX} in Compare`,
      onClick: () => { ctx.state.set('compare', picks.slice(0, COMPARE_MAX).map((r) => Number(r.id))); ctx.navigate('compare'); },
    }, icon('compare', { size: 15 }), `Compare top ${COMPARE_MAX}`) : null,
    body: playerList(ctx, picks, [
      { label: `${fmt.gw(d.gw)} xP`, value: (r) => fmt.pts(r.xp) },
      owned,
      poll ? { label: 'poll', value: (r) => fmt.pct(r.cap_share), title: () => 'Captain-poll share' } : null,
    ].filter(Boolean), { emptyText: 'No predictions for this gameweek.' }),
  });
}

function diffsCard(ctx, d) {
  const h0 = d.horizon?.[0], h1 = d.horizon?.[d.horizon.length - 1];
  const rows = d.differentials || [];
  const cohort = rows.some((r) => r.top_own_pct != null);
  return card({
    title: 'Differentials', sub: d.criteria?.differentials,
    body: playerList(ctx, rows, [
      { label: h0 === h1 ? `${fmt.gw(h0)} xP` : `xP ${fmt.gw(h0)}–${h1}`, value: (r) => fmt.pts(r.xp_sum) },
      owned,
      cohort ? { label: 'top own', value: (r) => fmt.pct(r.top_own_pct), title: () => 'Ownership among the top managers (the solver’s ownership cohort)' } : null,
    ].filter(Boolean), { emptyText: 'No low-owned starters with predictions.' }),
  });
}

function marketCard(ctx, d) {
  const col = (title, rows, metric, emptyText) => h('div.dash-col', null,
    h('h3.dash-col-title', null, title), playerList(ctx, rows, [metric, owned], { fixture: false, emptyText }));
  const pctMetric = {
    label: 'FPL pred.', value: (r) => `${fmt.signed(r.price_change_pct)}%`,
    tone: (r) => (r.price_change_pct > 0 ? 'gain' : 'loss'), title: () => 'FPL’s price-change projection (offset 0)',
  };
  const nextChange = d.next_price_change_epoch;
  return card({
    title: 'Transfer market',
    sub: [d.criteria?.transfers, d.criteria?.prices].filter(Boolean).join(' · '),
    actions: nextChange ? h('span.dash-next-change', { title: dateIn(nextChange, readTz()) },
      'Next price update:', countdown(nextChange, { passed: 'due now' })) : null,
    body: h('div.dash-market', null,
      col('Most transferred in', d.most_transferred_in,
        { label: 'in', value: (r) => `+${fmt.compact(r.transfers_in_event)}`, tone: () => 'gain' }, 'No transfer data.'),
      col('Most transferred out', d.most_transferred_out,
        { label: 'out', value: (r) => `−${fmt.compact(r.transfers_out_event)}`, tone: () => 'loss' }, 'No transfer data.'),
      col('Price risers', d.price_risers, pctMetric, d.live ? 'No projected rises.' : 'Price projections are live data only.'),
      col('Price fallers', d.price_fallers, pctMetric, d.live ? 'No projected falls.' : 'Price projections are live data only.')),
  });
}

function flaggedCard(ctx, d) {
  const all = d.flagged?.players || [];
  const SHOW = 8;
  const list = h('div');
  let open = false;
  const toggle = all.length > SHOW ? h('button.btn.sm.ghost', { type: 'button', onClick: () => { open = !open; paint(); } }) : null;
  const paint = () => {
    list.replaceChildren(playerList(ctx, open ? all : all.slice(0, SHOW), [owned], {
      fixture: false, rank: false, emptyText: 'Nobody is flagged.',
      note: (r) => r.news || statusInfo(r.status, r.chance).label,
    }));
    if (toggle) toggle.textContent = open ? 'Show fewer' : `Show all ${all.length}`;
  };
  paint();
  return card({
    title: 'Flagged players', sub: `${fmt.int(d.flagged?.count)} not fully available · most owned first`,
    actions: toggle, body: list,
  });
}

function lastGwCard(d) {
  const L = d.last_gw;
  if (!L) return card({ title: 'Last gameweek', body: empty('No gameweek has been played yet.') });
  const picks = Object.entries(L).filter(([k, v]) => k !== 'gw' && k !== 'average' && v && typeof v === 'object');
  return card({
    title: `Last gameweek · ${fmt.gw(L.gw)}`,
    body: h('div.stack.tight', null,
      h('div.dash-avg', null, h('span.muted', null, 'Average score'), h('b.num', null, L.average ?? fmt.dash)),
      picks.length ? h('ul.list.dash-facts', null, picks.map(([k, v]) =>
        h('li', null, h('span.muted', null, humanise(k)), h('span.spacer'), h('strong', null, v.name ?? `#${v.id}`)))) : null),
  });
}

function freshnessBar(rows) {
  if (!rows?.length) return null;
  const tone = { ok: 'ok', stale: 'warn', missing: 'bad' };
  const bad = rows.filter((r) => r.status !== 'ok').length;
  return h('div.dash-fresh', { role: 'group', 'aria-label': 'Data freshness' },
    h('a.dash-fresh-label', { href: '#/data' }, bad
      ? `${bad} data source${bad > 1 ? 's need' : ' needs'} attention · ${rows.length - bad} fresh`
      : `All ${rows.length} data sources fresh`),
    rows.map((r) => h('a.dash-badge', {
      href: '#/data', class: r.status,
      title: [`${r.source}: ${r.status}`, r.note, r.mtime_epoch ? `updated ${fmt.date(r.mtime_epoch)}` : 'no file', r.path].filter(Boolean).join('\n'),
    }, h('span.sdot', { class: tone[r.status] || 'warn', 'aria-hidden': 'true' }), r.source,
    h('span.dash-age', null, r.mtime_epoch ? fmt.ago(r.mtime_epoch) : r.status))));
}

function tickerCard(ctx, fxP) {
  let mode = 'fdr';
  let data = null;
  const body = h('div', null, loading('Loading fixtures…'));
  const paint = () => {
    if (!data) return;
    const g = data.gws || [];
    if (g.length) el.querySelector('.card-sub').textContent = `${fmt.gw(g[0])}${g.length > 1 ? `–${fmt.gw(g[g.length - 1])}` : ''} · best fixtures first`;
    body.replaceChildren(...[dgwBgwNote(data), ticker(data, mode, { compact: true })].filter(Boolean));
  };
  const el = card({
    title: 'Fixture ticker', sub: 'Next 6 gameweeks, best fixtures first',
    actions: [modeSwitch(mode, (m) => { mode = m; paint(); }),
      h('button.btn.sm', {
        type: 'button', onClick: () => ctx.navigate('fixtures', { season: ctx.params.season, from: ctx.params.gw, view: mode !== 'fdr' ? mode : undefined }),
      }, 'Full ticker', icon('arrow', { size: 14 }))],
    body,
  });
  fxP.then((d) => { data = d; paint(); })
    .catch((e) => body.replaceChildren(errorCard(e, { title: 'Fixtures could not be loaded' })));
  return el;
}

// ---------------------------------------------------------------- view

export default {
  route: 'dashboard',
  title: 'Dashboard',
  icon: 'dashboard',
  async mount(el, ctx) {
    const { api, params } = ctx;
    let dead = false;
    let seq = 0;
    const st = { season: Number(params.season) || null, gw: int(params.gw), pool: params.pool || '' };

    const heroEl = hero(ctx);
    const bar = h('div.dash-bar');
    const body = h('div.stack', null, loading('Loading the dashboard…'));
    el.append(heroEl, bar, body);

    const metaP = api.getMeta().catch(() => null);
    metaP.then((meta) => {
      if (dead) return;
      api.getRecentEntries({ season: st.season ?? meta?.season }).catch(() => [])
        .then((list) => { if (!dead) heroEl.fillRecent(list, meta?.last_entry); });
    });

    function controls(meta, d) {
      if (!meta) return [];
      const seasonSel = meta.seasons?.length > 1 ? h('select.select', {
        'aria-label': 'Season',
        onChange: (e) => {
          st.season = +e.target.value === meta.season ? null : +e.target.value;
          st.gw = st.season == null ? null : 1;  // a past season starts at GW1, not its last round (as Fixtures)
          load();
        },
      }, meta.seasons.slice().reverse().map((s) => h('option', { value: s, selected: s === (st.season ?? meta.season) }, seasonLabel(s)))) : null;
      const listId = 'dash-pools';
      const pools = (meta.pools || []).filter((p) => !p.archived);
      const poolIn = h('input.input.mono.dash-pool', {
        type: 'text', list: listId, value: st.pool, spellcheck: 'false', autocomplete: 'off',
        placeholder: meta.default_pool || 'default pool', 'aria-label': 'Prediction pool',
        title: `Prediction pool the xP numbers come from, as the solver's --dir ("prod" = the production dirs). Empty = the season default, ${meta.default_pool}.`,
      });
      poolIn.addEventListener('change', () => {
        const v = poolIn.value.trim();
        const known = new Set((meta.pools || []).map((p) => p.name));
        const bad = v.split(',').map((x) => x.trim()).filter((x) => x && !known.has(x));
        if (bad.length) {
          poolIn.setAttribute('aria-invalid', 'true');
          toast(`Unknown prediction pool: ${bad.join(', ')}`, 'warn');
          return;
        }
        poolIn.removeAttribute('aria-invalid');
        st.pool = v === meta.default_pool ? '' : v;
        load();
      });
      const gwIn = gwInput({
        get: () => st.gw, onChange: (gw) => { st.gw = gw ?? null; load(); }, max: meta.last_fixture_round || 38,
        placeholder: String(d?.gw ?? 'next'), 'aria-label': 'Gameweek', title: 'Blank = the next deadline (the last round for a past season)',
      });
      return [
        seasonSel ? group('Season', seasonSel) : null,
        group('Gameweek', gwIn),
        group('Predictions', poolIn, h('datalist', { id: listId }, pools.map((p) =>
          h('option', { value: p.name }, `${p.n_files} files · ${fmt.ago(p.mtime)}${p.is_default ? ' · default' : ''}`)))),
        d ? h('span.dash-pool-now.small.muted', null, `using ${d.pool}`) : null,
      ];
    }

    async function load() {
      const my = ++seq;
      const meta = await metaP;
      if (dead || my !== seq) return;
      if (!(st.gw >= 1 && st.gw <= (meta?.last_fixture_round || 38))) st.gw = null;  // blank, or a bad ?gw= link
      const q = { season: st.season ?? undefined, gw: st.gw ?? undefined };
      ctx.setParams({ ...q, pool: st.pool || undefined });
      body.replaceChildren(loading('Loading the dashboard…'));
      const fxP = api.getFixtures({ season: q.season, from: q.gw, n: 6 });
      fxP.catch(() => {}); // handled by the ticker card
      let d;
      try {
        d = await api.getDashboard({ ...q, pool: st.pool || undefined });
      } catch (e) {
        if (dead || my !== seq) return;
        bar.replaceChildren(h('div.row.dash-controls', null, controls(meta, null)));
        body.replaceChildren(errorCard(e, { title: 'The dashboard could not be loaded', retry: load }));
        return;
      }
      if (dead || my !== seq) return;
      ctx.setTitle(`${fmt.gw(d.gw)} · ${seasonLabel(d.season)}`);
      bar.replaceChildren(freshnessBar(d.freshness) || h('span'), h('div.row.dash-controls', null, controls(meta, d)));
      const notes = [
        d.live === false ? h('div.callout.info', null, icon('info'),
          h('span', null, `Showing ${fmt.gw(d.gw)} of ${seasonLabel(d.season)}: prices, ownership and transfers come from the stats file at that gameweek, not live FPL data.`)) : null,
        dgwBgwNote(d.dgw_bgw),
      ].filter(Boolean);
      body.replaceChildren(
        tiles(d),
        ...notes,
        h('div.grid-2', null, picksCard(ctx, d), diffsCard(ctx, d)),
        marketCard(ctx, d),
        tickerCard(ctx, fxP),
        h('div.grid-2.dash-bottom', null, flaggedCard(ctx, d), lastGwCard(d)));
    }

    await load();
    return () => { dead = true; };
  },
};
