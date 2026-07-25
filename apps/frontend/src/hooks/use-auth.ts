'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth-storage';
import type { ApiSuccess, AuthResult, RegisterResult, User } from '@/lib/types';
import type { LoginValues, RegisterValues } from '@/lib/validators';

async function postAuth(path: string, payload: unknown): Promise<AuthResult> {
  const { data } = await api.post<ApiSuccess<AuthResult>>(path, payload);
  return data.data;
}

/**
 * Registration mutation. Businesses start pending approval, so this does NOT
 * start a session — the page shows the returned message and the owner signs in
 * only after a super admin approves.
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (values: RegisterValues): Promise<RegisterResult> => {
      const { data } = await api.post<ApiSuccess<RegisterResult>>('/auth/register', values);
      return data.data;
    },
  });
}

/** Login mutation. */
export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (values: LoginValues) => postAuth('/auth/login', values),
    onSuccess: (result) => {
      authStorage.setSession(result.tokens, result.user);
      router.push('/dashboard');
    },
  });
}

/** Reads the current session from storage and exposes a logout action. */
export function useSession() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, logout };
}
