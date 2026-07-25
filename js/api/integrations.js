export function makeNotificationsAPI(self) {
  return {
    list:        (params) => self._g('/notifications', params),
    markAllRead: ()       => self._u('/notifications', { isRead: true })
  };
}

export function makeHooksAPI(self) {
  return {
    list:    ()        => self._g('/hooks'),
    get:     (id)      => self._g(`/hooks/${id}`),
    template:()        => self._g('/hooks/template'),
    create:  (b)       => self._p('/hooks', b),
    update:  (id, b)   => self._u(`/hooks/${id}`, b),
    delete:  (id)      => self._d(`/hooks/${id}`)
  };
}

export function makeExternalServicesAPI(self) {
  return {
    sms:         { list: () => self._g('/externalservice/SMS'),         update: (b) => self._u('/externalservice/SMS', b) },
    email:       { list: () => self._g('/externalservice/SMTP'),        update: (b) => self._u('/externalservice/SMTP', b) },
    smtpEmail:   { list: () => self._g('/externalservice/SMTP'),        update: (b) => self._u('/externalservice/SMTP', b) },
    s3:          { list: () => self._g('/externalservice/S3'),          update: (b) => self._u('/externalservice/S3', b) },
    notification:{ list: () => self._g('/externalservice/NOTIFICATION'),update: (b) => self._u('/externalservice/NOTIFICATION', b) }
  };
}

export function makeExternalEventsAPI(self) {
  return {
    configurations: ()       => self._g('/externalevents/configuration'),
    updateConfig:   (b)      => self._u('/externalevents/configuration', b)
  };
}

export function makeSmsCampaignsAPI(self) {
  return {
    list: () => self._g('/smscampaigns'),
    get: (id) => self._g(`/smscampaigns/${id}`),
    template: () => self._g('/smscampaigns/template'),
    create: (b) => self._p('/smscampaigns', b),
    update: (id, b) => self._u(`/smscampaigns/${id}`, b),
    delete: (id) => self._d(`/smscampaigns/${id}`),
    activate: (id) => self._p(`/smscampaigns/${id}?command=activate`, {}),
    close: (id) => self._p(`/smscampaigns/${id}?command=close`, {}),
    reactivate: (id) => self._p(`/smscampaigns/${id}?command=reactivate`, {}),
    preview: (body) => self._p('/smscampaigns/preview', body)
  };
}

export function makeSmsAPI(self) {
  return {
    list:            (params) => self._g('/sms', params),
    get:              (id)    => self._g(`/sms/${id}`),
    create:           (body)  => self._p('/sms', body),
    update:           (id, body) => self._u(`/sms/${id}`, body),
    delete:           (id)    => self._d(`/sms/${id}`),
    messagesByStatus: (campaignId, params) => self._g(`/sms/${campaignId}/messageByStatus`, params)
  };
}

export function makeEmailAPI(self) {
  return {
    list:          (params) => self._g('/email', params),
    get:           (id)     => self._g(`/email/${id}`),
    create:        (body)   => self._p('/email', body),
    update:        (id, body) => self._u(`/email/${id}`, body),
    delete:        (id)     => self._d(`/email/${id}`),
    pending:       (params) => self._g('/email/pendingEmail', params),
    sent:          (params) => self._g('/email/sentEmail', params),
    failed:        (params) => self._g('/email/failedEmail', params),
    byStatus:      (params) => self._g('/email/messageByStatus', params)
  };
}

export function makeEmailCampaignsAPI(self) {
  return {
    list:            ()          => self._g('/email/campaign'),
    get:             (id)        => self._g(`/email/campaign/${id}`),
    template:        ()          => self._g('/email/campaign/template'),
    templateDetail:  (id)        => self._g(`/email/campaign/template/${id}`),
    create:          (body)      => self._p('/email/campaign', body),
    update:          (id, body)  => self._u(`/email/campaign/${id}`, body),
    delete:          (id)        => self._d(`/email/campaign/${id}`),
    operate:         (id, command, body) => self._p(`/email/campaign/${id}?command=${command}`, body || {}),
    activate:        (id) => self._p(`/email/campaign/${id}?command=activate`, {}),
    close:           (id) => self._p(`/email/campaign/${id}?command=close`, {}),
    reactivate:      (id) => self._p(`/email/campaign/${id}?command=reactivate`, {}),
    preview:         (body) => self._p('/email/campaign/preview', body)
  };
}

export function makeEmailConfigurationAPI(self) {
  return {
    list:   () => self._g('/email/configuration'),
    update: (body) => self._u('/email/configuration', body)
  };
}
