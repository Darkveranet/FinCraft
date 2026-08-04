# FinCraft — Working Checkpoint

## Plan (agreed order)
1. [x] Fix 3 known E2E log failures
   1. [x] 01-client-lifecycle — missing `legalFormId`
   2. [x] 02-core-readiness:17 — stray `location.hash;`
   3. [x] 03-api-surface — `operation-runner.js` missing from `coverage-manifest.json`
2. [ ] Flag 31 unverified routes as intended-external (stop re-surfacing in drift report)
3. [ ] Triage 285 uncovered ops into build/won't-do in `OPEN-ITEMS.md`
4. [x] Build Phase 3 (auto-gen E2E from contract) — done, partial scope (documented, not run live)
5. [x] (Deferred/lighter-touch, not a CI gate) Field-parity / payload-completeness report

## Status log
- Session started. Repo unzipped locally at /home/claude/fincraft/FinCraft-main (uploaded archive).

### Step 1 — DONE
- `01-client-lifecycle.spec.mjs`: added `legalFormId:1` to the POST /clients payload.
  Verified correct value against `js/pages/clients/new.js` (Individual/Person = 1,
  the app's own default) — not a guess.
- `02-core-readiness.spec.mjs`: removed stray `location.hash;` that executed in
  Node (outside `page.evaluate`), which has no `location` global — that's what
  threw. The real hash-set call inside `page.evaluate` was already correct and
  is untouched.
- `tests-e2e/coverage-manifest.json`: added an `operation-runner` entry
  (apiFiles: operation-runner.js, transactional: true — it's the generic
  contract-driven executor behind the ⌘K command palette, can run writes
  against any op including uncovered ones). Re-ran the test's actual matching
  logic in Node against the updated manifest: `missing: []`. JSON validated.
- Not yet done: running these under real Playwright + a live Fineract stack
  (no Docker/network access in this sandbox) — fixes are verified by direct
  logic replication, not by executing the actual test suite. Flagging this
  explicitly rather than claiming full verification.

2. [x] Investigate/flag the 31 unverified — turned into a real tool-hardening pass
3. [x] Triage the 262 (was 285) uncovered ops into OPEN-ITEMS.md
4. [x] Build Phase 3 (auto-gen E2E from contract) — done, partial scope (documented, not run live)
5. [x] (Deferred/lighter-touch, not a CI gate) Field-parity / payload-completeness report

### Step 2 — DONE (bigger than planned)
The premise "all 31 unverified are external" was wrong for most of them. Actual
breakdown after investigation + tool fixes:
- Fixed `api-drift.mjs` nested-template-literal parsing bug (was truncating
  `interoperation/parties` paths → false unverified; now correctly `dynamic`).
- Fixed a blind spot: the extractor never scanned `self._req('METHOD', path, ...)`
  calls at all — missed twofactor, batches, documents, images, and the entire
  generic bulk-import template helper (~14 routes were invisible to the tool,
  not just miscategorized).
- Added literal-path-segment fallback matching: routes like
  `/externalservice/SMS` that call a parameterized contract op
  (`/externalservice/{servicename}`) with a hardcoded value now correctly
  match (19 routes) — these were real coverage the tool couldn't see.
  Caught and fixed a double-counting bug this introduced (contract ops were
  being counted in both Matched and Uncovered). Report now explains the
  resulting arithmetic explicitly rather than leaving a silent discrepancy.
  IMPORTANT CORRECTION: my first pass assumed `products/share` and
  `accounts/share` (12 routes) were genuinely absent from the spec — wrong,
  they're covered by generic `/products/{type}` and `/accounts/{type}` ops,
  caught by the same literal-param fix.
  IMPORTANT CORRECTION #2: assumed the 6 interoperation `*AccountIdentifier*`
  ops were a real functional gap in `interoperation.js` — wrong, verified by
  comparing paths directly that they're the exact same endpoints already
  implemented as `getParty`/`registerParty`/`deleteParty`, just under a
  different Fineract-side operationId. No action needed; reverted my own
  incorrect OPEN-ITEMS.md edit before it stuck.
- Final, honest 9-route `external-routes.json` allowlist (8 self-service ops +
  1 real gap: `DELETE /accounts/share/{}` has no backing contract op at all).
- Final state (verified, strict mode passes): 709 matched, 0 mismatch,
  0 unverified, 11 external (allowlisted), 262 uncovered, 3 dynamic.
- Regenerated committed `contracts/api-drift.{md,json}`.
- Ran `npm test`: 25/25 passed (no regressions from any of today's changes).

### Step 3 — DONE
Grouped the 262 uncovered ops in `OPEN-ITEMS.md` §0c by what to actually do,
not left as a flat list:
- Working Capital Loans: 100 ops (corrected from the old ~53 estimate) —
  stays deferred, §1 updated.
- External-ID twins outside WC: 99 ops — recommended won't-do by default
  (build only on a concrete integration need), documented as a single line
  item instead of 99 individual flags.
- `/internal/*`: 23 ops — recommended won't-do (Fineract's own COB/audit/debug
  surface, not back-office banking).
- Bulk-import per-entity templates: ~30 ops — merged into the existing §4 item
  with the precise entity list (was "~15", now named).
- `searchClientsByText`: 1 op — flagged as a good, low-effort build candidate.
- `authenticate`, `application.wadl*`: 3 ops — recommended won't-do
  (not applicable to FinCraft's current Basic/OIDC auth; not a business op).
- Corrected the §0 "Interoperation COMPLETE" note to mention the drift-tool's
  dynamic-path limitation instead of leaving it unexplained.
- Marked the old "self-service Unconfirmable" item resolved (verified 2026-08-02).

### Step 4 (Phase 3) — DONE, deliberately partial scope
Built `tools/api-automation/generate-e2e.mjs` (`npm run api:e2e-gen`), reading
`contracts/api-drift.json`'s `matchedOps` (new field I added — the drift tool
previously only exposed a matched *count*, not the actual covered-op list,
which the generator needed) + the real `CONTRACTS`/`RULES` generated modules.

Generates two files under `tests-e2e/generated/`:
- `read-smoke.spec.mjs` — 153 matched, zero-path-param GET ops → route-drift
  smoke tests (call it, expect 2xx), grouped by resource (83 groups).
- `required-field-validation.spec.mjs` — 13 matched, zero-path-param write ops
  with contract-declared required fields → empty-body-gets-rejected tests.

Caught myself here too: first pass used a field from `api-drift.json`'s
`matchedOps` that doesn't actually carry `pathParams` (drift.mjs strips it),
so an early "360 safe GET ops" count was wrong — silently included ops that
actually take path params. Re-derived against the real `CONTRACTS` module;
correct number is 153. Also found only 29 of 313 validator-rule ops have any
non-empty `required[]` at all (Fineract's spec marks most bodies fully
optional even though the server enforces requirements at runtime) — so the
required-field test is real but narrower than "required-field validation"
sounds like it should cover; documented that limitation in the generated
file's header and the README rather than overselling it.

Explicitly out of scope (documented in `tests-e2e/generated/README.md`):
happy-path CREATE/UPDATE flows (need real domain payloads — that's what the
existing 23-file hand-written `tests-e2e/isolated/*.spec.mjs` lifecycle suite
already does) and any GET with a path param (no safe way to get a valid ID
without a prior create).

Validated for real: installed `@playwright/test` locally (`--no-save`,
package.json untouched) and ran `playwright test tests-e2e/generated --list`
— both generated files parse correctly, 96 tests collected. NOT run against a
live Fineract stack (no Docker/network for that in this sandbox) — that's the
one remaining step, called out explicitly in OPEN-ITEMS §0b.

Updated `OPEN-ITEMS.md` §0b and `MIGRATION-PLAN.md` status line to reflect
this (marked partial, not done — the honest state).

`npm test`: still 25/25 passing. `api:drift:strict`: still passing.

### Up next
- Everything is in the local working copy only — no git commit/PR (sandbox
  has no .git; this was a fresh unzip). User has been re-sent the zip after
  each major step.

### Step 5 (field parity) — DONE
Built `tools/api-automation/field-parity.mjs` (`npm run api:field-parity`,
writes `contracts/field-parity.md`). Deliberately NOT wired into `npm run
verify` or any CI gate, per the earlier discussion that raw field-diffing is
too noisy to enforce — it's a periodic report with its false-positive-risk
reasoning written into the script header itself, not just this log.

For each matched CREATE/UPDATE op, checks whether each contract-declared
request field (minus `locale`/`dateFormat` boilerplate) appears as an
identifier anywhere in `js/pages/**`, `js/ui/**`, or `js/api/**` (excluding
generated files) — deliberately whole-codebase scope, not per-resource-file,
to bias toward fewer false "missing" claims.

Result: 217 matched CREATE/UPDATE ops, 1570 non-boilerplate fields, 336
flagged as candidates. Used this as a calibration check against the *existing*
OPEN-ITEMS §3 narrative rather than re-doing that narrative's work: `Client`
came out 7% missing (matches "account-level parity is essentially complete"),
`Loan Products` 40% missing (matches "these are product-level fields, not
account fields") — the tool's output lines up with what was already believed,
which is a reasonable trust signal for a first version. Surfaced a few new
things worth a look that weren't called out before (Inter Operation 46%,
Instance Mode 100% — plausibly just not wired to a settings page at all).
Did NOT hand-triage all 336 flagged fields individually — that's real work
appropriately left to the "skim periodically" report, not something to
rubber-stamp resolve in this session. Updated OPEN-ITEMS §3 with the tool
reference and top-line numbers, left the existing manual-verification items
in place rather than claiming they're now closed.

`npm test`: 25/25. `api:drift:strict`: passing. All touched JSON/config valid.

**All 5 planned steps now complete.** Nothing outstanding from today's plan
except the "run generated E2E tests against a live stack" follow-up noted in
Step 4 (needs Docker/CI, not available in this sandbox) and the field-parity
report's 336 candidates (intentionally left for human review, not auto-closed).

## New task: comprehensive FinCraft UI testing (2026-08-03, started after the 5-step plan above)

User wants UI tests (not just API) for "all functions FinCraft has to offer."
Agreed approach (explicit answers): full interaction (fill forms, click
through workflows, verify via API) like the existing 01-23 suite; one batch
of routes at a time in router order, checkpoint after each.

### Gap analysis (done)
`js/router.js` has 49 real routes. Cross-referenced against what the 23
existing lifecycle specs actually navigate to (had to correct my own first
attempt — grepped for a literal `#route` hash pattern that doesn't match how
FinCraft's tests actually navigate; the real pattern is
`r.navigate('route-name', params)` via a dynamic router import). Real result:
16 routes have deep interaction coverage already, 33 have none (only the
module-02 shallow render-check touches them). Full ordered gap list recorded
in `tests-e2e/isolated/README.md` under "Modules 24+".

### Batch 1 — DONE: dashboard, client-new, loan-new, savings-new
Four new files, `tests-e2e/isolated/24-dashboard-ui.spec.mjs` through
`27-savings-new-wizard.spec.mjs`, 10 new tests. Each drives the real wizard UI
(not just the API): clicks step-by-step through FinCraft's own 4-step
wizards (client: Type→Personal→Identity→Review; loan: Applicant→Loan
Details→Assessment→Review; savings: Account Holder→Product→Terms→Review),
using real DOM ids read directly from the page source (`#wz-first`,
`#wz-client`, `#wz-submit`, etc. — not guessed), then verifies the result via
a real Fineract API call.

Caught and fixed two invented-endpoint mistakes before they shipped:
- Used `sqlSearch` as a client-search query param — not real; the actual
  contract param is `lastName`. Verified against `contracts.generated.js`
  before fixing, not assumed.
- Used `/clients/{id}/loans` to look up a client's loans — doesn't exist.
  Real pattern (confirmed against both the contract and the existing
  hand-written specs) is `GET /clients/{id}?associations=all` →
  `loanAccounts`/`savingsAccounts` arrays.

Validated structurally: installed `@playwright/test` (`--no-save`), ran
`playwright test --list` against all 4 new files — 10/10 tests collected
cleanly. Full `tests-e2e` tree: 321 tests across 31 files, no collection
errors. NOT run against a live Fineract stack (same sandbox limitation as
Phase 3's generated tests) — that verification step is still owed.

**Important honest finding, not worked around:** discovered an existing tool,
`scripts/e2e/function-inventory.mjs` (referenced in the README, actually ran
it — 3106 functions found, 1010 "REFERENCED", 2096 "UNTESTED"). Its
`REFERENCED` check is literal function-NAME-token matching against test file
text, not real code coverage. Confirmed my new DOM-driven tests (which
interact via selectors like `#wz-client`, not by calling internal function
names) score ~0 occurrences of the actual internal function names they
exercise — so this tool will NOT show these new tests as adding coverage,
even though they're driving real code paths. Documented this limitation
directly in `tests-e2e/isolated/README.md` rather than either (a) silently
letting the numbers look wrong, or (b) gaming the metric by sprinkling
function-name comments into test files, which would be dishonest. Regenerated
and left the current, accurate `test-results/function-inventory.{json,md}` in
place — it's a real, valid snapshot, just one to interpret carefully.

Updated `tests-e2e/isolated/README.md` with a full "Modules 24+" section:
what's done, what's next in order, and the inventory-tool caveat.

### Up next
- Batch 2 (next checkpoint): `collections`, `transfers`, `remittances` — next
  three in router order after the four just done.
- Still owed from Phase 3: running everything against a live Fineract stack.
