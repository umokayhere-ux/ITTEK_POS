import type { AuditContext } from '../core/BaseRepository.js';
import { round2 } from '../core/saleTotals.js';
import { CASH_DIRECTION } from '../models/CashMovement.js';
import { CashMovement } from '../models/CashMovement.js';
import { CashRegister, REGISTER_STATUS, type CashRegisterDocument } from '../models/CashRegister.js';
import { AppError } from '../utils/AppError.js';
import type {
  CashMovementInput,
  CloseRegisterInput,
  OpenRegisterInput,
} from '../validators/cashRegister.validator.js';

export const cashRegisterService = {
  /** Opens a register for a branch. Fails if one is already open there. */
  async open(ctx: AuditContext, input: OpenRegisterInput): Promise<CashRegisterDocument> {
    const existing = await CashRegister.findOne({
      tenantId: ctx.tenantId,
      branchId: input.branchId,
      status: REGISTER_STATUS.OPEN,
      isDeleted: false,
    }).exec();
    if (existing) {
      throw AppError.conflict('A register is already open for this branch');
    }

    return CashRegister.create({
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
      branchId: input.branchId,
      status: REGISTER_STATUS.OPEN,
      openingBalance: input.openingBalance,
      expectedCash: input.openingBalance,
      openedAt: new Date(),
    });
  },

  async addMovement(
    ctx: AuditContext,
    registerId: string,
    input: CashMovementInput,
  ): Promise<CashRegisterDocument> {
    const register = await CashRegister.findOne({
      _id: registerId,
      tenantId: ctx.tenantId,
      isDeleted: false,
    }).exec();
    if (!register) throw AppError.notFound('Register not found');
    if (register.status !== REGISTER_STATUS.OPEN) {
      throw AppError.badRequest('Register is closed');
    }

    await CashMovement.create({
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
      registerId: register._id,
      direction: input.direction,
      amount: input.amount,
      reason: input.reason,
    });

    const delta = input.direction === CASH_DIRECTION.IN ? input.amount : -input.amount;
    register.expectedCash = round2(register.expectedCash + delta);
    register.updatedBy = ctx.userId as unknown as CashRegisterDocument['updatedBy'];
    await register.save();
    return register;
  },

  async close(
    ctx: AuditContext,
    registerId: string,
    input: CloseRegisterInput,
  ): Promise<CashRegisterDocument> {
    const register = await CashRegister.findOne({
      _id: registerId,
      tenantId: ctx.tenantId,
      isDeleted: false,
    }).exec();
    if (!register) throw AppError.notFound('Register not found');
    if (register.status !== REGISTER_STATUS.OPEN) {
      throw AppError.badRequest('Register is already closed');
    }

    register.countedCash = input.countedCash;
    register.difference = round2(input.countedCash - register.expectedCash);
    register.status = REGISTER_STATUS.CLOSED;
    register.closedAt = new Date();
    register.closedBy = ctx.userId as unknown as CashRegisterDocument['closedBy'];
    register.updatedBy = ctx.userId as unknown as CashRegisterDocument['updatedBy'];
    await register.save();
    return register;
  },

  currentForBranch(tenantId: string, branchId: string): Promise<CashRegisterDocument | null> {
    return CashRegister.findOne({
      tenantId,
      branchId,
      status: REGISTER_STATUS.OPEN,
      isDeleted: false,
    }).exec();
  },
};
