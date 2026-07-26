import { DATE_FORMAT, LOCALE, today } from '../../config.js';
import { api } from '../../api.js';
import { escapeHtml, fmt, fmtDate, num } from '../../utils.js';
import { openModal, toast } from '../../ui.js';
import { store } from '../../store.js';
import { renderPagination, DEFAULT_PAGE_SIZE } from '../../ui/pagination.js';
import { can } from './shared.js';
import { extractFineractError } from '../../ui/dom-helpers.js';

/* Loan status → badge tone (covers the full Fineract lifecycle + the extra
   pipeline labels shown in the design). */
function loanBadge(statusValue) {
  const s = String(statusValue || '').toLowerCase();
  let cls = 'b-info', label = statusValue || '—';
  if (s.includes('pending')) { cls = 'b-pending'; label = 'Pending Approval'; }
  else if (s === 'approved') { cls = 'b-approved'; label = 'Approved'; }
  else if (s === 'active') { cls = 'b-active'; label = 'Active'; }
  else if (s.includes('overpaid')) { cls = 'b-approved'; label = 'Overpaid'; }
  else if (s.includes('closed')) { cls = 'b-closed'; label = 'Closed'; }
  else if (s.includes('rejected')) { cls = 'b-overdue'; label = 'Rejected'; }
  else if (s.includes('withdrawn')) { cls = 'b-closed'; label = 'Withdrawn'; }
  return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}

const compact = (amount) => {
  if (amount == null || isNaN(amount)) return '—';
  const currency = store.get('defaultCurrency') || 'NGN';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 2 }).format(amount); }
  catch { return num(amount); }
};

