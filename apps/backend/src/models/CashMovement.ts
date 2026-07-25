import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export const CASH_DIRECTION = { IN: 'in', OUT: 'out' } as const;
export type CashDirection = (typeof CASH_DIRECTION)[keyof typeof CASH_DIRECTION];

export interface CashMovementDocument extends Document<Types.ObjectId>, TenantScopedFields {
  registerId: Types.ObjectId;
  direction: CashDirection;
  amount: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cashMovementSchema = new Schema<CashMovementDocument>(
  {
    ...tenantScopedSchemaFields,
    registerId: { type: Schema.Types.ObjectId, ref: 'CashRegister', required: true },
    direction: { type: String, enum: Object.values(CASH_DIRECTION), required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

cashMovementSchema.index({ tenantId: 1, registerId: 1, createdAt: -1 });

export const CashMovement = model<CashMovementDocument>('CashMovement', cashMovementSchema);
