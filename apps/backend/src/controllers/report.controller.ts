import type { Request, Response } from 'express';
import { reportService } from '../services/report.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function ctxOf(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId };
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
    const data = await reportService.dashboard(ctxOf(req).tenantId);
    sendSuccess(res, data, 'Dashboard');
  },

  async salesSeries(req: Request, res: Response): Promise<void> {
    const period = typeof req.query.period === 'string' ? req.query.period : 'daily';
    const data = await reportService.salesSeries(ctxOf(req).tenantId, period);
    sendSuccess(res, data, 'Sales series');
  },
};
