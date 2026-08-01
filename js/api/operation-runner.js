/**
 * operation-runner.js — contract-driven executor for generated API operations.
 *
 * Every entry produced by `aliases.generated.js` (surfaced in the ⌘K command
 * palette via js/cmd.js) is executed here. The runner renders a form straight
 * from the operation's contract, then runs the *real* implementation path:
 *
 *     collect input → buildPayload() → assertValid() → api._g/_p/_u/_d(path)
 *
 * No per-operation UI is hand-written: the contract is the source of truth, so
 * new operations picked up by `npm run api:all` become runnable automatically.
 */
import { api } from './index.js';
import { CONTRACTS } from './generated/contracts.generated.js';
import { buildPayload } from './generated/builders.generated.js';
import { assertValid } from './generated/validators.generated.js';
import { toast } from '../ui.js';
import { escapeHtml } from '../utils.js';

const VERB = {
  GET: (p, body, params) => api._g(p, params),
  POST: (p, body) => api._p(p, body),
  PUT: (p, body) => api._u(p, body),
  DELETE: (p, body) => api._d(p, body),
};

function fieldInput(name, spec) {
  const req = spec.required ? ' required' : '';
  const star = spec.required ? ' <span style="color:var(--danger,#e5484d)">*</span>' : '';
  const label = `<label class="form-label" for="op-${name}">${escapeHtml(name)}${star}</label>`;
  if (Array.isArray(spec.enum)) {
    const opts = spec.enum
      .map((v) => `<option value="${escapeHtml(String(v))}">${escapeHtml(String(v))}</option>`)
      .join('');
    return `<div class="form-group">${label}
      <select class="form-control" id="op-${name}" data-field="${escapeHtml(name)}" data-type="${spec.type}"${req}>
        <option value="">— select —</option>${opts}
      </select></div>`;
  }
  const type =
    spec.format === 'date'
      ? 'date'
      : spec.type === 'integer' || spec.type === 'number'
        ? 'number'
        : spec.type === 'boolean'
          ? 'checkbox'
          : 'text';
  if (type === 'checkbox') {
    return `<div class="form-group form-check">
      <input type="checkbox" id="op-${name}" data-field="${escapeHtml(name)}" data-type="boolean"/>
      ${label}</div>`;
  }
  const step = spec.type === 'number' ? ' step="any"' : '';
  return `<div class="form-group">${label}
    <input type="${type}" class="form-control" id="op-${name}" data-field="${escapeHtml(name)}" data-type="${spec.type || 'string'}"${step}${req}/>
  </div>`;
}

function coerce(raw, type) {
  if (raw === '' || raw == null) return undefined;
  if (type === 'integer') return parseInt(raw, 10);
  if (type === 'number') return Number(raw);
  if (type === 'boolean') return Boolean(raw);
  return raw;
}

function collect(root) {
  const out = {};
  root.querySelectorAll('[data-field]').forEach((el) => {
    const name = el.dataset.field;
    const type = el.dataset.type;
    const raw = el.type === 'checkbox' ? el.checked : el.value;
    const val = coerce(raw, type);
    if (val !== undefined) out[name] = val;
  });
  return out;
}

/** Build a runnable ⌘K handler for one generated alias. */
export function runOperation(alias) {
  return () => openOperationModal(alias.operationId);
}

export function openOperationModal(operationId) {
  const c = CONTRACTS[operationId];
  if (!c) {
    toast('error', 'Unknown operation', operationId);
    return;
  }
  const mid = `op-modal-${operationId}`;
  document.getElementById(mid)?.remove();

  const pathFields = (c.pathParams || [])
    .map((p) => fieldInput(p, { type: 'string', required: true }))
    .join('');
  const queryFields = (c.query || [])
    .map((q) => fieldInput(typeof q === 'string' ? q : q.name, { type: 'string' }))
    .join('');
  const bodyFields = Object.entries(c.request?.fields || {})
    .map(([name, spec]) => fieldInput(name, spec))
    .join('');

  const sections = [
    pathFields && `<div class="form-section-title">Path</div>${pathFields}`,
    queryFields && `<div class="form-section-title">Query</div>${queryFields}`,
    bodyFields && `<div class="form-section-title">Body</div>${bodyFields}`,
  ]
    .filter(Boolean)
    .join('');

  const badge = `<span class="badge">${c.method}</span> <code>${escapeHtml(c.path)}</code>`;
  const html = `
    <div class="modal-overlay open" role="dialog" aria-modal="true" id="${mid}">
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>${escapeHtml(c.summary || operationId)}</h3>
          <button data-close-modal>&times;</button>
        </div>
        <div class="modal-body">
          <div class="text-muted" style="margin-bottom:12px">${badge}</div>
          <form id="${mid}-form">${sections || '<div class="text-muted">No inputs required.</div>'}</form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-close-modal>Cancel</button>
          <button class="btn-primary" id="${mid}-run"><i class="fa-solid fa-play"></i> Run</button>
        </div>
      </div>
    </div>`;

  const root = document.getElementById('modalRoot') || document.body;
  root.insertAdjacentHTML('beforeend', html);
  const el = document.getElementById(mid);
  el.querySelectorAll('[data-close-modal]').forEach((b) => b.addEventListener('click', () => el.remove()));

  el.querySelector(`#${mid}-run`).addEventListener('click', async () => {
    const form = el.querySelector(`#${mid}-form`);
    const runBtn = el.querySelector(`#${mid}-run`);
    try {
      const input = collect(form);

      // Split path params out of the collected inputs and substitute into the path.
      let path = c.path;
      const params = {};
      for (const p of c.pathParams || []) {
        if (input[p] == null || input[p] === '') throw new Error(`Missing path parameter: ${p}`);
        path = path.replace(`{${p}}`, encodeURIComponent(input[p]));
        delete input[p];
      }
      for (const q of c.query || []) {
        const name = typeof q === 'string' ? q : q.name;
        if (input[name] != null) {
          params[name] = input[name];
          delete input[name];
        }
      }

      const body = buildPayload(operationId, input);
      if (c.method !== 'GET') assertValid(operationId, body);

      runBtn.disabled = true;
      runBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Running…';

      const res = await (VERB[c.method] || VERB.GET)(path, body, params);
      toast('success', `${c.summary || operationId} ✓`, `${c.method} ${path}`);
      el.remove();
      return res;
    } catch (e) {
      runBtn.disabled = false;
      runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run';
      toast('error', 'Operation failed', e.message || String(e));
    }
  });

  return el;
}
