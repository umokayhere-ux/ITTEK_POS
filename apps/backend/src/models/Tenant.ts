import { Schema, model, type Document, type Types } from 'mongoose';
import {
  ALL_FEATURE_KEYS,
  BUSINESS_TYPES,
  TENANT_STATUS,
  type BusinessType,
  type TenantStatus,
} from '../constants/index.js';

/**
 * A Tenant is a single business account. It is the isolation boundary: every
 * other tenant-scoped document references a Tenant via tenantId.
 */
export interface TenantDocument extends Document<Types.ObjectId> {
  businessName: string;
  businessType: BusinessType;
  slug: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  timezone: string;
  address?: string;
  logoUrl?: string;
  taxNumber?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  enabledFeatures: string[];
  status: TenantStatus;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<TenantDocument>(
  {
    businessName: { type: String, required: true, trim: true, maxlength: 160 },
    businessType: { type: String, enum: BUSINESS_TYPES, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    currency: { type: String, required: true, uppercase: true, trim: true, maxlength: 3 },
    timezone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    taxNumber: { type: String, trim: true },
    receiptHeader: { type: String, trim: true, maxlength: 300 },
    receiptFooter: { type: String, trim: true, maxlength: 300 },
    // Features the platform (super admin) has enabled for this business.
    enabledFeatures: { type: [String], default: () => [...ALL_FEATURE_KEYS] },
    status: {
      type: String,
      enum: Object.values(TENANT_STATUS),
      default: TENANT_STATUS.PENDING,
      index: true,
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'SuperAdmin' },
    rejectionReason: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Tenant = model<TenantDocument>('Tenant', tenantSchema);
