import {
  ALL_FEATURE_KEYS,
  DEFAULT_ROLE_FEATURES,
  SYSTEM_ROLES,
} from '../constants/index.js';
import { RolePermission } from '../models/RolePermission.js';
import { Tenant } from '../models/Tenant.js';
import { ASSIGNABLE_ROLES } from '../validators/staff.validator.js';

export const permissionService = {
  /** Features the platform has enabled for a tenant (defaults to all). */
  async tenantFeatures(tenantId: string): Promise<string[]> {
    const tenant = await Tenant.findById(tenantId).select('enabledFeatures').lean().exec();
    const enabled = tenant?.enabledFeatures;
    return enabled && enabled.length > 0 ? enabled : [...ALL_FEATURE_KEYS];
  },

  /**
   * Effective feature keys for a user: their role's features intersected with
   * the tenant's platform-enabled features. The owner gets all role-wise but is
   * still limited to what the platform enabled for the business.
   */
  async featuresForRole(tenantId: string, role: string): Promise<string[]> {
    const enabled = new Set(await this.tenantFeatures(tenantId));
    let roleFeatures: string[];
    if (role === SYSTEM_ROLES.OWNER || role === SYSTEM_ROLES.SUPER_ADMIN) {
      roleFeatures = [...ALL_FEATURE_KEYS];
    } else {
      const row = await RolePermission.findOne({ tenantId, role }).exec();
      roleFeatures = row ? row.features : DEFAULT_ROLE_FEATURES[role] ?? ['dashboard', 'support'];
    }
    return roleFeatures.filter((f) => enabled.has(f));
  },

  /** The full matrix (role → features) for the owner's settings screen. */
  async matrix(tenantId: string): Promise<Record<string, string[]>> {
    const rows = await RolePermission.find({ tenantId }).exec();
    const byRole = new Map(rows.map((r) => [r.role, r.features]));
    const result: Record<string, string[]> = {};
    for (const role of ASSIGNABLE_ROLES) {
      result[role] = byRole.get(role) ?? DEFAULT_ROLE_FEATURES[role] ?? ['dashboard', 'support'];
    }
    return result;
  },

  /** Sets the feature list for a role (validates against known features). */
  async setRole(tenantId: string, role: string, features: string[]): Promise<string[]> {
    const clean = [...new Set(features)].filter((f) => ALL_FEATURE_KEYS.includes(f));
    await RolePermission.findOneAndUpdate(
      { tenantId, role },
      { $set: { features: clean } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    return clean;
  },
};
