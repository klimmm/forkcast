// Fixtures: the full ticker (FDR / Attack / Defence) over a GW range, with DGW/BGW handling.
// The ticker pieces are exported for the dashboard's preview.
//
// Data: GET /api/fixtures → teams[].rows[gwIndex] = [{opp, home, fdr, att, def}] (0 = blank, 2 = double).
// att/def come from api/data.py _ticker: the opponent's realised xG conceded / scored per match
// over the GWs played before `from` — derived data, not a model rating.

import {
  h, append, card, table, heatCell, segmented, icon, fmt, empty, errorCard, loading, fin,
} from '../ui.js';

export const MODES = {
  fdr: { label: 'FDR', high: false, d: 0, sort: 'avg', what: 'FPL difficulty' },
  att: { label: 'Attack', high: true, d: 2, sort: 'sum', what: 'opp. xG conceded / match' },
  def: { label: 'Defence', high: false, d: 2, sort: 'avg', what: 'opp. xG scored / match' },
};
const RANGE = [3, 6, 8, 10, 38]; // 38 = rest of the season (the server stops at the last fixture)

const mean = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
export const seasonLabel = (s) => (fin(+s) ? `${s}/${String((+s + 1) % 100).padStart(2, '0')}` : '');
const venue = (f) => (f.home ? 'H' : 'A');
/** "LEE (H)": a fixture as every chip and export shows it. */
export const fixtureLabel = (f) => `${f.opp} (${venue(f)})`;
/** "Leeds (home) · FDR 3": a fixture chip's hover text (`opp` = the full club name when known). */
export const fixtureTitle = (f, opp = f.opp) => `${opp} (${f.home ? 'home' : 'away'}) · FDR ${f.fdr ?? fmt.dash}`;
/** A GW's fixtures as text: "LEE (H) + ARS (A)", or "blank". */
export const fixtureText = (list) => (list?.length ? list.map(fixtureLabel).join(' + ') : 'blank');

/** A continuous heat scale whose neutral midpoint is the mean of `values` (so colour = vs league average). */
function centred(values, high) {
  const v = values.filter(fin);
  const m = mean(v) ?? 0;
  const span = Math.max(0, ...v.map((x) => Math.abs(x - m))) || 1;
  return { min: m - span, max: m + span, reverse: !high };
}

/** One fixture as a coloured chip: "LEE (H)" (+ the att/def value on a second line). */
export function fixtureChip(f, mode = 'fdr', { scale, names = {}, gw } = {}) {
  const v = f?.[mode];
  const opp = names[f.opp] || f.opp;
  const title = [gw ? fmt.gw(gw) : null, fixtureTitle(f, opp),
    mode !== 'fdr' ? `${MODES[mode].what} ${fmt.num(v, 2)}` : null].filter(Boolean).join(' · ');
  const el = heatCell(v, mode === 'fdr' ? 'fdr' : scale, { title });
  el.classList.add('tk-fx');
  el.replaceChildren();
  return append(el, h('span.tk-opp', null, fixtureLabel(f)), mode === 'fdr' ? null : h('span.tk-val', null, fmt.num(v, 2)));
}

export const blankChip = (gw) => {
  const el = heatCell(null, 'fdr', { text: 'Blank', title: `No fixture${gw ? ` in ${fmt.gw(gw)}` : ''} (blank gameweek)` });
  el.classList.add('tk-fx', 'tk-blank');
  return el;
};

/** A GW cell: blank chip, one fixture, or a double stacked in one cell. */
export function gwCell(fixtures, mode, opts = {}) {
  if (!fixtures?.length) return blankChip(opts.gw);
  const chips = fixtures.map((f) => fixtureChip(f, mode, opts));
  return chips.length === 1 ? chips[0] : h('div.tk-multi', { title: `Double gameweek: ${fixtures.length} fixtures` }, chips);
}

