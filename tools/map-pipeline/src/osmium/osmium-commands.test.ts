/**
 * Role: tests the osmium argument builders (stable flags, no metadata, filters appended, plain GeoJSONSeq).
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { exportGeojsonSeqArgs, extractBboxArgs, OSM_TAG_FILTERS, tagsFilterArgs } from './osmium-commands.ts';

describe('osmium commands', () => {
  it('should extract a bbox with complete ways and without user metadata', () => {
    expect(extractBboxArgs('/in/a.pbf', '/out/b.pbf', [-4.1, 5.3, -4, 5.4])).toEqual([
      'extract',
      '--bbox',
      '-4.1,5.3,-4,5.4',
      '--strategy',
      'complete_ways',
      '--output-format',
      'pbf,add_metadata=false',
      '--overwrite',
      '--output',
      '/out/b.pbf',
      '/in/a.pbf',
    ]);
  });

  it('should append every tag filter after the input file', () => {
    const args = tagsFilterArgs('/out/a.pbf', '/out/b.pbf');
    expect(args.slice(-OSM_TAG_FILTERS.length)).toEqual([...OSM_TAG_FILTERS]);
    expect(args).toContain('pbf,add_metadata=false');
  });

  it('should export newline-delimited GeoJSON with OSM type and id', () => {
    const args = exportGeojsonSeqArgs('/in/a.pbf', '/out/f.geojsonseq');
    expect(args).toEqual(expect.arrayContaining(['geojsonseq', 'print_record_separator=false', 'type,id']));
  });
});
