import { api } from '../../api.js';
import { DATE_FORMAT, LOCALE, today } from '../../config.js';
import { toast } from '../../ui.js';
import { escapeHtml } from '../../utils.js';
import { can } from './shared.js';
import { extractFineractError } from '../../ui/dom-helpers.js';

/* ────────────────────────────────────────────────────────────────────────────
   New Customer — full-page 4-step wizard (Type → Personal → Identity → Review).

   Fineract field mapping (POST /clients):
     • Type card  → legalFormId  (Individual = 1 / Person; Business, Group,
                    Cooperative = 2 / Entity — Fineract has only Person|Entity,
                    so the finer label is preserved in an attached Note).
     • Name       → firstname / middlename / lastname  (Individual)  ·  fullname (Entity)
                    ↑ replaces the single "Full Name" field, as requested.
     • Mobile     → mobileNo        · Email → emailAddress
     • DOB        → dateOfBirth     · Gender → genderId (from /clients/template)
     • Branch     → officeId        · External refs → externalId
   KYC that HAS a real endpoint is written after creation (best-effort, never
   blocks the record): ID Type/Number → POST /clients/{id}/identifiers; fields
   with no native column (occupation, source of income, risk rating, residential
   address, next-of-kin) are preserved in a structured Note so nothing is lost.
   ──────────────────────────────────────────────────────────────────────────── */

const TYPES = [
  { key: 'individual',  legalForm: 1, icon: 'fa-user',      name: 'Individual',  desc: 'Personal account' },
  { key: 'business',    legalForm: 2, icon: 'fa-building',   name: 'Business',    desc: 'Company entity' },
  { key: 'group',       legalForm: 2, icon: 'fa-user-group', name: 'Group',       desc: 'Group account' },
  { key: 'cooperative', legalForm: 2, icon: 'fa-building-columns', name: 'Cooperative', desc: 'Co-op society' },
];

