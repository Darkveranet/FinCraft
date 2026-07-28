import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

function listJsFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      listJsFiles(p, out);
    } else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

function calleeSource(node, src) {
  // Reconstruct dotted callee path text, e.g. "api.loans.approve"
  return src.slice(node.callee.start, node.callee.end);
}

const files = listJsFiles('js');
let issues = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  let ast;
  try {
    ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'module', locations: true });
  } catch { continue; }

  // Find enclosing "function-like" nodes and scan their direct source for api.* calls
  const funcTypes = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
  walk.simple(ast, {
    FunctionDeclaration(n) { checkFn(n); },
    FunctionExpression(n) { checkFn(n); },
    ArrowFunctionExpression(n) { checkFn(n); },
  });

  function checkFn(fnNode) {
    // Only count calls whose NEAREST enclosing function is this one. We walk fnNode.body
    // recursively but stop descending at any nested function, so a call inside an inner
    // handler/callback is attributed to that inner function (which checkFn also visits),
    // never double-counted here. This kills the scope-blind false positives that a flat
    // walk produced (e.g. a KPI fetch and a paginated fetch that share the literal text
    // `api.x.list(params)` but live in two different inner functions), while still catching
    // a genuine "same call issued twice in the same scope" bug — which is the real defect
    // the original manual audits (FIXLOG-duplicate-api-calls.md) were hunting.
    const calls = [];
    const stopAtNestedFn = () => {};   // empty visitor ⇒ walk.recursive won't descend
    walk.recursive(fnNode.body, null, {
      FunctionDeclaration: stopAtNestedFn,
      FunctionExpression: stopAtNestedFn,
      ArrowFunctionExpression: stopAtNestedFn,
      CallExpression(cn, state, c) {
        if (cn.callee.type === 'MemberExpression') {
          const calleeTxt = calleeSource(cn, src);
          if (/^api\.\w+\.\w+$/.test(calleeTxt)) {
            const argsTxt = src.slice(cn.start, cn.end);
            calls.push({ calleeTxt, argsTxt, line: cn.loc.start.line });
          }
        }
        walk.base.CallExpression(cn, state, c);   // keep walking args/callee at this scope
      },
    });
    const seen = new Map();
    for (const c of calls) {
      const key = c.argsTxt.replace(/\s+/g, ' ');
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push(c.line);
    }
    for (const [key, lines] of seen) {
      if (lines.length > 1) {
        issues++;
        console.log(`DOUBLE-CALL ${file}: "${key.slice(0, 90)}" called at lines ${lines.join(', ')}`);
      }
    }
  }
}

console.log(`\nTotal repeated-identical-api-call issues: ${issues}`);
// Non-zero exit so CI can gate on this (see .github/workflows/quality.yml).
process.exit(issues > 0 ? 1 : 0);
