/**
 * attach-templates.mjs — Pipeline step 8: "Attach Fineract Template Endpoints"
 *
 * Fineract exposes `.../template` GET endpoints whose responses carry the
 * dropdown option lists (allowed values) for create/update forms — e.g.
 * /clients/template returns officeOptions, staffOptions, genderIdOptions…
 *
 * This step indexes every template endpoint and the option arrays it returns,
 * then emits js/api/generated/templates.generated.js so the FinCraft UI layer
 * can populate <select> controls straight from the contract instead of
 * hand-maintaining option keys.
 */
import { readJson, writeText, repoPath, generatedBanner, log } from './lib/spec-io.mjs';
import { listOperations, deref, resourceOf } from './lib/openapi.mjs';

/** Extract property names that look like option lists (…Options / …Template). */
function optionFields(doc, schema) {
  schema = deref(doc, schema);
  const out = [];
  for (const [name, sub] of Object.entries((schema && schema.properties) || {})) {
    const d = deref(doc, sub);
    if (d.type === 'array' && (/options$/i.test(name) || /Options$/.test(name))) out.push(name);
  }
  return out;
}

export function attachTemplates() {
  const doc = readJson(repoPath('contracts', 'openapi.normalized.json'));
  const ops = listOperations(doc);
  const templates = {};

  for (const op of ops) {
    if (op.method !== 'get' || !/\/template$/.test(op.path)) continue;
    const resource = resourceOf(op);
    const entry = {
      path: op.path,
      operationId: op.operationId,
      pathParams: op.parameters.filter((p) => p.in === 'path').map((p) => p.name),
      optionFields: op.responseSchema ? optionFields(doc, op.responseSchema) : [],
    };
    (templates[resource] ||= []).push(entry);
  }

  const body = [
    generatedBanner('contracts/openapi.normalized.json'),
    '',
    '/* eslint-disable */',
    '// resource → template endpoints and the *Options arrays they return.',
    'export const TEMPLATE_ENDPOINTS = ' + JSON.stringify(templates, null, 2) + ';',
    '',
    '/** Return the template descriptor(s) for a resource (e.g. "clients"). */',
    'export function templatesFor(resource) { return TEMPLATE_ENDPOINTS[resource] || []; }',
    '',
    '/**',
    ' * Fetch a template and return only its option arrays as a flat map,',
    ' * ready to bind to form <select> controls.',
    ' * @param {object} api  a mounted FineractAPI instance',
    ' */',
    'export async function loadOptions(api, resource, ...pathArgs) {',
    '  const [tpl] = templatesFor(resource);',
    '  if (!tpl) return {};',
    '  const path = tpl.path.replace(/\\{[^}]+\\}/g, () => pathArgs.shift());',
    '  const data = await api.any("GET", path);',
    '  const out = {};',
    '  for (const f of tpl.optionFields) if (Array.isArray(data && data[f])) out[f] = data[f];',
    '  return out;',
    '}',
    '',
  ].join('\n');

  writeText(repoPath('js', 'api', 'generated', 'templates.generated.js'), body);
  const count = Object.values(templates).reduce((n, a) => n + a.length, 0);
  log(`templates — ${count} template endpoints across ${Object.keys(templates).length} resources`);
  return templates;
}

if (import.meta.url === `file://${process.argv[1]}`) attachTemplates();
