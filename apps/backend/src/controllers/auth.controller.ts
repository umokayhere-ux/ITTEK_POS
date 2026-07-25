import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { toPublicUser } from '../dtos/auth.dto.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function meta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body, meta(req));
    sendSuccess(res, result, 'Business registered successfully', 201);
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body, meta(req));
    sendSuccess(res, result, 'Logged in successfully');
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const tokens = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, tokens, 'Token refreshed');
  },

  async logout(_req: Request, res: Response): Promise<void> {
    // Stateless JWT logout is handled client-side by discarding tokens. A
    // refresh-token denylist (Redis) lands with the session-management module.
    sendSuccess(res, null, 'Logged out');
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw AppError.unauthorized();
    const user = await userRepository.findById(req.auth.tenantId, req.auth.userId);
    if (!user) throw AppError.notFound('User not found');
    sendSuccess(res, toPublicUser(user), 'Current user');
  },
};
