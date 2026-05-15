export type AgentStatus = 'idle' | 'working' | 'slashed' | 'offline';
export type AgentClass = 'native' | 'external';

export type AgentTelemetry = {
  id: string;
  address?: string;
  tier: number;
  score: number;
  tasks: number;
  status: AgentStatus;
  window: number[];
  class: AgentClass;
  minStake?: string;
  capabilities?: string[];
};

export type AgentDossierTelemetry = AgentTelemetry & {
  tierLabel?: string;
  slashes?: number;
  registrationTime?: number;
  historyRootHash?: string;
  scoreHistory?: Array<{
    taskIndex: number;
    trustScore: number;
    multiplier: number;
  }>;
  taskHistory?: Array<{
    taskId: number;
    result: number;
  }>;
};

