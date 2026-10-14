/**
 * Role: tiny loopback HTTP endpoint of a zone process: GET /stats (tick and handoff statistics of every cell, load tests) and GET /economy (money supply, sources, sinks of the process ledger).
 * Owner: backend
 */

import { createServer, type Server } from 'node:http';

export const startStatsServer = (port: number, routes: Readonly<Record<string, () => unknown>>): Server =>
  createServer((request, response) => {
    const route = request.method === 'GET' && request.url ? routes[request.url] : undefined;
    if (!route) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(route()));
  }).listen(port, '127.0.0.1');
