/**
 * Role: tile-loader — Main class that orchestrates scheduler, cache, pool of workers.
 * Owner: frontend
 *
 * Coordinates tile loading: uses scheduler to determine needed tiles, cache to avoid
 * redundant loads, pool of workers to fetch data in background, and integrates tiles
 * via a WorldRenderer interface while respecting frame budget.
 */

import { TileLoader } from './tile-loader-core';

export { TileLoader };