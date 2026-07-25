import { Router } from 'express';
import { notificationService } from '../../services/notification.service.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

function tenantId(req: import('express').Request): string {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.tenantId;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [items, unread] = await Promise.all([
      notificationService.list(tenantId(req)),
      notificationService.unreadCount(tenantId(req)),
    ]);
    sendSuccess(res, { items, unread }, 'Notifications');
  }),
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationService.markAllRead(tenantId(req));
    sendSuccess(res, null, 'All marked read');
  }),
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await notificationService.markRead(tenantId(req), req.params.id as string);
    sendSuccess(res, null, 'Marked read');
  }),
);

export default router;
