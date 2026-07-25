import type { Request, Response } from 'express';
import { buildMeta, parseListQuery } from '../core/pagination.js';
import { Sale } from '../models/Sale.js';
import { saleService } from '../services/sale.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function ctxOf(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

export const saleController = {
  async create(req: Request, res: Response): Promise<void> {
    const sale = await saleService.createSale(ctxOf(req), req.body);
    sendSuccess(res, sale, 'Sale recorded', 201);
  },

  async list(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const q = parseListQuery(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId, isDeleted: false };
    if (typeof req.query.branchId === 'string') filter.branchId = req.query.branchId;
    if (typeof req.query.customerId === 'string') filter.customerId = req.query.customerId;
    if (typeof req.query.status === 'string') filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Sale.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .exec(),
      Sale.countDocuments(filter).exec(),
    ]);
    sendSuccess(res, items, 'Sales', 200, buildMeta(q.page, q.limit, total));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const sale = await Sale.findOne({
      _id: req.params.id,
      tenantId: ctx.tenantId,
      isDeleted: false,
    }).exec();
    if (!sale) throw AppError.notFound('Sale not found');
    sendSuccess(res, sale, 'Sale detail');
  },

  async refund(req: Request, res: Response): Promise<void> {
    const sale = await saleService.refundSale(ctxOf(req), req.params.id as string);
    sendSuccess(res, sale, 'Sale refunded');
  },
};
