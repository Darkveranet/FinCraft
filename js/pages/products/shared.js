import { api } from '../../api.js';
import { escapeHtml } from '../../utils.js';
import { store } from '../../store.js';

export const can = (code) => store.hasPermission(code);

export let _glCache = null;

export async function glOptions() {
  if (!_glCache) {
    try {
      const res = await api.glAccounts.list({ manualEntriesAllowed: true });
      _glCache = Array.isArray(res) ? res : [];
    } catch { _glCache = []; }
  }
  return _glCache.map(g => `<option value="${g.id}">${escapeHtml(g.name)} (${g.glCode})</option>`).join('');
}

export function glSelect(id, label, required = false) {
  return `
    <label>${label}${required ? ' *' : ''}
      <select id="${id}" class="form-control" ${required ? 'required' : ''}>
        <option value="">— Select GL account —</option>
      </select>
    </label>`;
}

export async function populateGl(el) {
  const opts = await glOptions();
  el.querySelectorAll('select[id^="gl-"]').forEach(sel => {
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Select GL account —</option>' + opts;
    if (cur) sel.value = cur;
  });
}

export function modal(mid, title, bodyHtml, wide = false) {
  document.getElementById('modalRoot')?.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal ${wide ? 'modal-lg' : 'modal-md'}">
        <div class="modal-header"><h3>${title}</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="${mid}-save">Save</button>
        </div>
      </div>
    </div>`);
  const elv = document.getElementById(mid);
  elv.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => elv.remove()));
  return elv;
}

/* ────────────────────────────────────────────────────────────────────────────
   wizardModal — a multi-step modal built on the same shell as modal().
   All step panels are rendered into the DOM up-front (inactive ones hidden),
   so existing querySelector-based capture / prefill / populateGl keep working
   exactly as they do for a flat form — we simply page through sections.

     steps = [{ label:'Details', html:`…markup…` }, …]

   The footer shows Back / Next while stepping and swaps to the primary Save
   button ("#<mid>-save") on the final step, so callers keep their existing
   save wiring untouched. Step circles are clickable for quick navigation.
   ──────────────────────────────────────────────────────────────────────── */
export function wizardModal(mid, title, steps, { wide = true, saveLabel = 'Save' } = {}) {
  const stepper = `<div class="stepper" id="${mid}-stepper">${steps.map((s, i) => `
    <div class="step-item">
      <div class="step-circle ${i === 0 ? 'active' : ''}" data-step="${i}">${i + 1}</div>
      <div class="step-label ${i === 0 ? 'active' : ''}" data-step="${i}">${escapeHtml(s.label)}</div>
    </div>${i < steps.length - 1 ? `<div class="step-line" data-line="${i}"></div>` : ''}`).join('')}</div>`;

  const panels = steps.map((s, i) => `
    <div class="wz-panel" data-panel="${i}" style="${i === 0 ? '' : 'display:none'}">
      <div class="wz-step-title">${escapeHtml(s.label)}</div>
      ${s.html}
    </div>`).join('');

  document.getElementById('modalRoot')?.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal ${wide ? 'modal-lg' : 'modal-md'}">
        <div class="modal-header"><h3>${title}</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">${stepper}${panels}</div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-secondary" id="${mid}-back" style="display:none"><i class="fa-solid fa-arrow-left"></i> Back</button>
          <button class="btn-primary" id="${mid}-next">Next <i class="fa-solid fa-arrow-right"></i></button>
          <button class="btn-primary" id="${mid}-save" style="display:none"><i class="fa-solid fa-check"></i> ${escapeHtml(saveLabel)}</button>
        </div>
      </div>
    </div>`);

  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => el.remove()));

  let cur = 0;
  const last = steps.length - 1;
  const show = (n) => {
    cur = Math.max(0, Math.min(last, n));
    el.querySelectorAll('.wz-panel').forEach(p => { p.style.display = Number(p.dataset.panel) === cur ? '' : 'none'; });
    el.querySelectorAll('.step-circle').forEach(c => {
      const i = Number(c.dataset.step);
      c.classList.toggle('active', i === cur);
      c.classList.toggle('done', i < cur);
    });
    el.querySelectorAll('.step-label').forEach(l => {
      const i = Number(l.dataset.step);
      l.classList.toggle('active', i === cur);
      l.classList.toggle('done', i < cur);
    });
    el.querySelectorAll('[data-line]').forEach(ln => ln.classList.toggle('done', Number(ln.dataset.line) < cur));
    el.querySelector('#' + mid + '-back').style.display = cur === 0 ? 'none' : '';
    el.querySelector('#' + mid + '-next').style.display = cur === last ? 'none' : '';
    el.querySelector('#' + mid + '-save').style.display = cur === last ? '' : 'none';
    el.querySelector('.modal-body').scrollTop = 0;
  };
  el.querySelector('#' + mid + '-next').addEventListener('click', () => show(cur + 1));
  el.querySelector('#' + mid + '-back').addEventListener('click', () => show(cur - 1));
  el.querySelectorAll('.step-circle,.step-label').forEach(s => s.addEventListener('click', () => show(Number(s.dataset.step))));

  return el;
}

export const v  = (el, id) => el.querySelector('#' + id)?.value?.trim() || '';

export const vi = (el, id) => { const n = parseInt(v(el, id)); return isNaN(n) ? null : n; };

export const vf = (el, id) => { const n = parseFloat(v(el, id)); return isNaN(n) ? null : n; };

export const vb = (el, id) => el.querySelector('#' + id)?.checked ?? false;

export const TABS = [
  'Loan Products',
  'Saving Products',
  'Fixed Deposits',
  'Recurring Deposits',
  'Share Products',
  'Product Mix',
  'Floating Rates',
  'Tax',
  'Delinquency'
];

export function resetGlCache() { _glCache = null; }
