export const LOCALE      = 'en';
export const DATE_FORMAT = 'yyyy-MM-dd';

export function today() {
  return new Date().toISOString().split('T')[0];
}

export const FINERACT_DEMO = {
  serverUrl:  'https://demo.mifos.io',
  tenantId:   'default',
  apiBase:    '/fineract-provider/api/v1',
  requestTimeoutMs:     45000,
  autoConnectTimeoutMs: 15000
};

export function getRuntimeConfig() {
  return {
    apiBase:              FINERACT_DEMO.apiBase,
    requestTimeoutMs:     FINERACT_DEMO.requestTimeoutMs,
    autoConnectTimeoutMs: FINERACT_DEMO.autoConnectTimeoutMs
  };
}
