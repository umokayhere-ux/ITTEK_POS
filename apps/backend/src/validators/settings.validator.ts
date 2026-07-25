import { z } from 'zod';

export const updateBusinessSchema = z
  .object({
    businessName: z.string().min(2).max(160).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(300).optional(),
    currency: z.string().length(3).toUpperCase().optional(),
    timezone: z.string().max(80).optional(),
    logoUrl: z.string().url().max(500).optional().or(z.literal('')),
    taxNumber: z.string().max(60).optional().or(z.literal('')),
    receiptHeader: z.string().max(300).optional().or(z.literal('')),
    receiptFooter: z.string().max(300).optional().or(z.literal('')),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
