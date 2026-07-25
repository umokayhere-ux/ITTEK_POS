import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export interface CustomerDocument extends Document<Types.ObjectId>, TenantScopedFields {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  groupName?: string;
  creditLimit: number;
  outstandingBalance: number;
  loyaltyPoints: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<CustomerDocument>(
  {
    ...tenantScopedSchemaFields,
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    groupName: { type: String, trim: true },
    creditLimit: { type: Number, min: 0, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

customerSchema.index({ tenantId: 1, phone: 1 });
customerSchema.index({ tenantId: 1, name: 1 });

export const Customer = model<CustomerDocument>('Customer', customerSchema);
