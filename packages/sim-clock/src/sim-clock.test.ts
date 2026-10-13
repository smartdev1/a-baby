/**
 * Role: tests the world clock: ratio, continuity across ratio changes and pauses, calendar, overnight windows, client offset estimation.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { changeRatio, gameMinutesAt, pause, resume, type ClockSegment } from './clock-segment.ts';
import { estimateServerOffsetMs } from './clock-sync.ts';
import { gameDateOf, type GameCalendar } from './game-calendar.ts';
import { isOpenAt, minutesUntilOpen, parseClockTime } from './time-windows.ts';

const START: ClockSegment = { realStartMs: 1_000_000, gameStartMin: 360, ratio: 12, paused: false };
const CALENDAR: GameCalendar = {
  hoursPerDay: 24,
  weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => `calendar.weekday.${d}`),
  monthDays: Array.from({ length: 12 }, () => 30),
  firstWeekday: 0,
  startYear: 2026,
};

describe('clock segments', () => {
  it('should make one game day last two real hours at ratio 12', () => {
    expect(gameMinutesAt(START, START.realStartMs + 2 * 3_600_000) - 360).toBe(1440);
  });

  it('should keep game time continuous across ratio changes and pauses', () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), fc.double({ min: 0.5, max: 100, noNaN: true }), (elapsed, ratio) => {
        const at = START.realStartMs + elapsed;
        const before = gameMinutesAt(START, at);
        return Math.abs(gameMinutesAt(changeRatio(START, ratio, at), at) - before) < 1e-9 && gameMinutesAt(pause(START, at), at + 999_999) === before;
      }),
    );
    const paused = pause(START, 2_000_000);
    expect(gameMinutesAt(resume(paused, 5_000_000), 5_000_000)).toBe(gameMinutesAt(START, 2_000_000));
  });

  it('should refuse an invalid ratio', () => {
    expect(() => changeRatio(START, 0, 1)).toThrow(RangeError);
  });
});

describe('gameDateOf', () => {
  it('should give day 0 at 06:00 for 360 minutes', () => {
    expect(gameDateOf(360, CALENDAR)).toMatchObject({ year: 2026, month: 1, day: 1, hour: 6, minute: 0, weekdayKey: 'calendar.weekday.monday' });
  });

  it('should roll weekdays, months and years', () => {
    expect(gameDateOf(1440 * 8 + 75, CALENDAR)).toMatchObject({ day: 9, weekdayKey: 'calendar.weekday.tuesday', hour: 1, minute: 15 });
    expect(gameDateOf(1440 * 30, CALENDAR)).toMatchObject({ month: 2, day: 1 });
    expect(gameDateOf(1440 * 360, CALENDAR)).toMatchObject({ year: 2027, month: 1, day: 1 });
  });
});

describe('time windows', () => {
  it('should handle day and overnight windows', () => {
    const shop = { openMin: parseClockTime('08:00'), closeMin: parseClockTime('20:00') };
    const maquis = { openMin: parseClockTime('18:00'), closeMin: parseClockTime('04:00') };
    expect(isOpenAt(shop, parseClockTime('12:00'))).toBe(true);
    expect(isOpenAt(shop, parseClockTime('20:00'))).toBe(false);
    expect(isOpenAt(maquis, parseClockTime('23:30'))).toBe(true);
    expect(isOpenAt(maquis, parseClockTime('03:59'))).toBe(true);
    expect(isOpenAt(maquis, parseClockTime('12:00'))).toBe(false);
    expect(minutesUntilOpen(maquis, parseClockTime('17:00'))).toBe(60);
    expect(() => parseClockTime('25:00')).toThrow(SyntaxError);
  });
});

describe('estimateServerOffsetMs', () => {
  it('should stay within 20 ms of the true offset despite jittery samples, i.e. far below 1 game minute (5 s)', () => {
    const trueOffset = 12_345;
    const samples = Array.from({ length: 30 }, (_, k) => {
      const sentMs = k * 1000;
      const up = 40 + ((k * 37) % 200);
      const down = 40 + ((k * 53) % 200);
      return { sentMs, serverMs: sentMs + up + trueOffset, receivedMs: sentMs + up + down };
    });
    expect(Math.abs((estimateServerOffsetMs(samples) ?? 0) - trueOffset)).toBeLessThan(20);
    expect(estimateServerOffsetMs([])).toBeNull();
  });
});
