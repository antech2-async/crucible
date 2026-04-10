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

export default function AgentsPage() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="w-full">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
            Agent <span className="text-blue-500">Registry</span>
          </h1>
          <p className="text-xs font-mono text-gray-500 tracking-widest uppercase mb-6">
            Cryptographic Reputation Leaderboard
          </p>

          <div className="flex gap-4">
            {TIER_METRICS.map((m) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* These would normally be mapped from a useReadContract hook */}
        <AgentCard
          agent={{
            id: '0x1A...2B',
            tier: 4,
            score: 0.98,
            tasks: 47,
            status: 'idle',
            window: [1, 1, 1, 1],
          }}
        />
        <AgentCard
          agent={{
            id: '0x7C...D1',
            tier: 3,
            score: 0.89,
            tasks: 32,
            status: 'working',
            window: [1, 1, 1, 0, 1],
          }}
        />
        <AgentCard
          agent={{
            id: '0xBD...4E',
            tier: 2,
            score: 0.72,
            tasks: 12,
            status: 'idle',
            window: [1, 0, 1, 1],
          }}
        />
        <AgentCard
          agent={{
            id: '0xF2...9A',
            tier: 1,
            score: 0.45,
            tasks: 4,
            status: 'idle',
            window: [0, 1, 0],
          }}
        />
      </div>

      <div className="mt-12 glass rounded-2xl p-8 border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-yellow-500" size={24} />
          <h2 className="text-xl font-bold uppercase italic tracking-tight">Top Performers</h2>
        </div>
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
            <LeaderboardRow
              rank={1}
              id="0x1A2B...3C4D"
              score="99.4%"
              multi="0.5x Stake"
              color="text-yellow-500"
            />
            <LeaderboardRow
              rank={2}
              id="0xDE5F...6G7H"
              score="98.2%"
              multi="0.6x Stake"
              color="text-yellow-400"
            />
            <LeaderboardRow
              rank={3}
              id="0xJK8L...9M0N"
              score="95.1%"
              multi="0.8x Stake"
              color="text-yellow-200"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaderboardRow({ rank, id, score, multi, color }: any) {
  return (
    <tr className="border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
      <td className="py-4 font-black italic text-gray-500">{rank}</td>
      <td className="py-4 font-mono font-bold group-hover:text-blue-400 transition-colors uppercase tracking-widest">
        {id}
      </td>
      <td className="py-4 text-right font-black text-lg">{score}</td>
      <td className={`py-4 text-right font-bold text-xs uppercase tracking-widest ${color}`}>
        {multi}
      </td>
    </tr>
  );
}
