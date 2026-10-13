/**
 * Role: finds the monorepo root (folder holding pnpm-workspace.yaml) so every config path is repository-relative on any OS.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const findRepoRoot = (startDir: string): string => {
  let dir = startDir;
  while (!existsSync(join(dir, 'pnpm-workspace.yaml'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`no pnpm-workspace.yaml found above ${startDir}`);
    dir = parent;
  }
  return dir;
};
