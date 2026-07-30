import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { officeId: null, clientIds: [], staffId: null, groupId: null, secondGroupId: null, centerId: null };
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

async function createClient(request, sequence) {
  const created = await fineract(request, 'POST', '/clients', {
    officeId: state.officeId, firstname: 'FinCraft', lastname: `Group Member ${sequence} ${runId}`.slice(0, 45),
    externalId: unique(`MEMBER-${sequence}`), active: true, activationDate: date(), submittedOnDate: date(),
    dateFormat: 'dd MM yyyy', locale: 'en'
  });
  return created.clientId || created.resourceId;
}

async function createGroup(request, label, active = false) {
  const created = await fineract(request, 'POST', '/groups', {
    officeId: state.officeId, name: `FinCraft ${label} ${runId}`.slice(0, 80), externalId: unique(label),
    submittedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en',
    ...(active ? { active: true, activationDate: date() } : {})
  });
  return created.groupId || created.resourceId;
}

function firstOption(template, ...keys) {
  for (const key of keys) {
    const value = key.split('.').reduce((x, part) => x?.[part], template);
    if (Array.isArray(value) && value.length) return value[0];
  }
  return null;
}

test.describe.serial('module 04 - groups and centres lifecycle', () => {
  test('load group, centre, office, staff, and group-level reference data', async ({ request }) => {
    const [groupTemplate, centerTemplate, offices, levels] = await Promise.all([
      fineract(request, 'GET', '/groups/template'), fineract(request, 'GET', '/centers/template'),
      fineract(request, 'GET', '/offices'), fineract(request, 'GET', '/grouplevels')
    ]);
    expect(groupTemplate).toBeDefined(); expect(centerTemplate).toBeDefined(); expect(levels).toBeDefined();
    state.officeId = asRows(offices)[0]?.id;
    expect(state.officeId).toBeTruthy();
    const staff = await fineract(request, 'POST', '/staff', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `Group Officer ${runId}`.slice(0, 45),
      isLoanOfficer: true, isActive: true
    });
    state.staffId = staff.resourceId;
    expect(state.staffId).toBeTruthy();
  });

  test('create active clients required for group membership', async ({ request }) => {
    state.clientIds = [await createClient(request, 1), await createClient(request, 2), await createClient(request, 3)];
    expect(state.clientIds.every(Boolean)).toBeTruthy();
  });

  test('create pending group, update it, activate it, and read it back', async ({ request }) => {
    state.groupId = await createGroup(request, 'Group', false);
    expect(state.groupId).toBeTruthy();
    await fineract(request, 'PUT', `/groups/${state.groupId}`, {
      name: `FinCraft Group Updated ${runId}`.slice(0, 80), externalId: unique('GROUP'),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    await fineract(request, 'POST', `/groups/${state.groupId}?command=activate`, {
      activationDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const saved = await fineract(request, 'GET', `/groups/${state.groupId}?associations=all`);
    expect(saved.name).toContain('Updated');
    expect(saved.status?.active).toBeTruthy();
  });

  test('assign and unassign staff from group', async ({ request }) => {
    await fineract(request, 'POST', `/groups/${state.groupId}?command=assignStaff`, { staffId: state.staffId });
    let saved = await fineract(request, 'GET', `/groups/${state.groupId}`);
    expect(saved.staffId || saved.staff?.id).toBe(state.staffId);
    await fineract(request, 'POST', `/groups/${state.groupId}?command=unassignStaff`, { staffId: state.staffId });
    saved = await fineract(request, 'GET', `/groups/${state.groupId}`);
    expect(saved.staffId || saved.staff?.id || null).toBeFalsy();
  });

  test('associate and disassociate clients from group', async ({ request }) => {
    await fineract(request, 'POST', `/groups/${state.groupId}?command=associateClients`, { clientMembers: state.clientIds });
    let saved = await fineract(request, 'GET', `/groups/${state.groupId}?associations=clientMembers`);
    const members = saved.clientMembers || [];
    expect(state.clientIds.every(id => members.some(x => x.id === id))).toBeTruthy();
    await fineract(request, 'POST', `/groups/${state.groupId}?command=disassociateClients`, { clientMembers: [state.clientIds[2]] });
    saved = await fineract(request, 'GET', `/groups/${state.groupId}?associations=clientMembers`);
    expect((saved.clientMembers || []).some(x => x.id === state.clientIds[2])).toBeFalsy();
  });

  test('create pending centre, update it, activate it, and read it back', async ({ request }) => {
    const created = await fineract(request, 'POST', '/centers', {
      officeId: state.officeId, name: `FinCraft Centre ${runId}`.slice(0, 80), externalId: unique('CENTRE'),
      submittedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    state.centerId = created.groupId || created.resourceId;
    expect(state.centerId).toBeTruthy();
    await fineract(request, 'PUT', `/centers/${state.centerId}`, {
      name: `FinCraft Centre Updated ${runId}`.slice(0, 80), externalId: unique('CENTRE'),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    await fineract(request, 'POST', `/centers/${state.centerId}?command=activate`, {
      activationDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const saved = await fineract(request, 'GET', `/centers/${state.centerId}?associations=groupMembers,collection`);
    expect(saved.name).toContain('Updated');
    expect(saved.status?.active).toBeTruthy();
  });

  test('associate and disassociate group from centre', async ({ request }) => {
    await fineract(request, 'POST', `/centers/${state.centerId}?command=associateGroups`, { groupMembers: [state.groupId] });
    let saved = await fineract(request, 'GET', `/centers/${state.centerId}?associations=groupMembers`);
    expect((saved.groupMembers || []).some(x => x.id === state.groupId)).toBeTruthy();
    await fineract(request, 'POST', `/centers/${state.centerId}?command=disassociateGroups`, { groupMembers: [state.groupId] });
    saved = await fineract(request, 'GET', `/centers/${state.centerId}?associations=groupMembers`);
    expect((saved.groupMembers || []).some(x => x.id === state.groupId)).toBeFalsy();
  });

  test('transfer a client between two groups', async ({ request }) => {
    state.secondGroupId = await createGroup(request, 'Destination Group', true);
    await fineract(request, 'POST', `/groups/${state.groupId}?command=transferClients`, {
      destinationGroupId: state.secondGroupId, clients: [state.clientIds[0]], clientMembers: [state.clientIds[0]]
    });
    const source = await fineract(request, 'GET', `/groups/${state.groupId}?associations=clientMembers`);
    const target = await fineract(request, 'GET', `/groups/${state.secondGroupId}?associations=clientMembers`);
    expect((source.clientMembers || []).some(x => x.id === state.clientIds[0])).toBeFalsy();
    expect((target.clientMembers || []).some(x => x.id === state.clientIds[0])).toBeTruthy();
  });

  test('retrieve group and centre accounts plus optional GLIM and GSIM accounts', async ({ request }) => {
    await fineract(request, 'GET', `/groups/${state.groupId}/accounts`);
    await fineract(request, 'GET', `/centers/${state.centerId}/accounts`);
    for (const path of [`/groups/${state.groupId}/glimaccounts`, `/groups/${state.groupId}/gsimaccounts`]) {
      const result = await optional(request, 'GET', path);
      test.info().annotations.push({ type: path, description: result.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${result.status}` });
    }
  });

  test('create, retrieve, update, and delete group calendar when supported', async ({ request }) => {
    const template = await optional(request, 'GET', `/groups/${state.groupId}/calendars/template`);
    if (!template.supported) test.skip(true, `Group calendar unavailable: HTTP ${template.status}`);
    const payload = {
      title: `FinCraft Group Meeting ${runId}`.slice(0, 80), startDate: date(), typeId: 1,
      frequency: 2, interval: 1, repeating: true, dateFormat: 'dd MM yyyy', locale: 'en'
    };
    const created = await fineract(request, 'POST', `/groups/${state.groupId}/calendars`, payload);
    const calendarId = created.resourceId;
    expect(calendarId).toBeTruthy();
    await fineract(request, 'GET', `/groups/${state.groupId}/calendars/${calendarId}`);
    await fineract(request, 'PUT', `/groups/${state.groupId}/calendars/${calendarId}`, { ...payload, title: `FinCraft Updated Meeting ${runId}`.slice(0, 80) });
    await fineract(request, 'DELETE', `/groups/${state.groupId}/calendars/${calendarId}`);
  });

  test('list and search groups and centres', async ({ request }) => {
    const groups = await fineract(request, 'GET', `/groups?officeId=${state.officeId}&limit=100`);
    const centers = await fineract(request, 'GET', `/centers?officeId=${state.officeId}&limit=100`);
    expect(asRows(groups).some(x => x.id === state.groupId)).toBeTruthy();
    expect(asRows(centers).some(x => x.id === state.centerId)).toBeTruthy();
  });

  test('groups and centres render through FinCraft list and detail routes', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('groups'); });
    await expect(page.locator('#contentArea')).toContainText(/Groups|FinCraft/i, { timeout: 30_000 });
    await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('group-detail', { id }); }, state.groupId);
    await expect(page.locator('#contentArea')).toContainText('FinCraft', { timeout: 30_000 });
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('centers'); });
    await expect(page.locator('#contentArea')).toContainText(/Centers|Centres|FinCraft/i, { timeout: 30_000 });
    await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('center-detail', { id }); }, state.centerId);
    await expect(page.locator('#contentArea')).toContainText('FinCraft', { timeout: 30_000 });
    await expect(page.locator('#contentArea')).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('close disposable group and centre when closure reasons are configured', async ({ request }) => {
    const [groupTemplate, centerTemplate] = await Promise.all([
      fineract(request, 'GET', '/groups/template'), fineract(request, 'GET', '/centers/template')
    ]);
    const groupReason = firstOption(groupTemplate, 'closureReasons');
    const centerReason = firstOption(centerTemplate, 'closureReasons');
    if (!groupReason?.id || !centerReason?.id) test.skip(true, 'Group/centre closure reasons are not configured');
    const groupId = await createGroup(request, 'Closable Group', true);
    await fineract(request, 'POST', `/groups/${groupId}?command=close`, {
      closureDate: date(), closureReasonId: groupReason.id, dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect((await fineract(request, 'GET', `/groups/${groupId}`)).status?.closed).toBeTruthy();
    const center = await fineract(request, 'POST', '/centers', {
      officeId: state.officeId, name: `FinCraft Closable Centre ${runId}`.slice(0, 80),
      externalId: unique('CLOSE-CENTRE'), active: true, activationDate: date(), submittedOnDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const centerId = center.groupId || center.resourceId;
    await fineract(request, 'POST', `/centers/${centerId}?command=close`, {
      closureDate: date(), closureReasonId: centerReason.id, dateFormat: 'dd MM yyyy', locale: 'en'
    });
    expect((await fineract(request, 'GET', `/centers/${centerId}`)).status?.closed).toBeTruthy();
  });

  test('delete disposable pending group and centre', async ({ request }) => {
    const groupId = await createGroup(request, 'Disposable Group', false);
    await fineract(request, 'DELETE', `/groups/${groupId}`);
    expect((await raw(request, 'GET', `/groups/${groupId}`)).ok()).toBeFalsy();
    const center = await fineract(request, 'POST', '/centers', {
      officeId: state.officeId, name: `FinCraft Disposable Centre ${runId}`.slice(0, 80),
      externalId: unique('DISPOSABLE-CENTRE'), submittedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    const centerId = center.groupId || center.resourceId;
    await fineract(request, 'DELETE', `/centers/${centerId}`);
    expect((await raw(request, 'GET', `/centers/${centerId}`)).ok()).toBeFalsy();
  });
});
