// Forkcast · Player sheet (IPHONE_DESIGN §5.6), full screen. Top to bottom: kit, name, "ARS · MID · £9.6m · 38.2%
// owned"; his controls (owner, 2026-10-13/14: armband, subs and chips only on the pitch and in Chips…; sale and veto in
// one Force out control); his status; LAST 6 · NEXT 5 (sheets/strip.js; no past matches: NEXT 5 alone, "Past matches
// unavailable"); STATS (api/stats_pick.json; api/card.py _kinds, _rows). Nothing else (owner, 2026-10-13). open(ctx,
// id, {gw}); the route #/player/<id> opens it too.
// Past matches, averages, stats and cups come from GET /api/m/player (api/card.py); forecast, plan and prices from the
// bundle (api/scale.py). A number the files lack draws as "–". A player the plan sells in the shown GW still counts as
// yours there (UX-3).
// His rules show and come off here (RULES_V2 §3). Owned: Keep · Off / GW8 / GW8–9 and Force out · Off / GW8 only / From
// GW9… (in a Wildcard or Free Hit week only GW8's options show); not owned: Not him · Off / GW8 only / GW6–9. A sale
// the Sell row doesn't show, a wish, or a Keep or veto of another GW shows with its way back (UX-6). An edit that
// undoes an older rule acts at once, its verdict naming that rule, with Undo.

import { h, fmt, fill, statusInfo, posName, posCode, roving, xpNum } from '../../ui.js';
import { COPY, newsReason, priceProgress } from '../calls.js';
import { getPlayer } from '../api.js';
import * as AH from '../ahead.js';
import * as S from './strip.js';
import { oppText } from '../../plan/pitch.js';
import {
  plan, weekOf, squadBefore, shirtOf, pinOf, pinsOf, removeRule, ruleOf,
} from '../ahead.js';

/** WhoScored's predicted lineup for the next deadline's GW (data_io/data.py ws_preview), as the card words it. */
const PREVIEW = { S: 'Predicted to start', B: 'Predicted bench', O: 'Predicted out', D: 'Predicted doubtful', DS: 'Predicted doubtful' };
const LAST_N = 6;  // api/card_conf.py LAST_N: past columns held open while loading
// the forecast's weeks the strip draws: the first six (owner, 2026-11-09, "show last 6 and next 6"); the comparison
// reads them all (pairView: the next four from the week it was opened from)
export const NEXT_N = 6;
export const WORD = { GK: 'goalkeepers', DEF: 'defenders', MID: 'midfielders', FWD: 'forwards' };
// stats' rows (api/stats_pick.json, tools/stats_pick.py ACTIONS): label, decimals; defensive contribution shortened,
// still in words, to fit the 124 px label column; calls.test.mjs checks each has one
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

// one fetch per (data version, player, compared player): the card's files change only with the version
const CARDS = new Map();
/** His card's on-disk half, as GET /api/m/player shapes it (api/card.py card): the bundle's where it carries him (no
 *  request when a card opens; owner, 2026-10-14), else asked for, and again while `alive()` after any failure but 404
 *  "no such player". */
