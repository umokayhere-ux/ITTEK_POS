import { Schema, model, type Document, type Types } from 'mongoose';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export const EXPENSE_CATEGORIES = [
  'utilities',
  'salaries',
  'rent',
  'fuel',
  'repairs',
  'supplies',
  'transport',
  'marketing',
  'miscellaneous',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface ExpenseDocument extends Document<Types.ObjectId>, TenantScopedFields {
  branchId?: Types.ObjectId;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date: Date;
  paymentMethod?: string;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<ExpenseDocument>(
  {
    ...tenantScopedSchemaFields,
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 500 },
    date: { type: Date, required: true, default: () => new Date() },
    paymentMethod: { type: String, trim: true },
    isRecurring: { type: Boolean, default: false },
  },
  { timestamps: true },
);

expenseSchema.index({ tenantId: 1, date: -1 });
expenseSchema.index({ tenantId: 1, category: 1 });

export const Expense = model<ExpenseDocument>('Expense', expenseSchema);
