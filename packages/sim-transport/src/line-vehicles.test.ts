/**
 * Role: tests deterministic line vehicles: trip plan (speed from the nominal ratio, dwell at every stop), departures per period with midnight crossing, positions and docking at a time, next arrival, determinism (same inputs → same vehicles).
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { buildLineSchedule, departuresBetween, type ServiceProfile } from './line-schedule.ts';
import { dockedVehicleAt, nextArrivalAt, vehiclesAt } from './line-vehicles.ts';

/** 2 km straight east, stops at 0, 1 000 and 2 000 m (the middle one 30 m off the road). */
const line = {
  id: 'osm:relation/7',
  path: [[0, 0], [1000, 0], [2000, 0]] as [number, number][],
  stops: [
    { id: 'a', position: [0, 5] as [number, number] },
    { id: 'b', position: [1000, 30] as [number, number] },
    { id: 'c', position: [2000, 0] as [number, number] },
  ],
};
/** 36 km/h visible at ratio 12 ⇒ 600 m per real minute ⇒ 50 m per game minute. */
const profile: ServiceProfile = { cruiseKmh: 36, dwellGameMin: 2, periods: [{ fromMin: 360, toMin: 600, headwayMin: 30 }] };
const schedule = buildLineSchedule(line, profile, 12);
const firstDeparture = 360 + schedule.phase * 30;

describe('line schedule', () => {
  it('should plan the trip from the visible speed and dwell at every stop', () => {
    expect(schedule.speedMPerGameMin).toBeCloseTo(50);
    expect(schedule.stopAtM).toEqual([0, 1000, 2000]);
    expect(schedule.arriveMin).toEqual([0, 22, 44]);
    expect(schedule.departMin).toEqual([2, 24, 46]);
    expect(schedule.tripMin).toBe(46);
  });

  it('should list the departures of the period, with stable service ids, also across midnight', () => {
    const day = departuresBetween(schedule, 0, 1439);
    expect(day.map((d) => d.serviceId)).toEqual(['0.0.0', '0.0.1', '0.0.2', '0.0.3', '0.0.4', '0.0.5', '0.0.6', '0.0.7']);
    expect(day[0]?.departGameMin).toBeCloseTo(firstDeparture);
    const night = buildLineSchedule(line, { ...profile, periods: [{ fromMin: 1380, toMin: 60, headwayMin: 60 }] }, 12);
    expect(departuresBetween(night, 1440, 1500).map((d) => d.serviceId)).toEqual(['0.0.1']);
  });
});

describe('line vehicles', () => {
  it('should place the vehicle along the path and dock it at stops', () => {
    expect(vehiclesAt(schedule, firstDeparture - 1)).toEqual([]);
    const docked = vehiclesAt(schedule, firstDeparture + 1);
    expect(docked).toMatchObject([{ serviceId: '0.0.0', dockedAt: 0, x: 0 }]);
    const moving = vehiclesAt(schedule, firstDeparture + 12)[0];
    expect(moving).toMatchObject({ dockedAt: null, nextStop: 1, distanceM: 500, headingRad: 0 });
    expect(dockedVehicleAt(schedule, 1, firstDeparture + 23)?.serviceId).toBe('0.0.0');
    expect(dockedVehicleAt(schedule, 1, firstDeparture + 25)).toBeNull();
    expect(vehiclesAt(schedule, firstDeparture + 45)).toMatchObject([{ serviceId: '0.0.0', dockedAt: 2, x: 2000 }, { serviceId: '0.0.1', dockedAt: null, nextStop: 1 }]);
  });

  it('should give the next arrival at a stop, the next day when service is over', () => {
    expect(nextArrivalAt(schedule, 1, firstDeparture)).toBeCloseTo(firstDeparture + 22);
    expect(nextArrivalAt(schedule, 1, 700)).toBeCloseTo(1440 + firstDeparture + 22);
  });

  it('should be a pure function of the game time', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 3 * 1440, noNaN: true }), (t) => {
        const a = vehiclesAt(schedule, t);
        expect(vehiclesAt(buildLineSchedule(line, profile, 12), t)).toEqual(a);
        for (const v of a) expect(v.distanceM).toBeGreaterThanOrEqual(0);
        expect(a.length).toBeLessThanOrEqual(2);
      }),
    );
  });
});
