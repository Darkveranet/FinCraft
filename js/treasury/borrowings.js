import { api } from '../api.js';
import { requireThresholds } from './thresholds.js';
import { generateBorrowingSchedule } from './borrowing-schedule.js';
import { TreasuryReconciliationGapError } from './errors.js';

const BORROWINGS_TABLE = 'dt_office_borrowings';
const SCHEDULE_TABLE = 'dt_office_borrowing_schedule';
const TXNS_TABLE = 'dt_office_borrowing_txns';

const BORROWING_STATUS = Object.freeze({ PENDING: 'PENDING', ACTIVE: 'ACTIVE', CLOSED: 'CLOSED' });
const SCHEDULE_STATUS = Object.freeze({ SCHEDULED: 'SCHEDULED', PARTIALLY_PAID: 'PARTIALLY_PAID', PAID: 'PAID' });

function today() { return new Date().toISOString().slice(0, 10); }
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

async function fundingGlAccountId(officeId, fundingSource) {
  const t = await requireThresholds(officeId);
  if (fundingSource === 'VAULT') return t.vaultGlAccountId;
  return t.bankGlAccountId;
}

async function getBorrowing(officeId, borrowingId) {
  const row = await api.treasury.getRow(BORROWINGS_TABLE, officeId, borrowingId);
  if (!row) throw new Error(`Borrowing ${borrowingId} not found for office ${officeId}`);
  return row;
}

async function getScheduleRow(officeId, scheduleId) {
  const row = await api.treasury.getRow(SCHEDULE_TABLE, officeId, scheduleId);
  if (!row) throw new Error(`Borrowing schedule row ${scheduleId} not found for office ${officeId}`);
  return row;
}

function deriveScheduleStatus(row) {
  const principalPaid = Number(row.principal_paid) || 0, interestPaid = Number(row.interest_paid) || 0;
  const principalDue = Number(row.principal_due) || 0, interestDue = Number(row.interest_due) || 0;
  const fullyPaid = principalPaid >= principalDue - 0.01 && interestPaid >= interestDue - 0.01;
  const anyPaid = principalPaid > 0.01 || interestPaid > 0.01;
  return fullyPaid ? SCHEDULE_STATUS.PAID : anyPaid ? SCHEDULE_STATUS.PARTIALLY_PAID : SCHEDULE_STATUS.SCHEDULED;
}

export async function createBorrowing(payload) {
  const required = ['officeId', 'lenderName', 'principalAmount', 'interestRate', 'interestMethod', 'startDate', 'tenorMonths', 'repaymentFrequency'];
  const missing = required.filter(f => payload[f] === undefined || payload[f] === null || payload[f] === '');
  if (missing.length) throw new Error(`createBorrowing: missing required field(s): ${missing.join(', ')}`);

  const schedule = generateBorrowingSchedule(payload);

  const borrowingRow = {
    lender_name: payload.lenderName,
    lender_type: payload.lenderType ?? null,
    principal_amount: Number(payload.principalAmount),
    outstanding_principal: Number(payload.principalAmount),
    interest_rate: Number(payload.interestRate),
    interest_method: payload.interestMethod,
    start_date: payload.startDate,
    tenor_months: payload.tenorMonths,
    repayment_frequency: payload.repaymentFrequency,
    borrowings_liability_gl_account_id: payload.borrowingsLiabilityGlAccountId ?? null,
    status: BORROWING_STATUS.PENDING,
    fineract_je_transaction_id: null,
    locale: 'en', dateFormat: 'yyyy-MM-dd'
  };
  const borrowingResult = await api.treasury.createRow(BORROWINGS_TABLE, payload.officeId, borrowingRow);
  const borrowingId = borrowingResult?.resourceId;

  const createdSchedule = [];
  for (const installment of schedule) {
    const scheduleRow = {
      borrowing_row_id: borrowingId,
      installment_no: installment.installmentNo,
      due_date: installment.dueDate,
      principal_due: installment.principalDue,
      interest_due: installment.interestDue,
      principal_paid: 0, interest_paid: 0,
      status: SCHEDULE_STATUS.SCHEDULED,
      locale: 'en', dateFormat: 'yyyy-MM-dd'
    };
    const r = await api.treasury.createRow(SCHEDULE_TABLE, payload.officeId, scheduleRow);
    createdSchedule.push({ scheduleId: r?.resourceId, ...installment });
  }

  return { officeId: payload.officeId, borrowingId, schedule: createdSchedule };
}

