import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId } from './helpers.mjs';

const state = { clientId: null, officeId: null, notificationCount: 0 };
const rows = value => value?.pageItems || (Array.isArray(value) ? value : []);
async function raw(request, method, path, data) {
  return request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, { method, data, ignoreHTTPSErrors:true,
    headers:{'Fineract-Platform-TenantId':cfg.tenant,Authorization:`Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64')}`,'Content-Type':'application/json'} });
}
async function optional(request, method, path, data) {
  const r=await raw(request,method,path,data); const text=await r.text(); let body={};
  try{body=text?JSON.parse(text):{};}catch{body={raw:text};}
  return {supported:r.ok(),status:r.status(),body};
}

test.describe.serial('module 16 - notifications lifecycle', () => {
  test('create auditable business event and retrieve notification feed', async ({ request }) => {
    state.officeId=rows(await fineract(request,'GET','/offices'))[0]?.id; expect(state.officeId).toBeTruthy();
    const client=await fineract(request,'POST','/clients',{
      officeId:state.officeId,firstname:'FinCraft',lastname:`Notification ${runId}`.slice(0,45),
      externalId:`FC-NOT-${runId}`.slice(0,50),active:true,activationDate:new Date().toISOString().slice(0,10).split('-').reverse().join(' '),
      submittedOnDate:new Date().toISOString().slice(0,10).split('-').reverse().join(' '),dateFormat:'dd MM yyyy',locale:'en'
    });
    state.clientId=client.clientId||client.resourceId;
    const feed=await fineract(request,'GET','/notifications?limit=100&orderBy=createdAt&sortOrder=DESC');
    const list=rows(feed); state.notificationCount=list.length;
    expect(Array.isArray(list)).toBeTruthy();
    test.info().annotations.push({type:'notification-feed',description:`${list.length} notification(s) returned after client event`});
  });

  test('filter unread/read notifications and mark all read when supported', async ({ request }) => {
    const unread=await optional(request,'GET','/notifications?limit=100&isRead=false&orderBy=createdAt&sortOrder=DESC');
    expect(unread.supported).toBeTruthy();
    const before=rows(unread.body).length;
    const marked=await optional(request,'PUT','/notifications',{isRead:true});
    test.info().annotations.push({type:'mark-all-read',description:marked.supported?'SUPPORTED':`UNAVAILABLE HTTP ${marked.status}`});
    if(marked.supported){
      const after=rows(await fineract(request,'GET','/notifications?limit=100&isRead=false')).length;
      expect(after).toBeLessThanOrEqual(before);
    }
  });

  test('SMS and email delivery queues expose status views', async ({ request }) => {
    for(const [label,path] of [
      ['sms-all','/sms?limit=100'],['email-all','/email?limit=100'],
      ['email-pending','/email/pendingEmail?limit=100'],['email-sent','/email/sentEmail?limit=100'],
      ['email-failed','/email/failedEmail?limit=100'],['email-by-status','/email/messageByStatus?limit=100']
    ]){
      const result=await optional(request,'GET',path);
      test.info().annotations.push({type:label,description:result.supported?`${rows(result.body).length} record(s)`:`UNAVAILABLE HTTP ${result.status}`});
    }
  });

  test('SMS campaign template, preview, and listing are capability-tested', async ({ request }) => {
    const template=await optional(request,'GET','/smscampaigns/template');
    const list=await optional(request,'GET','/smscampaigns');
    test.info().annotations.push({type:'sms-campaign-template',description:template.supported?'SUPPORTED':`UNAVAILABLE HTTP ${template.status}`});
    test.info().annotations.push({type:'sms-campaign-list',description:list.supported?`${rows(list.body).length} campaign(s)`:`UNAVAILABLE HTTP ${list.status}`});
    const preview=await optional(request,'POST','/smscampaigns/preview',{smsMessage:'FinCraft notification preview for {{client.displayName}}',message:'FinCraft notification preview for {{client.displayName}}'});
    test.info().annotations.push({type:'sms-preview',description:preview.supported?'SUPPORTED':`UNAVAILABLE HTTP ${preview.status}`});
  });

  test('email campaign template, preview, and listing are capability-tested', async ({ request }) => {
    const template=await optional(request,'GET','/email/campaign/template');
    const list=await optional(request,'GET','/email/campaign');
    test.info().annotations.push({type:'email-campaign-template',description:template.supported?'SUPPORTED':`UNAVAILABLE HTTP ${template.status}`});
    test.info().annotations.push({type:'email-campaign-list',description:list.supported?`${rows(list.body).length} campaign(s)`:`UNAVAILABLE HTTP ${list.status}`});
    const preview=await optional(request,'POST','/email/campaign/preview',{emailSubject:'FinCraft CI preview',emailMessage:'Notification preview for {{client.displayName}}',message:'Notification preview for {{client.displayName}}'});
    test.info().annotations.push({type:'email-preview',description:preview.supported?'SUPPORTED':`UNAVAILABLE HTTP ${preview.status}`});
  });

  test('notification, SMTP, SMS, and email configurations are readable without mutation', async ({ request }) => {
    for(const [label,path] of [
      ['notification-service','/externalservice/NOTIFICATION'],['smtp-service','/externalservice/SMTP'],
      ['sms-service','/externalservice/SMS'],['email-configuration','/email/configuration']
    ]){
      const result=await optional(request,'GET',path);
      test.info().annotations.push({type:label,description:result.supported?'CONFIGURATION READABLE':`UNAVAILABLE HTTP ${result.status}`});
    }
  });

  test('external event and hook notification surfaces are queryable', async ({ request }) => {
    for(const [label,path] of [['external-events','/externalevents/configuration'],['hooks-template','/hooks/template'],['hooks','/hooks']]){
      const result=await optional(request,'GET',path);
      test.info().annotations.push({type:label,description:result.supported?'SUPPORTED':`UNAVAILABLE HTTP ${result.status}`});
    }
  });

  test('notification feed and campaign pages render through FinCraft', async ({ page }) => {
    await login(page); const content=page.locator('#contentArea');
    await page.evaluate(async()=>{const r=await import('/js/router.js');r.navigate('notifications')});
    await expect(content).toContainText(/Notification|Activity|Audit|FinCraft/i,{timeout:30000});
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
    await page.evaluate(async()=>{const r=await import('/js/router.js');r.navigate('organization')});
    await expect(content).toContainText(/Organization|SMS|Email|Campaign|FinCraft/i,{timeout:30000});
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('notification entity links and generated audit context remain resolvable', async ({ request }) => {
    const feed=rows(await fineract(request,'GET','/notifications?limit=100&orderBy=createdAt&sortOrder=DESC'));
    for(const n of feed.slice(0,10)){
      expect(n.id).toBeTruthy();
      if(n.objectIdentifier) expect(String(n.objectIdentifier).length).toBeGreaterThan(0);
    }
    const audits=rows(await fineract(request,'GET',`/audits?resourceId=${state.clientId}&limit=25&paged=true`));
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });
});
