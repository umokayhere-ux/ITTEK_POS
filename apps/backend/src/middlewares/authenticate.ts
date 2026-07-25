import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Verifies the Bearer access token and attaches the tenant-scoped auth context
 * to the request. The tenantId used by every downstream query comes from here,
 * so it can never be forged by the client.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  const payload = verifyAccessToken(token);

  req.token = payload;
  req.auth = {
    userId: payload.sub,
    tenantId: payload.tenantId,
    role: payload.role,
  };

  next();
}
