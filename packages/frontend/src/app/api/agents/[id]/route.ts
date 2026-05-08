import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Indexer } from '@0gfoundation/0g-ts-sdk';
import { AGENT_REGISTRY_ABI, CONTRACT_ADDRESSES } from '@crucible/shared';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { storage } from '../../../../../../../packages/shared/src/StorageProvider';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;

  const provider = new ethers.JsonRpcProvider(
    process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  );
  const indexer = new Indexer(
    process.env.OG_STORAGE_INDEXER_URL || 'https://indexer-storage-testnet-turbo.0g.ai',
  );
  const registry = new ethers.Contract(
    CONTRACT_ADDRESSES.AGENT_REGISTRY,
    AGENT_REGISTRY_ABI,
    provider,
  );

  try {
    const agentData = await registry.getAgent(params.id);
    interface HistoryData {
      recentWindow: number[];
      totalTasks: number;
      completedHonestly: number;
      totalSlashEvents: number;
      avgResponseTimeMs: number;
      taskHistory: any[];
    }
    const buildScoreHistory = (hist: HistoryData) => {
      if (!hist.recentWindow || hist.recentWindow.length === 0) {
        return [{ taskIndex: 1, trustScore: 50, multiplier: 2.5 }];
      }

      let runningScore = 50;
      return hist.recentWindow.map((result: number, i: number) => {
        runningScore = Math.min(100, Math.max(0, runningScore + (result === 1 ? 4 : -8)));
        return {
          taskIndex: i + 1,
          trustScore: runningScore,
          multiplier: parseFloat((2.5 - (runningScore / 100) * 2).toFixed(2)),
        };
      });
    };
    let history: HistoryData = {
      recentWindow: [],
      totalTasks: 0,
      completedHonestly: 0,
      totalSlashEvents: 0,
      avgResponseTimeMs: 0,
      taskHistory: [],
    };

    if (agentData.historyRootHash !== ethers.ZeroHash) {
      let downloadedContent: string | null = null;
      try {
        const tempPath = path.join(
          os.tmpdir(),
          `0g-temp-dossier-${agentData.historyRootHash}.json`,
        );
        const err = await indexer.download(agentData.historyRootHash, tempPath, false);

        if (!err && fs.existsSync(tempPath)) {
          downloadedContent = fs.readFileSync(tempPath).toString('utf-8');
          fs.unlinkSync(tempPath);
        }
      } catch (e) {
        console.debug('Indexer download exception caught, proceeding to local fallback.');
      }

      if (downloadedContent) {
        try {
          const parsed = JSON.parse(downloadedContent);
          if (parsed.recentWindow && parsed.totalTasks !== undefined) {
            history = parsed;
          }
        } catch (e) {
          // ignore
        }
      } else {
        try {
          const content = await storage.fetch(agentData.historyRootHash);
          if (content && !content.startsWith('SIMULATED_CONTENT')) {
            const parsed = JSON.parse(content);
            if (parsed.recentWindow && parsed.totalTasks !== undefined) {
              history = parsed;
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }

    let finalScore = 0;
    if (history.recentWindow && history.recentWindow.length > 0) {
      const lifetimeRate =
        history.totalTasks > 0 ? history.completedHonestly / history.totalTasks : 1.0;
      const recentRate =
        history.recentWindow.length > 0
          ? (history.recentWindow as number[]).reduce((a, b) => a + b, 0) /
            history.recentWindow.length
          : 1.0;

      finalScore = recentRate * 0.6 + lifetimeRate * 0.4;
      const slashPenalty = history.totalSlashEvents ? history.totalSlashEvents * 0.05 : 0;
      finalScore = Math.max(0, Math.min(1, finalScore - slashPenalty));
    } else {
      const totalTasks = Number(agentData.totalTasksCompleted);
      const totalSlashes = Number(agentData.totalSlashEvents);
      const tier = Number(agentData.trustTier);

      if (totalTasks < 3) {
        finalScore = tier === 3 ? 1.0 : tier === 2 ? 0.75 : tier === 1 ? 0.5 : 0.0;
      } else {
        const honestEstimate = totalTasks - totalSlashes;
        const base = honestEstimate / totalTasks;
        finalScore = Math.max(0, Math.min(1, base - totalSlashes * 0.05));
      }
    }

    if (Number(agentData.agentClass) !== 0) {
      finalScore = Math.min(finalScore, 0.85);
    }

    const clampedScore = finalScore;

    const TIER_LABELS = ['Basic', 'Uncommon', 'Rare', 'Epic', 'Mythic'];

    return NextResponse.json({
      id: params.id,
      address: params.id,
      tier: Number(agentData.trustTier),
      tierLabel: TIER_LABELS[Number(agentData.trustTier)] || 'Basic',
      score: clampedScore,
      tasks: Number(agentData.totalTasksCompleted),
      slashes: Number(agentData.totalSlashEvents),
      status: agentData.isActive ? 'idle' : 'offline',
      window: history.recentWindow || [],
      class: Number(agentData.agentClass) === 0 ? 'native' : 'external',
      minStake: ethers.formatEther(agentData.minStakeRequired),
      capabilities: agentData.capabilities,
      registrationTime: Number(agentData.registrationTime),
      historyRootHash: agentData.historyRootHash,
      // For TrustChart — last 20 data points derived from task history
      scoreHistory: buildScoreHistory(history),
      taskHistory: (history.taskHistory || []).slice(-10),
    });
  } catch (error) {
    console.error(`Failed to fetch agent ${params.id}:`, error);
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }
}
