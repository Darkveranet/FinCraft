export function makeLoansAPI(self) {
  return {
    list:           (params)             => self._g('/loans', params),
    get:            (id, assoc = 'all')  => self._g(`/loans/${id}`, { associations: assoc }),
    getWithParams:  (id, params)         => self._g(`/loans/${id}`, params),
    template:       (params)             => self._g('/loans/template', params),
    approvalTemplate: (id)               => self._g(`/loans/${id}/template`, { templateType: 'approval' }),
    create:         (body)               => self._p('/loans', body),
    update:         (id, body)           => self._u(`/loans/${id}`, body),
    delete:         (id)                 => self._d(`/loans/${id}`),

    approve:        (id, body)           => self._p(`/loans/${id}?command=approve`, body),
    undoApproval:   (id)                 => self._p(`/loans/${id}?command=undoApproval`, {}),
    reject:         (id, body)           => self._p(`/loans/${id}?command=reject`, body),
    withdrawApplication: (id, body)      => self._p(`/loans/${id}?command=withdrawnByApplicant`, body),
    disburse:       (id, body)           => self._p(`/loans/${id}?command=disburse`, body),
    disburseToSavings: (id, body)        => self._p(`/loans/${id}?command=disburseToSavings`, body),
    undoDisbursal:  (id)                 => self._p(`/loans/${id}?command=undoDisbursal`, {}),
    writeOff:       (id, body)           => self._p(`/loans/${id}/transactions?command=writeoff`, body),
    chargeOff:      (id, body)           => self._p(`/loans/${id}/transactions?command=charge-off`, body),
    undoChargeOff:  (id, body)           => self._p(`/loans/${id}/transactions?command=undo-charge-off`, body),
    close:          (id, body)           => self._p(`/loans/${id}/transactions?command=close`, body),
    closeAsRescheduled: (id, body)       => self._p(`/loans/${id}/transactions?command=close-rescheduled`, body),
    foreclose:      (id, body)           => self._p(`/loans/${id}/transactions?command=foreclosure`, body),
    reage:          (id, body)           => self._p(`/loans/${id}/transactions?command=reAge`, body),
    reagePreview:   (id, params)         => self._g(`/loans/${id}/transactions/reage-preview`, params),
    undoReAge:      (id)                 => self._p(`/loans/${id}/transactions?command=undoReAge`, {}),
    reamortize:     (id, body)           => self._p(`/loans/${id}/transactions?command=reAmortize`, body),
    reamortizePreview: (id, params)      => self._g(`/loans/${id}/transactions/reamortization-preview`, params),
    undoReAmortize: (id)                 => self._p(`/loans/${id}/transactions?command=undoReAmortize`, {}),
    transactionTemplate: (id, params)    => self._g(`/loans/${id}/transactions/template`, params),
    markAsFraud:    (id, body)           => self._u(`/loans/${id}?command=markAsFraud`, body || { fraud: true }),
    recoverGuarantees: (id, body)        => self._p(`/loans/${id}?command=recoverGuarantees`, body || {}),
    assignOfficer:  (id, body)           => self._p(`/loans/${id}?command=assignLoanOfficer`, body),
    removeOfficer:  (id, body)           => self._p(`/loans/${id}?command=unassignLoanOfficer`, body),

    transactions:   (id, params)         => self._g(`/loans/${id}/transactions`, params),
    transaction:    (id, txId)           => self._g(`/loans/${id}/transactions/${txId}`),
    repay:          (id, body)           => self._p(`/loans/${id}/transactions?command=repayment`, body),
    prepayLoan:     (id, body)           => self._p(`/loans/${id}/transactions?command=prepayLoan`, body),
    downPayment:    (id, body)           => self._p(`/loans/${id}/transactions?command=downPayment`, body),
    recoverPayment: (id, body)           => self._p(`/loans/${id}/transactions?command=recoverypayment`, body),
    goodwillCredit: (id, body)           => self._p(`/loans/${id}/transactions?command=goodwillCredit`, body),
    creditBalanceRefund: (id, body)      => self._p(`/loans/${id}/transactions?command=creditBalanceRefund`, body),
    chargeRefund:   (id, body)           => self._p(`/loans/${id}/transactions?command=chargeRefund`, body),
    interestPaymentWaiver: (id, body)    => self._p(`/loans/${id}/transactions?command=interestPaymentWaiver`, body),
    merchantIssued: (id, body)           => self._p(`/loans/${id}/transactions?command=merchantIssuedRefund`, body),
    payoutRefund:   (id, body)           => self._p(`/loans/${id}/transactions?command=payoutRefund`, body),
    refundByCash:   (id, body)           => self._p(`/loans/${id}/transactions?command=refundByCash`, body),
    refundByTransfer: (id, body)         => self._p(`/loans/${id}/transactions?command=refundByTransfer`, body),
    waiveInterest:  (id, body)           => self._p(`/loans/${id}/transactions?command=waiveinterest`, body),
    chargebackTx:   (id, txId, body)     => self._p(`/loans/${id}/transactions/${txId}?command=chargeback`, body),
    reverseTransaction: (id, txId, body) => self._p(`/loans/${id}/transactions/${txId}?command=reverse`, body || {}),
    undoTransaction: (id, txId, body)    => self._p(`/loans/${id}/transactions/${txId}?command=undo`, body || {}),
    adjustTransaction: (id, txId, body)  => self._p(`/loans/${id}/transactions/${txId}?command=adjust`, body),
    undoWaiveCharge:   (id, txId, body)  => self._u(`/loans/${id}/transactions/${txId}`, body),
    modifyTransaction: (id, txId, body)  => self._u(`/loans/${id}/transactions/${txId}`, body),

    schedule:       (id)                 => self._g(`/loans/${id}`, { associations: 'repaymentSchedule' }),
    originalSchedule: (id)               => self._g(`/loans/${id}`, { associations: 'originalSchedule' }),
    calculateSchedule: (id, body)        => self._p(`/loans/${id}/schedule?command=calculateLoanSchedule`, body),
    submitVariableSchedule: (id, body)   => self._p(`/loans/${id}/schedule?command=updateSchedule`, body),

    addCharge:      (id, body)           => self._p(`/loans/${id}/charges`, body),
    chargeTemplate: (id)                 => self._g(`/loans/${id}/charges/template`),
    getCharge:      (id, cid)            => self._g(`/loans/${id}/charges/${cid}`),
    updateCharge:   (id, cid, body)      => self._u(`/loans/${id}/charges/${cid}`, body),
    waiveCharge:    (id, cid)            => self._p(`/loans/${id}/charges/${cid}?command=waive`, {}),
    payCharge:      (id, cid, body)      => self._p(`/loans/${id}/charges/${cid}?command=paycharge`, body),
    chargeAdjustment: (id, cid, body)    => self._p(`/loans/${id}/charges/${cid}?command=adjustment`, body),
    listCharges:    (id)                 => self._g(`/loans/${id}/charges`),
    deleteCharge:   (id, cid)            => self._d(`/loans/${id}/charges/${cid}`),

    listCollaterals:(id)                 => self._g(`/loans/${id}/collaterals`),
    getGlimAccount:   (glimId)           => self._g(`/loans/glimAccount/${glimId}`),
    glimAccountCommand:(glimId, command, body) => self._p(`/loans/glimAccount/${glimId}?command=${command}`, body || {}),
    collateralTemplate:(id)              => self._g(`/loans/${id}/collaterals/template`),
    getCollateral:  (id, cid)            => self._g(`/loans/${id}/collaterals/${cid}`),
    addCollateral:  (id, body)           => self._p(`/loans/${id}/collaterals`, body),
    updateCollateral:(id, cid, body)     => self._u(`/loans/${id}/collaterals/${cid}`, body),
    deleteCollateral:(id, cid)           => self._d(`/loans/${id}/collaterals/${cid}`),

    guarantors:     (id)                 => self._g(`/loans/${id}/guarantors`),
    guarantorTemplate: (id)              => self._g(`/loans/${id}/guarantors/template`),
    getGuarantor:   (id, gid)            => self._g(`/loans/${id}/guarantors/${gid}`),
    guarantorAccountsTemplate:(id)       => self._g(`/loans/${id}/guarantors/accounts/template`),
    addGuarantor:   (id, body)           => self._p(`/loans/${id}/guarantors`, body),
    updateGuarantor:(id, gid, body)      => self._u(`/loans/${id}/guarantors/${gid}`, body),
    deleteGuarantor:(id, gid)            => self._d(`/loans/${id}/guarantors/${gid}`),

    disbursement:   (id, disbId)         => self._g(`/loans/${id}/disbursements/${disbId}`),
    updateDisbursement: (id, disbId, body) => self._u(`/loans/${id}/disbursements/${disbId}`, body),
    editDisbursements: (id, body)        => self._u(`/loans/${id}/disbursements/editDisbursements`, body),

    delinquency:    (id)                 => self._g(`/loans/${id}/delinquency-actions`),
    addDelinquencyAction: (id, body)     => self._p(`/loans/${id}/delinquency-actions`, body),
    delinquencyTags:(id)                 => self._g(`/loans/${id}/delinquencytags`),

    getApprovedAmountHistory: (id)        => self._g(`/loans/${id}/approved-amount`),
    updateApprovedAmount:     (id, body)  => self._u(`/loans/${id}/approved-amount`, body),
    updateAvailableDisbursementAmount: (id, body) => self._u(`/loans/${id}/available-disbursement-amount`, body),

    standingInstructions: (id)           => self._g(`/loans/${id}`, { associations: 'standingInstructions' }),

    interestPauses: (id)                 => self._g(`/loans/${id}/interest-pauses`),
    interestPause:  (id, body)           => self._p(`/loans/${id}/interest-pauses`, body),
    updateInterestPause: (id, vid, body) => self._u(`/loans/${id}/interest-pauses/${vid}`, body),
    deleteInterestPause: (id, vid)       => self._d(`/loans/${id}/interest-pauses/${vid}`),

    buyDownFees:    (id)                 => self._g(`/loans/${id}/buydown-fees`),
    buyDownFeeAllocation: (id, txId)     => self._g(`/loans/${id}/buydown-fees/${txId}`),
    capitalizedIncomes: (id)             => self._g(`/loans/${id}/capitalized-incomes`),
    deferredIncome: (id)                 => self._g(`/loans/${id}/deferredincome`),

    rescheduleTemplate: (params)         => self._g('/rescheduleloans/template', params),
    reschedule:     (body)               => self._p('/rescheduleloans', body),
    rescheduleRequests: (loanId)         => self._g('/rescheduleloans', { loanId, command: 'pending' }),
    rescheduleRequest:  (schedId)        => self._g(`/rescheduleloans/${schedId}`),
    approveReschedule: (id, body)        => self._p(`/rescheduleloans/${id}?command=approve`, body),
    rejectReschedule:  (id, body)        => self._p(`/rescheduleloans/${id}?command=reject`, body),

    postDatedChecks:(id)                 => self._g(`/loans/${id}/postdatedchecks`),
    postDatedCheck: (id, instId)         => self._g(`/loans/${id}/postdatedchecks/${instId}`),
    updatePostDatedCheck: (id, pdcId, body, editType) =>
      self._u(`/loans/${id}/postdatedchecks/${pdcId}`, body, { params: editType ? { editType } : undefined }),
    deletePostDatedCheck: (id, pdcId)    => self._d(`/loans/${id}/postdatedchecks/${pdcId}`),

    eaoList:        (id)                 => self._g('/external-asset-owners/transfers', { loanId: id }),
    eaoTransfer:    (id, body)           => self._p(`/external-asset-owners/transfers/loans/${id}`, body),
    eaoBuyBack:     (id, body)           => self._p(`/external-asset-owners/transfers/loans/${id}`, body),

    originators:    (id)                 => self._g(`/loans/${id}/originators`),
    attachOriginator:(id, originatorId, body) =>
      self._p(`/loans/${id}/originators/${originatorId}`, body || {}),
    detachOriginator:(id, originatorId)  => self._d(`/loans/${id}/originators/${originatorId}`),

    bulkReassign:   (body)               => self._p('/loans/loanreassignment', body),
    loanReassignTemplate: ()             => self._g('/loans/loanreassignment/template'),

    loanAtDate:     (id, params)         => self._g(`/loans/at-date/${id}`, params),

    glimAccounts:   (id)                 => self._g(`/loans/glimAccount/${id}`),

    catchUp:            ()       => self._p('/loans/catch-up', {}),
    isCatchUpRunning:   ()       => self._g('/loans/is-catch-up-running'),
    oldestCobClosed:    ()       => self._g('/loans/oldest-cob-closed'),
    lockedAccounts:     (params) => self._g('/loans/locked', params),
    pointInTimeSearch:  (body)   => self._p('/loans/at-date/search', body),
    capitalizedIncomeAllocation: (id, loanTransactionId) =>
      self._g(`/loans/${id}/capitalized-incomes/${loanTransactionId}`),
    command:        (id, cmd, body)      => self._p(`/loans/${id}?command=${cmd}`, body || {})
  };
}

