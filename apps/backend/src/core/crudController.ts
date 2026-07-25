import type { Request, Response } from 'express';
import type { TenantScopedFields } from '../models/baseFields.js';
import { AppError } from '../utils/AppError.js';
import { buildMeta } from './pagination.js';
import { parseListQuery } from './pagination.js';
import { sendSuccess } from '../utils/apiResponse.js';
import type { AuditContext, BaseRepository } from './BaseRepository.js';

function ctxOf(req: Request): AuditContext {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

export interface CrudHandlers {
  create: (req: Request, res: Response) => Promise<void>;
  list: (req: Request, res: Response) => Promise<void>;
  getById: (req: Request, res: Response) => Promise<void>;
  update: (req: Request, res: Response) => Promise<void>;
  remove: (req: Request, res: Response) => Promise<void>;
}

/**
 * Produces the five standard CRUD handlers for a tenant-scoped resource. Each
 * handler derives tenant/user context from the verified token, never the body.
 */
export function createCrudController<TDoc extends TenantScopedFields>(
  repo: BaseRepository<TDoc>,
  label: string,
): CrudHandlers {
  return {
    async create(req, res) {
      const doc = await repo.create(req.body, ctxOf(req));
      sendSuccess(res, doc, `${label} created`, 201);
    },

    async list(req, res) {
      const ctx = ctxOf(req);
      const query = parseListQuery(req.query as Record<string, unknown>);
      const { items, total } = await repo.list(ctx.tenantId, query);
      sendSuccess(res, items, `${label} list`, 200, buildMeta(query.page, query.limit, total));
    },

    async getById(req, res) {
      const ctx = ctxOf(req);
      const doc = await repo.findById(ctx.tenantId, req.params.id as string);
      if (!doc) throw AppError.notFound(`${label} not found`);
      sendSuccess(res, doc, `${label} detail`);
    },

    async update(req, res) {
      const ctx = ctxOf(req);
      const doc = await repo.update(ctx.tenantId, req.params.id as string, req.body, ctx);
      if (!doc) throw AppError.notFound(`${label} not found`);
      sendSuccess(res, doc, `${label} updated`);
    },

    async remove(req, res) {
      const ctx = ctxOf(req);
      const doc = await repo.softDelete(ctx.tenantId, req.params.id as string, ctx);
      if (!doc) throw AppError.notFound(`${label} not found`);
      sendSuccess(res, { id: req.params.id }, `${label} deleted`);
    },
  };
}
