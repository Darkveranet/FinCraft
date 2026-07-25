export function makeInteroperationAPI(self) {
  return {
    health: () => self._g('/interoperation/health'),

    getAccount:            (accountId) => self._g(`/interoperation/accounts/${accountId}`),
    accountIdentifiers:    (accountId) => self._g(`/interoperation/accounts/${accountId}/identifiers`),
    accountKyc:            (accountId) => self._g(`/interoperation/accounts/${accountId}/kyc`),
    accountTransactions:   (accountId) => self._g(`/interoperation/accounts/${accountId}/transactions`),

    getParty:      (idType, idValue, subIdOrType) =>
      self._g(`/interoperation/parties/${encodeURIComponent(idType)}/${encodeURIComponent(idValue)}${subIdOrType ? `/${encodeURIComponent(subIdOrType)}` : ''}`),
    registerParty: (idType, idValue, body, subIdOrType) =>
      self._p(`/interoperation/parties/${encodeURIComponent(idType)}/${encodeURIComponent(idValue)}${subIdOrType ? `/${encodeURIComponent(subIdOrType)}` : ''}`, body || {}),
    deleteParty:   (idType, idValue, subIdOrType) =>
      self._d(`/interoperation/parties/${encodeURIComponent(idType)}/${encodeURIComponent(idValue)}${subIdOrType ? `/${encodeURIComponent(subIdOrType)}` : ''}`),

    createQuote:              (body) => self._p('/interoperation/quotes', body),
    createTransactionRequest: (body) => self._p('/interoperation/requests', body),
    performTransfer:          (body) => self._p('/interoperation/transfers', body),

    getQuote:              (transactionCode, quoteCode)   => self._g(`/interoperation/transactions/${encodeURIComponent(transactionCode)}/quotes/${encodeURIComponent(quoteCode)}`),
    getTransactionRequest: (transactionCode, requestCode) => self._g(`/interoperation/transactions/${encodeURIComponent(transactionCode)}/requests/${encodeURIComponent(requestCode)}`),
    getTransfer:           (transactionCode, transferCode)=> self._g(`/interoperation/transactions/${encodeURIComponent(transactionCode)}/transfers/${encodeURIComponent(transferCode)}`),

    disburseLoan:  (accountId, body) => self._p(`/interoperation/transactions/${accountId}/disburse`, body),
    loanRepayment: (accountId, body) => self._p(`/interoperation/transactions/${accountId}/loanrepayment`, body)
  };
}
