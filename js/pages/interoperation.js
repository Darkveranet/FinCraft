import { api } from '../api.js';
import { toast } from '../ui.js';
import { escapeHtml } from '../utils.js';
import { extractFineractError } from '../ui/dom-helpers.js';

export async function render(c) {
  c.innerHTML = `
    <div class="page-header mb-3">
      <div><h1>Interoperation</h1><div class="text-muted">Mobile-money / interbank (MojaLoop) — health, party registry, and account inspection</div></div>
      <div class="page-actions"><button class="btn-secondary" id="io-health"><i class="fa-solid fa-heart-pulse"></i> Health Check</button></div>
    </div>
    <div id="io-health-out" class="mb-3"></div>

    <div class="card mb-4">
      <h3 class="mb-2">Party Lookup</h3>
      <div class="text-muted small mb-2"><i class="fa-solid fa-circle-info"></i> Resolve an account by an external identifier (e.g. MSISDN phone number).</div>
      <div class="form-grid mb-2">
        <label>ID type
          <select id="io-idtype" class="form-control">
            <option value="MSISDN">MSISDN (phone)</option>
            <option value="EMAIL">EMAIL</option>
            <option value="ACCOUNT_ID">ACCOUNT_ID</option>
            <option value="IBAN">IBAN</option>
            <option value="ALIAS">ALIAS</option>
          </select>
        </label>
        <label>ID value <input id="io-idvalue" class="form-control" placeholder="e.g. 27713803912"/></label>
      </div>
      <button class="btn-primary" id="io-party-lookup"><i class="fa-solid fa-magnifying-glass"></i> Lookup Party</button>
      <div id="io-party-out" class="mt-3"></div>
    </div>

    <div class="card">
      <h3 class="mb-2">Account Inspector</h3>
      <div class="form-grid mb-2">
        <label>Account ID <input id="io-acct" class="form-control" placeholder="Fineract savings/loan account id"/></label>
        <label>View
          <select id="io-acct-view" class="form-control">
            <option value="getAccount">Details</option>
            <option value="accountIdentifiers">Identifiers</option>
            <option value="accountKyc">KYC</option>
            <option value="accountTransactions">Transactions</option>
          </select>
        </label>
      </div>
      <button class="btn-primary" id="io-acct-go"><i class="fa-solid fa-eye"></i> Inspect</button>
      <div id="io-acct-out" class="mt-3"></div>
    </div>`;

  const json = (target, data) => {
    c.querySelector(target).innerHTML =
      `<pre style="max-height:360px;overflow:auto;border:1px solid var(--border-1);border-radius:6px;padding:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(typeof data === 'string' ? data : JSON.stringify(data, null, 2))}</pre>`;
  };
  const err = (target, e) => { c.querySelector(target).innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; };

  c.querySelector('#io-health').addEventListener('click', async () => {
    const o = c.querySelector('#io-health-out');
    o.innerHTML = '<div class="empty-state-row">Checking…</div>';
    try {
      const res = await api.interoperation.health();
      o.innerHTML = `<div class="msg-banner b-success"><i class="fa-solid fa-circle-check"></i> Interoperation service reachable. ${escapeHtml(typeof res === 'string' ? res : JSON.stringify(res))}</div>`;
    } catch (e) { o.innerHTML = `<div class="msg-banner b-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(extractFineractError(e))}</div>`; }
  });

  c.querySelector('#io-party-lookup').addEventListener('click', async () => {
    const idType = c.querySelector('#io-idtype').value;
    const idValue = c.querySelector('#io-idvalue').value.trim();
    if (!idValue) { toast('warn', 'Enter an ID value', ''); return; }
    c.querySelector('#io-party-out').innerHTML = '<div class="empty-state-row">Looking up…</div>';
    try { json('#io-party-out', await api.interoperation.getParty(idType, idValue)); }
    catch (e) { err('#io-party-out', e); }
  });

  c.querySelector('#io-acct-go').addEventListener('click', async () => {
    const acct = c.querySelector('#io-acct').value.trim();
    const view = c.querySelector('#io-acct-view').value;
    if (!acct) { toast('warn', 'Enter an account id', ''); return; }
    c.querySelector('#io-acct-out').innerHTML = '<div class="empty-state-row">Loading…</div>';
    try { json('#io-acct-out', await api.interoperation[view](acct)); }
    catch (e) { err('#io-acct-out', e); }
  });
}