export async function postBorrowingDrawdown(officeId, borrowingId, { transactionDate = today(), fundingSource = 'BANK' } = {}) {
  const borrowing = await getBorrowing(officeId, borrowingId);
  if (borrowing.status !== BORROWING_STATUS.PENDING) {
    throw new Error(`Cannot draw down borrowing ${borrowingId}: status is ${borrowing.status}, expected ${BORROWING_STATUS.PENDING}`);
  }
  const t = await requireThresholds(officeId);
  const fundingGlId = await fundingGlAccountId(officeId, fundingSource);
  const liabilityGlId = borrowing.borrowings_liability_gl_account_id ?? t.borrowingsLiabilityGlAccountId;
  if (!liabilityGlId) throw new Error(`postBorrowingDrawdown: no borrowings liability GL account configured for office ${officeId} or borrowing ${borrowingId}`);

  const je = await api.journalEntries.create({
    officeId, transactionDate, currencyCode: t.currencyCode,
    debits: [{ glAccountId: fundingGlId, amount: borrowing.principal_amount }],
    credits: [{ glAccountId: liabilityGlId, amount: borrowing.principal_amount, comments: `Drawdown: ${borrowing.lender_name}` }],
    locale: 'en', dateFormat: 'yyyy-MM-dd'
  });

  try {
    await api.treasury.createRow(TXNS_TABLE, officeId, {
      borrowing_row_id: borrowingId, schedule_row_id: null, txn_type: 'DRAWDOWN',
      amount: borrowing.principal_amount, txn_date: transactionDate,
      fineract_je_transaction_id: String(je?.transactionId ?? ''), locale: 'en', dateFormat: 'yyyy-MM-dd'
    });
    await api.treasury.updateRow(BORROWINGS_TABLE, officeId, borrowingId, {
      status: BORROWING_STATUS.ACTIVE, fineract_je_transaction_id: String(je?.transactionId ?? ''),
      locale: 'en', dateFormat: 'yyyy-MM-dd'
    });
    return { officeId, borrowingId, status: BORROWING_STATUS.ACTIVE, fineractTransactionId: je?.transactionId };
  } catch (afterJeErr) {
    throw new TreasuryReconciliationGapError(
      `Borrowing ${borrowingId} drawdown of ${borrowing.principal_amount} posted a journal entry in Fineract (transactionId=${je?.transactionId}) but recording it in FinCraft afterwards failed. Reconcile manually.`,
      { fineractTransactionId: je?.transactionId, cause: afterJeErr }
    );
  }
}

export async function accrueInterest(officeId, borrowingId, scheduleId, { transactionDate = today() } = {}) {
  const [borrowing, schedule, t, existingTxns] = await Promise.all([
    getBorrowing(officeId, borrowingId),
    getScheduleRow(officeId, scheduleId),
    requireThresholds(officeId),
    api.treasury.queryRows(TXNS_TABLE, officeId)
  ]);
  if (schedule.borrowing_row_id !== borrowingId) throw new Error(`Schedule ${scheduleId} does not belong to borrowing ${borrowingId}`);
  const alreadyAccrued = (existingTxns || []).some(x => x.schedule_row_id === scheduleId && x.txn_type === 'INTEREST_ACCRUAL');
  if (alreadyAccrued) throw new Error(`Interest for schedule installment ${scheduleId} has already been accrued`);
  if (!t.interestExpenseGlAccountId || !t.interestPayableGlAccountId) {
    throw new Error(`accrueInterest: interest expense/payable GL accounts are not configured for office ${officeId}`);
  }

  const je = await api.journalEntries.create({
    officeId, transactionDate, currencyCode: t.currencyCode,
    debits: [{ glAccountId: t.interestExpenseGlAccountId, amount: schedule.interest_due }],
    credits: [{ glAccountId: t.interestPayableGlAccountId, amount: schedule.interest_due, comments: `Interest accrual: ${borrowing.lender_name} installment ${schedule.installment_no}` }],
    locale: 'en', dateFormat: 'yyyy-MM-dd'
  });

  try {
    await api.treasury.createRow(TXNS_TABLE, officeId, {
      borrowing_row_id: borrowingId, schedule_row_id: scheduleId, txn_type: 'INTEREST_ACCRUAL',
      amount: schedule.interest_due, txn_date: transactionDate,
      fineract_je_transaction_id: String(je?.transactionId ?? ''), locale: 'en', dateFormat: 'yyyy-MM-dd'
    });
    return { officeId, borrowingId, scheduleId, fineractTransactionId: je?.transactionId };
  } catch (afterJeErr) {
    throw new TreasuryReconciliationGapError(
      `Interest accrual of ${schedule.interest_due} for borrowing ${borrowingId} installment ${schedule.installment_no} posted in Fineract (transactionId=${je?.transactionId}) but recording it in FinCraft afterwards failed. Reconcile manually.`,
      { fineractTransactionId: je?.transactionId, cause: afterJeErr }
    );
  }
}

