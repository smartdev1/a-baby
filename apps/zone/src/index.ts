/**
 * Role: public API of the zone app, used by the all-in-one composition: cell runtime and cell collision loading.
 * Owner: backend
 */

export { ZoneCell, TICK_RATE_HZ, type ZoneCellOptions } from './cell/zone-cell.ts';
export type { TickStatsSnapshot } from './cell/tick-stats.ts';
export { loadCellCollision, type CellWorld } from './world-data/cell-collision-loader.ts';
