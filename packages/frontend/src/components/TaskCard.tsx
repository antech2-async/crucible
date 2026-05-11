'use client';

import { Clock, ChevronRight, Target } from 'lucide-react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, TASK_ESCROW_ABI, TaskStatus } from '@crucible/shared';
import { Surface } from '@/components/ui';

const STATUS_MAP = [
  'OPEN',
  'ASSIGNED',
  'IN PIPELINE',
  'VERIFYING',
  'COMPLETED',
  'PARTIAL',
  'DISPUTED',
  'FAILED',
];

export default function TaskCard({ taskId, auditReport }: { taskId?: number; auditReport?: any }) {
  const { data: taskBasic } = useReadContract({
    address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
    abi: TASK_ESCROW_ABI,
    functionName: 'getTaskBasic',
    args: taskId !== undefined ? [BigInt(taskId)] : undefined,
    query: { enabled: taskId !== undefined },
  });

  if (taskId === undefined || !taskBasic) {
    return (
      <Surface level="container" className="p-5 animate-pulse">
        <div className="h-4 w-1/3 bg-surface-highest rounded mb-4" />
        <div className="h-10 w-full bg-surface-highest rounded mb-4" />
        <div className="h-8 w-full bg-surface-highest rounded" />
      </Surface>
    );
  }

  const basic = taskBasic as any[];
  const status = Number(basic[3]);
  const statusStr = STATUS_MAP[status] || 'UNKNOWN';
  const payment = `${ethers.formatEther(basic[1])} 0G`;
  const shortPoster = `${basic[0].slice(0, 6)}...${basic[0].slice(-4)}`;

  const deadlineMs = Number(basic[2]) * 1000;
  const isExpired = Date.now() > deadlineMs;
  const diff = Math.max(0, deadlineMs - Date.now());
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const timeStr = isExpired ? 'Expired' : `${hrs}h ${mins}m`;
  const proofHref = `/tasks?filter=${filterForStatus(status)}&task=${taskId}#tee-proof`;
  const failedReasons = getFailedAuditReasons(auditReport);
  const statusNote = getStatusNote(status, failedReasons);

  return (
    <Surface level="container" className="p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} className="text-primary/60" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-on-surface">
              Task #{taskId}
            </h3>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-dim">
            From {shortPoster}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-mono font-bold text-primary">{payment}</p>
          <div className="flex items-center justify-end gap-1 text-[9px] font-mono uppercase text-on-surface-dim">
            <Clock size={9} /> {timeStr}
          </div>
        </div>
      </div>

      {statusNote ? (
        <div
          className={`mb-4 border p-3 text-[10px] leading-relaxed ${
            status === TaskStatus.FAILED
              ? 'border-danger/20 bg-danger/10 text-danger'
              : 'border-border bg-surface/45 text-on-surface-muted'
          }`}
        >
          <p className="font-mono uppercase tracking-widest">{statusNote}</p>
        </div>
      ) : null}

      {auditReport && auditReport.results && auditReport.results.some((r: any) => !r.passed) && (
        <div className="bg-danger/10 border border-danger/20 p-3 mb-4 space-y-1.5">
          <p className="text-[9px] font-mono uppercase tracking-widest text-danger font-bold mb-1">
            Slashing Verdict
          </p>
          {auditReport.results
            .filter((r: any) => !r.passed)
            .map((r: any, i: number) => (
              <div key={i} className="text-[10px] font-mono text-on-surface leading-tight">
                Agent {shortAddress(r.agent)}:{' '}
                <span className="text-danger-muted">
                  {Array.isArray(r.reasons) ? r.reasons.join(', ') : 'Audit failed'}
                </span>
              </div>
            ))}
        </div>
      )}

      <Link
        href={proofHref}
        className="w-full py-2.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
      >
        View Full TEE Proof <ChevronRight size={12} />
      </Link>

      <div className="mt-3 flex items-center justify-center gap-2 pt-3 border-t border-border">
        {statusStr === 'VERIFYING' || statusStr === 'IN PIPELINE' ? (
          <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
        ) : (
          <div className="w-1.5 h-1.5 bg-secondary" />
        )}
        <span className="text-[9px] font-mono uppercase tracking-widest text-primary/70">
          Status: {statusStr}
        </span>
      </div>
      <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-widest text-on-surface-dim">
        Source: TaskEscrow + 0G Storage audit
      </p>
    </Surface>
  );
}

function filterForStatus(status: number) {
  if (status === TaskStatus.VERIFYING) return 'verifying';
  if (
    status === TaskStatus.COMPLETED ||
    status === TaskStatus.PARTIALLY_COMPLETED ||
    status === TaskStatus.DISPUTED ||
    status === TaskStatus.FAILED
  ) {
    return 'completed';
  }
  return 'open';
}

function getFailedAuditReasons(auditReport: any) {
  const results = Array.isArray(auditReport?.results) ? auditReport.results : [];
  return results
    .filter((result: any) => !result?.passed)
    .flatMap((result: any) => (Array.isArray(result?.reasons) ? result.reasons : []))
    .filter(Boolean);
}

function getStatusNote(status: number, failedReasons: string[]) {
  if (status === TaskStatus.FAILED) {
    return failedReasons[0]
      ? `Failed: ${failedReasons[0]}`
      : 'Failed: no passing proof trail recorded';
  }
  if (status === TaskStatus.VERIFYING) return 'Waiting for audit and slashing judge resolution';
  return null;
}

function shortAddress(address?: string) {
  if (!address) return '-';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
