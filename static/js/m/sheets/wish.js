// Forkcast · Bring in a player (the Wish sheet: IPHONE_DESIGN §5.8, M9). Large detent, the search focused. The week is the
// card's it was opened from (owner, 2026-11-05: "do not make choose gw once again"), the week pills over the list another
// (owner, 2026-11-06: "fix bug with missing GW panel"). A row's + is the whole choice: the sheet shuts and the pitch of
// the list's week asks who he replaces, the sale yours (ahead.chooseOnPitch), the money short or
// not; nothing is solved before he is on the pitch (owner, 2026-11-05: "choossaable by one click then offer to choose who
// to replace right on pitch, not pre plan anything until it moved to pitch"). A Wildcard or Free Hit week has no sale to
// choose: his + puts him in the chip's squad. A player your pins keep out (a veto, Never) stays on the list, marked with
// the rule ("Not Groß · all weeks", ahead.barringRule; owner, 2026-11-02: "why players disappear from 'bring in' list when
// added to exclude this gw list"); bringing him in lifts the veto (a one-GW veto of another GW stays).
// The list (owner, 2026-10-10): Replace's rows (buylist.js), All / GK / DEF / MID / FWD, forecast bars, one row of sorts
// (Predicted GW6–9 = his points over that week's own weeks: buylist.js ownWeeks, GW6, Price, Owned, Form, xGI, xGC, DefCon:
// season-to-date per-90 rates, shown only while the bundle has them), each row's number the sort's, a second tap turns it
// round. Every player you could buy of the position (All: every position; owner, 2026-10-15), in the sort's order, with
// your squad of that week where it ranks (greyed, "In your team", a ⋯ in the +'s place opening his card).
// From a player's place ("Other…", {pos, out}: ahead.drawPlace) the sale is chosen already: the list is his position's
// alone (other tabs off, search too) and a + swaps in the list's week at once (swapIn; owner, 2026-10-28).

