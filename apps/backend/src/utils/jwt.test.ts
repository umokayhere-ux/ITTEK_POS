import { describe, expect, it } from 'vitest';
import { AppError } from './AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.js';

describe('jwt', () => {
  const claims = { sub: 'user-1', tenantId: 'tenant-1', role: 'owner' };

  it('round-trips an access token', () => {
    const token = signAccessToken(claims);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.tenantId).toBe('tenant-1');
    expect(decoded.type).toBe('access');
  });

  it('round-trips a refresh token', () => {
    const token = signRefreshToken({ sub: 'user-1', tenantId: 'tenant-1' });
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.type).toBe('refresh');
  });

  it('rejects an access token used as a refresh token', () => {
    const token = signAccessToken(claims);
    expect(() => verifyRefreshToken(token)).toThrow(AppError);
  });

  it('rejects a tampered token', () => {
    expect(() => verifyAccessToken('not.a.jwt')).toThrow(AppError);
  });
});
