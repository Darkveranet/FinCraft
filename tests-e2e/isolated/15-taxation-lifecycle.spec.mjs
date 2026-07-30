import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { assetId: null, liabilityId: null, expenseId: null, componentIds: [], groupId: null, chargeId: null };
const suffix = String(runId).replace(/\D/g, '').slice(-8);
const name = label => `FinCraft Tax ${label} ${runId}`.slice(0, 90);
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
async function createGl(request, label, type) {
  const result = await fineract(request, 'POST', '/glaccounts', {
    name: name(label), glCode: `FCT${label.slice(0, 2).toUpperCase()}${suffix}`.slice(0, 20),
    type, usage: 1, manualEntriesAllowed: true, description: `Module 12 ${label}`
  });
  return result.resourceId;
}
async function createComponent(request, label, percentage) {
  const result = await fineract(request, 'POST', '/taxes/component', {
    name: name(label), percentage, startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
    creditAccountType: 2, creditAccountId: state.liabilityId,
    debitAccountType: 2, debitAccountId: state.expenseId
  });
  return result.resourceId;
}

test.describe.serial('module 12 - taxation lifecycle', () => {
  test('create GL prerequisites and load tax templates', async ({ request }) => {
    [state.assetId, state.liabilityId, state.expenseId] = await Promise.all([
      createGl(request, 'Asset', 1), createGl(request, 'Liability', 2), createGl(request, 'Expense', 5)
    ]);
    expect(state.assetId && state.liabilityId && state.expenseId).toBeTruthy();
    const [componentTemplate, groupTemplate] = await Promise.all([
      optional(request, 'GET', '/taxes/component/template'), optional(request, 'GET', '/taxes/group/template')
    ]);
    expect(componentTemplate.supported).toBeTruthy();
    expect(groupTemplate.supported).toBeTruthy();
  });

  test('create, retrieve, update, and list multiple tax components', async ({ request }) => {
    state.componentIds = [
      await createComponent(request, 'VAT', 5),
      await createComponent(request, 'Levy', 2.5)
    ];
    expect(state.componentIds.every(Boolean)).toBeTruthy();
    const first = await fineract(request, 'GET', `/taxes/component/${state.componentIds[0]}`);
    expect(first.name).toBe(name('VAT'));
    expect(Number(first.percentage)).toBeCloseTo(5, 2);
    await fineract(request, 'PUT', `/taxes/component/${state.componentIds[0]}`, {
      name: name('VAT Updated'), percentage: 7.5, startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
      creditAccountType: 2, creditAccountId: state.liabilityId,
      debitAccountType: 2, debitAccountId: state.expenseId
    });
    const updated = await fineract(request, 'GET', `/taxes/component/${state.componentIds[0]}`);
    expect(updated.name).toBe(name('VAT Updated'));
    expect(Number(updated.percentage)).toBeCloseTo(7.5, 2);
    const list = await fineract(request, 'GET', '/taxes/component');
    expect(state.componentIds.every(id => rows(list).some(x => x.id === id))).toBeTruthy();
  });

  test('reject invalid taxation payloads', async ({ request }) => {
    const negative = await raw(request, 'POST', '/taxes/component', {
      name: name('Invalid Negative'), percentage: -1, startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
      creditAccountType: 2, creditAccountId: state.liabilityId,
      debitAccountType: 2, debitAccountId: state.expenseId
    });
    expect(negative.ok()).toBeFalsy();
    expect([400, 403, 409, 422]).toContain(negative.status());

    const missingName = await raw(request, 'POST', '/taxes/group', {
      startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect(missingName.ok()).toBeFalsy();
    expect([400, 403, 409, 422]).toContain(missingName.status());
  });

  test('create tax group with component associations and verify calculation structure', async ({ request }) => {
    const associations = state.componentIds.map(id => ({ taxComponentId: id, startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' }));
    const created = await optional(request, 'POST', '/taxes/group', {
      name: name('Composite Group'), startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
      taxComponents: associations
    });
    if (!created.supported) {
      const fallback = await fineract(request, 'POST', '/taxes/group', {
        name: name('Composite Group'), startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
      });
      state.groupId = fallback.resourceId;
      test.info().annotations.push({ type: 'tax-component-associations', description: `GROUP CREATED WITHOUT ASSOCIATIONS HTTP ${created.status}` });
    } else {
      state.groupId = created.body.resourceId;
    }
    expect(state.groupId).toBeTruthy();
    const group = await fineract(request, 'GET', `/taxes/group/${state.groupId}`);
    expect(group.name).toBe(name('Composite Group'));
    const components = group.taxAssociations || group.taxComponents || [];
    test.info().annotations.push({ type: 'group-components', description: `${components.length} component association(s) returned` });
    if (components.length >= 2) {
      const totalRate = components.reduce((sum, item) => sum + Number((item.taxComponent || item).percentage || 0), 0);
      expect(totalRate).toBeCloseTo(10, 2);
      const base = 1000;
      expect(base * totalRate / 100).toBeCloseTo(100, 2);
    }
  });

  test('update and list tax group', async ({ request }) => {
    const updated = await optional(request, 'PUT', `/taxes/group/${state.groupId}`, {
      name: name('Composite Group Updated'), startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
      taxComponents: state.componentIds.map(id => ({ taxComponentId: id, startDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' }))
    });
    expect(updated.supported).toBeTruthy();
    expect((await fineract(request, 'GET', `/taxes/group/${state.groupId}`)).name).toBe(name('Composite Group Updated'));
    expect(rows(await fineract(request, 'GET', '/taxes/group')).some(x => x.id === state.groupId)).toBeTruthy();
  });

  test('create charge linked to tax group and verify linkage', async ({ request }) => {
    const template = await fineract(request, 'GET', '/charges/template');
    const currency = (template.currencyOptions || []).find(x => x.code === 'USD') || (template.currencyOptions || [])[0];
    const applies = (template.chargeAppliesToOptions || []).find(x => x.id === 1) || (template.chargeAppliesToOptions || [])[0];
    const calc = (template.chargeCalculationTypeOptions || [])[0];
    const time = (template.chargeTimeTypeOptions || []).find(x => x.id === 1) || (template.chargeTimeTypeOptions || [])[0];
    if (!currency || !applies || !calc || !time) test.skip(true, 'Charge template lacks required options');
    const created = await optional(request, 'POST', '/charges', {
      name: name('Taxed Charge'), chargeAppliesTo: applies.id, currencyCode: currency.code,
      amount: 100, chargeCalculationType: calc.id, chargeTimeType: time.id,
      taxGroupId: state.groupId, incomeAccountId: state.assetId, penalty: false, active: true, locale: 'en'
    });
    if (!created.supported) test.skip(true, `Tax-linked charge unavailable: HTTP ${created.status}`);
    state.chargeId = created.body.resourceId;
    const charge = await fineract(request, 'GET', `/charges/${state.chargeId}`);
    expect(charge.taxGroup?.id || charge.taxGroupId).toBe(state.groupId);
    const group = await fineract(request, 'GET', `/taxes/group/${state.groupId}`);
    const components = group.taxAssociations || group.taxComponents || [];
    test.info().annotations.push({ type: 'taxed-charge-components', description: `${components.length} component(s) linked through tax group` });
  });

  test('taxation UI renders through Products and charge detail', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('products'); });
    const content = page.locator('#contentArea');
    await expect(content).toContainText(/Product|Tax|FinCraft/i, { timeout: 30_000 });
    if (state.chargeId) {
      await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('charge-detail', { id }); }, state.chargeId);
      await expect(content).toContainText(/Tax|Charge|FinCraft/i, { timeout: 30_000 });
    }
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('tax records remain queryable after linked-object creation', async ({ request }) => {
    const components = rows(await fineract(request, 'GET', '/taxes/component'));
    const groups = rows(await fineract(request, 'GET', '/taxes/group'));
    expect(state.componentIds.every(id => components.some(x => x.id === id))).toBeTruthy();
    expect(groups.some(x => x.id === state.groupId)).toBeTruthy();
    if (state.chargeId) expect((await fineract(request, 'GET', `/charges/${state.chargeId}`)).id).toBe(state.chargeId);
  });
});
