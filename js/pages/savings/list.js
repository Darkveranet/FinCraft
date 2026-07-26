import { DATE_FORMAT, LOCALE, today } from '../../config.js';
import { api } from '../../api.js';
import { escapeHtml, fmt, fmtDate, num } from '../../utils.js';
import { openModal, toast } from '../../ui.js';
import { store } from '../../store.js';
import { renderPagination, DEFAULT_PAGE_SIZE } from '../../ui/pagination.js';
import { can } from './shared.js';
import { extractFineractError } from '../../ui/dom-helpers.js';

function savingsBadge(statusValue) {
  const s = String(statusValue || '').toLowerCase();
  let cls = 'b-info', label = statusValue || '—';
  if (s.includes('pending')) { cls = 'b-pending'; label = 'Pending Approval'; }
  else if (s === 'approved') { cls = 'b-approved'; label = 'Approved'; }
  else if (s === 'active') { cls = 'b-active'; label = 'Active'; }
  else if (s.includes('dormant') || s.includes('inactive')) { cls = 'b-dormant'; label = 'Dormant'; }
  else if (s.includes('closed')) { cls = 'b-closed'; label = 'Closed'; }
  else if (s.includes('rejected')) { cls = 'b-overdue'; label = 'Rejected'; }
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
        <h1>Savings Accounts</h1>
        <div class="text-muted"><span id="sv-hdr-count">—</span> accounts · Total balance: <span id="sv-hdr-balance">—</span></div>
      </div>
      <div class="page-actions">
        ${can('CREATE_SAVINGSACCOUNT') ? `<button class="btn-primary" id="sv-new-btn"><i class="fa-solid fa-plus"></i> Open Account</button>` : ''}
      </div>
    </div>

    <div class="lx-kpi-grid">
      <div class="lx-kpi"><div class="lx-kpi-ico"><i class="fa-solid fa-building-columns"></i></div>
        <div class="lx-kpi-body"><div class="lx-kpi-label">Total Accounts</div><div class="lx-kpi-value" id="sv-k-count">—</div></div></div>
      <div class="lx-kpi"><div class="lx-kpi-ico"><i class="fa-solid fa-building-columns"></i></div>
        <div class="lx-kpi-body"><div class="lx-kpi-label">Total Balance</div><div class="lx-kpi-value" id="sv-k-balance">—</div></div></div>
      <div class="lx-kpi"><div class="lx-kpi-ico"><i class="fa-solid fa-percent"></i></div>
        <div class="lx-kpi-body"><div class="lx-kpi-label">Interest Earned</div><div class="lx-kpi-value" id="sv-k-interest">—</div></div></div>
      <div class="lx-kpi"><div class="lx-kpi-ico"><i class="fa-solid fa-circle-check"></i></div>
        <div class="lx-kpi-body"><div class="lx-kpi-label">Active</div><div class="lx-kpi-value" id="sv-k-active">—</div></div></div>
    </div>

    <div class="lx-filter">
      <label class="lx-fl"><span>Product</span>
        <select id="sv-product" class="form-control"><option value="">All Products</option></select></label>
      <label class="lx-fl"><span>Status</span>
        <select id="sv-status" class="form-control">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="closed">Closed</option>
        </select></label>
      <label class="lx-fl"><span>Branch</span>
        <select id="sv-branch" class="form-control"><option value="">All Branches</option></select></label>
    </div>

    <div class="lx-searchbar">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input id="sv-search" placeholder="Search…" autocomplete="off"/>
    </div>

    <div class="card">
      <table class="table">
        <thead><tr>
          <th>Account No</th><th>Customer</th><th>Product</th>
          <th class="lx-num">Balance</th><th class="lx-num">Interest Earned</th>
          <th>Branch</th><th>Opened</th><th>Status</th>
        </tr></thead>
        <tbody id="sv-rows">
          <tr><td colspan="8" class="empty-state-row">Loading…</td></tr>
        </tbody>
      </table>
      <div class="lx-foot">
        <div id="sv-showing" class="text-muted"></div>
        <div id="sv-pagination" class="pagination-bar"></div>
      </div>
    </div>`;

  if (can('CREATE_SAVINGSACCOUNT')) {
    c.querySelector('#sv-new-btn')?.addEventListener('click', () =>
      import('../../router.js').then(r => r.navigate('savings-new')));
  }

  api.savingsProducts.list().then(p => {
    const sel = c.querySelector('#sv-product');
    (Array.isArray(p) ? p : []).forEach(prod => {
      const opt = document.createElement('option'); opt.value = prod.id; opt.textContent = prod.name; sel.appendChild(opt);
    });
  }).catch(() => {});
  api.offices.list().then(offices => {
    const sel = c.querySelector('#sv-branch');
    (Array.isArray(offices) ? offices : []).forEach(o => {
      const opt = document.createElement('option'); opt.value = o.name; opt.textContent = o.name; sel.appendChild(opt);
    });
  }).catch(() => {});

  let allAccounts = [], totalRecords = 0, currentOffset = 0, pageSize = DEFAULT_PAGE_SIZE;

  async function loadKpis() {
    try {
      const status = c.querySelector('#sv-status')?.value;
      const prod   = c.querySelector('#sv-product')?.value;
      const params = { limit: 10000 };
      if (status) params.status = status;
      if (prod)   params.productId = prod;

      const res = await api.savings.list(params);
      const all = Array.isArray(res) ? res : (res?.pageItems || []);
      const totalBal = all.reduce((sum, a) => sum + (a.summary?.accountBalance || 0), 0);
      const totalInt = all.reduce((sum, a) => sum + (a.summary?.totalInterestEarned || a.summary?.totalInterestPosted || 0), 0);
      const activeCount = all.filter(a => (a.status?.value || '') === 'Active').length;

      const setTxt = (id, v) => { const el = c.querySelector(id); if (el) el.textContent = v; };
      setTxt('#sv-k-count', num(all.length));
      setTxt('#sv-k-balance', compact(totalBal));
      setTxt('#sv-k-interest', compact(totalInt));
      setTxt('#sv-k-active', num(activeCount));
      setTxt('#sv-hdr-count', num(all.length));
      setTxt('#sv-hdr-balance', compact(totalBal));
    } catch {
      ['#sv-k-count', '#sv-k-balance', '#sv-k-interest', '#sv-k-active'].forEach(id => {
        const el = c.querySelector(id); if (el) el.textContent = '—';
      });
    }
  }

  async function load(offset = 0) {
    const rowsEl = c.querySelector('#sv-rows');
    if (!rowsEl) return;
    rowsEl.innerHTML = '<tr><td colspan="8" class="empty-state-row">Loading…</td></tr>';
    try {
      const status = c.querySelector('#sv-status')?.value;
      const prod   = c.querySelector('#sv-product')?.value;
      const params = { limit: pageSize, offset };
      if (status) params.status = status;
      if (prod)   params.productId = prod;

      const res = await api.savings.list(params);
      let list = Array.isArray(res) ? res : (res?.pageItems || []);
      totalRecords = res?.totalFilteredRecords ?? list.length;

      const branch = c.querySelector('#sv-branch')?.value;
      if (branch) list = list.filter(s => (s.officeName || '') === branch);

      const q = c.querySelector('#sv-search')?.value?.toLowerCase() || '';
      if (q) list = list.filter(s =>
        (s.accountNo || '').toLowerCase().includes(q) ||
        (s.clientName || '').toLowerCase().includes(q));

      allAccounts = list;
      currentOffset = offset;

      const from = totalRecords ? offset + 1 : 0;
      const to = Math.min(offset + list.length, totalRecords);
      const showEl = c.querySelector('#sv-showing');
      if (showEl) showEl.textContent = `Showing ${from}–${to} of ${num(totalRecords)}`;

      draw(list);
      drawPagination();
    } catch (e) {
      rowsEl.innerHTML = `<tr><td colspan="8" class="text-error">${escapeHtml(extractFineractError(e))}</td></tr>`;
    }
  }

  function drawPagination() {
    renderPagination(c.querySelector('#sv-pagination'), {
      total: totalRecords, offset: currentOffset, pageSize,
      onChange: (newOffset, newSize) => { pageSize = newSize; load(newOffset); }
    });
  }

  function draw(rows) {
    const rowsEl = c.querySelector('#sv-rows');
    if (!rowsEl) return;
    rowsEl.innerHTML = rows.map(s => {
      const bal = s.summary?.accountBalance ?? 0;
      const int = s.summary?.totalInterestEarned ?? s.summary?.totalInterestPosted ?? 0;
      const opened = s.timeline?.activatedOnDate || s.timeline?.approvedOnDate || s.timeline?.submittedOnDate;
      return `
        <tr>
          <td><a href="#" data-view-savings="${s.id}" class="lx-acct">SA-${escapeHtml(s.accountNo || s.id)}</a></td>
          <td><div class="lx-cust"><div class="lx-cust-name">${escapeHtml(s.clientName || s.groupName || '—')}</div></div></td>
          <td>${escapeHtml(s.savingsProductName || '—')}</td>
          <td class="lx-num">${fmt(bal)}</td>
          <td class="lx-num">${fmt(int)}</td>
          <td>${escapeHtml(s.officeName || '—')}</td>
          <td>${opened ? fmtDate(opened) : '—'}</td>
          <td>${savingsBadge(s.status?.value)}</td>
        </tr>`;
    }).join('') || '<tr><td colspan="8" class="empty-state-row">No accounts found</td></tr>';

    rowsEl.querySelectorAll('[data-view-savings]').forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      import('../../router.js').then(r => r.navigate('savings', { id: b.dataset.viewSavings }));
    }));
  }

  await Promise.all([load(), loadKpis()]);

  let t;
  c.querySelector('#sv-search').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => load(0), 400); });
  ['#sv-status', '#sv-product'].forEach(sel => {
    c.querySelector(sel)?.addEventListener('change', () => { load(0); loadKpis(); });
  });
  c.querySelector('#sv-branch')?.addEventListener('change', () => load(0));
}
