import { Schema, type Types } from 'mongoose';

/**
 * Fields every tenant-scoped document must carry. Applied via a shared schema
 * fragment so tenant isolation and soft-delete/audit metadata stay uniform
 * across all collections.
 */
export interface TenantScopedFields {
  tenantId: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt: Date | null;
  isDeleted: boolean;
}

export const tenantScopedSchemaFields = {
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  deletedAt: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false, index: true },
} as const;
