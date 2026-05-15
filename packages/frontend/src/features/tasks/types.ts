export type TaskCategory = 'open' | 'verifying' | 'completed';
export type VerificationMode = 'tee-attestation' | 'hash-commitment' | 'missing';

export type TaskProof = {
  agent: string;
  agentClass: 'native' | 'external' | 'unknown';
  submitted: boolean;
  outputHash: string;
  attestationHex: string;
  attestationText?: string;
  verificationMode: VerificationMode;
  auditPassed?: boolean;
  auditReasons: string[];
};

export type TaskAuditResult = {
  agent?: string;
  passed?: boolean;
  reasons?: string[];
};

export type TaskAuditReport = {
  results?: TaskAuditResult[];
} & Record<string, unknown>;

export type TaskApiTask = {
  id: number;
  poster: string;
  totalPayment: string;
  deadline: string;
  status: number;
  criteriaHash: string;
  criteriaURI: string;
  isSequential: boolean;
  assignedAgents: string[];
  agentStakes: string[];
  submittedCount: number;
  auditReport?: TaskAuditReport | null;
  proofs?: TaskProof[];
};

export type TaskApiResponse = {
  taskCount: number;
  protocol: {
    protocolFeePercent: string;
    defaultDisputeWindow: string;
    slashingJudge: string;
    assignmentEngine: string;
  };
  tasks: TaskApiTask[];
};

export type EscrowTask = {
  id: number;
  poster: `0x${string}`;
  totalPayment: bigint;
  deadline: bigint;
  status: number;
  criteriaHash: `0x${string}`;
  criteriaURI: string;
  isSequential: boolean;
  assignedAgents: `0x${string}`[];
  agentStakes: bigint[];
  submittedCount: number;
  auditReport?: TaskAuditReport | null;
  proofs: TaskProof[];
};
