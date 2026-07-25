import { z } from 'zod';

/** Business categories offered at registration (mirrors the backend enum). */
export const BUSINESS_TYPES = [
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'grocery', label: 'Grocery Store' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'bookstore', label: 'Bookstore' },
  { value: 'fashion', label: 'Fashion Shop' },
  { value: 'boutique', label: 'Boutique' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'electronics', label: 'Electronics Store' },
  { value: 'hardware', label: 'Hardware Store' },
  { value: 'beauty', label: 'Beauty Shop' },
  { value: 'cosmetic', label: 'Cosmetic Shop' },
  { value: 'wholesale', label: 'Wholesale Store' },
  { value: 'minimart', label: 'Mini Mart' },
  { value: 'convenience', label: 'Convenience Store' },
  { value: 'petshop', label: 'Pet Shop' },
  { value: 'agro', label: 'Agro Shop' },
  { value: 'other', label: 'Other' },
] as const;

const businessTypeValues = BUSINESS_TYPES.map((t) => t.value) as [string, ...string[]];

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name is too short').max(160),
  businessType: z.enum(businessTypeValues, { message: 'Select a business type' }),
  ownerName: z.string().min(2, 'Your name is too short').max(120),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(5, 'Enter a valid phone number').max(30),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[a-z]/, 'Add a lowercase letter')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[0-9]/, 'Add a number'),
  country: z.string().min(2, 'Country is required').max(80),
  currency: z.string().length(3, 'Use a 3-letter currency code'),
  timezone: z.string().min(2, 'Timezone is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
