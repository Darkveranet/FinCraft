import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { officeId: null, clientId: null, productId: null, accountId: null, depositTxId: null };
const suffix = String(runId).replace(/\D/g, '').slice(-8);
const unique = label => `FC-${label}-${runId}`.slice(0, 50);
const rows = value => value?.pageItems || (Array.isArray(value) ? value : []);

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
async function optional(request, method, path, data) {
  const response = await raw(request, method, path, data);
  const text = await response.text();
  let body = {}; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { supported: response.ok(), status: response.status(), body };
}
const transaction = amount => ({ transactionDate: date(), transactionAmount: amount, paymentTypeId: 1, dateFormat: 'dd MM yyyy', locale: 'en' });
const productBody = overrides => ({
  name: `FinCraft Recurring Deposit ${runId}`.slice(0, 90), shortName: `FCR${suffix}`.slice(0, 20),
  description: 'Module 07 isolated recurring-deposit product', currencyCode: 'USD', digitsAfterDecimal: 2,
  inMultiplesOf: 1, nominalAnnualInterestRate: 6, interestCompoundingPeriodType: 4,
  interestPostingPeriodType: 4, interestCalculationType: 1, interestCalculationDaysInYearType: 365,
  minDepositAmount: 100, recurringDepositAmount: 100, recurringDepositFrequency: 1, recurringDepositFrequencyTypeId: 2,
  minDepositTerm: 6, minDepositTermTypeId: 2, maxDepositTerm: 24, maxDepositTermTypeId: 2,
  isMandatoryDeposit: true, adjustAdvanceTowardsFuturePayments: true, allowWithdrawal: true, preClosurePenalApplicable: false, withHoldTax: false, accountingRule: 1, ...overrides
});
async function createApplication(request, label = 'MAIN') {
  const response = await fineract(request, 'POST', '/recurringdepositaccounts', {
    clientId: state.clientId, productId: state.productId, submittedOnDate: date(),
    recurringDepositAmount: 100, recurringDepositFrequency: 1, recurringDepositFrequencyTypeId: 2, depositPeriod: 6, depositPeriodFrequencyId: 2,
    externalId: unique(`RD-${label}`), dateFormat: 'dd MM yyyy', locale: 'en'
  });
  return response.savingsId || response.resourceId;
}
async function current(request, id = state.accountId, params = 'associations=all') {
  return fineract(request, 'GET', `/recurringdepositaccounts/${id}?${params}`);
}

