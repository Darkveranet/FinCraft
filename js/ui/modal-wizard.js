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
     • auto-appends a final **Review** pane that summarises every entered
       field (grouped by step) so the user can confirm before submitting,
     • adds Back / Next buttons to the footer and hides the existing primary
       submit button until the final Review step,
     • gates Next on the current pane's HTML5 validity (required fields, etc.),
     • resets to step 1 every time the modal is opened.

   Because every field keeps its `name`, the handler's `formData(formId)` still
   sees the whole form on submit — panes are purely a display concern.

   Opt-out: add `data-wz-no-review` to the `.modal` box to skip the auto Review
   step (e.g. when the modal renders its own review pane, like remittances).
   ──────────────────────────────────────────────────────────────────────────── */

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

/* Is a control hidden by a display:none ancestor *below* the pane level?
   (The pane itself is toggled display:none by the wizard, so we stop at it.) */
function isFieldHidden(el, pane) {
  let node = el;
  while (node && node !== pane) {
    if (node.style && node.style.display === 'none') return true;
    node = node.parentElement;
  }
  return el.disabled === true;
}

/* Human-readable label for a control: nearest .form-label text, else its name. */
function fieldLabel(el) {
  const lbl = el.closest('label');
  const span = lbl?.querySelector('.form-label');
  let txt = (span?.textContent || lbl?.textContent || el.name || '').trim();
  return txt.replace(/\s*\*\s*$/, '').trim();          // strip trailing "*"
}

/* Display value for a control (blank string means "not set"). */
function fieldValue(el, pane) {
  const type = (el.type || '').toLowerCase();
  if (type === 'checkbox') return el.checked ? 'Yes' : 'No';
  if (type === 'radio')    return el.checked ? (fieldLabel(el) || el.value) : null;
  if (type === 'password') return el.value ? '••••••••' : '';
  if (el.tagName === 'SELECT') {
    const opt = el.selectedOptions?.[0];
    const t = opt ? opt.textContent.trim() : '';
    return /^—.*—$/.test(t) ? '' : t;                  // treat "— None —" as blank
  }
  if (type === 'hidden') {
    // Search-field pattern: show the paired visible input's text, not the raw id.
    const sf = el.closest('.search-field');
    const disp = sf?.querySelector('input:not([type=hidden])');
    if (disp && disp.value.trim()) return disp.value.trim();
    return el.value ? el.value.trim() : '';
  }
  return (el.value || '').trim();
}

/* Build the Review summary from all real panes into the given container. */
function renderReview(realPanes, container) {
  const seen = new Set();
  let html = '<p class="wz-review-intro">Please review the details below, then submit. '
           + 'Use <b>Back</b> or click a step above to make changes.</p>';

  realPanes.forEach((pane) => {
    const rows = [];
    pane.querySelectorAll('input[name], select[name], textarea[name]').forEach((el) => {
      if (isFieldHidden(el, pane)) return;
      if (el.type === 'radio' && !el.checked) return;
      const key = el.name + '|' + el.value;
      if (el.type === 'radio' && seen.has(el.name)) return;
      const val = fieldValue(el, pane);
      if (val === null || val === '') return;           // skip empty
      if (el.type === 'radio') seen.add(el.name);
      rows.push(`<div class="wz-rv"><div class="k">${fieldLabel(el)}</div><div class="v">${
        String(val).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))
      }</div></div>`);
    });
    if (!rows.length) return;
    html += `<div class="wz-review-section">
      <div class="wz-review-group-title">${pane.dataset.wzStep || 'Details'}</div>
      <div class="wz-review-grid">${rows.join('')}</div>
    </div>`;
  });

  if (!/wz-review-section/.test(html)) {
    html += '<p class="wz-rv v empty">No details entered yet.</p>';
  }
  container.innerHTML = html;
}

function setupWizard(box) {
  if (box.dataset.wzReady) return;
  const realPanes = [...box.querySelectorAll('[data-wz-step]')];
  if (realPanes.length < 2) return;
  box.dataset.wzReady = '1';

  const body = box.querySelector('.modal-body');
  const foot = box.querySelector('.modal-foot');
  const form = box.querySelector('form');
  const primary = foot?.querySelector('[data-action]');
  if (!body || !foot || !primary || !form) return;

  // Auto-append a Review pane (unless the modal opted out or already has one).
  const wantReview = !box.hasAttribute('data-wz-no-review')
    && !realPanes.some(p => p.hasAttribute('data-wz-review'));
  let reviewBody = null;
  if (wantReview) {
    const reviewPane = document.createElement('div');
    reviewPane.className = 'wz-pane';
    reviewPane.dataset.wzStep = 'Review';
    reviewPane.setAttribute('data-wz-review', '');
    reviewPane.innerHTML = '<div class="wz-review" data-wz-review-body></div>';
    form.appendChild(reviewPane);
    reviewBody = reviewPane.querySelector('[data-wz-review-body]');
  }

  const panes = [...box.querySelectorAll('[data-wz-step]')];
  const titles = panes.map(p => p.dataset.wzStep);

  // Stepper goes above the form (but below any intro banner already in body).
  const stepper = buildStepper(titles);
  form.parentNode.insertBefore(stepper, form);

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

  // Gate forward navigation on the current pane's HTML5 validity.
  const paneValid = (n) => {
    const pane = panes[n];
    if (!pane) return true;
    const controls = [...pane.querySelectorAll('input, select, textarea')]
      .filter(el => !isFieldHidden(el, pane) && typeof el.checkValidity === 'function');
    for (const el of controls) {
      if (!el.checkValidity()) { el.reportValidity(); return false; }
    }
    return true;
  };

  const show = (n) => {
    cur = Math.max(0, Math.min(last, n));
    panes.forEach((p, i) => { p.style.display = i === cur ? '' : 'none'; });
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
    if (reviewBody && panes[cur].hasAttribute('data-wz-review')) {
      renderReview(panes.filter(p => !p.hasAttribute('data-wz-review')), reviewBody);
    }
    body.scrollTop = 0;
  };

  const goNext = () => { if (paneValid(cur)) show(cur + 1); };

  nextBtn.addEventListener('click', goNext);
  backBtn.addEventListener('click', () => show(cur - 1));
  stepper.querySelectorAll('[data-wz-go]').forEach(s => s.addEventListener('click', () => {
    const target = Number(s.dataset.wzGo);
    // Going backward is always allowed; going forward validates the panes in between.
    if (target <= cur) { show(target); return; }
    for (let i = cur; i < target; i++) { if (!paneValid(i)) { show(i); return; } }
    show(target);
  }));
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
