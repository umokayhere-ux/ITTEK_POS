import type { Request, Response } from 'express';
import { TENANT_STATUS } from '../constants/index.js';
import { buildMeta, parseListQuery } from '../core/pagination.js';
import { platformService } from '../services/platform.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function adminId(req: Request): string {
  if (!req.platformAdminId) throw AppError.unauthorized();
  return req.platformAdminId;
}

export const platformController = {
  async login(req: Request, res: Response): Promise<void> {
    const result = await platformService.login(req.body.email, req.body.password);
    sendSuccess(res, result, 'Logged in');
  },

  async me(req: Request, res: Response): Promise<void> {
    const admin = await platformService.me(adminId(req));
    sendSuccess(res, admin, 'Current admin');
  },

  async stats(req: Request, res: Response): Promise<void> {
    adminId(req);
    sendSuccess(res, await platformService.stats(), 'Platform stats');
  },

  async listTenants(req: Request, res: Response): Promise<void> {
    adminId(req);
    const q = parseListQuery(req.query as Record<string, unknown>);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await platformService.listTenants(q, status);
    sendSuccess(res, items, 'Businesses', 200, buildMeta(q.page, q.limit, total));
  },

  async approve(req: Request, res: Response): Promise<void> {
    const tenant = await platformService.setStatus(req.params.id as string, TENANT_STATUS.ACTIVE, adminId(req));
    sendSuccess(res, tenant, 'Business approved');
  },

  async reject(req: Request, res: Response): Promise<void> {
    const tenant = await platformService.setStatus(
      req.params.id as string,
      TENANT_STATUS.REJECTED,
      adminId(req),
      req.body?.reason,
    );
    sendSuccess(res, tenant, 'Business rejected');
  },

  async suspend(req: Request, res: Response): Promise<void> {
    const tenant = await platformService.setStatus(req.params.id as string, TENANT_STATUS.SUSPENDED, adminId(req));
    sendSuccess(res, tenant, 'Business suspended');
  },

  async reactivate(req: Request, res: Response): Promise<void> {
    const tenant = await platformService.setStatus(req.params.id as string, TENANT_STATUS.ACTIVE, adminId(req));
    sendSuccess(res, tenant, 'Business reactivated');
  },
};
