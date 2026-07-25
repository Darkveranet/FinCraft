import { api } from '../api.js';
import { fmt, num, escapeHtml } from '../utils.js';

export async function render(c) {
  c.innerHTML = `
  <div class="page active">
    <div class="page-header">
      <div><h1 class="page-title">Analytics</h1><div class="page-subtitle">Risk & drill-down — deeper cuts of the numbers already on your Dashboard, not a repeat of them</div></div>
      <button class="btn-ghost" id="an-refresh"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
    </div>

    <div class="stat-grid" id="an-kpis">
      ${['an-npl','an-par30','an-closure','an-avgloans'].map((id,i) => `
        <div class="stat-card ${i===0?'c-danger':i===1?'c-warn':''}">
          <div class="label">${['NPL Ratio','PAR 30','Loan Closure Rate','Avg Loans / Active Client'][i]}</div>
          <div class="value" id="${id}"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:18px"></i></div>
        </div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Delinquency Aging Breakdown</h3>
        <span class="text-muted" style="font-size:12px">Outstanding by days overdue — from the PortfolioAtRisk report</span></div>
      <div id="an-aging-wrap" style="min-height:220px;position:relative">
        <canvas id="an-aging-chart" height="220"></canvas>
        <div id="an-aging-fallback" class="text-muted" style="font-size:13px;display:none"></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3 class="card-title">Arrears by Loan Officer</h3>
          <span class="text-muted" style="font-size:12px">Ranked by exposure, not volume</span></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>#</th><th>Loan Officer</th><th>Loans in Arrears</th><th>Overdue Amount</th></tr></thead>
          <tbody id="an-officer-risk"><tr><td colspan="4"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading…</td></tr></tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">Loan Product Mix — Rate &amp; Exposure</h3>
          <span class="text-muted" style="font-size:12px">Which products actually carry volume</span></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Product</th><th>Rate</th><th>Principal</th><th>Active Loans</th></tr></thead>
          <tbody id="an-products"><tr><td colspan="4"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading…</td></tr></tbody>
        </table></div>
      </div>
    </div>
  </div>`;

  await loadAll(c);
  c.querySelector('#an-refresh').addEventListener('click', () => loadAll(c));
}

async function loadAll(c) {
  ['an-npl','an-par30','an-closure','an-avgloans'].forEach(id => {
    const el = c.querySelector(`#${id}`);
    if (el) el.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="font-size:18px"></i>';
  });

  const results = await Promise.allSettled([
    api.clients.list({ limit: 1, status: 'active' }),
    api.loans.list({ limit: 1, status: 'active' }),
    api.loans.list({ limit: 1, status: 'closed' }),
    api.runReports.run('PortfolioAtRisk',     { genericResultSet: true }).catch(() => null),
    api.runReports.run('ActiveLoansInArrears',{ genericResultSet: true }).catch(() => null),
    api.staff.list({ loanOfficersOnly: true }),
    api.loanProducts.list()
  ]);

  const val = (i) => results[i].status === 'fulfilled' ? results[i].value : null;
  const warn = (elId) => {
    const el = c.querySelector(`#${elId}`);
    if (el) el.innerHTML = '<span class="badge b-warn" title="Failed to load">—</span>';
  };

  const activeClients = val(0)?.totalFilteredRecords ?? null;
  const activeLoans   = val(1)?.totalFilteredRecords ?? null;
  const closedLoans   = val(2)?.totalFilteredRecords ?? null;
  const parData       = val(3);
  const nplData       = val(4);

  const nplEl = c.querySelector('#an-npl');
  const nplFromPrincipal = computeNplFromPar(parData);
  if (nplFromPrincipal != null) {
    if (nplEl) nplEl.textContent = `${nplFromPrincipal.toFixed(2)}%`;
  } else if (nplData?.data?.length && activeLoans) {
    if (nplEl) nplEl.textContent = `~${((nplData.data.length / activeLoans) * 100).toFixed(2)}%`;
  } else if (nplEl) warn('an-npl');

  const parEl = c.querySelector('#an-par30');
  if (parData?.data?.length) {
    const parRow = parData.data.find(r => String(r.row?.[0] || '').includes('30')) || parData.data[0];
    const parPct = parRow?.row?.[1] ?? parRow?.row?.[0];
    if (parEl) parEl.textContent = parPct != null ? `${parseFloat(parPct).toFixed(2)}%` : '—';
  } else if (parEl) warn('an-par30');

  const closureEl = c.querySelector('#an-closure');
  if (activeLoans != null && closedLoans != null && (activeLoans + closedLoans) > 0) {
    if (closureEl) closureEl.textContent = `${((closedLoans / (activeLoans + closedLoans)) * 100).toFixed(1)}%`;
  } else if (closureEl) warn('an-closure');

  const avgEl = c.querySelector('#an-avgloans');
  if (activeLoans != null && activeClients) {
    if (avgEl) avgEl.textContent = (activeLoans / activeClients).toFixed(2);
  } else if (avgEl) warn('an-avgloans');

  const agingCanvas   = c.querySelector('#an-aging-chart');
  const agingFallback = c.querySelector('#an-aging-fallback');
  const chartJsOk = await loadChartJs().catch(() => false);
  const aging = computeAgingBuckets(parData);
  if (aging && agingCanvas && chartJsOk) {
    renderAgingChart(agingCanvas, aging);
  } else if (agingCanvas) {
    agingCanvas.style.display = 'none';
    if (agingFallback) {
      agingFallback.style.display = 'block';
      agingFallback.textContent = !chartJsOk
        ? 'Chart library failed to load — check your connection'
        : 'PortfolioAtRisk report unavailable or its column layout wasn\u2019t recognised on this server';
    }
  }

  const officerRiskEl = c.querySelector('#an-officer-risk');
  const arrearsByOfficer = computeArrearsByOfficer(nplData);
  if (officerRiskEl) {
    if (arrearsByOfficer?.rows.length) {
      officerRiskEl.innerHTML = arrearsByOfficer.rows.slice(0, 15).map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(r.officer)}</td>
          <td>${num(r.count)}</td>
          <td>${arrearsByOfficer.hasAmount ? fmt(r.amount) : '<span class="text-muted">—</span>'}</td>
        </tr>`).join('');
    } else if (nplData?.data?.length) {
      officerRiskEl.innerHTML = '<tr><td colspan="4" class="text-muted">This server\u2019s ActiveLoansInArrears report doesn\u2019t expose a loan-officer column <span class="badge b-warn" title="Report layout not recognised">!</span></td></tr>';
    } else if (nplData?.data?.length === 0) {
      officerRiskEl.innerHTML = '<tr><td colspan="4"><div class="empty-state"><i class="fa-solid fa-face-smile"></i><div>No loans currently in arrears</div></div></td></tr>';
    } else {
      officerRiskEl.innerHTML = '<tr><td colspan="4" class="text-muted">No data available <span class="badge b-warn" title="Report may not exist on this server">!</span></td></tr>';
    }
  }

  const prodList = Array.isArray(val(6)) ? val(6) : [];
  const prodEl   = c.querySelector('#an-products');
  if (prodEl) {
    if (prodList.length) {
      const topProducts = prodList.slice(0, 12);
      const SAMPLE_CAP = 1000;
      let byProduct = null, sampled = false;
      try {
        const r = await api.loans.list({ limit: SAMPLE_CAP, status: 'active', orderBy: 'id', sortOrder: 'DESC' });
        const loans = Array.isArray(r) ? r : (r?.pageItems || []);
        const total = r?.totalFilteredRecords ?? loans.length;
        sampled = total > loans.length;
        byProduct = new Map();
        for (const l of loans) {
          const pid = l.loanProductId ?? l.productId ?? l.loanProduct?.id;
          if (pid != null) byProduct.set(pid, (byProduct.get(pid) || 0) + 1);
        }
      } catch { byProduct = null; }
      const countFor = (p) => byProduct ? (byProduct.get(p.id) || 0) : null;
      prodEl.innerHTML = topProducts.map((p) => `
        <tr>
          <td>${escapeHtml(p.name)}<div class="text-muted mono" style="font-size:11px">${escapeHtml(p.shortName || '—')}</div></td>
          <td class="mono">${p.interestRatePerPeriod || 0}%</td>
          <td class="mono">${fmt(p.principal || 0)}</td>
          <td class="mono">${countFor(p) != null
              ? num(countFor(p)) + (sampled ? ' <span class="badge b-warn" title="Estimated from a sample of active loans — actual total exceeds the sample size">~</span>' : '')
              : '<span class="badge b-warn" title="Failed to load">—</span>'}</td>
        </tr>`).join('') +
        (prodList.length > 12 ? `<tr><td colspan="4" class="text-muted" style="font-size:12px">+ ${prodList.length - 12} more product(s) not shown</td></tr>` : '');
    } else {
      prodEl.innerHTML = '<tr><td colspan="4"><div class="empty-state"><i class="fa-solid fa-cube"></i><div>No loan products found</div></div></td></tr>';
    }
  }
}

export function computeNplFromPar(parData) {
  if (!parData?.data?.length || !parData?.columnHeaders?.length) return null;
  const cols = parData.columnHeaders.map(h => h.columnName || '');

  const totalIdx = cols.findIndex(c => /total.*(outstanding|portfolio)|outstanding.*total/i.test(c));
  if (totalIdx < 0) return null;

  const atRiskIdxs = cols
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) =>
      i !== totalIdx &&
      /\d+\s*-\s*\d+|>\s*\d+|overdue|arrears|days/i.test(c) &&
      !/current|not\s*overdue|total/i.test(c))
    .map(({ i }) => i);

  if (!atRiskIdxs.length) return null;

  let totalOutstanding = 0;
  let atRiskOutstanding = 0;
  for (const row of parData.data) {
    const cells = row.row || [];
    const rowTotal = parseFloat(cells[totalIdx]);
    if (!isNaN(rowTotal)) totalOutstanding += rowTotal;
    for (const idx of atRiskIdxs) {
      const v = parseFloat(cells[idx]);
      if (!isNaN(v)) atRiskOutstanding += v;
    }
  }

  if (totalOutstanding <= 0) return null;
  return (atRiskOutstanding / totalOutstanding) * 100;
}

export function computeAgingBuckets(parData) {
  if (!parData?.data?.length || !parData?.columnHeaders?.length) return null;
  const cols = parData.columnHeaders.map(h => h.columnName || '');

  const bucketIdxs = cols
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => /\d+\s*-\s*\d+|>\s*\d+|current|overdue|arrears|not\s*overdue/i.test(c) && !/total/i.test(c))
    .map(({ i }) => i);

  if (bucketIdxs.length < 2) return null;

  const sums = bucketIdxs.map(() => 0);
  for (const row of parData.data) {
    const cells = row.row || [];
    bucketIdxs.forEach((idx, bi) => {
      const v = parseFloat(cells[idx]);
      if (!isNaN(v)) sums[bi] += v;
    });
  }

  return { labels: bucketIdxs.map(idx => cols[idx]), values: sums };
}

export function computeArrearsByOfficer(nplData) {
  if (!nplData?.data?.length || !nplData?.columnHeaders?.length) return null;
  const cols = nplData.columnHeaders.map(h => h.columnName || '');

  const officerIdx = cols.findIndex(c => /loan\s*officer|officer\s*name/i.test(c));
  if (officerIdx < 0) return null;
  const amountIdx = cols.findIndex(c => /overdue|arrears|principal.*od|amount.*od|total.*od/i.test(c));

  const groups = new Map();
  for (const row of nplData.data) {
    const cells = row.row || [];
    const officer = String(cells[officerIdx] ?? '').trim() || 'Unassigned';
    const amt = amountIdx >= 0 ? parseFloat(cells[amountIdx]) : NaN;
    const g = groups.get(officer) || { count: 0, amount: 0 };
    g.count += 1;
    if (!isNaN(amt)) g.amount += amt;
    groups.set(officer, g);
  }

  const rows = [...groups.entries()].map(([officer, g]) => ({ officer, count: g.count, amount: g.amount }));
  const hasAmount = amountIdx >= 0;
  rows.sort((a, b) => (hasAmount ? b.amount - a.amount : b.count - a.count));
  return { rows, hasAmount };
}

let chartJsPromise = null;
function loadChartJs() {
  if (window.Chart) return Promise.resolve(true);
  if (chartJsPromise) return chartJsPromise;
  chartJsPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return chartJsPromise;
}

const chartInstances = new WeakMap();
function destroyChart(canvas) {
  const existing = chartInstances.get(canvas);
  if (existing) { existing.destroy(); chartInstances.delete(canvas); }
}

function renderAgingChart(canvas, { labels, values }) {
  destroyChart(canvas);
  canvas.style.display = 'block';
  const fallback = canvas.parentElement.querySelector('#an-aging-fallback');
  if (fallback) fallback.style.display = 'none';

  const colors = labels.map(l => /current|not\s*overdue/i.test(l) ? '#00c9b1' : '#f87171');

  const chart = new window.Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Outstanding', data: values, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
  chartInstances.set(canvas, chart);
}