import { h, fmt, fill, norm, icon, xpNum } from '../../ui.js';
import { COPY } from '../calls.js';
import { plan, weekOf, squadBefore, barred, barringRule, ruleOf, inkAt, saleBuy, sayBuyProblem, bringIn, chooseOnPitch, reroute } from '../ahead.js';
import { weekPills, tabs, barTop, bars, ownWeeks, shirt, found, SORTS, sortsOf, orderOf, sortChips } from './buylist.js';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
export function open(ctx, preId = null, { gw = null, pos = null, out = null } = {}) {
  const P0 = plan(ctx);
  if (!P0) return null;
  const live = (g) => !inkAt(ctx, P0, g);  // a week an arrival can still reach (not frozen, not GW A under way)
  // the week of the card it was opened from, else the one on screen, else the first he can still reach
  const G = [gw, ctx.store.get('gw')].map(Number).find((g) => P0.gws.includes(g) && live(g)) ?? P0.gws.find(live) ?? P0.A;
  /** Ahead on GW g at its top, every sheet gone (a player's sheet over this one too: nothing stale stays up). */
  const leave = (g) => {
    ctx.sheets.closeAll();
    // the week replaces the address, never a new entry (a later Back never switches the week)
    ctx.navigate('ahead', { gw: g }, { replace: true, top: true });
  };
  /** His +: the pitch of week g asks who he replaces. */
  const pick = (id, g = G) => { if (chooseOnPitch(ctx, id, g)) leave(g); };
  // (his card's Bring him in…: chosen already, no list)
  if (preId != null) { pick(Number(preId)); return null; }
  // pos: the position its list opens on (a player's place's "Other…": ahead.drawPlace), else all; place: that player, the
  // sale; lock: opened from his place, the list his position's alone
  const st = { q: '', g: G, pos: POSITIONS.includes(pos) ? pos : 'all', place: out != null ? Number(out) : null, lock: out != null && POSITIONS.includes(pos), sort: 'pts', flip: false };
  const no = barred(P0, P0.A);

  return ctx.sheets.open({
    title: COPY.bringInSheet, detent: 'large', cls: 'ws',
    build(body) {
      // the names FPL writes are mostly surnames (a first name finds no one); a club's short name finds its players
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

      /** A player's row: shirt, his name (his card, on the list's week), club and price, forecast bars and the sort's
       *  number ("24.8" over "xP GW6–9"), his +. One of your squad then (`mine`): greyed, "In your team" ("In your GW8
       *  plan" for one only the plan buys by then: COPY.inYours), a ⋯ in the +'s place opening his card. One your rules
       *  keep out: the rule that does, as its chip says it. `sub2`: a line in place of club and price ("arrives GW8"),
       *  no number. */
      function row(id, sub2 = null, top = 1, mine = false) {
        const P = plan(ctx);
        const r = ctx.data.byId.get(id);
        const name = r?.name ?? P.L.name(id);
        const x = sortOf();
        const v = r && !sub2 ? x.val(P, r, st.g) : null;
        const bar = !mine && no.has(id) ? barringRule(P, id) : null;
        const yours = mine ? COPY.inYours(squadBefore(P, P.A).includes(id), st.g) : null;
        return h('div.ws-item', { class: { mine } },
          h('div.ah-lrow.static', null,
            shirt(P.L, id),
            // his card on the list's week, so its Bring him in… keeps that week (one of yours: his sale, his place)
            h('button.nm.ws-name', { type: 'button', onClick: () => ctx.openSheet('player', id, { gw: st.g }) },
              h('b', null, name),
              h('span', null, sub2 ?? [mine ? yours : bar ? ruleOf(P, bar).text : no.has(id) ? 'Ruled out by you' : null, r?.club, fmt.money(r?.price)].filter(Boolean).join(' · '))),
            sub2 ? null : bars(P.L, id, ownWeeks(P, st.g), st.g, top, x.key),
            // (a forecast sort's number in the forecast's blue, its unit under it naming the weeks: ui.js xpNum; owner,
            // 2026-10-22)
            sub2 ? null : h('span.rt.m-num', null, v == null ? '—' : x.xp ? xpNum(x.num(v), 'span', null, false) : x.num(v), h('small', null, x.unit(P, st.g))),
            // its first letter alone lowered: "in your GW8 plan", never "gw8"
            mine ? h('button.ws-add.ws-mine', { type: 'button', 'aria-label': `${name}, ${yours[0].toLowerCase()}${yours.slice(1)}: his card`, onClick: () => ctx.openSheet('player', id, { gw: st.g }) }, '⋯')
              // from a player's place (st.lock) its tap swaps him in at once: "Swap", outlined (one filled per view; design
              // 1028d K1); else his +
              : st.lock ? h('button.ws-add.m-swap.quiet', { type: 'button', disabled: !P.editable, 'aria-label': `${COPY.bringIn(name, st.g)} for ${P.L.name(st.place)}`, onClick: () => swapIn(id) }, COPY.placeSwap)
                : h('button.ws-add', { type: 'button', disabled: !P.editable, 'aria-label': COPY.bringIn(name, st.g), onClick: () => pick(id, st.g) }, icon('plus', { size: 16 }))));
      }

      /** The list for the week in the sort's order: every player you could buy then (one a rule of yours keeps out
       *  too, marked: row) and your squad of that week, of the position chosen (All: every position), or by name or club while you search
       *  (buylist.found). Never a top few (owner, 2026-10-15). → [{row, mine}] */
      function players(P) {
        const g = st.g;
        const q = norm(st.q.trim());
        const squad = new Set(weekOf(P, g)?.squad ?? squadBefore(P, g));
        const mine = (r) => squad.has(Number(r.id));
        // (opened from a player's place, st.lock: of his position, found or not)
        const at = (r) => (!q || found(r, q)) && ((q && !st.lock) || st.pos === 'all' || P.L.pos(Number(r.id)) === st.pos);
        const ok = (r) => mine(r) || r.buyable;
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
        const top = barTop(L, items, ownWeeks(P, st.g));
        const later = P.weeks.filter((w) => w.gw > g).flatMap((w) => w.in.map((id) => ({ id, gw: w.gw }))).filter((x) => !st.lock || L.pos(x.id) === st.pos);
        // offline: every + off, the reason once above them
        fill(main, P.editable ? null : h('p.ps-off', null, P.why),
          h('div.m-sec', null, items.length ? items.map((o) => row(o.id, null, top, o.mine)) : h('p.ah-empty', null, q ? COPY.noneCalled('player', st.q.trim()) : 'No one fits this filter.')),
          !q && later.length ? h('div.m-sec', null, h('h3', null, 'Your plan buys later'),
            later.map(({ id, gw: at }) => row(id, `arrives GW${at} · bring him in earlier`))) : null);
      }

      /** Opened from a player's place ("Other…": st.lock), a +: `id` in that place from the list's week at once (owner,
       *  2026-10-28): exactly that sale, the money short or not (ahead.saleBuy); one the club limit stops says why
       *  (sayBuyProblem), the later week he fits in with its action. */
      function swapIn(id) {
        const g = st.g, bp = saleBuy(ctx, id, g, st.place);
        if (bp.kind !== 'one') { sayBuyProblem(ctx, plan(ctx), id, bp, 'info'); return; }
        if (!bringIn(ctx, id, g, bp)) return;
        leave(g);
        setTimeout(() => reroute(g), 160);
      }

      draw();
      setTimeout(() => input.focus({ preventScroll: true }), 380);
    },
  });
}
