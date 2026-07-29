import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { accounts: {}, officeId: null, currency: 'USD', journalTxId: null, ruleId: null };
const code = suffix => `FC${String(runId).replace(/\D/g, '').slice(-8)}${suffix}`.slice(0, 20);
const accountName = label => `FinCraft E2E ${label} ${runId}`.slice(0, 80);

async function raw(request, method, path, data) {
  return request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, {
    method,
    headers: {
      'Fineract-Platform-TenantId': cfg.tenant,
      Authorization: `Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    data,
    ignoreHTTPSErrors: true
  });
}

async function createAccount(request, key, type, suffix) {
  const created = await fineract(request, 'POST', '/glaccounts', {
    name: accountName(key), glCode: code(suffix), type, usage: 1,
    manualEntriesAllowed: true, description: `Isolated CI ${key}`
  });
  const id = created.resourceId;
  expect(id).toBeTruthy();
  state.accounts[key] = id;
  const saved = await fineract(request, 'GET', `/glaccounts/${id}`);
  expect(saved.name).toBe(accountName(key));
  expect(saved.manualEntriesAllowed).toBeTruthy();
}

test.describe.serial('module 01 - accounting setup lifecycle', () => {
  test('load accounting templates and reference data', async ({ request }) => {
    const [template, offices, currencies] = await Promise.all([
      fineract(request, 'GET', '/glaccounts/template'),
      fineract(request, 'GET', '/offices'),
      fineract(request, 'GET', '/currencies')
    ]);
    expect(template).toBeDefined();
    state.officeId = (offices.pageItems || offices)[0]?.id;
    expect(state.officeId).toBeTruthy();
    const currencyRows = currencies.selectedCurrencyOptions || currencies.currencyOptions || (Array.isArray(currencies) ? currencies : []);
    state.currency = currencyRows.find(x => x.code === 'USD')?.code || currencyRows[0]?.code || 'USD';
  });

  test('create all five GL account types and verify persistence', async ({ request }) => {
    await createAccount(request, 'Asset', 1, 'A');
    await createAccount(request, 'Liability', 2, 'L');
    await createAccount(request, 'Equity', 3, 'Q');
    await createAccount(request, 'Income', 4, 'I');
    await createAccount(request, 'Expense', 5, 'E');
  });

  test('update a GL account and verify list, detail, and running-balance views', async ({ request }) => {
    const id = state.accounts.Asset;
    const renamed = accountName('Asset Updated');
    await fineract(request, 'PUT', `/glaccounts/${id}`, {
      name: renamed, glCode: code('A'), type: 1, usage: 1,
      manualEntriesAllowed: true, description: 'Updated by isolated FinCraft E2E'
    });
    const saved = await fineract(request, 'GET', `/glaccounts/${id}?fetchRunningBalance=true`);
    expect(saved.name).toBe(renamed);
    const list = await fineract(request, 'GET', '/glaccounts?manualEntriesAllowed=true&usage=DETAIL&fetchRunningBalance=true');
    expect(list.some(x => x.id === id)).toBeTruthy();
  });

  test('reject duplicate GL code and retain original account', async ({ request }) => {
    const response = await raw(request, 'POST', '/glaccounts', {
      name: accountName('Duplicate'), glCode: code('A'), type: 1, usage: 1, manualEntriesAllowed: true
    });
    expect(response.ok()).toBeFalsy();
    expect([400, 403, 409]).toContain(response.status());
    expect((await fineract(request, 'GET', `/glaccounts/${state.accounts.Asset}`)).id).toBe(state.accounts.Asset);
  });

  test('create, update, retrieve, list, and delete an accounting rule', async ({ request }) => {
    const created = await fineract(request, 'POST', '/accountingrules', {
      name: accountName('Rule'), officeId: state.officeId,
      accountToDebit: state.accounts.Expense, accountToCredit: state.accounts.Asset,
      description: 'FinCraft isolated rule'
    });
    state.ruleId = created.resourceId;
    expect(state.ruleId).toBeTruthy();
    await fineract(request, 'PUT', `/accountingrules/${state.ruleId}`, {
      name: accountName('Rule Updated'), officeId: state.officeId,
      accountToDebit: state.accounts.Expense, accountToCredit: state.accounts.Asset,
      description: 'Updated FinCraft isolated rule'
    });
    const saved = await fineract(request, 'GET', `/accountingrules/${state.ruleId}`);
    expect(saved.name).toBe(accountName('Rule Updated'));
    const rules = await fineract(request, 'GET', '/accountingrules');
    expect(rules.some(x => x.id === state.ruleId)).toBeTruthy();
    await fineract(request, 'DELETE', `/accountingrules/${state.ruleId}`);
    state.ruleId = null;
  });

  test('post a balanced manual journal and verify both ledger sides', async ({ request }) => {
    const amount = 125.75;
    const response = await fineract(request, 'POST', '/journalentries', {
      officeId: state.officeId, currencyCode: state.currency, transactionDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en', referenceNumber: `FC-JE-${runId}`.slice(0, 50),
      comments: 'FinCraft isolated balanced journal',
      debits: [{ glAccountId: state.accounts.Expense, amount }],
      credits: [{ glAccountId: state.accounts.Asset, amount }]
    });
    state.journalTxId = response.transactionId || response.resourceId;
    expect(state.journalTxId).toBeTruthy();
    const entries = await fineract(request, 'GET', `/journalentries?transactionId=${encodeURIComponent(state.journalTxId)}&manualEntriesOnly=true`);
    const rows = entries.pageItems || entries;
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.filter(x => x.reversed !== true).reduce((n, x) => n + Number(x.amount || 0), 0)).toBeCloseTo(amount * 2, 2);
    expect(new Set(rows.map(x => x.entryType?.id)).size).toBeGreaterThanOrEqual(2);
  });

  test('reject an unbalanced manual journal', async ({ request }) => {
    const response = await raw(request, 'POST', '/journalentries', {
      officeId: state.officeId, currencyCode: state.currency, transactionDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en',
      debits: [{ glAccountId: state.accounts.Expense, amount: 10 }],
      credits: [{ glAccountId: state.accounts.Asset, amount: 9 }]
    });
    expect(response.ok()).toBeFalsy();
    expect([400, 403, 422]).toContain(response.status());
  });

  test('reverse the manual journal and verify reversal state', async ({ request }) => {
    await fineract(request, 'POST', `/journalentries/${encodeURIComponent(state.journalTxId)}?command=reverse`, {
      reversalDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', comments: 'FinCraft isolated reversal'
    });
    const entries = await fineract(request, 'GET', `/journalentries?transactionId=${encodeURIComponent(state.journalTxId)}`);
    const rows = entries.pageItems || entries;
    expect(rows.some(x => x.reversed === true || x.reversalId)).toBeTruthy();
  });

  test('accounting data renders in FinCraft', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('accounting'); });
    await expect(page.locator('#contentArea')).toBeVisible();
    await expect(page.locator('#contentArea')).toContainText(/Accounting|Chart of Accounts|Journal/i, { timeout: 30_000 });
    await expect(page.locator('#contentArea')).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('delete a never-used GL account and verify it leaves the chart', async ({ request }) => {
    const created = await fineract(request, 'POST', '/glaccounts', {
      name: accountName('Disposable'), glCode: code('D'), type: 5, usage: 1, manualEntriesAllowed: true
    });
    await fineract(request, 'DELETE', `/glaccounts/${created.resourceId}`);
    const response = await raw(request, 'GET', `/glaccounts/${created.resourceId}`);
    expect(response.ok()).toBeFalsy();
    expect([404, 410]).toContain(response.status());
  });
});
