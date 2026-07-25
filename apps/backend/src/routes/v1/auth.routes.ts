import { Router } from 'express';
import { authController } from '../../controllers/auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '../../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', authLimiter, validate(refreshSchema), asyncHandler(authController.refresh));
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
