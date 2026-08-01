/**
 * generate-validators.mjs — Pipeline step 7: "Generate Runtime Validators + Payload Builders"
 *
 * Consumes the CONTRACTS map (from generate-contracts) and emits:
 *   • js/api/generated/validators.generated.js — validateRequest(operationId, body)
 *     → { valid, errors[] }. Checks required fields, primitive types, and enums.
 *   • js/api/generated/builders.generated.js — buildPayload(operationId, input)
 *     → a request body pre-seeded with FinCraft conventions (locale + dateFormat
 *     injected whenever the contract has a date field), so callers stop repeating
 *     `{ locale: LOCALE, dateFormat: DATE_FORMAT }` by hand.
 *
 * These are runtime-safe, dependency-free, and defensive: an unknown operationId
 * is a no-op pass (never blocks the UI on a spec the client hasn't regenerated).
 */
import { readJson, writeText, repoPath, generatedBanner, log } from './lib/spec-io.mjs';
import { listOperations, deref } from './lib/openapi.mjs';

/** Build a slim rule set per operation: required[], types{}, enums{}, hasDate. */
function ruleSet(doc) {
  const ops = listOperations(doc);
  const rules = {};
  for (const op of ops) {
    if (!op.requestSchema) continue;
    const schema = deref(doc, op.requestSchema);
    if (schema.type !== 'object' && !schema.properties) continue;
    const required = schema.required || [];
    const types = {};
    const enums = {};
    let hasDate = false;
    for (const [name, sub] of Object.entries(schema.properties || {})) {
      const d = deref(doc, sub);
      if (d.type) types[name] = d.type;
      if (Array.isArray(d.enum)) enums[name] = d.enum;
      if (d.format === 'date' || d.format === 'date-time' || /date$/i.test(name)) hasDate = true;
    }
    rules[op.operationId] = { required, types, enums, hasDate };
  }
  return rules;
}

export function generateValidators() {
  const doc = readJson(repoPath('contracts', 'openapi.normalized.json'));
  const rules = ruleSet(doc);
  const banner = generatedBanner('contracts/openapi.normalized.json');

  const validators = [
    banner,
    '',
    '/* eslint-disable */',
    'const RULES = ' + JSON.stringify(rules, null, 2) + ';',
    '',
    'const TYPE_OK = {',
    "  string:  (v) => typeof v === 'string',",
    "  integer: (v) => Number.isInteger(v) || (typeof v === 'string' && /^-?\\d+$/.test(v)),",
    "  number:  (v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))),",
    "  boolean: (v) => typeof v === 'boolean',",
    '  array:   (v) => Array.isArray(v),',
    "  object:  (v) => v && typeof v === 'object' && !Array.isArray(v),",
    '};',
    '',
    '/**',
    ' * Validate a request body against its generated contract.',
    ' * @returns {{ valid: boolean, errors: {field:string,message:string}[] }}',
    ' */',
    'export function validateRequest(operationId, body = {}) {',
    '  const rule = RULES[operationId];',
    '  if (!rule) return { valid: true, errors: [] }; // unknown op ⇒ do not block',
    '  const errors = [];',
    '  for (const field of rule.required) {',
    "    const v = body[field];",
    "    if (v === undefined || v === null || v === '') errors.push({ field, message: `${field} is required` });",
    '  }',
    '  for (const [field, type] of Object.entries(rule.types)) {',
    '    const v = body[field];',
    '    if (v == null) continue;',
    '    const check = TYPE_OK[type];',
    '    if (check && !check(v)) errors.push({ field, message: `${field} must be ${type}` });',
    '  }',
    '  for (const [field, allowed] of Object.entries(rule.enums)) {',
    '    const v = body[field];',
    '    if (v != null && !allowed.includes(v)) errors.push({ field, message: `${field} must be one of: ${allowed.join(", ")}` });',
    '  }',
    '  return { valid: errors.length === 0, errors };',
    '}',
    '',
    'export function assertValid(operationId, body) {',
    '  const { valid, errors } = validateRequest(operationId, body);',
    '  if (!valid) {',
    '    const e = new Error(`Payload validation failed for ${operationId}: ` + errors.map((x) => x.message).join("; "));',
    '    e.validation = errors; throw e;',
    '  }',
    '  return body;',
    '}',
    '',
    'export const REQUEST_RULES = RULES;',
    '',
  ].join('\n');

  // Builders reuse the same rules to know which ops need locale/dateFormat.
  const dateOps = Object.fromEntries(Object.entries(rules).map(([id, r]) => [id, !!r.hasDate]));
  const builders = [
    banner,
    '',
    '/* eslint-disable */',
    "import { LOCALE, DATE_FORMAT } from '../../config.js';",
    '',
    'const NEEDS_DATE_META = ' + JSON.stringify(dateOps, null, 2) + ';',
    '',
    '/**',
    ' * Assemble a request body for an operation, injecting FinCraft conventions:',
    ' * locale + dateFormat are added automatically when the contract carries a',
    ' * date field (and the caller has not already supplied them).',
    ' */',
    'export function buildPayload(operationId, input = {}) {',
    '  const body = { ...input };',
    '  if (NEEDS_DATE_META[operationId]) {',
    "    if (body.locale == null) body.locale = LOCALE;",
    '    if (body.dateFormat == null) body.dateFormat = DATE_FORMAT;',
    '  }',
    '  return body;',
    '}',
    '',
    'export const DATE_AWARE_OPERATIONS = NEEDS_DATE_META;',
    '',
  ].join('\n');

  writeText(repoPath('js', 'api', 'generated', 'validators.generated.js'), validators);
  writeText(repoPath('js', 'api', 'generated', 'builders.generated.js'), builders);
  log(`validators + builders — ${Object.keys(rules).length} request rules → js/api/generated/`);
  return rules;
}

if (import.meta.url === `file://${process.argv[1]}`) generateValidators();
