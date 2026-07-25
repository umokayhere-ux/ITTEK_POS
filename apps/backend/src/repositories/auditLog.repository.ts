import { AuditLog, type AuditLogDocument } from '../models/AuditLog.js';

export const auditLogRepository = {
  /** Fire-and-forget audit write; failures are swallowed so they never break
   * the primary request flow. */
  async record(data: Partial<AuditLogDocument>): Promise<void> {
    try {
      await AuditLog.create(data);
    } catch {
      // Intentionally ignored: audit logging must not fail the request.
    }
  },
};
