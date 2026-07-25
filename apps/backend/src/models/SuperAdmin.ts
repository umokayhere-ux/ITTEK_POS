import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * Platform-level administrator. Not tenant-scoped: a super admin operates
 * across the whole system (approving businesses, monitoring, managing) and is
 * authenticated separately from tenant users.
 */
export interface SuperAdminDocument extends Document<Types.ObjectId> {
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const superAdminSchema = new Schema<SuperAdminDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export const SuperAdmin = model<SuperAdminDocument>('SuperAdmin', superAdminSchema);
