// screen.js mount: the week's ticket: one decision, one line, two buttons (owner, 2026-11-05: "either i transfer, or refuse
// and see another suggestion"; "stop wasting space on useless crap"; design_1105f prototype/ticket.html)

import { showDiagnostics } from './diagnostics.js';
import { h, fill, fmt, plural, reduceMotion, xpGain, xpNum } from '../../ui.js';
import { CHIPS_OFF, COPY } from '../calls.js';
import { MINUS, memOf, pairAsPlaced, plan, viewOfRoadWeek, weekOf } from './core.js';
import { forkRead } from './plans/forks.js';
import { cardGain, extraWeek, owedAt, owedRoad, presolveSwap, refusalRoads, removeWeek, showSuggestion, showTransfer, showingAt, swapWeek, tappedSuggestion, tookOf, tookSaid, sameWindow, windowRounds } from './presolve.js';
import { choosing, placedAt, placedDone, stopChoosing } from './buys.js';
import { cardUndo, removeRule, takingBack, tickWas, veto } from './edits.js';
import { MOVE_KINDS, fitNum } from './screen.js';

/** The card's line: words at its left, `right` at its right edge (design_1109a slip). */
const lineRow = (words, right = null, data = null) => h('p.ah-tkline', { dataset: data }, h('span.ah-tkl', null, words), right ? [' ', h('span.ah-tkr.m-num', null, right)] : null);
/** …for a move: one number, the solver's count `gain` (the saved transfer's own worth counted, what orders the cards),
 *  over its window (owner, 2026-11-09, design_1109a slip: "+1.2 xP vs saving, −1.1 xP counting the free transfer" and
 *  "Worse than saving" said one thing three ways). `forced`, a move the plan would not make, rides as data alone: its
 *  number below 0 says it. */
/** `vs`: what the number counts against, said as it is (card audit 2026-11-10): saving a free transfer only where one is
 *  left to save, your plan where the week is short or has none left, no transfers on your own transfer's card. */
function moveLine(gain, forced, rounds, vs) {
  // (a loss in the muted ink, never the gain's blue: books review 2026-11-08; "−0.0" and "0.0" are no loss)
  return lineRow(COPY.vsNext(rounds, vs), xpGain(gain, `span.ah-tkcount${fmt.signed(gain).startsWith(MINUS) ? '.neg' : ''}`), forced ? { forced: '' } : null);
}

/** The card's body under its title: its line row and its link row (the opening card's Show suggestion, a transfer's
 *  Compare players), each kept as an empty row where this state has none, so every state of the card is one height:
 *  the opening card grew 10 px into the transfer's and the page under it moved (owner, 2026-11-09, "why card size
 *  changing"). `node` the state's own (a .ah-tkline, a .ah-tksug, or a div of both) | null. */
function cardRows(node) {
  const box = node && !node.matches('.ah-tkline, .ah-tksug') ? node : h('div', null, node);
  if (!box.querySelector('.ah-tkline')) box.prepend(h('p.ah-tkpad.l', { 'aria-hidden': 'true' }, '\u00a0'));
  if (!box.querySelector('.ah-tksug')) box.append(h('div.ah-tkpad.s', { 'aria-hidden': 'true' }, h('span.ah-rsbtn', null, '\u00a0')));
  return box;
}
/** "Murillo → Hill"; several, the sellers then the buys. */
const movesWords = (P, ms) => `${ms.map((m) => P.L.name(m.out)).join(', ')} → ${ms.map((m) => P.L.name(m.in)).join(', ')}`;
/** …as the card's title: each name a door to his own card, no other player on it (owner, 2026-11-04: "make players
 *  clickable in tickets so they can be opened"; 2026-11-09: "remove konsa from vuskovic card"). The → is text: the two
 *  side by side are the Compare players link under the line, one control for one thing (card audit 2026-11-10). */
