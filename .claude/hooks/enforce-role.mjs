/**
 * Role: Claude Code PreToolUse hook that blocks file edits outside the active developer role (frontend or backend), using .claude/ownership.json.
 * Owner: owner
 *
 * The role comes from SKYLINE_ROLE or the first line of .claude/role.local (git-ignored, one per machine).
 * Exit code 2 blocks the tool call and shows the message to Claude.
 */

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';

const readStdin = () => readFileSync(0, 'utf8');

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const roleFile = join(projectDir, '.claude', 'role.local');
const role = (process.env.SKYLINE_ROLE ?? (existsSync(roleFile) ? readFileSync(roleFile, 'utf8').split('\n')[0] : '')).trim();

if (role !== 'frontend' && role !== 'backend') process.exit(0); // no role declared: no restriction (owner session)

const input = JSON.parse(readStdin());
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!target) process.exit(0);

const absolute = isAbsolute(target) ? target : join(input.cwd ?? projectDir, target);
const rel = relative(projectDir, absolute).split(sep).join('/');
if (rel.startsWith('..')) process.exit(0); // outside the repository

const ownership = JSON.parse(readFileSync(join(projectDir, '.claude', 'ownership.json'), 'utf8'));
const otherRole = role === 'frontend' ? 'backend' : 'frontend';
const matches = (prefixes) => prefixes.some((p) => rel === p || rel.startsWith(p));

if (matches(ownership[otherRole])) {
  process.stderr.write(
    `SkyLine role guard: you are working as "${role}". "${rel}" belongs to the ${otherRole} developer ` +
      `(see docs/rules/${otherRole.toUpperCase()}.md). Do not edit it: describe the needed change so the ${otherRole} developer can do it.\n`,
  );
  process.exit(2);
}
if (matches(ownership.ownerOnly)) {
  process.stderr.write(
    `SkyLine role guard: "${rel}" is owner-only (CLAUDE.md, ARCHITECTURE.md, ADRs, rules, .claude). Ask the project owner explicitly before editing it.\n`,
  );
  process.exit(2);
}
process.exit(0);
