import { Router } from 'express';
import { SupportTicket, TICKET_STATUS } from '../../models/SupportTicket.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

function ctxOf(req: import('express').Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tickets = await SupportTicket.find({ tenantId: ctxOf(req).tenantId })
      .sort({ updatedAt: -1 })
      .exec();
    sendSuccess(res, tickets, 'Support tickets');
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const ctx = ctxOf(req);
    const { subject, message } = req.body as { subject?: string; message?: string };
    if (!subject || !message) throw AppError.badRequest('Subject and message are required');
    const ticket = await SupportTicket.create({
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      subject,
      status: TICKET_STATUS.OPEN,
      messages: [{ author: 'tenant', body: message, at: new Date() }],
    });
    sendSuccess(res, ticket, 'Ticket created', 201);
  }),
);

router.post(
  '/:id/reply',
  asyncHandler(async (req, res) => {
    const ctx = ctxOf(req);
    const { message } = req.body as { message?: string };
    if (!message) throw AppError.badRequest('Message is required');
    const ticket = await SupportTicket.findOne({ _id: req.params.id, tenantId: ctx.tenantId }).exec();
    if (!ticket) throw AppError.notFound('Ticket not found');
    ticket.messages.push({ author: 'tenant', body: message, at: new Date() });
    ticket.status = TICKET_STATUS.OPEN;
    await ticket.save();
    sendSuccess(res, ticket, 'Reply sent');
  }),
);

export default router;
