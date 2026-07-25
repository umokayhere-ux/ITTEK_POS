import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * Append-only record of security- and data-sensitive actions. Never soft-
 * deleted; retained for compliance and forensic review.
 */
export interface AuditLogDocument extends Document<Types.ObjectId> {
  tenantId: Types.ObjectId;
  actorId?: Types.ObjectId;
  action: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    entity: { type: String },
    entityId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ tenantId: 1, createdAt: -1 });

export const AuditLog = model<AuditLogDocument>('AuditLog', auditLogSchema);
