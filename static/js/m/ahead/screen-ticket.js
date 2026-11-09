// screen.js mount: the week's ticket: one decision, one line, two buttons (owner, 2026-11-05: "either i transfer, or refuse
// and see another suggestion"; "stop wasting space on useless crap"; design_1105f prototype/ticket.html)

import { h, fill, fmt, plural, reduceMotion, xpGain, xpNum } from '../../ui.js';
import { CHIPS_OFF, COPY } from '../calls.js';
import { MINUS, pairAsPlaced, plan, viewOfRoadWeek, weekOf } from './core.js';
import { itbWords } from './pieces.js';
import { cardGain, owedAt, pinOfMove, presolveSwap, swapGain, removeWeek, showSuggestion, showTransfer, showingAt, suggestedAt, swapWeek, tappedSuggestion, tookOf } from './presolve.js';
import { choosing, placedAt, placedDone, stopChoosing } from './buys.js';
import { cardUndo, removeRule, takingBack, tickWas, veto } from './edits.js';

/** The card's line: words at its left, `right` at its right edge (design_1109a slip). */
const lineRow = (words, right = null, data = null) => h('p.ah-tkline', { dataset: data }, h('span.ah-tkl', null, words), right ? [' ', h('span.ah-tkr.m-num', null, right)] : null);
/** …for a move: one number, the solver's count `gain` (the saved transfer's own worth counted, what orders the cards),
 *  over its window (owner, 2026-11-09, design_1109a slip: "+1.2 xP vs saving, −1.1 xP counting the free transfer" and
 *  "Worse than saving" said one thing three ways). `forced`, a move the plan would not make, rides as data alone: its
 *  number below 0 says it. */
function moveLine(gain, forced, rounds) {
  // (a loss in the muted ink, never the gain's blue: books review 2026-11-08; "−0.0" and "0.0" are no loss)
  return lineRow(COPY.vsSavingNext(rounds), xpGain(gain, `span.ah-tkcount${fmt.signed(gain).startsWith(MINUS) ? '.neg' : ''}`), forced ? { forced: '' } : null);
}

/** "Murillo → Hill"; several, the sellers then the buys. */
const movesWords = (P, ms) => `${ms.map((m) => P.L.name(m.out)).join(', ')} → ${ms.map((m) => P.L.name(m.in)).join(', ')}`;
/** …as the card's title: each name a door to his own card, no other player on it; a single transfer's → the buy's card
 *  against the player he replaces, in the card's own charts, the one you have first as the title reads ("why current
 *  player on the right and not on the left") (owner, 2026-11-04: "make players clickable in tickets so
 *  they can be opened"; 2026-11-09: "remove konsa from vuskovic card", "Tap the → arrow", "fix so comparison is same
 *  format as player cards"). */
const movesTitle = (ctx, P, g, ms) => {
  const door = (id) => h('button.ah-tkname', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.cardOf(P.L.name(id)), dataset: { row: `tk:card:${g}:${id}` }, onClick: () => ctx.openSheet('player', Number(id), { gw: g }) }, P.L.name(id));
  const list = (xs) => xs.flatMap((x, i) => (i ? [', ', x] : [x]));
  const [m] = ms;
  const arrow = ms.length === 1 ? h('button.ah-tkname.ah-tkarrow', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.compareOf(P.L.name(m.out), P.L.name(m.in)), dataset: { row: `tk:vs:${g}:${m.in}` }, onClick: () => ctx.openSheet('player', Number(m.out), { gw: g, vs: m.in }) }, '→') : '→';
  return [...list(ms.map((x) => door(x.out))), ' ', arrow, ' ', ...list(ms.map((x) => door(x.in)))];
};
/** GW w's team with transfers `ms` made, each buy in his seller's place: the pitch while their solve is out (owner,
 *  2026-11-08: "suggestions not highlighting on pitch"), and a bring-in landing (placedAt). */
const inPlaces = (w, ms) => { const swap = (x) => ms.find((m) => Number(m.out) === Number(x))?.in ?? x; return { ...w, xi: w.xi.map(swap), bench: w.bench.map(swap) }; };
/** A swipe on the stack past this, px: the prototype's (design_1105f ticket.html). */
const STACK_SWIPE_PX = 36;
const STACK_MOTION = { duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)' };
/** The stack under a finger, px: it starts past `start`, follows up to `far`, and a quarter of that where no week is left
 *  (owner, 2026-11-05: "wont ever know if you moving anything"). */
