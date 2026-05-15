import type { EscrowTask, TaskApiTask } from './types';

export function normalizeTask(task: TaskApiTask): EscrowTask {
  return {
    id: task.id,
    poster: task.poster as `0x${string}`,
    totalPayment: BigInt(task.totalPayment),
    deadline: BigInt(task.deadline),
    status: task.status,
    criteriaHash: task.criteriaHash as `0x${string}`,
    criteriaURI: task.criteriaURI,
    isSequential: task.isSequential,
    assignedAgents: task.assignedAgents as `0x${string}`[],
    agentStakes: task.agentStakes.map((stake) => BigInt(stake)),
    submittedCount: task.submittedCount,
    auditReport: task.auditReport,
    proofs: task.proofs ?? [],
  };
}

export function normalizeTasks(tasks: TaskApiTask[] = []): EscrowTask[] {
  return tasks.map(normalizeTask);
}

