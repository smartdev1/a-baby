/**
 * Role: reads and validates the services process configuration from environment variables.
 * Owner: backend
 */

import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** Repository folders resolved from this file, so the process can start from any working directory. */
const repoPath = (relative: string): string => fileURLToPath(new URL(`../../../../${relative}`, import.meta.url));

const ServicesConfigSchema = z.object({
  SERVICES_HOST: z.string().default('127.0.0.1'),
  SERVICES_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  SERVICES_CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SKYLINE_CONTENT_DIR: z.string().default(repoPath('content')),
  SKYLINE_RUNTIME_DIR: z.string().default(repoPath('data/runtime')),
  /** Session tickets per minute and per IP (raise only for local load tests). */
  SESSION_TICKETS_PER_MIN: z.coerce.number().int().min(1).max(100_000).default(10),
});

export interface ServicesConfig {
  host: string;
  port: number;
  corsOrigin: string;
  /** Game content (content/). */
  contentDir: string;
  /** Mutable local state until the database exists (git-ignored data/runtime/). */
  runtimeDir: string;
  ticketsPerMin: number;
}

export const readServicesConfig = (env: Record<string, string | undefined>): ServicesConfig => {
  const parsed = ServicesConfigSchema.parse(env);
  return {
    host: parsed.SERVICES_HOST,
    port: parsed.SERVICES_PORT,
    corsOrigin: parsed.SERVICES_CORS_ORIGIN,
    contentDir: parsed.SKYLINE_CONTENT_DIR,
    runtimeDir: parsed.SKYLINE_RUNTIME_DIR,
    ticketsPerMin: parsed.SESSION_TICKETS_PER_MIN,
  };
};
