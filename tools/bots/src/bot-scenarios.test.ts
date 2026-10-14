/**
 * Role: tests the bot scenarios: market bots head for the meeting point then mill around it, social bots chat on a seeded schedule and ask for one taxi.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { type BotState, extrasFor, inputFor } from './bot-scenarios.ts';

const state = (over: Partial<BotState>): BotState => ({ seq: 1, random: () => 0.5, position: { x: 0, z: 0 }, spawn: { x: 0, z: 0 }, heading: 0, ...over });

describe('bot scenarios', () => {
  it('should send market bots towards the point 40 m north of the spawn, running when far', () => {
    expect(inputFor('market', state({}))).toMatchObject({ yawRad: 0, flags: { run: true } });
    expect(inputFor('market', state({ position: { x: 20, z: 40 } })).yawRad).toBeCloseTo(-Math.PI / 2);
    expect(inputFor('market', state({ seq: 20, position: { x: 2, z: 38 } })).yawRad).toBeCloseTo(Math.PI);
  });

  it('should make social bots chat every 5 s and hail one taxi', () => {
    const ticks = Array.from({ length: 400 }, (_, k) => extrasFor('social', state({ seq: k + 1 }), 3, 'osm:node/1')).flat();
    expect(ticks.filter((m) => m.type === 'chatSend')).toHaveLength(4);
    expect(ticks.filter((m) => m.type === 'taxiRequest')).toEqual([{ type: 'taxiRequest', body: { requestId: 'bot-3-taxi-0001', destinationPlaceId: 'osm:node/1' } }]);
    expect(extrasFor('random', state({ seq: 100 }), 3, null)).toEqual([]);
  });
});
