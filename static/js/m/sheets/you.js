// Forkcast's You sheet (IPHONE_DESIGN §5.10): your team, rank and the points-to-places rate; the plan's status
// (forecast runs, when it was solved, the connection); Help (opened only when asked; Why Forkcast behind its last row:
// sheets/about.js); Switch team; Sign out of the team on this device; Refresh; Reset plan (ahead.resetPlan: this GW's
// plan as a new team's, toast with Undo). A Dev mode section (Open Studio; Open on iPhone) only on a local page
// (api.access). Settings, from Ahead's header gear (owner, 2026-10-29): Plan, the hits Forkcast may take a week
// (ahead.setHitsMaxWithUndo); Plan ahead, 1 to 4 GWs (ctx.weeks / setWeeks, kept per team in this browser; a length the
// server locks, meta.locked, can't be picked). The line every GW (COPY.cheerLine): one quiet line under the rank while
// rank.cheer is there.
// Sheet contract: static/js/m/app.js (open(ctx, what) → sheet; ctx.openSheet('you'[, 'help' | 'settings'])).

import { COPY, horizonFeature } from '../calls.js';
import { initials, resetPlan, inputsOf, plan, hitsChoices, setHitsMaxWithUndo, showTipsAgain, presolveTaps, planHasYours } from '../ahead.js';
import { clip } from './about.js';

/** Epoch s → "22:10" today, else "Thu 22:10". */
function when(epoch) {
  const ms = Number(epoch) * (Number(epoch) > 1e12 ? 1 : 1000);
  if (!Number.isFinite(ms) || !ms) return null;
  const d = new Date(ms);
  const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return d.toDateString() === new Date().toDateString() ? t : `${new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d)} ${t}`;
}
/**
 * When the model's plan was solved: its job's start plus its run time (job ids start with the server's local
 * submission time, "%Y%m%d-%H%M%S", so a queued wait is not counted).
 */
function solvedAt(road) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/.exec(road?.job || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() / 1000 + (Number(road.elapsed) || 0) : null;
}

