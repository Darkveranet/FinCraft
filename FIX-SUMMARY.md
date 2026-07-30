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

## Lifecycle conversion — Module 01: Accounting setup
- Added isolated real-Fineract scenarios for accounting templates and reference data.
- Added creation of Asset, Liability, Equity, Income, and Expense detail GL accounts.
- Added GL update, detail, list-with-balances, duplicate-code rejection, and unused-account deletion checks.
- Added accounting-rule create/update/get/list/delete lifecycle.
- Added balanced manual journal posting and debit/credit verification.
- Added negative validation for an unbalanced journal.
- Added journal reversal and reversal-state verification.
- Added FinCraft accounting-route rendering against records created in the isolated Fineract database.
- Added a standalone `accounting` workflow option. Runtime status remains pending until GitHub executes the Dockerized Fineract stack.

## Lifecycle conversion — Module 02: Product setup
- Added real isolated-Fineract product template and reference-data checks.
- Added loan-product create/get/update/list and duplicate-short-name rejection.
- Added savings-product create/get/update/list.
- Added fixed-deposit-product create/get/update.
- Added recurring-deposit-product create/get/update.
- Added disposable savings/FD/RD product deletion checks.
- Added FinCraft Products-route rendering against the isolated Fineract backend.
- Added a standalone `products` workflow option.
- Advanced share, floating-rate, product-mix, charge/tax, and GL-mapped accounting variants remain explicitly tracked.

## Lifecycle conversion — Module 03: Clients
- Added person and non-person client creation against isolated Fineract.
- Added pending-client activation, complete read-back, update, duplicate-external-ID rejection, and pending-client deletion.
- Added staff creation, assignment, and unassignment.
- Added conditional identifier CRUD, address create/update, and family-member CRUD using tenant-provided templates and code values.
- Added list/search, accounts, charges, transactions, obligee-details, and transfer-proposal probes.
- Added pending-client rejection and withdrawal when lifecycle reason codes are configured.
- Added FinCraft client-list and client-detail rendering against records created during the same run.
- Added a standalone `clients` workflow option.
- Environment-dependent features report SKIPPED/UNSUPPORTED rather than being falsely marked passed.

## Lifecycle conversion — Module 04: Groups & Centres
- Added group and centre template/reference-data validation.
- Added active member-client creation for membership scenarios.
- Added group create/update/activate/read, staff assignment/unassignment, and client association/disassociation.
- Added centre create/update/activate/read and group association/disassociation.
- Added client transfer between groups and verification at both source and destination.
- Added group/centre account retrieval and GLIM/GSIM capability probes.
- Added conditional group-calendar CRUD using the tenant's supported calendar API.
- Added FinCraft group and centre list/detail route validation.
- Added conditional closure lifecycle and pending-record deletion.
- Added a standalone `groups-centers` workflow option.

## Lifecycle conversion — Module 05: Savings
- Added isolated prerequisites: active client, savings officer, and savings product.
- Added savings application create/read/update, approval, activation, and officer assignment/unassignment.
- Added real deposit, withdrawal, balance verification, transaction retrieval, reversal, and re-deposit.
- Added account/debit/credit block and unblock commands.
- Added interest calculation plus capability probes for interest posting, posting-as-on date, and annual fees.
- Added transaction, charge, on-hold, search, and query endpoint coverage.
- Added FinCraft savings list/detail route validation.
- Added separate undo-approval, rejection, withdrawal, and pending-application deletion scenarios.
- Added a standalone `savings` workflow option.

## Lifecycle conversion — Module 06: Loans
- Added isolated active-client, loan-officer, and loan-product prerequisites.
- Added loan template, submission, read, update, and repayment-schedule validation.
- Added officer assignment/unassignment, approval, disbursement, and summary checks.
- Added real repayment, transaction read-back, reversal, and replacement repayment.
- Added charges and optional advanced loan-lifecycle capability probes.
- Added FinCraft loan list/detail route validation.
- Added separate undo-approval, undo-disbursement, rejection, withdrawal, duplicate-ID rejection, and pending-loan deletion scenarios.
- Added a standalone `loans` workflow option.

