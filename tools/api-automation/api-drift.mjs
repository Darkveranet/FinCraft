#!/usr/bin/env node
/**
 * api-drift.mjs — Hand-written API ↔ generated-contract drift report.
 *
 * The contract-sync pipeline (run.mjs) already diffs the *spec against itself*
 * over time (diff-contracts.mjs). THIS tool answers a different question:
 *
 *     "Where do our 24 hand-written js/api/*.js wrappers disagree with the
 *      Fineract source-of-truth contract?"
 *
 * It statically extracts every route call (self._g/_p/_u/_d('/path', …)) from
 * the curated js/api/*.js modules, canonicalises method+path (path params and
 * ?command= verbs included), and diffs that set against CONTRACTS[] emitted by
 * generate-contracts.mjs. Output:
 *
 *   contracts/api-drift.json   machine-readable (for CI job summary / gates)
 *   contracts/api-drift.md     human-readable punch-list
 *
 * Buckets:
 *   • unverified   hand-written route with NO matching contract operation
 *                  (a wrong path/verb/command — OR an op absent from the spec
 *                   we generated against; the report says which).
 *   • uncovered    contract operation NO hand-written route calls (UI gap).
 *   • mismatch     same normalised path exists on both sides but the HTTP
 *                  method or ?command= differs (highest-signal: a real bug).
 *
 * Exit code: 0 always, unless --strict is passed AND there are `mismatch`
 * findings (those are unambiguous bugs; unverified/uncovered are informational
 * and expected to be large until Phase 1 generates against the full real spec).
 *
 * Usage:
 *   node tools/api-automation/api-drift.mjs [--strict] [--json-only]
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

// Modules that are infrastructure, not endpoint surfaces.
const SKIP_FILES = new Set(['index.js', 'core.js', 'operation-runner.js']);

/** Canonicalise a route path: strip origin/query except command, collapse params. */
function canonPath(raw) {
  let p = raw.trim();
  // isolate ?command=… (Fineract dispatches on it) before dropping other query
  let command = null;
  const cmd = p.match(/[?&]command=([a-zA-Z0-9_]+)/);
  if (cmd) command = cmd[1];
  p = p.split('?')[0];
  // ${x} template params and {x} spec params → {}
  p = p.replace(/\$\{[^}]*\}/g, '{}').replace(/\{[^}]*\}/g, '{}');
  // collapse duplicate slashes, strip trailing slash
  p = p.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
  return { path: p, command };
}

function keyOf(method, canon) {
  return `${method} ${canon.path}${canon.command ? `?command=${canon.command}` : ''}`;
}

