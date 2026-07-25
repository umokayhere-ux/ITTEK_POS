import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export const PAYMENT_PARTY = { CUSTOMER: 'customer', SUPPLIER: 'supplier' } as const;
export type PaymentParty = (typeof PAYMENT_PARTY)[keyof typeof PAYMENT_PARTY];

/**
 * A payment received from a customer (reducing what they owe) or made to a
 * supplier (reducing what we owe). Recorded alongside the balance adjustment.
 */
export interface PaymentDocument extends Document<Types.ObjectId>, TenantScopedFields {
  partyType: PaymentParty;
  partyId: Types.ObjectId;
  amount: number;
  method?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    ...tenantScopedSchemaFields,
    partyType: { type: String, enum: Object.values(PAYMENT_PARTY), required: true },
    partyId: { type: Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

paymentSchema.index({ tenantId: 1, partyType: 1, partyId: 1, createdAt: -1 });

export const Payment = model<PaymentDocument>('Payment', paymentSchema);
