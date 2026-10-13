/**
 * Role: fails when a folder has no README.md explaining its content (skill folders documented by SKILL.md are accepted).
 * Owner: shared
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const checkFolderReadmes = (root, dirs) =>
  dirs
    .filter((d) => !existsSync(join(root, d, 'README.md')) && !existsSync(join(root, d, 'SKILL.md')))
    .map((d) => `${d}/: missing README.md`);
