// Forkcast's app shell: the store, and the bundle's derived data (lineups, FPL team, horizon).

import * as ui from '../../ui.js';
import * as api from '../api.js';
import * as calls from '../calls.js';
import * as engine from '../../plan/engine.js';
import * as pitch from '../../plan/pitch.js';

const range = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b >= a ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : []);

// ================================================================ store

export function createStore(initial) {
  const state = { ...initial };
  const subs = new Map();
  const saved = new Set();
  const store = {
    get: (k) => state[k],
    set(k, v) {
      if (k && typeof k === 'object') { for (const [a, b] of Object.entries(k)) store.set(a, b); return; }
      if (Object.is(state[k], v)) return;
      const prev = state[k];
      state[k] = v;
      if (saved.has(k)) api.local.set(`fc:s:${k}`, v == null ? null : JSON.stringify(v));
      for (const fn of [...(subs.get(k) || [])]) fn(v, prev);
    },
    on(k, fn) {
      if (!subs.has(k)) subs.set(k, new Set());
      subs.get(k).add(fn);
      return () => subs.get(k)?.delete(fn);
    },
    /** Persists `k` in localStorage (fc:s:<k>); loads the saved value now, else `fallback`. */
    persist(k, fallback) {
      saved.add(k);
      const v = api.local.json(`fc:s:${k}`);
      state[k] = v ?? state[k] ?? fallback;
      return state[k];
    },
  };
  return store;
}

// ================================================================ derived bundle data

function lineupNow(entry, data) {
  if (Array.isArray(entry?.xi) && entry.xi.length === 11) {
    return { xi: entry.xi.map(Number), bench: (entry.bench || []).map(Number), captain: entry.captain, vice: entry.vice };
  }
  const xpOf = (id) => pitch.xpAt(data.byId.get(Number(id)), data.gw, data.xpGws) ?? 0;
  const posOf = (id) => ui.posName(data.byId.get(Number(id))?.pos);
  const { xi, bench } = engine.bestXI(data.base.squad.map((s) => s.id), xpOf, posOf);
  const ranked = [...xi].sort((a, b) => xpOf(b) - xpOf(a));
  return { xi, bench, captain: ranked[0] ?? null, vice: ranked[1] ?? null };
}

/** Your FPL team as FPL has it, for the pitch to mark where the plan's GW A differs (ahead.js renderPitch → pitch.js
 *  fplMarks): the bundle's entry picks (api/entry.py xi / bench / captain / vice from the last deadline's picks), or GW
 *  gw's own once FPL has published them (entry.published, mobile.py _published: rare). Never lineupNow's best-XI
 *  stand-in: null then. */
function fplTeam(e, gw) {
  const t = e?.published?.gw === gw ? e.published : e;
  if (!Array.isArray(t?.xi) || t.xi.length !== 11) return null;
  const id = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
  return { xi: t.xi.map(Number), bench: (t.bench || []).map(Number), captain: id(t.captain), vice: id(t.vice) };
}

/** The planned GWs of meta: meta.horizon, else GW A and the three after. */
export const horizonOf = (m = {}) => (Array.isArray(m.horizon) ? m.horizon.map(Number) : range(Number(m.gw), Number(m.gw) + 3));
/** The GWs the longest plan reaches (meta.reach, else the planned ones). */
export const reachOf = (m = {}) => (Array.isArray(m.reach) ? m.reach.map(Number) : horizonOf(m));

/** Client-side views of a bundle (ctx.data); the bundle stays as sent. Rows: players with the live and prices blocks
 *  laid over (calls.shownPlayers). */
export function derive(b, receivedAt) {
  const m = b.meta || {};
  const cols = calls.shownPlayers(b);
  const fields = cols?.fields || [];
  const rows = (cols?.rows || []).map((r) => Object.fromEntries(fields.map((f, i) => [f, r[i]])));
  const byId = new Map(rows.map((r) => [Number(r.id), r]));
  const gw = Number(m.gw);
  const horizon = horizonOf(m), reach = reachOf(m);
  const xpGws = range(gw, Number(m.forecast_edge ?? reach[reach.length - 1]));
  const e = b.entry || {};
  const squad = (e.squad || []).map((s) => ({ ...byId.get(Number(s.id)), ...s, id: Number(s.id) }));
  const base = {
    season: m.season, entry_id: e.id, gw, squad, bank: e.bank, ft: e.ft,
    chips_available: e.chips_available || [], chips_used: e.chips_used || [], horizon: xpGws,
  };
  const data = { rows, byId, players: { horizon: xpGws, players: rows }, base, gw, horizon, reach, xpGws, noise: engine.noiseFloor(m, gw), receivedAt };
  data.lineup = squad.length ? lineupNow(e, data) : { xi: [], bench: [], captain: null, vice: null };
  data.fpl = fplTeam(e, gw);
  try { data.seeds = engine.decodeSeeds(b.seeds); } catch (err) { console.error('Forkcast: bad seed matrix', err); data.seeds = null; }
  return data;
}
