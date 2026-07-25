import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const purchaseItemInput = z.object({
  productId: objectId,
  quantity: z.number().positive(),
  unitCost: z.number().min(0),
});

export const createPurchaseSchema = z.object({
  supplierId: objectId,
  branchId: objectId,
  items: z.array(purchaseItemInput).min(1, 'A purchase needs at least one item'),
  amountPaid: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
