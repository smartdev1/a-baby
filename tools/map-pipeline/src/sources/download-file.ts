/**
 * Role: streams an HTTPS download to disk through a temporary `.part` file, so an interrupted download never looks complete.
 * Owner: backend
 */

import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export type DownloadFile = (url: string, destination: string) => Promise<void>;

export const downloadFile: DownloadFile = async (url, destination) => {
  await mkdir(dirname(destination), { recursive: true });
  const partial = `${destination}.part`;
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`download failed for ${url}: HTTP ${response.status}`);
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
    await rename(partial, destination);
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
};
