/**
 * Role: parses the map-pipeline command line (`build --config <file> [--force]`) into a typed command.
 * Owner: backend
 */

import { parseArgs } from 'node:util';

export interface BuildCommand {
  readonly command: 'build';
  readonly configPath: string;
  readonly force: boolean;
}

export const USAGE = 'usage: pnpm map:build --config <tools/map-pipeline/config/<commune>.pipeline.json> [--force]';

export const parseCliArgs = (argv: readonly string[]): BuildCommand => {
  const { positionals, values } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: { config: { type: 'string' }, force: { type: 'boolean', default: false } },
  });
  if (positionals[0] !== 'build') throw new Error(`unknown command "${positionals[0] ?? ''}"\n${USAGE}`);
  if (!values.config) throw new Error(`missing --config\n${USAGE}`);
  return { command: 'build', configPath: values.config, force: values.force };
};
