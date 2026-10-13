/**
 * Role: Vitest configuration for the whole monorepo (unit tests live next to the code as *.test.ts).
 * Owner: shared
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{apps,packages,tools}/**/src/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['{apps,packages,tools}/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts'],
      // ≥ 85 % lines on pure packages that hold code (add each pure package here when it gets code).
      thresholds: {
        'packages/geo/src/**': { lines: 85 },
        'packages/tile-format/src/**': { lines: 85 },
        'packages/protocol/src/**': { lines: 85 },
        'packages/physics/src/**': { lines: 85 },
      },
    },
  },
});
