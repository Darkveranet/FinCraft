import { api } from '../api.js';
import { confirm, toast } from '../ui.js';
import { escapeHtml, fmt, num, fmtDate } from '../utils.js';
import { store } from '../store.js';
import { extractFineractError } from '../ui/dom-helpers.js';

const can = (code) => store.hasPermission(code);

export async function render(c, params = {}) {
  if (params.id) return renderChartDetail(c, params.id);
  return renderList(c);
}

async function renderList(c) {
  c.innerHTML = `
    <div class="page-header mb-3">
      <div>
        <h1>Interest Rate Charts</h1>
        <div class="text-muted">Tiered ("slab") interest-rate charts used by deposit products</div>
      </div>
      <div class="page-actions">
        <button class="btn-primary" id="irc-new"><i class="fa-solid fa-plus"></i> New Chart</button>
      </div>
    </div>
    <div class="card">
      <table class="table">
        <thead><tr><th>Name</th><th>Description</th><th>Valid From</th><th>Valid To</th><th>Product</th><th></th></tr></thead>
        <tbody id="irc-rows"><tr><td colspan="6" class="empty-state-row">Loading…</td></tr></tbody>
      </table>
    </div>`;

  async function load() {
    try {
      const res = await api.interestRateCharts.list();
      const rows = Array.isArray(res) ? res : (res?.pageItems || []);
      c.querySelector('#irc-rows').innerHTML = rows.length ? rows.map(ch => `
        <tr>
          <td><a href="#" data-view-chart="${ch.id}"><b>${escapeHtml(ch.name || '—')}</b></a></td>
          <td class="text-muted small">${escapeHtml(ch.description || '—')}</td>
          <td>${fmtDate(ch.fromDate) || '—'}</td>
          <td>${fmtDate(ch.endDate) || '—'}</td>
          <td>${escapeHtml(ch.productName || (ch.productId ? `#${ch.productId}` : '—'))}</td>
          <td class="text-right">
            <button class="btn-mini" data-view-chart="${ch.id}">Slabs</button>
            <button class="btn-mini" data-edit-chart="${ch.id}">Edit</button>
            <button class="btn-mini btn-danger" data-del-chart="${ch.id}">Delete</button>
          </td>
        </tr>`).join('') : '<tr><td colspan="6" class="empty-state-row">No interest rate charts defined</td></tr>';

      c.querySelectorAll('[data-view-chart]').forEach(b => b.addEventListener('click', e => {
        e.preventDefault();
        location.hash = `interest-rate-charts?id=${b.dataset.viewChart}`;
      }));
      c.querySelectorAll('[data-edit-chart]').forEach(b => b.addEventListener('click', () =>
        openChartModal(b.dataset.editChart, load)));
      c.querySelectorAll('[data-del-chart]').forEach(b => b.addEventListener('click', async () => {
        if (!await confirm({ title: 'Delete chart?', message: 'This removes the chart and all its slabs.', danger: true, confirmText: 'Delete' })) return;
        try { await api.interestRateCharts.delete(b.dataset.delChart); toast('success', 'Chart deleted', ''); load(); }
        catch (e) { toast('error', 'Delete failed', extractFineractError(e)); }
      }));
    } catch (e) {
      c.querySelector('#irc-rows').innerHTML = `<tr><td colspan="6" class="text-error">${escapeHtml(extractFineractError(e))}</td></tr>`;
    }
  }

  c.querySelector('#irc-new').addEventListener('click', () => openChartModal(null, load));
  load();
}

async function openChartModal(chartId, onSuccess) {
  const isEdit = !!chartId;
  let existing = {};
  if (isEdit) { try { existing = await api.interestRateCharts.get(chartId); } catch {} }
  const mid = 'irc-form-' + Date.now();
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-md">
        <div class="modal-header"><h3>${isEdit ? 'Edit' : 'New'} Interest Rate Chart</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <label class="full">Name * <input id="irc-name" class="form-control" value="${escapeHtml(existing.name || '')}" required/></label>
            <label class="full">Description <input id="irc-desc" class="form-control" value="${escapeHtml(existing.description || '')}"/></label>
            <label>Valid from * <input type="date" id="irc-from" class="form-control" value="${existing.fromDate ? isoDate(existing.fromDate) : ''}" required/></label>
            <label>Valid to <input type="date" id="irc-to" class="form-control" value="${existing.endDate ? isoDate(existing.endDate) : ''}"/></label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="irc-save">${isEdit ? 'Save' : 'Create'}</button>
        </div>
      </div>
    </div>`);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));
  el.querySelector('#irc-save').addEventListener('click', async () => {
    const name = el.querySelector('#irc-name').value.trim();
    const fromDate = el.querySelector('#irc-from').value;
    if (!name || !fromDate) { toast('warn', 'Name and Valid-from are required', ''); return; }
    const payload = {
      name,
      description: el.querySelector('#irc-desc').value.trim() || undefined,
      fromDate, dateFormat: 'yyyy-MM-dd', locale: 'en'
    };
    const to = el.querySelector('#irc-to').value; if (to) payload.endDate = to;
    try {
      if (isEdit) await api.interestRateCharts.update(chartId, payload);
      else        await api.interestRateCharts.create(payload);
      el.remove(); toast('success', isEdit ? 'Chart updated' : 'Chart created', name); onSuccess();
    } catch (e) { toast('error', 'Save failed', extractFineractError(e)); }
  });
}

