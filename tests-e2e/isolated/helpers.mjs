import { expect } from '@playwright/test';
export const cfg = {
  url: process.env.FINERACT_URL || 'https://127.0.0.1:8443', tenant: process.env.FINERACT_TENANT || 'default',
  user: process.env.FINERACT_USER || 'mifos', pass: process.env.FINERACT_PASS || 'password'
};
export const runId = `${process.env.GITHUB_RUN_ID || 'local'}-${process.env.GITHUB_RUN_ATTEMPT || '1'}-${Date.now()}`;
export async function fineract(request, method, path, data) {
  const headers = { 'Fineract-Platform-TenantId': cfg.tenant, Authorization: `Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64')}`, 'Content-Type':'application/json' };
  const res = await request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, { method, headers, data, ignoreHTTPSErrors:true });
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw:text }; }
  expect(res.ok(), `${method} ${path} -> ${res.status()}\n${text}`).toBeTruthy();
  return body;
}
export async function login(page, user=cfg.user, pass=cfg.pass) {
  await page.goto('/');
  await page.locator('#l-server').fill(cfg.url); await page.locator('#l-tenant').fill(cfg.tenant);
  await page.locator('#l-user').fill(user); await page.locator('#l-pass').fill(pass); await page.locator('#l-btn').click();
  await expect(page.locator('#appShell')).toBeVisible({ timeout:60_000 });
}
export const date = () => new Date().toLocaleDateString('en-GB').split('/').join(' ');
