/**
 * Role: streams a GeoJSONSeq file feature by feature (constant memory on a whole commune).
 * Owner: backend
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import type { Geometry } from '../../geometry/geojson-geometry.ts';

export interface OsmFeature {
  readonly geometry: Geometry | null;
  readonly properties: Readonly<Record<string, string | number | undefined>>;
}

export async function* readFeatures(path: string): AsyncGenerator<OsmFeature> {
  const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
  for await (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) yield JSON.parse(trimmed) as OsmFeature;
  }
}
