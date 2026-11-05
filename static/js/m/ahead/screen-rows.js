// screen.js mount: transfer rows, the doors and a plan's Why sheet

import { h, fmt, chipName } from '../../ui.js';
import { COPY, shownDelta } from '../calls.js';
import { addPlan, pairOf, pinOfMove, planTake, removeMove, rollingAt, rowGains, swapGain, takenKeep, whyFacts } from './presolve.js';
import { WHY_SHEET, capFirst, closedOf, clubCounts, draftOf, ids, plan, removedAt, span, weekOf } from './core.js';
import { gwMode, inkAt } from './buys.js';
import { chipBack, emptyHead, plPays, rollFt, shirtOf, squadWeek, weekFacts } from './pieces.js';
import { SQUAD_CHIPS, choiceVs, countedAfter, failedWords, mineAny, planBack, planBaseline, planWeeks, plansOf, rollOnly, squadChanges, weekRollOf } from './plans.js';
import * as E from '../../plan/engine.js';
import { veto } from './edits.js';
import { glyph } from './screen.js';

export function rowsPart(V) {
  /** A transfer row's ×: at once, with Undo; a sale whose money a buy needed takes that buy with it; Forkcast's move
   *  (`forkcast`): a Keep (removeMove). */
  const moveX = (P, m, g, forkcast) => { const { ctx } = V; return h('button.ah-x', {
    type: 'button', 'aria-label': forkcast ? COPY.keepIn(P.L.name(m.out), g) : COPY.placeRemoveSaid(P.L.name(m.out), P.L.name(m.in)),
    onClick: (e) => { e.stopPropagation(); removeMove(ctx, { ...m, gw: g }); },
  }, glyph('x')); };
  function xferRow(P, w, m, i) { const { S, ap0, ctx, frozenAt, hitSaid, hitTag, numOf, numSaid, openWhy, rowTies, textOf, vetoBack, whyPart, wireMoveRow } = V;
    const g = w.gw, nm = P.L.name;
    const ap = ap0(P, g);
    // a move you removed, still on the plan before it while the solver plans without it or once it found no plan
    // without it (removedAt; its rule gone): no second × (it would keep the player it sold); the status row's Removes
    // and the toast's Undo say what to do
    const gone = removedAt(P, g).has(`${m.out}>${m.in}`) && !pinOfMove(P, { ...m, gw: g });
    // no number in a week of two or more (on its line and the sheet's header: shareWeek)
    const shares = shareWeek(w);
    const vr = rollOf(P, w), n = moveNum(P, w, m), wait = !shares && n.wait;
    const rg = rowGains(ctx, P, w).get(`${m.out}>${m.in}`);
    const head = shares ? null : n.cmp ?? { delta: 0, label: 'coin' };
    const ties = rowTies(P, w, m, i);
    const sub = ties.length ? ties : null;
    // the first row's first-use hint (LEARN_KEY 'row'), only on its empty second line (a row with ties keeps them) and
    // only where its swipe acts (wireMoveRow); aria-hidden as every second line
    const learnRow = i === 0 && !sub && !gone && P.editable && !frozenAt(P, g) && !S.learnt.has('row');
    const hit = !vr && rg?.hit ? rg.hit : 0;
    const canX = !frozenAt(P, g) && P.editable && !gone;  // a frozen week's or a live GW A's transfer is FPL's: no ×
    const forkcast = canX && !pinOfMove(P, { ...m, gw: g });
    const what = `${nm(m.out)} to ${nm(m.in)}`;
    const label = `${what}${head || wait ? `, ${numSaid(wait, head, ap, !!vr)}` : ''}${hitSaid(hit)}${forkcast ? ", Forkcast's move" : ''}${sub ? `. ${textOf(sub)}` : ''}; shows why`;
    // its other buys are among the week's suggested plans (plansOf), never on its line ("· 2 more" read as transfers
    // made)
    const why = () => openWhy(P, g, m);
    const main = [
      h('span.ah-bn', null, h('s', null, `${nm(m.out)} → `), h('b', null, nm(m.in))),
      hitTag(hit), numOf(wait, head, ap),
      forkcast ? h('small.ah-bk', { 'aria-hidden': 'true' }, 'by Forkcast') : null];
    // the main part is the row's button (whyPart), the × a control of its own; the second line is in its label
    const fg = h('div.ah-fg.ah-btgt', { onClick: why },
    h('span.ah-bt', whyPart(label, why, `x${g}:${m.out}>${m.in}`), main),
    sub ? h('span.ah-bs', { 'aria-hidden': 'true' }, sub) : learnRow ? h('span.ah-bs.ah-learn', { 'aria-hidden': 'true' }, COPY.hintRow(nm(m.in))) : null,
    canX ? moveX(P, m, g, forkcast) : null);
    // the transfer a + just made, tinted once (S.tint, this first draw only)
    const tint = !!S.tint?.some((x) => Number(x.out) === Number(m.out) && Number(x.in) === Number(m.in));
    const row = h('div.ah-mrow', { class: { 'm-shimmer': tint, once: tint }, dataset: { out: m.out, in: m.in, gw: g } }, vetoBack(P, { in: m.in, gw: g }), fg);
    if (P.editable && !frozenAt(P, g)) wireMoveRow(row, fg, { ...m, gw: g });
    return row;
  }
  /** The week's facts (factsWords) as the week line draws them, each whole (.ah-fact: where they take two lines, the
   *  Week sheet's, the line breaks between them, never inside "3 FT in GW10"), joined by " · ": rollFacts' and
   *  fitBlock's probe's; `next`: the last, next GW's free transfers, with its " · " (.ah-fnext), which the week line
   *  leaves to the Week sheet where it doesn't fit (fitFacts). */
  const factSpans = (facts, next = false) => facts.map(([t], i) => (next && i && i === facts.length - 1
    ? h('span.ah-fnext', null, ' · ', h('span.ah-fact', null, t)) : [i ? ' · ' : null, h('span.ah-fact', null, itbNode(t))]));
  /** A bank's words with FPL's "ITB" its own (.ah-itb), the part the week line lets go where even the bank alone can't
   *  stay whole (fitFacts: a £10m bank at 320 px), the amount never. */
  const itbNode = (t) => (typeof t === 'string' && t.endsWith(COPY.itb('')) ? [t.slice(0, -COPY.itb('').length), h('span.ah-itb', null, COPY.itb(''))] : t);
  /** No transfer in the viewed GW in words (the week line's): who left the week empty (emptyHead: "Rolling", "Forkcast
   *  rolls GW8") over this week's free transfers, its bank and what rolling them makes next week (weekFacts: "1 FT ·
   *  £0.5m ITB · 2 FT in GW7"), or a short bank's words in its bank's place, after them (bankWarn). No "· moving +2.1
   *  over rolling" (owner, 2026-10-11): the pitch's choices are that fork. The head: the week's status beside the goal
   *  (statusTok: "Rolling", "Rolling is best" once settled with nothing better, `best`; "Rolling ✓" under your Roll). →
   *  {head, rest (nodes; next GW's free transfers may go to the Week sheet: fitFacts), said} */
  function rollFacts(P, w, { bar = false } = {}) { const { ap0, bankWarn, ctx, textOf } = V;
    const g = w.gw;
    const ink = inkAt(ctx, P, g), hold = !!P.mem?.hold;
    // this week's free transfers first, then what rolling them makes next week (the last GW of the window has no next
    // week to name), the bank between them ("2 FT · £0.8m ITB · 3 FT in GW10"); on the bar (`bar`) the strip says next week's
    const all = weekFacts(P, w), next = g < P.end, facts = bar && next ? all.slice(0, -1) : all, bank = bankWarn(P, w);
    // while an edit is checked, a later week still drawn from the plan before it claims no choice of Forkcast's ("No
    // transfers", not "Forkcast rolls GW8": the check may re-plan it)
    const stale = !hold && P.healing && P.approx.has(g) && !ap0(P, g);
    return {
      head: emptyHead(g, { ink, hold, off: gwMode(P, g) === 'roll' || stale, lock: rollingAt(P, g) }),
      rest: [factSpans(facts, next && !bar), bank ? [' · ', bank] : null],
      // read out with FPL's codes in full ("1 free transfer, £0.5 million in the bank, 2 free transfers in gameweek 7")
      said: [...facts.map(([, s]) => s), bank && textOf(bank)].filter(Boolean).join(', '),
    };
  }
  /** The week line's doors at its right end, each behind a hairline, its full height its target, its sheet for GW g:
   *  Chips… (sheets/chips.js; opening it is the chips hint learnt) and Bring in… (the Wish sheet). */
  const door = (P, cls, row, text, label, onClick) => h(`button.ah-lnk.ah-door${cls}`, { type: 'button', disabled: !P.editable, 'aria-haspopup': 'dialog', 'aria-label': label, dataset: { row }, onClick }, text);
  /** The Chips sheet for GW g (the week line's Chips…). */
  const openChips = (g) => { const { ctx, learn } = V; learn('chips'); ctx.askChips?.(g); ctx.openSheet('chips', { gw: g }); };
  const chipsDoor = (P, g) => door(P, '.ah-chips', 'chips', COPY.chipsDoor, COPY.chipsSaid(g, weekOf(P, g)?.chip ?? null), () => openChips(g));
  const bringDoor = (P, g) => { const { ctx } = V; return door(P, '.ah-bring', 'bring', COPY.bringInShort, `${COPY.bringInSheet} in GW${g}`, () => ctx.openSheet('wish', null, { gw: g })); };
  /** The doors as fitBlock's probe and the first week's baking line draw them: their place, no control. */
  const doorStubs = () => [h('span.ah-lnk.ah-door.ah-bring', { 'aria-hidden': 'true' }, COPY.bringInShort), h('span.ah-lnk.ah-door.ah-chips', { 'aria-hidden': 'true' }, COPY.chipsDoor)];
  /** A Free Hit or Wildcard week's change: the shirt, "Out → In" and the prices; no gain (the chip remakes the squad)
   *  and no Why sheet. Where the week can change, a transfer row's × and left swipe (owner, 2026-10-14): × keeps the
   *  player it sells in that GW (removeMove), a left swipe rules out the player it buys there (vetoRow). A row of the
   *  Week sheet, under the chip's note (COPY.chipWeek). `read`: a Wildcard or Free Hit choice's Why sheet's
   *  (squadChanges), no × or swipe, a player your Keep holds there his name over "kept: your rule". */
  function changeRow(P, w, m, read = false) { const { frozenAt, vetoBack, wireMoveRow } = V;
    const nm = P.L.name, g = w.gw;
    const can = !read && !frozenAt(P, g) && P.editable;
    const forkcast = can && !pinOfMove(P, { ...m, gw: g });
    const fg = h('div.ah-fg', null, h('span.mk', { 'aria-hidden': 'true' }, shirtOf(P.L, m.in, 28)),
      h('span.mt', null, m.kept ? [h('span.a', null, nm(m.in)), h('span.b', null, COPY.keptRule)]
        : [h('span.a', null, h('s', null, `${nm(m.out)} → `), nm(m.in)), h('span.b.m-num', null, `${priceOf(P, m.out)} → ${priceOf(P, m.in)}`)]),
      can ? moveX(P, m, g, forkcast) : null);
    const row = h('div.ah-mrow.sq', { class: { kept: !!m.kept }, dataset: { ...(m.kept ? {} : { out: m.out }), in: m.in, gw: g } }, can ? vetoBack(P, { in: m.in, gw: g }) : null, fg);
    if (can) wireMoveRow(row, fg, { ...m, gw: g });
    return row;
  }
  /** "£4.5m" with its club: "CRY £4.5m". */
  const priceOf = (P, id) => { const x = P.L.price(id); return `${P.L.club(id) ?? ''} ${x == null ? '' : fmt.money(x)}`.trim(); };
  const addOnce = (e, act, moves = []) => { const { ADD_HOLD_MS, S } = V;
    e.stopPropagation();
    if (S.addAt && S.flowAt >= S.addAt && Date.now() - S.flowAt < ADD_HOLD_MS && !e.target?.closest?.('.ah-place')) return;
    S.addAt = Date.now();
    if (act()) S.tint = moves;
  };

  /** Whether choice pl is green with a solid + (a Week sheet row, a place's dealt card, its Why sheet's Take filled):
   *  exactly where the pitch lights it (weekModel's `shown`: litShown; owner, 2026-10-22: one rule). `M`: the week's
   *  model, the one drawn by default (S.M). */
  const litPays = (pl, M = V.S.M) => !!pl && !!M?.shown.has(pl);
  /** A suggested plan's row key: its GW-g choice (planRow's data-plan: a Week sheet row's, a tab's, a token's). */
  const planKey = (g, pl) => `${g}:${pl.choice.moves.map((m) => `${m.out}>${m.in}`).join(',')}|${JSON.stringify(pl.choice.chips)}`;
  /** A choice's words wherever it is drawn (a Week sheet row, a tab, a token, a place's header): `head` ("GW8 Saka →
   *  Palmer", what its + takes back after it), `label` (its spoken line: its number over the weeks it counts, against
   *  what; or what it waits for; a move you took off this session "removed by you" after its head: plansOf `removed`),
   *  `wait` (what its solve waits for, its failure's reason; null once ready), `pays` (plPays: its + solid, its number
   *  green). */
  function planSaid(P, g, pl) { const { plansVs } = V;
    const { now, adds, back } = planBack(P, g, pl);
    const base = planWeeks(P, { ...pl.choice, moves: adds, hits: pl.hits }, g).find(([x]) => x === g)?.[1] ?? (now.length ? `GW${g}` : COPY.planRoll(g));
    const head = back ? `${base} ${back}` : base;
    const wait = pl.state === 'ready' ? null : pl.state === 'failed' ? failedWords(P, pl).row : { flight: COPY.waitShort, heal: COPY.pairAfterEdit }[pl.wait] ?? COPY.pairWaiting;
    const who = pl.removed ? `${head}, ${COPY.removedByYou}` : head;
    // the roll's own row is what the others count against: no number (owner, 2026-10-19); no "as good in GW9" after one
    // worth no less a week later (owner, 2026-10-29)
    const label = wait ? `${who}: ${wait}` : pl.refRow ? `${who}, ${COPY.planRefSaid}`
      : `${who}, ${fmt.signed(shownDelta(pl.cmp))} points over ${span(P.gws.filter((x) => x >= g))} vs ${pl.vsRoll ? choiceVs(P, pl) : plansVs(P, g)}`;
    return { head, label, wait, pays: !wait && plPays(pl) };
  }
  /** A choice's + (a Week sheet row's, a token's): GW g alone taken (planTake, addPlan) through addOnce; `then` once it
   *  changed the plan (the Week sheet closes, so the change lands on the pitch in view). */
  const takePlan = (P, g, pl, then = null) => { const { ctx } = V; return (e) => addOnce(e, () => { const ok = addPlan(ctx, g, pl); if (ok) then?.(); return ok; }, planTake(P, g, pl).own); };
  /**
   * A suggested plan (plansOf; owner, 2026-10-11), a row of the Week sheet: its GW-g choice on its line, "GW7 Kayode →
   * Vuskovic" (several joined by " + "; none: "GW7 roll"; "GW8 Free Hit"), the −4 it takes there, and its number in
   * the list's order (its plan against the roll's; the roll's own row has none; green only when it beats the noise:
   * plPays). Nothing of its later weeks (owner, 2026-10-12): a small outlined + takes GW g alone (takePlan: your exact
   * transfers there or its chip, one Undo) and closes the sheet (`closes`); the row opens its Why sheet (openPlanWhy).
   * While its solve runs: its choice and what it waits for ("· planning…", "· waiting", "· waiting for your edit's
   * check"), no number, its + off; a failed solve with no road plan: its choice and why (COPY.planFailed), no number,
   * its + off. No swipe, no long press. Under its week's own tab the row leaves the week out (owner, 2026-10-18).
   */
  function planRow(P, g, pl, { shared = null, closes = false, lit = null, best = null } = {}) { const { S, ctx, frozenAt, gainOf, hitTag, whyPart } = V;
    const nm = P.L.name;
    const key = planKey(g, pl);
    // `shared`: the "instead of …" every listed row's + takes back, said once on the Week sheet's plans heading
    const { chipNow, now, adds, back } = planBack(P, g, pl);
    const s = planSaid(P, g, pl);
    const own = back && back !== shared ? back : '';
    const shown = planWeeks(P, { ...pl.choice, moves: adds, hits: pl.hits }, g, false).find(([x]) => x === g)?.[1] ?? (now.length ? '' : COPY.planRoll(null));
    const tail = !own ? null : shown || adds.length ? ` ${own}` : capFirst(own);
    // the first line wraps between its moves, never inside one (m-ahead.css .ah-bplan); quiet after them a move you
    // took off this session, "· removed by you"; a choice worth no less a week later is listed, never lit, with no
    // words of it (owner, 2026-10-29); its moves one sentence, "Cunha → Palmer, Neto → Tavernier", as the pitch's line
    // says it
    const line = [adds.length ? adds.flatMap((m, i) => [i ? ', ' : null, h('span.ah-pmv', null, h('s', null, `${nm(m.out)} → `), nm(m.in))]) : shown,
      tail ? h('span.ah-bq2', null, tail) : null, pl.removed ? h('span.ah-bq2', null, ' · ', COPY.removedByYou) : null];
    // its take worded as everywhere else ("Swap", "Swap both", a Roll's "Roll", a chip alone's "Take"), the one mark
    // (.m-swap), ink for the week's best, green where it pays, outlined where it doesn't; never a +
    const word = COPY.takeWord(adds.length, !adds.length && !!pl.choice?.chips?.[g]);
    if (s.wait) {
      const off = h('button.ah-add.m-swap.quiet', { type: 'button', disabled: true, tabindex: '-1', 'aria-hidden': 'true' }, word);
      return h('div.ah-brow.ah-bpair.ah-bplan.solving', { role: 'status', dataset: { row: 'plan', plan: key }, 'aria-label': s.label },
        h('span.ah-bt', { 'aria-hidden': 'true' }, h('span.ah-bn', null, line, h('span.ah-bq2', null, ' · ', s.wait))), off);
    }
    const hit = chipNow ? null : hitTag(pl.hits[g]);
    // one highlight, the best row's (review 7 B10: a second, filled where the pitch lights it, read as advice on a lower
    // number), every other row's + outlined; the number blue in every row (gainOf); the Roll of a week you roll no +
    // at all (rollOnly). `pays` (where the pitch lights it) still fills its Why sheet's Take
    const pays = lit ?? litPays(pl);
    const why = () => openPlanWhy(P, g, pl, pays);
    // (the Roll its 0.0: the baseline every other row's number counts from; owner, 2026-11-03, design_1103b "Number
    // scope + close call": Saffer, Johnson's Elements of Choice)
    // (a transfer's number the card's and the tabs': swapGain; its solve asked while this sheet is open)
    const moved = adds.length && !pl.refRow ? swapGain(ctx, P, g, pl) : null;
    const gain = pl.refRow ? gainOf({ delta: 0 }) : !adds.length ? gainOf(pl.cmp) : moved == null ? h('span.ah-bq2', null, COPY.waitShort) : gainOf({ delta: moved });
    const top1 = best ?? S.M?.lit?.move === pl;
    const add = rollOnly(pl) ? null : h('button.ah-add.m-swap', {
      type: 'button', disabled: frozenAt(P, g), dataset: { add: `plan:${key}` }, class: { best: top1, quiet: !top1 }, 'aria-label': COPY.planTake(s.head),
      onClick: takePlan(P, g, pl, closes ? () => S.week?.sheet.close() : null),
    }, word);
    // the main part is the row's button (whyPart), the + a control of its own
    return h('div.ah-brow.ah-bpair.ah-bplan.ah-btgt', { dataset: { gw: g, plan: key }, onClick: why },
      h('span.ah-bt', whyPart(`${s.label}; shows why`, why, `plan:${key}`), h('span.ah-bn', null, line), hit, gain), add);
  }
  /** A plan's Why sheet: the two plans the row's number compares side by side (plansOf `vsRoll` under the hold,
   *  `vsMine` in a week of yours, `vsBest` for the roll's own row; else its + against your plan), titled with its GW-g
   *  choice alone (owner, 2026-10-12), laid out as openWhy: its buttons (the row's own, planTake, filled as its + is
   *  solid: litPays, `lit`; a "Not Groß · GW6" per GW-g buy), each GW-g move's two players, then what else it changes
   *  (whyFacts on the week alone: COPY.planAdds; the Roll row of a week you roll: COPY.rollAlready, no Take: rollOnly).
   *  One baseline per sheet (owner, 2026-10-22): whyFacts `head`, COPY.chipUses. Read-only: what its number counts
   *  after its week (countedAfter) and a Wildcard's or Free Hit's changes (squadChanges). */
  function openPlanWhy(P, g, pl, lit = litPays(pl)) { const { S, ctx, frozenAt, movesTitle, notAct, roadOfEv, whySub } = V;
    // (hidden: its first buy's player sheet; a chip's or a roll's the Week sheet, its row's + plays it: WHY_SHEET)
    if (!WHY_SHEET) { const m = pl.choice.moves.find((x) => x.gw === g); return m ? ctx.openSheet('player', Number(m.in), { gw: g }) : V.weekSheet(g); }
    const nm = P.L.name;
    const without = planBaseline(ctx, P, g);
    const gws = P.gws.filter((x) => x >= g);
    const moved = (x) => (SQUAD_CHIPS.has(x.chips?.[g]) ? [] : x.moves.filter((m) => m.gw === g));
    const titleOf = (x) => planWeeks(P, { ...x, moves: moved(x), hits: {} }, g, false).find(([y]) => y === g)?.[1] ?? COPY.planRoll(null);
    const now = moved(pl);
    const best = pl.refRow && pl.vsBest ? pl.best : null;
    // in a week of yours its plan against yours, Forkcast's later moves in both (plansOf `vsMine`, the list's `mine`;
    // owner, 2026-10-25), where vsMine is that; else (your chip week, a Wildcard row) what its + gives against your
    // plan, as below
    const mine = pl.vsMine && pl.vsMine !== pl.alone && !pl.refRow ? plansOf(ctx, P, g).mine : null;
    const [ev, other, cmp, vs, short] = best ? [pl.bestFrom ?? pl.fullEv, best.fullEv, pl.vsBest, titleOf(best), titleOf(best)]
      : mine ? [pl.fullEv, mine.ev, pl.cmp, COPY.planVs(true), COPY.planVs(true)]
        : pl.vsRoll && !pl.refRow && !pl.vsMine ? [pl.fullEv, pl.refEv, pl.cmp, COPY.planVsRoll, COPY.planRoll(null)]
          : [pl.ev, without, pl.alone ?? pl.cmp, COPY.planVs(!!pl.vsMine || mineAny(P)), COPY.planVs(!!pl.vsMine || mineAny(P))];
    const d0 = draftOf(ctx);
    // one baseline per sheet (owner, 2026-10-22): a miss set on the header's number where it counts against rolling
    // (onBase), never against your plan under it; a Wildcard or Free Hit says the chip it spends and when the next
    // comes
    const onHead = best || mine || (pl.vsRoll && !pl.refRow && !pl.vsMine) ? shownDelta(cmp) : null;
    const sqChip = SQUAD_CHIPS.has(pl.chips?.[g]) ? pl.chips[g] : null;
    // why its moves go together, the solver's own: its solved road's GW-g squad (pl.road, never the phone's composed
    // pl.ev) holds a club's most with a buy, a sale of the same club its other move ("Neto's sale makes room: Palmer is
    // your 3rd CHE player"); never the phone's sums (fitOf), no solve asked
    const rw = (pl.road?.weeks || []).find((x) => Number(x.gw) === g), clubs = clubCounts(P.L, rw ? ids([...(rw.xi || []), ...(rw.bench || [])]) : []);
    // over the moves it adds to yours (planBack's `adds`): a take-back's reason is never one of your own transfers
    const { adds: added, back: undone, taken } = SQUAD_CHIPS.has(pl.chips?.[g]) ? { adds: [], back: '', taken: [] } : planBack(P, g, pl);
    const several = added.length > 1 || (!!undone && added.length > 0);
    const room = added.length < 2 ? [] : added.flatMap((m) => {
      const club = P.L.club(m.in), by = added.find((o) => o !== m && P.L.club(o.out) === club);
      return club && by && clubs.get(club) === E.MAX_PER_CLUB ? [COPY.planRoom(nm(by.out), nm(m.in), E.MAX_PER_CLUB, club)] : [];
    });
    const facts = [...new Set([...now.flatMap((m) => whyFacts(ctx, P, g, m, pl.ev, without, { drafts: [pl.taken ?? pl.draft, d0], head: onHead })),
      ...(sqChip ? [COPY.chipUses(chipName(sqChip), chipBack(P, g))] : []),
      ...(pl.alone && !pl.rolls && Math.abs(pl.alone.delta - shownDelta(cmp)) >= 0.05 ? [COPY.planAdds(pl.alone.delta)] : []),
      ...(pl.rolls ? [COPY.rollAlready(g)] : []), ...rollFt(P, g, pl)])];
    const head = planWeeks(P, { ...pl, moves: now }, g).find(([x]) => x === g)?.[1] ?? COPY.planRoll(g);
    // its moves one sentence as on the pitch and in a place, each move unbroken (never split inside a move or a name)
    const title = several ? `${added.map((m) => `${nm(m.out)} → ${nm(m.in)}`.replace(/ /g, '\u00a0')).join(', ')}${undone ? ` ${undone}` : ''}` : titleOf(pl);
    // the two plans' later weeks, rolling's (else what it counts against) first
    const later = countedAfter(P, g, best ? [[COPY.countedRoll, ev], [short, other]]
      : pl.vsRoll && !pl.refRow && !pl.vsMine ? [[COPY.countedRoll, other], [title, ev]] : [[short[0].toUpperCase() + short.slice(1), other], [title, ev]]);
    // what its + gives in GW g (pl.ev, paired as the Week sheet will pair it once taken: takenKeep), a player your Keep
    // holds there "kept: your rule"
    const sq = SQUAD_CHIPS.has(pl.chips?.[g]) ? squadChanges(P, g, pl.ev, takenKeep(P, g, pl)) : [];
    const swapLook = S.M?.lit?.move === pl ? 'best' : lit ? 'pays' : 'quiet';
    ctx.openSheet('why', {
      a: { road: roadOfEv(ev, g), label: title },
      b: { road: roadOfEv(other, g), label: short, short },
      // its players each a link to his card where the title names its moves (movesTitle)
      title: several ? movesTitle(P, g, added, { nb: true, tail: undone }) : now.length === 1 && title === `${nm(now[0].out)} → ${nm(now[0].in)}` ? movesTitle(P, g, now) : title,
      sub: whySub(g, shownDelta(cmp), `over ${span(gws)} vs ${vs}`), gw: g, reason: room.join('. ') || null,
      // each GW-g move's two players: a move in place of your buy of the same seller (planBack's `taken`), its buy
      // against YOURS it replaces, each at his buy price (sheets/why.js `yours`; the seller leaves in both plans, so
      // his column answered nothing); any other, its buy against its sale
      pairs: now.map((m) => {
        const t = taken.find((y) => Number(y.out) === Number(m.out) && Number(y.in) !== Number(m.in));
        return t ? { ...pairOf(pl.ev, g, m), out: t.in, sell: pairOf(without, g, t).buy, yours: true } : pairOf(pl.ev, g, m);
      }), facts, later,
      changes: sq.length ? { head: COPY.nChanges(sq.filter((m) => !m.kept).length), rows: sq.map((m) => changeRow(P, { gw: g }, m, true)) } : null,
      // a choice of several moves: its one take named for what it does, "Swap both", and nothing else (the sheet says
      // why; its "Not …" vetoes are each player's own sheet's). Its take the one mark, worded as its row's and its
      // place's ("Swap", "Swap both", "Roll"); ink the week's best, green where it pays, outlined where not (owner,
      // 2026-10-28)
      acts: frozenAt(P, g) ? null : several ? [{ label: COPY.swapGo(added.length), said: COPY.planTake(head), fill: lit, swap: swapLook, act: () => addPlan(ctx, g, pl) }]
        : [...(rollOnly(pl) ? [] : [{ label: COPY.takeWord(now.length, !now.length && !!pl.chips?.[g]), said: COPY.planTake(head), fill: lit, swap: swapLook, act: () => addPlan(ctx, g, pl) }]), ...now.map((m) => notAct(P, g, m))],
      presolve: frozenAt(P, g) ? null : [...(rollOnly(pl) ? [] : [{ kind: 'take', gw: g, run: () => addPlan(ctx, g, pl) }]), ...(several ? [] : now.map((m) => ({ kind: 'veto', gw: g, run: () => veto(ctx, { ...m, gw: g }) })))],
    });
  }
  /** The free transfers a Free Hit week keeps for the week after it: the plan's own count there, else FPL's roll of an
   *  unused week (engine.nextFt). */
  const ftAfter = (P, w) => weekOf(P, w.gw + 1)?.ft ?? E.nextFt(w.ft ?? 1, 0, E.ftGrant(P.season, w.gw + 1));

  /** Your week's transfers against rolling (weekRollOf): the week line's number (weekGain); a week's one move's row and
   *  Why sheet (rollOf). */
  const weekRoll = (P, w) => { const { ctx } = V; return weekRollOf(ctx, P, w); };
  const rollOf = (P, w) => (w.moves.length === 1 && !squadWeek(w) ? weekRoll(P, w) : null);
  /** A week of two or more transfers (no Wildcard or Free Hit): its number is the week's against rolling alone (the
   *  week line's, the Week sheet's header, "Yours" in each buy's place: weekGain), never a share per move (owner,
   *  2026-10-22); its rows and their Why sheets list the moves and their facts. */
  const shareWeek = (w) => w.moves.length > 1 && !squadWeek(w);
  /** Transfer m of week w's number: the week's against rolling where it is the week's one (rollOf), else its own share
   *  (rowGains) | null. Its Week sheet row's and, on the pitch, its buy's place's "Yours +0.4". */
  const moveGain = (P, w, m) => { const { ctx } = V; return (m ? rollOf(P, w) ?? rowGains(ctx, P, w).get(`${m.out}>${m.in}`)?.cmp ?? null : null); };
  /** …as shown: none while the week's roll plan or your choice still solves (`wait`: "planning…", never the week alone
   *  in its place), `ap` the week waiting on an edit's check (shimmering). */
  const moveNum = (P, w, m) => { const { ap0 } = V; const vr = rollOf(P, w); return { cmp: moveGain(P, w, m), wait: !vr && rollPending(P, w), ap: ap0(P, w.gw) }; };
  /** …still to come: the week's roll plan or your own choice still solves (plansOf `pending`), so the week line and a
   *  week's one move's row say "planning…" and change in place once they land. */
  const weekPending = (P, w) => { const { ap0, ctx } = V; return !!w.moves.length && !ap0(P, w.gw) && !!plansOf(ctx, P, w.gw).pending; };
  const rollPending = (P, w) => w.moves.length === 1 && !squadWeek(w) && weekPending(P, w);
  /** A roll of GW g as a move there is measured against it, in words. When the plan against it (`ev`, an estimate from
   *  GW g) makes no transfer after GW g, the free transfer the roll saves is never spent, so moving now looks better
   *  than against a roll that spends it: "rolling, no later transfer"; else "rolling". The Why sheet's sub says so. */
  const rolling = (P, g, ev) => (!ev?.gws.some((x) => x.gw > g && x.moves.some((y) => y.ok)) ? 'rolling, no later transfer' : 'rolling');
  /** The transfer of week w that buys player `id` and has a Why sheet (openWhy), or null: none in a Wildcard or Free
   *  Hit week (its changes are the chip's squad: changeRow). */
  const whyMove = (P, w, id) => (!WHY_SHEET || !w || squadWeek(w) ? null
    : w.moves.find((m) => Number(m.in) === Number(id)) ?? null);
  /** A tap on player `id` of GW g, the plan as it is at the tap: his transfer's Why sheet when the week buys him
   *  (tagged IN), else his sheet. The pitch's (pitchProps) and a take's toast's Why (TAP_IN: whyAct), which may come
   *  from another week: GW g is shown first and the sheet opens on its draw, so its place ("What could go there instead
   *  ›": placeAct, placeLink) is GW g's. → a promise settled once the sheet has closed (closedOf) */
  const tapIn = (g, id) => { const { ctx, gwNow, openWhy, placeLink, setGw } = V;
    const Q = plan(ctx);
    // the draw a week's switch asks runs in a microtask queued before this one (schedule)
    if (Q && gwNow(Q) !== g && Q.gws.includes(g)) { setGw(g); return Promise.resolve().then(() => tapIn(g, id)); }
    const m = Q && whyMove(Q, weekOf(Q, g), id);
    return closedOf(m ? openWhy(Q, g, m) : ctx.openSheet('player', id, { gw: g, place: placeLink(id, g) }));
  };
  return { moveX, xferRow, factSpans, itbNode, rollFacts, door, openChips, chipsDoor, bringDoor, doorStubs, changeRow, priceOf, addOnce, litPays, planKey, planSaid, takePlan, planRow, openPlanWhy, ftAfter, weekRoll, rollOf, shareWeek, moveGain, moveNum, weekPending, rollPending, rolling, whyMove, tapIn };
}
