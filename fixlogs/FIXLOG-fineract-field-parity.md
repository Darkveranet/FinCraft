# FIXLOG — Fineract Field Parity (extract → inventory → module-by-module fix)

**Date:** 2026-07-27
**Inputs:** `app.txt` (Fineract/Mifos Angular web-app reference) + `FinCraft-review-lockin.txt` (current FinCraft codebase)
**Goal:** Extract every form field Fineract offers, keep a running inventory/gap log, then close the field gaps in FinCraft module by module.

---

## 1. Field extraction (Fineract reference)
Parsed **753 HTML / 1,413 TS** files in the reference app; harvested `formControlName` bindings from **292 form templates → 1,556 field bindings** across **21 modules**.

Outputs added to repo:
- `fixlogs/FINERACT-FIELD-INVENTORY.md` — per-module + per-component canonical field list.
- `fixlogs/fineract_field_inventory.json` — machine-readable source of truth.

Top field-density modules: `products` (236), `loans` (128), `organization` (101), `clients` (72), `system` (64), `deposits` (60), `savings` (50).

## 2. Gap inventory (FinCraft vs Fineract)
Extracted FinCraft's current fields from `views/modals/*.html` (name=) and `js/pages/**/new.js` wizards (wz- ids). Diffed against the canonical set.

Outputs added to repo:
- `fixlogs/FINCRAFT-FIELD-GAP-ANALYSIS.md` — coverage table + per-module missing-field backlog.
- `fixlogs/fincraft_gap.json` — machine-readable diff.

> Note: wizard modules (clients / loans / savings) are matched semantically via an alias map, so their reported coverage is a **conservative lower bound** — the real coverage is higher. Modal-based modules (groups-centers, shares, system, organization, products) are matched exactly and are accurate.

---

## 3. Module-by-module fixes

### ✅ Module 1 — groups-centers  (was 7 fields → now 15)
Added the missing Fineract group/center fields to both `newGroupForm` and `newCenterForm`:
- `active` + `activationDate` (replaces the old ad-hoc `autoActivate`; activation date now explicit).
- Collection-meeting block: `meetingStartDate`, `frequency` (Daily/Weekly/Monthly/Yearly), `interval`, `repeatsOnDay`.

Handlers (`js/ui/handlers/group.js`, `center.js`) updated to:
- Read `active`/`activationDate` and activate with the chosen date.
- POST a collection-meeting calendar via `api.calendars.create('groups'|'centers', id, …)` (typeId=1, repeating) when a frequency is selected.

Files: `views/modals/groups-centers.html`, `js/ui/handlers/group.js`, `js/ui/handlers/center.js`.

### ✅ Module 2 — shares  (was 7 fields → now 14)
Added the missing Fineract share-account fields to `newShareForm`:
- `savingsAccountId` (linked savings for dividend payout).
- `applicationDate` (posted alongside `submittedDate`).
- Override block: `minimumActivePeriod` (+ `minimumActivePeriodFrequencyType`), `lockinPeriodFrequency` (+ `lockinPeriodFrequencyType`).
- `allowDividendCalculationForInactiveClients` flag.

Handler (`js/ui/handlers/share-account.js`) updated to include all of the above in the create payload (conditionally, defaulting to the product where left blank).

Files: `views/modals/shares.html`, `js/ui/handlers/share-account.js`.

---

### ✅ Module 3 — system  (16-section hub — targeted the 3 real gaps)
The gap scan reported "2 fields" for system, but that only counted `views/modals/system.html`. The real system surface lives in the section-hub loaders (`js/pages/system/loaders/*`) + action modals (`js/pages/system/actions/*`). A deep audit of all 16 sections showed most were already covered (codes, code-values, business-date, jobs, account-number-prefs, entity-mappings, surveys, maker-checker). Three sections had genuine field gaps vs the Fineract reference — all now fixed:

**3a. External Services** (`edit-sms/email/amazon-s3/notification`) — was **read-only**; now fully editable.
- Added canonical field schemas matching Fineract property keys:
  - SMS: `host_name`, `port_number`, `end_point`, `tenant_app_key`
  - Email/SMTP: `username`, `password`, `host`, `port`, `useTLS`, `fromEmail`, `fromName`
  - S3: `s3_bucket_name`, `s3_access_key`, `s3_secret_key`
  - Notification: `server_key`, `gcm_end_point`, `fcm_end_point`
- Secret fields are write-only (blank = keep stored value); saves via existing `api.externalServices[group].update()`.
- File: `js/pages/system/actions/integrations.js` (`viewServiceConfig` rewritten), loader banner/button updated in `js/pages/system/loaders/integrations.js`.

