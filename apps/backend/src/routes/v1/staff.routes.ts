import { Router } from 'express';
import { SYSTEM_ROLES } from '../../constants/index.js';
import { staffController } from '../../controllers/staff.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createStaffSchema, updateStaffSchema } from '../../validators/staff.validator.js';

const router = Router();

// Only owners and managers can manage staff.
router.use(authenticate, requireRole(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.BRANCH_MANAGER));

router.get('/', asyncHandler(staffController.list));
router.post('/', validate(createStaffSchema), asyncHandler(staffController.create));
router.patch('/:id', validate(updateStaffSchema), asyncHandler(staffController.update));
router.delete('/:id', asyncHandler(staffController.remove));

export default router;
