export function makeReportsAPI(self) {
  return {
    list:   ()  => self._g('/reports'),
    template: () => self._g('/reports/template'),
    get:    (id) => self._g(`/reports/${id}`),
    create: (b) => self._p('/reports', b),
    update: (id, b) => self._u(`/reports/${id}`, b),
    delete: (id) => self._d(`/reports/${id}`)
  };
}

export function makeRunReportsAPI(self) {
  return {
    run: (name, params, opts) => self._g(`/runreports/${encodeURIComponent(name)}`,
                                   { 'output-type': 'JSON', ...params }, opts),
    availableExports: (name) => self._g(`/runreports/availableExports/${encodeURIComponent(name)}`)
  };
}

export function makeCollectionSheetAPI(self) {
  return {
  get:  (params) => self._p('/collectionsheet', {}, { params }),
  save: (body)   => self._p('/collectionsheet?command=saveCollectionSheet', body)
};
}

export function makeAdhocQueriesAPI(self) {
  return {
    list:    () => self._g('/adhocquery'),
    template:() => self._g('/adhocquery/template'),
    get:     (id) => self._g(`/adhocquery/${id}`),
    create:  (b) => self._p('/adhocquery', b),
    update:  (id, b) => self._u(`/adhocquery/${id}`, b),
    delete:  (id) => self._d(`/adhocquery/${id}`),
    runAll:  () => self._p('/adhocquery?command=execute', {})
  };
}

export function makeEntityDatatableChecksAPI(self) {
  return {
    list:     (params) => self._g('/entityDatatableChecks', params),
    template: ()       => self._g('/entityDatatableChecks/template'),
    create:   (body)   => self._p('/entityDatatableChecks', body),
    delete:   (id)     => self._d(`/entityDatatableChecks/${id}`)
  };
}

export function makeDataTablesAPI(self) {
  return {
      list:       ()                  => self._g('/datatables'),
      get:        (name)              => self._g(`/datatables/${name}`),
      register:   (name, app, body)   => self._p(`/datatables/register/${name}/${app}`, body),
      deregister: (name)              => self._p(`/datatables/deregister/${name}`, {}),
      query:      (name, entityId)    => self._g(`/datatables/${name}/${entityId}`),
      create:     (body)              => self._p('/datatables', body),
      updateSchema:(name, body)       => self._u(`/datatables/${name}`, body),
      update:     (name, eid, body)   => self._u(`/datatables/${name}/${eid}`, body),
      delete:     (name, eid)         => self._d(`/datatables/${name}/${eid}`),
      deleteTable:(name)              => self._d(`/datatables/${name}`),

      createEntry: (name, entityId, body) => self._p(`/datatables/${name}/${entityId}`, body),
      getEntry:    (name, entityId, datatableId) => self._g(`/datatables/${name}/${entityId}/${datatableId}`),
      updateEntryOneToMany: (name, entityId, datatableId, body) => self._u(`/datatables/${name}/${entityId}/${datatableId}`, body),
      deleteEntry: (name, entityId, datatableId) => self._d(`/datatables/${name}/${entityId}/${datatableId}`),

      advancedQuery:     (name, params) => self._g(`/datatables/${name}/query`, params),
      advancedQueryPost: (name, body)   => self._p(`/datatables/${name}/query`, body)
    };
}
