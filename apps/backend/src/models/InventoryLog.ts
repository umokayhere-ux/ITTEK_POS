import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export const STOCK_MOVEMENT = {
  STOCK_IN: 'stock_in',
  STOCK_OUT: 'stock_out',
  ADJUSTMENT: 'adjustment',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  SALE: 'sale',
  RETURN: 'return',
} as const;

export type StockMovementType = (typeof STOCK_MOVEMENT)[keyof typeof STOCK_MOVEMENT];

/**
 * Immutable ledger entry for every stock change. `change` is signed
 * (positive = added, negative = removed) and `balanceAfter` snapshots the
 * resulting on-hand quantity for fast auditing.
 */
export interface InventoryLogDocument extends Document<Types.ObjectId>, TenantScopedFields {
  productId: Types.ObjectId;
  branchId: Types.ObjectId;
  type: StockMovementType;
  change: number;
  balanceAfter: number;
  reason?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryLogSchema = new Schema<InventoryLogDocument>(
  {
    ...tenantScopedSchemaFields,
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    type: { type: String, enum: Object.values(STOCK_MOVEMENT), required: true },
    change: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, trim: true, maxlength: 300 },
    reference: { type: String, trim: true },
  },
  { timestamps: true },
);

inventoryLogSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });
inventoryLogSchema.index({ tenantId: 1, branchId: 1, createdAt: -1 });

export const InventoryLog = model<InventoryLogDocument>('InventoryLog', inventoryLogSchema);
