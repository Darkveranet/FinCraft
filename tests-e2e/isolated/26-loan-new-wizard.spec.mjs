import { test, expect } from '@playwright/test';
import { fineract, login, runId, date } from './helpers.mjs';

/* Loan creation is already covered API-side (09/22-loans-lifecycle), but the
 * actual #loan-new wizard — which resolves a client + product picked from
 * dropdowns into a real POST /loans body — has never been driven through a
 * browser. Same rationale as the client wizard: this is FinCraft's own
 * mapping/UI layer, not just a pass-through, so it needs its own test. */

test.describe.serial('module 26 - loan-new wizard', () => {
  const state = { officeId: null, clientId: null, clientName: null, productId: null, productName: null };

  test('seed a client and a loan product via API', async ({ request }) => {
    const offices = await fineract(request, 'GET', '/offices');
    state.officeId = offices[0]?.id;
    expect(state.officeId).toBeTruthy();

    const client = await fineract(request, 'POST', '/clients', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `LoanWizard ${runId}`.slice(0, 45),
      legalFormId: 1, active: true, activationDate: date(), submittedOnDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    state.clientId = client.clientId || client.resourceId;
    state.clientName = `FinCraft LoanWizard ${runId}`.slice(0, 45 + 9);

    const suffix = String(runId).replace(/\D/g, '').slice(-8);
    const product = await fineract(request, 'POST', '/loanproducts', {
      name: `FinCraft LoanWizard Product ${runId}`.slice(0, 90), shortName: `FLW${suffix}`.slice(0, 20),
      description: 'module 26 wizard UI test product', currencyCode: 'USD', digitsAfterDecimal: 2,
      inMultiplesOf: 1, principal: 1000, minPrincipal: 100, maxPrincipal: 10000,
      numberOfRepayments: 12, minNumberOfRepayments: 1, maxNumberOfRepayments: 36,
      repaymentEvery: 1, repaymentFrequencyType: 2, interestRatePerPeriod: 12,
      minInterestRatePerPeriod: 0, maxInterestRatePerPeriod: 60, interestRateFrequencyType: 3,
      amortizationType: 1, interestType: 0, interestCalculationPeriodType: 1,
      transactionProcessingStrategyCode: 'mifos-standard-strategy', accountingRule: 1,
      daysInYearType: 365, daysInMonthType: 30, canDefineInstallmentAmount: true,
      isInterestRecalculationEnabled: false
    });
    state.productId = product.resourceId;
    expect(state.clientId && state.productId).toBeTruthy();
  });

  test('click through all 4 steps and submit', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('loan-new'); });

    // Step 1 — Applicant.
    await expect(page.locator('#wz-client')).toBeVisible({ timeout: 15_000 });
    await page.locator('#wz-client').selectOption(String(state.clientId));
    await page.locator('#wz-next').click();

    // Step 2 — Loan Details. Product + amount are required; tenure defaults to 12.
    await expect(page.locator('#wz-product')).toBeVisible();
    await page.locator('#wz-product').selectOption(String(state.productId));
    await page.locator('#wz-principal').fill('1500');
    await page.locator('#wz-next').click();

    // Step 3 — Assessment. No required fields; a light touch to prove the
    // step actually renders and its inputs are wired, not just skipped past.
    await expect(page.locator('#wz-income')).toBeVisible();
    await page.locator('#wz-income').fill('50000');
    await page.locator('#wz-next').click();

    // Step 4 — Review & submit.
    await expect(page.locator('#wz-submit')).toBeVisible();
    await expect(page.locator('#contentArea')).toContainText('1,500');
    await page.locator('#wz-submit').click();

    await expect(page.locator('#contentArea')).toContainText('FinCraft', { timeout: 30_000 });

    expect(errors, `Unexpected page errors: ${errors.join('; ')}`).toEqual([]);
  });

  test('verify the loan the wizard created via API', async ({ request }) => {
    const client = await fineract(request, 'GET', `/clients/${state.clientId}?associations=all`);
    const rows = client?.loanAccounts || [];
    expect(rows.length, 'wizard-created loan should be attached to the client').toBeGreaterThan(0);
    const loan = await fineract(request, 'GET', `/loans/${rows[0].id}`);
    expect(loan.principal ?? loan.summary?.principalDisbursed ?? loan.approvedPrincipal).toBeTruthy();
  });
});