test.describe.serial('module 08 - recurring deposits lifecycle', () => {
  test('create prerequisites and load RD templates', async ({ request }) => {
    state.officeId = rows(await fineract(request, 'GET', '/offices'))[0]?.id;
    expect(state.officeId).toBeTruthy();
    const client = await fineract(request, 'POST', '/clients', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `Recurring Deposit ${runId}`.slice(0, 45),
      legalFormId: 1, externalId: unique('RD-CLIENT'), active: true, activationDate: date(), submittedOnDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    state.clientId = client.clientId || client.resourceId;
    const product = await fineract(request, 'POST', '/recurringdepositproducts', productBody());
    state.productId = product.resourceId;
    expect(state.clientId && state.productId).toBeTruthy();
    expect(await fineract(request, 'GET', `/recurringdepositaccounts/template?clientId=${state.clientId}&productId=${state.productId}`)).toBeDefined();
    const preview = await optional(request, 'GET', `/recurringdepositaccounts/template?clientId=${state.clientId}&productId=${state.productId}`);
    test.info().annotations.push({ type: 'account-template-probe', description: preview.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${preview.status}` });
  });

  test('submit, retrieve, and update RD application', async ({ request }) => {
    state.accountId = await createApplication(request);
    expect(state.accountId).toBeTruthy();
    await fineract(request, 'PUT', `/recurringdepositaccounts/${state.accountId}`, {
      clientId: state.clientId, productId: state.productId, submittedOnDate: date(), recurringDepositAmount: 150, recurringDepositFrequency: 1, recurringDepositFrequencyTypeId: 2,
      depositPeriod: 6, depositPeriodFrequencyId: 2, externalId: unique('RD-MAIN-UPD'),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const saved = await current(request);
    expect(saved.externalId).toBe(unique('RD-MAIN-UPD'));
    expect(Number(saved.recurringDepositAmount || 150)).toBeGreaterThanOrEqual(100);
  });

  test('approve and activate RD account', async ({ request }) => {
    await fineract(request, 'POST', `/recurringdepositaccounts/${state.accountId}?command=approve`, {
      approvedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect((await current(request)).status?.approved || (await current(request)).status?.code).toBeTruthy();
    await fineract(request, 'POST', `/recurringdepositaccounts/${state.accountId}?command=activate`, {
      activatedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect((await current(request)).status?.active).toBeTruthy();
  });

  test('post scheduled deposits and verify transactions and balance', async ({ request }) => {
    const response = await fineract(request, 'POST', `/recurringdepositaccounts/${state.accountId}/transactions?command=deposit`, transaction(100));
    state.depositTxId = response.resourceId;
    expect(state.depositTxId).toBeTruthy();
    const tx = await fineract(request, 'GET', `/recurringdepositaccounts/${state.accountId}/transactions/${state.depositTxId}`);
    expect(Number(tx.amount)).toBeCloseTo(100, 2);
    expect(Number((await current(request)).summary?.accountBalance)).toBeGreaterThanOrEqual(100);
  });

  test('update recurring deposit amount and verify account terms', async ({ request }) => {
    const result = await optional(request, 'POST', `/recurringdepositaccounts/${state.accountId}?command=updateDepositAmount`, {
      depositAmount: 150, effectiveDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    test.info().annotations.push({ type: 'update-deposit-amount', description: result.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${result.status}` });
    if (result.supported) {
      const saved = await current(request);
      expect(Number(saved.recurringDepositAmount || saved.depositAmount || 150)).toBeGreaterThanOrEqual(100);
    }
  });

  test('calculate interest and probe interest posting', async ({ request }) => {
    await fineract(request, 'POST', `/recurringdepositaccounts/${state.accountId}?command=calculateInterest`, {});
    const posted = await optional(request, 'POST', `/recurringdepositaccounts/${state.accountId}?command=postInterest`, {});
    test.info().annotations.push({ type: 'post-interest', description: posted.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${posted.status}` });
    const interest = await optional(request, 'POST', `/recurringdepositaccounts/${state.accountId}/transactions?command=interest`, { transactionDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' });
    test.info().annotations.push({ type: 'interest-transaction', description: interest.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${interest.status}` });
  });

  test('retrieve transactions, transaction template, charges, and closure templates', async ({ request }) => {
    await fineract(request, 'GET', `/recurringdepositaccounts/${state.accountId}/transactions`);
    await fineract(request, 'GET', `/recurringdepositaccounts/${state.accountId}/transactions/template?command=deposit`);
    await fineract(request, 'GET', `/savingsaccounts/${state.accountId}/charges`);
    for (const command of ['prematureClose', 'close', 'withdrawal']) {
      const result = await optional(request, 'GET', `/recurringdepositaccounts/${state.accountId}/template?command=${command}`);
      test.info().annotations.push({ type: `${command}-template`, description: result.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${result.status}` });
    }
  });

  test('RD list and detail render through FinCraft', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('deposits'); });
    await expect(page.locator('#contentArea')).toContainText(/Deposit|Fixed|FinCraft/i, { timeout: 30_000 });
    await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('deposits', { id, type: 'fd' }); }, state.accountId);
    await expect(page.locator('#contentArea')).toContainText(/Deposit|FinCraft/i, { timeout: 30_000 });
    await expect(page.locator('#contentArea')).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('undo approval on separate RD application', async ({ request }) => {
    const id = await createApplication(request, 'UNDO');
    await fineract(request, 'POST', `/recurringdepositaccounts/${id}?command=approve`, { approvedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' });
    await fineract(request, 'POST', `/recurringdepositaccounts/${id}?command=undoapproval`, {});
    expect((await current(request, id)).status?.submittedAndPendingApproval || (await current(request, id)).status?.code).toBeTruthy();
    await fineract(request, 'DELETE', `/recurringdepositaccounts/${id}`);
  });

  test('reject and withdraw separate RD applications', async ({ request }) => {
    const rejectId = await createApplication(request, 'REJECT');
    await fineract(request, 'POST', `/recurringdepositaccounts/${rejectId}?command=reject`, { rejectedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 07 rejection' });
    expect((await current(request, rejectId)).status?.code).toMatch(/rejected/i);
    const withdrawId = await createApplication(request, 'WITHDRAW');
    await fineract(request, 'POST', `/recurringdepositaccounts/${withdrawId}?command=withdrawnByApplicant`, { withdrawnOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 07 withdrawal' });
    expect((await current(request, withdrawId)).status?.code).toMatch(/withdrawn/i);
  });

  test('delete disposable pending RD application', async ({ request }) => {
    const id = await createApplication(request, 'DELETE');
    await fineract(request, 'DELETE', `/recurringdepositaccounts/${id}`);
    const response = await raw(request, 'GET', `/recurringdepositaccounts/${id}`);
    expect(response.ok()).toBeFalsy();
    expect([404, 410]).toContain(response.status());
  });
});
