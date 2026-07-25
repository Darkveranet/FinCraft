export function makeJournalEntriesAPI(self) {
  return {
    list:    (params)  => self._g('/journalentries', params),
    get:     (id)       => self._g(`/journalentries/${id}`),
    provisioning: (params) => self._g('/journalentries/provisioning', params),
    openingBalances: (params) => self._g('/journalentries/openingbalance', params),
    create:  (body)    => self._p('/journalentries', body),
    reverse: (txId, b) => self._p(`/journalentries/${txId}?command=reverse`, b || {})
  };
}

export function makeGlAccountsAPI(self) {
  return {
    list:   (params) => self._g('/glaccounts', params),
    get:    (id)     => self._g(`/glaccounts/${id}`),
    template:()      => self._g('/glaccounts/template'),
    create: (body)   => self._p('/glaccounts', body),
    update: (id, b)  => self._u(`/glaccounts/${id}`, b),
    delete: (id)     => self._d(`/glaccounts/${id}`),

    getBalance:       (id)     => self._g(`/glaccounts/${id}`, { fetchRunningBalance: true }),
    listWithBalances: (params) => self._g('/glaccounts', { ...params, fetchRunningBalance: true }),

    async computeOfficeBalance(glAccountId, officeId, { toDate, accountType, manualEntriesOnly } = {}) {
      const debitIncreases = accountType === 1 || accountType === 5;
      let net = 0, offset = 0;
      const limit = 200;
      for (;;) {
        const page = await self._g('/journalentries', {
          glAccountId, officeId, toDate, manualEntriesOnly, offset, limit
        });
        const rows = page?.pageItems ?? (Array.isArray(page) ? page : []);
        for (const row of rows) {
          const isDebit = row?.entryType?.code === 'journalEntryType.debit' || row?.entryType?.id === 2;
          const amt = Number(row?.amount) || 0;
          net += (isDebit === debitIncreases) ? amt : -amt;
        }
        if (rows.length < limit) break;
        offset += limit;
      }
      return net;
    }
  };
}

export function makeGlClosuresAPI(self) {
  return {
    list: () => self._g('/glclosures'),
    get:  (id) => self._g(`/glclosures/${id}`),
    create: (b) => self._p('/glclosures', b),
    update: (id, b) => self._u(`/glclosures/${id}`, b),
    delete: (id) => self._d(`/glclosures/${id}`)
  };
}

export function makeAccountingRulesAPI(self) {
  return {
    list: () => self._g('/accountingrules'),
    get: (id) => self._g(`/accountingrules/${id}`),
    template: () => self._g('/accountingrules/template'),
    create: (b) => self._p('/accountingrules', b),
    update: (id, b) => self._u(`/accountingrules/${id}`, b),
    delete: (id) => self._d(`/accountingrules/${id}`)
  };
}

export function makeProvisioningAPI(self) {
  return {
    entries:        ()     => self._g('/provisioningentries'),
    entriesFiltered:(params) => self._g('/provisioningentries/entries', params),
    getEntry:       (id)   => self._g(`/provisioningentries/${id}`),
    criteria:       ()     => self._g('/provisioningcriteria'),
    criteriaTemplate: ()   => self._g('/provisioningcriteria/template'),
    getCriteria:    (id)   => self._g(`/provisioningcriteria/${id}`),
    createCriteria: (b)    => self._p('/provisioningcriteria', b),
    updateCriteria: (id,b) => self._u(`/provisioningcriteria/${id}`, b),
    deleteCriteria: (id)   => self._d(`/provisioningcriteria/${id}`),
    createEntry:    (b)    => self._p('/provisioningentries', b),
    createJournal:  (id)   => self._p(`/provisioningentries/${id}?command=createjournalentry`, {}),
    recreateEntry:  (id)   => self._p(`/provisioningentries/${id}?command=recreateprovisioningentry`, {})
  };
}

export function makeProvisioningCategoryAPI(self) {
  return {
    list:   ()     => self._g('/provisioningcategory'),
    create: (b)    => self._p('/provisioningcategory', b),
    update: (id,b) => self._u(`/provisioningcategory/${id}`, b),
    delete: (id)   => self._d(`/provisioningcategory/${id}`)
  };
}

export function makeRunAccrualsAPI(self) {
  return {
    run: (tillDate, b={}) => self._p('/runaccruals', { dateFormat: 'yyyy-MM-dd', locale: 'en', tillDate, ...b })
  };
}

export function makeOpeningBalancesAPI(self) {
  return {
    define: (officeId, body) => self._p(`/journalentries?command=defineOpeningBalance`, { ...body, officeId })
  };
}

export function makeFinancialActivityAccountsAPI(self) {
  return {
    list:   ()     => self._g('/financialactivityaccounts'),
    get:    (id)   => self._g(`/financialactivityaccounts/${id}`),
    template: ()   => self._g('/financialactivityaccounts/template'),
    create: (body) => self._p('/financialactivityaccounts', body),
    update: (id, b) => self._u(`/financialactivityaccounts/${id}`, b),
    delete: (id)   => self._d(`/financialactivityaccounts/${id}`)
  };
}

export function makeTaxComponentsAPI(self) {
  return {
      list:     () => self._g('/taxes/component'),
      get:      (id) => self._g(`/taxes/component/${id}`),
      template: () => self._g('/taxes/component/template'),
      create:   (b) => self._p('/taxes/component', b),
      update:   (id, b) => self._u(`/taxes/component/${id}`, b)
    };
}

export function makeTaxGroupsAPI(self) {
  return {
    list:     () => self._g('/taxes/group'),
    get:      (id) => self._g(`/taxes/group/${id}`),
    template: () => self._g('/taxes/group/template'),
    create:   (b) => self._p('/taxes/group', b),
    update:   (id, b) => self._u(`/taxes/group/${id}`, b)
  };
}
