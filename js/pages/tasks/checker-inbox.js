import { api } from '../../api.js';
import { store } from '../../store.js';
import { DATE_FORMAT, LOCALE, today } from '../../config.js';
import { toast } from '../../ui.js';
import { escapeHtml, fmt, fmtDate, num } from '../../utils.js';
import { can } from './shared.js';
import { extractFineractError } from '../../ui/dom-helpers.js';
import { approveExpense, rejectExpense } from '../../treasury/expenses.js';

/* ────────────────────────────────────────────────────────────────────────────
   Approval Inbox — ONE unified card list holding EVERYTHING pending approval
   across FinCraft, native Fineract + the custom Treasury module.

   Nine sources, each fetched independently (never blocks the others):

     ┌ Native Fineract ─────────────────────────────────────────────────────┐
     │ checker           /makercheckers                approve/reject/return │
     │ loan              /loans?status=pending          approve/reject       │
     │ disbursement      /loans?status=approved         → Treasury disburse  │
     │ client            /clients?status=pending        activate             │
     │ savings           /savingsaccounts (pending)      approve/reject       │
     │ fixedDeposit      /fixeddepositaccounts (pending) approve/reject       │
     │ recurringDeposit  /recurringdepositaccounts       approve/reject       │
     ├ Treasury module (per-office datatables) ─────────────────────────────┤
     │ treasury-expense  dt_expense_requests   PENDING   approve/reject       │
     │ treasury-borrowing dt_office_borrowings PENDING   → Treasury drawdown  │
     └───────────────────────────────────────────────────────────────────────┘

   Design notes:
   • Each source is gated on the caller's approve/read permission, so we never
     fire a request the user can't act on (avoids 403 noise) and never show a
     card they can't decide.
   • Core-Fineract failures surface in an amber "could not load …" banner;
     Treasury is best-effort/silent (its datatables may not be bootstrapped yet).
   • Fineract feeds are sparse, so friendly type, reference code, amount, stage,
     priority and the approval-history timeline are DERIVED; missing → "—".
   • Historical bug retained-as-fixed: the old Loan tab sent
     status=approvalPending (invalid enum → HTTP 500). Correct value is pending.
   • Savings/deposits are filtered to pending CLIENT-SIDE (by status.value) to
     avoid any invalid-enum 500 on those endpoints.
   • Treasury tables hang off m_office, so we enumerate offices and query each.
   ──────────────────────────────────────────────────────────────────────────── */

const currentUser = () => (store.get('auth') || {}).username || 'unknown';

const ENTITY_MAP = {
  LOAN:                       { label: 'Loan',            icon: 'fa-hand-holding-dollar', bucket: 'loan',    code: 'LN' },
  LOANPRODUCT:                { label: 'Loan Product',    icon: 'fa-box',                 bucket: 'other',   code: 'LP' },
  LOAN_RESCHEDULE:            { label: 'Reschedule',      icon: 'fa-calendar-day',        bucket: 'loan',    code: 'RS' },
  GROUPLOAN:                  { label: 'Group Loan',      icon: 'fa-people-group',        bucket: 'loan',    code: 'LN' },
  SAVINGSACCOUNT:             { label: 'Savings',         icon: 'fa-piggy-bank',          bucket: 'other',   code: 'SV' },
  SAVINGSACCOUNT_TRANSACTION: { label: 'Transaction',     icon: 'fa-right-left',          bucket: 'txn',     code: 'TXN' },
  DEPOSITACCOUNT:             { label: 'Fixed Deposit',   icon: 'fa-vault',               bucket: 'other',   code: 'DP' },
  FIXEDDEPOSITACCOUNT:        { label: 'Fixed Deposit',   icon: 'fa-vault',               bucket: 'other',   code: 'DP' },
  RECURRINGDEPOSITACCOUNT:    { label: 'Recurring Deposit', icon: 'fa-vault',             bucket: 'other',   code: 'RD' },
  CLIENT:                     { label: 'Account Opening', icon: 'fa-user-plus',           bucket: 'other',   code: 'ACC' },
  GROUP:                      { label: 'Group',           icon: 'fa-people-group',        bucket: 'other',   code: 'GRP' },
  CENTER:                     { label: 'Center',          icon: 'fa-building',            bucket: 'other',   code: 'CEN' },
  JOURNALENTRY:               { label: 'Journal Entry',   icon: 'fa-book',                bucket: 'expense', code: 'JE' },
  GLACCOUNT:                  { label: 'GL Account',      icon: 'fa-book',                bucket: 'other',   code: 'GL' },
  DISBURSEMENT:               { label: 'Disbursement',    icon: 'fa-money-bill-transfer', bucket: 'loan',    code: 'DSB' }
};

