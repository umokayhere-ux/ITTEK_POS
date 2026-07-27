import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export const PAYMENT_METHOD = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  CREDIT: 'credit',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const SALE_STATUS = {
  COMPLETED: 'completed',
  CREDIT: 'credit',
  PARTIALLY_REFUNDED: 'partially_refunded',
  REFUNDED: 'refunded',
} as const;

export type SaleStatus = (typeof SALE_STATUS)[keyof typeof SALE_STATUS];

export interface SaleItem {
  productId: Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  lineTotal: number;
}

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
}

export interface SaleDocument extends Document<Types.ObjectId>, TenantScopedFields {
  invoiceNumber: string;
  branchId: Types.ObjectId;
  customerId?: Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  items: SaleItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  amountPaid: number;
  changeDue: number;
  balanceDue: number;
  payments: SalePayment[];
  status: SaleStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const saleItemSchema = new Schema<SaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const salePaymentSchema = new Schema<SalePayment>(
  {
    method: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new Schema<SaleDocument>(
  {
    ...tenantScopedSchemaFields,
    invoiceNumber: { type: String, required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    // Optional walk-in customer details captured at the till for the receipt.
    customerName: { type: String, trim: true, maxlength: 120 },
    customerPhone: { type: String, trim: true, maxlength: 40 },
    // Name of the staff member who rang up the sale (for "Served by" on receipts).
    cashierName: { type: String, trim: true, maxlength: 120 },
    items: { type: [saleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    taxTotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    changeDue: { type: Number, required: true, min: 0, default: 0 },
    balanceDue: { type: Number, required: true, min: 0, default: 0 },
    payments: { type: [salePaymentSchema], default: [] },
    status: { type: String, enum: Object.values(SALE_STATUS), default: SALE_STATUS.COMPLETED },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

saleSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
saleSchema.index({ tenantId: 1, branchId: 1, createdAt: -1 });
saleSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });

export const Sale = model<SaleDocument>('Sale', saleSchema);
