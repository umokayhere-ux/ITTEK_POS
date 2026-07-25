import type { Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function ctxOf(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

export const paymentController = {
  async record(req: Request, res: Response): Promise<void> {
    const payment = await paymentService.record(ctxOf(req), req.body);
    sendSuccess(res, payment, 'Payment recorded', 201);
  },

  async list(req: Request, res: Response): Promise<void> {
    const ctx = ctxOf(req);
    const partyType = String(req.query.partyType ?? '');
    const partyId = String(req.query.partyId ?? '');
    if (!partyType || !partyId) throw AppError.badRequest('partyType and partyId are required');
    const items = await paymentService.list(ctx.tenantId, partyType, partyId);
    sendSuccess(res, items, 'Payments');
  },
};
