import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId } from './helpers.mjs';

const state = { codeId: null, accountNumberId: null };
const rows = value => value?.globalConfiguration || value?.pageItems || (Array.isArray(value) ? value : []);
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
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { supported: response.ok(), status: response.status(), body };
}

test.describe.serial('module 20 - settings lifecycle', () => {
  test('load global configurations and retrieve individual settings', async ({ request }) => {
    const result = await fineract(request, 'GET', '/configurations');
    const list = rows(result);
    expect(list.length).toBeGreaterThan(0);
    const selected = list.find(x => x.name) || list[0];
    const byId = await optional(request, 'GET', `/configurations/${selected.id}`);
    const byName = await optional(request, 'GET', `/configurations/name/${encodeURIComponent(selected.name)}`);
    expect(byId.supported || byName.supported).toBeTruthy();
    test.info().annotations.push({ type: 'configuration-detail', description: `id=${byId.status}, name=${byName.status}` });
  });

  test('perform reversible global-configuration update when tenant permits it', async ({ request }) => {
    const list = rows(await fineract(request, 'GET', '/configurations'));
    const selected = list.find(x => x.id && typeof x.enabled === 'boolean' && !/maker|twofactor|auth|password|business.date/i.test(x.name || ''));
    if (!selected) test.skip(true, 'No safe Boolean configuration available');
    const changed = await optional(request, 'PUT', `/configurations/${selected.id}`, { enabled: !selected.enabled });
    if (!changed.supported) test.skip(true, `Configuration update unavailable HTTP ${changed.status}`);
    const restored = await optional(request, 'PUT', `/configurations/${selected.id}`, { enabled: selected.enabled });
    expect(restored.supported).toBeTruthy();
    const final = await optional(request, 'GET', `/configurations/${selected.id}`);
    if (final.supported && typeof final.body.enabled === 'boolean') expect(final.body.enabled).toBe(selected.enabled);
  });

  test('cache and instance-mode settings are capability-tested without persistent mutation', async ({ request }) => {
    const caches = await optional(request, 'GET', '/caches');
    expect(caches.supported).toBeTruthy();
    const list = Array.isArray(caches.body) ? caches.body : (caches.body.cacheTypes || []);
    test.info().annotations.push({ type: 'cache-types', description: `${list.length} cache option(s)` });
    const instance = await optional(request, 'PUT', '/instance-mode', {});
    expect([200, 400, 403, 404, 405, 422]).toContain(instance.status);
    test.info().annotations.push({ type: 'instance-mode', description: instance.supported ? 'SUPPORTED' : `CAPABILITY HTTP ${instance.status}` });
  });

  test('field configurations are readable for core entities', async ({ request }) => {
    for (const entity of ['client', 'loan', 'savings']) {
      const result = await optional(request, 'GET', `/fieldconfiguration/${entity}`);
      test.info().annotations.push({ type: `field-${entity}`, description: result.supported ? 'SUPPORTED' : `HTTP ${result.status}` });
    }
  });

  test('create read and delete disposable custom code', async ({ request }) => {
    const created = await fineract(request, 'POST', '/codes', { name: `FinCraft Setting ${runId}`.slice(0, 100) });
    state.codeId = created.resourceId;
    expect(state.codeId).toBeTruthy();
    const saved = await fineract(request, 'GET', `/codes/${state.codeId}`);
    expect(saved.id).toBe(state.codeId);
    const listed = rows(await fineract(request, 'GET', '/codes'));
    expect(listed.some(x => x.id === state.codeId)).toBeTruthy();
    const values = await optional(request, 'GET', `/codes/${state.codeId}/codevalues`);
    test.info().annotations.push({ type: 'code-values', description: values.supported ? 'SUPPORTED' : `HTTP ${values.status}` });
    await fineract(request, 'DELETE', `/codes/${state.codeId}`);
  });

  test('account-number preference template and disposable lifecycle', async ({ request }) => {
    const template = await optional(request, 'GET', '/accountnumberformats/template');
    const list = await optional(request, 'GET', '/accountnumberformats');
    expect(template.supported && list.supported).toBeTruthy();
    const types = template.body.accountTypeOptions || template.body.accountNumberTypeOptions || [];
    const prefixes = template.body.prefixTypeOptions || [];
    const accountType = types[0]?.id;
    if (!accountType) test.skip(true, 'No account number type available');
    const payload = { accountType, prefixType: prefixes[0]?.id || 1 };
    const created = await optional(request, 'POST', '/accountnumberformats', payload);
    if (!created.supported) test.skip(true, `Preference create unavailable HTTP ${created.status}`);
    state.accountNumberId = created.body.resourceId;
    expect(state.accountNumberId).toBeTruthy();
    await fineract(request, 'GET', `/accountnumberformats/${state.accountNumberId}`);
    await optional(request, 'PUT', `/accountnumberformats/${state.accountNumberId}`, payload);
    await fineract(request, 'DELETE', `/accountnumberformats/${state.accountNumberId}`);
  });

  test('reference and integration settings are readable', async ({ request }) => {
    for (const [label, path] of [
      ['currencies', '/currencies'], ['permissions', '/permissions'], ['external-events', '/externalevents/configuration'],
      ['notification-service', '/externalservice/NOTIFICATION'], ['smtp-service', '/externalservice/SMTP'],
      ['sms-service', '/externalservice/SMS'], ['email-config', '/email/configuration'], ['entity-mappings', '/entitytoentitymapping']
    ]) {
      const result = await optional(request, 'GET', path);
      test.info().annotations.push({ type: label, description: result.supported ? 'READABLE' : `HTTP ${result.status}` });
    }
  });

  test('password, two-factor, OIDC, and scheduler settings report capability', async ({ request }) => {
    for (const [label, path] of [
      ['password-preferences', '/passwordpreferences'], ['password-template', '/passwordpreferences/template'],
      ['twofactor-config', '/twofactor/configure'], ['scheduler', '/scheduler'], ['jobs', '/jobs']
    ]) {
      const result = await optional(request, 'GET', path);
      test.info().annotations.push({ type: label, description: result.supported ? 'SUPPORTED' : `HTTP ${result.status}` });
    }
  });

  test('application settings persist locally without changing live server connection', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('settings'); });
    const content = page.locator('#contentArea');
    await expect(content).toContainText(/Settings|Server Connection|Appearance|Keyboard Shortcuts/i, { timeout: 30000 });
    const theme = content.locator('#s-theme');
    const before = await theme.isChecked();
    await theme.click();
    await expect(theme).toBeChecked({ checked: !before });
    await theme.click();
    await expect(theme).toBeChecked({ checked: before });
  });

  test('system configuration and data-management pages render through FinCraft', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('system'); });
    const content = page.locator('#contentArea');
    await expect(content).toContainText(/System|Configuration|Audit|Data|Integration/i, { timeout: 30000 });
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });
});
