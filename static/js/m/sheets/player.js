// Forkcast · Player sheet (IPHONE_DESIGN §5.6; the 2026-10-07 card: "Match strip" with five grafts;
// the 2026-10-08 fix pass B1-B3: actions first, one type scale).
// Full screen (the large detent; medium until 2026-10-15). Top to bottom: kit, name, "ARS · MID · £9.6m · 38.2% owned · form 6.4"; what you
// can do (the user, 2026-10-13: the armband, subs and chips only on the pitch and in Chips…, no buttons for them here;
// Keep: Off · GW6 · GW6–9; Force out: Off · GW7 only · From GW8…, the sale and the old Ruled out in one control;
// the user, 2026-10-14: "'force keep is off' is much clear… 'sell not gw7' is confusing"); his
// status (FPL's availability "75% · ankle injury"); LAST 6 · NEXT 5 — two lines on one points scale (the user,
// 2026-10-14: "past matches and forecast shall be back splitted in two lines so enough space for all"; one row from
// 2026-10-13, "show last and next 5 in one line and unify design"), his last six matches (solid bars, width = minutes) over the next five
// forecasts (hollow, a local page's model runs as ticks; a buy of the plan has the player he replaces as ○ in each
// column, named in the chart's key, N11; no past matches: NEXT 5 alone and "Past matches unavailable"); a dotted line at his position's average points per appearance over the same matches; every opponent, past and
// coming, on its FPL difficulty colour (the pitch's --fdr-1..5); the chart's key behind ⓘ; STATS — every peer of his
// position as a dot on the stats the data chose for him (api/stats_pick.json; api/card.py _kinds, _rows), per match
// or per 90 (its switch, this viewer's last pick), his value and rank. Nothing under them (the user, 2026-10-13: the
// Price / Owned / Cups block "already covered in other parts"; the xG + xA / defensive contribution / saves line and
// the replaced player's sum went the same day, the stats and the chart's key say them). open(ctx, id, {gw}) — the
// route #/player/<id> opens it too.
// The 2026-10-08 card pass (the user, on Calafiori's card: "why player cards still use random fonts and the other
// tournaments not in the fixture past and previous"): every text on one rule, the main screen's (m.css "the player
// card's type"; since 2026-10-13, "fix random fonts": its labels and facts 13), cap headers 11/600, the chart's labels
// 13 (codes and values 600, the rest muted), buttons 15/600; no tooltip ("DC" said in words). His cup and European matches
// stand among his six in date order (a narrower grey column each: "CL", "H", his minutes "59′"), every one of them; his
// club's coming ones among the forecast GWs the same way, with no minutes (sheets/strip.js).
// Past matches, position averages, the stats and cups come from GET /api/m/player (api/card.py); the forecast, plan and
// prices from the bundle (the real-points scale, api/scale.py). A number the files lack draws as "–", never filled in.
// A player the plan sells in the shown GW still counts as yours there (Keep, Sell: UX-3).
// Your rules about him show and come off here (RULES_V2 §3): for a player you own, Keep · Off / GW8 / GW8–9
// (F11: a Keep scoped to the shown GW lets the plan sell him in another) and Force out · Off / GW8 only / From GW9… (a
// Wildcard or Free Hit week's squad: Force keep holds him in it, GW8 only keeps him out; GW8's options alone there); for
// one you don't, Not him · Off / GW8 only / GW6–9 (B130: the same control, a veto of the shown GW or of every week); a sale
// the Sell row doesn't show, a wish, or a Keep or a veto of another GW shows with its way back (UX-6). A change that
// undoes an older rule of yours acts at once, its verdict naming the rule it takes back, with Undo (A6).

import { h, fmt, fill, statusInfo, posName, posCode, roving, xpNum } from '../../ui.js';
import { COPY, newsReason } from '../calls.js';
import { getPlayer } from '../api.js';
import * as AH from '../ahead.js';
import * as S from './strip.js';
import { oppText } from '../../plan/pitch.js';
import {
  plan, weekOf, squadBefore, shirtOf, keep, never, veto, editable, pinOf, pinsOf, removeRule, ruleOf,
} from '../ahead.js';

/** WhoScored's predicted lineup for the next deadline's GW (solver data_io/data.py ws_preview), as the card says it. */
const PREVIEW = { S: 'Predicted to start', B: 'Predicted bench', O: 'Predicted out', D: 'Predicted doubtful', DS: 'Predicted doubtful' };
const LAST_N = 6;  // api/card.py LAST_N: the past columns held open while the card loads
export const WORD = { GK: 'goalkeepers', DEF: 'defenders', MID: 'midfielders', FWD: 'forwards' };
// the stats' rows (api/stats_pick.json: every stat of the actions a kind of points may show, tools/stats_pick.py
// ACTIONS): label, decimals; FPL's defensive contribution shortened to fit the chart's 124 px label column at 13 px (the
// review, 2026-10-13: spelt out it ran onto the strip), still in words; calls.test.mjs checks every one has one
export const STAT = {
  shots_inside_box: ['Shots in box', 1], touches_inside_box: ['Touches in box', 1], key_passes: ['Key passes', 1],
  xg_opta: ['xG', 2], xa_opta: ['xA', 2], xgi_opta: ['xGI', 2], clearances: ['Clearances', 1], interceptions: ['Interceptions', 1],
  aerial_duel_won: ['Aerials won', 1], total_saves: ['Saves', 1], saves_inside_box: ['Saves in box', 1], recoveries: ['Recoveries', 1],
  defensive_contribution: ['Def. contribution', 1], clean_sheets: ['Clean sheets', 2], goals_conceded: ['Goals conceded', 2],
  expected_goals_conceded: ['xG conceded', 2],
  tackles_successful: ['Tackles won', 1], bcc: ['Big chances made', 2], shots_on_target: ['Shots on target', 1],
  successful_dribbles: ['Dribbles', 1], passes_inside_box: ['Passes into box', 1], goals_scored: ['Goals', 2], assists: ['Assists', 2],
  blocked_shots: ['Blocks', 1], cross_completed: ['Crosses', 1], cross_completed_open_play: ['Open-play crosses', 1],
  cross_completed_set_piece: ['Set-piece crosses', 1], through_ball_completed: ['Through balls', 2],
  shots_six_yards: ['Six-yard shots', 2], shots_outside_box: ['Shots outside box', 1], shots_middle_side: ['Central shots', 1],
  shots_left_side: ['Shots from left', 1], shots_right_side: ['Shots from right', 1], penalties_scored: ['Penalties scored', 2],
  saves_outside_box: ['Saves outside box', 1], penalties_saved: ['Penalties saved', 2], clearances_off_line: ['Off-line clearances', 2],
};

// one fetch per (data version, player, the player compared with): the card's files only change with the version
const CARDS = new Map();
/** His card's on-disk half, as GET /api/m/player shapes it (api/card.py card): the bundle's where it carries him (api/
 *  card.py cards: no request when a card opens; the user, 2026-10-14: "why fixtures not stored same way as predictions
 *  and stats so no separate requests needed"), else asked for, and asked again while `alive()` (the card still open)
 *  after a failure that is not the server's "no such player" (404): a dropped answer is not "no matches" (the user,
 *  2026-10-14, Raya's card "Past matches unavailable" with all three of its answers sent). */
