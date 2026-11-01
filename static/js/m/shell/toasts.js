// Forkcast's one place for every toast: over the header's row, or clear of a sheet's controls.

import * as ui from '../../ui.js';

/** What takes a tap: a toast's Undo never sits over one of these (placeToasts). */
const CONTROLS = 'button, a[href], input, select, textarea, summary, [role="button"], [role="slider"], [role="radio"], [role="tab"], [tabindex="0"]';
const PLACE_SETTLE_MS = 120;

/**
 * One place for every toast: the top of the screen, over the header's row (Ahead's team name), right end clear of the
 * avatar (m.css #toasts). That row holds nothing to tap but the avatar and the Settings gear, each clear of a toast;
 * an edit changes there only the GW line's total, which waits for the toast to go (ahead.js renderTotal). It never
 * moves for the page, only for a sheet coming or going. Taps pass through it (m.css: only its Undo takes one).
 *
 * While a sheet is up it goes where none of the sheet's controls can be: above the sheet when it fits, else in a dock
 * at the screen's bottom the sheet keeps clear (m.css --toast-dock; the scroll range it adds stays for the sheet's
 * life, so nothing moves as the dock comes or goes).
 *
 * Its Undo takes a tap only while armed (m.css .toast.armed): not before the toast has come in, and on a sheet not
 * while a control a tap would reach is under it (guard); on the page it always does (H1, 2026-10-09). A toast changed
 * in place (ui.toast's replaces: an edit's verdict over its pending toast) keeps its place, data-in and armed Undo.
 * sheets: the app's createSheets.
 */
