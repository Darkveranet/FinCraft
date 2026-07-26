import { toast } from '../../ui.js';
import { loadApprovalInbox } from './checker-inbox.js';

let _autoRefresh = false;
let _refreshTimer = null;

export async function render(c) {
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }

  c.innerHTML = `
    <div class="page-header mb-3">
      <div>
        <h1>Approval Inbox</h1>
      </div>
      <div class="page-actions">
        <label class="checkbox-row" style="margin-right:12px">
          <input type="checkbox" id="tk-auto-refresh"/>
          Auto-refresh (30s)
        </label>
        <button class="btn-secondary" id="tk-refresh"><i class="fa-solid fa-rotate"></i> Refresh</button>
      </div>
    </div>

    <div id="tk-inbox">
      <div class="empty-state-row">Loading approval inbox…</div>
    </div>`;

  c.querySelector('#tk-auto-refresh').addEventListener('change', (e) => {
    _autoRefresh = e.target.checked;
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
    if (_autoRefresh) {
      _refreshTimer = setInterval(() => loadApprovalInbox(c), 30000);
      toast('info', 'Auto-refresh enabled', 'Refreshing every 30s');
    }
  });

  c.querySelector('#tk-refresh').addEventListener('click', () => loadApprovalInbox(c));

  loadApprovalInbox(c);
}
