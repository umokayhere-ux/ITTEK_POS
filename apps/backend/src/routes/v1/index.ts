import { Router } from 'express';
import authRoutes from './auth.routes.js';
import inventoryRoutes from './inventory.routes.js';
import { resourceRouters } from './resources.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'iTtEk POS API v1',
    version: '0.1.0',
    resources: ['auth', 'inventory', ...Object.keys(resourceRouters)],
  });
});

router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);

// Mount each tenant-scoped resource under its segment (e.g. /products).
for (const [segment, resourceRouter] of Object.entries(resourceRouters)) {
  router.use(`/${segment}`, resourceRouter);
}

export default router;
