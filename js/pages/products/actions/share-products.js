import { LOCALE, DATE_FORMAT, today } from '../../../config.js';
import { api } from '../../../api.js';
import { escapeHtml } from '../../../utils.js';
import { glSelect, modal, populateGl, wizardModal, v, vb, vf, vi } from '../shared.js';
import { toast } from '../../../ui.js';

import { extractFineractError } from '../../../ui/dom-helpers.js';

const termPeriods = (sel = 2) => `
  <option value="0" ${sel === 0 ? 'selected' : ''}>Days</option>
  <option value="1" ${sel === 1 ? 'selected' : ''}>Weeks</option>
  <option value="2" ${sel === 2 ? 'selected' : ''}>Months</option>
  <option value="3" ${sel === 3 ? 'selected' : ''}>Years</option>`;

/* ────────────────────────────────────────────────────────────────────────────
   Share Product — 4-step wizard with the full Fineract field-set
   (Details → Shares → Market Prices & Charges → Accounting).
   ──────────────────────────────────────────────────────────────────────────── */
export async function openShareProductModal(productId, onSuccess) {
  const isEdit = !!productId;
  let tpl = {}, existing = {};
  try {
    tpl = await api.shareProducts.template();
    if (isEdit) existing = await api.shareProducts.get(productId);
  } catch {}

  const currencies = (tpl.currencyOptions || []).map(o => `<option value="${o.code}" ${existing.currency?.code === o.code ? 'selected' : ''}>${escapeHtml(o.name)} (${o.code})</option>`).join('');
  const currentAccRule = existing.accountingRule?.id || existing.accountingRule || 1;

  const attached = new Set((existing.charges || []).map(c => c.id));
  const chargeBoxes = (tpl.chargeOptions || []).length
    ? (tpl.chargeOptions || []).map(ch => `
        <label class="checkbox-row"><input type="checkbox" class="shp-charge" value="${ch.id}" ${attached.has(ch.id) ? 'checked' : ''}/>
          ${escapeHtml(ch.name)}${ch.amount != null ? ` — ${ch.amount}` : ''}</label>`).join('')
    : '<div class="form-section-note">No charges defined yet. Create charges under Products → Charges to attach them here.</div>';

  const marketRow = (mp = {}) => `
    <div class="mp-period form-grid" style="margin-bottom:8px">
      <label>From date <input type="date" class="form-control mp-from" value="${mp.fromDate || today()}"/></label>
      <label>Share value <input type="number" step="0.01" class="form-control mp-price" value="${mp.shareValue ?? ''}"/></label>
      <button type="button" class="btn-mini btn-danger mp-remove">Remove</button>
    </div>`;
  const existingMp = Array.isArray(existing.marketPricePeriods) ? existing.marketPricePeriods : [];

  const mid = 'shp-modal-' + Date.now();

  const stepDetails = `
    <div class="form-grid">
      <label>Product name * <input id="shp-name" class="form-control" value="${escapeHtml(existing.name || '')}" required/></label>
      <label>Short name * <input id="shp-short" class="form-control" maxlength="4" value="${escapeHtml(existing.shortName || '')}" required/></label>
      <label class="full">Description <textarea id="shp-desc" class="form-control" rows="2">${escapeHtml(existing.description || '')}</textarea></label>
      <label>Currency *
        <select id="shp-currency" class="form-control" required><option value="">Select…</option>${currencies}</select>
      </label>
      <label>Decimal places <input type="number" id="shp-decimals" class="form-control" value="${existing.digitsAfterDecimal ?? 2}"/></label>
      <label>Currency in multiples of <input type="number" id="shp-multiples" class="form-control" value="${existing.inMultiplesOf ?? ''}" placeholder="e.g. 1"/></label>
    </div>`;

  const stepShares = `
    <div class="form-grid">
      <label>Total shares * <input type="number" id="shp-total" class="form-control" value="${existing.totalShares ?? ''}" required/></label>
      <label>Shares to be issued <input type="number" id="shp-issue" class="form-control" value="${existing.totalSharesToBeIssued ?? existing.sharesIssued ?? ''}"/></label>
      <label>Unit price * <input type="number" step="0.01" id="shp-unit-price" class="form-control" value="${existing.unitPrice ?? ''}" required/></label>
      <label>Min shares per client <input type="number" id="shp-min-shares" class="form-control" value="${existing.minimumShares ?? ''}"/></label>
      <label>Nominal shares per client * <input type="number" id="shp-nom-shares" class="form-control" value="${existing.nominalShares ?? ''}"/></label>
      <label>Max shares per client <input type="number" id="shp-max-shares" class="form-control" value="${existing.maximumShares ?? ''}"/></label>
      <label>Shares default (client) <input type="number" id="shp-default-shares" class="form-control" value="${existing.defaultShares ?? ''}"/></label>
      <label>Min active period <input type="number" id="shp-active-period" class="form-control" value="${existing.minimumActivePeriodForDividends ?? ''}"/></label>
      <label>Min active period type <select id="shp-active-period-type" class="form-control">${termPeriods(existing.minimumActivePeriodFrequencyType?.id ?? 0)}</select></label>
      <label>Lock-in period <input type="number" id="shp-lockin" class="form-control" value="${existing.lockinPeriodFrequency ?? ''}"/></label>
      <label>Lock-in period type <select id="shp-lockin-type" class="form-control">${termPeriods(existing.lockinPeriodFrequencyType?.id ?? 2)}</select></label>
      <label class="checkbox-row"><input type="checkbox" id="shp-allow-dividends" ${existing.allowDividendCalculationForInactiveClients ? 'checked' : ''}/> Allow dividends for inactive clients</label>
    </div>`;

  const stepMarket = `
    <div class="form-section-note">Market price periods let the share value change over time. Leave empty to always use the unit price.</div>
    <div id="shp-mp">${existingMp.length ? existingMp.map(marketRow).join('') : ''}</div>
    <button type="button" class="btn-secondary btn-sm" id="shp-add-mp"><i class="fa-solid fa-plus"></i> Add market price</button>
    <h4 class="mt-3">Charges</h4>
    <div class="form-grid full">${chargeBoxes}</div>`;

  const stepAccounting = `
    <div class="form-grid">
      <label class="full">Accounting rule
        <select id="shp-accounting" class="form-control">
          <option value="1" ${currentAccRule === 1 ? 'selected' : ''}>None</option>
          <option value="2" ${currentAccRule === 2 ? 'selected' : ''}>Cash</option>
        </select>
      </label>
    </div>
    <div id="shp-gl-wrap" style="${currentAccRule !== 1 ? '' : 'display:none'}">
      <h4 class="mt-3">GL Account Mappings</h4>
      <div class="form-grid">
        ${glSelect('gl-shp-shares-ref', 'Shares Reference', true)}
        ${glSelect('gl-shp-shares-susp', 'Shares Suspense', true)}
        ${glSelect('gl-shp-shares-equity', 'Shares Equity')}
        ${glSelect('gl-shp-income-fees', 'Income from Fees')}
      </div>
    </div>`;

  const el = wizardModal(mid, isEdit ? 'Edit Share Product' : 'New Share Product', [
    { label: 'Details',    html: stepDetails },
    { label: 'Shares',     html: stepShares },
    { label: 'Pricing',    html: stepMarket },
    { label: 'Accounting', html: stepAccounting },
  ], { saveLabel: isEdit ? 'Save Changes' : 'Create Product' });

  const wireMpRemove = () => el.querySelectorAll('.mp-remove').forEach(b => {
    if (!b.dataset.wired) { b.dataset.wired = '1'; b.addEventListener('click', () => b.closest('.mp-period').remove()); }
  });
  wireMpRemove();
  el.querySelector('#shp-add-mp').addEventListener('click', () => {
    el.querySelector('#shp-mp').insertAdjacentHTML('beforeend', marketRow());
    wireMpRemove();
  });

  el.querySelector('#shp-accounting').addEventListener('change', (e) => {
    el.querySelector('#shp-gl-wrap').style.display = e.target.value !== '1' ? '' : 'none';
  });

  await populateGl(el);

  if (isEdit && existing.accountingMappings) {
    const m = existing.accountingMappings;
    const setSel = (id, val) => { const s = el.querySelector('#' + id); if (s && val) s.value = String(val); };
    setSel('gl-shp-shares-ref', m.shareReference?.id);
    setSel('gl-shp-shares-susp', m.shareSuspense?.id);
    setSel('gl-shp-shares-equity', m.shareEquity?.id);
    setSel('gl-shp-income-fees', m.incomeFromFeeAccount?.id);
  }

  el.querySelector('#' + mid + '-save').addEventListener('click', async () => {
    const name = v(el, 'shp-name');
    const shortName = v(el, 'shp-short');
    const currencyCode = v(el, 'shp-currency');
    const totalShares = vi(el, 'shp-total');
    const unitPrice = vf(el, 'shp-unit-price');

    if (!name || !shortName || !currencyCode || !totalShares || !unitPrice) {
      toast('warn', 'Fill required fields', 'Name, short name, currency, total shares and unit price are required.');
      return;
    }

    const accountingRule = vi(el, 'shp-accounting') || 1;
    const charges = [...el.querySelectorAll('.shp-charge:checked')].map(c => ({ id: Number(c.value) }));
    const marketPricePeriods = [...el.querySelectorAll('.mp-period')].map(row => ({
      fromDate: row.querySelector('.mp-from').value,
      shareValue: parseFloat(row.querySelector('.mp-price').value)
    })).filter(p => p.fromDate && !isNaN(p.shareValue));

    const payload = {
      name, shortName, currencyCode, locale: LOCALE, dateFormat: DATE_FORMAT,
      digitsAfterDecimal: vi(el, 'shp-decimals') ?? 2,
      inMultiplesOf: vi(el, 'shp-multiples') || undefined,
      totalShares, unitPrice,
      sharesIssued: vi(el, 'shp-issue') || totalShares,
      minimumShares: vi(el, 'shp-min-shares') || undefined,
      nominalShares: vi(el, 'shp-nom-shares') || undefined,
      maximumShares: vi(el, 'shp-max-shares') || undefined,
      defaultShares: vi(el, 'shp-default-shares') || undefined,
      minimumActivePeriodForDividends: vi(el, 'shp-active-period') || undefined,
      minimumActivePeriodFrequencyType: vi(el, 'shp-active-period') ? (vi(el, 'shp-active-period-type') ?? 0) : undefined,
      lockinPeriodFrequency: vi(el, 'shp-lockin') || undefined,
      lockinPeriodFrequencyType: vi(el, 'shp-lockin') ? (vi(el, 'shp-lockin-type') ?? 2) : undefined,
      allowDividendCalculationForInactiveClients: vb(el, 'shp-allow-dividends'),
      accountingRule,
      description: v(el, 'shp-desc') || undefined
    };
    if (charges.length) payload.charges = charges;
    if (marketPricePeriods.length) payload.marketPricePeriods = marketPricePeriods;

    if (accountingRule !== 1) {
      const sr = vi(el, 'gl-shp-shares-ref');
      const ss = vi(el, 'gl-shp-shares-susp');
      if (!sr || !ss) { toast('warn', 'Fill required GL accounts', ''); return; }
      payload.shareReferenceId = sr;
      payload.shareSuspenseId = ss;
      const eq = vi(el, 'gl-shp-shares-equity'); if (eq) payload.shareEquityId = eq;
      const fees = vi(el, 'gl-shp-income-fees'); if (fees) payload.incomeFromFeeAccountId = fees;
    }

    try {
      if (isEdit) await api.shareProducts.update(productId, payload);
      else        await api.shareProducts.create(payload);
      el.remove();
      toast('success', isEdit ? 'Share product updated' : 'Share product created', name);
      onSuccess();
    } catch (e) { toast('error', isEdit ? 'Update failed' : 'Create failed', extractFineractError(e)); }
  });
}