export function cardOf(ctx, id, vs = null, alive = () => true) {
  const own = fromBundle(ctx.bundle?.cards, Number(id), vs == null ? null : Number(vs));
  if (own) return Promise.resolve(own);
  const key = `${ctx.bundle?.version ?? ''}:${id}:${vs ?? ''}`;
  if (!CARDS.has(key)) {
    if (CARDS.size > 40) CARDS.delete(CARDS.keys().next().value);
    // asked again while any card waiting on it is open (the review, 2026-10-14: the first one's alone gave up on a card
    // closed and opened again during a wait)
    const it = { alive: [] };
    const ask = (k) => getPlayer({ id, entry: ctx.bundle?.entry?.id, vs }).catch((e) => {
      if (e?.status === 404 || !it.alive.some((f) => f())) throw e;
      return new Promise((ok) => setTimeout(ok, RETRY_MS[Math.min(k, RETRY_MS.length - 1)])).then(() => ask(k + 1));
    });
    it.p = ask(0).catch((e) => { CARDS.delete(key); throw e; });
    CARDS.set(key, it);
  }
  const it = CARDS.get(key);
  it.alive.push(alive);
  return it.p;
}
/** A card's request asked again after a failure: these waits, then the last again until it answers or the card goes. */
const RETRY_MS = [2000, 4000, 8000, 15000];
/** The bundle's card of player `id` (api/card.py cards) as GET /api/m/player shapes it: his stats over his rows, each
 *  row's peers from his position's (`dist`), his club's coming ties; `vs`: the other player's figures on his rows
 *  (stats.vs, the Why sheet's comparison). Null where the bundle doesn't carry him (or the other player). */
function fromBundle(cards, id, vs) {
  const me = cards?.players?.[id], other = vs == null ? null : cards?.players?.[vs];
  if (!me || (vs != null && !other)) return null;
  // `all`: among every position (api/card.py ALL: each row's rank third, the peers' values under ALL)
  const strip = (p, view, all = false) => {
    const st = p.stats?.[view];
    return st ? {
      pos: p.pos, n: all ? st.n_all : st.n, min: st.min, peer_min: st.peer_min, matches: st.matches,
      rows: Object.fromEntries(me.rows.map((k) => [k, { value: st.rows[k]?.[0] ?? null, rank: st.rows[k]?.[all ? 2 : 1] ?? null }])),
      dist: Object.fromEntries(me.rows.map((k) => [k, cards.dist?.[view]?.[all ? 'ALL' : p.pos]?.[k] ?? []])),
    } : null;
  };
  const views = (p) => ({ match: strip(p, 'match'), p90: strip(p, 'p90'), all: { match: strip(p, 'match', true), p90: strip(p, 'p90', true) } });
  const stats = me.rows ? {
    ...views(me), kinds: me.kinds,
    ...(other?.stats && other.pos === me.pos ? { vs: views(other) } : {}),
  } : null;
  return { season: cards.season, season_rounds: cards.season_rounds, pos: me.pos, pos_avg: me.pos_avg,
    last_matches: me.last_matches, cups: me.cups, cup_next: cards.cup_next?.[me.club] ?? [], stats };
}