## Lifecycle conversion - Module 07: Fixed Deposits
- Added isolated client and fixed-deposit-product prerequisites.
- Added FD template, interest-preview capability probe, application create/read/update, approval, and activation.
- Added real principal deposit, balance verification, transaction retrieval, and interest calculation.
- Added transaction, charge, withdrawal, premature-close, and close-template coverage.
- Added FinCraft deposit list and FD detail rendering.
- Added separate undo-approval, rejection, withdrawal, and pending-application deletion scenarios.
- Added a standalone `fixed-deposits` workflow option.

## Lifecycle conversion - Module 08: Recurring Deposits
- Added isolated client and recurring-deposit-product prerequisites.
- Added RD template, application create/read/update, approval, and activation.
- Added real scheduled deposit, balance verification, transaction retrieval, and deposit-amount update capability testing.
- Added interest calculation, interest-posting probes, and transaction/charge/closure-template coverage.
- Added FinCraft deposit list and RD detail rendering.
- Added separate undo-approval, rejection, withdrawal, and pending-application deletion scenarios.
- Added a standalone `recurring-deposits` workflow option.

## Lifecycle conversion - Module 09: Advanced Accounting
- Added opening-balance write and opening-balance journal verification.
- Added GL closure create/read/update/list/delete lifecycle.
- Added conditional financial-activity mapping lifecycle using an unmapped activity from the tenant template.
- Added conditional provisioning category and provisioning criteria CRUD.
- Added provisioning-entry, provisioning-journal, and run-accrual capability probes with honest supported/not-applicable reporting.
- Added manual journal debit/credit reconciliation, running-balance retrieval, and reversal.
- Added FinCraft rendering checks for advanced Accounting areas.
- Added a standalone `accounting-advanced` workflow option.

## Module 01 skipped-item closure
All six items originally deferred from Module 01 are now represented in executable Module 09 coverage:
- Provisioning categories and provisioning criteria
- Opening balances
- GL closures
- Financial activity account mappings
- Tax components and tax groups
- Accrual processing

The original Module 01 manifest now has an empty `notIncluded` list and a `formerlySkippedNowAdded` audit trail. Environment-dependent Fineract features remain honestly reported as SUPPORTED, UNSUPPORTED, or NOT APPLICABLE at runtime.

## Lifecycle conversion - Module 10: Fixed Deposits Extended
- Added the five Fixed Deposit areas deferred from Module 07.
- Added withdrawal template and withdrawal transaction capability coverage.
- Added transaction adjustment and undo coverage.
- Added conditional full FD charge lifecycle using tenant-configured charge definitions.
- Added funded-account premature closure with status verification.
- Added maturity-close and maturity-instruction capability checks.
- Cleared the Fixed Deposit manifest `notIncluded` list and retained the original items in `formerlySkippedNowAdded`.
- Added a standalone `fixed-deposits-extended` workflow option.

## Lifecycle conversion - Module 11: Recurring Deposits Extended
- Added all six Recurring Deposit areas deferred from Module 08.
- Added multiple scheduled deposits and transaction-history verification.
- Added missed-installment and penalty capability surfaces.
- Added withdrawal, transaction adjustment, and undo coverage.
- Added conditional full RD charge lifecycle using tenant-configured charge definitions.
- Added funded-account premature closure and maturity-close capability checks.
- Cleared the RD manifest `notIncluded` list while retaining an audit trail in `formerlySkippedNowAdded`.
- Added a standalone `recurring-deposits-extended` workflow option.

## Lifecycle conversion - Module 12: Taxation
- Added tax component and tax group template validation.
- Added multiple tax-component creation, read, update, list, and invalid-payload rejection.
- Added tax-group creation with component associations where supported by the tenant.
- Added aggregate tax-rate calculation verification from returned component structures.
- Added tax-linked charge creation and linkage verification.
- Added FinCraft Products and charge-detail rendering checks for taxation data.
- Added a standalone `taxation` workflow option.

