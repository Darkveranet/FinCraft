import { api } from './api.js';
import { escapeHtml } from './utils.js';

document.addEventListener('fc:modals-loaded', async () => {
  try {
    const gl = await api.glAccounts.list({ manualEntriesAllowed: true, usage: 'DETAIL' });
    const accounts = Array.isArray(gl) ? gl : [];
    const optHtml = '<option value="">Select GL account…</option>' +
      accounts.map(a => `<option value="${a.id}">${escapeHtml(a.glCode)} — ${escapeHtml(a.name)}</option>`).join('');

    document.querySelectorAll('[data-je-account]').forEach(sel => { sel.innerHTML = optHtml; });

    document.getElementById('add-debit-row')?.addEventListener('click', () => addJERow('je-debits-body', optHtml));
    document.getElementById('add-credit-row')?.addEventListener('click', () => addJERow('je-credits-body', optHtml));

    document.getElementById('journalEntryModal')?.addEventListener('je-row-added', () => {
      document.querySelectorAll('[data-je-account]').forEach(sel => {
        if (!sel.value && sel.options.length <= 1) sel.innerHTML = optHtml;
      });
    });
  } catch {}

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-report]');
    if (!b) return;
    const modal = document.getElementById('runReportModal');
    if (modal) {
      modal.dataset.report = b.dataset.report || '';
      const nameEl = document.getElementById('run-report-name');
      if (nameEl) nameEl.textContent = b.dataset.report || '—';
    }
  });

  try {
    const sp = await api.shareProducts.list();
    const list = Array.isArray(sp) ? sp : [];
    const sel = document.getElementById('shareProductSel');
    if (sel && list.length) {
      sel.innerHTML = '<option value="">Select product…</option>' +
        list.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }
  } catch {}

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-modal]');
    if (!trigger) return;
    const modalId = trigger.dataset.modal;
    const modal = modalId && document.getElementById(modalId);
    if (!modal) return;
    const todayStr = new Date().toISOString().split('T')[0];
    modal.querySelectorAll('input[type="date"]').forEach(inp => {
      if (!inp.value) inp.value = todayStr;
    });
  });
  document.getElementById('bulkImportFile')?.addEventListener('change', e => {
    const fn = document.getElementById('import-file-name');
    if (fn) fn.textContent = e.target.files[0]?.name || '';
  });

  wireClientSearch('loanClientSearch', 'loanClientId', 'loanClientResults');
  wireClientSearch('savClientSearch',  'savClientId',  'savClientResults');
  wireClientSearch('fdClientSearch',   'fdClientId',   'fdClientResults');
  wireClientSearch('rdClientSearch',   'rdClientId',   'rdClientResults');
  wireClientSearch('shClientSearch',   'shClientId',   'shClientResults');
  wireClientSearch('ssClientSearch',   'ssClientId',   'ssClientResults');

  api.paymentTypes.list().then(pts => {
    const list = Array.isArray(pts) ? pts : [];
    const optsHtml = placeholder => `<option value="">${placeholder}</option>` +
      list.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    const je = document.getElementById('je-paymenttype');
    if (je) je.innerHTML = optsHtml('— None —');
    ['sv-dep-paymenttype', 'rp-paymenttype'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = optsHtml('— Default —');
    });
  }).catch(() => {});

  api.glAccounts.list().then(accts => {
    const list = Array.isArray(accts) ? accts : [];
    const parentSel = document.getElementById('gl-parent-sel');
    if (parentSel) {
      parentSel.innerHTML = '<option value="">— None (root) —</option>' +
        list.map(a => `<option value="${a.id}">${escapeHtml((a.glCode ? a.glCode + ' — ' : '') + a.name)}</option>`).join('');
    }
  }).catch(() => {});

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-modal="writeOffModal"]');
    if (t) {
      const loanId = t.dataset.loanId || t.closest('[data-loan-id]')?.dataset.loanId;
      if (loanId) {
        const modal = document.getElementById('writeOffModal');
        if (modal) modal.dataset.loanId = loanId;
      }
    }
    const r = e.target.closest('[data-modal="rescheduleModal"]');
    if (r) {
      const loanId = r.dataset.loanId || r.closest('[data-loan-id]')?.dataset.loanId;
      const modal = document.getElementById('rescheduleModal');
      if (loanId && modal) {
        modal.dataset.loanId = loanId;
        const hidden = document.getElementById('rs-loanid');
        if (hidden) hidden.value = loanId;
      }
    }
  });

  const clientLegalForm = document.getElementById('client-legal-form');
  if (clientLegalForm) {
    const toggleClientFields = () => {
      const isEntity = clientLegalForm.value === '2';
      const indFields = document.getElementById('client-individual-fields');
      const entFields = document.getElementById('client-entity-fields');
      if (indFields) indFields.style.display = isEntity ? 'none' : 'contents';
      if (entFields) entFields.style.display = isEntity ? 'contents' : 'none';
      document.querySelector('#newClientModal [name="firstname"]')?.toggleAttribute('required', !isEntity);
      document.querySelector('#newClientModal [name="lastname"]')?.toggleAttribute('required', !isEntity);
      document.querySelector('#newClientModal [name="fullname"]')?.toggleAttribute('required', isEntity);
    };
    clientLegalForm.addEventListener('change', toggleClientFields);
    toggleClientFields();
  }

  const grpCenterSel = document.getElementById('grp-center-sel');
  if (grpCenterSel) {
    grpCenterSel.addEventListener('change', () => {
      const opt = grpCenterSel.selectedOptions[0];
      const officeId = opt?.dataset.officeId;
      const officeSel = document.querySelector('#newGroupForm [name="officeId"]');
      if (officeId && officeSel) officeSel.value = officeId;
    });
  }

  const clCenterSel = document.getElementById('cl-center-sel');
  const clGroupWrap = document.getElementById('cl-group-wrap');
  const clGroupSel  = document.getElementById('cl-group-sel');
  if (clCenterSel && clGroupWrap && clGroupSel) {
    clCenterSel.addEventListener('change', async () => {
      const centerId = clCenterSel.value;
      if (!centerId) {
        clGroupWrap.style.display = 'none';
        clGroupSel.innerHTML = '<option value="">— Select a group —</option>';
        clGroupSel.value = '';
        clGroupSel.removeAttribute('required');
        return;
      }
      clGroupWrap.style.display = '';
      clGroupSel.setAttribute('required', 'required');
      clGroupSel.innerHTML = '<option value="">Loading…</option>';
      try {
        const ctr = await api.centers.get(centerId, { associations: 'groupMembers' });
        const groups = ctr?.groupMembers || [];
        clGroupSel.innerHTML = groups.length
          ? '<option value="">Select group…</option>' + groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('')
          : '<option value="">No groups in this center</option>';
      } catch {
        clGroupSel.innerHTML = '<option value="">Failed to load groups</option>';
      }
    });
  }

  const loanProductSel = document.querySelector('#newLoanModal [name="productId"]');
  const loanForm = document.getElementById('newLoanForm');
  if (loanProductSel && loanForm) {
    loanProductSel.addEventListener('change', async () => {
      delete loanForm.dataset.tpl;
      const productId = loanProductSel.value;
      if (!productId) return;
      try {
        const tpl = await api.loans.template({ productId, templateType: 'individual' });
        const cfg = {
          amortizationType:               tpl.amortizationType?.id,
          interestType:                   tpl.interestType?.id,
          interestCalculationPeriodType:  tpl.interestCalculationPeriodType?.id,
          interestRateFrequencyType:      tpl.interestRateFrequencyType?.id,
          repaymentFrequencyType:         tpl.repaymentFrequencyType?.id,
          transactionProcessingStrategyCode: tpl.transactionProcessingStrategyOptions?.[0]?.code,
          numberOfRepayments:             tpl.numberOfRepayments,
          principal:                      tpl.principal,
          interestRatePerPeriod:          tpl.interestRatePerPeriod
        };
        loanForm.dataset.tpl = JSON.stringify(cfg);
        const principalInput  = loanForm.querySelector('[name="principal"]');
        const nRepInput       = loanForm.querySelector('[name="numberOfRepayments"]');
        const repEveryInput   = loanForm.querySelector('[name="repaymentEvery"]');
        const repFreqSel      = loanForm.querySelector('[name="repaymentFrequencyType"]');
        const rateInput       = loanForm.querySelector('[name="interestRate"]');
        if (principalInput && !principalInput.value && cfg.principal) principalInput.value = cfg.principal;
        if (nRepInput && cfg.numberOfRepayments) nRepInput.value = cfg.numberOfRepayments;
        if (repEveryInput && tpl.repaymentEvery) repEveryInput.value = tpl.repaymentEvery;
        if (repFreqSel && cfg.repaymentFrequencyType != null) repFreqSel.value = String(cfg.repaymentFrequencyType);
        if (rateInput && cfg.interestRatePerPeriod != null) rateInput.value = cfg.interestRatePerPeriod;
      } catch { }
    });
  }

  const chargeAppliesTo = document.getElementById('charge-appliesto');
  if (chargeAppliesTo) {
    try {
      const tpl = await api.charges.template();
      const opt = (list, key='value') => (list || []).map(o => `<option value="${o.id}">${escapeHtml(o[key] || o.name)}</option>`).join('');
      chargeAppliesTo.innerHTML = opt(tpl.chargeAppliesToOptions);
      document.getElementById('charge-timetype').innerHTML = opt(tpl.chargeTimeTypeOptions);
      document.getElementById('charge-calctype').innerHTML = opt(tpl.chargeCalculationTypeOptions);
      document.getElementById('charge-currency').innerHTML = (tpl.currencyOptions || []).map(c => `<option value="${c.code}">${escapeHtml(c.name)} (${c.code})</option>`).join('');
    } catch (e) { console.warn('[charges/template]', e); }
  }

  const rsReasonSel = document.getElementById('rs-reason-sel');
  if (rsReasonSel) {
    try {
      const tpl = await api.loans.rescheduleTemplate().catch(() => null);
      let reasons = tpl?.rescheduleReasons || tpl?.rescheduleReasonOptions || [];

      if (!Array.isArray(reasons) || !reasons.length) {
        reasons = await api.codes.values(61).catch(() => []);
      }
      if (!Array.isArray(reasons) || !reasons.length) {
        reasons = await api.codes.list().then(async codes => {
          const match = (Array.isArray(codes) ? codes : []).find(c => c.name === 'LoanRescheduleReason');
          return match ? api.codes.values(match.id) : [];
        }).catch(() => []);
      }

      if (Array.isArray(reasons) && reasons.length) {
        rsReasonSel.innerHTML = '<option value="">Select reason…</option>' +
          reasons.map(r => `<option value="${r.id}">${escapeHtml(r.value || r.name || String(r.id))}</option>`).join('');
      } else {
        rsReasonSel.innerHTML = '<option value="">No reasons configured</option>';
      }
    } catch (e) {
      rsReasonSel.innerHTML = '<option value="">Could not load reasons</option>';
      console.warn('[reschedule/template]', e);
    }
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-modal="repaymentModal"], [data-loan-repay]');
    if (!t) return;
    const modal = document.getElementById('repaymentModal');
    if (!modal) return;
    const dateInput = modal.querySelector('[name="transactionDate"]');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    const loanId = t.dataset.loanRepay || t.dataset.loanId || modal.dataset.loanId;
    const loanIdInput = modal.querySelector('#rp-loanid');
    if (loanId && loanIdInput) loanIdInput.value = loanId;
  });

  const rolesSel = document.getElementById('newuser-roles');
  if (rolesSel) {
    try {
      const roles = await api.roles.list();
      rolesSel.innerHTML = (Array.isArray(roles) ? roles : []).map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
    } catch (e) { console.warn('[roles]', e); }
  }
  document.getElementById('nu-sendemail')?.addEventListener('change', (e) => {
    document.getElementById('nu-pw').disabled = e.target.checked;
    document.getElementById('nu-pw2').disabled = e.target.checked;
  });

  const jeCurrency = document.getElementById('je-currency-sel');
  if (jeCurrency) {
    try {
      const res = await api.currencies.list();
      const list = res?.selectedCurrencyOptions || (Array.isArray(res) ? res : []);
      jeCurrency.innerHTML = list.length
        ? list.map(cur => `<option value="${cur.code}">${cur.code} — ${escapeHtml(cur.name)}</option>`).join('')
        : '<option value="">No currencies configured</option>';
    } catch (e) { console.warn('[currencies]', e); jeCurrency.innerHTML = '<option value="">Failed to load</option>'; }
  }

  const cwCurrencies = document.getElementById('cw-currencies');
  if (cwCurrencies) {
    try {
      const res = await api.currencies.all();
      const all = res?.currencyOptions || [];
      const selectedCodes = new Set((res?.selectedCurrencyOptions || []).map(c => c.code));
      cwCurrencies.innerHTML = all.map(cur => `<option value="${cur.code}" ${selectedCodes.has(cur.code) ? 'selected' : ''}>${cur.code} — ${escapeHtml(cur.name)}</option>`).join('')
        || '<option value="">No currencies available</option>';
    } catch (e) { console.warn('[currencies/all]', e); cwCurrencies.innerHTML = '<option value="">Failed to load</option>'; }
    try {
      const wd = await api.workingDays.get();
      const recurrence = wd?.recurrence || '';
      document.querySelectorAll('#cw-days [data-cw-day]').forEach(cb => {
        const code = { Sun:'SU', Mon:'MO', Tue:'TU', Wed:'WE', Thu:'TH', Fri:'FR', Sat:'SA' }[cb.dataset.cwDay];
        if (recurrence.includes('BYDAY')) cb.checked = recurrence.includes(code);
      });
    } catch (e) { console.warn('[workingdays]', e); }
  }
});

