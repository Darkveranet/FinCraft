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
const VERB_SET = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
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

/** Read a backtick template-literal argument starting at `start` (just past the
 *  opening backtick), tracking `${ ... }` nesting depth so a backtick that
 *  appears INSIDE a `${...}` substitution (e.g. a nested template literal in a
 *  ternary: `${cond ? `/${x}` : ''}`) does not prematurely terminate the
 *  match. Returns { value, end } (end = index just past the closing backtick)
 *  or null if unterminated. */
function readBacktickLiteral(src, start) {
  let i = start;
  let depth = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') { i += 2; continue; }
    if (depth === 0 && ch === '`') return { value: src.slice(start, i), end: i + 1 };
    if (ch === '$' && src[i + 1] === '{') { depth++; i += 2; continue; }
    if (depth > 0 && ch === '}') { depth--; i += 1; continue; }
    i += 1;
  }
  return null;
}

/** Read a single/double-quoted string argument starting at `start`.
 *  Returns { value, end } or null if unterminated. */
function readSimpleString(src, start, quote) {
  let i = start;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === quote) return { value: src.slice(start, i), end: i + 1 };
    i += 1;
  }
  return null;
}

/** Read a quoted string argument (any of ' " `) starting AT the opening
 *  quote character (index `at` points to the quote itself). Returns
 *  { value, end } or null. */
function readQuotedAt(src, at) {
  const q = src[at];
  if (q !== "'" && q !== '"' && q !== '`') return null;
  const r = q === '`' ? readBacktickLiteral(src, at + 1) : readSimpleString(src, at + 1, q);
  return r;
}

