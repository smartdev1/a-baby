/**
 * Role: runs a tool of the frozen Docker image (osmium, gdalwarp…) with read-only input and writable output bind mounts (Windows and Linux).
 * Owner: backend
 */

import { spawn } from 'node:child_process';
import { OSMIUM_IMAGE } from './osmium-commands.ts';

export interface OsmiumMounts {
  /** Absolute host folder mounted read-only at /in. */
  readonly inputDir: string;
  /** Absolute host folder mounted read-write at /out. */
  readonly outputDir: string;
}

export type RunOsmium = (args: readonly string[], mounts: OsmiumMounts) => Promise<void>;

const runDocker = (args: readonly string[]): Promise<{ code: number; stderr: string }> =>
  new Promise((resolve, reject) => {
    const child = spawn('docker', [...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('error', (error) => reject(new Error(`cannot start docker (is Docker installed and running?): ${error.message}`)));
    child.on('close', (code) => resolve({ code: code ?? 1, stderr }));
  });

/** Files written in /out belong to the current user on Linux/macOS instead of root. */
const userArgs = (): string[] =>
  typeof process.getuid === 'function' && typeof process.getgid === 'function' ? ['--user', `${process.getuid()}:${process.getgid()}`] : [];

export const ensureOsmiumImage = async (): Promise<void> => {
  const { code } = await runDocker(['image', 'inspect', OSMIUM_IMAGE]);
  if (code !== 0) throw new Error(`Docker image ${OSMIUM_IMAGE} is missing: run "pnpm map:osmium-image" once`);
};

/** Runs `tool` (entrypoint) of the image; osmium is the default entrypoint. */
export const runTool = async (tool: string, args: readonly string[], { inputDir, outputDir }: OsmiumMounts): Promise<void> => {
  const dockerArgs = [
    'run',
    '--rm',
    ...userArgs(),
    '--entrypoint',
    tool,
    '--mount',
    `type=bind,source=${inputDir},target=/in,readonly`,
    '--mount',
    `type=bind,source=${outputDir},target=/out`,
    OSMIUM_IMAGE,
    ...args,
  ];
  const { code, stderr } = await runDocker(dockerArgs);
  if (code !== 0) throw new Error(`${tool} ${args[0] ?? ''} failed (exit ${code}): ${stderr.trim()}`);
};

export const runOsmium: RunOsmium = (args, mounts) => runTool('osmium', args, mounts);
