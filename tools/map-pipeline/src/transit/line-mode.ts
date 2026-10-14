/**
 * Role: game transport mode of an OSM route relation (SOTRA bus, gbaka, woro-woro, other bus) from its route, network and name tags.
 * Owner: backend
 */

export type TransitMode = 'sotra_bus' | 'gbaka' | 'woro_woro' | 'bus';

const has = (text: string | undefined, pattern: RegExp): boolean => pattern.test((text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase());

export const transitModeOf = (tags: Readonly<Record<string, string>>): TransitMode => {
  const label = `${tags['network'] ?? ''} ${tags['name'] ?? ''} ${tags['operator'] ?? ''}`;
  if (has(label, /gbaka/)) return 'gbaka';
  if (tags['route'] === 'share_taxi' || has(label, /woro/)) return 'woro_woro';
  if (has(label, /monbus|sotra/)) return 'sotra_bus';
  return 'bus';
};
