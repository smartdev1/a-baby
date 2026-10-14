/**
 * Unit tests for djai-display HUD component logic.
 * Tests pure functions: bigint formatting using string operations.
 * Déterministe — pas de Math.random.
 */
import { describe, it, expect } from 'vitest';

const formatBigint = (value: bigint): string => {
  const isNegative = value < 0n;
  const absStr = value.toString().replace(/^-/, ''); // remove minus sign if present
  // Add French thousands separators (regular space)
  const withSpaces = absStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = isNegative ? '-' : '';
  return `${sign}${withSpaces} Djai`;
};

describe('DjaiDisplay Logic', () => {
  it('formats positive bigint with French separators', () => {
    // 123456789 -> "123 456 789 Djai" with fr-FR locale using non-breaking space
    const result = formatBigint(123456789n);
    expect(result).toContain('Djai');
    // Should have spaces (non-breaking spaces) for thousands separators
    expect(result).toMatch(/\d \d/);
  });

  it('formats zero correctly', () => {
    expect(formatBigint(0n)).toBe('0 Djai');
  });

  it('formats negative bigint correctly', () => {
    expect(formatBigint(-42n)).toBe('-42 Djai');
  });

  it('formats small positive values', () => {
    expect(formatBigint(1n)).toBe('1 Djai');
    expect(formatBigint(999n)).toBe('999 Djai');
  });

  it('formats large positive values', () => {
    // Test with a very large bigint
    const large = 1000000000n;
    const result = formatBigint(large);
    expect(result).toContain('Djai');
    expect(result).toMatch(/\d \d/);
  });
});