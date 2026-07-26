import { api } from '../../../api.js';
import { DATE_FORMAT, LOCALE, today } from '../../../config.js';
import { confirm, openModal, toast } from '../../../ui.js';
import { escapeHtml, fmt, fmtDate, num, sb } from '../../../utils.js';
import { store } from '../../../store.js';
import { exportStatement, openAnnualFeesModal, openApproveSavingsModal, openEditSavingsModal, openHoldModal, openPostInterestAsOnModal, openSavingsAssignStaffModal, openSavingsCloseModal, openSavingsSimpleCmd, openSavingsTransactionModal } from '../actions.js';
import { can } from '../shared.js';
import { loadSavingsDocuments, loadSavingsNotes } from './notes-docs.js';
import { loadSavingsSI } from './si.js';
import { loadOnHoldFunds, loadSavingsCharges, loadSavingsTransactions } from './transactions.js';
import { enhanceScrollableTabs } from '../../../ui/scrollable-tabs.js';
import { extractFineractError } from '../../../ui/dom-helpers.js';

/* ────────────────────────────────────────────────────────────────────────────
   Savings / Deposit detail — redesigned to the shared FinCraft "cv-" card
   language so Clients, Loans and Savings all read as one product. Layout:

     • Hero header  → SV-code + product·client·office, Back + contextual primary
                      action, and a "⋯" menu holding EVERY other lifecycle action.
     • 3 KPI cards  → Account Status (+ officer/product), Account Balance
                      (+ available), Interest Earned (+ posted / On-hold warn).
     • Clean tabs   → Overview · Transactions · Charges · Standing Instructions ·
                      Documents.

   IMPORTANT: re-skin, NOT a feature cut. Every previously-audited capability
   (deposit/withdraw, hold, block/unblock incl. debit/credit sub-blocks,
   approve/undo/reject/withdraw-app, activate, calc/post interest [+ as-on],
   annual fees, assign staff, edit, close, delete, statement export, on-hold
   funds, notes, docs, standing instructions) is preserved — folded into the
   header action menu + tabs. Each sub-loader keeps its original #sv-*-wrap id.

   Bug fixed in passing: the old switchTab() had a dead `lazyLoaders;` statement
   (a no-op) instead of invoking the loader, so tab content never lazy-loaded.
   It now calls `lazyLoaders[name]()` and also toggles `.active` on the panel to
   satisfy the components.css `.tab-panel.active{display:block}` contract.
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

export async function renderDetail(c, id, initialTab = 'overview') {
  c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><div>Loading account…</div></div>`;
  if (!id) { c.innerHTML = '<div class="empty-state">No account selected</div>'; return; }

  try {
    const s = await api.savings.get(id, { associations: 'all' });
    const status = s.status?.value || '';
    const sub = s.subStatus?.value || '';
    const sm = s.summary || {};

    const isPending  = status === 'Submitted and pending approval';
    const isApproved = status === 'Approved';
    const isActive   = status === 'Active';
    const isBlocked  = sub === 'Block' || sub === 'BlockDebit' || sub === 'BlockCredit';
    const isDepBlocked  = sub === 'BlockCredit' || sub === 'Block';
    const isWdrBlocked  = sub === 'BlockDebit'  || sub === 'Block';

    const canApprove        = isPending  && can('APPROVE_SAVINGSACCOUNT');
    const canUndoApproval   = isApproved && can('APPROVALUNDO_SAVINGSACCOUNT');
    const canReject         = isPending  && can('REJECT_SAVINGSACCOUNT');
    const canWithdrawApp    = isPending  && can('WITHDRAW_SAVINGSACCOUNT');
    const canActivate       = isApproved && can('ACTIVATE_SAVINGSACCOUNT');
    const canDeposit        = isActive   && can('DEPOSIT_SAVINGSACCOUNT');
    const canWithdraw       = isActive   && can('WITHDRAWAL_SAVINGSACCOUNT');
    const canHold           = isActive   && can('HOLDAMOUNT_SAVINGSACCOUNT');
    const canBlock          = isActive   && can('BLOCK_SAVINGSACCOUNT');
    const canClose          = isActive   && can('CLOSE_SAVINGSACCOUNT');
    const canPostInterest   = isActive   && can('POSTINTEREST_SAVINGSACCOUNT');
    const canCalcInterest   = isActive   && can('CALCULATEINTEREST_SAVINGSACCOUNT');
    const canApplyAnnualFee = isActive   && can('APPLYANNUALFEE_SAVINGSACCOUNT');
    const canAssignStaff    = isActive   && (can('UPDATESAVINGSOFFICER_SAVINGSACCOUNT') || can('REMOVESAVINGSOFFICER_SAVINGSACCOUNT'));
    const canEdit           = (isPending || isApproved) && can('UPDATE_SAVINGSACCOUNT');
    const canDelete         = (isPending || status === 'Rejected') && can('DELETE_SAVINGSACCOUNT');

    /* Every lifecycle action declared once; the contextual primary is lifted
       into the header and the rest live in the ⋯ menu, so each id renders once. */
    const allActions = [
      canApprove          && { id: 'btn-sv-approve',        icon: 'fa-check',          label: 'Approve' },
      canActivate         && { id: 'btn-sv-activate',       icon: 'fa-circle-check',   label: 'Activate' },
      canDeposit          && { id: 'btn-sv-deposit',        icon: 'fa-arrow-down',     label: 'Deposit' },
      canWithdraw         && { id: 'btn-sv-withdraw',       icon: 'fa-arrow-up',       label: 'Withdraw' },
      canEdit             && { id: 'btn-sv-edit',           icon: 'fa-pen',            label: 'Edit' },
      canUndoApproval     && { id: 'btn-sv-undo-approval',  icon: 'fa-rotate-left',    label: 'Undo Approval' },
      canReject           && { id: 'btn-sv-reject',         icon: 'fa-ban',            label: 'Reject' },
      canWithdrawApp      && { id: 'btn-sv-withdraw-app',   icon: 'fa-rotate-left',    label: 'Withdraw Application' },
      canHold             && { id: 'btn-sv-hold',           icon: 'fa-lock',           label: 'Hold Amount' },
      canBlock && !isBlocked                 && { id: 'btn-sv-block',       icon: 'fa-ban',    label: 'Block Account' },
      canBlock &&  isBlocked && sub === 'Block' && { id: 'btn-sv-unblock',  icon: 'fa-unlock', label: 'Unblock Account' },
      canBlock && !isDepBlocked              && { id: 'btn-sv-block-dep',   icon: 'fa-ban',    label: 'Block Deposit' },
      canBlock &&  isDepBlocked              && { id: 'btn-sv-unblock-dep', icon: 'fa-unlock', label: 'Unblock Deposit' },
      canBlock && !isWdrBlocked              && { id: 'btn-sv-block-wd',    icon: 'fa-ban',    label: 'Block Withdrawal' },
      canBlock &&  isWdrBlocked              && { id: 'btn-sv-unblock-wd',  icon: 'fa-unlock', label: 'Unblock Withdrawal' },
      canCalcInterest     && { id: 'btn-sv-calc-int',       icon: 'fa-calculator',     label: 'Calculate Interest' },
      canPostInterest     && { id: 'btn-sv-post-int',       icon: 'fa-percent',        label: 'Post Interest' },
      canPostInterest     && { id: 'btn-sv-post-int-asof',  icon: 'fa-calendar-day',   label: 'Post Interest As-On' },
      canApplyAnnualFee   && { id: 'btn-sv-annual-fee',     icon: 'fa-money-bill-wave',label: 'Apply Annual Fees' },
      canAssignStaff      && { id: 'btn-sv-assign-staff',   icon: 'fa-user-tag',       label: 'Assign Staff' },
      { id: 'btn-sv-export', icon: 'fa-download', label: 'Download Statement' },
      canClose            && { id: 'btn-sv-close',          icon: 'fa-box-archive',    label: 'Close Account', danger: true },
      canDelete           && { id: 'btn-sv-delete',         icon: 'fa-trash',          label: 'Delete Account', danger: true }
    ].filter(Boolean);

    const primaryId = ['btn-sv-deposit', 'btn-sv-approve', 'btn-sv-activate'].find(pid => allActions.some(a => a.id === pid));
    const primary   = allActions.find(a => a.id === primaryId);
    const menuActions = allActions.filter(a => a.id !== primaryId);
    const menuHtml = menuActions.map(a =>
      `<button class="dropdown-item${a.danger ? ' danger' : ''}" id="${a.id}"><i class="fa-solid ${a.icon}"></i> ${escapeHtml(a.label)}</button>`
    ).join('');

    const onHold = sm.onHoldFunds ?? 0;
    const thirdWarn = onHold > 0;

    c.innerHTML = `
    <div class="cv-detail sv-detail">
      <div class="cv-detail-head">
        <div>
          <h1>${escapeHtml(s.accountNo ? 'SA-' + s.accountNo : 'Savings #' + id)}</h1>
          <div class="cv-sub">${escapeHtml(s.savingsProductName || 'Savings')} · ${escapeHtml(s.clientName || s.groupName || '—')} · ${escapeHtml(s.officeName || '—')}</div>
        </div>
        <div class="cv-detail-actions">
          <button class="cv-btn-ghost" id="back-to-savings"><i class="fa-solid fa-arrow-left"></i> Back</button>
          ${primary ? `<button class="cv-btn-solid" id="${primary.id}"><i class="fa-solid ${primary.icon}"></i> ${escapeHtml(primary.label)}</button>` : ''}
          ${menuHtml ? `
            <div class="dropdown" id="sv-kebab">
              <button class="cv-btn-ghost" id="sv-kebab-btn" title="More actions"><i class="fa-solid fa-ellipsis"></i></button>
              <div class="dropdown-menu cv-kebab-menu" style="right:0;left:auto">${menuHtml}</div>
            </div>` : ''}
        </div>
      </div>

      <!-- Hero KPI cards -->
      <div class="sv-kpi-row">
        <div class="cv-card sv-kpi">
          <div class="sv-kpi-head">
            <span class="sv-kpi-label"><i class="fa-solid fa-piggy-bank"></i> Account Status</span>
            <span class="sv-kpi-icon"><i class="fa-solid fa-piggy-bank"></i></span>
          </div>
          <div>${sb(status || '—')} ${sub ? sb(sub) : ''}</div>
          <div class="sv-status-meta">
            <span>${escapeHtml(s.fieldOfficerName || s.savingsOfficerName || 'Unassigned officer')}</span>
            <span>${num(s.nominalAnnualInterestRate || 0)}% p.a.</span>
          </div>
        </div>
        <div class="cv-card sv-kpi">
          <div class="sv-kpi-head">
            <span class="sv-kpi-label"><i class="fa-solid fa-wallet"></i> Account Balance</span>
            <span class="sv-kpi-icon"><i class="fa-solid fa-dollar-sign"></i></span>
          </div>
          <div class="sv-kpi-value">${escapeHtml(fmtCompact(sm.accountBalance))}</div>
          <div class="sv-kpi-sub">Available: ${escapeHtml(fmtCompact(sm.availableBalance))}</div>
        </div>
        <div class="cv-card sv-kpi ${thirdWarn ? 'is-warn' : ''}">
          <div class="sv-kpi-head">
            <span class="sv-kpi-label"><i class="fa-solid ${thirdWarn ? 'fa-lock' : 'fa-percent'}"></i> ${thirdWarn ? 'On Hold' : 'Interest Earned'}</span>
            <span class="sv-kpi-icon"><i class="fa-solid ${thirdWarn ? 'fa-lock' : 'fa-percent'}"></i></span>
          </div>
          <div class="sv-kpi-value">${escapeHtml(fmtCompact(thirdWarn ? onHold : sm.totalInterestEarned))}</div>
          <div class="sv-kpi-sub">${thirdWarn ? `Interest earned: ${escapeHtml(fmtCompact(sm.totalInterestEarned))}` : `Posted: ${escapeHtml(fmtCompact(sm.totalInterestPosted))}`}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="cv-tabs" id="sv-tabs">
        <button class="cv-tab" data-svtab="overview">Overview</button>
        <button class="cv-tab" data-svtab="transactions">Transactions</button>
        <button class="cv-tab" data-svtab="charges">Charges</button>
        ${can('READ_ACCOUNTTRANSFER') ? `<button class="cv-tab" data-svtab="si">Standing Instructions</button>` : ''}
        <button class="cv-tab" data-svtab="documents">Documents</button>
      </div>

      <!-- Overview -->
      <div class="tab-panel" data-svpanel="overview">
        <div class="cv-grid-3">
          <div class="cv-card cv-panel">
            <h3>Account Details</h3>
            <div class="cv-info-row"><span class="cv-i-label">Account No</span><span class="cv-i-val">${escapeHtml(s.accountNo || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Product</span><span class="cv-i-val">${escapeHtml(s.savingsProductName || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Status</span><span class="cv-i-val">${sb(status || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Sub-status</span><span class="cv-i-val">${escapeHtml(sub || 'None')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Currency</span><span class="cv-i-val">${escapeHtml(s.currency?.code || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Nominal Rate</span><span class="cv-i-val">${num(s.nominalAnnualInterestRate || 0)}% p.a.</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Compounding</span><span class="cv-i-val">${escapeHtml(s.interestCompoundingPeriodType?.value || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Posting</span><span class="cv-i-val">${escapeHtml(s.interestPostingPeriodType?.value || '—')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Officer</span><span class="cv-i-val">${escapeHtml(s.fieldOfficerName || s.savingsOfficerName || 'Unassigned')}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">External ID</span><span class="cv-i-val">${escapeHtml(s.externalId || '—')}</span></div>
          </div>

          <div class="cv-card cv-panel">
            <h3>Balances</h3>
            <div class="cv-info-row"><span class="cv-i-label">Account Balance</span><span class="cv-i-val">${fmt(sm.accountBalance ?? 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Available</span><span class="cv-i-val">${fmt(sm.availableBalance ?? 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">On Hold</span><span class="cv-i-val">${fmt(onHold)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Total Deposits</span><span class="cv-i-val">${fmt(sm.totalDeposits ?? 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Total Withdrawals</span><span class="cv-i-val">${fmt(sm.totalWithdrawals ?? 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Interest Earned</span><span class="cv-i-val">${fmt(sm.totalInterestEarned ?? 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Interest Posted</span><span class="cv-i-val">${fmt(sm.totalInterestPosted ?? 0)}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Total Fees</span><span class="cv-i-val">${fmt(sm.totalFeeCharge ?? 0)}</span></div>
          </div>

          <div class="cv-card cv-panel">
            <h3>Timeline</h3>
            <div class="cv-info-row"><span class="cv-i-label">Submitted</span><span class="cv-i-val">${fmtDate(s.timeline?.submittedOnDate) || '—'}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Approved</span><span class="cv-i-val">${fmtDate(s.timeline?.approvedOnDate) || '—'}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Activated</span><span class="cv-i-val">${fmtDate(s.timeline?.activatedOnDate) || '—'}</span></div>
            <div class="cv-info-row"><span class="cv-i-label">Closed</span><span class="cv-i-val">${fmtDate(s.timeline?.closedOnDate) || '—'}</span></div>
          </div>
        </div>
      </div>

      <!-- Transactions (+ On-hold funds) -->
      <div class="tab-panel" data-svpanel="transactions" hidden>
        <div class="sv-toolbar">
          <h3>Transactions</h3>
          <button class="cv-btn-ghost btn-sm" id="sv-export-statement"><i class="fa-solid fa-download"></i> Statement</button>
        </div>
        <div id="sv-tx-wrap"><div class="empty-state-row">Loading…</div></div>
        <div class="sv-block mt-3">
          <h3>On-hold Funds</h3>
          <div id="sv-onhold-wrap"><div class="empty-state-row">Loading…</div></div>
        </div>
      </div>

      <!-- Charges -->
      <div class="tab-panel" data-svpanel="charges" hidden>
        <div id="sv-charges-wrap"><div class="empty-state-row">Loading…</div></div>
      </div>

      <!-- Standing Instructions -->
      ${can('READ_ACCOUNTTRANSFER') ? `
      <div class="tab-panel" data-svpanel="si" hidden>
        <div id="sv-si-wrap"><div class="empty-state-row">Loading…</div></div>
      </div>` : ''}

      <!-- Documents (+ Notes) -->
      <div class="tab-panel" data-svpanel="documents" hidden>
        <div class="sv-block"><div id="sv-docs-wrap"><div class="empty-state-row">Loading…</div></div></div>
        <div class="sv-block"><div id="sv-notes-wrap"><div class="empty-state-row">Loading…</div></div></div>
      </div>
    </div>`;

    enhanceScrollableTabs(c.querySelector('#sv-tabs'));
    const tabs = c.querySelectorAll('[data-svtab]');
    const panels = c.querySelectorAll('[data-svpanel]');
    const lazyLoaded = {};
    const lazyLoaders = {
      transactions: () => {
        loadSavingsTransactions(c, id);
        (typeof loadOnHoldFunds === 'function') && loadOnHoldFunds(c, id);
      },
      charges:   () => loadSavingsCharges(c, id, s),
      si:        () => (typeof loadSavingsSI === 'function') && loadSavingsSI(c, id, s),
      documents: () => {
        loadSavingsDocuments(c, id);
        (typeof loadSavingsNotes === 'function') && loadSavingsNotes(c, id);
      }
    };
    function switchTab(name) {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.svtab === name));
      panels.forEach(p => {
        const on = p.dataset.svpanel === name;
        p.hidden = !on;
        p.classList.toggle('active', on);   // match components.css .tab-panel.active display contract
      });
      if (lazyLoaders[name] && !lazyLoaded[name]) { lazyLoaded[name] = true; lazyLoaders[name](); }
      const params = new URLSearchParams();
      params.set('id', id);
      params.set('tab', name);
      location.hash = `savings?${params.toString()}`;
    }
    tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.svtab)));
    const validTab = ['overview', 'transactions', 'charges', 'si', 'documents'];
    switchTab(validTab.includes(initialTab) ? initialTab : 'overview');

    c.querySelector('#back-to-savings').addEventListener('click', () => {
      import('../../../router.js').then(r => r.navigate('savings'));
    });

    // Kebab menu toggle
    c.querySelector('#sv-kebab-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      c.querySelector('#sv-kebab').classList.toggle('open');
    });

    // In-tab statement button mirrors the menu one
    c.querySelector('#sv-export-statement')?.addEventListener('click', () => exportStatement(s, id));

    // ── Lifecycle handlers (ids resolve whether in header or ⋯ menu) ────────
    c.querySelector('#btn-sv-edit')?.addEventListener('click', () =>
      (typeof openEditSavingsModal === 'function') && openEditSavingsModal(s));
    c.querySelector('#btn-sv-approve')?.addEventListener('click', () =>
      (typeof openApproveSavingsModal === 'function') && openApproveSavingsModal(id));
    c.querySelector('#btn-sv-undo-approval')?.addEventListener('click', async () => {
      if (!await confirm({ title: 'Undo approval?', confirmText: 'Undo Approval' })) return;
      try { await api.savings.undoApproval(id); toast('success', 'Approval undone', ''); document.dispatchEvent(new CustomEvent('fc:reload')); }
      catch (e) { toast('error', 'Failed', extractFineractError(e)); }
    });
    c.querySelector('#btn-sv-reject')?.addEventListener('click', () =>
      openSavingsSimpleCmd({ id, command: 'reject', label: 'Reject Application', dateField: 'rejectedOnDate' }));
    c.querySelector('#btn-sv-withdraw-app')?.addEventListener('click', () =>
      openSavingsSimpleCmd({ id, command: 'withdrawnByApplicant', label: 'Withdraw Application', dateField: 'withdrawnOnDate' }));
    c.querySelector('#btn-sv-activate')?.addEventListener('click', async () => {
      if (!await confirm({ title: 'Activate account?', confirmText: 'Activate' })) return;
      try {
        await api.savings.activate(id, { activatedOnDate: today(), dateFormat: DATE_FORMAT, locale: LOCALE });
        toast('success', 'Account activated', `#${id}`);
        document.dispatchEvent(new CustomEvent('fc:reload'));
      } catch (e) { toast('error', 'Activation failed', extractFineractError(e)); }
    });

    c.querySelector('#btn-sv-deposit')?.addEventListener('click', () => {
      const modal = openModal('savingsDepositModal');
      if (modal) modal.dataset.accountId = id;
    });
    c.querySelector('#btn-sv-withdraw')?.addEventListener('click', () =>
      openSavingsTransactionModal({ id, type: 'withdrawal', label: 'Withdraw' }));
    c.querySelector('#btn-sv-hold')?.addEventListener('click', () => openHoldModal(id));

    const blockBtns = [
      ['#btn-sv-block',         'block',         'Account blocked'],
      ['#btn-sv-unblock',       'unblock',       'Account unblocked'],
      ['#btn-sv-block-dep',     'blockCredit',   'Deposits blocked'],
      ['#btn-sv-unblock-dep',   'unblockCredit', 'Deposits unblocked'],
      ['#btn-sv-block-wd',      'blockDebit',    'Withdrawals blocked'],
      ['#btn-sv-unblock-wd',    'unblockDebit',  'Withdrawals unblocked']
    ];
    blockBtns.forEach(([sel, method, successMsg]) => {
      c.querySelector(sel)?.addEventListener('click', async () => {
        if (!await confirm({ title: 'Confirm action?', confirmText: 'Confirm' })) return;
        try { await api.savings[method](id); toast('success', successMsg, ''); document.dispatchEvent(new CustomEvent('fc:reload')); }
        catch (e) { toast('error', 'Failed', extractFineractError(e)); }
      });
    });

    c.querySelector('#btn-sv-calc-int')?.addEventListener('click', async () => {
      try { await api.savings.calculateInterest(id); toast('success', 'Interest calculated', ''); document.dispatchEvent(new CustomEvent('fc:reload')); }
      catch (e) { toast('error', 'Failed', extractFineractError(e)); }
    });
    c.querySelector('#btn-sv-post-int')?.addEventListener('click', async () => {
      if (!await confirm({ title: 'Post interest today?', confirmText: 'Post' })) return;
      try { await api.savings.postInterest(id); toast('success', 'Interest posted', ''); document.dispatchEvent(new CustomEvent('fc:reload')); }
      catch (e) { toast('error', 'Failed', extractFineractError(e)); }
    });
    c.querySelector('#btn-sv-post-int-asof')?.addEventListener('click', () =>
      (typeof openPostInterestAsOnModal === 'function') && openPostInterestAsOnModal(id));
    c.querySelector('#btn-sv-annual-fee')?.addEventListener('click', () =>
      (typeof openAnnualFeesModal === 'function') && openAnnualFeesModal(id));
    c.querySelector('#btn-sv-assign-staff')?.addEventListener('click', () =>
      (typeof openSavingsAssignStaffModal === 'function') && openSavingsAssignStaffModal(id, s));

    c.querySelector('#btn-sv-close')?.addEventListener('click', () => openSavingsCloseModal(id));
    c.querySelector('#btn-sv-delete')?.addEventListener('click', async () => {
      if (!await confirm({
        title: `Permanently delete account #${s.accountNo || id}?`,
        message: 'This cannot be undone.',
        danger: true, confirmText: 'Delete'
      })) return;
      try {
        await api.savings.delete(id);
        toast('success', 'Account deleted', `#${id}`);
        import('../../../router.js').then(r => r.navigate('savings'));
      } catch (e) { toast('error', 'Delete failed', extractFineractError(e)); }
    });
    c.querySelector('#btn-sv-export')?.addEventListener('click', () => exportStatement(s, id));

  } catch (e) {
    c.innerHTML = `<div class="card"><div class="empty-state">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <div><b>Failed to load account</b></div>
      <div class="text-muted mt-2">${escapeHtml(extractFineractError(e))}</div>
    </div></div>`;
  }
}
