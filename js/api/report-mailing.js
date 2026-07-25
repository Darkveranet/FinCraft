export function makeReportMailingJobsAPI(self) {
  return {
    list:     (params) => self._g('/reportmailingjobs', params),
    get:      (id)     => self._g(`/reportmailingjobs/${id}`),
    template: ()       => self._g('/reportmailingjobs/template'),
    create:   (body)   => self._p('/reportmailingjobs', body),
    update:   (id, b)  => self._u(`/reportmailingjobs/${id}`, b),
    delete:   (id)     => self._d(`/reportmailingjobs/${id}`),
    runHistory: (params) => self._g('/reportmailingjobrunhistory', params)
  };
}
