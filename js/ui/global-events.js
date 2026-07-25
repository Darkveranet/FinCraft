import { navigate } from '../router.js';
import { theme, sidebar, dropdownToggle, closeAllDropdowns, tab, openModal, closeModal,
         closeAllModals, toast } from './core.js';
import { handleAction } from './handlers/index.js';

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-nav],[data-modal],[data-close-modal],[data-action],[data-tab],[data-remove-row],[data-toggle-password]');
  if (!t) {
    if (!e.target.closest('.dropdown')) closeAllDropdowns();
    return;
  }

  if (t.hasAttribute('data-remove-row')) { t.closest('tr')?.remove(); return; }

  if (t.hasAttribute('data-toggle-password')) {
    const targetId = t.dataset.togglePassword;
    const input = targetId ? document.getElementById(targetId) : t.closest('.input-group')?.querySelector('input[type="password"], input[type="text"].pw-revealed');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
    return;
  }

  if (t.matches('[data-tab]')) { tab(t, t.dataset.tab); return; }

  if (t.dataset.nav) {
    const [page, query] = t.dataset.nav.split('?');
    const params = {};
    if (query) {
      query.split('&').forEach(kv => {
        const [k, v] = kv.split('=');
        if (k) params[k] = decodeURIComponent(v || '');
      });
    }
    navigate(page, params);
    closeAllDropdowns();
    sidebar.close();
    return;
  }

  if (t.dataset.modal) {
    const modalId = t.dataset.modal;
    const modalEl = openModal(modalId);
    if (modalEl) {
      Object.entries(t.dataset).forEach(([k, v]) => { if (k !== 'modal') modalEl.dataset[k] = v; });
      if (modalId === 'runReportModal') {
        const nameEl = modalEl.querySelector('#run-report-name');
        if (nameEl) nameEl.textContent = t.dataset.report || '—';
        const out = modalEl.querySelector('#rep-output');
        if (out) out.innerHTML = '';
      }
      if (modalId === 'repaymentModal' && modalEl.dataset.loanId) {
        const loanIdInput = modalEl.querySelector('#rp-loanid');
        if (loanIdInput) loanIdInput.value = modalEl.dataset.loanId;
      }
    }
    return;
  }

  if (t.hasAttribute('data-close-modal')) {
    const m = t.closest('.modal-overlay');
    if (m) m.classList.remove('open');
    return;
  }

  const action = t.dataset.action;
  if (!action) return;
  switch (action) {
    case 'toggle-theme':     theme.toggle();              break;
    case 'toggle-sidebar':   sidebar.toggle();            break;
    case 'toggle-user-menu': dropdownToggle('userMenu');  break;
    case 'open-cmd':         import('../cmd.js').then(m => m.openCmd()); break;
    case 'logout':           import('../auth.js').then(m => m.logout()); break;
    case 'dismiss-toast':    t.closest('.toast')?.remove(); break;
    default:
      handleAction(action, t);
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList?.contains('modal-overlay')) e.target.classList.remove('open');
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    import('../cmd.js').then(m => m.openCmd());
    return;
  }
  if (e.key === 'Escape') {
    closeAllModals();
    closeAllDropdowns();
    import('../cmd.js').then(m => m.closeCmd?.());
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    openModal('newClientModal');
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    openModal('newLoanModal');
    return;
  }
  if (e.key === '?' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    toast('info', 'Shortcuts', 'Ctrl+K palette · Ctrl+Shift+N new client · Ctrl+Shift+L new loan · ESC close');
  }
});
