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

  /**
   * Dashboard numbers. `scope: 'mine'` restricts sales/expenses/activity to the
   * given user (their own performance); `'business'` shows the whole tenant and
   * includes business-wide cards (inventory, customers, suppliers, debts).
   */
  async dashboard(tenantId: string, opts: { userId: string; scope: 'mine' | 'business' }) {
    const tid = new Types.ObjectId(tenantId);
    const uid = new Types.ObjectId(opts.userId);
    const mine = opts.scope === 'mine';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    const saleMatch: Record<string, unknown> = {
      tenantId: tid,
      isDeleted: false,
      status: { $ne: SALE_STATUS.REFUNDED },
    };
    if (mine) saleMatch.createdBy = uid;
    const expenseMatch: Record<string, unknown> = {
      tenantId: tid,
      isDeleted: false,
      date: { $gte: monthStart },
    };
    if (mine) expenseMatch.createdBy = uid;

    const sumSales = (from: Date, to?: Date) =>
      Sale.aggregate([
        { $match: { ...saleMatch, createdAt: to ? { $gte: from, $lt: to } : { $gte: from } } },
        { $group: { _id: null, sales: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]).exec();

    const [todayAgg, cogsAgg, monthExpAgg, byDay, topProducts, activities, yesterdayAgg] =
      await Promise.all([
        sumSales(todayStart),
        Sale.aggregate([
          { $match: { ...saleMatch, createdAt: { $gte: todayStart } } },
          { $unwind: '$items' },
          { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'p' } },
          { $unwind: '$p' },
          { $group: { _id: null, cogs: { $sum: { $multiply: ['$items.quantity', '$p.costPrice'] } } } },
        ]).exec(),
        Expense.aggregate([
          { $match: expenseMatch },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).exec(),
        Sale.aggregate([
          { $match: { ...saleMatch, createdAt: { $gte: weekAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              total: { $sum: '$total' },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: '$_id', total: 1 } },
        ]).exec(),
        Sale.aggregate([
          { $match: saleMatch },
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
          { $limit: 5 },
          { $project: { _id: 0, productId: '$_id', name: 1, sku: 1, quantitySold: 1, revenue: 1 } },
        ]).exec(),
        AuditLog.find(mine ? { tenantId: tid, actorId: uid } : { tenantId: tid })
          .sort({ createdAt: -1 })
          .limit(6)
          .lean()
          .exec(),
        sumSales(yesterdayStart, todayStart),
      ]);

    // Business-wide cards only in business scope.
    let business = {
      lowStockCount: null as number | null,
      inventoryValue: null as number | null,
      customers: null as number | null,
      suppliers: null as number | null,
      outstandingDebts: null as number | null,
    };
    if (!mine) {
      const [lowStock, invAgg, customers, suppliers, debtsAgg] = await Promise.all([
        inventoryService.lowStock(tenantId),
        StockLevel.aggregate([
          { $match: { tenantId: tid, isDeleted: false } },
          { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
          { $unwind: '$p' },
          { $group: { _id: null, value: { $sum: { $multiply: ['$quantity', '$p.costPrice'] } } } },
        ]).exec(),
        Customer.countDocuments({ tenantId: tid, isDeleted: false }).exec(),
        Supplier.countDocuments({ tenantId: tid, isDeleted: false }).exec(),
        Customer.aggregate([
          { $match: { tenantId: tid, isDeleted: false } },
          { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
        ]).exec(),
      ]);
      business = {
        lowStockCount: lowStock.length,
        inventoryValue: Math.round((invAgg[0]?.value ?? 0) * 100) / 100,
        customers,
        suppliers,
        outstandingDebts: Math.round((debtsAgg[0]?.total ?? 0) * 100) / 100,
      };
    }

    const todaySales = todayAgg[0]?.sales ?? 0;
    const todayOrders = todayAgg[0]?.orders ?? 0;
    const cogs = cogsAgg[0]?.cogs ?? 0;
    const ySales = yesterdayAgg[0]?.sales ?? 0;
    const yOrders = yesterdayAgg[0]?.orders ?? 0;

    const pct = (t: number, y: number): { value: number; up: boolean } => {
      if (y === 0) return { value: t > 0 ? 100 : 0, up: t >= 0 };
      const v = ((t - y) / y) * 100;
      return { value: Math.round(v * 10) / 10, up: v >= 0 };
    };

    return {
      scope: opts.scope,
      todaySales,
      todayOrders,
      grossProfitToday: Math.round((todaySales - cogs) * 100) / 100,
      trends: { sales: pct(todaySales, ySales), orders: pct(todayOrders, yOrders) },
      monthExpenses: monthExpAgg[0]?.total ?? 0,
      ...business,
      salesSeries: byDay,
      topProducts,
      recentActivities: activities.map((a) => ({ action: a.action, entity: a.entity, at: a.createdAt })),
    };
  },

  /** Sales totals bucketed by day/week/month/year for the overview toggle. */
  salesSeries(tenantId: string, period: string, opts?: { userId: string; scope: 'mine' | 'business' }) {
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

    const match: Record<string, unknown> = {
      tenantId: tid,
      isDeleted: false,
      status: { $ne: SALE_STATUS.REFUNDED },
      createdAt: { $gte: from },
    };
    if (opts?.scope === 'mine') match.createdBy = new Types.ObjectId(opts.userId);

    return Sale.aggregate([
      { $match: match },
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
