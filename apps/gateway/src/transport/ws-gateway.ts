/**
 * Role: WebSocket transport of the gateway (`ws`): binary frames only, bounded size, one ClientSession per connection.
 * Owner: backend
 */

import type { Server as HttpServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { ClientSession, type ClientSessionDeps } from '../session/client-session.ts';

/** Largest client frame (hello with a 512-char ticket fits). */
const MAX_FRAME_BYTES = 1024;

export interface GatewayOptions extends ClientSessionDeps {
  /** Listen on this port, or attach to an existing HTTP server. */
  readonly port?: number;
  readonly server?: HttpServer;
}

export interface Gateway {
  readonly connections: () => number;
  /** Port actually listened on (useful with port 0). */
  readonly port: () => number;
  close(): Promise<void>;
}

export const startGateway = (options: GatewayOptions): Gateway => {
  const wss = new WebSocketServer({
    ...(options.server ? { server: options.server } : { port: options.port ?? 2567 }),
    maxPayload: MAX_FRAME_BYTES,
    path: '/ws',
  });
  wss.on('connection', (socket) => {
    const session = new ClientSession({ send: (frame) => socket.send(frame), close: () => socket.close() }, options);
    socket.on('message', (data, isBinary) => {
      if (!isBinary || !(data instanceof Buffer)) return socket.close(1003, 'binary frames only');
      session.receive(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    });
    socket.on('close', () => session.close());
    socket.on('error', () => session.close());
  });
  return {
    connections: () => wss.clients.size,
    port: () => {
      const address = wss.address();
      return typeof address === 'object' && address !== null ? address.port : 0;
    },
    close: () => new Promise<void>((resolve) => wss.close(() => resolve())),
  };
};
