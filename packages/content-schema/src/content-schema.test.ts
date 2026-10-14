/**
 * Role: tests the content schemas: a real action file shape parses with its defaults, invalid files fail with the error path, needs config completeness, place types, jobs, items and generated JSON Schemas.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { ActionSchema, type ActionInput, EFFECT_TYPES, ItemSchema, jsonSchemaOf, JobSchema, NeedsConfigSchema, PlaceTypeSchema } from './index.ts';

const garba: ActionInput = {
  id: 'food.eat_garba',
  version: 1,
  category: 'food',
  labelKey: 'action.food.eat_garba.label',
  where: { placeTypes: ['garba_stand'], site: 'seat_or_counter', interactionRadiusM: 2.5 },
  requires: { needs: { hunger: { max: 90 } }, money: { minDjai: 500 }, state: ['on_foot'] },
  cost: { djai: { base: 500 }, payee: 'provider' },
  duration: { gameMinutes: 30, real: { maxSeconds: 45 }, interruptible: true, onInterrupt: 'refund_none_partial_effects' },
  effects: { onComplete: [{ type: 'need', need: 'hunger', delta: 55 }, { type: 'buff', buff: 'well_fed', gameMinutes: 240 }] },
};

const issuePaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }): string[] => (result.error?.issues ?? []).map((i) => i.path.join('.'));

describe('ActionSchema', () => {
  it('should parse an action and fill the defaults', () => {
    const a = ActionSchema.parse(garba);
    expect(a.when).toEqual({ openingHoursFrom: 'place', windows: [] });
    expect(a.participants).toEqual({ mode: 'solo', npcRoles: [] });
    expect(a.cost?.djai.priceSource).toBe('base');
    expect(a.effects.continuous).toEqual([]);
  });

  it('should reject unknown effects, bad windows, a foreign id and a cost without money requirement', () => {
    expect(issuePaths(ActionSchema.safeParse({ ...garba, effects: { onComplete: [{ type: 'teleport' }] } }))).toContain('effects.onComplete.0.type');
    expect(issuePaths(ActionSchema.safeParse({ ...garba, when: { windows: [{ from: '25:00', to: '06:00' }] } }))).toContain('when.windows.0.from');
    expect(issuePaths(ActionSchema.safeParse({ ...garba, id: 'rest.eat_garba' }))).toContain('id');
    expect(issuePaths(ActionSchema.safeParse({ ...garba, requires: {} }))).toContain('requires.money');
    expect(issuePaths(ActionSchema.safeParse({ ...garba, duration: { ...garba.duration, gameMinutes: -1 } }))).toContain('duration.gameMinutes');
  });

  it('should list the registered effect types', () => {
    expect(EFFECT_TYPES).toEqual(['need', 'buff', 'notification', 'money', 'skill_xp', 'item_add', 'item_remove']);
  });
});

describe('other schemas', () => {
  it('should require every need in the needs config', () => {
    const rule = { start: 80, decayPerGameHour: 4, warnBelow: 20, penaltiesAtZero: [] };
    expect(NeedsConfigSchema.safeParse({ version: 1, needs: { hunger: rule, energy: rule, hygiene: rule, social: rule, fun: rule } }).success).toBe(true);
    expect(issuePaths(NeedsConfigSchema.safeParse({ version: 1, needs: { hunger: rule } }))).toContain('needs.energy');
  });

  it('should parse place types, jobs and items', () => {
    expect(PlaceTypeSchema.parse({ id: 'maquis', version: 1, labelKey: 'place.maquis.label', osmCategories: ['food.maquis'], sites: [{ kind: 'seat', capacity: 4, placement: 'front' }] }).openingHours).toEqual([]);
    const job = { id: 'waiter_maquis', version: 1, labelKey: 'job.waiter.label', employerPlaceTypes: ['maquis'], shifts: [{ from: '18:00', to: '02:00' }], workAction: 'work.serve_maquis', wagePerShiftDjai: 3000, maxPaidShiftsPerGameDay: 1, levels: [{ level: 1, minShifts: 0, wageBonusPercent: 0 }] };
    expect(JobSchema.safeParse(job).success).toBe(true);
    expect(ItemSchema.safeParse({ id: 'food.bread', version: 1, labelKey: 'item.food.bread.label', category: 'food', stackable: false, maxStack: 5 }).success).toBe(false);
  });

  it('should generate JSON Schemas from the Zod schemas', () => {
    const schema = jsonSchemaOf('action');
    expect(schema['type']).toBe('object');
    expect(schema['required']).toEqual(expect.arrayContaining(['id', 'version', 'category', 'labelKey', 'where', 'duration', 'effects']));
    expect(jsonSchemaOf('place-type')['type']).toBe('object');
  });
});
