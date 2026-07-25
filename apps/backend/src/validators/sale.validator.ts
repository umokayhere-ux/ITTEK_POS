import { z } from 'zod';
import { PAYMENT_METHOD } from '../models/Sale.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const saleItemInput = z.object({
  productId: objectId,
  quantity: z.number().positive(),
  unitPrice: z.number().min(0).optional(), // defaults to product selling price
  discount: z.number().min(0).optional(),
});

const paymentInput = z.object({
  method: z.enum([
    PAYMENT_METHOD.CASH,
    PAYMENT_METHOD.CARD,
    PAYMENT_METHOD.MOBILE_MONEY,
    PAYMENT_METHOD.CREDIT,
  ]),
  amount: z.number().min(0),
});

export const createSaleSchema = z.object({
  branchId: objectId,
  customerId: objectId.optional(),
  items: z.array(saleItemInput).min(1, 'A sale needs at least one item'),
  payments: z.array(paymentInput).default([]),
  discount: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

export const refundSaleSchema = z.object({
  reason: z.string().max(300).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
