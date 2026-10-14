/**
 * Role: composition root of the standalone zone process: one ZoneCell per owned cell with its collision tiles, linked to the gateways and the other zones through NATS.
 * Owner: backend
 */

import { join } from 'node:path';
import { NatsBus } from '@skyline/bus';
import { cellBounds, cellKeyOf, CELL_SIZE_M } from '@skyline/geo';
import { createLogger } from '@skyline/observability';
import { setUpDailyLife } from '../actions/daily-life-setup.ts';
import { JournaledEconomy } from '../adapters/journaled-economy.ts';
import { InMemoryChatReports } from '../adapters/in-memory-chat-reports.ts';
import { FileCharacterStore } from '../adapters/file-character-store.ts';
import { ZoneCell } from '../cell/zone-cell.ts';
import { loadBlockedWords } from '../chat/chat-setup.ts';
import { loadTransport } from '../transport/transport-setup.ts';
import { loadCellCollision } from '../world-data/cell-collision-loader.ts';
import { httpClockSource } from './http-clock-source.ts';
import { startStatsServer } from './stats-server.ts';
import { readZoneConfig } from './zone-config.ts';

const config = readZoneConfig(process.env);
const logger = createLogger({ service: 'zone' });
const bus = await NatsBus.connect(config.natsUrl, (subject, error) => logger.error({ subject, err: error }, 'bus handler failed'));
const clock = httpClockSource(config.servicesUrl);
// One journaled ledger per process until the PostgreSQL economy (J6-05): balances are not shared between zone processes.
const economy = await JournaledEconomy.open(join(config.runtimeDir, `ledger.${config.cells.join('-')}.ndjson`), (line) => logger.warn({ line }, 'ledger journal line skipped'));
// Shared by every cell of the process; zones on one machine share the folder until the characters service (J6-04).
const characters = new FileCharacterStore(join(config.runtimeDir, 'characters'));
const transport = await loadTransport(config.worldDir, config.contentDir);
logger.info({ lines: transport.transit.size, places: transport.city.places.size, taxis: transport.taxiFare !== undefined }, 'transport ready');
const chat = { blockedWords: await loadBlockedWords(config.contentDir), reports: new InMemoryChatReports(logger.child({ module: 'chat' })) };

const cells = await Promise.all(
  config.cells.map(async (cellKey) => {
    const { world, frameOrigin, tilesLoaded } = await loadCellCollision(config.worldDir, cellKey);
    if (tilesLoaded === 0) logger.warn({ cellKey }, 'no world tiles found: flat empty cell');
    const spawnHere = config.spawn && cellKeyOf(config.spawn) === cellKey ? config.spawn : null;
    const spawn = spawnHere ? { x: spawnHere.eastingM - frameOrigin.eastingM, z: spawnHere.northingM - frameOrigin.northingM } : { x: CELL_SIZE_M / 2, z: CELL_SIZE_M / 2 };
    const daily = await setUpDailyLife({ contentDir: config.contentDir, worldDir: config.worldDir, cellKey, clock, economy, starterDjai: config.starterDjai });
    const cell = new ZoneCell({ cellKey, bus, world, frameOrigin, spawn, clock, logger: logger.child({ cellKey }), clusterCells: config.clusterCells, daily: daily.deps, chat, transport, characters });
    cell.start();
    logger.info({ cellKey, tilesLoaded, bounds: cellBounds(cellKey) }, 'cell started');
    return { cellKey, cell };
  }),
);
const stats = config.statsPort > 0 ? startStatsServer(config.statsPort, { '/stats': () => cells.map(({ cellKey, cell }) => ({ cellKey, ...cell.tickStats() })), '/economy': () => economy.summary() }) : null;

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down');
  cells.forEach(({ cell }) => cell.stop());
  stats?.close();
  await bus.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
