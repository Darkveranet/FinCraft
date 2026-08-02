import { test, expect } from '@playwright/test';
import { fineract, login, runId, date } from './helpers.mjs';

test.describe.serial('isolated Fineract: real client lifecycle', () => {
  let clientId;
  test('create and activate a client through real Fineract', async ({ request }) => {
    const offices = await fineract(request,'GET','/offices');
    const officeId = (offices.pageItems || offices)[0].id;
    const externalId = `FC-E2E-${runId}`;
    const created = await fineract(request,'POST','/clients',{
      officeId, firstname:'FinCraft', lastname:`E2E ${runId}`.slice(0,45), externalId,
      legalFormId:1, active:true, activationDate:date(), dateFormat:'dd MM yyyy', locale:'en'
    });
    clientId = created.clientId || created.resourceId;
    expect(clientId).toBeTruthy();
    const saved = await fineract(request,'GET',`/clients/${clientId}`);
    expect(saved.externalId).toBe(externalId);
    expect(saved.status?.active).toBeTruthy();
  });

  test('created client is visible through FinCraft UI', async ({ page }) => {
    await login(page);
    await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('client-detail', { id }); }, clientId);
    await expect(page.locator('#contentArea')).toContainText('FinCraft', { timeout:30_000 });
    await expect(page.locator('#contentArea')).toContainText(String(clientId));
  });

  test('update client and verify persistence', async ({ request }) => {
    await fineract(request,'PUT',`/clients/${clientId}`,{ mobileNo:'08000000000' });
    const saved = await fineract(request,'GET',`/clients/${clientId}`);
    expect(saved.mobileNo).toBe('08000000000');
  });
});
