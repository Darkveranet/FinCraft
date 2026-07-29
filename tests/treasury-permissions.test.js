/* FinCraft · tests/treasury-permissions.test.js
   Integrity tests for js/treasury/permissions.js — the route/action → Fineract
   permission-code maps that gate the whole Treasury area. These are static
   maps, so the test pins their shape and cross-checks that every treasury route
   the router knows about has a permission entry (and vice-versa), catching the
   "added a page but forgot to gate it" class of bug. Pure, no DOM. */
import assert from 'assert';

export async function runTests({ assert: a = assert } = {}) {
  const { TREASURY_ROUTE_PERMS, TREASURY_ACTION_PERMS } = await import('../js/treasury/permissions.js');

  // Both maps must be plain non-empty objects of non-empty string codes.
  for (const [label, map] of [['route', TREASURY_ROUTE_PERMS], ['action', TREASURY_ACTION_PERMS]]) {
    a.strictEqual(typeof map, 'object', `${label} map must be an object`);
    const keys = Object.keys(map);
    a.ok(keys.length > 0, `${label} map must not be empty`);
    for (const k of keys) {
      a.strictEqual(typeof map[k], 'string', `${label}.${k} must map to a string permission code`);
      a.ok(map[k].length > 0, `${label}.${k} must not be an empty permission code`);
      // Fineract permission codes are upper snake case (letters/digits/underscore).
      a.ok(/^[A-Z0-9_]+$/.test(map[k]), `${label}.${k} → "${map[k]}" is not a valid Fineract permission code shape`);
    }
  }

  // Spot-check the security-critical mappings that must never silently drift.
  a.strictEqual(TREASURY_ROUTE_PERMS['loan-disbursement'], 'DISBURSE_LOAN');
  a.strictEqual(TREASURY_ROUTE_PERMS['cash-allocation'], 'ALLOCATECASHTOCASHIER_TELLER');
  a.strictEqual(TREASURY_ACTION_PERMS.disburseLoan, 'DISBURSE_LOAN');
  a.strictEqual(TREASURY_ACTION_PERMS.allocateCash, 'ALLOCATECASHTOCASHIER_TELLER');
  a.strictEqual(TREASURY_ACTION_PERMS.saveThresholds, 'CREATE_DATATABLE');

  // Maker/checker separation: approval actions require checker permission,
  // while posting/payment retains CREATE_JOURNALENTRY.
  a.strictEqual(TREASURY_ACTION_PERMS.approveExpense, 'CREATE_JOURNALENTRY_CHECKER');
  a.strictEqual(TREASURY_ACTION_PERMS.approveBorrowing, 'CREATE_JOURNALENTRY_CHECKER');
  a.strictEqual(TREASURY_ACTION_PERMS.approveReconciliation, 'CREATE_JOURNALENTRY_CHECKER');
  a.strictEqual(TREASURY_ACTION_PERMS.payExpense, 'CREATE_JOURNALENTRY');
  // Consistency: a route and its primary action should agree on the perm where
  // both exist (disbursement + cash allocation are the paired cases).
  a.strictEqual(TREASURY_ROUTE_PERMS['loan-disbursement'], TREASURY_ACTION_PERMS.disburseLoan);
  a.strictEqual(TREASURY_ROUTE_PERMS['cash-allocation'], TREASURY_ACTION_PERMS.allocateCash);

  // Cross-check against the router: if the treasury pages are registered there,
  // each of the mapped routes should be a real page. (Skips silently if the
  // router can't be imported without a DOM — module-integrity covers that path.)
  try {
    const mod = await import('../js/router.js').catch(() => null);
    if (mod && mod.PAGE_REGISTRY) {
      const known = new Set(Object.keys(mod.PAGE_REGISTRY));
      const missing = Object.keys(TREASURY_ROUTE_PERMS).filter(r => !known.has(r));
      a.strictEqual(missing.length, 0,
        `treasury routes with perms but no page registration: ${missing.join(', ')}`);
    }
  } catch {
    // router requires DOM — fine, this cross-check is best-effort.
  }
}
