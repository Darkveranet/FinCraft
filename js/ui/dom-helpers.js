export function formData(formId) {
  const form = document.getElementById(formId);
  if (!form) return {};
  const fd = new FormData(form);
  const obj = {};
  fd.forEach((v, k) => {
    if (obj[k] !== undefined) {
      if (Array.isArray(obj[k])) obj[k].push(v);
      else obj[k] = [obj[k], v];
    } else {
      obj[k] = v;
    }
  });
  return obj;
}

export function setSubmitting(btn, loading = true) {
  if (!btn) return;
  btn._origHtml = btn._origHtml || btn.innerHTML;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing…'
    : btn._origHtml;
}

export function extractFineractError(e) {
  if (!e) return 'Unknown error';
  const d = e.detail;

  if (d && typeof d === 'object') {
    const list = Array.isArray(d.errors) ? d.errors.filter(Boolean) : [];
    if (list.length) {
      const lines = list.map(err => {
        const msg = err.defaultUserMessage || err.developerMessage || '';
        const param = err.parameterName;
        return (param && msg && !msg.toLowerCase().startsWith(param.toLowerCase()))
          ? `${param}: ${msg}`
          : (msg || param || '');
      }).filter(Boolean);
      const unique = [...new Set(lines)];
      if (unique.length) return unique.join('\n');
    }
    if (d.defaultUserMessage) return d.defaultUserMessage;
    if (d.developerMessage) return d.developerMessage;
  }
  if (typeof d === 'string' && d.trim()) return d;
  return e.message || 'API error';
}

export function collectJournalRows(selector) {
  const rows = [];
  document.querySelectorAll(`${selector} tr`).forEach(row => {
    const acct = row.querySelector('[data-je-account]')?.value;
    const amt  = parseFloat(row.querySelector('[data-je-amount]')?.value);
    if (acct && !isNaN(amt) && amt > 0) {
      rows.push({ glAccountId: parseInt(acct), amount: amt });
    }
  });
  return rows;
}
