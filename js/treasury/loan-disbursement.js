import { api } from '../api.js';
import { validateCashierCanPay } from './teller-balance.js';
import { recordTellerEvent, getOfficeTellerEvents } from './teller-events.js';
import { TreasuryReconciliationGapError } from './errors.js';

function isCashierActive(cashier, asOfDate) {
  if (!cashier) return false;
  const start = fineractDateToIso(cashier.startDate);
  const end = fineractDateToIso(cashier.endDate);
  if (start && asOfDate < start) return false;
  if (end && asOfDate > end) return false;
  return true;
}

function fineractDateToIso(d) {
  if (!d) return null;
  if (Array.isArray(d)) { const [y, m, day] = d; return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
  return String(d);
}

async function alreadyDisbursedThroughTeller(officeId, loanId) {
  const events = await getOfficeTellerEvents(officeId);
  return events.find(e => e.fineract_entity_type === 'LOAN' && e.fineract_entity_id === loanId &&
                           e.transaction_type === 'LOAN_DISBURSEMENT' && !e.reversed) || null;
}

export async function disburseLoanThroughCashier(payload) {
  const { officeId, loanId, tellerId, cashierId, amount, transactionDate } = payload;

  if (!tellerId || !cashierId) throw new Error('disburseLoanThroughCashier: tellerId and cashierId are both required');
  if (!(Number(amount) > 0)) throw new Error('disburseLoanThroughCashier: amount must be a positive number');

  const dup = await alreadyDisbursedThroughTeller(officeId, loanId);
  if (dup) throw new Error(`Loan ${loanId} has already been disbursed through the teller workflow (event ${dup.id}, ${dup.transaction_date}). Reverse that event first if this is a genuine correction.`);

  const cashier = await api.tellers.getCashier(tellerId, cashierId);
  if (!isCashierActive(cashier, transactionDate)) {
    throw new Error(`Cashier ${cashierId} on teller ${tellerId} is not active as of ${transactionDate}`);
  }

  await validateCashierCanPay(officeId, tellerId, cashierId, amount);

  const disburseResult = await api.loans.disburse(loanId, {
    actualDisbursementDate: transactionDate,
    transactionAmount: amount,
    paymentTypeId: payload.paymentTypeId,
    note: payload.note || '',
    locale: 'en',
    dateFormat: 'yyyy-MM-dd'
  });

  try {
    const event = await recordTellerEvent({
      officeId, tellerId, cashierId,
      transactionType: 'LOAN_DISBURSEMENT',
      amount,
      currencyCode: payload.currencyCode || 'USD',
      transactionDate,
      fineractEntityType: 'LOAN',
      fineractEntityId: loanId,
      fineractTransactionId: String(disburseResult?.resourceId ?? ''),
      narration: payload.note,
      createdBy: payload.performedBy
    });
    return { fineractResourceId: disburseResult?.resourceId, eventId: event.eventId };
  } catch (eventErr) {
    throw new TreasuryReconciliationGapError(
      `Loan ${loanId} disbursement of ${amount} succeeded in Fineract (resourceId=${disburseResult?.resourceId}) but recording the FinCraft teller event failed — the teller/cashier operational sub-ledger is now behind the real Fineract cashier balance for this transaction. Reconcile manually.`,
      { fineractResourceId: disburseResult?.resourceId, cause: eventErr }
    );
  }
}
