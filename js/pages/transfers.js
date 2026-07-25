import { api } from '../api.js';
import { fmt, sb, escapeHtml, fmtDate } from '../utils.js';
import { toast } from '../ui.js';

export async function render(c) {
  c.innerHTML = `
  <div class="page active">
    <div class="page-header">
      <div><h1 class="page-title">Transfers & Remittances</h1><div class="page-subtitle">Account-to-account transfers</div></div>
    </div>
    <div class="card">
      <div class="tabs">
        <button class="tab active" data-tab="tr-pane">Account Transfers</button>
        <button class="tab" data-tab="rm-pane">Remittances</button>
        <button class="tab" data-tab="si-pane">Standing Instructions</button>
      </div>
      <div id="tr-pane" class="tab-panel active">
        <div class="flex justify-between mb-4">
          <span class="text-muted" id="tr-count">Loading transfers…</span>
          <button class="btn-primary" data-modal="newTransferModal"><i class="fa-solid fa-plus"></i> New Transfer</button>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Date</th><th>From Account</th><th>To Account</th><th>Amount</th><th>Currency</th><th>Status</th></tr></thead>
          <tbody id="tr-rows"><tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><div>Loading…</div></div></td></tr></tbody>
        </table></div>
      </div>
      <div id="rm-pane" class="tab-panel">
        <div class="flex justify-between mb-4">
          <span class="text-muted">International remittances</span>
          <button class="btn-primary" data-modal="remittanceModal"><i class="fa-solid fa-globe"></i> Send Remittance</button>
        </div>
        <div class="empty-state"><i class="fa-solid fa-globe"></i><div>No remittance records. Use "Send Remittance" to start.</div></div>
      </div>
      <div id="si-pane" class="tab-panel">
        <div class="flex justify-between mb-4">
          <span class="text-muted">Recurring transfer instructions</span>
          <button class="btn-ghost" id="newSIBtn"><i class="fa-solid fa-plus"></i> New Standing Instruction</button>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Name</th><th>From</th><th>To</th><th>Amount</th><th>Frequency</th><th>Status</th></tr></thead>
          <tbody id="si-rows"><tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><div>Loading…</div></div></td></tr></tbody>
        </table></div>
      </div>
    </div>
  </div>`;

  const [trRes, siRes] = await Promise.all([
    api.transfers.list({ limit: 50 }).catch(() => null),
    api.standingInstructions.list({ limit: 50 }).catch(() => null)
  ]);

  const trList = Array.isArray(trRes) ? trRes : (trRes?.pageItems || []);
  c.querySelector('#tr-count').textContent = `${trList.length} transfer(s)`;
  c.querySelector('#tr-rows').innerHTML = trList.length
    ? trList.map(t => `<tr>
        <td>${fmtDate(t.transferDate)}</td>
        <td class="mono">${escapeHtml(t.fromAccountNo || `#${t.fromAccount?.id || '—'}`)}</td>
        <td class="mono">${escapeHtml(t.toAccountNo || `#${t.toAccount?.id || '—'}`)}</td>
        <td class="mono">${fmt(t.transferAmount || 0)}</td>
        <td class="mono">${escapeHtml(t.currency?.code || '—')}</td>
        <td>${sb(t.transferType?.value || 'Completed')}</td></tr>`).join('')
    : '<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-right-left"></i><div>No transfers found</div></div></td></tr>';

  const siList = Array.isArray(siRes) ? siRes : (siRes?.pageItems || []);
  c.querySelector('#si-rows').innerHTML = siList.length
    ? siList.map(s => `<tr>
        <td>${escapeHtml(s.name || '—')}</td>
        <td class="mono">${escapeHtml(s.fromAccount?.accountNo || s.fromAccount?.glAccountName || (s.fromAccount?.id ? `#${s.fromAccount.id}` : '—'))}</td>
        <td class="mono">${escapeHtml(s.toAccount?.accountNo || s.toAccount?.glAccountName || (s.toAccount?.id ? `#${s.toAccount.id}` : '—'))}</td>
        <td class="mono">${fmt(s.amount || 0)}</td>
        <td>${escapeHtml(s.recurrenceType?.value || s.recurrenceType || '—')}</td>
        <td>${sb(s.status?.value || '—')}</td></tr>`).join('')
    : '<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-calendar-check"></i><div>No standing instructions</div></div></td></tr>';

  c.querySelector('#newSIBtn').addEventListener('click', () => {
    openStandingInstructionModal(() => render(c));
  });
}

async function openStandingInstructionModal(onSuccess) {
  const { api } = await import('../api.js');
  const { toast } = await import('../ui.js');
  const { LOCALE, DATE_FORMAT } = await import('../config.js');
  const { escapeHtml } = await import('../utils.js');

  const ACCT_TYPE = { savings: 2, loan: 1 };

  const [tpl, officesRaw] = await Promise.all([
    api.standingInstructions.template().catch(() => ({})),
    api.offices.list().catch(() => [])
  ]);
  const offices = Array.isArray(officesRaw) ? officesRaw : (officesRaw?.pageItems || []);

  const opt = (arr, sel) => (arr || []).map(o =>
    `<option value="${o.id}" ${sel === o.id ? 'selected' : ''}>${escapeHtml(o.value ?? o.name ?? String(o.id))}</option>`).join('');
  const officeOpts = offices.map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('');

  const transferTypes  = tpl.transferTypeOptions  || [{ id: 1, value: 'Account Transfer' }, { id: 2, value: 'Loan Repayment' }];
  const recTypes       = tpl.recurrenceTypeOptions || [{ id: 1, value: 'Periodic' }, { id: 2, value: 'As Per Dues' }];
  const recFreqs       = tpl.recurrenceFrequencyOptions || [{ id: 0, value: 'Days' }, { id: 1, value: 'Weeks' }, { id: 2, value: 'Months' }, { id: 3, value: 'Years' }];

  const mid = 'si-tr-' + Date.now();
  const m = document.createElement('div');
  m.id = mid;
  m.className = 'modal-overlay open';
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-modal', 'true');
  m.innerHTML = `
    <div class="modal modal-lg">
      <div class="modal-header"><h3>New Standing Instruction</h3><button data-close-modal>&times;</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <label class="full">Instruction name * <input id="si-name" class="form-control" required/></label>

          <div class="full"><b>From</b></div>
          <label>From office * <select id="si-from-office" class="form-control" required><option value="">Select office…</option>${officeOpts}</select></label>
          <label>From client * <select id="si-from-client" class="form-control" required disabled><option value="">Select office first…</option></select></label>
          <label class="full">From account * <select id="si-from-acct" class="form-control" required disabled><option value="">Select client first…</option></select></label>

          <div class="full"><b>To</b></div>
          <label>To office * <select id="si-to-office" class="form-control" required><option value="">Select office…</option>${officeOpts}</select></label>
          <label>To client * <select id="si-to-client" class="form-control" required disabled><option value="">Select office first…</option></select></label>
          <label class="full">To account * <select id="si-to-acct" class="form-control" required disabled><option value="">Select client first…</option></select></label>

          <div class="full"><b>Schedule</b></div>
          <label>Transfer type <select id="si-transfer-type" class="form-control">${opt(transferTypes)}</select></label>
          <label>Amount * <input type="number" step="0.01" id="si-amount" class="form-control" required/></label>
          <label>Recurrence type <select id="si-rec-type" class="form-control">${opt(recTypes)}</select></label>
          <label>Frequency unit <select id="si-rec-freq" class="form-control">${opt(recFreqs)}</select></label>
          <label>Every (interval) <input type="number" min="1" id="si-rec-interval" class="form-control" value="1"/></label>
          <label>Valid from * <input type="date" id="si-valid-from" class="form-control" required/></label>
          <label>Valid till <input type="date" id="si-valid-till" class="form-control"/></label>
        </div>
        <div class="msg-banner b-info mt-2">
          <i class="fa-solid fa-circle-info"></i>
          Transfers move funds between a client's savings/loan accounts. Pick each side's office, then
          client, then the specific account.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" data-close-modal>Cancel</button>
        <button class="btn-primary" id="si-save">Create</button>
      </div>
    </div>`;
  document.getElementById('modalRoot').appendChild(m);
  m.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => m.remove()));

  async function loadClients(officeId, clientSel, acctSel) {
    clientSel.disabled = true; acctSel.disabled = true;
    clientSel.innerHTML = '<option value="">Loading clients…</option>';
    acctSel.innerHTML = '<option value="">Select client first…</option>';
    try {
      const r = await api.clients.list({ officeId, limit: 200 });
      const clients = Array.isArray(r) ? r : (r?.pageItems || []);
      clientSel.innerHTML = '<option value="">Select client…</option>' +
        clients.map(cl => `<option value="${cl.id}">${escapeHtml(cl.displayName || cl.fullname || ('#' + cl.id))}</option>`).join('');
      clientSel.disabled = false;
    } catch {
      clientSel.innerHTML = '<option value="">Failed to load clients</option>';
    }
  }

  async function loadAccounts(clientId, acctSel) {
    acctSel.disabled = true;
    acctSel.innerHTML = '<option value="">Loading accounts…</option>';
    try {
      const res = await api.clients.accounts(clientId);
      const savings = (res?.savingsAccounts || []).map(a =>
        ({ id: a.id, type: ACCT_TYPE.savings, label: `Savings · ${a.accountNo} — ${a.productName || ''}` }));
      const loans = (res?.loanAccounts || []).map(a =>
        ({ id: a.id, type: ACCT_TYPE.loan, label: `Loan · ${a.accountNo} — ${a.productName || ''}` }));
      const all = [...savings, ...loans];
      if (!all.length) { acctSel.innerHTML = '<option value="">No accounts for this client</option>'; return; }
      acctSel.innerHTML = '<option value="">Select account…</option>' +
        all.map(a => `<option value="${a.id}" data-acct-type="${a.type}">${escapeHtml(a.label)}</option>`).join('');
      acctSel.disabled = false;
    } catch {
      acctSel.innerHTML = '<option value="">Failed to load accounts</option>';
    }
  }

  const fromOffice = m.querySelector('#si-from-office'), fromClient = m.querySelector('#si-from-client'), fromAcct = m.querySelector('#si-from-acct');
  const toOffice   = m.querySelector('#si-to-office'),   toClient   = m.querySelector('#si-to-client'),   toAcct   = m.querySelector('#si-to-acct');

  fromOffice.addEventListener('change', e => e.target.value && loadClients(e.target.value, fromClient, fromAcct));
  toOffice.addEventListener('change',   e => e.target.value && loadClients(e.target.value, toClient, toAcct));
  fromClient.addEventListener('change', e => e.target.value && loadAccounts(e.target.value, fromAcct));
  toClient.addEventListener('change',   e => e.target.value && loadAccounts(e.target.value, toAcct));

  m.querySelector('#si-save').addEventListener('click', async () => {
    const name = m.querySelector('#si-name').value.trim();
    const amount = parseFloat(m.querySelector('#si-amount').value);
    const validFrom = m.querySelector('#si-valid-from').value;

    const fromAcctOpt = fromAcct.selectedOptions[0];
    const toAcctOpt   = toAcct.selectedOptions[0];

    if (!name || isNaN(amount) || !validFrom || !fromOffice.value || !fromClient.value ||
        !fromAcct.value || !toOffice.value || !toClient.value || !toAcct.value) {
      toast('warn', 'Fill required fields', 'Name, amount, valid-from, and both from/to office+client+account are required.');
      return;
    }

    const payload = {
      name,
      amount,
      fromOfficeId:  parseInt(fromOffice.value),
      fromClientId:  parseInt(fromClient.value),
      fromAccountId: parseInt(fromAcct.value),
      fromAccountType: parseInt(fromAcctOpt?.dataset.acctType) || ACCT_TYPE.savings,
      toOfficeId:  parseInt(toOffice.value),
      toClientId:  parseInt(toClient.value),
      toAccountId: parseInt(toAcct.value),
      toAccountType: parseInt(toAcctOpt?.dataset.acctType) || ACCT_TYPE.savings,
      transferType: parseInt(m.querySelector('#si-transfer-type').value) || 1,
      instructionType: 1,
      priority: 3,
      status: 1,
      recurrenceType: parseInt(m.querySelector('#si-rec-type').value) || 1,
      recurrenceFrequency: parseInt(m.querySelector('#si-rec-freq').value),
      recurrenceInterval: parseInt(m.querySelector('#si-rec-interval').value) || 1,
      validFrom,
      validTill: m.querySelector('#si-valid-till').value || undefined,
      locale: LOCALE,
      dateFormat: DATE_FORMAT,
      monthDayFormat: 'dd MMMM'
    };
    if (isNaN(payload.recurrenceFrequency)) delete payload.recurrenceFrequency;

    const btn = m.querySelector('#si-save');
    btn.disabled = true;
    try {
      await api.standingInstructions.create(payload);
      toast('success', 'Standing instruction created', name);
      m.remove();
      if (onSuccess) onSuccess();
    } catch (e) {
      btn.disabled = false;
      const { extractFineractError } = await import('../ui/dom-helpers.js').catch(() => ({}));
      toast('error', 'Failed to create', extractFineractError ? extractFineractError(e) : (e.message || String(e)));
    }
  });
}
