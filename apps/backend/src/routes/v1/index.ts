import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cashRegisterRoutes from './cashRegister.routes.js';
import inventoryRoutes from './inventory.routes.js';
import paymentRoutes from './payment.routes.js';
import platformRoutes from './platform.routes.js';
import purchaseRoutes from './purchase.routes.js';
import reportRoutes from './report.routes.js';
import saleRoutes from './sale.routes.js';
import settingsRoutes from './settings.routes.js';
import staffRoutes from './staff.routes.js';
import { resourceRouters } from './resources.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'iTtEk POS API v1',
    version: '0.1.0',
    resources: [
      'auth',
      'platform',
      'staff',
      'settings',
      'inventory',
      'sales',
      'payments',
      'purchases',
      'cash-registers',
      'reports',
      ...Object.keys(resourceRouters),
    ],
  });
});

router.use('/auth', authRoutes);
router.use('/platform', platformRoutes);
router.use('/staff', staffRoutes);
router.use('/settings', settingsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', saleRoutes);
router.use('/payments', paymentRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/cash-registers', cashRegisterRoutes);
router.use('/reports', reportRoutes);

// Mount each tenant-scoped resource under its segment (e.g. /products).
for (const [segment, resourceRouter] of Object.entries(resourceRouters)) {
  router.use(`/${segment}`, resourceRouter);
}

export default router;
