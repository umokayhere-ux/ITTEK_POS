import {
  BILLING_PERIOD_DAYS,
  PLAN_PRICING,
  SUBSCRIPTION_STATUS,
} from '../constants/index.js';
import { env } from '../config/env.js';
import { appBaseUrl } from '../config/mailer.js';
import { BillingRecord } from '../models/BillingRecord.js';
import { Subscription } from '../models/Subscription.js';
import { Tenant } from '../models/Tenant.js';
import { AppError } from '../utils/AppError.js';

const PAYSTACK_BASE = 'https://api.paystack.co';

function ensureConfigured(): string {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new AppError(501, 'Billing is not configured. Set PAYSTACK_SECRET_KEY.');
  }
  return env.PAYSTACK_SECRET_KEY;
}

export const billingService = {
  plans() {
    return Object.entries(PLAN_PRICING).map(([key, v]) => ({ key, ...v }));
  },

  /** Initializes a Paystack transaction and returns the checkout URL. */
  async initialize(tenantId: string, plan: string): Promise<{ authorizationUrl: string; reference: string }> {
    const secret = ensureConfigured();
    const pricing = PLAN_PRICING[plan];
    if (!pricing) throw AppError.badRequest('Unknown plan');

    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) throw AppError.notFound('Business not found');

    const reference = `sub_${tenantId}_${Date.now()}`;
    await BillingRecord.create({
      tenantId,
      plan,
      amount: pricing.amount,
      currency: tenant.currency,
      reference,
      status: 'pending',
    });

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: tenant.email,
        amount: Math.round(pricing.amount * 100), // subunits
        currency: tenant.currency,
        reference,
        callback_url: `${appBaseUrl()}/billing`,
        metadata: { tenantId, plan },
      }),
    });
    const data = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { authorization_url: string };
    };
    if (!res.ok || !data.status || !data.data) {
      throw AppError.badRequest(data.message || 'Failed to start payment');
    }
    return { authorizationUrl: data.data.authorization_url, reference };
  },

  /** Verifies a Paystack transaction and, on success, activates the plan. */
  async verify(tenantId: string, reference: string) {
    const secret = ensureConfigured();
    const record = await BillingRecord.findOne({ reference, tenantId }).exec();
    if (!record) throw AppError.notFound('Payment reference not found');

    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = (await res.json()) as { status: boolean; data?: { status: string } };
    const paid = data.status && data.data?.status === 'success';

    if (!paid) {
      record.status = 'failed';
      await record.save();
      throw AppError.badRequest('Payment was not successful');
    }

    if (record.status !== 'success') {
      record.status = 'success';
      record.paidAt = new Date();
      await record.save();

      const now = new Date();
      const periodEnd = new Date(now.getTime() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      await Subscription.updateOne(
        { tenantId },
        {
          $set: {
            plan: record.plan,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        },
        { upsert: true },
      ).exec();
    }

    return { plan: record.plan, status: 'active' };
  },

  history(tenantId: string) {
    return BillingRecord.find({ tenantId }).sort({ createdAt: -1 }).limit(50).exec();
  },
};
