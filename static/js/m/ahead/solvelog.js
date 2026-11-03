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
  // (the lines redrawn every half second in a list of their own, the button never: a tap spanning a redraw kept)
  const list = document.createElement('div');
  el.replaceChildren(copy, list);
  // (the server's list, asked again each second; its times on this device's clock)
  let got = { solves: [], skew: 0 }, asking = false;
  const ask = () => {
    const e = ctx.store.get('entry');
    if (asking || e == null) return;
    asking = true;
    ctx.api.getSolves(e).then((r) => { got = { solves: r?.solves ?? [], skew: Date.now() - Number(r?.now ?? 0) * 1000 }; }, () => {}).finally(() => { asking = false; paint(); });
  };
  const paint = () => {
    const now = Date.now(), mine = got.solves.map((x) => ({ ...x, at: Number(x.at) * 1000 + got.skew, ms: x.ms == null ? null : Number(x.ms) }));
    const live = (x) => x.state === 'running' || x.state === 'queued';
    const running = mine.filter(live).length, since = acted ? mine.filter((x) => x.at >= acted).length : mine.length;
    const ends = (x) => (x.state === 'running' ? `solving, ${secs(now - x.at)}` : x.state === 'queued' ? `waiting, ${secs(now - x.at)}`
      : x.state === 'already solved' ? x.state : x.state === 'done' ? `solved in ${secs(x.ms ?? 0)}` : x.ms != null ? `${x.state} in ${secs(x.ms)}` : x.state);
    const head = `${running} running · ${since} since your last tap · ${mine.length} in all`;
    const line = (x) => `${x.gw != null ? `GW${x.gw}` : 'GW?'} · ${x.kind} · ${x.what} · ${ends(x)}`;
    // (the copy names each solve's key too: one asked again under the same words told apart)
    said = [head, ...mine.map((x) => `${line(x)} · #${x.key}`)];
    list.replaceChildren(
      Object.assign(document.createElement('b'), { textContent: head }),
      ...mine.slice(0, 30).map((x) => Object.assign(document.createElement('div'), { className: live(x) ? 'solving' : x.state === 'done' ? 'solved' : x.state, textContent: line(x) })));
  };
  ask();
  setInterval(ask, 1000);
  setInterval(paint, 500);
}
