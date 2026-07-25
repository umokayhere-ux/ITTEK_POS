import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

/**
 * Current on-hand quantity of a product at a branch. One row per
 * (tenant, product, branch); mutated atomically via `$inc`.
 */
export interface StockLevelDocument extends Document<Types.ObjectId>, TenantScopedFields {
  productId: Types.ObjectId;
  branchId: Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const stockLevelSchema = new Schema<StockLevelDocument>(
  {
    ...tenantScopedSchemaFields,
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    quantity: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

stockLevelSchema.index({ tenantId: 1, productId: 1, branchId: 1 }, { unique: true });

export const StockLevel = model<StockLevelDocument>('StockLevel', stockLevelSchema);
