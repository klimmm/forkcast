// Forkcast · Bring in a player (the Wish sheet: IPHONE_DESIGN §5.8, M9; B35, 2026-10-10: "Bring in" on every bring-in
// label, its footer link "Bring in a player…" and its + too). Large detent, the search focused. "Add" asks for each
// planned GW what it costs to have him from then: the phone's ≈ at once (the best same-position sale that
// fits the budget), then one solve per week on top of your plan's pins (--must-have id@g-end, and not
// before g, so each pill is that arrival week). The plan service keeps one speculative solve per client
// in flight (api/mobile.py solve_post), so the pills are solved one after another, not two at a time: off the hold the
// selected week first, then the likeliest by its ≈ (B134), the line under them saying which week is out, its place among
// those to check and the time so far ("Checking GW7 · 2 of 4 weeks · 0:14", B87b).
// open(ctx, preId?, {gw}?) — a row's + and the Player sheet's "Bring him in…" (preId) work a week out the
// same way (the user, 2026-10-09: "why 'bring him in', 'find funds' and '+' all do different things"; "Add Groß in GW6"
// added him at once from a GW's week line and opened the weeks from a card): + and "Bring him in…" open his week pills.
// A tap on a pill SELECTS that week, never makes it; a sale chip under the pills makes that sale (sells), the verdict
// toast with Undo; closing the sheet is "not now". "Forkcast picks" went (the owner, 2026-10-28: "make it to add player
// even with negative itb like official fpl allow and instead of 'forkcast picks' show it as black transfer suggested as
// usual"): a sale the bank can't pay for is made as it is, the plan short of money as FPL's draft is (ahead.saleBuy,
// memory.holdOf's debts), and Forkcast's way to pay it back is the pitch's best (ahead.plansOf, owedRoad). Opened
// from a GW's week line (its Bring in… door, {gw}) or a card (its GW, B77: solved first) that week is selected
// first, else the best week so far (said "Best:" only when it beats the next by more than the noise, "GW6 or GW7: a
// negligible gap" when it doesn't: bestMark; its pill green (and a chip week's button filled) only for a gain beyond the noise:
// ahead.clearGain, B1 / B28); a week where nothing works (GW A under way: ahead.inkAt) is disabled with its
// reason. A player your pins keep out (a veto, Never) is left off the list and marked in search by that rule ("Not Groß
// · all weeks", ahead.barringRule):
// bringing him in from a GW it keeps him out lifts it (UX-1; a one-GW veto of another GW stays, F11; A6: its verdict names it).
// A1 (the fix pass, 2026-10-08: an action does only what it says; B36, the user 2026-10-10: in both modes, so on the
// suggested plan too, Forkcast then planning the rest around it): a buy is your transfer, exactly: one sale that fits at
// once (ahead.buyPlan 'one'; ahead.bringIn), else the solver's road for him from that week (the money found, whatever it
// takes) made as exact transfers (ahead.want → holdBuy), its pill and line that
// buy's; no week is handed to the planner and no hits rule is set.
// A13: no instruction subtitle; "ARS · £9.6m · 22.2 pts GW6–9"; a small circular + like a choice's.
// The list (the user, 2026-10-10: "when i replace a player it shows graphics … with tabs … why when i click add player it
// shows just a few players"): Replace's rows (buylist.js), the week pills (the arrival week, the opened GW first), All /
// GK / DEF / MID / FWD, each player's forecast bars, and one row of sorts (the user, 2026-10-10: "sorting by 'best for
// plan' in add player just confusing … just show prediction points there not plan calculations"; "instead of cheapest add
// sorting by - price, ownership, form, xgi, predicted points etc."; "also defcon, xg conceded"): Predicted GW6–9 (his
// points from that week to the window's end), GW6, Price, Owned, Form, xGI, xGC, DefCon (FPL's season-to-date per-90
// rates; a sort shows only while the bundle has its values), each row's number the sort's; a second tap on the chosen
// sort turns it round. The list is every player you could buy of the position (All: every position; the user,
// 2026-10-15: "just fix bug so all players are shown"), in the sort's order, with your squad of that week among them
// where it ranks (the user, 2026-10-10: "see players already in
// team … so i can see where they stand"): greyed, "In your team", a ⋯ in the +'s place (the columns stay put) opening his
// card as his shirt does (sell, sub…).
// No plan estimate and no hit here: his + shows each week's.
// His sale (the user, 2026-10-10: "when i click sell player - it let me choose to whom with option to let model choose. but
// when i bring player in - it not let me choose"): under the week pills, Replace's mirror, "Sells: Scott +7.8 · Tavernier
// +3.9 · Rogers · needs £0.4m more" (ahead.saleOptions), the week's own sale (its solve's, or the one sale that pays) marked.
// Each chip is the bring-in itself, one tap (the user, 2026-10-13: "why instead of just clicking on player or on forcast
// chooseing button i need to click twice … this button redundand"): exactly that sale (ahead.saleBuy → bringIn), the money
// short or not, the sheet closed, the verdict toast with Undo; a sale the club limit can't make says why under the chips
// instead. A Wildcard or Free Hit week has no sale to choose: its one button brings him into the chip's squad.
// From a player's place ("Other…", {pos, out}: ahead.drawPlace) the sale is chosen already, as FPL's list after Remove:
// the list his position's alone (the other tabs off, the search too), and a + makes that swap in the list's week at once
// (swapIn; the owner, 2026-10-28: "why mids not block when i replacing def", "why isak not added to pitch").

