/**
 * Role: public API of @skyline/bus. MessageBus interface with typed subjects; in-memory implementation (tests, all-in-one) and NATS implementation (distributed, J5).
 * Owner: backend
 */

export type { MessageBus, Unsubscribe } from './message-bus.ts';
export { InMemoryBus } from './in-memory-bus.ts';
export { NatsBus } from './nats-bus.ts';
export { subjects, type CellAction, type CellChat, type CellGhosts, type CellHandoff, type CellInput, type CellJoin, type CellSnapshot, type SessionClosed, type SessionOut, type GhostEntity } from './world-subjects.ts';
