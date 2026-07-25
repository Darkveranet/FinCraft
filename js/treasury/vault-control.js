import { api } from '../api.js';
import { requireThresholds } from './thresholds.js';
import { recordTellerEvent } from './teller-events.js';
import { TreasuryReconciliationGapError } from './errors.js';

const ASSET_TYPE_ID = 1;

export { TreasuryReconciliationGapError };

export async function getVaultBalance(officeId, { precise = true } = {}) {
  const t = await requireThresholds(officeId);
  if (!precise) {
    const acct = await api.glAccounts.getBalance(t.vaultGlAccountId);
    return Number(acct?.organizationRunningBalance) || 0;
  }
  const acct = await api.glAccounts.get(t.vaultGlAccountId);
  const accountType = acct?.type?.id ?? ASSET_TYPE_ID;
  return api.glAccounts.computeOfficeBalance(t.vaultGlAccountId, officeId, { accountType });
}

export async function getReserveBuffer(officeId) {
  const t = await requireThresholds(officeId);
  return t.reserveBufferAmount;
}

export async function validateVaultCanAllocate(officeId, amount) {
  const [vaultBalance, reserveBuffer] = await Promise.all([
    getVaultBalance(officeId),
    getReserveBuffer(officeId)
  ]);
  const availableVault = vaultBalance - reserveBuffer;
  if (Number(amount) > availableVault) {
    throw new Error(`Insufficient vault cash. Available after buffer: ${availableVault}, Requested: ${amount}`);
  }
  return { vaultBalance, reserveBuffer, availableVault };
}

export async function allocateCashToCashier(officeId, tellerId, cashierId, amount, transactionDate, note, performedBy) {
  const t = await requireThresholds(officeId);
  const check = await validateVaultCanAllocate(officeId, amount);

  let fineractResult;
  try {
    fineractResult = await api.tellers.allocateCashTo(tellerId, cashierId, {
      currencyCode: t.currencyCode,
      txnAmount: String(amount),
      txnNote: note || '',
      txnDate: transactionDate,
      locale: 'en',
      dateFormat: 'yyyy-MM-dd'
    });
  } catch (err) {
    throw err;
  }

  try {
    const event = await recordTellerEvent({
      officeId, tellerId, cashierId,
      transactionType: 'CASH_ALLOCATION',
      amount,
      currencyCode: t.currencyCode,
      transactionDate,
      fineractEntityType: 'TELLER_CASHIER',
      fineractEntityId: cashierId,
      fineractTransactionId: String(fineractResult?.subResourceId ?? fineractResult?.resourceId ?? ''),
      narration: note,
      createdBy: performedBy
    });
    return {
      fineractResourceId: fineractResult?.subResourceId ?? fineractResult?.resourceId,
      eventId: event.eventId,
      availableVaultAfter: check.availableVault - amount
    };
  } catch (eventErr) {
    throw new TreasuryReconciliationGapError(
      `Vault allocation of ${amount} succeeded in Fineract (resourceId=${fineractResult?.subResourceId ?? fineractResult?.resourceId}) but recording the FinCraft teller event failed — the teller/cashier operational sub-ledger is now behind the real Fineract cashier balance for this transaction. Reconcile manually.`,
      { fineractResourceId: fineractResult?.subResourceId ?? fineractResult?.resourceId, cause: eventErr }
    );
  }
}
