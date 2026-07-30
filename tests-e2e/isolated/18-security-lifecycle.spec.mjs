import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId } from './helpers.mjs';

const state = { officeId: null, roleId: null, userId: null, username: `fcsec${String(runId).replace(/\D/g,'').slice(-10)}`, password: 'FinCraft-CI-Only-9x!Q2', auditId: null };
const rows = value => value?.pageItems || (Array.isArray(value) ? value : []);
async function raw(request, method, path, data, auth) {
  const [user, pass] = auth || [cfg.user, cfg.pass];
  return request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, { method, data, ignoreHTTPSErrors:true,
    headers:{'Fineract-Platform-TenantId':cfg.tenant,Authorization:`Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,'Content-Type':'application/json'} });
}
async function body(response) { const text=await response.text(); try{return text?JSON.parse(text):{};}catch{return {raw:text};} }
async function optional(request, method, path, data) { const r=await raw(request,method,path,data); return {supported:r.ok(),status:r.status(),body:await body(r)}; }

test.describe.serial('module 15 - security lifecycle', () => {
  test('load user, role, permission, audit, and security templates', async ({ request }) => {
    const [userTpl, roles, permissions, auditTpl, passwordPrefs, twoFactor] = await Promise.all([
      fineract(request,'GET','/users/template'), fineract(request,'GET','/roles'),
      fineract(request,'GET','/permissions'), fineract(request,'GET','/audits/searchtemplate'),
      optional(request,'GET','/passwordpreferences'), optional(request,'GET','/twofactor/configure')
    ]);
    state.officeId=(userTpl.allowedOffices||userTpl.officeOptions||[])[0]?.id;
    expect(state.officeId).toBeTruthy(); expect(Array.isArray(roles)).toBeTruthy(); expect(Array.isArray(permissions)).toBeTruthy();
    expect(auditTpl).toBeDefined();
    test.info().annotations.push({type:'password-preferences',description:passwordPrefs.supported?'SUPPORTED':`UNAVAILABLE HTTP ${passwordPrefs.status}`});
    test.info().annotations.push({type:'two-factor-config',description:twoFactor.supported?'SUPPORTED':`UNAVAILABLE HTTP ${twoFactor.status}`});
  });

  test('create least-privilege role and assign selected read permissions', async ({ request }) => {
    const created=await fineract(request,'POST','/roles',{name:`FinCraft Security ${runId}`.slice(0,100),description:'Module 15 least-privilege CI role'});
    state.roleId=created.resourceId; expect(state.roleId).toBeTruthy();
    const role=await fineract(request,'GET',`/roles/${state.roleId}`);
    const available=role.permissionUsageData||[];
    const wanted=['READ_CLIENT','READ_OFFICE','READ_REPORT'].filter(code=>available.some(p=>p.code===code));
    expect(wanted.length).toBeGreaterThanOrEqual(1);
    const permissions={}; available.forEach(p=>permissions[p.code]=wanted.includes(p.code));
    await fineract(request,'PUT',`/roles/${state.roleId}/permissions`,{permissions});
    const saved=await fineract(request,'GET',`/roles/${state.roleId}/permissions`);
    const usage=saved.permissionUsageData||saved;
    expect(usage.filter(p=>p.selected).every(p=>wanted.includes(p.code))).toBeTruthy();
  });

  test('disable and enable security role', async ({ request }) => {
    await fineract(request,'POST',`/roles/${state.roleId}?command=disable`,{});
    expect((await fineract(request,'GET',`/roles/${state.roleId}`)).disabled).toBeTruthy();
    await fineract(request,'POST',`/roles/${state.roleId}?command=enable`,{});
    expect((await fineract(request,'GET',`/roles/${state.roleId}`)).disabled).toBeFalsy();
  });

  test('create isolated user with least-privilege role', async ({ request }) => {
    const created=await fineract(request,'POST','/users',{
      username:state.username,firstname:'FinCraft',lastname:'Security CI',email:`${state.username}@example.invalid`,
      officeId:state.officeId,roles:[state.roleId],password:state.password,repeatPassword:state.password,
      sendPasswordToEmail:false,passwordNeverExpires:false,shouldRenewPassword:false
    });
    state.userId=created.resourceId; expect(state.userId).toBeTruthy();
    const user=await fineract(request,'GET',`/users/${state.userId}`);
    expect(user.username).toBe(state.username); expect((user.selectedRoles||[]).some(r=>r.id===state.roleId)).toBeTruthy();
  });

  test('authenticate isolated user and enforce least privilege', async ({ request }) => {
    const self=await raw(request,'GET','/userdetails',undefined,[state.username,state.password]);
    expect(self.ok()).toBeTruthy();
    const selfBody=await body(self); expect(selfBody.username).toBe(state.username);
    const allowed=await raw(request,'GET','/offices',undefined,[state.username,state.password]);
    expect(allowed.ok()).toBeTruthy();
    const denied=await raw(request,'POST','/roles',{name:`Denied ${runId}`},[state.username,state.password]);
    expect(denied.ok()).toBeFalsy(); expect([401,403]).toContain(denied.status());
  });

  test('invalid credentials and unauthenticated requests are rejected', async ({ request }) => {
    const wrong=await raw(request,'GET','/userdetails',undefined,[state.username,'Definitely-Wrong-Password']);
    expect(wrong.ok()).toBeFalsy(); expect([401,403]).toContain(wrong.status());
    const unauth=await request.get(`${cfg.url}/fineract-provider/api/v1/users`,{ignoreHTTPSErrors:true,headers:{'Fineract-Platform-TenantId':cfg.tenant}});
    expect(unauth.ok()).toBeFalsy(); expect([401,403]).toContain(unauth.status());
  });

  test('lock and unlock user account through administrative lifecycle', async ({ request }) => {
    const original=await fineract(request,'GET',`/users/${state.userId}`);
    const base={email:original.email,firstname:original.firstname,lastname:original.lastname,officeId:original.officeId,roles:(original.selectedRoles||[]).map(r=>r.id),passwordNeverExpires:false};
    await fineract(request,'PUT',`/users/${state.userId}`,{...base,accountNonLocked:false});
    expect((await fineract(request,'GET',`/users/${state.userId}`)).accountNonLocked).toBeFalsy();
    const locked=await raw(request,'GET','/userdetails',undefined,[state.username,state.password]);
    expect(locked.ok()).toBeFalsy(); expect([401,403]).toContain(locked.status());
    await fineract(request,'PUT',`/users/${state.userId}`,{...base,accountNonLocked:true});
    expect((await fineract(request,'GET',`/users/${state.userId}`)).accountNonLocked).toBeTruthy();
  });

  test('password reset endpoint and password preferences are capability-tested safely', async ({ request }) => {
    const newPassword='FinCraft-CI-Only-8v!R3';
    const changed=await optional(request,'POST',`/users/${state.userId}/pwd`,{password:newPassword,repeatPassword:newPassword});
    test.info().annotations.push({type:'password-reset',description:changed.supported?'SUPPORTED':`UNAVAILABLE HTTP ${changed.status}`});
    if (changed.supported) {
      state.password=newPassword;
      expect((await raw(request,'GET','/userdetails',undefined,[state.username,state.password])).ok()).toBeTruthy();
    }
    const template=await optional(request,'GET','/passwordpreferences/template');
    test.info().annotations.push({type:'password-preferences-template',description:template.supported?'SUPPORTED':`UNAVAILABLE HTTP ${template.status}`});
  });

  test('audit trail captures role and user operations', async ({ request }) => {
    const audits=await fineract(request,'GET',`/audits?limit=200&orderBy=id&sortOrder=DESC&paged=true`);
    const list=rows(audits);
    const matches=list.filter(a=>a.resourceId===state.userId||a.resourceId===state.roleId||String(a.entityName||'').match(/USER|ROLE/i));
    expect(matches.length).toBeGreaterThanOrEqual(1);
    state.auditId=matches[0].id;
    const detail=await fineract(request,'GET',`/audits/${state.auditId}`);
    expect(detail.id).toBe(state.auditId); expect(detail.actionName||detail.entityName).toBeTruthy();
  });

  test('maker-checker and two-factor surfaces report tenant capability', async ({ request }) => {
    for (const [label,path] of [['maker-checker-template','/makercheckers/searchtemplate'],['maker-checkers','/makercheckers?limit=100'],['two-factor-methods','/twofactor']]) {
      const result=await optional(request,'GET',path);
      test.info().annotations.push({type:label,description:result.supported?'SUPPORTED':`UNAVAILABLE HTTP ${result.status}`});
    }
  });

  test('users, roles, security, and audit pages render through FinCraft', async ({ page }) => {
    await login(page); const content=page.locator('#contentArea');
    for (const route of ['users','system','notifications']) {
      await page.evaluate(async route=>{const r=await import('/js/router.js');r.navigate(route)},route);
      await expect(content).toContainText(/User|Role|Security|System|Audit|Notification|FinCraft/i,{timeout:30000});
      await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
    }
  });

  test('clean up isolated user and role without touching seeded administrators', async ({ request }) => {
    await fineract(request,'DELETE',`/users/${state.userId}`);
    const user=await raw(request,'GET',`/users/${state.userId}`); expect(user.ok()).toBeFalsy();
    await fineract(request,'DELETE',`/roles/${state.roleId}`);
    const role=await raw(request,'GET',`/roles/${state.roleId}`); expect(role.ok()).toBeFalsy();
  });
});
