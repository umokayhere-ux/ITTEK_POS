import type { AuditContext } from '../core/BaseRepository.js';
import { Customer } from '../models/Customer.js';
import { Payment, PAYMENT_PARTY, type PaymentParty } from '../models/Payment.js';
import { Supplier } from '../models/Supplier.js';
import { AppError } from '../utils/AppError.js';

interface RecordPaymentInput {
  partyType: PaymentParty;
  partyId: string;
  amount: number;
  method?: string;
  note?: string;
}

export const paymentService = {
  /** Records a payment and reduces the party's outstanding balance. */
  async record(ctx: AuditContext, input: RecordPaymentInput) {
    const isCustomer = input.partyType === PAYMENT_PARTY.CUSTOMER;
    const scope = { _id: input.partyId, tenantId: ctx.tenantId, isDeleted: false };
    const party = isCustomer
      ? await Customer.findOne(scope).exec()
      : await Supplier.findOne(scope).exec();
    if (!party) throw AppError.notFound(`${input.partyType} not found`);

    const payment = await Payment.create({
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
      partyType: input.partyType,
      partyId: input.partyId,
      amount: input.amount,
      method: input.method,
      note: input.note,
    });

    const adjust = { $inc: { outstandingBalance: -input.amount } };
    const filter = { _id: input.partyId, tenantId: ctx.tenantId };
    if (isCustomer) await Customer.updateOne(filter, adjust).exec();
    else await Supplier.updateOne(filter, adjust).exec();

    return payment;
  },

  list(tenantId: string, partyType: string, partyId: string) {
    return Payment.find({ tenantId, partyType, partyId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  },
};