const ACTION_STAGE = {
  CREATE:   'Initial Review',   UPDATE:  'Change Review',    DELETE:  'Deletion Review',
  APPROVE:  'Approval Review',  REJECT:  'Rejection Review', DISBURSE:'Disbursement Review',
  WITHDRAW: 'Withdrawal Review', WITHDRAWAL:'Withdrawal Review', DEPOSIT:'Deposit Review',
  ACTIVATE: 'Activation Review', CLOSE:  'Closure Review',   WRITEOFF:'Write-off Review'
};

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
const SAVINGS_PENDING = 'Submitted and pending approval';

const unwrap = (v) => Array.isArray(v) ? v : (v?.pageItems || []);

function entityInfo(entity) {
  const key = String(entity || '').toUpperCase().replace(/[\s-]/g, '');
  return ENTITY_MAP[key] || { label: entity || 'Task', icon: 'fa-file-lines', bucket: 'other', code: 'TSK' };
}

function parseCommand(t) {
  if (t && t.commandAsJson) { try { return JSON.parse(t.commandAsJson); } catch { /* ignore */ } }
  return {};
}

function pickAmount(cmd) {
  const keys = ['principal', 'approvedLoanAmount', 'transactionAmount', 'amount',
    'depositAmount', 'chargeAmount', 'repaymentAmount', 'overpaymentAmount'];
  for (const k of keys) {
    const v = cmd[k];
    if (v != null && !isNaN(Number(v)) && Number(v) !== 0) return Number(v);
  }
  return null;
}

function pickTitle(info, cmd, t) {
  const name = cmd.clientName || cmd.groupName || cmd.name ||
    ([cmd.firstname, cmd.lastname].filter(Boolean).join(' ')) || cmd.accountNo || '';
  return name ? `${info.label} — ${name}` : `${info.label} #${t.resourceId || t.id || '—'}`;
}

/* Deterministic priority heuristic (Fineract has no native priority field). */
function derivePriority(amount, bucket) {
  const amt = amount || 0;
  if (bucket === 'txn') return amt >= 250000 ? 'urgent' : 'high';
  if (amt >= 3000000) return 'high';
  if (amt >= 250000)  return 'medium';
  return 'low';
}

function timeAgo(dateVal) {
  let d = dateVal;
  if (Array.isArray(d)) d = new Date(d[0], d[1] - 1, d[2]);
  else if (typeof d === 'string') d = new Date(d);
  if (!(d instanceof Date) || isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtCompact(amount) {
  if (amount == null) return '';
  const currency = store.get('defaultCurrency') || 'NGN';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency, notation: 'compact', maximumFractionDigits: 2
    }).format(amount);
  } catch { return num(amount); }
}

/* ── Per-source → uniform card descriptor ─────────────────────────────────── */

function describeCheckerTask(t) {
  const info = entityInfo(t.entityName || t.entity);
  const cmd = parseCommand(t);
  const amount = pickAmount(cmd);
  const action = (t.actionName || t.action || '').toUpperCase();
  const stage = ACTION_STAGE[action] || `${info.label} Review`;
  const madeOn = typeof t.madeOnDate === 'object'
    ? (Array.isArray(t.madeOnDate) ? t.madeOnDate : null) : (t.madeOnDate || null);
  return {
    id: t.id, source: 'checker', raw: t,
    type: info.label, icon: info.icon, bucket: info.bucket,
    code: `${info.code}-${String(t.resourceId || t.id || 0).padStart(6, '0')}`,
    title: pickTitle(info, cmd, t), stage, amount,
    priority: derivePriority(amount, info.bucket),
    requester: t.maker || cmd.maker || '—',
    office: t.officeName || cmd.officeName || cmd.locationName || '—',
    actionVerb: String(t.actionName || t.action || 'change').toLowerCase(),
    madeOn, ageLabel: timeAgo(madeOn)
  };
}