export function open(ctx, rawId, { gw, place = null } = {}) {
  const id = Number(rawId);
  const d = ctx.data;
  const row = d?.byId.get(id);
  const P0 = plan(ctx);
  if (!row || !P0) {
    return ctx.sheets.open({
      title: row?.name ?? `Player ${id}`, detent: 'small',
      build(body) { body.append(h('p.m-para', null, row ? 'Your plan is still being found. Try again in a moment.' : 'Not in this forecast.')); },
    });
  }
  const shownGw = Number(ctx.store.get('gw'));
  const g = P0.gws.includes(Number(gw)) ? Number(gw) : P0.gws.includes(shownGw) ? shownGw : P0.A;
  // local: a local page (api.access, the server's verdict), where the forecast columns carry the runs as ticks (B105)
  let off = null, card, cardState = 'loading', local = false, closed = false;
  // the header's facts: drawn again when the card lands (the API's card: his ownership now; the bundle's carries none,
  // its row's stands, as recent as the rows: the review, 2026-10-14)
  const subEl = h('small.ps-sub', null, headerSub(row, P0.L.pos(id), null));
  return ctx.sheets.open({
    title: h('span.ps-title', null, h('span.ps-kit', { 'aria-hidden': 'true' }, shirtOf(P0.L, id, 56)),
      // his full name (the user, 2026-10-16: "full names shown instead of just surnames"), FPL's short one in older data
      h('span', null, row.full_name || row.name, subEl)),
    // B131: the price the header shows
    label: `${row.full_name || row.name}, ${row.club}, ${fmt.money(row.price)}`,
    // full screen (the user, 2026-10-15: "make that player pop up to full screen not half of it")
    detent: 'large', cls: 'ps',
    onClose: () => { closed = true; off?.(); AH.presolveTaps(ctx, null, { owner: row }); },
    build(body, sheet) {
      // the stats' view, Per match or Per 90: this viewer's last pick (statsView)
      let view = statsView(ctx);
      const setView = (v) => { view = v; keepStatsView(ctx, v); draw(); };
      let among = statsAmong(ctx);
      const setAmong = (v) => { among = v; try { ctx.api?.local?.set?.(STATS_AMONG_KEY, v); } catch { /* not kept */ } draw(); };
      // the rule controls follow your rules as edits land (and Undo): redraw on every plan change
      off = ctx.store.on('memory', () => queueMicrotask(draw));
      const draw = () => {
        const P = plan(ctx);
        const main = body.querySelector('.ps-main') || body.appendChild(h('div.ps-main'));
        main.dataset.card = cardState;
        const W = widthOf(main);
        const m = model(ctx, P, row, id, card, cardState, local);
        // the strip's columns, his cups among them where they fit (strip.js)
        const G = geometry(m, W);
        subEl.textContent = headerSub(row, P.L.pos(id), card);
        // a focused control drawn anew is focused again: a segmented control's option (Force keep, Force out, the
        // stats' Per match | Per 90; an arrow key picks one: ui.roving) in its group, found by its name (its label's id,
        // else its own label); an ⓘ by its label (its toggle draws the card anew: review 6, keyboard and VoiceOver)
        const grp = document.activeElement?.closest?.('.ps-main [role="radio"]')?.closest('[role="radiogroup"]');
        const info = document.activeElement?.closest?.('.ps-main .ps-info')?.getAttribute('aria-label');
        const kept = grp ? `${grp.getAttribute('aria-labelledby') ? `[aria-labelledby="${grp.getAttribute('aria-labelledby')}"]` : `[aria-label="${grp.getAttribute('aria-label')}"]`} [aria-checked="true"]`
          : info ? `.ps-info[aria-label="${info}"]` : null;
        // B1: what you can do first (under the header), then his status, the chart and the numbers
        fill(main,
          actions(P),
          askLine(P),
          statusLines(row, P, { available: false, lineup: false }),
          stripSection(m, G, chartKey),
          statsSection(card, W, { view, setView, among, setAmong }));
        if (kept) main.querySelector(kept)?.focus({ preventScroll: true });
        // the taps of his controls solved ahead while the sheet is open (AH.presolveTaps; the owner, 2026-10-26: "fix
        // speed so all pre solved and done without no cost"): each option that isn't the one in force
        if (P.editable) AH.presolveTaps(ctx, aheadTaps(P), { gw: g, owner: row });
      };
      /** His controls' edits as taps (AH.presolveTaps): Keep in this GW and through the end, Not him in this GW (a buy of
       *  him there its veto), Never, and Off for a rule of his (removeRule); the one in force none. */
      const aheadTaps = (P) => {
        const keepOn = pinOf(P, 'keep', id, g), outOn = pinOf(P, ['sell', 'veto', 'never'], id, g);
        const buy = AH.squadWeek(weekOf(P, g)) ? null : weekOf(P, g).moves.find((m) => m.in === id);
        const keepIs = keepOn ? (ruleOf(P, keepOn).scope === 'gw' ? 'gw' : 'all') : 'off';
        return [
          ...(owns(P) ? ['gw', 'all'].filter((k) => k !== keepIs).map((k) => ({ kind: 'keep', gw: g, run: () => keep(ctx, id, { gw: g, scope: k }) })) : []),
          ...(outOn ? [] : [{ kind: 'veto', gw: g, run: () => veto(ctx, buy ? { ...buy, gw: g } : { gw: g, out: null, in: id }, { scope: 'gw' }) }]),
          ...(owns(P) || pinOf(P, ['veto', 'never'], id) ? [] : [{ kind: 'never', gw: g, run: () => never(ctx, id) }]),
          ...[keepOn, outOn].filter(Boolean).map((q) => ({ kind: 'rule', gw: g, run: () => removeRule(ctx, q.id) })),
        ];
      };
      // the chart's key (ⓘ: infoBtn): shut until asked, kept open across redraws
      const keyOf = () => { const k = { open: false, toggle: () => { k.open = !k.open; draw(); } }; return k; };
      const chartKey = keyOf();
      const close = () => sheet.close();
      /** B7: why his Remove or Off is off while taking rule `q` off would re-plan GW A under way (AH.liftsLive), on
       *  every GW's card (GW A's said it on its lineup buttons until they went, 2026-10-13: the pre-release review): a
       *  quiet line | null. */
      const liveWhy = (P, q) => (AH.liftsLive(ctx, P, q) ? h('p.ps-off.m-foot', null, COPY.live(P.A)) : null);
      /** His card's GW has him in your squad, or the plan sells him in it (still yours going into it: UX-3): Force keep
       *  and Force out (with the sale) are his controls, not Bring him in… / Force out alone. */
      const owns = (P) => weekOf(P, g).squad.includes(id) || squadBefore(P, g).includes(id);
      /** Your sale of him where the Sell row isn't drawn (a GW after it: the pre-release review, 2026-10-13), else your
       *  wish about him, else a Keep or a veto of his that the week controls below don't show (one of another GW, or a
       *  veto beside the sale the Sell row shows: they show the one that covers the shown GW; B130, johnson A8: a Keep of GW9 read "Off" on GW8's card and nowhere
       *  else), with the button that takes it off: B4, the one removal (removeRule: a sale's or a Wish's move as its
       *  row's × takes it, any other rule as liftAsk). */
      function askLine(P) {
        // pinOf finds the one pin of its kind covering GW g (one rule per player says when: meeting), so a pin it doesn't
        // return for g is of another GW
        // the Sell row shows his sale over a veto of the same GW (sale ?? out): that veto is this line's
        const sold = owns(P) && !!pinOf(P, 'sell', id);
        const pin = (owns(P) ? null : pinOf(P, 'sell', id)) ?? pinOf(P, 'wish', id)
          ?? pinsOf(P, ['keep', 'veto', 'never'], id).find((q) => pinOf(P, q.kind, id, g) !== q || (sold && q.kind !== 'keep'));
        if (!pin) return null;
        const word = pin.kind === 'sell' ? pin.label || 'Sold by your pick' : pin.kind === 'wish' ? pin.label || 'Added by you'
          : ruleOf(P, pin).text;
        const undo = 'Remove';
        return h('div.ps-ask', null, h('span', null, word),
          h('button.m-chipbtn', { type: 'button', disabled: !P.editable || AH.liftsLive(ctx, P, pin), onClick: () => removeRule(ctx, pin.id) }, undo),
          P.editable ? liveWhy(P, pin) : h('p.ps-off.m-foot', null, P.why));
      }
      /** F11 / B1 / B130: a rule of his of `kinds` as the shown GW has it, Off / GW6 / all weeks (`opts`: [key, label,
       *  spoken]): one GW or more as the rule covering GW g is scoped, Off when none covers it (one of another GW is the
       *  ask line's). Off takes it off (removeRule); another option makes it (`make`). Short words, so the row fits 320 pt
       *  at any text size; each option's full meaning is its label. Force keep and both Force outs are this one control. → [its
       *  row, B7's reason when Off is held (liveWhy) | null] */
      function weekSeg(P, kinds, name, label, opts, make, here = pinOf(P, kinds, id, g), mode = !here ? 'off' : ruleOf(P, here).scope === 'gw' ? 'gw' : 'all') {
        // a Wildcard or Free Hit week offers that week's rule alone: a wider one made there reached past the chip (a Keep
        // from GW6 the Free Hit ignores, "Ruled out · GW6–9" selling him before it, review 5, 2026-10-12); one standing
        // still shows as itself
        if (AH.squadWeek(weekOf(P, g)) && mode !== 'all') opts = opts.filter(([k]) => k !== 'all');
        // B7: Off would re-plan GW A under way (AH.liftsLive): off, as Your rules' Remove, its reason under the row
        const held = !!here && AH.liftsLive(ctx, P, here);
        const set = (k) => {
          if (k === mode) return;
          if (k === 'off') { removeRule(ctx, here.id); return; }
          make(k);
        };
        return [h('div.ps-keep.wide', null, h('span.ps-keep-l', { id: `ps-${name}-${id}` }, label),
          segControl({ opts, current: mode, onPick: set, labelledBy: `ps-${name}-${id}`, disabled: (k) => !editable(ctx) || (k === 'off' && held) })),
        held ? liveWhy(P, here) : null];
      }
      /** Force keep · Off / GW6 / GW6–9, as your Keep holds him in the shown GW (keep: one GW's or through the end); Off
       *  is "Forkcast decides" (the user, 2026-10-14: "'force keep is off' is much clear"). B144 /
       *  UI M10: the wider option is its Keep's span (yours, else the one keepPin makes: from GW A for a player you own),
       *  never "To GW9" beside "GW9". */
      function keepSeg(P) {
        let here = pinOf(P, 'keep', id, g);
        // a Free Hit week's fifteen takes only a Keep of that week (memory.composePins): a wider one is not on here
        if (here && AH.squadWeek(weekOf(P, g)) === 'fh' && ruleOf(P, here).scope !== 'gw') here = null;
        const wide = COPY.span(AH.windowOf(here && ruleOf(P, here).scope !== 'gw' ? here : AH.keepPin(P, id, { gw: g, scope: 'all' })));
        // "Keep", as his place's Keep and the rule chip say it (the user, 2026-10-22: one word per concept, was "Force keep")
        return weekSeg(P, 'keep', 'lock', COPY.placeKeep,
          [['off', 'Off', 'Not kept'], ['gw', `GW${g}`, `Kept in GW${g} only`], ['all', wide, `Kept through GW${P.end}`]],
          (k) => keep(ctx, id, { gw: g, scope: k }), here);
      }
      /** B130: Force out · Off / GW6 only / GW6–9 (the Ruled out row, named as the owned player's: one verb for one
       *  rule), as your veto keeps him out of the shown GW: one GW's (veto, scope 'gw': the plan may buy him later) or
       *  every week's (never). */
      function ruledSeg(P) {
        const all = COPY.span(P.gws);
        // the veto's word, "Not", as the rule chip, the Why button and the swipe say it: a player you don't have can't be
        // forced out (the user, 2026-10-22; podmajersky r7 §3)
        return weekSeg(P, ['veto', 'never'], 'out', COPY.notHim,
          [['off', 'Off', 'Not him: off'], ['gw', `GW${g} only`, `Not him in GW${g} only`], ['all', all, `Not him in ${all}`]],
          (k) => (k === 'gw' ? veto(ctx, { gw: g, out: null, in: id }, { scope: 'gw' }) : never(ctx, id)));
      }
      /** Force out · Off / GW7 only / From GW8… (the user, 2026-10-13: "combine sell from.. with ruled out switch";
       *  2026-10-14: "'sell not gw7' is confusing": one verb, out, for both): one control for your way out of him. GW{g}
       *  only keeps him out of that week alone (a veto of that week, what Ruled out did):
       *  offered where the week's squad is remade (a Wildcard or Free Hit week: him out of its squad, as the pitch's drop
       *  on that week), where the plan brings him in that week (the user, 2026-10-13: "why excluding in gw7 now
       *  missing"; that buy vetoed, as its row's swipe), or where a veto of yours already covers it; a wider one of yours
       *  (all weeks) shows as itself, GW6–9, as weekSeg shows a standing one (the pre-release review, 2026-10-13);
       *  From GW{n}… sells him from the first week he can be sold in (AH.sellWeek; your sale of him: its own week),
       *  opening Replace there to choose who comes in or let Forkcast choose (Sell from…'s button before), not offered
       *  beside a wider rule (it sells him already, and the row keeps to three). */
      function sellSeg(P) {
        const w = weekOf(P, g);
        const sale = pinOf(P, 'sell', id);
        const out = pinOf(P, ['veto', 'never'], id, g);
        const wide = !sale && !!out && ruleOf(P, out).scope !== 'gw';
        const from = sale ? Number(sale.gw) : AH.sellWeek(ctx, P, id, g);
        const buy = AH.squadWeek(w) ? null : w.moves.find((m) => m.in === id);
        const opts = [['off', 'Off', 'Not forced out'],
          ...(AH.squadWeek(w) || !squadBefore(P, g).includes(id) || out ? [['gw', `GW${g} only`, `Out of GW${g} only`]] : []),
          ...(wide ? [['all', COPY.span(AH.windowOf(out) ?? P.gws), ruleOf(P, out).text]] : []),
          ...(from != null && !wide ? [['sell', `From GW${from}…`, sale ? `Sold from GW${from}` : `Sell him from GW${from}: choose who comes in`]] : [])];
        return weekSeg(P, ['sell', 'veto', 'never'], 'sell', 'Force out', opts,
          (k) => (k === 'gw' ? veto(ctx, buy ? { ...buy, gw: g } : { gw: g, out: null, in: id }, { scope: 'gw' }) : (close(), ctx.openSheet('replace', id, from))),
          sale ?? out, sale ? 'sell' : out ? (wide ? 'all' : 'gw') : 'off');
      }
      /** B1: the buttons, under the header: for a player you have, Force keep and Force out; the armband, subs and chips are
       *  the pitch's own and Chips…'s (the user, 2026-10-13: "remove buttons make captain / make vice / sub... keeping
       *  them only by dragging on pitch", then "remove play bench boost button from player card"). For one you don't:
       *  Bring him in… (the whole row) and Force out. Nothing under them (the user, 2026-10-13: "unnessary text like …
       *  'arrives for'": the plan line went). */
      function actions(P) {
        const b = (label, onClick, cls = '') => h('button', { type: 'button', class: cls, disabled: !P.editable, onClick }, label);
        let grid;
        if (owns(P)) grid = [keepSeg(P), sellSeg(P)];
        else {
          grid = [
            // A6: no ask; a Never of him goes when a week is picked, and that verdict names it (Undo restores it)
            // the week you chose him in, preselected (the user, 2026-10-09: "it must bring to week where in which week i
            // choose him"): the same as the block's + opened from that week. B44 (review3 Part 5 §4: opened from Add a
            // player, it stacked a twin under it): every sheet closes first, so his is the one up
            b('Bring him in…', () => { ctx.sheets.closeAll(); ctx.openSheet('wish', id, { gw: g }); }, 'acc wide'),
            ruledSeg(P),
          ];
        }
        // a plan you can't edit: every button is off, its reason (P.why) once. `place` (Ahead's pitch, the card behind):
        // the choices for his place on the pitch, "3 choices for his place ›", dealt out there once the sheet closes
        return h('div.ps-acts', null, h('div.ps-grid', null, grid), P.editable ? null : h('p.ps-off', null, P.why),
          place ? h('button.ah-lnk.ps-place', { type: 'button', onClick: () => { close(); place.open(); } }, COPY.placeChoices(place.n)) : null);
      }
      draw();
      // the on-disk half: drawn when it lands (the width is the mounted sheet's by then); a failure keeps the forecast
      cardOf(ctx, id, null, () => !closed).then((c) => { card = c; cardState = 'ready'; }, () => { cardState = 'none'; })
        .then(draw);
      // B105: the runs as ticks are model internals, as the Why sheet's run strip (A12): drawn when a local page's verdict lands
      Promise.resolve(ctx.api?.access?.()).then((a) => { if (a?.local) { local = true; draw(); } }).catch(() => {});
    },
  });
}

