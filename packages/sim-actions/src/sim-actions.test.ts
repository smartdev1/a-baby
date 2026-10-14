/**
 * Role: tests the action engine: conditions and refusal reasons, time windows across midnight, a full run settled once (needs, legs, buff, cooldown), ellipse and continuous effects, interruptions, illegal transitions, idempotent settlement and outcome draws.
 * Owner: backend
 */

import fc from 'fast-check';
import { type Action, ActionSchema } from '@skyline/content-schema';
import { describe, expect, it } from 'vitest';
import {
  type ActorView,
  drawWeighted,
  evaluateConditions,
  IllegalTransitionError,
  inWindows,
  interruptRun,
  type PlaceView,
  realDurationMs,
  requestRun,
  reserveRun,
  settle,
  SettlementStore,
  startRun,
  tickRun,
} from './index.ts';

const garba: Action = ActionSchema.parse({
  id: 'food.eat_garba',
  version: 1,
  category: 'food',
  labelKey: 'action.food.eat_garba.label',
  where: { placeTypes: ['garba_stand'], site: 'seat_or_counter', interactionRadiusM: 2.5 },
  when: { windows: [{ from: '06:00', to: '23:30' }] },
  requires: { needs: { hunger: { max: 90 } }, money: { minDjai: 500 }, state: ['on_foot', 'not_in_action'], cooldown: { gameMinutes: 180, scope: 'character' } },
  cost: { djai: { base: 500 }, payee: 'provider' },
  duration: { gameMinutes: 30, real: { maxSeconds: 45 }, interruptible: true, onInterrupt: 'refund_none_partial_effects' },
  effects: { onComplete: [{ type: 'need', need: 'hunger', delta: 55 }, { type: 'need', need: 'social', delta: 5, if: { nearbyCharacters: { min: 1 } } }, { type: 'buff', buff: 'well_fed', gameMinutes: 240 }] },
  outcomes: [{ weight: 95, effects: [] }, { weight: 5, effects: [{ type: 'need', need: 'fun', delta: 3 }] }],
});

const sleep: Action = ActionSchema.parse({
  id: 'rest.sleep_bench',
  version: 1,
  category: 'rest',
  labelKey: 'action.rest.sleep_bench.label',
  where: { placeTypes: ['bench'], site: 'bench_seat', interactionRadiusM: 1.5 },
  when: { openingHoursFrom: 'none' },
  duration: { gameMinutes: 360, real: { maxSeconds: 150 }, interruptible: true, onInterrupt: 'refund_none_partial_effects' },
  effects: { continuous: [{ type: 'need', need: 'energy', deltaPerGameHour: 11 }] },
});

const NOON = 60 * 24 * 3 + 12 * 60;
const actor = (over: Partial<ActorView> = {}): ActorView => ({
  characterId: 'c1',
  needs: { hunger: 30, energy: 50, hygiene: 60, social: 40, fun: 40 },
  djai: 2000,
  states: new Set(['on_foot', 'not_in_action']),
  gameMinute: NOON,
  cooldowns: new Map(),
  nearbyCharacters: 0,
  ...over,
});
const stand: PlaceView = { placeId: 'p1', placeType: 'garba_stand', openingHours: [{ from: '06:00', to: '23:30' }], distanceToSiteM: 1, freeSites: 2 };
const ctx = { actorAccount: 'character:c1', providerAccount: 'place:p1', actionId: 'food.eat_garba', nearbyCharacters: 0 };

describe('conditions', () => {
  it('should accept a valid request and list every refusal reason otherwise', () => {
    expect(evaluateConditions(garba, actor(), stand)).toEqual([]);
    const codes = evaluateConditions(garba, actor({ needs: { hunger: 95, energy: 50, hygiene: 60, social: 40, fun: 40 }, djai: 100, gameMinute: NOON + 12 * 60, states: new Set(['in_vehicle']) }), { ...stand, distanceToSiteM: 9 }).map((r) => r.code);
    expect(codes).toEqual(['too_far', 'place_closed', 'outside_hours', 'wrong_state', 'wrong_state', 'need_too_high', 'not_enough_money']);
    expect(evaluateConditions(garba, actor(), { ...stand, placeType: 'church' })[0]?.code).toBe('wrong_place');
    expect(evaluateConditions(garba, actor({ cooldowns: new Map([['food.eat_garba', NOON + 30]]) }), stand)).toEqual([{ code: 'cooldown', params: { gameMinutesLeft: 30 } }]);
  });

  it('should require the NPC roles of the action to be on duty', () => {
    const withVendor = ActionSchema.parse({ ...garba, participants: { mode: 'solo', npcRoles: [{ role: 'vendor', required: true }] } });
    expect(evaluateConditions(withVendor, actor(), { ...stand, npcRolesOnDuty: ['vendor'] })).toEqual([]);
    expect(evaluateConditions(withVendor, actor(), { ...stand, npcRolesOnDuty: [] })).toEqual([{ code: 'no_npc', params: { role: 'vendor' } }]);
    expect(evaluateConditions(withVendor, actor(), stand)).toEqual([]);
  });

  it('should handle windows across midnight and up to 24:00', () => {
    const night = [{ from: '22:00', to: '06:00' }];
    expect(inWindows(night, 23 * 60)).toBe(true);
    expect(inWindows(night, 3 * 60 + 1440 * 5)).toBe(true);
    expect(inWindows(night, 12 * 60)).toBe(false);
    expect(inWindows([{ from: '07:00', to: '24:00' }], 23 * 60 + 59)).toBe(true);
    expect(inWindows([], 0)).toBe(true);
  });
});

