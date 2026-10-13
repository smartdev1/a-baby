/**
 * Role: configuration of the standalone gateway process from environment variables (port, NATS, services URL, spawn cell).
 * Owner: backend
 */

import { z } from 'zod';

const Schema = z.object({
  GATEWAY_PORT: z.coerce.number().int().min(0).max(65_535).default(2567),
  NATS_URL: z.string().default('nats://127.0.0.1:4222'),
  /** Services process exposing the internal ticket route (SERVICES_INTERNAL_ROUTES=true). */
  SERVICES_URL: z.url().default('http://127.0.0.1:8080'),
  /** Cell where new players appear; a zone process must own it. */
  SPAWN_CELL: z.string().regex(/^C_\d+_\d+$/).default('C_81_49'),
});

export interface GatewayConfig {
  readonly port: number;
  readonly natsUrl: string;
  readonly servicesUrl: string;
  readonly spawnCell: string;
}

export const readGatewayConfig = (env: Record<string, string | undefined>): GatewayConfig => {
  const p = Schema.parse(env);
  return { port: p.GATEWAY_PORT, natsUrl: p.NATS_URL, servicesUrl: p.SERVICES_URL.replace(/\/$/, ''), spawnCell: p.SPAWN_CELL };
};
