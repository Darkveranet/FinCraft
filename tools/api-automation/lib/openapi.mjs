/**
 * openapi.mjs — pure helpers for traversing an OpenAPI 3.0.3 document.
 *
 * These are intentionally dependency-free and defensive: the Fineract spec is
 * large and occasionally irregular, so every accessor tolerates missing nodes.
 */

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head'];

/** Resolve a local `$ref` (`#/components/schemas/Foo`) against the root doc. */
export function resolveRef(doc, ref) {
  if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  return ref
    .slice(2)
    .split('/')
    .reduce((node, key) => (node ? node[decodeURIComponent(key.replace(/~1/g, '/').replace(/~0/g, '~'))] : undefined), doc) ?? null;
}

/** Follow a schema through a single `$ref` hop (non-recursive). */
export function deref(doc, schema) {
  if (schema && schema.$ref) return resolveRef(doc, schema.$ref) || {};
  return schema || {};
}

/**
 * Flatten every operation in the document into a normalised list.
 * Each entry: { path, method, operationId, tags, summary, parameters,
 *               requestSchema, requestRef, responseSchema, responseRef, raw }.
 */
export function listOperations(doc) {
  const ops = [];
  const paths = doc.paths || {};
  for (const [path, item] of Object.entries(paths)) {
    if (!item || typeof item !== 'object') continue;
    const pathParams = Array.isArray(item.parameters) ? item.parameters : [];
    for (const method of HTTP_METHODS) {
      const op = item[method];
      if (!op || typeof op !== 'object') continue;
      const parameters = [...pathParams, ...(op.parameters || [])].map((p) => deref(doc, p));
      const { schema: requestSchema, ref: requestRef } = requestBodySchema(doc, op);
      const { schema: responseSchema, ref: responseRef } = successResponseSchema(doc, op);
      ops.push({
        path,
        method,
        operationId: op.operationId || synthOperationId(method, path),
        tags: op.tags || [],
        summary: op.summary || op.description || '',
        parameters,
        requestSchema,
        requestRef,
        responseSchema,
        responseRef,
        raw: op,
      });
    }
  }
  return ops;
}

function requestBodySchema(doc, op) {
  const rb = op.requestBody ? deref(doc, op.requestBody) : null;
  const content = rb && rb.content;
  if (!content) return { schema: null, ref: null };
  const media = content['application/json'] || Object.values(content)[0];
  const s = media && media.schema;
  return { schema: s ? deref(doc, s) : null, ref: s && s.$ref ? s.$ref : null };
}

function successResponseSchema(doc, op) {
  const responses = op.responses || {};
  const key = Object.keys(responses).find((k) => /^2\d\d$/.test(k)) || 'default';
  const resp = responses[key] ? deref(doc, responses[key]) : null;
  const content = resp && resp.content;
  if (!content) return { schema: null, ref: null };
  const media = content['application/json'] || Object.values(content)[0];
  const s = media && media.schema;
  return { schema: s ? deref(doc, s) : null, ref: s && s.$ref ? s.$ref : null };
}

/** Turn `POST /clients/{id}/charges` into a stable synthetic operationId. */
export function synthOperationId(method, path) {
  const clean = path
    .replace(/\{([^}]+)\}/g, 'By-$1')
    .split(/[\/]/)
    .filter(Boolean)
    .map((seg, i) => (i === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1)))
    .join('')
    .replace(/[^A-Za-z0-9]/g, '');
  return method.toLowerCase() + clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Primary resource tag for grouping (first tag, else first path segment). */
export function resourceOf(op) {
  if (op.tags && op.tags.length) return op.tags[0];
  const seg = op.path.split('/').filter(Boolean)[0] || 'misc';
  return seg.replace(/\{.*/, '') || 'misc';
}

/** camelCase a resource/tag name → JS identifier. */
export function camel(name) {
  return String(name)
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');
}

/** All named schemas in components. */
export function schemas(doc) {
  return (doc.components && doc.components.schemas) || {};
}

/** Path-level `{param}` names, in order. */
export function pathParamNames(path) {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
}

export { HTTP_METHODS };
