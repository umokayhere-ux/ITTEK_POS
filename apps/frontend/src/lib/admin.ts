import axios, { AxiosError } from 'axios';
import type { PlatformAdmin } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
const TOKEN_KEY = 'ittek.adminToken';
const ADMIN_KEY = 'ittek.admin';

/** Session storage for the platform super admin (kept separate from tenant users). */
export const adminStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  getAdmin(): PlatformAdmin | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as PlatformAdmin) : null;
  },
  setSession(token: string, admin: PlatformAdmin): void {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },
  clear(): void {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_KEY);
  },
};

/** Axios instance that attaches the super admin token. */
export const adminApi = axios.create({ baseURL: API_URL });

adminApi.interceptors.request.use((config) => {
  const token = adminStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getAdminErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message;
  }
  return 'Something went wrong.';
}
