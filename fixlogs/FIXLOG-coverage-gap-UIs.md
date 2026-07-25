# FIXLOG — Coverage-Gap UIs (make the project complete)

**Goal:** build real, navigable UI screens for every API area wired in
`FIXLOG-coverage-gaps.md` (Working Capital Loans excluded, as before), so the previously
"API-only" capabilities are usable end-to-end from the app.

## New page modules (`js/pages/*.js`)

| Page | Route | Nav group | Backing API |
|---|---|---|---|
| `interest-rate-charts.js` | `#interest-rate-charts` | Finance | `api.interestRateCharts` — chart list + create/edit/delete, and per-chart **slab** management (add/delete tiered rates). |
| `report-mailing.js` | `#report-mailing` | Finance | `api.reportMailingJobs` — jobs list, create (report picker + recipients + RRULE + attachment format + start datetime), delete, and a **run-history** modal. |
| `mix-xbrl.js` | `#mix-xbrl` | Finance | `api.mixXbrl` — generate the XBRL report for a date range/currency (with XML download), browse taxonomy, view taxonomy→GL mapping. |
| `office-transactions.js` | `#office-transactions` | Treasury | `api.officeTransactions` — inter-office cash transfer list + new-transfer modal (from/to office, amount, currency, allocation/settlement) + delete. |
| `credit-bureau.js` | `#credit-bureau` | Admin | `api.creditBureauConfig` + `api.creditBureauIntegration` — tabbed Bureaus / Loan-Product Mappings / Credit-Report lookup (live fetch + saved). |
| `interoperation.js` | `#interoperation` | Admin | `api.interoperation` — health check, party (identifier) lookup, and account inspector (details/identifiers/KYC/transactions). |
| `surveys-spm.js` | `#surveys` (repointed) | Finance | `api.surveyData` + `api.scorecards` + `api.likelihood` + `api.povertyLine` — surveys list, per-survey scorecards modal, and PPI Likelihood / Poverty-Line lookups. |
| `scheduler.js` | `#scheduler` | Admin | `api.scheduler` + `api.jobs` — scheduler start/stop/status, business-job picker, per-job **business-step** view, available steps, and **run-inline** execution. |

## Routing / navigation

- `js/router.js` — added 7 new routes and **repointed `surveys`** from the old
  `misc.js?view=surveys` stub to the full `surveys-spm.js` page.
- `js/ui/shell.js` — added the new entries to the sidebar `NAV_GROUPS` (Finance / Treasury /
  Admin) so they're discoverable.

## Permission gating

Following this codebase's established rule of **never inventing a permission code** (see the
`shares` / `surveys` / treasury-route precedents): routes backed by a **confirmed-existing** code
are gated on it — `report-mailing`/`mix-xbrl` → `READ_REPORT`, `office-transactions` →
`READ_OFFICE`. Routes whose real Fineract permission code could not be verified against a live
server (`interest-rate-charts`, `credit-bureau`, `interoperation`, `scheduler`, and `surveys` as
before) are gated **authenticated-only (`null`)** with an inline comment; the server still enforces
the real permission on every call, and per-action buttons remain subject to it.

## Conventions followed

- Each page exports `async render(c, params)` and is lazy-loaded by the router, matching every
  existing page.
- Reused the shared UI kit exactly: `page-header`, `card`, `table`, `filter-bar`, `kpi`/`badge`
  classes, `toast` / `confirm` from `../ui.js`, `escapeHtml`/`fmt`/`num`/`fmtDate` from
  `../utils.js`, and `extractFineractError` for error surfacing. Modals use the standard
  `insertAdjacentHTML` into `#modalRoot` + `[data-close-modal]` pattern.
- List responses are read tolerantly (`Array.isArray(res) ? res : res.pageItems || []`) since
  Fineract mixes bare-array and paged shapes across resources.
- Date/enum handling matches the app (`yyyy-MM-dd` + `locale:'en'`; datetime-local → Fineract
  `yyyy-MM-dd HH:mm:ss`; PortfolioAccountType-style numeric enums).

## Verification

- `node --check` on all 8 new pages + `router.js` + `shell.js` + `api/index.js`: **0 errors**.
- Static import/export resolution across all new pages: **all specifiers resolve** to real exports.
- Runtime `document is not defined` on bare-Node import is **environmental** (an existing page,
  `collateral.js`, throws identically without jsdom) — not a code issue.
- API-method presence check: every method each page calls exists on the `api` client.
- `npm test`: **16 passed, 0 failed** (unchanged from baseline).

## Scope note

These pages surface the core CRUD/console workflow of each area. Deep, bespoke sub-flows (e.g.
full interoperation quote→transfer settlement wizards, survey question-builder, or WCL) are not
included — WCL remains explicitly out of scope per instruction, and the remaining depth can be
layered on top of these now-available API methods and screens.
