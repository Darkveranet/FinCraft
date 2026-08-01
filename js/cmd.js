import { navigate, PAGE_REGISTRY } from './router.js';
import { openModal, theme, toast } from './ui.js';
import { escapeHtml } from './utils.js';
import { toCommands } from './api/generated/aliases.generated.js';
import { runOperation } from './api/operation-runner.js';

const RECENT_KEY = 'fincraft.recentCmds';
const MAX_RECENT = 8;

const palette = () => document.getElementById('cmdPalette');
const input   = () => document.getElementById('cmdInput');
const results = () => document.getElementById('cmdResults');

let CMDS = [];
let visibleCmds = [];
let selectedIdx = 0;
let lastQuery = '';

function buildCommands() {
  const nav = Object.entries(PAGE_REGISTRY)
    .filter(([k]) => !['forbidden', 'not-found'].includes(k))
    .map(([key, def]) => ({
      id:   `nav:${key}`,
      icon: 'fa-solid ' + (def.icon || 'fa-circle'),
      cat:  'Navigate',
      label: 'Go to ' + def.label,
      run:  () => navigate(key)
    }));

  const create = [
    { id:'create:client',  icon:'fa-solid fa-user-plus',           label:'Create Client',         cat:'Create', run:()=>openModal('newClientModal') },
    { id:'create:loan',    icon:'fa-solid fa-hand-holding-dollar', label:'New Loan Application',  cat:'Create', run:()=>openModal('newLoanModal') },
    { id:'create:savings', icon:'fa-solid fa-piggy-bank',          label:'New Savings Account',   cat:'Create', run:()=>openModal('newSavingsModal') },
    { id:'create:fd',      icon:'fa-solid fa-vault',               label:'New Fixed Deposit',     cat:'Create', run:()=>openModal('newFDModal') },
    { id:'create:rd',      icon:'fa-solid fa-rotate',              label:'New Recurring Deposit', cat:'Create', run:()=>openModal('newRDModal') },
    { id:'create:share',   icon:'fa-solid fa-chart-pie',           label:'New Share Account',     cat:'Create', run:()=>openModal('newShareModal') },
    { id:'create:group',   icon:'fa-solid fa-people-group',        label:'New Group',             cat:'Create', run:()=>openModal('newGroupModal') },
    { id:'create:center',  icon:'fa-solid fa-building-columns',    label:'New Center',            cat:'Create', run:()=>openModal('newCenterModal') },
    { id:'create:office',  icon:'fa-solid fa-building',            label:'New Office',            cat:'Create', run:()=>openModal('newOfficeModal') },
    { id:'create:staff',   icon:'fa-solid fa-id-badge',            label:'New Staff Member',      cat:'Create', run:()=>openModal('newStaffModal') },
    { id:'create:user',    icon:'fa-solid fa-user-shield',         label:'New User',              cat:'Create', run:()=>openModal('newUserModal') },
    { id:'create:charge',  icon:'fa-solid fa-tag',                 label:'New Charge',            cat:'Create', run:()=>openModal('newChargeModal') },
    { id:'create:gl',      icon:'fa-solid fa-book',                label:'New GL Account',        cat:'Create', run:()=>openModal('glAccountModal') },
    { id:'create:holiday', icon:'fa-solid fa-calendar-day',        label:'New Holiday',           cat:'Create', run:()=>openModal('newHolidayModal') },
    { id:'create:teller',  icon:'fa-solid fa-cash-register',       label:'New Teller',            cat:'Create', run:()=>openModal('newTellerModal') }
  ];

  const actions = [
    { id:'act:repay',    icon:'fa-solid fa-money-bill-transfer', label:'Make Repayment',        cat:'Action', run:()=>openModal('repaymentModal') },
    { id:'act:transfer', icon:'fa-solid fa-right-left',          label:'Account Transfer',      cat:'Action', run:()=>openModal('newTransferModal') },
    { id:'act:remit',    icon:'fa-solid fa-paper-plane',         label:'Send Remittance',       cat:'Action', run:()=>import('./remit.js').then(m=>m.Remit.open()) },
    { id:'act:import',   icon:'fa-solid fa-file-import',         label:'Bulk Import',           cat:'Action', run:()=>openModal('bulkImportModal') },
    { id:'act:journal',  icon:'fa-solid fa-book-open',           label:'Post Journal Entry',    cat:'Action', run:()=>openModal('journalEntryModal') },
    { id:'act:wizard',   icon:'fa-solid fa-wand-magic-sparkles', label:'Configuration Wizard',  cat:'Action', run:()=>openModal('configWizardModal') },
    { id:'act:report',   icon:'fa-solid fa-play',                label:'Run Report',            cat:'Action', run:()=>openModal('runReportModal') },
    { id:'act:adhoc',    icon:'fa-solid fa-terminal',            label:'Ad-hoc SQL Query',      cat:'Action', run:()=>openModal('adhocQueryModal') }
  ];

  const settings = [
    { id:'set:theme',   icon:'fa-solid fa-circle-half-stroke', label:'Toggle Dark / Light Theme', cat:'Settings', run:()=>theme.toggle() },
    { id:'set:profile', icon:'fa-solid fa-id-card',            label:'My Profile',                cat:'Settings', run:()=>navigate('profile') },
    { id:'set:cfg',     icon:'fa-solid fa-gear',               label:'Settings',                  cat:'Settings', run:()=>navigate('settings') },
    { id:'set:logout',  icon:'fa-solid fa-right-from-bracket', label:'Sign Out',                  cat:'Settings', run:()=>import('./auth.js').then(m=>m.logout()) }
  ];

  // Contract-driven operations (generated by `npm run api:all`). Each alias runs
  // through the real implementation via the contract-driven operation runner.
  const apiCmds = toCommands((a) => runOperation(a));

  return [...nav, ...create, ...actions, ...settings, ...apiCmds];
}

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

