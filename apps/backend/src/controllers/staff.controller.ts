import type { Request, Response } from 'express';
import { staffService } from '../services/staff.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function ctxOf(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

export const staffController = {
  async create(req: Request, res: Response): Promise<void> {
    const user = await staffService.create(ctxOf(req), req.body);
    sendSuccess(res, user, 'Staff member created', 201);
  },

  async list(req: Request, res: Response): Promise<void> {
    const users = await staffService.list(ctxOf(req).tenantId);
    sendSuccess(res, users, 'Staff');
  },

  async update(req: Request, res: Response): Promise<void> {
    const user = await staffService.update(ctxOf(req), req.params.id as string, req.body);
    sendSuccess(res, user, 'Staff member updated');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await staffService.remove(ctxOf(req), req.params.id as string);
    sendSuccess(res, { id: req.params.id }, 'Staff member removed');
  },
};
