// Forkcast · About Forkcast (owner, 2026-10-14). One page, two homes: under Connect's form (landing(ctx, {start}):
// app.js showConnect) and as a sheet from Help and the You sheet (open). In order: the promise (COPY.whySub;
// COPY.whyHero over it in the sheet); a question a section, most asked first (COPY.whyApp), each answered by a
// recording of the real app (clip: static/m/clips, tools/qa/scenarios/about-clips.mjs); the seasons replayed (final
// rank, rank after every GW, caveats, then replays at 1-4 GWs: static/m/why.json, tools/why_bake.py; ranks inside a
// season, never points across seasons); against the scouts (this season live, GET /api/m/scouts re-baked after every
// finished GW, and the seasons replayed); how it works, the plain facts, Find my team, the legal line.
// Every number is why.json's or the API's; a part whose numbers can't be read is left out, never drawn empty.
// Sheet contract: static/js/m/app.js (open(ctx) → sheet, ctx.openSheet('about')).

import { h, fmt } from '../../ui.js';
import { COPY } from '../calls.js';
import { getScouts } from '../api.js';

/** A JSON of static/m, fetched once a page (null when unreadable; the next call asks again). */
const cached = (url) => {
  let p = null;
  return () => (p ??= fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    .then((x) => { if (!x) p = null; return x; }));
};
const record = cached('/m/why.json');
const sizes = cached('/m/clips/clips.json');

/** A recording of the real app (static/m/clips/<name>.webp, looping; last frame under reduced motion; box kept while
 *  loading: clips.json); Help's sections show them too (sheets/you.js). Fits one screen with its words (owner,
 *  2026-10-14): no taller than the scrolling page shows (Connect's gate, a sheet's body) less the rest of its section,
 *  narrowed with it; refitted when either changes size. */
/** Clips hidden (owner, 2026-10-21): Help's and About's sections show words alone; true puts them back once re-recorded
 *  from the app. */
export const SHOW_CLIPS = false;
export function clip(name, label) {
  if (!SHOW_CLIPS) return null;
  const img = h('img', { src: `/m/clips/${name}.webp`, alt: label, loading: 'lazy', decoding: 'async' });
  const fig = h('figure.wf-clip', null, h('picture', null,
    h('source', { srcset: `/m/clips/${name}.still.webp`, media: '(prefers-reduced-motion: reduce)' }), img));
  let wh = null;
  const fit = () => {
    const page = fig.closest('.m-gate, .m-sbody'), sec = fig.parentElement;
    if (!wh || !page || !sec || !fig.clientWidth) return;
    const rest = sec.getBoundingClientRect().height - img.getBoundingClientRect().height;
    const tall = page.clientHeight - rest - FIT_GAP;
    img.style.width = `${Math.floor(Math.min(fig.clientWidth, Math.max(0, tall) * wh[0] / wh[1]))}px`;
  };
  const watched = new Set();
  const ro = new ResizeObserver(() => {
    for (const el of [fig.closest('.m-gate, .m-sbody'), fig.parentElement]) if (el && !watched.has(el)) { watched.add(el); ro.observe(el); }
    fit();
  });
  ro.observe(fig);
  sizes().then((s) => { wh = s?.[name] ?? null; if (wh) { img.width = wh[0]; img.height = wh[1]; fit(); } });
  return fig;
}
/** px kept clear under a recording fitted to the screen, so its frame's edge shows. */
const FIT_GAP = 16;

