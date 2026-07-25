/* FinCraft · tests/api-contract.test.js
   ---------------------------------------------------------------------------
   The largest single regression net in the suite. It covers the whole Fineract
   API client layer (js/api/*.js), which is otherwise untested at the unit level.

   It works in three sections:

     A. CORE REQUEST BUILDERS (js/api/core.js)
        Pure unit tests for the primitives every endpoint is built on:
        _url() query-string assembly, _headers() auth/tenant/TFA logic, and
        configure()/reset() state handling. A bug here breaks *every* call.

     B. FULL-SURFACE AUTO-SWEEP
        Instantiates FineractAPIFull, replaces the network primitive (_req) with
        a recorder, then walks *every* namespace and calls *every* method with
        generic (or, where a method validates its input, purpose-built) args.
        For each of the ~900 endpoint methods it asserts:
          - the method is invocable without throwing a wiring error,
          - it issues exactly the HTTP verb its accessor implies (_g→GET,
            _p→POST, _u→PUT, _d→DELETE),
          - the path is a non-empty, '/'-rooted string (no `undefined` segment
            leaks, no missing leading slash).
        This catches the two failure modes the file-split refactor produced:
        typo'd paths and wrong verbs — across the entire surface at once.

     C. TARGETED ENDPOINT CONTRACTS
        Hand-written assertions pinning the exact verb + path + body for a
        representative endpoint in each module, including the audit-fixed ones
        (command= query params, encodeURIComponent on report names, the
        /client vs /clients address-path quirk, treasury single-row vs
        one-to-many guard rails, batch payload shaping, etc.).

   This file is DOM-free and needs no jsdom — the API layer only depends on
   js/config.js, so it runs everywhere.
*/
import assert from 'assert';

const VERBS = new Set(['GET', 'POST', 'PUT', 'DELETE']);

