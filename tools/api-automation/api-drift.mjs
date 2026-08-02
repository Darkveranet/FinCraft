#!/usr/bin/env node
/**
 * api-drift.mjs — Hand-written API ↔ generated-contract drift report.
 * PLACE AT: tools/api-automation/api-drift.mjs   (replaces the previous version)
 *
 * FIXES vs the first cut (which reported 0 matched against the real spec):
 *   1. Strip a leading version prefix (/v1, /v2 …) from BOTH sides. The real
 *      Fineract spec paths are `/v1/clients`; hand-written routes omit it
 *      (core.js prepends /fineract-provider/api/v1). Without this NOTHING matches.
 *   2. Command handling: Fineract dispatches `?command=X` through a single
 *      generic handler (e.g. POST /v1/clients/{id}); it does NOT enumerate each
 *      command as its own operation. So we match on METHOD+PATH only and keep
 *      `command` as metadata. (Also: allow hyphens — charge-off, undo-charge-off.)
 *   3. Routes whose static path can't be resolved (JS ternaries like
 *      `${subIdOrType ? …}`) go to a `dynamic` bucket instead of polluting
 *      `unverified`.
 *
 * Buckets:
 *   ✅ matched     hand-written endpoint (method+path) exists in the contract
 *   🔴 mismatch    same path exists but under a DIFFERENT http method — a bug
 *   🟡 unverified  hand-written path with no contract path at all
 *   ⚪ uncovered   contract operation no hand-written route reaches (UI backlog)
 *   ⚙️  dynamic     hand-written route with an unresolved dynamic path segment
 *
 * Env:
 *   DRIFT_STRIP_PREFIX   regex of a leading prefix to strip (default ^/v\d+ )
 *
 * Usage:  node tools/api-automation/api-drift.mjs [--strict] [--json-only]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const API_DIR = path.join(ROOT, 'js', 'api');
const GEN_CONTRACTS = path.join(API_DIR, 'generated', 'contracts.generated.js');
const OUT_DIR = path.join(ROOT, 'contracts');

const argv = new Set(process.argv.slice(2));
const STRICT = argv.has('--strict');
const JSON_ONLY = argv.has('--json-only');

const VERB = { _g: 'GET', _p: 'POST', _u: 'PUT', _d: 'DELETE' };
const SKIP_FILES = new Set(['index.js', 'core.js', 'operation-runner.js']);
const VERSION_PREFIX = new RegExp(process.env.DRIFT_STRIP_PREFIX || '^/v\\d+(?=/)');

/** Canonicalise a path: strip version prefix, drop query (retain command),
 *  collapse params to {}. Returns { path, command, dynamic }. */
function canonPath(raw) {
  let p = raw.trim();

  // command may contain hyphens (charge-off, undo-charge-off)
  let command = null;
  const cmd = p.match(/[?&]command=([a-zA-Z0-9_-]+)/);
  if (cmd) command = cmd[1];

  p = p.split('?')[0];
  // Unresolved JS template expressions (ternaries etc.) → dynamic, can't judge.
  const dynamic = /\$\{[^}]*[?:][^}]*\}/.test(raw) || /\$\{[^}]*\([^}]*$/.test(raw);

  p = p.replace(VERSION_PREFIX, '');                 // /v1/clients -> /clients
  p = p.replace(/\$\{[^}]*\}/g, '{}').replace(/\{[^}]*\}/g, '{}');
  p = p.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
  return { path: p, command, dynamic };
}

// Match key intentionally EXCLUDES command (Fineract uses generic handlers).
const keyOf = (method, canon) => `${method} ${canon.path}`;

