import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Indexer } from '@0gfoundation/0g-ts-sdk';
import { AGENT_REGISTRY_ABI, CONTRACT_ADDRESSES } from '@crucible/shared';
import { FetchRequest } from 'ethers';
import axios from 'axios';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { storage } from '../../../../../../packages/shared/src/StorageProvider';

// 1. Disable global fetch to force ethers to use our custom fetcher
try {
  // @ts-expect-error - Forcefully nulling fetch to workaround undici bug
  global.fetch = undefined;
} catch (e) {
  // Silently continue if fetch is already undefined or immutable
}

// 2. Register Axios as the global fetcher for Ethers v6
FetchRequest.registerGetUrl(async (req) => {
  const response = await axios({
    url: req.url,
    method: req.method,
    data: req.body ? Buffer.from(req.body) : undefined,
    headers: req.headers,
    responseType: 'arraybuffer',
  });
  return {
    statusCode: response.status,
    statusMessage: response.statusText,
    headers: response.headers as Record<string, string>,
    body: new Uint8Array(response.data),
  };
});

export const dynamic = 'force-dynamic';

export async function GET() {
  const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const indexerUrl =
    process.env.OG_STORAGE_INDEXER_URL || 'https://indexer-storage-testnet-turbo.0g.ai';

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const registry = new ethers.Contract(
    CONTRACT_ADDRESSES.AGENT_REGISTRY,
    AGENT_REGISTRY_ABI,
    provider,
  );

  const indexer = new Indexer(indexerUrl);

  try {
    const agentAddresses = await registry.getAgentList();

    const agents = await Promise.all(
      agentAddresses.map(async (addr: string) => {
        try {
          const agentData = await registry.getAgent(addr);

          const tier = Number(agentData.trustTier);
          const totalTasks = Number(agentData.totalTasksCompleted);
          const totalSlashes = Number(agentData.totalSlashEvents);

          let history: any = {
            recentWindow: [],
            totalTasks,
            completedHonestly: totalTasks - totalSlashes,
            totalSlashEvents: totalSlashes,
            avgResponseTimeMs: 0,
            taskHistory: [],
          };

          if (agentData.historyRootHash !== ethers.ZeroHash) {
            let downloadedContent: string | null = null;
            try {
              // Correct 0G SDK usage: download(hash, path, verify)
              const tempPath = path.join(os.tmpdir(), `0g-temp-${agentData.historyRootHash}.json`);
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
                // ignore parse errors
              }
            } else {
              // Fallback to Local Mock Storage if indexer fails or throws
              try {
                const content = await storage.fetch(agentData.historyRootHash);
                if (content && !content.startsWith('SIMULATED_CONTENT')) {
                  const parsed = JSON.parse(content);
                  if (parsed.recentWindow && parsed.totalTasks !== undefined) {
                    history = parsed;
                  }
                } else {
                  console.debug('Indexer download failed, falling back to registry inference');
                }
              } catch (e) {
                console.debug('Indexer download failed, falling back to registry inference');
              }
            }
          }

          // If history was successfully downloaded from storage with tasks, calculate exact score
          let finalScore = 0;
          if (history.recentWindow && history.recentWindow.length > 0) {
            const lifetimeRate =
              history.totalTasks > 0 ? history.completedHonestly / history.totalTasks : 1.0;
            const recentRate =
              history.recentWindow.length > 0
                ? history.recentWindow.reduce((a: number, b: number) => a + b, 0) /
                  history.recentWindow.length
                : 1.0;

            finalScore = recentRate * 0.6 + lifetimeRate * 0.4;
            const slashPenalty = history.totalSlashEvents ? history.totalSlashEvents * 0.05 : 0;
            finalScore = Math.max(0, Math.min(1, finalScore - slashPenalty));
          } else {
            // Basic inference from registry if no history
            if (totalTasks < 3) {
              finalScore = tier === 3 ? 1.0 : tier === 2 ? 0.75 : tier === 1 ? 0.5 : 0.0;
            } else {
              const honestEstimate = totalTasks - totalSlashes;
              const base = honestEstimate / totalTasks;
              finalScore = Math.max(0, Math.min(1, base - totalSlashes * 0.05));
            }
          }

          // Cap external agents at 0.85 (Elite tier is native-only)
          if (Number(agentData.agentClass) !== 0) {
            finalScore = Math.min(finalScore, 0.85);
          }

          return {
            id: addr,
            address: addr,
            tier: tier,
            score: finalScore,
            tasks: Number(agentData.totalTasksCompleted),
            status: agentData.isActive ? 'idle' : 'offline',
            window: history.recentWindow,
            class: Number(agentData.agentClass) === 0 ? 'native' : 'external',
            minStake: ethers.formatEther(agentData.minStakeRequired),
            capabilities: agentData.capabilities || [],
          };
        } catch (e) {
          console.error(`Error processing agent ${addr}:`, e);
          return null;
        }
      }),
    );

    return NextResponse.json(agents.filter((a) => a !== null));
  } catch (error) {
    console.error('Failed to fetch agents API:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}