export async function payBorrowingInterest(officeId, borrowingId, scheduleId, { amount, transactionDate = today(), fundingSource = 'BANK' } = {}) {
  const [borrowing, schedule, t] = await Promise.all([getBorrowing(officeId, borrowingId), getScheduleRow(officeId, scheduleId), requireThresholds(officeId)]);
  if (schedule.borrowing_row_id !== borrowingId) throw new Error(`Schedule ${scheduleId} does not belong to borrowing ${borrowingId}`);

  const remaining = round2((Number(schedule.interest_due) || 0) - (Number(schedule.interest_paid) || 0));
  const payAmount = amount === undefined ? remaining : Number(amount);
  if (payAmount <= 0) throw new Error(`payBorrowingInterest: nothing remaining to pay for installment ${schedule.installment_no} (remaining: ${remaining})`);
  if (payAmount > remaining + 0.01) throw new Error(`payBorrowingInterest: amount ${payAmount} exceeds remaining interest due ${remaining} for installment ${schedule.installment_no}`);
  if (!t.interestPayableGlAccountId) throw new Error(`payBorrowingInterest: interest payable GL account is not configured for office ${officeId}`);

  const fundingGlId = await fundingGlAccountId(officeId, fundingSource);
  const je = await api.journalEntries.create({
    officeId, transactionDate, currencyCode: t.currencyCode,
    debits: [{ glAccountId: t.interestPayableGlAccountId, amount: payAmount }],
    credits: [{ glAccountId: fundingGlId, amount: payAmount, comments: `Interest payment: ${borrowing.lender_name} installment ${schedule.installment_no}` }],
    locale: 'en', dateFormat: 'yyyy-MM-dd'
  });

  try {
    await api.treasury.createRow(TXNS_TABLE, officeId, {
      borrowing_row_id: borrowingId, schedule_row_id: scheduleId, txn_type: 'INTEREST_PAYMENT',
      amount: payAmount, txn_date: transactionDate,
      fineract_je_transaction_id: String(je?.transactionId ?? ''), locale: 'en', dateFormat: 'yyyy-MM-dd'
    });
    const updatedInterestPaid = round2((Number(schedule.interest_paid) || 0) + payAmount);
    const patch = { interest_paid: updatedInterestPaid, locale: 'en', dateFormat: 'yyyy-MM-dd' };
    patch.status = deriveScheduleStatus({ ...schedule, interest_paid: updatedInterestPaid });
    await api.treasury.updateRow(SCHEDULE_TABLE, officeId, scheduleId, patch);
    return { officeId, borrowingId, scheduleId, amountPaid: payAmount, fineractTransactionId: je?.transactionId };
  } catch (afterJeErr) {
    throw new TreasuryReconciliationGapError(
      `Interest payment of ${payAmount} for borrowing ${borrowingId} installment ${schedule.installment_no} posted in Fineract (transactionId=${je?.transactionId}) but recording it in FinCraft afterwards failed. Reconcile manually.`,
      { fineractTransactionId: je?.transactionId, cause: afterJeErr }
    );
  }
}