/** "GW26 · double: ARS, WOL" lines for every DGW/BGW in the window, or null when there are none. */
export function dgwBgwNote({ dgw = {}, bgw = {} } = {}) {
  const items = [
    ...Object.entries(dgw || {}).map(([g, t]) => ({ g: +g, kind: 'double', teams: t })),
    ...Object.entries(bgw || {}).map(([g, t]) => ({ g: +g, kind: 'blank', teams: t })),
  ].filter((x) => x.teams?.length).sort((a, b) => a.g - b.g || a.kind.localeCompare(b.kind));
  if (!items.length) return null;
  return h('div.callout.info.tk-banner', { role: 'note' }, icon('fixtures'),
    h('ul.tk-banner-list', null, items.map((x) => h('li', null,
      h('span.tk-mark', { class: x.kind === 'double' ? 'dgw' : 'bgw' }, x.kind === 'double' ? 'DGW' : 'BGW'),
      h('strong', null, fmt.gw(x.g)), ` ${x.kind}${x.teams.length > 1 ? 's' : ''}: `, x.teams.join(', ')))));
}

function gwHead(g, data) {
  const d = data.dgw?.[g], b = data.bgw?.[g];
  return h('span.tk-gwh', null, fmt.gw(g),
    d?.length ? h('span.tk-mark.dgw', { title: `Double: ${d.join(', ')}` }, 'DGW') : null,
    b?.length ? h('span.tk-mark.bgw', { title: `Blank: ${b.join(', ')}` }, 'BGW') : null);
}

/**
 * The ticker table for one mode. Sum adds every fixture (a double counts twice, a blank adds nothing);
 * Avg is per fixture. Default order: Attack by Sum (more fixtures, more chances), FDR/Defence by Avg.
 */
export function ticker(data, mode = 'fdr', { compact = false } = {}) {
  const M = MODES[mode] || MODES.fdr;
  const gws = data?.gws || [];
  const teams = data?.teams || [];
  if (!gws.length || !teams.length) return empty('No fixtures in this range.');
  const names = Object.fromEntries(teams.map((t) => [t.short, t.name]));
  const rows = teams.map((t) => {
    const cells = gws.map((_, i) => t.rows?.[i] || []);
    const vals = cells.flat().map((f) => f?.[mode]).filter(fin);
    const per = cells.map((c) => c.map((f) => f?.[mode]).filter(fin));
    return {
      ...t, cells,
      sum: vals.length ? vals.reduce((a, b) => a + b, 0) : null,
      avg: mean(vals),
      // per-GW sort value: sum for Attack (a double is better), mean for FDR / Defence
      gwSort: per.map((v) => (v.length ? (M.high ? v.reduce((a, b) => a + b, 0) : mean(v)) : null)),
    };
  });
  const cellScale = centred(rows.flatMap((r) => r.cells.flat().map((f) => f?.[mode])), M.high);
  const total = (key, label, title) => {
    const scale = centred(rows.map((r) => r[key]), M.high);
    const d = key === 'avg' ? 2 : M.d;
    return {
      key, label, title, num: true, className: 'tk-total',
      render: (r) => (r[key] == null ? fmt.dash : heatCell(r[key], scale, { text: fmt.num(r[key], d), title: `${label}: ${fmt.num(r[key], d)}` })),
      csv: (r) => (r[key] == null ? '' : +r[key].toFixed(d)),
    };
  };
  const own = { att: ['xg_pm', 'xG/m', "this team's own realised xG per match"], def: ['xga_pm', 'xGA/m', "this team's own realised xG against per match"] }[mode];
  const columns = [
    {
      key: 'short', label: 'Team', className: 'tk-team-col', csvLabel: 'Team',
      render: (r) => h('span.tk-team', { title: r.name }, h('b', null, r.short), compact ? null : h('span.tk-tname', null, r.name)),
    },
    own && !compact ? { key: own[0], label: own[1], title: own[2], num: true, fmt: (v) => fmt.num(v, 2) } : null,
    ...gws.map((g, i) => ({
      key: `gw${g}`, label: gwHead(g, data), csvLabel: `GW${g}`, className: 'tk-gw',
      sort: (r) => r.gwSort[i],
      render: (r) => gwCell(r.cells[i], mode, { scale: cellScale, names, gw: g }),
      csv: (r) => r.cells[i].map((f) => `${fixtureLabel(f)} ${mode === 'fdr' ? f.fdr : f[mode] ?? ''}`.trim()).join(' + ') || 'blank',
    })),
    total('sum', 'Sum', 'Every fixture added: a double counts twice, a blank adds nothing'),
    total('avg', 'Avg', 'Per fixture'),
  ].filter(Boolean);
  return table({
    columns, rows, sortKey: M.sort, sortDir: M.high ? 'desc' : 'asc', stickyFirst: true, dense: compact,
    csv: compact ? false : `fixtures_${mode}_gw${gws[0]}-${gws[gws.length - 1]}.csv`,
    caption: `${M.label} ticker ${fmt.gw(gws[0])} to ${fmt.gw(gws[gws.length - 1])}`,
    maxHeight: compact ? 470 : null,
  });
}

