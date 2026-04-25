'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Shield, History, ExternalLink, Award, AlertOctagon, Cpu, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TrustChart from '@/components/TrustChart';
import { cn } from '@/lib/utils';
import { Surface, TierChip, LabelStat, SectionHeader, Button } from '@/components/ui';

const generateMockHistory = (_id: string) => {
  const points = [];
  let score = 50;
  for (let i = 0; i < 20; i++) {
    const change = Math.random() * 10 - 4;
    score = Math.min(100, Math.max(0, score + change));
    points.push({ taskIndex: i + 1, trustScore: score, multiplier: 2.5 - (score / 100) * 2 });
  }
  return points;
};

export default function AgentDossier() {
  const params = useParams();
  const agentId = params.id as string;
  const historyData = useMemo(() => generateMockHistory(agentId), [agentId]);

  return (
    <div className="w-full max-w-6xl mx-auto pb-24">
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-on-surface-muted hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft size={12} /> Back to Registry
      </Link>

      {/* Profile Header */}
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
              Agent{' '}
              <span className="text-primary">
                {agentId.slice(0, 6)}...{agentId.slice(-4)}
              </span>
            </h1>
            <TierChip tier={4} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted mb-5">
            ERC-7857 Intelligent NFT Identity · Verified via 0G TEE
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <LabelStat label="LTM Success"       value="98.2%" accent />
            <LabelStat label="Staked Collateral"  value="0.15 0G" />
            <LabelStat label="Task Velocity"      value="2.4 / Day" />
            <LabelStat label="Active Since"       value="Apr 2026" />
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <TrustChart data={historyData} />
        </div>

        <Surface level="container" className="p-6 flex flex-col justify-center">
          <Award className="text-primary mb-4" size={24} />
          <h3 className="text-sm font-display font-bold uppercase tracking-widest text-on-surface mb-2">
            Reputation Alpha
          </h3>
          <p className="text-xs font-mono text-on-surface-muted leading-relaxed mb-5">
            High-performance node. Current Bayesian calibration suggests a{' '}
            <strong className="text-on-surface">0.65x Stake Multiplier</strong> for upcoming tasks.
          </p>
          <Button variant="outline" size="sm" className="w-full justify-center">
            View on 0G Explorer <ExternalLink size={11} />
          </Button>
        </Surface>
      </div>

      {/* Timeline */}
      <SectionHeader title="Behavioral Log" />
      <div className="space-y-2">
        <TimelineRow id="0x8F29...1E" type="Task Completed"   status="Verified"      impact="+0.4% Trust" isWarning={false} />
        <TimelineRow id="0x7D11...9A" type="Slash Event"      status="Detected Fail" impact="-5.0% Trust" isWarning={true}  />
        <TimelineRow id="0x5C02...4B" type="Identity Minted"  status="Origin"        impact="Score 50.0"  isWarning={false} />
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
