/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · escaping-discipline.test.js

   Guards §1/§5 of the developer-recommendations report: the "high-risk" render
   helpers that interpolate backend/admin-supplied text into innerHTML must emit
   a <script>-bearing payload as INERT TEXT, never as live markup.

   We feed each real, exported helper a hostile string and assert:
     • the raw "<script>" sequence never survives into the output, and
     • parsing the output in jsdom produces ZERO live <script>/<img onerror> nodes.

   jsdom is already a devDependency, so this is cheap to run in the existing
   node-based runner (no browser needed).
   ──────────────────────────────────────────────────────────────────────────── */
import assert from 'assert';
import { JSDOM } from 'jsdom';

import { escapeHtml } from '../js/utils.js';
import {
  officeOptionsHtml,
  glOptionsHtml,
  tellerCashierOptionsHtml,
} from '../js/pages/treasury/shared.js';

const XSS = `<script>window.__xss__=1</script><img src=x onerror="window.__xss__=1">`;

// Render an HTML fragment inside a container and report what actually became live.
function liveNodes(html) {
  const dom = new JSDOM(`<!DOCTYPE html><body><div id="host"></div></body>`);
  const host = dom.window.document.getElementById('host');
  host.innerHTML = html;                       // exactly how the app injects it
  return {
    scripts: host.querySelectorAll('script').length,
    onerror: host.querySelectorAll('[onerror]').length,
    text: host.textContent,
    raw: html,
  };
}

export async function runTests({ assert: a = assert } = {}) {
  /* 1. The shared primitive itself neutralises every dangerous character. */
  a.strictEqual(
    escapeHtml(XSS),
    '&lt;script&gt;window.__xss__=1&lt;/script&gt;&lt;img src=x onerror=&quot;window.__xss__=1&quot;&gt;',
    'escapeHtml must neutralise <, >, ", \' and &',
  );

  /* 2. Teller / cashier dropdown — names come from the org config (admin-entered,
        untrusted-relative-to-other-tenants per the report's trust-boundary note). */
  {
    const html = tellerCashierOptionsHtml([
      { tellerId: 1, cashierId: 9, tellerName: XSS, cashierName: XSS },
    ]);
    const r = liveNodes(html);
    a.ok(!html.includes('<script>'), 'tellerCashierOptionsHtml must not emit a raw <script> tag');
    a.strictEqual(r.scripts, 0, 'teller/cashier names must not create live <script> nodes');
    a.strictEqual(r.onerror, 0, 'teller/cashier names must not create an onerror handler node');
  }

  /* 3. Office dropdown — office names are backend/tenant data. */
  {
    const html = officeOptionsHtml([{ id: 1, name: XSS }], 1);
    const r = liveNodes(html);
    a.ok(!html.includes('<script>'), 'officeOptionsHtml must not emit a raw <script> tag');
    a.strictEqual(r.scripts, 0, 'office names must not create live <script> nodes');
  }

  /* 4. GL account dropdown — account codes/names are accounting-config data. */
  {
    const html = glOptionsHtml([{ id: 1, glCode: XSS, name: XSS }], 1);
    const r = liveNodes(html);
    a.ok(!html.includes('<script>'), 'glOptionsHtml must not emit a raw <script> tag');
    a.strictEqual(r.scripts, 0, 'GL account labels must not create live <script> nodes');
  }

  /* 5. Sanity: a helper that DID render raw would fail this harness — proves the
        assertions above have teeth (we build the unsafe string inline, never ship it). */
  {
    const unsafe = `<div>${XSS}</div>`;   // deliberately NOT escaped
    const r = liveNodes(unsafe);
    a.ok(r.scripts >= 1 || r.onerror >= 1, 'control: an unescaped payload must register as live — proves the test can fail');
  }
}
