// Observations from the decision path, never a second solver or an inferred explanation.
import { h, fill } from '../../ui.js';
const decisions = new WeakMap(), views = new WeakMap(), listeners = new WeakMap();
export function recordDecision(P, gw, trace) {
  let weeks = decisions.get(P);
  if (!weeks) decisions.set(P, (weeks = new Map()));
  weeks.set(gw, trace);
}
export const decisionOf = (P, gw) => decisions.get(P)?.get(gw);
export const decisionReason = (t) => ({
  'pending': 'The main calculation has not returned a plan.',
  'solver-plan': 'Independent moves and minimal feasible groups from the week plan are compared with the best single transfer by projected gain.',
}[t?.reason] ?? 'No decision trace is available for this card.');
export function showDiagnostics(ctx, P, w, data) {
  views.set(ctx, { P, w, data, trace: decisionOf(P, w.gw) });
  listeners.get(ctx)?.();
}
export function mountDiagnostics(ctx) {
  let closed = false, panel, history;
  let historyVersion = 0;
  const loadHistory = async () => {
    const version = ++historyVersion, entry = ctx.store.get('entry');
    const list = history.querySelector('pre');
    list.textContent = 'Loading…';
    try {
      const result = await ctx.api.getSolves(entry);
      if (closed || historyVersion !== version || ctx.store.get('entry') !== entry) return;
      list.textContent = [...(result?.solves ?? [])].reverse().map((q) =>
        [`GW${q.gw ?? '?'} · ${q.kind} · ${q.state}`, (q.flags ?? []).join(' '), `#${q.key}`].join('\n')).join('\n\n') || 'No requests logged.';
    } catch { if (!closed && historyVersion === version) list.textContent = 'Request log unavailable.'; }
  };
  const paint = () => {
    const v = views.get(ctx);
    if (!panel || !v) return;
    const { P, w, data: d, trace: t } = v;
    const moves = (ms) => (ms ?? []).map((m) => `${P.L.name(m.out)} → ${P.L.name(m.in)}`).join('; ') || 'None';
    const section = (title, ...body) => h('section', null, h('h3', null, title), ...body);
    const row = (label, value) => h('p', null, h('b', null, `${label}: `), String(value ?? 'Not available'));
    const detail = (title, value) => h('details', null, h('summary', null, title), h('pre', null, JSON.stringify(value, null, 2)));
    const candidate = d.candidate, pl = candidate?.pl;
    const problem = (p) => p.code === 'budget' ? `GW${p.gw}: £${p.short.toFixed(2)}m short` : p.code === 'club' ? `GW${p.gw}: ${p.count} players from ${p.club}` : `GW${p.gw}: ${p.reason ?? p.code}`;
    const open = new Set([...panel.querySelectorAll('details[open]')].map((el) => el.querySelector('summary').textContent));
    fill(panel,
      h('header', null, h('button', { type: 'button', onClick: () => { panel.classList.toggle('expanded'); paint(); }, 'aria-expanded': String(panel.classList.contains('expanded')) }, h('h2', null, 'Suggestion logic'), h('span', null, `Dev mode · GW${w.gw}`))),
      section('Current card', row('State', d.status), row('Free transfers', w.ft), row('Bank', w.bank == null ? null : `£${w.bank.toFixed(2)}m`), row('Already planned this week', moves(w.moves)), row('Offered transfers', d.offerable ? moves(candidate?.e?.adds) : 'No offer on this card')),
      section('Why this many transfers?', h('p', null, decisionReason(t)), row('Original solver choice', t ? moves(t.original) : null),
        ...(t?.checks ?? []).map((x) => row(moves([x]), x.ok ? 'Fits alone' : x.problems.length ? x.problems.map(problem).join('; ') : 'Blocked by the buy-back check')),

        d.offerable ? row('Selected by gain', moves(candidate?.e?.adds)) : null),
      section('Solver requests for this choice', ...(t?.requests ?? []).map((q) => h('div', null,
        row(q.label, `${q.state} · ${moves(q.moves)}`), detail(`Request parameters · ${q.label}`, { key: q.key, values: q.values })))),
      history,
      section('Comparison', row('Candidate state', pl?.state), row('Gain used by the card', d.comparison?.gain == null ? null : d.comparison.gain.toFixed(3)), row('Horizon', d.comparison ? `${d.comparison.rounds} weeks` : null), row('Reference', d.comparison?.vs),
        h('p', null, 'The gain below is the calculation’s comparison, not the sum of the incoming players’ points.'),
        detail('Full comparison and reference', { comparison: pl?.cmp ?? null, reference: pl?.refRoad?.objective ?? null, objective: pl?.road?.objective ?? null, windows: pl?.road?.windows ?? null })),
      section('Decision inputs', detail('Active rules', P.pins), detail('Card conditions', { asked: d.asked, wanted: d.wanted, offerable: d.offerable, solving: d.solving, failed: d.failed, short: d.short, freeLeft: d.freeLeft }),
        detail('Evaluated candidates', d.candidates.map(({ moves: ms, pl: p }) => ({ moves: moves(ms), state: p?.state, gain: p?.cmp?.delta, request: p?.road?.values, comparison: p?.cmp, forced: p?.forced }))),
        detail('Decision trace', t ?? null)));
    for (const el of panel.querySelectorAll('details')) el.open = open.has(el.querySelector('summary').textContent);
  };
  listeners.set(ctx, paint);
  ctx.api.access().then((access) => {
    if (closed || !access?.local) return;
    panel = h('aside.ah-diagnostics', { 'aria-label': 'Suggestion logic' }, h('h2', null, 'Suggestion logic'), h('p', null, 'Waiting for the current plan…'));
    history = h('details', null, h('summary', null, 'Server request log'), h('button', { type: 'button', onClick: loadHistory }, 'Refresh log'), h('pre'));
    history.addEventListener('toggle', () => { if (history.open) loadHistory(); });
    document.body.append(panel);
    document.body.classList.add('has-diagnostics');
    paint();
  }).catch(() => {});
  return () => { closed = true; panel?.remove(); document.body.classList.remove('has-diagnostics'); listeners.delete(ctx); views.delete(ctx); };
}
