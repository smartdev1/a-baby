/**
 * Role: world clock segment read from the services process (GET /api/v1/world-clock), cached a few seconds so a burst of joins makes one request.
 * Owner: backend
 */

import type { ClockSegment } from '@skyline/sim-clock';

const CACHE_MS = 5000;

export const httpClockSource = (servicesUrl: string, now: () => number = () => Date.now()): (() => Promise<ClockSegment>) => {
  let cached: { segment: Promise<ClockSegment>; atMs: number } | null = null;
  const fetchSegment = async (): Promise<ClockSegment> => {
    const response = await fetch(`${servicesUrl}/api/v1/world-clock`, { signal: AbortSignal.timeout(2000) });
    if (!response.ok) throw new Error(`world clock HTTP ${response.status}`);
    return ((await response.json()) as { segment: ClockSegment }).segment;
  };
  return () => {
    if (!cached || now() - cached.atMs > CACHE_MS) {
      const segment = fetchSegment();
      cached = { segment, atMs: now() };
      segment.catch(() => (cached = null));
    }
    return cached.segment;
  };
};
