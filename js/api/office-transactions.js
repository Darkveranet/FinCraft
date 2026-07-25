export function makeOfficeTransactionsAPI(self) {
  return {
    list:     ()             => self._g('/officetransactions'),
    template: ()             => self._g('/officetransactions/template'),
    transfer: (body)         => self._p('/officetransactions', body),
    delete:   (transactionId)=> self._d(`/officetransactions/${transactionId}`)
  };
}