function extractHandwritten() {
  const routes = [];
  const files = fs.readdirSync(API_DIR)
    .filter((f) => f.endsWith('.js') && !SKIP_FILES.has(f))
    .filter((f) => fs.statSync(path.join(API_DIR, f)).isFile());
  const call = /self\.(_[gpud])\(\s*(['"`])([^'"`]*?)\2/g;
  for (const file of files) {
    const src = fs.readFileSync(path.join(API_DIR, file), 'utf8');
    let m;
    while ((m = call.exec(src)) !== null) {
      const method = VERB[m[1]];
      const rawPath = m[3];
      if (!rawPath.startsWith('/')) continue;
      const canon = canonPath(rawPath);
      const line = src.slice(0, m.index).split('\n').length;
      routes.push({
        method, rawPath, key: keyOf(method, canon),
        canonPath: canon.path, command: canon.command,
        dynamic: canon.dynamic, file, line,
      });
    }
  }
  return routes;
}

async function loadContracts() {
  if (!fs.existsSync(GEN_CONTRACTS)) {
    throw new Error(`Missing ${path.relative(ROOT, GEN_CONTRACTS)} — run \`npm run api:all\` first.`);
  }
  const mod = await import(pathToFileURL(GEN_CONTRACTS).href);
  const CONTRACTS = mod.CONTRACTS || {};
  const out = [];
  for (const [operationId, c] of Object.entries(CONTRACTS)) {
    const canon = canonPath(c.path);
    out.push({
      operationId, method: (c.method || '').toUpperCase(),
      rawPath: c.path, key: keyOf((c.method || '').toUpperCase(), canon),
      canonPath: canon.path, tag: c.tag || null,
    });
  }
  return out;
}

function diff(handwritten, contracts) {
  const ctByKey = new Map(contracts.map((c) => [c.key, c]));
  const ctByPath = new Map();
  for (const c of contracts) {
    if (!ctByPath.has(c.canonPath)) ctByPath.set(c.canonPath, []);
    ctByPath.get(c.canonPath).push(c);
  }

  const matched = new Set();      // hw method+path keys that hit a contract op
  const mismatch = [];
  const unverified = [];
  const dynamic = [];
  const seenHwKeys = new Set();

  for (const r of handwritten) {
    if (r.dynamic) { dynamic.push(r); continue; }
    if (seenHwKeys.has(r.key)) { matched.has(r.key) && matched.add(r.key); continue; }
    seenHwKeys.add(r.key);

    if (ctByKey.has(r.key)) { matched.add(r.key); continue; }

    const samePath = ctByPath.get(r.canonPath);
    if (samePath && samePath.length) {
      mismatch.push({
        key: r.key, file: r.file, line: r.line,
        handwrittenMethod: r.method,
        contractCandidates: samePath.map((c) => ({ operationId: c.operationId, method: c.method })),
      });
    } else {
      unverified.push({ key: r.key, file: r.file, line: r.line, rawPath: r.rawPath });
    }
  }

  const uncovered = contracts.filter((c) => !seenHwKeys.has(c.key));

  return {
    matched: [...matched],
    mismatch, unverified, uncovered, dynamic,
  };
}

function toMarkdown(res, meta) {
  const L = [];
  L.push('# FinCraft — Hand-written API ↔ Contract Drift', '', `_Generated ${new Date().toISOString()}_`, '');
  L.push(`Contract source: **${meta.origin}** · contract ops: **${meta.contractOps}** · ` +
         `hand-written routes: **${meta.hwRoutes}** (${meta.hwEndpoints} unique endpoints, ${meta.hwFiles} modules)`, '');
  L.push('| Bucket | Count | Meaning |', '|---|---:|---|');
  L.push(`| ✅ Matched | ${res.matched.length} | endpoint (method+path) backed by a contract op |`);
  L.push(`| 🔴 Mismatch | ${res.mismatch.length} | same path, **wrong HTTP method** — a bug |`);
  L.push(`| 🟡 Unverified | ${res.unverified.length} | hand-written path absent from the contract |`);
  L.push(`| ⚪ Uncovered | ${res.uncovered.length} | contract op no UI route reaches (backlog) |`);
  L.push(`| ⚙️ Dynamic | ${res.dynamic.length} | unresolved dynamic path (skipped) |`, '');

  const section = (title, rows, render) => {
    if (!rows.length) return;
    L.push(`## ${title} (${rows.length})`, '');
    rows.slice(0, 300).forEach((r) => L.push(render(r)));
    if (rows.length > 300) L.push(`… and ${rows.length - 300} more`);
    L.push('');
  };
  section('🔴 Mismatches (wrong method)', res.mismatch,
    (m) => `- \`${m.key}\` (${m.file}:${m.line}) → contract has ` +
           m.contractCandidates.map((c) => `\`${c.method}\` (${c.operationId})`).join(', '));
  section('🟡 Unverified', res.unverified, (u) => `- \`${u.key}\` (${u.file}:${u.line})`);
  section('⚪ Uncovered', res.uncovered, (u) => `- ${u.operationId} — \`${u.key}\``);
  section('⚙️ Dynamic', res.dynamic, (d) => `- \`${d.method} ${d.rawPath}\` (${d.file}:${d.line})`);
  return L.join('\n');
}

async function main() {
  const handwritten = extractHandwritten();
  const contracts = await loadContracts();
  const res = diff(handwritten, contracts);

  let origin = 'unknown';
  try { origin = JSON.parse(fs.readFileSync(path.join(OUT_DIR, '.source.json'), 'utf8')).origin || origin; } catch {}

  const meta = {
    origin, contractOps: contracts.length,
    hwRoutes: handwritten.length,
    hwEndpoints: new Set(handwritten.filter((r) => !r.dynamic).map((r) => r.key)).size,
    hwFiles: new Set(handwritten.map((r) => r.file)).size,
  };
  const json = {
    generatedAt: new Date().toISOString(), meta,
    summary: {
      matched: res.matched.length, mismatch: res.mismatch.length,
      unverified: res.unverified.length, uncovered: res.uncovered.length,
      dynamic: res.dynamic.length,
    },
    mismatch: res.mismatch, unverified: res.unverified,
    uncovered: res.uncovered, dynamic: res.dynamic,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'api-drift.json'), JSON.stringify(json, null, 2));
  const md = toMarkdown(res, meta);
  fs.writeFileSync(path.join(OUT_DIR, 'api-drift.md'), md);

  if (!JSON_ONLY) { console.log(md); console.log('\n→ wrote contracts/api-drift.{json,md}'); }
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');

  if (STRICT && res.mismatch.length > 0) {
    console.error(`\n✗ ${res.mismatch.length} method mismatch(es) — failing (--strict).`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e.stack || String(e)); process.exit(2); });