/** The chart width: the sheet body's, else the phone's less its 16 px gutters (320–430 wide). */
function widthOf(el) {
  const w = el?.clientWidth || Math.min(globalThis.innerWidth || 390, 430) - 32;
  return Math.max(260, Math.round(w));
}

/** B1: the header's facts, "ARS · MID · £9.6m · 38.2% owned · form 6.4": each one only when the data has it (the
 *  ownership now from the card, once it lands). B131 (johnson P1 §9: three places, three £6.0m): the current price
 *  alone. */
function headerSub(row, pos, card) {
  const price = Number.isFinite(row.price) ? fmt.money(row.price) : null;
  const sel = card?.now?.sel_pct ?? row.sel_pct;
  // each fact unbroken (a no-break space inside it): a line wraps between facts, never inside "22.6% owned"; no form
  // (the user, 2026-10-16: "remove 'form '")
  return [row.club, posCode(pos), price, Number.isFinite(sel) ? `${fmt.pct(sel)} owned` : null].filter(Boolean).map((x) => x.replace(/ /g, '\u00a0')).join(' · ');
}

/** B1: his status, up to two lines: FPL's availability ("75% · ankle injury"; amber, red at 25% or less or out) and,
 *  with `lineup`, WhoScored's predicted lineup for the next deadline's GW ("Predicted bench GW6 · WhoScored"); "Available"
 *  when neither says anything (`available` false: null then, and for a predicted start alone; `name`: each line says
 *  whose, "Groß · 75% · knock": the Why sheet's buy, B29). The player sheet asks for FPL's flag alone (the user,
 *  2026-10-13: "unnessary text like 'whoscored predicted to start'"). The dot carries the colour, the words stay ink
 *  (the second line muted). */
/** A player's FPL flag in short, as his card says it: {tone: 'red' (out, or 25% or less) | 'amber', short: "75%" (FPL's
 *  word where it gives no chance: "Injured"), reason: "thigh injury" | ''} | null (all clear). statusLines' and the Why
 *  sheet's table's (sheets/why.js statusCell). */
export function statusOf(row) {
  const st = statusInfo(row.status, row.chance);
  if (st.tone === 'ok' && st.chance !== 0) return null;
  const c = st.chance ?? (st.tone === 'bad' ? 0 : null);
  return { tone: st.tone === 'bad' || (c != null && c <= 25) ? 'red' : 'amber', short: c != null ? `${c}%` : st.label.split(' · ')[0], reason: newsReason(row) };
}

export function statusLines(row, P, { available = true, name = null, lineup = true } = {}) {
  const lines = [];
  const fl = statusOf(row);
  if (fl) lines.push(h('p.ps-st', { class: fl.tone }, h('i.dot', { 'aria-hidden': 'true' }), [name, fl.short, fl.reason || null].filter(Boolean).join(' · ')));
  const pre = lineup ? PREVIEW[row.ws_preview] : null;
  if (pre) lines.push(h('p.ps-st.ws', { class: row.ws_preview === 'S' ? 'ok' : 'grey' }, h('i.dot', { 'aria-hidden': 'true' }), [name, `${pre} GW${P.A}`, 'WhoScored'].filter(Boolean).join(' · ')));
  // the Why sheet's buy (B29): only a status that isn't all clear (FPL's flag, a WhoScored lineup he doesn't start in)
  if (!available && lines.every((p) => p.classList.contains('ok'))) return null;
  if (!lines.length) lines.push(h('p.ps-st.ok', null, h('i.dot', { 'aria-hidden': 'true' }), 'Available'));
  return h('div.ps-status', null, lines);
}

// ---------------------------------------------------------------- the data the charts draw

