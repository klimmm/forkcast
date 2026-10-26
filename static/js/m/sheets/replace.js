// Forkcast · Replace sheet (IPHONE_DESIGN §5.7, M6 "sell from a week"). Large detent. Opened by dropping a
// shirt on a rail tick, or the Player sheet's Sell · From GW…: open(ctx, outId, gw). Every row is scored on the phone at
// once (the swap from GW g on, best XI each week but a lineup you saved, ahead.takenBy); F15c: one tap on a row makes
// it the plan (no "Add to plan" step): the shirt changes on Ahead, the heal solve confirms it and the verdict toast has Undo. The
// first row, "Let Forkcast choose", in both modes (the user, 2026-10-13: "only add player to must sell list and let model
// choose alternative"), makes the sale alone your rule (ahead.sellAny): the full plan picks who comes in, named by its
// verdict, the best row's ≈ shown meanwhile (autoGuess); under the hold the rest of that week's squad stays and the week
// takes that one buy only (memory.holdOf), off it Forkcast plans the rest around the sale as it plans everything. It
// replaces B36 (the user, 2026-10-10: the pick made exactly as the top row's tap) and B32's "Forkcast's pick" mark on the
// top row under the hold (a named pick the full plan could then differ from). Selling a player you asked to keep, or in a GW you roll, goes at
// once, the verdict naming
// the Keep or Roll it takes back, with Undo (ahead.sellOut, A6). A row that needs a −4
// says so, or, when GW g has other suggested moves, that the full plan may drop one of them instead ("−4, or instead of
// Scott → Groß", M6); a player your rules keep out (a veto, Never) is blocked as "your rule" (UX-1).
// The fix pass (2026-10-08): A1 Forkcast's pick was the best row as it is, made as your transfer (a week handed to the
// planner could add a sale and a hit of its own: under the hold the week now takes the one buy only, memory.holdOf; hits
// stay within You → Plan). A3 a row he can't afford asks in place for the sale that frees the money ("Saka needs £1.2m
// more · Also sell Calafiori → Bassey (−4)? [Do both · +1.2] [Cancel]", ahead.buyPlan / bringIn), never "Try GW7" unless GW7
// fits. A8 the hit is said once over the list (the rows' numbers count it), and a buy who wouldn't start that week says
// "bench in GW6" in grey.

import { h, fmt, fill, toast, norm, posName, icon, xpGain } from '../../ui.js';
import * as E from '../../plan/engine.js';
import { COPY } from '../calls.js';
import { plan, squadBefore, inTeamAt, addMove, draftOf, planBaseline, takenBy, sellOut, problemText, problemShort, barred, barringRules, removeRule, openRules, baseOf, weekOf, buyPlan, bringIn, sayBuyProblem } from '../ahead.js';
import { weekPills, sortTabs, sortName, sorter, barTop, bars, who, found, askBoth, sameAsk } from './buylist.js';

const CAP = 30;
/** Hits the estimate takes from GW g on. */
const hitsFrom = (ev, g) => ev.gws.filter((s) => s.gw >= g).reduce((n, s) => n + (s.hits || 0), 0);
const POS_WORD = { GK: 'goalkeeper', DEF: 'defender', MID: 'midfielder', FWD: 'forward' };

