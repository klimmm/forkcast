// Planner locks and bans: --must-have / --exclude as the planner's values hold them, comma-joined tokens in
// player_data._parse_windowed's grammar "id|name[@gw|@a-b],...". The pickers and the lock / ban buttons
// write bare WhoScored ids; windows typed by hand are kept as they are. Shared by the Planner and Players.
// No side effects at import time.

/** Which planner value each mark lives in. */
export const DEST = { lock: 'must_have', ban: 'exclude' };

export const toks = (s) => String(s ?? '').split(',').map((t) => t.trim()).filter(Boolean);
const tokId = (t) => t.split('@')[0].trim();
/** The numeric ids in a token list (names are left out). */
export const idsOf = (s) => toks(s).map(tokId).filter((x) => /^\d+$/.test(x)).map(Number);
const joinToks = (list) => (list.length ? list.join(',') : undefined);
export const findTok = (list, id) => list.find((t) => tokId(t) === String(id));
const dropTok = (list, id) => list.filter((t) => tokId(t) !== String(id));

/** Lock (must-have) or ban (exclude) a player in {lock, ban} token lists; one excludes the other. */
function markTok(m, kind, id, on) {
  const other = kind === 'lock' ? 'ban' : 'lock';
  if (!on) { m[kind] = dropTok(m[kind], id); return; }
  if (!findTok(m[kind], id)) m[kind] = [...m[kind], String(id)];
  m[other] = dropTok(m[other], id);
}

/** `values` with player `id` locked / banned (on) or cleared (off); an emptied list becomes undefined. */
export function applyMark(values, kind, id, on) {
  const m = { lock: toks(values?.[DEST.lock]), ban: toks(values?.[DEST.ban]) };
  markTok(m, kind, id, on);
  return { ...values, [DEST.lock]: joinToks(m.lock), [DEST.ban]: joinToks(m.ban) };
}
