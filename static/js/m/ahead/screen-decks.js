// screen.js mount: the plates, the corner tokens and a take's landing

import { MINUS, WHY_SHEET, pairedMoves, weekOf } from './core.js';
import { h, svg, fill, append, plural, reduceMotion, toast, xpGain, shownGain } from '../../ui.js';
import { SQUAD_CHIPS, askPlace, failedWords, lineMoves, litShown, multiMove, placeFirst, placeOrder, planBack, planWeeks, rollOnly, takesBack } from './plans.js';
import { COPY, shownDelta } from '../calls.js';
import { plPays } from './pieces.js';
import * as E from '../../plan/engine.js';
import { addPlan, planTake, rootRoad } from './presolve.js';
import { keep, pinOf, removeRule, veto } from './edits.js';
import { EDGE_MIN, NAME_LEAST, PLATE_MIN, PLATE_TRIMS, ST_TRIMS, boxesMeet, cssPx, fitNum, oneLook, reachOf } from './screen.js';

/** The lock's glyph, shut or open (cardMarks). */
const lockGlyph = (shut) => svg('svg', { viewBox: '0 0 12 14', 'aria-hidden': 'true' },
  svg('path', { d: shut ? 'M3.5 6V4.2a2.5 2.5 0 0 1 5 0V6' : 'M3.5 6V4.2a2.5 2.5 0 0 1 4.9-.7', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }),
  svg('rect', { x: 1.5, y: 6, width: 9, height: 7, rx: 1.5, fill: 'currentColor' }));

// (the ×, drawn as two 1.6 px strokes, the lock's weight, not a 13 px bold type ×)
const crossGlyph = () => svg('svg', { viewBox: '0 0 10 10', 'aria-hidden': 'true' },
  svg('path', { d: 'M2 2l6 6M8 2l-6 6', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }));

