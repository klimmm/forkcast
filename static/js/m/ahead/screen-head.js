// screen.js mount: the head, the status, the bake's wait and the week line's model

import { h, fill, append, toast, icon, roving, reduceMotion, focusKey, refocus } from '../../ui.js';
import { aboutRules, clashLine, clashParts, edit, pendingAgain, pendingTick, removeRule, rescope, resetLineup, ruleOf, sayCheer, scopeLabels, toastOf, vsPrev } from './edits.js';
import { deadlineInfo, fplSets, initials, inkAt, isLive, liftsLive, resetPlan, rowName, watchOf, watchView } from './buys.js';
import { COPY, liveCheck, planEta, planShare, steadyEta, clockText, stepShare, leftText } from '../calls.js';
import { FLASH, LEARN_KEY, WAIT_KEY, editable, info, lockedFrom, memOf, memPlan, num, paintWaitView, plan, span, takeRulesAsk, viewedGw, weekOf } from './core.js';
import { factsWords, itbWords, squadWeek } from './pieces.js';
import { decksOf, forkKey, listedOf, litOf, litShown, planBack, plansOf, settleDue, weekKey, weekSettled, weekWait } from './plans.js';
import { REPLANNING, countdownParts, cssPx, deadlineOf, listedRules, pitchLeast } from './screen.js';

