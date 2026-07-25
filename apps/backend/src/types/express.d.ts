import type { AccessTokenPayload } from '../utils/jwt.js';

/**
 * Authenticated request context. Populated by the `authenticate` middleware
 * from the verified access token — never from client-supplied body/query.
 */
export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      token?: AccessTokenPayload;
      platformAdminId?: string;
    }
  }
}

export {};
