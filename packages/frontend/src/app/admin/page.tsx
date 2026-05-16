'use client';

import React from 'react';
import { AlertTriangle, Gavel, ShieldCheck } from 'lucide-react';
import { Button, SectionHeader, Surface } from '@/components/ui';

export default function ReviewHub() {
  const disputedTasks = [
    {
      id: 'TASK-882',
      poster: '0x71C...392',
      agent: '0xA91...c05',
      stake: '0.015 0G',
      reason: 'Output contains hallucinated CID',
      timestamp: '2 hours ago',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <div className="border border-primary/20 bg-primary/10 p-3">
          <Gavel size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-on-surface">
            Dispute Review
          </h1>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
            Contract-gated slashing and dispute monitor
          </p>
        </div>
      </header>

      <Surface level="container" className="border-primary/20 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={16} />
          <div className="space-y-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                Who can resolve a slash?
              </p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-on-surface-muted">
                Not everyone. Normal verification slashing goes through the deployed SlashingJudge.
                TaskEscrow only accepts final task resolution from that judge contract. Posters can
                open disputes, but they cannot directly slash an agent from the UI.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <AuthorityCard
                title="Verification"
                body="Authorized engine or owner calls SlashingJudge.judgeTask after checking outputs."
              />
              <AuthorityCard
                title="Disputes"
                body="Task poster can dispute during the window; owner/operator resolves the dispute."
              />
              <AuthorityCard
                title="Expired Tasks"
                body="Anyone can call expiry cleanup after deadline, but only non-submitters can be penalized."
              />
            </div>
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionHeader
            title="Poster Dispute Queue"
            action={
              <span className="border border-danger/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-danger">
                Review Required
              </span>
            }
          />

          {disputedTasks.map((task) => (
            <Surface key={task.id} level="container" className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="mb-1 font-display font-bold text-on-surface">{task.id}</h3>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase text-on-surface-dim">
                    <span>Poster: {task.poster}</span>
                    <span>/</span>
                    <span>Agent: {task.agent}</span>
                    <span>/</span>
                    <span>{task.timestamp}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                    Stake At Risk
                  </p>
                  <p className="font-mono text-lg font-bold text-primary">{task.stake}</p>
                </div>
              </div>

              <div className="mb-6 border border-danger/20 bg-danger/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 shrink-0 text-danger" size={14} />
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-danger">
                      Grounds for Dispute
                    </p>
                    <p className="font-mono text-xs text-on-surface-muted">"{task.reason}"</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" className="w-full py-3" disabled>
                  Dismiss Dispute
                </Button>
                <Button variant="danger" className="w-full py-3" disabled>
                  Resolve via Owner
                </Button>
              </div>
              <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                Demo monitor only. Contract permissions decide who can execute.
              </p>
            </Surface>
          ))}
        </div>

        <div className="space-y-5">
          <Surface level="container" className="p-5">
            <SectionHeader title="Authority Model" className="mb-4" />
            <div className="space-y-px">
              <StatRow label="Task Resolution" value="SlashingJudge" />
              <StatRow label="Judge Callers" value="Owner / Authorized" />
              <StatRow label="Poster Power" value="Open Dispute" valueClass="text-primary" />
            </div>
            <Button variant="outline" className="mt-5 w-full py-3" size="sm" disabled>
              <ShieldCheck size={13} /> Operator Actions Disabled
            </Button>
          </Surface>

          <Surface level="container" className="p-5">
            <SectionHeader title="Resolution Examples" className="mb-4" />
            <div className="space-y-0 divide-y divide-border">
              <HistoryItem label="TASK-871" status="Dismissed" time="1d ago" />
              <HistoryItem
                label="TASK-865"
                status="Slashed"
                time="3d ago"
                statusClass="text-danger"
              />
              <HistoryItem
                label="TASK-842"
                status="Slashed"
                time="5d ago"
                statusClass="text-danger"
              />
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function AuthorityCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-border-strong/10 bg-surface-low p-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface">
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">{body}</p>
    </div>
  );
}

function StatRow({
  label,
  value,
  valueClass = 'text-on-surface',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-surface-low px-3 py-2.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
        {label}
      </span>
      <span className={`text-right font-mono text-xs font-bold tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

function HistoryItem({
  label,
  status,
  time,
  statusClass = 'text-on-surface-muted',
}: {
  label: string;
  status: string;
  time: string;
  statusClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 font-mono text-[10px]">
      <div className="flex items-center gap-3">
        <span className="font-bold uppercase text-on-surface">{label}</span>
        <span className={statusClass}>{status}</span>
      </div>
      <span className="text-on-surface-dim">{time}</span>
    </div>
  );
}
