/**
 * Role: CharacterStorePort adapters until the characters service (J6-04 with the database): in memory (tests) and one JSON file per character under data/runtime/characters (atomic writes; ids restricted to safe characters).
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { CharacterCheckpoint, CharacterStorePort } from '../ports/character-store-port.ts';

const Need = z.number().min(0).max(100);
const CheckpointSchema = z
  .object({
    characterId: z.string(),
    eastingM: z.number(),
    northingM: z.number(),
    y: z.number(),
    yawRad: z.number(),
    needs: z.object({ hunger: Need, energy: Need, hygiene: Need, social: Need, fun: Need }).strict().nullable(),
    savedAtMs: z.number(),
  })
  .strict();
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export class InMemoryCharacterStore implements CharacterStorePort {
  readonly saved = new Map<string, CharacterCheckpoint>();

  load(characterId: string): Promise<CharacterCheckpoint | null> {
    return Promise.resolve(this.saved.get(characterId) ?? null);
  }

  save(checkpoint: CharacterCheckpoint): Promise<void> {
    this.saved.set(checkpoint.characterId, checkpoint);
    return Promise.resolve();
  }
}

export class FileCharacterStore implements CharacterStorePort {
  constructor(private readonly dir: string) {}

  async load(characterId: string): Promise<CharacterCheckpoint | null> {
    const file = this.fileOf(characterId);
    if (!file || !existsSync(file)) return null;
    return CheckpointSchema.parse(JSON.parse(await readFile(file, 'utf8')));
  }

  async save(checkpoint: CharacterCheckpoint): Promise<void> {
    const file = this.fileOf(checkpoint.characterId);
    if (!file) return;
    await mkdir(this.dir, { recursive: true });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, `${JSON.stringify(checkpoint)}\n`);
    await rename(tmp, file);
  }

  private fileOf(characterId: string): string | null {
    return SAFE_ID.test(characterId) ? join(this.dir, `${characterId}.json`) : null;
  }
}