export function makeLoanCollateralManagementAPI(self) {
  return {
    get:    (collateralId) => self._g(`/loan-collateral-management/${collateralId}`),
    delete: (id)           => self._d(`/loan-collateral-management/${id}`)
  };
}

export function makeDelinquencyBucketsAPI(self) {
  return {
    list:        ()       => self._g('/delinquency/buckets'),
    bucketTemplate: ()    => self._g('/delinquency/buckets/template'),
    get:         (id)     => self._g(`/delinquency/buckets/${id}`),
    create:      (b)      => self._p('/delinquency/buckets', b),
    update:      (id, b)  => self._u(`/delinquency/buckets/${id}`, b),
    delete:      (id)     => self._d(`/delinquency/buckets/${id}`),
    ranges:      ()       => self._g('/delinquency/ranges'),
    range:       (id)     => self._g(`/delinquency/ranges/${id}`),
    createRange: (b)      => self._p('/delinquency/ranges', b),
    updateRange: (id, b)  => self._u(`/delinquency/ranges/${id}`, b),
    deleteRange: (id)     => self._d(`/delinquency/ranges/${id}`),
    loanTagHistory: (loanId) => self._g(`/loans/${loanId}/delinquencytags`)
  };
}

export function makeLoanOriginatorsAPI(self) {
  return {
    list:    (params)      => self._g('/loan-originators', params),
    get:     (id)          => self._g(`/loan-originators/${id}`),
    template:()            => self._g('/loan-originators/template'),
    create:  (body)        => self._p('/loan-originators', body),
    update:  (id, body)    => self._u(`/loan-originators/${id}`, body),
    delete:  (id)          => self._d(`/loan-originators/${id}`)
  };
}

