/**
 * Role: command line entry point of @skyline/asset-pipeline. Validates naming, meshopt and KTX2 for a given asset manifest.
 * Owner: frontend
 */

import { readFileSync } from 'node:fs';
import { validateName } from './naming.js';
import { validateMeshopt } from './meshopt.js';
import { validateKtx2 } from './ktx2.js';

interface AssetEntry {
  name: string;
  extensions: string[];
}

interface Manifest {
  assets: AssetEntry[];
}

function main(): void {
  const path = process.argv[2];
  if (!path) {
    process.stderr.write('usage: asset-pipeline <manifest.json>\n');
    process.exitCode = 1;
    return;
  }
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as Manifest;
  let failed = 0;
  for (const asset of manifest.assets) {
    const checks = [
      validateName(asset.name),
      validateMeshopt(asset.extensions),
      validateKtx2(asset.extensions),
    ];
    const ok = checks.every((c) => c.ok);
    if (!ok) {
      failed += 1;
      process.stderr.write(`${asset.name}: ${checks.filter((c) => !c.ok).map((c) => c.reason).join('; ')}\n`);
    } else {
      process.stdout.write(`${asset.name}: ok\n`);
    }
  }
  process.exitCode = failed > 0 ? 1 : 0;
}

main();
