import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export interface SupplierDocument extends Document<Types.ObjectId>, TenantScopedFields {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  outstandingBalance: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<SupplierDocument>(
  {
    ...tenantScopedSchemaFields,
    name: { type: String, required: true, trim: true, maxlength: 160 },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    outstandingBalance: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

supplierSchema.index({ tenantId: 1, name: 1 });

export const Supplier = model<SupplierDocument>('Supplier', supplierSchema);