describe('action run', () => {
  it('should run garba end to end and settle needs, cost, buff and cooldown', () => {
    let run = reserveRun(requestRun({ requestId: 'r1', action: garba, actor: actor(), place: stand }), true);
    run = startRun(run, 1000);
    run = tickRun(run, garba, 12, 1000 + 46_000).run;
    expect(run.state).toBe('completed');
    const { settlement } = settle({ run, action: garba, ctx, gameMinute: NOON + 30 });
    expect(settlement.key).toBe('action:r1');
    expect(settlement.batch.needDeltas.hunger).toBe(55);
    expect(settlement.batch.needDeltas.social).toBeUndefined();
    expect(settlement.batch.legs).toEqual([{ from: 'character:c1', to: 'place:p1', djai: 500, reason: 'food.eat_garba' }]);
    expect(settlement.batch.buffs).toEqual([{ buff: 'well_fed', gameMinutes: 240 }]);
    expect(settlement.cooldown).toEqual({ scope: 'character', untilGameMinute: NOON + 210 });
  });

  it('should compress a long action (ellipse) and apply the full continuous effect whatever the ticks', () => {
    expect(realDurationMs(sleep, 12)).toBe(150_000);
    expect(realDurationMs(garba, 12)).toBe(45_000);
    expect(realDurationMs(garba, 120)).toBe(15_000);
    const bench: PlaceView = { ...stand, placeType: 'bench', openingHours: [] };
    let run = startRun(reserveRun(requestRun({ requestId: 's1', action: sleep, actor: actor(), place: bench }), true), 0);
    let energy = 0;
    for (let t = 1000; t <= 151_000; t += 1000) {
      const step = tickRun(run, sleep, 12, t);
      run = step.run;
      energy += step.needDeltas.energy ?? 0;
    }
    expect(run.state).toBe('completed');
    expect(energy).toBeCloseTo(66, 6);
  });

  it('should settle an interruption as the file says and refuse illegal transitions', () => {
    const running = startRun(reserveRun(requestRun({ requestId: 'r2', action: garba, actor: actor(), place: stand }), true), 0);
    const { settlement } = settle({ run: interruptRun(running, 'walked_away'), action: garba, ctx, gameMinute: NOON });
    expect(settlement.endedAs).toBe('interrupted');
    expect(settlement.batch.legs).toHaveLength(1);
    expect(settlement.batch.needDeltas).toEqual({});
    expect(settlement.cooldown).toBeNull();
    const refunded = settle({ run: interruptRun(running, 'x'), action: { ...garba, duration: { ...garba.duration, onInterrupt: 'refund_full_no_effects' } }, ctx, gameMinute: NOON });
    expect(refunded.settlement.batch.legs).toEqual([]);
    expect(() => startRun(running, 1)).toThrow(IllegalTransitionError);
    const rejected = requestRun({ requestId: 'r3', action: garba, actor: actor({ djai: 0 }), place: stand });
    expect(rejected.state).toBe('rejected');
    expect(() => reserveRun(rejected, true)).toThrow(IllegalTransitionError);
  });
});

describe('settlement idempotency and outcomes', () => {
  it('should settle a request once however often it is replayed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (replays) => {
        const store = new SettlementStore();
        const run = tickRun(startRun(reserveRun(requestRun({ requestId: 'same', action: garba, actor: actor(), place: stand }), true), 0), garba, 12, 60_000).run;
        const results = Array.from({ length: replays }, () => store.settleOnce({ run, action: garba, ctx, gameMinute: NOON }));
        return store.size === 1 && results.every((r) => r === results[0]) && results[0]?.batch.legs.length === 1;
      }),
    );
  });

  it('should draw outcomes deterministically with the file weights', () => {
    expect(drawWeighted([95, 5], 'req-42')).toBe(drawWeighted([95, 5], 'req-42'));
    const rare = Array.from({ length: 4000 }, (_, k) => drawWeighted([95, 5], `req-${k}`)).filter((i) => i === 1).length;
    expect(rare).toBeGreaterThan(140);
    expect(rare).toBeLessThan(260);
    expect(drawWeighted([], 'x')).toBe(-1);
  });
});
