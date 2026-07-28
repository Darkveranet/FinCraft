# FinCraft — Developer Recommendations: Implementation Summary

Actioned against the priority order in the developer-recommendations report.
Every change was verified: `npm ci` is green, all **4 static scans pass**, and
the test suite is **25 passed / 0 failed** (was 24 with 1 pre-existing failure).

---

## §1 Security — done
| Fix | File | What changed |
|---|---|---|
| Escape field **labels** in wizard review | `js/ui/modal-wizard.js` | Imported shared `escapeHtml`; label **and** value now go through it (replaced the local regex). |
| Escape **error messages** in router | `js/router.js` | `handleHash()` catch block + loading line + `renderStaticPage` now `escapeHtml(...)` all interpolated text. |
| Escape backend-derived **office name** | `js/ui/shell.js` | `${office \|\| 'Member'}` → `${escapeHtml(office \|\| 'Member')}` (sat un-escaped next to already-escaped username/tenant). |
| Consolidate escaping | — | Wizard no longer has its own inline regex; one shared `escapeHtml`. |

## §2 Architecture — done (recent-tenants) / seam left
- **Extracted `js/recent-tenants.js`** out of the 800-line `auth.js` (the fully
  self-contained localStorage cluster). `auth.js` imports it back under the old
  private names → **zero call-site churn**, verified by the static `module-integrity` test.
- `auth-basic.js` / `auth-oidc.js` splits are tracked in `OPEN-ITEMS.md` (they share
  private session helpers, so they need a deliberate, reviewable pass — not a blind cut).
- **Duplicate-API scan corrected** (see §4) — its two "hits" were false positives.
- **`js/data.js`** dead-stub documented with a clear placeholder header (zero importers confirmed).

## §3 API completeness — surfaced as tracked work
- **`OPEN-ITEMS.md`** — durable index of every deferred / spot-checked / unconfirmable
  item pulled out of the fixlogs (Working Capital Loans + 6 unimplemented capabilities;
  `organization.js`, `integrations.js`, `misc.js` self-service pending a full diff).
- **`.github/ISSUE_TEMPLATE/api-coverage-gap.md`** — so future gaps become issues, not prose.

## §4 Tooling & process — done
- **`scan_unescaped_innerhtml.mjs`** (new, zero-dep, acorn-based) — the escaping-discipline
  gate, **baseline-ratcheted** (`scan-innerhtml-baseline.json`, 84 reviewed-legacy items):
  CI fails only on **new** raw interpolations. Proven to catch a planted violation.
- **`scan_double_calls.mjs` fixed** — was scope-blind and reported 2 false positives
  (a KPI fetch vs. a paginated fetch in different inner functions). Now attributes each
  call to its **nearest enclosing function** → 0 false positives, still catches real dupes.
- **All scans now exit non-zero on findings** so CI can gate on them.
- **`.github/workflows/quality.yml`** — runs the 4 scans as blocking gates + a
  non-blocking eslint/prettier job.
- **ESLint flat config** (`eslint.config.mjs`) + **custom rule**
  (`eslint-rules/no-unescaped-innerhtml.mjs`, mirrors the scan) + **Prettier** config.
- **Pre-commit hook** (`.githooks/pre-commit`, plain POSIX — no Husky).
- **`.github/dependabot.yml`** (npm + github-actions, weekly, grouped).
- **`package.json`** scripts: `scan`, `scan:baseline`, `lint`, `format`, `e2e`, `verify`.
  (Tooling deps intentionally **not** declared → keeps `npm ci` in sync with the lockfile;
  installed on-demand — see the note in `package.json`.)

## §5 Testing — done
- **`tests/escaping-discipline.test.js`** — feeds `<script>`/`onerror` payloads through the
  real high-risk helpers (`tellerCashierOptionsHtml`, `officeOptionsHtml`, `glOptionsHtml`,
  `escapeHtml`) in jsdom and asserts **0 live nodes**. Includes a positive control so the
  test provably *can* fail.
- **Playwright scaffold** (`playwright.config.mjs`, `tests-e2e/smoke.spec.mjs`) — backend-free
  routing / not-found / **`_renderToken` race** tests implemented; login + permission-gating
  tests self-skip until `FINERACT_URL/USER/PASS/TENANT` are set.
- **Fixed the pre-existing failing test** `tests/accounting-fixes.test.js` — it string-matched
  only the object-literal form; the production code (correct) uses the assignment form. Made
  the assertion robust to both while still locking the real field names.

---

## One-time local setup
```bash
git config core.hooksPath .githooks          # enable the pre-commit hook
git update-index --chmod=+x .githooks/pre-commit   # if the exec bit didn't survive
npm i -D eslint globals prettier @playwright/test  # optional lint/format/e2e tooling
npx playwright install chromium
```

## Handy commands
```bash
npm run verify          # all 4 scans + full test suite (the CI gate, locally)
npm run scan:baseline   # regenerate scan-innerhtml-baseline.json after burning items down
npm run e2e             # Playwright smoke tests
```