**3b. Configurations** (`edit-configuration`) — was toggle-only; now edits the value.
- Added `openEditConfigModal` exposing `enabled`, `value` (numeric), `stringValue`, `dateValue` — matching the Fineract edit form. Adaptive per config data type; posts `dateFormat`/`locale` when a date is set.
- Added per-row **Edit** button + handler; value column now shows string/date/numeric value.
- Files: `js/pages/system/actions/config.js`, `js/pages/system/loaders/config.js`.

**3c. Hooks / Webhooks** (`create-hook`/`edit-hook`) — added the missing fields.
- Added `contentType` (json / form-urlencoded) and an SMS-bridge block: `phoneNumber`, `smsProvider`, `smsProviderAccountId`, `smsProviderToken` — all written into the Fineract `config[]` fieldName/fieldValue array. Token is write-only on edit.
- File: `js/pages/system/actions/integrations.js` (`openWebhookModal`).

All four modified files pass `node --check`.

---

### ✅ Module 4 — products  (6 product/charge forms hardened)
The modal-only gap scan reported products at 30%, but the **live** product forms are rich JS wizards in `js/pages/products/actions/*` (wired via `js/pages/products/index.js`), not the thin static `products.html` forms (which are superseded dead code for loan/savings). A precise payload-vs-canonical diff of each live wizard gave the true starting coverage; all core gaps are now closed.

Coverage (fields covered / Fineract canonical) — before → after:
| Product form | Before | After | Canonical |
|---|---:|---:|---:|
| Loan product | 43 | **73** | 129 |
| Savings product | 24 | **29** | 32 |
| Share product | 16 | **17** | 20 |
| Fixed deposit | 22 | **26** | 32 |
| Recurring deposit | 20 | **29** | 35 |
| Charge | 13 | **15** | 16 |

**4a. Charge** — two live entry points brought to parity.
- Static `newChargeModal` (command palette): added `chargePaymentMode` + `taxGroupId` selects (`views/modals/products.html`), wired into the `submit-charge` handler (`js/ui/handlers/charge.js`) and populated from the charge template (`js/modal-init.js`).
- Rich `openChargeFormModal` (charges page): added the `feeFrequency` recurrence select (Fineract `addFeeFrequency`) — `js/pages/charges/actions.js`.

**4b. Savings product** (`js/pages/products/actions/savings-products.js`) — added `taxGroupId` (shown with withhold-tax), dormancy day-thresholds `daysToInactive`/`daysToDormancy`/`daysToEscheat`, and `enableLockinPeriod` flag.

**4c. Fixed deposit product** — added `lockinPeriodFrequency`(+type), `taxGroupId`, and `inMultiplesOfDepositTermTypeId`.

**4d. Recurring deposit product** — added `minDepositAmount`/`maxDepositAmount`, `inMultiplesOfDepositTerm`(+type), `lockinPeriodFrequency`(+type), `adjustAdvanceTowardsFuturePayments`, `withHoldTax`+`taxGroupId`.

**4e. Share product** (`js/pages/products/actions/share-products.js`) — added `inMultiplesOf`.

**4f. Loan product** (`js/pages/products/actions/loan-products.js`) — added a new **Advanced** wizard step (now 6 steps) covering:
- General: `externalId`, `repaymentStartDateType`, `isEqualAmortization`, `enableAccrualActivityPosting`, `canUseForTopup`, `delinquencyBucketId`.
- Down payment: `enableDownPayment`, `disbursedAmountPercentageForDownPayment`, `enableAutoRepaymentForDownPayment`.
- Over-applied: `allowApprovedDisbursedAmountsOverApplied`, `overAppliedCalculationType`, `overAppliedNumber`.
- Variable installments: `allowVariableInstallments`, `minimumGap`, `maximumGap`.
- Interest recalculation: `isInterestRecalculationEnabled`, `preClosureInterestCalculationStrategy`, `rescheduleStrategyMethod`, `interestRecalculationCompoundingMethod`, `recalculationRestFrequencyType`, `recalculationRestFrequencyInterval`, `isArrearsBasedOnOriginalSchedule`.
- Floating rates: `isLinkedToFloatingInterestRates`, `floatingRatesId`, `interestRateDifferential`, `isFloatingInterestRateCalculationAllowed`, `min/default/maxDifferentialLendingRate` (drops the fixed-rate trio when floating is linked).
- **Bug fix:** payload key `allowPartialPeriodInterestCalcualtion` was misspelled → corrected to `allowPartialPeriodInterestCalculation`, so that setting now actually reaches the server (backward-compatible prefill).

Remaining loan gaps are niche/newer Fineract features (capitalized-income, buy-down fee, working-capital breach configuration, guarantee minimums, recalculation nth-day sub-options) plus non-field UI toggles — deferred as low-value.

All six modified files pass `node --check`.

---

### ✅ Module 5 — organization  (17-section hub — closed the real gaps)
The modal-only scan reported organization at 27%, but — like system/products — the live forms are rich JS modals in `js/pages/organization/actions/*` plus static create-handlers in `js/ui/handlers/*`. A component-by-component audit against the Fineract canonical set showed most entities already at parity (offices, payment-types, funds, currencies, adhoc-query, entity-datatable-checks, holidays, working-days, loan-originators, SMS/email campaigns, external-asset-owners). Four genuine gaps were found and fixed:

