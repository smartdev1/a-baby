/**
 * Role: tests needs: start values, linear decay clamped to 0–100, decay split in pieces equals one step (property), frozen offline, deltas, penalties, warnings and morale.
 * Owner: backend
 */

import fc from 'fast-check';
import type { NeedsConfig } from '@skyline/content-schema';
import { describe, expect, it } from 'vitest';
import { advanceNeeds, applyNeedDeltas, hoursUntilEmpty, initialNeeds, morale, needPenalties, needWarnings, resumeNeeds } from './index.ts';

const rule = (start: number, decayPerGameHour: number, penaltiesAtZero: NeedsConfig['needs']['hunger']['penaltiesAtZero'] = []) => ({ start, decayPerGameHour, warnBelow: 25, penaltiesAtZero });
const config: NeedsConfig = {
  version: 1,
  needs: { hunger: rule(80, 4.5, ['slow_walk', 'no_work_actions']), energy: rule(90, 5, ['slow_walk']), hygiene: rule(85, 2.5), social: rule(70, 2.5), fun: rule(70, 0) },
};

describe('needs decay', () => {
  it('should start from the config and decay per game hour, clamped at 0', () => {
    const s = initialNeeds(config, 600);
    expect(s.values.hunger).toBe(80);
    const later = advanceNeeds(s, 600 + 120, config);
    expect(later.values.hunger).toBe(71);
    expect(later.values.fun).toBe(70);
    expect(advanceNeeds(s, 600 + 60 * 48, config).values.hunger).toBe(0);
  });

  it('should give the same result in one step or in many (game-time additivity)', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 90 }), { minLength: 1, maxLength: 40 }), (steps) => {
        const start = initialNeeds(config, 0);
        let pieces = start;
        let t = 0;
        for (const d of steps) pieces = advanceNeeds(pieces, (t += d), config);
        const once = advanceNeeds(start, t, config);
        return Object.keys(once.values).every((k) => Math.abs(once.values[k as 'hunger'] - pieces.values[k as 'hunger']) <= 0.01 * steps.length + 1e-9);
      }),
    );
  });

  it('should not decay offline and never go back in time', () => {
    const s = initialNeeds(config, 0);
    const back = resumeNeeds(s, 60 * 24 * 3);
    expect(back.values).toEqual(s.values);
    expect(advanceNeeds(back, 60 * 24 * 3, config).values).toEqual(s.values);
    expect(advanceNeeds(back, 10, config).atGameMinute).toBe(60 * 24 * 3);
  });

  it('should apply action deltas within 0–100', () => {
    const s = applyNeedDeltas(initialNeeds(config, 0), { hunger: 55, energy: -200 });
    expect(s.values.hunger).toBe(100);
    expect(s.values.energy).toBe(0);
  });
});

describe('needs effects', () => {
  it('should report penalties of empty needs, warnings and a morale pulled down by the lowest need', () => {
    const s = applyNeedDeltas(initialNeeds(config, 0), { hunger: -100, hygiene: -70 });
    expect(needPenalties(s.values, config)).toEqual(['no_work_actions', 'slow_walk']);
    expect(needWarnings(s.values, config)).toEqual(['hunger', 'hygiene']);
    expect(morale(s.values)).toBeLessThan(morale(initialNeeds(config, 0).values));
    expect(hoursUntilEmpty(initialNeeds(config, 0).values, 'hunger', config)).toBeCloseTo(80 / 4.5, 5);
    expect(hoursUntilEmpty(initialNeeds(config, 0).values, 'fun', config)).toBe(Number.POSITIVE_INFINITY);
  });
});
