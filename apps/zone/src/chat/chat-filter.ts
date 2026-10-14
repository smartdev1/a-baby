/**
 * Role: chat text filter (ARCHITECTURE §20.2): control characters removed, phone numbers and links masked (minors, scams), blocked words masked after normalisation (case, accents, leetspeak, repeated letters).
 * Owner: backend
 */

const MASK = '***';
/** 8+ digits, optionally prefixed (+225, 00225) and split by spaces, dots or dashes. */
const PHONE = /(?:\+|00)?\d(?:[\s.-]?\d){7,}/g;
const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
const DOMAIN = /\b[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.(?:com|ci|net|org|fr|io|me|app|ly|link|gg|xyz|info|biz|co|tv)\b(?:\/\S*)?/giu;
const CONTROL = /[\p{Cc}\p{Cf}]/gu;
const WORD = /[\p{L}\p{N}@$]+/gu;
const LEET: Readonly<Record<string, string>> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' };

/** Comparable form of a word: lower case, no accents, leetspeak undone, repeated letters collapsed. */
export const normalizeWord = (word: string): string =>
  word
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[013457@$]/g, (c) => LEET[c] ?? c)
    .replace(/(.)\1+/g, '$1');

export const blockedWordSet = (words: readonly string[]): ReadonlySet<string> => new Set(words.map(normalizeWord).filter((w) => w.length > 0));

/** Filtered text, or null when nothing is left to send. */
export const filterChatText = (text: string, blocked: ReadonlySet<string>): string | null => {
  const cleaned = text
    .replace(CONTROL, '')
    .replace(URL, MASK)
    .replace(DOMAIN, MASK)
    .replace(PHONE, MASK)
    .replace(WORD, (w) => (blocked.has(normalizeWord(w)) ? '*'.repeat(w.length) : w))
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
};
