import { Router } from 'express';
import announcementRoutes from './announcement.routes.js';
import auditLogRoutes from './auditLog.routes.js';
import billingRoutes from './billing.routes.js';
import authRoutes from './auth.routes.js';
import cashRegisterRoutes from './cashRegister.routes.js';
import { maintenanceGuard } from '../../middlewares/maintenance.js';
import inventoryRoutes from './inventory.routes.js';
import notificationRoutes from './notification.routes.js';
import paymentRoutes from './payment.routes.js';
import platformRoutes from './platform.routes.js';
import purchaseRoutes from './purchase.routes.js';
import reportRoutes from './report.routes.js';
import saleRoutes from './sale.routes.js';
import settingsRoutes from './settings.routes.js';
import staffRoutes from './staff.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import uploadRoutes from './upload.routes.js';
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

// Block tenant API when the platform is in maintenance mode (platform admin
// routes stay reachable — see the guard's allowlist).
router.use(maintenanceGuard);

router.use('/auth', authRoutes);
router.use('/platform', platformRoutes);
router.use('/announcements', announcementRoutes);
router.use('/staff', staffRoutes);
router.use('/settings', settingsRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/billing', billingRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/uploads', uploadRoutes);
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
