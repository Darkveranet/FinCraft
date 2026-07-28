/* FinCraft · js/auth-core.js
   ---------------------------------------------------------------------------
   Shared authentication internals used by BOTH the Basic (username/password)
   flow (auth-basic.js) and the OAuth2/OIDC flow (auth-oidc.js).

   Keeping these here lets auth-basic.js and auth-oidc.js stay independent of
   each other (no cross-imports, no circular dependency), while auth.js remains
   the single public entry point that re-exports everything.

   This module deliberately holds NO DOM/UI code. The login/app shell rendering
   lives in auth.js; core talks to it through a tiny "view seam" (registerViews)
   so `finishLogin()` can show the app without importing the UI (which would be a
   circular import back into auth.js).
*/
import { api, configureAPI } from './api.js';
import { store } from './store.js';
import { OIDC_DEFAULT } from './config.js';
import * as oidc from './oidc.js';
import { saveRecentTenant as _saveRecentTenant } from './recent-tenants.js';

export const LOGIN_ID = 'loginScreen';
export const SHELL_ID = 'appShell';

// {serverUrl, tenantId} stashed across the IdP redirect for the OIDC flow.
export const OIDC_PENDING_KEY = 'fincraft.oidc.pending';

export function _oidcConfig() { return oidc.loadOidcConfig(OIDC_DEFAULT); }

/* ------------------------------------------------------------------ */
/* View seam — auth.js registers the real showLogin/showApp here so    */
/* core (and the basic/oidc flows) can drive the UI without importing  */
/* it (avoids a circular dependency).                                  */
/* ------------------------------------------------------------------ */

let _views = {
  showLogin: () => {},
  showApp:   () => {},
};

export function registerViews(views) {
  _views = { ..._views, ...views };
}

export function showLogin(banner) { return _views.showLogin(banner); }
export function showApp()         { return _views.showApp(); }

/* ------------------------------------------------------------------ */
/* Permission extraction / persistence                                 */
/* ------------------------------------------------------------------ */

export function _extractPerms(payload) {
  const out = new Set();
  const top = Array.isArray(payload?.permissions) ? payload.permissions : [];
  top.forEach(p => {
    const code = typeof p === 'string' ? p : p?.code;
    if (code) out.add(code);
  });
  const roles = Array.isArray(payload?.roles) ? payload.roles : [];
  roles.forEach(r => {
    const rolePerms = Array.isArray(r.permissions) ? r.permissions : [];
    rolePerms.forEach(p => {
      const code = typeof p === 'string' ? p : p?.code;
      const selected = typeof p === 'object' ? p.selected !== false : true;
      if (code && selected) out.add(code);
    });
  });
  return [...out];
}

export function _persistUserContext(me) {
  const auth = store.get('auth') || {};
  store.set('auth', {
    ...auth,
    userId:     me.userId ?? me.id ?? auth.userId,
    officeId:   me.officeId ?? auth.officeId,
    officeName: me.officeName ?? auth.officeName,
    roles:      Array.isArray(me.roles) && me.roles.length ? me.roles : auth.roles
  });

  const newPerms = _extractPerms(me);
  if (newPerms.length) {
    const existing = store.get('perms') || [];
    const merged = [...new Set([...existing, ...newPerms])];
    store.set('perms', merged);
  }
}

export async function _loadDefaultCurrency() {
  try {
    const res = await api.currencies.all();
    const selected = res?.selectedCurrencyOptions;
    const code = Array.isArray(selected) && selected.length ? selected[0].code : null;
    if (code) store.set('defaultCurrency', code);
  } catch (e) {
  }
}

export function canDo(code) { return store.hasPermission(code); }

export function _clearSession() {
  store.remove('auth');
  store.set('perms', []);
  store.set('offline', false);
  api.reset();
}

/* ------------------------------------------------------------------ */
/* finishLogin — the common tail of every successful sign-in path.     */
/* ------------------------------------------------------------------ */

export async function finishLogin({ serverUrl, tenantId, username, authPerms }) {
  try {
    const me = await api.userDetails.self();
    _persistUserContext(me);
  } catch (e) {
    if (e.status === 401) {
      _clearSession();
      throw new Error('Server rejected the session token.');
    }
  }

  console.log('[auth] Signed in with', (store.get('perms') || []).length, 'permissions');
  _saveRecentTenant(serverUrl, tenantId, username);
  await _loadDefaultCurrency();
  showApp();
}

// Re-exported so the flow modules can reach the low-level plumbing without each
// importing api/store/configureAPI separately.
export { api, configureAPI, store };
