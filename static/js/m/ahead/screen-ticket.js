// screen.js mount: the week's ticket: one decision, one line, two buttons (owner, 2026-11-05: "either i transfer, or refuse
// and see another suggestion"; "stop wasting space on useless crap"; design_1105f prototype/ticket.html)

import { h, fill, fmt, plural, reduceMotion, xpNum } from '../../ui.js';
import { COPY } from '../calls.js';
import { plan } from './core.js';
import { itbWords } from './pieces.js';
import { presolveSwap, removeMove } from './presolve.js';
import { tickWas, veto } from './edits.js';

/** A plan view's transfers as one string: what a week's remembered advice (adviceOf) was read against. */
const planSig = (P) => P.weeks.map((w) => w.moves.map((m) => `${m.out}>${m.in}`).join()).join('|');
/** "Murillo → Hill"; several, the sellers then the buys. */
const movesWords = (P, ms) => `${ms.map((m) => P.L.name(m.out)).join(', ')} → ${ms.map((m) => P.L.name(m.in)).join(', ')}`;
/** A swipe on the stack past this, px: the prototype's (design_1105f ticket.html). */
const STACK_SWIPE_PX = 36;
const STACK_MOTION = { duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)' };

export function ticketPart(V) {
  /** What a week's tab says: your transfers, else what its ticket last said on this plan; nothing for a week not yet
   *  worked out (a tab never asks for a solve: 2026-11-02, the next week only). */
  const adviceOf = (P, w) => { const { S } = V;
    if (w.moves.length) return movesWords(P, w.moves);
    return S.adv?.sig === planSig(P) ? S.adv.gw[w.gw] ?? '' : '';
  };
  const remember = (P, g, words) => { const { S, ticks } = V;
    const sig = planSig(P);
    if (S.adv?.sig !== sig) S.adv = { sig, gw: {} };
    S.adv.gw[g] = words;
    for (const a of ticks.querySelectorAll(`.ah-tick[data-gw="${g}"] .a`)) a.textContent = words;
  };
  /** The header's facts, the viewed week's: its free transfers or its transfers made, and its bank. */
  function paintStand(w) { const { stand } = V;
    // (a bank short of money has no ITB words, itbWords null: its shortfall, "£0.4m short"; it threw here and the ticket
    // went unpainted, QA qa-tk2 2026-11-05)
    const itb = w.bank != null ? itbWords(w.bank) : null;
    fill(stand, h('span', null, w.moves.length ? [h('b', null, plural(w.moves.length, 'transfer')), ' made'] : h('b', null, plural(w.ft ?? 1, 'free transfer'))),
      w.bank != null ? h('span', null, itb ? [h('b', null, itb[0].replace(/ ITB$/, '')), ' in the bank'] : h('b', null, COPY.moneyShort(-w.bank))) : null);
  }
  /** "Your FPL team: 2 changes to make" on the pitch's corner, GW A's in every week; its tap the Week sheet's list. */
  function paintFlag(P, w) { const { S, flag, openWeek } = V;
    if (w.gw === P.A) S.flagWords = S.status?.sub?.replace(/^Set in FPL:?\s*/, '') ?? null;
    const t = S.flagWords;
    flag.hidden = !t;
    if (!t) return;
    fill(flag, h('span', null, COPY.yourFplTeam), h('b', null, /change/.test(t) ? `${t} to make` : t));
    flag.onclick = (ev) => openWeek(ev, P.A);
  }
  /** A week about to change (setGw, before its draw): the front card's picture and each tab's place, for playStack. */
  function holdStack(from, to) { const { S, el, strip, ticks } = V;
    const card = strip.querySelector(':scope > .ah-ticket');
    S.stackWas?.ghost.remove();
    S.stackWas = null;
    if (!card?.offsetHeight || reduceMotion()) return;
    const r = card.getBoundingClientRect(), ghost = card.cloneNode(true), tabs = {};
    for (const t of ticks.querySelectorAll('.ah-tick[data-gw]:not(.sel)')) tabs[t.dataset.gw] = t.getBoundingClientRect().top;
    ghost.className = `ah-tkghost${to > from ? ' over' : ''}`;
    ghost.setAttribute('aria-hidden', 'true');
    ghost.inert = true;
    ghost.querySelector(':scope > .ah-pbar')?.remove();
    for (const x of ghost.querySelectorAll('[data-row]')) x.removeAttribute('data-row');
    Object.assign(ghost.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    el.append(ghost);
    S.stackWas = { from, to, top: r.top, tabs, ghost };
    // (a week whose ticket isn't drawn: the picture never stays)
    setTimeout(() => { if (S.stackWas?.ghost === ghost) { ghost.remove(); S.stackWas = null; } }, 2 * STACK_MOTION.duration);
  }
  /** The week drawn after holdStack: going on, the front card drops into the stack under it; going back, it rises out of
   *  the stack over the later week (design_1105f's go). */
  function playStack(g) { const { S, strip, ticks } = V;
    const m = S.stackWas;
    if (m?.to !== g) return;
    S.stackWas = null;
    const tabTop = (t) => t.getBoundingClientRect().top;
    for (const t of ticks.querySelectorAll('.ah-tick[data-gw]:not(.sel)')) {
      const was = m.tabs[t.dataset.gw], top = tabTop(t);
      t.animate(was != null ? [{ transform: `translateY(${was - top}px)` }, { transform: 'none' }]
        : [{ transform: `translateY(${(m.top - top) / 2}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], STACK_MOTION);
    }
    const card = strip.querySelector(':scope > .ah-ticket');
    if (m.to < m.from && m.tabs[g] != null) card?.animate([{ transform: `translateY(${m.tabs[g] - card.getBoundingClientRect().top}px)` }, { transform: 'none' }], STACK_MOTION);
    const land = ticks.querySelector(`.ah-tick[data-gw="${m.from}"]`);
    m.ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${land ? tabTop(land) - m.top : 0}px)`, opacity: 0 }], STACK_MOTION).onfinish = () => m.ghost.remove();
  }
  /** Swipes on the stack, cards and tabs alike: down or left the next week, up or right the one before. Left and right
   *  on a tab are the switcher's own scrub (rail). */
  function bindStack() { const { atEdge, ctx, gwNow, setGw, spend, stack } = V;
    let at = null;
    stack.addEventListener('pointerdown', (e) => { at = e.isPrimary && e.button < 1 ? { x: e.clientX, y: e.clientY, sideways: !atEdge(e) && !e.target.closest('.ah-rail') } : null; });
    stack.addEventListener('pointercancel', () => { at = null; });
    stack.addEventListener('pointerup', (e) => {
      if (!at) return;
      const dx = e.clientX - at.x, dy = e.clientY - at.y, sideways = at.sideways;
      at = null;
      const down = Math.abs(dy) > STACK_SWIPE_PX && Math.abs(dy) >= Math.abs(dx);
      if (!down && !(sideways && Math.abs(dx) > STACK_SWIPE_PX)) return;
      const P = plan(ctx), g = P?.gws[P.gws.indexOf(gwNow(P)) + ((down ? dy > 0 : dx < 0) ? 1 : -1)];
      spend(e);
      if (g != null) setGw(g);
    });
  }
  /** A card's title at its size: over its one line the smaller one. */
  const sizeTitle = (block) => { const head = block.querySelector('.ah-tkhead'); head.classList.toggle('long', head.offsetHeight > 1.6 * parseFloat(getComputedStyle(head).fontSize)); };
  /** The card while the first plan solves: the ticket as it will stand, GW g and its deadline, `title`, the wait line on
   *  its bar (paintWait), `action` its one button, `rest` under its words; the plan lands in place, nothing moves (owner,
   *  2026-11-05, "why card not displayed correctly at loading"). */
  function firstCard(g, title, action, rest) { const { barNode, dlEl } = V;
    return h('section.ah-block.ah-ticket', { 'aria-label': 'Your plan' },
      h('div.ah-tkbody', null, h('div.ah-tkrow', null, h('span.ah-tkg', null, `GW${g}`), dlEl, h('span.ah-tkx.m-num', null, h('span.m-skel'))), h('h2.ah-tkhead', null, title)),
      barNode({ cls: '.ah-pbake' }), rest, h('div.ah-tkacts', null, action));
  }
  function paintTicket(P, w, M, tk = []) { const { S, ctx, dlEl, el, bringDoor, chipsDoor, inkAt, openWeek, rsBtn, setGw, spanOf, stack, strip } = V;
    const block = strip.querySelector(':scope > .ah-ticket');
    if (!block || !w) return;
    paintStand(w);
    paintFlag(P, w);
    const g = w.gw, next = P.gws[P.gws.indexOf(g) + 1] ?? null, off = !P.editable;
    const btn = (kind, text, row, onClick) => h(`button.ah-${kind}`, { type: 'button', disabled: off, dataset: { row }, onClick }, text);
    const onward = next ? btn('go', COPY.onToWeek(next), 'tk:next', () => setGw(next)) : btn('go', COPY.setInFplGo, 'tk:fpl', (ev) => openWeek(ev, P.A));
    const best = tk.find((t) => t.matches('.mv.lead')), ans = tk.find((t) => t.matches('.ah-ans'));
    let title, line = null, left = null, right = null;
    if (best) {
      const { e, pl } = best.move, num = best.querySelector('.ah-tnum')?.cloneNode(true);
      // (once the week's rows are in: a card drawn before its best is a swap solved for nothing)
      if (!S.wait) presolveSwap(ctx, P, g, pl);
      title = e.adds.length ? movesWords(P, e.adds) : best.querySelector('.ah-tl').textContent;
      num?.querySelectorAll('.ah-tclose, .ah-tgw').forEach((x) => x.remove());
      line = [num, ' ', COPY.overNextWeeks(spanOf(P, g, pl))];
      const not = best.dataset.notIn ? { gw: g, out: Number(best.dataset.notOut), in: Number(best.dataset.notIn) } : null;
      left = btn('alt', COPY.showAnother, `tok:not:${g}`, (ev) => (not ? veto(ctx, not, { scope: 'pair' }) : openWeek(ev, g)));
      right = btn('go', COPY.makeTheSwap, `tok:best:${g}`, (ev) => (best.querySelector('.ah-tgo') ? best.take(ev) : best.click()));
    } else if (M?.sq && w.moves.length) {
      // (a Free Hit or Wildcard: the chip, not its whole squad; the Week sheet lists them and takes the chip back)
      title = S.status?.one ?? '';
      line = plural(w.moves.length, 'change');
      left = btn('alt', COPY.seeChanges, `tk:week:${g}`, (ev) => openWeek(ev, g));
      right = onward;
    } else if (w.moves.length) {
      title = movesWords(P, w.moves);
      left = btn('alt', COPY.undoMove, `tk:undo:${g}`, () => removeMove(ctx, { ...w.moves[w.moves.length - 1], gw: g }));
      right = onward;
    } else if (S.wait && !M?.live) {
      // (the week's answer still solving: the wait line alone, never "No transfer made" and its button as if it were the
      // answer; owner, 2026-11-05)
      title = '';
    } else if (ans) {
      title = ans.querySelector('.ah-tl').textContent;
      line = ans.querySelector('.ah-tw')?.textContent ?? null;
      left = btn('alt', COPY.showATransfer, `tok:ans:${g}`, (ev) => openWeek(ev, g));
      right = next ? btn('go', COPY.saveThem(w.ft ?? 1), 'tk:next', () => setGw(next)) : onward;
    } else {
      title = M?.live ? M.liveText : S.status?.one ?? '';
      right = next ? onward : null;
    }
    remember(P, g, typeof title === 'string' ? title : '');
    const chips = inkAt(ctx, P, g) ? null : [bringDoor(P, g), chipsDoor(P, g)];
    if (chips) { chips[0].textContent = COPY.bringInPlayer; chips[1].textContent = COPY.playAChip; }
    // the week's points with no transfers of yours, struck before its own, as on its tab (renderRail)
    const was = P.bare?.has(g) ? tickWas(w, P.bare.get(g)) : null;
    const held = rsBtn === document.activeElement;
    fill(block.querySelector(':scope > .ah-tkbody'),
      // (its tap the Week sheet: every transfer, choice and rule of the week, as the bar was: nothing is lost with the bar)
      h('button.ah-tkrow', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.weekTitle(g), dataset: { row: 'week', moves: w.moves.map((m) => `${m.out}>${m.in}`).join(' ') }, onClick: (ev) => openWeek(ev, g) },
        h('span.ah-tkg', null, `GW${g}`), g === P.A ? dlEl : null, h('span.ah-tkx.m-num', null, was ? h('s.ah-was', { 'aria-hidden': 'true' }, was) : null, xpNum(fmt.num(w.points)))),
      h('h2.ah-tkhead', null, title),
      h('div.ah-tkmid', null, line ? h('p.ah-tkline', null, line) : null, rsBtn),
      chips ? h('p.ah-tkor', null, 'Or ', chips[0], ', or ', chips[1], '.') : null);
    if (held) rsBtn.focus({ preventScroll: true });
    sizeTitle(block);
    fill(block.querySelector(':scope > .ah-tkacts'), left, right);
    stack.classList.toggle('scrolls', el.scrollHeight > el.clientHeight + 1);
    playStack(g);
  }
  return { adviceOf, bindStack, firstCard, holdStack, paintTicket, sizeTitle };
}
