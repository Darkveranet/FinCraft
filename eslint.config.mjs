/* ────────────────────────────────────────────────────────────────────────────
   FinCraft · eslint.config.mjs  (flat config)

   Deliberately minimal — no framework plugins, matching the project's near-zero
   dependency philosophy. Its jobs (§4 of the developer-recommendations report):
     • catch unused vars / undeclared globals early,
     • pair with Prettier for consistent formatting (Prettier owns style; ESLint
       does not fight it — no stylistic rules enabled here),
     • enforce the escaping convention via the local custom rule.

   Install:  npm i -D eslint globals
   Run:      npx eslint .            (or `npm run lint`)
   ──────────────────────────────────────────────────────────────────────────── */
import globals from 'globals';
import noUnescapedInnerhtml from './eslint-rules/no-unescaped-innerhtml.mjs';

const local = {
  rules: { 'no-unescaped-innerhtml': noUnescapedInnerhtml },
};

export default [
  {
    ignores: [
      'node_modules/**',
      'deploy/**',
      'package-lock.json',
      // Vendored / generated preview pages are not source we lint.
      'preview-*.html',
    ],
  },

  // Browser application source.
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: { local },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],

      // The headline rule. Now 'error': the scan-innerhtml baseline has been
      // burned down to empty (2026-07-28) — every remaining innerHTML/outerHTML
      // interpolation either routes through an escaping/formatting helper or
      // carries an audited `scan-allow-innerhtml` suppression (numeric IDs,
      // code-defined labels, computed dates, pre-escaped HTML fragments). Any NEW
      // raw interpolation now fails `eslint .` as well as the standalone
      // scan_unescaped_innerhtml.mjs CI gate.
      'local/no-unescaped-innerhtml': 'error',
    },
  },

  // Node scripts / tooling / tests.
  {
    files: ['tests/**/*.js', 'test-runner/**/*.js', 'scan_*.mjs', 'eslint-rules/**/*.mjs', 'eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // Service worker has its own global scope.
  {
    files: ['service-worker.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.serviceworker },
    },
  },
];
