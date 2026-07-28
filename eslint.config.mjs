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

      // The headline rule. Kept as 'warn' for now: the standalone
      // scan_unescaped_innerhtml.mjs (baseline-ratcheted) is the BLOCKING CI gate,
      // while this gives editor squiggles without failing local `eslint .` on the
      // ~84 reviewed-legacy interpolations. Flip to 'error' once the baseline is
      // burned down.
      'local/no-unescaped-innerhtml': 'warn',
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
