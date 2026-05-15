'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Cpu,
  Crosshair,
  Gauge,
  History,
  RadioTower,
  ShieldCheck,
  Trophy,
  Zap,
} from 'lucide-react';
import { Button, SyncIndicator, TierChip } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAgentsQuery } from '@/features/agents/queries';
import type { AgentTelemetry } from '@/features/agents/types';
import { rankOfAgent } from '@/features/agents/utils';
import { DataState } from '@/components/ui/DataState';

type AgentFilter = 'all' | 'elite' | 'active';

const FILTERS: Array<{ key: AgentFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'elite', label: 'Elite' },
  { key: 'active', label: 'Active' },
];

export default function AgentsPage() {
  const [filter, setFilter] = useState<AgentFilter>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const { data: agents = [], isLoading, isFetching, isError, refetch } = useAgentsQuery();

  const filteredAgents = useMemo(
    () =>
      agents.filter((agent) => {
        if (filter === 'elite') return agent.tier >= 3;
        if (filter === 'active') return agent.status === 'working' || agent.tasks > 0;
        return true;
      }),
    [agents, filter],
  );

  const selectedAgent = useMemo(() => {
    return (
      agents.find((agent) => agent.id === selectedAgentId) ?? filteredAgents[0] ?? agents[0] ?? null
    );
  }, [agents, filteredAgents, selectedAgentId]);

  useEffect(() => {
    if (!filteredAgents.length) {
      setSelectedAgentId(null);
      return;
    }

    if (!selectedAgentId || !filteredAgents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(filteredAgents[0].id);
    }
  }, [filteredAgents, selectedAgentId]);

  const commandStats = useMemo(() => {
    const total = agents.length;
    const active = agents.filter((agent) => agent.status === 'working' || agent.tasks > 0).length;
    const elite = agents.filter((agent) => agent.tier >= 3).length;
    const avgScore = total ? agents.reduce((sum, agent) => sum + agent.score, 0) / total : 0;

    return { total, active, elite, avgScore };
  }, [agents]);

  return (
    <div className="mx-auto w-full max-w-[1260px] pb-10">
      <header className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            <Crosshair size={13} />
            Roster // Agent Registry
            <SyncIndicator active={isFetching && !isLoading} label="Refreshing" />
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-on-surface md:text-5xl">
            Agent Registry
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-muted">
            Select an agent, review its trust history, and compare on-chain readiness.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border-strong/15 bg-surface-low shadow-[0_18px_44px_-34px_rgba(255,176,0,0.45)] sm:min-w-[430px]">
          <HudMetric label="Roster" value={commandStats.total.toString()} icon={Bot} />
          <HudMetric label="Active" value={commandStats.active.toString()} icon={RadioTower} />
          <HudMetric label="Avg Trust" value={formatPercent(commandStats.avgScore)} icon={Gauge} />
        </div>
      </header>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <TierStat label="Elite" value={commandStats.elite} tone="elite" />
          <TierStat
            label="Native INFT"
            value={agents.filter((agent) => agent.class === 'native').length}
            tone="secondary"
          />
          <TierStat
            label="External"
            value={agents.filter((agent) => agent.class !== 'native').length}
            tone="muted"
          />
        </div>

        <div className="flex rounded-lg border border-border bg-surface-low p-px">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                'min-h-10 px-4 font-mono text-[10px] uppercase tracking-widest transition-colors',
                filter === item.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-muted hover:text-on-surface',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <DataState
          tone="loading"
          title="Syncing Agent Registry"
          message="Reading agent telemetry."
        />
      ) : isError ? (
        <DataState
          tone="error"
          title="Registry Sync Failed"
          message="Unable to load agent telemetry from the registry endpoint."
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry Sync
            </Button>
          }
        />
      ) : !selectedAgent ? (
        <DataState title="No Agents Online" message="No registered agents are available yet." />
      ) : (
        <>
          <div className="grid grid-cols-12 items-stretch gap-5">
            <section className="panel-interactive col-span-12 h-full overflow-hidden rounded-lg border border-primary/25 bg-surface-low shadow-[0_22px_54px_-38px_rgba(255,213,151,0.34)] lg:col-span-5">
              <div className="relative flex h-full flex-col border-l-2 border-primary-muted/80 p-5 md:p-6">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-dim">
                      Agent ID
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-black text-on-surface">
                      {agentCallsign(selectedAgent)}
                    </h2>
                  </div>
                  <TierChip tier={selectedAgent.tier} />
                </div>

                <AgentPortrait agent={selectedAgent} className="lg:flex-1" />
              </div>
            </section>

            <section className="col-span-12 flex h-full flex-col gap-5 lg:col-span-7">
              <NeuralTimeline agent={selectedAgent} />
              <OperationPanel agent={selectedAgent} />
            </section>
          </div>

          <div className="mt-5 grid grid-cols-12 gap-5">
            <section className="panel-interactive col-span-12 rounded-lg border border-border-strong/15 bg-surface-low p-5 lg:col-span-5">
              <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
                <Activity size={15} className="text-primary" />
                Agent Capabilities
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.capabilities && selectedAgent.capabilities.length > 0 ? (
                  selectedAgent.capabilities.map((cap) => (
                    <div
                      key={cap}
                      className="rounded border border-primary/20 bg-primary/5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-primary"
                    >
                      {cap}
                    </div>
                  ))
                ) : (
                  <div className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                    No capabilities registered
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-5 border-t border-border-strong/10 pt-5">
                <MatrixBar
                  label="Trust Score"
                  value={selectedAgent.score}
                  display={formatPercent(selectedAgent.score)}
                />
                <MatrixBar
                  label="Task Experience"
                  value={Math.min(1, selectedAgent.tasks / 50)}
                  display={`${selectedAgent.tasks} Tasks`}
                  tone="primary"
                />
              </div>
            </section>

            <section className="panel-interactive col-span-12 rounded-lg border border-border-strong/15 bg-surface-low p-5 lg:col-span-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
                  <Trophy size={15} className="text-primary" />
                  Agent Ranking
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                  {filteredAgents.length} Listed
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredAgents.map((agent) => (
                  <RosterCard
                    key={agent.id}
                    agent={agent}
                    rank={rankOfAgent(agent, agents)}
                    isSelected={agent.id === selectedAgent.id}
                    onSelect={() => setSelectedAgentId(agent.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function HudMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="border-r border-border-strong/10 p-4 last:border-r-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
          {label}
        </span>
        <Icon size={14} className="text-primary/80" />
      </div>
      <p className="font-display text-xl font-black text-on-surface">{value}</p>
    </div>
  );
}

function TierStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'elite' | 'secondary' | 'muted';
}) {
  const toneClass = {
    elite: 'border-tier-elite/30 text-tier-elite',
    secondary: 'border-secondary/30 text-secondary',
    muted: 'border-border-strong/25 text-on-surface-muted',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded border bg-surface-low px-4 py-2',
        toneClass[tone],
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      <span className="font-mono text-base font-bold text-on-surface">{value}</span>
    </div>
  );
}

function OperatorChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border-strong/15 bg-surface/70 px-3 py-2 backdrop-blur">
      <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-on-surface-dim">{label}</p>
      <p className="mt-1 truncate font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
        {value}
      </p>
    </div>
  );
}