const STACK_PULL = { start: 8, far: 96, end: 24 };

/** Compare players: the first from Bring in a player's list (wish.js `compare`, every position), then the second of
 *  his position, then the two side by side (sheets/player.js, `vs`). */
const comparePick = (ctx, P, g) => ctx.openSheet('wish', null, { gw: g, compare: {
  title: COPY.comparePlayers, back: () => {},
  pick: (a) => ctx.openSheet('wish', null, { gw: g, pos: P.L.pos(a), compare: {
    title: COPY.compareWith(P.L.name(a)), back: () => {},
    pick: (b) => ctx.openSheet('player', Number(a), { gw: g, vs: b }),
  } }),
} });

export function ticketPart(V) {
  /** What a week's tab says: your transfers alone. Each card's offer is worked out as if no week before it moves, so GW11's
   *  named beside GW10's read as a second transfer (owner, 2026-11-05: "why it shows gvardiol-hill on gw11"). */
  const adviceOf = (P, w) => (w.moves.length ? movesWords(P, w.moves) : '');
  /** The header's facts, the viewed week's: its free transfers or its transfers made, and its bank. */
  function paintStand(w) { const { stand } = V;
    const [ft, bank] = standWords(w);
    fill(stand, h('span', null, w.moves.length ? [h('b', null, plural(w.moves.length, 'transfer')), ' made'] : h('b', null, ft)),
      bank == null ? null : h('span', null, bank.short ? h('b.ah-short', null, bank.text) : [h('b', null, bank.text), ' in the bank']));
  }
  /** The week's free transfers and bank as the header words them: ["1 free transfer", {text: "£0.5m", short}] (a bank
   *  short of money has no ITB words, itbWords null: its shortfall, "£0.4m short"; it threw here and the ticket went
   *  unpainted, QA qa-tk2 2026-11-05). */
  function standWords(w) {
    const itb = w.bank != null ? itbWords(w.bank) : null;
    return [plural(w.ft ?? 1, 'free transfer'), w.bank == null ? null : itb ? { text: itb[0].replace(/ ITB$/, '') } : { text: COPY.moneyShort(-w.bank), short: true }];
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
   *  on a tab are the switcher's own scrub (rail). Up and down the card follows the finger, the tabs staying (owner,
   *  2026-11-06: "only full stack moving randomly"), on any screen: a short one scrolls from the pitch. Let go short of a
   *  swipe it goes back, past one holdStack takes the card from where the finger left it. The finger is let go at once: the
   *  week drawn at the release, not LIFT_MS on, when the card's picture has gone. */
  function bindStack() { const { atEdge, ctx, gwNow, letGo, setGw, spend, stack, strip } = V;
    let at = null;
    const weekBy = (step) => { const P = plan(ctx); return P?.gws[P.gws.indexOf(gwNow(P)) + step] ?? null; };
    const card = () => strip.querySelector(':scope > .ah-ticket');
    const pull = (px, axis) => { const c = card(); if (c) c.style.transform = px ? `translate${axis}(${px}px)` : ''; };
    const back = (px, axis) => { pull(0); if (px) card()?.animate([{ transform: `translate${axis}(${px}px)` }, { transform: 'none' }], STACK_MOTION); };
    // (d: the finger's way, on towards the next week where `on`)
    const reach = (d, on) => { const far = weekBy(on ? 1 : -1) != null ? STACK_PULL.far : STACK_PULL.end;
      return Math.sign(d) * Math.min(far, Math.abs(d) * (far === STACK_PULL.far ? 1 : .25)); };
    stack.addEventListener('pointerdown', (e) => { if (at?.px != null) return; at = e.isPrimary && e.button < 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, sideways: !atEdge(e) && !e.target.closest('.ah-rail'), px: null } : null; });
    stack.addEventListener('pointermove', (e) => {
      if (at?.id !== e.pointerId) return;
      const dx = e.clientX - at.x, dy = e.clientY - at.y;
      if (at.px == null) {
        const across = at.sideways && Math.abs(dx) > Math.abs(dy);
        if ((across ? Math.abs(dx) : Math.abs(dy)) < STACK_PULL.start || (!across && Math.abs(dy) < Math.abs(dx)) || reduceMotion()) return;
        at.axis = across ? 'X' : 'Y';
        stack.setPointerCapture(e.pointerId);
      }
      at.px = at.axis === 'X' ? reach(dx, dx < 0) : reach(dy, dy > 0);
      pull(at.px, at.axis);
    });
    stack.addEventListener('pointercancel', (e) => { if (at?.id !== e.pointerId) return; back(at.px, at.axis); at = null; });
    stack.addEventListener('pointerup', (e) => {
      if (at?.id !== e.pointerId) return;
      const dx = e.clientX - at.x, dy = e.clientY - at.y, { sideways, px, axis } = at;
      at = null;
      const down = Math.abs(dy) > STACK_SWIPE_PX && Math.abs(dy) >= Math.abs(dx);
      const g = down || (sideways && Math.abs(dx) > STACK_SWIPE_PX) ? weekBy((down ? dy > 0 : dx < 0) ? 1 : -1) : null;
      if (px != null || down || g != null) { spend(e); letGo(e); }
      if (g == null) return back(px, axis);
      setGw(g);
      pull(0);
    });
  }
  /** A card's title at its size: over its one line the smaller one. */
  const sizeTitle = (block) => { const head = block.querySelector('.ah-tkhead'); head.classList.toggle('long', head.offsetHeight > 1.6 * parseFloat(getComputedStyle(head).fontSize)); };
  /** The card while the first plan solves: the ticket as it will stand, GW g and its deadline, `title`, the wait line on
   *  its bar (paintWait), `action` its one button, `rest` under its words; the plan lands in place, nothing moves (owner,
   *  2026-11-05, "why card not displayed correctly at loading"). */
  function firstCard(g, title, action, rest) { const { barNode, dlEl } = V;
    return h('section.ah-block.ah-ticket', { 'aria-label': 'Your plan' },
      h('div.ah-tkbody', null, h('div.ah-tkrow', null, h('span.ah-tkg', null, `GW${g}`), dlEl, h('span.ah-tkx.m-num', null, h('span.m-skel'))), h('div.ah-tktitle', null, h('h2.ah-tkhead', null, title))),
      barNode({ cls: '.ah-pbake' }), rest, h('div.ah-tkacts', null, action), h('div.ah-tklinks'));
  }
  function paintTicket(P, w, M, tk = []) { const { S, ctx, dlEl, bringDoor, chipsDoor, inkAt, openWeek, rsBtn, setGw, stack, strip } = V;
    const block = strip.querySelector(':scope > .ah-ticket');
    if (!block || !w) return;
    paintStand(w);
    paintFlag(P, w);
    const g = w.gw, next = P.gws[P.gws.indexOf(g) + 1] ?? null, off = !P.editable;
    const btn = (kind, text, row, onClick) => h(`button.ah-${kind}`, { type: 'button', disabled: off, dataset: { row }, onClick }, text);
    const onward = next ? btn('go', COPY.onToWeek(next), 'tk:next', () => setGw(next)) : btn('go', COPY.setInFplGo, 'tk:fpl', (ev) => openWeek(ev, P.A));
    // the card's take-back, whatever it offers: this week's swaps all back ("Undo 2 swaps"), your last Show another
    // ("Previous"), else your last edit of any kind, a chip, a lineup, Hits ("Undo"), each exactly as the black tab's Undo
    // did; the left button where the card has nothing else there, a word beside Reset all weeks where it does (owner,
    // 2026-11-05, "why no undo button")
    const who = choosing(ctx, P, g);
    let after = null;
    const refused = P.pins.filter((p) => p.kind === 'notfor' && Number(p.gw) === g).at(-1);
    const swaps = M?.sq ? 0 : w.moves.length, last = cardUndo(ctx, g);
    // (a transfer Show a transfer drew: its Previous back to the plan's card)
    const best = tk.find((t) => t.matches('.mv.lead')), ans = tk.find((t) => t.matches('.ah-ans'));
    // (Show a transfer with none to show, every row gone: the plan's card, no wait and no button that does nothing)
    const none = !best && !!ans && showingAt(P, g) && !!M?.settled && !M.shownOut;
    // (…only where it drew a transfer worse than saving: every Show another turns Show a transfer on, so on a week the plan
    // makes a transfer in, all refusals taken back, the plan's own card kept a Previous that changed nothing; qa-tk80
    // j-card-another GW13)
    const showing = !swaps && !refused && showingAt(P, g) && !none && (!best || !!best.move?.pl?.forced), shown = showing && !last;
    // (…and with an older edit's Undo waiting on the week, its Previous beside that Undo: the Undo took Previous's place and
    // the card had no way back to the plan's; owner, 2026-11-09, "why not reset displayed", "fix")
    const prev = showing && last ? h('button.ah-rsbtn.undo.back', { type: 'button', disabled: off, dataset: { row: `tk:prev:${g}` }, onClick: () => { showTransfer(P, g, false); V.schedule(); } }, COPY.previous) : null;
    const undo = swaps > 1 || (swaps && !last) ? takingBack(() => removeWeek(ctx, g)) : last ?? (refused ? takingBack(() => removeRule(ctx, refused.id)) : shown ? () => { showTransfer(P, g, false); V.schedule(); } : null);
    const undoWords = swaps ? COPY.undoSwaps(swaps) : refused || shown ? COPY.previous : COPY.undoLast;
    // (the solver's answer you asked for with Show suggestion: its Previous back to the week's choice, where no Previous
    // of a refusal or of Show another stands; owner, 2026-11-09, "why no undo button")
    const toChoice = !swaps && !refused && !prev && !(undo && undoWords === COPY.previous) && tappedSuggestion(P, g)
      ? h('button.ah-rsbtn.undo.back', { type: 'button', disabled: off, dataset: { row: `tk:choice:${g}` }, onClick: () => { showSuggestion(P, g, false); showTransfer(P, g, false); V.schedule(); } }, COPY.previous) : null;
    let title, line = null, left = null, right = null, stamp = false, bringLeft = false, cmpLink = false;
    // (a week with your transfers is the made card, whatever the solver would add after them: state 1 is "no transfer of
    // yours yet"; a fresh solve after the take found a third move at 0.0 and the card offered it; qa-cold trace 2026-11-08)
    // (…except a week your transfers leave short of money, owedAt: its best is the way to pay it back (owedRoad, litCan's
    // paysBack), offered on the card, your swaps' take-back on its left; owner, 2026-10-28; qa-tk81 trace i)
    const owes = !!best && !M?.sq && owedAt(P, w);
    // (…and a week whose swaps are all the card's own (Make the swap's week-bound sells, addPlan; never a Bring in) where the
    // solver's plan adds one more on top, none of yours taken back: one transfer a card splits the solver's pair, so its
    // other part is the next card; owner, 2026-11-09, "why Dewsbury-Hall -> Ødegaard suggestion missing")
    const taken = (m) => { const p = pinOfMove(P, m); return p?.kind === 'sell' && p.must?.[0]?.[2] === Number(p.gw); };
    const more = !!best && !M?.sq && !!w.moves.length && w.moves.every(taken) && best.move.e.adds.length === 1 && !best.move.e.taken.length && !best.move.e.chipNow;
    if (best && (!w.moves.length || owes || more)) {
      const { e, pl } = best.move, gain = cardGain(ctx, P, g, pl);
      // (till Make the swap's own solve is in, the week as the choice's road plays it: the card's title and the pitch
      // pair the buys as it places them from the first frame, never "Raya, Dovin → Trafford, Verbruggen" for 1 s before
      // "→ Verbruggen, Trafford"; qa-tk106 j-ahead-random-b)
      const own = pl.road?.weeks?.find((x) => Number(x.gw) === g);
      after = swapWeek(ctx, P, g, pl) ?? (own ? viewOfRoadWeek(own, P.L) : null) ?? (e.adds.length ? inPlaces(w, e.adds) : null);
      // (for the card the draw ends on: a first paint before the pitch's rows are placed names another move of the week, a
      // swap solved for nothing)
      clearTimeout(S.swapAsk);
      if (!S.wait) S.swapAsk = setTimeout(() => presolveSwap(ctx, P, g, pl));
      title = e.adds.length ? movesTitle(ctx, P, g, pairAsPlaced(w, after, P.L.pos, e.adds)) : best.querySelector('.ah-tl').textContent;
      // (what the tabs will change by, over the weeks they show; its solve not in, no number guessed)
      // (…and on a week the plan rolls, that it does: its points are what the tabs will do, and the free transfer they spend
      // is why the plan doesn't; owner, 2026-11-06, "why -0.4 xp but it changed by 0.6")
      // (both numbers: its points against rolling (shownDelta, the count's points), then the solver's own count, the free
      // transfer's cost and value in it (cardGain, what orders the cards); owner, 2026-11-08, "shows both comparisons")
      // (books review 2026-11-08, owner "fix": the verdict first where the plan saves; a gain inside the forecast's noise
      // (counted's 'coin') says Close call, as the band did)
      // (…the number now what Swap moves the weeks' tabs by from GW g on (swapGain: each week's XI and armband points, as
      // its tab counts them), never the solver's count with its free-transfer terms and later weeks scaled; that still
      // orders the cards (cardGain); owner, 2026-11-09, "fix bug with +1.1 points")
      const pts = swapGain(ctx, P, g, pl);
      line = gain == null || pts == null ? COPY.waitShort : moveLine(pts, !!pl.forced, P.gws.filter((x) => x >= g).length);
      // (one transfer: its two players compared from a link under the line, as the title's → does; owner, 2026-11-09, "how
      // i compare players", "fix")
      const one = e.adds.length === 1 ? e.adds[0] : null;
      if (one) line = h('div', null, line instanceof Node ? line : lineRow(line), h('div.ah-tksug', null, h('button.ah-rsbtn', { type: 'button', dataset: { row: `tk:vs:${g}` }, onClick: () => ctx.openSheet('player', Number(one.out), { gw: g, vs: one.in }) }, COPY.comparePlayers)));
      const not = best.dataset.notIn ? { gw: g, out: Number(best.dataset.notOut), in: Number(best.dataset.notIn) } : null;
      // (…on to a transfer still where the solver's own run out: Show a transfer's on, so the week that then rolls shows its
      // best transfer, never the roll's card; owner, 2026-11-08, "why end up with same save your free transfer if i asked")
      left = owes ? btn('alt', undoWords, `tk:undo:${g}`, undo)
        : btn('alt', COPY.showAnother, `tok:not:${g}`, (ev) => { if (!not) return openWeek(ev, g); showTransfer(P, g); veto(ctx, not, { scope: 'pair' }); });
      // (Swap the right-hand button, Bring in a player among the links under it; owner, 2026-11-09, "move bring in player
      // below if show suggestion clicked and swap button to the place where currently bring in player")
      right = btn('go', COPY.swap, `tok:best:${g}`, (ev) => (best.querySelector('.ah-tgo') ? best.take(ev) : best.click()));
    } else if (M?.sq && w.moves.length) {
      // (a Free Hit or Wildcard: the chip, not its whole squad; the Week sheet lists them and takes the chip back)
      title = S.status?.one ?? '';
      line = plural(w.moves.length, 'change');
      left = btn('alt', COPY.seeChanges, `tk:week:${g}`, (ev) => openWeek(ev, g));
      right = onward;
    } else if (w.moves.length && M?.all?.owedOut && owedAt(P, w)) {
      // (a week your transfers leave short of money whose way to pay it back is still on its way (plansOf `owedOut`): the
      // wait in place, never your made card for a frame before the pay-back card (state 5); its solve failed or found no
      // way, the made card below; qa-tk83 trace m)
      title = '';
      line = COPY.waitShort;
      // (your swaps' take-back live: it waits on nothing, and the bring-in's toast Undo is this button; qa-tk84 f15-onetap,
      // undo-repeat, wish: the greyed Undo took no tap)
      // (…as the made card lays it out, its buttons greyed, the take-back live among the links)
      left = onward;
      left.disabled = true;
      bringRight();
    } else if (w.moves.length) {
      title = movesTitle(ctx, P, g, w.moves);
      // (the move you made keeps its numbers and its warning: books review 2026-11-08, "after Make the swap the card shows
      // no number"; the take's own, tookOf, while your plan is what it made)
      // (…all of the week's swaps against saving them (weekRollOf: the take's own number while it is the week's only one),
      // never the last take's share; owner, 2026-11-09, "why for every variant it shows +0.2")
      // (…what your swaps moved the weeks' tabs by from GW g on: each tab's points against its struck number without your
      // transfers (P.bare), while no later week has transfers of yours to mix in; owner, 2026-11-09, "fix bug with +1.1
      // points")
      const took = tookOf(P, w), from = P.gws.filter((x) => x >= g);
      const pts = from.some((x) => x > g && weekOf(P, x)?.moves.length) || !from.every((x) => P.bare?.has(x)) ? null
        : from.reduce((t, x) => t + weekOf(P, x).points - P.bare.get(x).points, 0);
      if (pts != null) line = moveLine(pts, !!took?.forced, from.length);
      stamp = true;
      // (On to GW<next> and Bring in a player, as the save card's two; your swaps' take-back among the links; owner,
      // 2026-11-09, "why bring player moved again fix bug")
      left = onward;
      bringRight();
      cmpLink = true;
    } else if ((showingAt(P, g) && !none && (ans || (S.wait && !M?.live))) || (!best && P.editable && !V.frozenAt(P, g) && (!!M?.lit?.move?.choice?.moves?.some((m) => m.gw === g) || !!M?.shownOut))) {
      // (…or a week whose next row is still to come in (shownOut), or its best known while the pitch, drawn anew, has no
      // place for its token yet: the roll's card showed 0.2 s between two transfers; owner, 2026-11-08)
      // (Show a transfer's next still solving: the transfer card waiting in place, its buttons greyed, never the roll's card
      // nor an empty one between two transfers; owner, 2026-11-08, "why switching dovin to kinsky then save your transfer,
      // then ajayi to justin")
      title = '';
      line = COPY.waitShort;
      left = btn('alt', COPY.showAnother, `tok:not:${g}`, null);
      right = btn('go', COPY.swap, `tok:best:${g}`, null);
      left.disabled = right.disabled = true;
    } else if (S.wait && !M?.live) {
      // (the week's answer still solving: the wait line alone, never "No transfer made" and its button as if it were the
      // answer; owner, 2026-11-05)
      title = '';
    } else if (ans) {
      title = ans.querySelector('.ah-tl').textContent;
      line = ans.querySelector('.ah-tw')?.textContent ?? null;
      // (a week the solver saves in: Bring in a player in Show a transfer's place, the transfers it offers being the solver's
      // own; without a forced buy or a shorter window it never proposes one there; owner, 2026-11-09, "move there bring a
      // player")
      // (nothing to do: rolling is the plan, so the button says where it goes; owner, 2026-11-06, "why need to click 'save
      // them' if its the same as doing nothing"); Bring in a player on the right as on the week's other cards (owner,
      // 2026-11-09, "why bring a player moved from right to left")
      left = onward;
      bringRight();
      cmpLink = true;
    } else {
      title = M?.live ? M.liveText : S.status?.one ?? '';
      right = next ? onward : null;
    }
    // (Bring in a player the right-hand button on the week's cards that offer no Swap, never among the links then)
    function bringRight() {
      right = btn('alt', COPY.bringInPlayer, `tok:bring:${g}`, () => ctx.openSheet('wish', null, { gw: g }));
      bringLeft = true;
    }
    // (the week's opening choice, nothing of yours in it yet: Show suggestion, the solver's answer as the card drew it
    // before, or Bring in a player, two equal buttons; owner, 2026-11-09, "make user
    // initially choose whether to show a suggestion - so user can just bring a player - make buttons equal to each other";
    // no On to GW<next> on it: "remove 'on to gw12'")
    if (!swaps && !refused && !M?.sq && !M?.live && !owedAt(P, w) && !showingAt(P, g) && !suggestedAt(P, g)) {
      // (its heading the week's free transfers and bank, as the owner's choice drew it, the card never an empty body)
      const [ft, bank] = standWords(w);
      title = bank == null ? ft : `${ft} · ${bank.short ? bank.text : `${bank.text} in the bank`}`;
      // (Show suggestion in the card's body under its heading, Compare players in its old place beside Bring in a player;
      // owner, 2026-11-09, "move show suggestion to the empty place above and compare players to its place")
      // (…as a link in the card links' own look (.ah-rsbtn: their font, underlined), not a boxed button: owner,
      // 2026-11-09, "fix so it displayed properly not as button", "with proper font and underlined")
      line = h('div.ah-tksug', null, h('button.ah-rsbtn', { type: 'button', disabled: off, dataset: { row: `tok:suggest:${g}` }, onClick: () => { showSuggestion(P, g); V.schedule(); } }, COPY.showSuggestion));
      stamp = false;
      after = null;
      left = btn('alt', COPY.comparePlayers, `tk:compare:${g}`, () => comparePick(ctx, P, g));
      bringRight();
      cmpLink = false;  // (its button already: no link beside it)
    }
    const placed = P.healing && !w.moves.length ? placedAt(g) : null;
    if (!placed) placedDone();
    if (who) {
      const pr = P.L.price(who.id);
      title = COPY.bringWho(P.L.name(who.id));
      line = lineRow(COPY.bringTap, pr == null ? null : fmt.money(pr));
      left = btn('alt', COPY.bringCancel, 'tk:cancel', () => stopChoosing(ctx));
      right = null;
      stamp = false;
    }
    else if (placed) {
      title = movesTitle(ctx, P, g, [placed]);
      line = null;
      stamp = false;
      after = inPlaces(w, [placed]);
    }
    // (the same two buttons from paint to paint of a week: a paint between a finger's down and up took its tap, a solve
    // landing as you tap "bring in a player")
    if (S.doors?.g !== g || S.doors.editable !== P.editable) S.doors = { g, editable: P.editable, of: [bringDoor(P, g), chipsDoor(P, g)] };
    const chips = who || inkAt(ctx, P, g) ? null : S.doors.of;
    if (chips) { chips[0].textContent = COPY.bringInPlayer; chips[1].textContent = COPY.playAChip; }
    // the week's points with no transfers of yours, struck before its own, as on its tab (renderRail)
    const was = P.bare?.has(g) ? tickWas(w, P.bare.get(g)) : null;
    const held = rsBtn === document.activeElement;
    fill(block.querySelector(':scope > .ah-tkbody'),
      // (its tap the Week sheet: every transfer, choice and rule of the week, as the bar was: nothing is lost with the bar)
      h('button.ah-tkrow', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.weekTitle(g), dataset: { row: 'week', moves: w.moves.map((m) => `${m.out}>${m.in}`).join(' ') }, onClick: (ev) => openWeek(ev, g) },
        h('span.ah-tkg', null, `GW${g}`), dlEl, h('span.ah-tkx.m-num', null, was ? h('s.ah-was', { 'aria-hidden': 'true' }, was) : null, xpNum(fmt.num(w.points)))),
      // (the names whole at full size, as many lines as they take, never cut nor smaller; the "Made" stamp beside them;
      // owner, 2026-11-09, "fix so players font not made smaller", "fix bug so names are displayed")
      h('div.ah-tktitle', null, h('h2.ah-tkhead', null, title), stamp ? h('span.ah-tkstamp', null, COPY.madeStamp) : null),
      line == null ? null : line instanceof Node ? line : lineRow(line));
    fill(block.querySelector(':scope > .ah-tkacts'), left, right);
    // every other thing the card does, one row under its two buttons (design_1109a slip): the take-back, Reset all weeks,
    // Bring in a player, Play a chip
    // (one take-back: a Previous where the card has one, the older edit's Undo then on the card it goes back to; owner,
    // 2026-11-09, "fix bug with multiple buttons of 'previous / undo / reset'")
    fill(block.querySelector(':scope > .ah-tklinks'), who ? null : h('span.ah-tkback', null, toChoice, undo && !toChoice && !prev && left?.dataset.row !== `tk:undo:${g}` ? h('button.ah-rsbtn.undo', { type: 'button', disabled: off, class: { back: !swaps && (!!refused || shown) }, dataset: { row: `tk:undo:${g}` }, onClick: undo }, undoWords) : null, prev, rsBtn,
        // (the made and save cards: any two players compared, as the opening card's button; a transfer's card has its
        // title's → for its own two; owner, 2026-11-09, "fix missing compare player")
        cmpLink ? h('button.ah-rsbtn', { type: 'button', dataset: { row: `tk:compare:${g}` }, onClick: () => comparePick(ctx, P, g) }, COPY.comparePlayers) : null),
      // (chips off, calls.js CHIPS_OFF: no Play a chip at all, never a link a tap does nothing on; owner, 2026-11-09, "why play
      // a chip not respond")
      chips ? h('span.ah-tkor', null, bringLeft ? null : chips[0], CHIPS_OFF ? null : chips[1]) : null);
    if (held) rsBtn.focus({ preventScroll: true });
    V.paintBoard(P, w, who ? null : after);
    playStack(g);
  }
  return { adviceOf, bindStack, firstCard, holdStack, paintTicket, sizeTitle };
}
