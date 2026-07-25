import { api } from '../api.js';

const DATATABLE = 'dt_treasury_thresholds';

function fromRow(row) {
  if (!row) return null;
  return {
    vaultGlAccountId: row.vault_gl_account_id,
    cashAtTellersGlAccountId: row.cash_at_tellers_gl_account_id,
    bankGlAccountId: row.bank_gl_account_id,
    borrowingsLiabilityGlAccountId: row.borrowings_liability_gl_account_id ?? null,
    interestPayableGlAccountId: row.interest_payable_gl_account_id ?? null,
    interestExpenseGlAccountId: row.interest_expense_gl_account_id ?? null,
    reserveBufferAmount: Number(row.reserve_buffer_amount) || 0,
    currencyCode: row.currency_code,
    shortageGlAccountId: row.shortage_gl_account_id ?? null,
    overageGlAccountId: row.overage_gl_account_id ?? null
  };
}

export async function getThresholds(officeId) {
  const result = await api.treasury.queryRows(DATATABLE, officeId).catch(err => {
    if (err?.status === 404 || err?.detail?.httpStatusCode === '404') return null;
    throw err;
  });
  const row = Array.isArray(result) ? result[0] : result;
  return fromRow(row);
}

export async function upsertThresholds(officeId, thresholds) {
  const required = ['vaultGlAccountId', 'cashAtTellersGlAccountId', 'bankGlAccountId', 'reserveBufferAmount', 'currencyCode'];
  const missing = required.filter(f => thresholds[f] === undefined || thresholds[f] === null || thresholds[f] === '');
  if (missing.length) throw new Error(`upsertThresholds: missing required field(s): ${missing.join(', ')}`);

  const row = {
    vault_gl_account_id: thresholds.vaultGlAccountId,
    cash_at_tellers_gl_account_id: thresholds.cashAtTellersGlAccountId,
    bank_gl_account_id: thresholds.bankGlAccountId,
    borrowings_liability_gl_account_id: thresholds.borrowingsLiabilityGlAccountId ?? null,
    interest_payable_gl_account_id: thresholds.interestPayableGlAccountId ?? null,
    interest_expense_gl_account_id: thresholds.interestExpenseGlAccountId ?? null,
    reserve_buffer_amount: Number(thresholds.reserveBufferAmount),
    currency_code: thresholds.currencyCode,
    shortage_gl_account_id: thresholds.shortageGlAccountId ?? null,
    overage_gl_account_id: thresholds.overageGlAccountId ?? null,
    locale: 'en', dateFormat: 'yyyy-MM-dd'
  };

  const existing = await getThresholds(officeId);
  if (existing) return api.treasury.updateConfig(DATATABLE, officeId, row);
  return api.treasury.createRow(DATATABLE, officeId, row);
}

export async function requireThresholds(officeId) {
  const t = await getThresholds(officeId);
  if (!t) throw new Error(`Office ${officeId} has no treasury configuration (dt_treasury_thresholds). Configure Vault/Cash-At-Tellers/Bank GL accounts and a reserve buffer before using Vault Control.`);
  return t;
}
