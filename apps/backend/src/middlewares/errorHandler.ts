import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/** Global error handler producing the consistent error envelope. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  // Duplicate-key errors from MongoDB surface as a 409.
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Resource already exists' });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : String((err as Error)?.message ?? err),
  });
}
