'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronRight,
  Copy,
  Database,
  FileText,
  Gauge,
  Hexagon,
  Layers3,
  Loader2,
  Plus,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatEther } from 'viem';
import { TaskStatus } from '@crucible/shared';
import PostTaskForm from '@/components/PostTaskForm';
import { cn } from '@/lib/utils';

type TaskCategory = 'open' | 'verifying' | 'completed';

type EscrowTask = {
  id: number;
  poster: `0x${string}`;
  totalPayment: bigint;
  deadline: bigint;
  status: number;
  criteriaHash: `0x${string}`;
  criteriaURI: string;
  isSequential: boolean;
  assignedAgents: `0x${string}`[];
  agentStakes: bigint[];
  submittedCount: number;
};

export type TaskApiTask = {
  id: number;
  poster: string;
  totalPayment: string;
  deadline: string;
  status: number;
  criteriaHash: string;
  criteriaURI: string;
  isSequential: boolean;
  assignedAgents: string[];
  agentStakes: string[];
  submittedCount: number;
  auditReport?: any;
};

export type TaskApiResponse = {
  taskCount: number;
  protocol: {
    protocolFeePercent: string;
    defaultDisputeWindow: string;
    slashingJudge: string;
    assignmentEngine: string;
  };
  tasks: TaskApiTask[];
};

const TASK_STATUS_META: Record<
  number,
  {
    label: string;
    category: TaskCategory;
    tone: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    description: string;
  }
> = {
  [TaskStatus.OPEN]: {
    label: 'Open',
    category: 'open',
    tone: 'primary',
    description: 'Awaiting assignment engine',
  },
  [TaskStatus.ASSIGNED]: {
    label: 'Assigned',
    category: 'open',
    tone: 'secondary',
    description: 'Agents locked and ready',
  },
  [TaskStatus.IN_PIPELINE]: {
    label: 'In Pipeline',
    category: 'open',
    tone: 'secondary',
    description: 'Sequential execution active',
  },
  [TaskStatus.VERIFYING]: {
    label: 'Verifying',
    category: 'verifying',
    tone: 'warning',
    description: 'Waiting for judge resolution',
  },
  [TaskStatus.COMPLETED]: {
    label: 'Completed',
    category: 'completed',
    tone: 'success',
    description: 'Escrow resolved',
  },
  [TaskStatus.PARTIALLY_COMPLETED]: {
    label: 'Partial',
    category: 'completed',
    tone: 'warning',
    description: 'Resolved with failed agents',
  },
  [TaskStatus.DISPUTED]: {
    label: 'Disputed',
    category: 'completed',
    tone: 'danger',
    description: 'Poster dispute active',
  },
  [TaskStatus.FAILED]: {
    label: 'Failed',
    category: 'completed',
    tone: 'danger',
    description: 'Escrow returned or failed',
  },
};

const FILTERS: Array<{ key: TaskCategory; label: string }> = [
  { key: 'open', label: 'Open' },
  { key: 'verifying', label: 'Verifying' },
  { key: 'completed', label: 'Completed' },
];

const CREATE_ESCROW_MODAL_ID = 'create-escrow-task';

type TaskEscrowScreenProps = {
  initialData: TaskApiResponse;
  initialFilter?: TaskCategory;
  initialSelectedTaskId?: number | null;
};

