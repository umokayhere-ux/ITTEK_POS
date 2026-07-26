import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * Per-tenant feature access for a role. Absence of a row means the role uses
 * its built-in defaults. The owner role is never restricted.
 */
export interface RolePermissionDocument extends Document<Types.ObjectId> {
  tenantId: Types.ObjectId;
  role: string;
  features: string[];
  updatedAt: Date;
}

const rolePermissionSchema = new Schema<RolePermissionDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    role: { type: String, required: true },
    features: { type: [String], default: [] },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

rolePermissionSchema.index({ tenantId: 1, role: 1 }, { unique: true });

export const RolePermission = model<RolePermissionDocument>('RolePermission', rolePermissionSchema);
