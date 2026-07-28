/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · escaping-discipline.test.js

   Guards §1/§5 of the developer-recommendations report: the "high-risk" render
   helpers that interpolate backend/admin-supplied text into innerHTML must emit
   a <script>-bearing payload as INERT TEXT, never as live markup.

   We feed each real, exported helper a hostile string and assert:
     • the raw "<script>" sequence never survives into the output (string-level,
       always runs — this is the core XSS guarantee), and
     • parsing the output in jsdom produces ZERO live <script>/<img onerror>
       nodes (deep check — runs only when jsdom loads).

   jsdom is an OPTIONAL devDependency: on some CI Node builds its bundled undici
   fails to initialise (webidl.util.markAsUncloneable). Per the convention in
   business-logic/module-integrity/wizard-review tests, we dynamically import it
   inside a try/catch and skip only the DOM-parse layer if it is unavailable —
   the string-level assertions still fully exercise the escaping contract.

   Modules are imported dynamically AFTER a minimal document/storage shim is
   installed, because the app graph → store.js runs store.restore() at module
   load, which touches document.documentElement (absent in the bare Node runner).
   ──────────────────────────────────────────────────────────────────────────── */
import assert from 'assert';

function installBrowserShim() {
  if (typeof globalThis.document === 'undefined' || !globalThis.document) {
    globalThis.document = { documentElement: { setAttribute() {}, getAttribute() { return null; } } };
  }
  if (!globalThis.localStorage) {
    const mk = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
    globalThis.localStorage = mk();
    globalThis.sessionStorage = mk();
  }
}

const XSS = `<script>window.__xss__=1</script><img src=x onerror="window.__xss__=1">`;

export async function runTests({ assert: a = assert } = {}) {
  installBrowserShim();

  const { escapeHtml } = await import('../js/utils.js');
  const { officeOptionsHtml, glOptionsHtml, tellerCashierOptionsHtml } =
    await import('../js/pages/treasury/shared.js');

  // Optional deep-check layer. If jsdom can't initialise on this Node build,
  // liveNodes() stays null and we skip only the node-level assertions.
  let JSDOM = null;
  try {
    ({ JSDOM } = await import('jsdom'));
  } catch {
    console.warn('[escaping-discipline] jsdom unavailable — running string-level XSS checks only (DOM-parse layer skipped).');
  }

  // Render an HTML fragment inside a container and report what actually became live.
  const liveNodes = JSDOM
    ? (html) => {
        const dom = new JSDOM(`<!DOCTYPE html><body><div id="host"></div></body>`);
        const host = dom.window.document.getElementById('host');
        host.innerHTML = html;                     // exactly how the app injects it
        return {
          scripts: host.querySelectorAll('script').length,
          onerror: host.querySelectorAll('[onerror]').length,
        };
      }
    : null;

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
    a.ok(!html.includes('<script>'), 'tellerCashierOptionsHtml must not emit a raw <script> tag');
    a.ok(!/<img[\s>]/i.test(html), 'tellerCashierOptionsHtml must not emit a raw <img> tag (onerror vector inert)');
    if (liveNodes) {
      const r = liveNodes(html);
      a.strictEqual(r.scripts, 0, 'teller/cashier names must not create live <script> nodes');
      a.strictEqual(r.onerror, 0, 'teller/cashier names must not create an onerror handler node');
    }
  }

  /* 3. Office dropdown — office names are backend/tenant data. */
  {
    const html = officeOptionsHtml([{ id: 1, name: XSS }], 1);
    a.ok(!html.includes('<script>'), 'officeOptionsHtml must not emit a raw <script> tag');
    if (liveNodes) {
      const r = liveNodes(html);
      a.strictEqual(r.scripts, 0, 'office names must not create live <script> nodes');
    }
  }

  /* 4. GL account dropdown — account codes/names are accounting-config data. */
  {
    const html = glOptionsHtml([{ id: 1, glCode: XSS, name: XSS }], 1);
    a.ok(!html.includes('<script>'), 'glOptionsHtml must not emit a raw <script> tag');
    if (liveNodes) {
      const r = liveNodes(html);
      a.strictEqual(r.scripts, 0, 'GL account labels must not create live <script> nodes');
    }
  }

  /* 5. Sanity: a helper that DID render raw would fail this harness — proves the
        assertions above have teeth (we build the unsafe string inline, never ship it). */
  {
    const unsafe = `<div>${XSS}</div>`;   // deliberately NOT escaped
    a.ok(unsafe.includes('<script>'), 'control: an unescaped payload must contain a raw <script> — proves the string check can fail');
    if (liveNodes) {
      const r = liveNodes(unsafe);
      a.ok(r.scripts >= 1 || r.onerror >= 1, 'control: an unescaped payload must register as live — proves the DOM check can fail');
    }
  }
}
