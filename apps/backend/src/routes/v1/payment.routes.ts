import { Router } from 'express';
import { paymentController } from '../../controllers/payment.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { enforceSubscriptionOnWrite } from '../../middlewares/enforceSubscription.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { recordPaymentSchema } from '../../validators/payment.validator.js';

const router = Router();
router.use(authenticate, enforceSubscriptionOnWrite);

router.get('/', asyncHandler(paymentController.list));
router.post('/', validate(recordPaymentSchema), asyncHandler(paymentController.record));

export default router;
