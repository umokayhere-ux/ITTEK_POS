import { Router } from 'express';
import type { ZodTypeAny } from 'zod';
import { authenticate } from '../middlewares/authenticate.js';
import { enforceSubscriptionOnWrite } from '../middlewares/enforceSubscription.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { CrudHandlers } from './crudController.js';

export interface CrudRouterOptions {
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
}

/**
 * Wires the standard REST surface for a resource:
 *   POST /   GET /   GET /:id   PATCH /:id   DELETE /:id
 * All routes require a valid access token; bodies are validated.
 */
export function createCrudRouter(handlers: CrudHandlers, options: CrudRouterOptions): Router {
  const router = Router();
  router.use(authenticate, enforceSubscriptionOnWrite);

  router.post('/', validate(options.createSchema), asyncHandler(handlers.create));
  router.get('/', asyncHandler(handlers.list));
  router.get('/:id', asyncHandler(handlers.getById));
  router.patch('/:id', validate(options.updateSchema), asyncHandler(handlers.update));
  router.delete('/:id', asyncHandler(handlers.remove));

  return router;
}
