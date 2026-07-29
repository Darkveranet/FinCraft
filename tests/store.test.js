/* FinCraft · tests/store.test.js
   Unit tests for js/store.js — the reactive state container behind auth,
   permission gating, theme, and the offline cache. Covers get/set/patch/remove,
   subscribe notifications (incl. error isolation), permission helpers
   (ALL_FUNCTIONS + ALL_FUNCTIONS_READ superuser bypasses, checker detection),
   and persist()/restore() round-tripping through storage — including the
   OAuth2/OIDC (Bearer) session that SSO login introduced.

   store.js runs restore() at import time (reads storage, sets document theme),
   so this test installs minimal Web-Storage + document stubs FIRST, then
   dynamically imports the module. No jsdom required. */
import assert from 'assert';

function makeStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    clear: () => m.clear(),
    _dump: () => Object.fromEntries(m),
  };
}

export async function runTests({ assert: a = assert } = {}) {
  // --- install browser stubs before importing store.js -------------------
  const ls = makeStorage();
  const ss = makeStorage();
  const themeSink = {};
  const doc = { documentElement: { setAttribute: (k, v) => { themeSink[k] = v; } } };

  const set = (name, value) => { try { Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); } catch { globalThis[name] = value; } };
  set('localStorage', ls);
  set('sessionStorage', ss);
  set('document', doc);

  const { store } = await import('../js/store.js');

  // restore() applies the current theme to the DOM. We call it explicitly here
  // rather than relying on the import-time side effect: store.js is a singleton
  // and may already have been imported (and restored) by an earlier DOM suite,
  // so the cached module won't re-run restore() on this import.
  store.set('theme', 'dark');
  themeSink['data-theme'] = undefined;   // clear the sink so we observe this restore()
  store.restore();                        // empty localStorage → keeps 'dark', applies to our stub DOM
  a.strictEqual(themeSink['data-theme'], 'dark', 'restore() must apply the current theme to the DOM');

  // --- get/set + subscribe ----------------------------------------------
  a.strictEqual(store.get('theme'), 'dark');
  let seen = null, calls = 0;
  const unsub = store.subscribe('theme', v => { seen = v; calls++; });
  store.set('theme', 'light');
  a.strictEqual(seen, 'light', 'subscriber must receive new value');
  a.strictEqual(store.get('theme'), 'light');
  a.strictEqual(calls, 1);
  unsub();
  store.set('theme', 'dark');
  a.strictEqual(calls, 1, 'unsubscribe must stop further notifications');

  // A throwing subscriber must not break notification for the setter.
  store.subscribe('sidebar', () => { throw new Error('boom'); });
  let ok = true;
  try { store.set('sidebar', 'collapsed'); } catch { ok = false; }
  a.strictEqual(ok, true, 'a throwing subscriber must be isolated');
  a.strictEqual(store.get('sidebar'), 'collapsed');

  // --- patch / remove ----------------------------------------------------
  store.set('currentParams', { a: 1 });
  store.patch('currentParams', { b: 2 });
  a.deepStrictEqual(store.get('currentParams'), { a: 1, b: 2 }, 'patch must shallow-merge');
  store.remove('currentParams');
  a.strictEqual(store.get('currentParams'), undefined, 'remove must delete the key');

  // --- permission helpers ------------------------------------------------
  store.set('perms', []);
  a.strictEqual(store.hasPermission(''), true, 'empty code is always allowed');
  a.strictEqual(store.hasPermission(null), true, 'null code is always allowed');
  a.strictEqual(store.hasPermission('READ_CLIENT'), false, 'missing perm denied');

  store.set('perms', ['READ_CLIENT']);
  a.strictEqual(store.hasPermission('READ_CLIENT'), true);
  a.strictEqual(store.hasPermission('CREATE_CLIENT'), false);

  store.set('perms', ['ALL_FUNCTIONS']);
  a.strictEqual(store.hasPermission('ANYTHING_AT_ALL'), true, 'ALL_FUNCTIONS is a superuser bypass');

  store.set('perms', ['ALL_FUNCTIONS_READ']);
  a.strictEqual(store.hasPermission('READ_LOAN'), true, 'ALL_FUNCTIONS_READ grants READ_*');
  a.strictEqual(store.hasPermission('CREATE_LOAN'), false, 'ALL_FUNCTIONS_READ must NOT grant writes');

  // Checker detection.
  store.set('perms', ['READ_CLIENT']);
  a.strictEqual(store.hasAnyCheckerPermission(), false);
  store.set('perms', ['APPROVE_LOAN_CHECKER']);
  a.strictEqual(store.hasAnyCheckerPermission(), true, 'a *_CHECKER perm should be detected');
  store.set('perms', ['CHECKER_SUPER_USER']);
  a.strictEqual(store.hasAnyCheckerPermission(), true);
  store.set('perms', ['ALL_FUNCTIONS']);
  a.strictEqual(store.hasAnyCheckerPermission(), true);

  // --- persist / restore round-trip (Basic auth) ------------------------
  // Non-auth prefs land in localStorage; auth + perms in sessionStorage.
  store.set('perms', ['READ_CLIENT', 'CREATE_CLIENT']);
  store.set('defaultCurrency', 'NGN');
  store.set('auth', {
    serverUrl: 'https://bank.test', tenantId: 'default', username: 'admin',
    authToken: 'QUJD', userId: 7, roles: ['Super user'], officeId: 1, officeName: 'HQ'
  });

  const persistedLs = JSON.parse(ls.getItem('fincraft.state'));
  a.strictEqual(persistedLs.theme, 'dark');
  a.ok(!('auth' in persistedLs), 'auth must never be written to localStorage');

  const persistedSs = JSON.parse(ss.getItem('fincraft.session'));
  a.strictEqual(persistedSs.authToken, 'QUJD');
  a.strictEqual(persistedSs.username, 'admin');
  a.deepStrictEqual(persistedSs.perms, ['READ_CLIENT', 'CREATE_CLIENT'], 'perms ride along in the session blob');
  a.strictEqual(persistedSs.defaultCurrency, 'NGN');

  // Logging out (auth=null) must purge the session blob.
  store.set('auth', null);
  a.strictEqual(ss.getItem('fincraft.session'), null, 'clearing auth must remove the session blob');

  // restore() must rehydrate auth+perms+currency from a pre-seeded session.
  ss.setItem('fincraft.session', JSON.stringify({
    authToken: 'WFla', username: 'u2', perms: ['READ_LOAN'], defaultCurrency: 'USD'
  }));
  ls.setItem('fincraft.state', JSON.stringify({ theme: 'light', sidebar: 'collapsed' }));
  store.restore();
  a.strictEqual(store.get('theme'), 'light', 'restore should pick up persisted theme');
  a.strictEqual(store.get('sidebar'), 'collapsed');
  a.strictEqual(store.get('auth').authToken, 'WFla');
  a.deepStrictEqual(store.get('perms'), ['READ_LOAN']);
  a.strictEqual(store.get('defaultCurrency'), 'USD');
  a.strictEqual(themeSink['data-theme'], 'light', 'restore must reflect theme onto the DOM');

  // --- persist / restore round-trip (OAuth2/OIDC Bearer session) --------
  store.set('perms', ['READ_CLIENT']);
  store.set('auth', {
    serverUrl: 'https://bank.test', tenantId: 'default', username: 'mifos',
    authScheme: 'Bearer', bearerToken: 'JWT.aaa.bbb', refreshToken: 'rt-1',
    idToken: 'ID.ccc.ddd', expiresAt: Date.now() + 3600000, roles: []
  });
  const ssBearer = JSON.parse(ss.getItem('fincraft.session'));
  a.strictEqual(ssBearer.authScheme, 'Bearer', 'Bearer scheme persisted');
  a.strictEqual(ssBearer.bearerToken, undefined, 'access token must remain memory-only');
  a.strictEqual(ssBearer.refreshToken, undefined, 'refresh token must remain memory-only');
  a.ok(!('authToken' in ssBearer) || ssBearer.authToken == null, 'no Basic token on an SSO session');

  // A forged/persisted Bearer session must never be restored from Web Storage.
  store.set('auth', null);
  ss.setItem('fincraft.session', JSON.stringify({ authScheme: 'Bearer', bearerToken: 'JWT.zzz', refreshToken: 'rt-2' }));
  store.restore();
  a.strictEqual(store.get('auth'), null, 'Bearer sessions must remain memory-only');
}
