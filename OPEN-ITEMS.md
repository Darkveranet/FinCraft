# FinCraft — Open Items Tracker

Durable, re-surfaced list of work that is **known but not done**. It exists so the
items below stop living only inside `fixlogs/` prose (which reads as "done" history
and is easy to lose track of). Convert each unchecked box into a GitHub issue using
`.github/ISSUE_TEMPLATE/` — this file is the index; issues are the working queue.

> Source of truth for detail: `fixlogs/FIXLOG-coverage-gaps.md` and
> `fixlogs/FIXLOG-full-api-audit-consolidated.md`.

---

## 1. Deferred API modules (not implemented)

- [ ] **Working Capital Loans** — 9 backend resource classes, ~150 methods (the
      coverage-gap log counts **53 operations** for the loan surface specifically).
      Explicitly deferred / excluded by request. No `js/api/**` wrapper, no page.
      → If on the roadmap, size it and schedule; if not, mark **won't-do** so it stops
      being re-flagged by every audit.
- [ ] **Interoperation API** — entirely unimplemented.
- [ ] **Credit Bureau integration** — entirely unimplemented.
- [ ] **Interest Rate Charts + slabs** (distinct from the implemented standalone `Rate`
      entity) — entirely unimplemented.
- [ ] **Legacy PPI Survey / Likelihood / PovertyLine** feature set — unimplemented.
- [ ] **`MixReport`** (`GET /v1/mixreport`) — no frontend surface.
- [ ] **`ReportMailingJob` / `ReportMailingJobRunHistory`** — scheduled report emailing,
      no frontend surface.

## 2. Modules only "Spot-checked" / "Unconfirmable" — need a full method-by-method diff

Methodology already documented (diff each `js/api/*.js` against `fineract_api_raw.json` /
`Apache_Fineract_API_Documentation.html`); it just wasn't re-run on these. **Do not treat
these as production-verified until diffed.**

- [ ] **`js/api/organization.js`** — status *Spot-checked* ("no incorrect routes found",
      not method-by-method). Full diff pass.
- [ ] **`js/api/integrations.js`** — status *Mixed* (SMS / Email / Hooks spot-checked;
      notifications & externalEvents are Full). Diff the SMS/Email/Hooks surface.
- [ ] **`js/api/misc.js` (self-service section)** — status *Unconfirmable*. Confirm the
      self-service route surface against the spec.

## 3. Bulk import coverage

- [ ] ~15 importable Fineract resources beyond `BULK_IMPORT_ENTITIES` have no
      download/upload dropdown entry. The generic `makeBulkImportsAPI` already works —
      just needs dropdown entries in `js/ui/modal-dropdowns.js`.
- [ ] Groups/Centers bulk template download/upload (`js/api/groups-centers.js`) was
      excluded from that module's audit — wire or explicitly defer.

## 4. Tech-debt / hardening (from the developer-recommendations report)

- [ ] Burn down `scan-innerhtml-baseline.json` (84 reviewed-legacy raw interpolations).
      Each is either a numeric ID or a pre-built HTML fragment today; convert case by case
      and shrink the baseline. Flip `local/no-unescaped-innerhtml` to `error` when empty.
- [ ] Finish the `auth.js` split — `recent-tenants.js` is extracted; still to peel off
      `auth-basic.js` (password login + session restore) and `auth-oidc.js` (thin wrapper
      over `oidc.js`). Do this behind re-exports from `auth.js` to stay non-breaking.
- [ ] Audit `js/pages/**/detail/*.js` (e.g. `notes-docs.js`, `accounts.js`) for the same
      stale-async-write race the router's `_renderToken` mechanism guards against.
- [ ] Decide & document the trust boundary for admin-entered labels (office/teller/GL
      names) in a multi-tenant deployment.
- [ ] `js/data.js` — remove the empty stub (and any dangling imports) or add a one-line
      comment stating why it's a deliberate placeholder.

---

_Last synced from fixlogs: 2026-07-27._
