export function makeUsersAPI(self) {
  return {
    list:   ()       => self._g('/users'),
    get:    (id)     => self._g(`/users/${id}`),
    template:()      => self._g('/users/template'),
    create: (body)   => self._p('/users', body),
    update: (id, b)  => self._u(`/users/${id}`, b),
    delete: (id)     => self._d(`/users/${id}`)
  };
}

export function makeRolesAPI(self) {
  return {
    list:       ()         => self._g('/roles'),
    get:        (id)       => self._g(`/roles/${id}`),
    create:     (body)     => self._p('/roles', body),
    update:     (id, b)    => self._u(`/roles/${id}`, b),
    delete:     (id)       => self._d(`/roles/${id}`),
    enable:     (id)       => self._p(`/roles/${id}?command=enable`, {}),
    disable:    (id)       => self._p(`/roles/${id}?command=disable`, {}),
    permissions:(id)       => self._g(`/roles/${id}/permissions`),
    updatePermissions:(id, b) => self._u(`/roles/${id}/permissions`, b)
  };
}

export function makePermissionsAPI(self) {
  return {
    list: (makerCheckerable) => self._g('/permissions', makerCheckerable ? { makerCheckerable: true } : undefined),
    update: (b) => self._u('/permissions', b)
  };
}

export function makeJobsAPI(self) {
  return {
    list:    ()        => self._g('/jobs'),
    get:     (id)      => self._g(`/jobs/${id}`),
    update:  (id, b)   => self._u(`/jobs/${id}`, b),
    runJob:  (id)      => self._p(`/jobs/${id}?command=executeJob`, {}),
    history: (id, params) => self._g(`/jobs/${id}/runhistory`, params),
    businessJobNames:  ()               => self._g('/jobs/names'),
    availableSteps:    (jobName)        => self._g(`/jobs/${encodeURIComponent(jobName)}/available-steps`),
    steps:             (jobName)        => self._g(`/jobs/${encodeURIComponent(jobName)}/steps`),
    updateSteps:       (jobName, body)  => self._u(`/jobs/${encodeURIComponent(jobName)}/steps`, body),
    executeInline:     (jobName, body)  => self._p(`/jobs/${encodeURIComponent(jobName)}/inline`, body || {}),
    getByShortName:     (shortName)        => self._g(`/jobs/short-name/${encodeURIComponent(shortName)}`),
    executeByShortName: (shortName, body)  => self._p(`/jobs/short-name/${encodeURIComponent(shortName)}`, body || {}),
    updateByShortName:  (shortName, body)  => self._u(`/jobs/short-name/${encodeURIComponent(shortName)}`, body),
    historyByShortName: (shortName, params)=> self._g(`/jobs/short-name/${encodeURIComponent(shortName)}/runhistory`, params)
  };
}

export function makeAuditsAPI(self) {
  return {
    list:           (params) => self._g('/audits', params),
    get:            (id)     => self._g(`/audits/${id}`),
    searchTemplate: ()       => self._g('/audits/searchtemplate')
  };
}

export function makeMakercheckerAPI(self) {
  return {
    list:    (params) => self._g('/makercheckers', params),
    template:()       => self._g('/makercheckers/searchtemplate'),
    approve: (id)     => self._p(`/makercheckers/${id}?command=approve`, {}),
    reject:  (id)     => self._p(`/makercheckers/${id}?command=reject`, {}),
    delete:  (id)     => self._d(`/makercheckers/${id}`)
  };
}

export function makeConfigurationsAPI(self) {
  return {
    list:        ()         => self._g('/configurations'),
    get:         (name)     => self._g(`/configurations/name/${name}`),
    getById:     (id)       => self._g(`/configurations/${id}`),
    update:      (id, body) => self._u(`/configurations/${id}`, body),
    updateByName:(name, body) => self._u(`/configurations/name/${name}`, body),
    cacheTypes:  ()         => self._g('/caches'),
    switchCache: (body)     => self._u('/caches', body),
    globalConfig: {
      list:   ()           => self._g('/configurations'),
      update: (id, body)   => self._u(`/configurations/${id}`, body)
    }
  };
}

export function makeSurveysAdminAPI(self) {
  return {
    list:       () => self._g('/surveys'),
    get:        (id) => self._g(`/surveys/${id}`),
    create:     (body) => self._p('/surveys', body),
    update:     (id, b) => self._u(`/surveys/${id}`, b),
    activate:   (id) => self._p(`/surveys/${id}?command=activate`, {}),
    deactivate: (id) => self._p(`/surveys/${id}?command=deactivate`, {})
  };
}

export function makeEntityToEntityMappingsAPI(self) {
  return {
    list:     ()                  => self._g('/entitytoentitymapping'),
    get:      (mappingTypeId)     => self._g(`/entitytoentitymapping/${mappingTypeId}`),
    getMapping: (mapId, fromId, toId) => self._g(`/entitytoentitymapping/${mapId}/${fromId}/${toId}`),
    create:     (relId, body)     => self._p(`/entitytoentitymapping/${relId}`, body),
    update:   (mappingTypeId, b)  => self._u(`/entitytoentitymapping/${mappingTypeId}`, b),
    delete:     (mapId)           => self._d(`/entitytoentitymapping/${mapId}`)
  };
}

export function makeSchedulerAPI(self) {
  return {
    status: ()        => self._g('/scheduler'),
    start:  ()        => self._p('/scheduler?command=start', {}),
    stop:   ()        => self._p('/scheduler?command=stop', {}),
    command:(command) => self._p(`/scheduler?command=${encodeURIComponent(command)}`, {})
  };
}

export function makeInstanceModeAPI(self) {
  return {
    update: (body) => self._u('/instance-mode', body)
  };
}

export function makeFieldConfigurationAPI(self) {
  return {
    get: (entity) => self._g(`/fieldconfiguration/${encodeURIComponent(entity)}`)
  };
}

export function makeAccountNumberPreferencesAPI(self) {
  return {
    list:     ()         => self._g('/accountnumberformats'),
    get:      (id)       => self._g(`/accountnumberformats/${id}`),
    template: ()         => self._g('/accountnumberformats/template'),
    create:   (body)     => self._p('/accountnumberformats', body),
    update:   (id, body) => self._u(`/accountnumberformats/${id}`, body),
    delete:   (id)       => self._d(`/accountnumberformats/${id}`)
  };
}