import * as E from '../../plan/engine.js';
import { h, fmt, fill, norm, icon, xpNum } from '../../ui.js';
import { COPY } from '../calls.js';
import { plan, weekOf, squadBefore, squadWeek, addMove, draftOf, estimate, wishSolve, want, reroute, editable, barred, barringRule, ruleOf, clearGain, inkAt, buyPlan, saleBuy, sayBuyProblem, holdBuy, bringIn, bringInTakes, removesText, inWords, weekWith, saleOptions, waitedText, solvesRound, problemText, presolveTaps } from '../ahead.js';
import { weekPills, tabs, barTop, bars, shirt, found, SORTS, sortsOf, orderOf, sortChips } from './buylist.js';

const plusGlyph = () => {
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 12 12'); s.setAttribute('width', '12'); s.setAttribute('height', '12'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', 'M6 1.5v9M1.5 6h9'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '1.6'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('fill', 'none');
  s.append(p);
  return s;
};

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
/** A week pill no buy fits (a buyPlan 'none'), in its few words: the club limit as Replace's row says it ("3 from
 *  ARS", B30), one the plan already buys by then "in plan" (review 5, 2026-10-12: it read "can't fit"), else "can't fit". */
const cantFit = (bp) => (bp.problem?.code === 'club' ? COPY.clubFull(bp.problem.club) : bp.problem?.code === 'owned' ? 'in plan' : "can't fit");
/** A week pill's number, shown and said alike (review 5, 2026-10-12: VoiceOver heard fmt.num's rounding, the screen
 *  fmt.signed's): a ≈ while its solve is out, `unit` under it what it counts, your total (the user, 2026-10-21: fix all
 *  (first-use proposal #1): Alex's "+1.8" tile beside a plan sheet's "+2.0"); "…" while no number is known, never the
 *  money short in the loss colour (the solve may still find the money, B30; the Sells chips carry it). → {shown, said,
 *  unit?} */
export const pillWords = (o) => (o.delta == null ? { shown: '…', said: 'checking' }
  : { shown: `${o.kind === 'est' ? '≈' : ''}${fmt.signed(o.delta)}`, said: COPY.listTotalSaid(o.delta, o.kind === 'est'), unit: COPY.listTotal });
/** A sale chip's tail for player `id` in GW g (x: a saleOptions row), shown and said: its points, named as the week pill
 *  over it names the same measure, your total's move (`unit`; the review of the first-use proposals, 2026-10-21); one the money can't
 *  pay alone, the money short, not in the loss colour, its tap the sale all the same (ahead.saleBuy: the plan short of
 *  money as FPL's draft is, the pitch then offering what pays it back); one the club
 *  limit stops, its reason as a week pill says it ("3 from ARS": cantFit), never a bare "can't". → {tail, loss, said, off, unit?} */
export function saleWords(ctx, id, g, x) {
  if (x.cmp) return { tail: fmt.signed(x.cmp.delta), loss: false, said: COPY.listTotalSaid(x.cmp.delta), off: false, unit: COPY.listTotal };
  const short = x.problem?.code === 'budget' ? x.problem.short : null;
  if (short == null) return { tail: cantFit(x), loss: false, said: `can't be made, ${cantFit(x)}`, off: true };
  // "Groß · needs £5.2m more" (the user, 2026-10-22: "Groß £5.2m short" read as Groß short of money)
  return { tail: `· ${COPY.moneyNeeds(short)}`, loss: false, said: COPY.moneyNeeds(short), off: false };
}
/** A week pill whose moves are known: one sale pays for him (buy) or the solve came back (road). */
const works = (o) => o?.kind === 'buy' || o?.kind === 'road';
/** A known week as ahead.weekWith / inWords take it: the week's own buy (bp: a week one sale pays for, or a solved
 *  road's GW-g moves, ahead.holdBuy), what its pill counts. */
const how = (o) => ({ bp: o.bp });