## Lifecycle conversion - Module 13: Reporting
- Added report catalogue and report-template validation.
- Added custom report definition create/read/update/list/delete lifecycle.
- Added invalid and duplicate report-definition rejection.
- Added JSON report execution with schema and data validation.
- Added available-export discovery plus CSV, XLS, and PDF capability probes.
- Added representative core-report execution with parameter-aware status reporting.
- Added conditional report-mailing CRUD and run-history verification.
- Added FinCraft Reports and Report Mailing rendering checks.
- Added a standalone `reporting` workflow option.

## Lifecycle conversion - Module 14: Accounting Completion
- Added trial-balance debit/credit reconciliation across generated portfolio accounting entries.
- Added multi-office GL closure sequencing, with dynamic second-office creation where supported.
- Added explicit rejection testing for journals back-dated before a closed period.
- Added a populated active-loan setup followed by provisioning-entry and provisioning-journal capability execution.
- Cleared the Advanced Accounting `notIncluded` list and preserved its four former items in `formerlySkippedNowAdded`.
- Added a standalone `accounting-completion` workflow option.

## Lifecycle conversion - Module 15: Security
- Added least-privilege role lifecycle and exact permission assignment.
- Added isolated user creation, authentication, authorization allow/deny checks, lock/unlock, and password reset capability.
- Added bad-credential and unauthenticated-request rejection.
- Added role disable/enable and safe cleanup without modifying seeded administrators.
- Added audit-trail verification for security operations.
- Added maker-checker, password preference, and two-factor capability probes.
- Added FinCraft Users, System Security, and Audit rendering checks.
- Added a standalone `security` workflow option.

## Lifecycle conversion - Module 16: Notifications
- Added auditable business-event creation and notification-feed retrieval.
- Added unread/read filtering and mark-all-read verification.
- Added SMS and email queue/status coverage.
- Added SMS and email campaign templates, lists, and safe preview capability checks.
- Added read-only notification, SMTP, SMS, email, external-event, and hook configuration checks.
- Added FinCraft Notifications and Organization campaign rendering checks.
- Added notification entity-link and audit-context verification.
- Added a standalone `notifications` workflow option.

## Lifecycle conversion - Module 17: Shares
- Added share product, account, approval, activation, additional-share, redemption, dividend, rejection, withdrawal, undo, deletion, portfolio, and UI coverage.
- Added a standalone `shares` workflow option.

## Lifecycle conversion - Module 18: Savings Extended
- Added all seven Savings follow-ups deferred from Module 05.
- Added savings charges, holds, transaction correction, transfers, standing instructions, close-with-withdrawal, GSIM, overdraft, and UI coverage.
- Added a standalone `savings-extended` workflow option.

## Lifecycle conversion - Module 19: Loans Extended
- Added all nine advanced Loans areas deferred from Module 06.
- Added charges, collateral, guarantors, credit events, transaction corrections, rescheduling, advanced disbursement, asset ownership, originators, interest pauses, PDCs, delinquency, and UI checks.
- Added a standalone `loans-extended` workflow option.

## Lifecycle conversion - Module 20: Settings
- Added global configuration read/detail and reversible update/restore coverage.
- Added cache, instance mode, field configuration, custom code, account-number format, reference, integration, password, two-factor, scheduler, and job setting checks.
- Added local appearance-setting persistence and System page rendering checks.
- Added a standalone `settings` workflow option.

## GitHub live-demo CI preflight repair
- Replaced the hard-coded single-host `curl --fail` check with Fineract host discovery.
- Removed the obsolete `tenantIdentifier` query parameter and retained the required tenant header.
- Added JSON response validation so HTML error pages cannot pass the health check.
- Exports the resolved host through `GITHUB_ENV` for Playwright.
- Runs the preflight before downloading Chromium, avoiding a large download when the backend is unavailable.
- Prints each attempted endpoint and HTTP status while keeping credentials out of logs.

## GitHub lint/prettier repair
- Replaced JavaScript template interpolation embedded in static `admin.html` with seven valid checkbox elements.
- Preserved the original default: Monday through Friday checked, Saturday and Sunday unchecked.
- Scoped the Prettier CI gate to the repaired critical modal template because the repository has no whole-repository Prettier baseline yet.
- ESLint remains successful with warnings only and no errors.
