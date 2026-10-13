/**
 * Role: MessageBus port used by gateways, zones and services: publish to a subject, subscribe with a handler (in-memory now, NATS in J5).
 * Owner: backend
 */

export type Unsubscribe = () => void;

export interface MessageBus {
  publish<T>(subject: string, payload: T): void;
  subscribe<T>(subject: string, handler: (payload: T) => void): Unsubscribe;
}
