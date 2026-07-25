import { Router } from 'express';
import { inventoryController } from '../../controllers/inventory.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  stockAdjustSchema,
  stockMovementSchema,
  stockTransferSchema,
} from '../../validators/inventory.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(inventoryController.levels));
router.get('/logs', asyncHandler(inventoryController.logs));
router.get('/low-stock', asyncHandler(inventoryController.lowStock));
router.post('/stock-in', validate(stockMovementSchema), asyncHandler(inventoryController.stockIn));
router.post('/stock-out', validate(stockMovementSchema), asyncHandler(inventoryController.stockOut));
router.post('/adjust', validate(stockAdjustSchema), asyncHandler(inventoryController.adjust));
router.post('/transfer', validate(stockTransferSchema), asyncHandler(inventoryController.transfer));

export default router;