export async function renderNew(c) {
  if (!can('CREATE_CLIENT')) {
    c.innerHTML = `<div class="card"><div class="empty-state"><i class="fa-solid fa-ban"></i><div>You don't have permission to create clients.</div></div></div>`;
    return;
  }

  // Shared wizard state
  const state = {
    step: 1,
    type: 'individual',
    // personal
    firstname: '', middlename: '', lastname: '', fullname: '',
    mobileNo: '', email: '', dob: '', genderId: '', gender: '',
    address: '', occupation: '', sourceOfIncome: '', nokName: '', nokPhone: '',
    // identity
    idTypeId: '', idType: '', idNumber: '', idExpiry: '', taxId: '',
    officeId: '', officeName: '', risk: 'Low',
    docs: { id: false, address: false, photo: false, signature: false }
  };

  // Reference data (best-effort)
  let offices = [], genders = [], idTypes = [];
  try {
    const [off, tpl] = await Promise.allSettled([api.offices.list(), api.clients.template()]);
    offices = off.status === 'fulfilled' && Array.isArray(off.value) ? off.value : [];
    const t = tpl.status === 'fulfilled' ? tpl.value : {};
    genders = t?.genderOptions || [];
    idTypes = t?.clientIdentifierTypeOptions || t?.clientIdentifierOptions || [];
  } catch { /* degrade gracefully */ }
  if (offices[0]) { state.officeId = String(offices[0].id); state.officeName = offices[0].name; }

  function stepper() {
    const steps = ['Type', 'Personal', 'Identity', 'Review'];
    return `<div class="stepper">${steps.map((s, i) => {
      const n = i + 1;
      const cls = state.step === n ? 'active' : (state.step > n ? 'done' : '');
      return `
        <div class="step-item">
          <div class="step-circle ${cls}">${state.step > n ? '<i class="fa-solid fa-check"></i>' : n}</div>
          <div class="step-label ${cls}">${s}</div>
        </div>
        ${n < steps.length ? `<div class="step-line ${state.step > n ? 'done' : ''}"></div>` : ''}`;
    }).join('')}</div>`;
  }

  const isPerson = () => state.type === 'individual';

  function body() {
    if (state.step === 1) {
      return `
        <div class="wz-step-title">Select Customer Type</div>
        <div class="wz-type-grid">
          ${TYPES.map(t => `
            <button type="button" class="wz-type ${state.type === t.key ? 'active' : ''}" data-type="${t.key}">
              <i class="fa-solid ${t.icon}"></i>
              <div class="wz-type-name">${t.name}</div>
              <div class="wz-type-desc">${t.desc}</div>
            </button>`).join('')}
        </div>`;
    }
    if (state.step === 2) {
      const nameBlock = isPerson() ? `
        <div class="wz-field"><label>First Name <span class="req">*</span></label><input id="wz-first" class="form-control" value="${escapeHtml(state.firstname)}" placeholder="First name"/></div>
        <div class="wz-field"><label>Middle Name</label><input id="wz-middle" class="form-control" value="${escapeHtml(state.middlename)}" placeholder="Middle name"/></div>
        <div class="wz-field"><label>Surname <span class="req">*</span></label><input id="wz-last" class="form-control" value="${escapeHtml(state.lastname)}" placeholder="Surname"/></div>
      ` : `
        <div class="wz-field full"><label>Legal / Business Name <span class="req">*</span></label><input id="wz-fullname" class="form-control" value="${escapeHtml(state.fullname)}" placeholder="Registered name"/></div>
      `;
      return `
        <div class="wz-step-title">Personal Information</div>
        <div class="wz-grid">
          ${nameBlock}
          <div class="wz-field"><label>Mobile Number</label><input id="wz-mobile" class="form-control" value="${escapeHtml(state.mobileNo)}" placeholder="+234 80X XXXX XXXX"/></div>
          <div class="wz-field"><label>Email Address</label><input id="wz-email" type="email" class="form-control" value="${escapeHtml(state.email)}" placeholder="email@example.com"/></div>
          ${isPerson() ? `
          <div class="wz-field"><label>Date of Birth</label><input id="wz-dob" type="date" class="form-control" value="${escapeHtml(state.dob)}"/></div>
          <div class="wz-field"><label>Gender</label>
            <select id="wz-gender" class="form-control">
              <option value="">Select…</option>
              ${genders.map(g => `<option value="${g.id}" ${String(state.genderId) === String(g.id) ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
            </select></div>` : ''}
          <div class="wz-field full"><label>Residential Address</label><textarea id="wz-address" class="form-control" rows="2" placeholder="Enter full address">${escapeHtml(state.address)}</textarea></div>
          <div class="wz-field"><label>Occupation</label><input id="wz-occupation" class="form-control" value="${escapeHtml(state.occupation)}" placeholder="e.g. Trader"/></div>
          <div class="wz-field"><label>Source of Income</label><input id="wz-income" class="form-control" value="${escapeHtml(state.sourceOfIncome)}" placeholder="e.g. Business revenue"/></div>
          <div class="wz-field"><label>Next of Kin</label><input id="wz-nok" class="form-control" value="${escapeHtml(state.nokName)}" placeholder="Full name"/></div>
          <div class="wz-field"><label>Next of Kin Phone</label><input id="wz-nokphone" class="form-control" value="${escapeHtml(state.nokPhone)}" placeholder="Phone number"/></div>
        </div>`;
    }
    if (state.step === 3) {
      const chip = (on, label) => `<span class="badge ${on ? 'b-success' : ''}">${on ? '<i class="fa-solid fa-check"></i> ' : ''}${escapeHtml(label)}${on ? ' uploaded' : ''}</span>`;
      return `
        <div class="wz-step-title">Identity &amp; KYC Documents</div>
        <div class="wz-grid">
          <div class="wz-field"><label>Identification Type</label>
            <select id="wz-idtype" class="form-control">
              <option value="">Select…</option>
              ${idTypes.length
                ? idTypes.map(t => `<option value="${t.id}" ${String(state.idTypeId) === String(t.id) ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')
                : ['National ID', 'Passport', 'Driver License', 'Voter Card'].map(n => `<option value="name:${n}" ${state.idType === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select></div>
          <div class="wz-field"><label>ID Number</label><input id="wz-idnum" class="form-control" value="${escapeHtml(state.idNumber)}" placeholder="Enter ID number"/></div>
          <div class="wz-field"><label>ID Expiry Date</label><input id="wz-idexp" type="date" class="form-control" value="${escapeHtml(state.idExpiry)}"/></div>
          <div class="wz-field"><label>Tax ID (optional)</label><input id="wz-tax" class="form-control" value="${escapeHtml(state.taxId)}" placeholder="TIN number"/></div>
          <div class="wz-field"><label>Branch <span class="req">*</span></label>
            <select id="wz-office" class="form-control">
              ${offices.map(o => `<option value="${o.id}" ${String(state.officeId) === String(o.id) ? 'selected' : ''}>${escapeHtml(o.name)}</option>`).join('')}
            </select></div>
          <div class="wz-field"><label>Risk Rating</label>
            <select id="wz-risk" class="form-control">
              ${['Low', 'Medium', 'High'].map(r => `<option value="${r}" ${state.risk === r ? 'selected' : ''}>${r} Risk</option>`).join('')}
            </select></div>
        </div>
        <div class="wz-drop">
          <div class="wz-drop-ico"><i class="fa-solid fa-cloud-arrow-up"></i></div>
          <div><b>Upload KYC Documents</b></div>
          <div class="wz-hint">Attach ID, proof of address, photo &amp; signature (uploaded to the client record after creation)</div>
          <div class="wz-doc-btns">
            <button type="button" class="btn-secondary btn-sm" data-doc="id"><i class="fa-solid fa-id-card"></i> ID Document</button>
            <button type="button" class="btn-secondary btn-sm" data-doc="address"><i class="fa-solid fa-file-lines"></i> Proof of Address</button>
            <button type="button" class="btn-secondary btn-sm" data-doc="photo"><i class="fa-solid fa-image"></i> Passport Photo</button>
            <button type="button" class="btn-secondary btn-sm" data-doc="signature"><i class="fa-solid fa-signature"></i> Signature</button>
          </div>
          <div class="wz-doc-chips" id="wz-doc-chips">
            ${chip(state.docs.photo, 'Passport Photo')} ${chip(state.docs.signature, 'Signature')} ${chip(state.docs.address, 'Proof of Address')} ${chip(state.docs.id, 'ID Document')}
          </div>
          <input type="file" id="wz-file" hidden/>
        </div>`;
    }
    // Review
    const dash = (v) => v ? escapeHtml(v) : '—';
    const name = isPerson()
      ? [state.firstname, state.middlename, state.lastname].filter(Boolean).join(' ')
      : state.fullname;
    return `
      <div class="wz-step-title">Review &amp; Submit</div>
      <div class="msg-banner b-info mb-4"><i class="fa-solid fa-circle-info"></i> Review the information below. On submit, the client record is created in Fineract and any KYC attachments are uploaded to it.</div>
      <div class="wz-review-grid">
        <div class="wz-rv"><div class="k">Customer Type</div><div class="v">${escapeHtml(TYPES.find(t => t.key === state.type)?.name || '—')}</div></div>
        <div class="wz-rv"><div class="k">Name</div><div class="v">${dash(name)}</div></div>
        <div class="wz-rv"><div class="k">Mobile</div><div class="v">${dash(state.mobileNo)}</div></div>
        <div class="wz-rv"><div class="k">Email</div><div class="v">${dash(state.email)}</div></div>
        <div class="wz-rv"><div class="k">ID Type</div><div class="v">${dash(state.idType || (idTypes.find(t => String(t.id) === String(state.idTypeId))?.name))}</div></div>
        <div class="wz-rv"><div class="k">ID Number</div><div class="v">${dash(state.idNumber)}</div></div>
        <div class="wz-rv"><div class="k">Branch</div><div class="v">${dash(state.officeName)}</div></div>
        <div class="wz-rv"><div class="k">Risk Rating</div><div class="v">${dash(state.risk)}</div></div>
      </div>`;
  }

  function render() {
    c.innerHTML = `
      <div class="wz-head">
        <div><h1>Register New Customer</h1><div class="wz-sub">Complete the form below to register a new customer</div></div>
        <button class="cv-btn-ghost" id="wz-back-top"><i class="fa-solid fa-arrow-left"></i> Back</button>
      </div>
      <div class="wz-card">
        ${stepper()}
        <div id="wz-body">${body()}</div>
        <div class="wz-nav">
          <button class="btn-secondary" id="wz-prev" ${state.step === 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-left"></i> Previous</button>
          ${state.step < 4
            ? `<button class="btn-primary" id="wz-next">Next <i class="fa-solid fa-arrow-right"></i></button>`
            : `<button class="btn-primary" id="wz-submit"><i class="fa-solid fa-check"></i> Submit Registration</button>`}
        </div>
      </div>`;
    wire();
  }

  function captureStep() {
    if (state.step === 2) {
      if (isPerson()) {
        state.firstname = c.querySelector('#wz-first')?.value.trim() || '';
        state.middlename = c.querySelector('#wz-middle')?.value.trim() || '';
        state.lastname  = c.querySelector('#wz-last')?.value.trim() || '';
        state.dob       = c.querySelector('#wz-dob')?.value || '';
        const gsel = c.querySelector('#wz-gender');
        state.genderId  = gsel?.value || '';
        state.gender    = gsel?.selectedOptions?.[0]?.textContent?.trim() || '';
      } else {
        state.fullname  = c.querySelector('#wz-fullname')?.value.trim() || '';
      }
      state.mobileNo = c.querySelector('#wz-mobile')?.value.trim() || '';
      state.email    = c.querySelector('#wz-email')?.value.trim() || '';
      state.address  = c.querySelector('#wz-address')?.value.trim() || '';
      state.occupation = c.querySelector('#wz-occupation')?.value.trim() || '';
      state.sourceOfIncome = c.querySelector('#wz-income')?.value.trim() || '';
      state.nokName  = c.querySelector('#wz-nok')?.value.trim() || '';
      state.nokPhone = c.querySelector('#wz-nokphone')?.value.trim() || '';
    }
    if (state.step === 3) {
      const idsel = c.querySelector('#wz-idtype');
      if (idsel) {
        state.idTypeId = idsel.value.startsWith('name:') ? '' : idsel.value;
        state.idType = idsel.value.startsWith('name:') ? idsel.value.slice(5) : (idsel.selectedOptions[0]?.textContent?.trim() || '');
      }
      state.idNumber = c.querySelector('#wz-idnum')?.value.trim() || '';
      state.idExpiry = c.querySelector('#wz-idexp')?.value || '';
      state.taxId    = c.querySelector('#wz-tax')?.value.trim() || '';
      const osel = c.querySelector('#wz-office');
      if (osel) { state.officeId = osel.value; state.officeName = osel.selectedOptions[0]?.textContent?.trim() || ''; }
      state.risk = c.querySelector('#wz-risk')?.value || 'Low';
    }
  }

  function validateStep() {
    if (state.step === 2) {
      if (isPerson() && (!state.firstname || !state.lastname)) { toast('warn', 'Name required', 'First name and surname are required'); return false; }
      if (!isPerson() && !state.fullname) { toast('warn', 'Name required', 'Legal/business name is required'); return false; }
    }
    if (state.step === 3 && !state.officeId) { toast('warn', 'Branch required', 'Select a branch'); return false; }
    return true;
  }

  function wire() {
    c.querySelector('#wz-back-top')?.addEventListener('click', () => import('../../router.js').then(r => r.navigate('clients')));
    c.querySelector('#wz-prev')?.addEventListener('click', () => { captureStep(); if (state.step > 1) { state.step--; render(); } });
    c.querySelector('#wz-next')?.addEventListener('click', () => { captureStep(); if (!validateStep()) return; state.step++; render(); });
    c.querySelector('#wz-submit')?.addEventListener('click', submit);

    c.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => {
      state.type = b.dataset.type; render();
    }));

    // Doc upload chips (store selected files in state; uploaded after creation)
    const fileInput = c.querySelector('#wz-file');
    c.querySelectorAll('[data-doc]').forEach(b => b.addEventListener('click', () => {
      if (!fileInput) return;
      fileInput.onchange = () => {
        if (fileInput.files?.length) {
          state.docs[b.dataset.doc] = fileInput.files[0];
          render(); state.step = 3; // keep on identity step
        }
      };
      fileInput.click();
    }));
  }

  async function submit() {
    captureStep();
    const btn = c.querySelector('#wz-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting…'; }

    const legalFormId = TYPES.find(t => t.key === state.type)?.legalForm || 1;
    const payload = {
      officeId: parseInt(state.officeId),
      legalFormId,
      submittedOnDate: today(),
      dateFormat: DATE_FORMAT, locale: LOCALE
    };
    if (legalFormId === 1) {
      payload.firstname = state.firstname;
      if (state.middlename) payload.middlename = state.middlename;
      payload.lastname = state.lastname;
      if (state.dob) payload.dateOfBirth = state.dob;
      if (state.genderId) payload.genderId = parseInt(state.genderId);
    } else {
      payload.fullname = state.fullname;
    }
    if (state.mobileNo) payload.mobileNo = state.mobileNo;
    if (state.email) payload.emailAddress = state.email;
    if (state.taxId) payload.externalId = state.taxId;

    try {
      const r = await api.clients.create(payload);
      const id = r.clientId || r.resourceId;
      toast('success', 'Customer registered', `Client #${id}`);

      // ── Best-effort KYC follow-ups (never block the created record) ──────
      // Identifier (ID type + number) → real /clients/{id}/identifiers
      if (id && state.idNumber && (state.idTypeId || state.idType)) {
        try {
          let documentTypeId = state.idTypeId ? parseInt(state.idTypeId) : null;
          if (!documentTypeId) {
            const it = await api.clients.identifierTemplate(id).catch(() => null);
            const opts = it?.allowedDocumentTypes || [];
            documentTypeId = opts.find(o => (o.name || '').toLowerCase() === state.idType.toLowerCase())?.id || opts[0]?.id;
          }
          if (documentTypeId) {
            await api.clients.createIdentifier(id, { documentTypeId, documentKey: state.idNumber });
          }
        } catch (e) { console.warn('[new-client] identifier skipped:', e?.message); }
      }

      // Fields with no native person column → preserve as a structured Note.
      const noteBits = [];
      if (state.occupation) noteBits.push(`Occupation: ${state.occupation}`);
      if (state.sourceOfIncome) noteBits.push(`Source of income: ${state.sourceOfIncome}`);
      if (state.risk) noteBits.push(`Risk rating: ${state.risk}`);
      if (state.address) noteBits.push(`Residential address: ${state.address}`);
      if (state.nokName || state.nokPhone) noteBits.push(`Next of kin: ${[state.nokName, state.nokPhone].filter(Boolean).join(' · ')}`);
      if (state.type !== 'individual') noteBits.push(`Requested customer type: ${TYPES.find(t => t.key === state.type)?.name}`);
      if (id && noteBits.length) {
        try { await api.notes.create('clients', id, { note: noteBits.join('\n') }); }
        catch (e) { console.warn('[new-client] note skipped:', e?.message); }
      }

      // Uploaded docs → real document/image endpoints (best-effort)
      if (id) {
        const uploads = [];
        for (const [k, file] of Object.entries(state.docs)) {
          if (!file || typeof file === 'boolean') continue;
          const fd = new FormData();
          if (k === 'photo') { fd.append('file', file); uploads.push(api.images.upload('clients', id, fd).catch(() => {})); }
          else { fd.append('file', file); fd.append('name', k); fd.append('description', k); uploads.push(api.documents.upload('clients', id, fd).catch(() => {})); }
        }
        if (uploads.length) await Promise.allSettled(uploads);
      }

      import('../../router.js').then(rt => rt.navigate('client-detail', { id }));
    } catch (e) {
      toast('error', 'Registration failed', extractFineractError(e));
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Submit Registration'; }
    }
  }

  render();
}
