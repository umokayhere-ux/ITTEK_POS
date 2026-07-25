import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export interface UnitDocument extends Document<Types.ObjectId>, TenantScopedFields {
  name: string;
  abbreviation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const unitSchema = new Schema<UnitDocument>(
  {
    ...tenantScopedSchemaFields,
    name: { type: String, required: true, trim: true, maxlength: 60 },
    abbreviation: { type: String, required: true, trim: true, maxlength: 12 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

unitSchema.index({ tenantId: 1, abbreviation: 1 }, { unique: true });

export const Unit = model<UnitDocument>('Unit', unitSchema);
