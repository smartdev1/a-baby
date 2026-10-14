/**
 * Role: loads everything transport needs at start-up: transit lines with their timetables, the city map (roads, places) and the taxi fare (`content/transport/fares/taxi.fare.json`; missing ⇒ no taxis).
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type TaxiFare, TaxiFareSchema } from '@skyline/content-schema';
import { type CityMap, loadCityMap } from './city-map.ts';
import { loadTransitNetwork, type TransitNetwork } from './transit-network.ts';

export interface TransportSetup {
  readonly transit: TransitNetwork;
  readonly city: CityMap;
  readonly taxiFare?: TaxiFare;
}

export const loadTransport = async (worldDir: string, contentDir: string): Promise<TransportSetup> => {
  const [transit, city, fareRaw] = await Promise.all([
    loadTransitNetwork(worldDir, contentDir),
    loadCityMap(worldDir),
    readFile(join(contentDir, 'transport', 'fares', 'taxi.fare.json'), 'utf8').catch(() => null),
  ]);
  return fareRaw === null ? { transit, city } : { transit, city, taxiFare: TaxiFareSchema.parse(JSON.parse(fareRaw)) };
};
