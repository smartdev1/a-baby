/**
 * Role: reads bus / shared-taxi route relations from osmium OPL output (decoding OPL %xx% escapes) for the coverage report.
 * Owner: backend
 */

import { parseOplTags } from '../../osm/opl-format.ts';

export interface RouteRelation {
  readonly id: string;
  readonly route: string;
  readonly ref: string | null;
  readonly name: string | null;
  readonly network: string | null;
}

export const parseRouteRelations = (opl: string): RouteRelation[] =>
  opl
    .split('\n')
    .filter((line) => line.startsWith('r'))
    .map((line) => {
      const fields = line.split(' ');
      const tags = parseOplTags(fields.find((f) => f.startsWith('T'))?.slice(1) ?? '');
      return {
        id: fields[0] ?? '',
        route: tags['route'] ?? 'unknown',
        ref: tags['ref'] ?? null,
        name: tags['name'] ?? null,
        network: tags['network'] ?? null,
      };
    });
