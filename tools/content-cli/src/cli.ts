/**
 * Role: command line entry point of @skyline/content-cli: `validate [--strict]`, `compile [--out <dir>]` and `schemas`, on the repository content/ folder.
 * Owner: backend
 */

import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { readContentFiles, readI18nKeys } from './content-files.ts';
import { writeJsonSchemas, writePacks } from './content-packs.ts';
import { type Problem, validateContent } from './content-validation.ts';

const repo = (relative: string): string => fileURLToPath(new URL(`../../../${relative}`, import.meta.url));
const USAGE = 'usage: content-cli <validate [--strict] | compile [--out <dir>] | schemas>';

const show = (label: string, problems: readonly Problem[]): void => {
  for (const p of problems) process.stdout.write(`${label} ${p.file}${p.path ? ` › ${p.path}` : ''}: ${p.message}\n`);
};

const main = async (): Promise<number> => {
  const { positionals, values } = parseArgs({ args: process.argv.slice(2).filter((a) => a !== '--'), allowPositionals: true, options: { strict: { type: 'boolean', default: false }, out: { type: 'string' } } });
  const command = positionals[0];
  if (command === 'schemas') {
    const written = await writeJsonSchemas(repo('tools/content-cli/schemas'));
    process.stdout.write(`JSON Schemas written: ${written.join(', ')}\n`);
    return 0;
  }
  if (command !== 'validate' && command !== 'compile') {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }
  const contentDir = repo('content');
  const files = await readContentFiles(contentDir);
  const report = validateContent(files, await readI18nKeys(contentDir), { strict: values.strict });
  show('warning', report.warnings);
  show('error', report.errors);
  const counts = `${report.content.actions.length} actions, ${report.content.placeTypes.length} place types, ${report.content.jobs.length} jobs, ${report.content.items.length} items`;
  process.stdout.write(`${files.length} files (${counts}): ${report.errors.length} error(s), ${report.warnings.length} warning(s)\n`);
  if (report.errors.length > 0) return 1;
  if (command === 'compile') {
    const out = values.out ?? repo('data/build/content');
    process.stdout.write(`packs written to ${out}: ${(await writePacks(report.content, out)).join(', ')}\n`);
  }
  return 0;
};

process.exitCode = await main();
