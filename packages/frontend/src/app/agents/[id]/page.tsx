'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Shield, History, ExternalLink, Award, AlertOctagon, Cpu, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import TrustChart from '@/components/TrustChart';
import { cn } from '@/lib/utils';
import { Surface, TierChip, LabelStat, SectionHeader, Button } from '@/components/ui';

const TIER_LABELS = ['Basic', 'Uncommon', 'Rare', 'Epic', 'Mythic'];
const TIER_COLORS = [
    'text-slate-400', 'text-emerald-400', 'text-blue-400',
    'text-fuchsia-400', 'text-amber-400'
];

export default function AgentDossier() {
    const params = useParams();
    const agentId = params.id as string;

    const { data: agent, isLoading } = useQuery({
        queryKey: ['agent', agentId],
        queryFn: async () => {
            const res = await fetch(`/api/agents/${agentId}`);
            if (!res.ok) throw new Error('Agent not found');
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-40">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!agent) return <div className="text-on-surface-muted text-center py-40">Agent not found</div>;

    const tierLabel = TIER_LABELS[agent.tier] || 'Basic';
    const tierColor = TIER_COLORS[agent.tier] || 'text-slate-400';

    const formattedDate = agent.registrationTime 
        ? new Date(agent.registrationTime * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Apr 2026';

    return (
        <div className="w-full max-w-6xl mx-auto pb-24">
            <Link href="/agents" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-on-surface-muted hover:text-primary transition-colors mb-8">
                <ArrowLeft size={12} /> Back to Registry
            </Link>

            <div className="flex flex-col md:flex-row gap-6 items-start mb-10">
                <div className="w-20 h-20 bg-primary/5 border border-border flex items-center justify-center relative shrink-0">
                    <Cpu size={32} className="text-primary/60" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-surface-low border border-border flex items-center justify-center">
                        <Shield size={12} className="text-success" />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-1.5 flex-wrap">
                        <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-on-surface">
                            Agent <span className="text-primary">{agentId.slice(0, 6)}...{agentId.slice(-4)}</span>
                        </h1>
                        <TierChip tier={agent.tier} />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted mb-5">
                        {agent.class === 'native' ? 'ERC-7857 Intelligent NFT Identity · Verified via 0G TEE' : 'External Agent · Hash Committed'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <LabelStat label="Trust Score" value={`${(agent.score * 100).toFixed(1)}%`} accent />
                        <LabelStat label="Min Stake" value={`${agent.minStake} 0G`} />
                        <LabelStat label="Tasks Done" value={agent.tasks.toString()} />
                        <LabelStat label="Active Since" value={formattedDate} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-2">
                    <TrustChart data={agent.scoreHistory || []} />
                </div>

                <Surface level="container" className="p-6 flex flex-col justify-center">
                    <Award className="text-primary mb-4" size={24} />
                    <h3 className="text-sm font-display font-bold uppercase tracking-widest text-on-surface mb-2">Reputation Profile</h3>
                    <p className="text-xs font-mono text-on-surface-muted leading-relaxed mb-5">
                        Capabilities: <strong className="text-on-surface">{agent.capabilities?.join(', ') || 'Unknown'}</strong><br /><br />
                        Bayesian trust score of <strong className={cn("text-on-surface", tierColor)}>{(agent.score * 100).toFixed(1)}%</strong> based on {agent.tasks} completed tasks and {agent.slashes} slash events.
                    </p>
                    <a
                        href={`https://chainscan-galileo.0g.ai/address/${agentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface border border-border rounded hover:bg-surface-high transition-colors"
                    >
                        View on 0G Explorer <ExternalLink size={11} />
                    </a>
                </Surface>
            </div>

            <SectionHeader title="Behavioral Log" />
            <div className="space-y-2">
                {agent.window?.length > 0 ? (
                    agent.window.slice().reverse().map((result: number, i: number) => (
                        <TimelineRow
                            key={i}
                            id={`Task #${agent.tasks - i}`}
                            type={result === 1 ? 'Task Completed' : 'Task Failed'}
                            status={result === 1 ? 'Verified' : 'Slashed'}
                            impact={result === 1 ? '+Trust' : '-5.0% Trust'}
                            isWarning={result === 0}
                        />
                    ))
                ) : (
                    <div className="text-on-surface-muted text-xs font-mono py-8 text-center border border-border bg-surface-container">No behavioral history yet</div>
                )}
            </div>
        </div>
    );
}

function TimelineRow({ id, type, status, impact, isWarning }: {
    id: string; type: string; status: string; impact: string; isWarning: boolean;
}) {
    return (
        <div
            className={cn(
                'p-4 border flex items-center justify-between',
                isWarning ? 'bg-danger/5 border-danger/20' : 'bg-surface-container border-border',
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn('w-8 h-8 border flex items-center justify-center', isWarning ? 'border-danger/30' : 'border-border')}>
                    {isWarning ? (
                        <AlertOctagon size={14} className="text-danger" />
                    ) : (
                        <Shield size={14} className="text-primary/60" />
                    )}
                </div>
                <div>
                    <p className="text-xs font-display font-bold text-on-surface">{type}</p>
                    <p className="text-[10px] font-mono uppercase text-on-surface-dim">{id}</p>
                </div>
            </div>

            <div className="text-right">
                <p className={cn('text-[10px] font-mono uppercase tracking-widest font-bold', isWarning ? 'text-danger' : 'text-success')}>
                    {impact}
                </p>
                <p className="text-[9px] font-mono text-on-surface-dim uppercase">{status}</p>
            </div>
        </div>
    );
}
