import { Types } from 'mongoose';
import { Expense } from '../models/Expense.js';
import { Sale, SALE_STATUS } from '../models/Sale.js';

interface DateRange {
  from?: Date;
  to?: Date;
  branchId?: string;
}

function saleMatch(tenantId: string, range: DateRange): Record<string, unknown> {
  const match: Record<string, unknown> = {
    tenantId: new Types.ObjectId(tenantId),
    isDeleted: false,
    status: { $ne: SALE_STATUS.REFUNDED },
  };
  if (range.branchId) match.branchId = new Types.ObjectId(range.branchId);
  const createdAt: Record<string, Date> = {};
  if (range.from) createdAt.$gte = range.from;
  if (range.to) createdAt.$lte = range.to;
  if (Object.keys(createdAt).length) match.createdAt = createdAt;
  return match;
}

export const reportService = {
  /** Totals and a per-day series of sales value. */
  async salesSummary(tenantId: string, range: DateRange) {
    const match = saleMatch(tenantId, range);
    const [totals] = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          count: { $sum: 1 },
          totalTax: { $sum: '$taxTotal' },
          totalDiscount: { $sum: '$discountTotal' },
        },
      },
    ]).exec();

    const byDay = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', total: 1, count: 1 } },
    ]).exec();

    return {
      totalSales: totals?.totalSales ?? 0,
      count: totals?.count ?? 0,
      totalTax: totals?.totalTax ?? 0,
      totalDiscount: totals?.totalDiscount ?? 0,
      averageSale: totals?.count ? Math.round((totals.totalSales / totals.count) * 100) / 100 : 0,
      byDay,
    };
  },

  /** Best-selling products by quantity and revenue. */
  topProducts(tenantId: string, range: DateRange, limit = 10) {
    return Sale.aggregate([
      { $match: saleMatch(tenantId, range) },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: limit },
      { $project: { _id: 0, productId: '$_id', name: 1, sku: 1, quantitySold: 1, revenue: 1 } },
    ]).exec();
  },

  /**
   * Simple profit & loss: revenue from sales minus recorded expenses. This is a
   * cash-basis operating summary, not full COGS accounting (that arrives with
   * the accounting module).
   */
  async profitLoss(tenantId: string, range: DateRange) {
    const summary = await this.salesSummary(tenantId, range);

    const expenseMatch: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
    };
    const date: Record<string, Date> = {};
    if (range.from) date.$gte = range.from;
    if (range.to) date.$lte = range.to;
    if (Object.keys(date).length) expenseMatch.date = date;

    const [expenseTotals] = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
    ]).exec();

    const revenue = summary.totalSales;
    const expenses = expenseTotals?.totalExpenses ?? 0;
    return {
      revenue,
      expenses,
      netProfit: Math.round((revenue - expenses) * 100) / 100,
      salesCount: summary.count,
    };
  },
};