function AgentPortrait({ agent, className }: { agent: AgentTelemetry; className?: string }) {
  const seed = hashSeed(agent.id);
  const variant = getOperatorVariant(seed, agent);
  const isNative = agent.class === 'native';
  const isSlashed = agent.status === 'slashed';
  const isWorking = agent.status === 'working';

  return (
    <div
      className={cn(
        'relative min-h-[320px] overflow-hidden rounded-lg border border-border-strong/15 bg-[radial-gradient(circle_at_50%_18%,rgba(255,213,151,0.2),transparent_31%),linear-gradient(145deg,rgba(54,52,51,0.82),rgba(14,13,12,1)_70%)]',
        className,
      )}
    >
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,213,151,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,213,151,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-surface via-surface/82 to-transparent" />
      <div className="absolute left-0 top-0 h-full w-1 bg-primary-muted/80" />
      <svg
        viewBox="0 0 360 340"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[-8px] mx-auto h-full w-full text-on-surface"
      >
        <defs>
          <linearGradient id={`armor-${seed}`} x1="84" y1="46" x2="276" y2="324">
            <stop stopColor="rgb(var(--surface-highest))" stopOpacity="0.96" />
            <stop offset="0.48" stopColor="rgb(var(--surface-high))" stopOpacity="0.84" />
            <stop offset="1" stopColor="rgb(var(--surface-container))" stopOpacity="0.96" />
          </linearGradient>
          <radialGradient id={`core-${seed}`} cx="50%" cy="45%" r="50%">
            <stop stopColor={variant.glow} stopOpacity="0.55" />
            <stop offset="1" stopColor={variant.glow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M33 311 80 247l39-10 31 28h60l31-28 39 10 47 64Z"
          fill={`url(#armor-${seed})`}
          opacity="0.92"
        />
        <path d={variant.shoulders} fill="rgb(var(--surface-highest))" opacity="0.74" />
        <path d="M126 253h108l24 58H102Z" fill="rgb(var(--surface-container))" opacity="0.96" />
        <path d={variant.helmet} fill="rgb(var(--surface-highest))" opacity="0.88" />
        <path d={variant.faceplate} fill="rgb(var(--surface))" opacity="0.92" />
        <path
          d={variant.visor}
          fill="none"
          stroke={variant.glow}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isSlashed ? '0.42' : '0.82'}
        />
        <path d="M116 96 86 67M244 96l30-29" stroke={variant.glow} strokeWidth="3" opacity="0.38" />
        <path
          d="M107 251 55 303M253 251l52 52M128 271h104M112 295h136"
          fill="none"
          stroke={isSlashed ? 'rgb(var(--danger))' : variant.glow}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx="180" cy="229" r="34" fill={`url(#core-${seed})`} />
        <circle
          cx="180"
          cy="229"
          r="19"
          fill="none"
          stroke={variant.glow}
          strokeWidth="4"
          opacity="0.78"
        />
        <path
          d="M168 229h24M180 217v24"
          fill="none"
          stroke={variant.glow}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
      <div className="absolute left-5 top-5 max-w-[68%] border-l-2 border-primary-muted pl-4">
        <p className="font-mono text-[9px] uppercase tracking-widest text-primary-muted">
          {variant.name} Shell
        </p>
        <p className="mt-1 truncate font-mono text-sm font-bold uppercase tracking-widest text-on-surface">
          {shortAddress(agent.id)}
        </p>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.18em] text-on-surface-dim">
          {isNative ? 'Native INFT Identity' : 'External Agent Identity'}
        </p>
      </div>
      <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded bg-primary-muted text-on-primary shadow-[0_16px_28px_-22px_rgba(255,213,151,0.95)]">
        <ShieldCheck size={19} />
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded border border-border-strong/20 bg-surface/90 p-4 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.9)] backdrop-blur">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-widest text-secondary">
              Trust Score
            </p>
            <p className="mt-1 font-display text-3xl font-black text-on-surface">
              {formatPercent(agent.score)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
              Min Stake
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-primary">
              {formatStake(agent.minStake)}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <OperatorChip label="Class" value={isNative ? 'INFT' : 'EXT'} />
          <OperatorChip
            label="State"
            value={isSlashed ? 'Damaged' : isWorking ? 'Live' : 'Ready'}
          />
          <OperatorChip label="Tier" value={`T${agent.tier}`} />
        </div>
      </div>
    </div>
  );
}

