import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export const REGISTER_STATUS = { OPEN: 'open', CLOSED: 'closed' } as const;
export type RegisterStatus = (typeof REGISTER_STATUS)[keyof typeof REGISTER_STATUS];

export interface CashRegisterDocument extends Document<Types.ObjectId>, TenantScopedFields {
  branchId: Types.ObjectId;
  status: RegisterStatus;
  openingBalance: number;
  expectedCash: number;
  countedCash?: number;
  difference?: number;
  openedAt: Date;
  closedAt?: Date;
  closedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cashRegisterSchema = new Schema<CashRegisterDocument>(
  {
    ...tenantScopedSchemaFields,
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    status: { type: String, enum: Object.values(REGISTER_STATUS), default: REGISTER_STATUS.OPEN },
    openingBalance: { type: Number, required: true, min: 0, default: 0 },
    expectedCash: { type: Number, required: true, default: 0 },
    countedCash: { type: Number },
    difference: { type: Number },
    openedAt: { type: Date, default: () => new Date() },
    closedAt: { type: Date },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// At most one open register per branch at a time.
cashRegisterSchema.index(
  { tenantId: 1, branchId: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } },
);

export const CashRegister = model<CashRegisterDocument>('CashRegister', cashRegisterSchema);
