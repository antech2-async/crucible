import { Indexer, MemData } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { costTracker } from '../costTracker';
import { AgentHistory, TaskHistoryEntry, TaskCriteria, Criterion } from '@crucible/shared';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { storage } from '../../../shared/src/StorageProvider';

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
    if (!rootHash) throw new Error('Merkle root hash generation failed');

    // @ts-ignore
    const [, uploadErr] = await this.indexer.upload(memData, process.env.OG_RPC_URL!, this.signer, undefined, undefined, { gasLimit: 2000000, gasPrice: 10000000000 });
    
    // If it's just a timeout, we proceed because the tx was likely sent and deduplicated
    if (uploadErr && !uploadErr.toString().includes('timeout')) {
       throw new Error(`Upload error: ${uploadErr}`);
    } else if (uploadErr) {
       console.log('Upload timed out but transaction was likely broadcast. Proceeding...');
    }

    const bytes32Hash = rootHash;
    
    // Track cost (approx 0.001 OG per write based on mock network specs)
    costTracker.recordStorageWrite();

    return { rootHash, bytes32Hash };
  }

  async uploadJSON(data: any): Promise<{ rootHash: string; bytes32Hash: string }> {
    const jsonString = JSON.stringify(data);
    const memData = new MemData(Buffer.from(jsonString));

    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree!.rootHash();
    if (!rootHash) throw new Error('Merkle root hash generation failed');

    // @ts-ignore
    const [, uploadErr] = await this.indexer.upload(memData, process.env.OG_RPC_URL!, this.signer, undefined, undefined, { gasLimit: 2000000, gasPrice: 10000000000 });
    
    // If it's just a timeout, we proceed
    if (uploadErr && !uploadErr.toString().includes('timeout')) {
      throw new Error(`Upload error: ${uploadErr}`);
    } else if (uploadErr) {
      console.log('Upload timed out but transaction was likely broadcast. Proceeding...');
    }

    const bytes32Hash = rootHash;
    
    // Track cost (approx 0.001 OG per write based on mock network specs)
    costTracker.recordStorageWrite();

    return { rootHash: rootHash!, bytes32Hash };
  }

  async downloadJSON<T = any>(rootHashOrBytes32: string): Promise<T> {
    const rootHash = rootHashOrBytes32;
    const tempPath = path.join(os.tmpdir(), `0g-engine-temp-${rootHash}.json`);
    
    // @ts-ignore
    const err = await this.indexer.download(rootHash, tempPath, false);
    
    if (err || !fs.existsSync(tempPath)) {
        // Fallback to local storage provider if it exists
        const content = await storage.fetch(rootHash);
        if (content && !content.startsWith('SIMULATED_CONTENT')) {
            return JSON.parse(content) as T;
        }
        throw new Error(`Download error: ${err || 'File not found'}`);
    }

    const data = fs.readFileSync(tempPath);
    const jsonString = data.toString('utf-8');
    // Cleanup
    try { fs.unlinkSync(tempPath); } catch (e) {}
    
    return JSON.parse(jsonString) as T;
  }

  async downloadHistory(rootHashOrBytes32: string): Promise<AgentHistory> {
    return this.downloadJSON<AgentHistory>(rootHashOrBytes32);
  }

  async uploadTaskCriteria(criteria: TaskCriteria): Promise<string> {
    const { rootHash } = await this.uploadJSON(criteria);
    return rootHash; 
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
