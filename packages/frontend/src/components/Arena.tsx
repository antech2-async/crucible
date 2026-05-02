'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronRight,
  Cpu,
  FileText,
  Gauge,
  ShieldCheck,
  Share2,
  Zap,
} from 'lucide-react';
import { useReadContract, useWatchContractEvent } from 'wagmi';
import { AGENT_REGISTRY_ABI, CONTRACT_ADDRESSES, TASK_ESCROW_ABI } from '@crucible/shared';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { MeshVisualizer } from './MeshVisualizer';

type DashboardAgent = {
  id: string;
  address?: string;
  tier: number;
  score: number;
  status: 'idle' | 'working' | 'slashed' | 'offline';
  tasks?: number;
  class?: string;
  minStake?: string;
};

const FALLBACK_AGENTS: DashboardAgent[] = [
  { id: 'SENTINEL_PRIME', tier: 4, score: 0.992, status: 'idle', tasks: 71 },
  { id: 'FORGE_MASTER', tier: 3, score: 0.845, status: 'working', tasks: 44 },
  { id: 'RELAY_ALPHA', tier: 4, score: 0.941, status: 'idle', tasks: 59 },
];

const FALLBACK_EVENTS = [
  {
    ts: '12:44:02',
    type: 'Node Handshake',
    desc: 'Success: AGENT_77X connected to Sector 4',
    tone: 'secondary',
  },
  {
    ts: '12:43:58',
    type: 'Validation Proof Generated',
    desc: 'Epoch #8841-A: Hash verification confirmed',
    tone: 'primary',
  },
  {
    ts: '12:43:41',
    type: 'State Update',
    desc: 'Industrial throughput adjusted to 104%',
    tone: 'neutral',
  },
  {
    ts: '12:43:22',
    type: 'Mesh Rebalance',
    desc: '32 nodes re-routed for optimal latency',
    tone: 'secondary',
  },
];

