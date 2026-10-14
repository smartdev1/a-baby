/**
 * Role: composes the all-in-one world: services (HTTP), one zone cell around the spawn point with its real collision tiles and daily life (content, places, journaled economy), and the WebSocket gateway, linked by an in-memory bus.
 * Owner: backend
 */

import { join } from 'node:path';
import { InMemoryBus } from '@skyline/bus';
import { startGateway, type Gateway } from '@skyline/gateway';
import { cellKeyOf, toUtm30n } from '@skyline/geo';
import type { Logger } from '@skyline/observability';
import { buildServices, type Services, type ServicesConfig } from '@skyline/services';
import { FileCharacterStore, InMemoryChatReports, JournaledEconomy, loadBlockedWords, loadCellCollision, loadTransport, setUpDailyLife, ZoneCell } from '@skyline/zone';
import type { AllInOneConfig } from './all-in-one-config.ts';

export interface World {
  readonly services: Services;
  readonly gateway: Gateway;
  readonly cell: ZoneCell;
  readonly cellKey: string;
  readonly tilesLoaded: number;
  close(): Promise<void>;
}

export const composeWorld = async (
  config: AllInOneConfig,
  servicesConfig: ServicesConfig,
  logger: Logger,
): Promise<World> => {
  const bus = new InMemoryBus((subject, error) => logger.error({ subject, err: error }, 'bus handler failed'));
  const spawnUtm = toUtm30n(config.spawn);
  const cellKey = cellKeyOf(spawnUtm);
  const { world, frameOrigin, tilesLoaded } = await loadCellCollision(config.worldDir, cellKey);
  if (tilesLoaded === 0)
    logger.warn({ worldDir: config.worldDir }, 'no world tiles found: flat empty cell (run pnpm map:build first)');

  const economy = await JournaledEconomy.open(join(servicesConfig.runtimeDir, 'ledger.ndjson'), (line) => logger.warn({ line }, 'ledger journal line skipped'));
  let cell: ZoneCell | null = null;
  const services = await buildServices({
    config: servicesConfig,
    logger: logger.child({ module: 'services' }),
    extraRoutes: (server) => {
      server.get('/api/v1/dev/zone-stats', (_req, reply) => reply.send({ cellKey, tilesLoaded, ...cell?.tickStats() }));
      server.get('/api/v1/dev/economy', (_req, reply) => reply.send(economy.summary()));
    },
  });
  const daily = await setUpDailyLife({
    contentDir: servicesConfig.contentDir,
    worldDir: config.worldDir,
    cellKey,
    clock: () => services.worldClock.current(),
    economy,
    starterDjai: config.starterDjai,
  });
  const transport = await loadTransport(config.worldDir, servicesConfig.contentDir);
  logger.info({ cellKey, places: daily.places, transitLines: transport.transit.size, taxis: transport.taxiFare !== undefined }, 'daily life ready');
  cell = new ZoneCell({
    cellKey,
    bus,
    world,
    frameOrigin,
    spawn: { x: spawnUtm.eastingM - frameOrigin.eastingM, z: spawnUtm.northingM - frameOrigin.northingM },
    clock: () => services.worldClock.current(),
    logger: logger.child({ module: 'zone', cellKey }),
    daily: daily.deps,
    transport,
    characters: new FileCharacterStore(join(servicesConfig.runtimeDir, 'characters')),
    chat: { blockedWords: await loadBlockedWords(servicesConfig.contentDir), reports: new InMemoryChatReports(logger.child({ module: 'chat' })) },
  });
  cell.start();
  const gateway = startGateway({
    port: config.gatewayPort,
    bus,
    tickets: services.tickets,
    spawnCell: cellKey,
    logger: logger.child({ module: 'gateway' }),
  });
  const activeCell = cell;

  return {
    services,
    gateway,
    cell: activeCell,
    cellKey,
    tilesLoaded,
    close: async () => {
      await activeCell.flush();
      activeCell.stop();
      daily.stop();
      await gateway.close();
      await services.server.close();
    },
  };
};
