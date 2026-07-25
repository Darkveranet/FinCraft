import { api } from '../api.js';
import { store } from '../store.js';
import { getThresholds, upsertThresholds } from './thresholds.js';

const _ensuredTenants = new Map();

function currentTenantId() {
  return (store.get('auth') || {}).tenantId || 'default';
}

export async function ensureTreasuryDatatables({ force = false } = {}) {
  const tenantId = currentTenantId();
  if (!force && _ensuredTenants.has(tenantId)) return _ensuredTenants.get(tenantId);

  const p = api.treasury.ensureTreasuryDatatables();
  _ensuredTenants.set(tenantId, p);
  try {
    return await p;
  } catch (err) {
    _ensuredTenants.delete(tenantId);
    throw err;
  }
}

export async function seedTreasuryThresholds(officeId, seed = {}) {
  const existing = await getThresholds(officeId).catch(() => null);
  if (existing) return existing;

  const currencyCode = seed.currencyCode || store.get('defaultCurrency') || null;
  const haveRequiredGls = seed.vaultGlAccountId && seed.cashAtTellersGlAccountId && seed.bankGlAccountId;
  if (!haveRequiredGls || !currencyCode) {
    return null;
  }

  await upsertThresholds(officeId, {
    vaultGlAccountId: seed.vaultGlAccountId,
    cashAtTellersGlAccountId: seed.cashAtTellersGlAccountId,
    bankGlAccountId: seed.bankGlAccountId,
    reserveBufferAmount: seed.reserveBufferAmount ?? 0,
    currencyCode
  });
  return getThresholds(officeId);
}

export async function validateTreasuryConfiguration(officeId) {
  const thresholds = await getThresholds(officeId).catch(() => null);
  return { configured: !!thresholds, requiresSetup: !thresholds, thresholds };
}

export async function initializeTreasuryTenant(officeId, opts = {}) {
  const tenantId = currentTenantId();
  const auth = store.get('auth') || {};
  const resolvedOffice = officeId ?? auth.officeId ?? null;

  const result = {
    tenantId,
    provisioning: { created: [], alreadyPresent: [], failed: [] },
    office: resolvedOffice,
    configured: false,
    requiresSetup: true,
    ok: false
  };

  try {
    result.provisioning = await ensureTreasuryDatatables({ force: opts.force });
  } catch (err) {
    result.provisioning = { created: [], alreadyPresent: [], failed: [{ name: 'ensureTreasuryDatatables', error: err?.message || String(err) }] };
    return result;
  }

  if (resolvedOffice != null) {
    const cfg = await validateTreasuryConfiguration(resolvedOffice);
    result.configured = cfg.configured;
    result.requiresSetup = cfg.requiresSetup;
  }

  result.ok = (result.provisioning.failed || []).length === 0;
  return result;
}

export function _resetBootstrapCache() {
  _ensuredTenants.clear();
}
