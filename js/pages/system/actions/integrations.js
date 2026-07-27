import { api } from '../../../api.js';
import { toast } from '../../../ui.js';
import { escapeHtml } from '../../../utils.js';

import { extractFineractError } from '../../../ui/dom-helpers.js';
/**
 * Canonical external-service field schemas, aligned to the Fineract reference
 * edit-{sms,email,amazon-s3,notification} forms. Field `name`s match the
 * Fineract property keys so the update payload maps 1:1.
 */
const SERVICE_SCHEMAS = {
  sms: [
    { name: 'host_name',      label: 'Host name' },
    { name: 'port_number',    label: 'Port', type: 'number' },
    { name: 'end_point',      label: 'End point' },
    { name: 'tenant_app_key', label: 'Tenant app key', secret: true }
  ],
  email: [
    { name: 'username',  label: 'Username' },
    { name: 'password',  label: 'Password', secret: true },
    { name: 'host',      label: 'Host' },
    { name: 'port',      label: 'Port', type: 'number' },
    { name: 'useTLS',    label: 'Use TLS', type: 'checkbox' },
    { name: 'fromEmail', label: 'From email', type: 'email' },
    { name: 'fromName',  label: 'From name' }
  ],
  s3: [
    { name: 's3_bucket_name', label: 'Bucket name' },
    { name: 's3_access_key',  label: 'Access key', secret: true },
    { name: 's3_secret_key',  label: 'Secret key', secret: true }
  ],
  notification: [
    { name: 'server_key',    label: 'Server key', secret: true },
    { name: 'gcm_end_point', label: 'GCM endpoint' },
    { name: 'fcm_end_point', label: 'FCM endpoint' }
  ]
};
SERVICE_SCHEMAS.smtpEmail = SERVICE_SCHEMAS.email;

