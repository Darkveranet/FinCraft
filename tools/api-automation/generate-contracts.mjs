/**
 * generate-contracts.mjs — Pipeline step 6: "Generate Payload Contracts"
 *
 * Emits two artefacts from the normalised spec:
 *   • js/api/generated/contracts.generated.js — a machine-readable CONTRACTS map
 *     (operationId → { method, path, pathParams, query, request, response }) plus
 *     JSDoc @typedef blocks so editors get request/response IntelliSense.
 *
 * The CONTRACTS map is the single source consumed by the validator and builder
 * generators, and by the FinCraft UI layer to power generated forms.
 */
import { readJson, writeText, repoPath, generatedBanner, log } from './lib/spec-io.mjs';
import { listOperations, deref, camel } from './lib/openapi.mjs';

/** Reduce an OpenAPI schema to a compact field descriptor used across FinCraft. */
function fields(doc, schema, depth = 0) {
  schema = deref(doc, schema);
  if (!schema || depth > 4) return { type: 'any' };
  if (schema.$ref) return fields(doc, schema, depth + 1);
  if (schema.type === 'array') return { type: 'array', items: fields(doc, schema.items, depth + 1) };
  if (schema.properties || schema.type === 'object') {
    const required = new Set(schema.required || []);
    const props = {};
    for (const [name, sub] of Object.entries(schema.properties || {})) {
      const d = deref(doc, sub);
      props[name] = {
        type: d.type || (d.$ref ? 'object' : 'any'),
        required: required.has(name),
        ...(d.format ? { format: d.format } : {}),
        ...(Array.isArray(d.enum) ? { enum: d.enum } : {}),
        ...(d.description ? { description: String(d.description).slice(0, 120) } : {}),
      };
    }
    return { type: 'object', fields: props };
  }
  return { type: schema.type || 'any', ...(schema.enum ? { enum: schema.enum } : {}), ...(schema.format ? { format: schema.format } : {}) };
}

function queryOf(op) {
  return op.parameters
    .filter((p) => p.in === 'query')
    .map((p) => ({ name: p.name, required: !!p.required, type: (p.schema && p.schema.type) || 'string' }));
}

export function generateContracts() {
  const doc = readJson(repoPath('contracts', 'openapi.normalized.json'));
  const ops = listOperations(doc);

  const contracts = {};
  for (const op of ops.sort((a, b) => a.operationId.localeCompare(b.operationId))) {
    contracts[op.operationId] = {
      method: op.method.toUpperCase(),
      path: op.path,
      summary: op.summary,
      tag: op.tags[0] || '',
      pathParams: op.parameters.filter((p) => p.in === 'path').map((p) => p.name),
      query: queryOf(op),
      request: op.requestSchema ? fields(doc, op.requestSchema) : null,
      requestRef: op.requestRef || null,
      response: op.responseSchema ? fields(doc, op.responseSchema) : null,
      responseRef: op.responseRef || null,
    };
  }

  // JSDoc typedefs for the top-level request objects (editor IntelliSense).
  const typedefs = [];
  for (const [id, c] of Object.entries(contracts)) {
    if (c.request && c.request.type === 'object' && c.request.fields) {
      const props = Object.entries(c.request.fields)
        .map(([n, f]) => ` * @property {${jsType(f)}} ${f.required ? n : '[' + n + ']'} ${f.description || ''}`.trimEnd())
        .join('\n');
      typedefs.push(`/**\n * @typedef {Object} ${pascal(id)}Request\n${props}\n */`);
    }
  }

  const body = [
    generatedBanner('contracts/openapi.normalized.json'),
    '',
    '/* eslint-disable */',
    typedefs.join('\n\n'),
    '',
    '/** operationId → request/response contract. Drives forms, validators, builders. */',
    'export const CONTRACTS = ' + JSON.stringify(contracts, null, 2) + ';',
    '',
    'export function contractFor(operationId) { return CONTRACTS[operationId] || null; }',
    '',
    'export const OPERATION_IDS = Object.keys(CONTRACTS);',
    '',
  ].join('\n');

  writeText(repoPath('js', 'api', 'generated', 'contracts.generated.js'), body);
  log(`contracts — ${Object.keys(contracts).length} operations → js/api/generated/contracts.generated.js`);
  return contracts;
}

function jsType(f) {
  if (!f) return 'any';
  if (f.enum) return f.enum.map((v) => JSON.stringify(v)).join('|');
  return { integer: 'number', number: 'number', boolean: 'boolean', string: 'string', array: 'Array', object: 'Object' }[f.type] || 'any';
}
function pascal(name) {
  const c = camel(name);
  return c.charAt(0).toUpperCase() + c.slice(1);
}

if (import.meta.url === `file://${process.argv[1]}`) generateContracts();
