/* FinCraft · js/auth-basic.js
   ---------------------------------------------------------------------------
   Basic (username / password) authentication for FinCraft against Fineract's
   `/authentication` endpoint, plus everything that only applies to a password
   session: two-factor (OTP), must-change-password, forgot-password, and
   re-hydrating a saved Basic session on startup.

   OAuth2/OIDC lives in auth-oidc.js. Both build on the shared plumbing in
   auth-core.js. Public names are re-exported from auth.js, so nothing outside
   changes.
*/
import {
  api, store, configureAPI,
  _extractPerms, finishLogin, _clearSession, _persistUserContext,
  showApp,
} from './auth-core.js';

/* ------------------------------------------------------------------ */
/* Password sign-in                                                    */
/* ------------------------------------------------------------------ */

export async function login({ serverUrl, tenantId, username, password }) {
  configureAPI({ serverUrl, tenantId });

  const authResponse = await api.auth(username, password);
  const token = authResponse?.base64EncodedAuthenticationKey;
  if (!token) throw new Error('Authentication failed — check credentials');
  configureAPI({ authToken: token });

  const authPerms = _extractPerms(authResponse);

  store.set('auth', {
    serverUrl, tenantId, username, authToken: token,
    userId:     authResponse.userId,
    officeId:   authResponse.officeId,
    officeName: authResponse.officeName,
    roles:      Array.isArray(authResponse.roles) ? authResponse.roles : []
  });
  store.set('perms', authPerms);

  if (authResponse.shouldRenewPassword) {
    throw Object.assign(new Error('PASSWORD_RESET_REQUIRED'), { code: 'PASSWORD_RESET_REQUIRED' });
  }

  await _continueAfterCredentials({ serverUrl, tenantId, username, authPerms });
}

async function _continueAfterCredentials({ serverUrl, tenantId, username, authPerms }) {
  if (await isTwoFactorRequired()) {
    throw Object.assign(new Error('OTP_REQUIRED'), { code: 'OTP_REQUIRED' });
  }

  await finishLogin({ serverUrl, tenantId, username, authPerms });
}

export async function completeMustChangePassword({ password, repeatPassword }) {
  await changePassword({ password, repeatPassword });
  const auth = store.get('auth') || {};
  await _continueAfterCredentials({
    serverUrl: auth.serverUrl,
    tenantId:  auth.tenantId,
    username:  auth.username,
    authPerms: store.get('perms') || []
  });
}

export async function completeTwoFactorLogin(tfaToken) {
  if (tfaToken) configureAPI({ tfaToken });
  const auth = store.get('auth') || {};
  if (tfaToken) store.set('auth', { ...auth, tfaToken });
  await finishLogin({
    serverUrl: auth.serverUrl,
    tenantId:  auth.tenantId,
    username:  auth.username,
    authPerms: store.get('perms') || []
  });
}

/* ------------------------------------------------------------------ */
/* Session restore (Basic)                                             */
/* ------------------------------------------------------------------ */

// Re-hydrate a saved Basic session. Returns true if the app was shown, false
// if the caller should fall through to the login screen. Never throws.
export async function restoreBasicSession(saved) {
  configureAPI(saved);
  try {
    const me = await api.userDetails.self();
    _persistUserContext(me);
    console.log('[auth] Restored session with', (store.get('perms') || []).length, 'permissions');
    showApp();
    return true;
  } catch (e) {
    if (e.status === 401 || e.status === 403) {
      _clearSession();
      return false;
    }
    console.warn('[auth] /userdetails failed, using cached perms:', e.message);
    if (Array.isArray(store.get('perms')) && store.get('perms').length) {
      showApp();
      return true;
    }
    _clearSession();
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Password operations                                                 */
/* ------------------------------------------------------------------ */

export async function changePassword({ password, repeatPassword }) {
  const auth = store.get('auth');
  if (!auth?.userId) throw new Error('Not signed in');
  if (!password || password !== repeatPassword) throw new Error('Passwords do not match');
  return api.password.change(auth.userId, { password, repeatPassword });
}

export async function forgotPassword({ serverUrl, tenantId, username, email }) {
  if (!username && !email) throw new Error('Provide username or email');
  if (serverUrl || tenantId) configureAPI({ serverUrl, tenantId });
  return api.password.forgot({ username, email });
}

/* ------------------------------------------------------------------ */
/* Two-factor (OTP)                                                    */
/* ------------------------------------------------------------------ */

export async function isTwoFactorRequired() {
  try {
    const cfg = await api.twoFactor.config.get();
    const flag = Array.isArray(cfg) ? cfg.find(c => /enable/i.test(c.name)) : null;
    return !!(flag && (flag.value === true || flag.value === 'true' || flag.value === 1));
  } catch { return false; }
}

export const getOtpMethods = ()                                  => api.twoFactor.methods();
export const requestOtp    = (deliveryMethod, extendedToken = false) =>
  api.twoFactor.request({ deliveryMethod, extendedToken });
export const validateOtp   = (token)                             => api.twoFactor.validate(token);
