import { z } from 'zod';
import { SYSTEM_ROLES } from '../constants/index.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/** Roles an owner/manager may assign to staff (not owner or super admin). */
export const ASSIGNABLE_ROLES = [
  SYSTEM_ROLES.BRANCH_MANAGER,
  SYSTEM_ROLES.STORE_MANAGER,
  SYSTEM_ROLES.CASHIER,
  SYSTEM_ROLES.STORE_KEEPER,
  SYSTEM_ROLES.ACCOUNTANT,
  SYSTEM_ROLES.SALES_REP,
  SYSTEM_ROLES.AUDITOR,
] as const;

export const createStaffSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Add a lowercase letter')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[0-9]/, 'Add a number'),
  phone: z.string().max(30).optional(),
  role: z.enum(ASSIGNABLE_ROLES),
  branchIds: z.array(objectId).optional(),
});

export const updateStaffSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    role: z.enum(ASSIGNABLE_ROLES).optional(),
    phone: z.string().max(30).optional(),
    branchIds: z.array(objectId).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
