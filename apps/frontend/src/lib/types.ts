export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  isEmailVerified: boolean;
}

export interface Tenant {
  id: string;
  businessName: string;
  businessType: string;
  slug: string;
  currency: string;
  country: string;
  timezone: string;
}

export interface AuthResult {
  user: User;
  tenant: Tenant;
  tokens: AuthTokens;
}
