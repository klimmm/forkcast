// screen.js mount: swipes, drags, the armband and subs

import { EDGE_PX, SPENT_PX, SWIPE_MS, SWIPE_PX, editable, inputs, plan, squadBefore, weekOf } from './core.js';
import { h, fmt, fill, append, reduceMotion, holdTouch, flick, xpNum } from '../../ui.js';
import { COPY, captainGap } from '../calls.js';
import { captain, sub, subChoices, useChip, veto, vice } from './edits.js';
import { inkAt } from './buys.js';
import { subOrder } from '../../plan/pitch.js';
import { shirtOf, squadWeek, xpShown } from './pieces.js';
import * as E from '../../plan/engine.js';

export function touchPart(V) {
  const spend = (e) => { const { spent } = V; return Object.assign(spent, { on: true, x: e.clientX, y: e.clientY }); };
  /** A swipe that acts (the pitch's week, a move row's veto) lets its finger go at once: spent, its click is swallowed
   *  (spentClick), so it holds no re-draw (S.down, lifted) and the screen draws the change now, not LIFT_MS on. */
  const letGo = (e) => { const { S } = V; return S.down.delete(e.pointerId); };
  /** A finger down within EDGE_PX of the screen's sides: the system's back / forward swipe, never a swipe or scrub of
   *  ours; a tap or long press there stays one. */
  const atEdge = (e) => { const { el } = V; const box = el.getBoundingClientRect(); return e.clientX - box.left < EDGE_PX || box.right - e.clientX < EDGE_PX; };
  const tickAt = (x) => { const { ticks } = V; return [...ticks.querySelectorAll('.ah-tick')].find((t) => { const r = t.getBoundingClientRect(); return x >= r.left && x <= r.right; }); };
  const railEnd = (e) => { const { S, rail, setGw } = V;
    const st = S.drag?.rail;
    if (!st) return;
    S.drag = null;
    rail.classList.remove('dragging');
    // a tap on a GW, or a scrub that ended (it switched GW as it went): the gesture is spent, its click is not a tap
    if (e.type !== 'pointerup') return;
    if (st.dragging) { spend(e); return; }
    // a tap moved under 10 px in all: a finger that went further (sideways at the screen's edge) picks nothing
    if (Math.hypot(e.clientX - st.x, e.clientY - st.y) >= 10) return;
    const t = tickAt(e.clientX);
    if (t) { spend(e); setGw(Number(t.dataset.gw)); }
  };
  /** A pitch gesture's hold ring gone (holdFill: its hold fired, or it was let go or moved first). */
  const unfill = (st) => { st.fill?.(); st.fill = null; };
  /** The finger on the bench where no shirt is (its labels, its edges), by its point: a touch browser moves a touch on
   *  the labels' thin strip onto the card under it (Chrome's touch adjustment), so the event's target can't say. */
  const benchBare = (e) => { const { decks, pitchHost } = V;
    const inside = (n) => { const r = n.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
    const bench = pitchHost.querySelector('.pm-bench');
    // (nor a sub's plate, on his card under his label: labelWalls; its tap opens his place)
    return !!bench && inside(bench) && ![...bench.querySelectorAll('.pm-bs'), ...decks.querySelectorAll('.ah-sp')].some(inside);
  };
  /** The week a swipe of dx px goes to (left: the next, right: the one before), null past the window's last or first. */
  const swipeGw = (dx) => { const { ctx, gwNow } = V; const P = plan(ctx); return P?.gws[P.gws.indexOf(gwNow(P)) + (dx < 0 ? 1 : -1)] ?? null; };
  const pitchEnd = (e) => { const { S, pitchHost, setGw } = V;
    const st = S.drag?.pitch;
    if (!st || st.pid !== e.pointerId) return;
    clearTimeout(st.timer);
    clearTimeout(st.chip);
    unfill(st);
    if (st.done) { releaseSoon(st); return; }
    // a gesture the system cancels (a call, the phone locked: pointercancel) never acts: it only cleans up
    const act = e.type === 'pointerup';
    if (st.lifted) { dropOn({ act }); return; }
    if (st.badge && st.flying) { dropBadge(st, { act }); return; }
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    // 45 px, or a quick flick of a swipe (its lock: st.swipe) whose release carries it that far (ui.flick)
    const far = Math.abs(dx) > 45 ? dx : st.swipe ? st.fl.add(e.clientX, e.timeStamp).project(e.clientX) - st.x : 0;
    if (act && !st.edge && Math.abs(far) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      S.drag.used = true;
      const g = swipeGw(far);
      if (g != null) {
        // the new week's pitch comes in from the side the finger went, beside where it left this one (mountHere), now
        settle();
        if (st.tx != null) S.slide = dx + (far < 0 ? 1 : -1) * pitchHost.clientWidth;
        letGo(e);
        setGw(g);
        releaseSoon(st);
        return;
      }
    }
    if (st.tx != null) settle(st.tx);  // back in place: short of a week, no week that way, or cancelled
    releaseSoon(st);
  };
  /** The pitch to its place from x px over --dur (.settle, m-ahead.css: --ease, no overshoot): from where a swipe left
   *  it, or from beside it (a swipe's new week); with no x, or under Reduce Motion, at once. Its inline transform goes
   *  at once (mountPitch and fitPitch never meet a stale one); .settle at the transition's end or the next swipe. */
  function settle(x = 0) { const { pitchHost } = V;
    const s = pitchHost.style;
    pitchHost.classList.remove('settle');
    s.transform = x && !reduceMotion() ? `translateX(${x}px)` : '';
    if (!s.transform) return;
    void pitchHost.offsetWidth;  // from x: the transition starts there
    pitchHost.classList.add('settle');
    s.transform = '';
  }
  /** The gesture ended (gesture(): no longer under way); cleared once its pointerup has run everywhere (the window's
   *  `spentUp` reads S.drag.used). */
  const releaseSoon = (st) => { const { S } = V;
    st.ended = true;
    setTimeout(() => { if (S.drag && Object.values(S.drag).includes(st)) S.drag = null; }, 0);
  };
  /** The gesture under way (the switcher's, the pitch's or a move row's), null once its release has been handled. */
  const gesture = () => { const { S } = V; return [S.drag?.rail, S.drag?.pitch, S.drag?.row].find((st) => st && !st.ended) ?? null; };
  /** End the gesture under way as the system's cancel ends it, by its own handler: nothing acts; a lifted shirt or row,
   *  or the armband, goes back and the pitch to its place. */
  const cancelGesture = () => { const st = gesture(); st?.end({ type: 'pointercancel', pointerId: st.pid, clientX: st.x, clientY: st.y, timeStamp: performance.now() }); };

  function dragBadge(st, e) { const { S, ctx, el, gwNow, learn, pitchHost } = V;
    const P = plan(ctx);
    const w = weekOf(P, gwNow(P));
    if (!st.flying) {
      st.flying = true;
      S.drag.used = true;
      clearTimeout(st.chip);
      unfill(st);
      learn('pitch');
      try { pitchHost.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
      st.gap = h('span.ah-ghostgap');
      const vice = st.badge === 'v';
      st.ghost = h('div.ah-dragghost.badge', { 'aria-hidden': 'true' }, st.gap, h(vice ? 'span.pm-badge.v' : 'span.pm-badge.c', null, vice ? 'V' : w.chip === 'tc' ? '3×' : 'C'));
      document.body.append(st.ghost);
    }
    st.ghost.style.transform = `translate(${e.clientX - 12}px, ${e.clientY - 28}px)`;
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.pm-pl[data-id]');
    const id = under && pitchHost.contains(under) ? Number(under.dataset.id) : null;
    st.target = id !== null && w.xi.includes(id) ? id : null;
    for (const n of pitchHost.querySelectorAll('.pm-pl.ah-captarget')) n.classList.remove('ah-captarget');
    if (st.target !== null) under.classList.add('ah-captarget');
    // the armband on him against the captain now: the pooled forecast (calls.captainGap), never a run count; "≈" when
    // the call is weak. The V's: who it lands on, no number (COPY.viceTo: on the captain the armbands swap)
    if (st.badge === 'v') {
      const nm = st.target === null ? null : P.L.name(st.target);
      st.gap.textContent = st.target === null ? COPY.viceDrop : st.target === w.vice ? COPY.viceStays : st.target === w.captain ? COPY.viceSwap(nm) : COPY.viceTo(nm);
    } else {
      const cg = st.target !== null && st.target !== w.captain ? captainGap(inputs(ctx), w, st.target, w.captain) : null;
      const gap = st.target === null ? null : st.target === w.captain ? COPY.capNow : COPY.capGap(cg.delta, P.L.name(w.captain), cg.label);
      st.gap.textContent = st.target !== null ? `${P.L.name(st.target)} · ${gap}` : 'Drop the armband on a starter';
    }
    // centred on the badge, kept 8 px inside the screen's sides (--gx)
    const box = el.getBoundingClientRect(), wd = st.gap.offsetWidth, x0 = e.clientX - wd / 2;
    st.gap.style.setProperty('--gx', `${Math.max(box.left + 8, Math.min(x0, box.right - 8 - wd)) - x0}px`);
  }
  /** The armband dropped: on a starter, he is captain (act: a pointerup; a cancelled drag only cleans up). The V's
   *  (owner, 2026-10-13): he is vice (ahead.vice); on the captain the two swap, as FPL's. */
  function dropBadge(st, { act = true } = {}) { const { ctx, gwNow, pitchHost } = V;
    st.ghost?.remove();
    for (const n of pitchHost.querySelectorAll('.pm-pl.ah-captarget')) n.classList.remove('ah-captarget');
    releaseSoon(st);
    const P = plan(ctx);
    const g = gwNow(P);
    const w = weekOf(P, g);
    if (!act || st.target === null || !w) return;
    armTo(st.badge, g, w, st.target);
  }
  /** The C's armband (`arm` 'c') or the V's to starter `id` in GW g: the C makes him captain; the V makes him vice, and
   *  on the captain the two swap, as FPL's. The drag's drop and the list's tap (armbandSheet). → bool */
  const armTo = (arm, g, w, id) => { const { ctx } = V; return (arm === 'v' ? (id === w.captain ? captain(ctx, g, w.vice) : id !== w.vice && vice(ctx, g, id)) : id !== w.captain && captain(ctx, g, id)); };
  /** The armband by a tap on the C or the V (owner, 2026-10-13): GW g's starters by their forecast, each with the
   *  drag's own words (the C's: his gap to the captain now, calls.captainGap; the V's: who it lands on), the one
   *  wearing it checked; a tap moves it (armTo: the edit's toast with Undo). */
  function armbandSheet(arm, g) { const { ctx } = V;
    const P = plan(ctx), w = weekOf(P, g);
    if (!P || !w) return;
    const isV = arm === 'v', on = isV ? w.vice : w.captain;
    // the drag's rule (lineupEdit): GW A under way is FPL's; a lineup is the phone's own, so offline it still moves
    const can = !inkAt(ctx, P, g);
    const xp = (id) => ctx.pitch.xpAt(ctx.data.byId.get(Number(id)), g, ctx.data.xpGws);
    const words = (id) => {
      const nm = P.L.name(id);
      if (isV) return id === w.vice ? COPY.viceStays : id === w.captain ? COPY.viceSwap(nm) : null;
      if (id === w.captain) return COPY.capNow;
      const cg = captainGap(inputs(ctx), w, id, w.captain);
      return COPY.capGap(cg.delta, P.L.name(w.captain), cg.label);
    };
    const title = COPY.armIn(arm, g);
    ctx.sheets.open({
      title, detent: 'medium', fit: true, cls: 'cs', label: title,
      build(body, sheet) {
        append(body, h('div.ah-list', { role: 'group', 'aria-label': title }, [...w.xi].sort((a, b) => (xp(b) ?? -Infinity) - (xp(a) ?? -Infinity)).map((id) => {
          const fact = words(id);
          return h('button.ah-lrow', {
            type: 'button', disabled: !can || id === on, 'aria-pressed': id === on ? 'true' : null,
            'aria-label': `${P.L.name(id)}, ${fmt.pts(xp(id))} points${fact ? `, ${fact}` : ''}`,
            onClick: () => { if (armTo(arm, g, w, id)) sheet.close(); },
          },
          h('span.mk.rs-automk', { class: { on: id === on }, 'aria-hidden': 'true' }, id === on ? (isV ? 'V' : 'C') : ''),
          h('span.nm', null, h('b', null, P.L.name(id)), fact ? h('span', null, fact) : null),
          h('span.rt.m-num', null, xpNum(fmt.pts(xp(id)))));
        })), can ? null : h('p.m-foot', null, COPY.live(g)));
      },
    });
  }
  /** A sub's list, as the captain list is the armband's: a tap on his label on the bench ("1", his order: pitch.js
   *  benchPanel, m-ahead.css .pm-blp) lists the starters he can replace in GW g (subChoices: the drag's legal swaps,
   *  best first), each with its toast's words and number and the starter's forecast; a tap makes the sub (sub: the
   *  drag's, its toast with Undo). GW A under way is FPL's: the rows off, and why (COPY.live), as the captain list. */
  function subSheet(id, g) { const { ctx } = V;
    const P = plan(ctx), w = weekOf(P, g);
    if (!P || !w?.bench.includes(Number(id))) return;
    const can = !inkAt(ctx, P, g);
    const title = COPY.subIn(subOrder(w.bench, P.L.pos).get(Number(id)), g);
    ctx.sheets.open({
      title, detent: 'medium', fit: true, cls: 'cs', label: title,
      build(body, sheet) {
        append(body, h('div.ah-list', { role: 'group', 'aria-label': title }, subChoices(ctx, P, g, id).map((c) => {
          const said = COPY.lineup(c.what, g, c.cmp.delta);
          return h('button.ah-lrow', {
            type: 'button', disabled: !can, 'aria-label': `${P.L.name(c.id)}, ${xpShown(ctx, c.id, g)} points, ${said}`,
            onClick: () => { if (sub(ctx, g, id, c.id)) sheet.close(); },
          },
          h('span.mk', { 'aria-hidden': 'true' }, shirtOf(P.L, c.id, 32)),
          h('span.nm', null, h('b', null, P.L.name(c.id)), h('span', null, said)),
          h('span.rt.m-num', null, xpNum(xpShown(ctx, c.id, g))));
        })), can ? null : h('p.m-foot', null, COPY.live(g)));
      },
    });
  }

  /** The shirt's drag to a tick: a lifted ghost follows the finger, valid ticks glow; also onto a player (`subs`: the
   *  ids he can swap with, outlined on the pitch; `onPlayer(id)` the drop there). */
  function lift(st, e, { ghost, valid, onDrop, hintText, subs = [], onPlayer = null }) { const { S, hint, pitchHost, ticks } = V;
    st.lifted = true;
    S.drag.used = true;
    try { st.src.setPointerCapture(e.pointerId); } catch { /* the finger already left */ }
    st.ghost = h('div.ah-dragghost', { 'aria-hidden': 'true' }, ghost);
    document.body.append(st.ghost);
    st.onDrop = onDrop;
    st.subs = new Set(subs);
    st.onPlayer = onPlayer;
    for (const n of pitchHost.querySelectorAll('.pm-pl[data-id], .pm-bs[data-id]')) n.classList.toggle('ah-subok', st.subs.has(Number(n.dataset.id)));
    fill(hint, h('span', null, hintText));
    hint.classList.add('on');
    for (const t of ticks.querySelectorAll('.ah-tick')) {
      const ok = valid.includes(Number(t.dataset.gw));
      t.classList.toggle('glow', ok);
      t.classList.toggle('bad', !ok);
    }
    dragTo(st.last ?? e);
  }
  function dragTo(e) { const { S, pitchHost, ticks } = V;
    const st = S.drag?.pitch;
    if (!st?.ghost) { if (st) st.last = e; return; }
    st.ghost.style.transform = `translate(${e.clientX - 28}px, ${e.clientY - 50}px) scale(1.06)`;
    st.over = null;
    if (st.subs?.size) {
      const under = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.pm-pl[data-id], .pm-bs[data-id]');
      const id = under && pitchHost.contains(under) ? Number(under.dataset.id) : null;
      st.overPl = id !== null && st.subs.has(id) ? id : null;
      for (const n of pitchHost.querySelectorAll('.ah-captarget')) n.classList.toggle('ah-captarget', n === under && st.overPl !== null);
      if (st.overPl !== null) under.classList.add('ah-captarget');
    }
    for (const t of ticks.querySelectorAll('.ah-tick')) {
      const r = t.getBoundingClientRect();
      const on = t.classList.contains('glow') && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 28 && e.clientY <= r.bottom + 12;
      t.classList.toggle('hover', on);
      if (on) st.over = Number(t.dataset.gw);
    }
  }
  /** The lifted shirt let go: on a glowing week, its onDrop (act: a pointerup; a cancelled drag only cleans up, its
   *  redraw scheduled: a cancel from the next press's capture would otherwise redraw the screen under that press before
   *  its own handlers run). */
  function dropOn({ act = true } = {}) { const { S, hint, pitchHost, render, schedule, ticks } = V;
    const st = S.drag?.pitch;
    if (!st) return;
    st.ghost?.remove();
    hint.classList.remove('on');
    st.pl?.classList.remove('ah-lifted');
    for (const t of ticks.querySelectorAll('.ah-tick')) t.classList.remove('glow', 'bad', 'hover');
    for (const n of pitchHost.querySelectorAll('.ah-subok, .ah-captarget')) n.classList.remove('ah-subok', 'ah-captarget');
    releaseSoon(st);
    if (act) render();
    else schedule();
    if (act && st.over != null) st.onDrop(st.over);
    else if (act && st.overPl != null) st.onPlayer?.(st.overPl);
  }

  /** The pitch's chip gestures (owner, 2026-10-13): the C held still plays the Triple Captain in the viewed week, the
   *  bench held where no shirt is the Bench Boost, either taken off when the week plays it (useChip: its toast, Undo,
   *  or why it can't); the gesture is spent (the finger's moves and its click). */
  function pitchChip(st, chip) { const { S, ctx, gwNow, learn } = V;
    st.done = true;
    S.drag.used = true;
    learn('chips');
    useChip(ctx, chip, gwNow(plan(ctx)));
  }
  /** A shirt held (LONG_MS): dropped on a glowing week, sold from then (Replace); dropped on an outlined player of the
   *  viewed week, swapped with him (owner, 2026-10-13; ahead.sub: engine.swapCandidates keeps a legal formation, the
   *  armband moving as FPL moves it; none while GW A is under way). */
  function liftShirt(st, e) { const { ctx, gwNow, learn } = V;
    const P = plan(ctx);
    const id = st.id;
    const g = gwNow(P);
    const w = weekOf(P, g);
    // a Wildcard's or Free Hit's own player (the chip brought him in: not in the squad going into its week) dropped on
    // that week is ruled out of its squad there, the chip picking another (owner, 2026-10-13; the player card's Sell ·
    // Not GW7: veto, scope 'gw')
    const chipOut = !!squadWeek(w) && w.squad.includes(id) && !squadBefore(P, g).includes(id) && !inkAt(ctx, P, g);
    const valid = P.gws.filter((x) => (squadBefore(P, x).includes(id) || (chipOut && x === g)) && !inkAt(ctx, P, x));
    const subs = w && !inkAt(ctx, P, g) ? E.swapCandidates(w, id, P.L.pos) : [];
    // nothing to swap or sell: it lifts all the same and says so (every week .bad, a drop does nothing), as a row does
    learn('pitch');
    st.pl.classList.add('ah-lifted');
    lift(st, e, {
      ghost: shirtOf(P.L, id, 56), valid, subs,
      hintText: COPY.liftShirt(P.L.name(id), subs.length > 0, valid.some((x) => !(chipOut && x === g)), chipOut ? g : null),
      onDrop: (x) => (chipOut && x === g ? veto(ctx, { gw: g, out: null, in: id }, { scope: 'gw' }) : ctx.openSheet('replace', id, x)),
      onPlayer: (o) => sub(ctx, g, id, o),
    });
  }

  // ---------------------------------------------------------------- move rows: swipe left → veto (M8)

  /** A Week sheet move row's gesture: its surface `fg` over the frame `row` (whose backdrop, "Not Groß · GW6", shows
   *  under it as it moves). Left past SWIPE_PX, or a quick flick whose release carries it that far (ui.flick), rules
   *  the buy out in this GW (vetoRow; owner, 2026-10-10: one swipe, the left one); right moves nothing. No long press
   *  (owner, 2026-10-19). */
  function wireMoveRow(row, fg, m) { const { S, learn } = V;
    fg.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      // a swipe may start on the row's × too: a tap there stays the button's (no swipe: its click; a swipe: spent, its
      // click swallowed)
      const st = { x: e.clientX, y: e.clientY, dx: 0, swiping: false, row, pid: e.pointerId, src: fg, edge: atEdge(e), fl: flick().add(e.clientX, e.timeStamp), end: up };
      S.drag = { row: st, used: false };
    });
    fg.addEventListener('pointermove', (e) => {
      const st = S.drag?.row;
      if (!st || st.row !== row || st.pid !== e.pointerId) return;
      st.fl.add(e.clientX, e.timeStamp);
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      // a move of more than 6 px down or up decides too: in the Week sheet that is where the sheet's own drag starts
      // (app.js wireDrag), so a row never swipes while the sheet moves
      if (!st.swiping && (Math.hypot(dx, dy) > 8 || Math.abs(dy) > 6)) {
        // sideways from the screen's edge is the system's back swipe (atEdge): the row lets it go, as it does a scroll
        if (!st.edge && Math.abs(dx) > Math.abs(dy)) {
          st.swiping = true;
          S.drag.used = true;
          fg.classList.add('dragging');
          try { fg.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
        } else { S.drag = null; return; }
      }
      if (st.swiping) { st.dx = Math.min(0, dx); fg.style.transform = `translateX(${st.dx}px)`; }
    });
    const up = (e) => {
      const st = S.drag?.row;
      if (!st || st.row !== row) return;
      releaseSoon(st);
      fg.classList.remove('dragging');
      // left only; past SWIPE_PX, or a quick flick whose release carries it that far (ui.flick)
      const far = !st.swiping || e.type !== 'pointerup' ? 0 : st.dx < -SWIPE_PX ? st.dx : st.fl.add(e.clientX, e.timeStamp).project(e.clientX) - st.x;
      if (far < -SWIPE_PX) {
        letGo(e);
        learn('row');
        vetoRow(row, fg, m);
      } else fg.style.transform = '';
    };
    fg.addEventListener('pointerup', up);
    fg.addEventListener('pointercancel', up);
    fg.addEventListener('touchmove', (e) => { if (S.drag?.row?.row === row && S.drag.row.swiping) holdTouch(e); }, { passive: false });
  }
  /** A swipe released past SWIPE_PX: the row springs back (its backdrop showing under it as it goes: .out) and the veto
   *  starts at once (its toast never waits for the motion), the row drawn again (the plan before it until the solver's
   *  lands with the new buy), never faded to nothing; a refused veto draws the row as it was. */
  function vetoRow(row, fg, m) { const { ctx, render } = V;
    row.classList.add('out');
    fg.style.transform = '';
    if (!veto(ctx, m, { scope: 'gw' })) render();
  }
  /** The Why sheet's "Not Groß · GW6" sends its row in the Week sheet under it the swipe's own way, left until its
   *  backdrop's words show, then releases it as a swipe (vetoRow). With the row not drawn (no Week sheet under it),
   *  Reduce Motion or no edit possible: the veto at once (a refusal says why and keeps the sheet). → bool */
  function vetoFromWhy(m) { const { S, ctx } = V;
    const at = `[data-gw="${m.gw}"][data-out="${m.out}"][data-in="${m.in}"]`;
    const row = S.week?.host.querySelector(`.ah-mrow${at}`), fg = row?.querySelector(':scope > .ah-fg');
    if (!row || !fg || reduceMotion() || !editable(ctx)) return veto(ctx, m, { scope: 'gw' });
    const words = row.querySelector(':scope > .ah-veto > span');
    row.classList.add('out');
    fg.style.transform = `translateX(-${Math.max(SWIPE_PX, (words?.offsetWidth ?? 0) + 32)}px)`;  // the words and their 16 px each side
    setTimeout(() => vetoRow(row, fg, m), SWIPE_MS);
    return true;
  }

  // ---------------------------------------------------------------- wiring

  // a finger down anywhere but the rail holds the background re-renders (schedule) until it lifts: then they draw, once
  // the gesture's own pointerup handlers (and releaseSoon) have run and its click has landed (lifted). A press first
  // ends what was held before it whose release never came (Chrome on macOS: a lifted shirt left on the screen): its
  // gesture as cancelled, and, with no other pointer down (isPrimary), its pointer no longer counted down
  const pressed = (e) => { const { S, el, rail } = V;
    cancelGesture();
    if (e.isPrimary) S.down.clear();
    // the Week sheet's too: it is drawn by render (a landing must not draw its rows anew under a finger)
    if ((!rail.contains(e.target) && el.contains(e.target)) || S.week?.sheet.el.contains(e.target)) S.down.add(e.pointerId);
  };
  // so does a release its gesture's own handler never had (bubbling: after it), Escape, or the window losing focus
  const stray = (e) => {
    const st = gesture();
    if (st && (e.type === 'blur' || (e.type === 'keydown' ? e.key === 'Escape' : e.pointerId === st.pid))) cancelGesture();
  };
  const lifted = (e) => { const { LIFT_MS, S, covered, render } = V;
    const draw = () => setTimeout(() => { if (!S.down.size && S.held && !covered()) { S.held = false; render(); } }, 0);
    if (e.type === 'blur') { S.down.clear(); if (S.held) draw(); return; }
    if (!S.down.has(e.pointerId)) { if (!S.down.size && S.held) draw(); return; }  // a finger on the rail (never held)
    // a tap's click comes after its pointerup: its finger counts as down until that click has landed on the control it
    // was on, or LIFT_MS on when no click comes (a scroll, a drag), so nothing re-draws in between (a chip row drawn
    // there sent "Take Bench Boost off" to the row)
    const id = e.pointerId;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      globalThis.removeEventListener('click', soon, true);
      S.down.delete(id);
      if (!S.down.size && S.held) draw();
    };
    // caught as it starts, gone a task later: after every handler of it, a control's that stops its propagation too, a
    // take's + (addOnce), whose plan pre-solved lands in its tap and waited LIFT_MS to be drawn
    const soon = () => setTimeout(go, 0);
    globalThis.addEventListener('click', soon, true);
    setTimeout(go, LIFT_MS);
  };
  // a gesture its own pointerup acted on (a GW tapped or scrubbed on the switcher: railEnd; a swipe, a drop or a row
  // swiped away: S.drag.used) is not also a tap: the browser's click after it lands on whatever the re-draw put under
  // the finger. That one click is swallowed in the window's capture phase (before any control's own, a sheet's too):
  // only within SPENT_PX of the pointerup's point and only until the next finger goes down; a keyboard's or assistive
  // tech's click (detail 0) never is. No time limit: a busy page dispatches that click late.
  const spentUp = (e) => { const { S } = V; if (S.drag?.used) spend(e); };  // bubbling: after the gesture's own pointerup handlers
  const spentDown = () => { const { spent } = V; spent.on = false; };
  const spentClick = (e) => { const { spent } = V;
    if (!spent.on || e.detail === 0) return;
    const ours = Math.hypot(e.clientX - spent.x, e.clientY - spent.y) <= SPENT_PX;
    spent.on = false;
    if (!ours) return;
    e.stopPropagation();
    e.preventDefault();
  };
  return { spend, letGo, atEdge, tickAt, railEnd, unfill, benchBare, swipeGw, pitchEnd, settle, releaseSoon, gesture, cancelGesture, dragBadge, dropBadge, armTo, armbandSheet, subSheet, lift, dragTo, dropOn, pitchChip, liftShirt, wireMoveRow, vetoRow, vetoFromWhy, pressed, stray, lifted, spentUp, spentDown, spentClick };
}
