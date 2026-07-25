import type { Request, Response } from 'express';
import { buildMeta, parseListQuery } from '../core/pagination.js';
import { Purchase } from '../models/Purchase.js';
import { purchaseService } from '../services/purchase.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function ctxOf(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

export const purchaseController = {
  async create(req: Request, res: Response): Promise<void> {
    const purchase = await purchaseService.createPurchase(ctxOf(req), req.body);
    sendSuccess(res, purchase, 'Purchase recorded', 201);
  },

  async list(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const q = parseListQuery(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId, isDeleted: false };
    if (typeof req.query.supplierId === 'string') filter.supplierId = req.query.supplierId;
    if (typeof req.query.branchId === 'string') filter.branchId = req.query.branchId;

    const [items, total] = await Promise.all([
      Purchase.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .exec(),
      Purchase.countDocuments(filter).exec(),
    ]);
    sendSuccess(res, items, 'Purchases', 200, buildMeta(q.page, q.limit, total));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      tenantId: ctx.tenantId,
      isDeleted: false,
    }).exec();
    if (!purchase) throw AppError.notFound('Purchase not found');
    sendSuccess(res, purchase, 'Purchase detail');
  },
};
