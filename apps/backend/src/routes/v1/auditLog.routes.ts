import { Router } from 'express';
import { SYSTEM_ROLES } from '../../constants/index.js';
import { buildMeta, parseListQuery } from '../../core/pagination.js';
import { AuditLog } from '../../models/AuditLog.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/authorize.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();

router.use(
  authenticate,
  requireRole(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.BRANCH_MANAGER, SYSTEM_ROLES.AUDITOR),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.auth) throw AppError.unauthorized();
    const q = parseListQuery(req.query as Record<string, unknown>);
    const filter = { tenantId: req.auth.tenantId };
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .exec(),
      AuditLog.countDocuments(filter).exec(),
    ]);
    sendSuccess(res, items, 'Audit logs', 200, buildMeta(q.page, q.limit, total));
  }),
);

export default router;
