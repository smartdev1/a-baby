/**
 * Role: game calendar: turns game minutes into year, month, day, weekday, hour and minute (weekday and month names are i18n keys).
 * Owner: backend
 */

export interface GameCalendar {
  readonly hoursPerDay: number;
  /** i18n keys, e.g. `calendar.weekday.monday`. */
  readonly weekdays: readonly string[];
  /** Days per month; the list length is the number of months. */
  readonly monthDays: readonly number[];
  /** Weekday index of game day 0. */
  readonly firstWeekday: number;
  readonly startYear: number;
}

export interface GameDate {
  readonly year: number;
  /** 1-based. */
  readonly month: number;
  /** 1-based. */
  readonly day: number;
  readonly weekdayKey: string;
  readonly hour: number;
  readonly minute: number;
  /** Minutes since midnight of the game day. */
  readonly minuteOfDay: number;
  /** Days since the game epoch. */
  readonly dayIndex: number;
}

export const gameDateOf = (gameMinutes: number, calendar: GameCalendar): GameDate => {
  const minutesPerDay = calendar.hoursPerDay * 60;
  const total = Math.floor(gameMinutes);
  const dayIndex = Math.floor(total / minutesPerDay);
  const minuteOfDay = total - dayIndex * minutesPerDay;
  const daysPerYear = calendar.monthDays.reduce((a, b) => a + b, 0);
  const yearIndex = Math.floor(dayIndex / daysPerYear);
  let dayOfYear = dayIndex - yearIndex * daysPerYear;
  let month = 0;
  while (dayOfYear >= (calendar.monthDays[month] ?? Infinity)) dayOfYear -= calendar.monthDays[month++] ?? 0;
  const weekdays = calendar.weekdays.length;
  return {
    year: calendar.startYear + yearIndex,
    month: month + 1,
    day: dayOfYear + 1,
    weekdayKey: calendar.weekdays[(((dayIndex + calendar.firstWeekday) % weekdays) + weekdays) % weekdays] ?? '',
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60,
    minuteOfDay,
    dayIndex,
  };
};
