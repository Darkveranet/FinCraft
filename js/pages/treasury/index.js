import { settings } from './settings.js';
import { dashboard } from './dashboard.js';
import { tellerConsole } from './teller-console.js';
import { cashAllocation } from './cash-allocation.js';
import { loanDisbursement } from './loan-disbursement.js';
import { expenses } from './expenses.js';
import { borrowings } from './borrowings.js';
import { reconciliation } from './reconciliation.js';
import { ensureTreasuryDatatables } from '../../treasury/bootstrap.js';

export async function render(c, params = {}) {
  const view = params.view || 'settings';
  try {
    await ensureTreasuryDatatables();
  } catch (err) {
    console.warn('[treasury] self-heal ensureTreasuryDatatables failed:', err && err.message ? err.message : err);
  }
  const VIEWS = {
    settings, dashboard,
    'teller-console': tellerConsole,
    'cash-allocation': cashAllocation,
    'loan-disbursement': loanDisbursement,
    expenses, borrowings, reconciliation
  };
  const fn = VIEWS[view] || settings;
  await fn(c);
}
