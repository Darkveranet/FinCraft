/* FinCraft · tests/config.test.js
   Unit tests for js/config.js — the constants and helpers every other module
   depends on (LOCALE/DATE_FORMAT are baked into dozens of API command bodies,
   apiBase into every URL). A silent change here would ripple everywhere, so it
   is pinned explicitly. Pure, no DOM. */
import assert from 'assert';

export async function runTests({ assert: a = assert } = {}) {
  const cfg = await import('../js/config.js');
  const { LOCALE, DATE_FORMAT, today, FINERACT_DEMO, getRuntimeConfig } = cfg;

  // Fineract's default-command locale/date-format contract.
  a.strictEqual(LOCALE, 'en');
  a.strictEqual(DATE_FORMAT, 'yyyy-MM-dd');

  // today() must emit an ISO yyyy-MM-dd string that DATE_FORMAT describes.
  const d = today();
  a.strictEqual(typeof d, 'string');
  a.ok(/^\d{4}-\d{2}-\d{2}$/.test(d), `today() should be yyyy-MM-dd, got "${d}"`);
  a.strictEqual(d, new Date().toISOString().split('T')[0]);

  // Demo endpoint shape.
  a.strictEqual(FINERACT_DEMO.apiBase, '/fineract-provider/api/v1');
  a.ok(FINERACT_DEMO.serverUrl.startsWith('https://'), 'demo server should be https');
  a.ok(FINERACT_DEMO.requestTimeoutMs > 0);
  a.ok(FINERACT_DEMO.autoConnectTimeoutMs > 0);
  a.ok(FINERACT_DEMO.autoConnectTimeoutMs <= FINERACT_DEMO.requestTimeoutMs,
    'auto-connect probe should not wait longer than a normal request');

  // getRuntimeConfig() must surface exactly the three fields core.js reads.
  const rc = getRuntimeConfig();
  a.deepStrictEqual(Object.keys(rc).sort(), ['apiBase', 'autoConnectTimeoutMs', 'requestTimeoutMs']);
  a.strictEqual(rc.apiBase, FINERACT_DEMO.apiBase);
  a.strictEqual(rc.requestTimeoutMs, FINERACT_DEMO.requestTimeoutMs);
  a.strictEqual(rc.autoConnectTimeoutMs, FINERACT_DEMO.autoConnectTimeoutMs);
}
