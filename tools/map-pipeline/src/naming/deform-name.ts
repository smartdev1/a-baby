/**
 * Role: deterministic deformation of the proper nouns of a shop name (2 letter substitutions per proper word, seeded by OSM id); generic words are kept.
 * Owner: backend
 */

import { createSeededRng } from '../determinism/seeded-rng.ts';
import { foldText, isWord, tokenize } from './name-text.ts';

/** Letter swaps that keep a name pronounceable (a↔o, c↔k, s↔z, t↔d, p↔b…). */
const SWAP: Readonly<Record<string, string>> = {
  a: 'o', o: 'a', e: 'i', i: 'e', u: 'o', c: 'k', k: 'c', s: 'z', z: 's', t: 'd', d: 't', p: 'b', b: 'p', f: 'v', v: 'f', m: 'n', n: 'm', l: 'r', r: 'l', g: 'k',
};

const swapLetter = (letter: string): string => {
  const lower = foldText(letter);
  const swapped = SWAP[lower];
  if (!swapped) return letter;
  return letter === letter.toUpperCase() && letter !== letter.toLowerCase() ? swapped.toUpperCase() : swapped;
};

const deformWord = (word: string, seed: string): string => {
  const letters = [...word];
  const candidates = letters.map((c, k) => (k > 0 && SWAP[foldText(c)] ? k : -1)).filter((k) => k >= 0);
  if (letters.length < 3 || candidates.length === 0) return word;
  const rng = createSeededRng(seed);
  const picks = new Set<number>();
  while (picks.size < Math.min(2, candidates.length)) picks.add(rng.pick(candidates));
  for (const k of picks) letters[k] = swapLetter(letters[k] ?? '');
  return letters.join('');
};

/** Returns the deformed name and whether any proper word was changed. */
export const deformName = (name: string, seed: string, genericWords: ReadonlySet<string>): { text: string; changed: boolean } => {
  let changed = false;
  const tokens = tokenize(name).map((token, index) => {
    if (!isWord(token) || genericWords.has(foldText(token)) || /^\d+$/.test(token)) return token;
    const out = deformWord(token, `${seed}|${index}`);
    if (out !== token) changed = true;
    return out;
  });
  return { text: tokens.join(''), changed };
};
