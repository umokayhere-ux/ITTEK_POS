import { Router } from 'express';
import { SYSTEM_ROLES } from '../../constants/index.js';
import { billingService } from '../../services/billing.service.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/authorize.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

function tenantId(req: import('express').Request): string {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.tenantId;
}

router.get(
  '/plans',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, billingService.plans(), 'Plans');
  }),
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    sendSuccess(res, await billingService.history(tenantId(req)), 'Billing history');
  }),
);

// Only owners/managers can start or confirm payments.
router.post(
  '/initialize',
  requireRole(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.BRANCH_MANAGER),
  asyncHandler(async (req, res) => {
    const result = await billingService.initialize(tenantId(req), req.body.plan);
    sendSuccess(res, result, 'Payment initialized');
  }),
);

router.post(
  '/verify',
  requireRole(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.BRANCH_MANAGER),
  asyncHandler(async (req, res) => {
    const result = await billingService.verify(tenantId(req), req.body.reference);
    sendSuccess(res, result, 'Payment verified');
  }),
);

export default router;
