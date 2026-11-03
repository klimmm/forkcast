// live.js createMemory: the solver's plan with none of your rules, asked like every other solve

import { planInputs } from '../calls.js';
import { solvedKey } from './drift.js';
import { planValues, solveKept } from './values.js';
import { ARCHIVE_VERSIONS, ROADS } from './live.js';

const AGAIN_MS = 5000;

export function modelPart(V) {
  /** The values and key (solvedKey) of the model's plan for the bundle on screen: planValues of no pin, on the entry's
   *  own data (its bank is no value of a solve) → {key, values} | null (no bundle with an entry). */
  let asked = { b: null, d: null, ask: null };  // modelAsk's, per bundle and derived data
  const modelAsk = () => { const { ctx } = V;
    const b = ctx.bundle, d = ctx.data;
    if (!b?.entry || !d) return null;
    if (asked.b !== b || asked.d !== d) {
      let ask = null;
      try {
        const values = planValues(planInputs(b, d), []);
        ask = { key: solvedKey(b.version ?? null, values), values };
      } catch { /* no plan inputs yet */ }
      asked = { b, d, ask };
    }
    return asked.ask;
  };
  /** The model's plan as this device keeps it (ROADS: the newest ARCHIVE_VERSIONS data versions, one road each), for
   *  `key` → Road | null: a warm start or a page off line draws it at once. */
  const keptModel = (key) => { const { S, local } = V;
    const a = S.entry ? local.json(ROADS(S.entry)) : null;
    return a?.versions?.find((x) => x.key === key)?.road ?? null;
  };
  const keepModel = (key, road) => { const { S, ctx, local } = V;
    const v = ctx.bundle?.version ?? null;
    const a = local.json(ROADS(S.entry)) || { versions: [] };
    local.set(ROADS(S.entry), JSON.stringify({ versions: [{ v, key, road }, ...(a.versions || []).filter((x) => x.v !== v && x.road)].slice(0, ARCHIVE_VERSIONS) }));
  };
  /** The model's road for data version `version` as this device kept it (rejudge's `before`: the best your plan was
   *  made against), else null. */
  const modelOn = (version) => { const { S, local } = V;
    const a = S.entry ? local.json(ROADS(S.entry)) : null;
    return a?.versions?.find((x) => x.v === version)?.road ?? null;
  };

  /**
   * The solver's plan with none of your rules (owner, 2026-11-03: "the first plan" asked by the page as every other
   * solve, never apart): what your rules' cost, the drift and the choices are measured against, where the noise and the
   * hit cap are read (calls.planInputs), the plan drawn while you have no rule and the plan does not hold. Asked once
   * per data version (solveKept, purpose 'plan': its own slot, so no other solve of this page supersedes it); landed:
   * kept on this device (keepModel), the memory's view re-made (onData's drift and sync). → {key, road, error, since
   * (ms: asked, while it solves)} for the bundle on screen
   */
  function model() { const { S, ctx } = V;
    const ask = modelAsk();
    if (!ask) return { key: null, road: null, error: null, since: null };
    if (S.model?.key !== ask.key) S.model = { key: ask.key, road: keptModel(ask.key), error: null, since: null, p: null };
    const m = S.model;
    // (a request that never reached the plan service, the page off line or the service restarting: asked again on a
    // read AGAIN_MS later)
    if (m.error?.code === 'unreachable' && Date.now() - m.error.at > AGAIN_MS) m.error = null;
    const conn = ctx.store.get('conn');
    if (!m.road && !m.p && !m.error && ctx.api?.solve && conn?.state !== 'offline' && !conn?.snapshot) {
      m.since = Date.now();
      m.p = solveKept(ctx.api, { entry: Number(S.entry), purpose: 'plan', values: ask.values }, undefined, { what: 'the solver\'s best · none of your rules' });
      m.p.then((r) => {
        if (S.model !== m) return;
        m.p = null;
        if (r.road) { m.road = r.road; keepModel(m.key, r.road); }
        else if (r.state === 'error') m.error = r.error ?? { code: 'solver' };
        else return;  // cancelled (sign-out, a new team): asked again by the next read
        V.landed();
      }, () => { if (S.model === m) { m.p = null; m.error = { code: 'unreachable', at: Date.now() }; V.landed(); } });
    }
    return { key: m.key, road: m.road, error: m.error, since: m.road ? null : m.since };
  }
  /** Ask the model's plan again after it failed (renderBaking's Try again). */
  function retryModel() { const { S } = V;
    if (S.model?.error) S.model = null;
    model();
  }

  return { model, retryModel, modelOn };
}
