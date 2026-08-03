import { expect } from '@playwright/test';
export const cfg = {
  url: process.env.FINERACT_URL || 'https://127.0.0.1:8443', tenant: process.env.FINERACT_TENANT || 'default',
  user: process.env.FINERACT_USER || 'mifos', pass: process.env.FINERACT_PASS || 'password'
};
function authHeaders() {
  return { 'Fineract-Platform-TenantId': cfg.tenant, Authorization: `Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64')}`, 'Content-Type':'application/json' };
}
export async function fineract(request, method, path) {
  const res = await request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, { method, headers: authHeaders(), ignoreHTTPSErrors:true });
  const text = await res.text();
  expect(res.ok(), `${method} ${path} -> ${res.status()}\n${text}`).toBeTruthy();
}
export async function fineractExpectRejected(request, method, path, data) {
  const res = await request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, { method, headers: authHeaders(), data, ignoreHTTPSErrors:true });
  expect(res.ok(), `expected ${method} ${path} to be REJECTED for missing required fields, got ${res.status()}`).toBeFalsy();
}
