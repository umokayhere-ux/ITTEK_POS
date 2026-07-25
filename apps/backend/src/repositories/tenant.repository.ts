import type { ClientSession } from 'mongoose';
import { Tenant, type TenantDocument } from '../models/Tenant.js';

export const tenantRepository = {
  create(data: Partial<TenantDocument>, session?: ClientSession): Promise<TenantDocument> {
    return new Tenant(data).save({ session });
  },

  findBySlug(slug: string): Promise<TenantDocument | null> {
    return Tenant.findOne({ slug }).exec();
  },

  existsBySlug(slug: string): Promise<boolean> {
    return Tenant.exists({ slug }).then((doc) => doc !== null);
  },
};