/** The You sheet; `what` 'help': Help alone; 'settings': the Settings sheet (Ahead's header gear). */
export function open(ctx, what = null) {
  if (what === 'help') return helpSheet(ctx);
  if (what === 'settings') return settingsSheet(ctx);
  const { h, fmt, fill } = ctx.ui;
  const offs = [];

  return ctx.sheets.open({
    title: 'You', detent: 'large', label: 'You',
    onClose: () => { offs.forEach((f) => f()); presolveTaps(ctx, null, { owner: offs }); },
    build(body) {
      const team = h('div');
      const engine = h('div.m-sec');
      const dev = h('div.m-sec', { hidden: true });
      body.append(team, engine, settings(), dev);

      // Reset plan's tap solved ahead while this is open (presolveTaps; owner, 2026-10-26), where it takes something
      // off
      function presolveReset() {
        const P = plan(ctx);
        if (P?.editable && planHasYours(P)) presolveTaps(ctx, [{ kind: 'reset' }], { sig: 'reset', owner: offs });
      }

      // ---------------------------------------------------------------- team, rank, points to places
      function paintTeam() {
        const b = ctx.bundle;
        const e = b?.entry || {};
        const r = b?.rank || {};
        const gw = r.gw ?? b?.meta?.last_played;
        fill(team,
          h('div.y-team', null,
            h('span.y-avatar', { 'aria-hidden': 'true' }, initials(e)),
            h('div', null, h('h2.y-name', null, e.team_name || `Team ${e.id ?? ''}`),
              h('p.y-sub', null, [e.manager, e.id ? `Team ID ${e.id}` : null].filter(Boolean).join(' · ')))),
          h('div.y-stats', null,
            // 1928767 → "1.93M", 795123 → "795K": fmt.compact, two decimals on the M
            h('div', null, h('b.m-num', null, r.rank ? fmt.compact(r.rank, 2) : '—'), h('span', null, gw ? `overall rank after GW${gw}` : 'overall rank')),
            h('div', null, h('b.m-num', null, r.total ?? e.total ?? '—'), h('span', null, gw ? `points after GW${gw}` : 'points'))),
          // the line every GW (COPY.cheerLine) while the bundle has it
          r.cheer ? h('p.m-foot.y-cheer', null, COPY.cheerLine(r.cheer)) : null,
          r.places_per_pt ? h('p.m-foot.y-rate', null, COPY.exchange(r.places_per_pt, r.source || `GW${gw} standings`)) : null);
      }

      // ---------------------------------------------------------------- the plan's status
      function paintEngine() {
        const b = ctx.bundle;
        const conn = ctx.store.get('conn') || {};
        const f = b?.meta?.forecast || {};
        const model = b?.entry ? inputsOf(ctx)?.model ?? null : null;
        const baked = when(solvedAt(model));
        // plain facts only: the model's internals (runs, pool, noise, scale, solve counts) are Dev mode's
        let plan;
        if (conn.state === 'updating') plan = 'waiting: the forecast is updating';
        else if (b?.entry && !model) plan = COPY.waitShort;
        else plan = baked ? `ready since ${baked}` : '—';
        // while requests fail, said plainly (and the time of the data on screen)
        const link = conn.state === 'offline' ? `Forkcast server unreachable · data from ${when((conn.at || 0) / 1000) ?? '—'}` : 'online';
        fill(engine, h('h3', null, 'Status'),
          h('div.m-kv', null, h('span', null, 'Forecast'), h('span', null, when(f.updated_epoch) ? `updated ${when(f.updated_epoch)}` : '—')),
          h('div.m-kv', null, h('span', null, 'Plan'), h('span', null, plan)),
          h('div.m-kv', null, h('span', null, 'Connection'), h('span', { class: conn.state === 'offline' ? 'g-loss' : '' }, link)),
          // the front end's release (api.access), "dev" for the tree's own; none until the server has said
          acc ? h('div.m-kv', null, h('span', null, 'Version'), h('span.m-num', null, acc.release ?? 'dev')) : null,
          // (rows to their sheets, green with ›, not buttons: design 1028d K2)
          h('button.m-nav', { type: 'button', onClick: () => helpSheet(ctx) }, COPY.helpShort),
          // the app's pitch, from inside it too (owner, 2026-10-14)
          h('button.m-nav', { type: 'button', onClick: () => ctx.openSheet('about') }, COPY.whyTitle));
        paintDev();
      }

      // ---------------------------------------------------------------- team ID, refresh
      function settings() {
        const refresh = h('button.m-secondary', {
          type: 'button',
          onClick: async () => {
            refresh.disabled = true;
            refresh.textContent = 'Refreshing…';
            const b = await ctx.refresh({ hard: true });
            refresh.disabled = false;
            refresh.textContent = 'Refresh';
            const conn = ctx.store.get('conn');
            // one toast, "up to date" only after a refresh that worked (refresh() is null when it failed; off line the
            // banner says so, any other failure the loader's own toast)
            if (b) ctx.ui.toast('Your team is up to date. Forkcast re-plans if anything changed.', 'ok');
            else if (conn?.state === 'offline') ctx.ui.toast(ctx.api.plain(conn.error), 'warn');
          },
        }, 'Refresh');
        // the Team ID is in the header already: Change team… is the section's first button
        return h('div.m-sec', null, h('h3', null, 'Team'),
          h('button.m-secondary.y-change', { type: 'button', onClick: () => switchTeam(ctx) }, 'Change team…'),
          refresh,
          // your choices off at once, as for a new team (the model's solves stay); the toast has Undo
          h('button.m-secondary.m-danger', { type: 'button', onClick: () => { ctx.sheets.closeAll(); if (resetPlan(ctx)) ctx.navigate('ahead', {}, { replace: true, top: true }); } }, 'Reset plan'),
          signOutButton(ctx));
      }

      // ---------------------------------------------------------------- Dev mode (a local page only)
      // the model's diagnostics (runs, pool, noise, real-points scale) live here
      let acc = null;
      function paintDev() {
        if (!acc?.local || !dev.isConnected) return;
        const b = ctx.bundle;
        const f = b?.meta?.forecast || {};
        const noise = b?.entry ? inputsOf(ctx)?.model?.noise : null;
        dev.hidden = false;
        fill(dev, h('h3', null, 'Dev mode'),
          f.runs || f.pool ? h('div.m-kv', null, h('span', null, 'Forecast'), h('span', null, [f.runs ? `${f.runs} runs` : null, f.pool ?? null].filter(Boolean).join(' · '))) : null,
          Number.isFinite(noise) ? h('div.m-kv', null, h('span', null, COPY.chargeName), h('span', null, COPY.noiseValue(noise, b.meta.gw))) : null,
          b?.meta?.scale ? h('p.m-foot.y-scale', null, COPY.realScale(b.meta.scale)) : null,
          acc.share.length ? h('button.m-nav', { type: 'button', onClick: () => shareSheet(ctx, acc) }, 'Open on iPhone') : null,
          h('a.m-nav.y-studio', { href: '/studio/', target: '_blank', rel: 'noopener' }, 'Open Studio (Dev mode)'),
          h('p.m-foot.y-center', null, 'Every solver setting, the runs and the data jobs live in the Studio.'));
      }
      ctx.api.access().then((a) => { acc = a; paintEngine(); });

      paintTeam(); paintEngine(); presolveReset();
      offs.push(
        ctx.store.on('conn', paintEngine),
        ctx.store.on('data', () => { paintTeam(); paintEngine(); presolveReset(); }),
        ctx.store.on('memory', presolveReset),
      );
    },
  });
}