export function cardOf(ctx, id, vs = null, alive = () => true) {
  const own = fromBundle(ctx.bundle?.cards, Number(id), vs == null ? null : Number(vs));
  if (own) return Promise.resolve(own);
  const key = `${ctx.bundle?.version ?? ''}:${id}:${vs ?? ''}`;
  if (!CARDS.has(key)) {
    if (CARDS.size > 40) CARDS.delete(CARDS.keys().next().value);
    // asked again while any card waiting on it is open, not the first's alone
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
/** Retry waits after a failure; the last repeats until it answers or the card goes. */
const RETRY_MS = [2000, 4000, 8000, 15000];
/** Bundle card of `id` (api/card.py cards) shaped as GET /api/m/player: his stats over his rows, peers from his
 *  position's `dist`, his club's coming ties; `vs`: another player's figures (stats.vs). Null if the bundle lacks
 *  either. */
function fromBundle(cards, id, vs) {
  const me = cards?.players?.[id], other = vs == null ? null : cards?.players?.[vs];
  if (!me || (vs != null && !other)) return null;
  // `all`: among every position (api/card.py ALL: rank third per row, peers' values under ALL)
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

export function open(ctx, rawId, { gw, place = null, vs = null } = {}) {
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
  // local: a local page (api.access), where forecast columns carry the runs as ticks
  let off = null, card, cardState = 'loading', local = false, closed = false;
  // header facts: redrawn when the card lands (the API's card gives ownership now; the bundle's carries none, so its
  // row's stands)
  const entry = d.base?.squad?.find((r) => Number(r.id) === id);
  const subEl = h('small.ps-sub', null, headerSub(row, P0.L.pos(id), null, entry));
  // (`vs` given: the two compared, the card title's →, yours first; owner, 2026-11-09, "comparison of two players")
  const orow = vs == null ? null : d.byId.get(Number(vs)) ?? null, two = !!orow;
  let self = null, vsCard = null;
  // a compared player's name: a door to his position's players in Bring in a player's own list (wish.js `compare`),
  // each row's button Compare (`to`: the new pair [first, second]); a pick opens the pair's comparison, a close without
  // one this one again (owner, 2026-11-09, "how do i type in the player", "same view as in bring player")
  const pick = (pid, to) => h('button.ps-pick', { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': COPY.comparePick(P0.L.name(pid)), onClick: () => {
    ctx.openSheet('wish', null, { gw: g, pos: P0.L.pos(pid), compare: {
      title: COPY.comparePick(P0.L.name(pid)),
      pick: (x) => { const [a, b] = to(Number(x)); ctx.openSheet('player', a, { gw: g, vs: b }); },
      back: () => ctx.openSheet('player', id, { gw: g, vs }),
    } });
  } }, P0.L.name(pid), h('i.ps-chev', { 'aria-hidden': 'true' }));
  const side = (pid, r, sub, me) => h(`span.ps-side${me ? '' : '.vs'}`, null, h('span.ps-kit', { 'aria-hidden': 'true' }, shirtOf(P0.L, pid, 40)),
    h('span', null, h('span.ps-nm', null, h(`span.${me ? 'ps-memark' : 'ps-vsmark'}`, { 'aria-hidden': 'true' }), pick(pid, (x) => (me ? [x, vs] : [id, x]))), sub,
      statusLines(r, P0, { available: false, lineup: false })));
  return self = ctx.sheets.open({
    title: two ? h('span.ps-title.ps-two', null, side(id, row, subEl, true), side(Number(vs), orow, h('small.ps-sub', null, headerSub(orow, P0.L.pos(vs), null, null)), false))
      : h('span.ps-title', null, h('span.ps-kit', { 'aria-hidden': 'true' }, shirtOf(P0.L, id, 56)),
        // full name (owner, 2026-10-16), FPL's short one in older data
        h('span', null, row.full_name || row.name, subEl)),
    label: two ? COPY.compareOf(P0.L.name(id), P0.L.name(vs)) : `${row.full_name || row.name}, ${row.club}, ${fmt.money(row.price)}`,
    // full screen (owner, 2026-10-15)
    detent: 'large', cls: 'ps',
    onClose: () => { closed = true; off?.(); AH.presolveTaps(ctx, null, { owner: row }); },
    build(body, sheet) {
      // stats view (Per match | Per 90): this viewer's last pick
      let view = statsView(ctx);
      const setView = (v) => { view = v; keepStatsView(ctx, v); draw(); };
      let among = statsAmong(ctx);
      const setAmong = (v) => { among = v; try { ctx.api?.local?.set?.(STATS_AMONG_KEY, v); } catch { /* not kept */ } draw(); };
      // rule controls follow your rules as edits land (and Undo)
      off = ctx.store.on('memory', () => queueMicrotask(draw));
      const draw = () => {
        const P = plan(ctx);
        const main = body.querySelector('.ps-main') || body.appendChild(h('div.ps-main'));
        main.dataset.card = cardState;
        const W = widthOf(main);
        const m = model(ctx, P, row, id, card, cardState, local, vs, vsCard);
        const G = geometry(m, W);
        fill(subEl, headerSub(row, P.L.pos(id), card, entry));
        // focus survives a redraw: a segmented option (ui.roving) in its group, found by name; an ⓘ by its label
        const grp = document.activeElement?.closest?.('.ps-main [role="radio"]')?.closest('[role="radiogroup"]');
        const info = document.activeElement?.closest?.('.ps-main .ps-info')?.getAttribute('aria-label');
        const kept = grp ? `${grp.getAttribute('aria-labelledby') ? `[aria-labelledby="${grp.getAttribute('aria-labelledby')}"]` : `[aria-label="${grp.getAttribute('aria-label')}"]`} [aria-checked="true"]`
          : info ? `.ps-info[aria-label="${info}"]` : null;
        // order: actions (under the header), status, chart, numbers
        // (two compared: no actions, the GWs as a table, the stats both; his own card as it was)
        fill(main,
          two ? null : actions(P),
          two ? null : askLine(P),
          two ? null : statusLines(row, P, { available: false, lineup: false }),
          // (two compared: one strip, the two in every GW column, league games only)
          stripSection(two ? { ...m, two: true, rows: [row, orow], nameA: P.L.name(id), from: g } : m, G, chartKey),
          statsSection(card, W, { view, setView, among, setAmong }, two));
        if (kept) main.querySelector(kept)?.focus({ preventScroll: true });
        // his controls' taps solved ahead while the sheet is open (AH.presolveTaps; owner, 2026-10-26): each option not
        // in force
        if (P.editable) AH.presolveTaps(ctx, aheadTaps(P), { gw: g, owner: row });
      };
      /** His controls' edits as taps (AH.presolveTaps): Keep (this GW, through the end), Not him (this GW; a buy of him
       *  there: its veto), Never, Off for a rule of his (removeRule). */
      /** His card's taps solved ahead (AH.presolveTaps): the Remove of a rule of his, his only edit left on it. */
      const aheadTaps = (P) => [pinOf(P, 'keep', id, g), pinOf(P, ['sell', 'veto', 'never'], id, g)].filter(Boolean)
        .map((q) => ({ kind: 'rule', gw: g, run: () => removeRule(ctx, q.id) }));
      // chart key (ⓘ): shut until asked, kept open across redraws
      const keyOf = () => { const k = { open: false, toggle: () => { k.open = !k.open; draw(); } }; return k; };
      const chartKey = keyOf();
      const close = () => sheet.close();
      /** Why his Remove or Off is off: taking rule `q` off would re-plan GW A under way (AH.liftsLive); a quiet line |
       *  null. */
      const liveWhy = (P, q) => (AH.liftsLive(ctx, P, q) ? h('p.ps-off.m-foot', null, COPY.live(P.A)) : null);
      /** His card's GW has him in your squad, or the plan sells him in it (UX-3): Force keep and Force out are his
       *  controls, not Bring him in… */
      const owns = (P) => weekOf(P, g).squad.includes(id) || squadBefore(P, g).includes(id);
      /** Your sale of him where the Sell row isn't drawn (a GW after it), else your wish, else a Keep or veto the week
       *  controls below don't show (another GW's, or beside the Sell row's sale), with the button that takes it off:
       *  removeRule (a sale's or Wish's move as its row's ×, else liftAsk). */
      function askLine(P) {
        // pinOf returns the one pin covering GW g (one rule per player: meeting), so one it doesn't is of another GW;
        // the Sell row's sale shows over a same-GW veto (sale ?? out)
        // (no week controls on his card since 2026-11-09 (Replace… and Sub…, Bring him in…): any rule of his)
        const pin = pinOf(P, 'sell', id) ?? pinOf(P, 'wish', id) ?? pinsOf(P, ['keep', 'veto', 'never'], id)[0] ?? null;
        if (!pin) return null;
        const word = pin.kind === 'sell' ? pin.label || 'Sold by your pick' : pin.kind === 'wish' ? pin.label || 'Added by you'
          : ruleOf(P, pin).text;
        const undo = 'Remove';
        return h('div.ps-ask', null, h('span', null, word),
          h('button.m-chipbtn.m-danger', { type: 'button', disabled: !P.editable || AH.liftsLive(ctx, P, pin), onClick: () => removeRule(ctx, pin.id) }, undo),
          P.editable ? liveWhy(P, pin) : h('p.ps-off.m-foot', null, P.why));
      }
      /** Buttons under the header: for a player you have, Replace… (sell him from the first week he can go: who comes in,
       *  or Forkcast's pick; sheets/replace.js) and Sub… (his week's legal swaps: sheets/sub.js), his Keep and Force out
       *  hidden (owner, 2026-11-09, "hide this buttons and only add button on replace and sub"); for one you don't,
       *  Bring him in… (whole row) and Force out. */
      function actions(P) {
        const b = (label, onClick, cls = '', off = false) => h('button', { type: 'button', class: cls, disabled: !P.editable || off, onClick }, label);
        let grid;
        if (owns(P)) {
          const w = weekOf(P, g), from = pinOf(P, 'sell', id) ? null : AH.sellWeek(ctx, P, id, g);
          grid = [
            b(COPY.replaceGo, () => { close(); ctx.openSheet('replace', id, from); }, '', from == null),
            b(COPY.subGo, () => { close(); ctx.openSheet('sub', id, g); }, '', AH.squadWeek(w) || !(w.xi.includes(id) || w.bench.includes(id))),
          ];
        }
        else {
          grid = [
            // no ask; a Never of him goes when a week is picked, and the verdict names it (Undo restores it)
            // the week you chose him in is preselected (owner, 2026-10-09); every sheet closes first
            // a secondary button; no Not him (owner, 2026-11-09, "hide 'not him'")
            b('Bring him in…', () => { ctx.sheets.closeAll(); ctx.openSheet('wish', id, { gw: g }); }, 'wide'),
          ];
        }
        // a plan you can't edit: every button off, its reason (P.why) once. `place` (Ahead's pitch, the card behind):
        // the choices for his place, dealt out there once the sheet closes
        return h('div.ps-acts', null, h('div.ps-grid', null, grid), P.editable ? null : h('p.ps-off', null, P.why),
          place ? h('button.ah-lnk.ps-place', { type: 'button', onClick: () => { close(); place.open(); } }, COPY.placeChoices(place.n)) : null);
      }
      draw();
      // the on-disk half: drawn when it lands (at the mounted sheet's width); a failure keeps the forecast
      // (two compared: his stats on the same rows, stats.vs; and his own card for his matches)
      if (two) cardOf(ctx, vs, null, () => !closed).then((c) => { vsCard = c; draw(); }, () => {});
      cardOf(ctx, id, two ? vs : null, () => !closed).then((c) => { card = c; cardState = 'ready'; }, () => { cardState = 'none'; })
        .then(draw);
      // runs as ticks are model internals (as the Why sheet's run strip): shown once a local page's verdict lands
      Promise.resolve(ctx.api?.access?.()).then((a) => { if (a?.local) { local = true; draw(); } }).catch(() => {});
    },
  });
}

/** The chart width: the sheet body's, else the phone's less its 16 px gutters (320–430 wide). */
function widthOf(el) {
  const w = el?.clientWidth || Math.min(globalThis.innerWidth || 390, 430) - 32;
  return Math.max(260, Math.round(w));
}

/** His current price, FPL's chip beside it (calls.priceProgress; none without a projection), a £↓ after that where a
 *  drop takes the sale of `entry`, his row in your team, down as well. */
function priceFact(row, entry) {
  if (!Number.isFinite(row.price)) return null;
  const c = priceProgress(row, entry);
  return [fmt.money(row.price),
    c ? h(`span.ps-pg.t${c.tone}`, { role: 'img', 'aria-label': COPY.progressSaid(c.text) }, c.text) : null,
    c?.sale ? h('span.ps-sl', { role: 'img', 'aria-label': COPY.saleSaid(c.sale) }, COPY.saleDrops) : null];
}

/** The header's facts, "ARS · MID · £9.6m +26.4% · 38.2% owned": each only when the data has it (ownership from the
 *  card, once it lands). */
function headerSub(row, pos, card, entry) {
  const sel = card?.now?.sel_pct ?? row.sel_pct;
  // each fact unbroken (m-ahead.css .ps-sub): a line wraps between facts, never inside "22.6% owned"; no form (owner,
  // 2026-10-16)
  return [row.club, posCode(pos), priceFact(row, entry), Number.isFinite(sel) ? `${fmt.pct(sel)} owned` : null].filter(Boolean).map((x) => h('span', null, x));
}

/** His status, up to two lines: FPL's availability ("75% · ankle injury"; amber, red at 25% or less or out) and, with
 *  `lineup`, WhoScored's predicted lineup ("Predicted bench GW6 · WhoScored"); "Available" when neither says anything
 *  (`available` false: null then, and for a predicted start alone; `name`: each line says whose). The player sheet asks
 *  for FPL's flag alone (owner, 2026-10-13). */
/** A player's FPL flag: {tone: 'red' (out, or 25% or less) | 'amber', short: "75%" (FPL's word where it gives no
 *  chance: "Injured"), reason: "thigh injury" | ''} | null (all clear). */
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
  // Why sheet's buy: only a status not all clear (FPL flag, or a lineup he doesn't start in)
  if (!available && lines.every((p) => p.classList.contains('ok'))) return null;
  if (!lines.length) lines.push(h('p.ps-st.ok', null, h('i.dot', { 'aria-hidden': 'true' }), 'Available'));
  return h('div.ps-status', null, lines);
}

// ---------------------------------------------------------------- the data the charts draw

/** His forecast's rank among his position's in GW g (bundle rows, shown scale): ties share the better rank. */
function xpRank(ctx, pos, xp, g) {
  if (!Number.isFinite(xp)) return null;
  const d = ctx.data;
  const vs = d.rows.filter((r) => posName(r.pos) === pos).map((r) => ctx.pitch.xpAt(r, g, d.xpGws)).filter(Number.isFinite);
  return { rank: 1 + vs.filter((v) => v > xp).length, n: vs.length };
}

/** Past matches (the card), the five forecasts (bundle row and runs), the replaced player of a buy, opponents (bundle
 *  fixtures + FPL difficulty), his cups and coming ties (card cups, cup_next). Past columns are held open while the
 *  card loads; a card with none draws the forecast across the width. Runs: a local page only (`local`). */
function model(ctx, P, row, id, card, state, local = false, vs = null, vsCard = null) {
  const d = ctx.data;
  const pos = P.L.pos(id) ?? posName(row.pos);
  const runsOf = (pid, g) => {
    const s = d.seeds;
    if (!s?.has?.(pid)) return [];
    return Array.from({ length: s.runs }, (_, r) => s.at(pid, g, r)).filter(Number.isFinite);
  };
  const w = P.weeks.find((x) => x.in.includes(id) && !P.owned.includes(id));
  // (`vs`: the player he'd replace in a transfer the card offers, not yet in the plan)
  const out = vs ?? w?.moves.find((m) => m.in === id)?.out;
  const orow = out != null ? d.byId.get(Number(out)) : null;
  const futAll = d.xpGws.map((g) => ({
    gw: g,
    xp: ctx.pitch.xpAt(row, g, d.xpGws),
    rank: xpRank(ctx, pos, ctx.pitch.xpAt(row, g, d.xpGws), g),
    runs: local ? runsOf(id, g) : [],
    fx: ctx.pitch.fixturesAt(row, g, d.xpGws) ?? [],
    inPlan: !!weekOf(P, g),
  }));
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
    fut: futAll.slice(0, NEXT_N),
    futAll,
    comp: out == null ? null : {
      name: P.L.name(out), chance: orow?.chance ?? null,
      xp: d.xpGws.map((g) => ctx.pitch.xpAt(orow, g, d.xpGws)),
      // (his own matches by GW, his card's, and his coming opponents: the comparison's table)
      past: new Map((vsCard?.last_matches ?? []).filter((x) => x.gw != null).map((x) => [Number(x.gw), x])),
      fx: d.xpGws.map((g) => ctx.pitch.fixturesAt(orow, g, d.xpGws) ?? []),
    },
  };
}

