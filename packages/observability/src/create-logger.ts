/**
 * Role: creates the structured JSON logger (pino) shared by every Node process, one child per module.
 * Owner: backend
 */

import { pino, type Logger } from 'pino';

export type { Logger };

export interface LoggerOptions {
  /** Process or module name, added to every log line. */
  service: string;
  /** Minimum level; defaults to LOG_LEVEL or "info". */
  level?: string;
}

/** Never log personal data (ARCHITECTURE §28 rule 10): no e-mail, raw IP or guest secret. */
export const createLogger = ({ service, level }: LoggerOptions): Logger =>
  pino({
    level: level ?? process.env['LOG_LEVEL'] ?? 'info',
    base: { service },
    redact: { paths: ['*.token', '*.secret', '*.password', '*.ip', 'req.headers.authorization'], censor: '[redacted]' },
  });
