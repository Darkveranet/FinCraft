export const TREASURY_ROUTE_PERMS = {
  treasury: 'READ_DATATABLE', 'treasury-dashboard': 'READ_JOURNALENTRY',
  'teller-console': 'READ_OFFICE', 'cash-allocation': 'ALLOCATECASHTOCASHIER_TELLER',
  'loan-disbursement': 'DISBURSE_LOAN', 'treasury-expenses': 'READ_DATATABLE',
  'treasury-borrowings': 'READ_DATATABLE', 'treasury-reconciliation': 'READ_DATATABLE'
};
export const TREASURY_ACTION_PERMS = {
  saveThresholds: 'CREATE_DATATABLE', allocateCash: 'ALLOCATECASHTOCASHIER_TELLER',
  disburseLoan: 'DISBURSE_LOAN', createExpense: 'CREATE_DATATABLE',
  approveExpense: 'CREATE_JOURNALENTRY_CHECKER', payExpense: 'CREATE_JOURNALENTRY',
  createBorrowing: 'CREATE_DATATABLE', approveBorrowing: 'CREATE_JOURNALENTRY_CHECKER',
  submitReconciliation: 'CREATE_DATATABLE', approveReconciliation: 'CREATE_JOURNALENTRY_CHECKER',
  resolveGap: 'CREATE_JOURNALENTRY_CHECKER'
};
