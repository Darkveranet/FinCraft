import fs from 'fs';
import path from 'path';
import assert from 'assert';

const testsDir = path.resolve(process.cwd(), 'tests');
if (!fs.existsSync(testsDir)) {
  console.log('No tests directory found.');
  process.exit(0);
}

const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));
if (!files.length) {
  console.log('No test files found.');
  process.exit(0);
}

/* ────────────────────────────────────────────────────────────────────────────
   Unhandled-rejection / uncaught-exception guard.

   Some bugs never throw *into* a test — they escape as an orphaned promise
   rejection or a stray async error (e.g. the Approval-Inbox loader that fired
   API calls it never awaited, so a rejected fetch became an unhandled
   rejection). Node's default is to print a raw stack and kill the process with
   a non-zero exit, which reads as an opaque CI failure with no attribution.

   This guard captures those events, attributes each to the test file that was
   running when it fired, keeps them from crashing the process mid-suite, and
   reports them at the end as real failures with a clear message.
   ──────────────────────────────────────────────────────────────────────────── */
const asyncErrors = [];
let currentFile = '(startup / between tests)';

function recordAsyncError(kind, err) {
  asyncErrors.push({ kind, file: currentFile, err });
  // Surface immediately too, so ordering vs. console output is obvious in the log.
  console.error(`\n⚠️  ${kind} during "${currentFile}":`);
  console.error('   ' + ((err && (err.stack || err.message)) || String(err)).split('\n').join('\n   '));
}

process.on('unhandledRejection', (reason) => recordAsyncError('Unhandled promise rejection', reason));
process.on('uncaughtException', (err) => recordAsyncError('Uncaught exception', err));

let passed = 0, failed = 0;
for (const file of files) {
  const p = path.join(testsDir, file);
  currentFile = file;
  try {
    const mod = await import('file://' + p);
    if (typeof mod.runTests !== 'function') {
      console.warn(`${file}: no exported runTests()`);
      continue;
    }
    await mod.runTests({ assert });
    console.log(`PASS: ${file}`);
    passed++;
  } catch (err) {
    console.error(`FAIL: ${file}`);
    console.error(err.stack || err);
    failed++;
  }
  /* Drain a macrotask tick while `currentFile` still points at this test, so an
     orphaned rejection scheduled during it is attributed to THIS file rather
     than to a later one or to teardown. */
  await new Promise(r => setTimeout(r, 0));
}
currentFile = '(teardown / after tests)';

/* Give any already-scheduled microtasks/timers a tick to surface late rejections
   before we tally results (e.g. a fire-and-forget promise that rejects just after
   its test's runTests() resolved). */
await new Promise(r => setTimeout(r, 50));

console.log(`\nTests: ${passed} passed, ${failed} failed`);

if (asyncErrors.length) {
  console.error(`\n${asyncErrors.length} unhandled async error(s) detected — these fail the run:`);
  for (const { kind, file, err } of asyncErrors) {
    const msg = (err && (err.message || String(err))) || 'unknown';
    console.error(`  - [${kind}] in ${file}: ${msg}`);
  }
  console.error('\nAn unhandled rejection usually means a promise was created but never awaited/caught\n(e.g. a fire-and-forget API call). Await it, or attach a .catch() handler.');
}

process.exit((failed || asyncErrors.length) ? 1 : 0);
