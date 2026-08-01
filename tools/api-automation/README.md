# FinCraft — Contract-Driven API Automation

Apache Fineract is the **source of truth** for FinCraft's API surface. Instead of
hand-maintaining every endpoint, request shape and dropdown option, this pipeline
regenerates that machinery from Fineract's OpenAPI 3.0.3 spec on a schedule (and
on demand), then opens a pull request. **You build the UI; the contract powers it.**

```
Apache Fineract (source of truth)
        │
        ▼   GitHub Actions: weekly schedule ─┐
        │                     manual trigger ─┘
        ▼
 1. Generate OpenAPI 3.0.3 Spec        fetch-spec.mjs
 2. Validate & Normalize Spec          normalize-spec.mjs
        │
        ├─► 3. Generate API Client              generate-client.mjs
        ├─► 4. Generate Payload Contracts       generate-contracts.mjs
        └─► 5. Generate Runtime Validators
               + Payload Builders               generate-validators.mjs
        ▼
 6. Attach Fineract Template Endpoints  attach-templates.mjs   (dropdown options)
 7. Generate FinCraft Command Aliases   generate-aliases.mjs
 8. Contract Diff & Breaking-Change     diff-contracts.mjs
        │
        ▼
  Breaking change?  ──No──►  Auto Pull Request (ready for auto-merge)
                   ──Yes─►  Draft PR + review label (requires review)
        ▼
  FinCraft UI Layer (you build): Pages & Forms · Permissions ·
  Business Workflows · Confirmation Dialogs
```

## Run it locally

```bash
npm run api:all          # full pipeline (fetch → normalize → generate → diff)
npm run api:generate     # regenerate only, from an existing normalized spec
npm run api:fetch        # just refresh contracts/openapi.raw.json
npm run api:diff         # re-run breaking-change detection
```

## Where the spec comes from

`fetch-spec.mjs` resolves the spec in this order (first hit wins):

| Priority | Source | How to set |
| --- | --- | --- |
| 1 | Direct spec URL | `FINERACT_SPEC_URL` env / secret |
| 2 | Running Fineract | `FINERACT_BASE_URL` env / secret (tries its published spec paths) |
| 3 | **Docker image (no live instance)** | `FINERACT_IMAGE` env (e.g. `apache/fineract:latest`) — reads the static spec baked into the image via `docker cp` |
| 4 | Committed cache | `tools/api-automation/cache/fineract.openapi.json` |
| 5 | Bundled sample | `tools/api-automation/sample-spec.json` (bootstrap / offline) |

> **You do not need a running Fineract.** The OpenAPI document ships as a static
> file inside the `apache/fineract` image at `/app/resources/static/fineract.json`.
> `FINERACT_IMAGE` creates a throwaway container (never starts it), copies that
> file out, and removes the container — no database, no Spring boot. Locally:
>
> ```bash
> FINERACT_IMAGE=apache/fineract:latest npm run api:all   # full surface, offline
> npm run api:from-image                                   # same, shorthand
> ```
>
> In CI, the weekly workflow does this automatically and adds a manifest-only
> **digest short-circuit**: if the image hasn't moved, it pulls nothing and
> regenerates nothing.

To pin a specific upstream, drop the real Fineract OpenAPI JSON into
`cache/fineract.openapi.json` and commit it — CI then runs fully deterministically.

## Generated artefacts (do not hand-edit)

Everything lands in `js/api/generated/` and re-exports from `index.js`:

| File | Purpose |
| --- | --- |
| `client.generated.js` | `make<Resource>API(self)` factories in the curated `js/api/*.js` style, plus `mountGenerated(api)` to attach any resource not already hand-written. |
| `contracts.generated.js` | `CONTRACTS[operationId]` — method, path, params, request/response field shapes. Powers generated forms. |
| `validators.generated.js` | `validateRequest(operationId, body)` / `assertValid(...)` — required/type/enum checks. |
| `builders.generated.js` | `buildPayload(operationId, input)` — auto-injects `locale`/`dateFormat` for date-bearing ops. |
| `templates.generated.js` | `TEMPLATE_ENDPOINTS` + `loadOptions(api, resource)` — Fineract `.../template` dropdown option arrays. |
| `aliases.generated.js` | `API_ALIASES` — command-palette entries (`toCommands(makeRun)`) for `js/cmd.js`. |

Intermediate contract state lives in `contracts/`:
`openapi.raw.json` → `openapi.normalized.json` → `openapi.snapshot.json`
(+ `validation-report.json`, `diff-report.{json,md}`). The **snapshot** is what the
next run diffs against, so keep it committed.

## Wiring into the app (UI layer — you build)

```js
import { FineractAPIFull } from './js/api/index.js';
import { mountGenerated } from './js/api/generated/client.generated.js';
import { buildPayload } from './js/api/generated/builders.generated.js';
import { assertValid }  from './js/api/generated/validators.generated.js';
import { loadOptions }  from './js/api/generated/templates.generated.js';

const api = new FineractAPIFull();
mountGenerated(api);                       // adds any resource not already curated

// Populate a form's dropdowns straight from the contract:
const opts = await loadOptions(api, 'clients');   // { officeOptions, staffOptions, … }

// Validate + build before sending:
const body = buildPayload('createClient', formValues);
assertValid('createClient', body);          // throws with field-level errors
await api.clients.create(body);
```

And in `js/cmd.js`, make every operation reachable via ⌘K:

```js
import { toCommands } from './api/generated/aliases.generated.js';
const apiCmds = toCommands((a) => () => runOperation(a));  // your handler
return [...nav, ...create, ...actions, ...settings, ...apiCmds];
```

## Breaking-change policy

`diff-contracts.mjs` flags a change **breaking** when it can break an existing
caller: a removed operation, a newly-required request field, a removed/retyped
response field, or a removed enum value. Everything else (new operations, new
optional fields, new enum values) is **additive**. The workflow routes breaking
diffs to a **draft PR** labelled `breaking-change` / `needs-review`; additive
diffs go to an auto-mergeable PR labelled `auto-merge`.

## CI

`.github/workflows/api-automation.yml` runs weekly (Mon 06:00 UTC) and via
**Run workflow** (optionally passing a `spec_url`). It parses every generated
module to guarantee it imports cleanly before opening the PR, and writes the diff
report into the job summary.
