// Compare: up to four players side by side: xP by GW with a ±1 sd seed band, actual vs forecast
// history, and a metric table with the best value in each row highlighted. Reads the Players page's
// source (season / first GW / pool) so both pages show the same numbers. ?ids=1,2 is shareable.

import * as api from '../api.js';
import {
  h, append, card, table, lineChart, playerPicker, segmented, statusDot, statusInfo, icon, toast,
  loading, empty, errorCard, fmt, fin, plural,
} from '../ui.js';
import {
  COMPARE_MAX, LUCK_FREE, XI_TITLE, sourceOf, prepRows, describeSource, fixtureTags, xpTitle, xiText,
  signedCompact, compareIds,
} from './players.js';

const colorOf = (i) => `var(--s${(i % 8) + 1})`;  // lineChart's default colour for series i

function historySummary(p, res, color) {
  const head = h('div.cv-hs-name', null, h('span.cv-swatch', { style: { '--c': color } }), p.name);
  if (res?.error) return h('div.cv-hs', null, head, h('div.small.loss', null, res.error.message));
  const both = (res?.rounds || []).filter((r) => fin(r.pts) && fin(r.pred_h0));
  if (!both.length) return h('div.cv-hs', null, head, h('div.small.muted', null, 'No played GW with a forecast yet.'));
  const sum = (k) => both.reduce((a, r) => a + (fin(r[k]) ? r[k] : 0), 0);
  const diff = sum('pts') - sum('pred_h0');
  const mae = both.reduce((a, r) => a + Math.abs(r.pts - r.pred_h0), 0) / both.length;
  return h('div.cv-hs', null, head,
    h('div.small', null, `Actual ${sum('pts')} · forecast ${fmt.num(sum('pred_h0'))} · luck-free ${fmt.num(sum('xpts'))}`),
    h('div.small.muted', null, h('span', { class: diff >= 0 ? 'gain' : 'loss' }, `${fmt.signed(diff)} vs forecast`),
      ` · mean abs. error ${fmt.num(mae, 2)} over ${plural(both.length, 'GW')}`));
}

