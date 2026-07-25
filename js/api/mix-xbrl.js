export function makeMixXbrlAPI(self) {
  return {
    taxonomies:   ()       => self._g('/mixtaxonomy'),
    mapping:      ()       => self._g('/mixmapping'),
    updateMapping:(body)   => self._u('/mixmapping', body),
    report:       (params) => self._g('/mixreport', params)
  };
}
