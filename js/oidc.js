/* FinCraft · js/oidc.js
   ---------------------------------------------------------------------------
   OpenID Connect (OIDC) / OAuth2 sign-in for Fineract via an external IdP such
   as Zitadel or Keycloak, using the Authorization Code flow with PKCE.

   FinCraft is a browser SPA, so it is a *public* client: there is NO client
   secret. Security rests on PKCE (RFC 7636) + a `state` parameter (CSRF) +
   `nonce` (id_token replay).

   End-to-end this requires the Fineract server to run in OAuth mode
   (FINERACT_SECURITY_OAUTH_ENABLED=true, FINERACT_SERVER_OAUTH_RESOURCE_URL=
   <issuer>) and the IdP to place the Fineract username in the token `sub`
   (Zitadel/Keycloak: add a claim mapper). Once signed in, the API layer sends
   `Authorization: Bearer <access_token>` (see js/api/core.js).

   This module is split into:
     • pure helpers (base64url, PKCE, JWT decode, URL building, username
       extraction) — unit-tested in tests/oidc.test.js, no network/DOM needed;
     • browser-flow helpers (discovery, beginLogin, handleCallback, refresh,
       logoutUrl) — use fetch / crypto.subtle / location / sessionStorage.
*/

const STORAGE_KEYS = {
  verifier: 'fincraft.oidc.verifier',
  state:    'fincraft.oidc.state',
  nonce:    'fincraft.oidc.nonce',
  cfg:      'fincraft.oidc.cfg',        // user-overridable issuer/clientId (localStorage)
  meta:     'fincraft.oidc.meta'        // cached discovery document (sessionStorage)
};

/* ===================================================================== */
/* Pure helpers                                                          */
/* ===================================================================== */

const _crypto = () => (globalThis.crypto || (globalThis.window && globalThis.window.crypto));

// Pure-JS base64 (RFC 4648 §4) — used only when the environment provides neither
// `btoa`/`atob` nor a DOM. Keeps this module dependency-free and browser-safe:
// no `Buffer` reference, so it lints clean under browser-only globals and still
// works in the Node test runner without needing a Node global.
const _B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function _bytesToBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += _B64[b0 >> 2];
    out += _B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? _B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? _B64[b2 & 63] : '=';
  }
  return out;
}

function _base64ToBytes(b64) {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = [];
  for (let i = 0; i < clean.length; i += 4) {
    const e0 = _B64.indexOf(clean[i]);
    const e1 = _B64.indexOf(clean[i + 1]);
    const e2 = i + 2 < clean.length ? _B64.indexOf(clean[i + 2]) : -1;
    const e3 = i + 3 < clean.length ? _B64.indexOf(clean[i + 3]) : -1;
    out.push((e0 << 2) | (e1 >> 4));
    if (e2 !== -1) out.push(((e1 & 15) << 4) | (e2 >> 2));
    if (e3 !== -1) out.push(((e2 & 3) << 6) | e3);
  }
  return new Uint8Array(out);
}