function describeLoan(l) {
  const amount = l.principal || l.approvedPrincipal || l.proposedPrincipal || null;
  const name = l.clientName || l.clientDisplayName || l.groupName || '';
  const madeOn = l.timeline?.submittedOnDate || null;
  return {
    id: l.id, source: 'loan', raw: l,
    type: 'Loan', icon: 'fa-hand-holding-dollar', bucket: 'loan',
    code: l.accountNo ? `LN-${l.accountNo}` : `LN-${String(l.id).padStart(6, '0')}`,
    title: name ? `Loan — ${name}` : `Loan #${l.id}`,
    stage: 'Loan Approval',
    amount: Number(amount) || null,
    priority: derivePriority(Number(amount) || 0, 'loan'),
    requester: l.loanOfficerName || '—', office: l.officeName || '—',
    actionVerb: 'loan application', madeOn, ageLabel: timeAgo(madeOn)
  };
}

function describeDisbursement(l) {
  const amount = l.approvedPrincipal || l.principal || null;
  const name = l.clientName || l.clientDisplayName || l.groupName || '';
  const madeOn = l.timeline?.approvedOnDate || l.timeline?.expectedDisbursementDate || null;
  return {
    id: l.id, source: 'disbursement', raw: l,
    type: 'Disbursement', icon: 'fa-money-bill-transfer', bucket: 'loan',
    code: l.accountNo ? `DSB-${l.accountNo}` : `DSB-${String(l.id).padStart(6, '0')}`,
    title: name ? `Disbursement — ${name}` : `Disbursement #${l.id}`,
    stage: 'Awaiting Disbursement',
    amount: Number(amount) || null,
    priority: derivePriority(Number(amount) || 0, 'loan'),
    requester: l.loanOfficerName || '—', office: l.officeName || '—',
    actionVerb: 'loan approved for disbursement', madeOn, ageLabel: timeAgo(madeOn)
  };
}

function describeClient(cl) {
  const madeOn = cl.timeline?.submittedOnDate || cl.submittedOnDate || null;
  return {
    id: cl.id, source: 'client', raw: cl,
    type: 'Account Opening', icon: 'fa-user-plus', bucket: 'other',
    code: cl.accountNo ? `ACC-${cl.accountNo}` : `ACC-${String(cl.id).padStart(6, '0')}`,
    title: `Account Opening — ${cl.displayName || cl.fullname || `#${cl.id}`}`,
    stage: 'Operations Review', amount: null, priority: 'low',
    requester: cl.staffName || cl.officeName || '—', office: cl.officeName || '—',
    actionVerb: 'account opening', madeOn, ageLabel: timeAgo(madeOn)
  };
}

const DEPOSIT_META = {
  savings:          { source: 'savings',          type: 'Savings',           icon: 'fa-piggy-bank', code: 'SV' },
  fixedDeposit:     { source: 'fixedDeposit',      type: 'Fixed Deposit',     icon: 'fa-vault',      code: 'DP' },
  recurringDeposit: { source: 'recurringDeposit',  type: 'Recurring Deposit', icon: 'fa-vault',      code: 'RD' }
};

function describeDeposit(s, kind) {
  const m = DEPOSIT_META[kind];
  const amount = s.depositAmount || s.summary?.accountBalance || s.minRequiredOpeningBalance || null;
  const name = s.clientName || s.groupName || '';
  const madeOn = s.timeline?.submittedOnDate || null;
  return {
    id: s.id, source: m.source, raw: s,
    type: m.type, icon: m.icon, bucket: 'other',
    code: s.accountNo ? `${m.code}-${s.accountNo}` : `${m.code}-${String(s.id).padStart(6, '0')}`,
    title: name ? `${m.type} — ${name}` : `${m.type} #${s.id}`,
    stage: `${m.type} Approval`,
    amount: Number(amount) || null,
    priority: derivePriority(Number(amount) || 0, 'other'),
    requester: s.fieldOfficerName || s.savingsOfficerName || '—', office: s.officeName || '—',
    actionVerb: 'account opening', madeOn, ageLabel: timeAgo(madeOn)
  };
}

