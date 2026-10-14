/**
 * Role: tests metered taxis: refusals (no road nearby, unknown place, unreachable, insufficient funds, busy), assignment with a deterministic ETA and the route fare, pickup charging once then the accelerated drive to the place, cancellation when the player walked away.
 * Owner: backend
 */

import type { UtmPosition } from '@skyline/geo';
import type { ServerMessage, TaxiUpdateMessage } from '@skyline/protocol';
import { RoadGraph } from '@skyline/sim-transport';
import { describe, expect, it } from 'vitest';
import { grantStarterMoney, InMemoryEconomy } from '../adapters/in-memory-economy.ts';
import { TaxiService } from './taxi-service.ts';

const E = 381_000;
const N = 589_000;
/** A two-way street of 2 km going east, and two places: one by its end, one in an unowned cell. */
const roads = new RoadGraph(
  [
    { id: 'a', position: [E, N] },
    { id: 'b', position: [E + 1000, N] },
    { id: 'c', position: [E + 2000, N] },
  ],
  [
    { id: 'ab', from: 'a', to: 'b', lengthM: 1000, oneway: 0, cars: true, pedestrians: true, geometry: [[E, N], [E + 1000, N]] },
    { id: 'bc', from: 'b', to: 'c', lengthM: 1000, oneway: 0, cars: true, pedestrians: true, geometry: [[E + 1000, N], [E + 2000, N]] },
  ],
);
const places = new Map<string, UtmPosition>([
  ['osm:node/10', { eastingM: E + 2000, northingM: N + 50 }],
  ['osm:node/11', { eastingM: E + 9000, northingM: N }],
]);
const fare = { pickupDjai: 300, perKmDjai: 250, cruiseKmh: 36, etaGameMin: { min: 2, max: 6 } };

const setup = () => {
  const economy = new InMemoryEconomy();
  const sent: [string, ServerMessage][] = [];
  const positions = new Map<string, UtmPosition>([['s1', { eastingM: E + 5, northingM: N + 10 }], ['far', { eastingM: E + 500, northingM: N + 400 }]]);
  let realMs = 0;
  let busyRide = false;
  const taxis = new TaxiService(
    {
      map: { roads, places },
      fare,
      economy,
      clockRatio: () => 12,
      realNow: () => realMs,
      reachable: (utm) => utm.eastingM < E + 5000,
      busyElsewhere: () => busyRide,
      send: (s, m) => sent.push([s, m]),
      refreshWallet: () => Promise.resolve(),
    },
    { characterOf: (s) => s, utmOf: (s) => positions.get(s) ?? null },
  );
  const hail = (s: string, place = 'osm:node/10', requestId = `taxi-${s}-0001`) => taxis.request(s, { requestId, destinationPlaceId: place });
  const last = (s: string): TaxiUpdateMessage | undefined => {
    const m = sent.filter(([who, msg]) => who === s && msg.type === 'taxiUpdate').at(-1)?.[1];
    return m?.type === 'taxiUpdate' ? m.body : undefined;
  };
  return { economy, taxis, hail, last, positions, advance: (ms: number) => (realMs += ms), ride: () => (busyRide = true) };
};
const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('taxis', () => {
  it('should refuse players away from roads, unknown or unreachable places, and players who cannot pay', async () => {
    const { hail, last } = setup();
    await hail('far');
    expect(last('far')?.refusals).toEqual([{ code: 'no_road_nearby' }]);
    await hail('s1', 'osm:node/99');
    expect(last('s1')?.refusals).toEqual([{ code: 'unknown_place' }]);
    await hail('s1', 'osm:node/11');
    expect(last('s1')?.refusals).toEqual([{ code: 'unreachable' }]);
    await hail('s1');
    expect(last('s1')?.refusals).toEqual([{ code: 'insufficient_funds' }]);
  });

  it('should assign a taxi, pick the player up, charge the route once and drop them at the place', async () => {
    const { economy, taxis, hail, last, advance } = setup();
    await grantStarterMoney(economy, 's1', 1000);
    await hail('s1');
    const assigned = last('s1');
    expect(assigned).toMatchObject({ state: 'assigned', fareDjai: 800, distanceM: 2000 });
    // 2 to 6 game minutes at ratio 12 ⇒ 10 to 30 real seconds.
    expect(assigned?.etaMs).toBeGreaterThanOrEqual(10_000);
    expect(assigned?.etaMs).toBeLessThanOrEqual(30_000);
    await hail('s1'); // replay: same answer
    expect(last('s1')).toEqual(assigned);
    await hail('s1', 'osm:node/10', 'taxi-s1-0002');
    expect(last('s1')?.refusals).toEqual([{ code: 'busy' }]);
    advance(assigned?.etaMs ?? 0);
    expect(taxis.step()).toEqual([]);
    await settle();
    // 2 km at 36 km/h = 200 real s; a sixth ⇒ 33 s, capped at 30 s.
    expect(last('s1')).toMatchObject({ state: 'boarded', etaMs: 30_000 });
    expect(taxis.isAboard('s1')).toBe(true);
    expect(await economy.balanceOf('character:s1')).toBe(200n);
    advance(30_000);
    expect(taxis.step()).toEqual([{ sessionId: 's1', destination: { eastingM: E + 2000, northingM: N } }]);
    expect(last('s1')?.state).toBe('arrived');
    expect(taxis.hasJob('s1')).toBe(false);
  });

  it('should cancel without charge when the player walked away, and refuse a player already in a line ride', async () => {
    const { economy, taxis, hail, last, advance, positions, ride } = setup();
    await grantStarterMoney(economy, 's1', 1000);
    await hail('s1');
    positions.set('s1', { eastingM: E + 300, northingM: N + 200 });
    advance(60_000);
    taxis.step();
    await settle();
    expect(last('s1')).toMatchObject({ state: 'cancelled', refusals: [{ code: 'missed' }] });
    expect(await economy.balanceOf('character:s1')).toBe(1000n);
    ride();
    await hail('s1', 'osm:node/10', 'taxi-s1-0003');
    expect(last('s1')?.refusals).toEqual([{ code: 'busy' }]);
  });
});
