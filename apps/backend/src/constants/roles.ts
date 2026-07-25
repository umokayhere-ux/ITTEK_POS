/**
 * Built-in platform roles. Tenants may also define custom roles (later module),
 * but these system roles always exist and cannot be deleted.
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  BRANCH_MANAGER: 'branch_manager',
  STORE_MANAGER: 'store_manager',
  CASHIER: 'cashier',
  STORE_KEEPER: 'store_keeper',
  ACCOUNTANT: 'accountant',
  SALES_REP: 'sales_representative',
  AUDITOR: 'auditor',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

export const SYSTEM_ROLE_VALUES = Object.values(SYSTEM_ROLES) as SystemRole[];
