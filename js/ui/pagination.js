import { num } from '../utils.js';

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
export const DEFAULT_PAGE_SIZE = 50;

export function renderPagination(container, { total, offset, pageSize, onChange }) {
  if (!container) return;
  if (!total) { container.innerHTML = ''; return; }

  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages  = Math.max(1, Math.ceil(total / pageSize));
  const from = offset + 1;
  const to   = Math.min(offset + pageSize, total);
  const pages = buildPageList(currentPage, totalPages);

  container.innerHTML = /* scan-allow-innerhtml: audited-safe — numeric IDs / code-defined labels & icons / computed dates / pre-escaped HTML fragments (no raw user data) */ `
    <div class="pagination-info">
      <span class="text-muted">Showing ${num(from)}–${num(to)} of ${num(total)}</span>
      <label class="pagination-size">
        <span class="text-muted">Rows per page</span>
        <select class="form-control" id="${container.id}-size">
          ${PAGE_SIZE_OPTIONS.map(s => `<option value="${s}" ${s === pageSize ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </label>
    </div>
    ${totalPages > 1 ? `
    <div class="pagination-actions">
      <button class="btn-mini" data-page="first" ${currentPage <= 1 ? 'disabled' : ''} title="First page"><i class="fa-solid fa-angles-left"></i></button>
      <button class="btn-mini" data-page="prev"  ${currentPage <= 1 ? 'disabled' : ''} title="Previous page"><i class="fa-solid fa-angle-left"></i></button>
      ${pages.map(p => p === '…'
        ? `<span class="pagination-ellipsis">…</span>`
        : `<button class="btn-mini${p === currentPage ? ' active' : ''}" data-page="${p}">${p}</button>`
      ).join('')}
      <button class="btn-mini" data-page="next" ${currentPage >= totalPages ? 'disabled' : ''} title="Next page"><i class="fa-solid fa-angle-right"></i></button>
      <button class="btn-mini" data-page="last" ${currentPage >= totalPages ? 'disabled' : ''} title="Last page"><i class="fa-solid fa-angles-right"></i></button>
    </div>` : ''}`;

  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.page;
      let targetPage;
      if (p === 'first') targetPage = 1;
      else if (p === 'prev') targetPage = Math.max(1, currentPage - 1);
      else if (p === 'next') targetPage = Math.min(totalPages, currentPage + 1);
      else if (p === 'last') targetPage = totalPages;
      else targetPage = parseInt(p, 10);
      onChange((targetPage - 1) * pageSize, pageSize);
    });
  });

  container.querySelector(`#${container.id}-size`)?.addEventListener('change', (e) => {
    const newSize = parseInt(e.target.value, 10);
    const newOffset = Math.floor(offset / newSize) * newSize;
    onChange(newOffset, newSize);
  });
}

function buildPageList(current, total) {
  const delta = 1;
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i);

  const pages = [1];
  if (range[0] > 2) pages.push('…');
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push('…');
  if (total > 1) pages.push(total);
  return pages;
}