export function open(ctx, preId = null, { gw = null, pos = null, out = null } = {}) {
  const P0 = plan(ctx);
  if (!P0) return null;
  // the GW it was opened on (the week line's Bring in… door, his card: {gw}): his pills open on that week
  const G = gw != null && P0.gws.includes(Number(gw)) ? Number(gw) : null;
  // sel: the week the line speaks for; own: you tapped it (a solve landing later never moves it); g: the list's week
  const live = (g) => !inkAt(ctx, P0, g);  // a week an arrival can still reach (B7: not frozen, not GW A under way)
  // out: the sale you chose for a player's selected week ({g, out}) that can't be made; need: the weeks his reach sent to
  // a solve, in its order; wait: the solve out ({g, i, n, t0}, B87b), its line's clock ticking (tick)
  // (pos: the position its list opens on, a player's place's "Other…": ahead.drawPlace; else all; place: that player,
  // whose sale the Sells row leads with: sells; lock: opened from his place, the list his position's alone, the other
  // tabs off and the search finding only his position, the owner, 2026-10-28: "why mids not block when i replacing def")
  const st = { q: '', open: null, res: {}, sel: {}, own: {}, out: {}, need: {}, wait: null, tick: null, req: null, run: 0, g: G ?? P0.gws.find(live) ?? P0.A, pos: POSITIONS.includes(pos) ? pos : 'all', place: out != null ? Number(out) : null, lock: out != null && POSITIONS.includes(pos), sort: 'pts', flip: false };
  const no = barred(P0, P0.A);

  const stop = () => { st.run++; st.req?.cancel?.(); st.req = null; clearInterval(st.tick); st.wait = null; presolveTaps(ctx, null, { owner: st }); };

  return ctx.sheets.open({
    title: COPY.bringInSheet, detent: 'large', cls: 'ws',
    onClose: stop,
    build(body) {
      // B93: the names FPL writes are mostly surnames (a first name finds no one); a club's short name finds its players
      const input = h('input', { type: 'search', placeholder: 'Search by surname', 'aria-label': 'Search by surname', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search' });
      const pillsEl = h('div.ah-pills', { role: 'group', 'aria-label': 'From gameweek' });
      const posEl = h('div.m-seg.small', { role: 'radiogroup', 'aria-label': 'Position' });
      const main = h('div.ws-main');
      const sortEl = h('div.ws-sorts', { role: 'radiogroup', 'aria-label': 'Sort by' });
      body.append(h('label.ah-search', null, icon('search', { size: 16 }), input), pillsEl, posEl, sortEl, main);
      input.addEventListener('input', () => { st.q = input.value; draw(); });
      /** The sorts this bundle can back (buylist.sortsOf), the one chosen. */
      const sorts = () => sortsOf(ctx);
      const sortOf = () => sorts().find((x) => x.key === st.sort) ?? SORTS[0];

      /** A player's row: shirt, his name (his card, on the list's week), club and price, his forecast bars and the sort's
       *  number ("24.8" over "pts GW6–9", "38.2%" over "owned"…), his +. One of your squad then (`mine`): greyed, "In your
       *  team" (one only the plan buys by then "In your GW8 plan": COPY.inYours), a ⋯ in the +'s place opening his card as his shirt does. One your rules keep out: the rule that does, as
       *  its chip says it ("Not Groß · all weeks": B90b, one name for one rule). `sub2`: a line in place of club and price
       *  ("arrives GW8"), no number. */
      function row(id, sub2 = null, top = 1, mine = false) {
        const P = plan(ctx);
        const r = ctx.data.byId.get(id);
        const open = st.open === id;
        const name = r?.name ?? P.L.name(id);
        const x = sortOf();
        const v = r && !sub2 ? x.val(P, r, st.g) : null;
        const bar = !mine && no.has(id) ? barringRule(P, id) : null;
        const yours = mine ? COPY.inYours(squadBefore(P, P.A).includes(id), st.g) : null;
        return h('div.ws-item', { class: { open, mine } },
          h('div.ah-lrow.static', null,
            shirt(P.L, id),
            // his card on the list's week, so its Bring him in… keeps that week (one of yours: his sale, his place)
            h('button.nm.ws-name', { type: 'button', onClick: () => ctx.openSheet('player', id, { gw: st.g }) },
              h('b', null, name),
              h('span', null, sub2 ?? [mine ? yours : bar ? ruleOf(P, bar).text : no.has(id) ? 'Ruled out by you' : null, r?.club, fmt.money(r?.price)].filter(Boolean).join(' · '))),
            sub2 ? null : bars(P.L, id, P.gws, st.g, top, x.key),
            // (a forecast sort's number in the forecast's blue, its unit under it naming the weeks: ui.js xpNum; the user,
            // 2026-10-22)
            sub2 ? null : h('span.rt.m-num', null, v == null ? '—' : x.xp ? xpNum(x.num(v), 'span', null, false) : x.num(v), h('small', null, x.unit(P, st.g))),
            // his week pills, as "Bring him in…" opens them (the list's week selected first): never a buy at once; opened
            // from a player's place (st.lock), him in that place at once (swapIn)
            // its first letter alone lowered: "in your GW8 plan", never "gw8" (review 5, 2026-10-12)
            mine ? h('button.ws-add.ws-mine', { type: 'button', 'aria-label': `${name}, ${yours[0].toLowerCase()}${yours.slice(1)}: his card`, onClick: () => ctx.openSheet('player', id, { gw: st.g }) }, '⋯')
              // open: a × in the +'s place closes his row (the columns stay put)
              : open ? h('button.ws-add.ws-mine', { type: 'button', 'aria-label': `Close ${name}`, onClick: () => { stop(); st.open = null; draw(); } }, '×') : h('button.ws-add', {
              type: 'button', disabled: !P.editable,
              'aria-label': st.lock ? `${COPY.bringIn(name, st.g)} for ${P.L.name(st.place)}` : `Bring in ${name}: pick a week`,
              onClick: () => (st.lock ? swapIn(id) : reach(id)),
            }, plusGlyph())),
          open ? pills(id) : null);
      }

      function pills(id) {
        const P = plan(ctx);
        const res = st.res[id] || {};
        const sel = st.sel[id];
        // a Wildcard or Free Hit week has no sale to choose: the chip remakes the squad around him
        const chip = sel != null ? squadWeek(weekOf(P, sel)) : null;
        // a sale tapped that can't be made (sale: saleBuy found no way): its reason the line's while that week is selected
        // and it still can't be made, until another chip or a new player
        const mine = st.out[id]?.g === sel && !chip ? st.out[id].out : null;
        const tried = mine != null ? saleBuy(ctx, id, sel, mine) : null;
        const failed = tried?.kind === 'none' ? tried : null;
        const pill = (g) => {
          const o = res[g];
          if (!o) return h('button.ah-ap.sk', { type: 'button', disabled: true }, h('span.g', null, `GW${g}`), h('span.v'));
          if (o.kind === 'owned') return h('button.ah-ap.bad', { type: 'button', disabled: true }, h('span.g', null, `GW${g}`), h('span.v', null, 'in team'));
          if (o.kind === 'bad') return h('button.ah-ap.bad', { type: 'button', disabled: true }, h('span.g', null, `GW${g}`), h('span.v', { class: { 'g-loss': o.short } }, o.text));
          const solving = o.kind === 'est';
          // a tap selects the week (the line under the pills names its moves, the sale chips make them); a ≈ pill too (the
          // line says it is checking until its solve lands), never one the phone found no sale for. A week he adds a hit
          // to says what the week then pays in all, the line's own figure (M18; the checker, 2026-10-09: "with −4" over a
          // line reading "3 transfers, −8")
          const all = o.hits ? weekWith(P, g, how(o))?.hits : 0;
          const hit = all ? `with −${E.HIT_COST * all}` : '';
          const pw = pillWords(o);
          return h('button.ah-ap', {
            type: 'button', class: { sel: sel === g, 'm-shimmer': solving, fill: !solving }, disabled: o.delta == null, 'aria-pressed': String(sel === g),
            'aria-label': `GW${g}: ${pw.said}${hit ? `, ${hit}` : ''}`,
            onClick: () => { st.sel[id] = g; st.own[id] = true; draw(); },
          }, h('span.g', null, `GW${g}`, hit ? ` ${hit}` : ''),
          // (its number forecast points, blue with "xP" whatever it pays, its sign its direction: ui.js xpNum; the user,
          // 2026-10-22, after v1.3.68: no green number)
          h('span.v.m-num', null, o.delta == null ? pw.shown : xpNum(pw.shown)),
          pw.unit ? h('span.u', null, pw.unit) : null);
        };
        const o0 = sel != null ? res[sel] : null;
        const done = P.gws.every((g) => res[g] && res[g].kind !== 'est');
        const o = failed ? { kind: 'none', bp: failed } : o0;
        const sales = sel != null && !chip && o0 && !['owned', 'bad'].includes(o0.kind) ? sells(id, sel, o0) : null;
        let fund, go = null;
        if (works(o)) {
          // its every move, its transfers and hit in all (ahead.inWords) where one tap makes them: a chip week's button, a
          // week one sale pays for (its marked chip); a solved road's are no tap's ("Forkcast picks" went: the owner,
          // 2026-10-28), its marked chip its sale alone
          const words = chip || o.kind === 'buy' ? inWords(P, sel, how(o)) : null;
          const best = bestMark(id, sel, done);
          // the rules of yours this arrival takes back (a veto of him from then on; a buy's, a later buy of him and its
          // funding too: ahead.bringInTakes): the chip or button takes them back (its verdict names them)
          const off = bringInTakes(P, id, sel, o.bp);
          // B73 (the recorded no-repeat rule): no points where the selected pill or sale shows them (the selected pill shows
          // the sale you chose too, a funded one's whole number)
          // (no words and no claim: no line, never a bare "GW9.")
          const head = words || best ? `${best}GW${sel}${words ? ` · ${words}` : ''}.` : null;
          fund = [head, off.length ? `${head ? ' ' : ''}${removesText(P, off)}` : ''];
          // a Wildcard or Free Hit week's one button (no sale chips there), filled only for a gain beyond the noise (B28: a
          // loss or a toss-up is the plain button)
          go = chip ? h('div.ah-btnrow', null, h('button', { type: 'button', class: { acc: clearGain(o.cmp) }, disabled: !editable(ctx), onClick: () => take(id, sel, o) }, COPY.bringInChip(P.L.name(id), sel, chip))) : null;
        } else if (o?.kind === 'none') {
          const p = o.bp.problem;
          // the club limit with its reason (review 5, 2026-10-12: was a bare "can't be made"; ahead.problemText)
          // the buy for the sale ("Groß for Rogers can't be made: …")
          const pair = `${P.L.name(id)} for ${P.L.name(mine)}`;
          fund = p?.code === 'club' ? `${pair} can't be made: ${problemText(ctx, p)}` : `${pair} can't be made in GW${sel}.`;
        } else fund = done ? noneWorks(id) : st.wait ? [COPY.checkingWeek(st.wait.g, st.wait.i, st.wait.n), h('span.ws-clock', { 'aria-hidden': 'true' }, waited())] : '';
        return h('div.ws-x', null,
          h('div.ah-apills', null, P.gws.map(pill)),
          sales,
          h('p.ws-fund', { 'aria-live': 'polite' }, fund),
          go,
          // a plan you can't edit (offline): its chips, button and every + are off, the reason under them, as the player card says it
          P.editable ? null : h('p.ps-off', null, P.why));
      }

      /** B51: the line when no week works, every pill done (H16), as the pills say it: the weeks sent to a solve all failed
       *  to check ("no connection" only when each says offline: a "can't check" is the server's), all came back not
       *  possible, or else each pill's own reason. */
      function noneWorks(id) {
        const said = (st.need[id] || []).map((g) => st.res[id][g]?.text);
        if (said.length && said.every((t) => t === 'offline' || t === "can't check")) return COPY.weeksUnchecked(said.every((t) => t === 'offline'));
        if (said.length && said.every((t) => t === 'not possible')) return COPY.noWeekPossible(plan(ctx).gws);
        return COPY.noWeekWorks;
      }

      /** "Sells:" for player `id` in GW g, each chip the bring-in itself (one tap): each sale of his position with him in
       *  its place against your plan, best first ("Scott +7.8"; one the money can't pay alone "Rogers · needs £0.4m more",
       *  made as it is: saleBuy; one the club limit stops greyed, "Rice 3 from ARS": saleWords), the week's own sale (`o0`:
       *  its solve's, or the one sale that pays) marked. A sale saleBuy can't make says why on the line instead (st.out). */
      function sells(id, g, o0) {
        const P = plan(ctx), nm = P.L.name;
        const act = (out) => sale(id, g, out);
        const chip = (label, aria, onClick, cls = '', off = false) => h(`button${cls}`, { type: 'button', disabled: off || !editable(ctx), 'aria-label': aria, onClick }, label);
        const opts = saleOptions(ctx, id, g);
        // opened from a player's place ("Other…": st.place), the sale is his: his chip first and marked (the owner,
        // 2026-10-28: Haaland chosen in João Pedro's place came in for Isak); else the week's own sale marked, where known
        const his = opts.find((x) => x.out === st.place && !saleWords(ctx, id, g, x).off) ?? null;
        const own = works(o0) ? Number(o0.bp?.out) : null;
        const rec = his ?? opts.find((x) => x.out === own && !saleWords(ctx, id, g, x).off) ?? null;
        const saleChip = (x) => {
          const w = saleWords(ctx, id, g, x);
          // (a sale's number blue with "xP", as the week pill's: xpNum; words, the money it needs, in the chip's ink)
          return chip([nm(x.out), ' ', x.cmp ? xpNum(w.tail, 'span.m-num') : h('span.m-num', { class: { 'g-loss': w.loss } }, w.tail), w.unit ? h('small.u', null, ` ${w.unit}`) : null],
            `${COPY.bringIn(nm(id), g)} for ${nm(x.out)}: ${w.said}`, () => act(x.out), w.off ? '.off' : x === rec ? '.rec' : '');
        };
        return h('div.ws-sells', { role: 'group', 'aria-label': `Bring in ${nm(id)} from GW${g}, selling` },
          h('span.ws-sl', { 'aria-hidden': 'true' }, 'Sells'),
          his ? saleChip(his) : null,
          opts.filter((x) => x !== his).map(saleChip));
      }

      /** The list for the week in the sort's order: every player you could buy then (not kept out by a rule of yours) and
       *  your squad of that week, of the position chosen (All: every position), or by name or club while you search
       *  (every position: buylist.found). Never a top few (the user, 2026-10-15: "why van Ewijk missing", £3.9m and 51st of
       *  113 buyable DEFs by the forecast under Price ↑, when each position listed its best ten by it; then "why raya
       *  missing now in gks sorted by price"; "just fix bug so all players are shown"). → [{row, mine}] */
      function players(P) {
        const g = st.g;
        const q = norm(st.q.trim());
        const squad = new Set(weekOf(P, g)?.squad ?? squadBefore(P, g));
        const mine = (r) => squad.has(Number(r.id));
        const ruled = barred(P, g);
        // (opened from a player's place, st.lock: of his position, found or not)
        const at = (r) => (!q || found(r, q)) && ((q && !st.lock) || st.pos === 'all' || P.L.pos(Number(r.id)) === st.pos);
        const ok = (r) => mine(r) || (r.buyable && (q || !ruled.has(Number(r.id))));
        return ctx.data.rows.filter((r) => at(r) && ok(r)).sort(orderOf(sortOf(), st.flip, P, g)).map((r) => ({ row: r, mine: mine(r) }));
      }

      function draw() {
        const P = plan(ctx);
        if (!P) return;
        const L = P.L, g = st.g, q = norm(st.q.trim());
        weekPills(pillsEl, P.gws, g, live, (x) => { st.g = x; draw(); });
        tabs(posEl, [['all', 'All'], ...POSITIONS.map((x) => [x, x])], st.pos, (k) => { st.pos = k; draw(); }, (k) => st.lock && k !== st.pos);
        posEl.hidden = !!q;
        // the sorts as chips in one sideways row (buylist.sortChips)
        sortChips(sortEl, sorts(), st, P, g, draw);
        const items = players(P).map((o) => ({ ...o, id: Number(o.row.id) }));
        const ids = items.map((o) => o.id);
        const top = barTop(L, items, P.gws);
        const later = P.weeks.filter((w) => w.gw > g).flatMap((w) => w.in.map((id) => ({ id, gw: w.gw }))).filter((x) => !st.lock || L.pos(x.id) === st.pos);
        const extra = st.open != null && !ids.includes(st.open) && !later.some((x) => x.id === st.open) ? row(st.open, null, top) : null;
        // a plan you can't edit (offline): every + is off, the reason once above them (an open row says it under its button)
        fill(main, P.editable || st.open != null ? null : h('p.ps-off', null, P.why), extra,
          h('div.m-sec', null, items.length ? items.map((o) => row(o.id, null, top, o.mine)) : h('p.ah-empty', null, q ? COPY.noneCalled('player', st.q.trim()) : 'No one fits this filter.')),
          !q && later.length ? h('div.m-sec', null, h('h3', null, 'Your plan buys later'),
            later.map(({ id, gw: at }) => row(id, `arrives GW${at} · bring him in earlier`))) : null);
        // the open player's taps solved ahead (presolveTaps; the owner, 2026-10-26: "fix speed so all pre solved and done
        // without no cost"): a Wildcard or Free Hit week's button (take), then the selected week's sale chips (sale:
        // saleBuy with that sale, the money short or not)
        const id = st.open, res = id != null ? st.res[id] || {} : {}, sel = id != null ? st.sel[id] : null;
        const weeks = id == null ? [] : [sel, ...P.gws.filter((x) => x !== sel)].filter((x) => x != null && works(res[x]) && squadWeek(weekOf(P, x)));
        const sales = sel != null && !squadWeek(weekOf(P, sel)) && res[sel] && !['owned', 'bad'].includes(res[sel].kind)
          ? saleOptions(ctx, id, sel).filter((x) => !saleWords(ctx, id, sel, x).off) : [];
        if (P.editable && (weeks.length || sales.length)) {
          presolveTaps(ctx, [
            ...weeks.map((x) => ({ kind: 'bring', gw: x, run: () => (res[x].kind === 'buy' ? bringIn(ctx, id, x, res[x].bp) : want(ctx, id, x, res[x].road)) })),
            ...sales.map((x) => ({ kind: 'bring', gw: sel, run: () => { const bp = saleBuy(ctx, id, sel, x.out); return bp.kind === 'one' && bringIn(ctx, id, sel, bp); } })),
          ], { gw: sel ?? g, sig: `${id}|${weeks.join()}|${sales.map((x) => x.out).join()}`, owner: st });
        }
      }

      /** B87b: the time since the first solve went out (ahead.waitedText, the bake's clock), after the line's " · ": drawn
       *  with the line and put in place each second (tickWait), never a whole draw; not read out each second. */
      const waited = () => waitedText(st.wait.t0);
      const tickWait = () => { const el = main.querySelector('.ws-clock'); if (el && st.wait) el.textContent = waited(); };

      /** The pills for `id`: the phone's ≈ for every week at once, then the server's solve, one week at a time. */
      async function reach(id) {
        stop();
        const my = st.run;
        st.open = id;
        st.res[id] = {};
        st.sel[id] = null;
        st.own[id] = false;
        st.out[id] = null;
        const P = plan(ctx);
        const d0 = draftOf(ctx);
        const pos = P.L.pos(id);
        for (const g of P.gws) {
          // in your team that week: going into it and still there, or in a Wildcard or Free Hit week's squad
          const w = weekOf(P, g);
          if (w?.squad.includes(id) && (squadBefore(P, g).includes(id) || squadWeek(w))) { st.res[id][g] = { kind: 'owned' }; continue; }
          // GW A under way (FPL has it: B7; inkAt's frozen weeks are none since Freeze went, 2026-10-12)
          if (inkAt(ctx, P, g)) { st.res[id][g] = { kind: 'bad', text: P.mem?.frozen?.includes(g) ? 'frozen' : 'live' }; continue; }
          // one sale that fits is the exact transfer at once (buyPlan 'one'; B36: in both modes); the money short, the
          // solver finds it below as for any week (never the phone's own second sale)
          const bp = buyPlan(ctx, id, g);
          if (bp.kind === 'one') { st.res[id][g] = { kind: 'buy', bp, cmp: bp.cmp, delta: bp.cmp.delta, hits: bp.hits }; continue; }
          // B30: the club limit too (more sales may get round it)
          if (bp.kind === 'none' && !solvesRound(bp)) { st.res[id][g] = { kind: 'bad', text: cantFit(bp) }; continue; }
          // a Wildcard or Free Hit week: no sale's ≈ (the chip remakes the squad), only the solve with him in it
          if (bp.problem?.code === 'chip') { st.res[id][g] = { kind: 'est', delta: null }; continue; }
          const ev0 = estimate(ctx, d0, g);
          const tries = squadBefore(P, g).filter((p) => P.L.pos(p) === pos).map((o) => ({ o, r: addMove(ctx, d0, g, o, id) }));
          const okk = tries.filter((t) => !t.r.problem).sort((a, b) => b.r.ev.total - a.r.ev.total)[0];
          st.res[id][g] = { kind: 'est', delta: okk ? okk.r.ev.total - ev0.total : null };
        }
        pickBest(id);  // H16: a week one sale pays for is never solved, so it is the best already (or the list's week)
        // the weeks to solve (not in team, live, can't fit, nor one sale pays); the selected week first (the
        // card's, the week line's: pickBest; B77, the user 2026-10-10: one week carries card → Add a player),
        // then B134 off the hold by its ≈, largest first and a week with none last, so a better week seldom lands after a
        // worse one has the line; under the hold in GW order
        const est = (g) => st.res[id][g].delta, sel = st.sel[id];
        const need = P.gws.filter((g) => st.res[id][g]?.kind === 'est');
        need.sort((a, b) => (b === sel) - (a === sel) || (P.mem?.hold ? 0 : (est(a) == null) - (est(b) == null) || (est(b) ?? 0) - (est(a) ?? 0)));
        st.need[id] = need;
        // B87b: the line's week out, its place among these, the clock from the first one's start (null once all are in)
        const onWeek = (i) => { st.wait = i < need.length ? { g: need[i], i: i + 1, n: need.length, t0: st.wait?.t0 ?? Date.now() } : null; };
        onWeek(0);
        if (st.wait) st.tick = setInterval(tickWait, 1000);
        draw();
        input.blur();
        for (const [i, g] of need.entries()) {
          if (st.run !== my) return;
          await solvePill(id, g, my);
          if (st.run !== my) return;
          onWeek(i + 1);
          if (!st.wait) clearInterval(st.tick);
          pickBest(id);
          draw();
        }
      }

      /** One arrival week: the solve with your pins plus him from g (F17: under the solver's own default hits, so a
       *  hit he needs is the solver's call where it pays, and You → Hits holds where you set it: memory's derived
       *  'hits' pin, in every solve's values: withHits; the relief
       *  ladder charges its own rules.py relief_hit_cost for a hit it forces, rolling.py _solve_relief). `hits`: the hits
       *  the road takes in GW g more than your plan (a buy's: bp.hits), what the pill's points charge; the pill and the line
       *  print the week's in all (weekWith). */
      async function solvePill(id, g, my) {
        const P = plan(ctx);
        try {
          st.req = wishSolve(ctx, P, id, g, 'wish');
          const res = await st.req;
          if (st.run !== my) return;
          if (res.state === 'error') { st.res[id][g] = { kind: 'bad', text: res.error?.code === 'infeasible' ? 'not possible' : "can't check" }; return; }
          if (res.state !== 'done' || !res.road) return;
          // the button makes the road's GW-g moves as your transfers (ahead.holdBuy, as want makes them; B36: in both
          // modes): the pill is that buy's points and hit, never the road's later weeks (the checker, 2026-10-09: Why
          // not's −8.8 was the road's, the tap made −11.4)
          const bp = holdBuy(ctx, id, g, res.road);
          if (!bp || bp.kind === 'none') { st.res[id][g] = { kind: 'bad', text: bp ? cantFit(bp) : "can't fit" }; return; }
          st.res[id][g] = { kind: 'road', road: res.road, bp, cmp: bp.cmp, delta: bp.cmp.delta, hits: bp.hits };
        } catch (e) {
          st.res[id][g] = { kind: 'bad', text: e.code === 'unreachable' || e.code === 'timeout' ? 'offline' : "can't check" };
        }
      }

      /** The weeks that work (a solved week's gap, or a week one sale pays for), best first: [[gw, o]]. */
      const ranked = (id) => Object.entries(st.res[id] || {}).filter(([, o]) => works(o)).sort((a, b) => b[1].delta - a[1].delta);
      /** The best arrival so far, the week first selected when no other is (pickBest; a selection claims nothing). */
      function bestWeek(id) {
        const best = ranked(id)[0];
        return best ? Number(best[0]) : null;
      }
      /** B72b: the line's claim on the selected week `sel`, by chipBests' rule: "Best: " ("Best so far: " until every week
       *  is in) only when the top week gains beyond the noise (clearGain) and beats the next working week (else 0) by more
       *  than a toss-up (engine.verdictLabel of the gap); else nothing (the top two's "GW6 or GW7: a negligible gap" went:
       *  the user, 2026-10-18, "remove 'negligible' … and similiar crap"). */
      function bestMark(id, sel, done) {
        const [top, next] = ranked(id);
        if (!top) return '';
        const noise = plan(ctx).noise;
        const tops = [top, next].filter(Boolean).map(([g]) => Number(g));
        const clear = E.verdictLabel(top[1].delta - (next ? next[1].delta : 0), noise) !== 'coin';
        return tops[0] === sel && clear && clearGain(top[1].cmp) ? (done ? 'Best: ' : 'Best so far: ') : '';
      }
      /** The week the line speaks for: the one you tapped while it can still work, else the list's week (opened on the
       *  plan's GW) while it can, else the best so far. */
      function pickBest(id) {
        const r = st.res[id];
        const live2 = (o) => works(o) || o?.kind === 'est';
        if (st.own[id] && live2(r[st.sel[id]])) return;
        st.own[id] = false;
        st.sel[id] = live2(r[st.g]) ? st.g : bestWeek(id);
      }

      /** A Sells chip for player `id` in GW g tapped (`out`: a sale of his): exactly that sale on the plan as it is now
       *  (ahead.saleBuy: the money short or not, as FPL makes a draft), the week the one you tapped in (st.own, pickBest);
       *  one the club limit stops says why on the line instead (st.out). */
      function sale(id, g, out) {
        st.out[id] = null;
        st.own[id] = true;
        const bp = saleBuy(ctx, id, g, out);
        if (bp.kind === 'none') { st.out[id] = { g, out }; draw(); return; }
        take(id, g, { kind: 'buy', bp });
      }
      /** Opened from a player's place ("Other…": st.lock), a +: `id` in that place from the list's week at once, as FPL's
       *  list after Remove and Replace's rows make it (the owner, 2026-10-28: "why isak not added to pitch: i click other
       *  then '+' next to isak"): exactly that sale, the money short or not (ahead.saleBuy); one the club limit stops says
       *  why (sayBuyProblem), the later week he fits in with its action. */
      function swapIn(id) {
        const g = st.g, bp = saleBuy(ctx, id, g, st.place);
        if (bp.kind !== 'one') { sayBuyProblem(ctx, plan(ctx), id, bp, 'info'); return; }
        take(id, g, { kind: 'buy', bp });
      }
      /** A sale chip's or a chip week's button's bring-in: exactly the moves it names (a sale: bringIn; a Wildcard or Free
       *  Hit week's solved road: ahead.want, its GW-g moves as your transfers in both modes, B36), a rule of yours it takes
       *  back named in its verdict (A6); then Ahead on that week, the verdict toast with Undo. Refused (offline, GW A under
       *  way: the toast says why), the sheet is drawn again, its week picked afresh (pickBest). */
      function take(id, g, o) {
        if (!(o.kind === 'buy' ? bringIn(ctx, id, g, o.bp) : want(ctx, id, g, o.road))) { pickBest(id); draw(); return; }
        leave(g);
      }
      function leave(g) {
        stop();
        ctx.sheets.closeAll();  // a player's sheet over this one goes too: nothing stale stays up
        // the week replaces the address, never a new entry (B45: a later Back never switches the week), Ahead at its top (H1)
        ctx.navigate('ahead', { gw: g }, { replace: true, top: true });
        setTimeout(() => reroute(g), 160);
      }

      draw();
      if (preId != null) reach(Number(preId));
      else setTimeout(() => input.focus({ preventScroll: true }), 380);
    },
  });
}
