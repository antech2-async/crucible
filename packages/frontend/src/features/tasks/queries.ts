'use client';

import { useQuery } from '@tanstack/react-query';
import type { TaskApiResponse } from './types';
import { apiJson } from '@/lib/api';

export const TASKS_REFETCH_INTERVAL = 10_000;

export const taskKeys = {
  all: ['tasks'] as const,
  escrowSnapshot: () => [...taskKeys.all, 'escrow-snapshot'] as const,
};

export function fetchTaskEscrowSnapshot() {
  return apiJson<TaskApiResponse>('/api/tasks');
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
