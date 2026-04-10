'use client';

import React, { useState } from 'react';
import TaskCard from '@/components/TaskCard';
import PostTaskForm from '@/components/PostTaskForm';
import { Search, Zap } from 'lucide-react';

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState('active');

  return (
    <div className="w-full">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
            Task <span className="text-blue-500">Ops</span>
          </h1>
          <p className="text-xs font-mono text-gray-500 tracking-widest uppercase">
            Live Ingestion & Proof Verification Feed
          </p>
        </div>

        {/* ... (keep filter buttons) */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Side Panel: Form */}
        <div className="lg:col-span-5">
          <PostTaskForm />
        </div>

        {/* Main Panel: Feed */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
              Live Feed Pipeline
            </h3>
            <span className="text-[10px] text-gray-600 font-mono italic animate-pulse">
              Syncing with 0G Indexer...
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors"
                size={14}
              />
              <input
                type="text"
                placeholder="Search Task ID..."
                className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-blue-500/50 transition-all w-64"
              />
            </div>
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
              {['active', 'completed', 'disputed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Real mapping of TaskEscrow.tasks would go here */}
            <div className="lg:col-span-1 space-y-6">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
                Pending Assignment
              </h3>
              <TaskCard />
              <div className="p-12 glass rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center opacity-40">
                <Zap size={24} className="mb-4 text-gray-600" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic">
                  No other tasks in queue
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] mb-4">
                Verification Pipeline
              </h3>
              <div className="glass rounded-2xl p-0 overflow-hidden border border-white/5">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.02] border-b border-white/5">
                    <tr className="text-[9px] font-mono uppercase tracking-[0.2em] text-gray-500">
                      <th className="px-6 py-4">Task Fingerprint</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Assigned Agents</th>
                      <th className="px-6 py-4 text-right">Escrow Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <PipelineRow id="0x8F9...2E" status="VERIFYING" agents={3} balance="0.05 0G" />
                    <PipelineRow id="0x22D...1A" status="MINING_TEE" agents={1} balance="0.01 0G" />
                    <PipelineRow
                      id="0xBC1...7F"
                      status="RESOLVED"
                      agents={2}
                      balance="0.12 0G"
                      isDone
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineRow({ id, status, agents, balance, isDone }: any) {
  return (
    <tr className="hover:bg-white/[0.01] transition-colors group">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${isDone ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}
          />
          <span className="font-mono text-xs font-bold uppercase">{id}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span
          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${isDone ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-5 text-xs text-gray-400 font-bold">{agents} Swarm Nodes</td>
      <td className="px-6 py-5 text-right font-black text-blue-400">{balance}</td>
    </tr>
  );
}