/** The page's nodes inside its wrapper (`start`: Connect's Find my team, at its foot). */
export function landing(ctx, { start = null } = {}) {
  const rec = h('section.wf-sec.wf-rec', { hidden: true }), scouts = h('section.wf-sec.wf-scouts', { hidden: true });
  // how it did (seasons replayed, scouts) under How it works, a fold open until closed (owner, 2026-10-14); shown once
  // one of them has filled
  const proof = h('details.wf-more', { hidden: true, open: true }, h('summary', null, COPY.whyProof), rec, scouts);
  const page = h('div.wf', null, ...[
    start ? h('p.wf-lead', null, COPY.whySub) : h('header.wf-hero', null, h('h2', null, COPY.whyHero), h('p', null, COPY.whySub)),
    // how it works and the plain facts first, one list (owner, 2026-10-14)
    h('section.wf-sec.wf-facts', null, h('h3', null, COPY.whyHowHead), factList([...COPY.whyHow, ...COPY.whyFacts]), proof),
    ...COPY.whyApp.map(({ clip: c, ask, text }) => h('section.wf-sec.wf-q', { dataset: { clip: c } }, h('h3', null, ask), h('p', null, text), clip(c, ask))),
    start ? h('button.m-primary.lg.wf-start', { type: 'button', onClick: start }, COPY.whyStart) : null,
  ].filter(Boolean));  // DOM append writes a null as the text "null"
  const fill = (el, kids) => { el.replaceChildren(...kids.flat().filter(Boolean)); el.hidden = false; proof.hidden = false; };
  const replays = record();
  replays.then((r) => { if (r?.records?.length) fill(rec, recordSection(r.records, r.horizons ?? {})); });
  Promise.all([getScouts().catch(() => null), replays]).then(([live, r]) => {
    const parts = [live, ...(r?.scouts ?? [])].filter((s) => s?.rivals?.length);
    if (parts.length) fill(scouts, scoutsSection(parts, live));
  });
  return page;
}

export function open(ctx) {
  return ctx.sheets.open({
    title: COPY.whyTitle, detent: 'large',
    build(body) { body.append(landing(ctx), h('p.wf-legal', null, COPY.whyLegal)); },
  });
}

/** A list of facts, each [lead, rest], the lead in bold. */
const factList = (items) => h('ul', null, items.map(([lead, rest]) => h('li', null, h('b', null, lead), ' ', rest)));

/** The app's segmented control (m.css .m-seg) as a tab list over `labels`, the first chosen; onPick(i). */
function tabs(labels, name, onPick) {
  const el = h('div.m-seg.wf-tabs', { role: 'tablist', 'aria-label': name, style: `--n:${labels.length};--i:0` }, h('span.m-seg-thumb'),
    ...labels.map((l, i) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(i === 0), onClick: () => {
      el.style.setProperty('--i', String(i));
      el.querySelectorAll('[role=tab]').forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
      onPick(i);
    } }, l)));
  return el;
}

// ---------------------------------------------------------------- the seasons replayed

/** A season at a time (`recs`, newest first): final rank big, rank after every GW, caveats; under them the replays at
 *  1-4 GWs, a column a season, each best in bold. */
function recordSection(recs, hz) {
  const body = h('div.wf-recbody');
  const show = (i) => {
    const r = recs[i];
    body.replaceChildren(
      h('p.wf-big', null, h('b', null, COPY.whyPlace(r)), ' ', COPY.whyPlaceOf(r)),
      h('figure.wf-fig', null, h('div', { html: rankSvg(r.ranks), role: 'img', 'aria-label': `${COPY.whyRankAxis}: ${r.ranks.map((x, g) => (x ? `GW${g + 1} ${fmt.int(x)}` : null)).filter(Boolean).join(', ')}` }),
        h('figcaption', null, COPY.whyRankAxis)),
      h('p.wf-note', null, COPY.whyRecordNote(r)));
  };
  show(0);
  const seasons = Object.keys(hz).sort().reverse();
  const ws = [1, 2, 3, 4].filter((w) => seasons.length && seasons.every((s) => hz[s][String(w)] != null));
  const best = Object.fromEntries(seasons.map((s) => [s, Math.min(...ws.map((w) => hz[s][String(w)]))]));
  return [
    h('h3', null, COPY.whyRecordHead),
    h('p', null, COPY.whyRecordLead),
    recs.length > 1 ? tabs(recs.map((r) => COPY.seasonOf(r.season)), COPY.whyRecordHead, show) : null,
    body,
    ws.length ? [h('p.wf-hzlead', null, COPY.whyHorizon), h('table.wf-tbl', null,
      h('thead', null, h('tr', null, h('th', null, COPY.whyHorizonCols[0]), ...seasons.map((s) => h('th', null, COPY.seasonOf(Number(s)))))),
      h('tbody', null, ...ws.map((w) => h('tr', { class: { ours: w === 4 } }, h('td', null, COPY.whyHorizonRow(w)),
        ...seasons.map((s) => h('td', { class: { top: hz[s][String(w)] === best[s] } }, fmt.int(hz[s][String(w)])))))))] : null,
  ];
}

