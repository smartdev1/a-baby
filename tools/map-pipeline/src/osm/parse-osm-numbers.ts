/**
 * Role: robust parsing of numeric OSM tags (`building:levels`, `height`, `min_height`): multiple values, R+n notation, units, decimal commas; invalid or implausible values become undefined, never NaN.
 * Owner: backend
 */

/** Plausibility limits for Abidjan (tallest towers ≈ 30 floors / 150 m): beyond, the tag is treated as a mapping error. */
export const LEVELS_RANGE = { min: 1, max: 60 } as const;
export const HEIGHT_RANGE_M = { min: 2, max: 250 } as const;

const FEET_TO_M = 0.3048;

const inRange = (value: number, { min, max }: { min: number; max: number }): number | undefined =>
  Number.isFinite(value) && value >= min && value <= max ? value : undefined;

/** Applies `parse` to every `;`-separated value and keeps the largest valid one. */
const maxOfParts = (raw: string, parse: (part: string) => number | undefined): number | undefined => {
  const values = raw
    .split(';')
    .map((part) => parse(part.trim()))
    .filter((v): v is number => v !== undefined);
  return values.length === 0 ? undefined : Math.max(...values);
};

const parseLevelPart = (part: string): number | undefined => {
  const groundPlus = /^R\s*\+\s*(\d+)$/i.exec(part); // "R+2" = ground floor + 2 = 3 levels
  if (groundPlus) return Number(groundPlus[1]) + 1;
  if (/^\d+([.,]\d+)?$/.test(part)) return Math.ceil(Number(part.replace(',', '.')));
  return undefined;
};

const parseHeightPart = (part: string): number | undefined => {
  const match = /^(\d+(?:[.,]\d+)?)\s*(m|metres?|meters?|'|ft|feet)?$/i.exec(part);
  if (!match) return undefined;
  const value = Number((match[1] ?? '').replace(',', '.'));
  const unit = (match[2] ?? 'm').toLowerCase();
  return unit === "'" || unit === 'ft' || unit === 'feet' ? value * FEET_TO_M : value;
};

export const parseLevels = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  const levels = maxOfParts(raw, parseLevelPart);
  return levels === undefined ? undefined : inRange(levels, LEVELS_RANGE);
};

export const parseHeightM = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  const height = maxOfParts(raw, parseHeightPart);
  return height === undefined ? undefined : inRange(Math.round(height * 100) / 100, HEIGHT_RANGE_M);
};
