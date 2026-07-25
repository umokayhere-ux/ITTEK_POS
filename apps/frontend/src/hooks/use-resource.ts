'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resourceApi, type ListParams } from '@/lib/resource-api';

/**
 * Bundles list/create/update/delete TanStack Query hooks for a resource
 * segment. Mutations invalidate the list so tables refresh automatically.
 */
export function createResourceHooks<T extends { id?: string; _id?: string }>(segment: string) {
  const client = resourceApi<T>(segment);
  const key = (params?: ListParams) => [segment, params ?? {}] as const;

  function useList(params: ListParams = {}) {
    return useQuery({
      queryKey: key(params),
      queryFn: () => client.list(params),
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: Partial<T>) => client.create(payload),
      onSuccess: () => qc.invalidateQueries({ queryKey: [segment] }),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<T> }) =>
        client.update(id, payload),
      onSuccess: () => qc.invalidateQueries({ queryKey: [segment] }),
    });
  }

  function useRemove() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => client.remove(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: [segment] }),
    });
  }

  return { client, useList, useCreate, useUpdate, useRemove };
}
