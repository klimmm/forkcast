// Preview: the solver's own HTML pages, run as jobs and shown inline. A round preview
// (--preview / --preview-full / --preview-no-solve) and a team rating (--rate-team), which
// rates an --entry squad or, without one, every screenshot in --rate-dir (main.py:719-738;
// --team-state is not read by the rating). #/preview?job=<id> opens a run.

import * as api from '../api.js';
import {
  h, card, flagControl, segmented, jobRunner, jobStatusPill, table, toast, confirm, icon, pill, fmt,
  loading, errorCard, empty, toMs, errText, entryId, recentEntryChips, extraFlagsButton,
} from '../ui.js';

const KINDS = { preview: 'Preview', rate: 'Rating' };
const GW = { label: 'Gameweek', placeholder: 'next deadline' };
// The solver flags each form edits, with page-specific overrides of the catalogue text.
const FIELDS = {
  preview: [['season'], ['to', GW], ['dir'], ['preview_full'], ['preview_no_solve']],
  rate: [['season'], ['to', GW], ['dir']],
};
// Each form's own settings; "Extra flags" offers the rest. --from-r is set from the GW at launch.
const OWN = {
  preview: new Set([...FIELDS.preview.map(([d]) => d), 'from_r']),
  rate: new Set([...FIELDS.rate.map(([d]) => d), 'from_r', 'entry', 'rate_dir']),
};
const FRAME_MODES = [{ key: 'fit', label: 'Fit page' }, { key: 'scroll', label: 'Scroll inside' }];
const MAX_FRAME_PX = 60000;

/** flagControls for `specs` that write into `values` (undefined = solver default, key dropped). */
function controls(specs, values, byDest, meta) {
  return specs.map(([dest, over]) => {
    const f = byDest.get(dest);
    return f && flagControl({ ...f, ...over }, values[dest], (v) => {
      if (v === undefined) delete values[dest];
      else values[dest] = v;
    }, { meta });
  });
}

function roundLabel(job) {
  const s = job.summary || {};
  return [s.season, s.gw != null ? fmt.gw(s.gw) : null, s.full ? 'full' : null].filter(Boolean).join(' · ');
}

