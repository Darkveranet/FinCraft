import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId } from './helpers.mjs';

const state = {};
const suffix = String(runId).replace(/\D/g, '').slice(-8);
const name = label => `FinCraft E2E ${label} ${runId}`.slice(0, 90);
const short = label => `FC${label}${suffix}`.slice(0, 20);

async function raw(request, method, path, data) {
  return request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, {
    method, data, ignoreHTTPSErrors: true,
    headers: {
      'Fineract-Platform-TenantId': cfg.tenant,
      Authorization: `Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64')}`,
      'Content-Type': 'application/json'
    }
  });
}

const loanPayload = overrides => ({
  name: name('Loan Product'), shortName: short('LP'), description: 'Isolated FinCraft loan product',
  currencyCode: 'USD', digitsAfterDecimal: 2, inMultiplesOf: 1,
  principal: 1000, minPrincipal: 100, maxPrincipal: 10000,
  numberOfRepayments: 12, minNumberOfRepayments: 1, maxNumberOfRepayments: 36,
  repaymentEvery: 1, repaymentFrequencyType: 2,
  interestRatePerPeriod: 12, minInterestRatePerPeriod: 0, maxInterestRatePerPeriod: 60,
  interestRateFrequencyType: 3, amortizationType: 1, interestType: 0,
  interestCalculationPeriodType: 1, transactionProcessingStrategyCode: 'mifos-standard-strategy',
  accountingRule: 1, daysInYearType: 365, daysInMonthType: 30,
  canDefineInstallmentAmount: true, isInterestRecalculationEnabled: false,
  ...overrides
});

const savingsPayload = overrides => ({
  name: name('Savings Product'), shortName: short('SP'), description: 'Isolated FinCraft savings product',
  currencyCode: 'USD', digitsAfterDecimal: 2, inMultiplesOf: 1,
  nominalAnnualInterestRate: 5, interestCompoundingPeriodType: 4,
  interestPostingPeriodType: 4, interestCalculationType: 1,
  interestCalculationDaysInYearType: 365, accountingRule: 1,
  withdrawalFeeForTransfers: false, allowOverdraft: false,
  ...overrides
});

const depositBase = label => ({
  name: name(label), shortName: short(label === 'Fixed Deposit Product' ? 'FD' : 'RD'),
  description: `Isolated FinCraft ${label}`,
  currencyCode: 'USD', digitsAfterDecimal: 2, inMultiplesOf: 1,
  nominalAnnualInterestRate: 6, interestCompoundingPeriodType: 4,
  interestPostingPeriodType: 4, interestCalculationType: 1,
  interestCalculationDaysInYearType: 365, minDepositAmount: 100,
  minDepositTerm: 1, minDepositTermTypeId: 3, accountingRule: 1,
  preClosurePenalApplicable: false, withHoldTax: false
});

