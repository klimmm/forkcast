// Docs: how this solver works, then every setting from /api/flags (the same text the tooltips show).
// Deep links: #/docs?flag=<dest or --flag> scrolls to a setting, ?section=<id> to a section, ?q= searches.
// In the prose, `--flag` in backticks links to that flag's entry.

import * as api from '../api.js';
import {
  h, card, icon, pill, flagLabel, empty, errorCard, loading, copyText, toast, norm, blankish, showValue, seasonDefaults,
  groupFlags, flagHaystack, unitView,
} from '../ui.js';

const show = (v) => showValue(v, ', ');

/** The overview, one entry per section. Every statement here was checked against ml/solver. */
function howItWorks(meta) {
  const pool = meta?.default_pool ? ` (${meta.default_pool} for ${meta.season})` : '';
  const prod = meta?.prod_alias?.dirs?.length ? ` (${meta.prod_alias.dirs.join(', ')})` : '';
  return [
    {
      id: 'rolling', title: 'The rolling plan',
      body: [
        'The solver plans with a mixed-integer program solved by HiGHS. At each gameweek it optimises a window of upcoming gameweeks (`--w`, 4 by default) starting from your current squad, commits only the first gameweek of the window (its transfers, starting XI, bench order, captain and chip), then moves one gameweek on and solves again from the squad it just committed.',
        'The later gameweeks of each window are a look-ahead plan. They shape this week’s decision, so a transfer that pays off in two weeks can still win, but they are re-decided every week. The planner shows them as the plan timeline. `--horizon-w` can discount far rounds; by default every window round counts in full.',
        'The objective is predicted points: the starting XI, the captain’s extra share and the bench weighted by slot, minus a charge for each transfer and for any hits, plus a credit for free transfers carried out of the window. By default only the leading window round(s) use integer variables (`--int-rounds`); later rounds are solved as a relaxation, which keeps each solve quick.',
        'Solves are exact (relative gap 0 unless `--gap` or `--fast` relaxes it) and deterministic: the same inputs give the same plan.',
        'A run commits every gameweek from `--from-r` to `--to`. Over past gameweeks that is a backtest scored against actual points. To plan your live team, set `--from-r` to the next gameweek: only that gameweek is committed and the rest of the window is the plan.',
      ],
    },
    {
      id: 'predictions', title: 'Predictions',
      body: [
        'Forecasts come from a prediction pool: a folder under ml/data/predictions with one file per trained seed of the neural model. Each file gives every player’s expected points at an anchor gameweek for five horizons, h0 to h4: the anchor gameweek and the four after it.',
        'The solver keeps one file per seed (chosen by `--sel-by`, loss by default), averages the seeds into one pooled forecast per player and gameweek, and a window of w gameweeks reads horizons h0 to h(w−1).',
        `Each season has a default pool${pool}. \`--dir prod\` pools the production folders${prod}, which the Data tab’s “Refresh predictions” job re-infers for the next deadline. \`--pool\` a or b uses one half of the seeds and \`--seeds\` an explicit list.`,
        'Players owned by under 0.3% at the anchor are not buyable (`--min-sel`); players you hold and must-haves are exempt.',
      ],
    },
    {
      id: 'tau', title: 'τ, the noise floor',
      body: [
        'Seeds disagree. For every player the solver measures how much his window-total forecast varies across seeds; τ is √2 times the mean cross-seed standard deviation. It is a restraint on transfers and deliberately does not shrink as the pool gets more seeds.',
        'By default τ is the price of a transfer in the objective (`--ft-cost` −1), so a buy has to beat the noise to be made. Buys later in the window pay less: their charge is τ measured over the rounds they have left to pay back. τ also values a free transfer carried out of the window (`--ft-value` −1) and sets several tolerances: keep-best (`--keep-best-tau`), the crowd captain tie-break (`--cap-tie-tau`) and the tie pool (`--tie-cost`).',
        'τ is re-measured for each anchor gameweek. `--tau` pins one value for the whole run and turns that schedule off.',
        'Hits: there are no voluntary hits by default (`--max-hits` resolves to 0). If a gameweek cannot be solved without one, a relief ladder may take a single hit. `--hit-cost` prices hits in the objective; `--hit-cost-actual` (4) is what realised scoring deducts.',
      ],
    },
    {
      id: 'ownership', title: 'Ownership, EO and crowd calibration',
      body: [
        'Ownership comes from the top-100k cohort (`--own-top-rank` picks the cohort, lagged by `--own-lag` rounds) and FPL’s overall selected-by percentage.',
        'Crowd calibration (`--own-cal`, on by default) brings the crowd’s squad into rebuilds (the season’s first build and later rebuilds). It is gated: the crowd-tilted squad is adopted only if the model rates it at least as high as its own squad for the anchor gameweek (at the season opener, within a τ tolerance), and the tilt is paid on the anchor gameweek only. These defaults are on, so passing `--own-cal`, `--own-cal-gate`, `--own-cal-gate-tau-opener` or `--own-cal-anchor-only` switches the matching part off.',
        'Effective ownership: `--eo-w` anchors decisions to lagged effective ownership to manage rank risk. It is off (0) by default.',
      ],
    },
    {
      id: 'captaincy', title: 'Captaincy',
      body: [
        'The armband is limited by r/FantasyPL captain polls. A player may captain the gameweek being committed if he ranks in the poll’s top `--cap-top` (2) or takes at least `--cap-min-share` of the votes (20%). When no player reaches `--cap-free-below` (30%), or there is no poll for the gameweek, the filter stands down and the solver captains its own top forecast.',
        'Polls refresh at the start of each solve when the cached one is older than `--poll-max-age` hours (6). New polls are registered by hand; the Data tab shows when a gameweek has none.',
        'Near-equal captain choices go to the crowd’s pick within `--cap-tie-tau` (by default τ for one gameweek). Triple captain counts the captain three times, by default only for a player already owned at the anchor (`--tc-owned-only`). `--no-cap` removes captain points and the triple captain.',
      ],
    },
    {
      id: 'chips', title: 'Chips',
      body: [
        'Manual: `--wc`, `--fh`, `--bb` and `--tc` pin chips to gameweeks (from 2025 there are two of each, one per half) and the plan is built around them. They are not checked against chips your entry has already played; the planner warns when one falls in the current half of the season and your loaded team has already played that chip there. `0` drops a chip’s season default.',
        'Named plans: `--plan` picks a stored schedule (2024 and 2025 only). With no chip flags, 2024 and 2025 use their default schedules; 2026 has none, so no chips are played unless you set them. `--no-chips` turns chips off.',
        'Automatic: `--chip-auto` decides at every gameweek whether to play a chip now and which to plan later. It trial-solves candidate chip assignments over the window, scores each by its gain over holding, and keeps the best. It knows which chips your entry has left (from 2025, one of each per half-season), and it ignores any manual plan.',
        'Effects: a wildcard or free hit makes that gameweek’s transfers free and unlimited, and a free-hit squad reverts the next week. Bench boost counts the bench like the starting XI. Triple captain doubles the captain bonus.',
      ],
    },
    {
      id: 'bench', title: 'Bench weights',
      body: [
        'Bench players count for a fraction of their forecast, by slot: the backup keeper, then substitutes one to three (`--bn-w-slots`, four numbers or a derived spec). The default, auto-raw, derives each slot’s chance of coming on from the previous season: how often a nailed starter (60+ minutes, fit) played no minutes the next gameweek.',
        'Separate tables apply to the look-ahead rounds (`--bn-w-slots-future`), to builds and rebuilds (`--bn-w-slots-build`) and to free hits (`--bn-w-slots-fh`, a near-zero bench). With bench boost the bench counts in full.',
      ],
    },
    {
      id: 'fresh', title: 'Best 15 from scratch',
      body: [
        '`--fresh` solves each gameweek on its own: a one-gameweek window (`--w` 1), no chips and the 0.3% ownership buy gate.',
        'With no team loaded it builds the best 15 from the full budget (`--budget`, £100.0m) every gameweek, with a near-zero build bench, so a multi-week fresh run is a free-hit-every-week upper bound, not a playable season.',
        'With `--entry` or `--team-state` it is not a rebuild: each gameweek is an ordinary one-gameweek transfer move from your real squad, bank and free transfers, and the squad goes back to that starting point after every gameweek. For a wildcard squad from your team for the next deadline, play the wildcard in that gameweek instead (`--wc N` with `--from-r N`); the planner’s “Wildcard in GWn” button sets this.',
      ],
    },
    {
      id: 'entry', title: 'Your team: entry import and selling prices',
      body: [
        '`--entry` loads your FPL team from the public FPL API with no login: history, transfers and each gameweek’s picks, cached under ml/solver/data/entry_data/<season>/<id>/ (tracked in git). It is fetched again only when the cached history lacks the needed gameweek or that gameweek is not scored yet.',
        'From it the solver rebuilds every past gameweek (XI, bench, captain, bank, free transfers replayed with FPL’s rules and capped at 5, hits and chips) and starts from the squad held before `--from-r`, or the squad before it if that gameweek was a free hit.',
        'Purchase prices are the cost of the latest transfer in, or the season-start price for players held since the start. Selling prices are not read from FPL: the solver applies FPL’s rule (you keep half of any rise, rounded down) and plans the budget with them.',
        '`--ft` and `--cash` override the starting free transfers and bank (on the command line the bank is in tenths of £m, 15 = £1.5m; the Studio’s boxes take £m; 0 is ignored). `--team-state` starts from a saved squad file instead, such as one written by the planner’s squad editor, and replaces the entry history.',
        'Two other modes write HTML instead of a plan, shown in the Preview tab: `--preview` is a one-page report for a gameweek, and `--rate-team` scores your entry’s squad between a random legal squad and the model’s best 15 and lists the best one-, two- and three-transfer moves.',
      ],
    },
  ];
}