function extractHandwritten() {
  const routes = [];
  const files = fs.readdirSync(API_DIR)
    .filter((f) => f.endsWith('.js') && !SKIP_FILES.has(f))
    .filter((f) => fs.statSync(path.join(API_DIR, f)).isFile());

  const push = (routes, file, src, index, method, rawPath) => {
    if (!rawPath.startsWith('/')) return;
    const canon = canonPath(rawPath);
    const line = src.slice(0, index).split('\n').length;
    routes.push({
      method, rawPath, key: keyOf(method, canon),
      canonPath: canon.path, command: canon.command,
      dynamic: canon.dynamic, file, line,
    });
  };

  for (const file of files) {
    const src = fs.readFileSync(path.join(API_DIR, file), 'utf8');

    // Pass 1: self._g/_p/_u/_d('path', ...)
    const callHead = /self\.(_[gpud])\(\s*(['"`])/g;
    let m;
    while ((m = callHead.exec(src)) !== null) {
      const method = VERB[m[1]];
      const argStart = m.index + m[0].length - 1; // back up to the quote char itself
      const read = readQuotedAt(src, argStart);
      if (!read) continue;
      push(routes, file, src, m.index, method, read.value);
    }

    // Pass 2: self._req('METHOD', 'path', ...) — a lower-level escape hatch
    // used for raw responses, FormData uploads, and generic entity/template
    // helpers (twofactor, batches, documents, images, bulk-import templates).
    // Same route surface, different call shape — must not be invisible to drift.
    const reqHead = /self\._req\(\s*/g;
    while ((m = reqHead.exec(src)) !== null) {
      const methodStart = m.index + m[0].length;
      const methodRead = readQuotedAt(src, methodStart);
      if (!methodRead) continue;
      const method = methodRead.value.toUpperCase();
      if (!VERB_SET.has(method)) continue;
      let i = methodRead.end;
      while (/\s/.test(src[i])) i++;
      if (src[i] !== ',') continue;
      i++;
      while (/\s/.test(src[i])) i++;
      const pathRead = readQuotedAt(src, i);
      if (!pathRead) continue;
      push(routes, file, src, m.index, method, pathRead.value);
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

/** Load the intended-external allowlist: routes we've explicitly verified are
 *  absent from THIS contract on purpose (a different Fineract API surface,
 *  e.g. the Self-Service API, or an undocumented-in-spec area like Share
 *  accounts). Each entry needs a reason — no blanket suppression. */
function loadExternalAllowlist() {
  const p = path.join(__dirname, 'external-routes.json');
  if (!fs.existsSync(p)) return [];
  const list = JSON.parse(fs.readFileSync(p, 'utf8'));
  return list.map((e) => ({ ...e, re: new RegExp('^' + e.pattern + '$') }));
}

/** For an unresolved hand-written route, try wildcarding exactly one static
 *  path segment at a time and see if that resolves to a real contract key.
 *  Handles cases like `/externalservice/SMS` being a literal call into a
 *  contract op whose path is actually `/externalservice/{servicename}` — the
 *  hand-written code passes a concrete value instead of a variable, so the
 *  normal `${...}` -> `{}` collapse never fires. Only accepted when exactly
 *  one wildcard variant matches, to avoid ambiguous false positives. */
function findLiteralParamMatch(r, ctByKey) {
  const segments = r.canonPath.split('/');
  const hits = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === '{}' || segments[i] === '') continue;
    const variant = [...segments];
    variant[i] = '{}';
    const candidateKey = `${r.method} ${variant.join('/')}`;
    if (ctByKey.has(candidateKey)) hits.push(ctByKey.get(candidateKey));
  }
  return hits.length === 1 ? hits[0] : null;
}

function diff(handwritten, contracts) {
  const ctByKey = new Map(contracts.map((c) => [c.key, c]));
  const ctByPath = new Map();
  for (const c of contracts) {
    if (!ctByPath.has(c.canonPath)) ctByPath.set(c.canonPath, []);
    ctByPath.get(c.canonPath).push(c);
  }
  const externalAllowlist = loadExternalAllowlist();

  const matched = new Set();      // hw method+path keys that hit a contract op
  const literalParam = [];        // matched, but only via a wildcarded literal segment
  const mismatch = [];
  const unverified = [];
  const external = [];
  const dynamic = [];
  const seenHwKeys = new Set();

  for (const r of handwritten) {
    if (r.dynamic) { dynamic.push(r); continue; }
    if (seenHwKeys.has(r.key)) { matched.has(r.key) && matched.add(r.key); continue; }
    seenHwKeys.add(r.key);

    if (ctByKey.has(r.key)) { matched.add(r.key); continue; }

    const literalHit = findLiteralParamMatch(r, ctByKey);
    if (literalHit) {
      matched.add(r.key);
      seenHwKeys.add(literalHit.key); // mark the contract op's real key covered too, else it double-counts as Uncovered
      literalParam.push({ key: r.key, file: r.file, line: r.line, operationId: literalHit.operationId });
      continue;
    }

    const samePath = ctByPath.get(r.canonPath);
    if (samePath && samePath.length) {
      mismatch.push({
        key: r.key, file: r.file, line: r.line,
        handwrittenMethod: r.method,
        contractCandidates: samePath.map((c) => ({ operationId: c.operationId, method: c.method })),
      });
      continue;
    }

    const allow = externalAllowlist.find((e) => e.re.test(r.key));
    if (allow) {
      external.push({ key: r.key, file: r.file, line: r.line, reason: allow.reason });
    } else {
      unverified.push({ key: r.key, file: r.file, line: r.line, rawPath: r.rawPath });
    }
  }

  const uncovered = contracts.filter((c) => !seenHwKeys.has(c.key));
  const matchedOps = contracts.filter((c) => seenHwKeys.has(c.key));

  return {
    matched: [...matched],
    literalParam, mismatch, unverified, external, uncovered, matchedOps, dynamic,
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
  L.push(`| 🟡 Unverified | ${res.unverified.length} | hand-written path absent from the contract, unexplained |`);
  L.push(`| ⚫ External | ${res.external.length} | absent from this contract, explicitly allowlisted (see reason) |`);
  L.push(`| ⚪ Uncovered | ${res.uncovered.length} | contract op no UI route reaches (backlog) |`);
  L.push(`| ⚙️ Dynamic | ${res.dynamic.length} | unresolved dynamic path (skipped) |`, '');
  if (res.literalParam.length) {
    const distinctOps = new Set(res.literalParam.map((l) => l.operationId)).size;
    const extra = res.literalParam.length - distinctOps;
    L.push(`_${res.literalParam.length} of the Matched routes only matched via a wildcarded literal ` +
           `path segment (e.g. \`/externalservice/SMS\` against contract op \`/externalservice/{servicename}\`) ` +
           `— code-quality note, not a drift bug; see "Matched via literal segment" below._`, '');
    L.push(`_Note: Matched counts hand-written endpoints, not distinct contract ops, so ` +
           `Matched + Uncovered will exceed total contract ops by **${extra}** — that's ${res.literalParam.length} ` +
           `hand-written routes collapsing onto only ${distinctOps} distinct contract ops (e.g. 4 literal ` +
           `\`externalservice/*\` routes all hit the same parameterized op). ` +
           `Distinct contract ops actually covered = ${meta.contractOps} − ${res.uncovered.length} = ` +
           `${meta.contractOps - res.uncovered.length}; the identity that always holds is ` +
           `Matched + External + Unverified = unique hand-written endpoints (${meta.hwEndpoints})._`, '');
  }

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
  section('⚫ External (allowlisted)', res.external, (e) => `- \`${e.key}\` (${e.file}:${e.line}) — ${e.reason}`);
  section('⚪ Uncovered', res.uncovered, (u) => `- ${u.operationId} — \`${u.key}\``);
  section('⚙️ Dynamic', res.dynamic, (d) => `- \`${d.method} ${d.rawPath}\` (${d.file}:${d.line})`);
  section('🔎 Matched via literal segment (code-quality note)', res.literalParam,
    (l) => `- \`${l.key}\` (${l.file}:${l.line}) → ${l.operationId}`);
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
      unverified: res.unverified.length, external: res.external.length,
      uncovered: res.uncovered.length, dynamic: res.dynamic.length,
      literalParam: res.literalParam.length,
    },
    mismatch: res.mismatch, unverified: res.unverified, external: res.external,
    uncovered: res.uncovered, dynamic: res.dynamic, literalParam: res.literalParam,
    matchedOps: res.matchedOps,
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
