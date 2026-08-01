/**
 * diff-contracts.mjs — Pipeline step 10: "Contract Diff & Breaking-Change Detection"
 *
 * Compares the freshly normalised spec against the last committed snapshot
 * (contracts/openapi.snapshot.json) and classifies every change. The result
 * drives the workflow's decision diamond:
 *
 *   breaking === false  →  Auto Pull Request (ready for auto-merge)
 *   breaking === true   →  Draft PR + review label (requires review)
 *
 * Breaking = anything that can break an existing FinCraft caller:
 *   • an operation (path+method) was removed
 *   • a previously-required request field was added (callers now fail)
 *   • a response field that callers relied on was removed
 *   • a field's primitive type changed
 *   • enum values were removed
 *
 * Non-breaking (additive) = new operations, new optional request fields, new
 * response fields, new enum values.
 *
 * Outputs: contracts/diff-report.json, contracts/diff-report.md, and — when run
 * in CI — `breaking=<bool>` on $GITHUB_OUTPUT. First run (no snapshot) is treated
 * as a non-breaking baseline.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import { readJsonIfExists, writeJson, writeText, repoPath, log } from './lib/spec-io.mjs';

function indexOps(contracts) {
  return contracts; // CONTRACTS is already keyed by operationId; keep as-is.
}

/** Load the CONTRACTS object from the generated module without importing it. */
function loadContracts() {
  const p = repoPath('js', 'api', 'generated', 'contracts.generated.js');
  const src = require_text(p);
  const m = src.match(/export const CONTRACTS = ([\s\S]*?);\n\nexport function contractFor/);
  if (!m) throw new Error('Could not parse CONTRACTS from contracts.generated.js');
  return JSON.parse(m[1]);
}

function require_text(p) {
  return readFileSync(p, 'utf8');
}

function fieldMap(schema) {
  if (schema && schema.type === 'object' && schema.fields) return schema.fields;
  return {};
}

function diffOperation(id, prev, next, changes) {
  // Request fields.
  const pr = fieldMap(prev.request);
  const nr = fieldMap(next.request);
  for (const [name, f] of Object.entries(nr)) {
    if (!pr[name] && f.required) changes.push({ level: 'breaking', op: id, kind: 'new-required-request-field', field: name });
    else if (!pr[name]) changes.push({ level: 'additive', op: id, kind: 'new-request-field', field: name });
  }
  for (const [name, f] of Object.entries(pr)) {
    if (nr[name] && nr[name].type !== f.type) changes.push({ level: 'breaking', op: id, kind: 'request-type-change', field: name, from: f.type, to: nr[name].type });
    if (nr[name] && Array.isArray(f.enum) && Array.isArray(nr[name].enum)) {
      const removed = f.enum.filter((v) => !nr[name].enum.includes(v));
      if (removed.length) changes.push({ level: 'breaking', op: id, kind: 'request-enum-removed', field: name, removed });
    }
  }
  // Response fields.
  const ps = fieldMap(prev.response);
  const ns = fieldMap(next.response);
  for (const [name, f] of Object.entries(ps)) {
    if (!ns[name]) changes.push({ level: 'breaking', op: id, kind: 'removed-response-field', field: name });
    else if (ns[name].type !== f.type) changes.push({ level: 'breaking', op: id, kind: 'response-type-change', field: name, from: f.type, to: ns[name].type });
  }
  for (const name of Object.keys(ns)) if (!ps[name]) changes.push({ level: 'additive', op: id, kind: 'new-response-field', field: name });
}

export function diffContracts() {
  const next = indexOps(loadContracts());
  const snapshotPath = repoPath('contracts', 'openapi.snapshot.json');
  const prev = readJsonIfExists(snapshotPath);

  const changes = [];
  let firstRun = false;

  if (!prev) {
    firstRun = true;
  } else {
    const prevContracts = prev.contracts || prev;
    // Removed / added operations.
    for (const id of Object.keys(prevContracts)) if (!next[id]) changes.push({ level: 'breaking', op: id, kind: 'removed-operation' });
    for (const id of Object.keys(next)) if (!prevContracts[id]) changes.push({ level: 'additive', op: id, kind: 'new-operation' });
    // Field-level diffs on shared operations.
    for (const id of Object.keys(next)) if (prevContracts[id]) diffOperation(id, prevContracts[id], next[id], changes);
  }

  const breaking = changes.some((c) => c.level === 'breaking');
  const additive = changes.filter((c) => c.level === 'additive');
  const breakingList = changes.filter((c) => c.level === 'breaking');

  const report = {
    generatedAt: new Date().toISOString(),
    firstRun,
    breaking,
    counts: { total: changes.length, breaking: breakingList.length, additive: additive.length },
    changes,
  };
  writeJson(repoPath('contracts', 'diff-report.json'), report);
  writeText(repoPath('contracts', 'diff-report.md'), renderMarkdown(report));

  // Refresh the snapshot so the *next* run diffs against this one.
  writeJson(snapshotPath, { generatedAt: report.generatedAt, contracts: next });

  // Signal the workflow decision diamond.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `breaking=${breaking}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `changes=${changes.length}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `first_run=${firstRun}\n`);
  }

  log(
    firstRun
      ? 'diff — first run: baseline snapshot written (non-breaking).'
      : `diff — ${changes.length} change(s): ${breakingList.length} breaking, ${additive.length} additive. breaking=${breaking}`,
  );
  return report;
}

function renderMarkdown(r) {
  const lines = ['# Contract Diff Report', '', `_Generated ${r.generatedAt}_`, ''];
  if (r.firstRun) {
    lines.push('First run — no previous snapshot. A baseline was recorded; no changes to review.');
    return lines.join('\n');
  }
  lines.push(
    `**Result:** ${r.breaking ? '🚨 Breaking changes detected — requires review' : '✅ Additive only — safe to auto-merge'}`,
    '',
    `- Total changes: **${r.counts.total}**`,
    `- Breaking: **${r.counts.breaking}**`,
    `- Additive: **${r.counts.additive}**`,
    '',
  );
  const group = (title, arr) => {
    if (!arr.length) return;
    lines.push(`## ${title}`, '', '| Operation | Change | Field | Detail |', '| --- | --- | --- | --- |');
    for (const c of arr) {
      const detail = c.from ? `${c.from} → ${c.to}` : c.removed ? `removed: ${c.removed.join(', ')}` : '';
      lines.push(`| \`${c.op}\` | ${c.kind} | ${c.field || ''} | ${detail} |`);
    }
    lines.push('');
  };
  group('🚨 Breaking', r.changes.filter((c) => c.level === 'breaking'));
  group('➕ Additive', r.changes.filter((c) => c.level === 'additive'));
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) diffContracts();