export async function repayBorrowingPrincipal(officeId, borrowingId, scheduleId, { amount, transactionDate = today(), fundingSource = 'BANK' } = {}) {
  const [borrowing, schedule, t] = await Promise.all([getBorrowing(officeId, borrowingId), getScheduleRow(officeId, scheduleId), requireThresholds(officeId)]);
  if (schedule.borrowing_row_id !== borrowingId) throw new Error(`Schedule ${scheduleId} does not belong to borrowing ${borrowingId}`);
  if (borrowing.status !== BORROWING_STATUS.ACTIVE) throw new Error(`Cannot repay principal on borrowing ${borrowingId}: status is ${borrowing.status}, expected ${BORROWING_STATUS.ACTIVE}`);

  const remaining = round2((Number(schedule.principal_due) || 0) - (Number(schedule.principal_paid) || 0));
  const payAmount = amount === undefined ? remaining : Number(amount);
  if (payAmount <= 0) throw new Error(`repayBorrowingPrincipal: nothing remaining to pay for installment ${schedule.installment_no} (remaining: ${remaining})`);
  if (payAmount > remaining + 0.01) throw new Error(`repayBorrowingPrincipal: amount ${payAmount} exceeds remaining principal due ${remaining} for installment ${schedule.installment_no}`);

  const fundingGlId = await fundingGlAccountId(officeId, fundingSource);
  const liabilityGlId = borrowing.borrowings_liability_gl_account_id ?? t.borrowingsLiabilityGlAccountId;
  if (!liabilityGlId) throw new Error(`repayBorrowingPrincipal: no borrowings liability GL account configured for office ${officeId} or borrowing ${borrowingId}`);

  const je = await api.journalEntries.create({
    officeId, transactionDate, currencyCode: t.currencyCode,
    debits: [{ glAccountId: liabilityGlId, amount: payAmount }],
    credits: [{ glAccountId: fundingGlId, amount: payAmount, comments: `Principal repayment: ${borrowing.lender_name} installment ${schedule.installment_no}` }],
    locale: 'en', dateFormat: 'yyyy-MM-dd'
  });

  try {
    await api.treasury.createRow(TXNS_TABLE, officeId, {
      borrowing_row_id: borrowingId, schedule_row_id: scheduleId, txn_type: 'PRINCIPAL_REPAYMENT',
      amount: payAmount, txn_date: transactionDate,
      fineract_je_transaction_id: String(je?.transactionId ?? ''), locale: 'en', dateFormat: 'yyyy-MM-dd'
    });
    const updatedPrincipalPaid = round2((Number(schedule.principal_paid) || 0) + payAmount);
    await api.treasury.updateRow(SCHEDULE_TABLE, officeId, scheduleId, {
      principal_paid: updatedPrincipalPaid,
      status: deriveScheduleStatus({ ...schedule, principal_paid: updatedPrincipalPaid }),
      locale: 'en', dateFormat: 'yyyy-MM-dd'
    });
    const updatedOutstanding = round2((Number(borrowing.outstanding_principal) || 0) - payAmount);
    await api.treasury.updateRow(BORROWINGS_TABLE, officeId, borrowingId, {
      outstanding_principal: Math.max(updatedOutstanding, 0),
      status: updatedOutstanding <= 0.01 ? BORROWING_STATUS.CLOSED : BORROWING_STATUS.ACTIVE,
      locale: 'en', dateFormat: 'yyyy-MM-dd'
    });
    return { officeId, borrowingId, scheduleId, amountPaid: payAmount, outstandingPrincipal: Math.max(updatedOutstanding, 0), fineractTransactionId: je?.transactionId };
  } catch (afterJeErr) {
    throw new TreasuryReconciliationGapError(
      `Principal repayment of ${payAmount} for borrowing ${borrowingId} installment ${schedule.installment_no} posted in Fineract (transactionId=${je?.transactionId}) but recording it in FinCraft afterwards failed. Reconcile manually.`,
      { fineractTransactionId: je?.transactionId, cause: afterJeErr }
    );
  }
}

export async function getBorrowingsDashboard(officeId) {
  const borrowings = await api.treasury.queryRows(BORROWINGS_TABLE, officeId);
  const list = Array.isArray(borrowings) ? borrowings : [];
  const active = list.filter(b => b.status === BORROWING_STATUS.ACTIVE);
  return {
    borrowings: list,
    activeCount: active.length,
    totalPrincipal: round2(list.reduce((s, b) => s + (Number(b.principal_amount) || 0), 0)),
    totalOutstandingPrincipal: round2(active.reduce((s, b) => s + (Number(b.outstanding_principal) || 0), 0))
  };
}

export { BORROWING_STATUS, SCHEDULE_STATUS };
