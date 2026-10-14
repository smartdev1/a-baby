/**
 * Role: the place types of content/place-types, validated with @skyline/content-schema, and the lookup game place category → place type (each category belongs to at most one type).
 * Owner: backend
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type PlaceType, PlaceTypeSchema } from '@skyline/content-schema';

export const PLACE_TYPES_DIR = 'content/place-types';

/** Files of the place types, sorted (inputs of the stage). */
export const placeTypeFiles = (absoluteDir: string): string[] =>
  readdirSync(absoluteDir)
    .filter((f) => f.endsWith('.place.json'))
    .sort()
    .map((f) => join(absoluteDir, f));

export class PlaceTypeCatalogue {
  private readonly byCategory = new Map<string, PlaceType>();

  constructor(readonly types: readonly PlaceType[]) {
    for (const t of [...types].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      for (const category of t.osmCategories) {
        const other = this.byCategory.get(category);
        if (other) throw new Error(`category "${category}" is claimed by place types "${other.id}" and "${t.id}"`);
        this.byCategory.set(category, t);
      }
    }
  }

  static load(absoluteDir: string): PlaceTypeCatalogue {
    return new PlaceTypeCatalogue(placeTypeFiles(absoluteDir).map((f) => PlaceTypeSchema.parse(JSON.parse(readFileSync(f, 'utf8')))));
  }

  typeOf(category: string | null): PlaceType | null {
    return category ? (this.byCategory.get(category) ?? null) : null;
  }
}
