export class TreasuryReconciliationGapError extends Error {
  constructor(message, { fineractResourceId, fineractTransactionId, cause } = {}) {
    super(message);
    this.name = 'TreasuryReconciliationGapError';
    this.fineractResourceId = fineractResourceId;
    this.fineractTransactionId = fineractTransactionId;
    this.cause = cause;
  }
}
