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
- [x] **Interoperation API — COMPLETE (verified 2026-07-28, re-verified 2026-08-02).**
      `js/api/interoperation.js` (health, accounts, parties, quotes, requests,
      transfers, disburse/repayment) + `js/pages/interoperation.js` + router entry
      + `api.interoperation` wiring. Note on the drift report: `getParty` /
      `registerParty` / `deleteParty` build a dynamic path
      (`/interoperation/parties/{idType}/{idValue}[/{subIdOrType}]`) that the
      drift tool can't statically verify, so it skips them into the "dynamic"
      bucket. The contract's `getAccountByIdentifier` / `registerAccountIdentifier`
      / `deleteAccountIdentifier` (+ sub-type variants) that show as "uncovered"
      in `contracts/api-drift.md` are these SAME endpoints under Fineract's own
      operationId naming — confirmed by comparing paths directly, not a real gap.
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

## 0b. API migration — hand-written → contract-driven (in progress)

Full phased plan: **`tools/api-automation/MIGRATION-PLAN.md`**.

- [x] **Phase 2 — drift report built (2026-07-29).** `tools/api-automation/api-drift.mjs`
      diffs the 24 curated `js/api/*.js` wrappers against generated `CONTRACTS`
      (Matched / 🔴 Mismatch / 🟡 Unverified / ⚪ Uncovered). `npm run api:drift`
      (+ `api:drift:strict`). Wired into `api-automation.yml`: appended to the job
      summary and the sync-PR body.
- [x] **Phase 1 — generate against the REAL spec.** Merged; `contracts/*` and
      `js/api/generated/*` reflect the real Fineract surface (965 ops, 600 paths,
      1467 schemas), not the 6-path sample.
- [x] **Phase 2 — drift report built (2026-07-29), hardened (2026-08-02).**
      `tools/api-automation/api-drift.mjs` diffs the 20 curated `js/api/*.js`
      wrappers against generated `CONTRACTS` (✅ Matched / 🔴 Mismatch /
      🟡 Unverified / ⚫ External / ⚪ Uncovered / ⚙️ Dynamic). `npm run api:drift`
      (+ `api:drift:strict`, currently 0 Mismatch — passing). 2026-08-02 fixes:
      (a) nested-template-literal parsing (was truncating `interoperation`
      routes into false "unverified"); (b) `self._req(...)` calls now scanned —
      previously invisible to the tool (twofactor, batches, documents, images,
      bulk-import templates — ~14 routes); (c) literal-path-segment fallback
      matching for routes that call a parameterized contract op with a hardcoded
      value (e.g. `/externalservice/SMS` → `/externalservice/{servicename}`) —
      19 routes, see `tools/api-automation/external-routes.json` and the
      "Matched via literal segment" section of `contracts/api-drift.md` for the
      full list. Current state: 709 matched, 0 mismatch, 0 unverified,
      11 external (allowlisted, reasons in `external-routes.json`), 262
      uncovered, 3 dynamic (skipped, manually re-verified — see §0 interoperation
      note above). Triage of the 262 uncovered ops: see §0c below.
- [ ] **Phase 2b — burn down the drift backlog.** 🔴 Mismatch is already 0.
      Remaining: work the "build"-flagged items in §0c below.
