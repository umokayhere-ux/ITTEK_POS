import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { hashPassword } from '../utils/password.js';

/**
 * Ensures a platform super admin exists. If SUPERADMIN_EMAIL/PASSWORD are set
 * and no admin with that email is present, one is created on boot — so the very
 * first administrator can be provisioned purely via environment variables.
 */
export async function bootstrapSuperAdmin(): Promise<void> {
  if (!env.SUPERADMIN_EMAIL || !env.SUPERADMIN_PASSWORD) return;

  const email = env.SUPERADMIN_EMAIL.toLowerCase();
  const existing = await SuperAdmin.findOne({ email }).exec();
  if (existing) return;

  await SuperAdmin.create({
    name: env.SUPERADMIN_NAME,
    email,
    passwordHash: await hashPassword(env.SUPERADMIN_PASSWORD),
    isActive: true,
  });
  logger.info(`Bootstrapped super admin: ${email}`);
}
