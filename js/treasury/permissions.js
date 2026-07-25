export const TREASURY_ROUTE_PERMS = {
  'treasury':                 'READ_DATATABLE',
  'treasury-dashboard':       'READ_JOURNALENTRY',
  'teller-console':           'READ_OFFICE',
  'cash-allocation':          'ALLOCATECASHTOCASHIER_TELLER',
  'loan-disbursement':        'DISBURSE_LOAN',
  'treasury-expenses':        'CREATE_JOURNALENTRY',
  'treasury-borrowings':      'CREATE_JOURNALENTRY',
  'treasury-reconciliation':  'CREATE_JOURNALENTRY'
};

export const TREASURY_ACTION_PERMS = {
  saveThresholds:  'CREATE_DATATABLE',
  allocateCash:    'ALLOCATECASHTOCASHIER_TELLER',
  disburseLoan:    'DISBURSE_LOAN',
  postExpense:     'CREATE_JOURNALENTRY',
  postBorrowing:   'CREATE_JOURNALENTRY',
  postReconcile:   'CREATE_JOURNALENTRY'
};
