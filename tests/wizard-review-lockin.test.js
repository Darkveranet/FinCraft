/* FinCraft · tests/wizard-review-lockin.test.js
   Locks in the two contract points of js/ui/modal-wizard.js's auto Review step:

     1. By DEFAULT, a `data-wizard` modal with ≥2 `data-wz-step` panes and a
        <form> gets a synthetic, read-only "Review" pane appended as its final
        step, and the primary [data-action] submit is deferred until that step.

     2. That behaviour MUST be opt-out-able. A modal that declares
        `data-wz-no-review` (or already ships its own `data-wz-review` pane) must
        get NO synthetic Review step — the wizard ends on its last authored pane.

   Regression guard: an earlier build injected the Review step unconditionally,
   ignoring `data-wz-no-review`, which broke wizards whose final pane is already
   a bespoke confirmation (and destructive one-off actions). This test fails if
   the opt-out is ever dropped again.

   Requires jsdom (installed via `npm install`). */
import assert from 'assert';

/* Minimal but representative two-step wizard modal, mirroring the shape of the
   static partials in views/modals/*.html. `extraModalAttrs` lets each case add
   e.g. `data-wz-no-review`. `ownReviewPane` injects a hand-authored review pane
   flagged `data-wz-review` to exercise the "already has its own review" branch. */
function wizardMarkup({ extraModalAttrs = '', ownReviewPane = false } = {}) {
  return `
    <div class="modal-overlay">
      <div class="modal modal-lg" data-wizard ${extraModalAttrs}>
        <div class="modal-head"><h3 class="modal-title">Demo</h3></div>
        <div class="modal-body">
          <form id="demoForm">
            <div class="wz-pane form-grid" data-wz-step="Details">
              <label><span class="form-label">Principal *</span>
                <input name="principal" class="form-control" value="5000"/></label>
              <label><span class="form-label">Loan officer</span>
                <select name="loanOfficerId" class="form-control">
                  <option value="">— None —</option>
                  <option value="7" selected>Ada Officer</option>
                </select></label>
            </div>
            <div class="wz-pane form-grid" data-wz-step="Schedule">
              <label><span class="form-label">Submitted on *</span>
                <input name="submittedOnDate" type="date" class="form-control" value="2026-07-27"/></label>
            </div>
            ${ownReviewPane ? `
            <div class="wz-pane form-grid" data-wz-step="Confirm" data-wz-review>
              <div class="msg-banner">Custom confirmation.</div>
            </div>` : ''}
          </form>
        </div>
        <div class="modal-foot">
          <button class="btn-ghost" data-close-modal>Cancel</button>
          <button class="btn-primary" data-action="submit-demo">Submit</button>
        </div>
      </div>
    </div>`;
}

export async function runTests({ assert: a = assert } = {}) {
  let JSDOM;
  try {
    ({ JSDOM } = await import('jsdom'));
  } catch {
    console.warn('[wizard-review-lockin] jsdom not installed — run `npm install` first. Skipping.');
    return;
  }

  const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.com/' });
  global.window   = dom.window;
  global.document = dom.window.document;
  global.CSS      = dom.window.CSS;
  global.MutationObserver = dom.window.MutationObserver;

  const { setupWizard } = await import('../js/ui/modal-wizard.js');

  const mount = (opts) => {
    document.body.innerHTML = wizardMarkup(opts);
    const box = document.querySelector('.modal[data-wizard]');
    setupWizard(box);
    return box;
  };

  const panesOf = (box)  => [...box.querySelectorAll('[data-wz-step]')];
  const stepsOf = (box)  => panesOf(box).map(p => p.dataset.wzStep);
  const primary = (box)  => box.querySelector('.modal-foot [data-action]');

  /* ── 1. DEFAULT: synthetic Review step is appended ───────────────────────── */
  {
    const box = mount();
    const steps = stepsOf(box);
    a.strictEqual(steps.length, 3, 'default wizard should gain one extra (Review) pane');
    a.strictEqual(steps[steps.length - 1], 'Review', 'the injected pane must be the LAST step titled "Review"');

    const review = panesOf(box)[steps.length - 1];
    a.ok(review.hasAttribute('data-wz-review'),   'injected review pane must carry data-wz-review');
    a.ok(review.hasAttribute('data-wz-synthetic'),'injected review pane must be flagged synthetic');

    // Submit stays hidden on the opening step…
    a.strictEqual(primary(box).style.display, 'none',
      'primary submit must be hidden until the final (Review) step');

    // …now advance to the Review step, which repaints the summary on arrival.
    const circles = box.querySelectorAll('.wz-modal-stepper .step-circle');
    circles[circles.length - 1].click();

    // Landing on Review repaints the summary from named fields (non-empty, non-placeholder).
    const grid = review.querySelector('[data-wz-review-grid]');
    a.ok(grid, 'review pane must contain a [data-wz-review-grid] summary container');
    a.ok(/Principal/.test(grid.textContent) && /5000/.test(grid.textContent),
      'review summary should list the Principal field and its value');
    a.ok(/Ada Officer/.test(grid.textContent),
      'review summary should resolve <select> option text, not the raw value');

    // Stepper reflects the extra step and submit is now revealed on the last step.
    a.strictEqual(box.querySelectorAll('.wz-modal-stepper .step-item').length, 3,
      'stepper must render one item per step, including the injected Review step');
    a.strictEqual(primary(box).style.display, '',
      'primary submit must be revealed once the final (Review) step is reached');
  }

  /* ── 2. OPT-OUT: data-wz-no-review suppresses the synthetic step ──────────── */
  {
    const box = mount({ extraModalAttrs: 'data-wz-no-review' });
    const steps = stepsOf(box);
    a.strictEqual(steps.length, 2, 'modal-wizard.js must honour the data-wz-no-review opt-out');
    a.ok(!steps.includes('Review'), 'no synthetic Review step may be injected when opted out');
    a.ok(!box.querySelector('[data-wz-synthetic]'),
      'opted-out wizard must contain no synthetic review pane');
  }

  /* ── 3. OWN REVIEW: a hand-authored data-wz-review pane is not duplicated ─── */
  {
    const box = mount({ ownReviewPane: true });
    const steps = stepsOf(box);
    a.strictEqual(steps.length, 3, 'a wizard shipping its own review pane must not get a second one');
    a.strictEqual(steps.filter(s => s === 'Confirm').length, 1, 'the authored review pane is preserved');
    a.ok(!box.querySelector('[data-wz-synthetic]'),
      'no synthetic review pane may be injected alongside an authored data-wz-review pane');
  }

  // Cleanup shared globals so later DOM suites start clean.
  document.body.innerHTML = '';
}
