import { Indexer, MemData } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { costTracker } from '../costTracker';
import { AgentHistory, TaskHistoryEntry, TaskCriteria, Criterion } from '@crucible/shared';

export interface TaskResult {
  taskId: string;
  passed: boolean;
  collaborators: string[];
  outputHash: string;
  paymentReceived: string;
}

export class StorageService {
  private indexer: Indexer;
  private signer: ethers.Wallet;
  // Local mapping: bytes32 on-chain hash → original 0G root hash string (Section 8 spec)
  private hashMapping: Map<string, string> = new Map();

  constructor(privateKey: string) {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.indexer = new Indexer(process.env.OG_STORAGE_INDEXER_URL!);
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
    costTracker.recordStorageWrite();

    return { rootHash: rootHash!, bytes32Hash };
  }

  async uploadJSON(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
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
    costTracker.recordStorageWrite();

    return bytes32Hash;
  }

  async downloadJSON<T = any>(rootHashOrBytes32: string): Promise<T> {
    const rootHash = this.hashMapping.get(rootHashOrBytes32) ?? rootHashOrBytes32;
    // @ts-expect-error SDK typing mismatch
    const [data, err] = await this.indexer.download(rootHash);
    if (err) throw new Error(`Download error: ${err}`);

    const jsonString = Buffer.from(data!).toString('utf-8');
    return JSON.parse(jsonString) as T;
  }

  async downloadHistory(rootHashOrBytes32: string): Promise<AgentHistory> {
    return this.downloadJSON<AgentHistory>(rootHashOrBytes32);
  }

  async uploadTaskCriteria(criteria: TaskCriteria): Promise<string> {
    const bytes32Hash = await this.uploadJSON(criteria);
    return this.hashMapping.get(bytes32Hash)!; // returns original rootHash as requested
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
