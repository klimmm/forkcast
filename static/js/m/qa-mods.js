// Every module tools/qa reads inside the page, by the URL it names it (tools/qa/lib/inpage.js qa.import): the page's own
// instances, whatever a release's bundle made of their files (tools/bundle/bundle.mjs builds this as one more entry, so
// it shares the page's chunks; an import of the file itself would be a second copy, its plan memory never attached;
// owner, 2026-11-12, "find why 429 and fix"). The app never loads it.
import * as ui from '../ui.js';
import * as engine from '../plan/engine.js';
import * as kits from '../plan/kits.js';
import * as pitch from '../plan/pitch.js';
import * as api from './api.js';
import * as calls from './calls.js';
import * as memory from './memory.js';
import * as ahead from './ahead.js';
import * as core from './ahead/core.js';
import * as pieces from './ahead/pieces.js';
import * as presolve from './ahead/presolve.js';
import * as choices from './ahead/plans/choices.js';
import * as forks from './ahead/plans/forks.js';
import * as about from './sheets/about.js';
import * as player from './sheets/player.js';
import * as strip from './sheets/strip.js';

export const MODS = {
  '/js/ui.js': ui,
  '/js/plan/engine.js': engine,
  '/js/plan/kits.js': kits,
  '/js/plan/pitch.js': pitch,
  '/js/m/api.js': api,
  '/js/m/calls.js': calls,
  '/js/m/memory.js': memory,
  '/js/m/ahead.js': ahead,
  '/js/m/ahead/core.js': core,
  '/js/m/ahead/pieces.js': pieces,
  '/js/m/ahead/presolve.js': presolve,
  '/js/m/ahead/plans/choices.js': choices,
  '/js/m/ahead/plans/forks.js': forks,
  '/js/m/sheets/about.js': about,
  '/js/m/sheets/player.js': player,
  '/js/m/sheets/strip.js': strip,
};
