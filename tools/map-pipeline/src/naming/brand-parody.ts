/**
 * Role: finds real brands in a place (brand tag or words of its name) and replaces them by their reviewed parody; reports brands missing from the table.
 * Owner: backend
 */

import { foldText, isWord, tokenize } from './name-text.ts';

export class BrandParodies {
  /** Folded brand words → parody, longest brands first. */
  private readonly entries: { words: string[]; parody: string }[];
  private readonly known: Map<string, string>;

  constructor(parodies: Readonly<Record<string, string>>) {
    this.known = new Map(Object.entries(parodies).map(([brand, parody]) => [foldText(brand), parody]));
    this.entries = Object.entries(parodies)
      .map(([brand, parody]) => ({ words: tokenize(foldText(brand)).filter(isWord), parody }))
      .sort((a, b) => b.words.length - a.words.length);
  }

  /** Values of a `brand=*` tag (`;`-separated) that are not in the table. */
  unknownBrands(brandTag: string | undefined): string[] {
    if (!brandTag) return [];
    return brandTag.split(';').map((b) => b.trim()).filter((b) => b !== '' && !this.known.has(foldText(b)));
  }

  /** Parody of a whole `brand` tag value (each `;` part), or null when unknown. */
  parodyOfBrandTag(brandTag: string): string | null {
    const parts = brandTag.split(';').map((b) => this.known.get(foldText(b.trim())));
    return parts.every((p) => p !== undefined) ? parts.join(' ') : null;
  }

  /** Replaces every brand found in the name's words; `replaced` tells if one was found. */
  replaceInName(name: string): { text: string; replaced: boolean } {
    const tokens = tokenize(name);
    const wordIndexes = tokens.map((t, k) => (isWord(t) ? k : -1)).filter((k) => k >= 0);
    const folded = wordIndexes.map((k) => foldText(tokens[k] ?? ''));
    let replaced = false;
    for (let w = 0; w < folded.length; w++) {
      const match = this.entries.find((e) => e.words.length > 0 && e.words.every((word, j) => folded[w + j] === word));
      if (!match) continue;
      const first = wordIndexes[w] ?? 0;
      const last = wordIndexes[w + match.words.length - 1] ?? first;
      tokens.splice(first, last - first + 1, match.parody, ...Array<string>(last - first).fill(''));
      replaced = true;
      w += match.words.length - 1;
    }
    return { text: tokens.join(''), replaced };
  }
}
