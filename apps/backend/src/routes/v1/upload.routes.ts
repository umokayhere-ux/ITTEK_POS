import express, { Router } from 'express';
import { uploadController } from '../../controllers/upload.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { enforceSubscriptionOnWrite } from '../../middlewares/enforceSubscription.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Images arrive as base64 data URIs, so allow a larger body on this route only.
router.use(authenticate, enforceSubscriptionOnWrite);
router.post('/image', express.json({ limit: '8mb' }), asyncHandler(uploadController.image));

export default router;
