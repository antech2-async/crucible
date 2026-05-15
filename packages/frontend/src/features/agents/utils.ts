import type { AgentClass, AgentStatus, AgentTelemetry } from './types';

const AGENT_STATUSES: AgentStatus[] = ['idle', 'working', 'slashed', 'offline'];

function normalizeStatus(status: unknown): AgentStatus {
  return AGENT_STATUSES.includes(status as AgentStatus) ? (status as AgentStatus) : 'offline';
}

function normalizeClass(agentClass: unknown): AgentClass {
  return agentClass === 'native' ? 'native' : 'external';
}

export function normalizeAgent(agent: Partial<AgentTelemetry>): AgentTelemetry {
  return {
    id: agent.id || agent.address || 'unknown-agent',
    address: agent.address,
    tier: Number.isFinite(Number(agent.tier)) ? Number(agent.tier) : 0,
    score: Math.max(0, Math.min(1, Number(agent.score) || 0)),
    tasks: Number.isFinite(Number(agent.tasks)) ? Number(agent.tasks) : 0,
    status: normalizeStatus(agent.status),
    window: Array.isArray(agent.window) ? agent.window : [],
    class: normalizeClass(agent.class),
    minStake: agent.minStake,
    capabilities: Array.isArray(agent.capabilities) ? agent.capabilities : [],
  };
}

export function normalizeAgents(payload: unknown): AgentTelemetry[] {
  return Array.isArray(payload) ? payload.map((agent) => normalizeAgent(agent)) : [];
}

export function sortAgentsByTrust(agents: AgentTelemetry[]) {
  return [...agents].sort((a, b) => b.score - a.score);
}

export function rankOfAgent(agent: AgentTelemetry, agents: AgentTelemetry[]) {
  return sortAgentsByTrust(agents).findIndex((item) => item.id === agent.id) + 1;
}

