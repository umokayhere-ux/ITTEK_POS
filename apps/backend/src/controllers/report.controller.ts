import type { Request, Response } from 'express';
import { SYSTEM_ROLES } from '../constants/index.js';
import { reportService } from '../services/report.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function ctxOf(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId };
}

// Only owners/managers may view the whole-business scope; everyone else is
// restricted to their own performance.
function scopeOf(req: Request): { userId: string; scope: 'mine' | 'business' } {
  if (!req.auth) throw AppError.unauthorized();
  const canViewBusiness =
    req.auth.role === SYSTEM_ROLES.OWNER || req.auth.role === SYSTEM_ROLES.BRANCH_MANAGER;
  const wantsBusiness = req.query.scope === 'business';
  return { userId: req.auth.userId, scope: canViewBusiness && wantsBusiness ? 'business' : 'mine' };
}

function range(req: Request) {
  const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
  const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;
  const branchId = typeof req.query.branchId === 'string' ? req.query.branchId : undefined;
  return { from, to, branchId };
}

export const reportController = {
  async salesSummary(req: Request, res: Response): Promise<void> {
    const data = await reportService.salesSummary(ctxOf(req).tenantId, range(req));
    sendSuccess(res, data, 'Sales summary');
  },

  async topProducts(req: Request, res: Response): Promise<void> {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const data = await reportService.topProducts(ctxOf(req).tenantId, range(req), limit);
    sendSuccess(res, data, 'Top products');
  },

  async profitLoss(req: Request, res: Response): Promise<void> {
    const data = await reportService.profitLoss(ctxOf(req).tenantId, range(req));
    sendSuccess(res, data, 'Profit & loss');
  },

  async dashboard(req: Request, res: Response): Promise<void> {
    const data = await reportService.dashboard(ctxOf(req).tenantId, scopeOf(req));
    sendSuccess(res, data, 'Dashboard');
  },

  async salesSeries(req: Request, res: Response): Promise<void> {
    const period = typeof req.query.period === 'string' ? req.query.period : 'daily';
    const data = await reportService.salesSeries(ctxOf(req).tenantId, period, scopeOf(req));
    sendSuccess(res, data, 'Sales series');
  },
};
