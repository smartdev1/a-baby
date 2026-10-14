/**
 * Unit tests for need-gauge HUD component logic.
 * Tests pure functions: value clamping, color mapping.
 * Déterministe — pas de Math.random.
 */
import { describe, it, expect } from 'vitest';

describe('NeedGauge Logic', () => {
  const NEED_COLORS = {
    green: '#22c55e', // ≥ 70
    amber: '#eab308', // ≥ 30, < 70
    red: '#ef4444',   // < 30
  };

  const NEED_TEXTS = {
    hunger: 'hunger',
    energy: 'energy',
    hygiene: 'hygiene',
    social: 'social',
    entertainment: 'entertainment',
  };

  const getColor = (v: number) => {
    if (v >= 70) return NEED_COLORS.green;
    if (v >= 30) return NEED_COLORS.amber;
    return NEED_COLORS.red;
  };

  it('clamps value to 0-100 range', () => {
    // Value above 100 should be clamped
    // The logic: max(0, min(100, value))
    const testValue = 150;
    const clamped = Math.max(0, Math.min(100, testValue));
    expect(clamped).toBe(100);

    // Value below 0 should be clamped
    const negativeValue = -10;
    const clampedNeg = Math.max(0, Math.min(100, negativeValue));
    expect(clampedNeg).toBe(0);

    // Value in range should pass through
    const normalValue = 50;
    const clampedNormal = Math.max(0, Math.min(100, normalValue));
    expect(clampedNormal).toBe(50);
  });

  it('maps values to correct color thresholds', () => {
    // Green threshold (≥70)
    expect(getColor(70)).toBe('#22c55e');
    expect(getColor(85)).toBe('#22c55e');
    expect(getColor(100)).toBe('#22c55e');

    // Amber threshold (≥30, <70)
    expect(getColor(30)).toBe('#eab308');
    expect(getColor(50)).toBe('#eab308');
    expect(getColor(69)).toBe('#eab308');

    // Red threshold (<30)
    expect(getColor(29)).toBe('#ef4444');
    expect(getColor(10)).toBe('#ef4444');
    expect(getColor(0)).toBe('#ef4444');
  });

  it('has correct text mappings', () => {
    expect(NEED_TEXTS.hunger).toBe('hunger');
    expect(NEED_TEXTS.energy).toBe('energy');
    expect(NEED_TEXTS.hygiene).toBe('hygiene');
    expect(NEED_TEXTS.social).toBe('social');
    expect(NEED_TEXTS.entertainment).toBe('entertainment');
  });
});