function saveRecent(cmdId) {
  try {
    const recent = loadRecent().filter(id => id !== cmdId);
    recent.unshift(cmdId);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {}
}

function clearRecent() {
  try { localStorage.removeItem(RECENT_KEY); } catch {}
}

function getRecentCommands() {
  const ids = loadRecent();
  return ids.map(id => CMDS.find(c => c.id === id)).filter(Boolean);
}

function render(items, label) {
  visibleCmds = items;

  if (!items.length) {
    results().innerHTML = `
      <div class="empty-state" style="padding:24px">
        <i class="fa-solid fa-magnifying-glass empty-state-icon"></i>
        <h3>No commands match</h3>
      </div>`;
    return;
  }

  let html = '';
  if (label) {
    html += `<div class="cmd-group-label" style="display:flex;justify-content:space-between;align-items:center;padding:8px 18px 4px">
      <span>${escapeHtml(label)}</span>
      <button class="btn-ghost btn-xs" data-cmd-clear-recent style="font-size:10px">Clear</button>
    </div>`;
  }

  let lastCat = '';
  items.forEach((c, i) => {
    if (!label && c.cat !== lastCat) {
      html += `<div class="cmd-group-label" style="padding:8px 18px 4px">${escapeHtml(c.cat)}</div>`;
      lastCat = c.cat;
    }
    const subtitle = c.hint ? `<span class="cmd-item-cat">${escapeHtml(c.hint)}</span>` : '';
    html += `
      <div class="cmd-item ${i === selectedIdx ? 'focused' : ''}" data-idx="${i}">
        <div class="cmd-item-icon"><i class="${escapeHtml(c.icon)}"></i></div>
        <div class="cmd-item-label">${escapeHtml(c.label)}</div>
        ${subtitle}
      </div>`;
  });
  results().innerHTML = html;

  results().querySelectorAll('.cmd-item').forEach(r => {
    r.addEventListener('click', () => run(parseInt(r.dataset.idx, 10)));
    r.addEventListener('mouseenter', () => {
      selectedIdx = parseInt(r.dataset.idx, 10);
      updateSelection();
    });
  });

  results().querySelector('[data-cmd-clear-recent]')?.addEventListener('click', e => {
    e.stopPropagation();
    clearRecent();
    if (!lastQuery) showInitialState();
  });
}

function updateSelection() {
  results().querySelectorAll('.cmd-item').forEach((r, i) =>
    r.classList.toggle('focused', i === selectedIdx)
  );
  const focused = results().querySelector('.cmd-item.focused');
  if (focused) focused.scrollIntoView({ block: 'nearest' });
}

function showInitialState() {
  const recent = getRecentCommands();
  if (recent.length) {
    selectedIdx = 0;
    render(recent, 'Recent');
  } else {
    selectedIdx = 0;
    const top = CMDS.filter(c => ['Create', 'Action'].includes(c.cat));
    render(top, null);
  }
}

function run(idx) {
  const c = visibleCmds[idx];
  if (!c) return;
  saveRecent(c.id);
  closeCmd();
  try { c.run(); } catch (e) { console.error('[cmd-run]', e); toast('error', 'Command failed', e.message || ''); }
}

function filter(q) {
  q = (q || '').toLowerCase().trim();
  lastQuery = q;

  if (!q) {
    showInitialState();
    return;
  }

  const cmdMatches = CMDS.filter(c =>
    c.label.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q)
  );
  selectedIdx = 0;
  render(cmdMatches);

  debouncedEntitySearch(q, cmdMatches);
}