/** The plan's settings into `planSec` (the Settings sheet's): Most hits per GW and Plan ahead; its other Hits choices
 *  solved ahead while it shows (owner `offs`). → paintPlan */
function planSettings(ctx, planSec, offs) {
  const { h, fill } = ctx.ui;
  function paintPlan() {
    const P = plan(ctx);
    // no plan of the length picked (none solved yet: under a data job, or while it solves): Plan ahead stays, the way
    // back to one that has
    const reach = P?.reach ?? ctx.data?.reach;
    if (!P) { fill(planSec, ...(reach?.length ? [h('h3', null, 'Plan'), ...weeksCtl(reach, true)] : [])); return; }
    const { at, choices } = hitsChoices(P);
    const i = choices.findIndex(([n]) => n === at);
    fill(planSec, h('h3', null, 'Plan'),
      h('div.ah-optl', { id: 'y-hits-l' }, COPY.hitsHead),
      ctx.ui.roving(h('div.m-seg.y-hits', { role: 'radiogroup', 'aria-labelledby': 'y-hits-l', style: { '--n': choices.length, '--i': i } },
        h('span.m-seg-thumb'),
        choices.map(([n, l]) => h('button', {
          type: 'button', role: 'radio', 'aria-checked': String(n === at), dataset: { hits: n }, disabled: !P.editable,
          onClick: () => setHitsMaxWithUndo(ctx, n),
        }, l))), { pick: (b) => b.click() }),
      h('p.m-foot', null, COPY.hitsNote),
      ...weeksCtl(reach, P.editable));
    // its taps solved ahead while it is open (presolveTaps; owner, 2026-10-26): each other Hits choice
    if (P.editable) {
      presolveTaps(ctx, choices.filter(([n]) => n !== at).map(([n]) => ({ kind: 'hits', run: () => setHitsMaxWithUndo(ctx, n) })),
        { sig: `${at}`, owner: offs });
    }
  }
  /** Plan ahead: 1 week to the longest plan's (the bundle's reach), the one asked for checked (ctx.weeks: a locked pick
   *  falls back to the longest unlocked), a locked length (meta.locked) off with a line why. A pick re-plans at once
   *  (ctx.setWeeks). */
  function weeksCtl(reach, editable) {
    const locked = ctx.bundle?.meta?.locked || [];
    const ns = reach.map((_, k) => k + 1), at = ctx.weeks();
    const off = (n) => n > 1 && locked.includes(horizonFeature(n));
    return [h('div.ah-optl', { id: 'y-weeks-l' }, COPY.aheadHead),
      ctx.ui.roving(h('div.m-seg.y-weeks', { role: 'radiogroup', 'aria-labelledby': 'y-weeks-l', style: { '--n': ns.length, '--i': Math.max(0, ns.indexOf(at)) } },
        h('span.m-seg-thumb'),
        ns.map((n) => h('button', {
          type: 'button', role: 'radio', 'aria-checked': String(n === at), dataset: { weeks: n }, disabled: !editable || off(n),
          'aria-label': off(n) ? `${COPY.aheadSeg(n)}, locked` : null,
          onClick: () => { if (n !== at) { ctx.setWeeks(n); paintPlan(); } },
        }, off(n) ? ctx.ui.icon('lock', { size: 12 }) : null, COPY.aheadSeg(n)))), { pick: (b) => b.click() }),
      ns.some(off) ? h('p.m-foot.y-weeks-lock', null, COPY.aheadLocked) : null,
      h('p.m-foot', null, COPY.aheadNote)];
  }
  return paintPlan;
}

/** Settings (Ahead's header gear; owner, 2026-10-29): the plan's settings (planSettings), painted again as the plan and
 *  its memory change. */
function settingsSheet(ctx) {
  const offs = [];
  return ctx.sheets.open({
    title: COPY.settingsTitle, detent: 'large', label: COPY.settingsTitle,
    onClose: () => { offs.forEach((f) => f()); presolveTaps(ctx, null, { owner: offs }); },
    build(body) {
      const planSec = ctx.ui.h('div.m-sec');
      body.append(planSec);
      const paintPlan = planSettings(ctx, planSec, offs);
      paintPlan();
      offs.push(ctx.store.on('data', paintPlan), ctx.store.on('memory', paintPlan));
    },
  });
}

/** Help (COPY.help): its lead, About Forkcast (sheets/about.js), first; then one section per task, folded but the first
 *  (helpFold), each a recording of its steps on the real app (about.js clip) over a short list of actions; then the
 *  button that shows the first-use hints again. */
