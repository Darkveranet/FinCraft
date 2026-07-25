export const SPIN = `<i class="fa-solid fa-circle-notch fa-spin" style="font-size:16px"></i>`;
export const KPI_SKELETON = `<span class="skeleton-bar" style="display:inline-block;height:26px;width:70px"></span>`;
export const SNAPSHOT_TABLE = 'dashboard_daily_snapshot';
export const PALETTE = ['#00c9b1', '#60a5fa', '#a78bfa', '#f87171', '#fbbf24', '#4ade80', '#f472b6', '#64748b'];

export const KPIS = [
  { id: 'clients',     label: 'Total Customers',   icon: 'fa-users',                accent: 'teal'   },
  { id: 'newClients',  label: 'New This Month',    icon: 'fa-user-plus',            accent: 'green'  },
  { id: 'savings',     label: 'Total Savings',     icon: 'fa-piggy-bank',           accent: 'blue'   },
  { id: 'gross',       label: 'Loan Portfolio',    icon: 'fa-credit-card',          accent: 'purple' },
  { id: 'outstanding', label: 'Outstanding',       icon: 'fa-sack-dollar',          accent: 'amber'  },
  { id: 'collected',   label: 'Amount Collected',  icon: 'fa-money-bill-transfer',  accent: 'teal'   },
  { id: 'par',         label: 'Portfolio at Risk', icon: 'fa-triangle-exclamation', accent: 'red'    },
  { id: 'pending',     label: 'Pending Approvals', icon: 'fa-clock',                accent: 'blue'   }
];

export const QUICK_ACTIONS = [
  { perm: 'CREATE_CLIENT',          modal: 'newClientModal',    icon: 'fa-user-plus',           label: 'New Client' },
  { perm: 'CREATE_LOAN',            modal: 'newLoanModal',      icon: 'fa-hand-holding-dollar',  label: 'New Loan' },
  { perm: 'CREATE_SAVINGSACCOUNT',  modal: 'newSavingsModal',   icon: 'fa-piggy-bank',           label: 'New Savings' },
  { perm: 'REPAYMENT_LOAN',         modal: 'repaymentModal',    icon: 'fa-money-bill-transfer',  label: 'Repayment' },
  { perm: 'CREATE_ACCOUNTTRANSFER', modal: 'newTransferModal',  icon: 'fa-right-left',           label: 'Transfer' },
  { perm: 'CREATE_JOURNALENTRY',    modal: 'journalEntryModal', icon: 'fa-book',                 label: 'Journal Entry' },
  { checker: true,                  href: '#/tasks',            icon: 'fa-inbox',                label: 'Checker Inbox' },
  { perm: 'READ_REPORT',            href: '#/reports',          icon: 'fa-file-chart-column',    label: 'Reports' }
];

export function toJsDate(d) {
  if (!d) return null;
  if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
  const dt = new Date(d);
  return isNaN(dt) ? null : dt;
}
export const isoDay = d => d.toISOString().split('T')[0];
