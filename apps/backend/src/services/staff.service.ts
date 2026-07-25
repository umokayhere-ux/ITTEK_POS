import type { AuditContext } from '../core/BaseRepository.js';
import { toPublicUser, type PublicUser } from '../dtos/auth.dto.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import type { CreateStaffInput, UpdateStaffInput } from '../validators/staff.validator.js';

export const staffService = {
  async create(ctx: AuditContext, input: CreateStaffInput): Promise<PublicUser> {
    const exists = await User.exists({ tenantId: ctx.tenantId, email: input.email });
    if (exists) throw AppError.conflict('A user with this email already exists');

    const user = await User.create({
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      branchIds: input.branchIds ?? [],
      isActive: true,
    });
    return toPublicUser(user);
  },

  async list(tenantId: string): Promise<PublicUser[]> {
    const users = await User.find({ tenantId, isDeleted: false }).sort({ createdAt: -1 }).exec();
    return users.map(toPublicUser);
  },

  async update(ctx: AuditContext, id: string, input: UpdateStaffInput): Promise<PublicUser> {
    const user = await User.findOne({ _id: id, tenantId: ctx.tenantId, isDeleted: false }).exec();
    if (!user) throw AppError.notFound('Staff member not found');
    // The owner account cannot be demoted/edited through staff management.
    if (user.role === 'owner') throw AppError.forbidden('The owner account cannot be modified here');

    if (input.name !== undefined) user.name = input.name;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.role !== undefined) user.role = input.role;
    if (input.branchIds !== undefined) {
      user.branchIds = input.branchIds as unknown as typeof user.branchIds;
    }
    if (input.isActive !== undefined) user.isActive = input.isActive;
    user.updatedBy = ctx.userId as unknown as typeof user.updatedBy;
    await user.save();
    return toPublicUser(user);
  },

  async remove(ctx: AuditContext, id: string): Promise<void> {
    const user = await User.findOne({ _id: id, tenantId: ctx.tenantId, isDeleted: false }).exec();
    if (!user) throw AppError.notFound('Staff member not found');
    if (user.role === 'owner') throw AppError.forbidden('The owner account cannot be removed');
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false;
    user.updatedBy = ctx.userId as unknown as typeof user.updatedBy;
    await user.save();
  },
};