/** His forecast's rank among his position's in GW g (the bundle's rows, the shown scale): ties share the better rank. */
function xpRank(ctx, pos, xp, g) {
  if (!Number.isFinite(xp)) return null;
  const d = ctx.data;
  const vs = d.rows.filter((r) => posName(r.pos) === pos).map((r) => ctx.pitch.xpAt(r, g, d.xpGws)).filter(Number.isFinite);
  return { rank: 1 + vs.filter((v) => v > xp).length, n: vs.length };
}

/** Past matches (the card), the five forecasts (the bundle's row and runs), the player a buy replaces, opponents
 *  (the bundle's fixtures with FPL's difficulty, as the pitch has them), his cup matches and his club's coming ties
 *  (the card's cups and cup_next: strip.js places them). The past columns are held open while the card loads; a card
 *  with none (or none to be had) draws the forecast across the width (B2). The runs on a local page only (`local`,
 *  B105): elsewhere no ticks, no room for them on the scale, no "forecasts range" in a column's words. */
function model(ctx, P, row, id, card, state, local = false) {
  const d = ctx.data;
  const pos = P.L.pos(id) ?? posName(row.pos);
  const runsOf = (pid, g) => {
    const s = d.seeds;
    if (!s?.has?.(pid)) return [];
    return Array.from({ length: s.runs }, (_, r) => s.at(pid, g, r)).filter(Number.isFinite);
  };
  const w = P.weeks.find((x) => x.in.includes(id) && !P.owned.includes(id));
  const out = w?.moves.find((m) => m.in === id)?.out;
  const orow = out != null ? d.byId.get(Number(out)) : null;
  const past = card?.last_matches ?? [];
  return {
    pos,
    season: card?.season ?? null,
    avg: card?.pos_avg ?? null,
    past,
    slots: state === 'loading' ? LAST_N : past.length,
    unavailable: state !== 'loading' && !past.length,
    cups: card?.cups ?? [],
    cupNext: card?.cup_next ?? [],
    fut: d.xpGws.map((g) => ({
      gw: g,
      xp: ctx.pitch.xpAt(row, g, d.xpGws),
      rank: xpRank(ctx, pos, ctx.pitch.xpAt(row, g, d.xpGws), g),
      runs: local ? runsOf(id, g) : [],
      fx: ctx.pitch.fixturesAt(row, g, d.xpGws) ?? [],
      inPlan: !!weekOf(P, g),
    })),
    comp: out == null ? null : {
      name: P.L.name(out), gw: w.gw, chance: orow?.chance ?? null,
      xp: d.xpGws.map((g) => ctx.pitch.xpAt(orow, g, d.xpGws)),
    },
  };
}

/** A segmented control (the app's m-seg: a radiogroup whose arrow keys move the choice, ui.roving): opts [[key, text,
 *  spoken]], the `current` key, onPick(key); named by the visible label `labelledBy` (an id), else by `label`. Force
 *  keep and Force out (weekSeg) and the stats' Per match / Per 90 (here and on the Why sheet's table). */
export function segControl({ opts, current, onPick, labelledBy = null, label = null, disabled = () => false, cls = '' }) {
  return roving(h(`div.m-seg${cls}`, { role: 'radiogroup', 'aria-labelledby': labelledBy, 'aria-label': labelledBy ? null : label, style: { '--n': opts.length, '--i': opts.findIndex(([k]) => k === current) } },
    h('span.m-seg-thumb'),
    opts.map(([k, l, said]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(k === current), 'aria-label': said, disabled: disabled(k), onClick: () => onPick(k) }, l))), { pick: (b) => b.click() });
}

// ---------------------------------------------------------------- inline SVG

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '–');
/** A chart's text: 13 px, its size and weight m.css's (.ps .ps-chart svg text: --t-sub 400, muted by default; class
 *  "v", a code or a value, 600 in ink), never set here. */
function T(x, y, s, { anchor = 'middle', fill: c = 'var(--muted)', cls = '', mark = false } = {}) {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" fill="${c}"${cls ? ` class="${cls}"` : ''}>${esc(s)}${mark ? ' <tspan class="xp-u">xP</tspan>' : ''}</text>`;
}
/** A forecast value as ui.js xpNum draws one in HTML (m.css .xp: --xp; the user, 2026-10-22, after v1.3.68: blue text,
 *  no chip), its baseline at (x, y): a chart's "v" text in the forecast's blue (the caption's "xP" names them all). */
