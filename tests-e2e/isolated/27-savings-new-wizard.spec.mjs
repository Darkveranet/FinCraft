import { test, expect } from '@playwright/test';
import { fineract, login, runId, date } from './helpers.mjs';

/* Same rationale as the client/loan wizard tests: savings account creation
 * is covered API-side (08/21-savings-lifecycle), but the actual #savings-new
 * wizard has never been driven through a browser. */

test.describe.serial('module 27 - savings-new wizard', () => {
  const state = { officeId: null, clientId: null, productId: null };

  test('seed a client and a savings product via API', async ({ request }) => {
    const offices = await fineract(request, 'GET', '/offices');
    state.officeId = offices[0]?.id;
    expect(state.officeId).toBeTruthy();

    const client = await fineract(request, 'POST', '/clients', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `SavingsWizard ${runId}`.slice(0, 45),
      legalFormId: 1, active: true, activationDate: date(), submittedOnDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    state.clientId = client.clientId || client.resourceId;

    const suffix = String(runId).replace(/\D/g, '').slice(-8);
    const product = await fineract(request, 'POST', '/savingsproducts', {
      name: `FinCraft SavingsWizard Product ${runId}`.slice(0, 90), shortName: `S${suffix}`.slice(0, 4),
      description: 'module 27 wizard UI test product', currencyCode: 'USD', digitsAfterDecimal: 2,
      inMultiplesOf: 1, nominalAnnualInterestRate: 5, interestCompoundingPeriodType: 4,
      interestPostingPeriodType: 4, interestCalculationType: 1,
      interestCalculationDaysInYearType: 365, accountingRule: 1,
      withdrawalFeeForTransfers: false, allowOverdraft: false
    });
    state.productId = product.resourceId;
    expect(state.clientId && state.productId).toBeTruthy();
  });

  test('click through all 4 steps and submit', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('savings-new'); });

    // Step 1 — Account Holder.
    await expect(page.locator('#wz-client')).toBeVisible({ timeout: 15_000 });
    await page.locator('#wz-client').selectOption(String(state.clientId));
    await page.locator('#wz-next').click();

    // Step 2 — Product. Required.
    await expect(page.locator('#wz-product')).toBeVisible();
    await page.locator('#wz-product').selectOption(String(state.productId));
    await page.locator('#wz-opening').fill('500');
    await page.locator('#wz-next').click();

    // Step 3 — Terms. Submitted-on date is pre-filled; nothing else required.
    await expect(page.locator('#wz-submitted')).not.toHaveValue('');
    await page.locator('#wz-next').click();

    // Step 4 — Review & submit.
    await expect(page.locator('#wz-submit')).toBeVisible();
    await page.locator('#wz-submit').click();

    await expect(page.locator('#contentArea')).toContainText('FinCraft', { timeout: 30_000 });

    expect(errors, `Unexpected page errors: ${errors.join('; ')}`).toEqual([]);
  });

  test('verify the savings account the wizard created via API', async ({ request }) => {
    const client = await fineract(request, 'GET', `/clients/${state.clientId}?associations=all`);
    const rows = client?.savingsAccounts || [];
    expect(rows.length, 'wizard-created savings account should be attached to the client').toBeGreaterThan(0);
    const account = await fineract(request, 'GET', `/savingsaccounts/${rows[0].id}`);
    expect(account.productId ?? account.savingsProductId).toBe(state.productId);
  });
});