/** Overall rank after each GW (null: below the table), as FPL draws it: 1st on top, log scale with powers of ten
 *  marked, final rank labelled at the line's end. */
function rankSvg(ranks) {
  const W = 320, H = 170, L = 34, R = 40, T = 10, B = 18;
  const known = ranks.filter((x) => x > 0);
  const lo = 0, hi = Math.max(1, Math.ceil(Math.log10(Math.max(...known))));
  const x = (i) => L + (i / Math.max(1, ranks.length - 1)) * (W - L - R);
  const y = (v) => T + ((Math.log10(v) - lo) / (hi - lo)) * (H - T - B);
  const pts = ranks.map((v, i) => (v > 0 ? `${x(i).toFixed(1)},${y(v).toFixed(1)}` : null)).filter(Boolean).join(' ');
  const tick = (p) => fmt.compact(10 ** p, 0);
  const grid = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k)
    .map((p) => `<line x1="${L}" y1="${y(10 ** p).toFixed(1)}" x2="${W - R}" y2="${y(10 ** p).toFixed(1)}" stroke="var(--hair)"/>`
      + `<text x="${L - 6}" y="${(y(10 ** p) + 4).toFixed(1)}" class="a" text-anchor="end">${p === 0 ? '1' : tick(p)}</text>`).join('');
  const end = ranks.length - 1, last = ranks[end];
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" aria-hidden="true">${grid}`
    + `<polyline points="${pts}" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linejoin="round"/>`
    + (last > 0 ? `<circle cx="${x(end).toFixed(1)}" cy="${y(last).toFixed(1)}" r="3.5" fill="var(--acc)"/>`
      + `<text x="${(x(end) + 6).toFixed(1)}" y="${(y(last) + 4).toFixed(1)}" class="f">${fmt.ordinal(last)}</text>` : '')
    + `<text x="${L}" y="${H - 3}" class="a">GW1</text><text x="${(W - R).toFixed(1)}" y="${H - 3}" class="a" text-anchor="end">GW${ranks.length}</text></svg>`;
}

// ---------------------------------------------------------------- against the scouts

/** A table a season (`parts`: this season live first when in, then the seasons replayed), one shown by the switch: a
 *  row a scout, the GWs he posted, Forkcast's points and his over them, the higher in bold. */
function scoutsSection(parts, live) {
  const body = h('div.wf-scbody');
  const show = (i) => {
    const s = parts[i];
    body.replaceChildren(
      h('p', null, s === live ? COPY.whyScoutsLive(s) : COPY.whyScoutsReplay(s)),
      h('table.wf-tbl', null,
        h('thead', null, h('tr', null, ...COPY.whyScoutsCols.map((c) => h('th', null, c)))),
        h('tbody', null, ...s.rivals.map((r) => {
          const gws = Object.keys(r.pts).filter((g) => s.forkcast[g] != null);
          const us = gws.reduce((a, g) => a + s.forkcast[g], 0), them = gws.reduce((a, g) => a + r.pts[g], 0);
          return h('tr', null, h('td', null, r.name), h('td', null, String(gws.length)),
            h('td', { class: { hi: us > them } }, fmt.int(us)), h('td', { class: { hi: them > us } }, fmt.int(them)));
        }))));
  };
  show(0);
  return [
    h('h3', null, COPY.whyScoutsHead),
    h('p', null, COPY.whyScoutsLead),
    parts.length > 1 ? tabs(parts.map((s) => COPY.seasonOf(s.season)), COPY.whyScoutsHead, show) : null,
    body,
    h('p.wf-note', null, COPY.whyScoutsNote),
  ];
}
