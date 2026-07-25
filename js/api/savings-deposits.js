export function makeSavingsAPI(self) {
  return {
    list:        (params)      => self._g('/savingsaccounts', params),
    get:         (id, params)  => self._g(`/savingsaccounts/${id}`, params),
    template:    (params)      => self._g('/savingsaccounts/template', params),
    create:      (body)        => self._p('/savingsaccounts', body),
    createGsim:  (body)        => self._p('/savingsaccounts/gsim', body),
    updateGsim:  (parentAccountId, body) => self._u(`/savingsaccounts/gsim/${parentAccountId}`, body),
    gsimCommand: (parentAccountId, command, body) => self._p(`/savingsaccounts/gsimcommands/${parentAccountId}?command=${command}`, body || {}),
    approve:     (id, body)    => self._p(`/savingsaccounts/${id}?command=approve`, body),
    undoApproval:(id)          => self._p(`/savingsaccounts/${id}?command=undoapproval`, {}),
    reject:      (id, body)    => self._p(`/savingsaccounts/${id}?command=reject`, body),
    withdrawApplication: (id, body) => self._p(`/savingsaccounts/${id}?command=withdrawnByApplicant`, body),
    withdrawal:  (id, body)    => self._p(`/savingsaccounts/${id}/transactions?command=withdrawal`, body),
    activate:    (id, body)    => self._p(`/savingsaccounts/${id}?command=activate`, body),
    deposit:     (id, body)    => self._p(`/savingsaccounts/${id}/transactions?command=deposit`, body),
    holdAmount:  (id, body)    => self._p(`/savingsaccounts/${id}/transactions?command=holdAmount`, body),
    releaseAmount:(id, txId)   => self._p(`/savingsaccounts/${id}/transactions/${txId}?command=releaseAmount`, {}),
    reverseTransaction:(id, txId, body) => self._p(`/savingsaccounts/${id}/transactions/${txId}?command=reverse`, body || {}),
    close:       (id, body)    => self._p(`/savingsaccounts/${id}?command=close`, body),
    postInterest:(id, body)    => self._p(`/savingsaccounts/${id}?command=postInterest`, body || {}),
    calculateInterest: (id)    => self._p(`/savingsaccounts/${id}?command=calculateInterest`, {}),
    block:       (id)          => self._p(`/savingsaccounts/${id}?command=block`, {}),
    unblock:     (id)          => self._p(`/savingsaccounts/${id}?command=unblock`, {}),
    blockDebit:  (id)          => self._p(`/savingsaccounts/${id}?command=blockDebit`, {}),
    unblockDebit:(id)          => self._p(`/savingsaccounts/${id}?command=unblockDebit`, {}),
    blockCredit: (id)          => self._p(`/savingsaccounts/${id}?command=blockCredit`, {}),
    unblockCredit:(id)         => self._p(`/savingsaccounts/${id}?command=unblockCredit`, {}),
    update:      (id, body)    => self._u(`/savingsaccounts/${id}`, body),
    delete:      (id)          => self._d(`/savingsaccounts/${id}`),
    applyAnnualFees:    (id, body) => self._p(`/savingsaccounts/${id}?command=applyAnnualFees`, body),
    postInterestAsOn:   (id, date) => self._p(`/savingsaccounts/${id}?command=postInterestAsOn`, { transactionDate: date, dateFormat: 'yyyy-MM-dd', locale: 'en' }),
    onHoldTransactions: (id)       => self._g(`/savingsaccounts/${id}/onholdtransactions`),
    assignStaff:        (id, body) => self._p(`/savingsaccounts/${id}?command=assignSavingsOfficer`, body),
    unassignStaff:      (id, body) => self._p(`/savingsaccounts/${id}?command=unassignSavingsOfficer`, body || {}),
    command:            (id, cmd, body) => self._p(`/savingsaccounts/${id}?command=${cmd}`, body || {}),
    waiveCharge:        (id, cid)  => self._p(`/savingsaccounts/${id}/charges/${cid}?command=waive`, {}),
    payCharge:          (id, cid, body) => self._p(`/savingsaccounts/${id}/charges/${cid}?command=paycharge`, body),
    inactivateCharge:   (id, cid)  => self._p(`/savingsaccounts/${id}/charges/${cid}?command=inactivate`, {}),
    updateCharge:       (id, cid, body) => self._u(`/savingsaccounts/${id}/charges/${cid}`, body),
    deleteCharge:       (id, cid)  => self._d(`/savingsaccounts/${id}/charges/${cid}`),
    adjustTransaction:  (id, txId, body) => self._p(`/savingsaccounts/${id}/transactions/${txId}?command=modify`, body),
    undoTransaction:    (id, txId) => self._p(`/savingsaccounts/${id}/transactions/${txId}?command=undo`, {}),
    addCharge:   (id, body)    => self._p(`/savingsaccounts/${id}/charges`, body),
    chargeTemplate: (id)       => self._g(`/savingsaccounts/${id}/charges/template`),
    getCharge:      (id, cid)  => self._g(`/savingsaccounts/${id}/charges/${cid}`),
    charges:     (id)          => self._g(`/savingsaccounts/${id}/charges`),
    transactions:(id)          => self._g(`/savingsaccounts/${id}`, { associations: 'transactions' })
      .then(r => r?.transactions || []),
    transactionTemplate: (id, params) => self._g(`/savingsaccounts/${id}/transactions/template`, params),
    getTransaction:      (id, txId)   => self._g(`/savingsaccounts/${id}/transactions/${txId}`),
    searchTransactions:  (id, params) => self._g(`/savingsaccounts/${id}/transactions/search`, params),
    queryTransactions:   (id, body)   => self._p(`/savingsaccounts/${id}/transactions/query`, body)
  };
}

