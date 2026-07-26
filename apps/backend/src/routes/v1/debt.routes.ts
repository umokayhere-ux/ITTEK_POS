import { Router } from 'express';
import { Customer } from '../../models/Customer.js';
import { Debt } from '../../models/Debt.js';
import { PAYMENT_PARTY } from '../../models/Payment.js';
import { Supplier } from '../../models/Supplier.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { enforceSubscriptionOnWrite } from '../../middlewares/enforceSubscription.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate, enforceSubscriptionOnWrite);

function ctxOf(req: import('express').Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

/**
 * Consolidated debts: receivables (customers who owe) and payables (suppliers
 * owed), with totals.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { tenantId } = ctxOf(req);
    const scope = { tenantId, isDeleted: false, outstandingBalance: { $gt: 0 } };
    const [receivables, payables] = await Promise.all([
      Customer.find(scope).select('name phone email outstandingBalance').sort({ outstandingBalance: -1 }).lean().exec(),
      Supplier.find(scope).select('name phone email outstandingBalance').sort({ outstandingBalance: -1 }).lean().exec(),
    ]);
    const sum = (rows: { outstandingBalance: number }[]) =>
      Math.round(rows.reduce((t, r) => t + r.outstandingBalance, 0) * 100) / 100;
    sendSuccess(
      res,
      { receivables, payables, totalReceivable: sum(receivables), totalPayable: sum(payables) },
      'Debts',
    );
  }),
);

/** Manual debt records (with due dates), newest first, joined with party name. */
router.get(
  '/records',
  asyncHandler(async (req, res) => {
    const { tenantId } = ctxOf(req);
    const debts = await Debt.find({ tenantId }).sort({ createdAt: -1 }).limit(200).lean().exec();

    const custIds = debts.filter((d) => d.partyType === 'customer').map((d) => d.partyId);
    const suppIds = debts.filter((d) => d.partyType === 'supplier').map((d) => d.partyId);
    const [custs, supps] = await Promise.all([
      Customer.find({ _id: { $in: custIds } }).select('name').lean().exec(),
      Supplier.find({ _id: { $in: suppIds } }).select('name').lean().exec(),
    ]);
    const names = new Map<string, string>();
    custs.forEach((c) => names.set(String(c._id), c.name));
    supps.forEach((s) => names.set(String(s._id), s.name));

    sendSuccess(
      res,
      debts.map((d) => ({ ...d, partyName: names.get(String(d.partyId)) ?? '—' })),
      'Debt records',
    );
  }),
);

/** Record a new manual debt and increase the party's outstanding balance. */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { tenantId, userId } = ctxOf(req);
    const { partyType, partyId, amount, description, dueDate } = req.body as {
      partyType?: string;
      partyId?: string;
      amount?: number;
      description?: string;
      dueDate?: string;
    };
    if (partyType !== PAYMENT_PARTY.CUSTOMER && partyType !== PAYMENT_PARTY.SUPPLIER) {
      throw AppError.badRequest('partyType must be customer or supplier');
    }
    if (!partyId || typeof amount !== 'number' || amount <= 0) {
      throw AppError.badRequest('A valid partyId and positive amount are required');
    }

    const isCustomer = partyType === PAYMENT_PARTY.CUSTOMER;
    const scope = { _id: partyId, tenantId, isDeleted: false };
    const party = isCustomer
      ? await Customer.findOne(scope).exec()
      : await Supplier.findOne(scope).exec();
    if (!party) throw AppError.notFound(`${partyType} not found`);

    const debt = await Debt.create({
      tenantId,
      partyType,
      partyId,
      amount,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: userId,
    });

    const filter = { _id: partyId, tenantId };
    const inc = { $inc: { outstandingBalance: amount } };
    if (isCustomer) await Customer.updateOne(filter, inc).exec();
    else await Supplier.updateOne(filter, inc).exec();

    sendSuccess(res, debt, 'Debt recorded', 201);
  }),
);

export default router;
