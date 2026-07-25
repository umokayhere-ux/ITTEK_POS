import { Router } from 'express';
import { SYSTEM_ROLES } from '../../constants/index.js';
import { settingsController } from '../../controllers/settings.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { enforceSubscriptionOnWrite } from '../../middlewares/enforceSubscription.js';
import { requireRole } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { updateBusinessSchema } from '../../validators/settings.validator.js';

const router = Router();
router.use(authenticate, enforceSubscriptionOnWrite);

// Any authenticated user may read business settings (needed for receipts);
// only owners/managers may change them.
router.get('/business', asyncHandler(settingsController.getBusiness));
router.patch(
  '/business',
  requireRole(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.BRANCH_MANAGER),
  validate(updateBusinessSchema),
  asyncHandler(settingsController.updateBusiness),
);

export default router;
