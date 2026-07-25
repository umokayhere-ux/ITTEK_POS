import { Schema, model, type Document, type Types } from 'mongoose';
import {
  PLANS,
  SUBSCRIPTION_STATUS,
  type Plan,
  type SubscriptionStatus,
} from '../constants/index.js';
import { tenantScopedSchemaFields, type TenantScopedFields } from './baseFields.js';

export interface SubscriptionDocument extends Document<Types.ObjectId>, TenantScopedFields {
  plan: Plan;
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd?: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    ...tenantScopedSchemaFields,
    plan: { type: String, enum: Object.values(PLANS), default: PLANS.TRIAL },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.TRIALING,
    },
    trialEndsAt: { type: Date },
    currentPeriodStart: { type: Date, default: () => new Date() },
    currentPeriodEnd: { type: Date },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true },
);

subscriptionSchema.index({ tenantId: 1 }, { unique: true });

export const Subscription = model<SubscriptionDocument>('Subscription', subscriptionSchema);
