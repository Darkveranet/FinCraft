# FIXLOG — UC-03 & UC-08 (deep fixes) + UI-contract sweep re-applied

**Trigger:** user — "address and fix both UC-03 and 08" (the two items the earlier UI-contract
sweep flagged as *real but not blind-fixable*).
**Audited against:** `fineract openAPI.json`.

> **Checkpoint lineage note:** the workspace had reset and the file re-uploaded was the original
> `reports-fix` **baseline** — this session's earlier module work (mailing/mix, integrations,
> shares, misc, bulk-import) and the UI-contract sweep were NOT in it. To keep this deliverable
> coherent, the **entire UI-contract sweep (UC-01 → UC-08)** has been (re-)applied here on top of
> the baseline. The earlier *module* fixes are not included in this file; re-upload that checkpoint
> if you want them folded together.

---

## UC-03 · Standing-instruction create was fundamentally broken 🐞 (major)

**Problem.** The modal collected two free-text "account no" strings and posted
`fromAccountNumber` / `toAccountNumber` / `validTo`. **None** of those exist on Fineract's
`StandingInstructionCreationRequest`. The real contract requires the full account *context*:

```
name, amount, transferType, instructionType, priority, status,
fromOfficeId, fromClientId, fromAccountId, fromAccountType,
toOfficeId,  toClientId,  toAccountId,  toAccountType,
recurrenceType, recurrenceFrequency, recurrenceInterval, validFrom, validTill
```

So the old form could **never** create a valid standing instruction — the server has no way to
resolve a bare account number into the `(accountId, accountType, clientId, officeId)` tuple it
needs. This wasn't a field-name typo; the whole payload shape was wrong.

**Fix** (`js/pages/transfers.js`, full rewrite of `openStandingInstructionModal`):
- Replaced the two free-text inputs with a **cascading picker per side**:
  **Office → Client → Account**, wired via change-listeners:
  - offices from `api.offices.list()`
  - clients from `api.clients.list({ officeId, limit: 200 })`
  - accounts from `api.clients.accounts(clientId)` → merges `savingsAccounts` + `loanAccounts`,
    each option tagged with its **Fineract `PortfolioAccountType`** (`savings = 2`, `loan = 1`)
    via a `data-acct-type` attribute.
- Dropdown option sets (transfer type, recurrence type, recurrence frequency) sourced from
  `GET /standinginstructions/template`, with sensible fallbacks.
- Builds the **correct** payload: `fromOfficeId/fromClientId/fromAccountId/fromAccountType`,
  the matching `to*` quartet, `transferType`, `recurrenceType/Frequency/Interval`, `validFrom`,
  `validTill`, plus `instructionType:1` (fixed amount), `priority:3` (medium), `status:1` (active),
  and `locale/dateFormat/monthDayFormat`.
- Validates all required selections before submit; surfaces server errors via
  `extractFineractError`.
- Dropped the fragile `import('./organization.js')._openSIModal` indirection — the modal is now
  fully self-contained.
- **Subsumes UC-02** (`validTo` → `validTill`).

> Scope note: this covers the common **client** savings/loan transfer case (what the UI exposes).
> Group/center-scoped instructions use the same payload shape with a group id — not surfaced in
> this basic form.

---

## UC-08 · List filters silently ignored → wrong counts 🐞

### UC-08a · Analytics "Loan Product Mix" active-loan count (`js/pages/analytics.js`)
`GET /loans` has **no `loanProductId`** query param. The old code called
`loans.list({ status:'active', loanProductId: p.id })` once per product and read
`totalFilteredRecords` — but since the filter was ignored, **every product showed the same
grand-total** of active loans (and it fired up to 12 identical queries).

**Fix:** fetch **one** bounded sample of active loans (`status` *is* a supported `/loans` filter),
then tally per-product **client-side** by each loan's `loanProductId`. Counts flagged with a `~`
badge when the sample is capped (more active loans than fetched) so an estimate is never shown as
exact. Net effect: correct per-product distribution **and** 12 redundant calls → 1.

### UC-08b · Dashboard savings (`js/pages/dashboard/index.js`)
`GET /savingsaccounts` has **no `status`** query param (spec:
externalId/offset/limit/orderBy/sortOrder). Two spots relied on the ignored filter:
1. **Index-5 `activeSavings`** — `savings.list({ status:'active' })` whose result
   (`activeSavings`) was **never rendered anywhere** (dead code) yet fired a misleading call.
   → Neutralised the slot to `guarded(false, () => null)` (keeps `val()` index stability; no wasted
   request) and removed the dead `activeSavings` variable.
2. **"Total Savings Balance" KPI fallback** (`loadSavingsBalance`) —
   `sampleBalance(l => savings.list({ status:'active' }), …)`. The KPI is a **total**, so filtering
   to active was both a no-op *and* wrong intent. → Dropped `status:'active'`; the code now honestly
   sums balances across all savings accounts. (Primary source remains the "Portfolio at a glance"
   report; this is only the fallback.) **Zero wire-behaviour change.**

---

## Re-applied quick UI-contract fixes (baseline had none)

| ID | Fix | File(s) |
|----|-----|---------|
| **UC-01** | Client address `street` → `addressLine1` (create + update) | `clients/actions/identity.js` |
| **UC-02** | Standing instruction `validTo` → `validTill` | (subsumed by UC-03) |
| **UC-04** | `staff.list({ isLoanOfficer })` → `loanOfficersOnly` (×6) | collections, loans/approval, dashboard/data, groups/lifecycle, savings/lifecycle, analytics |
| **UC-05** | Dashboard report params `startDate/endDate` → `R_startDate/R_endDate` | `dashboard/index.js` |
| **UC-06** | Audit filter `makerUsername` → `makerId: auth.userId` | `notifications/activity.js` |
| **UC-07** | Checker-inbox drop bogus `makerCheckerId` filter (no per-id GET exists) | `tasks/checker-inbox.js` |

UC-04 note: only the **query-param** name was wrong; the legitimate `isLoanOfficer` on the staff
**create body** and **response reads** were left untouched.

---

## Verification
- `node --check` across **all** `js/**` (349 files): **0 failures**.
- `npm test`: **16/16 suites pass**.
- Analytics product-mix now issues **1** query instead of 12; SI modal cascades verified to build
  the full contract payload.

## Result
UC-03 (broken standing-instruction create) and UC-08 (silently-ignored list filters) are fixed at
the root, and the full UI-contract sweep (UC-01 → UC-08) is complete and internally consistent on
this checkpoint.