test.describe.serial('module 02 - product setup lifecycle', () => {
  test('load product templates and reference options', async ({ request }) => {
    const paths = [
      '/loanproducts/template', '/savingsproducts/template', '/fixeddepositproducts/template',
      '/recurringdepositproducts/template', '/products/share/template', '/floatingrates', '/rates'
    ];
    for (const path of paths) await test.step(path, async () => expect(await fineract(request, 'GET', path)).toBeDefined());
  });

  test('create, retrieve, update, and list a loan product', async ({ request }) => {
    const created = await fineract(request, 'POST', '/loanproducts', loanPayload());
    state.loanProductId = created.resourceId;
    expect(state.loanProductId).toBeTruthy();
    expect((await fineract(request, 'GET', `/loanproducts/${state.loanProductId}`)).name).toBe(name('Loan Product'));
    await fineract(request, 'PUT', `/loanproducts/${state.loanProductId}`, loanPayload({ description: 'Updated isolated FinCraft loan product', principal: 1500 }));
    const saved = await fineract(request, 'GET', `/loanproducts/${state.loanProductId}`);
    expect(saved.description).toContain('Updated');
    expect(Number(saved.principal)).toBe(1500);
    expect((await fineract(request, 'GET', '/loanproducts')).some(x => x.id === state.loanProductId)).toBeTruthy();
  });

  test('reject duplicate loan-product short name', async ({ request }) => {
    const response = await raw(request, 'POST', '/loanproducts', loanPayload({ name: name('Duplicate Loan Product') }));
    expect(response.ok()).toBeFalsy();
    expect([400, 403, 409]).toContain(response.status());
  });

  test('create, retrieve, update, and list a savings product', async ({ request }) => {
    const created = await fineract(request, 'POST', '/savingsproducts', savingsPayload());
    state.savingsProductId = created.resourceId;
    expect(state.savingsProductId).toBeTruthy();
    await fineract(request, 'PUT', `/savingsproducts/${state.savingsProductId}`, savingsPayload({ description: 'Updated isolated FinCraft savings product', nominalAnnualInterestRate: 5.5 }));
    const saved = await fineract(request, 'GET', `/savingsproducts/${state.savingsProductId}`);
    expect(saved.description).toContain('Updated');
    expect(Number(saved.nominalAnnualInterestRate)).toBeCloseTo(5.5, 2);
    expect((await fineract(request, 'GET', '/savingsproducts')).some(x => x.id === state.savingsProductId)).toBeTruthy();
  });

  test('create, retrieve, and update a fixed-deposit product', async ({ request }) => {
    const body = { ...depositBase('Fixed Deposit Product'), depositAmount: 1000 };
    const created = await fineract(request, 'POST', '/fixeddepositproducts', body);
    state.fdProductId = created.resourceId;
    expect(state.fdProductId).toBeTruthy();
    await fineract(request, 'PUT', `/fixeddepositproducts/${state.fdProductId}`, { ...body, description: 'Updated isolated FinCraft FD product', nominalAnnualInterestRate: 6.5 });
    const saved = await fineract(request, 'GET', `/fixeddepositproducts/${state.fdProductId}`);
    expect(saved.description).toContain('Updated');
  });

  test('create, retrieve, and update a recurring-deposit product', async ({ request }) => {
    const body = {
      ...depositBase('Recurring Deposit Product'), recurringDepositAmount: 100,
      recurringDepositFrequency: 1, recurringDepositFrequencyTypeId: 2,
      isMandatoryDeposit: true, adjustAdvanceTowardsFuturePayments: true, allowWithdrawal: true
    };
    const created = await fineract(request, 'POST', '/recurringdepositproducts', body);
    state.rdProductId = created.resourceId;
    expect(state.rdProductId).toBeTruthy();
    await fineract(request, 'PUT', `/recurringdepositproducts/${state.rdProductId}`, { ...body, description: 'Updated isolated FinCraft RD product', recurringDepositAmount: 150 });
    const saved = await fineract(request, 'GET', `/recurringdepositproducts/${state.rdProductId}`);
    expect(saved.description).toContain('Updated');
  });

  test('product records render through the FinCraft Products module', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('products'); });
    await expect(page.locator('#contentArea')).toBeVisible();
    await expect(page.locator('#contentArea')).toContainText(/Products|Loan Products|Savings Products/i, { timeout: 30_000 });
    await expect(page.locator('#contentArea')).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('delete disposable deposit and savings products', async ({ request }) => {
    const sp = await fineract(request, 'POST', '/savingsproducts', savingsPayload({ name: name('Disposable Savings'), shortName: short('DS') }));
    await fineract(request, 'DELETE', `/savingsproducts/${sp.resourceId}`);
    const fd = await fineract(request, 'POST', '/fixeddepositproducts', { ...depositBase('Disposable Fixed Deposit'), shortName: short('DF'), depositAmount: 500 });
    await fineract(request, 'DELETE', `/fixeddepositproducts/${fd.resourceId}`);
    const rdBody = { ...depositBase('Disposable Recurring Deposit'), shortName: short('DR'), recurringDepositAmount: 50, recurringDepositFrequency: 1, recurringDepositFrequencyTypeId: 2, isMandatoryDeposit: true, adjustAdvanceTowardsFuturePayments: false, allowWithdrawal: true };
    const rd = await fineract(request, 'POST', '/recurringdepositproducts', rdBody);
    await fineract(request, 'DELETE', `/recurringdepositproducts/${rd.resourceId}`);
    for (const [path,id] of [['/savingsproducts/',sp.resourceId],['/fixeddepositproducts/',fd.resourceId],['/recurringdepositproducts/',rd.resourceId]]) {
      expect((await raw(request, 'GET', `${path}${id}`)).ok()).toBeFalsy();
    }
  });
});
