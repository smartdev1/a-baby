/**
 * Role: builds the osmium command lines (extract, tags-filter, export) as argument arrays — pure, no shell, testable.
 * Owner: backend
 */

import type { BboxLonLat } from '../geometry/expand-bbox.ts';

/** Image built from infra/docker/osmium/Dockerfile (`pnpm map:osmium-image`). Bump with the Dockerfile. */
export const OSMIUM_IMAGE = 'skyline/osm-tools:2';

/**
 * OSM features kept for the game world (ARCHITECTURE §11.2): buildings, streets, places, land use, water, transport.
 * Changing this list invalidates the extract stage cache.
 */
export const OSM_TAG_FILTERS = [
  'nwr/building',
  'nwr/building:part',
  'w/highway',
  'nwr/amenity',
  'nwr/shop',
  'nwr/craft',
  'nwr/office',
  'nwr/healthcare',
  'nwr/emergency',
  'nwr/tourism',
  'nwr/leisure',
  'nwr/sport',
  'nwr/landuse',
  'nwr/natural',
  'nwr/water',
  'nwr/waterway',
  'nwr/place',
  'nwr/public_transport',
  'nwr/railway',
  'nwr/man_made',
  'nwr/barrier',
  'r/route',
  'r/boundary=administrative',
] as const;

/** Output options: no user metadata (privacy, smaller, deterministic). */
const PBF_NO_METADATA = 'pbf,add_metadata=false';

export const extractBboxArgs = (input: string, output: string, bbox: BboxLonLat): string[] => [
  'extract',
  '--bbox',
  bbox.join(','),
  '--strategy',
  'complete_ways',
  '--output-format',
  PBF_NO_METADATA,
  '--overwrite',
  '--output',
  output,
  input,
];

export const tagsFilterArgs = (input: string, output: string): string[] => [
  'tags-filter',
  '--output-format',
  PBF_NO_METADATA,
  '--overwrite',
  '--output',
  output,
  input,
  ...OSM_TAG_FILTERS,
];

export const exportGeojsonSeqArgs = (input: string, output: string): string[] => [
  'export',
  '--output-format',
  'geojsonseq',
  '--format-option',
  'print_record_separator=false',
  '--attributes',
  'type,id',
  '--overwrite',
  '--output',
  output,
  input,
];

/** Boundary relation with its member ways and nodes. */
export const getRelationArgs = (input: string, output: string, relationId: number): string[] => [
  'getid',
  '--add-referenced',
  '--output-format',
  PBF_NO_METADATA,
  '--overwrite',
  '--output',
  output,
  input,
  `r${relationId}`,
];

export const exportPolygonsArgs = (input: string, output: string): string[] => [
  'export',
  '--output-format',
  'geojson',
  '--geometry-types',
  'polygon',
  '--overwrite',
  '--output',
  output,
  input,
];

/** Bus route relations as OPL text (one relation per line), for the coverage report. */
export const busRoutesFilterArgs = (input: string, output: string): string[] => [
  'tags-filter',
  '--omit-referenced',
  '--output-format',
  'opl,add_metadata=false',
  '--overwrite',
  '--output',
  output,
  input,
  'r/route=bus,share_taxi,minibus',
];

/** Public transport route relations WITH their referenced objects (ways, stop nodes with coordinates), as OPL. */
export const transitRelationsArgs = (input: string, output: string): string[] => [
  'tags-filter',
  '--output-format',
  'opl,add_metadata=false',
  '--overwrite',
  '--output',
  output,
  input,
  'r/route=bus,share_taxi,minibus',
];
