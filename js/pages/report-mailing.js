import { api } from '../api.js';
import { confirm, toast } from '../ui.js';
import { escapeHtml, num, fmtDate } from '../utils.js';
import { extractFineractError } from '../ui/dom-helpers.js';

export async function render(c) {
  c.innerHTML = `
    <div class="page-header mb-3">
      <div>
        <h1>Report Mailing Jobs</h1>
        <div class="text-muted">Schedule reports to be generated and emailed on a recurrence</div>
      </div>
      <div class="page-actions"><button class="btn-primary" id="rmj-new"><i class="fa-solid fa-plus"></i> New Mailing Job</button></div>
    </div>
    <div class="card">
      <table class="table">
        <thead><tr><th>Name</th><th>Report</th><th>Recipients</th><th>Recurrence</th><th>Active</th><th></th></tr></thead>
        <tbody id="rmj-rows"><tr><td colspan="6" class="empty-state-row">Loading…</td></tr></tbody>
      </table>
    </div>`;

  async function load() {
    try {
      const res = await api.reportMailingJobs.list({ limit: 200 });
      const rows = Array.isArray(res) ? res : (res?.pageItems || []);
      c.querySelector('#rmj-rows').innerHTML = rows.length ? rows.map(j => `
        <tr>
          <td><b>${escapeHtml(j.name || '—')}</b><div class="text-muted small">${escapeHtml(j.description || '')}</div></td>
          <td>${escapeHtml(j.stretchyReport?.reportName || j.stretchyReportName || (j.stretchyReportId ? `#${j.stretchyReportId}` : '—'))}</td>
          <td class="small">${escapeHtml(j.emailRecipients || '—')}</td>
          <td class="small">${escapeHtml(j.recurrence || '—')}</td>
          <td>${j.isActive ? '<span class="badge b-success">Active</span>' : '<span class="badge">Inactive</span>'}</td>
          <td class="text-right">
            <button class="btn-mini" data-hist="${j.id}">Run History</button>
            <button class="btn-mini btn-danger" data-del="${j.id}">Delete</button>
          </td>
        </tr>`).join('') : '<tr><td colspan="6" class="empty-state-row">No mailing jobs defined</td></tr>';

      c.querySelectorAll('[data-hist]').forEach(b => b.addEventListener('click', () => openHistory(b.dataset.hist)));
      c.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
        if (!await confirm({ title: 'Delete mailing job?', danger: true, confirmText: 'Delete' })) return;
        try { await api.reportMailingJobs.delete(b.dataset.del); toast('success', 'Deleted', ''); load(); }
        catch (e) { toast('error', 'Delete failed', extractFineractError(e)); }
      }));
    } catch (e) {
      c.querySelector('#rmj-rows').innerHTML = `<tr><td colspan="6" class="text-error">${escapeHtml(extractFineractError(e))}</td></tr>`;
    }
  }

  c.querySelector('#rmj-new').addEventListener('click', () => openJobModal(load));
  load();
}

async function openJobModal(onSuccess) {
  let tpl = {}, reports = [];
  try { tpl = await api.reportMailingJobs.template(); } catch {}
  try { const r = await api.reports.list(); reports = Array.isArray(r) ? r : (r?.pageItems || []); } catch {}
  const fileFormats = tpl.emailAttachmentFileFormatOptions || [
    { id: 'xls', value: 'XLS' }, { id: 'pdf', value: 'PDF' }, { id: 'csv', value: 'CSV' }
  ];
  const mid = 'rmj-form-' + Date.now();
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-lg">
        <div class="modal-header"><h3>New Report Mailing Job</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <label class="full">Job name * <input id="rj-name" class="form-control" required/></label>
            <label class="full">Report to email *
              <select id="rj-report" class="form-control" required>
                <option value="">Select report…</option>
                ${reports.map(r => `<option value="${r.id}">${escapeHtml(r.reportName || ('#' + r.id))}</option>`).join('')}
              </select>
            </label>
            <label class="full">Recipient emails (comma-separated) * <input id="rj-recipients" class="form-control" placeholder="ops@bank.com, mgr@bank.com" required/></label>
            <label>Attachment format
              <select id="rj-format" class="form-control">${fileFormats.map(f => `<option value="${f.id}">${escapeHtml(f.value)}</option>`).join('')}</select>
            </label>
            <label>Start date/time * <input type="datetime-local" id="rj-start" class="form-control" required/></label>
            <label class="full">Recurrence (iCal RRULE) <input id="rj-recurrence" class="form-control" placeholder="FREQ=DAILY;INTERVAL=1"/></label>
            <label class="full">Email subject <input id="rj-subject" class="form-control"/></label>
            <label class="full">Email message <textarea id="rj-message" class="form-control" rows="2"></textarea></label>
            <label class="checkbox-row"><input type="checkbox" id="rj-active" checked/> Active</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="rj-save">Create Job</button>
        </div>
      </div>
    </div>`);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));
  el.querySelector('#rj-save').addEventListener('click', async () => {
    const name = el.querySelector('#rj-name').value.trim();
    const stretchyReportId = el.querySelector('#rj-report').value;
    const emailRecipients = el.querySelector('#rj-recipients').value.trim();
    const start = el.querySelector('#rj-start').value;
    if (!name || !stretchyReportId || !emailRecipients || !start) { toast('warn', 'Fill required fields', ''); return; }
    const [d, t = '00:00'] = start.split('T');
    const startDateTime = `${d} ${t.length === 5 ? t + ':00' : t}`;
    const payload = {
      name,
      stretchyReportId: parseInt(stretchyReportId),
      emailRecipients,
      emailSubject: el.querySelector('#rj-subject').value.trim() || name,
      emailMessage: el.querySelector('#rj-message').value.trim() || name,
      emailAttachmentFileFormatId: el.querySelector('#rj-format').value,
      startDateTime,
      recurrence: el.querySelector('#rj-recurrence').value.trim() || undefined,
      isActive: el.querySelector('#rj-active').checked,
      dateFormat: 'yyyy-MM-dd HH:mm:ss', locale: 'en'
    };
    try { await api.reportMailingJobs.create(payload); el.remove(); toast('success', 'Mailing job created', name); onSuccess(); }
    catch (e) { toast('error', 'Create failed', extractFineractError(e)); }
  });
}

