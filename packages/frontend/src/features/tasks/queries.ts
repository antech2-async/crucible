'use client';

import { useQuery } from '@tanstack/react-query';
import type { TaskApiResponse } from './types';

export const TASKS_REFETCH_INTERVAL = 10_000;

export const taskKeys = {
  all: ['tasks'] as const,
  escrowSnapshot: () => [...taskKeys.all, 'escrow-snapshot'] as const,
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json() as Promise<T>;
}

export function fetchTaskEscrowSnapshot() {
  return fetchJson<TaskApiResponse>('/api/tasks');
}

export function useTaskEscrowQuery(initialData?: TaskApiResponse) {
  return useQuery<TaskApiResponse>({
    queryKey: taskKeys.escrowSnapshot(),
    queryFn: fetchTaskEscrowSnapshot,
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
    refetchInterval: TASKS_REFETCH_INTERVAL,
    staleTime: 5_000,
  });
}

