// Data: how fresh everything the solver reads is, and the jobs that refresh it. Solves read the
// built parquet (ml/solver/data/epl_fpl_stats_full.parquet), not the raw fetches, so "fetch then
// build" is the full refresh; "infer" re-predicts the production pools that --dir prod reads.

import * as api from '../api.js';
import {
  h, card, statTile, table, pill, toast, confirm, jobRunner, jobStatusPill, icon, fmt, loading, errorCard,
  countdown, toMs, copyText, errText, flagControl,
} from '../ui.js';

const TONE = { ok: 'gain', stale: 'warn', missing: 'loss' };
const SEVERITY = { missing: 0, stale: 1, ok: 2 };
const OPS_KINDS = ['fetch', 'build', 'infer'];
const KIND_TITLE = { fetch: 'Fetch FPL data', build: 'Rebuild parquet', infer: 'Refresh predictions' };

// The commands mirror api/jobs.py KINDS (the flags it adds to each script).
const OPS = [
  {
    key: 'fetch', kinds: ['fetch'], icon: 'download', title: 'Fetch latest FPL data',
    cmd: 'python run_fetches.py --no-notify',
    what: 'Pulls the FPL API (bootstrap, fixtures, live scores, player summaries), the upstream bootstrap archive (at most once a day), WhoScored match centre and missing players and Understat matches, then applies player mappings, matches shots and updates the EPL compact store. Applying the mappings rewrites mapping files tracked in git (fpl_cache/data/mappings: the *_missing_*mappings.json lists and {whoscored,understat}_to_element_code.json).',
    time: 'About a minute (the light steps take roughly 25–75 s).',
    note: 'The heavy population, cohort and other-league steps are not run here; the scheduled 04:00 job does those. Fetching alone does not change what solves see: rebuild the parquet afterwards.',
  },
  {
    key: 'build', kinds: ['build'], icon: 'fixtures', title: 'Rebuild fixtures & prices parquet',
    cmd: 'python ml/build.py --refresh-fixtures-only',
    what: 'Regenerates ml/solver/data/epl_fpl_stats_full.parquet (tracked in git) from the fetched FPL data: prices, availability, fixtures and actual points per player and gameweek. Every solve reads this file, and it decides which gameweek counts as played and so where the next deadline is.',
    time: 'Several minutes.',
  },
  {
    key: 'full', kinds: ['fetch', 'build'], icon: 'reset', title: 'Full refresh (fetch, then build)',
    cmd: 'run_fetches.py, then build.py --refresh-fixtures-only',
    what: 'Queues both jobs now. The build waits for the fetch to finish, because data jobs run one at a time; it still runs if the fetch fails.',
    time: 'A minute for the fetch plus several minutes for the build.',
  },
  {
    key: 'infer', kinds: ['infer'], icon: 'runs', title: 'Refresh production predictions',
    cmd: 'python ml/train_local.py --prod',
    what: (meta) => `Re-infers each production checkpoint folder into its prediction pool${meta?.prod_alias?.dirs?.length ? ` (${meta.prod_alias.dirs.join(', ')})` : ''} for the next deadline’s gameweek only, with seeds 1–12. These are the pools --dir ${meta?.prod_alias?.alias || 'prod'} reads; the season’s default pool is not touched.`,
    time: 'One inference run per checkpoint folder; how long depends on this machine.',
  },
];

function fmtAge(h) {
  if (h == null || !Number.isFinite(Number(h))) return '—';
  const v = Number(h);
  if (v < 1) return `${Math.max(1, Math.round(v * 60))} min`;
  if (v < 48) return `${v.toFixed(1)} h`;
  return `${(v / 24).toFixed(1)} d`;
}
const base = (p) => String(p || '').split('/').pop();
const iso = (t) => { const ms = toMs(t); return Number.isFinite(ms) ? new Date(ms).toISOString() : ''; };