export function decksPart(V) {
  function renderDecks() { const { S, boxOf, cardBoxes, ctx, decks, drawPlace, fitPitch, frozenAt, gwNow, labelWalls, pitchHost, placePills, plansHeading, reachLabels, rsBtn, sideRoom, tapIn, topRow } = V;
    const root = pitchHost.querySelector(':scope > .pm');
    const P = S.drawn, w = P && weekOf(P, gwNow(P)), M = S.M;
    // the band over the pitch for the week's best (inBand) while its week can change: the pitch fitted under it
    const band = !!root && !!w && !!M && !frozenAt(P, w.gw) && decks.isConnected;
    if (pitchHost.classList.contains('band') !== band) { pitchHost.classList.toggle('band', band); fitPitch(); }
    if (!band) {
      // (a plan you can't change: its status is on the bar, statusLine)
      decks.removeAttribute('aria-label');
      fill(decks);
      S.decks = []; closePlace(false); if (root) { placePills(root.getBoundingClientRect(), cardBoxes(root)); reachLabels(root); } return;
    }
    const g = w.gw;
    const { decks: D, toks, lit } = M;
    S.decks = Object.assign(D, { gw: g });  // the week they are drawn for (deckOf)
    // the draw that names the week's choices (none named on the draw before, its checks just in: litOf), also when its
    // checks were asked again, or a re-flow (addOnce): shown with a landing's fade. The same checks drawn on a plan
    // view made anew are the same week (weekKey)
    const n = lit.size + (lit.chip ? 1 : 0);
    const was = S.litAt?.key === M.key ? S.litAt : null;
    S.litAt = { key: M.key, lit: n };
    const lights = n > 0 && !!was && !was.lit;
    if (lights) S.addAt = S.flowAt = Date.now();
    // a hidden heading names it for VoiceOver, only while it holds a choice
    const b = root.getBoundingClientRect(), W = root.clientWidth;
    const boxes = cardBoxes(root);
    // (the best move's places in its plate's top-most row, for its token: tokensOf)
    const lead = topRow(D.filter((d) => lit.get(d.a)?.best).map((d) => ({ d, c: boxes.find((x) => x.id === d.a), L: lit.get(d.a) })).filter((x) => x.c))[0];
    const name = plansHeading(P, g), tk = tokensOf(P, w, toks, lit, lead, M), any = D.length || tk.length;
    if (any) decks.setAttribute('aria-label', name);
    else decks.removeAttribute('aria-label');
    fill(decks, any ? h('h3.sr-only', null, name) : null, tk);
    const meetsCard = (el, down = 0, side = 0) => { const q = boxOf(el, b); return boxes.some((c) => boxesMeet(c, { ...q, w: q.w + side }, down)); };
    // each whole in its room beside the goal, a name never broken mid-word (owner, 2026-10-22): its "xP", then a
    // smaller number give its words room, as a plate's number (fitNum); then it is as much wider as they still want,
    // measured as drawn (scaleHeads), while it and its side target (6 px: m-ahead.css .ah-tok::before) clear the cards;
    // else it is the Week sheet's. Its name too (shortened like the plates', never a chip's: owner, 2026-10-25): the
    // words' line (.ah-tbody's first span) whole, a status's words and body too
    const wordsOf = (t) => [...t.querySelectorAll('.ah-tw, .ah-tbody > span:first-child, :scope > .ah-tl, .ah-tbody, .ah-tn')];
    // (a status's number wraps under its words where it lacks room: "2 transfers −4 −3.3 xP" over "Set in FPL: 2
    // changes" is two lines, not three, where a trim gives it room; owner, 2026-10-28)
    const wrapOf = (t) => {
      const words = t.querySelector(':scope > .ah-tl'), num = t.querySelector(':scope > .ah-tnum');
      return words && num && num.offsetTop >= words.offsetTop + words.offsetHeight - 1 ? num.offsetWidth + (parseFloat(getComputedStyle(t).columnGap) || 0) : 0;
    };
    const overOf = (t, tw = wordsOf(t)) => () => tw.some((x) => x.scrollWidth > x.clientWidth + 0.5) || wrapOf(t) > 0;
    // (a status's own spacing first, m-ahead.css .ah-tok.st.snug: no word or number changes)
    const trimsOf = (t) => (t.matches('.st') ? ST_TRIMS : undefined);
    const fits = (t) => {
      const tw = wordsOf(t);
      if (fitNum(t, overOf(t, tw), trimsOf(t))) return true;
      t.style.maxWidth = `${t.offsetWidth + Math.ceil(Math.max(wrapOf(t), ...tw.map((x) => x.scrollWidth - x.clientWidth)))}px`;
      if (fitNum(t, overOf(t, tw), trimsOf(t)) && !meetsCard(t, 9, 6)) return true;
      // the best move's token (.mv): its name shortened as the plates' are (m-ahead.css .ah-tok.mv.cut), never its
      // number, in the room it has (its CSS max-width), each name NAME_LEAST at least, before anything else in the
      // stack gives way (owner, 2026-10-26); else it gives way as the others
      if (!t.matches('.mv')) return false;
      t.style.removeProperty('max-width');
      const least = NAME_LEAST * parseFloat(getComputedStyle(t).fontSize), ns = [...t.querySelectorAll('.ah-tn')];
      // (its take's word first, its name shortened for it; where that leaves the name under NAME_LEAST, the word off
      // and the name whole again)
      const fitsWith = (steps) => (t.classList.remove('gol', 'nogo'), fitNum(t, tw.filter((x) => !x.matches('.ah-tn')), steps) && ns.every((x) => x.scrollWidth <= x.clientWidth + 0.5 || x.clientWidth >= least) && !meetsCard(t, 9, 6));
      // (one move "Mbeumo → Rice" only whole, on one line with its number and word, nothing shortened; else his buy
      // alone, "Rice", as before: review 7, 2026-11-02, the move's sale where it has room)
      const one = t.dataset.buy && ns.length === 1 ? ns[0] : null;
      if (one) { if (fitsWith(['noxp', 'nomark', 'tight'])) return true; if (!t.matches('.tix')) one.textContent = t.dataset.buy; }
      // (its verb is kept at 320 too, the screen's one primary act: where the name would go under NAME_LEAST beside it,
      // "Swap" takes a line of its own under the name and number (.gol), off only where even that leaves no room)
      // (a plan's, two names or more, always one line: its word goes before a second line; where even names cut to
      // NAME_LEAST have no room, "2 transfers" replaces them; owner, 2026-10-30)
      if (fitsWith(['noxp', 'nomark', 'tight', 'cut']) || (ns.length < 2 && fitsWith(['noxp', 'nomark', 'tight', 'gol', 'cut'])) || fitsWith(['noxp', 'nomark', 'tight', 'nogo', 'cut'])) return true;
      if (ns.length < 2) return false;
      const tl = t.querySelector(':scope > .ah-tl'), was = [...tl.childNodes];
      fill(tl, h('span.ah-tn', null, plural(ns.length, 'transfer')));
      ns.splice(0, ns.length, ...tl.querySelectorAll('.ah-tn'));
      if (fitsWith(['noxp', 'nomark', 'tight', 'cut']) || fitsWith(['noxp', 'nomark', 'tight', 'nogo', 'cut'])) return true;
      fill(tl, ...was);
      return false;
    };
    // the week's own choices stacked beside the goal, each under the one before, only while they and their targets (9
    // px under each: m-ahead.css .ah-tok) clear the cards (a short pitch, three of them: the rest are the Week
    // sheet's); the status never gives way (statusTok): the best move's token shortens first (fits), then the tokens
    // under the status, then the best's over it; the status then leads the stack, kept whether or not it clears the
    // cards
    const st = tk.find((t) => t.matches('.st'));
    // (the Reset sits under the last token: resetSlot, placePills)
    rsBtn.hidden = !S.reset;
    // (the best move's token, or "Rolling is best", in the band over the pitch, the whole width: m-ahead.css .band;
    // owner, 2026-11-02, "Full-width strip" picked: the move whole on one line, each name its ✕, never given way)
    const inBand = (t) => t.matches('.mv, .st.best');
    const stack = () => { let top = 6; for (const t of tk) if (t.isConnected && !inBand(t)) { t.style.top = `${top}px`; top += t.offsetHeight + 8; } };
    // (an empty band its own height again: the Reset there, placePills)
    if (!tk.some(inBand) && pitchHost.style.getPropertyValue('--ah-band')) { pitchHost.style.removeProperty('--ah-band'); fitPitch(); return renderDecks(); }
    let top = 6;
    for (const t of tk) {
      // (its height the band's, two lines for a plan's moves: the pitch fitted under it again where that changed; its
      // names shortened by its CSS alone, the sellers' first, the corner's trims never: the whole width is its room)
      if (inBand(t)) {
        // (a name cut: its scope off first, then "Close call" (the outlined Swap still says it), never a name: design_1103b.
        // His name read off a Range: scrollWidth never sees the first 28 px, .x's ✕ padding)
        const nameCut = (x) => { const r = document.createRange(); r.selectNode(x.firstChild); return r.getBoundingClientRect().width > x.clientWidth - parseFloat(getComputedStyle(x).paddingRight) + 0.5; };
        const cut = () => [...t.querySelectorAll('.ah-tn > .x')].some(nameCut);
        for (const sel of ['.ah-tgw', '.ah-tclose']) { const x = t.querySelector(sel); if (x && cut()) x.hidden = true; }
        const bh = `${t.offsetHeight + 8}px`;
        // (drawn again on the pitch as fitted: every box here was measured on the pitch before)
        if (pitchHost.style.getPropertyValue('--ah-band') !== bh) { pitchHost.style.setProperty('--ah-band', bh); fitPitch(); return renderDecks(); }
        continue;
      }
      t.style.top = `${top}px`;
      // (a status that can't fit wider stays in its own room, trimmed as there, words wrapping, never over the keeper's
      // card; trims kept only where they fit, so its "xP" never goes for nothing: oneLook)
      if (fits(t)) top += t.offsetHeight + 8;
      else if (t === st) { t.style.removeProperty('max-width'); if (!fitNum(t, overOf(t), ST_TRIMS)) t.classList.remove(...ST_TRIMS); top += t.offsetHeight + 8; }
      else t.remove();
    }
    for (;;) {
      const tkIn = tk.filter((t) => t.isConnected), cut = tkIn.findIndex((t) => meetsCard(t, 9));
      if (cut < 0) break;
      const gone = tkIn.slice(cut).filter((t) => t !== st && !inBand(t));
      if (gone.length) for (const t of gone) t.remove();
      else if (tkIn[0] !== st) tkIn[0].remove();
      // (then the status's lineup notice under it goes, to the Week sheet's row: at a large text size it would cover
      // the defenders' cards)
      else if (st.querySelector(':scope > .ah-tw:not([hidden])')) st.querySelector(':scope > .ah-tw').hidden = true;
      else break;
      stack();
    }
    // the best move's token's ✕ on its right (no row, no width of its own; owner, 2026-11-02: "must have fast button
    // 'not hill'"): its buy refused in this week alone (veto, scope 'gw'), the refusal solved ahead (refusalRoads) so the
    // next best is there at once. On a ticket, a mark after each name (owner, 2026-11-02, "Full-width strip" picked):
    // the buy's ✕ refuses him, the seller's lock keeps him, his card lock's act and glyph (lockTap: the next best at
    // once, refusalRoads' Keep; owner, 2026-11-03, design_1103b "One meaning for ×")
    const bestTok = tk.find((t) => t.isConnected && t.matches('.mv') && t.dataset.notIn);
    // (the band's sellers' cards in its ink, so the move reads on the pitch where he stands; owner, 2026-11-02,
    // "highlight in same black style or similiar player it suggesting to sell")
    const sold = new Set(bestTok ? [...bestTok.querySelectorAll('.ah-tn > .o')].map((x) => Number(x.dataset.id)) : []);
    for (const c of root.querySelectorAll('.pm-card[data-id]')) c.classList.toggle('ah-sold', sold.has(Number(c.dataset.id)));
    if (bestTok) {
      const q = boxOf(bestTok, b), m = { gw: g, out: Number(bestTok.dataset.notOut), in: Number(bestTok.dataset.notIn) }, tix = bestTok.matches('.tix');
      // (each ✕ at the end of its name's room, .x, every name of a plan's too, each solved ahead (refusalRoads `also`):
      // a buy's refuses him, a seller's keeps him; owner, 2026-11-02, "why only 1 out of four players have cross sign")
      const after = (el) => { const r = boxOf(el, b); return { left: `${r.x + r.w - 25}px`, top: `${r.y + r.h / 2 - 12}px` }; };
      // (each name a door to his card, as his card on the pitch is (tapIn), from just before his letters to his mark, so
      // "Rice" is no 27 px target: the ticket's height for one move, his row's for a plan's; the rest of the ticket his
      // place, as before: owner, 2026-11-04, "make players clickable in tickets so they can be opened")
      const door = (el) => { const r = boxOf(el, b), y = bestTok.matches('.multi') ? r : q; return { left: `${r.x - 6}px`, top: `${y.y}px`, width: `${r.w - 22}px`, height: `${y.h}px` }; };
      const xs = tix ? [...bestTok.querySelectorAll('.ah-tn > .x')] : [];
      if (!xs.length) decks.append(h('button.ah-cm.out.tno', { type: 'button', 'aria-label': COPY.notBuySaid(P.L.name(m.in), g), dataset: { row: `tok:not:${g}` },
        class: { in: true }, style: { left: `${q.x + q.w - 28}px`, top: `${q.y + q.h / 2 - 12}px` }, onClick: () => veto(ctx, m, { scope: 'gw' }) }, crossGlyph()));
      for (const x of xs) {
        const id = Number(x.dataset.id), nm = P.L.name(id);
        decks.append(h('button.ah-tcard', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.cardOf(nm), dataset: { row: `tok:card:${g}:${id}` }, style: door(x), onClick: () => tapIn(g, id) }));
        if (x.matches('.i')) {
          const mi = { gw: g, out: Number(x.parentElement.querySelector('.o').dataset.id), in: id };
          decks.append(h('button.ah-cm.out.tno.in.tx', { type: 'button', 'aria-label': COPY.notBuySaid(nm, g), dataset: { row: `tok:not:${g}:${id}` }, style: after(x), onClick: () => veto(ctx, mi, { scope: 'gw' }) }, crossGlyph()));
        } else {
          const pk = pinOf(P, 'keep', id, g);
          decks.append(h('button.ah-cm.tlk.tx', { type: 'button', class: { on: !!pk }, 'aria-pressed': String(!!pk), 'aria-label': pk ? COPY.cardLockSaid(nm, g, true) : COPY.placeKeepSaid(nm, g), dataset: { row: `tok:keep:${g}:${id}` },
            style: after(x), onClick: () => lockTap(P, g, id) }, lockGlyph(!!pk)));
        }
      }
    }
    // (the best move's token gave way for room, its plate stays on the pitch: flag for the QA)
    decks.toggleAttribute('data-mv-out', tk.some((t) => t.matches('.mv') && !t.isConnected));
    // (and the plan keys of choices whose tokens gave way, for the QA: e.g. the Roll that takes your Free Hit off at
    // 320 × 568 is the Week sheet's row then)
    const gone = tk.filter((t) => !t.isConnected && t.dataset.plan).map((t) => t.dataset.plan).join(' ');
    if (gone) decks.dataset.tokOut = gone;
    else delete decks.dataset.tokOut;
    // the Reset at its slot under the last token, before the choices reach up to it (placePills)
    placePills(b, boxes);
    const walls = [...boxes, ...labelWalls(root, b), ...[...root.querySelectorAll(':scope > .ah-pp:not([hidden]), .ah-tok')].map((x) => boxOf(x, b))];
    // a plate's height (m-ahead.css --pm-tab: the text size's), in whole px
    const tabH = Math.round(cssPx(decks, 'var(--pm-tab)')[0]);
    // each place's plate: the best's (`best`) or a quiet one (`alt`: litOf's, else his place's first choice,
    // placeFirst), by the free turf over him (`up`: reachOf; a sub's from his own card, under his label: labelWalls);
    // its number alone where the turf holds less than a plate at its least (PLATE_MIN: `only`), none under EDGE_MIN
    const marks = [];
    // a multi-move best is ONE mark, its sentence (a chess engine's best line): one ink plate as wide as its words,
    // centred over its top-most sellers' row, "Cunha → Palmer, Neto → Tavernier +3.8"; its other sellers' places each
    // have a plate of their own single moves; never a tag, ring or "& 1 more" (in his own buy's place, a choice in
    // place of that buy is a single: "Evanilson +0.8" on Thiago; owner, 2026-10-27)
    const lineBest = !!lead?.length && multiMove(lead[0].L.e, lead[0].d.a);
    const litAt = (a) => (lineBest && lit.get(a)?.best && !lead.some((x) => x.d.a === a) ? null : lit.get(a));
    // (a buy the sentence names is no other plate's: one name, one number)
    const lineBuys = new Set(lineBest ? lead[0].L.e.adds.map((m) => Number(m.in)) : []);
    const firstOf = (d) => placeFirst(lineBuys.size ? { ...d, entries: d.entries.filter((e) => !lineBuys.has(e.inId) || takesBack(e)) } : d);
    for (const d of D) {
      const c = boxes.find((x) => x.id === d.a), first = litAt(d.a) ? null : firstOf(d), L = litAt(d.a) ?? (first && { e: first, best: false, first: true });
      if (!c || !L) continue;
      const up = c.y - reachOf(c, walls);
      if (up < EDGE_MIN) continue;
      // (a Remove of yours: its name alone, never its number alone; renderDecks' steps leave it named: .bare)
      marks.push({ d, c, L, up, kind: L.best ? 'best' : 'alt', best: !!L.best, only: up < PLATE_MIN && !!L.e.pl });
    }
    // (no ring: the ink plate says it is the best)
    // a plan's plate over its sellers in the top-most of their rows (one there: over him; more: spanning them, its
    // middle over the span), its other sellers each a tag of his buy (DECISION.md), no line to the plate (owner,
    // 2026-10-25); its buys in their sellers' order
    // (no choice's plate on the pitch: the band holds the week's suggestion, a card's × his place's choices, the Week
    // sheet every row; owner, 2026-11-02, "stop dublicating black and other pills on pich", "why it still shows
    // evanilson +0.6")
    marks.length = 0;
    const [row0, bests] = topRow(marks.filter((x) => x.kind === 'best')), tags = bests.filter((x) => !row0.includes(x));
    const span = !row0.length ? null : lineBest ? { x: 3, y: row0[0].c.y, w: W - 6, h: row0[0].c.h, bench: row0[0].c.bench }
      : (() => { const l = row0[0].c, r = row0.at(-1).c; return { x: l.x, y: l.y, w: r.x + r.w - l.x, h: l.h, bench: l.bench }; })();
    // (a row-mate under the span keeps no mark: his place is his card's, the Week sheet's and ‹ ›'s)
    // (a sentence's plate takes only the turf its words need; a row-mate's plate goes only where they meet, below)
    const under = (x) => !lineBest && span && !x.best && Math.abs(x.c.y - span.y) < 2 && x.c.x >= span.x && x.c.x + x.c.w <= span.x + span.w;
    // (one buy, one plate: of two places offering the same buy, "Truffert +1.3" and "Truffert +1.0", the better keeps
    // it, the other's is in his place)
    const plateGain = (x) => (x.L.e.pl?.state === 'ready' ? x.L.e.pl.cmp.delta : -Infinity);
    const byBuy = new Map();
    for (const x of marks) if (!x.best && x.L.e.pl && !takesBack(x.L.e) && (!byBuy.has(x.L.e.inId) || plateGain(x) > plateGain(byBuy.get(x.L.e.inId)))) byBuy.set(x.L.e.inId, x);
    const bestIns = new Set(marks.filter((x) => x.best).map((x) => x.L.e.inId));
    const twice = (x) => !x.best && !!x.L.e.pl && !takesBack(x.L.e) && (bestIns.has(x.L.e.inId) || lineBuys.has(x.L.e.inId) || byBuy.get(x.L.e.inId) !== x);
    marks.splice(0, marks.length, ...marks.filter((x) => !under(x) && !twice(x)));
    // (the places drawn, for sheetFollows)
    D.drawn = new Set(marks.map((x) => x.d.a));
    const plates = marks.filter((x) => x.kind === 'alt' || (x.kind === 'best' && tags.includes(x)));
    // its neighbours' room by whether each holds a plate (sideRoom)
    const held = new Set(marks.map((x) => x.c));
    const drawn = [];
    // (its row's buys named, the others "& 2 more": owner, 2026-10-25)
    // (every move of the plan counted, a seller drawn as no plate too: one with no room is still one of its moves)
    const rest = span ? row0[0].L.e.adds.filter((m) => !row0.some((x) => x.L.e.inId === Number(m.in))) : [];
    // (a sentence's plate, `line`, is no part of the fit steps: its words are never shortened or dropped; it is sized
    // after them, below)
    let spEl = null;
    if (span) (lineBest ? (x) => { spEl = x.el; append(decks, x.el); } : (x) => drawn.push(x))({ el: swapPlate(P, g, row0[0].d, row0[0].L, span, Math.min(...row0.map((x) => x.up)), tabH, { buys: [...row0.map((x) => x.L.e.inId), ...rest.map((m) => Number(m.in))], shown: row0.map((x) => x.L.e.inId), sellers: [...row0.map((x) => x.d.a), ...rest.map((m) => Number(m.out))], only: row0.some((x) => x.only), ...(lineBest ? { line: lineMoves(P, row0[0].L.e) } : {}) }), c: span, m: row0[0] });
    for (const m of plates) drawn.push({ el: swapPlate(P, g, m.d, m.L, m.c, m.up, tabH, { ...(m.best ? { tag: bests.find((x) => !tags.includes(x)).d.a } : {}), only: m.only }), c: m.c, m });
    for (const p of drawn) append(decks, p.el);
    // each card's plate (a plan's span: every seller's), and how far a plate takes the gap past its card, centred (as
    // wide as its words at the step tried)
    const plateOf = new Map(drawn.flatMap((p) => (p.c === span ? row0.map((x) => [x.c, p]) : [[p.c, p]])));
    const over = (p) => (p ? Math.max(0, (p.el.getBoundingClientRect().width - p.c.w) / 2) : 0);
    // (a freed plate's mate with a plate: as far as that plate may reach toward it, its room that side, never only its
    // centred half)
    const reach = (q, p) => { const x = plateOf.get(q); return Math.max(over(x), x?.room ? x.room[x.c.x < p.c.x ? 1 : 0] : 0); };
    const roomOf = (p) => sideRoom(p.c, boxes, held, W, walls, parseFloat(p.el.style.height), (q) => (p.free ? reach(q, p) : over(plateOf.get(q))), over(p), p.free);
    // each plate fitted on its own, never the whole pitch at once (owner, 2026-10-25): cramped quiet plates yield
    // first, so the black best always shows its full name, a name still too long is shortened like the cards', its
    // number alone in the handle's place; never a cut number (its middle over his card's middle third, so it reads as
    // his; the best's past its room the free turf's whole: `free`)
    const most = (p) => { const [l, r] = (p.room = roomOf(p)), s = p.free ? Infinity : p.c.w / 3; return p.c.w + Math.min(l, r + s) + Math.min(r, l + s); };
    const wider = (p) => p.el.getBoundingClientRect().width > most(p) + 0.5;
    const excess = (q) => q.el.getBoundingClientRect().width - most(q);
    const quiet = (p) => p.el.matches('.alt');
    // (a Remove of yours, its name and no number, is never a number alone: .bare; it yields as a quiet plate does, by
    // its name shortened to the plates' least instead: .cut, m-ahead.css)
    const named = (p) => !p.el.matches('.only, .bare.cut');
    // (one named again past (2); `was` is the excess of every plate as it was named: over too while it crowds one past
    // that, its own trims giving that room back)
    const cramped = (p) => wider(p) || (!!p.was && drawn.some((q) => q !== p && Math.max(0, excess(q)) > p.was.get(q) + 0.5));
    // "xP" one look per pitch (owner, 2026-10-26): where any plate or token beside the goal drops its "xP", every one
    // drops it, as a place's dealt headers do; from then a plate's own trims are its smaller type alone, its size its
    // own
    let steps = PLATE_TRIMS;
    const oneXp = () => {
      if (!steps.includes('noxp') || !oneLook([...decks.querySelectorAll('.ah-sp, .ah-tok')], ['noxp']).length) return false;
      steps = PLATE_TRIMS.filter((k) => k !== 'noxp');
      return true;
    };
    // (1) own trims that never hide who (PLATE_TRIMS: fitNum), repeated while one's gave a neighbour room; its "xP" the
    // pitch's (oneXp), before any name is shortened or gone
    const trim = () => {
      for (let i = 0; i < 4; i++) {
        let moved = false;
        for (const p of drawn.filter((x) => !x.el.matches('.cut'))) { const was = p.el.className; fitNum(p.el, () => cramped(p), steps); moved ||= was !== p.el.className; }
        if (!oneXp() && !moved) break;
      }
    };
    // a plate's number alone, names gone (m-ahead.css .ah-sp.only; a plan's "& 2 more" too; a tag shows his plan's
    // number)
    const toOnly = (p) => { if (p.el.matches('.bare')) { p.el.classList.add('cut'); return; } p.el.classList.remove('cut'); p.el.style.removeProperty('width'); p.el.classList.add('only'); };
    const yielded = (p) => (p.el.matches('.bare') ? 'cut' : 'only');
    const gain = (p) => (p.m.L.e.pl?.state === 'ready' ? p.m.L.e.pl.cmp.delta : -Infinity);
    // the nearest cards beside a plate (its span) in his row, each side, whose quiet plate is still named
    const beside = (p) => [boxes.filter((q) => Math.abs(q.y - p.c.y) < 2 && q.x + q.w <= p.c.x + 0.5).sort((a, b) => b.x - a.x)[0],
      boxes.filter((q) => Math.abs(q.y - p.c.y) < 2 && q.x >= p.c.x + p.c.w - 0.5).sort((a, b) => a.x - b.x)[0]]
      .map((q) => q && plateOf.get(q)).filter((q) => q && quiet(q) && named(q));
    trim();
    // (2) still over its room: quiet plates show their number alone ("+0.7"; a loss's or 0.0 does from the start,
    // swapPlate .loss, so only a gain's name yields here), those beside an ink plate over its room first, then the
    // lowest gain (a tie: the right-hand one), each time refitting them all
    for (;;) {
      const long = drawn.filter(wider);
      const ink = long.filter((p) => !quiet(p)).flatMap(beside);
      const cands = ink.length ? ink : [...long.filter((p) => quiet(p) && named(p)), ...long.flatMap(beside)];
      if (!cands.length) break;
      toOnly(cands.sort((a, b) => gain(a) - gain(b) || b.c.x - a.c.x)[0]);
      trim();
    }
    // (2b) an ink plate (the best's: a single, a plan, a tag) still over: it reaches over the free turf past his card's
    // middle third, as far as its band is clear (no plate, card or label hanging into it; a touchline: sideRoom
    // `free`); quiet plates keep the middle third
    for (const p of drawn.filter((x) => !quiet(x) && named(x) && wider(x))) p.free = true;
    trim();
    // (3) an ink plate still over (no quiet plate beside it left named, no free turf enough): its names shortened as
    // the cards' are, never its number or "& 2 more" (m-ahead.css .ah-sp.cut), each showing NAME_LEAST at least; (4)
    // else its number alone, ink (the best keeps its name longest: owner, 2026-10-25)
    for (const p of drawn.filter((x) => !quiet(x) && named(x) && wider(x))) {
      p.el.classList.add('cut');
      // (room depends on its own width: set until it holds, so the width checked is the one drawn)
      for (let i = 0; i < 6; i++) { const wd = most(p); if (Math.abs(wd - parseFloat(p.el.style.width)) < 0.5) break; p.el.style.width = `${wd}px`; }
      const body = p.el.querySelector('.ah-spb'), least = NAME_LEAST * parseFloat(getComputedStyle(body).fontSize);
      const shows = [...body.querySelectorAll('.ah-spn')].every((n) => n.scrollWidth <= n.clientWidth + 0.5 || n.clientWidth >= least);
      if (!shows || body.scrollWidth > body.clientWidth + 0.5) toOnly(p);
    }
    trim();
    // (its number alone only where its name had no room: each quiet one named again, the highest first, where it and
    // every plate beside it still fit in the room the steps after (2) left)
    // (never one beside an ink plate showing its number alone; nor where any plate's excess past its room grows; nor a
    // loss's: its number alone is its look, not a fit step, swapPlate .loss)
    const nearInk = new Set(drawn.filter((x) => !quiet(x) && !named(x)).flatMap((x) => [...plateOf].filter(([q]) => Math.abs(q.y - x.c.y) < 2 && (Math.abs(q.x + q.w - x.c.x) < q.w || Math.abs(x.c.x + x.c.w - q.x) < q.w)).map(([, y]) => y)));
    // (its name tried at its own trims as far as they go, never at the type its own room alone allows: cramped; fitted
    // first, before the plates beside it, so none of theirs answers for it, and taking no other plate's trim)
    const excesses = () => new Map(drawn.map((q) => [q, Math.max(0, excess(q))]));
    const took = (x, k) => { const was = k.split(' '); return [...x.classList].some((c) => c !== 'noxp' && !was.includes(c)); };
    for (const p of drawn.filter((x) => quiet(x) && !named(x) && !x.m.only && !x.el.matches('.loss') && !nearInk.has(x)).sort((a, b) => gain(b) - gain(a))) {
      const look = new Map([...decks.querySelectorAll('.ah-sp, .ah-tok')].map((x) => [x, x.className])), was = steps;
      p.was = excesses();
      p.el.classList.remove(yielded(p));
      fitNum(p.el, () => cramped(p), steps);
      trim();
      // (else restore every plate and token, the pitch's "xP" too, and reread each room; "xP" off is no plate's trim:
      // it only frees room)
      if (cramped(p) || [...look].some(([x, k]) => x !== p.el && took(x, k))) { delete p.was; for (const [x, k] of look) x.className = k; steps = was; trim(); }
      else p.was = excesses();
    }
    // as wide as its words, never narrower than his card (the span), centred on him, moved aside only as far as a
    // touchline or a plated neighbour makes it, its middle over his card's middle third (the best's past its room over
    // the free turf: 2b)
    // (every room read before any width is set: a neighbour's is its words' at the step the fit ended on)
    const wide = new Map(drawn.map((p) => { const m = most(p); return [p, [Math.min(Math.max(p.c.w, Math.ceil(p.el.getBoundingClientRect().width)), m), m]]; }));
    for (const p of drawn) {
      const [wd, room] = wide.get(p), extra = wd - p.c.w;
      const r = Math.min(extra - Math.min(extra / 2, p.room[0]), p.room[1]), left = p.c.x - (extra - r), top = parseFloat(p.el.style.top);
      Object.assign(p.el.style, { width: `${wd}px`, left: `${left}px` });
      // (the most it may take, for the QA)
      p.el.dataset.room = Math.floor(room);
      // its target: up over the free turf across its width as drawn, to 44 px over his card at most (reachOf: never
      // onto a card in the next column)
      p.el.style.setProperty('--up', `${Math.max(0, top - Math.max(reachOf({ n: p.el, x: left, y: top, w: wd }, walls), p.c.y - 44))}px`);
    }
    // a sentence's plate (lineBest) as wide as its words, centred over its sellers in its row, inside the touchlines; a
    // row-mate's plate it meets gives way (no plate under another), his place left to his card, the Week sheet and ‹ ›
    if (spEl) {
      const sp = { el: spEl };
      sp.el.style.width = 'max-content';
      const wantOf = () => Math.ceil(Math.max(sp.el.getBoundingClientRect().width, sp.el.scrollWidth)) + 2, mid = (row0[0].c.x + row0.at(-1).c.x + row0.at(-1).c.w) / 2;
      // (its words' width, past any CSS cap on its box: scrollWidth; 2026-11-02, a 350 px sentence read 311 at 320)
      // (wider than the pitch: a plate's own trims first, its "xP" (oneLook) then its smaller type (PLATE_TRIMS); still
      // wider, three moves at 320: two lines, between its moves, up into the turf over them; never a name cut)
      let want = wantOf();
      for (const k of PLATE_TRIMS) {
        if (want <= W - 6) break;
        sp.el.classList.add(k);
        if (k === 'noxp') oneLook([...decks.querySelectorAll('.ah-sp, .ah-tok')], ['noxp']);
        want = wantOf();
      }
      if (want > W - 6) {
        const th = parseFloat(sp.el.style.height);
        sp.el.classList.add('two');
        Object.assign(sp.el.style, { height: `${2 * th}px`, top: `${span.y - 2 * th}px` });
      }
      const wd = Math.min(W - 6, want), left = Math.min(W - 3 - wd, Math.max(3, mid - wd / 2));
      Object.assign(sp.el.style, { width: `${wd}px`, left: `${left}px` });
      // (no taller than the turf over it across its own width, never onto a card above, its type smaller as a plate's
      // in less than its least height (swapPlate); .two: its line-height 1.15)
      const lines = sp.el.classList.contains('two') ? 2 : 1, room = span.y - reachOf({ n: sp.el, x: left, y: span.y, w: wd }, walls);
      // (smaller only: never a type larger than its own; 2026-11-02, a 17 px room set 16 px type on a 12 px plate, past the
      // pitch's edge at 320)
      if (parseFloat(sp.el.style.height) > room) Object.assign(sp.el.style, { height: `${room}px`, top: `${span.y - room}px`, fontSize: `${Math.min(parseFloat(getComputedStyle(sp.el).fontSize), Math.floor(room / (lines === 2 ? 2.3 : 1)) - 1)}px` });
      const top = parseFloat(sp.el.style.top);
      sp.el.style.setProperty('--up', `${Math.max(0, top - Math.max(reachOf({ n: sp.el, x: left, y: top, w: wd }, walls), span.y - 44))}px`);
      for (const q of drawn) {
        const l = parseFloat(q.el.style.left), r = l + parseFloat(q.el.style.width);
        if (Math.abs(q.c.y - span.y) < 2 && r > left - 4 && l < left + wd + 4) { q.el.remove(); D.drawn.delete(q.m.d.a); }
      }
    }
    // (the choices whose plates are drawn, for litShown; a sentence's sellers' singles too)
    D.drawnPl = new Set(drawn.filter((p) => p.el.isConnected).map((p) => p.m.L.e.pl).filter(Boolean));
    if (spEl) D.drawnPl.add(row0[0].L.e.pl);
    reachLabels(root);
    // (as a landing's ink name plate: in 150 ms after 170 ms, m-ahead.css ah-in; Reduce Motion: the 150 ms fade, as
    // land's; none for a place's first choice drawn while the week checked)
    if (lights) for (const x of decks.querySelectorAll('.ah-sp:not(.first), .ah-tok.mv')) x.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 150, delay: reduceMotion() ? 0 : 170, fill: 'backwards' });
    cardMarks(P, g, boxes);
    // a × tapped on a card no choice sold: his place once his asked buys are listed (askPlace), or why none comes
    const want = S.placeWant?.g === g ? S.placeWant : null;
    if (!want) S.placeWant = null;
    if (S.place) drawPlace(false);
    else if (want && D.some((d) => d.a === want.a)) { S.placeWant = null; openPlace(want.a); }
    else if (want && M.settled) { S.placeWant = null; toast(COPY.cardNoBuy(P.L.name(want.a), g), 'info'); }
    sheetFollows(P, w, M);
  }
  /** Each card's two marks (owner, 2026-11-02, FPL's transfers pitch; design_1102a: A's light marks, the × where the C / V
   *  was): × at his tile's top-left opens his place (openPlace: his choices; one no choice sells has his best sale and
   *  its other buys asked first, askPlace); the lock at its bottom-left his Keep in GW g, shut where one holds him then
   *  (a tap on a shut lock takes a Keep of this week alone off, a wider one's sheet opens: ruleSheet). The C / V sits on
   *  his name plate (m-ahead.css), so a captain moved on a GW switch moves no mark. A kept player has no × (no transfer
   *  sells him). Never on a week you can't change (renderDecks). */
  /** Player a's lock in GW g, on his card or the best token's seller: his Keep of this week alone, taken off again; a
   *  wider one's sheet opens (ruleSheet). */
  function lockTap(P, g, a) { const { ctx, ruleSheet } = V;
    const pin = pinOf(P, 'keep', a, g);
    if (!pin) keep(ctx, a, { gw: g, scope: 'gw' });
    else if (pin.must?.length === 1 && pin.must[0][1] === g && pin.must[0][2] === g) removeRule(ctx, pin.id);
    else ruleSheet(pin);
  }
  function cardMarks(P, g, boxes) { const { S, boxOf, ctx, decks, pitchHost } = V;
    const root = pitchHost.querySelector(':scope > .pm');
    if (!P.editable || !root) return;
    const nm = P.L.name, b = root.getBoundingClientRect();
    // (the mark's size: m-ahead.css .ah-cm, 12 px; its target's reach past each side, --hit)
    const M = 12, HIT = 16;
    for (const c of boxes) {
      const a = c.id, pin = pinOf(P, 'keep', a, g);
      const tile = c.n.querySelector('.pm-kit'), t = tile ? boxOf(tile, b) : c;
      // (a tile too short for both, at large text: the lock right of the ×, their 24 px targets apart)
      const tall = t.h >= 2 * M + 8;
      // (each a 44 px target, m-ahead.css .ah-cm::before, split halfway where the two marks' would meet: review 7 B13;
      // the lock's ends at the tile's foot: under it the name plate's C / V tag, the armband's drag handle)
      const half = `${Math.max(0, Math.min(HIT, ((tall ? t.h - 6 : 3 * M) - 2 * M) / 2))}px`;
      const xAt = { left: `${t.x + 3}px`, top: `${t.y + 3}px`, [tall ? '--hb' : '--hr']: half };
      const lAt = tall ? { left: `${t.x + 3}px`, top: `${t.y + t.h - 3 - M}px`, '--ht': half, '--hb': '3px' } : { left: `${t.x + 3 + 2 * M}px`, top: `${t.y + 3}px`, '--hl': half };
      if (!pin) decks.append(h('button.ah-cm.out', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.cardOutSaid(nm(a), g), dataset: { row: `out:${a}` },
        style: xAt,
        onClick: () => {
          if (S.decks?.some((d) => d.a === a)) { openPlace(a); return; }
          S.placeWant = { a, g };
          if (!askPlace(ctx, P, g, a)) renderDecks();
        } }, crossGlyph()));
      // (the lock only on a player you locked, its tap unlocking him: owner, 2026-11-02, "remove locks for player plates
      // unless players are locked"; a lock is set from the band's ✕ on the seller or his card's sheet)
      if (pin) decks.append(h('button.ah-cm.lock', { type: 'button', class: { on: !!pin }, 'aria-pressed': String(!!pin), 'aria-label': COPY.cardLockSaid(nm(a), g, !!pin), dataset: { row: `lock:${a}` },
        style: lAt,
        onClick: () => lockTap(P, g, a) }, lockGlyph(!!pin)));
    }
  }
  /** The Week sheet's green follows the pitch as just drawn (owner, 2026-10-25: "Follow the pitch"): the week's `shown`
   *  is recomputed from the places drawn (litShown: `D.drawn`) and, where that changed it, the open sheet of that week
   *  redrawn. */
  function sheetFollows(P, w, M) { const { S, drawWeek } = V;
    const shown = litShown(P, w, M, M.decks, M.toks, M.lit);
    if (shown.size === M.shown.size && [...shown].every((pl) => M.shown.has(pl))) return;
    M.shown = shown;
    if (S.week?.g === w.gw) drawWeek(P, w, M);
  }
  /** A named plate (litOf, placeFirst; m-ahead.css .ah-sp; design_marks/design.md §1): one flat line in the row gap
   *  over the player it would replace (`c` his card's box, a plan's span of its sellers in one row; a sub's under his
   *  label: labelWalls), `tabH` tall at the most (less where the turf over him, `up`, holds less: never under PLATE_MIN
   *  but for its number alone, `o.only`), its target the free turf over it. It names who comes in (never a shirt,
   *  shortened only as the cards' are: owner, 2026-10-25) and his gain vs rolling (blue with "xP": numParts), or its
   *  number alone where its name has no room; a quiet one that gains nothing is a small chip (.loss, owner,
   *  2026-10-26). The best (`L.best`) is ink (a plan's one plate names its row's buys, `o.buys`, in its sellers' order,
   *  and "Rice & 2 more", `o.shown`); a plan's other seller in another row gets his buy's name alone (`o.tag`); any
   *  other is a quiet green plate: litOf's, or his place's first choice (`L.first`: "checking…" in its number's place
   *  while the week checks, never a clock); your own buy's is his take-back (`back`), "Gabriel +0.8", a Remove his name
   *  alone (.bare). No take on any plate (owner, 2026-10-25): its body opens his place, whose headers take. → its
   *  element */
  function swapPlate(P, g, d, { e, best, first }, c, up, tabH, o = {}) { const { S, openPlanWhy, plNumSaid, planKey, planSaid, plansVs } = V;
    const nm = P.L.name, pl = e.pl, s = pl ? planSaid(P, g, pl) : null;
    // (a Remove of yours, its name and no number, never its number alone: as short as the turf too)
    const th = Math.max(o.only || !pl ? Math.min(up, PLATE_MIN) : PLATE_MIN, Math.min(c.bench ? tabH - 2 : tabH, up));
    // (a sentence's plate opens its plan's own sheet, its why and its one take: its first move isn't this place's)
    const open = () => (o.line && pl ? openPlanWhy(P, g, pl) : openPlace(d.a));
    const buys = o.buys ?? (o.tag != null ? [e.inId] : [e.inId, ...e.pair.map((q) => q.in)]), sellers = o.sellers ?? [d.a, ...e.pair.map((q) => q.out)], shown = o.shown ?? [e.inId];
    // (a first choice: its number once the week settles, else "checking…", or why it can't be checked: as his place's
    // header; a Remove of yours: its name alone once the week settles)
    const ready = !!pl && pl.state === 'ready' && (!first || !!S.M?.settled);
    const v = ready ? numParts(g, pl) : !pl ? (S.M?.settled ? null : COPY.pairChecking) : pl.state === 'failed' ? failedWords(P, pl).head : COPY.pairChecking;
    // (your own buy's plate: his take-back, naming the player you sold (owner, 2026-10-26); ink where it is the week's
    // best, weekBest: owner, 2026-10-28)
    const back = d.mine && takesBack(e);
    // a quiet plate whose number gains nothing as shown (a loss, or 0.0: shownGain) is its number alone, a small chip,
    // whatever its room, so its shape tells it from a gain's named plate (owner, 2026-10-26; DECISION.md H): never the
    // best, a tag, your own buy's take-back or one still checking; VoiceOver still says who and what (`said`)
    const loss = !best && o.tag == null && !back && ready && !shownGain(pl.cmp.delta);
    const num = ready ? plNumSaid(P, pl) : v, places = COPY.placeSaid(nm(d.a), d.entries.length, null);
    const moves = back ? [COPY.keepSoldSaid(nm(e.inId), nm(d.a))] : sellers.map((a, i) => COPY.moveSaid(nm(a), nm(buys[i])));
    // (beside a chip's token, the week's best: "Best move this week", litOf `chip`)
    const move = !!S.M?.lit?.chip;
    // (a first choice says what his place holds: "none better than rolling" (in a week of yours "than your plan":
    // plansVs) where none gains; a move you removed or one the 2026-10-18 bars hold back says so, as its note)
    const none = !!first && !back && ready && !d.entries.some((x) => x.pl?.state === 'ready' && (plPays(x.pl) || x.pl.cmp.delta > 0.05));
    const why = first && ready && pl.removed ? `, ${COPY.removedByYou}` : '';
    const said = o.tag != null ? `${COPY.partSaid(moves[0], e.adds.filter((m) => Number(m.in) !== e.inId).map((m) => COPY.moveSaid(nm(m.out), nm(m.in))), move)}. ${places}`
      : back && !best ? `${moves[0]}${v == null ? '' : `, ${num}`}${why}. ${places}`
      : best ? `${COPY.bestSaid(moves, num, move)}. ${o.line && WHY_SHEET ? COPY.showsWhy : places}`
        : `${moves.join('; ')}, ${num}${why}. ${!first ? places : !ready ? placeLabel(P, d) : none ? COPY.placeNoneSaid(nm(d.a), d.entries.length, plansVs(P, g)) : places}`;
    const body = h('button.ah-spb', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': `${said}${o.line?.back ? `, ${o.line.back}` : ''}`, onClick: open },
      // (a multi-move best's sentence, every move named in its road's order)
      o.line ? [...o.line.map((x, i) => h('span.ah-spn', { 'aria-hidden': 'true' }, x, i < o.line.length - 1 ? ',' : null)), o.line.back ? h('span.ah-spn', { 'aria-hidden': 'true' }, o.line.back) : null] : shown.map((id, i) => [i ? h('span.ah-spj', { 'aria-hidden': 'true' }, ' + ') : null, h('span.ah-spn', { 'aria-hidden': 'true' }, nm(id))]),
      !o.line && shown.length < buys.length ? h('span.ah-spm', { 'aria-hidden': 'true' }, COPY.planMore(buys.length - shown.length)) : null,
      // (a tag shows his plan's number only where his name has no room: .only)
      v == null ? null : h('span.ah-spv.m-num', { 'aria-hidden': 'true', class: { wait: !ready } }, v));
    const plate = h('div.ah-sp', {
      // (a sub's by data-bench, never a class: app.css .bench is the desktop bench's panel)
      class: { best, alt: !best, first: !!first, part: o.tag != null, line: !!o.line, pays: ready && s.pays, only: !!o.only || loss, loss, back, bare: v == null },
      dataset: { row: `deck:${d.a}`, deck: d.a, ...(pl ? { plan: planKey(g, pl) } : {}), in: e.inId, ...(c.bench ? { bench: '' } : {}) },
      // (a number alone in less than a plate's least height: its type no taller than the turf, never onto his card)
      style: { left: `${c.x}px`, top: `${c.y - th}px`, height: `${th}px`, '--up': `${Math.max(0, up - th)}px`, ...(th < PLATE_MIN ? { fontSize: `${th - 1}px` } : {}) },
      // the free turf over it (its ::before) opens his place too
      onClick: (ev) => { if (ev.target === plate) open(); },
    }, body);
    return plate;
  }
  /** What a player's place holds, said (a first choice's plate while the week checks: COPY.placeSaid), its best never a
   *  move you took off this session (as litOf). */
  const placeLabel = (P, d) => { const { plNumSaid } = V;
    // (in the order his place deals them: placeOrder)
    const nm = P.L.name, best = placeOrder(d.entries).find((x) => !x.back && x.pl?.state === 'ready');
    return COPY.placeSaid(nm(d.a), d.entries.length, best && `${nm(best.inId)}, ${plNumSaid(P, best.pl)}`);
  };
  /** The week's status beside the goal (owner, 2026-10-26: the strip): what the week line's first line says, said once,
   *  on the pitch: "Rolling" (emptyHead: "Rolling is best" once settled with nothing better, "Rolling ✓" under your
   *  Roll), "2 transfers −4 +3.8", "Free Hit +4.3", GW A's lineup notice under the words of any (renderLine); yours
   *  green. Its number is the week line's (vs rolling everywhere), "checking…" under its words while it solves (never a
   *  clock: waitClock), a number kept on its word where the words wrap. A tap opens the Week sheet, as the strip does
   *  (under your Roll at Your rules, where its Remove is). Its words are said here alone, the strip's label its facts
   *  (VoiceOver hears the week once). Never given way for room (renderDecks), though the lineup notice under its words
   *  gives way first. renderLine's words (S.status). → node | null */
  // The status is the bar's first line, inside its one door, never a label on the pitch of its own (owner, 2026-10-29):
  // one door to the Week sheet, one look; the pitch's left corner keeps the black best alone, so nothing there moves on
  // a GW switch. "Rolling is best" is the corner's (tokensOf, 2026-10-30), the bar says "Rolling"
  function statusLine(st) { const { gainOf, hitTag } = V;
    if (!st) return null;
    return h('span.ah-bt.ah-bst', { class: { done: st.mine }, 'aria-hidden': 'true', dataset: { row: `tok:week:${st.g}` } },
      // (dashed while an edit is checked: m-pending)
      h('span.ah-tl', { class: { 'm-pending': st.ap } }, typeof st.one === 'string' ? st.one.replace(/(\d) /g, '$1\u00a0') : st.one),
      st.wait ? h('small.ah-tw', null, COPY.pairChecking) : null,
      // (the week's number: gainOf, blue with "xP", shimmering while an edit is checked; −4 before it)
      st.hits || (st.gain && !st.wait) ? h('span.ah-tnum', null, hitTag(st.hits), st.gain && !st.wait ? gainOf(st.gain, st.ap) : null) : null);
  }
  /** The week's own choices beside the goal (top-left; m-ahead.css .ah-tok): the week's status (statusTok), a Bench
   *  Boost or Triple Captain alone with its number (owner, 2026-10-23; no Wildcard or Free Hit pill: owner, 2026-10-27,
   *  decksOf), a Roll that takes yours back ("instead of Free Hit"): each its body alone, its Why sheet, whose Play or
   *  Take takes it, never ink (owner, 2026-10-26); while one solves, "checking…" under its words and no number (never a
   *  clock: waitClock).
   *  First, above them all, the week's best move while one beats your plan or rolling (litOf `move`; `lead` its places
   *  in its plate's top-most row: topRow), ink, its plate's first buy and its number, "Evanilson +1.6", a plan's too,
   *  "Tavernier +3.8" (its ink says it is the best, its plate names the plan whole; owner, 2026-10-26), VoiceOver the
   *  move whole. A tap takes it, as its place's Swap does (takeFrom: toast with Undo, the buy flying in from the
   *  token), his place skipped (owner, 2026-10-26); a week you can't change or a move still checked opens his place. */
  function tokensOf(P, w, toks, lit = new Map(), lead = null, M = null) { const { frozenAt, openPlanWhy, openWeek, plNumSaid, planKey, planSaid } = V;
    const g = w.gw, out = [];
    // (a plan's too, its buys and number on one line, "Tavernier, Evanilson +1.0 Swap", the names shortened before
    // anything else gives way, its word off where even that leaves no room: renderDecks' fits; owner, 2026-10-30: the
    // sentence never fits whole in the 149 px beside the goal)
    const mv = lit.move, top = mv && lead?.[0]?.L.e.pl === mv ? lead : null;
    /** A move's token: its place `a`'s entry e of choice pl, the best's ink (.mv) or the runner-up's white (.nx). */
    // a press on a token's "Swap" (.ah-tgo): a key's or a screen reader's too (no point: detail 0); a tap at or right of
    // the word's left edge
    const onSwap = (ev) => {
      const go = ev.currentTarget.querySelector('.ah-tgo');
      if (!go || !ev.detail) return true;
      const r = go.getBoundingClientRect();
      return ev.clientX >= r.left - 4;
    };
    const moveTok = (e, a, pl, best) => {
      const nm = P.L.name;
      // (the take-back of a transfer of yours "Keep Gabriel, not Hill": weekBest)
      const moves = takesBack(e) ? [COPY.keepSoldSaid(nm(e.inId), nm(a))] : e.adds.map((m) => COPY.moveSaid(nm(m.out), nm(m.in)));
      const swap = pl.state === 'ready' && !frozenAt(P, g), said = (best ? COPY.bestSaid : COPY.nextSaid)(moves, plNumSaid(P, pl), true);
      // (the best's first buy, its ✕ refusing it: renderDecks' notBadge; of several moves the first, the one refused
      // ahead: presolve.refusalRoads' lead)
      const one = best && swap && e.adds.length && !takesBack(e) ? e.adds[0] : null;
      const close = pl.cmp?.label === 'coin', span = Object.keys(pl.road?.windows?.[g]?.xi ?? {}).length || P.gws.filter((x) => x >= g).length;
      return h(best ? 'button.ah-tok.mv' : 'button.ah-tok.nx', { type: 'button', class: { tix: !!one, multi: !!one && e.adds.length > 1, close: !!one && close }, 'aria-haspopup': swap ? null : 'dialog', dataset: { row: `tok:${best ? 'best' : 'next'}:${g}`, deck: a, ...(best ? { best: planKey(g, pl) } : {}), ...(one ? { notOut: one.out, notIn: one.in } : {}), ...(swap ? { add: `plan:${planKey(g, pl)}` } : {}), ...(!takesBack(e) && e.adds.length === 1 ? { buy: nm(e.adds[0].in) } : {}) },
        // (its verb first where it takes, as drawn: "Swap. Best move this week: …")
        'aria-label': swap ? COPY.bestSwapSaid(said) : `${said}, ${COPY.showsChoices}`,
        // (its "Swap" takes; a tap on its words opens his place, the move among his choices: review 7, 2026-11-02,
        // feedforward, reversing the owner's 2026-10-26 whole-token take. By where the tap lands, the token's whole
        // box its target (::before); a key or a screen reader's press, no point, takes, as its label says)
        onClick: (ev) => (swap && onSwap(ev) ? takeFrom(ev, P, g, pl, ev.currentTarget, a, e.inId) : openPlace(a)) },
        // (one move its sale and buy, "Murillo → Hill": review 7, 2026-11-02, the net result, not one leg; reversing the
        // owner's 2026-10-26 buy alone; several their buys. The best's, in the band over the pitch, each name with its ✕:
        // renderDecks)
        // (the best's, in the band, its moves on two lines at most, "Gabriel → N.Williams" over "Dewsbury-Hall → Rice", a
        // third on the first line (.ah-brk after its first half: QA decks, 2026-11-03, 82 px for three); a ✕ after every
        // name: .x, renderDecks)
        h('span.ah-tl', { 'aria-hidden': 'true' }, one ? e.adds.flatMap((m, i, all) => [h('span.ah-tn', null, h('span.o.x', { dataset: { id: m.out } }, nm(m.out)), ' → ', h('span.i.x', { dataset: { id: m.in } }, nm(m.in))), all.length > 1 && i === Math.ceil(all.length / 2) - 1 ? h('span.ah-brk') : null])
          : (takesBack(e) || !e.adds.length ? [nm(e.inId)] : e.adds.length === 1 ? [`${nm(e.adds[0].out)} → ${nm(e.adds[0].in)}`] : e.adds.map((m) => nm(m.in))).map((t, i, all) => h('span.ah-tn', null, `${t}${i < all.length - 1 ? ',' : ''}`))),
        // (its number as its plate's: numParts)
        // (its number's scope, the window it counts, "+2.0 xP · 4 GW"; "Close call" where the solver's count of it is inside
        // the forecast's noise (counted's label 'coin'), its Swap outlined: owner, 2026-11-03, design_1103b "Number
        // scope + close call": Saffer, Johnson, Duke, Johnson's Elements of Choice; the lit move stays the solver's)
        h('span.ah-tnum.m-num', { 'aria-hidden': 'true' }, one && close ? h('small.ah-tclose', null, COPY.closeCall) : null, numParts(g, pl), one ? h('small.ah-tgw', null, COPY.overGws(span)) : null),
        // its take's word where its tap takes (owner, 2026-10-28: one act, one word, one look): "Swap" in the mint of
        // its place's best header, a keep-back "Keep"; none where it opens his place
        swap ? h(`span.ah-tgo.m-swap${best ? '.best' : ''}`, { 'aria-hidden': 'true' }, takesBack(e) ? COPY.placeKeep : COPY.placeSwap) : null);
    };
    if (top) out.push(moveTok(top[0].L.e, top[0].d.a, mv, true));
    // "Rolling is best" in the best move's place once the week settles with no move its best and its Roll offered
    // (owner, 2026-10-30): ink, flat, its "›" the door to the Week sheet, where every choice is counted against it
    // (openWeek), never given way for room (renderDecks: .st)
    // in the band once the week settles with no best left (a week you roll, or one whose transfers you made): why, the
    // next week with transfers of the plan as it stands, its moves, a tap there (owner, 2026-11-02, "find better use of
    // the space instead of writing rolling is best", "why not pill moving to next week"): the solver's plan under your
    // rules (rootRoad), else its roll road; "Rolling is best" and the Week sheet where neither makes one
    else if (M?.settled && !lit.best) {
      const rolling = toks.some(rollOnly), road = rootRoad(P, g) ?? (rolling ? toks.find(rollOnly)?.road : null);
      const nx = road?.weeks?.filter((x) => Number(x.gw) > g && (x.in || []).length).sort((a, b) => a.gw - b.gw)[0];
      const ms = nx ? pairedMoves(nx.out || [], nx.in || [], P.L) : [], at = Number(nx?.gw);
      const words = (f) => ms.map((m) => f(P.L.name(m.out), P.L.name(m.in))).join(', ');
      if (ms.length) out.push(h('button.ah-tok.st.best.next', { type: 'button', dataset: { row: `tok:week:${g}` }, 'aria-label': (rolling ? COPY.rollNextSaid : COPY.planNextSaid)(at, words(COPY.moveSaid)), onClick: () => V.setGw(at) },
        h('span.ah-tl', { 'aria-hidden': 'true' }, (rolling ? COPY.rollNext : COPY.planNext)(at, words((o, i) => `${o} → ${i}`.replace(/-/g, '\u2011'))))));
      else if (rolling) out.push(h('button.ah-tok.st.best', { type: 'button', 'aria-haspopup': 'dialog', dataset: { row: `tok:week:${g}` }, 'aria-label': `${COPY.statusSaid(COPY.rollingBest, g)}: ${COPY.rollingMeans}`, onClick: (ev) => openWeek(ev, g) },
        h('span.ah-tl', { 'aria-hidden': 'true' }, COPY.rollingBest)));
    }
    // (none beside it: each is its place's plate already; owner, 2026-11-02, "stop dublicating black and other pills on
    // pich", reversing 2026-10-29's two moves in the corner)
    // (the week's status is on the bar's first line: statusLine)
    for (const pl of toks) {
      // what its take takes back of yours, under its words: never a transfer of yours taken back unsaid
      const s = planSaid(P, g, pl), key = planKey(g, pl), { lost } = planBack(P, g, pl);
      const said = lost && !pl.refRow;
      // the Roll of a week you roll (no take: rollOnly; owner, 2026-10-22): the week's status says it, "Rolling" or
      // "Rolling is best" once settled with no best (statusTok); its Why sheet is the Week sheet's row's
      if (rollOnly(pl)) continue;
      // no take on any token, a chip the week's best too, never ink: its body opens its Why sheet, whose Play or Take
      // takes it (owner, 2026-10-26; as the plates: a tap opens, the take is inside)
      const what = planWeeks(P, { ...pl.choice, moves: [], hits: {} }, g, false).find(([x]) => x === g)?.[1] ?? COPY.planRoll(null);
      out.push(h('span.ah-tok.two', { class: { pays: s.pays, wait: !!s.wait }, dataset: { plan: key } },
        h('button.ah-tbody', { type: 'button', disabled: !!s.wait, dataset: { row: `tok:${key}` }, 'aria-label': `${s.label}; ${WHY_SHEET ? 'shows why' : COPY.showsWeek}`, onClick: () => openPlanWhy(P, g, pl) },
          // its words and number on one line (number blue with "xP": ui.js xpGain), what it takes back or "checking…"
          // under both across the token's whole width (owner, 2026-10-26: not three lines); never a clock in its
          // number's slot: waitClock
          h('span', null, what),
          s.wait || pl.refRow ? null : xpGain(shownDelta(pl.cmp), 'span.ah-tnum.m-num'),
          said ? h('small.ah-tw', null, COPY.planInsteadOf(lost)) : null, pl.state === 'solving' ? h('small.ah-tw', null, COPY.pairChecking) : null)));
    }
    return out;
  }
  /** A choice's number on the pitch (a plate's, a place's header): a Bench Boost or Triple Captain it plays too ("BB":
   *  its one tap plays it) and the −4 it takes, each a small mark before the number; the number is forecast points,
   *  blue with "xP" (ui.js xpGain; owner, 2026-10-22: sign = direction, never green). */
  const numParts = (g, pl) => {
    const chip = SQUAD_CHIPS.has(pl.choice.chips?.[g]) ? null : pl.choice.chips?.[g], hit = pl.hits?.[g] ?? 0;
    return [chip ? h('small.ah-dchip', null, chip.toUpperCase()) : null, hit ? h('small.ah-dhit.m-hit', null, `${MINUS}${E.HIT_COST * hit}`) : null, xpGain(shownDelta(pl.cmp))];
  };
  /** Take choice pl (or, with `act`, take a transfer of yours back) from where it is drawn (`from`: its tab, or its
   *  card dealt in a place), through addOnce (one tap; ignored just after a re-flow): the pitch drawn after it lands
   *  brings the buy `inId` from there into his card's place and sends the player in front (`a`'s card) up behind him
   *  (landMotion). */
  function takeFrom(ev, P, g, pl, from, a, inId, act = () => addPlan(V.ctx, g, pl)) { const { S, addOnce, cardIn, pitchHost } = V;
    addOnce(ev, () => {
      const card = cardIn(pitchHost.querySelector(':scope > .pm'), a);
      // focus goes to him for a keyboard or VoiceOver (click with no pointer: detail 0), never a ring after a tap
      S.fly = { gw: g, at: Date.now(), inId, a, focus: ev.detail === 0, from: from.getBoundingClientRect(), ghost: card && { node: card.cloneNode(true), rect: card.getBoundingClientRect() } };
      const ok = act();
      if (ok) closePlace(false);
      else S.fly = null;
      return ok;
    }, pl ? planTake(P, g, pl).own : []);
  }
  function landMotion(fresh, g) { const { FLY_MS, LAND_MAX, S, cardBoxes, cardIn, ctl, pitchHost, redeck } = V;
    const snap = S.snap;
    S.snap = null;
    if (S.fly && (Date.now() - S.fly.at > FLY_MS || S.fly.gw !== g)) S.fly = null;
    const f = S.fly;
    const root = pitchHost.querySelector(':scope > .pm'), rows = root?.querySelector(':scope > .pm-field > .pm-rows');
    if (!root || !rows || !snap || (!f && !fresh?.cards?.[g]?.length)) return;
    if (f && !cardIn(root, f.inId)) return;  // his card not drawn yet (the take still lands): the next draw's
    S.fly = null;
    const ids = new Set([...(fresh?.cards?.[g] ?? []), ...(f ? [f.inId] : [])].map(Number));
    const now = cardBoxes(root);
    const here = new Set(now.map((c) => c.id));
    const fresh2 = now.filter((c) => ids.has(c.id) && !snap.has(c.id));
    // cards that left, by where they stood; for the tapped buy, the card he waited behind
    const gone = [...snap].filter(([id]) => !here.has(id) && id !== f?.a).map(([id, x]) => ({ id, ...x }));
    if (fresh2.length > LAND_MAX) return;
    const moves = fresh2.map((c) => {
      const r = c.n.getBoundingClientRect(), mine = f?.inId === c.id ? f : null;
      const dist = (x) => Math.hypot(x.rect.left - r.left, x.rect.top - r.top);
      const was = mine ? mine.ghost : gone.filter((x) => dist(x) < Math.max(8, r.width / 2)).sort((x, y) => dist(x) - dist(y))[0] ?? null;
      if (was && !mine) gone.splice(gone.indexOf(was), 1);
      return land(c.n, r, rows, mine?.from ?? null, was);
    }).filter(Boolean);
    if (f?.focus) cardIn(root, f.inId)?.focus({ preventScroll: true });
    // the choices are placed from the cards' boxes (renderDecks), which the motion holds off their places until it
    // ends; placed meanwhile (a resize the mount made: refitPitch's redeck), a card behind would find less turf than a
    // tab and draw edges or none. So none is placed while they move (redeck); once landed, they are placed again
    if (!moves.length) return;
    const landing = S.landing = Promise.allSettled(moves.map((a) => a.finished));
    landing.then(() => {
      if (S.landing !== landing) return;
      S.landing = null;
      if (ctl.isConnected) redeck();
    });
  }
  /** Card `to` (at r) lands: from `from` (a rect) or from behind his slot; `was` ({rect, node}, the card that stood
   *  there) goes up behind him and fades. → his card's motion (an Animation) | null */
  function land(to, r, rows, from, was) { const { FLY_EASE } = V;
    to.querySelector('.pm-face.back')?.remove();
    for (const a of to.querySelector('.pm-face.front')?.getAnimations?.() ?? []) a.finish();
    to.classList.add('ah-landed');
    const base = rows.getBoundingClientRect();
    const ghost = was?.node ?? null;
    if (ghost) {
      ghost.removeAttribute('data-id');
      ghost.classList.remove('ah-stepout', 'ah-landed');
      ghost.classList.add('ah-ghost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.inert = true;
      Object.assign(ghost.style, { left: `${was.rect.left - base.left}px`, top: `${was.rect.top - base.top}px` });
      rows.append(ghost);
    }
    const off = () => ghost?.remove();
    if (!to.animate) { off(); return null; }
    if (reduceMotion()) {
      const a = to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
      if (ghost) ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).onfinish = off;
      return a;
    }
    // behind him: a tab's height and its 4 px up (the card behind's place)
    const lift = from && was ? Math.max(24, was.rect.top - from.top) : 28;
    const a = to.animate(from ? [{ transform: `translate(${from.left - r.left}px, ${from.top - r.top}px)`, zIndex: 6 }, { transform: 'none', zIndex: 6 }]
      : [{ transform: `translateY(${-lift}px) scale(.94)`, opacity: 0.7, zIndex: 1 }, { transform: 'none', opacity: 1, zIndex: 4 }], { duration: 200, easing: FLY_EASE });
    if (ghost) ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-lift}px) scale(.94)`, opacity: 0 }], { duration: 200, easing: FLY_EASE, fill: 'forwards' }).onfinish = off;
    return a;
  }
  /**
   * A player's place (owner, 2026-10-20): his row steps aside and every choice for his card deals out beside him on
   * the turf in rank order, one way (placeOrder, slotsBeside: best nearest, the Roll last; a row-mate steps out where
   * one takes his slot), each a pitch card (pitch.pitchCard: this week's fixture and points; a tap its Why sheet)
   * under its number and its + (takeFrom), over what else it does (noteOf); his own card stays, under "Keep" (keeps
   * him that GW: no suggestion sells him) or "Yours +0.4" on your buy. The rest of the pitch is under a shade, nothing
   * drawn on it (owner, 2026-10-26). A bar at the pitch's foot (its head for a bench place): ‹ › the places in order,
   * All N (the Week sheet), ✕, what its numbers are. Its order is held while open. Closed by ✕, Escape, a tap outside
   * it (on another place's edges: that place), a take, a new week or a pitch mounted anew.
   */
  function openPlace(a) { const { S, ctx, drawPlace, gwNow, pitchHost } = V;
    if (S.drag?.pitch?.lifted || !S.decks?.some((d) => d.a === a)) return;
    closePlace(false);
    S.place = { a, order: null };
    globalThis.addEventListener('keydown', placeKey);
    drawPlace(true);
    // his other buys, asked beside the week's choices (askPlace), dealt after those shown, before the take-backs
    if (S.drawn) askPlace(ctx, S.drawn, gwNow(S.drawn), a);
    const layer = pitchHost.querySelector(':scope > .pm > .ah-place');
    ([...layer?.querySelectorAll('.ah-pgo') ?? []].find((x) => !x.disabled) ?? layer?.querySelector('.ah-walk button:not(:disabled)'))?.focus({ preventScroll: true });
  }
  const placeKey = (e) => { const { pitchHost } = V; if (e.key === 'Escape' && (e.target === document.body || pitchHost.contains(e.target))) { e.stopPropagation(); closePlace(); } };
  /** The open place closed (`back`: fading out, focus back on his card). */
  function closePlace(back = true) { const { S, cardIn, pitchHost } = V;
    if (!S.place) return;
    const { a } = S.place;
    S.place = null;
    globalThis.removeEventListener('keydown', placeKey);
    const root = pitchHost.querySelector(':scope > .pm'), layer = root?.querySelector(':scope > .ah-place');
    for (const n of root?.querySelectorAll('.ah-stepout') ?? []) { n.classList.remove('ah-stepout'); n.inert = false; }
    if (back) cardIn(root, a)?.focus({ preventScroll: true });
    if (!layer) return;
    if (!back || reduceMotion() || !layer.animate) { layer.remove(); return; }
    layer.style.pointerEvents = 'none';
    layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }).onfinish = () => layer.remove();
  }
  return { renderDecks, sheetFollows, swapPlate, placeLabel, statusLine, tokensOf, numParts, takeFrom, landMotion, land, openPlace, placeKey, closePlace };
}