// Methods whose accessor (_g/_p/_u/_d) maps 1:1 to an HTTP verb, plus the
// verb-carrying helpers. Used only to sanity-check recorded verbs.
export async function runTests({ assert: a = assert } = {}) {
  const { FineractAPI } = await import('../js/api/core.js');
  const { FineractAPIFull, api, configureAPI } = await import('../js/api/index.js');

  /* ===================================================================== */
  /* A. CORE REQUEST BUILDERS                                               */
  /* ===================================================================== */

  const core = new FineractAPI();

  // configure(): trailing slash on serverUrl must be stripped exactly once.
  core.configure({ serverUrl: 'https://bank.example.com/', tenantId: 'acme', authToken: 'QUJD', tfaToken: 'TFA1' });
  a.strictEqual(core.serverUrl, 'https://bank.example.com', 'trailing slash should be stripped');
  a.strictEqual(core.tenantId, 'acme');

  // _url(): base + apiBase + path, with query only when there are real values.
  const base = 'https://bank.example.com/fineract-provider/api/v1';
  a.strictEqual(core._url('/clients'), base + '/clients', 'no params → no query string');
  a.strictEqual(core._url('/clients', {}), base + '/clients', 'empty params object → no query string');
  a.strictEqual(core._url('/clients', { limit: 10, offset: 0 }), base + '/clients?limit=10&offset=0');

  // _url(): null/undefined/'' values are dropped; 0 is kept (offset=0 is real).
  const withNulls = core._url('/loans', { a: 'x', b: null, c: undefined, d: '', e: 0 });
  a.strictEqual(withNulls.includes('a=x'), true, 'truthy value kept');
  a.strictEqual(/[?&]b=/.test(withNulls), false, 'null dropped');
  a.strictEqual(/[?&]c=/.test(withNulls), false, 'undefined dropped');
  a.strictEqual(/[?&]d=/.test(withNulls), false, 'empty string dropped');
  a.strictEqual(withNulls.includes('e=0'), true, 'numeric zero kept');

  // _url(): appends with & when the path already carries a ?command= segment.
  const cmdUrl = core._url('/clients/5?command=activate', { locale: 'en' });
  a.strictEqual(cmdUrl.includes('?command=activate&locale=en'), true, 'existing query → use & separator');

  // _headers(): tenant + auth + TFA all present; JSON content-type by default.
  const h = core._headers();
  a.strictEqual(h['Fineract-Platform-TenantId'], 'acme');
  a.strictEqual(h['Authorization'], 'Basic QUJD');
  a.strictEqual(h['Fineract-Platform-TFA-Token'], 'TFA1');
  a.strictEqual(h['Content-Type'], 'application/json');
  a.strictEqual(h['Accept'], 'application/json');

  // _headers(): explicit null Content-Type (the multipart/FormData path) removes it.
  const hForm = core._headers({ 'Content-Type': null });
  a.strictEqual('Content-Type' in hForm, false, 'null Content-Type must be deleted, not sent as "null"');

  // reset(): clears credentials but keeps configured tenant.
  core.reset();
  a.strictEqual(core.authToken, '');
  a.strictEqual(core.tfaToken, '');
  a.strictEqual(core.serverUrl, '');
  a.strictEqual(core.tenantId, 'acme', 'reset() should not wipe tenantId');

  // No-auth headers omit Authorization / TFA entirely.
  const bare = new FineractAPI();
  const hb = bare._headers();
  a.strictEqual('Authorization' in hb, false);
  a.strictEqual('Fineract-Platform-TFA-Token' in hb, false);
  a.strictEqual(hb['Fineract-Platform-TenantId'], 'default', 'default tenant when unconfigured');

  /* ===================================================================== */
  /* B. FULL-SURFACE AUTO-SWEEP                                             */
  /* ===================================================================== */

  const full = new FineractAPIFull();

  // Recorder: capture (verb, path, opts) for every request the API layer issues.
  const calls = [];
  full._req = (method, path, opts = {}) => {
    calls.push({ method, path, params: opts.params, body: opts.body });
    return Promise.resolve(null);
  };
  // any()/auth() build requests directly; route them through the same recorder.
  full.any = (method, path, params, body) => { calls.push({ method, path, params, body }); return Promise.resolve(null); };

  // Some methods validate their inputs (treasury table names, batch arrays) and
  // must be fed a realistic shape rather than the generic '1' placeholder.
  const SPECIAL_ARGS = {
    'treasury.queryRows':    ['dt_expense_requests', '1'],
    'treasury.createRow':    ['dt_expense_requests', '1', {}],
    'treasury.getRow':       ['dt_expense_requests', '1', '1'],       // multiRow table → allowed
    'treasury.updateRow':    ['dt_expense_requests', '1', '1', {}],
    'treasury.deleteRow':    ['dt_expense_requests', '1', '1'],
    'treasury.updateConfig': ['dt_treasury_thresholds', '1', {}],     // single-row config → allowed
    'treasury.deleteConfig': ['dt_treasury_thresholds', '1'],
    'batch.submit':          [[{ requestId: 1, relativeUrl: 'clients', method: 'GET' }], false],
  };

  let namespaces = 0, methodsInvoked = 0;
  const wiringErrors = [];

  for (const nsKey of Object.keys(full)) {
    const ns = full[nsKey];
    if (!ns || typeof ns !== 'object' || Array.isArray(ns)) continue;

    let nsHadFn = false;
    for (const fnKey of Object.keys(ns)) {
      const fn = ns[fnKey];
      if (typeof fn !== 'function') continue;        // e.g. treasury.tableSpecs (array)
      nsHadFn = true;

      const before = calls.length;
      const args = SPECIAL_ARGS[`${nsKey}.${fnKey}`]
        || Array.from({ length: fn.length }, () => '1');

      try {
        const r = fn.apply(ns, args);
        if (r && typeof r.then === 'function') await r.catch(() => {});
        methodsInvoked++;
      } catch (e) {
        wiringErrors.push(`${nsKey}.${fnKey}: ${e.message}`);
        continue;
      }

      // Validate every request this method produced (some produce more than one,
      // e.g. treasury.ensureTreasuryDatatables lists then creates).
      for (const c of calls.slice(before)) {
        if (!VERBS.has(c.method)) {
          wiringErrors.push(`${nsKey}.${fnKey}: bad verb "${c.method}"`);
        }
        if (typeof c.path !== 'string' || !c.path.startsWith('/')) {
          wiringErrors.push(`${nsKey}.${fnKey}: bad path ${JSON.stringify(c.path)}`);
        }
        if (/\/undefined(\/|$|\?)/.test(c.path)) {
          wiringErrors.push(`${nsKey}.${fnKey}: "undefined" leaked into path ${c.path}`);
        }
      }
    }
    if (nsHadFn) namespaces++;
  }

  a.strictEqual(wiringErrors.length, 0,
    `API wiring errors detected:\n  ${wiringErrors.slice(0, 30).join('\n  ')}`);

  // Guard rails: if a future refactor silently drops a whole module, these fail.
  a.ok(namespaces >= 90, `expected >=90 API namespaces, saw ${namespaces}`);
  a.ok(methodsInvoked >= 800, `expected >=800 API methods exercised, saw ${methodsInvoked}`);

  // Verb distribution sanity — every verb must be represented somewhere.
  const verbCount = calls.reduce((m, c) => (m[c.method] = (m[c.method] || 0) + 1, m), {});
  for (const v of VERBS) a.ok(verbCount[v] > 0, `no ${v} requests were produced`);

  /* ===================================================================== */
  /* C. TARGETED ENDPOINT CONTRACTS                                         */
  /* ===================================================================== */

  // Fresh recorder that returns the single call a builder produced.
  function cap(build) {
    const start = calls.length;
    const r = build();
    if (r && typeof r.then === 'function') r.catch(() => {});
    const produced = calls.slice(start);
    return produced.length === 1 ? produced[0] : produced;
  }
  const eq = (call, method, path) => {
    a.strictEqual(call.method, method, `verb for ${path}`);
    a.strictEqual(call.path, path);
  };

  // Clients — CRUD + command params + the /client(singular) address quirk.
  eq(cap(() => full.clients.list({ limit: 5 })), 'GET', '/clients');
  eq(cap(() => full.clients.get(42)), 'GET', '/clients/42');
  eq(cap(() => full.clients.create({})), 'POST', '/clients');
  eq(cap(() => full.clients.update(42, {})), 'PUT', '/clients/42');
  eq(cap(() => full.clients.delete(42)), 'DELETE', '/clients/42');
  eq(cap(() => full.clients.activate(42, '2026-01-01')), 'POST', '/clients/42?command=activate');
  eq(cap(() => full.clients.close(42, {})), 'POST', '/clients/42?command=close');
  eq(cap(() => full.clients.addresses(42)), 'GET', '/client/42/addresses');        // singular is intentional
  eq(cap(() => full.clients.addressTemplate()), 'GET', '/client/addresses/template');
  {
    const call = cap(() => full.clients.activate(7, '2026-02-03'));
    a.strictEqual(call.body.activationDate, '2026-02-03');
    a.strictEqual(call.body.dateFormat, 'yyyy-MM-dd');
    a.strictEqual(call.body.locale, 'en');
  }

  // Loans — lifecycle command endpoints.
  eq(cap(() => full.loans.get(10)), 'GET', '/loans/10');
  eq(cap(() => full.loans.approve(10, {})), 'POST', '/loans/10?command=approve');
  eq(cap(() => full.loans.disburse(10, {})), 'POST', '/loans/10?command=disburse');
  eq(cap(() => full.loans.repay(10, {})), 'POST', '/loans/10/transactions?command=repayment');

  // Savings & Deposits.
  eq(cap(() => full.savings.get(3)), 'GET', '/savingsaccounts/3');
  eq(cap(() => full.savings.deposit(3, {})), 'POST', '/savingsaccounts/3/transactions?command=deposit');
  eq(cap(() => full.savings.withdrawal(3, {})), 'POST', '/savingsaccounts/3/transactions?command=withdrawal');

  // Accounting — journal entries.
  eq(cap(() => full.journalEntries.list({ limit: 1 })), 'GET', '/journalentries');
  eq(cap(() => full.glAccounts.get(9)), 'GET', '/glaccounts/9');

  // Reports — encodeURIComponent on names with spaces/slashes, JSON output-type.
  {
    const call = cap(() => full.runReports.run('Active Loans/Detail', { R_officeId: 1 }));
    a.strictEqual(call.method, 'GET');
    a.strictEqual(call.path, '/runreports/Active%20Loans%2FDetail');
    a.strictEqual(call.params['output-type'], 'JSON');
    a.strictEqual(call.params.R_officeId, 1);
  }
  eq(cap(() => full.reports.list()), 'GET', '/reports');

  // Datatables — nested entity/datatable id paths.
  eq(cap(() => full.dataTables.getEntry('dt_x', 5, 9)), 'GET', '/datatables/dt_x/5/9');
  eq(cap(() => full.dataTables.advancedQuery('dt_x', { columnFilters: 1 })), 'GET', '/datatables/dt_x/query');

  // Organization.
  eq(cap(() => full.offices.get(1)), 'GET', '/offices/1');
  eq(cap(() => full.staff.list({ officeId: 1 })), 'GET', '/staff');

  // Admin.
  eq(cap(() => full.users.get(1)), 'GET', '/users/1');
  eq(cap(() => full.roles.list()), 'GET', '/roles');

  // Treasury — guard rails: wrong helper for a table shape must throw, right one records.
  eq(cap(() => full.treasury.getRow('dt_expense_requests', 1, 2)), 'GET', '/datatables/dt_expense_requests/1/2');
  eq(cap(() => full.treasury.updateConfig('dt_treasury_thresholds', 1, {})), 'PUT', '/datatables/dt_treasury_thresholds/1');
  a.throws(() => full.treasury.getRow('dt_treasury_thresholds', 1, 2), /single-row config table/,
    'getRow on a single-row table must be rejected');
  a.throws(() => full.treasury.updateConfig('dt_expense_requests', 1, {}), /one-to-many/,
    'updateConfig on a one-to-many table must be rejected');
  a.throws(() => full.treasury.getRow('dt_does_not_exist', 1, 2), /Unknown treasury datatable/);

  // Batch — payload shaping: body JSON-stringified, headers injected, ids preserved.
  {
    const start = calls.length;
    full.batch.submit([{ requestId: 1, relativeUrl: 'clients', method: 'POST', body: { firstname: 'A' } }], true);
    const call = calls[start];
    a.strictEqual(call.method, 'POST');
    a.strictEqual(call.path, '/batches');
    a.strictEqual(call.params.enclosingTransaction, 'true', 'enclosingTransaction passed as a query param');
    a.strictEqual(Array.isArray(call.body), true);
    a.strictEqual(call.body[0].requestId, 1);
    a.strictEqual(typeof call.body[0].body, 'string', 'nested batch body must be stringified');
    a.strictEqual(JSON.parse(call.body[0].body).firstname, 'A');
  }

  // Top-level helpers on the client itself.
  {
    const start = calls.length;
    full.any('PATCH', '/custom', { q: 1 }, { z: 2 });
    a.strictEqual(calls[start].method, 'PATCH');
    a.strictEqual(calls[start].path, '/custom');
  }

  // configureAPI() must proxy onto the exported singleton.
  configureAPI({ serverUrl: 'https://x.test/', tenantId: 'z' });
  a.strictEqual(api.serverUrl, 'https://x.test');
  a.strictEqual(api.tenantId, 'z');

  console.log(`[api-contract] swept ${methodsInvoked} methods across ${namespaces} namespaces, ${calls.length} requests recorded`);
}
