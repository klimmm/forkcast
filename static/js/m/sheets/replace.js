// Forkcast · Replace sheet (large detent). Opened by dropping a shirt on a rail tick, or the Player sheet's Sell · From
// GW…: open(ctx, outId, gw). Every row is scored on the phone at once (the swap from GW g on, best XI each week but a
// lineup you saved: ahead.takenBy); one tap makes a row the plan (the shirt changes on Ahead, the heal solve confirms
// it, the verdict toast has Undo); under the hold the week keeps the rest of its squad and takes that one buy only
// (memory.holdOf). ("Let Forkcast choose", the sale alone, gone: owner, 2026-11-11, "remove it".) Selling a
// player you asked to keep, or in a GW you roll, goes at once, the verdict naming the Keep or Roll it takes back
// (ahead.sellOut). A row needing a −4 says so, or, when GW g has other suggested moves, that the full plan may drop one
// instead; a player your rules keep out (a veto, Never) is blocked as "your rule". A row he can't afford is made as it
// is (owner, 2026-10-28): the plan goes short as FPL's draft does (ahead.saleBuy → bringIn, memory.holdOf's debts),
// paid back the pitch's best way (ahead.plansOf, owedRoad). The hit is said once over the list.

import { h, fmt, fill, toast, norm, posName, icon, xpGain } from '../../ui.js';
import * as E from '../../plan/engine.js';
import { COPY } from '../calls.js';
import { plan, squadBefore, inTeamAt, addMove, draftOf, planBaseline, takenBy, sellOut, problemText, problemShort, barred, barringRules, removeRule, openRules, baseOf, weekOf, saleBuy, bringIn, sayBuyProblem, presolveTaps, buyPlan } from '../ahead.js';
import { weekPills, sortsOf, orderOf, sortChips, barTop, bars, ownWeeks, who, found } from './buylist.js';

const CAP = 30;
/** Hits the estimate takes from GW g on. */
const hitsFrom = (ev, g) => ev.gws.filter((s) => s.gw >= g).reduce((n, s) => n + (s.hits || 0), 0);
const POS_WORD = { GK: 'goalkeeper', DEF: 'defender', MID: 'midfielder', FWD: 'forward' };
/** Replace's own sort, first among the lists' chips (buylist.sortsOf): the swap's estimate over the window, each row's
 *  number, named by its weeks ("Best GW6–9"). */
const BEST = { key: 'plan', name: (P) => `Best ${COPY.span(P.gws)}`, val: (P, r, g, o) => o.delta ?? null };

