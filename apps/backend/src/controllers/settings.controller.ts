import type { Request, Response } from 'express';
import { Tenant, type TenantDocument } from '../models/Tenant.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function tenantIdOf(req: Request): string {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.tenantId;
}

function toBusiness(t: TenantDocument) {
  return {
    id: t._id.toString(),
    businessName: t.businessName,
    businessType: t.businessType,
    email: t.email,
    phone: t.phone,
    address: t.address ?? '',
    country: t.country,
    currency: t.currency,
    timezone: t.timezone,
    logoUrl: t.logoUrl ?? '',
    taxNumber: t.taxNumber ?? '',
    receiptHeader: t.receiptHeader ?? '',
    receiptFooter: t.receiptFooter ?? '',
    status: t.status,
  };
}

// Fields a tenant admin may edit on their own business.
const EDITABLE = [
  'businessName',
  'phone',
  'address',
  'currency',
  'timezone',
  'logoUrl',
  'taxNumber',
  'receiptHeader',
  'receiptFooter',
] as const;

export const settingsController = {
  async getBusiness(req: Request, res: Response): Promise<void> {
    const tenant = await Tenant.findById(tenantIdOf(req)).exec();
    if (!tenant) throw AppError.notFound('Business not found');
    sendSuccess(res, toBusiness(tenant), 'Business settings');
  },

  async updateBusiness(req: Request, res: Response): Promise<void> {
    const tenant = await Tenant.findById(tenantIdOf(req)).exec();
    if (!tenant) throw AppError.notFound('Business not found');

    for (const key of EDITABLE) {
      if (req.body[key] !== undefined) {
        (tenant as unknown as Record<string, unknown>)[key] = req.body[key];
      }
    }
    await tenant.save();
    sendSuccess(res, toBusiness(tenant), 'Business settings updated');
  },
};
