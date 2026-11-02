// Forkcast · the Chips sheet (owner, 2026-10-13). Opened by the week line's Chips… door for the viewed GW
// (ahead.chipsDoor): one row per chip (ahead.chipStates, CHIP_ROW's order, so no row moves as solves land) in the
// Replace sheet's row look: code, name over one fact (played here, by Forkcast, planned in another week, instead of the
// week's chip, its best week, played this half), its number on the right (ahead.chipNumber, numberOf) and its baseline
// in the fact (none before that solve is in, "checking…" while it or the week's roll plan runs). A tap plays the chip,
// moves it here, swaps it in or takes it off (ahead.useChip, toast with Undo; a refusal says why in its toast, the
// sheet stays open). The first draw has no numbers and asks for no solve; the next, after one paint, reads the
// preparations (ahead.chipSource) and redraws as they land.
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
      const foot = h('p.m-foot', { hidden: true });
      // the sheet's checks told once over its rows in the wait line's look (AH.waitView): "Checking chips · 2 of 3 ·
      // 0:04", its bar by the count
      const wv = AH.waitView(), wbox = h('div.m-wait', { hidden: true }, wv.t, wv.bar), opened = Date.now(), seen = new Set();
      let step = { done: -1, at: opened, max: 0 };
      body.append(sub, wbox, list, foot);
      let drawn = null;  // [plan view, source, its rows' clocks (clocksOf)] last drawn with numbers

      /** A row's baseline, each row naming its own (owner, 2026-10-22): a Wildcard's or Free Hit's its number's (`vs`:
       *  chipNumber), a swap row's the chip it replaces, else not playing it. */
      const vsOf = (r) => r.vs ?? (r.state === 'swap' ? COPY.chipVsIt : COPY.chipNoChip);
      /** A row's one fact (chipStates' state in words): while its weeks are checked, which and how many (chipWait);
       *  then its baseline where it has a number (a swap row's always, "vs it"). */
      const factOf = (r, P) => {
        const vs = r.cmp || (r.state === 'swap' && !r.vs) ? COPY.chipVs(vsOf(r)) : null;
        if (r.state === 'on') return COPY.chipFact(r.mine ? COPY.chipTakeOff : COPY.chipByForkcast, vs);
        if (r.state === 'off') return COPY.chipPlayed(r.at, r.back);
        if (r.state === 'moved') return COPY.chipMoveHere(r.at);
        if (r.state === 'swap') return COPY.chipFact(COPY.chipInstead(r.instead), vs);
        // (weeks of its half past the plan's are said with a clear best week too (owner, 2026-10-22); the best week's
        // number gets its baseline beside it where the row has none)
        if (r.best) {
          return COPY.chipFact(r.best.gw === g ? COPY.chipBestHere : COPY.chipBestAt(r.best.gw, r.best.delta, vs && r.best.vs === r.vs ? null : r.best.vs ?? (r.best.delta != null ? COPY.chipNoChip : null)),
            vs, r.after != null ? COPY.chipAfter(r.after) : null);
        }
        if (!r.final) return COPY.chipFact(r.wait ? COPY.chipBestChecking(r.wait.g, r.wait.i, r.wait.n, r.wait.part) : null, vs) || null;
        // (a best week clear of the next whose own gain is inside the noise gains nothing to act on: not "too close to
        // call", which says two weeks tie)
        // (a Wildcard's or Free Hit's against rolling names its weeks bare)
        // (against your plan in a week of yours: rolled either way, under the hold)
        return COPY.chipFact(r.top && !r.top.clear ? COPY.chipNoBest(r.top, r.after, (r.chip === 'fh' || r.chip === 'wc') && !!P?.mem?.hold) : COPY.chipNoGain, vs);
      };
      /** the checks' clock after the fact (ahead.waitedText), set each second by the sheet's tick, never a whole draw;
       *  not read out (the row's label has the fact). */
      const t0Of = (r) => (r.state === 'free' && !r.best && !r.final ? r.wait?.t0 ?? null : null);
      // (the clock is the sheet's wait line's now, one for the group)
      const clockOf = () => null;
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
       *  red), its sign its direction; a Wildcard's or Free Hit's the pitch's number; "checking…" while its solve runs,
       *  else nothing. */
      const numberOf = (r) => (r.cmp ? [xpGain(shownDelta(r.cmp))]
        : r.solving ? h('small', null, COPY.chipChecking) : null);
      const saidOf = (r, fact) => {
        const n = chipName(r.chip);
        const pts = r.cmp ? `: ${fmt.signed(shownDelta(r.cmp))} points over ${COPY.span(P0.gws.filter((x) => x >= g))} vs ${r.vs ?? (r.state === 'swap' ? chipName(r.instead) : COPY.chipNoChip)}` : '';
        if (r.state === 'on') return `${n} planned for GW${g}${r.mine ? '' : ' by Forkcast'}${pts}. Takes it off.`;
        if (r.state === 'off') return `${n}: ${fact.toLowerCase()}.`;
        if (r.state === 'moved') return `Move ${n} from GW${r.at} to GW${g}.`;
        if (r.state === 'swap') return `Play ${n} in GW${g} instead of ${chipName(r.instead)}${pts}.`;
        return `Play ${n} in GW${g}${pts}${fact ? `. ${fact}` : ''}.`;
      };

      function draw(numbers) {
        const P = AH.plan(ctx);
        if (!P) return;
        const src = numbers ? AH.chipSource(ctx, P) : null;
        const rows = AH.chipStates(ctx, P, g, src);
        if (numbers) drawn = [P, src, clocksOf(rows)];
        const can = P.editable && !AH.inkAt(ctx, P, g);
        const focused = globalThis.document?.activeElement?.closest?.('.cs [data-chip]')?.dataset.chip ?? null;
        fill(list, rows.map((r) => {
          const fact = factOf(r, P);
          return h('button.ah-lrow', {
            type: 'button', dataset: { chip: r.chip }, disabled: !can || r.state === 'off', 'aria-pressed': r.state === 'on' ? 'true' : null,
            'aria-label': saidOf(r, fact),
            onClick: () => { if (act(r.chip)) sheet.close(); },
          },
          h('span.mk.rs-automk', { class: { on: r.state === 'on' }, 'aria-hidden': 'true' }, r.chip.toUpperCase()),
          h('span.nm', null, h('b', null, r.state === 'on' ? COPY.chipOn(r.chip) : chipName(r.chip)), fact ? h('span', null, fact, clockOf(r)) : null),
          h('span.rt.m-num', null, numberOf(r)));
        }));
        if (focused) list.querySelector(`[data-chip="${focused}"]`)?.focus();
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
      // a choice's solve landed (ahead pairChanged): a Wildcard's or Free Hit's number is the pitch's (chipShown)
      offs.push(ctx.store.on('aheadPair', () => queueMicrotask(() => draw(true))));
      // the preparations land in the background: redraw when the plan view, the chips' source or a row's clock changes;
      // else the checks' clocks move on (clockOf)
      tick = setInterval(() => {
        const P = AH.plan(ctx);
        const src = P ? AH.chipSource(ctx, P) : null;
        const rows = P ? AH.chipStates(ctx, P, g, src) : null;
        if (P && (!drawn || drawn[0] !== P || drawn[1] !== src || drawn[2] !== clocksOf(rows))) draw(true);
        else if (rows) paintWait(rows);
      }, 1000);
    },
  });
}
