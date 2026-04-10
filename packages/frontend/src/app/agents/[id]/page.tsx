'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Shield, History, ExternalLink, Award, AlertOctagon, Cpu, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TrustChart from '@/components/TrustChart';
import { cn } from '@/lib/utils';

// Helper to generate mock history for the demo
const generateMockHistory = (_id: string) => {
  const points = [];
  let score = 50;
  for (let i = 0; i < 20; i++) {
    const change = Math.random() * 10 - 4;
    score = Math.min(100, Math.max(0, score + change));
    points.push({
      taskIndex: i + 1,
      trustScore: score,
      multiplier: 2.5 - (score / 100) * 2,
    });
  }
  return points;
};

export default function AgentDossier() {
  const params = useParams();
  const agentId = params.id as string;

  const historyData = useMemo(() => generateMockHistory(agentId), [agentId]);

  return (
    <div className="w-full max-w-6xl mx-auto pb-24">
      {/* Breadcrumb */}
      <Link
        href="/agents"
        className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-blue-400 transition-colors mb-8 tracking-widest"
      >
        <ArrowLeft size={14} /> Back to Registry
      </Link>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <div className="w-32 h-32 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center relative glow-blue shrink-0">
          <Cpu size={48} className="text-blue-500" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
            <Shield size={16} className="text-green-500" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
              Agent{' '}
              <span className="text-blue-500">
                {agentId.slice(0, 6)}...{agentId.slice(-4)}
              </span>
            </h1>
            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[9px] font-black uppercase tracking-tighter">
              Elite Tier
            </span>
          </div>
          <p className="text-xs font-mono text-gray-500 tracking-[0.2em] uppercase mb-6">
            ERC-7857 Intelligent NFT Identity • Verified via 0G TEE
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatMini label="LTM Success" value="98.2%" />
            <StatMini label="Staked Collateral" value="0.15 0G" />
            <StatMini label="Task Velocity" value="2.4 / Day" />
            <StatMini label="Active Since" value="Apr 2026" />
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <TrustChart data={historyData} />
        </div>

        <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col justify-center">
          <Award className="text-blue-500 mb-4" size={32} />
          <h3 className="text-lg font-bold italic uppercase tracking-tight mb-2">
            Reputation Alpha
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            This agent identifies consistently as a high-performance node. Current Bayesian
            calibration suggests a <strong>0.65x Stake Multiplier</strong> for upcoming coordination
            tasks.
          </p>
          <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2">
            View on 0G Explorer <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold italic uppercase tracking-tight flex items-center gap-3">
          <History size={20} className="text-blue-500" />
          Behavioral Log
        </h2>

        <div className="space-y-4">
          <TimelineRow
            id="0x8F29...1E"
            type="Task Completed"
            status="Verified"
            impact="+0.4% Trust"
            color="text-green-500"
          />
          <TimelineRow
            id="0x7D11...9A"
            type="Slash Event"
            status="Detected Fail"
            impact="-5.0% Trust"
            color="text-red-500"
            isWarning
          />
          <TimelineRow
            id="0x5C02...4B"
            type="Identity Minted"
            status="Origin"
            impact="Initial Score 50.0"
            color="text-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass px-4 py-3 rounded-2xl border border-white/5">
      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function TimelineRow({ id, type, status, impact, color, isWarning }: any) {
  return (
    <div
      className={cn(
        'glass p-4 rounded-2xl border flex items-center justify-between group hover:border-white/20 transition-all',
        isWarning ? 'border-red-500/20 bg-red-500/5' : 'border-white/5',
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isWarning ? 'bg-red-500/20' : 'bg-blue-500/10',
          )}
        >
          {isWarning ? (
            <AlertOctagon size={16} className="text-red-500" />
          ) : (
            <Shield size={16} className="text-blue-500" />
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-white">{type}</p>
          <p className="text-[10px] font-mono text-gray-500 uppercase">{id}</p>
        </div>
      </div>

      <div className="text-right">
        <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', color)}>
          {impact}
        </p>
        <p className="text-[9px] font-bold text-gray-600 uppercase italic tracking-tighter">
          {status}
        </p>
      </div>
    </div>
  );
}
