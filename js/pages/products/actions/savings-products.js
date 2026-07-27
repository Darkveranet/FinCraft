import { LOCALE } from '../../../config.js';
import { api } from '../../../api.js';
import { escapeHtml } from '../../../utils.js';
import { glSelect, modal, populateGl, wizardModal, v, vb, vf, vi } from '../shared.js';
import { toast } from '../../../ui.js';

import { extractFineractError } from '../../../ui/dom-helpers.js';

const opt = (arr, sel) => (arr || []).map(o => `<option value="${o.id}" ${sel === o.id ? 'selected' : ''}>${escapeHtml(o.value)}</option>`).join('');
const termPeriods = (sel = 2) => `
  <option value="0" ${sel === 0 ? 'selected' : ''}>Days</option>
  <option value="1" ${sel === 1 ? 'selected' : ''}>Weeks</option>
  <option value="2" ${sel === 2 ? 'selected' : ''}>Months</option>
  <option value="3" ${sel === 3 ? 'selected' : ''}>Years</option>`;

/* Charges the deposit/savings product can carry, pre-ticked for edit. */
function chargeBoxes(prefix, tpl, existing) {
  const attached = new Set((existing.charges || []).map(c => c.id));
  return (tpl.chargeOptions || []).length
    ? (tpl.chargeOptions || []).map(ch => `
        <label class="checkbox-row"><input type="checkbox" class="${prefix}-charge" value="${ch.id}" ${attached.has(ch.id) ? 'checked' : ''}/>
          ${escapeHtml(ch.name)}${ch.amount != null ? ` — ${ch.amount}` : ''}${ch.penalty ? ' <span class="pill pill-warn">penalty</span>' : ''}</label>`).join('')
    : '<div class="form-section-note">No charges defined yet. Create charges under Products → Charges to attach them here.</div>';
}

/* ────────────────────────────────────────────────────────────────────────────
   Savings Product — 4-step wizard with the full Fineract field-set
   (Details → Interest → Settings & Overdraft → Accounting).
   ──────────────────────────────────────────────────────────────────────────── */
