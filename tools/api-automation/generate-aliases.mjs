/**
 * generate-aliases.mjs — Pipeline step 9: "Generate FinCraft-friendly Command Aliases"
 *
 * Turns raw operationIds into human command-palette entries in the shape cmd.js
 * already consumes: { id, label, cat, operationId, method, path }. It derives a
 * verb + noun label ("Create Client", "Approve Loan") from the HTTP method and
 * the `command=` query flag Fineract uses for lifecycle actions.
 *
 * Emits js/api/generated/aliases.generated.js. cmd.js can spread these into its
 * command list so every contract operation is reachable via ⌘K.
 */
import { readJson, writeText, repoPath, generatedBanner, log } from './lib/spec-io.mjs';
import { listOperations, resourceOf } from './lib/openapi.mjs';

const VERB_LABEL = { get: 'View', post: 'Create', put: 'Update', delete: 'Delete', patch: 'Update' };
const ICON = {
  clients: 'fa-solid fa-user',
  loans: 'fa-solid fa-hand-holding-dollar',
  savings: 'fa-solid fa-piggy-bank',
  accounting: 'fa-solid fa-book',
  reports: 'fa-solid fa-chart-line',
  treasury: 'fa-solid fa-vault',
};

function titleCase(s) {
  return String(s)
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function label(op, resource) {
  const cmd = /[?&]command=([^&]+)/.exec(op.path);
  const noun = titleCase(resource.replace(/s$/, ''));
  if (cmd) return `${titleCase(cmd[1])} ${noun}`;
  const isCollection = !/\}$/.test(op.path) && op.method === 'get';
  const verb = isCollection ? 'List' : VERB_LABEL[op.method] || 'Run';
  return `${verb} ${noun}`;
}

export function generateAliases() {
  const doc = readJson(repoPath('contracts', 'openapi.normalized.json'));
  const ops = listOperations(doc);
  const aliases = [];
  const seen = new Set();

  for (const op of ops.sort((a, b) => a.operationId.localeCompare(b.operationId))) {
    const resource = resourceOf(op);
    let id = `api:${op.operationId}`;
    while (seen.has(id)) id += 'X';
    seen.add(id);
    aliases.push({
      id,
      label: label(op, resource),
      cat: titleCase(resource),
      icon: ICON[resource] || 'fa-solid fa-terminal',
      operationId: op.operationId,
      method: op.method.toUpperCase(),
      path: op.path,
    });
  }

  const body = [
    generatedBanner('contracts/openapi.normalized.json'),
    '',
    '/* eslint-disable */',
    '// FinCraft command-palette aliases for every contract operation.',
    '// Shape matches js/cmd.js entries; `run` is attached by the consumer so this',
    '// file stays pure data (and diff-friendly).',
    'export const API_ALIASES = ' + JSON.stringify(aliases, null, 2) + ';',
    '',
    '/**',
    ' * Adapt aliases into runnable cmd.js entries.',
    ' * @param {(alias) => Function} makeRun  builds the click handler per alias',
    ' */',
    'export function toCommands(makeRun) {',
    '  return API_ALIASES.map((a) => ({ ...a, run: makeRun(a) }));',
    '}',
    '',
  ].join('\n');

  writeText(repoPath('js', 'api', 'generated', 'aliases.generated.js'), body);
  log(`aliases — ${aliases.length} command aliases → js/api/generated/aliases.generated.js`);
  return aliases;
}

if (import.meta.url === `file://${process.argv[1]}`) generateAliases();