function helpSheet(ctx) {
  const { h, uid } = ctx.ui;
  // the charge's points (the forecast noise of GW A: inputsOf), none before a plan
  const I = ctx.bundle && ctx.data ? inputsOf(ctx) : null;
  return ctx.sheets.open({
    title: COPY.helpShort, detent: 'large',
    build(body) {
      body.append(h('p.y-lead', null, COPY.helpLead),
        h('button.m-nav.y-why', { type: 'button', onClick: () => ctx.openSheet('about') }, COPY.whyTitle),
        ...COPY.help(I?.noise ?? null, I?.A).map(([head, items, key], i) => helpFold(h, uid, head,
          [key ? clip(key, head) : null, h('ul', null, items.map((t) => h('li', null, t)))], i === 0)),
        h('button.m-secondary', { type: 'button', onClick: () => { showTipsAgain(ctx); ctx.sheets.closeAll(); } }, COPY.tipsAgain));
    },
  });
}

/** One Help section: its head a real button in a heading (a <summary> was no control to VoiceOver), aria-expanded
 *  turning its chevron (m-you.css). Recording and list stay the section's own children, so about.js clip fits the
 *  recording on the screen (fig.parentElement). */
function helpFold(h, uid, head, body, open) {
  const parts = body.filter(Boolean);
  for (const el of parts) { el.id = uid('help'); el.hidden = !open; }
  const btn = h('button', {
    type: 'button', 'aria-expanded': String(open), 'aria-controls': parts.map((el) => el.id).join(' '),
    onClick: () => {
      const on = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(on));
      for (const el of parts) el.hidden = !on;
    },
  }, head);
  return h('section.y-help', null, h('h3', null, btn), parts);
}

/** The team's name for "Sign out of <team>": the bundle's, else the recent list's, else its ID. */
const teamName = (ctx) => ctx.bundle?.entry?.team_name || ctx.api.recent.list().find((r) => String(r.entry_id) === String(ctx.store.get('entry')))?.team_name
  || `Team ${ctx.store.get('entry') ?? ''}`.trim();

/** "Sign out of <team>" (destructive, no confirm, no toast). This device and the server forget the team's choices
 *  (owner, 2026-10-22); the recent chips keep it for a one-tap return, as a fresh plan. */
function signOutButton(ctx) {
  const { h } = ctx.ui;
  return h('button.m-secondary.m-danger.y-signout', { type: 'button', onClick: () => ctx.signOut() }, `Sign out of ${teamName(ctx)}`);
}

/** Switch team (a second sheet): the shared team picker (./picker.js: name search, the ID or a pasted FPL address; Find
 *  my team, then Recent). Closing it without a pick keeps the current team; Sign out is the way to leave it. */
function switchTeam(ctx) {
  const { h } = ctx.ui;
  let picker = null;
  ctx.sheets.open({
    title: 'Change team', detent: 'large', onClose: () => picker?.destroy(),
    build(body) {
      picker = ctx.teamPicker({ onPick: (id) => { ctx.sheets.closeAll(); ctx.connect(id); }, recent: 4 });
      body.append(h('div.y-switch', null, picker.el, h('button.m-primary', { type: 'button', onClick: () => picker.submit() }, 'Find my team')),
        picker.recent, signOutButton(ctx));
      setTimeout(() => picker.focus(), 350);
    },
  });
}

/**
 * Open on iPhone (a local page of a server run with --lan or --public): the address another device opens Forkcast at,
 * as a QR (static/js/vendor/qr.js) and as text.
 */
function shareSheet(ctx, acc) {
  const { h, fill } = ctx.ui;
  const [url, ...more] = acc.share;
  const qrBox = h('div.y-qr', { hidden: true });
  import('../../vendor/qr.js').then(({ qrSvg }) => {
    fill(qrBox, qrSvg(url));
    qrBox.hidden = false;
  }).catch((e) => console.error('Forkcast: no QR code', e));  // the address below still works
  const where = acc.mode === 'lan' ? 'The iPhone needs to be on the same Wi-Fi as this computer.' : 'Works from anywhere.';
  ctx.sheets.open({
    title: 'Open on iPhone', sub: "Scan with the iPhone's Camera, or type the address into Safari.", detent: 'large',
    build(body) {
      body.append(
        h('div.y-share', null, qrBox,
          h('div.y-url.m-num', null, url),
          h('button.m-chipbtn', { type: 'button', onClick: () => ctx.ui.copyText(url, 'Address copied.') }, 'Copy address'),
          more.length ? h('p.m-foot', null, 'Also: ', more.join(' · ')) : null),
        h('p.m-note', null, where, ' Then tap Share, then Add to Home Screen, to keep Forkcast one tap away.'));
    },
  });
}
