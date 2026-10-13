/**
 * Role: Vitest configuration for the whole monorepo (unit tests live next to the code as *.test.ts).
 * Owner: shared
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{apps,packages,tools}/**/src/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tools/map-pipeline/legacy/**'],
    environment: 'node',
    passWithNoTests: true,
  },
});
