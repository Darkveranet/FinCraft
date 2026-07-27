import { DATE_FORMAT, LOCALE, today } from '../../../config.js';
import { api } from '../../../api.js';
import { escapeHtml } from '../../../utils.js';
import { glSelect, modal, populateGl, wizardModal, v, vb, vf, vi } from '../shared.js';
import { toast } from '../../../ui.js';

import { extractFineractError } from '../../../ui/dom-helpers.js';

/* ────────────────────────────────────────────────────────────────────────────
   New / Edit Loan Product — full Fineract field-set, presented as a 5-step
   wizard (Details → Terms → Interest & Grace → Settings → Accounting).
   All field IDs are preserved from the original flat form; new inputs cover the
   remaining POST/PUT /loanproducts columns Fineract accepts. Every panel is in
   the DOM at once, so capture/prefill/populateGl work exactly as before.
   ──────────────────────────────────────────────────────────────────────────── */
export async function openLoanProductModal(productId, onSuccess) {
  const isEdit = !!productId;
  let tpl = {}, existing = {};
  try {
    tpl = await api.loanProducts.template();
    if (isEdit) existing = await api.loanProducts.get(productId);
  } catch {}

  const opt = (arr, sel, valKey = 'id', labKey = 'value') =>
    (arr || []).map(o => `<option value="${o[valKey]}" ${String(sel) === String(o[valKey]) ? 'selected' : ''}>${escapeHtml(o[labKey] ?? o.name ?? o.code)}</option>`).join('');

  const amortTypes   = opt(tpl.amortizationTypeOptions, existing.amortizationType?.id);
  const intTypes     = opt(tpl.interestTypeOptions, existing.interestType?.id);
  const intCalcTypes = opt(tpl.interestCalculationPeriodTypeOptions, existing.interestCalculationPeriodType?.id);
  const repayFreqs   = opt(tpl.repaymentFrequencyTypeOptions, existing.repaymentFrequencyType?.id);
  const intRateFreqs = opt(tpl.interestRateFrequencyTypeOptions, existing.interestRateFrequencyType?.id ?? 3);
  const daysInYear   = opt(tpl.daysInYearTypeOptions, existing.daysInYearType?.id);
  const daysInMonth  = opt(tpl.daysInMonthTypeOptions, existing.daysInMonthType?.id);
  const funds        = opt(tpl.fundOptions, existing.fundId, 'id', 'name');
  const strategies   = (tpl.transactionProcessingStrategyOptions || []).map(o =>
    `<option value="${o.code}" ${existing.transactionProcessingStrategyCode === o.code ? 'selected' : ''}>${escapeHtml(o.name)}</option>`).join('');
  const currencies   = (tpl.currencyOptions || []).map(o => `<option value="${o.code}" ${existing.currency?.code === o.code ? 'selected' : ''}>${escapeHtml(o.name)} (${o.code})</option>`).join('');
  const currentAccRule = existing.accountingRule?.id || existing.accountingRule || 1;
  const accountingTypes = `
    <option value="1" ${currentAccRule === 1 ? 'selected' : ''}>None</option>
    <option value="2" ${currentAccRule === 2 ? 'selected' : ''}>Cash</option>
    <option value="3" ${currentAccRule === 3 ? 'selected' : ''}>Accrual (Periodic)</option>
    <option value="4" ${currentAccRule === 4 ? 'selected' : ''}>Accrual (Upfront)</option>`;

  // Charges the product can carry (fee + penalty), pre-ticked for edit.
  const attached = new Set((existing.charges || []).map(c => c.id));
  const chargeBoxes = (tpl.chargeOptions || []).length
    ? (tpl.chargeOptions || []).map(ch => `
        <label class="checkbox-row"><input type="checkbox" class="lp-charge" value="${ch.id}" ${attached.has(ch.id) ? 'checked' : ''}/>
          ${escapeHtml(ch.name)}${ch.amount != null ? ` — ${ch.amount}` : ''}${ch.penalty ? ' <span class="pill pill-warn">penalty</span>' : ''}</label>`).join('')
    : '<div class="form-section-note">No charges defined yet. Create charges under Products → Charges to attach them here.</div>';

  const mid = 'lp-modal-' + Date.now();

  const stepDetails = `
    <div class="form-grid">
      <label>Product name * <input id="lp-name" class="form-control" value="${escapeHtml(existing.name || '')}" required/></label>
      <label>Short name * <input id="lp-short" class="form-control" maxlength="4" value="${escapeHtml(existing.shortName || '')}" required/></label>
      <label class="full">Description <textarea id="lp-desc" class="form-control" rows="2">${escapeHtml(existing.description || '')}</textarea></label>
      <label>Fund <select id="lp-fund" class="form-control"><option value="">— None —</option>${funds}</select></label>
      <label>Currency *
        <select id="lp-currency" class="form-control" required><option value="">Select…</option>${currencies}</select>
      </label>
      <label>Decimal places <input type="number" id="lp-decimals" class="form-control" value="${existing.digitsAfterDecimal ?? 2}" min="0" max="6"/></label>
      <label>Currency in multiples of <input type="number" id="lp-multiples" class="form-control" value="${existing.inMultiplesOf ?? ''}" placeholder="e.g. 1"/></label>
      <label>Instalment amount in multiples of <input type="number" id="lp-inst-multiples" class="form-control" value="${existing.installmentAmountInMultiplesOf ?? ''}"/></label>
      <label>Start date <input type="date" id="lp-start" class="form-control" value="${existing.startDate || ''}"/></label>
      <label>Close date <input type="date" id="lp-close" class="form-control" value="${existing.closeDate || ''}"/></label>
      <label class="checkbox-row"><input type="checkbox" id="lp-borrower-cycle" ${existing.includeInBorrowerCycle ? 'checked' : ''}/> Include in customer loan counter</label>
    </div>`;

  const stepTerms = `
    <div class="form-section-note">Minimum / maximum bounds are optional; leave blank to lock the field to the default value.</div>
    <div class="form-grid">
      <label>Min principal <input type="number" step="0.01" id="lp-min-principal" class="form-control" value="${existing.minPrincipal ?? ''}"/></label>
      <label>Default principal * <input type="number" step="0.01" id="lp-principal" class="form-control" value="${existing.principal ?? ''}" required/></label>
      <label>Max principal <input type="number" step="0.01" id="lp-max-principal" class="form-control" value="${existing.maxPrincipal ?? ''}"/></label>
      <label>Min repayments <input type="number" id="lp-min-repayments" class="form-control" value="${existing.minNumberOfRepayments ?? ''}"/></label>
      <label>Default repayments * <input type="number" id="lp-repayments" class="form-control" value="${existing.numberOfRepayments ?? ''}" required/></label>
      <label>Max repayments <input type="number" id="lp-max-repayments" class="form-control" value="${existing.maxNumberOfRepayments ?? ''}"/></label>
      <label>Repaid every <input type="number" id="lp-repay-every" class="form-control" value="${existing.repaymentEvery ?? 1}"/></label>
      <label>Repayment frequency
        <select id="lp-repay-freq" class="form-control">${repayFreqs || '<option value="2" selected>Months</option>'}</select>
      </label>
      <label>Min days: disbursal → 1st repayment <input type="number" id="lp-min-gap" class="form-control" value="${existing.minimumDaysBetweenDisbursalAndFirstRepayment ?? ''}"/></label>
    </div>`;

  const stepInterest = `
    <div class="form-grid">
      <label>Min interest rate <input type="number" step="0.000001" id="lp-min-rate" class="form-control" value="${existing.minInterestRatePerPeriod ?? ''}"/></label>
      <label>Default interest rate (%) * <input type="number" step="0.000001" id="lp-rate" class="form-control" value="${existing.interestRatePerPeriod ?? ''}" required/></label>
      <label>Max interest rate <input type="number" step="0.000001" id="lp-max-rate" class="form-control" value="${existing.maxInterestRatePerPeriod ?? ''}"/></label>
      <label>Interest rate frequency
        <select id="lp-rate-freq" class="form-control">${intRateFreqs || '<option value="2">Per month</option><option value="3" selected>Per year</option>'}</select>
      </label>
      <label>Amortization
        <select id="lp-amort" class="form-control">${amortTypes || '<option value="0">Equal Principal Payments</option><option value="1" selected>Equal Installments</option>'}</select>
      </label>
      <label>Interest method
        <select id="lp-int-type" class="form-control">${intTypes || '<option value="0" selected>Declining Balance</option><option value="1">Flat</option>'}</select>
      </label>
      <label>Interest calculation period
        <select id="lp-int-calc" class="form-control">${intCalcTypes || '<option value="0">Daily</option><option value="1" selected>Same as repayment</option>'}</select>
      </label>
      <label>Days in year
        <select id="lp-days-year" class="form-control"><option value="">Product default</option>${daysInYear}</select>
      </label>
      <label>Days in month
        <select id="lp-days-month" class="form-control"><option value="">Product default</option>${daysInMonth}</select>
      </label>
      <label class="checkbox-row"><input type="checkbox" id="lp-partial-period" ${existing.allowPartialPeriodInterestCalcualtion ? 'checked' : ''}/> Allow partial-period interest</label>
    </div>
    <h4 class="mt-3">Moratorium / Grace &amp; Arrears</h4>
    <div class="form-grid">
      <label>Grace on principal <input type="number" id="lp-grace-pr" class="form-control" value="${existing.graceOnPrincipalPayment ?? 0}"/></label>
      <label>Grace on interest payment <input type="number" id="lp-grace-int" class="form-control" value="${existing.graceOnInterestPayment ?? 0}"/></label>
      <label>Grace on interest charged <input type="number" id="lp-grace-int-charged" class="form-control" value="${existing.graceOnInterestCharged ?? 0}"/></label>
      <label>Grace on arrears ageing <input type="number" id="lp-grace-arrears" class="form-control" value="${existing.graceOnArrearsAgeing ?? 0}"/></label>
      <label>Overdue days for NPA <input type="number" id="lp-npa-days" class="form-control" value="${existing.overdueDaysForNPA ?? ''}"/></label>
      <label>Arrears tolerance <input type="number" step="0.01" id="lp-arrears-tol" class="form-control" value="${existing.inArrearsTolerance ?? ''}"/></label>
    </div>`;

  const stepSettings = `
    <div class="form-grid">
      <label class="full">Repayment strategy
        <select id="lp-strategy" class="form-control">${strategies || '<option value="mifos-standard-strategy" selected>Penalties, Fees, Interest, Principal order</option>'}</select>
      </label>
      <label>Principal threshold for last instalment (%) <input type="number" step="0.01" id="lp-principal-threshold" class="form-control" value="${existing.principalThresholdForLastInstallment ?? ''}"/></label>
      <label class="checkbox-row"><input type="checkbox" id="lp-define-installment" ${existing.canDefineInstallmentAmount ? 'checked' : ''}/> Allow fixing of the instalment amount</label>
      <label class="checkbox-row"><input type="checkbox" id="lp-multi-disburse" ${existing.multiDisburseLoan ? 'checked' : ''}/> Multiple disbursals (tranches)</label>
      <label>Max tranche count <input type="number" id="lp-max-tranche" class="form-control" value="${existing.maxTrancheCount ?? ''}"/></label>
      <label>Max outstanding balance <input type="number" step="0.01" id="lp-max-outstanding" class="form-control" value="${existing.outstandingLoanBalance ?? ''}"/></label>
      <label class="checkbox-row"><input type="checkbox" id="lp-hold-guarantee" ${existing.holdGuaranteeFunds ? 'checked' : ''}/> Place guarantee funds on hold</label>
      <label class="checkbox-row"><input type="checkbox" id="lp-npa-arrears" ${existing.accountMovesOutOfNPAOnlyOnArrearsCompletion ? 'checked' : ''}/> Move out of NPA only when arrears cleared</label>
      <label class="checkbox-row"><input type="checkbox" id="lp-attribute-overrides" ${existing.allowAttributeOverrides ? 'checked' : ''}/> Allow terms to be overridden per loan</label>
    </div>
    <h4 class="mt-3">Charges</h4>
    <div class="form-grid full">${chargeBoxes}</div>`;

  const stepAccounting = `
    <div class="form-grid">
      <label class="full">Accounting rule <select id="lp-accounting" class="form-control">${accountingTypes}</select></label>
    </div>
    <div id="lp-gl-wrap" style="${currentAccRule !== 1 ? '' : 'display:none'}">
      <h4 class="mt-3">GL Account Mappings</h4>
      <div class="form-grid">
        ${glSelect('gl-lp-fund-source', 'Fund Source', true)}
        ${glSelect('gl-lp-loan-portfolio', 'Loan Portfolio', true)}
        ${glSelect('gl-lp-transfer-suspense', 'Transfer in Suspense')}
        ${glSelect('gl-lp-income-int', 'Income from Interest', true)}
        ${glSelect('gl-lp-income-fees', 'Income from Fees')}
        ${glSelect('gl-lp-income-penalties', 'Income from Penalties')}
        ${glSelect('gl-lp-income-recovery', 'Income from Recovery')}
        ${glSelect('gl-lp-losses', 'Losses Written Off')}
        ${glSelect('gl-lp-overpayment', 'Overpayment Liability')}
        ${glSelect('gl-lp-interest-recv', 'Interest Receivable')}
        ${glSelect('gl-lp-fees-recv', 'Fees Receivable')}
        ${glSelect('gl-lp-penalties-recv', 'Penalties Receivable')}
      </div>
    </div>`;

  const el = wizardModal(mid, isEdit ? 'Edit Loan Product' : 'New Loan Product', [
    { label: 'Details',    html: stepDetails },
    { label: 'Terms',      html: stepTerms },
    { label: 'Interest',   html: stepInterest },
    { label: 'Settings',   html: stepSettings },
    { label: 'Accounting', html: stepAccounting },
  ], { saveLabel: isEdit ? 'Save Changes' : 'Create Product' });

  el.querySelector('#lp-accounting').addEventListener('change', (e) => {
    el.querySelector('#lp-gl-wrap').style.display = e.target.value !== '1' ? '' : 'none';
  });

  await populateGl(el);

  if (isEdit && existing.accountingMappings) {
    const m = existing.accountingMappings;
    const setSel = (id, val) => { const s = el.querySelector('#' + id); if (s && val) s.value = String(val); };
    setSel('gl-lp-fund-source', m.fundSourceAccount?.id);
    setSel('gl-lp-loan-portfolio', m.loanPortfolioAccount?.id);
    setSel('gl-lp-transfer-suspense', m.transfersInSuspenseAccount?.id);
    setSel('gl-lp-income-int', m.interestOnLoanAccount?.id);
    setSel('gl-lp-income-fees', m.incomeFromFeeAccount?.id);
    setSel('gl-lp-income-penalties', m.incomeFromPenaltyAccount?.id);
    setSel('gl-lp-income-recovery', m.incomeFromRecoveryAccount?.id);
    setSel('gl-lp-losses', m.writeOffAccount?.id);
    setSel('gl-lp-overpayment', m.overpaymentLiabilityAccount?.id);
    setSel('gl-lp-interest-recv', m.receivableInterestAccount?.id);
    setSel('gl-lp-fees-recv', m.receivableFeeAccount?.id);
    setSel('gl-lp-penalties-recv', m.receivablePenaltyAccount?.id);
  }

  el.querySelector('#' + mid + '-save').addEventListener('click', async () => {
    const name = v(el, 'lp-name');
    const shortName = v(el, 'lp-short');
    const currencyCode = v(el, 'lp-currency');
    const principal = vf(el, 'lp-principal');
    const repayments = vi(el, 'lp-repayments');
    const rate = vf(el, 'lp-rate');

    if (!name || !shortName || !currencyCode || principal === null || !repayments || rate === null) {
      toast('warn', 'Fill required fields', 'Name, short name, currency, principal, repayments and interest rate are required.');
      return;
    }

    const accountingRule = vi(el, 'lp-accounting') || 1;
    const charges = [...el.querySelectorAll('.lp-charge:checked')].map(c => ({ id: Number(c.value) }));
    const payload = {
      name, shortName, currencyCode, locale: LOCALE, dateFormat: DATE_FORMAT,
      digitsAfterDecimal: vi(el, 'lp-decimals') ?? 2,
      inMultiplesOf: vi(el, 'lp-multiples') || undefined,
      installmentAmountInMultiplesOf: vi(el, 'lp-inst-multiples') || undefined,
      fundId: vi(el, 'lp-fund') || undefined,
      startDate: v(el, 'lp-start') || undefined,
      closeDate: v(el, 'lp-close') || undefined,
      includeInBorrowerCycle: vb(el, 'lp-borrower-cycle'),
      principal,
      minPrincipal: vf(el, 'lp-min-principal') || undefined,
      maxPrincipal: vf(el, 'lp-max-principal') || undefined,
      numberOfRepayments: repayments,
      minNumberOfRepayments: vi(el, 'lp-min-repayments') || undefined,
      maxNumberOfRepayments: vi(el, 'lp-max-repayments') || undefined,
      repaymentEvery: vi(el, 'lp-repay-every') || 1,
      repaymentFrequencyType: vi(el, 'lp-repay-freq') ?? 2,
      minimumDaysBetweenDisbursalAndFirstRepayment: vi(el, 'lp-min-gap') || undefined,
      interestRatePerPeriod: rate,
      minInterestRatePerPeriod: vf(el, 'lp-min-rate') || undefined,
      maxInterestRatePerPeriod: vf(el, 'lp-max-rate') || undefined,
      interestRateFrequencyType: vi(el, 'lp-rate-freq') ?? 3,
      amortizationType: vi(el, 'lp-amort') ?? 1,
      interestType: vi(el, 'lp-int-type') ?? 0,
      interestCalculationPeriodType: vi(el, 'lp-int-calc') ?? 1,
      allowPartialPeriodInterestCalcualtion: vb(el, 'lp-partial-period'),
      daysInYearType: vi(el, 'lp-days-year') || undefined,
      daysInMonthType: vi(el, 'lp-days-month') || undefined,
      graceOnPrincipalPayment: vi(el, 'lp-grace-pr') || undefined,
      graceOnInterestPayment: vi(el, 'lp-grace-int') || undefined,
      graceOnInterestCharged: vi(el, 'lp-grace-int-charged') || undefined,
      graceOnArrearsAgeing: vi(el, 'lp-grace-arrears') || undefined,
      overdueDaysForNPA: vi(el, 'lp-npa-days') || undefined,
      inArrearsTolerance: vf(el, 'lp-arrears-tol') || undefined,
      transactionProcessingStrategyCode: v(el, 'lp-strategy') || 'mifos-standard-strategy',
      principalThresholdForLastInstallment: vf(el, 'lp-principal-threshold') || undefined,
      canDefineInstallmentAmount: vb(el, 'lp-define-installment'),
      multiDisburseLoan: vb(el, 'lp-multi-disburse'),
      maxTrancheCount: vb(el, 'lp-multi-disburse') ? (vi(el, 'lp-max-tranche') || undefined) : undefined,
      outstandingLoanBalance: vb(el, 'lp-multi-disburse') ? (vf(el, 'lp-max-outstanding') || undefined) : undefined,
      holdGuaranteeFunds: vb(el, 'lp-hold-guarantee'),
      accountMovesOutOfNPAOnlyOnArrearsCompletion: vb(el, 'lp-npa-arrears'),
      allowAttributeOverrides: vb(el, 'lp-attribute-overrides') || undefined,
      accountingRule,
      description: v(el, 'lp-desc') || undefined
    };
    if (charges.length) payload.charges = charges;

    if (accountingRule !== 1) {
      const fs = vi(el, 'gl-lp-fund-source');
      const lp = vi(el, 'gl-lp-loan-portfolio');
      const ii = vi(el, 'gl-lp-income-int');
      if (!fs || !lp || !ii) { toast('warn', 'Fill required GL accounts', 'Fund Source, Loan Portfolio and Income from Interest are required.'); return; }
      payload.fundSourceAccountId = fs;
      payload.loanPortfolioAccountId = lp;
      payload.interestOnLoanAccountId = ii;
      const map = {
        'gl-lp-transfer-suspense': 'transfersInSuspenseAccountId',
        'gl-lp-income-fees': 'incomeFromFeeAccountId',
        'gl-lp-income-penalties': 'incomeFromPenaltyAccountId',
        'gl-lp-income-recovery': 'incomeFromRecoveryAccountId',
        'gl-lp-losses': 'writeOffAccountId',
        'gl-lp-overpayment': 'overpaymentLiabilityAccountId',
        'gl-lp-interest-recv': 'receivableInterestAccountId',
        'gl-lp-fees-recv': 'receivableFeeAccountId',
        'gl-lp-penalties-recv': 'receivablePenaltyAccountId',
      };
      for (const [id, key] of Object.entries(map)) { const val = vi(el, id); if (val) payload[key] = val; }
    }

    try {
      if (isEdit) await api.loanProducts.update(productId, payload);
      else        await api.loanProducts.create(payload);
      el.remove();
      toast('success', isEdit ? 'Loan product updated' : 'Loan product created', name);
      onSuccess();
    } catch (e) { toast('error', isEdit ? 'Update failed' : 'Create failed', extractFineractError(e)); }
  });
}

