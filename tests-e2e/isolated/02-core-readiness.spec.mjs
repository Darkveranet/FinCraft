import { test, expect } from '@playwright/test';
import { fineract, login } from './helpers.mjs';
const endpoints = [
  ['/offices','organization'], ['/staff','staff'], ['/users','users'], ['/roles','roles'], ['/permissions','permissions'],
  ['/clients?limit=5','clients'], ['/groups?limit=5','groups'], ['/centers?limit=5','centers'],
  ['/loanproducts','loan products'], ['/savingsproducts','savings products'], ['/charges','charges'],
  ['/glaccounts','GL accounts'], ['/currencies','currencies'], ['/codes','codes'], ['/paymenttypes','payment types'],
  ['/makercheckers?limit=5','checker inbox'], ['/audits?limit=5','audit'], ['/reports','reports']
];
test('all core Fineract capability endpoints respond', async ({ request }) => {
  for (const [path,label] of endpoints) await test.step(label, async () => expect(await fineract(request,'GET',path)).toBeDefined());
});
test('FinCraft route registry renders every authorized module against isolated Fineract', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); await login(page);
  const routes=await page.evaluate(async()=>{const r=await import('/js/router.js');return Object.entries(r.PAGE_REGISTRY).filter(([,d])=>r.isAllowed(d)).map(([k])=>k)});
  expect(routes.length).toBeGreaterThan(20);
  for (const route of routes) await test.step(route,async()=>{await page.evaluate(r=>location.hash=`#${r}`,route); await expect(page.locator('#contentArea')).toBeVisible(); await page.waitForTimeout(150);});
  expect(errors).toEqual([]);
});
