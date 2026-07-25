import { z } from 'zod';
import { BUSINESS_TYPES } from '../constants/index.js';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  businessName: z.string().min(2).max(160),
  businessType: z.enum(BUSINESS_TYPES),
  ownerName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(5).max(30),
  password,
  address: z.string().max(300).optional(),
  country: z.string().min(2).max(80),
  currency: z.string().length(3).toUpperCase(),
  timezone: z.string().min(2).max(80),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
