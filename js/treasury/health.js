import { api } from '../api.js';
import { store } from '../store.js';
import { TREASURY_DATATABLES } from '../api/treasury.js';
import { getThresholds } from './thresholds.js';

const STATUS = Object.freeze({ READY: 'READY', CONFIG_REQUIRED: 'CONFIG_REQUIRED', BROKEN: 'BROKEN' });

function requiredTableNames() {
  return TREASURY_DATATABLES.map(s => s.datatableName);
}

export async function getTreasuryHealth(officeId) {
  const auth = store.get('auth') || {};
  const office = officeId ?? auth.officeId ?? null;

  const health = {
    status: STATUS.BROKEN,
    datatablesPresent: false,
    missingDatatables: [],
    thresholdsConfigured: false,
    glMappingsConfigured: false,
    office
  };

  let registered = new Set();
  try {
    const existing = await api.dataTables.list();
    registered = new Set((existing || []).map(t => t.registeredTableName));
  } catch (err) {
    health.missingDatatables = requiredTableNames();
    return health;
  }
  const required = requiredTableNames();
  health.missingDatatables = required.filter(name => !registered.has(name));
  health.datatablesPresent = health.missingDatatables.length === 0;

  if (!health.datatablesPresent) {
    health.status = STATUS.BROKEN;
    return health;
  }

  if (office != null) {
    const t = await getThresholds(office).catch(() => null);
    if (t) {
      health.thresholdsConfigured = true;
      health.glMappingsConfigured = !!(t.vaultGlAccountId && t.cashAtTellersGlAccountId && t.bankGlAccountId);
    }
  }

  health.status = health.thresholdsConfigured && health.glMappingsConfigured
    ? STATUS.READY
    : STATUS.CONFIG_REQUIRED;
  return health;
}

export { STATUS as TREASURY_HEALTH_STATUS };