export default {
  route: 'compare',
  title: 'Compare',
  icon: 'compare',
  async mount(el, ctx) {
    const { state, params, setParams, navigate, setTitle } = ctx;
    // A link with no valid id leaves the saved list alone; syncUrl below then rewrites the address.
    const fromUrl = compareIds((params.ids || '').split(','));
    if (fromUrl.length) state.set('compare', fromUrl);  // the store keeps the newest COMPARE_MAX
    if (fromUrl.length > COMPARE_MAX) toast(`Compare holds ${COMPARE_MAX} players: kept the last ${COMPARE_MAX} in the link`, 'warn');
    let ids = state.get('compare', []);
    let d = null;
    let byId = new Map();
    let band = ids.length <= 2;  // bands for 3-4 overlapping series get muddy
    let histWho = 'all';
    let histCum = false;
    const hist = new Map();
    const src = sourceOf(state);
    const syncUrl = () => setParams(ids.length ? { ids: ids.join(',') } : {});

    function setIds(next) {
      next = [...new Set(next.map(Number))];
      if (next.length > COMPARE_MAX) {
        picker.setSelected(ids);
        toast(`Compare holds ${COMPARE_MAX} players: remove one first`, 'warn');
        return;
      }
      state.set('compare', next);  // the subscription below repaints
    }

    const dataP = api.getPlayers({ ...src, all: true }).then(prepRows);
    const picker = playerPicker({
      players: dataP.then((x) => x.players).catch(() => []), multiple: true, selected: ids,
      placeholder: 'Add a player…', label: 'Add a player to compare', onPick: (ps) => setIds(ps.map((p) => p.id)),
    });
    const captainsBtn = () => {
      const btn = h('button.btn.sm', {
        type: 'button', title: 'The four highest next-GW xP from the dashboard captain shortlist',
        onClick: async () => {
          btn.disabled = true;
          try {
            const dash = await api.getDashboard({ season: d?.season ?? src.season, pool: src.pool });
            const picks = (dash?.captain_picks || []).slice(0, COMPARE_MAX).map((p) => p.id);
            if (!picks.length) toast('The dashboard lists no captain picks for this GW', 'warn');
            else { band = picks.length <= 2; setIds(picks); }
          } catch (e) {
            toast(e.message, 'error');
          } finally {
            btn.disabled = false;
          }
        },
      }, icon('players', { size: 15 }), 'Try the top 4 captain picks');
      return btn;
    };
    const srcNote = h('p.muted.small.cv-src', null, 'Loading players…');
    const content = h('div.stack');
    el.append(card({
      title: 'Players to compare', sub: `Up to ${COMPARE_MAX}: search here or use “+” on the Players page.`,
      actions: [captainsBtn(), h('button.btn.sm.ghost', { type: 'button', onClick: () => setIds([]) }, icon('close', { size: 14 }), 'Clear')],
      body: [picker, srcNote],
    }), content);

    const unsub = state.subscribe('compare', (next) => {
      next = next || [];
      if (next.join() === ids.join()) return;
      ids = next;
      picker.setSelected(ids);
      syncUrl();
      render();
    });
    syncUrl();

    content.append(loading('Loading players…'));
    try {
      d = await dataP;
    } catch (e) {
      srcNote.replaceChildren('The source (season, first GW, pool) is set on ', h('a', { href: '#/players' }, 'the Players page'), '.');
      content.replaceChildren(errorCard(e, { title: 'Players could not be loaded', retry: () => navigate('compare', ids.length ? { ids: ids.join(',') } : {}) }));
      return unsub;
    }
    byId = new Map(d.players.map((p) => [p.id, p]));
    srcNote.replaceChildren(`${describeSource(d)} · `, h('a', { href: '#/players' }, 'change on Players'));
    render();
    return unsub;

    // ---------------------------------------------------------------- sections

    function render() {
      if (!d) return;
      const sel = ids.map((id) => byId.get(id)).filter(Boolean);
      const missing = ids.filter((id) => !byId.has(id));
      setTitle(sel.length ? `${sel.length}/${COMPARE_MAX} players` : null);
      content.replaceChildren();
      append(content,
        missing.length ? h('div.callout.warn', null, icon('warn'),
          h('div', null, `Not in the season ${d.season} player list: ${missing.map((id) => `#${id}`).join(', ')}. `,
            h('button.btn.sm.ghost', { type: 'button', onClick: () => setIds(ids.filter((x) => byId.has(x))) }, 'Remove them'))) : null,
        sel.length
          ? [xpCard(sel), historyCard(sel), tableCard(sel)]
          : card({
            body: empty('Pick up to four players above, or start from the model’s captain shortlist.',
              h('div.row.cv-empty-acts', null, captainsBtn(), h('a.btn.sm.ghost', { href: '#/players' }, icon('players', { size: 15 }), 'Browse players'))),
          }));
    }

    function xpCard(sel) {
      const hz = d.horizon || [];
      const box = h('div');
      const draw = () => box.replaceChildren(lineChart({
        series: sel.map((p) => ({
          name: p.name,
          points: hz.map((g, i) => [g, p.xp?.[i] ?? null]),
          band: band ? hz.map((g, i) => {
            const v = p.xp?.[i];
            const sd = p.xp_sd?.[i];
            return fin(v) && fin(sd) ? [g, Math.max(0, v - sd), v + sd] : null;
          }).filter(Boolean) : null,
        })),
        xLabel: 'Gameweek', yLabel: 'Expected points', xFmt: (g) => `GW${g}`, height: 260, ariaLabel: 'Expected points by gameweek',
      }));
      const bandBox = h('input', { type: 'checkbox', checked: band, onChange: () => { band = bandBox.checked; draw(); } });
      draw();
      return card({
        title: 'Expected points by gameweek',
        sub: `The pool’s mean forecast; shaded band = ±1 sd across its ${plural(d.n_seeds ?? 0, 'seed file')}.`,
        actions: h('label.check', { title: 'Show the seed-spread band' }, bandBox, 'Seed spread'),
        body: box,
      });
    }

    function history(id) {
      if (!hist.has(id)) {
        hist.set(id, api.getPlayerHistory(id, { season: d.season, pool: src.pool }).catch((error) => {
          hist.delete(id);  // retried on the next draw
          return { error };
        }));
      }
      return hist.get(id);
    }

    function historyCard(sel) {
      if (histWho !== 'all' && !sel.some((p) => String(p.id) === String(histWho))) histWho = 'all';
      const box = h('div.stack.tight');
      let drawn = 0;
      async function draw() {
        const my = ++drawn;
        box.replaceChildren(loading('Loading history…'));
        const res = await Promise.all(sel.map((p) => history(p.id)));
        if (my !== drawn) return;
        const scope = sel.filter((p) => histWho === 'all' || String(p.id) === String(histWho));
        const pool = res.find((x) => x?.pool)?.pool;
        const one = scope.length === 1;
        const series = [];
        for (const p of scope) {
          const i = sel.indexOf(p);
          const rounds = res[i]?.rounds || [];
          // Cumulative lines count only GWs with a forecast so actual and forecast stay comparable.
          const rr = histCum ? rounds.filter((r) => fin(r.pred_h0)) : rounds;
          const line = (k) => {
            let s = 0;
            return rr.map((r) => (fin(r[k]) ? [r.gw, histCum ? (s += r[k]) : r[k]] : [r.gw, null]));
          };
          series.push({ name: one ? 'Actual points' : `${p.name} actual`, points: line('pts'), color: colorOf(i) });
          series.push({ name: one ? 'Forecast made that GW' : `${p.name} forecast`, points: line('pred_h0'), color: colorOf(i), dashed: true });
          if (one) series.push({ name: 'Luck-free points', points: line('xpts'), color: 'var(--muted)' });
        }
        box.replaceChildren();
        append(box,
          lineChart({
            series, xLabel: 'Gameweek', yLabel: histCum ? 'Cumulative points' : 'Points', xFmt: (g) => `GW${g}`,
            height: 260, labels: series.length <= 3, ariaLabel: 'Actual against forecast points by gameweek',
          }),
          h('div.cv-hist-sum', null, scope.map((p) => historySummary(p, res[sel.indexOf(p)], colorOf(sel.indexOf(p))))),
          pool ? h('p.muted.small', null, `Forecasts from pool ${pool}.`) : null);
      }
      const who = sel.length > 1 ? segmented({
        label: 'Player', value: histWho, onChange: (v) => { histWho = v; draw(); },
        items: [{ key: 'all', label: 'All' }, ...sel.map((p) => ({ key: p.id, label: p.name }))],
      }) : null;
      const cum = segmented({
        label: 'Scale', value: histCum ? 'cum' : 'gw', onChange: (v) => { histCum = v === 'cum'; draw(); },
        items: [{ key: 'gw', label: 'Per GW' }, { key: 'cum', label: 'Cumulative' }],
      });
      draw();
      return card({
        title: 'Actual vs forecast', className: 'cv-hist',
        sub: 'Played GWs: FPL points (solid) against the pool’s forecast for that GW made at its own deadline (dashed). '
          + 'Luck-free points (one player) take finishing luck out.',
        actions: [who, cum],
        body: box,
      });
    }

    function tableCard(sel) {
      const hz = d.horizon || [];
      const S = d.sources || {};
      const metrics = [
        { label: 'Club', get: (p) => p.club },
        { label: 'Position', get: (p) => p.pos },
        {
          label: 'Status', get: (p) => statusInfo(p.status, p.chance).label,
          render: (p, txt) => h('span.cv-status', { title: p.news || null }, statusDot(p.status, { chance: p.chance, news: p.news, always: true }), txt),
        },
        { label: 'WhoScored XI', get: (p) => xiText(p.ws_preview), title: XI_TITLE },
        { label: 'Price', get: (p) => p.price, fmt: (v) => fmt.money(v), best: 'min', title: S.market },
        { label: 'Ownership', get: (p) => p.sel_pct, fmt: (v) => fmt.pct(v) },
        d.cohort_known && { label: 'Top-manager ownership', get: (p) => p.top_own_pct, fmt: (v) => fmt.pct(v), title: S.top_own_pct },
        ...hz.map((g, i) => ({
          label: `xP GW${g}`, get: (p) => p.xp?.[i], fmt: (v) => fmt.pts(v, 2), best: 'max',
          render: (p, txt) => h('div.cv-xp', { title: xpTitle(p, i, g, d.n_seeds) }, txt, fixtureTags(p.fixtures?.[i])),
        })),
        hz.length > 1 && { label: `xP GW${hz[0]}–${hz[hz.length - 1]}`, get: (p) => p.xp_sum, fmt: (v) => fmt.pts(v, 2), best: 'max', strong: true },
        { label: 'xP per £m', get: (p) => p.xp_per_m, fmt: (v) => fmt.num(v, 2), best: 'max' },
        { label: 'Season points', get: (p) => p.season_pts, best: 'max' },
        { label: 'Luck-free points', get: (p) => p.season_xpts, fmt: (v) => fmt.num(v, 1), best: 'max', title: LUCK_FREE },
        { label: 'Minutes', get: (p) => p.minutes, fmt: (v) => fmt.int(v), best: 'max' },
        { label: 'Points per 90', get: (p) => p.pts90, fmt: (v) => fmt.num(v, 1), best: 'max' },
        { label: 'Form (points per game)', get: (p) => p.form, fmt: (v) => fmt.num(v, 1), best: 'max', title: S.form },
        { label: '60+ minute starts', get: (p) => p.starts60, fmt: (v, p) => (fin(v) ? `${v}/${p.games4 ?? '?'}` : fmt.dash), best: 'max', title: S.form },
        { label: 'Net transfers this GW', get: (p) => p.net_tx, fmt: signedCompact },
        { label: 'Price change progress', get: (p) => p.price_change_pct, fmt: (v) => (fin(v) ? `${fmt.signed(v)}%` : fmt.dash), title: S.market },
        { label: 'Buyable for the solver', get: (p) => (p.buyable ? 'yes' : 'no'), title: S.buyable },
      ].filter(Boolean);

      const rows = metrics.map((m) => {
        const vals = sel.map((p) => m.get(p));
        const nums = vals.filter(fin);
        let best = null;
        if (m.best && nums.length > 1) {
          const b = m.best === 'max' ? Math.max(...nums) : Math.min(...nums);
          if (nums.some((v) => v !== b)) best = b;  // all equal: nothing stands out
        }
        return { m, vals, best };
      });
      const cell = (r, i, p) => {
        const v = r.vals[i];
        const txt = r.m.fmt ? r.m.fmt(v, p) : v == null || v === '' ? fmt.dash : String(v);
        return h('span.cv-cell', { class: { best: r.best != null && v === r.best, strong: r.m.strong } }, r.m.render ? r.m.render(p, txt) : txt);
      };
      const columns = [
        { key: 'label', label: 'Metric', sort: false, render: (r) => h('span.cv-metric', { title: r.m.title || null }, r.m.label), csv: (r) => r.m.label },
        ...sel.map((p, i) => ({
          key: `p${i}`, sort: false, className: 'cv-col', csvLabel: p.name,
          label: h('div.cv-head', { style: { '--c': colorOf(i) } },
            h('span.cv-swatch'), h('span.cv-hname', null, p.name),
            h('button.icon-btn.cv-x', {
              type: 'button', title: `Remove ${p.name}`, 'aria-label': `Remove ${p.name}`,
              onClick: () => setIds(ids.filter((x) => x !== p.id)),
            }, icon('close', { size: 14 })),
            h('span.cv-hmeta', null, `${p.club} · ${p.pos}`)),
          render: (r) => cell(r, i, p),
          csv: (r) => r.vals[i],
        })),
      ];
      return card({
        title: 'Side by side', sub: sel.length > 1 ? 'Best value in each row in green.' : 'Add another player to see who leads each row.',
        className: 'cv-card',
        body: table({
          columns, rows, stickyFirst: true, dense: true, caption: 'Player comparison',
          csv: `compare_${d.season}_gw${d.gw}.csv`,
        }),
      });
    }
  },
};