export const modeSwitch = (value, onChange) => segmented({
  items: Object.entries(MODES).map(([key, m]) => ({ key, label: m.label })), value, onChange, label: 'Ticker view',
});

/** Colour key + what the numbers are; definitions come from the server's `legend`. */
export function tickerLegend(data, mode) {
  const L = data?.legend || {};
  const M = MODES[mode] || MODES.fdr;
  const key = mode === 'fdr'
    ? [1, 2, 3, 4, 5].map((k) => heatCell(k, 'fdr', { text: String(k) }))
    : ['worse', 'league avg', 'better'].map((t, i) => {
      const v = M.high ? i : 2 - i;
      return heatCell(v, { min: 0, max: 2, reverse: !M.high }, { text: t });
    });
  const what = { fdr: L.fdr, att: L.att, def: L.def }[mode];
  return h('div.tk-legend', null,
    h('div.tk-key', null, mode === 'fdr' ? h('span.muted.small', null, 'easy') : null, key, mode === 'fdr' ? h('span.muted.small', null, 'hard') : null),
    h('ul.tk-notes', null,
      what ? h('li', null, h('strong', null, `${M.label}: `), what) : null,
      mode !== 'fdr' && L.source ? h('li', null, h('strong', null, 'Source: '), L.source) : null,
      mode !== 'fdr' ? h('li', null, 'Colours compare each value with the league average across this table. Blank cells (—) mean the opponent has no matches played yet.') : null,
      h('li', null, h('span.tk-mark.dgw', null, 'DGW'), ' two fixtures stacked in one cell · ',
        h('span.tk-mark.bgw', null, 'BGW'), ' a "Blank" cell: no fixture that gameweek.'),
      h('li', null, h('strong', null, 'Sum'), ' adds every fixture, so a double counts twice and a blank adds nothing; ',
        h('strong', null, 'Avg'), ' is per fixture. Click any header to sort.')));
}

// ---------------------------------------------------------------- view

/** A whole number from a URL param, else null. */
export const int = (v) => (fin(v) ? Math.trunc(+v) : null);
/** A labelled control group (a <div>, not ui.field's <label>, so clicking the text doesn't press a button). */
export const group = (label, ...controls) =>
  h('div.field', { role: 'group', 'aria-label': label }, h('span.field-label', { 'aria-hidden': 'true' }, label), ...controls);

