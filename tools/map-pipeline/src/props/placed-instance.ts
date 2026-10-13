/**
 * Role: an instance placed by the pipeline in UTM metres (before the tile cut): module name, position, yaw, scale, variant, and for facades an absolute height and a width/height stretch.
 * Owner: backend
 */

import type { InstanceModule } from '@skyline/tile-format';

export interface PlacedInstance {
  readonly module: InstanceModule;
  readonly e: number;
  readonly n: number;
  readonly yawRad: number;
  readonly scale: number;
  readonly variant: number;
  /** Absolute height (facades, roof accessories); absent = standing on the terrain. */
  readonly yM?: number;
  readonly stretchX?: number;
  readonly stretchY?: number;
}
