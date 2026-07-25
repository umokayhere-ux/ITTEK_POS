import { z } from 'zod';

export const platformLoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const rejectTenantSchema = z.object({
  reason: z.string().max(300).optional(),
});

export type PlatformLoginInput = z.infer<typeof platformLoginSchema>;
