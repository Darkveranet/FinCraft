import { api } from '../api.js';

export const DATATABLE = 'dt_teller_operational_events';

export const CASH_IN_TYPES  = Object.freeze(['CASH_ALLOCATION', 'SAVINGS_DEPOSIT', 'LOAN_REPAYMENT', 'CASH_RECEIPT', 'REVERSAL_CASH_IN']);
export const CASH_OUT_TYPES = Object.freeze(['SAVINGS_WITHDRAWAL', 'LOAN_DISBURSEMENT', 'EXPENSE_PAYMENT', 'CASH_SETTLEMENT', 'REVERSAL_CASH_OUT']);

function directionFor(transactionType) {
  if (CASH_IN_TYPES.includes(transactionType)) return 'CASH_IN';
  if (CASH_OUT_TYPES.includes(transactionType)) return 'CASH_OUT';
  throw new Error(`Unknown teller transaction type "${transactionType}" — must be one of: ${[...CASH_IN_TYPES, ...CASH_OUT_TYPES].join(', ')}`);
}

function assertRequired(payload, fields) {
  const missing = fields.filter(f => payload[f] === undefined || payload[f] === null || payload[f] === '');
  if (missing.length) throw new Error(`recordTellerEvent: missing required field(s): ${missing.join(', ')}`);
}

export async function recordTellerEvent(payload) {
  assertRequired(payload, ['officeId', 'tellerId', 'cashierId', 'transactionType', 'amount', 'currencyCode', 'transactionDate']);
  const amount = Number(payload.amount);
  if (!(amount > 0)) throw new Error('recordTellerEvent: amount must be a positive number (direction is encoded by transactionType, not sign)');

  const direction = payload.direction || directionFor(payload.transactionType);

  const row = {
    teller_id: payload.tellerId,
    cashier_id: payload.cashierId,
    staff_id: payload.staffId ?? null,
    transaction_type: payload.transactionType,
    direction,
    amount,
    currency_code: payload.currencyCode,
    transaction_date: payload.transactionDate,
    fineract_entity_type: payload.fineractEntityType ?? null,
    fineract_entity_id: payload.fineractEntityId ?? null,
    fineract_transaction_id: payload.fineractTransactionId ?? null,
    narration: payload.narration ?? null,
    status: 'POSTED',
    created_by: payload.createdBy ?? null,
    reversed: false,
    reversal_reference: null,
    locale: 'en', dateFormat: 'yyyy-MM-dd'
  };

  const result = await api.treasury.createRow(DATATABLE, payload.officeId, row);
  return { officeId: payload.officeId, eventId: result?.resourceId ?? result?.subResourceId ?? result?.id, direction };
}

export async function reverseTellerEvent(officeId, eventId, reason, reversedBy) {
  const original = await api.treasury.getRow(DATATABLE, officeId, eventId);
  if (!original) throw new Error(`reverseTellerEvent: event ${eventId} not found for office ${officeId}`);
  if (original.reversed) throw new Error(`reverseTellerEvent: event ${eventId} was already reversed`);

  const reversalType = original.direction === 'CASH_IN' ? 'REVERSAL_CASH_OUT' : 'REVERSAL_CASH_IN';
  const reversal = await recordTellerEvent({
    officeId,
    tellerId: original.teller_id,
    cashierId: original.cashier_id,
    staffId: original.staff_id,
    transactionType: reversalType,
    amount: original.amount,
    currencyCode: original.currency_code,
    transactionDate: new Date().toISOString().slice(0, 10),
    fineractEntityType: original.fineract_entity_type,
    fineractEntityId: original.fineract_entity_id,
    fineractTransactionId: original.fineract_transaction_id,
    narration: `Reversal of event ${eventId}: ${reason || ''}`.trim(),
    createdBy: reversedBy
  });

  await api.treasury.updateRow(DATATABLE, officeId, eventId, {
    reversed: true,
    reversal_reference: String(reversal.eventId),
    locale: 'en', dateFormat: 'yyyy-MM-dd'
  });

  return { originalEventId: eventId, reversalEventId: reversal.eventId };
}

function inRange(row, dateRange) {
  if (!dateRange) return true;
  const d = row.transaction_date;
  if (dateRange.from && d < dateRange.from) return false;
  if (dateRange.to && d > dateRange.to) return false;
  return true;
}

export async function getCashierEvents(officeId, cashierId, dateRange) {
  const rows = await api.treasury.queryRows(DATATABLE, officeId);
  return (Array.isArray(rows) ? rows : []).filter(r => r.cashier_id === cashierId && inRange(r, dateRange));
}

export async function getTellerEvents(officeId, tellerId, dateRange) {
  const rows = await api.treasury.queryRows(DATATABLE, officeId);
  return (Array.isArray(rows) ? rows : []).filter(r => r.teller_id === tellerId && inRange(r, dateRange));
}

export async function getOfficeTellerEvents(officeId, dateRange) {
  const rows = await api.treasury.queryRows(DATATABLE, officeId);
  return (Array.isArray(rows) ? rows : []).filter(r => inRange(r, dateRange));
}
