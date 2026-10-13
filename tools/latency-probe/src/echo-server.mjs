/**
 * Role: minimal latency probe server for one candidate region: serves the probe page and echoes WebSocket messages unchanged (no storage, no personal data).
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 8080);
/** JSON list of probe targets shown on the page, e.g. [{"id":"eu-west","label":"Paris","url":"wss://eu.example.org/echo"}]. */
const REGIONS = process.env.PROBE_REGIONS ?? '[]';
const MAX_MESSAGE_BYTES = 256;

const STATIC = {
  '/': ['../page/index.html', 'text/html; charset=utf-8'],
  '/probe.mjs': ['../page/probe.mjs', 'text/javascript'],
  '/rtt-stats.mjs': ['./rtt-stats.mjs', 'text/javascript'],
};

const server = createServer(async (req, res) => {
  const path = (req.url ?? '/').split('?')[0];
  if (path === '/regions.json') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(REGIONS);
    return;
  }
  const entry = STATIC[path];
  if (!entry) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': entry[1], 'cache-control': 'no-store' });
  res.end(await readFile(new URL(entry[0], import.meta.url)));
});

const wss = new WebSocketServer({ server, path: '/echo', maxPayload: MAX_MESSAGE_BYTES });
wss.on('connection', (socket) => {
  socket.on('message', (data, isBinary) => socket.send(data, { binary: isBinary }));
});

server.listen(PORT, () => console.log(`latency probe listening on :${PORT}`));