/** A segmented control (m-seg radiogroup, arrow keys: ui.roving): opts [[key, text, spoken]], `current` key,
 *  onPick(key); named by `labelledBy` (an id), else `label`. Serves the stats' Per match / Per 90. */
export function segControl({ opts, current, onPick, labelledBy = null, label = null, disabled = () => false, cls = '' }) {
  return roving(h(`div.m-seg${cls}`, { role: 'radiogroup', 'aria-labelledby': labelledBy, 'aria-label': labelledBy ? null : label, style: { '--n': opts.length, '--i': opts.findIndex(([k]) => k === current) } },
    h('span.m-seg-thumb'),
    opts.map(([k, l, said]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(k === current), 'aria-label': said, disabled: disabled(k), onClick: () => onPick(k) }, l))), { pick: (b) => b.click() });
}

// ---------------------------------------------------------------- inline SVG

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '–');
/** A chart's text: size and weight are m.css's (.ps .ps-chart svg text: 13 px --t-sub 400, muted; class "v": 600 ink),
 *  never set here. */
function T(x, y, s, { anchor = 'middle', fill: c = 'var(--muted)', cls = '', mark = false } = {}) {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" fill="${c}"${cls ? ` class="${cls}"` : ''}>${esc(s)}${mark ? ' <tspan class="xp-u">xP</tspan>' : ''}</text>`;
}
/** A forecast value as ui.js xpNum draws it (m.css .xp: blue text, no chip; owner, 2026-10-22), baseline at (x, y). */
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
/** px a bar's value label needs above it, under the captions (matchStrip) */
const LABEL_ROOM = 17;
/** An opponent in the chart's titles and spoken words: "MUN A", "COV H" (drawn, the code's case says the venue:
 *  oppText). */
