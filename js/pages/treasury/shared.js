import { escapeHtml } from '../../utils.js';
import { api } from '../../api.js';

export function officeOptionsHtml(offices, selectedId) {
  return offices.map(o => `<option value="${o.id}" ${Number(selectedId) === o.id ? 'selected' : ''}>${escapeHtml(o.name || '')}</option>`).join('');
}

export function liquidityBadgeClass(status) {
  return status === 'RED' ? 'b-danger' : status === 'AMBER' ? 'b-warning' : 'b-success';
}

export function liquidityAccentClass(status) {
  return status === 'RED' ? 'red' : status === 'AMBER' ? 'amber' : 'green';
}

export function matchBadgeClass(matches) {
  return matches === true ? 'b-success' : matches === false ? 'b-danger' : 'b-warning';
}

export function glOptionsHtml(glAccounts, selectedId, includeNone = true) {
  const opts = includeNone ? ['<option value="">— none —</option>'] : [];
  for (const g of (Array.isArray(glAccounts) ? glAccounts : [])) {
    const sel = Number(selectedId) === g.id ? 'selected' : '';
    opts.push(`<option value="${g.id}" ${sel}>${escapeHtml(g.glCode || '')} — ${escapeHtml(g.name || '')}</option>`);
  }
  return opts.join('');
}

export function statusBadgeClass(status) {
  switch (status) {
    case 'PAID': case 'ACTIVE': case 'APPROVED': return 'b-success';
    case 'REJECTED': return 'b-danger';
    case 'PENDING': case 'SUBMITTED': case 'OPEN': case 'PARTIALLY_PAID': return 'b-warning';
    case 'CLOSED': case 'SCHEDULED': return 'b-info';
    default: return 'b-info';
  }
}

export function fmtMoney(amount, currencyCode) {
  if (amount === null || amount === undefined) return '—';
  const n = Number(amount);
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currencyCode ? `${currencyCode} ${formatted}` : formatted;
}

export function tellerCashierOptionsHtml(list) {
  if (!list.length) return '<option value="">No tellers/cashiers configured</option>';
  return list.map(tc => `<option value="${tc.tellerId}:${tc.cashierId}">${escapeHtml(tc.tellerName || `Teller ${tc.tellerId}`)} — ${escapeHtml(tc.cashierName)}</option>`).join('');
}

export async function loadOfficeTellerCashierList(officeId) {
  const allTellers = await api.tellers.list().catch(() => []);
  const officeTellers = (Array.isArray(allTellers) ? allTellers : []).filter(t => t.officeId === officeId);

  const rows = [];
  for (const teller of officeTellers) {
    const result = await api.tellers.cashiers(teller.id).catch(() => null);
    const cashiers = result?.cashiers || [];
    for (const cashier of cashiers) {
      rows.push({ tellerId: teller.id, tellerName: teller.name, cashierId: cashier.id, cashierName: cashier.staffName || cashier.description || `Cashier ${cashier.id}` });
    }
  }
  return rows;
}
