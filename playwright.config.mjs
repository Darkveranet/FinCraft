import { defineConfig, devices } from '@playwright/test';

/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · Playwright config (§5 of the developer-recommendations report)

   Browser-level smoke tests for the routing / permission-gated SPA — the class
   of bug the jsdom unit suite can't reach. FinCraft is a static site, so we just
   serve the repo root over HTTP and drive it with a real browser.

   Install:  npm i -D @playwright/test && npx playwright install chromium
   Run:      npx playwright test          (or `npm run e2e`)

   BASE_URL / FINERACT creds for the authenticated specs are read from env so no
   secrets live in the repo — see tests-e2e/smoke.spec.mjs.
   ──────────────────────────────────────────────────────────────────────────── */
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Serve the static app for the duration of the run. Any static server works;
  // Python is preinstalled on the GitHub runners so it needs zero extra deps.
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
});
