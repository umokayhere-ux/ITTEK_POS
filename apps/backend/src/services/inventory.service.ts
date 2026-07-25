import { Types } from 'mongoose';
import type { AuditContext } from '../core/BaseRepository.js';
import {
  InventoryLog,
  STOCK_MOVEMENT,
  type StockMovementType,
} from '../models/InventoryLog.js';
import { StockLevel, type StockLevelDocument } from '../models/StockLevel.js';
import { AppError } from '../utils/AppError.js';

interface MovementInput {
  productId: string;
  branchId: string;
  change: number; // signed
  type: StockMovementType;
  reason?: string;
  reference?: string;
}

async function applyMovement(ctx: AuditContext, input: MovementInput): Promise<StockLevelDocument> {
  const { productId, branchId, change } = input;
  const filter = { tenantId: ctx.tenantId, productId, branchId, isDeleted: false };

  let level: StockLevelDocument | null;
  if (change >= 0) {
    level = await StockLevel.findOneAndUpdate(
      filter,
      {
        $inc: { quantity: change },
        $set: { updatedBy: ctx.userId },
        $setOnInsert: { createdBy: ctx.userId, deletedAt: null },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();
  } else {
    // Conditional decrement: only succeeds if enough stock is on hand,
    // making the check-and-update atomic without a transaction.
    level = await StockLevel.findOneAndUpdate(
      { ...filter, quantity: { $gte: -change } },
      { $inc: { quantity: change }, $set: { updatedBy: ctx.userId } },
      { new: true },
    ).exec();
    if (!level) {
      throw AppError.badRequest('Insufficient stock for this movement');
    }
  }

  await InventoryLog.create({
    tenantId: ctx.tenantId,
    productId,
    branchId,
    type: input.type,
    change,
    balanceAfter: level.quantity,
    reason: input.reason,
    reference: input.reference,
    createdBy: ctx.userId,
    updatedBy: ctx.userId,
  });

  return level;
}

async function getQuantity(tenantId: string, productId: string, branchId: string): Promise<number> {
  const level = await StockLevel.findOne({ tenantId, productId, branchId, isDeleted: false }).exec();
  return level?.quantity ?? 0;
}

export const inventoryService = {
  stockIn(
    ctx: AuditContext,
    p: { productId: string; branchId: string; quantity: number; reason?: string; reference?: string },
  ): Promise<StockLevelDocument> {
    return applyMovement(ctx, { ...p, change: p.quantity, type: STOCK_MOVEMENT.STOCK_IN });
  },

  stockOut(
    ctx: AuditContext,
    p: { productId: string; branchId: string; quantity: number; reason?: string; reference?: string },
  ): Promise<StockLevelDocument> {
    return applyMovement(ctx, { ...p, change: -p.quantity, type: STOCK_MOVEMENT.STOCK_OUT });
  },

  /** Sets on-hand quantity to an exact target, logging the delta. */
  async adjust(
    ctx: AuditContext,
    p: { productId: string; branchId: string; targetQuantity: number; reason?: string },
  ): Promise<StockLevelDocument> {
    const current = await getQuantity(ctx.tenantId, p.productId, p.branchId);
    const change = p.targetQuantity - current;
    if (change === 0) {
      // No-op adjustment still returns the current level.
      const level = await StockLevel.findOneAndUpdate(
        { tenantId: ctx.tenantId, productId: p.productId, branchId: p.branchId, isDeleted: false },
        { $set: { updatedBy: ctx.userId }, $setOnInsert: { createdBy: ctx.userId, quantity: 0 } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).exec();
      return level as StockLevelDocument;
    }
    return applyMovement(ctx, {
      productId: p.productId,
      branchId: p.branchId,
      change,
      type: STOCK_MOVEMENT.ADJUSTMENT,
      reason: p.reason,
    });
  },

  /** Moves stock between two branches (out of source, into destination). */
  async transfer(
    ctx: AuditContext,
    p: { productId: string; fromBranchId: string; toBranchId: string; quantity: number; reason?: string },
  ): Promise<{ from: StockLevelDocument; to: StockLevelDocument }> {
    if (p.fromBranchId === p.toBranchId) {
      throw AppError.badRequest('Source and destination branches must differ');
    }
    const from = await applyMovement(ctx, {
      productId: p.productId,
      branchId: p.fromBranchId,
      change: -p.quantity,
      type: STOCK_MOVEMENT.TRANSFER_OUT,
      reason: p.reason,
      reference: `transfer:${p.toBranchId}`,
    });
    const to = await applyMovement(ctx, {
      productId: p.productId,
      branchId: p.toBranchId,
      change: p.quantity,
      type: STOCK_MOVEMENT.TRANSFER_IN,
      reason: p.reason,
      reference: `transfer:${p.fromBranchId}`,
    });
    return { from, to };
  },

  /** Products at or below their reorder level, joined with product details. */
  lowStock(tenantId: string): Promise<unknown[]> {
    return StockLevel.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId), isDeleted: false } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.isDeleted': false, $expr: { $lte: ['$quantity', '$product.reorderLevel'] } } },
      {
        $project: {
          productId: 1,
          branchId: 1,
          quantity: 1,
          reorderLevel: '$product.reorderLevel',
          name: '$product.name',
          sku: '$product.sku',
        },
      },
    ]).exec();
  },
};
