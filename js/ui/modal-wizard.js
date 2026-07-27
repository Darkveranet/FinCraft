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
     • auto-appends a read-only "Review" step that summarises every named field
       so the user confirms before the [data-action] submit fires,
     • adds Back / Next buttons to the footer and hides the existing primary
       submit button until the final (Review) step,
     • resets to step 1 every time the modal is opened.

   Review-step OPT-OUT
   ───────────────────
   Some wizards must NOT get an auto Review step — e.g. modals whose final pane
   is already a bespoke review/confirmation, or destructive one-off actions that
   would be confused by a generic field dump. Those opt out declaratively:

       <div class="modal modal-lg" data-wizard data-wz-no-review> … </div>

   When `data-wz-no-review` is present (or the wizard already ships its own pane
   marked `data-wz-review`), NO synthetic Review step is injected — the wizard
   ends on its last authored pane. This module must always honour that opt-out.

   Because every field keeps its `name`, the handler's `formData(formId)` still
   sees the whole form on submit — panes are purely a display concern.
   ──────────────────────────────────────────────────────────────────────────── */

export function buildStepper(titles) {
  const stepper = document.createElement('div');
  stepper.className = 'stepper wz-modal-stepper';
  stepper.innerHTML = titles.map((t, i) => `
    <div class="step-item">
      <div class="step-circle ${i === 0 ? 'active' : ''}" data-wz-go="${i}">${i + 1}</div>
      <div class="step-label ${i === 0 ? 'active' : ''}" data-wz-go="${i}">${t}</div>
    </div>${i < titles.length - 1 ? `<div class="step-line" data-wz-line="${i}"></div>` : ''}`).join('');
  return stepper;
}

/* Human-readable label for a field: prefer its <label> text, fall back to the
   field's `name` de-camel-cased. */
function labelFor(field, form) {
  // Wrapping <label> (the pattern used throughout views/modals/*.html).
  const wrap = field.closest('label');
  const span = wrap?.querySelector('.form-label');
  let text = (span?.textContent || wrap?.textContent || '').trim();
  // <label for="id"> association.
  if (!text && field.id) {
    const assoc = form.querySelector(`label[for="${CSS && CSS.escape ? CSS.escape(field.id) : field.id}"]`);
    text = (assoc?.textContent || '').trim();
  }
  if (!text) {
    text = field.name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }
  return text.replace(/\s*\*\s*$/, '').trim();   // drop trailing required-asterisk
}

/* Display value for a field — resolves <select> option text, checkbox state,
   password masking, and skips empties. Returns null when nothing to show. */
function displayValue(field) {
  if (field.type === 'password') return field.value ? '••••••••' : null;
  if (field.type === 'checkbox') return field.checked ? 'Yes' : 'No';
  if (field.type === 'radio')    return field.checked ? (field.value || 'Yes') : null;
  if (field.tagName === 'SELECT') {
    const opt = field.selectedOptions && field.selectedOptions[0];
    const txt = (opt?.textContent || '').trim();
    if (!field.value || /^—/.test(txt)) return null;   // "— None —" style placeholders
    return txt || field.value;
  }
  const v = (field.value || '').trim();
  return v || null;
}

/* Build the synthetic Review pane. Not inserted here — caller decides placement. */
function buildReviewPane() {
  const pane = document.createElement('div');
  pane.className = 'wz-pane form-grid';
  pane.dataset.wzStep = 'Review';
  pane.dataset.wzReview = '1';        // marks this as the (synthetic) review pane
  pane.dataset.wzSynthetic = '1';
  pane.innerHTML = `
    <div class="msg-banner b-info full mb-4">
      <i class="fa-solid fa-circle-info"></i>
      Review the details below, then submit. Use <strong>Back</strong> to change anything.
    </div>
    <div class="wz-review-grid full" data-wz-review-grid></div>`;
  return pane;
}

/* Re-scan the form and repaint the review summary. Called each time the Review
   step becomes visible so it always reflects the latest input. */
function renderReview(form, grid) {
  if (!form || !grid) return;
  const seen = new Set();
  const rows = [];
  form.querySelectorAll('input[name], select[name], textarea[name]').forEach(field => {
    if (field.disabled || field.type === 'hidden' || field.type === 'file') return;
    if (field.type === 'radio' && !field.checked) return;
    // Collapse radio groups to a single row keyed by name.
    if (field.type === 'radio') { if (seen.has(field.name)) return; }
    const val = displayValue(field);
    if (val == null) return;
    if (seen.has(field.name) && field.type !== 'radio') return;
    seen.add(field.name);
    rows.push(`
      <div class="wz-review-row">
        <div class="wz-review-k">${labelFor(field, form)}</div>
        <div class="wz-review-v">${String(val).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</div>
      </div>`);
  });
  grid.innerHTML = rows.length
    ? rows.join('')
    : '<div class="text-muted">No details captured yet — go back and fill in the form.</div>';
}

export function setupWizard(box) {
  if (box.dataset.wzReady) return;
  const panes = [...box.querySelectorAll('[data-wz-step]')];
  if (panes.length < 2) return;
  box.dataset.wzReady = '1';

  const body = box.querySelector('.modal-body');
  const foot = box.querySelector('.modal-foot');
  const form = box.querySelector('form');
  const primary = foot?.querySelector('[data-action]');
  if (!body || !foot || !primary) return;

  /* ── Auto Review step ──────────────────────────────────────────────────────
     Honour the opt-out: skip injection when the wizard declares
     `data-wz-no-review`, or when it already ships its own pane flagged
     `data-wz-review`. Otherwise append a synthetic Review pane as the last step. */
  const optedOut     = box.hasAttribute('data-wz-no-review');
  const hasOwnReview = panes.some(p => p.hasAttribute('data-wz-review'));
  let reviewGrid = null;
  if (!optedOut && !hasOwnReview && form) {
    const reviewPane = buildReviewPane();
    form.appendChild(reviewPane);
    panes.push(reviewPane);
    reviewGrid = reviewPane.querySelector('[data-wz-review-grid]');
  }

  const titles = panes.map(p => p.dataset.wzStep);

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
    // Repaint the review summary whenever we land on it.
    if (reviewGrid && cur === last) renderReview(form, reviewGrid);
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

export function initWizardModals() {
  document.querySelectorAll('.modal[data-wizard]').forEach(setupWizard);
}

document.addEventListener('fc:modals-loaded', initWizardModals);
