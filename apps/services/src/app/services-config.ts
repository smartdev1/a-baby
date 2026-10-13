/**
 * Role: reads and validates the services process configuration from environment variables.
 * Owner: backend
 */

import { z } from 'zod';

const ServicesConfigSchema = z.object({
  SERVICES_HOST: z.string().default('127.0.0.1'),
  SERVICES_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  SERVICES_CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export interface ServicesConfig {
  host: string;
  port: number;
  corsOrigin: string;
}

export const readServicesConfig = (env: Record<string, string | undefined>): ServicesConfig => {
  const parsed = ServicesConfigSchema.parse(env);
  return { host: parsed.SERVICES_HOST, port: parsed.SERVICES_PORT, corsOrigin: parsed.SERVICES_CORS_ORIGIN };
};
