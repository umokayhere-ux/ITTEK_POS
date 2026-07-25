import type { AuthTokens, User } from './types';

const ACCESS_KEY = 'ittek.accessToken';
const REFRESH_KEY = 'ittek.refreshToken';
const USER_KEY = 'ittek.user';

/**
 * Thin localStorage wrapper for auth state. Guards against SSR access where
 * `window` is undefined. A production hardening step (httpOnly refresh cookie)
 * is tracked for the session-management module.
 */
export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },

  setSession(tokens: AuthTokens, user: User): void {
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  setTokens(tokens: AuthTokens): void {
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },

  clear(): void {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};
