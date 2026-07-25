import type { ClientSession, Types } from 'mongoose';
import { User, type UserDocument } from '../models/User.js';

export const userRepository = {
  create(data: Partial<UserDocument>, session?: ClientSession): Promise<UserDocument> {
    return new User(data).save({ session });
  },

  /** Looks up a user by email within a single tenant. Includes passwordHash. */
  findByEmailWithSecret(
    tenantId: Types.ObjectId | string,
    email: string,
  ): Promise<UserDocument | null> {
    return User.findOne({ tenantId, email, isDeleted: false })
      .select('+passwordHash')
      .exec();
  },

  /** Finds the first tenant an email belongs to (used to resolve login tenant). */
  findByEmailAnyTenantWithSecret(email: string): Promise<UserDocument | null> {
    return User.findOne({ email, isDeleted: false }).select('+passwordHash').exec();
  },

  findById(
    tenantId: Types.ObjectId | string,
    id: Types.ObjectId | string,
  ): Promise<UserDocument | null> {
    return User.findOne({ _id: id, tenantId, isDeleted: false }).exec();
  },

  existsByEmail(tenantId: Types.ObjectId | string, email: string): Promise<boolean> {
    return User.exists({ tenantId, email }).then((doc) => doc !== null);
  },

  touchLastLogin(id: Types.ObjectId | string): Promise<unknown> {
    return User.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } }).exec();
  },
};
