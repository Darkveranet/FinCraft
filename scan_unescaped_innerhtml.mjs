/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · scan_unescaped_innerhtml.mjs

   Zero-dependency (acorn is already a dep) escaping-discipline gate.

   It flags the exact bug class §1 of the developer-recommendations report calls
   out: an `X.innerHTML = `…${expr}…`` assignment where an interpolation renders
   a RAW variable / property (e.g. `${def.label}`, `${e.message || e}`) instead
   of routing it through an escaping/formatting helper.

   Classification (per interpolation expression E):
     SAFE   → Literal, numeric/Unary/Update expr, a CallExpression (assumed the
              helper — escapeHtml, num, compact, `*Html`, `String(x).replace(…)`,
              etc. — produces safe output), a TemplateLiteral whose own
              interpolations are all safe, and Conditional / Logical / Binary
              (string-concat) whose operands are all safe.
     UNSAFE → a bare Identifier (`${x}`) or MemberExpression (`${obj.prop}`)
              rendered directly, i.e. NOT wrapped in a call.

   This deliberately treats any call as safe to stay LOW-NOISE and high-signal:
   it catches raw interpolation (the real defect) without drowning the codebase's
   ~860 legitimate `${num(x)}` / `${escapeHtml(x)}` / static-markup interpolations
   in false positives. A genuinely dangerous helper is out of scope for a static
   heuristic — that's what the unit test in tests/escaping-discipline.test.js and
   code review are for.

   Suppress an audited-safe line with a trailing comment on the SAME line:
       el.innerHTML = `<i class="${icon}"></i>`;   // scan-allow-innerhtml: static class name
   ──────────────────────────────────────────────────────────────────────────── */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

// ── Baseline ratchet ────────────────────────────────────────────────────────
// Introducing this gate to a working codebase all-at-once is unsafe: many of the
// existing interpolations are pre-built HTML fragments (`navHtml`, `officeOpts`,
// `banner`, …) that MUST NOT be escaped — doing so would double-escape and break
// the UI. So we snapshot the currently-accepted findings into a baseline and fail
// CI only on NEW ones. Burn the baseline down deliberately, case by case.
//   Regenerate:  UPDATE_BASELINE=1 node scan_unescaped_innerhtml.mjs
const BASELINE_FILE = 'scan-innerhtml-baseline.json';
const UPDATE = process.env.UPDATE_BASELINE === '1';
const baseline = existsSync(BASELINE_FILE)
  ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
  : {};

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

// True ⇒ this interpolation cannot inject unescaped user markup (by our heuristic).
function isSafe(node) {
  if (!node) return true;
  switch (node.type) {
    case 'Literal':
    case 'TemplateElement':
    case 'UnaryExpression':
    case 'UpdateExpression':
      return true;
    // A call is assumed to hand back safe output (escapeHtml/num/compact/`*Html`/…).
    case 'CallExpression':
    case 'NewExpression':
      return true;
    case 'TemplateLiteral':
      return node.expressions.every(isSafe);
    case 'ConditionalExpression':
      return isSafe(node.consequent) && isSafe(node.alternate);
    case 'LogicalExpression':
      return isSafe(node.left) && isSafe(node.right);
    case 'BinaryExpression':
      return isSafe(node.left) && isSafe(node.right);
    case 'SequenceExpression':
      return isSafe(node.expressions[node.expressions.length - 1]);
    case 'ParenthesizedExpression':
      return isSafe(node.expression);
    case 'MemberExpression':
      // `.length` / `.size` are numeric — never a markup-injection vector.
      if (!node.computed && (node.property.name === 'length' || node.property.name === 'size')) return true;
      return false;
    // Bare variable read rendered straight into HTML ⇒ the defect.
    case 'Identifier':
      return false;
    default:
      return true;   // conservative: unknown node types don't fail the build
  }
}

const files = listJsFiles('js');
const found = {};   // key: `${file}::${normalizedSnippet}` → observed count

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  let ast;
  try {
    ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'module', locations: true });
  } catch (e) {
    console.log(`PARSE ERROR ${file}: ${e.message}`);
    continue;
  }

  walk.simple(ast, {
    AssignmentExpression(node) {
      if (node.operator !== '=') return;
      const left = node.left;
      const isInnerHtml =
        left.type === 'MemberExpression' &&
        !left.computed &&
        (left.property.name === 'innerHTML' || left.property.name === 'outerHTML');
      if (!isInnerHtml) return;
      if (node.right.type !== 'TemplateLiteral') return;

      const lineNo = node.loc.start.line;
      // Honour an inline suppression on the assignment's first line.
      if (/scan-allow-innerhtml/.test(lines[lineNo - 1] || '')) return;

      for (const expr of node.right.expressions) {
        if (!isSafe(expr)) {
          const snippet = src.slice(expr.start, expr.end).replace(/\s+/g, ' ').trim();
          const key = `${file}::${snippet}`;
          found[key] = (found[key] || 0) + 1;
        }
      }
    },
  });
}

// ── Regenerate baseline ───────────────────────────────────────────────────────
if (UPDATE) {
  const sorted = Object.fromEntries(Object.entries(found).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(BASELINE_FILE, JSON.stringify(sorted, null, 2) + '\n');
  const total = Object.values(found).reduce((a, b) => a + b, 0);
  console.log(`Wrote ${BASELINE_FILE}: ${Object.keys(sorted).length} keys, ${total} accepted interpolations.`);
  process.exit(0);
}

// ── Compare against baseline: fail only on NEW / increased occurrences ─────────
let newIssues = 0;
for (const [key, count] of Object.entries(found)) {
  const allowed = baseline[key] || 0;
  if (count > allowed) {
    newIssues += count - allowed;
    const [file, snippet] = key.split('::');
    console.log(`NEW-UNESCAPED ${file}: \`\${${snippet.slice(0, 70)}}\`` +
                (allowed ? `  (baseline ${allowed}, now ${count})` : ''));
  }
}

const totalFound = Object.values(found).reduce((a, b) => a + b, 0);
const totalBaseline = Object.values(baseline).reduce((a, b) => a + b, 0);
console.log(`\nAccepted (baseline): ${totalBaseline} · Currently found: ${totalFound} · New violations: ${newIssues}`);
if (newIssues === 0) console.log('OK — no new unescaped innerHTML interpolations.');
// Non-zero exit so CI can gate on this (see .github/workflows/quality.yml).
process.exit(newIssues > 0 ? 1 : 0);
