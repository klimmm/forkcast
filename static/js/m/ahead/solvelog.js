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
  const paint = () => {
    // (the team on screen's alone: another team's from earlier on this page never shown; owner, 2026-11-03)
    const e = team(), mine = SOLVE_LOG.filter((x) => !e || x.entry === e);
    const now = Date.now(), running = mine.filter((x) => x.state === 'solving').length;
    el.replaceChildren(
      Object.assign(document.createElement('b'), { textContent: `${running} running · ${acted ? mine.filter((x) => x.at >= acted).length : mine.length} since your last tap · ${mine.length} in all` }),
      // (the server's own planning of a team it hasn't seen, "Planning GW10–13": its bake, never a solve this page asks;
      // owner, 2026-11-03, "why it 'planning' but no solves")
      ...(() => {
        const b = server();
        if (!b) return [];
        const more = Math.max(0, (b.total ?? 0) - (b.items?.length ?? 0));
        return [Object.assign(document.createElement('div'), { className: 'solving', textContent: `Server: planning this team · ${b.done ?? 0} of ${b.total ?? '?'} plans · ${secs(now - b.at)}${more ? ` · ${more} more to come` : ''}` }),
          ...(b.items ?? []).map((i) => Object.assign(document.createElement('div'), { className: i.state === 'done' ? 'solved' : 'solving', textContent: `Server · ${i.what} · ${i.state === 'done' ? `solved${Number(i.s) > 0 ? ` in ${Number(i.s).toFixed(1)} s` : ''}` : i.state}` }))];
      })(),
      ...mine.slice(0, 20).map((x) => Object.assign(document.createElement('div'), {
        className: x.state,
        // (an answer back within a second is one the server had already: no solve ran)
        textContent: `GW${x.gw} · ${x.kind} · ${x.what} · ${x.state === 'solving' ? `solving, ${secs(now - x.at)}` : x.state === 'solved' && x.ms < 1000 ? 'already solved' : `${x.state} in ${secs(x.ms)}`}`,
      })));
  };
  paint();
  setInterval(paint, 500);
}
