# FIXLOG — Full UI‑contract deep sweep (all modules) · fix all missing except Working Capital Loan

**Trigger:** user — *"do a full UI‑contract deep sweep across all modules FinCraft has"* → *"except for
the working capital loan, fix all other missing."*
**Audited against:** `fineract openAPI.json` (600 paths).
**Method:** programmatic, not by eye. Two machine passes over the whole `js/**` tree (327 files):

1. **Endpoint/method existence** — every `(verb, path)` the client sends (`self._g/_p/_u/_d` + `_req`)
   was matched **segment‑aware, method‑aware** against the spec (a spec `{param}` segment matches any
   concrete client segment; a client `${var}` matches any spec segment). Flags URLs/verbs with no
   matching operation.
2. **Query‑param correctness** — the API namespaces (`api/index.js`) were traced to their modules,
   each module method mapped to its `(verb, path)`, then every call site passing an inline params
   object was diffed against that endpoint's spec query set (minus the universally‑tolerated
   `locale/dateFormat/offset/limit/orderBy/sortOrder/fields/…`). Flags **silently‑ignored filters**.

> **Scope:** Working‑Capital‑Loan items are intentionally **excluded** per instruction. (For the
> record, the spec‑based sweep surfaced **no** WCL query/endpoint violations — the
> `/working-capital-loans/**` calls already match the spec — so nothing WCL was skipped that would
> otherwise have been fixed here.)

---

## A. Endpoint bugs (wrong path) — FIXED

| # | Where | Was | Now | Why |
|---|-------|-----|-----|-----|
| **D‑01** | `api/misc.js` `cob.catchUp` | `POST /loans/catch-up-processing` | `POST /loans/catch-up` | `catch-up-processing` is not a real path. It structurally collides with `POST /loans/{loanId}`, so it silently hit the **loan state‑transition** resource with id `"catch-up-processing"` instead of triggering COB catch‑up. Correct resource is `LoanCOBCatchUpApiResource` → `/loans/catch-up`. |
| **D‑02** | `api/misc.js` `cob.configurations` / `updateConfig` | `GET/PUT /cob-configurations[/{id}]` | aggregate `GET /jobs/names` + `GET /jobs/{jobName}/steps` (update → `PUT /jobs/{jobName}/steps`) | `/cob-configurations` does **not** exist in Fineract. Business‑step configuration is exposed per business job via the Jobs resource. `configurations()` now fetches `/jobs/names` → `businessJobs`, then each job's `/jobs/{jobName}/steps` (`JobBusinessStepConfigData.businessSteps`), and flattens to the `[{stepName, jobName, order}]` shape the COB panel already renders. Per‑job failures are skipped so one forbidden/unconfigured job can't blank the table. The System→COB panel wraps this in `allSettled`, so behaviour degrades gracefully. |

`cob.updateConfig` signature changed `(id, body)` → `(jobName, body)`; it has **no callers** in the UI
(read‑only panel), so no call site needed updating.

## B. Silently‑ignored list filters (wrong/unsupported query param) — FIXED

| # | Where | Bad param on | Fix |
|---|-------|--------------|-----|
| **D‑03** | `api/misc.js` `charges.list*` + **5 call sites** | `chargeAppliesTo` on `GET /charges` | `GET /charges` (retrieveAllCharges) has **no** query params, so every "Apply Charge" picker was showing **all** charge types. Added `charges.listByAppliesTo(id)` that fetches the full list and filters client‑side by `ChargeData.chargeAppliesTo.id`. Repointed the client (3), loan (1), savings (2) and deposit pickers, plus the admin **Charges** list page's Applies‑To dropdown (now client‑side; also de‑duplicated a second `/charges` fetch it was doing for KPIs). |
| **D‑03b** | `pages/deposits/actions/charges.js` | `chargeAppliesTo: 5` | `5` is **not** a valid `ChargeAppliesTo` value (enum is 1=Loan, 2=Savings/Deposit, 3=Client, 4=Shares). FD/RD are savings‑type → now filters on **2** via `listByAppliesTo(2)`. |
| **D‑04** | `pages/dashboard/data.js` `loadLoansByOfficer` | `loanOfficerId` on `GET /loans` | `/loans` has no `loanOfficerId` filter, so it was ignored → **every** officer's bar showed the same grand total of active loans (and fired up to 8 identical queries). Now pulls **one** bounded sample of active loans (`status` *is* supported) and tallies per officer client‑side via each loan's `loanOfficerId`. (Same class as UC‑08a; `officeId` is likewise unsupported on `/loans` and is **not** sent.) |
| **D‑05** | `modal-init.js` reschedule‑reasons | `command` on `GET /loans/template` | `/loans/template` has no `command` param (ignored) and never returns `rescheduleReasons` — a dead fallback call. Dropped it; the real source `GET /rescheduleloans/template` (`rescheduleTemplate()`) plus the code‑value fallbacks (code ID 61 / name lookup) remain. |
| **D‑06** | `pages/centers/detail.js` + `pages/groups/detail/meetings-charges.js` | `calendarId` on `GET /{entityType}/{entityId}/meetings` | `retrieveAllMeetings` supports only `limit` — `calendarId` was silently ignored. Removed the param (server already ignored it → **zero wire‑behaviour change**); the endpoint already returns the entity's meetings. |

## C. Reviewed & deliberately NOT changed (false positives)

- **`runReports.run` with `R_startDate` / `R_endDate`** (`dashboard/index.js`) — the spec documents only a
  *representative* subset of `R_`‑params and explicitly states report params are report‑specific and
  non‑exhaustive. These are valid for reports whose SQL defines them; not a contract violation.
- **`savings.list({status})`** — the scanner's line‑based heuristic re‑flagged it, but the only
  occurrence is a **comment** at `dashboard/index.js:260`; the live call has no `status` (already
  fixed as UC‑08b). Confirmed via whole‑tree grep.
- **`/self/*`** (self‑service registration/beneficiaries/userdetails) — Fineract's **Self‑Service API**
  is a separate surface **not present** in this OpenAPI document, so it can't be audited against it.
  Left untouched.

---

## Verification
- `node --check` across **all 327** `js/**` files: **0 failures**.
- Endpoint‑existence re‑scan: `catch-up-processing` and `cob-configurations` **gone**; no unmatched
  endpoints remain except the out‑of‑spec `/self/*` self‑service calls.
- Query‑param re‑scan: only the two documented false positives remain.
- `npm test`: **16/16 suites pass**.

## Result
Every genuine UI‑contract mismatch surfaced by the deep sweep is fixed at the root (2 wrong endpoints,
6 silently‑ignored‑filter issues across charges ×5 / dashboard / reschedule / meetings ×2), with
Working‑Capital‑Loan intentionally left as‑is per instruction.