export async function openSavingsProductModal(productId, onSuccess) {
  const isEdit = !!productId;
  let tpl = {}, existing = {};
  try {
    tpl = await api.savingsProducts.template();
    if (isEdit) existing = await api.savingsProducts.get(productId);
  } catch {}

  const currencies   = (tpl.currencyOptions || []).map(o => `<option value="${o.code}" ${existing.currency?.code === o.code ? 'selected' : ''}>${escapeHtml(o.name)} (${o.code})</option>`).join('');
  const intCalcTypes = opt(tpl.interestCalculationTypeOptions, existing.interestCalculationType?.id);
  const intCompTypes = opt(tpl.interestCompoundingPeriodTypeOptions, existing.interestCompoundingPeriodType?.id);
  const intPostTypes = opt(tpl.interestPostingPeriodTypeOptions, existing.interestPostingPeriodType?.id);
  const currentAccRule = existing.accountingRule?.id || existing.accountingRule || 1;
  const accountingTypes = `
    <option value="1" ${currentAccRule === 1 ? 'selected' : ''}>None</option>
    <option value="2" ${currentAccRule === 2 ? 'selected' : ''}>Cash</option>`;
  const allowOverdraft = !!existing.allowOverdraft;

  const mid = 'sp-modal-' + Date.now();

  const stepDetails = `
    <div class="form-grid">
      <label>Product name * <input id="sp-name" class="form-control" value="${escapeHtml(existing.name || '')}" required/></label>
      <label>Short name * <input id="sp-short" class="form-control" maxlength="4" value="${escapeHtml(existing.shortName || '')}" required/></label>
      <label class="full">Description <textarea id="sp-desc" class="form-control" rows="2">${escapeHtml(existing.description || '')}</textarea></label>
      <label>Currency *
        <select id="sp-currency" class="form-control" required><option value="">Select…</option>${currencies}</select>
      </label>
      <label>Decimal places <input type="number" id="sp-decimals" class="form-control" value="${existing.digitsAfterDecimal ?? 2}"/></label>
      <label>Currency in multiples of <input type="number" id="sp-multiples" class="form-control" value="${existing.inMultiplesOf ?? ''}" placeholder="e.g. 1"/></label>
      <label>Min opening balance <input type="number" step="0.01" id="sp-min-bal" class="form-control" value="${existing.minRequiredOpeningBalance ?? ''}"/></label>
    </div>`;

  const stepInterest = `
    <div class="form-grid">
      <label>Nominal annual rate (%) * <input type="number" step="0.000001" id="sp-rate" class="form-control" value="${existing.nominalAnnualInterestRate ?? ''}" required/></label>
      <label>Interest compounding
        <select id="sp-compound" class="form-control">${intCompTypes || '<option value="1">Daily</option><option value="4" selected>Monthly</option>'}</select>
      </label>
      <label>Interest posting
        <select id="sp-posting" class="form-control">${intPostTypes || '<option value="4" selected>Monthly</option><option value="5">Quarterly</option>'}</select>
      </label>
      <label>Interest calculated using
        <select id="sp-calc" class="form-control">${intCalcTypes || '<option value="1" selected>Daily Balance</option>'}</select>
      </label>
      <label>Days in year
        <select id="sp-days" class="form-control">
          <option value="360" ${existing.interestCalculationDaysInYearType?.id === 360 ? 'selected' : ''}>360</option>
          <option value="365" ${(existing.interestCalculationDaysInYearType?.id || 365) === 365 ? 'selected' : ''}>365</option>
        </select>
      </label>
      <label>Lock-in period <input type="number" id="sp-lockin" class="form-control" value="${existing.lockinPeriodFrequency ?? ''}"/></label>
      <label>Lock-in period type <select id="sp-lockin-type" class="form-control">${termPeriods(existing.lockinPeriodFrequencyType?.id ?? 2)}</select></label>
    </div>`;

  const stepSettings = `
    <div class="form-grid">
      <label class="checkbox-row"><input type="checkbox" id="sp-enforce-min" ${existing.enforceMinRequiredBalance ? 'checked' : ''}/> Enforce minimum balance</label>
      <label>Minimum balance <input type="number" step="0.01" id="sp-min-required-bal" class="form-control" value="${existing.minRequiredBalance ?? ''}"/></label>
      <label>Balance required for interest <input type="number" step="0.01" id="sp-min-bal-interest" class="form-control" value="${existing.minBalanceForInterestCalculation ?? ''}"/></label>
      <label class="checkbox-row"><input type="checkbox" id="sp-withdraw-fee" ${existing.withdrawalFeeForTransfers ? 'checked' : ''}/> Apply withdrawal fee for transfers</label>
      <label class="checkbox-row"><input type="checkbox" id="sp-withhold-tax" ${existing.withHoldTax ? 'checked' : ''}/> Is withhold tax applicable</label>
      <label>Tax group
        <select id="sp-tax-group" class="form-control"><option value="">— None —</option>
          ${(tpl.taxGroupOptions || []).map(g => `<option value="${g.id}" ${existing.taxGroup?.id === g.id ? 'selected' : ''}>${escapeHtml(g.name || '—')}</option>`).join('')}
        </select></label>
      <label class="checkbox-row"><input type="checkbox" id="sp-dormancy" ${existing.isDormancyTrackingActive ? 'checked' : ''}/> Enable dormancy tracking</label>
      <label>Days to inactive <input type="number" id="sp-days-inactive" class="form-control" value="${existing.daysToInactive ?? ''}"/></label>
      <label>Days to dormancy <input type="number" id="sp-days-dormancy" class="form-control" value="${existing.daysToDormancy ?? ''}"/></label>
      <label>Days to escheat <input type="number" id="sp-days-escheat" class="form-control" value="${existing.daysToEscheat ?? ''}"/></label>
    </div>
    <h4 class="mt-3">Overdraft</h4>
    <div class="form-grid">
      <label class="checkbox-row"><input type="checkbox" id="sp-overdraft" ${allowOverdraft ? 'checked' : ''}/> Is overdraft allowed</label>
      <label>Overdraft limit <input type="number" step="0.01" id="sp-overdraft-limit" class="form-control" value="${existing.overdraftLimit ?? ''}"/></label>
      <label>Overdraft nominal rate (%) <input type="number" step="0.000001" id="sp-overdraft-rate" class="form-control" value="${existing.nominalAnnualInterestRateOverdraft ?? ''}"/></label>
      <label>Min overdraft for interest calc <input type="number" step="0.01" id="sp-overdraft-min-interest" class="form-control" value="${existing.minOverdraftForInterestCalculation ?? ''}"/></label>
    </div>
    <h4 class="mt-3">Charges</h4>
    <div class="form-grid full">${chargeBoxes('sp', tpl, existing)}</div>`;

  const stepAccounting = `
    <div class="form-grid">
      <label class="full">Accounting rule <select id="sp-accounting" class="form-control">${accountingTypes}</select></label>
    </div>
    <div id="sp-gl-wrap" style="${currentAccRule !== 1 ? '' : 'display:none'}">
      <h4 class="mt-3">GL Account Mappings</h4>
      <div class="form-grid">
        ${glSelect('gl-sp-savings-ref', 'Savings Reference', true)}
        ${glSelect('gl-sp-savings-ctrl', 'Savings Control', true)}
        ${glSelect('gl-sp-interest-on-sav', 'Interest on Savings', true)}
        ${glSelect('gl-sp-income-fees', 'Income from Fees')}
        ${glSelect('gl-sp-income-penalties', 'Income from Penalties')}
        ${glSelect('gl-sp-transfers', 'Transfers in Suspense')}
        ${glSelect('gl-sp-overdraft-port', 'Overdraft Portfolio')}
        ${glSelect('gl-sp-writeoff', 'Losses Written Off')}
        ${glSelect('gl-sp-escheat', 'Escheat Liability')}
      </div>
    </div>`;

  const el = wizardModal(mid, isEdit ? 'Edit Savings Product' : 'New Savings Product', [
    { label: 'Details',    html: stepDetails },
    { label: 'Interest',   html: stepInterest },
    { label: 'Settings',   html: stepSettings },
    { label: 'Accounting', html: stepAccounting },
  ], { saveLabel: isEdit ? 'Save Changes' : 'Create Product' });

  el.querySelector('#sp-accounting').addEventListener('change', (e) => {
    el.querySelector('#sp-gl-wrap').style.display = e.target.value !== '1' ? '' : 'none';
  });

  await populateGl(el);

  if (isEdit && existing.accountingMappings) {
    const m = existing.accountingMappings;
    const setSel = (id, val) => { const s = el.querySelector('#' + id); if (s && val) s.value = String(val); };
    setSel('gl-sp-savings-ref', m.savingsReferenceAccount?.id);
    setSel('gl-sp-savings-ctrl', m.savingsControlAccount?.id);
    setSel('gl-sp-interest-on-sav', m.interestOnSavingsAccount?.id);
    setSel('gl-sp-income-fees', m.incomeFromFeeAccount?.id);
    setSel('gl-sp-income-penalties', m.incomeFromPenaltyAccount?.id);
    setSel('gl-sp-transfers', m.transfersInSuspenseAccount?.id);
    setSel('gl-sp-overdraft-port', m.overdraftPortfolioControl?.id);
    setSel('gl-sp-writeoff', m.writeOffAccount?.id);
    setSel('gl-sp-escheat', m.escheatLiabilityAccount?.id);
  }

  el.querySelector('#' + mid + '-save').addEventListener('click', async () => {
    const name = v(el, 'sp-name');
    const shortName = v(el, 'sp-short');
    const currencyCode = v(el, 'sp-currency');
    const rate = vf(el, 'sp-rate');

    if (!name || !shortName || !currencyCode || rate === null) {
      toast('warn', 'Fill required fields', 'Name, short name, currency and nominal rate are required.');
      return;
    }

    const accountingRule = vi(el, 'sp-accounting') || 1;
    const charges = [...el.querySelectorAll('.sp-charge:checked')].map(c => ({ id: Number(c.value) }));
    const allowOd = vb(el, 'sp-overdraft');
    const payload = {
      name, shortName, currencyCode, locale: LOCALE,
      digitsAfterDecimal: vi(el, 'sp-decimals') ?? 2,
      inMultiplesOf: vi(el, 'sp-multiples') || undefined,
      nominalAnnualInterestRate: rate,
      interestCompoundingPeriodType: vi(el, 'sp-compound') ?? 4,
      interestPostingPeriodType: vi(el, 'sp-posting') ?? 4,
      interestCalculationType: vi(el, 'sp-calc') ?? 1,
      interestCalculationDaysInYearType: vi(el, 'sp-days') ?? 365,
      minRequiredOpeningBalance: vf(el, 'sp-min-bal') || undefined,
      lockinPeriodFrequency: vi(el, 'sp-lockin') || undefined,
      lockinPeriodFrequencyType: vi(el, 'sp-lockin') ? (vi(el, 'sp-lockin-type') ?? 2) : undefined,
      enforceMinRequiredBalance: vb(el, 'sp-enforce-min'),
      minRequiredBalance: vf(el, 'sp-min-required-bal') || undefined,
      minBalanceForInterestCalculation: vf(el, 'sp-min-bal-interest') || undefined,
      withdrawalFeeForTransfers: vb(el, 'sp-withdraw-fee'),
      withHoldTax: vb(el, 'sp-withhold-tax'),
      taxGroupId: vb(el, 'sp-withhold-tax') ? (vi(el, 'sp-tax-group') || undefined) : undefined,
      isDormancyTrackingActive: vb(el, 'sp-dormancy'),
      daysToInactive: vb(el, 'sp-dormancy') ? (vi(el, 'sp-days-inactive') || undefined) : undefined,
      daysToDormancy: vb(el, 'sp-dormancy') ? (vi(el, 'sp-days-dormancy') || undefined) : undefined,
      daysToEscheat: vb(el, 'sp-dormancy') ? (vi(el, 'sp-days-escheat') || undefined) : undefined,
      enableLockinPeriod: vi(el, 'sp-lockin') ? true : undefined,
      allowOverdraft: allowOd,
      overdraftLimit: allowOd ? (vf(el, 'sp-overdraft-limit') || undefined) : undefined,
      nominalAnnualInterestRateOverdraft: allowOd ? (vf(el, 'sp-overdraft-rate') || undefined) : undefined,
      minOverdraftForInterestCalculation: allowOd ? (vf(el, 'sp-overdraft-min-interest') || undefined) : undefined,
      accountingRule,
      description: v(el, 'sp-desc') || undefined
    };
    if (charges.length) payload.charges = charges;

    if (accountingRule !== 1) {
      const sr  = vi(el, 'gl-sp-savings-ref');
      const sc  = vi(el, 'gl-sp-savings-ctrl');
      const ios = vi(el, 'gl-sp-interest-on-sav');
      if (!sr || !sc || !ios) { toast('warn', 'Fill required GL accounts', ''); return; }
      payload.savingsReferenceAccountId = sr;
      payload.savingsControlAccountId = sc;
      payload.interestOnSavingsAccountId = ios;
      const map = {
        'gl-sp-income-fees': 'incomeFromFeeAccountId',
        'gl-sp-income-penalties': 'incomeFromPenaltyAccountId',
        'gl-sp-transfers': 'transfersInSuspenseAccountId',
        'gl-sp-overdraft-port': 'overdraftPortfolioControlId',
        'gl-sp-writeoff': 'writeOffAccountId',
        'gl-sp-escheat': 'escheatLiabilityAccountId',
      };
      for (const [id, key] of Object.entries(map)) { const val = vi(el, id); if (val) payload[key] = val; }
    }

    try {
      if (isEdit) await api.savingsProducts.update(productId, payload);
      else        await api.savingsProducts.create(payload);
      el.remove();
      toast('success', isEdit ? 'Savings product updated' : 'Savings product created', name);
      onSuccess();
    } catch (e) { toast('error', isEdit ? 'Update failed' : 'Create failed', extractFineractError(e)); }
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   Fixed Deposit Product — 4-step wizard
   (Details → Interest → Term & Pre-closure → Accounting).
   ──────────────────────────────────────────────────────────────────────────── */
export async function openFDProductModal(productId, onSuccess) {
  const isEdit = !!productId;
  let tpl = {}, existing = {};
  try {
    tpl = await api.fdProducts.template();
    if (isEdit) existing = await api.fdProducts.get(productId);
  } catch {}

  const currencies = (tpl.currencyOptions || []).map(o => `<option value="${o.code}" ${existing.currency?.code === o.code ? 'selected' : ''}>${escapeHtml(o.name)} (${o.code})</option>`).join('');
  const intCompTypes = opt(tpl.interestCompoundingPeriodTypeOptions, existing.interestCompoundingPeriodType?.id);
  const intPostTypes = opt(tpl.interestPostingPeriodTypeOptions, existing.interestPostingPeriodType?.id);
  const intCalcTypes = opt(tpl.interestCalculationTypeOptions, existing.interestCalculationType?.id);
  const currentAccRule = existing.accountingRule?.id || existing.accountingRule || 1;
  const preClose = !!existing.preClosurePenalApplicable;

  const mid = 'fd-modal-' + Date.now();

  const stepDetails = `
    <div class="form-grid">
      <label>Product name * <input id="fd-name" class="form-control" value="${escapeHtml(existing.name || '')}" required/></label>
      <label>Short name * <input id="fd-short" class="form-control" maxlength="4" value="${escapeHtml(existing.shortName || '')}" required/></label>
      <label class="full">Description <textarea id="fd-desc" class="form-control" rows="2">${escapeHtml(existing.description || '')}</textarea></label>
      <label>Currency *
        <select id="fd-currency" class="form-control" required><option value="">Select…</option>${currencies}</select>
      </label>
      <label>Decimal places <input type="number" id="fd-decimals" class="form-control" value="${existing.digitsAfterDecimal ?? 2}"/></label>
      <label>Currency in multiples of <input type="number" id="fd-multiples" class="form-control" value="${existing.inMultiplesOf ?? ''}"/></label>
    </div>`;

  const stepInterest = `
    <div class="form-grid">
      <label>Nominal annual rate (%) * <input type="number" step="0.000001" id="fd-rate" class="form-control" value="${existing.nominalAnnualInterestRate ?? ''}" required/></label>
      <label>Interest compounding <select id="fd-compound" class="form-control">${intCompTypes || '<option value="4" selected>Monthly</option>'}</select></label>
      <label>Interest posting <select id="fd-posting" class="form-control">${intPostTypes || '<option value="4" selected>Monthly</option>'}</select></label>
      <label>Interest calculated using <select id="fd-calc" class="form-control">${intCalcTypes || '<option value="1" selected>Daily Balance</option>'}</select></label>
      <label>Days in year
        <select id="fd-days" class="form-control">
          <option value="360" ${existing.interestCalculationDaysInYearType?.id === 360 ? 'selected' : ''}>360</option>
          <option value="365" ${(existing.interestCalculationDaysInYearType?.id || 365) === 365 ? 'selected' : ''}>365</option>
        </select>
      </label>
    </div>`;

  const stepTerm = `
    <div class="form-grid">
      <label>Min deposit amount * <input type="number" step="0.01" id="fd-min-deposit" class="form-control" value="${existing.minDepositAmount ?? ''}" required/></label>
      <label>Default deposit amount <input type="number" step="0.01" id="fd-deposit" class="form-control" value="${existing.depositAmount ?? ''}"/></label>
      <label>Max deposit amount <input type="number" step="0.01" id="fd-max-deposit" class="form-control" value="${existing.maxDepositAmount ?? ''}"/></label>
      <label>Min deposit term * <input type="number" id="fd-min-term" class="form-control" value="${existing.minDepositTerm ?? ''}" required/></label>
      <label>Min term period <select id="fd-min-term-type" class="form-control">${termPeriods(existing.minDepositTermType?.id ?? 2)}</select></label>
      <label>Max deposit term <input type="number" id="fd-max-term" class="form-control" value="${existing.maxDepositTerm ?? ''}"/></label>
      <label>Max term period <select id="fd-max-term-type" class="form-control">${termPeriods(existing.maxDepositTermType?.id ?? 2)}</select></label>
      <label>Term in multiples of <input type="number" id="fd-term-multiple" class="form-control" value="${existing.inMultiplesOfDepositTerm ?? ''}"/></label>
      <label>Term multiple period <select id="fd-term-multiple-type" class="form-control">${termPeriods(existing.inMultiplesOfDepositTermType?.id ?? 2)}</select></label>
      <label>Lock-in period <input type="number" id="fd-lockin" class="form-control" value="${existing.lockinPeriodFrequency ?? ''}"/></label>
      <label>Lock-in period type <select id="fd-lockin-type" class="form-control">${termPeriods(existing.lockinPeriodFrequencyType?.id ?? 2)}</select></label>
    </div>
    <h4 class="mt-3">Pre-closure &amp; Maturity</h4>
    <div class="form-grid">
      <label class="checkbox-row"><input type="checkbox" id="fd-premature" ${preClose ? 'checked' : ''}/> Allow premature closure</label>
      <label>Penalty on premature (%) <input type="number" step="0.01" id="fd-premature-penalty" class="form-control" value="${existing.preClosurePenalInterest ?? ''}"/></label>
      <label class="checkbox-row"><input type="checkbox" id="fd-withhold-tax" ${existing.withHoldTax ? 'checked' : ''}/> Is withhold tax applicable</label>
      <label>Tax group
        <select id="fd-tax-group" class="form-control"><option value="">— None —</option>
          ${(tpl.taxGroupOptions || []).map(g => `<option value="${g.id}" ${existing.taxGroup?.id === g.id ? 'selected' : ''}>${escapeHtml(g.name || '—')}</option>`).join('')}
        </select></label>
    </div>
    <h4 class="mt-3">Charges</h4>
    <div class="form-grid full">${chargeBoxes('fd', tpl, existing)}</div>`;

  const stepAccounting = `
    <div class="form-grid">
      <label class="full">Accounting rule
        <select id="fd-accounting" class="form-control">
          <option value="1" ${currentAccRule === 1 ? 'selected' : ''}>None</option>
          <option value="2" ${currentAccRule === 2 ? 'selected' : ''}>Cash</option>
        </select>
      </label>
    </div>
    <div id="fd-gl-wrap" style="${currentAccRule !== 1 ? '' : 'display:none'}">
      <h4 class="mt-3">GL Account Mappings</h4>
      <div class="form-grid">
        ${glSelect('gl-fd-savings-ref', 'Savings Reference', true)}
        ${glSelect('gl-fd-savings-ctrl', 'Savings Control', true)}
        ${glSelect('gl-fd-interest-on-sav', 'Interest on Savings', true)}
        ${glSelect('gl-fd-income-fees', 'Income from Fees')}
        ${glSelect('gl-fd-income-penalties', 'Income from Penalties')}
        ${glSelect('gl-fd-transfers', 'Transfers in Suspense')}
      </div>
    </div>`;

  const el = wizardModal(mid, isEdit ? 'Edit Fixed Deposit Product' : 'New Fixed Deposit Product', [
    { label: 'Details',     html: stepDetails },
    { label: 'Interest',    html: stepInterest },
    { label: 'Term',        html: stepTerm },
    { label: 'Accounting',  html: stepAccounting },
  ], { saveLabel: isEdit ? 'Save Changes' : 'Create Product' });

  el.querySelector('#fd-accounting').addEventListener('change', (e) => {
    el.querySelector('#fd-gl-wrap').style.display = e.target.value !== '1' ? '' : 'none';
  });

  await populateGl(el);

  if (isEdit && existing.accountingMappings) {
    const m = existing.accountingMappings;
    const setSel = (id, val) => { const s = el.querySelector('#' + id); if (s && val) s.value = String(val); };
    setSel('gl-fd-savings-ref', m.savingsReferenceAccount?.id);
    setSel('gl-fd-savings-ctrl', m.savingsControlAccount?.id);
    setSel('gl-fd-interest-on-sav', m.interestOnSavingsAccount?.id);
    setSel('gl-fd-income-fees', m.incomeFromFeeAccount?.id);
    setSel('gl-fd-income-penalties', m.incomeFromPenaltyAccount?.id);
    setSel('gl-fd-transfers', m.transfersInSuspenseAccount?.id);
  }

  el.querySelector('#' + mid + '-save').addEventListener('click', async () => {
    const name = v(el, 'fd-name');
    const shortName = v(el, 'fd-short');
    const currencyCode = v(el, 'fd-currency');
    const rate = vf(el, 'fd-rate');
    const minDeposit = vf(el, 'fd-min-deposit');
    const minTerm = vi(el, 'fd-min-term');

    if (!name || !shortName || !currencyCode || rate === null || !minDeposit || !minTerm) {
      toast('warn', 'Fill required fields', 'Name, short name, currency, rate, min deposit and min term are required.');
      return;
    }

    const accountingRule = vi(el, 'fd-accounting') || 1;
    const charges = [...el.querySelectorAll('.fd-charge:checked')].map(c => ({ id: Number(c.value) }));
    const preC = vb(el, 'fd-premature');
    const payload = {
      name, shortName, currencyCode, locale: LOCALE,
      digitsAfterDecimal: vi(el, 'fd-decimals') ?? 2,
      inMultiplesOf: vi(el, 'fd-multiples') || undefined,
      nominalAnnualInterestRate: rate,
      interestCompoundingPeriodType: vi(el, 'fd-compound') ?? 4,
      interestPostingPeriodType: vi(el, 'fd-posting') ?? 4,
      interestCalculationType: vi(el, 'fd-calc') ?? 1,
      interestCalculationDaysInYearType: vi(el, 'fd-days') ?? 365,
      minDepositAmount: minDeposit,
      depositAmount: vf(el, 'fd-deposit') || minDeposit,
      maxDepositAmount: vf(el, 'fd-max-deposit') || undefined,
      minDepositTerm: minTerm,
      minDepositTermTypeId: vi(el, 'fd-min-term-type') ?? 2,
      maxDepositTerm: vi(el, 'fd-max-term') || undefined,
      maxDepositTermTypeId: vi(el, 'fd-max-term-type') ?? 2,
      inMultiplesOfDepositTerm: vi(el, 'fd-term-multiple') || undefined,
      inMultiplesOfDepositTermTypeId: vi(el, 'fd-term-multiple') ? (vi(el, 'fd-term-multiple-type') ?? 2) : undefined,
      lockinPeriodFrequency: vi(el, 'fd-lockin') || undefined,
      lockinPeriodFrequencyType: vi(el, 'fd-lockin') ? (vi(el, 'fd-lockin-type') ?? 2) : undefined,
      preClosurePenalApplicable: preC,
      preClosurePenalInterest: preC ? (vf(el, 'fd-premature-penalty') ?? 0) : undefined,
      preClosurePenalInterestOnTypeId: preC ? 1 : undefined,
      withHoldTax: vb(el, 'fd-withhold-tax'),
      taxGroupId: vb(el, 'fd-withhold-tax') ? (vi(el, 'fd-tax-group') || undefined) : undefined,
      accountingRule,
      description: v(el, 'fd-desc') || undefined
    };
    if (charges.length) payload.charges = charges;

    if (accountingRule !== 1) {
      const sr = vi(el, 'gl-fd-savings-ref');
      const sc = vi(el, 'gl-fd-savings-ctrl');
      const ios = vi(el, 'gl-fd-interest-on-sav');
      if (!sr || !sc || !ios) { toast('warn', 'Fill required GL accounts', ''); return; }
      payload.savingsReferenceAccountId = sr;
      payload.savingsControlAccountId = sc;
      payload.interestOnSavingsAccountId = ios;
      const map = {
        'gl-fd-income-fees': 'incomeFromFeeAccountId',
        'gl-fd-income-penalties': 'incomeFromPenaltyAccountId',
        'gl-fd-transfers': 'transfersInSuspenseAccountId',
      };
      for (const [id, key] of Object.entries(map)) { const val = vi(el, id); if (val) payload[key] = val; }
    }

    try {
      if (isEdit) await api.fdProducts.update(productId, payload);
      else        await api.fdProducts.create(payload);
      el.remove();
      toast('success', isEdit ? 'FD product updated' : 'FD product created', name);
      onSuccess();
    } catch (e) { toast('error', isEdit ? 'Update failed' : 'Create failed', extractFineractError(e)); }
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   Recurring Deposit Product — 4-step wizard
   (Details → Interest → Deposit & Term → Accounting).
   ──────────────────────────────────────────────────────────────────────────── */
export async function openRDProductModal(productId, onSuccess) {
  const isEdit = !!productId;
  let tpl = {}, existing = {};
  try {
    tpl = await api.rdProducts.template();
    if (isEdit) existing = await api.rdProducts.get(productId);
  } catch {}

  const currencies = (tpl.currencyOptions || []).map(o => `<option value="${o.code}" ${existing.currency?.code === o.code ? 'selected' : ''}>${escapeHtml(o.name)} (${o.code})</option>`).join('');
  const intCompTypes = opt(tpl.interestCompoundingPeriodTypeOptions, existing.interestCompoundingPeriodType?.id);
  const intPostTypes = opt(tpl.interestPostingPeriodTypeOptions, existing.interestPostingPeriodType?.id);
  const currentAccRule = existing.accountingRule?.id || existing.accountingRule || 1;
  const preClose = !!existing.preClosurePenalApplicable;

  const mid = 'rd-modal-' + Date.now();

  const stepDetails = `
    <div class="form-grid">
      <label>Product name * <input id="rdp-name" class="form-control" value="${escapeHtml(existing.name || '')}" required/></label>
      <label>Short name * <input id="rdp-short" class="form-control" maxlength="4" value="${escapeHtml(existing.shortName || '')}" required/></label>
      <label class="full">Description <textarea id="rdp-desc" class="form-control" rows="2">${escapeHtml(existing.description || '')}</textarea></label>
      <label>Currency *
        <select id="rdp-currency" class="form-control" required><option value="">Select…</option>${currencies}</select>
      </label>
      <label>Decimal places <input type="number" id="rdp-decimals" class="form-control" value="${existing.digitsAfterDecimal ?? 2}"/></label>
      <label>Currency in multiples of <input type="number" id="rdp-multiples" class="form-control" value="${existing.inMultiplesOf ?? ''}"/></label>
    </div>`;

  const stepInterest = `
    <div class="form-grid">
      <label>Nominal annual rate (%) * <input type="number" step="0.000001" id="rdp-rate" class="form-control" value="${existing.nominalAnnualInterestRate ?? ''}" required/></label>
      <label>Interest compounding <select id="rdp-compound" class="form-control">${intCompTypes || '<option value="4" selected>Monthly</option>'}</select></label>
      <label>Interest posting <select id="rdp-posting" class="form-control">${intPostTypes || '<option value="4" selected>Monthly</option>'}</select></label>
      <label>Days in year
        <select id="rdp-days" class="form-control">
          <option value="360" ${existing.interestCalculationDaysInYearType?.id === 360 ? 'selected' : ''}>360</option>
          <option value="365" ${(existing.interestCalculationDaysInYearType?.id || 365) === 365 ? 'selected' : ''}>365</option>
        </select>
      </label>
    </div>`;

  const stepDeposit = `
    <div class="form-grid">
      <label>Mandatory deposit amount * <input type="number" step="0.01" id="rdp-deposit" class="form-control" value="${existing.mandatoryRecommendedDepositAmount ?? ''}" required/></label>
      <label>Min deposit amount <input type="number" step="0.01" id="rdp-min-deposit" class="form-control" value="${existing.minDepositAmount ?? ''}"/></label>
      <label>Max deposit amount <input type="number" step="0.01" id="rdp-max-deposit" class="form-control" value="${existing.maxDepositAmount ?? ''}"/></label>
      <label>Deposit every <input type="number" id="rdp-deposit-every" class="form-control" value="${existing.recurringDepositFrequency ?? 1}"/></label>
      <label>Deposit period <select id="rdp-deposit-period" class="form-control">${termPeriods(existing.recurringDepositFrequencyType?.id ?? 2)}</select></label>
      <label>Min deposit term * <input type="number" id="rdp-min-term" class="form-control" value="${existing.minDepositTerm ?? ''}" required/></label>
      <label>Min term period <select id="rdp-min-term-type" class="form-control">${termPeriods(existing.minDepositTermType?.id ?? 2)}</select></label>
      <label>Max deposit term <input type="number" id="rdp-max-term" class="form-control" value="${existing.maxDepositTerm ?? ''}"/></label>
      <label>Max term period <select id="rdp-max-term-type" class="form-control">${termPeriods(existing.maxDepositTermType?.id ?? 2)}</select></label>
      <label>Term in multiples of <input type="number" id="rdp-term-multiple" class="form-control" value="${existing.inMultiplesOfDepositTerm ?? ''}"/></label>
      <label>Term multiple period <select id="rdp-term-multiple-type" class="form-control">${termPeriods(existing.inMultiplesOfDepositTermType?.id ?? 2)}</select></label>
      <label>Lock-in period <input type="number" id="rdp-lockin" class="form-control" value="${existing.lockinPeriodFrequency ?? ''}"/></label>
      <label>Lock-in period type <select id="rdp-lockin-type" class="form-control">${termPeriods(existing.lockinPeriodFrequencyType?.id ?? 2)}</select></label>
      <label class="checkbox-row"><input type="checkbox" id="rdp-adjust-deposit" ${existing.isMandatoryDeposit ? 'checked' : ''}/> Is mandatory deposit</label>
      <label class="checkbox-row"><input type="checkbox" id="rdp-adjust-advance" ${existing.adjustAdvanceTowardsFuturePayments ? 'checked' : ''}/> Adjust advance towards future instalments</label>
      <label class="checkbox-row"><input type="checkbox" id="rdp-allow-withdrawal" ${existing.allowWithdrawal ? 'checked' : ''}/> Allow withdrawal</label>
      <label class="checkbox-row"><input type="checkbox" id="rdp-premature" ${preClose ? 'checked' : ''}/> Allow premature closure</label>
      <label>Penalty on premature (%) <input type="number" step="0.01" id="rdp-premature-penalty" class="form-control" value="${existing.preClosurePenalInterest ?? ''}"/></label>
      <label class="checkbox-row"><input type="checkbox" id="rdp-withhold-tax" ${existing.withHoldTax ? 'checked' : ''}/> Is withhold tax applicable</label>
      <label>Tax group
        <select id="rdp-tax-group" class="form-control"><option value="">— None —</option>
          ${(tpl.taxGroupOptions || []).map(g => `<option value="${g.id}" ${existing.taxGroup?.id === g.id ? 'selected' : ''}>${escapeHtml(g.name || '—')}</option>`).join('')}
        </select></label>
    </div>
    <h4 class="mt-3">Charges</h4>
    <div class="form-grid full">${chargeBoxes('rdp', tpl, existing)}</div>`;

  const stepAccounting = `
    <div class="form-grid">
      <label class="full">Accounting rule
        <select id="rdp-accounting" class="form-control">
          <option value="1" ${currentAccRule === 1 ? 'selected' : ''}>None</option>
          <option value="2" ${currentAccRule === 2 ? 'selected' : ''}>Cash</option>
        </select>
      </label>
    </div>
    <div id="rdp-gl-wrap" style="${currentAccRule !== 1 ? '' : 'display:none'}">
      <h4 class="mt-3">GL Account Mappings</h4>
      <div class="form-grid">
        ${glSelect('gl-rdp-savings-ref', 'Savings Reference', true)}
        ${glSelect('gl-rdp-savings-ctrl', 'Savings Control', true)}
        ${glSelect('gl-rdp-interest-on-sav', 'Interest on Savings', true)}
        ${glSelect('gl-rdp-income-fees', 'Income from Fees')}
        ${glSelect('gl-rdp-transfers', 'Transfers in Suspense')}
      </div>
    </div>`;

  const el = wizardModal(mid, isEdit ? 'Edit Recurring Deposit Product' : 'New Recurring Deposit Product', [
    { label: 'Details',    html: stepDetails },
    { label: 'Interest',   html: stepInterest },
    { label: 'Deposit',    html: stepDeposit },
    { label: 'Accounting', html: stepAccounting },
  ], { saveLabel: isEdit ? 'Save Changes' : 'Create Product' });

  el.querySelector('#rdp-accounting').addEventListener('change', (e) => {
    el.querySelector('#rdp-gl-wrap').style.display = e.target.value !== '1' ? '' : 'none';
  });

  await populateGl(el);

  if (isEdit && existing.accountingMappings) {
    const m = existing.accountingMappings;
    const setSel = (id, val) => { const s = el.querySelector('#' + id); if (s && val) s.value = String(val); };
    setSel('gl-rdp-savings-ref', m.savingsReferenceAccount?.id);
    setSel('gl-rdp-savings-ctrl', m.savingsControlAccount?.id);
    setSel('gl-rdp-interest-on-sav', m.interestOnSavingsAccount?.id);
    setSel('gl-rdp-income-fees', m.incomeFromFeeAccount?.id);
    setSel('gl-rdp-transfers', m.transfersInSuspenseAccount?.id);
  }

  el.querySelector('#' + mid + '-save').addEventListener('click', async () => {
    const name = v(el, 'rdp-name');
    const shortName = v(el, 'rdp-short');
    const currencyCode = v(el, 'rdp-currency');
    const rate = vf(el, 'rdp-rate');
    const deposit = vf(el, 'rdp-deposit');
    const minTerm = vi(el, 'rdp-min-term');

    if (!name || !shortName || !currencyCode || rate === null || !deposit || !minTerm) {
      toast('warn', 'Fill required fields', 'Name, short name, currency, rate, deposit amount and min term are required.');
      return;
    }

    const accountingRule = vi(el, 'rdp-accounting') || 1;
    const charges = [...el.querySelectorAll('.rdp-charge:checked')].map(c => ({ id: Number(c.value) }));
    const preC = vb(el, 'rdp-premature');
    const payload = {
      name, shortName, currencyCode, locale: LOCALE,
      digitsAfterDecimal: vi(el, 'rdp-decimals') ?? 2,
      inMultiplesOf: vi(el, 'rdp-multiples') || undefined,
      nominalAnnualInterestRate: rate,
      interestCompoundingPeriodType: vi(el, 'rdp-compound') ?? 4,
      interestPostingPeriodType: vi(el, 'rdp-posting') ?? 4,
      interestCalculationType: 1,
      interestCalculationDaysInYearType: vi(el, 'rdp-days') ?? 365,
      mandatoryRecommendedDepositAmount: deposit,
      depositAmount: deposit,
      minDepositAmount: vf(el, 'rdp-min-deposit') || undefined,
      maxDepositAmount: vf(el, 'rdp-max-deposit') || undefined,
      recurringDepositFrequency: vi(el, 'rdp-deposit-every') || 1,
      recurringDepositFrequencyTypeId: vi(el, 'rdp-deposit-period') ?? 2,
      minDepositTerm: minTerm,
      minDepositTermTypeId: vi(el, 'rdp-min-term-type') ?? 2,
      maxDepositTerm: vi(el, 'rdp-max-term') || undefined,
      maxDepositTermTypeId: vi(el, 'rdp-max-term-type') ?? 2,
      inMultiplesOfDepositTerm: vi(el, 'rdp-term-multiple') || undefined,
      inMultiplesOfDepositTermTypeId: vi(el, 'rdp-term-multiple') ? (vi(el, 'rdp-term-multiple-type') ?? 2) : undefined,
      lockinPeriodFrequency: vi(el, 'rdp-lockin') || undefined,
      lockinPeriodFrequencyType: vi(el, 'rdp-lockin') ? (vi(el, 'rdp-lockin-type') ?? 2) : undefined,
      isMandatoryDeposit: vb(el, 'rdp-adjust-deposit'),
      adjustAdvanceTowardsFuturePayments: vb(el, 'rdp-adjust-advance'),
      allowWithdrawal: vb(el, 'rdp-allow-withdrawal'),
      withHoldTax: vb(el, 'rdp-withhold-tax'),
      taxGroupId: vb(el, 'rdp-withhold-tax') ? (vi(el, 'rdp-tax-group') || undefined) : undefined,
      preClosurePenalApplicable: preC,
      preClosurePenalInterest: preC ? (vf(el, 'rdp-premature-penalty') ?? 0) : undefined,
      preClosurePenalInterestOnTypeId: preC ? 1 : undefined,
      accountingRule,
      description: v(el, 'rdp-desc') || undefined
    };
    if (charges.length) payload.charges = charges;

    if (accountingRule !== 1) {
      const sr = vi(el, 'gl-rdp-savings-ref');
      const sc = vi(el, 'gl-rdp-savings-ctrl');
      const ios = vi(el, 'gl-rdp-interest-on-sav');
      if (!sr || !sc || !ios) { toast('warn', 'Fill required GL accounts', ''); return; }
      payload.savingsReferenceAccountId = sr;
      payload.savingsControlAccountId = sc;
      payload.interestOnSavingsAccountId = ios;
      const map = {
        'gl-rdp-income-fees': 'incomeFromFeeAccountId',
        'gl-rdp-transfers': 'transfersInSuspenseAccountId',
      };
      for (const [id, key] of Object.entries(map)) { const val = vi(el, id); if (val) payload[key] = val; }
    }

    try {
      if (isEdit) await api.rdProducts.update(productId, payload);
      else        await api.rdProducts.create(payload);
      el.remove();
      toast('success', isEdit ? 'RD product updated' : 'RD product created', name);
      onSuccess();
    } catch (e) { toast('error', isEdit ? 'Update failed' : 'Create failed', extractFineractError(e)); }
  });
}
