import type { Request, Response } from 'express';
import { buildMeta, parseListQuery } from '../core/pagination.js';
import { CashMovement } from '../models/CashMovement.js';
import { CashRegister } from '../models/CashRegister.js';
import { cashRegisterService } from '../services/cashRegister.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function ctxOf(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

export const cashRegisterController = {
  async open(req: Request, res: Response): Promise<void> {
    const register = await cashRegisterService.open(ctxOf(req), req.body);
    sendSuccess(res, register, 'Register opened', 201);
  },

  async addMovement(req: Request, res: Response): Promise<void> {
    const register = await cashRegisterService.addMovement(ctxOf(req), req.params.id as string, req.body);
    sendSuccess(res, register, 'Cash movement recorded', 201);
  },

  async close(req: Request, res: Response): Promise<void> {
    const register = await cashRegisterService.close(ctxOf(req), req.params.id as string, req.body);
    sendSuccess(res, register, 'Register closed');
  },

  async current(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const branchId = req.query.branchId;
    if (typeof branchId !== 'string') throw AppError.badRequest('branchId is required');
    const register = await cashRegisterService.currentForBranch(ctx.tenantId, branchId);
    sendSuccess(res, register, register ? 'Open register' : 'No open register');
  },

  async list(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const q = parseListQuery(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId, isDeleted: false };
    if (typeof req.query.branchId === 'string') filter.branchId = req.query.branchId;
    if (typeof req.query.status === 'string') filter.status = req.query.status;

    const [items, total] = await Promise.all([
      CashRegister.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .exec(),
      CashRegister.countDocuments(filter).exec(),
    ]);
    sendSuccess(res, items, 'Registers', 200, buildMeta(q.page, q.limit, total));
  },

  async movements(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const items = await CashMovement.find({
      tenantId: ctx.tenantId,
      registerId: req.params.id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .exec();
    sendSuccess(res, items, 'Register movements');
  },
};
