import { api } from '../api.js';
import { toast } from '../ui.js';
import { escapeHtml, num } from '../utils.js';
import { extractFineractError } from '../ui/dom-helpers.js';

export async function render(c) {
  c.innerHTML = `
    <div class="page-header mb-3">
      <div><h1>Social Performance</h1><div class="text-muted">Surveys &amp; scorecards, PPI likelihood and poverty-line tables</div></div>
    </div>
    <div class="card">
      <div class="tabs" id="spm-tabs">
        <button class="tab active" data-tab="spm-0">Surveys</button>
        <button class="tab" data-tab="spm-1">PPI Likelihood</button>
        <button class="tab" data-tab="spm-2">Poverty Line</button>
      </div>
      <div class="tab-panel active" id="spm-0"><div class="empty-state-row">Loading…</div></div>
      <div class="tab-panel" id="spm-1"></div>
      <div class="tab-panel" id="spm-2"></div>
    </div>`;

  const loaded = {};
  const loaders = { 0: loadSurveys, 1: () => loadPpi(c, 'spm-1', 'likelihood'), 2: () => loadPpi(c, 'spm-2', 'povertyLine') };
  c.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
    c.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    c.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    c.querySelector('#' + tab.dataset.tab)?.classList.add('active');
    const idx = parseInt(tab.dataset.tab.split('-')[1]);
    if (loaders[idx] && !loaded[idx]) { loaded[idx] = true; loaders[idx](c); }
  }));
  loaded[0] = true; loadSurveys(c);
  buildPpiForm(c, 'spm-1', 'likelihood');
  buildPpiForm(c, 'spm-2', 'povertyLine');
}

async function loadSurveys(c) {
  const el = c.querySelector('#spm-0');
  try {
    const res = await api.surveyData.list();
    const rows = Array.isArray(res) ? res : (res?.pageItems || []);
    el.innerHTML = `
      <div class="text-muted small mb-2"><i class="fa-solid fa-circle-info"></i> Registered SPM surveys. Scorecards capture a client's scored responses.</div>
      <table class="table">
        <thead><tr><th>Key</th><th>Name</th><th>Country</th><th>Active</th><th></th></tr></thead>
        <tbody>${rows.length ? rows.map(s => `
          <tr>
            <td><code>${escapeHtml(s.key || s.name || '—')}</code></td>
            <td>${escapeHtml(s.name || '—')}</td>
            <td>${escapeHtml(s.countryCode || '—')}</td>
            <td>${s.active ? '<span class="badge b-success">Yes</span>' : '<span class="badge">No</span>'}</td>
            <td class="text-right"><button class="btn-mini" data-scorecards="${escapeHtml(s.id ?? s.key ?? '')}">Scorecards</button></td>
          </tr>`).join('') : '<tr><td colspan="5" class="empty-state-row">No surveys registered</td></tr>'}</tbody>
      </table>`;
    el.querySelectorAll('[data-scorecards]').forEach(b => b.addEventListener('click', () => openScorecards(b.dataset.scorecards)));
  } catch (e) { el.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
}

async function openScorecards(surveyId) {
  const mid = 'spm-sc-' + Date.now();
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-lg">
        <div class="modal-header"><h3>Scorecards — Survey ${escapeHtml(String(surveyId))}</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body"><div id="spm-sc-body"><div class="empty-state-row">Loading…</div></div></div>
        <div class="modal-footer"><button class="btn-secondary" data-close-modal>Close</button></div>
      </div>
    </div>`);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));
  try {
    const res = await api.scorecards.bySurvey(surveyId);
    const rows = Array.isArray(res) ? res : (res?.pageItems || []);
    el.querySelector('#spm-sc-body').innerHTML = rows.length
      ? `<table class="table"><thead><tr><th>Client</th><th>Date</th><th class="text-right">Score</th></tr></thead>
         <tbody>${rows.map(s => `<tr><td>${escapeHtml(s.clientName || (s.clientId ? `#${s.clientId}` : '—'))}</td>
         <td>${escapeHtml(String(s.date || s.createdOn || '—'))}</td><td class="text-right">${num(s.scorecardValues?.reduce?.((a, v) => a + (v.value || 0), 0) ?? s.score ?? '—')}</td></tr>`).join('')}</tbody></table>`
      : '<div class="empty-state-row">No scorecards recorded for this survey</div>';
  } catch (e) { el.querySelector('#spm-sc-body').innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
}

function buildPpiForm(c, panelId, kind) {
  const el = c.querySelector('#' + panelId);
  const label = kind === 'likelihood' ? 'PPI Likelihood' : 'Poverty Line';
  el.innerHTML = /* scan-allow-innerhtml: audited-safe — numeric IDs / code-defined labels & icons / computed dates / pre-escaped HTML fragments (no raw user data) */ `
    <div class="text-muted small mb-2"><i class="fa-solid fa-circle-info"></i> ${label} tables are keyed by PPI questionnaire name (e.g. <code>PPI_ZAF</code>).</div>
    <div class="filter-bar mb-2">
      <input id="${panelId}-ppi" class="form-control" placeholder="PPI name (e.g. PPI_ZAF)"/>
      <button class="btn-primary" id="${panelId}-go"><i class="fa-solid fa-magnifying-glass"></i> Load</button>
    </div>
    <div id="${panelId}-out"><div class="empty-state-row">Enter a PPI name and Load.</div></div>`;
  el.querySelector(`#${panelId}-go`).addEventListener('click', () => loadPpi(c, panelId, kind));
}

async function loadPpi(c, panelId, kind) {
  const el = c.querySelector('#' + panelId);
  const ppi = el.querySelector(`#${panelId}-ppi`)?.value?.trim();
  const out = el.querySelector(`#${panelId}-out`);
  if (!ppi) { toast('warn', 'Enter a PPI name', ''); return; }
  out.innerHTML = '<div class="empty-state-row">Loading…</div>';
  try {
    const res = await (kind === 'likelihood' ? api.likelihood.list(ppi) : api.povertyLine.list(ppi));
    const rows = Array.isArray(res) ? res : (res?.pageItems || []);
    out.innerHTML = rows.length
      ? `<table class="table"><thead><tr><th>ID</th><th>Name / Code</th><th class="text-right">Value</th></tr></thead>
         <tbody>${rows.map(r => `<tr><td>${escapeHtml(String(r.id ?? '—'))}</td><td>${escapeHtml(r.name || r.code || r.likelihoodCode || '—')}</td>
         <td class="text-right">${num(r.enabled != null ? (r.enabled ? 1 : 0) : (r.value ?? r.likelihoodValue ?? '—'))}</td></tr>`).join('')}</tbody></table>`
      : `<pre style="max-height:360px;overflow:auto;border:1px solid var(--border-1);border-radius:6px;padding:12px;white-space:pre-wrap">${escapeHtml(JSON.stringify(res, null, 2))}</pre>`;
  } catch (e) { out.innerHTML = `<div class="text-error">${escapeHtml(extractFineractError(e))}</div>`; }
}
