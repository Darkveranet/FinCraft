import { test, expect } from '@playwright/test';
import { fineract, login, runId, date } from './helpers.mjs';

/* Client creation is already covered API-side (01/06-client-lifecycle), but
 * nobody has ever driven the actual #client-new wizard through a browser —
 * that form is FinCraft's own field-mapping layer (legalFormId derivation,
 * KYC follow-up calls) sitting in front of the API, and a broken button, a
 * stuck validation step, or a wrong field id would be invisible to a pure
 * API test. This drives all 4 steps (Type -> Personal -> Identity -> Review)
 * for the minimal-required-fields path, then verifies via API that Fineract
 * actually has the record. */

test.describe.serial('module 25 - client-new wizard', () => {
  const lastname = `Wizard ${runId}`.slice(0, 45);
  let clientId;

  test('click through all 4 steps and submit', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('client-new'); });

    // Step 1 — Type. Individual is the default-active card; just confirm the
    // grid rendered and move on (also exercises the click path itself).
    await expect(page.locator('.wz-type[data-type="individual"]')).toBeVisible({ timeout: 15_000 });
    await page.locator('.wz-type[data-type="individual"]').click();
    await page.locator('#wz-next').click();

    // Step 2 — Personal. Only first/last name are required for Individual.
    await expect(page.locator('#wz-first')).toBeVisible();
    await page.locator('#wz-first').fill('FinCraft');
    await page.locator('#wz-last').fill(lastname);
    await page.locator('#wz-mobile').fill('08012345678');
    await page.locator('#wz-email').fill(`wizard.${Date.now()}@example.test`);
    await page.locator('#wz-next').click();

    // Step 3 — Identity/branch. Office + submitted date are pre-filled by
    // the page itself (first office, today) — just confirm they're non-empty
    // rather than overriding them, matching what a user who accepts the
    // defaults would do.
    await expect(page.locator('#wz-office')).toBeVisible();
    await expect(page.locator('#wz-office')).not.toHaveValue('');
    await expect(page.locator('#wz-submitted')).not.toHaveValue('');
    await page.locator('#wz-next').click();

    // Step 4 — Review & submit.
    await expect(page.locator('#wz-submit')).toBeVisible();
    await expect(page.locator('#contentArea')).toContainText(lastname);
    await page.locator('#wz-submit').click();

    // Success navigates to client-detail with the new id in the URL/content.
    await expect(page.locator('#contentArea')).toContainText('FinCraft', { timeout: 30_000 });
    await expect(page.locator('#contentArea')).toContainText(lastname);

    expect(errors, `Unexpected page errors: ${errors.join('; ')}`).toEqual([]);
  });

  test('verify the client the wizard created via API', async ({ request }) => {
    const search = await fineract(request, 'GET', `/clients?lastName=${encodeURIComponent(lastname)}`);
    const rows = search?.pageItems || [];
    expect(rows.length, 'wizard-created client should be findable via the API').toBeGreaterThan(0);
    clientId = rows[0].id;
    const client = await fineract(request, 'GET', `/clients/${clientId}`);
    expect(client.displayName || `${client.firstname} ${client.lastname}`).toContain('FinCraft');
    expect(client.mobileNo).toBe('08012345678');
  });
});
