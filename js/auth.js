/* FinCraft · js/auth.js
   ---------------------------------------------------------------------------
   Public authentication entry point + login/OTP/must-change UI.

   The auth logic is split across three modules (kept non-breaking by re-exporting
   the full public surface from here — external code still `import … from
   './auth.js'`):

     • auth-core.js  — shared plumbing (permission extraction, session persist,
                       finishLogin, the view seam);
     • auth-basic.js — username/password login, OTP, forgot/change password,
                       Basic session restore;
     • auth-oidc.js  — OAuth2/OIDC (Zitadel/Keycloak) sign-in, Bearer session
                       restore, silent token refresh.

   This file keeps: initAuth() orchestration, logout(), and the DOM rendering of
   the login screen. It registers its showLogin/showApp with auth-core so the
   flow modules can drive the UI without importing it (no circular dependency).
*/
import { store } from './store.js';
import { FINERACT_DEMO } from './config.js';
import * as oidc from './oidc.js';
import { escapeHtml } from './utils.js';
import { extractFineractError } from './ui/dom-helpers.js';
import {
  loadRecentTenants   as _loadRecentTenants,
  removeRecentTenant  as _removeRecentTenant,
} from './recent-tenants.js';

import {
  api,
  LOGIN_ID, SHELL_ID,
  _oidcConfig,
  _extractPerms, canDo, _clearSession,
  registerViews,
} from './auth-core.js';

import {
  login,
  completeMustChangePassword,
  completeTwoFactorLogin,
  changePassword,
  forgotPassword,
  isTwoFactorRequired,
  getOtpMethods, requestOtp, validateOtp,
  restoreBasicSession,
} from './auth-basic.js';

import {
  loginWithOidc,
  completeOidcCallback,
  restoreBearerSession,
  clearRefreshTimer,
  idpLogoutUrl,
} from './auth-oidc.js';

/* Re-export the public surface so external importers are unchanged. */
export {
  _extractPerms, canDo,
  login, loginWithOidc,
  completeMustChangePassword, completeTwoFactorLogin,
  changePassword, forgotPassword, isTwoFactorRequired,
  getOtpMethods, requestOtp, validateOtp,
};

// Let auth-core (and thus the flow modules) drive the UI through this seam.
registerViews({ showLogin, showApp });

/* ================================================================== */
/* Orchestration                                                       */
/* ================================================================== */

export async function initAuth() {
  api.onUnauthorized(() => {
    _clearSession();
    showLogin('Your session expired. Please sign in again.');
  });

  // 1) OAuth2/OIDC redirect coming back from the IdP (?code=…&state=…).
  if (oidc.isCallback()) {
    try {
      await completeOidcCallback();
      return;
    } catch (e) {
      oidc.cleanCallbackUrl();
      console.error('[auth] OIDC callback failed:', e);
      showLogin(e.message || 'SSO sign-in failed. Please try again.');
      return;
    }
  }

  const saved = store.get('auth');

  // 2) Restore a Bearer (OAuth2/OIDC) session, refreshing the token if it lapsed.
  if (saved?.bearerToken && saved?.serverUrl) {
    try {
      await restoreBearerSession(saved);
      return;
    } catch (e) {
      console.warn('[auth] Bearer session restore failed:', e.message);
      _clearSession();
    }
  }

  // 3) Restore a Basic (username/password) session.
  if (saved?.authToken && saved?.serverUrl) {
    if (await restoreBasicSession(saved)) return;
  }

  showLogin();
}

export function logout() {
  const auth = store.get('auth');
  if (auth?.tfaToken) {
    api.twoFactor.invalidate(auth.tfaToken).catch(() => {});
  }
  // For an SSO session, also end the IdP session (single logout) if the IdP
  // advertises an end_session_endpoint — best-effort, non-blocking.
  const wasBearer = auth?.authScheme === 'Bearer';
  const idToken = auth?.idToken;
  clearRefreshTimer();
  _clearSession();

  if (wasBearer) {
    idpLogoutUrl(idToken)
      .then(url => {
        if (url) { location.assign(url); return; }
        showLogin();
      })
      .catch(() => showLogin());
    return;
  }
  showLogin();
}

