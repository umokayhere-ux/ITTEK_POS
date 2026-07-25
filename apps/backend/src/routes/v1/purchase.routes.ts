import { Router } from 'express';
import { purchaseController } from '../../controllers/purchase.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createPurchaseSchema } from '../../validators/purchase.validator.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(createPurchaseSchema), asyncHandler(purchaseController.create));
router.get('/', asyncHandler(purchaseController.list));
router.get('/:id', asyncHandler(purchaseController.getById));

export default router;