function describeTreasuryExpense(row, officeId, officeName) {
  const amount = Number(row.amount) || null;
  return {
    id: row.id, rowId: row.id, officeId, source: 'treasury-expense', raw: row,
    type: 'Expense', icon: 'fa-receipt', bucket: 'expense',
    code: `EXP-${officeId}-${String(row.id).padStart(4, '0')}`,
    title: `Expense — ${row.expense_category || 'Uncategorised'}`,
    stage: 'Accountant Review', amount,
    priority: derivePriority(amount || 0, 'expense'),
    requester: row.requested_by || '—', office: officeName,
    actionVerb: 'expense request', madeOn: row.paid_date || null, ageLabel: ''
  };
}

function describeTreasuryBorrowing(row, officeId, officeName) {
  const amount = Number(row.principal_amount) || null;
  return {
    id: row.id, rowId: row.id, officeId, source: 'treasury-borrowing', raw: row,
    type: 'Borrowing', icon: 'fa-building-columns', bucket: 'treasury',
    code: `BRW-${officeId}-${String(row.id).padStart(4, '0')}`,
    title: `Borrowing — ${row.lender_name || 'Lender'}`,
    stage: 'Awaiting Drawdown', amount,
    priority: derivePriority(amount || 0, 'treasury'),
    requester: '—', office: officeName,
    actionVerb: 'borrowing facility', madeOn: row.start_date || null, ageLabel: timeAgo(row.start_date)
  };
}

/* ── Treasury aggregation across offices (best-effort / silent) ───────────── */
async function fetchTreasury(enabled) {
  if (!enabled) return [];
  let offices;
  try { offices = unwrap(await api.offices.list()); }
  catch { return []; }
  const out = [];
  await Promise.all(offices.map(async (o) => {
    const oid = o.id;
    const oname = o.name || o.nameDecorated || `Office ${oid}`;
    const [exp, brw] = await Promise.allSettled([
      api.treasury.queryRows('dt_expense_requests', oid),
      api.treasury.queryRows('dt_office_borrowings', oid)
    ]);
    if (exp.status === 'fulfilled') {
      (Array.isArray(exp.value) ? exp.value : []).filter(r => r.status === 'PENDING')
        .forEach(r => out.push(describeTreasuryExpense(r, oid, oname)));
    }
    if (brw.status === 'fulfilled') {
      (Array.isArray(brw.value) ? brw.value : []).filter(r => r.status === 'PENDING')
        .forEach(r => out.push(describeTreasuryBorrowing(r, oid, oname)));
    }
  }));
  return out;
}