**5a. Cashier shift-hours** (biggest gap — an entire Fineract feature was absent). Fineract's create/edit-cashier exposes `isFullDay` + `hourStartTime`/`minStartTime`/`hourEndTime`/`minEndTime`; FinCraft had none. Added a **Full working day** toggle that reveals four time inputs, wired into both the **Allocate Cashier** and **Edit Cashier** modals + payloads. Also added the cashier `description` field to the allocate modal. (`js/pages/organization/actions/offices-staff.js`)

**5b. Edit Staff parity bug** — the edit-staff modal was missing `mobileNo` and `externalId` (both present in the create form), so editing any staff member silently wiped those values. Added both fields + payload wiring.

**5c. Edit Teller `status`** — the edit-teller modal omitted `status`, so edits dropped the active/inactive state. Added a status select (Active/Inactive) + payload wiring.

**5d. Loan originator `channelTypeId`** — the last canonical field missing from that form. Added a Channel Type select (template-driven with sensible fallbacks) + payload wiring. (`js/pages/organization/actions/integrations.js`)

Both modified files pass `node --check`.

---

### ✅ Module 6 — admin / users  (create-user parity gap closed)
The users module has two create-user routes: the static command-palette form (`newUserModal`) and the rich modal opened from the Users list/detail (`openUserFormModal` in `js/pages/users/account/detail.js`). An audit against Fineract's canonical `create-user`/`edit-user` field sets showed almost everything already covered (username, email, firstname, lastname, officeId, staffId, roles, sendPasswordToEmail, password/repeatPassword, account-locked, roles-and-permissions grid, password policy). Roles (name/description), the permission-usage grid, and password preferences (`validationPolicyId`) are all at parity, and maker-checker config lives in the System module (done in Module 3).

**Gap found & fixed:** the **rich** create form was *less* complete than the static one — it hard-coded `passwordNeverExpires = false` and had no self-service option. Added to the create branch:
- `passwordNeverExpires` toggle (was forced false, ignoring the canonical field).
- `isSelfServiceUser` toggle (portal user) — matching Fineract's create-user and the static form.

Both are now wired into the create payload. Edit branch already handled `passwordNeverExpires`/`accountNonLocked`. Self-service registration (`clientId`, `username`, `email`, `password`, `authenticationMode`) is at parity. File: `js/pages/users/account/detail.js` — passes `node --check`.

---

### ✅ Module 7 — loan application wizard (new.js) top-up
The **new-loan application** wizard (`js/pages/loans/new.js`, distinct from the loan-*product* form done in Module 4) mapped to Fineract's `loans-account-details-step` (10) + `loans-account-terms-step` (41). The happy path was solid (client, product, principal, tenure, dates, officer, fund, purpose, link-savings, external-id, with the remaining terms pulled from the product/template defaults). Two details fields and a set of officer-facing term overrides were missing — all added now.

**Details step — added 2 canonical fields:**
- `originatorExternalId` (third-party reference).
- `createStandingInstructionAtDisbursement` (checkbox).

**New "Advanced terms (override product defaults)" collapsible block** (Step 2) — every field optional; blank/false ⇒ keep product/template default, so the simple flow is unchanged:
- `repaymentEvery` + `repaymentFrequencyType` (previously forced to the template value — officers can now set e.g. fortnightly).
- `fixedEmiAmount`, `interestChargedFromDate`, `inArrearsTolerance`, `maxOutstandingLoanBalance` (tranche).
- Moratorium/grace: `graceOnPrincipalPayment`, `graceOnInterestPayment`, `graceOnInterestCharged`, `graceOnArrearsAgeing`.
- **Top-up:** `isTopup` toggle + `loanIdToClose` selector, populated from the loan template (now fetched with `activeOnly: true` so `clientActiveLoanOptions` is available); toggle reveals/hides the close-loan picker.

All overrides are conditionally added to the `POST /loans` payload only when set. Assessment inputs (income/expenses/repayment source/guarantors) + free-text purpose are still preserved as a loan Note (no native columns). File passes `node --check`.

---

## 6. Remaining backlog (queued, in priority order)
| Module | Fineract fields | Notes |
|---|---:|---|
| savings/deposits (top-up) | 79 | Nominal/interest overrides, charges, FD/RD lock-in extras. |
| clients (top-up) | 72 | Remaining datatable, family-member, and classification fields. |
| accounting | 37 | GL closures, accruals, provisioning, financial activity mappings (62% covered). |

_Loan application wizard top-up completed in Module 7 (above)._

Next turn continues from the **savings/deposits wizard top-up**, then **clients** and **accounting**, unless you re-prioritise.
