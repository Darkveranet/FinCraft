# Fix Log — Structured Client Address + Form Field Audit

**Requested scope:** "Add structured address fields to the client wizard, check for all
fields missing, how they are sent to server, add them and complete all client submission.
Also do this check for all forms we have within FinCraft."

---

## 1. Client wizard — structured residential address (primary fix)

**File:** `js/pages/clients/new.js` (+ `css/create-flows.css`)

### Before
Step 2 (Personal) had a single free-text `Residential Address` `<textarea>`. On submit it
was posted to `/client/{id}/addresses` with **only** `addressLine1` (the whole blob), or
dropped into a Note. None of the structured columns Fineract stores were populated.

### After — full Fineract address contract
The single textarea is replaced by structured fields, matching Fineract's
`ClientAddressRequest` schema exactly:

| UI field | Payload key | Source |
|---|---|---|
| Address Line 1 | `addressLine1` | text |
| Address Line 2 | `addressLine2` | text |
| Address Line 3 | `addressLine3` | text |
| Town / Village | `townVillage` | text |
| City | `city` | text |
| County / District (LGA) | `countyDistrict` | text |
| State / Province | `stateProvinceId` | **select** ← `stateProvinceIdOptions` |
| Country | `countryId` | **select** ← `countryIdOptions` |
| Postal Code | `postalCode` | text |
| (fixed) | `addressTypeId` | auto: first `resid/home/perm` type, else first option |
| (fixed) | `isActive: true` | — |

- Options are loaded once at wizard init from `GET /client/addresses/template`
  (`addressTypeIdOptions`, `countryIdOptions`, `stateProvinceIdOptions`). When the Address
  module is **off** on the tenant, State/Country degrade to plain text inputs and the whole
  address falls back to a single structured Note — no data loss, never blocks the record.
- The **Review** step now shows the assembled one-line address before submit.
- `captureStep()` persists every field across step navigation and doc-upload re-renders.

---

## 2. Client submission completeness

The POST `/clients` body and its post-create KYC follow-ups were reviewed against the
Fineract client command contract. Coverage confirmed complete:

- **Core:** `officeId`, `legalFormId`, `firstname`/`middlename`/`lastname` (person) ·
  `fullname` (entity), `dateOfBirth`, `genderId`, `mobileNo`, `emailAddress`, `externalId`
  (falls back to TIN), `staffId`, `clientTypeId`, `clientClassificationId`,
  `submittedOnDate`, `active` + `activationDate`.
- **Entity:** `clientNonPersonDetails` (incorpNumber, incorpValidityTillDate, constitutionId,
  mainBusinessLineId, remarks).
- **Post-create (real endpoints, non-blocking, errors surfaced):**
  identifiers → `/clients/{id}/identifiers`; **address → `/client/{id}/addresses` (now
  structured)**; next-of-kin → `/clients/{id}/familymembers`; photo → images; ID / proof /
  signature → documents.
- **Note-only (no native column, correct home):** occupation, source of income, risk rating,
  requested customer sub-type.

---

## 3. Form field audit — all other FinCraft forms

Verified each create form sends the full Fineract create contract. Findings:

| Form / handler | Endpoint | Status |
|---|---|---|
| New Loan wizard `pages/loans/new.js` | `POST /loans` | ✅ complete (principal, tenure, rate, all frequency/type/strategy fields, dates, officer, fund, purpose, linkAccount, externalId) |
| New Savings wizard `pages/savings/new.js` | `POST /savingsaccounts` | ✅ complete (interest, overdraft, lock-in, opening balance, field officer, externalId) |
| Group `ui/handlers/group.js` | `POST /groups` | ✅ name, officeId, submittedOnDate, staffId, externalId (+ center association, auto-activate) |
| Center `ui/handlers/center.js` | `POST /centers` | ✅ name, officeId, submittedOnDate, staffId, externalId (+ auto-activate) |
| Staff `ui/handlers/staff.js` | `POST /staff` | ✅ firstname, lastname, officeId, isLoanOfficer, isActive, mobileNo, externalId, joiningDate |
| Office `ui/handlers/office.js` | `POST /offices` | ✅ name, parentId, openingDate, externalId |

> Note: Fineract's published OpenAPI schema is sparse for command bodies (e.g.
> `PostSavingsAccountsRequest` lists only 6 of ~20 accepted fields), so coverage was
> verified against the actual command handlers, not the Swagger schema alone.

## Validation
- `node --check` passes on every `js/**/*.js`.
- Full test suite: **23 passed, 0 failed** (`node test-runner/run-tests.js`).
