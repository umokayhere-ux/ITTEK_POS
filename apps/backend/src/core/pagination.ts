import type { PaginationMeta } from '../utils/apiResponse.js';

export interface ListQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  search?: string;
}

/** Normalizes raw request query params into safe pagination/sort options. */
export function parseListQuery(raw: Record<string, unknown>): ListQuery {
  const page = Math.max(1, Number(raw.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(raw.limit) || 20));
  const sortBy = typeof raw.sortBy === 'string' && raw.sortBy ? raw.sortBy : 'createdAt';
  const sortOrder = raw.sortOrder === 'asc' ? 1 : -1;
  const search = typeof raw.search === 'string' && raw.search.trim() ? raw.search.trim() : undefined;
  return { page, limit, sortBy, sortOrder, search };
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
