export function makeInterestRateChartsAPI(self) {
  return {
    list:     (params)  => self._g('/interestratecharts', params),
    get:      (chartId) => self._g(`/interestratecharts/${chartId}`),
    template: ()        => self._g('/interestratecharts/template'),
    create:   (body)    => self._p('/interestratecharts', body),
    update:   (chartId, body) => self._u(`/interestratecharts/${chartId}`, body),
    delete:   (chartId) => self._d(`/interestratecharts/${chartId}`),

    slabs:          (chartId)             => self._g(`/interestratecharts/${chartId}/chartslabs`),
    slabTemplate:   (chartId)             => self._g(`/interestratecharts/${chartId}/chartslabs/template`),
    getSlab:        (chartId, slabId)     => self._g(`/interestratecharts/${chartId}/chartslabs/${slabId}`),
    createSlab:     (chartId, body)       => self._p(`/interestratecharts/${chartId}/chartslabs`, body),
    updateSlab:     (chartId, slabId, b)  => self._u(`/interestratecharts/${chartId}/chartslabs/${slabId}`, b),
    deleteSlab:     (chartId, slabId)     => self._d(`/interestratecharts/${chartId}/chartslabs/${slabId}`)
  };
}
