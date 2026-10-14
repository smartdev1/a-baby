/**
 * Role: reads osmium OPL lines (object type and id, tags with %xx% escapes, node coordinates, relation members) for the stages that ask osmium for raw objects (report, transit).
 * Owner: backend
 */

export interface OplMember {
  readonly type: 'n' | 'w' | 'r';
  readonly ref: string;
  readonly role: string;
}

export interface OplObject {
  /** `n123`, `w456`, `r789`. */
  readonly id: string;
  readonly tags: Readonly<Record<string, string>>;
  /** Nodes only (WGS84). */
  readonly lon: number | null;
  readonly lat: number | null;
  /** Relations only, in order. */
  readonly members: readonly OplMember[];
}

/** OPL escapes special characters as %<hex code point>%. */
export const decodeOpl = (value: string): string => value.replace(/%([0-9a-fA-F]+)%/g, (_m, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)));

export const parseOplTags = (field: string): Record<string, string> => {
  const tags: Record<string, string> = {};
  for (const pair of field.split(',')) {
    const eq = pair.indexOf('=');
    if (eq > 0) tags[decodeOpl(pair.slice(0, eq))] = decodeOpl(pair.slice(eq + 1));
  }
  return tags;
};

const parseMembers = (field: string): OplMember[] =>
  field
    .split(',')
    .filter(Boolean)
    .flatMap((m): OplMember[] => {
      const at = m.indexOf('@');
      const type = m[0];
      if (at < 2 || (type !== 'n' && type !== 'w' && type !== 'r')) return [];
      return [{ type, ref: m.slice(0, at), role: decodeOpl(m.slice(at + 1)) }];
    });

export const parseOplLine = (line: string): OplObject | null => {
  const fields = line.split(' ');
  const id = fields[0] ?? '';
  if (!/^[nwr]\d+$/.test(id)) return null;
  const field = (prefix: string): string | undefined => fields.find((f) => f.startsWith(prefix))?.slice(1);
  const x = field('x');
  const y = field('y');
  return {
    id,
    tags: parseOplTags(field('T') ?? ''),
    lon: x ? Number(x) : null,
    lat: y ? Number(y) : null,
    members: id.startsWith('r') ? parseMembers(field('M') ?? '') : [],
  };
};
