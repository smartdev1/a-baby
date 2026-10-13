/**
 * Role: tests the in-memory bus: delivery by subject, unsubscribe, isolation of failing handlers.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { InMemoryBus } from './in-memory-bus.ts';
import { subjects } from './world-subjects.ts';

describe('InMemoryBus', () => {
  it('should deliver to subscribers of the subject only, until they unsubscribe', () => {
    const bus = new InMemoryBus();
    const got: string[] = [];
    const stop = bus.subscribe<string>(subjects.cellJoin('C_1_1'), (p) => got.push(p));
    bus.publish(subjects.cellJoin('C_1_1'), 'a');
    bus.publish(subjects.cellJoin('C_2_2'), 'b');
    stop();
    bus.publish(subjects.cellJoin('C_1_1'), 'c');
    expect(got).toEqual(['a']);
  });

  it('should keep delivering when one handler throws', () => {
    const errors: string[] = [];
    const bus = new InMemoryBus((subject) => errors.push(subject));
    const got: number[] = [];
    bus.subscribe('s', () => {
      throw new Error('boom');
    });
    bus.subscribe<number>('s', (p) => got.push(p));
    bus.publish('s', 1);
    expect(got).toEqual([1]);
    expect(errors).toEqual(['s']);
  });
});
