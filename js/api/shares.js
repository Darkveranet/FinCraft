export function makeSharesAPI(self) {
  return {
    list:           (params)   => self._g('/accounts/share', params),
    get:            (id, params) => self._g(`/accounts/share/${id}`, params),
    template:       ()         => self._g('/accounts/share/template'),
    create:         (body)     => self._p('/accounts/share', body),
    update:         (id, body) => self._u(`/accounts/share/${id}`, body),
    delete:         (id)       => self._d(`/accounts/share/${id}`),

    approve:        (id, body) => self._p(`/accounts/share/${id}?command=approve`, body),
    undoApproval:   (id)       => self._p(`/accounts/share/${id}?command=undoapproval`, {}),
    reject:         (id, body) => self._p(`/accounts/share/${id}?command=reject`, body),
    withdrawApplication: (id, body) => self._p(`/accounts/share/${id}?command=withdrawnByApplicant`, body),
    activate:       (id, body) => self._p(`/accounts/share/${id}?command=activate`, body),
    close:          (id, body) => self._p(`/accounts/share/${id}?command=close`, body),

    applyAdditional:(id, body) => self._p(`/accounts/share/${id}?command=applyadditionalshares`, body),
    redeem:         (id, body) => self._p(`/accounts/share/${id}?command=redeemshares`, body),

    approveShareReq:(id, body) => self._p(`/accounts/share/${id}?command=approveshare`, body),
    rejectShareReq: (id, body) => self._p(`/accounts/share/${id}?command=rejectshare`, body),

    dividends:      (productId)        => self._g(`/shareproduct/${productId}/dividend`),
    getDividend:    (productId, divId) => self._g(`/shareproduct/${productId}/dividend/${divId}`),
    postDividend:   (productId, body)  => self._p(`/shareproduct/${productId}/dividend`, body),
    updateDividend: (productId, divId, body) => self._u(`/shareproduct/${productId}/dividend/${divId}`, body),
    approveDividend:(productId, divId) => self._u(`/shareproduct/${productId}/dividend/${divId}?command=approve`, {}),
    deleteDividend: (productId, divId) => self._d(`/shareproduct/${productId}/dividend/${divId}`),

    command:        (id, cmd, body) => self._p(`/accounts/share/${id}?command=${cmd}`, body || {})
  };
}
