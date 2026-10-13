/**
 * Role: NATS implementation of the MessageBus (distributed mode): JSON payloads, one async subscription loop per handler, handler errors isolated.
 * Owner: backend
 */

import { connect, JSONCodec, type NatsConnection } from 'nats';
import type { MessageBus, Unsubscribe } from './message-bus.ts';

const codec = JSONCodec();

export class NatsBus implements MessageBus {
  private constructor(
    private readonly connection: NatsConnection,
    private readonly onHandlerError: (subject: string, error: unknown) => void,
  ) {}

  static async connect(url: string, onHandlerError: (subject: string, error: unknown) => void = () => {}): Promise<NatsBus> {
    return new NatsBus(await connect({ servers: url, name: 'skyline' }), onHandlerError);
  }

  publish<T>(subject: string, payload: T): void {
    this.connection.publish(subject, codec.encode(payload));
  }

  subscribe<T>(subject: string, handler: (payload: T) => void): Unsubscribe {
    const subscription = this.connection.subscribe(subject);
    void (async () => {
      for await (const message of subscription) {
        try {
          handler(codec.decode(message.data) as T);
        } catch (error) {
          this.onHandlerError(subject, error);
        }
      }
    })();
    return () => subscription.unsubscribe();
  }

  /** Waits until every published message reached the server. */
  async flush(): Promise<void> {
    await this.connection.flush();
  }

  async close(): Promise<void> {
    await this.connection.drain();
  }
}
