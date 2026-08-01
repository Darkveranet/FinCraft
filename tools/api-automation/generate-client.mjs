/**
 * generate-client.mjs — Pipeline step 5: "Generate API Client (endpoints, methods)"
 *
 * Emits js/api/generated/client.generated.js — one factory per resource in the
 * exact shape of the hand-written js/api/*.js modules (make<Resource>API(self)
 * returning `self._g/_p/_u/_d` closures). This lets FinCraft mount generated
 * resources alongside the curated ones without changing core.js.
 *
 * Output is a *superset scaffold*: it never overwrites the curated modules; it
 * exposes everything the contract declares so no endpoint is silently missing.
 */
import { readJson, writeText, repoPath, generatedBanner, log } from './lib/spec-io.mjs';
import { listOperations, resourceOf, camel, pathParamNames } from './lib/openapi.mjs';

const VERB = { get: '_g', post: '_p', put: '_u', delete: '_d', patch: '_p' };

/** Choose a short method name for an operation within its resource. */
function methodName(op, resource) {
  let id = op.operationId;
  // Trim a leading resource prefix so `getClient` under `clients` → `get`.
  const r = camel(resource).replace(/s$/, '');
  const re = new RegExp('^(get|post|put|delete|patch|create|update|retrieve|list)?' + r, 'i');
  id = id.replace(re, (m, verb) => verb || '');
  id = camel(id || op.method);
  return id || camel(op.method + op.path.split('/').pop());
}

function buildResourceModule(resource, ops) {
  const factory = 'make' + pascal(resource) + 'API';
  const lines = [];
  const used = new Set();
  for (const op of ops.sort((a, b) => a.path.localeCompare(b.path))) {
    const params = pathParamNames(op.path).map(camel);
    const verb = VERB[op.method];
    // Build a template literal path with ${param} substitution.
    let idx = 0;
    const tmpl = op.path.replace(/\{[^}]+\}/g, () => '${' + (params[idx++] || 'id') + '}');
    let name = methodName(op, resource);
    while (used.has(name)) name = name + 'X';
    used.add(name);

    const args = [...params];
    const call = [];
    if (op.method === 'get') {
      args.push('params');
      call.push('`' + tmpl + '`', 'params');
    } else if (op.method === 'delete') {
      args.push('body');
      call.push('`' + tmpl + '`', 'body');
    } else {
      args.push('body');
      call.push('`' + tmpl + '`', 'body');
    }
    lines.push(
      `    ${name}: (${args.join(', ')}) => self.${verb}(${call.join(', ')}),` +
        ` // ${op.method.toUpperCase()} ${op.path}`,
    );
  }
  return { factory, code: `export function ${factory}(self) {\n  return {\n${lines.join('\n')}\n  };\n}` };
}

function pascal(name) {
  const c = camel(name);
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export function generateClient() {
  const doc = readJson(repoPath('contracts', 'openapi.normalized.json'));
  const ops = listOperations(doc);
  const byResource = new Map();
  for (const op of ops) {
    const r = resourceOf(op);
    if (!byResource.has(r)) byResource.set(r, []);
    byResource.get(r).push(op);
  }

  const modules = [];
  const registry = [];
  for (const [resource, list] of [...byResource].sort((a, b) => a[0].localeCompare(b[0]))) {
    const { factory, code } = buildResourceModule(resource, list);
    modules.push(code);
    registry.push(`  ${camel(resource)}: ${factory},`);
  }

  const banner = generatedBanner('contracts/openapi.normalized.json');
  const body = [
    banner,
    '',
    '/* eslint-disable */',
    '// Each factory mirrors the curated js/api/*.js style: closures over `self`',
    '// (a FineractAPI instance) using the private _g/_p/_u/_d request verbs.',
    '',
    modules.join('\n\n'),
    '',
    '/** Resource-name → factory, for bulk mounting on a FineractAPI instance. */',
    'export const GENERATED_RESOURCES = {',
    registry.join('\n'),
    '};',
    '',
    '/** Attach every generated resource that is not already present on `api`. */',
    'export function mountGenerated(api, { overwrite = false } = {}) {',
    '  for (const [name, factory] of Object.entries(GENERATED_RESOURCES)) {',
    '    if (overwrite || api[name] == null) api[name] = factory(api);',
    '  }',
    '  return api;',
    '}',
    '',
  ].join('\n');

  writeText(repoPath('js', 'api', 'generated', 'client.generated.js'), body);
  log(`client — ${modules.length} resources, ${ops.length} methods → js/api/generated/client.generated.js`);
  return { resources: modules.length, methods: ops.length };
}

if (import.meta.url === `file://${process.argv[1]}`) generateClient();
