import { Types } from 'mongoose';
import { ALL_FEATURE_KEYS, FEATURES, TENANT_STATUS } from '../constants/index.js';
import type { ListQuery } from '../core/pagination.js';
import { StockLevel } from '../models/StockLevel.js';
import { Branch } from '../models/Branch.js';
import { Customer } from '../models/Customer.js';
import { Expense } from '../models/Expense.js';
import { Product } from '../models/Product.js';
import { Purchase } from '../models/Purchase.js';
import { Sale, SALE_STATUS } from '../models/Sale.js';
import { Supplier } from '../models/Supplier.js';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { Tenant, type TenantDocument } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signPlatformToken } from '../utils/jwt.js';
import { verifyPassword } from '../utils/password.js';

export interface PlatformAdminPublic {
  id: string;
  name: string;
  email: string;
}

export const platformService = {
  async login(email: string, password: string): Promise<{ admin: PlatformAdminPublic; token: string }> {
    const admin = await SuperAdmin.findOne({ email }).select('+passwordHash').exec();
    if (!admin || !admin.isActive) throw AppError.unauthorized('Invalid credentials');

    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) throw AppError.unauthorized('Invalid credentials');

    admin.lastLoginAt = new Date();
    await admin.save();

    return {
      admin: { id: admin._id.toString(), name: admin.name, email: admin.email },
      token: signPlatformToken({ sub: admin._id.toString() }),
    };
  },

  async me(adminId: string): Promise<PlatformAdminPublic> {
    const admin = await SuperAdmin.findById(adminId).exec();
    if (!admin) throw AppError.notFound('Admin not found');
    return { id: admin._id.toString(), name: admin.name, email: admin.email };
  },

  async listTenants(
    query: ListQuery,
    status?: string,
  ): Promise<{ items: TenantDocument[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (query.search) {
      filter.$or = [
        { businessName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Tenant.find(filter)
        .sort({ [query.sortBy]: query.sortOrder })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      Tenant.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  async stats() {
    const [total, pending, active, suspended, rejected, totalUsers, totalSales] = await Promise.all([
      Tenant.countDocuments({}).exec(),
      Tenant.countDocuments({ status: TENANT_STATUS.PENDING }).exec(),
      Tenant.countDocuments({ status: TENANT_STATUS.ACTIVE }).exec(),
      Tenant.countDocuments({ status: TENANT_STATUS.SUSPENDED }).exec(),
      Tenant.countDocuments({ status: TENANT_STATUS.REJECTED }).exec(),
      User.countDocuments({ isDeleted: false }).exec(),
      Sale.countDocuments({ isDeleted: false, status: { $ne: SALE_STATUS.REFUNDED } }).exec(),
    ]);
    return { total, pending, active, suspended, rejected, totalUsers, totalSales };
  },

  async setStatus(
    tenantId: string,
    status: string,
    adminId: string,
    reason?: string,
  ): Promise<TenantDocument> {
    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) throw AppError.notFound('Business not found');

    tenant.status = status as TenantDocument['status'];
    if (status === TENANT_STATUS.ACTIVE) {
      tenant.isActive = true;
      tenant.isSuspended = false;
      if (!tenant.approvedAt) {
        tenant.approvedAt = new Date();
        tenant.approvedBy = adminId as unknown as TenantDocument['approvedBy'];
      }
    } else if (status === TENANT_STATUS.SUSPENDED) {
      tenant.isSuspended = true;
    } else if (status === TENANT_STATUS.REJECTED) {
      tenant.isActive = false;
      tenant.rejectionReason = reason;
    }
    await tenant.save();
    return tenant;
  },

  /**
   * Per-tenant record counts across the platform (NON-financial): how many
   * products, customers, sales, etc. each business has. No money figures.
   */
  async tenantsSummary() {
    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean().exec();

    const models = {
      products: Product,
      customers: Customer,
      suppliers: Supplier,
      staff: User,
      branches: Branch,
      sales: Sale,
      purchases: Purchase,
      expenses: Expense,
    } as const;

    const maps: Record<string, Map<string, number>> = {};
    await Promise.all(
      Object.entries(models).map(async ([key, Model]) => {
        const rows = await (Model as typeof Product).aggregate([
          { $match: { isDeleted: { $ne: true } } },
          { $group: { _id: '$tenantId', n: { $sum: 1 } } },
        ]);
        maps[key] = new Map(rows.map((r) => [String(r._id), r.n as number]));
      }),
    );

    return tenants.map((t) => {
      const id = String(t._id);
      const counts = Object.fromEntries(
        Object.keys(models).map((key) => [key, maps[key]?.get(id) ?? 0]),
      ) as Record<keyof typeof models, number>;
      return {
        id,
        businessName: t.businessName,
        businessType: t.businessType,
        email: t.email,
        status: t.status,
        createdAt: t.createdAt,
        counts,
      };
    });
  },

  /**
   * Read-only list of a tenant's operational records for the drill-down view.
   * Whitelisted to non-financial entities; transaction/money records (sales,
   * purchases, expenses, debts, payments) are intentionally not listable here.
   * Products expose the selling price and on-hand stock, but not cost/margin.
   */
  async tenantEntityList(tenantId: string, entity: string) {
    const scope = { tenantId, isDeleted: false } as const;

    switch (entity) {
      case 'products': {
        // Prices are financial data — the platform admin sees stock, not price.
        const [products, stock] = await Promise.all([
          Product.find(scope).select('name sku isActive').sort({ name: 1 }).limit(2000).lean().exec(),
          StockLevel.aggregate([
            { $match: { tenantId: new Types.ObjectId(tenantId), isDeleted: { $ne: true } } },
            { $group: { _id: '$productId', qty: { $sum: '$quantity' } } },
          ]),
        ]);
        const stockMap = new Map(stock.map((s) => [String(s._id), s.qty as number]));
        return products.map((p) => ({
          id: String(p._id),
          name: p.name,
          sku: p.sku,
          stock: stockMap.get(String(p._id)) ?? 0,
          isActive: p.isActive,
        }));
      }
      case 'customers':
      case 'suppliers': {
        const rows =
          entity === 'customers'
            ? await Customer.find(scope).select('name email phone isActive').sort({ name: 1 }).limit(2000).lean().exec()
            : await Supplier.find(scope).select('name email phone isActive').sort({ name: 1 }).limit(2000).lean().exec();
        return rows.map((r) => ({
          id: String(r._id),
          name: r.name,
          email: r.email ?? '',
          phone: r.phone ?? '',
          isActive: r.isActive,
        }));
      }
      case 'staff': {
        const rows = await User.find({ tenantId, isDeleted: { $ne: true } })
          .select('name email role isActive')
          .sort({ name: 1 })
          .limit(1000)
          .lean()
          .exec();
        return rows.map((r) => ({
          id: String(r._id),
          name: r.name,
          email: r.email,
          role: r.role,
          isActive: r.isActive,
        }));
      }
      case 'branches': {
        const rows = await Branch.find(scope).select('name code phone isActive').sort({ name: 1 }).limit(1000).lean().exec();
        return rows.map((r) => ({
          id: String(r._id),
          name: r.name,
          code: r.code,
          phone: r.phone ?? '',
          isActive: r.isActive,
        }));
      }
      default:
        throw AppError.badRequest('Unknown or non-listable entity');
    }
  },

  /** The feature catalog plus the set the platform has enabled for a tenant. */
  async getTenantFeatures(
    tenantId: string,
  ): Promise<{ features: typeof FEATURES; enabled: string[] }> {
    const tenant = await Tenant.findById(tenantId).select('enabledFeatures').exec();
    if (!tenant) throw AppError.notFound('Business not found');
    const enabled =
      tenant.enabledFeatures && tenant.enabledFeatures.length > 0
        ? tenant.enabledFeatures
        : [...ALL_FEATURE_KEYS];
    return { features: FEATURES, enabled };
  },

  /** Sets the features the platform enables for a tenant (validated). */
  async setTenantFeatures(tenantId: string, features: string[]): Promise<string[]> {
    const clean = [...new Set(features)].filter((f) => ALL_FEATURE_KEYS.includes(f));
    // Dashboard and support are always available so a business is never locked out.
    for (const required of ['dashboard', 'support']) {
      if (!clean.includes(required)) clean.push(required);
    }
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: { enabledFeatures: clean } },
      { new: true },
    ).exec();
    if (!tenant) throw AppError.notFound('Business not found');
    return clean;
  },

  /**
   * A non-financial operational overview of a tenant. The platform admin can see
   * how a business is structured (staff, branches, catalogue size) but never its
   * money: no sales, revenue, profit, expenses or debt figures are returned.
   */
  async tenantOverview(tenantId: string) {
    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) throw AppError.notFound('Business not found');

    const [staff, branches, products, customers, suppliers, branchDocs] = await Promise.all([
      User.find({ tenantId, isDeleted: false })
        .select('name email role isActive createdAt')
        .sort({ createdAt: 1 })
        .limit(100)
        .lean()
        .exec(),
      Branch.countDocuments({ tenantId, isDeleted: false }).exec(),
      Product.countDocuments({ tenantId, isDeleted: false }).exec(),
      Customer.countDocuments({ tenantId, isDeleted: false }).exec(),
      Supplier.countDocuments({ tenantId, isDeleted: false }).exec(),
      Branch.find({ tenantId, isDeleted: false })
        .select('name code isActive')
        .sort({ createdAt: 1 })
        .limit(100)
        .lean()
        .exec(),
    ]);

    return {
      business: {
        id: tenant._id.toString(),
        businessName: tenant.businessName,
        businessType: tenant.businessType,
        email: tenant.email,
        phone: tenant.phone,
        country: tenant.country,
        timezone: tenant.timezone,
        status: tenant.status,
        createdAt: tenant.createdAt,
      },
      counts: {
        staff: staff.length,
        branches,
        products,
        customers,
        suppliers,
      },
      staff: staff.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
      })),
      branchList: branchDocs.map((b) => ({
        id: String(b._id),
        name: b.name,
        code: b.code,
        isActive: b.isActive,
      })),
    };
  },
};