export function makeExternalAssetOwnersAPI(self) {
  return {
    list:           (params)     => self._g('/external-asset-owners', params),
    create:         (body)       => self._p('/external-asset-owners', body),
    journalEntries: (transferId, params) => self._g(`/external-asset-owners/transfers/${transferId}/journal-entries`, params),
    ownerJournalEntriesByExternalId: (ownerExternalId, params) => self._g(`/external-asset-owners/owners/external-id/${ownerExternalId}/journal-entries`, params),
    transfers:      (params)     => self._g('/external-asset-owners/transfers', params),
    activeTransfer: (params)     => self._g('/external-asset-owners/transfers/active-transfer', params),
    loanProductAttributes:       (loanProductId, params) => self._g(`/external-asset-owners/loan-product/${loanProductId}/attributes`, params),
    createLoanProductAttribute:  (loanProductId, body)   => self._p(`/external-asset-owners/loan-product/${loanProductId}/attributes`, body),
    updateLoanProductAttribute:  (loanProductId, id, b)  => self._u(`/external-asset-owners/loan-product/${loanProductId}/attributes/${id}`, b),
    transferAsset:  (id, body)   => self._p(`/external-asset-owners/transfers/${id}`, body),
    search:         (body)       => self._p('/external-asset-owners/search', body)
  };
}

export function makeCollateralManagementAPI(self) {
  return {
      list:     (params)   => self._g('/collateral-management', params),
      get:      (id)       => self._g(`/collateral-management/${id}`),
      template: ()         => self._g('/collateral-management/template'),
      create:   (body)     => self._p('/collateral-management', body),
      update:   (id, body) => self._u(`/collateral-management/${id}`, body),
      delete:   (id)       => self._d(`/collateral-management/${id}`)
    };
}
