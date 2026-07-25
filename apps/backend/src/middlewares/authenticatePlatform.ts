import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyPlatformToken } from '../utils/jwt.js';

/**
 * Verifies a platform (super admin) token and attaches the admin id. Separate
 * from tenant `authenticate` so platform routes can never be reached with a
 * tenant user's token.
 */
export function authenticatePlatform(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }
  const payload = verifyPlatformToken(header.slice('Bearer '.length).trim());
  req.platformAdminId = payload.sub;
  next();
}
