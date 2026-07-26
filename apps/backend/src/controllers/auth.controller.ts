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

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.forgotPassword(req.body.email);
    sendSuccess(res, null, 'If an account exists, a reset link has been sent.');
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, 'Password reset. You can now sign in.');
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
    const { permissionService } = await import('../services/permission.service.js');
    const features = await permissionService.featuresForRole(req.auth.tenantId, String(user.role));
    sendSuccess(res, { ...toPublicUser(user), features }, 'Current user');
  },

  async setup2fa(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw AppError.unauthorized();
    const { twoFactorService } = await import('../services/twoFactor.service.js');
    const result = await twoFactorService.setup(req.auth.tenantId, req.auth.userId);
    sendSuccess(res, result, 'Scan this in your authenticator app, then enter a code to enable.');
  },

  async enable2fa(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw AppError.unauthorized();
    const { twoFactorService } = await import('../services/twoFactor.service.js');
    await twoFactorService.enable(req.auth.tenantId, req.auth.userId, req.body.token);
    sendSuccess(res, null, 'Two-factor authentication enabled');
  },

  async disable2fa(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw AppError.unauthorized();
    const { twoFactorService } = await import('../services/twoFactor.service.js');
    await twoFactorService.disable(req.auth.tenantId, req.auth.userId, req.body.token);
    sendSuccess(res, null, 'Two-factor authentication disabled');
  },
};
