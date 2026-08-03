# Generated E2E tests (Phase 3, partial)

Everything in this directory except `README.md` and `helpers-shared.mjs` is
**auto-generated** by `tools/api-automation/generate-e2e.mjs` — do not hand-edit
`read-smoke.spec.mjs` or `required-field-validation.spec.mjs`; regenerate with
`npm run api:e2e-gen` instead.

## What's here

- **`read-smoke.spec.mjs`** — one assertion per matched, zero-path-param GET
  operation (153 as of 2026-08-02): call it, expect 2xx. Catches route-level
  drift (renamed/removed endpoints, permission regressions, status-code
  changes) across resources the hand-written lifecycle specs don't otherwise
  touch on every run.
- **`required-field-validation.spec.mjs`** — one negative test per matched,
  zero-path-param write operation whose contract declares required fields
  (13 as of 2026-08-02): send an empty body, expect rejection.

## What's deliberately NOT here

Auto-generating a valid happy-path CREATE/UPDATE payload for an arbitrary
Fineract resource needs real domain knowledge (foreign keys, product config,
valid enum combinations) that isn't recoverable from the contract alone. That
work already exists, hand-written, in `tests-e2e/isolated/*.spec.mjs` — this
generated suite is a complementary safety net, not a replacement.

Similarly, GET operations that take a path parameter (e.g. `/clients/{id}`)
are skipped — there's no generic, safe way to obtain a valid ID without a
prior create step.

The required-field list is bounded by what Fineract's own OpenAPI spec
documents as `required` — which is a minority of write operations. A test
NOT existing here for a given field is not evidence that field is optional at
runtime, only that the contract doesn't say otherwise.

## Running

```
npm run api:e2e-gen          # regenerate from the current contract
npx playwright test tests-e2e/generated   # run just this suite
npm run e2e                  # runs this suite alongside everything else in tests-e2e/
```

Needs a running Fineract stack (`npm run e2e:up`) and the usual `FINERACT_URL`
/ `FINERACT_TENANT` / `FINERACT_USER` / `FINERACT_PASS` env vars — see
`tests-e2e/isolated/helpers.mjs` for the convention this reuses.
