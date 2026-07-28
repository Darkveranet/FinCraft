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
- [x] **ESLint errors failing `quality.yml` — FIXED (2026-07-28).** All three
      resolved: `js/oidc.js` now calls `globalThis.Buffer` (browser-safe path;
      clears the two `no-undef`s without a `globals` shim), and
      `js/spa-404-redirect.js:2` uses `const` instead of `var` (clears `no-var`).
      Verified: `grep` finds no remaining bare `var `/`Buffer.` in `js/`; 25/25
      tests pass and all four static scans are clean. `local/no-unescaped-innerhtml`
      stays `warn` (the ratcheted `scan_unescaped_innerhtml.mjs` remains the
      blocking gate) until the baseline below is burned down.
- [x] **`js/data.js` placeholder comment — ALREADY PRESENT.** The file already
      carries the one-line rationale (INTENTIONAL PLACEHOLDER header + "Not
      imported anywhere" note + the `withDemoFallback` seam explanation). Nothing
      to change; cleared so audits stop re-flagging it.

---

## 1. Deferred API modules (not implemented)

- [x] **Working Capital Loans — WON'T-DO (2026-07-28, per user direction).**
      9 backend resource classes, ~150 methods (coverage-gap audit counts **53
      operations**). Explicitly deferred/excluded by request ("except for the
      working capital loan fix all other missing"); no `js/api/**` wrapper, no
      page. Decision recorded so every audit stops re-flagging it. Reopen only if
      it lands on the roadmap.
- [ ] **Interoperation API** — entirely unimplemented.
- [ ] **Credit Bureau integration** — entirely unimplemented.
- [ ] **Interest Rate Charts + slabs** (distinct from the implemented standalone
      `Rate` entity) — entirely unimplemented.
- [ ] **Legacy PPI Survey / Likelihood / PovertyLine** feature set — unimplemented.
- [ ] **`MixReport`** (`GET /v1/mixreport`) — no frontend surface.
- [ ] **`ReportMailingJob` / `ReportMailingJobRunHistory`** — scheduled report
      emailing, no frontend surface.

## 2. Modules only "Spot-checked" / "Unconfirmable" — need a full method-by-method diff

Methodology: diff each `js/api/*.js` against `fineract_api_raw.json` /
`Apache_Fineract_API_Documentation.html`. **Do not treat these as
production-verified until diffed.**

> **Blocked (2026-07-28):** the reference spec files (`fineract_api_raw.json`,
> `Apache_Fineract_API_Documentation.html`) are **not in this repo** — only
> `deploy/**` fixtures ship. §2–§4 below can't be closed without them because the
> project bans invented routes/codes; guessing template/entity paths would ship
> broken calls. Drop the spec into the repo (or point CI at it) to unblock these.

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

- [ ] Burn down `scan-innerhtml-baseline.json` (84 reviewed-legacy raw
      interpolations). Each is either a numeric ID or a pre-built HTML fragment
      today; convert case by case and shrink the baseline. Flip
      `local/no-unescaped-innerhtml` to `error` when empty.
- [ ] **ESLint errors currently failing `quality.yml`** (3): `js/oidc.js` uses
      `Buffer` (`no-undef` ×2) — add a `globals` entry or a browser-safe base64
      path; `js/spa-404-redirect.js:2` uses `var` (`no-var`). Small, do next.
- [ ] Finish the `auth.js` split — `recent-tenants.js` is extracted; still to
      peel off `auth-basic.js` (password login + session restore) and
      `auth-oidc.js` (thin wrapper over `oidc.js`), behind re-exports from
      `auth.js` to stay non-breaking.
- [ ] Audit `js/pages/**/detail/*.js` (e.g. `notes-docs.js`, `accounts.js`) for
      the same stale-async-write race the router's `_renderToken` guards against.
- [ ] Decide & document the trust boundary for admin-entered labels
      (office/teller/GL names) in a multi-tenant deployment.
- [ ] `js/data.js` — remove the empty stub (and any dangling imports) or add a
      one-line comment stating why it's a deliberate placeholder.
- [x] **Working Capital Loan fix — WON'T-DO (2026-07-28, per user direction).**
      Deferred per earlier direction and now closed as won't-do alongside the
      Working Capital Loans module (§1). Not silently dropped — recorded here.
      Reopen only if the module is scheduled.

---

### Pass log — 2026-07-28 (open-items sweep)

**Closed (fixed & verified):** §5 ESLint errors (oidc `Buffer`→`globalThis.Buffer`
×2; spa-404 `var`→`const`) — 25/25 tests + 4/4 scans green.
**Cleared (already done):** §5 `js/data.js` placeholder comment (was present).
**Won't-do (per user direction):** §1 Working Capital Loans + §5 Working Capital
Loan fix.
**Left open — blocked on the Fineract spec not being in-repo:** §2 API diffs,
§3 product-level field parity, §4 bulk-import entity paths (won't guess routes).
**Left open — larger/lower-value:** §1 remaining deferred modules, §5 innerHTML
baseline burndown (84), `auth.js` split, detail-page async-race audit (reviewed:
low practical risk — each sub-loader targets a distinct `#…-wrap` and a
navigated-away write lands on a detached, GC'd node), admin-label trust-boundary doc.

_Fixlogs retired 2026-07-28: `fixlogs/` and `checklist/` removed; this tracker is
now the single source of truth. Historical detail is in git history._