async function renderChartDetail(c, chartId) {
  c.innerHTML = `
    <button class="hub-back" id="irc-back"><i class="fa-solid fa-arrow-left"></i> Interest Rate Charts</button>
    <div class="page-header mb-3"><div><h1 id="irc-title">Chart</h1><div class="text-muted" id="irc-sub"></div></div>
      <div class="page-actions"><button class="btn-primary" id="irc-add-slab"><i class="fa-solid fa-plus"></i> Add Slab</button></div>
    </div>
    <div class="card">
      <h3 class="mb-2">Rate Slabs</h3>
      <table class="table">
        <thead><tr><th>Description</th><th>Period</th><th class="text-right">From Amount</th><th class="text-right">To Amount</th><th class="text-right">Rate %</th><th></th></tr></thead>
        <tbody id="irc-slab-rows"><tr><td colspan="6" class="empty-state-row">Loading…</td></tr></tbody>
      </table>
    </div>`;
  c.querySelector('#irc-back').addEventListener('click', () => { location.hash = 'interest-rate-charts'; });

  try {
    const chart = await api.interestRateCharts.get(chartId);
    c.querySelector('#irc-title').textContent = chart.name || `Chart #${chartId}`;
    c.querySelector('#irc-sub').textContent = chart.description || '';
  } catch {}

  async function loadSlabs() {
    try {
      const res = await api.interestRateCharts.slabs(chartId);
      const rows = Array.isArray(res) ? res : (res?.pageItems || []);
      c.querySelector('#irc-slab-rows').innerHTML = rows.length ? rows.map(s => `
        <tr>
          <td>${escapeHtml(s.description || '—')}</td>
          <td>${num(s.periodType?.value ? s.fromPeriod : s.fromPeriod ?? '—')}${s.toPeriod != null ? '–' + num(s.toPeriod) : ''} ${escapeHtml(s.periodType?.value || '')}</td>
          <td class="text-right">${s.amountRangeFrom != null ? fmt(s.amountRangeFrom) : '—'}</td>
          <td class="text-right">${s.amountRangeTo != null ? fmt(s.amountRangeTo) : '—'}</td>
          <td class="text-right">${num(s.annualInterestRate ?? 0)}%</td>
          <td class="text-right">
            <button class="btn-mini btn-danger" data-del-slab="${s.id}">Delete</button>
          </td>
        </tr>`).join('') : '<tr><td colspan="6" class="empty-state-row">No slabs yet — add one</td></tr>';
      c.querySelectorAll('[data-del-slab]').forEach(b => b.addEventListener('click', async () => {
        if (!await confirm({ title: 'Delete slab?', danger: true, confirmText: 'Delete' })) return;
        try { await api.interestRateCharts.deleteSlab(chartId, b.dataset.delSlab); toast('success', 'Slab deleted', ''); loadSlabs(); }
        catch (e) { toast('error', 'Delete failed', extractFineractError(e)); }
      }));
    } catch (e) {
      c.querySelector('#irc-slab-rows').innerHTML = `<tr><td colspan="6" class="text-error">${escapeHtml(extractFineractError(e))}</td></tr>`;
    }
  }

  c.querySelector('#irc-add-slab').addEventListener('click', () => openSlabModal(chartId, loadSlabs));
  loadSlabs();
}

async function openSlabModal(chartId, onSuccess) {
  const mid = 'irc-slab-' + Date.now();
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-md">
        <div class="modal-header"><h3>Add Rate Slab</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <label class="full">Description <input id="sl-desc" class="form-control"/></label>
            <label>Annual rate % * <input type="number" step="0.001" id="sl-rate" class="form-control" required/></label>
            <label>Period type <select id="sl-ptype" class="form-control">
              <option value="1">Days</option><option value="2">Weeks</option><option value="3" selected>Months</option><option value="4">Years</option>
            </select></label>
            <label>From period <input type="number" id="sl-from-period" class="form-control" value="0"/></label>
            <label>To period <input type="number" id="sl-to-period" class="form-control"/></label>
            <label>From amount <input type="number" step="0.01" id="sl-from-amt" class="form-control"/></label>
            <label>To amount <input type="number" step="0.01" id="sl-to-amt" class="form-control"/></label>
          </div>
          <div class="msg-banner b-info mt-2"><i class="fa-solid fa-circle-info"></i> A slab applies a rate to a deposit within a term/amount range.</div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="sl-save">Add Slab</button>
        </div>
      </div>
    </div>`);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));
  el.querySelector('#sl-save').addEventListener('click', async () => {
    const rate = parseFloat(el.querySelector('#sl-rate').value);
    if (isNaN(rate)) { toast('warn', 'Annual rate is required', ''); return; }
    const num_ = (id) => { const v = el.querySelector(id).value; return v === '' ? undefined : parseFloat(v); };
    const payload = {
      description: el.querySelector('#sl-desc').value.trim() || undefined,
      annualInterestRate: rate,
      periodType: parseInt(el.querySelector('#sl-ptype').value),
      fromPeriod: num_('#sl-from-period'),
      toPeriod: num_('#sl-to-period'),
      amountRangeFrom: num_('#sl-from-amt'),
      amountRangeTo: num_('#sl-to-amt'),
      locale: 'en'
    };
    try { await api.interestRateCharts.createSlab(chartId, payload); el.remove(); toast('success', 'Slab added', ''); onSuccess(); }
    catch (e) { toast('error', 'Add failed', extractFineractError(e)); }
  });
}

function isoDate(d) {
  if (Array.isArray(d)) { const [y, m, day] = d; return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
  const dt = new Date(d); return isNaN(dt) ? '' : dt.toISOString().slice(0, 10);
}