function addJERow(tbodyId, optHtml) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><select class="form-control" data-je-account>${optHtml}</select></td>
    <td><input type="number" min="0" step="0.01" class="form-control" data-je-amount/></td>
    <td><button type="button" class="btn-ghost btn-sm" data-remove-row><i class="fa-solid fa-trash"></i></button></td>`;
  tbody.appendChild(tr);
}

function wireClientSearch(inputId, hiddenId, resultsId) {
  const input   = document.getElementById(inputId);
  const hidden  = document.getElementById(hiddenId);
  const results = document.getElementById(resultsId);
  if (!input || !hidden || !results) return;

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { results.style.display = 'none'; return; }
    timer = setTimeout(async () => {
      try {
        const res = await api.clients.list({ displayName: q, limit: 8 });
        const list = Array.isArray(res) ? res : (res?.pageItems || []);
        if (!list.length) { results.style.display = 'none'; return; }
        results.innerHTML = list.map(cl => `
          <div class="search-result-item" data-id="${cl.id}" data-name="${escapeHtml(cl.displayName)}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border-1)">
            <b>${escapeHtml(cl.displayName)}</b>
            <span class="text-muted" style="font-size:12px"> · ${escapeHtml(cl.accountNo || '')}</span>
          </div>`).join('');
        results.style.display = '';
        results.querySelectorAll('[data-id]').forEach(item => {
          item.addEventListener('click', () => {
            hidden.value = item.dataset.id;
            input.value  = item.dataset.name;
            results.style.display = 'none';
          });
        });
      } catch { results.style.display = 'none'; }
    }, 350);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) results.style.display = 'none';
  });
}
