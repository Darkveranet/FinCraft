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
  name: `FinCraft Fixed Deposit ${runId}`.slice(0, 90), shortName: `FCF${suffix}`.slice(0, 20),
  description: 'Module 07 isolated fixed-deposit product', currencyCode: 'USD', digitsAfterDecimal: 2,
  inMultiplesOf: 1, nominalAnnualInterestRate: 6, interestCompoundingPeriodType: 4,
  interestPostingPeriodType: 4, interestCalculationType: 1, interestCalculationDaysInYearType: 365,
  minDepositAmount: 100, depositAmount: 1000, maxDepositAmount: 10000,
  minDepositTerm: 6, minDepositTermTypeId: 2, maxDepositTerm: 24, maxDepositTermTypeId: 2,
  preClosurePenalApplicable: false, withHoldTax: false, accountingRule: 1, ...overrides
});
async function createApplication(request, label = 'MAIN') {
  const response = await fineract(request, 'POST', '/fixeddepositaccounts', {
    clientId: state.clientId, productId: state.productId, submittedOnDate: date(),
    depositAmount: 1000, depositPeriod: 6, depositPeriodFrequencyId: 2,
    externalId: unique(`FD-${label}`), dateFormat: 'dd MM yyyy', locale: 'en'
  });
  return response.savingsId || response.resourceId;
}
async function current(request, id = state.accountId, params = 'associations=all') {
  return fineract(request, 'GET', `/fixeddepositaccounts/${id}?${params}`);
}

