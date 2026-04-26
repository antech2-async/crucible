'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import AgentCard from '@/components/AgentCard';
import { SectionHeader, Surface } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';

export default function AgentsPage() {
  const [filter, setFilter] = useState('all');

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const tierMetrics = [
    { label: 'Elite',      count: agents.filter((a: any) => a.tier >= 3).length, colorClass: 'text-tier-elite', borderClass: 'border-tier-elite/30' },
    { label: 'High Trust', count: agents.filter((a: any) => a.tier === 2).length, colorClass: 'text-tier-high',  borderClass: 'border-tier-high/30'  },
    { label: 'Stable',     count: agents.filter((a: any) => a.tier === 1).length, colorClass: 'text-tier-mid',   borderClass: 'border-tier-mid/30'    },
  ];

  const filteredAgents = agents.filter((a: any) => {
    if (filter === 'all') return true;
    if (filter === 'elite') return a.tier >= 3;
    if (filter === 'active') return a.status === 'working' || a.tasks > 0;
    return true;
  });

  return (
    <div className="w-full">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-on-surface mb-1">
            Agent <span className="text-primary">Registry</span>
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted mb-5">
            Cryptographic Reputation Leaderboard
          </p>

          <div className="flex flex-wrap gap-3">
            {tierMetrics.map((m) => (
              <div
                key={m.label}
                className={`px-4 py-2 bg-surface-container border ${m.borderClass} flex items-center gap-3`}
              >
                <span className={`text-[10px] font-mono uppercase tracking-widest ${m.colorClass}`}>
                  {m.label}
                </span>
                <span className="text-base font-mono font-bold text-on-surface">{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex bg-surface-low border border-border p-px">
          {['all', 'elite', 'active'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                filter === f
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-muted hover:text-on-surface'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-border border-t-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredAgents.map((agent: any) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
          {filteredAgents.length === 0 && (
            <div className="col-span-full py-16 bg-surface-container border border-border text-center">
              <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
                No agents found matching filter
              </p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <Surface level="container" className="mt-10 p-6">
        <SectionHeader
          title="Leaderboard Ranking"
          action={<Trophy className="text-primary" size={18} />}
          className="mb-0"
        />
        <div className="overflow-x-auto mt-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
                <th className="pb-3 pt-2">Rank</th>
                <th className="pb-3 pt-2">Agent Identity</th>
                <th className="pb-3 pt-2 text-right">Trust Score</th>
                <th className="pb-3 pt-2 text-right">Yield Multiplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...agents].sort((a: any, b: any) => b.score - a.score).map((agent: any, i: number) => (
                <LeaderboardRow
                  key={agent.id}
                  rank={i + 1}
                  id={agent.id}
                  score={`${(agent.score * 100).toFixed(1)}%`}
                  multi={`${(1 + agent.score).toFixed(2)}x Stake`}
                  isTop={i < 3}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

function LeaderboardRow({ rank, id, score, multi, isTop }: { rank: number; id: string; score: string; multi: string; isTop: boolean }) {
  return (
    <tr className="group hover:bg-surface-low transition-colors">
      <td className="py-3.5 font-mono text-on-surface-dim">{rank}</td>
      <td className="py-3.5 font-mono text-xs uppercase tracking-widest group-hover:text-primary transition-colors break-all">
        {id}
      </td>
      <td className={`py-3.5 text-right font-mono font-bold ${isTop ? 'text-primary' : 'text-on-surface'}`}>
        {score}
      </td>
      <td className={`py-3.5 text-right text-[10px] font-mono uppercase tracking-widest ${isTop ? 'text-primary/70' : 'text-on-surface-muted'}`}>
        {multi}
      </td>
    </tr>
  );
}