// RFC 4648 §5 base64url (no padding) from an ArrayBuffer / Uint8Array.
export function base64UrlEncode(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let b64;
  if (typeof btoa === 'function') {
    let str = '';
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    b64 = btoa(str);
  } else {
    b64 = _bytesToBase64(bytes);              // DOM-less fallback (Node tests)
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Decode a base64url string to a UTF-8 string (used for JWT payloads).
export function base64UrlDecode(b64url) {
  let b64 = String(b64url).replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  if (typeof atob === 'function') {
    const bin = atob(b64);
    try {
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch { return bin; }
  }
  return new TextDecoder().decode(_base64ToBytes(b64));   // DOM-less fallback (Node tests)
}

// A high-entropy PKCE code_verifier: 43–128 chars from the unreserved set.
export function generateCodeVerifier(length = 64) {
  const n = Math.min(128, Math.max(43, length));
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const rnd = new Uint8Array(n);
  _crypto().getRandomValues(rnd);
  let out = '';
  for (let i = 0; i < n; i++) out += charset[rnd[i] % charset.length];
  return out;
}

// S256 challenge = base64url(SHA-256(verifier)).
export async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await _crypto().subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

// A random URL-safe token for `state` / `nonce`.
export function randomToken(bytes = 32) {
  const rnd = new Uint8Array(bytes);
  _crypto().getRandomValues(rnd);
  return base64UrlEncode(rnd);
}

// Decode (NOT verify) a JWT and return its payload claims. Signature validation
// is the Fineract resource server's job; the SPA only reads claims for display.
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try { return JSON.parse(base64UrlDecode(parts[1])); }
  catch { return null; }
}

// Fineract matches the token subject to a username. Prefer `preferred_username`,
// then `sub`, then common name/email fallbacks.
export function usernameFromClaims(claims) {
  if (!claims || typeof claims !== 'object') return null;
  return claims.preferred_username
      || claims.username
      || claims.sub
      || claims.email
      || claims.name
      || null;
}

// true if a JWT is expired (or expires within `skewSec`).
export function isTokenExpired(token, skewSec = 30) {
  const claims = decodeJwt(token);
  if (!claims || !claims.exp) return true;
  return (claims.exp * 1000) <= (Date.now() + skewSec * 1000);
}

// Build the IdP authorization URL for the Authorization Code + PKCE flow.
export function buildAuthorizeUrl(authorizationEndpoint, {
  clientId, redirectUri, scope, state, nonce, codeChallenge, extra
} = {}) {
  const u = new URL(authorizationEndpoint);
  const p = u.searchParams;
  p.set('response_type', 'code');
  p.set('client_id', clientId);
  p.set('redirect_uri', redirectUri);
  p.set('scope', scope || 'openid profile email');
  if (state)         p.set('state', state);
  if (nonce)         p.set('nonce', nonce);
  if (codeChallenge) { p.set('code_challenge', codeChallenge); p.set('code_challenge_method', 'S256'); }
  if (extra && typeof extra === 'object') for (const [k, v] of Object.entries(extra)) if (v != null) p.set(k, v);
  return u.toString();
}

// x-www-form-urlencoded body for the token endpoint (code exchange / refresh).
export function encodeForm(obj) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v != null) p.set(k, v);
  return p.toString();
}

// Zitadel wants project roles requested via a reserved scope; build it if a
// projectId is configured, else return the base scopes unchanged.
export function withProjectScope(scope, projectId) {
  if (!projectId) return scope;
  const roleScope = `urn:zitadel:iam:org:project:id:${projectId}:aud`;
  return scope.includes(roleScope) ? scope : `${scope} ${roleScope}`;
}

/* ===================================================================== */
/* Config (user-overridable issuer / clientId)                          */
/* ===================================================================== */

// Merge compiled OIDC_DEFAULT with any locally-saved overrides.
export function loadOidcConfig(defaults) {
  let saved = {};
  try {
    const raw = globalThis.localStorage && localStorage.getItem(STORAGE_KEYS.cfg);
    if (raw) saved = JSON.parse(raw) || {};
  } catch { saved = {}; }
  return { ...defaults, ...saved };
}

export function saveOidcConfig(partial) {
  try {
    const cur = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.cfg) || '{}'); } catch { return {}; } })();
    localStorage.setItem(STORAGE_KEYS.cfg, JSON.stringify({ ...cur, ...partial }));
  } catch {}
}

// If no redirectUri is configured, use the app's own origin+path (no hash/query)
// so the IdP lands us back on a clean URL we then tidy with replaceState.
export function defaultRedirectUri() {
  const loc = globalThis.location;
  if (!loc) return '';
  return loc.origin + (loc.pathname || '/');
}

export function isConfigured(cfg) {
  return !!(cfg && cfg.enabled && cfg.issuer && cfg.clientId);
}

/* ===================================================================== */
/* Discovery                                                            */
/* ===================================================================== */

// Fetch (and session-cache) the IdP's OpenID discovery document.
export async function discover(issuer) {
  const base = String(issuer).replace(/\/$/, '');
  const url = `${base}/.well-known/openid-configuration`;
  // session cache keyed by issuer
  try {
    const cached = sessionStorage.getItem(STORAGE_KEYS.meta);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.__issuer === base && parsed.authorization_endpoint) return parsed;
    }
  } catch {}
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`OIDC discovery failed (${r.status}) at ${url}`);
  const meta = await r.json();
  try { sessionStorage.setItem(STORAGE_KEYS.meta, JSON.stringify({ ...meta, __issuer: base })); } catch {}
  return meta;
}

/* ===================================================================== */
/* Browser flow                                                         */
/* ===================================================================== */

// Kick off login: generate PKCE + state + nonce, stash them, redirect to IdP.
export async function beginLogin(cfg) {
  if (!isConfigured(cfg)) throw new Error('OIDC is not configured (issuer + clientId required).');
  const meta = await discover(cfg.issuer);
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = randomToken();
  const nonce = randomToken();
  const redirectUri = cfg.redirectUri || defaultRedirectUri();

  sessionStorage.setItem(STORAGE_KEYS.verifier, verifier);
  sessionStorage.setItem(STORAGE_KEYS.state, state);
  sessionStorage.setItem(STORAGE_KEYS.nonce, nonce);

  const url = buildAuthorizeUrl(meta.authorization_endpoint, {
    clientId: cfg.clientId,
    redirectUri,
    scope: withProjectScope(cfg.scopes, cfg.projectId),
    state, nonce, codeChallenge: challenge
  });
  location.assign(url);          // top-level navigation to the IdP
  return url;                    // returned for testability
}

