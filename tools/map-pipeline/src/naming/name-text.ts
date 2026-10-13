/**
 * Role: text helpers for place names: accent/case-insensitive comparison keys, tokenisation that keeps separators, sanitising of displayed names.
 * Owner: backend
 */

/** Comparison key: lower case, no accents, typographic apostrophes unified. */
export const foldText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`´]/g, "'")
    .toLowerCase();

/** Words and separators, so a name can be rebuilt exactly: "Maquis Le Pigeon" → ["Maquis", " ", "Le", " ", "Pigeon"]. */
export const tokenize = (text: string): string[] => text.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) ?? [];

export const isWord = (token: string): boolean => /^[\p{L}\p{N}]+$/u.test(token);

const MAX_LENGTH = 120;

/** Displayed names are plain text: no control characters, single spaces, bounded length. */
export const sanitizeName = (text: string): string | null => {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/\p{C}/gu, '')
    .trim()
    .slice(0, MAX_LENGTH);
  return clean === '' ? null : clean;
};
