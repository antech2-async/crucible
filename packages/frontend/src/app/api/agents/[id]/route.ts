import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Indexer } from '@0glabs/0g-ts-sdk';
import { AGENT_REGISTRY_ABI, CONTRACT_ADDRESSES } from '@crucible/shared';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const provider = new ethers.JsonRpcProvider(
        process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai'
    );
    const indexer = new Indexer(
        process.env.OG_STORAGE_INDEXER_URL || 'https://indexer-storage-testnet-turbo.0g.ai'
    );
    const registry = new ethers.Contract(
        CONTRACT_ADDRESSES.AGENT_REGISTRY,
        AGENT_REGISTRY_ABI,
        provider
    );

    try {
        const agentData = await registry.getAgent(params.id);
        let history: any = {
            recentWindow: [],
            totalTasks: 0,
            completedHonestly: 0,
            totalSlashEvents: 0,
            avgResponseTimeMs: 0,
            taskHistory: [],
        };

        if (agentData.historyRootHash !== ethers.ZeroHash) {
            try {
                // @ts-expect-error SDK typing
                const [data, err] = await indexer.download(agentData.historyRootHash);
                if (!err && data) {
                    history = JSON.parse(Buffer.from(data).toString('utf-8'));
                }
            } catch (e) {
                console.warn(`History download failed for ${params.id}:`, e);
            }
        }

        const lifetimeRate = history.totalTasks > 0
            ? history.completedHonestly / history.totalTasks
            : 0.5;
        const recentRate = history.recentWindow.length > 0
            ? (history.recentWindow as number[]).reduce((a, b) => a + b, 0) / history.recentWindow.length
            : 0.5;
        const score = (recentRate * 0.6) + (lifetimeRate * 0.4) - (history.totalSlashEvents * 0.05);
        const clampedScore = Math.max(0, Math.min(1, score));

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

function buildScoreHistory(history: any) {
    if (!history.recentWindow || history.recentWindow.length === 0) {
        return [{ taskIndex: 1, trustScore: 50, multiplier: 2.5 }];
    }

    let runningScore = 50;
    return history.recentWindow.map((result: number, i: number) => {
        runningScore = Math.min(100, Math.max(0, runningScore + (result === 1 ? 4 : -8)));
        return {
            taskIndex: i + 1,
            trustScore: runningScore,
            multiplier: parseFloat((2.5 - (runningScore / 100) * 2).toFixed(2)),
        };
    });
}
