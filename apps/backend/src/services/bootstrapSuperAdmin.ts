import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

/**
 * Ensures a platform super admin exists AND that its password matches the
 * configured SUPERADMIN_PASSWORD. Runs on every boot: if the env credentials
 * are set, they become the source of truth — creating the admin if missing, or
 * resetting the password if it drifted (e.g. an earlier typo'd deploy). This
 * makes the first admin recoverable purely by redeploying with correct vars.
 */
export async function bootstrapSuperAdmin(): Promise<void> {
  if (!env.SUPERADMIN_EMAIL || !env.SUPERADMIN_PASSWORD) {
    logger.info('SUPERADMIN_EMAIL/PASSWORD not set — skipping super admin bootstrap');
    return;
  }

  const email = env.SUPERADMIN_EMAIL.trim().toLowerCase();
  const existing = await SuperAdmin.findOne({ email }).select('+passwordHash').exec();

  if (!existing) {
    await SuperAdmin.create({
      name: env.SUPERADMIN_NAME,
      email,
      passwordHash: await hashPassword(env.SUPERADMIN_PASSWORD),
      isActive: true,
    });
    logger.info(`Super admin created: ${email}`);
    return;
  }

  // Admin exists — make sure it is active and its password matches the env value.
  const matches = await verifyPassword(env.SUPERADMIN_PASSWORD, existing.passwordHash);
  if (!matches || !existing.isActive) {
    existing.passwordHash = await hashPassword(env.SUPERADMIN_PASSWORD);
    existing.isActive = true;
    await existing.save();
    logger.info(`Super admin password reset from env: ${email}`);
  } else {
    logger.info(`Super admin present: ${email}`);
  }
}
