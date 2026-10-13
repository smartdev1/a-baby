/**
 * Role: ESLint flat config enforcing the modularity and safety rules of ARCHITECTURE §9 (sizes, complexity, no any, no floating promises).
 * Owner: shared
 */

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'docs/archive/**',
      'data/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.ts', '*.js', '*.cjs', 'tools/repo-checks/src/*.mjs'] },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    rules: {
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 12],
      'max-params': ['error', 4],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Use SeededRng (ARCHITECTURE §9.2).' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Game rules use the world clock only (ADR 0011): no real-time clock in simulation and rule packages.
    files: ['packages/sim-*/src/**/*.ts', 'packages/economy-rules/src/**/*.ts', 'packages/business-rules/src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "MemberExpression[object.name='Date'][property.name='now']", message: 'Use the world clock segment, not Date.now() (ADR 0011).' },
        { selector: "NewExpression[callee.name='Date']", message: 'Use the world clock segment, not new Date() (ADR 0011).' },
      ],
    },
  },
  {
    files: ['tools/latency-probe/page/**/*.mjs'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { 'max-lines': ['error', { max: 600 }], 'max-lines-per-function': 'off' },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
