import { api } from './api';
import type { ApiSuccess } from './types';

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
}

export interface ListResult<T> {
  items: T[];
  meta?: ApiSuccess<T[]>['meta'];
}

/** Generic REST client for a tenant-scoped resource segment (e.g. "products"). */
export function resourceApi<T>(segment: string) {
  const base = `/${segment}`;
  return {
    async list(params: ListParams = {}): Promise<ListResult<T>> {
      const { data } = await api.get<ApiSuccess<T[]>>(base, { params });
      return { items: data.data, meta: data.meta };
    },
    async get(id: string): Promise<T> {
      const { data } = await api.get<ApiSuccess<T>>(`${base}/${id}`);
      return data.data;
    },
    async create(payload: Partial<T>): Promise<T> {
      const { data } = await api.post<ApiSuccess<T>>(base, payload);
      return data.data;
    },
    async update(id: string, payload: Partial<T>): Promise<T> {
      const { data } = await api.patch<ApiSuccess<T>>(`${base}/${id}`, payload);
      return data.data;
    },
    async remove(id: string): Promise<void> {
      await api.delete(`${base}/${id}`);
    },
  };
}
