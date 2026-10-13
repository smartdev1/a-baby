/**
 * Role: runs every repository hygiene check and exits with code 1 if any rule is violated (used by `pnpm lint`).
 * Owner: shared
 */

import { resolve } from 'node:path';
import { checkFileHeaders } from './check-file-headers.mjs';
import { checkFolderReadmes } from './check-folder-readmes.mjs';
import { checkSourceLayout } from './check-source-layout.mjs';
import { walkRepo } from './walk-repo.mjs';

const root = resolve(process.argv[2] ?? '.');
const { dirs, files } = walkRepo(root);
const problems = [...checkFolderReadmes(root, dirs), ...checkFileHeaders(root, files), ...checkSourceLayout(files)];

if (problems.length > 0) {
  console.error(`repo-checks: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`repo-checks: OK (${dirs.length} folders, ${files.length} files)`);
}
