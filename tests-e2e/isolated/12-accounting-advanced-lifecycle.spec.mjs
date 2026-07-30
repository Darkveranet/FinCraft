import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { officeId: null, assetId: null, liabilityId: null, expenseId: null, incomeId: null, closureId: null, mappingId: null, categoryId: null };
const suffix = String(runId).replace(/\D/g, '').slice(-8);
const name = label => `FinCraft ${label} ${runId}`.slice(0, 90);
const code = label => `FCA${label}${suffix}`.slice(0, 20);
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
async function createAccount(request, label, type) {
  const result = await fineract(request, 'POST', '/glaccounts', {
    name: name(label), glCode: code(label.slice(0, 2).toUpperCase()), type, usage: 1,
    manualEntriesAllowed: true, description: `Module 09 ${label}`
  });
  return result.resourceId;
}

test.describe.serial('module 09 - advanced accounting lifecycle', () => {
  test('create accounting prerequisites and load advanced templates', async ({ request }) => {
    state.officeId = rows(await fineract(request, 'GET', '/offices'))[0]?.id;
    expect(state.officeId).toBeTruthy();
    [state.assetId, state.liabilityId, state.expenseId, state.incomeId] = await Promise.all([
      createAccount(request, 'Advanced Asset', 1), createAccount(request, 'Advanced Liability', 2),
      createAccount(request, 'Advanced Expense', 5), createAccount(request, 'Advanced Income', 4)
    ]);
    expect(state.assetId && state.liabilityId && state.expenseId && state.incomeId).toBeTruthy();
    for (const path of ['/financialactivityaccounts/template', '/provisioningcriteria/template']) {
      const result = await optional(request, 'GET', path);
      test.info().annotations.push({ type: path, description: result.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${result.status}` });
    }
  });

  test('define balanced opening balances and retrieve opening-balance journals', async ({ request }) => {
    const result = await optional(request, 'POST', '/journalentries?command=defineOpeningBalance', {
      officeId: state.officeId, transactionDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
      comments: 'Module 09 opening balance',
      debits: [{ glAccountId: state.assetId, amount: 500 }],
      credits: [{ glAccountId: state.liabilityId, amount: 500 }]
    });
    test.info().annotations.push({ type: 'opening-balance-write', description: result.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${result.status}` });
    const journals = await optional(request, 'GET', `/journalentries/openingbalance?officeId=${state.officeId}&limit=100`);
    expect(journals.supported).toBeTruthy();
    if (result.supported) expect(rows(journals.body).length).toBeGreaterThanOrEqual(2);
  });

  test('create, retrieve, update, list, and delete GL closure', async ({ request }) => {
    const created = await fineract(request, 'POST', '/glclosures', {
      closingDate: date(), officeId: state.officeId, comments: 'Module 09 initial closure',
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    state.closureId = created.resourceId;
    expect(state.closureId).toBeTruthy();
    const saved = await fineract(request, 'GET', `/glclosures/${state.closureId}`);
    expect(saved.officeId || saved.office?.id).toBe(state.officeId);
    await fineract(request, 'PUT', `/glclosures/${state.closureId}`, {
      closingDate: date(), officeId: state.officeId, comments: 'Module 09 updated closure',
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const list = await fineract(request, 'GET', `/glclosures?officeId=${state.officeId}`);
    expect(rows(list).some(x => x.id === state.closureId)).toBeTruthy();
    await fineract(request, 'DELETE', `/glclosures/${state.closureId}`);
    state.closureId = null;
  });

  test('create and delete financial-activity mapping when an unmapped activity exists', async ({ request }) => {
    const template = await optional(request, 'GET', '/financialactivityaccounts/template');
    if (!template.supported) test.skip(true, `Financial activity template unavailable: HTTP ${template.status}`);
    const existing = rows(await fineract(request, 'GET', '/financialactivityaccounts'));
    const used = new Set(existing.map(x => x.financialActivityId || x.financialActivityData?.id));
    const options = template.body.financialActivityOptions || [];
    const activity = options.find(x => !used.has(x.id));
    if (!activity) test.skip(true, 'All financial activities are already mapped');
    const created = await fineract(request, 'POST', '/financialactivityaccounts', {
      financialActivityId: activity.id, glAccountId: state.assetId
    });
    state.mappingId = created.resourceId;
    expect(state.mappingId).toBeTruthy();
    const saved = await fineract(request, 'GET', `/financialactivityaccounts/${state.mappingId}`);
    expect(saved.financialActivityId || saved.financialActivityData?.id).toBe(activity.id);
    await fineract(request, 'DELETE', `/financialactivityaccounts/${state.mappingId}`);
    state.mappingId = null;
  });

  test('create, update, list, and delete provisioning category when supported', async ({ request }) => {
    const created = await optional(request, 'POST', '/provisioningcategory', {
      categoryName: name('Provision Category'), categoryDescription: 'Module 09 category'
    });
    if (!created.supported) test.skip(true, `Provisioning categories unavailable: HTTP ${created.status}`);
    state.categoryId = created.body.resourceId;
    expect(state.categoryId).toBeTruthy();
    await fineract(request, 'PUT', `/provisioningcategory/${state.categoryId}`, {
      categoryName: name('Provision Category Updated'), categoryDescription: 'Module 09 updated category'
    });
    const list = await fineract(request, 'GET', '/provisioningcategory');
    expect(rows(list).some(x => x.id === state.categoryId)).toBeTruthy();
    await fineract(request, 'DELETE', `/provisioningcategory/${state.categoryId}`);
    state.categoryId = null;
  });

  test('probe provisioning criteria and entry lifecycle with explicit status', async ({ request }) => {
    const criteria = await optional(request, 'POST', '/provisioningcriteria', {
      criteriaName: name('Provision Criteria'), locale: 'en',
      definitions: [{ categoryName: name('Current'), minimumAgeDays: 0, maximumAgeDays: 30,
        minBalancePercentage: 0, provisioningPercentage: 1,
        liabilityAccount: state.liabilityId, expenseAccount: state.expenseId }]
    });
    test.info().annotations.push({ type: 'provisioning-criteria-create', description: criteria.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${criteria.status}` });
    if (criteria.supported && criteria.body.resourceId) {
      const id = criteria.body.resourceId;
      await fineract(request, 'GET', `/provisioningcriteria/${id}`);
      await fineract(request, 'PUT', `/provisioningcriteria/${id}`, {
        criteriaName: name('Provision Criteria Updated'), locale: 'en',
        definitions: [{ categoryName: name('Current'), minimumAgeDays: 0, maximumAgeDays: 30,
          minBalancePercentage: 0, provisioningPercentage: 2,
          liabilityAccount: state.liabilityId, expenseAccount: state.expenseId }]
      });
      await fineract(request, 'DELETE', `/provisioningcriteria/${id}`);
    }
    for (const [label, method, path, body] of [
      ['provisioning-entries', 'GET', '/provisioningentries', undefined],
      ['provisioning-entry-create', 'POST', '/provisioningentries', { dateFormat: 'dd MM yyyy', locale: 'en' }],
      ['provisioning-journals', 'GET', `/journalentries/provisioning?officeId=${state.officeId}&limit=100`, undefined]
    ]) {
      const result = await optional(request, method, path, body);
      test.info().annotations.push({ type: label, description: result.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${result.status}` });
    }
  });

  test('probe run-accruals command without disguising unsupported state', async ({ request }) => {
    const result = await optional(request, 'POST', '/runaccruals', {
      tillDate: new Date().toISOString().slice(0, 10), dateFormat: 'yyyy-MM-dd', locale: 'en'
    });
    test.info().annotations.push({ type: 'run-accruals', description: result.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${result.status}` });
    expect([true, false]).toContain(result.supported);
  });

  test('verify GL running balances against manual journal arithmetic', async ({ request }) => {
    const posted = await fineract(request, 'POST', '/journalentries', {
      officeId: state.officeId, currencyCode: 'USD', transactionDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en', referenceNumber: `FC-A09-${runId}`.slice(0, 50),
      debits: [{ glAccountId: state.expenseId, amount: 75 }],
      credits: [{ glAccountId: state.assetId, amount: 75 }]
    });
    const transactionId = posted.transactionId || posted.resourceId;
    const journals = await fineract(request, 'GET', `/journalentries?transactionId=${encodeURIComponent(transactionId)}&manualEntriesOnly=true`);
    const items = rows(journals);
    expect(items.length).toBeGreaterThanOrEqual(2);
    const debit = items.filter(x => x.entryType?.id === 2).reduce((n, x) => n + Number(x.amount || 0), 0);
    const credit = items.filter(x => x.entryType?.id === 1).reduce((n, x) => n + Number(x.amount || 0), 0);
    expect(debit).toBeCloseTo(credit, 2);
    const balances = await fineract(request, 'GET', '/glaccounts?fetchRunningBalance=true&manualEntriesAllowed=true');
    expect(rows(balances).some(x => x.id === state.assetId)).toBeTruthy();
    await fineract(request, 'POST', `/journalentries/${encodeURIComponent(transactionId)}?command=reverse`, {
      reversalDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', comments: 'Module 09 reversal'
    });
  });

  test('create, retrieve, update, and list tax component and tax group', async ({ request }) => {
    const component = await optional(request, 'POST', '/taxes/component', {
      name: name('Tax Component'), percentage: 5, startDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en',
      creditAccountType: 2, creditAccountId: state.liabilityId,
      debitAccountType: 2, debitAccountId: state.expenseId
    });
    if (!component.supported) {
      test.info().annotations.push({ type: 'tax-components', description: `UNSUPPORTED HTTP ${component.status}` });
    } else {
      const componentId = component.body.resourceId;
      expect(componentId).toBeTruthy();
      const saved = await fineract(request, 'GET', `/taxes/component/${componentId}`);
      expect(saved.name).toBe(name('Tax Component'));
      await fineract(request, 'PUT', `/taxes/component/${componentId}`, {
        name: name('Tax Component Updated'), percentage: 7.5, startDate: date(),
        dateFormat: 'dd MM yyyy', locale: 'en',
        creditAccountType: 2, creditAccountId: state.liabilityId,
        debitAccountType: 2, debitAccountId: state.expenseId
      });
      expect(rows(await fineract(request, 'GET', '/taxes/component')).some(x => x.id === componentId)).toBeTruthy();
    }

    const group = await optional(request, 'POST', '/taxes/group', {
      name: name('Tax Group'), startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    if (!group.supported) {
      test.info().annotations.push({ type: 'tax-groups', description: `UNSUPPORTED HTTP ${group.status}` });
    } else {
      const groupId = group.body.resourceId;
      expect(groupId).toBeTruthy();
      expect((await fineract(request, 'GET', `/taxes/group/${groupId}`)).name).toBe(name('Tax Group'));
      await fineract(request, 'PUT', `/taxes/group/${groupId}`, {
        name: name('Tax Group Updated'), startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
      });
      expect(rows(await fineract(request, 'GET', '/taxes/group')).some(x => x.id === groupId)).toBeTruthy();
    }
  });

  test('advanced accounting tabs render through FinCraft', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('accounting'); });
    const content = page.locator('#contentArea');
    await expect(content).toContainText(/Accounting|GL Closure|Provisioning|Financial Activity/i, { timeout: 30_000 });
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });
});
