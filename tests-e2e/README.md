# Live Fineract Demo E2E

GitHub Actions runs Playwright against FinCraft served locally while the browser connects to the public Mifos/Fineract demo.

The CI suite:
- logs in through the real FinCraft login screen;
- verifies an authenticated session;
- discovers and opens every route allowed to the authenticated demo user;
- explicitly exercises clients, groups, centers, loans, savings, accounting, reports and approvals;
- fails on uncaught browser errors and Fineract HTTP 5xx responses;
- uploads traces/screenshots/results as workflow artifacts.

The public demo is shared and periodically reset, so this suite is deliberately read-only. Destructive and financial-posting E2E tests must use a dedicated seeded UAT tenant, supplied through `FINERACT_*` GitHub Actions secrets.