export async function renderList(c) {
  c.innerHTML = `
    <div class="page-header mb-3">
      <div>
        <h1>Loans</h1>
        <div class="text-muted"><span id="ln-hdr-count">—</span> loans · Portfolio: <span id="ln-hdr-portfolio">—</span></div>
      </div>
      <div class="page-actions">
        ${can('CREATE_LOAN') ? `<button class="btn-primary" id="ln-new-btn"><i class="fa-solid fa-plus"></i> New Loan Application</button>` : ''}
      </div>
    </div>

    <div class="lx-kpi-grid">
      <div class="lx-kpi"><div class="lx-kpi-ico"><i class="fa-regular fa-credit-card"></i></div>
        <div class="lx-kpi-body"><div class="lx-kpi-label">Total Loans</div><div class="lx-kpi-value" id="ln-k-total">—</div></div></div>
      <div class="lx-kpi"><div class="lx-kpi-ico"><i class="fa-solid fa-dollar-sign"></i></div>
        <div class="lx-kpi-body"><div class="lx-kpi-label">Portfolio</div><div class="lx-kpi-value" id="ln-k-portfolio">—</div></div></div>
      <div class="lx-kpi warn"><div class="lx-kpi-ico"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="lx-kpi-body"><div class="lx-kpi-label">Overdue</div><div class="lx-kpi-value" id="ln-k-overdue">—</div></div></div>
      <div class="lx-kpi danger"><div class="lx-kpi-ico"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="lx-kpi-body"><div class="lx-kpi-label">Total Arrears</div><div class="lx-kpi-value danger" id="ln-k-arrears">—</div></div></div>
    </div>

    <div class="lx-filter">
      <label class="lx-fl"><span>Status</span>
        <select id="lf-status" class="form-control">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="overpaid">Overpaid</option>
          <option value="closed">Closed</option>
        </select></label>
      <label class="lx-fl"><span>Product</span>
        <select id="lf-product" class="form-control"><option value="">All Products</option></select></label>
      <label class="lx-fl"><span>Branch</span>
        <select id="lf-branch" class="form-control"><option value="">All Branches</option></select></label>
    </div>

    <div class="lx-searchbar">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input id="lf-search" placeholder="Search…" autocomplete="off"/>
    </div>

    <div class="card">
      <table class="table">
        <thead><tr>
          <th>Loan No</th><th>Customer</th><th>Product</th>
          <th class="lx-num">Amount</th><th class="lx-num">Outstanding</th>
          <th class="lx-num">Arrears</th><th class="lx-num">DPD</th>
          <th>Next Payment</th><th>Status</th>
        </tr></thead>
        <tbody id="loans-rows">
          <tr><td colspan="9" class="empty-state-row">Loading loans…</td></tr>
        </tbody>
      </table>
      <div class="lx-foot">
        <div id="lf-export-wrap"><button class="btn-secondary btn-sm" id="lf-export"><i class="fa-solid fa-download"></i> Export CSV</button></div>
        <div id="lf-pagination" class="pagination-bar"></div>
      </div>
    </div>`;

  if (can('CREATE_LOAN')) {
    c.querySelector('#ln-new-btn')?.addEventListener('click', () =>
      import('../../router.js').then(r => r.navigate('loan-new')));
  }

  // Populate product + branch filters
  api.loanProducts.list().then(products => {
    const sel = c.querySelector('#lf-product');
    (Array.isArray(products) ? products : []).forEach(p => {
      const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; sel.appendChild(opt);
    });
  }).catch(() => {});
  api.offices.list().then(offices => {
    const sel = c.querySelector('#lf-branch');
    (Array.isArray(offices) ? offices : []).forEach(o => {
      const opt = document.createElement('option'); opt.value = o.name; opt.textContent = o.name; sel.appendChild(opt);
    });
  }).catch(() => {});

  let allLoans = [], totalRecords = 0, currentOffset = 0, pageSize = DEFAULT_PAGE_SIZE;

  async function loadKpis() {
    const results = await Promise.allSettled([
      api.loans.list({ limit: 1 }),
      api.runReports.run('ActiveLoansInArrears', { genericResultSet: true })
    ]);
    const totalCount = results[0].status === 'fulfilled' ? (results[0].value?.totalFilteredRecords ?? 0) : null;
    const arrearsCount = results[1].status === 'fulfilled' ? (results[1].value?.data?.length ?? null) : null;
    const setTxt = (id, v) => { const el = c.querySelector(id); if (el) el.textContent = v; };
    setTxt('#ln-k-total', totalCount != null ? num(totalCount) : '—');
    setTxt('#ln-k-overdue', arrearsCount != null ? num(arrearsCount) : '—');
    if (totalCount != null) setTxt('#ln-hdr-count', num(totalCount));
  }

  async function load(offset = 0) {
    const rowsEl = c.querySelector('#loans-rows');
    if (!rowsEl) return;
    rowsEl.innerHTML = '<tr><td colspan="9" class="empty-state-row">Loading…</td></tr>';
    try {
      const status   = c.querySelector('#lf-status')?.value;
      const productId = c.querySelector('#lf-product')?.value;
      const params = { limit: pageSize, offset };
      if (status)    params.status = status;
      if (productId) params.loanProductId = productId;

      const res = await api.loans.list(params);
      const raw = Array.isArray(res) ? res : (res?.pageItems || []);
      totalRecords = res?.totalFilteredRecords ?? raw.length;

      let list = raw.map(l => ({
        id: l.id,
        accountNo: l.accountNo || `${l.id}`,
        clientName: l.clientName || l.clientDisplayName || l.groupName || '—',
        // Fineract loan list items don't carry the client's phone; show account-scoped
        // secondary info that IS present (external id or client account), gracefully.
        clientSub: l.clientAccountNo || l.externalId || '',
        product: l.loanProductName || l.productName || '—',
        principal: l.principal || l.approvedPrincipal || l.proposedPrincipal || 0,
        outstanding: l.summary?.totalOutstanding ?? 0,
        arrears: l.summary?.totalOverdue ?? 0,
        dpd: l.delinquent?.pastDueDays ?? 0,
        nextPayment: l.timeline?.expectedMaturityDate || l.timeline?.actualDisbursementDate || l.timeline?.expectedDisbursementDate,
        status: l.status?.value || '—',
        officeName: l.officeName || '',
        externalId: l.externalId || ''
      }));

      const branch = c.querySelector('#lf-branch')?.value;
      if (branch) list = list.filter(l => l.officeName === branch);

      const q = c.querySelector('#lf-search')?.value?.toLowerCase() || '';
      if (q) list = list.filter(l =>
        l.accountNo.toLowerCase().includes(q) ||
        l.clientName.toLowerCase().includes(q) ||
        l.externalId.toLowerCase().includes(q));

      allLoans = list;
      currentOffset = offset;

      // Portfolio total (outstanding across the loaded page as a live proxy)
      const portfolio = raw.reduce((sum, l) => sum + (l.summary?.principalOutstanding ?? l.summary?.totalOutstanding ?? l.principal ?? 0), 0);
      const setTxt = (id, v) => { const el = c.querySelector(id); if (el) el.textContent = v; };
      setTxt('#ln-k-portfolio', compact(portfolio));
      setTxt('#ln-hdr-portfolio', compact(portfolio));
      const arrearsTotal = raw.reduce((sum, l) => sum + (l.summary?.totalOverdue || 0), 0);
      setTxt('#ln-k-arrears', fmt(arrearsTotal));

      draw(list);
      drawPagination();
    } catch (e) {
      rowsEl.innerHTML = `<tr><td colspan="9" class="text-error">${escapeHtml(extractFineractError(e))}</td></tr>`;
    }
  }

  function drawPagination() {
    renderPagination(c.querySelector('#lf-pagination'), {
      total: totalRecords, offset: currentOffset, pageSize,
      onChange: (newOffset, newSize) => { pageSize = newSize; load(newOffset); }
    });
  }

  function draw(rows) {
    const rowsEl = c.querySelector('#loans-rows');
    if (!rowsEl) return;
    rowsEl.innerHTML = rows.map(l => `
      <tr>
        <td><a href="#" data-view-loan="${l.id}" class="lx-acct">LN-${escapeHtml(l.accountNo)}</a></td>
        <td><div class="lx-cust"><div class="lx-cust-name">${escapeHtml(l.clientName)}</div>${l.clientSub ? `<div class="lx-cust-sub">${escapeHtml(l.clientSub)}</div>` : ''}</div></td>
        <td>${escapeHtml(l.product)}</td>
        <td class="lx-num">${compact(l.principal)}</td>
        <td class="lx-num">${compact(l.outstanding)}</td>
        <td class="lx-num">${l.arrears > 0 ? fmt(l.arrears) : '—'}</td>
        <td class="lx-num">${num(l.dpd || 0)}</td>
        <td>${l.nextPayment ? fmtDate(l.nextPayment) : '—'}</td>
        <td>${loanBadge(l.status)}</td>
      </tr>`).join('') || '<tr><td colspan="9" class="empty-state-row">No loans match</td></tr>';

    rowsEl.querySelectorAll('[data-view-loan]').forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      import('../../router.js').then(r => r.navigate('loans', { id: b.dataset.viewLoan }));
    }));
  }

  await Promise.all([load(), loadKpis()]);

  let t;
  c.querySelector('#lf-search').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => load(0), 400); });
  ['#lf-status', '#lf-product', '#lf-branch'].forEach(sel => {
    c.querySelector(sel)?.addEventListener('change', () => load(0));
  });

  c.querySelector('#lf-export').addEventListener('click', () => {
    const rows = allLoans.map(l => [l.accountNo, l.clientName, l.product, l.principal, l.outstanding, l.arrears, l.dpd, fmtDate(l.nextPayment), l.status].join(','));
    const csv = ['Loan No,Customer,Product,Amount,Outstanding,Arrears,DPD,Next Payment,Status', ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'loans.csv'; a.click();
    toast('success', 'Exported', 'loans.csv downloaded');
  });
}
