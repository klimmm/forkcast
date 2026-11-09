// Forkcast · a sub's list (the captain list's twin): player `id`'s legal swaps in GW g, a bench player's starters he
// can replace or a starter's bench players who can come on for him (subChoices: the drag's legal swaps, best first),
// each with its toast's words and number and the other's forecast; a tap makes the sub (sub: the drag's, its toast with
// Undo). GW A under way is FPL's: the rows off, and why (COPY.live). Opened from a bench label on the pitch and from a
// player's card's Sub (owner, 2026-11-09, "only add button on replace and sub").

import { h, append, xpNum } from '../../ui.js';
import { COPY } from '../calls.js';
import { plan, weekOf, inkAt, shirtOf, xpShown, sub, subChoices } from '../ahead.js';
import { subOrder } from '../../plan/pitch.js';

export function open(ctx, id, g) {
  const P = plan(ctx), w = P && weekOf(P, g);
  const pid = Number(id);
  if (!w || !(w.bench.includes(pid) || w.xi.includes(pid))) return null;
  const can = !inkAt(ctx, P, g);
  const title = w.bench.includes(pid) ? COPY.subIn(subOrder(w.bench, P.L.pos).get(pid), g) : COPY.subOut(P.L.name(pid), g);
  return ctx.sheets.open({
    title, detent: 'medium', fit: true, cls: 'cs', label: title,
    build(body, sheet) {
      append(body, h('div.ah-list', { role: 'group', 'aria-label': title }, subChoices(ctx, P, g, pid).map((c) => {
        const said = COPY.lineup(c.what, g, c.cmp.delta);
        return h('button.ah-lrow', {
          type: 'button', disabled: !can, 'aria-label': `${P.L.name(c.id)}, ${xpShown(ctx, c.id, g)} points, ${said}`,
          onClick: () => { if (sub(ctx, g, pid, c.id)) sheet.close(); },
        },
        h('span.mk', { 'aria-hidden': 'true' }, shirtOf(P.L, c.id, 32)),
        h('span.nm', null, h('b', null, P.L.name(c.id)), h('span', null, said)),
        h('span.rt.m-num', null, xpNum(xpShown(ctx, c.id, g))));
      })), can ? null : h('p.m-foot', null, COPY.live(g)));
    },
  });
}
