/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · data.js  — INTENTIONAL PLACEHOLDER (currently unused)

   Not imported anywhere (verified: no `../data.js` / `./data.js` references into
   this root module; `js/pages/dashboard/data.js` is a separate file). Kept as the
   seam for a future OFFLINE / demo-data fallback: `withDemoFallback(call, key)`
   would return `D[key]` when `store.get('offline')` is set. Live data flows through
   `js/api.js`, so nothing depends on this today.

   If offline/demo support is abandoned, delete this file. Do NOT add empty demo
   data here expecting it to render — nothing consumes `D`.
   ──────────────────────────────────────────────────────────────────────────── */
import { store } from './store.js';

export const D = {
  offices: [],
  staff: [],
  clients: [],
  loans: [],
  savings: [],
  groups: [],
  loanProducts: [],
  checkerTasks: [],
  glAccounts: [],
  reports: [],
  configs: [],
  notifications: [],
  surveys: []
};

export async function withDemoFallback(call, demoKey) {
  if (store.get('offline')) return { offline: true, data: D[demoKey] || [] };
  try {
    const p = (typeof call === 'function') ? call() : call;
    const data = await p;
    return { offline: false, data };
  } catch (e) {
    console.warn('[api-error]', demoKey, e.message || e);
    return { offline: true, data: D[demoKey] || [], error: e };
  }
}
