# FIXLOG — Deep audit of the remaining forms

Follow-up to the form-completion work (multistep + full-field pass). This round
audited every **create** form that had *not* yet been converted, compared each to
Fineract's actual create-command payload (OpenAPI request schemas + the command
deserializers in `fineract-develop`), added the missing fields, converted the
complex ones to multi-step wizards, and gave **every** wizard an auto-generated
**Review / Confirm** step.

## 1. Wizard engine — auto Review/Confirm step
`js/ui/modal-wizard.js`
- Added `renderReview()` + `humanizeName()` + `fieldValue()`.
- Any pane flagged `data-wz-review` is now auto-populated on entry with a
  read-only `label → value` summary of every filled field (selects show option
  text, checkboxes show *Yes*, hidden/password/empty fields skipped; the client
  search box surfaces the typed display name). No per-form JS is required.
- `css/create-flows.css`: added `.wz-review-card / .wz-review-list / .wz-review-row`.

Review panes added to the existing static wizards (one line each):
newClientForm, newLoanForm, newUserForm, journalEntryForm, newLoanProductForm,
newSavingsProductForm, newTransferForm, newSIForm.

## 2. Savings account — `newSavingsModal` → 4-step wizard
Account · Interest & Terms · Overdraft & Options · Review.
Added fields Fineract accepts that were previously missing:
`interestCompoundingPeriodType`, `interestPostingPeriodType`,
`interestCalculationType`, `interestCalculationDaysInYearType`,
`enforceMinRequiredBalance`, `minRequiredBalance`, `withHoldTax`,
`nominalAnnualInterestRateOverdraft`. Handler `savings.js` extended to map them
(all optional — only sent when set). Field-officer already maps `staffId → fieldOfficerId`.

## 3. Fixed Deposit — `newFDModal` → 5-step wizard  *(FD/RD lock-in)*
Account · Deposit Terms · Interest & Lock-in · Maturity & Options · Review.
Added: `nominalAnnualInterestRate`, the four interest-method selects,
**`lockinPeriodFrequency` + `lockinPeriodFrequencyType`**, `transferToSavingsId`,
`transferInterestToSavings`, plus a "Transfer to savings on maturity" instruction.
`fixed-deposit.js` extended accordingly.

## 4. Recurring Deposit — `newRDModal` → 5-step wizard  *(FD/RD lock-in)*
Account · Deposit Terms · Interest & Lock-in · Options · Review.
Added: `nominalAnnualInterestRate`, interest-method selects,
**lock-in period + type**, `isCalendarInherited`. `recurring-deposit.js` extended.

## 5. Share account — `newShareModal` → 4-step wizard
Account · Shares & Price · Lock-in & Options · Review.
Added: `savingsAccountId` (linked savings for settlement/dividends),
`lockinPeriodFrequency` + type, `minimumActivePeriod` + type,
`allowDividendCalculationForInactiveClients`. `share-account.js` extended.

## 6. Organization — field gaps
- Staff (`newStaffForm`): added **`emailAddress`** (present in `StaffCreateRequest`,
  previously missing). `staff.js` extended.
- Payment type (`newPaymentTypeForm`): added **`codeName`**
  (present in `PaymentTypeCreateRequest`). `payment-type.js` extended.

## 7. Savings transaction — `savingsDepositModal`
Added `routingCode` and `bankNumber` (both in
`PostSavingsAccountTransactionsRequest` payment-detail); `savings-deposit-withdrawal.js` extended.

## Notes / left intentionally as-is
- Interest-method and lock-in selects lead with **"— Product default —"**; nothing
  is sent unless the user overrides, so product defaults are preserved and no
  spurious enum values are posted.
- Office / Teller / Holiday / Group / Center forms were already field-complete
  against their create commands and remained single-step.

## Verification
- `node --check` passes on every modified JS file.
- `<form>` / `</form>` counts balanced in all modal partials.
