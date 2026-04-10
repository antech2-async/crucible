/* eslint-disable @typescript-eslint/no-explicit-any */
export enum TaskStatus {
  OPEN = 0,
  ASSIGNED = 1,
  VERIFYING = 2,
  COMPLETED = 3,
  DISPUTED = 4,
  FAILED = 5,
}

export interface AgentHistory {
  agentId: string;
  inftTokenId: number;
  version: number;
  updatedAt: number;
  totalTasks: number;
  completedHonestly: number;
  totalSlashEvents: number;
  totalDisputes: number;
  recentWindow: number[]; // last 10 results (0 or 1)
  avgResponseTimeMs: number;
  taskHistory: TaskHistoryEntry[];
}

export interface TaskHistoryEntry {
  taskId: string;
  timestamp: number;
  passed: boolean;
  collaborators: string[];
  outputHash: string;
  paymentReceived: string;
}

export interface Criterion {
  fieldName: string;
  operator: 'gte' | 'lte' | 'eq' | 'contains' | 'truthy';
  expectedValue: string;
  weight: number;
}

export interface TaskCriteria {
  taskId: string;
  requiredCapabilities: string[];
  criteria: Criterion[];
  deadline: number;
}

export interface VerifiedInferenceResult {
  taskId: string;
  agentId: string;
  output: string;
  attestation: any;
  model: string;
  timestamp: number;
  verified: boolean;
}
