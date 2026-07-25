export function makeUserDetailsAPI(self) {
  return {
    self: () => self._g('/userdetails')
  };
}

export function makePasswordAPI(self) {
  return {
    forgot:      (body)         => self._p('/password/forgot', body),
    change:      (userId, body) => self._p(`/users/${userId}/pwd`, body),
    preferences: ()             => self._g('/passwordpreferences'),
    preferencesTemplate: ()     => self._g('/passwordpreferences/template'),
    updatePreferences: (body)   => self._u('/passwordpreferences', body)
  };
}

export function makeTwoFactorAPI(self) {
  return {
    methods:  ()       => self._g('/twofactor'),
    request:  (params) => self._req('POST', '/twofactor',          { params }),
    validate: (token)  => self._req('POST', '/twofactor/validate', { params: { token } }),
    invalidate: (token) => self._p('/twofactor/invalidate', { token }),
    config:   {
      get:    ()  => self._g('/twofactor/configure'),
      update: (b) => self._u('/twofactor/configure', b)
    }
  };
}

export function makeTenantOidcAPI(self) {
  return {
    get:    (tenantId)    => self._g(`/tenants/${tenantId}/oidc-config`),
    create: (tenantId, b) => self._p(`/tenants/${tenantId}/oidc-config`, b),
    update: (tenantId, b) => self._u(`/tenants/${tenantId}/oidc-config`, b),
    delete: (tenantId)    => self._d(`/tenants/${tenantId}/oidc-config`)
  };
}
