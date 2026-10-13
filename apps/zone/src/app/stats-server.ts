/**
 * Role: tiny loopback HTTP endpoint GET /stats with the tick and handoff statistics of every cell of the process (load tests, spike SP3).
 * Owner: backend
 */

import { createServer, type Server } from 'node:http';

export const startStatsServer = (port: number, stats: () => unknown): Server =>
  createServer((request, response) => {
    if (request.method !== 'GET' || request.url !== '/stats') {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(stats()));
  }).listen(port, '127.0.0.1');