/* ------------------------------------------------------------------ */
/* 1. Extract hand-written routes                                      */
/* ------------------------------------------------------------------ */
function extractHandwritten() {
  const routes = [];
  const files = fs
    .readdirSync(API_DIR)
    .filter((f) => f.endsWith('.js') && !SKIP_FILES.has(f))
    .filter((f) => fs.statSync(path.join(API_DIR, f)).isFile());

  // match self._g(`/path`  |  self._p('/path'  |  self._u("/path"
  const call = /self\.(_[gpud])\(\s*(['"`])([^'"`]*?)\2/g;

  for (const file of files) {
    const src = fs.readFileSync(path.join(API_DIR, file), 'utf8');
    const lines = src.split('\n');
    let m;
    while ((m = call.exec(src)) !== null) {
      const method = VERB[m[1]];
      const rawPath = m[3];
      if (!rawPath.startsWith('/')) continue; // skip dynamically-built paths
      const canon = canonPath(rawPath);
      const line = src.slice(0, m.index).split('\n').length;
      routes.push({
        method,
        rawPath,
        key: keyOf(method, canon),
        canonPath: canon.path,
        command: canon.command,
        file,
        line,
      });
    }
  }
  return routes;
}

/* ------------------------------------------------------------------ */
/* 2. Load the generated contract surface                              */
/* ------------------------------------------------------------------ */
async function loadContracts() {
  if (!fs.existsSync(GEN_CONTRACTS)) {
    throw new Error(
      `Missing ${path.relative(ROOT, GEN_CONTRACTS)} — run \`npm run api:all\` first.`
    );
  }
  const mod = await import(pathToFileURL(GEN_CONTRACTS).href);
  const CONTRACTS = mod.CONTRACTS || {};
  const out = [];
  for (const [operationId, c] of Object.entries(CONTRACTS)) {
    const canon = canonPath(c.path);
    out.push({
      operationId,
      method: (c.method || '').toUpperCase(),
      rawPath: c.path,
      key: keyOf((c.method || '').toUpperCase(), canon),
      canonPath: canon.path,
      command: canon.command,
      tag: c.tag || null,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 3. Diff                                                             */
/* ------------------------------------------------------------------ */
function diff(handwritten, contracts) {
  const hwByKey = new Map();
  for (const r of handwritten) {
    if (!hwByKey.has(r.key)) hwByKey.set(r.key, []);
    hwByKey.get(r.key).push(r);
  }
  const ctByKey = new Map(contracts.map((c) => [c.key, c]));

  // index contracts by (path + command) — ignoring only the HTTP method — so a
  // genuine method mismatch is "same endpoint, same command verb, wrong method".
  // A hand-written ?command=X whose X simply isn't in this spec is NOT a
  // mismatch (it's unverified); keying on command prevents that false positive.
  const endpointKey = (c) => `${c.canonPath}${c.command ? `?command=${c.command}` : ''}`;
  const ctByEndpoint = new Map();
  for (const c of contracts) {
    const k = endpointKey(c);
    if (!ctByEndpoint.has(k)) ctByEndpoint.set(k, []);
    ctByEndpoint.get(k).push(c);
  }

  const matched = [];
  const unverified = [];
  const mismatch = [];

  const seenHwKeys = new Set();
  for (const [key, group] of hwByKey) {
    seenHwKeys.add(key);
    if (ctByKey.has(key)) {
      matched.push({ key, count: group.length });
      continue;
    }
    // same endpoint (path + command) in contract, different HTTP method → bug
    const ep = `${group[0].canonPath}${group[0].command ? `?command=${group[0].command}` : ''}`;
    const samePath = ctByEndpoint.get(ep);
    if (samePath && samePath.length) {
      mismatch.push({
        key,
        file: group[0].file,
        line: group[0].line,
        handwritten: { method: group[0].method, command: group[0].command },
        contractCandidates: samePath.map((c) => ({
          operationId: c.operationId,
          method: c.method,
          command: c.command,
        })),
      });
    } else {
      unverified.push({
        key,
        file: group[0].file,
        line: group[0].line,
        rawPath: group[0].rawPath,
        method: group[0].method,
      });
    }
  }

  const uncovered = [];
  for (const c of contracts) {
    if (!seenHwKeys.has(c.key)) {
      uncovered.push({
        key: c.key,
        operationId: c.operationId,
        tag: c.tag,
      });
    }
  }

  return { matched, unverified, mismatch, uncovered };
}

/* ------------------------------------------------------------------ */
/* 4. Report                                                           */
/* ------------------------------------------------------------------ */
function toMarkdown(res, meta) {
  const L = [];
  L.push('# FinCraft — Hand-written API ↔ Contract Drift');
  L.push('');
  L.push(`_Generated ${new Date().toISOString()}_`);
  L.push('');
  L.push(
    `Contract source: **${meta.origin}** · contract operations: **${meta.contractOps}** · ` +
      `hand-written routes: **${meta.hwRoutes}** (across ${meta.hwFiles} modules)`
  );
  L.push('');
  L.push('| Bucket | Count | Meaning |');
  L.push('|---|---:|---|');
  L.push(`| ✅ Matched | ${res.matched.length} | hand-written route backed by a contract op |`);
  L.push(
    `| 🔴 Mismatch | ${res.mismatch.length} | same path, **wrong method/command** — likely a bug |`
  );
  L.push(
    `| 🟡 Unverified | ${res.unverified.length} | hand-written route with no contract op (wrong route, or op absent from this spec) |`
  );
  L.push(`| ⚪ Uncovered | ${res.uncovered.length} | contract op no UI route calls yet |`);
  L.push('');

  if (meta.sampleSpec) {
    L.push(
      '> ⚠️ **This run used the bundled sample spec (6 paths), not the full Fineract surface.** ' +
        'Unverified/Uncovered counts are meaningless until the pipeline runs against the real ' +
        '`apache/fineract` image in CI. Treat only 🔴 **Mismatch** as actionable here.'
    );
    L.push('');
  }

  if (res.mismatch.length) {
    L.push('## 🔴 Mismatches (method/command differs from contract)');
    L.push('');
    L.push('| Hand-written | Location | Contract candidate(s) |');
    L.push('|---|---|---|');
    for (const m of res.mismatch) {
      const cands = m.contractCandidates
        .map((c) => `\`${c.method} …${c.command ? `?command=${c.command}` : ''}\` (${c.operationId})`)
        .join('<br>');
      L.push(`| \`${m.key}\` | ${m.file}:${m.line} | ${cands} |`);
    }
    L.push('');
  }

  if (res.unverified.length) {
    L.push(`## 🟡 Unverified hand-written routes (${res.unverified.length})`);
    L.push('');
    L.push('| Route | Location |');
    L.push('|---|---|');
    for (const u of res.unverified.slice(0, 200)) {
      L.push(`| \`${u.key}\` | ${u.file}:${u.line} |`);
    }
    if (res.unverified.length > 200) L.push(`| …and ${res.unverified.length - 200} more | |`);
    L.push('');
  }

  if (res.uncovered.length) {
    L.push(`## ⚪ Uncovered contract operations (${res.uncovered.length})`);
    L.push('');
    L.push('| Operation | Route |');
    L.push('|---|---|');
    for (const u of res.uncovered.slice(0, 200)) {
      L.push(`| ${u.operationId} | \`${u.key}\` |`);
    }
    if (res.uncovered.length > 200) L.push(`| …and ${res.uncovered.length - 200} more | |`);
    L.push('');
  }

  return L.join('\n');
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  const handwritten = extractHandwritten();
  const contracts = await loadContracts();
  const res = diff(handwritten, contracts);

  let origin = 'unknown';
  let sampleSpec = false;
  try {
    const src = JSON.parse(fs.readFileSync(path.join(OUT_DIR, '.source.json'), 'utf8'));
    origin = src.origin || 'unknown';
    sampleSpec = /sample/i.test(origin);
  } catch {
    /* ignore */
  }

  const hwFiles = new Set(handwritten.map((r) => r.file)).size;
  const meta = {
    origin,
    sampleSpec,
    contractOps: contracts.length,
    hwRoutes: handwritten.length,
    hwFiles,
  };

  const json = {
    generatedAt: new Date().toISOString(),
    meta,
    summary: {
      matched: res.matched.length,
      mismatch: res.mismatch.length,
      unverified: res.unverified.length,
      uncovered: res.uncovered.length,
    },
    mismatch: res.mismatch,
    unverified: res.unverified,
    uncovered: res.uncovered,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'api-drift.json'), JSON.stringify(json, null, 2));
  const md = toMarkdown(res, meta);
  fs.writeFileSync(path.join(OUT_DIR, 'api-drift.md'), md);

  if (!JSON_ONLY) {
    console.log(md);
    console.log('');
    console.log(`→ wrote contracts/api-drift.json and contracts/api-drift.md`);
  }

  // Emit to the GitHub Actions job summary when present.
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
  }

  if (STRICT && res.mismatch.length > 0) {
    console.error(`\n✗ ${res.mismatch.length} method/command mismatch(es) — failing (--strict).`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exit(2);
});
