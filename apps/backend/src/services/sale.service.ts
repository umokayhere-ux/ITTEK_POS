import type { AuditContext } from '../core/BaseRepository.js';
import { computeSaleTotals, round2, type SaleLineInput } from '../core/saleTotals.js';
import { nextSequence } from '../models/Counter.js';
import { Customer } from '../models/Customer.js';
import { STOCK_MOVEMENT } from '../models/InventoryLog.js';
import { Product, type ProductDocument } from '../models/Product.js';
import { Sale, SALE_STATUS, type SaleDocument, type SaleItem } from '../models/Sale.js';
import { auditLogRepository } from '../repositories/auditLog.repository.js';
import { AppError } from '../utils/AppError.js';
import { inventoryService } from './inventory.service.js';
import type { CreateSaleInput } from '../validators/sale.validator.js';

function invoiceNo(seq: number): string {
  return `INV-${String(seq).padStart(6, '0')}`;
}

export const saleService = {
  /**
   * Records a completed (or credit) sale: prices lines from the catalog,
   * computes totals, decrements stock through the inventory ledger, and tracks
   * any outstanding customer balance. Stock decrements are pre-checked and
   * compensated on failure so a partial sale is never left behind.
   */
  async createSale(ctx: AuditContext, input: CreateSaleInput): Promise<SaleDocument> {
    // 1. Load and validate products (tenant-scoped).
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

    // 2. Build authoritative priced lines from the catalog.
    const lineInputs: SaleLineInput[] = input.items.map((item) => {
      const product = byId.get(item.productId)!;
      return {
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? product.sellingPrice,
        taxRate: product.taxRate,
        discount: item.discount ?? 0,
      };
    });

    const totals = computeSaleTotals(lineInputs);
    // Apply an optional order-level discount on top of any per-line discounts.
    const orderDiscount = round2(Math.min(input.discount ?? 0, totals.total));
    const grandTotal = round2(totals.total - orderDiscount);
    const discountTotal = round2(totals.discountTotal + orderDiscount);
    const amountPaid = round2(input.payments.reduce((sum, p) => sum + p.amount, 0));

    // 3. Determine settlement / status.
    let status: SaleDocument['status'] = SALE_STATUS.COMPLETED;
    let changeDue = 0;
    let balanceDue = 0;
    if (amountPaid >= grandTotal) {
      changeDue = round2(amountPaid - grandTotal);
    } else {
      if (!input.customerId) {
        throw AppError.badRequest('A customer is required for a credit (partially paid) sale');
      }
      status = SALE_STATUS.CREDIT;
      balanceDue = round2(grandTotal - amountPaid);
    }

    // 4. Pre-check stock for inventory-tracked products.
    for (const item of input.items) {
      const product = byId.get(item.productId)!;
      if (!product.trackInventory) continue;
      const onHand = await inventoryService.getQuantity(ctx.tenantId, item.productId, input.branchId);
      if (onHand < item.quantity) {
        throw AppError.badRequest(`Insufficient stock for ${product.name} (SKU ${product.sku})`);
      }
    }

    // 4b. Resolve customer details for the receipt. Free-text entries win; when
    // a saved customer is chosen without an override, fall back to their record.
    let customerName = input.customerName?.trim() || undefined;
    let customerPhone = input.customerPhone?.trim() || undefined;
    if (input.customerId && (!customerName || !customerPhone)) {
      const customer = await Customer.findOne({ _id: input.customerId, tenantId: ctx.tenantId })
        .select('name phone')
        .lean()
        .exec();
      if (customer) {
        customerName = customerName ?? customer.name;
        customerPhone = customerPhone ?? customer.phone ?? undefined;
      }
    }

    // 5. Invoice number + persisted sale items.
    const invoiceNumber = invoiceNo(await nextSequence(ctx.tenantId, 'invoice'));
    const items: SaleItem[] = input.items.map((item, idx) => {
      const product = byId.get(item.productId)!;
      const line = totals.lines[idx]!;
      return {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        discount: line.discount,
        lineTotal: line.lineTotal,
      };
    });

    const sale = await Sale.create({
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
      invoiceNumber,
      branchId: input.branchId,
      customerId: input.customerId,
      customerName,
      customerPhone,
      items,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal,
      total: grandTotal,
      amountPaid,
      changeDue,
      balanceDue,
      payments: input.payments,
      status,
      notes: input.notes,
    });

    // 6. Decrement stock, compensating if a later line fails.
    const applied: Array<{ productId: string; quantity: number }> = [];
    try {
      for (const item of input.items) {
        const product = byId.get(item.productId)!;
        if (!product.trackInventory) continue;
        await inventoryService.move(ctx, {
          productId: item.productId,
          branchId: input.branchId,
          change: -item.quantity,
          type: STOCK_MOVEMENT.SALE,
          reference: invoiceNumber,
        });
        applied.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (err) {
      for (const a of applied) {
        await inventoryService
          .move(ctx, {
            productId: a.productId,
            branchId: input.branchId,
            change: a.quantity,
            type: STOCK_MOVEMENT.RETURN,
            reference: `${invoiceNumber}:rollback`,
          })
          .catch(() => undefined);
      }
      await sale.deleteOne().catch(() => undefined);
      throw err;
    }

    // 7. Track customer credit.
    if (balanceDue > 0 && input.customerId) {
      await Customer.updateOne(
        { _id: input.customerId, tenantId: ctx.tenantId },
        { $inc: { outstandingBalance: balanceDue } },
      ).exec();
    }

    await auditLogRepository.record({
      tenantId: sale.tenantId,
      actorId: ctx.userId as unknown as SaleDocument['createdBy'],
      action: 'sale.create',
      entity: 'Sale',
      entityId: sale._id.toString(),
      metadata: { invoiceNumber, total: grandTotal },
    });

    return sale;
  },

  /** Fully refunds a sale, restoring stock and clearing any credit balance. */
  async refundSale(ctx: AuditContext, saleId: string): Promise<SaleDocument> {
    const sale = await Sale.findOne({ _id: saleId, tenantId: ctx.tenantId, isDeleted: false }).exec();
    if (!sale) throw AppError.notFound('Sale not found');
    if (sale.status === SALE_STATUS.REFUNDED) {
      throw AppError.badRequest('Sale is already refunded');
    }

    const products = await Product.find({
      _id: { $in: sale.items.map((i) => i.productId) },
      tenantId: ctx.tenantId,
    }).exec();
    const trackable = new Set(
      products.filter((p) => p.trackInventory).map((p) => p._id.toString()),
    );

    for (const item of sale.items) {
      if (!trackable.has(item.productId.toString())) continue;
      await inventoryService.move(ctx, {
        productId: item.productId.toString(),
        branchId: sale.branchId.toString(),
        change: item.quantity,
        type: STOCK_MOVEMENT.RETURN,
        reference: `${sale.invoiceNumber}:refund`,
      });
    }

    if (sale.balanceDue > 0 && sale.customerId) {
      await Customer.updateOne(
        { _id: sale.customerId, tenantId: ctx.tenantId },
        { $inc: { outstandingBalance: -sale.balanceDue } },
      ).exec();
    }

    sale.status = SALE_STATUS.REFUNDED;
    sale.updatedBy = ctx.userId as unknown as SaleDocument['updatedBy'];
    await sale.save();
    return sale;
  },
};
