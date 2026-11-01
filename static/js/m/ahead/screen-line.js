// screen.js mount: the week line and the cards' geometry

import { movesInOrder, rollingAt, rowGains } from './presolve.js';
import { rollKeeps } from '../memory.js';
import { chipWeekGain } from './pieces.js';
import { h, fill, chipName } from '../../ui.js';
import { COPY } from '../calls.js';
import { lineNotices } from './plans.js';
import { inkAt } from './buys.js';
import * as E from '../../plan/engine.js';
import { cssPx, reachOf, resetFits } from './screen.js';

export function linePart(V) {
  /**
   * The week line (owner, 2026-10-19), a strip since 2026-10-26: the week's status is on the pitch beside the goal
   * (statusTok, `S.status`); the strip is ONE line of the one fact the pitch can't show:
   * · no transfer: "Rolling" ("Rolling is best" once settled with nothing better, "Rolling ✓" under your Roll:
   * emptyHead) over the facts "1 FT · £0.5m ITB · 2 FT in GW9" (rollFacts; a short bank's words in its place; "2 FT in
   * GW9" goes where it doesn't fit: fitFacts);
   *   · your transfers, each an IN card on the pitch: "1 transfer +0.4" over "Out: Saka" (number: weekGain's);
   * · a Wildcard or Free Hit: "Wildcard +14.7" over "8 changes"; the number is your chip's plan against the week's
   * roll plan (chipWeekGain; owner, 2026-10-22), "checking…" while either solves; off the hold, against not playing it
   * (chipGain);
   *   · GW A under way: its sentence alone, cut at its end (liveCheck; whole in the Week sheet).
   * A problem notice that stands takes the line after the lead ("· +1" for more; amber for a clash or a price that
   * won't wait), else a short bank keeps it, else, until the choices are lit, how far their checks are. GW A's lineup
   * notice (quiet: weekModel), only where none of them stands, sits under the status's words in every week (owner,
   * 2026-10-26, 10-29). Where the facts aren't drawn (all but GW A under way) the week's FT and bank lead the line
   * (weekLead); the checks' words give way beside it, never their clock (fitFacts).
   * "Bring in…" then "Chips…" at its right end (owner, 2026-10-13; none where no edit reaches: GW A under way; off on
   * a plan you can't change). A tap opens the Week sheet (weekSheet). The page's focus home (app.js dismiss).
   */
  /** The Week sheet of GW g (the bar's tap, the corner's "Rolling is best": tokensOf): under your Roll at Your rules,
   *  where its Remove is (keyboard/VoiceOver click with no pointer: detail 0, as takeFrom). */
  function openWeek(ev, g) { const { S, weekSheet } = V;
    const rules = !!S.drawn && rollingAt(S.drawn, g);
    weekSheet(g, rules ? 'rules' : null);
    if (rules && ev.detail === 0) S.week?.host.querySelector(`.ah-rmv[data-rule="roll:${g}"]`)?.focus({ preventScroll: true });
  }
  function renderLine(P, w, M) { const { S, ap0, bankWarn, barNode, bringDoor, bsep, chipsDoor, ctx, hitSaid, noticeSaid, numSaid, paintWait, rollFacts, statusLine, strip, waitClock, weekLead } = V;
    const g = w.gw, n = w.moves.length;
    const ap = ap0(P, g);
    // a take of k transfers still being checked while the plan before it is drawn (no move yet): its rule keeps them
    // (memory.pinRoll's caps, "GW9 frozen"), so the line says "1 transfer" and "checking…", never the week as drawn
    // (owner, 2026-10-27)
    const kept = !n && !M.live && !M.sq && ap ? rollKeeps(P.pins.find((p) => p.id === `roll:${g}`)) : 0;
    // `mine`: the week's own words on the line ("Out: Saka", "8 changes")
    let one = null, gain = null, wait = false, two, said, short = null, facts = false, factsSaid = '', mine = null;
    if (M.live) {
      two = said = M.liveText;
    } else if (M.sq) {
      const v = chipWeekGain(ctx, P, g);
      one = chipName(M.sq);
      gain = v.cmp;
      wait = v.wait;
      // its changes are its squad's, none counted while that is worked out: "checking…", as Chips… says it
      two = mine = ap ? COPY.chipChecking : COPY.nChanges(n);
      said = `${one}${wait || v.cmp ? `, ${numSaid(wait, v.cmp, ap, !!v.vs)}${v.cmp && !v.vs ? ' against no chip' : ''}` : ''}`;
    } else if (n) {
      const v = weekGain(P, w);
      one = COPY.nTransfers(n);
      gain = v.cmp;
      wait = v.wait;
      short = bankWarn(P, w);
      // (its sales are said to VoiceOver alone, never drawn: the status's "1 transfer" and the pitch's →| plates show
      // them; owner, 2026-10-29)
      mine = COPY.outNames(movesInOrder(P, w).map((m) => P.L.name(m.out)));
      said = `${one}${hitSaid(w.hits)}, ${numSaid(wait, v.cmp, ap, v.vs)}`;
    } else {
      // ("Rolling", never "Rolling is best": that is the corner's black token, tokensOf)
      const f = rollFacts(P, w);
      one = kept ? COPY.nTransfers(kept) : f.head;
      wait = kept > 0;
      two = f.rest;
      said = kept ? `${one}, ${numSaid(true)}` : f.head;
      factsSaid = f.said;
      facts = true;
    }
    const { problem, more, lineup } = lineNotices(M.notices, M.live);
    // until the week's choices are lit on the pitch (litOf), how far their checks are (weekWait), in the Week sheet's
    // words ("Checking GW9 · 3 of 6 plans · 0:12"), where no problem notice or short bank stands; where they don't fit,
    // "plans" goes, then the GW, then the words ellipsise, then they go; the clock is never cut (fitFacts)
    // (the strip's wait line tells the checks in its place, over a notice or short bank too: paintWait; S.wl what it
    // counts)
    const checking = null;
    const wl = !M.live && S.wait ? M.wait ?? { i: 1, n: 0 } : null, was = S.wl?.key === S.wait?.key ? S.wl : null;
    S.wl = wl ? { key: S.wait.key, g, n: wl.n, done: wl.i - 1, at: was?.done === wl.i - 1 ? was.at : Date.now(), max: was?.n === wl.n ? was.max : 0,
      tau: wl.i > 1 ? (Date.now() - S.wait.t0) / (wl.i - 1) : 4000 } : null;
    const notice = problem ? `${problem.text}${more ? COPY.moreNotices(more) : ''}` : null;
    // (an amber notice or a short bank keeps the line over the wait's words: paintWait)
    S.lineKeep = !M.live && (!!problem?.warn || !!bankWarn(P, w));
    // (the lineup notice sits under the status's words in every week, one look, S.status's `sub`: "Set in FPL: 3
    // changes" under "1 transfer +1.2" or "Rolling"; owner, 2026-10-29); a problem notice keeps the line after the
    // week's FT and bank
    if (problem) two = notice;
    // (the checks' words, then their clock, after the lead; fitFacts sheds the words; the clock carries its own " · ")
    const chk = checking && h('span.ah-chk', null, h('span.ah-bn.ah-cw', null, checking[0]), waitClock('', { late: true, sep: '\u00a0·\u00a0' }));
    if (checking) two = chk;
    // the week's bank leads the line wherever its facts don't say it (owner, 2026-10-21): "£0.3m ITB · Out: Saka", a
    // short bank's words in its place (bankLead); its free transfers before it, in every state (owner, 2026-10-22;
    // weekLead); a notice or the checks after the week's own words, cut from the end where they don't fit (m-ahead.css
    // .ah-bs; fitFacts)
    const own = facts && !checking && !problem;
    const lead = M.live || own ? null : weekLead(P, w);
    const rest = notice ?? (checking ? checking[0] : null);
    // (the rest after it gives way, never the lead: .ah-brest)
    // (a week of your transfers: the lead alone, no " · " left with nothing after it)
    // GW A's lineup notice on the bar's second line after the week's FT and bank ("Set in FPL: 2 changes"), whole or
    // not at all: with no room it goes with its " · " and the Week sheet's row and VoiceOver say it ("Set in FPL" alone
    // where the whole line has no room: fitFacts)
    const lu = lineup ? h('span.ah-blu', null, bsep(' · '), h('span.ah-fact', { dataset: { t: lineup.replace(/(\d) /g, '$1\u00a0') } }, lineup.replace(/(\d) /g, '$1\u00a0'))) : null;
    if (lu && !lead) two = [two, lu];
    if (lead) two = two != null ? [h('span.ah-blead', null, lead.node, lu, bsep('\u00a0·\u00a0')), h('span.ah-brest', null, two)] : h('span.ah-blead', null, lead.node, lu);
    // the notice on the line is said once to VoiceOver, and nothing once none is on it
    const told = [problem?.text, lineup].filter(Boolean).join('. ');
    if (noticeSaid.textContent !== told) fill(noticeSaid, told || null);
    // the status token's (statusTok): the week's −4 only where its words are its transfers (a squad chip's are free);
    // green where the week is yours (transfers, chip or Roll); the lineup notice under its words (never green: FPL's to
    // do), said after the week's own words ("Rolling. Set in FPL: 3 changes")
    S.status = M.live ? null : { g, one, hits: n && !M.sq ? w.hits : 0, wait, gain, ap, said: lineup ? `${said}. ${lineup}` : said, sub: lineup, mine: n > 0 || kept > 0 || !!M.sq || (facts && rollingAt(P, g)) };
    // the week said in one place, the bar: its status ("1 transfer +1.5 xP") over its facts ("1 FT · £0.5m ITB · Set in
    // FPL: 2 changes"), one door with one "›" to the Week sheet, Bring in and Chips at its right
    fill(strip, h('section.ah-block', { 'aria-label': COPY.weekTitle(g), tabindex: '-1', dataset: { focusHome: '' } },
      barNode({
        one: M.live ? null : statusLine(S.status), two, warn: !!problem?.warn,
        // (the week said once: status, GW A's lineup notice, then facts; GW A under way its sentence)
        label: M.live ? said : COPY.statusSaid([S.status.said, own ? factsSaid : null, lead?.said, mine, rest].filter(Boolean).join('. '), g),
        onClick: (ev) => openWeek(ev, g),
        moves: w.moves.map((m) => `${m.out}>${m.in}`).join(' '),
        doors: inkAt(ctx, P, g) ? [] : [bringDoor(P, g), chipsDoor(P, g)],
      })));
    // fitFacts's input: the checks' words, shortest last
    S.line = chk ? { bar: strip.querySelector(':scope > .ah-block > .ah-pbar'), chk, texts: checking } : null;
    fitFacts();
    paintWait();
  }
  /** The week line's one line fitted beside its doors (owner, 2026-10-22), after renderLine, on a new width
   *  (refitPitch) and on a clock of more digits (tick):
   *    · next GW's free transfers (.ah-fnext: rollFacts) only where they fit, else left to the Week sheet;
   *  · "N FT · £x ITB" leads whole in every state: only its "ITB" gives way where even the bank can't stay whole (a
   *  £10m bank at 320 px), never the amount; words longer than the line end in "…" (m-ahead.css), never cut mid-glyph;
   *  · the checks after the lead: the clock never cut, their words giving way first ("Checking GW9 · 3 of 6 plans",
   *  then "plans", then the GW, then an ellipsis, then none; measured with the clock as it reads once shown); where
   *  even the clock has no room, the words go and the clock stays beside the lead;
   *  · what follows the lead ("Out: …", "8 changes", a notice) is cut at its end, never a " · " left with nothing after
   *  it (under 1.5 em left it goes); a problem notice (amber) never goes: the lead's separators narrow for it. */
  function fitFacts() { const { S, strip, waited } = V;
    const bar = strip.querySelector(':scope > .ah-block:not(.ah-fitprobe) > .ah-pbar'), bs = bar?.querySelector('.ah-pbt .ah-bs');
    // the week's status stays whole: its "xP" goes, then a smaller number (ST_TRIMS); where even that leaves no room (a
    // larger text size) the doors wrap under the line
    const bst = bar?.querySelector('.ah-pbt > .ah-bst');
    if (bst) {
      bst.classList.remove('noxp', 'tight');
      bar.classList.remove('ah-pwrap');
      for (const c of ['noxp', 'tight']) { if (bst.scrollWidth <= bst.clientWidth + 0.5) break; bst.classList.add(c); }
      if (bst.scrollWidth > bst.clientWidth + 0.5) bar.classList.add('ah-pwrap');
    }
    if (!bs) return;
    const L = S.line?.bar === bar ? S.line : null, em = parseFloat(getComputedStyle(bs).fontSize);
    const fits = (x) => x.scrollWidth <= x.clientWidth + 0.5, right = (x) => x.getBoundingClientRect().right;
    // the checks' clock in its shown form (" · 0:12": waitClock `late`) while measured
    const clock = S.wait ? L?.chk.querySelector(':scope > .ah-wclock') : null, was = clock?.textContent;
    if (clock) clock.textContent = `${clock.dataset.sep ?? ''}${waited()}`;
    const cw = L?.chk.querySelector(':scope > .ah-cw');
    /** The checks' words: the longest that fits, else the shortest cut at its end, else (under 2 em) none. */
    const shed = () => {
      cw.hidden = false;
      for (const t of L.texts) { cw.textContent = t; if (fits(cw)) return; }
      if (cw.clientWidth < 2 * em) cw.hidden = true;
    };
    const nx = bs.querySelector('.ah-fnext'), lead = bs.querySelector(':scope > .ah-blead'), rest = bs.querySelector(':scope > .ah-brest');
    const blu = bs.querySelector('.ah-blu'), warn = bs.classList.contains('warn'), luw = blu?.querySelector('.ah-fact');
    if (luw) luw.textContent = luw.dataset.t;
    const luLess = () => { if (luw.textContent !== COPY.setInFplShort) luw.textContent = COPY.setInFplShort; else blu.hidden = true; };
    const seps = [...(lead?.querySelectorAll('.ah-bsep') ?? [])], sep = rest ? seps.at(-1) : null;
    for (const x of [nx, rest, blu, ...seps, ...bs.querySelectorAll('.ah-itb')]) if (x) x.hidden = false;
    for (const x of seps) x.textContent = x.dataset.t;
    const leadFits = () => (lead ? lead.scrollWidth <= bs.clientWidth + 0.5 : fits(bs));
    // (next GW's free transfers go first, then the lineup notice: what FPL needs stays longest)
    if (nx) nx.hidden = !fits(bs);
    // (the lead's separator goes with what follows)
    if (sep) sep.hidden = true;
    if (rest) rest.hidden = true;
    if (blu && !leadFits()) luLess();
    if (blu && !blu.hidden && !leadFits()) luLess();
    if (rest) rest.hidden = false;
    // (an amber notice outlasts the lineup notice: a problem is never pushed off by it)
    for (let i = 0; i < 2 && blu && !blu.hidden && rest && warn && rest.scrollWidth > rest.clientWidth + 0.5; i++) luLess();
    if (!leadFits()) for (const x of bs.querySelectorAll('.ah-itb')) x.hidden = true;
    if (sep) sep.hidden = false;
    // (a grey notice is whole or gone with its " · ", never cut: "Tomorr…" read as a door's mark or the wait's)
    if (rest && !warn && !rest.querySelector('.ah-chk') && rest.scrollWidth > rest.clientWidth + 0.5) { rest.hidden = true; if (sep) sep.hidden = true; }
    if (L && rest) {
      shed();
      // (no room for the clock after the words: the words go, the clock stays beside the lead)
      if (clock && !cw.hidden && right(clock) > right(bs) + 0.5) cw.hidden = true;
      if (cw.hidden && sep) sep.hidden = true;
    }
    if (rest && !rest.hidden && !rest.querySelector('.ah-chk') && rest.clientWidth < 1.5 * em) {
      if (warn) for (const x of seps) x.textContent = x.dataset.t.replace(/[\s\u00a0]+/g, '\u200a');
      else rest.hidden = sep.hidden = true;
    }
    if (clock) clock.textContent = was;
  }
  /** Your week's transfers' number (the week line's; a week with two or more says the week's gain over rolling: owner,
   *  2026-10-19): your plan against the week's roll plan, Forkcast's later moves on both sides (weekRoll), "checking…"
   *  (`wait`) while either still solves; off the hold (no roll plan solved: plansOf) or while an edit is checked, the
   *  rows' sum (rowGains).
   *  → {cmp | null, wait, vs (against rolling)} */
  function weekGain(P, w) { const { ctx, weekPending, weekRoll } = V;
    const r = weekRoll(P, w);
    if (r) return { cmp: r, wait: false, vs: true };
    if (weekPending(P, w)) return { cmp: null, wait: true, vs: false };
    const gains = rowGains(ctx, P, w);
    const sum = w.moves.reduce((t, m) => t + (gains.get(`${m.out}>${m.in}`)?.cmp?.delta ?? 0), 0);
    return { cmp: { delta: sum, label: E.verdictLabel(sum, P.noise) }, wait: false, vs: false };
  }
  /** Node n's box on the pitch whose own box is `b`: {n, x, y, w, h} */
  const boxOf = (n, b) => { const r = n.getBoundingClientRect(); return { n, x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height }; };
  /** The pitch's cards as drawn, each by its box on the pitch (.pm, `root`): [{id, n, x, y, w, h, bench}]; never a
   *  landing's ghost (land: the card that left, there until its fade finishes, after the choices are placed again) */
  function cardBoxes(root) {
    const b = root.getBoundingClientRect();
    return [...root.querySelectorAll(':scope > :is(.pm-field, .pm-benchzone) .pm-card:not(.ah-ghost)')].map((n) => ({ id: Number(n.dataset.id), ...boxOf(n, b), bench: !!n.closest('.pm-bench') }));
  }
  /** Each sub's label (pitch.js benchPanel's button: his sub list, subSheet) is a target from his card's top up over
   *  free turf (m-ahead.css .pm-bl::before, --up): 44 px where the turf has them, never onto a card (reachOf). A sub's
   *  card behind waits under his label (labelWalls): the target then ends at its top (--dn). Placed after the choices
   *  (renderDecks), also in a week that draws none. */
  function reachLabels(root) { const { decks } = V;
    const b = root.getBoundingClientRect(), boxes = cardBoxes(root);
    const behind = [...decks.querySelectorAll('.ah-sp')].map((n) => boxOf(n, b));
    for (const c of boxes.filter((x) => x.bench)) {
      const bl = c.n.previousElementSibling;
      if (!bl?.matches('button.pm-bl')) continue;
      const q = { ...boxOf(bl, b), n: bl }, foot = q.y + q.h;
      const lo = Math.min(c.y, ...behind.filter((t) => t.x < q.x + q.w && q.x < t.x + t.w && t.y >= foot - 0.5 && t.y < c.y).map((t) => t.y));
      bl.style.setProperty('--dn', `${Math.max(0, lo - foot)}px`);
      bl.style.setProperty('--up', `${lo - reachOf(q, boxes)}px`);
    }
  }
  /** The subs' labels on the pitch as drawn (its box `b`), each a wall a card behind rises to: a sub's tab or edges
   *  wait on his own card under his label, never over the bench's panel (m-ahead.css --pm-bl-gap) nor on the label
   *  (else his sub list is unreachable). */
  const labelWalls = (root, b) => [...root.querySelectorAll(':scope > .pm-benchzone .pm-bl')].map((n) => boxOf(n, b));
  /** The room a plate over card c (a plan's span of its sellers) may take past his card on each side
   *  (design_marks/design.md §1): to a row-mate with a plate (`held`), the gap less 2 px and less what that plate,
   *  centred, takes of it (`ext`(card) px: half the gap less 1 px where not given), never more than this plate takes of
   *  it centred (`own` px), so two plates never meet; to one with none, the gap and his half card less 4 px; 6 px short
   *  of a touchline (`W` the pitch's width); 2 px short of anything else in the plate's band beside him (`side`: walls,
   *  a card hanging into the row gap, a sub's label, a token beside the goal, a corner pill; `th` the plate's height).
   *  `free`: the best's plate past its own room (renderDecks) takes the free turf over row-mates with neither, up to
   *  the nearest mark, touchline or whatever hangs into its band. → [left, right], px */
  const sideRoom = (c, boxes, held, W, side = [], th = 0, ext = null, own = Infinity, free = false) => {
    const mates = boxes.filter((q) => Math.abs(q.y - c.y) < 2 && (q.x + q.w <= c.x + 0.5 || q.x >= c.x + c.w - 0.5) && (!free || held.has(q)));
    const to = (q, gap) => (held.has(q) ? Math.min(gap - 2 - (ext?.(q) ?? gap / 2 - 1), own) : gap + q.w / 2 - 4);
    // (the nearest row-mate each side: one further off is past his card, whose terms are less; a plate there never caps
    // this one at `own`)
    const lm = mates.filter((q) => q.x < c.x).sort((a, b) => b.x - a.x)[0], rm = mates.filter((q) => q.x > c.x).sort((a, b) => a.x - b.x)[0];
    const left = Math.min(c.x - 6, ...(lm ? [to(lm, c.x - lm.x - lm.w)] : []));
    const right = Math.min(W - 6 - c.x - c.w, ...(rm ? [to(rm, rm.x - c.x - c.w)] : []));
    const band = side.filter((q) => q.y < c.y && q.y + q.h > c.y - th);
    const l2 = Math.min(left, ...band.filter((q) => q.x + q.w <= c.x + c.w / 2).map((q) => c.x - q.x - q.w - 2));
    const r2 = Math.min(right, ...band.filter((q) => q.x >= c.x + c.w / 2).map((q) => q.x - c.x - c.w - 2));
    return [Math.max(0, l2), Math.max(0, r2)];
  };
  const cardIn = (root, id) => root?.querySelector(`:scope > :is(.pm-field, .pm-benchzone) .pm-card[data-id="${id}"]`) ?? null;
  /** An entry's key in its place (its held order): its choice's (planKey) and the buy it shows. */
  const entryKey = (g, e) => { const { planKey } = V; return `${e.pl ? planKey(g, e.pl) : `rm:${e.remove.out}>${e.remove.in}`}|${e.inId}`; };
  const resetSlot = (last, gap = V.RESET_GAPS[0]) => { const { decks } = V; return (last ? last.offsetTop : 6) + Math.max(Math.ceil(cssPx(decks, 'var(--pm-pill)')[0]), last?.offsetHeight ?? 0) + gap; };
  /** The Reset (rsBtn) over the cards as drawn (pitch box b, `boxes`: cardBoxes), shown while something of yours is
   *  there to take back (S.reset): at its slot (resetSlot, RESET_GAPS) where it meets no card and takes no card
   *  behind's room (resetFits); else at the top, the tokens given way (their plates stay); else not drawn (the You
   *  sheet's Reset plan). Its target reaches down only to the card or token under it. Hidden with focus on it, it hands
   *  focus to Player data. Placed by every draw of the choices (renderDecks), before they reach up to it. */
  function placePills(b, boxes) { const { RESET_GAPS, S, decks, pdBtn, rsBtn } = V;
    rsBtn.hidden = !S.reset;
    rsBtn.classList.remove('near');
    if (!rsBtn.hidden) {
      const last = [...decks.querySelectorAll(':scope > .ah-tok')].filter((t) => t.isConnected).at(-1) ?? null;
      // (no token and no room at its slot: the corner's top)
      const at = [...RESET_GAPS.map((gap, i) => [resetSlot(last, gap), i > 0]), ...(last ? [] : [[6, false]])]
        .find(([y, near]) => { rsBtn.style.top = `${y}px`; rsBtn.classList.toggle('near', near); return resetFits(boxOf(rsBtn, b), boxes); });
      // (no slot: a 320 px phone at a large text size with a token in the corner: the Reset goes at the top and the
      // tokens under it give way, the best's plate staying on its player (data-mv-out), every choice the Week sheet's;
      // a status never gives way)
      const toks = [...decks.querySelectorAll(':scope > .ah-tok')];
      if (at == null && toks.length && !toks.some((t) => t.matches('.st'))) {
        rsBtn.style.top = '6px'; rsBtn.classList.remove('near');
        if (resetFits(boxOf(rsBtn, b), boxes)) {
          for (const t of toks) t.remove();
          if (toks.some((t) => t.matches('.mv'))) decks.toggleAttribute('data-mv-out', true);
          const gone = [decks.dataset.tokOut, ...toks.map((t) => t.dataset.plan).filter(Boolean)].filter(Boolean).join(' ');
          if (gone) decks.dataset.tokOut = gone;
        } else rsBtn.hidden = true;
      } else if (at == null) { rsBtn.hidden = true; rsBtn.classList.remove('near'); }
      for (const t of decks.querySelectorAll(':scope > .ah-tok')) t.classList.toggle('ah-over', t === last && rsBtn.matches('.near'));
    }
    if (rsBtn.hidden) { if (rsBtn === document.activeElement) pdBtn.focus({ preventScroll: true }); return; }
    const p = boxOf(rsBtn, b);
    const toks = [...decks.querySelectorAll(':scope > .ah-tok')].map((t) => boxOf(t, b));
    const under = Math.min(Infinity, ...boxes.filter((c) => c.x < p.x + p.w && p.x < c.x + c.w && c.y >= p.y).map((c) => c.y - p.y - p.h),
      ...toks.filter((c) => c.y > p.y).map((c) => (c.y - p.y - p.h) / 2));
    rsBtn.style.setProperty('--down', `${Math.max(-1, Math.min(9, Math.floor(under - 1)))}px`);
  }
  /**
   * The choices on the pitch as drawn (decksOf, litOf; S.M: the model renderWeek drew), placed from the mounted cards'
   * boxes (forkcast/design_marks/DECISION.md, design.md; owner, 2026-10-23): the week's one best an ink plate over the
   * player it replaces naming the buy and its gain (swapPlate; a plan of several moves ONE plate over its sellers in
   * the top-most of their rows, with the plan's one number, each other seller a small ink tag of his buy: owner,
   * 2026-10-25); each other place whose best single move beats rolling, and each with a choice ready or checking, a
   * quiet plate of its first choice (placeFirst), its number whatever its sign, "checking…" while the week checks;
   * your own buy's a quiet plate naming the player you sold (owner, 2026-10-26). A tap on a plate opens his place;
   * only the best is ink. Nothing is named until the week's checks are in, then once with a fade, and nothing where
   * nothing can act (a plan you can't change, GW A under way). The week's own choices go beside the goal (tokensOf); a
   * hidden heading names them for VoiceOver. Drawn after the pitch mounts (render), a solve lands (renderPair) and on
   * a resize (refitPitch).
   */
  /** Places ({c: his card's box}) in reading order, top row first, and those in its top-most row: the best's plate
   *  spans them (renderDecks), its token names their buys (tokensOf). → [row0, all] */
  const topRow = (xs) => { const all = [...xs].sort((p, q) => p.c.y - q.c.y || p.c.x - q.c.x); return [all.filter((x) => Math.abs(x.c.y - all[0].c.y) < 2), all]; };
  return { openWeek, renderLine, fitFacts, weekGain, boxOf, cardBoxes, reachLabels, labelWalls, sideRoom, cardIn, entryKey, resetSlot, placePills, topRow };
}
