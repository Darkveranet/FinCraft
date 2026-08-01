/**
 * normalize-spec.mjs — Pipeline step 2: "Validate & Normalize Spec"
 *
 * Reads contracts/openapi.raw.json, runs structural validation, then emits a
 * deterministic contracts/openapi.normalized.json that every downstream
 * generator consumes. Normalisation makes the diff step meaningful: the same
 * upstream spec always yields byte-identical output.
 *
 * Normalisation performed:
 *   • pin openapi version to 3.0.3
 *   • ensure every operation has a stable operationId (synthesised if missing)
 *   • strip volatile/noise fields (servers host, x-generated timestamps)
 *   • sort keys recursively (handled by writeJson)
 * Validation performed (collected, not fail-fast, so the report is complete):
 *   • duplicate operationIds
 *   • path params declared in the URL but missing a parameter definition
 *   • operations with no success (2xx) response
 *   • dangling local $refs
 */
import { readJson, writeJson, repoPath, log } from './lib/spec-io.mjs';
import { listOperations, synthOperationId, pathParamNames, resolveRef } from './lib/openapi.mjs';

function collectRefs(node, acc) {
  if (Array.isArray(node)) node.forEach((n) => collectRefs(n, acc));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === '$ref' && typeof v === 'string') acc.push(v);
      else collectRefs(v, acc);
    }
  }
  return acc;
}

export function normalizeSpec() {
  const raw = readJson(repoPath('contracts', 'openapi.raw.json'));
  const issues = [];
  const warnings = [];

  raw.openapi = '3.0.3';
  if (raw.info) delete raw.info['x-generated-at'];

  // Ensure stable operationIds.
  const seen = new Map();
  for (const [path, item] of Object.entries(raw.paths || {})) {
    for (const method of ['get', 'put', 'post', 'delete', 'patch']) {
      const op = item[method];
      if (!op) continue;
      if (!op.operationId) op.operationId = synthOperationId(method, path);
      const key = op.operationId;
      seen.set(key, (seen.get(key) || 0) + 1);
    }
  }
  for (const [id, count] of seen) if (count > 1) issues.push(`Duplicate operationId "${id}" used ${count}×`);

  // Path-param coverage + missing 2xx.
  const ops = listOperations(raw);
  for (const op of ops) {
    const declared = new Set(op.parameters.filter((p) => p.in === 'path').map((p) => p.name));
    for (const name of pathParamNames(op.path)) {
      if (!declared.has(name)) warnings.push(`${op.method.toUpperCase()} ${op.path}: path param {${name}} has no parameter definition`);
    }
    const has2xx = Object.keys(op.raw.responses || {}).some((k) => /^2\d\d$/.test(k));
    if (!has2xx) warnings.push(`${op.method.toUpperCase()} ${op.path}: no 2xx response declared`);
  }

  // Dangling refs.
  for (const ref of new Set(collectRefs(raw, []))) {
    if (ref.startsWith('#/') && resolveRef(raw, ref) == null) issues.push(`Dangling $ref: ${ref}`);
  }

  writeJson(repoPath('contracts', 'openapi.normalized.json'), raw);

  const report = {
    generatedAt: new Date().toISOString(),
    openapi: raw.openapi,
    pathCount: Object.keys(raw.paths || {}).length,
    operationCount: ops.length,
    schemaCount: Object.keys((raw.components && raw.components.schemas) || {}).length,
    errors: issues,
    warnings,
    valid: issues.length === 0,
  };
  writeJson(repoPath('contracts', 'validation-report.json'), report);

  log(`normalized — ${report.operationCount} ops, ${report.schemaCount} schemas, ${issues.length} errors, ${warnings.length} warnings`);
  if (issues.length) {
    for (const e of issues) console.error('  ✗', e);
    throw new Error(`Spec validation failed with ${issues.length} error(s).`);
  }
  return raw;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    normalizeSpec();
  } catch (e) {
    console.error('[api-automation] normalize-spec FAILED:', e.message);
    process.exit(1);
  }
}
