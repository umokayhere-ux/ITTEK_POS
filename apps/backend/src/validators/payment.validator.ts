import { z } from 'zod';
import { PAYMENT_PARTY } from '../models/Payment.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const recordPaymentSchema = z.object({
  partyType: z.enum([PAYMENT_PARTY.CUSTOMER, PAYMENT_PARTY.SUPPLIER]),
  partyId: objectId,
  amount: z.number().positive(),
  method: z.string().max(40).optional(),
  note: z.string().max(300).optional(),
});