/* ================================================================== */
/* View shell                                                          */
/* ================================================================== */

function _isInsecureContext() {
  const proto = window.location.protocol;
  const host  = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost');
  return proto !== 'https:' && !isLocal;
}

function showLogin(banner) {
  if (_isInsecureContext()) {
    const httpsWarning = 'This page is not served over HTTPS. Login credentials are sent in plaintext and can be intercepted — do not sign in until this is served over HTTPS.';
    banner = banner ? `${httpsWarning} ${banner}` : httpsWarning;
  }
  const s = document.getElementById(SHELL_ID);
  const l = document.getElementById(LOGIN_ID);
  if (s) s.setAttribute('hidden', '');
  if (l) { l.removeAttribute('hidden'); renderLogin(l, banner); }
}

function showApp() {
  const l = document.getElementById(LOGIN_ID);
  if (l) l.setAttribute('hidden', '');
  import('./ui.js').then(m => {
    m.mountAppShell();
    import('./router.js').then(r => {
      if (!location.hash || location.hash === '#') {
        r.navigate(store.get('lastPage') || 'dashboard');
      }
      r.initRouter();
    });
  });
  import('./treasury/bootstrap.js')
    .then(b => b.initializeTreasuryTenant())
    .then(res => {
      if (res && res.provisioning && res.provisioning.created && res.provisioning.created.length) {
        console.log('[treasury-bootstrap] provisioned datatables:', res.provisioning.created.join(', '));
      }
      if (res && res.requiresSetup) {
        console.log('[treasury-bootstrap] office', res.office, 'needs treasury configuration (Settings)');
      }
    })
    .catch(err => console.warn('[treasury-bootstrap] skipped:', err && err.message ? err.message : err));
}