export function open(ctx, rawOut, rawGw) {
  const out = Number(rawOut);
  const P0 = plan(ctx);
  if (!P0) return null;
  const valid = P0.gws.filter((g) => squadBefore(P0, g).includes(out));
  if (!valid.length) { toast(`${P0.L.name(out)} isn't in your plan's squad in ${COPY.span(P0.gws)}.`, 'info'); return null; }
  const st = { g: valid.includes(Number(rawGw)) ? Number(rawGw) : valid[0], sort: 'plan', q: '', busy: false, ask: null };
  const cache = new Map();
  const pos = P0.L.pos(out);
  const word = POS_WORD[pos] || 'player';
  /** B125 (podmajersky P1 §6): Sell · "From GW6…" opens "Sell Scott from GW6", the week a pill picks (one title, both places). */
  const titleOf = (g) => `Sell ${P0.L.name(out)} from GW${g}`;

  /** Every same-position player for GW g: {id, row, delta, ev, blocked, problem} (memoised per GW). */
  function score(g) {
    if (cache.has(g)) return cache.get(g);
    const P = plan(ctx);
    const d0 = draftOf(ctx);
    // as taken (your saved lineups kept, as plan rows and the tap's verdict: review 5, 2026-10-12)
    const ev0 = planBaseline(ctx, P, g);
    const before = squadBefore(P, g), owned = inTeamAt(P, g);
    const no = barred(P, g);
    const list = ctx.data.rows.filter((r) => posName(r.pos) === pos && Number(r.id) !== out && (r.buyable || before.includes(Number(r.id)))).map((r) => {
      const id = Number(r.id);
      if (owned.has(id)) return { id, row: r, blocked: 'In team', code: 'owned' };
      if (no.has(id)) return { id, row: r, blocked: 'your rule', code: 'vetoed' };
      const res = addMove(ctx, d0, g, out, id, takenBy(ctx, P));
      const p = res.problem;
      if (p) return { id, row: r, blocked: problemShort(p), code: p.code, problem: p };
      // a −4 this swap needs that the plan didn't (GW g's free transfer already used): said once over the list (A8)
      const wk = res.ev.gws.find((x) => x.gw === g);
      return { id, row: r, ev: res.ev, draft: res.draft, delta: res.ev.total - ev0.total, hit: hitsFrom(res.ev, g) > hitsFrom(ev0, g), bench: !!wk?.bench?.includes(id) };
    });
    const out0 = { list, ev0, P, auto: autoGuess(list) };
    cache.set(g, out0);
    return out0;
  }

  /** "Let Forkcast choose"'s number ({id, draft, delta, hit} | null): the best legal row's estimate, its ≈ (never drawn as
   *  the plan: the full plan's buy is the solver's, ahead.sellAny). */
  function autoGuess(list) {
    return list.filter((o) => !o.blocked).sort((a, b) => b.delta - a.delta)[0] ?? null;
  }

  return ctx.sheets.open({
    title: titleOf(st.g), detent: 'large', cls: 'rs',
    build(body, sheet) {
      const subEl = h('p.rs-sub');
      const pills = h('div.ah-pills', { role: 'group', 'aria-label': 'From gameweek' });
      // B93: the names FPL writes are mostly surnames (a first name finds no one)
      const input = h('input', { type: 'search', placeholder: `Search ${word}s by surname`, 'aria-label': `Search ${word}s by surname`, autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search' });
      const seg = h('div.m-seg.small', { role: 'radiogroup', 'aria-label': 'Sort' });
      const list = h('div.ah-list', { role: 'list' });
      const foot = h('p.m-foot.rs-foot');
      const hitNote = h('p.rs-hitnote', { hidden: true });
      body.append(subEl, pills, h('label.ah-search', null, icon('search', { size: 16 }), input), seg, hitNote, list, foot);
      input.addEventListener('input', () => { st.q = input.value; draw(); });
      const title = sheet.el.querySelector('.m-sh h2');

      function draw() {
        const { list: all, ev0, P, auto } = score(st.g);
        const L = P.L;
        if (title) title.textContent = titleOf(st.g);
        // what he sells for going into GW g, and the bank then (the plan's own accounting, engine.evaluate)
        const prev = ev0.gws.find((s) => s.gw === st.g - 1);
        const sellM = prev ? prev.sell[out] : L.sellT(out) / 10;
        // the week's other transfers spend or free money too (your own Scott → E.Le Fée in GW6): the bank after them, as
        // the rows have it (addMove), his own sale there taken back (a row swaps its buy)
        const wk = ev0.gws.find((s) => s.gw === st.g);
        const besides = (wk?.moves || []).some((m) => m.ok && m.out !== out);
        const own = (wk?.moves || []).filter((m) => m.ok && m.out === out).reduce((n, m) => n + m.sell - m.buy, 0);
        const bank = besides ? wk.bank - own : prev ? prev.bank : baseOf(ctx).bank;  // GW A: the bank your plan starts from
        // a shortfall the plan already has at FPL's prices is its own, not this swap's (ahead.problemOf, PC-1): the
        // swap may spend up to the sale then, so the header says what the rows allow
        // M10: which bank: GW A's is the bank now, a later GW's the one after the week before (after that week's other
        // transfers where it has some)
        const banked = COPY.bankNow(fmt.money(bank), st.g, P.A, besides);
        fill(subEl, bank < -1e-9
          ? `Sells for ${fmt.money(sellM)}, ${banked} (the plan's own): up to ${fmt.money(sellM)}`
          : `Sells for ${fmt.money(sellM)}, ${banked}: up to ${fmt.money(sellM + bank)}`);
        // M6 / A8: a −4 the rows' estimates take, said once over the list (each row's number counts it); off the hold it
        // may instead be a suggested GW-g move the full plan drops (a free transfer back)
        const others = P.mem?.hold ? '' : (weekOf(P, st.g)?.moves || []).filter((m) => m.out !== out).map((m) => `${L.name(m.out)} → ${L.name(m.in)}`).join(', ');
        const anyHit = all.some((o) => o.hit);
        fill(hitNote, anyHit ? COPY.replaceHit(st.g, others || null) : null);
        hitNote.hidden = !anyHit;
        weekPills(pills, P.gws, st.g, (g) => valid.includes(g), (g) => { st.g = g; draw(); });
        sortTabs(seg, st.sort, st.g, (k) => { st.sort = k; draw(); }, P.gws);
        const q = norm(st.q.trim());
        const by = sorter(L, st.sort, st.g);
        const shown = all.filter((o) => !q || found(o.row, q))
          .sort((a, b) => (!!a.blocked - !!b.blocked) || by(a, b)).filter((o, i) => i < CAP);
        const top = barTop(L, shown, P.gws);
        fill(list, shown.length ? shown.map((o) => {
          const rowEl = h('button.ah-lrow', {
            type: 'button', role: 'listitem', class: { blocked: !!o.blocked }, disabled: !o.blocked && !plan(ctx)?.editable,
            'aria-label': o.blocked ? (o.code === 'budget' ? `${o.row.name}: ${o.blocked}` : null)
              : `Sell ${L.name(out)} for ${o.row.name} from GW${st.g}: ${COPY.listTotalSaid(o.delta, true)}${o.bench ? `, on the bench in GW${st.g}` : ''}`,
            onClick: () => pick(o),
          },
          who(L, o.row, [o.bench ? h('span.rs-bench', null, ` · bench in GW${st.g}`) : null]),
          bars(L, o.id, P.gws, st.g, top, st.sort),
          // its ≈ over what it counts, your total (the user, 2026-10-21: fix all (first-use proposal #1)); forecast points,
          // blue with "xP" (ui.js xpGain; the user, 2026-10-22, after v1.3.68)
          h('span.rt.m-num', null, o.blocked
            ? h('small', { class: { 'g-loss': o.code === 'budget' } }, o.blocked)
            : [xpGain(o.delta, 'span', null, true, '≈ '), h('small', null, COPY.listTotal)]));
          return st.ask?.id === o.id && st.ask.g === st.g ? [rowEl, askEl(o)] : rowEl;
        }) : h('p.ah-empty', null, COPY.noneCalled(word, st.q.trim())));
        // "Let Forkcast choose" (both modes, the user 2026-10-13): the sale alone your rule, the full plan picks who comes
        // in (sell(null): ahead.sellAny), the best row's ≈ its number (autoGuess), no name promised (B32: a named pick the
        // full plan then differed from)
        const best = auto;
        list.prepend(h('button.ah-lrow.rs-auto', {
          type: 'button', role: 'listitem', disabled: !plan(ctx)?.editable || !best,
          'aria-label': best ? `Sell ${L.name(out)} from GW${st.g}, Forkcast picks who comes in with the full plan: ${COPY.listTotalSaid(best.delta, true)}` : `Sell ${L.name(out)} from GW${st.g}: no buy fits`,
          onClick: () => sell(null),
        },
        h('span.mk.rs-automk', { 'aria-hidden': 'true' }, pos),
        h('span.nm', null, h('b', null, 'Let Forkcast choose'), h('span', null, best ? COPY.autoBuy : 'No buy fits')),
        h('span.rt.m-num', null, best ? [xpGain(best.delta, 'span', null, true, '≈ '), h('small', null, COPY.listTotal)] : h('small', null, '—'))));
        fill(foot, `"${sortName('plan', P.gws, st.g)}" is an estimate over ${COPY.span(P.gws)} (best XI each week but a lineup you saved); Forkcast confirms it.`);
      }

      function pick(o) {
        if (o.blocked && o.code === 'budget') {
          // A3: the sale that frees the money, asked in place (never "Try GW7" unless GW7 fits him)
          const P = plan(ctx);
          const bp = buyPlan(ctx, o.id, st.g, { out });
          // B36: in both modes (the sale that frees the money made as yours, as under the hold)
          if (bp.kind === 'two') { st.ask = { id: o.id, g: st.g, bp }; draw(); return; }
          // one that can't be made says why, and the later week he fits in with its action (B74)
          if (bp.kind === 'none') sayBuyProblem(ctx, P, o.id, bp, 'info');
          else toast(problemText(ctx, o.problem, o.row.name), 'info');
          return;
        }
        // B89 (podmajersky P2 §13: "Remove the rule on Ahead" sent you away to do it): the one rule of yours that keeps
        // him out from GW g (ahead.barringRules) is removed from the toast (removeRule: its verdict and Undo), the list
        // then scored again; several: its Review opens Your rules on Ahead there (review 5, 2026-10-12: no action at
        // all); none, the toast says where to go
        const bar = o.code === 'vetoed' ? barringRules(plan(ctx), o.id, st.g) : [];
        if (bar.length === 1) {
          toast(`Your rules keep ${o.row.name} out.`, 'info', { action: { label: 'Remove', onClick: () => { if (removeRule(ctx, bar[0].id)) { cache.clear(); draw(); } } } });
          return;
        }
        if (bar.length > 1) {
          const review = () => { sheet.close(); openRules(ctx, st.g); ctx.navigate('ahead', { gw: st.g }, { replace: true }); };
          toast(`Your rules keep ${o.row.name} out.`, 'info', { action: { label: 'Review', onClick: review } });
          return;
        }
        if (o.blocked) {
          toast(o.code === 'owned' ? 'Already in your team.' : o.code === 'vetoed' ? `Your rules keep ${o.row.name} out. Remove the rule on Ahead to allow him.` : problemText(ctx, o.problem, o.row.name), 'info');
          return;
        }
        sell(o.id);
      }

      /** A3: the row's own question: "Saka needs £1.2m more · Also sell Calafiori → Bassey (−4)? [Do both · +1.2]
       *  [Cancel]": the button carries what doing both gives over the window (the reviews, 2026-10-11: the ask had money
       *  and a hit, no points; B145: the number last). */
      function askEl(o) {
        const a = st.ask;
        return askBoth(plan(ctx), a.bp, {
          fixed: true,
          // Do both on the plan as it is now: the way that still says what was asked (buylist.sameAsk), else asked again,
          // made alone when his sale now fits, or why not
          onDo: () => {
            const P = plan(ctx), bp = buyPlan(ctx, o.id, a.g, { out });
            if (bp.kind === 'two' && !sameAsk(P, bp, a.bp, { fixed: true })) { st.ask = { ...a, bp }; draw(); return; }
            if (bp.kind === 'none') { st.ask = null; sayBuyProblem(ctx, P, o.id, bp, 'info'); draw(); return; }
            if (!bringIn(ctx, o.id, a.g, bp)) return;
            st.ask = null;
            sheet.close();
            ctx.navigate('ahead', { gw: a.g }, { replace: true, top: true });  // B45: no new entry; H1: the top
          },
          onCancel: () => { st.ask = null; draw(); },
        });
      }

      /** F15c: a row tapped is the plan at once (ahead.sellOut: a rule of yours it takes back goes too, named; the
       *  verdict toast has Undo): him sold from GW g for `inn` (a row's), or (null) for the buy the full plan picks ("Let
       *  Forkcast choose"). */
      async function sell(inn) {
        if (st.busy) return;
        st.busy = true;
        const g = st.g;
        try {
          if (!sellOut(ctx, g, out, inn)) return;
          sheet.close();
          ctx.navigate('ahead', { gw: g }, { replace: true, top: true });  // B45: no new entry; H1: the top
        } finally { st.busy = false; }
      }

      draw();
    },
  });
}
