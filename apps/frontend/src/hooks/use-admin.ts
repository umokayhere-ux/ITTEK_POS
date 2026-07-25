'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, adminStorage } from '@/lib/admin';
import type { AdminTenant, ApiSuccess, PlatformAdmin, PlatformStats } from '@/lib/types';

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const { data } = await adminApi.post<ApiSuccess<{ admin: PlatformAdmin; token: string }>>(
        '/platform/auth/login',
        creds,
      );
      return data.data;
    },
    onSuccess: (result) => adminStorage.setSession(result.token, result.admin),
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: async () => {
      const { data } = await adminApi.get<ApiSuccess<PlatformStats>>('/platform/stats');
      return data.data;
    },
  });
}

export function usePlatformTenants(status?: string, search?: string) {
  return useQuery({
    queryKey: ['platform', 'tenants', status ?? 'all', search ?? ''],
    queryFn: async () => {
      const { data } = await adminApi.get<ApiSuccess<AdminTenant[]>>('/platform/tenants', {
        params: { status, search: search || undefined, limit: 100 },
      });
      return data.data;
    },
  });
}

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  level: 'info' | 'warning';
  isActive: boolean;
  createdAt: string;
}

export interface PlatformConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['platform', 'announcements'],
    queryFn: async () => {
      const { data } = await adminApi.get<ApiSuccess<Announcement[]>>('/platform/announcements');
      return data.data;
    },
  });
}

export function useAnnouncementActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['platform', 'announcements'] });
  return {
    create: useMutation({
      mutationFn: (input: { title: string; body: string; level: string }) =>
        adminApi.post('/platform/announcements', input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => adminApi.delete(`/platform/announcements/${id}`),
      onSuccess: invalidate,
    }),
  };
}

export function usePlatformConfig() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['platform', 'config'],
    queryFn: async () => {
      const { data } = await adminApi.get<ApiSuccess<PlatformConfig>>('/platform/settings');
      return data.data;
    },
  });
  const update = useMutation({
    mutationFn: (input: Partial<PlatformConfig>) => adminApi.patch('/platform/settings', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform', 'config'] }),
  });
  return { query, update };
}

/** Approve / reject / suspend / reactivate a business. */
export function useTenantAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'approve' | 'reject' | 'suspend' | 'reactivate';
      reason?: string;
    }) => {
      const { data } = await adminApi.post<ApiSuccess<AdminTenant>>(
        `/platform/tenants/${id}/${action}`,
        reason ? { reason } : {},
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['platform', 'stats'] });
    },
  });
}
