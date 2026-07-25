import { Router } from 'express';
import { Announcement } from '../../models/Announcement.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Active platform announcements shown to tenant users.
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).exec();
    sendSuccess(res, items, 'Announcements');
  }),
);

export default router;
