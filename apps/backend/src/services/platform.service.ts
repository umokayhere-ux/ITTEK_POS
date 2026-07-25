import { TENANT_STATUS } from '../constants/index.js';
import type { ListQuery } from '../core/pagination.js';
import { Sale, SALE_STATUS } from '../models/Sale.js';
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
};
