import { Schema, model, type Document, type Types } from 'mongoose';
import { PAYMENT_PARTY, type PaymentParty } from './Payment.js';

/**
 * A manually recorded debt entry (in addition to balances that accrue from
 * credit sales / purchases). Creating one increases the party's outstanding
 * balance; it carries an optional due date for reminders.
 */
export interface DebtDocument extends Document<Types.ObjectId> {
  tenantId: Types.ObjectId;
  partyType: PaymentParty;
  partyId: Types.ObjectId;
  amount: number;
  description?: string;
  dueDate?: Date;
  status: 'outstanding' | 'settled';
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const debtSchema = new Schema<DebtDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    partyType: { type: String, enum: Object.values(PAYMENT_PARTY), required: true },
    partyId: { type: Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 300 },
    dueDate: { type: Date },
    status: { type: String, enum: ['outstanding', 'settled'], default: 'outstanding' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

debtSchema.index({ tenantId: 1, status: 1, dueDate: 1 });

export const Debt = model<DebtDocument>('Debt', debtSchema);
