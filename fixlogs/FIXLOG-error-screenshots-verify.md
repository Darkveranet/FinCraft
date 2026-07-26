# FIXLOG — Error-screenshot verification & fixes

Source: two batches of error screenshots captured against a live Fineract backend
(`fincraft.duckdns.org`) and the read-only demo (`gprocessor.github.io`). Each reported
error was re-verified against the **current** source and the Apache Fineract API before
deciding whether a code change was needed.

## Verified against Fineract API — genuine bugs FIXED

| # | Area | Screenshot symptom | Root cause | Fix |
|---|------|--------------------|-----------|-----|
| **F‑01** | Accounting Rules → *Add Accounting Rule* | `Create failed — Validation errors exist.` | `POST /accountingrules` mandatory fields are **`accountToDebit` / `accountToCredit`**. The app was sending `debitAccountId` / `creditAccountId`, so the mandatory debit/credit params were never received. | `js/pages/accounting/actions/coa.js` — payload keys renamed to `accountToDebit` / `accountToCredit` (applies to create **and** update). |
| **F‑02** | System → Surveys → *New Survey* | `Create failed — Validation errors exist.` | `POST /surveys` mandatory fields are `key, name, countryCode, questionDatas[]` and **each question requires `key` + `responseDatas[]`**. The form only sent `key` + questions with `text/sequenceNo`, omitting `name`, question `key`, and all responses. | `js/pages/system/actions/data-mgmt.js` + `config.js` — added survey `name` (defaults to key), auto-generated question `key`s, a **Responses** column (`label=value` pairs → `responseDatas`), default `countryCode`, and consistent `dateFormat/locale` on `validTo`. Client-side guard now blocks submit until every question has ≥1 response. |

## Verified — already correct in current source (screenshots were from an older build)

| Area | Screenshot symptom | Status |
|------|--------------------|--------|
| System → COB → *Run COB Catch-Up* | `API 404 on POST /loans/catch-up-processing` | Already fixed to `POST /loans/catch-up` (see FIXLOG-ui-contract-deep-sweep D‑01). No further change. |
| Organization → Bulk Imports → *Download Template* | `API 404/406 on GET /clients/downloadtemplate` | Current source uses the correct `GET /{entity}/downloadtemplate` (raw binary). No code change. |
| Groups list | `Failed to load Groups` (full-page card) | Current loader renders inline errors and calls `GET /groups` correctly. No change. |

## Verified — NOT an app bug (user input / backend rule)

| Area | Screenshot symptom | Explanation |
|------|--------------------|-------------|
| Accounting → Financial Activities → *Add Financial Activity Mapping* | `Create failed — Errors contain reason for domain rule violation.` | Payload (`{financialActivityId, glAccountId}`) is correct. Fineract enforces a **domain rule**: e.g. *Liability Transfer* must map to a *liability* GL account. The screenshot mapped it to **Vault (AS10005)** — an *asset* account — which Fineract rejects. Choose a GL account whose type matches the activity. |
| Inter-Office Cash → *New Inter-Office Transfer* | `Transfer failed` | Payload matches `OfficeTransactionData`. On the read-only demo backend this POST is not writable, hence the failure there; against a writable tenant with the money-transfer permission it posts normally. |
