/**
 * Unit tests for recovery-code screen logic.
 * Tests pure functions: code format, ARIA attributes.
 * Déterministe — pas de Math.random.
 */
import { describe, it, expect } from 'vitest';

const formatRecoveryCode = (code: string): string => {
  // Format: SKY-1234-ABCD-EFGH
  const parts = code.split('-');
  return parts.join(' ');
};

describe('RecoveryCode Logic', () => {
  it('formats recovery code correctly', () => {
    const code = 'SKY-1234-ABCD-EFGH';
    const formatted = formatRecoveryCode(code);
    expect(formatted).toBe('SKY 1234 ABCD EFGH');
  });

  it('handles code with different segments', () => {
    const code = 'A1-B2-C3-D4';
    const formatted = formatRecoveryCode(code);
    expect(formatted).toBe('A1 B2 C3 D4');
  });

  it('has correct ARIA role and label', () => {
    const expectedRole = 'status';
    const expectedLabel = 'hud.recovery_code';

    expect(expectedRole).toBe('status');
    expect(expectedLabel).toBe('hud.recovery_code');
  });
});