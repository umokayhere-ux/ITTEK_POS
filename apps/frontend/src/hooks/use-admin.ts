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

export interface AdminTicket {
  _id: string;
  subject: string;
  status: string;
  businessName: string;
  messages: { author: 'tenant' | 'admin'; body: string; at: string }[];
  updatedAt: string;
}

export function useTickets() {
  return useQuery({
    queryKey: ['platform', 'tickets'],
    queryFn: async () => {
      const { data } = await adminApi.get<ApiSuccess<AdminTicket[]>>('/platform/tickets');
      return data.data;
    },
  });
}

export function useTicketActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['platform', 'tickets'] });
  return {
    reply: useMutation({
      mutationFn: ({ id, message }: { id: string; message: string }) =>
        adminApi.post(`/platform/tickets/${id}/reply`, { message }),
      onSuccess: invalidate,
    }),
    close: useMutation({
      mutationFn: (id: string) => adminApi.post(`/platform/tickets/${id}/close`, {}),
      onSuccess: invalidate,
    }),
  };
}

export interface FeatureDef {
  key: string;
  label: string;
}
export interface TenantFeatures {
  features: FeatureDef[];
  enabled: string[];
}

export function useTenantFeatures(id: string | null) {
  return useQuery({
    queryKey: ['platform', 'tenant-features', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await adminApi.get<ApiSuccess<TenantFeatures>>(`/platform/tenants/${id}/features`);
      return data.data;
    },
  });
}

export function useSetTenantFeatures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, features }: { id: string; features: string[] }) =>
      adminApi.put(`/platform/tenants/${id}/features`, { features }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['platform', 'tenant-features', vars.id] });
    },
  });
}

export interface TenantOverview {
  business: {
    id: string;
    businessName: string;
    businessType: string;
    email: string;
    phone: string;
    country: string;
    timezone: string;
    status: string;
    createdAt: string;
  };
  counts: { staff: number; branches: number; products: number; customers: number; suppliers: number };
  staff: { id: string; name: string; email: string; role: string; isActive: boolean }[];
  branchList: { id: string; name: string; code: string; isActive: boolean }[];
}

export function useTenantOverview(id: string | null) {
  return useQuery({
    queryKey: ['platform', 'tenant-overview', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await adminApi.get<ApiSuccess<TenantOverview>>(`/platform/tenants/${id}/overview`);
      return data.data;
    },
  });
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
