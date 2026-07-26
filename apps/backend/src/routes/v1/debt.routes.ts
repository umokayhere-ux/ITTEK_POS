import { Router } from 'express';
import { Customer } from '../../models/Customer.js';
import { Supplier } from '../../models/Supplier.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

/**
 * Consolidated debts: receivables (customers who owe the business) and payables
 * (suppliers the business owes), with totals.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.auth) throw AppError.unauthorized();
    const tenantId = req.auth.tenantId;
    const scope = { tenantId, isDeleted: false, outstandingBalance: { $gt: 0 } };

    const [receivables, payables] = await Promise.all([
      Customer.find(scope).select('name phone email outstandingBalance').sort({ outstandingBalance: -1 }).lean().exec(),
      Supplier.find(scope).select('name phone email outstandingBalance').sort({ outstandingBalance: -1 }).lean().exec(),
    ]);

    const sum = (rows: { outstandingBalance: number }[]) =>
      Math.round(rows.reduce((t, r) => t + r.outstandingBalance, 0) * 100) / 100;

    sendSuccess(
      res,
      {
        receivables,
        payables,
        totalReceivable: sum(receivables),
        totalPayable: sum(payables),
      },
      'Debts',
    );
  }),
);

export default router;
