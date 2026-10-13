/**
 * Role: entry point of the map-pipeline CLI: parses arguments, loads the commune config, runs the stages and prints a summary.
 * Owner: backend
 */

import { resolve } from 'node:path';
import { createLogger } from '@skyline/observability';
import { loadPipelineConfig } from '../config/load-pipeline-config.ts';
import { runPipeline } from '../runner/run-pipeline.ts';
import { stagesFor } from '../stages/stage-registry.ts';
import { findRepoRoot } from './find-repo-root.ts';
import { parseCliArgs } from './parse-cli-args.ts';

const main = async (): Promise<void> => {
  const { configPath, force } = parseCliArgs(process.argv.slice(2));
  const repoRoot = findRepoRoot(process.cwd());
  const config = await loadPipelineConfig(resolve(repoRoot, configPath));
  const logger = createLogger({ service: 'map-pipeline' }).child({ commune: config.commune });

  const reports = await runPipeline({ repoRoot, config, stages: stagesFor(config), logger, force });
  for (const r of reports)
    process.stdout.write(`${r.id.padEnd(24)} ${r.status.padEnd(7)} ${r.durationMs.toFixed(0)} ms\n`);
};

main().catch((error: unknown) => {
  process.stderr.write(
    `map-pipeline failed: ${error instanceof Error ? (process.env['DEBUG'] ? (error.stack ?? error.message) : error.message) : String(error)}\n`,
  );
  process.exitCode = 1;
});
