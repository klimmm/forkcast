// screen.js mount: the Week sheet's rows, its words and the Why sheet

import { COPY, priceMorning, shownDelta, waitLines } from '../calls.js';
import { h, fmt, fill, icon, xpGain } from '../../ui.js';
import { fundingOf, moveTo, movesInOrder, pairOf, pinOfMove, presolveTaps, removeMove, rowGains, weekTaps, whenOf, whenOnBase, whyFacts } from './presolve.js';
import { asTaken, choiceVs, mineAny, planBack, planBaseline, plansOf, yoursAt } from './plans.js';
import { FLASH, MINUS, NIGHT_KEY, WAIT_KEY, WHY_SHEET, capFirst, compare, draftOf, dropMove, flatMoves, memOf, span, weekOf } from './core.js';
import { freedBy, liftsLive, rowName } from './buys.js';
import { driftSay, keep, removeRule, toastOf, veto } from './edits.js';
import { clearGain, itbWords, weekFacts } from './pieces.js';
import * as E from '../../plan/engine.js';
import { listedRules } from './screen.js';

export function weekPart(V) {
  function drawWeek(P, w, M) { const { S, ap0, asksHost, changeRow, ctx, ftAfter, litPays, planRow, plansHeading, rollFacts, shareWeek, waitClock, waitNow, weekGain, xferRow } = V;
    const WN = M.wait ? waitNow() : null;
    const g = w.gw, W = S.week;
    if (W.g !== g) {
      W.g = g;
      if (W.title) W.title.textContent = COPY.weekTitle(g);
      W.sheet.el.setAttribute('aria-label', COPY.weekTitle(g));
      W.host.setAttribute('aria-label', COPY.weekTitle(g));
    }
    const rows = M.sq ? [h('p.ah-gwnote.m-foot', null, COPY.chipWeek(M.sq, g, M.sq === 'fh' ? ftAfter(P, w) : null)), h('div.ah-moves.sq', null, w.moves.map((m) => changeRow(P, w, m)))]
      : movesInOrder(P, w).map((m, i) => xferRow(P, w, m, i));
    const name = plansHeading(P, g);
    // (the week's best, the pitch's lit move, its first row: the sheet and the pitch say one best; owner, 2026-11-02, a bake
    // road's "Vuskovic → N.Williams, Ajayi → Diop, Dewsbury-Hall → Rice +0.3" over the lit Gabriel → N.Williams)
    const plans = M.lit?.move ? [M.lit.move, ...M.plans.filter((pl) => pl !== M.lit.move)] : M.plans;
    // the week's facts under the title, as the week line's (rollFacts: weekFacts with a short bank's words; "3 FT ·
    // £0.6m ITB · 4 FT in GW9": owner, 2026-10-22, Help's promise), in every week but GW A under way (its sentence)
    const facts = M.live ? null : rollFacts(P, w);
    // a week of two or more transfers: the week's number over them, the line's (its rows have none: shareWeek)
    const wg = !M.live && !M.sq && shareWeek(w) ? weekGain(P, w) : null;
    fill(W.host,
      wg ? h('p.ah-bs.ah-wfacts.ah-wgain', { dataset: { row: 'weekgain' } }, h('b', null, COPY.nTransfers(w.moves.length)), hitTag(w.hits), ' ', numOf(wg.wait, wg.cmp, ap0(P, g)),
        wg.cmp && !wg.wait && wg.vs ? ` vs ${COPY.planVsRoll}` : null) : null,
      facts ? h('p.ah-bs.ah-wfacts', { 'aria-label': facts.said }, facts.rest) : null,
      M.live ? h('div.ah-brow.ah-bq.ah-blive', { role: 'status' }, h('span.ah-bt', null, M.liveText)) : null,
      M.notices.map((x) => x.row?.()),
      rows,
      // while they solve, how far, as the strip's wait line says it, the same one wait (waitNow): "Planning GW8 · 3 of 9 ·
      // 0:12" (waitClock)
      // rows sharing an "instead of …" get it as a subheading ("Instead of Palmer")
      M.plans.length ? [h('div.ah-wh', { dataset: { at: 'plans' } }, h('h3', null, name),
        WN ? h('p.ah-bs', null, `${WN.word}${waitLines({ scope: WN.scope, prog: WN.prog })[0]}`, S.wait ? h('span', { 'aria-hidden': 'true' }, ' · ', waitClock()) : null) : null),
        // the two groups (rows that add to your transfer, rows sharing the "instead of …") in their best rows' order,
        // rows within each best first: by M.plans' own order, best first once none checks (plansOf's byGain), the slots
        // held while they check (heldOrder)
        // (never a pair's move the week can't make alone, plansOf `needs`: a dead row whose reason was the phone's sum,
        // fitOf)
        ...[false, true].map((sh) => ({ sh, grp: plans.filter((pl) => !pl.needs && (planBack(P, g, pl).back === M.sharedBack) === sh) }))
          .filter((x) => x.grp.length).sort((x, y) => plans.indexOf(x.grp[0]) - plans.indexOf(y.grp[0])).map(({ sh, grp }) => {
            const rows = grp.map((pl) => planRow(P, g, pl, { shared: M.sharedBack, closes: true, lit: litPays(pl, M), best: M.lit?.move === pl }));
            // (rows under it marked data-under="instead": the QA's chip-week-plans reads them)
            if (sh) for (const r of rows) r.dataset.under = 'instead';
            return sh ? [h('div.ah-wh', { dataset: { at: 'instead' } }, h('p.ah-bs', null, capFirst(M.sharedBack))), rows] : rows;
          })] : null,
      asksHost.firstChild ? [h('div.ah-wh', { dataset: { at: 'rules' } }, h('h3', null, COPY.rulesHead)), asksHost] : null);
    // its rows' taps solved ahead while open (presolveTaps): the takes and Removes the week's own leave (weekTaps)
    if (P.editable && !M.live && M.settled) {
      const { takes, removes, sig } = weekTaps(ctx, P, g, M.plans);
      presolveTaps(ctx, [...takes, ...removes], { gw: g, sig, owner: W.sheet });
    }
  }
  /** The status row of a re-plan that couldn't keep your choices (clashLine): a warning glyph, its words, and a Remove
   *  for each choice they name (removeRule: Undo), in the look of a question asked in place (m-a.css .ah-ask). A Remove
   *  that would re-plan GW A under way is off (liftsLive), its reason after the words in another week. */
  function clashRow(P, c) { const { ctx, gwNow } = V;
    const held = c.pins.some((p) => liftsLive(ctx, P, p)) && gwNow(P) !== P.A;
    return h('div.ah-brow.ah-ask.ah-clash', { role: 'status' }, icon('warn', { size: 16 }), h('p.ah-askt', null, held ? `${c.text} ${COPY.live(P.A)}` : c.text),
      c.pins.length ? h('div.ah-askb', null, c.pins.map((p) => h('button.ah-askno', {
        type: 'button', disabled: !P.editable || liftsLive(ctx, P, p), onClick: () => removeRule(ctx, p.id),
      }, `Remove ${rowName(P, p)}`))) : null);
  }
  /** A notice's status row with no control (the look of a question asked in place, m-a.css): the new forecast's
   *  (.ah-news), GW A's lineup to set in FPL (.ah-fplset, fplSets). */
  // text, or [lead, [step]]: the steps a line each under it (COPY.setInFplRow; owner, 2026-10-22: a to-do list, not a
  // sentence)
  const noteRow = (cls, text) => h(`div.ah-brow.ah-ask${cls}`, { role: 'status' }, Array.isArray(text)
    ? h('div.ah-askt', null, h('p', null, text[0]), h('ul.ah-steps', null, text[1].map((x) => h('li', null, x)))) : h('p.ah-askt', null, text));
  /** A new forecast whose best plan beats yours (memory's drift, judged once per roads version): said once per version,
   *  as a toast whose one action takes it ("Use it"); leaving it any other way keeps yours (driftSay). */
  function sayDrift(P) { const { S, ctx } = V;
    const d = P.mem?.drift;
    if (!d?.text || S.driftSaid === d.version) return;
    S.driftSaid = d.version;
    driftSay(ctx, d);
  }
  /** On the suggested plan with no rules of yours, a new forecast that changed its moves beyond the noise is said once
   *  (under the hold, the best road the suggested plans follow: "New forecast, best plan: …", owner, 2026-10-12): a
   *  notice of the week line (after a clash and the price watch), "New forecast: GW6 Scott → Le Fée (was Groß) · 2
   *  changes in GW7–9" (memory.forecastChange). Worked out once per forecast version, then seen on this device
   *  (markSeen: a reload doesn't say it again); on screen until your next edit (FLASH) or the next forecast. The window
   *  total stays the headline. → its text | null */
  function forecastLine(P) { const { S, ctx } = V;
    const m = P.mem;
    if (!m || P.healing) { if (S.fc) S.fc.text = null; return null; }
    if (S.fc?.version !== m.version) {
      const mem = memOf(ctx), fc = mem.forecastChange();
      S.fc = { version: m.version, at: FLASH?.at ?? 0, text: fc ? COPY.newForecast(P.A, fc.gwA, fc.pencil?.text, fc.held) : null };
      mem.markSeen();
    }
    if ((FLASH?.at ?? 0) !== S.fc.at || (!m.hold && m.source !== 'model')) S.fc.text = null;
    return S.fc.text;
  }
  /** GW A's price watch's signature (team, the night its line speaks of, its verdict and amount): "Hide" keeps it away
   *  in this browser (WAIT_KEY) while this stays the same; a new verdict shows again. */
  const waitSig = (P, watch) => { const n = watch.nights[watch.at]; return `${P.entry}:${n.epoch}:${n.verdict}:${n.w}`; };
  function waitWatch(P, watch) { const { ctx, render } = V;
    ctx.api?.local?.set?.(WAIT_KEY, waitSig(P, watch));
    render();
  }
  /** While GW A's price watch shows (or is put away), its counted players' FPL prices and the night it speaks of are
   *  kept in this browser (NIGHT_KEY: written only when they change) for the morning after (sayNight). */
  function keepNight(P, watch) { const { S, ctx } = V;
    const counted = Object.values(watch.players).filter((p) => p.counted && P.L.priceT(p.id) != null);
    const kept = { entry: P.entry, gw: P.A, epoch: watch.nights[watch.at].epoch, prices: Object.fromEntries(counted.map((p) => [p.id, P.L.priceT(p.id)])) };
    const s = JSON.stringify(kept);
    if (s === S.nightKept) return;
    S.nightKept = s;
    S.night = kept;
    ctx.api?.local?.set?.(NIGHT_KEY, s);
  }
  /** The morning after: once the kept night has passed and the bundle is from after it (calls.priceMorning), one quiet
   *  toast with no Undo (nothing changed: "Groß rose overnight (+£0.1m): your GW6 moves still fit", "Prices held
   *  overnight"), then the night is forgotten; another team's or an earlier GW A's is forgotten unsaid. */
  function sayNight(P) { const { S, ctx } = V;
    S.night ??= ctx.api?.local?.json?.(NIGHT_KEY) || false;
    const k = S.night;
    if (!k) return;
    const w = k.entry === P.entry && k.gw === P.A ? weekOf(P, P.A) : null;
    const prices = Object.fromEntries(Object.keys(k.prices || {}).map((id) => [id, P.L.priceT(id)]).filter(([, t]) => t != null));
    const text = w ? priceMorning(k, P.b.meta, { prices, bank: w.moves.length ? w.bank : null, name: P.L.name }) : null;
    if (w && !text) return;
    S.night = false;
    S.nightKept = null;
    ctx.api?.local?.set?.(NIGHT_KEY, null);
    if (text) toastOf(ctx)(text, 'info');
  }
  /** A new GW's plan carried over from the last one (memory.carryOver: Plan.carried) is said once (owner, 2026-10-10),
   *  as a toast with no Undo (a notice, not a history); its one action, Review, opens the Week sheet at Your rules when
   *  one carried. */
  function sayCarried(P) { const { S, ctx, gwNow, weekSheet } = V;
    const t = P.mem?.carried;
    if (!t || S.carriedSaid === t) return;
    S.carriedSaid = t;
    const review = () => { if (S.drawn) weekSheet(gwNow(S.drawn), 'rules'); };
    toastOf(ctx)(t, 'info', listedRules(P, gwNow(P)).length ? { action: { label: 'Review', onClick: review } } : {});
  }

  /** The week line's node (renderLine's; fitBlock's probe and renderBaking's): one strip, its one line (`two`, quiet,
   *  amber when `warn`; `one` the first week's baking words alone) and its `doors` at its right end. A button opening
   *  the Week sheet (`onClick`, its spoken `label`, in a heading for VoiceOver's rotor; `moves` its week's transfers,
   *  `${out}>${in}`; the doors one group, wrapping under the line together when short of room), a status (`status`:
   *  while the first week is planned) or, with neither, a probe hidden from VoiceOver. */
  function barNode({ one = null, two = null, warn = false, label = null, onClick = null, status = false, moves = '', doors = [], cls = '' }) {
    const at = onClick ? { type: 'button', dataset: { row: 'week', ...(moves ? { moves } : {}) }, 'aria-haspopup': 'dialog', 'aria-label': label, onClick }
      : status ? { role: 'status' } : { 'aria-hidden': 'true' };
    return h(`div.ah-pbar${cls}`, null,
      h('div.ah-pbh', onClick ? { role: 'heading', 'aria-level': '3' } : null,
        h(`${onClick ? 'button' : 'div'}.ah-brow.ah-pbt`, at, one ? (one.classList?.contains('ah-bst') ? one : h('span.ah-bt', null, one)) : null,
          two ? h('span.ah-bs', { class: { warn } }, two) : null)),
      doors.length ? h('div.ah-doors', null, doors) : null);
  }

  /** Nodes joined by " · ". */
  const dotted = (xs) => xs.filter(Boolean).flatMap((x, i) => [i ? ' · ' : null, x]);
  /** A separator of the week line's lead (weekLead, renderLine: " · " after it), its words kept (data-t) for fitFacts,
   *  which narrows it to hair spaces where a problem notice after the lead has no room (owner, 2026-10-22). */
  const bsep = (t) => h('span.ah-bsep', { dataset: { t } }, t);
  const textOf = (nodes) => [].concat(nodes).flat(Infinity).map((x) => (x?.textContent ?? x ?? '')).join('');
  /** The week's money only when it is a problem: short at FPL's prices ("−£0.4m in bank", coral), or a later week's
   *  bank below 0 by no more than FPL's sale prices explain (price drift, with its amount and when it is checked again:
   *  "−£0.1m at FPL's sale prices · checked again before GW8"). No bank otherwise, no captain, no week's summary under
   *  the first transfer (owner, 2026-10-09); the hit is on its own row. */
  function bankWarn(P, w) { const { ap0, priceDrift } = V;
    if (priceDrift(P, w)) return COPY.priceDrift(w.bank, w.gw);
    const short = w.bank != null && w.bank < -1e-9 && !ap0(P, w.gw);
    return short ? h('span.g-loss', null, `${fmt.money(w.bank)} in bank`) : null;
  }
  /** The week's bank, which leads the week line's second line where its facts aren't drawn (renderLine): a short one's
   *  words (bankWarn), else "£0.5m ITB" (itbWords), whole. → {node, said} | null */
  function bankLead(P, w) { const { itbNode } = V;
    const warn = bankWarn(P, w);
    if (warn) return { node: warn, said: textOf(warn) };
    const x = itbWords(w.bank);
    return x && { node: h('span.ah-fact', null, itbNode(x[0])), said: x[1] };
  }
  /** The week line's lead where its facts aren't drawn (renderLine): the week's free transfers (before its transfers)
   *  and its bank, weekFacts' first words with bankLead's: "3 FT · £0.6m ITB" (owner, 2026-10-21; Help says it:
   *  calls.js help, "Plans"), a short bank's words in its bank's place. → {node, said} */
  function weekLead(P, w) {
    const [[ft, ftSaid]] = weekFacts(P, w), bank = bankLead(P, w);
    return { node: [h('span.ah-fact', null, ft), bank ? [bsep(' · '), bank.node] : null], said: [ftSaid, bank?.said].filter(Boolean).join(', ') };
  }
  /** An engine estimate as a road (memory.holdRoad's shape) from GW g on: the Why sheet's run strip reads its weeks. */
  const roadOfEv = (ev, g) => ({ weeks: ev.gws.filter((x) => x.gw >= g).map((x) => ({
    gw: x.gw, in: x.bought, out: x.sold, xi: x.xi, bench: x.bench, captain: x.captain, vice: x.vice, chip: x.chip ?? null,
    bank: x.bank, ft_avail: x.ft, ft_used: x.used, hits: x.hits, pred: x.gross,
  })) });
  /**
   * A move's Why sheet (owner, 2026-10-08 and -19): title "Chilwell → Bassey", sub "GW6 · +5.7 xP over GW6–9 vs
   * rolling", its buttons, the two players side by side (sheets/why.js), what else it changes (whyFacts), then the
   * When line. Its number: the plan with the move against the same plan without it, from its GW on (your saved lineups
   * kept), as its row measures it (rowGains); a funding sale is weighed with the buy it pays for, both against neither
   * ("Frees £1.4m so Saka fits · on its own −1.4").
   */
  /** A Why sheet's title, each of its moves' players a link to his card (owner, 2026-10-27; the table's own "Mbeumo ›"
   *  links stay): "Calvert-Lewin → Evanilson", a plan's "Saka → Rice, Gabriel → Saliba" (`nb`: their spaces kept;
   *  `tail`: what it takes back). Drawn in the title's one look, no underline (the table's heads under it carry the
   *  visible link): the names still tap and say "X's card". → node */
  function movesTitle(P, g, moves, { nb = false, tail = '' } = {}) { const { ctx } = V;
    const name = (id) => (nb ? P.L.name(id).replace(/ /g, ' ') : P.L.name(id));
    const link = (id) => h('button.wy-tn', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.cardOf(P.L.name(id)), onClick: () => ctx.openSheet('player', id, { gw: g }) }, name(id));
    return h('span.wy-ttl', null, moves.map((m, i) => [i ? ', ' : null, link(m.out), nb ? ' → ' : ' → ', link(m.in)]), tail ? ` ${tail}` : null);
  }
  function openWhy(P, g, m) { const { ctx, frozenAt, rollOf, rolling, shareWeek } = V;
    // (hidden: the buy's player sheet: WHY_SHEET)
    if (!WHY_SHEET) return ctx.openSheet('player', Number(m.in), { gw: g });
    const nm = P.L.name;
    const w = weekOf(P, g);
    let withIt, without, drafts = null, lead = null, label = null, pairs = null;
    const vr = rollOf(P, w), shares = shareWeek(w);
    const rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const f = fundingOf(P, g, m);
    if (rg && f && f.fund.move === w.moves.find((x) => x.out === m.out && x.in === m.in)) {
      // the funding sale with the buy it pays for, against neither
      const both = new Set([`${f.main.move.out}>${f.main.move.in}`, `${f.fund.move.out}>${f.fund.move.in}`]);
      let d = draftOf(ctx);
      for (const x of movesInOrder(P, w).filter((y) => both.has(`${y.out}>${y.in}`))) d = dropMove(d, flatMoves(d).find((z) => z.gw === g && z.out === x.out) ?? { gw: g, ...x });
      withIt = planBaseline(ctx, P, g);
      without = asTaken(ctx, P, d, g);
      lead = [COPY.funds(fmt.money(freedBy(rg.withIt, g, m)), nm(f.main.move.in)), shares ? null : `on its own ${fmt.signed(rg.cmp.delta)}`].filter(Boolean);
      label = `with ${nm(f.main.move.in)}`;
      pairs = [pairOf(withIt, g, m), pairOf(withIt, g, f.main.move)];
    } else if (rg) { withIt = rg.withIt; without = rg.without; drafts = [rg.dWith, rg.dWithout]; } else {
      const d0 = draftOf(ctx);
      drafts = [d0, dropMove(d0, flatMoves(d0).find((x) => x.gw === g && x.out === m.out) ?? { gw: g, ...m })];
      withIt = planBaseline(ctx, P, g);
      without = asTaken(ctx, P, drafts[1], g);
    }
    // a week's one move: its row's number (rollOf), your plan against the week's roll plan, in the header and the
    // receipt; the line under the grid reads the move's own facts (the plan without it: `own`)
    const own = compare(ctx, withIt, without);
    const c = vr ?? own;
    // "vs rolling" when the move is the week's only one (without it the week rolls), else against the plan without it;
    // "vs rolling, no later transfer" when that roll never spends the free transfer it saves (rolling)
    const rolls = !!vr || !(without.gws.find((x) => x.gw === g)?.moves || []).some((x) => x.ok);
    const vs = rolls ? `vs ${rolling(P, g, vr?.ev ?? without)}` : 'vs without it';
    // in a week of two or more transfers no number of its own (shareWeek): the sub names the week's transfers, the
    // facts keep the money, hits and free transfers but no share (no miss, no better use), its own week on the When
    // line bare
    const sub = shares ? COPY.whyOneOf(g, w.moves.length) : whySub(g, c.delta, `over ${span(P.gws.filter((x) => x >= g))}${label ? ` ${label}` : ''} ${vs}`);
    // under a number vs rolling, where your total moved by another amount (the header's change: the move against your
    // plan without it, which makes no later transfer; rolling's plan spends the one it saves): that amount and what it
    // counts against, one line (COPY.totalMoved; owner, 2026-10-26)
    const others = P.weeks.some((x) => x.moves.some((y) => !(x.gw === g && y.out === m.out && y.in === m.in)));
    const moved = vr && !shares && !lead && Math.abs(own.delta - shownDelta(vr)) >= 0.05 ? h('span.wy-tot', null, COPY.totalMoved(own.delta, others)) : null;
    return ctx.openSheet('why', {
      a: { road: roadOfEv(vr ? vr.mine : withIt, g), label: `${nm(m.out)} → ${nm(m.in)}` },
      b: { road: vr ? roadOfEv(vr.ev, g) : roadOfEv(without, g), label: vr ? `Roll GW${g}` : `Keeping ${nm(m.out)}`, short: rolls ? 'Rolling' : `Keeping ${nm(m.out)}` },
      title: movesTitle(P, g, [m]), sub: moved ? [...[sub].flat(), moved] : sub, gw: g,
      // the two players side by side, the one bought first (owner, 2026-10-14), each with the price the move pays and
      // gets
      pairs: pairs ?? [pairOf(withIt, g, m)],
      // a header against rolling (vr): the facts' ", not X" (the move's own number, `own`) names its baseline (owner,
      // 2026-10-22: one baseline per sheet); its facts' numbers are set on the header's, against rolling (onBase)
      facts: lead ?? whyFacts(ctx, P, g, m, withIt, without, shares ? { yours: true } : { drafts, c: own, yours: true, head: vr ? shownDelta(vr) : null }),
      // the same move in each GW (whenOf); a tapped week is chosen, the button under the line moves your transfer there
      // (moveTo: toast and Undo), the sheet closes
      when: whenSheet(P, g, m, vr ? { head: shownDelta(vr), vs } : null, shares),
      acts: [...(whyActs(P, g, m, c) ?? []), ...placeAct(m.in, g)],
      // presolved taps: its buttons', then your transfer moved to each other week of the When line
      presolve: frozenAt(P, g) ? null : [...whyTaps(P, g, m), ...(pinOfMove(P, { ...m, gw: g }) ? P.gws.filter((x) => x !== g).map((x) => ({ kind: 'move', gw: g, run: () => moveTo(ctx, { ...m, gw: g }, x) })) : [])],
    });
  }
  /** Player `id`'s place as drawn, when the pitch draws GW g (S.decks: renderDecks) | null. */
  const deckOf = (id, g) => { const { S } = V; return (S.decks?.gw === g ? S.decks.find((x) => x.a === Number(id)) ?? null : null); };
  /** His place in GW g for his sheet's line, "3 choices for his place ›" | null: none drawn. */
  const placeLink = (id, g) => { const { openPlace } = V; const d = deckOf(id, g); return d ? { n: d.entries.length, open: () => whenFree(() => openPlace(d.a)) } : null; };
  /** `fn` once the pitch takes taps again (a closing sheet leaves the screen inert until gone: app.js sync), so a place
   *  opened from a sheet deals on a live pitch; a second at most. */
  const whenFree = (fn, n = 40) => { const { pitchHost } = V; return (pitchHost.closest('[inert]') && n > 0 ? setTimeout(() => whenFree(fn, n - 1), 25) : fn()); };
  /** A buy's place in GW g from his Why sheet: "What could go there instead ›"; closes the sheet (and the Week sheet)
   *  first so the place deals on the pitch in view; none where his place isn't drawn or another week is. */
  const placeAct = (id, g) => { const { S, openPlace } = V; return (deckOf(id, g) ? [{ label: COPY.placeInstead, link: true, act: () => { S.week?.sheet.close(); setTimeout(() => whenFree(() => openPlace(Number(id))), 0); } }] : []); };
  /** The Why sheet's buttons (sheets/why.js), this GW's only: "Keep Scott · GW6" and "Not Groß · GW6". "Not" is the
   *  row's swipe by tap (vetoFromWhy); Keep has no swipe. Filled only when what it does beats the noise (clearGain), so
   *  a veto is never the easiest control. Your transfer's ×: "Remove" first (removeMove; none where the row has no ×),
   *  filled when taking it off gains beyond the noise; a move Forkcast made has no rule of yours, so its × is the Keep,
   *  and the Keep button is that one. None in GW A under way (frozenAt). */
  /** whyActs' edits (Remove, Keep, Not) as taps solved ahead while the sheet is open (presolve). */
  function whyTaps(P, g, m) { const { ctx } = V;
    const mv = { out: m.out, in: m.in, gw: g };
    return [
      ...(pinOfMove(P, mv) ? [{ kind: 'remove', gw: g, run: () => removeMove(ctx, mv) }] : []),
      { kind: 'keep', gw: g, run: () => keep(ctx, m.out, { gw: g, scope: 'gw' }) },
      { kind: 'veto', gw: g, run: () => veto(ctx, mv) },
    ];
  }
  function whyActs(P, g, m, c) { const { ctx, frozenAt } = V;
    if (frozenAt(P, g)) return null;
    const nm = P.L.name;
    const mv = { out: m.out, in: m.in, gw: g };
    const mine = !!pinOfMove(P, mv);
    const off = clearGain({ delta: -c.delta, label: c.label });
    // the safe act first, the take-backs after it (`danger`: red words)
    return [
      { label: `Keep ${nm(m.out)} · GW${g}`, act: () => keep(ctx, m.out, { gw: g, scope: 'gw' }), fill: !mine && off },
      mine && P.editable ? { label: 'Remove', act: () => removeMove(ctx, mv), fill: off, danger: true } : null,
      notAct(P, g, m),
    ].filter(Boolean);
  }
  /** A veto in this GW in words, the rule chip's form (memory.ruleText): "Not Groß · GW6", the same on the row's swipe
   *  backdrop (vetoBack) and the Why sheet's button. m: {in, gw}. */
  const notOf = (P, m) => `Not ${P.L.name(m.in)} · GW${m.gw}`;
  /** The backdrop a row's left swipe shows under it: its veto's words, right-aligned. */
  const vetoBack = (P, m) => h('div.ah-veto', { 'aria-hidden': 'true' }, h('span', null, notOf(P, m)));
  /** The Why sheet's "Not Groß · GW6" for move m's buy (the left swipe's tap twin, vetoFromWhy: GW g only): whyActs'
   *  and, one per GW-g buy, openPlanWhy's. */
  function notAct(P, g, m) { const { vetoFromWhy } = V;
    const mv = { out: m.out, in: m.in, gw: g };
    return { label: notOf(P, mv), act: () => vetoFromWhy(mv), danger: true };
  }
  /** The Why sheet's When line (sheets/why.js): {weeks: whenOf, pick(gw) → bool, disabled} | null. A week made goes to
   *  that GW, as a row dropped on it does. `on`: the header's number and its baseline in words ({head, vs}: the move
   *  against rolling), each week's number set on it (whenOnBase; one baseline per sheet, owner, 2026-10-22), else
   *  against keeping the player it sells. */
  function whenSheet(P, g, m, on = null, bare = false) { const { ctx, setGw } = V;
    // (`bare`: no week with a number, nor what they count against, a week of two or more transfers: shareWeek)
    const weeks = whenOnBase(whenOf(ctx, P, { gw: g, out: m.out, in: m.in }), on?.head)?.map((x) => (bare ? { ...x, delta: null, label: null } : x));
    if (!weeks || weeks.length < 2) return null;  // a 1-week plan (Settings → Plan ahead): no other week to move it to
    const pick = (x) => {
      const ok = moveTo(ctx, { gw: g, out: m.out, in: m.in }, x);
      if (ok) setGw(x);
      return ok;
    };
    // what each week counts against, said ("+0.6 vs rolling", not "GW6 +2.7")
    return { weeks, pick, disabled: !P.editable, vs: bare ? null : COPY.whenVs(on?.vs ?? COPY.vsKeeping(P.L.name(m.out)), P.gws) };
  }
  /** A move's gain: "+6.2 xP", shimmering while the full plan checks an edit (the plan before it: no ≈; owner,
   *  2026-10-26); no weak word after it (owner, 2026-10-18); blue as every forecast number, its sign its direction,
   *  never a verdict's green or red (ui.js xpGain; owner, 2026-10-22). */
  const gainOf = (cmp, ap = false) => h('span.ah-bg.m-num', { class: { 'm-pending': ap } }, xpGain(shownDelta(cmp), 'span', null, true));
  /** A Why sheet's headline (openWhy, openPlanWhy): "GW8 · +5.6 xP over GW8–11 vs rolling", its gain blue with "xP" as
   *  the rows' (ui.js xpGain), "points" said for the unspoken marker; `rest` its words after it. */
  const whySub = (g, d, rest) => [`GW${g} · `, xpGain(d), h('span.sr-only', null, ' points'), ` ${rest}`];
  /** A number's cell on a line (the week line's, a transfer row's): "· …" while it solves (`wait`), "· 0:12" once its
   *  checks have taken LATE_S (waitClock's `late`; the clock takes "planning…"'s place, which cut "1 transfer" to "1
   *  tran…" on a 390 px phone), else its gain (gainOf), else nothing; and as its label says it ("planning…", "about
   *  +6.2 points vs rolling": `vs`, true for rolling, else its words, "vs your plan"; VoiceOver reads "versus"). */
  const numOf = (wait, cmp, ap) => { const { waitClock } = V; return (wait ? h('span.ah-bq2', { 'aria-hidden': 'true' }, waitClock('', { late: true, pre: ' · …', sep: ' · ' }) ?? [' · ', COPY.waitShort]) : cmp ? gainOf(cmp, ap) : null); };
  const numSaid = (wait, cmp, ap, vs = false) => (wait ? COPY.waitShort : cmp ? `${ap ? 'about ' : ''}${fmt.signed(shownDelta(cmp))} points${vs ? ` vs ${vs === true ? COPY.planVsRoll : vs}` : ''}` : '');
  /** …a checked choice's number as a plate, a place's card, a token and a handle say it, against what its row counts
   *  (choiceVs: "vs your plan" in a week of yours; none off the hold). */
  const plNumSaid = (P, pl) => numSaid(false, pl.cmp, false, pl.vsRoll && choiceVs(P, pl));
  /** The −4 of n hits beside a line's words, quiet, and as its label says it. */
  const hitTag = (n) => (n ? h('small.ah-hit.m-hit.m-num', { 'aria-hidden': 'true' }, `${MINUS}${E.HIT_COST * n}`) : null);
  const hitSaid = (n) => (n ? `, a ${MINUS}${E.HIT_COST * n} hit included` : '');
  /** What GW g's suggested plans count against (plans heading, a row, its Why sheet, a place's bar): rolling once the
   *  week's roll plan is in (plansOf `ref`), your plan in a week of yours (yoursAt, its rows' `vsMine`; owner,
   *  2026-10-25), none while it solves (`refWait`), else your plan (COPY.planVs). → its words | null */
  const plansVs = (P, g) => { const { ctx } = V; const L = plansOf(ctx, P, g); return L.ref ? (yoursAt(weekOf(P, g)) ? COPY.planVs(true) : COPY.planVsRoll) : L.refWait ? null : COPY.planVs(mineAny(P)); };
  /** A row's main part is its button (its Why sheet), never the whole row (one button hid the row's own controls from
   *  VoiceOver), so its +, ×, other buys and "+n" are controls beside it. The row keeps its tap on its empty part and
   *  its gestures. Spoken `label` ("…; shows why"), Enter / Space; `row` keys it for the focus kept across a redraw
   *  (render: `[data-row]`). */
  const whyPart = (label, why, row) => ({
    role: 'button', tabindex: '0', 'aria-haspopup': 'dialog', 'aria-label': label, dataset: { row },
    onKeydown: (e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); why(); } },
  });


  /**
   * A transfer, a row of the Week sheet: "Ndiaye → Groß +6.2" (gain in the order the week's moves were made, rowGains,
   * so a hit is the extra move's and says "−4"; GW A's one move against rolling off the hold; the plan before it while
   * the full plan checks an edit; its other buys for the same sale: its Why sheet and the suggested plans, ownAltsOf),
   * the week's facts under the first row, a funding sale's "Frees £1.4m so Saka fits" under it. A small grey × (28 px,
   * 44 px target) takes it off at once with Undo (removeMove: a funded buy goes alone; a sale whose money other buys
   * needed takes them along); on a move Forkcast made it keeps the seller instead, "Keep Scott in GW8", and the row
   * says "by Forkcast" after its gain. GW A under way: no ×. Main part and empty part open its Why sheet (openWhy;
   * whyPart). Swipe left rules out the buy (wireMoveRow, vetoBack); no long press (owner, 2026-10-19).
   */
  /** A transfer row's money ties, its second line: the week's bank on its first row when short (bankWarn) and a funding
   *  tie at both ends (the sale "Frees £x so B.Fernandes fits", the buy it pays for "with Haaland → Thiago": every sale
   *  of the week that funds it). No "Pays for B.Fernandes in GW8" (owner, 2026-10-26): × takes its own rule alone. →
   *  nodes ([] when none) */
  function rowTies(P, w, m, i) { const { ctx } = V;
    const g = w.gw, nm = P.L.name, rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const f = fundingOf(P, g, m);
    const funding = f && f.fund.move.out === m.out && f.fund.move.in === m.in;
    const funders = f && !funding ? w.moves.filter((x) => { const fx = fundingOf(P, g, x); return fx?.main.move.in === m.in && fx.fund.move.out === x.out && fx.fund.move.in === x.in; }) : [];
    return dotted([
      i === 0 ? bankWarn(P, w) : null,
      funding ? COPY.funds(fmt.money(freedBy(rg?.withIt, g, m)), nm(f.main.move.in)) : null,
      funders.length ? COPY.fundedBy(funders.map((x) => `${nm(x.out)} → ${nm(x.in)}`)) : null]);
  }
  return { drawWeek, clashRow, noteRow, sayDrift, forecastLine, waitSig, waitWatch, keepNight, sayNight, sayCarried, barNode, dotted, bsep, textOf, bankWarn, bankLead, weekLead, roadOfEv, movesTitle, openWhy, deckOf, placeLink, whenFree, placeAct, whyTaps, whyActs, notOf, vetoBack, notAct, whenSheet, gainOf, whySub, numOf, numSaid, plNumSaid, hitTag, hitSaid, plansVs, whyPart, rowTies };
}
