import { Indexer, MemData } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { costTracker } from '../costTracker';

const INDEXER_RPC = process.env.OG_STORAGE_INDEXER_URL!;
const RPC_URL = process.env.OG_RPC_URL!;

export interface AgentHistory {
  agentId: string;
  inftTokenId: number;
  agentClass: 'NATIVE' | 'EXTERNAL';
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

export interface TaskResult {
  taskId: string;
  passed: boolean;
  collaborators: string[];
  outputHash: string;
  paymentReceived: string;
}

export interface TaskCriteria {
  taskId: string;
  requiredCapabilities: string[];
  criteria: Criterion[];
  deadline: number;
}

export interface Criterion {
  fieldName: string;
  operator: 'gte' | 'lte' | 'eq' | 'contains' | 'truthy';
  expectedValue: string;
  weight: number;
}

export class StorageService {
  private indexer: Indexer;
  private signer: ethers.Wallet;
  // Local mapping: bytes32 on-chain hash → original 0G root hash string (Section 8 spec)
  private hashMapping: Map<string, string> = new Map();

  constructor(privateKey: string) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.indexer = new Indexer(INDEXER_RPC);
  }

  async uploadHistory(historyData: AgentHistory): Promise<{ rootHash: string; bytes32Hash: string }> {
    const jsonString = JSON.stringify(historyData);
    const memData = new MemData(Buffer.from(jsonString));

    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree!.rootHash();
    // @ts-expect-error SDK typing mismatch
    const [, uploadErr] = await this.indexer.upload(memData, this.signer);
    if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

    const bytes32Hash = ethers.keccak256(ethers.toUtf8Bytes(rootHash));
    this.hashMapping.set(bytes32Hash, rootHash);
    
    // Track cost (approx 0.001 OG per write based on mock network specs)
    costTracker.addStorageSpend(ethers.parseEther('0.001'));

    return { rootHash: rootHash!, bytes32Hash };
  }

  async downloadHistory(rootHashOrBytes32: string): Promise<AgentHistory> {
    const rootHash = this.hashMapping.get(rootHashOrBytes32) ?? rootHashOrBytes32;
    // @ts-expect-error SDK typing mismatch
    const [data, err] = await this.indexer.download(rootHash);
    if (err) throw new Error(`Download error: ${err}`);

    const jsonString = Buffer.from(data!).toString('utf-8');
    return JSON.parse(jsonString) as AgentHistory;
  }

  async uploadTaskCriteria(criteria: TaskCriteria): Promise<string> {
    const jsonString = JSON.stringify(criteria);
    const memData = new MemData(Buffer.from(jsonString));

    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree!.rootHash();
    // @ts-expect-error SDK typing mismatch
    const [, uploadErr] = await this.indexer.upload(memData, this.signer);
    if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);
    
    costTracker.recordStorageWrite(); // Section 18: ~0.001 OG per write
    return rootHash!;
  }

  async updateAgentHistory(
    existingHash: string,
    taskResult: TaskResult,
  ): Promise<{ newHash: string; updatedHistory: AgentHistory }> {
    const history = await this.downloadHistory(existingHash);

    // Update fields
    history.totalTasks += 1;
    history.updatedAt = Math.floor(Date.now() / 1000);

    if (taskResult.passed) {
      history.completedHonestly += 1;
    } else {
      history.totalSlashEvents += 1;
    }

    // Shift recent window (keep last 10)
    history.recentWindow.push(taskResult.passed ? 1 : 0);
    if (history.recentWindow.length > 10) {
      history.recentWindow.shift();
    }

    // Append to task history
    history.taskHistory.push({
      taskId: taskResult.taskId,
      timestamp: Math.floor(Date.now() / 1000),
      passed: taskResult.passed,
      collaborators: taskResult.collaborators,
      outputHash: taskResult.outputHash,
      paymentReceived: taskResult.paymentReceived,
    });

    // Keep task history at max 100 entries
    if (history.taskHistory.length > 100) {
      history.taskHistory = history.taskHistory.slice(-100);
    }

    const newHashes = await this.uploadHistory(history);
    return { newHash: newHashes.bytes32Hash, updatedHistory: history };
  }
}
