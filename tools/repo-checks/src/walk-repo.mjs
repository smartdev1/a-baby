/**
 * Role: lists the folders and files of the repository that the hygiene checks inspect (skips dependencies, builds, git, archives).
 * Owner: shared
 */

import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SKIPPED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', 'playwright-report', 'test-results', '.vite']);
const SKIPPED_PREFIXES = ['docs/archive/', 'data/cache/', 'data/build/', 'data/runtime/'];

const toPosix = (path) => path.split(sep).join('/');

/** Returns { dirs, files } as repo-relative POSIX paths. */
export const walkRepo = (root) => {
  const dirs = [];
  const files = [];
  const visit = (absDir) => {
    for (const entry of readdirSync(absDir, { withFileTypes: true })) {
      const abs = join(absDir, entry.name);
      const rel = toPosix(relative(root, abs));
      if (SKIPPED_PREFIXES.some((p) => `${rel}/`.startsWith(p))) continue;
      if (entry.isDirectory()) {
        if (SKIPPED_DIRS.has(entry.name)) continue;
        dirs.push(rel);
        visit(abs);
      } else {
        files.push(rel);
      }
    }
  };
  visit(root);
  return { dirs, files };
};
