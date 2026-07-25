import { Router } from 'express';
import { saleController } from '../../controllers/sale.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { enforceSubscriptionOnWrite } from '../../middlewares/enforceSubscription.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createSaleSchema } from '../../validators/sale.validator.js';

const router = Router();
router.use(authenticate, enforceSubscriptionOnWrite);

router.post('/', validate(createSaleSchema), asyncHandler(saleController.create));
router.get('/', asyncHandler(saleController.list));
router.get('/:id', asyncHandler(saleController.getById));
router.post('/:id/refund', asyncHandler(saleController.refund));

export default router;
