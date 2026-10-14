/**
 * Role: composition root of the standalone zone process: one ZoneCell per owned cell with its collision tiles, linked to the gateways and the other zones through NATS.
 * Owner: backend
 */

import { NatsBus } from '@skyline/bus';
import { cellBounds, cellKeyOf, CELL_SIZE_M } from '@skyline/geo';
import { createLogger } from '@skyline/observability';
import { setUpDailyLife } from '../actions/daily-life-setup.ts';
import { InMemoryEconomy } from '../adapters/in-memory-economy.ts';
import { ZoneCell } from '../cell/zone-cell.ts';
import { loadCellCollision } from '../world-data/cell-collision-loader.ts';
import { httpClockSource } from './http-clock-source.ts';
import { startStatsServer } from './stats-server.ts';
import { readZoneConfig } from './zone-config.ts';

const config = readZoneConfig(process.env);
const logger = createLogger({ service: 'zone' });
const bus = await NatsBus.connect(config.natsUrl, (subject, error) => logger.error({ subject, err: error }, 'bus handler failed'));
const clock = httpClockSource(config.servicesUrl);
// One in-memory ledger per process until the PostgreSQL economy (J6): balances are not shared between zone processes.
const economy = new InMemoryEconomy();

const cells = await Promise.all(
  config.cells.map(async (cellKey) => {
    const { world, frameOrigin, tilesLoaded } = await loadCellCollision(config.worldDir, cellKey);
    if (tilesLoaded === 0) logger.warn({ cellKey }, 'no world tiles found: flat empty cell');
    const spawnHere = config.spawn && cellKeyOf(config.spawn) === cellKey ? config.spawn : null;
    const spawn = spawnHere ? { x: spawnHere.eastingM - frameOrigin.eastingM, z: spawnHere.northingM - frameOrigin.northingM } : { x: CELL_SIZE_M / 2, z: CELL_SIZE_M / 2 };
    const daily = await setUpDailyLife({ contentDir: config.contentDir, worldDir: config.worldDir, cellKey, clock, economy, starterDjai: config.starterDjai });
    const cell = new ZoneCell({ cellKey, bus, world, frameOrigin, spawn, clock, logger: logger.child({ cellKey }), clusterCells: config.clusterCells, daily: daily.deps });
    cell.start();
    logger.info({ cellKey, tilesLoaded, bounds: cellBounds(cellKey) }, 'cell started');
    return { cellKey, cell };
  }),
);
const stats = config.statsPort > 0 ? startStatsServer(config.statsPort, () => cells.map(({ cellKey, cell }) => ({ cellKey, ...cell.tickStats() }))) : null;

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down');
  cells.forEach(({ cell }) => cell.stop());
  stats?.close();
  await bus.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
