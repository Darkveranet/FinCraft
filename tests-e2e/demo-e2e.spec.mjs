import { test, expect } from '@playwright/test';

const AUTH = {
  // Default to the deployed container system (scripts/e2e/stack-up.sh); env
  // overrides it in CI. No shared public demo.
  url: process.env.FINERACT_URL || 'https://127.0.0.1:8443',
  tenant: process.env.FINERACT_TENANT || 'default',
  user: process.env.FINERACT_USER || 'mifos',
  pass: process.env.FINERACT_PASS || 'password',
};

async function login(page) {
  await page.goto('/');
  await page.locator('#l-server').fill(AUTH.url);
  await page.locator('#l-tenant').fill(AUTH.tenant);
  await page.locator('#l-user').fill(AUTH.user);
  await page.locator('#l-pass').fill(AUTH.pass);
  await page.locator('#l-btn').click();
  await expect(page.locator('#appShell')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#loginScreen')).toBeHidden();
}

test.describe.configure({ mode: 'serial' });

test.describe('live Fineract demo - authenticated read-only E2E', () => {
  test('logs in and establishes an authenticated Fineract session', async ({ page }) => {
    const fiveHundreds = [];
    page.on('response', response => {
      if (response.url().includes('/fineract-provider/') && response.status() >= 500) {
        fiveHundreds.push(`${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });
    await login(page);
    await page.waitForTimeout(1_000);
    expect(fiveHundreds, `Fineract 5xx responses:\n${fiveHundreds.join('\n')}`).toEqual([]);
  });

  test('opens every route allowed to the demo user without page crashes or Fineract 5xx', async ({ page }) => {
    const pageErrors = [];
    const fiveHundreds = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('response', response => {
      if (response.url().includes('/fineract-provider/') && response.status() >= 500) {
        fiveHundreds.push(`${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });

    await login(page);
    const routes = await page.evaluate(async () => {
      const router = await import('/js/router.js');
      return Object.entries(router.PAGE_REGISTRY)
        .filter(([, definition]) => router.isAllowed(definition))
        .map(([route]) => route)
        .filter(route => !['login', 'logout'].includes(route));
    });
    expect(routes.length).toBeGreaterThan(20);

    for (const route of routes) {
      await test.step(`route: ${route}`, async () => {
        await page.evaluate(r => { location.hash = `#${r}`; }, route);
        await expect(page).toHaveURL(new RegExp(`#${route}(?:[?]|$)`));
        await expect(page.locator('#contentArea')).toBeVisible();
        await page.waitForTimeout(350);
        await expect(page.locator('#contentArea')).not.toContainText(/Cannot set properties of null|Cannot read properties of null|is not defined/i);
      });
    }

    expect(pageErrors, `Uncaught browser errors:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(fiveHundreds, `Fineract 5xx responses:\n${fiveHundreds.join('\n')}`).toEqual([]);
  });

  test('loads core operational lists from the live demo', async ({ page }) => {
    await login(page);
    for (const route of ['clients', 'groups', 'centers', 'loans', 'savings', 'accounting', 'reports', 'tasks']) {
      await test.step(route, async () => {
        await page.evaluate(r => { location.hash = `#${r}`; }, route);
        await expect(page.locator('#contentArea')).toBeVisible();
        await expect(page.locator('#contentArea')).not.toContainText(/innerHTML.*null|Cannot read properties|does not exist/i);
      });
    }
  });
});
