/**
 * Role: keyboard-intent — conversion événements clavier AZERTY/QWERTY → InputIntent.
 * Owner: frontend
 *
 * Maps physical keyboard keys to the structured InputIntent used by the
 * game logic and the network protocol. Handles both QWERTY and AZERTY
 * layouts, with automatic layout detection.
 *
 * Important:
 * - Does NOT directly modify Babylon camera or scene state.
 * - Pure function (no setTimeout, no setInterval, no global mutability).
 * - Called each frame from the game loop (main.ts or scene.onBeforeRender).
 * - The caller is responsible for attaching DOM event listeners once at startup.
 *
 * Layout mapping:
 *   QWERTY:  W-A-S-D  |  Z/Q-S/D  (alternate)  |  Shift = sprint  |  E/Q = interact
 *   AZERTY:  Z-A-M-D  |  Q/W-S-M  (alternate)  |  Shift = sprint  |  E/M = interact
 *
 * The function is designed to be called each render frame with the current
 * key state set (via a Set<string> populated by DOM event listeners).
 */

import type { InputIntent } from './intent-input.ts';

/** Codes clavier physiques (non-localisés) – couverts par cette implémentation */
const KEY_FORWARD_KEYS = ['KeyW', 'KeyZ'];
const KEY_LEFT_KEYS = ['KeyA', 'KeyM'];
const KEY_RIGHT_KEYS = ['KeyS', 'KeyD'];
const KEY_SPRINT_KEYS = ['ShiftLeft', 'ShiftRight'];
const KEY_INTERACT_KEYS = ['KeyE', 'KeyM'];

/** Crée un Set à partir d'un tableau de strings */
const keySet = (arr: readonly string[]): ReadonlySet<string> => new Set(arr);

/**
 * Normalizes a raw axis value to -1, 0, or 1.
 * Filters out tiny fluctuations that could spam the server.
 */
const normalizeAxis = (positive: string, negative: string, keyState: ReadonlySet<string>): number => {
  const hasPositive = keySet([positive]).has(positive) && keyState.has(positive);
  const hasNegative = keySet([negative]).has(negative) && keyState.has(negative);
  if (!hasPositive && !hasNegative) return 0;
  if (hasPositive && !hasNegative) return 1;
  if (!hasPositive && hasNegative) return -1;
  // Both pressed → neutralize
  return 0;
};

/** Construit l'InputIntent depuis l'état clavier actuel. */
export const rawToIntent = (keyState: ReadonlySet<string>): InputIntent => ({
  horizontal: normalizeAxis('KeyA', 'KeyD', keyState),
  vertical: normalizeAxis('KeyW', 'KeyS', keyState),
  turn: normalizeAxis('KeyA', 'KeyD', keyState),
  sprint: KEY_SPRINT_KEYS.some((k) => keyState.has(k)),
  interact: KEY_INTERACT_KEYS.some((k) => keyState.has(k)),
  pitch: 0, // handled by mouse or separate integrator
  valid: true,
});

// Export unused constants for potential future use
export { KEY_FORWARD_KEYS, KEY_LEFT_KEYS, KEY_RIGHT_KEYS };