const WIDGET = {
  toggle: 'On/off switch', rounds: 'Gameweek list', players: 'Player list', select: 'Choice',
  pool: 'Prediction folders', season: 'Season', text: 'Text',
};
function typeText(f) {
  const w = f.widget === 'number' ? (f.kind === 'int' ? 'Whole number' : 'Number') : WIDGET[f.widget] || f.kind;
  const uv = unitView(f);
  return f.unit ? `${w} (${f.unit}${uv ? `; the Studio’s boxes take ${uv.unit}` : ''})` : w;
}
function defaultText(f) {
  if (f.kind === 'bool') return f.inverted ? `On. Passing ${f.flag} turns it off.` : `Off. Passing ${f.flag} turns it on.`;
  return blankish(f.default) ? 'Not set' : show(f.default);
}
function choicesText(c) {
  if (!c?.length) return null;
  return c.length <= 12 ? show(c) : `${c.length} options, e.g. ${c.slice(0, 4).join(', ')}…`;
}

export default {
  route: 'docs',
  title: 'Docs',
  icon: 'docs',
  async mount(el, ctx) {
    el.append(loading('Loading the settings catalogue…'));
    let flags;
    try {
      flags = await api.getFlags();
    } catch (e) {
      el.replaceChildren(errorCard(e, { title: 'Settings could not be loaded', retry: () => ctx.navigate('docs', ctx.params) }));
      return;
    }
    const meta = await api.getMeta().catch(() => null);
    const all = flags?.flags || [];
    const byDest = new Map(all.map((f) => [f.dest, f]));
    const refs = new Map(); // "--from-r" / "--from" / "from_r" → dest
    for (const f of all) {
      for (const o of [f.flag, ...(f.aliases || [])]) if (o) refs.set(o, f.dest);
      refs.set(f.dest, f.dest);
    }
    const destOf = (s) => (s == null ? null : refs.get(String(s).trim()) ?? null);

    const flagRef = (dest, text) => h('a.doc-ref', { href: `#/docs?flag=${encodeURIComponent(dest)}`, dataset: { flag: dest } }, h('code', null, text));
    const rich = (text) => text.split(/(`[^`]+`)/).map((part) => {
      if (!part.startsWith('`')) return part;
      const code = part.slice(1, -1);
      const dest = destOf(code.split(/[\s=]/)[0]);
      return dest ? flagRef(dest, code) : h('code', null, code);
    });

    // ------------------------------------------------------------ how it works

    const sections = howItWorks(meta);
    const howCard = card({
      title: 'How it works', sub: 'What the solver does with your settings, in the order it matters.',
      className: 'doc-how', id: 'doc-how',
      body: sections.map((s) => h('section.doc-sec', { id: `sec-${s.id}` }, h('h3', null, s.title), s.body.map((p) => h('p', null, rich(p))))),
    });

    // ------------------------------------------------------------ settings reference

    const entries = new Map();
    function entry(f) {
      const meta = [
        ['Default', defaultText(f)],
        ['Special values', f.sentinel_note],
        ['Season defaults', seasonDefaults(f, ', ')],
        ['Type', typeText(f)],
        ['Choices', choicesText(f.choices)],
        ['Also', [...(f.aliases || []), f.abbrev && `${f.abbrev} (shortest prefix)`].filter(Boolean).join(', ') || null],
      ].filter(([, v]) => !blankish(v));
      const art = h('article.doc-flag', { id: `flag-${f.dest}`, dataset: { dest: f.dest }, tabindex: -1 },
        h('header.doc-flag-head', null,
          h('h4', null, flagLabel(f)),
          h('code.doc-flag-name', null, f.flag),
          f.inverted ? pill('on by default', 'gain', { title: `Passing ${f.flag} turns it off` }) : null,
          f.advanced ? h('span.flag-adv', { title: 'Advanced setting' }, 'adv') : null,
          h('span.spacer'),
          h('button.icon-btn.doc-link', {
            type: 'button', title: 'Copy a link to this setting', 'aria-label': `Copy a link to ${flagLabel(f)}`,
            onClick: () => { copyText(`${location.origin}${location.pathname}#/docs?flag=${f.dest}`, 'Link copied'); ctx.setParams({ flag: f.dest }); },
          }, icon('copy', { size: 14 }))),
        f.help ? h('p.doc-help', null, f.help) : h('p.doc-help.muted', null, 'No description yet.'),
        meta.length ? h('dl.doc-meta', null, meta.map(([k, v]) => [h('dt', null, k), h('dd', null, v)])) : null);
      art.hay = flagHaystack(f);
      entries.set(f.dest, art);
      return art;
    }

    const groups = groupFlags(all, flags?.groups);

    const groupEls = groups.map((g) => {
      const count = h('span.doc-count', null, g.fs.length);
      const sec = h('section.doc-group', { id: `group-${g.key}` },
        h('h3', null, g.title || g.key, count),
        g.blurb ? h('p.doc-blurb', null, g.blurb) : null,
        g.fs.map(entry));
      return { g, sec, count };
    });

    const search = h('input.input', { type: 'search', placeholder: `Search ${all.length} settings by name, flag or text`, 'aria-label': 'Search settings', value: ctx.params.q || '' });
    const status = h('span.muted.small');
    const none = empty('No setting matches that search.');
    function filter(q) {
      const terms = norm(q).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const { g, sec, count } of groupEls) {
        let n = 0;
        for (const f of g.fs) {
          const art = entries.get(f.dest);
          art.hidden = !terms.every((t) => art.hay.includes(t));
          if (!art.hidden) n++;
        }
        sec.hidden = !n;
        count.textContent = n === g.fs.length ? n : `${n}/${g.fs.length}`;
        shown += n;
      }
      none.hidden = shown > 0;
      status.textContent = terms.length ? `${shown} of ${all.length} match` : `${all.length} settings`;
    }
    let searchT = 0;
    search.addEventListener('input', () => {
      clearTimeout(searchT);
      searchT = setTimeout(() => { filter(search.value); ctx.setParams({ q: search.value.trim() || undefined }); }, 120);
    });

    const refCard = card({
      title: 'Settings reference', id: 'doc-ref', className: 'doc-ref-card',
      sub: 'Every solver flag, grouped as in the planner’s settings drawer. Tooltips across the Studio show the same text.',
      body: [h('div.doc-search', null, h('div.search-box', null, icon('search', { size: 16 }), search), status), none, groupEls.map((x) => x.sec)],
    });

    // ------------------------------------------------------------ presets

    const presets = (flags?.presets || []).filter((p) => p.builtin);
    const presetCard = presets.length ? card({
      title: 'Built-in presets', id: 'doc-presets', sub: 'Starting points in the planner’s preset menu.',
      body: h('div.doc-presets', null, presets.map((p) => h('div.doc-preset', null,
        h('div.strong', null, p.name),
        p.description ? h('p.small.muted', null, p.description) : null,
        h('div.chips', null, Object.entries(p.values || {}).map(([d, v]) => {
          const f = byDest.get(d);
          return f ? flagRef(d, `${f.flag}${typeof v === 'boolean' ? '' : ` ${show(v)}`}`) : h('code', null, `${d}=${show(v)}`);
        }))))),
    }) : null;

    // ------------------------------------------------------------ table of contents & navigation

    const tocLink = (label, target, extra) => h('a.doc-toc-link', { href: `#/docs?section=${encodeURIComponent(target)}`, dataset: { target } }, label, extra);
    const toc = h('nav.doc-toc', { 'aria-label': 'Docs contents' },
      h('div.doc-toc-label', null, 'How it works'),
      sections.map((s) => tocLink(s.title, `sec-${s.id}`)),
      h('div.doc-toc-label', null, 'Settings'),
      groupEls.map(({ g }) => tocLink(g.title || g.key, `group-${g.key}`, h('span.doc-count', null, g.fs.length))),
      presetCard ? [h('div.doc-toc-label', null, 'More'), tocLink('Built-in presets', 'doc-presets')] : null);

    function flash(node) {
      node.classList.remove('flash');
      void node.offsetWidth; // restart the animation
      node.classList.add('flash');
    }
    function goSection(id, smooth = true) {
      const node = document.getElementById(id);
      if (!node) return false;
      if (node.hidden) { search.value = ''; filter(''); }
      node.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
      return true;
    }
    function focusFlag(raw, smooth = true) {
      const dest = destOf(raw);
      const art = dest && entries.get(dest);
      if (!art) { toast(`No setting called “${raw}”`, 'warn'); return; }
      if (art.hidden) { search.value = ''; filter(''); ctx.setParams({ flag: dest }); }
      art.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
      art.focus({ preventScroll: true });
      flash(art);
      ctx.setParams({ flag: dest });
    }
    // In-page links: scroll here instead of letting the hash router remount the view.
    el.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-flag], a[data-target]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      if (a.dataset.flag) focusFlag(a.dataset.flag);
      else if (goSection(a.dataset.target)) ctx.setParams({ section: a.dataset.target });
    });

    el.replaceChildren(h('div.doc-layout', null, toc, h('div.stack.doc-main', null, howCard, refCard, presetCard)));
    filter(search.value);

    const { flag, section } = ctx.params;
    if (flag || section) requestAnimationFrame(() => (flag ? focusFlag(flag, false) : goSection(section, false)));

    return () => clearTimeout(searchT);
  },
};
