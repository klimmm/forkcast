// screen.js mount: the pitch, the GW rail, the total and Player data

import { FLASH, MINUS, boardMarks, boughtIn, inFor, plan, span } from './core.js';
import { choosing, fplOf, inkAt, planHasYours, replaceable, replaceWith } from './buys.js';
import { h, fmt, fill, toastRegion, chipName, plural, icon, roving, xpNum, xpGain } from '../../ui.js';
import { CHIPS_OFF, COPY, gwFlags } from '../calls.js';
import { chipsAvail, squadWeek } from './pieces.js';
import { tickWas, totalShift } from './edits.js';
import * as E from '../../plan/engine.js';
import { fitNum, oneLook } from './screen.js';

export function pitchPart(V) {
  /** Bring in's second step on the pitch: who he can replace in green, the rest quiet (choosing). */
  function paintChoosing(P, w) { const { ctx, pitchHost } = V;
    const who = choosing(ctx, P, w.gw), can = new Set(who ? replaceable(ctx, who.id, w.gw).map((x) => x.out) : []);
    pitchHost.classList.toggle('ah-choosing', !!who);
    for (const c of pitchHost.querySelectorAll('.pm-card[data-id]')) {
      const id = Number(c.dataset.id);
      c.classList.toggle('ah-can', can.has(id));
      c.classList.toggle('ah-cant', !!who && !can.has(id));
    }
  }
  /** The card's swap on the pitch before its tap, a substitution board (design_1105h; owner, 2026-11-05: "Yes, build it"): the
   *  team you would have, in its own formation ("why the fuck rice is fwd": a slot of the team as it is put a midfielder up
   *  front), each player you buy in the go colour over the struck name of the one you sell, as the card's title says it, a
   *  player only changing places between pitch and bench under an arrow, his card otherwise as it was (owner, 2026-11-06, "it
   *  looks like i replacing de cuper by transfer even when it is just bench swap"), a moved armband in the go colour. `after`:
   *  GW w's team with the swap made (swapWeek), null none; `small`: a transfer the plan would not make, in white, no go colour
   *  (owner, 2026-11-06, "transfer model will make and that it consider small look just same"). Each card keeps the id of the
   *  place it stands for, the team as it is, for the card's tokens (renderDecks). */
  function paintBoard(P, w, after, small = false) { const { S, pitchHost } = V;
    // (never under an open place: a pitch drawn anew shuts it; drawn once it is shut)
    if (S.place) return;
    const key = after ? JSON.stringify([w.gw, after.xi, after.bench, after.captain, after.vice, small]) : null;
    if (key === (S.board?.key ?? null) && (!key || S.board.pitch === S.pitch)) return;
    if (S.board?.key) { S.pitch = null; renderPitch(P, w); paintChoosing(P, w); }
    S.board = { key, pitch: S.pitch };
    pitchHost.classList.toggle('sb-small', !!after && small);
    if (!after) return;
    const nm = P.L.name, marks = boardMarks(w, after, P.L.pos);
    mountHere({ ...pitchProps(P, w), xi: after.xi, bench: after.bench, captain: after.captain, vice: after.vice });
    const marked = marks.map((m) => ({ ...m, c: pitchHost.querySelector(`.pm-card[data-id="${m.id}"]`) })).filter((m) => m.c);
    for (const { place, id, sold, kind, c } of marked) {
      if (kind === 'in') {
        c.querySelector('.pm-pf')?.remove();
        c.querySelector('.pm-pn').after(h('span.pm-pf.sb-off', { 'aria-hidden': 'true' }, h('span.pm-fx', null, nm(sold))));
      }
      c.classList.add('sb-card', `sb-${kind}`);
      c.setAttribute('aria-label', kind === 'down' ? COPY.boardBench(nm(id)) : COPY.boardSaid(nm(id), nm(sold ?? place)));
      c.dataset.id = place;
    }
    for (const [k, was, now] of [['c', w.captain, after.captain], ['v', w.vice, after.vice]]) {
      if (was !== now) pitchHost.querySelector(`.pm-badge[data-badge="${k}"]`)?.classList.add('sb-arm');
    }
  }
  /** The pitch's props for week w of plan view P (renderPitch's): its lineup, buys, plate and taps. */
  function pitchProps(P, w, plate = plateOf()) { const { armbandSheet, ctx, subSheet, tapIn, whyMove } = V;
    const d = ctx.data;
    return {
      xi: w.xi, bench: w.bench, captain: w.captain, vice: w.vice, chip: w.chip, players: d.byId, gw: w.gw, horizon: d.xpGws,
      first: w.gw === P.A, bought: boughtIn(P, w.gw), inFor: inFor(P, w), second: plate.second, approx: w.approx,
      why: w.moves.filter((m) => whyMove(P, w, m.in)).map((m) => Number(m.in)),
      benchRow: true, gapRows: true, label: `Your plan at GW${w.gw}`,
      // GW A's differences from your FPL team marked (pitch.js fplMarks); a later GW has no FPL team to set it against
      // (fplOf). d's own, so S.pitch.data keys it
      fpl: fplOf(ctx, P, w),
      // a tap on the C or the V: the armband's list (armbandSheet); on a player the week buys (tagged IN), his
      // transfer's Why sheet; anywhere else on a card, his sheet (tapIn). The plan as it is at the tap: a pitch drawn
      // the same is not mounted again (renderPitch)
      onPlayer: (id, e) => {
        if (choosing(ctx, plan(ctx), w.gw)) { replaceWith(ctx, id); return; }
        const b = e?.target?.closest?.('.pm-badge[data-badge="c"], .pm-badge[data-badge="v"]');
        if (b) { armbandSheet(b.dataset.badge, w.gw); return; }
        tapIn(w.gw, id);
      },
      // a tap on a sub's label on the bench ("1", his order; the keeper's none: m-ahead.css .pm-blp): the starters he can replace (subSheet)
      onBench: (id) => { if (choosing(ctx, plan(ctx), w.gw)) replaceWith(ctx, id); else subSheet(id, w.gw); },
    };
  }
  function renderPitch(P, w) { const { S, ctx, pitchHost, rsBtn } = V;
    const d = ctx.data;
    // the one Reset (rsBtn): what of yours it takes back here, its words and name for that (where it fits: placePills,
    // once the pitch is drawn)
    const lu = !!w.lineup, mine = planHasYours(P);
    S.reset = lu || mine ? { lu, plan: mine, gw: w.gw } : null;
    rsBtn.hidden = !S.reset;
    rsBtn.disabled = !P.editable;
    rsBtn.classList.toggle('lu', lu);
    rsBtn.classList.toggle('rp', mine);
    if (S.reset) {
      const both = lu && mine;
      fill(rsBtn, h('span.ah-pdl', null, both ? 'Reset' : lu ? 'Reset lineup' : COPY.resetAll), both ? h('span.ah-chev', { 'aria-hidden': 'true' }) : null);
      rsBtn.setAttribute('aria-label', both ? COPY.resetSaid(w.gw) : lu ? `Reset GW${w.gw} lineup to the plan's best` : COPY.planResetSaid);
      if (both) rsBtn.setAttribute('aria-haspopup', 'dialog');
      else rsBtn.removeAttribute('aria-haspopup');
    }
    const plate = plateOf();
    const props = pitchProps(P, w, plate);
    // the same pitch as drawn (a re-draw for a chip, a rule or the week line): nothing to mount again; the same but its
    // chip (a Bench Boost planned or taken off): only the bench's label changes (pitch.setPitchChip)
    const key = JSON.stringify([...['xi', 'bench', 'captain', 'vice', 'gw', 'first', 'bought', 'inFor', 'why', 'approx'].map((k) => props[k] ?? null), plate.key]);
    const same = S.pitch?.key === key && S.pitch.data === d && pitchHost.isConnected && pitchHost.firstChild;
    if (same && S.pitch.chip === (props.chip ?? null)) return;
    if (same && ctx.pitch.setPitchChip(pitchHost, props.chip)) { S.pitch.chip = props.chip ?? null; return; }
    S.pitch = { key, data: d, chip: props.chip ?? null };
    mountHere(props);
  }
  /** The pitch on Ahead (pitch.mountPitch), Player data, Reset lineup, Reset plan and the choices on it first
   *  (m-ahead.css: its top-right corner, beside the goal, then the layer the choices are drawn in: renderDecks; read
   *  before the eleven). An open place closes: its cards were the pitch's. */
  function mountHere(props) { const { S, cardBoxes, cardIn, chipsHint, closePlace, ctx, decks, pdBtn, pitchHost, settle } = V;
    const pill = pdBtn === document.activeElement ? pdBtn : null;
    // a place open with the focus in it: on his card once the pitch is mounted anew (a keyboard's, VoiceOver's)
    const inPlace = S.place && pitchHost.querySelector(':scope > .pm > .ah-place')?.contains(document.activeElement) ? S.place.a : null;
    closePlace(false);
    // the cards as they stand, for a landing's motion on the pitch mounted now (landMotion)
    const old = pitchHost.querySelector(':scope > .pm');
    S.snap = old ? new Map(cardBoxes(old).map((c) => [c.id, { rect: c.n.getBoundingClientRect(), node: c.n.cloneNode(true) }])) : null;
    ctx.pitch.mountPitch(pitchHost, props);
    if (inPlace) cardIn(pitchHost.querySelector(':scope > .pm'), inPlace)?.focus({ preventScroll: true });
    pitchHost.querySelector(':scope > .pm')?.prepend(pdBtn, decks);
    if (pill) (pill.hidden ? pdBtn : pill).focus({ preventScroll: true });  // a corner pill keeps focus over a pitch drawn anew
    pitchHost.querySelector(':scope > .pm > .pm-field')?.append(chipsHint);
    // a swipe's new week comes in from the side the finger went (pitchEnd: S.slide)
    if (S.slide != null) { settle(S.slide); S.slide = null; }
  }

  /** The pitch's hint (HINTS) while still to learn on a plan you can change (P, w: the drawn plan view and week; none:
   *  as last drawn, a resize): the chips' while the week can still play a Bench Boost or a Triple Captain, only where it
   *  covers no card and no corner pill. */
  function placeHint(P = V.S.hintAt?.P, w = V.S.hintAt?.w) { const { HINTS, S, pitchHost } = V;
    S.hintAt = { P, w };
    for (const [n, k] of HINTS) {
      n.hidden = CHIPS_OFF || !P?.editable || !w || S.learnt.has(k) || !chipsAvail(P, w.gw).some((c) => c === 'bb' || c === 'tc');
      if (n.hidden || !n.isConnected) continue;
      // a line wider than its room (each kept whole: m-ahead.css) is no hint there either
      if (n.scrollWidth > n.clientWidth + 1) { n.hidden = true; continue; }
      const hits = () => {
        const r = n.getBoundingClientRect();
        const meets = (b) => b.left < r.right && r.left < b.right && b.top < r.bottom && r.top < b.bottom;
        return [...pitchHost.querySelectorAll('.pm-pl, .pm-bs, .ah-pp:not([hidden]), .ah-sp, .ah-tok')]
          .map((x) => [x, x.getBoundingClientRect()]).filter(([, b]) => meets(b));
      };
      n.style.removeProperty('--ph-lift');
      let over = hits();
      // the chips' hint lifts over a sub's card behind in the field's foot; over anything else, or still over it
      // lifted, it hides
      if (k === 'chips' && over.length && over.every(([x]) => x.matches('.ah-sp'))) {
        const top = Math.min(...over.map(([, b]) => b.top));
        n.style.setProperty('--ph-lift', `${Math.ceil(n.getBoundingClientRect().bottom - top + 4)}px`);
        over = hits();
      }
      if (over.length) n.hidden = true;
    }
  }

  /** No change can be made in GW g: a plan not yours, or GW A under way (inkAt). */
  const frozenAt = (P, g) => { const { ctx } = V; return !P.editable || inkAt(ctx, P, g); };


  /**
   * The GW switcher (FPL's segmented control): per GW "GW6" (its chip's code, a hit) over what the week does (the
   * buy's name or "2 in"; nothing for a week with no transfer; a Free Hit or Wildcard week its chip's code alone, its
   * "8 changes" spoken only); weeks after GW A in pencil ink (re-planned each week); GW A short at FPL's prices its
   * bank in coral. The week's points are on it and in its spoken label. A chip shows on a tile only when your plan
   * plays it there ("BB" on its token colour). "DGW" / "BGW" for a GW of the window where a club plays twice / doesn't
   * play (meta.dgw_bgw.window, calls.gwFlags), in muted ink. The viewed GW sits on the thumb; the window's total is
   * the switcher's accessible summary and the line under it.
   */
  /** Week x's tab in the stack beside the viewed week g: its place and depth (m-ahead.css .ah-stack), under the card or
   *  above it, the viewed week's own the card. The plan's tabs and the first plan's alike, so none moves when it lands. */
  const tabAt = (x, g) => ({ style: { order: -x, '--d': Math.abs(x - g) }, down: x < g, sel: x === g });
  function renderRail(P, g) { const { rail, setGw, ticks, totalEl } = V;
    const past = edgeTicks(P);
    rail.style.setProperty('--n', P.weeks.length + past.length);
    rail.style.setProperty('--i', Math.max(0, P.weeks.findIndex((w) => w.gw === g)));
    const win = P.b?.meta?.dgw_bgw?.window;
    // the fill replaces a focused tile (an arrow key moved the week): the one now checked takes the focus
    const had = ticks.contains(document.activeElement);
    fill(ticks,
      P.weeks.map((w) => {
        const sq = squadWeek(w);
        const n = w.moves.length;
        // the tile says what the week does (the buy's name, "2 in", a Wildcard or Free Hit week's chip token alone) and
        // its points; the incoming name only when the week has a transfer (no "Roll" on every tile)
        const change = sq || !n ? '' : n === 1 ? P.L.name(w.moves[0].in) : `${n} in`;
        const shown = fmt.num(w.points);
        const flags = gwFlags(win, w.gw);
        // GW A short at FPL's prices shows in coral in place of its change (FPL can't make the moves as they are); a
        // later week's is price drift (the solver keeps it in budget at its prices), and never a ≈ week's (the estimate
        // keeps the moves an edit leaves unfunded, the solve re-funds them)
        const over = w.gw === P.A && w.bank != null && w.bank < -1e-9 && !P.approx.has(w.gw);
        // the week's points with no transfers of yours, struck before its own ("~~60.0~~ 61.8 xP": the week's own
        // forecast, no sign, so never read as a choice's number: tickWas), on every week your plan changes, the one on
        // screen too, while your plan has them (P.bare, bareRef; owner, 2026-10-26); spoken "60.0 points without your
        // transfers"; where the tile has no room it goes before the "xP" (fitNum below)
        const was = P.bare?.has(w.gw) ? tickWas(w, P.bare.get(w.gw)) : null;
        const chg = !!was;
        const chgMark = was ? h('s.ah-was', { 'aria-hidden': 'true' }, was) : null;
        const { style, ...at } = tabAt(w.gw, g);
        return h('button.ah-tick', {
          type: 'button', role: 'radio', 'aria-checked': String(w.gw === g), dataset: { gw: w.gw }, style, class: { ...at, heal: (P.mark ?? P.approx).has(w.gw), lu: !!w.lineup, pencil: w.gw > P.A, chg },
          // VoiceOver and Switch Control activate with a click and no pointer (detail 0); a touch is the bar's own
          onClick: () => setGw(w.gw),
          'aria-label': `Gameweek ${w.gw}, ${fmt.num(w.points)} points, ${w.gw > P.A ? 'provisional, ' : ''}${sq ? plural(n, 'change') : !n ? 'roll' : `${w.moves.map((m) => P.L.name(m.in)).join(', ')} in`}${w.hits ? `, ${MINUS}${E.HIT_COST * w.hits}` : ''}${w.chip ? `, ${chipName(w.chip)}` : ''}${flags.length ? `, ${flags.map((f) => (f === 'DGW' ? 'a double gameweek' : 'a blank gameweek')).join(' and ')}` : ''}${w.lineup ? ', your lineup' : ''}${was ? `, ${COPY.tileWas(was)}` : ''}`,
        },
        // two lines, every week the same height: "GW6" with its marks and what the week does (the buy's name, "2 in";
        // it ellipsises first, GW6 never), then the points
        h('span.g', null, h('span.gn', null, `GW${w.gw}`), w.chip || w.hits || flags.length ? h('span.m.dots', { 'aria-hidden': 'true' }, flags.map((f) => h('span.gwk', null, f)),
          w.chip ? h('em', null, w.chip.toUpperCase()) : null,
          w.hits ? h('i.hit', null, ` ${MINUS}${E.HIT_COST * w.hits}`) : null) : null,
          change ? h('span.c', null, change) : null),
        h('span.a', null, V.adviceOf(P, w)),
        // the points never recoloured for the window's lowest week (GW A short at FPL's prices stays coral: a fact);
        // the week's forecast in its blue with "xP" (xpNum), a change's mark before it
        h('span.p.m-num', { class: { 'g-loss': over } }, over ? fmt.money(w.bank) : [chgMark, xpNum(shown)]));
      }), past);
    V.strip.style.order = -g;
    fitRail();
    roving(ticks);
    if (had) ticks.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
    fill(totalEl, `${span(P.gws)} total, `, totalNum(P), ' points');
  }
  /** A changed week's mark (renderRail) where its tile has no room for it whole beside the points and their "xP",
   *  inside the tile's padding (a 320 pt screen, a larger text size): closer first, then the points' "xP" goes, the
   *  struck number last (owner, 2026-10-27); one look across the rail's marked tiles, as the pitch's plates (oneLook).
   *  Again on a resize or a new text size (refitPitch). */
  function fitRail() { const { ticks } = V;
    // (the tabs on screen: the viewed week's is the card, no size of its own, and its "no room" went to every tab, its struck
    // number with it; owner, 2026-11-05: "why crosed points only this week")
    const marked = [...ticks.querySelectorAll('.ah-tick:has(.ah-was)')].filter((t) => t.offsetWidth);
    for (const t of marked) {
      const p = t.querySelector('.p'), cs = getComputedStyle(t);
      fitNum(t, () => p.getBoundingClientRect().width > t.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 0.5, ['close', 'noxp', 'nowas']);
    }
    oneLook(marked, ['close', 'noxp', 'nowas']);
  }
  /** The GW switcher's GWs past the plan (owner, 2026-10-14): the longest plan's GWs (reach) the plan doesn't cover
   *  (Settings → Plan ahead), each a tile with a lock and no points (.edge); a tap, a scrub's end or a key says how to
   *  plan it, or that it is locked (setGw). I: info(ctx), a plan view, or {reach, gws} while the first week is planned
   *  (renderBaking). */
  const edgeTicks = (I) => { const { setGw } = V; return I.reach.filter((x) => !I.gws.includes(x)).map((x) => h('button.ah-tick.edge.pencil', {
    type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-disabled': 'true', dataset: { gw: x },
    onClick: (e) => { if (e.detail === 0) setGw(x); },
    'aria-label': `Gameweek ${x}, locked: past your plan`,
  }, h('span.g', null, h('span.gn', null, `GW${x}`)), h('span.p', null, h('span.ah-tlock', { 'aria-hidden': 'true' }, icon('lock', { size: 13 }))))); };
  const toastOver = () => !!globalThis.document?.querySelector('#toasts:not([data-place="dock"]) > .toast:not(.leaving)');
  function renderTotal(P) { const { S, TOTAL_MS, ctx, el, toastGone, totLine, totSaid } = V;
    // (its window too: a horizon changed in Settings counts another window, never a change of yours, horizon QA:
    // "(total −169.7)" one week against four)
    const key = `${P.entry}|${P.A}|${P.gws.join(',')}`;
    if (!P.healing) {
      // a change an Undo brought (FLASH.undo, the first total drawn since it) in plain ink: no gain or loss of yours;
      // none when it is back where the change it takes back started (totalShift)
      const undo = !!FLASH?.undo && FLASH.at !== S.tot?.flash;
      const was = S.tot?.key === key ? S.tot : null;
      const t = totalShift(was, P.total, undo);
      if (t.shift === 'back') { S.totDelta = null; fill(totSaid); }
      else if (t.shift != null) {
        const over = !!toastGone && toastOver();
        S.totDelta = { from: was.v, to: P.total, at: over ? null : Date.now(), undo };
        if (over) toastGone.observe(toastRegion(), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        fill(totSaid, `${span(P.gws)} total ${fmt.num(P.total)}, ${fmt.signed(t.shift)} points`);
      }
      S.tot = { key, v: P.total, flash: FLASH?.at, before: t.before };
    }
    const d = S.totDelta?.at != null && !P.healing && Date.now() - S.totDelta.at < TOTAL_MS ? S.totDelta : null;
    fill(totLine, h('span.k', null, `${span(P.gws)} `),
      totalNum(P),
      // the change blue with "xP" as the total, an Undo's too (xpGain; owner, 2026-10-22: no green or red number, its
      // sign its direction), named what it is beside a week's "vs rolling" (review 7, 2026-11-02: one baseline each)
      d ? h('span.ah-tdelta', { style: { '--left': `${TOTAL_MS - (Date.now() - d.at)}ms` } }, ` (${COPY.totalChange} `, xpGain(d.to - d.from), ')') : null);
    clearTimeout(S.totTimer);
    if (d) S.totTimer = setTimeout(() => { S.totDelta = null; fill(totSaid); const Q = plan(ctx); if (Q && el.isConnected) renderTotal(Q); }, TOTAL_MS - (Date.now() - d.at));
    keepGwLine();
  }
  /** The window's total as drawn, the solver's plan's: shimmering while an edit is checked or a re-plan runs
   *  (replanning), the plan before it, never an edit's ≈ (owner, 2026-10-26), a forecast in its blue with "xP" (xpNum):
   *  the switcher's summary and the total line under it. */
  const totalNum = (P) => { const { replanning } = V; return h('span.v.m-num', { class: { 'm-pending': P.healing || replanning() } }, xpNum(fmt.num(P.total), 'span.ah-tnum')); };
  /** The GW line on one line under the team's name (the header is sized for it: fitHead; owner, 2026-10-22: never cut
   *  the countdown): where the total with its passing extras (an edit's change "(+10.1 xP)") would take it to another
   *  line or past its column, drop in order: the change's "xP", the window's label ("GW6–9"), the change, the total
   *  (the switcher's summary still says it: totalEl); the deadline alone wraps only where it can't hold one line (a
   *  larger text size). The total never wraps past the screen's side (m-ahead.css .ah-tot). While it re-plans the
   *  status words ellipsise first (paintPlanStatus), the total's parts going only where the countdown would be cut or
   *  the words left under 2 em. */
  function keepGwLine() { const { dlEl, gwline, totLine } = V;
    gwline.classList.remove('ah-tight', 'ah-nomark', 'ah-nototal');
    const one = parseFloat(getComputedStyle(gwline).lineHeight) * 1.5, words = gwline.classList.contains('ah-planning') ? dlEl.querySelector('.ah-plw') : null;
    const keeps = () => gwline.getBoundingClientRect().height <= one && gwline.scrollWidth <= gwline.clientWidth + 0.5
      && (!words || (dlEl.scrollWidth <= dlEl.clientWidth + 0.5 && words.clientWidth + 0.5 >= Math.min(words.scrollWidth, 2 * parseFloat(getComputedStyle(words).fontSize))));
    if (keeps()) return;
    // the change's "xP" goes first, the total beside it saying it, then the label
    for (const c of ['ah-nomark', 'ah-tight']) {
      gwline.classList.add(c);
      if (keeps()) return;
    }
    const d = totLine.querySelector('.ah-tdelta');
    if (d) {
      d.remove();
      gwline.classList.remove('ah-tight');
      if (keeps()) return;
      gwline.classList.add('ah-tight');
      if (keeps()) return;
    }
    gwline.classList.add('ah-nototal');
  }

  // ---------------------------------------------------------------- F16 Player data: what the second plate shows

  /** FPL's "Player data" options this bundle can back (a field it carries): the second plate's content (mountPitch
   *  `second`), the sheet's label and the button's short one. */
  const sellOf = () => { const { ctx } = V; return new Map((ctx.data?.base?.squad || []).filter((x) => x.sell_price != null).map((x) => [Number(x.id), x.sell_price])); };
  const hasField = (f) => { const { ctx } = V; return !!ctx.bundle?.players?.fields?.includes(f); };
  const plateOk = (x) => (!x.field || hasField(x.field)) && (x.ok?.() ?? true);
  /** The chosen option (this browser's, localStorage: ctx.api.local never throws), the default when the bundle can't
   *  back it → {key, label, short, second}. */
  function plateOf() { const { PLATES, PLATE_KEY, S, ctx } = V;
    const k = ctx.api.local.get(PLATE_KEY);
    const x = PLATES.find((o) => o.key === k && plateOk(o)) ?? PLATES[0];
    if (x.key === 'sell') S.sell = sellOf();
    return { ...x, second: x.second ?? { label: x.label, text: x.text, bar: x.bar } };
  }
  function renderPdBtn() { const { pdBtn } = V;
    const x = plateOf();
    fill(pdBtn, h('span.ah-pdl', null, x.short), h('span.ah-chev', { 'aria-hidden': 'true' }));
    pdBtn.setAttribute('aria-label', `Player data: ${x.spoken ?? x.label}`);
  }
  /** FPL's "Player data" sheet: a radio list; a choice re-draws the plates, is kept in this browser and closes it. */
  function playerDataSheet() { const { PLATES, PLATE_KEY, ctx, render } = V;
    const now = plateOf().key;
    ctx.sheets.open({
      title: 'Player data', detent: 'large', cls: 'ah-pdsheet',
      build(body, sheet) {
        body.append(roving(h('div.ah-pd', { role: 'radiogroup', 'aria-label': 'Player data' }, PLATES.filter(plateOk).map((x) => h('button.ah-pdo', {
          type: 'button', role: 'radio', 'aria-checked': String(x.key === now), dataset: { plate: x.key }, 'aria-label': x.spoken ?? x.label,
          onClick: () => { ctx.api.local.set(PLATE_KEY, x.key); sheet.close(); render(); },
        }, h('span', null, x.label), h('span.ah-radio', { 'aria-hidden': 'true' })))), { pick: (b) => b.click() }));
        // Shirts: Drawn | Official (kits.js kitSourceRow: this browser's, applies to every shirt at once; the sheet stays)
        body.append(ctx.kits.kitSourceRow());
        // what the opponents' colours mean, in one line (FPL's fixture difficulty in pale tints, app.css --fdr-2..4,
        // plan-pitch.css --fdr-1 and --fdr-5)
        body.append(h('p.ah-fdr', { 'aria-label': 'Opponent colours: fixture difficulty from very easy to very hard' }, h('span', null, 'Opponent colour:'),
          [['1', 'very easy'], ['2', 'easy'], ['3', 'average'], ['4', 'hard'], ['5', 'very hard']].map(([n, t]) => h(`span.ah-fdrc.fdr-${n}`, { 'aria-hidden': 'true' }, t))));
        // …and its case, the venue (pitch.oppText: one style on every screen)
        body.append(h('p.ah-fdr', null, h('span', null, 'Opponent name:'), COPY.oppCase));
        // the forecast's scale and noise are model internals: the You sheet's Dev mode section shows them
      },
    });
  }
  return { paintBoard, paintChoosing, pitchProps, renderPitch, mountHere, placeHint, frozenAt, renderRail, fitRail, edgeTicks, tabAt, toastOver, renderTotal, totalNum, keepGwLine, sellOf, hasField, plateOk, plateOf, renderPdBtn, playerDataSheet };
}
