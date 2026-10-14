/**
 * Role: in-memory moderation queue for chat reports until the moderation service (J7-04); keeps the last 1 000 reports, logs ids and reason only (never the text).
 * Owner: backend
 */

import type { Logger } from '@skyline/observability';
import type { ChatReport, ChatReportPort } from '../ports/chat-report-port.ts';

const MAX_REPORTS = 1000;

export class InMemoryChatReports implements ChatReportPort {
  readonly reports: ChatReport[] = [];

  constructor(private readonly logger?: Logger) {}

  report(report: ChatReport): Promise<void> {
    this.reports.push(report);
    if (this.reports.length > MAX_REPORTS) this.reports.shift();
    this.logger?.info(
      { cellKey: report.cellKey, reporter: report.reporterEntityId, reported: report.reportedEntityId, reason: report.reason, excerptMessages: report.excerpt.length },
      'chat report queued',
    );
    return Promise.resolve();
  }
}
