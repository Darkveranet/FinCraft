/**
 * fetch-spec.mjs  — Pipeline step 1: "Generate OpenAPI 3.0.3 Spec"
 *
 * Obtains the authoritative Apache Fineract OpenAPI document (source of truth)
 * and writes it to contracts/openapi.raw.json.
 *
 * Resolution order (first hit wins):
 *   1. $FINERACT_SPEC_URL          — direct URL to an OpenAPI JSON/YAML doc.
 *   2. $FINERACT_BASE_URL          — a running Fineract; tries its published
 *                                    spec endpoints.
 *   3. $FINERACT_IMAGE             — a Fineract Docker image (e.g.
 *                                    apache/fineract:latest); reads the static
 *                                    spec baked into it via `docker cp` — NO
 *                                    running instance or database required.
 *   4. tools/api-automation/cache/fineract.openapi.json — a committed cache so
 *                                    CI and offline runs are deterministic.
 *   5. tools/api-automation/sample-spec.json — trimmed fallback so the pipeline
 *                                    is always runnable (dev / first bootstrap).
 *
 * Fineract ships OpenAPI 3.0.x already; if a Swagger 2.0 doc is detected we fail
 * loudly rather than silently mis-generate (conversion is a normalize concern).
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { readJson, writeJson, repoPath, TOOL_ROOT, log } from './lib/spec-io.mjs';
import { resolve, join } from 'node:path';

const CANDIDATE_PATHS = [
  '/fineract-provider/swagger-ui/fineract.json',
  '/fineract-provider/legacy-docs/apiLive.json',
  '/fineract-provider/actuator/openapi',
];

// The OpenAPI document is a static file baked into the apache/fineract image,
// so it can be read with a plain `docker cp` — no database, no Spring boot.
// (The HTTP endpoint serves identical bytes, but only after a multi-minute boot.)
const CANDIDATE_IMAGE_PATHS = [
  '/app/resources/static/fineract.json',
  '/app/resources/static/swagger-ui/fineract.json',
];

async function fetchUrl(url) {
  log('fetching spec from', url);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Response from ${url} was not JSON (YAML specs must be pre-converted).`);
  }
}

async function fromBaseUrl(base) {
  const clean = base.replace(/\/$/, '');
  const errors = [];
  for (const p of CANDIDATE_PATHS) {
    try {
      return await fetchUrl(clean + p);
    } catch (e) {
      errors.push(`${p}: ${e.message}`);
    }
  }
  throw new Error(`No spec endpoint responded on ${clean}:\n  - ${errors.join('\n  - ')}`);
}

/**
 * Pull the static OpenAPI file out of a Fineract Docker image without running
 * it. Creates (not runs) a throwaway container, `docker cp`s the spec, removes
 * the container. Requires the docker CLI on PATH — fails loudly if the image
 * layout has changed so a silent mis-generate is impossible.
 */
function fromImage(imageRef) {
  const sh = (args) => execFileSync('docker', args, { encoding: 'utf8' }).trim();
  log('extracting spec from image', imageRef);

  const cid = sh(['create', imageRef]);
  const tmp = mkdtempSync(join(tmpdir(), 'fineract-spec-'));
  try {
    const errors = [];
    for (const p of CANDIDATE_IMAGE_PATHS) {
      const dest = join(tmp, 'spec.json');
      try {
        execFileSync('docker', ['cp', `${cid}:${p}`, dest], { stdio: 'pipe' });
        const spec = JSON.parse(readFileSync(dest, 'utf8'));
        log(`found spec at ${p}`);
        return spec;
      } catch (e) {
        errors.push(`${p}: ${e.message.split('\n')[0]}`);
      }
    }
    throw new Error(
      `No spec file found in image ${imageRef}. Layout may have changed:\n  - ${errors.join('\n  - ')}`,
    );
  } finally {
    try {
      execFileSync('docker', ['rm', '-f', cid], { stdio: 'ignore' });
    } catch {
      /* container already gone — ignore */
    }
    rmSync(tmp, { recursive: true, force: true });
  }
}

async function resolveSpec() {
  if (process.env.FINERACT_SPEC_URL) {
    return { spec: await fetchUrl(process.env.FINERACT_SPEC_URL), origin: process.env.FINERACT_SPEC_URL };
  }
  if (process.env.FINERACT_BASE_URL) {
    return { spec: await fromBaseUrl(process.env.FINERACT_BASE_URL), origin: process.env.FINERACT_BASE_URL };
  }
  if (process.env.FINERACT_IMAGE) {
    return { spec: fromImage(process.env.FINERACT_IMAGE), origin: `image:${process.env.FINERACT_IMAGE}` };
  }
  const cache = resolve(TOOL_ROOT, 'cache', 'fineract.openapi.json');
  if (existsSync(cache)) {
    log('no URL configured — using committed cache', cache);
    return { spec: readJson(cache), origin: 'cache/fineract.openapi.json' };
  }
  const sample = resolve(TOOL_ROOT, 'sample-spec.json');
  log('no URL or cache — using bundled sample-spec.json (bootstrap mode)');
  return { spec: readJson(sample), origin: 'sample-spec.json' };
}

function assertOpenApi3(spec) {
  if (spec.swagger && /^2/.test(String(spec.swagger))) {
    throw new Error('Swagger 2.0 detected. Convert to OpenAPI 3.0.3 before ingest.');
  }
  if (!spec.openapi || !/^3\./.test(String(spec.openapi))) {
    throw new Error(`Unexpected OpenAPI version: ${spec.openapi}. Expected 3.0.x.`);
  }
  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('Spec has no `paths` object — refusing to continue.');
  }
}

export async function fetchSpec() {
  const { spec, origin } = await resolveSpec();
  assertOpenApi3(spec);
  const out = repoPath('contracts', 'openapi.raw.json');
  writeJson(out, spec);
  const opCount = Object.values(spec.paths).reduce(
    (n, item) => n + Object.keys(item).filter((k) => ['get', 'post', 'put', 'delete', 'patch'].includes(k)).length,
    0,
  );
  log(`spec OK — ${Object.keys(spec.paths).length} paths, ${opCount} operations, origin=${origin}`);
  writeJson(repoPath('contracts', '.source.json'), { origin, fetchedAt: new Date().toISOString(), openapi: spec.openapi });
  return spec;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchSpec().catch((e) => {
    console.error('[api-automation] fetch-spec FAILED:', e.message);
    process.exit(1);
  });
}
