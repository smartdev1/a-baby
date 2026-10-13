/**
 * Role: decides the displayed name of one place (ADR 0010): override > hidden if offensive > real name for public places > brand parody > deformed proper nouns.
 * Owner: backend
 */

import type { ClassifiedRecord } from '../records/map-records.ts';
import type { BrandParodies } from './brand-parody.ts';
import { deformName } from './deform-name.ts';
import { foldText, isWord, sanitizeName, tokenize } from './name-text.ts';

export type NameSource = 'override' | 'hidden' | 'toponym' | 'brand-parody' | 'deformed' | 'generic' | 'none';

export interface PlaceName {
  readonly id: string;
  readonly displayName: string | null;
  readonly source: NameSource;
}

export interface NamingRules {
  readonly seed: string;
  readonly brands: BrandParodies;
  readonly genericWords: ReadonlySet<string>;
  readonly offensiveWords: ReadonlySet<string>;
  /** OSM id → forced name (null = hidden). */
  readonly overrides: ReadonlyMap<string, string | null>;
}

/** Public places keep their real name (worship, schools, administrations, markets, stops, sport, parks, hospitals). */
const PUBLIC_DOMAINS = /^(worship|education|public|sport)\.|^(transport\.(stop|station|taxi_rank|parking)|commerce\.market|leisure\.park|leisure\.playground|health\.hospital)$/;

/** A word starting with an offensive word (plural, feminine…) hides the name. */
const isOffensive = (name: string, words: ReadonlySet<string>): boolean =>
  tokenize(foldText(name)).some((t) => isWord(t) && [...words].some((w) => t.startsWith(w)));

/** Name of a commercial place: brand parody, else deformed proper nouns, else the generic name as is. */
const commercialName = (id: string, raw: string, hasOwnName: boolean, rules: NamingRules): PlaceName => {
  const branded = rules.brands.replaceInName(raw);
  if (branded.replaced || !hasOwnName) return { id, displayName: sanitizeName(branded.text), source: 'brand-parody' };
  const deformed = deformName(raw, `${rules.seed}|${id}`, rules.genericWords);
  return { id, displayName: sanitizeName(deformed.text), source: deformed.changed ? 'deformed' : 'generic' };
};

export const namePlace = (record: Pick<ClassifiedRecord, 'id' | 'tags' | 'placeCategory'>, rules: NamingRules): PlaceName => {
  const { id } = record;
  if (rules.overrides.has(id)) {
    const forced = rules.overrides.get(id) ?? null;
    return { id, displayName: forced === null ? null : sanitizeName(forced), source: 'override' };
  }
  const ownName = record.tags['name'];
  const raw = ownName ?? (record.tags['brand'] ? rules.brands.parodyOfBrandTag(record.tags['brand']) : null);
  if (!raw) return { id, displayName: null, source: 'none' };
  if (isOffensive(raw, rules.offensiveWords)) return { id, displayName: null, source: 'hidden' };
  if (record.placeCategory && PUBLIC_DOMAINS.test(record.placeCategory)) return { id, displayName: sanitizeName(raw), source: 'toponym' };
  return commercialName(id, raw, ownName !== undefined, rules);
};
