import { Router } from 'express';
import { Subscription } from '../../models/Subscription.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { effectiveStatus } from '../../middlewares/enforceSubscription.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

const DAY = 24 * 60 * 60 * 1000;

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.auth) throw AppError.unauthorized();
    const sub = await Subscription.findOne({ tenantId: req.auth.tenantId }).exec();
    const status = effectiveStatus(sub);
    const endsAt = sub?.status === 'trialing' ? sub?.trialEndsAt : sub?.currentPeriodEnd;
    const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / DAY)) : null;

    sendSuccess(
      res,
      {
        plan: sub?.plan ?? 'trial',
        status,
        trialEndsAt: sub?.trialEndsAt ?? null,
        currentPeriodEnd: sub?.currentPeriodEnd ?? null,
        daysLeft,
        readOnly: status === 'expired',
      },
      'Subscription',
    );
  }),
);

export default router;
