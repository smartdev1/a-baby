/**
 * Role: transit network of the commune for the zone: lines of the pipeline (`08b-transit/transit-lines.ndjson`) with the service profile of their mode (`content/transport/services`) turned into deterministic timetables (`@skyline/sim-transport`) at the nominal clock ratio; missing files ⇒ empty network.
 * Owner: backend
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type TransportService, TransportServiceSchema } from '@skyline/content-schema';
import type { UtmPosition } from '@skyline/geo';
import { ClockConfigSchema, parseClockTime } from '@skyline/sim-clock';
import { buildLineSchedule, type LineSchedule, type ServiceProfile } from '@skyline/sim-transport';
import { z } from 'zod';

const LineSchema = z.object({
  id: z.string(),
  mode: z.enum(['gbaka', 'woro_woro', 'sotra_bus', 'bus']),
  stops: z.array(z.object({ id: z.string(), position: z.tuple([z.number(), z.number()]) })),
  path: z.array(z.tuple([z.number(), z.number()])),
});

export interface TransitLine {
  readonly id: string;
  readonly schedule: LineSchedule;
  readonly stops: readonly { readonly id: string; readonly utm: UtmPosition }[];
  readonly seats: number;
  readonly fareDjai: number;
}

export type TransitNetwork = ReadonlyMap<string, TransitLine>;

const profileOf = (service: TransportService): ServiceProfile => ({
  cruiseKmh: service.cruiseKmh,
  dwellGameMin: service.dwellGameMin,
  periods: service.periods.map((p) => ({ fromMin: parseClockTime(p.from), toMin: parseClockTime(p.to), headwayMin: p.headwayGameMin })),
});

const loadServices = async (contentDir: string): Promise<Map<string, TransportService>> => {
  const dir = join(contentDir, 'transport', 'services');
  const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.service.json'));
  const services = await Promise.all(files.map(async (f) => TransportServiceSchema.parse(JSON.parse(await readFile(join(dir, f), 'utf8')))));
  return new Map(services.map((s) => [s.id, s]));
};

export const loadTransitNetwork = async (worldDir: string, contentDir: string): Promise<TransitNetwork> => {
  const [raw, services, clockRaw] = await Promise.all([
    readFile(join(worldDir, '08b-transit', 'transit-lines.ndjson'), 'utf8').catch(() => ''),
    loadServices(contentDir),
    readFile(join(contentDir, 'game-config', 'clock.json'), 'utf8'),
  ]);
  const nominalRatio = ClockConfigSchema.parse(JSON.parse(clockRaw)).ratio;
  const network = new Map<string, TransitLine>();
  for (const text of raw.split('\n')) {
    if (text.trim() === '') continue;
    const line = LineSchema.parse(JSON.parse(text));
    const service = services.get(line.mode);
    if (!service || line.path.length < 2 || line.stops.length < 2) continue;
    network.set(line.id, {
      id: line.id,
      schedule: buildLineSchedule(line, profileOf(service), nominalRatio),
      stops: line.stops.map((s) => ({ id: s.id, utm: { eastingM: s.position[0], northingM: s.position[1] } })),
      seats: service.seats,
      fareDjai: service.fareDjai,
    });
  }
  return network;
};
