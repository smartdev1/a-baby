/**
 * Role: reads bus / shared-taxi route relations from osmium OPL output (decoding OPL %xx% escapes) for the coverage report.
 * Owner: backend
 */

export interface RouteRelation {
  readonly id: string;
  readonly route: string;
  readonly ref: string | null;
  readonly name: string | null;
  readonly network: string | null;
}

/** OPL escapes special characters as %<hex code point>%. */
const decodeOpl = (value: string): string =>
  value.replace(/%([0-9a-fA-F]+)%/g, (_m, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)));

const parseTags = (field: string): Record<string, string> => {
  const tags: Record<string, string> = {};
  for (const pair of field.split(',')) {
    const eq = pair.indexOf('=');
    if (eq > 0) tags[decodeOpl(pair.slice(0, eq))] = decodeOpl(pair.slice(eq + 1));
  }
  return tags;
};

export const parseRouteRelations = (opl: string): RouteRelation[] =>
  opl
    .split('\n')
    .filter((line) => line.startsWith('r'))
    .map((line) => {
      const fields = line.split(' ');
      const tags = parseTags(fields.find((f) => f.startsWith('T'))?.slice(1) ?? '');
      return {
        id: fields[0] ?? '',
        route: tags['route'] ?? 'unknown',
        ref: tags['ref'] ?? null,
        name: tags['name'] ?? null,
        network: tags['network'] ?? null,
      };
    });