const xpSvg = (x, y, s) => T(x, y, s, { fill: 'var(--xp)', cls: 'v' });
const L = (x1, y1, x2, y2, stroke = 'var(--hair)', w = 1, extra = '') =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
const R = (x, y, w, hh, fillc, extra = '') =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, hh).toFixed(1)}" fill="${fillc}" ${extra}/>`;
function svgEl(W, H, body, label, cls) {
  const box = h(`div.${cls}`);
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${body}</svg>`;
  return box;
}
const niceMax = (v, step = 5, floor = 10) => Math.max(floor, Math.ceil(v / step) * step);
/** px a bar's value label needs above it, under the strip's captions (matchStrip). */
const LABEL_ROOM = 17;
/** An opponent in the chart's titles and spoken words: "MUN A", "COV H" (drawn, his code's case says the venue: oppText). */
const fixText = (opp, home) => (opp == null ? '–' : `${String(opp).toUpperCase()} ${home ? 'H' : 'A'}`);
const sum = (xs) => xs.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
/** His last matches' points and minutes (the card's last_matches): the strip's head and the Why sheet's table. */
export const pastSums = (past) => ({ pts: sum(past.map((x) => x.points)), mins: sum(past.map((x) => x.minutes)) });

/** A chart text's width at its 13 px, in the page's own font (a canvas: the strip fits its columns to what the labels
 *  need on this phone); a rough width where there is no canvas. */
const WIDTHS = new Map();
let PEN = null;
function measure(s, wt = 400) {
  const key = `${wt}|${s}`;
  if (WIDTHS.has(key)) return WIDTHS.get(key);
  let px = String(s).length * 8;
  try {
    PEN ??= document.createElement('canvas').getContext('2d');
    const fam = getComputedStyle(document.documentElement).getPropertyValue('--f-text').trim() || 'system-ui, sans-serif';
    // at the chart's own size: --t-sub of the root's text size (13 px at the default), so a larger text size measures as it draws
    PEN.font = `${wt} ${parseFloat(getComputedStyle(document.documentElement).fontSize) * 13 / 17 || 13}px ${fam}`;
    px = PEN.measureText(String(s)).width;
  } catch { /* no canvas: the rough width */ }
  if (WIDTHS.size > 400) WIDTHS.clear();
  WIDTHS.set(key, px);
  return px;
}


/** The strip's geometry (strip.js layout): two lines of one column width, his EPL matches with his cup matches among
 *  them over the forecast GWs with his club's coming ones among them; no past columns: the forecast alone. */
function geometry(m, W) {
  const { cols: past, after } = S.pastColumns(m.past.map((x) => ({ ...x, opp: x.opp == null ? null : String(x.opp).toUpperCase() })), m.cups);
  const fut = S.futureColumns(m.fut.map((f) => ({ ...f, value: f1(f.xp), codes: f.fx.map((o) => o.opp) })), m.cupNext, after ?? []).cols;
  return S.layout({ pastCols: past, futCols: fut, W, measure, slots: m.past.length ? 0 : m.slots });
}

/** A section's ⓘ: its key (`key`: {open, toggle}) opened under it on a tap, kept open across redraws; the glyph drawn (a
 *  text "ⓘ" falls back to another font). */
function infoBtn(key, label) {
  const b = h('button.ps-info', { type: 'button', 'aria-expanded': String(key.open), 'aria-label': label, onClick: key.toggle });
  b.innerHTML = INFO;
  return b;
}
const INFO = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="5" r=".95" fill="currentColor"/><rect x="7.3" y="6.9" width="1.4" height="4.6" rx=".7" fill="currentColor"/></svg>';

/** LAST 6 · NEXT 5 (NEXT 5 with no past matches): a cap label over the chart (`title`, the player's name, on its own
 *  line over it where two are compared), the drawn columns' sums beside it, the chart's key behind ⓘ (key: {open,
 *  toggle}); on `scale` (scaleOf) when it is shared. */
function stripSection(m, G, key) {
  const { pts, mins } = pastSums(m.past);
  const next = sum(m.fut.map((f) => f.xp));
  // each sum unbroken (a no-break space inside it): on a 320 pt phone the line wraps between them, never in "GW6–10 13.5";
  // the forecast's sum names its weeks (B104: "next 5" beside the plan's four-week sums), its range through COPY.span
  // (the forecast's sum in its blue with "xP": ui.js xpNum; the user, 2026-10-22)
  const nb = (x) => x.replace(/ /g, '\u00a0');
  const head = h('span.ps-sums', null, m.past.length ? `${nb(`${pts} pts in ${mins}′`)} · ` : null, h('span.ps-sum', null, `${nb(COPY.span(m.fut.map((f) => f.gw)))}\u00a0`, xpNum(f1(next))));
  const info = infoBtn(key, 'What the chart shows');
  return h('div.m-sec.ps-strip', null,
    h('h3', null, h('span', null, m.slots ? `Last ${m.past.length || LAST_N} · next ${m.fut.length}` : `Next ${m.fut.length}`),
      h('span.ps-tot.m-num', null, head, info)),
    matchStrip(m, G),
    m.unavailable ? h('p.ps-nopast', null, 'Past matches unavailable') : null,
    key.open ? h('p.ps-note', null, stripKey(m, G.cols)) : null);
}

/** The chart's key behind its ⓘ (stripSection): a sentence for each kind of mark the columns `cols` (strip.js layout)
 *  draw, none for a mark not drawn (Dana, first use 2026-10-21: a played cup among the forecast ("0′ CL H"), a dashed
 *  week and a code's case went unexplained, and "Intl nations league a." read as cut off). Pure. → text */
export function stripKey(m, cols) {
  const cups = cols.filter((c) => c.kind === 'cup');
  const ticks = m.fut.some((f) => f.runs.length);  // B105: the key's ticks sentence only where they are drawn
  // a cup played since his last league match leads the forecast's line (strip.js pastColumns' `after`)
  const among = [cups.some((c) => !c.next && c.ahead) ? 'his cup games since his last league match' : null,
    cups.some((c) => c.next) ? 'his club\'s coming cup games' : null].filter(Boolean).join(', then ');
  // the forecast's GWs past your plan (the switcher locks them): their bars dashed (matchStrip's .fc.edge)
  const past = m.fut.filter((f) => !f.inPlan).map((f) => f.gw);
  // the competitions drawn, each code with its name ("CL Champions League"): a grey code is said nowhere else; a cup's
  // venue its letter (no opponent code)
  const codes = [...new Set(cups.map((c) => c.league))].map((l) => `${S.cupCode(l)} ${S.cupName(l)}`).join(', ');
  const venue = cups.some((c) => c.home != null) ? '; H home, A away' : '';
  return `${COPY.runSpread(ticks)}${m.comp ? ` ○ ${m.comp.name}${m.comp.chance != null && m.comp.chance < 100 ? ` (${m.comp.chance}% to play)` : ''}, the player he replaces.` : ''}`
    + ` Opponent: FPL's difficulty, green easy to red hard; ${COPY.oppCase}.`
    + `${past.length ? ` Dashed: ${COPY.span(past)}, past your plan.` : ''}`
    + `${cups.some((c) => !c.next) ? ' Grey: his other competitions, his minutes in each (0′ an unused sub, — not in the squad).' : ''}`
    + `${among ? ` Among the forecast, grey: ${among}.` : ''}${codes ? ` ${codes}${venue}.` : ''}`;
}

/** A strip's points scale: its lowest score (a negative one) and its highest bar, value or run, the past's and the
 *  forecast's (and the replaced player's ○) alike: a bar of 5 is as tall over the past as over the forecast. */
function scaleOf(m, G) {
  const epl = G.cols.filter((c) => c.kind === 'epl'), gws = G.cols.filter((c) => c.kind === 'gw');
  const tops = [...epl.map((x) => x.points ?? 0), ...gws.flatMap((f) => [f.xp ?? 0, ...f.runs]), ...(m.comp?.xp ?? []).map((v) => v ?? 0)];
  return { low: Math.min(0, ...epl.map((x) => x.points ?? 0)), peak: Math.max(0, ...tops) };
}

/** A cup column's spoken words: "Champions League v Athletic, home, 59 minutes". */
function cupWords(c) {
  const day = Number.isFinite(c.kickoff) ? new Date(c.kickoff * 1000).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : null;
  const opp = c.opp_name || c.opp;
  const mins = c.next ? null : c.in_squad === false ? 'not in the squad' : Number.isFinite(c.minutes) ? `${c.minutes} minutes` : null;
  return [`${S.cupName(c.league)}${opp ? ` v ${opp}` : ''}`, c.home == null ? null : c.home ? 'home' : 'away', day, mins].filter(Boolean).join(', ');
}

/** LAST 6 over NEXT 5, two lines on one points scale (strip.js layout; the user, 2026-10-14: "back splitted in two
 *  lines so enough space for all"): his matches as solid bars (width = minutes) on a dotted line at his position's
 *  average, the seasons divided; his cups between them as grey columns; under them the forecast as hollow green bars, the
 *  model's runs as ticks (a local page's), the player a buy replaces as ○. Under every column the same three label
 *  rows: the GW (a cup: its competition), the opponent on FPL's difficulty colour (past and coming alike; a cup none),
 *  the venue; his club's coming cup games among the forecast GWs as the played ones are, with no minutes. */
