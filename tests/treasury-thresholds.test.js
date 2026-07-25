/* FinCraft · tests/treasury-thresholds.test.js
   Unit tests for js/treasury/thresholds.js — the GL-account / reserve-buffer
   configuration layer that Vault Control, reconciliation and health checks all
   depend on. Covers:
     - fromRow() snake_case→camelCase mapping incl. nullable optional columns
       and numeric coercion of the reserve buffer,
     - getThresholds() single-row extraction + graceful 404→null handling,
     - upsertThresholds() required-field validation and the update-vs-create
       branch (updateConfig when a row exists, createRow when it doesn't),
     - requireThresholds() throwing a helpful error when unconfigured.
   The API singleton's treasury namespace is stubbed, so this is pure/no-DOM. */
import assert from 'assert';

export async function runTests({ assert: a = assert } = {}) {
  const { api } = await import('../js/api.js');
  const { getThresholds, upsertThresholds, requireThresholds } = await import('../js/treasury/thresholds.js');

  // Record calls made against the treasury API so we can assert routing.
  let calls = [];
  const origTreasury = api.treasury;
  function stub(overrides) {
    api.treasury = {
      queryRows:    (t, o)       => { calls.push(['queryRows', t, o]);       return (overrides.queryRows    || (() => Promise.resolve(null)))(t, o); },
      createRow:    (t, o, b)    => { calls.push(['createRow', t, o, b]);    return (overrides.createRow    || (() => Promise.resolve({ ok: true })))(t, o, b); },
      updateConfig: (t, o, b)    => { calls.push(['updateConfig', t, o, b]); return (overrides.updateConfig || (() => Promise.resolve({ ok: true })))(t, o, b); },
    };
  }

  try {
    /* ---- fromRow mapping (via getThresholds) --------------------------- */
    stub({
      queryRows: () => Promise.resolve([{
        vault_gl_account_id: 10,
        cash_at_tellers_gl_account_id: 11,
        bank_gl_account_id: 12,
        borrowings_liability_gl_account_id: null,
        reserve_buffer_amount: '2500.50',
        currency_code: 'NGN'
        // interest_* / shortage / overage columns omitted → must default to null
      }]),
    });
    calls = [];
    const t = await getThresholds(1);
    a.deepStrictEqual(calls[0], ['queryRows', 'dt_treasury_thresholds', 1], 'must query the thresholds table for the office');
    a.strictEqual(t.vaultGlAccountId, 10);
    a.strictEqual(t.cashAtTellersGlAccountId, 11);
    a.strictEqual(t.bankGlAccountId, 12);
    a.strictEqual(t.borrowingsLiabilityGlAccountId, null);
    a.strictEqual(t.interestPayableGlAccountId, null, 'missing optional column → null, not undefined');
    a.strictEqual(t.shortageGlAccountId, null);
    a.strictEqual(t.reserveBufferAmount, 2500.5, 'reserve buffer must be coerced to a Number');
    a.strictEqual(t.currencyCode, 'NGN');

    // Non-numeric buffer must coerce to 0, not NaN.
    stub({ queryRows: () => Promise.resolve([{ reserve_buffer_amount: 'abc', currency_code: 'USD' }]) });
    const t2 = await getThresholds(1);
    a.strictEqual(t2.reserveBufferAmount, 0, 'unparseable buffer → 0');

    /* ---- getThresholds: empty + 404 handling --------------------------- */
    stub({ queryRows: () => Promise.resolve([]) });
    a.strictEqual(await getThresholds(1), null, 'empty result set → null');

    stub({ queryRows: () => Promise.reject({ status: 404 }) });
    a.strictEqual(await getThresholds(1), null, 'a 404 must be swallowed to null');

    stub({ queryRows: () => Promise.reject({ detail: { httpStatusCode: '404' } }) });
    a.strictEqual(await getThresholds(1), null, 'a Fineract-shaped 404 must also be swallowed');

    // A non-404 error must propagate.
    stub({ queryRows: () => Promise.reject({ status: 500, message: 'server down' }) });
    let threw = false;
    try { await getThresholds(1); } catch { threw = true; }
    a.strictEqual(threw, true, 'a 500 must NOT be swallowed');

    /* ---- upsertThresholds: validation ---------------------------------- */
    let vErr = null;
    try {
      await upsertThresholds(1, { vaultGlAccountId: 10 }); // missing several required
    } catch (e) { vErr = e; }
    a.ok(vErr, 'incomplete config must be rejected');
    a.ok(/missing required field/i.test(vErr.message));
    a.ok(/cashAtTellersGlAccountId/.test(vErr.message), 'error must name the missing fields');
    a.ok(/reserveBufferAmount/.test(vErr.message));

    // Empty-string counts as missing (a common blank-form footgun).
    let vErr2 = null;
    try {
      await upsertThresholds(1, {
        vaultGlAccountId: 10, cashAtTellersGlAccountId: 11, bankGlAccountId: 12,
        reserveBufferAmount: '', currencyCode: 'NGN'
      });
    } catch (e) { vErr2 = e; }
    a.ok(vErr2 && /reserveBufferAmount/.test(vErr2.message), 'empty-string buffer is treated as missing');

    /* ---- upsertThresholds: create vs update branch --------------------- */
    const goodInput = {
      vaultGlAccountId: 10, cashAtTellersGlAccountId: 11, bankGlAccountId: 12,
      reserveBufferAmount: '1500', currencyCode: 'NGN'
    };

    // No existing row → createRow.
    stub({ queryRows: () => Promise.resolve([]) });
    calls = [];
    await upsertThresholds(3, goodInput);
    a.strictEqual(calls.some(c => c[0] === 'createRow'), true, 'no existing row → createRow');
    a.strictEqual(calls.some(c => c[0] === 'updateConfig'), false);
    const createCall = calls.find(c => c[0] === 'createRow');
    a.strictEqual(createCall[1], 'dt_treasury_thresholds');
    a.strictEqual(createCall[2], 3, 'office id passed through');
    a.strictEqual(createCall[3].reserve_buffer_amount, 1500, 'buffer coerced to Number in the row body');
    a.strictEqual(createCall[3].vault_gl_account_id, 10, 'body must be snake_cased for Fineract');
    a.strictEqual(createCall[3].locale, 'en');
    a.strictEqual(createCall[3].dateFormat, 'yyyy-MM-dd');
    a.strictEqual(createCall[3].interest_payable_gl_account_id, null, 'unset optional → null in body');

    // Existing row → updateConfig.
    stub({ queryRows: () => Promise.resolve([{ vault_gl_account_id: 99, currency_code: 'NGN', reserve_buffer_amount: 1 }]) });
    calls = [];
    await upsertThresholds(3, goodInput);
    a.strictEqual(calls.some(c => c[0] === 'updateConfig'), true, 'existing row → updateConfig');
    a.strictEqual(calls.some(c => c[0] === 'createRow'), false);

    /* ---- requireThresholds -------------------------------------------- */
    stub({ queryRows: () => Promise.resolve([]) });
    let rErr = null;
    try { await requireThresholds(5); } catch (e) { rErr = e; }
    a.ok(rErr, 'requireThresholds must throw when unconfigured');
    a.ok(/no treasury configuration/i.test(rErr.message));
    a.ok(/5/.test(rErr.message), 'error should mention the office id');

    stub({ queryRows: () => Promise.resolve([{ vault_gl_account_id: 1, currency_code: 'NGN', reserve_buffer_amount: 1 }]) });
    const req = await requireThresholds(5);
    a.strictEqual(req.vaultGlAccountId, 1, 'requireThresholds returns the mapped config when present');
  } finally {
    api.treasury = origTreasury; // restore the real namespace for other tests
  }
}
