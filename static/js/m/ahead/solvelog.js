// The ?solves=1 panel (owner, 2026-11-03: "show me in interface what exactly is solved every time"): every solve of the
// team, the page's and the server's own alike, as the server logs them where every solve is asked (GET /api/m/solves:
// api/mobile_solves.py _ensure_solve; owner, 2026-11-03, "each and every logged there in this one place"), newest
// first, in words: its week, what for, what it asks beyond the plan as it stands, how long it took and how it ended.
// Only with ?solves=1 in the address; a tap folds it.

export function mountSolveLog(ctx) {
  if (!/[?&]solves=1\b/.test(location.search) || document.querySelector('.ah-solvelog')) return;
  const el = document.createElement('div');
  el.className = 'ah-solvelog';
  el.addEventListener('click', () => el.classList.toggle('folded'));
  document.body.append(el);
  // (your last tap or key on the page, never one on the panel: what it asked since; owner, 2026-11-03, "show solves
  // since last user action")
  let acted = 0;
  for (const t of ['pointerdown', 'keydown']) document.addEventListener(t, (e) => { if (!el.contains(e.target)) acted = Date.now(); }, { capture: true, passive: true });
  const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
  // (a button copies the header and every line, not only the 30 shown, as plain text; owner, 2026-11-03, "add button to
  // copy logs")
  let said = [];
  const copy = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Copy' });
  // (first the copy inside the tap itself, then the clipboard's; a browser that allows neither, as the Claude app's
  // pane, gets the text shown selected in the panel, to copy by hand)
  let shown = null;
  copy.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const text = [`${location.href} · ${new Date().toISOString()}`, ...said].join('\n');
    const t = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
    t.addEventListener('click', (e) => e.stopPropagation());
    document.body.append(t); t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    t.remove();
    const flash = (w) => { copy.textContent = w; setTimeout(() => { copy.textContent = 'Copy'; }, 2000); };
    if (ok) return flash('Copied');
    const byHand = () => { shown?.remove(); shown = t; el.insertBefore(t, list); t.focus(); t.select(); flash('Selected'); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => flash('Copied'), byHand);
    else byHand();
  });
  // (Clear: the team's list emptied where it is kept, on the server, so a reload starts from it too; owner, 2026-11-03,
  // "add button clear next to copy", "why it increased to 15 after i cleared and reload")
  // (…and the team's solved plans with it, on the server (DELETE /api/m/solves: its roads and finished solves), then this
  // page reloaded, its own copies gone too: every solve the reload asks starts cold; owner, 2026-11-09, "fix it so it
  // actually clear cache when i click clear")
  let cleared = 0;
  const clear = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Clear' });
  clear.addEventListener('click', (ev) => {
    ev.stopPropagation(); cleared = Date.now(); acted = 0; shown?.remove(); shown = null; paint();
    const e = ctx.store.get('entry');
    if (e != null) ctx.api.clearSolves(e).then(() => location.reload(), () => {});
  });
  // (the lines redrawn every half second in a list of their own, the buttons never: a tap spanning a redraw kept)
  const list = document.createElement('div');
  el.replaceChildren(copy, clear, list);
  // (the server's list, asked again each second; its times on this device's clock)
  let got = { solves: [], skew: 0 }, asking = false;
  const ask = () => {
    const e = ctx.store.get('entry');
    if (asking || e == null) return;
    asking = true;
    ctx.api.getSolves(e).then((r) => { got = { solves: r?.solves ?? [], skew: Date.now() - Number(r?.now ?? 0) * 1000 }; }, () => {}).finally(() => { asking = false; paint(); });
  };
  const paint = () => {
    const now = Date.now(), asks = got.solves.map((x) => ({ ...x, at: Number(x.at) * 1000 + got.skew, ms: x.ms == null ? null : Number(x.ms) })).filter((x) => x.at >= cleared);
    const live = (x) => x.state === 'running' || x.state === 'queued';
    // (one line a solve, its key's: every asker of it named and how many asks, the one that ran it its state and time;
    // an answer the server already had, "cached", ran nothing; owner, 2026-11-03, "why these are different solves": the
    // roll and your plan one solve, the same refusals again after a reload)
    const by = new Map();
    for (const x of asks) {
      const g = by.get(x.key) ?? { ...x, kinds: [], n: 0 };
      if (!by.has(x.key)) by.set(x.key, g);
      g.n++;
      // (asked by this browser: a key another page asked first and this one too is ours)
      g.mine ||= x.mine !== false;
      if (x.mine !== false && x.state !== 'already solved') g.ownAt = Math.min(g.ownAt ?? Infinity, x.at);
      if (!g.kinds.includes(x.kind)) g.kinds.push(x.kind);
      if (x.state !== 'already solved' && (g.state === 'already solved' || x.at < g.at)) Object.assign(g, { at: x.at, state: x.state, ms: x.ms, what: x.what, gw: x.gw });
    }
    const mine = [...by.values()].sort((x, y) => y.at - x.at), ran = (xs) => xs.filter((x) => x.state !== 'already solved');
    // (since your tap: the solves this browser ran, each once, from its own first ask; another page's or device's on the same
    // team are listed, marked, never counted against your tap; QA trace f, 2026-11-08: three pages on one team read 15)
    const running = mine.filter(live).length, sinceTap = mine.filter((x) => x.ownAt != null && (!acted || x.ownAt >= acted)).length;
    const ends = (x) => (x.state === 'running' ? `solving, ${secs(now - x.at)}` : x.state === 'queued' ? `waiting, ${secs(now - x.at)}`
      : x.state === 'already solved' ? 'cached' : x.state === 'done' ? `solved in ${secs(x.ms ?? 0)}` : x.ms != null ? `${x.state} in ${secs(x.ms)}` : x.state);
    const head = `${running} running · ${sinceTap} since tap · ${ran(mine).length} solved · ${mine.length - ran(mine).length} cached · ${asks.length} asks`;
    // (each line starts "•", a wrapped one indented under it: where a line starts is seen at once; owner, 2026-11-03)
    const line = (x) => `• ${x.gw != null ? `GW${x.gw}` : 'GW?'} · ${x.kinds.join(' + ')} · ${x.what} · ${ends(x)}${x.n > 1 ? ` · asked ${x.n}×` : ''}${x.mine ? '' : ' · another page'}`;
    // (the copy names each solve's key too)
    said = [head, ...mine.map((x) => `${line(x)} · #${x.key}`)];
    list.replaceChildren(
      Object.assign(document.createElement('b'), { textContent: head }),
      ...mine.slice(0, 30).map((x) => Object.assign(document.createElement('div'), { className: live(x) ? 'solving' : x.state === 'done' ? 'solved' : x.state, textContent: line(x) })));
  };
  ask();
  setInterval(ask, 1000);
  setInterval(paint, 500);
}
