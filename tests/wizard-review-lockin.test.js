/* FinCraft · tests/wizard-review-lockin.test.js
   Regression tests for the "Review/Confirm step + FD/RD lock-in fields" pass.

   These are DOM-modal + markup-driven flows, so (matching the house style used by
   accounting-fixes.test.js) they are covered by static source assertions rather than
   a live browser render:

     1. Auto Review step — js/ui/modal-wizard.js must inject a final Review pane
        (data-wz-review) and only reveal the primary submit button on the last step.
        It must also gate forward navigation on HTML5 validity (paneValid) and honour
        the data-wz-no-review opt-out.
     2. Every static wizard modal (`.modal[data-wizard]` with ≥2 `data-wz-step` panes)
        stays review-eligible — none of them hard-code their own data-wz-review pane
        (that would suppress the auto step) except by explicit opt-out.
     3. FD lock-in — the New Fixed Deposit form exposes lockinPeriodFrequency +
        lockinPeriodFrequencyType, and ui/handlers/fixed-deposit.js forwards both to
        the create payload (type defaulting to Months=2, mirroring savings.js).
     4. RD lock-in — same contract for the New Recurring Deposit form and
        ui/handlers/recurring-deposit.js. */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

export async function runTests({ assert: a }) {
  // ── 1. modal-wizard.js injects a Review pane + gates + opt-out ───────────────
  const wiz = read('js/ui/modal-wizard.js');
  a.ok(/data-wz-review/.test(wiz), 'modal-wizard.js must mark the injected pane with data-wz-review');
  a.ok(/renderReview\s*\(/.test(wiz), 'modal-wizard.js must render a review summary (renderReview)');
  a.ok(/data-wz-no-review/.test(wiz), 'modal-wizard.js must honour the data-wz-no-review opt-out');
  a.ok(/paneValid/.test(wiz) && /checkValidity/.test(wiz),
    'modal-wizard.js must gate Next on the current pane HTML5 validity');
  a.ok(/primary\.style\.display\s*=\s*cur\s*===\s*last/.test(wiz),
    'primary submit button must only show on the final (Review) step');

  // ── 2. Static wizard modals remain auto-review eligible ──────────────────────
  const wizardModals = [
    'views/modals/accounting.html', 'views/modals/admin.html', 'views/modals/clients.html',
    'views/modals/integrations.html', 'views/modals/loans.html', 'views/modals/products.html',
  ];
  for (const rel of wizardModals) {
    const src = read(rel);
    a.ok(/data-wizard/.test(src), `${rel} must still declare at least one data-wizard modal`);
    a.ok(!/data-wz-review/.test(src) && !/data-wz-no-review/.test(src),
      `${rel} must rely on the auto Review step (no hard-coded review pane / opt-out)`);
    const steps = (src.match(/data-wz-step=/g) || []).length;
    a.ok(steps >= 2, `${rel} must expose ≥2 wizard steps so a Review step is meaningful`);
  }
  // The remittance modal drives its own review via remit.js, so it must NOT be data-wizard.
  const integrations = read('views/modals/integrations.html');
  const remitBlock = integrations.slice(integrations.indexOf('id="remittanceModal"'));
  a.ok(!/data-wizard/.test(remitBlock.slice(0, remitBlock.indexOf('data-remit-pane'))),
    'remittanceModal must not use data-wizard (it renders its own review via remit.js)');

  // ── 3. Fixed Deposit lock-in field + payload wiring ──────────────────────────
  const savDeps = read('views/modals/savings-deposits.html');
  const fdForm = savDeps.slice(savDeps.indexOf('id="newFDForm"'), savDeps.indexOf('id="newRDForm"'));
  a.ok(/name="lockinPeriodFrequency"/.test(fdForm), 'FD form must expose lockinPeriodFrequency');
  a.ok(/name="lockinPeriodFrequencyType"/.test(fdForm), 'FD form must expose lockinPeriodFrequencyType');

  const fdH = read('js/ui/handlers/fixed-deposit.js');
  a.ok(/f\.lockinPeriodFrequency/.test(fdH), 'fixed-deposit.js must read lockinPeriodFrequency');
  a.ok(/payload\.lockinPeriodFrequency\s*=\s*parseInt/.test(fdH),
    'fixed-deposit.js must forward lockinPeriodFrequency to the payload');
  a.ok(/payload\.lockinPeriodFrequencyType\s*=\s*parseInt\(f\.lockinPeriodFrequencyType\s*\|\|\s*2\)/.test(fdH),
    'fixed-deposit.js must forward lockinPeriodFrequencyType (default Months=2)');

  // ── 4. Recurring Deposit lock-in field + payload wiring ──────────────────────
  const rdForm = savDeps.slice(savDeps.indexOf('id="newRDForm"'), savDeps.indexOf('id="savingsDepositModal"'));
  a.ok(/name="lockinPeriodFrequency"/.test(rdForm), 'RD form must expose lockinPeriodFrequency');
  a.ok(/name="lockinPeriodFrequencyType"/.test(rdForm), 'RD form must expose lockinPeriodFrequencyType');

  const rdH = read('js/ui/handlers/recurring-deposit.js');
  a.ok(/f\.lockinPeriodFrequency/.test(rdH), 'recurring-deposit.js must read lockinPeriodFrequency');
  a.ok(/payload\.lockinPeriodFrequency\s*=\s*parseInt/.test(rdH),
    'recurring-deposit.js must forward lockinPeriodFrequency to the payload');
  a.ok(/payload\.lockinPeriodFrequencyType\s*=\s*parseInt\(f\.lockinPeriodFrequencyType\s*\|\|\s*2\)/.test(rdH),
    'recurring-deposit.js must forward lockinPeriodFrequencyType (default Months=2)');
}
