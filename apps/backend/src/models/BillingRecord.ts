import { Schema, model, type Document, type Types } from 'mongoose';

/** A subscription payment attempt/record (Paystack). */
export interface BillingRecordDocument extends Document<Types.ObjectId> {
  tenantId: Types.ObjectId;
  plan: string;
  amount: number;
  currency: string;
  reference: string;
  status: 'pending' | 'success' | 'failed';
  paidAt?: Date;
  createdAt: Date;
}

const billingRecordSchema = new Schema<BillingRecordDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    plan: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paidAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const BillingRecord = model<BillingRecordDocument>('BillingRecord', billingRecordSchema);
