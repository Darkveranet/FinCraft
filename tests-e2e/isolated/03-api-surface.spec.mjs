import { test, expect } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path';
test('FinCraft API modules remain represented by E2E coverage manifest', async () => {
  const apiFiles=fs.readdirSync('js/api').filter(f=>f.endsWith('.js')).sort();
  const manifest=JSON.parse(fs.readFileSync('tests-e2e/coverage-manifest.json','utf8'));
  const declared=new Set(Object.values(manifest.modules).flatMap(x=>x.apiFiles||[]));
  const missing=apiFiles.filter(f=>!declared.has(f));
  expect(missing,`Add every API module to coverage-manifest.json: ${missing.join(', ')}`).toEqual([]);
});