/* ── Loader ───────────────────────────────────────────────────────────────── */
export async function loadApprovalInbox(c) {
  const el = c.querySelector('#tk-inbox');
  if (!el) return;
  el.innerHTML = `<div class="empty-state-row">Loading approval inbox…</div>`;

  const perms = {
    checker:          can('CHECKER_SUPER_USER'),
    loanApprove:      can('APPROVE_LOAN'),
    loanReject:       can('REJECT_LOAN'),
    disburse:         can('DISBURSE_LOAN'),
    clientActivate:   can('ACTIVATE_CLIENT'),
    savingsApprove:   can('APPROVE_SAVINGSACCOUNT'),
    savingsReject:    can('REJECT_SAVINGSACCOUNT'),
    fixedApprove:     can('APPROVE_FIXEDDEPOSITACCOUNT'),
    fixedReject:      can('REJECT_FIXEDDEPOSITACCOUNT'),
    recurringApprove: can('APPROVE_RECURRINGDEPOSITACCOUNT'),
    recurringReject:  can('REJECT_RECURRINGDEPOSITACCOUNT'),
    treasury:         can('CREATE_JOURNALENTRY')
  };

  // Build the fetch plan; each entry maps its raw payload → descriptor list.
  // NOTE: the request factory is a thunk (() => api....list()) and is invoked ONLY when
  // `enabled` is true. Creating the promise eagerly for disabled entries orphaned it (it
  // never reached Promise.allSettled below), so a rejected fetch on a permission the user
  // lacks became an unhandled rejection and crashed the process. Keep this lazy.
  const plan = [];
  const add = (enabled, label, makePromise, map) => {
    if (enabled) plan.push({ label, promise: makePromise(), map });
  };

  add(perms.checker, 'checker tasks',
    () => api.makerchecker.list({ limit: 200 }), rows => rows.map(describeCheckerTask));
  add(perms.loanApprove || perms.loanReject, 'loan approvals',
    () => api.loans.list({ status: 'pending', limit: 200 }), rows => rows.map(describeLoan)); // FIX: was 'approvalPending' → 500
  add(perms.disburse, 'loan disbursements',
    () => api.loans.list({ status: 'approved', limit: 200 }), rows => rows.map(describeDisbursement));
  add(perms.clientActivate, 'client approvals',
    () => api.clients.list({ status: 'pending', limit: 200 }), rows => rows.map(describeClient));
  add(perms.savingsApprove || perms.savingsReject, 'savings approvals',
    () => api.savings.list({ limit: 200 }),
    rows => rows.filter(s => s.status?.value === SAVINGS_PENDING).map(s => describeDeposit(s, 'savings')));
  add(perms.fixedApprove || perms.fixedReject, 'fixed deposit approvals',
    () => api.fixedDeposits.list({ limit: 200 }),
    rows => rows.filter(s => s.status?.value === SAVINGS_PENDING).map(s => describeDeposit(s, 'fixedDeposit')));
  add(perms.recurringApprove || perms.recurringReject, 'recurring deposit approvals',
    () => api.recurringDeposits.list({ limit: 200 }),
    rows => rows.filter(s => s.status?.value === SAVINGS_PENDING).map(s => describeDeposit(s, 'recurringDeposit')));

  const [coreSettled, treasuryItems] = await Promise.all([
    Promise.allSettled(plan.map(p => p.promise)),
    fetchTreasury(perms.treasury)   // silent best-effort
  ]);

  const items = [];
  const warnings = [];
  coreSettled.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      try { items.push(...plan[i].map(unwrap(res.value))); }
      catch { warnings.push(plan[i].label); }
    } else {
      warnings.push(plan[i].label);
    }
  });
  items.push(...treasuryItems);

  items.sort((a, b) =>
    (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) ||
    String(a.type).localeCompare(String(b.type)));

  const urgentCount  = items.filter(i => i.priority === 'urgent').length;
  const loanCount    = items.filter(i => i.bucket === 'loan').length;
  const expenseCount = items.filter(i => i.bucket === 'expense').length;
  const types = [...new Set(items.map(i => i.type))].sort();

  el.innerHTML = `
    <div class="ck-subhead">${num(items.length)} pending approval${items.length !== 1 ? 's' : ''} • ${num(items.length)} total</div>

    ${warnings.length ? `<div class="msg-banner b-warning mb-3"><i class="fa-solid fa-triangle-exclamation"></i> Could not load: ${escapeHtml(warnings.join(', '))}. Showing everything else.</div>` : ''}

    <div class="ck-kpi-grid">
      <div class="ck-kpi">
        <div class="ck-kpi-head"><i class="fa-regular fa-clock"></i><span class="ck-kpi-label">Pending</span></div>
        <div class="ck-kpi-value">${num(items.length)}</div>
      </div>
      <div class="ck-kpi ${urgentCount ? 'is-urgent' : ''}">
        <div class="ck-kpi-head"><i class="fa-solid fa-triangle-exclamation"></i><span class="ck-kpi-label">Urgent</span></div>
        <div class="ck-kpi-value">${num(urgentCount)}</div>
      </div>
      <div class="ck-kpi">
        <div class="ck-kpi-head"><i class="fa-solid fa-hand-holding-dollar"></i><span class="ck-kpi-label">Loans</span></div>
        <div class="ck-kpi-value">${num(loanCount)}</div>
      </div>
      <div class="ck-kpi">
        <div class="ck-kpi-head"><i class="fa-solid fa-book"></i><span class="ck-kpi-label">Expenses</span></div>
        <div class="ck-kpi-value">${num(expenseCount)}</div>
      </div>
    </div>

    <div class="filter-bar ck-filter">
      <span class="ck-filter-label">Type</span>
      <select id="ck-type-filter" class="form-control">
        <option value="">All Types</option>
        ${types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}
      </select>
      <input id="ck-search" class="form-control ck-search" placeholder="Search title, reference, requester…" autocomplete="off"/>
    </div>

    <div class="ck-list" id="ck-list"></div>`;

  function draw(rows) {
    const list = el.querySelector('#ck-list');
    if (!rows.length) {
      list.innerHTML = `<div class="empty-state-row">No pending approvals 🎉</div>`;
      return;
    }
    list.innerHTML = rows.map(d => `
      <div class="ck-item ck-pri-${d.priority}" data-key="${d.source}:${d.id}" role="button" tabindex="0">
        <div class="ck-item-icon"><i class="fa-solid ${d.icon}"></i></div>
        <div class="ck-item-main">
          <div class="ck-item-title">
            <span class="ck-name">${escapeHtml(d.title)}</span>
            <span class="ck-pri-badge ${d.priority}">${d.priority}</span>
          </div>
          <div class="ck-item-meta">
            ${escapeHtml(d.code)}<span class="dot">•</span>${escapeHtml(d.type)}<span class="dot">•</span>${escapeHtml(d.stage)}${d.ageLabel ? `<span class="dot">•</span>${escapeHtml(d.ageLabel)}` : ''}
          </div>
        </div>
        <div class="ck-item-right">
          ${d.amount != null ? `<span class="ck-amount">${escapeHtml(fmtCompact(d.amount))}</span>` : ''}
          <span class="badge b-pending">Pending</span>
          <span class="ck-requester">${escapeHtml(d.requester)}</span>
        </div>
      </div>`).join('');

    list.querySelectorAll('.ck-item').forEach(row => {
      const open = () => {
        const d = rows.find(r => `${r.source}:${r.id}` === row.dataset.key);
        if (d) openTaskDetailModal(d, perms, () => {
          row.remove();
          const idx = items.findIndex(r => `${r.source}:${r.id}` === row.dataset.key);
          if (idx > -1) items.splice(idx, 1);
          refreshCounts(el, items);
          if (!el.querySelector('.ck-item')) draw([]);
        });
      };
      row.addEventListener('click', open);
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  function applyFilters() {
    const q = el.querySelector('#ck-search').value.toLowerCase().trim();
    const typeFilter = el.querySelector('#ck-type-filter').value;
    let filtered = items;
    if (typeFilter) filtered = filtered.filter(i => i.type === typeFilter);
    if (q) filtered = filtered.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      String(i.requester).toLowerCase().includes(q));
    draw(filtered);
  }

  let debTimer;
  el.querySelector('#ck-search').addEventListener('input', () => {
    clearTimeout(debTimer); debTimer = setTimeout(applyFilters, 250);
  });
  el.querySelector('#ck-type-filter').addEventListener('change', applyFilters);

  draw(items);
}

/* Backward-compatible alias (older imports referenced loadCheckerInbox). */
export { loadApprovalInbox as loadCheckerInbox };

function refreshCounts(el, items) {
  const total = items.length;
  const urgent = items.filter(i => i.priority === 'urgent').length;
  const loans = items.filter(i => i.bucket === 'loan').length;
  const expenses = items.filter(i => i.bucket === 'expense').length;
  const values = el.querySelectorAll('.ck-kpi-value');
  if (values[0]) values[0].textContent = num(total);
  if (values[1]) values[1].textContent = num(urgent);
  if (values[2]) values[2].textContent = num(loans);
  if (values[3]) values[3].textContent = num(expenses);
  const sub = el.querySelector('.ck-subhead');
  if (sub) sub.textContent = `${num(total)} pending approval${total !== 1 ? 's' : ''} • ${num(total)} total`;
}

/* ── Decision templates ─────────────────────────────────────────────────────*/
const dateBody = (extra) => ({ dateFormat: DATE_FORMAT, locale: LOCALE, ...extra });
const approveTpl = (run, { label = 'Confirm Approval', past = 'Approved', hint = 'Provide a comment for this decision (optional).' } = {}) =>
  ({ title: 'Approve', hint, btn: 'btn-primary', label, icon: 'fa-check', required: false, tone: 'success', past, run });
const rejectTpl = (run, { past = 'Rejected' } = {}) =>
  ({ title: 'Reject', hint: 'Provide a comment for this decision (required for rejection).', btn: 'btn-danger', label: 'Confirm Rejection', icon: 'fa-xmark', required: true, tone: 'warn', past, run });
const returnTpl = (run) =>
  ({ title: 'Return for Correction', hint: 'Provide a comment for this decision (required for return).', btn: 'btn-amber', label: 'Confirm Return', icon: 'fa-rotate-left', required: true, tone: 'info', past: 'Returned to maker', run });
const routeTpl = ({ title, label, icon, route }) =>
  ({ title, label, icon, btn: 'btn-primary', route });

/* Only surfaces the actions this role + source can actually perform. */
function buildDecisions(d, perms) {
  const out = {};
  switch (d.source) {
    case 'checker':
      if (perms.checker) {
        out.approve = approveTpl(() => api.makerchecker.approve(d.id));
        out.reject  = rejectTpl(() => api.makerchecker.reject(d.id));
        out.return  = returnTpl(() => api.makerchecker.delete(d.id));
      }
      break;
    case 'loan':
      if (perms.loanApprove) out.approve = approveTpl((note) => api.loans.approve(d.id, dateBody({ approvedOnDate: today(), ...(note ? { note } : {}) })), { past: 'Loan approved' });
      if (perms.loanReject)  out.reject  = rejectTpl((note) => api.loans.reject(d.id, dateBody({ rejectedOnDate: today(), ...(note ? { note } : {}) })), { past: 'Loan rejected' });
      break;
    case 'disbursement':
      if (perms.disburse) out.approve = routeTpl({ title: 'Disburse', label: 'Open Disbursement', icon: 'fa-money-bill-transfer', route: 'loan-disbursement' });
      break;
    case 'client':
      if (perms.clientActivate) out.approve = approveTpl(() => api.clients.activate(d.id, today()), { label: 'Confirm Activation', past: 'Client activated', hint: 'Activate this client account (optional comment).' });
      // Client rejection needs a rejectionReasonId (code value) → handled on client detail.
      break;
    case 'savings':
      if (perms.savingsApprove) out.approve = approveTpl((note) => api.savings.approve(d.id, dateBody({ approvedOnDate: today(), ...(note ? { note } : {}) })), { past: 'Savings approved' });
      if (perms.savingsReject)  out.reject  = rejectTpl((note) => api.savings.reject(d.id, dateBody({ rejectedOnDate: today(), ...(note ? { note } : {}) })), { past: 'Savings rejected' });
      break;
    case 'fixedDeposit':
      if (perms.fixedApprove) out.approve = approveTpl((note) => api.fixedDeposits.approve(d.id, dateBody({ approvedOnDate: today(), ...(note ? { note } : {}) })), { past: 'Deposit approved' });
      if (perms.fixedReject)  out.reject  = rejectTpl((note) => api.fixedDeposits.reject(d.id, dateBody({ rejectedOnDate: today(), ...(note ? { note } : {}) })), { past: 'Deposit rejected' });
      break;
    case 'recurringDeposit':
      if (perms.recurringApprove) out.approve = approveTpl((note) => api.recurringDeposits.approve(d.id, dateBody({ approvedOnDate: today(), ...(note ? { note } : {}) })), { past: 'Deposit approved' });
      if (perms.recurringReject)  out.reject  = rejectTpl((note) => api.recurringDeposits.reject(d.id, dateBody({ rejectedOnDate: today(), ...(note ? { note } : {}) })), { past: 'Deposit rejected' });
      break;
    case 'treasury-expense':
      if (perms.treasury) {
        out.approve = approveTpl(() => approveExpense(d.officeId, d.rowId, currentUser()), { past: 'Expense approved', hint: 'Approve this expense request (optional comment).' });
        out.reject  = rejectTpl((reason) => rejectExpense(d.officeId, d.rowId, currentUser(), reason), { past: 'Expense rejected' });
      }
      break;
    case 'treasury-borrowing':
      if (perms.treasury) out.approve = routeTpl({ title: 'Draw Down', label: 'Open in Treasury', icon: 'fa-hand-holding-dollar', route: 'treasury-borrowings' });
      break;
  }
  return out;
}

/* ── Task-detail modal with inline decision flow ────────────────────────────── */
function openTaskDetailModal(d, perms, onResolved) {
  const decisions = buildDecisions(d, perms);
  const order = ['return', 'reject', 'approve'].filter(k => decisions[k]);

  const modalEl = document.createElement('div');
  modalEl.id = 'task-detail-' + Date.now();
  modalEl.className = 'modal-overlay open';
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');

  const requestedAt = d.madeOn ? fmtDate(d.madeOn) : '—';
  const amountFull = d.amount != null ? fmt(d.amount) : '—';

  modalEl.innerHTML = `
    <div class="modal modal-md">
      <div class="modal-header">
        <div>
          <div class="modal-title">${escapeHtml(d.title)}</div>
          <div class="modal-subtitle">${escapeHtml(d.code)} • ${escapeHtml(d.type)} • ${escapeHtml(d.office)}</div>
        </div>
        <button class="modal-close" data-close-modal aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="tk-field-grid">
          <div class="tk-field"><div class="tk-field-label">Requested By</div><div class="tk-field-value">${escapeHtml(d.requester)}</div></div>
          <div class="tk-field"><div class="tk-field-label">Requested At</div><div class="tk-field-value">${escapeHtml(requestedAt)}</div></div>
          <div class="tk-field"><div class="tk-field-label">Current Stage</div><div class="tk-field-value">${escapeHtml(d.stage)}</div></div>
          <div class="tk-field"><div class="tk-field-label">Amount</div><div class="tk-field-value">${escapeHtml(amountFull)}</div></div>
        </div>

        <div class="tk-section-label">Approval History</div>
        <ul class="tk-timeline">
          <li class="tk-timeline-item">
            <div class="tk-tl-title">${escapeHtml(d.requester)} — submitted</div>
            <div class="tk-tl-note">${escapeHtml(d.type)} ${escapeHtml(d.actionVerb)} requested for review.</div>
            <div class="tk-tl-date">${escapeHtml(requestedAt)}</div>
          </li>
          <li class="tk-timeline-item is-pending">
            <div class="tk-tl-title">Checker — awaiting decision</div>
            <div class="tk-tl-note">Pending at: ${escapeHtml(d.stage)}</div>
          </li>
        </ul>

        <div id="tk-decision-slot"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" data-close-modal><i class="fa-solid fa-arrow-left"></i> Close</button>
        ${order.map(k => `<button class="${decisions[k].btn}" data-decision="${k}"><i class="fa-solid ${decisions[k].icon}"></i> ${escapeHtml(decisions[k].title)}</button>`).join('')}
      </div>
    </div>`;

  document.getElementById('modalRoot').appendChild(modalEl);

  const close = () => modalEl.remove();
  modalEl.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', close));
  modalEl.addEventListener('click', e => { if (e.target === modalEl) close(); });

  const slot = modalEl.querySelector('#tk-decision-slot');

  modalEl.querySelectorAll('[data-decision]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cfg = decisions[btn.dataset.decision];
      if (!cfg) return;

      // Route-only decisions (disbursement, borrowing drawdown) jump to their module.
      if (cfg.route) {
        import('../../router.js').then(r => r.navigate(cfg.route));
        close();
        return;
      }

      slot.innerHTML = `
        <div class="tk-decision">
          <div class="tk-decision-title">${escapeHtml(cfg.title)}</div>
          <div class="tk-decision-hint">${escapeHtml(cfg.hint)}</div>
          <textarea id="tk-comment" placeholder="Enter your comment…"></textarea>
          <button class="${cfg.btn} tk-decision-confirm" id="tk-confirm"><i class="fa-solid ${cfg.icon}"></i> ${escapeHtml(cfg.label)}</button>
        </div>`;
      const commentEl = slot.querySelector('#tk-comment');
      commentEl.focus();
      slot.querySelector('#tk-confirm').addEventListener('click', async () => {
        const comment = commentEl.value.trim();
        if (cfg.required && !comment) {
          toast('warn', 'Comment required', `A comment is required to ${cfg.title.toLowerCase()}.`);
          commentEl.focus();
          return;
        }
        const confirmBtn = slot.querySelector('#tk-confirm');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Working…`;
        try {
          await cfg.run(comment);
          toast(cfg.tone, cfg.past, `${d.code}${comment ? ' — ' + comment : ''}`);
          close();
          onResolved?.();
        } catch (e) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = `<i class="fa-solid ${cfg.icon}"></i> ${escapeHtml(cfg.label)}`;
          toast('error', `${cfg.title} failed`, extractFineractError(e));
        }
      });
    });
  });
}
