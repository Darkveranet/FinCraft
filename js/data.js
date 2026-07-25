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
