// Forkcast's sheets (§4: never more than 2 deep, swipe down to dismiss): the stack, detents, drag.

import * as ui from '../../ui.js';
import { h } from '../../ui.js';

export const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ================================================================ sheets (§4: never more than 2 deep, swipe down to dismiss)

const SHEET_PX = { small: 320, medium: 470 };
const FIT_ROOM = 12;   // px under a fit sheet's content
const DISMISS_PX = 130;  // px below the smallest detent at which a drag's end (with ui.flick) closes a sheet

/** landed(to): a pop of sheets' history entries landed (the router's carry). */
export function createSheets(app, { landed = () => {} } = {}) {
  const stack = [];
  const sync = () => {
    app.classList.toggle('sheet-large', stack.some((s) => s.detent === 'large'));
    document.documentElement.classList.toggle('m-sheeted', stack.length > 0);  // toasts are placed on the sheet (placeToasts)
    stack.forEach((s, i) => s.el.classList.toggle('back', i < stack.length - 1));
    // while a sheet is up the page and the sheets under it take no tap, focus or reading; #toasts hangs off <body>, so
    // its Undo stays in reach
    const modal = stack.length > 0;
    // …and the screen stays inert while Connect is up (showGate), sheet or not
    const gated = document.documentElement.classList.contains('m-gated');
    for (const c of app.children) {
      const off = modal || (gated && c.matches('.m-screen'));
      if (!c.matches('.m-sheet, .m-scrim') && c.inert !== off) c.inert = off;
    }
    stack.forEach((s, i) => { const off = modal && i < stack.length - 1; if (s.el.inert !== off) s.el.inert = off; });
  };
  /** Its height at detent d (its own by default). */
  const heightOf = (sheet, d = sheet.detent) => {
    const H = sheet.el.offsetHeight;
    if (d === 'large') return H;
    const at = Math.min(H, d === 'small' ? SHEET_PX.small : Math.min(SHEET_PX.medium, Math.round(app.clientHeight * 0.58)));
    // fit: short content rests at its own height, never taller than the detent
    return sheet.fit ? Math.min(at, contentOf(sheet)) : at;
  };
  /** Content height: grabber to the last child's bottom, unscrolled, plus FIT_ROOM (the body's bottom padding is scroll
   *  room, not shown under a short body). */
  const contentOf = (sheet) => {
    const b = sheet.body;
    let bottom = b.getBoundingClientRect().top;
    for (const c of b.children) bottom = Math.max(bottom, c.getBoundingClientRect().bottom);
    return Math.ceil(bottom + b.scrollTop - sheet.el.getBoundingClientRect().top + FIT_ROOM);
  };
  const offset = (sheet, d = sheet.detent) => Math.max(0, sheet.el.offsetHeight - heightOf(sheet, d));
  /** Slide the sheet to its detent; --sheet-off (m.css .m-sbody) ends its body at the screen's bottom, so every control
   *  scrolls into view. */
  const place = (sheet) => {
    const off = offset(sheet);
    sheet.el.style.transform = `translateY(${off}px)`;
    sheet.el.style.setProperty('--sheet-off', `${off}px`);
    sync();
  };
  /** Its detents, smallest first. */
  const orderOf = (sheet) => ['small', 'medium', 'large'].filter((d) => sheet.detents.includes(d));
  const atTop = (sheet) => sheet.detent === orderOf(sheet).at(-1);

  // each sheet is a history entry of its own ({sheet: n}, n its depth; address unchanged): Back closes it (popstate).
  // The #/player sheet has its hash entry instead (routed). Any other close (✕, swipe, scrim, Escape, close
  // / closeAll) pops its entry, a whole close in one history.go; history writes meanwhile (sheet push, navigate) wait
  // for that pop (afterPop)
  let owed = 0, popping = 0, from = null, bare = false;  // history.go calls not landed yet
  const later = [];
  const entries = () => stack.filter((s) => s.entry).length;
  const flush = () => { if (!owed) return; const n = owed; owed = 0; popping++; from = location.hash; history.go(-n); };
  const afterPop = (fn) => { if (owed || popping) later.push(fn); else fn(); };
  const push = (sheet) => afterPop(() => { if (!stack.includes(sheet)) return; sheet.entry = true; history.pushState({ sheet: entries() }, ''); });
  if (history.state?.sheet) history.replaceState(null, '');  // a reload: no sheet is up
  addEventListener('popstate', () => {
    const ours = popping > 0, want = history.state?.sheet ?? 0;
    if (ours) popping--;
    let closed = false;
    // Back: the sheets above the entry it landed on close, as Escape closes them
    for (let s = stack.findLast((x) => x.entry); s && entries() > want; s = stack.findLast((x) => x.entry)) {
      if (!s.dismissible) { history.pushState({ sheet: entries() }, ''); break; }
      dismiss(s, { popped: true });
      closed = true;
    }
    // the entry landed on takes the sheets' address (GW picked meanwhile, signOut's); for Back, the screen's own
    if (ours || closed) landed(ours ? from : null);
    while (later.length && !owed && !popping) later.shift()();
  });

  function dismiss(sheet, { instant = false, keep = false, popped = false } = {}) {
    const i = stack.indexOf(sheet);
    if (i < 0) return;
    stack.splice(i, 1);
    // entry: Back already popped it; a replacing sheet keeps it (two-deep rule); else popped now
    if (sheet.entry && !keep && !popped && !owed++) queueMicrotask(flush);
    // Reduce Motion: fades in place, no slide
    if (ui.reduceMotion()) sheet.el.classList.add('m-fade');
    else sheet.el.style.transform = 'translateY(100%)';
    sheet.scrim.classList.remove('on');
    sync();
    setTimeout(() => { sheet.el.remove(); sheet.scrim.remove(); }, instant ? 0 : 450);
    // focus to the opener, or its replacement if redrawn (ui.focusKey), else the page's focus home (Ahead's week line);
    // under another sheet: its opener or replacement, else that sheet
    if (i === stack.length) {
      const under = stack[stack.length - 1];
      if (sheet.opener?.isConnected && !sheet.opener.closest('[inert]')) sheet.opener.focus?.({ preventScroll: true });
      else if (under) ui.refocus(under.el, sheet.key, under.el);
      else ui.refocus(app, sheet.key, $('[data-focus-home]', app));
    }
    sheet.onClose?.();
  }

  function setDetent(sheet, d) {
    if (!sheet.detents.includes(d) || d === sheet.detent) return place(sheet);
    sheet.detent = d;
    place(sheet);
    const grab = $('.m-grab span', sheet.el);
    grab?.classList.remove('m-bump');
    void grab?.offsetWidth;
    grab?.classList.add('m-bump');
  }

  function wireDrag(sheet) {
    const { el } = sheet;
    let y0 = null, base = 0, last = 0, fl = null;
    // while it drags the body runs to the sheet's bottom (below the screen), so dragging up shows content. Starts where
    // the sheet is now, caught mid-slide too (transition dropped: .dragging), never from its resting place; a closing
    // sheet isn't caught
    const start = (y, t) => {
      if (!stack.includes(sheet)) return;
      y0 = y; last = y;
      base = new DOMMatrix(getComputedStyle(el).transform).m42;
      fl = ui.flick().add(y, t);
      el.classList.add('dragging');
      el.style.transform = `translateY(${base}px)`;
      el.style.setProperty('--sheet-off', '0px');
    };
    // above its largest detent it moves a third as far as the finger; place() brings it back
    const move = (y, t) => {
      if (y0 == null) return;
      last = y;
      fl.add(y, t);
      const at = base + y - y0;
      el.style.transform = `translateY(${at < 0 ? at / 3 : at}px)`;
    };
    // release point carried by ui.flick (speed over the last ~100 ms, not the drag's average): DISMISS_PX below the
    // smallest detent's rest and below where it was caught (a tap on a sheet still sliding up never closes it) closes;
    // else the nearest detent
    const end = (y = last, t = null) => {
      if (y0 == null) return;
      if (t != null) fl.add(y, t);
      const to = base + fl.project(y) - y0;
      y0 = null;
      el.classList.remove('dragging');
      const order = orderOf(sheet);
      if (sheet.dismissible && to > Math.max(base, offset(sheet, order[0])) + DISMISS_PX) return dismiss(sheet);
      setDetent(sheet, order.reduce((a, d) => (Math.abs(offset(sheet, d) - to) < Math.abs(offset(sheet, a) - to) ? d : a)));
    };
    // grabber and header drag with a pointer (mouse or touch)
    const down = (e) => {
      if (e.target.closest('button, input, a, select, textarea')) return;
      start(e.clientY, e.timeStamp);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    };
    for (const t of [$('.m-grab', el), ...$$('.m-sh', el)]) {
      t.addEventListener('pointerdown', down);
      t.addEventListener('pointermove', (e) => move(e.clientY, e.timeStamp));
      t.addEventListener('pointerup', (e) => end(e.clientY, e.timeStamp));
      t.addEventListener('pointercancel', () => end());
    }
    // the body drags down only from its top; a swipe up below the largest detent expands before scrolling (as iOS
    // sheets); else it scrolls
    const body = sheet.body;
    let ty = null, tt = 0;
    body.addEventListener('touchstart', (e) => {
      ty = (body.scrollTop <= 0 || !atTop(sheet)) && !e.target.closest('[data-nodrag], input, textarea') ? e.touches[0].clientY : null;
      tt = e.timeStamp;
    }, { passive: true });
    body.addEventListener('touchmove', (e) => {
      if (ty == null) return;
      // a gesture inside owns the finger (Ahead's lifted move row): never a sheet drag
      if (e.defaultPrevented && y0 == null) { ty = null; return; }
      const y = e.touches[0].clientY;
      if (y0 == null) {
        if (y - ty > 6) { if (body.scrollTop > 0) { ty = null; return; } start(ty, tt); }
        else if (ty - y > 6) { if (atTop(sheet)) { ty = null; return; } start(ty, tt); }
        else return;
      }
      ui.holdTouch(e);
      move(y, e.timeStamp);
    }, { passive: false });
    body.addEventListener('touchend', (e) => { ty = null; end(e.changedTouches[0]?.clientY, e.timeStamp); });
    body.addEventListener('touchcancel', () => { ty = null; end(); });
  }

  function open({ title, sub, detent = 'medium', detents, build, onClose, label, cls, close = true, dismissible = true, fit = false } = {}) {
    // the replaced sheet gives it its history entry (a pop then a push would land the push first)
    const gone = stack.length >= 2 ? stack[stack.length - 1] : null;
    if (gone) dismiss(gone, { instant: true, keep: true });
    const routed = bare;
    bare = false;
    const z = 240 + stack.length * 20;
    const scrim = h('div.m-scrim', { style: { zIndex: z } });
    const body = h('div.m-sbody');
    // never aria-modal (the page under is inert instead: sync): the toasts' Undo stays in reach
    const el = h('div.m-sheet', {
      class: cls, role: 'dialog', 'aria-modal': 'false', tabindex: '-1',
      'aria-label': label || (typeof title === 'string' ? title : null), style: { zIndex: z + 10 },
    }, h('div.m-grab', { 'aria-hidden': 'true' }, h('span')), body);
    const sheet = {
      el, body, scrim, detent, dismissible, onClose, fit, entry: !!gone?.entry,
      detents: detents || (detent === 'large' ? ['large'] : [detent, 'large']),
      opener: document.activeElement, key: ui.focusKey(document.activeElement), refresh: null,
      close: () => dismiss(sheet),
      setDetent: (d) => setDetent(sheet, d),
    };
    if (title) {
      body.append(h('div.m-sh', null,
        h('div', null, h('h2', null, title), sub ? h('p.m-sub', null, sub) : null),
        close ? h('button.m-xbtn', { type: 'button', 'aria-label': 'Close', onClick: () => dismiss(sheet) }, '✕') : null));
    }
    app.append(scrim, el);
    stack.push(sheet);
    if (!sheet.entry && !routed) push(sheet);
    build?.(body, sheet);
    wireDrag(sheet);
    scrim.addEventListener('click', () => { if (sheet.dismissible) dismiss(sheet); });
    // Reduce Motion: placed at once, fades in (m.css: the transition is opacity alone)
    const still = ui.reduceMotion();
    if (still) el.classList.add('m-fade');
    void el.offsetHeight;  // commit the off-screen start so placing slides it up
    scrim.classList.add('on');
    place(sheet);
    if (still) requestAnimationFrame(() => { if (stack.includes(sheet)) el.classList.remove('m-fade'); });
    el.focus({ preventScroll: true });
    return sheet;
  }

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length && stack[stack.length - 1].dismissible) dismiss(stack[stack.length - 1]);
  });
  addEventListener('resize', () => stack.forEach(place));
  return {
    open,
    closeAll: () => [...stack].reverse().forEach((s) => dismiss(s)),
    depth: () => stack.length,
    afterPop,
    /** The next sheet opened is the #/player route's: its hash entry is its history entry (false: cancel). */
    routed: (on = true) => { bare = on; },
    /** The top sheet: {el, top, bottom}, its viewport edges once resting at its detent; bottom is where its body's room
     *  ends (screen bottom at any detent: place); null with no sheet. */
    top: () => {
      const s = stack[stack.length - 1];
      if (!s) return null;
      const y = app.getBoundingClientRect().top + s.el.offsetTop;
      return { el: s.el, top: y + offset(s), bottom: y + s.el.offsetHeight };
    },
  };
}
