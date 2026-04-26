'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Users, Zap, Activity, AlertTriangle } from 'lucide-react';
import { useReadContract, useBalance, useWatchContractEvent } from 'wagmi';
import { AGENT_REGISTRY_ABI, TASK_ESCROW_ABI, CONTRACT_ADDRESSES } from '@crucible/shared';
import { cn } from '@/lib/utils';
import AgentCard from './AgentCard';
import TaskCard from './TaskCard';
import { SectionHeader } from '@/components/ui';

export default function Arena() {
  const [agents, setAgents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [networkShock, setNetworkShock] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

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

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
    abi: TASK_ESCROW_ABI,
    onLogs(logs: any) {
      const log = logs[0];
      setEvents((prev) =>
        [{ type: log.eventName === 'AgentSlashed' ? 'SLASH' : log.eventName, raw: log }, ...prev].slice(0, 10),
      );
      if (log.eventName === 'AgentSlashed') {
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
        setEvents((prev) => [{ type: 'TIER_CHANGE', raw: log }, ...prev].slice(0, 10));
      }
    },
  });

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) throw new Error('Failed to fetch agents');
        setAgents(await res.json());
      } catch (err) {
        console.error('Failed to sync agent telemetry', err);
      }
    }
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Network shock banner */}
      <AnimatePresence>
        {networkShock && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:col-span-12 overflow-hidden"
          >
            <div className="p-3 bg-danger/10 border border-danger/30 flex items-center justify-center gap-3 animate-pulse">
              <AlertTriangle className="text-danger" size={16} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-danger">
                Emergency Alert: Agent Defection Detected · Initializing Slashing Judge
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Row */}
      <div className="lg:col-span-12 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
        <MetricCard
          title="Value Secured"
          value={`${escrowBalance ? Number(escrowBalance.formatted).toFixed(2) : '0.00'} ${escrowBalance?.symbol || '0G'}`}
          icon={<Shield size={16} className="text-primary/60" />}
          live
        />
        <MetricCard
          title="Active Agents"
          value={totalAgents?.toString() || '0'}
          icon={<Users size={16} className="text-success/70" />}
          shock={networkShock}
        />
        <MetricCard
          title="Tasks Pipeline"
          value={taskCount?.toString() || '0'}
          icon={<Zap size={16} className="text-primary/60" />}
        />
        <MetricCard
          title="Network Health"
          value={networkShock ? '92.4%' : '100%'}
          icon={<Activity size={16} className={networkShock ? 'text-danger' : 'text-success/70'} />}
          shock={networkShock}
        />
      </div>

      {/* Main Agent Grid */}
      <div className="lg:col-span-8">
        <SectionHeader
          title="Active Agent Network"
          subtitle="TEE Verified Nodes"
          action={
            <button
              onClick={() => setAdminMode(!adminMode)}
              className={cn(
                'px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors',
                adminMode
                  ? 'bg-danger/10 border-danger/30 text-danger'
                  : 'bg-transparent border-border text-on-surface-muted hover:text-on-surface',
              )}
            >
              {adminMode ? 'Exit Admin' : 'Admin Portal'}
            </button>
          }
        />

        {adminMode ? (
          <div className="bg-surface-container border border-danger/20 p-10 text-center">
            <Shield className="text-danger mx-auto mb-4" size={32} />
            <h3 className="text-sm font-display font-bold uppercase tracking-widest text-on-surface mb-2">
              Dispute Resolution Protocol
            </h3>
            <p className="text-xs font-mono text-on-surface-muted mb-6 max-w-md mx-auto">
              Moderator access enabled. View and resolve contested outcomes.
            </p>
            <div className="bg-surface-low border border-border p-4 text-xs font-mono text-on-surface-dim">
              No pending disputes found in active epoch.
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="py-20 bg-surface-container border border-border text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted animate-pulse">
              Scanning 0G Network
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-primary/60 mt-3">
              <div className="w-1 h-1 bg-primary animate-pulse" />
              Synchronizing INFT Signatures...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {agents.map((agent, i) => (
                <AgentCard key={agent.id || i} agent={agent} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Live Activity Feed */}
      <div className="lg:col-span-4 space-y-6">
        <div>
          <SectionHeader title="Live Verification" />
          <div className="bg-surface-container border border-border divide-y divide-border max-h-[360px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-[10px] font-mono text-center text-on-surface-dim py-8 uppercase tracking-widest">
                Waiting for 0G network events...
              </p>
            ) : (
              events.map((ev, i) => (
                <EventRow
                  key={i}
                  type={ev.type}
                  msg={
                    ev.type === 'TaskPosted'
                      ? `Task #${ev.raw.args?.taskId?.toString()} posted by ${ev.raw.args?.poster?.slice(0, 6)}`
                      : 'Activity on 0G Network'
                  }
                />
              ))
            )}
          </div>
        </div>

        <div>
          <SectionHeader title="Open Tasks" />
          <TaskCard />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, live, shock }: any) {
  return (
    <div
      className={cn(
        'bg-surface-container border p-4 relative',
        shock ? 'border-danger/40 animate-pulse' : 'border-border',
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="p-1.5 bg-surface-low border border-border">{icon}</div>
        {live && (
          <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-success/5 text-success border border-success/20 animate-pulse">
            Live
          </span>
        )}
      </div>
      <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted mb-1">{title}</p>
      <p className="text-xl font-mono font-bold text-on-surface tabular-nums">{value}</p>
    </div>
  );
}

function EventRow({ type, msg }: { type: string; msg: string }) {
  const isSlash = type === 'SLASH';
  return (
    <div className={`p-3 flex gap-3 text-xs ${isSlash ? 'bg-danger/5' : ''}`}>
      <div className="mt-0.5 flex-shrink-0">
        {isSlash ? (
          <AlertTriangle size={12} className="text-danger" />
        ) : (
          <Shield size={12} className="text-primary/60" />
        )}
      </div>
      <p className={`font-mono text-[10px] leading-relaxed ${isSlash ? 'text-danger' : 'text-on-surface-muted'}`}>
        {msg}
      </p>
    </div>
  );
}
