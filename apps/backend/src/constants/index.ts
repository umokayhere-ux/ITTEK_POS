export * from './roles.js';

/** Subscription plan tiers offered to tenants. */
export const PLANS = {
  TRIAL: 'trial',
  STARTER: 'starter',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

/** Subscription lifecycle states. */
export const SUBSCRIPTION_STATUS = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/** Length of the free trial in days. */
export const TRIAL_PERIOD_DAYS = 14;

/** Monthly plan pricing in major currency units (charged in the tenant's currency). */
export const PLAN_PRICING: Record<string, { label: string; amount: number }> = {
  starter: { label: 'Starter', amount: 100 },
  business: { label: 'Business', amount: 300 },
  enterprise: { label: 'Enterprise', amount: 800 },
};

/** Days added to the subscription per successful payment. */
export const BILLING_PERIOD_DAYS = 30;

/** Supported business categories at registration. */
export const BUSINESS_TYPES = [
  'supermarket',
  'grocery',
  'pharmacy',
  'bookstore',
  'fashion',
  'boutique',
  'restaurant',
  'electronics',
  'hardware',
  'beauty',
  'cosmetic',
  'wholesale',
  'minimart',
  'convenience',
  'petshop',
  'agro',
  'other',
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Approval lifecycle for a business (tenant). New signups start pending. */
export const TENANT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
} as const;

export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

export const API_PREFIX = '/api/v1';