function renderLogin(container, banner) {
  const recents = _loadRecentTenants();
  const ssoCfg = _oidcConfig();
  const ssoConfigured = oidc.isConfigured(ssoCfg);
  const ssoLabel = ssoCfg.providerLabel || 'SSO';
  const recentChipsHtml = recents.length ? `
    <div class="mb-2" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="font-size:11px;color:var(--text-3,#8fa8c8);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-right:4px">Recent:</span>
      ${recents.map((t, i) => `
        <button type="button" class="tenant-chip" data-recent-idx="${i}"
                style="padding:4px 10px;font-size:11px;background:var(--bg-2,#0e1a2e);border:1px solid var(--border-1,#1a2d4a);border-radius:99px;color:var(--text-2,#e8f0fc);cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono,monospace);transition:all 200ms"
                title="${escapeHtml(t.tenantId)} on ${escapeHtml(t.serverUrl)}${t.username ? ' (last user: ' + escapeHtml(t.username) + ')' : ''}">
          <i class="fa-solid fa-server" style="font-size:9px;color:var(--brand-teal,#00c9b1)"></i>
          ${escapeHtml(t.tenantId)}
          <span class="tenant-chip-x" data-remove-idx="${i}" style="opacity:0.5;font-size:13px;margin-left:2px" title="Forget this tenant">×</span>
        </button>
      `).join('')}
    </div>` : '';

  container.innerHTML = /* scan-allow-innerhtml: audited-safe — numeric IDs / code-defined labels & icons / computed dates / pre-escaped HTML fragments (no raw user data) */ `
    <div class="login-wrap active" style="width:100%;height:100vh;display:flex">
      <div class="login-left">
        <div class="login-brand">
          <div class="login-logo-row">
            <div class="login-logo">F</div>
            <div>
              <div class="login-app-name">Fin<em>Craft</em></div>
              <div style="font-size:10px;color:var(--brand-teal);letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-top:2px">Fineract Platform</div>
            </div>
          </div>
          <div class="login-tagline">A unified microfinance platform — every feature from the Community App, Web App, and Field Officer App rebuilt with a modern interface.</div>
          <div class="login-features">
            <div class="login-feature"><div class="login-feature-icon"><i class="fa-solid fa-users"></i></div><div class="login-feature-text"><strong>Full Client Lifecycle</strong>Create, manage and track every client</div></div>
            <div class="login-feature"><div class="login-feature-icon"><i class="fa-solid fa-money-bill-wave"></i></div><div class="login-feature-text"><strong>Complete Loan Engine</strong>35+ actions, disbursements, repayments</div></div>
            <div class="login-feature"><div class="login-feature-icon"><i class="fa-solid fa-calculator"></i></div><div class="login-feature-text"><strong>Full Accounting GL</strong>COA, journal entries, closures</div></div>
            <div class="login-feature"><div class="login-feature-icon"><i class="fa-solid fa-chart-bar"></i></div><div class="login-feature-text"><strong>Reports & Analytics</strong>PAR, trial balance, ad hoc queries</div></div>
            <div class="login-feature"><div class="login-feature-icon"><i class="fa-solid fa-terminal"></i></div><div class="login-feature-text"><strong>Command Palette</strong>Jump anywhere instantly with Ctrl+K</div></div>
            <div class="login-feature"><div class="login-feature-icon"><i class="fa-solid fa-plug"></i></div><div class="login-feature-text"><strong>Live Fineract API</strong>Connects to any Fineract instance</div></div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-box">
          <div class="login-form-title">Welcome back</div>
          <div class="login-form-sub">Sign in to your FinCraft account</div>
          ${banner ? `<div class="msg-banner b-warning mb-4">${escapeHtml(banner)}</div>` : ''}
          <div id="login-error" class="msg-banner b-danger mb-4" style="display:none"></div>
          <div class="form-group mb-3"><label class="form-label">Server URL</label>
            <input id="l-server" class="form-control" value="${escapeHtml(FINERACT_DEMO.serverUrl)}"/></div>
          ${recentChipsHtml}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb-3">
            <div class="form-group"><label class="form-label">Tenant ID</label>
              <input id="l-tenant" class="form-control" value="${escapeHtml(FINERACT_DEMO.tenantId)}"/></div>
            <div class="form-group"><label class="form-label">Username</label>
              <input id="l-user" class="form-control" value="" autocomplete="username"/></div>
          </div>
          <div class="form-group mb-4"><label class="form-label">Password</label>
            <div class="input-group">
              <input id="l-pass" class="form-control" type="password" value="" autocomplete="current-password"/>
              <button class="btn btn-secondary" style="border-radius:0 6px 6px 0;border-left:none" type="button" data-toggle-password="l-pass"><i class="fa-solid fa-eye"></i></button>
            </div>
          </div>
          <button class="btn btn-primary btn-full" id="l-btn">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In
          </button>

          <div id="sso-block" style="margin-top:14px">
            <div style="display:flex;align-items:center;gap:10px;margin:6px 0 12px">
              <div style="flex:1;height:1px;background:var(--border-1,#1a2d4a)"></div>
              <span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--text-3,#8fa8c8);font-weight:700">or</span>
              <div style="flex:1;height:1px;background:var(--border-1,#1a2d4a)"></div>
            </div>
            <button class="btn btn-secondary btn-full" id="l-sso" type="button">
              <i class="fa-solid fa-shield-halved"></i> Sign in with SSO${ssoConfigured && ssoLabel ? ' (' + escapeHtml(ssoLabel) + ')' : ''}
            </button>
            <div style="text-align:center;margin-top:6px">
              <a href="#" id="l-sso-config" class="link" style="font-size:11px">${ssoConfigured ? 'SSO settings' : 'Configure SSO…'}</a>
            </div>
            <div id="sso-config-panel" hidden style="margin-top:10px;padding:12px;border:1px solid var(--border-1,#1a2d4a);border-radius:8px;background:var(--bg-2,#0e1a2e)">
              <div class="text-muted" style="font-size:11px;margin-bottom:8px">
                <i class="fa-solid fa-circle-info"></i>
                OpenID Connect (Authorization Code + PKCE). No client secret is stored. Add this app's URL as a redirect URI in your IdP.
              </div>
              <div class="form-group mb-2"><label class="form-label">Issuer URL</label>
                <input id="sso-issuer" class="form-control" placeholder="https://your-instance.zitadel.cloud" value="${escapeHtml(ssoCfg.issuer || '')}"/></div>
              <div class="form-group mb-2"><label class="form-label">Client ID</label>
                <input id="sso-clientid" class="form-control" value="${escapeHtml(ssoCfg.clientId || '')}"/></div>
              <div class="form-group mb-2"><label class="form-label">Project ID <span class="text-muted" style="font-weight:400">(optional, Zitadel roles)</span></label>
                <input id="sso-project" class="form-control" value="${escapeHtml(ssoCfg.projectId || '')}"/></div>
              <div class="text-muted" style="font-size:10px;margin-bottom:8px">Redirect URI: <code>${escapeHtml(oidc.defaultRedirectUri())}</code></div>
              <button class="btn btn-primary btn-sm" id="sso-save" type="button"><i class="fa-solid fa-check"></i> Save SSO settings</button>
            </div>
          </div>

          <div class="login-footer mt-3">
            <a href="#" id="l-forgot" class="link" style="font-size:12px">Forgot password?</a>
            &nbsp;·&nbsp; Demo: <b>mifos / password</b>
          </div>
        </div>
      </div>
    </div>`;

  const btn        = container.querySelector('#l-btn');
  const err        = container.querySelector('#login-error');
  const pass       = container.querySelector('#l-pass');
  const forgotLink = container.querySelector('#l-forgot');

  const showErr = (msg) => {
    err.classList.remove('b-success'); err.classList.add('b-danger');
    err.style.display = ''; err.textContent = msg;
  };
  const showOk = (msg) => {
    err.classList.remove('b-danger'); err.classList.add('b-success');
    err.style.display = ''; err.textContent = msg;
  };
  const setBusy = (on) => {
    btn.disabled = on;
    btn.innerHTML = on
      ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in…'
      : '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
  };

  const doLogin = async () => {
    const serverUrl = container.querySelector('#l-server').value.trim().replace(/\/$/, '');
    const tenantId  = container.querySelector('#l-tenant').value.trim() || 'default';
    const username  = container.querySelector('#l-user').value.trim();
    const password  = pass.value;
    if (!serverUrl || !username || !password) return showErr('Please fill in all fields');
    err.style.display = 'none';
    setBusy(true);
    try {
      await login({ serverUrl, tenantId, username, password });
    } catch (e) {
      if (e.code === 'OTP_REQUIRED')             { setBusy(false); return renderOtpStep(container); }
      if (e.code === 'PASSWORD_RESET_REQUIRED')  { setBusy(false); return renderMustChangePasswordStep(container); }
      if (e.status === 401)        showErr('Invalid username or password.');
      else if (e.code === 'TIMEOUT') showErr('Server did not respond. Check the URL and try again.');
      else                          showErr(e.message || 'Sign in failed.');
      setBusy(false);
    }
  };

  btn.addEventListener('click', doLogin);
  pass.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // --- SSO / OIDC wiring ------------------------------------------------
  const ssoBtn        = container.querySelector('#l-sso');
  const ssoConfigLink = container.querySelector('#l-sso-config');
  const ssoPanel      = container.querySelector('#sso-config-panel');
  const ssoSaveBtn    = container.querySelector('#sso-save');

  ssoConfigLink?.addEventListener('click', (e) => {
    e.preventDefault();
    if (ssoPanel) ssoPanel.hidden = !ssoPanel.hidden;
  });

  ssoSaveBtn?.addEventListener('click', () => {
    const issuer   = container.querySelector('#sso-issuer').value.trim().replace(/\/$/, '');
    const clientId = container.querySelector('#sso-clientid').value.trim();
    const projectId= container.querySelector('#sso-project').value.trim();
    oidc.saveOidcConfig({ issuer, clientId, projectId, enabled: true });
    showOk('SSO settings saved. You can now sign in with SSO.');
    renderLogin(container, banner);   // re-render so the button reflects configured state
  });

  ssoBtn?.addEventListener('click', async () => {
    const serverUrl = container.querySelector('#l-server').value.trim().replace(/\/$/, '');
    const tenantId  = container.querySelector('#l-tenant').value.trim() || 'default';
    if (!oidc.isConfigured(_oidcConfig())) {
      if (ssoPanel) ssoPanel.hidden = false;
      return showErr('Set the Issuer URL and Client ID first, then click "Sign in with SSO".');
    }
    if (!serverUrl) return showErr('Enter the Fineract Server URL first.');
    err.style.display = 'none';
    ssoBtn.disabled = true;
    ssoBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Redirecting to sign-in…';
    try {
      await loginWithOidc({ serverUrl, tenantId });   // redirects away
    } catch (e) {
      showErr(e.message || 'Could not start SSO sign-in.');
      ssoBtn.disabled = false;
      ssoBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Sign in with SSO';
    }
  });

  container.querySelectorAll('[data-recent-idx]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('tenant-chip-x')) return;
      const idx = parseInt(chip.dataset.recentIdx, 10);
      const list = _loadRecentTenants();
      const t = list[idx];
      if (!t) return;
      container.querySelector('#l-server').value = t.serverUrl;
      container.querySelector('#l-tenant').value = t.tenantId;
      if (t.username) container.querySelector('#l-user').value = t.username;
      container.querySelector('#l-pass').focus();
    });
  });

  container.querySelectorAll('[data-remove-idx]').forEach(x => {
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(x.dataset.removeIdx, 10);
      const list = _loadRecentTenants();
      const t = list[idx];
      if (!t) return;
      _removeRecentTenant(t.tenantId, t.serverUrl);
      renderLogin(container, banner);
    });
  });

  container.querySelectorAll('.tenant-chip').forEach(chip => {
    chip.addEventListener('mouseenter', () => {
      chip.style.borderColor = 'var(--brand-teal, #00c9b1)';
      chip.style.background = 'rgba(0,201,177,0.08)';
    });
    chip.addEventListener('mouseleave', () => {
      chip.style.borderColor = '';
      chip.style.background = '';
    });
  });

  forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const serverUrl = container.querySelector('#l-server').value.trim().replace(/\/$/, '');
    const tenantId  = container.querySelector('#l-tenant').value.trim() || 'default';
    const u = container.querySelector('#l-user').value.trim();
    if (!serverUrl) return showErr('Enter the server URL first, then click "Forgot password?".');
    if (!u) return showErr('Enter your username first, then click "Forgot password?".');
    try {
      await forgotPassword({ serverUrl, tenantId, username: u });
      showOk('If the account exists, a reset has been initiated.');
    } catch (ex) {
      showErr(extractFineractError(ex) || 'Could not initiate password reset.');
    }
  });
}

