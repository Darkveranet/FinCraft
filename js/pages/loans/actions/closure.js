import { DATE_FORMAT, LOCALE, today } from '../../../config.js';
import { api } from '../../../api.js';
import { escapeHtml } from '../../../utils.js';
import { toast } from '../../../ui.js';

import { extractFineractError } from '../../../ui/dom-helpers.js';
export async function openChargeOffModal(id) {
  // Fetch ChargeOffReasons code values (native Fineract field) — degrade gracefully if absent.
  let reasons = [];
  try {
    const code = await api.codes.getByName('ChargeOffReasons');
    if (code?.id) { const vals = await api.codes.values(code.id); reasons = Array.isArray(vals) ? vals : []; }
  } catch { /* code not configured on this tenant */ }

  const mid = `ln-chargeoff-${Date.now()}`;
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-sm">
        <div class="modal-header"><h3>Charge Off Loan</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">
          <label>Transaction date * <input type="date" id="co-date" class="form-control" value="${today()}" required/></label>
          <label class="mt-2">Charge-off reason
            <select id="co-reason" class="form-control">
              <option value="">— None —</option>
              ${reasons.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}
            </select>
          </label>
          <label class="mt-2">Note <textarea id="co-note" class="form-control" rows="2"></textarea></label>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="co-save">Charge Off Loan</button>
        </div>
      </div>
    </div>`);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));
  el.querySelector('#co-save').addEventListener('click', async () => {
    const transactionDate = el.querySelector('#co-date').value;
    if (!transactionDate) { toast('warn', 'Select a date', ''); return; }
    const payload = { transactionDate, dateFormat: DATE_FORMAT, locale: LOCALE };
    const reasonId = el.querySelector('#co-reason').value;
    if (reasonId) payload.chargeOffReasonId = parseInt(reasonId);
    const note = el.querySelector('#co-note').value.trim();
    if (note) payload.note = note;
    try {
      await api.loans.chargeOff(id, payload);
      el.remove();
      toast('success', 'Loan charged off', `Loan #${id}`);
      document.dispatchEvent(new CustomEvent('fc:reload'));
    } catch (e) { toast('error', 'Charge off failed', extractFineractError(e)); }
  });
}

export function openForecloseModal(id) {
  openSimpleLoanCmdModal({ id, command: 'foreclosure', label: 'Foreclose Loan', dateField: 'transactionDate' });
}

export function openCloseLoanModal(id) {
  openSimpleLoanCmdModal({ id, command: 'close', label: 'Close Loan', dateField: 'transactionDate' });
}

export function openSimpleLoanCmdModal({ id, command, label, dateField = 'transactionDate', isTransaction = false, amountRequired = false }) {
  const mid = `lncmd-${Date.now()}`;
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-sm">
        <div class="modal-header"><h3>${escapeHtml(label)}</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">
          <label>Date * <input type="date" id="cmd-date" class="form-control" value="${today()}" required/></label>
          ${amountRequired ? `<label class="mt-2">Amount * <input type="number" step="0.01" id="cmd-amount" class="form-control" required/></label>` : ''}
          <label class="mt-2">Note <textarea id="cmd-note" class="form-control" rows="2"></textarea></label>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="cmd-save">${escapeHtml(label)}</button>
        </div>
      </div>
    </div>`);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));
  el.querySelector('#cmd-save').addEventListener('click', async () => {
 const payload = {
      [dateField]: el.querySelector('#cmd-date').value,
      dateFormat: DATE_FORMAT,
      locale: LOCALE
    };
    if (amountRequired) {
      const amt = parseFloat(el.querySelector('#cmd-amount').value);
      if (isNaN(amt)) { toast('warn', 'Enter amount', ''); return; }
      payload.transactionAmount = amt;
    }
    const note = el.querySelector('#cmd-note').value.trim();
    if (note) payload.note = note;
    try {
      const apiMethodMap = {
        recoverypayment: 'recoverPayment',
        chargeOff:       'chargeOff',
        foreclosure:     'foreclose',
        close:           'close',
      };
      const methodName = apiMethodMap[command];
      if (methodName && typeof api.loans[methodName] === 'function') {
        await api.loans[methodName](id, payload);
      } else {
        await api.loans.command(id, command, payload);
      }
      el.remove();
      toast('success', `${label} successful`, `Loan #${id}`);
      document.dispatchEvent(new CustomEvent('fc:reload'));
    } catch (e) { toast('error', `${label} failed`, extractFineractError(e)); }
  });
}
