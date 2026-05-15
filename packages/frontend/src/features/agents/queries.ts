'use client';

import { useQuery } from '@tanstack/react-query';
import type { AgentDossierTelemetry, AgentTelemetry } from './types';
import { normalizeAgent, normalizeAgents } from './utils';
import { apiJson } from '@/lib/api';

export const AGENTS_REFETCH_INTERVAL = 10_000;

export const agentKeys = {
  all: ['agents'] as const,
  list: () => [...agentKeys.all, 'list'] as const,
  detail: (id: string) => [...agentKeys.all, 'detail', id] as const,
};

export async function fetchAgents(): Promise<AgentTelemetry[]> {
  const payload = await apiJson<unknown>('/api/agents');
  return normalizeAgents(payload);
}

export async function fetchAgent(agentId: string): Promise<AgentDossierTelemetry> {
  const payload = await apiJson<Partial<AgentDossierTelemetry>>(`/api/agents/${agentId}`);
  return {
    ...payload,
    ...normalizeAgent(payload),
    slashes: Number.isFinite(Number(payload.slashes)) ? Number(payload.slashes) : 0,
    registrationTime: Number.isFinite(Number(payload.registrationTime))
      ? Number(payload.registrationTime)
      : undefined,
    tierLabel: payload.tierLabel,
    historyRootHash: payload.historyRootHash,
    scoreHistory: Array.isArray(payload.scoreHistory) ? payload.scoreHistory : [],
    taskHistory: Array.isArray(payload.taskHistory) ? payload.taskHistory : [],
  };
}

export function useAgentsQuery() {
  return useQuery<AgentTelemetry[]>({
    queryKey: agentKeys.list(),
    queryFn: fetchAgents,
    refetchInterval: AGENTS_REFETCH_INTERVAL,
    staleTime: 5_000,
  });
}

export function useAgentQuery(agentId: string) {
  return useQuery<AgentDossierTelemetry>({
    queryKey: agentKeys.detail(agentId),
    queryFn: () => fetchAgent(agentId),
    enabled: Boolean(agentId),
    staleTime: 10_000,
  });
}