async function renderOtpStep(container) {
  let methods = [];
  try { methods = await getOtpMethods(); } catch { methods = []; }
  const methodOptions = (Array.isArray(methods) && methods.length ? methods : [{ name: 'Default', deliveryMethod: 'default' }])
    .map(m => `<option value="${escapeHtml(String(m.deliveryMethod ?? m.name))}">${escapeHtml(String(m.name ?? m.deliveryMethod))}</option>`).join('');

  container.innerHTML = /* scan-allow-innerhtml: audited-safe — numeric IDs / code-defined labels & icons / computed dates / pre-escaped HTML fragments (no raw user data) */ `
    <div class="login-wrap active" style="width:100%;height:100vh;display:flex;align-items:center;justify-content:center">
      <div class="login-form-box" style="max-width:420px">
        <div class="login-form-title">Two-factor verification</div>
        <div class="login-form-sub">This tenant requires a one-time code to finish signing in.</div>
        <div id="otp-error" class="msg-banner b-danger mb-4" style="display:none"></div>
        <div id="otp-info" class="msg-banner b-success mb-4" style="display:none"></div>
        ${methods.length > 1 ? `
        <div class="form-group mb-3"><label class="form-label">Delivery method</label>
          <select id="otp-method" class="form-control">${methodOptions}</select></div>` : ''}
        <div class="form-group mb-4"><label class="form-label">Verification code</label>
          <input id="otp-code" class="form-control" inputmode="numeric" autocomplete="one-time-code" placeholder="Enter the code sent to you"/></div>
        <button class="btn btn-primary btn-full" id="otp-send-btn" type="button">
          <i class="fa-solid fa-paper-plane"></i> Send code
        </button>
        <button class="btn btn-secondary btn-full mt-2" id="otp-verify-btn" type="button">
          <i class="fa-solid fa-check"></i> Verify &amp; sign in
        </button>
        <div class="login-footer mt-3">
          <a href="#" id="otp-back" class="link" style="font-size:12px">&larr; Back to sign in</a>
        </div>
      </div>
    </div>`;

  const err        = container.querySelector('#otp-error');
  const info       = container.querySelector('#otp-info');
  const codeInput  = container.querySelector('#otp-code');
  const methodSel  = container.querySelector('#otp-method');
  const sendBtn    = container.querySelector('#otp-send-btn');
  const verifyBtn  = container.querySelector('#otp-verify-btn');
  const backLink   = container.querySelector('#otp-back');

  const showErr  = (msg) => { info.style.display = 'none'; err.style.display = ''; err.textContent = msg; };
  const showInfo = (msg) => { err.style.display = 'none'; info.style.display = ''; info.textContent = msg; };

  sendBtn.addEventListener('click', async () => {
    sendBtn.disabled = true;
    try {
      const deliveryMethod = methodSel ? methodSel.value : (methods[0]?.deliveryMethod ?? 'default');
      await requestOtp(deliveryMethod);
      showInfo('A verification code has been sent. Enter it below.');
    } catch (ex) {
      showErr(extractFineractError(ex) || 'Could not send verification code.');
    } finally {
      sendBtn.disabled = false;
    }
  });

  verifyBtn.addEventListener('click', async () => {
    const code = codeInput.value.trim();
    if (!code) return showErr('Enter the verification code first.');
    verifyBtn.disabled = true;
    try {
      const result = await validateOtp(code);
      const tfaToken = result?.token ?? result?.authenticationToken ?? null;
      await completeTwoFactorLogin(tfaToken);
    } catch (ex) {
      showErr(extractFineractError(ex) || 'Invalid or expired code.');
      verifyBtn.disabled = false;
    }
  });

  codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') verifyBtn.click(); });

  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    _clearSession();
    renderLogin(container);
  });
}

