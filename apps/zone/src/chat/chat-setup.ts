/**
 * Role: reads the chat word list maintained by moderation (`content/moderation/chat-words.json`, French and nouchi) into the normalised blocked-word set; a missing file means no word filter (phone numbers and links are still masked).
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { blockedWordSet } from './chat-filter.ts';

const ChatWordsSchema = z.object({ version: z.number().int().positive(), french: z.array(z.string().min(1).max(40)), nouchi: z.array(z.string().min(1).max(40)) }).strict();

export const loadBlockedWords = async (contentDir: string): Promise<ReadonlySet<string>> => {
  const raw = await readFile(join(contentDir, 'moderation', 'chat-words.json'), 'utf8').catch(() => null);
  if (raw === null) return new Set();
  const words = ChatWordsSchema.parse(JSON.parse(raw));
  return blockedWordSet([...words.french, ...words.nouchi]);
};
