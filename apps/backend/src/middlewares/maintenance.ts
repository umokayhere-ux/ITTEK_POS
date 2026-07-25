import type { NextFunction, Request, Response } from 'express';
import { getPlatformSettings } from '../models/PlatformSettings.js';
import { AppError } from '../utils/AppError.js';

// Paths that stay reachable during maintenance (platform admin + the version
// probe). Everything else for tenants is blocked with a 503.
const ALLOWLIST = [/^\/platform(\/|$)/, /^\/?$/];

/**
 * When the super admin enables maintenance mode, tenant API access is blocked
 * with a 503 and the configured message. Platform admin routes stay open.
 */
export async function maintenanceGuard(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (ALLOWLIST.some((re) => re.test(req.path))) return next();
    const settings = await getPlatformSettings();
    if (settings.maintenanceMode) {
      return next(new AppError(503, settings.maintenanceMessage));
    }
    next();
  } catch (err) {
    next(err);
  }
}