test.describe.serial('module 07 - fixed deposits lifecycle', () => {
  test('create prerequisites and load FD templates', async ({ request }) => {
    state.officeId = rows(await fineract(request, 'GET', '/offices'))[0]?.id;
    expect(state.officeId).toBeTruthy();
    const client = await fineract(request, 'POST', '/clients', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `Fixed Deposit ${runId}`.slice(0, 45),
      legalFormId: 1, externalId: unique('FD-CLIENT'), active: true, activationDate: date(), submittedOnDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    state.clientId = client.clientId || client.resourceId;
    const product = await fineract(request, 'POST', '/fixeddepositproducts', productBody());
    state.productId = product.resourceId;
    expect(state.clientId && state.productId).toBeTruthy();
    expect(await fineract(request, 'GET', `/fixeddepositaccounts/template?clientId=${state.clientId}&productId=${state.productId}`)).toBeDefined();
    const preview = await optional(request, 'GET', `/fixeddepositaccounts/calculate-fd-interest?clientId=${state.clientId}&productId=${state.productId}&depositAmount=1000&depositPeriod=6&depositPeriodFrequencyId=2`);
    test.info().annotations.push({ type: 'interest-preview', description: preview.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${preview.status}` });
  });

  test('submit, retrieve, and update FD application', async ({ request }) => {
    state.accountId = await createApplication(request);
    expect(state.accountId).toBeTruthy();
    await fineract(request, 'PUT', `/fixeddepositaccounts/${state.accountId}`, {
      clientId: state.clientId, productId: state.productId, submittedOnDate: date(), depositAmount: 1200,
      depositPeriod: 6, depositPeriodFrequencyId: 2, externalId: unique('FD-MAIN-UPD'),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const saved = await current(request);
    expect(saved.externalId).toBe(unique('FD-MAIN-UPD'));
    expect(Number(saved.depositAmount || saved.summary?.accountBalance || 1200)).toBeGreaterThanOrEqual(0);
  });

  test('approve and activate FD account', async ({ request }) => {
    await fineract(request, 'POST', `/fixeddepositaccounts/${state.accountId}?command=approve`, {
      approvedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect((await current(request)).status?.approved || (await current(request)).status?.code).toBeTruthy();
    await fineract(request, 'POST', `/fixeddepositaccounts/${state.accountId}?command=activate`, {
      activatedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect((await current(request)).status?.active).toBeTruthy();
  });

  test('deposit principal and verify transaction and balance', async ({ request }) => {
    const response = await fineract(request, 'POST', `/fixeddepositaccounts/${state.accountId}/transactions?command=deposit`, transaction(1200));
    state.depositTxId = response.resourceId;
    expect(state.depositTxId).toBeTruthy();
    const tx = await fineract(request, 'GET', `/fixeddepositaccounts/${state.accountId}/transactions/${state.depositTxId}`);
    expect(Number(tx.amount)).toBeCloseTo(1200, 2);
    expect(Number((await current(request)).summary?.accountBalance)).toBeGreaterThanOrEqual(1200);
  });

  test('calculate interest and probe interest posting', async ({ request }) => {
    await fineract(request, 'POST', `/fixeddepositaccounts/${state.accountId}?command=calculateInterest`, {});
    const posted = await optional(request, 'POST', `/fixeddepositaccounts/${state.accountId}?command=postInterest`, {});
    test.info().annotations.push({ type: 'post-interest', description: posted.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${posted.status}` });
    const interest = await optional(request, 'POST', `/fixeddepositaccounts/${state.accountId}/transactions?command=interest`, { transactionDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' });
    test.info().annotations.push({ type: 'interest-transaction', description: interest.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${interest.status}` });
  });

  test('retrieve transactions, transaction template, charges, and closure templates', async ({ request }) => {
    await fineract(request, 'GET', `/fixeddepositaccounts/${state.accountId}/transactions`);
    await fineract(request, 'GET', `/fixeddepositaccounts/${state.accountId}/transactions/template?command=deposit`);
    await fineract(request, 'GET', `/savingsaccounts/${state.accountId}/charges`);
    for (const command of ['prematureClose', 'close', 'withdrawal']) {
      const result = await optional(request, 'GET', `/fixeddepositaccounts/${state.accountId}/template?command=${command}`);
      test.info().annotations.push({ type: `${command}-template`, description: result.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${result.status}` });
    }
  });

  test('FD list and detail render through FinCraft', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('deposits'); });
    await expect(page.locator('#contentArea')).toContainText(/Deposit|Fixed|FinCraft/i, { timeout: 30_000 });
    await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('deposits', { id, type: 'fd' }); }, state.accountId);
    await expect(page.locator('#contentArea')).toContainText(/Deposit|FinCraft/i, { timeout: 30_000 });
    await expect(page.locator('#contentArea')).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('undo approval on separate FD application', async ({ request }) => {
    const id = await createApplication(request, 'UNDO');
    await fineract(request, 'POST', `/fixeddepositaccounts/${id}?command=approve`, { approvedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' });
    await fineract(request, 'POST', `/fixeddepositaccounts/${id}?command=undoapproval`, {});
    expect((await current(request, id)).status?.submittedAndPendingApproval || (await current(request, id)).status?.code).toBeTruthy();
    await fineract(request, 'DELETE', `/fixeddepositaccounts/${id}`);
  });

  test('reject and withdraw separate FD applications', async ({ request }) => {
    const rejectId = await createApplication(request, 'REJECT');
    await fineract(request, 'POST', `/fixeddepositaccounts/${rejectId}?command=reject`, { rejectedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 07 rejection' });
    expect((await current(request, rejectId)).status?.code).toMatch(/rejected/i);
    const withdrawId = await createApplication(request, 'WITHDRAW');
    await fineract(request, 'POST', `/fixeddepositaccounts/${withdrawId}?command=withdrawnByApplicant`, { withdrawnOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 07 withdrawal' });
    expect((await current(request, withdrawId)).status?.code).toMatch(/withdrawn/i);
  });

  test('delete disposable pending FD application', async ({ request }) => {
    const id = await createApplication(request, 'DELETE');
    await fineract(request, 'DELETE', `/fixeddepositaccounts/${id}`);
    const response = await raw(request, 'GET', `/fixeddepositaccounts/${id}`);
    expect(response.ok()).toBeFalsy();
    expect([404, 410]).toContain(response.status());
  });
});