export default {
  route: 'preview',
  title: 'Preview',
  icon: 'preview',
  async mount(el, ctx) {
    el.append(loading('Loading settings…'));
    let meta, flags;
    try {
      [meta, flags] = await Promise.all([api.getMeta(), api.getFlags()]);
    } catch (e) {
      el.replaceChildren(errorCard(e, { title: 'Settings could not be loaded', retry: () => ctx.navigate('preview', ctx.params) }));
      return;
    }
    el.replaceChildren();
    const byDest = new Map((flags?.flags || []).map((f) => [f.dest, f]));
    const saved = ctx.state.get('previewView', {});
    const forms = { preview: { ...saved.preview }, rate: { ...saved.rate } };
    let source = saved.source === 'photos' ? 'photos' : 'entry';
    let frameMode = saved.frame === 'scroll' ? 'scroll' : 'fit';
    const save = () => ctx.state.set('previewView', { ...forms, source, frame: frameMode });
    forms.rate.entry ??= entryId(ctx.state.get('lastEntry')) ?? entryId(meta?.last_entry) ?? undefined;
    if (forms.rate.entry === undefined) delete forms.rate.entry;

    const seasonOf = (v) => v.season ?? meta?.season;
    // The GW a run is for: --to, else the next deadline in the live season (a past season: main.py's last round).
    const gwOf = (v) => v.to || (seasonOf(v) === (meta?.latest_season ?? meta?.season) ? meta?.next_gw : undefined);
    const gwText = (v) => { const g = gwOf(v); return g ? fmt.gw(g) : 'last GW'; };
    const seasonText = (v) => (v.season && v.season !== meta?.season ? `${v.season} ` : '');

    // ------------------------------------------------------------ run forms

    async function launch(kind, values, label, btn) {
      btn.disabled = true;
      // --from-r = the GW, as the planner's previews: τ and its captain tie-break are measured up to
      // --from-r (main.py:952-965), so a bare run would price them from GW1.
      const gw = gwOf(values);
      try {
        const out = await api.createJob({ kind, values: gw ? { ...values, from_r: gw } : values, label });
        const job = out?.job ?? out;
        showJob(job);
        result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        toast(errText(e), 'error');
      } finally {
        btn.disabled = false;
      }
    }

    const previewBtn = h('button.btn.primary', {
      type: 'button',
      onClick: () => {
        const v = { ...forms.preview };
        save();
        const label = [`${seasonText(v)}${gwText(v)} preview`, v.preview_full && 'full', v.preview_no_solve && 'no fresh 15', v.dir]
          .filter(Boolean).join(' · ');
        launch('preview', v, label, previewBtn);
      },
    }, icon('play', { size: 16 }), 'Build preview');

    const extras = (kind) => extraFlagsButton({ flags: flags?.flags, groups: flags?.groups, meta, values: forms[kind], own: OWN[kind], onChange: save });

    const previewCard = card({
      title: 'Gameweek preview',
      sub: 'The solver’s one-page round report: deadline, fixtures, captain picks, the model’s best 15 and the full player list.',
      body: [
        h('div.pv-fields', null, controls(FIELDS.preview, forms.preview, byDest, meta)),
        h('div.row.pv-go', null, previewBtn, extras('preview'),
          h('span.muted.small', null, 'Full adds the sectioned report; without the fresh 15 it skips the squad solve and is faster.')),
      ],
    });

    const entryFlag = byDest.get('entry');
    const entryCtl = entryFlag && flagControl({ ...entryFlag, label: 'FPL team ID' }, forms.rate.entry, (v) => {
      if (v === undefined) delete forms.rate.entry;
      else forms.rate.entry = v;
    }, { meta });
    const recentBox = h('div.pv-entries');
    const dirFlag = byDest.get('rate_dir');
    const photoCtl = dirFlag && flagControl(dirFlag, forms.rate.rate_dir, (v) => {
      if (v === undefined) delete forms.rate.rate_dir;
      else forms.rate.rate_dir = v;
    }, { meta });
    const entryPane = h('div.stack.tight', null, entryCtl, recentBox,
      h('p.muted.small', null, 'Rates the squad your entry held before the gameweek, with its bank. Selling prices are not used: players are valued at their current price.'));
    const photoPane = h('div.stack.tight', null, photoCtl,
      h('div.callout.info', null, icon('info'), h('div', null,
        'macOS only. Every image in the folder is read with Vision OCR and rated separately; each must be an FPL app ',
        h('em', null, 'Pick Team'), ' or ', h('em', null, 'Transfers'), ' screen showing all 15 players.')));
    const paintSource = () => { entryPane.hidden = source !== 'entry'; photoPane.hidden = source !== 'photos'; };
    paintSource();

    const rateBtn = h('button.btn.primary', {
      type: 'button',
      onClick: () => {
        const v = { ...forms.rate };
        if (source === 'entry') {
          delete v.rate_dir;
          if (!entryId(v.entry)) { toast('Enter your FPL team ID (a number), or switch to screenshots.', 'warn'); return; }
        } else delete v.entry;
        save();
        const who = source === 'entry' ? `entry ${v.entry}` : 'screenshots';
        launch('rate', v, `Rate ${who} · ${seasonText(v)}${gwText(v)}${v.dir ? ` · ${v.dir}` : ''}`, rateBtn);
      },
    }, icon('play', { size: 16 }), 'Rate team');

    const rateCard = card({
      title: 'Rate a team',
      sub: 'Scores a squad between a random legal 15 (0%) and the model’s best 15 (100%), and lists the best one-, two- and three-transfer moves without hits.',
      body: [
        segmented({
          items: [{ key: 'entry', label: 'FPL entry' }, { key: 'photos', label: 'Screenshots' }],
          value: source, label: 'Squad source',
          onChange: (k) => { source = k; paintSource(); save(); },
        }),
        entryPane, photoPane,
        h('div.pv-fields', null, controls(FIELDS.rate, forms.rate, byDest, meta)),
        h('div.row.pv-go', null, rateBtn, extras('rate')),
      ],
    });

    api.getRecentEntries({ season: meta?.season }).then((list) => {
      recentBox.replaceChildren(...recentEntryChips(list, {
        onPick: (id) => { forms.rate.entry = id; entryCtl?.setValue(id); save(); },
      }));
    }).catch(() => {});

    // ------------------------------------------------------------ result

    const result = card({ title: 'Result', className: 'pv-result' });
    const idle = () => result.setBody(empty('Build a preview or rate a team above, or open a recent run below.'));
    let runner = null;
    let seq = 0;
    let currentId = null;

    function pageView(job) {
      const url = job.html_url;
      const frame = h('iframe.report.pv-frame', { src: url, title: job.label || 'Solver page', class: { scroll: frameMode === 'scroll' } });
      let ro = null;
      // Same-origin page: in "fit" mode the frame takes the document's height, so the app page scrolls.
      function fit() {
        if (frameMode !== 'fit') { frame.style.height = ''; return; }
        try {
          const d = frame.contentDocument;
          const border = frame.offsetHeight - frame.clientHeight;
          const px = Math.min(MAX_FRAME_PX, Math.max(d.documentElement.scrollHeight, d.body?.scrollHeight || 0) + border);
          if (px > border && Math.abs(px - frame.offsetHeight) > 1) frame.style.height = `${px}px`;
        } catch { /* not readable: keep the CSS height */ }
      }
      frame.addEventListener('load', () => {
        fit();
        try {
          ro?.disconnect();
          ro = new frame.contentWindow.ResizeObserver(fit);
          ro.observe(frame.contentDocument.body);
        } catch { /* fixed height is fine */ }
      });
      const name = job.summary?.page?.split('/').pop() || `${job.kind}_${job.id}.html`;
      const tools = h('div.pv-tools', null,
        pill(KINDS[job.kind] || job.kind, 'info'),
        h('strong.pv-title', null, roundLabel(job) || job.label || job.id),
        h('span.muted.small', { title: fmt.date(job.finished) }, `built ${fmt.ago(job.finished)}`),
        h('span.spacer'),
        segmented({
          items: FRAME_MODES, value: frameMode, label: 'Frame size',
          onChange: (m) => { frameMode = m; frame.classList.toggle('scroll', m === 'scroll'); fit(); save(); },
        }),
        h('a.btn.sm', { href: url, target: '_blank', rel: 'noopener' }, icon('external', { size: 15 }), 'Open in new tab'),
        h('a.btn.sm.ghost', { href: url, download: name }, icon('download', { size: 15 }), 'Download'));
      return h('div.stack.tight', null, tools, frame);
    }

    function finished(job, runnerEl) {
      const log = runnerEl || jobRunner({ job, title: job.label });
      if (!(job.kind in KINDS)) {
        result.setBody(h('div.callout.info', null, icon('info'), h('div', null,
          `This is a ${job.kind} run, not a preview or rating. `, h('a', { href: `#/runs?job=${encodeURIComponent(job.id)}` }, 'Open it in Runs'), '.')));
      } else if (job.status === 'done' && job.html_url) {
        result.setBody(pageView(job), h('details.pv-log', null, h('summary', null, 'Run log'), log));
      } else {
        const cancelled = job.status === 'cancelled';
        result.setBody(
          h('div.callout', { class: cancelled ? 'warn' : 'loss' }, icon('warn'), h('div', null,
            h('strong', null, cancelled ? 'Cancelled' : 'No page was written'),
            h('div.small', null, job.error || `The run ended with status ${job.status}.`))),
          log);
      }
    }

    async function showJob(ref) {
      const my = ++seq;
      runner?.stop?.();
      runner = null;
      const id = typeof ref === 'object' ? ref.id : String(ref);
      currentId = id;
      ctx.setParams({ ...ctx.params, job: id });
      recentTbl.update(recentRows);
      let job = typeof ref === 'object' ? ref : null;
      if (!job) {
        result.setBody(loading('Loading the run…'));
        try {
          const out = await api.getJob(id);
          job = out?.job ?? out;
        } catch (e) {
          if (my === seq) result.setBody(errorCard(e, { title: `Run ${id} could not be loaded` }));
          return;
        }
        if (my !== seq) return;
      }
      if (api.isActive(job)) {
        const r = jobRunner({
          job, title: job.label || KINDS[job.kind],
          onDone: ({ job: j }) => { if (my === seq) finished(j || job, r); },
        });
        runner = r;
        result.setBody(r);
      } else finished(job, null);
    }

    // ------------------------------------------------------------ recent runs

    let recentRows = [];
    const recentErr = h('p.error-msg.small', { hidden: true });
    const recentTbl = table({
      columns: [
        { key: 'created', label: 'Started', render: (j) => h('span', { title: fmt.date(j.created) }, fmt.ago(j.created)), csv: (j) => new Date(toMs(j.created)).toISOString() },
        { key: 'kind', label: 'Type', render: (j) => pill(KINDS[j.kind] || j.kind, j.kind === 'rate' ? 'warn' : 'info') },
        { key: 'label', label: 'Label', className: 'pv-label', render: (j) => h('span', { title: j.label || '' }, j.label || '—') },
        { key: 'round', label: 'Round', sort: (j) => (j.summary?.season || 0) * 100 + (j.summary?.gw || 0), render: (j) => roundLabel(j) || '—', csv: roundLabel },
        { key: 'status', label: 'Status', render: (j) => jobStatusPill(j.status) },
        { key: 'elapsed', label: 'Time', num: true, fmt: (v) => fmt.dur(v) },
        {
          key: null, label: '', sort: false, csv: false, className: 'pv-acts',
          render: (j) => h('span.row.tight', null,
            j.html_url ? h('a.icon-btn', { href: j.html_url, target: '_blank', rel: 'noopener', title: 'Open in new tab', 'aria-label': 'Open in new tab' }, icon('external', { size: 15 })) : null,
            h('button.icon-btn', { type: 'button', title: 'Delete run', 'aria-label': `Delete ${j.label || j.id}`, onClick: () => remove(j) }, icon('trash', { size: 15 }))),
        },
      ],
      rows: [], sortKey: 'created', sortDir: 'desc', onRow: (j) => showJob(j), maxHeight: 420, csv: 'previews.csv',
      rowClass: (j) => (j.id === currentId ? 'is-selected' : null),
      empty: 'No previews or ratings yet. Run one above.', caption: 'Recent previews and ratings',
    });

    async function remove(job) {
      const ok = await confirm({
        title: 'Delete this run?', danger: true, confirmLabel: 'Delete',
        body: `“${job.label || job.id}”: its log and page copy in forkcast/ui/runs are removed. The HTML file the solver wrote under ml/solver/sweeps is kept.`,
      });
      if (!ok) return;
      try {
        await api.deleteJob(job.id);
        if (job.id === currentId) { runner?.stop?.(); currentId = null; ctx.setParams({ ...ctx.params, job: undefined }); idle(); }
      } catch (e) {
        toast(errText(e), 'error');
      }
    }

    const recentCard = card({
      title: 'Recent previews and ratings',
      actions: h('button.btn.sm.ghost', { type: 'button', onClick: api.jobsChanged }, icon('reset', { size: 14 }), 'Refresh'),
      body: [recentErr, recentTbl],
    });

    el.append(h('div.grid-2.pv-forms', null, previewCard, rateCard), result, recentCard);

    if (ctx.params.job) showJob(ctx.params.job);
    let first = !ctx.params.job;  // with no ?job=, open the running preview or rating, if any
    const unwatch = api.watchJobs((jobs) => {
      recentRows = jobs.filter((j) => j.kind in KINDS);
      recentErr.hidden = true;
      recentTbl.update(recentRows);
      if (!first) return;
      first = false;
      const live = recentRows.find(api.isActive);
      if (live) showJob(live);
      else idle();
    }, (e) => {
      recentErr.textContent = e.message;
      recentErr.hidden = false;
      if (first) { first = false; idle(); }
    });

    return () => {
      seq++;  // a showJob still loading builds no runner
      runner?.stop?.();
      unwatch();
    };
  },
};
