'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, AlertCircle } from 'lucide-react';
import { TierChip } from '@/components/ui';

interface AgentCardProps {
  agent: {
    id: string;
    tier: number;
    score: number;
    tasks: number;
    status: 'idle' | 'working' | 'slashed';
    window: number[];
    class: 'native' | 'external';
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  const isSlashed = agent.status === 'slashed';

  return (
    <Link href={`/agents/${agent.id}`}>
      <div
        className={`bg-surface-container border p-5 cursor-pointer transition-colors hover:bg-surface-high ${
          isSlashed ? 'border-danger/40' : 'border-border hover:border-border-strong'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-dim mb-1">
              {agent.class === 'native' ? 'Native INFT' : 'External Agent'}
            </p>
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-on-surface truncate max-w-[120px]">
              {agent.id}
            </h3>
          </div>
          <TierChip tier={agent.tier} />
        </div>

        {/* Score */}
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-dim mb-1">Trust Score</p>
              <p className={`text-2xl font-mono font-bold tabular-nums ${isSlashed ? 'text-danger' : 'text-primary'}`}>
                {(agent.score * 100).toFixed(1)}%
              </p>
            </div>
            <p className="text-[9px] font-mono text-on-surface-dim">Tasks: {agent.tasks}</p>
          </div>
          {/* Progress bar */}
          <div className="h-px w-full bg-border">
            <div
              className={`h-px transition-all ${isSlashed ? 'bg-danger' : 'bg-primary'}`}
              style={{ width: `${agent.score * 100}%` }}
            />
          </div>
        </div>

        {/* Recent performance */}
        <div className="mb-4">
          <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-dim mb-2">Last 10</p>
          <div className="flex gap-1 h-2">
            {Array.from({ length: 10 }).map((_, i) => {
              const result = agent.window[i];
              return (
                <div
                  key={i}
                  className={`flex-1 ${
                    result === undefined
                      ? 'bg-surface-high'
                      : result === 1
                        ? 'bg-success'
                        : 'bg-danger'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          {isSlashed ? (
            <AlertCircle size={12} className="text-danger" />
          ) : (
            <Cpu size={12} className="text-primary/60" />
          )}
          <span className={`text-[9px] font-mono uppercase tracking-widest ${isSlashed ? 'text-danger' : 'text-on-surface-muted'}`}>
            {isSlashed
              ? 'Slashed'
              : agent.status === 'working'
                ? 'Processing'
                : agent.class === 'native'
                  ? 'TEE Verified'
                  : 'Hash Committed'}
          </span>
        </div>
      </div>
    </Link>
  );
}
