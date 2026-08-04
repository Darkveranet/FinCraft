# Isolated transactional E2E

This suite targets a disposable Apache Fineract instance started inside GitHub Actions. It never permits transactional execution against public Mifos hosts.

Implemented real-write gate:
- create active client;
- retrieve and verify the client through Fineract;
- open the created client through FinCraft;
- update and re-read the client;
- verify all core platform endpoints;
- render every authorized FinCraft route;
- ensure every `js/api` module has E2E ownership in the coverage manifest.

The manifest distinguishes infrastructure/API-surface coverage from completed lifecycle coverage. A module is not release-certified merely because its route renders. Further loan, savings, accounting, maker-checker and Treasury lifecycle scenarios must be added as independent specs and changed to completed status only after CI proves them.

## Function inventory and honest status

The workflow now scans all functions under `js/api`, `js/pages`, and `js/treasury` and emits both JSON and Markdown inventories. The report labels functions as `REFERENCED` or `UNTESTED`; Playwright results separately show `PASSED` or `FAILED`. This deliberately prevents an untested command from being mistaken for a working command.

**Known limitation (2026-08-03), stated plainly rather than worked around:**
`scripts/e2e/function-inventory.mjs`'s `REFERENCED` check is literal-name-token
matching against the concatenated text of every `tests-e2e/**/*.mjs` file — it
is not code coverage. A test that drives a page through real DOM interaction
(click a button, fill a field, assert on rendered content — the pattern this
whole suite and modules 24+ use) genuinely exercises that page's internal
functions without ever typing their names, so it won't move this metric even
though the code path is real. Conversely, a function name appearing
incidentally in an unrelated test's comment or string would count as
"referenced" without the function ever running. Treat this inventory as a
rough, directional signal (useful for spotting modules with literally zero
test-file mentions at all) — not as proof of, or absence of, real coverage.
The Playwright test count and pass/fail status remain the reliable signal.

## Modules 24+ — UI-interaction gap-filling (2026-08-03)

Modules 01–23 above give deep, hand-crafted lifecycle coverage for most core
resources. A route-by-route audit against `js/router.js`'s 49 registered
routes found 33 with zero interaction-level testing — only ever touched by
module 02's shallow "does it render" smoke check. Modules 24+ close that gap
in router order, one batch per session, each doing real interaction (fill
forms, click through multi-step wizards, verify results via the API) rather
than another render-only check:

- **24** — Dashboard: KPI load, filters, refresh/export, quick-action modals.
- **25** — Client-new wizard (Type → Personal → Identity → Review), full click-through + submit.
- **26** — Loan-new wizard (Applicant → Loan Details → Assessment → Review), full click-through + submit.
- **27** — Savings-new wizard (Account Holder → Product → Terms → Review), full click-through + submit.

Remaining gap routes (batch 2+, in router order): `collections`, `transfers`,
`remittances`, `treasury` (+ 7 sub-routes: `treasury-dashboard`,
`teller-console`, `cash-allocation`, `loan-disbursement`, `treasury-expenses`,
`treasury-borrowings`, `treasury-reconciliation`), `tasks`, `charges`,
`collaterals`, `users`, `analytics`, `search`, `profile`, `datatables`,
`surveys`, `templates`, `navigation`, `self-service`, `interest-rate-charts`,
`mix-xbrl`, `office-transactions`, `credit-bureau`, `interoperation`,
`scheduler`.