const fixText = (opp, home) => (opp == null ? '–' : `${String(opp).toUpperCase()} ${home ? 'H' : 'A'}`);
const sum = (xs) => xs.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
/** His last matches' points and minutes (card last_matches): the strip's head and the Why table. */
export const pastSums = (past) => ({ pts: sum(past.map((x) => x.points)), mins: sum(past.map((x) => x.minutes)) });

/** A chart text's width at 13 px in the page's own font (a canvas); rough where there is none. */
const WIDTHS = new Map();
let PEN = null;
function measure(s, wt = 400) {
  const key = `${wt}|${s}`;
  if (WIDTHS.has(key)) return WIDTHS.get(key);
  let px = String(s).length * 8;
  try {
    PEN ??= document.createElement('canvas').getContext('2d');
    const fam = getComputedStyle(document.documentElement).getPropertyValue('--f-text').trim() || 'system-ui, sans-serif';
    // chart size: --t-sub of the root text size (13 px default), so a larger size measures as drawn
    PEN.font = `${wt} ${parseFloat(getComputedStyle(document.documentElement).fontSize) * 13 / 17 || 13}px ${fam}`;
    px = PEN.measureText(String(s)).width;
  } catch { }
  if (WIDTHS.size > 400) WIDTHS.clear();
  WIDTHS.set(key, px);
  return px;
}


/** The strip's geometry (strip.js layout): his EPL and cup matches over the forecast GWs and coming cup ties, two lines
 *  of one column width; no past columns: forecast alone. */
function geometry(m, W) {
  // (his cup and international matches among them as before v1.3.217; owner, 2026-11-09, "fix bug with missing non
  // epls", "it should look the same as it looked before you removed it")
  const { cols: past, after } = S.pastColumns(m.past.map((x) => ({ ...x, opp: x.opp == null ? null : String(x.opp).toUpperCase() })), m.cups);
  const fut = S.futureColumns(m.fut.map((f) => ({ ...f, value: f1(f.xp), codes: f.fx.map((o) => o.opp) })), m.cupNext, after ?? []).cols;
  return S.layout({ pastCols: past, futCols: fut, W, measure, slots: m.past.length ? 0 : m.slots });
}

