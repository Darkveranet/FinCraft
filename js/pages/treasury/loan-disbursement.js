import { api } from '../../api.js';
import { store } from '../../store.js';
import { toast } from '../../ui.js';
import { escapeHtml } from '../../utils.js';
import { disburseLoanThroughCashier } from '../../treasury/loan-disbursement.js';
import { TreasuryReconciliationGapError } from '../../treasury/errors.js';
import { officeOptionsHtml, loadOfficeTellerCashierList, tellerCashierOptionsHtml, fmtMoney } from './shared.js';

function today() { return new Date().toISOString().slice(0, 10); }

function loanOptionsHtml(loans) {
  if (!loans.length) return '<option value="">No loans awaiting disbursal at this office</option>';
  return loans.map(l => `<option value="${l.id}">${escapeHtml(l.accountNo || `#${l.id}`)} — ${escapeHtml(l.clientName || l.clientDisplayName || 'Unknown client')} (${fmtMoney(l.principal, l.currencyCode)})</option>`).join('');
}

async function loadApprovedLoans(officeId) {
  const res = await api.loans.list({ officeId, status: 'approved', limit: 200 });
  const raw = Array.isArray(res) ? res : (res?.pageItems || []);
  return raw.map(l => ({
    id: l.id,
    accountNo: l.accountNo,
    clientName: l.clientName || l.clientDisplayName,
    principal: l.principal ?? l.approvedPrincipal ?? 0,
    currencyCode: l.currency?.code
  }));
}

async function loadFormForOffice(c, officeId) {
  const body = c.querySelector('#tld-form-body');
  body.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><div>Loading loans and tellers…</div></div>';

  const [loans, tellerCashierList, paymentTypes] = await Promise.all([
    loadApprovedLoans(officeId).catch(err => { toast('error', 'Failed to load loans', err?.message || String(err)); return []; }),
    loadOfficeTellerCashierList(officeId).catch(err => { toast('error', 'Failed to load tellers', err?.message || String(err)); return []; }),
    api.paymentTypes.list().catch(() => [])
  ]);
  const loansById = new Map(loans.map(l => [String(l.id), l]));

  const ready = loans.length && tellerCashierList.length;
  body.innerHTML = `
    <div class="form-grid">
      <label><span class="form-label">Loan (awaiting disbursal)</span>
        <select class="form-control" id="tld-loan">${loanOptionsHtml(loans)}</select>
      </label>
      <label><span class="form-label">Teller / Cashier</span>
        <select class="form-control" id="tld-tc">${tellerCashierOptionsHtml(tellerCashierList)}</select>
      </label>
      <label><span class="form-label">Amount</span>
        <input class="form-control" id="tld-amount" type="number" min="0.01" step="0.01" placeholder="0.00"/>
      </label>
      <label><span class="form-label">Disbursement Date</span>
        <input class="form-control" id="tld-date" type="date" value="${today()}"/>
      </label>
      <label><span class="form-label">Payment Type</span>
        <select class="form-control" id="tld-pt">
          <option value="">—</option>
          ${(Array.isArray(paymentTypes) ? paymentTypes : []).map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
        </select>
      </label>
      <label><span class="form-label">Note</span>
        <input class="form-control" id="tld-note" placeholder="Optional"/>
      </label>
      <button class="btn-primary mt-2" id="tld-submit" ${ready ? '' : 'disabled'}>
        <i class="fa-solid fa-money-bill-transfer"></i> Disburse Through Teller
      </button>
    </div>`;

  const loanSelect = c.querySelector('#tld-loan');
  const amountInput = c.querySelector('#tld-amount');
  const prefillAmount = () => {
    const loan = loansById.get(loanSelect.value);
    if (loan) amountInput.value = loan.principal || '';
  };
  loanSelect?.addEventListener('change', prefillAmount);
  prefillAmount();

  c.querySelector('#tld-submit')?.addEventListener('click', async () => {
    const btn = c.querySelector('#tld-submit');
    const loanId = Number(loanSelect.value);
    const loan = loansById.get(loanSelect.value);
    const tcValue = c.querySelector('#tld-tc').value;
    const [tellerId, cashierId] = tcValue.split(':').map(Number);
    const amount = Number(amountInput.value);
    const transactionDate = c.querySelector('#tld-date').value;
    const paymentTypeIdRaw = c.querySelector('#tld-pt').value;
    const note = c.querySelector('#tld-note').value.trim();
    const performedBy = (store.get('auth') || {}).username;

    if (!loanId) { toast('warn', 'Select a loan', 'Choose a loan awaiting disbursal'); return; }
    if (!(amount > 0)) { toast('warn', 'Invalid amount', 'Enter an amount greater than zero'); return; }
    if (!transactionDate) { toast('warn', 'Missing date', 'Select a disbursement date'); return; }

    btn.disabled = true;
    try {
      const result = await disburseLoanThroughCashier({
        officeId, loanId, tellerId, cashierId, amount, transactionDate,
        paymentTypeId: paymentTypeIdRaw ? Number(paymentTypeIdRaw) : undefined,
        note, currencyCode: loan?.currencyCode, performedBy
      });
      toast('success', 'Loan disbursed', `Disbursed ${fmtMoney(amount, loan?.currencyCode)} for loan ${loan?.accountNo || loanId} (Fineract resource ${result.fineractResourceId}).`);
      c.querySelector('#tld-note').value = '';
      await loadFormForOffice(c, officeId);
    } catch (err) {
      if (err instanceof TreasuryReconciliationGapError) {
        toast('error', 'Reconciliation gap — action required', err.message);
      } else {
        toast('error', 'Disbursement failed', err?.message || String(err));
      }
    } finally {
      btn.disabled = false;
    }
  });
}

export async function loanDisbursement(c) {
  c.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Loan Disbursement Through Teller</h1>
        <div class="page-subtitle">Disburse an approved loan and hand the cash out through a teller/cashier in one step</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Office</h3>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <label><span class="form-label">Office</span>
            <select class="form-control" id="tld-office"><option>Loading…</option></select>
          </label>
        </div>
      </div>
    </div>
    <div class="card mt-3">
      <div class="card-header"><h3 class="card-title">Disburse</h3></div>
      <div class="card-body" id="tld-form-body">
        <div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><div>Loading…</div></div>
      </div>
    </div>`;

  let offices = [];
  try { offices = await api.offices.list(); } catch (err) { toast('error', 'Failed to load offices', err?.message || String(err)); }
  offices = Array.isArray(offices) ? offices : [];

  const officeSelect = c.querySelector('#tld-office');
  if (!offices.length) {
    officeSelect.innerHTML = '<option>No offices found</option>';
    c.querySelector('#tld-form-body').innerHTML = '<div class="empty-state">No offices available.</div>';
    return;
  }
  officeSelect.innerHTML = officeOptionsHtml(offices, offices[0].id);
  await loadFormForOffice(c, offices[0].id);

  officeSelect.addEventListener('change', () => loadFormForOffice(c, Number(officeSelect.value)));
}
