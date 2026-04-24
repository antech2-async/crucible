'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import AgentCard from '@/components/AgentCard';

const TIER_METRICS = [
  { label: 'Elite', count: 2, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { label: 'High Trust', count: 5, color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Stable', count: 12, color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

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

  const filteredAgents = agents.filter((a: any) => {
    if (filter === 'all') return true;
    if (filter === 'elite') return a.tier >= 3;
    if (filter === 'active') return a.status === 'working' || a.tasks > 0;
    return true;
  });

  const tierMetrics = [
    { label: 'Elite', count: agents.filter((a: any) => a.tier >= 3).length, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'High Trust', count: agents.filter((a: any) => a.tier === 2).length, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Stable', count: agents.filter((a: any) => a.tier === 1).length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="w-full">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
            Agent <span className="text-blue-500">Registry</span>
          </h1>
          <p className="text-xs font-mono text-gray-500 tracking-widest uppercase mb-6">
            Cryptographic Reputation Leaderboard
          </p>

          <div className="flex flex-wrap gap-4">
            {tierMetrics.map((m) => (
              <div
                key={m.label}
                className={`px-4 py-2 rounded-xl ${m.bg} border border-white/5 flex items-center gap-3`}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest ${m.color}`}>
                  {m.label}
                </span>
                <span className="text-lg font-bold">{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
          {['all', 'elite', 'active'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredAgents.map((agent: any) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
          {filteredAgents.length === 0 && (
            <div className="col-span-full py-20 glass rounded-2xl text-center border border-white/5">
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">No agents found matching filter</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 glass rounded-2xl p-8 border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-yellow-500" size={24} />
          <h2 className="text-xl font-bold uppercase italic tracking-tight">Leaderboard Ranking</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                <th className="pb-4 pt-4">Rank</th>
                <th className="pb-4 pt-4">Agent Identity</th>
                <th className="pb-4 pt-4 text-right">Trust Score</th>
                <th className="pb-4 pt-4 text-right">Yield Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {agents.sort((a: any, b: any) => b.score - a.score).map((agent: any, i: number) => (
                <LeaderboardRow
                  key={agent.id}
                  rank={i + 1}
                  id={agent.id}
                  score={`${(agent.score * 100).toFixed(1)}%`}
                  multi={`${(1 + agent.score).toFixed(2)}x Stake`}
                  color={i === 0 ? "text-yellow-500" : i === 1 ? "text-yellow-400" : "text-yellow-200"}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ rank, id, score, multi, color }: any) {
  return (
    <tr className="border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
      <td className="py-4 font-black italic text-gray-500">{rank}</td>
      <td className="py-4 font-mono font-bold group-hover:text-blue-400 transition-colors uppercase tracking-widest break-all">
        {id}
      </td>
      <td className="py-4 text-right font-black text-lg">{score}</td>
      <td className={`py-4 text-right font-bold text-xs uppercase tracking-widest ${color}`}>
        {multi}
      </td>
    </tr>
  );
}
