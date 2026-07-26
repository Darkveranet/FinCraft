export const LOCALE      = 'en';
export const DATE_FORMAT = 'yyyy-MM-dd';

export function today() {
  return new Date().toISOString().split('T')[0];
}

export const FINERACT_DEMO = {
  serverUrl:  'https://demo.mifos.io',
  tenantId:   'default',
  apiBase:    '/fineract-provider/api/v1',
  requestTimeoutMs:     45000,
  autoConnectTimeoutMs: 15000
};

/* OAuth2 / OIDC (Zitadel, Keycloak, …) sign-in defaults.
   FinCraft uses the Authorization Code + PKCE flow — a *public* client, so NO
   client secret is stored in the browser. These are only sensible defaults; the
   user can override issuer/clientId on the login screen (persisted locally).

   To use SSO end-to-end the Fineract server must be started in OAuth mode:
     FINERACT_SECURITY_BASICAUTH_ENABLED=false
     FINERACT_SECURITY_OAUTH_ENABLED=true
     FINERACT_SERVER_OAUTH_RESOURCE_URL=<issuer>
   and the IdP must issue the Fineract username in the token's `sub` claim. */
export const OIDC_DEFAULT = {
  enabled:   true,
  issuer:    '',                       // e.g. https://your-instance.zitadel.cloud
  clientId:  '',                       // Zitadel application (User Agent / SPA) client id
  // openid: required · profile/email: username claims · offline_access: refresh token
  scopes:    'openid profile email offline_access',
  // Where the IdP redirects back to. Empty ⇒ computed at runtime as the app's
  // own origin+path (see js/oidc.js :: defaultRedirectUri).
  redirectUri: '',
  // Extra Zitadel scope so the access token carries Fineract project roles; the
  // {ProjectID} placeholder is substituted from projectId below when present.
  projectId: '',
  providerLabel: 'Zitadel'
};

export function getRuntimeConfig() {
  return {
    apiBase:              FINERACT_DEMO.apiBase,
    requestTimeoutMs:     FINERACT_DEMO.requestTimeoutMs,
    autoConnectTimeoutMs: FINERACT_DEMO.autoConnectTimeoutMs
  };
}
