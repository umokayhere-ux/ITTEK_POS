import type { ClientSession } from 'mongoose';
import { Subscription, type SubscriptionDocument } from '../models/Subscription.js';

export const subscriptionRepository = {
  create(
    data: Partial<SubscriptionDocument>,
    session?: ClientSession,
  ): Promise<SubscriptionDocument> {
    return new Subscription(data).save({ session });
  },
};