const movesTitle = (ctx, P, g, ms) => {
  const door = (id) => h('button.ah-tkname', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.cardOf(P.L.name(id)), dataset: { row: `tk:card:${g}:${id}` }, onClick: () => ctx.openSheet('player', Number(id), { gw: g }) }, P.L.name(id));
  const list = (xs) => xs.flatMap((x, i) => (i ? [', ', x] : [x]));
  return [...list(ms.map((x) => door(x.out))), ' → ', ...list(ms.map((x) => door(x.in)))];
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
   *  named beside GW10's read as a second transfer (owner, 2026-11-05: "why it shows gvardiol-hill on gw11"). One transfer
   *  by name, more as their count ("2 transfers"; owner, 2026-11-11: three names ran out of room). */
  const adviceOf = (P, w) => (w.moves.length > 1 ? plural(w.moves.length, 'transfer') : w.moves.length ? movesWords(P, w.moves) : '');
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
  /** A card's header row with a struck number (your transfers changed the week's points) where it has no room for it on one
   *  line beside the week and its deadline (a 375 pt screen at a larger text size): the struck number goes, as on the
   *  rail's tabs (fitRail, owner 2026-10-27), never a second line pushing the card past the screen (fit QA, qa-tk147: the
   *  made card's row on two lines, the screen 14 px past one). Again on a resize or a new text size (refitPitch). */
  const fitRows = (root) => {
    for (const row of root?.querySelectorAll('.ah-tkrow:has(.ah-was)') ?? []) {
      const lh = 1.5 * parseFloat(getComputedStyle(row).fontSize) * 1.2;
      fitNum(row, () => [...row.children].some((c) => c.getBoundingClientRect().height > lh), ['nowas']);
    }
  };
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
    const block = strip.querySelector(':scope > .ah-ticket'), waited = S.cardWait;
    S.cardWait = null;
    if (!block || !w) { if (waited != null) V.paintWait(); return; }
    const g = w.gw, next = P.gws[P.gws.indexOf(g) + 1] ?? null, off = !P.editable;
    // (its handler a property, so a repaint drawing the same button keeps the one on screen with the new handler: keptActs)
    const btn = (kind, text, row, onClick) => { const b = h(`button.ah-${kind}`, { type: 'button', disabled: off, dataset: { row } }, text); b.onclick = onClick ?? null; return b; };
    // (the last week none: its Set in FPL opened GW A's Week sheet, the header flag's own tap; card audit 2026-11-10)
    const onward = next ? btn('go', COPY.onToWeek(next), 'tk:next', () => setGw(next)) : null;
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
    // (the week's transfers take back their own: "Undo swap" ran a newer edit's Undo where one of the same week stood, a
    // captain's or a lineup's, under the transfer's words; card audit 2026-11-10)
    // (…but a Show another on top of them, a refusal newer than the week's transfers of yours: its Previous first, one
    // suggestion back, then Undo transfer once back at yours; still one button. Owner, 2026-11-12, "how to see previous
    // suggestion")
    const onTop = swaps && refused && refused.at >= Math.max(-Infinity, ...P.pins.filter((p) => MOVE_KINDS.has(p.kind) && Number(p.gw) === g).map((p) => p.at ?? 0));
    const undo = onTop ? takingBack(() => removeRule(ctx, refused.id)) : swaps ? takingBack(() => removeWeek(ctx, g)) : last ?? (refused ? takingBack(() => removeRule(ctx, refused.id)) : shown ? () => { showTransfer(P, g, false); V.schedule(); } : null);
    const undoWords = onTop ? COPY.previous : swaps ? COPY.undoSwaps(swaps) : refused || shown ? COPY.previous : COPY.undoLast;
    // (the solver's answer you asked for with Show suggestion: its Previous back to the week's choice, where no Previous
    // of a refusal or of Show another stands; owner, 2026-11-09, "why no undo button"; beside an edit's Undo, as `prev`:
    // the armband you moved after the tap had no Undo, qa-tk137 pitch-drag)
    const toChoice = !swaps && !refused && !prev && !(undo && undoWords === COPY.previous) && tappedSuggestion(P, g)
      ? h('button.ah-rsbtn.undo.back', { type: 'button', disabled: off, dataset: { row: `tk:choice:${g}` }, onClick: () => { showSuggestion(P, g, false); showTransfer(P, g, false); V.schedule(); } }, COPY.previous) : null;
    let title, line = null, left = null, right = null, noBring = false, diagnosticComparison = null;
    // The card is one of a few states, each drawn one way on every team and week (owner, 2026-11-10, "make sure that
    // transfer cards have a few unified states"; design_1109b review.md):
    //   opening   nothing of yours, not asked: "No transfer made"; Show suggestion | –
    //   wait      asked, its answer not in: your green line, "planning…"; no buttons (their places kept)
    //   offer     asked, the solver's one transfer with its number: your green line, "Out → In"; Show another | Transfer
    //   save      asked, the solver saves the week: "Save your free transfer"; – | On to GW<next>
    //   made      a transfer of yours, nothing asked: your green line, its number; Show suggestion | – where the solver
    //             has a move on top or the week is short, else – | On to GW<next>
    //   choosing  Bring in a player's second step: "Name → ?"; Cancel | –
    // plus a chip's week and a week under way. Two button places on every card, the green one at the right, an empty
    // place kept (the card one height); Compare players under the line where the card has one out and one in; the
    // take-backs, Reset all weeks and Bring in a player in the links row; nothing of the week bar inside the card (the
    // free transfers and bank are the header's alone; card audit 2026-11-10).
    const placed = P.healing && !w.moves.length ? placedAt(g) : null;
    if (!placed) placedDone();
    const yours = M?.sq ? [] : placed ? [placed] : w.moves;
    // (your transfers of the week, one look on every card of it: a small green line above the title, names alone; owner,
    // 2026-11-09, "whe de cyper-uskovic designed differerntly on different cardss", "remove this 'made' crap")
    const withMine = (t) => (yours.length ? [h('span.ah-tkmine', null, yours.map((m) => `${P.L.name(m.out)} → ${P.L.name(m.in)}`).join(', ')), t] : t);
    // (any two players compared, the one look in the body under the line: the card's one transfer's two, else any two
    // you pick (comparePick); owner, 2026-11-09, "fix so show suggestion and compare players switch places", "fix missing
    // compare player"; 2026-11-10: kept on the opening, wait and save cards, where it compares any two)
    const withCompare = (row, one = null) => h('div', null, row == null ? null : row instanceof Node ? row : lineRow(row), h('div.ah-tksug', null, one
      ? h('button.ah-rsbtn', { type: 'button', dataset: { row: `tk:vs:${g}` }, onClick: () => ctx.openSheet('player', Number(one.out), { gw: g, vs: one.in }) }, COPY.comparePlayers)
      : h('button.ah-rsbtn', { type: 'button', dataset: { row: `tk:compare:${g}` }, onClick: () => comparePick(ctx, P, g) }, COPY.comparePlayers)));
    const askLeft = () => btn('alt', COPY.showSuggestion, `tok:suggest:${g}`, () => { showSuggestion(P, g); V.schedule(); });
    // (a week your transfers leave short of money, owedAt; and the solver's next move on top of yours: one transfer, none
    // of yours taken back, no chip; owner, 2026-11-09)
    const short = !M?.sq && !placed && owedAt(P, w), asked = tappedSuggestion(P, g);
    const moreAvail = !!best && !M?.sq && !!w.moves.length && best.move.e.adds.length >= 1 && !best.move.e.taken.length && !best.move.e.chipNow;
    const owes = !!best && short && asked;
    // (your transfers leave free ones (extraWeek): Show suggestion stays yours to tap, its answer the save of those left
    // where the solver adds none; owner, 2026-11-10, "when i buy player when one transfer left and i ask suggestion")
    const freeLeft = !M?.sq && !placed && !!w.moves.length && !extraWeek(P, g);
    // (asked: the week's suggestion was asked for (Show suggestion, a refusal, Show another), its ask standing through each
    // Swap; never a suggestion you didn't ask for: owner, 2026-11-09)
    const wanted = asked || showing || !!refused;
    const offerable = !!best && !placed && (!w.moves.length ? wanted : (owes || (moreAvail && asked)));
    // (its answer still on its way: a solve of the week out, its choices not settled, its next row or its pay-back to come)
    // (…and the solver's answer to your ask not in yet: the week's own road (refusalRoads' root, or a short week's way to
    // pay it back, owedRoad), read only: a Save card drawn from before the ask flashed up live before the suggestion
    // landed; review 1c, design_1109b capture: 41 and 43 GW12)
    // (…or come back without one: a solve that failed or found no plan (forkRead 'error' | 'infeasible') answers the ask
    // too; else the card waited on "planning…" for good; card-audit 1110 load repro, 383130 GW13 after a Reset)
    const answerRoad = () => (short ? owedRoad(ctx, P, g, { peek: true }) : refusalRoads(ctx, P, g, { peek: true, depth: 0 })[0]);
    // ('error' | 'infeasible' where the ask's own solve came back without a plan, else null)
    const failedHow = () => { const r = answerRoad(); if (!r || r.road != null || !r.key) return null; const f = forkRead(r.key); return f === 'error' || f === 'infeasible' ? f : null; };
    const failed = asked && !best ? failedHow() : null;
    const answered = () => answerRoad()?.road != null || !!failedHow();
    const solving = !!S.wait || (!!M && !M.settled) || !!M?.shownOut || !!M?.all?.owedOut || (asked && !best && !answered());

    const wait = () => {
      // (the strip's wait line and the greyed pitch follow it: paintWait's waitNow; at once only while your ask's answer
      // isn't in, a tap's landing (its swap solved ahead, the later weeks filling ~0.4 s) after the usual second: owner,
      // 2026-11-12, "why when i press transfer it greys out and plan if it already solved this")
      S.cardWait = g; S.cardAsk = asked && !best && !answered();
      title = withMine('');
      // (no buttons while it plans, their places kept: the greyed Show another | Swap promised a suggestion where a made or
      // a save card came; card audit 2026-11-10)
      line = withCompare(COPY.waitShort);
      // (nothing to bring in while it plans: the links row one line, the card one height; design_1109b capture, 41 #06)
      noBring = true;
    };
    const opening = () => {
      title = COPY.noTransferMade;
      line = withCompare(null);
      left = askLeft();
    };
    // (your week's transfers, one number on every card of the week that has them, made or answered with a save: the
    // week against rolling it, the later weeks the same on both sides (weekRollOf: the Week sheet's and the week line's),
    // over the solver's window where both plans count the same weeks (GW13's GW13-16), else over the plan's weeks; till
    // the roll is in, the tabs against the plan with none of your transfers, where no later week has any of yours
    // (owner, 2026-11-09, "fix bug with +1.1 points"; 2026-11-11, "they are one state": GW13 "Next 2 weeks +14.4",
    // GW11's save with four of yours no number)
    // (a transfer you took from its card: that card's own line while the take stands (tookSaid), its number, window and
    // what it counts against, never a second count of it; GW13 read "+1.1 · Next 4 weeks vs saving a free transfer"
    // before the tap, "+2.6 · Next 2 weeks vs no transfers" after; owner, 2026-11-12, "why 'next 2 weeks' if window is 4
    // weeks - fix bug", "fix bug")
    const yoursLine = () => {
      if (placed) return null;
      const took = tookOf(P, w), from = P.gws.filter((x) => x >= g), r = V.weekRoll(P, w);
      if (took?.said) return moveLine(took.said.pts, !!took.forced || fmt.signed(took.said.pts).startsWith(MINUS), took.said.rounds, took.said.vs);
      const win = r?.shown != null && r.counted ? sameWindow(...r.counted, g) : 0;
      if (r) return moveLine(win ? r.shown : (r.pts?.delta ?? r.delta), !!took?.forced, win || from.length, COPY.planVsRoll);
      // (the plan without your transfers rolls every week: a week with no transfer counted over itself alone, so never
      // its window against your plan's; owner, 2026-11-11, "what is this crap", +160.5 for three transfers)
      const tabs = from.some((x) => x > g && weekOf(P, x)?.moves.length) || !from.every((x) => P.bare?.has(x)) ? null
        : from.reduce((t, x) => t + weekOf(P, x).points - P.bare.get(x).points, 0);
      return tabs == null ? null : moveLine(tabs, !!took?.forced, from.length, COPY.planVs(false));
    };
    const made = () => {
      title = withMine('');
      line = withCompare(yoursLine(), yours.length === 1 ? yours[0] : null);
      if ((short || moreAvail || freeLeft) && !asked && P.editable) left = askLeft();
      else right = onward;
      if (placed) after = inPlaces(w, [placed]);
    };
    const save = () => {
      title = withMine(ans.querySelector('.ah-tl').textContent);
      // (on top of your transfers, their number, as on the made card: one state; owner, 2026-11-11)
      const mine = yours.length ? yoursLine() : null;
      line = withCompare(mine ?? ans.querySelector('.ah-tw')?.textContent ?? null, mine && yours.length === 1 ? yours[0] : null);
      right = onward;
    };
    const offer = () => {
      const { e, pl } = best.move;
      const own = pl.road?.weeks?.find((x) => Number(x.gw) === g);
      after = swapWeek(ctx, P, g, pl) ?? (own ? viewOfRoadWeek(own, P.L) : null) ?? (e.adds.length ? inPlaces(w, e.adds) : null);
      clearTimeout(S.swapAsk);
      // (asked the moment the card is drawn, never after the week's other solves: the refusal walk's asks ahead spent your
      // tap's 6 first and the card had no number; its move is the lit one, which the week settled on; design_1109b)
      S.swapAsk = setTimeout(() => presolveSwap(ctx, P, g, pl));
      // (its number the solver's own count (cardGain) over the window it decided GW g on, the number it orders its moves
      // by, so Show another's next always reads lower; points alone read 41's GW11 Hall → Vuskovic +2.1, Hall → Hill +1.2,
      // Konsa → Vuskovic +1.7, counted 1.09, 1.04, 0.74; owner, 2026-11-11, "every next suggestion it offers show less
      // points then previous". Never a guess: till its row is in, the wait card)
      const pts = cardGain(ctx, P, g, pl), rounds = windowRounds(pl.road, g) || P.gws.filter((x) => x >= g).length;
      if (pts == null) return wait();
      const ms = e.adds;
      title = withMine(ms.length ? movesTitle(ctx, P, g, pairAsPlaced(w, after, P.L.pos, ms)) : best.querySelector('.ah-tl').textContent);
      const one = ms.length === 1 ? ms[0] : null;
      // (saving a free transfer the alternative only where one is left and the week is not short: a pay-back's number is
      // against your plan, short as it stands; card audit 2026-11-10)
      const vs = !short && !extraWeek(P, g) && (w.ft ?? 1) > 0 ? COPY.vsSaving : COPY.planVs(true);
      // (a move the solver's count puts below saving the small state, a transfer the plan would not make, whoever
      // offers it; owner, 2026-11-11, "the card should show number which will not mislead or confuse users")
      diagnosticComparison = { gain: pts, rounds, vs };
      line = withCompare(moveLine(pts, !!pl.forced || fmt.signed(pts).startsWith(MINUS), rounds, vs), one);
      const not = best.dataset.notIn ? { gw: g, moves: ms, out: Number(best.dataset.notOut), in: Number(best.dataset.notIn) } : null;
      // (refuse and see another, on every suggestion, a pay-back's too; your swaps' take-back among the links; owner,
      // 2026-11-05, "either i transfer, or refuse and see another suggestion"; review 2)
      // (…where the suggestion has one out and one in to refuse: with none it opened the Week sheet; card audit 2026-11-10)
      left = not ? btn('alt', COPY.showAnother, `tok:not:${g}`, () => { showTransfer(P, g); veto(ctx, not, { scope: 'pair' }); }) : null;
      // (Solve ahead off: the transfer made answers your ask, the made card's own Show suggestion asks the next; owner,
      // 2026-11-11, "turn off every solve-ahead case when it is off": the next suggestion on top was solved unasked)
      const answeredAsk = () => { if (!ctx.presolveOn?.()) { showSuggestion(P, g, false); showTransfer(P, g, false); } };
      right = btn('go', COPY.swap, `tok:best:${g}`, (ev) => {
        answeredAsk();
        const r = best.querySelector('.ah-tgo') ? best.take(ev) : best.click();
        tookSaid(g, { pts, rounds, vs });
        return r;
      });
    };

    if (who?.kind === 'sub') {
      title = COPY.subWho(P.L.name(who.id), w.bench.includes(who.id));
      line = lineRow(COPY.subTap);
      left = btn('alt', COPY.bringCancel, 'tk:cancel', () => stopChoosing(ctx));
    } else if (who) {
      const pr = P.L.price(who.id);
      title = COPY.bringWho(P.L.name(who.id));
      line = lineRow(COPY.bringTap, pr == null ? null : fmt.money(pr));
      left = btn('alt', COPY.bringCancel, 'tk:cancel', () => stopChoosing(ctx));
    } else if (M?.sq && w.moves.length) {
      // (a Free Hit or Wildcard: the chip, not its whole squad; the Week sheet lists them and takes the chip back)
      title = S.status?.one ?? '';
      line = plural(w.moves.length, 'change');
      left = btn('alt', COPY.seeChanges, `tk:week:${g}`, (ev) => openWeek(ev, g));
      right = onward;
    } else if (M?.live) {
      title = M.liveText;
      right = next ? onward : null;
    } else if (offerable) {
      offer();
    } else if (placed) {
      // (a bring-in tapped on the pitch, its solve out: the wait card with its green line, never the made card on the bank
      // before it; review 1, 12)
      wait();
    } else if (failed && !solving) {
      // (the ask came back without a plan: said so, never a Save the solver didn't give; your transfers' card under it)
      const inf = failed === 'infeasible';
      if (yours.length) { made(); line = inf ? COPY.infeasible(g) : COPY.unfinished; }
      else { title = withMine(inf ? COPY.noPlan(g) : ''); line = inf ? COPY.unchanged : COPY.unfinished; right = onward; }
    } else if (freeLeft && asked && ans && !short && !solving) {
      // (asked on top of yours, the solver adding none: the save of the free transfers left)
      save();
    } else if (yours.length && !(wanted && solving)) {
      made();
    } else if ((wanted && solving) || (P.healing && !yours.length && !short)) {
      // (…and your edit's solve out: the Transfer that answered your ask (answeredAsk) drew the opening card for 1.4 s,
      // till the swap landed; qa-tk137 j-card-swap)
      wait();
    } else if (wanted && ans) {
      save();
    } else if (!yours.length && !short) {
      opening();
    } else {
      title = S.status?.one ?? '';
      right = next ? onward : null;
    }
    showDiagnostics(ctx, P, w, { asked, wanted, offerable, solving, failed, short: !!short, freeLeft, refused,
      comparison: diagnosticComparison, candidate: best?.move, candidates: (M?.plans ?? []).filter(pl => pl.solver && !pl.refRow).map(pl => ({ pl, moves: pl.choice.moves.filter(m => !w.moves.some(y => y.out === m.out && y.in === m.in)) })),
      status: who ? 'Choosing a player' : M?.live ? 'Live week' : offerable ? 'Suggestion' : solving ? 'Calculating' : yours.length ? 'Your transfers' : wanted && ans ? 'Save transfers' : 'Suggestion not requested' });
    // (the same two buttons from paint to paint of a week: a paint between a finger's down and up took its tap, a solve
    // landing as you tap "bring in a player")
    if (S.doors?.g !== g || S.doors.editable !== P.editable) S.doors = { g, editable: P.editable, of: [bringDoor(P, g), chipsDoor(P, g)] };
    const chips = who || inkAt(ctx, P, g) ? null : S.doors.of;
    if (chips) { chips[0].textContent = COPY.bringInPlayer; chips[1].textContent = COPY.playAChip; }
    // the week's points with no transfers of yours, struck before its own, as on its tab (renderRail)
    const was = P.bare?.has(g) ? tickWas(w, P.bare.get(g)) : null;
    const held = rsBtn === document.activeElement;
    const sheetHas = w.moves.length > 1 || !!M?.sq || !!M?.live || !!M?.notices?.length || !!M?.plans?.some((pl) => !pl.refRow) || !!V.asksHost?.firstChild;
    fill(block.querySelector(':scope > .ah-tkbody'),
      // (its tap the Week sheet where that holds what the card doesn't: each of two or more transfers to take back, the
      // week's suggested plans, its notices, your rules, a chip's or a live week's; else no tap: the sheet was its facts
      // line, the header's, over "Roll 0.0", the one thing it counts against (owner 2026-11-10, boards-full 383130 #004))
      h(sheetHas ? 'button.ah-tkrow' : 'div.ah-tkrow', sheetHas ? { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.weekTitle(g), dataset: { row: 'week', moves: w.moves.map((m) => `${m.out}>${m.in}`).join(' ') }, onClick: (ev) => openWeek(ev, g) } : { dataset: { moves: w.moves.map((m) => `${m.out}>${m.in}`).join(' ') } },
        h('span.ah-tkg', null, `GW${g}`), dlEl, h('span.ah-tkx.m-num', null, w.ft == null ? null : h('span.ah-tkf', null, `${w.ft}FT`), w.bank == null ? null : h('span.ah-tkb', { class: { neg: w.bank < -1e-9 } }, fmt.money(w.bank)), was ? h('s.ah-was', { 'aria-hidden': 'true' }, was) : null, xpNum(fmt.num(w.points)))),
      // (the names whole at full size, as many lines as they take, never cut nor smaller;
      // owner, 2026-11-09, "fix so players font not made smaller", "fix bug so names are displayed")
      h('div.ah-tktitle', null, h('h2.ah-tkhead', null, title)),
      cardRows(line == null ? null : line instanceof Node ? line : lineRow(line)));
    // (Bring in a player beside Compare players where the card has it, the two ways to look at players in one row; else
    // in the row under the buttons; owner, 2026-11-11, "move 'bring in a player' next to 'compare players'")
    fitRows(block);
    const sug = block.querySelector(':scope > .ah-tkbody .ah-tksug');
    const bringBy = chips && !noBring && sug ? chips[0] : null;
    if (bringBy) sug.append(bringBy);
    // (…that row under the buttons on every card, the buttons up in its place; owner, 2026-11-11, "raise the button to
    // where compare players was and compare players to the button's place")
    // (a card's one action the whole row, two side by side, the green at the right; none, the row's place kept empty
    // (.ah-tkpad, m-ahead.css) so the card is one height: a half-width button beside an empty half read as broken,
    // owner 2026-11-10, boards-full 383130 #001)
    const both = [left, right].filter(Boolean);
    const acts = block.querySelector(':scope > .ah-tkacts'), kids = keptActs(g, both.length ? both : [h('span.ah-tkpad', { 'aria-hidden': 'true' })]);
    if (kids.length !== acts.children.length || kids.some((k, i) => k !== acts.children[i])) fill(acts, ...kids);
    for (const old of block.querySelectorAll(':scope > .ah-tksug')) if (old !== sug) old.remove();
    if (sug) acts.after(sug);
    // every other thing the card does, one row under its two buttons (design_1109a slip): the take-back, Reset all weeks,
    // Bring in a player, Play a chip
    // (one take-back: a Previous where the card has one, the older edit's Undo then on the card it goes back to; owner,
    // 2026-11-09, "fix bug with multiple buttons of 'previous / undo / reset'")
    // (one take-back, first in the row: where transfers of yours stand on the card, theirs, "Undo transfer", in one tap on
    // every card they stand on (the made card, the wait after it, a suggestion or a save on top of them); the Previous on
    // top of them only took the ask off, to a made card never shown (dynamics D4), with Undo transfer beside it the row
    // ran to two lines and the card grew; owner 2026-11-10)
    fill(block.querySelector(':scope > .ah-tklinks'), who ? null : h('span.ah-tkback', null, toChoice, undo && (!toChoice || last) && !prev ? h('button.ah-rsbtn.undo', { type: 'button', disabled: off, class: { back: !!onTop || (!swaps && (!!refused || shown)) }, dataset: { row: `tk:undo:${g}` }, onClick: undo }, undoWords) : null, prev, rsBtn),
      // (chips off, calls.js CHIPS_OFF: no Play a chip at all, never a link a tap does nothing on; owner, 2026-11-09, "why play
      // a chip not respond")
      chips ? h('span.ah-tkor', null, noBring || bringBy ? null : chips[0], CHIPS_OFF ? null : chips[1]) : null);
    if (held) rsBtn.focus({ preventScroll: true });
    V.paintBoard(P, w, who ? null : after);
    playStack(g);
    // (the pitch fitted again to the card as now drawn (fitPitch: keyed by its height, nothing when it is the same): a card
    // that grew with no render after it, a wait card, ran 35 px past the screen; owner, 2026-11-11, "why not fit the screen")
    V.fitPitch();
    // (and the wait's bar placed again, under the "planning…" line this draw made: left where the last draw's line was, it
    // sat at the card's foot; owner, 2026-11-12, "why progress bar not at same place where 'planning..' is")
    V.paintWait();
  }
  return { adviceOf, bindStack, firstCard, fitRows, holdStack, paintTicket, sizeTitle };
}

/** The card's two buttons as a repaint draws them, each the button this card drew before for the same thing (its row,
 *  class and words), its handler and greyed state the new one's: a tap across a repaint lands on the button it went
 *  down on, a wait card between the two paints too (qa-tk116/117 ticket: Bring in a player rebuilt by a landing solve;
 *  fold tk48, f15-onetap tk49). The buttons drawn kept per week (the card's own element may be drawn anew), the last
 *  few. → the nodes to show */
const ACTS_KEPT = 8, ACTS = new Map();
function keptActs(g, kids) {
  if (!ACTS.has(g)) ACTS.set(g, new Map());
  const kept = ACTS.get(g), keyOf = (b) => `${b.tagName}|${b.className}|${b.dataset.row ?? ''}|${b.textContent}`;
  return kids.filter(Boolean).map((k) => {
    const key = keyOf(k), old = kept.get(key);
    kept.delete(key);
    const use = old ?? k;
    if (old) { old.disabled = k.disabled; old.onclick = k.onclick; }
    kept.set(key, use);
    while (kept.size > ACTS_KEPT) kept.delete(kept.keys().next().value);
    return use;
  });
}

