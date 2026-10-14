/**
 * Role: tests content validation on a temporary content folder: valid content passes, schema errors and broken cross references are reported with file and path, duplicate ids, i18n strictness, deterministic packs.
 * Owner: backend
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readContentFiles, readI18nKeys } from './content-files.ts';
import { stableJson, writePacks } from './content-packs.ts';
import { categoriesWithoutNight, validateContent } from './content-validation.ts';

let dir = '';
const put = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dirname(join(dir, path)), { recursive: true });
  await writeFile(join(dir, path), JSON.stringify(value));
};

const rule = { start: 80, decayPerGameHour: 4, warnBelow: 20, penaltiesAtZero: [] };
const action = (over: Record<string, unknown> = {}) => ({
  id: 'food.eat_garba',
  version: 1,
  category: 'food',
  labelKey: 'action.food.eat_garba.label',
  where: { placeTypes: ['garba_stand'], site: 'counter', interactionRadiusM: 2 },
  duration: { gameMinutes: 30, real: { maxSeconds: 45 }, interruptible: true, onInterrupt: 'refund_none_partial_effects' },
  effects: { onComplete: [{ type: 'need', need: 'hunger', delta: 55 }] },
  ...over,
});
const place = { id: 'garba_stand', version: 1, labelKey: 'place.garba_stand.label', osmCategories: ['food.street_food'], sites: [{ kind: 'counter', capacity: 4, placement: 'around' }] };

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'content-'));
  await put('needs/needs.config.json', { version: 1, needs: { hunger: rule, energy: rule, hygiene: rule, social: rule, fun: rule } });
  await put('place-types/garba_stand.place.json', place);
  await put('i18n/fr-CI/places.json', { place: { garba_stand: { label: 'Garbadrome' } } });
});
afterEach(async () => rm(dir, { recursive: true, force: true }));

const run = async (strict = false) => validateContent(await readContentFiles(dir), await readI18nKeys(dir), { strict });

describe('validateContent', () => {
  it('should accept valid content and only warn about missing texts', async () => {
    await put('actions/food/eat-garba.action.json', action());
    const report = await run();
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([{ file: 'actions/food/eat-garba.action.json', path: 'labelKey', message: 'missing fr-CI text for "action.food.eat_garba.label"' }]);
    expect((await run(true)).errors).toHaveLength(1);
  });

  it('should report schema errors and broken references with the file and the path', async () => {
    await put('actions/food/eat-garba.action.json', action({ where: { placeTypes: ['maquis'], site: 'counter', interactionRadiusM: 2 } }));
    await put('actions/food/eat-alloco.action.json', action({ id: 'food.eat_alloco', duration: { gameMinutes: 0 } }));
    const report = await run();
    expect(report.errors).toEqual(
      expect.arrayContaining([
        { file: 'actions/food/eat-garba.action.json', path: 'where.placeTypes.0', message: 'unknown place type "maquis"' },
        expect.objectContaining({ file: 'actions/food/eat-alloco.action.json', path: 'duration.gameMinutes' }),
      ]),
    );
  });

  it('should refuse duplicate ids, a missing site kind and warn about a mismatched file name', async () => {
    await put('actions/food/eat-garba.action.json', action({ where: { placeTypes: ['garba_stand'], site: 'bed', interactionRadiusM: 2 } }));
    await put('actions/food/garba.action.json', action());
    const report = await run();
    expect(report.errors.map((e) => e.message)).toEqual(expect.arrayContaining([expect.stringContaining('duplicate action id'), expect.stringContaining('no place type of this action has a "bed" site')]));
    expect(report.warnings.map((w) => w.message)).toEqual(expect.arrayContaining([expect.stringContaining('does not match id')]));
  });
});

describe('night coverage', () => {
  it('should list the categories without any action available at night', async () => {
    await put('actions/food/eat-garba.action.json', action({ when: { windows: [{ from: '06:00', to: '20:00' }] } }));
    expect(categoriesWithoutNight((await run()).content)).toEqual(['food']);
    await put('actions/food/eat-garba.action.json', action({ when: { openingHoursFrom: 'none', windows: [] } }));
    expect(categoriesWithoutNight((await run()).content)).toEqual([]);
  });
});

describe('packs', () => {
  it('should write the same bytes whatever the key order of the sources', async () => {
    expect(stableJson({ b: 1, a: { d: 2, c: 3 } })).toBe(stableJson({ a: { c: 3, d: 2 }, b: 1 }));
    await put('actions/food/eat-garba.action.json', action());
    const report = await run();
    await writePacks(report.content, join(dir, 'out'));
    const pack = JSON.parse(await readFile(join(dir, 'out/actions.pack.json'), 'utf8')) as { id: string }[];
    expect(pack.map((a) => a.id)).toEqual(['food.eat_garba']);
  });
});