async function openHistory(jobId) {
  const mid = 'rmj-hist-' + Date.now();
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-lg">
        <div class="modal-header"><h3>Run History — Job #${escapeHtml(String(jobId))}</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">
          <table class="table">
            <thead><tr><th>Run</th><th>Started</th><th>Status</th><th>Error</th></tr></thead>
            <tbody id="rmj-hist-rows"><tr><td colspan="4" class="empty-state-row">Loading…</td></tr></tbody>
          </table>
        </div>
        <div class="modal-footer"><button class="btn-secondary" data-close-modal>Close</button></div>
      </div>
    </div>`);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));
  try {
    const res = await api.reportMailingJobs.runHistory({ reportMailingJobId: jobId, limit: 100 });
    const rows = Array.isArray(res) ? res : (res?.pageItems || []);
    el.querySelector('#rmj-hist-rows').innerHTML = rows.length ? rows.map(h => `
      <tr>
        <td>#${escapeHtml(String(h.id ?? '—'))}</td>
        <td>${fmtDate(h.startDateTime) || escapeHtml(String(h.startDateTime || '—'))}</td>
        <td>${escapeHtml(h.status || (h.errorMessage ? 'Error' : 'OK'))}</td>
        <td class="text-error small">${escapeHtml(h.errorMessage || '—')}</td>
      </tr>`).join('') : '<tr><td colspan="4" class="empty-state-row">No runs recorded yet</td></tr>';
  } catch (e) {
    el.querySelector('#rmj-hist-rows').innerHTML = `<tr><td colspan="4" class="text-error">${escapeHtml(extractFineractError(e))}</td></tr>`;
  }
}
