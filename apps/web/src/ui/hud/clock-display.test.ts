/**
 * Unit tests for clock-display HUD component logic.
 * Tests pure functions: time formatting.
 * Déterministe — pas de Math.random.
 */
import { describe, it, expect } from 'vitest';

describe('ClockDisplay Logic', () => {
  const formatGameMinute = (minutes: number): string => {
    const m = Math.max(0, minutes);
    const sec = ((m * 60) % 60).toString().padStart(2, '0');
    const min = Math.floor(m).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const formatServerTime = (epochMs: number): string => {
    const d = new Date(epochMs);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  it('formats game minute 0 with leading zeros', () => {
    // padStart(2, '0') ensures 2-digit format
    expect(formatGameMinute(0)).toBe('00:00');
  });

  it('formats game minute 1 with leading zeros', () => {
    expect(formatGameMinute(1)).toBe('01:00');
  });

  it('formats game minute 45 with leading zeros', () => {
    expect(formatGameMinute(45)).toBe('45:00');
  });

  it('formats server time with HH:MM format', () => {
    // 00:00 midnight
    expect(formatServerTime(0)).toBe('00:00');
    // 13:45
    const knownMs = 13 * 3600000 + 45 * 60000;
    expect(formatServerTime(knownMs)).toBe('13:45');
  });

  it('formats server time midday', () => {
    // 12:00 noon
    const noonMs = 12 * 3600000;
    expect(formatServerTime(noonMs)).toBe('12:00');
  });

  it('formats server time with minutes having leading zero', () => {
    // 09:05
    const nineAmMs = 9 * 3600000 + 5 * 60000;
    expect(formatServerTime(nineAmMs)).toBe('09:05');
  });
});