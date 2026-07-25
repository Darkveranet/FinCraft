export function makeChargesAPI(self) {
  return {
    list:   (params) => self._g('/charges', params),
    listByAppliesTo: async (appliesToId) => {
      const r = await self._g('/charges');
      const all = Array.isArray(r) ? r : (r?.pageItems || []);
      if (appliesToId == null) return all;
      return all.filter(ch => String(ch.chargeAppliesTo?.id) === String(appliesToId));
    },
    get:    (id)     => self._g(`/charges/${id}`),
    template:()      => self._g('/charges/template'),
    create: (body)   => self._p('/charges', body),
    update: (id, b)  => self._u(`/charges/${id}`, b),
    delete: (id)     => self._d(`/charges/${id}`)
  };
}

export function makeTemplatesAPI(self) {
  return {
    list:           ()       => self._g('/templates'),
    get:            (id)     => self._g(`/templates/${id}`),
    template:       ()       => self._g('/templates/template'),
    templateForEdit:(id)     => self._g(`/templates/${id}/template`),
    create:         (body)   => self._p('/templates', body),
    update:         (id, b)  => self._u(`/templates/${id}`, b),
    delete:         (id)     => self._d(`/templates/${id}`),
    preview:        (id, body) => self._p(`/templates/${id}`, body || {})
  };
}

export function makeSelfServiceAPI(self) {
  return {
    users:        ()      => self._g('/self/userdetails'),
    register:     (body)  => self._p('/self/registration', body),
    activate:     (body)  => self._p('/self/registration/user', body),
    resetPassword:(body)  => self._p('/self/registration/resetpassword', body),
    beneficiaries:()      => self._g('/self/beneficiaries/tpt'),
    addBeneficiary:(body) => self._p('/self/beneficiaries/tpt', body),
    updateBeneficiary:(id, b) => self._u(`/self/beneficiaries/tpt/${id}`, b),
    deleteBeneficiary:(id) => self._d(`/self/beneficiaries/tpt/${id}`)
  };
}

export function makeSearchAPI(self) {
  return {
    search: (query, resource = 'clients,loans,groups') =>
      self._g('/search', { query, resource }),
    advanced: (body) => self._p('/search/advance', body),
    template: () => self._g('/search/template')
  };
}

export function makeBatchAPI(self) {
  return {
    submit: (requests, enclosingTransaction = false) => {
      const payload = requests.map(r => ({
        requestId: r.requestId,
        relativeUrl: r.relativeUrl,
        method: r.method,
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        ...(r.body !== undefined ? { body: JSON.stringify(r.body) } : {})
      }));
      return self._req('POST', '/batches', {
        params: enclosingTransaction ? { enclosingTransaction: 'true' } : undefined,
        body: payload
      }).then(results => (Array.isArray(results) ? results : []).map(r => ({
        ...r,
        ok: r.statusCode >= 200 && r.statusCode < 300,
        body: (() => { try { return JSON.parse(r.body); } catch { return r.body; } })()
      })));
    }
  };
}

export function makeDocumentsAPI(self) {
  return {
    list:     (entityType, entityId)             => self._g(`/${entityType}/${entityId}/documents`),
    get:      (entityType, entityId, docId)       => self._g(`/${entityType}/${entityId}/documents/${docId}`),
    download: (entityType, entityId, docId)       => self._req('GET', `/${entityType}/${entityId}/documents/${docId}/attachment`, { raw: true }),
    upload:   (entityType, entityId, formData)    => self._req('POST', `/${entityType}/${entityId}/documents`, { body: formData }),
    update:   (entityType, entityId, docId, formData) => self._req('PUT', `/${entityType}/${entityId}/documents/${docId}`, { body: formData }),
    delete:   (entityType, entityId, docId)       => self._d(`/${entityType}/${entityId}/documents/${docId}`)
  };
}

