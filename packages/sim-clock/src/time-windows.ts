/**
 * Role: daily opening windows in game minutes (shops, jobs, maquis), including windows that cross midnight.
 * Owner: backend
 */

export interface TimeWindow {
  /** Minutes since midnight, inclusive. */
  readonly openMin: number;
  /** Minutes since midnight, exclusive; smaller than `openMin` for overnight windows (18:00 → 04:00). */
  readonly closeMin: number;
}

export const isOpenAt = (window: TimeWindow, minuteOfDay: number): boolean =>
  window.openMin <= window.closeMin
    ? minuteOfDay >= window.openMin && minuteOfDay < window.closeMin
    : minuteOfDay >= window.openMin || minuteOfDay < window.closeMin;

/** Game minutes from `minuteOfDay` until the next opening (0 when open). */
export const minutesUntilOpen = (window: TimeWindow, minuteOfDay: number, minutesPerDay = 1440): number =>
  isOpenAt(window, minuteOfDay) ? 0 : (window.openMin - minuteOfDay + minutesPerDay) % minutesPerDay;

/** "HH:MM" → minutes since midnight. */
export const parseClockTime = (text: string): number => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text);
  if (!match) throw new SyntaxError(`invalid time "${text}" (HH:MM expected)`);
  return Number(match[1]) * 60 + Number(match[2]);
};
