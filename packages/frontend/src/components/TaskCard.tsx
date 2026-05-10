'use client';

import React, { useEffect, useState } from 'react';
import { Target, Clock, ShieldCheck, ChevronRight, Binary } from 'lucide-react';
import { Surface } from '@/components/ui';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, TASK_ESCROW_ABI } from '@crucible/shared';
import { ethers } from 'ethers';

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

  const [criteria, setCriteria] = useState<any[]>([]);

  useEffect(() => {
    if (taskBasic && (taskBasic as any)[5]) {
      try {
        const uri = (taskBasic as any)[5];
        if (uri.startsWith('ipfs://')) {
          const url = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
          fetch(url)
            .then((r) => r.json())
            .then((data) => {
              if (data.criteria) setCriteria(data.criteria);
            })
            .catch(() => {
              /* ignore */
            });
        } else {
          setCriteria([{ name: 'TEE Proof', value: 'Valid', passed: true }]);
        }
      } catch (e) {
        /* ignore */
      }
    }
  }, [taskBasic]);

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
  const statusStr = STATUS_MAP[Number(basic[3])] || 'UNKNOWN';
  const payment = ethers.formatEther(basic[1]) + ' 0G';
  const shortPoster = `${basic[0].slice(0, 6)}...${basic[0].slice(-4)}`;

  // Format deadline countdown
  const deadlineMs = Number(basic[2]) * 1000;
  const isExpired = Date.now() > deadlineMs;
  const diff = Math.max(0, deadlineMs - Date.now());
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const timeStr = isExpired ? 'Expired' : `${hrs}h ${mins}m`;

  const fallbackCriteria = [
    { name: 'TEE Proof', value: 'Valid', passed: true },
    { name: 'Word Count', value: '>= 500', passed: true },
  ];
  const displayCriteria = criteria.length > 0 ? criteria : fallbackCriteria;

  return (
    <Surface level="container" className="p-5">
      {/* Header */}
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


      {/* Audit Results / Slashing Reasons */}
      {auditReport && auditReport.results && auditReport.results.some((r: any) => !r.passed) && (
        <div className="bg-danger/10 border border-danger/20 p-3 mb-4 space-y-1.5">
          <p className="text-[9px] font-mono uppercase tracking-widest text-danger font-bold mb-1">
            🚨 Slashing Verdict
          </p>
          {auditReport.results.filter((r: any) => !r.passed).map((r: any, i: number) => (
            <div key={i} className="text-[10px] font-mono text-on-surface leading-tight">
              Agent {r.agent.slice(0, 6)}: <span className="text-danger-muted">{r.reasons.join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <button className="w-full py-2.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        View Full TEE Proof <ChevronRight size={12} />
      </button>

      {/* Status */}
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
    </Surface>
  );
}