export function headPart(V) {
  const pageName = (team) => h('h1.sr-only', null, team ? `${team} · Forkcast` : 'Forkcast');
  /** The Reset's one tap (S.reset: what of yours the viewed GW and the plan hold): the one reset that applies, or the
   *  choice of both (resetSheet). */
  function resetTap() { const { S, ctx } = V;
    const r = S.reset;
    if (!r) return;
    if (r.lu && r.plan) resetSheet(r.gw);
    else if (r.lu) resetLineup(ctx, r.gw);
    else if (r.plan) resetPlan(ctx);
  }
  /** Reset's choice where your GW g lineup and your plan both have something to take back (a small sheet of rows, each
   *  its words and what it does): Reset lineup first, the smaller take-back, then Reset plan (m.css:37-44), each its
   *  toast with Undo as its one-tap pill's; ✕ or a swipe down takes nothing back. */
  function resetSheet(g) { const { ctx } = V;
    const title = COPY.resetTitle;
    ctx.sheets.open({
      title, detent: 'medium', fit: true, cls: 'cs ah-rssheet', label: title,
      build(body, sheet) {
        const row = (name, what, run) => h('button.ah-lrow', { type: 'button', 'aria-label': `${name}: ${what}`, onClick: () => { sheet.close(); run(); } },
          h('span.mk', { 'aria-hidden': 'true' }, '\u21BA'), h('span.nm', null, h('b', null, name), h('span', null, what)));
        append(body, h('div.ah-list', { role: 'group', 'aria-label': title },
          row(COPY.resetLineupName(g), COPY.resetLineupWhat(g), () => resetLineup(ctx, g)),
          row('Reset plan', COPY.resetPlanWhat, () => resetPlan(ctx))));
      },
    });
  }
  /** First-use hint `name` done (LEARN_KEY): never drawn again on this browser. The Week sheet's go with the edit's own
   *  re-draw; the pitch's at once (a C dropped off a starter draws nothing). */
  function learn(name) { const { HINTS, S, ctx } = V;
    if (S.learnt.has(name)) return;
    S.learnt.add(name);
    ctx.api?.local?.set?.(LEARN_KEY, JSON.stringify([...S.learnt]));
    for (const [n, k] of HINTS) if (k === name) n.hidden = true;
  }

  const gwNow = (P) => { const { ctx } = V; return viewedGw(ctx, P); };
  const setGw = (g) => { const { ctx } = V;
    const P = plan(ctx);
    if (!P) return;
    if (!P.gws.includes(g)) {
      // a GW past your plan (Settings → Plan ahead): how to plan it, or that every plan reaching it is locked (edgeTicks)
      const n = P.reach.indexOf(g) + 1;
      if (n > 0 && g > P.end) toast(lockedFrom(P, n) ? COPY.weekLocked(g) : COPY.weekOff(g, P.gws.length), 'info');
      else if (g > P.end) toast(`${COPY.forecastEdge(g)} Plans cover ${span(P.gws)}.`, 'info');
      return;
    }
    ctx.store.set('gw', g);
  };
  const outerH = (x) => {
    const s = getComputedStyle(x);
    return x.getBoundingClientRect().height + parseFloat(s.marginTop) + parseFloat(s.marginBottom);
  };
  /** The week line as it renders at its width: one strip (the status is on the pitch: statusTok), doors at its right
   *  end, the week's facts (fitFacts), the checks, then "Out: …" or GW A's lineup notice (renderLine). Each is probed,
   *  so the pitch is fitted for the tallest week line and every week keeps that height (--ah-bar-h, m-ahead.css): the
   *  pitch never moves on a GW switch. Taller (larger text size): the line as drawn, doors under it (owner,
   *  2026-10-22). */
  function fitBlock() { const { FACTS_PROBE, barNode, doorStubs, factSpans, strip } = V;
    const real = strip.querySelector(':scope > .ah-block:not(.ah-fitprobe)');
    strip.style.removeProperty('--ah-bar-h');
    const { gw, bank } = FACTS_PROBE, sep = '\u00a0·\u00a0';
    const facts = () => factSpans(factsWords(FACTS_PROBE), true), chk = h('span.ah-chk', null,
      h('span.ah-bn.ah-cw', null, COPY.checkingWeek(gw, 10, 10, 'plan')), h('span.ah-wclock.m-num', null, `${sep}0:00`));
    const checks = [h('span.ah-blead', null, h('span.ah-fact', null, COPY.ftNow(FACTS_PROBE.ft)), ' · ', h('span.ah-fact', null, itbWords(bank)[0]), sep),
      h('span.ah-brest', null, chk)];
    const probes = [facts(), checks].map((two) => {
      const b = h('section.ah-block.ah-fitprobe', { 'aria-hidden': 'true' }, barNode({ one: h('span.ah-bt.ah-bst', null, h('span.ah-tl', null, COPY.rollingNow)), two, doors: doorStubs() }));
      b.style.width = `${strip.clientWidth}px`;
      strip.append(b);
      return b;
    });
    const hgt = (x) => x.getBoundingClientRect().height;
    const v = Math.max(...probes.map((b) => hgt(b)), real ? hgt(real) : 0);
    const bar = real?.querySelector(':scope > .ah-pbar');
    strip.style.setProperty('--ah-bar-h', `${Math.max(...probes.map((b) => hgt(b.firstChild)), bar ? hgt(bar) : 0)}px`);
    for (const b of probes) b.remove();
    return v;
  }
  /** The header's height with its GW line as the deadline draws it, without the total's passing extras (≈, an edit's
   *  change: keepGwLine); a re-plan's progress stays on one line (paintPlanStatus). */
  function fitHead() { const { S, gwline, head, keepGwLine } = V;
    const busy = gwline.classList.contains('ah-planning');
    if (busy && S.dl) paintDeadline(S.dl.A);
    gwline.classList.add('ah-bare');
    keepGwLine();
    const v = outerH(head);
    gwline.classList.remove('ah-bare');
    if (busy) paintPlanStatus();
    keepGwLine();
    return v;
  }
  function fitPitch() { const { ctl, el, head, pitchHost, remProbe, slot, strip } = V;
    const W = el.clientWidth, H = el.clientHeight, rem = remProbe.getBoundingClientRect().height;
    const drawn = !!strip.querySelector(':scope > .ah-block > .ah-pbar:not(.ah-pbake)');
    const pm = pitchHost.querySelector(':scope > .pm');
    const key = `${W}x${H}@${rem}|${head.offsetHeight}|${slot.offsetHeight}|${drawn}|${!!pm}|${getComputedStyle(pitchHost).marginTop}`;
    if (!W || !H || ctl.hidden || key === V.fitKey) return;
    V.fitKey = key;
    V.fitDrawn = drawn && !!pm;
    const s = getComputedStyle(el);
    const above = parseFloat(s.paddingTop) + fitHead() + outerH(slot) + outerH(ctl) + parseFloat(getComputedStyle(strip).marginTop)
      + fitBlock() + parseFloat(getComputedStyle(pitchHost).marginTop) + parseFloat(s.paddingBottom);
    el.style.setProperty('--ah-pitch-fit', `${Math.floor(H - above)}px`);
    // pitchLeast from the width's and text size's tokens as resolved here (W, rem)
    if (!pm) return;
    const [chrome, hlo, plate, foot] = cssPx(pm, 'var(--pm-chrome)', 'var(--pm-hlo)', 'var(--pm-plate)', 'var(--pm-foot)');
    el.style.setProperty('--ah-pitch-least', `${Math.ceil(pitchLeast({ chrome, hlo, plate, foot }))}px`);
  }
  /** Choices placed again where the pitch's rows moved (resize, web fonts, a two-line fixture); focus stays on a tab,
   *  edge or token. */
  function redeck() { const { S, placeHint, renderDecks } = V;
    if (S.landing) return;  // cards still moving: placed once landed (landMotion)
    const keys = focusedKeys();
    renderDecks();
    placeHint();
    keepFocus(keys);
  }
  /** Store changes re-render once per task (a plan change inside a render must not re-enter it), but not while a finger
   *  is down (S.down: a background landing would replace the element under the gesture and strand it); it waits for the
   *  lift (lifted). Nor while a large sheet covers the screen: once, when it goes (uncovered). part 'mem': only plan
   *  memory changed; a change that leaves the plan view as drawn (plan: a saved echo of the document) draws nothing. */
  const schedule = (part = 'all') => { const { S, ctx } = V;
    S.part = !S.queued || S.part === part ? part : 'all';
    if (S.queued) return;
    S.queued = true;
    queueMicrotask(() => {
      S.queued = false;
      if (S.down.size || covered()) S.held = true;
      else if (S.part === 'pair' && S.drawn && plan(ctx) === S.drawn) renderPair();
      else if (S.part !== 'mem' || !S.drawn || plan(ctx) !== S.drawn) render();
    });
  };
  /** A large sheet covers the screen (app.js createSheets: .sheet-large) unless the Week sheet is the top one (app.js
   *  sync: sheets under the top one are inert): render draws it (renderWeek), so it keeps drawing at its large detent;
   *  a sheet over it holds it as the screen until it is top again (inert gone: weekSheet has `uncovered` watch it). */
  const covered = () => { const { S, shell } = V; return !!shell?.classList.contains('sheet-large') && !(S.week && !S.week.sheet.el.inert); };

  // ---------------------------------------------------------------- render

  /** The avatar (opens the You sheet): grey initials, a dot only when the plan isn't up to date (amber: updating or
   *  stale; hollow: offline). */
  function paintAvatar() { const { avatar, ctx } = V;
    const e = ctx.bundle?.entry;
    const st = ctx.status();
    fill(avatar, initials(e), st.tone === 'fresh' ? null : h('span.ah-dot', { class: st.tone }));
    avatar.setAttribute('aria-label', `You${e?.team_name ? ` · ${e.team_name}` : ''} · ${st.text}`);
  }
  /** The header: Help left, the team's name centred over the GW line (owner, 2026-10-22), the avatar (DESIGN_V2 §3.1). */
  function renderHead() { const { avatar, ctx, gwline, head, setBtn } = V;
    const team = ctx.bundle?.entry?.team_name ?? '';
    if (globalThis.document) document.title = team ? `${team} · Forkcast` : 'Forkcast';
    fill(head, pageName(team), setBtn, h('div.ah-hmid', null, h('div.ah-team', null, team), gwline), avatar);
  }
  /** "Gameweek 6 • Deadline: Sat 10 Oct at 13:00 (4d 17h)": always GW A, the week you act on, whatever GW g is viewed;
   *  data-gw is the GW last drawn (the harness waits on it). */
  function renderGwLine(g, A) { const { S, gwline } = V;
    S.dl = { g: A, A };
    gwline.dataset.gw = g;
    if (!paintPlanStatus()) paintDeadline(A);
  }
  /** GW A's deadline on the GW line: "Sat 13:00 · 4d 17h" (tick() runs the countdown). */
  function paintDeadline(A) { const { ctx, dlEl, gwline } = V;
    const info = deadlineInfo(deadlineOf(ctx.bundle, A, A));
    gwline.classList.remove('ah-planning');
    // "Sat 10:00 · 1d 11h", no "GW6" before it (the selected tile names the week; the prefix wrapped at 375 with larger
    // text); its title names the GW. "Deadline" is said, not shown (owner, 2026-10-22), leaving room for the window's
    // total.
    fill(dlEl, info.date ? [h('b', null, info.left <= 0 ? 'Deadline passed' : [h('span.sr-only', null, 'Deadline '), info.short]), h('span.ah-dl', { class: info.tone }, countdownParts(info))] : null);
    dlEl.title = info.date ? `Gameweek ${A} deadline: ${info.long}` : '';
  }
  /** A re-plan under way: a bake (baking; stale: a new forecast's) or the forecast updating. The state banner then
   *  speaks to assistive tech alone, the total shimmers (totalNum), the strip's wait line says how far (paintWait). */
  // (a first bake with its plan in, the base road: no re-plan any more, its other roads land as choices behind the
  // pitch; owner, 2026-11-02, "new team cold start": the pitch stayed grey "Planning" 25 s after its best showed)
  const replanning = () => { const { ctx } = V; const st = ctx.store.get('conn')?.state; return REPLANNING.has(st) && !(st === 'baking' && ctx.bundle?.roads?.base); };
  /** The strip's wait line (paintWait) says how far a re-plan is; the GW line keeps GW A's deadline. → false (none
   *  shows) */
  function paintPlanStatus() { const { gwline } = V;
    // every wait is told in one place, the wait line (paintWait), the first plan's too (owner, 2026-10-28)
    gwline.classList.remove('ah-planning', 'ah-story');
    return false;
  }
  /** Each second: the countdown, an edit's pending toast (pendingTick), the checks' clock (waitClock), the choices once
   *  their checks stop landing (weekSettled's bound), and a re-render once GW A's deadline passes. */
  function tick() { const { S, ctl, ctx, fitFacts, gwline, keepGwLine, pitchHost, strip } = V;
    const was = gwline.querySelector('.ah-dl')?.textContent;
    if (!ctl.hidden && (replanning() || S.story?.wait)) paintPlanStatus();
    paintStoryBar();
    pendingTick(ctx);
    if (S.wait) for (const c of [strip, pitchHost, S.week?.host].flatMap((x) => [...(x?.querySelectorAll('.ah-wclock') ?? [])])) c.textContent = clockShown(c);
    // refit the checks for a clock of more digits ("10:00")
    if (S.wait && S.line && waited().length !== S.line.n) { S.line.n = waited().length; fitFacts(); }
    const due = S.drawn && S.M && !S.M.settled ? settleDue(S.M.key) : null;
    if (due != null && Date.now() >= due) schedule('pair');
    const dl = gwline.querySelector('.ah-dl');
    if (dl && S.dl) {
      const info = deadlineInfo(deadlineOf(ctx.bundle, S.dl.A, S.dl.g));
      fill(dl, countdownParts(info));
      dl.className = `ah-dl ${info.tone}`;
      // a new countdown form ("1d 0h" to "23h 59m") refits the header's line (keepGwLine)
      if (dl.textContent !== was) keepGwLine();
    }
    if (isLive(ctx) !== S.live) { S.live = isLive(ctx); render(); }
  }

  /** The focused control of each part the plan redraws (ui.focusKey: a choice, its +, a transfer, the week line; a +
   *  that made a transfer finds it), refocused once drawn (keepFocus); the Week sheet's in its rows, never another
   *  sheet's. */
  const hosts = () => { const { S, decks, strip } = V; return [strip, decks, S.week?.host].filter(Boolean); };
  const focusedKeys = () => hosts().map((x) => [x, x.contains(document.activeElement) ? focusKey(document.activeElement) ?? '[data-focus-home]' : null]);
  /** …a control gone, keyless (a choice's +, Your rules' Remove, Hide) or hidden (ui.refocus): focus goes to the week
   *  line on the screen (its focus home), the sheet itself in the Week sheet. */
  const keepFocus = (keys) => { const { S, strip } = V;
    for (const [x, key] of keys) if (key && x.isConnected) refocus(x, key, x === S.week?.host ? S.week.sheet.el : strip.querySelector('[data-focus-home]'));
  };
  /** A suggested plan's solve landed (forkPump, pairChanged) on the plan view drawn: only the week line, the pitch's
   *  choices and an open Week sheet redraw. */
  function renderPair() { const { S, placeHint, renderDecks } = V;
    const P = S.drawn, w = weekOf(P, gwNow(P));
    if (!w) { render(); return; }
    const keys = focusedKeys();
    renderWeek(P, w);
    renderDecks();
    placeHint();
    keepFocus(keys);
  }

  function render() { const { S, asksHost, closePlace, ctl, ctx, decks, dlEl, landMotion, noticeSaid, pitchHost, placeHint, renderDecks, renderPdBtn, renderPitch, renderRail, renderTotal, strip, ticks, totLine, totSaid, totalEl, weekSheet } = V;
    const b = ctx.bundle;
    S.drawn = null;
    if (!b) return;
    paintAvatar();
    renderHead();
    if (b.state === 'offline-data' || !b.entry) {
      fill(strip, h('p.m-para.ah-pre', null, COPY.preseason));
      closePlace(false);
      [dlEl, totLine, asksHost, pitchHost, decks, ticks, totalEl, totSaid, noticeSaid].forEach((x) => fill(x));
      S.week?.sheet.close();
      ctl.hidden = true;
      return;
    }
    ctl.hidden = false;
    const P = plan(ctx);
    if (!P) return renderBaking();
    const g = gwNow(P);
    const w = weekOf(P, g);
    if (!w) return renderBaking();
    S.drawn = P;  // plan view on screen (schedule)
    // a landing not drawn yet (FLASH), this team's (setFlash)
    const fresh = FLASH && FLASH.at !== S.flashAt && FLASH.team === `${P.entry}|${P.A}` ? FLASH : null;
    if (fresh) S.flashAt = fresh.at;
    const keys = focusedKeys();
    // a sheet's ask (openRules): the Week sheet at Your rules, once this draw is done
    if (takeRulesAsk(g)) queueMicrotask(() => weekSheet(g, 'rules'));
    renderGwLine(g, P.A);
    renderRules(P);
    renderWeek(P, w);
    S.snap = null;  // cards as they stood, set by mountHere for landMotion
    renderPitch(P, w);
    renderRail(P, g);
    renderTotal(P);
    renderPdBtn();
    if (!V.fitKey || !V.fitDrawn) fitPitch();
    renderDecks();
    placeHint(P, w);
    keepFocus(keys);
    landMotion(fresh, g);
    if (fresh) {
      // ...tint once (m.css .m-shimmer.once; none under Reduce Motion): changed tiles, the week line after a transfer
      // of the viewed week, rows of an open Week sheet
      const tint = (x) => { x.classList.add('m-shimmer', 'once'); setTimeout(() => x.classList.remove('m-shimmer', 'once'), 950); };
      for (const t of ticks.querySelectorAll('.ah-tick')) if (fresh.gws.includes(Number(t.dataset.gw))) tint(t);
      const line = strip.querySelector('[data-row="week"]');
      if (line && fresh.rows?.[g]?.length) tint(line);
      for (const r of S.week?.host.querySelectorAll('.ah-mrow') ?? []) if (fresh.rows?.[g]?.includes(`${r.dataset.out}>${r.dataset.in}`)) tint(r.querySelector('.ah-fg') ?? r);
      // ...and the viewed week's changed cards, on their name plates (the card itself is see-through: the turf)
      for (const id of fresh.cards?.[g] ?? []) { const pn = pitchHost.querySelector(`.pm-card[data-id="${id}"] .pm-pn`); if (pn) tint(pn); }
    }
  }

  function renderBaking() { const { COPY_FPL_TEAM, S, asksHost, barNode, ctx, decks, doorStubs, edgeTicks, mountHere, plateOf, rail, renderPdBtn, rsBtn, strip, ticks, totLine, totalEl } = V;
    const d = ctx.data;
    renderGwLine(d.gw, d.gw);
    // the first week while planned: the week line says what it waits for, its doors' place held (no control yet), the
    // pitch shows your squad as is with no choice (it keeps its size when the plan lands)
    S.week?.sheet.close();
    // your team's first plan under the hold is the solver's (memory.keepBase): one it couldn't finish says so, a tap
    // asks again, never a phone-made plan (owner, 2026-10-26)
    // Plan memory only once the bake's base road is in (mount; app.js firstLoad): earlier, its heal would ask roads not
    // baked yet
    const gp = ctx.bundle?.roads?.base ? memPlan(ctx) : null, failed = !!gp?.hold && !!gp.error && !gp.pending;
    // …where your rules are what no plan keeps (an older app's phone-made plan dropped on load): the clash row with a
    // Remove on each rule it names, each said with its Undo, never silently
    const FV = failed ? { ...info(ctx), mem: gp, pins: gp.pins, weeks: [], healing: false, editable: editable(ctx) } : null;
    const c = FV && aboutRules(gp.error) ? clashParts(FV, null) : null;
    const off = (p) => { const said = COPY.removed(rowName(FV, p)), r = memOf(ctx).removePin(p.id); toastOf(ctx)(said, 'info', { action: { label: 'Undo', onClick: () => r.undo() } }); };
    fill(strip, h('section.ah-block', { 'aria-label': 'Your plan' }, failed
      ? barNode({ one: gp.error.plain || COPY.unfinished, two: 'Try again', warn: true, label: `${gp.error.plain || COPY.unfinished} Try again`, onClick: () => memOf(ctx).heal({ now: true }), doors: doorStubs(), cls: '.ah-pbake' })
      // (in the story the squad drawn is named: FPL's lineup until the plan's comes)
      : S.story ? barNode({ one: h('span.ah-bn', null, COPY_FPL_TEAM), doors: doorStubs(), cls: '.ah-pbake' })
      : barNode({ one: [h('span.ah-spin', { 'aria-hidden': 'true' }), h('span.ah-bn', null, planning(d.horizon))], status: true, doors: doorStubs(), cls: '.ah-pbake' }),
    c?.pins.length ? h('div.ah-brow.ah-ask.ah-clash', { role: 'status' }, icon('warn', { size: 16 }), h('p.ah-askt', null, COPY.rulesStuck(c.what, null, COPY.clashWhy(gp.error.why, gp.error.gw))),
      h('div.ah-askb', null, c.pins.map((p) => h('button.ah-askno', { type: 'button', disabled: !FV.editable, onClick: () => off(p) }, `Remove ${rowName(FV, p)}`)))) : null));
    fill(decks);
    S.M = null;
    S.wl = null;
    S.lineKeep = false;
    paintWait();
    S.pitch = null;
    S.reset = null;
    rsBtn.hidden = true;
    mountHere({
      ...d.lineup, players: d.byId, gw: d.gw, horizon: d.xpGws, first: true, benchRow: true, gapRows: true, second: plateOf().second,
      onPlayer: (id) => ctx.openSheet('player', id, { gw: d.gw }),
    });
    fill(asksHost);
    const past = edgeTicks({ reach: d.reach ?? d.horizon, gws: d.horizon });
    rail.style.setProperty('--n', d.horizon.length + past.length);
    rail.style.setProperty('--i', 0);
    fill(ticks, d.horizon.map((x) => h('div.ah-tick', { dataset: { gw: x } }, h('span.g', null, `GW${x}`), h('span.p', null, h('span.m-skel')))), past);
    fill(totLine, h('span.k', null, `${span(d.horizon)} `), h('span.m-skel'));
    fill(totalEl, span(d.horizon), ' ', h('span.m-skel'));
    renderPdBtn();
    if (!V.fitKey || !V.fitDrawn) fitPitch();
  }
  const planning = (gws) => `Planning ${span(gws)}…`;

  /** "Your rules" (RULES_V2 §4, DESIGN_V2 §3.7), the Week sheet's last part (asksHost): each veto, keep and cash rule
   *  you asked for (listedRules: your transfer in the viewed week is its own row, a GW's chip its options) is a row
   *  until Removed; "Clear all" acts at once (Undo). When no plan can keep them all, the status row says so in every
   *  week (clashRow). Drawn only when there is one. */
  function renderRules(P) { const { asksHost, ctx } = V;
    const rules = listedRules(P, gwNow(P));
    if (!rules.length) { fill(asksHost); return; }
    const live = isLive(ctx);
    // a Remove that would re-plan GW A under way is off, its reason once under the list
    const offLive = rules.some((p) => ruleOf(P, p).removable && liftsLive(ctx, P, p)) || (live && rules.length > 1);
    fill(asksHost, h('section.ah-rules', { 'aria-label': COPY.rulesHead },
      h('div.ah-list', null,
        h('div.ah-rules-row', { role: 'list' },
          rules.map((p) => {
            const r = ruleOf(P, p);
            return h('div.ah-rrow', { role: 'listitem' },
              h('button.ah-rule', { type: 'button', class: { lock: !r.removable }, 'aria-label': `${r.text}. ${r.desc}`, onClick: () => ruleSheet(p) }, r.text),
              r.removable ? h('button.m-chipbtn.m-danger.ah-rmv', { type: 'button', disabled: !P.editable || liftsLive(ctx, P, p), 'aria-label': `Remove ${r.text}`, dataset: { rule: p.id }, onClick: () => removeRule(ctx, p.id) }, 'Remove') : null);
          }),
          rules.length > 1 ? h('div.ah-rrow.all', { role: 'listitem' }, h('button.m-chipbtn.m-danger.ah-rmv', { type: 'button', disabled: !P.editable || live, onClick: () => clearAll() }, 'Remove all')) : null),
        offLive && gwNow(P) !== P.A ? h('p.ah-rules-note.m-foot', null, COPY.live(P.A)) : null)));
  }

  /** A rule's sheet: what it does; a Keep or veto can change its scope (scopeLabels: "GW6 only" · "GW6–9", "Not in GW6"
   *  · "Never"); [Remove]. No second button ("Keep it" would clash with Keep, a rule's own name): ✕ and a swipe down
   *  close it. */
  function ruleSheet(p) { const { ctx } = V;
    const P = plan(ctx);
    const r = ruleOf(P, p);
    ctx.sheets.open({
      title: r.text, sub: r.desc, detent: 'small',
      build(body, sheet) {
        if (r.scope && !p.via) {
          const g = num(p.gw) ?? P.A;
          const words = scopeLabels(p.kind, g, P.end);
          const opts = [['gw', words.gw], ['all', words.all]];
          body.append(roving(h('div.m-seg.ah-scope', { role: 'radiogroup', 'aria-label': 'When', style: { '--n': 2, '--i': r.scope === 'gw' ? 0 : 1 } }, h('span.m-seg-thumb'),
            opts.map(([k, l]) => h('button', {
              type: 'button', role: 'radio', 'aria-checked': String(k === r.scope), disabled: !P.editable,
              onClick: () => { if (k === r.scope) return; sheet.close(); rescope(ctx, p, k); },
            }, l))), { pick: (b) => b.click() }));
        }
        const live = liftsLive(ctx, P, p);  // re-plans GW A under way
        body.append(h('div.ah-btnrow', null,
          h('button.m-danger', { type: 'button', disabled: !P.editable || live, onClick: () => { sheet.close(); removeRule(ctx, p.id); } }, 'Remove')));
        if (!P.editable || live) body.append(h('p.ah-why', null, P.editable ? COPY.live(P.A) : P.why));
      },
    });
  }

  /** Clear all: every rule off at once, "Removed 3 rules: … pts over GW6–9" with one Undo (no ask). */
  function clearAll() { const { ctx } = V;
    const P = plan(ctx);
    const asks = listedRules(P, gwNow(P));
    const what = COPY.removedRules(asks.length);
    edit(ctx, { drop: asks.map((p) => p.id), from: P.A, what, text: vsPrev(ctx, what) });
  }
  /** A later week's bank below 0 on a solved plan by no more than FPL's sale prices explain: price drift, not an
   *  overspend (COPY.priceDrift; the solver prices a player you own at today's price, FPL pays the half-profit price:
   *  the room is that gap per player sold by then). More is short ("−£1.8m in bank"); GW A's short bank is real. */
  const driftRoom = (P, w) => P.weeks.filter((x) => x.gw <= w.gw).flatMap((x) => x.moves.map((m) => m.out))
    .reduce((s, p) => s + Math.max(0, (P.L.priceT(p) ?? 0) - (P.L.sellT(p) ?? P.L.priceT(p) ?? 0)), 0) / 10;
  // (never a week your transfers leave short: the hold's debts, memory.holdOf)
  const owes = (P, g) => P.pins.some((p) => p.id === 'hold' && (p.debts || []).includes(g));
  const priceDrift = (P, w) => { const { ap0 } = V; return w.gw > P.A && !ap0(P, w.gw) && w.bank != null && w.bank < -1e-9 && -w.bank <= driftRoom(P, w) + 1e-9 && !owes(P, w.gw); };

  // ---------------------------------------------------------------- the week line, the choices on the pitch and the Week sheet

  /** While a plan of the week still checks, each keeps the slot it was first drawn in for the same plan view and GW (a
   *  thumb aimed at one + must not meet another as rows land): a landing changes its number and line in place, a new
   *  choice goes after. Once none checks, the list is best first (plansOf's order): that draw re-sorts once, and a +
   *  tapped within ADD_HOLD_MS of it is ignored (addOnce, S.addAt). Keyed by its GW-g choice. */
  function heldOrder(P, g, plans) { const { S } = V;
    const key = (pl) => `${pl.choice.moves.map((m) => `${m.out}>${m.in}`).sort().join(',')}|${JSON.stringify(pl.choice.chips)}`;
    const busy = plans.some((x) => x.state === 'solving');
    const was = S.planAt?.P === P && S.planAt.g === g ? S.planAt : null;
    const at = new Map((busy && was ? was.keys : []).map((k, i) => [k, i]));
    const out = busy && was ? plans.slice().sort((a, b) => (at.get(key(a)) ?? 1e9) - (at.get(key(b)) ?? 1e9)) : plans;
    if (!busy && was?.busy && out.some((pl, i) => key(pl) !== was.keys[i])) S.addAt = Date.now();
    S.planAt = { P, g, busy, keys: out.map(key) };
    return out;
  }

  /**
   * The plan on the screen: week line (renderLine), choices on the pitch (renderDecks, once mounted: S.M) and open
   * Week sheet (drawWeek), all from one model of the viewed week (weekModel): one order of choices (heldOrder), one
   * +'s re-flow hold (addOnce).
   */
  function renderWeek(P, w) { const { S, cheerEl, ctx, drawWeek, renderLine, sayCarried, sayDrift } = V;
    const M = weekModel(P, w);
    S.M = M;
    tellStory(w.gw, M);
    renderLine(P, w, M);
    if (S.week) drawWeek(P, w, M);
    S.tint = null;  // the transfer a + made is tinted on its first draw only (xferRow)
    // addOnce ignores a + tapped this soon after the choices re-flowed: the first draw after a + or the list's re-sort
    // (S.addAt), never a later one that moved nothing (else a + went unanswered while other plans landed)
    if (S.addAt && !(S.flowAt >= S.addAt)) S.flowAt = Date.now();
    sayDrift(P);
    sayCarried(P);
    pendingAgain(ctx, P.mem);
    // the line every GW: last, so a toast above (a reopened check's, with its Undo) never takes its place at once; on a
    // first load also through the story's checks, in its second act (tellStory sets S.story.wait this draw)
    // (its second act stays up CHEER_MS more once the wait ends: owner, 2026-10-28)
    const checking = !replanning() && !!S.story?.wait;
    if (replanning() || checking) S.act2 = 'due';
    const late = !replanning() && !checking && S.act2 === 'due';
    if (late) S.act2 = 'said';
    sayCheer(ctx, P, cheerEl, replanning() || checking || late, checking || late ? 1 : 0, { linger: late });
  }
  /**
   * The wait's one story (owner, 2026-10-27: planning was told in three places): Connect's planning line (app.js
   * planning) goes on as "Planning GW9–12 · 0:38 · ~20 s left" (calls.steadyEta) while the bake's roads land, then,
   * the plan in, "Checking GW9's moves · 1:06 · 5 done" (the plan's clock, from the bake's start) until GW g's choices
   * are settled (weekModel's M.settled); then the story is over (later checks: renderLine). Told on the strip's wait
   * line (paintWait). Its count is GW g's choices checked so far, every one listed since the plan started (`seen`),
   * never back, no total (a landing road or pre-solve can add a choice or take one's room: plansOf FORK_MAX, rankOf).
   * The strip's own checks and clock stay off meanwhile.
   */
  function tellStory(g, M) { const { S, ctx } = V;
    const st = S.story;
    if (!st) return;
    const bake = ctx.bundle?.bake, conn = ctx.store.get('conn')?.state;
    if (st.t0 == null) st.t0 = conn === 'baking' && Number(bake?.started) > 0 ? Number(bake.started) * 1000 : Date.now();
    const seen = st.seen.get(g) ?? new Set();
    st.seen.set(g, seen);
    for (const x of M.all) if (x.state !== 'solving') seen.add(forkKey(x.choice, g));
    st.f = M.all.length ? M.all.filter((x) => x.state !== 'solving').length / M.all.length : 1;
    if (replanning()) return;
    st.wait = M.wait && !M.settled ? { g, n: seen.size } : null;
    if (!st.wait) S.story = null;
    if (!paintPlanStatus() && S.dl) paintDeadline(S.dl.A);
    paintStoryBar();
  }
  function paintStoryBar() { const { S, STORY_PLAN, ctl, ctx } = V;
    // (share kept for the strip's wait line, which draws it)
    const st = S.story;
    if (st && !ctl.hidden) {
      const baking = ctx.store.get('conn')?.state === 'baking', share = baking ? planShare(ctx.bundle?.bake) : null;
      const p = baking ? (share == null ? null : share * STORY_PLAN) : STORY_PLAN + (1 - STORY_PLAN) * st.f;
      if (p != null) st.p = Math.max(st.p, p);
    }
    paintWait();
  }
  /**
   * The wait now, as the strip's wait line says it (owner, 2026-10-28): one process at a time, the widest first. The
   * forecast updating (no measure: a few sweeps); a re-plan or the first plan baking (steadyEta in the story, planEta
   * else; share planShare's, the story's own st.p); the story's checks of the viewed week (its clock and share); else
   * the viewed week's own checks (S.wl: renderLine), a take's, an Undo's, a later week's after a change, on
   * waitClock's S.wait, share by the count with the step under way creeping on (calls.stepShare; none counted: a few
   * sweeps). null while nothing waits.
   */
  function waitNow() { const { S, ctl, ctx } = V;
    if (ctl.hidden) return null;
    const conn = ctx.store.get('conn')?.state, st = S.story, now = Date.now();
    if (conn === 'updating') return { key: 'updating', word: 'Updating', scope: 'the forecast', p: null };
    if (replanning()) {
      const bake = ctx.bundle?.bake, e = st ? steadyEta(bake) : planEta(bake), gws = ctx.data?.horizon;
      return { key: `bake@${bake?.started}`, word: 'Planning', scope: gws?.length ? span(gws) : null, prog: e.left != null ? leftText(e) : null, so: e.so, p: st ? st.p || null : planShare(bake) };
    }
    if (st?.wait) {
      const g = st.wait.g;
      return { key: `story@${g}`, word: 'Checking', scope: `GW${g}`, long: `GW${g}'s moves`, prog: st.wait.n ? `${st.wait.n} checked` : null, so: st.t0 == null ? null : (now - st.t0) / 1000, p: st.p || null };
    }
    const w = S.wl;
    if (!w || !S.wait) return null;
    const p = w.n ? (w.max = Math.max(w.max, stepShare(w.done, w.n, reduceMotion() ? 0 : now - w.at, w.tau))) : null;
    return { key: `week@${w.key}`, word: 'Checking', scope: `GW${w.g}`, long: `GW${w.g}'s moves`, prog: w.n ? `${w.done + 1} of ${w.n}` : null, so: (now - S.wait.t0) / 1000, p };
  }
  /** The strip's wait line (waitView) while anything waits (waitNow), replacing the line's words; doors kept, its bar
   *  on the strip's lower edge; the words return as they fit (fitFacts) when it ends, which is said (waitSaid). Each
   *  draw and each second (tick, via paintStoryBar). */
  function paintWait() { const { S, fitFacts, strip, waitSaid, waitV } = V;
    const W = waitNow(), block = strip.querySelector(':scope > .ah-block:not(.ah-fitprobe)'), pbt = block?.querySelector('.ah-pbt');
    const on = !!W && !!pbt, was = !!block?.classList.contains('ah-waiting');
    block?.classList.toggle('ah-waiting', on);
    // (a short bank or an amber notice keeps the line's words; the wait keeps its bar, the dim and the plates'
    // "checking…": a problem is never hidden behind a wait)
    block?.classList.toggle('ah-wkeep', on && !!S.lineKeep);
    paintDim(W);
    if (on) {
      if (waitV.t.parentNode !== pbt) pbt.append(waitV.t);
      if (waitV.bar.parentNode !== block) block.append(waitV.bar);
      paintWaitView(waitV, W);
    } else { waitV.t.remove(); waitV.bar.remove(); waitV.key = null; }
    if (was && !on) fitFacts();
    const said = W ? `${W.word} ${W.long ?? W.scope ?? ''}`.trim() : S.waitWas ? `${S.waitWas === 'Planning' ? 'Plan ready' : 'Checked'}` : '';
    if (W || S.waitWas) { if (waitSaid.textContent !== said) waitSaid.textContent = said; S.waitWas = W?.word ?? null; }
  }
  function paintDim(W) { const { S, WAIT_DIM_MS, pitchHost } = V;
    const now = Date.now();
    if (!W) { S.dimT0 = null; clearTimeout(S.dimTimer); S.dimTimer = null; pitchHost.classList.remove('ah-wait'); return; }
    S.dimT0 ??= now;
    const left = S.dimT0 + WAIT_DIM_MS - now;
    pitchHost.classList.toggle('ah-wait', left <= 0);
    if (left > 0 && !S.dimTimer) S.dimTimer = setTimeout(() => { S.dimTimer = null; paintWait(); }, left + 5);
  }

  /**
   * The viewed week's model, once per draw: its choices (plansOf, in heldOrder, ten at most: every week you can
   * change, in both modes, a Wildcard or Free Hit week too; owner, 2026-10-11), the "instead of …" every listed
   * choice's + takes back (said once, on the Week sheet's plans heading), GW A under way (no choice; its live
   * sentence: liveCheck) and the notices that stand, in order: a re-plan that couldn't keep your choices (clashLine),
   * GW A's price watch (watchOf: amber when waiting puts a move out of reach, quiet when it only costs or gains money,
   * not drawn when it changes nothing), a new forecast that changed the suggested plan (forecastLine), GW A's lineup
   * where it differs from the one set in FPL (fplSets; last, so it never takes the line from the others; `quiet`: an
   * instruction, not a problem, so it gives the week line's second line to a short bank and the checks: renderLine).
   * The first notice is the week line's second line where shown, said once to VoiceOver (noticeSaid); each is a Week
   * sheet row in this order (`row`, drawn there only).
   */
  function weekModel(P, w) { const { S, clashRow, ctx, forecastLine, frozenAt, keepNight, noteRow, sayNight, waitSig, waitWatch, weekPending } = V;
    const g = w.gw, sq = squadWeek(w);
    const ink = inkAt(ctx, P, g);
    const all = plansOf(ctx, P, g);
    const plans = ink ? [] : listedOf(heldOrder(P, g, all));
    // none lit on the pitch until none checks (weekSettled, litOf), each behind the card of the player it would replace
    // (decksOf), for the pitch (renderDecks) and the checking line. Lit while the first plan's other roads still bake
    // too: what is lit is the solver's own move (plansOf `solver`), which a bake road landing never changes (owner,
    // 2026-11-02, "new team cold start": the best waited 16 s on the bake's veto roads after the week was in)
    const settled = weekSettled(P, g, all), key = weekKey(P, g, all);
    const { decks, toks } = decksOf(P, w, { sq, plans });
    const lit = litOf(P, w, { sq, plans, settled }, decks, toks);
    // what the pitch shows lit and green, the Week sheet's green too (litShown), as the pitch last drew this week's
    // places (renderDecks' `drawn`, redrawn after this: sheetFollows; owner, 2026-10-22 and -25)
    decks.drawn = S.decks?.gw === g ? S.decks.drawn : null;
    // (and the choices whose plates it drew, a sentence's sellers' singles among them)
    decks.drawnPl = S.decks?.gw === g ? S.decks.drawnPl : null;
    const shown = litShown(P, w, { sq, plans, settled }, decks, toks, lit);
    // how far the week's checks are (weekWait); the checks' clock runs from the first draw with a choice or transfer
    // number waiting until none waits (waitClock), from 0:00 again for checks of their own (weekKey)
    const wait = weekWait(all, lit.size);
    // (and while the solver's own week or what the rows count against still solves, plansOf's `pending`, a week with no
    // transfer of yours too: the pitch greys and the line says "Checking", never a blank corner; owner, 2026-11-02,
    // "why not greyed out when its solving ... and just show nothing instead")
    S.wait = wait || all.pending || weekPending(P, w) ? (S.wait?.key === key ? S.wait : { key, t0: Date.now() }) : null;
    // the "instead of …" that two or more rows take back, said once over them: the one most rows share
    const backs = new Map();
    for (const pl of plans) { const b = planBack(P, g, pl).back; if (b) backs.set(b, (backs.get(b) ?? 0) + 1); }
    const [top, many] = [...backs].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
    const sharedBack = many > 1 ? top : null;
    const live = g === P.A && isLive(ctx);
    sayNight(P);
    const watch = g === P.A && !sq && w.moves.length && !frozenAt(P, g) ? watchOf(ctx) : null;
    const said = watch?.at != null && watch.nights[watch.at].verdict !== 'free' ? watch : null;
    if (said) keepNight(P, said);
    const watching = said && ctx.api?.local?.get?.(WAIT_KEY) !== waitSig(P, said) ? said : null;
    const clash = clashLine(P), news = forecastLine(P), sets = fplSets(ctx, P, w);
    // (the price watch's row, with its Hide, in the week line's order; the lineup's last)
    const notices = [clash && { text: clash.text, warn: true, row: () => clashRow(P, clash) },
      watching && { text: watching.short, warn: watching.tone === 'act', row: () => watchView(watching, { cls: '.ah-pwatch', wait: () => waitWatch(P, watching) }) },
      news && { text: news, row: () => noteRow('.ah-news', news) },
      sets && { text: COPY.setInFpl(sets), quiet: true, row: () => noteRow('.ah-fplset', COPY.setInFplRow(sets)) }].filter(Boolean);
    return { key, all, sq, plans, decks, toks, lit, shown, wait, settled, sharedBack, live, liveText: live ? liveCheck(ctx.bundle?.entry?.published, w, P.L) : null, notices };
  }
  const waited = () => { const { S } = V; return clockText((Date.now() - S.wait.t0) / 1000); };
  const clockShown = (n) => { const { LATE_S, S } = V; return ((Date.now() - S.wait.t0) / 1000 < LATE_S && n.dataset.late != null ? n.dataset.pre ?? '' : `${n.dataset.sep ?? ''}${waited()}`); };
  const waitClock = (cls = '', { late = false, pre = '', sep = '' } = {}) => { const { S } = V;
    if (!S.wait) return null;
    const n = h(`span.ah-wclock.m-num${cls}`, { 'aria-hidden': 'true', dataset: { ...(late ? { late: '' } : {}), pre, sep } });
    n.textContent = clockShown(n);
    return n;
  };
  /** What the viewed week's choices count against and over which weeks, "Suggested plans · GW8–11 · vs rolling"
   *  (COPY.suggested): the Week sheet's plans heading and the pitch choices' spoken name (renderDecks). */
  const plansHeading = (P, g) => { const { plansVs } = V; const gws = P.gws.filter((x) => x >= g); return COPY.suggested(gws, plansVs(P, g), COPY.plansHead, gws.length < P.gws.length); };
  return { pageName, resetTap, resetSheet, learn, gwNow, setGw, outerH, fitBlock, fitHead, fitPitch, redeck, schedule, covered, paintAvatar, renderHead, renderGwLine, paintDeadline, replanning, paintPlanStatus, tick, hosts, focusedKeys, keepFocus, renderPair, render, renderBaking, planning, renderRules, ruleSheet, clearAll, driftRoom, owes, priceDrift, heldOrder, renderWeek, tellStory, paintStoryBar, waitNow, paintWait, paintDim, weekModel, waited, clockShown, waitClock, plansHeading };
}
