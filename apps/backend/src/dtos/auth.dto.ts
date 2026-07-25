import type { TenantDocument } from '../models/Tenant.js';
import type { UserDocument } from '../models/User.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface PublicTenant {
  id: string;
  businessName: string;
  businessType: string;
  slug: string;
  currency: string;
  country: string;
  timezone: string;
}

export interface AuthResult {
  user: PublicUser;
  tenant: PublicTenant;
  tokens: AuthTokens;
}

export interface RegisterResult {
  status: string;
  message: string;
  tenant: PublicTenant;
}

/** Strips sensitive/internal fields before returning a user to the client. */
export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: String(user.role),
    tenantId: user.tenantId.toString(),
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
  };
}

export function toPublicTenant(tenant: TenantDocument): PublicTenant {
  return {
    id: tenant._id.toString(),
    businessName: tenant.businessName,
    businessType: tenant.businessType,
    slug: tenant.slug,
    currency: tenant.currency,
    country: tenant.country,
    timezone: tenant.timezone,
  };
}
