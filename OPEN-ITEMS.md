# FinCraft — Open Items Tracker

**Single source of truth for outstanding work.** This file replaces the old
`fixlogs/` prose (which read as "done" history and was easy to lose track of) and
the duplicated `checklist/` copies — both retired on 2026-07-28. Completed
engineering detail now lives in **git commit history**; anything still *open*
lives here. Convert each unchecked box into a GitHub issue using
`.github/ISSUE_TEMPLATE/` — this file is the index; issues are the working queue.

> **Workflow:** new gaps/bugs → add a checkbox here → (optionally) open a GitHub
> issue from the template → tick/remove the box when done. Do **not** create new
> `fixlogs/*.md` files.

---

## 0. Done — recorded so audits stop re-flagging them

- [x] **Treasury integration — COMPLETE (Phases 0–13).** Backend datatables +
      persistence + all 8 UI screens + sidebar nav + tenant bootstrap /
      self-healing / health. All 8 treasury routes gated on the real Fineract
      permission of the operation each screen performs (single source of truth:
      `js/treasury/permissions.js`); no invented permission codes. 12 treasury
      test suites pass.
- [x] **CI test-runner hardening (2026-07-28).** Fixed 5 CI-only failures that
      did not reproduce locally:
      - `js/store.js` `restore()` now guards `document` access (`typeof document
        !== 'undefined'`) so importing the store singleton no longer throws
        `document is not defined` in non-DOM contexts (Node test runner, service
        worker, tooling). This was the root of the `store` / `treasury-bootstrap`
        / `utils` / `utils-extended` cascade (an errored ES module is cached, so
        every later importer inherited the throw).
      - `tests/escaping-discipline.test.js` now imports `jsdom` **dynamically**
        inside try/catch (matching `business-logic` / `module-integrity` /
        `wizard-review` tests) and installs a document/storage shim before
        importing app modules. The core XSS assertions run string-level in every
        environment; only the deep DOM-parse layer skips when jsdom's bundled
        undici can't initialise on the CI Node build
        (`webidl.util.markAsUncloneable`). Removes the static-import unhandled
        rejection that was failing the whole run.
- [x] **Field parity Modules 1–7** (accounting audit, users, loan-application
      wizard top-up, organization cashier shift-hours, etc.) — see git history.
- [x] **Savings account tax withholding** — added `withHoldTax` + `taxGroupId`
      (template-driven, blank ⇒ product default) to the savings new-account
      wizard (`js/pages/savings/new.js`). This is the one genuine *account-level*
      tax gap; FD/RD inherit tax config from the product.
- [x] **Interoperation API — COMPLETE (verified 2026-07-28).** `js/api/interoperation.js`
      (health, accounts, parties, quotes, requests, transfers, disburse/repayment)
      + `js/pages/interoperation.js` + router entry + `api.interoperation` wiring.
- [x] **Credit Bureau integration — COMPLETE (verified 2026-07-28).**
      `js/api/credit-bureau.js` (`CreditBureauConfiguration` config/mappings +
      `creditBureauIntegration` report fetch/save/delete) + `js/pages/credit-bureau.js`
      + router + `api.creditBureauConfig` / `api.creditBureauIntegration`.
- [x] **Interest Rate Charts + slabs — COMPLETE (verified 2026-07-28).**
      `js/api/interest-rate-charts.js` (charts CRUD + `chartslabs` CRUD/template) +
      213-line `js/pages/interest-rate-charts.js` + router + `api.interestRateCharts`.
- [x] **PPI Survey / Likelihood / PovertyLine — COMPLETE (verified 2026-07-28).**
      `js/api/social-performance.js` (scorecards, survey data, likelihood,
      povertyLine) + `js/pages/surveys-spm.js` (Surveys/Scorecards, PPI Likelihood,
      Poverty Line tabs) + router `surveys` entry.
- [x] **`MixReport` (XBRL) — COMPLETE (verified 2026-07-28).** `js/api/mix-xbrl.js`
      (taxonomy, mapping, `/mixreport`) + `js/pages/mix-xbrl.js` + `mix-xbrl` route.
- [x] **`ReportMailingJob` / `ReportMailingJobRunHistory` — COMPLETE (verified
      2026-07-28).** `js/api/report-mailing.js` (jobs CRUD/template + `runHistory`)
      + `js/pages/report-mailing.js` + `report-mailing` route.
