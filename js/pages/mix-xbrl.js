import { api } from '../api.js';
import { toast } from '../ui.js';
import { escapeHtml } from '../utils.js';
import { extractFineractError } from '../ui/dom-helpers.js';

export async function render(c) {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = today.slice(0, 4) + '-01-01';
  c.innerHTML = /* scan-allow-innerhtml: audited-safe — numeric IDs / code-defined labels & icons / computed dates / pre-escaped HTML fragments (no raw user data) */ `
    <div class="page-header mb-3">
      <div><h1>MIX Market (XBRL)</h1><div class="text-muted">Generate the MIX XBRL report and inspect its taxonomy</div></div>
    </div>
    <div class="card mb-4">
      <h3 class="mb-2">Generate Report</h3>
      <div class="form-grid mb-2">
        <label>Start date <input type="date" id="mx-start" class="form-control" value="${yearStart}"/></label>
        <label>End date <input type="date" id="mx-end" class="form-control" value="${today}"/></label>
        <label>Currency <input id="mx-ccy" class="form-control" placeholder="e.g. USD"/></label>
      </div>
      <button class="btn-primary" id="mx-gen"><i class="fa-solid fa-file-export"></i> Generate XBRL</button>
      <div id="mx-out" class="mt-3"></div>
    </div>
    <div class="card">
      <div class="tabs" id="mx-tabs">
        <button class="tab active" data-tab="mx-tax">Taxonomy</button>
        <button class="tab" data-tab="mx-map">Taxonomy → GL Mapping</button>
      </div>
      <div class="tab-panel active" id="mx-tax"><div class="empty-state-row">Loading…</div></div>
      <div class="tab-panel" id="mx-map"><div class="empty-state-row">Loading…</div></div>
    </div>`;

  const out = c.querySelector('#mx-out');
  c.querySelector('#mx-gen').addEventListener('click', async () => {
    const params = {
      startDate: c.querySelector('#mx-start').value,
      endDate: c.querySelector('#mx-end').value,
      currency: c.querySelector('#mx-ccy').value.trim() || undefined
    };
    out.innerHTML = '<div class="empty-state-row">Generating…</div>';
    try {
      const res = await api.mixXbrl.report(params);
      const text = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
      out.innerHTML = `
        <div class="section-header mb-2"><span class="text-muted">${text.length} chars</span>
          <button class="btn-secondary btn-sm" id="mx-dl"><i class="fa-solid fa-download"></i> Download XML</button></div>
        <pre style="max-height:360px;overflow:auto;border:1px solid var(--border-1);border-radius:6px;padding:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(text)}</pre>`;
      out.querySelector('#mx-dl').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'application/xml' }));
        a.download = `mix-report-${params.startDate}_${params.endDate}.xml`; a.click(); URL.revokeObjectURL(a.href);
      });
    } catch (e) { out.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
  });

  const loaded = {};
  const loaders = {
    tax: async () => {
      const el = c.querySelector('#mx-tax');
      try {
        const res = await api.mixXbrl.taxonomies();
        const rows = Array.isArray(res) ? res : (res?.pageItems || []);
        el.innerHTML = `<table class="table"><thead><tr><th>ID</th><th>Name</th><th>Namespace</th><th>Dimension</th></tr></thead>
          <tbody>${rows.length ? rows.map(t => `<tr><td>${escapeHtml(String(t.id ?? '—'))}</td><td>${escapeHtml(t.name || '—')}</td>
          <td class="small">${escapeHtml(t.namespace || '—')}</td><td class="small">${escapeHtml(t.dimension || '—')}</td></tr>`).join('')
          : '<tr><td colspan="4" class="empty-state-row">No taxonomy returned</td></tr>'}</tbody></table>`;
      } catch (e) { el.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
    },
    map: async () => {
      const el = c.querySelector('#mx-map');
      try {
        const res = await api.mixXbrl.mapping();
        const rows = Array.isArray(res) ? res : (res?.pageItems || res?.mappings || []);
        el.innerHTML = rows.length
          ? `<table class="table"><thead><tr><th>Taxonomy</th><th>GL Accounts / Config</th></tr></thead>
             <tbody>${rows.map(m => `<tr><td>${escapeHtml(m.taxonomy || m.identifier || '—')}</td><td class="small">${escapeHtml(m.config || m.glCode || JSON.stringify(m))}</td></tr>`).join('')}</tbody></table>`
          : `<pre style="max-height:360px;overflow:auto;border:1px solid var(--border-1);border-radius:6px;padding:12px;white-space:pre-wrap">${escapeHtml(JSON.stringify(res, null, 2))}</pre>`;
      } catch (e) { el.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
    }
  };
  c.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
    c.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    c.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    c.querySelector('#' + tab.dataset.tab)?.classList.add('active');
    const key = tab.dataset.tab.split('-')[1];
    if (loaders[key] && !loaded[key]) { loaded[key] = true; loaders[key](); }
  }));
  loaded.tax = true; loaders.tax();
}
