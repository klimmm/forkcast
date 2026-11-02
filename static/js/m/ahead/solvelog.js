// The ?solves=1 panel (owner, 2026-11-03: "show me in interface what exactly is solved every time"): every fork solve
// the page asks, newest first, in words: its week, what for, what it asks beyond the plan as it stands, how long it took
// and how it ended (plans/forks.js SOLVE_LOG). Only with ?solves=1 in the address; a tap folds it.

import { SOLVE_LOG } from './plans/forks.js';

export function mountSolveLog(team = () => null, server = () => null) {
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
  const paint = () => {
    // (the team on screen's alone: another team's from earlier on this page never shown; owner, 2026-11-03). Its first
    // plan's solves too, the ones the server starts itself for a team it hasn't seen ("Planning GW10–13", its bake), in
    // the same list and counts as the page's own (owner, 2026-11-03, "solves showed in one place and all included in
    // running or in all"): each with its own start, those not started yet "to come"
    const e = team(), now = Date.now(), b = server();
    const first = (b?.items ?? []).map((i) => ({ at: Number(i.started) > 0 ? Number(i.started) * 1000 : b.at, gw: b.span, kind: 'first plan', what: i.what,
      state: i.state === 'done' ? 'solved' : i.state === 'error' ? 'error' : i.started ? 'solving' : 'to come', ms: Number(i.s) > 0 ? Number(i.s) * 1000 : null }));
    const more = b?.baking ? Math.max(0, (b.total ?? 0) - first.length) : 0;
    for (let k = 0; k < more; k++) first.push({ at: now, gw: b.span, kind: 'first plan', what: 'one more plan', state: 'to come', ms: null });
    const mine = [...SOLVE_LOG.filter((x) => !e || x.entry === e), ...first].sort((x, y) => y.at - x.at);
    const running = mine.filter((x) => x.state === 'solving').length, since = acted ? mine.filter((x) => x.at >= acted).length : mine.length;
    const ends = (x) => (x.state === 'solving' ? `solving, ${secs(now - x.at)}` : x.state === 'to come' ? 'to come'
      // (an answer back within a second is one the server had already: no solve ran)
      : x.state === 'solved' && x.ms != null && x.ms < 1000 ? 'already solved' : x.ms != null ? `${x.state} in ${secs(x.ms)}` : x.state);
    const head = `${running} running · ${since} since your last tap · ${mine.length} in all`;
    const line = (x) => `${typeof x.gw === 'number' ? `GW${x.gw}` : x.gw} · ${x.kind} · ${x.what} · ${ends(x)}`;
    said = [head, ...mine.map(line)];
    list.replaceChildren(
      Object.assign(document.createElement('b'), { textContent: head }),
      ...mine.slice(0, 30).map((x) => Object.assign(document.createElement('div'), { className: x.state === 'to come' ? 'solving' : x.state, textContent: line(x) })));
  };
  paint();
  setInterval(paint, 500);
}
