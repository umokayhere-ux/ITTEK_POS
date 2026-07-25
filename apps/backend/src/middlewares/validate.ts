import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError.js';

type Segment = 'body' | 'query' | 'params';

/**
 * Validates and replaces a request segment with the parsed, typed result.
 * Rejects invalid input with a 400 and a field-level error map.
 */
export function validate(schema: ZodTypeAny, segment: Segment = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req[segment] = schema.parse(req[segment]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw AppError.badRequest('Validation failed', err.flatten().fieldErrors);
      }
      throw err;
    }
  };
}