/** A section's ⓘ: opens its key (`key`: {open, toggle}) under it; drawn, as a text "ⓘ" falls back to another font. */
function infoBtn(key, label) {
  const b = h('button.ps-info', { type: 'button', 'aria-expanded': String(key.open), 'aria-label': label, onClick: key.toggle });
  b.innerHTML = INFO;
  return b;
}
const INFO = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="5" r=".95" fill="currentColor"/><rect x="7.3" y="6.9" width="1.4" height="4.6" rx=".7" fill="currentColor"/></svg>';

/** LAST 6 · NEXT 5 (NEXT 5 alone with no past matches): a cap label (`title`: the player's name where two are
 *  compared), the drawn columns' sums, the key behind ⓘ (key: {open, toggle}); on `scale` (scaleOf) when shared. */
/** A strip's sums: his past matches' points and minutes, the forecast's xP over its weeks. Each sum unbroken (no-break
 *  spaces, none after a span's dash: "GW9–" over "15" at 320 px); the forecast's names its weeks, in blue with "xP". */
function stripSums(m) {
  const { pts, mins } = pastSums(m.past);
  const next = sum(m.fut.map((f) => f.xp));
  const nb = (x) => x.replace(/ /g, '\u00a0').replace(/–/g, '\u2060–\u2060');
  return h('span.ps-sums', null, m.past.length ? `${nb(`${pts} pts in ${mins}′`)} · ` : null, h('span.ps-sum', null, `${nb(COPY.span(m.fut.map((f) => f.gw)))}\u00a0`, xpNum(f1(next))));
}

function stripSection(m, G, key) {
  // (two compared: the summary and the paired strip, no single player's heading, sums or key)
  if (m.two) return pairView(m, m.rows, G.W);
  const head = stripSums(m);
  const info = infoBtn(key, 'What the chart shows');
  return h('div.m-sec.ps-strip', null,
    h('h3', null, h('span', null, m.slots ? `Last ${m.past.length || LAST_N} · next ${m.fut.length}` : `Next ${m.fut.length}`),
      h('span.ps-tot.m-num', null, head, info)),
    matchStrip(m, G),
    m.unavailable ? h('p.ps-nopast', null, 'Past matches unavailable') : null,
    key.open ? h('p.ps-note', null, stripKey(m, G.cols)) : null);
}

/** The chart's key behind its ⓘ (stripSection): a sentence for each kind of mark the columns `cols` draw, none for a
 *  mark not drawn. Pure. → text */
export function stripKey(m, cols) {
  const cups = cols.filter((c) => c.kind === 'cup');
  const ticks = m.fut.some((f) => f.runs.length);  // ticks sentence only where drawn
  // cups played since his last league match lead the forecast's line (strip.js `after`)
  const among = [cups.some((c) => !c.next && c.ahead) ? 'his cup games since his last league match' : null,
    cups.some((c) => c.next) ? 'his club\'s coming cup games' : null].filter(Boolean).join(', then ');
  // forecast GWs past your plan (the switcher locks them): bars dashed (matchStrip's .fc.edge)
  const past = m.fut.filter((f) => !f.inPlan).map((f) => f.gw);
  // competitions drawn, code with name ("CL Champions League"): a grey code is said nowhere else; a cup's venue its
  // letter
  const codes = [...new Set(cups.map((c) => c.league))].map((l) => `${S.cupCode(l)} ${S.cupName(l)}`).join(', ');
  const venue = cups.some((c) => c.home != null) ? '; H home, A away' : '';
  return `${COPY.runSpread(ticks)}${m.comp ? ` ○ ${m.comp.name}${m.comp.chance != null && m.comp.chance < 100 ? ` (${m.comp.chance}% to play)` : ''}, the player he replaces.` : ''}`
    + ` Opponent: FPL's difficulty, green easy to red hard; ${COPY.oppCase}.`
    + `${past.length ? ` Dashed: ${COPY.span(past)}, past your plan.` : ''}`
    + `${cups.some((c) => !c.next) ? ' Grey: his other competitions, his minutes in each (0′ an unused sub, — not in the squad).' : ''}`
    + `${among ? ` Among the forecast, grey: ${among}.` : ''}${codes ? ` ${codes}${venue}.` : ''}`;
}

/** An opponent on FPL's difficulty colour (the pitch's chips) under column c at baseline y, its code's case its venue
 *  ("COV" at home, "cov" away); an end column's chip slides in to stay on a chart W wide. */
function oppChip(c, opp, home, fdr, y, W) {
  const shown = oppText({ opp, home });
  const chipW = Math.min(c.w - 1, measure(shown, 600) * S.CODE_SCALE + 6);
  const x = S.within(c.cx, chipW, 0, W) - chipW / 2;
  return `<g class="opp" data-club="${esc(opp)}" data-fdr="${fdr ?? ''}"><title>${esc(`${fixText(opp, home)}${fdr ? `, FPL difficulty ${fdr} of 5` : ''}`)}</title>`
    + (fdr ? `<rect x="${x.toFixed(1)}" y="${(y - 11).toFixed(1)}" width="${chipW.toFixed(1)}" height="15" rx="3" fill="var(--fdr-${fdr})"/>` : '')
    + T(x + chipW / 2, y, shown, { fill: 'var(--ink)', cls: 'v code' }) + '</g>';
}

/** Two players compared (the card title's →), as chart design guidance has it (owner, 2026-11-09, "find proper
 *  design"): two time series compared on line graphs (Few, perceptualedge.com/blog/?p=2578), points and the forecast's
 *  xP each a panel on its own scale; the two players blue and orange (Okabe-Ito, the safe pair), told apart by line and
 *  marker too (solid, filled: the first; dashed, hollow: the second); each value at its point, the higher over it,
 *  the lower under it; under the GWs each player's row of fixture difficulty squares (no team names: the colour says
 *  it). Over it his and his totals, a ✓ at the better. rows: the two players' bundle rows. → node */
