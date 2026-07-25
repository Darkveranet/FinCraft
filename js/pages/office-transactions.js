import { api } from '../api.js';
import { confirm, toast } from '../ui.js';
import { escapeHtml, fmt, fmtDate } from '../utils.js';
import { extractFineractError } from '../ui/dom-helpers.js';

export async function render(c) {
  c.innerHTML = `
    <div class="page-header mb-3">
      <div>
        <h1>Inter-Office Cash Transactions</h1>
        <div class="text-muted">Move cash between branch offices</div>
      </div>
      <div class="page-actions"><button class="btn-primary" id="ot-new"><i class="fa-solid fa-right-left"></i> New Transfer</button></div>
    </div>
    <div class="card">
      <table class="table">
        <thead><tr><th>Date</th><th>From Office</th><th>To Office</th><th class="text-right">Amount</th><th>Currency</th><th></th></tr></thead>
        <tbody id="ot-rows"><tr><td colspan="6" class="empty-state-row">Loading…</td></tr></tbody>
      </table>
    </div>`;

  async function load() {
    try {
      const res = await api.officeTransactions.list();
      const rows = Array.isArray(res) ? res : (res?.pageItems || res?.transactions || []);
      c.querySelector('#ot-rows').innerHTML = rows.length ? rows.map(t => `
        <tr>
          <td>${fmtDate(t.transactionDate) || '—'}</td>
          <td>${escapeHtml(t.fromOfficeName || (t.fromOfficeId ? `#${t.fromOfficeId}` : '—'))}</td>
          <td>${escapeHtml(t.toOfficeName || (t.toOfficeId ? `#${t.toOfficeId}` : '—'))}</td>
          <td class="text-right">${fmt(t.transactionAmount || t.amount || 0)}</td>
          <td>${escapeHtml(t.currency?.code || t.currencyCode || '—')}</td>
          <td class="text-right"><button class="btn-mini btn-danger" data-del="${t.id}">Delete</button></td>
        </tr>`).join('') : '<tr><td colspan="6" class="empty-state-row">No inter-office transactions recorded</td></tr>';
      c.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
        if (!await confirm({ title: 'Delete transaction?', danger: true, confirmText: 'Delete' })) return;
        try { await api.officeTransactions.delete(b.dataset.del); toast('success', 'Deleted', ''); load(); }
        catch (e) { toast('error', 'Delete failed', extractFineractError(e)); }
      }));
    } catch (e) {
      c.querySelector('#ot-rows').innerHTML = `<tr><td colspan="6" class="text-error">${escapeHtml(extractFineractError(e))}</td></tr>`;
    }
  }

  c.querySelector('#ot-new').addEventListener('click', () => openModal(load));
  load();
}

async function openModal(onSuccess) {
  let tpl = {}, offices = [], currencies = [];
  try { tpl = await api.officeTransactions.template(); } catch {}
  offices = tpl.allowedOffices || tpl.officeOptions || [];
  if (!offices.length) { try { const o = await api.offices.list(); offices = Array.isArray(o) ? o : []; } catch {} }
  currencies = tpl.currencyOptions || [];

  const officeOpts = offices.map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('');
  const currOpts = currencies.length
    ? currencies.map(cu => `<option value="${escapeHtml(cu.code)}">${escapeHtml(cu.code)}${cu.name ? ' — ' + escapeHtml(cu.name) : ''}</option>`).join('')
    : '<option value="USD">USD</option>';

  const mid = 'ot-form-' + Date.now();
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-md">
        <div class="modal-header"><h3>New Inter-Office Transfer</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <label>From office * <select id="ot-from" class="form-control" required><option value="">Select…</option>${officeOpts}</select></label>
            <label>To office * <select id="ot-to" class="form-control" required><option value="">Select…</option>${officeOpts}</select></label>
            <label>Amount * <input type="number" step="0.01" id="ot-amount" class="form-control" required/></label>
            <label>Currency * <select id="ot-currency" class="form-control" required>${currOpts}</select></label>
            <label>Date * <input type="date" id="ot-date" class="form-control" value="${new Date().toISOString().slice(0,10)}" required/></label>
            <label>Type
              <select id="ot-type" class="form-control">
                <option value="1">Allocation (send cash)</option>
                <option value="2">Settlement (receive cash)</option>
              </select>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="ot-save">Transfer</button>
        </div>
      </div>
    </div>`);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));
  el.querySelector('#ot-save').addEventListener('click', async () => {
    const fromOfficeId = el.querySelector('#ot-from').value;
    const toOfficeId = el.querySelector('#ot-to').value;
    const amount = parseFloat(el.querySelector('#ot-amount').value);
    const transactionDate = el.querySelector('#ot-date').value;
    if (!fromOfficeId || !toOfficeId || isNaN(amount) || !transactionDate) { toast('warn', 'Fill required fields', ''); return; }
    if (fromOfficeId === toOfficeId) { toast('warn', 'From and To office must differ', ''); return; }
    const payload = {
      fromOfficeId: parseInt(fromOfficeId),
      toOfficeId: parseInt(toOfficeId),
      transactionAmount: amount,
      currencyCode: el.querySelector('#ot-currency').value,
      transactionDate,
      transactionType: parseInt(el.querySelector('#ot-type').value),
      dateFormat: 'yyyy-MM-dd', locale: 'en'
    };
    try { await api.officeTransactions.transfer(payload); el.remove(); toast('success', 'Transfer posted', ''); onSuccess(); }
    catch (e) { toast('error', 'Transfer failed', extractFineractError(e)); }
  });
}