export function makeImagesAPI(self) {
  return {
    get:    (entityType, entityId) => self._req('GET', `/${entityType}/${entityId}/images`, { raw: true }),
    upload: (entityType, entityId, formData) => self._req('POST', `/${entityType}/${entityId}/images`, { body: formData }),
    update: (entityType, entityId, formData) => self._req('PUT', `/${entityType}/${entityId}/images`, { body: formData }),
    delete: (entityType, entityId) => self._d(`/${entityType}/${entityId}/images`)
  };
}

export function makeNotesAPI(self) {
  return {
    list:   (entityType, entityId)         => self._g(`/${entityType}/${entityId}/notes`),
    get:    (entityType, entityId, noteId) => self._g(`/${entityType}/${entityId}/notes/${noteId}`),
    create: (entityType, entityId, body)   => self._p(`/${entityType}/${entityId}/notes`, body),
    update: (entityType, entityId, noteId, body) => self._u(`/${entityType}/${entityId}/notes/${noteId}`, body),
    delete: (entityType, entityId, noteId) => self._d(`/${entityType}/${entityId}/notes/${noteId}`)
  };
}

export function makeTransfersAPI(self) {
  return {
    list:    (params) => self._g('/accounttransfers', params),
    create:  (body)   => self._p('/accounttransfers', body),
    refund:  (body)   => self._p('/accounttransfers/refundByTransfer', body),
    refundTemplate: (params) => self._g('/accounttransfers/templateRefundByTransfer', params),
    template:(params) => self._g('/accounttransfers/template', params),
    get:     (id)     => self._g(`/accounttransfers/${id}`),
    operate: (id, body) => self._p(`/accounttransfers/${id}`, body)
  };
}

export function makeStandingInstructionsAPI(self) {
  return {
    list:    (params)  => self._g('/standinginstructions', params),
    get:     (id)      => self._g(`/standinginstructions/${id}`),
    template:(params)  => self._g('/standinginstructions/template', params),
    create:  (body)    => self._p('/standinginstructions', body),
    update:  (id, b)   => self._u(`/standinginstructions/${id}`, b),
    history: (params)  => self._g('/standinginstructionrunhistory', params)
  };
}

export function makeCobAPI(self) {
  return {
    configurations: async () => {
      const namesRes = await self._g('/jobs/names');
      const jobNames = Array.isArray(namesRes) ? namesRes : (namesRes?.businessJobs || []);
      const perJob = await Promise.all(jobNames.map(jobName =>
        self._g(`/jobs/${encodeURIComponent(jobName)}/steps`)
          .then(cfg => ({ jobName: cfg?.jobName || jobName, steps: cfg?.businessSteps || [] }))
          .catch(() => ({ jobName, steps: [] }))
      ));
      const flat = [];
      for (const { jobName, steps } of perJob)
        for (const s of steps) flat.push({ stepName: s.stepName, jobName, order: s.order });
      return flat;
    },
    updateConfig:   (jobName, body) => self._u(`/jobs/${encodeURIComponent(jobName)}/steps`, body),
    businessDate: {
      get: () => self._g('/businessdate'),
      getByType: (type) => self._g(`/businessdate/${type}`),
      set: (body) => self._p('/businessdate', body)
    },
    catchUp: () => self._p('/loans/catch-up', {})
  };
}

export function makeBulkImportsAPI(self) {
  return {
      template: (entity, params)   => self._req('GET', `/${entity}/downloadtemplate`, { params, raw: true }),
      upload:   (entity, formData) => self._req('POST', `/${entity}/uploadtemplate`, { body: formData, headers: {} }),
      list:     (params)             => self._g('/imports', params),
      outputTemplateLocation: (importDocumentId) => self._g('/imports/getOutputTemplateLocation', { importDocumentId }),
      outputTemplate: (importDocumentId) => self._req('GET', '/imports/downloadOutputTemplate', { params: { importDocumentId }, raw: true })
    };
}