export default {
  route: 'data',
  title: 'Data',
  icon: 'data',
  async mount(el, ctx) {
    let meta = null;
    let rows = null;
    // The prediction pool the freshness table describes (blank = the season default); kept for the session.
    let pool = ctx.state.get('dataPool');
    let poolCtl = null;
    const keepPool = (v) => { pool = v; ctx.state.set('dataPool', v); };
    const unsupported = new Set();
    const runners = new Map(); // job id → wrapper element

    // ------------------------------------------------------------ tiles

    const tilesBox = h('div.grid-4.dt-tiles');
    function paintTiles() {
      const n = rows && { ok: 0, stale: 0, missing: 0 };
      for (const r of rows || []) n[r.status] = (n[r.status] || 0) + 1;
      const pool = rows?.find((r) => String(r.source).startsWith('Prediction pool'));
      tilesBox.replaceChildren(
        statTile({ label: 'Last played', icon: 'fixtures', value: fmt.gw(meta?.last_played), sub: meta ? `Season ${meta.season} · next ${fmt.gw(meta.next_gw)}` : 'loading…' }),
        statTile({
          label: meta?.next_gw ? `${fmt.gw(meta.next_gw)} deadline` : 'Next deadline', icon: 'clock',
          value: meta?.deadline_epoch ? countdown(meta.deadline_epoch) : '—', sub: meta?.deadline_epoch ? fmt.date(meta.deadline_epoch) : null,
        }),
        statTile({
          label: 'Sources', icon: 'data', value: n ? `${n.ok}/${rows.length} fresh` : '—',
          sub: n ? `${n.stale} stale · ${n.missing} missing` : 'loading…', tone: n ? (n.missing ? 'loss' : n.stale ? 'warn' : 'gain') : null,
        }),
        statTile({
          label: 'Newest predictions', icon: 'runs', value: pool ? fmtAge(pool.age_h) : '—',
          sub: pool ? [String(pool.source).replace(/^Prediction pool\s*/, ''), pool.note].filter(Boolean).join(' · ') : null,
          tone: pool?.status === 'stale' ? 'warn' : null,
        }));
    }

    // ------------------------------------------------------------ freshness

    const freshTbl = table({
      columns: [
        { key: 'source', label: 'Source', render: (r) => h('strong', null, r.source) },
        { key: 'status', label: 'Status', sort: (r) => SEVERITY[r.status] ?? 3, render: (r) => pill(r.status, TONE[r.status] || '') },
        { key: 'age_h', label: 'Age', num: true, fmt: (v) => fmtAge(v) },
        { key: 'mtime_epoch', label: 'Updated', render: (r) => (r.mtime_epoch ? h('span', { title: fmt.date(r.mtime_epoch) }, fmt.ago(r.mtime_epoch)) : '—'), csv: (r) => iso(r.mtime_epoch) },
        { key: 'note', label: 'Note', className: 'dt-note' },
        {
          key: 'path', label: 'File', className: 'dt-file',
          render: (r) => h('span.dt-path', null, h('code.truncate', { title: r.path }, base(r.path)),
            r.path ? h('button.icon-btn', { type: 'button', title: 'Copy path', 'aria-label': `Copy path of ${r.source}`, onClick: () => copyText(r.path, 'Path copied') }, icon('copy', { size: 13 })) : null),
        },
      ],
      rows: [], csv: 'freshness.csv', rowClass: (r) => `dt-${r.status}`, caption: 'Data freshness',
      empty: 'No sources reported.',
    });
    const freshBody = h('div', null, freshTbl);
    const reloadBtn = h('button.btn.sm.ghost', { type: 'button', onClick: () => refresh() }, icon('reset', { size: 14 }), 'Reload');
    const clearBtn = h('button.btn.sm.ghost', {
      type: 'button', title: 'Drop the Studio’s in-memory data and the solver’s cached loaders (after editing data files by hand)',
      onClick: async () => {
        clearBtn.disabled = true;
        try {
          const out = await api.invalidateData();
          toast(`Caches cleared${Number.isFinite(out?.cleared) ? ` (${out.cleared})` : ''}`, 'ok');
          refresh();
        } catch (e) {
          toast(e.message, 'error');
        } finally {
          clearBtn.disabled = false;
        }
      },
    }, icon('trash', { size: 14 }), 'Clear caches');
    const poolSlot = h('div.dt-pool');
    api.getFlags().then((cat) => {
      const f = cat?.flags?.find((x) => x.dest === 'dir');
      if (f) poolSlot.replaceChildren(poolCtl = flagControl(f, pool, (v) => { keepPool(v); loadFreshness(); }));
    }).catch(() => { /* the default pool's row still shows */ });
    const freshCard = card({
      title: 'Data freshness',
      sub: 'Every input the solver reads for the current season. Stale means older than its usual refresh or missing a gameweek.',
      actions: [clearBtn, reloadBtn],
      body: [poolSlot, freshBody],
    });

    async function loadFreshness() {
      try {
        const data = await api.getFreshness({ pool });
        rows = Array.isArray(data) ? data : data?.rows || [];
        freshBody.replaceChildren(freshTbl);
        freshTbl.update(rows);
      } catch (e) {
        rows = null;
        freshBody.replaceChildren(errorCard(e, { title: 'Freshness could not be read', retry: loadFreshness }));
      }
      paintTiles();
    }
    async function loadMeta(force = false) {
      try {
        meta = await api.getMeta({ force });
      } catch { /* tiles show dashes */ }
      paintTiles();
    }
    const refresh = (force = false) => Promise.all([loadMeta(force), loadFreshness()]);

    // ------------------------------------------------------------ ops

    const activity = h('div.stack.tight.dt-activity');
    const opButtons = new Map();

    function markUnsupported(kind) {
      unsupported.add(kind);
      for (const op of OPS) {
        if (!op.kinds.some((k) => unsupported.has(k))) continue;
        const b = opButtons.get(op.key);
        if (b) { b.disabled = true; b.title = 'Not available in this Studio backend'; }
      }
    }

    function follow(job) {
      if (!job?.id || runners.has(job.id)) {
        runners.get(job?.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      const dismiss = h('button.icon-btn.dt-dismiss', {
        type: 'button', title: 'Hide', 'aria-label': 'Hide this job', hidden: api.isActive(job),
        onClick: () => { wrap.firstChild?.stop?.(); wrap.remove(); runners.delete(job.id); },
      }, icon('close', { size: 14 }));
      const r = jobRunner({
        job, title: job.label || KIND_TITLE[job.kind] || job.kind,
        onDone: ({ job: j }) => {
          dismiss.hidden = false;
          if (j?.status === 'done') {
            // show the pools the infer job just re-inferred (--dir prod)
            if (j.kind === 'infer' && meta?.prod_alias?.alias) { keepPool(meta.prod_alias.alias); poolCtl?.setValue(pool); }
            // the server already cleared its caches (api/jobs.py _wait); re-read meta and file ages
            toast(`${KIND_TITLE[j.kind] || j.kind} finished; freshness updated`, 'ok');
            refresh(true);
          }
        },
      });
      const wrap = h('div.dt-run', null, r, dismiss);
      runners.set(job.id, wrap);
      activity.prepend(wrap);
    }

    function opBody(op) {
      const what = typeof op.what === 'function' ? op.what(meta) : op.what;
      return h('div.stack.tight', null,
        h('p', null, what),
        h('dl.dt-dl', null,
          h('dt', null, 'Runs'), h('dd', null, h('code', null, op.cmd)),
          h('dt', null, 'Takes'), h('dd', null, op.time)),
        op.note ? h('p.muted.small', null, op.note) : null,
        h('p.muted.small', null, 'Data jobs run one at a time: this waits for running solves to finish, and new solves wait for it. When it succeeds the Studio clears its caches, so the next solve reads the new data.'));
    }

    async function runOp(op) {
      const ok = await confirm({ title: op.title, body: opBody(op), confirmLabel: op.kinds.length > 1 ? 'Queue both' : 'Run' });
      if (!ok) return;
      for (const kind of op.kinds) {
        try {
          const out = await api.createJob({ kind, argv: [], label: KIND_TITLE[kind] });
          follow(out?.job ?? out);
        } catch (e) {
          if (e.status === 400 && /kind/i.test(e.message)) {
            markUnsupported(kind);
            toast(`This Studio backend has no “${kind}” job.`, 'warn');
          } else toast(errText(e), 'error');
          return;
        }
      }
    }

    const opsList = h('div.dt-ops', null, OPS.map((op) => {
      const btn = h('button.btn', { type: 'button', class: op.key === 'full' ? 'primary' : null, onClick: () => runOp(op) },
        icon('play', { size: 14 }), op.key === 'full' ? 'Run both' : 'Run');
      opButtons.set(op.key, btn);
      return h('div.dt-op', null,
        h('span.dt-op-icon', null, icon(op.icon)),
        h('div.dt-op-text', null,
          h('div.dt-op-title', null, op.title),
          h('div.muted.small', null, op.time),
          h('code.dt-op-cmd', null, op.cmd)),
        btn);
    }));

    const opsCard = card({
      title: 'Refresh data',
      sub: 'Each job asks for confirmation first and streams its log here.',
      body: [
        h('div.callout.info', null, icon('info'), h('div', null,
          h('strong', null, 'Fetch, then build. '),
          'Solves read the built parquet, not the raw fetches, so a fetch shows up only after the rebuild. Captain polls refresh themselves at the start of each solve (when older than ',
          h('a', { href: '#/docs?flag=poll_max_age' }, '--poll-max-age'),
          '); predictions change only when re-inferred.')),
        opsList,
        activity,
      ],
    });

    // ------------------------------------------------------------ recent data jobs

    const recentErr = h('p.error-msg.small', { hidden: true });
    const recentTbl = table({
      columns: [
        { key: 'created', label: 'Started', render: (j) => h('span', { title: fmt.date(j.created) }, fmt.ago(j.created)), csv: (j) => iso(j.created) },
        { key: 'kind', label: 'Job', render: (j) => KIND_TITLE[j.kind] || j.kind },
        { key: 'status', label: 'Status', render: (j) => jobStatusPill(j.status) },
        { key: 'elapsed', label: 'Time', num: true, fmt: (v) => fmt.dur(v) },
        {
          key: 'result', label: 'Last line', className: 'dt-note', sort: false,
          render: (j) => { const t = j.error || j.summary?.last_line || ''; return h('span.truncate.dt-last', { title: t }, t || '—'); },
          csv: (j) => j.error || j.summary?.last_line || '',
        },
      ],
      rows: [], sortKey: 'created', sortDir: 'desc', onRow: (j) => follow(j), maxHeight: 360, csv: 'data_jobs.csv',
      empty: 'No data jobs yet.', caption: 'Recent data jobs',
    });
    const recentCard = card({ title: 'Recent data jobs', sub: 'Click a row to show its log above.', body: [recentErr, recentTbl] });

    paintTiles();
    el.append(tilesBox, freshCard, opsCard, recentCard);
    freshBody.replaceChildren(loading('Reading file ages…'));
    await refresh();
    let first = true;  // follow the data jobs already running, once
    const unwatch = api.watchJobs((jobs) => {
      const list = jobs.filter((j) => OPS_KINDS.includes(j.kind));
      recentErr.hidden = true;
      recentTbl.update(list);
      if (first) { first = false; list.filter(api.isActive).reverse().forEach(follow); }
    }, (e) => {
      recentErr.textContent = e.message;
      recentErr.hidden = false;
    });

    return () => {
      unwatch();
      for (const w of runners.values()) w.firstChild?.stop?.();
    };
  },
};
