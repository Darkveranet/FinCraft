export function makeScorecardsAPI(self) {
  return {
    byClient:          (clientId)            => self._g(`/surveys/scorecards/clients/${clientId}`),
    bySurvey:          (surveyId)            => self._g(`/surveys/scorecards/${surveyId}`),
    create:            (surveyId, body)      => self._p(`/surveys/scorecards/${surveyId}`, body),
    bySurveyAndClient: (surveyId, clientId)  => self._g(`/surveys/scorecards/${surveyId}/clients/${clientId}`),
    lookupTables:      (surveyId)            => self._g(`/surveys/${surveyId}/lookuptables`),
    createLookupTable: (surveyId, body)      => self._p(`/surveys/${surveyId}/lookuptables`, body),
    getLookupTable:    (surveyId, key)       => self._g(`/surveys/${surveyId}/lookuptables/${encodeURIComponent(key)}`)
  };
}

export function makeSurveyDataAPI(self) {
  return {
    list:        ()                                => self._g('/survey'),
    get:         (surveyName)                      => self._g(`/survey/${encodeURIComponent(surveyName)}`),
    register:    (surveyName, apptable, body)      => self._u(`/survey/register/${encodeURIComponent(surveyName)}/${encodeURIComponent(apptable)}`, body || {}),
    createEntry: (surveyName, apptableId, body)    => self._p(`/survey/${encodeURIComponent(surveyName)}/${apptableId}`, body),
    clientOverview: (surveyName, clientId)         => self._g(`/survey/${encodeURIComponent(surveyName)}/${clientId}`),
    getEntry:       (surveyName, clientId, entryId)=> self._g(`/survey/${encodeURIComponent(surveyName)}/${clientId}/${entryId}`),
    deleteEntry:    (surveyName, clientId, fulfilledId) => self._d(`/survey/${encodeURIComponent(surveyName)}/${clientId}/${fulfilledId}`)
  };
}

export function makeLikelihoodAPI(self) {
  return {
    list:   (ppiName)                 => self._g(`/likelihood/${encodeURIComponent(ppiName)}`),
    get:    (ppiName, likelihoodId)   => self._g(`/likelihood/${encodeURIComponent(ppiName)}/${likelihoodId}`),
    update: (ppiName, likelihoodId, b)=> self._u(`/likelihood/${encodeURIComponent(ppiName)}/${likelihoodId}`, b)
  };
}

export function makePovertyLineAPI(self) {
  return {
    list: (ppiName)                => self._g(`/povertyLine/${encodeURIComponent(ppiName)}`),
    get:  (ppiName, likelihoodId)  => self._g(`/povertyLine/${encodeURIComponent(ppiName)}/${likelihoodId}`)
  };
}
