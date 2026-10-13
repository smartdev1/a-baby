/**
 * Role: integration test of the NATS bus (publish, subscribe, unsubscribe, handler errors); runs only when SKYLINE_NATS_TEST_URL is set.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { NatsBus } from './nats-bus.ts';

const url = process.env.SKYLINE_NATS_TEST_URL;

describe.runIf(url)('NatsBus', () => {
  it('should deliver payloads, stop after unsubscribe and report handler errors', async () => {
    const errors: string[] = [];
    const bus = await NatsBus.connect(url ?? '', (subject) => errors.push(subject));
    const got: { n: number }[] = [];
    const unsubscribe = bus.subscribe<{ n: number }>('test.bus.a', (m) => got.push(m));
    bus.subscribe('test.bus.b', () => {
      throw new Error('boom');
    });
    bus.publish('test.bus.a', { n: 1 });
    bus.publish('test.bus.b', {});
    await bus.flush();
    await new Promise((r) => setTimeout(r, 50));
    unsubscribe();
    bus.publish('test.bus.a', { n: 2 });
    await bus.flush();
    await new Promise((r) => setTimeout(r, 50));
    await bus.close();
    expect(got).toEqual([{ n: 1 }]);
    expect(errors).toEqual(['test.bus.b']);
  });
});
