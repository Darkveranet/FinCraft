import { api } from '../api.js';
import { toast } from '../ui.js';
import { escapeHtml, fmtDate } from '../utils.js';
import { extractFineractError } from '../ui/dom-helpers.js';

export async function render(c) {
  c.innerHTML = `
    <div class="page-header mb-3">
      <div><h1>Credit Bureau</h1><div class="text-muted">Bureau configuration, loan-product mappings, and credit-report lookup</div></div>
    </div>
    <div class="card">
      <div class="tabs" id="cb-tabs">
        <button class="tab active" data-tab="cb-0">Bureaus</button>
        <button class="tab" data-tab="cb-1">Loan-Product Mappings</button>
        <button class="tab" data-tab="cb-2">Credit Reports</button>
      </div>
      <div class="tab-panel active" id="cb-0"><div class="empty-state-row">Loading…</div></div>
      <div class="tab-panel" id="cb-1"><div class="empty-state-row">Loading…</div></div>
      <div class="tab-panel" id="cb-2"></div>
    </div>`;

  const loaded = {};
  const loaders = { 0: loadBureaus, 1: loadMappings, 2: loadReports };
  c.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
    c.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    c.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    c.querySelector('#' + tab.dataset.tab)?.classList.add('active');
    const idx = parseInt(tab.dataset.tab.split('-')[1]);
    if (loaders[idx] && !loaded[idx]) { loaded[idx] = true; loaders[idx](c); }
  }));
  loaded[0] = true; loadBureaus(c);
  loadReports(c);
}

async function loadBureaus(c) {
  const el = c.querySelector('#cb-0');
  try {
    const [bureausRes, orgRes] = await Promise.allSettled([
      api.creditBureauConfig.getCreditBureau(),
      api.creditBureauConfig.organisationBureaus()
    ]);
    const bureaus = bureausRes.status === 'fulfilled' ? asList(bureausRes.value) : [];
    const org = orgRes.status === 'fulfilled' ? asList(orgRes.value) : [];
    el.innerHTML = `
      <h3 class="mb-2">Available Bureaus</h3>
      <table class="table mb-4">
        <thead><tr><th>ID</th><th>Name</th><th>Product</th><th>Country</th></tr></thead>
        <tbody>${bureaus.length ? bureaus.map(b => `
          <tr><td>${escapeHtml(String(b.id ?? '—'))}</td><td>${escapeHtml(b.name || b.creditBureauName || '—')}</td>
          <td>${escapeHtml(b.product || b.creditBureauProduct || '—')}</td><td>${escapeHtml(b.country || '—')}</td></tr>`).join('')
          : '<tr><td colspan="4" class="empty-state-row">No bureaus registered</td></tr>'}</tbody>
      </table>
      <h3 class="mb-2">Organisation Bureaus</h3>
      <table class="table">
        <thead><tr><th>ID</th><th>Bureau</th><th>Alias</th><th>Active</th></tr></thead>
        <tbody>${org.length ? org.map(o => `
          <tr><td>${escapeHtml(String(o.organisationCreditBureauId ?? o.id ?? '—'))}</td>
          <td>${escapeHtml(o.creditBureauName || o.name || '—')}</td>
          <td>${escapeHtml(o.alias || '—')}</td>
          <td>${o.isActive ? '<span class="badge b-success">Yes</span>' : '<span class="badge">No</span>'}</td></tr>`).join('')
          : '<tr><td colspan="4" class="empty-state-row">None configured</td></tr>'}</tbody>
      </table>`;
  } catch (e) { el.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
}

async function loadMappings(c) {
  const el = c.querySelector('#cb-1');
  try {
    const res = await api.creditBureauConfig.mappings();
    const rows = asList(res);
    el.innerHTML = `
      <table class="table">
        <thead><tr><th>Loan Product</th><th>Bureau</th><th>Active</th></tr></thead>
        <tbody>${rows.length ? rows.map(m => `
          <tr><td>${escapeHtml(m.loanProductName || (m.loanProductId ? `#${m.loanProductId}` : '—'))}</td>
          <td>${escapeHtml(m.creditBureauName || m.alias || '—')}</td>
          <td>${m.isCreditCheckMandatory || m.isActive ? '<span class="badge b-success">Yes</span>' : '<span class="badge">No</span>'}</td></tr>`).join('')
          : '<tr><td colspan="3" class="empty-state-row">No loan-product mappings</td></tr>'}</tbody>
      </table>`;
  } catch (e) { el.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
}

function loadReports(c) {
  const el = c.querySelector('#cb-2');
  el.innerHTML = `
    <div class="text-muted small mb-2"><i class="fa-solid fa-circle-info"></i> Fetch a live credit report from a configured bureau, or look up a previously saved one.</div>
    <div class="form-grid mb-3">
      <label>Credit Bureau ID <input id="cb-bid" class="form-control" placeholder="e.g. 1"/></label>
      <label>National ID / Ref <input id="cb-nid" class="form-control" placeholder="borrower national id"/></label>
    </div>
    <div style="display:flex; gap:8px; flex-wrap:wrap">
      <button class="btn-primary" id="cb-fetch"><i class="fa-solid fa-magnifying-glass"></i> Fetch Live Report</button>
      <button class="btn-secondary" id="cb-saved"><i class="fa-solid fa-folder-open"></i> Get Saved Report</button>
    </div>
    <div id="cb-report" class="mt-3"></div>`;

  const out = el.querySelector('#cb-report');
  const showJson = (data) => { out.innerHTML = `<pre style="max-height:420px;overflow:auto;border:1px solid var(--border-1);border-radius:6px;padding:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(typeof data === 'string' ? data : JSON.stringify(data, null, 2))}</pre>`; };

  el.querySelector('#cb-fetch').addEventListener('click', async () => {
    const creditBureauId = el.querySelector('#cb-bid').value.trim();
    const nationalId = el.querySelector('#cb-nid').value.trim();
    if (!creditBureauId || !nationalId) { toast('warn', 'Bureau ID and National ID required', ''); return; }
    out.innerHTML = '<div class="empty-state-row">Fetching…</div>';
    try { showJson(await api.creditBureauIntegration.fetchReport({ creditBureauID: creditBureauId, NationalID: nationalId })); }
    catch (e) { out.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
  });

  el.querySelector('#cb-saved').addEventListener('click', async () => {
    const creditBureauId = el.querySelector('#cb-bid').value.trim();
    if (!creditBureauId) { toast('warn', 'Bureau ID required', ''); return; }
    out.innerHTML = '<div class="empty-state-row">Loading…</div>';
    try { showJson(await api.creditBureauIntegration.getSavedReport(creditBureauId)); }
    catch (e) { out.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
  });
}

function asList(res) { return Array.isArray(res) ? res : (res?.pageItems || (res ? [res] : [])); }
