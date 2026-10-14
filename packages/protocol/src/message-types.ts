/**
 * Role: one-byte type identifiers that start every frame, client → server (1..99) and server → client (101..199).
 * Owner: backend
 */

export const CLIENT_MESSAGE = { hello: 1, input: 2, ping: 3, actionRequest: 4, actionCancel: 5, chatSend: 6, chatBlock: 7, chatReport: 8, rideRequest: 9 } as const;
export const SERVER_MESSAGE = {
  welcome: 101,
  inputAck: 102,
  snapshot: 103,
  worldClock: 104,
  pong: 105,
  error: 106,
  actionUpdate: 107,
  needsUpdate: 108,
  walletUpdate: 109,
  chatMessage: 110,
  chatRejected: 111,
  rideUpdate: 112,
} as const;

export type ClientMessageType = keyof typeof CLIENT_MESSAGE;
export type ServerMessageType = keyof typeof SERVER_MESSAGE;