export default {
  route: 'fixtures',
  title: 'Fixtures',
  icon: 'fixtures',
  async mount(el, ctx) {
    const { api, params } = ctx;
    let meta = null;
    try { meta = await api.getMeta(); } catch { /* the ticker still loads with server defaults */ }
    const latest = meta?.season ?? null;
    const season = int(params.season) ?? latest;
    const lastGw = meta?.last_fixture_round || 38;
    const from = int(params.from);
    const st = {
      season,
      mode: MODES[params.view] ? params.view : 'fdr',
      // a bad ?from= falls back to the default; a past season starts at GW1, not its last round
      from: (from >= 1 && from <= lastGw ? from : null) ?? (season !== latest ? 1 : null),
      n: RANGE.includes(int(params.n)) ? int(params.n) : 6,
    };
    let data = null;
    let seq = 0;
    let dead = false;

    const fromSel = h('select.select', { 'aria-label': 'First gameweek' });
    const fillFrom = (s) => fromSel.replaceChildren(...Array.from({ length: lastGw }, (_, i) => i + 1).map((g) =>
      h('option', { value: g }, g === meta?.next_gw && s === latest ? `${fmt.gw(g)} (next)` : fmt.gw(g))));
    fillFrom(st.season);
    fromSel.addEventListener('change', () => { st.from = +fromSel.value; load(); });
    const shift = (d) => {
      const cur = st.from ?? data?.gws?.[0] ?? meta?.next_gw ?? 1;
      st.from = Math.max(1, Math.min(lastGw, cur + d));
      load();
    };
    const prev = h('button.icon-btn', { type: 'button', title: 'One gameweek earlier', 'aria-label': 'One gameweek earlier', onClick: () => shift(-1) }, icon('M15 6l-6 6 6 6'));
    const next = h('button.icon-btn', { type: 'button', title: 'One gameweek later', 'aria-label': 'One gameweek later', onClick: () => shift(1) }, icon('chevron'));
    const nSeg = segmented({
      items: RANGE.map((n) => ({ key: n, label: n === 38 ? 'Rest' : String(n), title: n === 38 ? 'To the end of the season' : `${n} gameweeks` })),
      value: st.n, label: 'Number of gameweeks',
      onChange: (n) => { st.n = +n; load(); },
    });
    const seasonSel = meta?.seasons?.length > 1
      ? h('select.select', {
        'aria-label': 'Season',
        onChange: (e) => { st.season = +e.target.value; st.from = st.season === latest ? null : 1; load(); },
      }, meta.seasons.slice().reverse().map((s) => h('option', { value: s, selected: s === st.season }, seasonLabel(s))))
      : null;
    const modeSeg = modeSwitch(st.mode, (m) => { st.mode = m; sync(); paint(); });

    const banner = h('div.tk-banner-slot');
    const body = h('div.tk-body', null, loading('Loading fixtures…'));
    const legend = h('div');
    const main = card({
      title: 'Fixture ticker', sub: 'Every team’s next fixtures, coloured by difficulty or by realised xG.',
      actions: modeSeg,
      body: [
        h('div.row.tk-toolbar', null,
          seasonSel ? group('Season', seasonSel) : null,
          group('From', h('div.row.tight', null, prev, fromSel, next)),
          group('Gameweeks', nSeg)),
        banner, body,
      ],
    });
    el.append(main, card({ title: 'How to read it', body: legend }));

    function sync() {
      ctx.setParams({
        season: st.season !== latest ? st.season : undefined,
        view: st.mode !== 'fdr' ? st.mode : undefined,
        from: st.from ?? undefined,
        n: st.n !== 6 ? st.n : undefined,
      });
    }

    function paint() {
      if (!data) return;
      const gws = data.gws || [];
      fillFrom(data.season);
      fromSel.value = String(gws[0] ?? st.from ?? '');
      prev.disabled = (gws[0] ?? 1) <= 1;
      next.disabled = (gws[0] ?? lastGw) >= lastGw;
      banner.replaceChildren(...[dgwBgwNote(data)].filter(Boolean));
      body.replaceChildren(ticker(data, st.mode));
      legend.replaceChildren(tickerLegend(data, st.mode));
      ctx.setTitle(gws.length ? `${fmt.gw(gws[0])}–${fmt.gw(gws[gws.length - 1])} · ${seasonLabel(data.season)}` : seasonLabel(data.season));
    }

    async function load() {
      const my = ++seq;
      sync();
      body.replaceChildren(loading('Loading fixtures…'));
      try {
        const d = await api.getFixtures({ season: st.season ?? undefined, from: st.from ?? undefined, n: st.n });
        if (dead || my !== seq) return;
        data = d;
        paint();
      } catch (e) {
        if (dead || my !== seq) return;
        data = null;
        banner.replaceChildren();
        body.replaceChildren(errorCard(e, { title: 'Fixtures could not be loaded', retry: load }));
      }
    }

    await load();
    return () => { dead = true; };
  },
};