export async function openFloatingRateModal(rateId, onSuccess) {
  const isEdit = !!rateId;
  let existing = {};
  if (isEdit) {
    try { existing = await api.floatingRates.get(rateId); } catch {}
  }

  const ratePeriodRow = (period = {}) => `
    <div class="fr-period form-grid" style="margin-bottom:8px">
      <label>From date * <input type="date" class="form-control fr-from" value="${period.fromDate || today()}" required/></label>
      <label>Interest rate (%) * <input type="number" step="0.0001" class="form-control fr-rate" value="${period.interestRate ?? ''}" required/></label>
      ${!isEdit ? `<button type="button" class="btn-mini btn-danger fr-remove">Remove</button>` : ''}
    </div>`;

  const existingPeriods = Array.isArray(existing.ratePeriods) ? existing.ratePeriods : [];
  const periodsHtml = existingPeriods.length
    ? existingPeriods.map(p => ratePeriodRow(p)).join('')
    : ratePeriodRow();

  const mid = 'fr-modal-' + Date.now();
  const el = modal(mid, isEdit ? 'Edit Floating Rate' : 'New Floating Rate', `
    <div class="form-grid">
      <label>Rate name * <input id="fr-name" class="form-control" value="${escapeHtml(existing.name || '')}" required/></label>
      <label class="checkbox-row"><input type="checkbox" id="fr-base" ${existing.isBaseLendingRate ? 'checked' : ''}/> Is base lending rate</label>
      <label class="checkbox-row"><input type="checkbox" id="fr-active" ${existing.isActive !== false ? 'checked' : ''}/> Active</label>
    </div>

    <h4 class="mt-3">Rate Periods</h4>
    ${isEdit ? `<div class="msg-banner b-info mb-2">
      <i class="fa-solid fa-circle-info"></i>
      Existing rate periods are read-only. Add a new period below to create a new rate change effective on a future date.
    </div>` : ''}
    <div id="fr-periods">${periodsHtml}</div>
    <button class="btn-secondary btn-sm mt-2" id="fr-add-period"><i class="fa-solid fa-plus"></i> Add Period</button>`);

  const wireRemove = () => {
    el.querySelectorAll('.fr-remove').forEach(b => {
      if (!b.dataset.wired) {
        b.dataset.wired = '1';
        b.addEventListener('click', () => b.closest('.fr-period').remove());
      }
    });
  };
  wireRemove();

  el.querySelector('#fr-add-period').addEventListener('click', () => {
    el.querySelector('#fr-periods').insertAdjacentHTML('beforeend', `
      <div class="fr-period form-grid" style="margin-bottom:8px">
        <label>From date * <input type="date" class="form-control fr-from" value="${today()}" required/></label>
        <label>Interest rate (%) * <input type="number" step="0.0001" class="form-control fr-rate" required/></label>
        <button type="button" class="btn-mini btn-danger fr-remove">Remove</button>
      </div>`);
    wireRemove();
  });

  el.querySelector('#' + mid + '-save').addEventListener('click', async () => {
    const name = v(el, 'fr-name');
    if (!name) { toast('warn', 'Enter a rate name', ''); return; }

    const ratePeriods = [...el.querySelectorAll('.fr-period')].map(row => ({
      fromDate: row.querySelector('.fr-from').value,
      interestRate: parseFloat(row.querySelector('.fr-rate').value)
    })).filter(p => p.fromDate && !isNaN(p.interestRate));

    if (!ratePeriods.length) { toast('warn', 'Add at least one rate period', ''); return; }

    const payload = {
      name,
      isBaseLendingRate: vb(el, 'fr-base'),
      isActive: vb(el, 'fr-active'),
      ratePeriods,
      locale: LOCALE,
      dateFormat: DATE_FORMAT
    };

    try {
      if (isEdit) await api.floatingRates.update(rateId, payload);
      else        await api.floatingRates.create(payload);
      el.remove();
      toast('success', isEdit ? 'Floating rate updated' : 'Floating rate created', name);
      onSuccess();
    } catch (e) { toast('error', isEdit ? 'Update failed' : 'Create failed', extractFineractError(e)); }
  });
}
