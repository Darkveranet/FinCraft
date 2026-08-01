/**
 * run.mjs — Pipeline orchestrator.
 *
 * Runs the full contract-driven flow end-to-end, in the order of the FinCraft
 * architecture diagram:
 *
 *   1. fetch-spec        Generate OpenAPI 3.0.3 Spec       (source of truth)
 *   2. normalize-spec    Validate & Normalize Spec
 *   3. generate-client   Generate API Client
 *   4. generate-contracts Generate Payload Contracts
 *   5. generate-validators Generate Runtime Validators + Payload Builders
 *   6. attach-templates  Attach Fineract Template Endpoints
 *   7. generate-aliases  Generate FinCraft-friendly Command Aliases
 *   8. diff-contracts    Contract Diff & Breaking-Change Detection → decision
 *
 * Flags:
 *   --skip-fetch   reuse the existing contracts/openapi.raw.json (offline dev)
 *   --generate     run only the generation steps (assumes a normalized spec)
 */
import { fetchSpec } from './fetch-spec.mjs';
import { normalizeSpec } from './normalize-spec.mjs';
import { generateClient } from './generate-client.mjs';
import { generateContracts } from './generate-contracts.mjs';
import { generateValidators } from './generate-validators.mjs';
import { attachTemplates } from './attach-templates.mjs';
import { generateAliases } from './generate-aliases.mjs';
import { diffContracts } from './diff-contracts.mjs';
import { writeText, repoPath, generatedBanner, log } from './lib/spec-io.mjs';

function writeIndex() {
  const body = [
    generatedBanner('tools/api-automation/run.mjs'),
    '',
    "export * from './client.generated.js';",
    "export * from './contracts.generated.js';",
    "export * from './validators.generated.js';",
    "export * from './builders.generated.js';",
    "export * from './templates.generated.js';",
    "export * from './aliases.generated.js';",
    '',
  ].join('\n');
  writeText(repoPath('js', 'api', 'generated', 'index.js'), body);
}

export async function run(argv = process.argv.slice(2)) {
  const flags = new Set(argv);
  const t0 = Date.now();

  if (!flags.has('--skip-fetch') && !flags.has('--generate')) await fetchSpec();
  if (!flags.has('--generate')) normalizeSpec();

  generateClient();
  generateContracts();
  generateValidators();
  attachTemplates();
  generateAliases();
  writeIndex();

  const diff = diffContracts();

  log(`pipeline complete in ${((Date.now() - t0) / 1000).toFixed(1)}s — breaking=${diff.breaking}`);
  return diff;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error('[api-automation] pipeline FAILED:', e.stack || e.message);
    process.exit(1);
  });
}
