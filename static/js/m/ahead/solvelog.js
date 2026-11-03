// The ?solves=1 panel (owner, 2026-11-03: "show me in interface what exactly is solved every time"): every solve of the
// team, the page's and the server's own alike (plans/forks.js SOLVE_LOG, logBake), newest first, in words: its week, what for, what it asks beyond the plan as it stands, how long it took
// and how it ended. Only with ?solves=1 in the address; a tap folds it.

import { SOLVE_LOG, logBake } from './plans/forks.js';

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
  // (a key's short tag: its string hashed, the same key the same tag)
  const tag = (k) => { let h = 5381; for (const ch of String(k)) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h.toString(36); };
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
  const paint = () => {
    // (the team on screen's alone: another team's from earlier on this page never shown; owner, 2026-11-03), the
    // server's own solves among them (logBake)
    logBake(ctx);
    const e = String(ctx.store.get('entry') ?? ''), now = Date.now();
    const mine = SOLVE_LOG.filter((x) => !e || x.entry === e).sort((x, y) => y.at - x.at);
    const running = mine.filter((x) => x.state === 'solving').length, since = acted ? mine.filter((x) => x.at >= acted).length : mine.length;
    const ends = (x) => (x.state === 'solving' ? `solving, ${secs(now - x.at)}` : x.state === 'to come' ? 'to come'
      // (an answer back within a second is one the server had already: no solve ran)
      : x.state === 'solved' && x.ms != null && x.ms < 1000 ? 'already solved' : x.ms != null ? `${x.state} in ${secs(x.ms)}` : x.state);
    const head = `${running} running · ${since} since your last tap · ${mine.length} in all`;
    const line = (x) => `${typeof x.gw === 'number' ? `GW${x.gw}` : x.gw} · ${x.kind} · ${x.what} · ${ends(x)}`;
    // (the copy names each solve's key and lane too: one asked again under the same words told apart)
    said = [head, ...mine.map((x) => `${line(x)} · lane ${x.lane}${x.key ? ` · #${tag(x.key)}` : ''}`)];
    list.replaceChildren(
      Object.assign(document.createElement('b'), { textContent: head }),
      ...mine.slice(0, 30).map((x) => Object.assign(document.createElement('div'), { className: x.state === 'to come' ? 'solving' : x.state, textContent: line(x) })));
  };
  paint();
  setInterval(paint, 500);
}
