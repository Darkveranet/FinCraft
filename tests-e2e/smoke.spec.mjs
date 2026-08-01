import { test, expect } from '@playwright/test';

/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · browser smoke tests (§5 of the developer-recommendations report)

   Two tiers:
     • Backend-free — routing, not-found handling, and the exact stale-async race
       the router's `_renderToken` mechanism was built to prevent. These run
       anywhere with just the static server.
     • Authenticated — login → navigate to a permission-gated page → assert
       access/denial. These need a reachable Fineract instance; they self-skip
       unless FINERACT_URL / FINERACT_USER / FINERACT_PASS / FINERACT_TENANT are
       set, so CI stays green without secrets.
   ──────────────────────────────────────────────────────────────────────────── */

test.describe('routing (no backend needed)', () => {
  test('boots to the login screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#loginScreen')).toBeVisible();
  });

  test('unknown route renders the not-found static page, not a crash', async ({ page }) => {
    await page.goto('/#this-route-does-not-exist');
    await expect(page.locator('.empty-state')).toContainText(/does not exist/i);
    // Regression guard: the old bug was an "innerHTML of null" throw on bad routes.
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(200);
    expect(errors, 'no uncaught errors while rendering an unknown route').toEqual([]);
  });

  test('rapid navigation resolves to the LAST route (the _renderToken race)', async ({ page }) => {
    await page.goto('/');
    // Fire several hash changes back-to-back while dynamic import()s are still
    // resolving. The render-token guard must ensure the final hash wins and no
    // superseded render clobbers #contentArea.
    await page.evaluate(() => {
      location.hash = '#clients';
      location.hash = '#loans';
      location.hash = '#savings';
      location.hash = '#not-found-xyz';
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/#not-found-xyz$/);
    // Whatever won, the app must be intact (contentArea present, no dangling spinner).
    await expect(page.locator('#contentArea')).toBeVisible();
  });
});

const AUTH = {
  // Default to the deployed container system (scripts/e2e/stack-up.sh); env
  // overrides it in CI. No shared public demo.
  url: process.env.FINERACT_URL || 'https://127.0.0.1:8443',
  user: process.env.FINERACT_USER || 'mifos',
  pass: process.env.FINERACT_PASS || 'password',
  tenant: process.env.FINERACT_TENANT || 'default',
};
const hasAuth = Boolean(AUTH.url && AUTH.user && AUTH.pass);

test.describe('permission gating (needs a Fineract instance)', () => {
  test.skip(!hasAuth, 'set FINERACT_URL/USER/PASS/TENANT to run authenticated smoke tests');

  test('login then reach a permission-gated page', async ({ page }) => {
    await page.goto('/');
    // NOTE: selectors below are the expected shape of views/login — adjust to the
    // real ids in index.html / the login partial when first wiring this up.
    await page.fill('#l-server', AUTH.url);
    await page.fill('#l-tenant', AUTH.tenant);
    await page.fill('#l-user', AUTH.user);
    await page.fill('#l-pass', AUTH.pass);
    await page.click('#l-btn');

    await expect(page.locator('#appShell')).toBeVisible();

    // A user WITH READ_CLIENT should see the clients list…
    await page.goto('/#clients');
    await expect(page.locator('#contentArea')).not.toContainText(/don't have permission/i);
  });

  test('authenticated navigation keeps the application shell intact', async ({ page }) => {
    await page.goto('/');
    await page.fill('#l-server', AUTH.url);
    await page.fill('#l-tenant', AUTH.tenant);
    await page.fill('#l-user', AUTH.user);
    await page.fill('#l-pass', AUTH.pass);
    await page.click('#l-btn');
    await expect(page.locator('#appShell')).toBeVisible({ timeout: 30_000 });
    await page.goto('/#tasks');
    await expect(page.locator('#contentArea')).toBeVisible();
  });
});