export function makeFixedDepositsAPI(self) {
  return {
    list:     (params)   => self._g('/fixeddepositaccounts', params),
    get:      (id, params) => self._g(`/fixeddepositaccounts/${id}`, params),
    template: (params)   => self._g('/fixeddepositaccounts/template', params),
    calculateInterestPreview: (params) => self._g('/fixeddepositaccounts/calculate-fd-interest', params),
    create:   (body)     => self._p('/fixeddepositaccounts', body),
    update:   (id, body) => self._u(`/fixeddepositaccounts/${id}`, body),
    delete:   (id)       => self._d(`/fixeddepositaccounts/${id}`),

    approve:     (id, body) => self._p(`/fixeddepositaccounts/${id}?command=approve`, body),
    undoApproval:(id)       => self._p(`/fixeddepositaccounts/${id}?command=undoapproval`, {}),
    reject:      (id, body) => self._p(`/fixeddepositaccounts/${id}?command=reject`, body),
    withdrawApplication: (id, body) => self._p(`/fixeddepositaccounts/${id}?command=withdrawnByApplicant`, body),
    activate:    (id, body) => self._p(`/fixeddepositaccounts/${id}?command=activate`, body),
    premature:   (id, body) => self._p(`/fixeddepositaccounts/${id}?command=prematureClose`, body),
    close:       (id, body) => self._p(`/fixeddepositaccounts/${id}?command=close`, body),

    prematureTemplate: (id) => self._g(`/fixeddepositaccounts/${id}/template`, { command: 'prematureClose' }),
    closeTemplate:     (id) => self._g(`/fixeddepositaccounts/${id}/template`, { command: 'close' }),
    withdrawalTemplate:(id) => self._g(`/fixeddepositaccounts/${id}/template`, { command: 'withdrawal' }),

    calculateInterest: (id) => self._p(`/fixeddepositaccounts/${id}?command=calculateInterest`, {}),
    postInterest:      (id) => self._p(`/fixeddepositaccounts/${id}?command=postInterest`, {}),

    transactions: (id, params) => self._g(`/fixeddepositaccounts/${id}/transactions`, params),
    transaction:  (id, txId)   => self._g(`/fixeddepositaccounts/${id}/transactions/${txId}`),
    transactionTemplate: (id, params) => self._g(`/fixeddepositaccounts/${id}/transactions/template`, params),
    deposit:      (id, body)   => self._p(`/fixeddepositaccounts/${id}/transactions?command=deposit`, body),
    withdrawal:   (id, body)   => self._p(`/fixeddepositaccounts/${id}/transactions?command=withdrawal`, body),
    interestTx:   (id, body)   => self._p(`/fixeddepositaccounts/${id}/transactions?command=interest`, body || {}),
    prematureTx:  (id, body)   => self._p(`/fixeddepositaccounts/${id}/transactions?command=prematureClose`, body),
    adjustTransaction: (id, txId, body) => self._p(`/fixeddepositaccounts/${id}/transactions/${txId}?command=adjust`, body),
    undoTransaction:   (id, txId)       => self._p(`/fixeddepositaccounts/${id}/transactions/${txId}?command=undo`, {}),

    charges:         (id)          => self._g(`/savingsaccounts/${id}/charges`),
    chargeTemplate:  (id)          => self._g(`/savingsaccounts/${id}/charges/template`),
    getCharge:       (id, cid)     => self._g(`/savingsaccounts/${id}/charges/${cid}`),
    addCharge:       (id, body)    => self._p(`/savingsaccounts/${id}/charges`, body),
    updateCharge:    (id, cid, b)  => self._u(`/savingsaccounts/${id}/charges/${cid}`, b),
    payCharge:       (id, cid, b)  => self._p(`/savingsaccounts/${id}/charges/${cid}?command=paycharge`, b),
    waiveCharge:     (id, cid)     => self._p(`/savingsaccounts/${id}/charges/${cid}?command=waive`, {}),
    inactivateCharge:(id, cid)     => self._p(`/savingsaccounts/${id}/charges/${cid}?command=inactivate`, {}),
    deleteCharge:    (id, cid)     => self._d(`/savingsaccounts/${id}/charges/${cid}`),

    command:      (id, cmd, body) => self._p(`/fixeddepositaccounts/${id}?command=${cmd}`, body || {})
  };
}