export function open(ctx, rawOut, rawGw) {
  const out = Number(rawOut);
  const P0 = plan(ctx);
  if (!P0) return null;
  const valid = P0.gws.filter((g) => squadBefore(P0, g).includes(out));
  if (!valid.length) { toast(`${P0.L.name(out)} isn't in your plan's squad in ${COPY.span(P0.gws)}.`, 'info'); return null; }
  const st = { g: valid.includes(Number(rawGw)) ? Number(rawGw) : valid[0], sort: 'plan', flip: false, q: '', busy: false };
  const cache = new Map();
  const pos = P0.L.pos(out);
  const word = POS_WORD[pos] || 'player';
  /** Sell · "From GW6…" opens "Sell Scott from GW6", the week a pill picks (one title, both places). */
  const titleOf = (g) => `Sell ${P0.L.name(out)} from GW${g}`;

  /** Every same-position player for GW g: {id, row, delta, ev, blocked, problem} (memoised per GW). */
  /** Row `o` the bank can't pay for counted with the sale that pays for him (buyPlan's funded way, as Bring in counts
   *  it): its delta against `ev0`, GW g's plan as taken; once a row. */
  function fund(o, g, ev0 = score(g).ev0) {
    o.funded = true;
    const bp = buyPlan(ctx, o.id, g, { out });
    if (bp.kind === 'two') Object.assign(o, { delta: bp.ev.total - ev0.total, fund: bp.fund });
  }
  function score(g) {
    if (cache.has(g)) return cache.get(g);
    const P = plan(ctx);
    const d0 = draftOf(ctx);
    // as taken (your saved lineups kept, as plan rows and the tap's verdict)
    const ev0 = planBaseline(ctx, P, g);
    const owned = inTeamAt(P, g);
    const no = barred(P, g);
    // (every player of the position, the solver's ownership gate (r.buyable, 0.3%) none of a pick's: your transfer is a
    // must-have pin, which the gate exempts (player_data protected); owner, 2026-11-11, "why it not show players owned
    // less than 0.3")
    const list = ctx.data.rows.filter((r) => posName(r.pos) === pos && Number(r.id) !== out).map((r) => {
      const id = Number(r.id);
      if (owned.has(id)) return { id, row: r, blocked: 'In team', code: 'owned' };
      if (no.has(id)) return { id, row: r, blocked: 'your rule', code: 'vetoed' };
      const res = addMove(ctx, d0, g, out, id, takenBy(ctx, P));
      const p = res.problem;
      // (one the bank can't pay for: what it gives unpaid, an upper bound of its number, `over`; below)
      if (p) return { id, row: r, blocked: problemShort(p), code: p.code, problem: p, ...(p.code === 'budget' ? { over: res.ev.total - ev0.total } : {}) };
      // a −4 this swap needs that the plan didn't (GW g's free transfer already used): said once over the list
      return { id, row: r, ev: res.ev, draft: res.draft, delta: res.ev.total - ev0.total, hit: hitsFrom(res.ev, g) > hitsFrom(ev0, g) };
    });
    // one the bank can't pay for ranks by Best too: its number with the sale that pays for it (buyPlan's funded way, as
    // Bring in counts it; the plan once Forkcast pays the shortfall back), never last for having none (owner,
    // 2026-11-11, "why is Bruno Fernandes not in the list": £11.6m against £8.3m, past the 30 rows). Counted only for
    // those whose unpaid number could reach the list (`over` above its 30th)
    const cut = list.filter((o) => o.delta != null).map((o) => o.delta).sort((a, b) => b - a)[CAP - 1] ?? -Infinity;
    for (const o of list.filter((x) => x.code === 'budget' && x.over > cut)) fund(o, g, ev0);
    const out0 = { list, ev0, P };
    cache.set(g, out0);
    return out0;
  }

  let me = null;
  return ctx.sheets.open({
    title: titleOf(st.g), detent: 'large', cls: 'rs',
    onClose: () => presolveTaps(ctx, null, { owner: me }),
    build(body, sheet) {
      me = sheet;
      const subEl = h('p.rs-sub');
      const pills = h('div.ah-pills', { role: 'group', 'aria-label': 'From gameweek' });
      // the names FPL writes are mostly surnames (a first name finds no one)
      const input = h('input', { type: 'search', placeholder: `Search ${word}s by surname`, 'aria-label': `Search ${word}s by surname`, autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search' });
      const sortEl = h('div.ws-sorts', { role: 'radiogroup', 'aria-label': 'Sort by' });
      const list = h('div.ah-list', { role: 'list' });
      const foot = h('p.m-foot.rs-foot');
      const hitNote = h('p.rs-hitnote', { hidden: true });
      body.append(subEl, pills, h('label.ah-search', null, icon('search', { size: 16 }), input), sortEl, hitNote, list, foot);
      input.addEventListener('input', () => { st.q = input.value; draw(); });
      const title = sheet.el.querySelector('.m-sh h2');

      function draw() {
        const { list: all, ev0, P } = score(st.g);
        const L = P.L;
        if (title) title.textContent = titleOf(st.g);
        // what he sells for going into GW g, and the bank then (the plan's own accounting, engine.evaluate)
        const prev = ev0.gws.find((s) => s.gw === st.g - 1);
        const sellM = prev ? prev.sell[out] : L.sellT(out) / 10;
        // the week's other transfers spend or free money too: the bank after them, as the rows have it (addMove), his
        // own sale there taken back (a row swaps its buy)
        const wk = ev0.gws.find((s) => s.gw === st.g);
        const besides = (wk?.moves || []).some((m) => m.ok && m.out !== out);
        const own = (wk?.moves || []).filter((m) => m.ok && m.out === out).reduce((n, m) => n + m.sell - m.buy, 0);
        const bank = besides ? wk.bank - own : prev ? prev.bank : baseOf(ctx).bank;  // GW A: the bank your plan starts from
        // a shortfall the plan already has at FPL's prices is its own, not this swap's (ahead.problemOf): the swap may
        // spend up to the sale, so the header says what the rows allow
        // which bank: GW A's is the bank now, a later GW's the one after the week before and its other transfers
        const banked = COPY.bankNow(fmt.money(bank), st.g, P.A, besides);
        fill(subEl, bank < -1e-9
          ? `Sells for ${fmt.money(sellM)}, ${banked} (the plan's own): up to ${fmt.money(sellM)}`
          : `Sells for ${fmt.money(sellM)}, ${banked}: up to ${fmt.money(sellM + bank)}`);
        // a −4 the rows' estimates take, said once over the list; off the hold it may instead be a suggested GW-g move
        // the full plan drops (a free transfer back)
        const others = P.mem?.hold ? '' : (weekOf(P, st.g)?.moves || []).filter((m) => m.out !== out).map((m) => `${L.name(m.out)} → ${L.name(m.in)}`).join(', ');
        const anyHit = all.some((o) => o.hit);
        fill(hitNote, anyHit ? COPY.replaceHit(st.g, others || null) : null);
        hitNote.hidden = !anyHit;
        weekPills(pills, P.gws, st.g, (g) => valid.includes(g), (g) => { st.g = g; draw(); });
        // the lists' sort chips, its own first (owner, 2026-10-28; buylist.sortChips): the row's number stays the
        // swap's ≈; the chosen stat follows his club and price where nothing else shows it
        const sorts = sortsOf(ctx, [BEST]), x = sorts.find((y) => y.key === st.sort) ?? BEST;
        sortChips(sortEl, sorts, st, P, st.g, draw);
        const statOf = x === BEST || x.xp || x.key === 'price' ? () => null
          : (o) => { const v = x.val(P, o.row, st.g); return v == null ? null : h('span.rs-stat', null, ` · ${x.num(v)} ${x.unit(P, st.g)}`); };
        const q = norm(st.q.trim());
        const by = orderOf(x, st.flip, P, st.g, (o) => o.row);
        // rows that can't be taken last (in team, your rule, …); one the bank can't pay for is taken as it is (FPL's
        // draft short of money), so it ranks by the chosen sort like any row, after the estimated ones only by Best,
        // which has no estimate for it (owner, 2026-10-28/29)
        const last = (o) => !!o.blocked && o.code !== 'budget';
        const shown = all.filter((o) => !q || found(o.row, q))
          .sort((a, b) => (last(a) - last(b)) || by(a, b)).filter((o, i) => i < CAP);
        // (every row shown that the bank can't pay for counted with the sale that pays for him, whatever the sort: score
        // counts only those that could reach Best's 30; owner, 2026-11-11, "why saka and semenyo xp missing")
        for (const o of shown.filter((x) => x.code === 'budget' && x.delta == null && !x.funded)) fund(o, st.g);
        const weeks = ownWeeks(P, st.g), top = barTop(L, shown, weeks);
        fill(list, shown.length ? shown.map((o) => {
          const rowEl = h('button.ah-lrow', {
            // (one the bank can't pay for is made as it is: pick, never greyed)
            type: 'button', role: 'listitem', class: { blocked: !!o.blocked && o.code !== 'budget' }, disabled: (!o.blocked || o.code === 'budget') && !plan(ctx)?.editable,
            'aria-label': o.blocked && o.code !== 'budget' ? null : o.delta == null ? `Sell ${L.name(out)} for ${o.row.name} from GW${st.g}`
              : `Sell ${L.name(out)} for ${o.row.name} from GW${st.g}: ${COPY.listTotalSaid(o.delta, true)}`,
            onClick: () => pick(o),
          },
          // (no "bench in GW11" under a name: owner, 2026-11-10, "удали 'bench in gw11'")
          who(L, o.row, [statOf(o)]),
          bars(L, o.id, weeks, st.g, top, st.sort),
          // its ≈ over what it counts, your total; forecast points, blue with "xP" (ui.js xpGain; owner, 2026-10-22), no word
          // under it (owner, 2026-11-11, "fix this 'total' crap"); one the bank can't pay for its number as any row's, never
          // "£1.4m short" (owner, 2026-11-11, "remove x '£1.4m short' crap completely"), none where not even one more sale
          // pays for him (buyPlan 'none'); one you can't take says why (In team, your rule)
          h('span.rt.m-num', null, o.delta != null ? xpGain(o.delta, 'span', null, true, '≈ ') : o.code === 'budget' ? null : h('small', null, o.blocked)));
          return rowEl;
        }) : h('p.ah-empty', null, COPY.noneCalled(word, st.q.trim())));
        fill(foot, `"${BEST.name(P)}" is an estimate over ${COPY.span(P.gws)} (best XI each week but a lineup you saved); Forkcast confirms it.`);
        // its taps solved ahead while open (presolveTaps; owner, 2026-10-26): the rows the list ranks first that can be
        // made
        const g = st.g;
        if (P.editable) {
          presolveTaps(ctx, [
            ...shown.filter((o) => !o.blocked).map((o) => ({ kind: 'sell', gw: g, run: () => sellOut(ctx, g, out, o.id) })),
            ...shown.filter((o) => o.code === 'budget').map((o) => ({ kind: 'bring', gw: g, run: () => { const bp = saleBuy(ctx, o.id, g, out); return bp.kind === 'one' && bringIn(ctx, o.id, g, bp); } })),
          ], { gw: g, sig: `${g}|${st.sort}|${st.flip}|${q}`, owner: sheet });
        }
      }

      function pick(o) {
        if (o.blocked && o.code === 'budget') {
          // the sale made as it is, the bank short as FPL's draft is (ahead.saleBuy, both modes); one the club limit
          // stops says why, and the later week he fits in with its action
          const P = plan(ctx), g = st.g;
          const bp = saleBuy(ctx, o.id, g, out);
          if (bp.kind !== 'one') { sayBuyProblem(ctx, P, o.id, bp, 'info'); return; }
          if (!bringIn(ctx, o.id, g, bp)) return;
          sheet.close();
          ctx.navigate('ahead', { gw: g }, { replace: true, top: true });  // no new entry; the top
          return;
        }
        // the one rule of yours that keeps him out from GW g (ahead.barringRules) is removed from the toast
        // (removeRule: verdict and Undo), the list scored again; several: its Review opens Your rules on Ahead; none:
        // the toast says where to go
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

      /** A tapped row is the plan at once (ahead.sellOut: a rule of yours it takes back goes too, named; toast with
       *  Undo): him sold from GW g for `inn`, or (null) for the buy the full plan picks. */
      async function sell(inn) {
        if (st.busy) return;
        st.busy = true;
        const g = st.g;
        try {
          if (!sellOut(ctx, g, out, inn)) return;
          sheet.close();
          ctx.navigate('ahead', { gw: g }, { replace: true, top: true });  // no new entry; the top
        } finally { st.busy = false; }
      }

      draw();
    },
  });
}
