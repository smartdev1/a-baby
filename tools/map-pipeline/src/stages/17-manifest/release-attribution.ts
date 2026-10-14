/**
 * Role: attribution texts of a world release (ATTRIBUTION.md and the README of the ODbL archive) and the list of OSM-derived files the archive must contain.
 * Owner: backend
 */

import type { DemLock } from '../../sources/sources-lock.ts';
import type { TarEntry } from '../../writers/deterministic-tar-gz.ts';

export interface ReleaseFacts {
  readonly release: string;
  readonly commune: string;
  readonly osm: { readonly provider: string; readonly fileName: string; readonly snapshotDate: string; readonly sha256: string };
  readonly dem: DemLock | null;
}

/** OSM-derived outputs published under the ODbL (stage id, file). Tiles are a "Produced Work" and are not part of it. */
export const OSM_DERIVED_FILES: readonly (readonly [string, string])[] = [
  ['04-normalize', 'normalized.ndjson'],
  ['05-classify', 'classified.ndjson'],
  ['06-heights', 'buildings.ndjson'],
  ['08-roads', 'road-nodes.ndjson'],
  ['08-roads', 'road-edges.ndjson'],
  ['09-naming', 'place-names.ndjson'],
];

export const osmDerivedArchiveName = (release: string): string => `osm-derived.${release}.tar.gz`;

const demLines = (dem: DemLock | null): string[] =>
  dem
    ? ['## Relief', '', `Copernicus DEM ${dem.product} (\`${dem.fileName}\`).`, '', dem.attribution, '']
    : [];

export const attributionMarkdown = (f: ReleaseFacts): string =>
  [
    `# Attribution — SkyLine world release \`${f.release}\``,
    '',
    `Commune: ${f.commune}.`,
    '',
    '## Map data',
    '',
    '© OpenStreetMap contributors. Map data is available under the Open Database License (ODbL 1.0): https://www.openstreetmap.org/copyright',
    '',
    `Snapshot: ${f.osm.provider} \`${f.osm.fileName}\` (${f.osm.snapshotDate}, sha256 \`${f.osm.sha256}\`).`,
    '',
    `The OSM-derived database of this release (buildings, roads, places and displayed names) is published under the ODbL in \`${osmDerivedArchiveName(f.release)}\`. The game tiles are a Produced Work made from it.`,
    '',
    ...demLines(f.dem),
  ].join('\n');

export const archiveReadme = (f: ReleaseFacts): string =>
  [
    `# OSM-derived database — SkyLine release \`${f.release}\``,
    '',
    'This archive is a Derivative Database of OpenStreetMap data, made available under the Open Database License (ODbL 1.0): https://opendatacommons.org/licenses/odbl/1-0/',
    '',
    '© OpenStreetMap contributors — https://www.openstreetmap.org/copyright',
    '',
    `Source snapshot: ${f.osm.provider} \`${f.osm.fileName}\` (${f.osm.snapshotDate}, sha256 \`${f.osm.sha256}\`). Clipped to ${f.commune}.`,
    '',
    '| File | Content |',
    '|---|---|',
    '| `normalized.ndjson` | OSM features with stable ids, UTM 30N metres, parsed tags |',
    '| `classified.ndjson` | Same, with building flag, game place category and road class |',
    '| `buildings.ndjson` | Buildings with levels and height (OSM tags or heuristic, source marked) |',
    '| `road-nodes.ndjson`, `road-edges.ndjson` | Road and pedestrian graph |',
    '| `place-names.ndjson` | Displayed names (real toponyms, parodied brand and shop names) |',
    '',
  ].join('\n');

export const archiveEntries = (f: ReleaseFacts, outputOf: (stageId: string, file: string) => string): TarEntry[] => [
  { name: 'osm-derived/README.md', source: { text: archiveReadme(f) } },
  { name: 'osm-derived/ATTRIBUTION.md', source: { text: attributionMarkdown(f) } },
  ...OSM_DERIVED_FILES.map(([stage, file]): TarEntry => ({ name: `osm-derived/${file}`, source: { path: outputOf(stage, file) } })),
];