function matchStrip(m, G, { low, peak } = scaleOf(m, G)) {
  const { W, lines, cols } = G;
  const H = 64, RH = 16, CAP = 18, GAP = 14;
  const epl = cols.filter((c) => c.kind === 'epl'), gws = cols.filter((c) => c.kind === 'gw');
  const ymin = low < 0 ? -5 * Math.ceil(-low / 5) : 0;
  // room above the tallest bar for its value label, under the captions (a bar at the axis top put its "10" into them:
  // the user, 2026-10-07); a step up when the label would not fit
  let ymax = niceMax(peak);
  while (((ymax - peak) / (ymax - ymin)) * H < LABEL_ROOM) ymax += 5;
  const avg = m.avg?.points;
  const avgText = Number.isFinite(avg) && epl.length ? `${posCode(m.pos)} avg ${f1(avg)}` : null;
  const b = [];
  // the lines one under the other (strip.js layout: the past's, then the forecast's; a row too long for one goes on
  // over the next), GAP between
  let top = 0;
  lines.forEach((line, i) => { top = drawLine(line, top, i > 0 && !lines[i - 1].cols[0]?.ahead === !line.cols[0]?.ahead) + GAP; });
  const said = (c) => (c.kind === 'cup' ? cupWords(c)
    : `GW${c.gw} ${fixText(c.opp, c.home)} ${c.minutes ? `${c.points} pts in ${c.minutes} min` : "didn't play"}`);
  const past = cols.filter((c) => !c.ahead);
  const label = `${past.filter((c) => c.kind !== 'slot').map(said).join(', ')}`
    + `${avgText ? `; ${WORD[m.pos] ?? m.pos} averaged ${f1(avg)} a match in those rounds` : ''}`
    + `; forecast ${cols.filter((c) => c.ahead).map((c) => (c.kind === 'cup' ? cupWords(c)
      : `GW${c.gw} ${c.fx.map((o) => fixText(o.opp, o.home)).join(' and ') || 'no match'} ${f1(c.xp)}${c.rank ? `, ${rankWords(c, m.pos)}` : ''}`)).join('; ')}`;
  return svgEl(W, top - GAP, b.join(''), label, 'ps-chart.ps-match');

  /** One line of columns from y `top` → its bottom: its captions, the plot, then each column's GW, opponents and
   *  venue; `more`: a row's line after its first, without its row's caption ("forecast", the position's average). */
  function drawLine({ cols: lc }, top, more) {
    const y0 = top + CAP;
    const sy = (v) => y0 + H - ((v - ymin) / (ymax - ymin)) * H;
    // the opponents' lines: as many as the columns use (strip.js `row`); a double's second under its first
    const lineOf = (c, q = 0) => c.row + q;
    const oppRows = Math.max(1, ...lc.filter((c) => c.kind !== 'cup').map((c) => lineOf(c, Math.max(0, (c.fx?.length ?? 1) - 1)) + 1));
    const yGw = y0 + H + 16;
    const yOpp = (c, q = 0) => yGw + RH * (1 + lineOf(c, q));
    // the line's own end: the shorter of the two ends short of W (strip.js: one column width for both)
    const end = lc.length ? lc.at(-1).x + lc.at(-1).w : W;
    // no venue line: an opponent's code says it, "COV" at home, "cov" away, a cup "H" or "A" on its line (the user,
    // 2026-10-16: "replace H and A row with just spelling opp name either COV for home or cov for away")
    const yEnd = yGw + RH * oppRows;
    // a cup's column: a grey band behind the plot and down through its labels (quiet: no points, FPL scores none). B62
    // (johnson Part 1 §4): over the plot alone it stood as a grey bar taller than his best score
    for (const c of lc) if (c.kind === 'cup') b.push(R(c.x + 1, y0 - 4, c.w - 2, yEnd + 10 - y0, 'var(--track)'));
    // a line every 5 points, unnumbered: every bar carries its value (the axis's numbers went 2026-10-13, the user)
    for (let v = ymin; v <= ymax; v += 5) b.push(L(0, sy(v), end, sy(v), 'var(--hair)'));
    // a cup's venue where a match has its opponent
    const venue = (c, home) => (home == null ? '' : T(c.cx, yGw + RH, home ? 'H' : 'A'));
    // an opponent on its FPL difficulty colour (the pitch's chips), a match's as a forecast GW's: one style for both; an
    // end column's chip slides in to stay on the chart (no axis gutter beside it)
    const chip = (c, opp, home, fdr, y) => {
      const shown = oppText({ opp, home });
      const chipW = Math.min(c.w - 1, measure(shown, 600) * S.CODE_SCALE + 6);
      const x = S.within(c.cx, chipW, 0, W) - chipW / 2;
      return `<g class="opp" data-club="${esc(opp)}" data-fdr="${fdr ?? ''}"><title>${esc(`${fixText(opp, home)}${fdr ? `, FPL difficulty ${fdr} of 5` : ''}`)}</title>`
        + (fdr ? `<rect x="${x.toFixed(1)}" y="${(y - 11).toFixed(1)}" width="${chipW.toFixed(1)}" height="15" rx="3" fill="var(--fdr-${fdr})"/>` : '')
        + T(x + chipW / 2, y, shown, { fill: 'var(--ink)', cls: 'v code' }) + '</g>';
    };
    for (const c of lc) {
      if (c.kind === 'epl') {
        const p = c.points ?? 0, mn = c.minutes ?? 0;
        // a match he didn't play: "0′", as a cup's unused sub says it
        if (!mn) b.push(T(c.cx, sy(0) - 4, '0′'));
        else {
          const bw = Math.max(2, (c.w * 0.66 * Math.min(mn, 90)) / 90);
          b.push(`<g class="past" data-gw="${c.gw}" data-pts="${p}" data-min="${mn}">`
            + R(c.cx - bw / 2, Math.min(sy(p), sy(0)), bw, Math.abs(sy(0) - sy(p)), 'var(--ink-2)')
            + T(c.cx, Math.min(sy(p), sy(0)) - 4, p, { fill: 'var(--ink)', cls: 'v' }) + '</g>');
        }
        b.push(T(c.cx, yGw, c.gw), c.opp ? chip(c, c.opp, c.home, c.fdr, yOpp(c)) : T(c.cx, yOpp(c), '–', { fill: 'var(--ink)', cls: 'v' }));
      } else if (c.kind === 'cup') {
        // his minutes where a match has its bar ("59′", "0′" unused, "—" not in the squad; a coming one none), the
        // competition where a match has its GW ("Shield", "CS" where it doesn't fit: strip.js `code`, within its codeAt:
        // on the chart), the venue as a match's: all grey; no opponent (strip.js: no code anyone knows), its name in the
        // title
        b.push(`<g class="cup${c.next ? ' next' : ''}" data-league="${esc(c.league)}" data-min="${c.minutes ?? ''}" data-kickoff="${c.kickoff ?? ''}"${c.next ? ` data-before="${c.before}"` : ''}><title>${esc(cupWords(c))}</title>`
          + (c.next ? '' : T(c.cx, sy(0) - 4, S.cupMinutes(c)))
          + T(S.within(c.cx, measure(c.code), ...c.codeAt), yGw, c.code) + venue(c, c.home) + '</g>');
      } else if (c.kind === 'gw') {
        const top2 = Math.max(c.xp ?? 0, ...c.runs);
        const opp = c.fx.map((o) => fixText(o.opp, o.home)).join(' + ') || '–';
        const lo = c.runs.length ? Math.min(...c.runs) : null, hi = c.runs.length ? Math.max(...c.runs) : null;
        const aria = `GW${c.gw}, ${opp}, ${f1(c.xp)} expected points${rankWords(c, m.pos) ? `, ${rankWords(c, m.pos)}` : ''}${c.runs.length ? `, forecasts range ${f1(lo)} to ${f1(hi)}` : ''}${c.inPlan ? '' : ', forecast only'}`;
        const bw = c.w * 0.5;
        let g = `<g class="fc${c.inPlan ? '' : ' edge'}" data-gw="${c.gw}" data-xp="${f1(c.xp)}" data-rank="${c.rank?.rank ?? ''}" data-n="${c.rank?.n ?? ''}"><title>${esc(aria)}</title>`;
        if (c.xp != null) {
          g += R(c.cx - bw / 2, sy(Math.max(c.xp, 0)), bw, Math.abs(sy(0) - sy(Math.max(c.xp, 0))), 'var(--xp)',
            `fill-opacity=".12" stroke="var(--xp)" stroke-width="1"${c.inPlan ? '' : ' stroke-dasharray="3 2"'}`);
        }
        // the runs as ticks: their agreement, not an outcome range
        for (const r of c.runs) g += L(c.cx - bw / 2 - 3, sy(r), c.cx + bw / 2 + 3, sy(r), 'var(--xp)', 0.6, 'opacity=".55" class="run"');
        // its value as the past bars' are (one style for every code and value: the user, 2026-10-08), in the forecast's
        // blue as the bar (ui.js xpNum's; the user, 2026-10-22, after v1.3.68: no chip)
        g += xpSvg(c.cx, sy(top2) - 6, f1(c.xp));
        const vs = m.comp?.xp[m.fut.findIndex((x) => x.gw === c.gw)];
        if (vs != null) g += `<circle class="vs" data-xp="${f1(vs)}" cx="${(c.cx + bw / 2 + 1).toFixed(1)}" cy="${sy(vs).toFixed(1)}" r="3" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1.2"/>`;
        b.push(g + '</g>', T(c.cx, yGw, c.gw));
        // a double's two opponents stacked
        const k = c.fx.length;
        if (!k) b.push(T(c.cx, yOpp(c), '–', { fill: 'var(--ink)', cls: 'v' }));
        c.fx.forEach((o, q) => b.push(chip(c, o.opp, o.home, o.fdr, yOpp(c, q))));
      }
    }
    // its captions over the plot. The past's: the seasons ("2025 | 2026", a dotted divider where one ends) and his
    // position's average at its right end, each drawn where it fits; the forecast's: "forecast"
    // (its "xP" marker after it: the values' chips carry none)
    if (lc[0]?.ahead) { if (!more) b.push(T(0, y0 - 8, 'forecast', { anchor: 'start', mark: true })); return yEnd + 6; }
    const avgFits = !more && !!avgText && end - measure(avgText) >= 0;
    const avgX0 = avgFits ? end - measure(avgText) : end;
    const segs = [];
    lc.forEach((c, i) => { if (c.season == null) return; if (!segs.length || segs.at(-1).season !== c.season) segs.push({ season: c.season, i0: i }); });
    segs.forEach((sg, k) => {
      const x = lc[sg.i0].x;
      if (k > 0) b.push(L(x - 1, y0 - 14, x - 1, y0 + H, 'var(--border-2)', 1, 'stroke-dasharray="2 3"'));
      const word = `${sg.season}`;
      const [tx, anchor] = k === 0 && segs.length > 1 ? [lc[segs[1].i0].x - 5, 'end'] : [x + 2, 'start'];
      const [l, r] = anchor === 'end' ? [tx - measure(word), tx] : [tx, tx + measure(word)];
      if (l >= 0 && r < avgX0 - 6) b.push(T(tx, y0 - 8, word, { anchor }));
    });
    if (avgText) {
      // across his matches' columns only (a cup's has no points to measure against it)
      const runs = [];
      for (const c of lc) { if (c.kind !== 'epl') continue; const r = runs.at(-1); if (r && Math.abs(r[1] - c.x) < 0.5) r[1] = c.x + c.w; else runs.push([c.x, c.x + c.w]); }
      b.push(`<g class="avg" data-v="${f1(avg)}">${runs.map(([a, z]) => L(a, sy(avg), z, sy(avg), 'var(--ink)', 1, 'stroke-dasharray="1.5 2.5"')).join('')}`
        + (avgFits ? `<text x="${end.toFixed(1)}" y="${(y0 - 8).toFixed(1)}" text-anchor="end" fill="var(--muted)">${esc(avgText)}</text>` : '') + '</g>');
    }
    return yEnd + 6;
  }
}

