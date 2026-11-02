// screen.js mount: a place's cards and the Week sheet's opening

import { weekOf } from './core.js';
import { PLACE_SLOTS, failedWords, lineMoves, noteOf, placeBuys, placeOrder, placePages, placeSplit, rowsWanted, slotsBeside, takesBack } from './plans.js';
import { h, reduceMotion } from '../../ui.js';
import { pinOfMove, presolveTaps, removeMove } from './presolve.js';
import { COPY } from '../calls.js';
import { benchedBuys, keep } from './edits.js';
import { plPays } from './pieces.js';
import { HEAD_LEAST, HEAD_NUM, HEAD_TRIMS, fitNum, headScale, oneLook, whole } from './screen.js';

export function placePart(V) {
  /** The open place drawn (openPlace), its choices dealt out from behind him (`deal`: 180 ms, 18 ms apart; Reduce
   *  Motion: a fade) or redrawn in place (a solve landed, a resize). */
  function drawPlace(deal) { const { FLY_EASE, S, cardBoxes, closePlace, ctx, entryKey, frozenAt, gwNow, numParts, openPlanWhy, pitchHost, plNumSaid, planKey, planSaid, plansVs, plateOf, spend, takeFrom } = V;
    const root = pitchHost.querySelector(':scope > .pm');
    const P = S.drawn, w = P && weekOf(P, gwNow(P)), d = w && S.decks?.find((x) => x.a === S.place?.a);
    // the control focused in it (keyboard, VoiceOver) is refocused after a redraw
    const was = document.activeElement?.closest?.('.ah-place') ? document.activeElement : null;
    const focusKeyOf = (n) => n && (n.dataset.key ? `[data-key="${CSS.escape(n.dataset.key)}"]` : n.dataset.add ? `[data-add="${CSS.escape(n.dataset.add)}"]`
      : n.getAttribute('aria-label') ? `[aria-label="${CSS.escape(n.getAttribute('aria-label'))}"]` : null);
    const again = focusKeyOf(was);
    root?.querySelector(':scope > .ah-place')?.remove();
    for (const n of root?.querySelectorAll('.ah-stepout') ?? []) { n.classList.remove('ah-stepout'); n.inert = false; }
    const boxes = root && d ? cardBoxes(root) : [], c = boxes.find((x) => x.id === d?.a);
    if (!c) { closePlace(false); return; }
    const g = w.gw, nm = P.L.name, W = root.clientWidth, data = ctx.data;
    const px = (x, y) => ({ left: `${x}px`, top: `${y}px`, width: `${c.w}px` });
    // its order is held while open: a solve landing fills a number in place, nothing moves under a finger (one listed
    // after it opened, his other buys from askPlace, goes in placeOrder's order after those held, the take-backs still
    // last)
    S.place.order ??= placeOrder(d.entries).map((e) => entryKey(g, e));
    const rank = new Map([...S.place.order, ...placeOrder(d.entries).map((e) => entryKey(g, e))].map((k, i) => [k, i]).reverse());
    const at = (e) => [takesBack(e) ? 1 : 0, rank.get(entryKey(g, e))];
    const entries = d.entries.slice().sort((x, y) => { const [p, i] = at(x), [q, j] = at(y); return p - q || i - j; });
    const row = c.n.closest('.pm-row, .pm-bench');
    const mates = boxes.filter((q) => q !== c && q.n.closest('.pm-row, .pm-bench') === row);
    const xs = [c, ...mates].map((q) => q.x).sort((p, q) => p - q);
    const step = c.bench && xs.length > 1 ? Math.min(...xs.slice(1).map((x, i) => x - xs[i])) : c.w + Math.max(4, (W - 5 * c.w) / 6);
    const room = slotsBeside(c.x, step, PLACE_SLOTS, W, c.w);
    // his own single moves are the cards, at most one line for a plan he is part of (placeSplit): no "or …" line under
    // a card, no "also …" note (owner, 2026-10-26)
    const { singles, line: pline } = placeSplit(entries, d.a);
    // its last slot a tile (placePages): "Other…", Bring in… on this week at his position, any player the cards don't
    // offer (owner, 2026-10-27), under "⋯ N more" where his choices take more than a page (its next page dealt)
    const other = P.editable && !frozenAt(P, g);
    const pages = placePages(singles, room.length, other), pg = (S.place.page ?? 0) % pages.length;
    const over = pages.length > 1;
    const shown = pages[pg];
    const tileAt = over ? room.at(-1) : other ? room[shown.length] ?? null : null;
    // his row steps aside only where a dealt card (or the tile) takes a row-mate's slot; the rest stay, under the shade
    // (owner, 2026-10-21)
    const used = room.slice(0, shown.length + (tileAt != null ? 1 : 0));
    const out = mates.filter((q) => used.some((x) => Math.abs(q.x - x) < q.w));
    for (const q of out) { q.n.classList.add('ah-stepout'); q.n.inert = true; }
    const tab = (x) => `calc(${c.y}px - var(--pm-tab))`;
    const P2 = plateOf().second;
    const shade = h('div.ah-pshade', { onClick: (e) => shadeTap(e, boxes) });
    // his own card, bright, under what he is now
    const own = c.n.cloneNode(true);
    own.removeAttribute('data-id');
    own.classList.remove('ah-landed');
    own.classList.add('ah-pown');
    Object.assign(own.style, px(c.x, c.y));
    // (his real card focused first: the sheet it opens gives focus back to it)
    own.addEventListener('click', (e) => { e.stopPropagation(); c.n.focus({ preventScroll: true }); closePlace(false); c.n.click(); });
    // "Yours" over a transfer of yours, with no number: the choices beside it count against your plan, which yours is
    // (decision K; its own number vs rolling stays on the week line); "Now" over a player or a buy Forkcast made (a
    // week it re-picks: no rule of yours)
    const myMove = d.mine ? w.moves.find((m) => Number(m.in) === d.a) : null;
    const yours = !!myMove && !!pinOfMove(P, { ...myMove, gw: g });
    // a player the choices would sell (not a buy of yours): "Keep", his slot's no-transfer as the Roll is a buy's: a
    // GW-g Keep of him (keep), every choice selling him gone, at once with Undo (owner, 2026-10-21)
    const keeps = !d.mine && P.editable && !frozenAt(P, g);
    const nowHead = keeps
      ? h('button.ah-phead.now.ah-pkeep.outl', { type: 'button', dataset: { key: 'keep' }, 'aria-label': COPY.placeKeepSaid(nm(d.a), g), style: { ...px(c.x, 0), top: tab() },
        onClick: () => { closePlace(false); keep(ctx, d.a, { gw: g, scope: 'gw' }); } }, COPY.placeKeep)
      : h('div.ah-phead.now', { 'aria-hidden': 'true', style: { ...px(c.x, 0), top: tab() } },
        // (your number blue with "xP": xpGain)
        // (in a span fitNum fits, as a dealt card's number)
        yours ? h('span.ah-pv.m-num', null, COPY.placeYours) : COPY.placeNow);
    const dealt = [];
    shown.forEach((e, i) => {
      const x = room[i], pl = e.pl, s = pl ? planSaid(P, g, pl) : null;
      const ready = !pl || pl.state === 'ready';
      // a buy Forkcast made (no rule of yours): its × keeps the player it sold (removeMove), as the Week sheet's row says
      const fk = !!e.remove && !pinOfMove(P, e.remove);
      const said = e.remove ? (fk ? COPY.keepIn(nm(e.remove.out), g) : COPY.placeRemoveSaid(nm(e.remove.out), nm(e.remove.in))) : s.label;
      const card = ctx.pitch.pitchCard(e.inId, {
        players: data.byId, gw: g, horizon: data.xpGws, second: P2, first: g === P.A,
        onPlayer: () => (pl && ready ? openPlanWhy(P, g, pl) : ctx.openSheet('player', e.inId, { gw: g })),
      });
      card.removeAttribute('data-id');
      card.classList.add('ah-pcard');
      card.dataset.deal = i;
      card.dataset.key = entryKey(g, e);
      card.setAttribute('aria-label', `${said}${pl && ready ? '; shows why' : ''}. ${card.getAttribute('aria-label')}`);
      Object.assign(card.style, px(x, c.y));
      const num = e.remove ? (fk ? COPY.placeKeep : COPY.placeRemove) : pl.refRow ? COPY.planRoll(null) : !ready ? (pl.state === 'failed' ? failedWords(P, pl).head : COPY.pairChecking) : null;
      // its take in words where the + was (owner, 2026-10-23; design_marks/design.md §3): "Swap" (a pair's card swaps
      // all its moves: its note names the others), a take-back its own word ("Remove", "Roll"), the number beside it;
      // handler and fly-in as before (takeFrom)
      // (the Roll of a week of yours, a choice counted against your plan: its word and number, decision K)
      const rollBack = !!pl && !pl.refRow && !pl.choice.moves.length && !Object.keys(pl.choice.chips).length;
      const word = e.remove || pl.refRow ? num : rollBack && ready ? COPY.planRoll(null) : null;
      const swaps = e.remove ? [] : [[nm(d.a), nm(e.inId)], ...e.pair.map((q) => [nm(q.out), nm(q.in)])];
      const go = h('button.ah-pgo', {
        type: 'button', disabled: !ready || frozenAt(P, g),
        dataset: { add: pl ? `plan:${planKey(g, pl)}` : `rm:${e.remove.out}>${e.remove.in}` },
        'aria-label': e.remove ? said : pl.refRow ? COPY.planTake(s.head) : rollBack && ready ? `${COPY.planTake(s.head)}, ${plNumSaid(P, pl)}` : COPY.swapSaid(swaps, ready ? plNumSaid(P, pl) : null),
        onClick: (ev) => takeFrom(ev, P, g, pl, card, d.a, e.inId, e.remove ? () => removeMove(ctx, e.remove) : undefined),
      }, word ?? COPY.placeSwap);
      // white where it beats rolling past the noise (plPays: every such choice of the place, not only the one its plate
      // names; design_marks/design.md §3), ink where it is the week's best (weekBest, as the pitch's plate), dark with
      // an outlined Swap where it doesn't: the zero line seen without moving his card (the best move's is ink beside a
      // chip's ink token too, as its plate: litOf `move`; owner, 2026-10-25)
      const top1 = !!pl && S.M?.lit?.move === pl, pays = !top1 && !!pl && ready && plPays(pl);
      // (its take is the one mark, .m-swap, its look the header's verdict)
      go.classList.add('m-swap', ...(top1 ? ['best'] : pays ? [] : ['quiet']));
      const head = h('div.ah-phead', { class: { best: top1, pays, lo: !top1 && !pays }, dataset: { deal: i }, style: { ...px(x, 0), top: tab() } },
        word && !(rollBack && ready) ? null : h('span.ah-pv.m-num', { 'aria-hidden': 'true', class: { wait: !ready } }, num ?? numParts(g, pl)),
        go);
      // (a card's one line is its header: a take-back alone says what it undoes under it, a single only its own state —
      // "removed by you", "as good in GW10", why it can't be checked — never another move)
      const text = takesBack(e) ? noteOf(P, w, e, d.a)
        : [pl?.removed ? COPY.removedByYou : null, pl?.state === 'failed' ? failedWords(P, pl).note : null].filter(Boolean).join(' · ') || null;
      // one block on top of its card, read down: its header, its note, its line, then his name and fixture (owner,
      // 2026-10-26): the note and the line in his card's own column, flush under its header over his shirt (his card's
      // tile), never in a gap a neighbour's header or card shares (fitBlocks); a failed check's in the warning colour,
      // never a pair's move that needs its other sale (checked: it can't alone)
      const note = text ? h('div.ah-pnote', { class: { warn: pl?.state === 'failed' && !pl.needs },
        style: { left: `${x}px`, top: `${c.y}px`, width: `${c.w}px` } },
        h('span.ah-pnt', { 'aria-hidden': 'true' }, whole(text))) : null;
      // (his flag, "⚠ 75%", is drawn over the band at its top-right as on his tile, never hidden by it; last, so its
      // line can be the band's first: m-ahead.css)
      const flagged = note && card.querySelector('.pm-flag');
      if (flagged) note.append(flagged);
      dealt.push([card, head, note, x]);
    });
    // All N: the Week sheet at its plans, his card focused first (the sheet gives focus back to it)
    const toWeek = (plan = null) => { c.n.focus({ preventScroll: true }); closePlace(false); weekSheet(g, 'plans', plan); };
    // ⋯ N more: his choices on the place's other pages, the next page dealt in his cards (placePages; owner,
    // 2026-10-27); "Other…" under it, the two then taking the slot from its header's top, each a 44 pt target
    const unseen = placeBuys(singles).length - shown.length;
    const both = over && other;
    const tile = tileAt == null ? null : h('div.ah-ptile', { style: { ...px(tileAt, 0), top: both ? tab() : `${c.y}px`, height: both ? `calc(${c.h}px + var(--pm-tab))` : `${c.h}px` } },
      over ? h('button.ah-pmore', { type: 'button', dataset: { key: 'more' }, onClick: () => { S.place.page = pg + 1; drawPlace(true); } }, COPY.placeMore(unseen)) : null,
      other ? h('button.ah-pmore.ah-pother', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.placeOtherSaid(nm(d.a), g), dataset: { key: 'other' },
        onClick: () => { c.n.focus({ preventScroll: true }); closePlace(false); ctx.openSheet('wish', null, { gw: g, pos: P.L.pos(d.a), out: d.a }); } }, COPY.placeOther) : null);
    const i = S.decks.indexOf(d), n = S.decks.length, place = COPY.placeOf(nm(d.a));
    // its buys your saved lineup leaves on your bench, said under its numbers (benchedBuys; owner, 2026-10-22): a sub's
    // "Palmer 0.0" explained, the number as computed
    const benched = [...new Set(entries.flatMap((e) => (e.pl ? benchedBuys(P, g, e.pl) : [])))].map(nm);
    const onBench = benched.length ? COPY.onYourBench(benched) : null;
    const walk = h('div.ah-walk', { class: { top: c.bench }, role: 'group', 'aria-label': `${place}, ${COPY.placeAt(i + 1, n)}${onBench ? `. ${onBench}` : ''}` },
      // (no pager over one place: no "1 of 1", no ‹ ›; owner, 2026-11-03, design_1103b "Place header": Saffer, Birman,
      // Johnson, Podmajersky)
      n > 1 ? h('button', { type: 'button', 'aria-label': 'Previous place', dataset: { key: 'prev' }, onClick: () => stepPlace(-1) }, '‹') : null,
      h('span.ah-wl', { 'aria-hidden': 'true' }, h('span.ah-wl1', null, n > 1 ? `${place} · ${COPY.placeAt(i + 1, n)}` : place),
        h('span.ah-wl2', null, COPY.placeNumbers(plansVs(P, g), P.gws.filter((x) => x >= g))), onBench ? h('span.ah-wl2.ah-wl3', null, onBench) : null),
      n > 1 ? h('button', { type: 'button', 'aria-label': 'Next place', dataset: { key: 'next' }, onClick: () => stepPlace(1) }, '›') : null,
      h('button', { type: 'button', 'aria-haspopup': 'dialog', dataset: { key: 'all' }, onClick: () => toWeek() }, COPY.placeAll(S.M.plans.filter((x) => !x.needs).length)),
      h('button.m-xbtn', { type: 'button', 'aria-label': 'Close', dataset: { key: 'close' }, onClick: () => closePlace() }, '✕'),
      pline ? planLine(P, g, d, pline) : null);
    const layer = h('div.ah-place', { role: 'group', 'aria-label': `${place}, ${COPY.placeAt(i + 1, n)}` },
      // (read in the block's order, a header's Swap, its note's line, then his card: VoiceOver too)
      shade, own, nowHead, dealt.map(([card, head, note]) => [head, note, card]), tile, walk);
    root.append(layer);
    // the dealt cards' fixtures fitted as the pitch's are (a two-line one shortens his tile; fitBlocks measures it);
    // each header's number never cut, as a tab's (fitNum)
    ctx.pitch.fitFixtures(layer);
    // (one look per place: "xP" off every header together, then a smaller number for all, then their spacing;
    // design_marks/design.md §3)
    for (const head of [nowHead, ...dealt.map(([, x]) => x)]) fitNum(head, head.querySelector(HEAD_NUM), HEAD_TRIMS);
    oneLook(dealt.map(([, x]) => x), ['noxp', 'tight', 'snug']);
    // then, still over, the header's whole type smaller (headScale), the dealt ones by one scale
    scaleHeads([nowHead]);
    scaleHeads(dealt.map(([, x]) => x));
    // its one line on one line, its "xP" off first, then a smaller type
    fitLine(layer.querySelector('.ah-pline'));
    // (dropped into the turf under his row: its tile with them)
    const drop = fitBlocks(root, boxes, c, dealt);
    if (drop && tile) tile.style.top = both ? `calc(${c.y + drop}px - var(--pm-tab))` : `${c.y + drop}px`;
    // a sideways swipe only closes it (never a week: the pitch's swipe starts nowhere in it), its click then swallowed
    let from = null;
    layer.addEventListener('pointerdown', (e) => { from = [e.clientX, e.clientY]; });
    layer.addEventListener('pointercancel', () => { from = null; });
    layer.addEventListener('pointerup', (e) => {
      if (!from) return;
      const dx = e.clientX - from[0], dy = e.clientY - from[1];
      from = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) { spend(e); closePlace(); }
    });
    if (again) (layer.querySelector(again) ?? layer.querySelector('.ah-walk button:not(:disabled)'))?.focus({ preventScroll: true });
    if (!deal || !layer.animate) return;
    // the deal: his choices come out from behind him into his row; Reduce Motion: they fade in
    shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    dealt.forEach(([card, head, note, x], k) => {
      const kf = reduceMotion() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: `translateX(${c.x - x}px) scale(.94)`, opacity: 0 }, { transform: 'none', opacity: 1 }];
      const o = { duration: reduceMotion() ? 150 : 180, delay: reduceMotion() ? 0 : k * 18, easing: FLY_EASE, fill: 'backwards' };
      for (const n2 of [card, head, note]) n2?.animate(kf, o);
    });
  }
  /** A place's one line (placeSplit): the plan he is part of as one sentence, its moves in its road's order with its
   *  one number, "Cunha → Palmer, Neto → Tavernier +3.8", a take-back's words after them (lineMoves), on the place's
   *  bar under its title, never on a card. Its words open its Why sheet (openPlanWhy); its take, "Swap both", takes the
   *  plan whole (takeFrom: toast with Undo). Ink where it is the week's best. */
  function planLine(P, g, d, e) { const { S, frozenAt, numParts, openPlanWhy, plNumSaid, planKey, planSaid, takeFrom } = V;
    const pl = e.pl, nm = P.L.name, ready = pl.state === 'ready', s = planSaid(P, g, pl), ms = lineMoves(P, e);
    const swaps = e.adds.map((m) => [nm(m.out), nm(m.in)]);
    const why = () => openPlanWhy(P, g, pl);
    return h('div.ah-pline', { class: { best: S.M?.lit?.move === pl }, dataset: { plan: planKey(g, pl) } },
      h('button.ah-plw', { type: 'button', 'aria-haspopup': 'dialog', disabled: !ready, dataset: { key: `line:${planKey(g, pl)}` }, 'aria-label': `${s.label}; shows why`, onClick: why },
        // (each move unbroken, the line wrapping only between them)
        ms.map((x, i) => [h('span.ah-tmv', null, x, i < ms.length - 1 ? ',' : null), ' ']), ms.back ? [h('span.ah-tmv', null, ms.back), ' '] : null,
        h('span.ah-tmv.m-num', { class: { wait: !ready } }, ready ? numParts(g, pl) : pl.state === 'failed' ? COPY.placeCantCheck : COPY.pairChecking),
        // (its take gives way for room, fitLine: the words then open the sheet that takes it)
        h('span.ah-plm', { 'aria-hidden': 'true' }, ' ›')),
      h('button.ah-plgo.m-swap', { type: 'button', class: { best: S.M?.lit?.move === pl }, disabled: !ready || frozenAt(P, g), dataset: { add: `plan:${planKey(g, pl)}` },
        'aria-label': swaps.length ? COPY.swapSaid(swaps, ready ? plNumSaid(P, pl) : null) : `${COPY.planTake(s.head)}${ready ? `, ${plNumSaid(P, pl)}` : ''}`,
        onClick: (ev) => takeFrom(ev, P, g, pl, ev.currentTarget, d.a, e.inId) }, swaps.length ? COPY.swapGo(swaps.length) : COPY.planRoll(null)));
  }
  function fitLine(line) { const { LINE_LEAST } = V;
    const w = line?.querySelector('.ah-plw');
    if (!w) return;
    const over = () => w.scrollWidth > w.clientWidth + 0.5;
    const smaller = () => { for (let k = 1; over() && k > LINE_LEAST; ) { k = Math.max(LINE_LEAST, k - 0.03); line.style.setProperty('--pl-k', k.toFixed(3)); } };
    if (!over()) return;
    line.classList.add('noxp');
    smaller();
    if (!over()) return;
    line.classList.add('nogo');
    line.style.removeProperty('--pl-k');
    smaller();
    if (over()) line.classList.add('wrap');
  }
  /** Headers `heads` of a place, each still over its card after fitNum (its number or take's word cut), at one scale of
   *  their type (headScale: --ph-k), the least they need, never one under HEAD_LEAST in its smallest type (its number
   *  at .tight's .85em, the take's word at its .56 of the tab); one still over there is left at its least. */
  function scaleHeads(heads) {
    const px = (e, k) => parseFloat(getComputedStyle(e)[k]) || 0;
    // (the smallest type drawn in it, at --ph-k 1: every part scales with it)
    const type = (x) => Math.min(px(x, 'fontSize'), ...[...x.querySelectorAll('.ah-pv, .ah-pgo')].map((e) => px(e, 'fontSize')));
    const over = () => heads.some((x) => [x, x.querySelector(HEAD_NUM)].some((e) => !!e && e.scrollWidth > e.clientWidth + 0.5));
    for (const x of heads) x.style.removeProperty('--ph-k');
    if (!heads.length || !over()) return;
    // each header's type (its children's widths less padding) against its room (its width less padding and gaps)
    const k = Math.min(...heads.map((x) => {
      const kids = [...x.children], pad = (e) => px(e, 'paddingLeft') + px(e, 'paddingRight');
      // (a "checking…" needs none: it gives way, HEAD_NUM)
      const need = kids.length ? kids.reduce((a, e) => a + (e.matches('.ah-pv.wait') ? 0 : e.scrollWidth - pad(e)), 0) : x.scrollWidth - pad(x);
      const room = x.clientWidth - pad(x) - px(x, 'columnGap') * Math.max(0, kids.length - 1) - kids.reduce((a, e) => a + pad(e), 0);
      return headScale(need, room, type(x));
    }));
    // (for its marks' margins and the rounding: a step smaller while one is still over, down to its least)
    const least = Math.min(1, Math.max(...heads.map((x) => HEAD_LEAST / type(x))));
    for (let j = Math.max(k, least); ; j = Math.max(least, j - 0.04)) {
      for (const x of heads) x.style.setProperty('--ph-k', j.toFixed(3));
      if (!over() || j <= least) return;
    }
  }
  /** A place's blocks (drawPlace) each in its card's column, its note and line flush under its header over his shirt
   *  (his card's tile, its height `room`: from his card's top to his name plate), never over his name or fixture nor
   *  outside the column. Measured as drawn, one look per place: taller than his tile, its block (header with it) goes
   *  up into the free turf over its row (to the plates of the row over it, 2 px clear), then the dealt cards, all of
   *  them (one row), down into the turf under it (to the plates of the row under it, 2 px clear); still over, or a word
   *  wider than its card (a name never breaks: owner, 2026-10-22), the notes' type a step smaller (--pn-k, to
   *  HEAD_LEAST as its headers': one floor per place), then the blocks up past the turf (data-rise "over", for QA); a
   *  word still wider, the note that wide, centred on it. Each line's target then up to 44 px where its band allows
   *  (design.md §6), never over its note's words or his flag nor onto his name plate. → the dealt cards' drop, px */
  function fitBlocks(root, boxes, c, dealt) {
    const blocks = dealt.filter(([, , note]) => note);
    if (!blocks.length) return 0;
    const W = root.clientWidth, tab = blocks[0][1].offsetHeight;
    const room = (card) => (card.querySelector('.pm-plate')?.getBoundingClientRect().top ?? 0) - card.getBoundingClientRect().top;
    const rooms = blocks.map(([card]) => Math.max(0, room(card)));
    // (its words and line; his flag is his tile's: drawPlace)
    const words = (note) => [note, ...note.querySelectorAll(':scope > :not(.pm-flag)')];
    const wide = (note) => words(note).some((e) => e.scrollWidth > e.clientWidth + 0.5);
    const need = () => Math.max(...blocks.map(([, , note], i) => note.scrollHeight - rooms[i]));
    for (const [, , note] of blocks) note.style.removeProperty('--pn-k');
    for (const [i, [, , note]] of blocks.entries()) note.style.minHeight = `${rooms[i]}px`;
    // (turf over his row to the row over it's plates; under it, over the row under it's shirts to its plates, never
    // covering the shaded row's names and points: the keeper's to the pitch's top, the bench's to its foot)
    const top = root.getBoundingClientRect().top, plateY = (q) => (q.n.querySelector('.pm-plate')?.getBoundingClientRect().top ?? top + q.y) - top;
    const above = boxes.filter((q) => q.y + q.h <= c.y - 1).reduce((m, q) => Math.max(m, q.y + q.h), 0);
    // (a field place's bar at the pitch's foot, over the bench)
    const rb = (e) => e.getBoundingClientRect().top - top;
    const below = [...boxes.filter((q) => q.y >= c.y + c.h + 1).map(plateY), ...(c.bench ? [] : [...root.querySelectorAll('.ah-place .ah-walk')]).map(rb).filter((y) => y >= c.y + c.h + 1)]
      .reduce((m, y) => Math.min(m, y), root.clientHeight);
    const up = Math.max(0, c.y - tab - above - 2), down = Math.max(0, below - c.y - c.h - 2);
    const least = Math.min(1, HEAD_LEAST / parseFloat(getComputedStyle(blocks[0][2]).fontSize));
    for (let k = 1; (need() > up + down + 0.5 || blocks.some(([, , note]) => wide(note))) && k > least; ) {
      k = Math.max(least, k - 0.04);
      for (const [, , note] of blocks) note.style.setProperty('--pn-k', k.toFixed(3));
    }
    // (each block as tall as its own words: the least it covers; the cards one row, dropped as the tallest needs)
    const ns = blocks.map(([, , note], i) => Math.max(0, Math.ceil(note.scrollHeight - rooms[i])));
    const n = Math.max(...ns), drop = Math.min(down, Math.max(0, n - up));
    if (drop) {
      for (const [card, head] of dealt) {
        card.style.top = `${c.y + drop}px`;
        head.style.top = `${c.y + drop - tab}px`;
      }
    }
    for (const [i, [, head, note]] of blocks.entries()) {
      note.style.top = `${c.y + drop - ns[i]}px`;
      note.style.minHeight = `${rooms[i] + ns[i]}px`;
      head.style.top = `${c.y + drop - ns[i] - tab}px`;
    }
    if (n > up + down + 0.5) root.querySelector(':scope > .ah-place').dataset.rise = 'over';
    for (const [, , note, x] of blocks) {
      if (!wide(note)) continue;
      const w = Math.min(W - 6, Math.max(...words(note).map((e) => e.scrollWidth)) + 2);
      note.style.width = `${w}px`;
      note.style.left = `${Math.min(W - 3 - w, Math.max(3, x + (c.w - w) / 2))}px`;
    }
    // (its line's target, m-ahead.css .ah-por::before: the free band over it up to its note's words or his flag, under
    // it down to his name plate's top; 44 px where they allow)
    for (const [, , note] of blocks) {
      const line = note.querySelector(':scope > .ah-por');
      if (!line) continue;
      const r = line.getBoundingClientRect(), nb = note.getBoundingClientRect();
      const roof = Math.max(nb.top, ...[...note.children].filter((e) => e !== line).map((e) => e.getBoundingClientRect().bottom));
      const want = Math.max(0, 44 - r.height), under = Math.max(0, Math.min(nb.bottom - r.bottom, want / 2)), over = Math.max(0, Math.min(r.top - roof, want - under));
      line.style.setProperty('--por-t', `${over}px`);
      line.style.setProperty('--por-b', `${Math.max(0, Math.min(nb.bottom - r.bottom, want - over))}px`);
    }
    return drop;
  }
  /** ‹ › in a place's bar: the place before or after it in their order (yours first, then best first), dealt out. */
  function stepPlace(dir) { const { S, openPlace, pitchHost } = V;
    const D = S.decks ?? [], i = D.findIndex((x) => x.a === S.place?.a);
    if (i < 0 || D.length < 2) return;
    // a keyboard or VoiceOver walking the places stays on the bar's ‹ / ›
    const bar = document.activeElement?.closest?.('.ah-walk') ? document.activeElement.dataset.key : null;
    openPlace(D[(i + dir + D.length) % D.length].a);
    if (bar) pitchHost.querySelector(`:scope > .pm > .ah-place .ah-walk [data-key="${bar}"]`)?.focus({ preventScroll: true });
  }
  /** A tap on an open place's shade: on another place's edges or tab (its card's gap over him), that place in one tap;
   *  elsewhere, closes it. */
  function shadeTap(e, boxes) { const { S, closePlace, openPlace, pitchHost } = V;
    const b = pitchHost.querySelector(':scope > .pm')?.getBoundingClientRect();
    const x = e.clientX - (b?.left ?? 0), y = e.clientY - (b?.top ?? 0);
    // (never a row-mate stepped out for the dealt cards: he isn't there to tap)
    const to = (S.decks ?? []).find((d) => {
      const q = d.a !== S.place?.a && boxes.find((c) => c.id === d.a);
      return q && !q.n.classList.contains('ah-stepout') && x >= q.x - 4 && x <= q.x + q.w + 4 && y >= q.y - 44 && y <= q.y + 16;
    });
    if (to) openPlace(to.a);
    else closePlace();
  }
  /**
   * The Week sheet (the week line's tap, a place's "All N" and "⋯ N more" at its plans, openRules, a carried plan's
   * Review: at Your rules): the viewed GW's notices, each with its own control (clashRow: Remove; a new forecast's
   * line), GW A under way its whole sentence, GW A's price watch with Hide (watchView); your transfers, one row each
   * (xferRow), or a Wildcard or Free Hit week's note over its changes (changeRow); every choice (planRow) under what
   * they count against; then Your rules (renderRules). Drawn by render while open (drawWeek), so it follows the plan
   * as it lands. A + taken here closes it: its change lands on the pitch.
   */
  function weekSheet(g, at = null, plan = null) { const { S, ctx, drawWeek, uncovered, weekModel } = V;
    const P = S.drawn, w = P && weekOf(P, g);
    if (!w) return;
    // (its rows solved while it is open: plans rowsWanted)
    if (S.week && S.week.g !== g) rowsWanted(S.week.g, false);
    rowsWanted(g, true);
    if (!S.week) {
      const title = COPY.weekTitle(g);
      ctx.sheets.open({
        title, label: title, detent: 'medium', cls: 'ah-wsheet',
        build(body, sheet) {
          S.week = { sheet, g, host: h('section.ah-block.ah-wk', { 'aria-label': title }), title: body.querySelector('.m-sh h2') };
          body.append(S.week.host);
          uncovered.observe(sheet.el, { attributes: true, attributeFilter: ['inert'] });
        },
        onClose: () => { presolveTaps(ctx, null, { owner: S.week?.sheet }); if (S.week) rowsWanted(S.week.g, false); S.week = null; },
      });
    }
    drawWeek(P, w, weekModel(P, w));
    // (`plan`: a row's key; a place's "⋯ N more" opens at the first of his choices it had no room for)
    const to = (plan && S.week.host.querySelector(`[data-plan="${CSS.escape(plan)}"]`)) || (at && S.week.host.querySelector(`[data-at="${at}"]`));
    if (to) { S.week.sheet.setDetent('large'); to.scrollIntoView({ block: 'start' }); }
  }
  return { drawPlace, planLine, fitLine, scaleHeads, fitBlocks, stepPlace, shadeTap, weekSheet };
}
