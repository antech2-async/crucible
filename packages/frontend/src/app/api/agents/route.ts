import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Indexer } from '@0glabs/0g-ts-sdk';
import { 
    AGENT_REGISTRY_ABI, 
    CONTRACT_ADDRESSES 
} from '@crucible/shared';

export async function GET() {
    const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const indexerUrl = process.env.OG_STORAGE_INDEXER_URL || 'https://indexer-testnet.0g.ai';
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const registry = new ethers.Contract(
        CONTRACT_ADDRESSES.AGENT_REGISTRY,
        AGENT_REGISTRY_ABI,
        provider
    );
    
    const indexer = new Indexer(indexerUrl);

    try {
        const agentAddresses = await registry.getAgentList();
        
        const agents = await Promise.all(agentAddresses.map(async (addr: string) => {
            try {
                const agentData = await registry.getAgent(addr);
                
                let history = { recentWindow: [], avgResponseTimeMs: 0, totalTasks: 0, completedHonestly: 0 };
                
                if (agentData.historyRootHash !== ethers.ZeroHash) {
                    try {
                        // @ts-expect-error SDK typing
                        const [data, err] = await indexer.download(agentData.historyRootHash);
                        if (!err && data) {
                            const jsonString = Buffer.from(data).toString('utf-8');
                            history = JSON.parse(jsonString);
                        }
                    } catch (e) {
                        console.warn(`Failed to download history for ${addr}:`, e);
                    }
                }

                const lifetimeRate = history.totalTasks > 0 ? (history.completedHonestly / history.totalTasks) : 0.5;
                const recentRate = history.recentWindow.length > 0
                    ? history.recentWindow.reduce((a: number, b: number) => a + b, 0) / history.recentWindow.length
                    : 0.5;
                
                const weightedScore = recentRate * 0.6 + lifetimeRate * 0.4;
                const slashPenalty = (history as any).totalSlashEvents ? (history as any).totalSlashEvents * 0.05 : 0;
                let finalScore = Math.max(0, Math.min(1, weightedScore - slashPenalty));
                
                // Cap external agents at 0.85 (Elite tier is native-only)
                if (Number(agentData.agentClass) !== 0) {
                    finalScore = Math.min(finalScore, 0.85);
                }

                return {
                    id: addr,
                    address: addr,
                    tier: Number(agentData.trustTier),
                    score: finalScore,
                    tasks: Number(agentData.totalTasksCompleted),
                    status: agentData.isActive ? 'idle' : 'offline',
                    window: history.recentWindow || [],
                    class: Number(agentData.agentClass) === 0 ? 'native' : 'external',
                    minStake: ethers.formatEther(agentData.minStakeRequired)
                };
            } catch (e) {
                console.error(`Error processing agent ${addr}:`, e);
                return null;
            }
        }));

        return NextResponse.json(agents.filter(a => a !== null));
    } catch (error) {
        console.error('Failed to fetch agents API:', error);
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
}