function pairView(m, rows, W) {
  const c2 = m.comp;
  const past = m.past.filter((x) => x.gw != null), fut = m.futAll ?? m.fut;
  const ptsA = past.map((x) => (x.minutes ? Number(x.points ?? 0) : null));
  const ptsB = past.map((x) => { const o = c2?.past?.get(Number(x.gw)); return o?.minutes ? Number(o.points ?? 0) : null; });
  // (the forecast's next four from the week it was opened from (`from`, GW g): from GW13, GW13-16, never the plan's
  // GW11-14; owner, 2026-11-09, "why it not shows forecast for next gws when i click compare from gw13")
  const from = m.from ?? fut.find((f) => f.inPlan)?.gw ?? fut[0]?.gw;
  const plan4 = fut.filter((f) => f.gw >= from).slice(0, 4), xp4A = plan4.map((f) => f.xp ?? null), xp4B = plan4.map((f) => c2?.xp[fut.indexOf(f)] ?? null);
  const tot = (xs) => xs.reduce((t, v) => t + (v ?? 0), 0);
  const lines = [
    past.length ? [`Points ${COPY.span(past.map((x) => x.gw))}`, tot(ptsA), tot(ptsB), String] : null,
    [`Forecast xP ${COPY.span(plan4.map((f) => f.gw))}`, tot(xp4A), tot(xp4B), f1],
  ].filter(Boolean);
  const cellOf = (v, w, show, side) => {
    const best = v > w + 1e-9;
    return h(`span.ps-hh-v.${side}.m-num`, { class: { best } }, side === 'b' && best ? h('i.ps-ok', null, '✓') : null, show(v), side === 'a' && best ? h('i.ps-ok', null, '✓') : null);
  };
  const table = h('div.ps-hh', null, lines.map(([l, a, b, show]) => h('div.ps-hh-r', null, cellOf(a, b, show, 'a'), h('span.ps-hh-l', null, l), cellOf(b, a, show, 'b'))));
  // (one row: the past points, then the forecast's xP for your plan's weeks, each part its own scale, a rule between;
  // owner, 2026-11-09, "merge in one row, show forecast only for next 4")
  const GUT = 14, PH = 78, top = 34;
  const parts = [
    past.length ? { title: `Points · ${COPY.span(past.map((x) => x.gw))}`, gws: past.map((x) => x.gw), a: ptsA, b: ptsB, fa: past.map((x) => ({ fdr: x.fdr })), fb: past.map((x) => ({ fdr: c2?.past?.get(Number(x.gw))?.fdr })), xp: false } : null,
    { title: `Forecast xP · ${COPY.span(plan4.map((f) => f.gw))}`, gws: plan4.map((f) => f.gw), a: xp4A, b: xp4B, fa: plan4.map((f) => f.fx[0]), fb: plan4.map((f) => c2?.fx?.[fut.indexOf(f)]?.[0]), xp: true },
  ].filter(Boolean);
  const n = parts.reduce((t, p) => t + p.gws.length, 0), SEP = 10, cw = (W - GUT - SEP * (parts.length - 1)) / n;
  const out = [];
  let i0 = 0;
  parts.forEach((part, k) => {
    const x0 = GUT + i0 * cw + k * SEP, hi = Math.max(1, ...part.a.map((v) => v ?? 0), ...part.b.map((v) => v ?? 0));
    const y = (v) => top + PH - (Math.max(v, 0) / hi) * PH;
    const cx = (i) => x0 + i * cw + cw / 2;
    const say = (v) => (part.xp ? f1(v) : String(v));
    out.push(T(x0, 12, part.title, { anchor: 'start' }), L(x0, top + PH, x0 + part.gws.length * cw, top + PH, 'var(--border-2)'));
    if (k) out.push(L(x0 - SEP / 2, 4, x0 - SEP / 2, top + PH + 60, 'var(--hair)'));
    const line = (vals, color, dash) => {
      const runs = [[]];
      vals.forEach((v, i) => (v == null ? runs.push([]) : runs.at(-1).push(`${cx(i).toFixed(1)},${y(v).toFixed(1)}`)));
      return runs.filter((r) => r.length > 1).map((r) => `<polyline points="${r.join(' ')}" fill="none" stroke="${color}" stroke-width="2.2"${dash ? ' stroke-dasharray="5 3"' : ''}/>`).join('');
    };
    out.push(line(part.b, 'var(--pair-b)', true), line(part.a, 'var(--pair-a)', false));
    part.gws.forEach((g, i) => {
      const va = part.a[i], vb = part.b[i], aUp = vb == null || (va != null && va >= vb);
      if (vb != null) out.push(`<circle cx="${cx(i).toFixed(1)}" cy="${y(vb).toFixed(1)}" r="3.8" fill="var(--surface)" stroke="var(--pair-b)" stroke-width="2"/>`, T(cx(i), y(vb) + (aUp ? 16 : -8), say(vb), { fill: 'var(--pair-b)', cls: 'v' }));
      if (va != null) out.push(`<circle cx="${cx(i).toFixed(1)}" cy="${y(va).toFixed(1)}" r="3.8" fill="var(--pair-a)"/>`, T(cx(i), y(va) + (aUp ? -8 : 16), say(va), { fill: 'var(--pair-a)', cls: 'v' }));
      out.push(T(cx(i), top + PH + 30, g));
      [[part.fa[i], top + PH + 40], [part.fb[i], top + PH + 52]].forEach(([o, yy]) => out.push(R(cx(i) - Math.min(9, cw / 2 - 2), yy, Math.min(18, cw - 4), 7, o?.fdr ? `var(--fdr-${o.fdr})` : 'var(--hair)', 'rx="2"')));
    });
    i0 += part.gws.length;
  });
  out.push(`<circle cx="4.5" cy="${top + PH + 43.5}" r="3.5" fill="var(--pair-a)"/>`, `<circle cx="4.5" cy="${top + PH + 55.5}" r="3.2" fill="var(--surface)" stroke="var(--pair-b)" stroke-width="1.8"/>`);
  return h('div.m-sec.ps-pair', null, table, svgEl(W, top + PH + 64, out.join(''), `${c2?.name ?? ''} compared by gameweek`, 'ps-chart.ps-pairline'));
}

/** A strip's points scale: its lowest score (a negative one) and highest bar over past, forecast and the replaced
 *  player's ○ alike: a bar of 5 is as tall in both. */
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

