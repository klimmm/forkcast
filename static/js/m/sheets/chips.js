// Chips in the viewed week: one shared no-chip baseline, one status per row, forecast gain on the right.
// Prepared comparisons survive reload; the first paint requests no solves.
// Sheet contract: static/js/m/app.js (open(ctx, {gw}) → sheet, ctx.openSheet('chips', …)).

import { h, fill, fmt, chipName, xpGain, reduceMotion } from '../../ui.js';
import { COPY, shownDelta } from '../calls.js';
import * as AH from '../ahead.js';

export function open(ctx, { gw } = {}) {
  const P0 = AH.plan(ctx);
  if (!P0) return null;
  const g = Number(gw);
  const act = (c) => AH.useChip(ctx, c, g);
  const offs = [];
  let tick = null;

  return ctx.sheets.open({
    title: COPY.chipsIn(g), detent: 'medium', fit: true, cls: 'cs', label: COPY.chipsIn(g),
    onClose: () => { clearInterval(tick); offs.forEach((f) => f()); AH.presolveTaps(ctx, null, { owner: offs }); },
    build(body, sheet) {
      const sub = h('p.rs-sub', null, COPY.chipsSub(P0.gws.filter((x) => x >= g)));
      const list = h('div.ah-list', { role: 'group', 'aria-label': COPY.chipsIn(g) });
      const buttons = new Map();
      const foot = h('p.m-foot', { hidden: true });
      // the sheet's checks told once over its rows in the wait line's look (AH.waitView): "Planning chips · 2 of 3 ·
      // 0:04", its bar by the count
      const wv = AH.waitView(), wbox = h('div.m-wait', { hidden: true }, wv.t, wv.bar), opened = Date.now(), seen = new Set();
      let step = { done: -1, at: opened, max: 0 };
      body.append(sub, wbox, list, foot);
      let drawn = null;  // [plan view, source, its rows' clocks (clocksOf)] last drawn with numbers

      const factOf = (r) => {
        if (r.state === 'on') return r.mine ? COPY.chipTakeOff : COPY.chipByForkcast;
        if (r.state === 'off') return COPY.chipPlayed(r.at, r.back);
        if (r.state === 'moved') return COPY.chipMoveHere(r.at);
        if (r.state === 'swap') return COPY.chipInstead(r.instead);
        if (r.best) return r.best.gw === g ? COPY.chipBestHere : COPY.chipBestAt(r.best.gw, r.best.delta);
        if (!r.final) return r.wait ? COPY.chipBestPlanning(r.wait.g) : null;
        return r.top && !r.top.clear ? COPY.chipNoBestName : COPY.chipNoGain;
      };
      /** the checks' clock after the fact (ahead.waitedText), set each second by the sheet's tick, never a whole draw;
       *  not read out (the row's label has the fact). */
      const t0Of = (r) => (r.state === 'free' && !r.best && !r.final ? r.wait?.t0 ?? null : null);
      /** The wait line over the rows while any row checks (its solve, or its weeks: t0Of), counted over the rows that
       *  checked since the sheet opened, on the earliest row's clock. */
      const paintWait = (rows) => {
        const waiting = rows.filter((r) => r.solving || t0Of(r) != null), now = Date.now();
        for (const r of waiting) seen.add(r.chip);
        wbox.hidden = !waiting.length;
        if (!waiting.length) { wv.key = null; return; }
        const n = seen.size, done = n - waiting.length, t0 = Math.min(...waiting.map((r) => t0Of(r) ?? opened));
        if (step.done !== done) step = { done, at: now, max: step.max };
        const p = step.max = Math.max(step.max, AH.stepShare(done, n, reduceMotion() ? 0 : now - step.at, done ? (step.at - t0) / done : 4000));
        AH.paintWaitView(wv, { key: 'chips', word: 'Checking', scope: 'chips', long: `GW${g}'s chips`, prog: `${done + 1} of ${n}`, so: (now - t0) / 1000, p });
      };
      /** Which rows run a clock from when: a check asked by a timer (ahead prepAgain) changes neither the plan view nor
       *  the source, and its row had no clock until that check landed. */
      const clocksOf = (rows) => rows.map(t0Of).join('|');
      /** Its number: the gap once known, forecast points blue with "xP" (ui.js xpGain; owner, 2026-10-22: no green or
       *  red), its sign its direction; "planning…" while its solve runs,
       *  else nothing. */
      const numberOf = (r) => (r.cmp ? [xpGain(shownDelta(r.cmp))]
        : r.solving ? h('small', null, COPY.waitShort) : null);
      const saidOf = (r, fact) => {
        const n = chipName(r.chip);
        const pts = r.cmp ? `: ${fmt.signed(shownDelta(r.cmp))} points over ${COPY.span(P0.gws.filter((x) => x >= g))} ${COPY.chipVs(COPY.chipNoChip)}` : '';
        if (r.state === 'on') return `${n} planned for GW${g}${r.mine ? '' : ' by Forkcast'}${pts}. Takes it off.`;
        if (r.state === 'off') return `${n}: ${fact.toLowerCase()}.`;
        if (r.state === 'moved') return `Move ${n} from GW${r.at} to GW${g}.`;
        if (r.state === 'swap') return `Play ${n} in GW${g} instead of ${chipName(r.instead)}${pts}.`;
        return `Play ${n} in GW${g}${pts}${fact ? `. ${fact}` : ''}.`;
      };

      function draw(numbers) {
        const P = AH.plan(ctx);
        if (!P) return;
        const src = numbers ? AH.chipPreps(ctx, P) : null;
        const rows = AH.chipStates(ctx, P, g, src);
        if (numbers) drawn = [P, src, clocksOf(rows)];
        const can = P.editable && !AH.inkAt(ctx, P, g);
        for (const r of rows) {
          const fact = factOf(r);
          const chip = r.chip, on = r.state === 'on';
          if (!buttons.has(chip)) {
            const mark = h('span.mk.rs-automk', { 'aria-hidden': 'true' }, chip.toUpperCase());
            const name = h('b'), note = h('span'), number = h('span.rt.m-num');
            const button = h('button.ah-lrow', { type: 'button', dataset: { chip },
              onClick: () => { if (act(chip)) sheet.close(); },
            }, mark, h('span.nm', null, name, note), number);
            buttons.set(chip, { button, mark, name, note, number });
            list.append(button);
          }
          // Update the existing row so a comparison landing cannot interrupt a tap.
          const { button, mark, name, note, number } = buttons.get(chip);
          button.disabled = !can || r.state === 'off';
          button.setAttribute('aria-label', saidOf(r, fact));
          if (on) button.setAttribute('aria-pressed', 'true');
          else button.removeAttribute('aria-pressed');
          mark.classList.toggle('on', on);
          name.textContent = on ? COPY.chipOn(chip) : chipName(chip);
          note.textContent = fact ?? '';
          note.hidden = !fact;
          fill(number, numberOf(r));
        }
        paintWait(rows);
        // its rows' taps solved ahead (AH.presolveTaps; owner, 2026-10-26): a chip taken off, and one to play whose
        // preparation isn't in (one that is lands at once: useChip)
        if (can && src) {
          const chips = rows.filter((r) => r.state !== 'off' && (r.state === 'on' || src.at(r.chip, g)?.state !== 'ready')).map((r) => r.chip);
          AH.presolveTaps(ctx, chips.map((c) => ({ kind: 'chip', gw: g, run: () => act(c) })), { gw: g, sig: chips.join(), owner: offs });
        }
        // the week gone live while the sheet was open: why once, the rows' facts kept (a plan you can't change has no
        // door: chipsDoor)
        const why = AH.inkAt(ctx, P, g) ? COPY.live(g) : null;
        fill(foot, why);
        foot.hidden = !why;
      }

      draw(false);
      AH.afterPaint(() => draw(true));
      offs.push(ctx.store.on('memory', () => queueMicrotask(() => draw(true))));
      // a choice's solve can also supply a cached chip preparation (ahead pairChanged)
      offs.push(ctx.store.on('aheadPair', () => queueMicrotask(() => draw(true))));
      // the preparations land in the background: redraw when the plan view, the chips' source or a row's clock changes;
      // else just update the wait line
      tick = setInterval(() => {
        const P = AH.plan(ctx);
        const src = P ? AH.chipPreps(ctx, P) : null;
        const rows = P ? AH.chipStates(ctx, P, g, src) : null;
        if (P && (!drawn || drawn[0] !== P || drawn[1] !== src || drawn[2] !== clocksOf(rows))) draw(true);
        else if (rows) paintWait(rows);
      }, 1000);
    },
  });
}
