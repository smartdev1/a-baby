/**
 * Role: in-process MessageBus for tests and all-in-one mode: synchronous delivery to exact-subject subscribers, handler errors isolated.
 * Owner: backend
 */

import type { MessageBus, Unsubscribe } from './message-bus.ts';

export class InMemoryBus implements MessageBus {
  private readonly handlers = new Map<string, Set<(payload: unknown) => void>>();

  constructor(private readonly onHandlerError: (subject: string, error: unknown) => void = () => {}) {}

  publish<T>(subject: string, payload: T): void {
    for (const handler of this.handlers.get(subject) ?? []) {
      try {
        handler(payload);
      } catch (error) {
        this.onHandlerError(subject, error);
      }
    }
  }

  subscribe<T>(subject: string, handler: (payload: T) => void): Unsubscribe {
    const set = this.handlers.get(subject) ?? new Set();
    set.add(handler as (payload: unknown) => void);
    this.handlers.set(subject, set);
    return () => {
      set.delete(handler as (payload: unknown) => void);
      if (set.size === 0) this.handlers.delete(subject);
    };
  }
}
