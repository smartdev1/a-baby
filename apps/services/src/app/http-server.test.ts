/**
 * Role: tests the health and readiness endpoints of the services HTTP server.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { createLogger } from '@skyline/observability';
import { buildHttpServer } from './http-server.ts';

describe('buildHttpServer', () => {
  it('should answer ok when /health is requested', async () => {
    const server = await buildHttpServer({
      logger: createLogger({ service: 'test', level: 'silent' }),
      corsOrigin: '*',
    });
    const response = await server.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    await server.close();
  });
});
