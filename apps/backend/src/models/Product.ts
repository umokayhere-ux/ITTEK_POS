import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export interface ProductDocument extends Document<Types.ObjectId>, TenantScopedFields {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: Types.ObjectId;
  brandId?: Types.ObjectId;
  unitId?: Types.ObjectId;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  taxRate: number;
  images: string[];
  reorderLevel: number;
  trackInventory: boolean;
  expiryDate?: Date;
  batchNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    ...tenantScopedSchemaFields,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 60 },
    barcode: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 2000 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    sellingPrice: { type: Number, required: true, min: 0, default: 0 },
    wholesalePrice: { type: Number, min: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    images: { type: [String], default: [] },
    reorderLevel: { type: Number, min: 0, default: 0 },
    trackInventory: { type: Boolean, default: true },
    expiryDate: { type: Date },
    batchNumber: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
// Barcode is unique per tenant only when present (sparse partial index).
productSchema.index(
  { tenantId: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: 'string' } } },
);
productSchema.index({ tenantId: 1, name: 1 });

export const Product = model<ProductDocument>('Product', productSchema);