export function viewServiceConfig(group, label) {
  const schema = SERVICE_SCHEMAS[group] || [];
  const mid = 'svc-' + Date.now();
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-md">
        <div class="modal-header"><h3>${escapeHtml(label)} Configuration</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body" id="svc-cfg-body">
          <div class="empty-state-row">Loading…</div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="${mid}-save" style="display:none"><i class="fa-solid fa-check"></i> Save Configuration</button>
        </div>
      </div>
    </div>`);

  const m = document.getElementById(mid);
  m.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => m.remove()));

  api.externalServices[group].list()
    .then(cfg => {
      const props = cfg?.properties || (Array.isArray(cfg) ? cfg : []);
      const current = {};
      (Array.isArray(props) ? props : []).forEach(p => {
        const k = p.name || p.key;
        if (k) current[k] = p.value;
      });

      const body = m.querySelector('#svc-cfg-body');
      const fields = schema.length
        ? schema
        // fall back to whatever properties the server returned if we have no schema
        : Object.keys(current).map(k => ({ name: k, label: k, secret: /pass|secret|key|token/i.test(k) }));

      body.innerHTML = `
        <div class="text-muted small mb-3">
          <i class="fa-solid fa-circle-info"></i>
          Update the ${escapeHtml(label)} connection settings. Secret fields are write-only —
          leave them blank to keep the existing value.
        </div>
        <form class="form-grid" id="svc-form">
          ${fields.map(f => {
            const val = current[f.name];
            if (f.type === 'checkbox') {
              return `<label class="full form-check" style="align-items:center">
                <input type="checkbox" name="${f.name}" ${String(val) === 'true' || val === true ? 'checked' : ''}/>
                <span>${escapeHtml(f.label)}</span></label>`;
            }
            const type = f.secret ? 'password' : (f.type || 'text');
            const placeholder = f.secret && (val !== undefined && val !== null && val !== '')
              ? 'placeholder="•••••••• (unchanged)"' : '';
            const value = f.secret ? '' : `value="${escapeHtml(val != null ? String(val) : '')}"`;
            return `<label><span class="form-label">${escapeHtml(f.label)}</span>
              <input type="${type}" name="${f.name}" class="form-control" ${value} ${placeholder} autocomplete="off"/></label>`;
          }).join('')}
        </form>`;

      const saveBtn = m.querySelector('#' + mid + '-save');
      saveBtn.style.display = '';
      saveBtn.addEventListener('click', async () => {
        const form = m.querySelector('#svc-form');
        const payload = {};
        fields.forEach(f => {
          const input = form.querySelector(`[name="${f.name}"]`);
          if (!input) return;
          if (f.type === 'checkbox') { payload[f.name] = input.checked; return; }
          const v = input.value.trim();
          // skip empty secret fields so we don't overwrite stored secrets
          if (f.secret && v === '') return;
          if (v !== '') payload[f.name] = f.type === 'number' ? Number(v) : v;
        });
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving…';
        try {
          await api.externalServices[group].update(payload);
          m.remove();
          toast('success', `${label} updated`, 'Configuration saved');
        } catch (e) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Configuration';
          toast('error', 'Update failed', extractFineractError(e));
        }
      });
    })
    .catch(e => {
      m.querySelector('#svc-cfg-body').innerHTML =
        `<div class="empty-state-row text-muted">Service not configured: ${escapeHtml(extractFineractError(e))}</div>`;
    });
}

export async function openWebhookModal(hookId, onSuccess) {
  const isEdit = !!hookId;
  let existing = {};
  if (isEdit) {
    try { existing = await api.hooks.get(hookId); }
    catch { toast('error', 'Could not load webhook', ''); return; }
  }

  let tpl = {};
  try { tpl = await api.hooks.template(); } catch {}
  const templateOptions = tpl.templates || [];
  const eventOptions = tpl.groupings || tpl.events || [];

  const cfgVal = (field) => existing.config?.find(c => c.fieldName === field)?.fieldValue || '';
  const existingUrl = cfgVal('Payload URL');
  const existingContentType = cfgVal('Content Type') || 'json';
  const existingPhone = cfgVal('Phone Number');
  const existingSmsProvider = cfgVal('SMS Provider');
  const existingSmsAccount = cfgVal('SMS Provider Account Id');
  const existingSmsToken = cfgVal('SMS Provider Token');
  const existingEvents = (existing.events || [])
    .map(e => (e.actionName || '') + ':' + (e.entityName || ''))
    .join('\n');

  const mid = 'hook-modal-' + Date.now();
  document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-lg">
        <div class="modal-header"><h3>${isEdit ? 'Edit' : 'New'} Webhook</h3><button data-close-modal>&times;</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <label>Name *
              <input id="hk-name" class="form-control" value="${escapeHtml(existing.name || '')}" required/>
            </label>
            <label>Display name
              <input id="hk-display" class="form-control" value="${escapeHtml(existing.displayName || '')}"/>
            </label>
            <label class="full">Payload URL *
              <input id="hk-url" class="form-control" value="${escapeHtml(existingUrl)}" placeholder="https://example.com/webhook" required/>
            </label>
            <label>Content type
              <select id="hk-content-type" class="form-control">
                <option value="json" ${existingContentType === 'json' ? 'selected' : ''}>application/json</option>
                <option value="form" ${existingContentType === 'form' ? 'selected' : ''}>application/x-www-form-urlencoded</option>
              </select>
            </label>
            <label>Template
              <select id="hk-template" class="form-control">
                <option value="">— None —</option>
                ${templateOptions.map(t => {
                  const selected = existing.templateId === t.id ? 'selected' : '';
                  return `<option value="${t.id}" ${selected}>${escapeHtml(t.name || t.value || '—')}</option>`;
                }).join('')}
              </select>
            </label>
            <label>Active
              <select id="hk-active" class="form-control">
                <option value="true" ${existing.isActive ? 'selected' : ''}>Yes</option>
                <option value="false" ${!existing.isActive ? 'selected' : ''}>No</option>
              </select>
            </label>
          </div>

          <details class="mt-3" ${(existingPhone || existingSmsProvider) ? 'open' : ''}>
            <summary class="form-label" style="cursor:pointer">SMS bridge settings (optional)</summary>
            <div class="text-muted small mb-2 mt-1">
              <i class="fa-solid fa-circle-info"></i>
              Only required when the payload URL targets an SMS gateway/bridge.
            </div>
            <div class="form-grid">
              <label>Phone number
                <input id="hk-phone" class="form-control" value="${escapeHtml(existingPhone)}" placeholder="+27 ..."/>
              </label>
              <label>SMS provider
                <input id="hk-sms-provider" class="form-control" value="${escapeHtml(existingSmsProvider)}" placeholder="e.g. Twilio"/>
              </label>
              <label>SMS provider account ID
                <input id="hk-sms-account" class="form-control" value="${escapeHtml(existingSmsAccount)}" autocomplete="off"/>
              </label>
              <label>SMS provider token
                <input id="hk-sms-token" type="password" class="form-control" placeholder="${existingSmsToken ? '•••••••• (unchanged)' : ''}" autocomplete="off"/>
              </label>
            </div>
          </details>

          <h4 class="mt-3">Events</h4>
          <div class="text-muted small mb-2">
            <i class="fa-solid fa-circle-info"></i>
            One event per line in format <code>actionName:entityName</code>
            (e.g. <code>CREATE:CLIENT</code> or <code>DISBURSE:LOAN</code>).
          </div>
          <textarea id="hk-events" class="form-control" rows="6" placeholder="CREATE:CLIENT&#10;APPROVE:LOAN&#10;DISBURSE:LOAN">${escapeHtml(existingEvents)}</textarea>

          ${eventOptions.length ? `
            <div class="text-muted small mt-2">
              <b>Available events (from template):</b>
              ${eventOptions.slice(0, 20).map(e => {
                const evtStr = (e.actionName || '') + ':' + (e.entityName || '');
                return `<code style="margin-right:6px">${escapeHtml(evtStr)}</code>`;
              }).join('')}
              ${eventOptions.length > 20 ? `<span>… and ${eventOptions.length - 20} more</span>` : ''}
            </div>` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="hk-save">${isEdit ? 'Update' : 'Create'}</button>
        </div>
      </div>
    </div>`);

  const m = document.getElementById(mid);
  m.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => m.remove()));

  m.querySelector('#hk-save').addEventListener('click', async () => {
    const name = m.querySelector('#hk-name').value.trim();
    const displayName = m.querySelector('#hk-display').value.trim();
    const url = m.querySelector('#hk-url').value.trim();
    const contentType = m.querySelector('#hk-content-type').value;
    const templateId = m.querySelector('#hk-template').value.trim();
    const isActive = m.querySelector('#hk-active').value === 'true';
    const eventsRaw = m.querySelector('#hk-events').value.trim();
    const phone = m.querySelector('#hk-phone').value.trim();
    const smsProvider = m.querySelector('#hk-sms-provider').value.trim();
    const smsAccount = m.querySelector('#hk-sms-account').value.trim();
    const smsToken = m.querySelector('#hk-sms-token').value.trim();

    if (!name || !url) { toast('warn', 'Fill required fields', ''); return; }

    const events = eventsRaw ? eventsRaw.split('\n').filter(Boolean).map(ev => {
      const parts = ev.split(':');
      return { actionName: parts[0]?.trim(), entityName: parts[1]?.trim() };
    }) : [];

    const config = [
      { fieldName: 'Payload URL', fieldValue: url },
      { fieldName: 'Content Type', fieldValue: contentType }
    ];
    if (phone)       config.push({ fieldName: 'Phone Number', fieldValue: phone });
    if (smsProvider) config.push({ fieldName: 'SMS Provider', fieldValue: smsProvider });
    if (smsAccount)  config.push({ fieldName: 'SMS Provider Account Id', fieldValue: smsAccount });
    // keep stored token if the field was left blank on edit
    if (smsToken)         config.push({ fieldName: 'SMS Provider Token', fieldValue: smsToken });
    else if (existingSmsToken) config.push({ fieldName: 'SMS Provider Token', fieldValue: existingSmsToken });

    const payload = {};
    payload.name = name;
    payload.isActive = isActive;
    payload.events = events;
    payload.config = config;
    if (displayName) payload.displayName = displayName;
    if (templateId) payload.templateId = parseInt(templateId);

    try {
      if (isEdit) await api.hooks.update(hookId, payload);
      else        await api.hooks.create(payload);
      m.remove();
      toast('success', isEdit ? 'Webhook updated' : 'Webhook created', name);
      onSuccess?.();
    } catch (e) {
      toast('error', isEdit ? 'Update failed' : 'Create failed', extractFineractError(e));
    }
  });
}
