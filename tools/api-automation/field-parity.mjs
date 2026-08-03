#!/usr/bin/env node
/**
 * Field-parity / payload-completeness REPORT (not a CI gate — see rationale
 * below and the discussion in OPEN-ITEMS.md §3).
 *
 * For every matched CREATE (POST) / UPDATE (PUT) operation, lists which of
 * the contract's declared request fields are referenced anywhere in the
 * frontend (js/pages/**, js/ui/**, js/api/**) vs which aren't found anywhere.
 *
 * WHY THIS IS A REPORT, NOT A GATE:
 * A field the contract allows but the UI doesn't send is not automatically a
 * bug. Legitimate reasons a field can be "missing" here:
 *   - it's a product-level field the account form correctly omits because the
 *     account inherits it from the product;
 *   - it's deprecated in Fineract but still listed in the schema;
 *   - it's backend/config-only (report params, datatable schema, code values)
 *     with no sensible UI surface;
 *   - it's genuinely deferred/backlog (a real finding, but a roadmap
 *     decision, not a drift bug the way a wrong HTTP method is).
 * A naive token-count of "N missing fields" invites exactly the false-positive
 * noise OPEN-ITEMS.md §3 already had to explain away once. This report
 * surfaces candidates for a human to skim periodically — it does not claim
 * every listed field is a gap, and it is NOT wired into `npm run verify` or
 * any CI gate.
 *
 * Regenerate: `npm run api:field-parity`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const DRIFT_JSON = path.join(ROOT, 'contracts/api-drift.json');
const GEN_CONTRACTS = path.join(ROOT, 'js/api/generated/contracts.generated.js');
const OUT_MD = path.join(ROOT, 'contracts/field-parity.md');

// Boilerplate fields FinCraft's api layer / server conventions handle
// generically, not as per-field UI form inputs. Excluding these is not
// hiding gaps — a form-per-field audit of "does the locale dropdown exist"
// would be noise, not signal.
const BOILERPLATE = new Set(['locale', 'dateFormat']);

function collectFrontendText() {
  const dirs = ['js/pages', 'js/ui', 'js/api'].map((d) => path.join(ROOT, d));
  let all = '';
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.js') && !p.includes('/generated/')) {
        all += '\n' + fs.readFileSync(p, 'utf8');
      }
    }
  };
  dirs.forEach(walk);
  return all;
}

function main() {
  if (!fs.existsSync(DRIFT_JSON)) throw new Error('Missing contracts/api-drift.json — run `npm run api:drift` first.');
  const drift = JSON.parse(fs.readFileSync(DRIFT_JSON, 'utf8'));
  const matchedIds = new Set((drift.matchedOps || []).map((o) => o.operationId));

  const modUrl = pathToFileURL(GEN_CONTRACTS).href;
  return import(modUrl).then(({ CONTRACTS }) => {
    const frontendText = collectFrontendText();
    // Precompute a Set of all identifier-like tokens for O(1) lookups instead
    // of one regex scan per field (there are thousands of fields total).
    const tokenPattern = /[A-Za-z_$][A-Za-z0-9_$]*/g;
    const tokens = new Set(frontendText.match(tokenPattern) || []);

    const ops = Object.entries(CONTRACTS).filter(
      ([id, c]) => matchedIds.has(id) && (c.method === 'POST' || c.method === 'PUT') && c.request?.fields
    );

    const byTag = new Map();
    for (const [id, c] of ops) {
      const fields = Object.keys(c.request.fields).filter((f) => !BOILERPLATE.has(f));
      if (fields.length === 0) continue;
      const found = fields.filter((f) => tokens.has(f));
      const missing = fields.filter((f) => !tokens.has(f));
      const tag = c.tag || 'Untagged';
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push({ id, method: c.method, path: c.path, total: fields.length, found: found.length, missing });
    }

    // Summary sorted by missing-field volume, descending — surfaces where to
    // actually look first.
    const summary = [...byTag.entries()].map(([tag, opsForTag]) => {
      const totalFields = opsForTag.reduce((s, o) => s + o.total, 0);
      const totalMissing = opsForTag.reduce((s, o) => s + o.missing.length, 0);
      return { tag, ops: opsForTag.length, totalFields, totalMissing, opsForTag };
    }).sort((a, b) => b.totalMissing - a.totalMissing);

    const grandOps = ops.length;
    const grandFields = summary.reduce((s, t) => s + t.totalFields, 0);
    const grandMissing = summary.reduce((s, t) => s + t.totalMissing, 0);

    const L = [];
    L.push('# FinCraft — Field-Parity Report (informational, not a CI gate)', '');
    L.push(`_Generated ${new Date().toISOString()}_`, '');
    L.push('See the header of `tools/api-automation/field-parity.mjs` for why this is a report, not a gate.', '');
    L.push(`Scanned **${grandOps}** matched CREATE/UPDATE operations, **${grandFields}** non-boilerplate fields total, ` +
           `**${grandMissing}** not found as an identifier anywhere in \`js/pages/**\`, \`js/ui/**\`, or \`js/api/**\` (excluding generated files).`, '');
    L.push('A field not found is a CANDIDATE to review, not a confirmed gap — see the exclusion list in the script header.', '');

    L.push('## By resource (sorted by missing-field count)', '');
    L.push('| Tag | Ops | Fields | Missing | Missing % |', '|---|---:|---:|---:|---:|');
    for (const t of summary) {
      const pct = t.totalFields ? Math.round((t.totalMissing / t.totalFields) * 100) : 0;
      L.push(`| ${t.tag} | ${t.ops} | ${t.totalFields} | ${t.totalMissing} | ${pct}% |`);
    }
    L.push('');

    L.push('## Detail (only operations with at least one missing field)', '');
    for (const t of summary) {
      const withMissing = t.opsForTag.filter((o) => o.missing.length > 0);
      if (!withMissing.length) continue;
      L.push(`### ${t.tag}`, '');
      for (const o of withMissing) {
        L.push(`- \`${o.method} ${o.path}\` (${o.id}) — missing: ${o.missing.join(', ')}`);
      }
      L.push('');
    }

    fs.writeFileSync(OUT_MD, L.join('\n'));
    console.log(`Scanned ${grandOps} ops / ${grandFields} fields. ${grandMissing} candidates flagged.`);
    console.log(`Top 5 by missing count: ${summary.slice(0, 5).map((t) => `${t.tag} (${t.totalMissing})`).join(', ')}`);
    console.log('-> wrote contracts/field-parity.md');
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