// True when the current URL looks like an IdP redirect back to us.
export function isCallback(search) {
  const q = search != null ? search : (globalThis.location ? location.search : '');
  const p = new URLSearchParams(q || '');
  return p.has('code') || p.has('error');
}

// Complete the flow: validate state, exchange the code for tokens.
export async function handleCallback(cfg, search) {
  const q = search != null ? search : location.search;
  const params = new URLSearchParams(q || '');

  if (params.get('error')) {
    const desc = params.get('error_description') || params.get('error');
    throw new Error(`SSO sign-in failed: ${desc}`);
  }
  const code = params.get('code');
  const returnedState = params.get('state');
  const savedState = sessionStorage.getItem(STORAGE_KEYS.state);
  const verifier = sessionStorage.getItem(STORAGE_KEYS.verifier);

  if (!code) throw new Error('No authorization code in callback.');
  if (!savedState || returnedState !== savedState) throw new Error('OIDC state mismatch — possible CSRF, aborting.');
  if (!verifier) throw new Error('Missing PKCE verifier — restart sign-in.');

  const meta = await discover(cfg.issuer);
  const redirectUri = cfg.redirectUri || defaultRedirectUri();
  const tokens = await exchangeCode(meta.token_endpoint, {
    code, redirectUri, clientId: cfg.clientId, codeVerifier: verifier
  });

  // one-time values consumed
  sessionStorage.removeItem(STORAGE_KEYS.verifier);
  sessionStorage.removeItem(STORAGE_KEYS.state);

  return normalizeTokens(tokens);
}

// POST the code to the token endpoint.
export async function exchangeCode(tokenEndpoint, { code, redirectUri, clientId, codeVerifier }) {
  const body = encodeForm({
    grant_type: 'authorization_code',
    code, redirect_uri: redirectUri, client_id: clientId, code_verifier: codeVerifier
  });
  const r = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body
  });
  if (!r.ok) {
    let detail = ''; try { detail = JSON.stringify(await r.json()); } catch {}
    throw new Error(`Token exchange failed (${r.status}) ${detail}`);
  }
  return r.json();
}

// Exchange a refresh_token for a fresh access token.
export async function refresh(cfg, refreshToken) {
  if (!refreshToken) throw new Error('No refresh token available.');
  const meta = await discover(cfg.issuer);
  const body = encodeForm({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: cfg.clientId,
    scope: withProjectScope(cfg.scopes, cfg.projectId)
  });
  const r = await fetch(meta.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body
  });
  if (!r.ok) {
    let detail = ''; try { detail = JSON.stringify(await r.json()); } catch {}
    throw new Error(`Token refresh failed (${r.status}) ${detail}`);
  }
  return normalizeTokens(await r.json());
}

// Shape a raw token response into what auth.js/store.js persist.
export function normalizeTokens(raw) {
  const accessToken = raw.access_token;
  const claims = decodeJwt(accessToken) || decodeJwt(raw.id_token) || {};
  const expiresInMs = (Number(raw.expires_in) || 0) * 1000;
  return {
    accessToken,
    idToken: raw.id_token || null,
    refreshToken: raw.refresh_token || null,
    tokenType: raw.token_type || 'Bearer',
    scope: raw.scope || null,
    expiresAt: expiresInMs ? Date.now() + expiresInMs : null,
    username: usernameFromClaims(claims),
    claims
  };
}

// Build the IdP end-session (logout) URL, if the IdP advertises one.
export function logoutUrl(meta, { idToken, postLogoutRedirectUri, clientId } = {}) {
  if (!meta || !meta.end_session_endpoint) return null;
  const u = new URL(meta.end_session_endpoint);
  if (idToken) u.searchParams.set('id_token_hint', idToken);
  if (postLogoutRedirectUri) u.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  if (clientId) u.searchParams.set('client_id', clientId);
  return u.toString();
}

// Strip ?code=…&state=… from the address bar after a successful callback.
export function cleanCallbackUrl() {
  try {
    const url = location.origin + location.pathname + (location.hash || '');
    history.replaceState(null, '', url);
  } catch {}
}

export const OIDC_STORAGE_KEYS = STORAGE_KEYS;
