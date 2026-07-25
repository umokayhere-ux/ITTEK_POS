import { Router } from 'express';
import { cashRegisterController } from '../../controllers/cashRegister.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  cashMovementSchema,
  closeRegisterSchema,
  openRegisterSchema,
} from '../../validators/cashRegister.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(cashRegisterController.list));
router.get('/current', asyncHandler(cashRegisterController.current));
router.post('/open', validate(openRegisterSchema), asyncHandler(cashRegisterController.open));
router.get('/:id/movements', asyncHandler(cashRegisterController.movements));
router.post(
  '/:id/movements',
  validate(cashMovementSchema),
  asyncHandler(cashRegisterController.addMovement),
);
router.post('/:id/close', validate(closeRegisterSchema), asyncHandler(cashRegisterController.close));

export default router;
