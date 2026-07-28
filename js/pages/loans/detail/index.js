import { api } from '../../../api.js';
import { can } from '../shared.js';
import { confirm, openModal, toast } from '../../../ui.js';
import { escapeHtml, fmt, fmtDate, num, sb } from '../../../utils.js';
import { store } from '../../../store.js';
import { openApproveModal, openApprovedAmountHistoryModal, openAssignOfficerModal, openChargeOffModal, openCloseLoanModal, openDisburseModal, openDisburseToSavingsModal, openForecloseModal, openModifyApprovedAmountModal, openModifyAvailableDisbursementAmountModal, openReageModal, openReamortizeModal, openRecoverPaymentModal, openSimpleLoanCmdModal, openWaiveInterestModal } from '../actions.js';
import { loadLoanCollateral, loadLoanEAO, loadLoanGuarantors, loadLoanOriginators } from './collateral-guarantors.js';
import { loadLoanBuyDown, loadLoanDelinquency, loadLoanReschedule } from './lifecycle.js';
import { loadLoanDocuments, loadLoanNotes } from './notes-docs.js';
import { loadOriginalSchedule, loadSchedule } from './schedule.js';
import { loadLoanCharges, loadLoanDisbursements, loadLoanTransactions } from './transactions.js';
import { enhanceScrollableTabs } from '../../../ui/scrollable-tabs.js';
import { extractFineractError } from '../../../ui/dom-helpers.js';

/* ────────────────────────────────────────────────────────────────────────────
   Loan detail — redesigned to the FinCraft "cv-" visual language so it reads as
   one product with the Clients module. Layout mirrors the approved mock-up:

     • Hero header  → LN-code + product·client·office, Back + contextual primary
                      action, and a "⋯" menu holding EVERY other lifecycle action.
     • 3 KPI cards  → Loan Status (+ repayment-progress bar), Principal, Outstanding.
     • 5 clean tabs → Overview · Repayment Schedule · Credit Assessment ·
                      Approvals · Documents.

   IMPORTANT: this is a re-skin, NOT a feature cut. Every previously-audited
   Fineract capability (transactions, charges, disbursements, delinquency,
   reschedule, collateral, guarantors, buy-down, originators, external asset
   owners, notes, docs and all lifecycle commands) is preserved — it is simply
   folded into the five tabs / the header action menu. Each sub-loader keeps its
   original container id (#ln-*-wrap etc.) so nothing downstream had to change.

   Bug fixed in passing: the old switchTab() had a dead `lazyLoaders;` statement
   (a no-op expression) instead of invoking the loader, so tab content never
   actually lazy-loaded. It now calls `lazyLoaders[name]()`.
   ──────────────────────────────────────────────────────────────────────────── */

const fmtCompact = (amount) => {
  if (amount == null || isNaN(amount)) return '—';
  const currency = store.get('defaultCurrency') || 'NGN';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency, notation: 'compact', maximumFractionDigits: 2
    }).format(amount);
  } catch { return num(amount); }
};

/* Next unpaid installment from the embedded repayment schedule. */
function nextRepayment(l) {
  const periods = (l.repaymentSchedule?.periods || []).filter(p => p.period);
  const due = periods.find(p => !p.complete && (p.totalDueForPeriod || 0) > 0)
    || periods.find(p => !p.complete);
  if (!due) return null;
  return { date: due.dueDate, amount: due.totalDueForPeriod ?? due.totalOutstandingForPeriod ?? 0 };
}

