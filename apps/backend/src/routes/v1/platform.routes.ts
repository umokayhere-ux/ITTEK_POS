import { Router } from 'express';
import { platformController } from '../../controllers/platform.controller.js';
import { authenticatePlatform } from '../../middlewares/authenticatePlatform.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { platformLoginSchema, rejectTenantSchema } from '../../validators/platform.validator.js';

const router = Router();

router.post('/auth/login', authLimiter, validate(platformLoginSchema), asyncHandler(platformController.login));

// Everything below requires a super admin token.
router.use(authenticatePlatform);
router.get('/me', asyncHandler(platformController.me));
router.get('/stats', asyncHandler(platformController.stats));
router.get('/tenants', asyncHandler(platformController.listTenants));
router.post('/tenants/:id/approve', asyncHandler(platformController.approve));
router.post('/tenants/:id/reject', validate(rejectTenantSchema), asyncHandler(platformController.reject));
router.post('/tenants/:id/suspend', asyncHandler(platformController.suspend));
router.post('/tenants/:id/reactivate', asyncHandler(platformController.reactivate));

export default router;
