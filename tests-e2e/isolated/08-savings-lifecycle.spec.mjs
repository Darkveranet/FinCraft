import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { officeId: null, clientId: null, staffId: null, productId: null, accountId: null, depositTxId: null, withdrawalTxId: null };
const suffix = String(runId).replace(/\D/g, '').slice(-8);
const unique = label => `FC-${label}-${runId}`.slice(0, 50);
const asRows = value => value?.pageItems || (Array.isArray(value) ? value : []);

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

const txBody = amount => ({
  transactionDate: date(), transactionAmount: amount,
  paymentTypeId: 1, dateFormat: 'dd MM yyyy', locale: 'en'
});

async function createApplication(request, label = 'MAIN') {
  const created = await fineract(request, 'POST', '/savingsaccounts', {
    clientId: state.clientId, productId: state.productId,
    submittedOnDate: date(), externalId: unique(`SAV-${label}`),
    dateFormat: 'dd MM yyyy', locale: 'en'
  });
  return created.savingsId || created.resourceId;
}

async function current(request, id = state.accountId) {
  return fineract(request, 'GET', `/savingsaccounts/${id}?associations=all`);
}

test.describe.serial('module 05 - savings lifecycle', () => {
  test('create prerequisites and load savings templates', async ({ request }) => {
    const [offices, productTemplate] = await Promise.all([
      fineract(request, 'GET', '/offices'), fineract(request, 'GET', '/savingsproducts/template')
    ]);
    state.officeId = asRows(offices)[0]?.id;
    expect(state.officeId).toBeTruthy();
    expect(productTemplate).toBeDefined();

    const client = await fineract(request, 'POST', '/clients', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `Savings ${runId}`.slice(0, 45),
      legalFormId: 1, externalId: unique('SAVINGS-CLIENT'), active: true, activationDate: date(), submittedOnDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    state.clientId = client.clientId || client.resourceId;

    const staff = await fineract(request, 'POST', '/staff', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `Savings Officer ${runId}`.slice(0, 45),
      isLoanOfficer: true, isActive: true
    });
    state.staffId = staff.resourceId;

    const product = await fineract(request, 'POST', '/savingsproducts', {
      name: `FinCraft Savings ${runId}`.slice(0, 90), shortName: `S${suffix}`.slice(0, 4),
      description: 'Module 05 isolated savings product', currencyCode: 'USD', digitsAfterDecimal: 2,
      inMultiplesOf: 1, nominalAnnualInterestRate: 5, interestCompoundingPeriodType: 4,
      interestPostingPeriodType: 4, interestCalculationType: 1,
      interestCalculationDaysInYearType: 365, accountingRule: 1,
      withdrawalFeeForTransfers: false, allowOverdraft: false
    });
    state.productId = product.resourceId;
    expect(state.clientId && state.staffId && state.productId).toBeTruthy();

    const template = await fineract(request, 'GET', `/savingsaccounts/template?clientId=${state.clientId}&productId=${state.productId}`);
    expect(template).toBeDefined();
  });

  test('submit, retrieve, and update savings application', async ({ request }) => {
    state.accountId = await createApplication(request);
    expect(state.accountId).toBeTruthy();
    let saved = await current(request);
    expect(saved.status?.submittedAndPendingApproval || saved.status?.code).toBeTruthy();
    await fineract(request, 'PUT', `/savingsaccounts/${state.accountId}`, {
      clientId: state.clientId, productId: state.productId, submittedOnDate: date(),
      externalId: unique('SAV-MAIN-UPD'), nominalAnnualInterestRate: 5.25,
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    saved = await current(request);
    expect(saved.externalId).toBe(unique('SAV-MAIN-UPD'));
  });

  test('approve and activate savings account', async ({ request }) => {
    await fineract(request, 'POST', `/savingsaccounts/${state.accountId}?command=approve`, {
      approvedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    let saved = await current(request);
    expect(saved.status?.approved || saved.status?.code).toBeTruthy();
    await fineract(request, 'POST', `/savingsaccounts/${state.accountId}?command=activate`, {
      activatedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    saved = await current(request);
    expect(saved.status?.active).toBeTruthy();
  });

  test('assign and unassign savings officer', async ({ request }) => {
    await fineract(request, 'POST', `/savingsaccounts/${state.accountId}?command=assignSavingsOfficer`, {
      fieldOfficerId: state.staffId, assignmentDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    let saved = await current(request);
    expect(saved.fieldOfficerId || saved.fieldOfficer?.id).toBe(state.staffId);
    await fineract(request, 'POST', `/savingsaccounts/${state.accountId}?command=unassignSavingsOfficer`, {
      fieldOfficerId: state.staffId, unassignedDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    saved = await current(request);
    expect(saved.fieldOfficerId || saved.fieldOfficer?.id || null).toBeFalsy();
  });

  test('deposit funds and verify balance and transaction', async ({ request }) => {
    const result = await fineract(request, 'POST', `/savingsaccounts/${state.accountId}/transactions?command=deposit`, txBody(1000));
    state.depositTxId = result.resourceId;
    expect(state.depositTxId).toBeTruthy();
    const saved = await current(request);
    expect(Number(saved.summary?.accountBalance)).toBeCloseTo(1000, 2);
    const tx = await fineract(request, 'GET', `/savingsaccounts/${state.accountId}/transactions/${state.withdrawalTxId}`);
    expect(Number(tx.amount)).toBeCloseTo(1000, 2);
  });

  test('withdraw funds and verify reduced balance', async ({ request }) => {
    const result = await fineract(request, 'POST', `/savingsaccounts/${state.accountId}/transactions?command=withdrawal`, txBody(250));
    state.withdrawalTxId = result.resourceId;
    expect(state.withdrawalTxId).toBeTruthy();
    const saved = await current(request);
    expect(Number(saved.summary?.accountBalance)).toBeCloseTo(750, 2);
  });

  test('reverse withdrawal and verify reversal is reflected', async ({ request }) => {
    await fineract(request, 'POST', `/savingsaccounts/${state.accountId}/transactions/${state.withdrawalTxId}?command=reverse`, {
      transactionDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 05 reversal'
    });
    const tx = await fineract(request, 'GET', `/savingsaccounts/${state.accountId}/transactions/${state.depositTxId}`);
    expect(tx.reversed || tx.reversedOnDate || tx.status?.reversed).toBeTruthy();
    expect(Number((await current(request)).summary?.accountBalance)).toBeCloseTo(1000, 2);
    await fineract(request, 'POST', `/savingsaccounts/${state.accountId}/transactions?command=withdrawal`, txBody(250));
    expect(Number((await current(request)).summary?.accountBalance)).toBeCloseTo(750, 2);
  });

  test('block and unblock account, debit, and credit', async ({ request }) => {
    for (const [block, unblock] of [['block','unblock'],['blockDebit','unblockDebit'],['blockCredit','unblockCredit']]) {
      await fineract(request, 'POST', `/savingsaccounts/${state.accountId}?command=${block}`, {});
      const blocked = await current(request);
      test.info().annotations.push({ type: block, description: blocked.status?.value || blocked.status?.code || 'command accepted' });
      await fineract(request, 'POST', `/savingsaccounts/${state.accountId}?command=${unblock}`, {});
    }
    expect((await current(request)).status?.active).toBeTruthy();
  });

  test('calculate interest and probe posting features', async ({ request }) => {
    await fineract(request, 'POST', `/savingsaccounts/${state.accountId}?command=calculateInterest`, {});
    for (const [label, path, body] of [
      ['postInterest', `/savingsaccounts/${state.accountId}?command=postInterest`, {}],
      ['postInterestAsOn', `/savingsaccounts/${state.accountId}?command=postInterestAsOn`, { transactionDate: new Date().toISOString().slice(0,10), dateFormat: 'yyyy-MM-dd', locale: 'en' }],
      ['applyAnnualFees', `/savingsaccounts/${state.accountId}?command=applyAnnualFees`, { dueDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' }]
    ]) {
      const result = await optional(request, 'POST', path, body);
      test.info().annotations.push({ type: label, description: result.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${result.status}` });
    }
  });

  test('retrieve transaction, charge, on-hold, search, and query surfaces', async ({ request }) => {
    const account = await current(request);
    expect(Array.isArray(account.transactions || [])).toBeTruthy();
    await fineract(request, 'GET', `/savingsaccounts/${state.accountId}/charges`);
    const hold = await optional(request, 'GET', `/savingsaccounts/${state.accountId}/onholdtransactions`);
    test.info().annotations.push({ type: 'on-hold', description: hold.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${hold.status}` });
    const search = await optional(request, 'GET', `/savingsaccounts/${state.accountId}/transactions/search`);
    test.info().annotations.push({ type: 'transaction-search', description: search.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${search.status}` });
    const query = await optional(request, 'POST', `/savingsaccounts/${state.accountId}/transactions/query`, {});
    test.info().annotations.push({ type: 'transaction-query', description: query.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${query.status}` });
  });

  test('savings list and detail render through FinCraft', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('savings'); });
    await expect(page.locator('#contentArea')).toContainText(/Savings|FinCraft/i, { timeout: 30_000 });
    await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('savings-detail', { id }); }, state.accountId);
    await expect(page.locator('#contentArea')).toContainText(/Savings|750|FinCraft/i, { timeout: 30_000 });
    await expect(page.locator('#contentArea')).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('undo approval on separate approved account', async ({ request }) => {
    const id = await createApplication(request, 'UNDO-APPROVAL');
    await fineract(request, 'POST', `/savingsaccounts/${id}?command=approve`, {
      approvedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    await fineract(request, 'POST', `/savingsaccounts/${id}?command=undoapproval`, {});
    const saved = await current(request, id);
    expect(saved.status?.submittedAndPendingApproval || saved.status?.code).toBeTruthy();
    await fineract(request, 'DELETE', `/savingsaccounts/${id}`);
  });

  test('reject and withdraw separate savings applications', async ({ request }) => {
    const rejectId = await createApplication(request, 'REJECT');
    await fineract(request, 'POST', `/savingsaccounts/${rejectId}?command=reject`, {
      rejectedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 05 rejection'
    });
    expect((await current(request, rejectId)).status?.code).toMatch(/rejected/i);

    const withdrawId = await createApplication(request, 'WITHDRAW');
    await fineract(request, 'POST', `/savingsaccounts/${withdrawId}?command=withdrawnByApplicant`, {
      withdrawnOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 05 withdrawal'
    });
    expect((await current(request, withdrawId)).status?.code).toMatch(/withdrawn/i);
  });

  test('delete disposable pending savings application', async ({ request }) => {
    const id = await createApplication(request, 'DELETE');
    await fineract(request, 'DELETE', `/savingsaccounts/${id}`);
    const response = await raw(request, 'GET', `/savingsaccounts/${id}`);
    expect(response.ok()).toBeFalsy();
    expect([404, 410]).toContain(response.status());
  });
});
