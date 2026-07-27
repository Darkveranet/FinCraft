# FIXLOG — Static-wizard Review/Confirm step + FD/RD lock-in fields

_Scope: the two items agreed in the plan — (a) a Review/Confirm final step for every
static (`data-wizard`) modal wizard, and (b) the missing lock-in period fields on the
Fixed- and Recurring-Deposit forms. No other module behaviour was touched._

---

## 1. Auto **Review / Confirm** step for static wizards

### Problem
The markup-driven modal wizards (`js/ui/modal-wizard.js`, used by the
`views/modals/*.html` partials) walked the user straight from the last data-entry pane
to submit. There was no summary/confirmation step and no gate on partially-filled
required fields between steps — inconsistent with the full-page create flows, which
already end on a Review pane (`.wz-review-grid` in `css/create-flows.css`).

### Fix — `js/ui/modal-wizard.js`
The controller now **auto-appends a final `Review` pane** to every wizard (no per-modal
markup needed), so the change lands uniformly across all eight static wizards:

| Modal file | Wizard modal(s) | Steps (pre) → (post) |
|---|---|---|
| `accounting.html` | `journalEntryModal` | Details, Lines → **+ Review** |
| `admin.html` | `newUserModal` | Identity, Access → **+ Review** |
| `clients.html` | `newClientModal` | Identity, Placement → **+ Review** |
| `integrations.html` | `newTransferModal`, `newSIModal` | (3) → **+ Review** each |
| `loans.html` | `newLoanModal` | Applicant, Terms, Schedule → **+ Review** |
| `products.html` | `newLoanProductModal`, `newSavingsProductModal` | (3) → **+ Review** each |

Behaviour added:
- **`renderReview()`** builds a grouped summary (one section per step) from every named
  control across the real panes: selects show the selected *option text* (with
  `— None —` treated as blank), checkboxes → `Yes/No`, passwords masked, and the
  `.search-field` hidden-id pattern shows the paired visible label (e.g. the chosen
  client name, not its raw id). Empty fields are skipped; the summary is rebuilt every
  time the Review step is entered.
- The primary submit button (`[data-action]`) is now hidden until the Review step —
  previously it only toggled on `cur === last`, which is preserved but now `last`
  is the Review pane.
- **`paneValid()`** gates `Next` (and forward stepper jumps) on the current pane's
  HTML5 validity, calling `reportValidity()` on the first invalid control. Backward
  navigation is always allowed.
- `isFieldHidden(el, pane)` walks ancestors *up to but excluding the pane* so
  conditionally-hidden groups (e.g. the client Individual/Entity toggle) are excluded
  from both validation and the summary, while panes that are merely `display:none`
  because they aren't the active step are still read.
- **Opt-out:** `data-wz-no-review` on the `.modal` box skips the auto step. The
  remittance wizard is unaffected because it is **not** a `data-wizard` modal — it
  renders its own review via `js/remit.js` (`data-remit-pane="4"`).

### Fix — `css/create-flows.css`
Added `.wz-review-intro`, `.wz-review-section`, `.wz-review-group-title`, and a
`.wz-rv .v.empty` state, reusing the existing `.wz-review-grid` / `.wz-rv` primitives.

---

## 2. FD / RD **lock-in period** fields

### Problem
The New Savings form already had `lockinPeriodFrequency` + `lockinPeriodFrequencyType`
and forwarded them (`js/ui/handlers/savings.js`). The **Fixed Deposit** and
**Recurring Deposit** forms did not — even though Fineract's FD/RD create resources
accept both. Users could not set a lock-in on a term deposit from the UI.

### Fix — `views/modals/savings-deposits.html`
Added the two fields to `#newFDForm` (after *Maturity instruction*) and `#newRDForm`
(after *Expected first deposit on*), mirroring the Savings markup:
`lockinPeriodFrequency` (number, optional) + `lockinPeriodFrequencyType`
select (Days/Weeks/**Months** default/Years, values `0/1/2/3`).

### Fix — handlers
`js/ui/handlers/fixed-deposit.js` and `js/ui/handlers/recurring-deposit.js` now forward
both to the create payload, only when a frequency is supplied, defaulting the type to
Months (`2`) — identical to the savings handler:

```js
if (f.lockinPeriodFrequency) {
  payload.lockinPeriodFrequency = parseInt(f.lockinPeriodFrequency);
  payload.lockinPeriodFrequencyType = parseInt(f.lockinPeriodFrequencyType || 2);
}
```

---

## Verified clean
- `node --check` on every file in `js/`: 0 failures.
- `npm test`: **24/24 suites pass** (was 23) — added
  `tests/wizard-review-lockin.test.js` covering: the auto-review injection / opt-out /
  validity gate / final-step submit reveal in `modal-wizard.js`; that all six wizard
  modal files stay auto-review-eligible (and `remittanceModal` is not `data-wizard`);
  and the FD/RD lock-in field + payload wiring (including the `|| 2` type default).
- Per-modal pane audit confirms all eight `data-wizard` boxes have ≥2 steps, so the
  Review step is always meaningful.
