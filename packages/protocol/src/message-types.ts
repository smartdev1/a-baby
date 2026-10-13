/**
 * Role: one-byte type identifiers that start every frame, client → server (1..99) and server → client (101..199).
 * Owner: backend
 */

export const CLIENT_MESSAGE = { hello: 1, input: 2, ping: 3 } as const;
export const SERVER_MESSAGE = {
  welcome: 101,
  inputAck: 102,
  snapshot: 103,
  worldClock: 104,
  pong: 105,
  error: 106,
} as const;

export type ClientMessageType = keyof typeof CLIENT_MESSAGE;
export type ServerMessageType = keyof typeof SERVER_MESSAGE;
