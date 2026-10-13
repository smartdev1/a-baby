/**
 * Role: the single conversion between UTM metres and the engine frame (x = east, y = up, z = north) around a floating origin.
 * Owner: backend
 */

import type { EnginePosition, UtmPosition } from './geo-types.ts';

/** Converts a UTM position (and altitude) to engine metres relative to the floating origin. */
export const toEngine = (position: UtmPosition, origin: UtmPosition, altitudeM = 0): EnginePosition => ({
  x: position.eastingM - origin.eastingM,
  y: altitudeM,
  z: position.northingM - origin.northingM,
});

/** Inverse of `toEngine` (altitude is dropped). */
export const fromEngine = (position: EnginePosition, origin: UtmPosition): UtmPosition => ({
  eastingM: origin.eastingM + position.x,
  northingM: origin.northingM + position.z,
});
