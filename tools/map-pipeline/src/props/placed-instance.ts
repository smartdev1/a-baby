/**
 * Role: an instance placed by the pipeline in UTM metres (before the tile cut): module name, position, yaw, scale, variant.
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
}