/** "12th of 79 midfielders in GW6" (a forecast column's spoken words) */
const rankWords = (f, pos) => (f.rank ? `${fmt.ordinal(f.rank.rank)} of ${f.rank.n} ${WORD[pos] ?? 'players'} in GW${f.gw}` : '');


/** The stats' view kept for this viewer (ctx.api.local): 'match' (the default) or 'p90'. */
const STATS_VIEW_KEY = 'fc:player:stats';
export const statsView = (ctx) => { try { return ctx.api?.local?.get?.(STATS_VIEW_KEY) === 'p90' ? 'p90' : 'match'; } catch { return 'match'; } };
/** …kept as this viewer's pick (the card's switch and the Why sheet's table share it). */
export const keepStatsView = (ctx, v) => { try { ctx.api?.local?.set?.(STATS_VIEW_KEY, v); } catch { /* not kept */ } };
/** The stats ranked among his position ('pos') or every position ('all'; the user, 2026-10-16: "add switch all
 *  positions / fwd"): this viewer's last pick, as the view's. */
const STATS_AMONG_KEY = 'fc:player:among';
const statsAmong = (ctx) => { try { return ctx.api?.local?.get?.(STATS_AMONG_KEY) === 'all' ? 'all' : 'pos'; } catch { return 'pos'; } };
/** FPL's own per-match figures among the stats (api/card.py FPL_STATS), named in the footnote. */

/** STATS: every peer of his position (faint), him in ink, his value and rank (ties share the better rank), on the stats
 *  the data chose for him (api/stats_pick.json, api/card.py _rows: the kinds of points he is likeliest to earn first;
 *  the user, 2026-10-13: "add more stats to stats", 2026-10-14: "make to be chosen by data"), per match he played or per 90 of his minutes (the header's switch, "add switch of stats per-90 / per
 *  match"; the user, 2026-10-13: "i dont need to keep subs and starters comparable", so per match first). A row's name
 *  is quiet and its value ink 600, as a fact's key and value are (13 px, the chart's text). */
function statsSection(card, W, { view, setView, among, setAmong }) {
  // among every position (api/card.py stats.all) or his own
  const of = (s) => (among === 'all' ? s?.all?.[view] : s?.[view]) ?? null;
  const p = of(card?.stats);
  if (!p || !Object.values(p.rows).some((r) => r.value != null)) return null;
  const word = among === 'all' ? 'players' : WORD[p.pos] ?? 'players';
  const per = view === 'p90' ? 'per 90 minutes' : 'a match';
  const labs = Object.keys(p.rows).map((k) => (STAT[k] ?? [k])[0]);
  const RK = 44, SW = W - RK, AX = Math.min(124, Math.ceil(Math.max(...labs.map((s) => measure(s)))) + 10), RV = 44, span = SW - AX - RV, hh = 26, y = hh / 2;
  const rows = Object.entries(p.rows).map(([k, r]) => {
    const [lab, dp] = STAT[k] ?? [k, 1];
    const vals = p.dist[k] ?? [];
    const hi = Math.max(...vals, r.value ?? 0) * 1.02 || 1;
    const sx = (v) => AX + (Math.min(Math.max(v, 0), hi) / hi) * span;
    const b = [L(AX, y, AX + span, y, 'var(--hair)'), T(0, y + 4.5, lab, { anchor: 'start' })];
    for (const v of vals) b.push(`<circle class="peer" cx="${sx(v).toFixed(1)}" cy="${y}" r="2.6" fill="var(--border-2)" opacity=".7"/>`);
    if (r.value != null) b.push(`<circle class="me" cx="${sx(r.value).toFixed(1)}" cy="${y}" r="5" fill="var(--ink)" stroke="var(--surface)" stroke-width="1.5"/>`);
    b.push(T(SW, y + 4.5, r.value == null ? '–' : r.value.toFixed(dp), { anchor: 'end', fill: 'var(--ink)', cls: 'v' }));
    const rank = r.rank == null ? '–' : fmt.ordinal(r.rank);
    const said = `${r.value == null ? 'none' : r.value.toFixed(dp)}, ${r.rank == null ? 'no rank' : `${fmt.ordinal(r.rank)} of ${p.n} ${word}`}`;
    return h('div.ps-srow', { 'data-key': k, 'data-rank': r.rank ?? '', 'data-value': r.value ?? '' },
      svgEl(SW, hh, b.join(''), `${lab} ${per}: ${said}`, 'ps-chart'),
      h('span.ps-rk.m-num', null, rank));
  });
  const [g0, g1] = card.season_rounds ?? [];
  return h('div.m-sec.ps-stats', { 'data-view': view, 'data-among': among },
    // its title and both switches on one line, no ⓘ (the user, 2026-10-16: "remove 'i' from stats, since nothing usefuill
    // written here and fit stats / gw 1-6 and both swithers in one line")
    // the Why table's head (COPY.statsHead); whom he is ranked among is its All | MID switch here, every peer a dot
    h('div.ps-stathead', null, h('h3', null, h('span', null, COPY.statsHead(g0, g1))),
      // whom he is ranked among, then per what (the user, 2026-10-16: "to the left from per match per 90 switch")
      h('div.ps-segs', null,
        segControl({ opts: [['all', 'All', 'All positions'], ['pos', p.pos, WORD[p.pos] ?? p.pos]], current: among, onPick: setAmong, label: 'Ranked among all positions or his own', cls: '.small.ps-among' }),
        // "Match" on a phone's one line ("Per match" its spoken name)
        segControl({ opts: [['match', 'Match', 'Per match'], ['p90', 'Per 90', 'Per 90 minutes']], current: view, onPick: setView, label: 'Stats per match or per 90 minutes', cls: '.small' }))),
    rows);
}

