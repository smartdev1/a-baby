/**
 * Role: internal world clock segments (ADR 0011): game minutes from real time with a ratio, pauses and ratio changes that keep game time continuous.
 * Owner: backend
 */

export interface ClockSegment {
  /** Real time (ms since epoch, server clock) when the segment starts. */
  readonly realStartMs: number;
  /** Game time (minutes since game epoch) at `realStartMs`. */
  readonly gameStartMin: number;
  /** Game minutes per real minute (12 ⇒ one game day = 2 real hours). */
  readonly ratio: number;
  readonly paused: boolean;
}

const MS_PER_MIN = 60_000;

export const gameMinutesAt = (segment: ClockSegment, realMs: number): number =>
  segment.paused ? segment.gameStartMin : segment.gameStartMin + ((realMs - segment.realStartMs) / MS_PER_MIN) * segment.ratio;

/** New segment starting at `realMs`, continuing the current game time. */
const continueAt = (segment: ClockSegment, realMs: number, changes: Partial<Pick<ClockSegment, 'ratio' | 'paused'>>): ClockSegment => ({
  realStartMs: realMs,
  gameStartMin: gameMinutesAt(segment, realMs),
  ratio: changes.ratio ?? segment.ratio,
  paused: changes.paused ?? segment.paused,
});

export const changeRatio = (segment: ClockSegment, ratio: number, realMs: number): ClockSegment => {
  if (!(ratio > 0 && ratio <= 1440)) throw new RangeError(`ratio must be in (0, 1440], got ${ratio}`);
  return continueAt(segment, realMs, { ratio });
};

export const pause = (segment: ClockSegment, realMs: number): ClockSegment => continueAt(segment, realMs, { paused: true });
export const resume = (segment: ClockSegment, realMs: number): ClockSegment => continueAt(segment, realMs, { paused: false });

/** Real milliseconds that `gameMinutes` of game time last at the segment's ratio. */
export const realMsForGameMinutes = (segment: ClockSegment, gameMinutes: number): number => (gameMinutes / segment.ratio) * MS_PER_MIN;
