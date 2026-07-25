import { Schema, model, type Document, type Types } from 'mongoose';
import { SYSTEM_ROLE_VALUES, type SystemRole } from '../constants/index.js';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export interface UserDocument extends Document<Types.ObjectId>, TenantScopedFields {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: SystemRole | string;
  branchIds: Types.ObjectId[];
  avatarUrl?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  resetTokenHash?: string | null;
  resetTokenExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    ...tenantScopedSchemaFields,
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: [...SYSTEM_ROLE_VALUES], default: 'cashier' },
    branchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    avatarUrl: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

// Email is unique per tenant, not globally: the same person may own accounts
// in multiple businesses.
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export const User = model<UserDocument>('User', userSchema);
