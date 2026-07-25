import { api } from '../../../api.js';
import { escapeHtml } from '../../../utils.js';

export async function loadGroupHierarchy(c) {
  const el = c.querySelector('#og-15');
  try {
    const res = await api.groupLevels.list();
    const list = Array.isArray(res) ? res : [];
    list.sort((a, b) => (a.parentLevel ?? a.level ?? 0) - (b.parentLevel ?? b.level ?? 0));

    el.innerHTML = `
      <div class="section-header mb-2">
        <div>
          <h3>Group Hierarchy Levels</h3>
          <span class="text-muted">${list.length} level${list.length !== 1 ? 's' : ''} configured</span>
        </div>
      </div>
      <div class="text-muted small mb-2">
        <i class="fa-solid fa-circle-info"></i>
        Read-only reference: this is how Groups and Centers nest for this tenant. Configured in Fineract, not here.
      </div>
      ${list.length ? `
        <table class="table">
          <thead><tr><th>Level</th><th>Super parent?</th><th>Parent level</th></tr></thead>
          <tbody>${list.map(lvl => `
            <tr>
              <td>${escapeHtml(lvl.levelName ?? lvl.description ?? '—')}</td>
              <td>${lvl.superParent ? '<i class="fa-solid fa-check text-success"></i>' : '—'}</td>
              <td>${lvl.parentLevel != null ? escapeHtml(String(lvl.parentLevel)) : '—'}</td>
            </tr>`).join('')}</tbody>
        </table>` : '<div class="empty-state-row">No group hierarchy levels returned by the server</div>'}`;
  } catch (e) {
    el.innerHTML = `<div class="text-error">${escapeHtml(e.message)}</div>`;
  }
}