export function makeRecurringDepositsAPI(self) {
  return {
    list:     (params)   => self._g('/recurringdepositaccounts', params),
    get:      (id, params) => self._g(`/recurringdepositaccounts/${id}`, params),
    template: (params)   => self._g('/recurringdepositaccounts/template', params),
    create:   (body)     => self._p('/recurringdepositaccounts', body),
    update:   (id, body) => self._u(`/recurringdepositaccounts/${id}`, body),
    delete:   (id)       => self._d(`/recurringdepositaccounts/${id}`),

    approve:     (id, body) => self._p(`/recurringdepositaccounts/${id}?command=approve`, body),
    undoApproval:(id)       => self._p(`/recurringdepositaccounts/${id}?command=undoapproval`, {}),
    reject:      (id, body) => self._p(`/recurringdepositaccounts/${id}?command=reject`, body),
    withdrawApplication: (id, body) => self._p(`/recurringdepositaccounts/${id}?command=withdrawnByApplicant`, body),
    activate:    (id, body) => self._p(`/recurringdepositaccounts/${id}?command=activate`, body),
    premature:   (id, body) => self._p(`/recurringdepositaccounts/${id}?command=prematureClose`, body),
    updateDepositAmount: (id, body) => self._p(`/recurringdepositaccounts/${id}?command=updateDepositAmount`, body),
    close:       (id, body) => self._p(`/recurringdepositaccounts/${id}?command=close`, body),

    prematureTemplate: (id) => self._g(`/recurringdepositaccounts/${id}/template`, { command: 'prematureClose' }),
    closeTemplate:     (id) => self._g(`/recurringdepositaccounts/${id}/template`, { command: 'close' }),
    withdrawalTemplate:(id) => self._g(`/recurringdepositaccounts/${id}/template`, { command: 'withdrawal' }),

    calculateInterest: (id) => self._p(`/recurringdepositaccounts/${id}?command=calculateInterest`, {}),
    postInterest:      (id) => self._p(`/recurringdepositaccounts/${id}?command=postInterest`, {}),

    transactions: (id, params) => self._g(`/recurringdepositaccounts/${id}`, { ...params, associations: 'transactions' }),
    transaction:  (id, txId)   => self._g(`/recurringdepositaccounts/${id}/transactions/${txId}`),
    transactionTemplate: (id, params) => self._g(`/recurringdepositaccounts/${id}/transactions/template`, params),
    deposit:      (id, body)   => self._p(`/recurringdepositaccounts/${id}/transactions?command=deposit`, body),
    withdrawal:   (id, body)   => self._p(`/recurringdepositaccounts/${id}/transactions?command=withdrawal`, body),
    interestTx:   (id, body)   => self._p(`/recurringdepositaccounts/${id}/transactions?command=interest`, body || {}),
    prematureTx:  (id, body)   => self._p(`/recurringdepositaccounts/${id}/transactions?command=prematureClose`, body),
    adjustTransaction: (id, txId, body) => self._p(`/recurringdepositaccounts/${id}/transactions/${txId}?command=adjust`, body),
    undoTransaction:   (id, txId)       => self._p(`/recurringdepositaccounts/${id}/transactions/${txId}?command=undo`, {}),

    charges:         (id)          => self._g(`/savingsaccounts/${id}/charges`),
    chargeTemplate:  (id)          => self._g(`/savingsaccounts/${id}/charges/template`),
    getCharge:       (id, cid)     => self._g(`/savingsaccounts/${id}/charges/${cid}`),
    addCharge:       (id, body)    => self._p(`/savingsaccounts/${id}/charges`, body),
    updateCharge:    (id, cid, b)  => self._u(`/savingsaccounts/${id}/charges/${cid}`, b),
    payCharge:       (id, cid, b)  => self._p(`/savingsaccounts/${id}/charges/${cid}?command=paycharge`, b),
    waiveCharge:     (id, cid)     => self._p(`/savingsaccounts/${id}/charges/${cid}?command=waive`, {}),
    inactivateCharge:(id, cid)     => self._p(`/savingsaccounts/${id}/charges/${cid}?command=inactivate`, {}),
    deleteCharge:    (id, cid)     => self._d(`/savingsaccounts/${id}/charges/${cid}`),

    command:      (id, cmd, body) => self._p(`/recurringdepositaccounts/${id}?command=${cmd}`, body || {})
  };
}
