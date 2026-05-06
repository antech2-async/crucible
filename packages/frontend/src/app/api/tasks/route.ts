import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { TASK_ESCROW_ABI, CONTRACT_ADDRESSES } from '@crucible/shared';

const STATUS_MAP: Record<number, string> = {
    0: 'OPEN', 1: 'ASSIGNED', 2: 'IN_PIPELINE',
    3: 'VERIFYING', 4: 'COMPLETED', 5: 'PARTIALLY_COMPLETED',
    6: 'DISPUTED', 7: 'FAILED'
};

export async function GET() {
    const provider = new ethers.JsonRpcProvider(
        process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai'
    );
    const escrow = new ethers.Contract(
        CONTRACT_ADDRESSES.TASK_ESCROW,
        TASK_ESCROW_ABI,
        provider
    );

    try {
        const taskCount = Number(await escrow.taskCount());
        const tasks = [];

        // Fetch last 20 tasks max for performance
        const start = Math.max(0, taskCount - 20);

        for (let i = start; i < taskCount; i++) {
            try {
                const [poster, totalPayment, deadline, status, criteriaHash, criteriaURI, isSequential] =
                    await escrow.getTaskBasic(i);
                const [assignedAgents, agentStakes] = await escrow.getTaskAgents(i);

                const now = Math.floor(Date.now() / 1000);
                const deadlineNum = Number(deadline);
                const remainingMs = (deadlineNum - now) * 1000;
                const hoursLeft = Math.max(0, Math.floor(remainingMs / 3600000));
                const minutesLeft = Math.max(0, Math.floor((remainingMs % 3600000) / 60000));

                tasks.push({
                    id: i,
                    poster: poster.slice(0, 6) + '...' + poster.slice(-4),
                    posterFull: poster,
                    payment: ethers.formatEther(totalPayment),
                    deadline: hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`,
                    deadlineTimestamp: deadlineNum,
                    status: Number(status),
                    statusLabel: STATUS_MAP[Number(status)] || 'UNKNOWN',
                    criteriaURI,
                    isSequential,
                    assignedAgents,
                    agentCount: assignedAgents.length,
                    isExpired: now > deadlineNum,
                    isDone: Number(status) >= 4,
                });
            } catch (e) {
                console.error(`Error fetching task ${i}:`, e);
            }
        }

        // Most recent first
        return NextResponse.json(tasks.reverse());
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}
