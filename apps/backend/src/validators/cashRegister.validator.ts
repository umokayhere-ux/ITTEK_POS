import { z } from 'zod';
import { CASH_DIRECTION } from '../models/CashMovement.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const openRegisterSchema = z.object({
  branchId: objectId,
  openingBalance: z.number().min(0).default(0),
});

export const cashMovementSchema = z.object({
  direction: z.enum([CASH_DIRECTION.IN, CASH_DIRECTION.OUT]),
  amount: z.number().positive(),
  reason: z.string().max(300).optional(),
});

export const closeRegisterSchema = z.object({
  countedCash: z.number().min(0),
});

export type OpenRegisterInput = z.infer<typeof openRegisterSchema>;
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
export type CloseRegisterInput = z.infer<typeof closeRegisterSchema>;
