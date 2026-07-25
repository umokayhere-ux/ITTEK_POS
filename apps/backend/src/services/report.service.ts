import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { Customer } from '../models/Customer.js';
import { Expense } from '../models/Expense.js';
import { Sale, SALE_STATUS } from '../models/Sale.js';
import { StockLevel } from '../models/StockLevel.js';
import { Supplier } from '../models/Supplier.js';
import { inventoryService } from './inventory.service.js';

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

  /** Aggregated numbers for the main dashboard. */
  async dashboard(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const saleBase = { tenantId: tid, isDeleted: false, status: { $ne: SALE_STATUS.REFUNDED } };
    const sumSales = (from: Date, to?: Date) =>
      Sale.aggregate([
        { $match: { ...saleBase, createdAt: to ? { $gte: from, $lt: to } : { $gte: from } } },
        { $group: { _id: null, sales: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]).exec();

    const [
      todayAgg,
      cogsAgg,
      lowStock,
      invAgg,
      customers,
      suppliers,
      monthExpAgg,
      debtsAgg,
      byDay,
      topProducts,
      activities,
      yesterdayAgg,
    ] = await Promise.all([
      Sale.aggregate([
        { $match: { ...saleBase, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, sales: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]).exec(),
      Sale.aggregate([
        { $match: { ...saleBase, createdAt: { $gte: todayStart } } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $group: { _id: null, cogs: { $sum: { $multiply: ['$items.quantity', '$p.costPrice'] } } } },
      ]).exec(),
      inventoryService.lowStock(tenantId),
      StockLevel.aggregate([
        { $match: { tenantId: tid, isDeleted: false } },
        { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $group: { _id: null, value: { $sum: { $multiply: ['$quantity', '$p.costPrice'] } } } },
      ]).exec(),
      Customer.countDocuments({ tenantId: tid, isDeleted: false }).exec(),
      Supplier.countDocuments({ tenantId: tid, isDeleted: false }).exec(),
      Expense.aggregate([
        { $match: { tenantId: tid, isDeleted: false, date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).exec(),
      Customer.aggregate([
        { $match: { tenantId: tid, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
      ]).exec(),
      Sale.aggregate([
        { $match: { ...saleBase, createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', total: 1 } },
      ]).exec(),
      this.topProducts(tenantId, {}, 5),
      AuditLog.find({ tenantId: tid }).sort({ createdAt: -1 }).limit(6).lean().exec(),
      sumSales(yesterdayStart, todayStart),
    ]);

    const todaySales = todayAgg[0]?.sales ?? 0;
    const todayOrders = todayAgg[0]?.orders ?? 0;
    const cogs = cogsAgg[0]?.cogs ?? 0;
    const ySales = yesterdayAgg[0]?.sales ?? 0;
    const yOrders = yesterdayAgg[0]?.orders ?? 0;

    // Percent change vs. yesterday for the trend badges.
    const pct = (t: number, y: number): { value: number; up: boolean } => {
      if (y === 0) return { value: t > 0 ? 100 : 0, up: t >= 0 };
      const v = ((t - y) / y) * 100;
      return { value: Math.round(v * 10) / 10, up: v >= 0 };
    };

    return {
      todaySales,
      todayOrders,
      grossProfitToday: Math.round((todaySales - cogs) * 100) / 100,
      trends: {
        sales: pct(todaySales, ySales),
        orders: pct(todayOrders, yOrders),
      },
      lowStockCount: lowStock.length,
      inventoryValue: Math.round((invAgg[0]?.value ?? 0) * 100) / 100,
      customers,
      suppliers,
      monthExpenses: monthExpAgg[0]?.total ?? 0,
      outstandingDebts: Math.round((debtsAgg[0]?.total ?? 0) * 100) / 100,
      salesSeries: byDay,
      topProducts,
      recentActivities: activities.map((a) => ({ action: a.action, entity: a.entity, at: a.createdAt })),
    };
  },

  /** Sales totals bucketed by day/week/month/year for the overview toggle. */
  salesSeries(tenantId: string, period: string) {
    const tid = new Types.ObjectId(tenantId);
    const now = new Date();
    let from: Date;
    let format: string;
    switch (period) {
      case 'weekly':
        from = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
        format = '%Y-W%U';
        break;
      case 'monthly':
        from = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        format = '%Y-%m';
        break;
      case 'yearly':
        from = new Date(now.getFullYear() - 4, 0, 1);
        format = '%Y';
        break;
      default:
        from = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
        format = '%Y-%m-%d';
    }

    return Sale.aggregate([
      {
        $match: {
          tenantId: tid,
          isDeleted: false,
          status: { $ne: SALE_STATUS.REFUNDED },
          createdAt: { $gte: from },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          total: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', total: 1 } },
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
