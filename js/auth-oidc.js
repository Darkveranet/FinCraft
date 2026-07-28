/* FinCraft · js/auth-oidc.js
   ---------------------------------------------------------------------------
   OAuth2 / OIDC (e.g. Zitadel, Keycloak) sign-in for FinCraft — a thin wrapper
   over js/oidc.js that ties the pure OIDC helpers into the app's session store
   and shared auth core (auth-core.js).

   Responsibilities:
     • loginWithOidc        — start the Authorization Code + PKCE redirect;
     • completeOidcCallback — finish the flow when the IdP redirects back;
     • restoreBearerSession — re-hydrate a saved Bearer session (silent refresh);
     • the silent token-refresh timer (scheduleTokenRefresh / clearRefreshTimer).

   Public names are re-exported from auth.js, so nothing outside changes.
*/
import * as oidc from './oidc.js';
import { FINERACT_DEMO } from './config.js';
import {
  api, store, configureAPI,
  _oidcConfig, OIDC_PENDING_KEY,
  finishLogin, _persistUserContext, _loadDefaultCurrency,
  showApp,
} from './auth-core.js';

/* ------------------------------------------------------------------ */
/* Sign-in                                                             */
/* ------------------------------------------------------------------ */

// Called from the login screen "Sign in with SSO" button.
export async function loginWithOidc({ serverUrl, tenantId }) {
  const cfg = _oidcConfig();
  if (!oidc.isConfigured(cfg)) {
    throw new Error('SSO is not configured yet — set the Issuer URL and Client ID first.');
  }
  if (!serverUrl) throw new Error('Enter the Fineract Server URL before signing in with SSO.');
  // The Fineract server URL + tenant must survive the round-trip to the IdP.
  try { sessionStorage.setItem(OIDC_PENDING_KEY, JSON.stringify({ serverUrl, tenantId: tenantId || 'default' })); } catch {}
  await oidc.beginLogin(cfg);        // redirects the browser to the IdP
}

// Finish the flow when the IdP redirects back with ?code=…&state=…
export async function completeOidcCallback() {
  const cfg = _oidcConfig();
  const tokens = await oidc.handleCallback(cfg);       // validates state + PKCE, exchanges code
  oidc.cleanCallbackUrl();                             // strip ?code&state from the address bar

  let pending = {};
  try { pending = JSON.parse(sessionStorage.getItem(OIDC_PENDING_KEY) || '{}') || {}; } catch {}
  sessionStorage.removeItem(OIDC_PENDING_KEY);

  const serverUrl = pending.serverUrl || FINERACT_DEMO.serverUrl;
  const tenantId  = pending.tenantId  || 'default';

  configureAPI({ serverUrl, tenantId, authScheme: 'Bearer', bearerToken: tokens.accessToken });

  store.set('auth', {
    serverUrl, tenantId,
    username:     tokens.username || 'sso-user',
    authScheme:   'Bearer',
    bearerToken:  tokens.accessToken,
    refreshToken: tokens.refreshToken,
    idToken:      tokens.idToken,
    expiresAt:    tokens.expiresAt,
    roles:        []
  });
  store.set('perms', []);

  await finishLogin({ serverUrl, tenantId, username: tokens.username || 'sso-user', authPerms: [] });
  scheduleTokenRefresh();
}

/* ------------------------------------------------------------------ */
/* Session restore                                                     */
/* ------------------------------------------------------------------ */

// Re-hydrate a saved Bearer (OAuth2/OIDC) session, refreshing the access token
// first if it has expired / is near expiry. Throws on unrecoverable failure so
// initAuth can fall through to the login screen.
export async function restoreBearerSession(saved) {
  let bearer = saved.bearerToken;
  // Proactively refresh if the access token is expired/near-expiry.
  const expired = (saved.expiresAt && Date.now() >= saved.expiresAt - 30000) || oidc.isTokenExpired(bearer);
  if (expired) {
    if (!saved.refreshToken) throw new Error('Access token expired and no refresh token is available.');
    const cfg = _oidcConfig();
    const t = await oidc.refresh(cfg, saved.refreshToken);
    bearer = t.accessToken;
    store.set('auth', {
      ...saved,
      bearerToken:  t.accessToken,
      refreshToken: t.refreshToken || saved.refreshToken,
      idToken:      t.idToken || saved.idToken,
      expiresAt:    t.expiresAt
    });
  }
  configureAPI({ serverUrl: saved.serverUrl, tenantId: saved.tenantId, authScheme: 'Bearer', bearerToken: bearer });

  const me = await api.userDetails.self();
  _persistUserContext(me);
  console.log('[auth] Restored SSO session with', (store.get('perms') || []).length, 'permissions');
  await _loadDefaultCurrency();
  showApp();
  scheduleTokenRefresh();
}

/* ------------------------------------------------------------------ */
/* Silent token refresh                                                */
/* ------------------------------------------------------------------ */

let _refreshTimer = null;

export function clearRefreshTimer() {
  if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null; }
}

export function scheduleTokenRefresh() {
  clearRefreshTimer();
  const auth = store.get('auth') || {};
  if (auth.authScheme !== 'Bearer' || !auth.refreshToken || !auth.expiresAt) return;
  // Refresh ~60s before expiry (never sooner than 5s from now).
  const delay = Math.max(5000, auth.expiresAt - Date.now() - 60000);
  _refreshTimer = setTimeout(async () => {
    try {
      const cfg = _oidcConfig();
      const t = await oidc.refresh(cfg, auth.refreshToken);
      configureAPI({ authScheme: 'Bearer', bearerToken: t.accessToken });
      store.set('auth', {
        ...(store.get('auth') || {}),
        bearerToken:  t.accessToken,
        refreshToken: t.refreshToken || auth.refreshToken,
        idToken:      t.idToken || auth.idToken,
        expiresAt:    t.expiresAt
      });
      scheduleTokenRefresh();
    } catch (e) {
      console.warn('[auth] silent token refresh failed:', e.message);
    }
  }, delay);
}

/* ------------------------------------------------------------------ */
/* Logout helper — build the IdP end-session URL (single logout).      */
/* ------------------------------------------------------------------ */

// Best-effort: resolve the IdP end_session_endpoint and return the logout URL,
// or null if the IdP doesn't advertise one. Never throws.
export async function idpLogoutUrl(idToken) {
  try {
    const cfg = _oidcConfig();
    const meta = await oidc.discover(cfg.issuer);
    return oidc.logoutUrl(meta, {
      idToken,
      clientId: cfg.clientId,
      postLogoutRedirectUri: oidc.defaultRedirectUri()
    });
  } catch {
    return null;
  }
}
