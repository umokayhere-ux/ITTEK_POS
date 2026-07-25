import type { Request, Response } from 'express';
import { buildMeta, parseListQuery } from '../core/pagination.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { StockLevel } from '../models/StockLevel.js';
import { inventoryService } from '../services/inventory.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function ctxOf(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

export const inventoryController = {
  async levels(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const q = parseListQuery(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId, isDeleted: false };
    if (typeof req.query.branchId === 'string') filter.branchId = req.query.branchId;
    if (typeof req.query.productId === 'string') filter.productId = req.query.productId;

    const [items, total] = await Promise.all([
      StockLevel.find(filter)
        .sort({ [q.sortBy]: q.sortOrder })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .exec(),
      StockLevel.countDocuments(filter).exec(),
    ]);
    sendSuccess(res, items, 'Stock levels', 200, buildMeta(q.page, q.limit, total));
  },

  async logs(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const q = parseListQuery(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId, isDeleted: false };
    if (typeof req.query.branchId === 'string') filter.branchId = req.query.branchId;
    if (typeof req.query.productId === 'string') filter.productId = req.query.productId;

    const [items, total] = await Promise.all([
      InventoryLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .exec(),
      InventoryLog.countDocuments(filter).exec(),
    ]);
    sendSuccess(res, items, 'Inventory logs', 200, buildMeta(q.page, q.limit, total));
  },

  async lowStock(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const items = await inventoryService.lowStock(ctx.tenantId);
    sendSuccess(res, items, 'Low stock items');
  },

  async stockIn(req: Request, res: Response): Promise<void> {
    const level = await inventoryService.stockIn(ctxOf(req), req.body);
    sendSuccess(res, level, 'Stock added', 201);
  },

  async stockOut(req: Request, res: Response): Promise<void> {
    const level = await inventoryService.stockOut(ctxOf(req), req.body);
    sendSuccess(res, level, 'Stock removed', 201);
  },

  async adjust(req: Request, res: Response): Promise<void> {
    const level = await inventoryService.adjust(ctxOf(req), req.body);
    sendSuccess(res, level, 'Stock adjusted');
  },

  async transfer(req: Request, res: Response): Promise<void> {
    const result = await inventoryService.transfer(ctxOf(req), req.body);
    sendSuccess(res, result, 'Stock transferred', 201);
  },
};
