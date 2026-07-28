/* ────────────────────────────────────────────────────────────────────────────
   Custom ESLint rule · no-unescaped-innerhtml

   Editor-integrated counterpart to scan_unescaped_innerhtml.mjs. Flags an
   `X.innerHTML = `…${expr}…`` assignment when an interpolation renders a RAW
   variable / property (`${def.label}`, `${e.message}`) instead of routing it
   through an escaping / formatting helper.

   Classification mirrors the standalone scan exactly (keep the two in sync):
     SAFE   → Literal, Unary/Update (numeric), any Call/New (assume the helper —
              escapeHtml, num, `*Html`, String(x).replace(…) — returns safe
              output), a TemplateLiteral whose interpolations are all safe, and
              Conditional / Logical / Binary whose operands are all safe, plus
              `.length` / `.size` member reads (numeric).
     UNSAFE → a bare Identifier or non-numeric MemberExpression rendered directly.

   Suppress an audited-safe case with a trailing / inline `scan-allow-innerhtml`
   comment on the assignment line — the SAME marker honoured by
   scan_unescaped_innerhtml.mjs, so one comment suppresses both gates. (A regular
   eslint-disable-next-line also works for ESLint specifically.)
   ──────────────────────────────────────────────────────────────────────────── */

function isSafe(node) {
  if (!node) return true;
  switch (node.type) {
    case 'Literal':
    case 'UnaryExpression':
    case 'UpdateExpression':
    case 'CallExpression':
    case 'NewExpression':
      return true;
    case 'TemplateLiteral':
      return node.expressions.every(isSafe);
    case 'ConditionalExpression':
      return isSafe(node.consequent) && isSafe(node.alternate);
    case 'LogicalExpression':
    case 'BinaryExpression':
      return isSafe(node.left) && isSafe(node.right);
    case 'SequenceExpression':
      return isSafe(node.expressions[node.expressions.length - 1]);
    case 'MemberExpression':
      if (!node.computed && (node.property.name === 'length' || node.property.name === 'size')) return true;
      return false;
    case 'Identifier':
      return false;
    default:
      return true;
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow rendering an unescaped variable into innerHTML/outerHTML',
      recommended: true,
    },
    schema: [],
    messages: {
      unescaped:
        'Unescaped `${{{ expr }}}` interpolated into innerHTML. Wrap it in escapeHtml(...) ' +
        '(or an escaping helper). If this value is provably safe, add an eslint-disable-next-line with a reason.',
    },
  },
  create(context) {
    const source = context.sourceCode || context.getSourceCode();
    return {
      AssignmentExpression(node) {
        if (node.operator !== '=') return;
        const left = node.left;
        if (
          left.type !== 'MemberExpression' ||
          left.computed ||
          (left.property.name !== 'innerHTML' && left.property.name !== 'outerHTML')
        ) return;
        if (node.right.type !== 'TemplateLiteral') return;

        // Honour the shared `scan-allow-innerhtml` suppression on the assignment
        // line — keeps this rule in sync with scan_unescaped_innerhtml.mjs so a
        // single audited comment silences both the editor rule and the CI gate.
        const startLine = node.loc.start.line;
        const lineText = (source.lines && source.lines[startLine - 1]) || '';
        if (/scan-allow-innerhtml/.test(lineText)) return;

        for (const expr of node.right.expressions) {
          if (!isSafe(expr)) {
            context.report({
              node: expr,
              messageId: 'unescaped',
              data: { expr: source.getText(expr).replace(/\s+/g, ' ').slice(0, 40) },
            });
          }
        }
      },
    };
  },
};
