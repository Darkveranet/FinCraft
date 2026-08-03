# FinCraft API Migration Plan — hand-written → contract-driven

**Goal:** make Apache Fineract's OpenAPI spec the single source of truth for
FinCraft's API surface, *without* throwing away the ergonomic hand-written
`js/api/*.js` wrappers the UI depends on. The contract becomes the **referee**:
CI continuously proves where the hand-written code matches the real Fineract
surface and where it drifts.

> **Why not just delete the hand-written APIs and use the generated client?**
> The generated client is mechanical (`retrieveAllClients`, positional args);
> the curated wrappers give the UI readable, task-shaped methods
> (`clients.activate(id, date)`). We keep the wrappers *and* verify them against
> the contract. That's the honest middle path decided on 2026-08-01.

---

## Phases

### Phase 0 — Pipeline built ✅
`tools/api-automation` fetches → normalises → generates the client, contracts,
validators, builders, template maps and command aliases, and opens a weekly PR.
Breaking vs additive changes are routed to draft vs auto-merge PRs.

### Phase 1 — Generate against the REAL spec ⏳ (runs in CI, not the sandbox)
So far the pipeline has only run against the bundled 6-path `sample-spec.json`.
The real surface (thousands of operations) lives inside the `apache/fineract`
image. **This can only run where Docker exists — your GitHub Actions runner.**

- **Trigger:** Actions → **API Contract Sync** → *Run workflow* → `source: image`
  (fast, static `docker cp`) or `source: live` (boots Postgres + Fineract and
  reads the running instance's published spec).
- **Output:** real `contracts/openapi.*.json` + regenerated `js/api/generated/*`
  land on the `bot/api-contract-sync` branch as a PR. That PR is Phase 1 done.
- **How you'll know it worked:** the PR's job summary prints the contract diff
  **and** the drift report (Phase 2); `js/api/generated/contracts.generated.js`
  goes from ~10 ops to the full Fineract surface.

### Phase 2 — Drift report ✅ (this change)
`tools/api-automation/api-drift.mjs` statically extracts every `self._g/_p/_u/_d`
route from the 24 curated `js/api/*.js` modules and diffs them against the
generated `CONTRACTS`. Buckets:

| Bucket | Meaning | Action |
|---|---|---|
| ✅ **Matched** | wrapper route backed by a contract op | none |
| 🔴 **Mismatch** | same endpoint+command, **wrong HTTP method** | fix the wrapper — a real bug |
| 🟡 **Unverified** | wrapper route with no contract op | wrong route *or* op absent from spec — investigate |
| ⚪ **Uncovered** | contract op no wrapper calls | UI coverage gap — build or defer |

Run it: `npm run api:drift` (writes `contracts/api-drift.{json,md}`).
`npm run api:drift:strict` exits non-zero on any 🔴 Mismatch (for gating).
In CI it's built inside **API Contract Sync**, appended to the job summary, and
attached to the sync PR body.

> Against the sample spec the 🟡/⚪ counts are meaningless (the tool says so in
> the report header). They only become the real migration backlog once Phase 1
> has committed the full contract.

### Phase 3 — Auto-generate E2E tests (next)
With a trustworthy contract, generate Playwright/API E2E specs per operation
(happy-path CRUD + required-field validation) and run them against the **same**
disposable Postgres + Fineract stack every other tier uses
(`scripts/e2e/stack-up.sh`). This closes the loop: contract → generated tests →
run against real Fineract → catch drift the static report can't (runtime
behaviour, status codes, field semantics).

### Phase 4 — CI gates
Once the backlog from Phase 2 is burned down: flip `api:drift:strict` on for the
Mismatch bucket, and require the generated E2E suite green, so no PR can
re-introduce a route that disagrees with Fineract.

---

## Where we are right now (2026-07-29)

- Phase 0: **done**.
- Phase 1: **pending a CI run** — needs Docker (your runner), not the sandbox.
- Phase 2: **done & validated** locally against the sample (26→1 false positives
  eliminated; the lone remaining item is a known sample-spec gap). Wired into
  `npm run api:drift` and the **API Contract Sync** workflow.
- Phase 3: **partial (2026-08-02)** — generator built, 96 tests generated and
  structurally validated, not yet run against a live stack. Phase 4: not started.

**Immediate next action (yours):** run **API Contract Sync** in GitHub Actions to
execute Phase 1. Merge the resulting PR to commit the real contract + generated
client, then the drift report becomes your real, prioritised correction list.
