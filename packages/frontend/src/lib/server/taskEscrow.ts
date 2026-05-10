import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, TASK_ESCROW_ABI, StorageService, AGENT_REGISTRY_ABI } from '@crucible/shared';
import { setupEthersWorkaround } from '../../../../shared/src/node-utils';
import type { TaskApiResponse, TaskApiTask } from '@/components/TaskEscrowScreen';

export const EMPTY_TASK_ESCROW_SNAPSHOT: TaskApiResponse = {
  taskCount: 0,
  protocol: {
    protocolFeePercent: '',
    defaultDisputeWindow: '',
    slashingJudge: '',
    assignmentEngine: '',
  },
  tasks: [],
};

export async function getTaskEscrowSnapshot(): Promise<TaskApiResponse> {
  setupEthersWorkaround();
  const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const escrow = new ethers.Contract(CONTRACT_ADDRESSES.TASK_ESCROW, TASK_ESCROW_ABI, provider);
  const registry = new ethers.Contract(CONTRACT_ADDRESSES.AGENT_REGISTRY, AGENT_REGISTRY_ABI, provider);
  const storageService = new StorageService(process.env.PRIVATE_KEY!);

  const [taskCountRaw, protocolFeePercent, defaultDisputeWindow, slashingJudge, assignmentEngine] =
    await Promise.all([
      escrow.taskCount(),
      escrow.protocolFeePercent(),
      escrow.defaultDisputeWindow(),
      escrow.slashingJudge(),
      escrow.assignmentEngine(),
    ]);

  const taskCount = Number(taskCountRaw);
  const latestTaskIds = Array.from({ length: Math.min(taskCount, 10) }, (_, index) =>
    BigInt(taskCount - 1 - index),
  );

  const tasks = await Promise.all(
    latestTaskIds.map(async (taskId): Promise<TaskApiTask> => {
      const basic = await escrow.getTaskBasic(taskId);
      const [assignedAgents, agentStakes] = await escrow.getTaskAgents(taskId);

      const submitted = await Promise.all(
        assignedAgents.map((agent: string) => escrow.agentSubmitted(taskId, agent)),
      );
      
      let auditReport = null;
      try {
        // Find audit hash in any of the assigned agents' history
        if (assignedAgents.length > 0) {
            const agentData = await registry.getAgent(assignedAgents[0]);
            const history = await storageService.downloadHistory(agentData.historyRootHash);
            const entry = history.taskHistory.find(h => h.taskId === taskId.toString());
            if (entry && entry.auditReportHash) {
                auditReport = await storageService.downloadJSON(entry.auditReportHash);
            }
        }
      } catch (e) { /* ignore */ }

      return {
        id: Number(taskId),
        poster: basic.poster,
        totalPayment: basic.totalPayment.toString(),
        deadline: basic.deadline.toString(),
        status: Number(basic.status),
        criteriaHash: basic.criteriaHash,
        criteriaURI: basic.criteriaURI,
        isSequential: basic.isSequential,
        assignedAgents,
        agentStakes: agentStakes.map((stake: bigint) => stake.toString()),
        submittedCount: submitted.filter(Boolean).length,
        auditReport,
      };
    }),
  );

  return {
    taskCount,
    protocol: {
      protocolFeePercent: protocolFeePercent.toString(),
      defaultDisputeWindow: defaultDisputeWindow.toString(),
      slashingJudge,
      assignmentEngine,
    },
    tasks,
  };
}
