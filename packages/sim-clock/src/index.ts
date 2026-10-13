/**
 * Role: public API of @skyline/sim-clock. Internal world clock: clock segments (ratio, pause), game calendar, opening-hour windows, client sync (ADR 0011).
 * Owner: backend
 */

export { changeRatio, gameMinutesAt, pause, realMsForGameMinutes, resume, type ClockSegment } from './clock-segment.ts';
export { gameDateOf, type GameCalendar, type GameDate } from './game-calendar.ts';
export { isOpenAt, minutesUntilOpen, parseClockTime, type TimeWindow } from './time-windows.ts';
export { estimateServerOffsetMs, type SyncSample } from './clock-sync.ts';
export { CalendarConfigSchema, ClockConfigSchema, type CalendarConfig, type ClockConfig } from './clock-config-schema.ts';