function renderMustChangePasswordStep(container) {
  container.innerHTML = `
    <div class="login-wrap active" style="width:100%;height:100vh;display:flex;align-items:center;justify-content:center">
      <div class="login-form-box" style="max-width:420px">
        <div class="login-form-title">Set a new password</div>
        <div class="login-form-sub">Your password has expired or must be changed before you can continue.</div>
        <div id="mcp-error" class="msg-banner b-danger mb-4" style="display:none"></div>
        <div class="form-group mb-3"><label class="form-label">New password</label>
          <input id="mcp-new" class="form-control" type="password" autocomplete="new-password"/></div>
        <div class="form-group mb-4"><label class="form-label">Confirm new password</label>
          <input id="mcp-confirm" class="form-control" type="password" autocomplete="new-password"/></div>
        <button class="btn btn-primary btn-full" id="mcp-btn" type="button">
          <i class="fa-solid fa-key"></i> Set password &amp; sign in
        </button>
        <div class="login-footer mt-3">
          <a href="#" id="mcp-back" class="link" style="font-size:12px">&larr; Back to sign in</a>
        </div>
      </div>
    </div>`;

  const err       = container.querySelector('#mcp-error');
  const newPass   = container.querySelector('#mcp-new');
  const confirm   = container.querySelector('#mcp-confirm');
  const btn       = container.querySelector('#mcp-btn');
  const backLink  = container.querySelector('#mcp-back');

  const showErr = (msg) => { err.style.display = ''; err.textContent = msg; };
  const setBusy = (on) => {
    btn.disabled = on;
    btn.innerHTML = on
      ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Setting password…'
      : '<i class="fa-solid fa-key"></i> Set password &amp; sign in';
  };

  const submit = async () => {
    const password = newPass.value;
    const repeatPassword = confirm.value;
    if (!password || !repeatPassword) return showErr('Enter and confirm your new password.');
    if (password !== repeatPassword) return showErr('Passwords do not match.');
    err.style.display = 'none';
    setBusy(true);
    try {
      await completeMustChangePassword({ password, repeatPassword });
    } catch (ex) {
      if (ex.code === 'OTP_REQUIRED') { setBusy(false); return renderOtpStep(container); }
      showErr(extractFineractError(ex) || 'Could not set your new password.');
      setBusy(false);
    }
  };

  btn.addEventListener('click', submit);
  confirm.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    _clearSession();
    renderLogin(container);
  });
}
