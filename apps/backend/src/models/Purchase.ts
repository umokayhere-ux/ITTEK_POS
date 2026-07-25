import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export const PURCHASE_STATUS = {
  RECEIVED: 'received',
  PARTIAL: 'partial',
  ORDERED: 'ordered',
} as const;

export type PurchaseStatus = (typeof PURCHASE_STATUS)[keyof typeof PURCHASE_STATUS];

export interface PurchaseItem {
  productId: Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseDocument extends Document<Types.ObjectId>, TenantScopedFields {
  reference: string;
  supplierId: Types.ObjectId;
  branchId: Types.ObjectId;
  items: PurchaseItem[];
  subtotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: PurchaseStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseItemSchema = new Schema<PurchaseItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const purchaseSchema = new Schema<PurchaseDocument>(
  {
    ...tenantScopedSchemaFields,
    reference: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: { type: [purchaseItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    balanceDue: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: Object.values(PURCHASE_STATUS), default: PURCHASE_STATUS.RECEIVED },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

purchaseSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
purchaseSchema.index({ tenantId: 1, supplierId: 1, createdAt: -1 });

export const Purchase = model<PurchaseDocument>('Purchase', purchaseSchema);
