import {
  PLANS,
  SUBSCRIPTION_STATUS,
  SYSTEM_ROLES,
  TRIAL_PERIOD_DAYS,
} from '../constants/index.js';
import {
  toPublicTenant,
  toPublicUser,
  type AuthResult,
  type AuthTokens,
} from '../dtos/auth.dto.js';
import { auditLogRepository } from '../repositories/auditLog.repository.js';
import { subscriptionRepository } from '../repositories/subscription.repository.js';
import { tenantRepository } from '../repositories/tenant.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { slugify, withRandomSuffix } from '../utils/slug.js';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

function issueTokens(userId: string, tenantId: string, role: string): AuthTokens {
  return {
    accessToken: signAccessToken({ sub: userId, tenantId, role }),
    refreshToken: signRefreshToken({ sub: userId, tenantId }),
  };
}

async function generateUniqueSlug(businessName: string): Promise<string> {
  const base = slugify(businessName);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base || withRandomSuffix('shop') : withRandomSuffix(base);
    if (candidate && !(await tenantRepository.existsBySlug(candidate))) {
      return candidate;
    }
  }
  return withRandomSuffix(base);
}

export const authService = {
  /**
   * Registers a new business: provisions the tenant, its owner account, a
   * trial subscription and the initial audit entry. This is the entry point
   * that bootstraps an isolated workspace.
   */
  async register(input: RegisterInput, meta: RequestMeta): Promise<AuthResult> {
    const slug = await generateUniqueSlug(input.businessName);

    const tenant = await tenantRepository.create({
      businessName: input.businessName,
      businessType: input.businessType,
      slug,
      email: input.email,
      phone: input.phone,
      country: input.country,
      currency: input.currency,
      timezone: input.timezone,
      address: input.address,
    });

    try {
      const passwordHash = await hashPassword(input.password);
      const owner = await userRepository.create({
        tenantId: tenant._id,
        name: input.ownerName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: SYSTEM_ROLES.OWNER,
        isEmailVerified: false,
        isActive: true,
      });

      const trialEndsAt = new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      await subscriptionRepository.create({
        tenantId: tenant._id,
        createdBy: owner._id,
        plan: PLANS.TRIAL,
        status: SUBSCRIPTION_STATUS.TRIALING,
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
      });

      await auditLogRepository.record({
        tenantId: tenant._id,
        actorId: owner._id,
        action: 'auth.register',
        entity: 'Tenant',
        entityId: tenant._id.toString(),
        ip: meta.ip,
        userAgent: meta.userAgent,
      });

      const tokens = issueTokens(owner._id.toString(), tenant._id.toString(), String(owner.role));
      return { user: toPublicUser(owner), tenant: toPublicTenant(tenant), tokens };
    } catch (err) {
      // Roll back the tenant if owner/subscription provisioning fails so we
      // never leave an orphaned, unusable workspace behind.
      await tenant.deleteOne().catch(() => undefined);
      if ((err as { code?: number }).code === 11000) {
        throw AppError.conflict('An account with this email already exists');
      }
      throw err;
    }
  },

  async login(input: LoginInput, meta: RequestMeta): Promise<AuthResult> {
    const user = await userRepository.findByEmailAnyTenantWithSecret(input.email);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      throw AppError.unauthorized('Invalid email or password');
    }

    await userRepository.touchLastLogin(user._id);
    await auditLogRepository.record({
      tenantId: user.tenantId,
      actorId: user._id,
      action: 'auth.login',
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    const { Tenant } = await import('../models/Tenant.js');
    const tenant = await Tenant.findById(user.tenantId).exec();
    if (!tenant) throw AppError.unauthorized('Tenant no longer exists');

    const tokens = issueTokens(user._id.toString(), user.tenantId.toString(), String(user.role));
    return { user: toPublicUser(user), tenant: toPublicTenant(tenant), tokens };
  },

  /** Exchanges a valid refresh token for a fresh access/refresh token pair. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await userRepository.findById(payload.tenantId, payload.sub);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User no longer active');
    }
    return issueTokens(user._id.toString(), user.tenantId.toString(), String(user.role));
  },
};
