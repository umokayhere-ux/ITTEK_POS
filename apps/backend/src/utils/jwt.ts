import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

export interface AccessTokenPayload {
  sub: string; // userId
  tenantId: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string; // userId
  tenantId: string;
  type: 'refresh';
}

export interface PlatformTokenPayload {
  sub: string; // super admin id
  role: 'super_admin';
  type: 'platform';
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') throw AppError.unauthorized('Invalid token type');
    return decoded;
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') throw AppError.unauthorized('Invalid token type');
    return decoded;
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
}

export function signPlatformToken(payload: Omit<PlatformTokenPayload, 'type' | 'role'>): string {
  return jwt.sign({ ...payload, role: 'super_admin', type: 'platform' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function verifyPlatformToken(token: string): PlatformTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as PlatformTokenPayload;
    if (decoded.type !== 'platform') throw AppError.unauthorized('Invalid token type');
    return decoded;
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}
