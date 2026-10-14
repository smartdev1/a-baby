/**
 * Role: validates content: each file against its Zod schema, then the cross references (place types, work actions, items, duplicate ids, file names) and the i18n keys; returns errors and warnings naming the file and the path.
 * Owner: backend
 */

import { type Action, CONTENT_SCHEMAS, type ContentKind, type Item, type Job, type PlaceType } from '@skyline/content-schema';
import type { ContentFile } from './content-files.ts';

export interface Problem {
  readonly file: string;
  readonly path: string;
  readonly message: string;
}

export interface ValidContent {
  readonly actions: Action[];
  readonly placeTypes: PlaceType[];
  readonly jobs: Job[];
  readonly items: Item[];
  readonly needs: unknown;
}

export interface ValidationReport {
  readonly errors: Problem[];
  readonly warnings: Problem[];
  readonly content: ValidContent;
  /** Files of each valid content id (for cross-reference messages). */
  readonly fileOf: ReadonlyMap<string, string>;
}

/** Actions and items: last id segment in kebab case (`food.eat_garba` → `eat-garba`); place types and jobs: the id itself (`garba_stand`). */
const expectedBaseName = (kind: ContentKind, id: string): string => (kind === 'action' || kind === 'item' ? (id.split('.').at(-1) ?? id).replaceAll('_', '-') : id);

const parseAll = (files: readonly ContentFile[], report: ValidationReport): void => {
  for (const f of files) {
    const result = CONTENT_SCHEMAS[f.kind].safeParse(f.json);
    if (!result.success) {
      for (const issue of result.error.issues) report.errors.push({ file: f.path, path: issue.path.join('.'), message: issue.message });
      continue;
    }
    if (f.kind === 'needs') {
      (report.content as { needs: unknown }).needs = result.data;
      continue;
    }
    const value = result.data as { id: string };
    const base = f.path.split('/').at(-1)?.split('.')[0] ?? '';
    if (base !== expectedBaseName(f.kind, value.id)) report.warnings.push({ file: f.path, path: 'id', message: `file name "${base}" does not match id "${value.id}" (expected ${expectedBaseName(f.kind, value.id)})` });
    const key = `${f.kind}:${value.id}`;
    const twin = report.fileOf.get(key);
    if (twin) report.errors.push({ file: f.path, path: 'id', message: `duplicate ${f.kind} id "${value.id}" (also in ${twin})` });
    (report.fileOf as Map<string, string>).set(key, f.path);
    const lists: Record<Exclude<ContentKind, 'needs'>, unknown[]> = { action: report.content.actions, 'place-type': report.content.placeTypes, job: report.content.jobs, item: report.content.items };
    lists[f.kind].push(value);
  }
};

const checkReferences = (report: ValidationReport): void => {
  const { content, fileOf } = report;
  const has = (kind: ContentKind, id: string): boolean => fileOf.has(`${kind}:${id}`);
  const err = (kind: ContentKind, id: string, path: string, message: string): void => {
    report.errors.push({ file: fileOf.get(`${kind}:${id}`) ?? '?', path, message });
  };
  for (const a of content.actions) {
    a.where.placeTypes.forEach((p, k) => !has('place-type', p) && err('action', a.id, `where.placeTypes.${k}`, `unknown place type "${p}"`));
    const effects = [...a.effects.onComplete, ...a.outcomes.flatMap((o) => o.effects)];
    for (const e of effects) if ((e.type === 'item_add' || e.type === 'item_remove') && !has('item', e.item)) err('action', a.id, 'effects', `unknown item "${e.item}"`);
    const sites = new Set(content.placeTypes.filter((p) => a.where.placeTypes.includes(p.id)).flatMap((p) => p.sites.map((s) => s.kind)));
    if (sites.size > 0 && !sites.has(a.where.site)) err('action', a.id, 'where.site', `no place type of this action has a "${a.where.site}" site`);
  }
  for (const j of content.jobs) {
    j.employerPlaceTypes.forEach((p, k) => !has('place-type', p) && err('job', j.id, `employerPlaceTypes.${k}`, `unknown place type "${p}"`));
    if (!has('action', j.workAction)) err('job', j.id, 'workAction', `unknown action "${j.workAction}"`);
  }
  if (content.needs === null) report.errors.push({ file: 'needs/needs.config.json', path: '', message: 'missing needs config' });
};

const i18nKeysOf = (c: ValidContent): { kind: ContentKind; id: string; path: string; key: string }[] => [
  ...c.actions.flatMap((a) => [
    { kind: 'action' as const, id: a.id, path: 'labelKey', key: a.labelKey },
    ...(a.descriptionKey ? [{ kind: 'action' as const, id: a.id, path: 'descriptionKey', key: a.descriptionKey }] : []),
    ...[...a.effects.onComplete, ...a.outcomes.flatMap((o) => o.effects)].flatMap((e) => (e.type === 'notification' ? [{ kind: 'action' as const, id: a.id, path: 'effects', key: e.key }] : [])),
  ]),
  ...c.placeTypes.map((p) => ({ kind: 'place-type' as const, id: p.id, path: 'labelKey', key: p.labelKey })),
  ...c.jobs.map((j) => ({ kind: 'job' as const, id: j.id, path: 'labelKey', key: j.labelKey })),
  ...c.items.map((i) => ({ kind: 'item' as const, id: i.id, path: 'labelKey', key: i.labelKey })),
];

/** Missing keys are warnings until the frontend catalogue exists; `strict` makes them errors. */
const checkI18n = (report: ValidationReport, i18n: ReadonlyMap<string, ReadonlySet<string>>, locale: string, strict: boolean): void => {
  const keys = i18n.get(locale) ?? new Set<string>();
  for (const ref of i18nKeysOf(report.content)) {
    if (keys.has(ref.key)) continue;
    (strict ? report.errors : report.warnings).push({ file: report.fileOf.get(`${ref.kind}:${ref.id}`) ?? '?', path: ref.path, message: `missing ${locale} text for "${ref.key}"` });
  }
};

export const validateContent = (files: readonly ContentFile[], i18n: ReadonlyMap<string, ReadonlySet<string>>, options: { strict: boolean; locale?: string }): ValidationReport => {
  const report: ValidationReport = { errors: [], warnings: [], content: { actions: [], placeTypes: [], jobs: [], items: [], needs: null }, fileOf: new Map() };
  parseAll(files, report);
  checkReferences(report);
  checkI18n(report, i18n, options.locale ?? 'fr-CI', options.strict);
  return report;
};
