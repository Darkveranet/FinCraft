import { api } from '../api.js';
import { getCashierEvents, getOfficeTellerEvents } from './teller-events.js';

export async function computeCashierExpectedBalance(officeId, tellerId, cashierId, dateRange) {
  const events = await getCashierEvents(officeId, cashierId, dateRange);
  let cashIn = 0, cashOut = 0;
  for (const e of events) {
    if (e.teller_id !== tellerId) continue;
    const amt = Number(e.amount) || 0;
    if (e.direction === 'CASH_IN') cashIn += amt;
    else if (e.direction === 'CASH_OUT') cashOut += amt;
  }
  return { expectedCash: cashIn - cashOut, cashIn, cashOut, eventCount: events.length };
}

export async function validateCashierCanPay(officeId, tellerId, cashierId, amount) {
  const balance = await computeCashierExpectedBalance(officeId, tellerId, cashierId);
  if (Number(amount) > balance.expectedCash) {
    throw new Error(`Insufficient teller cash. Available: ${balance.expectedCash}, Requested: ${amount}`);
  }
  return balance;
}

export async function compareCashierBalanceToFineract(officeId, tellerId, cashierId, params) {
  const [fincraft, fineractSummary] = await Promise.all([
    computeCashierExpectedBalance(officeId, tellerId, cashierId),
    api.tellers.cashierSummary(tellerId, cashierId, params).catch(() => null)
  ]);
  const fineractNetCash = Number(fineractSummary?.netCash);
  const hasFineractFigure = Number.isFinite(fineractNetCash);
  return {
    fincraftExpectedCash: fincraft.expectedCash,
    fineractNetCash: hasFineractFigure ? fineractNetCash : null,
    difference: hasFineractFigure ? fincraft.expectedCash - fineractNetCash : null,
    matches: hasFineractFigure ? Math.abs(fincraft.expectedCash - fineractNetCash) < 0.005 : null
  };
}

export async function getOfficeTellerBreakdown(officeId, tellerCashierList, dateRange) {
  const events = await getOfficeTellerEvents(officeId, dateRange);
  const byCashier = new Map();
  for (const e of events) {
    const key = e.cashier_id;
    const bucket = byCashier.get(key) || { tellerId: e.teller_id, cashierId: key, cashIn: 0, cashOut: 0 };
    const amt = Number(e.amount) || 0;
    if (e.direction === 'CASH_IN') bucket.cashIn += amt; else if (e.direction === 'CASH_OUT') bucket.cashOut += amt;
    byCashier.set(key, bucket);
  }

  for (const { tellerId, cashierId } of (tellerCashierList || [])) {
    if (!byCashier.has(cashierId)) byCashier.set(cashierId, { tellerId, cashierId, cashIn: 0, cashOut: 0 });
  }

  const perCashier = [...byCashier.values()].map(b => ({ ...b, expectedCash: b.cashIn - b.cashOut }));
  const officeTotal = perCashier.reduce((sum, b) => sum + b.expectedCash, 0);
  return { perCashier, officeTotal };
}
