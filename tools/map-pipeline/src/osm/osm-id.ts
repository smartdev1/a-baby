/**
 * Role: builds the stable identifier `osm:{node|way|relation}/{id}` from osmium (`@type` + numeric `@id`) or overpass (`way/123`) exports.
 * Owner: backend
 */

export type OsmId = `osm:${'node' | 'way' | 'relation'}/${number}`;

const TYPES = new Set(['node', 'way', 'relation']);

/** Returns null when the feature carries no usable OSM identity. */
export const stableOsmId = (properties: Record<string, unknown>, featureId?: unknown): OsmId | null => {
  const type = properties['@type'];
  const id = properties['@id'];
  if (typeof type === 'string' && TYPES.has(type) && (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)))) {
    return `osm:${type}/${Number(id)}` as OsmId;
  }
  const slashed = typeof id === 'string' ? id : typeof featureId === 'string' ? featureId : null;
  const match = slashed ? /^(node|way|relation)\/(\d+)$/.exec(slashed) : null;
  return match ? (`osm:${match[1]}/${Number(match[2])}` as OsmId) : null;
};
