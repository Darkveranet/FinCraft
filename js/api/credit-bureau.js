export function makeCreditBureauConfigAPI(self) {
  return {
    getCreditBureau:          () => self._g('/CreditBureauConfiguration'),
    organisationBureaus:      () => self._g('/CreditBureauConfiguration/organisationCreditBureau'),
    updateOrganisationBureau: (b) => self._u('/CreditBureauConfiguration/organisationCreditBureau', b),
    addOrganisationBureau:    (organisationCreditBureauId, b) =>
      self._p(`/CreditBureauConfiguration/organisationCreditBureau/${organisationCreditBureauId}`, b || {}),

    getConfiguration:      (organisationCreditBureauId) => self._g(`/CreditBureauConfiguration/config/${organisationCreditBureauId}`),
    createConfiguration:   (creditBureauId, b)          => self._p(`/CreditBureauConfiguration/configuration/${creditBureauId}`, b),
    updateConfiguration:   (configurationId, b)         => self._u(`/CreditBureauConfiguration/configuration/${configurationId}`, b),

    loanProducts:          () => self._g('/CreditBureauConfiguration/loanProduct'),
    mappingByLoanProduct:  (loanProductId) => self._g(`/CreditBureauConfiguration/loanProduct/${loanProductId}`),
    mappings:              () => self._g('/CreditBureauConfiguration/mappings'),
    updateMapping:         (b) => self._u('/CreditBureauConfiguration/mappings', b),
    createMapping:         (organisationCreditBureauId, b) =>
      self._p(`/CreditBureauConfiguration/mappings/${organisationCreditBureauId}`, b)
  };
}

export function makeCreditBureauIntegrationAPI(self) {
  return {
    fetchReport:     (body)          => self._p('/creditBureauIntegration/creditReport', body),
    addReport:       (body)          => self._p('/creditBureauIntegration/addCreditReport', body),
    saveReport:      (body)          => self._p('/creditBureauIntegration/saveCreditReport', body),
    getSavedReport:  (creditBureauId)=> self._g(`/creditBureauIntegration/creditReport/${creditBureauId}`),
    deleteReport:    (creditBureauId)=> self._d(`/creditBureauIntegration/deleteCreditReport/${creditBureauId}`)
  };
}
