import { api } from '../../api.js';
import { DATE_FORMAT, LOCALE, today } from '../../config.js';
import { toast } from '../../ui.js';
import { escapeHtml, fmt, num } from '../../utils.js';
import { can } from './shared.js';
import { extractFineractError } from '../../ui/dom-helpers.js';

/* ────────────────────────────────────────────────────────────────────────────
   Open Savings Account — full-page 4-step wizard
   (Account Holder → Product → Terms → Review).

   Real Fineract mapping (POST /savingsaccounts):
     clientId, productId, submittedOnDate, fieldOfficerId?, externalId?,
     nominalAnnualInterestRate? (defaults to the product rate when blank).
   Optional "approve & activate immediately" replays the same approve→activate
   calls the list page uses, so a teller can open a ready-to-use account.
   ──────────────────────────────────────────────────────────────────────────── */

export async function renderNew(c) {
  if (!can('CREATE_SAVINGSACCOUNT')) {
    c.innerHTML = `<div class="card"><div class="empty-state"><i class="fa-solid fa-ban"></i><div>You don't have permission to open savings accounts.</div></div></div>`;
    return;
  }

  const state = {
    step: 1,
    clientId: '', clientName: '', officeId: '', officeName: '',
    productId: '', productName: '', rate: null, currency: '',
    nominalRate: '', externalId: '', autoActivate: true
  };

  let clients = [], offices = [], products = [];
  try {
    const [cl, off, pr] = await Promise.allSettled([
      api.clients.list({ limit: 500 }), api.offices.list(), api.savingsProducts.list()
    ]);
    const clRaw = cl.status === 'fulfilled' ? cl.value : [];
    clients = Array.isArray(clRaw) ? clRaw : (clRaw?.pageItems || []);
    offices = off.status === 'fulfilled' && Array.isArray(off.value) ? off.value : [];
    products = pr.status === 'fulfilled' && Array.isArray(pr.value) ? pr.value : [];
  } catch { /* degrade */ }
  if (clients[0]) { state.clientId = String(clients[0].id); state.clientName = clients[0].displayName || clients[0].fullname; state.officeId = String(clients[0].officeId || ''); }
  if (offices[0] && !state.officeId) { state.officeId = String(offices[0].id); state.officeName = offices[0].name; }

  const STEPS = ['Account Holder', 'Product', 'Terms', 'Review'];

  function stepper() {
    return `<div class="stepper">${STEPS.map((s, i) => {
      const n = i + 1;
      const cls = state.step === n ? 'active' : (state.step > n ? 'done' : '');
      return `<div class="step-item"><div class="step-circle ${cls}">${state.step > n ? '<i class="fa-solid fa-check"></i>' : n}</div><div class="step-label ${cls}">${s}</div></div>${n < STEPS.length ? `<div class="step-line ${state.step > n ? 'done' : ''}"></div>` : ''}`;
    }).join('')}</div>`;
  }

  function body() {
    if (state.step === 1) {
      return `
        <div class="wz-step-title">Account Holder</div>
        <div class="wz-grid">
          <div class="wz-field full"><label>Customer <span class="req">*</span></label>
            <select id="wz-client" class="form-control">
              ${clients.map(cl => `<option value="${cl.id}" data-office="${cl.officeId ?? ''}" ${String(state.clientId) === String(cl.id) ? 'selected' : ''}>${escapeHtml(cl.displayName || cl.fullname || ('#' + cl.id))}${cl.accountNo ? ` (${escapeHtml(cl.accountNo)})` : ''}</option>`).join('')}
            </select></div>
          <div class="wz-field full"><label>Branch</label>
            <select id="wz-office" class="form-control">
              ${offices.map(o => `<option value="${o.id}" ${String(state.officeId) === String(o.id) ? 'selected' : ''}>${escapeHtml(o.name)}</option>`).join('')}
            </select></div>
        </div>`;
    }
    if (state.step === 2) {
      const p = products.find(pr => String(pr.id) === String(state.productId));
      const strip = p ? `
        <div class="wz-info-strip">
          <div><div class="k">Nominal Rate</div><div class="v">${p.nominalAnnualInterestRate != null ? num(p.nominalAnnualInterestRate) + '% p.a.' : '—'}</div></div>
          <div><div class="k">Currency</div><div class="v">${escapeHtml(p.currency?.code || p.currencyCode || '—')}</div></div>
          <div><div class="k">Min Opening</div><div class="v">${p.minRequiredOpeningBalance != null ? fmt(p.minRequiredOpeningBalance) : '—'}</div></div>
        </div>` : '';
      return `
        <div class="wz-step-title">Savings Product</div>
        <div class="wz-field full" style="margin-bottom:14px"><label>Product <span class="req">*</span></label>
          <select id="wz-product" class="form-control">
            <option value="">Select a product…</option>
            ${products.map(pr => `<option value="${pr.id}" ${String(state.productId) === String(pr.id) ? 'selected' : ''}>${escapeHtml(pr.name)}${pr.nominalAnnualInterestRate != null ? ` — ${num(pr.nominalAnnualInterestRate)}% p.a.` : ''}</option>`).join('')}
          </select></div>
        ${strip}`;
    }
    if (state.step === 3) {
      return `
        <div class="wz-step-title">Account Terms</div>
        <div class="wz-grid">
          <div class="wz-field"><label>Nominal Annual Interest %</label><input id="wz-rate" type="number" min="0" step="0.01" class="form-control" value="${escapeHtml(state.nominalRate)}" placeholder="Leave blank to use product rate"/></div>
          <div class="wz-field"><label>External ID</label><input id="wz-ext" class="form-control" value="${escapeHtml(state.externalId)}" placeholder="Optional reference"/></div>
          <div class="wz-field full">
            <label class="form-check" style="align-items:center;gap:8px;flex-direction:row">
              <input type="checkbox" id="wz-auto" ${state.autoActivate ? 'checked' : ''}/> <span>Also approve &amp; activate immediately</span>
            </label>
            <div class="wz-hint">When on, the account is created, approved and activated in one go (ready for deposits).</div>
          </div>
        </div>`;
    }
    const p = products.find(pr => String(pr.id) === String(state.productId));
    const dash = (v) => v ? escapeHtml(v) : '—';
    return `
      <div class="wz-step-title">Review &amp; Submit</div>
      <div class="wz-review-grid">
        <div class="wz-rv"><div class="k">Customer</div><div class="v">${dash(state.clientName)}</div></div>
        <div class="wz-rv"><div class="k">Branch</div><div class="v">${dash(state.officeName)}</div></div>
        <div class="wz-rv"><div class="k">Product</div><div class="v">${dash(state.productName || p?.name)}</div></div>
        <div class="wz-rv"><div class="k">Interest Rate</div><div class="v">${state.nominalRate ? num(state.nominalRate) + '% p.a.' : (p?.nominalAnnualInterestRate != null ? num(p.nominalAnnualInterestRate) + '% p.a. (product default)' : '—')}</div></div>
        <div class="wz-rv"><div class="k">On Submit</div><div class="v">${state.autoActivate ? 'Create → Approve → Activate' : 'Create (pending approval)'}</div></div>
      </div>`;
  }

  function render() {
    c.innerHTML = `
      <div class="wz-head">
        <div><h1>Open Savings Account</h1><div class="wz-sub">Open a new savings account for a customer</div></div>
        <button class="cv-btn-ghost" id="wz-back-top"><i class="fa-solid fa-arrow-left"></i> Back</button>
      </div>
      <div class="wz-card">
        ${stepper()}
        <div id="wz-body">${body()}</div>
        <div class="wz-nav">
          <button class="btn-secondary" id="wz-prev" ${state.step === 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-left"></i> Previous</button>
          ${state.step < 4
            ? `<button class="btn-primary" id="wz-next">Next <i class="fa-solid fa-arrow-right"></i></button>`
            : `<button class="btn-primary" id="wz-submit"><i class="fa-solid fa-check"></i> Open Account</button>`}
        </div>
      </div>`;
    wire();
  }

  function capture() {
    if (state.step === 1) {
      const csel = c.querySelector('#wz-client');
      if (csel) { state.clientId = csel.value; state.clientName = csel.selectedOptions[0]?.textContent?.replace(/\s*\(.*\)$/, '').trim() || ''; }
      const osel = c.querySelector('#wz-office');
      if (osel) { state.officeId = osel.value; state.officeName = osel.selectedOptions[0]?.textContent?.trim() || ''; }
    }
    if (state.step === 2) {
      const psel = c.querySelector('#wz-product');
      if (psel) {
        state.productId = psel.value;
        state.productName = psel.selectedOptions[0]?.textContent?.replace(/\s*—.*$/, '').trim() || '';
        const p = products.find(pr => String(pr.id) === String(state.productId));
        state.rate = p?.nominalAnnualInterestRate ?? null;
      }
    }
    if (state.step === 3) {
      state.nominalRate = c.querySelector('#wz-rate')?.value || '';
      state.externalId = c.querySelector('#wz-ext')?.value.trim() || '';
      state.autoActivate = !!c.querySelector('#wz-auto')?.checked;
    }
  }

  function validate() {
    if (state.step === 1 && !state.clientId) { toast('warn', 'Customer required', 'Select a customer'); return false; }
    if (state.step === 2 && !state.productId) { toast('warn', 'Product required', 'Select a savings product'); return false; }
    return true;
  }

  function wire() {
    c.querySelector('#wz-back-top')?.addEventListener('click', () => import('../../router.js').then(r => r.navigate('savings')));
    c.querySelector('#wz-prev')?.addEventListener('click', () => { capture(); if (state.step > 1) { state.step--; render(); } });
    c.querySelector('#wz-next')?.addEventListener('click', () => { capture(); if (!validate()) return; state.step++; render(); });
    c.querySelector('#wz-submit')?.addEventListener('click', submit);
    c.querySelector('#wz-product')?.addEventListener('change', () => { capture(); render(); });
  }

  async function submit() {
    capture();
    const btn = c.querySelector('#wz-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Opening…'; }

    const sub = today();
    const payload = {
      dateFormat: DATE_FORMAT, locale: LOCALE,
      clientId: parseInt(state.clientId),
      productId: parseInt(state.productId),
      submittedOnDate: sub
    };
    if (state.nominalRate) payload.nominalAnnualInterestRate = parseFloat(state.nominalRate);
    if (state.externalId) payload.externalId = state.externalId;

    try {
      const r = await api.savings.create(payload);
      const id = r.savingsId || r.resourceId;
      let msg = 'Savings application submitted';
      if (state.autoActivate && id) {
        try {
          await api.savings.approve(id, { approvedOnDate: sub, dateFormat: DATE_FORMAT, locale: LOCALE });
          try {
            await api.savings.activate(id, { activatedOnDate: sub, dateFormat: DATE_FORMAT, locale: LOCALE });
            msg = 'Account created, approved & activated';
          } catch (actErr) { toast('warn', 'Created & approved, activation failed', extractFineractError(actErr)); msg = null; }
        } catch (appErr) { toast('warn', 'Created, approval failed', extractFineractError(appErr)); msg = null; }
      }
      if (msg) toast('success', msg, `#${id}`);
      import('../../router.js').then(rt => rt.navigate('savings', { id }));
    } catch (e) {
      toast('error', 'Could not open account', extractFineractError(e));
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Open Account'; }
    }
  }

  render();
}