function ScannerChip({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: string;
  tone?: 'secondary' | 'danger' | 'muted';
}) {
  const toneClass = {
    secondary: 'border-secondary/25 text-secondary',
    danger: 'border-danger/25 text-danger',
    muted: 'border-border-strong/15 text-on-surface-muted',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded border bg-surface/45 px-3 py-2 font-mono uppercase tracking-widest',
        toneClass[tone],
      )}
    >
      <span className="text-[8px] text-on-surface-dim">{label}</span>
      <span className="text-[10px] font-bold">{value}</span>
    </div>
  );
}

function NeuralTimeline({ agent }: { agent: AgentTelemetry }) {
  const cycle = agent.window.slice(-12);
  const hasCycle = cycle.length > 0;
  const pulses = hasCycle ? cycle : Array.from({ length: 12 }, () => null);
  const readiness = Math.round(agent.score * 100);
  const failures = cycle.filter((item) => item === 0).length;
  const successes = cycle.filter((item) => item === 1).length;

  return (
    <section className="panel-interactive overflow-hidden rounded-lg border border-border-strong/15 bg-surface-low">
      <div className="relative p-5 md:p-6">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(113,215,205,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(113,215,205,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute inset-y-0 left-0 w-1 bg-secondary/70" />

        <div className="relative mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
              <Zap size={15} className="text-secondary" />
              Trust History
            </div>
            <p className="max-w-md text-xs leading-relaxed text-on-surface-dim">
              {hasCycle
                ? 'Recent task results from stored trust history.'
                : 'No completed task history yet. This agent is waiting for its first verified task.'}
            </p>
          </div>

          <div className="grid grid-cols-[auto_auto] items-center gap-4">
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full border border-secondary/20"
              style={{
                background: `conic-gradient(rgb(var(--secondary)) ${readiness}%, rgb(var(--surface-high)) ${readiness}% 100%)`,
              }}
            >
              <div className="absolute inset-2 rounded-full bg-surface-low" />
              <div className="relative text-center">
                <p className="font-display text-2xl font-black text-secondary">{readiness}</p>
                <p className="font-mono text-[8px] uppercase tracking-widest text-on-surface-dim">
                  Ready
                </p>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <p className="font-mono text-[9px] uppercase tracking-widest text-secondary">
                Current Score
              </p>
              <p className="font-display text-3xl font-black text-secondary">
                {formatPercent(agent.score)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative min-h-40 overflow-hidden rounded border border-border-strong/15 bg-surface/45 p-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent readout-pulse" />
            <div className="absolute inset-y-0 left-1/3 w-px bg-secondary/10" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-secondary/10" />

            <div className="grid h-28 grid-cols-12 items-end gap-2">
              {pulses.map((result, index) => {
                const success = result === 1;
                const idle = result === null;
                const height = idle ? 38 + (index % 4) * 8 : success ? 64 + ((index * 9) % 28) : 34;

                return (
                  <div
                    key={`${result ?? 'idle'}-${index}`}
                    className="group/pulse flex h-full items-end"
                    title={
                      idle
                        ? 'Waiting for task result'
                        : success
                          ? 'Verification passed'
                          : 'Verification failed'
                    }
                  >
                    <div
                      className={cn(
                        'relative w-full rounded-t border transition-all duration-300 group-hover/pulse:brightness-125',
                        idle
                          ? 'border-border-strong/10 bg-surface-high/70'
                          : success
                            ? 'bar-live border-secondary/20 bg-gradient-to-t from-secondary/35 to-secondary/90'
                            : 'border-danger/20 bg-gradient-to-t from-danger/35 to-danger/85',
                      )}
                      style={{ height: `${height}%` }}
                    >
                      <span
                        className={cn(
                          'absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full',
                          idle ? 'bg-on-surface-dim/45' : success ? 'bg-secondary' : 'bg-danger',
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-between font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
              <span>T-12</span>
              <span>{hasCycle ? 'Task Results' : 'No History'}</span>
              <span>Current</span>
            </div>
          </div>

          <div className="grid gap-2">
            <ScannerChip label="Sync" value={agent.status === 'working' ? 'Live' : 'Standby'} />
            <ScannerChip label="Pass" value={successes.toString()} tone="secondary" />
            <ScannerChip
              label="Fail"
              value={failures.toString()}
              tone={failures ? 'danger' : 'muted'}
            />
            <ScannerChip label="Cycle" value={hasCycle ? `${cycle.length}/12` : '0/12'} />
          </div>
        </div>
      </div>
    </section>
  );
}

function OperationPanel({ agent }: { agent: AgentTelemetry }) {
  const events = buildOperationEvents(agent);

  return (
    <section className="panel-interactive rounded-lg border border-border-strong/15 bg-surface-low p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
          <History size={15} className="text-primary-muted" />
          Task Result Log
        </div>
        <span className="rounded-full bg-surface-high px-3 py-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-dim">
          Recent
        </span>
      </div>

      <div className="space-y-3">
        {events.length ? (
          events.map((event, index) => (
            <div
              key={`${event.label}-${index}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded bg-surface-container/60 p-3 transition-colors hover:bg-surface-container"
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded border',
                  event.success
                    ? 'border-secondary/25 bg-secondary/10 text-secondary'
                    : 'border-danger/25 bg-danger/10 text-danger',
                )}
              >
                {event.success ? <ShieldCheck size={17} /> : <AlertTriangle size={17} />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-on-surface">
                  {event.label}
                </p>
                <p className="mt-1 text-xs text-on-surface-dim">{event.detail}</p>
              </div>
              <span
                className={cn(
                  'font-mono text-[9px] font-bold uppercase tracking-widest',
                  event.success ? 'text-secondary' : 'text-danger',
                )}
              >
                {event.success ? 'Passed' : 'Slashed'}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded border border-dashed border-border-strong/25 bg-surface-container/35 px-4 py-8 text-center font-mono text-[10px] uppercase tracking-widest text-on-surface-dim">
            Waiting for task history
          </div>
        )}
      </div>

      <Link
        href={`/agents/${encodeURIComponent(agent.id)}`}
        className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded border border-border-strong/25 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted transition-colors hover:border-primary/40 hover:text-primary"
      >
        Open Full Agent Record <ArrowUpRight size={12} />
      </Link>
    </section>
  );
}

function MatrixBar({
  label,
  value,
  display,
  tone = 'primaryMuted',
}: {
  label: string;
  value: number;
  display: string;
  tone?: 'primary' | 'primaryMuted' | 'secondary';
}) {
  const colorClass = {
    primary: 'bg-primary',
    primaryMuted: 'bg-primary-muted',
    secondary: 'bg-secondary',
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
          {label}
        </span>
        <span className="font-mono text-xs font-bold text-primary-muted">{display}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-high">
        <div
          className={cn(
            'bar-live h-full rounded-full transition-[width] duration-500',
            colorClass[tone],
          )}
          style={{ width: `${Math.max(5, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  );
}

function RosterCard({
  agent,
  rank,
  isSelected,
  onSelect,
}: {
  agent: AgentTelemetry;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isSlashed = agent.status === 'slashed';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded border p-3 text-left transition-all duration-200',
        isSelected
          ? 'border-primary/60 bg-primary/10 shadow-[0_16px_34px_-28px_rgba(255,176,0,0.8)]'
          : 'border-border-strong/15 bg-surface-container/50 hover:border-primary/30 hover:bg-surface-container',
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded border border-border-strong/20 bg-surface-highest">
        {isSlashed ? (
          <AlertTriangle size={17} className="text-danger" />
        ) : (
          <Cpu size={17} className={isSelected ? 'text-primary' : 'text-secondary'} />
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
            Rank {rank.toString().padStart(2, '0')}
          </span>
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              agent.status === 'working' ? 'bg-primary' : isSlashed ? 'bg-danger' : 'bg-secondary',
            )}
          />
        </div>
        <p className="truncate font-mono text-xs font-bold uppercase tracking-widest text-on-surface transition-colors group-hover:text-primary">
          {shortAddress(agent.id)}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
          {agent.class === 'native' ? 'Native INFT' : 'External Agent'} / {agent.tasks} Tasks
        </p>
      </div>

      <div className="text-right">
        <p
          className={cn(
            'font-mono text-sm font-bold',
            isSlashed ? 'text-danger' : 'text-secondary',
          )}
        >
          {formatPercent(agent.score)}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
          T{agent.tier}
        </p>
      </div>
    </button>
  );
}

function buildOperationEvents(agent: AgentTelemetry) {
  return agent.window
    .slice(-3)
    .reverse()
    .map((result, index) => ({
      success: result === 1,
      label: `Verification Cycle ${agent.window.length - index}`,
      detail:
        result === 1
          ? 'Criteria check accepted by trust history.'
          : 'Failure recorded in trust history.',
    }));
}

function _recentIntegrity(window: number[]) {
  if (!window.length) return 0;
  return window.reduce((sum, result) => sum + (result === 1 ? 1 : 0), 0) / window.length;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatStake(value?: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'N/A';
  return `${amount.toFixed(amount >= 1 ? 2 : 3)} 0G`;
}

function shortAddress(value: string) {
  if (!value || value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function agentCallsign(agent: AgentTelemetry) {
  return agent.id.startsWith('0x') ? `AG-${agent.id.slice(2, 6).toUpperCase()}` : agent.id;
}

function getOperatorVariant(seed: number, agent: AgentTelemetry) {
  const glow =
    agent.status === 'slashed'
      ? 'rgb(var(--danger))'
      : agent.class === 'native'
        ? 'rgb(var(--primary-muted))'
        : 'rgb(var(--secondary))';
  const variants = [
    {
      name: 'Vanguard',
      shoulders: 'M86 270 125 218h110l39 52h-55l-22-20h-34l-22 20Z',
      helmet: 'M126 76c13-18 31-27 54-27s41 9 54 27l-10 91c-13 22-28 34-44 34s-31-12-44-34Z',
      faceplate: 'M132 116h96l-10 46c-13 13-25 20-38 20s-25-7-38-20Z',
      visor: 'M144 123h72M138 145c27 18 57 18 84 0',
    },
    {
      name: 'Oracle',
      shoulders: 'M72 282 116 226l36 18h56l36-18 44 56h-64l-24-17h-40l-24 17Z',
      helmet: 'M120 96c9-29 29-44 60-44s51 15 60 44l-17 78c-14 20-28 30-43 30s-29-10-43-30Z',
      faceplate: 'M140 105h80l-15 61c-8 11-16 17-25 17s-17-6-25-17Z',
      visor: 'M152 130c10-15 46-15 56 0M160 151h40',
    },
    {
      name: 'Relay',
      shoulders: 'M62 304 115 238l65 28 65-28 53 66h-70l-48-20-48 20Z',
      helmet: 'M118 92 180 48l62 44-13 86c-16 18-32 27-49 27s-33-9-49-27Z',
      faceplate: 'M142 106h76l-12 59-26 18-26-18Z',
      visor: 'M151 134h58M170 152h20',
    },
    {
      name: 'Forge',
      shoulders: 'M48 304 96 236h50l34 32 34-32h50l48 68h-76l-28-22h-56l-28 22Z',
      helmet: 'M124 84c16-20 34-30 56-30s40 10 56 30l-8 86c-15 21-31 32-48 32s-33-11-48-32Z',
      faceplate: 'M137 112h86l-8 58c-11 12-23 18-35 18s-24-6-35-18Z',
      visor: 'M148 128h64M142 149h76',
    },
  ];

  return { ...variants[seed % variants.length], glow };
}

function hashSeed(value: string) {
  return value.split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 997, 7);
}
