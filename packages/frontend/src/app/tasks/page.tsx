'use client';

import React, { useState } from 'react';
import TaskCard from '@/components/TaskCard';
import PostTaskForm from '@/components/PostTaskForm';
import { Search, Zap } from 'lucide-react';
import { SectionHeader } from '@/components/ui';

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState('active');

  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-on-surface mb-1">
          Task <span className="text-primary">Ops</span>
        </h1>
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
          Live Ingestion &amp; Proof Verification Feed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Side Panel: Form */}
        <div className="lg:col-span-5">
          <PostTaskForm />
        </div>

        {/* Main Panel: Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
              Live Feed Pipeline
            </span>
            <span className="text-[10px] font-mono text-on-surface-dim animate-pulse">
              Syncing with 0G Indexer...
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-dim group-focus-within:text-primary transition-colors"
                size={13}
              />
              <input
                type="text"
                placeholder="Search Task ID..."
                className="bg-surface-low border border-border py-2 pl-9 pr-4 text-xs font-mono text-on-surface placeholder:text-on-surface-dim focus:outline-none focus:border-primary transition-colors w-56"
              />
            </div>
            <div className="flex bg-surface-low border border-border p-px">
              {['active', 'completed', 'disputed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    activeFilter === f
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-muted hover:text-on-surface'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <SectionHeader title="Pending Assignment" className="mb-0" />
              <TaskCard />
              <div className="p-10 bg-surface-low border border-dashed border-border flex flex-col items-center justify-center text-center">
                <Zap size={18} className="mb-3 text-on-surface-dim" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-dim">
                  No other tasks in queue
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <SectionHeader title="Verification Pipeline" className="mb-3" />
              <div className="border border-border overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-low border-b border-border">
                    <tr className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted">
                      <th className="px-4 py-3">Task Fingerprint</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assigned Agents</th>
                      <th className="px-4 py-3 text-right">Escrow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <PipelineRow id="0x8F9...2E" status="VERIFYING"   agents={3} balance="0.05 0G" isDone={false} />
                    <PipelineRow id="0x22D...1A" status="MINING_TEE"  agents={1} balance="0.01 0G" isDone={false} />
                    <PipelineRow id="0xBC1...7F" status="RESOLVED"    agents={2} balance="0.12 0G" isDone={true}  />
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

function PipelineRow({ id, status, agents, balance, isDone }: {
  id: string; status: string; agents: number; balance: string; isDone: boolean;
}) {
  return (
    <tr className="hover:bg-surface-low transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 ${isDone ? 'bg-success' : 'bg-primary animate-pulse'}`} />
          <span className="font-mono text-xs font-bold uppercase text-on-surface">{id}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 border ${
          isDone
            ? 'bg-success/5 text-success border-success/20'
            : 'bg-primary/5 text-primary border-primary/20'
        }`}>
          {status}
        </span>
      </td>
      <td className="px-4 py-4 text-xs font-mono text-on-surface-muted">{agents} Swarm Nodes</td>
      <td className="px-4 py-4 text-right font-mono text-sm font-bold text-on-surface">{balance}</td>
    </tr>
  );
}
