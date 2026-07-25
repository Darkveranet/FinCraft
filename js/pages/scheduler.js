import { api } from '../api.js';
import { confirm, toast } from '../ui.js';
import { escapeHtml, num } from '../utils.js';
import { extractFineractError } from '../ui/dom-helpers.js';

export async function render(c) {
  c.innerHTML = `
    <div class="page-header mb-3">
      <div><h1>Scheduler &amp; Business Jobs</h1><div class="text-muted">Global scheduler control and per-job business-step configuration (COB)</div></div>
    </div>
    <div class="grid-2 mb-4">
      <div class="card">
        <h3 class="mb-2">Scheduler</h3>
        <div id="sch-status" class="mb-2"><span class="empty-state-row">Loading…</span></div>
        <div style="display:flex; gap:8px">
          <button class="btn-success" id="sch-start"><i class="fa-solid fa-play"></i> Start</button>
          <button class="btn-warning" id="sch-stop"><i class="fa-solid fa-stop"></i> Stop</button>
          <button class="btn-secondary" id="sch-refresh"><i class="fa-solid fa-rotate"></i> Refresh</button>
        </div>
      </div>
      <div class="card">
        <h3 class="mb-2">Business Jobs</h3>
        <div class="text-muted small mb-2">Pick a job to view/configure its ordered business steps.</div>
        <select id="sch-job" class="form-control"><option value="">Loading jobs…</option></select>
      </div>
    </div>
    <div class="card">
      <div class="section-header mb-2"><h3>Business Steps</h3>
        <button class="btn-secondary btn-sm" id="sch-inline" disabled><i class="fa-solid fa-bolt"></i> Run Inline</button>
      </div>
      <table class="table">
        <thead><tr><th>Order</th><th>Step Name</th></tr></thead>
        <tbody id="sch-steps"><tr><td colspan="2" class="empty-state-row">Select a job above</td></tr></tbody>
      </table>
      <div id="sch-available" class="mt-2"></div>
    </div>`;

  async function loadStatus() {
    const el = c.querySelector('#sch-status');
    try {
      const res = await api.scheduler.status();
      const active = res?.active ?? res?.status;
      el.innerHTML = active
        ? '<span class="badge b-success">Running</span>'
        : '<span class="badge b-danger">Stopped</span>';
    } catch (e) { el.innerHTML = `<span class="text-error">${escapeHtml(extractFineractError(e))}</span>`; }
  }
  c.querySelector('#sch-start').addEventListener('click', async () => {
    try { await api.scheduler.start(); toast('success', 'Scheduler started', ''); loadStatus(); }
    catch (e) { toast('error', 'Start failed', extractFineractError(e)); }
  });
  c.querySelector('#sch-stop').addEventListener('click', async () => {
    if (!await confirm({ title: 'Stop scheduler?', message: 'Scheduled jobs will not run until restarted.', danger: true, confirmText: 'Stop' })) return;
    try { await api.scheduler.stop(); toast('success', 'Scheduler stopped', ''); loadStatus(); }
    catch (e) { toast('error', 'Stop failed', extractFineractError(e)); }
  });
  c.querySelector('#sch-refresh').addEventListener('click', loadStatus);
  loadStatus();

  const jobSel = c.querySelector('#sch-job');
  try {
    const res = await api.jobs.businessJobNames();
    const names = Array.isArray(res) ? res : (res?.businessJobs || res?.pageItems || []);
    jobSel.innerHTML = '<option value="">Select a job…</option>' +
      names.map(n => { const name = typeof n === 'string' ? n : (n.jobName || n.name); return `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`; }).join('');
  } catch (e) { jobSel.innerHTML = `<option value="">Failed: ${escapeHtml(extractFineractError(e))}</option>`; }

  jobSel.addEventListener('change', () => loadSteps(jobSel.value));

  async function loadSteps(jobName) {
    const body = c.querySelector('#sch-steps');
    const avail = c.querySelector('#sch-available');
    const inlineBtn = c.querySelector('#sch-inline');
    avail.innerHTML = '';
    if (!jobName) { body.innerHTML = '<tr><td colspan="2" class="empty-state-row">Select a job above</td></tr>'; inlineBtn.disabled = true; return; }
    inlineBtn.disabled = false;
    inlineBtn.onclick = async () => {
      if (!await confirm({ title: `Run "${jobName}" inline?`, message: 'Executes the job immediately in this request.', confirmText: 'Run' })) return;
      try { await api.jobs.executeInline(jobName, {}); toast('success', 'Job executed', jobName); }
      catch (e) { toast('error', 'Execution failed', extractFineractError(e)); }
    };
    body.innerHTML = '<tr><td colspan="2" class="empty-state-row">Loading…</td></tr>';
    try {
      const cfg = await api.jobs.steps(jobName);
      const steps = (cfg?.businessSteps || cfg?.steps || (Array.isArray(cfg) ? cfg : []))
        .slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      body.innerHTML = steps.length ? steps.map(s => `
        <tr><td>${num(s.order ?? '—')}</td><td><code>${escapeHtml(s.stepName || s.name || '—')}</code></td></tr>`).join('')
        : '<tr><td colspan="2" class="empty-state-row">No steps configured for this job</td></tr>';
      try {
        const av = await api.jobs.availableSteps(jobName);
        const list = av?.availableBusinessSteps || av?.businessSteps || (Array.isArray(av) ? av : []);
        if (list.length) {
          avail.innerHTML = `<div class="text-muted small"><b>Available steps:</b> ${list.map(x => escapeHtml(x.stepName || x.name || String(x))).join(', ')}</div>`;
        }
      } catch {}
    } catch (e) {
      body.innerHTML = `<tr><td colspan="2" class="text-error">${escapeHtml(extractFineractError(e))}</td></tr>`;
    }
  }
}
