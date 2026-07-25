import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export interface BrandDocument extends Document<Types.ObjectId>, TenantScopedFields {
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<BrandDocument>(
  {
    ...tenantScopedSchemaFields,
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    logoUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

brandSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Brand = model<BrandDocument>('Brand', brandSchema);