let searchSeq = 0, searchTimer = null;

function debouncedEntitySearch(q, cmdMatches) {
  clearTimeout(searchTimer);
  const mySeq = ++searchSeq;
  searchTimer = setTimeout(async () => {
    const entityResults = await gsSearch(q);
    if (mySeq !== searchSeq) return;
    if (input()?.value.toLowerCase().trim() !== q) return;
    selectedIdx = 0;
    render([...entityResults, ...cmdMatches]);
  }, 250);
}

export async function gsSearch(q) {
  try {
    const { api } = await import('./api.js');
    const r = await api.search.search(q, 'clients,loans,groups,savings');
    const list = Array.isArray(r) ? r : [];
    const ICONS = {
      CLIENT:  'fa-solid fa-user',
      LOAN:    'fa-solid fa-hand-holding-dollar',
      GROUP:   'fa-solid fa-people-group',
      CENTER:  'fa-solid fa-building-columns',
      SAVING:  'fa-solid fa-piggy-bank',
      SAVINGS: 'fa-solid fa-piggy-bank'
    };
    const PAGES = {
      CLIENT:  'client-detail',
      LOAN:    'loans',
      GROUP:   'groups',
      CENTER:  'centers',
      SAVING:  'savings',
      SAVINGS: 'savings'
    };

    return list.slice(0, 8).map(item => {
      const type = (item.entityType || '').toUpperCase();
      const id   = item.entityId || item.parentId;
      return {
        id:   `entity:${type}:${id}`,
        icon: ICONS[type] || 'fa-solid fa-magnifying-glass',
        cat:  type ? (type.charAt(0) + type.slice(1).toLowerCase() + 's') : 'Results',
        label: (item.entityAccountNo ? item.entityAccountNo + ' · ' : '') + (item.entityName || item.parentName || `#${id}`),
        hint: item.parentName || item.entityOfficeName || '',
        run:  () => navigate(PAGES[type] || 'search', id ? { id } : {})
      };
    });
  } catch (e) {
    console.warn('[cmd-entity-search]', e);
    return [];
  }
}

export function openCmd() {
  if (!CMDS.length) CMDS = buildCommands();
  if (!palette()) return;
  palette().hidden = false;
  palette().classList.add('open');
  input().value = '';
  lastQuery = '';
  showInitialState();
  setTimeout(() => input().focus(), 30);
}

export function closeCmd() {
  if (!palette()) return;
  palette().hidden = true;
  palette().classList.remove('open');
}

document.addEventListener('input', e => {
  if (e.target.id === 'cmdInput') filter(e.target.value);
});

document.addEventListener('keydown', e => {
  if (palette()?.hidden !== false) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIdx = Math.min(visibleCmds.length - 1, selectedIdx + 1);
    updateSelection();
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIdx = Math.max(0, selectedIdx - 1);
    updateSelection();
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    run(selectedIdx);
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    const q = input()?.value?.trim();
    if (q && q.length >= 2) {
      closeCmd();
      navigate('search', { q });
    }
  }
});

document.addEventListener('click', e => {
  if (e.target === palette()) closeCmd();
});
