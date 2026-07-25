import { Router } from 'express';
import { reportController } from '../../controllers/report.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/sales-summary', asyncHandler(reportController.salesSummary));
router.get('/top-products', asyncHandler(reportController.topProducts));
router.get('/profit-loss', asyncHandler(reportController.profitLoss));

export default router;