export async function renderDetail(c, id, initialTab = 'overview') {
  c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><div>Loading loan…</div></div>`;
  if (!id) { c.innerHTML = '<div class="empty-state">No loan selected</div>'; return; }

  try {
    const l = await api.loans.get(id, 'all');
    const status = l.status?.value || '';
    const s = l.summary || {};

    const canApprove        = status === 'Submitted and pending approval' && can('APPROVE_LOAN');
    const canUndoApproval   = status === 'Approved' && can('APPROVALUNDO_LOAN');
    const canReject         = status === 'Submitted and pending approval' && can('REJECT_LOAN');
    const canWithdraw       = status === 'Submitted and pending approval' && can('WITHDRAW_LOAN');
    const canDisburse       = status === 'Approved' && can('DISBURSE_LOAN');
    const canDisburseSavings= status === 'Approved' && can('DISBURSETOSAVINGS_LOAN');
    const canUndoDisburse   = status === 'Active' && !(s.totalRepayment > 0) && can('DISBURSALUNDO_LOAN');
    const canRepay          = status === 'Active' && can('REPAYMENT_LOAN');
    const canWaiveInt       = status === 'Active' && can('WAIVEINTERESTPORTION_LOAN');
    const canWriteOff       = status === 'Active' && can('WRITEOFF_LOAN');
    const canClose          = status === 'Active' && can('CLOSE_LOAN');
    const canForeclose      = status === 'Active' && can('FORECLOSURE_LOAN');
    const canReschedule     = status === 'Active' && can('CREATE_RESCHEDULELOAN');
    const canChargeOff      = status === 'Active' && can('CHARGEOFF_LOAN');
    const canRecover        = status === 'Active' && can('RECOVERYPAYMENT_LOAN');
    const canReAge          = status === 'Active' && can('REAGE_LOAN');
    const canReAmortize     = status === 'Active' && can('REAMORTIZE_LOAN');
    const canAssignOfficer  = can('UPDATELOANOFFICER_LOAN');
    const canMarkFraud      = can('UPDATE_LOAN');
    const canRecoverGuar    = status === 'Active' && can('RECOVERGUARANTEES_LOAN');
    const canModifyApprovedAmount = (status === 'Approved' || status === 'Active') && can('UPDATE_LOAN');
    const canModifyAvailableDisbursement = status === 'Active' && can('UPDATE_LOAN');

    /* Every lifecycle action, declared once. The contextual "primary" is lifted
       into the header; the rest live in the ⋯ menu — so each id renders exactly
       once and the handlers below bind cleanly (no duplicate-id shadowing). */
    const allActions = [
      canApprove        && { id: 'btn-approve',        icon: 'fa-check',              label: 'Approve' },
      canDisburse       && { id: 'btn-disburse',       icon: 'fa-money-bill-transfer',label: 'Disburse' },
      canRepay          && { id: 'btn-repay',          icon: 'fa-coins',              label: 'Record Repayment' },
      canUndoApproval   && { id: 'btn-undo-approval',  icon: 'fa-rotate-left',        label: 'Undo Approval' },
      canReject         && { id: 'btn-reject',         icon: 'fa-ban',                label: 'Reject' },
      canWithdraw       && { id: 'btn-withdraw',       icon: 'fa-rotate-left',        label: 'Withdraw' },
      canDisburseSavings&& { id: 'btn-disburse-savings',icon: 'fa-piggy-bank',        label: 'Disburse to Savings' },
      canUndoDisburse   && { id: 'btn-undo-disburse',  icon: 'fa-rotate-left',        label: 'Undo Disbursal' },
      canWaiveInt       && { id: 'btn-waive-int',      icon: 'fa-percent',            label: 'Waive Interest' },
      canRecover        && { id: 'btn-recover',        icon: 'fa-arrow-rotate-left',  label: 'Recover Payment' },
      canRecoverGuar    && { id: 'btn-recover-guar',   icon: 'fa-shield',             label: 'Recover Guarantees' },
      canReAge          && { id: 'btn-reage',          icon: 'fa-calendar-day',       label: 'Re-age' },
      canReAmortize     && { id: 'btn-reamortize',     icon: 'fa-calculator',         label: 'Re-amortize' },
      canReschedule     && { id: 'btn-reschedule',     icon: 'fa-calendar-plus',      label: 'Reschedule' },
      canAssignOfficer  && { id: 'btn-assign-officer', icon: 'fa-user-tag',           label: 'Assign Officer' },
      canModifyApprovedAmount && { id: 'btn-mod-approved-amt', icon: 'fa-sack-dollar', label: 'Modify Approved Amount' },
      canModifyApprovedAmount && { id: 'btn-approved-amt-hist', icon: 'fa-clock-rotate-left', label: 'Approved Amount History' },
      canModifyAvailableDisbursement && { id: 'btn-mod-avail-disb', icon: 'fa-wallet', label: 'Modify Available Disbursement' },
      canClose          && { id: 'btn-close-loan',     icon: 'fa-box-archive',        label: 'Close Loan' },
      canWriteOff       && { id: 'btn-writeoff',       icon: 'fa-eraser',             label: 'Write Off',   danger: true },
      canChargeOff      && { id: 'btn-chargeoff',      icon: 'fa-file-pen',           label: 'Charge Off',  danger: true },
      canForeclose      && { id: 'btn-foreclose',      icon: 'fa-circle-xmark',       label: 'Foreclose',   danger: true },
      canMarkFraud      && { id: 'btn-mark-fraud',     icon: 'fa-triangle-exclamation',label: 'Toggle Fraud Flag', danger: true }
    ].filter(Boolean);

    const primaryId = ['btn-repay', 'btn-approve', 'btn-disburse'].find(pid => allActions.some(a => a.id === pid));
    const primary   = allActions.find(a => a.id === primaryId);
    const menuActions = allActions.filter(a => a.id !== primaryId);

    const menuHtml = menuActions.map(a =>
      `<button class="dropdown-item${a.danger ? ' danger' : ''}" id="${a.id}"><i class="fa-solid ${a.icon}"></i> ${escapeHtml(a.label)}</button>`
    ).join('');

    // Repayment progress
    const totalDue  = s.totalExpectedRepayment ?? ((s.totalOutstanding || 0) + (s.totalRepayment || 0));
    const paid      = s.totalRepayment || 0;
    const progress  = totalDue > 0 ? Math.min(100, (paid / totalDue) * 100) : 0;
    const next      = nextRepayment(l);
    const dpd       = l.delinquent?.pastDueDays || 0;

    c.innerHTML = /* scan-allow-innerhtml: audited-safe — numeric IDs / code-defined labels & icons / computed dates / pre-escaped HTML fragments (no raw user data) */ `
    <div class="cv-detail ln-detail">
      <div class="cv-detail-head">
        <div>
          <h1>${escapeHtml(l.accountNo ? 'LN-' + l.accountNo : 'Loan #' + id)}</h1>
          <div class="cv-sub">${escapeHtml(l.loanProductName || 'Loan')} · ${escapeHtml(l.clientName || l.groupName || '—')} · ${escapeHtml(l.officeName || '—')}</div>
        </div>
        <div class="cv-detail-actions">
          <button class="cv-btn-ghost" id="back-to-loans"><i class="fa-solid fa-arrow-left"></i> Back</button>
          ${primary ? `<button class="cv-btn-solid" id="${primary.id}"><i class="fa-solid ${primary.icon}"></i> ${escapeHtml(primary.label)}</button>` : ''}
          ${menuHtml ? `
            <div class="dropdown" id="ln-kebab">
              <button class="cv-btn-ghost" id="ln-kebab-btn" title="More actions"><i class="fa-solid fa-ellipsis"></i></button>
              <div class="dropdown-menu cv-kebab-menu" style="right:0;left:auto">${menuHtml}</div>
            </div>` : ''}
        </div>
      </div>

      <!-- Hero KPI cards -->
      <div class="ln-kpi-row">
        <div class="cv-card ln-kpi ln-kpi-status">
          <div class="ln-kpi-head">
            <span class="ln-kpi-label"><i class="fa-solid fa-file-invoice-dollar"></i> Loan Status</span>
            <span class="ln-kpi-icon"><i class="fa-regular fa-credit-card"></i></span>
          </div>
          <div>${sb(status || '—')}</div>
          <div class="ln-progress-head">Repayment Progress <b>${progress.toFixed(1)}%</b></div>
          <div class="ln-progress"><div class="ln-progress-fill" style="width:${progress.toFixed(1)}%"></div></div>
          <div class="ln-progress-foot"><span>Paid: ${escapeHtml(fmtCompact(paid))}</span><span>Total: ${escapeHtml(fmtCompact(totalDue))}</span></div>
        </div>
        <div class="cv-card ln-kpi">
          <div class="ln-kpi-head">
            <span class="ln-kpi-label"><i class="fa-solid fa-sack-dollar"></i> Principal</span>
            <span class="ln-kpi-icon"><i class="fa-solid fa-dollar-sign"></i></span>
          </div>
          <div class="ln-kpi-value">${escapeHtml(fmtCompact(s.principalDisbursed ?? l.principal))}</div>
          <div class="ln-kpi-sub">Interest: ${escapeHtml(fmtCompact(s.interestCharged))}</div>
        </div>
        <div class="cv-card ln-kpi ${(s.totalOutstanding || 0) > 0 ? 'is-warn' : ''}">
          <div class="ln-kpi-head">
            <span class="ln-kpi-label"><i class="fa-solid fa-triangle-exclamation"></i> Outstanding</span>
            <span class="ln-kpi-icon"><i class="fa-solid fa-triangle-exclamation"></i></span>
          </div>
          <div class="ln-kpi-value">${escapeHtml(fmtCompact(s.totalOutstanding))}</div>
          <div class="ln-kpi-sub">${dpd > 0 ? `${num(dpd)} days past due` : 'Current'}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="cv-tabs" id="ln-tabs">
        <button class="cv-tab" data-lntab="overview">Overview</button>
        <button class="cv-tab" data-lntab="schedule">Repayment Schedule</button>
        <button class="cv-tab" data-lntab="credit">Credit Assessment</button>
        <button class="cv-tab" data-lntab="approvals">Approvals</button>
        <button class="cv-tab" data-lntab="documents">Documents</button>
      </div>

      <!-- Overview -->
      <div class="tab-panel" data-lnpanel="overview">
        ${l.delinquent?.delinquentDate ? `
          <div class="msg-banner b-warning mb-3">
            <i class="fa-solid fa-triangle-exclamation"></i> <b>Delinquent</b> since ${fmtDate(l.delinquent.delinquentDate)} ·
            range: ${escapeHtml(l.delinquencyRange?.classification || '—')}
          </div>` : ''}
        <div class="cv-grid-3">
          <div class="cv-card cv-panel">
            <h3>Loan Details</h3>
            <div class="cv-info-row"><span class="cv-i-label">Loan Number</span><span class="cv-i-val">${escapeHtml(l.accountNo || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Product</span><span class="cv-i-val">${escapeHtml(l.loanProductName || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Amount</span><span class="cv-i-val">${fmt(l.principal || 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Interest Rate</span><span class="cv-i-val">${num(l.annualInterestRate ?? l.interestRatePerPeriod)}% p.a.</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Interest Method</span><span class="cv-i-val">${escapeHtml(l.interestType?.value || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Tenure</span><span class="cv-i-val">${l.termFrequency || '—'} ${escapeHtml((l.termPeriodFrequencyType?.value || '').toLowerCase())}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Frequency</span><span class="cv-i-val">${l.repaymentEvery > 1 ? `every ${l.repaymentEvery} ` : ''}${escapeHtml((l.repaymentFrequencyType?.value || '—').toLowerCase())}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Purpose</span><span class="cv-i-val">${escapeHtml(l.loanPurposeName || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Loan Officer</span><span class="cv-i-val">${escapeHtml(l.loanOfficerName || 'Unassigned')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Disbursed</span><span class="cv-i-val">${fmtDate(l.timeline?.actualDisbursementDate) || '—'}</span></div>
          </div>

          <div class="cv-card cv-panel">
            <h3>Financial Summary</h3>
            <div class="cv-info-row"><span class="cv-i-label">Principal</span><span class="cv-i-val">${fmt(s.principalDisbursed ?? l.principal ?? 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Interest</span><span class="cv-i-val">${fmt(s.interestCharged || 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Fees</span><span class="cv-i-val">${fmt(s.feeChargesCharged || 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Penalties</span><span class="cv-i-val">${fmt(s.penaltyChargesCharged || 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Total Due</span><span class="cv-i-val">${fmt(totalDue || 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Amount Paid</span><span class="cv-i-val">${fmt(paid)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Outstanding</span><span class="cv-i-val">${fmt(s.totalOutstanding || 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Arrears</span><span class="cv-i-val">${fmt(s.totalOverdue || 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Days Past Due</span><span class="cv-i-val">${dpd > 0 ? num(dpd) : 'Current'}</span></div>
          </div>

          <div class="cv-card cv-panel">
            <h3>Next Repayment</h3>
            <div class="ln-hl-tile">
              <div class="cv-i-label">Due Date</div>
              <div class="ln-hl-val">${next ? (fmtDate(next.date) || '—') : '—'}</div>
            </div>
            <div class="ln-hl-tile">
              <div class="cv-i-label">Amount Due</div>
              <div class="ln-hl-val">${next ? fmt(next.amount) : '—'}</div>
            </div>
            <div class="cv-i-label" style="margin-top:14px">Guarantors</div>
            <div id="ln-ov-guarantors"><div class="cv-guarantor-line cv-dim">Loading…</div></div>
          </div>
        </div>
      </div>

      <!-- Repayment Schedule -->
      <div class="tab-panel" data-lnpanel="schedule" hidden>
        <div class="ln-toolbar">
          <h3>Repayment Schedule</h3>
          <div style="display:flex;gap:8px">
            <button class="cv-btn-ghost btn-sm" id="ln-toggle-original"><i class="fa-solid fa-clock-rotate-left"></i> Original schedule</button>
            <button class="cv-btn-ghost btn-sm" id="ln-export-schedule"><i class="fa-solid fa-download"></i> Export</button>
          </div>
        </div>
        <div id="ln-schedule"><div class="empty-state-row">Loading…</div></div>
        <div id="ln-original-schedule" class="ln-block mt-3" hidden><div class="empty-state-row">Loading…</div></div>
        <div class="ln-block mt-3">
          <h3>Transactions</h3>
          <div id="ln-tx-list"><div class="empty-state-row">Loading…</div></div>
        </div>
      </div>

      <!-- Credit Assessment (risk picture: guarantors, collateral, charges, delinquency) -->
      <div class="tab-panel" data-lnpanel="credit" hidden>
        <div class="ln-block"><div id="ln-guar-wrap"><div class="empty-state-row">Loading…</div></div></div>
        <div class="ln-block"><div id="ln-coll-wrap"><div class="empty-state-row">Loading…</div></div></div>
        <div class="ln-block"><div id="ln-charges-wrap"><div class="empty-state-row">Loading…</div></div></div>
        <div class="ln-block"><div id="ln-delq-wrap"><div class="empty-state-row">Loading…</div></div></div>
      </div>

      <!-- Approvals (timeline + disbursements + reschedule + advanced servicing) -->
      <div class="tab-panel" data-lnpanel="approvals" hidden>
        <div class="ln-block">
          <h3>Approval Timeline</h3>
          <ul class="ln-timeline">
            ${l.timeline?.submittedOnDate ? `<li class="ln-tl-item"><div class="ln-tl-title">Submitted for approval</div><div class="ln-tl-note">By ${escapeHtml(l.timeline.submittedByUsername || '—')}</div><div class="ln-tl-date">${fmtDate(l.timeline.submittedOnDate)}</div></li>` : ''}
            ${l.timeline?.approvedOnDate ? `<li class="ln-tl-item"><div class="ln-tl-title">Approved</div><div class="ln-tl-note">By ${escapeHtml(l.timeline.approvedByUsername || '—')}</div><div class="ln-tl-date">${fmtDate(l.timeline.approvedOnDate)}</div></li>` : ''}
            ${l.timeline?.actualDisbursementDate ? `<li class="ln-tl-item"><div class="ln-tl-title">Disbursed</div><div class="ln-tl-note">By ${escapeHtml(l.timeline.disbursedByUsername || '—')}</div><div class="ln-tl-date">${fmtDate(l.timeline.actualDisbursementDate)}</div></li>` : ''}
            ${l.timeline?.closedOnDate ? `<li class="ln-tl-item"><div class="ln-tl-title">Closed</div><div class="ln-tl-date">${fmtDate(l.timeline.closedOnDate)}</div></li>` : ''}
            ${!l.timeline?.closedOnDate ? `<li class="ln-tl-item is-pending"><div class="ln-tl-title">Current stage — ${escapeHtml(status || '—')}</div><div class="ln-tl-note">${l.timeline?.expectedMaturityDate ? 'Expected maturity ' + fmtDate(l.timeline.expectedMaturityDate) : 'In progress'}</div></li>` : ''}
          </ul>
        </div>
        <div class="ln-block">
          <h3>Disbursements</h3>
          <div id="ln-disb-wrap"><div class="empty-state-row">Loading…</div></div>
        </div>
        ${can('READ_RESCHEDULELOAN') ? `<div class="ln-block"><div id="ln-rs-wrap"><div class="empty-state-row">Loading…</div></div></div>` : ''}
        <div class="ln-block"><div id="ln-bd-wrap"><div class="empty-state-row">Loading…</div></div></div>
        ${can('READ_LOAN_ORIGINATOR') ? `<div class="ln-block"><div id="ln-orig-wrap"><div class="empty-state-row">Loading…</div></div></div>` : ''}
        <div class="ln-block"><div id="ln-eao-wrap"><div class="empty-state-row">Loading…</div></div></div>
      </div>

      <!-- Documents (+ notes) -->
      <div class="tab-panel" data-lnpanel="documents" hidden>
        <div class="ln-block"><div id="ln-docs-wrap"><div class="empty-state-row">Loading…</div></div></div>
        <div class="ln-block"><div id="ln-notes-wrap"><div class="empty-state-row">Loading…</div></div></div>
      </div>
    </div>`;

    // Guarantor names for the Next-Repayment card (best-effort, non-blocking).
    (async () => {
      const gWrap = c.querySelector('#ln-ov-guarantors');
      if (!gWrap) return;
      try {
        const res = await api.loans.guarantors(id);
        const list = Array.isArray(res) ? res : [];
        gWrap.innerHTML = list.length
          ? list.map(g => `<div class="cv-guarantor-line">${escapeHtml(g.clientName || g.entityDisplayName || [g.firstname, g.lastname].filter(Boolean).join(' ') || '—')}</div>`).join('')
          : '<div class="cv-guarantor-line cv-dim">None on file</div>';
      } catch { gWrap.innerHTML = '<div class="cv-guarantor-line cv-dim">—</div>'; }
    })();

    enhanceScrollableTabs(c.querySelector('#ln-tabs'));
    const tabs = c.querySelectorAll('[data-lntab]');
    const panels = c.querySelectorAll('[data-lnpanel]');
    const lazyLoaded = {};
    const lazyLoaders = {
      schedule: () => {
        loadSchedule(c, id);
        (typeof loadLoanTransactions === 'function') && loadLoanTransactions(c, id);
      },
      credit: () => {
        (typeof loadLoanGuarantors === 'function') && loadLoanGuarantors(c, id);
        (typeof loadLoanCollateral === 'function') && loadLoanCollateral(c, id);
        (typeof loadLoanCharges    === 'function') && loadLoanCharges(c, id);
        (typeof loadLoanDelinquency=== 'function') && loadLoanDelinquency(c, id);
      },
      approvals: () => {
        (typeof loadLoanDisbursements === 'function') && loadLoanDisbursements(c, id);
        if (can('READ_RESCHEDULELOAN') && typeof loadLoanReschedule === 'function') loadLoanReschedule(c, id);
        (typeof loadLoanBuyDown === 'function') && loadLoanBuyDown(c, id);
        if (can('READ_LOAN_ORIGINATOR') && typeof loadLoanOriginators === 'function') loadLoanOriginators(c, id);
        (typeof loadLoanEAO === 'function') && loadLoanEAO(c, id);
      },
      documents: () => {
        (typeof loadLoanDocuments === 'function') && loadLoanDocuments(c, id);
        (typeof loadLoanNotes     === 'function') && loadLoanNotes(c, id);
      }
    };
    function switchTab(name) {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.lntab === name));
      panels.forEach(p => {
        const on = p.dataset.lnpanel === name;
        p.hidden = !on;
        p.classList.toggle('active', on);   // match components.css .tab-panel.active display contract
      });
      if (lazyLoaders[name] && !lazyLoaded[name]) { lazyLoaded[name] = true; lazyLoaders[name](); }
      const params = new URLSearchParams();
      params.set('id', id);
      params.set('tab', name);
      location.hash = `loans?${params.toString()}`;
    }
    tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.lntab)));
    const validTab = ['overview', 'schedule', 'credit', 'approvals', 'documents'];
    switchTab(validTab.includes(initialTab) ? initialTab : 'overview');

    c.querySelector('#back-to-loans').addEventListener('click', () => {
      import('../../../router.js').then(r => r.navigate('loans'));
    });

    // Kebab menu toggle
    c.querySelector('#ln-kebab-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      c.querySelector('#ln-kebab').classList.toggle('open');
    });

    // Schedule toolbar
    let originalLoaded = false;
    c.querySelector('#ln-toggle-original')?.addEventListener('click', () => {
      const wrap = c.querySelector('#ln-original-schedule');
      if (!wrap) return;
      wrap.hidden = !wrap.hidden;
      if (!wrap.hidden && !originalLoaded) { originalLoaded = true; loadOriginalSchedule(c, id); }
    });
    c.querySelector('#ln-export-schedule')?.addEventListener('click', () => exportScheduleCsv(c, l));

    // ── Lifecycle action handlers (unchanged behaviour, ids resolve whether the
    //    button sits in the header or the ⋯ menu) ─────────────────────────────
    c.querySelector('#btn-approve')?.addEventListener('click', () => openApproveModal(id));
    c.querySelector('#btn-undo-approval')?.addEventListener('click', async () => {
      if (!await confirm({ title: 'Undo approval?', message: 'Return this loan to pending state.', confirmText: 'Undo Approval' })) return;
      try { await api.loans.undoApproval(id); toast('success', 'Approval undone', `#${id}`); document.dispatchEvent(new CustomEvent('fc:reload')); }
      catch (e) { toast('error', 'Failed', extractFineractError(e)); }
    });
    c.querySelector('#btn-reject')?.addEventListener('click', () => openSimpleLoanCmdModal({
      id, command: 'reject', label: 'Reject Loan', dateField: 'rejectedOnDate'
    }));
    c.querySelector('#btn-withdraw')?.addEventListener('click', () => openSimpleLoanCmdModal({
      id, command: 'withdrawnByApplicant', label: 'Withdrawn by Applicant', dateField: 'withdrawnOnDate'
    }));
    c.querySelector('#btn-disburse')?.addEventListener('click', () => openDisburseModal(id));
    c.querySelector('#btn-disburse-savings')?.addEventListener('click', () => openDisburseToSavingsModal(id));
    c.querySelector('#btn-undo-disburse')?.addEventListener('click', async () => {
      if (!await confirm({ title: 'Undo disbursal?', message: 'Loan returns to Approved status.', danger: true, confirmText: 'Undo' })) return;
      try { await api.loans.undoDisbursal(id); toast('success', 'Disbursal undone', ''); document.dispatchEvent(new CustomEvent('fc:reload')); }
      catch (e) { toast('error', 'Failed', extractFineractError(e)); }
    });
    c.querySelector('#btn-repay')?.addEventListener('click', () => {
      const modal = openModal('repaymentModal');
      if (modal) modal.dataset.loanId = id;
    });
    c.querySelector('#btn-waive-int')?.addEventListener('click', () => openWaiveInterestModal(id));
    c.querySelector('#btn-recover')?.addEventListener('click', () => openRecoverPaymentModal(id));
    c.querySelector('#btn-recover-guar')?.addEventListener('click', async () => {
      if (!await confirm({ title: 'Recover guarantees?', confirmText: 'Recover' })) return;
      try { await api.loans.recoverGuarantees(id); toast('success', 'Guarantees recovered', ''); document.dispatchEvent(new CustomEvent('fc:reload')); }
      catch (e) { toast('error', 'Failed', extractFineractError(e)); }
    });
    c.querySelector('#btn-reage')?.addEventListener('click', () => openReageModal(id));
    c.querySelector('#btn-reamortize')?.addEventListener('click', () => openReamortizeModal(id));
    c.querySelector('#btn-writeoff')?.addEventListener('click', () => {
      const modal = openModal('writeOffModal');
      if (modal) modal.dataset.loanId = id;
    });
    c.querySelector('#btn-chargeoff')?.addEventListener('click', () => openChargeOffModal(id));
    c.querySelector('#btn-foreclose')?.addEventListener('click', () => openForecloseModal(id));
    c.querySelector('#btn-close-loan')?.addEventListener('click', () => openCloseLoanModal(id));
    c.querySelector('#btn-reschedule')?.addEventListener('click', () => {
      const modal = openModal('rescheduleModal');
      if (modal) {
        modal.dataset.loanId = id;
        const hidden = document.getElementById('rs-loanid');
        if (hidden) hidden.value = id;
      }
    });
    c.querySelector('#btn-assign-officer')?.addEventListener('click', () => openAssignOfficerModal(id, l.loanOfficerName));
    c.querySelector('#btn-mod-approved-amt')?.addEventListener('click', () =>
      openModifyApprovedAmountModal(id, l.approvedPrincipal ?? s.principalDisbursed, () => document.dispatchEvent(new CustomEvent('fc:reload'))));
    c.querySelector('#btn-approved-amt-hist')?.addEventListener('click', () => openApprovedAmountHistoryModal(id));
    c.querySelector('#btn-mod-avail-disb')?.addEventListener('click', () =>
      openModifyAvailableDisbursementAmountModal(id, s.availableDisbursementAmount, () => document.dispatchEvent(new CustomEvent('fc:reload'))));
    c.querySelector('#btn-mark-fraud')?.addEventListener('click', async () => {
      if (!await confirm({ title: 'Toggle fraud flag?', message: 'This flags or unflags the loan as fraudulent.', danger: true, confirmText: 'Toggle' })) return;
      try { await api.loans.markAsFraud(id, { fraud: !l.fraud }); toast('warn', 'Fraud flag toggled', ''); document.dispatchEvent(new CustomEvent('fc:reload')); }
      catch (e) { toast('error', 'Failed', extractFineractError(e)); }
    });

  } catch (e) {
    c.innerHTML = `<div class="card"><div class="empty-state">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <div><b>Failed to load loan</b></div>
      <div class="text-muted mt-2">${escapeHtml(extractFineractError(e))}</div>
    </div></div>`;
  }
}

/* CSV export of the currently rendered repayment schedule. */
function exportScheduleCsv(c, l) {
  const periods = (l.repaymentSchedule?.periods || []).filter(p => p.period);
  if (!periods.length) { toast('warn', 'Nothing to export', 'No schedule available'); return; }
  const rows = [['#', 'Due Date', 'Principal', 'Interest', 'Fees', 'Penalty', 'Total Due', 'Paid', 'Outstanding', 'Status']];
  periods.forEach(p => rows.push([
    p.period,
    fmtDate(p.dueDate) || '',
    p.principalDue || 0, p.interestDue || 0, p.feeChargesDue || 0, p.penaltyChargesDue || 0,
    p.totalDueForPeriod || 0, p.totalPaidForPeriod || 0, p.totalOutstandingForPeriod || 0,
    p.complete ? 'Paid' : (p.daysOverdue > 0 ? 'Overdue' : 'Pending')
  ]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `repayment-schedule-${l.accountNo || 'loan'}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('success', 'Schedule exported', a.download);
}
