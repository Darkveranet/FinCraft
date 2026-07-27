import { api } from '../../api.js';
import { DATE_FORMAT, LOCALE, today } from '../../config.js';
import { toast } from '../../ui.js';
import { escapeHtml, fmt, num } from '../../utils.js';
import { can } from './shared.js';
import { extractFineractError } from '../../ui/dom-helpers.js';

/* ────────────────────────────────────────────────────────────────────────────
   New Loan Application — full-page 4-step wizard
   (Applicant → Loan Details → Assessment → Review).

   Real Fineract mapping (POST /loans):
     clientId, productId, loanType, principal, numberOfRepayments,
     repaymentEvery/repaymentFrequencyType, interestRatePerPeriod + the product
     defaults (amortization/interest type/strategy) pulled from GET /loans/template
     so the application matches the product's terms exactly.
   Assessment inputs (monthly income/expenses, source of repayment, guarantor
   names) and the free-text purpose have no native column on loan-create, so they
   are preserved as a Note on the created loan — nothing is dropped. Guarantors
   can then be formally attached from the loan's Credit Assessment tab.
   ──────────────────────────────────────────────────────────────────────────── */

export async function renderNew(c) {
  if (!can('CREATE_LOAN')) {
    c.innerHTML = `<div class="card"><div class="empty-state"><i class="fa-solid fa-ban"></i><div>You don't have permission to create loans.</div></div></div>`;
    return;
  }

  const state = {
    step: 1,
    clientId: '', clientName: '', officeId: '', officeName: '',
    productId: '', productName: '', principal: '', tenure: 12, purpose: '',
    income: '', expenses: '', repaymentSource: '', guarantors: '',
    // native Fineract loan-create columns
    loanOfficerId: '', fundId: '', loanPurposeId: '', externalId: '', linkAccountId: '',
    submittedOnDate: today(), expectedDisbursementDate: today(), expectedFirstRepaymentOnDate: '',
    rate: null, minP: null, maxP: null, tpl: null
  };

  let clients = [], offices = [], products = [];
  try {
    const [cl, off, pr] = await Promise.allSettled([
      api.clients.list({ limit: 500 }), api.offices.list(), api.loanProducts.list()
    ]);
    const clRaw = cl.status === 'fulfilled' ? cl.value : [];
    clients = Array.isArray(clRaw) ? clRaw : (clRaw?.pageItems || []);
    offices = off.status === 'fulfilled' && Array.isArray(off.value) ? off.value : [];
    products = pr.status === 'fulfilled' && Array.isArray(pr.value) ? pr.value : [];
  } catch { /* degrade */ }
  // Loan officers, funds, purposes and the client's savings accounts come from
  // the loan template — pulled lazily on the Loan Details step (see capture()).
  if (clients[0]) { state.clientId = String(clients[0].id); state.clientName = clients[0].displayName || clients[0].fullname; state.officeId = String(clients[0].officeId || ''); }
  if (offices[0] && !state.officeId) { state.officeId = String(offices[0].id); state.officeName = offices[0].name; }

  const STEPS = ['Applicant', 'Loan Details', 'Assessment', 'Review'];

  function stepper() {
    return `<div class="stepper">${STEPS.map((s, i) => {
      const n = i + 1;
      const cls = state.step === n ? 'active' : (state.step > n ? 'done' : '');
      return `<div class="step-item"><div class="step-circle ${cls}">${state.step > n ? '<i class="fa-solid fa-check"></i>' : n}</div><div class="step-label ${cls}">${s}</div></div>${n < STEPS.length ? `<div class="step-line ${state.step > n ? 'done' : ''}"></div>` : ''}`;
    }).join('')}</div>`;
  }

  // Simple declining-balance monthly payment estimate for the Review step.
  function estMonthly() {
    const P = parseFloat(state.principal) || 0;
    const n = parseInt(state.tenure) || 0;
    const annual = state.rate != null ? Number(state.rate) : 0;
    if (!P || !n) return 0;
    const r = (annual / 100) / 12;             // monthly rate (product rate is p.a. here)
    if (!r) return P / n;
    return (P * r) / (1 - Math.pow(1 + r, -n));
  }

  function body() {
    if (state.step === 1) {
      return `
        <div class="wz-step-title">Applicant Information</div>
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
          <div><div class="k">Min Amount</div><div class="v">${p.minPrincipal != null ? fmt(p.minPrincipal) : '—'}</div></div>
          <div><div class="k">Max Amount</div><div class="v">${p.maxPrincipal != null ? fmt(p.maxPrincipal) : '—'}</div></div>
          <div><div class="k">Interest Rate</div><div class="v">${p.interestRatePerPeriod != null ? num(p.interestRatePerPeriod) + '% p.a.' : '—'}</div></div>
        </div>` : '';
      return `
        <div class="wz-step-title">Loan Details</div>
        <div class="wz-field full" style="margin-bottom:14px"><label>Loan Product <span class="req">*</span></label>
          <select id="wz-product" class="form-control">
            <option value="">Select a product…</option>
            ${products.map(pr => `<option value="${pr.id}" ${String(state.productId) === String(pr.id) ? 'selected' : ''}>${escapeHtml(pr.name)}${pr.interestRatePerPeriod != null ? ` — ${num(pr.interestRatePerPeriod)}% p.a.` : ''}</option>`).join('')}
          </select></div>
        ${strip}
        <div class="wz-grid">
          <div class="wz-field"><label>Amount Requested <span class="req">*</span></label><input id="wz-principal" type="number" min="0" step="0.01" class="form-control" value="${escapeHtml(state.principal)}" placeholder="₦"/></div>
          <div class="wz-field"><label>Tenure (months) <span class="req">*</span></label><input id="wz-tenure" type="number" min="1" class="form-control" value="${escapeHtml(String(state.tenure))}"/></div>
          <div class="wz-field"><label>Submitted On <span class="req">*</span></label><input id="wz-submitted" type="date" class="form-control" value="${escapeHtml(state.submittedOnDate)}"/></div>
          <div class="wz-field"><label>Expected Disbursement <span class="req">*</span></label><input id="wz-disburse" type="date" class="form-control" value="${escapeHtml(state.expectedDisbursementDate)}"/></div>
          <div class="wz-field"><label>Expected First Repayment</label><input id="wz-firstrepay" type="date" class="form-control" value="${escapeHtml(state.expectedFirstRepaymentOnDate)}"/></div>
          <div class="wz-field"><label>Loan Officer</label>
            <select id="wz-officer" class="form-control">
              <option value="">— Unassigned —</option>
              ${(state.tpl?.loanOfficerOptions || []).map(o => `<option value="${o.id}" ${String(state.loanOfficerId) === String(o.id) ? 'selected' : ''}>${escapeHtml(o.displayName || o.name)}</option>`).join('')}
            </select></div>
          <div class="wz-field"><label>Fund</label>
            <select id="wz-fund" class="form-control">
              <option value="">— None —</option>
              ${(state.tpl?.fundOptions || []).map(o => `<option value="${o.id}" ${String(state.fundId) === String(o.id) ? 'selected' : ''}>${escapeHtml(o.name)}</option>`).join('')}
            </select></div>
          <div class="wz-field"><label>Loan Purpose</label>
            <select id="wz-purpose-id" class="form-control">
              <option value="">Select…</option>
              ${(state.tpl?.loanPurposeOptions || []).map(o => `<option value="${o.id}" ${String(state.loanPurposeId) === String(o.id) ? 'selected' : ''}>${escapeHtml(o.name)}</option>`).join('')}
            </select></div>
          <div class="wz-field"><label>Link Savings Account</label>
            <select id="wz-link" class="form-control">
              <option value="">— None —</option>
              ${(state.tpl?.accountLinkingOptions || []).map(o => `<option value="${o.id}" ${String(state.linkAccountId) === String(o.id) ? 'selected' : ''}>${escapeHtml(o.accountNo || o.productName || ('#' + o.id))}</option>`).join('')}
            </select></div>
          <div class="wz-field"><label>External ID</label><input id="wz-ext" class="form-control" value="${escapeHtml(state.externalId)}" placeholder="Your own reference"/></div>
          <div class="wz-field full"><label>Purpose Notes</label><textarea id="wz-purpose" class="form-control" rows="2">${escapeHtml(state.purpose)}</textarea></div>
        </div>`;
    }
    if (state.step === 3) {
      return `
        <div class="wz-step-title">Financial Assessment</div>
        <div class="wz-grid">
          <div class="wz-field"><label>Monthly Income</label><input id="wz-income" type="number" min="0" step="0.01" class="form-control" value="${escapeHtml(state.income)}" placeholder="₦"/></div>
          <div class="wz-field"><label>Monthly Expenses</label><input id="wz-expenses" type="number" min="0" step="0.01" class="form-control" value="${escapeHtml(state.expenses)}" placeholder="₦"/></div>
          <div class="wz-field full"><label>Source of Repayment</label><input id="wz-repay" class="form-control" value="${escapeHtml(state.repaymentSource)}" placeholder="e.g. Business revenue, salary"/></div>
          <div class="wz-field full"><label>Guarantors</label><input id="wz-guarantors" class="form-control" value="${escapeHtml(state.guarantors)}" placeholder="Enter guarantor names (comma separated)"/>
            <div class="wz-hint">Names are recorded on the application; attach formal guarantor records from the loan's Credit Assessment tab.</div></div>
        </div>`;
    }
    // Review
    const p = products.find(pr => String(pr.id) === String(state.productId));
    const monthly = estMonthly();
    const total = monthly * (parseInt(state.tenure) || 0);
    const dash = (v) => v ? escapeHtml(v) : '—';
    return `
      <div class="wz-step-title">Review &amp; Submit</div>
      <div class="wz-review-grid">
        <div class="wz-rv"><div class="k">Customer</div><div class="v">${dash(state.clientName)}</div></div>
        <div class="wz-rv"><div class="k">Product</div><div class="v">${dash(state.productName || p?.name)}</div></div>
        <div class="wz-rv"><div class="k">Amount</div><div class="v">${state.principal ? fmt(parseFloat(state.principal)) : '—'}</div></div>
        <div class="wz-rv"><div class="k">Tenure</div><div class="v">${state.tenure} months</div></div>
        <div class="wz-rv"><div class="k">Interest Rate</div><div class="v">${state.rate != null ? num(state.rate) + '% p.a.' : '—'}</div></div>
        <div class="wz-rv"><div class="k">Monthly Payment <span class="wz-hint">(est.)</span></div><div class="v">${monthly ? fmt(monthly) : '—'}</div></div>
        <div class="wz-rv"><div class="k">Total Payable <span class="wz-hint">(est.)</span></div><div class="v">${total ? fmt(total) : '—'}</div></div>
        <div class="wz-rv"><div class="k">Purpose</div><div class="v">${dash(state.purpose)}</div></div>
      </div>`;
  }

  function render() {
    c.innerHTML = `
      <div class="wz-head">
        <div><h1>New Loan Application</h1><div class="wz-sub">Submit a new loan application for review and approval</div></div>
        <button class="cv-btn-ghost" id="wz-back-top"><i class="fa-solid fa-arrow-left"></i> Back</button>
      </div>
      <div class="wz-card">
        ${stepper()}
        <div id="wz-body">${body()}</div>
        <div class="wz-nav">
          <button class="btn-secondary" id="wz-prev" ${state.step === 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-left"></i> Previous</button>
          ${state.step < 4
            ? `<button class="btn-primary" id="wz-next">Next <i class="fa-solid fa-arrow-right"></i></button>`
            : `<button class="btn-primary" id="wz-submit"><i class="fa-solid fa-check"></i> Submit Application</button>`}
        </div>
      </div>`;
    wire();
  }

  async function capture() {
    if (state.step === 1) {
      const csel = c.querySelector('#wz-client');
      if (csel) { state.clientId = csel.value; state.clientName = csel.selectedOptions[0]?.textContent?.replace(/\s*\(.*\)$/, '').trim() || ''; }
      const osel = c.querySelector('#wz-office');
      if (osel) { state.officeId = osel.value; state.officeName = osel.selectedOptions[0]?.textContent?.trim() || ''; }
    }
    if (state.step === 2) {
      const psel = c.querySelector('#wz-product');
      if (psel && psel.value !== state.productId) {
        state.productId = psel.value;
        state.productName = psel.selectedOptions[0]?.textContent?.replace(/\s*—.*$/, '').trim() || '';
        const p = products.find(pr => String(pr.id) === String(state.productId));
        state.rate = p?.interestRatePerPeriod ?? null;
        // Pull the product's real create-defaults from the loan template.
        if (state.productId && state.clientId) {
          try {
            state.tpl = await api.loans.template({ templateType: 'individual', clientId: state.clientId, productId: state.productId });
            if (state.tpl?.numberOfRepayments && (!state.tenure || state.tenure === 12)) state.tenure = state.tpl.numberOfRepayments;
            if (state.rate == null && state.tpl?.interestRatePerPeriod != null) state.rate = state.tpl.interestRatePerPeriod;
          } catch { /* optional */ }
        }
      }
      state.principal = c.querySelector('#wz-principal')?.value || '';
      state.tenure = c.querySelector('#wz-tenure')?.value || state.tenure;
      state.purpose = c.querySelector('#wz-purpose')?.value.trim() || '';
      state.submittedOnDate = c.querySelector('#wz-submitted')?.value || state.submittedOnDate;
      state.expectedDisbursementDate = c.querySelector('#wz-disburse')?.value || state.expectedDisbursementDate;
      state.expectedFirstRepaymentOnDate = c.querySelector('#wz-firstrepay')?.value || '';
      state.loanOfficerId = c.querySelector('#wz-officer')?.value || '';
      state.fundId = c.querySelector('#wz-fund')?.value || '';
      state.loanPurposeId = c.querySelector('#wz-purpose-id')?.value || '';
      state.linkAccountId = c.querySelector('#wz-link')?.value || '';
      state.externalId = c.querySelector('#wz-ext')?.value.trim() || '';
    }
    if (state.step === 3) {
      state.income = c.querySelector('#wz-income')?.value || '';
      state.expenses = c.querySelector('#wz-expenses')?.value || '';
      state.repaymentSource = c.querySelector('#wz-repay')?.value.trim() || '';
      state.guarantors = c.querySelector('#wz-guarantors')?.value.trim() || '';
    }
  }

  function validate() {
    if (state.step === 1 && !state.clientId) { toast('warn', 'Customer required', 'Select a customer'); return false; }
    if (state.step === 2) {
      if (!state.productId) { toast('warn', 'Product required', 'Select a loan product'); return false; }
      if (!state.principal || parseFloat(state.principal) <= 0) { toast('warn', 'Amount required', 'Enter the amount requested'); return false; }
      if (!state.tenure || parseInt(state.tenure) <= 0) { toast('warn', 'Tenure required', 'Enter the tenure in months'); return false; }
    }
    return true;
  }

  function wire() {
    c.querySelector('#wz-back-top')?.addEventListener('click', () => import('../../router.js').then(r => r.navigate('loans')));
    c.querySelector('#wz-prev')?.addEventListener('click', async () => { await capture(); if (state.step > 1) { state.step--; render(); } });
    c.querySelector('#wz-next')?.addEventListener('click', async () => { await capture(); if (!validate()) return; state.step++; render(); });
    c.querySelector('#wz-submit')?.addEventListener('click', submit);
    // Re-render the info strip immediately when the product changes on step 2.
    c.querySelector('#wz-product')?.addEventListener('change', async () => { await capture(); render(); });
  }

  async function submit() {
    await capture();
    const btn = c.querySelector('#wz-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting…'; }

    const tpl = state.tpl || {};
    const payload = {
      dateFormat: DATE_FORMAT, locale: LOCALE,
      clientId: parseInt(state.clientId),
      productId: parseInt(state.productId),
      loanType: 'individual',
      principal: parseFloat(state.principal),
      numberOfRepayments: parseInt(state.tenure) || tpl.numberOfRepayments || 12,
      repaymentEvery: tpl.repaymentEvery || 1,
      repaymentFrequencyType: tpl.repaymentFrequencyType?.id ?? tpl.repaymentFrequencyType ?? 2, // months
      interestRatePerPeriod: state.rate != null ? Number(state.rate) : (tpl.interestRatePerPeriod || 0),
      interestRateFrequencyType: tpl.interestRateFrequencyType?.id ?? tpl.interestRateFrequencyType ?? 3, // per year
      amortizationType: tpl.amortizationType?.id ?? tpl.amortizationType ?? 1,
      interestType: tpl.interestType?.id ?? tpl.interestType ?? 0,
      interestCalculationPeriodType: tpl.interestCalculationPeriodType?.id ?? tpl.interestCalculationPeriodType ?? 1,
      transactionProcessingStrategyCode: tpl.transactionProcessingStrategyCode || tpl.transactionProcessingStrategyOptions?.[0]?.code || 'mifos-standard-strategy',
      expectedDisbursementDate: state.expectedDisbursementDate || today(),
      submittedOnDate: state.submittedOnDate || today()
    };
    if (state.expectedFirstRepaymentOnDate) payload.repaymentsStartingFromDate = state.expectedFirstRepaymentOnDate;
    if (state.loanOfficerId) payload.loanOfficerId = parseInt(state.loanOfficerId);
    if (state.fundId) payload.fundId = parseInt(state.fundId);
    if (state.loanPurposeId) payload.loanPurposeId = parseInt(state.loanPurposeId);
    if (state.linkAccountId) payload.linkAccountId = parseInt(state.linkAccountId);
    if (state.externalId) payload.externalId = state.externalId;

    try {
      const r = await api.loans.create(payload);
      const id = r.loanId || r.resourceId;
      toast('success', 'Loan application submitted', `Loan #${id}`);

      // Preserve assessment + free-text purpose (no native loan-create columns) as a Note.
      const bits = [];
      if (state.purpose) bits.push(`Purpose: ${state.purpose}`);
      if (state.income) bits.push(`Monthly income: ${state.income}`);
      if (state.expenses) bits.push(`Monthly expenses: ${state.expenses}`);
      if (state.repaymentSource) bits.push(`Source of repayment: ${state.repaymentSource}`);
      if (state.guarantors) bits.push(`Proposed guarantors: ${state.guarantors}`);
      if (id && bits.length) {
        try { await api.notes.create('loans', id, { note: bits.join('\n') }); }
        catch (e) { console.warn('[new-loan] note skipped:', e?.message); }
      }

      import('../../router.js').then(rt => rt.navigate('loans', { id }));
    } catch (e) {
      toast('error', 'Submission failed', extractFineractError(e));
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Submit Application'; }
    }
  }

  render();
}
