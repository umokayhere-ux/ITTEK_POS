import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '../models/Expense.js';

/** 24-char hex MongoDB ObjectId. */
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const optionalId = objectId.optional();

// --- Branch ---
export const createBranchSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(20),
  address: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  managerId: optionalId,
  isActive: z.boolean().optional(),
});

// --- Category ---
export const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  parentId: optionalId,
  isActive: z.boolean().optional(),
});

// --- Brand ---
export const createBrandSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

// --- Unit ---
export const createUnitSchema = z.object({
  name: z.string().min(1).max(60),
  abbreviation: z.string().min(1).max(12),
  isActive: z.boolean().optional(),
});

// --- Product ---
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(60),
  barcode: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  categoryId: optionalId,
  brandId: optionalId,
  unitId: optionalId,
  costPrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  wholesalePrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).default(0),
  images: z.array(z.string().url()).max(10).optional(),
  reorderLevel: z.number().min(0).default(0),
  trackInventory: z.boolean().optional(),
  expiryDate: z.coerce.date().optional(),
  batchNumber: z.string().max(60).optional(),
  isActive: z.boolean().optional(),
});

// --- Customer ---
export const createCustomerSchema = z.object({
  name: z.string().min(1).max(160),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  groupName: z.string().max(80).optional(),
  creditLimit: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

// --- Supplier ---
export const createSupplierSchema = z.object({
  name: z.string().min(1).max(160),
  contactPerson: z.string().max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

// --- Expense ---
export const createExpenseSchema = z.object({
  branchId: optionalId,
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().min(0),
  description: z.string().max(500).optional(),
  date: z.coerce.date().optional(),
  paymentMethod: z.string().max(40).optional(),
  isRecurring: z.boolean().optional(),
});

// Update schemas: every field optional, and reject empty payloads.
const nonEmpty = (schema: z.ZodObject<z.ZodRawShape>) =>
  schema.partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const updateBranchSchema = nonEmpty(createBranchSchema);
export const updateCategorySchema = nonEmpty(createCategorySchema);
export const updateBrandSchema = nonEmpty(createBrandSchema);
export const updateUnitSchema = nonEmpty(createUnitSchema);
export const updateProductSchema = nonEmpty(createProductSchema);
export const updateCustomerSchema = nonEmpty(createCustomerSchema);
export const updateSupplierSchema = nonEmpty(createSupplierSchema);
export const updateExpenseSchema = nonEmpty(createExpenseSchema);
