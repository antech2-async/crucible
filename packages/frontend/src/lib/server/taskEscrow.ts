import { ethers, type BytesLike } from 'ethers';
import { CONTRACT_ADDRESSES, TASK_ESCROW_ABI, AGENT_REGISTRY_ABI } from '@crucible/shared';
import { StorageService } from '../../../../shared/src/StorageService';
import { setupEthersWorkaround } from '../../../../shared/src/node-utils';
import type { TaskApiResponse, TaskApiTask, TaskProof } from '@/features/tasks/types';

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
  const registry = new ethers.Contract(
    CONTRACT_ADDRESSES.AGENT_REGISTRY,
    AGENT_REGISTRY_ABI,
    provider,
  );
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
      const agentList = Array.from(assignedAgents as string[]);

      const submitted = await Promise.all(
        agentList.map((agent: string) => escrow.agentSubmitted(taskId, agent)),
      );

      let auditReport = null;
      try {
        // Find audit hash in any of the assigned agents' history
        if (agentList.length > 0) {
          const agentData = await registry.getAgent(agentList[0]);
          const history = await storageService.downloadHistory(agentData.historyRootHash);
          const entry = history.taskHistory.find((h) => h.taskId === taskId.toString());
          if (entry && entry.auditReportHash) {
            auditReport = await storageService.downloadJSON(entry.auditReportHash);
          }
        }
      } catch (e) {
        /* ignore */
      }

      const auditResults = Array.isArray(auditReport?.results) ? auditReport.results : [];
      const proofs = await Promise.all(
        agentList.map(async (agent, index): Promise<TaskProof> => {
          const [outputHash, attestationHex, agentClass] = await Promise.all([
            readOutputHash(escrow, taskId, agent),
            readAttestationHex(escrow, taskId, agent),
            readAgentClass(registry, agent),
          ]);
          const auditResult = auditResults.find(
            (result: any) => result?.agent?.toLowerCase?.() === agent.toLowerCase(),
          );
          const hasAttestation = hasBytes(attestationHex);
          const verificationMode =
            submitted[index] && hasAttestation && agentClass === 'native'
              ? 'tee-attestation'
              : submitted[index] && outputHash
                ? 'hash-commitment'
                : 'missing';

          return {
            agent,
            agentClass,
            submitted: Boolean(submitted[index]),
            outputHash,
            attestationHex,
            attestationText: decodeAttestation(attestationHex),
            verificationMode,
            auditPassed: typeof auditResult?.passed === 'boolean' ? auditResult.passed : undefined,
            auditReasons: Array.isArray(auditResult?.reasons) ? auditResult.reasons : [],
          };
        }),
      );

      return {
        id: Number(taskId),
        poster: basic.poster,
        totalPayment: basic.totalPayment.toString(),
        deadline: basic.deadline.toString(),
        status: Number(basic.status),
        criteriaHash: basic.criteriaHash,
        criteriaURI: basic.criteriaURI,
        isSequential: basic.isSequential,
        assignedAgents: agentList,
        agentStakes: agentStakes.map((stake: bigint) => stake.toString()),
        submittedCount: submitted.filter(Boolean).length,
        auditReport,
        proofs,
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

async function readOutputHash(escrow: ethers.Contract, taskId: bigint, agent: string) {
  try {
    return (await escrow.agentOutputHashes(taskId, agent)) as string;
  } catch {
    return '';
  }
}

async function readAttestationHex(escrow: ethers.Contract, taskId: bigint, agent: string) {
  try {
    return normalizeBytes(await escrow.agentAttestations(taskId, agent));
  } catch {
    return '0x';
  }
}

async function readAgentClass(
  registry: ethers.Contract,
  agent: string,
): Promise<TaskProof['agentClass']> {
  try {
    const agentData = await registry.getAgent(agent);
    return Number(agentData.agentClass) === 0 ? 'native' : 'external';
  } catch {
    return 'unknown';
  }
}

function normalizeBytes(value: unknown) {
  if (typeof value === 'string') return value || '0x';
  try {
    return ethers.hexlify(value as BytesLike);
  } catch {
    return '0x';
  }
}

function hasBytes(hex: string) {
  return Boolean(hex && hex !== '0x' && hex.length > 2);
}

function decodeAttestation(hex: string) {
  if (!hasBytes(hex)) return undefined;

  try {
    const text = ethers.toUtf8String(hex);
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}
