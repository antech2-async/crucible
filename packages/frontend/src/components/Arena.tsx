'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Users, Zap, Activity, AlertTriangle, Share2, RefreshCw, ChevronRight } from 'lucide-react';
import { useReadContract, useBalance, useWatchContractEvent } from 'wagmi';
import { AGENT_REGISTRY_ABI, TASK_ESCROW_ABI, CONTRACT_ADDRESSES } from '@crucible/shared';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { MeshVisualizer } from './MeshVisualizer';

export default function Arena() {
  const [agents, setAgents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [networkShock, setNetworkShock] = useState(false);

  // — Contract reads —
  const { data: agentList } = useReadContract({
    address: CONTRACT_ADDRESSES.AGENT_REGISTRY as `0x${string}`,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAgentList',
  });
  const totalAgents = agentList ? (agentList as any[]).length : 0;

  const { data: escrowBalance } = useBalance({
    address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
  });

  const { data: taskCount } = useReadContract({
    address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
    abi: TASK_ESCROW_ABI,
    functionName: 'taskCount',
  });

  // — Live events —
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
    abi: TASK_ESCROW_ABI,
    onLogs(logs: any) {
      const log = logs[0];
      const isSlash = log.eventName === 'AgentSlashed';
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
      setEvents((prev) =>
        [{ type: isSlash ? 'SLASH' : log.eventName, raw: log, ts }, ...prev].slice(0, 12),
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
        setEvents((prev) => [{ type: 'TIER_CHANGE', raw: log, ts }, ...prev].slice(0, 12));
      }
    },
  });

  // — Agent polling —
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) throw new Error('fetch failed');
        setAgents(await res.json());
      } catch (err) {
        console.error('Failed to sync agent telemetry', err);
      }
    }
    fetchAgents();
    const id = setInterval(fetchAgents, 10000);
    return () => clearInterval(id);
  }, []);

  // — Derived stats —
  const avgTrust = useMemo(() => {
    if (!agents.length) return 0;
    return agents.reduce((s: number, a: any) => s + a.score, 0) / agents.length;
  }, [agents]);

  const meshIntegrity = (avgTrust * 100).toFixed(1);

  const trustHealth = avgTrust > 0.8 ? 'Nominal' : avgTrust > 0.5 ? 'Degraded' : 'Critical';
  const trustHealthColor =
    avgTrust > 0.8 ? 'text-success' : avgTrust > 0.5 ? 'text-warning' : 'text-danger';

  const topAgents = useMemo(
    () => [...agents].sort((a: any, b: any) => b.score - a.score).slice(0, 4),
    [agents],
  );

  const syncStatus = agents.length > 0 ? 'COMPLETE' : 'SYNCING';

  return (
    <div className="space-y-4">
      {/* Network shock banner */}
      <AnimatePresence>
        {networkShock && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-danger/10 border border-danger/30 flex items-center justify-center gap-3 animate-pulse">
              <AlertTriangle className="text-danger" size={14} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-danger">
                Emergency Alert: Agent Defection Detected · Initializing Slashing Judge
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1: Coordination Mesh + Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Coordination Mesh — 8 cols */}
        <div className="lg:col-span-8 bg-surface-container border border-border flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Share2 size={13} className="text-primary/60" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-on-surface">
                Coordination Mesh
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border border-success/30 text-success bg-success/5">
                Active: {totalAgents} Nodes
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border border-primary/30 text-primary/80 bg-primary/5">
                Uptime: 99.98%
              </span>
            </div>
          </div>

          {/* Mesh visualizer */}
          <div className="flex-1 relative min-h-[220px] bg-surface overflow-hidden">
            {/* Channel labels */}
            <div className="absolute top-3 left-4 z-10 space-y-0.5">
              <p className="text-[8px] font-mono text-on-surface-dim uppercase tracking-widest">
                SEC_CHANNEL_01: STABLE
              </p>
              <p className="text-[8px] font-mono text-on-surface-dim uppercase tracking-widest">
                LATENCY_01: &lt;10ms
              </p>
            </div>
            <MeshVisualizer agents={agents} />
          </div>

          {/* Panel stats footer */}
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <StatFooter label="Sync Status" value={syncStatus} accent={syncStatus === 'COMPLETE'} />
            <StatFooter label="Network Load" value={`${taskCount?.toString() ?? '0'} Tasks`} />
            <StatFooter label="Mesh Integrity" value={`${meshIntegrity}%`} />
          </div>
        </div>

        {/* Metric cards — 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Escrow Locked */}
          <MetricCard
            label="Escrow Locked"
            icon={<Shield size={14} className="text-primary/60" />}
            value={
              escrowBalance
                ? `${parseFloat(escrowBalance.formatted).toFixed(2)} ${escrowBalance.symbol}`
                : '0.00 0G'
            }
            bar={{
              value: escrowBalance ? Math.min(parseFloat(escrowBalance.formatted) / 5, 1) : 0,
              color: 'bg-primary',
            }}
            shock={networkShock}
          />

          {/* Active Agents */}
          <MetricCard
            label="Active Agents"
            icon={<Users size={14} className="text-success/70" />}
            value={totalAgents.toString()}
            bar={{
              value: Math.min(totalAgents / 20, 1),
              color: 'bg-success',
              segments: Math.min(totalAgents, 8),
            }}
            shock={networkShock}
          />

          {/* Trust Health */}
          <div className={cn(
            'bg-surface-container border p-4 flex flex-col gap-3',
            networkShock ? 'border-danger/40' : 'border-border',
          )}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted">
                Mesh Stability
              </span>
              <Activity size={13} className={trustHealthColor} />
            </div>
            <p className={cn('text-2xl font-display font-bold', trustHealthColor)}>
              {trustHealth}
            </p>
            <p className="text-[9px] font-mono text-on-surface-dim leading-relaxed">
              {avgTrust > 0.8
                ? 'All protocol handshakes verified. Zero drift detected in sub-layer consensus.'
                : avgTrust > 0.5
                  ? 'Some agents operating below threshold. Monitoring active.'
                  : 'Multiple agents at risk. Slashing judge on standby.'}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Live Events + Critical Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Live Events Feed — 5 cols */}
        <div className="lg:col-span-5 bg-surface-container border border-border flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-on-surface">
                Live Events Feed
              </span>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-primary/70 border border-primary/20 px-2 py-0.5">
              + Streaming
            </span>
          </div>

          <div className="flex-1 divide-y divide-border overflow-y-auto max-h-[300px]">
            {events.length === 0 ? (
              <p className="text-[10px] font-mono text-on-surface-dim text-center py-10 uppercase tracking-widest">
                Waiting for 0G network events...
              </p>
            ) : (
              events.map((ev, i) => <EventRow key={i} event={ev} />)
            )}
          </div>
        </div>

        {/* Critical Agents — 7 cols */}
        <div className="lg:col-span-7 bg-surface-container border border-border flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-on-surface">
              Critical Agents
            </span>
            <Link
              href="/agents"
              className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-on-surface-muted hover:text-primary transition-colors border border-border px-2 py-1"
            >
              View All Directory <ChevronRight size={10} />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border">
            {topAgents.length === 0 ? (
              <p className="text-[10px] font-mono text-on-surface-dim text-center py-10 uppercase tracking-widest">
                Loading agents...
              </p>
            ) : (
              topAgents.map((agent: any) => (
                <CriticalAgentRow key={agent.id} agent={agent} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-border pt-3 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-on-surface-dim">
        <div className="flex items-center gap-4">
          <span>Network: {taskCount?.toString() ?? '0'} Tasks</span>
          <span>Protocol: v0.1.0-alpha</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('w-1.5 h-1.5 rounded-full', networkShock ? 'bg-danger animate-pulse' : 'bg-success')} />
          <span className={networkShock ? 'text-danger' : 'text-success'}>
            Status: {networkShock ? 'Alert' : 'Operational'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function StatFooter({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[8px] font-mono uppercase tracking-widest text-on-surface-dim mb-0.5">{label}</p>
      <p className={cn('text-sm font-mono font-bold uppercase', accent ? 'text-success' : 'text-on-surface')}>
        {value}
      </p>
    </div>
  );
}

function MetricCard({ label, icon, value, bar, shock }: {
  label: string;
  icon: React.ReactNode;
  value: string;
  bar: { value: number; color: string; segments?: number };
  shock?: boolean;
}) {
  return (
    <div className={cn(
      'bg-surface-container border p-4 flex flex-col gap-3',
      shock ? 'border-danger/40 animate-pulse' : 'border-border',
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-mono font-bold text-on-surface tabular-nums">{value}</p>
      {/* Progress bar */}
      {bar.segments ? (
        <div className="flex gap-0.5 h-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn('flex-1', i < (bar.segments ?? 0) ? bar.color : 'bg-surface-high')}
            />
          ))}
        </div>
      ) : (
        <div className="h-1 w-full bg-surface-high">
          <div className={cn('h-1 transition-all', bar.color)} style={{ width: `${bar.value * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: any }) {
  const isSlash = event.type === 'SLASH';
  const isTier = event.type === 'TIER_CHANGE';

  const label = isSlash
    ? 'Agent Slashed'
    : isTier
      ? 'Tier Updated'
      : event.type === 'TaskPosted'
        ? 'Task Posted'
        : 'Network Event';

  const desc = isSlash
    ? `Slash detected: ${event.raw.args?.agent?.slice(0, 10) ?? 'unknown'}`
    : isTier
      ? `Trust tier updated for ${event.raw.args?.agent?.slice(0, 10) ?? 'agent'}`
      : event.type === 'TaskPosted'
        ? `Task #${event.raw.args?.taskId?.toString()} posted by ${event.raw.args?.poster?.slice(0, 8)}`
        : 'Activity detected on 0G Network';

  return (
    <div className={cn('px-4 py-3 flex gap-3', isSlash && 'bg-danger/5')}>
      <div className="mt-0.5 flex-shrink-0">
        <div className={cn(
          'w-1.5 h-1.5 rounded-full mt-1',
          isSlash ? 'bg-danger' : isTier ? 'bg-warning' : 'bg-primary/60',
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {event.ts && (
            <span className="text-[8px] font-mono text-on-surface-dim">{event.ts}</span>
          )}
          <span className={cn(
            'text-[9px] font-mono font-bold uppercase tracking-widest',
            isSlash ? 'text-danger' : isTier ? 'text-warning' : 'text-primary/80',
          )}>
            {label}
          </span>
        </div>
        <p className="text-[10px] font-mono text-on-surface-muted leading-relaxed truncate">{desc}</p>
      </div>
    </div>
  );
}

function CriticalAgentRow({ agent }: { agent: any }) {
  const reliability = (agent.score * 100).toFixed(1);
  const status = agent.status === 'slashed'
    ? { label: 'SLASHED', cls: 'text-danger border-danger/30' }
    : agent.score > 0.8
      ? { label: 'STABLE',  cls: 'text-success border-success/30' }
      : { label: 'ACTIVE',  cls: 'text-primary border-primary/30' };

  const shortId = `${agent.id.slice(0, 12)}...${agent.id.slice(-4)}`.toUpperCase();

  return (
    <div className="px-4 py-3 flex items-center gap-4 hover:bg-surface-low transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono font-bold text-on-surface uppercase tracking-widest truncate mb-2">
          {shortId}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono uppercase tracking-widest text-on-surface-dim whitespace-nowrap">
            Reliability Index
          </span>
          <div className="flex-1 h-1 bg-surface-high min-w-[60px]">
            <div
              className={cn('h-1', agent.status === 'slashed' ? 'bg-danger' : 'bg-primary')}
              style={{ width: `${agent.score * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-on-surface tabular-nums">
            {reliability}%
          </span>
        </div>
      </div>
      <span className={cn(
        'text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border flex-shrink-0',
        status.cls,
      )}>
        {status.label}
      </span>
    </div>
  );
}
