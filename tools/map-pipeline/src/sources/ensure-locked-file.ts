/**
 * Role: makes sure a locked source file (OSM snapshot, DEM tile) is in the cache with the exact sha256: downloads it once, never replaces a mismatching file silently.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { sha256OfFile } from '../runner/content-hash.ts';
import type { DownloadFile } from './download-file.ts';

export interface LockedFile {
  readonly url: string;
  readonly sha256: string;
}

export const ensureLockedFile = async (file: LockedFile, target: string, download: DownloadFile): Promise<void> => {
  if (!existsSync(target)) await download(file.url, target);
  const actual = await sha256OfFile(target);
  if (actual !== file.sha256) {
    throw new Error(`${target} has sha256 ${actual} but sources.lock.json expects ${file.sha256}. Delete the file to download it again, or update the lock on purpose.`);
  }
};
