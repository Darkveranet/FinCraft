import { navigate } from '../router.js';

export function renderSectionHub(c, { pageKey, title, subtitle, sections, params, headerExtra }) {
  const activeKey = params?.section;
  const active = activeKey ? sections.find(s => s.key === activeKey) : null;

  if (!active) {
    c.innerHTML = `
      <div class="page-header mb-3">
        <div>
          <h1>${title}</h1>
          <div class="text-muted">${subtitle}</div>
        </div>
        ${headerExtra ? `<div class="page-actions">${headerExtra}</div>` : ''}
      </div>
      <div class="hub-grid">
        ${sections.map(s => `
          <button class="hub-card" data-hub-section="${s.key}">
            <div class="hub-card-icon"><i class="fa-solid ${s.icon}"></i></div>
            <div class="hub-card-label">${s.label}</div>
            ${s.desc ? `<div class="hub-card-desc">${s.desc}</div>` : ''}
          </button>`).join('')}
      </div>`;
    c.querySelectorAll('[data-hub-section]').forEach(btn =>
      btn.addEventListener('click', () => navigate(pageKey, { section: btn.dataset.hubSection })));
    return;
  }

  c.innerHTML = `
    <button class="hub-back" data-hub-back><i class="fa-solid fa-arrow-left"></i> ${title}</button>
    <div class="page-header mb-3">
      <div>
        <h1>${active.label}</h1>
        ${active.desc ? `<div class="text-muted">${active.desc}</div>` : ''}
      </div>
    </div>
    <div class="card">
      <div id="${active.panelId}" class="empty-state-row"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading…</div>
    </div>`;
  c.querySelector('[data-hub-back]').addEventListener('click', () => navigate(pageKey));

  active.load(c);
}