export default function TaskEscrowScreen({
  initialData,
  initialFilter = 'open',
  initialSelectedTaskId = null,
}: TaskEscrowScreenProps) {
  const [activeFilter, setActiveFilter] = useState<TaskCategory>(initialFilter);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(initialSelectedTaskId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, error, isLoading, refetch } = useQuery<TaskApiResponse>({
    queryKey: ['escrow-tasks'],
    initialData,
    refetchInterval: 10000,
    staleTime: 5000,
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  const tasks = useMemo<EscrowTask[]>(
    () =>
      (data?.tasks ?? []).map((task) => ({
        id: task.id,
        poster: task.poster as `0x${string}`,
        totalPayment: BigInt(task.totalPayment),
        deadline: BigInt(task.deadline),
        status: task.status,
        criteriaHash: task.criteriaHash as `0x${string}`,
        criteriaURI: task.criteriaURI,
        isSequential: task.isSequential,
        assignedAgents: task.assignedAgents as `0x${string}`[],
        agentStakes: task.agentStakes.map((stake) => BigInt(stake)),
        submittedCount: task.submittedCount,
      })),
    [data?.tasks],
  );

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (initialSelectedTaskId !== null) setSelectedTaskId(initialSelectedTaskId);
  }, [initialSelectedTaskId]);

  useEffect(() => {
    if (!tasks.length) {
      setSelectedTaskId(null);
      return;
    }

    if (selectedTaskId === null || !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [selectedTaskId, tasks]);

  const selectedTask = useMemo(() => {
    return tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  }, [selectedTaskId, tasks]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => getTaskMeta(task.status).category === activeFilter),
    [activeFilter, tasks],
  );

  const taskCounts = useMemo(() => {
    return FILTERS.reduce(
      (acc, filter) => ({
        ...acc,
        [filter.key]: tasks.filter((task) => getTaskMeta(task.status).category === filter.key)
          .length,
      }),
      {} as Record<TaskCategory, number>,
    );
  }, [tasks]);

  const copiedCriteria = () => {
    const criteriaURI = selectedTask?.criteriaURI;
    if (!criteriaURI) return;

    const copyWithTextarea = () => {
      const textarea = document.createElement('textarea');
      textarea.value = criteriaURI;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    };

    copyWithTextarea();
    void navigator.clipboard?.writeText(criteriaURI).catch(copyWithTextarea);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    if (window.location.hash === `#${CREATE_ESCROW_MODAL_ID}`) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  const loading = isLoading;

  return (
    <div className="mx-auto w-full max-w-[1260px]">
      <header className="mb-8">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            <Hexagon size={13} />
            Crucible Hub / Escrow Registry
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-on-surface md:text-5xl">
            Escrow Coordination
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-muted">
            Task escrow, agent assignment, verification status, and locked collateral pulled from
            the TaskEscrow contract.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-12 items-start gap-5">
        <div className="col-span-12 space-y-5 xl:col-span-8">
          <section
            id="escrow-detail"
            className="panel-interactive relative scroll-mt-24 overflow-hidden rounded-lg border border-primary/25 bg-surface-low shadow-[0_18px_42px_-32px_rgba(255,213,151,0.26)] before:absolute before:bottom-0 before:right-0 before:h-24 before:w-24 before:bg-[linear-gradient(135deg,transparent_42%,rgba(255,213,151,0.07)_42%,rgba(255,213,151,0.07)_54%,transparent_54%)]"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-primary-muted" />
            {loading ? (
              <LoadingPanel />
            ) : selectedTask ? (
              <div className="relative p-5 md:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded border border-border-strong/20 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                        {taskIdentity(selectedTask)}
                      </span>
                      <StatusBadge status={selectedTask.status} withLabel />
                    </div>
                    <h2 className="font-display text-2xl font-black tracking-tight text-on-surface">
                      {taskHeading(selectedTask)}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-muted">
                      Criteria {shortHash(selectedTask.criteriaHash)} from poster{' '}
                      {shortAddress(selectedTask.poster)}.{' '}
                      {getTaskMeta(selectedTask.status).description}.
                    </p>
                  </div>
                </div>

                <div className="mb-5 grid gap-3 md:grid-cols-3">
                  <HeroMetric
                    label="Total Payout"
                    value={formatTokenAmount(selectedTask.totalPayment)}
                  />
                  <HeroMetric
                    label="Combined Stakes"
                    value={formatTokenAmount(sumBigints(selectedTask.agentStakes))}
                    accent="secondary"
                  />
                  <HeroMetric label="Deadline" value={formatDeadline(selectedTask.deadline)} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`#${CREATE_ESCROW_MODAL_ID}`}
                    onClick={openCreateModal}
                    className="inline-flex min-h-11 items-center justify-center rounded bg-primary px-6 font-display text-sm font-black text-on-primary transition-colors hover:bg-primary-muted"
                  >
                    Engage Escrow Protocol
                  </a>
                  <button
                    type="button"
                    onClick={copiedCriteria}
                    disabled={!selectedTask.criteriaURI}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-primary/30 bg-primary/5 px-4 font-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:border-primary/60 hover:bg-primary/10"
                  >
                    <Copy size={12} />
                    {copied
                      ? 'Copied URI'
                      : selectedTask.criteriaURI
                        ? 'Copy Criteria URI'
                        : 'No Criteria URI'}
                  </button>
                </div>
              </div>
            ) : (
              <EmptyPanel onCreate={openCreateModal} />
            )}
          </section>

          <section
            id="escrow-registry"
            className="panel-interactive scroll-mt-24 overflow-hidden rounded-lg border border-border-strong/15 bg-surface-low shadow-[0_18px_44px_-32px_rgba(255,213,151,0.2)]"
          >
            <div className="flex flex-col gap-4 border-b border-border-strong/10 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
                  <FileText size={14} className="text-primary" />
                  Escrow Registry
                </div>
                <p className="mt-1 text-xs text-on-surface-dim">
                  Latest tasks from the TaskEscrow contract.
                </p>
              </div>

              <div className="flex rounded border border-border bg-surface p-px">
                {FILTERS.map((filter) => (
                  <a
                    key={filter.key}
                    href={`/tasks?filter=${filter.key}${
                      selectedTask ? `&task=${selectedTask.id}` : ''
                    }#escrow-registry`}
                    onClick={() => {
                      setActiveFilter(filter.key);
                      const nextTask = tasks.find(
                        (task) => getTaskMeta(task.status).category === filter.key,
                      );
                      if (nextTask) setSelectedTaskId(nextTask.id);
                    }}
                    className={cn(
                      'px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors',
                      activeFilter === filter.key
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-muted hover:text-on-surface',
                    )}
                  >
                    {filter.label} {taskCounts[filter.key] ?? 0}
                  </a>
                ))}
              </div>
            </div>

            <TaskRegistry
              tasks={filteredTasks}
              selectedTaskId={selectedTaskId}
              isLoading={loading}
              error={error}
              activeFilter={activeFilter}
              onSelect={setSelectedTaskId}
            />
          </section>
        </div>

        <aside className="col-span-12 space-y-5 xl:col-span-4">
          <EscrowHealthPanel task={selectedTask} />
          <ProtocolPanel
            protocolFee={data?.protocol.protocolFeePercent}
            disputeWindow={data?.protocol.defaultDisputeWindow}
            slashingJudge={data?.protocol.slashingJudge as `0x${string}` | undefined}
            assignmentEngine={data?.protocol.assignmentEngine as `0x${string}` | undefined}
          />
          <AgentPoolPanel task={selectedTask} onCreate={openCreateModal} />
        </aside>
      </div>

      <EscrowModal
        id={CREATE_ESCROW_MODAL_ID}
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
      >
        <PostTaskForm
          onPosted={() => {
            refetch();
            closeCreateModal();
          }}
        />
      </EscrowModal>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'primary' | 'secondary';
}) {
  return (
    <div className="rounded bg-surface/45 p-3.5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-xl font-black tracking-tight text-on-surface md:text-2xl',
          accent === 'primary' && 'text-primary-muted',
          accent === 'secondary' && 'text-secondary',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-8">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
        <Loader2 size={16} className="animate-spin text-primary" />
        Reading escrow contract
      </div>
    </div>
  );
}

function EmptyPanel({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative flex min-h-[320px] items-center justify-center p-8 text-center">
      <div>
        <Database size={22} className="mx-auto mb-4 text-on-surface-dim" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
          No task has been posted yet
        </p>
        <a
          href={`#${CREATE_ESCROW_MODAL_ID}`}
          onClick={onCreate}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded bg-primary px-6 font-display text-sm font-black text-on-primary transition-colors hover:bg-primary-muted"
        >
          Engage Escrow Protocol
        </a>
      </div>
    </div>
  );
}

function EscrowHealthPanel({ task }: { task: EscrowTask | null }) {
  const totalStake = task ? sumBigints(task.agentStakes) : 0n;
  const coverage =
    task && task.totalPayment > 0n
      ? Math.round((Number(formatEther(totalStake)) / Number(formatEther(task.totalPayment))) * 100)
      : 0;
  const displayCoverage = task?.assignedAgents.length ? `${coverage}%` : 'Pending';
  const ringValue = task?.assignedAgents.length ? Math.min(100, Math.max(0, coverage)) : 12;

  return (
    <section className="panel-interactive rounded-lg border border-border-strong/15 bg-surface-low p-5 shadow-[0_18px_40px_-30px_rgba(255,213,151,0.2)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
          Risk Profile
        </p>
        <Gauge size={20} className="text-primary/45" />
      </div>

      <div
        className="mx-auto flex h-40 w-40 items-center justify-center rounded-full p-2"
        style={{
          background: `conic-gradient(rgb(var(--primary-muted)) ${ringValue}%, rgba(230,226,223,0.08) 0)`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-surface-low">
          <p className="font-display text-2xl font-black tracking-tight text-on-surface">
            {displayCoverage}
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
            Stake Cover
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-relaxed text-on-surface-muted">
        {task?.assignedAgents.length
          ? 'Stake coverage is derived from assigned agent collateral against the escrow bounty.'
          : 'Risk profile appears after the assignment engine locks agent collateral.'}
      </p>
    </section>
  );
}

function ProtocolPanel({
  protocolFee,
  disputeWindow,
  slashingJudge,
  assignmentEngine,
}: {
  protocolFee?: string;
  disputeWindow?: string;
  slashingJudge?: `0x${string}`;
  assignmentEngine?: `0x${string}`;
}) {
  return (
    <section className="panel-interactive rounded-lg border border-border-strong/15 bg-surface-low p-5 shadow-[0_18px_40px_-30px_rgba(255,213,151,0.18)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
            Staking Criteria
          </p>
          <p className="mt-1 text-xs text-on-surface-dim">Contract parameters</p>
        </div>
        <ShieldAlert size={20} className="text-primary/45" />
      </div>

      <div className="space-y-4">
        <ProtocolRow label="Protocol Fee" value={protocolFee ? `${protocolFee}%` : '-'} />
        <ProtocolRow
          label="Dispute Window"
          value={disputeWindow ? formatDuration(Number(disputeWindow)) : '-'}
        />
        <ProtocolRow
          label="Slashing Judge"
          value={slashingJudge ? shortAddress(slashingJudge) : '-'}
        />
        <ProtocolRow
          label="Assignment Engine"
          value={assignmentEngine ? shortAddress(assignmentEngine) : '-'}
        />
      </div>
    </section>
  );
}

function ProtocolRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-strong/10 pb-3 last:border-b-0 last:pb-0">
      <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
        {label}
      </span>
      <span className="break-all text-right font-mono text-xs font-bold text-on-surface">
        {value}
      </span>
    </div>
  );
}

function AgentPoolPanel({ task, onCreate }: { task: EscrowTask | null; onCreate: () => void }) {
  return (
    <section className="panel-interactive rounded-lg border border-border-strong/15 bg-surface-low p-5 shadow-[0_18px_40px_-30px_rgba(255,213,151,0.18)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
            Agent Pool Ready
          </p>
          <p className="mt-1 text-xs text-on-surface-dim">
            {task ? `${task.assignedAgents.length} assigned nodes` : 'No task selected'}
          </p>
        </div>
        <a
          href={`#${CREATE_ESCROW_MODAL_ID}`}
          onClick={onCreate}
          aria-label="Create escrow task"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-primary/35 bg-primary text-on-primary shadow-[0_10px_22px_-14px_rgba(255,176,0,0.85)] transition-transform hover:scale-105"
        >
          <Plus size={18} strokeWidth={2.5} />
        </a>
      </div>

      {task?.assignedAgents.length ? (
        <div className="space-y-3">
          {task.assignedAgents.slice(0, 4).map((agent, index) => (
            <div key={agent} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-secondary/20 bg-secondary/5 text-secondary">
                <Activity size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-bold uppercase tracking-wider text-on-surface">
                  {shortAddress(agent)}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-dim">
                  Stake {formatTokenAmount(task.agentStakes[index] ?? 0n)}
                </p>
              </div>
              <span className="rounded border border-secondary/20 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-secondary">
                Locked
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-border p-5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
            Waiting for assignment
          </p>
        </div>
      )}
    </section>
  );
}

function EscrowModal({
  children,
  id,
  isOpen,
  onClose,
}: {
  children: React.ReactNode;
  id: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <div
      id={id}
      data-open={isOpen ? 'true' : undefined}
      className="escrow-modal-shell fixed inset-0 z-[140] items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create escrow task"
        className="relative max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border-strong/30 bg-surface shadow-[0_28px_90px_-38px_rgba(255,213,151,0.45)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <a
          href="#"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded border border-border bg-surface-low text-on-surface-muted transition-colors hover:border-primary/50 hover:text-primary"
        >
          <X size={15} />
        </a>
        <div className="p-2">{children}</div>
      </div>
    </div>
  );
}

function TaskRegistry({
  tasks,
  selectedTaskId,
  isLoading,
  error,
  activeFilter,
  onSelect,
}: {
  tasks: EscrowTask[];
  selectedTaskId: number | null;
  isLoading: boolean;
  error: unknown;
  activeFilter: TaskCategory;
  onSelect: (id: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[310px] items-center justify-center">
        <Loader2 size={18} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[310px] items-center justify-center p-8 text-center">
        <div>
          <XCircle size={20} className="mx-auto mb-4 text-danger" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-danger">
            Unable to sync escrow contract
          </p>
        </div>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex min-h-[310px] items-center justify-center p-8 text-center">
        <div>
          <Layers3 size={20} className="mx-auto mb-4 text-on-surface-dim" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
            No tasks in this lane
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-strong/10">
      {tasks.map((task) => {
        const meta = getTaskMeta(task.status);
        const selected = selectedTaskId === task.id;
        return (
          <a
            key={task.id}
            href={`/tasks?filter=${activeFilter}&task=${task.id}#escrow-detail`}
            onClick={() => onSelect(task.id)}
            className={cn(
              'group grid w-full gap-4 p-5 text-left transition-colors hover:bg-surface md:grid-cols-[1.2fr_0.75fr_0.75fr_auto]',
              selected && 'bg-primary/5',
            )}
          >
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    meta.tone === 'secondary' || meta.tone === 'success'
                      ? 'bg-secondary'
                      : meta.tone === 'danger'
                        ? 'bg-danger'
                        : 'bg-primary',
                  )}
                />
                <p className="truncate font-mono text-xs font-bold uppercase tracking-widest text-on-surface group-hover:text-primary">
                  {taskIdentity(task)}
                </p>
              </div>
              <p className="break-all font-mono text-[10px] uppercase tracking-wider text-on-surface-dim">
                {shortHash(task.criteriaHash)}
              </p>
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                Escrow
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-on-surface">
                {formatTokenAmount(task.totalPayment)}
              </p>
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                Agents
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-on-surface">
                {task.assignedAgents.length || 'None'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 md:justify-end">
              <StatusBadge status={task.status} />
              <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim transition-colors group-hover:text-primary">
                View
              </span>
              <ChevronRight
                size={14}
                className="text-on-surface-dim transition-colors group-hover:text-primary"
              />
            </div>
          </a>
        );
      })}
    </div>
  );
}

function StatusBadge({ status, withLabel = false }: { status: number; withLabel?: boolean }) {
  const meta = getTaskMeta(status);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest',
        meta.tone === 'secondary' && 'border-secondary/30 bg-secondary/5 text-secondary',
        meta.tone === 'success' && 'border-secondary/30 bg-secondary/5 text-secondary',
        meta.tone === 'warning' && 'border-primary/35 bg-primary/5 text-primary',
        meta.tone === 'danger' && 'border-danger/30 bg-danger/5 text-danger',
        meta.tone === 'primary' && 'border-primary/35 bg-primary/5 text-primary',
      )}
    >
      {withLabel ? `Status: ${meta.label}` : meta.label}
    </span>
  );
}

function getTaskMeta(status: number) {
  return TASK_STATUS_META[status] ?? TASK_STATUS_META[TaskStatus.OPEN];
}

function taskHeading(task: EscrowTask) {
  return `${getTaskMeta(task.status).label} Escrow`;
}

function taskIdentity(task: EscrowTask) {
  return `Escrow ID #${String(task.id).padStart(3, '0')}`;
}

function sumBigints(values: bigint[]) {
  return values.reduce((total, value) => total + value, 0n);
}

function formatTokenAmount(value: bigint) {
  const numeric = Number(formatEther(value));
  if (!Number.isFinite(numeric)) return `${formatEther(value)} 0G`;
  return `${numeric.toLocaleString('en-US', {
    maximumFractionDigits: numeric < 1 ? 4 : 2,
  })} 0G`;
}

function formatDeadline(deadline: bigint) {
  const seconds = Number(deadline);
  const delta = seconds - Math.floor(Date.now() / 1000);
  if (!Number.isFinite(delta)) return '-';
  if (delta <= 0) return 'Expired';

  const hours = Math.floor(delta / 3600);
  const minutes = Math.floor((delta % 3600) / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '-';
  const hours = Math.floor(seconds / 3600);
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  return `${hours}h`;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}
