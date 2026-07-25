import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { ApiError, AuthTokens } from './types';
import { authStorage } from './auth-storage';

// In the unified deployment the frontend is served by the backend, so the API
// lives at the same origin under `/api/v1`. For split local dev, set
// NEXT_PUBLIC_API_URL to the backend's full URL (see apps/frontend/.env.example).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Transparently refresh the access token once on a 401, then retry.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{ data: AuthTokens }>(`${API_URL}/auth/refresh`, {
      refreshToken,
    });
    authStorage.setTokens(data.data);
    return data.data.accessToken;
  } catch {
    authStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !(original as { _retried?: boolean })._retried) {
      (original as { _retried?: boolean })._retried = true;
      refreshing ??= refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Normalizes an Axios error into a human-readable message. */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}