- [x] **`js/data.js` placeholder documented (verified 2026-07-28).** File now
      carries a deliberate-placeholder header explaining it is unused and kept as
      the offline/demo-fallback seam; nothing imports it. (Was the "remove stub or
      add a one-line comment" tech-debt item.)
- [x] **ESLint `quality.yml` errors fixed (2026-07-28).** `js/oidc.js` no longer
      references `Buffer` — the base64url encode/decode Node fallbacks were
      replaced with pure-JS `_bytesToBase64` / `_base64ToBytes` helpers (browser-
      safe, still work in the Node test runner; roundtrip verified for UTF-8 +
      binary). `js/spa-404-redirect.js:2` `var` → `const`. `no-undef` ×2 and
      `no-var` cleared.
- [x] **`auth.js` split COMPLETE (2026-07-28).** Peeled into `js/auth-basic.js`
      (password login, OTP, forgot/change password, Basic session restore) and
      `js/auth-oidc.js` (OAuth2/OIDC sign-in, Bearer session restore, silent
      token refresh, single-logout URL), on top of a new shared `js/auth-core.js`
      (permission extraction, session persist, `finishLogin`, view seam) so the
      two flow modules don't import each other (no circular dep). `js/auth.js` is
      now the orchestrator (`initAuth`/`logout`) + login UI and **re-exports the
      full public surface**, so every external `import … from './auth.js'` — incl.
      `_extractPerms` used by `tests/business-logic.test.js` — is unchanged. All
      25 tests pass.
- [x] **innerHTML escaping baseline burned down to EMPTY + rule flipped to
      `error` (2026-07-28).** All remaining flagged interpolations were audited
      and either route through `escapeHtml`/formatting helpers or carry an inline
      `scan-allow-innerhtml` suppression (numeric IDs, code-defined labels/icons,
      computed dates, pre-escaped HTML fragments — no raw user data).
      `scan-innerhtml-baseline.json` is now `{}`; `local/no-unescaped-innerhtml`
      is `'error'`; and the ESLint rule now honours the same `scan-allow-innerhtml`
      marker as `scan_unescaped_innerhtml.mjs`, so one comment silences both
      gates. Scan reports 0 accepted / 0 found / 0 new.

---

## 1. Deferred API modules (not implemented)

- [ ] **Working Capital Loans** — 9 backend resource classes, ~150 methods (the
      coverage-gap audit counts **53 operations** for the loan surface). Explicitly
      deferred / excluded by request. No `js/api/**` wrapper, no page. (Confirmed
      still absent 2026-07-28 — no file/page/reference anywhere in the codebase.)
      → If on the roadmap, size it and schedule; if not, mark **won't-do** so it
      stops being re-flagged by every audit.

## 2. Modules only "Spot-checked" / "Unconfirmable" — need a full method-by-method diff

Methodology: diff each `js/api/*.js` against `fineract_api_raw.json` /
`Apache_Fineract_API_Documentation.html`. **Do not treat these as
production-verified until diffed.**

- [ ] **`js/api/organization.js`** — status *Spot-checked* ("no incorrect routes
      found", not method-by-method). Full diff pass.
- [ ] **`js/api/integrations.js`** — status *Mixed* (SMS / Email / Hooks
      spot-checked; notifications & externalEvents are Full). Diff the
      SMS/Email/Hooks surface.
- [ ] **`js/api/misc.js` (self-service section)** — status *Unconfirmable*.
      Confirm the self-service route surface against the spec.

## 3. Field parity — remaining (verify, mostly product-level / config)

The raw token-based gap dump (`products` 166, `system` 62, `admin` 61,
`integrations` 61 "missing" fields) is **largely false positives**: it counts
every spec field name, including product-level fields that accounts inherit,
plus report/datatable/system-config fields that are not applicable at the
flagged surface. Confirmed-account-level parity is essentially complete after
Modules 1–7 + the savings tax fix. Remaining items to actually verify:

- [ ] **Loan/savings/share *product* forms** — confirm the advanced product-level
      fields (interest recalculation, delinquency buckets, down-payment,
      capitalized-income, guarantee, floating rates) are present or explicitly
      deferred. These are the bulk of the "products 166" count and belong on the
      product form, not the account wizard.
- [ ] **Client datatable-at-creation** — attaching custom datatable rows during
      client creation (`datatable`) is not wired into `js/pages/clients/new.js`
      (post-creation datatable editing exists). Wire or explicitly defer.
- [ ] **System / admin / integrations config surfaces** — the "62/61 missing"
      lists are code-value, scheduler-job, S3/SMS/FCM, report-parameter and
      datatable-schema fields. Audit which are genuinely user-facing vs
      backend-only and close the real ones.

## 4. Bulk import coverage

- [ ] ~15 importable Fineract resources beyond `BULK_IMPORT_ENTITIES` have no
      download/upload dropdown entry. The generic `makeBulkImportsAPI` already
      works — just needs dropdown entries in `js/ui/modal-dropdowns.js`.
- [ ] Groups/Centers bulk template download/upload
      (`js/api/groups-centers.js`) was excluded from that module's audit — wire
      or explicitly defer.

## 5. Tech-debt / hardening

- [ ] Audit `js/pages/**/detail/*.js` (e.g. `notes-docs.js`, `accounts.js`) for
      the same stale-async-write race the router's `_renderToken` guards against.
- [ ] Decide & document the trust boundary for admin-entered labels
      (office/teller/GL names) in a multi-tenant deployment.
- [ ] **Working Capital Loan fix** — deferred per earlier direction; carried
      here so it is not silently dropped. Confirm scope or mark won't-do.

---

_Fixlogs retired 2026-07-28: `fixlogs/` and `checklist/` removed; this tracker is
now the single source of truth. Historical detail is in git history._
