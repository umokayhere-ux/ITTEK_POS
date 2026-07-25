import type { AuditContext } from '../core/BaseRepository.js';
import { round2 } from '../core/saleTotals.js';
import { nextSequence } from '../models/Counter.js';
import { STOCK_MOVEMENT } from '../models/InventoryLog.js';
import { Product, type ProductDocument } from '../models/Product.js';
import { Purchase, PURCHASE_STATUS, type PurchaseDocument, type PurchaseItem } from '../models/Purchase.js';
import { Supplier } from '../models/Supplier.js';
import { AppError } from '../utils/AppError.js';
import { inventoryService } from './inventory.service.js';
import type { CreatePurchaseInput } from '../validators/purchase.validator.js';

function poNumber(seq: number): string {
  return `PO-${String(seq).padStart(6, '0')}`;
}

export const purchaseService = {
  /**
   * Records a received purchase: increases stock via the inventory ledger,
   * refreshes each product's cost price, and tracks any amount owed to the
   * supplier.
   */
  async createPurchase(ctx: AuditContext, input: CreatePurchaseInput): Promise<PurchaseDocument> {
    const ids = [...new Set(input.items.map((i) => i.productId))];
    const products = await Product.find({
      _id: { $in: ids },
      tenantId: ctx.tenantId,
      isDeleted: false,
    }).exec();
    const byId = new Map<string, ProductDocument>(products.map((p) => [p._id.toString(), p]));

    for (const item of input.items) {
      if (!byId.has(item.productId)) {
        throw AppError.badRequest(`Product not found: ${item.productId}`);
      }
    }

    const items: PurchaseItem[] = input.items.map((item) => {
      const product = byId.get(item.productId)!;
      const lineTotal = round2(item.quantity * item.unitCost);
      return {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
        lineTotal,
      };
    });

    const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));
    const total = subtotal;
    const amountPaid = round2(Math.min(input.amountPaid, total));
    const balanceDue = round2(total - amountPaid);
    const status = balanceDue > 0 ? PURCHASE_STATUS.PARTIAL : PURCHASE_STATUS.RECEIVED;

    const reference = poNumber(await nextSequence(ctx.tenantId, 'purchase'));

    const purchase = await Purchase.create({
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
      reference,
      supplierId: input.supplierId,
      branchId: input.branchId,
      items,
      subtotal,
      total,
      amountPaid,
      balanceDue,
      status,
      notes: input.notes,
    });

    // Receive stock and refresh cost price for each tracked product.
    for (const item of input.items) {
      const product = byId.get(item.productId)!;
      if (product.trackInventory) {
        await inventoryService.move(ctx, {
          productId: item.productId,
          branchId: input.branchId,
          change: item.quantity,
          type: STOCK_MOVEMENT.STOCK_IN,
          reference,
        });
      }
      await Product.updateOne(
        { _id: item.productId, tenantId: ctx.tenantId },
        { $set: { costPrice: item.unitCost, updatedBy: ctx.userId } },
      ).exec();
    }

    if (balanceDue > 0) {
      await Supplier.updateOne(
        { _id: input.supplierId, tenantId: ctx.tenantId },
        { $inc: { outstandingBalance: balanceDue } },
      ).exec();
    }

    return purchase;
  },
};
