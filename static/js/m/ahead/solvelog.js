// The ?solves=1 panel (owner, 2026-11-03: "show me in interface what exactly is solved every time"): every fork solve
// the page asks, newest first, in words: its week, what for, what it asks beyond the plan as it stands, how long it took
// and how it ended (plans/forks.js SOLVE_LOG). Only with ?solves=1 in the address; a tap folds it.

import { SOLVE_LOG } from './plans/forks.js';

export function mountSolveLog(team = () => null) {
  if (!/[?&]solves=1\b/.test(location.search) || document.querySelector('.ah-solvelog')) return;
  const el = document.createElement('div');
  el.className = 'ah-solvelog';
  el.addEventListener('click', () => el.classList.toggle('folded'));
  document.body.append(el);
  const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
  const paint = () => {
    // (the team on screen's alone: another team's from earlier on this page never shown; owner, 2026-11-03)
    const e = team(), mine = SOLVE_LOG.filter((x) => !e || x.entry === e);
    const now = Date.now(), running = mine.filter((x) => x.state === 'solving').length;
    el.replaceChildren(
      Object.assign(document.createElement('b'), { textContent: `Solves for this team: ${running} running · ${mine.length} asked · under 1 s: the server already had it` }),
      ...mine.slice(0, 20).map((x) => Object.assign(document.createElement('div'), {
        className: x.state,
        textContent: `GW${x.gw} · ${x.kind} · ${x.what} · ${x.state === 'solving' ? `${secs(now - x.at)}…` : `${secs(x.ms)} ${x.state}`}`,
      })));
  };
  paint();
  setInterval(paint, 500);
}
