# FIXLOG — OpenAPI Coverage-Gap Remediation

**Source:** `FinCraft_OpenAPI_Coverage_Gaps.md` (code-driven diff of the Fineract OpenAPI spec against
the endpoints FinCraft's API layer actually calls).

**Scope of this pass:** implement API-layer wrappers for every genuine capability gap the audit
identified **except Working Capital Loans** (53 ops), which was explicitly deferred. Everything else
in the audit's "genuine capability gaps" list is now wired at the API layer (`js/api/*.js`) and
exposed on the `api` client via `js/api/index.js`.

> Note on layer: the audit measures **API coverage** ("endpoints the API layer doesn't call"), so the
> fix is at the API-wrapper layer. New wrappers are thin, correctly-routed pass-throughs matching the
> spec's paths/verbs/query-params; building bespoke UI screens for each area is out of scope for a
> coverage-gap remediation and can be layered on later against these now-available methods.

---

## A. Whole modules that had ZERO implementation — now wired (Working Capital excluded)

| Area | New file | `api` namespace(s) | Ops |
|---|---|---|---|
| Interoperation (mobile-money / interbank) | `js/api/interoperation.js` | `api.interoperation` | 19 |
| Surveys & PPI (Social Performance) | `js/api/social-performance.js` | `api.scorecards`, `api.surveyData`, `api.likelihood`, `api.povertyLine` | 19 |
| Credit Bureau | `js/api/credit-bureau.js` | `api.creditBureauConfig`, `api.creditBureauIntegration` | 17 |
| Interest Rate Charts | `js/api/interest-rate-charts.js` | `api.interestRateCharts` | 12 |
| Scheduled Report Mailing Jobs | `js/api/report-mailing.js` | `api.reportMailingJobs` (incl. `.runHistory`) | 7 |
| MIX Market XBRL reporting | `js/api/mix-xbrl.js` | `api.mixXbrl` | 4 |
| Inter-office cash transactions | `js/api/office-transactions.js` | `api.officeTransactions` | 4 |
| ~~Working Capital Loans~~ | — | **excluded by request** | ~~53~~ |

Notes:
- **Surveys** — the audit's SPM area spans two distinct Fineract resources: `/v1/surveys/...`
  (scorecards + lookup tables) and `/v1/survey/...` (data collection). Both are wired. The admin-side
  survey CRUD (`/v1/surveys` create/update/activate) already existed in `api/admin.js#makeSurveysAdminAPI`
  and was **not** duplicated.
- **Credit Bureau** — split into config (`CreditBureauConfigurationApiResource`) and integration
  (`CreditReportApiResource`) namespaces to mirror the two server resources.

## B. Individual endpoint gaps inside otherwise-implemented modules — now wired

Added onto existing factories:

- **Loans** (`js/api/loans.js` → `makeLoansAPI`): `catchUp`, `isCatchUpRunning`, `oldestCobClosed`,
  `lockedAccounts` (`/loans/locked`), `pointInTimeSearch` (`POST /loans/at-date/search`),
  `capitalizedIncomeAllocation` (`/loans/{id}/capitalized-incomes/{txId}`).
- **Loan collateral (by id)**: new `makeLoanCollateralManagementAPI` → `api.loanCollateralManagement`
  (`GET`/`DELETE /loan-collateral-management/{id}`). Distinct from the org-wide
  `api.collateralManagement` (`/collateral-management`).
- **Delinquency buckets** (`makeDelinquencyBucketsAPI`): `bucketTemplate` (`/delinquency/buckets/template`).
- **External Asset Owners** (`makeExternalAssetOwnersAPI`): `loanProductAttributes` +
  `createLoanProductAttribute` + `updateLoanProductAttribute`
  (`/external-asset-owners/loan-product/{loanProductId}/attributes[/ {id}]`).
- **Jobs** (`js/api/admin.js` → `makeJobsAPI`): `businessJobNames` (`/jobs/names`), `availableSteps`,
  `steps`, `updateSteps`, `executeInline` (`/jobs/{jobName}/inline`), and the `short-name/*` variants
  (`getByShortName`, `executeByShortName`, `updateByShortName`, `historyByShortName`).
- **Scheduler** (new `makeSchedulerAPI` → `api.scheduler`): `status`, `start`, `stop`, `command`
  (`GET`/`POST /scheduler`).
- **Instance mode** (new `makeInstanceModeAPI` → `api.instanceMode`): `update` (`PUT /instance-mode`).
- **Field configuration** (new `makeFieldConfigurationAPI` → `api.fieldConfiguration`): `get`
  (`/fieldconfiguration/{entity}`).
- **Reports** (`js/api/reports.js` → `makeReportsAPI`): `template` (`/reports/template`).
- **Search** (`js/api/misc.js` → `makeSearchAPI`): `template` (`/search/template`).
- **Images** (`makeImagesAPI`): `update` (`PUT /{entityType}/{entityId}/images`) — previously only
  create/delete, so "change photo" had to delete-then-recreate.
- **Tellers/Cashiers** (`js/api/organization.js` → `makeTellersAPI`): `allCashiers`
  (top-level `GET /cashiers`, filterable by office/teller/staff/date) — distinct from the per-teller
  `cashiers(tellerId)`.
- **Fixed deposits** (`js/api/savings-deposits.js` → `makeFixedDepositsAPI`): `calculateInterestPreview`
  (`/fixeddepositaccounts/calculate-fd-interest`) — a standalone maturity calculator that creates nothing.
- **Loan products** (`js/api/products.js` → `makeLoanProductsAPI`): `basicDetails`
  (`/loanproducts/basic-details`).
- **Share products** (`makeShareProductsAPI`): `command` — `POST /products/{type}/{productId}?command=…`
  (`handleCommandsShareProduct`).
- **Groups** (`js/api/groups-centers.js` → `makeGroupsAPI`): `unassignStaffCommand` — the dedicated
  `/groups/{groupId}/command/unassign_staff` literal path (alternate to the already-wired
  `?command=unassignStaff`).

## Wiring

All new factory functions are imported and instantiated in `js/api/index.js` (`FineractAPIFull`
constructor). Verified: the client instantiates with all 15 new namespaces present and every wrapper
method resolving to a function. Full test suite: **16 passed, 0 failed** (unchanged from baseline).

## Verification of exact paths/params

Query-param sets and paths were confirmed against the target `fineract openAPI.json` before wiring
(e.g. `interestratecharts?productId`, `mixreport?startDate&endDate&currency`,
`reportmailingjobrunhistory?reportMailingJobId&offset&limit&orderBy&sortOrder`,
`cashiers?officeId&tellerId&staffId&date`, `loans/locked?page&limit`,
`fixeddepositaccounts/calculate-fd-interest?principalAmount&annualInterestRate&tenureInMonths&…`,
`scheduler?command`).
