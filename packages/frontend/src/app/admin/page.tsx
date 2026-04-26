'use client';

import React from 'react';
import { Gavel, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import { SectionHeader, Surface, Button, LabelStat } from '@/components/ui';

export default function AdminHub() {
  const disputedTasks = [
    {
      id: 'TASK-882',
      poster: '0x71C...392',
      agent: 'Agent-Crucible-05',
      stake: '0.015 0G',
      reason: 'Output contains hallucinated CID',
      timestamp: '2 hours ago',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24">
      <header className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 border border-primary/20">
          <Gavel size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-on-surface">
            Admin Governance Hub
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted mt-0.5">
            Slashing & Dispute Resolution Gate
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Disputes */}
        <div className="lg:col-span-2 space-y-5">
          <SectionHeader
            title="Active Disputes"
            action={
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-danger border border-danger/30">
                Attention Required
              </span>
            }
          />

          {disputedTasks.map((task) => (
            <Surface key={task.id} level="container" className="p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-display font-bold text-on-surface mb-1">{task.id}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-on-surface-dim">
                    <span>Poster: {task.poster}</span>
                    <span>·</span>
                    <span>{task.timestamp}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">Stake At Risk</p>
                  <p className="text-lg font-mono font-bold text-primary">{task.stake}</p>
                </div>
              </div>

              <div className="p-4 bg-danger/5 border border-danger/20 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-danger shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-danger mb-1">
                      Grounds for Dispute
                    </p>
                    <p className="text-xs font-mono text-on-surface-muted">"{task.reason}"</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" className="w-full py-3">
                  Dismiss
                </Button>
                <Button variant="danger" className="w-full py-3">
                  Finalize Slash
                </Button>
              </div>
            </Surface>
          ))}
        </div>

        {/* Stats & Actions */}
        <div className="space-y-5">
          <Surface level="container" className="p-5">
            <SectionHeader title="System Health" className="mb-4" />
            <div className="space-y-px">
              <StatRow label="Total Slashed (Lifetime)" value="12.45 0G" />
              <StatRow label="Active Disputes" value="1" valueClass="text-danger" />
              <StatRow label="Resolved Integrity" value="99.2%" valueClass="text-success" />
            </div>
            <Button variant="outline" className="w-full mt-5 py-3" size="sm">
              <ShieldCheck size={13} /> Withdraw Yield
            </Button>
          </Surface>

          <Surface level="container" className="p-5">
            <SectionHeader title="Recent Judgments" className="mb-4" />
            <div className="space-y-0 divide-y divide-border">
              <HistoryItem label="TASK-871" status="Dismissed" time="1d ago" />
              <HistoryItem label="TASK-865" status="Slashed" time="3d ago" statusClass="text-danger" />
              <HistoryItem label="TASK-842" status="Slashed" time="5d ago" statusClass="text-danger" />
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, valueClass = 'text-on-surface' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center px-3 py-2.5 bg-surface-low">
      <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">{label}</span>
      <span className={`text-sm font-mono font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function HistoryItem({ label, status, time, statusClass = 'text-on-surface-muted' }: { label: string; status: string; time: string; statusClass?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 text-[10px] font-mono">
      <div className="flex items-center gap-3">
        <span className="text-on-surface font-bold uppercase">{label}</span>
        <span className={statusClass}>{status}</span>
      </div>
      <span className="text-on-surface-dim">{time}</span>
    </div>
  );
}
