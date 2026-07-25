import { authenticator } from 'otplib';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const ISSUER = 'iTtEk POS';

export const twoFactorService = {
  /** Generates a secret (not yet enabled) and returns the otpauth URI to add
   *  to an authenticator app. */
  async setup(tenantId: string, userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await User.findOne({ _id: userId, tenantId, isDeleted: false })
      .select('+twoFactorSecret')
      .exec();
    if (!user) throw AppError.notFound('User not found');

    const secret = authenticator.generateSecret();
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false;
    await user.save();

    return { secret, otpauthUrl: authenticator.keyuri(user.email, ISSUER, secret) };
  },

  async enable(tenantId: string, userId: string, token: string): Promise<void> {
    const user = await User.findOne({ _id: userId, tenantId, isDeleted: false })
      .select('+twoFactorSecret')
      .exec();
    if (!user || !user.twoFactorSecret) throw AppError.badRequest('Start 2FA setup first');
    if (!authenticator.verify({ token, secret: user.twoFactorSecret })) {
      throw AppError.badRequest('Invalid code');
    }
    user.twoFactorEnabled = true;
    await user.save();
  },

  async disable(tenantId: string, userId: string, token: string): Promise<void> {
    const user = await User.findOne({ _id: userId, tenantId, isDeleted: false })
      .select('+twoFactorSecret')
      .exec();
    if (!user || !user.twoFactorSecret) throw AppError.badRequest('2FA is not enabled');
    if (!authenticator.verify({ token, secret: user.twoFactorSecret })) {
      throw AppError.badRequest('Invalid code');
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();
  },

  /** Verifies a TOTP token against a stored secret (used during login). */
  verifyToken(secret: string, token: string): boolean {
    return authenticator.verify({ token, secret });
  },
};
