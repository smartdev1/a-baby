/**
 * Role: exécute Osmium et GDAL dans WSL en priorité, avec Docker en secours.
 * Les entrées sont en lecture seule et les sorties sont écrites dans le dossier fourni.
 * Owner: backend
 */

import { spawn } from 'node:child_process';
import { OSMIUM_IMAGE } from './osmium-commands.ts';

const WSL_DISTRO = 'Ubuntu-22.04';

export interface OsmiumMounts {
  /** Dossier hôte contenant les fichiers d'entrée. */
  readonly inputDir: string;
  /** Dossier hôte destiné aux fichiers de sortie. */
  readonly outputDir: string;
}

export type RunOsmium = (args: readonly string[], mounts: OsmiumMounts) => Promise<void>;

interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
}

const runProcess = (command: string, args: readonly string[]): Promise<ProcessResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Impossible de lancer ${command} : ${error.message}`));
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });

// const runWsl = (args: readonly string[]): Promise<ProcessResult> =>
//   runProcess('wsl.exe', [
//     '-d',
//     WSL_DISTRO,
//     '--exec',
//     'bash',
//     '-lc',
//     'command -v osmium >/dev/null && command -v gdalwarp >/dev/null',
//   ]).then(async (check) => {
//     if (check.code !== 0) {
//       throw new Error(`Osmium ou GDAL indisponible dans WSL : ${check.stderr.trim()}`);
//     }

//     return runProcess('wsl.exe', ['-d', WSL_DISTRO, '--exec', ...args]);
//   });

const wslPath = async (windowsPath: string): Promise<string> => {
  const result = await runProcess('wsl.exe', ['-d', WSL_DISTRO, '--exec', 'wslpath', '-a', windowsPath]);

  if (result.code !== 0) {
    throw new Error(`Conversion WSL du chemin impossible : ${windowsPath}`);
  }

  return result.stdout.trim();
};

const mapVirtualPaths = (args: readonly string[], inputDir: string, outputDir: string): string[] =>
  args.map((arg) => {
    if (arg === '/in') return inputDir;
    if (arg.startsWith('/in/')) return `${inputDir}/${arg.slice(4)}`;
    if (arg === '/out') return outputDir;
    if (arg.startsWith('/out/')) return `${outputDir}/${arg.slice(5)}`;
    return arg;
  });

const runDocker = (args: readonly string[]): Promise<ProcessResult> => runProcess('docker', args);

const userArgs = (): string[] =>
  typeof process.getuid === 'function' && typeof process.getgid === 'function'
    ? ['--user', `${process.getuid()}:${process.getgid()}`]
    : [];

const ensureDockerImage = async (): Promise<void> => {
  const result = await runDocker(['image', 'inspect', OSMIUM_IMAGE]);
  if (result.code !== 0) {
    throw new Error(
      `Image Docker ${OSMIUM_IMAGE} absente. ` +
        'Installe les outils WSL ou construis l’image avec pnpm map:osmium-image.',
    );
  }
};

export const ensureOsmiumImage = async (): Promise<void> => {
  try {
    const result = await runProcess('wsl.exe', [
      '-d',
      WSL_DISTRO,
      '--exec',
      'bash',
      '-lc',
      'command -v osmium >/dev/null && command -v gdalwarp >/dev/null',
    ]);

    if (result.code === 0) return;
  } catch {
    // WSL indisponible : vérifier la solution de secours Docker.
  }

  await ensureDockerImage();
};

export const runTool = async (
  tool: string,
  args: readonly string[],
  { inputDir, outputDir }: OsmiumMounts,
): Promise<void> => {
  let wslError: string;

  try {
    const linuxInput = await wslPath(inputDir);
    const linuxOutput = await wslPath(outputDir);
    const linuxArgs = mapVirtualPaths(args, linuxInput, linuxOutput);

    const result = await runProcess('wsl.exe', ['-d', WSL_DISTRO, '--exec', `/usr/bin/${tool}`, ...linuxArgs]);

    if (result.code === 0) return;

    wslError = `${tool} a échoué dans WSL (code ${result.code}) : ${result.stderr.trim()}`;
  } catch (error) {
    wslError = error instanceof Error ? error.message : String(error);
  }

  try {
    await ensureDockerImage();

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

    const result = await runDocker(dockerArgs);

    if (result.code === 0) return;

    throw new Error(`${tool} a échoué dans Docker (code ${result.code}) : ${result.stderr.trim()}`);
  } catch (dockerError) {
    const dockerMessage = dockerError instanceof Error ? dockerError.message : String(dockerError);

    throw new Error(`Échec de l'exécution de ${tool}.\nWSL : ${wslError}\nDocker : ${dockerMessage}`, { cause: dockerError });
  }
};

export const runOsmium: RunOsmium = (args, mounts) => runTool('osmium', args, mounts);
