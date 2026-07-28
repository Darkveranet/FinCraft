/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · recent-tenants.js

   The "recent tenants" persistence cluster, extracted out of auth.js (§2 of the
   developer-recommendations report). This is the most self-contained slice of
   the former 800-line auth.js: it touches only localStorage and has no cross-
   dependencies on session/OIDC logic, so lifting it out is behaviour-preserving.

   Stores the last few {serverUrl, tenantId, username, lastUsed} the user signed
   in with, so the login screen can offer quick re-selection.
   ──────────────────────────────────────────────────────────────────────────── */

const RECENT_TENANTS_KEY = 'fincraft.recentTenants';
const MAX_RECENT_TENANTS = 5;

export function loadRecentTenants() {
  try {
    const raw = localStorage.getItem(RECENT_TENANTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveRecentTenant(serverUrl, tenantId, username) {
  try {
    const all = loadRecentTenants();
    const filtered = all.filter(t => !(t.tenantId === tenantId && t.serverUrl === serverUrl));
    filtered.unshift({ tenantId, serverUrl, username, lastUsed: Date.now() });
    localStorage.setItem(RECENT_TENANTS_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT_TENANTS)));
  } catch {}
}

export function removeRecentTenant(tenantId, serverUrl) {
  try {
    const all = loadRecentTenants();
    const filtered = all.filter(t => !(t.tenantId === tenantId && t.serverUrl === serverUrl));
    localStorage.setItem(RECENT_TENANTS_KEY, JSON.stringify(filtered));
  } catch {}
}
