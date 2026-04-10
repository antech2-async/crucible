'use client';

import React from 'react';
import Link from 'next/link';
import { Award, AlertCircle, Cpu } from 'lucide-react';

interface AgentCardProps {
  agent: {
    id: string;
    tier: number;
    score: number;
    tasks: number;
    status: 'idle' | 'working' | 'slashed';
    window: number[];
  };
}

const TIER_CONFIG: any = {
  4: {
    label: 'Elite',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  3: {
    label: 'High',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
  },
  2: {
    label: 'Moderate',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  1: {
    label: 'Low',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
  0: { label: 'New', color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' },
};

export default function AgentCard({ agent }: AgentCardProps) {
  const config = TIER_CONFIG[agent.tier] || TIER_CONFIG[0];
  const isSlashed = agent.status === 'slashed';

  return (
    <Link href={`/agents/${agent.id}`}>
      <div
        className={`relative group glass rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:translate-y-[-4px] border border-white/5 cursor-pointer ${isSlashed ? 'border-red-500/50 glow-red' : 'hover:border-blue-500/30'}`}
      >
        {/* Status Glow */}
        <div
          className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full ${isSlashed ? 'bg-red-500' : 'bg-blue-500'}`}
        />

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">
              INFT Agent
            </p>
            <h3 className="font-bold text-lg font-mono tracking-tight">{agent.id}</h3>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${config.bg} ${config.color} border ${config.border}`}
          >
            {config.label} Tier
          </div>
        </div>

        {/* Trust Score */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 mb-1">Bayesian Trust Score</p>
            <div className="text-3xl font-black tracking-tighter flex items-center gap-2">
              {(agent.score * 100).toFixed(1)}%
              {agent.score > 0.9 && <Award size={20} className="text-yellow-400 animate-pulse" />}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase">Tasks</p>
            <p className="font-bold text-sm">{agent.tasks}</p>
          </div>
        </div>

        {/* Consistency Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-[9px] uppercase text-gray-500 tracking-wider">
            <span>Recent Performance</span>
            <span>Last 10 Actions</span>
          </div>
          <div className="flex gap-1.5 h-1.5 w-full">
            {Array.from({ length: 10 }).map((_, i) => {
              const result = agent.window[i];
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full ${
                    result === undefined
                      ? 'bg-gray-800'
                      : result === 1
                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                        : 'bg-red-500 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
          <div className={`p-1.5 rounded-lg ${isSlashed ? 'bg-red-500/20' : 'bg-blue-500/10'}`}>
            {isSlashed ? (
              <AlertCircle size={14} className="text-red-500" />
            ) : (
              <Cpu size={14} className="text-blue-500" />
            )}
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${isSlashed ? 'text-red-400' : 'text-blue-400'}`}
          >
            {isSlashed
              ? 'Slashed (Suspended)'
              : agent.status === 'working'
                ? 'Busy (Inference)'
                : 'Network Ready'}
          </span>
        </div>
      </div>
    </Link>
  );
}
