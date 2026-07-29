# FinCraft Audit Hardening - 29 July 2026

## Repository changes
- OAuth access, refresh and ID tokens are no longer persisted in Web Storage.
- Treasury segregation-of-duties guards prevent maker self-approval and require a distinct expense payer.
- Reconciliation captures the count submitter and blocks that actor from approving the variance.
- Treasury permissions distinguish read, maker, checker and posting responsibilities.
- Entity checker roles can load the native maker-checker queue.
- Netlify CSP and Permissions-Policy were hardened.
- nginx now verifies upstream Fineract TLS using an internal CA.
- Mutable-branch auto-deployment is disabled by default.
- Deployment image values require digest review before production promotion.
- Production acceptance and remediation evidence documents were added.

## Verification
- Unit/integration/module tests: 25 passed, 0 failed.
- API contract sweep: 906 methods across 100 namespaces.
- Module integrity: 1,106 exported functions across 352 files.
- Duplicate keys/handlers/calls: 0.
- New unescaped innerHTML violations: 0.

## Important boundary
Atomic multi-system financial posting, immutable database records, server authorization, tenant isolation, centralized append-only audit storage, disaster recovery, DAST and load testing cannot be truthfully completed by frontend code alone. They remain explicit production-blocking acceptance gates in `deploy/PRODUCTION-ACCEPTANCE.md`.

## GitHub CI live E2E addition
- Added a serialized Playwright job against the official Mifos API demo endpoint.
- Uses the real FinCraft login UI and authenticated demo session.
- Crawls every route permitted to the demo user and explicitly checks core operational modules.
- Fails on uncaught browser errors and Fineract 5xx responses.
- Uploads Playwright traces and test results for audit evidence.
- Public-demo execution is read-only; mutation and financial posting tests require a dedicated seeded UAT tenant via GitHub secrets.

## Isolated Fineract transactional CI
- Added a manual and nightly GitHub Actions workflow that starts the official Apache Fineract PostgreSQL Docker Compose stack on the runner.
- Added a hard target guard that refuses transactional execution against shared Mifos hosts or any non-local target.
- Added a real client lifecycle gate: create, activate, retrieve, render in FinCraft, update, and verify persistence.
- Added isolated core endpoint checks and automatic traversal of every authorized FinCraft route.
- Added an API-module coverage manifest and a regression test that fails if a new API module has no declared E2E owner.
- Added Playwright/Fineract logs and evidence artifacts, followed by guaranteed container and volume teardown.
- Important: infrastructure coverage and route coverage are not falsely labelled as complete financial lifecycle coverage. Loan, savings, accounting, maker-checker and Treasury write scenarios remain explicitly tracked for implementation in independent specs.
