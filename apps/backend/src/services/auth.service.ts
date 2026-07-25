import {
  PLANS,
  SUBSCRIPTION_STATUS,
  SYSTEM_ROLES,
  TENANT_STATUS,
  TRIAL_PERIOD_DAYS,
} from '../constants/index.js';
import {
  toPublicTenant,
  toPublicUser,
  type AuthResult,
  type AuthTokens,
  type RegisterResult,
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
   * Registers a new business: provisions the tenant (in PENDING state), its
   * owner account, a trial subscription and the initial audit entry. The owner
   * cannot sign in until a super admin approves the business.
   */
  async register(input: RegisterInput, meta: RequestMeta): Promise<RegisterResult> {
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
      status: TENANT_STATUS.PENDING,
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

      return {
        status: TENANT_STATUS.PENDING,
        message:
          'Your business has been registered and is pending approval. You will be able to sign in once an administrator approves your account.',
        tenant: toPublicTenant(tenant),
      };
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

    // Second factor, when enabled for this user.
    if (user.twoFactorEnabled) {
      const { twoFactorService } = await import('./twoFactor.service.js');
      if (!input.twoFactorToken) {
        throw new AppError(401, 'Two-factor code required', { twoFactorRequired: true });
      }
      if (!user.twoFactorSecret || !twoFactorService.verifyToken(user.twoFactorSecret, input.twoFactorToken)) {
        throw new AppError(401, 'Invalid two-factor code', { twoFactorRequired: true });
      }
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

    // Gate sign-in on the business's approval status.
    if (tenant.status === TENANT_STATUS.PENDING) {
      throw AppError.forbidden('Your business is awaiting administrator approval');
    }
    if (tenant.status === TENANT_STATUS.SUSPENDED) {
      throw AppError.forbidden('Your business has been suspended. Please contact support.');
    }
    if (tenant.status === TENANT_STATUS.REJECTED) {
      throw AppError.forbidden('Your business registration was not approved.');
    }

    const tokens = issueTokens(user._id.toString(), user.tenantId.toString(), String(user.role));
    return { user: toPublicUser(user), tenant: toPublicTenant(tenant), tokens };
  },

  /**
   * Starts a password reset: issues a one-time token, stores its hash with a
   * 1-hour expiry, and emails the reset link. Always resolves the same way so
   * the caller cannot probe which emails exist.
   */
  async forgotPassword(email: string): Promise<void> {
    const crypto = await import('node:crypto');
    const { User } = await import('../models/User.js');
    const user = await User.findOne({ email, isDeleted: false }).exec();
    if (!user || !user.isActive) return;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenHash = tokenHash;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const { appBaseUrl, sendMail } = await import('../config/mailer.js');
    const link = `${appBaseUrl()}/reset-password?token=${token}`;
    await sendMail(
      user.email,
      'Reset your iTtEk POS password',
      `<p>Hello ${user.name},</p><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${link}">${link}</a></p><p>If you did not request this, you can ignore this email.</p>`,
    );
  },

  /** Completes a password reset using a valid, unexpired token. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const crypto = await import('node:crypto');
    const { User } = await import('../models/User.js');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() },
      isDeleted: false,
    })
      .select('+resetTokenHash +resetTokenExpires')
      .exec();
    if (!user) throw AppError.badRequest('Invalid or expired reset link');

    user.passwordHash = await hashPassword(newPassword);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();
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
