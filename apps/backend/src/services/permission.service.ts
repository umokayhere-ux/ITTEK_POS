import {
  ALL_FEATURE_KEYS,
  DEFAULT_ROLE_FEATURES,
  SYSTEM_ROLES,
} from '../constants/index.js';
import { RolePermission } from '../models/RolePermission.js';
import { ASSIGNABLE_ROLES } from '../validators/staff.validator.js';

export const permissionService = {
  /** Effective feature keys for a user's role (owner → everything). */
  async featuresForRole(tenantId: string, role: string): Promise<string[]> {
    if (role === SYSTEM_ROLES.OWNER || role === SYSTEM_ROLES.SUPER_ADMIN) {
      return [...ALL_FEATURE_KEYS];
    }
    const row = await RolePermission.findOne({ tenantId, role }).exec();
    if (row) return row.features;
    return DEFAULT_ROLE_FEATURES[role] ?? ['dashboard', 'support'];
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