let toastsPlaced = false;
export function placeToasts(sheets) {
  // once per page: boot runs again (connect retry, sign-out's Undo) and would add the listeners and observer again
  if (toastsPlaced) return;
  toastsPlaced = true;
  // a finger down on an armed Undo holds the region in place, armed, until the tap ends (click, cancel, or PRESS_MS
  // after lift): moving it first would land the click on what was under it
  let pressed = null;
  const PRESS_MS = 500;
  const release = () => { if (!pressed) return; delete pressed.dataset.held; pressed = null; redrawn(); };
  document.addEventListener('pointerdown', (e) => {
    const t = e.target.closest?.('#toasts .toast');
    if (t?.classList.contains('armed') && e.target.closest('button.btn')) { pressed = t; t.dataset.held = '1'; }
  }, true);
  document.addEventListener('pointerup', () => { if (pressed) setTimeout(release, PRESS_MS); }, true);
  for (const k of ['click', 'pointercancel']) document.addEventListener(k, () => { if (pressed) setTimeout(release, 0); }, true);
  // the page's controls (CONTROLS) as last queried: kept until the page changes (the MutationObserver below drops
  // them), so the per-frame guard never re-queries the document
  let ctrls = null;
  const controlsOf = (region) => (ctrls ??= [...document.querySelectorAll(CONTROLS)].filter((c) => !region.contains(c)));
  let docked = null;  // the sheet keeping its dock clear for the region
  const undock = () => { docked?.style.removeProperty('--toast-dock'); docked = null; };
  const DOCK_GAP = 8;  // px between the region and the sheet's body (or the sheet's top edge)
  /** Sheet up: the region goes above it if it fits, else docks at the screen's bottom with the body ending DOCK_GAP
   *  above (--toast-dock-room, the most ever taken, keeps the scroll range: m.css .m-sbody). */
  const placeOnSheet = (region, sheet) => {
    region.dataset.place = 'top';
    if (region.getBoundingClientRect().bottom + DOCK_GAP <= sheet.top) { undock(); return 'top'; }
    region.dataset.place = 'dock';
    const d = Math.ceil(sheet.bottom - region.getBoundingClientRect().top + DOCK_GAP);
    if (docked !== sheet.el) undock();
    docked = sheet.el;
    docked.style.setProperty('--toast-dock', `${d}px`);
    const room = parseFloat(docked.style.getPropertyValue('--toast-dock-room')) || 0;
    if (d > room) docked.style.setProperty('--toast-dock-room', `${d}px`);
    // the body now ends above the toast: its page keeps the tapped control in view (Ahead: m-dock)
    docked.dispatchEvent(new CustomEvent('m-dock'));
    return 'bottom';
  };
  // el: the toast just added (its entrance slides from its edge by its own class, so placing again never restarts it);
  // none for a toast already up
  const place = (region, el = null) => {
    if (pressed?.isConnected) return;  // placed again once the tap on it ends (release)
    const sheet = sheets.top();
    if (sheet) { el?.classList.toggle('up', placeOnSheet(region, sheet) === 'bottom'); return; }
    // the page: always the top, never by where you tapped or what is under it
    undock();
    region.dataset.place = 'top';
    el?.classList.remove('up');
  };
  /** Whether toast button b covers a control a tap there would reach: the boxes overlap and the page under the toast at
   *  the overlap's middle is that control (elementsFromPoint skips what takes no tap and the toast's own parts). */
  const blocks = (b, region, controls) => {
    const q = b.getBoundingClientRect();
    return controls.some((c) => {
      const x = ui.overlapOf(q, c.getBoundingClientRect());
      if (!x) return false;
      const under = document.elementsFromPoint((x.left + x.right) / 2, (x.top + x.bottom) / 2).find((e) => !region.contains(e));
      return !!under && c.contains(under);
    });
  };
  let raf = 0;
  /** Each toast's Undo is armed once it has come in (data-in): on the page whatever has scrolled under it (H1,
   *  2026-10-09), on a sheet while it blocks no control (else taps pass through and it is placed again once the page
   *  settles). Runs again next frame while a toast is up. */
  const guard = () => {
    const region = document.getElementById('toasts');
    const live = region ? [...region.querySelectorAll('.toast:not(.leaving)')].filter((t) => t.querySelector('button.btn')) : [];
    if (!live.length) return;
    let controls = null, stuck = false;
    const onSheet = !!sheets.top();
    for (const t of live) {
      if (t === pressed) continue;
      let ok = !!t.dataset.in && !onSheet;
      if (t.dataset.in && onSheet) {
        controls ??= controlsOf(region);
        ok = ![...t.querySelectorAll('button')].some((b) => b.getClientRects().length && blocks(b, region, controls));
        stuck ||= !ok;
      }
      if (t.classList.contains('armed') !== ok) t.classList.toggle('armed', ok);
      if (ok && !t.dataset.armedOnce) { t.dataset.armedOnce = '1'; t.dispatchEvent(new Event('toast-armed')); }
    }
    if (stuck) redrawn();
    raf ||= requestAnimationFrame(() => { raf = 0; guard(); });
  };
  /** A toast just added: placed before its first draw on the layout the edit that raised it re-drew (Ahead re-draws in
   *  a microtask after the tap), never the layout before (measuring it cost a forced layout and a scan of every
   *  control); its entrance slides from its edge ('up' class, set before any frame); Undo is armed once the entrance
   *  ends. */
  const added = (region, el) => {
    requestAnimationFrame(() => {
      if (!el.isConnected || el.classList.contains('leaving')) return;
      place(region, el);
      guard();
      Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(() => { if (el.isConnected) { el.dataset.in = '1'; guard(); } });
    });
  };
  let timer = 0;
  const again = () => { timer = 0; const r = document.getElementById('toasts'); if (r?.querySelector('.toast')) { place(r); guard(); } };
  // scroll or resize: once settled (each event restarts the wait, so a toast never moves mid-gesture)
  const settle = () => { clearTimeout(timer); timer = setTimeout(again, PLACE_SETTLE_MS); };
  // toast coming or going, or a re-draw under one (a plan landing moves rows): once per wait, not put off by the next
  // re-draw (the countdown re-draws every second)
  function redrawn() { if (!timer) timer = setTimeout(again, PLACE_SETTLE_MS); }
  ui.setToastPlace(added);
  // a script's scroll (scrollIntoView, scroll/scrollTo/scrollBy, scrollTop/Left) moves the page at once, its scroll
  // event a frame later: check the toasts right after it, as after a re-draw
  for (const o of [Element.prototype, window]) {
    for (const k of ['scrollIntoView', 'scroll', 'scrollTo', 'scrollBy']) {
      const f = o[k];
      if (typeof f === 'function') o[k] = function (...a) { const r = f.apply(this, a); guard(); return r; };
    }
  }
  for (const k of ['scrollTop', 'scrollLeft']) {
    const d = Object.getOwnPropertyDescriptor(Element.prototype, k);
    if (d?.set) Object.defineProperty(Element.prototype, k, { ...d, set(v) { d.set.call(this, v); guard(); } });
  }
  document.addEventListener('scroll', () => { guard(); settle(); }, true);
  window.addEventListener('resize', () => { guard(); settle(); });
  // a mutation callback runs before the next task (tap, timer), so a re-draw or a class or style that moves a row never
  // leaves an armed Undo over a control; the toasts' own changes are ignored
  new MutationObserver((records) => {
    const region = document.getElementById('toasts');
    const page = region ? records.filter((r) => r.type === 'childList' || !region.contains(r.target)) : records;
    if (page.length) ctrls = null;
    if (!region?.querySelector('.toast')) { undock(); return; }
    if (!page.length) return;
    guard();
    if (page.some((r) => r.type === 'childList')) redrawn();
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
  // a sheet opening or closing (createSheets: :root.m-sheeted) moves the region on or off the sheets
  new MutationObserver(() => { if (document.getElementById('toasts')?.querySelector('.toast')) { guard(); redrawn(); } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}
