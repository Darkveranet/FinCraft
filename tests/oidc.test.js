/* FinCraft · tests/oidc.test.js
   ---------------------------------------------------------------------------
   Unit tests for the OAuth2/OIDC (Zitadel) sign-in layer added in js/oidc.js,
   plus the Bearer-scheme support in js/api/core.js.

   Two sections:
     A. PURE HELPERS — base64url round-trip, PKCE (verifier charset/length +
        S256 challenge = base64url(SHA-256(verifier))), JWT decode, username
        extraction, expiry check, authorize-URL building, form encoding,
        Zitadel project scope, config load/save, token normalization, logout
        URL. These run on plain Node (crypto/TextEncoder/btoa are globals).
     B. BROWSER FLOW — discovery, beginLogin (PKCE stash + redirect), callback
        state validation + code exchange, and refresh, all with fetch / storage
        / location / crypto stubbed. Plus a core.js Bearer-vs-Basic header check.

   No jsdom needed — the few browser globals used are stubbed inline.
*/
import assert from 'assert';

function makeStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    clear: () => m.clear(),
    _map: m,
  };
}
const setGlobal = (name, value) => { try { Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); } catch { globalThis[name] = value; } };

// Minimal base64url JWT builder for tests (header.payload.sig, sig unused).
function makeJwt(payload) {
  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

export async function runTests({ assert: a = assert } = {}) {
  const oidc = await import('../js/oidc.js');

  /* ===================================================================== */
  /* A. PURE HELPERS                                                        */
  /* ===================================================================== */

  // base64url round-trip.
  const enc = oidc.base64UrlEncode(new TextEncoder().encode('Hello, Zitadel!'));
  a.strictEqual(/[+/=]/.test(enc), false, 'base64url output must not contain + / or =');
  a.strictEqual(oidc.base64UrlDecode(enc), 'Hello, Zitadel!', 'base64url decode must round-trip');

  // PKCE verifier: length clamped to 43..128, only unreserved chars.
  const v = oidc.generateCodeVerifier(64);
  a.strictEqual(v.length, 64);
  a.ok(/^[A-Za-z0-9\-._~]+$/.test(v), 'verifier must be from the unreserved set');
  a.strictEqual(oidc.generateCodeVerifier(10).length, 43, 'verifier length clamped up to 43');
  a.strictEqual(oidc.generateCodeVerifier(9999).length, 128, 'verifier length clamped down to 128');
  a.notStrictEqual(oidc.generateCodeVerifier(), oidc.generateCodeVerifier(), 'verifiers must be random');

  // PKCE challenge = base64url(SHA-256(verifier)). Verify against an independent
  // SHA-256 computed here.
  const challenge = await oidc.generateCodeChallenge('test_verifier_123');
  const { createHash } = await import('crypto');
  const expected = createHash('sha256').update('test_verifier_123').digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  a.strictEqual(challenge, expected, 'S256 challenge must equal base64url(SHA-256(verifier))');

  // random tokens.
  a.notStrictEqual(oidc.randomToken(), oidc.randomToken(), 'state/nonce tokens must differ');

  // JWT decode + username extraction + expiry.
  const jwt = makeJwt({ sub: 'user-123', preferred_username: 'mifos', exp: Math.floor(Date.now() / 1000) + 3600 });
  const claims = oidc.decodeJwt(jwt);
  a.strictEqual(claims.preferred_username, 'mifos');
  a.strictEqual(oidc.decodeJwt('not-a-jwt'), null, 'garbage → null');
  a.strictEqual(oidc.decodeJwt(null), null);
  a.strictEqual(oidc.usernameFromClaims(claims), 'mifos', 'prefer preferred_username');
  a.strictEqual(oidc.usernameFromClaims({ sub: 'abc' }), 'abc', 'fall back to sub');
  a.strictEqual(oidc.usernameFromClaims({ email: 'x@y.z' }), 'x@y.z', 'then email');
  a.strictEqual(oidc.usernameFromClaims(null), null);

  a.strictEqual(oidc.isTokenExpired(makeJwt({ exp: Math.floor(Date.now() / 1000) - 10 })), true, 'past exp → expired');
  a.strictEqual(oidc.isTokenExpired(makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 })), false, 'future exp → valid');
  a.strictEqual(oidc.isTokenExpired('garbage'), true, 'undecodable → treated as expired');

  // Authorize URL building.
  const authUrl = oidc.buildAuthorizeUrl('https://idp.example.com/oauth/v2/authorize', {
    clientId: 'client-abc', redirectUri: 'https://app.test/', scope: 'openid profile',
    state: 'st8', nonce: 'nonce9', codeChallenge: 'CHAL'
  });
  const parsed = new URL(authUrl);
  a.strictEqual(parsed.origin + parsed.pathname, 'https://idp.example.com/oauth/v2/authorize');
  a.strictEqual(parsed.searchParams.get('response_type'), 'code');
  a.strictEqual(parsed.searchParams.get('client_id'), 'client-abc');
  a.strictEqual(parsed.searchParams.get('redirect_uri'), 'https://app.test/');
  a.strictEqual(parsed.searchParams.get('scope'), 'openid profile');
  a.strictEqual(parsed.searchParams.get('state'), 'st8');
  a.strictEqual(parsed.searchParams.get('nonce'), 'nonce9');
  a.strictEqual(parsed.searchParams.get('code_challenge'), 'CHAL');
  a.strictEqual(parsed.searchParams.get('code_challenge_method'), 'S256');

  // Form encoding.
  const form = oidc.encodeForm({ grant_type: 'authorization_code', code: 'a b', skip: null });
  a.ok(form.includes('grant_type=authorization_code'));
  a.ok(form.includes('code=a+b') || form.includes('code=a%20b'), 'space must be percent/plus-encoded');
  a.strictEqual(/(^|&)skip=/.test(form), false, 'null values dropped');

  // Zitadel project scope.
  a.strictEqual(oidc.withProjectScope('openid profile', ''), 'openid profile', 'no projectId → unchanged');
  const scoped = oidc.withProjectScope('openid', '12345');
  a.ok(scoped.includes('urn:zitadel:iam:org:project:id:12345:aud'), 'projectId → Zitadel aud scope appended');
  a.strictEqual(oidc.withProjectScope(scoped, '12345'), scoped, 'idempotent — not appended twice');

  // Config load/save (needs localStorage).
  setGlobal('localStorage', makeStorage());
  const defaults = { enabled: true, issuer: '', clientId: '', scopes: 'openid', providerLabel: 'Zitadel' };
  a.deepStrictEqual(oidc.loadOidcConfig(defaults).issuer, '', 'no override → default');
  oidc.saveOidcConfig({ issuer: 'https://z.test', clientId: 'cid' });
  const merged = oidc.loadOidcConfig(defaults);
  a.strictEqual(merged.issuer, 'https://z.test', 'saved override wins');
  a.strictEqual(merged.clientId, 'cid');
  a.strictEqual(merged.scopes, 'openid', 'unsaved fields keep defaults');

  a.strictEqual(oidc.isConfigured({ enabled: true, issuer: 'x', clientId: 'y' }), true);
  a.strictEqual(oidc.isConfigured({ enabled: false, issuer: 'x', clientId: 'y' }), false, 'disabled → not configured');
  a.strictEqual(oidc.isConfigured({ enabled: true, issuer: '', clientId: 'y' }), false, 'missing issuer → not configured');

  // normalizeTokens.
  const norm = oidc.normalizeTokens({
    access_token: makeJwt({ preferred_username: 'mifos', exp: 9999999999 }),
    id_token: makeJwt({ sub: 'mifos' }),
    refresh_token: 'rt-1', token_type: 'Bearer', expires_in: 3600, scope: 'openid'
  });
  a.strictEqual(norm.username, 'mifos', 'username derived from access-token claims');
  a.strictEqual(norm.refreshToken, 'rt-1');
  a.strictEqual(norm.tokenType, 'Bearer');
  a.ok(norm.expiresAt > Date.now(), 'expiresAt computed from expires_in');

  // defaultRedirectUri from a stubbed location.
  setGlobal('location', { origin: 'https://app.test', pathname: '/fincraft/' });
  a.strictEqual(oidc.defaultRedirectUri(), 'https://app.test/fincraft/');

  // logoutUrl.
  const lo = oidc.logoutUrl({ end_session_endpoint: 'https://idp.test/logout' }, {
    idToken: 'IDT', postLogoutRedirectUri: 'https://app.test/', clientId: 'cid'
  });
  const loU = new URL(lo);
  a.strictEqual(loU.searchParams.get('id_token_hint'), 'IDT');
  a.strictEqual(loU.searchParams.get('post_logout_redirect_uri'), 'https://app.test/');
  a.strictEqual(oidc.logoutUrl({}, {}), null, 'no end_session_endpoint → null');

  /* ===================================================================== */
  /* B. BROWSER FLOW (stubbed fetch / storage / location)                  */
  /* ===================================================================== */

  const DISCOVERY = {
    authorization_endpoint: 'https://idp.test/oauth/v2/authorize',
    token_endpoint:         'https://idp.test/oauth/v2/token',
    end_session_endpoint:   'https://idp.test/oauth/v2/end_session'
  };

  // Programmable fetch stub.
  let fetchLog = [];
  function installFetch(handler) {
    setGlobal('fetch', async (url, opts = {}) => {
      fetchLog.push({ url: String(url), opts });
      return handler(String(url), opts);
    });
  }

  setGlobal('sessionStorage', makeStorage());
  setGlobal('localStorage', makeStorage());

  // discover() fetches and session-caches.
  fetchLog = [];
  installFetch(async (url) => {
    if (url.includes('.well-known/openid-configuration')) {
      return { ok: true, status: 200, json: async () => ({ ...DISCOVERY }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
  const meta1 = await oidc.discover('https://idp.test/');
  a.strictEqual(meta1.token_endpoint, DISCOVERY.token_endpoint);
  const firstCount = fetchLog.length;
  const meta2 = await oidc.discover('https://idp.test');   // cached (trailing slash normalized)
  a.strictEqual(fetchLog.length, firstCount, 'discovery must be session-cached (no 2nd fetch)');
  a.strictEqual(meta2.authorization_endpoint, DISCOVERY.authorization_endpoint);

  // discovery failure surfaces.
  sessionStorage.clear();
  installFetch(async () => ({ ok: false, status: 500, json: async () => ({}) }));
  let discErr = false;
  try { await oidc.discover('https://bad.test'); } catch { discErr = true; }
  a.strictEqual(discErr, true, 'non-ok discovery must throw');

  // beginLogin: stashes PKCE/state/nonce and "redirects".
  sessionStorage.clear();
  let redirectedTo = null;
  setGlobal('location', { origin: 'https://app.test', pathname: '/', search: '', assign: (u) => { redirectedTo = u; } });
  installFetch(async (url) => {
    if (url.includes('.well-known')) return { ok: true, status: 200, json: async () => ({ ...DISCOVERY }) };
    return { ok: false, status: 404, json: async () => ({}) };
  });
  const cfg = { enabled: true, issuer: 'https://idp.test', clientId: 'cid', scopes: 'openid profile offline_access', projectId: '' };
  const startedUrl = await oidc.beginLogin(cfg);
  a.ok(redirectedTo && redirectedTo.startsWith('https://idp.test/oauth/v2/authorize'), 'beginLogin must redirect to the authorize endpoint');
  a.strictEqual(startedUrl, redirectedTo);
  const K = oidc.OIDC_STORAGE_KEYS;
  a.ok(sessionStorage.getItem(K.verifier), 'verifier stashed');
  a.ok(sessionStorage.getItem(K.state), 'state stashed');
  const startedParsed = new URL(startedUrl);
  a.strictEqual(startedParsed.searchParams.get('state'), sessionStorage.getItem(K.state), 'state in URL matches stash');
  a.strictEqual(startedParsed.searchParams.get('code_challenge_method'), 'S256');

  // isCallback.
  a.strictEqual(oidc.isCallback('?code=abc&state=xyz'), true);
  a.strictEqual(oidc.isCallback('?error=access_denied'), true);
  a.strictEqual(oidc.isCallback('?foo=bar'), false);

  // handleCallback: state validation + code exchange.
  const savedState = sessionStorage.getItem(K.state);   // reuse the stash from beginLogin
  installFetch(async (url, opts) => {
    if (url.includes('.well-known')) return { ok: true, status: 200, json: async () => ({ ...DISCOVERY }) };
    if (url === DISCOVERY.token_endpoint) {
      a.ok(String(opts.body).includes('grant_type=authorization_code'), 'code exchange uses authorization_code grant');
      a.ok(String(opts.body).includes('code_verifier='), 'code exchange sends the PKCE verifier');
      return { ok: true, status: 200, json: async () => ({
        access_token: makeJwt({ preferred_username: 'mifos', exp: Math.floor(Date.now() / 1000) + 3600 }),
        id_token: makeJwt({ sub: 'mifos' }), refresh_token: 'rt-9', token_type: 'Bearer', expires_in: 3600
      }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
  const tokens = await oidc.handleCallback(cfg, `?code=THECODE&state=${savedState}`);
  a.strictEqual(tokens.username, 'mifos');
  a.strictEqual(tokens.refreshToken, 'rt-9');
  a.strictEqual(sessionStorage.getItem(K.verifier), null, 'verifier consumed after exchange');
  a.strictEqual(sessionStorage.getItem(K.state), null, 'state consumed after exchange');

  // handleCallback: state mismatch must abort (CSRF guard).
  sessionStorage.setItem(K.state, 'REALSTATE');
  sessionStorage.setItem(K.verifier, 'v');
  let csrf = false;
  try { await oidc.handleCallback(cfg, '?code=X&state=FORGED'); } catch (e) { csrf = /state mismatch/i.test(e.message); }
  a.strictEqual(csrf, true, 'state mismatch must throw');

  // handleCallback: IdP error param surfaces.
  let idpErr = false;
  try { await oidc.handleCallback(cfg, '?error=access_denied&error_description=nope'); }
  catch (e) { idpErr = /nope|access_denied/.test(e.message); }
  a.strictEqual(idpErr, true, 'error in callback must throw');

  // refresh: uses refresh_token grant.
  installFetch(async (url, opts) => {
    if (url.includes('.well-known')) return { ok: true, status: 200, json: async () => ({ ...DISCOVERY }) };
    if (url === DISCOVERY.token_endpoint) {
      a.ok(String(opts.body).includes('grant_type=refresh_token'), 'refresh uses refresh_token grant');
      return { ok: true, status: 200, json: async () => ({
        access_token: makeJwt({ preferred_username: 'mifos', exp: Math.floor(Date.now() / 1000) + 7200 }),
        refresh_token: 'rt-10', token_type: 'Bearer', expires_in: 7200
      }) };
    }
    return { ok: false, status: 400, json: async () => ({}) };
  });
  const refreshed = await oidc.refresh(cfg, 'rt-9');
  a.strictEqual(refreshed.refreshToken, 'rt-10', 'refresh returns the rotated refresh token');
  a.ok(refreshed.expiresAt > Date.now());

  /* ===================================================================== */
  /* C. core.js Bearer-vs-Basic header selection                           */
  /* ===================================================================== */

  const { FineractAPI } = await import('../js/api/core.js');
  const c = new FineractAPI();

  // Default scheme is Basic.
  c.configure({ authToken: 'QkFTSUM=' });
  a.strictEqual(c._headers()['Authorization'], 'Basic QkFTSUM=', 'default scheme → Basic');

  // Bearer scheme takes precedence when configured.
  c.configure({ authScheme: 'Bearer', bearerToken: 'JWT.abc.def' });
  a.strictEqual(c._headers()['Authorization'], 'Bearer JWT.abc.def', 'Bearer scheme → Bearer token');

  // reset() reverts to Basic and clears the bearer token.
  c.reset();
  a.strictEqual(c.authScheme, 'Basic', 'reset reverts to Basic scheme');
  a.strictEqual(c.bearerToken, '', 'reset clears bearer token');
  a.strictEqual('Authorization' in c._headers(), false, 'no creds after reset → no Authorization header');

  console.log('[oidc] PKCE + discovery + callback + refresh + Bearer-header checks passed');
}
