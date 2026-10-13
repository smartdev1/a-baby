/**
 * Role: fails when a source file does not declare its role in a "Role:" header within its first 6 lines.
 * Owner: shared
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CHECKED_EXTENSIONS = /\.(ts|tsx|js|mjs|cjs|css|html|ya?ml|prisma|sh)$/;
const HEADER_LINES = 6;
/** JSON cannot hold comments: JSON files are documented by their folder README (tsconfig files use a "//" key). */
const EXEMPT = [/^tools\/map-pipeline\/legacy\//, /\.d\.ts$/, /^pnpm-lock\.yaml$/];

export const checkFileHeaders = (root, files) =>
  files
    .filter((f) => CHECKED_EXTENSIONS.test(f) && !EXEMPT.some((re) => re.test(f)))
    .filter((f) => !readFileSync(join(root, f), 'utf8').split('\n').slice(0, HEADER_LINES).some((l) => l.includes('Role:')))
    .map((f) => `${f}: missing "Role:" header in the first ${HEADER_LINES} lines`);
