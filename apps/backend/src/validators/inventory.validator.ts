import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const positiveQty = z.number().positive('Quantity must be greater than zero');

export const stockMovementSchema = z.object({
  productId: objectId,
  branchId: objectId,
  quantity: positiveQty,
  reason: z.string().max(300).optional(),
  reference: z.string().max(120).optional(),
});

/** Adjustment sets the on-hand quantity to an exact target (0 allowed). */
export const stockAdjustSchema = z.object({
  productId: objectId,
  branchId: objectId,
  targetQuantity: z.number().min(0),
  reason: z.string().max(300).optional(),
});

export const stockTransferSchema = z.object({
  productId: objectId,
  fromBranchId: objectId,
  toBranchId: objectId,
  quantity: positiveQty,
  reason: z.string().max(300).optional(),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
export type StockTransferInput = z.infer<typeof stockTransferSchema>;