/** LAST 6 over NEXT 5, two lines on one points scale (strip.js layout; owner, 2026-10-14): his matches as solid bars
 *  (width = minutes) on a dotted line at his position's average; cups between them as grey columns; under them the
 *  forecast as hollow green bars, the runs as ticks (a local page's), the replaced player of a buy as ○. Under each
 *  column: the GW (a cup: its competition) and the opponent on FPL's difficulty colour. */
function matchStrip(m, G, { low, peak } = scaleOf(m, G)) {
  const { W, lines, cols } = G;
  const H = 64, RH = 16, CAP = 18, GAP = 14;
  const epl = cols.filter((c) => c.kind === 'epl'), gws = cols.filter((c) => c.kind === 'gw');
  const ymin = low < 0 ? -5 * Math.ceil(-low / 5) : 0;
  // room above the tallest bar for its value label, under the captions; a step up when the label would not fit
  let ymax = niceMax(peak);
  while (((ymax - peak) / (ymax - ymin)) * H < LABEL_ROOM) ymax += 5;
  const avg = m.avg?.points;
  const avgText = Number.isFinite(avg) && epl.length ? `${posCode(m.pos)} avg ${f1(avg)}` : null;
  const b = [];
  // the lines one under the other (strip.js layout: past, then forecast; a too-long row goes on over the next), GAP
  // between
  let top = 0;
  lines.forEach((line, i) => { top = drawLine(line, top, i > 0 && !lines[i - 1].cols[0]?.ahead === !line.cols[0]?.ahead) + GAP; });
  const said = (c) => (c.kind === 'cup' ? cupWords(c)
    : `GW${c.gw} ${fixText(c.opp, c.home)} ${c.minutes ? `${c.points} pts in ${c.minutes} min` : c.minutes == null ? 'not played yet' : "didn't play"}`);
  const past = cols.filter((c) => !c.ahead);
  const label = `${past.filter((c) => c.kind !== 'slot').map(said).join(', ')}`
    + `${avgText ? `; ${WORD[m.pos] ?? m.pos} averaged ${f1(avg)} a match in those rounds` : ''}`
    + `; forecast ${cols.filter((c) => c.ahead).map((c) => (c.kind === 'cup' ? cupWords(c)
      : `GW${c.gw} ${c.fx.map((o) => fixText(o.opp, o.home)).join(' and ') || 'no match'} ${f1(c.xp)}${c.rank ? `, ${rankWords(c, m.pos)}` : ''}`)).join('; ')}`;
  return svgEl(W, top - GAP, b.join(''), label, 'ps-chart.ps-match');

  /** One line of columns from y `top` → its bottom: captions, the plot, then each column's GW and opponents; `more`: a
   *  row's line after its first, without its caption. */
  function drawLine({ cols: lc }, top, more) {
    const y0 = top + CAP;
    const sy = (v) => y0 + H - ((v - ymin) / (ymax - ymin)) * H;
    // opponent lines: as many as the columns use (strip.js `row`); a double's second under its first
    const lineOf = (c, q = 0) => c.row + q;
    const oppRows = Math.max(1, ...lc.filter((c) => c.kind !== 'cup').map((c) => lineOf(c, Math.max(0, (c.fx?.length ?? 1) - 1)) + 1));
    const yGw = y0 + H + 16;
    const yOpp = (c, q = 0) => yGw + RH * (1 + lineOf(c, q));
    // the line's own end: the shorter line ends short of W (one column width for both)
    const end = lc.length ? lc.at(-1).x + lc.at(-1).w : W;
    // no venue line: an opponent's code says it, "COV" at home, "cov" away, a cup "H" or "A" on its line (owner,
    // 2026-10-16)
    const yEnd = yGw + RH * oppRows;
    // a cup's column: a grey band behind the plot and down through its labels (quiet: FPL scores no points)
    for (const c of lc) if (c.kind === 'cup') b.push(R(c.x + 1, y0 - 4, c.w - 2, yEnd + 10 - y0, 'var(--track)'));
    // a line every 5 points, unnumbered: every bar carries its value
    for (let v = ymin; v <= ymax; v += 5) b.push(L(0, sy(v), end, sy(v), 'var(--hair)'));
    // a cup's venue where a match has its opponent
    const venue = (c, home) => (home == null ? '' : T(c.cx, yGw + RH, home ? 'H' : 'A'));
    // opponent on its FPL difficulty colour (the pitch's chips), a match's as a forecast GW's; an end column's chip
    // slides in to stay on the chart
    const chip = (c, opp, home, fdr, y) => oppChip(c, opp, home, fdr, y, W);
    for (const c of lc) {
      if (c.kind === 'epl') {
        const p = c.points ?? 0, mn = c.minutes ?? 0;
        // a match he didn't play: "0′"; one not kicked off yet (api/card.py _match: no minutes) nothing (owner,
        // 2026-10-31)
        if (!mn) { if (c.minutes != null) b.push(T(c.cx, sy(0) - 4, '0′')); } else {
          const bw = Math.max(2, (c.w * 0.66 * Math.min(mn, 90)) / 90);
          b.push(`<g class="past" data-gw="${c.gw}" data-pts="${p}" data-min="${mn}">`
            + R(c.cx - bw / 2, Math.min(sy(p), sy(0)), bw, Math.abs(sy(0) - sy(p)), 'var(--ink-2)')
            + T(c.cx, Math.min(sy(p), sy(0)) - 4, p, { fill: 'var(--ink)', cls: 'v' }) + '</g>');
        }
        b.push(T(c.cx, yGw, c.gw), c.opp ? chip(c, c.opp, c.home, c.fdr, yOpp(c)) : T(c.cx, yOpp(c), '–', { fill: 'var(--ink)', cls: 'v' }));
      } else if (c.kind === 'cup') {
        // his minutes where a match has its bar ("59′", "0′" unused, "—" not in the squad; a coming one none), the
        // competition where a match has its GW ("CS" if the full one doesn't fit: strip.js `code`, within its codeAt),
        // the venue as a match's; all grey; no opponent
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
        // its value in the past bars' style (one for every code and value; owner, 2026-10-08), in the forecast's blue
        // (ui.js xpNum's, no chip)
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
    // its captions over the plot. Past line: the seasons ("2025 | 2026", a dotted divider where one ends) and his
    // position's average at its right end; forecast line: "forecast"
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
      // across match columns only (a cup has no points to measure against it)
      const runs = [];
      for (const c of lc) { if (c.kind !== 'epl') continue; const r = runs.at(-1); if (r && Math.abs(r[1] - c.x) < 0.5) r[1] = c.x + c.w; else runs.push([c.x, c.x + c.w]); }
      b.push(`<g class="avg" data-v="${f1(avg)}">${runs.map(([a, z]) => L(a, sy(avg), z, sy(avg), 'var(--ink)', 1, 'stroke-dasharray="1.5 2.5"')).join('')}`
        + (avgFits ? `<text x="${(end - 3).toFixed(1)}" y="${(y0 - 8).toFixed(1)}" text-anchor="end" fill="var(--muted)">${esc(avgText)}</text>` : '') + '</g>');
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
/** The stats ranked among his position ('pos') or every position ('all'; owner, 2026-10-16): this viewer's last pick,
 *  as the view's. */
const STATS_AMONG_KEY = 'fc:player:among';
const statsAmong = (ctx) => { try { return ctx.api?.local?.get?.(STATS_AMONG_KEY) === 'all' ? 'all' : 'pos'; } catch { return 'pos'; } };
/** FPL's own per-match figures among the stats (api/card.py FPL_STATS), named in the footnote. */

/** STATS: every peer of his position (faint), him in ink, his value and rank (ties share the better rank), on the stats
 *  the data chose for him (api/stats_pick.json, api/card.py _rows; owner, 2026-10-14), per match he played or per 90
 *  (owner, 2026-10-13: per match first). */
function statsSection(card, W, { view, setView, among, setAmong }, two = false) {
  // among every position (api/card.py stats.all) or his own
  const of = (s) => (among === 'all' ? s?.all?.[view] : s?.[view]) ?? null;
  const p = of(card?.stats);
  if (!p || !Object.values(p.rows).some((r) => r.value != null)) return null;
  // (two compared: the other's ring on each line, his value beside this one's, no ranks; owner, 2026-11-09, "fix so this
  // not take two rows")
  const o = two ? of(card?.stats?.vs) : null;
  const word = among === 'all' ? 'players' : WORD[p.pos] ?? 'players';
  const per = view === 'p90' ? 'per 90 minutes' : 'a match';
  const labs = Object.keys(p.rows).map((k) => (STAT[k] ?? [k])[0]);
  const RK = o ? 0 : 44, SW = W - RK, AX = Math.min(124, Math.ceil(Math.max(...labs.map((s) => measure(s)))) + 10), RV = o ? 84 : 44, span = SW - AX - RV, hh = 26, y = hh / 2;
  const rows = Object.entries(p.rows).map(([k, r]) => {
    const [lab, dp] = STAT[k] ?? [k, 1];
    const vals = p.dist[k] ?? [];
    const ov = o?.rows[k]?.value ?? null;
    const hi = Math.max(...vals, r.value ?? 0, ov ?? 0) * 1.02 || 1;
    const sx = (v) => AX + (Math.min(Math.max(v, 0), hi) / hi) * span;
    const b = [L(AX, y, AX + span, y, 'var(--hair)'), T(0, y + 4.5, lab, { anchor: 'start' })];
    for (const v of vals) b.push(`<circle class="peer" cx="${sx(v).toFixed(1)}" cy="${y}" r="2.6" fill="var(--border-2)" opacity=".7"/>`);
    if (o && ov != null) b.push(`<circle class="vs" cx="${sx(ov).toFixed(1)}" cy="${y}" r="4.3" fill="var(--surface)" stroke="var(--pair-b)" stroke-width="2"/>`);
    if (r.value != null) b.push(`<circle class="me" cx="${sx(r.value).toFixed(1)}" cy="${y}" r="5" fill="${o ? 'var(--pair-a)' : 'var(--ink)'}" stroke="var(--surface)" stroke-width="1.5"/>`);
    b.push(T(o ? SW - 42 : SW, y + 4.5, r.value == null ? '–' : r.value.toFixed(dp), { anchor: 'end', fill: o ? 'var(--pair-a)' : 'var(--ink)', cls: 'v' }));
    if (o) b.push(T(SW, y + 4.5, ov == null ? '–' : ov.toFixed(dp), { anchor: 'end', fill: 'var(--pair-b)', cls: 'v' }));
    const rank = r.rank == null ? '–' : fmt.ordinal(r.rank);
    const said = `${r.value == null ? 'none' : r.value.toFixed(dp)}, ${r.rank == null ? 'no rank' : `${fmt.ordinal(r.rank)} of ${p.n} ${word}`}`;
    return h('div.ps-srow', { 'data-key': k, 'data-rank': r.rank ?? '', 'data-value': r.value ?? '' },
      svgEl(SW, hh, b.join(''), `${lab} ${per}: ${said}`, 'ps-chart'),
      o ? null : h('span.ps-rk.m-num', null, rank));
  });
  const [g0, g1] = card.season_rounds ?? [];
  return h('div.m-sec.ps-stats', { 'data-view': view, 'data-among': among },
    // title and both switches on one line, no ⓘ (owner, 2026-10-16)
    // the Why table's head (COPY.statsHead); whom he is ranked among is its All | MID switch here
    h('div.ps-stathead', null, h('h3', null, h('span', null, COPY.statsHead(g0, g1))),
      // the ranked-among switch left of the per-match / per-90 one (owner, 2026-10-16)
      h('div.ps-segs', null,
        segControl({ opts: [['all', 'All', 'All positions'], ['pos', p.pos, WORD[p.pos] ?? p.pos]], current: among, onPick: setAmong, label: 'Ranked among all positions or his own', cls: '.small.ps-among' }),
        // "Match" on a phone's one line ("Per match" its spoken name)
        segControl({ opts: [['match', 'Match', 'Per match'], ['p90', 'Per 90', 'Per 90 minutes']], current: view, onPick: setView, label: 'Stats per match or per 90 minutes', cls: '.small' }))),
    rows);
}

