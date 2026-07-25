import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

/**
 * Coarse-grained role gate. Granular, permission-based authorization arrives
 * with the RBAC module; this guards routes by system role in the meantime.
 */
export function requireRole(...allowed: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) throw AppError.unauthorized();
    if (!allowed.includes(req.auth.role)) {
      throw AppError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