- [~] **Phase 3 — auto-generate E2E tests from the contract (partial, 2026-08-02).**
      `tools/api-automation/generate-e2e.mjs` (`npm run api:e2e-gen`) generates
      `tests-e2e/generated/read-smoke.spec.mjs` (153 zero-path-param matched GET
      ops — route-drift smoke coverage) and `required-field-validation.spec.mjs`
      (13 zero-path-param matched write ops with contract-declared required
      fields). Structurally validated via `playwright test --list` (96 tests,
      both files parse and collect correctly) — not yet run against a live
      stack (no Docker in this environment). Deliberately does NOT attempt
      happy-path CREATE flows or param-taking GETs — see
      `tests-e2e/generated/README.md` for why. Remaining for "done": run once
      against `scripts/e2e/stack-up.sh` in CI to confirm green, then wire into
      the regular `npm run e2e` pass (already auto-discovered by
      `playwright.config.mjs`'s `testDir`, no config change needed).
- [ ] **Phase 4 — CI gates:** flip `api:drift:strict` on for Mismatch + require
      generated E2E green.

## 0c. Uncovered contract operations — triage (2026-08-02, 262 total)

Full per-op detail: `contracts/api-drift.md` (⚪ Uncovered section). Grouped here
by what to actually do about each bucket — do not treat this as "262 bugs."

- [ ] **Working Capital Loans (100 ops).** Superset of the §1 estimate — the
      real contract count (base ops + `external-id` twins) is **100**, not ~53.
      Still explicitly deferred; see §1. Update §1's count when scoping.
- **External-ID twins outside Working Capital (99 ops)** — `loans`,
      `savingsaccounts`, `clients`, `fixeddepositaccounts`,
      `recurringdepositaccounts`, `loan-originators`, `external-asset-owners`.
      Fineract exposes most write/read operations twice: once by internal
      numeric ID, once by `external-id/{externalId}` for external-system
      integration. FinCraft's UI navigates by internal ID everywhere today.
      → **Recommend won't-do by default** — only build a specific twin if a
      concrete external-integration need shows up (e.g. a partner system that
      only knows its own external ID for a record). Re-flagging all 99
      individually every audit isn't useful; this line item is the record.
- **`/internal/*` endpoints (23 ops)** — Fineract's own COB/audit/debug surface:
      loan lock/unlock, progressive-loan internal model, audit-trail fields,
      external-events replay, COB partitions/fast-forward, status-by-code
      lookups. Not part of normal back-office banking flows.
      → **Recommend won't-do** unless/until there's a scoped "ops console" epic;
      don't build piecemeal.
- **Bulk-import per-entity templates (~30 ops)** — `centers`, `groups`, `staff`,
      `users`, `clients`, `fixeddepositaccounts` (account + transaction),
      `glaccounts`, loan guarantors, `journalentries`, loan repayments, `loans`,
      `offices`, `recurringdepositaccounts` (account + transaction),
      `savingsaccounts` (account + transaction), share accounts. The generic
      mechanism already exists (`misc.js: makeBulkImportsAPI`, `template(entity)`
      / `upload(entity)`) — this is the same gap as existing §4, now with the
      exact entity list instead of "~15". → Merge into §4, wire the missing
      dropdown entries.
- **`searchClientsByText` (1 op, `POST /clients/search`)** — server-side text
      search, not currently wired (client list likely does client-side
      filtering today). → **Candidate to build** — real UX win on large client
      bases; low complexity (one endpoint, one search box).
- **`authenticate` (1 op, `POST /authentication`)** — token-issuing endpoint.
      FinCraft's current auth (`js/auth-basic.js`, `js/auth-oidc.js`) uses HTTP
      Basic auth headers / OIDC bearer tokens directly, not this endpoint.
      → **Recommend won't-do** unless a future flow specifically needs a
      Fineract-issued auth token; confirm against `auth-basic.js` before closing.
- **`getWadl` / `getExternalGrammar` (2 ops, `/application.wadl*`)** — Fineract's
      own machine-readable API-description document (WADL format), not a
      business operation. → **Won't-do**, not applicable to the UI.

## 1. Deferred API modules (not implemented)

- [ ] **Working Capital Loans** — 9 backend resource classes, ~150 methods.
      Real contract count as of 2026-08-02: **100 operations** (see §0c for the
      breakdown including external-id twins; supersedes the earlier ~53
      estimate). Explicitly deferred / excluded by request. No `js/api/**`
      wrapper, no page. (Confirmed still absent 2026-07-28 — no file/page/
      reference anywhere in the codebase.)
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
- [x] **`js/api/misc.js` (self-service section)** — was *Unconfirmable*, now
      confirmed 2026-08-02: all 8 `/self/*` routes checked directly against the
      real 965-op contract — zero `/self` paths exist anywhere in it. This is
      Fineract's separate Self-Service API surface (different app/spec
      entirely), not a gap in FinCraft. See
      `tools/api-automation/external-routes.json`.

## 3. Field parity — remaining (verify, mostly product-level / config)

**2026-08-02: now a re-runnable report, not a one-off manual dump.**
`tools/api-automation/field-parity.mjs` (`npm run api:field-parity`, writes
`contracts/field-parity.md`) — deliberately NOT wired into `npm run verify` or
any CI gate; see the script header for why a naive field-count is noisy
(counts every schema field including ones that are legitimately product-level,
deprecated, or backend-only). Current run: 217 matched CREATE/UPDATE ops,
1570 non-boilerplate fields, 336 flagged as candidates (not confirmed gaps).

This run quantitatively confirms the earlier manual read below: `Client` is
7% missing (matches "account-level parity is essentially complete"), while
`Loan Products` is 40% missing (108 of 267 fields — matches "these are product-
level fields, not account-wizard fields"). New signal worth a look that wasn't
called out before: `Inter Operation` (46%), `Search API` (100% — may just be
query filters with no 1:1 UI field), `Survey` (91%), `Instance Mode` (100% —
plausibly not wired to a settings page at all). Full per-operation detail in
`contracts/field-parity.md`; re-run periodically as the contract or UI changes,
skim rather than treat as a checklist to zero out.

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

- [ ] Importable Fineract resources beyond `BULK_IMPORT_ENTITIES` with no
      download/upload dropdown entry — precise list from the 2026-08-02 drift
      triage (see §0c): `centers`, `groups`, `staff`, `users`, `clients`,
      `fixeddepositaccounts` (account + transaction), `glaccounts`, loan
      guarantors, `journalentries`, loan repayments, `loans`, `offices`,
      `recurringdepositaccounts` (account + transaction), `savingsaccounts`
      (account + transaction), share accounts. The generic `makeBulkImportsAPI`
      already works — just needs dropdown entries in `js/ui/modal-dropdowns.js`.
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
