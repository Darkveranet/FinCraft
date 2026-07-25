/* FinCraft · tests/utils-extended.test.js
   Complements the existing utils.test.js by covering the helpers it doesn't:
   sb() status-badge class mapping + HTML-escaping of the label, num()/fmt()
   formatting incl. the currency fallback, debounce()/throttle() timing
   behaviour, and additional parseHash()/buildHash()/fmtDate() edge cases.
   utils.js imports store.js (which reads storage + document at load), so the
   minimal browser stubs are installed before import. No jsdom required. */
import assert from 'assert';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function makeStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}

export async function runTests({ assert: a = assert } = {}) {
  const set = (name, value) => { try { Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); } catch { globalThis[name] = value; } };
  set('localStorage', makeStorage());
  set('sessionStorage', makeStorage());
  set('document', { documentElement: { setAttribute() {} } });

  const { sb, num, fmt, ini, escapeHtml, debounce, throttle, buildHash, parseHash, fmtDate } = await import('../js/utils.js');
  const { store } = await import('../js/store.js');

  /* ---- sb(): status → badge class + escaped label ---------------------- */
  a.ok(sb('Active').includes('b-success'), 'active → success');
  a.ok(sb('OVERDUE').includes('b-danger'), 'overdue → danger (case-insensitive)');
  a.ok(sb('Pending Approval').includes('b-warn'), 'multi-word status mapped');
  a.ok(sb('Something Unknown').includes('class="badge "'), 'unknown status → no colour class');
  a.ok(sb('Active').includes('Active'), 'label text preserved');
  // The label must be HTML-escaped to prevent injection via a status string.
  a.ok(sb('<img src=x>').includes('&lt;img'), 'status label must be escaped');
  a.ok(sb(null).includes('—'), 'null status → em dash');

  /* ---- num() / fmt() --------------------------------------------------- */
  a.strictEqual(num(1234567), new Intl.NumberFormat().format(1234567));
  a.strictEqual(num(null), '—');
  a.strictEqual(num(NaN), '—');
  a.strictEqual(num(undefined), '—');
  a.strictEqual(fmt(null), '—');
  a.strictEqual(fmt(NaN), '—');
  // fmt() picks up the store's default currency when none is passed.
  store.set('defaultCurrency', 'NGN');
  const ngn = fmt(1000);
  a.ok(/1,000/.test(ngn) || /NGN/.test(ngn), `expected NGN-formatted value, got "${ngn}"`);
  // Explicit currency overrides the store default.
  const usd = fmt(1000, 'USD');
  a.ok(/\$|USD/.test(usd), `expected USD formatting, got "${usd}"`);
  // An invalid currency code must fall back gracefully, not throw.
  let fellBack = true;
  try { const r = fmt(5, 'NOTACCY'); a.ok(r.includes('NOTACCY') || r.includes('5')); } catch { fellBack = false; }
  a.strictEqual(fellBack, true, 'fmt() must not throw on an unknown currency');

  /* ---- ini() edge cases ------------------------------------------------ */
  a.strictEqual(ini('  mary   jane  watson '), 'MJ', 'extra whitespace collapsed, first two initials');
  a.strictEqual(ini(null), '?');
  a.strictEqual(ini(undefined), '?');

  /* ---- escapeHtml ------------------------------------------------------ */
  a.strictEqual(escapeHtml(null), '', 'null → empty string');
  a.strictEqual(escapeHtml(123), '123', 'non-strings are coerced');

  /* ---- buildHash / parseHash round-trip -------------------------------- */
  const hash = buildHash('clients', { id: '42', tab: 'accounts' });
  a.ok(hash.startsWith('#clients?'));
  globalThis.location = { hash };
  const parsed = parseHash();
  a.strictEqual(parsed.page, 'clients');
  a.strictEqual(parsed.params.id, '42');
  a.strictEqual(parsed.params.tab, 'accounts');
  // Empty hash defaults to the dashboard.
  globalThis.location = { hash: '' };
  a.strictEqual(parseHash().page, 'dashboard', 'empty hash → dashboard');
  // buildHash drops empty/null/undefined params.
  a.strictEqual(buildHash('page', { a: '', b: null, c: undefined }), '#page', 'blank params dropped → bare page hash');

  /* ---- fmtDate --------------------------------------------------------- */
  a.strictEqual(fmtDate(null), '—');
  a.ok(fmtDate([2024, 12, 25]).includes('2024'), 'array (Fineract) date form');
  a.ok(fmtDate('2024-06-15').includes('2024'), 'ISO string date form');
  a.strictEqual(fmtDate('not-a-date'), 'not-a-date', 'unparseable date returned as-is');

  /* ---- debounce: only the trailing call fires ------------------------- */
  let dCount = 0, dLast = null;
  const deb = debounce(v => { dCount++; dLast = v; }, 30);
  deb('a'); deb('b'); deb('c');
  a.strictEqual(dCount, 0, 'debounced fn must not fire synchronously');
  await sleep(60);
  a.strictEqual(dCount, 1, 'debounce should collapse a burst into one call');
  a.strictEqual(dLast, 'c', 'debounce keeps the last args');

  /* ---- throttle: leading call fires immediately ----------------------- */
  let tCount = 0;
  const thr = throttle(() => { tCount++; }, 40);
  thr(); // leading edge fires now
  a.strictEqual(tCount, 1, 'throttle fires on the leading edge');
  thr(); thr(); // suppressed within the window
  a.strictEqual(tCount, 1, 'throttle suppresses calls inside the window');
  await sleep(70);
  a.ok(tCount >= 2, 'throttle emits a trailing call after the window');
}
