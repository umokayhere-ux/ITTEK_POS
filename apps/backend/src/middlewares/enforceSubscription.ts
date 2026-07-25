import type { NextFunction, Request, Response } from 'express';
import { Subscription, type SubscriptionDocument } from '../models/Subscription.js';
import { AppError } from '../utils/AppError.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export type EffectiveStatus = 'trialing' | 'active' | 'expired';

/** Computes the effective subscription status, accounting for elapsed dates. */
export function effectiveStatus(sub: SubscriptionDocument | null): EffectiveStatus {
  if (!sub) return 'active'; // no record → treat as active (legacy safety)
  const now = Date.now();
  switch (sub.status) {
    case 'canceled':
    case 'expired':
    case 'past_due':
      return 'expired';
    case 'trialing':
      return sub.trialEndsAt && sub.trialEndsAt.getTime() < now ? 'expired' : 'trialing';
    case 'active':
      return sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < now ? 'expired' : 'active';
    default:
      return 'active';
  }
}

/**
 * Puts a tenant into read-only mode once its subscription has expired: reads
 * (GET) still work, but any create/update/delete is rejected with 402 until the
 * subscription is renewed.
 */
export async function enforceSubscriptionOnWrite(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!WRITE_METHODS.has(req.method) || !req.auth) return next();
  const sub = await Subscription.findOne({ tenantId: req.auth.tenantId }).exec();
  if (effectiveStatus(sub) === 'expired') {
    throw new AppError(
      402,
      'Your subscription has expired. The workspace is read-only until it is renewed.',
    );
  }
  next();
}
