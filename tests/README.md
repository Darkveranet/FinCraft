# FinCraft Test Suite

Run everything with:

```bash
npm install    # installs jsdom for the DOM-based suites
npm test       # node test-runner/run-tests.js
```

Tests also run automatically on GitHub via **`.github/workflows/tests.yml`**
(on every push and pull request, on Node 20 and 22).

Each file exports `runTests({ assert })` and is discovered automatically by
`test-runner/run-tests.js`. DOM-dependent suites skip gracefully with a warning
if `jsdom` is not installed; the rest run on plain Node with no dependencies.

## Coverage map

| File | What it covers | Needs jsdom |
|------|----------------|:-----------:|
| **api-contract.test.js** | **Whole API layer (`js/api/*.js`).** Core request builders (`_url`/`_headers`/`configure`/`reset`), an auto-sweep that invokes **all ~906 endpoint methods across 100 namespaces** asserting verb + `/`-rooted path, and hand-pinned contracts for representative endpoints (client commands, loan/savings lifecycle, encoded report names, datatables, treasury guard-rails, batch payload shaping). | no |
| **oidc.test.js** | **OAuth2/OIDC (Zitadel) sign-in (`js/oidc.js`) + Bearer scheme in `js/api/core.js`.** PKCE (verifier/S256 challenge), JWT decode, username extraction, authorize-URL building, discovery caching, callback state/CSRF validation + code exchange, refresh-token grant, logout URL, and Bearer-vs-Basic header selection. | no (stubs fetch/crypto/storage) |
| **config.test.js** | `js/config.js` constants, `today()`, `getRuntimeConfig()`, and the secret-free `OIDC_DEFAULT` block. | no |
| **store.test.js** | `js/store.js` get/set/patch/remove, subscribe + error isolation, permission helpers, and persist/restore for **both** Basic and OAuth2/OIDC (Bearer) sessions. | no (uses stubs) |
| **utils.test.js** / **utils-extended.test.js** | All of `js/utils.js`: `fmt`/`num`/`ini`/`sb`/`escapeHtml`/`buildHash`/`parseHash`/`fmtDate`/`debounce`/`throttle`/`timeout`. | no (uses stubs) |
| **treasury-thresholds.test.js** | `js/treasury/thresholds.js` mapping, 404 handling, validation, create-vs-update branch, `requireThresholds`. | no |
| **treasury-permissions.test.js** | `js/treasury/permissions.js` route/action → permission-code maps + router cross-check. | no |
| **module-integrity.test.js** | Imports **every** `js/**/*.js` file and calls every export with stub args to catch missing-import / const-reassignment wiring bugs. | **yes** |
| **business-logic.test.js** | Router permission gating, `initRouter` idempotency, `_extractPerms`, NPL-from-PAR computation. | **yes** |
| **accounting-fixes / error-extraction** | Accounting-module regression fixes and Fineract error-message extraction. | mixed |
| **treasury-*.test.js** (bootstrap, borrowings, dashboard, expenses, liquidity, loan-disbursement, reconciliation, teller-balance, teller-events, vault-control, borrowing-schedule) | Treasury business logic per module. | mixed |

## Notes

- The API auto-sweep is the widest net: a future refactor that drops a module,
  typos a path, or flips an HTTP verb fails here immediately.
- `store` / `utils` / `oidc` suites install minimal `localStorage` /
  `sessionStorage` / `document` / `fetch` / `crypto` stubs so they run without jsdom.