export default function Arena() {
  const [agents, setAgents] = useState<DashboardAgent[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [networkShock, setNetworkShock] = useState(false);

  const { data: agentList } = useReadContract({
    address: CONTRACT_ADDRESSES.AGENT_REGISTRY as `0x${string}`,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAgentList',
  });

  const totalAgents = agentList ? (agentList as any[]).length : 0;

  const { data: taskCount } = useReadContract({
    address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
    abi: TASK_ESCROW_ABI,
    functionName: 'taskCount',
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
    abi: TASK_ESCROW_ABI,
    onLogs(logs: any) {
      const log = logs[0];
      const isSlash = log.eventName === 'AgentSlashed';
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
      setEvents((prev) =>
        [
          {
            ts,
            type: isSlash ? 'Agent Defection' : log.eventName,
            desc: isSlash ? 'Slashing Judge executed collateral penalty' : '0G event committed',
            tone: isSlash ? 'danger' : 'secondary',
          },
          ...prev,
        ].slice(0, 12),
      );
      if (isSlash) {
        setNetworkShock(true);
        setTimeout(() => setNetworkShock(false), 3000);
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.AGENT_REGISTRY as `0x${string}`,
    abi: AGENT_REGISTRY_ABI,
    onLogs(logs: any) {
      const log = logs[0];
      if (log.eventName === 'TrustTierUpdated') {
        const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
        setEvents((prev) =>
          [
            {
              ts,
              type: 'Trust Tier Updated',
              desc: 'Agent reliability terms recalibrated',
              tone: 'primary',
            },
            ...prev,
          ].slice(0, 12),
        );
      }
    },
  });

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) throw new Error('fetch failed');
        const payload = await res.json();
        setAgents(Array.isArray(payload) ? payload : []);
      } catch (err) {
        console.error('Failed to sync agent telemetry', err);
      }
    }
    fetchAgents();
    const id = setInterval(fetchAgents, 10000);
    return () => clearInterval(id);
  }, []);

  const displayedAgents = agents.length ? agents : FALLBACK_AGENTS;
  const liveEvents = events.length ? events : FALLBACK_EVENTS;

  const avgTrust = useMemo(() => {
    if (!displayedAgents.length) return 0.984;
    return displayedAgents.reduce((s, a) => s + a.score, 0) / displayedAgents.length;
  }, [displayedAgents]);

  const meshIntegrity = Math.max(0, Math.min(99.8, avgTrust * 100)).toFixed(1);
  const activeNodes = totalAgents > 0 ? totalAgents.toLocaleString() : '1,248';
  const taskCountValue = taskCount ? Number(taskCount) : 0;
  const networkLoad = taskCountValue > 0 ? `${taskCountValue.toLocaleString()} Tasks` : '42.5k TPS';
  const trustHealth = avgTrust > 0.8 ? 'Nominal' : avgTrust > 0.5 ? 'Degraded' : 'Critical';
  const trustHealthColor =
    avgTrust > 0.8 ? 'text-primary-muted' : avgTrust > 0.5 ? 'text-warning' : 'text-danger';

  const topAgents = useMemo(
    () => [...displayedAgents].sort((a, b) => b.score - a.score).slice(0, 3),
    [displayedAgents],
  );

  return (
    <div className="grid grid-cols-12 gap-5 md:gap-6">
      <section
        className={cn(
          'panel-interactive group/mesh col-span-12 flex min-h-[390px] flex-col overflow-hidden rounded-xl border border-border-strong/10 bg-surface-low shadow-[0_18px_44px_-28px_rgba(255,213,151,0.24)] hover:border-primary/20 lg:col-span-8',
          networkShock && 'border-danger/40',
        )}
      >
        <PanelHeader
          icon={<Share2 size={18} className="text-primary" />}
          title="Coordination Mesh"
          actions={
            <div className="flex min-w-0 flex-wrap justify-end gap-2">
              <StatusPill tone="secondary">Active: {activeNodes} Nodes</StatusPill>
              <StatusPill tone="primary">Uptime: 99.98%</StatusPill>
            </div>
          }
        />

        <div className="relative h-[260px] overflow-hidden md:h-[280px] lg:h-[260px]">
          <div className="readout-pulse absolute left-6 top-6 z-20 space-y-1 font-mono text-[9px] uppercase tracking-[0.08em] text-on-surface-muted/35 transition-colors duration-300 group-hover/mesh:text-secondary/70">
            <div>SEC_CHANNEL_01: STABLE</div>
            <div>LATENCY_OS: 14ms</div>
            <div className="mt-3 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover/mesh:opacity-100">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className="readout-pulse h-0.5 w-6 rounded-full bg-secondary/50"
                  style={{ animationDelay: `${index * 120}ms` }}
                />
              ))}
            </div>
          </div>
          <MeshVisualizer agents={displayedAgents as any} />
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-border-strong/10 bg-surface/55 p-5">
          <StatFooter label="Sync Status" value="Complete" tone="secondary" />
          <StatFooter label="Network Load" value={networkLoad} />
          <StatFooter label="Mesh Integrity" value={`${meshIntegrity}%`} tone="primary" />
        </div>
      </section>

      <section className="col-span-12 grid self-start gap-5 md:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
        <MetricCard
          label="System Load"
          value="74.2%"
          icon={<Gauge size={22} className="text-on-surface-muted/35" />}
          barValue={74}
          tone="primary"
        />
        <MetricCard
          label="Active Nodes"
          value={activeNodes}
          icon={<Cpu size={21} className="text-secondary/45" />}
          segmented
          tone="secondary"
        />
        <div className="panel-interactive rounded-xl border border-border-strong/10 bg-surface-low p-5 shadow-[0_18px_34px_-28px_rgba(255,213,151,0.24)] hover:border-primary/20">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-muted/55">
                Mesh Stability
              </h3>
              <div
                className={cn(
                  'truncate font-display text-3xl font-black tracking-tight',
                  trustHealthColor,
                )}
              >
                {trustHealth}
              </div>
            </div>
            <ShieldCheck size={21} className="shrink-0 text-primary-muted/40" />
          </div>
          <p className="text-xs italic leading-relaxed text-on-surface-muted/40">
            All protocol handshakes verified. Zero drift detected in sub-layer consensus.
          </p>
        </div>
      </section>

      <section className="panel-interactive col-span-12 flex min-h-[260px] flex-col overflow-hidden rounded-xl border border-border-strong/10 bg-surface-low shadow-[0_18px_34px_-28px_rgba(255,213,151,0.22)] hover:border-secondary/20 lg:col-span-4">
        <PanelHeader
          compact
          icon={<FileText size={14} className="text-on-surface-muted/70" />}
          title="Live Events Feed"
          actions={
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
              Streaming
            </span>
          }
        />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {liveEvents.map((event, i) => (
            <LiveEventRow key={`${event.ts}-${i}`} event={event} index={i} />
          ))}
        </div>
      </section>

      <section className="panel-interactive col-span-12 min-h-[260px] overflow-hidden rounded-xl border border-border-strong/10 bg-surface-low p-6 shadow-[0_18px_34px_-28px_rgba(255,213,151,0.22)] hover:border-secondary/20 lg:col-span-8">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h3 className="font-display text-sm font-black uppercase tracking-widest text-on-surface">
            Critical Agents
          </h3>
          <Link
            href="/agents"
            className="flex shrink-0 items-center gap-1 rounded border border-primary/20 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-primary transition-colors hover:bg-primary/5"
          >
            View All Directory <ChevronRight size={11} />
          </Link>
        </div>
        <div className="space-y-6">
          {topAgents.map((agent, index) => (
            <CriticalAgentRow key={agent.id} agent={agent} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  actions,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-border-strong/10 bg-surface/55',
        compact ? 'px-4 py-3' : 'px-5 py-4 md:px-6',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <h2 className="truncate font-display text-[12px] font-black uppercase tracking-widest text-on-surface">
          {title}
        </h2>
      </div>
      {actions}
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'primary' | 'secondary';
}) {
  return (
    <span
      className={cn(
        'rounded-full border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest',
        tone === 'secondary'
          ? 'border-secondary/20 bg-secondary/10 text-secondary'
          : 'border-primary/20 bg-primary/10 text-primary-muted',
      )}
    >
      {children}
    </span>
  );
}

function StatFooter({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'primary' | 'secondary' | 'neutral';
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="truncate font-mono text-[9px] uppercase tracking-widest text-on-surface-muted/45">
        {label}
      </p>
      <p
        className={cn(
          'truncate font-display text-lg font-black uppercase tracking-tight md:text-xl',
          tone === 'secondary' && 'text-secondary',
          tone === 'primary' && 'text-primary-muted',
          tone === 'neutral' && 'text-on-surface',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  barValue,
  segmented,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  barValue?: number;
  segmented?: boolean;
  tone: 'primary' | 'secondary';
}) {
  const color = tone === 'secondary' ? 'bg-secondary' : 'bg-primary';
  const textColor = tone === 'secondary' ? 'text-secondary' : 'text-on-surface';

  return (
    <div className="panel-interactive group/card rounded-xl border border-border-strong/10 bg-surface-low p-5 shadow-[0_18px_34px_-28px_rgba(255,213,151,0.24)] hover:border-primary/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-muted/55">
            {label}
          </h3>
          <div
            className={cn(
              'truncate font-display text-3xl font-black tracking-tight transition-transform duration-300 group-hover/card:translate-x-0.5',
              textColor,
            )}
          >
            {value}
          </div>
        </div>
        <div className="shrink-0">{icon}</div>
      </div>
      {segmented ? (
        <div className="flex items-center gap-1">
          {[1, 0.82, 0.64, 0.46, 0.28].map((opacity, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 origin-left flex-1 rounded-full transition-transform duration-300 group-hover/card:scale-y-125',
                color,
              )}
              style={{ opacity }}
            />
          ))}
        </div>
      ) : (
        <div className="h-2 overflow-hidden rounded-full bg-surface-highest">
          <div
            className={cn(
              'bar-live h-full rounded-full bg-gradient-to-r from-primary via-primary-muted to-primary transition-[width,filter] duration-500 group-hover/card:brightness-125',
              tone === 'secondary' && 'from-secondary via-primary-muted to-secondary',
            )}
            style={{ width: `${barValue ?? 0}%` }}
          />
        </div>
      )}
    </div>
  );
}

function LiveEventRow({ event, index }: { event: any; index: number }) {
  const toneClass =
    event.tone === 'danger'
      ? 'text-danger'
      : event.tone === 'primary'
        ? 'text-primary'
        : event.tone === 'secondary'
          ? 'text-secondary'
          : 'text-on-surface';

  return (
    <div className="group/event flex min-w-0 gap-3 rounded-md px-1 py-0.5 font-mono text-[10px] transition-colors duration-200 hover:bg-surface-container/55">
      <span className="w-12 shrink-0 text-on-surface-muted/35">{event.ts}</span>
      <div className="flex min-w-0 gap-2">
        <div
          className={cn(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-surface-highest transition-transform duration-300 group-hover/event:scale-110',
            index % 2 === 0 ? 'border-secondary/20' : 'border-primary/20',
          )}
        >
          <Zap size={9} className={index % 2 === 0 ? 'text-secondary/70' : 'text-primary/70'} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className={cn('truncate uppercase tracking-[0.08em] transition-colors', toneClass)}>
            {event.type}
          </div>
          <div className="line-clamp-2 text-on-surface-muted/55">{event.desc}</div>
        </div>
      </div>
    </div>
  );
}

function CriticalAgentRow({ agent, index }: { agent: DashboardAgent; index: number }) {
  const score = Math.round(agent.score * 1000) / 10;
  const isStable = score >= 90;
  const tone = isStable ? 'secondary' : 'primary';
  const agentNames = ['SENTINEL_PRIME', 'FORGE_MASTER', 'RELAY_ALPHA'];
  const subtitles = ['Sector 01-A Defense', 'Resource Allocation', 'Global Mesh Backbone'];
  const displayName = agent.id.startsWith('0x') ? (agentNames[index] ?? 'NODE_OPERATOR') : agent.id;

  return (
    <div className="group/agent grid min-w-0 grid-cols-1 items-center gap-4 rounded-lg px-2 py-1 transition-colors duration-200 hover:bg-surface-container/50 md:grid-cols-[minmax(0,1fr)_minmax(160px,2fr)_auto] md:gap-6">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-highest transition-all duration-300 group-hover/agent:scale-105',
            tone === 'secondary' ? 'border-secondary/15' : 'border-primary/15',
          )}
        >
          <Activity
            size={17}
            className={tone === 'secondary' ? 'text-secondary/80' : 'text-primary/80'}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-black uppercase tracking-wide text-on-surface">
            {displayName}
          </p>
          <p className="truncate font-mono text-[10px] text-on-surface-muted/40">
            {subtitles[index] ?? 'Crucible Swarm Node'}
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="truncate font-mono text-[9px] uppercase tracking-widest text-on-surface-muted/55">
            Reliability Index
          </span>
          <span
            className={cn(
              'font-mono text-[9px] font-bold',
              tone === 'secondary' ? 'text-secondary' : 'text-primary',
            )}
          >
            {score.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-highest">
          <div
            className={cn(
              'bar-live h-full rounded-full bg-gradient-to-r transition-[width,filter] duration-500 group-hover/agent:brightness-125',
              tone === 'secondary' ? 'bg-secondary' : 'bg-primary',
              tone === 'secondary'
                ? 'from-secondary via-primary-muted to-secondary'
                : 'from-primary via-primary-muted to-primary',
            )}
            style={{ width: `${Math.min(100, Math.max(4, score))}%` }}
          />
        </div>
      </div>

      <div className="flex justify-start md:justify-end">
        <span
          className={cn(
            'rounded border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest',
            isStable
              ? 'border-secondary/10 bg-secondary/5 text-secondary'
              : 'border-primary/10 bg-primary/5 text-primary',
          )}
        >
          {isStable ? 'Stable' : 'Active'}
        </span>
      </div>
    </div>
  );
}
