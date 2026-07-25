import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, message: 'iTtEk POS API v1', version: '0.1.0' });
});

router.use('/auth', authRoutes);

export default router;
