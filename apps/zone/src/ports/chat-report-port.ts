/**
 * Role: port to the moderation queue: a chat report with its excerpt (the reported player's messages heard by the reporter in the last minutes), the only case where chat text is kept (ARCHITECTURE §20.2).
 * Owner: backend
 */

import type { ChatReportReason } from '@skyline/protocol';

export interface ChatReport {
  readonly cellKey: string;
  readonly reporterEntityId: number;
  readonly reportedEntityId: number;
  readonly reason: ChatReportReason;
  readonly atMs: number;
  readonly excerpt: readonly { readonly atMs: number; readonly text: string }[];
}

export interface ChatReportPort {
  report(report: ChatReport): Promise<void>;
}
