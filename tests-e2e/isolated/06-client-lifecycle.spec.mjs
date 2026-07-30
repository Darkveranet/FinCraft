import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { officeId: null, activeId: null, pendingId: null, entityId: null, staffId: null };
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
  if (!response.ok()) return { supported: false, status: response.status(), body: await response.text() };
  const text = await response.text();
  let body = {}; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { supported: true, status: response.status(), body };
}

async function createPerson(request, label, active = false) {
  const body = {
    officeId: state.officeId, firstname: 'FinCraft', lastname: `${label} ${runId}`.slice(0, 45),
    externalId: unique(label), submittedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
    ...(active ? { active: true, activationDate: date() } : {})
  };
  const created = await fineract(request, 'POST', '/clients', body);
  return created.clientId || created.resourceId;
}

function firstOption(template, ...paths) {
  for (const path of paths) {
    const value = path.split('.').reduce((x, key) => x?.[key], template);
    if (Array.isArray(value) && value.length) return value[0];
  }
  return null;
}

test.describe.serial('module 03 - clients lifecycle', () => {
  test('load client, address, office, and staff reference data', async ({ request }) => {
    const [template, offices, staff] = await Promise.all([
      fineract(request, 'GET', '/clients/template'),
      fineract(request, 'GET', '/offices'),
      fineract(request, 'GET', '/staff')
    ]);
    expect(template).toBeDefined();
    state.officeId = asRows(offices)[0]?.id;
    expect(state.officeId).toBeTruthy();
    expect(asRows(staff)).toBeDefined();
    const address = await optional(request, 'GET', '/client/addresses/template');
    test.info().annotations.push({ type: 'address-module', description: address.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${address.status}` });
  });

  test('create active person client and verify complete persisted identity', async ({ request }) => {
    state.activeId = await createPerson(request, 'Active', true);
    const saved = await fineract(request, 'GET', `/clients/${state.activeId}?associations=all`);
    expect(saved.firstname).toBe('FinCraft');
    expect(saved.externalId).toBe(unique('Active'));
    expect(saved.status?.active).toBeTruthy();
    expect(saved.officeId || saved.office?.id).toBe(state.officeId);
  });

  test('create pending person and non-person clients', async ({ request }) => {
    state.pendingId = await createPerson(request, 'Pending', false);
    const pending = await fineract(request, 'GET', `/clients/${state.pendingId}`);
    expect(pending.status?.pending).toBeTruthy();

    const entity = await fineract(request, 'POST', '/clients', {
      officeId: state.officeId, legalFormId: 2, fullname: `FinCraft Entity ${runId}`.slice(0, 80),
      externalId: unique('Entity'), submittedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
      active: true, activationDate: date()
    });
    state.entityId = entity.clientId || entity.resourceId;
    const saved = await fineract(request, 'GET', `/clients/${state.entityId}`);
    expect(saved.displayName || saved.fullname).toContain('FinCraft Entity');
  });

  test('update contact and demographic fields and verify persistence', async ({ request }) => {
    await fineract(request, 'PUT', `/clients/${state.activeId}`, {
      firstname: 'FinCraft', middlename: 'Module03', lastname: `Updated ${runId}`.slice(0, 45),
      mobileNo: '08000000003', emailAddress: `client.${String(runId).replace(/\W/g, '')}@example.test`,
      externalId: unique('Active'), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const saved = await fineract(request, 'GET', `/clients/${state.activeId}`);
    expect(saved.middlename).toBe('Module03');
    expect(saved.mobileNo).toBe('08000000003');
    expect(saved.emailAddress).toContain('@example.test');
  });

  test('reject duplicate client external ID', async ({ request }) => {
    const response = await raw(request, 'POST', '/clients', {
      officeId: state.officeId, firstname: 'Duplicate', lastname: 'External ID',
      externalId: unique('Active'), submittedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect(response.ok()).toBeFalsy();
    expect([400, 403, 409]).toContain(response.status());
  });

  test('activate a pending client and verify active status', async ({ request }) => {
    await fineract(request, 'POST', `/clients/${state.pendingId}?command=activate`, {
      activationDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const saved = await fineract(request, 'GET', `/clients/${state.pendingId}`);
    expect(saved.status?.active).toBeTruthy();
  });

  test('create staff, assign to client, then unassign', async ({ request }) => {
    const staff = await fineract(request, 'POST', '/staff', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `Officer ${runId}`.slice(0, 45),
      isLoanOfficer: true, isActive: true
    });
    state.staffId = staff.resourceId;
    expect(state.staffId).toBeTruthy();
    await fineract(request, 'POST', `/clients/${state.activeId}?command=assignStaff`, { staffId: state.staffId });
    let saved = await fineract(request, 'GET', `/clients/${state.activeId}`);
    expect(saved.staffId || saved.staff?.id).toBe(state.staffId);
    await fineract(request, 'POST', `/clients/${state.activeId}?command=unassignStaff`, { staffId: state.staffId });
    saved = await fineract(request, 'GET', `/clients/${state.activeId}`);
    expect(saved.staffId || saved.staff?.id || null).toBeFalsy();
  });

  test('identifier create, read, update, and delete when configured', async ({ request }) => {
    const template = await optional(request, 'GET', `/clients/${state.activeId}/identifiers/template`);
    if (!template.supported) test.skip(true, `Identifier module unavailable: HTTP ${template.status}`);
    const type = firstOption(template.body, 'allowedDocumentTypes', 'documentTypeOptions');
    if (!type?.id) test.skip(true, 'No client identifier document type configured');
    const created = await fineract(request, 'POST', `/clients/${state.activeId}/identifiers`, {
      documentTypeId: type.id, documentKey: unique('ID')
    });
    const identifierId = created.resourceId;
    expect(identifierId).toBeTruthy();
    expect((await fineract(request, 'GET', `/clients/${state.activeId}/identifiers/${identifierId}`)).documentKey).toBe(unique('ID'));
    await fineract(request, 'PUT', `/clients/${state.activeId}/identifiers/${identifierId}`, {
      documentTypeId: type.id, documentKey: unique('ID-UPD')
    });
    expect((await fineract(request, 'GET', `/clients/${state.activeId}/identifiers/${identifierId}`)).documentKey).toBe(unique('ID-UPD'));
    await fineract(request, 'DELETE', `/clients/${state.activeId}/identifiers/${identifierId}`);
  });

  test('address create, read, and update when address module is enabled', async ({ request }) => {
    const template = await optional(request, 'GET', '/client/addresses/template');
    if (!template.supported) test.skip(true, `Address module unavailable: HTTP ${template.status}`);
    const type = firstOption(template.body, 'addressTypeIdOptions', 'addressTypeOptions');
    if (!type?.id) test.skip(true, 'No address type configured');
    await fineract(request, 'POST', `/client/${state.activeId}/addresses?type=${type.id}`, {
      addressTypeId: type.id, addressLine1: 'FinCraft E2E Street', city: 'Test City', postalCode: '100001', isActive: true
    });
    const addresses = await fineract(request, 'GET', `/client/${state.activeId}/addresses`);
    expect(asRows(addresses).some(x => x.addressLine1 === 'FinCraft E2E Street')).toBeTruthy();
    await fineract(request, 'PUT', `/client/${state.activeId}/addresses`, {
      addressTypeId: type.id, addressLine1: 'FinCraft Updated Street', city: 'Test City', postalCode: '100002', isActive: true
    });
    expect(asRows(await fineract(request, 'GET', `/client/${state.activeId}/addresses`)).some(x => x.addressLine1 === 'FinCraft Updated Street')).toBeTruthy();
  });

  test('family member create, read, update, and delete when configured', async ({ request }) => {
    const template = await optional(request, 'GET', `/clients/${state.activeId}/familymembers/template`);
    if (!template.supported) test.skip(true, `Family-member module unavailable: HTTP ${template.status}`);
    const relation = firstOption(template.body, 'relationshipIdOptions', 'familyMemberOptions.relationshipIdOptions');
    if (!relation?.id) test.skip(true, 'No family relationship code configured');
    const created = await fineract(request, 'POST', `/clients/${state.activeId}/familymembers`, {
      firstName: 'FinCraft', lastName: 'Relative', relationshipId: relation.id, mobileNumber: '08000000004', locale: 'en'
    });
    const memberId = created.resourceId;
    expect(memberId).toBeTruthy();
    await fineract(request, 'PUT', `/clients/${state.activeId}/familymembers/${memberId}`, {
      firstName: 'FinCraft', lastName: 'Relative Updated', relationshipId: relation.id, mobileNumber: '08000000005', locale: 'en'
    });
    const saved = await fineract(request, 'GET', `/clients/${state.activeId}/familymembers/${memberId}`);
    expect(saved.lastName).toContain('Updated');
    await fineract(request, 'DELETE', `/clients/${state.activeId}/familymembers/${memberId}`);
  });

  test('list, search, accounts, charges, transactions, and optional details respond', async ({ request }) => {
    const list = await fineract(request, 'GET', `/clients?displayName=FinCraft&limit=50`);
    expect(asRows(list).some(x => x.id === state.activeId)).toBeTruthy();
    await fineract(request, 'GET', `/clients/${state.activeId}/accounts`);
    await fineract(request, 'GET', `/clients/${state.activeId}/charges`);
    await fineract(request, 'GET', `/clients/${state.activeId}/transactions?limit=50`);
    for (const path of [`/clients/${state.activeId}/obligeedetails`, `/clients/${state.activeId}/transferproposaldate`]) {
      const result = await optional(request, 'GET', path);
      test.info().annotations.push({ type: path, description: result.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${result.status}` });
    }
  });

  test('client list and detail render through FinCraft', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('clients'); });
    await expect(page.locator('#contentArea')).toBeVisible();
    await expect(page.locator('#contentArea')).toContainText(/Clients|FinCraft/i, { timeout: 30_000 });
    await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('client-detail', { id }); }, state.activeId);
    await expect(page.locator('#contentArea')).toContainText('FinCraft', { timeout: 30_000 });
    await expect(page.locator('#contentArea')).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('reject and withdraw separate pending clients when lifecycle reasons exist', async ({ request }) => {
    const template = await fineract(request, 'GET', '/clients/template');
    const rejection = firstOption(template, 'clientRejectionReasons', 'rejectionReasons');
    const withdrawal = firstOption(template, 'clientWithdrawReasons', 'withdrawalReasons', 'clientRejectionReasons');
    if (!rejection?.id || !withdrawal?.id) test.skip(true, 'Client rejection/withdrawal reason codes are not configured');
    const rejectId = await createPerson(request, 'Reject', false);
    await fineract(request, 'POST', `/clients/${rejectId}?command=reject`, {
      rejectionDate: date(), rejectionReasonId: rejection.id, dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect((await fineract(request, 'GET', `/clients/${rejectId}`)).status?.code).toMatch(/rejected/i);
    const withdrawId = await createPerson(request, 'Withdraw', false);
    await fineract(request, 'POST', `/clients/${withdrawId}?command=withdraw`, {
      withdrawalDate: date(), withdrawalReasonId: withdrawal.id, dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect((await fineract(request, 'GET', `/clients/${withdrawId}`)).status?.code).toMatch(/withdrawn/i);
  });

  test('delete a disposable pending client', async ({ request }) => {
    const id = await createPerson(request, 'Disposable', false);
    await fineract(request, 'DELETE', `/clients/${id}`);
    const response = await raw(request, 'GET', `/clients/${id}`);
    expect(response.ok()).toBeFalsy();
    expect([404, 410]).toContain(response.status());
  });
});
