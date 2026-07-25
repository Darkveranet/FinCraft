import { api } from '../api.js';
import { requireThresholds } from './thresholds.js';
import { getVaultBalance, getReserveBuffer } from './vault-control.js';
import { getOfficeTellerBreakdown } from './teller-balance.js';
import { getBorrowingsDashboard } from './borrowings.js';
import { EXPENSE_STATUS } from './expenses.js';
import { deriveLiquidityStatus } from './liquidity-status.js';

const EXPENSE_REQUESTS_TABLE = 'dt_expense_requests';

async function orgBalanceOrNull(glAccountId) {
  if (!glAccountId) return null;
  const acct = await api.glAccounts.getBalance(glAccountId);
  return Number(acct?.organizationRunningBalance) || 0;
}

async function sumPendingExpenses(officeId) {
  const rows = await api.treasury.queryRows(EXPENSE_REQUESTS_TABLE, officeId);
  const list = Array.isArray(rows) ? rows : [];
  return list
    .filter(r => r.status === EXPENSE_STATUS.PENDING || r.status === EXPENSE_STATUS.APPROVED)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
}

export async function getTreasuryDashboard(officeId, tellerCashierList) {
  const t = await requireThresholds(officeId);

  const [bankBalance, vaultBalance, reserveBuffer, cashAtTellersGlBalance, tellerBreakdown,
    borrowings, interestPayableBalance, pendingExpensesTotal] = await Promise.all([
    orgBalanceOrNull(t.bankGlAccountId),
    getVaultBalance(officeId),
    getReserveBuffer(officeId),
    orgBalanceOrNull(t.cashAtTellersGlAccountId),
    getOfficeTellerBreakdown(officeId, tellerCashierList),
    getBorrowingsDashboard(officeId),
    orgBalanceOrNull(t.interestPayableGlAccountId),
    sumPendingExpenses(officeId)
  ]);

  const availableVault = vaultBalance - reserveBuffer;
  const tellerOperationalTotal = tellerBreakdown.officeTotal;
  const tellerGlDifference = cashAtTellersGlBalance === null ? null : round2(tellerOperationalTotal - cashAtTellersGlBalance);

  return {
    officeId,
    bankBalance,
    vaultBalance,
    reserveBuffer,
    availableVault: round2(availableVault),
    liquidityStatus: deriveLiquidityStatus(availableVault, reserveBuffer),
    cashAtTellersGlBalance,
    tellerOperationalTotal: round2(tellerOperationalTotal),
    tellerGlDifference,
    tellerBreakdown: tellerBreakdown.perCashier,
    borrowingsOutstanding: borrowings.totalOutstandingPrincipal,
    borrowingsActiveCount: borrowings.activeCount,
    interestPayableBalance,
    pendingExpensesTotal: round2(pendingExpensesTotal),
    currencyCode: t.currencyCode
  };
}

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
