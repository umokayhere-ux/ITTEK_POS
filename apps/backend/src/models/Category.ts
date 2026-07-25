import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export interface CategoryDocument extends Document<Types.ObjectId>, TenantScopedFields {
  name: string;
  description?: string;
  parentId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    ...tenantScopedSchemaFields,
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Category = model<CategoryDocument>('Category', categorySchema);
