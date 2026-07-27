/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · modal-wizard.js
   Markup-driven multi-step controller for the STATIC modal partials in
   views/modals/*.html (the ones submitted via [data-action] handlers).

   To turn any existing modal into a wizard, add `data-wizard` to its `.modal`
   box and split the form body into step panes:

       <form id="myForm">
         <div class="wz-pane form-grid" data-wz-step="Accounts"> … </div>
         <div class="wz-pane form-grid" data-wz-step="Schedule"> … </div>
       </form>

   This module then:
     • injects a clickable stepper at the top of the modal body,
     • adds Back / Next buttons to the footer and hides the existing primary
       submit button until the final step,
     • resets to step 1 every time the modal is opened.

   Because every field keeps its `name`, the handler's `formData(formId)` still
   sees the whole form on submit — panes are purely a display concern.

   REVIEW / CONFIRM STEP
   ─────────────────────
   Add a final pane flagged with `data-wz-review` to get an auto-generated
   read-only summary of every filled-in field, e.g.

       <div class="wz-pane" data-wz-step="Review" data-wz-review></div>

   The controller walks the form on entry to that pane and renders a
   label → value table (selects show their option text, checkboxes show
   Yes/No, password/empty fields are skipped). No per-form JS required.
   ──────────────────────────────────────────────────────────────────────────── */

function humanizeName(el) {
  // Prefer the visible .form-label text of the wrapping <label>, else the name.
  const wrap = el.closest('label');
  const lbl = wrap?.querySelector('.form-label');
  let t = lbl ? lbl.textContent : (el.getAttribute('name') || '');
  return t.replace(/\s*\*\s*$/, '').trim();
}

function fieldValue(el) {
  if (el.type === 'checkbox') return el.checked ? 'Yes' : '';
  if (el.type === 'radio') return el.checked ? (el.labels?.[0]?.textContent.trim() || el.value) : '';
  if (el.tagName === 'SELECT') {
    if (el.multiple) return [...el.selectedOptions].map(o => o.textContent.trim()).join(', ');
    const o = el.selectedOptions?.[0];
    return o && o.value !== '' ? o.textContent.trim() : '';
  }
  return (el.value || '').trim();
}

function renderReview(pane, form) {
  const seen = new Set();
  const rows = [];
  form.querySelectorAll('input[name], select[name], textarea[name]').forEach((el) => {
    if (el.type === 'hidden' || el.type === 'password' || el.disabled) return;
    if (el.type === 'radio') { if (seen.has(el.name)) return; }
    const val = fieldValue(el.type === 'radio' ? (form.querySelector(`input[name="${el.name}"]:checked`) || el) : el);
    if (el.type === 'radio') seen.add(el.name);
    if (!val) return;
    // For a client search, surface the typed display name if present.
    let label = humanizeName(el);
    if (!label || label.toLowerCase() === el.name.toLowerCase()) label = el.name;
    rows.push([label, val]);
  });
  // Include free-standing client search inputs (their hidden id is captured above).
  const searchDisplay = form.querySelector('.search-field input:not([type=hidden])');
  if (searchDisplay && searchDisplay.value.trim()) {
    rows.unshift(['Client', searchDisplay.value.trim()]);
  }
  pane.innerHTML = rows.length
    ? `<div class="wz-review-card">
         <div class="wz-review-title"><i class="fa-solid fa-clipboard-check"></i> Please review before submitting</div>
         <dl class="wz-review-list">${rows.map(([k, v]) =>
           `<div class="wz-review-row"><dt>${k}</dt><dd>${String(v).replace(/</g, '&lt;')}</dd></div>`).join('')}</dl>
       </div>`
    : `<div class="empty-state"><i class="fa-solid fa-clipboard"></i><div>Nothing to review yet — go back and fill in the form.</div></div>`;
}

function buildStepper(titles) {
  const stepper = document.createElement('div');
  stepper.className = 'stepper wz-modal-stepper';
  stepper.innerHTML = titles.map((t, i) => `
    <div class="step-item">
      <div class="step-circle ${i === 0 ? 'active' : ''}" data-wz-go="${i}">${i + 1}</div>
      <div class="step-label ${i === 0 ? 'active' : ''}" data-wz-go="${i}">${t}</div>
    </div>${i < titles.length - 1 ? `<div class="step-line" data-wz-line="${i}"></div>` : ''}`).join('');
  return stepper;
}

function setupWizard(box) {
  if (box.dataset.wzReady) return;
  const panes = [...box.querySelectorAll('[data-wz-step]')];
  if (panes.length < 2) return;
  box.dataset.wzReady = '1';

  const titles = panes.map(p => p.dataset.wzStep);
  const body = box.querySelector('.modal-body');
  const foot = box.querySelector('.modal-foot');
  const form = box.querySelector('form');
  const primary = foot?.querySelector('[data-action]');
  if (!body || !foot || !primary) return;

  // Stepper goes above the form (but below any intro banner already in body).
  const stepper = buildStepper(titles);
  (form || body).parentNode.insertBefore(stepper, form || body.firstChild);

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn-secondary wz-modal-back';
  backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn-primary wz-modal-next';
  nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
  foot.insertBefore(backBtn, primary);
  foot.insertBefore(nextBtn, primary);

  const last = panes.length - 1;
  let cur = 0;
  const show = (n) => {
    cur = Math.max(0, Math.min(last, n));
    panes.forEach((p, i) => { p.style.display = i === cur ? '' : 'none'; });
    // Auto-render the read-only summary whenever a review pane becomes active.
    const active = panes[cur];
    if (active && active.hasAttribute('data-wz-review') && form) renderReview(active, form);
    stepper.querySelectorAll('.step-circle').forEach((c, i) => {
      c.classList.toggle('active', i === cur);
      c.classList.toggle('done', i < cur);
    });
    stepper.querySelectorAll('.step-label').forEach((l, i) => {
      l.classList.toggle('active', i === cur);
      l.classList.toggle('done', i < cur);
    });
    stepper.querySelectorAll('[data-wz-line]').forEach(ln => ln.classList.toggle('done', Number(ln.dataset.wzLine) < cur));
    backBtn.style.display = cur === 0 ? 'none' : '';
    nextBtn.style.display = cur === last ? 'none' : '';
    primary.style.display = cur === last ? '' : 'none';
    body.scrollTop = 0;
  };

  nextBtn.addEventListener('click', () => show(cur + 1));
  backBtn.addEventListener('click', () => show(cur - 1));
  stepper.querySelectorAll('[data-wz-go]').forEach(s => s.addEventListener('click', () => show(Number(s.dataset.wzGo))));
  box._wzReset = () => show(0);
  show(0);

  // Reset to the first step whenever the modal is (re)opened.
  const overlay = box.closest('.modal-overlay');
  if (overlay && !overlay.dataset.wzObserved) {
    overlay.dataset.wzObserved = '1';
    new MutationObserver(() => { if (overlay.classList.contains('open')) box._wzReset?.(); })
      .observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }
}

function initWizardModals() {
  document.querySelectorAll('.modal[data-wizard]').forEach(setupWizard);
}

document.addEventListener('fc:modals-loaded', initWizardModals);
