# FIXLOG — Dashboard charts "could not load" + Centers/Clients/Groups "innerHTML of null" on first click

Two reported runtime bugs, both root-caused and fixed, plus one stale test corrected.

## Bug 1 — Dashboard: "could not load the charts"

**Root cause (a real code bug, not just connectivity):** `js/pages/dashboard/charts.js`
`loadChartJs()` memoized the loader promise in `chartJsPromise` and **never cleared it on
failure**. So a single transient hiccup (slow CDN, brief offline, a corporate proxy stalling the
first request) resolved the promise to `false`, and that resolved-`false` promise was then
returned to **every** chart for the rest of the session — so all ~9 dashboard charts showed
"Chart library failed to load" permanently, even after connectivity returned. There was also no
fallback if cdnjs specifically was blocked.

**Fix:**
- Do **not** cache a failed load — reset `chartJsPromise = null` once it settles false, so the
  next chart render (or a page revisit) retries cleanly. In-flight de-duplication is preserved
  (the ~9 simultaneous chart calls still share one attempt).
- Added a **fallback CDN**: try `cdnjs.cloudflare.com` first, then `cdn.jsdelivr.net`.
- Dead `<script>` tags are removed on error so a retry starts clean.
- `index.html` CSP `script-src` now also allows `https://cdn.jsdelivr.net` (required for the
  fallback to actually load).
- To go fully offline-proof later, self-host Chart.js and prepend
  `'./js/vendor/chart.umd.min.js'` to `CHARTJS_SOURCES` (noted in-code).

## Bug 2 — Centers/Clients/Groups: intermittent "innerHTML of null" on first click

**Root cause:** a **concurrent/duplicate render race** in the hash router. Each list page's
`render()` does `c.innerHTML = <template>` then `await load()` then
`c.querySelector('#…-rows').innerHTML = …`. If a second `handleHash()` ran while the first was
mid-`await`, it reset `#contentArea` to the "Loading…" placeholder — wiping the first render's
`#…-rows` node — so the first render's next `.innerHTML =` hit `null` and threw
*"Cannot set properties of null (setting 'innerHTML')"*.

Two things made it fire **on first click, sometimes**:
1. On first sign-in `showApp()` calls `navigate(lastPage)` (which queues a `hashchange`) and then
   `initRouter()` calls `handleHash()` immediately → two overlapping renders.
2. The **first** dynamic `import()` of a page module is slow (network/parse), widening the await
   window so the overlap actually collides.

**Fix (two layers):**
- **Router render-generation guard** (`js/router.js`): every `handleHash()` claims
  `++_renderToken`; after the module-import `await` and after `mod.render()` it checks
  `myToken !== _renderToken` and **aborts a superseded navigation before it writes** to
  `#contentArea` (and swallows a superseded render's error). This removes the overlap at the source.
- **Defensive null-guards** in the three reported list pages (`centers/list.js`,
  `clients/list.js`, `groups/list.js`): both `load()` and `draw()` now capture the rows element
  and `return` early if it's gone — so even a residual race degrades to a no-op instead of a throw.

## Test correction — accounting-rule contract (follow-up to the field-error screenshots)

`tests/accounting-fixes.test.js` §4 still asserted the **old** accounting-rule request shape
(`debitAccountId`/`creditAccountId`). Those are **not** real Fineract request fields — the real
`PostAccountingRulesRequest` uses **`accountToDebit`/`accountToCredit`** (verified against the
mifos API reference and the generated fineract python client). Sending `debitAccountId` is exactly
what produced the "Validation errors exist" screenshot. The code was already corrected to
`accountToDebit`/`accountToCredit`; the test is now updated to lock in that verified contract and
guards against regressing to either the `debitAccountId` names or the older
`debitAccounts:[{glAccountId}]` array shape (which is the GET *response* shape, not the POST body).

## Verification
- `node --check` clean on all changed files (`charts.js`, `router.js`, three list pages).
- Full suite: **23 passed / 0 failed** (`node test-runner/run-tests.js`).
- Service-worker cache bumped `v12 → v13` so clients fetch the fixed files instead of stale cache.
